const logger = require('../logger');
logger.info("init");

const Context = require("../lib/context");
const context = new Context(logger);

context.setupServer();

const fs = require('fs');
const path = require('path');
const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, process.env.GKE_CREDENTIALS_PATH), 'utf8'));

const Loader = require('../lib/loaders/gke');
var loader = new Loader(context,
    credentials,
    process.env.GKE_K8S_CLUSTER,
    process.env.GKE_REGION);
context.addLoader(loader);

context.run();


