/* ========================================
 * PIXEL RAID — Items & Equipment System
 * ======================================== */

const ITEM_TYPES = {
    weapon:    { emoji: '⚔️', slot: 'weapon' },
    armor:     { emoji: '🛡️', slot: 'armor' },
    accessory: { emoji: '💍', slot: 'accessory' },
    potion:    { emoji: '🧪', slot: 'consumable' },
};

const ITEM_TEMPLATES = [
    // Weapons
    { name: 'Rusty Sword',      type: 'weapon',    rarity: 'common',    stat: 'atk',  val: 3,  price: 10 },
    { name: 'Iron Blade',       type: 'weapon',    rarity: 'common',    stat: 'atk',  val: 5,  price: 25 },
    { name: 'Flame Sword',      type: 'weapon',    rarity: 'rare',      stat: 'atk',  val: 10, price: 80 },
    { name: 'Shadow Dagger',    type: 'weapon',    rarity: 'rare',      stat: 'crit', val: 8,  price: 90 },
    { name: 'Thunder Staff',    type: 'weapon',    rarity: 'epic',      stat: 'atk',  val: 18, price: 250 },
    { name: 'Excalibur',        type: 'weapon',    rarity: 'legendary', stat: 'atk',  val: 30, price: 800 },
    { name: 'Void Reaper',      type: 'weapon',    rarity: 'mythic',    stat: 'atk',  val: 50, price: 2000 },
    
    // Armor
    { name: 'Leather Vest',     type: 'armor',     rarity: 'common',    stat: 'def',  val: 3,  price: 10 },
    { name: 'Chain Mail',       type: 'armor',     rarity: 'common',    stat: 'def',  val: 6,  price: 30 },
    { name: 'Mithril Armor',    type: 'armor',     rarity: 'rare',      stat: 'def',  val: 12, price: 100 },
    { name: 'Dragon Scale',     type: 'armor',     rarity: 'epic',      stat: 'def',  val: 20, price: 300 },
    { name: 'Titan Plate',      type: 'armor',     rarity: 'legendary', stat: 'def',  val: 35, price: 900 },
    
    // Accessories
    { name: 'Speed Ring',       type: 'accessory', rarity: 'common',    stat: 'spd',  val: 3,  price: 15 },
    { name: 'Lucky Charm',      type: 'accessory', rarity: 'rare',      stat: 'crit', val: 10, price: 100 },
    { name: 'Amulet of Life',   type: 'accessory', rarity: 'epic',      stat: 'hp',   val: 30, price: 200 },
    { name: 'Phoenix Feather',  type: 'accessory', rarity: 'legendary', stat: 'hp',   val: 50, price: 600 },
    
    // Consumables (potions)
    { name: 'Small Potion',     type: 'potion',    rarity: 'common',    stat: 'heal', val: 30, price: 5 },
    { name: 'Medium Potion',    type: 'potion',    rarity: 'rare',      stat: 'heal', val: 80, price: 20 },
    { name: 'Large Potion',     type: 'potion',    rarity: 'epic',      stat: 'heal', val: 200, price: 60 },
];

let _nextItemId = 1;

function createItem(template) {
    return {
        id: _nextItemId++,
        name: template.name,
        type: template.type,
        rarity: template.rarity,
        stat: template.stat,
        val: template.val,
        price: template.price,
        equippedTo: null, // card id
    };
}

function generateRandomItem(maxRarity) {
    const rarityOrder = ['common', 'rare', 'epic', 'legendary', 'mythic'];
    const maxIdx = rarityOrder.indexOf(maxRarity || 'epic');
    const filtered = ITEM_TEMPLATES.filter(t => rarityOrder.indexOf(t.rarity) <= maxIdx);
    const tmpl = filtered[Math.floor(Math.random() * filtered.length)];
    return createItem(tmpl);
}
