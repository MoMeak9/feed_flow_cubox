import typeorm from 'typeorm'
import {SubscriptionEntity} from './subscription.entity.ts'

import {IRssContent} from '../index'
import dotenv from "dotenv";
import path from "path";

dotenv.config({
    path: path.resolve(process.cwd(), '.env')
});

export const dataSource = new typeorm.DataSource({
    url: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/test',
    type: 'mysql',
    synchronize: true,
    logging: false,
    entities: [
        SubscriptionEntity
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

    async create({title, link}:IRssContent) {
        return await this.repository.save({
            title,
            link,
        });
    }

    async findByTitleAndLink({title, link}:IRssContent) {
        return await this.repository.findOne({
            where: {
                title,
                link,
            }
        });
    }
}
