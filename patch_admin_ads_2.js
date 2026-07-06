const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'voz-admin', 'src', 'app', 'ads', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Priority and Pack Size states
content = content.replace(
    /const \[newCampaignInvestment, setNewCampaignInvestment\] = useState<number>\(0\);/,
    `const [newCampaignInvestment, setNewCampaignInvestment] = useState<number>(0);
    const [newCampaignPriority, setNewCampaignPriority] = useState<string>('Local_Standard');
    const [newCampaignPackSize, setNewCampaignPackSize] = useState<number>(0);`
);

// 2. Reset states in handleNewCampaign
content = content.replace(
    /setNewCampaignInvestment\(0\);\n\s*setSelectedVideoFile\(null\);/,
    `setNewCampaignInvestment(0);
        setNewCampaignPriority('Local_Standard');
        setNewCampaignPackSize(0);
        setSelectedVideoFile(null);`
);

// 3. Save campaign Payload
content = content.replace(
    /target_municipalities: targetMunicipalities/,
    `target_municipalities: targetMunicipalities,
                priority: newCampaignPriority,
                packSize: newCampaignPackSize`
);

// 4. Form Fields: Inversión -> Prioridad y Pack
const oldInvestmentField = `<div className="field-row-stacked" style={{ marginBottom: 12 }}>
                                    <label>Inversión Publicitaria (€):</label>
                                    <input
                                        type="number"
                                        value={newCampaignInvestment}
                                        onChange={e => setNewCampaignInvestment(Number(e.target.value))}
                                        placeholder="0"
                                    />
                                    <div style={{ fontSize: '0.8em', color: '#666' }}>Esta cantidad se reflejará en facturación.</div>
                                </div>`;

const newFields = `<fieldset style={{ marginBottom: 12, border: '1px solid #000080', padding: '8px' }}>
                                    <legend style={{ color: '#000080', fontWeight: 'bold' }}>Prioridad y Packs de Impresiones (Stripe Connect)</legend>
                                    
                                    <div className="field-row-stacked" style={{ marginBottom: 8 }}>
                                        <label>Nivel de Prioridad (Motor de Entrega):</label>
                                        <select value={newCampaignPriority} onChange={e => setNewCampaignPriority(e.target.value)}>
                                            <option value="Enterprise">Nivel 1 - Enterprise (Cada 15 videos, máxima prio)</option>
                                            <option value="Local_Premium">Nivel 2 - Local Premium (Cada 25-30 videos, prio alta)</option>
                                            <option value="Local_Standard">Nivel 2 - Local Standard (Cada 25-30 videos, prio normal)</option>
                                        </select>
                                    </div>
                                    
                                    <div className="field-row-stacked" style={{ marginBottom: 8 }}>
                                        <label>Pack de Impresiones (Pre-pago):</label>
                                        <select value={newCampaignPackSize} onChange={e => setNewCampaignPackSize(Number(e.target.value))}>
                                            <option value="0">Ilimitado / Contrato Fijo (Enterprise)</option>
                                            <option value="1000">1,000 impresiones (Bronce)</option>
                                            <option value="5000">5,000 impresiones (Plata)</option>
                                            <option value="10000">10,000 impresiones (Oro)</option>
                                        </select>
                                        <div style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
                                            La campaña se pausará automáticamente al agotar el pack.
                                        </div>
                                    </div>

                                    <div className="field-row-stacked" style={{ marginBottom: 8 }}>
                                        <label>Valor Facturado (€):</label>
                                        <input
                                            type="number"
                                            value={newCampaignInvestment}
                                            onChange={e => setNewCampaignInvestment(Number(e.target.value))}
                                            placeholder="0"
                                        />
                                    </div>
                                </fieldset>`;

content = content.replace(oldInvestmentField, newFields);

// 5. Update display Table headers
content = content.replace(
    /<th style={{ padding: '4px', textAlign: 'right' }}>Impresiones<\/th>/,
    `<th style={{ padding: '4px', textAlign: 'right' }}>Progreso (Pack)</th>`
);

// 6. Update display Table body
const oldTableImpressions = /<td style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>\{c.impressions \|\| 0\}<\/td>/g;
content = content.replace(oldTableImpressions, `<td style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>{c.impressions || 0} / {c.packSize > 0 ? c.packSize : '∞'}</td>`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Ads Admin page updated with priority fields.');
