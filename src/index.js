const logger = require('./logger');
logger.info("init");

const Promise = require("the-promise");

const Context = require("./lib/context");
const context = new Context(logger);

const Server = require("./server");
const server = new Server(context);

if (process.env.DATA_SOURCE == "mock") {
    const MockLoader = require('./lib/loaders/k8s-mock');
    var loader = new MockLoader(context);
    context.addLoader(loader);
} else if (process.env.DATA_SOURCE == "gke") {
    const fs = require('fs');
    const credentials = JSON.parse(fs.readFileSync(process.env.GKE_CREDENTIALS_PATH, 'utf8'));
    context.addGKELoader(
        credentials,
        process.env.GKE_K8S_CLUSTER,
        process.env.GKE_REGION);
} else {
    throw new Error("No Loader Specified.");
}

return Promise.resolve()
    .then(() => context.run())
    .then(() => server.run())
    .catch(reason => {
        console.log("***** ERROR *****");
        console.log(reason);
        logger.error(reason);
        process.exit(1);
    });


