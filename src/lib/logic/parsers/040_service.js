const _ = require("the-lodash");

module.exports = {
    target: {
        api: "v1",
        kind: "Service"
    },

    kind: "service",

    order: 40,

    handler: ({scope, item, createK8sItem, createAlert, hasCreatedItems}) =>
    {
        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);

        var serviceScope = {
            name: item.config.metadata.name,
            items: [],
            apps: {}
        };
        namespaceScope.services[serviceScope.name] = serviceScope;

        var appSelector = _.get(item.config, 'spec.selector');
        if (appSelector)
        {
            var appItems = scope.findAppsByLabels(item.config.metadata.namespace, appSelector);
            for(var appItem of appItems)
            {
                var appScope = namespaceScope.apps[appItem.naming];
                serviceScope.apps[appItem.naming] = true;

                appScope.properties['Exposed'] = 'With Service';

                serviceScope.microserviceName = appItem.naming;
                var serviceCount = appItem.getChildrenByKind('service').length;
                var serviceItemName = "Service";
                if (serviceCount != 0) {
                    serviceItemName += " " + (serviceCount + 1);
                }
                createService(appItem, { name: serviceItemName, order: 200 });
                
                var portsConfig = _.get(item.config, 'spec.ports');
                if (portsConfig) {
                    for(var portConfig of portsConfig) {      
                        var appPort = portConfig.targetPort;                   
                        var appPortInfo = appScope.ports[appPort];
                        if (appPortInfo) {
                            createService(appPortInfo.portItem, { name: serviceItemName })
                        } else {
                            // createAlert('Port-' + appPort, 'warn', null, 'Missing port ' + appPort + ' definition.');
                        }
                    }
                }
            }

            if (appItems.length == 0) {
                createAlert('MissingApp', 'error', null, 'Could not find apps matching selector.');
            } else if (appItems.length > 1) {
                createAlert('MultipleApps', 'warn', null, 'More than one apps matched selector.');
            }
        }
        else
        {
            // createAlert('MissingSelector', 'error', null, 'Missing selector.');
        }

        if (!hasCreatedItems()) {
            var rawContainer = scope.fetchRawContainer(item, "Services");
            createService(rawContainer);
        }

        /*** HELPERS ***/
        function createService(parent, params)
        {
            var k8sService = createK8sItem(parent, params);
            serviceScope.items.push(k8sService);
            return k8sService;
        }

    }
}