const Promise = require('the-promise');
const _ = require('the-lodash');
const KubikRuleProcessor = require('kubevious-kubik').RuleProcessor;

class RuleProcessor
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("RuleProcessor");
        context.database.onConnect(this._onDbConnected.bind(this));
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

        return this._fetchRules()
            .then(rules => this._processRules(state, rules))
    }

    _fetchRules()
    {
        return this._context.ruleAccessor
            .queryEnabledRules()
            .then(result => {
                return result;
            });
    }

    _processRules(state, rules)
    {
        return Promise.serial(rules, x => this._processRule(state, x));
    }
    
    _processRule(state, rule)
    {
        this.logger.info('[_processRule] ', rule);

        var processor = new KubikRuleProcessor(state, rule);
        return processor.process()
            .then(result => {
                this.logger.verbose('[_processRule] RESULT: ', result);

                console.log(result);
                if (result.success)
                {
                    for(var dn of _.keys(result.ruleItems))
                    {
                        var severity = null;
                        var ruleItemInfo = result.ruleItems[dn];

                        if (ruleItemInfo.hasError) {
                            severity = 'error';
                        } else if (ruleItemInfo.hasWarning) {
                            severity = 'error';
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
                        }
                    }
                }
            });
    }
    
}

module.exports = RuleProcessor;
