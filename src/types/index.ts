export interface Product {
    id: string;
    reference: string;
    title: string;
    description?: string;
    price: number;
    originalPrice?: number;
    stock: number;
    category: string;
    images: string[];
    grade?: 'A' | 'B' | 'C';
    isOnSale?: boolean;
    salePrice?: number;
    isFeatured?: boolean;
    buyPrice?: number;
    limitOnePerCustomer?: boolean;
    type?: 'console' | 'game' | 'accessory' | 'movie' | 'computing';
    sellerId?: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    image: string;
    description?: string;
    productCount?: number;
    subcategories?: Category[];
}

export interface Order {
    id: string;
    orderNumber: string;
    date: string;
    customerName: string;
    customerEmail: string;
    shippingAddress: {
        address: string;
        city: string;
        postalCode: string;
        phone: string;
    };
    items: {
        productId: string;
        title: string;
        quantity: number;
        price: number;
    }[];
    subtotal: number;
    shippingCost: number;
    shippingCompany: string;
    total: number;
    paymentMethod: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    trackingNumber?: string;
    invoiceRequested?: boolean;
    sellerId?: string; // ID of the admin/seller who processed the sale
}

export interface Review {
    id: string;
    productId: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
    approved: boolean;
}

export interface User {
    id: string;
    name: string;
    email: string;
    password: string; // Hashed or mock hashed
    marketingConsent: boolean;
    registeredAt: string;
    address?: {
        street: string;
        city: string;
        postalCode: string;
        country: string;
        phone: string;
    };
    orders?: string[]; // Array of Order IDs
    resetToken?: string;
    resetTokenExpiry?: number;
    role?: 'admin' | 'customer';
    verified?: boolean;
    verificationToken?: string;
    verificationTokenExpiry?: number;
    favorites?: string[]; // Array of Product IDs
    points?: number;
    lastRobCoinEarned?: number; // Timestamp of last earned coin
}

export interface ProductView {
    productId: string;
    productTitle: string;
    timestamp: string;
    category?: string;
}

export interface Analytics {
    totalViews: number;
    productViews: {
        [productId: string]: {
            count: number;
            title: string;
            category?: string;
            lastViewed: string;
        };
    };
}
