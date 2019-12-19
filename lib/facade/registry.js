const Promise = require('the-promise');
const _ = require('lodash');

class FacadeRegistry
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("FacadeRegistry");

        this._logicTree = {};
        this._configMap = {};
        this._propertiesMap = {};
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

    updatePropertiesMap(value) 
    {
        this._logger.info("[updatePropertiesMap] ...");
        this._propertiesMap = value;
    }

    getConfig(dn) {
        var value = this._configMap[dn];
        if (!value) {
            return {};
        }
        return value;
    }

    getProperties(dn)
    {
        var value = this._propertiesMap[dn];
        if (!value) {
            return [];
        }
        return value;
    }
    

}

module.exports = FacadeRegistry;