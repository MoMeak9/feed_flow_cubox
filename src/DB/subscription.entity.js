// subscription.entity.js

const { EntitySchema } = require('typeorm');

const SubscriptionEntity = new EntitySchema({
    name: 'Subscription',

    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: true,
        },
        title: {
            type: 'varchar',
            length: 255, // 设置适当的长度
            charset: 'utf8mb4', // 设置字符集为 utf8mb4
            collation: 'utf8mb4_unicode_ci', // 设置排序规则
            default: '',
        },
        link: {
            type: 'varchar',
            length: 255, // 设置适当的长度
            charset: 'utf8mb4', // 设置字符集为 utf8mb4
            collation: 'utf8mb4_unicode_ci', // 设置排序规则
            default: '',
        },
    },
});

module.exports = SubscriptionEntity;
