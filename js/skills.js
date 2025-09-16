// Skill management functionality
class SkillManager {
    constructor() {
        this.selectedWeapon = 'swords'; // Default weapon selection
    }

    // Skill Description System Functions
    showSkillDescription(skillName, skillType, parentKey = null) {
        const modal = document.getElementById('skillDescriptionModal');
        const title = document.getElementById('skillDescriptionTitle');
        const content = document.getElementById('skillDescriptionContent');
        
        title.textContent = skillName;
        
        const descriptionData = this.getSkillDescription(skillName, skillType, parentKey);
        content.innerHTML = this.formatSkillDescription(descriptionData);
        
        modal.style.display = 'flex';
    }

    closeSkillDescriptionModal() {
        document.getElementById('skillDescriptionModal').style.display = 'none';
    }

    getSkillDescription(skillName, skillType, parentKey = null) {
        let skillData = null;
        
        // Search in skill database based on type
        if (skillType === 'domain') {
            skillData = skillDatabase.domains[skillName.toLowerCase().replace(/ /g, '')] ||
                       Object.values(skillDatabase.domains).find(s => s.name === skillName);
        } else if (skillType === 'spell' || skillType === 'alchemy-skill') {
            // Search in spells/alchemy by parent domain
            if (parentKey) {
                const parentSkills = skillDatabase.spells[parentKey] || [];
                skillData = parentSkills.find(s => s.name === skillName);
            } else {
                // Search all spell arrays
                for (const spellArray of Object.values(skillDatabase.spells)) {
                    const found = spellArray.find(s => s.name === skillName);
                    if (found) {
                        skillData = found;
                        break;
                    }
                }
            }
        } else if (skillType === 'weapon') {
            skillData = skillDatabase.weaponSkills[skillName.toLowerCase().replace(/ /g, '')] ||
                       Object.values(skillDatabase.weaponSkills).find(s => s.name === skillName);
        } else if (skillType === 'combat') {
            skillData = skillDatabase.combatTechniques[skillName.toLowerCase().replace(/ /g, '')] ||
                       Object.values(skillDatabase.combatTechniques).find(s => s.name === skillName);
        } else if (skillType === 'skill') {
            skillData = skillDatabase.generalSkills.find(s => s.name === skillName);
        }
        
        // If not found in database, check character skills for custom skills
        if (!skillData) {
            const characterSkill = characterManager.character.skills.find(s => s.name === skillName);
            if (characterSkill) {
                skillData = {
                    name: characterSkill.name,
                    description: characterSkill.description || 'Custom skill - no description provided.',
                    custom: true,
                    level: characterSkill.level,
                    magical: characterSkill.magical,
                    illegal: characterSkill.illegal,
                    reaction: characterSkill.reaction,
                    channeled: characterSkill.channeled,
                    negative: characterSkill.negative
                };
            }
        }
        
        return skillData || { name: skillName, description: 'No description available.' };
    }

    formatSkillDescription(skillData) {
        if (!skillData) {
            return '<div class="skill-description-content"><div class="no-description">No description available.</div></div>';
        }
        
        let html = '<div class="skill-description-content">';
        html += `<h4>${skillData.name}</h4>`;
        
        // Add tags/properties
        if (skillData.magical || skillData.illegal || skillData.reaction || skillData.channeled || skillData.negative || skillData.custom) {
            html += '<div style="margin-bottom: 12px;">';
            if (skillData.custom) html += '<span class="tag-badge">Custom</span>';
            if (skillData.magical && !skillData.illegal) html += '<span class="tag-badge">Magical</span>';
            if (skillData.illegal) html += '<span class="tag-badge illegal-badge">ILLEGAL</span>';
            if (skillData.reaction) html += '<span class="tag-badge">Reaction</span>';
            if (skillData.channeled) html += '<span class="tag-badge">Channeled</span>';
            if (skillData.negative) html += '<span class="tag-badge illegal-badge">Negative</span>';
            html += '</div>';
        }
        
        // Add description
        html += `<div class="description-text">${skillData.description}</div>`;
        
        // Add mechanics information if available
        if (skillData.time || skillData.damage || skillData.range || skillData.applicableWeapons) {
            html += '<div class="mechanics-section">';
            html += '<div class="mechanics-title">Mechanics:</div>';
            if (skillData.time) html += `<div class="mechanics-item"><strong>Time:</strong> ${skillData.time}</div>`;
            if (skillData.damage) html += `<div class="mechanics-item"><strong>Damage:</strong> ${skillData.damage}</div>`;
            if (skillData.range) html += `<div class="mechanics-item"><strong>Range:</strong> ${skillData.range}</div>`;
            if (skillData.applicableWeapons) {
                html += `<div class="mechanics-item"><strong>Weapons:</strong> ${skillData.applicableWeapons.join(', ')}</div>`;
            }
            html += '</div>';
        }
        
        html += '</div>';
        return html;
    }

    createInfoIcon(skillName, skillType, parentKey = null) {
        return `<span class="skill-info-icon" onclick="skillManager.showSkillDescription('${skillName}', '${skillType}', '${parentKey || ''}')" title="Show skill description">?</span>`;
    }

    // Check if skill already exists
    skillAlreadyExists(name, type, parentId) {
        return characterManager.character.skills.some(skill => 
            skill.name === name && 
            skill.type === type && 
            skill.parent === parentId
        );
    }

    // Add a new skill to character
    addSkill(name, type, defaultLevel = 0, magical = false, parentId = null) {
        characterManager.saveStateForUndo(`Add skill: ${name}`);
        
        // Handle parent domain creation if needed
        if (parentId && !this.skillAlreadyExists(parentId, 'domain', null)) {
            const parentDomain = skillDatabase.domains[parentId];
            if (parentDomain) {
                const newParentId = parentId + '_' + Date.now();
                const newParent = {
                    id: newParentId,
                    name: parentDomain.name,
                    level: parentDomain.defaultLevel,
                    xp: 0,
                    type: 'domain',
                    parent: null,
                    magical: parentDomain.magical !== false
                };
                characterManager.character.skills.push(newParent);
                parentId = newParentId;
            }
        }
        
        const finalType = type === 'non-magical' ? 'skill' : type;
        
        // Check if skill already exists before creating
        if (this.skillAlreadyExists(name, finalType, parentId)) {
            console.log('Skill already exists, skipping creation:', name);
            characterManager.actionHistory.pop();
            characterManager.updateUndoUI();
            this.renderMagicalSkills();
            this.renderCombatSkills(); 
            this.renderGeneralSkills();
            return;
        }
        
        const newSkill = {
            id: name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
            name: name,
            level: defaultLevel || 0,
            xp: 0,
            type: finalType,
            parent: parentId,
            magical: magical
        };
        
        characterManager.character.skills.push(newSkill);
        this.renderSkills();
        
        // Force refresh of the skill browser to update "Already learned" status
        this.renderMagicalSkills();
        this.renderCombatSkills();
        this.renderGeneralSkills();
        
        storageManager.saveCharacter();
        storageManager.updateAutoSaveStatus(`Added skill: ${name}`);
    }

    // Delete a skill
    deleteSkill(skillId) {
        const skillIndex = characterManager.character.skills.findIndex(s => s.id === skillId);
        if (skillIndex !== -1) {
            const skill = characterManager.character.skills[skillIndex];
            characterManager.saveStateForUndo(`Delete skill: ${skill.name}`);
            
            // Remove the skill
            characterManager.character.skills.splice(skillIndex, 1);
            
            // Remove any dependent skills
            characterManager.character.skills = characterManager.character.skills.filter(s => s.parent !== skillId);
            
            this.renderSkills();
            storageManager.saveCharacter();
            storageManager.updateAutoSaveStatus(`Deleted skill: ${skill.name}`);
        }
    }

    // Add XP to a skill
    addXP(skillId, amount) {
        const skill = characterManager.character.skills.find(s => s.id === skillId);
        if (skill) {
            characterManager.saveStateForUndo(`Add ${amount} XP to ${skill.name}`);
            skill.xp += amount;
            
            // Check for level up
            const xpNeeded = this.getXPForNextLevel(skill.level);
            if (skill.xp >= xpNeeded) {
                skill.level++;
                skill.xp = 0;
                storageManager.updateAutoSaveStatus(`${skill.name} leveled up to ${skill.level}!`);
            }
            
            this.renderSkills();
            storageManager.saveCharacter();
        }
    }

    // Get XP needed for next level
    getXPForNextLevel(currentLevel) {
        // Standard XP progression
        return Math.max(1, Math.abs(currentLevel) + 1) * 100;
    }

    // Render all skills
    renderSkills() {
        const container = document.getElementById('skillsList');
        if (!container) return;
        
        const skills = characterManager.character.skills;
        
        // Group skills by domain
        const domains = new Map();
        const orphanedSkills = [];
        
        // First pass: collect domains
        skills.forEach(skill => {
            if (skill.type === 'domain') {
                domains.set(skill.id, {
                    skill: skill,
                    children: []
                });
            }
        });
        
        // Second pass: group skills under domains
        skills.forEach(skill => {
            if (skill.type !== 'domain') {
                if (skill.parent && domains.has(skill.parent)) {
                    domains.get(skill.parent).children.push(skill);
                } else {
                    orphanedSkills.push(skill);
                }
            }
        });
        
        let html = '';
        
        // Render domains and their skills
        domains.forEach((domainData, domainId) => {
            html += this.renderDomain(domainData.skill, domainData.children);
        });
        
        // Render orphaned skills
        if (orphanedSkills.length > 0) {
            html += '<div class="skill-domain">';
            html += '<div class="domain-header">';
            html += '<span class="domain-name">Other Skills</span>';
            html += '</div>';
            
            orphanedSkills.forEach(skill => {
                html += this.renderSkillItem(skill);
            });
            
            html += '</div>';
        }
        
        container.innerHTML = html;
    }

    renderDomain(domain, children) {
        const domainClass = domain.magical === false ? 'non-magical' : 
                           domain.illegal ? 'illegal-domain' : '';
        
        let html = `<div class="skill-domain ${domainClass}">`;
        html += '<div class="domain-header">';
        html += `<span class="domain-name">${domain.name}`;
        html += this.createInfoIcon(domain.name, 'domain');
        html += '</span>';
        html += `<span class="skill-level">Level ${domain.level}</span>`;
        html += `<button class="delete-button" onclick="skillManager.deleteSkill('${domain.id}')">Delete</button>`;
        html += '</div>';
        
        // Domain progress bar
        html += this.renderSkillProgress(domain);
        
        // Render children
        children.forEach(child => {
            html += this.renderSkillItem(child, true);
        });
        
        html += '</div>';
        return html;
    }

    renderSkillItem(skill, isSubSkill = false) {
        const itemClass = isSubSkill ? 'sub-skill' : 'skill-item';
        const parentKey = skill.parent || '';
        
        let html = `<div class="${itemClass}">`;
        html += '<div class="skill-info">';
        html += `<span>${skill.name}`;
        html += this.createInfoIcon(skill.name, skill.type, parentKey);
        if (skill.illegal) html += '<span class="illegal-skill-indicator">ILLEGAL</span>';
        html += '</span>';
        html += `<span>Level ${skill.level}</span>`;
        html += `<button class="delete-button" onclick="skillManager.deleteSkill('${skill.id}')">Delete</button>`;
        html += '</div>';
        
        html += this.renderSkillProgress(skill);
        html += '</div>';
        
        return html;
    }

    renderSkillProgress(skill) {
        const xpNeeded = this.getXPForNextLevel(skill.level);
        const progressPercent = (skill.xp / xpNeeded) * 100;
        
        let html = '<div class="skill-progress">';
        html += '<div class="progress-bar">';
        html += `<div class="progress-fill" style="width: ${progressPercent}%"></div>`;
        html += '</div>';
        html += `<span>XP: ${skill.xp}/${xpNeeded}</span>`;
        html += `<button class="xp-button" onclick="skillManager.addXP('${skill.id}', 10)">+10 XP</button>`;
        html += `<button class="xp-button" onclick="skillManager.addXP('${skill.id}', 50)">+50 XP</button>`;
        html += '</div>';
        
        return html;
    }

    // Tab switching
    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab content
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[onclick="skillManager.switchTab('${tabName}')"]`).classList.add('active');
    }

    // Initialize weapon selector
    initializeWeaponSelector() {
        const selector = document.getElementById('weaponSelector');
        if (!selector) return;
        
        let html = '<option value="">All Weapons</option>';
        Object.entries(skillDatabase.weaponSkills).forEach(([key, weapon]) => {
            html += `<option value="${key}">${weapon.name}</option>`;
        });
        selector.innerHTML = html;
        
        selector.addEventListener('change', () => {
            this.selectedWeapon = selector.value;
            this.renderCombatSkills();
        });
    }
}

// Create global instance
const skillManager = new SkillManager();