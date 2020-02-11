const Promise = require('the-promise');
const _ = require('the-lodash');
const Snapshot = require('./snapshot');

class SnapshotReconstructor
{
    constructor(snapshotItems)
    {
        this._snapshot = new Snapshot();

        if (snapshotItems)
        {
            for(var item of snapshotItems)
            {
                delete item.id;
                this._snapshot.addItem(item);
            }
        }
    }
    
    applyDiffsItems(diffsItems)
    {
        for(var diffItems of diffsItems)
        {
            this.applyDiffItems(diffItems)
        }
    }

    applyDiffItems(diffItems)
    {
        for(var item of diffItems)
        {
            delete item.id;
            if (item.present)
            {
                this._snapshot.addItem(item);
            }
            else
            {
                this._snapshot.deleteItem(item);
            }
        }
    }

    getSnapshot()
    {
        return this._snapshot;
    }

}

module.exports = SnapshotReconstructor;