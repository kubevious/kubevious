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
                this._ruleConfigDict = _.makeDict(result, x => x.id);
            })
            ;
    }

    _recalculateRuleList()
    {
        this._userRules = this._buildRuleList();
        this._context.websocket.update({ kind: 'rules' }, this._userRules);
    }

    queryRuleList()
    {
        return this._userRules;
    }

    queryRule(id)
    {
        var rule = this._ruleConfigDict[id];
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
            var userRule = this._buildUserRuleListItem(rule);
            userRules.push(userRule);
        }

        userRules = _.orderBy(userRules, x => x.name);

        return userRules;
    }

    _buildUserRuleListItem(rule)
    {
        var userRule = {
            id: rule.id,
            name: rule.name,
            enabled: rule.enabled
        }

        var info = this._calcRuleInfo(rule.id);
        _.defaults(userRule, info);

        return userRule;
    }


    _buildUserRuleItem(rule)
    {
        var userRule = this._buildUserRuleListItem(rule);
        userRule.target = rule.target;
        userRule.script = rule.script;
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
            this._fetchRuleExecResult(status.rule_id).status = status;
            status.hash = status.hash.toString('hex');
            delete status.rule_id;
        }
        for(var item of executionContext.ruleItems)
        {
            this._fetchRuleExecResult(item.rule_id).items.push(item);
            delete item.rule_id;
        }
        for(var log of executionContext.ruleLogs)
        {
            this._fetchRuleExecResult(log.rule_id).logs.push(log);
            delete log.rule_id;
        }
    }

    _notifyRulesDetails()
    {
        this._ruleStatusDict = {};
        for(var ruleResult of _.values(this._ruleExecResultDict))
        {
            this._ruleStatusDict[ruleResult.id] = {
                    id: ruleResult.id,
                    status: this._calcRuleInfo(ruleResult.id),
                    items: ruleResult.items,
                    logs: ruleResult.logs
                }
        }

        var data = _.values(this._ruleStatusDict).map(x => ({
            target: { id: x.id },
            value: x
        }));

        return this._context.websocket.updateScope({ kind: 'rule-status' }, data);
    }

    getRuleStatus(id)
    {
        if (this._ruleStatusDict[id]) {
            return this._ruleStatusDict[id];
        }
        return null;
    }

    _fetchRuleExecResult(id)
    {
        if (!this._ruleExecResultDict[id]) {
            this._ruleExecResultDict[id] = {
                id: id,
                status: null,
                items: [],
                logs: []
            }
        }
        return this._ruleExecResultDict[id];
    }

    _calcRuleInfo(id)
    {
        var info = {
            isCurrent: false,
            error_count: 0,
            item_count: 0
        };

        var ruleConfig = this._ruleConfigDict[id];
        if (ruleConfig)
        {
            var ruleResult = this._ruleExecResultDict[id];
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
        
        return info;
    }
}

module.exports = RuleCache;