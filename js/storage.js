// Storage and save/load functionality
class StorageManager {
    constructor() {
        this.autoSaveInterval = null;
        this.setupAutoSave();
    }

    // Setup auto-save
    setupAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.saveCharacter();
        }, 30000);
        
        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveCharacter();
        });
    }

    // Save character to localStorage
    saveCharacter() {
        try {
            const characterData = {
                ...characterManager.character,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('molCharacter', JSON.stringify(characterData));
            this.updateAutoSaveStatus('Auto-saved');
        } catch (error) {
            console.error('Failed to save character:', error);
            this.updateAutoSaveStatus('Save failed');
        }
    }

    // Load character from localStorage
    loadCharacter() {
        try {
            const saved = localStorage.getItem('molCharacter');
            if (saved) {
                const characterData = JSON.parse(saved);
                Object.assign(characterManager.character, characterData);
                characterManager.updateCharacterUI();
                skillManager.renderSkills();
                characterManager.updateHealthBar();
                this.updateAutoSaveStatus('Character loaded');
                return true;
            }
        } catch (error) {
            console.error('Failed to load character:', error);
            this.updateAutoSaveStatus('Load failed');
        }
        return false;
    }

    // Update auto-save status display
    updateAutoSaveStatus(message) {
        const statusElement = document.getElementById('autoSaveStatus');
        if (statusElement) {
            statusElement.textContent = `${message} at ${new Date().toLocaleTimeString()}`;
            
            // Clear the message after 3 seconds
            setTimeout(() => {
                if (statusElement.textContent.includes(message)) {
                    statusElement.textContent = '';
                }
            }, 3000);
        }
    }

    // Save character to file
    saveCharacterToFile() {
        if (!characterManager.character.name || !characterManager.character.name.trim()) {
            alert('Please enter a character name before saving.');
            return;
        }
        
        // Update character data first
        this.saveCharacter();
        
        const characterData = {
            ...characterManager.character,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(characterData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${characterManager.character.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_character.json`;
        link.click();
        
        this.updateAutoSaveStatus(`Exported character: ${characterManager.character.name}`);
    }

    // Load character from file
    loadCharacterFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const characterData = JSON.parse(e.target.result);
                
                // Validate the data structure
                if (characterData.name !== undefined && characterData.skills !== undefined) {
                    characterManager.saveStateForUndo('Load character from file');
                    Object.assign(characterManager.character, characterData);
                    characterManager.updateCharacterUI();
                    skillManager.renderSkills();
                    characterManager.updateHealthBar();
                    this.updateAutoSaveStatus(`Loaded character: ${characterData.name}`);
                } else {
                    alert('Invalid character file format.');
                }
            } catch (error) {
                console.error('Failed to load character file:', error);
                alert('Failed to load character file. Please check the file format.');
            }
        };
        reader.readAsText(file);
        
        // Clear the file input
        event.target.value = '';
    }

    // Save character to named slot
    saveCharacterToSlot() {
        const characterName = characterManager.character.name || 'Unnamed Character';
        
        // Get existing saved characters
        const savedCharacters = JSON.parse(localStorage.getItem('molSavedCharacters') || '[]');
        
        // Check if character already exists
        const existingIndex = savedCharacters.findIndex(char => char.name === characterName);
        
        const saveData = {
            name: characterName,
            data: { ...characterManager.character },
            savedAt: new Date().toISOString()
        };
        
        if (existingIndex !== -1) {
            // Update existing character
            savedCharacters[existingIndex] = saveData;
        } else {
            // Add new character
            savedCharacters.push(saveData);
        }
        
        // Limit to 10 saved characters
        if (savedCharacters.length > 10) {
            savedCharacters.shift();
        }
        
        localStorage.setItem('molSavedCharacters', JSON.stringify(savedCharacters));
        this.updateAutoSaveStatus(`Saved character: ${characterName}`);
        
        // Refresh the load character modal if it's open
        this.renderSavedCharacters();
    }

    // Show load character modal
    showLoadCharacterModal() {
        this.renderSavedCharacters();
        document.getElementById('loadCharacterModal').style.display = 'flex';
    }

    // Close load character modal
    closeLoadCharacterModal() {
        document.getElementById('loadCharacterModal').style.display = 'none';
    }

    // Render saved characters list
    renderSavedCharacters() {
        const container = document.getElementById('savedCharactersList');
        if (!container) return;
        
        const savedCharacters = JSON.parse(localStorage.getItem('molSavedCharacters') || '[]');
        
        if (savedCharacters.length === 0) {
            container.innerHTML = '<div class="no-saved-characters">No saved characters found.</div>';
            return;
        }
        
        container.innerHTML = savedCharacters.map(saved => `
            <div class="saved-character-item">
                <div class="saved-character-info">
                    <div class="saved-character-name">${saved.name}</div>
                    <div class="saved-character-details">
                        Saved: ${new Date(saved.savedAt).toLocaleDateString()}
                        ${saved.data.maxHealth ? `• ${saved.data.maxHealth} Max HP` : ''}
                        ${saved.data.currentHealth ? `• ${saved.data.currentHealth} HP` : ''}
                    </div>
                </div>
                <button class="add-skill-button" onclick="storageManager.loadSavedCharacter('${saved.name.replace(/'/g, "\\'")}')">Load</button>
            </div>
        `).join('');
    }

    // Load saved character by name
    loadSavedCharacter(characterName) {
        const savedCharacters = JSON.parse(localStorage.getItem('molSavedCharacters') || '[]');
        const savedCharacter = savedCharacters.find(char => char.name === characterName);
        
        if (savedCharacter) {
            // Load the character data
            Object.assign(characterManager.character, savedCharacter.data);
            
            // Update UI
            characterManager.updateCharacterUI();
            skillManager.renderSkills();
            characterManager.updateHealthBar();
            
            // Close modal
            this.closeLoadCharacterModal();
            
            this.updateAutoSaveStatus(`Loaded character: ${characterName}`);
        } else {
            alert('Character not found!');
        }
    }

    // Delete saved character
    deleteSavedCharacter(characterName) {
        if (confirm(`Are you sure you want to delete the saved character "${characterName}"?`)) {
            const savedCharacters = JSON.parse(localStorage.getItem('molSavedCharacters') || '[]');
            const filteredCharacters = savedCharacters.filter(char => char.name !== characterName);
            localStorage.setItem('molSavedCharacters', JSON.stringify(filteredCharacters));
            this.renderSavedCharacters();
            this.updateAutoSaveStatus(`Deleted saved character: ${characterName}`);
        }
    }

    // Clear all data
    clearAllData() {
        if (confirm('Are you sure you want to clear all character data? This cannot be undone.')) {
            localStorage.removeItem('molCharacter');
            localStorage.removeItem('molSavedCharacters');
            characterManager.createNewCharacter();
            this.updateAutoSaveStatus('All data cleared');
        }
    }
}

// Create global instance
const storageManager = new StorageManager();