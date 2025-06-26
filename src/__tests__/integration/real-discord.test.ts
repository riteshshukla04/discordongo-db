import { DiscordDB } from '../../discord-db';

// Skip this test by default to avoid spamming Discord
// Run with: yarn test --testNamePattern="Real Discord Integration"
describe.skip('Real Discord Integration', () => {
  const db = new DiscordDB({
    botToken: process.env.DISCORD_BOT_TOKEN || 'test-token',
    channelId: process.env.DISCORD_CHANNEL_ID || 'test-channel-id'
  });

  // Clean up after tests - delete test messages
  const cleanup = async () => {
    try {
      const testMessages = await db.find({ 
        $or: [
          { name: { $regex: '^TestUser' } },
          { type: 'integration-test' }
        ]
      } as any);
      
      for (const doc of testMessages.documents) {
        try {
          if (doc._id) {
            await db.deleteById(doc._id);
          }
        } catch (error) {
          console.warn(`Failed to cleanup message ${doc._id}:`, error);
        }
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  };

  beforeAll(async () => {
    // Test connection
    const connected = await db.ping();
    if (!connected) {
      throw new Error('Failed to connect to Discord');
    }
  });

  afterAll(async () => {
    await cleanup();
  });

  it('should connect to Discord and perform basic operations', async () => {
    // Test connection
    const isConnected = await db.ping();
    expect(isConnected).toBe(true);

    // Insert a test document
    const testUser = {
      name: 'TestUser_' + Date.now(),
      age: 25,
      email: 'test@example.com',
      type: 'integration-test',
      timestamp: new Date().toISOString()
    };

    const insertResult = await db.insertOne(testUser);
    expect(insertResult.acknowledged).toBe(true);
    expect(insertResult.insertedId).toBeDefined();

    // Find the inserted document
    const findResult = await db.findById(insertResult.insertedId);
    expect(findResult).toBeDefined();
    expect(findResult?.name).toBe(testUser.name);
    expect(findResult?.type).toBe('integration-test');

    // Update the document
    const updateResult = await db.updateById(insertResult.insertedId, {
      $set: { age: 26, lastModified: new Date().toISOString() }
    });
    expect(updateResult.acknowledged).toBe(true);
    expect(updateResult.modifiedCount).toBe(1);

    // Verify update
    const updatedDoc = await db.findById(insertResult.insertedId);
    expect(updatedDoc?.age).toBe(26);
    expect(updatedDoc?.lastModified).toBeDefined();

    // Delete the document
    const deleteResult = await db.deleteById(insertResult.insertedId);
    expect(deleteResult.acknowledged).toBe(true);
    expect(deleteResult.deletedCount).toBe(1);

    // Verify deletion
    const deletedDoc = await db.findById(insertResult.insertedId);
    expect(deletedDoc).toBeNull();
  }, 30000); // 30 second timeout for network operations

  it('should handle multiple document operations', async () => {
    const testUsers = [
      {
        name: 'TestUser_Multi_1_' + Date.now(),
        age: 20,
        role: 'user',
        type: 'integration-test'
      },
      {
        name: 'TestUser_Multi_2_' + Date.now(),
        age: 30,
        role: 'admin',
        type: 'integration-test'
      },
      {
        name: 'TestUser_Multi_3_' + Date.now(),
        age: 25,
        role: 'user',
        type: 'integration-test'
      }
    ];

    // Insert multiple documents
    const insertResults = await db.insertMany(testUsers);
    expect(insertResults).toHaveLength(3);
    expect(insertResults.every(r => r.acknowledged)).toBe(true);

    // Find documents with filtering
    const userRoleResults = await db.find({ 
      role: 'user',
      type: 'integration-test'
    } as any);
    expect(userRoleResults.documents.length).toBeGreaterThanOrEqual(2);

    // Find with complex query
    const complexQuery = await db.find({
      $and: [
        { age: { $gte: 25 } },
        { type: 'integration-test' }
      ]
    } as any, { sort: { age: 1 } });
    expect(complexQuery.documents.length).toBeGreaterThanOrEqual(2);
    
    // Verify sorting
    const ages = complexQuery.documents.map(doc => doc.age);
    const sortedAges = [...ages].sort((a, b) => a - b);
    expect(ages).toEqual(sortedAges);

    // Update multiple documents
    const updateResult = await db.updateMany(
      { type: 'integration-test' } as any,
      { $set: { updated: true, timestamp: new Date().toISOString() } }
    );
    expect(updateResult.acknowledged).toBe(true);
    expect(updateResult.modifiedCount).toBeGreaterThanOrEqual(3);

    // Delete multiple documents
    const deleteResult = await db.deleteMany({ type: 'integration-test' } as any);
    expect(deleteResult.acknowledged).toBe(true);
    expect(deleteResult.deletedCount).toBeGreaterThanOrEqual(3);
  }, 45000); // 45 second timeout for multiple operations

  it('should handle errors gracefully', async () => {
    // Test finding non-existent document
    const nonExistent = await db.findById('non-existent-id');
    expect(nonExistent).toBeNull();

    // Test updating non-existent document
    const updateResult = await db.updateById('non-existent-id', { $set: { test: true } });
    expect(updateResult.acknowledged).toBe(false);

    // Test deleting non-existent document
    const deleteResult = await db.deleteById('non-existent-id');
    expect(deleteResult.acknowledged).toBe(false);
  });

  it('should respect document size limits', async () => {
    const largeContent = 'x'.repeat(3000); // Larger than Discord's 2000 char limit
    
    const largeDoc = {
      name: 'TestUser_Large_' + Date.now(),
      content: largeContent,
      type: 'integration-test'
    };

    // This should fail due to size limits
    await expect(db.insertOne(largeDoc)).rejects.toThrow();
  });
});

// Create a separate test file for manual testing
describe('Manual Discord Test Runner', () => {
  it('should run real Discord tests when explicitly requested', async () => {
    const shouldRunRealTests = process.env.RUN_REAL_DISCORD_TESTS === 'true';
    
    if (!shouldRunRealTests) {
      console.log('Skipping real Discord tests. Set RUN_REAL_DISCORD_TESTS=true to run them.');
      return;
    }

    const db = new DiscordDB({
      botToken: process.env.DISCORD_BOT_TOKEN || 'test-token',
      channelId: process.env.DISCORD_CHANNEL_ID || 'test-channel-id'
    });

    // Simple ping test
    const isConnected = await db.ping();
    expect(isConnected).toBe(true);
    console.log('✅ Successfully connected to Discord!');
  });
}); 