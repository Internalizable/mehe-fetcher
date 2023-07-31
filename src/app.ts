import express from 'express';
import {Client, LocalAuth, MessageMedia} from "whatsapp-web.js";
import cron from "node-cron";
import dotenv from 'dotenv';
import qrcode from 'qrcode-terminal'
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT;
const BEARER_TOKEN = process.env.BEARER_TOKEN;
const chatId = process.env.GROUP_CHAT_ID;

const URL = 'https://mobile.mehe.gov.lb:81/Candidate/get?lang=2&year=2023&sectionCode=SG&sessionCode=NM&candidateNumber=90192';

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, async () => {
    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }
    });

    client.on('qr', qr => {
        qrcode.generate(qr, {small: true});
    });

    client.on('ready', () => {
        console.log('Client is ready!');
    });

    await client.initialize();

    const media = await MessageMedia.fromUrl('https://repository-images.githubusercontent.com/171072967/f0240000-b107-11ea-8c2e-02755c9b1505');
    await client.sendMessage(chatId!, media, {caption: "👋 MEHE FETCHER BOT - LIVE ✅"});

    let isSent = false;
    cron.schedule('*/5 * * * * *', () => {
        fetch(URL, {
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`
            }
        })
            .then((response) => response.json())
            .then((data) => {
                console.log("data", data);

                if (data !== null && !isSent) {
                    client.sendMessage(chatId!, JSON.stringify(data));
                    isSent = true;
                }
            })
            .catch((error) => {
                console.error('Error fetching the URL:', error);
            });
    });

    console.log(`Server running on http://localhost:${port}`);
});
