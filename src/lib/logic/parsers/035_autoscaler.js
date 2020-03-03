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
        var scaleTargetRef = _.get(item.config, 'spec.scaleTargetRef');
            if (!scaleTargetRef) {
                return null;
            }

        var appInfo = scope.getAppAndScope(
            item.config.metadata.namespace, 
            scaleTargetRef.name,
            false);

        if (!appInfo) {
            var rawContainer = scope.fetchRawContainer(item, "Autoscalers");
            createK8sItem(rawContainer);
            createAlert('MissingApp', 'error', null, 'Could not find apps matching scaleTargetRef.');
            return;
        }

        var min = item.config.spec.minReplicas;
        var max = item.config.spec.maxReplicas;
        var replicasInfo = "[" + min + ", " + max + "]";

        createK8sItem(appInfo.app);

        var appProps = appInfo.appScope.properties;
        if (_.isNotNullOrUndefined(appProps['Replicas']))
        {
            appProps['Replicas'] += " " + replicasInfo;
        } 
        else 
        {
            appProps['Replicas'] = replicasInfo;
        }

        /*** HELPERS ***/

        function getAppInfo()
        {
            
        }
    }
}


