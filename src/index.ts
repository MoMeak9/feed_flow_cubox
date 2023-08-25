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

async function getFeedContent({xmlUrl, title, category, type}: IFeedContent): Promise<{
    title: string;
    content: Awaited<IResultValue | string>[]
}> {
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
                    msg: '已录入',
                });
            }
        })


        return {
            title,
            content: await Promise.all(createPromises)
        };
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

interface ISubSolutionItem {
    title: string;
    subNewCount: number;
    subSuccessCount: number;
    subFailCount: number;
    total: number;
    items: any[]
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
    const solution = {
        successCount: 0,
        failCount: 0,
        subSolutionItem: [] as ISubSolutionItem[]
    }
    allResult.forEach((item, _,array) => {
        const subSolution = {
            title: '',
            subNewCount: 0,
            subSuccessCount: 0,
            subFailCount: 0,
            total: array.length,
            items: [] as any[]
        };
        if (item.status === 'fulfilled') {
            solution.successCount++;
        } else {
            solution.failCount++;
        }
        // 执行结果
        if (item.status !== "rejected") {
            subSolution.title = item.value.title
            // 成功 ｜ 失败数据
            item.value.content.forEach(subItem => {
                if (typeof subItem !== 'string' && !subItem.status) {
                    subItem.msg !== '已录入' && subSolution.subNewCount++;
                    subSolution.subSuccessCount++;
                } else {
                    subSolution.subFailCount++;
                }
                subSolution.items.push(subItem)
            })
        }
        solution.subSolutionItem.push(<ISubSolutionItem>subSolution)
    })
    console.log(success('执行结果：'));
    console.log(`成功：${solution.successCount}，失败：${solution.failCount}，总计：${total}`);
    solution.subSolutionItem.forEach(item => {
        console.log(item.title,'：', item.subNewCount, item.subSuccessCount, item.subFailCount)
    })
    console.log('=====================');
    await dataSource.destroy();
})

