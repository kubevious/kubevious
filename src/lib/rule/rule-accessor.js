const Promise = require('the-promise');
const _ = require('the-lodash');
const HashUtils = require('kubevious-helpers').HashUtils;

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
        this._driver.registerStatement('RULES_QUERY', 'SELECT `id`, `name`, `target`, `script`, `enabled` FROM `rules`;');
        this._driver.registerStatement('RULES_QUERY_COMBINED', 'SELECT  `rules`.`id`, `rules`.`name`, `rules`.`enabled`, `rules`.`hash`, `rule_statuses`.`error_count` as error_count, `rule_statuses`.`item_count` as item_count, `rule_statuses`.`hash` as status_hash FROM `rules` LEFT OUTER JOIN `rule_statuses` ON `rules`.`name` = `rule_statuses`.`name`;');
        this._driver.registerStatement('RULE_QUERY', 'SELECT  `rules`.`id`, `rules`.`name`, `rules`.`enabled`, `rules`.`target`, `rules`.`script`, `rules`.`hash`, `rule_statuses`.`error_count` as error_count, `rule_statuses`.`item_count` as item_count, `rule_statuses`.`hash` as status_hash FROM `rules` LEFT OUTER JOIN `rule_statuses` ON `rules`.`name` = `rule_statuses`.`name` WHERE `rules`.`id` = ?;');
        this._driver.registerStatement('RULE_QUERY_EXPORT', 'SELECT `name`, `target`, `script`, `enabled` FROM `rules`;');
        this._driver.registerStatement('RULE_QUERY_ENABLED', 'SELECT `id`, `name`, `hash`, `target`, `script` FROM `rules` WHERE `enabled` = 1;');
        this._driver.registerStatement('RULE_CREATE', 'INSERT INTO `rules`(`name`, `enabled`, `target`, `script`, `date`, `hash`) VALUES (?, ?, ?, ?, ?, ?)');
        this._driver.registerStatement('RULE_DELETE', 'DELETE FROM `rules` WHERE `id` = ?;');
        this._driver.registerStatement('RULE_UPDATE', 'UPDATE `rules` SET `name` = ?, `enabled` = ?, `target` = ?, `script` = ?, `date` = ?, `hash` = ?  WHERE `id` = ?;');

        this._driver.registerStatement('RULE_ITEMS_QUERY', 'SELECT `dn`, `has_error`, `has_warning` FROM `rule_items` WHERE `name` = ?;');

        this._driver.registerStatement('RULE_LOGS_QUERY', 'SELECT `kind`, `msg` FROM `rule_logs` WHERE `name` = ?;');
    }

    queryAllCombined()
    {
        return this._execute('RULES_QUERY_COMBINED')
            .then(result => {
                return result.map(x => this._massageDbRule(x));
            })
    }

    queryAll()
    {
        return this._execute('RULES_QUERY')
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
        var ruleObj = this._makeRuleObj(config);
        var params = [ 
            ruleObj.name,
            ruleObj.enabled,
            ruleObj.target,
            ruleObj.script,
            ruleObj.date,
            ruleObj.hash
        ];
        return this._execute('RULE_CREATE', params)
            .then(result => {
                var row = ruleObj;
                row.id = result.insertId;
                delete row.hash;
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
        var ruleObj = this._makeRuleObj(config);
        var params = [ 
            ruleObj.name, 
            ruleObj.enabled, 
            ruleObj.target, 
            ruleObj.script,
            ruleObj.date,
            ruleObj.hash,
            id ];
        return this._execute('RULE_UPDATE', params)
            .then(result => {
                var row = ruleObj;
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
        return this.queryAll().then(res => {
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

    getRuleItems(name)
    {
        var params = [ name ];
        return this._execute('RULE_ITEMS_QUERY', params)
            .then(result => {
                return result;
            });
    }

    getRuleLogs(name)
    {
        var params = [ name ];
        return this._execute('RULE_LOGS_QUERY', params)
            .then(result => {
                return result;
            });
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

        if (rule.hash)
        {
            rule.isCurrent = false;
            if (rule.status_hash) {
                rule.isCurrent = rule.hash.equals(rule.status_hash);
            }
            delete rule.hash;
            delete rule.status_hash;
        }

        if (!rule.enabled) {
            rule.isCurrent = true;
        }

        if (!rule.error_count) {
            rule.error_count = 0;
        }

        if (!rule.item_count) {
            rule.item_count = 0;
        }

        return rule;
    }

    _makeRuleObj(config)
    {
        var ruleObj = {
            name: config.name,
            enabled: config.enabled,
            target: config.target,
            script: config.script,
            date: new Date()
        }
        var hash = HashUtils.calculateObjectHash(ruleObj);
        ruleObj.hash = hash;
        return ruleObj;
    }
}

module.exports = RuleAccessor;
