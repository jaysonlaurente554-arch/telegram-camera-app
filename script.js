const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture-btn');
const statusText = document.getElementById('status');

// 1. Request access to the user's camera
navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        console.error("Error accessing camera: ", err);
        statusText.innerText = "Could not access webcam. Please grant permissions.";
        statusText.style.color = "red";
    });

// 2. Handle the button click event
captureBtn.addEventListener('click', () => {
    statusText.innerText = "Capturing image...";
    statusText.style.color = "orange";

    const context = canvas.getContext('2d');
    // Draw the current video frame onto the hidden canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas drawing into a Blob (Binary Large Object) image
    canvas.toBlob((blob) => {
        if (!blob) {
            statusText.innerText = "Failed to capture image.";
            return;
        }
        
        // Send this blob data to our backend Vercel Serverless Function
        sendImageToBackend(blob);
    }, 'image/jpeg');
});

// 3. Send the image file to our backend server
async function sendImageToBackend(imageBlob) {
    statusText.innerText = "Sending to Telegram...";
    
    // Package the file into a FormData object (standard way to upload files)
    const formData = new FormData();
    formData.append('photo', imageBlob, 'capture.jpg');

    try {
        // We will target our local/Vercel serverless function endpoint
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            statusText.innerText = "✨ Photo sent successfully to Telegram!";
            statusText.style.color = "green";
        } else {
            statusText.innerText = `Error: ${result.error || 'Failed to send'}`;
            statusText.style.color = "red";
        }
    } catch (error) {
        console.error("Network error:", error);
        statusText.innerText = "Network error occurred.";
        statusText.style.color = "red";
    }
}