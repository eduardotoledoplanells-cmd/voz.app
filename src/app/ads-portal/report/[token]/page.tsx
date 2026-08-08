import React from 'react';
import { createClient } from '@supabase/supabase-js';
import AnalyticsDashboard from '@/components/ads/AnalyticsDashboard';

// We do NOT use 'use client' here directly for the DB fetching part if we can avoid it, 
// or we make it a server component that fetches and passes to a client component.
// Since it's Next.js 13+ App Router, this is a Server Component by default.

export default async function MagicLinkReport({ params }: { params: { token: string } }) {
    const token = params.token;
    
    // Server-side validation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Check token
    const { data: linkData, error } = await supabase
        .from('ad_magic_links')
        .select('*, campaign:ad_campaigns(*)')
        .eq('token_id', token)
        .single();

    if (error || !linkData) {
        return (
            <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui' }}>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ color: '#d32f2f' }}>Enlace Inválido o Expirado</h1>
                    <p>Este enlace de reporte ya no es válido o no existe.</p>
                </div>
            </div>
        );
    }

    const isExpired = new Date(linkData.expires_at) < new Date();
    if (isExpired) {
        return (
            <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', fontFamily: 'system-ui' }}>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ color: '#d32f2f' }}>Enlace Expirado</h1>
                    <p>El periodo de validez para consultar este reporte ha terminado.</p>
                </div>
            </div>
        );
    }

    const campaign = linkData.campaign;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f4f5f7', fontFamily: 'system-ui, sans-serif' }}>
            <header style={{ padding: '20px 40px', backgroundColor: '#172b4d', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Reporte de Campaña: {campaign?.name || 'Desconocida'}</h1>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>
                    Válido hasta: {new Date(linkData.expires_at).toLocaleDateString()}
                </div>
            </header>

            <main style={{ padding: '40px', overflowY: 'auto' }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h2>Visión General de la Campaña</h2>
                    <p style={{ color: '#666' }}>ID de campaña: {campaign?.id}</p>
                    
                    <div style={{ marginTop: '20px' }}>
                        <AnalyticsDashboard 
                            campaigns={[campaign]} 
                            companies={[{ id: campaign?.advertiser_id || 'comp1', name: 'Campaña' }]} 
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
