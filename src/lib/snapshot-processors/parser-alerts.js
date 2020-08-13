module.exports = {
    order: 10,

    handler: ({logger, state}) => {

        for(var dn of state.getNodeDns())
        {
            processNode(dn);
        }

        /************/

        function processNode(dn)
        {
            var alerts = state.getAlerts(dn);
            for(var alert of alerts)
            {
                alert.source = {
                    kind: 'parser'
                };
            }
        }
    }
}
