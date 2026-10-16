import test from 'node:test';
import assert from 'node:assert/strict';
import {drawDokuma,dokumaBodyPose,dokumaBounds} from '../dist/src/dokuma.js';
test('close boss draws complete atlas cells, with no static body or cropped fist underneath',()=>{
 const original=Array.from({length:4},()=>({width:512,height:512})),punch=Array.from({length:6},()=>({width:512,height:512}));
 const calls=[],ctx={save(){},restore(){},drawImage(...args){calls.push(args);}};
 const b={active:true,phase:2,left:0,floor:640,age:1.3,fistStart:0,fistWindup:1.25,fistTargetX:400,state:'recover',hazards:[],drones:[]};
 drawDokuma(ctx,b,original,false,[],punch);assert.equal(calls.length,1);assert.equal(calls[0][0],punch[4]);assert.equal(calls[0].length,5);
 const pose=dokumaBodyPose(b);assert.equal(dokumaBounds(b).x,pose.x+pose.size*.65-110);
 calls.length=0;b.age=3;drawDokuma(ctx,b,original,false,[],punch);assert.equal(calls.length,1);assert.equal(calls[0][0],punch[0]);
 calls.length=0;b.dead=true;drawDokuma(ctx,b,original,false,[],punch);assert.equal(calls.length,0);
});
