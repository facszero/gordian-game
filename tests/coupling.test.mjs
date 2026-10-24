import test from 'node:test';
import assert from 'node:assert/strict';
import {couplingState,COUPLING_DURATION} from '../dist/src/coupling.js';

test('coupling completes limb closure before lowering arms and turning right',()=>{
 const times=[0,3.3,4.1,4.9,5.7,6.5,7.2,7.9,8.4,8.9,9.4];
 assert.deepEqual(times.map(t=>couplingState(t).pose),[0,1,2,3,4,5,6,7,8,9,10]);
 assert.equal(couplingState(3).entry,1);
 assert.equal(couplingState(4.1).label,'SELLANDO PIERNAS');
 assert.equal(couplingState(4.9).label,'SELLANDO BRAZOS');
 assert.equal(couplingState(5.7).label,'CERRANDO TORSO Y CASCO');
 assert.equal(couplingState(COUPLING_DURATION).fade,1);
});
