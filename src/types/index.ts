// Discord API Types
export interface DiscordMessage {
  id: string;
  channel_id: string;
  content: string;
  timestamp: string;
  edited_timestamp: string | null;
  author: {
    id: string;
    username: string;
    avatar: string | null;
    discriminator: string;
    public_flags: number;
    flags: number;
    bot?: boolean;
    banner: string | null;
    accent_color: string | null;
    global_name: string | null;
    avatar_decoration_data: any;
    collectibles: any;
    banner_color: string | null;
    clan: any;
    primary_guild: any;
  };
  type: number;
  mentions: any[];
  mention_roles: string[];
  attachments: any[];
  embeds: any[];
  flags: number;
  components: any[];
  pinned: boolean;
  mention_everyone: boolean;
  tts: boolean;
}

// Database Configuration
export interface DiscordDBConfig {
  botToken: string;
  channelId: string;
  baseURL?: string;
}

// Database Document Interface
export interface DBDocument {
  _id?: string;
  _timestamp?: string;
  _messageId?: string;
  [key: string]: any;
}

// Query Filter Types (MongoDB-like)
export type FilterValue = string | number | boolean | Date | RegExp | FilterValue[] | FilterOperators;

export interface FilterOperators {
  $eq?: any;
  $ne?: any;
  $gt?: any;
  $gte?: any;
  $lt?: any;
  $lte?: any;
  $in?: any[];
  $nin?: any[];
  $exists?: boolean;
  $regex?: string | RegExp;
  $options?: string;
  $and?: Filter[];
  $or?: Filter[];
  $not?: Filter;
}

export type Filter = {
  [key: string]: FilterValue;
};

// Update Operations
export interface UpdateOperators {
  $set?: Partial<DBDocument>;
  $unset?: { [key: string]: 1 | true };
  $inc?: { [key: string]: number };
  $push?: { [key: string]: any };
  $pull?: { [key: string]: any };
  $addToSet?: { [key: string]: any };
}

export type UpdateFilter = UpdateOperators | Partial<DBDocument>;

// Sort Options
export type SortDirection = 1 | -1 | 'asc' | 'desc';
export type SortOption = {
  [key: string]: SortDirection;
};

// Query Options
export interface QueryOptions {
  limit?: number;
  skip?: number;
  sort?: SortOption;
  projection?: { [key: string]: 1 | 0 };
}

// Results
export interface InsertResult {
  acknowledged: boolean;
  insertedId: string;
  messageId: string;
}

export interface UpdateResult {
  acknowledged: boolean;
  matchedCount: number;
  modifiedCount: number;
  upsertedId?: string;
}

export interface DeleteResult {
  acknowledged: boolean;
  deletedCount: number;
}

export interface FindResult<T = DBDocument> {
  documents: T[];
  total: number;
  hasMore: boolean;
}

// Error Types
export class DiscordDBError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DiscordDBError';
  }
}

export class ValidationError extends DiscordDBError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends DiscordDBError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR');
  }
}

export class NetworkError extends DiscordDBError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR');
  }
} 