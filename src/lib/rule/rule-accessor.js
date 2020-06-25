const Promise = require('the-promise');
const _ = require('the-lodash');
const HashUtils = require('kubevious-helpers').HashUtils;

class RuleAccessor
{
    constructor(context, dataStore)
    {
        this._logger = context.logger.sublogger("RuleAccessor");
        this._dataStore = dataStore;
    }

    get logger() {
        return this._logger;
    }

    queryAll()
    {
        return this._dataStore.table('rules')
            .queryMany();
    }

    queryEnabledRules()
    {
        return this._dataStore.table('rules')
            .queryMany({ enabled: true });
    }

    queryAllRuleStatuses()
    {
        return this._dataStore.table('rule_statuses')
            .queryMany();
    }

    queryAllRuleItems()
    {
        return this._dataStore.table('rule_items')
            .queryMany();
    }

    queryAllRuleLogs()
    {
        return this._dataStore.table('rule_logs')
            .queryMany();
    }

    getRule(name)
    {
        return this._dataStore.table('rules')
            .query({ name: name });
    }

    createRule(config, target)
    {
        return Promise.resolve()
            .then((() => {
                if (target) {
                    if (config.name != target.name) {
                        return this._dataStore.table('rules')
                            .delete(target);
                    }
                }
            }))
            .then(() => {
                var ruleObj = this._makeDbRule(config);
                return this._dataStore.table('rules')
                    .createOrUpdate(ruleObj);
            });
    }

    deleteRule(name)
    {
        return this._dataStore.table('rules')
            .delete({ name: name });
    }

    exportRules()
    {
        return this.queryAll()
            .then(result => {
                return {
                    kind: 'rules',
                    items: result.map(x => ({
                        name: x.name,
                        script: x.script,
                        target: x.target,
                        enabled: x.enabled,
                    })),
                };
            });
    }

    importRules(rules, deleteExtra)
    {
        var items = rules.items.map(x => this._makeDbRule(x));
        return this._dataStore.table('rules')
            .synchronizer(null, !deleteExtra)
            .execute(items);
    }

    _makeDbRule(rule)
    {
        var ruleObj = {
            name: rule.name,
            enabled: rule.enabled,
            target: rule.target,
            script: rule.script,
            date: new Date()
        }
        var hash = HashUtils.calculateObjectHash(ruleObj);
        ruleObj.hash = hash;
        return ruleObj;
    }

    getRuleItems(rule_id)
    {
        var params = [ rule_id ];
        return this._execute('RULE_ITEMS_QUERY', params)
            .then(result => {
                return result;
            });
    }

    getRuleLogs(rule_id)
    {
        var params = [ rule_id ];
        return this._execute('RULE_LOGS_QUERY', params)
            .then(result => {
                return result;
            });
    }

    _execute(statementId, params)
    {
        return this._database.executeStatement(statementId, params);
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
