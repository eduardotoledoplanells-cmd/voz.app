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
        if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length - 1);
        }

        if (key && value) {
            console.log(`Processing ${key}...`);
            try {
                // Remove existing
                try {
                    execSync(`npx vercel env rm ${key} production --yes`, { stdio: 'ignore', shell: true });
                } catch (e) {
                    // Might fail if it doesn't exist, ignore
                }

                // Write to temp file
                fs.writeFileSync('temp_val.txt', value, 'utf8');

                // Add from temp file using PowerShell/CMD redirection
                execSync(`npx vercel env add ${key} production < temp_val.txt`, { stdio: 'inherit', shell: true });
                console.log(`Successfully added ${key}`);
            } catch (err) {
                console.error(`Failed on ${key}`);
            }
        }
    }
}

if (fs.existsSync('temp_val.txt')) {
    fs.unlinkSync('temp_val.txt');
}
console.log('Finished uploading environment variables cleanly.');
