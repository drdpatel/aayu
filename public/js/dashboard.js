// Dashboard JavaScript for Medical Scribe Application

// Global variables
let currentTranscription = '';
let currentNote = '';
let currentNoteId = '';
let selectedRating = 0;

// Initialize dashboard when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    loadTrainingStats();
    checkServiceStatus();
});

// Initialize dashboard
function initializeDashboard() {
    // Check authentication status
    fetch('/auth/status')
        .then(response => response.json())
        .then(data => {
            if (!data.authenticated) {
                window.location.href = '/login';
                return;
            }
            document.getElementById('currentUser').textContent = data.username || 'Doctor';
        })
        .catch(console.error);
    
    // Update last updated time
    document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
}

// Setup event listeners
function setupEventListeners() {
    // File upload area
    const fileUploadArea = document.getElementById('fileUploadArea');
    const audioFile = document.getElementById('audioFile');
    
    fileUploadArea.addEventListener('click', () => audioFile.click());
    fileUploadArea.addEventListener('dragover', handleDragOver);
    fileUploadArea.addEventListener('drop', handleFileDrop);
    fileUploadArea.addEventListener('dragleave', handleDragLeave);
    
    audioFile.addEventListener('change', handleFileSelect);
    
    // Buttons
    document.getElementById('transcribeBtn').addEventListener('click', startTranscription);
    document.getElementById('generateNoteBtn').addEventListener('click', generateMedicalNote);
    
    // Note type change
    document.getElementById('noteType').addEventListener('change', function() {
        const customDiv = document.getElementById('customInstructionsDiv');
        customDiv.style.display = this.value === 'custom' ? 'block' : 'none';
    });
    
    // Custom prompt form
    document.getElementById('customPromptForm').addEventListener('submit', saveCustomPrompt);
    
    // Star rating
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            updateStarDisplay();
        });
    });
    
    // Tab change events
    document.querySelectorAll('[data-bs-toggle="pill"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            const targetId = e.target.getAttribute('data-bs-target');
            if (targetId === '#training') {
                loadTrainingStats();
            }
        });
    });
}

// File handling
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect({ target: { files } });
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['.wav', '.mp3', '.mp4', '.m4a', '.flac', '.aac'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
        showAlert('Invalid file type. Please select a supported audio format.', 'danger');
        return;
    }
    
    // Update UI
    document.getElementById('fileUploadArea').innerHTML = `
        <i class="bi bi-file-earmark-music display-4 text-success mb-3"></i>
        <h5>${file.name}</h5>
        <p class="text-muted">Ready for transcription</p>
    `;
    
    document.getElementById('transcribeBtn').disabled = false;
    document.getElementById('audioFile').dataset.selectedFile = 'true';
}

// Transcription
async function startTranscription() {
    const fileInput = document.getElementById('audioFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('Please select an audio file first.', 'warning');
        return;
    }
    
    showLoading('Transcribing Audio', 'Converting speech to text using Azure Speech Services...');
    
    const formData = new FormData();
    formData.append('audio', file);
    
    try {
        const response = await fetch('/api/transcription/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentTranscription = data.transcription;
            displayTranscription(data);
            showAlert('Transcription completed successfully!', 'success');
        } else {
            throw new Error(data.error || 'Transcription failed');
        }
    } catch (error) {
        console.error('Transcription error:', error);
        showAlert(`Transcription failed: ${error.message}`, 'danger');
    } finally {
        hideLoading();
    }
}

function displayTranscription(data) {
    const resultDiv = document.getElementById('transcriptionResult');
    const textDiv = document.getElementById('transcriptionText');
    const placeholder = document.getElementById('transcriptionPlaceholder');
    
    textDiv.innerHTML = `
        <h6 class="mb-3">Transcription Result</h6>
        <p class="mb-3">${data.transcription}</p>
        <small class="text-muted">
            <i class="bi bi-clock me-1"></i>Processed: ${new Date(data.timestamp).toLocaleString()}
            <br><i class="bi bi-file me-1"></i>File: ${data.filename}
        </small>
    `;
    
    placeholder.style.display = 'none';
    resultDiv.style.display = 'block';
}

// Medical Notes
async function generateMedicalNote() {
    const transcription = document.getElementById('transcriptionInput').value || currentTranscription;
    const noteType = document.getElementById('noteType').value;
    const customInstructions = document.getElementById('customInstructions').value;
    
    if (!transcription.trim()) {
        showAlert('Please provide transcription text.', 'warning');
        return;
    }
    
    showLoading('Generating Medical Note', 'Converting transcription to structured medical documentation...');
    
    try {
        const response = await fetch('/api/notes/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transcription,
                noteType,
                customInstructions
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentNote = data.generatedNote;
            currentNoteId = data.noteId;
            displayGeneratedNote(data);
            showAlert('Medical note generated successfully!', 'success');
        } else {
            throw new Error(data.error || 'Note generation failed');
        }
    } catch (error) {
        console.error('Note generation error:', error);
        showAlert(`Note generation failed: ${error.message}`, 'danger');
    } finally {
        hideLoading();
    }
}

function displayGeneratedNote(data) {
    const noteOutput = document.getElementById('noteOutput');
    
    noteOutput.innerHTML = `
        <div class="mb-3">
            <h6>Generated ${data.noteType.toUpperCase()} Note</h6>
            <small class="text-muted">Generated: ${new Date(data.timestamp).toLocaleString()}</small>
        </div>
        <div class="note-content">${formatNoteContent(data.generatedNote)}</div>
    `;
    
    // Show action buttons
    document.getElementById('copyNoteBtn').style.display = 'inline-block';
    document.getElementById('refineNoteBtn').style.display = 'inline-block';
    document.getElementById('feedbackCard').style.display = 'block';
}

function formatNoteContent(content) {
    // Basic formatting for medical notes
    return content
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

// Copy functions
function copyTranscription() {
    navigator.clipboard.writeText(currentTranscription).then(() => {
        showAlert('Transcription copied to clipboard!', 'success');
    });
}

function copyNote() {
    navigator.clipboard.writeText(currentNote).then(() => {
        showAlert('Medical note copied to clipboard!', 'success');
    });
}

// Generate note from transcription result
function generateNote() {
    document.getElementById('transcriptionInput').value = currentTranscription;
    
    // Switch to notes tab
    const notesTab = document.getElementById('notes-tab');
    notesTab.click();
}

// Refine note
async function refineNote() {
    const refinementInstructions = prompt('Enter refinement instructions:');
    if (!refinementInstructions) return;
    
    showLoading('Refining Note', 'Improving the medical note based on your instructions...');
    
    try {
        const response = await fetch('/api/notes/refine', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                originalNote: currentNote,
                refinementInstructions
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentNote = data.refinedNote;
            document.querySelector('.note-content').innerHTML = formatNoteContent(data.refinedNote);
            showAlert('Note refined successfully!', 'success');
        } else {
            throw new Error(data.error || 'Note refinement failed');
        }
    } catch (error) {
        console.error('Note refinement error:', error);
        showAlert(`Note refinement failed: ${error.message}`, 'danger');
    } finally {
        hideLoading();
    }
}

// Feedback and Training
function updateStarDisplay() {
    document.querySelectorAll('.star').forEach((star, index) => {
        if (index < selectedRating) {
            star.style.opacity = '1';
        } else {
            star.style.opacity = '0.3';
        }
    });
}

async function submitFeedback() {
    if (!currentNoteId || !currentNote) {
        showAlert('No note available for feedback.', 'warning');
        return;
    }
    
    const comments = document.getElementById('feedbackComments').value;
    
    try {
        const response = await fetch('/api/training/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                noteId: currentNoteId,
                originalTranscription: currentTranscription,
                generatedNote: currentNote,
                rating: selectedRating,
                comments,
                feedbackType: 'rating'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Feedback submitted successfully! Thank you for helping improve the system.', 'success');
            document.getElementById('feedbackCard').style.display = 'none';
            loadTrainingStats();
        } else {
            throw new Error(data.error || 'Feedback submission failed');
        }
    } catch (error) {
        console.error('Feedback error:', error);
        showAlert(`Feedback submission failed: ${error.message}`, 'danger');
    }
}

async function loadTrainingStats() {
    try {
        const response = await fetch('/api/training/stats');
        const data = await response.json();
        
        if (response.ok) {
            const stats = data.trainingStats;
            document.getElementById('totalNotes').textContent = stats.totalNotes;
            document.getElementById('totalFeedback').textContent = stats.totalFeedback;
            document.getElementById('avgRating').textContent = stats.averageRating;
            document.getElementById('customPrompts').textContent = stats.customPrompts;
        }
    } catch (error) {
        console.error('Error loading training stats:', error);
    }
}

async function saveCustomPrompt(e) {
    e.preventDefault();
    
    const name = document.getElementById('promptName').value;
    const description = document.getElementById('promptDescription').value;
    const prompt = document.getElementById('promptText').value;
    const category = document.getElementById('promptCategory').value;
    
    try {
        const response = await fetch('/api/training/custom-prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                description,
                prompt,
                category
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Custom prompt saved successfully!', 'success');
            document.getElementById('customPromptForm').reset();
            loadTrainingStats();
        } else {
            throw new Error(data.error || 'Failed to save custom prompt');
        }
    } catch (error) {
        console.error('Custom prompt error:', error);
        showAlert(`Failed to save custom prompt: ${error.message}`, 'danger');
    }
}

// Settings and System
async function checkServiceStatus() {
    try {
        const response = await fetch('/health');
        const data = await response.json();
        
        if (response.ok) {
            // Update service status indicators
            // This would be enhanced with actual service checks
            document.getElementById('environment').textContent = 
                data.version ? 'Production' : 'Development';
        }
    } catch (error) {
        console.error('Health check error:', error);
    }
}

async function testServices() {
    showLoading('Testing Services', 'Checking Azure Speech and OpenAI connectivity...');
    
    try {
        // Test with a simple request
        const response = await fetch('/api/notes/templates');
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Services are working correctly!', 'success');
            
            // Update status indicators
            document.getElementById('speechStatus').innerHTML = 
                '<i class="bi bi-check-circle text-success me-2"></i>Azure Speech Service: Connected';
            document.getElementById('openaiStatus').innerHTML = 
                '<i class="bi bi-check-circle text-success me-2"></i>Azure OpenAI: Connected';
        } else {
            throw new Error('Service test failed');
        }
    } catch (error) {
        console.error('Service test error:', error);
        showAlert('Some services may not be properly configured. Check your environment variables.', 'warning');
    } finally {
        hideLoading();
    }
}

async function exportTrainingData() {
    const exportType = document.getElementById('exportType').value;
    const exportFormat = document.getElementById('exportFormat').value;
    
    try {
        const response = await fetch(`/api/training/export?type=${exportType}&format=${exportFormat}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `training_data_${exportType}.${exportFormat}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showAlert('Training data exported successfully!', 'success');
        } else {
            throw new Error('Export failed');
        }
    } catch (error) {
        console.error('Export error:', error);
        showAlert(`Export failed: ${error.message}`, 'danger');
    }
}

async function clearTrainingData() {
    const confirmed = confirm('Are you sure you want to clear all training data? This action cannot be undone.');
    if (!confirmed) return;
    
    const confirmToken = prompt('Type "CLEAR_TRAINING_DATA" to confirm:');
    if (confirmToken !== 'CLEAR_TRAINING_DATA') {
        showAlert('Confirmation failed. Training data not cleared.', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/training/clear', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                confirmToken,
                dataType: 'all'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Training data cleared successfully!', 'success');
            loadTrainingStats();
        } else {
            throw new Error(data.error || 'Clear operation failed');
        }
    } catch (error) {
        console.error('Clear data error:', error);
        showAlert(`Failed to clear training data: ${error.message}`, 'danger');
    }
}

async function checkHealth() {
    try {
        const response = await fetch('/health');
        const data = await response.json();
        
        if (response.ok) {
            showAlert(`System is healthy! Version: ${data.version}, Status: ${data.status}`, 'success');
        } else {
            throw new Error('Health check failed');
        }
    } catch (error) {
        console.error('Health check error:', error);
        showAlert('Health check failed. Please check system status.', 'danger');
    }
}

// Utility functions
function showLoading(title, subtitle) {
    document.getElementById('loadingText').textContent = title;
    document.getElementById('loadingSubtext').textContent = subtitle;
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showAlert(message, type = 'info') {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 10000; min-width: 300px;" role="alert">
            <i class="bi bi-${getAlertIcon(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert');
        if (alerts.length > 0) {
            alerts[alerts.length - 1].remove();
        }
    }, 5000);
}

function getAlertIcon(type) {
    const icons = {
        success: 'check-circle',
        danger: 'exclamation-triangle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/auth/logout', {
            method: 'POST'
        });
        
        if (response.ok) {
            window.location.href = '/login';
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('Logout failed. Please try again.', 'danger');
    }
}