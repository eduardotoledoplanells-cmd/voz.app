async function test() {
    const res = await fetch('https://www.appvoz.com/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: 'p2', userId: 'test', userHandle: 'test' })
    });
    const text = await res.text();
    console.log(res.status, text);
}
test();
