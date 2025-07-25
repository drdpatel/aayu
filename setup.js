#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    
    let input = '';
    process.stdin.on('data', (char) => {
      char = char.toString();
      
      if (char === '\n' || char === '\r' || char === '\u0004') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write('\n');
        resolve(input);
      } else if (char === '\u0003') {
        process.exit();
      } else if (char === '\u007f') {
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        input += char;
        process.stdout.write('*');
      }
    });
  });
}

async function setup() {
  console.log('🏥 Medical Scribe Setup Wizard');
  console.log('================================\n');
  
  try {
    // Check if .env already exists
    const envExists = await fs.pathExists('.env');
    if (envExists) {
      const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Setup cancelled.');
        process.exit(0);
      }
    }
    
    console.log('Let\'s set up your medical scribe application:\n');
    
    // Basic configuration
    const port = await question('🌐 Server port (default: 3000): ') || '3000';
    const sessionSecret = await question('🔐 Session secret (leave blank for auto-generated): ') || generateRandomString(64);
    
    // Admin credentials
    console.log('\n👨‍⚕️ Admin Account Setup:');
    const adminUsername = await question('Username (default: doctor): ') || 'doctor';
    const adminPassword = await questionHidden('Password: ');
    
    if (!adminPassword) {
      console.log('\n❌ Password cannot be empty.');
      process.exit(1);
    }
    
    const confirmPassword = await questionHidden('Confirm password: ');
    
    if (adminPassword !== confirmPassword) {
      console.log('\n❌ Passwords do not match.');
      process.exit(1);
    }
    
    // Hash the password
    console.log('\n🔒 Hashing password...');
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
    
    // Azure configuration
    console.log('\n☁️  Azure Services Configuration:');
    console.log('(You can skip these now and configure them later)');
    
    const azureSpeechKey = await question('Azure Speech Service Key (optional): ');
    const azureSpeechRegion = await question('Azure Speech Service Region (optional): ');
    
    const azureOpenAIEndpoint = await question('Azure OpenAI Endpoint (optional): ');
    const azureOpenAIKey = await question('Azure OpenAI API Key (optional): ');
    const azureOpenAIDeployment = await question('Azure OpenAI Deployment Name (optional): ');
    
    // Create .env file
    const envContent = `# Medical Scribe Configuration
# Generated on ${new Date().toISOString()}

# Application Settings
PORT=${port}
NODE_ENV=development
SESSION_SECRET=${sessionSecret}

# Admin Authentication
ADMIN_USERNAME=${adminUsername}
ADMIN_PASSWORD_HASH=${adminPasswordHash}

# Azure Speech Services
AZURE_SPEECH_KEY=${azureSpeechKey}
AZURE_SPEECH_REGION=${azureSpeechRegion}

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=${azureOpenAIEndpoint}
AZURE_OPENAI_API_KEY=${azureOpenAIKey}
AZURE_OPENAI_DEPLOYMENT_NAME=${azureOpenAIDeployment}
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Database Settings (for future EMR integration)
DATABASE_URL=postgresql://username:password@localhost:5432/medical_scribe

# Security Settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Settings
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# Training Data Settings
TRAINING_DATA_PATH=./training_data
MODEL_CUSTOMIZATION_ENABLED=true
`;
    
    await fs.writeFile('.env', envContent);
    
    // Create necessary directories
    console.log('\n📁 Creating directories...');
    await fs.ensureDir('./uploads');
    await fs.ensureDir('./training_data');
    await fs.ensureDir('./training_data/feedback');
    await fs.ensureDir('./training_data/custom_prompts');
    await fs.ensureDir('./public/js');
    
    // Create .gitignore if it doesn't exist
    const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Uploads and temporary files
uploads/
temp/

# Training data (contains sensitive medical information)
training_data/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output/

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db
`;
    
    const gitignoreExists = await fs.pathExists('.gitignore');
    if (!gitignoreExists) {
      await fs.writeFile('.gitignore', gitignoreContent);
      console.log('✅ Created .gitignore file');
    }
    
    console.log('✅ Configuration file created');
    console.log('✅ Directories created');
    
    console.log('\n🎉 Setup completed successfully!\n');
    
    console.log('📋 Next steps:');
    console.log('1. Install dependencies: npm install');
    console.log('2. Configure Azure services in .env file (if not done)');
    console.log('3. Start the development server: npm run dev');
    console.log('4. Open http://localhost:' + port + ' in your browser');
    
    console.log('\n🔐 Login credentials:');
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: [the password you entered]`);
    
    console.log('\n⚠️  Important security notes:');
    console.log('- Keep your .env file secure and never commit it to version control');
    console.log('- The .gitignore file has been configured to exclude sensitive files');
    console.log('- Change the session secret in production');
    console.log('- Use strong passwords for all accounts');
    
    if (!azureSpeechKey || !azureOpenAIKey) {
      console.log('\n☁️  Azure Services:');
      console.log('- You can configure Azure services later by editing the .env file');
      console.log('- The application will work in demo mode without Azure services');
      console.log('- Visit Azure Portal to create Speech Services and OpenAI resources');
    }
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Run setup if this file is executed directly
if (require.main === module) {
  setup();
}

module.exports = { setup };