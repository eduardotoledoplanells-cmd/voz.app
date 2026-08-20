import React from 'react';
import Link from 'next/link';

export default function LegalNoticePage() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0B0B12', color: '#F1F1F5', fontFamily: 'Inter, sans-serif', padding: '40px 20px 80px' }}>
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
                {/* Header Superior */}
                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', background: 'rgba(142, 45, 226, 0.15)', border: '1px solid rgba(142, 45, 226, 0.4)', color: '#C084FC', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
                        Información Legal • LSSI-CE
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 10px', background: 'linear-gradient(135deg, #FFFFFF 0%, #A855F7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Aviso Legal
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                        Última actualización: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} • Ley 34/2002 de Servicios de la Sociedad de la Información
                    </p>
                </div>

                <div style={{ backgroundColor: '#13131F', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '36px 32px', lineHeight: '1.75', fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)' }}>
                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            1. Datos Identificativos
                        </h2>
                        <p style={{ marginBottom: '12px' }}>
                            En cumplimiento de lo dispuesto en el artículo 10 de la <strong>Ley 34/2002 (LSSI-CE)</strong>, se facilitan los datos del prestador de servicios:
                        </p>
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '16px 20px', borderLeft: '4px solid #8E2DE2' }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                <li style={{ marginBottom: '6px' }}><strong>• Titular / Denominación:</strong> LYVO Media</li>
                                <li style={{ marginBottom: '6px' }}><strong>• N.I.F.:</strong> 43148082J</li>
                                <li style={{ marginBottom: '6px' }}><strong>• Domicilio:</strong> Calle del General Luque, 42, 07300 Inca, Palma de Mallorca (Illes Balears, España)</li>
                                <li style={{ marginBottom: '6px' }}><strong>• Email:</strong> <a href="mailto:lyvo@lyvo.media" style={{ color: '#C084FC', textDecoration: 'none' }}>lyvo@lyvo.media</a></li>
                                <li><strong>• Actividad Principal:</strong> Plataforma digital y red social audiovisual de vídeos cortos, notas de voz y programas de monetización para creadores de contenido.</li>
                            </ul>
                        </div>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            2. Propiedad Intelectual y Normas de Uso
                        </h2>
                        <p style={{ marginBottom: '12px' }}>
                            La marca, diseño gráfico, logotipos, arquitectura de software y código fuente de LYVO son propiedad exclusiva de LYVO Media.
                        </p>
                        <p style={{ marginBottom: '12px' }}>
                            El contenido multimedia subido por los usuarios (UGC) pertenece a sus respectivos autores, quienes otorgan a LYVO una licencia mundial no exclusiva para la visualización, distribución y recomendación algorítmica en la plataforma.
                        </p>
                    </section>

                    <section style={{ marginBottom: '10px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
                            3. Legislación y Fuero Legal
                        </h2>
                        <p>
                            Las presentes condiciones se rigen por la legislación española y el marco regulatorio comunitario de la Unión Europea (DSA y RGPD).
                        </p>
                    </section>
                </div>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Link href="/legal/terms" style={{ color: '#A855F7', textDecoration: 'none', marginRight: '20px', fontSize: '14px' }}>
                        Términos y Condiciones
                    </Link>
                    <Link href="/" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '14px' }}>
                        Volver a LYVO
                    </Link>
                </div>
            </div>
        </div>
    );
}
