import { DiscordMessage, DiscordDBConfig, NetworkError, AuthenticationError } from '../types';

export class DiscordClient {
  private config: DiscordDBConfig;
  private baseURL: string;

  constructor(config: DiscordDBConfig) {
    this.config = config;
    this.baseURL = config.baseURL || 'https://discord.com/api/v10';
    
    if (!config.botToken) {
      throw new AuthenticationError('Bot token is required');
    }
    
    if (!config.channelId) {
      throw new Error('Channel ID is required');
    }
  }

  /**
   * Send a message to the Discord channel
   */
  async sendMessage(content: string): Promise<DiscordMessage> {
    const url = `${this.baseURL}/channels/${this.config.channelId}/messages`;
    
    try {
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${this.config.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      return data as DiscordMessage;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get messages from the Discord channel
   */
  async getMessages(limit = 100, before?: string, after?: string): Promise<DiscordMessage[]> {
    const params = new URLSearchParams();
    params.set('limit', Math.min(limit, 100).toString());
    
    if (before) params.set('before', before);
    if (after) params.set('after', after);

    const url = `${this.baseURL}/channels/${this.config.channelId}/messages?${params.toString()}`;

    try {
      const response = await this.makeRequest(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bot ${this.config.botToken}`,
        },
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      return data as DiscordMessage[];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Edit a message in the Discord channel
   */
  async editMessage(messageId: string, content: string): Promise<DiscordMessage> {
    const url = `${this.baseURL}/channels/${this.config.channelId}/messages/${messageId}`;

    try {
      const response = await this.makeRequest(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bot ${this.config.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      return data as DiscordMessage;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a message from the Discord channel
   */
  async deleteMessage(messageId: string): Promise<void> {
    const url = `${this.baseURL}/channels/${this.config.channelId}/messages/${messageId}`;

    try {
      const response = await this.makeRequest(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bot ${this.config.botToken}`,
        },
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all messages (with pagination handling)
   */
  async getAllMessages(maxMessages = 1000): Promise<DiscordMessage[]> {
    const allMessages: DiscordMessage[] = [];
    let before: string | undefined;
    const batchSize = 100;

    while (allMessages.length < maxMessages) {
      const remaining = maxMessages - allMessages.length;
      const limit = Math.min(remaining, batchSize);
      
      const messages = await this.getMessages(limit, before);
      
      if (messages.length === 0) {
        break; // No more messages available
      }

      allMessages.push(...messages);
      
      // Set the 'before' parameter for the next iteration
      before = messages[messages.length - 1].id;
    }

    return allMessages.slice(0, maxMessages);
  }

  /**
   * Make HTTP request with proper error handling
   */
  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      throw new NetworkError(`Failed to make request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle HTTP error responses
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Ignore JSON parsing errors
    }

    switch (response.status) {
      case 401:
        throw new AuthenticationError(`Authentication failed: ${errorMessage}`);
      case 403:
        throw new AuthenticationError(`Forbidden: ${errorMessage}`);
      case 404:
        throw new NetworkError(`Not found: ${errorMessage}`);
      case 429:
        throw new NetworkError(`Rate limited: ${errorMessage}`);
      default:
        throw new NetworkError(errorMessage);
    }
  }

  /**
   * Handle general errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new NetworkError(`Unknown error: ${String(error)}`);
  }

  /**
   * Test the connection and permissions
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getMessages(1);
      return true;
    } catch (error) {
      return false;
    }
  }
} 