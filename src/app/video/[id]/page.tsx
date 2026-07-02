import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/db';
import Link from 'next/link';

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
        const imageUrl = video.thumbnail_url || 'https://server-taupe-six.vercel.app/logo/logo.png'; // Fallback

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

    // Fetch video info to display context in the card
    const { data: video } = await supabaseAdmin
        .from('videos')
        .select('description, user_handle, views, likes, comments_count')
        .eq('id', id)
        .single();

    const creator = video?.user_handle || '@creador';
    const description = video?.description || 'Sin descripción';
    const likes = video?.likes || 0;
    const views = video?.views || 0;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            width: '100%',
            backgroundColor: '#0c0c0e',
            backgroundImage: 'radial-gradient(circle at top right, rgba(142, 45, 226, 0.15), transparent 400px), radial-gradient(circle at bottom left, rgba(74, 0, 224, 0.12), transparent 400px)',
            color: 'white',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <span style={{ fontSize: '36px', marginRight: '10px' }}>🎙️</span>
                <span style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    background: 'linear-gradient(to right, #8E2DE2, #4A00E0)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>VOZ</span>
            </div>

            {/* Central download prompt card */}
            <div style={{
                width: '100%',
                maxWidth: '480px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '24px',
                border: '1px border rgba(255, 255, 255, 0.08)',
                padding: '30px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '32px',
                    backgroundColor: 'rgba(255, 59, 48, 0.15)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    margin: '0 auto 20px auto'
                }}>
                    <span style={{ fontSize: '28px' }}>🔴</span>
                </div>

                <h1 style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    lineHeight: '28px',
                    marginBottom: '12px',
                    color: '#fff'
                }}>
                    Para ver este vídeo debes descargar la aplicación
                </h1>

                <p style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: '22px',
                    marginBottom: '25px'
                }}>
                    Los vídeos y comentarios de voz de nuestra comunidad están disponibles exclusivamente en la aplicación oficial de VOZ.
                </p>

                {/* Video Info Card */}
                {video && (
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: '16px',
                        padding: '16px',
                        marginBottom: '30px',
                        textAlign: 'left',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: 'rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#8E2DE2' }}>{creator}</span>
                            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                                👁️ {views} • ❤️ {likes}
                            </span>
                        </div>
                        <p style={{
                            fontSize: '13px',
                            color: '#e0e0e0',
                            lineHeight: '18px',
                            margin: 0,
                            fontStyle: 'italic',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                            &ldquo;{description}&rdquo;
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* TODO: Replace href with actual Google Play URL when the app is published */}
                    {/* Android Play Store (Coming Soon) */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: 'rgba(255, 255, 255, 0.4)',
                        borderRadius: '16px',
                        padding: '16px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'not-allowed',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: 'rgba(255, 255, 255, 0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        🤖 Google Play (Próximamente)
                    </div>

                    {/* TODO: Replace href with actual App Store URL when the app is published */}
                    {/* iOS App Store (Coming Soon) */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: 'rgba(255, 255, 255, 0.4)',
                        borderRadius: '16px',
                        padding: '16px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'not-allowed',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: 'rgba(255, 255, 255, 0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        🍏 App Store (Próximamente)
                    </div>
                </div>
            </div>

            {/* Footer terms */}
            <div style={{
                marginTop: '40px',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.3)',
                display: 'flex',
                gap: '15px'
            }}>
                <Link href="/legal/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Términos de servicio</Link>
                <span>•</span>
                <Link href="/legal/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidad</Link>
            </div>
        </div>
    );
}
