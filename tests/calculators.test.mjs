import test from 'node:test';
import assert from 'node:assert/strict';
import {commission,savings} from '../lib/calculators.mjs';
test('OTA cost and retained revenue match the published example',()=>{assert.deepEqual(commission(10000,15),{monthly:1500,annual:18000,retained:8500});});
test('zero revenue and commission boundaries',()=>{assert.deepEqual(commission(0,15),{monthly:0,annual:0,retained:0});assert.equal(commission(10000,0).retained,10000);assert.equal(commission(10000,100).retained,0);});
test('direct savings use the incremental shift, not all direct revenue',()=>{assert.deepEqual(savings(10000,70,15,50),{currentDirect:30,shifted:20,annual:3600});});
test('a target below current direct share cannot create negative savings',()=>{assert.equal(savings(10000,20,15,40).annual,0);assert.equal(savings(10000,70,15,30).annual,0);});
test('all OTA revenue can shift direct, but no more',()=>{assert.equal(savings(10000,100,15,100).annual,18000);assert.equal(savings(10000,0,15,100).annual,0);});
