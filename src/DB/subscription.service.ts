import typeorm from 'typeorm'
require('dotenv').config({
    path: '../../.env'
});

export const dataSource = new typeorm.DataSource({
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

export class SubscriptionService {
    repository: any
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
