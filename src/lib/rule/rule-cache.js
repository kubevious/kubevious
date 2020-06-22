const Promise = require('the-promise');
const _ = require('the-lodash');
const HashUtils = require('kubevious-helpers').HashUtils;

class RuleCache
{
    constructor(context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("RuleCache");
        this._database = context.database;
        this._driver = context.database.driver;

        context.database.onConnect(this._onDbConnected.bind(this));

        this._userRules = [];
        this._ruleConfigDict = {};
        this._ruleExecResultDict = {};
        this._ruleStatusDict = {};
    }

    get logger() {
        return this._logger;
    }

    _onDbConnected()
    {
        this._logger.info("[_onDbConnected] ...");

        return Promise.resolve()
            .then(() => this._refreshRuleConfigs())
            .then(() => this._refreshExecutionStatuses())
            .then(() => this._recalculateRuleList())
            .then(() => this._notifyRulesDetails())
    }

    triggerListUpdate()
    {
        return Promise.resolve()
            .then(() => this._refreshRuleConfigs())
            .then(() => this._recalculateRuleList())
            .then(() => this._notifyRulesDetails())
    }

    _refreshRuleConfigs()
    {
        return this._context.ruleAccessor.queryAll()
            .then(result => {
                this._ruleConfigDict = _.makeDict(result, x => x.name);
            })
            ;
    }

    _recalculateRuleList()
    {
        this._userRules = this._buildRuleList();
        this._listRuleStatuses = this._buildRuleStatusList();
        this._context.websocket.update({ kind: 'rules' }, this._listRuleStatuses);
    }

    queryRuleList()
    {
        return this._userRules;
    }

    queryRuleStatusList()
    {
        return this._listRuleStatuses;
    }

    queryRule(name)
    {
        var rule = this._ruleConfigDict[name];
        if (!rule) {
            return null;
        }
        var userRule = this._buildUserRuleItem(rule);
        return userRule;
    }

    _buildRuleList()
    {
        var userRules = [];
        for(var rule of _.values(this._ruleConfigDict))
        {
            var userRule = {
                name: rule.name
            }
            userRules.push(userRule);
        }
        userRules = _.orderBy(userRules, x => x.name);
        return userRules;
    }

    _buildRuleStatusList()
    {
        var userRules = [];
        for(var rule of _.values(this._ruleConfigDict))
        {
            var userRule = this._buildUserRuleStatusItem(rule);
            userRules.push(userRule);
        }

        userRules = _.orderBy(userRules, x => x.name);

        return userRules;
    }

    _buildUserRuleStatusItem(rule)
    {
        var userRule = {
            name: rule.name,
            enabled: rule.enabled
        }

        var info = this._calcRuleInfo(rule.name);
        _.defaults(userRule, info);

        return userRule;
    }

    _buildUserRuleItem(rule)
    {
        var userRule = {
            name: rule.name,
            target: rule.target,
            script: rule.script,
            enabled: rule.enabled
        }
        return userRule;
    }

    _refreshExecutionStatuses()
    {
        var executionContext = {
            ruleStatuses: {},
            ruleItems: [],
            ruleLogs: []
        }

        return Promise.all([
            this._context.ruleAccessor.queryAllRuleStatuses()
                .then(result => {
                    executionContext.ruleStatuses = _.makeDict(result, x => x.rule_id);
                }),
            this._context.ruleAccessor.queryAllRuleItems()
                .then(result => {
                    executionContext.ruleItems = result;
                }),
            this._context.ruleAccessor.queryAllRuleLogs()
                .then(result => {
                    executionContext.ruleLogs = result;
                })
        ])
        .then(() => this._acceptExecutionContext(executionContext));
    }

    acceptExecutionContext(executionContext)
    {
        this._acceptExecutionContext(executionContext);
        this._recalculateRuleList();
        this._notifyRulesDetails();
    }

    _acceptExecutionContext(executionContext)
    {
        this._ruleExecResultDict = {};

        for(var status of _.values(executionContext.ruleStatuses))
        {
            this._fetchRuleExecResult(status.rule_name).status = status;
            status.hash = status.hash.toString('hex');
            delete status.rule_name;
        }
        for(var item of executionContext.ruleItems)
        {
            this._fetchRuleExecResult(item.rule_name).items.push(item);
            delete item.rule_name;
        }
        for(var log of executionContext.ruleLogs)
        {
            this._fetchRuleExecResult(log.rule_name).logs.push(log);
            delete log.rule_name;
        }
    }

    _notifyRulesDetails()
    {
        this._ruleStatusDict = {};
        for(var ruleResult of _.values(this._ruleExecResultDict))
        {
            this._ruleStatusDict[ruleResult.name] = {
                    name: ruleResult.name,
                    status: this._calcRuleInfo(ruleResult.name),
                    items: ruleResult.items,
                    logs: ruleResult.logs
                }
        }

        var data = _.values(this._ruleStatusDict).map(x => ({
            target: { name: x.name },
            value: x
        }));

        return this._context.websocket.updateScope({ kind: 'rule-status' }, data);
    }

    getRuleStatus(name)
    {
        if (this._ruleStatusDict[name]) {
            return this._ruleStatusDict[name];
        }
        return null;
    }

    _fetchRuleExecResult(name)
    {
        if (!this._ruleExecResultDict[name]) {
            this._ruleExecResultDict[name] = {
                name: name,
                status: null,
                items: [],
                logs: []
            }
        }
        return this._ruleExecResultDict[name];
    }

    _calcRuleInfo(name)
    {
        var info = {
            isCurrent: false,
            error_count: 0,
            item_count: 0
        };

        var ruleConfig = this._ruleConfigDict[name];
        if (ruleConfig)
        {
            if (ruleConfig.enabled)
            {
                var ruleResult = this._ruleExecResultDict[name];
                if (ruleResult)
                {
                    var status = ruleResult.status;
                    if (status)
                    {
                        if (ruleConfig.hash == status.hash) {
                            info.isCurrent = true;
                        }
                        info.error_count = status.error_count;
                        info.item_count = status.item_count;
                    }
                }
            }
            else
            {
                info.isCurrent = true;
            }
            
        }
        
        return info;
    }
}

module.exports = RuleCache;