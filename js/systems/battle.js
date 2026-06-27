/* ========================================
 * PIXEL RAID — Auto-Battle Engine
 * Turn-based card combat system
 * ======================================== */

const BattleEngine = {
    allyTeam: [],
    enemyTeam: [],
    turnOrder: [],
    currentTurn: 0,
    log: [],
    onComplete: null,
    battleTimer: null,
    isRunning: false,

    startBattle(allyCards, enemyCards, onComplete) {
        this.allyTeam = allyCards.map(c => ({
            ...c,
            stats: { ...c.stats },
            buffs: [],
            alive: true,
            shield: 0,
            dodgeBuff: 0,
            dotDmg: 0,
        }));
        this.enemyTeam = enemyCards.map(c => ({
            ...c,
            stats: { ...c.stats },
            buffs: [],
            alive: true,
            shield: 0,
            dodgeBuff: 0,
            dotDmg: 0,
        }));
        this.log = [];
        this.currentTurn = 0;
        this.onComplete = onComplete;
        this.isRunning = true;

        // Apply synergies to ally team
        this.applySynergies(this.allyTeam, GameState.getDeckCards());

        // Calculate turn order by SPD
        this.buildTurnOrder();
        
        // Log start
        this.addLog('⚔️ Battle Start!', 'info');
        this.addLog(`Your deck: ${this.allyTeam.map(c => c.name).join(', ')}`, 'info');
        this.addLog(`Enemy: ${this.enemyTeam.map(c => c.name).join(', ')}`, 'info');

        // Start turn loop
        this.runNextTurn();
    },

    applySynergies(team, deckCards) {
        const classCounts = {};
        for (const card of deckCards) {
            classCounts[card.class] = (classCounts[card.class] || 0) + 1;
        }

        // Class synergies
        for (const [cls, count] of Object.entries(classCounts)) {
            const syn = SYNERGIES[cls];
            if (syn) {
                const tier = count >= 3 ? 3 : count >= 2 ? 2 : 0;
                if (tier && syn[tier]) {
                    this.addLog(`🔗 ${syn[tier].desc}`, 'synergy');
                    for (const card of team) {
                        const s = syn[tier].stat;
                        if (card.stats[s] !== undefined) {
                            card.stats[s] = Math.floor(card.stats[s] * (1 + syn[tier].bonus));
                        }
                    }
                }
            }
        }

        // Cross-class combos
        const classSet = new Set(deckCards.map(c => c.class));
        for (const combo of COMBO_SYNERGIES) {
            if (combo.classes.every(c => classSet.has(c))) {
                this.addLog(`🔗 ${combo.desc}`, 'synergy');
                for (const card of team) {
                    for (const [stat, bonus] of Object.entries(combo.bonus)) {
                        if (card.stats[stat] !== undefined) {
                            card.stats[stat] = Math.floor(card.stats[stat] * (1 + bonus));
                        }
                    }
                }
            }
        }
    },

    buildTurnOrder() {
        const allUnits = [...this.allyTeam, ...this.enemyTeam].filter(u => u.alive);
        this.turnOrder = allUnits.sort((a, b) => b.stats.spd - a.stats.spd);
    },

    runNextTurn() {
        if (!this.isRunning) return;
        
        // Check win/lose
        const allyAlive = this.allyTeam.filter(c => c.alive);
        const enemyAlive = this.enemyTeam.filter(c => c.alive);

        if (enemyAlive.length === 0) {
            this.isRunning = false;
            this.addLog('🏆 Victory!', 'win');
            if (this.onComplete) this.onComplete('win', this.log, this.currentTurn);
            return;
        }
        if (allyAlive.length === 0) {
            this.isRunning = false;
            this.addLog('💀 Defeat!', 'lose');
            if (this.onComplete) this.onComplete('lose', this.log, this.currentTurn);
            return;
        }

        // Get current attacker
        const aliveUnits = [...this.allyTeam, ...this.enemyTeam].filter(u => u.alive);
        const sorted = aliveUnits.sort((a, b) => b.stats.spd - a.stats.spd);
        const attacker = sorted[this.currentTurn % sorted.length];

        if (!attacker || !attacker.alive) {
            this.currentTurn++;
            this.scheduleNextTurn();
            return;
        }

        // Apply DOT damage
        if (attacker.dotDmg > 0) {
            attacker.stats.hp -= attacker.dotDmg;
            this.addLog(`🟢 ${attacker.name} takes ${attacker.dotDmg} poison damage`, 'dmg');
            if (attacker.stats.hp <= 0) {
                attacker.alive = false;
                attacker.stats.hp = 0;
                this.addLog(`💀 ${attacker.name} died from poison!`, 'death');
                this.currentTurn++;
                this.scheduleNextTurn();
                return;
            }
        }

        // Determine target
        const isAlly = this.allyTeam.includes(attacker);
        const targets = isAlly ? this.enemyTeam.filter(c => c.alive) : this.allyTeam.filter(c => c.alive);
        const target = this.selectTarget(attacker, targets);

        if (!target) {
            this.currentTurn++;
            this.scheduleNextTurn();
            return;
        }

        // Execute attack
        this.executeAttack(attacker, target, isAlly);

        this.currentTurn++;
        
        // Prevent infinite battles (max 100 turns)
        if (this.currentTurn > 100) {
            this.isRunning = false;
            this.addLog('⏰ Time out! Draw!', 'lose');
            if (this.onComplete) this.onComplete('lose', this.log, this.currentTurn);
            return;
        }

        this.scheduleNextTurn();
    },

    scheduleNextTurn() {
        const delay = Math.floor(800 / GameState.battleSpeed);
        this.battleTimer = setTimeout(() => this.runNextTurn(), delay);
    },

    selectTarget(attacker, targets) {
        // Target lowest HP first (focus fire)
        return targets.reduce((best, t) => t.stats.hp < best.stats.hp ? t : best, targets[0]);
    },

    executeAttack(attacker, target, isAlly) {
        // Check dodge
        if (target.dodgeBuff > 0 && Math.random() < target.dodgeBuff) {
            this.addLog(`💨 ${target.name} dodged ${attacker.name}'s attack!`, 'info');
            return;
        }

        // Calculate damage
        let dmg = Math.max(1, attacker.stats.atk - Math.floor(target.stats.def * 0.5));
        
        // Check crit
        let isCrit = false;
        if (Math.random() * 100 < attacker.stats.crit) {
            dmg = Math.floor(dmg * 1.8);
            isCrit = true;
        }

        // Apply damage
        if (target.shield > 0) {
            const absorbed = Math.min(target.shield, dmg);
            target.shield -= absorbed;
            dmg -= absorbed;
            if (absorbed > 0) this.addLog(`🛡️ ${target.name}'s shield absorbed ${absorbed}`, 'info');
        }
        
        target.stats.hp = Math.max(0, target.stats.hp - dmg);
        
        const logClass = isCrit ? 'crit' : 'dmg';
        const critText = isCrit ? ' CRIT!' : '';
        this.addLog(`${isAlly ? '🟢' : '🔴'} ${attacker.name} → ${target.name} for ${dmg} dmg${critText}`, logClass);

        // Check death
        if (target.stats.hp <= 0) {
            target.alive = false;
            this.addLog(`💀 ${target.name} defeated!`, 'death');
        }

        // Trigger skill
        this.trySkill(attacker, target, isAlly);
    },

    trySkill(attacker, target, isAlly) {
        if (!attacker.skill || Math.random() > attacker.skill.chance) return;

        const skill = attacker.skill;
        const allies = isAlly ? this.allyTeam : this.enemyTeam;
        const enemies = isAlly ? this.enemyTeam : this.allyTeam;

        switch (skill.type) {
            case 'buff_def':
                attacker.stats.def = Math.floor(attacker.stats.def * (1 + skill.val));
                this.addLog(`✨ ${attacker.name} uses ${skill.name}! DEF up!`, 'info');
                break;
            case 'buff_atk':
                attacker.stats.atk = Math.floor(attacker.stats.atk * (1 + skill.val));
                this.addLog(`✨ ${attacker.name} uses ${skill.name}! ATK up!`, 'info');
                break;
            case 'shield':
                attacker.shield += skill.val;
                this.addLog(`✨ ${attacker.name} uses ${skill.name}! Shield ${skill.val}!`, 'info');
                break;
            case 'lifesteal': {
                const heal = Math.floor(attacker.stats.atk * skill.val);
                attacker.stats.hp = Math.min(attacker.stats.maxHp, attacker.stats.hp + heal);
                this.addLog(`✨ ${attacker.name} uses ${skill.name}! Heals ${heal}!`, 'heal');
                break;
            }
            case 'aoe': {
                const aoeDmg = Math.floor(attacker.stats.atk * skill.val);
                for (const e of enemies.filter(c => c.alive)) {
                    e.stats.hp = Math.max(0, e.stats.hp - aoeDmg);
                    if (e.stats.hp <= 0) { e.alive = false; this.addLog(`💀 ${e.name} defeated!`, 'death'); }
                }
                this.addLog(`✨ ${attacker.name} uses ${skill.name}! AOE ${aoeDmg} to all!`, 'dmg');
                break;
            }
            case 'heal': {
                const lowest = allies.filter(c => c.alive).reduce((b, c) => c.stats.hp < b.stats.hp ? c : b, allies[0]);
                if (lowest) {
                    const healAmt = Math.floor(lowest.stats.maxHp * skill.val);
                    lowest.stats.hp = Math.min(lowest.stats.maxHp, lowest.stats.hp + healAmt);
                    this.addLog(`✨ ${attacker.name} uses ${skill.name}! Heals ${lowest.name} for ${healAmt}!`, 'heal');
                }
                break;
            }
            case 'hot': {
                const lowest = allies.filter(c => c.alive).reduce((b, c) => c.stats.hp < b.stats.hp ? c : b, allies[0]);
                if (lowest) {
                    lowest.dotDmg = -Math.floor(lowest.stats.maxHp * skill.val); // negative = heal
                    this.addLog(`✨ ${attacker.name} uses ${skill.name}! ${lowest.name} regenerating!`, 'heal');
                }
                break;
            }
            case 'dot':
                target.dotDmg += skill.val;
                this.addLog(`✨ ${attacker.name} uses ${skill.name}! ${target.name} poisoned!`, 'dmg');
                break;
            case 'debuff_spd':
                target.stats.spd = Math.floor(target.stats.spd * (1 - skill.val));
                this.addLog(`✨ ${attacker.name} uses ${skill.name}! ${target.name} slowed!`, 'info');
                break;
            case 'stun':
                target.stats.spd = 0;
                this.addLog(`✨ ${attacker.name} uses ${skill.name}! ${target.name} stunned!`, 'info');
                break;
            case 'dodge_buff':
                attacker.dodgeBuff = skill.val;
                this.addLog(`✨ ${attacker.name} uses ${skill.name}! Evasion up!`, 'info');
                break;
            case 'crit_boost':
                // Already applied via damage calc
                this.addLog(`✨ ${attacker.name} uses ${skill.name}! Critical strike!`, 'crit');
                break;
            case 'true_dmg':
                target.stats.hp = Math.max(0, target.stats.hp - skill.val);
                this.addLog(`✨ ${attacker.name} uses ${skill.name}! ${skill.val} true damage!`, 'dmg');
                if (target.stats.hp <= 0) { target.alive = false; this.addLog(`💀 ${target.name} defeated!`, 'death'); }
                break;
            case 'execute':
                if (target.stats.hp < target.stats.maxHp * skill.val) {
                    target.stats.hp = 0;
                    target.alive = false;
                    this.addLog(`✨ ${attacker.name} uses ${skill.name}! ${target.name} executed!`, 'death');
                }
                break;
            case 'multi_hit':
                for (let i = 0; i < skill.val; i++) {
                    if (target.alive) {
                        const hitDmg = Math.max(1, Math.floor(attacker.stats.atk * 0.5));
                        target.stats.hp = Math.max(0, target.stats.hp - hitDmg);
                        if (target.stats.hp <= 0) { target.alive = false; this.addLog(`💀 ${target.name} defeated!`, 'death'); }
                    }
                }
                this.addLog(`✨ ${attacker.name} uses ${skill.name}! ${skill.val + 1} hits!`, 'dmg');
                break;
        }
    },

    addLog(text, type) {
        this.log.push({ text, type, turn: this.currentTurn });
        // Update UI
        const logEl = document.getElementById('battle-log');
        if (logEl) {
            const entry = document.createElement('div');
            entry.className = `log-entry log-${type || 'info'}`;
            entry.textContent = text;
            logEl.appendChild(entry);
            logEl.scrollTop = logEl.scrollHeight;
        }
        // Update canvas
        BattleRenderer.renderBattle(this.allyTeam, this.enemyTeam);
    },

    stop() {
        this.isRunning = false;
        if (this.battleTimer) clearTimeout(this.battleTimer);
    },
};
