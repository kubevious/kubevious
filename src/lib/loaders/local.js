const Promise = require('the-promise');
const fs = require('fs');
const K8sClient = require('k8s-super-client');
const K8sLoader = require('./k8s');

class LocalLoader 
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("LocalLoader");
        this.logger.info("Constructed");
    }

    get logger() {
        return this._logger;
    }
    
    run()
    {
        var endpoint = 'https://' + process.env.KUBERNETES_SERVICE_HOST + ':' + process.env.KUBERNETES_SERVICE_PORT_HTTPS;
        var k8sConfig = {
            token: fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token', 'utf8'),
            caData: fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/ca.crt', 'utf8')
        };

        return Promise.resolve(K8sClient.connect(this._logger, endpoint, k8sConfig))
            .then(client => {
                var info = {
                    infra: "local"
                }
                var loader = new K8sLoader(this._context, client, info);
                return loader.run();
            })
    }
}

module.exports = LocalLoader;