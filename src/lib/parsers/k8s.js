const Promise = require('the-promise');

class K8sParser
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("K8sParser");
    }

    parse(isPresent, obj)
    {
        var id = this._extractId(obj);

        if (isPresent) {
            var indexBy = {
                kind: id.kind,
                name: id.name
            }
            if (id.namespace) {
                indexBy.namespace = id.namespace;
            }
            this._context.concreteRegistry.add(id, obj, indexBy);
        } else {
            this._context.concreteRegistry.remove(id);
        }
    }

    _extractId(obj)
    {
        var id = {};
        id.infra = "k8s";
        id.api = obj.apiVersion.split('/')[0];
        id.kind = obj.kind;
        if (obj.metadata.namespace) {
            id.namespace = obj.metadata.namespace;
        }
        id.name = obj.metadata.name;
        return id;
    }

}

module.exports = K8sParser;