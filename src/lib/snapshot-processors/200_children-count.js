const _ = require('lodash');


module.exports = {
    order: 200,

    handler: ({logger, state}) => {


        state.traverseNodes((dn, node) => {

            var childrenDns = state.getChildrenDns(dn);
            node.childrenCount = childrenDns.length;

        })

    }
}