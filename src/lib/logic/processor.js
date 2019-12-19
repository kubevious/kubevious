const _ = require("the-lodash");
const yaml = require('js-yaml');
const LogicItem = require("./item");

class LogicProcesorScope
{
    constructor()
    {
        this._root = LogicItem.constructTop();
        this._configMap = {};
        this._propertiesMap = {};
        this._namespaceScopes = {};
    }

    get root() {
        return this._root;
    }

    get configMap() {
        return this._configMap;
    }

    get propertiesMap() {
        return this._propertiesMap;
    }
    
    getNamespaceScope(name) {
        if (!this._namespaceScopes[name]) {
            this._namespaceScopes[name] = {
                apps: {},
                services: {}
            };
        }
        return this._namespaceScopes[name];
    }
}

class LogicProcessor 
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("LogicProcessor");

        this._context.concreteRegistry.onChanged(this._process.bind(this));
    }

    get logger() {
        return this._logger;
    }

    _process()
    {
        this._logger.info("Process...");

        var scope = new LogicProcesorScope();

        this._processNamespaces(scope);

        this._processConfigMaps(scope);

        this._processApps(scope);

        this._processServices(scope);

        this._processIngresses(scope);

        this._context.facadeRegistry.updateLogicTree(scope.root.exportTree());
        this._context.facadeRegistry.updateConfigTree(scope.configMap);
        this._context.facadeRegistry.updatePropertiesMap(scope.propertiesMap);

       return this._dumpToFile(scope);
    }

    _dumpToFile(scope)
    {
        return Promise.resolve()
            .then(() => {
                var writer = this.logger.outputStream("dump-logic-tree");
                if (writer) {
                    scope.root.debugOutputToFile(writer);
                    return writer.close();
                }
            })
            .then(() => {
                var writer = this.logger.outputStream("dump-logic-tree-detailed");
                if (writer) {
                    scope.root.debugOutputToFile(writer, { includeConfig: true });
                    return writer.close();
                }
            })
            .then(() => {
                var writer = this.logger.outputStream("exported-tree");
                if (writer) {
                    writer.write(this._context.facadeRegistry.logicTree);
                    return writer.close();
                }
            });
    }

    _processNamespaces(scope)
    {
        var filter = {
            api: "v1",
            kind: "Namespace"
        }
        for (var item of this._context.concreteRegistry.filterItems(filter))
        {
            this._processNamespace(scope, item);
        }
    }

    _processNamespace(scope, item)
    {
        var namespace = scope.root.fetchByNaming("ns", item.config.metadata.name);
        this._setK8sConfig(scope, namespace, item.config);
    }

    _processConfigMaps(scope)
    {
        var filter = {
            api: "v1",
            kind: "ConfigMap"
        }
        for (var item of this._context.concreteRegistry.filterItems(filter))
        {
            this._processConfigMap(scope, item);
        }
    }

    _processConfigMap(scope, item)
    {
        var rawConfigMaps = this._fetchRawContainer(scope, item, "ConfigMaps");
        var configmap = rawConfigMaps.fetchByNaming("configmap", item.config.metadata.name);
        this._setK8sConfig(scope, configmap, item.config);
    }

    _processServices(scope)
    {
        var filter = {
            api: "v1",
            kind: "Service"
        }
        for (var item of this._context.concreteRegistry.filterItems(filter))
        {
            this._processService(scope, item);
        }
    }

    _processService(scope, item)
    {
        this.logger.info("[_processService] %s", item.config.metadata.name);

        var scopeInfo = {
            name: item.config.metadata.name,
            items: []
        };
        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);
        namespaceScope.services[scopeInfo.name] = scopeInfo;

        var rawConfigMaps = this._fetchRawContainer(scope, item, "Services");
        var k8sService = rawConfigMaps.fetchByNaming("service", item.config.metadata.name);
        this._setK8sConfig(scope, k8sService, item.config);
        scopeInfo.items.push(k8sService);

        var svcName = _.get(item.config, 'spec.selector.name');
        if (svcName) {
            var appItem = this._findAppItem(scope, item.config.metadata.namespace, svcName)
            if (appItem) {
                var appScope = namespaceScope.apps[svcName];
                this.logger.info("[_processService] appscope name: %s" , svcName)

                scopeInfo.microserviceName = svcName;
                var serviceCount = appItem.getChildrenByKind('service').length;
                var serviceItemName = "Service";
                if (serviceCount != 0) {
                    serviceItemName += " " + (serviceCount + 1);
                }
                var k8sService2 = appItem.fetchByNaming("service", serviceItemName);
                this._setK8sConfig(scope, k8sService2, item.config);
                k8sService2.order = 200;
                scopeInfo.items.push(k8sService2);

                var portsConfig = _.get(item.config, 'spec.ports');
                if (portsConfig) {
                    this.logger.info("[_processService] portsConfig: ", portsConfig);
                    for(var portConfig of portsConfig) {      
                        this.logger.info("[_processService] portConfig: ", portConfig);
                        var appPort = portConfig.targetPort;                   
                        var appPortInfo = appScope.ports[appPort];
                        if (appPortInfo) {
                            this.logger.info("[_processService] found port %s :: %s", appPortInfo.name, appPort);
                            var k8sService3 = appPortInfo.portItem.fetchByNaming("service", serviceItemName);
                            this._setK8sConfig(scope, k8sService3, item.config);
                            scopeInfo.items.push(k8sService3);
                        } else {
                            this.logger.error("[_processService] missing app %s port %s", appScope.name, appPort);
                        }
                    }
                }
            }
        }
    }

    _processIngresses(scope)
    {
        var filter = {
            api: "extensions",
            kind: "Ingress"
        }
        for (var item of this._context.concreteRegistry.filterItems(filter))
        {
            this._processIngress(scope, item);
        }
    }

    _processIngress(scope, item)
    {
        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);

        var rawConfigMaps = this._fetchRawContainer(scope, item, "Ingresses");
        var k8sIngress = rawConfigMaps.fetchByNaming("ingress", item.config.metadata.name);
        this._setK8sConfig(scope, k8sIngress, item.config);

        var _processIngressBackend = (backendConfig) => {
            this.logger.info("[_processIngress]", backendConfig)
            if (!backendConfig.serviceName) {
                return;
            }

            var serviceScopeInfo = namespaceScope.services[backendConfig.serviceName];
            if (serviceScopeInfo) {

                for(var serviceItem of serviceScopeInfo.items) {
                    var nestedIngress = serviceItem.fetchByNaming("ingress", item.config.metadata.name);
                    this._setK8sConfig(scope, nestedIngress, item.config);
                }

                if (serviceScopeInfo.microserviceName) {
                    var svcItem = this._findAppItem(scope, item.config.metadata.namespace, serviceScopeInfo.microserviceName);
                    var svcItemIngress = svcItem.fetchByNaming("ingress", item.config.metadata.name);
                    this._setK8sConfig(scope, svcItemIngress, item.config);
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

        // var svcName = _.get(item.config, 'spec.backend.serviceName');
        // if (svcName) {
        //     var svcItem = this._findAppItem(scope, item.config.metadata.namespace, svcName)
        //     if (svcItem) {
        //         var serviceCount = svcItem.getChildrenByKind('service');
        //         var serviceItemName = "Service";
        //         if (serviceCount != 0) {
        //             serviceItemName += " " + (serviceCount + 1);
        //         }
        //         var k8sService2 = svcItem.fetchByNaming("service", serviceItemName);
        //         this._setK8sConfig(scope, k8sService2, item.config);
        //         k8sService2.order = 200;
        //     }
        // }
    }


    _findAppItem(scope, namespace, name)
    {
        this.logger.info("[_findAppItem] %s :: %s...", namespace, name)
        return this._findItem(scope, [
            {
                kind: "ns",
                name: namespace
            },
            {
                kind: "app",
                name: name
            }
        ]);
    }

    _findItem(scope, itemPath)
    {
        var item = scope.root;
        for(var x of itemPath) {
            item = item.findByNaming(x.kind, x.name);
            if (!item) {
                return null;
            }
        }
        return item;
    }

    _fetchRawContainer(scope, item, name)
    {
        var namespace = scope.root.fetchByNaming("ns", item.config.metadata.namespace);
        var rawContainer = namespace.fetchByNaming("raw", "Raw Configs");
        rawContainer.order = 1000;
        var container = rawContainer.fetchByNaming("raw", name);
        return container;
    }

    _processApps(scope)
    {
        var filter = {
            api: "apps",
            kind: "Deployment"
        }
        for (var item of this._context.concreteRegistry.filterItems(filter))
        {
            this._processApp(scope, item);
        }

        filter = {
            api: "apps",
            kind: "StatefulSet"
        }
        for (var item of this._context.concreteRegistry.filterItems(filter))
        {
            this._processApp(scope, item);
        }

        filter = {
            api: "apps",
            kind: "DaemonSet"
        }
        for (var item of this._context.concreteRegistry.filterItems(filter))
        {
            this._processApp(scope, item);
        }
    }

    _processApp(scope, item)
    {
        var namespaceScope = scope.getNamespaceScope(item.config.metadata.namespace);
        var appScope = {
            name: item.config.metadata.name,
            ports: {}
        };
        namespaceScope.apps[appScope.name] = appScope;

        var namespace = scope.root.fetchByNaming("ns", item.config.metadata.namespace);

        var app = namespace.fetchByNaming("app", item.config.metadata.name);

        var launcher = app.fetchByNaming("launcher", item.config.kind);
        this._setK8sConfig(scope, launcher, item.config);

        var volumesConfig = _.get(item.config, 'spec.template.spec.volumes');
        var containersConfig = _.get(item.config, 'spec.template.spec.containers');

        var volumesMap = _.makeDict(volumesConfig, x => x.name);
        var containersMap = _.makeDict(containersConfig, x => x.name);

        if (_.isArray(containersConfig)) {
            for(var containerConfig of containersConfig) {
                var container = app.fetchByNaming("cont", containerConfig.name);
                this._setK8sConfig(scope, container, containerConfig);

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

                scope.propertiesMap[container.dn].push({
                    kind: "key-value",
                    name: "Environment Variables",
                    order: 10,
                    config: envVars
                });

                if (_.isArray(containerConfig.volumeMounts)) {
                    for(var volumeRefConfig of containerConfig.volumeMounts) {
                        var volumeConfig = volumesMap[volumeRefConfig.name];
                        if (volumeConfig) {
                            this._processVolumeConfig(
                                scope, 
                                container, 
                                item.config.metadata.namespace, 
                                volumeConfig);
                        }
                    }
                }

                if (_.isArray(containerConfig.ports)) {
                    for(var portConfig of containerConfig.ports) {
                        var portName = portConfig.name + " (" + portConfig.protocol + "-" + portConfig.containerPort + ")";
                        var portItem = container.fetchByNaming("port", portName);
                        this._setK8sConfig(scope, portItem, portConfig);
                        appScope.ports[portConfig.containerPort] = {
                            name: portConfig.name,
                            containerName: containerConfig.name,
                            portItem: portItem,
                            containerItem: container
                        };
                    }
                }
            }
        }

        if (_.isArray(volumesConfig) && (volumesConfig.length > 0)) {
            var volumes = app.fetchByNaming("vol", "Volumes");

            for(var volumeConfig of volumesConfig) {
                this._processVolumeConfig(
                    scope, 
                    volumes, 
                    item.config.metadata.namespace, 
                    volumeConfig);
            }
        }
    }

    _processVolumeConfig(scope, parent, namespace, volumeConfig)
    {
        var volume = parent.fetchByNaming("vol", volumeConfig.name);
        this._setK8sConfig(scope, volume, volumeConfig);

        if (volumeConfig.configMap) {
            this._findAndProcessConfigMap(scope, volume, namespace, volumeConfig.configMap.name)
        }
    }

    _findAndProcessConfigMap(scope, parent, namespace, name)
    {
        var indexFilter = {
            kind: "ConfigMap",
            namespace: namespace,
            name: name
        }
        var configMapItem = this._context.concreteRegistry.findByIndex(indexFilter);
        if (configMapItem) {
            var configmap = parent.fetchByNaming("configmap", name);
            this._setK8sConfig(scope, configmap, configMapItem.config);
        }
    }

    _setK8sConfig(scope, logicItem, config)
    {
        logicItem.setConfig(config);
        scope.configMap[logicItem.dn] = config;
        if (!scope.propertiesMap[logicItem.dn]) {
            scope.propertiesMap[logicItem.dn] = [];
        }
        scope.propertiesMap[logicItem.dn].push({
            kind: "yaml",
            name: "Config",
            config: config
        });
    }

}

module.exports = LogicProcessor;