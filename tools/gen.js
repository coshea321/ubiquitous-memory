// Random level generator. Prints one JSON candidate per line: node tools/gen.js <seed> <count> <mix|at|ice> > out.jsonl
const {E,solve}=require('./lib.js');
let seed=(+process.argv[2]||1)>>>0;const rnd=()=>{seed=(seed+0x6D2B79F5)>>>0;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
const N=+process.argv[3]||200, theme=process.argv[4]||'mix';
function gen(){
  const w=ri(9,13),h=ri(7,10),g=[];
  for(let y=0;y<h;y++){g.push([]);for(let x=0;x<w;x++)g[y].push(x==0||y==0||x==w-1||y==h-1?'#':'.');}
  const free=()=>{for(let t=0;t<200;t++){const x=ri(1,w-2),y=ri(1,h-2);if(g[y][x]==='.')return [x,y];}return null;};
  const seg=(ch,lo,hi)=>{const p=free();if(!p)return;const d=ri(0,1),L=ri(lo,hi);for(let k=0;k<L;k++){const x=p[0]+(d?k:0),y=p[1]+(d?0:k);if(x>0&&y>0&&x<w-1&&y<h-1&&g[y][x]==='.')g[y][x]=ch;}};
  for(let k=ri(3,7);k--;)seg('#',2,5);
  const wat=theme==='ice'?0:ri(0,3);for(let k=wat;k--;)seg('~',2,5);
  if(theme==='ice')for(let k=ri(2,4);k--;)seg('i',3,7);
  const put=(ch,n)=>{for(let k=0;k<n;k++){const p=free();if(p)g[p[1]][p[0]]=typeof ch==='function'?ch():ch;}};
  put('T',1);put('F',1);
  put('B',ri(0,3));put(()=>'1234'[ri(0,3)],ri(0,3));put(()=>'5678'[ri(0,3)],ri(0,1));
  put(()=>'^>v<'[ri(0,3)],ri(theme==='at'?1:0,2));put('b',ri(0,2));put('G',ri(0,1));
  if(theme==='mix'&&rnd()<.3){put('X',1);put('X',1);}
  return g.map(r=>r.join(''));
}
function walkable(rows){ // can tank reach F ignoring guns, without shooting?
  const s=E.parseLevel(rows),seen=new Set([s.ty*s.w+s.tx]),q=[s.ty*s.w+s.tx];
  while(q.length){const i=q.pop();if(s.ter[i]==='F')return true;for(let d=0;d<4;d++){const x=i%s.w+E.DX[d],y=((i/s.w)|0)+E.DY[d],j=y*s.w+x;if(seen.has(j)||s.obj[j]||s.ter[j]==='~')continue;seen.add(j);q.push(j);}}
  return false;
}
const out=[];
for(let n=0;n<N;n++){
  const rows=gen();if(!rows.join('').includes('T')||!rows.join('').includes('F'))continue;
  if(walkable(rows))continue;
  const s=E.parseLevel(rows);E.checkAT(s,null);if(s.dead)continue;
  const r=solve(rows,4e5);if(!r.par||r.par<16)continue;
  const shots=[...r.path].filter(c=>c==='F').length;if(shots<4)continue;
  console.log(JSON.stringify({rows,par:r.par,states:r.states,shots,path:r.path}));
}

