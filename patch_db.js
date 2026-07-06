const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'lib', 'db.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Campaign interface
const oldInterface = `export interface Campaign {
    id: string;
    companyId: string;
    name: string;
    budget: number;
    status: 'draft' | 'active' | 'paused' | 'completed';
    type: 'video' | 'banner';
    videoUrl?: string;
    startDate?: string;
    endDate?: string;
    forceView: boolean;
    minViewTime?: number;
    target: string;
    impressions: number;
    createdAt: string;
    // Segmentación publicitaria 70/30
    targetCountries?: string[];
    targetRegions?: string[];
    targetInterests?: string[];
    target_municipalities?: number[];
}`;

const newInterface = `export interface Campaign {
    id: string;
    companyId: string;
    name: string;
    budget: number;
    status: 'draft' | 'active' | 'paused' | 'completed';
    type: 'video' | 'banner';
    videoUrl?: string;
    startDate?: string;
    endDate?: string;
    forceView: boolean;
    minViewTime?: number;
    target: string;
    impressions: number;
    createdAt: string;
    // Segmentación publicitaria 70/30
    targetCountries?: string[];
    targetRegions?: string[];
    targetInterests?: string[];
    target_municipalities?: number[];
    // Nivel de Prioridad y Motor Publicitario
    priority?: string; // Enterprise, Local_Premium, Local_Standard
    packSize?: number; // 0 = unlimited
}`;
content = content.replace(oldInterface, newInterface);

// 2. Update getCampaigns mapped fields
content = content.replace(
    /minViewTime: c\.min_view_time \|\| 0,\n\s*createdAt: c\.created_at/,
    `minViewTime: c.min_view_time || 0,
        createdAt: c.created_at,
        priority: c.priority || 'Local_Standard',
        packSize: c.pack_size || 0`
);

// 3. Update addCampaign mapped fields
content = content.replace(
    /target: campaign\.target,\n\s*investment: \(campaign as any\)\.investment \|\| 0/,
    `target: campaign.target,
        investment: (campaign as any).investment || 0,
        priority: campaign.priority || 'Local_Standard',
        pack_size: campaign.packSize || 0`
);

// 4. Update getVideos algorithm
// Specifically around the DB query for activeCampaigns
const oldAdDbCall = `        // Traer todas las campañas activas con sus metadatos y targeting
        const { data: activeCampaigns } = await supabaseAdmin
            .from('campaigns')
            .select('id, force_view, min_view_time, video_url, name, target_countries, target_regions, target_interests')
            .eq('status', 'active');`;

const newAdDbCall = `        // Traer todas las campañas activas con sus metadatos y targeting
        const { data: activeCampaignsData } = await supabaseAdmin
            .from('campaigns')
            .select('id, force_view, min_view_time, video_url, name, target_countries, target_regions, target_interests, priority, pack_size, impressions')
            .eq('status', 'active');

        // Filtro adicional de Inventario: excluir campañas locales que ya consumieron su pack
        // (Este filtro también se aplica en BD por el trigger, pero lo doble-chequeamos aquí)
        let activeCampaigns = activeCampaignsData || [];
        activeCampaigns = activeCampaigns.filter((c: any) => c.pack_size === 0 || c.impressions < c.pack_size);`;
content = content.replace(oldAdDbCall, newAdDbCall);

// 5. Update Selection 70/30 to prioritize Enterprise and Locals
const old7030 = `            // 3. Selección 70/30: 70% preferencia al pool con interés, 30% al genérico
            let selectedPool = genericPool;
            const rand = Math.random() * 10;
            if (rand < 7 && matchedPool.length > 0) {
                selectedPool = matchedPool;
            } else if (genericPool.length === 0 && matchedPool.length > 0) {
                selectedPool = matchedPool; // fallback si no hay genéricos
            }

            if (selectedPool.length > 0) {
                const selectedCampaign = selectedPool[Math.floor(Math.random() * selectedPool.length)];
                adToInject = {
                    id: \`ad_\${selectedCampaign.id}_\${Date.now()}\`,
                    videoUrl: selectedCampaign.video_url,
                    user: '@voz_ads',
                    description: \`📢 \${selectedCampaign.name || 'Publicidad'}\`,
                    likes: 0, shares: 0, commentsCount: 0, views: 0,
                    createdAt: new Date().toISOString(),
                    isAd: true,
                    commentsEnabled: false,
                    forceView: selectedCampaign.force_view || false,
                    minViewTime: selectedCampaign.min_view_time || 0,
                    campaignId: selectedCampaign.id,
                };
            }`;

const new7030 = `            // 3. Agrupación por Prioridades (Enterprise, Premium, Standard)
            const enterprisePool = [...matchedPool.filter(c => c.priority === 'Enterprise'), ...genericPool.filter(c => c.priority === 'Enterprise')];
            const premiumPool = [...matchedPool.filter(c => c.priority === 'Local_Premium'), ...genericPool.filter(c => c.priority === 'Local_Premium')];
            const standardPool = [...matchedPool.filter(c => c.priority === 'Local_Standard'), ...genericPool.filter(c => c.priority === 'Local_Standard')];

            // 4. Algoritmo de inyección según el Offset de la paginación (offset)
            // Enterprise: inyección al inicio (offset 0) y cada 15 vídeos (ej: offset 15, 30)
            // Locales (Premium/Standard): inyección cada 25-30 vídeos (ej: offset 25, 55, etc. Lo calcularemos por modulo)
            
            let selectedCampaign = null;
            
            if (offset % 15 === 0 && enterprisePool.length > 0) {
                selectedCampaign = enterprisePool[Math.floor(Math.random() * enterprisePool.length)];
            } else if ((offset % 25 === 0 || offset % 30 === 0) && offset !== 0) {
                // Seleccionar un Local. Damos 70% chance a Premium, 30% a Standard
                if (Math.random() * 10 < 7 && premiumPool.length > 0) {
                    selectedCampaign = premiumPool[Math.floor(Math.random() * premiumPool.length)];
                } else if (standardPool.length > 0) {
                    selectedCampaign = standardPool[Math.floor(Math.random() * standardPool.length)];
                } else if (premiumPool.length > 0) {
                    selectedCampaign = premiumPool[Math.floor(Math.random() * premiumPool.length)];
                }
            }

            if (selectedCampaign) {
                adToInject = {
                    id: \`ad_\${selectedCampaign.id}_\${Date.now()}\`,
                    videoUrl: selectedCampaign.video_url,
                    user: '@voz_ads',
                    description: \`📢 \${selectedCampaign.name || 'Publicidad'}\`,
                    likes: 0, shares: 0, commentsCount: 0, views: 0,
                    createdAt: new Date().toISOString(),
                    isAd: true,
                    commentsEnabled: false,
                    forceView: selectedCampaign.force_view || false,
                    minViewTime: selectedCampaign.min_view_time || 0,
                    campaignId: selectedCampaign.id,
                };
            }`;
content = content.replace(old7030, new7030);

// Also need to fix the offset passed into getVideos, since it's injected inside getVideos we have the offset
// Let's make sure it injects appropriately
// Oh wait, getVideos injects at position 4. Let's fix that.
const oldInjectionPoint = `    // 5. Inyectar el anuncio seleccionado naturalmente en el feed (posición 4)
    if (adToInject && result.length >= 2) {
        const adIndex = Math.min(4, result.length - 1);
        result.splice(adIndex, 0, adToInject as any);
    }`;

const newInjectionPoint = `    // 5. Inyectar el anuncio seleccionado naturalmente en el feed (posición variable según offset)
    if (adToInject && result.length >= 2) {
        // En lugar de ponerlo siempre en la posición 4, si es Enterprise y offset 0, en la 1 o 2.
        const isEnterprise = adToInject.description.includes('Enterprise'); // Hacky check but fine
        let adIndex = 4;
        if (offset === 0) adIndex = 1; // Inyección inmediata al inicio (posición 2 del feed)
        else adIndex = Math.min(4, result.length - 1);
        result.splice(adIndex, 0, adToInject as any);
    }`;
content = content.replace(oldInjectionPoint, newInjectionPoint);

fs.writeFileSync(filePath, content, 'utf8');
console.log('db.ts updated successfully with Ad Delivery Engine.');
