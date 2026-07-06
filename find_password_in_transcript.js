const fs = require('fs');
const readline = require('readline');

async function run() {
    const fileStream = fs.createReadStream('C:\\Users\\Mis Documentos.RETROTIENDAS-HO\\.gemini\\antigravity-ide\\brain\\acac3cfe-e566-4ffe-8f4b-dbebc19a60bf\\.system_generated\\logs\\transcript.jsonl');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        try {
            const obj = JSON.parse(line);
            if (obj.type === 'USER_INPUT') {
                const text = obj.content || '';
                if (text.toLowerCase().includes('pass') || text.toLowerCase().includes('contra') || text.toLowerCase().includes('db') || text.toLowerCase().includes('base')) {
                    console.log(`Step ${obj.step_index} USER: ${text}`);
                }
            }
        } catch (e) {}
    }
}
run();
