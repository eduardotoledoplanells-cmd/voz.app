/**
 * LYVO GRAVITY ENGINE V2.2
 * 
 * Motor de recomendación, retención, viralización, exploración y diversidad del Feed de LYVO.
 * Versión 2.2 auditada para estabilidad matemática, protección anti-spam, candidate pool diverso
 * y preservación de las notas de voz como canal conversacional nativo.
 */

export interface VideoPlaybackStats {
    qualified_views?: number;
    total_watch_time?: number;
    completion_count?: number;
    rewatch_count?: number;
    early_skips_count?: number;
    last_updated?: string;
}

export interface VideoVoiceStats {
    total_voice_comments?: number;
    unique_commenters?: string[];
    unique_commenters_count?: number;
    thread_replies_count?: number; // Notas de voz que responden a otra (parent_id != null)
    total_listens?: number;        // Reproducciones de las notas de voz recibidas
    listened_duration_seconds?: number;
    last_voice_at?: string;
}

export interface UserRankingContext {
    userHandle?: string;
    followingList?: string[];
    recentlySeenVideos?: { id: string; seenAt: number }[];
    hiddenVideoIds?: string[]; // Vídeos ocultos o reportados ("No me interesa")
    skippedTopics?: Record<string, number>; // Frecuencia de early skips por hashtag
    sessionSeed?: string;
    userInterests?: string[];
    creatorHistory?: Record<string, number>;
    unseenRatio?: number; // Proporción de candidatos no vistos (degradación suave en catálogo pequeño)
}

export interface GravityScoreBreakdown {
    watchQuality: number;
    engagementQuality: number;
    voiceConversationQuality: number;
    topicAffinity: number;
    freshness: number;
    exploration: number;
    personalization: number;
    negativePenalty: number;
    recentlySeenPenalty: number;
    creatorDiversityPenalty: number;
    sessionJitter: number;
    rawScore: number;
    finalScore: number;
}

/**
 * Función auxiliar de protección matemática: acota un valor entre min y max de forma segura.
 */
export function clamp(val: number, min: number = 0, max: number = 1): number {
    if (isNaN(val) || val === null || val === undefined) return min;
    return Math.max(min, Math.min(max, val));
}

/**
 * Extrae hashtags normalizados de un texto (#futbol -> "futbol")
 * - Ignora URLs completas con anclas (evita https://...#hash)
 * - Soporta caracteres acentuados Unicode
 * - Limita longitud entre 2 y 30 caracteres
 * - Limita a un máximo de 15 hashtags para evitar spam/DoS
 */
export function extractHashtags(text?: string): string[] {
    if (!text || typeof text !== 'string') return [];
    const cleaned = text.replace(/https?:\/\/[^\s]+/gi, '');
    const matches = cleaned.match(/#[a-zA-Z0-9_\u00C0-\u00FF]+/g);
    if (!matches) return [];
    return [...new Set(
        matches
            .map(t => t.substring(1).toLowerCase().trim())
            .filter(t => t.length >= 2 && t.length <= 30)
    )].slice(0, 15);
}

/**
 * 1. WATCH QUALITY (Nivel 1 - 40% del peso total)
 * Señal reina del algoritmo: atención real, tasa de finalización y rewatches.
 * 
 * Reglas de estabilidad V2.2:
 * - 0 <= WQ <= 40.0 siempre.
 * - Si exposición == 0, WQ = 0.0 (no se asume calidad ficticia; la oportunidad la da Exploration).
 * - rewatchRatio queda acotado en [0..1] (10 rewatches de un bot no desbordan la fórmula).
 * - earlySkipRate representa la proporción real de exposiciones rechazadas en < 2.5s.
 */
export function calculateWatchQuality(video: any, stats: VideoPlaybackStats): {
    score: number;
    excessNegativePenalty: number;
} {
    const qualifiedViews = Math.max(0, stats.qualified_views || 0);
    const rawViews = Math.max(0, video.views || 0);
    const earlySkips = Math.max(0, stats.early_skips_count || 0);
    const completions = Math.max(0, stats.completion_count || 0);
    const rewatches = Math.max(0, stats.rewatch_count || 0);
    const totalWatchTime = Math.max(0, stats.total_watch_time || 0);

    const totalExposure = Math.max(rawViews, qualifiedViews + earlySkips);
    if (totalExposure === 0) {
        return { score: 0.0, excessNegativePenalty: 0.0 };
    }

    // Tasa de finalización (Completion Rate): 0.0 a 1.0
    const completionRate = clamp(completions / Math.max(1, totalExposure), 0, 1);

    // Ratio de repetición (Rewatch): señal fuerte, acotada estrictamente a [0..1]
    const rewatchRatio = clamp(rewatches / Math.max(1, qualifiedViews), 0, 1);

    // Ratio de abandono temprano (< 2.5s): 0.0 a 1.0
    const skipRatio = clamp(earlySkips / Math.max(1, totalExposure), 0, 1);

    // Retención normalizada frente a duración del vídeo
    const duration = Math.max(5, video.duration_seconds || video.metadata?.duration || 15);
    const avgWatchTime = totalWatchTime / Math.max(1, qualifiedViews);
    const normalizedRetention = clamp(avgWatchTime / duration, 0, 1);

    // Señales positivas: hasta 40 puntos
    const watchPositive = (completionRate * 16.0) 
                        + (rewatchRatio * 12.0) 
                        + (normalizedRetention * 12.0);

    // Penalización por early skip: hasta 18 puntos
    const skipPenalty = skipRatio * 18.0;

    const netScore = watchPositive - skipPenalty;
    const score = clamp(netScore, 0, 40.0);

    const excessNegativePenalty = Math.max(0, skipPenalty - watchPositive);

    return { score, excessNegativePenalty };
}

/**
 * 2. ENGAGEMENT QUALITY (Nivel 2 - 20% del peso total)
 * Mide reacciones explícitas: Shares (5.0) > Bookmarks/Saves (4.0) > Likes (1.5).
 */
export function calculateEngagementQuality(video: any, stats: VideoPlaybackStats): number {
    const rawExposure = Math.max(0, stats.qualified_views || video.views || 0);
    const shares = Math.max(0, video.shares || 0);
    const bookmarks = Math.max(0, video.bookmarks || video.bookmarksCount || 0);
    const likes = Math.max(0, video.likes || 0);

    if (rawExposure === 0 && shares === 0 && bookmarks === 0 && likes === 0) {
        return 0;
    }

    const exposure = Math.max(1, rawExposure);

    // Acotar contadores individuales para que no superen la exposición de forma absurda
    const boundedShares = Math.min(shares, exposure * 2);
    const boundedBookmarks = Math.min(bookmarks, exposure * 2);
    const boundedLikes = Math.min(likes, exposure * 2);

    const rawSignals = (boundedShares * 5.0) 
                     + (boundedBookmarks * 4.0) 
                     + (boundedLikes * 1.5);

    const denominator = 25.0 + Math.pow(exposure, 0.75);
    const smoothedRatio = rawSignals / denominator;

    return clamp(smoothedRatio * 16.0, 0, 20.0);
}

/**
 * 3. VOICE CONVERSATION QUALITY (Nivel 3 - 20% del peso total)
 * Mide conversación orgánica por Notas de Voz en LYVO.
 */
export function calculateVoiceConversationQuality(
    video: any,
    playbackStats: VideoPlaybackStats,
    voiceStats?: VideoVoiceStats
): number {
    const totalVoiceComments = Math.max(
        0, 
        voiceStats?.total_voice_comments ?? video.comments_count ?? video.commentsCount ?? 0
    );
    if (totalVoiceComments === 0) return 0;

    const uniqueCommenters = Math.max(
        1, 
        voiceStats?.unique_commenters_count ?? (totalVoiceComments > 0 ? Math.max(1, Math.round(totalVoiceComments * 0.8)) : 0)
    );
    const repliesCount = Math.max(0, voiceStats?.thread_replies_count ?? 0);
    const totalListens = Math.max(0, voiceStats?.total_listens ?? 0);
    const listenedDuration = Math.max(0, voiceStats?.listened_duration_seconds ?? 0);
    const exposure = Math.max(1, playbackStats.qualified_views || video.views || 1);

    // 1. Amplitud de comentaristas únicos frente a audiencia expuesta (hasta 8.0 pts)
    const uniqueRatio = uniqueCommenters / (8.0 + Math.pow(exposure, 0.55));
    const breadthScore = clamp(uniqueRatio * 18.0, 0, 8.0);

    // 2. Factor de diversidad (Anti-Spam): relación de usuarios únicos sobre notas totales
    const diversityFactor = clamp(uniqueCommenters / Math.max(1, totalVoiceComments), 0, 1);

    // 3. Profundidad de conversación (Hilos / Respuestas parent_id - hasta 5.0 pts)
    const depthRatio = clamp(repliesCount / Math.max(1, totalVoiceComments), 0, 1);
    const depthScore = clamp((repliesCount * 0.30) + (depthRatio * 3.5), 0, 5.0);

    // 4. Calidad de escucha de notas (hasta 7.0 pts)
    const listenRatio = clamp(totalListens / Math.max(1, totalVoiceComments), 0, 2.5);
    const listenScore = clamp((listenRatio * 2.0) + (clamp(listenedDuration / 60.0, 0, 1) * 2.0), 0, 7.0);

    const rawVoiceScore = (breadthScore * 0.35 + depthScore * 0.35 + listenScore * 0.30) * 3.0 * diversityFactor;

    return clamp(rawVoiceScore, 0, 20.0);
}

/**
 * 4. TOPIC AFFINITY & HASHTAGS (hasta 6.0 puntos)
 * Utiliza hashtags para content understanding sin permitir compra de ranking por spam.
 */
export function calculateTopicAffinity(
    videoTopics: string[],
    userInterests?: string[]
): number {
    if (!userInterests || userInterests.length === 0 || !videoTopics || videoTopics.length === 0) {
        return 0;
    }
    const cleanUserInterests = userInterests.map(i => i.toLowerCase().replace('#', '').trim());
    const matches = videoTopics.filter(t => cleanUserInterests.includes(t.toLowerCase()));

    if (matches.length === 0) return 0;
    if (matches.length === 1) return 3.5;
    if (matches.length === 2) return 5.0;
    return 6.0;
}

/**
 * 5. PERSONALIZACIÓN (Afinidad de creador + Afinidad temática de hashtags - hasta 12 puntos)
 */
export function calculatePersonalization(video: any, context?: UserRankingContext): {
    totalBonus: number;
    topicAffinity: number;
} {
    if (!context) return { totalBonus: 0, topicAffinity: 0 };
    let creatorBonus = 0;

    const creator = video.user || video.user_handle;
    if (creator && context.followingList && context.followingList.includes(creator)) {
        creatorBonus = 6.0;
    }

    const videoTopics = extractHashtags(video.description);
    const topicAffinity = calculateTopicAffinity(videoTopics, context.userInterests);

    const totalBonus = clamp(creatorBonus + topicAffinity, 0, 12.0);
    return { totalBonus, topicAffinity };
}

/**
 * 6. FRESHNESS (hasta 12 puntos)
 * Curva de semivida de 48h. El contenido antiguo nunca llega a 0 absoluto (mínimo 0.5 pts)
 * permitiendo que vídeos evergreen de altísima calidad compitan siempre.
 */
export function calculateFreshness(createdAt: string | Date): number {
    const createdTime = new Date(createdAt).getTime();
    if (isNaN(createdTime)) return 6.0;

    const ageHours = Math.max(0, (Date.now() - createdTime) / (1000 * 60 * 60));
    const freshness = 12.0 / (1.0 + Math.pow(ageHours / 48.0, 1.15));
    return clamp(freshness, 0.5, 12.0);
}

/**
 * 7. EXPLORATION / COLD-START BOOST (hasta 18 puntos)
 * Otorga una ventana de oportunidad a vídeos nuevos (<35 impresiones, <7 días).
 * No asume que el vídeo sea bueno: si recibe rechazo temprano, el exceso negativo lo neutraliza.
 */
export function calculateExploration(video: any, stats: VideoPlaybackStats, ageHours: number): number {
    const rawViews = Math.max(0, video.views || 0);
    const qualifiedViews = Math.max(0, stats.qualified_views || 0);
    const totalImp = Math.max(rawViews, qualifiedViews);

    if (totalImp >= 35 || ageHours >= 168) {
        return 0;
    }

    const explorationFactor = clamp(1.0 - (totalImp / 35.0), 0, 1);
    // Cierre suave en las últimas 24 horas del período de 7 días (de día 6 a día 7)
    const freshnessGate = ageHours <= 144 ? 1.0 : clamp(1.0 - ((ageHours - 144) / 24.0), 0, 1);

    return clamp(explorationFactor * 18.0 * freshnessGate, 0, 18.0);
}

/**
 * 8. PENALIZACIÓN POR SEÑALES NEGATIVAS (Skip de temas, Not Interested, Report)
 */
export function calculateNegativeSignalsPenalty(
    videoId: string,
    videoDescription?: string,
    context?: UserRankingContext
): number {
    if (!context) return 0;
    let penalty = 0;

    if (context.hiddenVideoIds && context.hiddenVideoIds.includes(videoId)) {
        return 100.0;
    }

    if (context.skippedTopics && videoDescription) {
        const topics = extractHashtags(videoDescription);
        for (const t of topics) {
            const skipCount = context.skippedTopics[t] || 0;
            if (skipCount >= 3) {
                penalty += 8.0;
                break;
            } else if (skipCount === 2) {
                penalty += 3.0;
                break;
            }
        }
    }

    return clamp(penalty, 0, 100.0);
}

/**
 * 9. PENALIZACIÓN DE VÍDEOS VISTOS RECIENTEMENTE (Recently Seen Decay)
 * Con degradación suave en catálogo pequeño o usuario que ha visto casi todo.
 */
export function calculateRecentlySeenPenalty(videoId: string, context?: UserRankingContext): number {
    if (!context?.recentlySeenVideos || !Array.isArray(context.recentlySeenVideos)) return 0;

    const seenItem = context.recentlySeenVideos.find(v => v.id === videoId);
    if (!seenItem) return 0;

    const hoursSinceSeen = Math.max(0, (Date.now() - seenItem.seenAt) / (1000 * 60 * 60));

    let basePenalty = 0;
    if (hoursSinceSeen < 2) {
        basePenalty = 50.0;
    } else if (hoursSinceSeen < 12) {
        basePenalty = 28.0;
    } else if (hoursSinceSeen < 36) {
        basePenalty = 12.0;
    } else if (hoursSinceSeen < 72) {
        basePenalty = 5.0;
    }

    if (context.unseenRatio !== undefined && context.unseenRatio < 0.4) {
        const fallbackFactor = clamp(context.unseenRatio / 0.4, 0.25, 1.0);
        basePenalty = basePenalty * fallbackFactor;
    }

    return basePenalty;
}

/**
 * 10. PENALIZACIÓN POR DIVERSIDAD DE CREADOR (Creator Repetition Penalty)
 */
export function calculateDiversityPenalty(creator: string, creatorHistory?: Record<string, number>): number {
    if (!creatorHistory || !creator) return 0;
    const count = creatorHistory[creator] || 0;

    if (count === 1) {
        return 12.0;
    } else if (count === 2) {
        return 26.0;
    } else if (count >= 3) {
        return 45.0;
    }
    return 0;
}

/**
 * 11. VARIACIÓN CONTROLADA DE SESIÓN (Deterministic Controlled Jitter)
 */
export function calculateSessionJitter(videoId: string, sessionSeed?: string): number {
    if (!sessionSeed) return 0;

    let hash = 0;
    const str = `${videoId}:${sessionSeed}`;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    const normalized = ((Math.abs(hash) % 1000) / 1000.0) * 2.0 - 1.0;
    return normalized * 1.5;
}

/**
 * FUNCIÓN CENTRAL: GRAVITY ENGINE V2.2
 * Única fuente de verdad del ranking en LYVO.
 */
export function calculateGravityScore(video: any, context?: UserRankingContext): {
    rankingScore: number;
    rankingVersion: string;
    rankingDebug: GravityScoreBreakdown;
} {
    const playbackStats: VideoPlaybackStats = video.metadata?.playback_stats || {};
    const voiceStats: VideoVoiceStats = video.metadata?.voice_stats || {};
    const creator = video.user || video.user_handle || 'anon';
    const createdAt = video.created_at || video.createdAt || new Date();
    const ageHours = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));

    // 1. Componentes del algoritmo
    const { score: watchQuality, excessNegativePenalty } = calculateWatchQuality(video, playbackStats);
    const engagementQuality = calculateEngagementQuality(video, playbackStats);
    const voiceConversationQuality = calculateVoiceConversationQuality(video, playbackStats, voiceStats);
    const { totalBonus: personalization, topicAffinity } = calculatePersonalization(video, context);
    const freshness = calculateFreshness(createdAt);
    const exploration = calculateExploration(video, playbackStats, ageHours);

    // 2. Penalizaciones
    const recentlySeenPenalty = calculateRecentlySeenPenalty(video.id, context);
    const creatorDiversityPenalty = calculateDiversityPenalty(creator, context?.creatorHistory);
    const explicitNegativePenalty = calculateNegativeSignalsPenalty(video.id, video.description, context);
    const negativePenalty = explicitNegativePenalty + excessNegativePenalty;
    const sessionJitter = calculateSessionJitter(video.id, context?.sessionSeed);

    const positiveSignals = watchQuality 
                          + engagementQuality 
                          + voiceConversationQuality 
                          + personalization 
                          + freshness 
                          + exploration;

    const penalties = recentlySeenPenalty + creatorDiversityPenalty + negativePenalty;
    const rawScore = positiveSignals - penalties;

    // Puntuación final garantizada >= 0.01
    const finalScore = Number(Math.max(0.01, rawScore + sessionJitter).toFixed(3));

    const breakdown: GravityScoreBreakdown = {
        watchQuality: Number(watchQuality.toFixed(2)),
        engagementQuality: Number(engagementQuality.toFixed(2)),
        voiceConversationQuality: Number(voiceConversationQuality.toFixed(2)),
        topicAffinity: Number(topicAffinity.toFixed(2)),
        freshness: Number(freshness.toFixed(2)),
        exploration: Number(exploration.toFixed(2)),
        personalization: Number(personalization.toFixed(2)),
        negativePenalty: Number(negativePenalty.toFixed(2)),
        recentlySeenPenalty: Number(recentlySeenPenalty.toFixed(2)),
        creatorDiversityPenalty: Number(creatorDiversityPenalty.toFixed(2)),
        sessionJitter: Number(sessionJitter.toFixed(2)),
        rawScore: Number(rawScore.toFixed(2)),
        finalScore
    };

    return {
        rankingScore: finalScore,
        rankingVersion: 'gravity-v2.2',
        rankingDebug: breakdown
    };
}
