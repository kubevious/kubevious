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
        createService(rawConfigMaps);

        var appSelector = _.get(item.config, 'spec.selector');
        logger.debug("[_processService] appSelector: ", appSelector);
        if (appSelector)
        {
            var appItems = scope.findAppsByLabels(item.config.metadata.namespace, appSelector);
            logger.debug("[_processService] appSelector results: " , appItems.map(x => x.naming));
            for(var appItem of appItems)
            {
                var appScope = namespaceScope.apps[appItem.naming];
                logger.debug("[_processService] appscope name: %s" , appItem.naming)

                scopeInfo.microserviceName = appItem.naming;
                var serviceCount = appItem.getChildrenByKind('service').length;
                var serviceItemName = "Service";
                if (serviceCount != 0) {
                    serviceItemName += " " + (serviceCount + 1);
                }
                var k8sService2 = createService(appItem, { name: serviceItemName, order: 200 });
                
                var portsConfig = _.get(item.config, 'spec.ports');
                if (portsConfig) {
                    logger.debug("[_processService] portsConfig: ", portsConfig);
                    for(var portConfig of portsConfig) {      
                        logger.debug("[_processService] portConfig: ", portConfig);
                        var appPort = portConfig.targetPort;                   
                        var appPortInfo = appScope.ports[appPort];
                        if (appPortInfo) {
                            logger.debug("[_processService] found port %s :: %s", appPortInfo.name, appPort);
                            createService(appPortInfo.portItem, { name: serviceItemName })
                        } else {
                            logger.debug("[_processService] missing app %s port %s", appScope.name, appPort);
                            k8sService2.addAlert('Port-' + appPort, 'warn', null, 'Missing port ' + appPort + ' definition.');
                        }
                    }
                }
            }
        }

        /*** HELPERS ***/
        function createService(parent, params)
        {
            params = params || {};
            var name = params.name || item.config.metadata.name;
            var k8sService = parent.fetchByNaming("service", name);
            scope.setK8sConfig(k8sService, item.config);
            if (params.order) {
                k8sService.order = params.order;
            }
            scopeInfo.items.push(k8sService);
            return k8sService;
        }

    }
}