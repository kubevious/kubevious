const Promise = require('the-promise');
const _ = require('the-lodash');
const Helpers = require('./helpers');

class Snapshot
{
    constructor()
    {
        this._items = {};
        this._date = null;
    }

    get date() {
        return this._date;
    }

    get count() {
        return _.keys(this._items).length;
    }

    get keys() {
        return _.keys(this._items);
    }

    setDate(date) {
        this._date = date;
    }
    
    addItem(item)
    {
        this._items[Helpers.makeKey(item)] = item;
    }

    addItems(items)
    {
        for(var item of items)
        {
            this.addItem(item);
        }
    }

    deleteItem(item)
    {
        this.delteById(Helpers.makeKey(item));
    }

    delteById(id)
    {
        delete this._items[id];
    }

    getItems()
    {
        return _.values(this._items);
    }

    getDict()
    {
        return _.cloneDeep(this._items);
    }

    findById(id)
    {
        var item = this._items[id];
        if (!item) {
            return null;
        }
        return item;
    }

    findItem(item)
    {
        return this.findById(Helpers.makeKey(item));
    }
}

module.exports = Snapshot;