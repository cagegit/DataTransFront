'use strict';

let dim = [1, 2, 3];
let total = 0;

function add(){
  dim.forEach(e=>{
    total += e;
  });
  console.log(total);
}

setTimeout(()=>{
  add();
}, 1000);

console.log('#####');
