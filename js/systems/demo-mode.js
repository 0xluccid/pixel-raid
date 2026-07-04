/* ==========================================
 * PIXEL RAID — Guided Demo Mode
 * ==========================================
 * Automated 3-minute walkthrough showcasing
 * all game features for hackathon judges.
 * ========================================== */

const DemoMode = {
    // State
    _active: false,
    _timeout: null,
    _intervals: [],
    _currentStep: 0,
    _totalSteps: 9,
    _overlay: null,

    // =========================================
    // START / STOP
    // =========================================

    /**
     * Start the guided demo from step 1
     */
    start() {
        if (this._active) return;
        this._active = true;
        this._currentStep = 0;

        // Create the demo overlay DOM
        this._createOverlay();
        // Update the demo button to show active state
        this._updateButtonState(true);
        // Start step 1
        this._runStep(0);
    },

    /**
     * Stop the demo and clean up everything
     */
    stop() {
        this._active = false;
        // Clear all pending timeouts
        clearTimeout(this._timeout);
        this._intervals.forEach(id => clearInterval(id));
        this._intervals = [];
        // Remove overlay
        this._destroyOverlay();
        // Remove any demo-specific overlays (victory, battle sim, etc.)
        document.querySelectorAll('.demo-victory-overlay').forEach(el => el.remove());
        document.querySelectorAll('.demo-battle-sim').forEach(el => el.remove());
        document.querySelectorAll('.demo-coach-overlay').forEach(el => el.remove());
        document.querySelectorAll('.demo-reward-overlay').forEach(el => el.remove());
        document.querySelectorAll('.demo-end-overlay').forEach(el => el.remove());
        document.querySelectorAll('.demo-splash').forEach(el => el.remove());
        // Reset button state
        this._updateButtonState(false);
    },

    // =========================================
    // OVERLAY CREATION
    // =========================================

    /**
     * Create the persistent demo overlay with narration and progress
     */
    _createOverlay() {
        if (this._overlay) this._overlay.remove();

        const overlay = document.createElement('div');
        overlay.id = 'demo-overlay';
        overlay.style.cssText = `
            position:fixed;top:0;left:0;right:0;bottom:0;z-index:999998;
            pointer-events:none;
            font-family:'Press Start 2P','Silkscreen',monospace;
        `;

        // Top bar: progress dots + skip button
        const topBar = document.createElement('div');
        topBar.style.cssText = `
            position:absolute;top:0;left:0;right:0;
            display:flex;align-items:center;justify-content:space-between;
            padding:12px 16px;
            background:linear-gradient(180deg,rgba(0,0,0,0.7) 0%,transparent 100%);
            z-index:10;
            pointer-events:auto;
        `;

        // Progress dots container
        const dotsContainer = document.createElement('div');
        dotsContainer.id = 'demo-progress-dots';
        dotsContainer.style.cssText = 'display:flex;gap:8px;align-items:center;';
        for (let i = 0; i < this._totalSteps; i++) {
            const dot = document.createElement('div');
            dot.className = 'demo-dot';
            dot.style.cssText = `
                width:10px;height:10px;border-radius:50%;
                background:${i === 0 ? 'var(--gold)' : 'rgba(255,255,255,0.25)'};
                border:2px solid ${i === 0 ? 'var(--gold)' : 'rgba(255,255,255,0.15)'};
                transition:all 0.3s ease;
                box-shadow:${i === 0 ? '0 0 8px rgba(255,215,0,0.5)' : 'none'};
            `;
            dotsContainer.appendChild(dot);
        }

        // Skip button
        const skipBtn = document.createElement('button');
        skipBtn.textContent = '✕ SKIP DEMO';
        skipBtn.style.cssText = `
            font-family:'Press Start 2P','Silkscreen',monospace;font-size:8px;
            padding:8px 14px;background:rgba(255,68,68,0.2);
            color:#ff6666;border:1px solid rgba(255,68,68,0.4);
            border-radius:4px;cursor:pointer;
            transition:all 0.2s ease;
            text-transform:uppercase;letter-spacing:1px;
        `;
        skipBtn.onmouseover = () => { skipBtn.style.background = 'rgba(255,68,68,0.4)'; };
        skipBtn.onmouseout = () => { skipBtn.style.background = 'rgba(255,68,68,0.2)'; };
        skipBtn.onclick = () => this.stop();

        topBar.appendChild(dotsContainer);
        topBar.appendChild(skipBtn);

        // Narration bar at bottom
        const narrBar = document.createElement('div');
        narrBar.id = 'demo-narration';
        narrBar.style.cssText = `
            position:absolute;bottom:0;left:0;right:0;
            padding:20px 24px 28px;
            background:linear-gradient(0deg,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.5) 60%,transparent 100%);
            z-index:10;pointer-events:none;
            text-align:center;min-height:80px;
        `;

        // Step label
        const stepLabel = document.createElement('div');
        stepLabel.id = 'demo-step-label';
        stepLabel.style.cssText = `
            font-size:7px;color:rgba(255,255,255,0.4);
            text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;
        `;

        // Narration text
        const narrText = document.createElement('div');
        narrText.id = 'demo-narr-text';
        narrText.style.cssText = `
            font-size:12px;color:var(--gold);
            line-height:1.8;min-height:30px;
            text-shadow:0 0 10px rgba(255,215,0,0.3);
            opacity:0;transition:opacity 0.4s ease;
        `;

        narrBar.appendChild(stepLabel);
        narrBar.appendChild(narrText);

        overlay.appendChild(topBar);
        overlay.appendChild(narrBar);
        document.body.appendChild(overlay);
        this._overlay = overlay;
    },

    /**
     * Remove the demo overlay
     */
    _destroyOverlay() {
        if (this._overlay) {
            this._overlay.remove();
            this._overlay = null;
        }
    },

    /**
     * Update the demo button active state
     */
    _updateButtonState(active) {
        const btn = document.getElementById('demo-mode-btn');
        if (!btn) return;
        if (active) {
            btn.style.background = 'rgba(255,215,0,0.2)';
            btn.style.color = '#ffd700';
            btn.style.borderColor = 'rgba(255,215,0,0.5)';
            btn.textContent = '⏹ STOP DEMO';
        } else {
            btn.style.background = '';
            btn.style.color = '';
            btn.style.borderColor = '';
            btn.textContent = '🎮 DEMO MODE';
        }
    },

    // =========================================
    // STEP MANAGEMENT
    // =========================================

    /**
     * Update the progress dots to reflect current step
     */
    _updateProgress(step) {
        const dots = document.querySelectorAll('#demo-progress-dots .demo-dot');
        dots.forEach((dot, i) => {
            if (i < step) {
                // Completed
                dot.style.background = '#44ff88';
                dot.style.borderColor = '#44ff88';
                dot.style.boxShadow = '0 0 6px rgba(68,255,136,0.4)';
            } else if (i === step) {
                // Current
                dot.style.background = 'var(--gold)';
                dot.style.borderColor = 'var(--gold)';
                dot.style.boxShadow = '0 0 8px rgba(255,215,0,0.5)';
            } else {
                // Future
                dot.style.background = 'rgba(255,255,255,0.25)';
                dot.style.borderColor = 'rgba(255,255,255,0.15)';
                dot.style.boxShadow = 'none';
            }
        });
    },

    /**
     * Show narration text with typewriter effect
     * @param {string} text - Text to display
     * @param {string} label - Optional step label
     */
    _showNarration(text, label) {
        const stepLabel = document.getElementById('demo-step-label');
        const narrText = document.getElementById('demo-narr-text');
        if (!narrText) return;

        if (stepLabel && label) {
            stepLabel.textContent = label;
        }

        // Fade out, then type in
        narrText.style.opacity = '0';
        setTimeout(() => {
            narrText.textContent = '';
            narrText.style.opacity = '1';
            let i = 0;
            const typeInterval = setInterval(() => {
                if (!this._active || i >= text.length) {
                    clearInterval(typeInterval);
                    return;
                }
                narrText.textContent += text[i];
                i++;
            }, 25);
            this._intervals.push(typeInterval);
        }, 300);
    },

    /**
     * Schedule the next step after a delay
     */
    _delay(durationMs) {
        return new Promise(resolve => {
            this._timeout = setTimeout(() => {
                if (this._active) resolve();
            }, durationMs);
        });
    },

    /**
     * Run a demo step by index
     */
    async _runStep(stepIndex) {
        if (!this._active) return;
        this._currentStep = stepIndex;
        this._updateProgress(stepIndex);

        switch (stepIndex) {
            case 0: await this._step1_splash(); break;
            case 1: await this._step2_collection(); break;
            case 2: await this._step3_aiDeckBuilder(); break;
            case 3: await this._step4_deckPreview(); break;
            case 4: await this._step5_battle(); break;
            case 5: await this._step6_victory(); break;
            case 6: await this._step7_coach(); break;
            case 7: await this._step8_rewards(); break;
            case 8: await this._step9_final(); break;
            default: this.stop(); return;
        }
    },

    // =========================================
    // STEP IMPLEMENTATIONS
    // =========================================

    /**
     * Step 1: Splash Screen (3s)
     * Show game logo and tagline on dark overlay
     */
    async _step1_splash() {
        // Create splash overlay
        const splash = document.createElement('div');
        splash.className = 'demo-splash';
        splash.style.cssText = `
            position:fixed;top:0;left:0;right:0;bottom:0;z-index:999999;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            background:radial-gradient(ellipse at center,#0a0a2e 0%,#000 100%);
            font-family:'Press Start 2P','Silkscreen',monospace;
            animation:demoFadeIn 0.5s ease;
            pointer-events:auto;
        `;
        splash.innerHTML = `
            <div style="font-size:28px;color:#ffd700;text-shadow:0 0 30px rgba(255,215,0,0.5),0 4px 0 #b8860b;margin-bottom:20px;letter-spacing:4px;">
                PIXEL RAID
            </div>
            <div style="font-size:10px;color:#44ff88;margin-bottom:12px;text-shadow:0 0 8px rgba(68,255,136,0.3);">
                AI-Powered Card Battle Strategy
            </div>
            <div style="font-size:7px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">
                Guided Demo — Hackathon Edition
            </div>
            <div style="margin-top:40px;width:200px;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;">
                <div id="demo-splash-bar" style="width:0%;height:100%;background:#ffd700;border-radius:2px;transition:width 2.5s linear;"></div>
            </div>
        `;
        document.body.appendChild(splash);

        // Animate progress bar
        requestAnimationFrame(() => {
            const bar = document.getElementById('demo-splash-bar');
            if (bar) bar.style.width = '100%';
        });

        // Wait 3 seconds then fade out
        await this._delay(3000);
        if (!this._active) return;

        // Fade out splash
        splash.style.transition = 'opacity 0.5s ease';
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 500);

        // Move to step 2
        this._runStep(1);
    },

    /**
     * Step 2: Collection Screen (15s)
     * Switch to heroes, show collection with rarity highlights
     */
    async _step2_collection() {
        // Switch to heroes screen
        UI.showScreen('heroes');
        this._showNarration('Build your collection of unique heroes', 'Step 2 · Collection');

        // Auto-scroll through the collection after a short delay
        await this._delay(1000);
        if (!this._active) return;

        // Scroll the collection grid
        const heroesScreen = document.getElementById('screen-heroes');
        if (heroesScreen) {
            // Find scrollable container or the screen itself
            const scrollTarget = heroesScreen.querySelector('.collection-grid') || heroesScreen;

            // Smooth scroll down then back up
            let scrollDir = 1;
            let scrollPos = 0;
            const maxScroll = scrollTarget.scrollHeight - scrollTarget.clientHeight;
            const scrollInterval = setInterval(() => {
                if (!this._active) { clearInterval(scrollInterval); return; }
                scrollPos += scrollDir * 1.5;
                if (scrollPos >= maxScroll && scrollDir > 0) { scrollDir = -1; }
                if (scrollPos <= 0 && scrollDir < 0) { scrollDir = 1; }
                scrollTarget.scrollTop = Math.max(0, scrollPos);
            }, 20);
            this._intervals.push(scrollInterval);
        }

        // After 3s, highlight some cards with rarity glows
        await this._delay(3000);
        if (!this._active) return;

        // Add rarity glow effects to some card elements
        this._highlightRarityCards();

        // Show collection progress bar overlay
        this._showCollectionProgress();

        // Wait remaining time
        await this._delay(10000);
        if (!this._active) return;

        // Move to step 3
        this._runStep(2);
    },

    /**
     * Highlight some cards with rarity-colored glow
     */
    _highlightRarityCards() {
        // Find card elements in the heroes screen
        const cards = document.querySelectorAll('#screen-heroes .collection-card, #screen-heroes [class*="card"]');
        if (cards.length === 0) return;

        // Add glow to first few cards
        const glows = [
            { color: 'rgba(255,170,0,0.5)', shadow: '0 0 20px rgba(255,170,0,0.6)' },   // Legendary orange
            { color: 'rgba(255,50,50,0.5)', shadow: '0 0 25px rgba(255,50,50,0.6)' },     // Mythic red
            { color: 'rgba(255,215,0,0.4)', shadow: '0 0 15px rgba(255,215,0,0.5)', },     // Gold
        ];

        let count = 0;
        cards.forEach(card => {
            if (count >= glows.length) return;
            card.style.transition = 'box-shadow 0.5s ease, transform 0.3s ease';
            card.style.boxShadow = glows[count].shadow;
            card.style.transform = 'scale(1.05)';
            // Remove glow after a while
            setTimeout(() => {
                if (card.parentNode) {
                    card.style.boxShadow = '';
                    card.style.transform = '';
                }
            }, 8000);
            count++;
        });
    },

    /**
     * Show a collection progress bar overlay
     */
    _showCollectionProgress() {
        const existing = document.getElementById('collection-progress-bar');
        if (existing) {
            existing.style.transition = 'opacity 0.5s ease';
            existing.style.opacity = '1';
            // Animate the bar fill
            const fills = existing.querySelectorAll('[style*="width"]');
            fills.forEach(f => {
                f.style.transition = 'width 2s ease';
                f.style.width = '75%';
            });
        }
    },

    /**
     * Step 3: AI Deck Builder (20s)
     * Switch to strategy, open AI Deck Builder, show loading animation
     */
    async _step3_aiDeckBuilder() {
        // Switch to formation/strategy screen
        UI.showScreen('formation');
        this._showNarration('AI analyzes your collection and recommends the best deck', 'Step 3 · AI Deck Builder');

        await this._delay(2000);
        if (!this._active) return;

        // Auto-click the AI Deck Builder button
        UI.openAIDeckBuilder();

        // Wait for the loading animation to complete (it runs ~2.5s internally)
        await this._delay(5000);
        if (!this._active) return;

        // If the overlay is showing, highlight synergy score
        const overlay = document.getElementById('ai-deck-builder-overlay');
        if (overlay) {
            // The overlay should already show the result at this point
            // Just wait for the user to read it
        }

        await this._delay(13000);
        if (!this._active) return;

        // Close AI Deck Builder overlay if still open
        if (overlay && overlay.parentNode) {
            overlay.style.transition = 'opacity 0.3s ease';
            overlay.style.opacity = '0';
            setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 300);
        }

        // Move to step 4
        this._runStep(3);
    },

    /**
     * Step 4: Deck Preview (10s)
     * Show the recommended cards with highlights
     */
    async _step4_deckPreview() {
        this._showNarration('Your optimized 4-card deck is ready', 'Step 4 · Deck Preview');

        // Find and highlight skill deck cards on the strategy screen
        await this._delay(1000);
        if (!this._active) return;

        const strategyContent = document.getElementById('strategy-content');
        if (strategyContent) {
            // Find skill deck cards
            const skillCards = strategyContent.querySelectorAll('.strategy-skill-card');
            let cardIndex = 0;

            // Highlight each card one by one
            const highlightInterval = setInterval(() => {
                if (!this._active || cardIndex >= skillCards.length || cardIndex >= 4) {
                    clearInterval(highlightInterval);
                    return;
                }
                // Reset all
                skillCards.forEach(sc => {
                    sc.style.boxShadow = '';
                    sc.style.transform = '';
                    sc.style.border = '';
                });
                // Highlight current
                const card = skillCards[cardIndex];
                card.style.transition = 'all 0.3s ease';
                card.style.boxShadow = '0 0 20px rgba(255,215,0,0.5)';
                card.style.transform = 'scale(1.08)';
                card.style.border = '2px solid var(--gold)';
                cardIndex++;
            }, 2000);
            this._intervals.push(highlightInterval);
        }

        await this._delay(10000);
        if (!this._active) return;

        this._runStep(4);
    },

    /**
     * Step 5: Battle (30s) — MOST IMPORTANT
     * Uses the REAL battle system: startBattle → auto-play card → advancePhase
     */
    async _step5_battle() {
        this._showNarration('Watch your deck in action', 'Step 5 · Battle');

        // Check if player has cards in deck
        const deckCards = GameState.getDeckCards();
        if (deckCards.length === 0) {
            // Fallback: go to step 6 if no deck
            this._runStep(5);
            return;
        }

        await this._delay(800);
        if (!this._active) return;

        // Start the REAL battle (renders Phaser canvas + card hand)
        UI.startBattle();

        // Wait for battle to initialize and reach play phase
        await this._delay(2000);
        if (!this._active) return;

        // Auto-play first card from hand to first empty board slot
        if (typeof BattleEngine !== 'undefined' && BattleEngine.isRunning) {
            const hand = BattleEngine.player.hand;
            const board = BattleEngine.player.board;
            if (hand.length > 0 && BattleEngine.currentPhase === 'play') {
                // Find first empty slot
                let emptySlot = -1;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === null) { emptySlot = i; break; }
                }
                if (emptySlot >= 0) {
                    BattleEngine.playCard(0, emptySlot);
                    // Re-render hand
                    if (typeof CardHand !== 'undefined') {
                        CardHand.renderHand(BattleEngine.player.hand, BattleEngine.player.energy);
                    }
                }
            }
        }

        await this._delay(1500);
        if (!this._active) return;

        // Advance through arrange → battle
        if (typeof BattleEngine !== 'undefined' && BattleEngine.isRunning) {
            BattleEngine.advancePhase(); // play → arrange
            await this._delay(800);
            if (!this._active) return;
            BattleEngine.advancePhase(); // arrange → battle
        }

        // Wait for battle to resolve (auto-battle runs internally)
        // Poll until battle ends or timeout at 20s
        let waited = 0;
        while (waited < 20000) {
            if (!this._active) return;
            if (typeof BattleEngine !== 'undefined' && !BattleEngine.isRunning) break;
            await this._delay(500);
            waited += 500;
        }

        // Extra delay for result screen to appear
        await this._delay(2000);
        if (!this._active) return;

        // Move to step 6 (Victory)
        this._runStep(5);
    },

    /**
     * Step 6: Victory Screen (5s)
     * Show victory overlay with gold/XP earned
     */
    async _step6_victory() {
        // Remove battle sim overlays
        document.querySelectorAll('.demo-battle-sim').forEach(el => el.remove());

        // Create victory overlay
        const victory = document.createElement('div');
        victory.className = 'demo-victory-overlay';
        victory.style.cssText = `
            position:fixed;top:0;left:0;right:0;bottom:0;z-index:999997;
            display:flex;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.8);
            font-family:'Press Start 2P','Silkscreen',monospace;
            animation:demoFadeIn 0.5s ease;
            pointer-events:none;
        `;
        victory.innerHTML = `
            <div style="text-align:center;">
                <div style="
                    font-size:32px;color:#ffd700;
                    text-shadow:0 0 40px rgba(255,215,0,0.5);
                    margin-bottom:20px;
                    animation:demoPulseIn 0.8s ease;
                ">🏆 VICTORY!</div>
                <div style="
                    font-size:10px;color:#44ff88;margin-bottom:10px;
                    animation:demoFadeIn 0.5s ease 0.3s both;
                ">💰 +500 Gold &nbsp;&nbsp; ⚡ +200 XP</div>
                <div style="
                    font-size:9px;color:#ffd700;margin-top:20px;
                    animation:demoFadeIn 0.5s ease 0.6s both;
                ">🃏 New Card Unlocked!</div>
                <div style="
                    margin-top:16px;width:120px;height:150px;
                    background:linear-gradient(135deg,#1a1a4e,#0a0a2e);
                    border:2px solid #ffd700;border-radius:8px;
                    display:flex;flex-direction:column;align-items:center;justify-content:center;
                    margin-left:auto;margin-right:auto;
                    animation:demoCardReveal 0.8s ease 1s both;
                    box-shadow:0 0 30px rgba(255,215,0,0.3);
                ">
                    <div style="font-size:32px;margin-bottom:8px;">⚔️</div>
                    <div style="font-size:7px;color:#ffd700;">Phoenix Blade</div>
                    <div style="font-size:6px;color:#ff8844;margin-top:4px;">Legendary</div>
                </div>
            </div>
        `;
        document.body.appendChild(victory);

        this._showNarration('Victory! Earn rewards and grow your collection', 'Step 6 · Victory');

        await this._delay(5000);
        if (!this._active) return;

        // Fade out victory
        victory.style.transition = 'opacity 0.4s ease';
        victory.style.opacity = '0';
        setTimeout(() => victory.remove(), 400);

        // Move to step 7
        this._runStep(6);
    },

    /**
     * Step 7: AI Battle Coach (20s)
     * Show the AI Coach with chat messages appearing one by one
     */
    async _step7_coach() {
        this._showNarration('AI Coach provides personalized post-battle analysis', 'Step 7 · AI Coach');

        // Create a custom coach overlay (since we may not have real battle data)
        const coachOverlay = document.createElement('div');
        coachOverlay.className = 'demo-coach-overlay';
        coachOverlay.style.cssText = `
            position:fixed;top:0;left:0;right:0;bottom:0;z-index:999997;
            display:flex;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.8);
            font-family:'Press Start 2P','Silkscreen',monospace;
            animation:demoFadeIn 0.3s ease;
            pointer-events:none;
        `;

        const coachPanel = document.createElement('div');
        coachPanel.style.cssText = `
            background:linear-gradient(135deg,#0a0a2e,#141432);
            border:2px solid #ffd700;border-radius:8px;
            padding:20px;max-width:420px;width:92%;max-height:80vh;overflow-y:auto;
            animation:demoPulseIn 0.5s ease;
        `;

        coachOverlay.appendChild(coachPanel);
        document.body.appendChild(coachOverlay);

        // Render coach header
        coachPanel.innerHTML = `
            <div style="font-size:10px;color:#ffd700;text-align:center;margin-bottom:16px;">
                🤖 AI BATTLE COACH
            </div>
            <div id="demo-coach-messages" style="display:flex;flex-direction:column;gap:10px;"></div>
        `;

        const messages = [
            { icon: '🏆', text: 'Great battle! Let me analyze your performance...', color: '#44ff88', delay: 500 },
            { icon: '✅', text: 'Strong frontline positioning', color: '#44ff88', delay: 2500 },
            { icon: '✅', text: 'Efficient energy usage', color: '#44ff88', delay: 4500 },
            { icon: '💡', text: 'Consider upgrading your healer for longer battles', color: '#ffd700', delay: 6500 },
        ];

        const container = document.getElementById('demo-coach-messages');

        messages.forEach((msg) => {
            setTimeout(() => {
                if (!this._active || !container) return;
                const bubble = document.createElement('div');
                bubble.style.cssText = `
                    display:flex;gap:10px;align-items:flex-start;
                    opacity:0;transform:translateY(10px);
                    transition:opacity 0.4s ease,transform 0.4s ease;
                `;
                bubble.innerHTML = `
                    <div style="font-size:20px;flex-shrink:0;">${msg.icon}</div>
                    <div style="
                        background:rgba(26,26,46,0.9);border:1px solid ${msg.color}33;
                        border-radius:6px;padding:10px 14px;flex:1;
                    ">
                        <div style="font-size:6px;color:${msg.color};margin-bottom:6px;text-transform:uppercase;">AI Coach</div>
                        <div style="font-size:8px;color:var(--text);line-height:1.7;">${msg.text}</div>
                    </div>
                `;
                container.appendChild(bubble);
                // Animate in
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        bubble.style.opacity = '1';
                        bubble.style.transform = 'translateY(0)';
                    });
                });
                container.scrollTop = container.scrollHeight;
            }, msg.delay);
        });

        // Wait for all messages to appear plus reading time
        await this._delay(20000);
        if (!this._active) return;

        // Fade out coach overlay
        coachOverlay.style.transition = 'opacity 0.4s ease';
        coachOverlay.style.opacity = '0';
        setTimeout(() => coachOverlay.remove(), 400);

        // Move to step 8
        this._runStep(7);
    },

    /**
     * Step 8: Reward (10s)
     * Show reward collection with counting-up animation
     */
    async _step8_rewards() {
        this._showNarration('Every battle makes your deck stronger', 'Step 8 · Rewards');

        const rewardOverlay = document.createElement('div');
        rewardOverlay.className = 'demo-reward-overlay';
        rewardOverlay.style.cssText = `
            position:fixed;top:0;left:0;right:0;bottom:0;z-index:999997;
            display:flex;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.8);
            font-family:'Press Start 2P','Silkscreen',monospace;
            animation:demoFadeIn 0.4s ease;
            pointer-events:none;
        `;

        rewardOverlay.innerHTML = `
            <div style="text-align:center;">
                <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-bottom:20px;letter-spacing:2px;">REWARDS EARNED</div>

                <!-- Gold -->
                <div style="margin-bottom:24px;animation:demoFadeIn 0.5s ease 0.2s both;">
                    <div style="font-size:24px;margin-bottom:8px;">💰</div>
                    <div style="font-size:20px;color:#ffd700;" id="demo-reward-gold">0</div>
                    <div style="font-size:7px;color:rgba(255,255,255,0.4);margin-top:4px;">GOLD</div>
                </div>

                <!-- XP -->
                <div style="margin-bottom:24px;animation:demoFadeIn 0.5s ease 0.6s both;">
                    <div style="font-size:24px;margin-bottom:8px;">⚡</div>
                    <div style="font-size:20px;color:#44ff88;" id="demo-reward-xp">0</div>
                    <div style="font-size:7px;color:rgba(255,255,255,0.4);margin-top:4px;">EXPERIENCE</div>
                </div>

                <!-- New Card -->
                <div style="animation:demoFadeIn 0.5s ease 1s both;">
                    <div style="font-size:24px;margin-bottom:8px;">🃏</div>
                    <div style="font-size:9px;color:#ffd700;">New Card!</div>
                    <div style="font-size:7px;color:#ff8844;margin-top:4px;">Phoenix Blade ★★★★★</div>
                </div>
            </div>
        `;
        document.body.appendChild(rewardOverlay);

        // Animate gold counting up
        await this._delay(500);
        this._countUp('demo-reward-gold', 0, 500, 1500, '#ffd700');

        // Animate XP counting up
        await this._delay(500);
        this._countUp('demo-reward-xp', 0, 200, 1500, '#44ff88');

        await this._delay(9000);
        if (!this._active) return;

        // Fade out
        rewardOverlay.style.transition = 'opacity 0.4s ease';
        rewardOverlay.style.opacity = '0';
        setTimeout(() => rewardOverlay.remove(), 400);

        // Move to step 9
        this._runStep(8);
    },

    /**
     * Count up a number from start to end over durationMs
     */
    _countUp(elementId, start, end, durationMs, color) {
        const el = document.getElementById(elementId);
        if (!el) return;
        const startTime = performance.now();
        const animate = (now) => {
            if (!this._active) return;
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * eased);
            el.textContent = '+' + current;
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    },

    /**
     * Step 9: Collection Updated (10s) — FINAL
     * Show updated collection, final CTA
     */
    async _step9_final() {
        // Switch back to heroes
        UI.showScreen('heroes');
        this._showNarration('Your collection grows with every victory', 'Step 9 · Your Collection');

        await this._delay(5000);
        if (!this._active) return;

        // Show final CTA overlay
        const finalOverlay = document.createElement('div');
        finalOverlay.className = 'demo-end-overlay';
        finalOverlay.style.cssText = `
            position:fixed;top:0;left:0;right:0;bottom:0;z-index:999997;
            display:flex;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.85);
            font-family:'Press Start 2P','Silkscreen',monospace;
            animation:demoFadeIn 0.5s ease;
            pointer-events:auto;
        `;
        finalOverlay.innerHTML = `
            <div style="text-align:center;padding:20px;">
                <div style="
                    font-size:18px;color:#ffd700;
                    text-shadow:0 0 20px rgba(255,215,0,0.4);
                    margin-bottom:16px;line-height:1.8;
                ">Ready to build YOUR<br>ultimate deck?</div>
                <div style="
                    font-size:8px;color:rgba(255,255,255,0.5);margin-bottom:24px;
                    line-height:1.6;
                ">Start playing now and discover<br>the power of AI-driven strategy</div>
                <button onclick="DemoMode.stop()" style="
                    font-family:'Press Start 2P','Silkscreen',monospace;
                    font-size:10px;padding:14px 28px;
                    background:linear-gradient(180deg,#ffd700,#cc8800);
                    color:#000;border:none;border-radius:6px;
                    cursor:pointer;transition:all 0.2s ease;
                    box-shadow:0 0 20px rgba(255,215,0,0.3);
                    animation:demoPulseIn 0.6s ease;
                    text-transform:uppercase;letter-spacing:2px;
                " onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 0 30px rgba(255,215,0,0.5)'"
                   onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 0 20px rgba(255,215,0,0.3)'"
                >🎮 Play Now</button>
            </div>
        `;
        document.body.appendChild(finalOverlay);

        // Wait for user to click or 5s auto-advance
        await this._delay(10000);

        // Stop demo
        this.stop();
    },
};

// =========================================
// CSS ANIMATIONS (injected once)
// =========================================

// ESC key to stop demo
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && typeof DemoMode !== 'undefined' && DemoMode._active) {
        DemoMode.stop();
    }
});

(function injectDemoStyles() {
    if (document.getElementById('demo-styles')) return;
    const style = document.createElement('style');
    style.id = 'demo-styles';
    style.textContent = `
        /* Demo mode animations */
        @keyframes demoFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes demoPulseIn {
            0% { opacity: 0; transform: scale(0.5); }
            60% { transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
        }

        @keyframes demoShake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
        }

        @keyframes demoDamageFloat {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            30% { transform: translateY(-20px) scale(1.2); }
            100% { opacity: 0; transform: translateY(-60px) scale(0.8); }
        }

        @keyframes demoCardReveal {
            0% { opacity: 0; transform: rotateY(90deg) scale(0.5); }
            60% { transform: rotateY(-10deg) scale(1.05); }
            100% { opacity: 1; transform: rotateY(0) scale(1); }
        }
    `;
    document.head.appendChild(style);
})();
