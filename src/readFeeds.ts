import fs from 'fs'

const XmlReader = require('xml-reader');
const readFeeds = (path: string) => {
    const reader = XmlReader.create({stream: true});
    return new Promise((resolve, reject) => {
        fs.readFile(path, function (err, opml) {
            const feedUrls = [] as any [];
            if (!err) {
                reader.on('tag:outline', (data: any) => {
                    feedUrls.push(data.attributes)
                });
                reader.parse(opml.toString());
            } else {
                reject(err);
            }
            resolve(feedUrls);
        });
    })
}

export default readFeeds
