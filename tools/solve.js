// Solve every level (or those whose name contains argv[2]). Prints par + shortest solution.
// Exit code 1 if any level is unsolvable or ragged. Used by build.js to compute PAR.
const {solve,LEVELS}=require('./lib.js');
function solveAll(filter,quiet){
  let bad=false;const par=[];
  for(const L of LEVELS){
    if(filter&&!L.name.toLowerCase().includes(filter.toLowerCase()))continue;
    if(L.rows.some(r=>r.length!==L.rows[0].length)){console.log('RAGGED',L.name);bad=true;par.push(0);continue;}
    const t=Date.now(),r=solve(L.rows);
    if(!quiet)console.log(L.name.padEnd(18),r.par?('par '+String(r.par).padStart(3)+'  '+r.path):JSON.stringify(r),(Date.now()-t)+'ms');
    if(!r.par)bad=true;par.push(r.par||0);
  }
  return {par,bad};
}
module.exports=solveAll;
if(require.main===module){const {bad}=solveAll(process.argv[2]);process.exit(bad?1:0);}
