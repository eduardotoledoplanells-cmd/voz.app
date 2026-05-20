import crypto from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

// Genera una clave de 32 bytes estable a partir de la variable de entorno
function getEncryptionKey(): Buffer {
    const secret = process.env.KYC_ENCRYPTION_KEY || 'VOZ_SECRET_KYC_KEY_2026_SUPER_SAFE';
    return crypto.createHash('sha256').update(secret).digest();
}

export function computeBlindIndex(value: string): string {
    const salt = process.env.KYC_HASH_SALT || 'VOZ_SECRET_KYC_SALT_2026';
    const cleanValue = value.replace(/\s+/g, '').toUpperCase();
    return crypto.createHmac('sha256', salt).update(cleanValue).digest('hex');
}

export function encryptKYC(text: string): string {
    if (!text) return '';
    const iv = crypto.randomBytes(12); // Estándar para AES-GCM
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Formato: iv:authTag:contenidoCifrado
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptKYC(cipherText: string): string {
    if (!cipherText) return '';
    try {
        const parts = cipherText.split(':');
        if (parts.length !== 3) {
            // Si no está cifrado o tiene formato anterior, devolver tal cual
            return cipherText;
        }
        
        const [ivHex, authTagHex, encryptedHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const key = getEncryptionKey();
        
        const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (e) {
        console.error('[kycCrypto] Decryption failed:', e);
        return cipherText; // Fallback al valor crudo si falla
    }
}
