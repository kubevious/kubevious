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
        this._driver.registerStatement('POLICY_QUERY_ALL', 'SELECT `id`, `name`, `enabled` FROM `policies`;');
        this._driver.registerStatement('POLICY_QUERY', 'SELECT * FROM `policies` WHERE `id` = ?;');
        this._driver.registerStatement('POLICY_QUERY_EXPORT', 'SELECT `name`, `target`, `script`, `enabled` FROM `policies`;');
        this._driver.registerStatement('POLICY_CREATE', 'INSERT INTO `policies`(`name`, `enabled`, `target`, `script`) VALUES (?, ?, ?, ?)');
        this._driver.registerStatement('POLICY_DELETE', 'DELETE FROM `policies` WHERE `id` = ?;');
        this._driver.registerStatement('POLICY_UPDATE', 'UPDATE `policies` SET `name` = ?, `enabled` = ?, `target` = ?, `script` = ?  WHERE `id` = ?;');
    }

    listAll()
    {
        return this._execute('POLICY_QUERY_ALL')
            .then(result => {
                return result.map(x => this._massageDbPolicy(x));
            })
    }

    getPolicy(id)
    {
        var params = [ id ];
        return this._execute('POLICY_QUERY', params)
            .then(result => {
                return this._massageDbPolicy(_.head(result));
            });
    }

    createPolicy(config)
    {
        var params = [ config.name, config.enabled, config.target, config.script ];
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
        var params = [ config.name, config.enabled, config.target, config.script, id ];
        return this._execute('POLICY_UPDATE', params)
            .then(result => {
                var row = _.clone(config);
                row.id = id;
                return row;
            });
    }

    exportPolicies()
    {
        return this._execute('POLICY_QUERY_EXPORT')
            .then(result => {
                return result.map(x => this._massageDbPolicy(x));
            })
    }

    importPolicies(policies)
    {
        const result = []

        return new Promise((resolve, reject) => {
            policies.map(policy => {
                this.createPolicy(policy)
                    .then(res => result.push(res))
            })

            resolve(result)
        })
    }

    _execute(statementId, params)
    {
        return this._driver.executeStatement(statementId, params);
    }

    _massageDbPolicy(policy)
    {
        if (!policy) {
            return null;
        }
        policy.enabled = policy.enabled ? true : false;
        return policy;
    }
}

module.exports = PolicyAccessor;
