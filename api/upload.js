import FormData from 'form-data';

// Helper function to manually read the raw body stream from the request
async function readRequestBody(req) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
}

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

        // Manually read the raw text stream sent from the frontend
        const rawBody = await readRequestBody(req);
        
        if (!rawBody) {
            return res.status(400).json({ error: 'Empty request body received.' });
        }

        // Manually parse the text into a JSON object
        const parsedBody = JSON.parse(rawBody);
        const { image } = parsedBody;

        if (!image) {
            return res.status(400).json({ error: 'No image data key found in payload.' });
        }

        // Clean up the base64 string and turn it into a binary buffer
        const base64Buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');

        // Package data for Telegram
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