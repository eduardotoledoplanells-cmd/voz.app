/**
 * Script de migración: reemplaza los bloques de headers legacy
 * (x-employee-id, x-employee-username, x-employee-password)
 * por el nuevo helper getAdminHeaders() / getAdminJsonHeaders()
 * en todos los archivos de la carpeta voz-admin/src/app/
 */

const fs = require('fs');
const path = require('path');

const ROOT = 'voz-admin/src/app';
const IMPORT_LINE = "import { getAdminHeaders, getAdminJsonHeaders, getEmployeeSession } from '@/lib/adminSession';";

// Files to migrate
const files = [
    'voz-admin/src/app/logs/page.tsx',
    'voz-admin/src/app/hr/page.tsx',
    'voz-admin/src/app/creators/page.tsx',
    'voz-admin/src/app/moderation/page.tsx',
    'voz-admin/src/app/servers/page.tsx',
    'voz-admin/src/app/users/page.tsx',
];

let totalCount = 0;

for (const filePath of files) {
    try {
        let src = fs.readFileSync(filePath, 'utf8');
        let count = 0;
        const original = src;

        // 1. Add import if not already present
        if (!src.includes('getAdminHeaders') && src.includes("x-employee-password")) {
            // Add after the first import line
            src = src.replace(/^('use client';\n?)/, `$1${IMPORT_LINE}\n`);
            if (!src.includes(IMPORT_LINE)) {
                // Fallback: add at the top
                src = IMPORT_LINE + '\n' + src;
            }
            count++;
        }

        // 2. Replace common patterns of building auth headers from localStorage
        // Pattern A: Full headers object with password
        // 'x-employee-id': emp.id,
        // 'x-employee-username': emp.username,
        // 'x-employee-password': emp.password
        src = src.replace(
            /'x-employee-id':\s*\w+\.id,\s*\n\s*'x-employee-username':\s*\w+\.username,\s*\n\s*'x-employee-password':\s*\w+\.password(\s*\|\|\s*'')?/g,
            `...getAdminHeaders(${'emp'})`
        );

        // Pattern B with 'Content-Type': application/json before it
        src = src.replace(
            /'Content-Type':\s*'application\/json',\s*\n\s*'x-employee-id':\s*\w+\.id,\s*\n\s*'x-employee-username':\s*\w+\.username,\s*\n\s*'x-employee-password':\s*\w+\.password(\s*\|\|\s*'')?/g,
            `...getAdminJsonHeaders(${'emp'})`
        );

        if (src !== original) {
            fs.writeFileSync(filePath, src);
            console.log(`  ✅ ${filePath}: migrated`);
        } else {
            console.log(`  ℹ️  ${filePath}: no automatic patterns found (may need manual update)`);
        }

        totalCount++;
    } catch (e) {
        console.log(`  ❌ SKIP ${filePath}: ${e.message}`);
    }
}

console.log(`\nDone. Processed ${totalCount} files.`);
console.log('\nNOTE: Some files may need manual review if patterns were not auto-detected.');
