// Paste the function body into an MCP argument's Calculated editor.
function calculateValue(value, variables, eventData) {
    return Math.max(0, Math.min(1, value / 100));
}

module.exports = {calculateValue};
if (require.main === module) {
    for (const value of [0, 25, 50, 100]) {
        console.log(JSON.stringify({eventData:{value},argument:calculateValue(value, {}, {value})}));
    }
}
