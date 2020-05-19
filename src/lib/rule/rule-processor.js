const Promise = require('the-promise');
const _ = require('the-lodash');
const KubikRuleProcessor = require('kubevious-kubik').RuleProcessor;
const MySqlTableSynchronizer = require('kubevious-helpers').MySqlTableSynchronizer;


class RuleProcessor
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("RuleProcessor");
        context.database.onConnect(this._onDbConnected.bind(this));

        this._ruleStatusesSynchronizer = new MySqlTableSynchronizer(
            this._logger, 
            context.database.driver, 
            'rule_statuses', 
            [], 
            ['name', 'hash', 'date', 'error_count', 'item_count']
        );

        this._ruleItemsSynchronizer = new MySqlTableSynchronizer(
            this._logger, 
            context.database.driver, 
            'rule_items', 
            [], 
            ['name', 'dn', 'has_error', 'has_warning']
        );

        this._ruleLogsSynchronizer = new MySqlTableSynchronizer(
            this._logger, 
            context.database.driver, 
            'rule_logs', 
            [], 
            ['name', 'kind', 'msg']
        );

    }

    get logger() {
        return this._logger;
    }

    _onDbConnected()
    {
        this._logger.info("[_onDbConnected] ...");
        return Promise.resolve()
    }

    execute(state)
    {
        this._logger.info("[execute] date: %s, count: %s", 
            state.date.toISOString(),
            state.getCount())

        var executionContext = {
            ruleStatuses: {},
            ruleItems: [],
            ruleLogs: []
        }

        return this._fetchRules()
            .then(rules => this._processRules(state, rules, executionContext))
            .then(() => this._saveRuleData(executionContext))
            .then(() => {
                this.logger.info('[execute] END');
            })
    }

    _fetchRules()
    {
        return this._context.ruleAccessor
            .queryEnabledRules()
            .then(result => {
                return result;
            });
    }

    _processRules(state, rules, executionContext)
    {
        return Promise.serial(rules, x => this._processRule(state, x, executionContext));
    }
    
    _processRule(state, rule, executionContext)
    {
        this.logger.info('[_processRule] Begin: %s', rule.name);
        this.logger.verbose('[_processRule] Begin: ', rule);

        executionContext.ruleStatuses[rule.name] = {
            name: rule.name,
            hash: rule.hash,
            date: new Date(),
            error_count: 0,
            item_count: 0
        };

        var processor = new KubikRuleProcessor(state, rule);
        return processor.process()
            .then(result => {
                this.logger.silly('[_processRule] RESULT: ', result);
                this.logger.silly('[_processRule] RESULT ITEMS: ', result.ruleItems);

                if (result.success)
                {
                    for(var dn of _.keys(result.ruleItems))
                    {
                        this.logger.debug('[_processRule] RuleItem: %s', dn);

                        var severity = null;
                        var ruleItemInfo = result.ruleItems[dn];

                        if (ruleItemInfo.hasError) {
                            severity = 'error';
                            executionContext.ruleItems.push({
                                name: rule.name,
                                dn: dn,
                                has_error: 1,
                                has_warning: 0
                            });
                        } else if (ruleItemInfo.hasWarning) {
                            severity = 'error';
                            executionContext.ruleItems.push({
                                name: rule.name,
                                dn: dn,
                                has_error: 0,
                                has_warning: 1
                            });
                        }

                        if (severity) 
                        {
                            state.raiseAlert(dn, {
                                id: 'rule-' + rule.name,
                                severity: "error",
                                msg: 'Rule ' + rule.name + ' failed.',
                                source: {
                                    kind: 'rule',
                                    id: rule.name
                                }
                            });

                            executionContext.ruleStatuses[rule.name].item_count++;
                        }
                    }
                }
                else
                {
                    this.logger.error('[_processRule] Failed: ', result.messages);

                    for(var msg of result.messages)
                    {
                        executionContext.ruleLogs.push({
                            name: rule.name,
                            kind: 'error',
                            msg: msg
                        });

                        executionContext.ruleStatuses[rule.name].error_count++;
                    }
                }
            });
    }

    _saveRuleData(executionContext)
    {
        return this._context.database.driver.executeInTransaction(() => {
            return Promise.resolve()
                .then(() => this._syncRuleStatuses(executionContext))
                .then(() => this._syncRuleItems(executionContext))
                .then(() => this._syncRuleLogs(executionContext))
        });
    }

    _syncRuleStatuses(executionContext)
    {
        this.logger.info('[_syncRuleStatuses] Begin');
        this.logger.verbose('[_syncRuleStatuses] Begin', executionContext.ruleStatuses);
        return this._ruleStatusesSynchronizer.execute({}, _.values(executionContext.ruleStatuses));
    }

    _syncRuleItems(executionContext)
    {
        this.logger.info('[_syncRuleItems] Begin');
        this.logger.verbose('[_syncRuleItems] Begin', executionContext.ruleItems);
        return this._ruleItemsSynchronizer.execute({}, executionContext.ruleItems);
    }

    _syncRuleLogs(executionContext)
    {
        this.logger.info('[_syncRuleLogs] Begin');
        this.logger.verbose('[_syncRuleLogs] Begin', executionContext.ruleLogs);
        return this._ruleLogsSynchronizer.execute({}, executionContext.ruleLogs);
    }
    
}

module.exports = RuleProcessor;
