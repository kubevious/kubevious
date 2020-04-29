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
        this._driver.registerStatement('POLICY_QUERY_ALL_FIELDS', 'SELECT `id`, `name`, `target`, `script`, `enabled` FROM `policies`;');
        this._driver.registerStatement('POLICY_CREATE', 'INSERT INTO `policies`(`name`, `enabled`, `target`, `script`) VALUES (?, ?, ?, ?)');
        this._driver.registerStatement('POLICY_DELETE', 'DELETE FROM `policies` WHERE `id` = ?;');
        this._driver.registerStatement('POLICY_DELETE_ALL', 'DELETE FROM `policies`;');
        this._driver.registerStatement('POLICY_UPDATE', 'UPDATE `policies` SET `name` = ?, `enabled` = ?, `target` = ?, `script` = ?  WHERE `id` = ?;');
    }

    listAll()
    {
        return this._execute('POLICY_QUERY_ALL')
            .then(result => {
                return result.map(x => this._massageDbPolicy(x));
            })
    }

    listAllFields()
    {
        return this._execute('POLICY_QUERY_ALL_FIELDS')
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

    deleteAllPolicies()
    {
        return this._execute('POLICY_DELETE_ALL')
            .then(() => {
                return
            })
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
        return this.listAllFields().then(res => {
            const allPolicies = _.makeDict(res, x => x.name, x => ({ config: x }))
            const importedPolicies = _.makeDict(policies, x => x.name, x => ({ config: x }))

            const itemsDelta = [];

            for (let key in importedPolicies)
            {
                let targetItem = importedPolicies[key]
                let dbItemDict = allPolicies[key]

                const { name, script, target, enabled } = targetItem.config

                if (dbItemDict)
                {
                    this.updatePolicy(dbItemDict.config.id, targetItem.config)
                    itemsDelta.push({ name, target, script, enabled });
                } else {
                    this.createPolicy(targetItem.config)
                    itemsDelta.push({ name, target, script, enabled });
                }
            }

            for (let key in allPolicies)
            {
                let dbItemDict = allPolicies[key]
                let targetItem = importedPolicies[key]

                if (!targetItem)
                {
                    this.deletePolicy(dbItemDict.config.id)
                }
            }

            return itemsDelta
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
