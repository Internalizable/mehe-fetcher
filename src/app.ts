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
const baseChatId = process.env.GROUP_CHAT_ID;
const secondaryGroupId = process.env.FAMILY_GROUP_CHAT_ID;

const URLs =
    ['https://mobile.mehe.gov.lb:81/Candidate/get?lang=2&year=2023&sectionCode=SG&sessionCode=NM&candidateNumber=90192',
        'https://mobile.mehe.gov.lb:81/Candidate/get?lang=2&year=2023&sectionCode=SV&sessionCode=NM&candidateNumber=90437'];
const chatIds = [baseChatId, secondaryGroupId];

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

    const media = await MessageMedia.fromUrl('https://i.imgur.com/KJqdCFX.png');

    for (const chatId of chatIds) {
        await client.sendMessage(chatId!, media, {caption: "👋 MEHE FETCHER BOT - LIVE ✅\nCurrently listening..."});
    }

    cron.schedule('*/3 * * * * *', () => {
        URLs.forEach(url => {
            fetch(url, {
                headers: {
                    'Authorization': `Bearer ${BEARER_TOKEN}`
                }
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log("data_" + url, data);
                    console.log("endsWith_" + url, url.endsWith("90192"));

                    if(url.endsWith("90192")) {
                        if (data !== null) {
                            client.sendMessage(baseChatId!, JSON.stringify(data));
                        }
                    } else {
                        if (data !== null) {
                            client.sendMessage(secondaryGroupId!, JSON.stringify(data));
                        }
                    }
                })
                .catch((error) => {
                    console.error('Error fetching the URL:', error);
                });
        })
    });

    console.log(`Server running on http://localhost:${port}`);
});
