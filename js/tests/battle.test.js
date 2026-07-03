/**
 * Pixel Raid — Battle Engine Tests
 * Run: node --test js/tests/battle.test.js
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock DOM
const sandbox = {
  document: { getElementById: () => null, createElement: () => ({ style: {} }) },
  window: {},
  console,
  setTimeout, clearTimeout, setInterval, clearInterval,
  Math, JSON, Array, Object, Number, String, Boolean, Error, Map, Set, Date,
};

// Load battle engine — replace const with var so it leaks to sandbox
const battleCode = fs.readFileSync(path.join(__dirname, '../systems/battle.js'), 'utf8')
  .replace('const BattleEngine', 'var BattleEngine');
vm.runInNewContext(battleCode, sandbox);
const BattleEngine = sandbox.BattleEngine;

describe('BattleEngine', () => {
  describe('init', () => {
    it('should have correct board config', () => {
      assert.strictEqual(BattleEngine.BOARD_SIZE, 5);
      assert.strictEqual(BattleEngine.MAX_HAND, 7);
      assert.strictEqual(BattleEngine.HERO_HP, 20);
    });

    it('should expose key methods', () => {
      assert.strictEqual(typeof BattleEngine.startBattle, 'function');
      assert.strictEqual(typeof BattleEngine._checkWinLose, 'function');
      assert.strictEqual(typeof BattleEngine._runAutoBattle, 'function');
      assert.strictEqual(typeof BattleEngine.getFieldState, 'function');
      assert.strictEqual(typeof BattleEngine.stop, 'function');
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

      BattleEngine.stop();
    });
  });

  describe('_checkWinLose', () => {
    it('should detect player win', () => {
      BattleEngine.player = { heroHp: 10 };
      BattleEngine.enemy = { heroHp: 0 };
      assert.strictEqual(BattleEngine._checkWinLose(), 'player');
    });

    it('should detect enemy win', () => {
      BattleEngine.player = { heroHp: 0 };
      BattleEngine.enemy = { heroHp: 10 };
      assert.strictEqual(BattleEngine._checkWinLose(), 'enemy');
    });

    it('should return null when game ongoing', () => {
      BattleEngine.player = { heroHp: 10, board: [null,null,null,null,null], hand: [{id:1}], deck: [{id:2}], energy: 0 };
      BattleEngine.enemy = { heroHp: 10, board: [null,null,null,null,null], hand: [{id:3}], deck: [{id:4}], energy: 0 };
      assert.strictEqual(BattleEngine._checkWinLose(), null);
    });
  });

  describe('getFieldState', () => {
    it('should return field state after start', () => {
      const playerDeck = [
        { id: 1, name: 'Warrior', class: 'warrior', rarity: 'common', stats: { hp: 100, atk: 10, def: 5, spd: 3, crit: 5 }, skill: { name: 'Slash', type: 'damage', val: 15 } },
      ];
      const enemyDeck = [
        { id: 2, name: 'Goblin', class: 'warrior', rarity: 'common', stats: { hp: 80, atk: 8, def: 3, spd: 4, crit: 3 }, skill: { name: 'Stab', type: 'damage', val: 12 } },
      ];

      BattleEngine.startBattle(playerDeck, enemyDeck);
      const state = BattleEngine.getFieldState();

      assert.ok(state);
      assert.ok(state.player);
      assert.ok(state.enemy);
      assert.ok(Array.isArray(state.player.board));
      assert.ok(Array.isArray(state.enemy.board));

      BattleEngine.stop();
    });
  });
});
