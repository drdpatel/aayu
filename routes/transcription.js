const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.wav', '.mp3', '.mp4', '.m4a', '.flac', '.aac'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported formats: WAV, MP3, MP4, M4A, FLAC, AAC'));
    }
  }
});

// Azure Speech Service configuration
const getSpeechConfig = () => {
  const speechKey = process.env.AZURE_SPEECH_KEY;
  const speechRegion = process.env.AZURE_SPEECH_REGION;
  
  if (!speechKey || !speechRegion) {
    throw new Error('Azure Speech Service credentials not configured');
  }
  
  const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
  speechConfig.speechRecognitionLanguage = 'en-US';
  
  // Configure for medical terminology
  speechConfig.setProperty(sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "3000");
  speechConfig.setProperty(sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, "3000");
  
  return speechConfig;
};

// Transcribe audio file
router.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    const filePath = req.file.path;
    const sessionId = uuidv4();
    
    console.log(`Starting transcription for session ${sessionId}`);
    
    // Create audio config from file
    const audioConfig = sdk.AudioConfig.fromWAVFileInput(fs.readFileSync(filePath));
    const speechConfig = getSpeechConfig();
    
    // Create speech recognizer
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    
    let fullTranscription = '';
    let isComplete = false;
    
    // Handle recognition events
    recognizer.recognized = (s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        fullTranscription += e.result.text + ' ';
        console.log(`Recognized: ${e.result.text}`);
      }
    };
    
    recognizer.sessionStopped = (s, e) => {
      console.log('Session stopped');
      isComplete = true;
    };
    
    recognizer.canceled = (s, e) => {
      console.log(`Canceled: ${e.reason}`);
      if (e.reason === sdk.CancellationReason.Error) {
        console.error(`Error: ${e.errorDetails}`);
      }
      isComplete = true;
    };
    
    // Start continuous recognition
    recognizer.startContinuousRecognitionAsync(
      () => {
        console.log('Recognition started');
      },
      (err) => {
        console.error('Recognition failed:', err);
        recognizer.close();
        res.status(500).json({ error: 'Transcription failed', details: err });
      }
    );
    
    // Wait for completion
    const checkCompletion = () => {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (isComplete) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
        
        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(interval);
          resolve();
        }, 300000);
      });
    };
    
    await checkCompletion();
    
    // Stop recognition and close
    recognizer.stopContinuousRecognitionAsync(() => {
      recognizer.close();
    });
    
    // Clean up uploaded file
    await fs.remove(filePath);
    
    // Return transcription result
    res.json({
      sessionId,
      transcription: fullTranscription.trim(),
      timestamp: new Date().toISOString(),
      filename: req.file.originalname
    });
    
  } catch (error) {
    console.error('Transcription error:', error);
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({ 
      error: 'Transcription failed', 
      message: error.message 
    });
  }
});

// Real-time transcription endpoint (for future web audio API integration)
router.post('/realtime/start', (req, res) => {
  try {
    const sessionId = uuidv4();
    const speechConfig = getSpeechConfig();
    
    // For now, return session info
    // Real-time implementation would use WebSocket
    res.json({
      sessionId,
      message: 'Real-time transcription session created',
      websocketUrl: `/ws/transcription/${sessionId}`
    });
    
  } catch (error) {
    console.error('Real-time transcription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transcription history
router.get('/history', (req, res) => {
  // This would typically fetch from database
  // For now, return empty array
  res.json({
    transcriptions: [],
    message: 'Transcription history will be available after database integration'
  });
});

module.exports = router;