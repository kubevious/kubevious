const _ = require('lodash');

module.exports = {
    order: 220,

    handler: ({logger, state}) => {

        for(var dn of state.getNodeDns())
        {
            processNode(dn);
        }

        /************/

        function processNode(dn)
        {
            var node = state.editableNode(dn);
            node.alertCount = _.clone(node.selfAlertCount);
    
            var childrenDns = state.getChildrenDns(dn);
            for(var childDn of childrenDns)
            {
                processNode(childDn);
    
                var childNode = state.editableNode(childDn);
                
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
}
