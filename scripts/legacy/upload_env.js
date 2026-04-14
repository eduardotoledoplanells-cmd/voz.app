const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const lines = envContent.split('\n');
for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex !== -1) {
        const key = trimmed.substring(0, separatorIndex).trim();
        let value = trimmed.substring(separatorIndex + 1).trim();

        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
        }

        if (key && value) {
            console.log(`Adding ${key} to Vercel...`);
            try {
                // We use --force to overwrite if it already exists, or just send to stdin
                // The cli syntax is: echo "value" | vercel env add <name> <environment>
                execSync(`echo "${value}" | npx vercel env add ${key} production`, {
                    stdio: 'inherit',
                    shell: true
                });
            } catch (err) {
                console.error(`Failed to add ${key}`);
            }
        }
    }
}
console.log('Finished uploading environment variables.');
