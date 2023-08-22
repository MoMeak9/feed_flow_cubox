import Parser from "rss-parser";

const parser = new Parser({
    defaultRSS: 1.0,
    timeout: 10000,
});

// 数据库服务
const {SubscriptionService, dataSource} = require('./subscription.service');
const subscriptionService = new SubscriptionService();


// cubox链接
const cuboxUrl = 'https://cubox.pro/c/api/save/dpsle366u15dhu'

interface IFeedContent {
    xmlUrl: string;
    title: string;
    category: string;
    type: string;
}

async function getFeedContent({xmlUrl, title, category, type}: IFeedContent) {
    try {
        const feed = await parser.parseURL(xmlUrl);
        console.log(feed.title);
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
        const createPromises = feedContents.map(async (content) => {
            const entity = {
                title: content.title,
                link: content.content,
            }
            const existItem = await subscriptionService.findByTitleAndLink(entity);
            if (!existItem) {
                const res = await saveContent(content as any);
                // 获取响应信息
                try {
                    const resJson = await res.json();
                    if (resJson.code === -3030) {
                        console.log('cubox error:\n', resJson);
                        return Promise.reject('cubox error');
                    }
                    return subscriptionService.create({
                        title: content.title?.toString(),
                        link: content.content,
                    });
                } catch (error) {
                    console.error(`${title} Error:`, error);
                    return Promise.reject('cubox error');
                }
            } else {
                return Promise.resolve('exist');
            }
        })
        const result = await Promise.all(createPromises);
        console.log(result)
    } catch (error) {
        console.error(`${title} Error:`, error);
    }
}

interface IRssContent {
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

import readFeeds from './readFeeds'

interface IFeedObject {
    title:string;
    xmlUrl:string;
    category:string;
    type:string;
}
// @ts-ignore
readFeeds("Feeds.xml").then(async (feedObjects: IFeedObject[]) => {
    const filterResult = feedObjects.filter(item => {
        return item.title != null && item.xmlUrl != null;
    })

    await dataSource.initialize();
    await Promise.allSettled(filterResult.map(obj => getFeedContent(obj)))
    await dataSource.destroy();
})

