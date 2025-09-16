// Main application initialization and coordination
class Application {
    constructor() {
        this.initialized = false;
    }

    // Initialize the application
    async init() {
        if (this.initialized) return;
        
        try {
            // Load spell data first
            await spellManager.loadSpellData();
            
            // Initialize components
            this.setupEventListeners();
            this.setupModalHandlers();
            
            // Load saved character or create new
            if (!storageManager.loadCharacter()) {
                characterManager.initializeDefaultSkills();
            }
            
            // Initialize UI
            characterManager.updateCharacterUI();
            characterManager.updateHealthBar();
            skillManager.renderSkills();
            skillManager.initializeWeaponSelector();
            
            // Setup search functionality
            spellManager.setupSearchFunctionality();
            
            // Initialize skill browsers
            spellManager.renderMagicalSkills();
            spellManager.renderCombatSkills();
            spellManager.renderGeneralSkills();
            
            // Set first tab as active
            skillManager.switchTab('magical');
            
            this.initialized = true;
            console.log('MOL Campaign Tracker initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            alert('Failed to initialize the application. Please refresh the page.');
        }
    }

    // Setup global event listeners
    setupEventListeners() {
        // Character input updates
        document.getElementById('characterName').addEventListener('input', () => {
            characterManager.updateCharacterFromInputs();
        });
        
        document.getElementById('currentHealth').addEventListener('input', () => {
            characterManager.updateCharacterFromInputs();
        });
        
        document.getElementById('maxHealth').addEventListener('input', () => {
            characterManager.updateCharacterFromInputs();
        });
        
        document.getElementById('bloodline').addEventListener('input', () => {
            characterManager.updateCharacterFromInputs();
        });
        
        document.getElementById('knowledge').addEventListener('input', () => {
            characterManager.updateCharacterFromInputs();
        });

        // File input for character loading
        const fileInput = document.getElementById('loadCharacterFile');
        if (fileInput) {
            fileInput.addEventListener('change', storageManager.loadCharacterFromFile.bind(storageManager));
        }

        // Weapon selector change
        const weaponSelector = document.getElementById('weaponSelector');
        if (weaponSelector) {
            weaponSelector.addEventListener('change', () => {
                skillManager.selectedWeapon = weaponSelector.value;
                spellManager.renderCombatSkills();
            });
        }
    }

    // Setup modal handlers
    setupModalHandlers() {
        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // ESC key to close modals
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                const visibleModals = document.querySelectorAll('.modal[style*="flex"]');
                visibleModals.forEach(modal => {
                    modal.style.display = 'none';
                });
            }
        });
    }

    // Calculate and display mana
    updateManaDisplay() {
        const manaElement = document.querySelector('.mana-display');
        if (manaElement) {
            const totalMana = characterManager.calculateMana();
            manaElement.innerHTML = `
                <strong>Total Mana: ${totalMana}</strong><br>
                <small>Based on Shaping skill level</small>
            `;
        }
    }

    // Export character data as JSON
    exportCharacter() {
        storageManager.saveCharacterToFile();
    }

    // Import character data from JSON
    importCharacter() {
        document.getElementById('loadCharacterFile').click();
    }

    // Show custom skill modal
    showCustomSkillModal() {
        document.getElementById('customSkillModal').style.display = 'flex';
    }

    // Close custom skill modal
    closeCustomSkillModal() {
        document.getElementById('customSkillModal').style.display = 'none';
        // Clear form
        document.getElementById('customSkillForm').reset();
    }

    // Add custom skill
    addCustomSkill() {
        const form = document.getElementById('customSkillForm');
        const formData = new FormData(form);
        
        const name = formData.get('skillName').trim();
        const description = formData.get('skillDescription').trim();
        const type = formData.get('skillType');
        const level = parseInt(formData.get('skillLevel')) || 0;
        const magical = formData.get('magical') === 'on';
        const illegal = formData.get('illegal') === 'on';
        
        if (!name) {
            alert('Please enter a skill name.');
            return;
        }
        
        // Check if skill already exists
        if (skillManager.skillAlreadyExists(name, type, null)) {
            alert('A skill with this name already exists.');
            return;
        }
        
        // Add the custom skill
        const customSkill = {
            id: name.toLowerCase().replace(/\s+/g, '_') + '_custom_' + Date.now(),
            name: name,
            level: level,
            xp: 0,
            type: type,
            parent: null,
            magical: magical,
            illegal: illegal,
            custom: true,
            description: description
        };
        
        characterManager.saveStateForUndo(`Add custom skill: ${name}`);
        characterManager.character.skills.push(customSkill);
        
        // Update UI
        skillManager.renderSkills();
        this.closeCustomSkillModal();
        
        storageManager.saveCharacter();
        storageManager.updateAutoSaveStatus(`Added custom skill: ${name}`);
    }
}

// Global functions for HTML onclick handlers
window.switchTab = (tabName) => skillManager.switchTab(tabName);
window.addSkill = (name, type, defaultLevel, magical, parentId) => skillManager.addSkill(name, type, defaultLevel, magical, parentId);
window.deleteSkill = (skillId) => skillManager.deleteSkill(skillId);
window.addXP = (skillId, amount) => skillManager.addXP(skillId, amount);
window.showSkillDescription = (skillName, skillType, parentKey) => skillManager.showSkillDescription(skillName, skillType, parentKey);
window.closeSkillDescriptionModal = () => skillManager.closeSkillDescriptionModal();
window.undoLastAction = () => characterManager.undoLastAction();
window.createNewCharacter = () => characterManager.createNewCharacter();
window.saveCharacterToFile = () => storageManager.saveCharacterToFile();
window.saveCharacterToSlot = () => storageManager.saveCharacterToSlot();
window.showLoadCharacterModal = () => storageManager.showLoadCharacterModal();
window.closeLoadCharacterModal = () => storageManager.closeLoadCharacterModal();
window.loadSavedCharacter = (name) => storageManager.loadSavedCharacter(name);
window.showCustomSkillModal = () => app.showCustomSkillModal();
window.closeCustomSkillModal = () => app.closeCustomSkillModal();
window.addCustomSkill = () => app.addCustomSkill();

// Create and initialize application
const app = new Application();

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}