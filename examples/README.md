# DiscordDB Examples

This directory contains various examples demonstrating how to use DiscordoDB in different scenarios.

## Prerequisites

Before running any examples, make sure you have:

1. Created a Discord bot and obtained your bot token
2. Set up a Discord channel and obtained its ID
3. Copied the environment variables:

```bash
cp ../.env.example ../.env
# Edit ../.env with your actual Discord credentials
```

## Examples

### Basic Usage (`basic-usage.ts`)

A comprehensive example showing all DiscordDB features:
- CRUD operations
- Query filtering
- Sorting and pagination
- Update operations
- Statistics

```bash
# Run with ts-node
npx ts-node basic-usage.ts

# Or compile and run
npx tsc basic-usage.ts && node basic-usage.js
```

### Express.js REST API (`express-app.ts`)

A full-featured REST API using DiscordDB as the backend:
- User management endpoints
- Task management system
- Statistics and health checks
- Full TypeScript support
- Error handling

#### Setup

```bash
# Install Express dependencies
npm install express cors dotenv @types/express @types/cors tsx

# Run in development mode
npx tsx watch express-app.ts

# Or build and run
npx tsc express-app.ts --target es2022 --module es2022 --moduleResolution node
node express-app.js
```

#### API Endpoints

- **Health Check**: `GET /health`
- **Users**: 
  - `GET /api/users` - List users (supports filtering by role, age)
  - `POST /api/users` - Create user
  - `GET /api/users/:id` - Get user by ID
  - `PUT /api/users/:id` - Update user
  - `DELETE /api/users/:id` - Delete user
- **Tasks**:
  - `GET /api/tasks` - List tasks (supports filtering by user, completion status)
  - `POST /api/tasks` - Create task
  - `PUT /api/tasks/:id` - Update task
  - `DELETE /api/tasks/:id` - Delete task
- **Statistics**: `GET /api/stats` - Get user and task statistics

#### Example API Usage

```bash
# Health check
curl http://localhost:3000/health

# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "age": 30}'

# Get all users
curl http://localhost:3000/api/users

# Create a task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn DiscordDB", "description": "Study the documentation", "userId": "USER_ID_HERE"}'

# Get statistics
curl http://localhost:3000/api/stats
```

## Environment Variables

All examples use environment variables for security. Never hardcode your Discord credentials!

```env
# Required
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CHANNEL_ID=your_channel_id_here

# Optional  
PORT=3000
```

## Notes

- Make sure your Discord bot has the necessary permissions in the target channel
- The bot needs "Send Messages", "Read Message History", and "Manage Messages" permissions
- Discord has rate limits - the examples include basic error handling for this
- Large datasets may take time to load due to Discord's message pagination 