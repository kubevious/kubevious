const _ = require('the-lodash');

module.exports.makeKey = function(item) {
    if (!item.dn) {
        throw new Error("MISSING DN");
    }
    if (!item.info) {
        throw new Error("MISSING INFO");
    }

    return item.dn + '-' + _.stableStringify(item.info);
}