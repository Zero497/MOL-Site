// Spell data management and rendering
class SpellManager {
    constructor() {
        this.skillDatabase = null;
    }

    // Load spell data from JSON
    async loadSpellData() {
        try {
            const response = await fetch('data/spells.json');
            this.skillDatabase = await response.json();
            window.skillDatabase = this.skillDatabase; // Make globally available
            return this.skillDatabase;
        } catch (error) {
            console.error('Failed to load spell data:', error);
            // Fallback to embedded data if JSON fails
            return this.getEmbeddedSpellData();
        }
    }

    // Fallback embedded spell data (in case JSON loading fails)
    getEmbeddedSpellData() {
        // This would contain the same data structure as the JSON file
        // For brevity, returning a minimal structure
        return {
            domains: {},
            spells: {},
            weaponSkills: {},
            combatTechniques: {},
            generalSkills: []
        };
    }

    // Render magical skills browser
    renderMagicalSkills(searchTerm = '') {
        const container = document.getElementById('magicalSkills');
        if (!container || !this.skillDatabase) return;
        
        let html = '';
        
        // Render domains
        html += this.renderSkillCategory('Magical Domains', this.skillDatabase.domains, 'domain', searchTerm);
        
        // Render spells by domain
        Object.entries(this.skillDatabase.spells).forEach(([domainKey, spells]) => {
            if (spells && spells.length > 0) {
                const domain = this.skillDatabase.domains[domainKey];
                const categoryName = domain ? `${domain.name} Spells` : `${domainKey} Spells`;
                html += this.renderSkillCategory(categoryName, spells, 'spell', searchTerm, domainKey);
            }
        });
        
        container.innerHTML = html;
    }

    // Render combat skills browser
    renderCombatSkills(searchTerm = '') {
        const container = document.getElementById('combatSkills');
        if (!container || !this.skillDatabase) return;
        
        let html = '';
        
        // Render weapon skills
        html += this.renderSkillCategory('Weapon Proficiencies', this.skillDatabase.weaponSkills, 'weapon', searchTerm);
        
        // Render combat techniques
        const filteredTechniques = this.filterCombatSkills();
        html += this.renderSkillCategory('Combat Techniques', filteredTechniques, 'combat', searchTerm);
        
        container.innerHTML = html;
    }

    // Render general skills browser
    renderGeneralSkills(searchTerm = '') {
        const container = document.getElementById('generalSkills');
        if (!container || !this.skillDatabase) return;
        
        let html = this.renderSkillCategory('General Skills', this.skillDatabase.generalSkills, 'skill', searchTerm);
        container.innerHTML = html;
    }

    // Filter combat skills based on selected weapon
    filterCombatSkills() {
        if (!skillManager.selectedWeapon) {
            return this.skillDatabase.combatTechniques;
        }
        
        const filtered = {};
        Object.entries(this.skillDatabase.combatTechniques).forEach(([key, technique]) => {
            if (!technique.applicableWeapons || 
                technique.applicableWeapons.includes(skillManager.selectedWeapon) || 
                technique.applicableWeapons.includes('all')) {
                filtered[key] = technique;
            }
        });
        
        return filtered;
    }

    // Render a category of skills
    renderSkillCategory(categoryName, skills, skillType, searchTerm = '', parentKey = null) {
        const isArray = Array.isArray(skills);
        const skillsToRender = isArray ? skills : Object.values(skills);
        
        // Filter by search term
        const filteredSkills = skillsToRender.filter(skill => {
            if (!searchTerm) return true;
            return skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   (skill.description && skill.description.toLowerCase().includes(searchTerm.toLowerCase()));
        });
        
        if (filteredSkills.length === 0) return '';
        
        let html = '<div class="skill-category">';
        html += `<div class="category-header">${categoryName}</div>`;
        
        filteredSkills.forEach(skill => {
            const skillKey = isArray ? null : Object.keys(skills).find(key => skills[key] === skill);
            html += this.createSkillListItem(skill, skillType, parentKey || skillKey);
        });
        
        html += '</div>';
        return html;
    }

    // Create a skill list item for the browser
    createSkillListItem(skill, skillType, parentKey = null) {
        const isLearned = skillManager.skillAlreadyExists(skill.name, skillType, parentKey);
        const buttonText = isLearned ? 'Already Learned' : 'Add Skill';
        const buttonClass = isLearned ? 'add-skill-button' : 'add-skill-button';
        const buttonDisabled = isLearned ? 'disabled' : '';
        
        let html = '<div class="skill-list-item">';
        html += '<div class="skill-details">';
        html += `<div class="skill-name-browse">${skill.name}`;
        html += skillManager.createInfoIcon(skill.name, skillType, parentKey);
        
        // Add badges
        if (skill.illegal) html += '<span class="illegal-skill-indicator">ILLEGAL</span>';
        if (skill.free) html += '<span class="shared-skill-indicator">FREE</span>';
        if (skill.enhancer) html += '<span class="shared-skill-indicator">ENHANCER</span>';
        
        html += '</div>';
        if (skill.description) {
            html += `<div class="skill-description">${skill.description.substring(0, 100)}${skill.description.length > 100 ? '...' : ''}</div>`;
        }
        html += '</div>';
        
        if (!isLearned) {
            html += `<button class="${buttonClass}" onclick="skillManager.addSkill('${skill.name}', '${skillType}', ${skill.defaultLevel}, ${skill.magical || false}, '${parentKey || ''}')">${buttonText}</button>`;
        } else {
            html += `<button class="${buttonClass}" disabled>${buttonText}</button>`;
        }
        
        html += '</div>';
        return html;
    }

    // Search functionality
    setupSearchFunctionality() {
        const magicalSearch = document.getElementById('magicalSearch');
        const combatSearch = document.getElementById('combatSearch');
        const generalSearch = document.getElementById('generalSearch');
        
        if (magicalSearch) {
            magicalSearch.addEventListener('input', (e) => {
                this.renderMagicalSkills(e.target.value);
            });
        }
        
        if (combatSearch) {
            combatSearch.addEventListener('input', (e) => {
                this.renderCombatSkills(e.target.value);
            });
        }
        
        if (generalSearch) {
            generalSearch.addEventListener('input', (e) => {
                this.renderGeneralSkills(e.target.value);
            });
        }
    }
}

// Create global instance
const spellManager = new SpellManager();