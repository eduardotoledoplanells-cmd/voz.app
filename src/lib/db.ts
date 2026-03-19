import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://obdrsqeueivhnbsibhen.supabase.co';
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isValidEnvKey = envKey.startsWith('eyJ') && !envKey.includes('M81T8_3');
const supabaseAnonKey = isValidEnvKey ? envKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHJzcWV1ZWl2aG5ic2liaGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTE4MTksImV4cCI6MjA4NzMyNzgxOX0.6iZ82MtwuC5_Uxyu4xDRMKxITeugq8GiklPkgvq9AUg';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
    console.error('Supabase credentials missing in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : supabase;

// --- App Users Logic (VOZ) ---
export interface AppUser {
    id: string;
    handle: string;
    email: string;
    password?: string;
    status: 'active' | 'banned' | 'verified';
    reputation: number;
    walletBalance?: number;
    joinedAt: string;
    name?: string;
    bio?: string;
    profileImage?: string;
    isCreator?: boolean;
}

export async function getAppUsers(): Promise<AppUser[]> {
    const { data, error } = await supabase
        .from('app_users')
        .select('*');

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }

    return data.map(u => ({
        id: u.id,
        handle: u.handle,
        email: u.email,
        password: u.password,
        status: u.status,
        reputation: u.reputation,
        walletBalance: parseFloat(u.wallet_balance),
        joinedAt: u.joined_at,
        name: u.name,
        bio: u.bio,
        profileImage: u.profile_image,
        isCreator: u.is_creator
    }));
}

export async function addAppUser(user: AppUser): Promise<AppUser | null> {
    const { data, error } = await supabase
        .from('app_users')
        .insert([{
            id: user.id,
            handle: user.handle,
            email: user.email,
            password: user.password,
            status: user.status,
            reputation: user.reputation,
            wallet_balance: user.walletBalance || 0,
            joined_at: user.joinedAt,
            name: user.name,
            bio: user.bio,
            profile_image: user.profileImage,
            is_creator: user.isCreator || false
        }])
        .select()
        .single();

    if (error) {
        console.error('Error adding user:', error);
        return null;
    }

    return {
        ...user,
        walletBalance: parseFloat(data.wallet_balance)
    };
}

export async function updateAppUser(id: string, updates: Partial<AppUser>): Promise<AppUser | null> {
    // Get current handle if changing
    let oldHandle = '';
    if (updates.handle !== undefined) {
        const { data: current } = await supabase.from('app_users').select('handle').eq('id', id).single();
        if (current) oldHandle = current.handle;
    }

    const allowedKeys = ['name', 'handle', 'email', 'status', 'reputation', 'wallet_balance', 'bio', 'profile_image', 'is_creator', 'password', 'joined_at'];
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
    if (updates.joinedAt !== undefined) dbUpdates.joined_at = updates.joinedAt;

    // Filter and remove undefined
    Object.keys(dbUpdates).forEach(key => {
        if (!allowedKeys.includes(key) || dbUpdates[key] === undefined) {
            delete dbUpdates[key];
        }
    });

    const { data, error } = await supabase
        .from('app_users')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating user:', error);
        return null;
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
        handle: data.handle,
        name: data.name,
        email: data.email,
        status: data.status,
        reputation: data.reputation,
        walletBalance: parseFloat(data.wallet_balance),
        joinedAt: data.joined_at,
        bio: data.bio,
        profileImage: data.profile_image,
        isCreator: data.is_creator
    };
}

// --- Videos Logic ---
export interface VideoPost {
    id: string;
    videoUrl: string;
    thumbnailUrl?: string;
    user: string;
    description: string;
    likes: number;
    shares: number;
    commentsCount: number;
    views: number;
    createdAt: string;
    music?: string;
    filterConfig?: any;
    isAd?: boolean;
    isLikedByMe?: boolean;
    isBookmarkedByMe?: boolean;
    isPinned?: boolean;
    isMuted?: boolean;
}

export async function getVideos(currentUserHandle?: string): Promise<VideoPost[]> {
    const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
        .order('is_pinned', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

    if (error || !videos) {
        console.error('Error fetching videos:', error);
        return [];
    }

    // Si el usuario está logueado, verificamos qué videos le han gustado y cuáles ha guardado
    let likedSet = new Set<string>();
    let bookmarkedSet = new Set<string>();

    if (currentUserHandle) {
        const { data: likes } = await supabase
            .from('video_likes')
            .select('video_id')
            .eq('user_handle', currentUserHandle);

        const { data: bookmarks } = await supabase
            .from('video_bookmarks')
            .select('video_id')
            .eq('user_handle', currentUserHandle);

        likes?.forEach(l => likedSet.add(l.video_id));
        bookmarks?.forEach(b => bookmarkedSet.add(b.video_id));
    }

    return videos.map(v => ({
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
        isLikedByMe: likedSet.has(v.id),
        isBookmarkedByMe: bookmarkedSet.has(v.id),
        isPinned: v.is_pinned,
        isMuted: v.is_muted
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
            is_ad: video.isAd || false,
            thumbnail_url: video.thumbnailUrl,
            filter_config: video.filterConfig,
            is_muted: video.isMuted || false
        }])
        .select()
        .single();

    if (error) {
        console.error('Error adding video to Supabase:', error);
        throw new Error(error.message);
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
        filterConfig: data.filter_config,
        isAd: data.is_ad,
        thumbnailUrl: data.thumbnail_url,
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

// --- Moderation Queue ---
export interface ModerationItem {
    id: string;
    type: string;
    url: string;
    userHandle: string;
    content?: string;
    reportReason?: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp: string;
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
    parent_id?: string;
    created_at: string;
    isLikedByMe?: boolean;
}

export async function getVoiceComments(videoId: string, currentUserHandle?: string): Promise<any[]> {
    // 1. Cargar comentarios principales (parent_id = null)
    const { data: parentComments, error: parentsError } = await supabase
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
        const { data: repliesData, error: repliesError } = await supabase
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

    // Obtener likes desde la tabla comment_likes (voice_comment_likes en nuestra DB actual)
    // para contar cuántos likes reales tiene cada uno sin usar la columna 'likes'
    let likesData: any[] = [];
    const { data: fetchedLikes } = await supabase
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
        const { data: users } = await supabase
            .from('app_users')
            .select('handle, profile_image')
            .in('handle', handles);

        users?.forEach(u => userMap.set(u.handle, u.profile_image));
    }

    // Formatear la respuesta con el conteo dinámico de likes
    const enrichedComments = allComments.map(c => ({
        ...c,
        avatar_url: userMap.get(c.user_handle) || c.avatar_url || null,
        likes: likesCountMap.get(c.id) || 0, // Conteo dinámico calculado
        isLikedByMe: likedByMeSet.has(c.id)
    }));

    return enrichedComments;
}

export async function addVoiceComment(comment: any): Promise<any> {
    const { data, error } = await supabase
        .from('voice_comments')
        .insert([comment])
        .select()
        .single();

    if (error) {
        console.error('Error adding voice comment:', error);
        return null;
    }

    // Increment comments_count in videos table
    if (comment.video_id) {
        const { error: updateError } = await supabase.rpc('increment_video_comments', { vid: comment.video_id });
        if (updateError) {
            // Fallback if RPC doesn't exist: Manual update
            console.warn('RPC increment_video_comments failed, falling back to manual update', updateError);
            const { data: videoData } = await supabase.from('videos').select('comments_count').eq('id', comment.video_id).single();
            await supabase.from('videos').update({ comments_count: (videoData?.comments_count || 0) + 1 }).eq('id', comment.video_id);
        }
    }

    return data;
}

export async function toggleVideoLike(videoId: string, userHandle: string, isLiked: boolean): Promise<boolean> {
    if (isLiked) {
        // Try adding the like to our new tracking table
        const { error: likeError } = await supabaseAdmin
            .from('video_likes')
            .upsert([{ video_id: videoId, user_handle: userHandle }], { onConflict: 'video_id,user_handle' });

        if (likeError) {
            console.error('Error recording video like persistence:', likeError);
            return false;
        }
    } else {
        // Remove the like from our tracking table
        const { error: unlikeError } = await supabaseAdmin
            .from('video_likes')
            .delete()
            .match({ video_id: videoId, user_handle: userHandle });

        if (unlikeError) {
            console.error('Error removing video like persistence:', unlikeError);
            return false;
        }
    }

    // Now update the de-normalized counter in the videos table for performance
    const { data: videoData } = await supabaseAdmin.from('videos').select('likes').eq('id', videoId).single();
    const currentLikes = videoData?.likes || 0;
    const newLikes = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);

    const { error: updateError } = await supabaseAdmin
        .from('videos')
        .update({ likes: newLikes })
        .eq('id', videoId);

    if (updateError) {
        console.error('Error updating video likes count:', updateError);
        // We don't return false here because the persistent record was already updated above
    }

    return true;
}

export async function incrementVideoView(videoId: string, userHandle: string): Promise<boolean> {
    // Intentar insertar en la tabla video_views (único por video_id + user_handle)
    const { error: viewError } = await supabaseAdmin
        .from('video_views')
        .insert([{ video_id: videoId, user_handle: userHandle }]);

    if (viewError) {
        // Si ya existe (23505), no hacemos nada (ya se contó esta person)
        if (viewError.code === '23505') {
            return true;
        }
        console.error('Error insertando registro de vista única:', viewError);
        return false;
    }

    // Si es una vista nueva y única, incrementamos el contador global del video
    // Usamos rpc si existe, sino manual select + update
    const { error: rpcError } = await supabaseAdmin.rpc('increment_video_views', { vid: videoId });

    if (rpcError) {
        console.warn('RPC increment_video_views no encontrado, usando fallback manual');
        const { data: videoData } = await supabaseAdmin.from('videos').select('views').eq('id', videoId).single();
        const currentViews = videoData?.views || 0;
        await supabaseAdmin.from('videos').update({ views: currentViews + 1 }).eq('id', videoId);
    }

    return true;
}

export async function toggleVideoBookmark(videoId: string, userHandle: string, isBookmarked: boolean): Promise<boolean> {
    if (isBookmarked) {
        const { error } = await supabaseAdmin
            .from('video_bookmarks')
            .upsert([{ video_id: videoId, user_handle: userHandle }], { onConflict: 'video_id,user_handle' });

        if (error) {
            console.error('Error adding bookmark:', error);
            return false;
        }
    } else {
        const { error } = await supabaseAdmin
            .from('video_bookmarks')
            .delete()
            .match({ video_id: videoId, user_handle: userHandle });

        if (error) {
            console.error('Error removing bookmark:', error);
            return false;
        }
    }
    return true;
}

export async function incrementVoiceCommentLike(commentId: string, userHandle: string): Promise<boolean> {
    // 1. Insertar el registro en comment_likes (voice_comment_likes)
    // Supabase evita duplicados si hay llave primaria combinada (user_handle + comment_id) o si lo validamos
    const { error: likeError } = await supabase
        .from('voice_comment_likes')
        .insert([{ comment_id: commentId, user_handle: userHandle }]);

    if (likeError) {
        console.warn("Posible duplicado o error al dar like en voice_comment_likes:", likeError);
        return false;
    }

    // Ya no incrementamos la columna 'likes' manualmente en 'voice_comments'
    // El frontend obtendrá el total hacienda count de los registros en getVoiceComments.

    return true;
}

export async function removeVoiceCommentLike(commentId: string, userHandle: string): Promise<boolean> {
    const { error: unlikeError } = await supabase
        .from('voice_comment_likes')
        .delete()
        .match({ comment_id: commentId, user_handle: userHandle });

    if (unlikeError) {
        console.warn("Error al quitar like en voice_comment_likes:", unlikeError);
        return false;
    }

    return true;
}

export async function getModerationQueue(): Promise<ModerationItem[]> {
    const { data, error } = await supabase
        .from('moderation_queue')
        .select('*')
        .eq('status', 'pending');

    if (error) {
        console.error('Error fetching moderation queue:', error);
        return [];
    }

    return data.map(m => ({
        id: m.id,
        type: m.type,
        url: m.url,
        userHandle: m.user_handle,
        content: m.content,
        reportReason: m.report_reason,
        status: m.status,
        timestamp: m.timestamp
    }));
}

export async function updateModerationItem(id: string, updates: Partial<ModerationItem>): Promise<ModerationItem | null> {
    const { data, error } = await supabase
        .from('moderation_queue')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating moderation item:', error);
        return null;
    }

    return {
        id: data.id,
        type: data.type,
        url: data.url,
        userHandle: data.user_handle,
        content: data.content,
        reportReason: data.report_reason,
        status: data.status,
        timestamp: data.timestamp
    };
}

// --- Transactions ---
export async function addTransaction(tx: any) {
    const { error } = await supabase
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

export async function getTransactions(): Promise<any[]> {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false });

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

export async function addCoinSale(sale: any) {
    const { error } = await supabase
        .from('coin_sales')
        .insert([{
            user_handle: sale.userHandle,
            pack_type: sale.packType,
            price: sale.price,
            coins: sale.coins,
            stripe_payment_intent_id: sale.stripePaymentIntentId,
            status: sale.status || 'succeeded'
        }]);

    if (error) {
        console.error('Error adding coin sale:', error);
    }
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

// --- Health Check ---
async function checkTableHealth() {
    if (typeof window !== 'undefined') return; // Only on server

    try {
        const { error } = await supabaseAdmin.from('user_follows').select('count', { count: 'exact', head: true });
        if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
            console.warn('\n' + '='.repeat(50));
            console.warn('⚠️  ALERTA DE BASE DE DATOS: La tabla "user_follows" no existe.');
            console.warn('Por favor, ve al Panel de Admin -> Inicio -> Base de Datos para inicializarla.');
            console.warn('='.repeat(50) + '\n');
        }
    } catch (e) {
        // Silently fail health check to not block startup
    }
}

// Trigger check
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
    checkTableHealth();
}
