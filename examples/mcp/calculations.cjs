// Paste the function body into an MCP argument's Calculated editor.
function calculateValue(value, variables, eventData) {
    return Math.max(0, Math.min(1, value / 100));
}

// The field reference can be inserted using the Server variables browser.
function calculateFromVariables(value, variables, eventData) {
    return Math.max(0, Math.min(1, variables["light_status"]["brightness"] / 100));
}

// Boolean arguments return a Boolean directly, without quotes or JSON.stringify.
function calculateEnabled(value, variables, eventData) {
    return true;
}

module.exports = {calculateValue,calculateFromVariables,calculateEnabled};
if (require.main === module) {
    console.log(JSON.stringify({argument:calculateEnabled(null,{},{}),type:'boolean'}));
    console.log(JSON.stringify({variables:{light_status:{brightness:65}},argument:calculateFromVariables(null,{light_status:{brightness:65}}, {})}));
    for (const value of [0, 25, 50, 100]) {
        console.log(JSON.stringify({eventData:{value},argument:calculateValue(value, {}, {value})}));
    }
}
