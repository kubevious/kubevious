const logger = require('./logger');
logger.info("init");

const Context = require("./lib/context");
const context = new Context(logger);

context.setupServer();

const LocalLoader = require('./lib/loaders/local');
var loader = new LocalLoader(context);
context.addLoader(loader);

context.run();


