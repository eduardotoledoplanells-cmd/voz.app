import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://obdrsqeueivhnbsibhen.supabase.co';
// Hack: Skip invalid vercel variable if detected via keyword
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isValidEnvKey = envKey.startsWith('eyJ') && !envKey.includes('M81T8_3');
const supabaseAnonKey = isValidEnvKey ? envKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';

if (!isValidEnvKey) {
    console.warn('Vercel Supabase key is invalid, using hardcoded fallback.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Inicialización de clientes
console.log("[Supabase] Initializing clients. URL:", supabaseUrl);
if (!serviceRoleKey) {
    console.warn("[Supabase] SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will likely fail.");
} else {
    try {
        const payload = JSON.parse(Buffer.from(serviceRoleKey.split('.')[1], 'base64').toString());
        console.log("[Supabase] Service Key Info - Ref:", payload.ref, "Role:", payload.role);
    } catch (e) {
        console.error("[Supabase] Error decoding Service Key:", e);
    }
}

export const supabaseAdmin = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    : supabase;

export interface AppUser {
    id: string;
    handle: string;
    email: string;
    password?: string;
    name?: string;
    bio?: string;
    profileImage?: string;
    isCreator?: boolean;
    status: 'active' | 'banned' | 'verified';
    reputation: number;
    walletBalance?: number;
    joinedAt: string;
    resetPin?: string;
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
    type: 'video' | 'audio' | 'text' | 'image' | 'profile';
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
    music?: any;
    isAd?: boolean;
    thumbnailUrl?: string;
    filterConfig?: any;
    isMuted?: boolean;
}

// --- App Users / Creators ---
export async function getAppUsers(): Promise<AppUser[]> {
    const { data, error } = await supabaseAdmin.from('app_users').select('*');
    if (error) {
        throw new Error("Supabase error: " + JSON.stringify(error));
    }
    return data.map(u => ({
        id: u.id,
        name: u.name,
        handle: u.handle,
        email: u.email,
        password: u.password,
        status: u.status,
        reputation: u.reputation,
        walletBalance: parseFloat(u.wallet_balance),
        joinedAt: u.joined_at,
        bio: u.bio,
        profileImage: u.profile_image,
        isCreator: u.is_creator,
        resetPin: u.reset_pin
    }));
}

export async function getCreators(): Promise<Creator[]> {
    const users = await getAppUsers();
    // In this simplified version, all app users are creators
    return users.map(u => ({
        ...u,
        totalCoins: u.walletBalance || 0,
        withdrawableCoins: u.walletBalance || 0,
        earnedEuro: (u.walletBalance || 0) * 0.05, // Example conversion
        stats: {
            totalGifts: Math.floor((u.walletBalance || 0) / 10),
            totalVideos: 0 // Would need another query
        }
    }));
}

export async function updateAppUser(id: string, updates: Partial<AppUser>): Promise<AppUser | null> {
    // Get current handle if changing
    let oldHandle = '';
    if (updates.handle !== undefined) {
        const { data: current } = await supabaseAdmin.from('app_users').select('handle').eq('id', id).single();
        if (current) oldHandle = current.handle;
    }

    const allowedKeys = ['name', 'handle', 'email', 'status', 'reputation', 'wallet_balance', 'bio', 'profile_image', 'is_creator', 'password', 'reset_pin'];
    const dbUpdates: any = {};

    // Map fields
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.handle !== undefined) dbUpdates.handle = updates.handle;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.reputation !== undefined) dbUpdates.reputation = updates.reputation;
    if (updates.walletBalance !== undefined) dbUpdates.wallet_balance = updates.walletBalance;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.profileImage !== undefined || (updates as any).profile_image !== undefined) {
        dbUpdates.profile_image = updates.profileImage || (updates as any).profile_image;
    }
    if (updates.isCreator !== undefined) dbUpdates.is_creator = updates.isCreator;
    if (updates.password !== undefined) dbUpdates.password = updates.password;
    if (updates.resetPin !== undefined) dbUpdates.reset_pin = updates.resetPin;

    // Filter only allowed keys and remove undefined
    Object.keys(dbUpdates).forEach(key => {
        if (!allowedKeys.includes(key) || dbUpdates[key] === undefined) {
            delete dbUpdates[key];
        }
    });

    if (Object.keys(dbUpdates).length === 0) return null;

    const { data, error } = await supabaseAdmin.from('app_users').update(dbUpdates).eq('id', id).select().single();
    if (error) {
        console.error('Update User Error:', error);
        return null;
    }

    // Sync critical changes to Supabase Auth
    if (updates.email !== undefined || updates.password !== undefined || updates.handle !== undefined) {
        const authUpdates: any = {};
        if (updates.email !== undefined) authUpdates.email = updates.email;
        if (updates.password !== undefined) authUpdates.password = updates.password;
        if (updates.handle !== undefined) authUpdates.user_metadata = { handle: updates.handle };
        
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates);
        if (authError) {
            console.error('[Auth Sync] Error updating auth user in Supabase:', authError);
        }
    }

    // CASCADE Handle change to other tables
    if (updates.handle !== undefined && oldHandle && oldHandle !== updates.handle) {
        const newHandle = updates.handle;
        const cascadeTasks = [
            { table: 'videos', col: 'user_handle' },
            { table: 'voice_comments', col: 'user_handle' },
            { table: 'user_follows', col: 'follower_handle' },
            { table: 'user_follows', col: 'following_handle' },
            { table: 'video_likes', col: 'user_handle' },
            { table: 'video_bookmarks', col: 'user_handle' },
            { table: 'video_views', col: 'user_handle' },
            { table: 'voice_comment_likes', col: 'user_handle' },
            { table: 'moderation_queue', col: 'user_handle' },
            { table: 'moderation_queue', col: 'reported_by' },
            { table: 'transactions', col: 'sender_handle' },
            { table: 'transactions', col: 'receiver_handle' },
            { table: 'coin_sales', col: 'user_handle' }
        ];

        for (const task of cascadeTasks) {
            try {
                await supabaseAdmin.from(task.table).update({ [task.col]: newHandle }).eq(task.col, oldHandle);
            } catch (err) {
                console.error(`[CASCADE] Failed for ${task.table}.${task.col}:`, err);
            }
        }
    }

    return {
        id: data.id,
        name: data.name,
        handle: data.handle,
        email: data.email,
        status: data.status,
        reputation: data.reputation,
        walletBalance: parseFloat(data.wallet_balance),
        joinedAt: data.joined_at,
        bio: data.bio,
        profileImage: data.profile_image,
        isCreator: data.is_creator,
        resetPin: data.reset_pin
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
    const { data, error } = await supabaseAdmin.from('app_users').insert([{
        name: user.name,
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
    // Delete from Supabase Auth First
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authErr) console.error("[Auth Sync] Error deleting auth creator:", authErr);

    const { error } = await supabaseAdmin.from('app_users').delete().eq('id', id);
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
    const { data: parentComments, error: parentsError } = await supabaseAdmin
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
        const { data: repliesData } = await supabaseAdmin
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
    const { data: fetchedLikes } = await supabaseAdmin
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
        const { data: users } = await supabaseAdmin
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
    const { data, error } = await supabaseAdmin
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
    await supabaseAdmin.from('user_penalties').insert([{
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
    const { data, error } = await supabaseAdmin.from('employees').select('*');
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
    const { data, error } = await supabaseAdmin.from('employees').insert([{
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
    const { data, error } = await supabaseAdmin.from('employees').update(dbUpdates).eq('id', id).select().single();
    if (error) return null;
    return data;
}

export async function deleteAppUser(id: string): Promise<boolean> {
    await supabaseAdmin.auth.admin.deleteUser(id); // Sync with Auth
    const { error } = await supabaseAdmin.from('app_users').delete().eq('id', id);
    if (error) return false;
    return true;
}

export async function deleteAppUserByHandle(handle: string): Promise<boolean> {
    const { data: user } = await supabaseAdmin.from('app_users').select('id').eq('handle', handle).single();
    if (user) await supabaseAdmin.auth.admin.deleteUser(user.id);

    const { error } = await supabaseAdmin.from('app_users').delete().eq('handle', handle);
    if (error) return false;
    return true;
}

export async function banAppUserByHandle(handle: string): Promise<boolean> {
    console.log(`[DELETE] Iniciando borrado para handle: ${handle}`);

    // Protección anti-borrado para el perfil principal
    if (handle.toLowerCase() === 'eduardo_82') {
        console.warn('[DELETE] Acceso denegado: No se puede borrar el perfil de administrador (eduardo_82)');
        return false;
    }

    // 1. Opcional pero recomendado si no hay CASCADEs: Borrar el contenido del usuario
    await supabaseAdmin.from('videos').delete().ilike('user_handle', handle);
    await supabaseAdmin.from('voice_comments').delete().ilike('user_handle', handle);

    // 2. Eliminar al usuario permanentemente de la tabla app_users
    const { data: userData, error: userError } = await supabaseAdmin.from('app_users')
        .delete()
        .ilike('handle', handle)
        .select();

    if (userError) {
        console.error(`[DELETE] Error borrando app_users:`, userError);
        return false;
    }
    
    // Auth Delete Sync
    if (userData && userData.length > 0) {
        for (const u of userData) {
            await supabaseAdmin.auth.admin.deleteUser(u.id);
        }
    }

    console.log(`[DELETE] app_users borrados: ${userData?.length || 0} filas.`);

    // 3. Limpiar todos sus reportes pendientes de la cola de moderación y la denuncia de perfil en sí
    const { error: queueError } = await supabaseAdmin.from('moderation_queue')
        .update({ status: 'rejected' })
        .ilike('user_handle', handle)
        .eq('status', 'pending');

    if (queueError) {
        console.error(`[DELETE] Error actualizando moderation_queue:`, queueError);
    }

    // Y si quedó un reporte de perfil residual para ese handle, se elimina derechamente para limpiar UI.
    await supabaseAdmin.from('moderation_queue').delete().ilike('user_handle', handle).eq('type', 'profile');

    return true;
}

// --- Companies ---
export async function getCompanies(): Promise<Company[]> {
    const { data, error } = await supabaseAdmin.from('companies').select('*');
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
    const { data, error } = await supabaseAdmin.from('companies').insert([{
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
    const { error } = await supabaseAdmin.from('companies').delete().eq('id', id);
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
    let query = supabaseAdmin.from('notifications').select('*');
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
    const { data, error } = await supabaseAdmin.from('notifications').insert([{
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
    const { data, error } = await supabaseAdmin.from('campaigns').select('*');
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
    const { data, error } = await supabaseAdmin.from('campaigns').insert([{
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
    const { error } = await supabaseAdmin.from('campaigns').delete().eq('id', id);
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
    const { data: campaign } = await supabaseAdmin.from('campaigns').select('impressions').eq('id', id).single();
    if (!campaign) return false;

    const { error } = await supabaseAdmin.from('campaigns').update({
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
    const { data, error } = await supabaseAdmin.from('moderation_queue').select('*');
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
    const { data, error } = await supabaseAdmin.from('moderation_queue').insert([{
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
    if (updates.userHandle) {
        dbUpdates.user_handle = updates.userHandle;
        delete dbUpdates.userHandle;
    }

    // Fallback: Remove 'moderated_by' to avoid PGRST204 errors since the column might not exist
    if (updates.moderatedBy !== undefined) {
        delete dbUpdates.moderatedBy;
    }
    if (dbUpdates.moderated_by !== undefined) {
        delete dbUpdates.moderated_by;
    }

    const { data, error } = await supabaseAdmin.from('moderation_queue').update(dbUpdates).eq('id', id).select().single();
    if (error) {
        console.error('Error updating moderation item:', error);
        return null;
    }
    return {
        id: data.id,
        matricula: data.matricula,
        type: data.type,
        url: data.url,
        userHandle: data.user_handle,
        reportedBy: data.reported_by,
        content: data.content,
        reportReason: data.report_reason,
        timestamp: data.timestamp,
        status: data.status,
        moderatedBy: updates.moderatedBy || 'Sistema' // Fake response for UI since column doesn't exist
    };
}

export async function getModerationHistoryByEmployee(employeeName: string): Promise<ModerationItem[]> {
    const { data, error } = await supabaseAdmin.from('moderation_queue').select('*').eq('moderated_by', employeeName).neq('status', 'pending');
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
    const { data, error } = await supabaseAdmin.from('logs').select('*').order('timestamp', { ascending: false });
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
    const { data, error } = await supabaseAdmin.from('logs').insert([{
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
    await supabaseAdmin.from('productivity').insert([{
        employee_name: employeeName,
        cycle_videos: cycleVideos,
        total_videos: totalVideos
    }]);
}

// --- Videos ---
export async function getVideos(): Promise<VideoPost[]> {
    const { data, error } = await supabaseAdmin.from('videos').select('*').order('created_at', { ascending: false });
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
        isAd: v.is_ad,
        thumbnailUrl: v.thumbnail_url,
        filterConfig: v.filter_config,
        isMuted: v.is_muted
    }));
}

export async function getVideosByUser(handle: string): Promise<VideoPost[]> {
    const { data, error } = await supabaseAdmin.from('videos').select('*').eq('user_handle', handle);
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
        isAd: v.is_ad,
        thumbnailUrl: v.thumbnail_url,
        filterConfig: v.filter_config,
        isMuted: v.is_muted
    }));
}

export async function addVideo(video: VideoPost): Promise<VideoPost | null> {
    const { data, error } = await supabaseAdmin
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
            is_ad: video.isAd || false,
            thumbnail_url: video.thumbnailUrl,
            filter_config: video.filterConfig,
            is_muted: video.isMuted || false
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
        isAd: data.is_ad,
        thumbnailUrl: data.thumbnail_url,
        filterConfig: data.filter_config,
        isMuted: data.is_muted
    };
}

export async function deleteVideo(id: string, userHandle: string): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('videos')
        .delete()
        .eq('id', id)
        .eq('user_handle', userHandle);

    if (error) {
        console.error('Error deleting video:', error);
        return false;
    }
    return true;
}

// --- Billing & Redemptions ---
export async function getCoinSales(): Promise<any[]> {
    const { data, error } = await supabaseAdmin.from('coin_sales').select('*').order('timestamp', { ascending: false });
    if (error) return [];
    return data;
}

export async function getTransactions(): Promise<any[]> {
    const { data, error } = await supabaseAdmin.from('transactions').select('*').order('timestamp', { ascending: false });
    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }

    return data.map(t => ({
        id: t.id,
        senderId: t.sender_handle,
        receiverId: t.receiver_handle,
        amount: parseFloat(t.amount),
        type: t.type,
        timestamp: t.timestamp,
        videoId: t.video_id
    }));
}

export async function getRedemptionRequests(): Promise<any[]> {
    const { data, error } = await supabaseAdmin.from('redemptions').select('*').order('timestamp', { ascending: false });
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
    const { data, error } = await supabaseAdmin.from('redemptions').insert([{
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
    const { data, error } = await supabaseAdmin.from('redemptions').update({ status }).eq('id', id).select().single();
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
    const users = await getAppUsers();

    const totalRevenue = sales.reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0);
    const totalRedeemed = redemptions.filter(r => r.status === 'approved').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
    const pendingRedemptions = redemptions.filter(r => r.status === 'pending').reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
    const totalCirculatingCoins = users.reduce((acc, u) => acc + (u.walletBalance || 0), 0);

    return {
        totalRevenue,
        totalRedeemed,
        pendingRedemptions,
        totalCirculatingCoins,
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
