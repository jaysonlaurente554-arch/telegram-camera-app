import FormData from 'form-data';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            console.error("Missing Env Variables!");
            return res.status(500).json({ error: 'Server missing API configuration.' });
        }

        // --- FIX IS HERE ---
        // If Vercel didn't parse req.body automatically, we check if it's a string and parse it manually.
        let body = req.body;
        if (typeof req.body === 'string') {
            try {
                body = JSON.parse(req.body);
            } catch (e) {
                console.error("Failed to parse body string:", e);
            }
        }

        // Fallback to an empty object if body is still null/undefined
        const { image } = body || {};
        
        if (!image) {
            return res.status(400).json({ error: 'No image data received in request body' });
        }
        // --------------------

        const base64Buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');

        const telegramForm = new FormData();
        telegramForm.append('chat_id', CHAT_ID);
        telegramForm.append('photo', base64Buffer, {
            filename: 'capture.jpg',
            contentType: 'image/jpeg'
        });

        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
        
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
        console.error("CRITICAL BACKEND ERROR:", error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}