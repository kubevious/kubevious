const moment = require('moment');

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