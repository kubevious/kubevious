const moment = require('moment');
const _ = require('the-lodash');

module.exports.diffSeconds = function (a, b)
{
    var momentA = moment(a);
    var momentB = moment(b);
    var duration = moment.duration(momentA.diff(momentB));
    return duration.asSeconds();
}

module.exports.diffFromNowSeconds = function (a)
{
    return module.exports.diffSeconds(new Date(), a);
}

module.exports.toMysqlFormat = function (date)
{
    date = module.exports.makeDate(date);
    return date.getUTCFullYear() + "-" + 
        twoDigits(1 + date.getUTCMonth()) + "-" + 
        twoDigits(date.getUTCDate()) + " " + 
        twoDigits(date.getUTCHours()) + ":" + 
        twoDigits(date.getUTCMinutes()) + ":" + 
        twoDigits(date.getUTCSeconds());
};

module.exports.makeDate = function (date)
{
    if (_.isString(date)) {
        date = new Date(date);
    }
    return date;
};

function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}
