import { DiscordDB } from '../discord-db';
import { DiscordClient } from '../client/discord-client';
import { ValidationError, DiscordDBError } from '../types';

// Mock the DiscordClient
jest.mock('../client/discord-client');

describe('DiscordDB', () => {
  let db: DiscordDB;
  let mockClient: jest.Mocked<DiscordClient>;

  const mockConfig = {
    botToken: 'test-token',
    channelId: 'test-channel-id'
  };

  const mockMessages = [
    {
      id: 'msg-1',
      content: JSON.stringify({ _id: '1', name: 'John', age: 30, role: 'admin' }),
      timestamp: '2023-01-01T00:00:00.000Z',
      channel_id: 'test-channel-id'
    },
    {
      id: 'msg-2',
      content: JSON.stringify({ _id: '2', name: 'Jane', age: 25, role: 'user' }),
      timestamp: '2023-01-01T01:00:00.000Z',
      channel_id: 'test-channel-id'
    },
    {
      id: 'msg-3',
      content: JSON.stringify({ _id: '3', name: 'Bob', age: 35, role: 'user' }),
      timestamp: '2023-01-01T02:00:00.000Z',
      channel_id: 'test-channel-id'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock client
    mockClient = {
      sendMessage: jest.fn(),
      getMessages: jest.fn(),
      getAllMessages: jest.fn(),
      editMessage: jest.fn(),
      deleteMessage: jest.fn(),
      testConnection: jest.fn()
    } as any;

    // Mock the DiscordClient constructor
    (DiscordClient as jest.MockedClass<typeof DiscordClient>).mockImplementation(() => mockClient);
    
    db = new DiscordDB(mockConfig);
  });

  describe('constructor', () => {
    it('should create DiscordDB instance', () => {
      expect(db).toBeInstanceOf(DiscordDB);
      expect(DiscordClient).toHaveBeenCalledWith(mockConfig);
    });
  });

  describe('insertOne', () => {
    it('should insert a document successfully', async () => {
      const newMessage = {
        id: 'new-msg',
        content: JSON.stringify({ _id: 'generated-id', name: 'Alice', age: 28 }),
        timestamp: '2023-01-01T03:00:00.000Z'
      };

      mockClient.sendMessage.mockResolvedValueOnce(newMessage as any);

      const result = await db.insertOne({ name: 'Alice', age: 28 });

      expect(mockClient.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('"name":"Alice"')
      );
      expect(result.acknowledged).toBe(true);
      expect(result.insertedId).toBeDefined();
      expect(result.messageId).toBe('new-msg');
    });

    it('should throw error for document too large', async () => {
      const largeContent = 'x'.repeat(2000);
      
      await expect(db.insertOne({ content: largeContent }))
        .rejects.toThrow(ValidationError);
    });

    it('should handle Discord API errors', async () => {
      mockClient.sendMessage.mockRejectedValueOnce(new Error('Discord API error'));

      await expect(db.insertOne({ name: 'Test' }))
        .rejects.toThrow(DiscordDBError);
    });
  });

  describe('find', () => {
    beforeEach(() => {
      mockClient.getAllMessages.mockResolvedValue(mockMessages as any);
    });

    it('should find all documents', async () => {
      const result = await db.find();

      expect(result.documents).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.hasMore).toBe(false);
    });

    it('should find documents with filter', async () => {
      const result = await db.find({ role: 'user' });

      expect(result.documents).toHaveLength(2);
      expect(result.documents.every(doc => doc.role === 'user')).toBe(true);
    });

    it('should find documents with complex filter', async () => {
            const result = await db.find({
        $and: [
          { age: { $gte: 25 } },
          { role: 'user' }
        ]
      } as any);

      expect(result.documents).toHaveLength(2);
    });

    it('should apply sorting', async () => {
      const result = await db.find({}, { sort: { age: -1 } });

      expect(result.documents.map(doc => doc.age)).toEqual([35, 30, 25]);
    });

    it('should apply pagination', async () => {
      const result = await db.find({}, { skip: 1, limit: 1 });

      expect(result.documents).toHaveLength(1);
      expect(result.hasMore).toBe(true);
    });

    it('should apply projection', async () => {
      const result = await db.find({}, { projection: { name: 1 } });

      result.documents.forEach(doc => {
        expect(doc.name).toBeDefined();
        expect(doc.age).toBeUndefined();
        expect(doc._id).toBeDefined(); // _id is included by default
      });
    });

    it('should handle empty results', async () => {
      mockClient.getAllMessages.mockResolvedValueOnce([]);

      const result = await db.find();

      expect(result.documents).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle invalid JSON messages', async () => {
      const invalidMessages = [
        ...mockMessages,
        {
          id: 'invalid-msg',
          content: 'invalid json',
          timestamp: '2023-01-01T04:00:00.000Z',
          channel_id: 'test-channel-id'
        }
      ];

      mockClient.getAllMessages.mockResolvedValueOnce(invalidMessages as any);

      const result = await db.find();

      // Should ignore invalid JSON and only return valid documents
      expect(result.documents).toHaveLength(3);
    });
  });

  describe('findOne', () => {
    beforeEach(() => {
      mockClient.getAllMessages.mockResolvedValue(mockMessages as any);
    });

    it('should find one document', async () => {
      const result = await db.findOne({ name: 'John' });

      expect(result).toBeDefined();
      expect(result!.name).toBe('John');
    });

    it('should return null if not found', async () => {
      const result = await db.findOne({ name: 'NonExistent' });

      expect(result).toBeNull();
    });
  });

  describe('updateOne', () => {
    beforeEach(() => {
      mockClient.getAllMessages.mockResolvedValue([mockMessages[0]] as any);
    });

    it('should update a document successfully', async () => {
      const updatedMessage = {
        id: 'msg-1',
        content: JSON.stringify({ _id: '1', name: 'John Updated', age: 31, role: 'admin' }),
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      mockClient.editMessage.mockResolvedValueOnce(updatedMessage as any);

      const result = await db.updateOne(
        { _id: '1' },
        { $set: { name: 'John Updated', age: 31 } }
      );

      expect(result.acknowledged).toBe(true);
      expect(result.matchedCount).toBe(1);
      expect(result.modifiedCount).toBe(1);
      expect(mockClient.editMessage).toHaveBeenCalledWith(
        'msg-1',
        expect.stringContaining('"name":"John Updated"')
      );
    });

    it('should return no match if document not found', async () => {
      mockClient.getAllMessages.mockResolvedValue([]);

      const result = await db.updateOne({ _id: 'nonexistent' }, { $set: { name: 'Test' } });

      expect(result.matchedCount).toBe(0);
      expect(result.modifiedCount).toBe(0);
    });

    it('should handle document too large after update', async () => {
      const largeUpdate = { $set: { data: 'x'.repeat(2000) } };

      await expect(db.updateOne({ _id: '1' }, largeUpdate))
        .rejects.toThrow(ValidationError);
    });

    it('should validate update operations', async () => {
      await expect(db.updateOne({ _id: '1' }, { $inc: { age: 'invalid' as any } }))
        .rejects.toThrow();
    });
  });

  describe('deleteOne', () => {
    beforeEach(() => {
      mockClient.getAllMessages.mockResolvedValue([mockMessages[0]] as any);
    });

    it('should delete a document successfully', async () => {
      mockClient.deleteMessage.mockResolvedValueOnce(undefined);

      const result = await db.deleteOne({ _id: '1' });

      expect(result.acknowledged).toBe(true);
      expect(result.deletedCount).toBe(1);
      expect(mockClient.deleteMessage).toHaveBeenCalledWith('msg-1');
    });

    it('should return no deletion if document not found', async () => {
      mockClient.getAllMessages.mockResolvedValue([]);

      const result = await db.deleteOne({ _id: 'nonexistent' });

      expect(result.deletedCount).toBe(0);
    });
  });

  describe('insertMany', () => {
    it('should insert multiple documents', async () => {
      mockClient.sendMessage
        .mockResolvedValueOnce({ id: 'msg-1', timestamp: '2023-01-01T00:00:00.000Z' } as any)
        .mockResolvedValueOnce({ id: 'msg-2', timestamp: '2023-01-01T01:00:00.000Z' } as any);

      const results = await db.insertMany([
        { name: 'User1' },
        { name: 'User2' }
      ]);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.acknowledged)).toBe(true);
      expect(mockClient.sendMessage).toHaveBeenCalledTimes(2);
    });

    it('should continue with other documents if one fails', async () => {
      mockClient.sendMessage
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ id: 'msg-2', timestamp: '2023-01-01T01:00:00.000Z' } as any);

      const results = await db.insertMany([
        { name: 'User1' },
        { name: 'User2' }
      ]);

      expect(results).toHaveLength(1); // Only successful insertion
    });
  });

  describe('updateMany', () => {
    beforeEach(() => {
      mockClient.getAllMessages.mockResolvedValue(mockMessages as any);
    });

    it('should update multiple documents', async () => {
      mockClient.editMessage.mockResolvedValue({} as any);

      const result = await db.updateMany(
        { role: 'user' },
        { $set: { active: true } }
      );

      expect(result.matchedCount).toBe(2);
      expect(result.modifiedCount).toBe(2);
      expect(mockClient.editMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteMany', () => {
    beforeEach(() => {
      mockClient.getAllMessages.mockResolvedValue(mockMessages as any);
    });

    it('should delete multiple documents', async () => {
      mockClient.deleteMessage.mockResolvedValue(undefined);

      const result = await db.deleteMany({ role: 'user' });

      expect(result.deletedCount).toBe(2);
      expect(mockClient.deleteMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('countDocuments', () => {
    beforeEach(() => {
      mockClient.getAllMessages.mockResolvedValue(mockMessages as any);
    });

    it('should count all documents', async () => {
      const count = await db.countDocuments();
      expect(count).toBe(3);
    });

    it('should count filtered documents', async () => {
      const count = await db.countDocuments({ role: 'user' });
      expect(count).toBe(2);
    });
  });

  describe('exists', () => {
    beforeEach(() => {
      mockClient.getAllMessages.mockResolvedValue(mockMessages as any);
    });

    it('should return true if documents exist', async () => {
      const exists = await db.exists({ role: 'admin' });
      expect(exists).toBe(true);
    });

    it('should return false if no documents exist', async () => {
      const exists = await db.exists({ role: 'nonexistent' });
      expect(exists).toBe(false);
    });
  });

  describe('findById', () => {
    beforeEach(() => {
      mockClient.getAllMessages.mockResolvedValue(mockMessages as any);
    });

    it('should find document by ID', async () => {
      const result = await db.findById('1');
      
      expect(result).toBeDefined();
      expect(result!._id).toBe('1');
    });
  });

  describe('updateById', () => {
    beforeEach(() => {
      mockClient.getAllMessages.mockResolvedValue([mockMessages[0]] as any);
    });

    it('should update document by ID', async () => {
      mockClient.editMessage.mockResolvedValueOnce({} as any);

      const result = await db.updateById('1', { $set: { name: 'Updated' } });
      
      expect(result.modifiedCount).toBe(1);
    });
  });

  describe('deleteById', () => {
    beforeEach(() => {
      mockClient.getAllMessages.mockResolvedValue([mockMessages[0]] as any);
    });

    it('should delete document by ID', async () => {
      mockClient.deleteMessage.mockResolvedValueOnce(undefined);

      const result = await db.deleteById('1');
      
      expect(result.deletedCount).toBe(1);
    });
  });

  describe('drop', () => {
    beforeEach(() => {
      mockClient.getAllMessages.mockResolvedValue(mockMessages as any);
    });

    it('should delete all documents', async () => {
      mockClient.deleteMessage.mockResolvedValue(undefined);

      await db.drop();

      expect(mockClient.deleteMessage).toHaveBeenCalledTimes(3);
    });
  });

  describe('ping', () => {
    it('should test connection', async () => {
      mockClient.testConnection.mockResolvedValueOnce(true);

      const result = await db.ping();
      
      expect(result).toBe(true);
      expect(mockClient.testConnection).toHaveBeenCalled();
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      expect(() => db.clearCache()).not.toThrow();
    });

    it('should set cache timeout', () => {
      expect(() => db.setCacheTimeout(60000)).not.toThrow();
    });
  });
}); 