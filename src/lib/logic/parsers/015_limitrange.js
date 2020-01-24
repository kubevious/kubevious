module.exports = {
    target: {
        api: "v1",
        kind: "LimitRange"
    },

    kind: 'limitrange',

    order: 15,

    handler: ({scope, item, createK8sItem}) =>
    {
        // var rawContainer = scope.fetchRawContainer(item, "LimitRanges");
        // createK8sItem(rawContainer);
    }
}