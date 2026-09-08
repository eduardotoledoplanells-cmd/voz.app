import { NextRequest, NextResponse } from "next/server";
import { getVideos, getVideosByUser, addVideo, deleteVideo, VideoPost, supabaseAdmin } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { logSystemAlert } from '@/lib/alerts';
import { feedTelemetry, assignVariant, EXPERIMENT_ID } from '@/lib/feedTelemetry';

// Revalidate feed cache every 15 seconds on Vercel Edge (SWR pattern)
export const revalidate = 15;

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

function corsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}

export async function GET(request: NextRequest) {
    const requestStart = performance.now();
    const requestId = request.headers.get('x-request-id') || uuidv4();
    let assignedVariant: 'CURRENT' | 'HYBRID_RECOMMENDED' = 'CURRENT';
    let userIdentifier = 'anonymous';

    try {
        const { searchParams } = new URL(request.url);
        const creatorHandle = searchParams.get('creatorHandle') || searchParams.get('userHandle') || undefined;
        const viewerHandle = searchParams.get('viewerHandle') || searchParams.get('currentUserHandle') || undefined;
        const bookmarkedBy = searchParams.get('bookmarkedBy') || undefined;
        const likedBy = searchParams.get('likedBy') || undefined;
        const sessionSeed = searchParams.get('sessionSeed') || undefined;

        userIdentifier = viewerHandle || sessionSeed || request.headers.get('x-forwarded-for') || requestId;
        assignedVariant = assignVariant(EXPERIMENT_ID, userIdentifier, 0.75);
        
        let recentlySeen: { id: string; seenAt: number }[] | undefined = undefined;
        const recentlySeenParam = searchParams.get('recentlySeen');
        if (recentlySeenParam) {
            try {
                recentlySeen = JSON.parse(recentlySeenParam);
            } catch (e) {}
        }
        
        const limitParam = searchParams.get('limit');
        const offsetParam = searchParams.get('offset');
        const limit = limitParam ? parseInt(limitParam, 10) : 10;
        const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

        const q = searchParams.get('q') || searchParams.get('search') || undefined;

        let videos: any[] = [];
        if (q) {
            const cleanQ = q.trim().replace(/^@/, '');
            const { data: rawVideos, error: videosError } = await supabaseAdmin
                .from('videos')
                .select(`
                    *,
                    author:app_users(name, handle, profile_image, is_live, live_url)
                `)
                .or(`description.ilike.%${cleanQ}%,user_handle.ilike.%${cleanQ}%`)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (videosError) throw videosError;

            videos = (rawVideos || []).map((v: any) => {
                const u = v.author || {};
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
                    music: v.music,
                    thumbnailUrl: v.thumbnail_url,
                    filterConfig: v.filter_config,
                    createdAt: v.created_at,
                    isMuted: v.is_muted,
                    userName: u.name || v.user_handle,
                    userImage: u.profile_image || null,
                    isLive: u.is_live || false,
                    liveUrl: u.live_url || null
                };
            });
        } else if (bookmarkedBy) {
            const { data: bookmarks, error: bookmarkError } = await supabaseAdmin
                .from('video_bookmarks')
                .select('video_id')
                .eq('user_handle', bookmarkedBy)
                .range(offset, offset + limit - 1);
            
            if (bookmarkError) throw bookmarkError;
            
            const bookmarkedIds = bookmarks?.map(b => b.video_id) || [];
            if (bookmarkedIds.length === 0) {
                videos = [];
            } else {
                // Single JOIN query — eliminates N+1 round-trips to app_users
                const { data: rawVideos, error: videosError } = await supabaseAdmin
                    .from('videos')
                    .select(`
                        *,
                        author:app_users!inner(name, handle, profile_image, is_live, live_url)
                    `)
                    .in('id', bookmarkedIds)
                    .order('created_at', { ascending: false });
                if (videosError) throw videosError;

                videos = (rawVideos || []).map((v: any) => {
                    const u = v.author || {};
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
                        music: v.music,
                        thumbnailUrl: v.thumbnail_url,
                        filterConfig: v.filter_config,
                        createdAt: v.created_at,
                        isMuted: v.is_muted,
                        userName: u.name || v.user_handle,
                        userImage: u.profile_image || null,
                        isLive: u.is_live || false,
                        liveUrl: u.live_url || null
                    };
                });
            }
        } else if (likedBy) {
            const { data: likes, error: likeError } = await supabaseAdmin
                .from('video_likes')
                .select('video_id')
                .eq('user_handle', likedBy)
                .range(offset, offset + limit - 1);
            
            if (likeError) throw likeError;
            
            const likedIds = likes?.map(l => l.video_id) || [];
            if (likedIds.length === 0) {
                videos = [];
            } else {
                // Single JOIN query — eliminates N+1 round-trips to app_users
                const { data: rawVideos, error: videosError } = await supabaseAdmin
                    .from('videos')
                    .select(`
                        *,
                        author:app_users!inner(name, handle, profile_image, is_live, live_url)
                    `)
                    .in('id', likedIds)
                    .order('created_at', { ascending: false });
                if (videosError) throw videosError;

                videos = (rawVideos || []).map((v: any) => {
                    const u = v.author || {};
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
                        music: v.music,
                        thumbnailUrl: v.thumbnail_url,
                        filterConfig: v.filter_config,
                        createdAt: v.created_at,
                        isMuted: v.is_muted,
                        userName: u.name || v.user_handle,
                        userImage: u.profile_image || null,
                        isLive: u.is_live || false,
                        liveUrl: u.live_url || null
                    };
                });
            }
        } else {
            const telemetryOut: any = {};
            videos = creatorHandle 
                ? await getVideosByUser(creatorHandle, viewerHandle, limit, offset) 
                : await getVideos(viewerHandle, limit, offset, sessionSeed, recentlySeen, telemetryOut);

            const totalLatency = Math.round(performance.now() - requestStart);
            await feedTelemetry.recordEventAsync({
                request_id: requestId,
                timestamp_utc: new Date().toISOString(),
                user_uuid: userIdentifier,
                experiment_id: EXPERIMENT_ID,
                variant: assignedVariant,
                total_latency_ms: totalLatency,
                q1_latency_ms: telemetryOut.q1 || 0,
                q2_latency_ms: telemetryOut.q2 || 0,
                q3_latency_ms: telemetryOut.q3 || 0,
                q4_latency_ms: null,
                q5_latency_ms: null,
                fallback_fired: false,
                status_code: 200,
                timeout: false,
                db_total_latency_ms: telemetryOut.dbTotal || 0,
                candidates_count: Array.isArray(videos) ? videos.length : 0
            });
        }

        const res = NextResponse.json(videos);
        res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return corsHeaders(res);
    } catch (error) {
        const totalLatency = Math.round(performance.now() - requestStart);
        await feedTelemetry.recordEventAsync({
            request_id: requestId,
            timestamp_utc: new Date().toISOString(),
            user_uuid: userIdentifier,
            experiment_id: EXPERIMENT_ID,
            variant: assignedVariant,
            total_latency_ms: totalLatency,
            q1_latency_ms: 0,
            q2_latency_ms: 0,
            q3_latency_ms: 0,
            q4_latency_ms: null,
            q5_latency_ms: null,
            fallback_fired: false,
            status_code: 500,
            timeout: totalLatency >= 3000
        });

        console.error("Error fetching videos:", error);
        await logSystemAlert('Videos', error);
        return corsHeaders(NextResponse.json({ error: "Internal Server Error" }, { status: 500 }));
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoUrl, user, description, transcription, music, thumbnailUrl, filterConfig, isMuted } = body;

        if (!videoUrl || !user) {
            return corsHeaders(NextResponse.json({ error: "Missing required fields" }, { status: 400 }));
        }

        // Enforce video upload limits based on follower count tiers
        const { count: videoCount, error: countError } = await supabaseAdmin
            .from('videos')
            .select('id', { count: 'exact', head: true })
            .eq('user_handle', user);

        if (countError) {
            console.error('[Upload Limit Check] Error counting existing videos:', countError);
        }

        const { data: userData, error: userQueryError } = await supabaseAdmin
            .from('app_users')
            .select('followers_count, fans')
            .eq('handle', user)
            .maybeSingle();

        if (userQueryError) {
            console.error('[Upload Limit Check] Error querying user stats:', userQueryError);
        }

        const followers = userData ? (userData.followers_count || userData.fans || 0) : 0;
        const currentCount = videoCount || 0;

        if (followers < 3000) {
            if (currentCount >= 50) {
                return corsHeaders(NextResponse.json({ 
                    error: "Tienes que tener más de 3.000 seguidores para subir más de 50 vídeos." 
                }, { status: 403 }));
            }
        } else if (followers < 5000) {
            if (currentCount >= 100) {
                return corsHeaders(NextResponse.json({ 
                    error: "Tienes que tener 5.000 seguidores para subir más de 100 vídeos." 
                }, { status: 403 }));
            }
        } else if (followers < 10000) {
            if (currentCount >= 150) {
                return corsHeaders(NextResponse.json({ 
                    error: "Tienes que tener 10.000 seguidores para subir más de 150 vídeos." 
                }, { status: 403 }));
            }
        }
        // Usuarios con 10.000 seguidores o más: sin límite de vídeos

        const newVideo: VideoPost = {
            id: uuidv4(),
            videoUrl,
            user,
            description: description || "",
            likes: 0,
            shares: 0,
            commentsCount: 0,
            views: 0,
            music: music || "",
            thumbnailUrl: thumbnailUrl || "",
            filterConfig: filterConfig || null,
            createdAt: new Date().toISOString(),
            isMuted: isMuted || false,
            is_processed: true
        };

        const savedVideo = await addVideo(newVideo);

        // Si llegamos aquí, el vídeo se guardó correctamente en la DB
        return corsHeaders(NextResponse.json({
            success: true,
            video: savedVideo
        }));

    } catch (error) {
        console.error("Error creating video post:", error);
        await logSystemAlert('Videos', error);
        return corsHeaders(NextResponse.json({
            success: false,
            error: 'No se pudo guardar el vídeo en el servidor.',
            details: (error as Error).message || "Internal Server Error"
        }, { status: 500 }));
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        let videoId = searchParams.get('id') || searchParams.get('videoId');
        let userHandle = searchParams.get('userHandle');

        // Fallback to JSON body if not in query params
        if (!videoId || !userHandle) {
            try {
                const body = await request.json();
                videoId = videoId || body.videoId || body.id;
                userHandle = userHandle || body.userHandle;
            } catch (e) {
                // No body or not JSON, continue with what we have
            }
        }

        if (!videoId || !userHandle) {
            return corsHeaders(NextResponse.json({ error: "Missing required fields: videoId and userHandle" }, { status: 400 }));
        }

        const success = await deleteVideo(videoId, userHandle);

        if (success) {
            return corsHeaders(NextResponse.json({ success: true, message: "Video deleted successfully" }));
        } else {
            return corsHeaders(NextResponse.json({ error: "Failed to delete video. Make sure you own the video." }, { status: 403 }));
        }
    } catch (error) {
        console.error("Error deleting video:", error);
        await logSystemAlert('Videos', error);
        return corsHeaders(NextResponse.json({ error: "Internal Server Error" }, { status: 500 }));
    }
}
