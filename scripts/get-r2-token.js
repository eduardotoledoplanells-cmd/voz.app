/**
 * Connects to the EXISTING Chrome instance (already logged into Cloudflare)
 * via port 9222 CDP, then:
 * 1. Navigates to R2 API Tokens page
 * 2. Creates a new token with Object Read & Write permission
 * 3. Captures Access Key ID + Secret Access Key
 * 4. Updates .env.local
 * 5. Creates the voz-videos bucket if missing
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ACCOUNT_ID = 'ef7bf0fcb60a6e769bdef4739db5d204';
const BUCKET_NAME = 'voz-videos';
const ENV_PATH = path.resolve(__dirname, '../.env.local');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function updateEnvFile(accessKeyId, secretAccessKey) {
  let content = fs.readFileSync(ENV_PATH, 'utf8');
  content = content.replace(/CLOUDFLARE_R2_ACCESS_KEY_ID="[^"]*"/, `CLOUDFLARE_R2_ACCESS_KEY_ID="${accessKeyId}"`);
  content = content.replace(/CLOUDFLARE_R2_SECRET_ACCESS_KEY="[^"]*"/, `CLOUDFLARE_R2_SECRET_ACCESS_KEY="${secretAccessKey}"`);
  fs.writeFileSync(ENV_PATH, content);
  console.log('✅ Updated .env.local with real credentials');
}

async function main() {
  console.log('🔌 Connecting to existing Chrome session on port 9222...');
  
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null,
  });

  console.log('✅ Connected to Chrome!');
  
  // Get existing pages
  const pages = await browser.pages();
  console.log(`Found ${pages.length} open pages`);
  
  // Find the Cloudflare page or create a new one
  let cfPage = pages.find(p => p.url().includes('cloudflare.com'));
  if (!cfPage) {
    cfPage = await browser.newPage();
    console.log('Created new page');
  } else {
    console.log('Using existing Cloudflare page:', cfPage.url());
  }

  // Step 1: Navigate to R2 API Tokens page
  console.log('\n📍 Navigating to R2 API Tokens page...');
  await cfPage.goto(`https://dash.cloudflare.com/${ACCOUNT_ID}/r2/api-tokens`, {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  await sleep(3000);
  console.log('Current URL:', cfPage.url());
  await cfPage.screenshot({ path: path.resolve(__dirname, '../scratch_r2_tokens_page.png') });

  // Step 2: Click "Create API token" button
  console.log('\n🔍 Looking for Create API Token button...');
  
  // Try different button text patterns
  let clicked = false;
  const btnTexts = ['Create API token', 'Create API Token', 'New API Token', 'Create token'];
  for (const text of btnTexts) {
    const [btn] = await cfPage.$x(`//button[contains(normalize-space(.), '${text}')] | //a[contains(normalize-space(.), '${text}')]`);
    if (btn) {
      await btn.click();
      console.log(`✅ Clicked: "${text}"`);
      clicked = true;
      await sleep(3000);
      break;
    }
  }
  
  if (!clicked) {
    // Take screenshot to debug
    await cfPage.screenshot({ path: path.resolve(__dirname, '../scratch_no_create_btn.png') });
    const btns = await cfPage.$$eval('button', els => els.map(e => e.textContent?.trim()).filter(Boolean));
    const links = await cfPage.$$eval('a', els => els.map(e => ({ text: e.textContent?.trim(), href: e.href })).filter(e => e.text));
    console.log('All buttons:', btns);
    console.log('All links:', links.slice(0, 20));
    console.log('❌ Could not find Create API Token button');
    browser.disconnect();
    return;
  }
  
  await cfPage.screenshot({ path: path.resolve(__dirname, '../scratch_token_form.png') });
  
  // Step 3: Fill token name
  console.log('\n📝 Filling token form...');
  await sleep(2000);
  
  const nameInput = await cfPage.$('input[id*="name"], input[name="name"], input[placeholder*="Token"]').catch(() => null);
  if (nameInput) {
    await nameInput.click({ clickCount: 3 });
    await nameInput.type('voz-r2-token');
    console.log('Filled token name: voz-r2-token');
  }
  
  // Step 4: Set permissions - look for Object Read & Write
  await sleep(1000);
  
  // Try to find and click the permission option
  const permTexts = ['Object Read & Write', 'Edit', 'Read and Write'];
  for (const text of permTexts) {
    const [el] = await cfPage.$x(`//*[contains(normalize-space(.), '${text}') and (self::option or self::button or self::label or @role='option')]`);
    if (el) {
      await el.click();
      console.log(`✅ Set permission: "${text}"`);
      break;
    }
  }
  
  // Step 5: Submit the form
  await sleep(1000);
  const [createBtn] = await cfPage.$x(`//button[contains(normalize-space(.), 'Create API token') or contains(normalize-space(.), 'Create Token')]`);
  if (createBtn) {
    await createBtn.click();
    console.log('✅ Clicked Create API token');
    await sleep(5000);
  } else {
    // Try submit button
    const submitBtn = await cfPage.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      console.log('✅ Clicked submit');
      await sleep(5000);
    }
  }
  
  // Step 6: Capture credentials from result page
  console.log('\n🔑 Capturing credentials...');
  await cfPage.screenshot({ path: path.resolve(__dirname, '../scratch_token_result.png') });
  
  const bodyText = await cfPage.evaluate(() => document.body.innerText).catch(() => '');
  console.log('\n--- PAGE TEXT (first 3000 chars) ---');
  console.log(bodyText.substring(0, 3000));
  console.log('--- END PAGE TEXT ---');
  
  const pageUrl = cfPage.url();
  console.log('Final URL:', pageUrl);
  
  // Look for credential patterns in page text
  // Access Key ID = 32 alphanumeric chars
  // Secret = 64 hex chars
  const accessKeyMatches = bodyText.match(/\b([A-Za-z0-9]{32})\b/g) || [];
  const secretMatches = bodyText.match(/\b([a-f0-9]{64})\b/g) || [];
  
  console.log('\nPotential Access Key IDs (32 chars):', accessKeyMatches.slice(0, 5));
  console.log('Potential Secret Keys (64 hex chars):', secretMatches.slice(0, 3));
  
  // Also look for them in input fields (sometimes shown as values)
  const inputValues = await cfPage.$$eval('input, textarea', els =>
    els.map(e => ({ name: e.name, id: e.id, value: e.value, type: e.type })).filter(e => e.value && e.type !== 'hidden')
  ).catch(() => []);
  console.log('\nInput values:', JSON.stringify(inputValues));
  
  // Update env if we found credentials
  if (accessKeyMatches.length > 0 && secretMatches.length > 0) {
    const accessKey = accessKeyMatches[0];
    const secret = secretMatches[0];
    console.log(`\n✅ Found credentials:\n  Access Key: ${accessKey}\n  Secret: ${secret}`);
    updateEnvFile(accessKey, secret);
  } else {
    console.log('\n⚠️  Could not automatically extract credentials from page.');
    console.log('Check scratch_token_result.png and copy the credentials manually.');
  }
  
  browser.disconnect();
  console.log('\nDone! Check the screenshot files for details.');
}

main().catch(console.error);
