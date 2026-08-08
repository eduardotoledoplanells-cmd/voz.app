'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AnalyticsDashboard from '@/components/ads/AnalyticsDashboard';

export default function AdsPortalDashboard() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [companyId, setCompanyId] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { supabaseBrowser } = await import('@/lib/supabaseBrowser');
            const { data: { session } } = await supabaseBrowser.auth.getSession();
            
            if (!session) {
                router.push('/ads-portal/login');
                return;
            }

            const role = session.user.user_metadata?.role;
            if (role !== 'Advertiser') {
                await supabaseBrowser.auth.signOut();
                router.push('/ads-portal/login');
                return;
            }

            setCompanyId(session.user.user_metadata?.companyId || null);
            setIsAuthenticated(true);
            setLoading(false);
        };

        checkAuth();
    }, [router]);

    const handleLogout = async () => {
        const { supabaseBrowser } = await import('@/lib/supabaseBrowser');
        await supabaseBrowser.auth.signOut();
        router.push('/ads-portal/login');
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando sesión...</div>;
    }

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f4f5f7', fontFamily: 'system-ui, sans-serif' }}>
            <header style={{ padding: '20px 40px', backgroundColor: '#172b4d', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Lyvo Ads Portal</h1>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <span>Hola, Anunciante</span>
                    <button 
                        onClick={handleLogout}
                        style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            <main style={{ padding: '40px', overflowY: 'auto' }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h2>Bienvenido al panel de tu campaña</h2>
                    <p style={{ color: '#666' }}>Aquí aparecerán tus métricas (Impresiones, Clics, Retención, etc.) limitadas solo a tus campañas.</p>
                    
                    <div style={{ marginTop: '20px' }}>
                        {/* 
                            In the future, we will fetch campaigns where companyId === session companyId
                            For now, we still show the dummy data or we could fetch real data if available.
                        */}
                        <AnalyticsDashboard 
                            campaigns={[{ id: 'camp1', name: 'Campaña Default', companyId: companyId || 'comp1', impressions: 250000, budget: 1500 }]} 
                            companies={[{ id: companyId || 'comp1', name: 'Mi Empresa' }]} 
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
