const _ = require("the-lodash");
const elasticlunr = require('elasticlunr');

class SearchEngine
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("SearchEngine");
        this.reset();
    }

    get logger() {
        return this._logger;
    }

    reset()
    {
        this._index = elasticlunr(function () {
            this.addField('name')
            this.addField('kind')
            this.setRef('dn');
        });
    }

    addToIndex(item)
    {
        var doc = {
            dn: item.dn,
            kind: item.prettyKind,
            name: item.naming
        }
        this._index.addDoc(doc);
    }

    search(criteria)
    {
        var config = {
            fields: {
                name: {boost: 2},
                kind: {boost: 1}
            },
            boolean: "AND"
        }
        var results = this._index.search(criteria, config);
        results = results.map(x => ({ dn: x.ref }))
        return results;
    }

}


module.exports = SearchEngine;