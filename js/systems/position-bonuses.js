/* ========================================
 * PIXEL RAID — Position Bonus System
 * Data-driven tactical slot bonuses
 * 5 slots: each has a unique tactical purpose
 * ======================================== */

const POSITION_BONUSES = [
    {
        slot: 0,
        name: 'Vanguard',
        icon: '⚔️',
        color: '#ff4444',
        bonus: { atkPercent: 10 },
        description: '+10% ATK',
        tooltip: 'Front-line warrior. +10% Attack.',
    },
    {
        slot: 1,
        name: 'Flank',
        icon: '🛡️',
        color: '#888888',
        bonus: {},
        description: 'No bonus',
        tooltip: 'Standard position. No bonuses.',
    },
    {
        slot: 2,
        name: 'Bulwark',
        icon: '🏰',
        color: '#4488ff',
        bonus: { defFlat: 15 },
        description: '+15 DEF',
        tooltip: 'Center bastion. +15 Defense.',
    },
    {
        slot: 3,
        name: 'Support',
        icon: '💚',
        color: '#44ff88',
        bonus: { hpPercent: 15 },
        description: '+15% HP',
        tooltip: 'Adjacent ally buffer. +15% Max HP.',
    },
    {
        slot: 4,
        name: 'Sniper',
        icon: '🎯',
        color: '#ffaa00',
        bonus: { spdFlat: 12 },
        description: '+12 SPD',
        tooltip: 'Back-row striker. +12 Speed.',
    },
];

/**
 * Get the bonus for a given slot index.
 * @param {number} slotIndex — 0..4
 * @returns {object|null} bonus config
 */
function getSlotBonus(slotIndex) {
    return POSITION_BONUSES[slotIndex] || null;
}

/**
 * Apply position bonuses to a unit placed on a given slot.
 * Modifies the unit in-place and returns a description string.
 * @param {object} unit — { atk, hp, maxHp, def, spd, ... }
 * @param {number} slotIndex — 0..4
 * @returns {string} e.g. "Vanguard +10% ATK"
 */
function applyPositionBonus(unit, slotIndex) {
    var config = POSITION_BONUSES[slotIndex];
    if (!config || !config.bonus) return '';

    var b = config.bonus;
    var parts = [];

    if (b.atkPercent) {
        unit.atk = Math.round(unit.atk * (1 + b.atkPercent / 100));
        parts.push('+' + b.atkPercent + '% ATK');
    }
    if (b.defFlat) {
        unit.def = (unit.def || 0) + b.defFlat;
        parts.push('+' + b.defFlat + ' DEF');
    }
    if (b.hpPercent) {
        var bonusHp = Math.round(unit.maxHp * (b.hpPercent / 100));
        unit.hp += bonusHp;
        unit.maxHp += bonusHp;
        parts.push('+' + b.hpPercent + '% HP');
    }
    if (b.spdFlat) {
        unit.spd = (unit.spd || 0) + b.spdFlat;
        parts.push('+' + b.spdFlat + ' SPD');
    }

    return parts.length > 0 ? config.icon + ' ' + config.name + ': ' + parts.join(', ') : '';
}

/**
 * Get all active position bonuses for a board (for display).
 * @param {Array} board — array of 5 units (or null)
 * @returns {Array} [{ slot, name, icon, color, description, applied }]
 */
function getBoardPositionSummary(board) {
    return POSITION_BONUSES.map(function (cfg, i) {
        var unit = board[i];
        return {
            slot: i,
            name: cfg.name,
            icon: cfg.icon,
            color: cfg.color,
            description: cfg.description,
            tooltip: cfg.tooltip,
            applied: !!unit,
        };
    });
}
