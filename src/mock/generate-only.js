const argv = require('yargs').argv;
const fs = require('fs');
const path = require('path');

var logger = require('the-logger').setup('kubevious',
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
    const fs = require('fs');
    const path = require('path');
    const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, process.env.GKE_CREDENTIALS_PATH), 'utf8'));

    const Loader = require('../lib/loaders/gke');
    var loader = new Loader(context,
        credentials,
        process.env.GKE_K8S_CLUSTER,
        process.env.GKE_REGION);
    context.addLoader(loader);
}

function getMockLoader()
{
    const MockLoader = require('../lib/loaders/k8s-mock');
    var loader = new MockLoader(context);
    context.addLoader(loader);
}