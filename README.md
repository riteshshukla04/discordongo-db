# DiscordongoDB 🔐

A TypeScript library that uses Discord as a database with MongoDB-like operations, now with **optional encryption support**!

## ✨ Features

- 🔐 **NEW: Optional Encryption** - Automatically encrypt/decrypt your data with AES-256
- 🚀 **MongoDB-like API** - Familiar syntax for developers
- 🔍 **Advanced Filtering** - Support for complex queries with operators
- 📊 **Sorting & Pagination** - Efficient data retrieval
- 🔄 **CRUD Operations** - Create, Read, Update, Delete
- ⚡ **Caching** - Built-in caching for better performance
- 🛡️ **Error Handling** - Comprehensive error types
- 🌐 **Cross-platform** - Works with Node.js, React, React Native

## 🔐 Encryption

DiscordDB now supports optional AES-256 encryption to secure your sensitive data:

### Basic Usage (No Encryption)

```typescript
import { DiscordDB } from 'discordongo-db';

const db = new DiscordDB({
  botToken: 'your-bot-token',
  channelId: 'your-channel-id'
});

// Data stored as plain text (traditional usage)
await db.insertOne({ name: 'Alice', email: 'alice@example.com' });
```

### With Encryption Enabled

```typescript
import { DiscordDB } from 'discordongo-db';

const db = new DiscordDB({
  botToken: 'your-bot-token',
  channelId: 'your-channel-id',
  encryptionKey: 'your-secret-encryption-key' // This enables encryption
});

// Data automatically encrypted before storage
await db.insertOne({ 
  ssn: '123-45-6789',
  creditCard: '4111-1111-1111-1111',
  personalData: 'highly confidential'
});

// Data automatically decrypted when retrieved
const user = await db.findOne({ ssn: '123-45-6789' });
console.log(user.personalData); // 'highly confidential'
```

### Environment-Based Configuration

```typescript
const db = new DiscordDB({
  botToken: process.env.DISCORD_BOT_TOKEN!,
  channelId: process.env.DISCORD_CHANNEL_ID!,
  encryptionKey: process.env.ENCRYPTION_KEY // Optional - encryption only if set
});

// Check if encryption is enabled
if (db.isEncryptionEnabled()) {
  console.log('🔒 Data will be encrypted');
} else {
  console.log('📝 Using plain text storage');
}
```

### Key Benefits of Encryption

- **🔒 Automatic**: Encryption/decryption happens transparently
- **🔄 Backward Compatible**: Can read existing non-encrypted data
- **⚡ Performance**: Minimal overhead with intelligent caching
- **🛡️ Security**: AES-256-CBC encryption with random IVs
- **🔧 Optional**: Easy to enable/disable with configuration

### Advanced Encryption Usage

```typescript
// Import encryption utilities for manual use
import { encrypt, decrypt, EncryptionService } from 'discordongo-db';

// Manual encryption
const encrypted = encrypt('sensitive data', 'my-key');
const decrypted = decrypt(encrypted, 'my-key');

// Custom encryption service
const encryptionService = new EncryptionService('my-key', {
  algorithm: 'aes-256-cbc'
});
```

## 📚 Quick Start

### Installation

```bash
yarn add discordongo-db
# or
npm install discordongo-db
```

### Setup

1. Create a Discord bot and get your bot token
2. Create a Discord channel and get the channel ID
3. Add the bot to your server with message permissions

### Basic Example

```typescript
import { DiscordDB } from 'discordongo-db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the database
const db = new DiscordDB({
  botToken: process.env.DISCORD_BOT_TOKEN!,
  channelId: process.env.DISCORD_CHANNEL_ID!,
  encryptionKey: process.env.ENCRYPTION_KEY
});

// Insert a document
const result = await db.insertOne({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// Find documents
const users = await db.find({ age: { $gte: 18 } });

// Update a document
await db.updateOne(
  { email: 'john@example.com' },
  { $set: { age: 31 } }
);

// Delete a document
await db.deleteOne({ email: 'john@example.com' });
```

## 🔧 API Reference

### Configuration Options

```typescript
interface DiscordDBConfig {
  botToken: string;           // Your Discord bot token
  channelId: string;          // Discord channel ID for storage
  baseURL?: string;           // Custom Discord API URL (optional)
  encryptionKey?: string;     // Encryption key (optional, enables encryption)
}
```

### Core Methods

- `insertOne(document)` - Insert a single document
- `find(filter, options)` - Find documents with filtering
- `findOne(filter)` - Find a single document
- `updateOne(filter, update)` - Update a single document
- `deleteOne(filter)` - Delete a single document
- `isEncryptionEnabled()` - Check if encryption is enabled

## Query Operators

### Comparison Operators

```typescript
// Equal
{ age: 25 }
{ age: { $eq: 25 } }

// Not equal
{ age: { $ne: 25 } }

// Greater than
{ age: { $gt: 18 } }

// Greater than or equal
{ age: { $gte: 18 } }

// Less than
{ age: { $lt: 65 } }

// Less than or equal
{ age: { $lte: 65 } }

// In array
{ status: { $in: ['active', 'pending'] } }

// Not in array
{ status: { $nin: ['inactive', 'banned'] } }
```

### Logical Operators

```typescript
// AND
{ $and: [{ age: { $gte: 18 } }, { age: { $lt: 65 } }] }

// OR
{ $or: [{ status: 'active' }, { priority: 'high' }] }

// NOT
{ age: { $not: { $lt: 18 } } }
```

### Element Operators

```typescript
// Field exists
{ email: { $exists: true } }

// Field doesn't exist
{ phone: { $exists: false } }
```

### String Operators

```typescript
// Regular expression
{ name: { $regex: /^john/i } }
{ name: { $regex: '^john', $options: 'i' } }
```

## Update Operators

### Field Update Operators

```typescript
// Set field value
{ $set: { name: 'John Doe', age: 30 } }

// Remove field
{ $unset: { temporaryField: 1 } }

// Increment numeric field
{ $inc: { age: 1, score: 10 } }
```

### Array Update Operators

```typescript
// Add element to array
{ $push: { tags: 'new-tag' } }

// Remove element from array
{ $pull: { tags: 'old-tag' } }

// Add element to array if not exists
{ $addToSet: { tags: 'unique-tag' } }
```

## Examples

### Basic Usage

See the complete example in [`examples/basic-usage.ts`](./examples/basic-usage.ts) for a comprehensive demonstration of all DiscordDB features.

### Express.js REST API

DiscordDB works perfectly as a backend for web applications. Check out the full Express.js example in [`examples/express-app.ts`](./examples/express-app.ts).

The Express example includes:
- **User Management API** - CRUD operations for users
- **Task Management API** - Todo-like task system  
- **Statistics Endpoint** - Get counts and completion rates
- **Full TypeScript Support** - Complete type safety
- **Error Handling** - Comprehensive error responses
- **Environment Variables** - Secure credential management

#### Running the Express Example

```bash
cd examples
npm install
cp ../.env.example .env  # Fill in your Discord credentials
npm run dev  # Start development server
```

API endpoints will be available at:
- `GET /health` - Health check
- `GET /api/users` - List users  
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task  
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/stats` - Get statistics

## Error Handling

```typescript
import { DiscordDBError, ValidationError, NetworkError } from 'discordongo-db';

try {
  await db.insertOne({ name: 'John' });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else if (error instanceof DiscordDBError) {
    console.error('DiscordDB error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Limitations

- **Message Size**: Documents are limited to 2000 characters (Discord message limit)
- **Rate Limits**: Discord API rate limits apply
- **Message History**: Limited by Discord's message history retention
- **Concurrent Access**: No built-in locking mechanism for concurrent writes

## Development & Publishing

### Development Setup

```bash
# Install dependencies
yarn install

# Build the library
yarn build

# Run tests
yarn test

# Run linter
yarn lint

# Run tests with real Discord (requires .env)
yarn test:real
```

### Publishing

This project uses `release-it` for automated publishing:

```bash
# Patch release (1.0.0 -> 1.0.1)
yarn release:patch

# Minor release (1.0.0 -> 1.1.0)  
yarn release:minor

# Major release (1.0.0 -> 2.0.0)
yarn release:major

# Custom release
yarn release
```

The release process will:
1. Run tests and build
2. Bump version in package.json
3. Create git tag and commit
4. Push to GitHub
5. Publish to npm
6. Create GitHub release

### Environment Variables for Development

Create a `.env` file for testing:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CHANNEL_ID=your_channel_id_here
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. **Environment Variables**: Never commit hardcoded credentials
2. **Testing**: Add tests for new features
3. **Documentation**: Update README for API changes
4. **TypeScript**: Maintain full type safety
5. **Linting**: Follow the established code style 