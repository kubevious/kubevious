const logger = require('./logger');
logger.info("init");

const express = require('express');
const app = express();
const PromiseRouter = require('express-promise-router');

const Context = require("./lib/context");
const context = new Context(logger);

logger.info(process.env);

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

function loadRouter(name)
{
    logger.info("Loading router %s...", name);

    const router = PromiseRouter();

    var routerContext = {
        logger: logger.sublogger(name),
        router,
        app,
        context
    }
    
    const module = require('./lib/routers/' + name)
    module(routerContext);
}

loadRouter('top');
loadRouter('api');

if (process.env.NODE_ENV === "development") {
}


return context.run()
    .then(() => {
        logger.info("context is running.");

        const port = 4000;
        app.listen(port, () => {
            logger.info("listening on port %s", port);
        });
    })
    .catch(reason => {
        console.log("***** ERROR *****");
        console.log(reason);
    })


