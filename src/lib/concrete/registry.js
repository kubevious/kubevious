const Promise = require('the-promise');
const _ = require('lodash');
const EventDampener = require('../utils/event-dampener');
const ConcreteItem = require('./item');

class ConcreteRegistry
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("ConcreteRegistry");
        this._items = {};
        this._itemIndex = {};

        this._changeEvent = new EventDampener(this._logger);

        this.onChanged(() => {
            return this.debugOutputToFile();
        })
    }

    get logger() {
        return this._logger;
    }

    get allItems() {
        return _.values(this._items);
    }

    add(id, obj, indexBy)
    {
        this.logger.info("[add] ", id);
        var rawId = this._makeDictId(id);
        var item = new ConcreteItem(this, id, obj);
        this._items[rawId] = item;
        if (indexBy) {
            var indexKey = this._makeDictId(indexBy);
            item._indexKey = indexKey;
            this._itemIndex[indexKey] = item;
        }
        this._triggerChange();
    }

    remove(id)
    {
        this.logger.info("[remove] %s", id);

        var rawId = this._makeDictId(id);

        var item = this._items[rawId];
        if (item) {
            if (item._indexKey) {
                delete this._itemIndex[item._indexKey];
            }
            delete this._items[rawId];
            this._triggerChange();
        }
    }

    _triggerChange()
    {
        this.logger.debug("[_triggerChange]");
        this._changeEvent.trigger();
    }

    findById(id)
    {
        var rawId = this._makeDictId(id);
        var item = this._items[rawId];
        if (item) {
            return item;
        }
        return null;
    }

    findByIndex(indexBy)
    {
        var rawId = this._makeDictId(indexBy);
        var item = this._itemIndex[rawId];
        if (item) {
            return item;
        }
        return null;
    }

    filterItems(idFilter) {
        var result = [];
        for(var item of this.allItems) {
            if (item.matchesFilter(idFilter)) {
                result.push(item);
            }
        }
        return result;
    }

    _makeDictId(id) {
        if (_.isString(id)) {
            return id;
        }
        return _.stableStringify(id);
    }

    onChanged(cb)
    {
        return this._changeEvent.on(cb);
    }

    debugOutputToFile()
    {
        this.logger.info("[debugOutputToFile] BEGIN");

        var writer = this.logger.outputStream("dump-concrete-registry");
        if (!writer) {
            this.logger.info("[debugOutputToFile] skipped");
            return Promise.resolve();
        }

        var ids = _.keys(this._items);
        ids.sort();
        for(var id of ids) {
            writer.write('-) ' + id);
            var item = this._items[id];
            item.debugOutputToFile(writer);
            writer.write();
        }

        writer.write();
        writer.write();
        writer.write("******************************************");
        writer.write("******************************************");
        writer.write("******************************************");
        writer.write();
        writer.write();

        ids = _.keys(this._itemIndex);
        ids.sort();
        for(var id of ids) {
            writer.write(id + " => " + this._makeDictId(this._itemIndex[id].id));
        }

        return Promise.resolve(writer.close())
            .then(() => {
                this.logger.info("[debugOutputToFile] END");
            });
    }

    dump() {
        var result = {};
        var ids = _.keys(this._items);
        ids.sort();
        for(var id of ids) {
            var item = this._items[id];
            result[id] = item.dump();
        }
        return result;
    }
}

module.exports = ConcreteRegistry;