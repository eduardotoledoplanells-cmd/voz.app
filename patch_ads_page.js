const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'voz-admin', 'src', 'app', 'ads', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add new state variables
content = content.replace(
    /const \[newCampaignCountries, setNewCampaignCountries\] = useState<string\[\]>\(\[\]\);\n    const \[newCampaignRegions, setNewCampaignRegions\] = useState<string\[\]>\(\[\]\);\n    const \[newCampaignInterests, setNewCampaignInterests\] = useState<string\[\]>\(\[\]\);/,
    `const [newCampaignCountries, setNewCampaignCountries] = useState<string[]>([]);
    const [newCampaignRegions, setNewCampaignRegions] = useState<string[]>([]);
    const [newCampaignInterests, setNewCampaignInterests] = useState<string[]>([]);
    // Geotargeting Advanced
    const [countriesDb, setCountriesDb] = useState<any[]>([]);
    const [regionsDb, setRegionsDb] = useState<any[]>([]);
    const [municipalitiesDb, setMunicipalitiesDb] = useState<any[]>([]);
    const [selectedCountryId, setSelectedCountryId] = useState<string>('');
    const [selectedRegionId, setSelectedRegionId] = useState<string>('');
    const [targetMunicipalities, setTargetMunicipalities] = useState<number[]>([]);
    const [estimatedReach, setEstimatedReach] = useState<number | null>(null);

    useEffect(() => {
        fetch('/api/locations?type=countries')
            .then(res => res.json())
            .then(data => setCountriesDb(Array.isArray(data) ? data : []));
    }, []);

    useEffect(() => {
        if (selectedCountryId) {
            fetch(\`/api/locations?type=regions&countryId=\${selectedCountryId}\`)
                .then(res => res.json())
                .then(data => { setRegionsDb(Array.isArray(data) ? data : []); setMunicipalitiesDb([]); setSelectedRegionId(''); });
        } else {
            setRegionsDb([]);
            setMunicipalitiesDb([]);
            setSelectedRegionId('');
        }
    }, [selectedCountryId]);

    useEffect(() => {
        if (selectedRegionId) {
            fetch(\`/api/locations?type=municipalities&regionId=\${selectedRegionId}\`)
                .then(res => res.json())
                .then(data => setMunicipalitiesDb(Array.isArray(data) ? data : []));
        } else {
            setMunicipalitiesDb([]);
        }
    }, [selectedRegionId]);

    useEffect(() => {
        const fetchReach = async () => {
            const muniStr = targetMunicipalities.length > 0 ? targetMunicipalities.join(',') : '';
            try {
                const res = await fetch(\`/api/locations?type=reach\${muniStr ? '&muniIds=' + muniStr : ''}\`);
                const data = await res.json();
                setEstimatedReach(data.reach || 0);
            } catch (e) {
                console.error('Error fetching reach', e);
            }
        };
        fetchReach();
    }, [targetMunicipalities]);

    const toggleMunicipality = (mId: number) => {
        setTargetMunicipalities(prev => prev.includes(mId) ? prev.filter(x => x !== mId) : [...prev, mId]);
    };`
);

// 2. Reset states in handleNewCampaign
content = content.replace(
    /setNewCampaignCountries\(\[\]\);\n        setNewCampaignRegions\(\[\]\);\n        setNewCampaignInterests\(\[\]\);\n        setShowCampaignModal\(true\);/,
    `setNewCampaignCountries([]);
        setNewCampaignRegions([]);
        setNewCampaignInterests([]);
        setSelectedCountryId('');
        setSelectedRegionId('');
        setTargetMunicipalities([]);
        setShowCampaignModal(true);`
);

// 3. Save campaign
content = content.replace(
    /targetCountries: newCampaignCountries,\n                targetRegions: newCampaignRegions,\n                targetInterests: newCampaignInterests/,
    `targetCountries: newCampaignCountries,
                targetRegions: newCampaignRegions,
                targetInterests: newCampaignInterests,
                target_municipalities: targetMunicipalities`
);

// 4. Update UI
const oldUIBlock = `{/* SEGMENTACIÓN GEOGRÁFICA */}
                                <fieldset style={{ marginBottom: 12 }}>
                                    <legend>🌍 Países Objetivo <span style={{fontWeight:'normal',fontSize:'0.85em',color:'#666'}}>(dejar vacío = global)</span></legend>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {AD_COUNTRIES.map(c => (
                                            <label key={c} style={{ display:'flex', alignItems:'center', gap:4, marginRight:8, cursor:'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={newCampaignCountries.includes(c)}
                                                    onChange={() => {
                                                        toggleItem(c, newCampaignCountries, setNewCampaignCountries);
                                                        // Limpiar regiones de ese país si se deselecciona
                                                        if (newCampaignCountries.includes(c)) {
                                                            const regToRemove = AD_REGIONS[c] || [];
                                                            setNewCampaignRegions(prev => prev.filter(r => !regToRemove.includes(r)));
                                                        }
                                                    }}
                                                />
                                                {c}
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>

                                {availableRegions.length > 0 && (
                                    <fieldset style={{ marginBottom: 12 }}>
                                        <legend>📍 Regiones/Localidades <span style={{fontWeight:'normal',fontSize:'0.85em',color:'#666'}}>(opcional, filtra dentro del país)</span></legend>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {availableRegions.map(r => (
                                                <label key={r} style={{ display:'flex', alignItems:'center', gap:4, marginRight:8, cursor:'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={newCampaignRegions.includes(r)}
                                                        onChange={() => toggleItem(r, newCampaignRegions, setNewCampaignRegions)}
                                                    />
                                                    {r}
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>
                                )}`;

const newUIBlock = `{/* SEGMENTACIÓN GEOGRÁFICA AVANZADA */}
                                <fieldset style={{ marginBottom: 12 }}>
                                    <legend>🌍 Segmentación por Municipio <span style={{fontWeight:'normal',fontSize:'0.85em',color:'#666'}}>(Alcance estimado: {estimatedReach !== null ? estimatedReach : '...'} usuarios)</span></legend>
                                    
                                    <div className="field-row-stacked" style={{ marginBottom: 8 }}>
                                        <label>1. Filtrar por País:</label>
                                        <select value={selectedCountryId} onChange={e => setSelectedCountryId(e.target.value)}>
                                            <option value="">-- Todos los Países --</option>
                                            {countriesDb.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    {regionsDb.length > 0 && (
                                        <div className="field-row-stacked" style={{ marginBottom: 8 }}>
                                            <label>2. Filtrar por Región/Comunidad:</label>
                                            <select value={selectedRegionId} onChange={e => setSelectedRegionId(e.target.value)}>
                                                <option value="">-- Todas las Regiones --</option>
                                                {regionsDb.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {municipalitiesDb.length > 0 && (
                                        <div className="field-row-stacked" style={{ marginBottom: 8 }}>
                                            <label>3. Seleccionar Municipios (Multi-select):</label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '5px', border: '1px inset #fff', background: '#fff', maxHeight: '120px', overflowY: 'auto' }}>
                                                {municipalitiesDb.map(m => (
                                                    <label key={m.id} style={{ display:'flex', alignItems:'center', gap:4, marginRight:8, cursor:'pointer' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={targetMunicipalities.includes(m.id)}
                                                            onChange={() => toggleMunicipality(m.id)}
                                                        />
                                                        {m.name}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
                                        Si no seleccionas ningún municipio, la campaña será global.
                                    </div>
                                </fieldset>`;

content = content.replace(oldUIBlock, newUIBlock);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Admin ads page updated successfully.');
