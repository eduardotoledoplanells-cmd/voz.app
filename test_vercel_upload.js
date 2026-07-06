async function testUploadVercel() {
    const buffer = Buffer.from("dummy audio content");
    const formData = new FormData();
    formData.append('audio', new Blob([buffer], { type: 'audio/m4a' }), 'comment.m4a');
    
    try {
        const res = await fetch('https://www.appvoz.com/api/voice/upload', {
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
testUploadVercel();
