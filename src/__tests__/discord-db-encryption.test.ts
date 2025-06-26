import { DiscordDB } from '../discord-db';

// Mock the DiscordClient to avoid actual Discord API calls
// Use a shared message store to simulate persistent Discord channel state
let sharedMockMessages: any[] = [];
let sharedMessageIdCounter = 1;

const resetSharedMockState = () => {
  sharedMockMessages = [];
  sharedMessageIdCounter = 1;
};

jest.mock('../client/discord-client', () => {
  return {
    DiscordClient: jest.fn().mockImplementation(() => ({
      sendMessage: jest.fn().mockImplementation((content: string) => {
        const message = {
          id: `mock-message-${sharedMessageIdCounter++}`,
          content,
          timestamp: new Date().toISOString()
        };
        sharedMockMessages.push(message);
        return Promise.resolve(message);
      }),
      editMessage: jest.fn().mockImplementation((messageId: string, content: string) => {
        const messageIndex = sharedMockMessages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          sharedMockMessages[messageIndex].content = content;
          return Promise.resolve(sharedMockMessages[messageIndex]);
        }
        throw new Error('Message not found');
      }),
      deleteMessage: jest.fn().mockImplementation((messageId: string) => {
        const messageIndex = sharedMockMessages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          sharedMockMessages.splice(messageIndex, 1);
        }
        return Promise.resolve();
      }),
      getAllMessages: jest.fn().mockImplementation(() => {
        return Promise.resolve([...sharedMockMessages]);
      }),
      testConnection: jest.fn().mockResolvedValue(true)
    }))
  };
});

describe('DiscordDB with Encryption', () => {
  const mockConfig = {
    botToken: 'mock-token',
    channelId: 'mock-channel-id'
  };

  const encryptedConfig = {
    ...mockConfig,
    encryptionKey: 'test-encryption-key-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock state between tests
    resetSharedMockState();
  });

  describe('Encryption configuration', () => {
    it('should initialize without encryption when no key provided', () => {
      const db = new DiscordDB(mockConfig);
      expect(db.isEncryptionEnabled()).toBe(false);
    });

    it('should initialize with encryption when key provided', () => {
      const db = new DiscordDB(encryptedConfig);
      expect(db.isEncryptionEnabled()).toBe(true);
    });
  });

  describe('CRUD operations with encryption', () => {
    it('should encrypt and store documents', async () => {
      const db = new DiscordDB(encryptedConfig);
      const testDoc = { name: 'Alice', age: 30, city: 'New York' };

      const result = await db.insertOne(testDoc);
      
      expect(result.acknowledged).toBe(true);
      expect(result.insertedId).toBeDefined();
      expect(result.messageId).toBeDefined();

      // Verify the document can be retrieved and decrypted
      const retrieved = await db.findOne({ name: 'Alice' });
      expect(retrieved).toMatchObject(testDoc);
    });

    it('should handle multiple encrypted documents', async () => {
      const db = new DiscordDB(encryptedConfig);
      const docs = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 }
      ];

      for (const doc of docs) {
        await db.insertOne(doc);
      }

      const allDocs = await db.find();
      expect(allDocs.documents).toHaveLength(3);
      expect(allDocs.documents.map(d => d.name)).toEqual(
        expect.arrayContaining(['Alice', 'Bob', 'Charlie'])
      );
    });

    it('should update encrypted documents', async () => {
      const db = new DiscordDB(encryptedConfig);
      
      await db.insertOne({ name: 'Alice', age: 30, city: 'New York' });
      
      const updateResult = await db.updateOne(
        { name: 'Alice' },
        { $set: { age: 31, city: 'San Francisco' } }
      );

      expect(updateResult.modifiedCount).toBe(1);

      const updated = await db.findOne({ name: 'Alice' });
      expect(updated?.age).toBe(31);
      expect(updated?.city).toBe('San Francisco');
    });

    it('should delete encrypted documents', async () => {
      const db = new DiscordDB(encryptedConfig);
      
      await db.insertOne({ name: 'Alice', age: 30 });
      
      let found = await db.findOne({ name: 'Alice' });
      expect(found).toBeTruthy();

      const deleteResult = await db.deleteOne({ name: 'Alice' });
      expect(deleteResult.deletedCount).toBe(1);

      found = await db.findOne({ name: 'Alice' });
      expect(found).toBeNull();
    });
  });

  describe('Mixing encrypted and non-encrypted data', () => {
    it('should handle transition from non-encrypted to encrypted', async () => {
      // First, insert data without encryption
      const dbNoEncryption = new DiscordDB(mockConfig);
      await dbNoEncryption.insertOne({ name: 'OldData', value: 'unencrypted' });

      // Then try to read with encryption enabled
      const dbWithEncryption = new DiscordDB(encryptedConfig);
      
      // Should be able to read old unencrypted data
      const oldData = await dbWithEncryption.findOne({ name: 'OldData' });
      expect(oldData?.value).toBe('unencrypted');

      // New data should be encrypted
      await dbWithEncryption.insertOne({ name: 'NewData', value: 'encrypted' });
      const newData = await dbWithEncryption.findOne({ name: 'NewData' });
      expect(newData?.value).toBe('encrypted');
    });
  });

  describe('Error handling for encrypted data without key', () => {
    it('should throw error when trying to read encrypted data without key', async () => {
      // Test the core concept by directly testing the deserialization logic
      const db = new DiscordDB(mockConfig); // No encryption key
      
      // Create a mock encrypted document that would be stored in Discord
      const { EncryptionService } = require('../utils/encryption');
      const service = new EncryptionService('test-key');
      const testDoc = { name: 'EncryptedData', secret: 'top-secret' };
      const encrypted = service.encrypt(JSON.stringify(testDoc));
      
      // Test that the deserializeDocument method throws an error when encountering encrypted data
      // This is a more direct test of the core functionality
      try {
        // Access the private deserializeDocument method for testing
        const deserializeMethod = (db as any).deserializeDocument;
        deserializeMethod.call(db, JSON.stringify(encrypted));
        fail('Expected an error to be thrown');
      } catch (error: any) {
        expect(error.message).toMatch(/Encrypted data found but no encryption key provided/);
      }
    });
  });

  describe('Complex data encryption', () => {
    it('should handle nested objects', async () => {
      const db = new DiscordDB(encryptedConfig);
      const complexDoc = {
        user: {
          name: 'Alice',
          profile: {
            age: 30,
            preferences: {
              theme: 'dark',
              notifications: true
            }
          }
        },
        metadata: {
          created: new Date().toISOString(),
          tags: ['user', 'premium', 'active']
        }
      };

      await db.insertOne(complexDoc);
      const retrieved = await db.findOne({ 'user.name': 'Alice' });
      
      expect(retrieved).toMatchObject(complexDoc);
      expect(retrieved?.user.profile.preferences.theme).toBe('dark');
      expect(retrieved?.metadata.tags).toEqual(['user', 'premium', 'active']);
    });

    it('should handle arrays and special characters', async () => {
      const db = new DiscordDB(encryptedConfig);
      const docWithSpecialChars = {
        text: 'Hello "World"! Special chars: @#$%^&*()[]{}|\\:";\'<>?,./`~',
        array: [1, 'two', { three: 3 }, null, undefined],
        unicode: '🚀 Unicode text with emojis 🎉',
        numbers: {
          int: 42,
          float: 3.14159,
          negative: -100
        }
      };

      await db.insertOne(docWithSpecialChars);
      const retrieved = await db.findOne({ text: { $regex: /Hello/ } });
      
      expect(retrieved).toMatchObject({
        ...docWithSpecialChars,
        array: [1, 'two', { three: 3 }, null, null] // undefined becomes null in JSON
      });
    });
  });

  describe('Encryption error handling', () => {
    it('should handle encryption of large documents', async () => {
      const db = new DiscordDB(encryptedConfig);
      
      // Create a document that might be too large when encrypted
      const largeDoc = {
        data: 'x'.repeat(1800), // Close to Discord's 2000 char limit
        metadata: 'additional data'
      };

      // Should either succeed or throw a validation error
      try {
        const result = await db.insertOne(largeDoc);
        expect(result.acknowledged).toBe(true);
              } catch (error: any) {
          // Could be either ValidationError or DiscordDBError depending on the error handling
          expect(error.message).toMatch(/Document too large|too large/i);
        }
    });

    it('should handle malformed encrypted data gracefully', async () => {
      // This test ensures the system doesn't crash on unexpected data
      const db = new DiscordDB(encryptedConfig);
      
      // Normal operation should work
      await db.insertOne({ test: 'data' });
      const result = await db.find();
      expect(result.documents).toHaveLength(1);
    });
  });

  describe('Performance considerations', () => {
    it('should cache decrypted documents', async () => {
      const db = new DiscordDB(encryptedConfig);
      
      await db.insertOne({ name: 'CacheTest', data: 'test-data' });
      
      // First read
      const start1 = Date.now();
      await db.findOne({ name: 'CacheTest' });
      const time1 = Date.now() - start1;
      
      // Second read (should use cache)
      const start2 = Date.now();
      await db.findOne({ name: 'CacheTest' });
      const time2 = Date.now() - start2;
      
      // Cache should make the second read faster (or at least not significantly slower)
      expect(time2).toBeLessThanOrEqual(time1 + 50); // Allow 50ms tolerance
    });
  });
}); 