import { DiscordClient } from './client/discord-client';
import { matchesFilter, sortDocuments, applyProjection, applyPagination } from './utils/filters';
import { applyUpdate, validateUpdate } from './utils/updates';
import {
  DiscordDBConfig,
  DBDocument,
  Filter,
  UpdateFilter,
  QueryOptions,
  InsertResult,
  UpdateResult,
  DeleteResult,
  FindResult,
  ValidationError,
  DiscordDBError
} from './types';

export class DiscordDB {
  private client: DiscordClient;
  private cache: Map<string, DBDocument> = new Map();
  private lastCacheUpdate = 0;
  private cacheTimeout = 30000; // 30 seconds

  constructor(config: DiscordDBConfig) {
    this.client = new DiscordClient(config);
  }

  async insertOne(document: Partial<DBDocument>): Promise<InsertResult> {
    try {
      const docToInsert = this.prepareDocumentForInsert(document);
      const content = JSON.stringify(docToInsert);
      
      if (content.length > 2000) {
        throw new ValidationError('Document too large. Discord messages are limited to 2000 characters.');
      }

      const message = await this.client.sendMessage(content);
      
      const insertedDoc: DBDocument = {
        ...docToInsert,
        _id: docToInsert._id,
        _messageId: message.id,
        _timestamp: message.timestamp
      };

      this.cache.set(insertedDoc._id!, insertedDoc);

      return {
        acknowledged: true,
        insertedId: insertedDoc._id!,
        messageId: message.id
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async find<T = DBDocument>(filter: Filter = {}, options: QueryOptions = {}): Promise<FindResult<T>> {
    try {
      const documents = await this.getAllDocuments();
      
      let filteredDocs = documents.filter(doc => matchesFilter(doc, filter));
      
      if (options.sort) {
        filteredDocs = sortDocuments(filteredDocs, options.sort);
      }

      const total = filteredDocs.length;
      
      filteredDocs = applyPagination(filteredDocs, options.skip, options.limit);
      
      if (options.projection) {
        filteredDocs = applyProjection(filteredDocs, options.projection);
      }

      return {
        documents: filteredDocs as T[],
        total,
        hasMore: options.limit ? (options.skip || 0) + filteredDocs.length < total : false
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async findOne<T = DBDocument>(filter: Filter = {}): Promise<T | null> {
    const result = await this.find<T>(filter, { limit: 1 });
    return result.documents[0] || null;
  }

  async updateOne(filter: Filter, update: UpdateFilter): Promise<UpdateResult> {
    try {
      validateUpdate(update);
      
      const document = await this.findOne(filter);
      if (!document) {
        return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      }

      const updatedDoc = applyUpdate(document, update);
      const content = JSON.stringify(updatedDoc);
      
      if (content.length > 2000) {
        throw new ValidationError('Updated document too large.');
      }

      await this.client.editMessage(document._messageId!, content);
      this.cache.set(document._id!, updatedDoc);

      return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteOne(filter: Filter): Promise<DeleteResult> {
    try {
      const document = await this.findOne(filter);
      if (!document) {
        return { acknowledged: true, deletedCount: 0 };
      }

      await this.client.deleteMessage(document._messageId!);
      this.cache.delete(document._id!);

      return { acknowledged: true, deletedCount: 1 };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async getAllDocuments(): Promise<DBDocument[]> {
    const now = Date.now();
    
    if (now - this.lastCacheUpdate < this.cacheTimeout && this.cache.size > 0) {
      return Array.from(this.cache.values());
    }

    try {
      const messages = await this.client.getAllMessages();
      const documents: DBDocument[] = [];
      
      this.cache.clear();
      
      for (const message of messages) {
        try {
          if (message.content.trim()) {
            const doc = JSON.parse(message.content) as DBDocument;
            doc._messageId = message.id;
            doc._timestamp = message.timestamp;
            
            if (doc._id) {
              documents.push(doc);
              this.cache.set(doc._id, doc);
            }
          }
        } catch {
          continue;
        }
      }
      
      this.lastCacheUpdate = now;
      return documents;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private prepareDocumentForInsert(document: Partial<DBDocument>): DBDocument {
    const doc: DBDocument = { ...document };
    if (!doc._id) {
      doc._id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    return doc;
  }

  private handleError(error: unknown): Error {
    if (error instanceof DiscordDBError) return error;
    if (error instanceof Error) return new DiscordDBError(error.message);
    return new DiscordDBError(`Unknown error: ${String(error)}`);
  }

  // Additional utility methods
  
  async insertMany(documents: Partial<DBDocument>[]): Promise<InsertResult[]> {
    const results: InsertResult[] = [];
    for (const doc of documents) {
      try {
        const result = await this.insertOne(doc);
        results.push(result);
      } catch (error) {
        console.error('Failed to insert document:', error);
      }
    }
    return results;
  }

  async findById<T = DBDocument>(id: string): Promise<T | null> {
    return this.findOne<T>({ _id: id });
  }

  async updateById(id: string, update: UpdateFilter): Promise<UpdateResult> {
    return this.updateOne({ _id: id }, update);
  }

  async updateMany(filter: Filter, update: UpdateFilter): Promise<UpdateResult> {
    try {
      validateUpdate(update);
      const documents = await this.getAllDocuments();
      const matchingDocs = documents.filter(doc => matchesFilter(doc, filter));
      
      let modifiedCount = 0;
      for (const doc of matchingDocs) {
        try {
          const updatedDoc = applyUpdate(doc, update);
          const content = JSON.stringify(updatedDoc);
          
          if (content.length > 2000) {
            console.error(`Skipping update for document ${doc._id}: too large after update`);
            continue;
          }

          await this.client.editMessage(doc._messageId!, content);
          this.cache.set(doc._id!, updatedDoc);
          modifiedCount++;
        } catch (error) {
          console.error(`Failed to update document ${doc._id}:`, error);
        }
      }

      return {
        acknowledged: true,
        matchedCount: matchingDocs.length,
        modifiedCount
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteById(id: string): Promise<DeleteResult> {
    return this.deleteOne({ _id: id });
  }

  async deleteMany(filter: Filter): Promise<DeleteResult> {
    try {
      const documents = await this.getAllDocuments();
      const matchingDocs = documents.filter(doc => matchesFilter(doc, filter));
      
      let deletedCount = 0;
      for (const doc of matchingDocs) {
        try {
          await this.client.deleteMessage(doc._messageId!);
          this.cache.delete(doc._id!);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete document ${doc._id}:`, error);
        }
      }

      return {
        acknowledged: true,
        deletedCount
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async countDocuments(filter: Filter = {}): Promise<number> {
    const documents = await this.getAllDocuments();
    return documents.filter(doc => matchesFilter(doc, filter)).length;
  }

  async exists(filter: Filter): Promise<boolean> {
    const count = await this.countDocuments(filter);
    return count > 0;
  }

  async drop(): Promise<void> {
    await this.deleteMany({});
    this.cache.clear();
  }

  async ping(): Promise<boolean> {
    return this.client.testConnection();
  }

  clearCache(): void {
    this.cache.clear();
    this.lastCacheUpdate = 0;
  }

  setCacheTimeout(timeoutMs: number): void {
    this.cacheTimeout = timeoutMs;
  }
} 