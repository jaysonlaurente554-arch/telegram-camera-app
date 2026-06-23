import FormData from 'form-data';

// This single line tells Vercel to use the modern Web Edge/Serverless runtime,
// allowing us to use standard methods like req.text() instead of raw streams.
export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            return new Response(JSON.stringify({ error: 'Server missing API configuration.' }), { status: 500 });
        }

        // Clean, native way to read the plain text payload without manual stream parsing
        const base64Data = await req.text();
        
        if (!base64Data || !base64Data.includes('base64,')) {
            return new Response(JSON.stringify({ error: 'Invalid or missing image stream data' }), { status: 400 });
        }

        // Extract the pure base64 characters
        const cleanBase64 = base64Data.split('base64,')[1];
        
        // Convert base64 string to a binary blob for the Telegram payload
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const imageBlob = new Blob([byteArray], { type: 'image/jpeg' });

        // Package data for Telegram using standard FormData
        const telegramForm = new globalThis.FormData();
        telegramForm.append('chat_id', CHAT_ID);
        telegramForm.append('photo', imageBlob, 'capture.jpg');

        // Send to Telegram using global fetch
        const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: telegramForm
        });

        const telegramResult = await telegramResponse.json();

        if (telegramResult.ok) {
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({ error: telegramResult.description || 'Telegram rejected photo' }), { status: 500 });
        }

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
    }
}