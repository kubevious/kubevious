const _ = require("the-lodash");

module.exports = {
    target: {
        api: "extensions",
        kind: "Ingress"
    },

    order: 50,

    handler: ({scope, item, logger}) =>
    {
        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);

        var rawConfigMaps = scope.fetchRawContainer(item, "Ingresses");
        createIngress(rawConfigMaps);

        var defaultBackend = _.get(item.config, "spec.backend");
        if (defaultBackend) {
            processIngressBackend(defaultBackend);
        }

        var rulesConfig = _.get(item.config, "spec.rules");
        for(var ruleConfig of rulesConfig)
        {
            var host = ruleConfig.host;
            if (!host) {
                host = null;
            }
            if (ruleConfig.http && ruleConfig.http.paths) {
                for(var pathConfig of ruleConfig.http.paths) {
                    if (pathConfig.backend) {
                        processIngressBackend(pathConfig.backend);
                    }
                }
            }
        }

        /*** HELPERS ***/
        function processIngressBackend(backendConfig)
        {
            if (!backendConfig.serviceName) {
                return;
            }

            var serviceScopeInfo = namespaceScope.services[backendConfig.serviceName];
            if (serviceScopeInfo) {

                for(var serviceItem of serviceScopeInfo.items) {
                    createIngress(serviceItem);
                }

                if (serviceScopeInfo.microserviceName) {
                    var svcItem = scope.findAppItem(item.config.metadata.namespace, serviceScopeInfo.microserviceName);
                    createIngress(svcItem, { order: 250 });
                }
            }
        }

        function createIngress(parent, params)
        {
            params = params || {};
            var k8sIngress = parent.fetchByNaming("ingress", item.config.metadata.name);
            scope.setK8sConfig(k8sIngress, item.config);
            if (params.order) {
                k8sIngress.order = params.order;
            }
            return k8sIngress;
        }
    }
}