# 🏥 Medical Scribe - Installation Guide for Doctors

This guide will walk you through setting up your AI-powered medical scribe application step by step. No technical background required!

## 📋 What You'll Need

1. A computer running Windows, macOS, or Linux
2. Internet connection
3. Azure account (for AI services)
4. About 30 minutes for initial setup

## 🚀 Step-by-Step Installation

### Step 1: Install Node.js

Node.js is the runtime environment needed for the application.

**For Windows:**
1. Go to [https://nodejs.org](https://nodejs.org)
2. Click "Download for Windows" (LTS version)
3. Run the downloaded installer
4. Follow the installation wizard (accept all defaults)
5. Restart your computer

**For macOS:**
1. Go to [https://nodejs.org](https://nodejs.org)
2. Click "Download for macOS" (LTS version)
3. Open the downloaded .pkg file
4. Follow the installation wizard
5. Restart your computer

**For Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify Installation:**
1. Open Terminal (macOS/Linux) or Command Prompt (Windows)
2. Type: `node --version`
3. You should see a version number like `v18.17.0`

### Step 2: Download the Medical Scribe Application

1. Download the application files to your computer
2. Extract to a folder (e.g., `C:\medical-scribe` or `~/medical-scribe`)
3. Open Terminal/Command Prompt
4. Navigate to the application folder:
   ```bash
   cd path/to/medical-scribe
   ```

### Step 3: Install Application Dependencies

In the terminal/command prompt, run:
```bash
npm install
```

This will download all necessary components. It may take a few minutes.

### Step 4: Run the Setup Wizard

Run the interactive setup:
```bash
npm run setup
```

The wizard will ask you:

1. **Server port**: Press Enter for default (3000)
2. **Session secret**: Press Enter for auto-generated
3. **Admin username**: Enter your preferred username (default: doctor)
4. **Password**: Enter a strong password
5. **Confirm password**: Re-enter the same password
6. **Azure services**: You can skip these for now and configure later

### Step 5: Set Up Azure Services (Recommended)

#### Create Azure Speech Service

1. Go to [https://portal.azure.com](https://portal.azure.com)
2. Sign in with your Azure account
3. Click "Create a resource"
4. Search for "Speech Services"
5. Click "Create"
6. Fill in:
   - **Subscription**: Your Azure subscription
   - **Resource group**: Create new or use existing
   - **Region**: Choose closest to your location
   - **Name**: e.g., "medical-scribe-speech"
   - **Pricing tier**: F0 (free) for testing, S0 for production
7. Click "Review + create", then "Create"
8. Once created, go to the resource
9. Click "Keys and Endpoint"
10. Copy **Key 1** and **Location/Region**

#### Create Azure OpenAI Service

1. In Azure Portal, click "Create a resource"
2. Search for "Azure OpenAI"
3. Click "Create"
4. Fill in:
   - **Subscription**: Your Azure subscription
   - **Resource group**: Same as Speech Service
   - **Region**: Choose supported region (e.g., East US)
   - **Name**: e.g., "medical-scribe-openai"
   - **Pricing tier**: Standard
5. Click "Review + create", then "Create"
6. Once created, go to the resource
7. Click "Keys and Endpoint"
8. Copy the **Endpoint** and **Key 1**
9. Go to "Model deployments" → "Manage Deployments"
10. Click "Create new deployment"
11. Choose GPT-4 or GPT-3.5-turbo
12. Give it a name (e.g., "gpt-4")
13. Copy the deployment name

#### Update Configuration

1. In your medical-scribe folder, open the `.env` file
2. Update these lines with your Azure information:
   ```
   AZURE_SPEECH_KEY=your-speech-key-here
   AZURE_SPEECH_REGION=your-region-here
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_API_KEY=your-openai-key-here
   AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
   ```

### Step 6: Start the Application

In terminal/command prompt, run:
```bash
npm run dev
```

You should see:
```
🏥 Medical Scribe Server running on port 3000
📊 Dashboard: http://localhost:3000
🔐 Login: http://localhost:3000/login
```

### Step 7: Access Your Medical Scribe

1. Open your web browser
2. Go to: `http://localhost:3000`
3. You'll be redirected to the login page
4. Enter your username and password from Step 4
5. Click "Sign In"

## 🎉 You're Ready!

Your medical scribe is now running! Here's what you can do:

### First Steps:
1. **Test the system**: Go to Settings → Test Services
2. **Upload audio**: Try the Transcription tab with a sample audio file
3. **Generate notes**: Use the Medical Notes tab to create structured documentation
4. **Provide feedback**: Rate generated notes to improve the AI

### Daily Usage:
1. **Record consultations** (with patient consent)
2. **Upload audio files** for transcription
3. **Generate structured notes** (SOAP, HPI, etc.)
4. **Review and edit** as needed
5. **Copy to your EMR** system

## 🔧 Troubleshooting

### Common Issues:

**"Command not found: npm"**
- Node.js not installed properly
- Restart your computer after installing Node.js
- Try installing Node.js again

**"Port 3000 already in use"**
- Another application is using port 3000
- Change the port in your `.env` file: `PORT=3001`
- Restart the application

**"Azure services not working"**
- Check your `.env` file has correct Azure keys
- Verify Azure services are active in Azure Portal
- Check your Azure subscription has available quota

**"Login not working"**
- Run setup again: `npm run setup`
- Make sure you remember the password you set

### Getting Help:

1. **Check the application logs** in the terminal
2. **Use the Settings tab** to test services
3. **Visit the Health Check** at `http://localhost:3000/health`
4. **Review the README.md** file for detailed information

## 🔒 Security Reminders

- **Keep your `.env` file secure** - it contains sensitive keys
- **Use strong passwords** for your admin account
- **Regularly backup** your training data
- **Follow HIPAA guidelines** for patient data
- **Keep the application updated** regularly

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review error messages in the terminal
3. Test Azure service connectivity
4. Contact your IT support team if needed

---

**Congratulations!** You now have a fully functional AI medical scribe. The system will learn and improve over time as you provide feedback on generated notes.

Remember to always review AI-generated content before using it in patient care.