# 🏥 Medical Scribe - AI-Powered Medical Documentation

An intelligent medical scribe application that uses Azure Speech Services for transcription and Azure OpenAI to convert speech into structured medical notes. Designed for healthcare professionals to streamline documentation workflows.

## ✨ Features

- 🎤 **Audio Transcription**: Convert medical consultations to text using Azure Speech Services
- 📝 **Smart Note Generation**: Transform transcriptions into structured medical notes (SOAP, HPI, Assessment & Plan)
- 🔐 **Secure Access**: Password-protected with session management
- 🧠 **Trainable AI**: Learn from feedback to improve note quality over time
- 📊 **Training Analytics**: Track performance and export training data
- 🎯 **Custom Prompts**: Create specialized note templates for different medical scenarios
- 🔄 **Note Refinement**: Iteratively improve generated notes with AI assistance
- 📱 **Modern UI**: Responsive design optimized for medical workflows

## 🚀 Quick Start (Step-by-Step for Doctors)

### Prerequisites

1. **Install Node.js** (version 16 or higher)
   - Visit [nodejs.org](https://nodejs.org/)
   - Download and install the LTS version
   - Verify installation: Open terminal/command prompt and type `node --version`

### Step 1: Download and Setup

1. **Download the application** (or clone from GitHub)
2. **Open terminal/command prompt** in the application folder
3. **Install dependencies**:
   ```bash
   npm install
   ```

### Step 2: Initial Configuration

Run the setup wizard:
```bash
npm run setup
```

The setup wizard will guide you through:
- Setting admin username and password
- Configuring server port
- Azure services setup (optional - can be done later)

### Step 3: Azure Services Setup (Optional but Recommended)

#### Azure Speech Services
1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a new "Speech Services" resource
3. Copy the **Key** and **Region**
4. Add these to your `.env` file:
   ```
   AZURE_SPEECH_KEY=your-speech-key-here
   AZURE_SPEECH_REGION=your-region-here
   ```

#### Azure OpenAI
1. In Azure Portal, create an "Azure OpenAI" resource
2. Deploy a GPT model (recommended: GPT-4 or GPT-3.5-turbo)
3. Copy the **Endpoint**, **API Key**, and **Deployment Name**
4. Add these to your `.env` file:
   ```
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_API_KEY=your-openai-key-here
   AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
   ```

### Step 4: Start the Application

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

### Step 5: Access the Application

1. Open your web browser
2. Go to `http://localhost:3000` (or your configured port)
3. Login with the credentials you created during setup

## 📖 How to Use

### 1. Audio Transcription
- Go to the **Transcription** tab
- Upload an audio file (WAV, MP3, MP4, M4A, FLAC, AAC)
- Click "Start Transcription"
- Review the transcribed text

### 2. Generate Medical Notes
- Go to the **Medical Notes** tab
- Choose note type (SOAP, HPI, Assessment & Plan, or Custom)
- Paste transcription text or use text from previous transcription
- Click "Generate Medical Note"
- Review and copy the generated note

### 3. Provide Feedback (Training)
- After generating a note, rate it (1-5 stars)
- Add comments about accuracy or needed improvements
- Submit feedback to help improve the AI

### 4. Custom Prompts
- Go to the **Training** tab
- Create custom note templates for specific scenarios
- Use specialized prompts for different medical specialties

### 5. Export Data
- Export training data for analysis
- Download in JSON or CSV format
- Use for compliance or quality improvement

## 🔧 Configuration

### Environment Variables

Create a `.env` file with these settings:

```env
# Application Settings
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-session-secret

# Admin Authentication
ADMIN_USERNAME=doctor
ADMIN_PASSWORD_HASH=your-hashed-password

# Azure Speech Services
AZURE_SPEECH_KEY=your-speech-key
AZURE_SPEECH_REGION=your-region

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-openai-key
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# File Upload Settings
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# Training Data Settings
TRAINING_DATA_PATH=./training_data
MODEL_CUSTOMIZATION_ENABLED=true
```

## 🔒 Security Features

- **Password Protection**: Secure login system with bcrypt password hashing
- **Session Management**: Secure session handling with configurable timeouts
- **Rate Limiting**: Protection against abuse with configurable limits
- **File Validation**: Strict file type and size validation for uploads
- **Environment Variables**: Sensitive data stored securely outside code
- **HTTPS Ready**: Configured for secure deployment

## 📁 Project Structure

```
medical-scribe/
├── server.js              # Main server file
├── setup.js               # Setup wizard
├── package.json            # Dependencies and scripts
├── .env.example           # Environment variables template
├── middleware/
│   └── auth.js            # Authentication middleware
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── transcription.js   # Audio transcription routes
│   ├── notes.js           # Medical notes generation
│   └── training.js        # Training and feedback routes
├── public/
│   ├── login.html         # Login page
│   ├── dashboard.html     # Main dashboard
│   └── js/
│       └── dashboard.js   # Frontend JavaScript
├── uploads/               # Temporary audio file storage
└── training_data/         # Training data and feedback
    ├── feedback/          # User feedback data
    └── custom_prompts/    # Custom prompt templates
```

## 🚀 Deployment

### Production Deployment

1. **Set environment to production**:
   ```env
   NODE_ENV=production
   ```

2. **Use a process manager** (PM2 recommended):
   ```bash
   npm install -g pm2
   pm2 start server.js --name medical-scribe
   ```

3. **Set up reverse proxy** (Nginx recommended):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

4. **SSL Certificate**: Use Let's Encrypt or your organization's certificates

### EMR Integration Ready

The application is designed to integrate with Electronic Medical Record (EMR) systems:

- **API Endpoints**: RESTful API for external integration
- **Database Ready**: PostgreSQL configuration included
- **Export Formats**: JSON and CSV export for data migration
- **Webhook Support**: Can be extended for real-time EMR updates

## 🔧 Troubleshooting

### Common Issues

1. **"Azure Speech Service not configured"**
   - Check your `.env` file has correct `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`
   - Verify Azure Speech Service is active in Azure Portal

2. **"Note generation failed"**
   - Verify Azure OpenAI configuration in `.env`
   - Check that your OpenAI deployment is active
   - Ensure you have sufficient quota

3. **"Authentication failed"**
   - Run setup again: `npm run setup`
   - Check that `ADMIN_PASSWORD_HASH` is properly set

4. **File upload issues**
   - Check file format (supported: WAV, MP3, MP4, M4A, FLAC, AAC)
   - Verify file size is under 50MB
   - Ensure `uploads/` directory exists and is writable

### Getting Help

1. **Check the logs**: Look for error messages in the console
2. **Test services**: Use the "Test Services" button in Settings
3. **Health check**: Visit `/health` endpoint for system status
4. **Clear data**: Use "Clear Training Data" if needed (with caution)

## 📊 Performance Tips

1. **Audio Quality**: Use high-quality audio recordings for better transcription
2. **File Formats**: WAV files typically provide best transcription accuracy
3. **Background Noise**: Minimize background noise for better results
4. **Speaking Pace**: Speak clearly and at moderate pace
5. **Medical Terminology**: The AI learns medical terms through feedback

## 🔄 Updates and Maintenance

### Regular Maintenance

1. **Monitor training data**: Review feedback and improve prompts
2. **Update dependencies**: Run `npm audit` and `npm update` regularly
3. **Backup data**: Export training data regularly
4. **Monitor usage**: Check Azure service usage and costs

### Future Enhancements

- Real-time transcription via microphone
- Multi-language support
- Advanced medical terminology training
- Integration with major EMR systems
- Voice authentication
- Automated HIPAA compliance reporting

## 📜 License

MIT License - See LICENSE file for details

## 🤝 Support

For technical support:
1. Check this README for common solutions
2. Review error logs in the application
3. Test Azure service connectivity
4. Contact your IT administrator for infrastructure issues

---

**Important**: This application handles sensitive medical data. Ensure compliance with HIPAA, GDPR, and other relevant regulations in your jurisdiction. Always follow your organization's data security policies.
