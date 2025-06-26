import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { EncryptedData, EncryptionOptions } from '../types';

export class EncryptionService {
  private key: Buffer;
  private algorithm: string;

  constructor(encryptionKey: string, options: EncryptionOptions = {}) {
    this.algorithm = options.algorithm || 'aes-256-cbc';
    
    // Create a consistent key from the provided encryption key
    this.key = this.deriveKey(encryptionKey);
  }

  /**
   * Encrypt data using AES encryption
   */
  encrypt(data: string): EncryptedData {
    try {
      const iv = randomBytes(16);
      const cipher = createCipheriv(this.algorithm, this.key, iv);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return {
        data: encrypted,
        iv: iv.toString('hex'),
        encrypted: true
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt encrypted data
   */
  decrypt(encryptedData: EncryptedData): string {
    try {
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = createDecipheriv(this.algorithm, this.key, iv);
      
      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if data is encrypted
   */
  static isEncrypted(data: any): data is EncryptedData {
    return typeof data === 'object' && 
           data !== null && 
           data.encrypted === true && 
           typeof data.data === 'string' && 
           typeof data.iv === 'string';
  }

  /**
   * Derive a consistent key from the encryption key
   */
  private deriveKey(encryptionKey: string): Buffer {
    return createHash('sha256')
      .update(encryptionKey)
      .digest();
  }
}

/**
 * Simple encryption utility functions
 */
export function encrypt(data: string, encryptionKey: string): EncryptedData {
  const service = new EncryptionService(encryptionKey);
  return service.encrypt(data);
}

export function decrypt(encryptedData: EncryptedData, encryptionKey: string): string {
  const service = new EncryptionService(encryptionKey);
  return service.decrypt(encryptedData);
}

export { EncryptionService as default }; 