/* ========================================
 * BattlePhaser — Integration Bridge
 * Hero-as-Entity Edition (v5)
 * Connects vanilla battle.js with Phaser rendering
 * ======================================== */

var BattlePhaser = {
    // ===== STATE =====
    _game: null,
    _scene: null,
    _containerId: null,
    _active: false,
    _transitioning: false,

    // ===== INIT =====
    init: function (containerId) {
        this._containerId = containerId || 'battle-canvas-container';

        var container = document.getElementById(this._containerId);
        if (!container) {
            console.error('BattlePhaser: container not found:', this._containerId);
            return;
        }

        var W = 800;
        var H = 500;

        var config = {
            type: Phaser.AUTO,
            width: W,
            height: H,
            parent: this._containerId,
            backgroundColor: '#0a0a1a',
            scene: PhaserBattleScene,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            render: {
                pixelArt: false,
                antialias: true
            },
            audio: { noAudio: true },
            banner: false
        };

        try {
            this._game = new Phaser.Game(config);
        } catch (e) {
            console.error('BattlePhaser: failed to create Phaser game:', e);
            return;
        }

        var self = this;
        var checkScene = function () {
            if (self._game.scene && self._game.scene.getScene('PhaserBattleScene')) {
                self._scene = self._game.scene.getScene('PhaserBattleScene');
                if (typeof PhaserAnimations !== 'undefined') {
                    PhaserAnimations.init(self._scene);
                }
                console.log('BattlePhaser: Phaser scene ready');
            } else {
                setTimeout(checkScene, 100);
            }
        };
        checkScene();
    },

    // ===== ARENA IMAGE PRELOAD =====
    preloadArena: function (callback) {
        var self = this;
        var src = 'assets/arena/battle-arena.png';
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            // Add to Phaser texture manager when scene is available
            var tryAdd = function () {
                var scene = self._scene;
                if (scene && scene.textures) {
                    if (!scene.textures.exists('arena-bg')) {
                        scene.textures.addImage('arena-bg', img);
                        console.log('BattlePhaser: arena image loaded');
                    }
                    if (callback) callback();
                } else {
                    setTimeout(tryAdd, 100);
                }
            };
            tryAdd();
        };
        img.onerror = function () {
            console.warn('BattlePhaser: failed to load arena image from', src);
            if (callback) callback();
        };
        img.src = src;
    },

    // ===== LIFECYCLE =====
    enter: function (player, enemy, onComplete) {
        if (!this._scene) {
            var self = this;
            setTimeout(function () { self.enter(player, enemy, onComplete); }, 200);
            return;
        }

        this._active = true;
        this._transitioning = true;

        // Make container take top 50% of viewport (arena), cards go below
        var container = document.getElementById(this._containerId);
        if (container) {
            // Show the container (it was display:none in CSS)
            container.style.display = 'block';
            container.style.margin = '0';
            container.style.border = 'none';
            container.style.boxShadow = 'none';
            container.style.maxWidth = 'none';

            // Position card hand in normal flow (NOT fixed — avoids stacking context issues on mobile)
            var cardHand = document.getElementById('card-hand-area');
            var actionRow = document.querySelector('.battle-action-row');
            var infoStrip = document.querySelector('.battle-info-strip');
            var els = [cardHand, actionRow, infoStrip];
            for (var i = 0; i < els.length; i++) {
                var el = els[i];
                if (el) {
                    el.style.display = '';
                    // Reset any position:fixed from previous battle
                    el.style.position = '';
                    el.style.top = '';
                    el.style.bottom = '';
                    el.style.left = '';
                    el.style.right = '';
                    el.style.zIndex = '';
                    el.style.height = '';
                }
            }
            if (cardHand) {
                cardHand.style.background = 'rgba(10,10,30,0.92)';
                cardHand.style.borderTop = '1px solid rgba(255,215,0,0.2)';
                cardHand.style.overflowY = 'auto';
                cardHand.style.flex = '1 1 0';
                cardHand.style.minHeight = '0';
            }
        }

        // Hide nav/header
        var hideEls = document.querySelectorAll('.game-nav, .game-header');
        for (var i = 0; i < hideEls.length; i++) {
            hideEls[i].style.display = 'none';
        }

        // Resize
        var self = this;
        requestAnimationFrame(function () {
            self._resizeToViewport();
        });

        var styleCanvas = function () {
            // Target the canvas inside battle-canvas-container specifically
            var c = document.querySelector('#battle-canvas-container canvas') || (self._game && self._game.canvas);
            if (c) {
                c.style.width = '100%';
                c.style.height = '100%';
                c.style.display = 'block';
                c.style.objectFit = 'contain';
                c.style.margin = '0 auto';
            }
        };
        setTimeout(styleCanvas, 50);
        setTimeout(styleCanvas, 200);
        setTimeout(styleCanvas, 500);

        // Show enter transition
        this._scene.showTransition('enter', function () {
            this._transitioning = false;
            if (onComplete) onComplete();
        }.bind(this));

        // Initial render
        this.renderField(player, enemy);
    },

    exit: function (onComplete) {
        // Guard: don't start a new transition if already inactive or transitioning
        if (!this._active && !this._transitioning) { if (onComplete) onComplete(); return; }
        if (!this._scene) { if (onComplete) onComplete(); return; }
        this._transitioning = true;

        this._scene.showTransition('exit', function () {
            this._active = false;
            this._transitioning = false;

            // Reset inline styles on battle elements (they stay in screen-battle DOM, not moved)
            var movedEls = ['#card-hand-area', '.battle-action-row', '.battle-info-strip', '.battle-controls'];
            for (var i = 0; i < movedEls.length; i++) {
                var el = document.querySelector(movedEls[i]);
                if (el) {
                    el.style.cssText = '';
                    el.style.display = 'none'; // hidden when not in battle
                }
            }

            var container = document.getElementById(this._containerId);
            if (container) {
                container.style.cssText = '';
            }

            // Robustly restore nav/header visibility
            var navEl = document.querySelector('.game-nav');
            var headerEl = document.querySelector('.game-header');
            if (navEl) { navEl.style.display = ''; navEl.style.removeProperty('display'); }
            if (headerEl) { headerEl.style.display = ''; headerEl.style.removeProperty('display'); }

            if (this._game) {
                this._game.scale.resize(800, 500);
            }

            if (onComplete) onComplete();
        }.bind(this));
    },

    // ===== RESIZE =====
    _resizeToViewport: function () {
        if (!this._game) return;
        // Target the canvas inside battle-canvas-container specifically
        var canvas = document.querySelector('#battle-canvas-container canvas') || this._game.canvas;
        if (canvas) {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.objectFit = 'contain';
            canvas.style.display = 'block';
            canvas.style.margin = '0 auto';
        }
    },

    // ===== RENDER FIELD — Hero-as-Entity =====
    renderField: function (player, enemy) {
        if (!this._scene || !this._active) return;
        this._scene.renderField(player, enemy);
    },

    // ===== ANIMATE CARD PLAY =====
    animateCardPlay: function (card, zoneIndex, isPlayer) {
        if (!this._scene || !this._active) return;
        // Skill cards activate at hero position
        var pos = this.getHeroZonePosition(0, isPlayer);
        if (typeof PhaserAnimations !== 'undefined') {
            PhaserAnimations.heroSummon(pos.x, pos.y);
        }
    },

    // ===== ANIMATE ATTACK =====
    animateAttack: function (attackerIdx, targetIdx, isPlayer, damage, isCrit) {
        if (!this._scene || !this._active) return;
        this._scene.playAttack(attackerIdx, targetIdx, isPlayer, damage, isCrit || false);
    },

    // ===== SPAWN DAMAGE TEXT =====
    spawnDmgText: function (amount, x, y, color) {
        if (!this._scene || !this._active) return;
        var isCrit = (typeof amount === 'string' && (amount.includes('CRIT') || amount.includes('💥')));
        this._scene.spawnDamageNumber(x, y, amount, isCrit);
    },

    // ===== SPAWN HEAL TEXT =====
    spawnHealText: function (amount, x, y) {
        if (!this._scene || !this._active) return;
        this._scene.spawnHealNumber(x, y, amount);
    },

    // ===== SHOW PHASE BANNER =====
    showPhaseBanner: function (phase, isPlayer) {
        if (!this._scene || !this._active) return;
        this._scene.showPhaseBanner(phase, isPlayer);
    },

    // ===== UPDATE HERO HP (replaces updateLP) =====
    updateHeroHP: function (isPlayer, current, max) {
        if (!this._scene || !this._active) return;
        var side = isPlayer ? 'player' : 'enemy';
        // Force a full field render to update hero panel
        if (BattleEngine.player && BattleEngine.enemy) {
            this._scene.renderField(BattleEngine.player, BattleEngine.enemy);
        }
    },

    // ===== LEGACY: UPDATE LP (delegates to updateHeroHP) =====
    updateLP: function (isPlayer, current, max) {
        this.updateHeroHP(isPlayer, current, max);
    },

    // ===== TRIGGER SHAKE =====
    triggerShake: function (intensity, duration) {
        if (!this._scene || !this._active) return;
        this._scene.triggerShake(intensity, duration);
    },

    // ===== GET HERO POSITION (for damage numbers) =====
    getHeroZonePosition: function (zoneIndex, isPlayer) {
        if (!this._scene) return { x: 300, y: 200 };
        return this._scene.getHeroZonePosition(zoneIndex, isPlayer);
    },

    // ===== ACTIVE STATE =====
    isActive: function () {
        return this._active && this._scene !== null;
    },

    isTransitioning: function () {
        return this._transitioning;
    },

    // ===== PLAY ATTACK =====
    playAttack: function (attackIdx, targetIdx, isPlayerAttacking, damage, isCrit) {
        if (!this._scene || !this._active) return;
        this._scene.playAttack(0, 0, isPlayerAttacking, damage, isCrit);
    },

    // ===== SPAWN DAMAGE NUMBER =====
    spawnDamageNumber: function (x, y, amount, isCrit) {
        if (!this._scene || !this._active) return;
        this._scene.spawnDamageNumber(x, y, amount, isCrit);
    },

    // ===== SPAWN HEAL NUMBER =====
    spawnHealNumber: function (x, y, amount) {
        if (!this._scene || !this._active) return;
        this._scene.spawnHealNumber(x, y, amount);
    },

    // ===== SHOW PHASE BANNER =====
    showPhaseBanner: function (text, isPlayer) {
        if (!this._scene || !this._active) return;
        this._scene.showPhaseBanner(text, isPlayer);
    },

    // ===== DESTROY =====
    destroy: function () {
        this._active = false;
        this._transitioning = false;
        if (typeof PhaserAnimations !== 'undefined') {
            PhaserAnimations.stop();
        }
        if (this._game) {
            this._game.destroy(true);
            this._game = null;
        }
        this._scene = null;
    }
};
