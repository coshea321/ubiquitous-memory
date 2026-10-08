// Ranks generator output, prunes the best N and prints them: cat out.jsonl | node tools/pick.js 12 > picked.jsonl
const prune=require('./prune.js');const {solve}=require('./lib.js');
const a=require('fs').readFileSync(0,'utf8').trim().split('\n').map(JSON.parse);
a.sort((x,y)=>(y.shots*2+y.par/3+Math.log(y.states))-(x.shots*2+x.par/3+Math.log(x.states)));
const seen=new Set();const out=[];
for(const l of a){const k=l.rows.join('');if(seen.has(k))continue;seen.add(k);if(out.length>=+process.argv[2])break;
  const p=prune(l.rows,l.par);const r=solve(p.rows,2e6);
  const shots=[...r.path].filter(c=>c==='F').length;
  out.push({rows:p.rows,par:r.par,states:r.states,shots,path:r.path});
  console.log(JSON.stringify(out[out.length-1]));}
