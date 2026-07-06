async function getEnv() {
    try {
        const res = await fetch('https://www.appvoz.com/api/voz/debug/env');
        const data = await res.json();
        console.log('Production Env Vars:', data);
    } catch (e) {
        console.error(e);
    }
}
getEnv();
