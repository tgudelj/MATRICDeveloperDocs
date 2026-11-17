const test=require('node:test');
const assert=require('node:assert/strict');
const {calculateValue}=require('../examples/bindings/automatic-fuel.cjs');
test('fuel calculation uses all three inputs without a trigger',()=>{
    const variables={fuel_x_100_liters:100,fuel_x_10_liters:20,fuel_1_liter:3};
    assert.equal(calculateValue(undefined,variables,{}),123);
    for(const name of Object.keys(variables)){variables[name]++;assert.equal(calculateValue(undefined,variables,{}),Object.values(variables).reduce((a,b)=>a+b));}
});
