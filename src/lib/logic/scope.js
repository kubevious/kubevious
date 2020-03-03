const _ = require("the-lodash");
const LogicItem = require("./item");

class LogicScope
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("LogicScope");

        this._itemMap = {}
        this._root = LogicItem.constructTop(this);
        this._acceptItem(this._root);

        this._configMap = {};
        this._namespaceScopes = {};
        this._infraScope = new InfraScope(this);
    }

    get logger() {
        return this._logger;
    }

    get concreteRegistry() {
        return this._context.concreteRegistry;
    }

    get root() {
        return this._root;
    }

    get configMap() {
        return this._configMap;
    }

    _acceptItem(item) 
    {
        this._itemMap[item.dn] = item;
    }

    _dropItem(item) 
    {
        delete this._itemMap[item.dn];
    }

    extractItems() {
        return this._itemMap;
    }

    findItem(dn)
    {
        var item = this._itemMap[dn];
        if (!item) {
            item = null;
        }
        return item;
    }
    
    getNamespaceScope(name) {
        if (!this._namespaceScopes[name]) {
            this._namespaceScopes[name] = new NamespaceScope(this, name);
        }
        return this._namespaceScopes[name];
    }

    getAppAndScope(ns, name, createIfMissing) {
        var namespace = this.root.fetchByNaming("ns", ns);
        var namespaceScope = this.getNamespaceScope(ns);

        var app = namespace.fetchByNaming("app", name, !createIfMissing);
        if (!app) {
            return null; 
        }

        var appScope = namespaceScope.apps[name];
        if (!appScope) {
            appScope = {
                name: name,
                ports: {},
                properties: {
                    'Exposed': 'No'
                }
            };
            namespaceScope.apps[name] = appScope;
        }

        return {
            namespace: namespace,
            app: app,
            namespaceScope: namespaceScope,
            appScope: appScope
        }
    }

    getInfraScope() {
        return this._infraScope;
    }

    setK8sConfig(logicItem, config)
    {
        logicItem.setConfig(config);
        this.configMap[logicItem.dn] = config;

        logicItem.addProperties({
            kind: "yaml",
            id: "config",
            title: "Config",
            config: config
        });
    }

    fetchInfraRawContainer()
    {
        var infra = this.root.fetchByNaming("infra", "Infrastructure");
        infra.order = 1000;
        return infra;
    }

    fetchRawContainer(item, name)
    {
        var namespace = this.root.fetchByNaming("ns", item.config.metadata.namespace);
        var rawContainer = namespace.fetchByNaming("raw", "Raw Configs");
        rawContainer.order = 1000;
        var container = rawContainer.fetchByNaming("raw", name);
        return container;
    }

    findAppsByLabels(namespace, selector)
    {
        var result = [];
        var namespaceScope = this.getNamespaceScope(namespace);
        for(var appLabelInfo of namespaceScope.appLabels)
        {
            if (this._labelsMatch(appLabelInfo.labels, selector))
            {
                result.push(appLabelInfo.appItem);
            }
        }
        return result;
    }

    _labelsMatch(labels, selector)
    {
        for(var key of _.keys(selector)) {
            if (selector[key] != labels[key]) {
                return false;
            }
        }
        return true;
    }
    
    findAppItem(namespace, name)
    {
        return this._findItem([
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

    _findItem(itemPath)
    {
        var item = this.root;
        for(var x of itemPath) {
            item = item.findByNaming(x.kind, x.name);
            if (!item) {
                return null;
            }
        }
        return item;
    }
}


class InfraScope
{
    constructor(parent)
    {
        this._parent = parent;
        this._logger = parent.logger;
        this._nodeCount = 0
        this._nodeResources = {};
        this._clusterResources = {};
    }

    get logger() {
        return this._logger;
    }

    get nodeCount() {
        return this._nodeCount;
    }

    get clusterResources() {
        return this._clusterResources;
    }

    get nodeResources() {
        return this._nodeResources;
    }

    increaseNodeCount()
    {
        this._nodeCount += 1;
    }

    setClusterResources(value)
    {
        this._clusterResources = value;
    }

    setNodeResources(value)
    {
        this._nodeResources = value;
    }
}

class NamespaceScope
{
    constructor(parent, name)
    {
        this._parent = parent;
        this._logger = parent.logger;
        this._name = name;

        this.appLabels = [];
        this.apps = {};
        this.services = {};
        this.appControllers = {};
        this.appOwners = {};
        this.configMaps = {};
        this.ingresses = {};
        this.secrets = {};
    }

    get logger() {
        return this._logger;
    }

    get name() {
        return this._name;
    }

    registerAppOwner(owner)
    {
        if (!this.appOwners[owner.config.kind]) {
            this.appOwners[owner.config.kind] = {};
        }
        if (!this.appOwners[owner.config.kind][owner.config.metadata.name]) {
            this.appOwners[owner.config.kind][owner.config.metadata.name] = [];
        }
        this.appOwners[owner.config.kind][owner.config.metadata.name].push(owner);
    }

    getAppOwners(kind, name)
    {
        if (!this.appOwners[kind]) {
            return []
        }
        if (!this.appOwners[kind][name]) {
            return []
        }
        return this.appOwners[kind][name];
    }

    getSecret(name)
    {
        if (!this.secrets[name]) {
            this.secrets[name] = {
                usedBy: {}
            }
        }
        return this.secrets[name];
    }
}

module.exports = LogicScope;