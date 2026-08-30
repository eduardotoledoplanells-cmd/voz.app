import crypto from 'crypto';

// Base32 decoder to convert Google Authenticator secret key to bytes
function base32Decode(base32: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = base32.toUpperCase().replace(/=+$/, '');
    const length = cleaned.length;
    const buffer = Buffer.alloc(Math.floor((length * 5) / 8));
    
    let bits = 0;
    let value = 0;
    let index = 0;
    
    for (let i = 0; i < length; i++) {
        const val = alphabet.indexOf(cleaned[i]);
        if (val === -1) throw new Error('Invalid base32 character');
        value = (value << 5) | val;
        bits += 5;
        if (bits >= 8) {
            buffer[index++] = (value >>> (bits - 8)) & 255;
            bits -= 8;
        }
    }
    return buffer;
}

// Generate TOTP token for a secret and time window
export function generateTOTP(secret: string, window = 0): string {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30) + window;
    
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(counter), 0);
    
    const hmac = crypto.createHmac('sha1', key);
    hmac.update(buffer);
    const hmacResult = hmac.digest();
    
    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const code =
        ((hmacResult[offset] & 0x7f) << 24) |
        ((hmacResult[offset + 1] & 0xff) << 16) |
        ((hmacResult[offset + 2] & 0xff) << 8) |
        (hmacResult[offset + 3] & 0xff);
        
    return String(code % 1000000).padStart(6, '0');
}

// Verify TOTP token (with tolerance window for network latency)
export function verifyTOTP(token: string, secret: string): boolean {
    const cleanToken = token.trim();
    for (let window = -1; window <= 1; window++) {
        if (generateTOTP(secret, window) === cleanToken) {
            return true;
        }
    }
    return false;
}

// Generate random Base32 secret for Google Authenticator
export function generateSecret(length = 16): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        secret += alphabet[bytes[i] % alphabet.length];
    }
    return secret;
}

// Get standard Google Authenticator QR URI
export function getOTPAuthURL(username: string, secret: string, issuer = 'LYVO Admin'): string {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(username)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}
