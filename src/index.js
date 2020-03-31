const logger = require('./logger');
logger.info("init");

const Context = require("./lib/context");
const context = new Context(logger);

context.setupServer();

context.run();


