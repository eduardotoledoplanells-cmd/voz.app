const fs = require('fs');
const path = require('path');

// --- Update db.ts ---
const dbPath = path.join(__dirname, 'src', 'lib', 'db.ts');
let dbContent = fs.readFileSync(dbPath, 'utf8');

dbContent = dbContent.replace(
    /export async function incrementCampaignImpressions\(id: string\): Promise<boolean> {/,
    `export async function incrementCampaignImpressions(id: string, amount: number = 1): Promise<boolean> {`
);

dbContent = dbContent.replace(
    /const newImpressions = \(campaign\.impressions \|\| 0\) \+ 1;/,
    `const newImpressions = (campaign.impressions || 0) + amount;`
);

fs.writeFileSync(dbPath, dbContent, 'utf8');
console.log('db.ts updated');

// --- Update route.ts ---
const routePath = path.join(__dirname, 'voz-admin', 'src', 'app', 'api', 'voz', 'campaigns', 'route.ts');
let routeContent = fs.readFileSync(routePath, 'utf8');

const oldPatch = `        if (id && action === 'impression') {
            const success = await incrementCampaignImpressions(id);
            if (!success) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
            return NextResponse.json({ success: true });
        }`;

const newPatch = `        if (id && action === 'impression') {
            const success = await incrementCampaignImpressions(id);
            if (!success) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
            return NextResponse.json({ success: true });
        }

        if (id && action === 'simulate') {
            const count = parseInt(searchParams.get('count') || '100', 10);
            const success = await incrementCampaignImpressions(id, count);
            if (!success) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
            return NextResponse.json({ success: true });
        }`;

routeContent = routeContent.replace(oldPatch, newPatch);
fs.writeFileSync(routePath, routeContent, 'utf8');
console.log('route.ts updated');

// --- Update page.tsx ---
const pagePath = path.join(__dirname, 'voz-admin', 'src', 'app', 'ads', 'page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Inside Detail Modal Campaigns Table, add actions column and button
const oldTh = `<th style={{ padding: '4px', textAlign: 'right' }}>Progreso (Pack)</th>
                                        </tr>`;
const newTh = `<th style={{ padding: '4px', textAlign: 'right' }}>Progreso (Pack)</th>
                                            <th style={{ padding: '4px', textAlign: 'center' }}>Simulador</th>
                                        </tr>`;
pageContent = pageContent.replace(oldTh, newTh);

const oldTd = `<td style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>{c.impressions || 0} / {c.packSize > 0 ? c.packSize : '∞'}</td>
                                                </tr>`;
const newTd = `<td style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>{c.impressions || 0} / {c.packSize > 0 ? c.packSize : '∞'}</td>
                                                    <td style={{ padding: '4px', textAlign: 'center' }}>
                                                        <button 
                                                            style={{ fontSize: '0.8em', padding: '2px 6px', backgroundColor: '#ffd700', color: 'black', border: '1px solid black' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                fetch(\`/api/voz/campaigns?id=\${c.id}&action=simulate&count=100\`, { method: 'PATCH' })
                                                                    .then(res => res.json())
                                                                    .then(data => {
                                                                        if(data.success) {
                                                                            fetchData();
                                                                            showAlert('Se simularon 100 impactos exitosamente.', 'Simulador Stripe');
                                                                        }
                                                                    });
                                                            }}
                                                        >
                                                            ⚡ Simular 100
                                                        </button>
                                                    </td>
                                                </tr>`;
pageContent = pageContent.replace(oldTd, newTd);

fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log('page.tsx updated');
