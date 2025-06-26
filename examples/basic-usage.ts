import { DiscordDB } from '../src';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Example usage of DiscordDB
async function basicExample() {
  // Check for required environment variables
  if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_CHANNEL_ID) {
    console.error('❌ Missing required environment variables:');
    console.error('   - DISCORD_BOT_TOKEN');
    console.error('   - DISCORD_CHANNEL_ID');
    console.error('   Please copy .env.example to .env and fill in your credentials');
    return;
  }

  // Initialize the database
  const db = new DiscordDB({
    botToken: process.env.DISCORD_BOT_TOKEN,
    channelId: process.env.DISCORD_CHANNEL_ID
  });

  console.log('🚀 Starting DiscordDB Basic Example');

  try {
    // Test connection
    console.log('📡 Testing connection...');
    const connected = await db.ping();
    if (!connected) {
      throw new Error('Failed to connect to Discord');
    }
    console.log('✅ Connected successfully!');

    // Insert some sample data
    console.log('📝 Inserting sample users...');
    const users = [
      { name: 'John Doe', email: 'john@example.com', age: 30, role: 'admin' },
      { name: 'Jane Smith', email: 'jane@example.com', age: 25, role: 'user' },
      { name: 'Bob Johnson', email: 'bob@example.com', age: 35, role: 'user' },
      { name: 'Alice Brown', email: 'alice@example.com', age: 28, role: 'moderator' }
    ];

    for (const user of users) {
      const result = await db.insertOne(user);
      console.log(`✅ Inserted user: ${user.name} (ID: ${result.insertedId})`);
    }

    // Find all users
    console.log('\n📋 Finding all users...');
    const allUsers = await db.find();
    console.log(`Found ${allUsers.documents.length} users:`);
    allUsers.documents.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Age: ${user.age}, Role: ${user.role}`);
    });

    // Find users with filtering
    console.log('\n🔍 Finding users older than 28...');
    const olderUsers = await db.find({ age: { $gt: 28 } });
    console.log(`Found ${olderUsers.documents.length} users older than 28:`);
    olderUsers.documents.forEach(user => {
      console.log(`  - ${user.name} - Age: ${user.age}`);
    });

    // Find users with role 'user'
    console.log('\n👤 Finding users with role "user"...');
    const regularUsers = await db.find({ role: 'user' });
    console.log(`Found ${regularUsers.documents.length} regular users:`);
    regularUsers.documents.forEach(user => {
      console.log(`  - ${user.name}`);
    });

    // Find with complex query
    console.log('\n🔎 Finding users aged 25-35 with email containing "example.com"...');
    const filteredUsers = await db.find({
      $and: [
        { age: { $gte: 25, $lte: 35 } },
        { email: { $regex: 'example\\.com' } }
      ]
    } as any);
    console.log(`Found ${filteredUsers.documents.length} users matching criteria:`);
    filteredUsers.documents.forEach(user => {
      console.log(`  - ${user.name} - Age: ${user.age}, Email: ${user.email}`);
    });

    // Find with sorting and pagination
    console.log('\n📊 Finding users sorted by age (descending), limit 2...');
    const sortedUsers = await db.find(
      {},
      {
        sort: { age: -1 },
        limit: 2
      }
    );
    console.log(`Found ${sortedUsers.documents.length} users (sorted by age desc):`);
    sortedUsers.documents.forEach(user => {
      console.log(`  - ${user.name} - Age: ${user.age}`);
    });

    // Find one user
    console.log('\n🎯 Finding one user with email john@example.com...');
    const johnUser = await db.findOne({ email: 'john@example.com' });
    if (johnUser) {
      console.log(`Found user: ${johnUser.name} - Age: ${johnUser.age}`);
    } else {
      console.log('User not found');
    }

    // Update a user
    console.log('\n📝 Updating John\'s age...');
    const updateResult = await db.updateOne(
      { email: 'john@example.com' },
      { $set: { age: 31 }, $push: { tags: 'updated' } }
    );
    console.log(`Update result: Modified ${updateResult.modifiedCount} document(s)`);

    // Verify the update
    const updatedJohn = await db.findOne({ email: 'john@example.com' });
    if (updatedJohn) {
      console.log(`John's updated age: ${updatedJohn.age}`);
    }

    // Update with increment
    console.log('\n🔢 Incrementing Jane\'s age by 2...');
    await db.updateOne(
      { email: 'jane@example.com' },
      { $inc: { age: 2 } }
    );

    const updatedJane = await db.findOne({ email: 'jane@example.com' });
    if (updatedJane) {
      console.log(`Jane's new age: ${updatedJane.age}`);
    }

    // Count documents
    console.log('\n🔢 Counting documents...');
    const totalCount = await db.countDocuments();
    const adminCount = await db.countDocuments({ role: 'admin' });
    console.log(`Total users: ${totalCount}`);
    console.log(`Admin users: ${adminCount}`);

    // Check if documents exist
    console.log('\n🔍 Checking if moderator exists...');
    const hasModerator = await db.exists({ role: 'moderator' });
    console.log(`Has moderator: ${hasModerator}`);

    // Delete a user
    console.log('\n🗑️  Deleting Bob Johnson...');
    const deleteResult = await db.deleteOne({ email: 'bob@example.com' });
    console.log(`Delete result: Deleted ${deleteResult.deletedCount} document(s)`);

    // Final count
    const finalCount = await db.countDocuments();
    console.log(`\n📊 Final user count: ${finalCount}`);

    console.log('\n🎉 Basic example completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  basicExample();
}

export { basicExample }; 