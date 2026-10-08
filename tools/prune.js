// Removes objects that do not make a level easier (keeps par >= original). Used by pick.js.
const {solve}=require('./lib.js');
// remove clutter that doesn't make the level easier
module.exports=function prune(rows,par){
  rows=rows.slice();let changed=true;
  while(changed){changed=false;
    for(let y=1;y<rows.length-1;y++)for(let x=1;x<rows[0].length-1;x++){
      const c=rows[y][x];if('.TF'.includes(c))continue;
      for(const rep of (c==='#'?[]:['.'])){
        const t=rows.slice();t[y]=t[y].slice(0,x)+rep+t[y].slice(x+1);
        const r=solve(t,6e5);
        if(r.par&&r.par>=par){rows=t;par=r.par;changed=true;break;}
      }
    }
  }
  return {rows,par};
};
