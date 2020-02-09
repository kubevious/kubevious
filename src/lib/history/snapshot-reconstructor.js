const Promise = require('the-promise');
const _ = require('the-lodash');

class SnapshotReconstructor
{
    constructor(snapshotItems)
    {
        this._snapshot = {};

        for(var item of snapshotItems)
        {
            this._snapshot[this._makeId(item)] = item;
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
            var id = this._makeId(item);
            if (item.present)
            {
                this._snapshot[id] = item;
            }
            else
            {
                delete this._snapshot[id];
            }
        }
    }

    getSnapshotList()
    {
        return _.values(this._snapshot);
    }

    _makeId(item)
    {
        return item.dn + '-' + _.stableStringify(item.info);
    }
}

module.exports = SnapshotReconstructor;