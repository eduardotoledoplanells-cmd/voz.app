const fs = require('fs');
const cp = require('child_process');
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
            console.log(`Adding ${key}...`);
            try {
                cp.spawnSync('npx.cmd', ['vercel', 'env', 'rm', key, 'production', '--yes'], { stdio: 'ignore' });

                const proc = cp.spawnSync('npx.cmd', ['vercel', 'env', 'add', key, 'production'], {
                    input: value + '\n'
                });

                if (proc.status !== 0) {
                    const errStr = (proc.stderr && proc.stderr.toString().trim()) || (proc.stdout && proc.stdout.toString().trim()) || 'Unknown error';
                    console.error(`Failed to add ${key}: ${errStr}`);
                } else {
                    console.log(`Successfully added ${key}`);
                }
            } catch (err) {
                console.error(`Error processing ${key}`, err.message);
            }
        }
    }
}
console.log('Finished fixing environment variables.');
