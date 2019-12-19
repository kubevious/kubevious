const _ = require('lodash');

class ConcreteItem
{
    constructor(registry, id, config)
    {
        this._registry = registry;
        this._id = id;
        this._config = config;
        this._indexKey = null;
    }

    get logger() {
        return this._registry.logger;
    }

    get registry() {
        return this._registry;
    }
    
    get id() {
        return this._id;
    }
    
    get config() {
        return this._config;
    }

    matchesFilter(idFilter)
    {
        if (!_.isObject(this.id)) {
            return false;
        }
        if (!idFilter) {
            return true;
        }
        if (!_.isObject(idFilter)) {
            return false;
        }
        for(var key of _.keys(idFilter)) {
            var val = idFilter[key];
            if (!_.isEqual(val, this.id[key])) {
                return false;
            }
        }
        return true;
    }

    debugOutputToFile(writer)
    {
        writer.indent();

        writer.write('ID:');
        writer.indent();
        writer.write(this.id);
        writer.unindent();

        if (this.config && (_.keys(this.config).length > 0))
        {
            writer.write('Config:');
            writer.indent();
            writer.write(this.config);
            writer.unindent();
        }

        writer.unindent();

    }

    dump() {
        var result = {
            id: this.id
        }
        if (this.config) {
            result.config = this.config;
        }
        return result;
    }
}

module.exports = ConcreteItem;