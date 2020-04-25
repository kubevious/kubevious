const Promise = require('the-promise');
const _ = require('the-lodash');

class PolicyAccessor
{
    constructor(context)
    {
        this._logger = context.logger.sublogger("PolicyAccessor");
        this._database = context.database;
        this._driver = context.database.driver;

        this._registerStatements();
    }

    get logger() {
        return this._logger;
    }

    _registerStatements()
    {
        this._driver.registerStatement('POLICY_QUERY_ALL', 'SELECT `id`, `name` FROM `policies`;');
        this._driver.registerStatement('POLICY_QUERY', 'SELECT * FROM `policies` WHERE `id` = ?;');
        this._driver.registerStatement('POLICY_CREATE', 'INSERT INTO `policies`(`name`, `script`) VALUES (?, ?)');
        this._driver.registerStatement('POLICY_DELETE', 'DELETE FROM `policies` WHERE `id` = ?;');
        this._driver.registerStatement('POLICY_UPDATE', 'UPDATE `policies` SET `name` = ?, `script` = ? WHERE `id` = ?;');
    }

    listAll()
    {
        return this._execute('POLICY_QUERY_ALL')
    }

    getPolicy(id)
    {
        var params = [ id ];
        return this._execute('POLICY_QUERY', params)
            .then(result => {
                return _.head(result) || null;
            });
    }

    createPolicy(config)
    {
        var params = [ config.name, config.script ];
        return this._execute('POLICY_CREATE', params)
            .then(result => {
                var row = _.clone(config);
                row.id = result.insertId;
                return row;
            });
    }

    deletePolicy(id)
    {
        var params = [ id ];
        return this._execute('POLICY_DELETE', params)
            .then(result => {
                return;
            });
    }

    updatePolicy(id, config)
    {
        var params = [ config.name, config.script, id ];
        return this._execute('POLICY_UPDATE', params)
            .then(result => {
                var row = _.clone(config);
                row.id = id;
                return row;
            });
    }

    _execute(statementId, params)
    {
        return this._driver.executeStatement(statementId, params);
    }

}

module.exports = PolicyAccessor;