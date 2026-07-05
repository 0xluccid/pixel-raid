/* ========================================
 * PIXEL RAID — Card Hand Renderer (v4)
 * Pokemon TCG Chaos Rising style cards
 * Portrait orientation, premium pixel art aesthetic
 * Click to play cards during Main Phase
 * ======================================== */

const CardHand = {
    container: null,
    selectedCard: null,
    enabled: false,
    onCardPlay: null,  // callback(handIndex, card)

    /**
     * Initialize card hand UI
     * @param {string} containerId - DOM id for hand container
     */
    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.warn('CardHand container not found:', containerId);
            return;
        }
        // Inject card CSS styles on first init
        this.injectStyles();
        // Clear old state on re-init (e.g. after retry)
        this.container.innerHTML = '';
        this.container.classList.add('card-hand-container');
        this.selectedCard = null;
        this.enabled = false;
    },

    /**
     * Render current hand — supports both old API and new combatant API
     * @param {Array} hand - Array of card objects
     * @param {Object} combatantOrMana - Combatant object (new) or mana number (old)
     * @param {boolean} enabled - Whether cards can be played
     * @param {Object} options - { hasEmptyHeroZone, hasSummoned }
     */
    render(hand, combatantOrMana, enabled = false, options = {}) {
        if (!this.container) return;
        this.enabled = enabled;
        this.container.innerHTML = '';

        const hasEmptyHeroZone = options.hasEmptyHeroZone !== undefined ? options.hasEmptyHeroZone : true;
        const hasSummoned = options.hasSummoned || false;
        const hasUsedSkill = options.hasUsedSkill || false;
        const canPlayCard = options.canPlayCard !== undefined ? options.canPlayCard : true;

        // Support both old (mana int) and new (combatant object) APIs
        let currentMana = 0;
        let combatant = null;
        if (typeof combatantOrMana === 'number') {
            currentMana = combatantOrMana;
        } else if (combatantOrMana && typeof combatantOrMana === 'object') {
            combatant = combatantOrMana;
            currentMana = combatant.mana || 0;
        }

        if (!hand || hand.length === 0) {
            this.container.innerHTML = `
                <div class="hand-empty">No cards in hand</div>
            `;
            return;
        }

        hand.forEach((card, index) => {
            let canPlay = enabled && canPlayCard;
            if (card.cardType === 'hero' && combatant) {
                canPlay = enabled && canPlayCard && hasEmptyHeroZone && !hasSummoned;
            } else if (card.cardType === 'skill') {
                canPlay = enabled && canPlayCard && !hasUsedSkill;
            }

            try {
                const el = this._createCardElement(card, index, canPlay, currentMana);
                this.container.appendChild(el);
            } catch (e) {
                console.warn('CardHand: failed to render card', index, e);
            }
        });
    },

    /**
     * Create a single card DOM element — Pokemon TCG Chaos Rising style
     */
    _createCardElement(card, index, canPlay, currentMana) {
        const el = document.createElement('div');

        // Determine card class based on type
        if (card.cardType === 'hero') {
            el.className = `battle-card hero-card rarity-${card.rarity || 'common'}`;
        } else {
            el.className = `battle-card skill-card rarity-${card.rarity || 'common'}`;
        }

        if (canPlay) el.classList.add('card-playable');
        else el.classList.add('card-disabled');
        if (this.selectedCard === index) el.classList.add('card-selected');

        const rarityColor = RARITIES[card.rarity] ? RARITIES[card.rarity].color : '#aaa';

        el.style.borderColor = rarityColor;
        el.style.setProperty('--rarity-glow', rarityColor);

        if (card.cardType === 'hero') {
            // ===== HERO CARD — Element-themed TCG style =====
            const template = getTemplateByName(card.templateId || card.name);
            const cls = CLASSES[card.class || card.cls];
            const rarityStars = { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
            const stars = rarityStars[card.rarity] || 1;
            const clsColor = cls ? cls.color : '#888';
            const clsName = cls ? cls.name : 'Hero';
            const clsEmoji = cls ? cls.emoji : '⚔️';

            // Element info
            const cardEl = (typeof getCardElement === 'function') ? getCardElement(card) : null;
            const elIcon = cardEl ? cardEl.icon : '🌑';
            const elColor = cardEl ? cardEl.color : '#aa44cc';
            const elName = cardEl ? cardEl.name : 'Unknown';

            el.style.setProperty('--el-glow', elColor);
            el.style.borderColor = elColor;

            // Skill info from template
            const skill = card.skill || (template && template.skill) || null;
            const skillName = skill ? skill.name : 'None';
            const skillDesc = skill ? this._formatSkillDesc(skill) : 'No ability';
            const skillIcon = skill ? this._getSkillIcon(skill.type) : '✨';
            const lore = card.lore || (template && template.lore) || '';

            el.innerHTML = `
                <div class="tcg-header" style="background:linear-gradient(135deg, ${elColor}cc, ${clsColor}88)">
                    <span class="tcg-el-icon">${elIcon}</span>
                    <span class="tcg-name">${card.name}</span>
                    <span class="tcg-hp">HP ${card.stats.hp}</span>
                </div>
                <div class="tcg-stars-row">
                    <span class="tcg-stars">${'★'.repeat(stars)}</span>
                </div>
                <div class="tcg-art-window" style="background:linear-gradient(180deg, ${elColor}33, #0f3460, ${elColor}22)">
                    ${(() => {
                        const unitId = card.templateId || card.id;
                        const pixelUrl = (typeof PIXEL_ART !== 'undefined' && PIXEL_ART[unitId]) ? PIXEL_ART[unitId] : null;
                        if (pixelUrl) return `<img src="${pixelUrl}" class="tcg-art-img" style="image-rendering:pixelated" onerror="this.parentElement.innerHTML='<div class=\\\\\\'card-art-icon\\\\\\'>${elIcon}</div>'">`;
                        if (template && template.image) return `<img src="${template.image}" class="tcg-art-img" onerror="this.parentElement.innerHTML='<div class=\\\\\\'card-art-icon\\\\\\'>${elIcon}</div>'">`;
                        return `<div class="card-art-icon">${elIcon}</div>`;
                    })()}
                </div>
                <div class="tcg-el-badge" style="background:${elColor}44;border-color:${elColor}">
                    <span>${elIcon} ${elName}</span>
                    <span style="color:${rarityColor}">${clsEmoji} ${clsName}</span>
                </div>
                <div class="tcg-skill-box">
                    <div class="tcg-skill-header">
                        <span class="tcg-skill-icon">${skillIcon}</span>
                        <span class="tcg-skill-name">${skillName}</span>
                    </div>
                    <div class="tcg-skill-desc">${skillDesc}</div>
                </div>
                <div class="tcg-stats-box">
                    <div class="tcg-hp-bar">
                        <div class="tcg-hp-fill" style="background:${elColor}"></div>
                    </div>
                    <div class="tcg-stat-row">
                        <span class="card-atk">⚔${card.stats.atk}</span>
                        <span class="card-def">🛡${card.stats.def}</span>
                        <span class="card-spd">💨${card.stats.spd}</span>
                        <span class="card-crit">💥${card.stats.crit || 0}</span>
                    </div>
                </div>
            `;
        } else {
            // ===== SKILL CARD — TCG style with full info =====
            const typeInfo = CARD_TYPES[card.type] || { emoji: '✨', color: '#888' };
            const rarityStars = { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
            const stars = rarityStars[card.rarity] || 1;

            // Map unit type → element for TCG display
            const typeElementMap = {
                goblin: 'nature', beast: 'nature', undead: 'shadow',
                machine: 'arcane', knight: 'arcane', special: 'arcane'
            };
            const elKey = card.element || typeElementMap[card.type] || 'arcane';
            const elData = (typeof ELEMENTS !== 'undefined' && ELEMENTS[elKey]) || null;
            const elIcon = elData ? elData.icon : (card.emoji || typeInfo.emoji);
            const elName = elData ? elData.name : (card.type || 'Skill');
            const elColor = elData ? elData.color : typeInfo.color;

            // Build stats from card data
            const atk = card.atk || card.stats?.atk || 0;
            const hp = card.hp || card.stats?.hp || 0;
            const def = card.def || card.stats?.def || Math.floor(hp * 0.4);
            const spd = card.spd || card.stats?.spd || Math.floor(atk * 0.8);
            const manaCost = card.cost || card.manaCost || 0;

            // Skill description from card.desc or skill
            const skillDesc = card.skill
                ? this._formatSkillDesc(card.skill)
                : (card.desc || `${card.name} — ${elName} unit, ATK ${atk} HP ${hp}`);

            el.innerHTML = `
                <div class="tcg-header" style="background:linear-gradient(135deg, ${elColor}cc, ${typeInfo.color}88)">
                    <span class="tcg-el-icon">${elIcon}</span>
                    <span class="tcg-name">${card.name}</span>
                    ${manaCost ? `<span class="tcg-hp" style="color:#4fc3f7">⚡${manaCost}</span>` : ''}
                </div>
                <div class="tcg-stars-row">
                    <span class="tcg-stars">${'★'.repeat(stars)}</span>
                </div>
                <div class="tcg-art-window" style="background:linear-gradient(180deg, ${elColor}33, #0f3460, ${elColor}22)">
                    ${(() => {
                        const unitId = card.templateId || card.id;
                        const pixelUrl = (typeof PIXEL_ART !== 'undefined' && PIXEL_ART[unitId]) ? PIXEL_ART[unitId] : null;
                        if (pixelUrl) return `<img src="${pixelUrl}" class="tcg-art-img" style="image-rendering:pixelated" onerror="this.parentElement.innerHTML='<div class=\\\\\\'card-art-icon\\\\\\'>${elIcon}</div>'">`;
                        return `<div class="card-art-icon">${card.emoji || elIcon}</div>`;
                    })()}
                </div>
                <div class="tcg-el-badge" style="background:${elColor}44;border-color:${elColor}">
                    <span>${elIcon} ${elName}</span>
                    <span style="color:#aaa">${card.rarity ? card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1) : 'Common'}</span>
                </div>
                <div class="tcg-skill-box">
                    <div class="tcg-skill-header">
                        <span class="tcg-skill-icon">${card.skill ? this._getSkillIcon(card.skill.type) : elIcon}</span>
                        <span class="tcg-skill-name">${card.name}</span>
                    </div>
                    <div class="tcg-skill-desc">${skillDesc}</div>
                </div>
                <div class="tcg-stats-box">
                    <div class="tcg-hp-bar"><div class="tcg-hp-fill" style="background:${elColor}"></div></div>
                    <div class="tcg-stat-row">
                        <span class="card-atk">⚔${atk}</span>
                        <span class="card-def">🛡${def}</span>
                        <span class="card-spd">💨${spd}</span>
                    </div>
                </div>
            `;
        }

        // Click to play
        if (canPlay) {
            el.addEventListener('click', () => {
                if (!this.enabled) return;
                if (this.onCardPlay) {
                    this.onCardPlay(index, card);
                }
            });
        }

        // Hover effects — scale(1.05) + glow (300ms ease-out)
        el.addEventListener('mouseenter', () => {
            if (canPlay) el.style.transform = 'translateY(-14px) scale(1.05)';
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });

        return el;
    },

    /**
     * Animate card being played (fly up and fade)
     */
    animateCardPlay(cardIndex, callback) {
        const cards = this.container?.querySelectorAll('.battle-card');
        if (!cards || !cards[cardIndex]) {
            if (callback) callback();
            return;
        }

        const el = cards[cardIndex];
        if (typeof BattleAnimations !== 'undefined') {
            BattleAnimations.animateCardPlay(el, callback);
        } else {
            el.classList.add('card-playing');
            setTimeout(() => { if (callback) callback(); }, 350);
        }
    },

    /**
     * Shake a card (can't play indicator)
     */
    shakeCard(cardIndex) {
        const cards = this.container?.querySelectorAll('.battle-card');
        if (!cards || !cards[cardIndex]) return;
        const el = cards[cardIndex];
        if (typeof BattleAnimations !== 'undefined') {
            BattleAnimations.shakeCard(el);
        } else {
            el.classList.add('card-disabled');
            setTimeout(() => el.classList.remove('card-disabled'), 400);
        }
    },

    /**
     * Animate card being drawn (slide in from deck)
     */
    animateCardDraw() {
        if (typeof BattleAnimations !== 'undefined') {
            BattleAnimations.animateCardDraw(this.container);
        } else {
            const cards = this.container?.querySelectorAll('.battle-card');
            if (!cards || cards.length === 0) return;
            const last = cards[cards.length - 1];
            last.classList.add('card-draw-in');
            setTimeout(() => last.classList.remove('card-draw-in'), 500);
        }
    },

    /**
     * Highlight playable cards
     */
    highlightPlayable(hand, currentMana) {
        const cards = this.container?.querySelectorAll('.battle-card');
        if (!cards) return;

        cards.forEach((el, i) => {
            // Auto battler: all cards playable during play phase
            if (hand[i]) {
                el.classList.remove('card-disabled');
                el.classList.add('card-playable');
            } else {
                el.classList.add('card-disabled');
                el.classList.remove('card-playable');
            }
        });
    },

    /**
     * Convenience: render hand using BattleEngine state
     * Automatically enables cards only during 'play' phase
     */
    renderHand(hand, energy) {
        const canPlay = typeof BattleEngine !== 'undefined' && BattleEngine.currentPhase === 'play';
        this.render(hand, energy, canPlay);
    },
    clear() {
        if (this.container) this.container.innerHTML = '';
        this.selectedCard = null;
        this.enabled = false;
    },

    /**
     * Format skill description for card display
     */
    _formatSkillDesc(skill) {
        if (!skill) return '';
        const val = skill.val;
        const chance = Math.round((skill.chance || 0) * 100);
        const typeDescriptions = {
            'buff_def': `DEF +${Math.round(val*100)}%, ${chance}% chance`,
            'buff_atk': `ATK +${Math.round(val*100)}%, ${chance}% chance`,
            'lifesteal': `Steals ${Math.round(val*100)}% HP, ${chance}% chance`,
            'shield': `Blocks ${val} DMG, ${chance}% chance`,
            'aoe': `Deals ${Math.round(val*100)}% ATK to all, ${chance}% chance`,
            'true_dmg': `Deals ${val} true DMG, ${chance}% chance`,
            'crit_boost': `Crit DMG x${val}, ${chance}% chance`,
            'ignore_def': `Ignores ${Math.round(val*100)}% DEF, ${chance}% chance`,
            'debuff_spd': `Slows SPD -${Math.round(val*100)}%, ${chance}% chance`,
            'stun': `Stuns for ${val} turn, ${chance}% chance`,
            'heal': `Heals ${Math.round(val*100)}% HP, ${chance}% chance`
        };
        return typeDescriptions[skill.type] || `${skill.name} (${chance}%)`;
    },

    /**
     * Get skill type icon
     */
    _getSkillIcon(type) {
        const icons = {
            'buff_def': '🛡️', 'buff_atk': '⚔️', 'lifesteal': '🩸',
            'shield': '🔰', 'aoe': '💥', 'true_dmg': '⚡',
            'crit_boost': '🎯', 'ignore_def': '🗡️', 'debuff_spd': '❄️',
            'stun': '💫', 'heal': '💚'
        };
        return icons[type] || '✨';
    },

    /**
     * Inject CSS styles for cards — Pokemon TCG Chaos Rising style
     */
    injectStyles() {
        if (document.getElementById('cardhand-styles')) return;
        const style = document.createElement('style');
        style.id = 'cardhand-styles';
        style.textContent = `
            /* ===== CARD HAND CONTAINER ===== */
            .card-hand-container {
                display: flex;
                gap: 4px;
                justify-content: stretch;
                align-items: stretch;
                padding: 4px 6px;
                height: 100%;
                flex-wrap: nowrap;
                overflow-x: hidden;
            }

            /* ===== BASE CARD STYLES ===== */
            .battle-card {
                flex: 1 1 0;
                min-width: 0;
                height: 100%;
                background: linear-gradient(180deg, #1e1e3a 0%, #141428 100%);
                border: 2px solid #555;
                border-radius: 6px;
                padding: 0;
                cursor: pointer;
                transition: transform 0.3s ease-out, box-shadow 0.3s ease-out, filter 0.3s ease;
                position: relative;
                display: flex;
                flex-direction: column;
                font-family: 'Press Start 2P', monospace;
                user-select: none;
                overflow: hidden;
            }
            .battle-card.hero-card {
                border-width: 2px;
                box-shadow: 0 0 4px var(--el-glow, rgba(170,68,204,0.3));
            }
            .battle-card.skill-card {
                border-width: 2px;
            }
            .battle-card:hover {
                z-index: 10;
            }

            /* Card disabled — grayscale, reduced opacity */
            .battle-card.card-disabled {
                opacity: 0.5;
                cursor: not-allowed;
                filter: grayscale(0.6);
            }

            /* Card playable — pulsing border glow */
            .battle-card.card-playable {
                box-shadow: 0 0 8px var(--rarity-glow, #ffd700);
                animation: card-glow 1.5s ease-in-out infinite alternate;
            }

            /* Card selected */
            .battle-card.card-selected {
                transform: translateY(-16px) scale(1.1);
                box-shadow: 0 0 16px var(--rarity-glow, #ffd700);
            }

            /* Card playing animation */
            .battle-card.card-playing {
                animation: card-fly-up 0.3s ease-out forwards;
            }
            .battle-card.card-draw-in {
                animation: card-draw-in 0.5s ease-out;
            }

            /* ===== HERO CARD HEADER — Element-themed banner ===== */
            .tcg-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 3px 5px;
                min-height: 18px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            .tcg-el-icon {
                font-size: 10px;
                flex-shrink: 0;
                filter: drop-shadow(0 0 3px var(--el-glow, #aa44cc));
            }
            .tcg-name {
                font-size: 5px;
                color: #fff;
                font-weight: bold;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 75px;
                flex: 1;
                margin: 0 3px;
                text-align: left;
            }
            .tcg-hp {
                font-size: 5px;
                color: #ff4444;
                font-weight: bold;
                flex-shrink: 0;
            }

            /* Skill card header — blue tint */
            .skill-header {
                background: rgba(10,20,60,0.9) !important;
                border-bottom: 1px solid rgba(68,136,255,0.3);
            }

            /* ===== RARITY STARS ROW ===== */
            .tcg-stars-row {
                display: flex;
                justify-content: center;
                padding: 1px 0;
                background: rgba(0,0,0,0.3);
            }
            .tcg-stars {
                color: #ffd700;
                font-size: 6px;
                letter-spacing: 1px;
            }

            /* ===== ART WINDOW — 60% of card ===== */
            .tcg-art-window {
                width: calc(100% - 6px);
                flex: 1 1 auto;
                min-height: 60px;
                margin: 3px;
                border: 2px solid var(--el-glow, #c8a832);
                border-radius: 3px;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                position: relative;
                background: #0f3460;
            }
            .tcg-art-img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                image-rendering: pixelated;
            }
            .card-art-icon {
                font-size: 28px;
            }
            .skill-art {
                background: rgba(15,52,96,0.5) !important;
            }
            .skill-icon {
                font-size: 32px;
            }

            /* ===== ELEMENT BADGE ===== */
            .tcg-el-badge {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 2px 5px;
                font-size: 4px;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 2px;
                margin: 0 4px;
                text-shadow: 0 0 4px var(--el-glow, #aa44cc);
            }

            /* ===== SKILL BOX — TCG ability text ===== */
            .tcg-skill-box {
                margin: 2px 4px;
                padding: 2px 4px;
                background: rgba(0,0,0,0.4);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 2px;
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .tcg-skill-header {
                display: flex;
                align-items: center;
                gap: 3px;
                margin-bottom: 1px;
            }
            .tcg-skill-icon {
                font-size: 6px;
                flex-shrink: 0;
            }
            .tcg-skill-name {
                font-size: 5px;
                color: #ffd700;
                font-weight: bold;
                text-shadow: 0 0 4px rgba(255,215,0,0.5);
            }
            .tcg-skill-desc {
                font-size: 4px;
                color: #bbb;
                line-height: 1.3;
                font-style: italic;
                text-shadow: 0 0 2px rgba(255,255,255,0.1);
            }

            /* ===== DIVIDER ===== */
            .tcg-divider {
                height: 1px;
                background: rgba(255,255,255,0.1);
                margin: 2px 5px;
            }

            /* ===== EFFECT TEXT ===== */
            .tcg-effect-text {
                font-size: 4px;
                color: #aaa;
                text-align: center;
                line-height: 1.4;
                padding: 2px 5px;
                flex: 1;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
            }

            /* ===== COOL-DOWN INDICATOR ===== */
            .tcg-cooldown {
                font-size: 5px;
                color: #4488ff;
                text-align: center;
                padding: 2px;
                background: rgba(68,136,255,0.1);
                border-top: 1px solid rgba(68,136,255,0.2);
                font-weight: bold;
            }

            /* ===== STATS BOX — Bottom of card ===== */
            .tcg-stats-box {
                padding: 3px 5px;
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 3px;
            }
            .tcg-hp-bar {
                width: 100%;
                height: 5px;
                background: #222;
                border-radius: 2px;
                overflow: hidden;
            }
            .tcg-hp-fill {
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, #00ff88, #00cc66);
                border-radius: 2px;
            }
            .tcg-stat-row {
                display: flex;
                justify-content: space-between;
                padding: 0 2px;
                font-size: 6px;
            }

            /* ===== STAT COLORS ===== */
            .card-atk {
                color: #e94560;
                font-weight: bold;
            }
            .card-def {
                color: #4488ff;
                font-weight: bold;
            }

            /* ===== EMPTY HAND ===== */
            .hand-empty {
                color: #666;
                font-family: 'Press Start 2P', monospace;
                font-size: 8px;
                text-align: center;
                padding: 20px;
            }

            /* ===== RARITY BORDER COLORS ===== */
            .battle-card.rarity-common    { border-color: #aaaaaa; --rarity-glow: #aaaaaa; }
            .battle-card.rarity-rare      { border-color: #4488ff; --rarity-glow: #4488ff; }
            .battle-card.rarity-epic      { border-color: #9b59b6; --rarity-glow: #9b59b6; }
            .battle-card.rarity-legendary { border-color: #ff6b35; --rarity-glow: #ff6b35; }
            .battle-card.rarity-mythic    { border-color: #e94560; --rarity-glow: #e94560; }

            /* ===== KEYFRAMES ===== */
            @keyframes card-glow {
                from { box-shadow: 0 0 6px var(--rarity-glow, #ffd700); }
                to   { box-shadow: 0 0 14px var(--rarity-glow, #ffd700), 0 0 20px var(--rarity-glow, #ffd700); }
            }
            @keyframes card-fly-up {
                0%   { transform: translateY(0) scale(1); opacity: 1; }
                30%  { transform: translateY(-10px) scale(1.1); opacity: 1; }
                100% { transform: translateY(-80px) scale(0.3); opacity: 0; }
            }
            @keyframes card-draw-in {
                0%   { transform: translateX(60px) scale(0.3); opacity: 0; }
                100% { transform: translateX(0) scale(1); opacity: 1; }
            }

            /* ===== MOBILE RESPONSIVE ===== */
            @media (max-width: 480px) {
                .battle-card {
                    flex: 1 1 0;
                }
                .tcg-art-window { height: 55px; }
                .card-art-icon { font-size: 22px; }
                .tcg-name { font-size: 4px; max-width: 60px; }
                .tcg-stat-row { font-size: 5px; }
            }
            @media (max-width: 380px) {
                .battle-card {
                    flex: 1 1 0;
                }
                .tcg-art-window { height: 45px; }
                .tcg-name { font-size: 3.5px; max-width: 50px; }
            }
        `;
        document.head.appendChild(style);
    },
};
