const logger = require('../logger');
logger.info("init");

const Context = require("../lib/context");
const context = new Context(logger);

context.setupServer();

const MockLoader = require('../lib/loaders/k8s-mock');
var loader = new MockLoader(context);
context.addLoader(loader);

context.run();


