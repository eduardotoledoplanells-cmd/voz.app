import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/db';
import Link from 'next/link';
import { TopBarDownload, BottomDownload } from './VideoAuthWrappers';

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ id: string }>;
}

// Generate dynamic SEO metadata for WhatsApp, Telegram, etc.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    try {
        const { data: video } = await supabaseAdmin
            .from('videos')
            .select('description, user_handle, thumbnail_url')
            .eq('id', id)
            .single();

        if (!video) {
            return {
                title: 'Vídeo en VOZ 🎙️',
                description: 'Mira este vídeo en la aplicación oficial de VOZ.'
            };
        }

        const creator = video.user_handle || 'un creador';
        const title = `Mira el vídeo de ${creator} en VOZ 🎙️`;
        const description = video.description
            ? `"${video.description}" — Escucha voces reales y participa en la comunidad.`
            : 'Escucha voces reales y participa en la comunidad de audio de VOZ.';
        const imageUrl = video.thumbnail_url || 'https://server-taupe-six.vercel.app/logo/logo.png';

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: [{ url: imageUrl, width: 600, height: 600, alt: 'VOZ App Preview' }],
                type: 'video.other',
                url: `https://server-taupe-six.vercel.app/video/${id}`,
                siteName: 'VOZ App'
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [imageUrl]
            }
        };
    } catch (e) {
        return {
            title: 'Vídeo en VOZ 🎙️',
            description: 'Escucha este vídeo en la aplicación oficial de VOZ.'
        };
    }
}

export default async function SharedVideoPage({ params }: Props) {
    const { id } = await params;

    const { data: video } = await supabaseAdmin
        .from('videos')
        .select('description, user_handle, views, likes, comments_count, video_url, thumbnail_url')
        .eq('id', id)
        .single();

    const creator = video?.user_handle || '@creador';
    const description = video?.description || 'Sin descripción';
    const likes = video?.likes || 0;
    const views = video?.views || 0;
    const accentColor = '#8E2DE2';

    return (
        <div style={{
            minHeight: '100dvh',
            width: '100%',
            backgroundColor: '#080810',
            color: 'white',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            overflowX: 'hidden',
        }}>
            {/* Top bar */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                height: '56px',
                background: 'rgba(8,8,16,0.9)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
                <Link href="/feed" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo/logo-white.png" alt="VOZ" style={{ height: '28px', objectFit: 'contain' }} />
                </Link>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Vídeo compartido</span>
                <TopBarDownload accentColor={accentColor} />
            </div>

            {/* Main content */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0',
                maxWidth: '600px',
                margin: '0 auto',
            }}>
                {/* VIDEO PLAYER */}
                {video?.video_url ? (
                    <div style={{
                        width: '100%',
                        backgroundColor: '#000',
                        position: 'relative',
                    }}>
                        <video
                            src={video.video_url}
                            poster={video.thumbnail_url || undefined}
                            controls
                            autoPlay
                            playsInline
                            style={{
                                width: '100%',
                                maxHeight: '80dvh',
                                display: 'block',
                                objectFit: 'contain',
                                backgroundColor: '#000',
                            }}
                        />
                    </div>
                ) : (
                    <div style={{
                        width: '100%',
                        height: '300px',
                        backgroundColor: accentColor,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '12px',
                    }}>
                        <span style={{ fontSize: '64px' }}>🎙️</span>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>Sólo disponible en la app</p>
                    </div>
                )}

                {/* Info section */}
                <div style={{ width: '100%', padding: '16px 16px 24px', boxSizing: 'border-box' }}>
                    {/* Creator + Stats */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <Link href={`/feed`} style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: accentColor,
                            textDecoration: 'none',
                        }}>
                            {creator}
                        </Link>
                        <div style={{ display: 'flex', gap: '14px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                            <span>👁️ {views.toLocaleString()}</span>
                            <span>❤️ {likes.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Description */}
                    <p style={{
                        fontSize: '14px',
                        color: 'rgba(255,255,255,0.75)',
                        lineHeight: '1.6',
                        margin: '0 0 20px',
                    }}>
                        {description}
                    </p>

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: '20px' }} />

                    {/* CTA: Download app */}
                    <BottomDownload accentColor={accentColor} />

                    {/* Footer terms */}
                    <div style={{
                        marginTop: '32px',
                        paddingTop: '16px',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.25)',
                        display: 'flex',
                        gap: '15px',
                        justifyContent: 'center',
                    }}>
                        <Link href="/legal/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Términos de servicio</Link>
                        <span>•</span>
                        <Link href="/legal/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidad</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
