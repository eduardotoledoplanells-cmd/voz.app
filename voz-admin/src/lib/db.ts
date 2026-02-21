import fs from 'fs';
import path from 'path';
import { Product } from '@/types';
import { products as initialProducts } from './data';

const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.json');

// Initialize DB if it doesn't exist
let dbData = {
    products: [] as Product[],
    app_users: [] as any[],
    companies: [] as any[],
    campaigns: [] as any[],
    employees: [
        { id: '1', username: 'admin', password: '123', role: 1, lastLogin: 'Nunca', active: true }
    ] as any[],
    logs: [] as any[],
    transactions: [] as any[], // Nueva tabla para transacciones
    videos: [] as any[] // Nueva tabla para vídeos sociales
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
            transactions: [],
            videos: []
        };
        // Force write to fix corrupted file
        try { fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2)); } catch (e) { }
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
        transactions: [],
        videos: []
    };
    try { fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2)); } catch (e) { }
}

export function getProducts(): Product[] {
    try {
        const data = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(data).products;
    } catch (e) {
        return dbData.products || [];
    }
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
    saveDB(data);
    return data.products[index];
}

export function deleteProduct(id: string): boolean {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const initialLength = data.products.length;
    data.products = data.products.filter((p: Product) => p.id !== id);

    if (data.products.length === initialLength) return false;

    saveDB(data);
    return true;
}

export function deleteProducts(ids: string[]): boolean {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const initialLength = data.products.length;
    data.products = data.products.filter((p: Product) => !ids.includes(p.id));

    if (data.products.length === initialLength) return false;

    saveDB(data);
    return true;
}

// --- App Users Logic (VOZ) ---
export interface AppUser {
    id: string;
    handle: string;
    email: string; // Internal use
    password?: string; // Salteado/Hashed
    status: 'active' | 'banned' | 'verified';
    reputation: number;
    walletBalance?: number; // Added for monetization
    joinedAt: string;
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
    createdAt: string;
}

export interface Employee {
    id: string;
    username: string;
    password?: string;
    role: 1 | 2 | 3 | 4 | 5 | 6; // 1: Director, 2: Admin...
    lastLogin: string;
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
    type: 'video' | 'audio' | 'text' | 'image';
    url: string;
    userHandle: string;
    content?: string;
    reportReason?: string;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
}

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

// Helper to get DB data cleanly
export function getDB() {
    try {
        return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } catch (e) {
        return dbData || {};
    }
}

// Helper to save DB data
export function saveDB(data: any) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Warning: Unabled to write to db.json (Read-Only file system in Vercel)', error);
    }
}

export function getAppUsers(): AppUser[] {
    const data = getDB();
    return data.app_users || [];
}

export function updateAppUser(id: string, updates: Partial<AppUser>): AppUser | null {
    const data = getDB();
    if (!data.app_users) data.app_users = [];

    const index = data.app_users.findIndex((u: AppUser) => u.id === id);
    if (index === -1) return null;

    data.app_users[index] = { ...data.app_users[index], ...updates };
    saveDB(data);
    return data.app_users[index];
}

export function addAppUser(user: AppUser): AppUser {
    const data = getDB();
    if (!data.app_users) data.app_users = [];
    data.app_users.push(user);
    saveDB(data);
    return user;
}

export function deleteAppUser(id: string): boolean {
    const data = getDB();
    const initialLength = (data.app_users || []).length;
    data.app_users = (data.app_users || []).filter((u: any) => u.id !== id);
    if (data.app_users.length === initialLength) return false;
    saveDB(data);
    return true;
}

// --- Companies ---
export function getCompanies(): Company[] {
    return getDB().companies || [];
}
export function addCompany(company: Company): Company {
    const data = getDB();
    if (!data.companies) data.companies = [];
    data.companies.push(company);
    saveDB(data);
    return company;
}

export function deleteCompany(id: string): boolean {
    const data = getDB();
    const initialLength = (data.companies || []).length;
    data.companies = (data.companies || []).filter((c: any) => c.id !== id);
    if (data.companies.length === initialLength) return false;
    saveDB(data);
    return true;
}

// --- Campaigns ---
export function getCampaigns(): Campaign[] {
    return getDB().campaigns || [];
}
export function addCampaign(campaign: Campaign): Campaign {
    const data = getDB();
    if (!data.campaigns) data.campaigns = [];
    data.campaigns.push(campaign);
    saveDB(data);
    return campaign;
}

export function deleteCampaign(id: string): boolean {
    const data = getDB();
    const initialLength = (data.campaigns || []).length;
    data.campaigns = (data.campaigns || []).filter((c: any) => c.id !== id);
    if (data.campaigns.length === initialLength) return false;
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

export function updateModerationItem(id: string, updates: Partial<ModerationItem>): ModerationItem | null {
    const data = getDB();
    if (!data.moderation_queue) data.moderation_queue = [];
    const index = data.moderation_queue.findIndex((m: ModerationItem) => m.id === id);
    if (index === -1) return null;
    data.moderation_queue[index] = { ...data.moderation_queue[index], ...updates };
    saveDB(data);
    return data.moderation_queue[index];
}
// --- Transactions / Income ---
export interface Transaction {
    id: string;
    senderId: string;
    receiverId: string; // "platform" for coin purchases, or user handle for gifts
    amount: number;
    type: 'gift' | 'purchase' | 'fee';
    timestamp: string;
    videoId?: string;
}

export function addTransaction(tx: Transaction): Transaction {
    const data = getDB();
    if (!data.transactions) data.transactions = [];
    data.transactions.push(tx);
    saveDB(data);
    return tx;
}

export function getTransactions(): Transaction[] {
    return getDB().transactions || [];
}

// --- Videos ---
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
