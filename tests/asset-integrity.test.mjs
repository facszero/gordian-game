import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
test('every shipped WebP has a complete RIFF container and intact chunk boundaries',()=>{
 for(const name of readdirSync('dist/assets').filter(n=>n.endsWith('.webp'))){
  const b=readFileSync('dist/assets/'+name);
  assert.equal(b.toString('ascii',0,4),'RIFF',name);assert.equal(b.toString('ascii',8,12),'WEBP',name);
  assert.equal(b.readUInt32LE(4)+8,b.length,`${name}: truncated or extra bytes`);
  let offset=12;while(offset<b.length){assert.ok(offset+8<=b.length,name);const size=b.readUInt32LE(offset+4);offset+=8+size+(size%2);assert.ok(offset<=b.length,`${name}: incomplete chunk`);}assert.equal(offset,b.length,name);
 }
});
