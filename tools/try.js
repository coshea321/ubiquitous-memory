// Solve candidate levels from a scratch file: node tools/try.js ./scratch.js [nameFilter]
// scratch.js exports [{name, rows:[...]}, ...]
const path=require('path');const {solve}=require('./lib.js');
const L=require(path.resolve(process.argv[2]));
for(const l of L){if(process.argv[3]&&!l.name.includes(process.argv[3]))continue;
  if(l.rows.some(r=>r.length!==l.rows[0].length)){console.log('RAGGED',l.name);continue;}
  const r=solve(l.rows);console.log(l.name.padEnd(18),r.par?('par '+r.par+' states '+r.states+' '+r.path):JSON.stringify(r));}
