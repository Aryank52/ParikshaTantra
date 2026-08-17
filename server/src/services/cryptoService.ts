import crypto from 'crypto';
import { CONFIG } from '../config';

export class CryptoService {
  /**
   * Encrypts plaintext string using AES-256-GCM.
   */
  static encryptQuestionContent(text: string): { cipherText: string; iv: string; authTag: string } {
    const key = Buffer.from(CONFIG.AES_MASTER_KEY, 'hex');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return {
      cipherText: encrypted,
      iv: iv.toString('hex'),
      authTag,
    };
  }

  /**
   * Decrypts AES-256-GCM ciphertext.
   */
  static decryptQuestionContent(cipherText: string, ivHex: string, authTagHex: string): string {
    const key = Buffer.from(CONFIG.AES_MASTER_KEY, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(cipherText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * SHA-256 hash calculation for canonical content.
   */
  static hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Generates a short-lived HMAC-SHA256 derived Centre Activation Token.
   * Format: ACT-<ExamCode>-<CentreCode>-<HMAC_SUBSET>
   */
  static generateActivationToken(examId: string, examCode: string, centreId: string, centreCode: string, timeWindow: number): string {
    const payload = `${examId}:${examCode}:${centreId}:${centreCode}:${timeWindow}`;
    const hmac = crypto.createHmac('sha256', CONFIG.HMAC_ACTIVATION_KEY).update(payload).digest('hex').toUpperCase();
    const tokenShort = hmac.substring(0, 10);
    return `ACT-${examCode.toUpperCase()}-${centreCode.toUpperCase()}-${tokenShort}`;
  }

  /**
   * Verifies an activation token given examId, centreId, and timeWindow.
   */
  static verifyActivationToken(token: string, examId: string, examCode: string, centreId: string, centreCode: string, timeWindow: number): boolean {
    const expected = this.generateActivationToken(examId, examCode, centreId, centreCode, timeWindow);
    return token.trim().toUpperCase() === expected.toUpperCase();
  }

  /**
   * Simulates RSA/HMAC Digital Signature for blueprint checksums and result certificates.
   */
  static signPayload(data: string): string {
    return crypto.createHmac('sha256', CONFIG.JWT_SECRET).update(`SIG:${data}`).digest('hex');
  }

  static verifySignature(data: string, signature: string): boolean {
    const expected = this.signPayload(data);
    return expected === signature;
  }
}
