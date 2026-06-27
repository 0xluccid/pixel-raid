/* ========================================
 * PIXEL RAID — Tutorial System
 * Step-by-step onboarding for new players
 * ======================================== */

const Tutorial = {
    active: false,
    step: 0,
    overlay: null,
    highlightEl: null,

    STEPS: [
        {
            id: 'welcome',
            title: '⚔️ Welcome to Pixel Raid!',
            text: 'Collect hero cards, build your deck, and battle through stages!\n\nLet me show you around...',
            target: null,
            position: 'center',
        },
        {
            id: 'meet_heroes',
            title: '🃏 Your Starter Heroes',
            text: 'You got 3 heroes to start:\n\n🗡️ Iron Knight — Tanky warrior\n🔮 Fire Mage — AOE damage\n💚 Holy Priest — Healer\n\nThey\'re already in your deck!',
            target: null,
            position: 'center',
        },
        {
            id: 'nav_battle',
            title: '⚔️ Battle Screen',
            text: 'This is where you fight!\n\nPress "Start Battle" to fight enemies.\nWin all 3 waves to clear a stage and get rewards!',
            target: '#screen-battle',
            position: 'bottom',
        },
        {
            id: 'start_battle',
            title: '🎮 Try Your First Battle!',
            text: 'Press the button below to start fighting!\n\nYour heroes attack automatically. Watch the battle log for what happens.',
            target: '#btn-start-battle',
            position: 'top',
        },
        {
            id: 'nav_heroes',
            title: '🦸 Heroes Tab',
            text: 'Check your hero collection here.\n\nSee stats, rarity, and skills of each card.\nNew heroes unlock as you level up!',
            target: '[data-screen="heroes"]',
            position: 'bottom',
        },
        {
            id: 'nav_formation',
            title: '📐 Formation',
            text: 'Drag heroes to build your battle deck.\n\nYou can bring up to 5 heroes.\nBench heroes are reserves.\n\nTip: Mix tanks, DPS, and healers!',
            target: '[data-screen="formation"]',
            position: 'bottom',
        },
        {
            id: 'nav_inventory',
            title: '🎒 Inventory',
            text: 'Equip gear to make heroes stronger!\n\n⚔️ Weapons → ATK\n🛡️ Armor → DEF\n💍 Accessories → various buffs\n🧪 Consumables → one-time use',
            target: '[data-screen="inventory"]',
            position: 'bottom',
        },
        {
            id: 'nav_shop',
            title: '🏪 Card Shop',
            text: 'Buy card packs to get new heroes!\n\n📦 Basic Pack — 50g, 3 cards\n📦 Premium Pack — 150g, guaranteed rare\n📦 Elite Pack — 3 gems, boosted rates\n📦 Legendary Pack — 10 gems, guaranteed epic+',
            target: '[data-screen="shop"]',
            position: 'bottom',
        },
        {
            id: 'synergies',
            title: '🔗 Synergy System',
            text: 'Bring heroes of the same class for bonus effects!\n\n2x same class → class buff\n3x same class → stronger buff\nSpecial combos (e.g. Warrior + Mage) → unique bonuses!\n\nExperiment with different team compositions!',
            target: null,
            position: 'center',
        },
        {
            id: 'level_up',
            title: '📈 Level Up to Unlock',
            text: 'Win battles → earn EXP → level up!\n\nEach level unlocks new heroes and rewards:\n• Lv2: Berserker\n• Lv5: Druid + 3 Gems\n• Lv10: Beast Tamer + 5 Gems\n• Lv20: REAPER + 2000 Gold + 15 Gems\n\nLevel up to collect them all!',
            target: null,
            position: 'center',
        },
        {
            id: 'ready',
            title: '🚀 You\'re Ready!',
            text: 'That\'s everything you need to know!\n\nQuick tips:\n• Win stages to earn gold & cards\n• Open packs to expand collection\n• Equip gear to boost stats\n• Level up to unlock rare heroes\n• Build synergies for bonus power\n\nGood luck, Adventurer! ⚔️',
            target: null,
            position: 'center',
        },
    ],

    start() {
        if (GameState.stats.battlesWon > 0) return; // Skip if already played
        this.active = true;
        this.step = 0;
        this.showStep();
    },

    showStep() {
        const step = this.STEPS[this.step];
        if (!step) {
            this.end();
            return;
        }

        // Remove old overlay
        if (this.overlay) this.overlay.remove();
        if (this.highlightEl) {
            this.highlightEl.classList.remove('tutorial-highlight');
            this.highlightEl = null;
        }

        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';

        // Highlight target element
        let targetRect = null;
        if (step.target) {
            const el = document.querySelector(step.target);
            if (el) {
                el.classList.add('tutorial-highlight');
                this.highlightEl = el;
                targetRect = el.getBoundingClientRect();
                // Scroll into view
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // Position tooltip
        const isFirst = this.step === 0;
        const isLast = this.step === this.STEPS.length - 1;

        this.overlay.innerHTML = `
            <div class="tutorial-backdrop"></div>
            <div class="tutorial-tooltip ${step.position}">
                <div class="tutorial-step-count">Step ${this.step + 1}/${this.STEPS.length}</div>
                <div class="tutorial-title">${step.title}</div>
                <div class="tutorial-text">${step.text.replace(/\n/g, '<br>')}</div>
                <div class="tutorial-buttons">
                    ${this.step > 0 ? '<button class="btn tutorial-btn-back">← Back</button>' : ''}
                    ${isFirst ? '<button class="btn btn-gold tutorial-btn-next">Let\'s Go! →</button>' : ''}
                    ${!isFirst && !isLast ? '<button class="btn btn-gold tutorial-btn-next">Next →</button>' : ''}
                    ${isLast ? '<button class="btn btn-gold tutorial-btn-finish">⚔️ Start Playing!</button>' : ''}
                    ${!isLast ? '<button class="btn tutorial-btn-skip">Skip Tutorial</button>' : ''}
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        // Highlight ring on target
        if (targetRect) {
            const tooltip = this.overlay.querySelector('.tutorial-tooltip');
            const ring = document.createElement('div');
            ring.className = 'tutorial-ring';
            ring.style.top = (targetRect.top - 8) + 'px';
            ring.style.left = (targetRect.left - 8) + 'px';
            ring.style.width = (targetRect.width + 16) + 'px';
            ring.style.height = (targetRect.height + 16) + 'px';
            this.overlay.appendChild(ring);
        }

        // Bind buttons
        this.overlay.querySelector('.tutorial-btn-next')?.addEventListener('click', () => this.next());
        this.overlay.querySelector('.tutorial-btn-back')?.addEventListener('click', () => this.prev());
        this.overlay.querySelector('.tutorial-btn-finish')?.addEventListener('click', () => this.end());
        this.overlay.querySelector('.tutorial-btn-skip')?.addEventListener('click', () => this.end());

        // Animate in
        requestAnimationFrame(() => {
            this.overlay.classList.add('active');
        });
    },

    next() {
        this.step++;
        this.showStep();
    },

    prev() {
        if (this.step > 0) {
            this.step--;
            this.showStep();
        }
    },

    end() {
        this.active = false;
        if (this.overlay) {
            this.overlay.classList.add('fade-out');
            setTimeout(() => this.overlay?.remove(), 300);
        }
        if (this.highlightEl) {
            this.highlightEl.classList.remove('tutorial-highlight');
        }
        GameState.stats.tutorialDone = true;
        GameState.save();
    },
};
