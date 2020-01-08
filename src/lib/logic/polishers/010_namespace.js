module.exports = {
    target: {
        path: ["ns"]
    },

    order: 10,

    handler: ({scope, item, logger}) =>
    {
        logger.info("Polisher NS: %s", item.dn);
    }
}