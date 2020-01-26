module.exports = {
    target: {
        api: "v1",
        kind: "Node"
    },

    kind: 'node',

    order: 10,

    handler: ({scope, item, createK8sItem}) =>
    {
        var infra = scope.fetchInfraRawContainer();

        var nodes = infra.fetchByNaming("nodes", "Nodes");

        createK8sItem(nodes);
    }
}