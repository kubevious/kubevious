const _ = require('lodash');

class HierarchyAlertCountProcessor
{
    constructor(logger, state)
    {
        this._logger = logger.sublogger("AlertCountProcessor");
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
        node.alertCount = _.clone(node.selfAlertCount);

        var childrenDns = this._state.getChildrenDns(dn);
        for(var childDn of childrenDns)
        {
            this._processNode(childDn);

            var childNode = this._state.editableNode(childDn);
            
            for(var severity of _.keys(childNode.alertCount))
            {
                if (!node.alertCount[severity]) {
                    node.alertCount[severity] = childNode.alertCount[severity];
                } else {
                    node.alertCount[severity] += childNode.alertCount[severity];
                }
            }

        }
    }

}

module.exports = HierarchyAlertCountProcessor;