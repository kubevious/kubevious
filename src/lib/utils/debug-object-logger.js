const _ = require('the-lodash');

class DebugObjectLogger
{
    constructor(context)
    {
        this._logger = context.logger;
    }

    dump(name, iteration, obj)
    {
        if (!process.env.LOG_TO_FILE) {
            return;
        }

        if (!obj) {
            return;
        }

        var writer = this._logger.outputStream(name + iteration + ".json");
        if (writer) {
            writer.write(_.cloneDeep(obj));
            writer.close();
        }
    }
}

module.exports = DebugObjectLogger;