/**
 * Hero Powers — Active abilities per hero class
 * Modular system: each hero has exactly one active ability
 */
const HeroPowers = {
    // Power definitions keyed by class
    POWERS: {
        warrior: {
            id: 'shield_wall',
            name: 'Shield Wall',
            icon: '🛡️',
            description: 'Restore 20% max HP',
            manaCost: 2,
            cooldown: 3,
            effect: (hero) => {
                const heal = Math.floor(hero.maxHp * 0.2);
                hero.hp = Math.min(hero.maxHp, hero.hp + heal);
                return { type: 'heal', value: heal, text: `+${heal} HP` };
            }
        },
        mage: {
            id: 'fireball',
            name: 'Fireball',
            icon: '🔥',
            description: 'Deal 30 damage to strongest enemy',
            manaCost: 3,
            cooldown: 4,
            effect: (hero, enemyBoard) => {
                let target = null;
                let maxHp = 0;
                for (const unit of enemyBoard) {
                    if (unit && unit.hp > maxHp) {
                        target = unit;
                        maxHp = unit.hp;
                    }
                }
                if (!target) return null;
                const dmg = 30;
                target.hp -= dmg;
                return { type: 'damage', value: dmg, target: target.name, text: `${dmg} dmg to ${target.name}` };
            }
        },
        assassin: {
            id: 'shadow_step',
            name: 'Shadow Step',
            icon: '🗡️',
            description: 'Draw 2 extra cards',
            manaCost: 2,
            cooldown: 3,
            effect: (hero, enemyBoard, player) => {
                if (!player || !player.deck) return null;
                let drawn = 0;
                for (let i = 0; i < 2; i++) {
                    if (player.deck.length > 0) {
                        player.hand.push(player.deck.shift());
                        drawn++;
                    }
                }
                return { type: 'draw', value: drawn, text: `Drew ${drawn} cards` };
            }
        },
        archer: {
            id: 'rain_of_arrows',
            name: 'Rain of Arrows',
            icon: '🏹',
            description: 'Deal 15 damage to all enemies',
            manaCost: 3,
            cooldown: 5,
            effect: (hero, enemyBoard) => {
                let hit = 0;
                for (const unit of enemyBoard) {
                    if (unit) {
                        unit.hp -= 15;
                        hit++;
                    }
                }
                return { type: 'aoe_damage', value: 15, targets: hit, text: `15 dmg × ${hit} enemies` };
            }
        },
        healer: {
            id: 'divine_light',
            name: 'Divine Light',
            icon: '✨',
            description: 'Restore all allies 10 HP',
            manaCost: 2,
            cooldown: 3,
            effect: (hero, enemyBoard, player) => {
                if (!player || !player.board) return null;
                let healed = 0;
                for (const unit of player.board) {
                    if (unit) {
                        unit.hp = Math.min(unit.maxHp || 100, unit.hp + 10);
                        healed++;
                    }
                }
                return { type: 'heal_all', value: 10, targets: healed, text: `+10 HP × ${healed} allies` };
            }
        }
    },

    // Cooldown tracker (persists across turns)
    _cooldowns: {},

    /**
     * Reset all cooldowns (call at battle start)
     */
    resetCooldowns() {
        this._cooldowns = {};
    },

    /**
     * Get power for a hero class
     */
    getPower(heroClass) {
        return this.POWERS[heroClass] || this.POWERS.warrior;
    },

    /**
     * Check if power is usable
     */
    canUse(heroClass, energy) {
        const power = this.getPower(heroClass);
        const cd = this._cooldowns[heroClass] || 0;
        return cd <= 0 && energy >= power.manaCost;
    },

    /**
     * Get current cooldown for display
     */
    getCooldown(heroClass) {
        return this._cooldowns[heroClass] || 0;
    },

    /**
     * Use the power
     */
    usePower(heroClass, hero, enemyBoard, player) {
        const power = this.getPower(heroClass);
        const cd = this._cooldowns[heroClass] || 0;
        if (cd > 0) return null;

        // Execute effect
        const result = power.effect(hero, enemyBoard, player);
        if (!result) return null;

        // Pay energy cost
        player.energy -= power.manaCost;

        // Set cooldown
        this._cooldowns[heroClass] = power.cooldown;

        // Reduce cooldowns for all classes
        for (const key in this._cooldowns) {
            if (this._cooldowns[key] > 0) this._cooldowns[key]--;
        }
        // Restore current class cooldown after reduction
        this._cooldowns[heroClass] = power.cooldown - 1;

        return { ...result, powerName: power.name, powerIcon: power.icon };
    },

    /**
     * Render hero power button
     */
    renderButton(heroClass, energy, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const power = this.getPower(heroClass);
        const cd = this.getCooldown(heroClass);
        const usable = this.canUse(heroClass, energy);

        const bgColor = usable ? 'rgba(255,215,0,0.15)' : 'rgba(100,100,100,0.1)';
        const borderColor = usable ? '#ffd700' : '#555';

        let cooldownBadge = '';
        if (cd > 0) {
            cooldownBadge = `<div class="power-cooldown">${cd}</div>`;
        }

        container.innerHTML = `
            <button class="hero-power-btn" id="hero-power-use"
                style="background:${bgColor};border-color:${borderColor};"
                ${usable ? '' : 'disabled'}>
                ${cooldownBadge}
                <span class="power-icon">${power.icon}</span>
                <span class="power-name">${power.name}</span>
                <span class="power-cost" style="color:${usable ? '#ffd700' : '#888'}">💎 ${power.manaCost}</span>
            </button>
        `;
    }
};
