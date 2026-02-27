import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials missing in environment variables for voz-admin');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AppUser {
    id: string;
    handle: string;
    email: string;
    password?: string;
    status: 'active' | 'banned' | 'verified';
    reputation: number;
    walletBalance?: number;
    joinedAt: string;
}

// In some parts of the admin it's referred to as Creator
export interface Creator extends AppUser {
    earnedEuro: number;
    stats?: {
        totalGifts: number;
        totalVideos: number;
    };
}

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
    videoUrl?: string;
    startDate?: string;
    endDate?: string;
    forceView: boolean;
    target: string;
    impressions: number;
    createdAt: string;
}

export interface Employee {
    id: string;
    username: string;
    password?: string;
    role: number;
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
    matricula?: string;
    type: 'video' | 'audio' | 'text' | 'image';
    url: string;
    userHandle: string;
    reportedBy?: string;
    content?: string;
    reportReason?: string;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
    moderatedBy?: string;
}

export interface VideoPost {
    id: string;
    videoUrl: string;
    user: string;
    description: string;
    likes: number;
    shares: number;
    commentsCount: number;
    views: number;
    createdAt: string;
    music?: string;
    isAd?: boolean;
}

// --- App Users / Creators ---
export async function getAppUsers(): Promise<AppUser[]> {
    const { data, error } = await supabase.from('app_users').select('*');
    if (error) return [];
    return data.map(u => ({
        id: u.id,
        handle: u.handle,
        email: u.email,
        password: u.password,
        status: u.status,
        reputation: u.reputation,
        walletBalance: parseFloat(u.wallet_balance),
        joinedAt: u.joined_at
    }));
}

export async function getCreators(): Promise<Creator[]> {
    const users = await getAppUsers();
    // In this simplified version, all app users are creators
    return users.map(u => ({
        ...u,
        earnedEuro: (u.walletBalance || 0) * 0.05, // Example conversion
        stats: {
            totalGifts: Math.floor((u.walletBalance || 0) / 10),
            totalVideos: 0 // Would need another query
        }
    }));
}

export async function updateAppUser(id: string, updates: Partial<AppUser>): Promise<AppUser | null> {
    const dbUpdates: any = { ...updates };
    if (updates.walletBalance !== undefined) {
        dbUpdates.wallet_balance = updates.walletBalance;
        delete dbUpdates.walletBalance;
    }
    const { data, error } = await supabase.from('app_users').update(dbUpdates).eq('id', id).select().single();
    if (error) return null;
    return {
        ...data,
        walletBalance: parseFloat(data.wallet_balance)
    };
}

export async function updateCreator(id: string, updates: any, employeeName: string): Promise<Creator | null> {
    const result = await updateAppUser(id, updates);
    if (result) {
        await addLog({
            id: Date.now().toString(),
            employeeName,
            action: 'UPDATE_CREATOR',
            timestamp: new Date().toISOString(),
            details: `ID: ${id}, Updates: ${JSON.stringify(updates)}`
        });
    }
    return result as Creator;
}

export async function addAppUser(user: AppUser): Promise<AppUser | null> {
    const { data, error } = await supabase.from('app_users').insert([{
        handle: user.handle,
        email: user.email,
        password: user.password,
        status: user.status,
        reputation: user.reputation,
        wallet_balance: user.walletBalance || 0
    }]).select().single();
    if (error) return null;
    return data;
}

export async function addCreator(user: any, employeeName: string): Promise<Creator | null> {
    const result = await addAppUser(user);
    if (result) {
        await addLog({
            id: Date.now().toString(),
            employeeName,
            action: 'ADD_CREATOR',
            timestamp: new Date().toISOString(),
            details: `Handle: ${user.handle}`
        });
    }
    return result as Creator;
}

export async function deleteCreatorCompletely(id: string, employeeName: string): Promise<boolean> {
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    if (error) return false;
    await addLog({
        id: Date.now().toString(),
        employeeName,
        action: 'DELETE_CREATOR',
        timestamp: new Date().toISOString(),
        details: `ID: ${id}`
    });
    return true;
}

export async function addCreatorCoinInteraction(creatorId: string, type: string, employeeName: string, detail: string = ''): Promise<Creator | null> {
    // 1. Get Creator
    const users = await getAppUsers();
    const user = users.find(u => u.id === creatorId || u.handle === creatorId);
    if (!user) return null;

    // 2. Calculate coin increase
    let amount = 0;
    if (type === 'gift') amount = 10; // Default amount for a gift if not specified
    if (type === 'pm') amount = 5;
    if (type === 'verified_bonus') amount = 100;

    // 3. Update Balance
    const newBalance = (user.walletBalance || 0) + amount;
    const updated = await updateAppUser(user.id, { walletBalance: newBalance });

    if (updated) {
        await addLog({
            id: Date.now().toString(),
            employeeName,
            action: `CREATOR_INTERACTION_${type.toUpperCase()}`,
            timestamp: new Date().toISOString(),
            details: `Creator: ${user.handle}, Detail: ${detail}, New Balance: ${newBalance}`
        });
    }

    return updated as Creator;
}

// --- Voice Comments Logic ---
export interface VoiceComment {
    id: string;
    video_id: string;
    user_handle: string;
    avatar_url?: string;
    audio_url: string;
    duration: string;
    likes: number;
    created_at: string;
}

export async function getVoiceComments(videoId: string): Promise<any[]> {
    // Cargar comentarios principales
    const { data: parentComments, error: parentsError } = await supabase
        .from('voice_comments')
        .select('*')
        .eq('video_id', videoId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

    if (parentsError || !parentComments) return [];

    const parentIds = parentComments.map(c => c.id);

    // Cargar respuestas
    let replies: any[] = [];
    if (parentIds.length > 0) {
        const { data: repliesData } = await supabase
            .from('voice_comments')
            .select('*')
            .in('parent_id', parentIds)
            .order('created_at', { ascending: true });
        if (repliesData) replies = repliesData;
    }

    const allComments = [...parentComments, ...replies];
    if (allComments.length === 0) return [];

    const allCommentIds = allComments.map(c => c.id);

    // Contar likes dinámicamente
    let likesData: any[] = [];
    const { data: fetchedLikes } = await supabase
        .from('voice_comment_likes')
        .select('comment_id')
        .in('comment_id', allCommentIds);

    if (fetchedLikes) likesData = fetchedLikes;

    const likesCountMap = new Map<string, number>();
    likesData.forEach(like => {
        const cId = like.comment_id;
        likesCountMap.set(cId, (likesCountMap.get(cId) || 0) + 1);
    });

    // Fetch user profiles to get up-to-date avatars
    const handles = [...new Set(allComments.map(c => c.user_handle))];
    const userMap = new Map();
    if (handles.length > 0) {
        const { data: users } = await supabase
            .from('app_users')
            .select('handle, profile_image')
            .in('handle', handles);
        users?.forEach(u => userMap.set(u.handle, u.profile_image));
    }

    const enrichedComments = allComments.map(c => ({
        ...c,
        avatar_url: userMap.get(c.user_handle) || null,
        likes: likesCountMap.get(c.id) || 0
    }));

    return enrichedComments;
}

export async function addVoiceComment(comment: Partial<VoiceComment>): Promise<VoiceComment | null> {
    const { data, error } = await supabase
        .from('voice_comments')
        .insert([comment])
        .select()
        .single();

    if (error) {
        console.error('Error adding voice comment:', error);
        return null;
    }

    return data;
}

// --- User Penalties ---
export async function addPenaltyToUser(handle: string, penalty: { url?: string, reason: string }) {
    await supabase.from('user_penalties').insert([{
        user_handle: handle,
        content_url: penalty.url,
        reason: penalty.reason
    }]);

    // Also decrease reputation
    const users = await getAppUsers();
    const user = users.find(u => u.handle === handle);
    if (user) {
        await updateAppUser(user.id, { reputation: Math.max(0, user.reputation - 1) });
    }
}

// --- Employees ---
export async function getEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase.from('employees').select('*');
    if (error) return [];
    return data.map(e => ({
        id: e.id,
        username: e.username,
        password: e.password,
        role: e.role,
        lastLogin: e.last_login || 'Nunca',
        active: e.active
    }));
}

export async function addEmployee(employee: Employee): Promise<Employee | null> {
    const { data, error } = await supabase.from('employees').insert([{
        username: employee.username,
        password: employee.password,
        role: employee.role,
        active: employee.active
    }]).select().single();
    if (error) return null;
    return data;
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    const dbUpdates: any = { ...updates };
    if (updates.lastLogin) {
        dbUpdates.last_login = updates.lastLogin;
        delete dbUpdates.lastLogin;
    }
    const { data, error } = await supabase.from('employees').update(dbUpdates).eq('id', id).select().single();
    if (error) return null;
    return data;
}

export async function deleteAppUser(id: string): Promise<boolean> {
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    if (error) return false;
    return true;
}

// --- Companies ---
export async function getCompanies(): Promise<Company[]> {
    const { data, error } = await supabase.from('companies').select('*');
    if (error) return [];
    return data.map(c => ({
        ...c,
        legalName: c.legal_name,
        taxId: c.tax_id,
        contactEmail: c.contact_email,
        joinedAt: c.joined_at
    }));
}

export async function addCompany(company: Company, employeeName: string): Promise<Company | null> {
    const { data, error } = await supabase.from('companies').insert([{
        id: company.id,
        name: company.name,
        legal_name: company.legalName,
        tax_id: company.taxId,
        address: company.address,
        city: company.city,
        zip: company.zip,
        country: company.country,
        phone: company.phone,
        contact_email: company.contactEmail,
        balance: company.balance
    }]).select().single();

    if (error) return null;

    await addLog({
        id: Date.now().toString(),
        employeeName,
        action: 'ADD_COMPANY',
        timestamp: new Date().toISOString(),
        details: `Name: ${company.name}`
    });

    return data;
}

export async function deleteCompany(id: string, employeeName: string): Promise<boolean> {
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) return false;

    await addLog({
        id: Date.now().toString(),
        employeeName,
        action: 'DELETE_COMPANY',
        timestamp: new Date().toISOString(),
        details: `ID: ${id}`
    });

    return true;
}

// --- Notifications ---
export interface Notification {
    id: string;
    recipientId: string;
    type: string;
    title: string;
    message: string;
    timestamp: string;
    readStatus: boolean;
}

export async function getNotifications(recipientId?: string): Promise<Notification[]> {
    let query = supabase.from('notifications').select('*');
    if (recipientId) query = query.eq('recipient_id', recipientId);

    const { data, error } = await query.order('timestamp', { ascending: false });
    if (error) return [];

    return data.map(n => ({
        id: n.id,
        recipientId: n.recipient_id,
        type: n.type,
        title: n.title,
        message: n.message,
        timestamp: n.timestamp,
        readStatus: n.read_status
    }));
}

export async function addNotification(n: Notification): Promise<Notification | null> {
    const { data, error } = await supabase.from('notifications').insert([{
        recipient_id: n.recipientId,
        type: n.type,
        title: n.title,
        message: n.message,
        read_status: n.readStatus
    }]).select().single();
    if (error) return null;
    return data;
}

// --- Campaigns ---
export async function getCampaigns(): Promise<Campaign[]> {
    const { data, error } = await supabase.from('campaigns').select('*');
    if (error) return [];
    return data.map(c => ({
        ...c,
        companyId: c.company_id,
        videoUrl: c.video_url,
        startDate: c.start_date,
        endDate: c.end_date,
        forceView: c.force_view,
        createdAt: c.created_at
    }));
}

export async function addCampaign(campaign: Campaign, employeeName: string): Promise<Campaign | null> {
    const { data, error } = await supabase.from('campaigns').insert([{
        id: campaign.id,
        company_id: campaign.companyId,
        name: campaign.name,
        budget: campaign.budget,
        status: campaign.status,
        type: campaign.type,
        video_url: campaign.videoUrl,
        start_date: campaign.startDate,
        end_date: campaign.endDate,
        force_view: campaign.forceView,
        target: campaign.target,
        investment: (campaign as any).investment || 0
    }]).select().single();

    if (error) return null;

    await addLog({
        id: Date.now().toString(),
        employeeName,
        action: 'ADD_CAMPAIGN',
        timestamp: new Date().toISOString(),
        details: `Name: ${campaign.name}`
    });

    return data;
}

export async function deleteCampaign(id: string, employeeName: string): Promise<boolean> {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) return false;

    await addLog({
        id: Date.now().toString(),
        employeeName,
        action: 'DELETE_CAMPAIGN',
        timestamp: new Date().toISOString(),
        details: `ID: ${id}`
    });

    return true;
}

export async function incrementCampaignImpressions(id: string): Promise<boolean> {
    const { data: campaign } = await supabase.from('campaigns').select('impressions').eq('id', id).single();
    if (!campaign) return false;

    const { error } = await supabase.from('campaigns').update({
        impressions: (campaign.impressions || 0) + 1
    }).eq('id', id);

    return !error;
}

export async function getViralStats(): Promise<VideoPost[]> {
    return getVideos();
}

export async function trackVideoEvent(videoId: string, event: string, videoData?: any): Promise<boolean> {
    console.log(`Tracking event ${event} for video ${videoId}`, videoData);
    return true;
}

// --- Moderation ---
export async function getModerationQueue(): Promise<ModerationItem[]> {
    const { data, error } = await supabase.from('moderation_queue').select('*');
    if (error) return [];
    return data.map(m => ({
        id: m.id,
        matricula: m.matricula,
        type: m.type,
        url: m.url,
        userHandle: m.user_handle,
        reportedBy: m.reported_by,
        content: m.content,
        reportReason: m.report_reason,
        timestamp: m.timestamp,
        status: m.status,
        moderatedBy: m.moderated_by
    }));
}

export async function addModerationItem(item: ModerationItem): Promise<ModerationItem | null> {
    const { data, error } = await supabase.from('moderation_queue').insert([{
        matricula: item.matricula,
        type: item.type,
        url: item.url,
        user_handle: item.userHandle,
        reported_by: item.reportedBy,
        content: item.content,
        report_reason: item.reportReason,
        status: item.status
    }]).select().single();
    if (error) return null;
    return data;
}

export async function updateModerationItem(id: string, updates: Partial<ModerationItem>): Promise<ModerationItem | null> {
    const dbUpdates: any = { ...updates };
    if (updates.userHandle) delete dbUpdates.userHandle;
    if (updates.moderatedBy) {
        dbUpdates.moderated_by = updates.moderatedBy;
        delete dbUpdates.moderatedBy;
    }
    const { data, error } = await supabase.from('moderation_queue').update(dbUpdates).eq('id', id).select().single();
    if (error) return null;
    return data;
}

export async function getModerationHistoryByEmployee(employeeName: string): Promise<ModerationItem[]> {
    const { data, error } = await supabase.from('moderation_queue').select('*').eq('moderated_by', employeeName).neq('status', 'pending');
    if (error) return [];
    return data.map(m => ({
        id: m.id,
        matricula: m.matricula,
        type: m.type,
        url: m.url,
        userHandle: m.user_handle,
        reportedBy: m.reported_by,
        content: m.content,
        reportReason: m.report_reason,
        timestamp: m.timestamp,
        status: m.status,
        moderatedBy: m.moderated_by
    }));
}

// --- Logs ---
export async function getLogs(): Promise<AppLog[]> {
    const { data, error } = await supabase.from('logs').select('*').order('timestamp', { ascending: false });
    if (error) return [];
    return data.map(l => ({
        id: l.id,
        employeeName: l.employee_name,
        action: l.action,
        timestamp: l.timestamp,
        details: l.details
    }));
}

export async function addLog(log: AppLog): Promise<AppLog | null> {
    const { data, error } = await supabase.from('logs').insert([{
        employee_name: log.employeeName,
        action: log.action,
        details: log.details
    }]).select().single();
    if (error) return null;
    return data;
}

export async function addInactivityLog(employeeName: string) {
    await addLog({
        id: Date.now().toString(),
        employeeName,
        action: 'INACTIVITY_ALERT',
        timestamp: new Date().toISOString(),
        details: 'Moderador detectado inactivo'
    });
}

// --- Productivity ---
export async function addProductivityLog(employeeName: string, cycleVideos: number, totalVideos: number) {
    await supabase.from('productivity').insert([{
        employee_name: employeeName,
        cycle_videos: cycleVideos,
        total_videos: totalVideos
    }]);
}

// --- Videos ---
export async function getVideos(): Promise<VideoPost[]> {
    const { data, error } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data.map(v => ({
        id: v.id,
        videoUrl: v.video_url,
        user: v.user_handle,
        description: v.description,
        likes: v.likes,
        shares: v.shares,
        commentsCount: v.comments_count,
        views: v.views,
        createdAt: v.created_at,
        music: v.music,
        isAd: v.is_ad
    }));
}

export async function getVideosByUser(handle: string): Promise<VideoPost[]> {
    const { data, error } = await supabase.from('videos').select('*').eq('user_handle', handle);
    if (error) return [];
    return data.map(v => ({
        id: v.id,
        videoUrl: v.video_url,
        user: v.user_handle,
        description: v.description,
        likes: v.likes,
        shares: v.shares,
        commentsCount: v.comments_count,
        views: v.views,
        createdAt: v.created_at,
        music: v.music,
        isAd: v.is_ad
    }));
}

export async function addVideo(video: VideoPost): Promise<VideoPost | null> {
    const { data, error } = await supabase
        .from('videos')
        .insert([{
            video_url: video.videoUrl,
            user_handle: video.user,
            description: video.description,
            music: video.music,
            likes: video.likes,
            shares: video.shares,
            comments_count: video.commentsCount,
            views: video.views,
            is_ad: video.isAd || false
        }])
        .select()
        .single();

    if (error) {
        console.error('Error adding video:', error);
        return null;
    }

    return {
        id: data.id,
        videoUrl: data.video_url,
        user: data.user_handle,
        description: data.description,
        likes: data.likes,
        shares: data.shares,
        commentsCount: data.comments_count,
        views: data.views,
        createdAt: data.created_at,
        music: data.music,
        isAd: data.is_ad
    };
}

// --- Billing & Redemptions ---
export async function getCoinSales(): Promise<any[]> {
    const { data, error } = await supabase.from('coin_sales').select('*').order('timestamp', { ascending: false });
    if (error) return [];
    return data;
}

export async function getRedemptionRequests(): Promise<any[]> {
    const { data, error } = await supabase.from('redemptions').select('*').order('timestamp', { ascending: false });
    if (error) return [];
    return data.map(r => ({
        id: r.id,
        userHandle: r.user_handle,
        amount: parseFloat(r.amount),
        status: r.status,
        method: r.method,
        details: r.details,
        timestamp: r.timestamp
    }));
}

export async function addRedemptionRequest(req: any): Promise<any | null> {
    const { data, error } = await supabase.from('redemptions').insert([{
        user_handle: req.creatorId || req.userHandle,
        amount: req.amountCoins || req.amount,
        status: 'pending',
        method: req.method || 'transfer',
        details: req.details || ''
    }]).select().single();
    if (error) return null;
    return data;
}

export async function updateRedemptionStatus(id: string, status: string, employeeName: string): Promise<any | null> {
    const { data, error } = await supabase.from('redemptions').update({ status }).eq('id', id).select().single();
    if (error) return null;

    await addLog({
        id: Date.now().toString(),
        employeeName,
        action: `REDEMPTION_${status.toUpperCase()}`,
        timestamp: new Date().toISOString(),
        details: `ID: ${id}`
    });

    return data;
}

export async function getBillingStats() {
    const sales = await getCoinSales();
    const redemptions = await getRedemptionRequests();

    const totalRevenue = sales.reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0);
    const totalRedeemed = redemptions.filter(r => r.status === 'approved').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
    const pendingRedemptions = redemptions.filter(r => r.status === 'pending').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);

    return {
        totalRevenue,
        totalRedeemed,
        pendingRedemptions,
        netRevenue: totalRevenue - totalRedeemed
    };
}

// Utilities
export function generateMatricula(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let res = '';
    for (let i = 0; i < 3; i++) res += letters[Math.floor(Math.random() * letters.length)];
    res += '-';
    for (let i = 0; i < 4; i++) res += numbers[Math.floor(Math.random() * numbers.length)];
    return res;
}
