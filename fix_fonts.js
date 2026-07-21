const fs = require('fs');

const files = [
    'voz-admin/src/app/layout.tsx',
    'voz-admin/src/app/page.tsx',
    'voz-admin/src/app/hr/page.tsx',
    'voz-admin/src/app/logs/page.tsx',
    'voz-admin/src/app/moderation/page.tsx',
    'voz-admin/src/app/users/page.tsx',
    'voz-admin/src/app/stats/page.tsx',
];

const replacements = [
    ["fontSize: '0.65em'", "fontSize: '11px'"],
    ["fontSize: '0.7em'",  "fontSize: '11px'"],
    ["fontSize: '0.75em'", "fontSize: '11px'"],
    ["fontSize: '0.8em'",  "fontSize: '12px'"],
    ["fontSize: '0.85em'", "fontSize: '12px'"],
    ["fontSize: '0.9em'",  "fontSize: '13px'"],
    ["fontSize: '0.95em'", "fontSize: '13px'"],
    ["fontSize: '1.1em'",  "fontSize: '15px'"],
    ["fontSize: '1.2em'",  "fontSize: '16px'"],
    ["fontSize: '1.3em'",  "fontSize: '17px'"],
    ["fontSize: '1.4em'",  "fontSize: '18px'"],
    ["fontSize: '1.5em'",  "fontSize: '20px'"],
    ["fontSize: '1.6em'",  "fontSize: '22px'"],
    ["fontSize: '2em'",    "fontSize: '26px'"],
    // Also fix string-concatenated versions
    ["fontSize: `${",      "fontSize: `${"],  // skip dynamic ones
];

let totalCount = 0;

for (const filePath of files) {
    try {
        let src = fs.readFileSync(filePath, 'utf8');
        let count = 0;
        for (const [from, to] of replacements) {
            if (from === to) continue; // skip skip markers
            while (src.includes(from)) {
                src = src.replace(from, to);
                count++;
            }
        }
        if (count > 0) {
            fs.writeFileSync(filePath, src);
            console.log(`  ${filePath}: ${count} replacements`);
        } else {
            console.log(`  ${filePath}: no em values found`);
        }
        totalCount += count;
    } catch (e) {
        console.log(`  SKIP ${filePath}: ${e.message}`);
    }
}

console.log(`\nTotal: ${totalCount} replacements across all files`);
