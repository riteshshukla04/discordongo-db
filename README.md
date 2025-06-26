# DiscordongoDB

A TypeScript library that uses Discord as a database with MongoDB-like operations. Store and query data using Discord messages as your backend!

## Features

- 🔥 **MongoDB-like API** - Familiar syntax for developers
- 🚀 **Full TypeScript Support** - Complete type safety
- 📱 **Cross-platform** - Works with Node.js, React, React Native
- 🔍 **Advanced Filtering** - Support for complex queries with operators
- 📊 **Sorting & Pagination** - Efficient data retrieval
- 🔄 **CRUD Operations** - Create, Read, Update, Delete
- ⚡ **Caching** - Built-in caching for better performance
- 🛡️ **Error Handling** - Comprehensive error types

## Installation

```bash
yarn add discordongo-db
# or
npm install discordongo-db
```

## Quick Start

```typescript
import { DiscordDB } from 'discordongo-db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the database
const db = new DiscordDB({
  botToken: process.env.DISCORD_BOT_TOKEN!,
  channelId: process.env.DISCORD_CHANNEL_ID!
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

## Setup

### 1. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new Application
3. Go to "Bot" section and create a bot
4. Copy the bot token
5. Invite the bot to your server with "Send Messages", "Read Message History", and "Manage Messages" permissions

### 2. Get Channel ID

1. Enable Developer Mode in Discord
2. Right-click on the channel you want to use
3. Copy the Channel ID

### 3. Environment Variables

Create a `.env` file in your project root:

```bash
# Copy from .env.example
cp .env.example .env
```

Then fill in your Discord credentials:

```env
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CHANNEL_ID=your_discord_channel_id_here
```

⚠️ **Never commit your `.env` file to version control!** Add it to your `.gitignore`.

## API Reference

### Constructor

```typescript
const db = new DiscordDB({
  botToken: string;      // Your Discord bot token (use process.env.DISCORD_BOT_TOKEN)
  channelId: string;     // Channel ID to use as database (use process.env.DISCORD_CHANNEL_ID)
  baseURL?: string;      // Optional: Discord API base URL
});
```

### Insert Operations

#### insertOne(document)

```typescript
interface User {
  name: string;
  email: string;
  age: number;
}

const result = await db.insertOne({
  name: 'Alice',
  email: 'alice@example.com',
  age: 25
});

console.log(result.insertedId); // Generated document ID
```

### Find Operations

#### find(filter, options)

```typescript
// Find all users
const allUsers = await db.find<User>();

// Find with filter
const adults = await db.find<User>({ age: { $gte: 18 } });

// Find with options
const result = await db.find<User>(
  { age: { $gte: 18 } },
  {
    sort: { age: -1 },
    limit: 10,
    skip: 0,
    projection: { name: 1, email: 1 }
  }
);
```

#### findOne(filter)

```typescript
const user = await db.findOne<User>({ email: 'alice@example.com' });
```

### Update Operations

#### updateOne(filter, update)

```typescript
// Using $set operator
await db.updateOne(
  { email: 'alice@example.com' },
  { $set: { age: 26 } }
);

// Using $inc operator
await db.updateOne(
  { email: 'alice@example.com' },
  { $inc: { age: 1 } }
);

// Direct object update
await db.updateOne(
  { email: 'alice@example.com' },
  { age: 27, name: 'Alice Smith' }
);
```

### Delete Operations

#### deleteOne(filter)

```typescript
await db.deleteOne({ email: 'alice@example.com' });
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

## Usage Examples

### Express.js Integration

```typescript
import express from 'express';
import { DiscordDB } from 'discordongo-db';

const app = express();
const db = new DiscordDB({
  botToken: process.env.DISCORD_BOT_TOKEN!,
  channelId: process.env.DISCORD_CHANNEL_ID!
});

app.use(express.json());

// Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await db.find();
    res.json(users.documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
app.post('/users', async (req, res) => {
  try {
    const result = await db.insertOne(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
app.put('/users/:id', async (req, res) => {
  try {
    const result = await db.updateOne(
      { _id: req.params.id },
      { $set: req.body }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
app.delete('/users/:id', async (req, res) => {
  try {
    const result = await db.deleteOne({ _id: req.params.id });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### React Usage

```typescript
import React, { useState, useEffect } from 'react';
import { DiscordDB } from 'discordongo-db';

const db = new DiscordDB({
  botToken: process.env.REACT_APP_DISCORD_BOT_TOKEN!,
  channelId: process.env.REACT_APP_DISCORD_CHANNEL_ID!
});

interface User {
  _id?: string;
  name: string;
  email: string;
}

function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const result = await db.find<User>();
      setUsers(result.documents);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userData: Omit<User, '_id'>) => {
    try {
      await db.insertOne(userData);
      await loadUsers(); // Refresh the list
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await db.deleteOne({ _id: id });
      await loadUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Users</h2>
      {users.map(user => (
        <div key={user._id}>
          <span>{user.name} ({user.email})</span>
          <button onClick={() => deleteUser(user._id!)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default UserList;
```

### React Native Usage

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { DiscordDB } from 'discordongo-db';

const db = new DiscordDB({
  botToken: 'YOUR_BOT_TOKEN',
  channelId: 'YOUR_CHANNEL_ID'
});

export default function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const result = await db.find();
      setUsers(result.documents);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const renderUser = ({ item }) => (
    <View style={{ padding: 10, borderBottomWidth: 1 }}>
      <Text>{item.name}</Text>
      <Text>{item.email}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Users</Text>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item._id}
      />
    </View>
  );
}
```

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