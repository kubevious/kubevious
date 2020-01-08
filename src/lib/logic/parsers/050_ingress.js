const _ = require("the-lodash");

module.exports = {
    target: {
        api: "extensions",
        kind: "Ingress"
    },

    kind: 'ingress',

    order: 50,

    handler: ({scope, item, createK8sItem, createAlert, hasCreatedItems}) =>
    {
        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);

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

        if (!hasCreatedItems()) {
            var rawContainer = scope.fetchRawContainer(item, "Ingresses");
            createIngress(rawContainer);
            createAlert('Missing', 'error', null, 'Could not match Ingress to Services.');
        }

        /*** HELPERS ***/
        function processIngressBackend(backendConfig)
        {
            if (!backendConfig.serviceName) {
                return;
            }

            var serviceScopeInfo = namespaceScope.services[backendConfig.serviceName];
            if (serviceScopeInfo) {

                for(var appName of _.keys(serviceScopeInfo.apps))
                {
                    var appScope = namespaceScope.apps[appName];
                    appScope.properties['Exposed'] = 'With Ingress';
                }

                for(var serviceItem of serviceScopeInfo.items) {
                    createIngress(serviceItem);
                }

                if (serviceScopeInfo.microserviceName) {
                    var svcItem = scope.findAppItem(item.config.metadata.namespace, serviceScopeInfo.microserviceName);
                    createIngress(svcItem, { order: 250 });
                }
            }
            else
            {
                createAlert('MissingSvc-' + backendConfig.serviceName, 'error', null, 'Service ' + backendConfig.serviceName + ' is missing.');
            }
        }

        function createIngress(parent, params)
        {
            var k8sIngress = createK8sItem(parent, params);
            return k8sIngress;
        }
    }
}