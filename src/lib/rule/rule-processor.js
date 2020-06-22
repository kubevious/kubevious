const Promise = require('the-promise');
const _ = require('the-lodash');
const KubikRuleProcessor = require('kubevious-kubik').RuleProcessor;


class RuleProcessor
{
    constructor(context, dataStore)
    {
        this._context = context;
        this._logger = context.logger.sublogger("RuleProcessor");
        this._dataStore = dataStore;

        this._ruleStatusesSynchronizer = 
            this._dataStore.table('rule_statuses')
                .synchronizer();

        this._ruleItemsSynchronizer = 
            this._dataStore.table('rule_items')
                .synchronizer();

        this._ruleLogsSynchronizer = 
            this._dataStore.table('rule_logs')
                .synchronizer();

        this._markerItemsSynchronizer = 
            this._dataStore.table('marker_items')
                .synchronizer();
    }

    get logger() {
        return this._logger;
    }

    execute(state, tracker)
    {
        this._logger.info("[execute] date: %s, count: %s", 
            state.date.toISOString(),
            state.getCount())

        var executionContext = {
            ruleStatuses: {},
            ruleItems: [],
            ruleLogs: [],
            markerItems: []
        }

        return this._fetchRules()
            .then(rules => {
                return tracker.scope("execute", (childTracker) => {
                    return this._processRules(state, rules, executionContext, childTracker);
                });
            })
            .then(() => this._saveRuleData(executionContext))
            .then(() => this._context.ruleCache.acceptExecutionContext(executionContext))
            .then(() => this._context.markerCache.acceptExecutionContext(executionContext))
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

    _processRules(state, rules, executionContext, tracker)
    {
        return Promise.serial(rules, x => {

            return tracker.scope(x.name, (childTracker) => {
                return this._processRule(state, x, executionContext)
            });

        });
    }
    
    _processRule(state, rule, executionContext)
    {
        this.logger.info('[_processRule] Begin: %s', rule.name);
        this.logger.verbose('[_processRule] Begin: ', rule);

        executionContext.ruleStatuses[rule.id] = {
            rule_id: rule.id,
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

                        var ruleItem = {
                            has_error: 0,
                            has_warning: 0
                        };
                        var shouldUseRuleItem = false;

                        if (ruleItemInfo.hasError) {
                            severity = 'error';
                            ruleItem.has_error = 1;
                            shouldUseRuleItem = true;
                        } else if (ruleItemInfo.hasWarning) {
                            severity = 'warn';
                            ruleItem.has_warning = 1;
                            shouldUseRuleItem = true;
                        }

                        if (severity) 
                        {
                            state.raiseAlert(dn, {
                                id: 'rule-' + rule.name,
                                severity: severity,
                                msg: 'Rule ' + rule.name + ' failed.',
                                source: {
                                    kind: 'rule',
                                    id: rule.name
                                }
                            });
                        }

                        if (ruleItemInfo.marks)
                        {
                            for(var marker of _.keys(ruleItemInfo.marks))
                            {
                                state.raiseMarker(dn, marker);
                                shouldUseRuleItem = true;
                                if (!ruleItem.markers) {
                                    ruleItem.markers = [];
                                }
                                ruleItem.markers.push(marker);


                                var markerId = this._context.markerCache.getMarkerId(marker);
                                if (markerId)
                                {
                                    executionContext.markerItems.push({
                                        marker_id: markerId,
                                        dn: dn
                                    });
                                }
                            }
                        }

                        if (shouldUseRuleItem)
                        {
                            executionContext.ruleStatuses[rule.id].item_count++;

                            ruleItem.rule_id = rule.id;
                            ruleItem.dn = dn;
                            executionContext.ruleItems.push(ruleItem);
                        }
                    }
                }
                else
                {
                    this.logger.error('[_processRule] Failed: ', result.messages);

                    for(var msg of result.messages)
                    {
                        executionContext.ruleLogs.push({
                            rule_id: rule.id,
                            kind: 'error',
                            msg: msg
                        });

                        executionContext.ruleStatuses[rule.id].error_count++;
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
                .then(() => this._syncMarkerItems(executionContext));
        });
    }

    _syncRuleStatuses(executionContext)
    {
        this.logger.info('[_syncRuleStatuses] Begin');
        this.logger.debug('[_syncRuleStatuses] Begin', executionContext.ruleStatuses);
        return this._ruleStatusesSynchronizer.execute(_.values(executionContext.ruleStatuses));
    }

    _syncRuleItems(executionContext)
    {
        this.logger.info('[_syncRuleItems] Begin');
        this.logger.debug('[_syncRuleItems] Begin', executionContext.ruleItems);
        return this._ruleItemsSynchronizer.execute(executionContext.ruleItems);
    }

    _syncRuleLogs(executionContext)
    {
        this.logger.info('[_syncRuleLogs] Begin');
        this.logger.debug('[_syncRuleLogs] Begin', executionContext.ruleLogs);
        return this._ruleLogsSynchronizer.execute(executionContext.ruleLogs);
    }

    _syncMarkerItems(executionContext)
    {
        this.logger.info('[_syncRuleItems] Begin');
        this.logger.debug('[_syncRuleItems] Begin', executionContext.markerItems);
        return this._markerItemsSynchronizer.execute(executionContext.markerItems);
    }
    
}

module.exports = RuleProcessor;
