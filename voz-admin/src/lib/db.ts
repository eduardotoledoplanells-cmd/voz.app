import fs from 'fs';
import path from 'path';
import { Product } from '@/types';
import { products as initialProducts } from './data';

const dbPath = path.join(process.cwd(), 'db.json');
console.log('--- DATABASE PATH:', dbPath);

// Initialize DB if it doesn't exist
let dbData = {
    products: [] as Product[],
    app_users: [] as any[],
    companies: [] as any[],
    campaigns: [] as any[],
    employees: [
        { id: '1', username: 'admin', password: '123', role: 1, workerNumber: '001', lastLogin: 'Nunca', active: true }
    ] as any[],
    logs: [] as any[],
    moderator_productivity: [] as any[],
    videos: [] as VideoPost[]
};

if (fs.existsSync(dbPath)) {
    try {
        dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } catch (error) {
        console.error('Error reading db.json:', error);
        // If error, fallback to initial products
        dbData = {
            products: [...initialProducts],
            app_users: [],
            companies: [],
            campaigns: [],
            employees: [],
            logs: [],
            moderator_productivity: [],
            videos: []
        };
        // Force write to fix corrupted file
        fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
    }
} else {
    // If DB doesn't exist, create it with initial data
    dbData = {
        products: [...initialProducts],
        app_users: [],
        companies: [],
        campaigns: [],
        employees: [],
        logs: [],
        moderator_productivity: [],
        videos: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
}

export function addProductivityLog(employee: string, cycleVideos: number, totalVideos: number) {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    if (!data.moderator_productivity) data.moderator_productivity = [];

    data.moderator_productivity.push({
        employee,
        cycleVideos,
        totalVideos,
        timestamp: new Date().toISOString()
    });

    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export function addInactivityLog(employee: string) {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    if (!data.inactivity_logs) data.inactivity_logs = [];

    data.inactivity_logs.push({
        employee,
        timestamp: new Date().toISOString()
    });

    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export function getModeratorProductivity() {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    return data.moderator_productivity || [];
}

export function getInactivityLogs() {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    return data.inactivity_logs || [];
}

export function getProducts(): Product[] {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data).products;
}

export function getProductById(id: string): Product | undefined {
    const products = getProducts();
    return products.find(p => p.id === id);
}

export function addProduct(product: Product): Product {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    data.products.push(product);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return product;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const index = data.products.findIndex((p: Product) => p.id === id);

    if (index === -1) return null;

    data.products[index] = { ...data.products[index], ...updates };
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return data.products[index];
}

export function deleteProduct(id: string): boolean {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const initialLength = data.products.length;
    data.products = data.products.filter((p: Product) => p.id !== id);

    if (data.products.length === initialLength) return false;

    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
}

export function deleteProducts(ids: string[]): boolean {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const initialLength = data.products.length;
    data.products = data.products.filter((p: Product) => !ids.includes(p.id));

    if (data.products.length === initialLength) return false;

    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
}

// --- App Users Logic (VOZ) ---
export interface AppUser {
    id: string;
    handle: string;
    name: string;
    email: string; // Internal use
    status: 'active' | 'banned' | 'verified';
    reputation: number;
    penalties?: number; // Contador de faltas
    penalizedContent?: { url: string; reason: string; timestamp: string }[]; // Evidencias
    walletBalance: number; // Coins purchased but not spent
    password?: string; // Hashed password
    stats?: { totalDonated: number };
    joinedAt: string;
    videoCount?: number;
}

// --- Enterprise Logic (VOZ Admin) ---
export interface Company {
    id: string;
    name: string;
    legalName: string;
    taxId: string;
    address: string;
    city: string;
    zip: string;
    country: string;
    phone: string;
    contactEmail: string;
    balance: number;
    joinedAt: string;
}

export interface Campaign {
    id: string;
    companyId: string;
    name: string;
    budget: number;
    status: 'draft' | 'active' | 'paused' | 'completed';
    type: 'video' | 'banner';
    videoUrl?: string; // URL for the campaign video
    startDate?: string; // ISO date
    endDate?: string; // ISO date
    forceView: boolean; // Cannot be paused or skipped
    target: string;
    impressions: number; // Tracker for how many times the ad was shown
    investment: number; // Amount paid by the client for this campaign
    createdAt: string;
}

export interface Employee {
    id: string;
    username: string;
    password?: string;
    workerNumber: string; // Ej: '001', '002'
    role: 1 | 2 | 3 | 4 | 5 | 6; // 1: Director, 2: Admin...
    lastLogin: string;
    lastLogout?: string;
    active: boolean;
}

export interface AppLog {
    id: string;
    employeeName: string;
    action: string;
    timestamp: string;
    details?: string;
}

export interface ModerationItem {
    id: string;
    matricula?: string; // Formato VOZ-XXXXXX
    type: 'video' | 'audio' | 'text' | 'image';
    url: string;
    userHandle: string;
    reportedBy?: string;
    content?: string;
    reportReason?: string;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
    moderatedBy?: string; // Quién procesó el reporte
}

export interface CoinSale {
    id: string;
    userHandle: string;
    packType: 5 | 10 | 20 | 100;
    price: number;
    coins: number;
    timestamp: string;
}

export interface Creator {
    id: string;
    userHandle: string;
    realName: string;
    totalCoins: number; // Sum of everything received
    withdrawableCoins: number; // What creator can actually cash out
    earnedEuro: number; // Calculated after commissions
    stats: {
        totalGifts: number;
        totalPMs: number;
        earnedFromGifts: number; // in Euro
        earnedFromPMs: number; // in Euro
    };
    paymentInfo?: {
        fullName: string;
        dni: string;
        iban: string;
        address: string;
        province: string;
        phone: string;
        email: string;
    };
    verification?: {
        dniFront: string;
        dniBack: string;
        verifiedAt?: string;
    };
    status: 'active' | 'under_review' | 'suspended' | 'deleted';
    joinedAt: string;
}

export interface RedemptionRequest {
    id: string;
    creatorId: string;
    amountCoins: number;
    amountEuro: number;
    status: 'pending' | 'approved' | 'completed' | 'rejected';
    requestedAt: string;
    processedAt?: string;
    processedBy?: string;
}

export interface Notification {
    id: string;
    recipientId: string;
    type: 'payment_approved' | 'payment_completed' | 'system';
    title: string;
    message: string;
    timestamp: string;
    readStatus: boolean;
}

// --- Videos Logic (VOZ) ---
export interface VideoPost {
    id: string;
    videoUrl: string;
    user: string;
    description: string;
    transcription?: any[];
    language?: string;
    likes: number;
    shares: number;
    commentsCount: number;
    views: number;
    createdAt: string;
    music?: string;
    isAd?: boolean;
}

export function getVideos(): VideoPost[] {
    const data = getDB();
    return data.videos || [];
}

export function addVideo(video: VideoPost): VideoPost {
    const data = getDB();
    if (!data.videos) data.videos = [];
    data.videos.unshift(video); // Newest first
    saveDB(data);
    return video;
}

export function updateVideo(id: string, updates: Partial<VideoPost>): VideoPost | null {
    const data = getDB();
    if (!data.videos) data.videos = [];
    const index = data.videos.findIndex((v: VideoPost) => v.id === id);
    if (index === -1) return null;
    data.videos[index] = { ...data.videos[index], ...updates };
    saveDB(data);
    return data.videos[index];
}

// Helper to get DB data cleanly
export function getDB() {
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

// Helper to save DB data
export function saveDB(data: any) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export function getAppUsers(): AppUser[] {
    const data = getDB();
    const users = data.app_users || [];
    const moderationQueue = data.moderation_queue || [];

    // Normalize users to ensure handle property exists and calculate video count
    return users.map((u: any) => {
        const handle = u.handle || u.name;

        // Count from both moderation queue and viral stats
        const moderationCount = moderationQueue.filter((item: any) =>
            item.userHandle === handle && (item.type === 'video' || item.type === 'audio')
        ).length;

        const viralStats = data.viral_stats || {};
        const viralCount = Object.values(viralStats).filter((v: any) =>
            v.user === handle && !moderationQueue.find((mq: any) => mq.id === v.id)
        ).length;

        return {
            ...u,
            handle,
            videoCount: moderationCount + viralCount
        };
    });
}

export function updateAppUser(id: string, updates: Partial<AppUser>, employeeName: string = 'Admin'): AppUser | null {
    const data = getDB();
    if (!data.app_users) data.app_users = [];

    const index = data.app_users.findIndex((u: AppUser) => u.id === id);
    if (index === -1) return null;

    const oldUser = { ...data.app_users[index] };
    data.app_users[index] = { ...data.app_users[index], ...updates };

    // Register Log
    addLog({
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        employeeName: employeeName,
        action: `Actualización de Usuario: ${oldUser.handle}`,
        timestamp: new Date().toISOString(),
        details: `Cambios: ${Object.keys(updates).join(', ')}. Valor anterior: ${JSON.stringify(oldUser)}`
    });

    // SYNC with Creator profile
    if (updates.name || updates.handle) {
        if (!data.creators) data.creators = [];

        // Normalize IDs for matching (e.g., 'u1' -> 'cr-1')
        const numericId = id.replace(/^[u]/, '');
        const targetCreatorId = id.startsWith('cr-') ? id : `cr-${numericId}`;

        const creatorIndex = data.creators.findIndex((c: any) =>
            c.id === targetCreatorId ||
            (oldUser.name && c.userHandle === oldUser.name) ||
            (oldUser.handle && c.userHandle === oldUser.handle)
        );

        if (creatorIndex !== -1) {
            if (updates.name) {
                // If it looks like a handle, update userHandle, otherwise update realName
                if (updates.name.startsWith('@')) {
                    data.creators[creatorIndex].userHandle = updates.name;
                } else {
                    data.creators[creatorIndex].realName = updates.name;
                }
            }
            if (updates.handle) {
                data.creators[creatorIndex].userHandle = updates.handle;
            }
        }
    }

    saveDB(data);
    return data.app_users[index];
}

export function addAppUser(user: AppUser): AppUser {
    const data = getDB();
    if (!data.app_users) data.app_users = [];
    data.app_users.push(user);
    saveDB(data);

    // Register Log
    addLog({
        id: 'log-' + Date.now(),
        employeeName: 'Sistema',
        action: `Creación de Usuario: ${user.handle}`,
        timestamp: new Date().toISOString(),
        details: `Nuevo usuario ID: ${user.id}, Email: ${user.email}`
    });

    return user;
}

export function deleteAppUser(id: string, employeeName: string = 'Admin'): boolean {
    const data = getDB();
    const index = (data.app_users || []).findIndex((u: any) => u.id === id);
    if (index === -1) return false;

    const deletedUser = data.app_users[index];
    data.app_users.splice(index, 1);

    // Register Log
    addLog({
        id: 'log-' + Date.now(),
        employeeName: employeeName,
        action: `BORRADO de Usuario: ${deletedUser.handle || deletedUser.name}`,
        timestamp: new Date().toISOString(),
        details: `ID: ${id}. Email: ${deletedUser.email}`
    });

    saveDB(data);
    return true;
}

export function addPenaltyToUser(handle: string, evidence?: { url: string; reason: string }): AppUser | null {
    const data = getDB();
    if (!data.app_users) data.app_users = [];

    const index = data.app_users.findIndex((u: AppUser) => u.handle === handle);
    if (index === -1) return null;

    const user = data.app_users[index];
    user.penalties = (user.penalties || 0) + 1;

    // Guardar evidencia si existe
    if (evidence) {
        if (!user.penalizedContent) user.penalizedContent = [];
        user.penalizedContent.push({
            ...evidence,
            timestamp: new Date().toISOString()
        });
    }

    // Lógica de baneo automático
    if (user.penalties >= 3) {
        user.status = 'banned';
        addLog({
            id: 'log-' + Date.now(),
            employeeName: 'Sistema (Auto-Ban)',
            action: `BAN automático: ${user.handle}`,
            timestamp: new Date().toISOString(),
            details: `Usuario bloqueado por alcanzar 3 penalizaciones.`
        });
    } else {
        addLog({
            id: 'log-' + Date.now(),
            employeeName: 'Moderación',
            action: `Penalización aplicada: ${user.handle}`,
            timestamp: new Date().toISOString(),
            details: `Contador actual: ${user.penalties}/3`
        });
    }

    saveDB(data);
    return user;
}

// --- Companies ---
export function getCompanies(): Company[] {
    return getDB().companies || [];
}
export function addCompany(company: Company, employeeName: string = 'Admin'): Company {
    const data = getDB();
    if (!data.companies) data.companies = [];
    data.companies.push(company);
    saveDB(data);

    // Register Log
    addLog({
        id: 'log-' + Date.now(),
        employeeName: employeeName,
        action: `Nuevo Cliente Publicidad: ${company.name}`,
        timestamp: new Date().toISOString(),
        details: `Razón Social: ${company.legalName}, CIF: ${company.taxId}`
    });

    return company;
}

export function deleteCompany(id: string, employeeName: string = 'Admin'): boolean {
    const data = getDB();
    const index = (data.companies || []).findIndex((c: any) => c.id === id);
    if (index === -1) return false;

    const company = data.companies[index];
    data.companies.splice(index, 1);

    // Register Log
    addLog({
        id: 'log-' + Date.now(),
        employeeName: employeeName,
        action: `BORRADO de Cliente: ${company.name}`,
        timestamp: new Date().toISOString(),
        details: `Cliente ID: ${id} eliminado.`
    });

    saveDB(data);
    return true;
}

// --- Campaigns ---
export function getCampaigns(): Campaign[] {
    return getDB().campaigns || [];
}
export function addCampaign(campaign: Campaign, employeeName: string = 'Admin'): Campaign {
    const data = getDB();
    if (!data.campaigns) data.campaigns = [];
    data.campaigns.push(campaign);
    saveDB(data);

    // Register Log
    addLog({
        id: 'log-' + Date.now(),
        employeeName: employeeName,
        action: `Nueva Campaña: ${campaign.name}`,
        timestamp: new Date().toISOString(),
        details: `Cliente ID: ${campaign.companyId}, ForceView: ${campaign.forceView}`
    });

    return campaign;
}

export function deleteCampaign(id: string, employeeName: string = 'Admin'): boolean {
    const data = getDB();
    const index = (data.campaigns || []).findIndex((c: any) => c.id === id);
    if (index === -1) return false;

    const campaign = data.campaigns[index];
    data.campaigns.splice(index, 1);

    // Register Log
    addLog({
        id: 'log-' + Date.now(),
        employeeName: employeeName,
        action: `BORRADO de Campaña: ${campaign.name}`,
        timestamp: new Date().toISOString(),
        details: `Campaña ID: ${id} eliminada.`
    });

    saveDB(data);
    return true;
}

export function incrementCampaignImpressions(id: string): boolean {
    const data = getDB();
    if (!data.campaigns) data.campaigns = [];
    const index = data.campaigns.findIndex((c: Campaign) => c.id === id);
    if (index === -1) return false;

    if (typeof data.campaigns[index].impressions !== 'number') {
        data.campaigns[index].impressions = 0;
    }
    data.campaigns[index].impressions += 1;
    saveDB(data);
    return true;
}

// --- Employees ---
export function getEmployees(): Employee[] {
    return getDB().employees || [];
}
export function addEmployee(employee: Employee): Employee {
    const data = getDB();
    if (!data.employees) data.employees = [];
    data.employees.push(employee);
    saveDB(data);
    return employee;
}

export function updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const data = getDB();
    if (!data.employees) data.employees = [];
    const index = data.employees.findIndex((e: Employee) => e.id === id);
    if (index === -1) return null;
    data.employees[index] = { ...data.employees[index], ...updates };
    saveDB(data);
    return data.employees[index];
}

export function deleteEmployee(id: string): boolean {
    const data = getDB();
    const initialLength = (data.employees || []).length;
    data.employees = (data.employees || []).filter((e: any) => e.id !== id);
    if (data.employees.length === initialLength) return false;
    saveDB(data);
    return true;
}

// --- Logs ---
export function getLogs(): AppLog[] {
    return getDB().logs || [];
}

export function addLog(log: AppLog): AppLog {
    const data = getDB();
    if (!data.logs) data.logs = [];
    data.logs.push(log);
    saveDB(data);
    return log;
}

// --- Moderation ---
export function getModerationQueue(): ModerationItem[] {
    const data = getDB();
    return data.moderation_queue || [];
}

export function addModerationItem(item: ModerationItem): ModerationItem {
    const data = getDB();
    if (!data.moderation_queue) data.moderation_queue = [];
    data.moderation_queue.push(item);
    saveDB(data);
    return item;
}

export function updateModerationItem(id: string, updates: Partial<ModerationItem>): ModerationItem | null {
    const data = getDB();
    if (!data.moderation_queue) data.moderation_queue = [];
    const index = data.moderation_queue.findIndex((m: ModerationItem) => m.id === id);
    if (index === -1) return null;
    data.moderation_queue[index] = { ...data.moderation_queue[index], ...updates };
    saveDB(data);
    return data.moderation_queue[index];
}

// --- Viral Stats ---
export function trackVideoEvent(videoId: string, event: 'view' | 'like', videoData?: any) {
    const data = getDB();
    if (!data.viral_stats) data.viral_stats = {};
    if (!data.viral_stats[videoId]) {
        data.viral_stats[videoId] = {
            id: videoId,
            user: videoData?.user || 'Desconocido',
            description: videoData?.description || '',
            category: videoData?.category || 'general',
            views: 0,
            likes: 0
        };
    }

    if (event === 'view') data.viral_stats[videoId].views += 1;
    if (event === 'like') data.viral_stats[videoId].likes += 1;

    saveDB(data);
    return data.viral_stats[videoId];
}

export function getViralStats() {
    const data = getDB();
    return data.viral_stats || {};
}

// --- Funciones de Utilidad Avanzadas ---

export function generateMatricula(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'VOZ-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function getVideosByUser(userHandle: string): ModerationItem[] {
    const data = getDB();
    const moderationVideos = (data.moderation_queue || []).filter((item: ModerationItem) =>
        item.userHandle === userHandle && (item.type === 'video' || item.type === 'audio')
    );

    // Also get videos from viral_stats that might not be in moderation_queue
    const viralStats = data.viral_stats || {};
    const viralVideos = Object.values(viralStats)
        .filter((v: any) => v.user === userHandle)
        .map((v: any) => ({
            id: v.id,
            type: 'video',
            url: v.videoUrl || '', // fallback if missing
            userHandle: v.user,
            content: v.description,
            timestamp: new Date().toISOString(), // fallback
            status: 'approved',
            views: v.views,
            likes: v.likes
        }));

    // Combine and deduplicate by ID
    const allVideos = [...moderationVideos];
    viralVideos.forEach(vv => {
        if (!allVideos.find(mv => mv.id === vv.id)) {
            allVideos.push(vv as any);
        }
    });

    return allVideos;
}

export function getModerationHistoryByEmployee(employeeName: string): ModerationItem[] {
    const data = getDB();
    return (data.moderation_queue || []).filter((item: ModerationItem) =>
        item.moderatedBy === employeeName ||
        (item.status !== 'pending' && item.moderatedBy?.includes(employeeName))
    );
}


// --- Coin Sales ---
export function getCoinSales(): CoinSale[] {
    const data = getDB();
    return data.coin_sales || [];
}

export function addCoinSale(sale: CoinSale): CoinSale {
    const data = getDB();
    if (!data.coin_sales) data.coin_sales = [];
    data.coin_sales.push(sale);
    saveDB(data);
    return sale;
}

export function getBillingStats() {
    const data = getDB();
    const sales = getCoinSales();
    const users = data.app_users || [];

    const stats: any = {
        totalRevenue: 0,
        totalAdRevenue: 0, // Inversión total en publicidad
        totalCirculatingCoins: 0, // "Monedas en el aire"
        packs: {
            5: { count: 0, revenue: 0 },
            10: { count: 0, revenue: 0 },
            20: { count: 0, revenue: 0 },
            100: { count: 0, revenue: 0 }
        }
    };

    // Calculate Ads Revenue
    const campaigns = data.campaigns || [];
    campaigns.forEach((camp: Campaign) => {
        stats.totalAdRevenue += (camp.investment || 0);
    });
    stats.totalRevenue += stats.totalAdRevenue;

    sales.forEach(sale => {
        stats.totalRevenue += sale.price;
        if (stats.packs[sale.packType]) {
            stats.packs[sale.packType].count += 1;
            stats.packs[sale.packType].revenue += sale.price;
        }
    });

    // Sum circulating coins from all users
    users.forEach((user: AppUser) => {
        stats.totalCirculatingCoins += (user.walletBalance || 0);
    });

    // Find best seller
    let bestSeller = null;
    let maxCount = -1;
    [5, 10, 20, 100].forEach(p => {
        if (stats.packs[p].count > maxCount) {
            maxCount = stats.packs[p].count;
            bestSeller = p;
        }
    });
    stats.bestSeller = bestSeller;

    return stats;
}

// --- Creators ---
export function getCreators(): Creator[] {
    const data = getDB();
    return data.creators || [];
}

export function addCreator(creator: Creator, employeeName: string = 'Admin'): Creator {
    const data = getDB();
    if (!data.creators) data.creators = [];
    data.creators.push(creator);
    saveDB(data);

    // Register Log
    addLog({
        id: 'log-' + Date.now(),
        employeeName: employeeName,
        action: `Nuevo Perfil de Creator/Empresa: ${creator.userHandle}`,
        timestamp: new Date().toISOString(),
        details: `ID: ${creator.id}. Nombre Real: ${creator.realName}`
    });

    return creator;
}

/**
 * Increments creator coins based on interaction type and calculates commissions
 * Gifts: 45% for creator, 55% for VOZ (1 gift = 1 coin = 1 euro)
 * PMs: 40% for creator, 60% for VOZ (1 PM = 5 coins = 5 euro)
 */
export function addCreatorCoinInteraction(creatorId: string, type: 'gift' | 'pm', employeeName: string = 'Simulador', senderHandle: string = ''): Creator | null {
    const data = getDB();
    const index = (data.creators || []).findIndex((c: any) => c.id === creatorId);
    if (index === -1) return null;

    const creator = data.creators[index];
    if (!creator.stats) {
        creator.stats = { totalGifts: 0, totalPMs: 0, earnedFromGifts: 0, earnedFromPMs: 0 };
        creator.earnedEuro = 0;
    }

    let earned = 0;

    if (type === 'gift') {
        const valueCoins = 1;
        const commissionRate = 0.45;
        earned = valueCoins * commissionRate;

        // DIRECT NET SHARE: Only the earned part is added to their coin balance
        creator.totalCoins += earned;
        creator.withdrawableCoins += earned;
        creator.stats.totalGifts += 1;
        creator.stats.earnedFromGifts += earned;
        creator.earnedEuro += earned;
    } else if (type === 'pm') {
        const valueCoins = 5;
        const commissionRate = 0.40;
        earned = valueCoins * commissionRate;

        // DIRECT NET SHARE: 40% of 5 coins = 2 coins/euro added to balance
        creator.totalCoins += earned;
        creator.withdrawableCoins += earned;
        creator.stats.totalPMs += 1;
        creator.stats.earnedFromPMs += earned;
        creator.earnedEuro += earned;
    }

    // UPDATE SENDER STATS (If senderHandle is provided)
    if (senderHandle && data.app_users) {
        const userIndex = data.app_users.findIndex((u: any) => u.handle.toLowerCase() === senderHandle.toLowerCase());
        if (userIndex !== -1) {
            if (!data.app_users[userIndex].stats) {
                data.app_users[userIndex].stats = { totalDonated: 0 };
            }
            const cost = type === 'gift' ? 1 : 5;
            data.app_users[userIndex].stats.totalDonated = (data.app_users[userIndex].stats.totalDonated || 0) + cost;
        }
    }

    // Register Log
    addLog({
        id: 'log-' + Date.now(),
        employeeName: employeeName,
        action: `Simulación de ${type === 'gift' ? 'Regalo' : 'PM'}`,
        timestamp: new Date().toISOString(),
        details: `Creador: ${creator.userHandle} (ID: ${creatorId}). Incremento: ${earned.toFixed(2)}. ${senderHandle ? 'Sender: ' + senderHandle : ''}`
    });

    saveDB(data);
    return creator;
}

export function updateCreator(id: string, updates: Partial<Creator>, employeeName: string = 'Admin'): Creator | null {
    try {
        const data = getDB();
        const index = (data.creators || []).findIndex((c: any) => c.id === id);

        console.log(`DB updateCreator - ID: ${id}, Index found: ${index}`);

        if (index === -1) return null;

        data.creators[index] = { ...data.creators[index], ...updates };

        // SYNC: Status synchronization with App User
        if (updates.status) {
            if (!data.app_users) data.app_users = [];

            // Link is usually by handle or ID mapping
            const handle = data.creators[index].userHandle;
            const userIndex = data.app_users.findIndex((u: any) => u.handle === handle || u.id === id.replace(/^cr-/, 'u'));

            if (userIndex !== -1) {
                if (updates.status === 'suspended') {
                    data.app_users[userIndex].status = 'banned';
                } else if (updates.status === 'active') {
                    data.app_users[userIndex].status = 'active';
                }
            }
        }

        saveDB(data);

        console.log(`DB updateCreator - SAVED successfully for ${id}`);

        // Register Log
        addLog({
            id: 'log-' + Date.now(),
            employeeName: employeeName,
            action: `Edición de Creador: ${data.creators[index].userHandle}`,
            timestamp: new Date().toISOString(),
            details: `Ajustes realizados: ${Object.keys(updates).join(', ')}`
        });

        return data.creators[index];
    } catch (e) {
        console.error(`DB updateCreator - FATAL ERROR:`, e);
        return null;
    }
}

export function deleteCreatorCompletely(id: string, employeeName: string = 'Admin'): boolean {
    const data = getDB();
    const creatorIndex = (data.creators || []).findIndex((c: any) => c.id === id);
    if (creatorIndex === -1) return false;

    const creator = data.creators[creatorIndex];
    const userHandle = creator.userHandle;

    // 1. Remove from creators
    data.creators.splice(creatorIndex, 1);

    // 2. Remove from app_users
    if (data.app_users) {
        data.app_users = data.app_users.filter((u: any) => u.handle !== userHandle && u.id !== id);
    }

    // 3. Remove from moderation_queue (videos)
    if (data.moderation_queue) {
        data.moderation_queue = data.moderation_queue.filter((m: any) => m.userHandle !== userHandle);
    }

    // 4. Remove from viral_stats
    if (data.viral_stats) {
        Object.keys(data.viral_stats).forEach(vid => {
            if (data.viral_stats[vid].user === userHandle) {
                delete data.viral_stats[vid];
            }
        });
    }

    // 5. Remove from redemption_requests
    if (data.redemption_requests) {
        data.redemption_requests = data.redemption_requests.filter((r: any) => r.creatorId !== id);
    }

    // 6. Remove notifications
    if (data.notifications) {
        data.notifications = data.notifications.filter((n: any) => n.recipientId !== id);
    }

    // 7. Register Log
    addLog({
        id: 'log-' + Date.now(),
        employeeName: employeeName,
        action: `ELIMINACIÓN TOTAL de Creador: ${userHandle}`,
        timestamp: new Date().toISOString(),
        details: `Borrado en cascada para ID: ${id}. Perfil, usuario, vídeos y actividad eliminados.`
    });

    saveDB(data);
    return true;
}

export function getRedemptionRequests(): RedemptionRequest[] {
    const data = getDB();
    return data.redemption_requests || [];
}

export function addRedemptionRequest(req: RedemptionRequest): RedemptionRequest {
    const data = getDB();

    // VALIDATION: Minimum 50 coins for redemption
    if (req.amountCoins < 50) {
        throw new Error('Minimum redemption amount is 50 coins (50€).');
    }

    // FIND CREATOR AND DEDUCT BALANCE
    const creators = data.creators || [];
    const creatorIndex = creators.findIndex((c: any) => c.id === req.creatorId);

    if (creatorIndex === -1) {
        throw new Error('Creator not found');
    }

    const creator = creators[creatorIndex];

    if (creator.withdrawableCoins < req.amountCoins) {
        throw new Error('Insufficient withdrawable funds');
    }

    // Deduct coins from withdrawable balance
    creator.withdrawableCoins -= req.amountCoins;
    // Also deduct from earned total to sync (it's the net amount)
    creator.earnedEuro -= req.amountCoins;

    if (!data.redemption_requests) data.redemption_requests = [];
    data.redemption_requests.push(req);
    saveDB(data);
    return req;
}

export function updateRedemptionStatus(id: string, status: RedemptionRequest['status'], employeeName: string): RedemptionRequest | null {
    const data = getDB();
    const index = (data.redemption_requests || []).findIndex((r: any) => r.id === id);
    if (index === -1) return null;

    const request = data.redemption_requests[index];
    const oldStatus = request.status;
    request.status = status;
    request.processedAt = new Date().toISOString();
    request.processedBy = employeeName;

    // Register Log
    addLog({
        id: 'log-' + Date.now(),
        employeeName: employeeName,
        action: `Cambio de Estado Pago: ${status.toUpperCase()}`,
        timestamp: new Date().toISOString(),
        details: `Solicitud ${id} (Creador: ${request.creatorId}). Importe: ${request.amountEuro}€. Estado anterior: ${oldStatus}`
    });

    // If approved or completed, we can consider the coins "locked" or "deducted"
    // To match the user's flow:
    // 1. Pending -> Approved (Approved in Creators, visible in Billing)
    // 2. Approved -> Completed (Paid in Billing)
    // We deduct coins when it moves to 'approved' to avoid double spending.
    if ((status === 'approved' || status === 'completed') && (oldStatus !== 'approved' && oldStatus !== 'completed')) {
        const creatorIndex = (data.creators || []).findIndex((c: any) => c.id === request.creatorId);
        if (creatorIndex !== -1) {
            data.creators[creatorIndex].withdrawableCoins -= request.amountCoins;
            data.creators[creatorIndex].earnedEuro -= request.amountEuro;

            // Ensure no negative values (sanity check)
            if (data.creators[creatorIndex].withdrawableCoins < 0) {
                data.creators[creatorIndex].withdrawableCoins = 0;
            }
            if (data.creators[creatorIndex].earnedEuro < 0) {
                data.creators[creatorIndex].earnedEuro = 0;
            }
        }
    }

    saveDB(data);
    return request;
}

// --- Notifications ---
export function getNotifications(recipientId?: string): Notification[] {
    const data = getDB();
    const notifications = data.notifications || [];
    if (recipientId) {
        return notifications.filter((n: Notification) => n.recipientId === recipientId);
    }
    return notifications;
}

export function addNotification(notification: Notification): Notification {
    const data = getDB();
    if (!data.notifications) data.notifications = [];
    data.notifications.push(notification);
    saveDB(data);
    return notification;
}
