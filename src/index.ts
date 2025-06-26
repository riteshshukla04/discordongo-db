// Main exports
export { DiscordDB } from './discord-db';

// Type exports
export type {
  DiscordDBConfig,
  DBDocument,
  Filter,
  FilterOperators,
  FilterValue,
  UpdateFilter,
  UpdateOperators,
  QueryOptions,
  SortOption,
  SortDirection,
  InsertResult,
  UpdateResult,
  DeleteResult,
  FindResult,
  DiscordMessage
} from './types';

// Error exports
export {
  DiscordDBError,
  ValidationError,
  AuthenticationError,
  NetworkError
} from './types';

// Utility exports (for advanced usage)
export { matchesFilter, sortDocuments, applyProjection, applyPagination } from './utils/filters';
export { applyUpdate, validateUpdate } from './utils/updates';

// Client export (for advanced usage)
export { DiscordClient } from './client/discord-client';

// Default export
import { DiscordDB } from './discord-db';
export default DiscordDB; 