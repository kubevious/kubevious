const Promise = require('the-promise');
const _ = require('the-lodash');

class RuleAccessor
{
    constructor(context)
    {
        this._logger = context.logger.sublogger("RuleAccessor");
        this._database = context.database;
        this._driver = context.database.driver;

        this._registerStatements();
    }

    get logger() {
        return this._logger;
    }

    _registerStatements()
    {
        this._driver.registerStatement('RULE_QUERY_ALL', 'SELECT `id`, `name`, `enabled` FROM `rules`;');
        this._driver.registerStatement('RULE_QUERY', 'SELECT * FROM `rules` WHERE `id` = ?;');
        this._driver.registerStatement('RULE_QUERY_EXPORT', 'SELECT `name`, `target`, `script`, `enabled` FROM `rules`;');
        this._driver.registerStatement('RULE_QUERY_ALL_FIELDS', 'SELECT `id`, `name`, `target`, `script`, `enabled` FROM `rules`;');
        this._driver.registerStatement('RULE_QUERY_ENABLED', 'SELECT `id`, `name`, `target`, `script` FROM `rules` WHERE `enabled` = 1;');
        this._driver.registerStatement('RULE_CREATE', 'INSERT INTO `rules`(`name`, `enabled`, `target`, `script`) VALUES (?, ?, ?, ?)');
        this._driver.registerStatement('RULE_DELETE', 'DELETE FROM `rules` WHERE `id` = ?;');
        this._driver.registerStatement('RULE_UPDATE', 'UPDATE `rules` SET `name` = ?, `enabled` = ?, `target` = ?, `script` = ?  WHERE `id` = ?;');
    }

    listAll()
    {
        return this._execute('RULE_QUERY_ALL')
            .then(result => {
                return result.map(x => this._massageDbRule(x));
            })
    }

    listAllFields()
    {
        return this._execute('RULE_QUERY_ALL_FIELDS')
            .then(result => {
                return result.map(x => this._massageDbRule(x));
            })
    }

    queryEnabledRules()
    {
        return this._execute('RULE_QUERY_ENABLED');
    }

    getRule(id)
    {
        var params = [ id ];
        return this._execute('RULE_QUERY', params)
            .then(result => {
                return this._massageDbRule(_.head(result));
            });
    }

    createRule(config)
    {
        var params = [ config.name, config.enabled, config.target, config.script ];
        return this._execute('RULE_CREATE', params)
            .then(result => {
                var row = _.clone(config);
                row.id = result.insertId;
                return row;
            });
    }

    deleteRule(id)
    {
        var params = [ id ];
        return this._execute('RULE_DELETE', params)
            .then(result => {
                return;
            });
    }

    updateRule(id, config)
    {
        var params = [ config.name, config.enabled, config.target, config.script, id ];
        return this._execute('RULE_UPDATE', params)
            .then(result => {
                var row = _.clone(config);
                row.id = id;
                return row;
            });
    }

    exportRules()
    {
        return this._execute('RULE_QUERY_EXPORT')
            .then(result => {
                return result.map(x => this._massageDbRule(x));
            })
    }

    importRules(rules, deleteExtra)
    {
        return this.listAllFields().then(res => {
            const dbRules = _.makeDict(res, x => x.name, x => { 
                var item = {
                    id: x.id
                };
                delete x.id;
                item.config = x;
                return item;
            });

            const targetRules = _.makeDict(rules, x => x.name)

            const itemsDelta = [];

            for (let key in targetRules)
            {
                let targetRuleConfig = targetRules[key]
                let dbRule = dbRules[key]
                if (dbRule)
                {
                    if (!_.fastDeepEqual(targetRuleConfig, dbRule.config))
                    {
                        itemsDelta.push({ 
                            action: 'U',
                            id: dbRule.id,
                            config: targetRuleConfig
                        });
                    }
                } else {
                    itemsDelta.push({ 
                        action: 'C',
                        config: targetRuleConfig
                    });
                }
            }

            if (deleteExtra)
            {
                for (let key in dbRules)
                {
                    let dbRule = dbRules[key]
                    let targetRuleConfig = targetRules[key]
    
                    if (!targetRuleConfig)
                    {
                        itemsDelta.push({ 
                            action: 'D',
                            id: dbRule.id
                        });
                    }
                }
            }
            
            return Promise.serial(itemsDelta, delta => {
                    if (delta.action == 'C')
                    {
                        return this.createRule(delta.config);
                    }
                    if (delta.action == 'U')
                    {
                        return this.updateRule(delta.id, delta.config);
                    }
                    if (delta.action == 'D')
                    {
                        return this.deleteRule(delta.id);
                    }
                });
        })
    }

    _execute(statementId, params)
    {
        return this._driver.executeStatement(statementId, params);
    }

    _massageDbRule(rule)
    {
        if (!rule) {
            return null;
        }
        rule.enabled = rule.enabled ? true : false;
        return rule;
    }
}

module.exports = RuleAccessor;
