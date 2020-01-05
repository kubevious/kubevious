const yaml = require('js-yaml');
const _ = require("the-lodash");

module.exports = {
    targets: [{
        api: "apps",
        kind: "Deployment"
    }, {
        api: "apps",
        kind: "DaemonSet"
    }, {
        api: "apps",
        kind: "StatefulSet"
    }],

    order: 30,

    handler: ({scope, item, createK8sItem, createAlert, hasCreatedItems}) =>
    {
        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);
        var appScope = {
            name: item.config.metadata.name,
            ports: {}
        };
        namespaceScope.apps[appScope.name] = appScope;

        var namespace = scope.root.fetchByNaming("ns", item.config.metadata.namespace);

        var app = namespace.fetchByNaming("app", item.config.metadata.name);

        var labelsMap = _.get(item.config, 'spec.template.metadata.labels');
        if (labelsMap) {
            namespaceScope.appLabels.push({
                labels: labelsMap,
                name: item.config.metadata.name,
                appItem: app
            });
        }

        var launcher = app.fetchByNaming("launcher", item.config.kind);
        scope.setK8sConfig(launcher, item.config);
        namespaceScope.registerAppOwner(launcher);

        var volumesConfig = _.get(item.config, 'spec.template.spec.volumes');
        var containersConfig = _.get(item.config, 'spec.template.spec.containers');

        var volumesMap = _.makeDict(volumesConfig, x => x.name);
        var containersMap = _.makeDict(containersConfig, x => x.name);

        if (_.isArray(containersConfig)) {
            for(var containerConfig of containersConfig) {
                var container = app.fetchByNaming("cont", containerConfig.name);
                scope.setK8sConfig(container, containerConfig);

                var envVars = {
                }

                if (containerConfig.env) {
                    for(var envObj of containerConfig.env) {
                        var value = null;
                        if (envObj.value) {
                            value = envObj.value;
                        } else if (envObj.valueFrom) {
                            value = "<pre>" + yaml.safeDump(envObj.valueFrom) + "</pre>";
                        }
                        envVars[envObj.name] = value;
                    }
                }

                if (containerConfig.envFrom) {
                    for(var envFromObj of containerConfig.envFrom) {
                        if (envFromObj.configMapRef) {
                            var configMapScope = findAndProcessConfigMap(container, envFromObj.configMapRef.name);
                            if (configMapScope) {
                                if (configMapScope.config.data) {
                                    for(var dataKey of _.keys(configMapScope.config.data)) {
                                        envVars[dataKey] = configMapScope.config.data[dataKey];
                                    }
                                } else {
                                    container.addAlert("EmptyConfig", "warn", null, 'ConfigMap has no data: ' + envFromObj.configMapRef.name);
                                }
                            }
                        }
                        var value = null;
                        if (envObj.value) {
                            value = envObj.value;
                        } else if (envObj.valueFrom) {
                            value = "<pre>" + yaml.safeDump(envObj.valueFrom) + "</pre>";
                        }
                        envVars[envObj.name] = value;
                    }
                }


                if (_.keys(envVars).length > 0) {
                    container.addProperties({
                        kind: "key-value",
                        id: "env",
                        title: "Environment Variables",
                        order: 10,
                        config: envVars
                    });    
                }

                if (_.isArray(containerConfig.volumeMounts)) {
                    for(var volumeRefConfig of containerConfig.volumeMounts) {
                        var volumeConfig = volumesMap[volumeRefConfig.name];
                        if (volumeConfig) {
                            processVolumeConfig(
                                container, 
                                volumeConfig);
                        }
                    }
                }

                if (_.isArray(containerConfig.ports)) {
                    for(var portConfig of containerConfig.ports) {
                        var portName = portConfig.name + " (" + portConfig.protocol + "-" + portConfig.containerPort + ")";
                        var portItem = container.fetchByNaming("port", portName);
                        scope.setK8sConfig(portItem, portConfig);

                        var portConfigScope = {
                            name: portConfig.name,
                            containerName: containerConfig.name,
                            portItem: portItem,
                            containerItem: container
                        };

                        appScope.ports[portConfig.name] = portConfigScope;
                        appScope.ports[portConfig.containerPort] = portConfigScope;
                    }
                }
            }
        }

        if (_.isArray(volumesConfig) && (volumesConfig.length > 0)) {
            var volumes = app.fetchByNaming("vol", "Volumes");

            for(var volumeConfig of volumesConfig) {
                processVolumeConfig(
                    volumes, 
                    volumeConfig);
            }
        }

        /*** HELPERS ***/
        function processVolumeConfig(parent, volumeConfig)
        {
            var volume = parent.fetchByNaming("vol", volumeConfig.name);
            scope.setK8sConfig(volume, volumeConfig);
        
            if (volumeConfig.configMap) {
                findAndProcessConfigMap(volume, volumeConfig.configMap.name)
            }
        }
        
        function findAndProcessConfigMap(parent, name)
        {
            var configMapScope = namespaceScope.configMaps[name];
            if (configMapScope)
            {
                var configmap = parent.fetchByNaming("configmap", name);
                scope.setK8sConfig(configmap, configMapScope.config);
                configMapScope.usedBy[configmap.dn] = true;
            }
            else
            {
                parent.addAlert("MissingConfig", "error", null, 'Could not find ConfigMap ' + name);
            }
            return configMapScope;
        }
    }
}


