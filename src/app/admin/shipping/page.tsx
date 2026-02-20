'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { Order } from '@/types';
import styles from '../admin.module.css';
import { downloadInvoice } from '@/lib/invoice-generator';

export default function ShippingManagementPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>({});
    const [invoiceRequested, setInvoiceRequested] = useState<Record<string, boolean>>({});
    const [pendingStatuses, setPendingStatuses] = useState<Record<string, Order['status']>>({});
    const [pendingStatusChange, setPendingStatusChange] = useState<{
        orderId: string;
        newStatus: Order['status'];
    } | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        try {
            const response = await fetch('/api/orders');
            const data = await response.json();
            setOrders(data);

            // Initialize tracking numbers
            const tracking: Record<string, string> = {};
            data.forEach((order: Order) => {
                if (order.trackingNumber) {
                    tracking[order.id] = order.trackingNumber;
                }
            });
            setTrackingNumbers(tracking);

            // Initialize invoice requested flags
            const invoices: Record<string, boolean> = {};
            data.forEach((order: Order) => {
                invoices[order.id] = order.invoiceRequested || false;
            });
            setInvoiceRequested(invoices);
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleStatusChange(orderId: string, newStatus: Order['status']) {
        const currentOrder = orders.find(o => o.id === orderId);

        // Si cambia a "enviado" y viene de "procesando", mostrar modal de confirmación
        if (newStatus === 'shipped' && currentOrder?.status === 'processing') {
            setPendingStatusChange({ orderId, newStatus });
            setShowConfirmModal(true);
        } else {
            // Para otros cambios, actualizar directamente
            updateOrderStatus(orderId, newStatus);
        }
    }

    async function confirmShipment() {
        if (!pendingStatusChange) return;

        const { orderId, newStatus } = pendingStatusChange;
        await updateOrderStatus(orderId, newStatus);

        setShowConfirmModal(false);
        setPendingStatusChange(null);
    }

    function cancelShipment() {
        setShowConfirmModal(false);
        setPendingStatusChange(null);
        // Recargar para resetear el select
        loadOrders();
    }

    async function updateOrderStatus(orderId: string, newStatus: Order['status']) {
        try {
            const trackingNumber = trackingNumbers[orderId];
            const order = orders.find(o => o.id === orderId);

            // Validar que haya número de seguimiento si se marca como enviado
            if (newStatus === 'shipped' && !trackingNumber) {
                alert('Por favor, introduce un número de seguimiento antes de marcar como enviado.');
                loadOrders(); // Recargar para resetear el select
                return;
            }

            const response = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: orderId,
                    status: newStatus,
                    trackingNumber
                })
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el pedido');
            }

            // Si se marca como enviado, enviar email al cliente
            if (newStatus === 'shipped' && trackingNumber && order) {
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: order.customerEmail,
                        subject: `Tu pedido ${order.orderNumber} ha sido enviado`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #e60000;">¡Tu pedido ha sido enviado!</h2>
                                <p>Hola ${order.customerName},</p>
                                <p>Te informamos que tu pedido <strong>${order.orderNumber}</strong> ha sido enviado.</p>
                                
                                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                    <h3 style="margin-top: 0;">Información de envío</h3>
                                    <p><strong>Compañía de envío:</strong> ${order.shippingCompany}</p>
                                    <p><strong>Número de seguimiento:</strong> <span style="color: #e60000; font-size: 1.1em;">${trackingNumber}</span></p>
                                </div>

                                <p>Puedes usar este número de seguimiento para rastrear tu paquete en la web de ${order.shippingCompany}.</p>
                                
                                <p>Gracias por tu compra.</p>
                                <p style="color: #666; font-size: 0.9em;">Equipo de RevoluxBit</p>
                            </div>
                        `
                    })
                });

                alert(`✅ Pedido marcado como enviado.\n\n📧 Se ha enviado un email a ${order.customerEmail} con:\n- Número de seguimiento: ${trackingNumber}\n- Compañía de envío: ${order.shippingCompany}`);
            }

            loadOrders();
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Error al actualizar el pedido. Por favor, inténtalo de nuevo.');
            loadOrders();
        }
    }

    function updateTrackingNumber(orderId: string, value: string) {
        setTrackingNumbers(prev => ({
            ...prev,
            [orderId]: value
        }));
    }

    const getStatusClass = (status: Order['status']) => {
        const classes = {
            pending: styles.statusPending,
            processing: styles.statusProcessing,
            shipped: styles.statusShipped,
            delivered: styles.statusDelivered,
            cancelled: styles.statusCancelled
        };
        return classes[status] || styles.statusPending;
    };

    const getStatusText = (status: Order['status']) => {
        const texts = {
            pending: 'Pendiente',
            processing: 'Procesando',
            shipped: 'Enviado',
            delivered: 'Entregado',
            cancelled: 'Cancelado'
        };
        return texts[status];
    };

    if (loading) {
        return <div className={styles.container}><div className={styles.main}>Cargando pedidos...</div></div>;
    }

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Gestión de Envíos</h1>
            </div>

            <div className={styles.card}>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th>
                                <th>Nº Pedido</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Dirección</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Factura</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                        No hay pedidos todavía
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <Fragment key={order.id}>
                                        <tr className={styles.tableRow}>
                                            <td>
                                                <button
                                                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                                    className={styles.iconButton}
                                                >
                                                    {expandedOrder === order.id ? '▼' : '▶'}
                                                </button>
                                            </td>
                                            <td style={{ fontWeight: '500' }}>{order.orderNumber}</td>
                                            <td style={{ color: '#666' }}>
                                                {new Date(order.date).toLocaleDateString('es-ES')}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '500' }}>{order.customerName}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#666' }}>{order.customerEmail}</div>
                                            </td>
                                            <td style={{ fontSize: '0.9rem', color: '#666', maxWidth: '200px' }}>
                                                {order.shippingAddress.address}, {order.shippingAddress.city} {order.shippingAddress.postalCode}
                                            </td>
                                            <td style={{ fontWeight: '600' }}>€{order.total.toFixed(2)}</td>
                                            <td>
                                                <span className={`${styles.badge} ${getStatusClass(order.status)}`}>
                                                    {getStatusText(order.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actionGroup} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={invoiceRequested[order.id] || false}
                                                            onChange={async (e) => {
                                                                const checked = e.target.checked;
                                                                setInvoiceRequested(prev => ({ ...prev, [order.id]: checked }));
                                                                // Update in database
                                                                await fetch('/api/orders', {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ id: order.id, invoiceRequested: checked })
                                                                });
                                                            }}
                                                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                        />
                                                        <span style={{ fontSize: '0.9rem' }}>Solicitada</span>
                                                    </label>
                                                    {invoiceRequested[order.id] && (
                                                        <button
                                                            onClick={() => downloadInvoice(order)}
                                                            className={`${styles.btn} ${styles.btnPrimary}`}
                                                            style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                                                        >
                                                            📄 PDF
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className={styles.actionGroup}>
                                                    <select
                                                        value={pendingStatuses[order.id] || order.status}
                                                        onChange={(e) => {
                                                            const newStatus = e.target.value as Order['status'];
                                                            setPendingStatuses(prev => ({
                                                                ...prev,
                                                                [order.id]: newStatus
                                                            }));
                                                        }}
                                                        className={styles.select}
                                                    >
                                                        <option value="pending">Pendiente</option>
                                                        <option value="processing">Procesando</option>
                                                        <option value="shipped">Enviado</option>
                                                        <option value="delivered">Entregado</option>
                                                        <option value="cancelled">Cancelado</option>
                                                    </select>
                                                    <button
                                                        onClick={() => {
                                                            const newStatus = pendingStatuses[order.id] || order.status;
                                                            handleStatusChange(order.id, newStatus);
                                                        }}
                                                        className={styles.iconButton}
                                                        title="Guardar estado"
                                                        style={{ color: order.status === 'shipped' ? '#4caf50' : '#666' }}
                                                    >
                                                        💾
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedOrder === order.id && (
                                            <tr className={styles.expandedRow}>
                                                <td colSpan={9}>
                                                    <div className={styles.orderDetails}>
                                                        <div className={styles.detailSection}>
                                                            <h3>Artículos del Pedido</h3>
                                                            <div className={styles.infoCard}>
                                                                <table className={styles.table} style={{ fontSize: '0.9rem' }}>
                                                                    <thead>
                                                                        <tr>
                                                                            <th style={{ padding: '8px' }}>Producto</th>
                                                                            <th style={{ padding: '8px', textAlign: 'center' }}>Cant.</th>
                                                                            <th style={{ padding: '8px', textAlign: 'right' }}>Precio</th>
                                                                            <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {order.items.map((item, index) => (
                                                                            <tr key={index}>
                                                                                <td style={{ padding: '8px' }}>
                                                                                    <Link href={`/product/${item.productId}`} style={{ color: '#2196F3', textDecoration: 'underline' }}>
                                                                                        {item.title}
                                                                                    </Link>
                                                                                </td>
                                                                                <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                                                                                <td style={{ padding: '8px', textAlign: 'right' }}>€{item.price.toFixed(2)}</td>
                                                                                <td style={{ padding: '8px', textAlign: 'right' }}>€{(item.price * item.quantity).toFixed(2)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                        <div className={styles.detailSection}>
                                                            <h3>Detalles de Envío</h3>
                                                            <div className={styles.infoCard}>
                                                                <div className={styles.infoRow}>
                                                                    <span className={styles.infoLabel}>Compañía:</span>
                                                                    <span className={styles.infoValue}>{order.shippingCompany}</span>
                                                                </div>
                                                                <div className={styles.infoRow}>
                                                                    <span className={styles.infoLabel}>Coste envío:</span>
                                                                    <span className={styles.infoValue}>€{order.shippingCost.toFixed(2)}</span>
                                                                </div>
                                                                <div className={styles.infoRow}>
                                                                    <span className={styles.infoLabel}>Teléfono:</span>
                                                                    <span className={styles.infoValue}>{order.shippingAddress.phone}</span>
                                                                </div>
                                                                <div className={styles.infoRow}>
                                                                    <span className={styles.infoLabel}>Pago:</span>
                                                                    <span className={styles.infoValue}>{order.paymentMethod}</span>
                                                                </div>

                                                                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
                                                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                                                        Número de seguimiento:
                                                                    </label>
                                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                                        <input
                                                                            type="text"
                                                                            value={trackingNumbers[order.id] || ''}
                                                                            onChange={(e) => updateTrackingNumber(order.id, e.target.value)}
                                                                            placeholder="Introduce número..."
                                                                            className={styles.input}
                                                                            style={{ marginBottom: 0 }}
                                                                        />
                                                                        {order.trackingNumber && (
                                                                            <span style={{ fontSize: '1.2rem', color: '#4caf50' }} title="Guardado">✓</span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '2px solid #eee' }}>
                                                                    <div className={styles.infoRow}>
                                                                        <span>Subtotal:</span>
                                                                        <span>€{order.subtotal.toFixed(2)}</span>
                                                                    </div>
                                                                    <div className={styles.infoRow}>
                                                                        <span>Envío:</span>
                                                                        <span>€{order.shippingCost.toFixed(2)}</span>
                                                                    </div>
                                                                    <div className={styles.infoRow} style={{ fontSize: '1.1rem', marginTop: '8px' }}>
                                                                        <span style={{ fontWeight: 'bold' }}>Total:</span>
                                                                        <span style={{ fontWeight: 'bold', color: 'var(--cex-red)' }}>€{order.total.toFixed(2)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de confirmación */}
            {showConfirmModal && pendingStatusChange && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2 className={styles.modalTitle}>Confirmar envío</h2>
                        <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '12px' }}>
                            ¿Estás seguro de que deseas marcar este pedido como <strong>ENVIADO</strong>?
                        </p>
                        <p style={{ color: '#666', lineHeight: '1.6' }}>
                            Se enviará un email automático al cliente con el número de seguimiento:
                        </p>

                        <div className={styles.highlightBox}>
                            <div className={styles.trackingDisplay}>
                                {trackingNumbers[pendingStatusChange.orderId]}
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                onClick={cancelShipment}
                                className={`${styles.btn} ${styles.btnSecondary}`}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmShipment}
                                className={`${styles.btn} ${styles.btnSuccess}`}
                            >
                                ✓ Confirmar y enviar email
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
