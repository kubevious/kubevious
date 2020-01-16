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
            ports: {},
            properties: {
                'Exposed': 'No'
            }
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

        appScope.properties['Launcher'] = item.config.kind;

        var volumesProperties = {

        }
        var volumesConfig = _.get(item.config, 'spec.template.spec.volumes');
        if (!volumesConfig) {
            volumesConfig = [];
        }
        volumesProperties['Count'] = volumesConfig.length;
        appScope.properties['Volumes'] = volumesConfig.length;

        var containersConfig = _.get(item.config, 'spec.template.spec.containers');
        if (!containersConfig) {
            containersConfig = [];
        }
        appScope.properties['Container Count'] = containersConfig.length;

        var volumesMap = _.makeDict(volumesConfig, x => x.name);
        var containersMap = _.makeDict(containersConfig, x => x.name);

        if (_.isArray(containersConfig)) {
            for(var containerConfig of containersConfig)
            {
                processContainer(containerConfig);
            }
        }

        if (_.isArray(volumesConfig) && (volumesConfig.length > 0)) {
            var volumes = app.fetchByNaming("vol", "Volumes");

            volumes.addProperties({
                kind: "key-value",
                id: "properties",
                title: "Properties",
                order: 5,
                config: volumesProperties
            });  

            for(var volumeConfig of volumesConfig) {
                processVolumeConfig(
                    volumes, 
                    volumeConfig,
                    false);
            }
        }

        app.addProperties({
            kind: "key-value",
            id: "properties",
            title: "Properties",
            order: 5,
            config: appScope.properties
        });  

        /*** HELPERS ***/

        function processContainer(containerConfig)
        {
            var container = app.fetchByNaming("cont", containerConfig.name);
            scope.setK8sConfig(container, containerConfig);

            if (containerConfig.image) {
                var imageName = containerConfig.image;
                var imageTag;
                var i = imageName.indexOf(':');
                if (i != -1) {
                    imageTag = imageName.substring(i + 1);
                    imageName = imageName.substring(0, i);
                } else {
                    imageTag = 'latest';
                }

                var imageItem = container.fetchByNaming("image", imageName);
                imageItem.addProperties({
                    kind: "key-value",
                    id: "props",
                    title: "Properties",
                    order: 10,
                    config: {
                        name: imageName,
                        tag: imageTag,
                        fullName: containerConfig.image
                    }
                });  

            }

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
                        var configMapScope = findAndProcessConfigMap(container, envFromObj.configMapRef.name, true);
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
                        var volumeItem = processVolumeConfig(
                            container, 
                            volumeConfig,
                            true);

                        volumeItem.addProperties({
                            kind: "yaml",
                            id: "env",
                            title: "Mount Config",
                            order: 5,
                            config: volumeRefConfig
                        });  
                    }
                }
            }

            if (_.isArray(containerConfig.ports)) {
                for(var portConfig of containerConfig.ports) {
                    var portName = portConfig.protocol + "-" + portConfig.containerPort;
                    if (portConfig.name) {
                        portName = portConfig.name + " (" + portName + ")";
                    }
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

        function processVolumeConfig(parent, volumeConfig, markUsedBy)
        {
            var volume = parent.fetchByNaming("vol", volumeConfig.name);
            scope.setK8sConfig(volume, volumeConfig);
        
            if (volumeConfig.configMap) {
                findAndProcessConfigMap(volume, volumeConfig.configMap.name, markUsedBy)
            }

            if (volumeConfig.secret) {
                findAndProcessSecret(volume, volumeConfig.secret.secretName, markUsedBy)
            }

            return volume;
        }
        
        function findAndProcessConfigMap(parent, name, markUsedBy)
        {
            var configMapScope = namespaceScope.configMaps[name];
            if (configMapScope)
            {
                var configmap = parent.fetchByNaming("configmap", name);
                scope.setK8sConfig(configmap, configMapScope.config);
                if (markUsedBy) {
                    configMapScope.usedBy[configmap.dn] = true;
                }
            }
            else
            {
                parent.addAlert("MissingConfig", "error", null, 'Could not find ConfigMap ' + name);
            }
            return configMapScope;
        }

        function findAndProcessSecret(parent, name, markUsedBy)
        {
            var secret = parent.fetchByNaming("secret", name);
            if (markUsedBy) {
                var secretScope = namespaceScope.getSecret(name);
                secretScope.usedBy[secret.dn] = true;
            }
        }
    }
}


