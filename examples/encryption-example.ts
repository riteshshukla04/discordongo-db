import { DiscordDB } from '../src/index';

async function encryptionExample() {
  console.log('🔐 DiscordDB Encryption Example');
  console.log('================================\n');

  // Configuration without encryption (traditional usage)
  const configWithoutEncryption = {
    botToken: process.env.DISCORD_BOT_TOKEN!,
    channelId: process.env.DISCORD_CHANNEL_ID!
  };

  // Configuration with encryption (new feature)
  const configWithEncryption = {
    botToken: process.env.DISCORD_BOT_TOKEN!,
    channelId: process.env.DISCORD_CHANNEL_ID!,
    encryptionKey: 'my-super-secret-encryption-key-2024' // Optional encryption key
  };

  try {
    // Example 1: Using DiscordDB without encryption
    console.log('📝 Example 1: Traditional usage (no encryption)');
    const dbNoEncryption = new DiscordDB(configWithoutEncryption);
    console.log(`Encryption enabled: ${dbNoEncryption.isEncryptionEnabled()}`);

    // Insert a document without encryption
    const user1 = {
      username: 'alice',
      email: 'alice@example.com',
      preferences: {
        theme: 'dark',
        notifications: true
      }
    };

    const result1 = await dbNoEncryption.insertOne(user1);
    console.log(`✅ Inserted user without encryption: ${result1.insertedId}\n`);

    // Example 2: Using DiscordDB with encryption
    console.log('🔒 Example 2: With encryption enabled');
    const dbWithEncryption = new DiscordDB(configWithEncryption);
    console.log(`Encryption enabled: ${dbWithEncryption.isEncryptionEnabled()}`);

    // Insert sensitive data with encryption
    const sensitiveUser = {
      username: 'bob',
      email: 'bob@example.com',
      sensitiveData: {
        ssn: '123-45-6789',
        creditCard: '4111-1111-1111-1111',
        personalNotes: 'This is highly confidential information'
      },
      preferences: {
        theme: 'light',
        notifications: false
      }
    };

    const result2 = await dbWithEncryption.insertOne(sensitiveUser);
    console.log(`✅ Inserted sensitive user with encryption: ${result2.insertedId}`);

    // Example 3: Querying encrypted data
    console.log('\n🔍 Example 3: Querying encrypted data');
    const encryptedUsers = await dbWithEncryption.find({ 
      'sensitiveData.ssn': { $exists: true } 
    });
    
    console.log(`Found ${encryptedUsers.documents.length} users with sensitive data`);
    encryptedUsers.documents.forEach(user => {
      console.log(`- ${user.username}: ${user.email}`);
      // Note: sensitive data is automatically decrypted when retrieved
    });

    // Example 4: Mixing encrypted and non-encrypted data
    console.log('\n🔄 Example 4: Reading existing non-encrypted data with encryption enabled');
    
    // The encrypted DB can still read old non-encrypted data
    const allUsersFromEncryptedDB = await dbWithEncryption.find();
    console.log(`Total users accessible from encrypted DB: ${allUsersFromEncryptedDB.documents.length}`);

    // Example 5: Complex encrypted documents
    console.log('\n📊 Example 5: Complex encrypted documents');
    const complexDocument = {
      type: 'financial_record',
      user_id: 'user_123',
      transactions: [
        {
          id: 'txn_001',
          amount: 1500.50,
          description: 'Salary deposit',
          date: new Date().toISOString(),
          category: 'income'
        },
        {
          id: 'txn_002',
          amount: -89.99,
          description: 'Grocery shopping',
          date: new Date().toISOString(),
          category: 'food'
        }
      ],
      account: {
        number: '****-****-****-1234',
        balance: 15000.00,
        currency: 'USD'
      },
      metadata: {
        created_at: new Date().toISOString(),
        encrypted: true,
        version: '2.0'
      }
    };

    const result3 = await dbWithEncryption.insertOne(complexDocument);
    console.log(`✅ Inserted complex financial record: ${result3.insertedId}`);

    // Example 6: Updating encrypted documents
    console.log('\n✏️  Example 6: Updating encrypted documents');
    const updateResult = await dbWithEncryption.updateOne(
      { username: 'bob' },
      { 
        $set: { 
          'preferences.theme': 'auto',
          lastLogin: new Date().toISOString() 
        } 
      }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} encrypted document(s)`);

    // Example 7: Performance comparison
    console.log('\n⚡ Example 7: Performance considerations');
    console.log('Encryption adds minimal overhead to operations:');
    
    const startTime = Date.now();
    await dbWithEncryption.find({ username: { $exists: true } });
    const encryptedQueryTime = Date.now() - startTime;
    
    console.log(`- Encrypted query time: ${encryptedQueryTime}ms`);
    console.log('- Encryption/decryption happens automatically');
    console.log('- Documents are cached after decryption for better performance');

    // Example 8: Error handling
    console.log('\n❌ Example 8: Error handling');
    try {
      // Try to read encrypted data without the key
      const dbWrongKey = new DiscordDB({
        ...configWithEncryption,
        encryptionKey: 'wrong-key'
      });
      
      await dbWrongKey.find();
    } catch (error) {
      console.log(`Expected error when using wrong key: ${error.message}`);
    }

    console.log('\n🎉 All encryption examples completed successfully!');
    console.log('\n💡 Key Benefits of Encryption:');
    console.log('- 🔒 Automatic encryption/decryption of sensitive data');
    console.log('- 🔄 Backward compatible with existing non-encrypted data');
    console.log('- ⚡ Minimal performance impact with intelligent caching');
    console.log('- 🛡️  AES-256 encryption for maximum security');
    console.log('- 🔧 Easy to enable/disable with just a configuration option');

  } catch (error) {
    console.error('❌ Error in encryption example:', error);
    
    if (error.message.includes('Bot token')) {
      console.log('\n💡 Tip: Make sure to set your environment variables:');
      console.log('   export DISCORD_BOT_TOKEN="your-bot-token"');
      console.log('   export DISCORD_CHANNEL_ID="your-channel-id"');
    }
  }
}

// Usage examples for different scenarios
function configurationExamples() {
  console.log('\n📋 Configuration Examples:');
  console.log('========================\n');

  // Basic configuration (no encryption)
  console.log('1. Basic usage (no encryption):');
  console.log(`
const db = new DiscordDB({
  botToken: 'your-bot-token',
  channelId: 'your-channel-id'
});
`);

  // With encryption
  console.log('2. With encryption enabled:');
  console.log(`
const db = new DiscordDB({
  botToken: 'your-bot-token',
  channelId: 'your-channel-id',
  encryptionKey: 'your-secret-key' // This enables encryption
});
`);

  // Environment-based configuration
  console.log('3. Environment-based configuration:');
  console.log(`
const db = new DiscordDB({
  botToken: process.env.DISCORD_BOT_TOKEN!,
  channelId: process.env.DISCORD_CHANNEL_ID!,
  encryptionKey: process.env.ENCRYPTION_KEY // Optional - only if set
});
`);

  // Check if encryption is enabled
  console.log('4. Checking encryption status:');
  console.log(`
const db = new DiscordDB(config);
if (db.isEncryptionEnabled()) {
  console.log('🔒 Encryption is enabled');
} else {
  console.log('📝 Using plain text storage');
}
`);
}

// Run the examples
if (require.main === module) {
  configurationExamples();
  
  if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_CHANNEL_ID) {
    encryptionExample();
  } else {
    console.log('\n⚠️  Set DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID to run live examples');
  }
}

export { encryptionExample, configurationExamples }; 