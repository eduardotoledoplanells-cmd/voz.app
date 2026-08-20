import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/db';
import { redirect } from 'next/navigation';

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
                title: 'Vídeo en LYVO 🎙️',
                description: 'Mira este vídeo en la aplicación oficial de LYVO.'
            };
        }

        const creator = video.user_handle || 'un creador';
        const title = `Mira el vídeo de ${creator} en LYVO 🎙️`;
        const description = video.description
            ? `"${video.description}" — Escucha voces reales y participa en la comunidad.`
            : 'Escucha voces reales y participa en la comunidad de audio de LYVO.';
        const imageUrl = video.thumbnail_url || 'https://server-taupe-six.vercel.app/logo/logo.png';

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: [{ url: imageUrl, width: 600, height: 600, alt: 'LYVO App Preview' }],
                type: 'video.other',
                url: `https://lyvo.media/video/${id}`,
                siteName: 'LYVO App'
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
            title: 'Vídeo en LYVO 🎙️',
            description: 'Escucha este vídeo en la aplicación oficial de LYVO.'
        };
    }
}

export default async function SharedVideoPage({ params }: Props) {
    const { id } = await params;
    redirect(`/?authRequired=1&video=${encodeURIComponent(id)}`);
}
