const fs = require('fs');

async function testUpload() {
    // We will create a dummy audio blob
    const buffer = Buffer.from("dummy audio content");
    const formData = new FormData();
    formData.append('audio', new Blob([buffer], { type: 'audio/m4a' }), 'comment.m4a');
    
    try {
        const fetch = (await import('node-fetch')).default;
        // Wait, node 20+ has global fetch
        const res = await globalThis.fetch('http://localhost:3000/api/voice/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", data);
    } catch(e) {
        console.error(e);
    }
}
testUpload();
