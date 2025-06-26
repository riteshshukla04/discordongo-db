import { DiscordClient } from '../../client/discord-client';
import { AuthenticationError, NetworkError } from '../../types';

// Mock fetch globally
global.fetch = jest.fn();

describe('DiscordClient', () => {
  const mockConfig = {
      botToken: 'test-token',
      channelId: 'test-channel-id'
  };

  let client: DiscordClient;

  beforeEach(() => {
    client = new DiscordClient(mockConfig);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with valid config', () => {
      expect(() => new DiscordClient(mockConfig)).not.toThrow();
    });

    it('should throw error for missing bot token', () => {
      expect(() => new DiscordClient({ ...mockConfig, botToken: '' }))
        .toThrow(AuthenticationError);
    });

    it('should throw error for missing channel ID', () => {
      expect(() => new DiscordClient({ ...mockConfig, channelId: '' }))
        .toThrow('Channel ID is required');
    });

    it('should use default base URL', () => {
      const client = new DiscordClient(mockConfig);
      expect(client).toBeDefined();
    });

    it('should use custom base URL', () => {
      const customConfig = { ...mockConfig, baseURL: 'https://custom.api.com' };
      expect(() => new DiscordClient(customConfig)).not.toThrow();
    });
  });

  describe('sendMessage', () => {
    const mockMessage = {
      id: 'msg-123',
      content: 'test content',
      timestamp: '2023-01-01T00:00:00.000Z',
      channel_id: 'test-channel-id',
      author: { id: 'bot-123', username: 'testbot' }
    };

    it('should send message successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockMessage)
      });

      const result = await client.sendMessage('test content');
      
      expect(fetch).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/test-channel-id/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bot test-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: 'test content' })
        })
      );
      expect(result).toEqual(mockMessage);
    });

    it('should handle authentication error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValueOnce({ message: 'Invalid token' })
      });

      await expect(client.sendMessage('test')).rejects.toThrow(AuthenticationError);
    });

    it('should handle network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failed'));

      await expect(client.sendMessage('test')).rejects.toThrow(NetworkError);
    });
  });

  describe('getMessages', () => {
    const mockMessages = [
      {
        id: 'msg-1',
        content: 'message 1',
        timestamp: '2023-01-01T00:00:00.000Z',
        channel_id: 'test-channel-id'
      },
      {
        id: 'msg-2',
        content: 'message 2',
        timestamp: '2023-01-01T01:00:00.000Z',
        channel_id: 'test-channel-id'
      }
    ];

    it('should get messages successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockMessages)
      });

      const result = await client.getMessages();
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://discord.com/api/v10/channels/test-channel-id/messages'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': 'Bot test-token'
          }
        })
      );
      expect(result).toEqual(mockMessages);
    });

    it('should handle query parameters', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockMessages)
      });

      await client.getMessages(50, 'before-id', 'after-id');
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50&before=before-id&after=after-id'),
        expect.any(Object)
      );
    });

    it('should respect message limit', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockMessages)
      });

      await client.getMessages(150); // Should be capped at 100
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=100'),
        expect.any(Object)
      );
    });
  });

  describe('editMessage', () => {
    const mockUpdatedMessage = {
      id: 'msg-123',
      content: 'updated content',
      timestamp: '2023-01-01T00:00:00.000Z',
      edited_timestamp: '2023-01-01T01:00:00.000Z'
    };

    it('should edit message successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockUpdatedMessage)
      });

      const result = await client.editMessage('msg-123', 'updated content');
      
      expect(fetch).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/test-channel-id/messages/msg-123',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            'Authorization': 'Bot test-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: 'updated content' })
        })
      );
      expect(result).toEqual(mockUpdatedMessage);
    });

    it('should handle 404 error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValueOnce({ message: 'Message not found' })
      });

      await expect(client.editMessage('invalid-id', 'content')).rejects.toThrow(NetworkError);
    });
  });

  describe('deleteMessage', () => {
    it('should delete message successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      });

      await expect(client.deleteMessage('msg-123')).resolves.not.toThrow();
      
      expect(fetch).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/test-channel-id/messages/msg-123',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Authorization': 'Bot test-token'
          }
        })
      );
    });

    it('should handle deletion errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      await expect(client.deleteMessage('msg-123')).rejects.toThrow(AuthenticationError);
    });
  });

  describe('getAllMessages', () => {
    it('should paginate through all messages', async () => {
      const batch1 = [
        { id: 'msg-3', content: 'message 3' },
        { id: 'msg-2', content: 'message 2' }
      ];
      const batch2 = [
        { id: 'msg-1', content: 'message 1' }
      ];

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(batch1)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(batch2)
        });

      const result = await client.getAllMessages(3);
      
      expect(result).toHaveLength(3);
      expect(result.map(m => m.id)).toEqual(['msg-3', 'msg-2', 'msg-1']);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should respect max messages limit', async () => {
      const messages = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${i}`,
        content: `message ${i}`
      }));

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(messages)
      });

      const result = await client.getAllMessages(50);
      
      expect(result).toHaveLength(50);
      expect(result[0].id).toBe('msg-0');
      expect(result[49].id).toBe('msg-49');
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([])
      });

      const result = await client.testConnection();
      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValueOnce({ message: 'Unauthorized' })
      });

      const result = await client.testConnection();
      expect(result).toBe(false);
    });

    it('should return false for network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await client.testConnection();
      expect(result).toBe(false);
    });
  });
}); 