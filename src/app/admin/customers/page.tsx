'use client';

import { useState, useEffect } from 'react';
import styles from './customers.module.css';

interface Customer {
    id: string;
    name: string;
    email: string;
    marketingConsent: boolean;
    registeredAt: string;
    orderCount: number;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/customers');
            const data = await res.json();
            setCustomers(data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setFeedback(null);

        try {
            const res = await fetch('/api/email/marketing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: emailSubject,
                    message: emailMessage
                })
            });

            const data = await res.json();

            if (res.ok) {
                setFeedback({ type: 'success', message: data.message });
                setEmailSubject('');
                setEmailMessage('');
            } else {
                setFeedback({ type: 'error', message: data.message });
            }
        } catch (error) {
            setFeedback({ type: 'error', message: 'Error al enviar emails' });
        } finally {
            setSending(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const consentedCustomers = customers.filter(c => c.marketingConsent).length;

    if (loading) {
        return <div className={styles.loading}>Cargando clientes...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>👥 Clientes Registrados</h1>
                <p className={styles.subtitle}>Gestión de clientes y envío de ofertas</p>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total Clientes</div>
                    <div className={styles.statValue}>{customers.length}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Con Consentimiento</div>
                    <div className={styles.statValue}>{consentedCustomers}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Sin Consentimiento</div>
                    <div className={styles.statValue}>{customers.length - consentedCustomers}</div>
                </div>
            </div>

            <div className={styles.mainGrid}>
                <div className={styles.tableContainer}>
                    <div className={styles.tableHeader}>
                        <h2 className={styles.tableTitle}>Lista de Clientes</h2>
                    </div>

                    {customers.length === 0 ? (
                        <div className={styles.noData}>
                            No hay clientes registrados todavía
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Registro</th>
                                    <th>Pedidos</th>
                                    <th>Marketing</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>{customer.name}</td>
                                        <td>{customer.email}</td>
                                        <td>{formatDate(customer.registeredAt)}</td>
                                        <td>{customer.orderCount}</td>
                                        <td>
                                            <span className={`${styles.consentBadge} ${customer.marketingConsent ? styles.consentYes : styles.consentNo}`}>
                                                {customer.marketingConsent ? '✓ Sí' : '✗ No'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className={styles.emailPanel}>
                    <h2 className={styles.emailTitle}>📧 Enviar Oferta Masiva</h2>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>
                        Se enviará solo a clientes con consentimiento ({consentedCustomers})
                    </p>

                    {feedback && (
                        <div className={feedback.type === 'success' ? styles.success : styles.error}>
                            {feedback.message}
                        </div>
                    )}

                    <form onSubmit={handleSendEmail} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Asunto</label>
                            <input
                                type="text"
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                required
                                className={styles.input}
                                placeholder="Ej. ¡Oferta especial del 20%!"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Mensaje</label>
                            <textarea
                                value={emailMessage}
                                onChange={(e) => setEmailMessage(e.target.value)}
                                required
                                className={styles.textarea}
                                placeholder="Escribe el contenido del email..."
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.sendButton}
                            disabled={sending || consentedCustomers === 0}
                        >
                            {sending ? 'Enviando...' : `Enviar a ${consentedCustomers} cliente(s)`}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
