const Promise = require('the-promise');
const _ = require('lodash');
const DnUtils = require('kubevious-helpers').DnUtils;

class RegistryState
{
    constructor(snapshotInfo)
    {
        this._date = snapshotInfo.date;
        this._tree = null;
        this._nodeMap = {};
        this._treeMap = {};
        this._childrenMap = {};
        this._assetMap = {};

        this._transform(snapshotInfo);
    }

    get date() {
        return this._date;
    }

    getCount()
    {
        return _.keys(this._nodeMap).length;
    }

    getTree() {
        return this._tree;
    }

    getNode(dn, includeChildren)
    {
        var node = this._constructNode(dn);
        if (!node) {
            return null;
        }

        var result = {
            node: node
        }

        if (includeChildren)
        {
            result.children = this._getChildren(dn);
        }

        return result;
    }

    getChildren(dn)
    {
        var result = this._getChildren(dn);
        return result;
    }

    getAssets(dn)
    {
        var assets = this._getAssets(dn);
        return assets;
    }

    getNodes()
    {
        return _.keys(this._nodeMap).map(dn => ({
            dn: dn,
            config: this._nodeMap[dn]
        }));
    }

    _getChildren(dn)
    {
        var result = [];

        var childDns = this._childrenMap[dn];
        if (childDns) {
            for(var childDn of childDns) {
                var childNode = this._constructNode(childDn);
                if (childDn) {
                    result.push(childNode);
                }
            }
        }
        
        return result;
    }

    _constructNode(dn)
    {
        var node = this._nodeMap[dn];
        if (!node) {
            return null;
        }

        node = _.clone(node);
        var childDns = this._childrenMap[dn];
        node.childrenCount = 0;
        if (childDns) {
            node.childrenCount = childDns.length;
        }
        return node;
    }

    _transform(snapshotInfo)
    {
        for(var item of _.values(snapshotInfo.items))
        {
            if (item.config_kind == 'node')
            {
                this._addTreeNode(item.dn, item.config);
            } else if (item.config_kind == 'props') {
                var assets = this._fetchAssets(item.dn);
                assets.props[item.config.id] = item.config;
            } else if (item.config_kind == 'alerts') {
                var assets = this._fetchAssets(item.dn);
                assets.alerts = item.config;
            }
        }

        this._buildChildrenMap();

        this._tree = this._buildTreeNode('root');

        if (!this._tree) {
            this._tree = {
                kind: 'root',
                rn: 'root'
            }
        }
    }

    _addTreeNode(dn, node)
    {
        this._nodeMap[dn] = node;
    }

    _buildChildrenMap()
    {
        for(var dn of _.keys(this._nodeMap))
        {
            var parentDn = DnUtils.parentDn(dn);
            if (parentDn) {
                var parent = this._childrenMap[parentDn];
                if (!parent) {
                    parent = [];
                    this._childrenMap[parentDn] = parent;
                }
                parent.push(dn);
            }
        }
    }

    _buildTreeNode(parentDn)
    {
        var node = this._nodeMap[parentDn];
        if (!node) {
            return null;
        }

        var node = _.clone(node);
        node.children = [];

        var childrenDns = this._childrenMap[parentDn]
        if (childrenDns)
        {
            for(var childDn of childrenDns)
            {
                var childTreeNode = this._buildTreeNode(childDn);
                if (childTreeNode)
                {
                    node.children.push(childTreeNode);
                }
            }
        }

        return node;
    }

    _getAssets(dn)
    {
        var assets = this._assetMap[dn];
        if (!assets) {
            return {
                props: {},
                alerts: []
            }
        }
        return this._assetMap[dn];
    }

    _fetchAssets(dn)
    {
        var assets = this._assetMap[dn];
        if (!assets) {
            assets = {
                props: {},
                alerts: []
            }
            this._assetMap[dn] = assets;
        }
        return assets;
    }

}

module.exports = RegistryState;