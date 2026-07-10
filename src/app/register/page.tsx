'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import styles from '../login/auth.module.css';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [honeypot, setHoneypot] = useState('');

    // Math Challenge State
    const [mathQuestion, setMathQuestion] = useState('');
    const [mathAnswer, setMathAnswer] = useState('');
    const [mathSolution, setMathSolution] = useState(0);
    const [registered, setRegistered] = useState(false); // Success state

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Geographic data states
    const [countries, setCountries] = useState<any[]>([]);
    const [regions, setRegions] = useState<any[]>([]);
    const [municipalities, setMunicipalities] = useState<any[]>([]);
    
    const [countryId, setCountryId] = useState('');
    const [regionId, setRegionId] = useState('');
    const [municipalityId, setMunicipalityId] = useState('');

    // Fetch geographic data
    useEffect(() => {
        fetch('/api/locations?type=countries')
            .then(res => res.json())
            .then(data => setCountries(Array.isArray(data) ? data : []))
            .catch(err => console.error("Error fetching countries:", err));
    }, []);

    useEffect(() => {
        if (countryId) {
            fetch(`/api/locations?type=regions&countryId=${countryId}`)
                .then(res => res.json())
                .then(data => {
                    setRegions(Array.isArray(data) ? data : []);
                    setRegionId('');
                    setMunicipalityId('');
                    setMunicipalities([]);
                })
                .catch(err => console.error("Error fetching regions:", err));
        } else {
            setRegions([]);
            setRegionId('');
            setMunicipalityId('');
            setMunicipalities([]);
        }
    }, [countryId]);

    useEffect(() => {
        if (regionId) {
            fetch(`/api/locations?type=municipalities&regionId=${regionId}`)
                .then(res => res.json())
                .then(data => {
                    setMunicipalities(Array.isArray(data) ? data : []);
                    setMunicipalityId('');
                })
                .catch(err => console.error("Error fetching municipalities:", err));
        } else {
            setMunicipalities([]);
            setMunicipalityId('');
        }
    }, [regionId]);

    // Generate Math Challenge on Load
    useState(() => {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        setMathQuestion(`${num1} + ${num2}`);
        setMathSolution(num1 + num2);
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Client-side Math Check (First Shield)
        if (parseInt(mathAnswer) !== mathSolution) {
            setError('La respuesta a la pregunta de seguridad es incorrecta.');
            setLoading(false);
            return;
        }

        if (!countryId || !regionId || !municipalityId) {
            setError('Debes seleccionar tu ubicación completa (País, Comunidad y Municipio).');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/voz/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'register',
                    username: name,
                    email,
                    password,
                    country_id: parseInt(countryId),
                    region_id: parseInt(regionId),
                    municipality_id: parseInt(municipalityId),
                    marketingConsent,
                    honeypot,
                    mathChallenge: {
                        answer: mathAnswer,
                        solution: mathSolution
                    }
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.message || 'Error al registrarse');
            }

            // Success: Show verification message
            setRegistered(true);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (registered) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.container}>
                    <h1 className={styles.title} style={{ color: '#10b981' }}>¡Registro Exitoso!</h1>
                    <p style={{ marginTop: '20px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                        Hemos enviado un correo de verificación a <strong>{email}</strong>.
                    </p>
                    <p style={{ marginBottom: '30px', color: '#6b7280' }}>
                        Por favor, revisa tu bandeja de entrada (y spam) y haz clic en el enlace para activar tu cuenta.
                    </p>
                    <Link href="/login" className={styles.button} style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
                        Ir a Iniciar Sesión
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <h1 className={styles.title}>Crear Cuenta</h1>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Nombre Completo</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className={styles.input}
                            placeholder="Ej. Juan Pérez"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={styles.input}
                            placeholder="tu@email.com"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={styles.input}
                            placeholder="********"
                            minLength={6}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>País</label>
                        <select
                            value={countryId}
                            onChange={(e) => setCountryId(e.target.value)}
                            required
                            className={styles.input}
                        >
                            <option value="">Selecciona un país</option>
                            {countries.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {regions.length > 0 && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Comunidad / Región</label>
                            <select
                                value={regionId}
                                onChange={(e) => setRegionId(e.target.value)}
                                required
                                className={styles.input}
                            >
                                <option value="">Selecciona una comunidad</option>
                                {regions.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {municipalities.length > 0 && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Municipio</label>
                            <select
                                value={municipalityId}
                                onChange={(e) => setMunicipalityId(e.target.value)}
                                required
                                className={styles.input}
                            >
                                <option value="">Selecciona un municipio</option>
                                {municipalities.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Math Challenge Shield */}
                    <div className={styles.formGroup} style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🛡️ Pregunta de Seguridad
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>
                                {mathQuestion} = ?
                            </span>
                            <input
                                type="number"
                                value={mathAnswer}
                                onChange={(e) => setMathAnswer(e.target.value)}
                                required
                                className={styles.input}
                                style={{ width: '80px', textAlign: 'center' }}
                                placeholder="Resp."
                            />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '5px' }}>
                            Resuelve la suma para verificar que eres humano.
                        </p>
                    </div>

                    <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            id="termsAccepted"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            style={{ width: 'auto', margin: 0 }}
                            required
                        />
                        <label htmlFor="termsAccepted" style={{ margin: 0, fontWeight: 'normal', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
                            Acepto los <Link href="/legal/terms" target="_blank" className={styles.link}>Términos y Condiciones</Link> y la <Link href="/legal/privacy" target="_blank" className={styles.link}>Política de Privacidad</Link>
                        </label>
                    </div>

                    <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            id="marketingConsent"
                            checked={marketingConsent}
                            onChange={(e) => setMarketingConsent(e.target.checked)}
                            style={{ width: 'auto', margin: 0 }}
                        />
                        <label htmlFor="marketingConsent" style={{ margin: 0, fontWeight: 'normal', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
                            Acepto recibir ofertas y novedades por correo electrónico (Opcional)
                        </label>
                    </div>

                    {/* Honeypot field - hidden from humans, filled by bots */}
                    <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
                        <label>Website</label>
                        <input
                            type="text"
                            name="website"
                            value={honeypot}
                            onChange={(e) => setHoneypot(e.target.value)}
                            tabIndex={-1}
                            autoComplete="off"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={styles.button} 
                        disabled={loading || !name || !email || !password || password.length < 6 || !countryId || !regionId || !municipalityId || !mathAnswer || !termsAccepted}
                    >
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>

                <div className={styles.footer}>
                    ¿Ya tienes cuenta? <Link href="/login" className={styles.link}>Inicia sesión</Link>
                </div>
            </div>
        </div>
    );
}
