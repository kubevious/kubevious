const Promise = require('the-promise');
const _ = require('the-lodash');
const moment = require('moment');

class K8sLoader 
{
    constructor(context, client, info)
    {
        this._context = context;
        this._logger = context.logger.sublogger("K8sLoader");
        this._client = client;
        this._info = info;
        this._apiTargets = {};

        this.logger.info("Constructed");

        this._setupApiTargets();
    }

    get logger() {
        return this._logger;
    }

    _setupApiTargets()
    {
        for(var targetAccessor of this._getTargets())
        {
            var targetInfo = {
                id: [targetAccessor.apiName, targetAccessor.kindName].join('-'),
                accessor: targetAccessor,
                allFetched: false,
                canIgnore: false,
                connectDate: null
            }
            this._apiTargets[targetInfo.id] = targetInfo;
        }
    }

    setupReadyHandler(handler)
    {
        this._readyHandler = handler;
        this._reportReady();
    }

    _getTargets() {
        return [
            this._client.Node,
            this._client.Namespace,
            this._client.LimitRange,
            this._client.Deployment,
            this._client.StatefulSet,
            this._client.HorizontalPodAutoscaler,
            this._client.DaemonSet,
            this._client.Job,
            this._client.Service,
            this._client.Ingress,
            this._client.ConfigMap,
            this._client.ReplicaSet,
            this._client.Pod
        ];
    }

    run()
    {
        setInterval(() => {
            this._reportReady()
        }, 1000);

        return Promise.serial(_.values(this._apiTargets), x => {
            return this._watch(x);
        })
    }

    _watch(targetInfo)
    {
        this.logger.info("Watching %s...", targetInfo.id);
        return targetInfo.accessor.watchAll(null, (action, obj) => {
            this._logger.verbose("[_watch] %s ::: %s %s", targetInfo.id, action, obj.kind);
            this._logger.verbose("%s %s", action, obj.kind);
            this._logger.silly("%s %s :: ", action, obj.kind, obj);
            var isPresent = this._parseAction(action);

            // this._debugSaveToMock(isPresent, obj);
            this._handle(isPresent, obj);
        }, () => {
            this._logger.info("[_watch] Connected: %s", targetInfo.id);
            targetInfo.connectDate = new Date();
            this._reportReady();
        }, (resourceAccessor, data) => {
            this._logger.info("[_watch] Disconnected: %s", targetInfo.id);
            targetInfo.connectDate = null;
            if (data.status) {
                targetInfo.canIgnore = true;
            }
            this._reportReady();
        });
    }

    _isTargetReady(targetInfo)
    {
        this.logger.verbose("[_isTargetReady] %s", targetInfo.id);

        if (targetInfo.canIgnore) {
            this.logger.silly("[_isTargetReady] %s, canIgnore: %s", targetInfo.id, targetInfo.canIgnore);
            return true;
        }

        if (!targetInfo.connectDate) {
            this.logger.silly("[_isTargetReady] %s, NO connectDate", targetInfo.id);
            return false;
        }

        this.logger.silly("[_isTargetReady] %s, date: %s", targetInfo.id, targetInfo.connectDate);
        var now = moment(new Date());
        var connectDate = moment(targetInfo.connectDate);
        var duration = moment.duration(now.diff(connectDate));
        var seconds = duration.asSeconds();
        this.logger.silly("[_isTargetReady] %s, seconds: %s", targetInfo.id, seconds);

        if (seconds > 5) {
            this.logger.verbose("[_isTargetReady] %s, is ready", targetInfo.id);

            return true;
        }
        
        this.logger.silly("[_isTargetReady] %s, is not ready", targetInfo.id);
        return false;
    }

    _isReady()
    {
        for(var targetInfo of _.values(this._apiTargets))
        {
            var isReady = this._isTargetReady(targetInfo);
            if (!isReady)
            {
                return false;
            }
        }
        return true;
    }

    _reportReady()
    {
        if (!this._readyHandler) {
            return;
        }
        this._readyHandler(this._isReady());
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