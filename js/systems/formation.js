/* ========================================
 * PIXEL RAID — Formation System
 * 3-position deck layout
 * ======================================== */

const Formation = {
    // Deck positions: [front, mid1, mid2, back1, back2]
    // Front takes damage first, back is safest
    positions: [
        { id: 0, label: 'Front', row: 'front', cardId: null },
        { id: 1, label: 'Mid-L', row: 'mid',   cardId: null },
        { id: 2, label: 'Mid-R', row: 'mid',   cardId: null },
        { id: 3, label: 'Back-L', row: 'back',  cardId: null },
        { id: 4, label: 'Back-R', row: 'back',  cardId: null },
    ],

    init() {
        // Load deck from GameState
        this.positions.forEach((pos, i) => {
            pos.cardId = GameState.deck[i] || null;
        });
    },

    placeCard(positionId, cardId) {
        // Remove card from other positions first
        this.positions.forEach(pos => {
            if (pos.cardId === cardId) pos.cardId = null;
        });
        this.positions[positionId].cardId = cardId;
        this.syncToGameState();
    },

    removeCard(positionId) {
        this.positions[positionId].cardId = null;
        this.syncToGameState();
    },

    getDeckCardIds() {
        return this.positions.map(p => p.cardId).filter(Boolean);
    },

    syncToGameState() {
        GameState.deck = this.getDeckCardIds();
        // Update inDeck flags
        GameState.collection.forEach(c => c.inDeck = GameState.deck.includes(c.id));
        GameState.save();
    },

    getSynergies() {
        const deckCards = GameState.getDeckCards();
        const classCounts = {};
        deckCards.forEach(c => {
            classCounts[c.class] = (classCounts[c.class] || 0) + 1;
        });

        const active = [];
        
        // Class synergies
        for (const [cls, count] of Object.entries(classCounts)) {
            const syn = SYNERGIES[cls];
            if (syn) {
                const tier = count >= 3 ? 3 : count >= 2 ? 2 : 0;
                if (tier && syn[tier]) {
                    active.push({ type: 'class', desc: syn[tier].desc, active: true });
                } else if (syn[2]) {
                    active.push({ type: 'class', desc: `Need ${2 - count} more ${CLASSES[cls].name}`, active: false });
                }
            }
        }

        // Cross-class combos
        const classSet = new Set(deckCards.map(c => c.class));
        for (const combo of COMBO_SYNERGIES) {
            const has = combo.classes.filter(c => classSet.has(c));
            if (has.length === combo.classes.length) {
                active.push({ type: 'combo', desc: combo.desc, active: true });
            } else if (has.length === combo.classes.length - 1) {
                const missing = combo.classes.find(c => !classSet.has(c));
                active.push({ type: 'combo', desc: `Need ${CLASSES[missing].name} for combo`, active: false });
            }
        }

        return active;
    },

    renderGrid() {
        const grid = document.getElementById('formation-grid');
        if (!grid) return;
        grid.innerHTML = '';

        this.positions.forEach((pos, i) => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell' + (pos.cardId ? ' occupied' : '');
            cell.dataset.position = i;

            const rowLabel = document.createElement('span');
            rowLabel.className = 'row-label';
            rowLabel.textContent = pos.label;
            cell.appendChild(rowLabel);

            if (pos.cardId) {
                const card = GameState.getCardById(pos.cardId);
                if (card) {
                    const sprite = document.createElement('canvas');
                    sprite.className = 'cell-sprite';
                    sprite.width = 32;
                    sprite.height = 32;
                    CardRenderer.drawCardSprite(sprite, card, 32);
                    cell.appendChild(sprite);

                    const name = document.createElement('div');
                    name.className = 'cell-name';
                    name.textContent = card.name;
                    cell.appendChild(name);

                    // Remove button
                    const removeBtn = document.createElement('div');
                    removeBtn.textContent = '✕';
                    removeBtn.style.cssText = 'position:absolute;top:2px;right:4px;cursor:pointer;font-size:8px;color:#ff4444;';
                    removeBtn.onclick = (e) => {
                        e.stopPropagation();
                        this.removeCard(i);
                        this.renderGrid();
                        this.renderBench();
                        this.renderSynergies();
                    };
                    cell.appendChild(removeBtn);
                }
            }

            // Drop zone
            cell.addEventListener('dragover', e => { e.preventDefault(); cell.classList.add('drag-over'); });
            cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
            cell.addEventListener('drop', e => {
                e.preventDefault();
                cell.classList.remove('drag-over');
                const cardId = parseInt(e.dataTransfer.getData('cardId'));
                if (cardId) {
                    this.placeCard(i, cardId);
                    this.renderGrid();
                    this.renderBench();
                    this.renderSynergies();
                }
            });

            // Click to remove
            cell.addEventListener('click', () => {
                if (pos.cardId) {
                    this.removeCard(i);
                    this.renderGrid();
                    this.renderBench();
                    this.renderSynergies();
                }
            });

            grid.appendChild(cell);
        });
    },

    renderBench() {
        const bench = document.getElementById('bench-heroes');
        if (!bench) return;
        bench.innerHTML = '';

        const inDeck = this.getDeckCardIds();
        const available = GameState.collection.filter(c => !inDeck.includes(c.id));

        if (available.length === 0) {
            bench.innerHTML = '<div style="font-size:7px;color:var(--text-dim);padding:8px;">No cards available. Open packs!</div>';
            return;
        }

        available.forEach(card => {
            const el = document.createElement('div');
            el.className = 'bench-hero';
            el.draggable = true;
            el.addEventListener('dragstart', e => {
                e.dataTransfer.setData('cardId', card.id.toString());
            });

            const sprite = document.createElement('canvas');
            sprite.className = 'mini-sprite';
            sprite.width = 24;
            sprite.height = 24;
            CardRenderer.drawCardSprite(sprite, card, 24);
            el.appendChild(sprite);

            const info = document.createElement('div');
            info.innerHTML = `
                <div style="color:${RARITIES[card.rarity].color}">${card.name}</div>
                <div style="font-size:6px;color:var(--text-dim)">${CLASSES[card.class].emoji} ${CLASSES[card.class].name} • PWR ${getCardPower(card)}</div>
            `;
            el.appendChild(info);

            bench.appendChild(el);
        });
    },

    renderSynergies() {
        const list = document.getElementById('synergy-list');
        if (!list) return;
        list.innerHTML = '';

        const synergies = this.getSynergies();
        if (synergies.length === 0) {
            list.innerHTML = '<div style="font-size:7px;color:var(--text-dim);">Place cards with matching classes to activate synergies!</div>';
            return;
        }

        synergies.forEach(syn => {
            const el = document.createElement('div');
            el.className = 'synergy-item ' + (syn.active ? 'synergy-active' : 'synergy-inactive');
            el.textContent = (syn.active ? '✅ ' : '🔒 ') + syn.desc;
            list.appendChild(el);
        });
    },
};
