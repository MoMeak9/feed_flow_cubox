import typeorm from 'typeorm'
require('dotenv').config();

const dataSource = new typeorm.DataSource({
    url: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/test',
    type: 'mysql',
    synchronize: true,
    logging: false,
    entities: [
        require('./subscription.entity'),
    ],
    migrations: [],
    subscribers: [],
    extra: {
        charset: "utf8mb4_unicode_ci"
    }
});

class SubscriptionService {
    constructor() {
        this.repository = dataSource.getRepository("Subscription");
    }

    async create({title, link}) {
        return await this.repository.save({
            title,
            link,
        });
    }

    async findByTitleAndLink({title, link}) {
        return await this.repository.findOne({
            where: {
                title,
                link,
            }
        });
    }
}

module.exports = {
    SubscriptionService,
    dataSource,
};
