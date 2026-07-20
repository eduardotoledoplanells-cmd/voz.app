import { createClient } from '@supabase/supabase-js';
import { sendNativePush } from './firebaseAdmin';
import { executeLedgerTransaction, getOrCreateUserWallet, SYSTEM_WALLETS } from './ledger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL [App Server]: Supabase credentials missing (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
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
    realName?: string;
    dni?: string;
    iban?: string;
    paymentInfo?: any;
    bio?: string;
    profileImage?: string;
    isCreator?: boolean;
    status: 'active' | 'banned' | 'verified' | 'unverified';
    walletBalance?: number;
    joinedAt: string;
    resetPin?: string;
    strikes?: number;
    phone?: string;
    earningsBalance?: number;
    notificationSettings?: any;
    privacySettings?: any;
    is_live?: boolean;
    live_url?: string | null;
    live_url_kick?: string | null;
    live_url_twitch?: string | null;
    live_url_youtube?: string | null;
    // Segmentación publicitaria
    country?: string;
    region?: string;
    interests?: string[];
    country_id?: number;
    region_id?: number;
    municipality_id?: number;
}

// In some parts of the admin it's referred to as Creator
export interface Creator extends AppUser {
    earnedEuro: number;
    totalCoins: number;
    withdrawableCoins: number;
    stats?: {
        totalGifts: number;
        totalPMs: number;
        earnedFromGifts: number;
        earnedFromPMs: number;
        totalVideos: number;
    };
    verificationData?: CreatorVerification;
}

export interface CreatorVerification {
    id: string;
    user_id: string;
    full_name: string;
    dni_number: string;
    dni_front_url?: string;
    dni_back_url?: string;
    bank_verification_url?: string;
    iban: string;
    address?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
    submitted_at: string;
    updated_at: string;
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
}

export interface Employee {
    id: string;
    username: string;
    password?: string;
    role: number;
    lastLogin: string;
    active: boolean;
    worker_number?: string;
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

// --- Withdrawal Requests Logic ---
export interface WithdrawalRequest {
    id?: string;
    userId: string;
    userHandle: string;
    amount: number;
    method: 'paypal' | 'bank';
    details: any;
    status?: 'pending' | 'approved' | 'rejected';
    createdAt?: string;
    processedAt?: string;
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
    userName?: string;
    userImage?: string;
    is_processed?: boolean;
}

// --- App Users / Creators ---
export async function getAppUsers(): Promise<AppUser[]> {
    const { data, error } = await supabaseAdmin.from('app_users').select('*');
    if (error) {
        throw new Error("Supabase error: " + JSON.stringify(error));
    }
    return data.map(u => ({
        id: u.id,
        name: u.name || u.handle?.replace('@', '') || 'Sin nombre',
        realName: u.real_name || u.name || u.handle?.replace('@', '') || 'Sin nombre',
        handle: u.handle,
        userHandle: u.handle, // For Creator interface compatibility
        dni: u.dni,
        iban: u.iban,
        paymentInfo: u.payment_info,
        email: u.email,
        password: u.password,
        status: u.status,
        walletBalance: isNaN(parseFloat(u.wallet_balance)) ? 0 : parseFloat(u.wallet_balance),
        joinedAt: u.joined_at,
        bio: u.bio,
        profileImage: u.profile_image,
        isCreator: u.is_creator,
        resetPin: u.reset_pin,
        strikes: u.strikes || 0,
        phone: u.phone,
        earningsBalance: isNaN(parseFloat(u.earnings_balance)) ? 0 : parseFloat(u.earnings_balance),
        notificationSettings: u.notification_settings || {},
        privacySettings: u.privacy_settings || {},
        country: u.country,
        region: u.region,
        interests: u.interests,
        country_id: u.country_id,
        region_id: u.region_id,
        municipality_id: u.municipality_id
    }));
}

export async function getUserById(id: string): Promise<AppUser | null> {
    const { data: u, error } = await supabaseAdmin
        .from('app_users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error || !u) return null;

    return {
        id: u.id,
        name: u.name || u.handle?.replace('@', '') || 'Sin nombre',
        realName: u.real_name || u.name || u.handle?.replace('@', '') || 'Sin nombre',
        handle: u.handle,
        userHandle: u.handle,
        dni: u.dni,
        iban: u.iban,
        paymentInfo: u.payment_info,
        email: u.email,
        password: u.password,
        status: u.status,
        walletBalance: isNaN(parseFloat(u.wallet_balance)) ? 0 : parseFloat(u.wallet_balance),
        joinedAt: u.joined_at,
        bio: u.bio,
        profileImage: u.profile_image,
        profile_color: u.profile_color,
        isCreator: u.is_creator,
        resetPin: u.reset_pin,
        strikes: u.strikes || 0,
        phone: u.phone,
        earningsBalance: isNaN(parseFloat(u.earnings_balance)) ? 0 : parseFloat(u.earnings_balance),
        notificationSettings: u.notification_settings || {},
        privacySettings: u.privacy_settings || {},
        is_live: u.is_live,
        live_url: u.live_url,
        country: u.country,
        region: u.region,
        interests: u.interests,
        country_id: u.country_id,
        region_id: u.region_id,
        municipality_id: u.municipality_id
    } as any;
}

export async function getUserByHandle(handle: string): Promise<AppUser | null> {
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    const rawHandle = handle.replace('@', '');
    const { data: u, error } = await supabaseAdmin
        .from('app_users')
        .select('*')
        .in('handle', [cleanHandle, rawHandle])
        .limit(1)
        .maybeSingle();

    if (error || !u) return null;

    return {
        id: u.id,
        name: u.name || u.handle?.replace('@', '') || 'Sin nombre',
        realName: u.real_name || u.name || u.handle?.replace('@', '') || 'Sin nombre',
        handle: u.handle,
        userHandle: u.handle,
        dni: u.dni,
        iban: u.iban,
        paymentInfo: u.payment_info,
        email: u.email,
        password: u.password,
        status: u.status,
        walletBalance: isNaN(parseFloat(u.wallet_balance)) ? 0 : parseFloat(u.wallet_balance),
        joinedAt: u.joined_at,
        bio: u.bio,
        profileImage: u.profile_image,
        profile_color: u.profile_color,
        isCreator: u.is_creator,
        resetPin: u.reset_pin,
        strikes: u.strikes || 0,
        phone: u.phone,
        earningsBalance: isNaN(parseFloat(u.earnings_balance)) ? 0 : parseFloat(u.earnings_balance),
        notificationSettings: u.notification_settings || {},
        privacySettings: u.privacy_settings || {},
        is_live: u.is_live,
        live_url: u.live_url,
        country: u.country,
        region: u.region,
        interests: u.interests,
        country_id: u.country_id,
        region_id: u.region_id,
        municipality_id: u.municipality_id
    } as any;
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
    const { data: u, error } = await supabaseAdmin
        .from('app_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (error || !u) return null;

    return {
        id: u.id,
        name: u.name || u.handle?.replace('@', '') || 'Sin nombre',
        realName: u.real_name || u.name || u.handle?.replace('@', '') || 'Sin nombre',
        handle: u.handle,
        userHandle: u.handle,
        dni: u.dni,
        iban: u.iban,
        paymentInfo: u.payment_info,
        email: u.email,
        password: u.password,
        status: u.status,
        walletBalance: isNaN(parseFloat(u.wallet_balance)) ? 0 : parseFloat(u.wallet_balance),
        joinedAt: u.joined_at,
        bio: u.bio,
        profileImage: u.profile_image,
        profile_color: u.profile_color,
        isCreator: u.is_creator,
        resetPin: u.reset_pin,
        strikes: u.strikes || 0,
        phone: u.phone,
        earningsBalance: isNaN(parseFloat(u.earnings_balance)) ? 0 : parseFloat(u.earnings_balance),
        notificationSettings: u.notification_settings || {},
        privacySettings: u.privacy_settings || {},
        is_live: u.is_live,
        live_url: u.live_url,
        country: u.country,
        region: u.region,
        interests: u.interests,
        country_id: u.country_id,
        region_id: u.region_id,
        municipality_id: u.municipality_id
    } as any;
}

export async function getUserByIdOrHandleOrEmail(id?: string, handle?: string, email?: string): Promise<AppUser | null> {
    if (id) {
        return await getUserById(id);
    }
    if (email) {
        return await getUserByEmail(email);
    }
    if (handle) {
        let user = await getUserByHandle(handle);
        if (user) return user;

        const clean = handle.replace(/[@_.\s]/g, '');
        const { data: users, error } = await supabaseAdmin
            .from('app_users')
            .select('*')
            .limit(100);
        
        if (!error && users) {
            const normalize = (h: string) => h.replace(/[@_.\s]/g, '').toLowerCase();
            const searchNormalized = clean.toLowerCase();
            const found = users.find(u => u.handle && normalize(u.handle) === searchNormalized);
            if (found) {
                return await getUserById(found.id);
            }
        }
    }
    return null;
}

async function getSignedKycUrl(urlOrPath: string | undefined): Promise<string | undefined> {
    if (!urlOrPath) return undefined;
    
    // Extrae la ruta de almacenamiento de la URL o ruta
    // Ejemplo URL pública: https://project.supabase.co/storage/v1/object/public/kyc_documents/folder/file.jpg
    // Ejemplo URL firmada: https://project.supabase.co/storage/v1/object/sign/kyc_documents/folder/file.jpg
    let path = urlOrPath;
    if (urlOrPath.includes('/kyc_documents/')) {
        path = urlOrPath.split('/kyc_documents/')[1];
        // Quita parámetros de consulta si existen (?token=...)
        path = path.split('?')[0];
    } else if (urlOrPath.startsWith('http')) {
        // Si no es parte de nuestro bucket de Supabase pero es una URL externa, la retornamos tal cual
        return urlOrPath;
    }
    
    try {
        const { data, error } = await supabaseAdmin
            .storage
            .from('kyc_documents')
            .createSignedUrl(path, 3600); // 1 hora de expiración
            
        if (error || !data?.signedUrl) {
            console.error(`[KYC STORAGE] No se pudo crear la URL firmada para ${path}:`, error);
            return urlOrPath; // Fallback
        }
        return data.signedUrl;
    } catch (err) {
        console.error(`[KYC STORAGE] Excepción al crear URL firmada para ${path}:`, err);
        return urlOrPath;
    }
}

export async function getCreators(): Promise<Creator[]> {
    try {
        console.log("[db] Fetching creators and verifications...");
        const users = await getAppUsers();
        console.log(`[db] Found ${users.length} users.`);
        
        // Fetch all verifications
        const { data: verifications, error: vError } = await supabaseAdmin
            .from('creator_verifications')
            .select('*');
        
        if (vError) {
            console.error("[db] Error fetching verifications:", vError);
        }

        console.log(`[db] Found ${verifications?.length || 0} verification records.`);

        const verifMap = new Map();
        verifications?.forEach(v => {
            if (v.user_id) {
                const cleanId = v.user_id.trim();
                verifMap.set(cleanId, v);
            }
        });

        const mappedCreators = await Promise.all(users.map(async (u) => {
            const cleanUserId = u.id.trim();
            const v = verifMap.get(cleanUserId);
            
            let verificationData: CreatorVerification | undefined = undefined;
            if (v) {
                const signedFront = await getSignedKycUrl(v.dni_front_url);
                const signedBack = await getSignedKycUrl(v.dni_back_url);
                const signedBank = await getSignedKycUrl(v.bank_verification_url);
                verificationData = {
                    ...v,
                    dni_front_url: signedFront,
                    dni_back_url: signedBack,
                    bank_verification_url: signedBank
                };
            }
            
            const creator: Creator = {
                ...u,
                totalCoins: u.walletBalance || 0,
                withdrawableCoins: u.earningsBalance || 0,
                earnedEuro: (u.earningsBalance || 0) * 0.05,
                stats: {
                    totalGifts: Math.floor((u.walletBalance || 0) / 10),
                    totalPMs: 0,
                    earnedFromGifts: 0,
                    earnedFromPMs: 0,
                    totalVideos: 0
                },
                verificationData: verificationData
            };
            
            return creator;
        }));

        return mappedCreators;
    } catch (error) {
        console.error("[db] Fatal error in getCreators:", error);
        return [];
    }
}

export async function processCreatorVerification(userId: string, status: 'approved' | 'rejected', reason?: string): Promise<boolean> {
    // 1. Get user handle for the notification
    const { data: userData, error: userFetchError } = await supabaseAdmin
        .from('app_users')
        .select('handle')
        .eq('id', userId)
        .single();

    const { error: vError } = await supabaseAdmin
        .from('creator_verifications')
        .update({ 
            status, 
            rejection_reason: reason || null,
            updated_at: new Date().toISOString() 
        })
        .eq('user_id', userId);

    if (vError) {
        console.error("Error updating verification status:", vError);
        return false;
    }

    if (status === 'approved') {
        const { error: uError } = await supabaseAdmin
            .from('app_users')
            .update({ 
                is_creator: true,
                status: 'verified' 
            })
            .eq('id', userId);
        
        if (uError) {
            console.error("Error updating user is_creator flag:", uError);
            return false;
        }
    }

    // 2. Send Notification
    if (userData?.handle) {
        try {
            const title = status === 'approved' ? '¡Felicidades!' : 'Solicitud Revisada';
            const message = status === 'approved' 
                ? 'Ya eres un Creador Oficial. Ahora puedes recibir donaciones.' 
                : `Tu solicitud de creador ha sido rechazada por el siguiente motivo: ${reason || 'Documentación inconsistente'}. Puedes volver a intentarlo.`;

            await addNotification({
                id: Date.now().toString(),
                recipientId: userData.handle,
                type: 'moderation',
                title,
                message,
                timestamp: new Date().toISOString(),
                readStatus: false
            });
            console.log(`[Notification] Sent verification status (${status}) to ${userData.handle}`);
        } catch (notifError) {
            console.warn("Failed to send verification notification:", notifError);
        }
    }

    return true;
}

export async function updateAppUser(id: string, updates: Partial<AppUser>): Promise<AppUser | null> {
    // Get current handle if changing
    let oldHandle = '';
    if (id && updates.handle !== undefined) {
        const { data: current } = await supabaseAdmin.from('app_users').select('handle').eq('id', id).single();
        if (current) oldHandle = current.handle;
    }

    const allowedKeys = ['name', 'real_name', 'dni', 'iban', 'payment_info', 'handle', 'email', 'status', 'wallet_balance', 'bio', 'profile_image', 'profile_color', 'is_creator', 'password', 'reset_pin', 'strikes', 'phone', 'earnings_balance', 'notification_settings', 'privacy_settings', 'push_token', 'is_live', 'live_url', 'country', 'region', 'interests', 'live_url_kick', 'live_url_twitch', 'live_url_youtube', 'country_id', 'region_id', 'municipality_id'];
    const dbUpdates: any = {};

    // Map fields
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.realName !== undefined || (updates as any).real_name !== undefined) {
        dbUpdates.real_name = updates.realName || (updates as any).real_name;
    }
    if (updates.dni !== undefined) dbUpdates.dni = updates.dni;
    if (updates.iban !== undefined) dbUpdates.iban = updates.iban;
    if (updates.paymentInfo !== undefined || (updates as any).payment_info !== undefined) {
        dbUpdates.payment_info = updates.paymentInfo || (updates as any).payment_info;
    }
    if (updates.handle !== undefined) dbUpdates.handle = updates.handle;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.walletBalance !== undefined) dbUpdates.wallet_balance = updates.walletBalance;
    if (updates.earningsBalance !== undefined) dbUpdates.earnings_balance = updates.earningsBalance;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.profileImage !== undefined || (updates as any).profile_image !== undefined) {
        dbUpdates.profile_image = updates.profileImage || (updates as any).profile_image;
    }
    if (updates.isCreator !== undefined) dbUpdates.is_creator = updates.isCreator;
    if (updates.password !== undefined) dbUpdates.password = updates.password;
    if (updates.resetPin !== undefined) dbUpdates.reset_pin = updates.resetPin;
    if (updates.strikes !== undefined) dbUpdates.strikes = updates.strikes;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.notificationSettings !== undefined) dbUpdates.notification_settings = updates.notificationSettings;
    if (updates.privacySettings !== undefined) dbUpdates.privacy_settings = updates.privacySettings;
    if ((updates as any).pushToken !== undefined) dbUpdates.push_token = (updates as any).pushToken;
    if ((updates as any).profile_color !== undefined) dbUpdates.profile_color = (updates as any).profile_color;
    if ((updates as any).is_live !== undefined) dbUpdates.is_live = (updates as any).is_live;
    if ((updates as any).live_url !== undefined) dbUpdates.live_url = (updates as any).live_url;
    // Segmentación publicitaria
    if ((updates as any).country !== undefined) dbUpdates.country = (updates as any).country;
    if ((updates as any).region !== undefined) dbUpdates.region = (updates as any).region;
    if ((updates as any).interests !== undefined) dbUpdates.interests = (updates as any).interests;

    // Platform-specific live urls
    if ((updates as any).live_url_kick !== undefined) dbUpdates.live_url_kick = (updates as any).live_url_kick;
    if ((updates as any).live_url_twitch !== undefined) dbUpdates.live_url_twitch = (updates as any).live_url_twitch;
    if ((updates as any).live_url_youtube !== undefined) dbUpdates.live_url_youtube = (updates as any).live_url_youtube;

    // Resolve string locations to IDs if provided
    if (updates.country !== undefined || updates.region !== undefined) {
        try {
            let countryName = updates.country || 'España';
            let regionName = '';
            let muniName = '';

            if (updates.region) {
                if (updates.region.includes(' - ')) {
                    const parts = updates.region.split(' - ');
                    regionName = parts[0]?.trim();
                    muniName = parts[1]?.trim();
                } else {
                    regionName = updates.region.trim();
                }
            }

            // 1. Resolve country_id
            if (countryName) {
                const { data: cData } = await supabaseAdmin.from('countries').select('id').ilike('name', countryName).maybeSingle();
                if (cData) {
                    dbUpdates.country_id = cData.id;
                }
            }

            // 2. Resolve region_id
            let resolvedRegionId: number | null = null;
            if (regionName && dbUpdates.country_id) {
                const { data: rData } = await supabaseAdmin.from('regions').select('id').eq('country_id', dbUpdates.country_id).ilike('name', regionName).maybeSingle();
                if (rData) {
                    resolvedRegionId = rData.id;
                    dbUpdates.region_id = resolvedRegionId;
                }
            }

            // 3. Resolve municipality_id
            if (muniName && resolvedRegionId) {
                const { data: mData } = await supabaseAdmin.from('municipalities').select('id').eq('region_id', resolvedRegionId).ilike('name', muniName).maybeSingle();
                if (mData) {
                    dbUpdates.municipality_id = mData.id;
                }
            }
        } catch (resolveErr) {
            console.error('[Location Resolve Error]:', resolveErr);
        }
    }

    if (updates.country_id !== undefined) dbUpdates.country_id = updates.country_id;
    if (updates.region_id !== undefined) dbUpdates.region_id = updates.region_id;
    if (updates.municipality_id !== undefined) dbUpdates.municipality_id = updates.municipality_id;

    // Filter only allowed keys and remove undefined
    Object.keys(dbUpdates).forEach(key => {
        if (!allowedKeys.includes(key) || dbUpdates[key] === undefined) {
            delete dbUpdates[key];
        }
    });

    if (Object.keys(dbUpdates).length === 0) return null;

    let query = supabaseAdmin.from('app_users').update(dbUpdates);
    if (id) {
        query = query.eq('id', id);
    } else if (updates.handle) {
        const clean = updates.handle.replace('@', '');
        query = query.or(`handle.ilike.${clean},handle.ilike.@${clean}`);
    } else {
        return null;
    }

    const { data, error } = await query.select().single();
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
        walletBalance: parseFloat(data.wallet_balance),
        joinedAt: data.joined_at,
        bio: data.bio,
        profileImage: data.profile_image,
        isCreator: data.is_creator,
        resetPin: data.reset_pin,
        strikes: data.strikes || 0,
        phone: data.phone,
        notificationSettings: data.notification_settings || {},
        country: data.country,
        region: data.region,
        interests: data.interests,
        country_id: data.country_id,
        region_id: data.region_id,
        municipality_id: data.municipality_id
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
        id: user.id,
        name: user.name || user.handle.replace('@', ''),
        handle: user.handle,
        email: user.email,
        password: user.password,
        status: user.status,
        wallet_balance: user.walletBalance || 0,
        country: user.country,
        region: user.region,
        interests: user.interests || [],
        country_id: user.country_id,
        region_id: user.region_id,
        municipality_id: user.municipality_id
    }]).select().single();
    if (error) {
        console.error("Error inserting app_user:", error);
        return null;
    }
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

    if (amount <= 0) return null;

    try {
        // 3. Execute Ledger Transaction: MINT -> USER (available balance)
        const userWalletId = await getOrCreateUserWallet(user.id);
        const idempotencyKey = `interaction-${user.id}-${type}-${Date.now()}`;
        
        await executeLedgerTransaction(
            'CREATOR_INTERACTION_BONUS',
            [
                {
                    wallet_id: SYSTEM_WALLETS.MINT.id,
                    entry_type: 'AVAILABLE',
                    amount: -amount
                },
                {
                    wallet_id: userWalletId,
                    entry_type: 'AVAILABLE',
                    amount: amount
                }
            ],
            null,
            idempotencyKey,
            { type, employeeName, detail }
        );

        // Fetch user again to return the updated creator with updated balances
        const updatedUsers = await getAppUsers();
        const updatedUser = updatedUsers.find(u => u.id === user.id);
        
        if (updatedUser) {
            await addLog({
                id: Date.now().toString(),
                employeeName,
                action: `CREATOR_INTERACTION_${type.toUpperCase()}`,
                timestamp: new Date().toISOString(),
                details: `Creator: ${user.handle}, Detail: ${detail}, New Balance: ${updatedUser.walletBalance}`
            });
        }

        const creators = await getCreators();
        return creators.find(c => c.id === user.id) || null;
    } catch (err: any) {
        console.error('[LEDGER] Creator interaction error:', err);
        return null;
    }
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

export async function getVoiceComments(videoId: string, currentUserHandle?: string): Promise<any[]> {
    // 1. Cargar comentarios principales (parent_id = null)
    const { data: parentComments, error: parentsError } = await supabaseAdmin
        .from('voice_comments')
        .select('*')
        .eq('video_id', videoId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

    if (parentsError || !parentComments) {
        console.error('Error fetching parent comments:', parentsError);
        return [];
    }

    const parentIds = parentComments.map(c => c.id);

    // 2. Para cada comentario cargar sus respuestas
    let replies: any[] = [];
    if (parentIds.length > 0) {
        const { data: repliesData, error: repliesError } = await supabaseAdmin
            .from('voice_comments')
            .select('*')
            .in('parent_id', parentIds)
            .order('created_at', { ascending: true });

        if (!repliesError && repliesData) {
            replies = repliesData;
        }
    }

    const allComments = [...parentComments, ...replies];
    if (allComments.length === 0) return [];

    const allCommentIds = allComments.map(c => c.id);

    // Contar likes dinámicamente
    let likesData: any[] = [];
    const { data: fetchedLikes } = await supabaseAdmin
        .from('voice_comment_likes')
        .select('comment_id, user_handle')
        .in('comment_id', allCommentIds);

    if (fetchedLikes) likesData = fetchedLikes;

    const likesCountMap = new Map<string, number>();
    const likedByMeSet = new Set<string>();

    likesData.forEach(like => {
        const cId = like.comment_id;
        likesCountMap.set(cId, (likesCountMap.get(cId) || 0) + 1);
        if (currentUserHandle && like.user_handle === currentUserHandle) {
            likedByMeSet.add(cId);
        }
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

    // Formatear la respuesta con el conteo dinámico de likes y avatar real del perfil
    const enrichedComments = allComments.map(c => {
        const profileImage = userMap.get(c.user_handle);
        return {
            ...c,
            avatar_url: (profileImage && profileImage !== 'null') ? profileImage : (c.avatar_url || null),
            likes: likesCountMap.get(c.id) || 0, // Conteo dinámico calculado
            isLikedByMe: likedByMeSet.has(c.id)
        };
    });

    return enrichedComments;
}

export async function addVoiceComment(comment: any): Promise<any> {
    const { data, error } = await supabaseAdmin
        .from('voice_comments')
        .insert([comment])
        .select()
        .single();

    if (error) {
        console.error('Error adding voice comment:', error);
        return null;
    }

    // Increment comments_count in videos table using select and update
    if (comment.video_id) {
        const { data: vidData } = await supabaseAdmin.from('videos').select('comments_count').eq('id', comment.video_id).single();
        const currentCount = vidData?.comments_count || 0;
        const { error: updateError } = await supabaseAdmin.from('videos').update({ comments_count: currentCount + 1 }).eq('id', comment.video_id);
        
        if (updateError) {
            console.error('[db] Error updating comments_count:', updateError);
        }
    }

    return data;
}

export async function toggleVideoLike(videoId: string, userHandle: string, isLiked: boolean): Promise<boolean> {
    if (isLiked) {
        const { error: likeError } = await supabaseAdmin
            .from('video_likes')
            .upsert([{ video_id: videoId, user_handle: userHandle }], { onConflict: 'video_id,user_handle' });

        if (likeError) {
            console.error('Error recording video like persistence:', likeError);
            return false;
        }
    } else {
        const { error: unlikeError } = await supabaseAdmin
            .from('video_likes')
            .delete()
            .match({ video_id: videoId, user_handle: userHandle });

        if (unlikeError) {
            console.error('Error removing video like persistence:', unlikeError);
            return false;
        }
    }

    // Atomic update of likes in videos table using the dedicated RPCs
    const rpcName = isLiked ? 'increment_video_likes' : 'decrement_video_likes';
    const { error: updateError } = await supabaseAdmin.rpc(rpcName, { vid: videoId });

    if (updateError) {
        console.error(`[db] RPC ${rpcName} failed:`, updateError);
        return false;
    }

    return true;
}

export async function incrementVideoView(videoId: string, userHandle: string): Promise<boolean> {
    // Try to insert a unique view record (duplicate = already viewed by this user)
    const { error: viewError } = await supabaseAdmin
        .from('video_views')
        .insert([{ video_id: videoId, user_handle: userHandle }]);

    if (viewError) {
        // 23505 = unique violation = already viewed, that's ok, don't increment
        if (viewError.code === '23505') return true;
        // Any other insert error: still try to increment views (best effort)
        console.warn('[db] video_views insert error (non-duplicate):', viewError.code, viewError.message);
    }

    // Atomic update: try RPC first (may use 'vid' or 'video_id' as parameter name)
    let rpcSuccess = false;
    const { error: rpcError1 } = await supabaseAdmin.rpc('increment_video_views', { vid: videoId });
    if (!rpcError1) {
        rpcSuccess = true;
    } else {
        // Try alternate parameter name
        const { error: rpcError2 } = await supabaseAdmin.rpc('increment_video_views', { video_id: videoId });
        if (!rpcError2) {
            rpcSuccess = true;
        } else {
            console.warn('[db] RPC increment_video_views failed, using direct update fallback');
        }
    }

    if (!rpcSuccess) {
        // Direct fallback: read current views and increment by 1
        const { data: current } = await supabaseAdmin
            .from('videos')
            .select('views')
            .eq('id', videoId)
            .single();

        await supabaseAdmin
            .from('videos')
            .update({ views: (current?.views || 0) + 1 })
            .eq('id', videoId);
    }

    return true;
}

export async function toggleVideoBookmark(videoId: string, userHandle: string, isBookmarked: boolean): Promise<boolean> {
    if (isBookmarked) {
        const { error } = await supabaseAdmin
            .from('video_bookmarks')
            .upsert([{ video_id: videoId, user_handle: userHandle }], { onConflict: 'video_id,user_handle' });
        return !error;
    } else {
        const { error } = await supabaseAdmin
            .from('video_bookmarks')
            .delete()
            .match({ video_id: videoId, user_handle: userHandle });
        return !error;
    }
}

export async function incrementVoiceCommentLike(commentId: string, userHandle: string): Promise<boolean> {
    const { error: likeError } = await supabaseAdmin
        .from('voice_comment_likes')
        .insert([{ comment_id: commentId, user_handle: userHandle }]);
    return !likeError;
}

export async function removeVoiceCommentLike(commentId: string, userHandle: string): Promise<boolean> {
    const { error: unlikeError } = await supabaseAdmin
        .from('voice_comment_likes')
        .delete()
        .match({ comment_id: commentId, user_handle: userHandle });
    return !unlikeError;
}

// --- User Penalties ---
export async function addPenaltyToUser(handle: string, penalty: { url?: string, reason: string }) {
    await supabaseAdmin.from('user_penalties').insert([{
        user_handle: handle,
        content_url: penalty.url,
        reason: penalty.reason
    }]);

    // Increase strikes and check auto-ban
    const users = await getAppUsers();
    const user = users.find(u => u.handle === handle);
    if (user) {
        const newStrikes = (user.strikes || 0) + 1;
        
        if (newStrikes >= 3) {
            console.log(`[PENALTY] User ${handle} reached 3 strikes. Banning...`);
            await banAppUserByHandle(handle);
        } else {
            await updateAppUser(user.id, { strikes: newStrikes } as any);
            // Notify user about the strike
            await addNotification({
                id: Date.now().toString(),
                recipientId: handle,
                type: 'strike',
                title: 'Aviso de Moderación (Strike) ⚠️',
                message: `Has recibido un strike por: ${penalty.reason}. Al llegar a 3 strikes tu cuenta será baneada permanentemente.`,
                timestamp: new Date().toISOString(),
                readStatus: false
            });
        }
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
        active: e.active,
        worker_number: e.worker_number
    }));
}

export async function addEmployee(employee: Employee): Promise<Employee | null> {
    const { data, error } = await supabaseAdmin.from('employees').insert([{
        username: employee.username,
        password: employee.password,
        role: employee.role,
        active: employee.active,
        worker_number: employee.worker_number
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

export async function deleteEmployee(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin.from('employees').delete().eq('id', id);
    if (error) return false;
    return true;
}

export async function deleteAppUser(id: string): Promise<boolean> {
    await supabaseAdmin.auth.admin.deleteUser(id); // Sync with Auth
    // Release wallet handle to prevent duplicate key errors on re-registration
    const deletedId = id.substring(0, 8);
    await supabaseAdmin.from('wallets').update({
        user_handle: `@deleted_wallet_${deletedId}`,
        name: `DELETED_WALLET_${deletedId}`
    }).eq('user_id', id);
    const { error } = await supabaseAdmin.from('app_users').delete().eq('id', id);
    if (error) return false;
    return true;
}

export async function deleteAppUserByHandle(handle: string): Promise<boolean> {
    const { data: user } = await supabaseAdmin.from('app_users').select('id').eq('handle', handle).single();
    if (user) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        const deletedId = user.id.substring(0, 8);
        await supabaseAdmin.from('wallets').update({
            user_handle: `@deleted_wallet_${deletedId}`,
            name: `DELETED_WALLET_${deletedId}`
        }).eq('user_id', user.id);
    }

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
            // Guardar el email y teléfono en la lista negra antes de borrarlo de Auth
            if (u.email || u.phone) {
                await addBannedEmail(u.email || 'N/A', 'Cuenta baneada permanentemente por moderación', u.phone);
            }
            await supabaseAdmin.auth.admin.deleteUser(u.id);
            // Release wallet handle
            const deletedId = u.id.substring(0, 8);
            await supabaseAdmin.from('wallets').update({
                user_handle: `@deleted_wallet_${deletedId}`,
                name: `DELETED_WALLET_${deletedId}`
            }).eq('user_id', u.id);
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
    referenceId?: string;
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
        timestamp: n.timestamp || new Date().toISOString(),
        read_status: n.readStatus
    }]).select().single();

    if (error) {
        console.error('[DB] Error adding notification:', error);
        return null;
    }

    try {
        const cleanHandle = n.recipientId.startsWith('@') ? n.recipientId : `@${n.recipientId}`;
        const rawHandle = cleanHandle.replace('@', '');

        // Fetch user's notification settings first
        const { data: userProfile } = await supabaseAdmin
            .from('app_users')
            .select('notification_settings')
            .or(`handle.eq.${cleanHandle},handle.eq.${rawHandle}`)
            .single();

        const settings = userProfile?.notification_settings || {};

        // Map notification type to setting key
        let settingsKey = '';
        if (n.type === 'comment') settingsKey = 'notify_comments';
        else if (n.type === 'reply') settingsKey = 'notify_replies';
        else if (n.type === 'pm') settingsKey = 'notify_pms';
        else if (n.type === 'donation') settingsKey = 'notify_donations';
        else if (n.type === 'gift') settingsKey = 'notify_gifts';
        else if (n.type === 'like') settingsKey = 'notify_likes';
        else if (n.type === 'follow') settingsKey = 'notify_followers';
        else if (n.type === 'balance') settingsKey = 'notify_balance';
        else if (n.type === 'strike') settingsKey = 'notify_strikes';
        else if (['system', 'important', 'update', 'promo'].includes(n.type || '')) settingsKey = 'notify_system';

        // Check if explicitly disabled
        if (settingsKey && settings[settingsKey] === false) {
            console.log(`[Push Blocked] User ${cleanHandle} has disabled push for type ${n.type} (${settingsKey})`);
            return data;
        }

        // 1. Buscar en la tabla nativa push_tokens
        const { data: fcmTokens } = await supabaseAdmin
            .from('push_tokens')
            .select('fcm_token, device_type')
            .or(`user_id.eq.${cleanHandle},user_id.eq.${rawHandle}`);

        let nativeSent = false;
        if (fcmTokens && fcmTokens.length > 0) {
            for (const item of fcmTokens) {
                if (item.fcm_token) {
                    console.log(`[Push FCM Nativo] Enviando a ${cleanHandle}...`);
                    const res = await sendNativePush(item.fcm_token, n.title, n.message, { type: n.type, notificationId: data?.id || '' });
                    
                    if (res && !res.success && res.code === 'messaging/registration-token-not-registered') {
                        // Limpiar asincrónicamente el token de push_tokens
                        supabaseAdmin.from('push_tokens').delete().eq('fcm_token', item.fcm_token).then();
                    } else if (res && res.success) {
                        nativeSent = true;
                    }
                }
            }
        }

        // 2. Buscar en app_users.push_token (como fallback)
        const { data: userData } = await supabaseAdmin
            .from('app_users')
            .select('push_token')
            .or(`handle.eq.${cleanHandle},handle.eq.${rawHandle}`)
            .single();

        if (userData && userData.push_token) {
            const token = userData.push_token;
            if (token.includes('ExponentPush') || token.includes('ExpoPush')) {
                console.log(`[Push Expo Fallback] Enviando a ${cleanHandle}...`);
                await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Accept-encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: token, sound: 'default', title: n.title, body: n.message, data: { type: n.type, notificationId: data?.id || '' }
                    })
                });
            } else if (!nativeSent) {
                console.log(`[Push FCM Nativo desde app_users] Enviando a ${cleanHandle}...`);
                const res = await sendNativePush(token, n.title, n.message, { type: n.type, notificationId: data?.id || '' });
                
                if (res && !res.success && res.code === 'messaging/registration-token-not-registered') {
                    // Limpiar asincrónicamente el token de app_users
                    supabaseAdmin.from('app_users').update({ push_token: null }).or(`handle.eq.${cleanHandle},handle.eq.${rawHandle}`).then();
                }
            }
        }
    } catch (e: any) {
        console.warn("[Push Dispatch Error]:", e.message || e);
    }

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
        minViewTime: c.min_view_time || 0,
        createdAt: c.created_at,
        priority: c.priority || 'Local_Standard',
        packSize: c.pack_size || 0
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
        min_view_time: campaign.minViewTime || 0,
        target: campaign.target,
        investment: (campaign as any).investment || 0,
        priority: campaign.priority || 'Local_Standard',
        pack_size: campaign.packSize || 0
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

export async function incrementCampaignImpressions(id: string, amount: number = 1): Promise<boolean> {
    const { data: campaign } = await supabaseAdmin.from('campaigns').select('impressions, pack_size').eq('id', id).single();
    if (!campaign) return false;

    const newImpressions = (campaign.impressions || 0) + amount;
    const packSize = campaign.pack_size || 0;
    
    // Si hay un pack comprado y hemos llegado al límite, pausamos o completamos
    let statusUpdate = {};
    if (packSize > 0 && newImpressions >= packSize) {
        statusUpdate = { status: 'completed' };
    }

    const { error } = await supabaseAdmin.from('campaigns').update({
        impressions: newImpressions,
        ...statusUpdate
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
export async function getVideos(currentUserHandle?: string, limit: number = 10, offset: number = 0): Promise<VideoPost[]> {
    // 1. Intentamos usar la función RPC nativa en Supabase para máxima escalabilidad
    let scoredVideos: any[] = [];
    const { data: rpcVideos, error: rpcError } = await supabaseAdmin.rpc('get_antigravity_feed', {
        req_limit: limit,
        req_offset: offset
    });

    if (!rpcError && rpcVideos && rpcVideos.length > 0) {
        scoredVideos = rpcVideos;
    } else {
        // Fallback: Si el RPC falla (ej. todavía no está desplegado o hay un error), usamos la lógica en JS
        if (rpcError) console.warn("[db] RPC get_antigravity_feed failed, falling back to JS implementation:", rpcError.message);
        
        const { data: videos, error: videosError } = await supabaseAdmin
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);
        
        if (videosError) {
            console.error("[db] getVideos fallback error:", videosError);
            return [];
        }

        if (!videos || videos.length === 0) return [];

        const now = new Date().getTime();
        
        scoredVideos = videos.map(v => {
            const createdAtTime = new Date(v.created_at).getTime();
            const ageInHours = (now - createdAtTime) / (1000 * 60 * 60);
            const views = v.views || 0;
            const likes = v.likes || 0;
            let score = ((views * 1) + (likes * 5)) / Math.pow(Math.max(ageInHours, 0) + 2, 1.5);
            if (ageInHours < 2 && score < 1) score = 1 + Math.random();
            return { ...v, _score: score };
        });

        scoredVideos.sort((a, b) => b._score - a._score);
        scoredVideos = scoredVideos.slice(offset, offset + limit);
    }
    
    if (scoredVideos.length === 0) return [];

    // 2. Fetch corresponding users to perform manual join
    const handles = [...new Set(scoredVideos.map(v => v.user_handle))];
    const { data: users, error: usersError } = await supabaseAdmin
        .from('app_users')
        .select('name, handle, profile_image, is_live, live_url')
        .in('handle', handles);

    if (usersError) {
        console.error("[db] Error fetching users for join:", usersError);
    }

    const userMap = new Map();
    users?.forEach(u => userMap.set(u.handle, u));

    // 3. Handle personal state (likes/bookmarks)
    let likedSet = new Set<string>();
    let bookmarkedSet = new Set<string>();

    if (currentUserHandle) {
        const { data: likes } = await supabaseAdmin
            .from('video_likes')
            .select('video_id')
            .eq('user_handle', currentUserHandle);

        const { data: bookmarks } = await supabaseAdmin
            .from('video_bookmarks')
            .select('video_id')
            .eq('user_handle', currentUserHandle);

        likes?.forEach((l: any) => likedSet.add(l.video_id));
        bookmarks?.forEach((b: any) => bookmarkedSet.add(b.video_id));
    }

    // ====================================================================
    // AD SERVER 70/30 — Segmentación geográfica + intereses
    // ====================================================================
    let campaignsMap = new Map();
    let adToInject: any = null;
    try {
        // Obtener perfil del usuario actual para segmentación
        let userCountry: string | null = null;
        let userRegion: string | null = null;
        let userInterests: string[] = [];

        if (currentUserHandle) {
            const { data: userProfile } = await supabaseAdmin
                .from('app_users')
                .select('country, region, interests')
                .eq('handle', currentUserHandle)
                .single();
            if (userProfile) {
                userCountry = userProfile.country || null;
                userRegion = userProfile.region || null;
                userInterests = userProfile.interests || [];
            }
        }

        // Traer todas las campañas activas con sus metadatos y targeting
        const { data: activeCampaignsData } = await supabaseAdmin
            .from('campaigns')
            .select('id, force_view, min_view_time, video_url, name, target_countries, target_regions, target_interests, priority, pack_size, impressions')
            .eq('status', 'active');

        // Filtro adicional de Inventario: excluir campañas locales que ya consumieron su pack
        // (Este filtro también se aplica en BD por el trigger, pero lo doble-chequeamos aquí)
        let activeCampaigns = activeCampaignsData || [];
        activeCampaigns = activeCampaigns.filter((c: any) => c.pack_size === 0 || c.impressions < c.pack_size);

        if (activeCampaigns && activeCampaigns.length > 0) {
            activeCampaigns.forEach((c: any) => campaignsMap.set(c.id, c));

            // 1. Filtro geográfico ESTRICTO: descartar anuncios que explícitamente excluyen al usuario
            const geoFiltered = activeCampaigns.filter((c: any) => {
                const hasCountryTarget = c.target_countries && c.target_countries.length > 0;
                const hasRegionTarget = c.target_regions && c.target_regions.length > 0;

                // Si el anuncio tiene filtro de países y el usuario no coincide → descartar
                if (hasCountryTarget && userCountry) {
                    const countryMatch = c.target_countries.some((tc: string) =>
                        tc.toLowerCase() === userCountry!.toLowerCase()
                    );
                    if (!countryMatch) return false;
                } else if (hasCountryTarget && !userCountry) {
                    return false; // Usuario sin perfil geo → no ver ads geofiltrados
                }

                // Si el anuncio tiene filtro de región y el usuario no coincide → descartar
                if (hasRegionTarget && userRegion) {
                    const regionMatch = c.target_regions.some((tr: string) =>
                        userRegion!.toLowerCase().includes(tr.toLowerCase()) ||
                        tr.toLowerCase().includes(userRegion!.toLowerCase())
                    );
                    if (!regionMatch) return false;
                } else if (hasRegionTarget && !userRegion) {
                    return false;
                }

                return true;
            });

            // 2. Dividir en pool segmentado (match de interés) y pool genérico
            const matchedPool = geoFiltered.filter((c: any) => {
                const hasInterestTarget = c.target_interests && c.target_interests.length > 0;
                if (!hasInterestTarget) return false; // Sin intereses → genérico
                return c.target_interests.some((ti: string) =>
                    userInterests.some((ui: string) => ui.toLowerCase() === ti.toLowerCase())
                );
            });

            const genericPool = geoFiltered.filter((c: any) => {
                const hasInterestTarget = c.target_interests && c.target_interests.length > 0;
                if (!hasInterestTarget) return true; // Sin intereses → siempre genérico
                return !c.target_interests.some((ti: string) =>
                    userInterests.some((ui: string) => ui.toLowerCase() === ti.toLowerCase())
                );
            });

            // 3. Agrupación por Prioridades (Enterprise, Premium, Standard)
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
                    id: `ad_${selectedCampaign.id}_${Date.now()}`,
                    videoUrl: selectedCampaign.video_url,
                    user: '@voz_ads',
                    description: `📢 ${selectedCampaign.name || 'Publicidad'}`,
                    likes: 0, shares: 0, commentsCount: 0, views: 0,
                    createdAt: new Date().toISOString(),
                    isAd: true,
                    commentsEnabled: false,
                    forceView: selectedCampaign.force_view || false,
                    minViewTime: selectedCampaign.min_view_time || 0,
                    campaignId: selectedCampaign.id,
                };
            }
        }
    } catch (err) {
        console.error("[db] Error in ad server 70/30 targeting:", err);
    }

    // 4. Merge data
    const result = (scoredVideos as any[]).map(v => {
        const u: any = userMap.get(v.user_handle) || {};
        const campMeta = v.is_ad ? campaignsMap.get(v.id) : null;
        return {
            id: v.id,
            videoUrl: v.video_url,
            user: v.user_handle,
            userHandle: v.user_handle,
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
            isMuted: v.is_muted,
            commentsEnabled: v.comments_enabled !== false,
            userName: u.name || u.handle?.replace('@', '') || v.user_handle?.replace('@', ''),
            userImage: u.profile_image,
            isLikedByMe: likedSet.has(v.id),
            isBookmarkedByMe: bookmarkedSet.has(v.id),
            score: v._score || v.score,
            forceView: campMeta ? campMeta.force_view : (v.force_view || false),
            minViewTime: campMeta ? campMeta.min_view_time : (v.min_view_time || 0),
            is_live: u.is_live || false,
            isLive: u.is_live || false,
            live_url: u.live_url || null
        };
    });

    // 5. Inyectar el anuncio seleccionado naturalmente en el feed (posición variable según offset)
    if (adToInject && result.length >= 2) {
        // En lugar de ponerlo siempre en la posición 4, si es Enterprise y offset 0, en la 1 o 2.
        const isEnterprise = adToInject.description.includes('Enterprise'); // Hacky check but fine
        let adIndex = 4;
        if (offset === 0) adIndex = 1; // Inyección inmediata al inicio (posición 2 del feed)
        else adIndex = Math.min(4, result.length - 1);
        result.splice(adIndex, 0, adToInject as any);
    }

    // --- LIVE CARD INJECTION LOGIC ---
    try {
        const { data: liveUsers } = await supabaseAdmin
            .from('app_users')
            .select('name, handle, profile_image, is_live, live_url')
            .eq('is_live', true)
            .limit(10);
            
        if (liveUsers && liveUsers.length > 0) {
            const randomLiveUser = liveUsers[Math.floor(Math.random() * liveUsers.length)];
            const liveCard = {
                id: `live_card_${randomLiveUser.handle}_${new Date().getTime()}`,
                videoUrl: randomLiveUser.live_url,
                user: randomLiveUser.handle,
                description: `🔴 ¡${randomLiveUser.name || randomLiveUser.handle} está en directo! Entra ahora.`,
                likes: 0, shares: 0, commentsCount: 0, views: 0,
                createdAt: new Date().toISOString(),
                isMuted: false,
                userName: randomLiveUser.name || randomLiveUser.handle,
                userImage: randomLiveUser.profile_image,
                isLiveCard: true,
                is_live: true,
                live_url: randomLiveUser.live_url,
                commentsEnabled: false
            };
            const injectionIndex = Math.min(3, result.length);
            result.splice(injectionIndex, 0, liveCard as any);
        }
    } catch (e) {
        console.error("[db] Error injecting live card:", e);
    }
    // ----------------------------------

    return result;
}

export async function getVideosByUser(handle: string, currentUserHandle?: string): Promise<VideoPost[]> {
    // 1. Fetch raw videos
    const { data: videos, error: videosError } = await supabaseAdmin
        .from('videos')
        .select('*')
        .eq('user_handle', handle);

    if (videosError) {
        console.error("[db] getVideosByUser error:", videosError);
        return [];
    }

    if (!videos || videos.length === 0) return [];

    // 2. Fetch specific user data
    const { data: userData, error: userError } = await supabaseAdmin
        .from('app_users')
        .select('name, handle, profile_image, is_live, live_url')
        .eq('handle', handle)
        .single();

    if (userError) {
        console.warn("[db] Could not fetch user data for handle:", handle);
    }

    // 3. Handle personal state
    let likedSet = new Set<string>();
    let bookmarkedSet = new Set<string>();

    if (currentUserHandle) {
        const { data: likes } = await supabaseAdmin
            .from('video_likes')
            .select('video_id')
            .eq('user_handle', currentUserHandle);

        const { data: bookmarks } = await supabaseAdmin
            .from('video_bookmarks')
            .select('video_id')
            .eq('user_handle', currentUserHandle);

        likes?.forEach((l: any) => likedSet.add(l.video_id));
        bookmarks?.forEach((b: any) => bookmarkedSet.add(b.video_id));
    }

    // 4. Merge
    return (videos as any[]).map(v => {
        const u: any = userData || {};
        return {
            id: v.id,
            videoUrl: v.video_url,
            user: v.user_handle,
            userHandle: v.user_handle,
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
            isMuted: v.is_muted,
            commentsEnabled: v.comments_enabled !== false, // true por defecto si la columna no existe aún
            userName: u.name || u.handle?.replace('@', '') || v.user_handle?.replace('@', ''),
            userImage: u.profile_image,
            isLikedByMe: likedSet.has(v.id),
            isBookmarkedByMe: bookmarkedSet.has(v.id),
            is_live: u.is_live || false,
            isLive: u.is_live || false,
            live_url: u.live_url || null
        };
    });
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
            filter_settings: video.filterConfig,
            is_muted: video.isMuted || false,
            metadata: { is_processed: video.is_processed !== undefined ? video.is_processed : true }
        }])
        .select()
        .single();

    if (error) {
        console.error('Error adding video:', error);
        throw new Error(`Database failure: ${error.message || JSON.stringify(error)}`);
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

export async function deleteVideo(id: string, userHandle?: string): Promise<boolean> {
    try {
        // 1. Get the video URL to know what to delete from storage
        let query = supabaseAdmin.from('videos').select('video_url, user_handle').eq('id', id);
        if (userHandle) {
            query = query.eq('user_handle', userHandle);
        }
        const { data: video, error: fetchError } = await query.single();

        if (fetchError || !video) {
            console.error('Error fetching video for deletion:', fetchError);
            return false;
        }

        // 1.5. Find and delete voice comments (audio files from storage)
        const { data: comments } = await supabaseAdmin
            .from('voice_comments')
            .select('id, audio_url')
            .eq('video_id', id);

        if (comments && comments.length > 0) {
            const audioPaths: string[] = [];
            const urlPart = '/storage/v1/object/public/media/';
            for (const c of comments) {
                if (c.audio_url) {
                    if (c.audio_url.includes(urlPart)) {
                        audioPaths.push(c.audio_url.split(urlPart)[1]);
                    } else {
                        const parts = c.audio_url.split('/');
                        audioPaths.push(parts.slice(parts.indexOf('media') + 1).join('/'));
                    }
                }
            }
            if (audioPaths.length > 0) {
                console.log(`[Storage] Deleting voice comments audio files: ${audioPaths.join(', ')}`);
                await supabaseAdmin.storage.from('media').remove(audioPaths);
            }
            // Borrar de BD explícitamente por si acaso no hay CASCADE
            await supabaseAdmin.from('voice_comments').delete().eq('video_id', id);
        }

        // 2. Extract relative path from URL
        // URL format: .../storage/v1/object/public/media/videos/filename.mp4
        const urlPart = '/storage/v1/object/public/media/';
        let relativePath = '';
        if (video.video_url.includes(urlPart)) {
            relativePath = video.video_url.split(urlPart)[1];
        } else {
            // Fallback: try to guess from the URL
            const parts = video.video_url.split('/');
            relativePath = parts.slice(parts.indexOf('media') + 1).join('/');
        }

        if (relativePath) {
            console.log(`[Storage] Deleting file: ${relativePath}`);
            const { error: storageError } = await supabaseAdmin.storage
                .from('media')
                .remove([relativePath]);

            if (storageError) {
                console.error('Error deleting file from storage:', storageError);
                // We stop here to avoid orphan database records if the file persists
                return false;
            }
        }

        // 3. Delete from database
        let delQuery = supabaseAdmin.from('videos').delete().eq('id', id);
        if (userHandle) {
             delQuery = delQuery.eq('user_handle', userHandle);
        }
        const { error: dbError } = await delQuery;

        if (dbError) {
            console.error('Error deleting video from DB:', dbError);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Exception in deleteVideo:', err);
        return false;
    }
}

export async function deleteVideoByUrl(url: string, userHandle: string): Promise<boolean> {
    try {
        // 1. Find video by URL
        const { data: video, error: fetchError } = await supabaseAdmin
            .from('videos')
            .select('id')
            .eq('video_url', url)
            .single();

        if (fetchError || !video) {
            console.error('Error finding video by URL for deletion:', fetchError);
            return false;
        }

        // 2. Use existing deleteVideo function
        return await deleteVideo(video.id, userHandle);
    } catch (err) {
        console.error('Exception in deleteVideoByUrl:', err);
        return false;
    }
}

export async function getVideoIdByUrl(url: string): Promise<string | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('videos')
            .select('id')
            .eq('video_url', url)
            .maybeSingle();

        if (error || !data) {
            return null;
        }
        return data.id;
    } catch (err) {
        console.error('Error in getVideoIdByUrl:', err);
        return null;
    }
}

export async function requestVideoRetention(videoId: string, userHandle: string): Promise<boolean> {
    try {
        const { data: video, error } = await supabaseAdmin
            .from('videos')
            .select('filter_config')
            .eq('id', videoId)
            .eq('user_handle', userHandle)
            .single();

        if (error || !video) return false;

        const currentConfig = video.filter_config || {};
        const newConfig = {
            ...currentConfig,
            retention_requested: true
        };

        const { error: updateError } = await supabaseAdmin
            .from('videos')
            .update({ filter_config: newConfig })
            .eq('id', videoId)
            .eq('user_handle', userHandle);

        return !updateError;
    } catch (err) {
        console.error('Exception in requestVideoRetention:', err);
        return false;
    }
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

export async function addWithdrawalRequest(req: WithdrawalRequest): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('withdrawal_requests')
        .insert([{
            user_id: req.userId,
            user_handle: req.userHandle,
            amount: req.amount,
            method: req.method,
            details: req.details,
            status: 'pending'
        }]);

    if (error) {
        console.error('Error adding withdrawal request:', error);
        return false;
    }
    return true;
}

export async function addTransaction(tx: any) {
    const { error } = await supabaseAdmin
        .from('transactions')
        .insert([{
            sender_handle: tx.senderHandle || tx.senderId,
            receiver_handle: tx.receiverHandle || tx.receiverId,
            amount: tx.amount,
            type: tx.type,
            video_id: tx.videoId || null
        }]);

    if (error) {
        console.error('Error adding transaction:', error);
    }
}

export async function addCoinSale(sale: any) {
    const { error } = await supabaseAdmin
        .from('coin_sales')
        .insert([{
            user_handle: sale.userHandle,
            pack_type: sale.packType,
            price: sale.price,
            coins: sale.coins,            status: sale.status || 'succeeded'
        }]);

    if (error) {
        console.error('Error adding coin sale:', error);
    }
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

export async function addBannedEmail(email: string, reason: string, phone?: string): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('banned_emails')
        .insert([{ email, reason, phone }]);
    if (error) {
        console.error('Error adding banned email:', error);
        return false;
    }
    return true;
}

export async function isBlacklisted(email: string, phone?: string): Promise<boolean> {
    let query = supabaseAdmin
        .from('banned_emails')
        .select('email, phone');
    
    if (phone) {
        query = query.or(`email.eq.${email},phone.eq.${phone}`);
    } else {
        query = query.eq('email', email);
    }

    const { data } = await query.maybeSingle();
    return !!data;
}

// --- Real FCM Push Tokens Management ---
export interface PushTokenRecord {
    id: string;
    user_id: string;
    fcm_token: string;
    device_type?: string;
    created_at?: string;
    updated_at?: string;
}

export async function savePushToken(userId: string, fcmToken: string, deviceType: string = 'android'): Promise<boolean> {
    try {
        const { error } = await supabaseAdmin
            .from('push_tokens')
            .upsert(
                { user_id: userId, fcm_token: fcmToken, device_type: deviceType, updated_at: new Date().toISOString() },
                { onConflict: 'fcm_token' }
            );
        if (error) {
            console.error("[db] Error saving push token:", error);
            return false;
        }
        console.log(`[db] Push token guardado exitosamente para usuario: ${userId}`);
        return true;
    } catch (err) {
        console.error("[db] Exception saving push token:", err);
        return false;
    }
}

export async function getUserPushTokens(userId: string): Promise<string[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('push_tokens')
            .select('fcm_token')
            .eq('user_id', userId);
        if (error) {
            console.error("[db] Error getting user push tokens:", error);
            return [];
        }
        return data ? data.map(t => t.fcm_token) : [];
    } catch (err) {
        console.error("[db] Exception getting user push tokens:", err);
        return [];
    }
}

