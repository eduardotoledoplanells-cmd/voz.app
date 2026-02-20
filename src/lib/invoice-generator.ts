import jsPDF from 'jspdf';
import { Order } from '@/types';

export function generateInvoice(order: Order) {
    const doc = new jsPDF();

    // Company header
    doc.setFontSize(20);
    doc.setTextColor(220, 38, 38); // Red color
    doc.text('REVOLUXBIT', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('revoluxbit.rob@gmail.com', 105, 27, { align: 'center' });

    // Invoice title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('FACTURA', 20, 45);

    // Invoice details
    doc.setFontSize(10);
    doc.text(`Número de Pedido: ${order.orderNumber}`, 20, 55);
    doc.text(`Fecha: ${new Date(order.date).toLocaleDateString('es-ES')}`, 20, 62);

    // Customer details
    doc.setFontSize(12);
    doc.text('Datos del Cliente:', 20, 75);
    doc.setFontSize(10);
    doc.text(`Nombre: ${order.customerName}`, 20, 83);
    doc.text(`Email: ${order.customerEmail}`, 20, 90);
    doc.text(`Dirección: ${order.shippingAddress.address}`, 20, 97);
    doc.text(`${order.shippingAddress.postalCode} ${order.shippingAddress.city}`, 20, 104);
    doc.text(`Teléfono: ${order.shippingAddress.phone}`, 20, 111);

    // Items table header
    let yPos = 130;
    doc.setFillColor(220, 38, 38);
    doc.rect(20, yPos - 7, 170, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Producto', 25, yPos);
    doc.text('Cantidad', 120, yPos);
    doc.text('Precio', 150, yPos);
    doc.text('Total', 175, yPos);

    // Items
    doc.setTextColor(0);
    yPos += 10;
    order.items.forEach((item) => {
        doc.text(item.title.substring(0, 40), 25, yPos);
        doc.text(item.quantity.toString(), 125, yPos);
        doc.text(`€${item.price.toFixed(2)}`, 150, yPos);
        doc.text(`€${(item.quantity * item.price).toFixed(2)}`, 170, yPos);
        yPos += 7;
    });

    // Totals
    yPos += 10;
    doc.line(20, yPos, 190, yPos);
    yPos += 7;

    doc.text('Subtotal:', 140, yPos);
    doc.text(`€${order.subtotal.toFixed(2)}`, 170, yPos);
    yPos += 7;

    doc.text(`Envío (${order.shippingCompany}):`, 140, yPos);
    doc.text(`€${order.shippingCost.toFixed(2)}`, 170, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 140, yPos);
    doc.text(`€${order.total.toFixed(2)}`, 170, yPos);

    // Payment method
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Método de pago: ${order.paymentMethod}`, 20, yPos);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Gracias por tu compra', 105, 280, { align: 'center' });
    doc.text('revoluxbit.rob@gmail.com', 105, 285, { align: 'center' });

    return doc;
}

export function downloadInvoice(order: Order) {
    const doc = generateInvoice(order);
    doc.save(`Factura-${order.orderNumber}.pdf`);
}

export function printInvoice(order: Order) {
    const doc = generateInvoice(order);
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
}
