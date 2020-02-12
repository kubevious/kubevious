const Promise = require('the-promise');
const _ = require('lodash');

class FacadeRegistry
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("FacadeRegistry");

        this._itemsMap = {};

        this._logicTree = {};
        this._configMap = {};

        this._context.concreteRegistry.onChanged(this._handleConcreteRegistryChange.bind(this));
    }

    get logger() {
        return this._logger;
    }

    get logicTree() {
        return this._logicTree;
    }

    get configTree() {
        return this._configMap;
    }

    updateLogicTree(value)
    {
        this._logger.info("[updateLogicTree] ...");
        this._logicTree = value;
    }
    
    updateConfigTree(value)
    {
        this._logger.info("[updateConfigTree] ...");
        this._configMap = value;
    }

    acceptItems(value)
    {
        this._logger.info("[acceptItems] ...");
        this._itemsMap = value;

        this._context.historyProcessor.acceptSnapshot(value);

        this._context.searchEngine.reset();
        for(var item of _.values(this._itemsMap))
        {
            this._context.searchEngine.addToIndex(item);
        }
    }

    getConfig(dn) {
        var value = this._configMap[dn];
        if (!value) {
            return {};
        }
        return value;
    }

    getItemList() {
        return _.keys(this._itemsMap);
    }

    getItem(dn) {
        var value = this._itemsMap[dn];
        if (!value) {
            return {};
        }
        return {
            dn: value.dn
        };
    }
    
    getItemChildren(dn) {
        var value = this._itemsMap[dn];
        if (!value) {
            return [];
        }
        return value.getChildren().map(x => ({
            dn: x.dn,
            order: x.order
        }));
    }

    getItemProperties(dn) {
        var value = this._itemsMap[dn];
        if (!value) {
            return [];
        }
        return value.extractProperties();
    }

    getItemAlerts(dn) {
        var value = this._itemsMap[dn];
        if (!value) {
            return [];
        }
        return value.extractAlerts();
    }

    _handleConcreteRegistryChange()
    {
        this._logger.info("[_handleConcreteRegistryChange] BEGIN");

        if (this._context.areLoadersReady) {
            this._context.logicProcessor.process();
        }

        this._logger.info("[_handleConcreteRegistryChange] END");
    }

    handleAreLoadersReadyChange()
    {
        this._logger.info("[handleAreLoadersReadyChange] ");
        this._handleConcreteRegistryChange();
    }
}

module.exports = FacadeRegistry;