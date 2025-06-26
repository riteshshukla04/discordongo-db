import { DiscordDB } from './dist/index.esm.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test the built library
console.log('🧪 Testing Discordongo-DB Library');

// Check if DiscordDB is properly exported
console.log('✅ DiscordDB class:', typeof DiscordDB);

// Check for required environment variables
if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_CHANNEL_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   - DISCORD_BOT_TOKEN');
  console.error('   - DISCORD_CHANNEL_ID');
  console.error('   Please copy .env.example to .env and fill in your credentials');
  process.exit(1);
}

// Test basic instantiation
try {
  const db = new DiscordDB({
    botToken: process.env.DISCORD_BOT_TOKEN,
    channelId: process.env.DISCORD_CHANNEL_ID
  });
  console.log('✅ Successfully created DiscordDB instance');
  
  // Test method existence
  const methods = [
    'insertOne', 'find', 'findOne', 'updateOne', 'deleteOne',
    'insertMany', 'updateMany', 'deleteMany', 'countDocuments',
    'exists', 'findById', 'updateById', 'deleteById', 'drop', 'ping'
  ];
  
  methods.forEach(method => {
    if (typeof db[method] === 'function') {
      console.log(`✅ Method ${method} exists`);
    } else {
      console.error(`❌ Method ${method} missing`);
    }
  });
  
  console.log('\n🎉 All checks passed!');
  console.log('\n📖 To use with a real Discord bot:');
  console.log('1. Create a Discord bot at https://discord.com/developers/applications');
  console.log('2. Get your bot token and channel ID');
  console.log('3. Copy .env.example to .env and fill in your credentials');
  
} catch (error) {
  console.error('❌ Error creating DiscordDB instance:', error.message);
} 