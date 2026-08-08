export const ADMIN_EMAILS = [
    'lyvo@lyvo.media',
    'lyvo@lyvo.media'
];

export const CONTACT_EMAIL = 'lyvo@lyvo.media';

export function isAdmin(email: string): boolean {
    return ADMIN_EMAILS.includes(email);
}

export function getUserRole(email: string): 'admin' | 'customer' {
    return isAdmin(email) ? 'admin' : 'customer';
}
