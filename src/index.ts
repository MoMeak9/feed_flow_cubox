import Parser from "rss-parser";
import dotenv from 'dotenv';
import * as path from "path";
import fetch from "node-fetch";
import {error, success} from "./log.ts";

dotenv.config({
    path: path.resolve(process.cwd(), '.env')
});

const parser = new Parser({
    defaultRSS: 2.0,
    timeout: 10000,
});

// 数据库服务
import {SubscriptionService, dataSource} from './DB/subscription.service.ts';
const subscriptionService = new SubscriptionService();


// cubox链接
const cuboxUrl = process.env.CUTBOX_URL
if (!cuboxUrl) {
    console.error('CUTBOX_URL is not set');
    console.log('Please set CUTBOX_URL in .env file',process.env)
    process.exit(1);
}

interface IFeedContent {
    xmlUrl: string;
    title: string;
    category: string;
    type: string;
}

async function getFeedContent({xmlUrl, title, category, type}: IFeedContent): Promise<(IResultValue | string)[]> {
    try {
        const feed = await parser.parseURL(xmlUrl);
        console.log(success('开始获取订阅：'), feed.title || '未命名');
        const feedContents = feed.items.map(item => {
            return {
                type: 'url',
                title: item.title,
                content: item.link,
                description: item.contentSnippet,
                tags: [category, feed.title],
                folder: "RSS",
            }
        });
        const createPromises = feedContents.map(async (content): Promise<IResultValue | string> => {
            const entity = {
                title: content.title || '',
                link: content.content || '',
            }
            const existItem = await subscriptionService.findByTitleAndLink(entity);
            if (!existItem) {
                const res = await saveContent(content as any);
                // 获取响应信息
                const resJson = await res.json() as any;
                if (resJson.code === -3030) {
                    throw new Error('Cubox error：' + resJson.message);
                }
                return subscriptionService.create(<IRssContent>{
                    title: content.title?.toString(),
                    link: content.content,
                });
            } else {
                return Promise.resolve({
                    status: 0,
                    msg: '已经录入',
                });
            }
        })


        return await Promise.all(createPromises);
    } catch (e) {
        console.log('=====================');
        console.error(error(`${title} Error:\n`), e.message);
        console.log('=====================');
        if (e.message.includes('Cubox error')) {
            console.log(error('超出Cubox限制，程序退出'))
            process.exit(1);
        }
        return Promise.reject('Error' + e.message);
    }
}

export interface IRssContent {
    title: string;
    link: string;
}

const saveContent = async (content: IRssContent) => {
    return await fetch(cuboxUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
    });
}

import readFeeds from './readFeeds.ts'

interface IFeedObject {
    title: string;
    xmlUrl: string;
    category: string;
    type: string;
}

interface ISolution {
    title: string;
    success: number;
    fail: number;
    total: number;
    failDetail: string[];
}

interface IResultValue {
    status: number;
    msg: string;
}

// @ts-ignore
readFeeds("Feeds.xml").then(async (feedObjects: IFeedObject[]) => {
    const filterResult = feedObjects.filter(item => {
        return item.title != null && item.xmlUrl != null;
    })

    await dataSource.initialize();
    const allResult = await Promise.allSettled(filterResult.map(async obj => await getFeedContent(obj)))
    console.log('=====================');
    // 总计执行
    const total = allResult.length
    // 成功 | 失败执行
    let successCount = 0;
    let failCount = 0;
    const solution = [];
    allResult.forEach(item => {
        if (item.status === 'fulfilled') {
            successCount++;
        } else {
            failCount++;
        }
        // 执行结果
        if (item.status !== "rejected") {
            // 成功 ｜ 失败数据
            let subSuccessCount = 0;
            let subFailCount = 0;
            item.value.forEach(subItem => {
                if (typeof subItem !== 'string' && subItem.status === 0) {
                    subSuccessCount++;
                } else {
                    subFailCount++;
                }
            })
        }
    })
    console.log(success('执行结果：\n'));
    console.log(`成功：${successCount}，失败：${failCount}，总计：${total}`);
    console.log('=====================');
    await dataSource.destroy();
})

