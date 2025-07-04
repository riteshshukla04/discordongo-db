#!/usr/bin/env node

import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 DiscordDB Environment Setup');
console.log('=====================================\n');

console.log('This script will help you create a .env file with your Discord credentials.\n');

console.log('📋 Prerequisites:');
console.log('1. Create a Discord bot at https://discord.com/developers/applications');
console.log('2. Get your bot token from the "Bot" section');
console.log('3. Invite the bot to your server with "Send Messages", "Read Message History", and "Manage Messages" permissions');
console.log('4. Get your channel ID by enabling Developer Mode in Discord, then right-clicking a channel and selecting "Copy ID"\n');

const questions = [
  {
    key: 'DISCORD_BOT_TOKEN',
    question: 'Enter your Discord Bot Token: ',
    validation: (value) => value && value.length > 50,
    error: 'Bot token seems too short. Please enter a valid Discord bot token.'
  },
  {
    key: 'DISCORD_CHANNEL_ID',
    question: 'Enter your Discord Channel ID: ',
    validation: (value) => value && /^\d{17,19}$/.test(value),
    error: 'Channel ID should be a 17-19 digit number.'
  },
  {
    key: 'PORT',
    question: 'Enter port for Express example (default: 3000): ',
    validation: () => true, // Optional field
    default: '3000'
  }
];

const envVars = {};

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question.question, (answer) => {
      const value = answer.trim() || question.default || '';
      
      if (question.validation(value)) {
        envVars[question.key] = value;
        resolve();
      } else {
        console.log(`❌ ${question.error}\n`);
        askQuestion(question).then(resolve);
      }
    });
  });
}

async function main() {
  try {
    // Check if .env already exists
    if (fs.existsSync('.env')) {
      console.log('⚠️  .env file already exists!');
      const overwrite = await new Promise((resolve) => {
        rl.question('Do you want to overwrite it? (y/N): ', (answer) => {
          resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
      });
      
      if (!overwrite) {
        console.log('Setup cancelled.');
        rl.close();
        return;
      }
      console.log();
    }

    // Ask questions
    for (const question of questions) {
      await askQuestion(question);
      console.log('✅ Saved!\n');
    }

    // Create .env file
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const envFileContent = `# Discord Bot Configuration
# Generated by setup-env.js

${envContent}
`;

    fs.writeFileSync('.env', envFileContent);

    console.log('🎉 Environment setup complete!');
    console.log('✅ .env file created successfully\n');
    
    console.log('🚀 Next steps:');
    console.log('1. Test your setup: yarn test:basic');
    console.log('2. Test with real Discord: yarn test:real');
    console.log('3. Try the Express example: cd examples && npx tsx express-app.ts');
    console.log('\n📖 Check the README.md for more examples and documentation.');

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
  } finally {
    rl.close();
  }
}

main(); 