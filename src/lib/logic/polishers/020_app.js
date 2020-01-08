module.exports = {
    target: {
        path: ["ns", "app"]
    },

    order: 20,

    handler: ({scope, item, logger}) =>
    {
        logger.info("Polisher App: %s", item.dn);
    }
}