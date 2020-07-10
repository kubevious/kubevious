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
            var assets = state.getAssets(dn);
            for(var alert of assets.alerts)
            {
                alert.source = {
                    kind: 'parser'
                };
            }
        }
    }
}
