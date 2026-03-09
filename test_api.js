const test = async () => {
    try {
        const res = await fetch('https://server-taupe-six.vercel.app/api/voz/users/report', {
            method: 'POST',
            body: JSON.stringify({ reporterHandle: '@test1', reportedHandle: '@test2', reason: 'Spam', type: 'profile' }),
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('Status:', res.status);
        console.log('Text:', await res.text());
    } catch (e) {
        console.log("Error:", e);
    }
};
test();
