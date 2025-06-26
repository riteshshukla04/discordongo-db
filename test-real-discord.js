import { DiscordDB } from './dist/index.esm.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testRealDiscord() {
  console.log('🚀 Testing real Discord integration with Discordongo-DB...');
  
  // Check for required environment variables
  if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_CHANNEL_ID) {
    console.error('❌ Missing required environment variables:');
    console.error('   - DISCORD_BOT_TOKEN');
    console.error('   - DISCORD_CHANNEL_ID');
    console.error('   Please copy .env.example to .env and fill in your credentials');
    return;
  }
  
  const db = new DiscordDB({
    botToken: process.env.DISCORD_BOT_TOKEN,
    channelId: process.env.DISCORD_CHANNEL_ID
  });

  try {
    // Test connection
    console.log('📡 Testing connection...');
    const isConnected = await db.ping();
    console.log('Connection result:', isConnected);

    if (isConnected) {
      console.log('✅ Successfully connected to Discord!');
      
      // Insert a test message
      console.log('📝 Inserting test message...');
      const testDoc = {
        name: 'TestMessage_' + Date.now(),
        message: 'Hello from Discordongo-DB!',
        timestamp: new Date().toISOString()
      };
      
      const insertResult = await db.insertOne(testDoc);
      console.log('Insert result:', insertResult);
      
      // Find the message
      console.log('🔍 Finding the message...');
      const foundDoc = await db.findById(insertResult.insertedId);
      console.log('Found document:', foundDoc);
      
      // Clean up
      console.log('🧹 Cleaning up...');
      const deleteResult = await db.deleteById(insertResult.insertedId);
      console.log('Delete result:', deleteResult);
      
      console.log('✅ All tests passed!');
    } else {
      console.log('❌ Failed to connect to Discord');
    }
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testRealDiscord(); 