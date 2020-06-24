const _ = require('the-lodash');

module.exports = function(meta) {
    meta
    .table('rules')
        .key('name')
            .settable()
        .field('target')
        .field('script')
        .field('date')
        .field('enabled')
            .from(value => value ? true : false)
        .field('hash')
            .to(value => _.isString(value) ? Buffer.from(value, 'hex') : value)
            .from(value => value ? value.toString('hex') : null)

    .table('rule_statuses')
            .key('id')
            .field('rule_name')
            .field('hash')
                .to(value => _.isString(value) ? Buffer.from(value, 'hex') : value)
                .from(value => value ? value.toString('hex') : null)
            .field('date')
            .field('error_count')
            .field('item_count')
 
    .table('rule_items')
        .key('id')
        .field('rule_name')
        .field('dn')
        .field('errors')
        .field('warnings')
        .field('markers')

    .table('rule_logs')
        .key('id')
        .field('rule_name')
        .field('kind')
        .field('msg')
        
}