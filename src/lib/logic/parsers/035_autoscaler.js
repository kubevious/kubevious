const yaml = require('js-yaml');
const _ = require("the-lodash");

module.exports = {
    target: {
        api: "autoscaling",
        kind: "HorizontalPodAutoscaler"
    },

    order: 35,

    kind: 'hpa',

    handler: ({logger, scope, item, context, createK8sItem, createAlert, hasCreatedItems}) =>
    {
        var app = getApp();

        if (!app) {
            var rawContainer = scope.fetchRawContainer(item, "Autoscalers");
            createK8sItem(rawContainer);
            return;
        }

        var min = item.config.spec.minReplicas;
        var max = item.config.spec.maxReplicas;
        var replicasInfo = "[" + min + ", " + max + "]";

        createK8sItem(app);

        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);
        var appScope = namespaceScope.apps[app.naming];
        var appProps = appScope.properties;
        if (_.isNotNullOrUndefined(appProps['Replicas']))
        {
            appProps['Replicas'] += " " + replicasInfo;
        } 
        else 
        {
            appProps['Replicas'] = replicasInfo;
        }

        /*** HELPERS ***/

        function getApp()
        {
            var scaleTargetRef = _.get(item.config, 'spec.scaleTargetRef');
            if (!scaleTargetRef) {
                return null;
            }

            var namespace = scope.root.fetchByNaming("ns", item.config.metadata.namespace);
            return namespace.fetchByNaming('app', scaleTargetRef.name);
        }
    }
}


