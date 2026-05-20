import { supabaseAdmin, Employee } from './db';

export interface ValidationResult {
    isValid: boolean;
    errorStatus?: number;
    errorText?: string;
    employee?: Employee;
}

/**
 * Validates that the request is made by an active, authenticated employee
 * and checks if they have the required minimum role.
 * 
 * Roles:
 * - 0: Normal employee (e.g. Moderator)
 * - 1: Director / Super Admin
 */
export async function validateEmployee(
    request: Request,
    minRole: number = 0
): Promise<ValidationResult> {
    try {
        const employeeId = request.headers.get('x-employee-id');
        const username = request.headers.get('x-employee-username');
        const password = request.headers.get('x-employee-password');

        if (!employeeId || !username || !password) {
            return {
                isValid: false,
                errorStatus: 401,
                errorText: 'Credenciales de empleado faltantes en cabeceras de la petición.'
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

        // Verify active status, username and password
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

        if (employee.password !== password) {
            return {
                isValid: false,
                errorStatus: 401,
                errorText: 'Código de empleado (password) incorrecto.'
            };
        }

        // Check role permission
        if (Number(employee.role) < minRole) {
            return {
                isValid: false,
                errorStatus: 403,
                errorText: 'Permisos insuficientes para realizar esta acción administrativa.'
            };
        }

        const mappedEmployee: Employee = {
            id: employee.id,
            username: employee.username,
            role: Number(employee.role),
            lastLogin: employee.last_login || 'Nunca',
            active: employee.active,
            worker_number: employee.worker_number
        };

        return {
            isValid: true,
            employee: mappedEmployee
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
