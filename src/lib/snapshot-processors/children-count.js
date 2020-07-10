const _ = require('lodash');


module.exports = {
    order: 230,

    handler: ({logger, state}) => {

        for(var dn of state.getNodeDns())
        {
            processNode(dn);
        }

        /************/

        function processNode(dn)
        {
            var node = state.editableNode(dn);
            var childrenDns = state.getChildrenDns(dn);
            node.childrenCount = childrenDns.length;
        }
    }
}