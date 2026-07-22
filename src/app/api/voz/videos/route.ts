import { NextRequest, NextResponse } from "next/server";
import { getVideos, getVideosByUser, addVideo, deleteVideo, VideoPost, supabaseAdmin } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { logSystemAlert } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

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
    try {
        const { searchParams } = new URL(request.url);
        const userHandle = searchParams.get('userHandle') || undefined;
        const bookmarkedBy = searchParams.get('bookmarkedBy') || undefined;
        const likedBy = searchParams.get('likedBy') || undefined;
        
        const limitParam = searchParams.get('limit');
        const offsetParam = searchParams.get('offset');
        const limit = limitParam ? parseInt(limitParam, 10) : 10;
        const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

        let videos: any[] = [];
        if (bookmarkedBy) {
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
                const { data: rawVideos, error: videosError } = await supabaseAdmin
                    .from('videos')
                    .select('*')
                    .in('id', bookmarkedIds);
                if (videosError) throw videosError;

                const handles = [...new Set((rawVideos || []).map(v => v.user_handle))];
                const { data: users } = await supabaseAdmin
                    .from('app_users')
                    .select('name, handle, profile_image, is_live, live_url')
                    .in('handle', handles);

                const usersMap = new Map((users || []).map(u => [u.handle, u]));

                videos = (rawVideos || []).map(v => {
                    const u: any = usersMap.get(v.user_handle) || {};
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
                const { data: rawVideos, error: videosError } = await supabaseAdmin
                    .from('videos')
                    .select('*')
                    .in('id', likedIds);
                if (videosError) throw videosError;

                const handles = [...new Set((rawVideos || []).map(v => v.user_handle))];
                const { data: users } = await supabaseAdmin
                    .from('app_users')
                    .select('name, handle, profile_image, is_live, live_url')
                    .in('handle', handles);

                const usersMap = new Map((users || []).map(u => [u.handle, u]));

                videos = (rawVideos || []).map(v => {
                    const u: any = usersMap.get(v.user_handle) || {};
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
            videos = userHandle 
                ? await getVideosByUser(userHandle, undefined, limit, offset) 
                : await getVideos(undefined, limit, offset);
        }
        return corsHeaders(NextResponse.json(videos));
    } catch (error) {
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
        } else {
            if (currentCount >= 250) {
                return corsHeaders(NextResponse.json({ 
                    error: "Has alcanzado el límite máximo de 250 vídeos en tu cuenta." 
                }, { status: 403 }));
            }
        }

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
