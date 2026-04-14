async function testPurchase() {
    try {
        console.log("Fetching live create-coin-pack-payment-intent data from Vercel...");
        const res = await fetch("https://server-taupe-six.vercel.app/api/voz/purchase", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: "295a2106-f2b6-4c5f-8bf7-d7014d2b7696", // @testerror's ID
                packId: "p1",
                amount: 10
            }),
            cache: "no-store"
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Headers:", res.headers);
        console.log("Body:", text);
    } catch (e) {
        console.error("Error:", e);
    }
}
testPurchase();
