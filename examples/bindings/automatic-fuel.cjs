// Paste this function body into a control text calculation and leave the trigger empty.
function calculateValue(value, variables, resources) {
    return variables["fuel_x_100_liters"]
         + variables["fuel_x_10_liters"]
         + variables["fuel_1_liter"];
}

module.exports = {calculateValue};
if (require.main === module) {
    const variables={fuel_x_100_liters:100,fuel_x_10_liters:20,fuel_1_liter:3};
    console.log(calculateValue(undefined,variables,{}));
}
