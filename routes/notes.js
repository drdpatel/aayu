const express = require('express');
const { OpenAIApi } = require('openai');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Azure OpenAI configuration
const getOpenAIConfig = () => {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
  
  if (!endpoint || !apiKey || !deploymentName) {
    throw new Error('Azure OpenAI credentials not configured');
  }
  
  return { endpoint, apiKey, deploymentName, apiVersion };
};

// Medical note templates and prompts
const getMedicalPrompts = () => {
  return {
    soap: `You are a medical scribe AI. Convert the following transcription into a structured SOAP note format.

Guidelines:
- Extract relevant medical information
- Organize into Subjective, Objective, Assessment, and Plan sections
- Use proper medical terminology
- Include vital signs, symptoms, diagnoses, and treatment plans
- Maintain patient confidentiality (use placeholder names if needed)
- Format professionally for medical records

Transcription: `,

    hpi: `You are a medical scribe AI. Extract and format the History of Present Illness (HPI) from the following transcription.

Guidelines:
- Focus on chief complaint and symptom progression
- Include timing, quality, severity, and associated symptoms
- Use medical terminology appropriately
- Organize chronologically
- Include relevant negatives

Transcription: `,

    assessment: `You are a medical scribe AI. Create a medical assessment and plan from the following transcription.

Guidelines:
- List primary and secondary diagnoses
- Include differential diagnoses if mentioned
- Provide treatment recommendations
- Include follow-up instructions
- Use ICD-10 codes where appropriate

Transcription: `,

    custom: `You are a medical scribe AI. Process the following medical transcription according to the custom instructions provided.

Custom Instructions: {customInstructions}

Transcription: `
  };
};

// Call Azure OpenAI API
const callAzureOpenAI = async (prompt, maxTokens = 1000) => {
  const config = getOpenAIConfig();
  
  const url = `${config.endpoint}/openai/deployments/${config.deploymentName}/chat/completions?api-version=${config.apiVersion}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'api-key': config.apiKey
  };
  
  const data = {
    messages: [
      {
        role: 'system',
        content: 'You are a professional medical scribe AI assistant. Provide accurate, well-formatted medical documentation.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: maxTokens,
    temperature: 0.3, // Lower temperature for more consistent medical documentation
    top_p: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0
  };
  
  try {
    const response = await axios.post(url, data, { headers });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Azure OpenAI API error:', error.response?.data || error.message);
    throw new Error(`Failed to generate medical note: ${error.response?.data?.error?.message || error.message}`);
  }
};

// Generate medical note from transcription
router.post('/generate', async (req, res) => {
  try {
    const { transcription, noteType = 'soap', customInstructions = '' } = req.body;
    
    if (!transcription) {
      return res.status(400).json({ error: 'Transcription text is required' });
    }
    
    const prompts = getMedicalPrompts();
    let prompt;
    
    switch (noteType) {
      case 'soap':
        prompt = prompts.soap + transcription;
        break;
      case 'hpi':
        prompt = prompts.hpi + transcription;
        break;
      case 'assessment':
        prompt = prompts.assessment + transcription;
        break;
      case 'custom':
        prompt = prompts.custom.replace('{customInstructions}', customInstructions) + transcription;
        break;
      default:
        prompt = prompts.soap + transcription;
    }
    
    console.log(`Generating ${noteType} note...`);
    
    const generatedNote = await callAzureOpenAI(prompt, 1500);
    
    const noteId = uuidv4();
    const result = {
      noteId,
      noteType,
      transcription,
      generatedNote,
      timestamp: new Date().toISOString(),
      customInstructions: customInstructions || null
    };
    
    // Save to training data for future model improvement
    await saveToTrainingData(result);
    
    res.json(result);
    
  } catch (error) {
    console.error('Note generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate medical note', 
      message: error.message 
    });
  }
});

// Refine existing note
router.post('/refine', async (req, res) => {
  try {
    const { originalNote, refinementInstructions } = req.body;
    
    if (!originalNote || !refinementInstructions) {
      return res.status(400).json({ error: 'Original note and refinement instructions are required' });
    }
    
    const prompt = `You are a medical scribe AI. Please refine the following medical note based on the provided instructions.

Original Note:
${originalNote}

Refinement Instructions:
${refinementInstructions}

Please provide the refined note:`;
    
    const refinedNote = await callAzureOpenAI(prompt, 1500);
    
    res.json({
      originalNote,
      refinedNote,
      refinementInstructions,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Note refinement error:', error);
    res.status(500).json({ 
      error: 'Failed to refine medical note', 
      message: error.message 
    });
  }
});

// Extract specific information
router.post('/extract', async (req, res) => {
  try {
    const { transcription, extractionType } = req.body;
    
    if (!transcription || !extractionType) {
      return res.status(400).json({ error: 'Transcription and extraction type are required' });
    }
    
    const extractionPrompts = {
      vitals: 'Extract all vital signs (blood pressure, heart rate, temperature, respiratory rate, oxygen saturation, weight, height) from the following transcription. Format as a structured list.',
      medications: 'Extract all medications mentioned in the following transcription. Include dosages, frequencies, and any changes (started, stopped, modified).',
      allergies: 'Extract all allergies and adverse reactions mentioned in the following transcription.',
      symptoms: 'Extract all symptoms and complaints mentioned in the following transcription. Include onset, duration, severity, and quality.',
      diagnoses: 'Extract all diagnoses, both current and historical, mentioned in the following transcription.'
    };
    
    const prompt = extractionPrompts[extractionType] + '\n\nTranscription: ' + transcription;
    
    const extractedInfo = await callAzureOpenAI(prompt, 800);
    
    res.json({
      extractionType,
      extractedInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Information extraction error:', error);
    res.status(500).json({ 
      error: 'Failed to extract information', 
      message: error.message 
    });
  }
});

// Save note data for training
const saveToTrainingData = async (noteData) => {
  try {
    const trainingDir = process.env.TRAINING_DATA_PATH || './training_data';
    await fs.ensureDir(trainingDir);
    
    const filename = `note_${noteData.noteId}_${Date.now()}.json`;
    const filepath = path.join(trainingDir, filename);
    
    await fs.writeJson(filepath, noteData, { spaces: 2 });
    console.log(`Training data saved: ${filename}`);
  } catch (error) {
    console.error('Failed to save training data:', error);
  }
};

// Get note templates
router.get('/templates', (req, res) => {
  const templates = {
    soap: {
      name: 'SOAP Note',
      description: 'Subjective, Objective, Assessment, Plan format',
      sections: ['Subjective', 'Objective', 'Assessment', 'Plan']
    },
    hpi: {
      name: 'History of Present Illness',
      description: 'Detailed history of current medical issue',
      sections: ['Chief Complaint', 'History', 'Review of Systems']
    },
    assessment: {
      name: 'Assessment & Plan',
      description: 'Medical assessment and treatment plan',
      sections: ['Assessment', 'Plan', 'Follow-up']
    },
    custom: {
      name: 'Custom Format',
      description: 'User-defined format with custom instructions',
      sections: ['Custom']
    }
  };
  
  res.json({ templates });
});

module.exports = router;