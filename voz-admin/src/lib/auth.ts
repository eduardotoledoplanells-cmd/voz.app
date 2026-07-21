import { supabaseAdmin, Employee } from './db';
import bcrypt from 'bcryptjs';
import { verifyAdminToken, extractBearerToken } from './jwt';

export interface ValidationResult {
    isValid: boolean;
    errorStatus?: number;
    errorText?: string;
    employee?: Employee;
}

/**
 * Validates that the request is made by an active, authenticated employee.
 * 
 * Accepts TWO authentication methods (in priority order):
 * 
 * 1. JWT Bearer Token (PREFERRED):
 *    Authorization: Bearer <jwt_token>
 *    → Fast: verifies signature locally, no DB query needed for basic validation
 *    → Secure: password never travels in requests after login
 * 
 * 2. Legacy headers (backward compat, deprecated):
 *    x-employee-id, x-employee-username, x-employee-password
 *    → Still requires DB query and bcrypt compare on every request
 *    → Will be removed in a future version
 * 
 * Roles:
 * - 0: Normal employee (e.g. Moderator)
 * - 1: Director / Super Admin
 */
import { cookies } from 'next/headers';

export async function validateEmployee(
    request: Request,
    minRole: number = 0
): Promise<ValidationResult> {
    try {
        // ── METHOD 1: JWT Bearer Token or Cookie ────────────────────────────────
        let token = extractBearerToken(request);
        if (!token) {
            try {
                const cookieStore = await cookies();
                token = cookieStore.get('voz_admin_token')?.value || null;
            } catch (err) {
                // Ignore cookies() error if not in Next.js App Router context
            }
        }

        if (token) {
            try {
                const payload = await verifyAdminToken(token);

                // Check role
                if (Number(payload.role) < minRole) {
                    return {
                        isValid: false,
                        errorStatus: 403,
                        errorText: 'Permisos insuficientes para realizar esta acción administrativa.'
                    };
                }

                // Fetch employee from DB to verify still active (lightweight check)
                const { data: employee } = await supabaseAdmin
                    .from('employees')
                    .select('id, username, role, active, worker_number, last_login')
                    .eq('id', payload.employeeId)
                    .single();

                if (!employee || !employee.active) {
                    return {
                        isValid: false,
                        errorStatus: 401,
                        errorText: 'Sesión inválida o cuenta desactivada.'
                    };
                }

                return {
                    isValid: true,
                    employee: {
                        id: employee.id,
                        username: employee.username,
                        role: Number(employee.role),
                        lastLogin: employee.last_login || 'Nunca',
                        active: employee.active,
                        worker_number: employee.worker_number
                    }
                };
            } catch (jwtError) {
                // Token invalid or expired
                return {
                    isValid: false,
                    errorStatus: 401,
                    errorText: 'Token de sesión inválido o expirado. Por favor, inicia sesión de nuevo.'
                };
            }
        }

        // ── METHOD 2: Legacy headers (deprecated) ─────────────────────────────
        const employeeId = request.headers.get('x-employee-id');
        const username = request.headers.get('x-employee-username');
        const password = request.headers.get('x-employee-password');

        if (!employeeId || !username || !password) {
            return {
                isValid: false,
                errorStatus: 401,
                errorText: 'Autenticación requerida. Proporciona un token Bearer o credenciales de empleado.'
            };
        }

        // Fetch employee from database
        const { data: employee, error } = await supabaseAdmin
            .from('employees')
            .select('*')
            .eq('id', employeeId)
            .single();

        if (error || !employee) {
            return {
                isValid: false,
                errorStatus: 401,
                errorText: 'Empleado no encontrado o error en autenticación.'
            };
        }

        if (!employee.active) {
            return {
                isValid: false,
                errorStatus: 403,
                errorText: 'La cuenta de empleado está inactiva.'
            };
        }

        if (employee.username.toLowerCase() !== username.toLowerCase()) {
            return {
                isValid: false,
                errorStatus: 401,
                errorText: 'Nombre de usuario incorrecto.'
            };
        }

        const isPasswordValid = await bcrypt.compare(password, employee.password);
        if (!isPasswordValid) {
            return {
                isValid: false,
                errorStatus: 401,
                errorText: 'Código de empleado (password) incorrecto.'
            };
        }

        if (Number(employee.role) < minRole) {
            return {
                isValid: false,
                errorStatus: 403,
                errorText: 'Permisos insuficientes para realizar esta acción administrativa.'
            };
        }

        return {
            isValid: true,
            employee: {
                id: employee.id,
                username: employee.username,
                role: Number(employee.role),
                lastLogin: employee.last_login || 'Nunca',
                active: employee.active,
                worker_number: employee.worker_number
            }
        };
    } catch (e) {
        console.error('Error validating employee:', e);
        return {
            isValid: false,
            errorStatus: 500,
            errorText: 'Error interno de autenticación de empleado.'
        };
    }
}
