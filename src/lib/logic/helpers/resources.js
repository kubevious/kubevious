const _ = require("the-lodash");

module.exports.METRICS = ['cpu', 'memory'];

module.exports.parseCpu = function (value) {
    value = value.toString();
    value = _.trim(value, "\'\"");
    if (_.endsWith(value, 'm'))
    {
        value = value.substring(0, value.length - 1);
        value = parseFloat(value);
        value = value / 1000;
    }
    else
    {
        value = parseFloat(value);
    }
    return value;
}

const MEMORY_MULTIPLIER = {
    'K': Math.pow(1000, 1),
    'M': Math.pow(1000, 2),
    'G': Math.pow(1000, 3),
    'T': Math.pow(1000, 4),
    'P': Math.pow(1000, 5),
    'E': Math.pow(1000, 6),
    'Ki': Math.pow(1024, 1),
    'Mi': Math.pow(1024, 2),
    'Gi': Math.pow(1024, 3),
    'Ti': Math.pow(1024, 4),
    'Pi': Math.pow(1024, 5),
    'Ei': Math.pow(1024, 6),
}
module.exports.parseMemory = function (value) {
    var unit = value.slice(-1);
    if (unit == 'i') {
        unit = value.slice(-2);
        value = value.substring(0, value.length - 2);
    } else {
        value = value.substring(0, value.length - 1);
    }
    value = parseFloat(value);
    if (MEMORY_MULTIPLIER[unit]) {
        value = value * MEMORY_MULTIPLIER[unit];
    }
    value = Math.floor(value);
    return value;
}

module.exports.getParser = function (metric) {
    if (metric == 'cpu') {
        return module.exports.parseCpu;
    }
    if (metric == 'memory') {
        return module.exports.parseMemory;
    }
    return (value) => { return value; };
}

module.exports.parse = function (metric, value) {
    var parser = module.exports.getParser(metric);
    return parser(value);
}

module.exports.stringifyCpu = function (value) {
    return module.exports.percentage(value);
}

module.exports.percentage = function (value) {
    return Number.parseFloat(value * 100).toFixed(2) + "%";
}

module.exports.precise = function (value) {
    return Number.parseFloat(value).toPrecision(2);
}

const MEMORY_SIZES = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
module.exports.stringifyMemory = function (value, decimals = 2) {
    if (value === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const i = Math.floor(Math.log(value) / Math.log(k));
    return parseFloat((value / Math.pow(k, i)).toFixed(dm)) + ' ' + MEMORY_SIZES[i];
}

module.exports.getStringifier = function (metric) {
    if (metric == 'cpu') {
        return module.exports.stringifyCpu;
    }
    if (metric == 'memory') {
        return module.exports.stringifyMemory;
    }
    return (value) => { return value; };
}

module.exports.stringify = function (metric, value) {
    var stringifier = module.exports.getStringifier(metric);
    return stringifier(value);
}