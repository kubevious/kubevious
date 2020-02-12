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
        this._loader = null;

        this.logger.info("Constructed");
    }

    get logger() {
        return this._logger;
    }

    setupReadyHandler(handler)
    {
        this._readyHandler = handler;
        if (this._loader) {
            this._loader.setupReadyHandler(this._readyHandler);
        }
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
                this._loader = new K8sLoader(this._context, client, info);
                this._loader.setupReadyHandler(this._readyHandler);
                return this._loader.run();
            })
    }
}

module.exports = LocalLoader;