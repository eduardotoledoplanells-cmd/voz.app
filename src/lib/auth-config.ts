export const ADMIN_EMAILS = [
    'revoluxbit.rob01@gmail.com',
    'revoluxbit.rob02@gmail.com'
];

export const CONTACT_EMAIL = 'revoluxbit.rob@gmail.com';

export function isAdmin(email: string): boolean {
    return ADMIN_EMAILS.includes(email);
}

export function getUserRole(email: string): 'admin' | 'customer' {
    return isAdmin(email) ? 'admin' : 'customer';
}
