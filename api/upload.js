import FormData from 'form-data';

export default async function handler(req, res) {
    // 1. Guard against non-POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        // 2. Guard against missing environment variables
        if (!BOT_TOKEN || !CHAT_ID) {
            console.error("Missing Env Variables!");
            return res.status(500).json({ error: 'Server missing API configuration.' });
        }

        // 3. Extract the base64 string from the parsed JSON body
        const { image } = req.body || {};
        if (!image) {
            return res.status(400).json({ error: 'No image data received in request body' });
        }

        // 4. Convert base64 data back into a binary buffer for Telegram
        const base64Buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');

        // 5. Construct the multipart payload for Telegram
        const telegramForm = new FormData();
        telegramForm.append('chat_id', CHAT_ID);
        telegramForm.append('photo', base64Buffer, {
            filename: 'capture.jpg',
            contentType: 'image/jpeg'
        });

        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
        
        // 6. Send to Telegram using native fetch
        const telegramResponse = await fetch(telegramUrl, {
            method: 'POST',
            body: telegramForm,
            headers: telegramForm.getHeaders()
        });

        const telegramResult = await telegramResponse.json();

        if (telegramResult.ok) {
            return res.status(200).json({ success: true });
        } else {
            console.error("Telegram API rejected photo:", telegramResult);
            return res.status(500).json({ error: telegramResult.description || 'Telegram rejected photo' });
        }

    } catch (error) {
        // This catches any runtime crashes and logs them safely
        console.error("CRITICAL BACKEND ERROR:", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}