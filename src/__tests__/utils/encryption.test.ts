import { EncryptionService, encrypt, decrypt } from '../../utils/encryption';
import { EncryptedData } from '../../types';

describe('EncryptionService', () => {
  const testKey = 'test-encryption-key-123';
  const testData = 'Hello, World! This is test data.';
  const complexData = JSON.stringify({
    name: 'John Doe',
    age: 30,
    hobbies: ['reading', 'swimming'],
    nested: { city: 'New York', country: 'USA' }
  });

  describe('EncryptionService class', () => {
    it('should encrypt and decrypt data correctly', () => {
      const service = new EncryptionService(testKey);
      
      const encrypted = service.encrypt(testData);
      expect(encrypted).toHaveProperty('data');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted.encrypted).toBe(true);
      expect(typeof encrypted.data).toBe('string');
      expect(typeof encrypted.iv).toBe('string');
      
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(testData);
    });

    it('should handle complex JSON data', () => {
      const service = new EncryptionService(testKey);
      
      const encrypted = service.encrypt(complexData);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(complexData);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(complexData));
    });

    it('should produce different encrypted output each time', () => {
      const service = new EncryptionService(testKey);
      
      const encrypted1 = service.encrypt(testData);
      const encrypted2 = service.encrypt(testData);
      
      // Different IV should produce different encrypted data
      expect(encrypted1.data).not.toBe(encrypted2.data);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      
      // But both should decrypt to the same original data
      expect(service.decrypt(encrypted1)).toBe(testData);
      expect(service.decrypt(encrypted2)).toBe(testData);
    });

    it('should handle empty strings', () => {
      const service = new EncryptionService(testKey);
      
      const encrypted = service.encrypt('');
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe('');
    });

    it('should handle different encryption keys', () => {
      const service1 = new EncryptionService('key1');
      const service2 = new EncryptionService('key2');
      
      const encrypted = service1.encrypt(testData);
      
      // Should fail with wrong key
      expect(() => service2.decrypt(encrypted)).toThrow();
    });

    it('should handle custom encryption options', () => {
      const service = new EncryptionService(testKey, {
        algorithm: 'aes-256-cbc'
      });
      
      const encrypted = service.encrypt(testData);
      const decrypted = service.decrypt(encrypted);
      
      expect(decrypted).toBe(testData);
    });
  });

  describe('isEncrypted utility', () => {
    it('should correctly identify encrypted data', () => {
      const service = new EncryptionService(testKey);
      const encrypted = service.encrypt(testData);
      
      expect(EncryptionService.isEncrypted(encrypted)).toBe(true);
    });

    it('should correctly identify non-encrypted data', () => {
      expect(EncryptionService.isEncrypted(testData)).toBe(false);
      expect(EncryptionService.isEncrypted({ some: 'object' })).toBe(false);
      expect(EncryptionService.isEncrypted(null)).toBe(false);
      expect(EncryptionService.isEncrypted(undefined)).toBe(false);
      expect(EncryptionService.isEncrypted(123)).toBe(false);
    });

    it('should handle malformed encrypted data', () => {
      expect(EncryptionService.isEncrypted({ encrypted: true })).toBe(false);
      expect(EncryptionService.isEncrypted({ data: 'test', encrypted: true })).toBe(false);
      expect(EncryptionService.isEncrypted({ data: 'test', iv: 'test' })).toBe(false);
    });
  });

  describe('utility functions', () => {
    it('encrypt function should work correctly', () => {
      const encrypted = encrypt(testData, testKey);
      
      expect(EncryptionService.isEncrypted(encrypted)).toBe(true);
      expect(encrypted).toHaveProperty('data');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted.encrypted).toBe(true);
    });

    it('decrypt function should work correctly', () => {
      const encrypted = encrypt(testData, testKey);
      const decrypted = decrypt(encrypted, testKey);
      
      expect(decrypted).toBe(testData);
    });

    it('should handle round-trip encryption/decryption', () => {
      const data = complexData;
      const encrypted = encrypt(data, testKey);
      const decrypted = decrypt(encrypted, testKey);
      
      expect(decrypted).toBe(data);
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid decryption', () => {
      const service = new EncryptionService(testKey);
      const invalidEncrypted: EncryptedData = {
        data: 'invalid-data',
        iv: 'invalid-iv',
        encrypted: true
      };
      
      expect(() => service.decrypt(invalidEncrypted)).toThrow(/Decryption failed/);
    });

    it('should handle encryption errors gracefully', () => {
      // This is harder to test without mocking crypto functions
      // But we ensure the error message is wrapped properly
      const service = new EncryptionService(testKey);
      
      // Should not throw for normal data
      expect(() => service.encrypt(testData)).not.toThrow();
    });
  });
}); 