const API_BASE_URL = 'https://server-taupe-six.vercel.app';

async function debugFlow() {
    console.log("--- DEBUGGING VIDEO UPLOAD FLOW ---");

    // 1. Presign
    console.log("\n[1/3] Testing POST /api/media/presign...");
    try {
        const res = await fetch(`${API_BASE_URL}/api/media/presign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: 'test_debug.mp4', fileType: 'video/mp4' })
        });
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text);
        if (text) JSON.parse(text); else console.error("EMPTY!");
    } catch (e) {
        console.error("Presign failed:", e.message);
    }

    // 2. Metadata Save
    console.log("\n[2/3] Testing POST /api/voz/videos...");
    try {
        const videoData = {
            videoUrl: "https://example.com/test.mp4",
            user: "@test",
            description: "Debug test",
            music: "",
            thumbnailUrl: "",
            transcription: []
        };
        const res = await fetch(`${API_BASE_URL}/api/voz/videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(videoData)
        });
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text);
        if (text) JSON.parse(text); else console.error("EMPTY!");
    } catch (e) {
        console.error("Metadata save failed:", e.message);
    }
}

debugFlow();
