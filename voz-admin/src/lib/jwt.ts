/**
 * JWT Utility — VOZ Admin Panel
 * 
 * Emite tokens firmados con HS256 que expiran en 8 horas.
 * La SECRET_KEY debe estar configurada en las env vars de Vercel
 * como ADMIN_JWT_SECRET. Si no existe, se usa un fallback (solo dev).
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'voz-admin-dev-secret-change-in-production-2024';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);
const TOKEN_EXPIRY = '8h';

export interface AdminTokenPayload extends JWTPayload {
    employeeId: string;
    username: string;
    role: number;
    workerNumber: string;
}

/**
 * Emite un JWT firmado para un empleado autenticado.
 */
export async function signAdminToken(payload: Omit<AdminTokenPayload, keyof JWTPayload>): Promise<string> {
    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(TOKEN_EXPIRY)
        .setIssuer('voz-admin')
        .setAudience('voz-admin-client')
        .sign(SECRET_KEY);
    return token;
}

/**
 * Verifica y decodifica un JWT.
 * Lanza error si el token es inválido o ha expirado.
 */
export async function verifyAdminToken(token: string): Promise<AdminTokenPayload> {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
        issuer: 'voz-admin',
        audience: 'voz-admin-client',
    });
    return payload as AdminTokenPayload;
}

/**
 * Extrae el token Bearer del header Authorization.
 * Retorna null si no hay header o no tiene formato Bearer.
 */
export function extractBearerToken(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.slice(7); // Remove "Bearer "
}
