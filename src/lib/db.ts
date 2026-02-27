import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials missing in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
            joined_at: user.joinedAt
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
    const dbUpdates: any = { ...updates };
    if (updates.walletBalance !== undefined) {
        dbUpdates.wallet_balance = updates.walletBalance;
        delete dbUpdates.walletBalance;
    }
    if (updates.joinedAt !== undefined) {
        dbUpdates.joined_at = updates.joinedAt;
        delete dbUpdates.joinedAt;
    }
    if (updates.profileImage !== undefined) {
        dbUpdates.profile_image = updates.profileImage;
        delete dbUpdates.profileImage;
    }
    if (updates.isCreator !== undefined) {
        dbUpdates.is_creator = updates.isCreator;
        delete dbUpdates.isCreator;
    }

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

    return {
        id: data.id,
        handle: data.handle,
        email: data.email,
        status: data.status,
        reputation: data.reputation,
        walletBalance: parseFloat(data.wallet_balance),
        joinedAt: data.joined_at
    };
}

// --- Videos Logic ---
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
    thumbnailUrl?: string;
}

export async function getVideos(): Promise<VideoPost[]> {
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching videos:', error);
        return [];
    }

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
        thumbnailUrl: v.thumbnail_url
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
            thumbnail_url: video.thumbnailUrl
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
        thumbnailUrl: data.thumbnail_url
    };
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
        avatar_url: userMap.get(c.user_handle) || null,
        likes: likesCountMap.get(c.id) || 0, // Conteo dinámico calculado
        isLikedByMe: likedByMeSet.has(c.id)
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
