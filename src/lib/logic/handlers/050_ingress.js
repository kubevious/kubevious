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
        var k8sIngress = rawConfigMaps.fetchByNaming("ingress", item.config.metadata.name);
        scope.setK8sConfig(k8sIngress, item.config);

        var _processIngressBackend = (backendConfig) => {
            logger.info("[_processIngress]", backendConfig)
            if (!backendConfig.serviceName) {
                return;
            }

            var serviceScopeInfo = namespaceScope.services[backendConfig.serviceName];
            if (serviceScopeInfo) {

                for(var serviceItem of serviceScopeInfo.items) {
                    var nestedIngress = serviceItem.fetchByNaming("ingress", item.config.metadata.name);
                    scope.setK8sConfig(nestedIngress, item.config);
                }

                if (serviceScopeInfo.microserviceName) {
                    var svcItem = scope.findAppItem(item.config.metadata.namespace, serviceScopeInfo.microserviceName);
                    var svcItemIngress = svcItem.fetchByNaming("ingress", item.config.metadata.name);
                    scope.setK8sConfig(svcItemIngress, item.config);
                    svcItemIngress.order = 250;
                }
            }
        }

        var defaultBackend = _.get(item.config, "spec.backend");
        if (defaultBackend) {
            _processIngressBackend(defaultBackend);
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
                        _processIngressBackend(pathConfig.backend);
                    }
                }
            }
        }
    }
}