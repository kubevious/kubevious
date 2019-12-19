const argv = require('yargs').argv;
const fs = require('fs');
const path = require('path');

var logger = require('the-logger').setup('appview',
{
    enableFile: true,
    pretty: true
});
logger.level = 'info';

const Context = require("../lib/context");
const context = new Context(logger);

getMockLoader();
// getGKELoader();

return context.run()
    .catch(reason => {
        console.log("***** ERROR *****");
        console.log(reason);
    })
    ;


function getGKELoader()
{
    const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json'), 'utf8'));

    context.addGKELoader(
        credentials,
        "gprod-uswest1c",
        "us-west1-c");
}

function getMockLoader()
{
    const MockLoader = require('../lib/loaders/k8s-mock');
    var loader = new MockLoader(context);
    context.addLoader(loader);
}