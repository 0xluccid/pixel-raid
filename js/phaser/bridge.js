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

        // Destroy old Phaser game if it exists (prevent memory leak on retry)
        if (this._game) {
            try { this._game.destroy(true, false); } catch (e) {}
            this._game = null;
            this._scene = null;
        }

        var container = document.getElementById(this._containerId);
        if (!container) {
            console.error('BattlePhaser: container not found:', this._containerId);
            return;
        }

        var W = 1280;
        var H = 720;

        var config = {
            type: Phaser.AUTO,
            width: W,
            height: H,
            parent: this._containerId,
            backgroundColor: '#0a0a1a',
            scene: PhaserBattleScene,
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            render: {
                pixelArt: false,
                antialias: true,
                roundPixels: false
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

        // Make container take full viewport (arena top, cards bottom)
        var container = document.getElementById(this._containerId);
        if (container) {
            container.style.display = 'block';
            container.style.margin = '0';
            container.style.border = 'none';
            container.style.boxShadow = 'none';
            container.style.maxWidth = 'none';

            // Reset card hand to normal flow — CSS handles layout via .battle-active
            var cardHand = document.getElementById('card-hand-area');
            if (cardHand) {
                cardHand.style.display = '';
                cardHand.style.position = '';
                cardHand.style.top = '';
                cardHand.style.bottom = '';
                cardHand.style.left = '';
                cardHand.style.right = '';
                cardHand.style.zIndex = '';
                // Don't override flex/height — CSS .battle-active rules handle it
            }
        }

        // Hide nav/header
        var hideEls = document.querySelectorAll('.game-nav, .game-header');
        for (var i = 0; i < hideEls.length; i++) {
            hideEls[i].style.display = 'none';
        }

        // Resize with retry to handle layout timing
        var self = this;
        requestAnimationFrame(function () {
            self._resizeToViewport();
            // Retry after 100ms in case layout wasn't computed yet
            setTimeout(function () { self._resizeToViewport(); }, 100);
            setTimeout(function () { self._resizeToViewport(); }, 300);
        });

        // Keep canvas edge-to-edge on window resize
        this._resizeHandler = function () { self._resizeToViewport(); };
        window.addEventListener('resize', this._resizeHandler);

        // Style canvas to fill container edge-to-edge (NO objectFit — causes letterboxing)
        var styleCanvas = function () {
            var c = document.querySelector('#battle-canvas-container canvas') || (self._game && self._game.canvas);
            if (c) {
                c.style.width = '100%';
                c.style.height = '100%';
                c.style.display = 'block';
                c.style.margin = '0';
            }
        };
        setTimeout(styleCanvas, 50);
        setTimeout(styleCanvas, 200);

        // Position bonus overlay labels (HTML, not Phaser — more reliable)
        this._createBonusOverlays();

        // Show enter transition
        this._scene.showTransition('enter', function () {
            this._transitioning = false;
            if (onComplete) onComplete();
        }.bind(this));

        // Initial render
        this.renderField(player, enemy);
    },

    // ===== POSITION BONUS OVERLAYS (HTML) =====
    _bonusOverlayEls: [],
    _createBonusOverlays: function () {
        // Remove old overlays
        this._removeBonusOverlays();

        if (typeof POSITION_BONUSES === 'undefined') return;

        var canvas = document.querySelector('#battle-canvas-container canvas');
        if (!canvas) return;

        var wrap = canvas.parentElement;
        if (!wrap) return;
        wrap.style.position = 'relative';

        var W = 800, H = 500;
        var slotW = 110, slotH = 85, slotGap = 8;
        var totalW = slotW * 5 + slotGap * 4;
        var startX = (W - totalW) / 2;
        var centerY = H / 2;
        var playerY = centerY + 18;

        for (var i = 0; i < 5; i++) {
            var cfg = POSITION_BONUSES[i];
            if (!cfg) continue;

            var slotCenterX = startX + i * (slotW + slotGap) + slotW / 2;

            // Subtle icon overlay — hidden by default, shown only on canvas hover via battle-scene tooltip
            var iconEl = document.createElement('div');
            iconEl.textContent = cfg.icon;
            iconEl.style.cssText = 'position:absolute;pointer-events:none;font-size:12px;text-align:center;transition:opacity 0.3s;opacity:0;pointer-events:auto;cursor:help;';
            iconEl.style.left = 'calc(' + (slotCenterX / W * 100) + '% - 8px)';
            iconEl.style.top = 'calc(' + ((playerY + 4) / H * 100) + '%)';

            // Show icon on hover, hide on leave
            (function(icon, slotIdx) {
                icon.addEventListener('mouseenter', function() {
                    icon.style.opacity = '0.9';
                });
                icon.addEventListener('mouseleave', function() {
                    icon.style.opacity = '0';
                });
            })(iconEl, i);

            wrap.appendChild(iconEl);
            this._bonusOverlayEls.push(iconEl);
        }
    },
    _removeBonusOverlays: function () {
        for (var i = 0; i < this._bonusOverlayEls.length; i++) {
            if (this._bonusOverlayEls[i] && this._bonusOverlayEls[i].parentNode) {
                this._bonusOverlayEls[i].parentNode.removeChild(this._bonusOverlayEls[i]);
            }
        }
        this._bonusOverlayEls = [];
    },

    exit: function (onComplete) {
        // Guard: don't start a new transition if already inactive or transitioning
        if (!this._active && !this._transitioning) { if (onComplete) onComplete(); return; }
        if (!this._scene) { if (onComplete) onComplete(); return; }
        this._transitioning = true;

        // Remove window resize handler
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }

        this._scene.showTransition('exit', function () {
            this._active = false;
            this._transitioning = false;

            // Clean up bonus overlays
            this._removeBonusOverlays();

            // Clear card hand content from previous battle
            var cardHand = document.getElementById('card-hand-area');
            if (cardHand) cardHand.innerHTML = '';

            // Clear hero power area
            var heroPower = document.getElementById('hero-power-area');
            if (heroPower) heroPower.innerHTML = '';

            // Remove phase bar from previous battle
            var phaseBar = document.getElementById('battle-phase-bar');
            if (phaseBar) phaseBar.remove();

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
                container.style.display = 'none';
                // Remove leftover canvas from Phaser
                var oldCanvas = container.querySelector('canvas');
                if (oldCanvas) oldCanvas.remove();
            }
            var wrap = document.querySelector('.battle-canvas-wrap');
            if (wrap) {
                wrap.style.cssText = '';
                wrap.style.height = '';
                wrap.style.minHeight = '';
            }

            // Robustly restore nav/header visibility
            var navEl = document.querySelector('.game-nav');
            var headerEl = document.querySelector('.game-header');
            if (navEl) { navEl.style.display = ''; navEl.style.removeProperty('display'); }
            if (headerEl) { headerEl.style.display = ''; headerEl.style.removeProperty('display'); }

            // Restore battle controls (Start Battle button)
            var battleCtrl = document.querySelector('.battle-controls');
            if (battleCtrl) { battleCtrl.style.cssText = ''; battleCtrl.style.removeProperty('display'); }

            if (this._game) {
                this._game.scale.resize(800, 500);
                this._game.scale.setGameSize(800, 500);
            }

            if (onComplete) onComplete();
        }.bind(this));
    },

    // ===== RESIZE =====
    _resizeToViewport: function () {
        if (!this._game) return;
        var container = document.getElementById(this._containerId);
        var canvas = document.querySelector('#battle-canvas-container canvas') || this._game.canvas;

        // Force canvas to fill container edge-to-edge — NO objectFit
        if (canvas) {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.display = 'block';
            canvas.style.margin = '0';
        }

        // Resize Phaser engine to match the container's actual pixel dimensions
        if (container && container.offsetWidth > 0 && container.offsetHeight > 0) {
            var cW = container.offsetWidth;
            var cH = container.offsetHeight;
            this._game.scale.resize(cW, cH);
            this._game.scale.setGameSize(cW, cH);

            // Set camera to FILL mode (use max zoom to cover entire canvas)
            if (this._scene && this._scene.cameras && this._scene.cameras.main) {
                var cam = this._scene.cameras.main;
                var W = this._scene.W || 1280;
                var H = this._scene.H || 720;
                var zoomX = cW / W;
                var zoomY = cH / H;
                // Use MAX zoom to fill — no black bars, content may crop at edges
                var zoom = Math.max(zoomX, zoomY);
                cam.setZoom(zoom);
                cam.centerOn(W / 2, H / 2);
            }
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

    // ===== DEATH FADE ANIMATION =====
    deathFade: function (side, slotIndex, emoji, cb) {
        if (!this._scene || !this._active) { if (cb) cb(); return; }
        this._scene.deathFade(side, slotIndex, emoji, cb);
    },

    // ===== VICTORY CELEBRATION =====
    playVictory: function (cb) {
        if (!this._scene || !this._active) { if (cb) cb(); return; }
        this._scene.playVictory(cb);
    },

    // ===== DEFEAT ANIMATION =====
    playDefeat: function (cb) {
        if (!this._scene || !this._active) { if (cb) cb(); return; }
        this._scene.playDefeat(cb);
    },

    // ===== DESTROY =====
    destroy: function () {
        this._active = false;
        this._transitioning = false;
        this._removeBonusOverlays();
        if (typeof PhaserAnimations !== 'undefined') {
            PhaserAnimations.stop();
        }
        if (this._game) {
            this._game.destroy(true, false); // removeCanvas=true, no scene shutdown
            this._game = null;
        }
        this._scene = null;
    }
};
