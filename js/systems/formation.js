/* ========================================
 * PIXEL RAID — Formation Grid + Synergy System
 * 3-column x 2-row grid with drag & drop
 * ======================================== */

// ===== SYNERGY RULES =====
// Each rule defines requirements and stat bonuses applied at battle start
const FORMATION_SYNERGIES = [
    {
        id: 'warrior_trio',
        name: 'Iron Wall',
        icon: '🛡️',
        requires: [{ type: 'warrior', count: 3 }],
        bonus: { def: 20 },
        description: 'All Warriors +20 DEF',
    },
    {
        id: 'mage_duo',
        name: 'Arcane Surge',
        icon: '🔮',
        requires: [{ type: 'mage', count: 2 }],
        bonus: { atk: 15 },
        description: 'All Mages +15 ATK',
    },
    {
        id: 'balanced',
        name: 'Full Balance',
        icon: '⚖️',
        requires: [
            { type: 'warrior', count: 1 },
            { type: 'mage', count: 1 },
            { type: 'healer', count: 1 },
        ],
        bonus: { hp: 50 },
        description: 'All heroes +50 HP',
    },
    {
        id: 'archer_duo',
        name: 'Eagle Eye',
        icon: '🦅',
        requires: [{ type: 'archer', count: 2 }],
        bonus: { spd: 10 },
        description: 'All Archers +10 SPD',
    },
    {
        id: 'full_tank',
        name: 'Fortress',
        icon: '🏰',
        requires: [
            { type: 'tank', count: 2 },
            { type: 'healer', count: 1 },
        ],
        bonus: { def: 30, hp: 100 },
        description: 'Tanks +30 DEF, all +100 HP',
    },
];

const FORMATION_STORAGE_KEY = 'pixel_raid_formation';

const Formation = {
    // 3 columns x 2 rows = 6 slots
    // [0,1,2] = top row (front — takes damage first)
    // [3,4,5] = bottom row (back — safer)
    slots: [null, null, null, null, null, null],

    // ===== INITIALIZATION =====

    init() {
        this.load();
        // Sync from GameState.deck if formation is empty but deck exists
        if (this.slots.every(s => s === null) && GameState.deck.length > 0) {
            GameState.deck.forEach((cardId, i) => {
                if (i < 6) this.slots[i] = cardId;
            });
            this.save();
        }
    },

    // ===== PERSISTENCE =====

    save() {
        try {
            localStorage.setItem(FORMATION_STORAGE_KEY, JSON.stringify(this.slots));
        } catch (e) {
            console.warn('FormationGrid: failed to save', e);
        }
    },

    load() {
        try {
            const raw = localStorage.getItem(FORMATION_STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                if (Array.isArray(data) && data.length === 6) {
                    this.slots = data;
                }
            }
        } catch (e) {
            console.warn('FormationGrid: failed to load', e);
        }
    },

    // ===== SLOT OPERATIONS =====

    placeCard(slotIndex, cardId) {
        if (slotIndex < 0 || slotIndex > 5) return false;

        // If card already in another slot, swap or remove
        const existingSlot = this.slots.indexOf(cardId);
        if (existingSlot !== -1) {
            // Swap: put the current occupant of target slot into the old slot
            this.slots[existingSlot] = this.slots[slotIndex];
        }

        this.slots[slotIndex] = cardId;
        this.syncToGameState();
        this.save();
        return true;
    },

    removeCard(slotIndex) {
        if (slotIndex < 0 || slotIndex > 5) return;
        this.slots[slotIndex] = null;
        this.syncToGameState();
        this.save();
    },

    removeCardById(cardId) {
        const idx = this.slots.indexOf(cardId);
        if (idx !== -1) {
            this.slots[idx] = null;
            this.syncToGameState();
            this.save();
        }
    },

    getCardAtSlot(slotIndex) {
        return this.slots[slotIndex] || null;
    },

    getFormationCardIds() {
        return this.slots.filter(Boolean);
    },

    getOccupiedCount() {
        return this.slots.filter(Boolean).length;
    },

    // ===== GAME STATE SYNC =====

    syncToGameState() {
        GameState.deck = this.getFormationCardIds();
        GameState.collection.forEach(c => {
            c.inDeck = GameState.deck.includes(c.id);
        });
        GameState.save();
    },

    // ===== SYNERGY DETECTION =====

    /**
     * Count hero types in the active formation
     * @returns {Object} { warrior: 2, mage: 1, ... }
     */
    getTypeCounts() {
        const counts = {};
        for (const cardId of this.slots) {
            if (!cardId) continue;
            const card = GameState.getCardById(cardId);
            if (!card) continue;
            // Use card.type if available, fallback to card.class
            const heroType = card.type || card.cls;
            counts[heroType] = (counts[heroType] || 0) + 1;
        }
        return counts;
    },

    /**
     * Check which synergies are active based on current formation
     * @returns {Array} [{ rule, active, missing }]
     */
    getActiveSynergies() {
        const counts = this.getTypeCounts();
        const results = [];

        for (const rule of FORMATION_SYNERGIES) {
            const reqs = Array.isArray(rule.requires[0])
                ? rule.requires
                : [rule.requires];

            // Flatten: supports both single requirement and array of requirements
            const flatReqs = Array.isArray(rule.requires) && rule.requires.length > 0 && typeof rule.requires[0] === 'object' && !Array.isArray(rule.requires[0]) && rule.requires[0].type
                ? rule.requires
                : rule.requires;

            let allMet = true;
            let missing = [];

            for (const req of flatReqs) {
                const current = counts[req.type] || 0;
                if (current < req.count) {
                    allMet = false;
                    const diff = req.count - current;
                    missing.push({ type: req.type, needed: diff });
                }
            }

            results.push({
                rule,
                active: allMet,
                missing,
            });
        }

        return results;
    },

    /**
     * Get only the active synergy rules
     * @returns {Array} of synergy rule objects
     */
    getActiveSynergyRules() {
        return this.getActiveSynergies()
            .filter(s => s.active)
            .map(s => s.rule);
    },

    // ===== BONUS APPLICATION (RUNTIME ONLY) =====

    /**
     * Apply formation synergy bonuses to hero copies (non-permanent)
     * Call this BEFORE battle starts with deep copies of hero stats
     * @param {Array} heroes - Array of hero objects with stats
     * @returns {Array} heroes with boosted stats
     */
    applyFormationBonuses(heroes) {
        const activeSynergies = this.getActiveSynergyRules();
        if (activeSynergies.length === 0) return heroes;

        // Count types among the heroes being boosted
        const heroTypeMap = {};
        heroes.forEach(h => {
            const t = h.type || h.cls;
            heroTypeMap[t] = heroTypeMap[t] || [];
            heroTypeMap[t].push(h);
        });

        for (const synergy of activeSynergies) {
            const reqs = Array.isArray(synergy.requires) && synergy.requires.length > 0 && typeof synergy.requires[0] === 'object' && synergy.requires[0].type
                ? synergy.requires
                : [synergy.requires];

            // Determine which heroes get the bonus
            for (const req of reqs) {
                const affectedHeroes = heroTypeMap[req.type] || [];

                for (const hero of affectedHeroes) {
                    for (const [stat, value] of Object.entries(synergy.bonus)) {
                        if (stat === 'hp') {
                            hero.stats.hp += value;
                            hero.stats.maxHp += value;
                        } else if (hero.stats[stat] !== undefined) {
                            hero.stats[stat] += value;
                        }
                    }
                }
            }

            // For "balanced" type synergies, apply to ALL heroes
            if (synergy.id === 'balanced') {
                for (const hero of heroes) {
                    for (const [stat, value] of Object.entries(synergy.bonus)) {
                        if (stat === 'hp') {
                            hero.stats.hp += value;
                            hero.stats.maxHp += value;
                        }
                    }
                }
            }

            // For "full_tank", apply HP to all, DEF only to tanks
            if (synergy.id === 'full_tank') {
                for (const hero of heroes) {
                    if (synergy.bonus.hp) {
                        hero.stats.hp += synergy.bonus.hp;
                        hero.stats.maxHp += synergy.bonus.hp;
                    }
                }
            }
        }

        return heroes;
    },

    // ===== DRAG & DROP STATE =====

    _dragCardId: null,
    _dragSourceSlot: null, // null if from bench, slot index if from grid

    // ===== RENDERING =====

    render() {
        this.renderGrid();
        this.renderBench();
        this.renderSynergyPanel();
    },

    renderGrid() {
        const grid = document.getElementById('formation-grid');
        if (!grid) return;
        grid.innerHTML = '';

        for (let i = 0; i < 6; i++) {
            const cell = document.createElement('div');
            cell.className = 'fg-cell';
            cell.dataset.slot = i;

            // Row label
            const isFront = i < 3;
            const rowLabel = document.createElement('div');
            rowLabel.className = 'fg-row-label';
            rowLabel.textContent = isFront ? 'FRONT' : 'BACK';
            cell.appendChild(rowLabel);

            // Slot number
            const slotNum = document.createElement('div');
            slotNum.className = 'fg-slot-num';
            slotNum.textContent = `#${i + 1}`;
            cell.appendChild(slotNum);

            const cardId = this.slots[i];
            if (cardId) {
                const card = GameState.getCardById(cardId);
                if (card) {
                    cell.classList.add('fg-occupied');

                    // Rarity border color
                    const rarityColor = RARITIES[card.rarity]?.color || '#8a8a7a';
                    cell.style.borderColor = rarityColor;

                    // Hero sprite
                    const sprite = this._createSprite(card, 32);
                    cell.appendChild(sprite);

                    // Hero name (max 8 chars)
                    const name = document.createElement('div');
                    name.className = 'fg-hero-name';
                    name.textContent = card.name.length > 8 ? card.name.substring(0, 8) : card.name;
                    name.style.color = rarityColor;
                    cell.appendChild(name);

                    // Stats row
                    const stats = document.createElement('div');
                    stats.className = 'fg-hero-stats';
                    stats.innerHTML = `<span class="fg-stat-hp">HP:${card.stats.hp}</span> <span class="fg-stat-atk">ATK:${card.stats.atk}</span>`;
                    cell.appendChild(stats);

                    // Remove button
                    const removeBtn = document.createElement('div');
                    removeBtn.className = 'fg-remove-btn';
                    removeBtn.textContent = '✕';
                    removeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.removeCard(i);
                        this.render();
                    });
                    cell.appendChild(removeBtn);
                }
            }

            // Drag & Drop — grid slots
            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                cell.classList.add('fg-drag-over');
            });

            cell.addEventListener('dragleave', () => {
                cell.classList.remove('fg-drag-over');
            });

            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                cell.classList.remove('fg-drag-over');
                const droppedCardId = parseInt(e.dataTransfer.getData('text/plain'));
                if (droppedCardId) {
                    this.placeCard(i, droppedCardId);
                    this.render();
                }
            });

            // Touch support for drop
            cell.addEventListener('touchend', (e) => {
                if (this._dragCardId) {
                    e.preventDefault();
                    this.placeCard(i, this._dragCardId);
                    this._dragCardId = null;
                    this._dragSourceSlot = null;
                    this.render();
                }
            });

            // Make grid cells draggable if occupied (for moving between slots)
            if (cardId) {
                cell.draggable = true;
                cell.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', cardId.toString());
                    e.dataTransfer.effectAllowed = 'move';
                    this._dragCardId = cardId;
                    this._dragSourceSlot = i;
                    cell.classList.add('fg-dragging');
                    // Remove from source after a tick (visual feedback)
                    setTimeout(() => {
                        this.slots[i] = null;
                        this.syncToGameState();
                    }, 0);
                });

                cell.addEventListener('dragend', () => {
                    cell.classList.remove('fg-dragging');
                    // If drag ended without a drop, restore the card
                    if (this._dragSourceSlot === i && this.slots[i] === null) {
                        this.slots[i] = cardId;
                        this.syncToGameState();
                    }
                    this._dragCardId = null;
                    this._dragSourceSlot = null;
                    this.save();
                    this.render();
                });

                // Touch drag support
                cell.addEventListener('touchstart', (e) => {
                    this._dragCardId = cardId;
                    this._dragSourceSlot = i;
                    cell.classList.add('fg-dragging');
                }, { passive: true });
            }

            grid.appendChild(cell);
        }
    },

    renderBench() {
        const bench = document.getElementById('bench-heroes');
        if (!bench) return;
        bench.innerHTML = '';

        const inFormation = this.getFormationCardIds();
        const available = GameState.collection.filter(c => !inFormation.includes(c.id));

        if (available.length === 0) {
            bench.innerHTML = '<div class="fg-bench-empty">No heroes available. Open packs!</div>';
            return;
        }

        // Sort by power (descending)
        available.sort((a, b) => getCardPower(b) - getCardPower(a));

        available.forEach(card => {
            const el = document.createElement('div');
            el.className = 'fg-bench-card';
            el.draggable = true;

            // Rarity border
            const rarityColor = RARITIES[card.rarity]?.color || '#8a8a7a';
            el.style.borderColor = rarityColor;

            // Sprite
            const sprite = this._createSprite(card, 24);
            el.appendChild(sprite);

            // Info
            const info = document.createElement('div');
            info.className = 'fg-bench-info';
            info.innerHTML = `
                <div class="fg-bench-name" style="color:${rarityColor}">${card.name}</div>
                <div class="fg-bench-meta">${CLASSES[card.class]?.emoji || '?'} ${CLASSES[card.class]?.name || card.class} · ${getCardPower(card)}</div>
            `;
            el.appendChild(info);

            // Drag from bench
            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.id.toString());
                e.dataTransfer.effectAllowed = 'copy';
                this._dragCardId = card.id;
                this._dragSourceSlot = null;
            });

            el.addEventListener('dragend', () => {
                this._dragCardId = null;
                this._dragSourceSlot = null;
            });

            // Touch drag
            el.addEventListener('touchstart', () => {
                this._dragCardId = card.id;
                this._dragSourceSlot = null;
            }, { passive: true });

            bench.appendChild(el);
        });
    },

    renderSynergyPanel() {
        const panel = document.getElementById('synergy-panel');
        if (!panel) return;
        panel.innerHTML = '';

        const synergies = this.getActiveSynergies();
        const header = document.createElement('div');
        header.className = 'fg-synergy-header';
        header.textContent = 'SYNERGIES';
        panel.appendChild(header);

        if (this.getOccupiedCount() === 0) {
            const empty = document.createElement('div');
            empty.className = 'fg-synergy-empty';
            empty.textContent = 'Place heroes to activate synergies!';
            panel.appendChild(empty);
            return;
        }

        for (const { rule, active, missing } of synergies) {
            const badge = document.createElement('div');
            badge.className = 'fg-synergy-badge' + (active ? ' fg-synergy-active' : ' fg-synergy-inactive');

            if (active) {
                badge.innerHTML = `
                    <span class="fg-syn-icon">${rule.icon}</span>
                    <span class="fg-syn-name">${rule.name}</span>
                    <span class="fg-syn-desc">— ${rule.description}</span>
                `;
                // Fade-in animation
                badge.style.animation = 'fgFadeIn 0.3s ease forwards';
            } else {
                const missingText = missing.map(m => `${m.needed} more ${m.type}`).join(', ');
                badge.innerHTML = `
                    <span class="fg-syn-icon">${rule.icon}</span>
                    <span class="fg-syn-name">${rule.name}</span>
                    <span class="fg-syn-missing">Need ${missingText}</span>
                `;
            }

            panel.appendChild(badge);
        }
    },

    // ===== HELPERS =====

    _createSprite(card, size) {
        const tmpl = getTemplateByName(card.templateId || card.name);

        if (tmpl && tmpl.image) {
            const img = document.createElement('img');
            img.className = 'fg-sprite';
            img.width = size;
            img.height = size;
            img.style.imageRendering = 'pixelated';
            img.src = tmpl.image;
            img.onerror = function () {
                // Fallback to canvas sprite on image load error
                const cvs = document.createElement('canvas');
                cvs.className = 'fg-sprite';
                cvs.width = size;
                cvs.height = size;
                if (typeof CardRenderer !== 'undefined') {
                    CardRenderer.drawCardSprite(cvs, card, size);
                }
                img.replaceWith(cvs);
            };
            return img;
        }

        // Canvas fallback
        const cvs = document.createElement('canvas');
        cvs.className = 'fg-sprite';
        cvs.width = size;
        cvs.height = size;
        if (typeof CardRenderer !== 'undefined') {
            CardRenderer.drawCardSprite(cvs, card, size);
        }
        return cvs;
    },

    // ===== BACKWARD COMPAT ALIASES =====
    renderSynergies() { this.renderSynergyPanel(); },
};

// ===== EXPORTED API FOR BATTLE.JS =====
// These global functions are the integration layer

/**
 * Get the active formation as an array of card objects (null for empty slots)
 * @returns {Array} [hero0, hero1, ..., hero5] with nulls for empty
 */
function getActiveFormation() {
    return Formation.slots.map(id => id ? GameState.getCardById(id) : null);
}

/**
 * Get array of active synergy rule objects
 * @returns {Array} of synergy rules that are currently met
 */
function getActiveSynergies() {
    return Formation.getActiveSynergyRules();
}

/**
 * Apply formation synergy bonuses to hero copies (non-permanent, runtime only)
 * Call before battle.startBattle() with hero stat copies
 * @param {Array} heroes - Array of hero objects with .stats
 * @returns {Array} same heroes with boosted stats
 */
function applyFormationBonuses(heroes) {
    return Formation.applyFormationBonuses(heroes);
}
