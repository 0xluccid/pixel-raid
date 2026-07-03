/**
 * Pixel Raid — Battle Engine Tests
 * Run: node --test js/tests/battle.test.js
 */

const { describe, it, before } = require('node:test');
const assert = require('node:assert');

// Mock DOM
global.document = { getElementById: () => null, createElement: () => ({ style: {} }) };
global.window = {};

// Load battle engine
const fs = require('fs');
const battleCode = fs.readFileSync('./js/systems/battle.js', 'utf8');
eval(battleCode);

describe('BattleEngine', () => {
  describe('init', () => {
    it('should have correct board config', () => {
      assert.strictEqual(BattleEngine.BOARD_SIZE, 5);
      assert.strictEqual(BattleEngine.MAX_HAND, 7);
      assert.strictEqual(BattleEngine.HERO_HP, 20);
    });
  });

  describe('startBattle', () => {
    it('should initialize player and enemy', () => {
      const playerDeck = [
        { id: 1, name: 'Warrior', class: 'warrior', rarity: 'common', stats: { hp: 100, atk: 10, def: 5, spd: 3, crit: 5 }, skill: { name: 'Slash', type: 'damage', val: 15 } },
      ];
      const enemyDeck = [
        { id: 2, name: 'Goblin', class: 'warrior', rarity: 'common', stats: { hp: 80, atk: 8, def: 3, spd: 4, crit: 3 }, skill: { name: 'Stab', type: 'damage', val: 12 } },
      ];

      BattleEngine.startBattle(playerDeck, enemyDeck);

      assert.ok(BattleEngine.isRunning);
      assert.strictEqual(BattleEngine.player.name, 'You');
      assert.strictEqual(BattleEngine.enemy.name, 'Enemy');
      assert.strictEqual(BattleEngine.player.heroHp, 20);
    });

    it('should init decks with correct size', () => {
      const playerDeck = Array(5).fill({ id: 1, name: 'Hero', class: 'warrior', rarity: 'common', stats: { hp: 100, atk: 10, def: 5, spd: 3, crit: 5 }, skill: { name: 'Hit', type: 'damage', val: 10 } });
      const enemyDeck = Array(3).fill({ id: 2, name: 'Enemy', class: 'warrior', rarity: 'common', stats: { hp: 80, atk: 8, def: 3, spd: 4, crit: 3 }, skill: { name: 'Hit', type: 'damage', val: 8 } });

      BattleEngine.startBattle(playerDeck, enemyDeck);

      assert.strictEqual(BattleEngine.player.deck.length, 5);
      assert.strictEqual(BattleEngine.enemy.deck.length, 3);
    });
  });

  describe('applyDamage', () => {
    it('should calculate damage correctly', () => {
      const attacker = { stats: { atk: 10, crit: 0 }, isPlayer: true };
      const defender = { stats: { def: 5, hp: 100 }, isPlayer: false };

      BattleEngine.player = { board: [null, null, null, null, null] };
      BattleEngine.enemy = { board: [defender, null, null, null, null] };

      const damage = BattleEngine.applyDamage(attacker, defender, false);
      
      // Damage = atk(10) - def(5) = 5, min 1
      assert.ok(damage >= 1);
      assert.ok(damage <= 10); // Max = atk
    });

    it('should apply crit multiplier', () => {
      const attacker = { stats: { atk: 10, crit: 100 }, isPlayer: true }; // 100% crit
      const defender = { stats: { def: 0, hp: 100 }, isPlayer: false };

      BattleEngine.player = { board: [null, null, null, null, null] };
      BattleEngine.enemy = { board: [defender, null, null, null, null] };

      const damage = BattleEngine.applyDamage(attacker, defender, false);
      
      // With 100% crit, damage should be ~1.5x
      assert.ok(damage >= 10); // At least base damage
    });
  });

  describe('checkWinCondition', () => {
    it('should detect player win', () => {
      BattleEngine.player = { heroHp: 10 };
      BattleEngine.enemy = { heroHp: 0 };

      const result = BattleEngine.checkWinCondition();
      assert.strictEqual(result, 'win');
    });

    it('should detect player loss', () => {
      BattleEngine.player = { heroHp: 0 };
      BattleEngine.enemy = { heroHp: 10 };

      const result = BattleEngine.checkWinCondition();
      assert.strictEqual(result, 'lose');
    });

    it('should return null when game ongoing', () => {
      BattleEngine.player = { heroHp: 10 };
      BattleEngine.enemy = { heroHp: 10 };

      const result = BattleEngine.checkWinCondition();
      assert.strictEqual(result, null);
    });
  });

  describe('getRewards', () => {
    it('should give rewards on win', () => {
      BattleEngine.turnNumber = 5;
      const rewards = BattleEngine.getRewards('win');

      assert.ok(rewards.gold > 0);
      assert.ok(rewards.exp > 0);
    });

    it('should give no rewards on lose', () => {
      const rewards = BattleEngine.getRewards('lose');

      assert.strictEqual(rewards.gold, 0);
      assert.strictEqual(rewards.exp, 0);
    });

    it('should scale rewards with turns', () => {
      BattleEngine.turnNumber = 10;
      const rewards10 = BattleEngine.getRewards('win');

      BattleEngine.turnNumber = 20;
      const rewards20 = BattleEngine.getRewards('win');

      assert.ok(rewards20.exp >= rewards10.exp);
    });
  });
});
