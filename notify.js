const axios = require('axios');

const LINE_TOKEN = process.env.LINE_ACCESS_TOKEN;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
const RSS_URL = "https://rss.app/feeds/v1.1/86OgZH1IGruJ0DEX.json";

async function runBot() {
    try {
        const res = await axios.get(RSS_URL);
        const latestPost = res.data.items[0];

        if (!latestPost) return;

        const message = `\n📢 ประกาศใหม่จากโรงเรียน!\n────────────────\n📌 ${latestPost.title}\n🔗 อ่านต่อ: ${latestPost.url}`;

        // ส่งเข้า Discord
        if (DISCORD_WEBHOOK) {
            await axios.post(DISCORD_WEBHOOK, { content: message });
        }

        // ส่งเข้า LINE
        if (LINE_TOKEN) {
            await axios.post('https://notify-api.line.me/api/notify', 
                `message=${encodeURIComponent(message)}`, 
                { headers: { 'Authorization': `Bearer ${LINE_TOKEN}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
        }
        console.log("Notified successfully!");
    } catch (err) {
        console.error("Error running bot:", err.message);
    }
}

runBot();
