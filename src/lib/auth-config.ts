export const ADMIN_EMAILS = [
    'voz@appvoz.com',
    'voz@appvoz.com'
];

export const CONTACT_EMAIL = 'voz@appvoz.com';

export function isAdmin(email: string): boolean {
    return ADMIN_EMAILS.includes(email);
}

export function getUserRole(email: string): 'admin' | 'customer' {
    return isAdmin(email) ? 'admin' : 'customer';
}
