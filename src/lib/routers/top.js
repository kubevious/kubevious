module.exports = ({router, app, logger, context}) => {

    router.get('/', function (req, res) {
        res.send({});
    })

    app.use('/', router);
};