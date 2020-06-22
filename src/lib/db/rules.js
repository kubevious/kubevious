module.exports = function(meta) {
    meta
    .table('rules')
        .key('name')
            .settable()
        .field('target')
        .field('script')
        .field('enabled')
            .from(value => value ? true : false)
        .field('hash')
            .from(value => value.toString('hex'))

    .table('rule_statuses')
            .key('id')
            .field('rule_name')
            .field('hash')
                .from(value => value.toString('hex'))
            .field('date')
            .field('error_count')
            .field('item_count')
 
    .table('rule_items')
        .key('id')
        .field('rule_name')
        .field('dn')
        .field('has_error')
        .field('has_warning')
        .field('markers')

    .table('rule_logs')
        .key('id')
        .field('rule_name')
        .field('kind')
        .field('msg')
        
}