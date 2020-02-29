const _ = require('the-lodash');

module.exports.makeKey = function(item) {

    if (!item.dn) {
        throw new Error("MISSING DN");
    }
    if (!item.kind) {
        throw new Error("MISSING kind");
    }
    if (!item['config-kind']) {
        throw new Error("MISSING config-kind");
    }

    var parts = [
        item.dn,
        item.kind,
        item['config-kind']
    ]
    if (item.name) {
        parts.push(item.name);
    }

    return parts.join('-');
}