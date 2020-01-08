const _ = require("the-lodash");

module.exports = {
    target: {
        path: ["ns"]
    },

    order: 10,

    handler: ({scope, item, logger}) =>
    {
        logger.info("Polisher NS: %s", item.naming);

        var namespaceScope = scope.getNamespaceScope(item.naming);

        var properties = {
            "Applications": _.keys(namespaceScope.apps).length,
            "Ingresses": _.keys(namespaceScope.ingresses).length,
            "Secrets": _.keys(namespaceScope.secrets).length
        }

        item.addProperties({
            kind: "key-value",
            id: "properties",
            title: "Properties",
            order: 5,
            config: properties
        });  
    }
}