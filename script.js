const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture-btn');
const statusText = document.getElementById('status');

navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => { video.srcObject = stream; })
    .catch(err => {
        statusText.innerText = "Could not access webcam.";
        statusText.style.color = "red";
    });

captureBtn.addEventListener('click', () => {
    statusText.innerText = "Capturing...";
    statusText.style.color = "orange";

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Capture as a compressed string directly
    const base64Image = canvas.toDataURL('image/jpeg', 0.7); 
    sendImageToBackend(base64Image);
});

async function sendImageToBackend(base64String) {
    statusText.innerText = "Sending to Telegram...";

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' }, // Sending raw text
            body: base64String 
        });

        const result = await response.json();

        if (response.ok && result.success) {
            statusText.innerText = "✨ Photo sent successfully!";
            statusText.style.color = "green";
        } else {
            statusText.innerText = `Error: ${result.error || 'Failed to send'}`;
            statusText.style.color = "red";
        }
    } catch (error) {
        statusText.innerText = "Network error occurred.";
        statusText.style.color = "red";
    }
}