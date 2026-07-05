/* ========================================
 * PIXEL RAID — UI Screens & Interactions
 * ======================================== */

const UI = {
    currentScreen: 'battle',
    selectedCard: null,
    marketListings: [],
    _arrangeDragState: null,

    init() {
        this.bindNav();
        this.bindBattleControls();
        this.bindShopTabs();
        this.bindInventoryTabs();
        this.updateHeader();
        this.showScreen('battle');
    },

    bindNav() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (typeof Sound !== 'undefined') Sound.click();
                this.showScreen(btn.dataset.screen);
            });
        });
    },

    showScreen(name) {
        this.currentScreen = name;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        
        const screen = document.getElementById(`screen-${name}`);
        const btn = document.querySelector(`[data-screen="${name}"]`);
        if (screen) screen.classList.add('active');
        if (btn) btn.classList.add('active');

        // Render screen content
        switch (name) {
            case 'battle': this.renderBattleScreen(); break;
            case 'heroes': this.renderHeroesScreen(); break;
            case 'formation': this.renderStrategyScreen(); break;
            case 'inventory': this.renderInventoryScreen(); break;
            case 'shop': this.renderShopScreen(); break;
            case 'market': break; // Market screen uses static HTML, no dynamic render needed
        }
    },

    updateHeader() {
        document.getElementById('player-name').textContent = GameState.player.name;
        document.getElementById('gold-display').textContent = GameState.player.gold;
        document.getElementById('gem-display').textContent = GameState.player.gems;
    },

    // ===== BATTLE SCREEN =====
    renderBattleScreen() {
        // Update start button state (disabled if no deck)
        this._updateStartButton();

        // Show deck preview when battle is not active
        this.renderBattleDeckPreview();

        // Update header stats
        const stageEl = document.getElementById('stage-number');
        if (stageEl) stageEl.textContent = GameState.player.stage;
        const waveEl = document.getElementById('wave-number');
        if (waveEl) waveEl.textContent = GameState.player.wave;
        const progressEl = document.getElementById('progress-fill');
        if (progressEl) {
            const progress = ((GameState.player.wave - 1) / GameState.player.maxWave) * 100;
            progressEl.style.width = progress + '%';
        }

        // Hide canvas when battle is not active
        const canvasContainer = document.getElementById('battle-canvas-container');
        if (canvasContainer) {
            if (typeof BattleEngine !== 'undefined' && BattleEngine.isRunning) {
                canvasContainer.style.display = '';
            } else {
                canvasContainer.style.display = 'none';
            }
        }

        // Hide card hand area when battle is not active
        const cardHandArea = document.getElementById('card-hand-area');
        if (cardHandArea) {
            if (typeof BattleEngine !== 'undefined' && BattleEngine.isRunning) {
                cardHandArea.style.display = '';
            } else {
                cardHandArea.style.display = 'none';
            }
        }

        // Hide canvas wrap and hero power when battle is not active
        const canvasWrap = document.querySelector('#screen-battle .battle-canvas-wrap');
        if (canvasWrap) canvasWrap.style.display = 'none';
        const heroPower = document.getElementById('hero-power-area');
        if (heroPower) heroPower.style.display = 'none';

        // Before battle: make screen fill viewport, deck preview scrollable, controls fixed at bottom
        if (typeof BattleEngine === 'undefined' || !BattleEngine.isRunning) {
            const battleScreen = document.getElementById('screen-battle');
            if (battleScreen) {
                battleScreen.style.cssText = 'display:flex !important;flex-direction:column;position:fixed !important;top:0;left:0;right:0;bottom:0;max-width:none !important;overflow:hidden;z-index:99;background:#0a0a1e;';
            }
            const preview = document.getElementById('battle-deck-preview');
            if (preview) {
                preview.style.cssText = 'flex:1;overflow-y:auto;min-height:0;padding:16px;';
            }
            const controls = document.querySelector('.battle-controls');
            if (controls) {
                controls.style.cssText = 'flex-shrink:0;padding:12px 16px;background:rgba(10,10,30,0.95);border-top:2px solid rgba(0,229,255,0.3);justify-content:center;z-index:10;';
            }
            // Hide nav bar inside battle screen
            const nav = battleScreen ? battleScreen.querySelector('.game-nav') : null;
            if (nav) nav.style.display = 'none';
        }

        // NOTE: renderArenaPreview() removed — renderBattleDeckPreview() handles pre-battle display
    },

    renderArenaPreview() {
        const preview = document.getElementById('battle-deck-preview');
        if (!preview) return;

        // Only show arena when battle is NOT running
        if (typeof BattleEngine !== 'undefined' && BattleEngine.isRunning) {
            preview.style.display = 'none';
            return;
        }

        preview.style.display = '';
        const deck = GameState.deck || [];
        const stage = GameState.player.stage || 1;

        // Generate enemy preview based on stage
        const enemyTypes = [
            { name: 'Goblin', icon: '👹', class: 'warrior' },
            { name: 'Skeleton', icon: '💀', class: 'warrior' },
            { name: 'Dark Mage', icon: '🧙', class: 'mage' },
            { name: 'Wolf', icon: '🐺', class: 'assassin' },
            { name: 'Bandit', icon: '🥷', class: 'assassin' },
        ];
        const enemyCount = Math.min(3, 1 + Math.floor(stage / 3));
        const enemies = [];
        for (let i = 0; i < enemyCount; i++) {
            const base = enemyTypes[(stage + i) % enemyTypes.length];
            enemies.push({
                ...base,
                hp: 50 + stage * 10,
                atk: 5 + stage * 2,
            });
        }

        preview.innerHTML = `
            <div class="arena-container">
                <div class="arena-bg">
                    <div class="arena-grid"></div>
                </div>
                
                <!-- Player Side (Left) -->
                <div class="arena-side arena-player">
                    <div class="arena-hp-bar">
                        <div class="arena-hp-label">YOUR HP</div>
                        <div class="arena-hp-track">
                            <div class="arena-hp-fill" style="width:100%"></div>
                        </div>
                        <div class="arena-hp-text">20/20</div>
                    </div>
                    <div class="arena-cards">
                        ${deck.slice(0, 3).map((card, i) => {
                            const elInfo = (typeof getCardElement === 'function') ? getCardElement(card) : null;
                            const elIcon = elInfo ? elInfo.icon : '⚔️';
                            const elColor = elInfo ? elInfo.color : '#888';
                            return `<div class="hero-card arena-card" style="animation-delay:${i * 0.15}s;border-color:${elColor}">
                                <span class="hero-card-icon">${elIcon}</span>
                                <span class="hero-card-name">${card.name || 'Hero'}</span>
                                <span class="hero-card-stats">⚔️${card.stats?.atk || 10} 🛡${card.stats?.def || 5}</span>
                            </div>`;
                        }).join('')}
                        ${deck.length === 0 ? `
                            <div class="hero-card arena-card empty">
                                <span class="hero-card-icon">❓</span>
                                <span class="hero-card-name">No Cards</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- VS Badge -->
                <div class="arena-vs">⚔️</div>

                <!-- Enemy Side (Right) -->
                <div class="arena-side arena-enemy">
                    <div class="arena-hp-bar">
                        <div class="arena-hp-label">ENEMY HP</div>
                        <div class="arena-hp-track">
                            <div class="arena-hp-fill enemy" style="width:100%"></div>
                        </div>
                        <div class="arena-hp-text">${enemies.reduce((s,e) => s + e.hp, 0)}/${enemies.reduce((s,e) => s + e.hp, 0)}</div>
                    </div>
                    <div class="arena-cards">
                        ${enemies.map((enemy, i) => `
                            <div class="hero-card arena-card enemy" style="animation-delay:${i * 0.15}s">
                                <span class="hero-card-icon">${enemy.icon}</span>
                                <span class="hero-card-name">${enemy.name}</span>
                                <span class="hero-card-stats">⚔️${enemy.atk}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="arena-stage-info">
                Stage ${stage} — Wave ${GameState.player.wave || 1}
            </div>
        `;
    },

    _getHeroIcon(cls) {
        const icons = { warrior: '⚔️', mage: '🔮', archer: '🏹', healer: '💚', assassin: '🗡️' };
        return icons[cls] || '⚔️';
    },

    renderBattleDeckPreview() {
        const preview = document.getElementById('battle-deck-preview');
        if (!preview) return;

        if (typeof BattleEngine !== 'undefined' && BattleEngine.isRunning) {
            preview.style.display = 'none';
            return;
        }
        preview.style.display = '';

        const deckCards = GameState.getDeckCards();
        const skillCards = GameState.skillDeck.length > 0
            ? GameState.getSkillDeckCards()
            : SKILL_CARD_TEMPLATES.slice(0, 4).map(t => ({ ...t }));

        if (deckCards.length === 0) {
            preview.innerHTML = `
                <div style="text-align:center;padding:24px 12px;">
                    <div style="font-size:28px;margin-bottom:8px;">🃏</div>
                    <div style="font-family:'Press Start 2P';font-size:9px;color:var(--gold);margin-bottom:8px;">No Hero Selected</div>
                    <div style="font-size:8px;color:var(--text-dim);">Go to <strong>Strategy</strong> to build your deck!</div>
                </div>
            `;
            return;
        }

        const hero = deckCards[0];
        const template = getTemplateByName(hero.templateId || hero.name);
        const cls = CLASSES[hero.class] || {};
        const rarity = RARITIES[hero.rarity] || {};
        const typeIcons = { attack: '⚔️', defense: '🛡️', buff: '✨', debuff: '💀', special: '⚡' };

        // Generate enemy preview based on stage
        const enemyTypes = [
            { name: 'Goblin', icon: '👹', class: 'warrior' },
            { name: 'Skeleton', icon: '💀', class: 'warrior' },
            { name: 'Dark Mage', icon: '🧙', class: 'mage' },
            { name: 'Wolf', icon: '🐺', class: 'assassin' },
            { name: 'Bandit', icon: '🥷', class: 'assassin' },
        ];
        const stage = GameState.player.stage || 1;
        const enemyCount = Math.min(3, 1 + Math.floor(stage / 3));
        const enemies = [];
        for (let i = 0; i < enemyCount; i++) {
            const base = enemyTypes[(stage + i) % enemyTypes.length];
            enemies.push({ ...base, hp: 50 + stage * 10, atk: 5 + stage * 2 });
        }
        const totalEnemyHP = enemies.reduce((s, e) => s + e.hp, 0);

        let heroHTML = `
            <div class="battle-preview-hero">
                <div class="battle-preview-hero-sprite" id="battle-preview-sprite"></div>
                <div class="battle-preview-hero-info">
                    <div class="battle-preview-hero-name" style="color:${rarity.color || '#fff'}">${hero.name}${hero.level > 1 ? ' Lv.' + hero.level : ''}</div>
                    <div class="battle-preview-hero-class" style="color:${cls.color || '#888'}">${cls.emoji || ''} ${cls.name || hero.class}</div>
                    <div class="battle-preview-hero-stats">
                        <span style="color:#44cc44">HP:${hero.stats.hp}</span>
                        <span style="color:#ff6644">ATK:${hero.stats.atk}</span>
                        <span style="color:#4488ff">DEF:${hero.stats.def}</span>
                        <span style="color:#ffaa00">SPD:${hero.stats.spd}</span>
                    </div>
                </div>
            </div>
        `;

        // Enemy preview HTML
        let enemyHTML = `
            <div class="battle-preview-enemy">
                <div class="battle-preview-enemy-title" style="color:#ff6644">⚔ Enemies (${enemyCount})</div>
                <div class="battle-preview-enemy-list">
                    ${enemies.map(e => `
                        <div class="battle-preview-enemy-item">
                            <span>${e.icon}</span>
                            <span>${e.name}</span>
                            <span style="color:#ff6644">ATK:${e.atk}</span>
                            <span style="color:#44cc44">HP:${e.hp}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        let skillsHTML = '<div class="battle-preview-skills">';
        skillCards.forEach(card => {
            const typeIcon = typeIcons[card.type] || '🃏';
            const cardType = CARD_TYPES[card.type] || {};
            skillsHTML += `
                <div class="battle-preview-skill-card">
                    <div class="battle-preview-skill-icon">${typeIcon}</div>
                    <div class="battle-preview-skill-name">${card.name}</div>
                    <div class="battle-preview-skill-mana" style="color:${cardType.color || '#aaa'}">💎 ${card.manaCost}</div>
                </div>
            `;
        });
        skillsHTML += '</div>';

        // Stage info
        const stageHTML = `
            <div class="arena-stage-info">
                Stage ${stage} — Wave ${GameState.player.wave || 1}
            </div>
        `;

        preview.innerHTML = heroHTML + enemyHTML + skillsHTML + stageHTML;

        // Draw hero sprite
        const spriteContainer = document.getElementById('battle-preview-sprite');
        if (spriteContainer) {
            if (template && template.image) {
                const img = document.createElement('img');
                img.width = 80; img.height = 80;
                img.style.imageRendering = 'pixelated';
                img.src = template.image;
                img.onerror = () => {
                    const cvs = document.createElement('canvas');
                    cvs.width = 80; cvs.height = 80;
                    if (typeof CardRenderer !== 'undefined') CardRenderer.drawCardSprite(cvs, hero, 80);
                    spriteContainer.innerHTML = '';
                    spriteContainer.appendChild(cvs);
                };
                spriteContainer.innerHTML = '';
                spriteContainer.appendChild(img);
            } else if (typeof CardRenderer !== 'undefined') {
                const cvs = document.createElement('canvas');
                cvs.width = 80; cvs.height = 80;
                CardRenderer.drawCardSprite(cvs, hero, 80);
                spriteContainer.innerHTML = '';
                spriteContainer.appendChild(cvs);
            }
        }
    },

    bindBattleControls() {
        document.getElementById('btn-start-battle').addEventListener('click', () => {
            if (typeof Sound !== 'undefined') Sound.click();
            this.startBattleWithCountdown();
        });

        // Default battle speed = 2x (fast)
        GameState.battleSpeed = 2;

        // Check deck state and enable/disable start button
        this._updateStartButton();

        // Hero power click handler
        document.getElementById('hero-power-area').addEventListener('click', (e) => {
            const btn = e.target.closest('#hero-power-use');
            if (!btn || btn.disabled) return;
            if (typeof Sound !== 'undefined') Sound.click();
            this._useHeroPower();
        });
    },

    _updateStartButton() {
        const btn = document.getElementById('btn-start-battle');
        if (!btn) return;
        const deckCards = GameState.getDeckCards();
        const hasHero = deckCards.length > 0;
        btn.disabled = !hasHero;
        if (hasHero) {
            btn.classList.add('ready');
            btn.innerHTML = '⚔️ START BATTLE';
        } else {
            btn.classList.remove('ready');
            btn.innerHTML = '⚔️ Build Deck First';
        }
    },

    // ===== COUNTDOWN SYSTEM =====
    startBattleWithCountdown() {
        const deckCards = GameState.getDeckCards();
        if (deckCards.length === 0) {
            this.toast('No cards in deck! Go to Strategy.', 'error');
            return;
        }

        const countdownEl = document.getElementById('battle-countdown');
        if (!countdownEl) return this.startBattle();

        // Hide battle controls during countdown
        const controls = document.querySelector('.battle-controls');
        if (controls) controls.style.display = 'none';

        countdownEl.classList.add('active');
        const steps = ['3', '2', '1', '⚔️ FIGHT!'];
        let i = 0;

        const showNext = () => {
            if (i >= steps.length) {
                countdownEl.classList.remove('active');
                countdownEl.innerHTML = '';
                this.startBattle();
                return;
            }
            const isFight = i === steps.length - 1;
            countdownEl.innerHTML = `<div class="${isFight ? 'countdown-fight' : 'countdown-number'}">${steps[i]}</div>`;
            i++;
            setTimeout(showNext, isFight ? 600 : 800);
        };
        showNext();
    },

    startBattle() {
        const stage = GameState.player.stage;

        // Bug #1: Hero is separate from card deck — get hero from GameState
        const deckCards = GameState.getDeckCards();
        const playerHero = deckCards.length > 0 ? deckCards[0] : null;

        // Bug #7: Deck max 4 cards — use skill cards from GameState.skillDeck
        const playerDeck = typeof getPlayerBattleDeck === 'function' ? getPlayerBattleDeck() : [];

        // Bug #4: Generate enemy hero with stats scaling by stage
        const enemyHero = typeof generateEnemyHero === 'function' ? generateEnemyHero(stage) : null;

        // Bug #7: Enemy also gets 4 cards max
        const enemyDeck = typeof generateEnemyUnitDeck === 'function' ? generateEnemyUnitDeck(stage) : [];

        if (playerDeck.length === 0) {
            this.toast('Error: No cards in deck! Go to Strategy to build your deck.', 'error');
            return;
        }

        // Stop any previous battle
        BattleEngine.stop();

        // Clear any leftover inline display styles from previous battle cleanup
        // (inline styles override CSS, so battle-active rules wouldn't take effect)
        var resetEls = ['#card-hand-area', '#battle-canvas-container', '.battle-action-row', '.battle-info-strip'];
        for (var i = 0; i < resetEls.length; i++) {
            var el = document.querySelector(resetEls[i]);
            if (el) { el.style.cssText = ''; el.removeAttribute('style'); }
        }

        // Show battle canvas container
        const battleContainer = document.getElementById('battle-canvas-container');
        if (battleContainer) battleContainer.style.display = 'block';

        // Go fullscreen for battle
        document.getElementById('screen-battle').classList.add('battle-active');

        // Init Phaser renderer and activate bridge
        BattlePhaser.init('battle-canvas-container');

        // Init card hand renderer
        if (typeof CardHand !== 'undefined') {
            CardHand.init('card-hand-area');
            // Wire up card click → play card to first empty board slot
            CardHand.onCardPlay = (handIndex, card) => {
                if (BattleEngine.currentPhase !== 'play') return;
                // Bug #2: Only 1 card per round
                if (BattleEngine.cardsPlayedThisTurn >= 1) {
                    this.toast('Can only play 1 card per round!', 'warning');
                    return;
                }
                // Find first empty slot
                const board = BattleEngine.player.board;
                let emptySlot = -1;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === null) { emptySlot = i; break; }
                }
                if (emptySlot < 0) return; // board full
                const success = BattleEngine.playCard(handIndex, emptySlot);
                if (success) {
                    // Animate card out, then re-render
                    CardHand.animateCardPlay(handIndex, () => {
                        CardHand.renderHand(BattleEngine.player.hand, BattleEngine.player.energy);
                    });
                } else {
                    CardHand.shakeCard(handIndex);
                }
            };
        }

        // Create or update the action row for phase buttons
        this._ensureActionRow();

        // Create or update the phase bar
        this._ensurePhaseBar();

        // Wire up BattleEngine event handlers
        BattleEngine.onPhaseChange = (phase) => {
            try { this._updatePhaseBar(phase); } catch (e) {}
            try { this._updateActionButtons(phase); } catch (e) {}

            // Tick hero power cooldowns at start of each turn (draw phase)
            if (phase === 'draw' && typeof HeroPowers !== 'undefined') {
                try { HeroPowers.tickCooldowns(); } catch (e) {}
            }

            // Show phase banner in Phaser
            const phaseNames = {
                draw: 'DRAW', energy: 'ENERGY', play: 'PLAY',
                arrange: 'ARRANGE', battle: 'BATTLE', result: 'RESULT'
            };
            if (['play', 'arrange', 'battle', 'result'].includes(phase)) {
                try {
                    BattlePhaser.showPhaseBanner(phaseNames[phase] || phase.toUpperCase(), true);
                } catch (e) { console.warn('showPhaseBanner error:', e); }
            }

            // Update Phaser hero panels
            if (BattleEngine.player && BattleEngine.enemy) {
                try {
                    BattlePhaser.renderField(BattleEngine.player, BattleEngine.enemy);
                } catch (e) { console.warn('renderField error:', e); }
            }
        };

        // Track previous board state for death detection
        this._prevFieldState = { player: [], enemy: [] };

        BattleEngine.onFieldUpdate = () => {
            // Detect deaths BEFORE re-rendering (compare prev vs current)
            if (this._prevFieldState && this._prevFieldState.player.length) {
                try { this._detectAndAnimateDeaths(); } catch (e) { console.warn('Death anim error:', e); }
            }

            // Phaser render — wrapped in try-catch so cards always render even if Phaser fails
            try {
                BattlePhaser.renderField(BattleEngine.player, BattleEngine.enemy);
            } catch (e) {
                console.warn('BattlePhaser.renderField error:', e);
            }

            // Always re-render card hand during active battle phases
            if (typeof CardHand !== 'undefined' && BattleEngine.player) {
                const activePhases = ['draw', 'energy', 'play', 'arrange'];
                if (activePhases.includes(BattleEngine.currentPhase)) {
                    try {
                        CardHand.renderHand(BattleEngine.player.hand, BattleEngine.player.energy);
                    } catch (e) {
                        console.warn('CardHand.renderHand error:', e);
                    }
                }
            }

            // Render hero power button
            if (BattleEngine.player && BattleEngine.player.heroCard && BattleEngine.currentPhase === 'play') {
                const heroClass = BattleEngine.player.heroCard.class || 'warrior';
                if (typeof HeroPowers !== 'undefined') {
                    HeroPowers.renderButton(heroClass, BattleEngine.player.energy, 'hero-power-area');
                }
            } else {
                const pa = document.getElementById('hero-power-area');
                if (pa) pa.innerHTML = '';
            }

            // Update arrange UI if in arrange phase
            if (BattleEngine.currentPhase === 'arrange') {
                this._renderArrangeOverlay();
            }

            // Save current board state for next comparison
            this._prevFieldState = {
                player: BattleEngine.player.board.map(u => u ? { emoji: u.emoji, name: u.name } : null),
                enemy: BattleEngine.enemy.board.map(u => u ? { emoji: u.emoji, name: u.name } : null)
            };
        };

        BattleEngine.onAttack = (data) => {
            const attacker = data.attacker;
            const isPlayer = attacker.side === 'player';

            BattlePhaser.playAttack(data.attacker.slot, data.targetSlot || 0, isPlayer, data.damage, false);

            // Update hero HP display
            if (data.targetIsHero) {
                const targetSide = data.targetSide;
                const combatant = targetSide === 'player' ? BattleEngine.player : BattleEngine.enemy;
                BattlePhaser.updateHeroHP(targetSide === 'player', combatant.heroHp, combatant.heroMaxHp);
            }
        };

        BattleEngine.onDraw = (card) => {
            if (typeof CardHand !== 'undefined') {
                CardHand.renderHand(BattleEngine.player.hand, BattleEngine.player.energy);
            }
        };

        // Reset hero power cooldowns
        if (typeof HeroPowers !== 'undefined') HeroPowers.resetCooldowns();

        // Start the battle engine with hero data
        BattleEngine.startBattle(playerDeck, enemyDeck, {
            playerName: playerHero ? playerHero.name : 'You',
            playerHero: playerHero,   // Bug #1: pass hero card for HP/stats
            enemyName: enemyHero ? enemyHero.name : `Stage ${stage} Enemy`,
            enemyHero: enemyHero,     // Bug #4: pass enemy hero card
        });

        // NOW activate Phaser bridge with player/enemy data
        BattlePhaser.enter(BattleEngine.player, BattleEngine.enemy, null);

        // Handle battle completion (from result phase)
        BattleEngine.onComplete = (result) => {
            // Don't immediately exit — the result phase handles display
            // onComplete is called when user clicks "Continue"
        };
    },

    // ===== PHASE BAR =====
    _ensurePhaseBar() {
        let bar = document.getElementById('battle-phase-bar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'battle-phase-bar';
            bar.style.cssText = 'position:absolute;top:0;left:0;right:0;z-index:50;display:flex;justify-content:center;gap:4px;padding:6px 8px;background:rgba(10,10,26,0.95);border-bottom:1px solid rgba(255,215,0,0.2);';
            const container = document.getElementById('battle-canvas-container');
            if (container && container.parentElement) {
                container.parentElement.insertBefore(bar, container);
            }
        }

        const phases = [
            { key: 'draw', label: 'DRAW', icon: '🂠' },
            { key: 'energy', label: 'ENERGY', icon: '⚡' },
            { key: 'play', label: 'PLAY', icon: '🃏' },
            { key: 'arrange', label: 'ARRANGE', icon: '📐' },
            { key: 'battle', label: 'BATTLE', icon: '⚔️' },
            { key: 'result', label: 'RESULT', icon: '🏆' },
        ];

        bar.innerHTML = phases.map((p, i) => `
            <div class="phase-gem" data-phase="${p.key}" style="
                display:flex;flex-direction:column;align-items:center;gap:2px;
                padding:3px 6px;border-radius:4px;
                font-family:'Press Start 2P',monospace;font-size:6px;
                color:rgba(255,255,255,0.3);transition:all 0.3s;
                border:1px solid transparent;
            ">
                <span style="font-size:12px;">${p.icon}</span>
                <span>${p.label}</span>
            </div>
            ${i < phases.length - 1 ? '<div style="color:rgba(255,255,255,0.15);align-self:center;font-size:10px;">›</div>' : ''}
        `).join('');

        // Mark initial phase
        this._updatePhaseBar(BattleEngine.currentPhase);
    },

    _updatePhaseBar(phase) {
        const gems = document.querySelectorAll('#battle-phase-bar .phase-gem');
        const phaseOrder = ['draw', 'energy', 'play', 'arrange', 'battle', 'result'];
        const currentIdx = phaseOrder.indexOf(phase);

        gems.forEach(gem => {
            const gemPhase = gem.dataset.phase;
            const gemIdx = phaseOrder.indexOf(gemPhase);

            if (gemIdx < currentIdx) {
                // Completed
                gem.style.color = 'rgba(255,215,0,0.3)';
                gem.style.borderColor = 'rgba(255,215,0,0.15)';
                gem.style.background = 'transparent';
            } else if (gemIdx === currentIdx) {
                // Active — gold glow
                gem.style.color = '#ffd700';
                gem.style.borderColor = '#ffd700';
                gem.style.background = 'rgba(255,215,0,0.12)';
                gem.style.boxShadow = '0 0 8px rgba(255,215,0,0.4)';
            } else {
                // Upcoming
                gem.style.color = 'rgba(255,255,255,0.3)';
                gem.style.borderColor = 'transparent';
                gem.style.background = 'transparent';
                gem.style.boxShadow = 'none';
            }
        });
    },

    // ===== ACTION BUTTONS =====
    _ensureActionRow() {
        let row = document.querySelector('.battle-action-row');
        if (!row) {
            row = document.createElement('div');
            row.className = 'battle-action-row';
            row.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:8px;padding:6px 0;background:rgba(10,10,26,0.95);border-top:1px solid rgba(255,215,0,0.15);flex-shrink:0;';
            // Insert into #screen-battle (NOT inside battle-canvas-wrap which has overflow:hidden)
            const screenBattle = document.getElementById('screen-battle');
            if (screenBattle) {
                // Insert after battle-canvas-wrap, before card-hand-area
                const cardHand = document.getElementById('card-hand-area');
                if (cardHand) {
                    screenBattle.insertBefore(row, cardHand);
                } else {
                    screenBattle.appendChild(row);
                }
            }
        }
        this._updateActionButtons('draw');
    },

    _updateActionButtons(phase) {
        const row = document.querySelector('.battle-action-row');
        if (!row) return;

        if (phase === 'play') {
            row.innerHTML = `
                <button class="btn btn-gold" id="btn-done-playing" onclick="BattleEngine.advancePhase(); UI._updateActionButtons(BattleEngine.currentPhase);">
                    ✅ Done Playing
                </button>
            `;
            row.style.display = 'flex';
        } else if (phase === 'arrange') {
            row.innerHTML = `
                <button class="btn btn-gold" id="btn-end-turn" onclick="BattleEngine.advancePhase(); UI._updateActionButtons(BattleEngine.currentPhase);">
                    ⚔️ End Turn
                </button>
            `;
            row.style.display = 'flex';
        } else if (phase === 'result') {
            // Generate rewards ONCE so display matches what's actually applied
            const stage = GameState.player.stage || 1;
            const isWin = BattleEngine._checkWinLose() === 'player';
            this._lastBattleIsWin = isWin;
            this._lastBattleRewards = isWin
                ? Rewards.generateWinRewards(stage)
                : Rewards.generateLossRewards(stage);
            this._lastBattleStage = stage;
            this._renderResultScreen();
            row.style.display = 'none';
        } else {
            row.innerHTML = '';
            row.style.display = 'none';
        }
    },

    // ===== ARRANGE PHASE OVERLAY =====
    _renderArrangeOverlay() {
        // Show/hide the arrange instruction overlay on Phaser canvas area
        let overlay = document.getElementById('arrange-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'arrange-overlay';
            overlay.style.cssText = `
                position:absolute;top:0;left:0;right:0;bottom:0;
                pointer-events:none;z-index:10001;
                display:flex;flex-direction:column;align-items:center;justify-content:flex-start;
                padding-top:8px;
            `;
            const canvasContainer = document.getElementById('battle-canvas-container');
            if (canvasContainer) {
                canvasContainer.style.position = 'relative';
                canvasContainer.appendChild(overlay);
            }
        }

        if (BattleEngine.currentPhase !== 'arrange') {
            overlay.style.display = 'none';
            return;
        }

        overlay.style.display = 'flex';
        overlay.innerHTML = `
            <div style="
                background:rgba(10,10,30,0.85);border:1px solid rgba(255,215,0,0.3);
                padding:6px 16px;border-radius:6px;font-family:'Press Start 2P',monospace;
                font-size:8px;color:#ffd700;text-align:center;
                pointer-events:auto;
            ">
                📐 Drag units to rearrange positions
            </div>
        `;
    },

    // ===== RESULT SCREEN =====
    _renderResultScreen() {
        const result = BattleEngine._checkWinLose();
        const isWin = result === 'player';

        // Trigger Phaser victory/defeat animation
        if (isWin) {
            BattlePhaser.playVictory();
        } else {
            BattlePhaser.playDefeat();
        }

        // Create result overlay using CSS classes
        let overlay = document.getElementById('battle-result-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'battle-result-overlay';
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
        overlay.style.background = isWin ? 'rgba(0,0,0,0.7)' : 'rgba(40,0,0,0.75)';

        const stage = this._lastBattleStage || GameState.player.stage || 1;
        const rewards = this._lastBattleRewards || { gold: 0, cards: [], heroExp: 0 };
        const goldReward = rewards.gold;
        const xpReward = rewards.heroExp || 0;

        // Card reward display from actual generated cards
        let cardReward = '';
        if (rewards.cards && rewards.cards.length > 0) {
            const card = rewards.cards[0];
            cardReward = `
                <div class="result-reward-item">
                    <span class="result-reward-icon">🃏</span>
                    <span>New Card</span>
                    <span class="result-reward-value">${card.name} <span style="color:${card.rarity === 'rare' ? '#4488ff' : card.rarity === 'epic' ? '#bb44ff' : '#aaa'}">(${card.rarity})</span></span>
                </div>`;
        }

        // Mission progress
        const missionsDone = GameState.player.missionsCompleted || 0;
        const nextMission = GameState.player.nextMission || 'Win 5 battles';

        const borderColor = isWin ? '#ffd700' : '#ff4444';
        const titleColor = isWin ? '#ffd700' : '#ff4444';
        const titleText = isWin ? '🏆 VICTORY!' : '💀 DEFEAT';
        const titleIcon = isWin ? '' : '';

        overlay.innerHTML = `
            <div class="result-panel" style="border-color:${borderColor};box-shadow:0 0 30px ${isWin ? 'rgba(255,215,0,0.3)' : 'rgba(255,68,68,0.3)'};">
                <div class="result-title" style="color:${titleColor}">${titleText}</div>
                <div style="font-size:8px;color:rgba(255,255,255,0.4);margin-bottom:8px;">Stage ${stage} · Turn ${BattleEngine.turnNumber}</div>

                <div class="result-rewards">
                    <div class="result-reward-item">
                        <span class="result-reward-icon">💰</span>
                        <span>Gold Earned</span>
                        <span class="result-reward-value">+${goldReward}</span>
                    </div>
                    <div class="result-reward-item">
                        <span class="result-reward-icon">⚡</span>
                        <span>Experience</span>
                        <span class="result-reward-value">+${xpReward} XP</span>
                    </div>
                    ${cardReward}
                    <div class="result-reward-item">
                        <span class="result-reward-icon">📋</span>
                        <span>Mission: ${nextMission}</span>
                        <span class="result-reward-value">${missionsDone}/${isWin ? missionsDone + 1 : missionsDone}</span>
                    </div>
                </div>

                <div class="result-buttons">
                    <button class="btn btn-gold" onclick="UI._handleBattleResult('${isWin ? 'win' : 'lose'}')">
                        ${isWin ? '▶ Continue' : '🔄 Retry'}
                    </button>
                    <button class="btn btn-secondary" onclick="UI._handleBattleResult('back')">
                        ← Back
                    </button>
                </div>
                <div style="text-align:center;margin-top:8px;">
                    <button onclick="UI.openBattleCoach({isWin:${isWin},turnNumber:BattleEngine.turnNumber,player:{heroHp:BattleEngine.player.heroHp,heroMaxHp:BattleEngine.player.heroMaxHp},enemy:{heroHp:BattleEngine.enemy.heroHp,heroMaxHp:BattleEngine.enemy.heroMaxHp}})" style="
                        font-family:'Press Start 2P',monospace;font-size:7px;
                        padding:8px 14px;background:rgba(255,215,0,0.08);color:var(--gold);
                        border:1px solid rgba(255,215,0,0.25);border-radius:4px;
                        cursor:pointer;transition:all 0.2s ease;
                    " onmouseover="this.style.background='rgba(255,215,0,0.15)'" onmouseout="this.style.background='rgba(255,215,0,0.08)'">
                        🤖 AI Coach
                    </button>
                </div>
            </div>
        `;
    },

    // ===== HERO POWER =====
    _useHeroPower() {
        if (!BattleEngine.player || !BattleEngine.player.heroCard) return;
        if (BattleEngine.currentPhase !== 'play') return;
        const heroClass = BattleEngine.player.heroCard.class || 'warrior';
        if (typeof HeroPowers === 'undefined') return;

        // Pass a proper hero object with hp/maxHp for heal effects
        const heroObj = Object.assign({}, BattleEngine.player.heroCard, {
            hp: BattleEngine.player.heroHp,
            maxHp: BattleEngine.player.heroMaxHp,
        });

        const result = HeroPowers.usePower(
            heroClass,
            heroObj,
            BattleEngine.enemy.board,
            BattleEngine.player
        );
        if (!result) return;

        // Sync hp back to BattleEngine
        if (heroObj.hp !== BattleEngine.player.heroHp) {
            BattleEngine.player.heroHp = heroObj.hp;
        }

        // Log the power usage
        BattleEngine._log(`${result.powerIcon} ${result.powerName}: ${result.text}`);

        // Update field
        BattleEngine._notifyFieldUpdate();
    },

    // ===== DEATH ANIMATION DETECTION =====
    _detectAndAnimateDeaths() {
        if (!BattleEngine.player || !BattleEngine.enemy) return;
        if (!this._prevFieldState || !this._prevFieldState.player.length) return;

        const curPlayer = BattleEngine.player.board;
        const curEnemy = BattleEngine.enemy.board;
        const prevPlayer = this._prevFieldState.player;
        const prevEnemy = this._prevFieldState.enemy;

        // Check player board for deaths
        for (let i = 0; i < Math.max(prevPlayer.length, curPlayer.length); i++) {
            const wasAlive = prevPlayer[i] && prevPlayer[i] !== null;
            const isDead = !curPlayer[i] || curPlayer[i] === null;
            if (wasAlive && isDead) {
                const emoji = prevPlayer[i].emoji || '💀';
                BattlePhaser.deathFade('player', i, emoji);
            }
        }

        // Check enemy board for deaths
        for (let i = 0; i < Math.max(prevEnemy.length, curEnemy.length); i++) {
            const wasAlive = prevEnemy[i] && prevEnemy[i] !== null;
            const isDead = !curEnemy[i] || curEnemy[i] === null;
            if (wasAlive && isDead) {
                const emoji = prevEnemy[i].emoji || '💀';
                BattlePhaser.deathFade('enemy', i, emoji);
            }
        }
    },

    _handleBattleResult(type) {
        // Remove overlay
        const overlay = document.getElementById('battle-result-overlay');
        if (overlay) overlay.remove();

        // Remove arrange overlay
        const arrangeOverlay = document.getElementById('arrange-overlay');
        if (arrangeOverlay) arrangeOverlay.remove();

        // Remove phase bar
        const phaseBar = document.getElementById('battle-phase-bar');
        if (phaseBar) phaseBar.remove();

        // Remove action row content
        const actionRow = document.querySelector('.battle-action-row');
        if (actionRow) { actionRow.innerHTML = ''; actionRow.style.display = 'none'; }

        const stage = GameState.player.stage;
        const battleContainer = document.getElementById('battle-canvas-container');

        const rewards = this._lastBattleRewards;

        if (type === 'win') {
            // Apply pre-generated win rewards
            Rewards.applyWinRewards(rewards);

            // Stage progression
            if (GameState.player.wave < GameState.player.maxWave) {
                GameState.player.wave++;
            } else {
                // Also process economy stage reward for packs/items
                const ecoRewards = Economy.processStageReward(stage);
                GameState.player.stage++;
                GameState.player.wave = 1;
                GameState.stats.highestStage = Math.max(GameState.stats.highestStage, GameState.player.stage);
            }

            // Bug #5: Clean up battle state after win (no auto-next)
            this._cleanupAfterBattle();

            // Show reward popup with new cards
            Rewards.showRewardPopup(true, rewards, stage);
        } else if (type === 'lose') {
            // Apply pre-generated loss rewards
            Rewards.applyLossRewards(rewards);

            // Bug #5: Clean up battle state after loss (no auto-next)
            this._cleanupAfterBattle();

            // Show defeat popup with consolation gold
            Rewards.showRewardPopup(false, rewards, stage);
        } else {
            // Back button - just clean up
            this._cleanupAfterBattle();
        }

        // Update header in all cases
        this.updateHeader();
    },

    /**
     * Bug #5: Clean up all battle state after battle ends.
     * Removes Phaser canvas, restores normal layout, stops engine.
     */
    _cleanupAfterBattle() {
        // Destroy Phaser bridge to fully clean up (prevents double-exit issues)
        if (typeof BattlePhaser !== 'undefined') {
            if (BattlePhaser.isActive()) {
                // Reset inline styles on battle elements
                var movedEls = ['#card-hand-area', '.battle-action-row', '.battle-info-strip', '.battle-controls'];
                for (var i = 0; i < movedEls.length; i++) {
                    var el = document.querySelector(movedEls[i]);
                    if (el) {
                        el.style.cssText = '';
                        el.style.display = 'none';
                    }
                }
            }
            BattlePhaser.destroy();
        }

        // Hide battle canvas container AND reset its wrapper
        const battleContainer = document.getElementById('battle-canvas-container');
        if (battleContainer) {
            battleContainer.style.cssText = '';
            battleContainer.style.display = 'none';
            // Clear any leftover canvas elements from Phaser
            var oldCanvas = battleContainer.querySelector('canvas');
            if (oldCanvas) oldCanvas.remove();
        }
        const canvasWrap = document.querySelector('.battle-canvas-wrap');
        if (canvasWrap) {
            canvasWrap.style.cssText = '';
            canvasWrap.style.height = '';
            canvasWrap.style.minHeight = '';
        }

        // Remove battle-active class (exits fullscreen mode)
        var screenBattleEl = document.getElementById('screen-battle');
        if (screenBattleEl) screenBattleEl.classList.remove('battle-active');

        // Stop battle engine
        if (typeof BattleEngine !== 'undefined') {
            BattleEngine.stop();
        }

        // Ensure card hand area is hidden and restored
        const cardHandArea = document.getElementById('card-hand-area');
        if (cardHandArea) {
            cardHandArea.style.cssText = '';
            cardHandArea.style.display = 'none';
        }

        // Robustly restore nav/header visibility
        const navEl = document.querySelector('.game-nav');
        const headerEl = document.querySelector('.game-header');
        if (navEl) { navEl.style.display = ''; navEl.style.removeProperty('display'); }
        if (headerEl) { headerEl.style.display = ''; headerEl.style.removeProperty('display'); }

        // Restore battle controls (Start Battle button) — was hidden by inline style during cleanup
        const battleControls = document.querySelector('.battle-controls');
        if (battleControls) { battleControls.style.cssText = ''; battleControls.style.removeProperty('display'); }

        // Clear hero power area
        const heroPowerArea = document.getElementById('hero-power-area');
        if (heroPowerArea) heroPowerArea.innerHTML = '';

        // Re-render battle screen to show deck preview
        UI.renderBattleScreen();

        // Reset start button state
        this._updateStartButton();
    },

    showRewards(rewards) {
        let msg = `Stage ${GameState.player.stage - 1} Complete!\n`;
        msg += `💰 +${rewards.gold} Gold\n`;
        msg += `⭐ +${rewards.exp} EXP\n`;
        if (rewards.cards.length > 0) {
            msg += `🃏 New card: ${rewards.cards.map(c => c.name).join(', ')}\n`;
        }
        if (rewards.items.length > 0) {
            msg += `🎁 Item: ${rewards.items.map(i => i.name).join(', ')}`;
        }
        this.toast(msg, 'success');
    },

    // ===== STAGE CLEAR MODAL =====
    showStageClearModal(rewards, stageNum) {
        const modal = document.createElement('div');
        modal.className = 'battle-result-modal';

        let rewardsHTML = '';
        rewardsHTML += `<div>💰 <strong>+${rewards.gold}</strong> Gold</div>`;
        rewardsHTML += `<div>⭐ <strong>+${rewards.exp}</strong> EXP</div>`;
        if (rewards.cards && rewards.cards.length > 0) {
            rewardsHTML += `<div>🃏 New Card: <strong style="color:${RARITIES[rewards.cards[0].rarity]?.color || 'var(--gold)'}">${rewards.cards.map(c => c.name).join(', ')}</strong></div>`;
        }
        if (rewards.items && rewards.items.length > 0) {
            rewardsHTML += `<div>🎁 Item: <strong>${rewards.items.map(i => i.name).join(', ')}</strong></div>`;
        }
        if (rewards.leveledUp) {
            rewardsHTML += `<div>🎉 <strong style="color:var(--gold)">LEVEL UP!</strong></div>`;
        }

        modal.innerHTML = `
            <div class="battle-result-content">
                <div class="battle-result-title" style="color:var(--gold);">🏆 STAGE ${stageNum} CLEAR!</div>
                <div class="battle-result-rewards">${rewardsHTML}</div>
                <div class="battle-result-buttons">
                    <button class="btn btn-gold" onclick="UI.closeBattleResultModal(this); UI.startBattle();">⚔️ Next Stage</button>
                    <button class="btn btn-secondary" onclick="UI.closeBattleResultModal(this)">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => { if (modal.parentNode) modal.remove(); }, 8000);
    },

    // ===== DEFEAT MODAL =====
    showDefeatModal() {
        const modal = document.createElement('div');
        modal.className = 'battle-result-modal';

        modal.innerHTML = `
            <div class="battle-result-content" style="border-color:#ff4444;">
                <div class="battle-result-title" style="color:#ff4444;">💀 DEFEATED</div>
                <div class="battle-result-rewards" style="color:var(--text-dim);">
                    <div>Your heroes fell in battle...</div>
                    <div>Stage ${GameState.player.stage} — Wave ${GameState.player.wave}/3</div>
                    <div style="margin-top:8px;font-size:8px;">💡 Tip: Upgrade your cards or change formation!</div>
                </div>
                <div class="battle-result-buttons">
                    <button class="btn btn-gold" onclick="UI.closeBattleResultModal(this); UI.startBattle();">🔄 Retry</button>
                    <button class="btn btn-secondary" onclick="UI.closeBattleResultModal(this)">Back</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => { if (modal.parentNode) modal.remove(); }, 10000);
    },

    closeBattleResultModal(btn) {
        const modal = btn.closest('.battle-result-modal');
        if (modal) modal.remove();
    },

    // ===== HEROES SCREEN =====
    // ===== SPRINT 3: ENHANCED COLLECTION SCREEN =====
    // ===== FEATURE 1: Collection Screen Improvements =====
    _collectionState: { search: '', sort: 'name', rarityFilter: 'all', classFilter: 'all' },

    _bindCollectionToolbar() {
        const searchInput = document.getElementById('collection-search');
        const sortSelect = document.getElementById('collection-sort');
        if (!searchInput || !sortSelect) return;

        searchInput.addEventListener('input', () => {
            this._collectionState.search = searchInput.value.trim().toLowerCase();
            this._renderCollectionCards();
        });

        sortSelect.addEventListener('change', () => {
            this._collectionState.sort = sortSelect.value;
            this._renderCollectionCards();
        });

        this._renderRarityFilters();
        this._renderClassFilters();
    },

    _renderRarityFilters() {
        const container = document.getElementById('rarity-filters');
        if (!container) return;
        const rarities = [
            { key: 'all', label: 'All' },
            { key: 'common', label: 'Common' },
            { key: 'rare', label: 'Rare' },
            { key: 'epic', label: 'Epic' },
            { key: 'legendary', label: 'Legendary' },
            { key: 'mythic', label: 'Mythic' }
        ];
        container.innerHTML = `<span style="font-size:7px;color:var(--text-dim);font-family:'Press Start 2P',monospace;">R:</span>`;
        rarities.forEach(r => {
            const isActive = this._collectionState.rarityFilter === r.key;
            const rColor = r.key !== 'all' && RARITIES[r.key] ? RARITIES[r.key].color : 'var(--gold)';
            const btn = document.createElement('button');
            btn.style.cssText = `
                font-family:'Press Start 2P',monospace;font-size:6px;padding:3px 6px;
                background:${isActive ? rColor : 'rgba(255,215,0,0.06)'};
                color:${isActive ? '#000' : rColor};
                border:1px solid ${isActive ? rColor : rColor+'44'};
                border-radius:4px;cursor:pointer;transition:all 0.2s ease;white-space:nowrap;
            `;
            btn.textContent = r.label;
            btn.addEventListener('click', () => {
                this._collectionState.rarityFilter = r.key;
                this._renderRarityFilters();
                this._renderCollectionCards();
            });
            container.appendChild(btn);
        });
    },

    _renderClassFilters() {
        const container = document.getElementById('class-filters');
        if (!container) return;
        const classes = [
            { key: 'all', label: 'All' },
            { key: 'warrior', label: '⚔️Warrior' },
            { key: 'mage', label: '🔮Mage' },
            { key: 'archer', label: '🏹Archer' },
            { key: 'healer', label: '💚Healer' },
            { key: 'assassin', label: '🗡️Assassin' },
            { key: 'tank', label: '🛡️Tank' }
        ];
        container.innerHTML = `<span style="font-size:7px;color:var(--text-dim);font-family:'Press Start 2P',monospace;">C:</span>`;
        classes.forEach(c => {
            const isActive = this._collectionState.classFilter === c.key;
            const cInfo = CLASSES[c.key] || {};
            const cColor = cInfo.color || 'var(--gold)';
            const btn = document.createElement('button');
            btn.style.cssText = `
                font-family:'Press Start 2P',monospace;font-size:6px;padding:3px 6px;
                background:${isActive ? cColor : 'rgba(255,215,0,0.06)'};
                color:${isActive ? '#000' : cColor};
                border:1px solid ${isActive ? cColor : cColor+'44'};
                border-radius:4px;cursor:pointer;transition:all 0.2s ease;white-space:nowrap;
            `;
            btn.textContent = c.label;
            btn.addEventListener('click', () => {
                this._collectionState.classFilter = c.key;
                this._renderClassFilters();
                this._renderCollectionCards();
            });
            container.appendChild(btn);
        });
    },

    _renderCollectionProgressBar() {
        const el = document.getElementById('collection-progress-bar');
        if (!el) return;
        const ownedTemplates = new Set();
        GameState.collection.forEach(c => ownedTemplates.add(c.templateId || c.name));
        const owned = ownedTemplates.size;
        const total = CARD_TEMPLATES.length;
        const pct = total > 0 ? Math.round((owned / total) * 100) : 0;
        el.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:var(--gold);">Collection: <span style="color:#44ff88">${owned}</span>/${total}</span>
                <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:var(--gold);">${pct}%</span>
            </div>
            <div style="width:100%;height:8px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,215,0,0.15);border-radius:4px;overflow:hidden;">
                <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--gold-dark),var(--gold),#ffe060);transition:width 0.3s ease;border-radius:4px;"></div>
            </div>
        `;
    },

    _getFilteredSortedTemplates() {
        const s = this._collectionState;
        let templates = [...CARD_TEMPLATES];

        // Search filter
        if (s.search) {
            templates = templates.filter(t => t.name.toLowerCase().includes(s.search));
        }

        // Rarity filter: only show templates whose owned card matches rarity, or show all owned/unowned
        if (s.rarityFilter !== 'all') {
            templates = templates.filter(t => {
                const owned = GameState.collection.find(c => (c.templateId || c.name) === t.name);
                return owned && owned.rarity === s.rarityFilter;
            });
        }

        // Class filter
        if (s.classFilter !== 'all') {
            templates = templates.filter(t => t.cls === s.classFilter);
        }

        // Sort
        const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };
        const sortFn = (a, b) => {
            switch (s.sort) {
                case 'name': return a.name.localeCompare(b.name);
                case 'rarity': {
                    const ra = GameState.collection.find(c => (c.templateId || c.name) === a.name);
                    const rb = GameState.collection.find(c => (c.templateId || c.name) === b.name);
                    return (rarityOrder[rb?.rarity || 'common'] || 0) - (rarityOrder[ra?.rarity || 'common'] || 0);
                }
                case 'class': return (a.cls || '').localeCompare(b.cls || '');
                case 'power': {
                    const pa = GameState.collection.find(c => (c.templateId || c.name) === a.name);
                    const pb = GameState.collection.find(c => (c.templateId || c.name) === b.name);
                    return (getCardPower(pb || { stats: { hp: b.hp, atk: b.atk, def: b.def, spd: b.spd } }) || 0)
                         - (getCardPower(pa || { stats: { hp: a.hp, atk: a.atk, def: a.def, spd: a.spd } }) || 0);
                }
                default: return 0;
            }
        };
        templates.sort(sortFn);
        return templates;
    },

    _renderCollectionCards() {
        const grid = document.getElementById('hero-list');
        if (!grid) return;
        grid.innerHTML = '';

        const templates = this._getFilteredSortedTemplates();
        const totalTemplates = CARD_TEMPLATES.length;
        const deckIds = new Set((GameState.deck || []).map(d => typeof d === 'string' ? d : d.id));

        // Update count display
        const countEl = document.getElementById('collection-count');
        if (countEl) {
            countEl.textContent = `Showing ${templates.length} of ${totalTemplates}`;
        }

        // Update progress bar
        this._renderCollectionProgressBar();

        if (templates.length === 0) {
            grid.innerHTML = `<div style="text-align:center;padding:24px;grid-column:1/-1;">
                <div style="font-size:24px;margin-bottom:8px;">🔍</div>
                <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:var(--text-dim);">No cards match your filters</div>
            </div>`;
            return;
        }

        templates.forEach(tmpl => {
            const ownedCard = GameState.collection.find(c => (c.templateId || c.name) === tmpl.name);
            const isOwned = !!ownedCard;

            const el = document.createElement('div');
            el.style.cssText = 'min-height:120px;position:relative;transition:opacity 0.3s ease,transform 0.3s ease;';

            if (isOwned) {
                const card = ownedCard;
                const rarity = card.rarity || 'common';
                const rColor = (RARITIES[rarity] || {}).color || '#aaa';
                const clsInfo = CLASSES[card.class] || {};
                const elInfo = (typeof getCardElement === 'function') ? getCardElement(card) : null;
                const elColor = elInfo ? elInfo.color : rColor;
                el.className = `card ${rarity}`;
                // Element-colored left border
                el.style.borderLeft = `4px solid ${elColor}`;
                el.style.paddingLeft = '10px';
                el.style.boxShadow = `inset 0 0 8px ${elColor}33`;
                el.onclick = () => this.showHeroDetail(card);

                const template = getTemplateByName(card.templateId || card.name);
                let sprite;
                if (template && template.image) {
                    sprite = document.createElement('img');
                    sprite.className = 'card-sprite';
                    sprite.width = 48; sprite.height = 48;
                    sprite.style.imageRendering = 'pixelated';
                    sprite.src = template.image;
                    sprite.onerror = function() {
                        const cvs = document.createElement('canvas');
                        cvs.className = 'card-sprite'; cvs.width = 48; cvs.height = 48;
                        CardRenderer.drawCardSprite(cvs, card, 48);
                        sprite.replaceWith(cvs);
                    };
                } else {
                    sprite = document.createElement('canvas');
                    sprite.className = 'card-sprite'; sprite.width = 48; sprite.height = 48;
                    CardRenderer.drawCardSprite(sprite, card, 48);
                }

                const name = document.createElement('div');
                name.className = 'card-name';
                name.style.color = rColor;
                name.textContent = card.name + (card.level > 1 ? ` Lv.${card.level}` : '');

                const cls = document.createElement('div');
                cls.className = 'card-class';
                const elIcon = elInfo ? `${elInfo.icon} ${elInfo.name}` : '';
                cls.innerHTML = `${elIcon} <span style="color:${rColor}">${clsInfo.emoji || ''} ${clsInfo.name || card.class}</span>`;

                const stats = document.createElement('div');
                stats.className = 'card-stats';
                const maxHP = 140, maxATK = 38, maxDEF = 25, maxSPD = 24;
                const statData = [
                    { label: 'HP',  val: card.stats.hp,  max: maxHP,  color: '#44cc44' },
                    { label: 'ATK', val: card.stats.atk, max: maxATK, color: '#ff6644' },
                    { label: 'DEF', val: card.stats.def, max: maxDEF, color: '#4488ff' },
                    { label: 'SPD', val: card.stats.spd, max: maxSPD, color: '#ffaa00' },
                ];
                stats.innerHTML = statData.map(s => `
                    <div class="card-stat-row">
                        <span class="card-stat-label">${s.label}</span>
                        <div class="card-stat-bar-bg"><div class="card-stat-bar-fill" style="width:${Math.min(100, (s.val / s.max) * 100)}%;background:${s.color}"></div></div>
                        <span class="card-stat-val" style="color:${s.color}">${s.val}</span>
                    </div>
                `).join('') + `<div class="card-power">⚡ ${getCardPower(card)}</div>`;

                el.appendChild(sprite);
                el.appendChild(name);
                el.appendChild(cls);
                el.appendChild(stats);

                // "IN DECK" badge
                if (deckIds.has(card.id)) {
                    const badge = document.createElement('div');
                    badge.style.cssText = 'position:absolute;top:4px;right:4px;font-family:"Press Start 2P",monospace;font-size:5px;padding:2px 4px;background:var(--gold);color:#000;border-radius:4px;z-index:2;box-shadow:0 0 6px rgba(255,215,0,0.4);';
                    badge.textContent = 'IN DECK';
                    el.appendChild(badge);
                }

                // Class badge (bottom right)
                if (clsInfo.color) {
                    const classBadge = document.createElement('div');
                    classBadge.style.cssText = `position:absolute;bottom:4px;right:4px;font-family:'Press Start 2P',monospace;font-size:5px;padding:2px 4px;background:${clsInfo.color};color:#000;border-radius:4px;z-index:2;`;
                    classBadge.textContent = (clsInfo.emoji || '') + ' ' + (clsInfo.name || card.class);
                    el.appendChild(classBadge);
                }
            } else {
                // Locked silhouette
                el.className = 'card common';
                el.style.cssText += 'opacity:0.5;filter:grayscale(0.8);cursor:pointer;';
                el.onclick = () => this.toast('🔒 Unlock from battle rewards or packs!', 'info');

                const lockIcon = document.createElement('div');
                lockIcon.style.cssText = 'text-align:center;font-size:28px;margin-bottom:4px;';
                lockIcon.textContent = '🔒';

                const name = document.createElement('div');
                name.className = 'card-name';
                name.style.color = '#666';
                name.textContent = '???';

                const cls = document.createElement('div');
                cls.className = 'card-class';
                const clsInfo = CLASSES[tmpl.cls] || {};
                cls.textContent = (clsInfo.emoji || '') + ' ' + (clsInfo.name || tmpl.cls);
                cls.style.color = '#555';

                const stats = document.createElement('div');
                stats.className = 'card-stats';
                stats.style.color = '#444';
                stats.innerHTML = '<span>HP:?</span><span>ATK:?</span><span>DEF:?</span><span>SPD:?</span>';

                el.appendChild(lockIcon);
                el.appendChild(name);
                el.appendChild(cls);
                el.appendChild(stats);
            }
            grid.appendChild(el);
        });
    },

    renderHeroesScreen() {
        // Initialize toolbar (only once)
        if (!this._collectionToolbarBound) {
            this._bindCollectionToolbar();
            this._collectionToolbarBound = true;
        }
        this._renderCollectionCards();
    },

    showHeroDetail(card) {
        // Remove any existing detail modal
        const old = document.getElementById('hero-detail-modal');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'hero-detail-modal';
        overlay.style.cssText = `
            position:fixed;top:0;left:0;right:0;bottom:0;
            z-index:99999;display:flex;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.75);animation:s3FadeIn 0.2s ease;
        `;
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const r = RARITIES[card.rarity] || {};
        const cls = CLASSES[card.class] || {};
        const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };
        const stars = '★'.repeat((rarityOrder[card.rarity] || 0) + 1);
        const skillDesc = card.skill ? card.skill.name + (card.skill.chance ? ` (${Math.floor(card.skill.chance * 100)}% chance)` : '') : 'None';

        const maxHP = 140, maxATK = 38, maxDEF = 25, maxSPD = 24;
        const statBars = [
            { label: 'HP', val: card.stats.hp, max: maxHP, color: '#44cc44' },
            { label: 'ATK', val: card.stats.atk, max: maxATK, color: '#ff6644' },
            { label: 'DEF', val: card.stats.def, max: maxDEF, color: '#4488ff' },
            { label: 'SPD', val: card.stats.spd, max: maxSPD, color: '#ffaa00' },
        ];

        const spriteContainerId = 'detail-sprite-container';

        overlay.innerHTML = `
            <div style="
                background:linear-gradient(135deg,#0a0a2e,#141432);
                border:2px solid ${r.color || '#888'};
                border-radius:12px;padding:20px 24px;text-align:center;
                max-width:320px;width:90%;box-shadow:0 0 30px ${r.color || '#888'}44;
                max-height:90vh;overflow-y:auto;
            ">
                <div id="${spriteContainerId}" style="width:80px;height:80px;margin:0 auto 8px;"></div>
                <div style="font-family:'Press Start 2P';font-size:10px;color:${r.color};margin-bottom:4px;">
                    ${card.name}${card.level > 1 ? ` Lv.${card.level}` : ''}
                </div>
                <div style="font-size:7px;color:${r.color};margin-bottom:4px;">${stars} ${r.name}</div>
                <div style="font-size:8px;color:${cls.color};margin-bottom:12px;">
                    ${cls.emoji} ${cls.name}
                </div>
                <div style="text-align:left;margin-bottom:12px;">
                    ${statBars.map(s => `
                        <div style="display:flex;align-items:center;gap:6px;margin:3px 0;">
                            <span style="font-size:7px;color:${s.color};width:28px;">${s.label}</span>
                            <div style="flex:1;height:8px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);">
                                <div style="width:${Math.min(100, (s.val / s.max) * 100)}%;height:100%;background:${s.color};"></div>
                            </div>
                            <span style="font-size:7px;color:${s.color};width:24px;text-align:right;">${s.val}</span>
                        </div>
                    `).join('')}
                </div>
                <div style="font-size:8px;color:#88ccff;margin-bottom:4px;">
                    ⚡ Power: ${getCardPower(card)}
                </div>
                <div style="font-size:7px;color:#bbddbb;margin-bottom:12px;">
                    ✨ ${skillDesc}
                </div>
                ${card.level > 1 && card.expToNext ? `
                    <div style="margin-bottom:12px;">
                        <div style="font-size:6px;color:var(--text-dim);margin-bottom:2px;">EXP ${card.exp}/${card.expToNext}</div>
                        <div style="height:4px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);">
                            <div style="width:${Math.min(100, (card.exp / card.expToNext) * 100)}%;height:100%;background:#88ccff;"></div>
                        </div>
                    </div>
                ` : ''}
                <button class="btn btn-gold" onclick="document.getElementById('hero-detail-modal').remove()"
                    style="min-height:44px;min-width:100px;">✕ Close</button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Draw sprite
        setTimeout(() => {
            const container = document.getElementById(spriteContainerId);
            if (!container) return;
            const template = getTemplateByName(card.templateId || card.name);
            if (template && template.image) {
                const img = new Image();
                img.width = 80; img.height = 80;
                img.style.imageRendering = 'pixelated';
                img.onload = () => {
                    container.innerHTML = '';
                    container.appendChild(img);
                };
                img.onerror = () => {
                    const cvs = document.createElement('canvas');
                    cvs.width = 80; cvs.height = 80;
                    CardRenderer.drawCardSprite(cvs, card, 80);
                    container.innerHTML = '';
                    container.appendChild(cvs);
                };
                img.src = template.image;
            } else if (typeof CardRenderer !== 'undefined') {
                const cvs = document.createElement('canvas');
                cvs.width = 80; cvs.height = 80;
                CardRenderer.drawCardSprite(cvs, card, 80);
                container.innerHTML = '';
                container.appendChild(cvs);
            }
        }, 50);
    },

    // ===== STRATEGY / FORMATION SCREEN =====
    renderStrategyScreen() {
        const container = document.getElementById('strategy-content');
        if (!container) return;

        let html = '';

        // Section A: Hero Selection
        html += this._renderHeroSelectionGrid();

        // Section B: Skill Deck Builder
        html += this._renderSkillDeckBuilder();

        // Section C: Active Deck Summary
        html += this._renderDeckSummary();

        // Section D: AI Deck Builder Recommendation
        html += '<div id="ai-recommendation-panel"></div>';

        container.innerHTML = html;

        // Render AI Deck Builder button into the dedicated panel
        const adbPanel = document.getElementById('ai-deck-builder-panel');
        if (adbPanel) {
            adbPanel.innerHTML = `
                <div style="margin-top:12px;text-align:center;">
                    <button onclick="UI.openAIDeckBuilder()" style="
                        font-family:'Press Start 2P',monospace;font-size:8px;
                        padding:10px 20px;background:linear-gradient(180deg,#1a1a4e,#0a0a2e);
                        color:var(--gold);border:2px solid var(--gold-dark);border-radius:4px;
                        cursor:pointer;transition:all 0.2s ease;
                        box-shadow:0 0 12px rgba(255,215,0,0.15);
                    " onmouseover="this.style.boxShadow='0 0 20px rgba(255,215,0,0.3)'" onmouseout="this.style.boxShadow='0 0 12px rgba(255,215,0,0.15)'">
                        🤖 AI Deck Builder
                    </button>
                </div>
            `;
        }

        // Draw sprites after DOM update
        setTimeout(() => {
            container.querySelectorAll('.strategy-hero-sprite').forEach(canvas => {
                const heroName = canvas.dataset.hero;
                const hero = GameState.collection.find(c => c.name === heroName);
                if (hero && typeof CardRenderer !== 'undefined') {
                    CardRenderer.drawCardSprite(canvas, hero, 48);
                }
            });

            // Render AI recommendation
            const deckCards = GameState.getDeckCards();
            const panel = document.getElementById('ai-recommendation-panel');
            if (deckCards.length > 0 && panel && typeof AIDeckBuilder !== 'undefined') {
                AIDeckBuilder.renderRecommendation(deckCards[0], panel);
            }
        }, 50);
    },

    /**
     * Section A: Hero Selection Grid — show all 20, only owned are clickable
     */
    _renderHeroSelectionGrid() {
        const deckCards = GameState.getDeckCards();
        const currentHero = deckCards.length > 0 ? deckCards[0] : null;

        // Count owned
        const ownedTemplates = new Set();
        GameState.collection.forEach(c => ownedTemplates.add(c.templateId || c.name));

        let html = `
            <div style="font-family:'Press Start 2P';font-size:8px;color:var(--gold);margin-bottom:8px;">
                🦸 SELECT BATTLE HERO — <span style="color:#44ff88">${ownedTemplates.size}</span>/${CARD_TEMPLATES.length} owned
            </div>
            <div class="strategy-hero-grid">
        `;

        // Show all 20 templates
        CARD_TEMPLATES.forEach(tmpl => {
            const ownedCard = GameState.collection.find(c => (c.templateId || c.name) === tmpl.name);
            const isOwned = !!ownedCard;
            const isActive = currentHero && ownedCard && currentHero.id === ownedCard.id;
            const cls = CLASSES[tmpl.cls] || {};

            if (isOwned) {
                const card = ownedCard;
                const r = RARITIES[card.rarity] || {};
                html += `
                    <div class="strategy-hero-card ${isActive ? 'active' : ''}" onclick="UI._selectBattleHero(${card.id})">
                        <canvas class="strategy-hero-sprite" data-hero="${card.name}" width="48" height="48" style="image-rendering:pixelated;"></canvas>
                        <div style="font-size:7px;color:${r.color};font-weight:700;">${card.name}</div>
                        <div style="font-size:6px;color:${cls.color};">${cls.emoji} ${cls.name}</div>
                        ${isActive ? '<div style="font-size:6px;color:#44ff88;">✅ Active</div>' : ''}
                    </div>
                `;
            } else {
                html += `
                    <div class="strategy-hero-card" style="opacity:0.4;filter:grayscale(0.7);cursor:not-allowed;">
                        <div style="font-size:24px;text-align:center;line-height:48px;">🔒</div>
                        <div style="font-size:7px;color:#666;font-weight:700;">???</div>
                        <div style="font-size:6px;color:${cls.color};">${cls.emoji} ${cls.name}</div>
                    </div>
                `;
            }
        });

        html += '</div>';
        return html;
    },

    /**
     * Select a hero as the active battle hero
     */
    _selectBattleHero(cardId) {
        GameState.deck = [cardId];
        GameState.collection.forEach(c => c.inDeck = (c.id === cardId));
        GameState.save();
        this.renderStrategyScreen();
        this.toast('Battle hero updated!', 'success');
    },

    /**
     * Section B: Skill Deck Builder — pick up to 4 skill cards
     */
    _renderSkillDeckBuilder() {
        let html = `
            <div style="font-family:'Press Start 2P';font-size:8px;color:var(--gold);margin:16px 0 8px;">
                🃏 SKILL DECK (Max 4)
            </div>
            <div class="strategy-skill-grid">
        `;

        SKILL_CARD_TEMPLATES.forEach(card => {
            const inDeck = (GameState.skillDeck || []).includes(card.id);
            const cardType = CARD_TYPES[card.type] || {};
            const rarityColor = RARITIES[card.rarity]?.color || '#aaa';
            html += `
                <div class="strategy-skill-card ${inDeck ? 'selected' : ''}" onclick="UI._toggleSkillCard('${card.id}')">
                    <div style="font-size:7px;color:${rarityColor};font-weight:700;">${card.name}</div>
                    <div style="display:flex;gap:6px;font-size:6px;align-items:center;margin-top:2px;">
                        <span style="color:${rarityColor}">${RARITIES[card.rarity]?.name || card.rarity}</span>
                        <span style="color:${cardType.color || '#aaa'}">💎 ${card.manaCost}</span>
                    </div>
                    <div class="strategy-skill-desc">${card.description}</div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    },

    /**
     * Toggle a skill card in/out of the deck (max 4)
     */
    _toggleSkillCard(cardId) {
        let deck = GameState.skillDeck || [];
        const idx = deck.indexOf(cardId);

        if (idx >= 0) {
            deck.splice(idx, 1);
            GameState.skillDeck = deck;
        } else {
            if (deck.length >= 4) {
                this.toast('Skill deck is full! (Max 4 cards)', 'error');
                return;
            }
            deck.push(cardId);
            GameState.skillDeck = deck;
        }

        GameState.save();
        // Re-render full strategy screen so synergy info updates
        this.renderStrategyScreen();
    },

    /**
     * Section C: Active Deck Summary with synergy info and Ready to Battle button
     */
    _renderDeckSummary() {
        const deckCards = GameState.getDeckCards();
        const skillCards = (GameState.skillDeck && GameState.skillDeck.length > 0)
            ? GameState.getSkillDeckCards()
            : SKILL_CARD_TEMPLATES.slice(0, 4);

        let html = `
            <div style="font-family:'Press Start 2P';font-size:8px;color:var(--gold);margin:16px 0 8px;">
                📋 ACTIVE DECK SUMMARY
            </div>
            <div class="strategy-deck-summary">
        `;

        if (deckCards.length > 0) {
            const hero = deckCards[0];
            const cls = CLASSES[hero.class] || {};
            const r = RARITIES[hero.rarity] || {};
            html += `
                <div class="strategy-summary-hero">
                    <span style="font-size:14px">${cls.emoji || '🦸'}</span>
                    <span style="color:${r.color};font-size:8px;font-weight:700;">${hero.name}</span>
                    <span style="color:${cls.color};font-size:7px;">${cls.name}</span>
                </div>
            `;
        } else {
            html += `<div style="font-size:8px;color:var(--text-dim);">No hero selected</div>`;
        }

        html += '<div class="strategy-summary-skills">';
        const typeIcons = { attack: '⚔️', defense: '🛡️', buff: '✨', debuff: '💀', special: '⚡' };
        skillCards.forEach(card => {
            const typeIcon = typeIcons[card.type] || '🃏';
            html += `
                <div class="strategy-summary-skill">
                    <span>${typeIcon}</span>
                    <span style="font-size:7px">${card.name}</span>
                    <span style="font-size:7px;color:#888">💎${card.manaCost}</span>
                </div>
            `;
        });
        html += '</div>';

        // Synergy info
        if (deckCards.length > 0) {
            const hero = deckCards[0];
            const cls = CLASSES[hero.class];
            if (cls) {
                // Count skill types for synergy
                const typeCounts = {};
                skillCards.forEach(s => {
                    typeCounts[s.type] = (typeCounts[s.type] || 0) + 1;
                });
                const synergies = [];
                if (hero.class === 'warrior' && typeCounts.defense) synergies.push({ text: '🛡️ Tank Build — bonus DEF from defense skills', color: '#ff6644' });
                if (hero.class === 'mage' && typeCounts.attack) synergies.push({ text: '🔥 Burst Mage — extra damage from attack skills', color: '#8844ff' });
                if (hero.class === 'archer' && typeCounts.special) synergies.push({ text: '🎯 Precision — crit chance from special skills', color: '#44cc88' });
                if (hero.class === 'healer' && typeCounts.buff) synergies.push({ text: '💚 Sustain — enhanced healing from buff skills', color: '#44ffaa' });
                if (hero.class === 'assassin' && typeCounts.attack) synergies.push({ text: '🗡️ Lethal Strike — burst from attack skills', color: '#ff4488' });
                if (typeCounts.special >= 2) synergies.push({ text: '⚡ Special Mastery — bonus with 2+ special skills', color: '#ffd700' });
                if (typeCounts.attack >= 2) synergies.push({ text: '⚔️ Aggressor — 2+ attack skills boost ATK', color: '#ff6644' });

                html += `
                    <div class="strategy-synergy-info">
                        <span style="color:${cls.color};font-size:7px;">${cls.emoji} ${cls.name} — ${skillCards.length} skills equipped</span>
                `;
                if (synergies.length > 0) {
                    synergies.forEach(s => {
                        html += `<div style="font-size:6px;color:${s.color};margin-top:3px;">${s.text}</div>`;
                    });
                } else {
                    html += `<div style="font-size:6px;color:var(--text-dim);margin-top:3px;">Mix skill types for synergies!</div>`;
                }
                html += '</div>';
            }
        }

        html += '</div>';

        // Ready to Battle button
        const hasHero = deckCards.length > 0;
        const hasSkills = skillCards.length > 0;
        if (hasHero && hasSkills) {
            html += `
                <div style="text-align:center;margin-top:16px;">
                    <button class="btn btn-gold" onclick="UI._readyToBattle()" style="min-height:48px;padding:12px 32px;font-size:10px;">
                        ⚔️ Ready to Battle!
                    </button>
                </div>
            `;
        }

        // Battle Deck Preview below (use HTML-returning version for strategy screen)
        html += this._renderDeckPreviewHTML();

        return html;
    },

    /**
     * Go to battle screen with current deck
     */
    _readyToBattle() {
        const deckCards = GameState.getDeckCards();
        if (deckCards.length === 0) {
            this.toast('Select a hero first!', 'error');
            return;
        }
        this.showScreen('battle');
        this.toast('⚔️ Deck ready! Start the battle!', 'info');
    },

    /**
     * Show current deck hero + skill cards in battle preview (returns HTML string)
     */
    _renderDeckPreviewHTML() {
        const deckCards = GameState.getDeckCards();
        const skillCards = (GameState.skillDeck && GameState.skillDeck.length > 0)
            ? GameState.getSkillDeckCards()
            : SKILL_CARD_TEMPLATES.slice(0, 4);

        if (deckCards.length === 0) return '';

        const hero = deckCards[0];
        const cls = CLASSES[hero.class] || {};
        const r = RARITIES[hero.rarity] || {};
        const typeIcons = { attack: '⚔️', defense: '🛡️', buff: '✨', debuff: '💀', special: '⚡' };

        let html = `
            <div style="margin-top:16px;padding:12px;background:rgba(0,0,0,0.3);border:1px solid var(--border-color);border-radius:8px;">
                <div style="font-family:'Press Start 2P';font-size:7px;color:var(--gold);margin-bottom:8px;">
                    📦 BATTLE DECK PREVIEW
                </div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <div style="text-align:center;min-width:60px;">
                        <div style="font-size:20px;">${cls.emoji || '🦸'}</div>
                        <div style="font-size:6px;color:${r.color};font-weight:700;">${hero.name}</div>
                        <div style="font-size:6px;color:${cls.color};">${cls.name}</div>
                    </div>
                    <div style="font-size:16px;color:#555;">→</div>
        `;
        skillCards.forEach(s => {
            const sColor = RARITIES[s.rarity]?.color || '#aaa';
            html += `
                <div style="text-align:center;min-width:48px;padding:4px 6px;background:var(--bg-card);border:1px solid ${sColor};border-radius:4px;">
                    <div style="font-size:12px;">${typeIcons[s.type] || '🃏'}</div>
                    <div style="font-size:5px;color:${sColor};">${s.name}</div>
                </div>
            `;
        });
        html += `
                </div>
            </div>
        `;
        return html;
    },

    // ===== INVENTORY SCREEN =====
    bindInventoryTabs() {
        document.querySelectorAll('.inv-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.inv-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderInventoryItems(tab.dataset.tab);
            });
        });
    },

    renderInventoryScreen() {
        this.renderInventoryItems('equipment');
    },

    renderInventoryItems(tab) {
        const grid = document.getElementById('inventory-grid');
        grid.innerHTML = '';

        const items = tab === 'equipment'
            ? GameState.inventory.filter(i => i.type !== 'potion')
            : GameState.inventory.filter(i => i.type === 'potion');

        if (items.length === 0) {
            grid.innerHTML = '<div style="font-size:8px;color:var(--text-dim);padding:20px;">No items yet!</div>';
            return;
        }

        items.forEach(item => {
            const el = document.createElement('div');
            el.className = `card ${item.rarity}`;
            el.innerHTML = `
                <div style="text-align:center;font-size:16px;margin-bottom:8px;">${ITEM_TYPES[item.type].emoji}</div>
                <div class="card-name" style="color:${RARITIES[item.rarity]?.color || 'var(--gold)'}">${item.name}</div>
                <div class="card-class">${RARITIES[item.rarity]?.name || item.rarity}</div>
                <div class="card-stats">
                    <span><span style="color:#888">${item.stat.toUpperCase()}</span> <span style="color:var(--gold)">+${item.val}</span></span>
                </div>
                <div style="font-size:6px;color:var(--text-dim);margin-top:4px;">
                    ${item.equippedTo ? `Equipped to card #${item.equippedTo}` : 'Not equipped'}
                </div>
                <div style="margin-top:8px;display:flex;gap:4px;">
                    <button class="btn btn-secondary" style="font-size:6px;padding:4px 6px;" onclick="UI.equipItemToCard(${item.id})">Equip</button>
                    <button class="btn btn-secondary" style="font-size:6px;padding:4px 6px;" onclick="UI.sellItemConfirm(${item.id})">Sell</button>
                </div>
            `;
            grid.appendChild(el);
        });
    },

    equipItemToCard(itemId) {
        const deckCards = GameState.getDeckCards();
        if (deckCards.length === 0) {
            this.toast('Add cards to your deck first!', 'error');
            return;
        }
        const card = deckCards[0];
        if (GameState.equipItem(itemId, card.id)) {
            this.toast(`Equipped to ${card.name}!`, 'success');
            this.renderInventoryItems(document.querySelector('.inv-tab.active').dataset.tab);
        } else {
            this.toast('Cannot equip this item!', 'error');
        }
    },

    sellItemConfirm(itemId) {
        const item = GameState.inventory.find(i => i.id === itemId);
        if (!item) return;
        const price = Math.floor(item.price * 0.5);
        if (confirm(`Sell ${item.name} for ${price} gold?`)) {
            Economy.sellItem(itemId);
            this.toast(`Sold for ${price}g`, 'success');
            this.updateHeader();
            this.renderInventoryItems(document.querySelector('.inv-tab.active').dataset.tab);
        }
    },

    // ===== SHOP SCREEN =====
    bindShopTabs() {
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderShopContent(tab.dataset.tab);
            });
        });
    },

    renderShopScreen() {
        this.renderShopContent('tiers');
    },

    renderShopContent(tab) {
        const content = document.getElementById('shop-content');
        if (tab === 'tiers') this.renderTierPacks(content);
        else if (tab === 'classes') this.renderClassPacks(content);
        else if (tab === 'catalog') this.renderHeroCatalog(content);
        else if (tab === 'marketplace') this.renderMarketplace(content);
    },

    renderTierPacks(content) {
        const tierKeys = Object.keys(Economy.TIER_PACKS);
        content.innerHTML = `
            <div style="text-align:center;margin-bottom:16px;">
                <div style="font-size:32px;">🏆</div>
                <h3 style="font-size:11px;margin:8px 0;">Tier Card Packs</h3>
                <p style="font-size:7px;color:var(--text-dim);">Higher tier = better rarity odds + guarantees!</p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;">
                ${tierKeys.map(key => {
                    const pack = Economy.TIER_PACKS[key];
                    const affordable = Economy.canAfford({gold:pack.gold,gems:pack.gems});
                    const rarityClass = pack.tier >= 5 ? 'mythic' : pack.tier >= 4 ? 'legendary' : pack.tier >= 3 ? 'epic' : pack.tier >= 2 ? 'rare' : 'common';
                    return `
                        <div class="card ${rarityClass}" onclick="UI.buyTierPack('${key}')" style="${!affordable ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                            <div style="text-align:center;font-size:20px;margin-bottom:6px;">
                                ${pack.tier === 1 ? '🥉' : pack.tier === 2 ? '🥈' : pack.tier === 3 ? '🥇' : pack.tier === 4 ? '💎' : '🔥'}
                            </div>
                            <div class="card-name" style="color:${pack.color};font-size:9px;">${pack.name}</div>
                            <div class="card-class" style="font-size:7px;">${pack.desc}</div>
                            ${pack.guarantee ? `<div style="font-size:7px;color:#44ff88;margin-top:4px;">✅ Guaranteed ${pack.guarantee}+</div>` : ''}
                            <div style="font-size:8px;margin-top:8px;color:var(--gold);font-weight:700;">
                                ${pack.gold ? `💰 ${pack.gold}` : ''}${pack.gold && pack.gems ? ' + ' : ''}${pack.gems ? `💎 ${pack.gems}` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderClassPacks(content) {
        const classKeys = Object.keys(Economy.CLASS_PACKS);
        content.innerHTML = `
            <div style="text-align:center;margin-bottom:16px;">
                <div style="font-size:32px;">⚔️</div>
                <h3 style="font-size:11px;margin:8px 0;">Class-Focused Packs</h3>
                <p style="font-size:7px;color:var(--text-dim);">Target specific hero classes for your strategy!</p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;">
                ${classKeys.map(key => {
                    const pack = Economy.CLASS_PACKS[key];
                    const affordable = Economy.canAfford({gold:pack.gold,gems:pack.gems});
                    const rarityClass = key === 'rainbow' ? 'legendary' : 'rare';
                    return `
                        <div class="card ${rarityClass}" onclick="UI.buyClassPack('${key}')" style="${!affordable ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                            <div style="text-align:center;font-size:20px;margin-bottom:6px;">${pack.name.split(' ')[0]}</div>
                            <div class="card-name" style="color:${pack.color};font-size:9px;">${pack.name}</div>
                            <div class="card-class" style="font-size:7px;">${pack.desc}</div>
                            ${pack.guarantee ? `<div style="font-size:7px;color:#44ff88;margin-top:4px;">✅ Guaranteed ${pack.guarantee}+</div>` : ''}
                            <div style="font-size:8px;margin-top:8px;color:var(--gold);font-weight:700;">
                                ${pack.gold ? `💰 ${pack.gold}` : ''}${pack.gold && pack.gems ? ' + ' : ''}${pack.gems ? `💎 ${pack.gems}` : ''}
                            </div>
                            <div style="font-size:7px;color:var(--text-dim);margin-top:4px;">
                                ${key === 'rainbow' ? '🌈 1 of each class' : `${pack.count}x ${CLASSES[pack.classes[0]].name} cards`}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderHeroCatalog(content) {
        const classOrder = ['warrior', 'mage', 'archer', 'healer', 'assassin'];
        const grouped = {};
        classOrder.forEach(cls => grouped[cls] = []);
        CARD_TEMPLATES.forEach(t => { if (grouped[t.cls]) grouped[t.cls].push(t); });

        content.innerHTML = `
            <div style="text-align:center;margin-bottom:16px;">
                <div style="font-size:32px;">📖</div>
                <h3 style="font-size:11px;margin:8px 0;">Hero Catalog — ${CARD_TEMPLATES.length} Heroes</h3>
                <p style="font-size:7px;color:var(--text-dim);">All heroes obtainable from card packs!</p>
            </div>
            ${classOrder.map(cls => {
                const heroes = grouped[cls];
                const clsInfo = CLASSES[cls];
                return `
                    <div style="margin-bottom:16px;">
                        <div style="font-size:10px;color:${clsInfo.color};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid ${clsInfo.color}33;">
                            ${clsInfo.emoji} ${clsInfo.name}s (${heroes.length})
                        </div>
                        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;">
                            ${heroes.map(hero => {
                                const totalStats = hero.hp + hero.atk + hero.def + hero.spd + hero.crit;
                                const defaultRarity = totalStats > 200 ? 'epic' : totalStats > 160 ? 'rare' : 'common';
                                const owned = GameState.collection.filter(c => c.templateId === hero.name || c.name === hero.name).length;
                                return `
                                    <div class="card ${defaultRarity}" style="cursor:default;">
                                        <div style="text-align:center;">
                                            <canvas class="catalog-sprite" data-hero="${hero.name}" width="48" height="48" style="image-rendering:pixelated;"></canvas>
                                        </div>
                                        <div class="card-name" style="color:${RARITIES[defaultRarity]?.color || 'var(--gold)'};font-size:8px;">${hero.name}</div>
                                        <div class="card-class" style="font-size:7px;">${clsInfo.emoji} ${clsInfo.name}</div>
                                        <div style="font-size:7px;display:flex;gap:4px;justify-content:center;margin-top:4px;">
                                            <span style="color:#44cc44">HP:${hero.hp}</span>
                                            <span style="color:#ff6644">ATK:${hero.atk}</span>
                                            <span style="color:#4488ff">DEF:${hero.def}</span>
                                            <span style="color:#ffaa00">SPD:${hero.spd}</span>
                                        </div>
                                        <div style="font-size:7px;color:var(--gem);margin-top:4px;">✨ ${hero.skill.name}</div>
                                        ${owned > 0 ? `<div style="font-size:7px;color:#44ff88;margin-top:2px;">✅ Owned: ${owned}</div>` : `<div style="font-size:6px;color:var(--text-dim);margin-top:2px;">Not owned</div>`}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        `;

        setTimeout(() => {
            document.querySelectorAll('.catalog-sprite').forEach(canvas => {
                const heroName = canvas.dataset.hero;
                const tmpl = CARD_TEMPLATES.find(t => t.name === heroName);
                if (tmpl && tmpl.image) {
                    const img = new Image();
                    img.onload = () => {
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = false;
                        ctx.drawImage(img, 0, 0, 48, 48);
                    };
                    img.onerror = () => {
                        const card = { name: tmpl.name, class: tmpl.cls, rarity: 'common', stats: {hp:tmpl.hp,atk:tmpl.atk,def:tmpl.def,spd:tmpl.spd,crit:tmpl.crit}, artSeed: Math.floor(Math.random()*999999) };
                        if (typeof CardRenderer !== 'undefined') CardRenderer.drawCardSprite(canvas, card, 48);
                    };
                    img.src = tmpl.image;
                } else {
                    const card = { name: tmpl.name, class: tmpl.cls, rarity: 'common', stats: {hp:tmpl.hp,atk:tmpl.atk,def:tmpl.def,spd:tmpl.spd,crit:tmpl.crit}, artSeed: Math.floor(Math.random()*999999) };
                    if (typeof CardRenderer !== 'undefined') CardRenderer.drawCardSprite(canvas, card, 48);
                }
            });
        }, 50);
    },

    renderMarketplace(content) {
        this.marketListings = Economy.generateMarketListings(6);
        content.innerHTML = `
            <div style="text-align:center;margin-bottom:16px;">
                <div style="font-size:32px;">🏪</div>
                <h3 style="font-size:11px;margin:8px 0;">Marketplace</h3>
                <p style="font-size:7px;color:var(--text-dim);">Buy cards from other collectors!</p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;">
                ${this.marketListings.map((listing, i) => `
                    <div class="card ${listing.card.rarity}" onclick="UI.buyMarketItem(${i})">
                        <div style="text-align:center;">
                            <canvas id="market-card-${i}" width="48" height="48" style="image-rendering:pixelated;"></canvas>
                        </div>
                        <div class="card-name" style="color:${RARITIES[listing.card.rarity]?.color || 'var(--gold)'};font-size:8px;">${listing.card.name}</div>
                        <div class="card-class" style="font-size:7px;">${CLASSES[listing.card.class].emoji} ${CLASSES[listing.card.class].name}</div>
                        <div class="card-stats" style="font-size:7px;">
                            <span><span style="color:#888">PWR</span> <span style="color:var(--gold)">${getCardPower(listing.card)}</span></span>
                        </div>
                        <div style="font-size:7px;color:var(--text-dim);margin-top:4px;">Seller: ${listing.seller}</div>
                        <div style="text-align:center;margin-top:6px;">
                            <button class="btn btn-gold" style="font-size:7px;padding:4px 10px;">💰 ${listing.price}g</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        setTimeout(() => {
            this.marketListings.forEach((listing, i) => {
                const canvas = document.getElementById(`market-card-${i}`);
                if (canvas) CardRenderer.drawCardSprite(canvas, listing.card, 48);
            });
        }, 50);
    },

    buyTierPack(tierKey) {
        const pack = Economy.TIER_PACKS[tierKey];
        if (!pack) return;
        if (!Economy.canAfford({gold:pack.gold,gems:pack.gems})) {
            this.toast('Not enough currency!', 'error');
            return;
        }
        const cards = Economy.buyTierPack(tierKey);
        if (!cards) return;
        this.updateHeader();
        PackAnimation.show(pack.name, cards);
    },

    buyClassPack(classKey) {
        const pack = Economy.CLASS_PACKS[classKey];
        if (!pack) return;
        if (!Economy.canAfford({gold:pack.gold,gems:pack.gems})) {
            this.toast('Not enough currency!', 'error');
            return;
        }
        const cards = Economy.buyClassPack(classKey);
        if (!cards) return;
        this.updateHeader();
        PackAnimation.show(pack.name, cards);
    },

    openPack(packType) {
        const cost = Economy.PACK_COSTS[packType];
        if (!Economy.canAfford(cost)) {
            this.toast('Not enough currency!', 'error');
            return;
        }
        const cards = Economy.buyPack(packType);
        if (!cards) return;
        this.updateHeader();
        PackAnimation.show(cost.name, cards);
    },

    buyMarketItem(index) {
        const listing = this.marketListings[index];
        if (!listing) return;
        if (GameState.player.gold < listing.price) {
            this.toast('Not enough gold!', 'error');
            return;
        }
        GameState.player.gold -= listing.price;
        GameState.addToCollection(listing.card);
        this.marketListings.splice(index, 1);
        this.toast(`Bought ${listing.card.name}!`, 'success');
        this.updateHeader();
        this.renderShopContent('marketplace');
    },

    buyDailyDeal(index) {
        const result = Economy.buyDailyDeal(index);
        if (result) {
            this.toast('Daily deal purchased!', 'success');
            this.updateHeader();
            this.renderShopContent('tiers');
        } else {
            this.toast('Not enough currency!', 'error');
        }
    },

    showUnlockPopup(unlock) {
        const overlay = document.createElement('div');
        overlay.className = 'unlock-overlay';
        let cardHTML = '';
        if (unlock.cards.length > 0) {
            const card = unlock.cards[0];
            const r = RARITIES[card.rarity];
            const cls = CLASSES[card.class];
            cardHTML = `
                <div class="unlock-card" style="border-color: ${r.color}; box-shadow: 0 0 30px ${r.color}44">
                    <div class="unlock-rarity" style="color: ${r.color}">${r.name}</div>
                    <div class="unlock-art">${cls.emoji}</div>
                    <div class="unlock-name">${card.name}</div>
                    <div class="unlock-class">${cls.emoji} ${cls.name}</div>
                    <div class="unlock-stats">HP:${card.stats.hp} ATK:${card.stats.atk} DEF:${card.stats.def}</div>
                    <div class="unlock-skill">✨ ${card.skill.name}</div>
                </div>
            `;
        }
        let rewardHTML = '';
        if (unlock.rewards.gold) rewardHTML += `<span class="unlock-reward">💰 ${unlock.rewards.gold} Gold</span>`;
        if (unlock.rewards.gems) rewardHTML += `<span class="unlock-reward">💎 ${unlock.rewards.gems} Gems</span>`;
        overlay.innerHTML = `
            <div class="unlock-modal">
                <div class="unlock-title">🎊 LEVEL ${GameState.player.level} UNLOCK!</div>
                <div class="unlock-desc">${unlock.desc}</div>
                ${cardHTML}
                ${rewardHTML ? `<div class="unlock-rewards">${rewardHTML}</div>` : ''}
                <button class="btn btn-gold unlock-btn" onclick="this.closest('.unlock-overlay').remove()">✨ AWESOME!</button>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 8000);
    },

    renderTurnOrder() {
        const container = document.getElementById('turn-order-display');
        if (!container) return;
        container.innerHTML = '';
    },

    showEnemyInfo(unit) {
        const old = document.querySelector('.enemy-info-popup');
        if (old) old.remove();
        const popup = document.createElement('div');
        popup.className = 'enemy-info-popup';
        const cls = CLASSES[unit.class] || {};
        popup.innerHTML = `
            <div class="enemy-info-header">${cls.emoji || '⚔️'} ${unit.name}</div>
            <div class="enemy-info-stats">
                <div>❤️ HP: ${unit.stats.hp}/${unit.stats.maxHp}</div>
                <div>⚔️ ATK: ${unit.stats.atk}</div>
                <div>🛡️ DEF: ${unit.stats.def}</div>
                <div>💨 SPD: ${unit.stats.spd}</div>
            </div>
            ${unit.skill ? `<div class="enemy-info-skill">✨ ${unit.skill.name}</div>` : ''}
            <div class="enemy-info-close">✕</div>
        `;
        document.body.appendChild(popup);
        popup.querySelector('.enemy-info-close').addEventListener('click', () => popup.remove());
        popup.addEventListener('click', (e) => { if (e.target === popup) popup.remove(); });
        setTimeout(() => { if (popup.parentNode) popup.remove(); }, 5000);
    },

    // ===== FEATURE 2: AI DECK BUILDER =====
    openAIDeckBuilder() {
        const panel = document.getElementById('ai-deck-builder-panel');
        if (!panel) return;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'ai-deck-builder-overlay';
        overlay.style.cssText = `
            position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;
            display:flex;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.75);animation:s3FadeIn 0.2s ease;
        `;
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        // Loading panel
        const loadingPanel = document.createElement('div');
        loadingPanel.style.cssText = `
            background:linear-gradient(135deg,#0a0a2e,#141432);border:2px solid var(--gold-dark);
            border-radius:4px;padding:24px 20px;text-align:center;max-width:340px;width:90%;
            animation:resultSlideIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
        `;

        const messages = [
            '🧠 Analyzing your collection...',
            '⚡ Finding card synergies...',
            '📊 Optimizing mana curve...',
            '✨ Finalizing recommendations...'
        ];

        loadingPanel.innerHTML = `
            <div style="font-family:'Press Start 2P',monospace;font-size:10px;color:var(--gold);margin-bottom:16px;">🤖 AI DECK BUILDER</div>
            <div id="ai-db-loading-text" style="font-size:9px;color:var(--text);min-height:40px;display:flex;align-items:center;justify-content:center;">${messages[0]}</div>
            <div style="width:100%;height:4px;background:rgba(0,0,0,0.5);border-radius:4px;overflow:hidden;margin-top:12px;">
                <div id="ai-db-loading-bar" style="height:100%;width:0%;background:var(--gold);transition:width 0.3s ease;border-radius:4px;"></div>
            </div>
            <button onclick="this.closest('#ai-deck-builder-overlay').remove()" style="margin-top:16px;font-family:'Press Start 2P',monospace;font-size:7px;padding:8px 16px;background:rgba(255,255,255,0.05);color:var(--text-dim);border:1px solid rgba(255,255,255,0.1);border-radius:4px;cursor:pointer;">Close</button>
        `;

        overlay.appendChild(loadingPanel);
        document.body.appendChild(overlay);

        // Cycle loading messages
        let msgIdx = 0;
        const loadingBar = document.getElementById('ai-db-loading-bar');
        const loadingText = document.getElementById('ai-db-loading-text');
        const interval = setInterval(() => {
            msgIdx++;
            if (msgIdx < messages.length && loadingText) {
                loadingText.textContent = messages[msgIdx];
                if (loadingBar) loadingBar.style.width = ((msgIdx + 1) / messages.length * 80) + '%';
            }
        }, 600);

        // After ~2.5s, run AI recommendation
        setTimeout(() => {
            clearInterval(interval);
            if (loadingBar) loadingBar.style.width = '100%';

            // Get hero card from deck
            const deckCards = GameState.getDeckCards();
            const heroCard = deckCards.length > 0 ? deckCards[0] : null;

            let result = null;
            if (heroCard && typeof AIDeckBuilder !== 'undefined') {
                result = AIDeckBuilder.recommendDeck(heroCard);
            }

            if (result) {
                this._renderAIDeckBuilderResult(result, overlay);
            } else {
                loadingPanel.innerHTML = `
                    <div style="font-family:'Press Start 2P',monospace;font-size:10px;color:var(--gold);margin-bottom:12px;">🤖 AI DECK BUILDER</div>
                    <div style="font-size:8px;color:var(--red);margin-bottom:12px;">⚠️ No hero in deck! Add a hero card first.</div>
                    <button onclick="this.closest('#ai-deck-builder-overlay').remove()" style="font-family:'Press Start 2P',monospace;font-size:7px;padding:8px 16px;background:var(--gold);color:#000;border:none;border-radius:4px;cursor:pointer;">Close</button>
                `;
            }
        }, 2500);
    },

    _renderAIDeckBuilderResult(result, overlay) {
        const panel = document.getElementById('ai-deck-builder-overlay');
        if (!panel) return;

        const panelEl = panel.querySelector('div') || panel;

        const typeIcons = { attack: '⚔️', defense: '🛡️', buff: '✨', debuff: '💀', special: '⚡' };
        const cardType = CARD_TYPES || {};

        // Build recommended cards HTML
        let cardsHTML = '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:12px 0;">';
        result.cards.forEach(card => {
            const typeIcon = typeIcons[card.type] || '🃏';
            const tColor = (cardType[card.type] || {}).color || '#aaa';
            cardsHTML += `
                <div style="background:var(--bg-card);border:1px solid ${tColor};border-radius:4px;padding:8px;text-align:center;min-width:70px;flex:1 1 0;max-width:120px;">
                    <div style="font-size:16px;margin-bottom:4px;">${typeIcon}</div>
                    <div style="font-family:'Press Start 2P',monospace;font-size:5px;color:${tColor};margin-bottom:4px;word-break:break-word;">${card.name}</div>
                    <div style="font-size:7px;color:var(--text-dim);">${card.manaCost}💎</div>
                    <div style="font-size:7px;color:#ff6644;">${card.damage || card.value || '-'}</div>
                </div>
            `;
        });
        cardsHTML += '</div>';

        // Mana curve bar chart
        const manaCounts = {};
        result.cards.forEach(c => {
            const cost = c.manaCost || 2;
            manaCounts[cost] = (manaCounts[cost] || 0) + 1;
        });
        const maxManaCount = Math.max(...Object.values(manaCounts), 1);
        let manaHTML = '<div style="display:flex;gap:4px;align-items:flex-end;justify-content:center;height:50px;margin:8px 0;">';
        const manaCosts = Object.keys(manaCounts).sort((a, b) => a - b);
        manaCosts.forEach(cost => {
            const h = (manaCounts[cost] / maxManaCount) * 40;
            manaHTML += `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
                <div style="width:18px;height:${h}px;background:linear-gradient(180deg,#4488ff,#2244aa);border-radius:2px;"></div>
                <div style="font-size:6px;color:var(--text-dim);">${cost}💎</div>
            </div>`;
        });
        manaHTML += '</div>';

        // Synergy score
        const score = result.score || 0;
        const scoreColor = score >= 80 ? '#44ff88' : score >= 60 ? '#ffd700' : score >= 40 ? '#ff8844' : '#ff4444';

        panelEl.innerHTML = `
            <div style="background:linear-gradient(135deg,#0a0a2e,#141432);border:2px solid var(--gold-dark);border-radius:4px;padding:20px;max-width:380px;width:92%;animation:resultSlideIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275);max-height:85vh;overflow-y:auto;">
                <div style="font-family:'Press Start 2P',monospace;font-size:10px;color:var(--gold);text-align:center;margin-bottom:12px;">🤖 AI DECK BUILDER</div>

                <!-- Synergy Score -->
                <div style="text-align:center;margin-bottom:12px;">
                    <div style="font-size:28px;font-family:'Press Start 2P',monospace;color:${scoreColor};text-shadow:0 0 10px ${scoreColor}44;">${score}</div>
                    <div style="font-size:7px;color:var(--text-dim);margin-bottom:4px;">SYNERGY SCORE</div>
                    <div style="width:100%;height:6px;background:rgba(0,0,0,0.5);border-radius:4px;overflow:hidden;">
                        <div style="width:${score}%;height:100%;background:${scoreColor};border-radius:4px;transition:width 0.5s ease;"></div>
                    </div>
                </div>

                <!-- Recommended Cards -->
                <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:var(--gold);margin-bottom:4px;">📦 RECOMMENDED DECK</div>
                ${cardsHTML}

                <!-- Mana Curve -->
                <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:var(--gold);margin:8px 0 4px;">💎 MANA CURVE</div>
                ${manaHTML}

                <!-- Synergies -->
                ${result.synergies && result.synergies.length > 0 ? `
                    <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:var(--gold);margin:8px 0 4px;">🔗 SYNERGIES</div>
                    <div style="margin-bottom:8px;">
                        ${result.synergies.map(s => `<div style="font-size:7px;color:#44ff88;margin-bottom:2px;">✅ ${s.name} — ${s.description}</div>`).join('')}
                    </div>
                ` : ''}

                <!-- Reasoning -->
                <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:var(--gold);margin:8px 0 4px;">💡 REASONING</div>
                <div style="font-size:7px;color:var(--text-dim);line-height:1.6;margin-bottom:12px;">${result.reasoning || 'No reasoning available.'}</div>

                <!-- Buttons -->
                <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
                    <button class="btn btn-gold" onclick="UI.applyAIDeck(${JSON.stringify(result.cards.map(c => c.name)).replace(/"/g, '&quot;')})" style="font-size:7px;padding:8px 16px;">✅ Apply Deck</button>
                    <button onclick="this.closest('#ai-deck-builder-overlay').remove()" style="font-family:'Press Start 2P',monospace;font-size:7px;padding:8px 16px;background:rgba(255,255,255,0.08);color:var(--text-dim);border:1px solid rgba(255,255,255,0.15);border-radius:4px;cursor:pointer;">Close</button>
                </div>
            </div>
        `;
    },

    applyAIDeck(cardNames) {
        if (!cardNames || cardNames.length === 0) return;

        // Find card IDs in skill deck or SKILL_CARD_TEMPLATES
        const cardIds = [];
        cardNames.forEach(name => {
            const skillCard = SKILL_CARD_TEMPLATES.find(t => t.name === name);
            if (skillCard) {
                // Generate a unique ID if not present
                const id = skillCard.id || ('skill-' + name.toLowerCase().replace(/\s+/g, '-'));
                cardIds.push(id);
            }
        });

        if (cardIds.length > 0) {
            GameState.skillDeck = cardIds;
            this.toast('✅ AI deck applied! ' + cardNames.join(', '), 'success');
            this.renderStrategyScreen();
        } else {
            this.toast('Could not find skill cards to apply.', 'error');
        }

        // Close overlay
        const overlay = document.getElementById('ai-deck-builder-overlay');
        if (overlay) overlay.remove();
    },

    // ===== FEATURE 3: BATTLE COACH =====
    openBattleCoach(battleResult) {
        // battleResult: { isWin, turnNumber, player: {heroHp, heroMaxHp, ...}, enemy: {...} }
        // Or can be called without args — uses last battle data

        const overlay = document.createElement('div');
        overlay.id = 'battle-coach-overlay';
        overlay.style.cssText = `
            position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;
            display:flex;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.75);animation:s3FadeIn 0.2s ease;
        `;
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const coachPanel = document.createElement('div');
        coachPanel.style.cssText = `
            background:linear-gradient(135deg,#0a0a2e,#141432);border:2px solid var(--gold-dark);
            border-radius:4px;padding:20px;max-width:400px;width:92%;max-height:85vh;overflow-y:auto;
            animation:resultSlideIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
        `;

        overlay.appendChild(coachPanel);
        document.body.appendChild(overlay);

        // Run analysis
        let analysis = null;
        if (typeof AICoach !== 'undefined') {
            analysis = AICoach.analyzeBattle(
                battleResult ? battleResult.isWin : true,
                battleResult || { turnNumber: 5, player: { heroHp: 15, heroMaxHp: 20 }, enemy: { heroHp: 0, heroMaxHp: 30 } }
            );
        }

        if (!analysis) {
            analysis = {
                isWin: battleResult ? battleResult.isWin : true,
                turns: battleResult ? battleResult.turnNumber : 5,
                tips: [{ icon: '💡', text: 'Good battle! Keep practicing.', color: '#44ff88' }],
                recommendation: 'Try upgrading your cards and experimenting with different skill combinations.'
            };
        }

        this._renderCoachMessages(analysis, coachPanel);
    },

    _renderCoachMessages(analysis, container) {
        const messages = [];

        // Greeting
        if (analysis.isWin) {
            messages.push({ icon: '🏆', text: 'Great win!', color: '#44ff88', delay: 0 });
        } else {
            messages.push({ icon: '💪', text: "Don't worry, let's analyze...", color: '#ff8844', delay: 0 });
        }

        // Turns info
        messages.push({ icon: '⏱️', text: `Battle lasted ${analysis.turns || '?'} turns.`, color: '#aaa', delay: 300 });

        // Tips from analysis
        if (analysis.tips && analysis.tips.length > 0) {
            const tipText = analysis.tips.map(t => `${t.icon} ${t.text}`).join('\n');
            messages.push({ icon: '📋', text: tipText, color: '#44ccff', delay: 600 });
        }

        // HP info
        if (analysis.playerHPRemaining !== undefined) {
            const hpPct = Math.round((analysis.playerHPRemaining / analysis.playerHPMax) * 100);
            messages.push({
                icon: '❤️',
                text: `You finished with ${analysis.playerHPRemaining}/${analysis.playerHPMax} HP (${hpPct}%).`,
                color: hpPct > 50 ? '#44ff88' : hpPct > 25 ? '#ffd700' : '#ff4444',
                delay: 900
            });
        }

        // Energy usage tips
        if (analysis.isWin) {
            messages.push({ icon: '⚡', text: 'Energy management was solid this battle!', color: '#ffaa00', delay: 1200 });
        } else {
            messages.push({ icon: '⚡', text: 'Consider using lower-cost cards to maintain tempo.', color: '#ffaa00', delay: 1200 });
        }

        // Recommendation
        if (analysis.recommendation) {
            messages.push({ icon: '🎯', text: analysis.recommendation, color: '#ffd700', delay: 1500 });
        }

        // Final message
        messages.push({ icon: '🤖', text: 'Keep fighting, champion! Each battle makes you stronger.', color: '#44ff88', delay: 1800 });

        // Render messages one by one
        container.innerHTML = `
            <div style="font-family:'Press Start 2P',monospace;font-size:10px;color:var(--gold);text-align:center;margin-bottom:16px;">🤖 AI BATTLE COACH</div>
            <div id="coach-messages-list" style="display:flex;flex-direction:column;gap:8px;"></div>
            <div style="text-align:center;margin-top:16px;">
                <button onclick="this.closest('#battle-coach-overlay').remove()" style="font-family:'Press Start 2P',monospace;font-size:7px;padding:8px 16px;background:rgba(255,255,255,0.08);color:var(--text-dim);border:1px solid rgba(255,255,255,0.15);border-radius:4px;cursor:pointer;">Close</button>
            </div>
        `;

        const listEl = document.getElementById('coach-messages-list');

        messages.forEach((msg, i) => {
            setTimeout(() => {
                const bubble = document.createElement('div');
                bubble.style.cssText = `
                    display:flex;gap:8px;align-items:flex-start;
                    opacity:0;transform:translateY(8px);
                    transition:opacity 0.3s ease,transform 0.3s ease;
                `;

                // Avatar
                const avatar = document.createElement('div');
                avatar.style.cssText = 'font-size:18px;flex-shrink:0;';
                avatar.textContent = '🤖';

                // Message body
                const body = document.createElement('div');
                body.style.cssText = `
                    background:rgba(26,26,46,0.9);border:1px solid ${msg.color}33;
                    border-radius:4px;padding:8px 10px;flex:1;
                `;

                const label = document.createElement('div');
                label.style.cssText = `font-family:'Press Start 2P',monospace;font-size:6px;color:${msg.color};margin-bottom:4px;`;
                label.textContent = 'AI COACH';

                const text = document.createElement('div');
                text.style.cssText = `font-size:7px;color:var(--text);line-height:1.6;white-space:pre-line;`;
                text.textContent = msg.text;

                body.appendChild(label);
                body.appendChild(text);
                bubble.appendChild(avatar);
                bubble.appendChild(body);

                listEl.appendChild(bubble);

                // Animate in
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        bubble.style.opacity = '1';
                        bubble.style.transform = 'translateY(0)';
                    });
                });

                // Scroll to bottom
                listEl.scrollTop = listEl.scrollHeight;
            }, msg.delay);
        });
    },

    toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.style.whiteSpace = 'pre-line';
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    },

    // ===== DEMO MODE =====
    openDemo() {
        if (typeof DemoMode !== 'undefined') {
            DemoMode.start();
        }
    },
    closeDemo() {
        if (typeof DemoMode !== 'undefined') {
            DemoMode.stop();
        }
    },
};