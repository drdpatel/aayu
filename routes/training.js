const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Get training data directory
const getTrainingDir = () => {
  return process.env.TRAINING_DATA_PATH || './training_data';
};

// Submit feedback for training
router.post('/feedback', async (req, res) => {
  try {
    const { 
      noteId, 
      originalTranscription, 
      generatedNote, 
      correctedNote, 
      feedbackType, 
      comments,
      rating 
    } = req.body;
    
    if (!noteId || !originalTranscription || !generatedNote) {
      return res.status(400).json({ error: 'Note ID, original transcription, and generated note are required' });
    }
    
    const feedbackData = {
      feedbackId: uuidv4(),
      noteId,
      originalTranscription,
      generatedNote,
      correctedNote: correctedNote || null,
      feedbackType: feedbackType || 'correction', // correction, rating, comment
      comments: comments || '',
      rating: rating || null, // 1-5 scale
      timestamp: new Date().toISOString(),
      processed: false
    };
    
    // Save feedback to training data
    const trainingDir = getTrainingDir();
    await fs.ensureDir(path.join(trainingDir, 'feedback'));
    
    const filename = `feedback_${feedbackData.feedbackId}_${Date.now()}.json`;
    const filepath = path.join(trainingDir, 'feedback', filename);
    
    await fs.writeJson(filepath, feedbackData, { spaces: 2 });
    
    console.log(`Feedback saved: ${filename}`);
    
    res.json({
      success: true,
      feedbackId: feedbackData.feedbackId,
      message: 'Feedback submitted successfully'
    });
    
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit feedback', 
      message: error.message 
    });
  }
});

// Get training statistics
router.get('/stats', async (req, res) => {
  try {
    const trainingDir = getTrainingDir();
    
    // Count notes
    const notesDir = trainingDir;
    let noteCount = 0;
    if (await fs.pathExists(notesDir)) {
      const noteFiles = await fs.readdir(notesDir);
      noteCount = noteFiles.filter(f => f.startsWith('note_') && f.endsWith('.json')).length;
    }
    
    // Count feedback
    const feedbackDir = path.join(trainingDir, 'feedback');
    let feedbackCount = 0;
    let avgRating = 0;
    if (await fs.pathExists(feedbackDir)) {
      const feedbackFiles = await fs.readdir(feedbackDir);
      feedbackCount = feedbackFiles.filter(f => f.startsWith('feedback_') && f.endsWith('.json')).length;
      
      // Calculate average rating
      let totalRating = 0;
      let ratingCount = 0;
      for (const file of feedbackFiles) {
        if (file.startsWith('feedback_') && file.endsWith('.json')) {
          try {
            const feedback = await fs.readJson(path.join(feedbackDir, file));
            if (feedback.rating && typeof feedback.rating === 'number') {
              totalRating += feedback.rating;
              ratingCount++;
            }
          } catch (err) {
            console.error(`Error reading feedback file ${file}:`, err);
          }
        }
      }
      avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : 0;
    }
    
    // Count custom prompts
    const promptsDir = path.join(trainingDir, 'custom_prompts');
    let customPromptCount = 0;
    if (await fs.pathExists(promptsDir)) {
      const promptFiles = await fs.readdir(promptsDir);
      customPromptCount = promptFiles.filter(f => f.endsWith('.json')).length;
    }
    
    res.json({
      trainingStats: {
        totalNotes: noteCount,
        totalFeedback: feedbackCount,
        averageRating: parseFloat(avgRating),
        customPrompts: customPromptCount,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Training stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get training statistics', 
      message: error.message 
    });
  }
});

// Save custom prompt template
router.post('/custom-prompt', async (req, res) => {
  try {
    const { name, description, prompt, category } = req.body;
    
    if (!name || !prompt) {
      return res.status(400).json({ error: 'Name and prompt are required' });
    }
    
    const customPrompt = {
      id: uuidv4(),
      name,
      description: description || '',
      prompt,
      category: category || 'general',
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    
    const trainingDir = getTrainingDir();
    const promptsDir = path.join(trainingDir, 'custom_prompts');
    await fs.ensureDir(promptsDir);
    
    const filename = `prompt_${customPrompt.id}.json`;
    const filepath = path.join(promptsDir, filename);
    
    await fs.writeJson(filepath, customPrompt, { spaces: 2 });
    
    res.json({
      success: true,
      promptId: customPrompt.id,
      message: 'Custom prompt saved successfully'
    });
    
  } catch (error) {
    console.error('Custom prompt save error:', error);
    res.status(500).json({ 
      error: 'Failed to save custom prompt', 
      message: error.message 
    });
  }
});

// Get custom prompts
router.get('/custom-prompts', async (req, res) => {
  try {
    const trainingDir = getTrainingDir();
    const promptsDir = path.join(trainingDir, 'custom_prompts');
    
    if (!await fs.pathExists(promptsDir)) {
      return res.json({ customPrompts: [] });
    }
    
    const promptFiles = await fs.readdir(promptsDir);
    const prompts = [];
    
    for (const file of promptFiles) {
      if (file.startsWith('prompt_') && file.endsWith('.json')) {
        try {
          const prompt = await fs.readJson(path.join(promptsDir, file));
          prompts.push(prompt);
        } catch (err) {
          console.error(`Error reading prompt file ${file}:`, err);
        }
      }
    }
    
    // Sort by creation date (newest first)
    prompts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ customPrompts: prompts });
    
  } catch (error) {
    console.error('Get custom prompts error:', error);
    res.status(500).json({ 
      error: 'Failed to get custom prompts', 
      message: error.message 
    });
  }
});

// Export training data for analysis
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', type = 'all' } = req.query;
    const trainingDir = getTrainingDir();
    
    let exportData = {
      exportDate: new Date().toISOString(),
      notes: [],
      feedback: [],
      customPrompts: []
    };
    
    // Export notes
    if (type === 'all' || type === 'notes') {
      if (await fs.pathExists(trainingDir)) {
        const noteFiles = await fs.readdir(trainingDir);
        for (const file of noteFiles) {
          if (file.startsWith('note_') && file.endsWith('.json')) {
            try {
              const note = await fs.readJson(path.join(trainingDir, file));
              exportData.notes.push(note);
            } catch (err) {
              console.error(`Error reading note file ${file}:`, err);
            }
          }
        }
      }
    }
    
    // Export feedback
    if (type === 'all' || type === 'feedback') {
      const feedbackDir = path.join(trainingDir, 'feedback');
      if (await fs.pathExists(feedbackDir)) {
        const feedbackFiles = await fs.readdir(feedbackDir);
        for (const file of feedbackFiles) {
          if (file.startsWith('feedback_') && file.endsWith('.json')) {
            try {
              const feedback = await fs.readJson(path.join(feedbackDir, file));
              exportData.feedback.push(feedback);
            } catch (err) {
              console.error(`Error reading feedback file ${file}:`, err);
            }
          }
        }
      }
    }
    
    // Export custom prompts
    if (type === 'all' || type === 'prompts') {
      const promptsDir = path.join(trainingDir, 'custom_prompts');
      if (await fs.pathExists(promptsDir)) {
        const promptFiles = await fs.readdir(promptsDir);
        for (const file of promptFiles) {
          if (file.startsWith('prompt_') && file.endsWith('.json')) {
            try {
              const prompt = await fs.readJson(path.join(promptsDir, file));
              exportData.customPrompts.push(prompt);
            } catch (err) {
              console.error(`Error reading prompt file ${file}:`, err);
            }
          }
        }
      }
    }
    
    if (format === 'csv') {
      // For CSV export, we'll focus on feedback data as it's most tabular
      const csvData = exportData.feedback.map(f => ({
        feedbackId: f.feedbackId,
        noteId: f.noteId,
        feedbackType: f.feedbackType,
        rating: f.rating || '',
        comments: f.comments || '',
        timestamp: f.timestamp
      }));
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=training_feedback.csv');
      
      // Simple CSV conversion
      if (csvData.length > 0) {
        const headers = Object.keys(csvData[0]).join(',');
        const rows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
        res.send([headers, ...rows].join('\n'));
      } else {
        res.send('No data available');
      }
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=training_data.json');
      res.json(exportData);
    }
    
  } catch (error) {
    console.error('Export training data error:', error);
    res.status(500).json({ 
      error: 'Failed to export training data', 
      message: error.message 
    });
  }
});

// Clear training data (with confirmation)
router.delete('/clear', async (req, res) => {
  try {
    const { confirmToken, dataType = 'all' } = req.body;
    
    // Simple confirmation token check
    if (confirmToken !== 'CLEAR_TRAINING_DATA') {
      return res.status(400).json({ 
        error: 'Invalid confirmation token. Use "CLEAR_TRAINING_DATA" to confirm.' 
      });
    }
    
    const trainingDir = getTrainingDir();
    let clearedItems = 0;
    
    if (dataType === 'all' || dataType === 'notes') {
      // Clear notes
      if (await fs.pathExists(trainingDir)) {
        const files = await fs.readdir(trainingDir);
        for (const file of files) {
          if (file.startsWith('note_') && file.endsWith('.json')) {
            await fs.remove(path.join(trainingDir, file));
            clearedItems++;
          }
        }
      }
    }
    
    if (dataType === 'all' || dataType === 'feedback') {
      // Clear feedback
      const feedbackDir = path.join(trainingDir, 'feedback');
      if (await fs.pathExists(feedbackDir)) {
        await fs.remove(feedbackDir);
        await fs.ensureDir(feedbackDir);
        clearedItems++;
      }
    }
    
    if (dataType === 'all' || dataType === 'prompts') {
      // Clear custom prompts
      const promptsDir = path.join(trainingDir, 'custom_prompts');
      if (await fs.pathExists(promptsDir)) {
        await fs.remove(promptsDir);
        await fs.ensureDir(promptsDir);
        clearedItems++;
      }
    }
    
    res.json({
      success: true,
      message: `Training data cleared successfully`,
      clearedItems,
      dataType
    });
    
  } catch (error) {
    console.error('Clear training data error:', error);
    res.status(500).json({ 
      error: 'Failed to clear training data', 
      message: error.message 
    });
  }
});

module.exports = router;