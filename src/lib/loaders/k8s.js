const Promise = require('the-promise');

class K8sLoader 
{
    constructor(context, client, info)
    {
        this._context = context;
        this._logger = context.logger.sublogger("K8sLoader");
        this._client = client;
        this._info = info;

        this.logger.info("Constructed");
    }

    get logger() {
        return this._logger;
    }

    run()
    {
        var targets = [
            this._client.Namespace,
            this._client.Deployment,
            this._client.StatefulSet,
            this._client.DaemonSet,
            this._client.Service,
            this._client.Ingress,
            this._client.ConfigMap,
            this._client.ReplicaSet,
            this._client.Pod
        ]

        return Promise.serial(targets, x => {
            return this._watch(x);
        })
    }

    _watch(target)
    {
        this.logger.info("Watching %s...", target);
        return target.watchAll(null, (action, obj) => {
            this._logger.verbose("%s %s", action, obj.kind);
            this._logger.silly("%s %s :: ", action, obj.kind, obj);
            var isPresent = this._parseAction(action);

            // this._debugSaveToMock(isPresent, obj);
            this._handle(isPresent, obj);
        })
    }

    _handle(isPresent, obj)
    {
        this._logger.verbose("Handle: %s, present: %s", obj.kind, isPresent);

        this._context.k8sParser.parse(isPresent, obj);
    }

    _parseAction(action)
    {
        if (action == 'ADDED' || action == 'MODIFIED') {
            return true;
        }
        if (action == 'DELETED') {
            return false;
        }
        return false;
    }

    
    _debugSaveToMock(isPresent, obj)
    {
        const Path = require('path');
        const fs = require('fs');

        if (isPresent) {

            var parts = [obj.apiVersion, obj.kind, obj.namespace, obj.metadata.name];
            parts = parts.filter(x => x);
            var fileName =  parts.join('-');
            fileName = fileName.replace(/\./g, "-");
            fileName = fileName.replace(/\//g, "-");
            fileName = fileName.replace(/\\/g, "-");
            fileName = fileName + '.json';
            fileName = Path.resolve(__dirname, '..', '..', 'mock', 'data', fileName);
            this._logger.info(fileName);
            fs.writeFileSync(fileName, JSON.stringify(obj, null, 4));
        }
    }


}

module.exports = K8sLoader;