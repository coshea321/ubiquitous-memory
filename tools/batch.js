// One command for a batch of new extra-hard levels, from scratch:
//   node tools/batch.js <count> [seed] [minPar] [climbIters]      e.g. node tools/batch.js 10 7
// Each round: gen.js makes random layouts (one process per CPU) -> the most promising are hill-climbed with
// climb.js -> pruned -> kept only if par >= minPar (default 100) and no existing level (or one already kept)
// is within 20 squares of it, under any rotation or mirror. Kept levels get a fresh name, the extra-hard tip,
// and go into src/levels.js straight away, with sectors 29+ re-sorted by par. Rounds repeat until <count> are kept.
// Roughly 8 levels per hour on 4 CPUs. Afterwards: npm run build && npm run check, then /release.
// Quick plumbing test (minutes, junk levels; revert src/levels.js after): BATCH_GEN=600 node tools/batch.js 2 5 20 3
const fs=require('fs'),path=require('path'),os=require('os'),{spawn}=require('child_process');
const T=path.join(__dirname),SRC=path.join(T,'..','src','levels.js');
if(process.argv[2]==='--prune'){ // worker mode: node tools/batch.js --prune in.json out.json
  const r=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));const p=require('./prune.js')(r.rows,r.par);
  fs.writeFileSync(process.argv[4],JSON.stringify(p));return;
}
const {solve}=require('./lib.js');
const COUNT=+process.argv[2],SEED=+process.argv[3]||1,MINPAR=+process.argv[4]||100,ITERS=+process.argv[5]||260;
if(!(COUNT>0)){console.error('usage: node tools/batch.js <count> [seed] [minPar] [climbIters]');process.exit(1);}
const CPUS=Math.max(1,os.cpus().length),TIER=28,MINDIFF=20;
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'batch-'));
const run=(args,out)=>new Promise((ok,fail)=>{const c=spawn(process.execPath,args,{stdio:['ignore',out?fs.openSync(out,'w'):'ignore','ignore']});
  c.on('exit',code=>code?fail(new Error(args.join(' ')+' exited '+code)):ok());});
async function pool(jobs){const q=jobs.slice();await Promise.all(Array.from({length:CPUS},async()=>{while(q.length)await q.shift()();}));}
// Levels file: keep the one-level-per-line format.
function readLevels(){const s=fs.readFileSync(SRC,'utf8'),a=s.indexOf('['),b=s.indexOf('];\nconst ORIG_NAMES');
  return {pre:s.slice(0,a),post:s.slice(b+1),levels:JSON.parse(s.slice(a,b+1))};}
function writeLevels(f){const head=f.levels.slice(0,TIER),tail=f.levels.slice(TIER).map(l=>({l,par:solve(l.rows).par}));
  tail.sort((x,y)=>x.par-y.par);
  fs.writeFileSync(SRC,f.pre+'['+[...head,...tail.map(t=>t.l)].map(l=>JSON.stringify(l)).join(',\n')+']'+f.post);}
// Distance: squares that differ, minimised over the 8 rotations/mirrors; boards of other shapes count as unrelated.
const grid=r=>r.map(x=>x.split(''));
const syms=g=>{const out=[],rot=a=>a[0].map((_,x)=>a.map(row=>row[x]).reverse());let a=g;
  for(let k=0;k<4;k++){out.push(a,a.map(row=>row.slice().reverse()));a=rot(a);}return out;};
function dist(a,b){let m=Infinity;const B=grid(b);
  for(const A of syms(grid(a))){if(A.length!==B.length||A[0].length!==B[0].length)continue;
    let d=0;for(let y=0;y<A.length;y++)for(let x=0;x<A[0].length;x++)if(A[y][x]!==B[y][x])d++;m=Math.min(m,d);}
  return m;}
// Names: two-word, seeded, never reused.
const ADJ='Iron Salt Ash Red Black Cold Long Low High Dead Rust Stone Grey Broken Silent Burnt Hollow Bitter Sunken North South East West Lone Twin Deep Dry Copper Flint Pale'.split(' ');
const NOUN='Gate Ridge Ford Yard Spur Line Bank Pass Point Depot Trench Basin Mill Works Quay Weir Sound Field Reach Lock Rampart Bastion Causeway Gully Shelf Bluff Bend Sluice Battery Redoubt'.split(' ');
let ns=SEED>>>0;const rnd=()=>{ns=(ns+0x6D2B79F5)>>>0;let t=ns;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
function name(used){for(;;){const a=ADJ[Math.floor(rnd()*ADJ.length)],n=NOUN[Math.floor(rnd()*NOUN.length)],s=a+' '+n;
  if(a!==n&&!used.has(s)&&![...used].some(u=>u.split(' ').includes(a)&&u.split(' ').includes(n)))return s;}}

(async()=>{
  const f=readLevels(),tip=f.levels[TIER].tip,kept=[];let round=0;
  console.error(`Batch: ${COUNT} levels, par >= ${MINPAR}, ${CPUS} CPUs, seed ${SEED}. Work files in ${tmp}`);
  while(kept.length<COUNT){
    const r0=SEED*1000+round*CPUS,themes=['mix','at','mix','ice'];round++;
    console.error(`Round ${round}: generating layouts...`);
    await pool(Array.from({length:CPUS},(_,i)=>()=>run([path.join(T,'gen.js'),String(r0+i),process.env.BATCH_GEN||'20000',themes[i%4]],path.join(tmp,`g${r0+i}.jsonl`))));
    const cands=[];for(let i=0;i<CPUS;i++)for(const line of fs.readFileSync(path.join(tmp,`g${r0+i}.jsonl`),'utf8').split('\n'))if(line)cands.push(JSON.parse(line));
    cands.sort((x,y)=>(y.shots*2+y.par/3+Math.log(y.states))-(x.shots*2+x.par/3+Math.log(x.states)));
    const seeds=[];for(const c of cands){if(seeds.length>=CPUS*2)break;
      if([...f.levels,...seeds].every(l=>dist(c.rows,l.rows)>=MINDIFF))seeds.push(c);}
    console.error(`Round ${round}: climbing ${seeds.length} of ${cands.length} candidates (${ITERS} steps each)...`);
    await pool(seeds.map((c,i)=>()=>run([path.join(T,'climb.js'),String(r0*7+i),String(ITERS),JSON.stringify(c.rows),path.join(tmp,`c${r0}-${i}.json`)])));
    await pool(seeds.map((c,i)=>()=>fs.existsSync(path.join(tmp,`c${r0}-${i}.json`))?run([__filename,'--prune',path.join(tmp,`c${r0}-${i}.json`),path.join(tmp,`p${r0}-${i}.json`)]):Promise.resolve()));
    const done=seeds.map((c,i)=>path.join(tmp,`p${r0}-${i}.json`)).filter(p=>fs.existsSync(p)).map(p=>JSON.parse(fs.readFileSync(p,'utf8')));
    done.sort((x,y)=>y.par-x.par);
    for(const d of done){
      if(kept.length>=COUNT)break;
      const why=d.par<MINPAR?'par '+d.par+' < '+MINPAR:f.levels.find(l=>dist(d.rows,l.rows)<MINDIFF)?.name;
      if(why){console.error(`  rejected (${why==='par '+d.par+' < '+MINPAR?why:'too close to '+why})`);continue;}
      const L={name:name(new Set(f.levels.map(l=>l.name))),tip,rows:d.rows};f.levels.push(L);kept.push({...L,par:d.par});
      console.error(`  kept ${L.name} (par ${d.par})`);
    }
    writeLevels(f);  // saved after every round, so a stopped run keeps what it found
  }
  fs.rmSync(tmp,{recursive:true,force:true});
  console.log('Added '+kept.length+' levels to src/levels.js: '+kept.map(k=>k.name+' '+k.par).join(', '));
  console.log('Next: npm run build && npm run check, then /release.');
})().catch(e=>{console.error(e);process.exit(1);});
