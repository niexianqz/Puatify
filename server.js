require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// --- ตั้งค่า Discord Webhook (เอา URL มาใส่ตรงนี้) ---
const DISCORD_WEB_HOOK_URL = 'https://discord.com/api/webhooks/1484059245014945953/O_HgrcytGJvOvUJGVHiYoF4CPJcpZIIL4Pt-SE-GmRfvkLb4cltfUfVZ1W-yAMrE4ewI';

// --- ตั้งค่า Database (SQLite) ---
const db = new sqlite3.Database('./school.db');
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT, 
        time TEXT, 
        room TEXT
    )`);
});

// 1. API ดึงข่าวจาก Facebook (ผ่าน rss.app JSON)
app.get('/api/news', async (req, res) => {
    try {
        const response = await axios.get('https://rss.app/feeds/v1.1/86OgZH1IGruJ0DEX.json');
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
    }
});

// 2. API สำหรับ Admin เพิ่มตารางเรียน
app.post('/api/admin/schedule', (req, res) => {
    const { subject, time, room } = req.body;
    db.run(`INSERT INTO schedules (subject, time, room) VALUES (?, ?, ?)`, [subject, time, room], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// 3. ระบบแจ้งเตือนอัตโนมัติ (เช็คทุกนาที)
cron.schedule('* * * * *', () => {
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                        now.getMinutes().toString().padStart(2, '0');

    db.all(`SELECT * FROM schedules WHERE time = ?`, [currentTime], (err, rows) => {
        if (rows && rows.length > 0) {
            rows.forEach(item => {
                sendDiscordMsg(`📢 **แจ้งเตือนเวลาเรียน!**\n📖 วิชา: ${item.subject}\n⏰ เวลา: ${item.time} น.\n📍 ห้อง: ${item.room}`);
            });
        }
    });
});

// ฟังก์ชันส่งเข้า Discord
async function sendDiscordMsg(msg) {
    try {
        await axios.post(DISCORD_WEB_HOOK_URL, { content: msg });
        console.log('ส่ง Discord สำเร็จ');
    } catch (err) {
        console.error('Discord Error');
    }
}

app.listen(3000, () => console.log('🚀 Server is running on http://localhost:3000'));