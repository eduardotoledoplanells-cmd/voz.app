import styles from './landing.module.css';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/db';
import WaitlistSection from './components/WaitlistSection';
import LandingAuthButton from './components/LandingAuthButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
    title: 'VOZ — Tu voz. Tu comunidad. Sin límites.',
    description: 'La app de audio y vídeo social donde tu voz importa. Crea, comparte y conecta con creadores de todo el mundo.',
    keywords: ['voz app', 'audio social', 'creadores', 'directos', 'kick', 'twitch', 'youtube', 'comunidad'],
    openGraph: {
        title: 'VOZ — Tu voz. Tu comunidad. Sin límites.',
        description: 'La app de audio y vídeo social donde tu voz importa.',
        images: [{ url: '/logo/logo-voz.png', width: 512, height: 512, alt: 'VOZ App' }],
        type: 'website',
        siteName: 'VOZ App',
        url: 'https://appvoz.com',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'VOZ App',
        description: 'La app de audio y vídeo social donde tu voz importa.',
        images: ['/logo/logo-voz.png'],
    },
    robots: { index: true, follow: true },
};

// ---- Real data from DB ----
async function getLandingData() {
    try {
        // Stats
        const [usersRes, videosRes, creatorsRes] = await Promise.all([
            supabaseAdmin.from('app_users').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            supabaseAdmin.from('videos').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('app_users').select('id', { count: 'exact', head: true }).eq('is_creator', true),
        ]);

        // Featured creators (active creators with a bio or profile image)
        const { data: creators } = await supabaseAdmin
            .from('app_users')
            .select('id, handle, name, bio, profile_image, profile_color, is_live')
            .eq('is_creator', true)
            .eq('status', 'active')
            .not('profile_image', 'is', null)
            .order('created_at', { ascending: false })
            .limit(8);

        return {
            stats: {
                users: usersRes.count || 0,
                videos: videosRes.count || 0,
                creators: creatorsRes.count || 0,
            },
            creators: creators || []
        };
    } catch (e) {
        return { stats: { users: 0, videos: 0, creators: 0 }, creators: [] };
    }
}

const features = [
    {
        emoji: '🎙️',
        name: 'Vídeos y Audio de Voz',
        desc: 'Crea contenido de audio y vídeo corto auténtico. Tu voz, tus historias. Sin filtros artificiales ni algoritmos que te censuren.',
        tag: '🔥 Núcleo de la app',
        large: true,
    },
    {
        emoji: '🎁',
        name: 'Economía de Creadores',
        desc: 'Recibe regalos virtuales y donaciones directas de tu comunidad. Monetiza tu voz desde el primer día.',
        tag: '💰 Monetización real',
        large: false,
    },
    {
        emoji: '📡',
        name: 'Tus Directos, Centralizados',
        desc: 'Conecta tus canales de Kick, Twitch y YouTube. Tus seguidores verán tu directo en tiempo real desde VOZ con un solo toque.',
        tag: '🔴 Streaming integrado',
        large: false,
    },
    {
        emoji: '🌍',
        name: 'Comunidad Global con Filtros',
        desc: 'Encuentra creadores y contenido de tu país, ciudad o idioma. Publicidad inteligente segmentada para que siempre veas lo que te interesa.',
        tag: '🎯 Segmentación real',
        large: true,
    },
];

const steps = [
    {
        n: '01',
        title: 'Descarga la App',
        desc: 'Disponible próximamente en Google Play y App Store de forma gratuita. Regístrate en 30 segundos.',
    },
    {
        n: '02',
        title: 'Crea tu Perfil de Voz',
        desc: 'Personaliza tu perfil, conecta tus plataformas de streaming y empieza a explorar el feed de contenido.',
    },
    {
        n: '03',
        title: 'Haz Crecer tu Comunidad',
        desc: 'Publica contenido, recibe regalos de tus fans, activa directos y crece como creador de voz.',
    },
];

export default async function LandingPage() {
    // Si queremos que la raíz sea el feed por defecto, redireccionamos.
    redirect('/feed');

    // Si queremos que la raíz sea el feed por defecto, redireccionamos.
    redirect('/feed');

    // Si queremos que la raíz sea el feed por defecto, redireccionamos.
    redirect('/feed');

    // Si queremos que la raíz sea el feed por defecto, redireccionamos.
    redirect('/feed');

    // Si queremos que la raíz sea el feed por defecto, redireccionamos.
    // redirect('/feed');

    const { stats, creators } = await getLandingData();
    const year = new Date().getFullYear();

    // Format numbers nicely
    const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K+` : `${n}+`;

    const tickerItems = [
        { label: 'Usuarios activos', value: fmt(stats.users) },
        { label: 'Vídeos publicados', value: fmt(stats.videos) },
        { label: 'Creadores de voz', value: fmt(stats.creators) },
        { label: 'Plataformas integradas', value: '3' },
        { label: 'Donaciones entre usuarios', value: '✅' },
        { label: 'Directos en tiempo real', value: '🔴' },
    ];

    return (
        <div className={styles.page}>

            {/* ════════════════════════════════
                NAVBAR
            ════════════════════════════════ */}
            <nav className={styles.navbar}>
                <Link href="/" className={styles.navLogo}>
                    <img src="/logo/logo-short.png" alt="VOZ" className={styles.navLogoImg} />
                </Link>
                <ul className={styles.navLinks}>
                    <li><a href="#features" className={styles.navLink}>Características</a></li>
                    <li><a href="#creators" className={styles.navLink}>Creadores</a></li>
                    <li><a href="#how" className={styles.navLink}>Cómo funciona</a></li>
                    <li><Link href="/legal/terms" className={styles.navLink}>Legal</Link></li>
                </ul>
                <div className={styles.navRight}>
                    <Link href="/login" className={styles.navBtnOutline}>Iniciar sesión</Link>
                    <a href="#waitlist" className={styles.navBtnPrimary}>Unirme a la lista</a>
                </div>
            </nav>

            {/* ════════════════════════════════
                HERO
            ════════════════════════════════ */}
            <section className={styles.hero}>
                <div className={styles.heroBg}>
                    <div className={`${styles.heroBgOrb} ${styles.heroOrb1}`} />
                    <div className={`${styles.heroBgOrb} ${styles.heroOrb2}`} />
                    <div className={`${styles.heroBgOrb} ${styles.heroOrb3}`} />
                </div>

                <div className={styles.heroGrid}>
                    {/* Left */}
                    <div className={styles.heroLeft}>
                        <div className={styles.heroPill}>
                            <span className={styles.heroPillDot} />
                            Próximamente en las tiendas
                        </div>

                        <h1 className={styles.heroTitle}>
                            Tu voz.<br />
                            Tu{' '}
                            <span className={styles.heroTitleGradient}>comunidad.</span>
                            <br />Sin límites.
                        </h1>

                        <p className={styles.heroDesc}>
                            La plataforma de audio y vídeo social donde los creadores
                            conectan con sus comunidades de una manera auténtica, directa y sin barreras.
                        </p>

                        <LandingAuthButton />

                        {/* Waitlist form (client component) */}
                        <div id="waitlist-hero" style={{ marginTop: '30px', display: 'none' }}>
                            <WaitlistSection />
                        </div>

                        {/* Store buttons (disabled, coming soon) */}
                        <div className={styles.storeButtons}>
                            <div className={styles.storeBtn}>
                                <span className={styles.storeBtnIcon}>🤖</span>
                                <div className={styles.storeBtnText}>
                                    <span className={styles.storeBtnSub}>Próximamente en</span>
                                    <span className={styles.storeBtnMain}>Google Play</span>
                                </div>
                            </div>
                            <div className={styles.storeBtn}>
                                <span className={styles.storeBtnIcon}>🍏</span>
                                <div className={styles.storeBtnText}>
                                    <span className={styles.storeBtnSub}>Próximamente en</span>
                                    <span className={styles.storeBtnMain}>App Store</span>
                                </div>
                            </div>
                        </div>

                        {/* Social proof */}
                        {stats.users > 0 && (
                            <div className={styles.heroSocialProof}>
                                <div className={styles.heroAvatars}>
                                    {['🎙️', '🎵', '🔥', '⭐'].map((e, i) => (
                                        <div key={i} className={styles.heroAvatar}>{e}</div>
                                    ))}
                                </div>
                                <p className={styles.heroSocialText}>
                                    <strong>{fmt(stats.users)}</strong> personas ya forman parte de la comunidad VOZ
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right: Mockup */}
                    <div className={styles.heroRight}>
                        <div className={styles.mockupContainer}>
                            <div className={styles.mockupGlow} />
                            <img
                                src="/images/app-mockup.png"
                                alt="Vista previa de la app VOZ"
                                className={styles.mockupImg}
                            />
                            {/* Floating Live Card */}
                            <div className={`${styles.mockupCard} ${styles.mockupCardLive}`}>
                                <span className={styles.mockupCardLiveDot} />
                                <span className={styles.mockupCardLiveText}>🔴 EN DIRECTO</span>
                            </div>
                            {/* Floating Gift Card */}
                            <div className={`${styles.mockupCard} ${styles.mockupCardGift}`}>
                                <div className={styles.mockupCardGiftText}>🎁 +250 VOZ Coins</div>
                                <div className={styles.mockupCardGiftSub}>De @fan_increíble</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════
                LIVE STATS TICKER
            ════════════════════════════════ */}
            <div className={styles.statsBar}>
                <div className={styles.statsTicker}>
                    {/* Duplicated for infinite scroll */}
                    {[...tickerItems, ...tickerItems].map((item, i) => (
                        <span key={i} className={styles.statsTickerItem}>
                            <span className={styles.statsTickerValue}>{item.value}</span>
                            {item.label}
                            {i % tickerItems.length !== tickerItems.length - 1 && (
                                <span className={styles.statsTickerDivider} />
                            )}
                        </span>
                    ))}
                </div>
            </div>

            {/* ════════════════════════════════
                FEATURES
            ════════════════════════════════ */}
            <section id="features" className={styles.section}>
                <div className={styles.sectionInner}>
                    <p className={styles.sectionLabel}>✦ Características</p>
                    <h2 className={styles.sectionTitle}>Todo lo que necesitas en un solo lugar</h2>
                    <p className={styles.sectionSubtitle}>
                        VOZ está construida para los creadores. Sin complicaciones, sin barreras. 
                        Solo tú, tu voz y tu comunidad.
                    </p>

                    {/* Row 1: Large + Small */}
                    <div className={styles.featureAlt}>
                        <div className={styles.featureCardLarge}>
                            <div className={styles.featureEmoji}>{features[0].emoji}</div>
                            <h3 className={styles.featureName}>{features[0].name}</h3>
                            <p className={styles.featureDesc}>{features[0].desc}</p>
                            <span className={styles.featureTag}>{features[0].tag}</span>
                        </div>
                        <div className={styles.featureCardSmall}>
                            <div className={styles.featureEmoji}>{features[1].emoji}</div>
                            <h3 className={styles.featureName}>{features[1].name}</h3>
                            <p className={styles.featureDesc}>{features[1].desc}</p>
                            <span className={styles.featureTag}>{features[1].tag}</span>
                        </div>
                    </div>

                    {/* Row 2: Small + Large */}
                    <div className={`${styles.featureAlt} ${styles.reversed}`}>
                        <div className={styles.featureCardLarge}>
                            <div className={styles.featureEmoji}>{features[3].emoji}</div>
                            <h3 className={styles.featureName}>{features[3].name}</h3>
                            <p className={styles.featureDesc}>{features[3].desc}</p>
                            <span className={styles.featureTag}>{features[3].tag}</span>
                        </div>
                        <div className={styles.featureCardSmall}>
                            <div className={styles.featureEmoji}>{features[2].emoji}</div>
                            <h3 className={styles.featureName}>{features[2].name}</h3>
                            <p className={styles.featureDesc}>{features[2].desc}</p>
                            <span className={styles.featureTag}>{features[2].tag}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════
                CREATORS (real from DB)
            ════════════════════════════════ */}
            {creators.length > 0 && (
                <section id="creators" className={`${styles.section} ${styles.creatorsSection}`}>
                    <div className={styles.sectionInner}>
                        <p className={styles.sectionLabel}>✦ Comunidad</p>
                        <h2 className={styles.sectionTitle}>Conoce a nuestros creadores</h2>
                        <p className={styles.sectionSubtitle}>
                            Personas reales con voces reales. Estas son algunas de las voces que ya forman parte de VOZ.
                        </p>
                        <div className={styles.creatorsGrid}>
                            {creators.slice(0, 8).map((c: any) => (
                                <div key={c.id} className={styles.creatorCard}>
                                    <div className={styles.creatorAvatar}>
                                        {c.profile_image ? (
                                            <img
                                                src={c.profile_image}
                                                alt={c.handle}
                                                className={styles.creatorAvatarImg}
                                            />
                                        ) : (
                                            <span>🎙️</span>
                                        )}
                                    </div>
                                    <div className={styles.creatorHandle}>{c.handle}</div>
                                    <div className={styles.creatorBio}>
                                        {c.bio || 'Creador de VOZ'}
                                    </div>
                                    {c.is_live && (
                                        <div className={styles.creatorLiveBadge}>
                                            <span className={styles.creatorLiveDot} />
                                            En directo ahora
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ════════════════════════════════
                HOW IT WORKS
            ════════════════════════════════ */}
            <section id="how" className={styles.section}>
                <div className={styles.sectionInner}>
                    <p className={styles.sectionLabel}>✦ Cómo funciona</p>
                    <h2 className={styles.sectionTitle}>Empieza en tres pasos</h2>
                    <p className={styles.sectionSubtitle}>
                        Crear y compartir contenido de voz nunca había sido tan sencillo.
                    </p>
                    <div className={styles.stepsRow}>
                        {steps.map((s) => (
                            <div key={s.n} className={styles.stepCard}>
                                <div className={styles.stepNum}>{s.n}</div>
                                <h3 className={styles.stepTitle}>{s.title}</h3>
                                <p className={styles.stepDesc}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════
                CTA + WAITLIST
            ════════════════════════════════ */}
            <section id="waitlist" className={styles.ctaSection}>
                <div className={styles.ctaBg} />
                <p className={styles.sectionLabel} style={{ justifyContent: 'center' }}>✦ Únete</p>
                <h2 className={styles.ctaTitle}>
                    ¿Listo para<br />hacer oír tu voz?
                </h2>
                <p className={styles.ctaSubtitle}>
                    Apúntate a la lista de espera. Serás de los primeros en recibir acceso cuando lancemos en las tiendas.
                </p>
                <WaitlistSection ctaMode={true} />
            </section>

            {/* ════════════════════════════════
                FOOTER
            ════════════════════════════════ */}
            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <div className={styles.footerTop}>
                        <div>
                            <img src="/logo/logo-short.png" alt="VOZ" className={styles.footerBrandLogo} />
                            <p className={styles.footerBrandDesc}>
                                La plataforma de audio y vídeo social donde los creadores conectan con 
                                sus comunidades de una manera completamente nueva.
                            </p>
                        </div>
                        <div>
                            <h4 className={styles.footerColTitle}>Producto</h4>
                            <ul className={styles.footerLinks}>
                                <li><a href="#features">Características</a></li>
                                <li><a href="#creators">Creadores</a></li>
                                <li><a href="#how">Cómo funciona</a></li>
                                <li><a href="#waitlist">Unirme</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className={styles.footerColTitle}>Legal</h4>
                            <ul className={styles.footerLinks}>
                                <li><Link href="/legal/terms">Términos de servicio</Link></li>
                                <li><Link href="/legal/privacy">Política de privacidad</Link></li>
                                <li><Link href="/legal/cookies">Cookies</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className={styles.footerColTitle}>App</h4>
                            <ul className={styles.footerLinks}>
                                <li><a href="#" style={{ opacity: 0.4, cursor: 'not-allowed' }}>Google Play (Próx.)</a></li>
                                <li><a href="#" style={{ opacity: 0.4, cursor: 'not-allowed' }}>App Store (Próx.)</a></li>
                                <li><Link href="/login">Panel de acceso</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className={styles.footerBottom}>
                        <span className={styles.footerCopyright}>© {year} VOZ App. Todos los derechos reservados.</span>
                        <span className={styles.footerMade}>Hecho con 🎙️ para creadores de todo el mundo</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
