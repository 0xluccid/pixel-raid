/* ========================================
 * Phaser Animation System — Battle FX
 * All battle animations live here.
 * Called via PhaserAnimations or BattleScene methods.
 * ======================================== */

var PhaserAnimations = {
    scene: null,

    init: function (scene) {
        this.scene = scene;
    },

    /* ────────────────────────────────────
     * 1. SUMMON ANIMATION
     * Expanding gold rings + emoji scale-in
     * ──────────────────────────────────── */
    summonUnit: function (x, y, emoji, cb) {
        if (!this.scene) return;
        var s = this.scene;

        // Create emoji text, start invisible
        var txt = s.add.text(x, y, emoji, { fontSize: '38px' });
        txt.setOrigin(0.5, 0.5);
        txt.setScale(0);
        txt.setAlpha(0);
        txt.setDepth(30);

        // Staggered expanding rings
        var ringCount = 3;
        for (var i = 0; i < ringCount; i++) {
            (function (delay) {
                s.time.delayedCall(delay, function () {
                    var ring = s.add.graphics();
                    ring.lineStyle(2, 0xffd700, 0.8);
                    ring.strokeCircle(0, 0, 8);
                    ring.setPosition(x, y);
                    ring.setDepth(29);

                    s.tweens.add({
                        targets: ring,
                        scaleX: 5,
                        scaleY: 5,
                        alpha: 0,
                        duration: 500,
                        ease: 'Power2',
                        onComplete: function () { ring.destroy(); }
                    });
                });
            })(i * 120);
        }

        // Central flash
        var flash = s.add.graphics();
        flash.fillStyle(0xffd700, 0.7);
        flash.fillCircle(0, 0, 20);
        flash.setPosition(x, y);
        flash.setDepth(28);

        s.tweens.add({
            targets: flash,
            alpha: 0,
            scaleX: 3,
            scaleY: 3,
            duration: 400,
            ease: 'Power2',
            onComplete: function () { flash.destroy(); }
        });

        // Emoji scale-in
        s.tweens.add({
            targets: txt,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 1,
            duration: 200,
            ease: 'Back.easeOut',
            onComplete: function () {
                s.tweens.add({
                    targets: txt,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100,
                    onComplete: function () {
                        if (cb) cb(txt);
                    }
                });
            }
        });
    },

    /* ────────────────────────────────────
     * 2. ATTACK ANTICIPATION
     * Brief pulse + slot flash before attack
     * ──────────────────────────────────── */
    attackAnticipation: function (x, y, w, h, cb) {
        if (!this.scene) return;
        var s = this.scene;

        // Pulse glow on attacker slot
        var glow = s.add.graphics();
        glow.fillStyle(0xffd700, 0.3);
        glow.fillRect(x, y, w, h);
        glow.setDepth(25);
        glow.setAlpha(0);

        s.tweens.add({
            targets: glow,
            alpha: 1,
            duration: 80,
            yoyo: true,
            repeat: 1,
            onComplete: function () {
                glow.destroy();
                if (cb) cb();
            }
        });

        // Slot border flash
        var border = s.add.graphics();
        border.lineStyle(3, 0xffd700, 1);
        border.strokeRect(x + 1, y + 1, w - 2, h - 2);
        border.setDepth(26);
        border.setAlpha(0);

        s.tweens.add({
            targets: border,
            alpha: 1,
            duration: 60,
            yoyo: true,
            repeat: 1,
            onComplete: function () { border.destroy(); }
        });
    },

    /* ────────────────────────────────────
     * 3. DASH FORWARD
     * Ghost trail moves from attacker toward target
     * ──────────────────────────────────── */
    dashForward: function (srcX, srcY, tgtX, tgtY, emoji, isCrit, cb) {
        if (!this.scene) return;
        var s = this.scene;

        // Ghost silhouette
        var ghost = s.add.text(srcX, srcY, emoji || '⚔️', { fontSize: '38px' });
        ghost.setOrigin(0.5, 0.5);
        ghost.setAlpha(0.6);
        ghost.setDepth(45);

        // Trail particles
        var trailParticles = [];

        s.tweens.add({
            targets: ghost,
            x: tgtX,
            y: tgtY,
            duration: 200,
            ease: 'Power3',
            onUpdate: function (tw) {
                // Spawn trail particles
                if (Math.random() > 0.4) {
                    var px = ghost.x + (Math.random() - 0.5) * 10;
                    var py = ghost.y + (Math.random() - 0.5) * 10;
                    var p = s.add.graphics();
                    var pColor = isCrit ? 0xff4444 : 0xffd700;
                    p.fillStyle(pColor, 0.7);
                    p.fillCircle(0, 0, 1 + Math.random() * 2);
                    p.setPosition(px, py);
                    p.setDepth(44);
                    trailParticles.push(p);

                    s.tweens.add({
                        targets: p,
                        alpha: 0,
                        scaleX: 0,
                        scaleY: 0,
                        duration: 200,
                        onComplete: function () { p.destroy(); }
                    });
                }
            },
            onComplete: function () {
                ghost.destroy();
                if (cb) cb();
            }
        });
    },

    /* ────────────────────────────────────
     * 4. ENHANCED IMPACT HIT FLASH
     * White flash + target shake + energy burst
     * ──────────────────────────────────── */
    hitFlash: function (x, y, w, h, isCrit) {
        if (!this.scene) return;
        var s = this.scene;

        // Full-slot white flash
        var flash = s.add.graphics();
        flash.fillStyle(isCrit ? 0xff3232 : 0xffffff, isCrit ? 0.6 : 0.45);
        flash.fillRect(x, y, w, h);
        flash.setDepth(48);

        s.tweens.add({
            targets: flash,
            alpha: 0,
            duration: isCrit ? 350 : 250,
            ease: 'Power2',
            onComplete: function () { flash.destroy(); }
        });

        // Energy burst rings
        var cx = x + w / 2;
        var cy = y + h / 2;
        var burstColor = isCrit ? 0xff4444 : 0xffffff;
        for (var i = 0; i < 2; i++) {
            (function (delay) {
                s.time.delayedCall(delay, function () {
                    var ring = s.add.graphics();
                    ring.lineStyle(isCrit ? 3 : 2, burstColor, 0.7);
                    ring.strokeCircle(0, 0, 10);
                    ring.setPosition(cx, cy);
                    ring.setDepth(47);

                    s.tweens.add({
                        targets: ring,
                        scaleX: 3,
                        scaleY: 3,
                        alpha: 0,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: function () { ring.destroy(); }
                    });
                });
            })(i * 80);
        }

        // Brief screen flash
        var fullFlash = s.add.graphics();
        fullFlash.fillStyle(isCrit ? 0xff2222 : 0xffffff, isCrit ? 0.1 : 0.06);
        fullFlash.fillRect(0, 0, s.W, s.H);
        fullFlash.setDepth(46);

        s.tweens.add({
            targets: fullFlash,
            alpha: 0,
            duration: 150,
            onComplete: function () { fullFlash.destroy(); }
        });
    },

    /* ────────────────────────────────────
     * 5. DEATH FADE ANIMATION
     * Gray tint → shrink → dissolve particles
     * ──────────────────────────────────── */
    deathFade: function (x, y, emoji, cb) {
        if (!this.scene) return;
        var s = this.scene;

        // Ghost of the dying unit
        var ghost = s.add.text(x, y, emoji || '💀', { fontSize: '38px' });
        ghost.setOrigin(0.5, 0.5);
        ghost.setDepth(55);

        // Flash red first
        var redFlash = s.add.graphics();
        redFlash.fillStyle(0xff0000, 0.4);
        redFlash.fillRect(x - 50, y - 40, 100, 80);
        redFlash.setDepth(54);

        s.tweens.add({
            targets: redFlash,
            alpha: 0,
            duration: 150,
            onComplete: function () { redFlash.destroy(); }
        });

        // Fade + shrink
        s.tweens.add({
            targets: ghost,
            alpha: 0,
            scaleX: 0.3,
            scaleY: 0.3,
            duration: 500,
            ease: 'Power2'
        });

        // Dissolve particles
        for (var i = 0; i < 10; i++) {
            (function (delay) {
                s.time.delayedCall(delay, function () {
                    var p = s.add.graphics();
                    p.fillStyle(0x888888, 0.8);
                    p.fillRect(-2, -2, 4, 4);
                    p.setPosition(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 30);
                    p.setDepth(56);

                    s.tweens.add({
                        targets: p,
                        y: p.y - 30 - Math.random() * 40,
                        x: p.x + (Math.random() - 0.5) * 40,
                        alpha: 0,
                        duration: 400 + Math.random() * 200,
                        ease: 'Power2',
                        onComplete: function () { p.destroy(); }
                    });
                });
            })(i * 40);
        }

        // Skull emoji pop
        s.time.delayedCall(200, function () {
            var skull = s.add.text(x, y, '💀', { fontSize: '20px' });
            skull.setOrigin(0.5, 0.5);
            skull.setDepth(57);
            skull.setAlpha(0);

            s.tweens.add({
                targets: skull,
                y: y - 30,
                alpha: 1,
                duration: 300,
                ease: 'Power2',
                onComplete: function () {
                    s.tweens.add({
                        targets: skull,
                        y: y - 50,
                        alpha: 0,
                        duration: 300,
                        delay: 200,
                        onComplete: function () {
                            skull.destroy();
                            if (cb) cb();
                        }
                    });
                }
            });
        });

        s.time.delayedCall(700, function () {
            ghost.destroy();
            if (cb) cb();
        });
    },

    /* ────────────────────────────────────
     * 6. VICTORY CELEBRATION
     * Gold confetti + text + screen pulse
     * ──────────────────────────────────── */
    victoryCelebration: function (cb) {
        if (!this.scene) return;
        var s = this.scene;
        var W = s.W;
        var H = s.H;

        // Gold confetti
        var colors = [0xffd700, 0xffaa00, 0x44ff88, 0x44aaff, 0xff44aa, 0xffffff];
        for (var i = 0; i < 40; i++) {
            (function (delay) {
                s.time.delayedCall(delay, function () {
                    var color = colors[Math.floor(Math.random() * colors.length)];
                    var size = 2 + Math.random() * 4;
                    var p = s.add.graphics();
                    p.fillStyle(color, 0.9);
                    if (Math.random() > 0.5) {
                        p.fillRect(-size / 2, -size / 2, size, size);
                    } else {
                        p.fillCircle(0, 0, size / 2);
                    }
                    p.setPosition(Math.random() * W, -10);
                    p.setDepth(110);
                    p.setAngle(Math.random() * 360);

                    s.tweens.add({
                        targets: p,
                        y: H + 20,
                        x: p.x + (Math.random() - 0.5) * 100,
                        angle: p.angle + 360 + Math.random() * 360,
                        duration: 1500 + Math.random() * 1000,
                        ease: 'Power1',
                        onComplete: function () { p.destroy(); }
                    });
                });
            })(i * 40);
        }

        // Gold screen pulse
        var pulse = s.add.graphics();
        pulse.fillStyle(0xffd700, 0.12);
        pulse.fillRect(0, 0, W, H);
        pulse.setDepth(108);
        pulse.setAlpha(0);

        s.tweens.add({
            targets: pulse,
            alpha: 1,
            duration: 300,
            yoyo: true,
            repeat: 2,
            onComplete: function () { pulse.destroy(); }
        });

        // VICTORY text
        s.time.delayedCall(300, function () {
            var txt = s.add.text(W / 2, H / 2 - 20, '🏆 VICTORY!', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '28px',
                color: '#ffd700',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            });
            txt.setOrigin(0.5, 0.5);
            txt.setDepth(115);
            txt.setScale(0.2);
            txt.setAlpha(0);
            txt.setShadow(0, 0, '#ffd700', 30, true, true, 8);

            s.tweens.add({
                targets: txt,
                scaleX: 1.1,
                scaleY: 1.1,
                alpha: 1,
                duration: 400,
                ease: 'Back.easeOut',
                onComplete: function () {
                    s.tweens.add({
                        targets: txt,
                        scaleX: 1.2,
                        scaleY: 1.2,
                        duration: 200,
                        yoyo: true,
                        repeat: -1
                    });
                }
            });

            // Big camera shake
            s.cameras.main.shake(800, 0.012);
        });

        // Stars burst
        s.time.delayedCall(600, function () {
            for (var i = 0; i < 8; i++) {
                (function (delay) {
                    s.time.delayedCall(delay, function () {
                        var star = s.add.text(
                            W / 2 + (Math.random() - 0.5) * 200,
                            H / 2 + (Math.random() - 0.5) * 100,
                            '⭐',
                            { fontSize: '16px' }
                        );
                        star.setOrigin(0.5, 0.5);
                        star.setDepth(112);
                        star.setAlpha(0);

                        s.tweens.add({
                            targets: star,
                            y: star.y - 60,
                            alpha: 1,
                            duration: 400,
                            ease: 'Power2',
                            onComplete: function () {
                                s.tweens.add({
                                    targets: star,
                                    y: star.y - 30,
                                    alpha: 0,
                                    duration: 500,
                                    delay: 300,
                                    onComplete: function () { star.destroy(); }
                                });
                            }
                        });
                    });
                })(i * 80);
            }
        });

        s.time.delayedCall(2500, function () {
            if (cb) cb();
        });
    },

    /* ────────────────────────────────────
     * 7. DEFEAT ANIMATION
     * Red vignette + text + unit crumble
     * ──────────────────────────────────── */
    defeatAnimation: function (cb) {
        if (!this.scene) return;
        var s = this.scene;
        var W = s.W;
        var H = s.H;

        // Red vignette
        var vignette = s.add.graphics();
        vignette.fillStyle(0xff0000, 0);
        vignette.fillRect(0, 0, W, H);
        vignette.setDepth(108);
        vignette.setAlpha(0);

        // Draw vignette gradient (dark edges, red center)
        var vignetteGrad = s.add.graphics();
        vignetteGrad.setDepth(107);
        vignetteGrad.setAlpha(0);

        // Corners darken
        for (var corner = 0; corner < 4; corner++) {
            var cx = corner % 2 === 0 ? 0 : W;
            var cy = corner < 2 ? 0 : H;
            vignetteGrad.fillStyle(0x880000, 0.4);
            vignetteGrad.fillCircle(cx, cy, W * 0.8);
        }

        s.tweens.add({
            targets: [vignette, vignetteGrad],
            alpha: 1,
            duration: 800,
            ease: 'Power2'
        });

        // Screen shake
        s.cameras.main.shake(1000, 0.008);

        // DEFEAT text
        s.time.delayedCall(400, function () {
            var txt = s.add.text(W / 2, H / 2 - 20, '💀 DEFEAT', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '28px',
                color: '#ff3333',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            });
            txt.setOrigin(0.5, 0.5);
            txt.setDepth(115);
            txt.setScale(0.2);
            txt.setAlpha(0);
            txt.setShadow(0, 0, '#ff0000', 25, true, true, 8);

            s.tweens.add({
                targets: txt,
                scaleX: 1,
                scaleY: 1,
                alpha: 1,
                duration: 600,
                ease: 'Back.easeOut'
            });
        });

        // Red rain particles
        for (var i = 0; i < 20; i++) {
            (function (delay) {
                s.time.delayedCall(delay, function () {
                    var p = s.add.graphics();
                    p.fillStyle(0xff3333, 0.6);
                    p.fillRect(-1, -1, 2, 6);
                    p.setPosition(Math.random() * W, -10);
                    p.setDepth(106);

                    s.tweens.add({
                        targets: p,
                        y: H + 10,
                        alpha: 0,
                        duration: 1000 + Math.random() * 500,
                        onComplete: function () { p.destroy(); }
                    });
                });
            })(i * 60);
        }

        s.time.delayedCall(2500, function () {
            if (cb) cb();
        });
    },

    /* ────────────────────────────────────
     * 8. CARD PLAY ANIMATION
     * Tween card sprite from hand to field
     * ──────────────────────────────────── */
    cardPlay: function (cardSprite, targetX, targetY, onComplete) {
        if (!this.scene || !cardSprite) return;

        this.scene.tweens.add({
            targets: cardSprite,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 100,
            ease: 'Power2',
            onComplete: function () {
                this.scene.tweens.add({
                    targets: cardSprite,
                    x: targetX,
                    y: targetY,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200,
                    ease: 'Power2',
                    onComplete: function () {
                        if (onComplete) onComplete();
                    }.bind(this)
                });
            }.bind(this)
        });
    },

    /* ────────────────────────────────────
     * 9. PHASE BANNER
     * Large text that fades in, holds, fades out
     * ──────────────────────────────────── */
    phaseBanner: function (text, color) {
        if (!this.scene) return;

        var W = this.scene.W || 800;
        var H = this.scene.H || 500;

        var banner = this.scene.add.text(W / 2, H / 2, text.toUpperCase(), {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '16px',
            color: color || '#ffd700',
            fontStyle: 'bold'
        });
        banner.setOrigin(0.5, 0.5);
        banner.setAlpha(0);
        banner.setScale(0.5);
        banner.setShadow(0, 0, color || '#ffd700', 20);

        var backdrop = this.scene.add.graphics();
        backdrop.fillStyle(0x000000, 0);
        backdrop.fillRect(0, H / 2 - 20, W, 40);

        this.scene.tweens.add({
            targets: banner,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: function () {
                this.scene.time.delayedCall(600, function () {
                    this.scene.tweens.add({
                        targets: banner,
                        alpha: 0,
                        scaleX: 1.2,
                        scaleY: 1.2,
                        duration: 400,
                        onComplete: function () {
                            banner.destroy();
                            backdrop.destroy();
                        }
                    });
                }.bind(this));
            }.bind(this)
        });
    },

    /* ────────────────────────────────────
     * 10. SCREEN SHAKE (utility)
     * ──────────────────────────────────── */
    shakeScreen: function (intensity, duration) {
        if (!this.scene) return;
        this.scene.cameras.main.shake(duration * 1000, intensity / 1000);
    },

    /* ────────────────────────────────────
     * CLEANUP
     * ──────────────────────────────────── */
    stop: function () {
        if (this.scene) {
            this.scene.tweens.killAll();
        }
        this.scene = null;
    }
};
