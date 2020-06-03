const _ = require('lodash');

class ChildrenCountProcessor
{
    constructor(logger, state)
    {
        this._logger = logger.sublogger("ChildrenCountProcessor");
        this._state = state;
    }

    get logger() {
        return this._logger;
    }

    execute()
    {
        this._logger.info("[execute] date: %s, count: %s", 
            this._state.date.toISOString(), 
            this._state.getCount())

        for(var dn of this._state.getNodeDns())
        {
            this._processNode(dn);
        }
    }

    _processNode(dn)
    {
        var node = this._state.editableNode(dn);
        var childrenDns = this._state.getChildrenDns(dn);
        node.childrenCount = childrenDns.length;
    }

}

module.exports = ChildrenCountProcessor;