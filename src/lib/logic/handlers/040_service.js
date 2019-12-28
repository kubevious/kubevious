const _ = require("the-lodash");

module.exports = {
    target: {
        api: "v1",
        kind: "Service"
    },

    order: 40,

    handler: ({scope, item, logger}) =>
    {
        var scopeInfo = {
            name: item.config.metadata.name,
            items: []
        };
        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);
        namespaceScope.services[scopeInfo.name] = scopeInfo;

        var rawConfigMaps = scope.fetchRawContainer(item, "Services");
        var k8sService = rawConfigMaps.fetchByNaming("service", item.config.metadata.name);
        scope.setK8sConfig(k8sService, item.config);
        scopeInfo.items.push(k8sService);

        var appSelector = _.get(item.config, 'spec.selector');
        logger.info("[_processService] appSelector: ", appSelector);
        if (appSelector)
        {
            var appItems = scope.findAppsByLabels(item.config.metadata.namespace, appSelector);
            logger.info("[_processService] appSelector results: " , appItems.map(x => x.naming));
            for(var appItem of appItems)
            {
                var appScope = namespaceScope.apps[appItem.naming];
                logger.info("[_processService] appscope name: %s" , appItem.naming)

                scopeInfo.microserviceName = appItem.naming;
                var serviceCount = appItem.getChildrenByKind('service').length;
                var serviceItemName = "Service";
                if (serviceCount != 0) {
                    serviceItemName += " " + (serviceCount + 1);
                }
                var k8sService2 = appItem.fetchByNaming("service", serviceItemName);
                scope.setK8sConfig(k8sService2, item.config);
                k8sService2.order = 200;
                scopeInfo.items.push(k8sService2);

                var portsConfig = _.get(item.config, 'spec.ports');
                if (portsConfig) {
                    logger.info("[_processService] portsConfig: ", portsConfig);
                    for(var portConfig of portsConfig) {      
                        logger.info("[_processService] portConfig: ", portConfig);
                        var appPort = portConfig.targetPort;                   
                        var appPortInfo = appScope.ports[appPort];
                        if (appPortInfo) {
                            logger.info("[_processService] found port %s :: %s", appPortInfo.name, appPort);
                            var k8sService3 = appPortInfo.portItem.fetchByNaming("service", serviceItemName);
                            scope.setK8sConfig(k8sService3, item.config);
                            scopeInfo.items.push(k8sService3);
                        } else {
                            logger.error("[_processService] missing app %s port %s", appScope.name, appPort);
                            k8sService2.addAlert('Port-' + appPort, 'warn', null, 'Missing port ' + appPort + ' definition.');
                        }
                    }
                }
            }
        }
    }
}