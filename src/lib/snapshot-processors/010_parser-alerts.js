module.exports = {
    order: 10,

    handler: ({logger, state}) => {

        state.traverseNodes((dn, node) => {

            var alerts = state.getAlerts(dn);
            for(var alert of alerts)
            {
                alert.source = {
                    kind: 'parser'
                };
            }

        })

    }
}
