async function pingRoute() {
    console.log("Pinging the new API...");
    try {
        const response = await fetch("http://localhost:3000/api/voz/users/profile?handle=@testerror");
        if (response.ok) {
            const data = await response.json();
            console.log("Success! Data received:", JSON.stringify(data, null, 2));
        } else {
            console.log("Failed with status:", response.status);
            console.log(await response.text());
        }
    } catch (e) {
        console.error("Error pinging:", e);
    }
}
pingRoute();
