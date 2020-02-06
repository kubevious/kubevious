const Promise = require('the-promise');
const _ = require('lodash');

class EventDampener {

    constructor(logger)
    {
        this._logger = logger;
        this._handlers = [];
        this._isTriggered = false;
    }

    on(cb) {
        this._handlers.push(cb);
        this._processCb(cb);
    }

    trigger() {
        if (this._isTriggered) {
            return;
        }
        this._isTriggered = true;
        this._runNext(() => {
            this._isTriggered = false;
            return Promise.parallel(this._handlers, cb => {
                return this._processCb(cb);
            })
            .catch(reason => {
                this._logger.error("[_triggerChanged]", reason);
            });
        });
    }

    _runNext(cb)
    {
        //process.nextTick(cb)
        Promise.timeout(5000)
            .then(() => cb());
    }

    _processCb(cb) {
        var res = cb();
        return Promise.resolve(res);
    }
}

module.exports = EventDampener;