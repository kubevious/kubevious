module.exports = {
    url: '/',

    setup: ({ router, logger }) => {

        router.get('/', function (req, res) {
            return {};
        });
    
        router.get('/version', function (req, res) {
            return {
                version: require('../../version')
            };
        });
    
    }

}