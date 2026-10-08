// Hill-climbs a level towards a higher par. Produced sectors 29–33 (seeded from 21–28, then decluttered with prune.js).
// node tools/climb.js <seed> <iterations> '<rows JSON>' out.json   (writes the best level so far to out.json on every improvement)
const fs=require('fs');const {E,solve}=require('./lib.js');
let seed=+process.argv[2]>>>0;const rnd=()=>{seed=(seed+0x6D2B79F5)>>>0;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
const iters=+process.argv[3],out=process.argv[5];let rows=JSON.parse(process.argv[4]);
const POOL='##########~~~~~BBBBbbb1234567^>v<GGii..........';
const score=r=>r.par?r.par+2*Math.log(r.states):-1;  // longer solutions first, bigger search space breaks ties
const set=(R,x,y,c)=>{R=R.slice();R[y]=R[y].slice(0,x)+c+R[y].slice(x+1);return R;};
let cur=solve(rows,5e5),best=score(cur);
for(let i=0;i<iters;i++){
  let t=rows;
  for(let k=ri(1,2);k--;){const x=ri(1,t[0].length-2),y=ri(1,t.length-2),c=t[y][x];
    if(c==='T'||c==='F'){const x2=ri(1,t[0].length-2),y2=ri(1,t.length-2);if(t[y2][x2]!=='T'&&t[y2][x2]!=='F')t=set(set(t,x2,y2,c),x,y,'.');}
    else t=set(t,x,y,rnd()<.35?'.':POOL[ri(0,POOL.length-1)]);}
  const s0=E.parseLevel(t);E.checkAT(s0,null);if(s0.dead)continue;
  const r=solve(t,5e5),sc=score(r);
  if(sc>=best){rows=t;best=sc;cur=r;fs.writeFileSync(out,JSON.stringify({rows,par:cur.par,states:cur.states,path:cur.path})+'\n');}
  if(i%25===0)console.error(i,'par',cur.par,'states',cur.states);
}
