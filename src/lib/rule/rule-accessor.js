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

    createRule(config)
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

        return this._dataStore.table('rules')
            .create(ruleObj);
    }

    deleteRule(name)
    {
        return this._dataStore.table('rules')
            .create({ name: name });
    }

    exportRules()
    {
        return this.queryAll();
        // this._execute('RULE_QUERY_EXPORT')
        //     .then(result => {
        //         return result.map(x => this._massageDbRule(x));
        //     })
    }

    importRules(rules, deleteExtra)
    {
        // TODO
        // return this.queryAll().then(res => {
        //     const dbRules = _.makeDict(res, x => x.name, x => { 
        //         var item = {
        //             id: x.id
        //         };
        //         delete x.id;
        //         item.config = x;
        //         return item;
        //     });

        //     const targetRules = _.makeDict(rules, x => x.name)

        //     const itemsDelta = [];

        //     for (let key in targetRules)
        //     {
        //         let targetRuleConfig = targetRules[key]
        //         let dbRule = dbRules[key]
        //         if (dbRule)
        //         {
        //             if (!_.fastDeepEqual(targetRuleConfig, dbRule.config))
        //             {
        //                 itemsDelta.push({ 
        //                     action: 'U',
        //                     id: dbRule.id,
        //                     config: targetRuleConfig
        //                 });
        //             }
        //         } else {
        //             itemsDelta.push({ 
        //                 action: 'C',
        //                 config: targetRuleConfig
        //             });
        //         }
        //     }

        //     if (deleteExtra)
        //     {
        //         for (let key in dbRules)
        //         {
        //             let dbRule = dbRules[key]
        //             let targetRuleConfig = targetRules[key]
    
        //             if (!targetRuleConfig)
        //             {
        //                 itemsDelta.push({ 
        //                     action: 'D',
        //                     id: dbRule.id
        //                 });
        //             }
        //         }
        //     }
            
        //     return Promise.serial(itemsDelta, delta => {
        //             if (delta.action == 'C')
        //             {
        //                 return this.createRule(delta.config);
        //             }
        //             if (delta.action == 'U')
        //             {
        //                 return this.updateRule(delta.id, delta.config);
        //             }
        //             if (delta.action == 'D')
        //             {
        //                 return this.deleteRule(delta.id);
        //             }
        //         });
        // })
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
