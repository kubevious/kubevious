const _ = require("the-lodash");
const LogicItem = require("./item");

class LogicScope
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("LogicScope");

        this._root = LogicItem.constructTop();
        this._configMap = {};
        this._propertiesMap = {};
        this._namespaceScopes = {};
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

    get propertiesMap() {
        return this._propertiesMap;
    }
    
    getNamespaceScope(name) {
        if (!this._namespaceScopes[name]) {
            this._namespaceScopes[name] = {
                appLabels: [],
                apps: {},
                services: {}
            };
        }
        return this._namespaceScopes[name];
    }

    setK8sConfig(logicItem, config)
    {
        logicItem.setConfig(config);
        this.configMap[logicItem.dn] = config;
        if (!this.propertiesMap[logicItem.dn]) {
            this.propertiesMap[logicItem.dn] = [];
        }
        this.propertiesMap[logicItem.dn].push({
            kind: "yaml",
            id: "config",
            title: "Config",
            config: config
        });
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
        this.logger.info("[_findAppItem] %s :: %s...", namespace, name)
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

module.exports = LogicScope;