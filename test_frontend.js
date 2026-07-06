const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function run() {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Capture console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err));
    
    // Set local storage to mock login
    await page.goto('https://www.appvoz.com/');
    await page.evaluate(() => {
        localStorage.setItem('user', JSON.stringify({
            id: 'test-user-id',
            name: 'Test',
            handle: '@test',
            walletBalance: 0,
            earningsBalance: 0
        }));
    });
    
    // Navigate to profile
    await page.goto('https://www.appvoz.com/profile', { waitUntil: 'networkidle2' });
    
    // Click Settings (gear icon)
    // Actually the profile page has the settings modal toggle, let's find it.
    // The settings button is usually a gear icon. Let's find button that opens settings.
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const gear = btns.find(b => b.textContent.includes('⚙️') || b.innerHTML.includes('⚙️'));
        if (gear) gear.click();
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Now click 'Recargar' (🎁 Recargar)
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const recargar = btns.find(b => b.textContent.includes('Recargar'));
        if (recargar) recargar.click();
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Now click 'Comprar' for a coin pack
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const comprar = btns.find(b => b.textContent.includes('Comprar'));
        if (comprar) comprar.click();
    });
    
    await new Promise(r => setTimeout(r, 4000));
    
    await page.screenshot({ path: 'scratch_error.png' });
    console.log('Done screenshot');
    
    await browser.close();
}
run().catch(console.error);
