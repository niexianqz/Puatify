const axios = require('axios');

// ข้อมูลจาก GitHub Secrets
const LINE_TOKEN = process.env.LINE_ACCESS_TOKEN;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;
const RSS_JSON_URL = "https://rss.app/feeds/v1.1/86OgZH1IGruJ0DEX.json";

async function startBot() {
    try {
        const response = await axios.get(RSS_JSON_URL);
        const items = response.data.items;

        if (items.length > 0) {
            const latest = items[0]; // ดึงโพสต์ล่าสุด
            const message = `\n📢 ประชาสัมพันธ์ใหม่!\n📌 ${latest.title}\n🔗 ${latest.url}`;

            // 1. ส่งเข้า Line Notify
            await axios.post('https://notify-api.line.me/api/notify', 
                `message=${encodeURIComponent(message)}`, 
                { headers: { 'Authorization': `Bearer ${LINE_TOKEN}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            // 2. ส่งเข้า Discord
            await axios.post(DISCORD_WEBHOOK, { content: message });
            
            console.log("ส่งแจ้งเตือนเรียบร้อยแล้ว!");
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

startBot();