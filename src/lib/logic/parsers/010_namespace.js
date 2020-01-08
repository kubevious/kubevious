module.exports = {
    target: {
        api: "v1",
        kind: "Namespace"
    },

    kind: 'ns',

    order: 10,

    handler: ({scope, item, createK8sItem}) =>
    {
        createK8sItem(scope.root);
    }
}