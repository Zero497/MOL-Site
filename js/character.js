// Character management functionality
class CharacterManager {
    constructor() {
        this.character = {
            name: '',
            currentHealth: 100,
            maxHealth: 100,
            bloodline: '',
            skills: [],
            knowledge: ''
        };
        this.actionHistory = [];
        this.maxHistorySize = 50;
    }

    // Save state for undo functionality
    saveStateForUndo(actionDescription, oldState = null) {
        const stateToSave = oldState || {
            character: JSON.parse(JSON.stringify(this.character)),
            timestamp: Date.now()
        };
        
        this.actionHistory.push({
            description: actionDescription,
            state: stateToSave,
            timestamp: Date.now()
        });
        
        // Limit history size to prevent memory issues
        if (this.actionHistory.length > this.maxHistorySize) {
            this.actionHistory.shift();
        }
        
        this.updateUndoUI();
    }

    updateUndoUI() {
        const undoButton = document.getElementById('undoButton');
        const undoText = document.getElementById('undoText');
        
        if (this.actionHistory.length > 0) {
            const lastAction = this.actionHistory[this.actionHistory.length - 1];
            undoButton.disabled = false;
            undoButton.style.opacity = '1';
            undoText.textContent = `Undo: ${lastAction.description}`;
        } else {
            undoButton.disabled = true;
            undoButton.style.opacity = '0.5';
            undoText.textContent = 'No actions to undo';
        }
    }

    undoLastAction() {
        if (this.actionHistory.length === 0) {
            console.log('No actions to undo');
            return;
        }
        
        const lastAction = this.actionHistory.pop();
        this.character = lastAction.state.character;
        
        // Update UI
        this.updateCharacterUI();
        skillManager.renderSkills();
        this.updateHealthBar();
        this.updateUndoUI();
        
        storageManager.updateAutoSaveStatus(`Undid: ${lastAction.description}`);
    }

    createNewCharacter() {
        const savedState = {
            character: JSON.parse(JSON.stringify(this.character)),
            timestamp: Date.now()
        };
        this.saveStateForUndo('Create new character', savedState);
        
        // Reset character to defaults
        this.character = {
            name: '',
            currentHealth: 100,
            maxHealth: 100,
            bloodline: '',
            skills: [],
            knowledge: ''
        };
        
        // Initialize default skills
        this.initializeDefaultSkills();
        
        // Update UI
        this.updateCharacterUI();
        skillManager.renderSkills();
        this.updateHealthBar();
        
        storageManager.saveCharacter();
        storageManager.updateAutoSaveStatus('Created new character');
    }

    initializeDefaultSkills() {
        // Add free starting skills from skill database
        Object.entries(skillDatabase.domains).forEach(([key, domain]) => {
            if (domain.free) {
                const existingSkill = this.character.skills.find(skill => 
                    skill.name === domain.name && skill.type === 'domain'
                );
                
                if (!existingSkill) {
                    const newSkill = {
                        id: key + '_' + Date.now(),
                        name: domain.name,
                        level: domain.defaultLevel,
                        xp: 0,
                        type: 'domain',
                        parent: null,
                        magical: domain.magical
                    };
                    this.character.skills.push(newSkill);
                }
            }
        });

        // Add free starting spells
        Object.entries(skillDatabase.spells).forEach(([domainKey, spells]) => {
            spells.forEach(spell => {
                if (spell.free) {
                    const existingSpell = this.character.skills.find(skill => 
                        skill.name === spell.name && skill.type === 'spell'
                    );
                    
                    if (!existingSpell) {
                        const newSpell = {
                            id: spell.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
                            name: spell.name,
                            level: spell.defaultLevel,
                            xp: 0,
                            type: 'spell',
                            parent: domainKey,
                            magical: true
                        };
                        this.character.skills.push(newSpell);
                    }
                }
            });
        });
    }

    updateCharacterUI() {
        document.getElementById('characterName').value = this.character.name || '';
        document.getElementById('currentHealth').value = this.character.currentHealth || 100;
        document.getElementById('maxHealth').value = this.character.maxHealth || 100;
        document.getElementById('bloodline').value = this.character.bloodline || '';
        document.getElementById('knowledge').value = this.character.knowledge || '';
    }

    updateHealthBar() {
        const healthBar = document.querySelector('.health-fill');
        const percentage = (this.character.currentHealth / this.character.maxHealth) * 100;
        healthBar.style.width = `${percentage}%`;
        healthBar.textContent = `${this.character.currentHealth}/${this.character.maxHealth}`;
    }

    // Calculate total mana
    calculateMana() {
        const shapingSkill = this.character.skills.find(s => s.name === 'Shaping' && s.type === 'domain');
        const shapingLevel = shapingSkill ? shapingSkill.level : 0;
        
        let baseMana = 100;
        
        // Mana calculation based on shaping level
        if (shapingLevel >= 0) {
            baseMana = 100 + (shapingLevel * 50);
        } else {
            baseMana = 100 + (shapingLevel * 25); // Negative levels give less mana
        }
        
        return Math.max(50, baseMana); // Minimum 50 mana
    }

    // Update character data from input fields
    updateCharacterFromInputs() {
        this.character.name = document.getElementById('characterName').value;
        this.character.currentHealth = parseInt(document.getElementById('currentHealth').value) || 100;
        this.character.maxHealth = parseInt(document.getElementById('maxHealth').value) || 100;
        this.character.bloodline = document.getElementById('bloodline').value;
        this.character.knowledge = document.getElementById('knowledge').value;
        
        this.updateHealthBar();
        storageManager.saveCharacter();
    }
}

// Create global instance
const characterManager = new CharacterManager();