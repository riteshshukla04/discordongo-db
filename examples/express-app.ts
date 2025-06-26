import express from 'express';
import cors from 'cors';
import { DiscordDB } from '../dist/index.esm.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Check for required environment variables
if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_CHANNEL_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   - DISCORD_BOT_TOKEN');
  console.error('   - DISCORD_CHANNEL_ID');
  console.error('   Please copy .env.example to .env and fill in your credentials');
  process.exit(1);
}

// Initialize DiscordDB
const db = new DiscordDB({
  botToken: process.env.DISCORD_BOT_TOKEN,
  channelId: process.env.DISCORD_CHANNEL_ID,
  encryptionKey: 'my-super-secret-encryption-key-2024'
});

// Types
interface User {
  id?: string;
  name: string;
  email: string;
  age: number;
  role?: string;
  createdAt?: string;
}

interface Task {
  id?: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const isConnected = await db.ping();
    res.json({ 
      status: 'ok', 
      discordConnected: isConnected,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// User Routes
app.get('/api/users', async (req, res) => {
  try {
    const { limit, skip, role, minAge, maxAge } = req.query;
    
    // Build filter object
    const filter: any = {};
    if (role) filter.role = role;
    if (minAge || maxAge) {
      filter.age = {};
      if (minAge) filter.age.$gte = parseInt(minAge as string);
      if (maxAge) filter.age.$lte = parseInt(maxAge as string);
    }

    const options: any = {};
    if (limit) options.limit = parseInt(limit as string);
    if (skip) options.skip = parseInt(skip as string);
    options.sort = { createdAt: -1 };

    const result = await db.find<User>(filter, options);
    res.json({
      users: result.documents,
      total: result.documents.length,
      hasMore: result.documents.length === (options.limit || 0)
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await db.findById<User>(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, age, role = 'user' } = req.body;
    
    // Validation
    if (!name || !email || !age) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, age' 
      });
    }

    // Check if user already exists
    const existingUser = await db.findOne<User>({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const userData: User = {
      name,
      email,
      age: parseInt(age),
      role,
      createdAt: new Date().toISOString()
    };

    const result = await db.insertOne(userData);
    const newUser = await db.findById<User>(result.insertedId);
    
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, age, role } = req.body;
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (age) updateData.age = parseInt(age);
    if (role) updateData.role = role;
    updateData.updatedAt = new Date().toISOString();

    const result = await db.updateById(req.params.id, { $set: updateData });
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await db.findById<User>(req.params.id);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const result = await db.deleteById(req.params.id);
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Task Routes
app.get('/api/tasks', async (req, res) => {
  try {
    const { userId, completed, limit, skip } = req.query;
    
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (completed !== undefined) filter.completed = completed === 'true';

    const options: any = {};
    if (limit) options.limit = parseInt(limit as string);
    if (skip) options.skip = parseInt(skip as string);
    options.sort = { createdAt: -1 };

    const result = await db.find<Task>(filter, options);
    res.json({
      tasks: result.documents,
      total: result.documents.length
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch tasks',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, userId } = req.body;
    
    if (!title || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, userId' 
      });
    }

    // Verify user exists
    const user = await db.findById<User>(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const taskData: Task = {
      title,
      description: description || '',
      completed: false,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await db.insertOne(taskData);
    const newTask = await db.findById<Task>(result.insertedId);
    
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create task',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { title, description, completed } = req.body;
    const updateData: any = { updatedAt: new Date().toISOString() };
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (completed !== undefined) updateData.completed = completed;

    const result = await db.updateById(req.params.id, { $set: updateData });
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await db.findById<Task>(req.params.id);
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update task',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const result = await db.deleteById(req.params.id);
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete task',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Statistics endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const totalUsers = await db.countDocuments<User>({});
    const totalTasks = await db.countDocuments<Task>({});
    const completedTasks = await db.countDocuments<Task>({ completed: true });
    const pendingTasks = await db.countDocuments<Task>({ completed: false });

    res.json({
      users: {
        total: totalUsers
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Express server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Endpoints:`);
  console.log(`   GET    /api/users          - List users`);
  console.log(`   POST   /api/users          - Create user`);
  console.log(`   GET    /api/users/:id      - Get user by ID`);
  console.log(`   PUT    /api/users/:id      - Update user`);
  console.log(`   DELETE /api/users/:id      - Delete user`);
  console.log(`   GET    /api/tasks          - List tasks`);
  console.log(`   POST   /api/tasks          - Create task`);
  console.log(`   PUT    /api/tasks/:id      - Update task`);
  console.log(`   DELETE /api/tasks/:id      - Delete task`);
  console.log(`   GET    /api/stats          - Get statistics`);
  
  try {
    const isConnected = await db.ping();
    if (isConnected) {
      console.log('✅ Successfully connected to Discord!');
    } else {
      console.log('⚠️  Discord connection test failed');
    }
  } catch (error) {
    console.error('❌ Discord connection error:', error);
  }
});

export default app; 