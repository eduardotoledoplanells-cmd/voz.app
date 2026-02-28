const https = require('https');

const data = JSON.stringify({
    videoUrl: 'testurl.mp4',
    user: '@usuario',
    description: 'test'
});

const options = {
    hostname: 'server-taupe-six.vercel.app',
    port: 443,
    path: '/api/voz/videos',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, res => {
    let raw = '';
    res.on('data', d => { raw += d; });
    res.on('end', () => {
        console.log("Status:", res.statusCode);
        console.log("Body:", raw);
    });
});
req.on('error', error => { console.error('Error:', error); });
req.write(data);
req.end();
