/* ========================================
 * Phaser Battle Scene — WebGL battle field renderer
 * Hero-as-Entity Edition (v6)
 * FUTURISTIC ARENA — 5×5 Grid, Top Hero Panels
 * Hero panels at TOP, grid takes 70% of screen
 * Large VS emblem with blue glow, clean bottom area
 * ======================================== */

const PhaserBattleScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function PhaserBattleScene() {
        Phaser.Scene.call(this, { key: 'PhaserBattleScene' });

        // Layout constants (HD — match bridge.js W/H)
        this.W = 1280;
        this.H = 720;

        // Game object refs
        this.bgGraphics = null;
        this.gridGraphics = null;

        // Hero panels (one per side)
        this.heroPanel = { player: null, enemy: null };
        this.heroHPBar = { player: null, enemy: null };
        this.heroHPText = { player: null, enemy: null };
        this.heroNameText = { player: null, enemy: null };
        this.heroSprite = { player: null, enemy: null };
        this.heroStatText = { player: null, enemy: null };
        this.heroClassText = { player: null, enemy: null };
        this.heroLevelText = { player: null, enemy: null };

        // Center divider
        this.phaseText = null;
        this.turnText = null;
        this.vsText = null;

        // Skill activation area
        this.skillSlots = [];

        // Effects
        this.damageNumbers = [];
        this.phaseBanner = null;
        this.attackAnims = [];
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeDecay = 0;

        // Reference to combatant data
        this.playerData = null;
        this.enemyData = null;
    },

    preload: function () {
        // Arena image is pre-loaded externally via bridge.preloadArena()
        // It gets added to texture manager before create() runs
    },


    create: function () {
        var W = this.W;
        var H = this.H;
        var scene = this;

        // === LAYER 0: FULLSCREEN DARK VOID BACKGROUND (#07071a) ===
        var voidBg = this.add.graphics();
        voidBg.setDepth(0);
        voidBg.fillStyle(0x07071a, 1);
        voidBg.fillRect(0, 0, W, H);
        // Subtle radial gradient — slightly brighter in center
        var vigSteps = 20;
        for (var vi = 0; vi < vigSteps; vi++) {
            var vAlpha = (vigSteps - vi) / vigSteps * 0.035;
            voidBg.fillStyle(0x111830, vAlpha);
            voidBg.fillCircle(W / 2, H / 2, Math.max(W, H) * 0.5 * (1 - vi / vigSteps));
        }

        // === SUBTLE NEON GRID LINES across entire background ===
        this._gridLinesGfx = this.add.graphics();
        this._gridLinesGfx.setDepth(0);
        var gridSpacing = 48;
        for (var gy = gridSpacing; gy < H; gy += gridSpacing) {
            this._gridLinesGfx.lineStyle(1, 0x00e5ff, 0.04);
            this._gridLinesGfx.beginPath();
            this._gridLinesGfx.moveTo(0, gy);
            this._gridLinesGfx.lineTo(W, gy);
            this._gridLinesGfx.strokePath();
        }
        for (var gx = gridSpacing; gx < W; gx += gridSpacing) {
            this._gridLinesGfx.lineStyle(1, 0x00e5ff, 0.04);
            this._gridLinesGfx.beginPath();
            this._gridLinesGfx.moveTo(gx, 0);
            this._gridLinesGfx.lineTo(gx, H);
            this._gridLinesGfx.strokePath();
        }

        // === LAYER 1: ARENA FLOOR (futuristic grid) ===
        this.bgGraphics = this.add.graphics();
        this.bgGraphics.setDepth(1);
        this._drawBackground();

        // === LAYER 2: GRID (5×5 layout) ===
        this.gridGraphics = this.add.graphics();
        this.gridGraphics.setDepth(2);
        this._drawGrid();

        // Phase bar is handled by DOM overlay (#battle-phase-bar)

        // === CENTER DIVIDER (VS emblem — large, at top zone) ===
        this._createCenterDivider();

        // === HERO PANELS (compact, at top corners) ===
        this._createHeroPanel('player');
        this._createHeroPanel('enemy');

        // === SKILL SLOTS (5×5 board grid) ===
        this._createSkillSlots();

        // === CLEAN BOTTOM AREA ===
        var bottomY = 634;
        var bottomBg = this.add.graphics();
        bottomBg.setDepth(1);
        bottomBg.fillStyle(0x060614, 0.7);
        bottomBg.fillRect(0, bottomY, W, H - bottomY);
        // Subtle top border with glow
        bottomBg.lineStyle(2, 0x00e5ff, 0.15);
        bottomBg.beginPath();
        bottomBg.moveTo(0, bottomY);
        bottomBg.lineTo(W, bottomY);
        bottomBg.strokePath();
        bottomBg.lineStyle(1, 0x00e5ff, 0.05);
        bottomBg.beginPath();
        bottomBg.moveTo(0, bottomY + 1);
        bottomBg.lineTo(W, bottomY + 1);
        bottomBg.strokePath();
    },

    _drawBackground: function () {
        var g = this.bgGraphics;
        var W = this.W;
        var H = this.H;
        g.clear();

        // Grid area background — centered, ~70% of screen
        var gridX = 196;
        var gridY = 130;
        var gridW = 888;
        var gridH = 508;

        // Dark area for grid
        g.fillStyle(0x080e22, 1);
        g.fillRect(gridX, gridY, gridW, gridH);

        // Subtle center brightening
        g.fillStyle(0x0e1830, 0.3);
        g.fillCircle(W / 2, gridY + gridH / 2, gridH * 0.5);

        // Energy border lines around grid area
        g.lineStyle(2, 0x00e5ff, 0.12);
        g.strokeRect(gridX, gridY, gridW, gridH);
        // Outer glow
        g.lineStyle(1, 0x00e5ff, 0.04);
        g.strokeRect(gridX - 2, gridY - 2, gridW + 4, gridH + 4);

        // Side accent lines
        g.lineStyle(1, 0xff44aa, 0.05);
        g.beginPath();
        g.moveTo(gridX, gridY);
        g.lineTo(gridX, gridY + gridH);
        g.strokePath();
        g.beginPath();
        g.moveTo(gridX + gridW, gridY);
        g.lineTo(gridX + gridW, gridY + gridH);
        g.strokePath();
    },

    _drawGrid: function () {
        var g = this.gridGraphics;
        g.clear();

        var W = this.W;
        var H = this.H;

        // Grid constants — 5×5 cells
        var slotW = 164;
        var slotH = 90;
        var gap = 12;
        var startX = 206;
        var startY = 136;

        // Draw all 25 cells
        for (var row = 0; row < 5; row++) {
            for (var col = 0; col < 5; col++) {
                var cx = startX + col * (slotW + gap);
                var cy = startY + row * (slotH + gap);

                var isEnemyRow = (row === 0);
                var isPlayerRow = (row === 4);
                var isCenterRow = (row === 2);

                // Cell background
                var bgAlpha = (isEnemyRow || isPlayerRow) ? 0.6 : 0.2;
                g.fillStyle(0x0d1525, bgAlpha);
                g.fillRect(cx, cy, slotW, slotH);

                // Cell border
                var borderColor, borderAlpha;
                if (isEnemyRow) {
                    borderColor = 0xff44aa;
                    borderAlpha = 0.25;
                } else if (isPlayerRow) {
                    borderColor = 0x00e5ff;
                    borderAlpha = 0.25;
                } else if (isCenterRow) {
                    borderColor = 0x00e5ff;
                    borderAlpha = 0.08;
                } else {
                    borderColor = 0x1a3a5a;
                    borderAlpha = 0.12;
                }

                g.lineStyle(1, borderColor, borderAlpha);
                g.strokeRect(cx, cy, slotW, slotH);

                // Subtle inner glow for active rows
                if (isEnemyRow || isPlayerRow) {
                    g.fillStyle(borderColor, 0.02);
                    g.fillRect(cx + 2, cy + 2, slotW - 4, slotH - 4);
                }
            }
        }

        // Vertical connecting lines between rows
        g.lineStyle(1, 0x00e5ff, 0.04);
        for (var v = 0; v < 5; v++) {
            var vx = startX + v * (slotW + gap) + slotW / 2;
            g.beginPath();
            g.moveTo(vx, startY + slotH);
            g.lineTo(vx, startY + 4 * (slotH + gap));
            g.strokePath();
        }

        // Center horizontal divider (row 2 area)
        var dividerY = startY + 2 * (slotH + gap) + slotH / 2;
        g.lineStyle(1, 0x00e5ff, 0.1);
        g.beginPath();
        g.moveTo(startX - 20, dividerY);
        g.lineTo(startX + 5 * slotW + 4 * gap + 20, dividerY);
        g.strokePath();

        // Animated glow ring placeholder (pulsed in update)
        this._innerRing = this.add.graphics();
        this._innerRing.setDepth(2);
        this._innerRing.lineStyle(2, 0x00e5ff, 0.15);
        this._innerRing.strokeEllipse(0, 0, 200, 60);
        this._innerRing.setPosition(W / 2, dividerY);
    },

    _createHeroPanel: function (side) {
        var scene = this;
        var panelW = 200;
        var panelH = 100;
        var panelX, panelY;

        if (side === 'player') {
            panelX = 20;
            panelY = 32;
        } else {
            panelX = this.W - 220;  // 1060
            panelY = 32;
        }

        var container = this.add.container(panelX, panelY);
        container.setDepth(10);

        var borderColor = side === 'player' ? 0x00e5ff : 0xff44aa;

        // Panel background — deep dark
        var bg = this.add.graphics();
        bg.fillStyle(0x08081c, 0.95);
        bg.fillRect(0, 0, panelW, panelH);
        container.add(bg);

        // Border
        var border = this.add.graphics();
        border.lineStyle(2, borderColor, 0.8);
        border.strokeRect(0, 0, panelW, panelH);
        container.add(border);
        if (side === 'enemy') {
            this._enemyHeroBorder = border;
        }

        // Glow (subtle pulsing)
        var glow = this.add.graphics();
        glow.lineStyle(4, borderColor, 0.15);
        glow.strokeRect(-3, -3, panelW + 6, panelH + 6);
        container.add(glow);
        container.setData('glow', glow);

        // Second outer glow
        var glow2 = this.add.graphics();
        glow2.lineStyle(2, borderColor, 0.05);
        glow2.strokeRect(-6, -6, panelW + 12, panelH + 12);
        container.add(glow2);

        // Top color strip
        var strip = this.add.graphics();
        strip.fillStyle(borderColor, 1);
        strip.fillRect(0, 0, panelW, 2);
        container.add(strip);

        // Emoji portrait (30px, left side)
        var portraitGlow = this.add.graphics();
        portraitGlow.fillStyle(borderColor, 0.08);
        portraitGlow.fillCircle(28, 38, 20);
        container.add(portraitGlow);

        var spriteText = this.add.text(28, 38, '⚔', {
            fontSize: '30px',
            color: side === 'player' ? 'rgba(0,229,255,0.4)' : 'rgba(255,68,170,0.4)'
        });
        spriteText.setOrigin(0.5, 0.5);
        container.add(spriteText);
        this.heroSprite[side] = spriteText;

        // Name text
        var nameText = this.add.text(52, 8, 'Hero', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#f0f0f0',
            fontStyle: 'bold'
        });
        container.add(nameText);
        this.heroNameText[side] = nameText;

        // Class text (8px, colored)
        var classText = this.add.text(52, 22, '', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#aaaaaa'
        });
        container.add(classText);
        this.heroClassText[side] = classText;

        // Level text (8px gold, right-aligned)
        var levelText = this.add.text(panelW - 10, 22, '', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#ffd700'
        });
        levelText.setOrigin(1, 0);
        container.add(levelText);
        this.heroLevelText[side] = levelText;

        // HP bar — 16px height
        var hpBarX = 10;
        var hpBarY = 40;
        var hpBarW = panelW - 20;
        var hpBarH = 16;

        var hpBg = this.add.graphics();
        hpBg.fillStyle(0x000000, 0.9);
        hpBg.fillRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 3);
        hpBg.lineStyle(1, borderColor, 0.15);
        hpBg.strokeRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 3);
        container.add(hpBg);

        var hpFill = this.add.graphics();
        container.add(hpFill);
        this.heroHPBar[side] = {
            fill: hpFill,
            x: hpBarX,
            y: hpBarY,
            w: hpBarW,
            h: hpBarH
        };

        var hpText = this.add.text(hpBarX + hpBarW / 2, hpBarY + hpBarH / 2, 'HP 0 / 0', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        hpText.setOrigin(0.5, 0.5);
        container.add(hpText);
        this.heroHPText[side] = hpText;

        // Energy bar — 12px height
        var enBarY = hpBarY + hpBarH + 3;
        var enBarH = 12;
        var enBg = this.add.graphics();
        enBg.fillStyle(0x000000, 0.85);
        enBg.fillRoundedRect(hpBarX, enBarY, hpBarW, enBarH, 2);
        enBg.lineStyle(1, 0xffcc00, 0.25);
        enBg.strokeRoundedRect(hpBarX, enBarY, hpBarW, enBarH, 2);
        container.add(enBg);
        var enFill = this.add.graphics();
        enFill.fillStyle(0xffcc00, 0.7);
        enFill.fillRoundedRect(hpBarX + 1, enBarY + 1, 0, enBarH - 2, 2);
        container.add(enFill);
        this['energyBar' + side] = { fill: enFill, x: hpBarX, y: enBarY, w: hpBarW, h: enBarH };

        // ATK / DEF stat badges — 14px height
        var statY = enBarY + enBarH + 4;
        var halfW = (hpBarW - 4) / 2;

        var atkBg = this.add.graphics();
        atkBg.fillStyle(0xff4444, 0.4);
        atkBg.fillRoundedRect(hpBarX, statY, halfW, 14, 3);
        atkBg.lineStyle(1, 0xff6644, 0.3);
        atkBg.strokeRoundedRect(hpBarX, statY, halfW, 14, 3);
        container.add(atkBg);

        var atkText = this.add.text(hpBarX + 4, statY + 3, '⚔ 0', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '7px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        container.add(atkText);

        var defBg = this.add.graphics();
        defBg.fillStyle(0x4488ff, 0.4);
        defBg.fillRoundedRect(hpBarX + halfW + 4, statY, halfW, 14, 3);
        defBg.lineStyle(1, 0x44aaff, 0.3);
        defBg.strokeRoundedRect(hpBarX + halfW + 4, statY, halfW, 14, 3);
        container.add(defBg);

        var defText = this.add.text(hpBarX + halfW + 8, statY + 3, '🛡 0', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '7px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        container.add(defText);

        this.heroStatText[side] = { atk: atkText, def: defText };

        this.heroPanel[side] = {
            container: container,
            x: panelX,
            y: panelY,
            w: panelW,
            h: panelH
        };
    },

    _updateHeroPanel: function (side, heroCard) {
        var panel = this.heroPanel[side];
        if (!panel) return;

        // Get the combatant for HP data
        var combatant = (side === 'player') ? this.playerData : this.enemyData;

        if (!heroCard && !combatant) {
            // Show empty state
            if (this.heroNameText[side]) this.heroNameText[side].setText('No Hero');
            if (this.heroHPText[side]) this.heroHPText[side].setText('HP 0 / 0');
            if (this.heroClassText[side]) this.heroClassText[side].setText('');
            if (this.heroLevelText[side]) this.heroLevelText[side].setText('');
            if (this.heroSprite[side]) this.heroSprite[side].setText('?');
            if (this.heroStatText[side]) {
                this.heroStatText[side].atk.setText('⚔ 0');
                this.heroStatText[side].def.setText('🛡 0');
            }
            this._drawHPBar(side, 0);
            return;
        }

        // Get display info from hero card, fallback to combatant
        var displayName = heroCard ? heroCard.name : (combatant ? combatant.name : 'Hero');
        var displayClass = heroCard ? heroCard.class : (combatant ? combatant.class : 'warrior');
        var displayLevel = heroCard ? (heroCard.level || 1) : 1;

        // Update name
        if (this.heroNameText[side]) {
            this.heroNameText[side].setText(displayName);
        }

        // Update class
        var cls = (typeof CLASSES !== 'undefined') ? CLASSES[displayClass] : null;
        if (this.heroClassText[side]) {
            this.heroClassText[side].setText(cls ? cls.name : (displayClass || 'Hero'));
            this.heroClassText[side].setColor(cls ? cls.color : '#aaaaaa');
        }

        // Update level
        if (this.heroLevelText[side]) {
            this.heroLevelText[side].setText(displayLevel > 1 ? 'Lv.' + displayLevel : '');
        }

        // Update sprite emoji
        if (this.heroSprite[side]) {
            var emoji = cls ? cls.emoji : '⚔';
            this.heroSprite[side].setText(emoji);
        }

        // Update HP from combatant (heroHp / heroMaxHp)
        var hp = 0;
        var maxHP = 1;
        if (combatant) {
            hp = combatant.heroHp || 0;
            maxHP = combatant.heroMaxHp || 1;
        }
        var pct = Math.max(0, Math.min(1, hp / maxHP));

        if (this.heroHPText[side]) {
            this.heroHPText[side].setText('HP ' + hp + ' / ' + maxHP);
        }

        this._drawHPBar(side, pct);

        // Update stats — use hero card stats for display
        var stats = heroCard ? heroCard.stats : {};
        var totalAtk = (stats.atk || 0);
        var totalDef = (stats.def || 0);
        if (this.heroStatText[side]) {
            this.heroStatText[side].atk.setText('⚔ ' + totalAtk);
            this.heroStatText[side].def.setText('🛡 ' + totalDef);
        }
    },

    _drawHPBar: function (side, pct) {
        var bar = this.heroHPBar[side];
        if (!bar) return;

        bar.fill.clear();
        if (pct > 0) {
            var color;
            if (pct > 0.55) {
                color = 0x22cc66;
            } else if (pct > 0.25) {
                color = 0xccaa22;
            } else {
                color = 0xcc2222;
            }
            bar.fill.fillStyle(color, 1);
            bar.fill.fillRect(bar.x + 1, bar.y + 1, (bar.w - 2) * pct, bar.h - 2);

            // Shine
            bar.fill.fillStyle(0xffffff, 0.08);
            bar.fill.fillRect(bar.x + 1, bar.y + 1, (bar.w - 2) * pct, (bar.h - 2) / 2);
        }
    },

    _createCenterDivider: function () {
        var W = this.W;
        var H = this.H;
        // VS centered in top zone, between hero panels
        var vsCenterX = W / 2;
        var vsCenterY = 82;

        // VS Emblem — large diamond (70px)
        var vsSize = 70;
        var vsContainer = this.add.container(vsCenterX, vsCenterY);
        vsContainer.setDepth(11);

        // Outer glow behind diamond — blue/cyan
        var vsOuterGlow = this.add.graphics();
        vsOuterGlow.fillStyle(0x00e5ff, 0.06);
        vsOuterGlow.fillCircle(0, 0, vsSize + 20);
        vsContainer.add(vsOuterGlow);

        // Diamond background
        var vsBg = this.add.graphics();
        vsBg.fillStyle(0x0a0a20, 0.95);
        vsBg.beginPath();
        vsBg.moveTo(vsSize, 0);
        vsBg.lineTo(0, vsSize * 0.55);
        vsBg.lineTo(-vsSize, 0);
        vsBg.lineTo(0, -vsSize * 0.55);
        vsBg.closePath();
        vsBg.fillPath();
        vsBg.lineStyle(2, 0x00e5ff, 0.9);
        vsBg.beginPath();
        vsBg.moveTo(vsSize, 0);
        vsBg.lineTo(0, vsSize * 0.55);
        vsBg.lineTo(-vsSize, 0);
        vsBg.lineTo(0, -vsSize * 0.55);
        vsBg.closePath();
        vsBg.strokePath();
        // Second stroke for glow
        vsBg.lineStyle(1, 0x00e5ff, 0.3);
        vsBg.beginPath();
        vsBg.moveTo(vsSize + 2, 0);
        vsBg.lineTo(0, vsSize * 0.55 + 2);
        vsBg.lineTo(-vsSize - 2, 0);
        vsBg.lineTo(0, -vsSize * 0.55 - 2);
        vsBg.closePath();
        vsBg.strokePath();
        vsContainer.add(vsBg);

        // "V" (white with blue glow)
        this.vsText = this.add.text(-14, 0, 'V', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.vsText.setOrigin(0.5, 0.5);
        vsContainer.add(this.vsText);

        // "S" (white with blue glow)
        var sText = this.add.text(16, 0, 'S', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        sText.setOrigin(0.5, 0.5);
        vsContainer.add(sText);

        // Animated glow ring around VS emblem
        this._vsEmblemGlow = this.add.graphics();
        this._vsEmblemGlow.setDepth(11);
        this._vsEmblemGlow.lineStyle(2, 0x00e5ff, 0.3);
        this._vsEmblemGlow.strokeCircle(vsCenterX, vsCenterY, vsSize + 15);

        // Outer glow ring
        this._vsEmblemGlow2 = this.add.graphics();
        this._vsEmblemGlow2.setDepth(11);
        this._vsEmblemGlow2.lineStyle(1, 0x00e5ff, 0.15);
        this._vsEmblemGlow2.strokeCircle(vsCenterX, vsCenterY, vsSize + 28);

        // Third outer ring (faint)
        this._vsEmblemGlow3 = this.add.graphics();
        this._vsEmblemGlow3.setDepth(11);
        this._vsEmblemGlow3.lineStyle(1, 0x00e5ff, 0.06);
        this._vsEmblemGlow3.strokeCircle(vsCenterX, vsCenterY, vsSize + 40);

        // Energy pulse lines extending horizontally from VS
        var pulseLine = this.add.graphics();
        pulseLine.setDepth(10);
        pulseLine.lineStyle(1, 0x00e5ff, 0.08);
        pulseLine.beginPath();
        pulseLine.moveTo(vsCenterX - 300, vsCenterY);
        pulseLine.lineTo(vsCenterX - vsSize - 15, vsCenterY);
        pulseLine.strokePath();
        pulseLine.beginPath();
        pulseLine.moveTo(vsCenterX + vsSize + 15, vsCenterY);
        pulseLine.lineTo(vsCenterX + 300, vsCenterY);
        pulseLine.strokePath();
        // Glow layer
        pulseLine.lineStyle(1, 0x00e5ff, 0.04);
        pulseLine.beginPath();
        pulseLine.moveTo(vsCenterX - 300, vsCenterY - 1);
        pulseLine.lineTo(vsCenterX - vsSize - 15, vsCenterY - 1);
        pulseLine.strokePath();
        pulseLine.beginPath();
        pulseLine.moveTo(vsCenterX + vsSize + 15, vsCenterY + 1);
        pulseLine.lineTo(vsCenterX + 300, vsCenterY + 1);
        pulseLine.strokePath();

        // Turn text — bottom area (clean)
        this.turnText = this.add.text(W / 2 - 80, 660, 'Turn 0', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '9px',
            color: 'rgba(255,255,255,0.5)'
        });
        this.turnText.setOrigin(0, 0.5);
        this.turnText.setDepth(10);

        // Phase text — bottom area (clean)
        this.phaseText = this.add.text(W / 2 + 20, 660, '', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '9px',
            color: '#00e5ff'
        });
        this.phaseText.setOrigin(0, 0.5);
        this.phaseText.setDepth(10);
    },

    updateCenterDivider: function (state) {
        if (this.turnText) this.turnText.setText('Turn ' + state.turn);
        if (this.phaseText) {
            var phaseNames = { draw: 'DRAW', energy: 'ENERGY', play: 'PLAY', arrange: 'ARRANGE', battle: 'BATTLE', result: 'RESULT' };
            this.phaseText.setText(phaseNames[state.phase] || '');
        }
    },

    _createSkillSlots: function () {
        // 5×5 grid — enemy game slots in row 0, player game slots in row 4
        var slotW = 164;
        var slotH = 90;
        var gap = 12;
        var startX = 206;
        var enemyRowY = 136;   // Row 0
        var playerRowY = 544;  // Row 4

        // Enemy slots (row 0) — indices 0-4
        for (var i = 0; i < 5; i++) {
            var sx = startX + i * (slotW + gap);
            this._drawSkillSlot(sx, enemyRowY, slotW, slotH, 'enemy', i);
        }

        // Player slots (row 4) — indices 0-4
        for (var i = 0; i < 5; i++) {
            var sx = startX + i * (slotW + gap);
            this._drawSkillSlot(sx, playerRowY, slotW, slotH, 'player', i);
        }
    },

    _drawSkillSlot: function (x, y, w, h, side, index) {
        var container = this.add.container(x, y);
        container.setDepth(3);

        var slotBorderColor = side === 'player' ? 0x00e5ff : 0xff44aa;

        var bg = this.add.graphics();
        // Active slot — #0d1525 background with subtle inner glow
        bg.fillStyle(0x0d1525, 0.8);
        bg.fillRect(0, 0, w, h);
        // Inner glow
        bg.fillStyle(slotBorderColor, 0.03);
        bg.fillRect(2, 2, w - 4, h - 4);
        bg.lineStyle(2, slotBorderColor, 0.35);
        bg.strokeRect(0, 0, w, h);
        // Corner accent marks
        var cornerSize = 10;
        bg.lineStyle(1, slotBorderColor, 0.55);
        // Top-left
        bg.beginPath(); bg.moveTo(0, cornerSize); bg.lineTo(0, 0); bg.lineTo(cornerSize, 0); bg.strokePath();
        // Top-right
        bg.beginPath(); bg.moveTo(w - cornerSize, 0); bg.lineTo(w, 0); bg.lineTo(w, cornerSize); bg.strokePath();
        // Bottom-left
        bg.beginPath(); bg.moveTo(0, h - cornerSize); bg.lineTo(0, h); bg.lineTo(cornerSize, h); bg.strokePath();
        // Bottom-right
        bg.beginPath(); bg.moveTo(w - cornerSize, h); bg.lineTo(w, h); bg.lineTo(w, h - cornerSize); bg.strokePath();
        container.add(bg);

        var slotData = {
            container: container,
            bg: bg,
            x: x,
            y: y,
            w: w,
            h: h,
            side: side,
            index: index,
        };

        // Interactive hover — player slots only during play/arrange
        if (side === 'player') {
            var hitArea = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0);
            hitArea.setInteractive({ useHandCursor: true });
            hitArea.setDepth(5);

            var self = this;

            var highlight = this.add.graphics();
            highlight.setDepth(4);
            highlight.setVisible(false);
            slotData.highlight = highlight;

            hitArea.on('pointerover', function () {
                var cfg = typeof POSITION_BONUSES !== 'undefined' ? POSITION_BONUSES[index] : null;
                if (!cfg) return;

                var isPlayPhase = BattleEngine.currentPhase === 'play' || BattleEngine.currentPhase === 'arrange';
                var board = BattleEngine.player ? BattleEngine.player.board : [];
                var isEmpty = !board[index];

                if (isPlayPhase && isEmpty) {
                    highlight.clear();
                    var color = Phaser.Display.Color.HexStringToColor(cfg.color).color;
                    highlight.lineStyle(2, color, 0.6);
                    highlight.strokeRect(x + 1, y + 1, w - 2, h - 2);
                    highlight.fillStyle(color, 0.08);
                    highlight.fillRect(x, y, w, h);
                    highlight.setVisible(true);

                    self._showSlotTooltip(x + w / 2, y - 8, cfg.name + '\n' + cfg.tooltip);
                } else if (isPlayPhase && !isEmpty) {
                    self._showSlotTooltip(x + w / 2, y - 8, cfg.name + ': OCCUPIED');
                }
            });

            hitArea.on('pointerout', function () {
                highlight.setVisible(false);
                self._hideSlotTooltip();
            });

            slotData.hitArea = hitArea;
        }

        this.skillSlots.push(slotData);
    },

    // ===== HTML TOOLTIP OVERLAY =====
    _tooltipEl: null,
    _showSlotTooltip: function (x, y, text) {
        var canvas = document.getElementById('battle-canvas-container');
        if (!canvas) return;
        var rect = canvas.getBoundingClientRect();
        var scaleX = rect.width / this.W;
        var scaleY = rect.height / this.H;

        if (!this._tooltipEl) {
            this._tooltipEl = document.createElement('div');
            this._tooltipEl.style.cssText = 'position:absolute;pointer-events:none;z-index:200;font-family:"Press Start 2P",monospace;font-size:8px;color:#fff;background:rgba(0,0,0,0.9);border:1px solid rgba(0,229,255,0.4);border-radius:4px;padding:6px 10px;text-align:center;white-space:pre-line;transition:opacity 0.15s;max-width:200px;';
            canvas.parentElement.style.position = 'relative';
            canvas.parentElement.appendChild(this._tooltipEl);
        }
        this._tooltipEl.textContent = text;
        this._tooltipEl.style.left = (rect.left - canvas.parentElement.getBoundingClientRect().left + x * scaleX) + 'px';
        this._tooltipEl.style.top = (rect.top - canvas.parentElement.getBoundingClientRect().top + y * scaleY) + 'px';
        this._tooltipEl.style.transform = 'translate(-50%, -100%)';
        this._tooltipEl.style.opacity = '1';
    },
    _hideSlotTooltip: function () {
        if (this._tooltipEl) this._tooltipEl.style.opacity = '0';
    },

    // ===== RENDER FIELD STATE =====
    renderField: function (player, enemy) {
        this.playerData = player;
        this.enemyData = enemy;

        var state = {
            player: player,
            enemy: enemy,
            turn: BattleEngine.turnNumber,
            phase: BattleEngine.currentPhase
        };

        // Update hero panels — use heroCard from combatant if available
        this._updateHeroPanel('player', player.heroCard || player);
        this._updateHeroPanel('enemy', enemy.heroCard || enemy);

        // Update center divider
        this.updateCenterDivider(state);

        // Render board units on the slots
        this._renderBoardUnits(player.board, 'player');
        this._renderBoardUnits(enemy.board, 'enemy');
    },

    // ===== RENDER UNITS ON BOARD SLOTS =====
    _boardUnitTexts: { player: [], enemy: [] },
    _arrangeHighlights: [],
    _selectedArrangeSlot: null,

    // Track previously rendered units for summon detection
    _prevBoardState: { player: [], enemy: [] },

    _renderBoardUnits: function (board, side) {
        var scene = this;
        var prevState = scene._prevBoardState[side] || [];

        // Clean up old unit texts for this side
        if (scene._boardUnitTexts[side]) {
            scene._boardUnitTexts[side].forEach(function (t) { if (t && t.destroy) t.destroy(); });
        }
        scene._boardUnitTexts[side] = [];

        // Clean up arrange highlights
        if (scene._arrangeHighlights) {
            scene._arrangeHighlights.forEach(function (h) { if (h && h.destroy) h.destroy(); });
            scene._arrangeHighlights = [];
        }

        // Find slots belonging to this side
        var sideSlots = scene.skillSlots.filter(function (s) { return s.side === side; });
        var isArrangePhase = BattleEngine.currentPhase === 'arrange';
        var isPlayerSide = side === 'player';

        // Clear arrange selection when not in arrange phase
        if (!isArrangePhase) {
            scene._selectedArrangeSlot = null;
        }

        for (var i = 0; i < board.length && i < sideSlots.length; i++) {
            var unit = board[i];
            var slot = sideSlots[i];
            if (!unit) continue;

            var cx = slot.x + slot.w / 2;
            var cy = slot.y + slot.h / 2;

            // Detect newly summoned unit (was null before, now has unit)
            var isNewSummon = !prevState[i] && unit;

            // Unit emoji sprite
            var emoji = unit.emoji || '⚔️';
            var unitText = scene.add.text(cx, cy - 10, emoji, {
                fontSize: '48px'
            });
            unitText.setOrigin(0.5, 0.5);
            scene._boardUnitTexts[side].push(unitText);

            // Summon animation for new units
            if (isNewSummon && typeof PhaserAnimations !== 'undefined') {
                unitText.setScale(0);
                unitText.setAlpha(0);
                (function (ut, sx, sy) {
                    // Expanding rings
                    for (var r = 0; r < 3; r++) {
                        (function (delay) {
                            scene.time.delayedCall(delay, function () {
                                var ring = scene.add.graphics();
                                ring.lineStyle(2, 0xffd700, 0.7);
                                ring.strokeCircle(0, 0, 8);
                                ring.setPosition(sx, sy);
                                ring.setDepth(29);
                                scene.tweens.add({
                                    targets: ring,
                                    scaleX: 4,
                                    scaleY: 4,
                                    alpha: 0,
                                    duration: 450,
                                    ease: 'Power2',
                                    onComplete: function () { ring.destroy(); }
                                });
                            });
                        })(r * 100);
                    }
                    // Flash
                    var fl = scene.add.graphics();
                    fl.fillStyle(0xffd700, 0.6);
                    fl.fillCircle(0, 0, 18);
                    fl.setPosition(sx, sy);
                    fl.setDepth(28);
                    scene.tweens.add({
                        targets: fl,
                        alpha: 0,
                        scaleX: 3,
                        scaleY: 3,
                        duration: 350,
                        onComplete: function () { fl.destroy(); }
                    });
                    // Scale-in emoji
                    scene.tweens.add({
                        targets: ut,
                        scaleX: 1.2,
                        scaleY: 1.2,
                        alpha: 1,
                        duration: 180,
                        ease: 'Back.easeOut',
                        onComplete: function () {
                            scene.tweens.add({
                                targets: ut,
                                scaleX: 1,
                                scaleY: 1,
                                duration: 100
                            });
                        }
                    });
                })(unitText, cx, cy);
            }

            // Unit name (truncated)
            var nameStr = (unit.name || '?').substring(0, 10);
            var nameText = scene.add.text(cx, cy + 24, nameStr, {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '9px',
                color: '#ffd700'
            });
            nameText.setOrigin(0.5, 0.5);
            scene._boardUnitTexts[side].push(nameText);

            // HP bar mini
            var hpPct = unit.hp / (unit.maxHp || 1);
            var barW = slot.w - 16;
            var barH = 10;
            var barX = slot.x + 8;
            var barY = slot.y + slot.h - 16;

            var hpBg = scene.add.graphics();
            hpBg.fillStyle(0x330000, 0.8);
            hpBg.fillRect(barX, barY, barW, barH);
            scene._boardUnitTexts[side].push(hpBg);

            var hpFill = scene.add.graphics();
            var hpColor = hpPct > 0.5 ? 0x00ff88 : (hpPct > 0.25 ? 0xffaa00 : 0xff3333);
            hpFill.fillStyle(hpColor, 0.9);
            hpFill.fillRect(barX, barY, barW * Math.max(0, hpPct), barH);
            scene._boardUnitTexts[side].push(hpFill);

            // ATK badge
            var atkText = scene.add.text(slot.x + 8, slot.y + 6, '⚔' + (unit.atk || 0), {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '9px',
                color: '#ff6644'
            });
            atkText.setOrigin(0, 0);
            scene._boardUnitTexts[side].push(atkText);

            // === ARRANGE PHASE: Make player slots clickable for swap ===
            if (isArrangePhase && isPlayerSide) {
                // Create invisible interactive zone over every player slot (occupied or empty)
                var hitZone = scene.add.zone(slot.x + slot.w / 2, slot.y + slot.h / 2, slot.w, slot.h);
                hitZone.setInteractive({ useHandCursor: !!unit });
                hitZone.setDepth(100);

                var slotIndex = i;
                hitZone.on('pointerdown', function () {
                    if (scene._selectedArrangeSlot === null || scene._selectedArrangeSlot === undefined) {
                        // First selection — only if slot has a unit
                        if (!unit) return;
                        scene._selectedArrangeSlot = slotIndex;
                        // Re-render to show highlight
                        scene._renderBoardUnits(scene.playerData.board, 'player');
                    } else if (scene._selectedArrangeSlot === slotIndex) {
                        // Deselect
                        scene._selectedArrangeSlot = null;
                        scene._renderBoardUnits(scene.playerData.board, 'player');
                    } else {
                        // Swap!
                        var from = scene._selectedArrangeSlot;
                        var to = slotIndex;
                        scene._selectedArrangeSlot = null;
                        BattleEngine.rearrangeUnit(from, to);
                        // renderField called via _notifyFieldUpdate
                    }
                });

                scene._boardUnitTexts[side].push(hitZone);
            }
        }

        // Re-draw selection highlight if a slot is selected (survives re-render)
        if (isArrangePhase && isPlayerSide && (scene._selectedArrangeSlot || scene._selectedArrangeSlot === 0)) {
            var selIdx = scene._selectedArrangeSlot;
            if (selIdx < sideSlots.length) {
                var selSlot = sideSlots[selIdx];
                var selHl = scene.add.graphics();
                selHl.lineStyle(2, 0xffd700, 1);
                selHl.strokeRect(selSlot.x - 1, selSlot.y - 1, selSlot.w + 2, selSlot.h + 2);
                selHl.setDepth(99);
                scene._arrangeHighlights.push(selHl);
            }
        }

        // Arrange phase instruction text
        if (isArrangePhase && isPlayerSide) {
            var instrText = scene.add.text(scene.W / 2, scene.H - 48, '✦ TAP TO SELECT • TAP AGAIN TO SWAP ✦', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '7px',
                color: '#ffd700',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 2
            });
            instrText.setOrigin(0.5, 0.5);
            instrText.setAlpha(0.9);
            instrText.setDepth(90);
            scene._boardUnitTexts[side].push(instrText);
        }

        // Save current state for next summon detection
        scene._prevBoardState[side] = board.map(function (u) { return !!u; });
    },

    // ===== PHASE BANNER =====
    showPhaseBanner: function (text, isPlayer) {
        if (this.phaseBanner) {
            this.phaseBanner.destroy();
            this.phaseBanner = null;
        }

        var color = isPlayer ? '#ffd700' : '#88ccff';
        var banner = this.add.text(this.W / 2, this.H / 2, text.toUpperCase(), {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '20px',
            color: color,
            fontStyle: 'bold'
        });
        banner.setOrigin(0.5, 0.5);
        banner.setAlpha(0);
        banner.setScale(0.5);
        banner.setShadow(0, 0, color, 20);

        var backdrop = this.add.graphics();
        backdrop.fillStyle(0x000000, 0);
        backdrop.fillRect(0, this.H / 2 - 20, this.W, 40);

        this.phaseBanner = banner;
        this.phaseBanner._backdrop = backdrop;

        var scene = this;

        this.tweens.add({
            targets: banner,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: function () {
                scene.time.delayedCall(600, function () {
                    scene.tweens.add({
                        targets: banner,
                        alpha: 0,
                        scaleX: 1.2,
                        scaleY: 1.2,
                        duration: 400,
                        onComplete: function () {
                            if (backdrop) backdrop.destroy();
                            banner.destroy();
                            if (scene.phaseBanner === banner) scene.phaseBanner = null;
                        }
                    });
                });
            }
        });

        this.tweens.add({
            targets: backdrop,
            alpha: 0.5,
            duration: 300,
            yoyo: true,
            hold: 600
        });
    },

    // ===== DAMAGE NUMBERS =====
    spawnDamageNumber: function (x, y, amount, isCrit) {
        var color = isCrit ? '#ff4444' : '#ffffff';
        var fontSize = isCrit ? '16px' : '12px';

        var dmgText = this.add.text(x, y, String(amount), {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: fontSize,
            color: color,
            fontStyle: 'bold',
            stroke: isCrit ? '#cc0000' : '#000000',
            strokeThickness: 3
        });
        dmgText.setOrigin(0.5, 0.5);
        if (isCrit) dmgText.setScale(1.3);

        this.tweens.add({
            targets: dmgText,
            y: y - 60,
            alpha: 0,
            scaleX: isCrit ? 1.6 : 1.2,
            scaleY: isCrit ? 1.6 : 1.2,
            duration: 1500,
            ease: 'Power2',
            onComplete: function () { dmgText.destroy(); }
        });
    },

    spawnHealNumber: function (x, y, amount) {
        var dmgText = this.add.text(x, y, '+' + amount, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '12px',
            color: '#44ff88',
            fontStyle: 'bold',
            stroke: '#006622',
            strokeThickness: 3
        });
        dmgText.setOrigin(0.5, 0.5);

        this.tweens.add({
            targets: dmgText,
            y: y - 50,
            alpha: 0,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 1200,
            ease: 'Power2',
            onComplete: function () { dmgText.destroy(); }
        });
    },

    // ===== ATTACK ANIMATION (Enhanced: Anticipation → Dash → Projectile → Impact) =====
    playAttack: function (attackIdx, targetIdx, isPlayerAttacking, damage, isCrit) {
        var scene = this;

        // Get hero panel positions
        var srcPanel = isPlayerAttacking ? this.heroPanel.player : this.heroPanel.enemy;
        var tgtPanel = isPlayerAttacking ? this.heroPanel.enemy : this.heroPanel.player;

        if (!srcPanel || !tgtPanel) return;

        var srcX = srcPanel.x + srcPanel.w / 2;
        var srcY = srcPanel.y + srcPanel.h / 2;
        var tgtX = tgtPanel.x + tgtPanel.w / 2;
        var tgtY = tgtPanel.y + tgtPanel.h / 2;

        // PHASE 1: ANTICIPATION — pulse glow on attacker slot (0-120ms)
        var anticipGlow = scene.add.graphics();
        anticipGlow.fillStyle(isPlayerAttacking ? 0x44aaff : 0xff4444, 0.3);
        anticipGlow.fillRect(srcPanel.x, srcPanel.y, srcPanel.w, srcPanel.h);
        anticipGlow.setDepth(40);
        anticipGlow.setAlpha(0);

        scene.tweens.add({
            targets: anticipGlow,
            alpha: 1,
            duration: 60,
            yoyo: true,
            repeat: 1,
            onComplete: function () { anticipGlow.destroy(); }
        });

        // Attacker slot border flash
        var srcBorder = scene.add.graphics();
        srcBorder.lineStyle(3, isCrit ? 0xffd700 : 0xffaa44, 1);
        srcBorder.strokeRect(srcPanel.x + 1, srcPanel.y + 1, srcPanel.w - 2, srcPanel.h - 2);
        srcBorder.setDepth(41);
        srcBorder.setAlpha(0);

        scene.tweens.add({
            targets: srcBorder,
            alpha: 1,
            duration: 60,
            yoyo: true,
            repeat: 1,
            onComplete: function () { srcBorder.destroy(); }
        });

        // PHASE 2: DASH FORWARD — ghost silhouette rushes toward target (120-320ms)
        scene.time.delayedCall(120, function () {
            var dashEmoji = isPlayerAttacking ? '⚔️' : '💀';
            var ghost = scene.add.text(srcX, srcY, dashEmoji, { fontSize: '32px' });
            ghost.setOrigin(0.5, 0.5);
            ghost.setAlpha(0.5);
            ghost.setDepth(50);

            // Trail particles during dash
            scene.tweens.add({
                targets: ghost,
                x: tgtX + (isPlayerAttacking ? -30 : 30),
                y: tgtY,
                duration: 180,
                ease: 'Power3',
                onUpdate: function () {
                    if (Math.random() > 0.3) {
                        var px = ghost.x + (Math.random() - 0.5) * 12;
                        var py = ghost.y + (Math.random() - 0.5) * 12;
                        var p = scene.add.graphics();
                        p.fillStyle(isCrit ? 0xff4444 : 0xffd700, 0.7);
                        p.fillCircle(0, 0, 1 + Math.random() * 2);
                        p.setPosition(px, py);
                        p.setDepth(49);
                        scene.tweens.add({
                            targets: p,
                            alpha: 0,
                            scaleX: 0,
                            scaleY: 0,
                            duration: 180,
                            onComplete: function () { p.destroy(); }
                        });
                    }
                },
                onComplete: function () {
                    ghost.destroy();

                    // PHASE 3: PROJECTILE + IMPACT (320ms)
                    scene.time.delayedCall(40, function () {
                        scene._fireProjectile(srcX, srcY, tgtX, tgtY, tgtPanel, damage, isCrit);
                    });
                }
            });
        });
    },

    // Internal: projectile trail → impact → damage number → slash → particles
    _fireProjectile: function (srcX, srcY, tgtX, tgtY, tgtPanel, damage, isCrit) {
        var scene = this;

        // Projectile orb
        var orb = scene.add.graphics();
        orb.fillStyle(isCrit ? 0xff4444 : 0xffffff, 1);
        orb.fillCircle(0, 0, isCrit ? 10 : 7);
        orb.setPosition(srcX, srcY);
        orb.setDepth(52);

        // Trail line
        var trail = scene.add.graphics();
        trail.setDepth(51);

        scene.tweens.add({
            targets: orb,
            x: tgtX,
            y: tgtY,
            duration: 200,
            ease: 'Power2',
            onUpdate: function (tw) {
                var prog = tw.progress;
                var cx = srcX + (tgtX - srcX) * prog;
                var cy = srcY + (tgtY - srcY) * prog;
                trail.clear();
                trail.lineStyle(isCrit ? 4 : 2, isCrit ? 0xff4444 : 0xffffff, 0.7);
                trail.beginPath();
                trail.moveTo(srcX, srcY);
                trail.lineTo(cx, cy);
                trail.strokePath();
            },
            onComplete: function () {
                orb.destroy();
                trail.destroy();
                scene._impactEffects(tgtX, tgtY, tgtPanel, damage, isCrit);
            }
        });
    },

    // Internal: all impact effects (hit flash, damage number, slash, particles, shake)
    _impactEffects: function (tgtX, tgtY, tgtPanel, damage, isCrit) {
        var scene = this;

        // Damage number
        scene.spawnDamageNumber(tgtX + (Math.random() - 0.5) * 30, tgtY - 20, damage, isCrit);

        // Crit burst particles (DOM overlay)
        if (isCrit && typeof BattleAnimations !== 'undefined') {
            BattleAnimations.spawnCritBurst(tgtX, tgtY);
        }

        // Screen shake
        scene.triggerShake(isCrit ? 12 : 5, isCrit ? 0.8 : 0.4);

        // Hit flash on target panel
        var impactFlash = scene.add.graphics();
        impactFlash.setDepth(53);
        impactFlash.fillStyle(isCrit ? 0xff3232 : 0xffffff, isCrit ? 0.55 : 0.4);
        impactFlash.fillRect(tgtPanel.x, tgtPanel.y, tgtPanel.w, tgtPanel.h);

        scene.tweens.add({
            targets: impactFlash,
            alpha: 0,
            duration: isCrit ? 350 : 250,
            ease: 'Power2',
            onComplete: function () { impactFlash.destroy(); }
        });

        // Energy burst rings on impact point
        var burstColor = isCrit ? 0xff4444 : 0xffffff;
        for (var r = 0; r < 2; r++) {
            (function (delay) {
                scene.time.delayedCall(delay, function () {
                    var ring = scene.add.graphics();
                    ring.lineStyle(isCrit ? 3 : 2, burstColor, 0.7);
                    ring.strokeCircle(0, 0, 10);
                    ring.setPosition(tgtX, tgtY);
                    ring.setDepth(54);

                    scene.tweens.add({
                        targets: ring,
                        scaleX: 3.5,
                        scaleY: 3.5,
                        alpha: 0,
                        duration: 300,
                        ease: 'Power2',
                        onComplete: function () { ring.destroy(); }
                    });
                });
            })(r * 80);
        }

        // Slash X mark
        var slash = scene.add.graphics();
        slash.setDepth(55);
        var slashColor = isCrit ? 0xff2222 : 0xffffff;
        var slashSize = isCrit ? 22 : 16;
        slash.lineStyle(isCrit ? 4 : 3, slashColor, 0.9);
        slash.beginPath();
        slash.moveTo(tgtX - slashSize, tgtY - slashSize);
        slash.lineTo(tgtX + slashSize, tgtY + slashSize);
        slash.strokePath();
        slash.beginPath();
        slash.moveTo(tgtX + slashSize, tgtY - slashSize);
        slash.lineTo(tgtX - slashSize, tgtY + slashSize);
        slash.strokePath();

        scene.tweens.add({
            targets: slash,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 400,
            ease: 'Power2',
            onComplete: function () { slash.destroy(); }
        });

        // Particle burst
        var particleCount = isCrit ? 16 : 10;
        var particleColor = isCrit ? 0xff4444 : 0xffd700;
        for (var p = 0; p < particleCount; p++) {
            (function (index) {
                var angle = (index / particleCount) * Math.PI * 2;
                var speed = 40 + Math.random() * 60;
                var particle = scene.add.graphics();
                var pSize = isCrit ? 3 + Math.random() * 3 : 2 + Math.random() * 2;
                particle.fillStyle(particleColor, 0.9);
                particle.fillCircle(0, 0, pSize);
                particle.setPosition(tgtX, tgtY);
                particle.setDepth(56);

                scene.tweens.add({
                    targets: particle,
                    x: tgtX + Math.cos(angle) * speed,
                    y: tgtY + Math.sin(angle) * speed,
                    alpha: 0,
                    scaleX: 0.2,
                    scaleY: 0.2,
                    duration: 350 + Math.random() * 200,
                    ease: 'Power2',
                    onComplete: function () { particle.destroy(); }
                });
            })(p);
        }

        // Brief full-screen flash
        var fullFlash = scene.add.graphics();
        fullFlash.setDepth(47);
        fullFlash.fillStyle(isCrit ? 0xff2222 : 0xffffff, isCrit ? 0.1 : 0.06);
        fullFlash.fillRect(0, 0, scene.W, scene.H);
        scene.tweens.add({
            targets: fullFlash,
            alpha: 0,
            duration: 150,
            onComplete: function () { fullFlash.destroy(); }
        });
    },

    // ===== DEATH FADE ANIMATION =====
    deathFade: function (side, slotIndex, emoji, cb) {
        var scene = this;
        var sideSlots = scene.skillSlots.filter(function (s) { return s.side === side; });
        if (slotIndex >= sideSlots.length) { if (cb) cb(); return; }

        var slot = sideSlots[slotIndex];
        var cx = slot.x + slot.w / 2;
        var cy = slot.y + slot.h / 2;

        // Red flash on slot
        var redFlash = scene.add.graphics();
        redFlash.fillStyle(0xff0000, 0.4);
        redFlash.fillRect(slot.x, slot.y, slot.w, slot.h);
        redFlash.setDepth(54);
        scene.tweens.add({
            targets: redFlash,
            alpha: 0,
            duration: 200,
            onComplete: function () { redFlash.destroy(); }
        });

        // Ghost emoji fade + shrink
        var ghost = scene.add.text(cx, cy - 8, emoji || '💀', { fontSize: '38px' });
        ghost.setOrigin(0.5, 0.5);
        ghost.setDepth(57);

        scene.tweens.add({
            targets: ghost,
            alpha: 0,
            scaleX: 0.2,
            scaleY: 0.2,
            duration: 500,
            ease: 'Power2'
        });

        // Dissolve particles (gray squares floating up)
        for (var i = 0; i < 10; i++) {
            (function (delay) {
                scene.time.delayedCall(delay, function () {
                    var px = scene.add.graphics();
                    px.fillStyle(0x888888, 0.8);
                    px.fillRect(-2, -2, 4, 4);
                    px.setPosition(cx + (Math.random() - 0.5) * 40, cy + (Math.random() - 0.5) * 30);
                    px.setDepth(58);
                    scene.tweens.add({
                        targets: px,
                        y: px.y - 30 - Math.random() * 40,
                        x: px.x + (Math.random() - 0.5) * 40,
                        alpha: 0,
                        duration: 400 + Math.random() * 200,
                        onComplete: function () { px.destroy(); }
                    });
                });
            })(i * 40);
        }

        // Skull pop-up
        scene.time.delayedCall(200, function () {
            var skull = scene.add.text(cx, cy, '💀', { fontSize: '18px' });
            skull.setOrigin(0.5, 0.5);
            skull.setDepth(59);
            skull.setAlpha(0);
            scene.tweens.add({
                targets: skull,
                y: cy - 25,
                alpha: 1,
                duration: 300,
                ease: 'Power2',
                onComplete: function () {
                    scene.tweens.add({
                        targets: skull,
                        y: cy - 45,
                        alpha: 0,
                        duration: 300,
                        delay: 200,
                        onComplete: function () {
                            skull.destroy();
                            ghost.destroy();
                            if (cb) cb();
                        }
                    });
                }
            });
        });

        // Fallback cleanup — prevent double cb call
        var _deathFadeDone = false;
        scene.time.delayedCall(800, function () {
            if (_deathFadeDone) return;
            _deathFadeDone = true;
            if (ghost.active) ghost.destroy();
            if (cb) cb();
        });
        // Wrap original cb to mark as done
        var origCb = cb;
        cb = function () {
            if (_deathFadeDone) return;
            _deathFadeDone = true;
            if (origCb) origCb();
        };
    },

    // ===== VICTORY CELEBRATION =====
    playVictory: function (cb) {
        var scene = this;
        var W = scene.W;
        var H = scene.H;

        // Gold confetti rain
        var confettiColors = [0xffd700, 0xffaa00, 0x44ff88, 0x44aaff, 0xff44aa, 0xffffff];
        for (var i = 0; i < 40; i++) {
            (function (delay) {
                scene.time.delayedCall(delay, function () {
                    var color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
                    var size = 2 + Math.random() * 4;
                    var cp = scene.add.graphics();
                    cp.fillStyle(color, 0.9);
                    if (Math.random() > 0.5) {
                        cp.fillRect(-size / 2, -size / 2, size, size);
                    } else {
                        cp.fillCircle(0, 0, size / 2);
                    }
                    cp.setPosition(Math.random() * W, -10);
                    cp.setDepth(110);
                    cp.setAngle(Math.random() * 360);
                    scene.tweens.add({
                        targets: cp,
                        y: H + 20,
                        x: cp.x + (Math.random() - 0.5) * 100,
                        angle: cp.angle + 360 + Math.random() * 360,
                        duration: 1500 + Math.random() * 1000,
                        onComplete: function () { cp.destroy(); }
                    });
                });
            })(i * 40);
        }

        // Gold screen pulse
        var pulse = scene.add.graphics();
        pulse.fillStyle(0xffd700, 0.12);
        pulse.fillRect(0, 0, W, H);
        pulse.setDepth(108);
        pulse.setAlpha(0);
        scene.tweens.add({
            targets: pulse,
            alpha: 1,
            duration: 300,
            yoyo: true,
            repeat: 2,
            onComplete: function () { pulse.destroy(); }
        });

        // VICTORY text
        scene.time.delayedCall(300, function () {
            var txt = scene.add.text(W / 2, H / 2 - 20, '🏆 VICTORY!', {
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

            scene.tweens.add({
                targets: txt,
                scaleX: 1.1,
                scaleY: 1.1,
                alpha: 1,
                duration: 400,
                ease: 'Back.easeOut',
                onComplete: function () {
                    scene.tweens.add({
                        targets: txt,
                        scaleX: 1.2,
                        scaleY: 1.2,
                        duration: 200,
                        yoyo: true,
                        repeat: -1
                    });
                }
            });
        });

        // Star burst
        scene.time.delayedCall(600, function () {
            for (var j = 0; j < 8; j++) {
                (function (delay) {
                    scene.time.delayedCall(delay, function () {
                        var star = scene.add.text(
                            W / 2 + (Math.random() - 0.5) * 200,
                            H / 2 + (Math.random() - 0.5) * 100,
                            '⭐',
                            { fontSize: '16px' }
                        );
                        star.setOrigin(0.5, 0.5);
                        star.setDepth(112);
                        star.setAlpha(0);
                        scene.tweens.add({
                            targets: star,
                            y: star.y - 60,
                            alpha: 1,
                            duration: 400,
                            ease: 'Power2',
                            onComplete: function () {
                                scene.tweens.add({
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
                })(j * 80);
            }
        });

        scene.cameras.main.shake(800, 0.012);
        scene.time.delayedCall(2500, function () { if (cb) cb(); });
    },

    // ===== DEFEAT ANIMATION =====
    playDefeat: function (cb) {
        var scene = this;
        var W = scene.W;
        var H = scene.H;

        // Red vignette
        var vignette = scene.add.graphics();
        vignette.fillStyle(0x880000, 0.4);
        vignette.fillCircle(0, 0, W * 0.8);
        vignette.fillCircle(W, 0, W * 0.8);
        vignette.fillCircle(0, H, W * 0.8);
        vignette.fillCircle(W, H, W * 0.8);
        vignette.setDepth(107);
        vignette.setAlpha(0);
        scene.tweens.add({
            targets: vignette,
            alpha: 1,
            duration: 800,
            ease: 'Power2'
        });

        // Red overlay
        var redOvl = scene.add.graphics();
        redOvl.fillStyle(0xff0000, 0.08);
        redOvl.fillRect(0, 0, W, H);
        redOvl.setDepth(108);
        redOvl.setAlpha(0);
        scene.tweens.add({
            targets: redOvl,
            alpha: 1,
            duration: 600
        });

        // Screen shake
        scene.cameras.main.shake(1000, 0.008);

        // DEFEAT text
        scene.time.delayedCall(400, function () {
            var txt = scene.add.text(W / 2, H / 2 - 20, '💀 DEFEAT', {
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

            scene.tweens.add({
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
                scene.time.delayedCall(delay, function () {
                    var rp = scene.add.graphics();
                    rp.fillStyle(0xff3333, 0.6);
                    rp.fillRect(-1, -1, 2, 6);
                    rp.setPosition(Math.random() * W, -10);
                    rp.setDepth(106);
                    scene.tweens.add({
                        targets: rp,
                        y: H + 10,
                        alpha: 0,
                        duration: 1000 + Math.random() * 500,
                        onComplete: function () { rp.destroy(); }
                    });
                });
            })(i * 60);
        }

        scene.time.delayedCall(2500, function () { if (cb) cb(); });
    },

    // ===== SCREEN SHAKE =====
    triggerShake: function (intensity, duration) {
        this.cameras.main.shake(duration * 1000, intensity / 1000);
    },

    // ===== GET HERO POSITION (for damage numbers) =====
    getHeroZonePosition: function (zoneIndex, isPlayer) {
        var panel = isPlayer ? this.heroPanel.player : this.heroPanel.enemy;
        if (!panel) return { x: this.W / 2, y: this.H / 2 };
        return {
            x: panel.x + panel.w / 2,
            y: panel.y + panel.h / 2
        };
    },

    // ===== TRANSITION =====
    showTransition: function (type, onComplete) {
        if (type === 'enter') {
            this._showCountdownSequence(onComplete);
        } else {
            var overlay = this.add.graphics();
            overlay.fillStyle(0x000000, 1);
            overlay.fillRect(0, 0, this.W, this.H);
            overlay.setDepth(100);
            overlay.setAlpha(0);
            this.tweens.add({
                targets: overlay,
                alpha: 1,
                duration: 800,
                onComplete: function () {
                    overlay.destroy();
                    if (onComplete) onComplete();
                }
            });
        }
    },

    // ===== COUNTDOWN 3-2-1 SEQUENCE =====
    _showCountdownSequence: function (onComplete) {
        var W = this.W;
        var H = this.H;
        var scene = this;

        var overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 1);
        overlay.fillRect(0, 0, W, H);
        overlay.setDepth(100);

        this.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 600,
            onComplete: function () { overlay.destroy(); }
        });

        var numbers = ['3', '2', '1'];
        var colors = ['#ff4444', '#ffaa00', '#44ff88'];
        var glows = ['#ff0000', '#ff8800', '#00ff44'];
        var delay = 700;

        for (var i = 0; i < numbers.length; i++) {
            (function (index) {
                scene.time.delayedCall(600 + index * delay, function () {
                    scene._showCountdownNumber(numbers[index], colors[index], glows[index]);
                });
            })(i);
        }

        scene.time.delayedCall(600 + numbers.length * delay + 200, function () {
            scene._showFightText();
        });

        var totalTime = 600 + numbers.length * delay + 200 + 1200;
        scene.time.delayedCall(totalTime, function () {
            if (onComplete) onComplete();
        });
    },

    _showCountdownNumber: function (num, color, glowColor) {
        var W = this.W;
        var H = this.H;
        var scene = this;

        var text = this.add.text(W / 2, H / 2, num, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '72px',
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
        text.setOrigin(0.5, 0.5);
        text.setDepth(102);
        text.setScale(0.3);
        text.setAlpha(0);
        text.setShadow(0, 0, glowColor, 20, true, true, 8);

        var ring = this.add.graphics();
        ring.lineStyle(3, Phaser.Display.Color.HexStringToColor(glowColor).color, 0.6);
        ring.strokeCircle(0, 0, 50);
        ring.setPosition(W / 2, H / 2);
        ring.setDepth(101);
        ring.setAlpha(0);
        ring.setScale(0.5);

        var backdrop = this.add.graphics();
        backdrop.fillStyle(Phaser.Display.Color.HexStringToColor(glowColor).color, 0.05);
        backdrop.fillRect(0, 0, W, H);
        backdrop.setDepth(100);
        backdrop.setAlpha(0);

        this.tweens.add({
            targets: text,
            scaleX: 1.1,
            scaleY: 1.1,
            alpha: 1,
            duration: 200,
            ease: 'Back.easeOut',
            onComplete: function () {
                scene.tweens.add({
                    targets: text,
                    scaleX: 1.8,
                    scaleY: 1.8,
                    alpha: 0,
                    duration: 400,
                    delay: 200,
                    ease: 'Power2',
                    onComplete: function () { text.destroy(); }
                });
            }
        });

        this.tweens.add({
            targets: ring,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0.8,
            duration: 200,
            ease: 'Power2',
            onComplete: function () {
                scene.tweens.add({
                    targets: ring,
                    scaleX: 3,
                    scaleY: 3,
                    alpha: 0,
                    duration: 500,
                    onComplete: function () { ring.destroy(); }
                });
            }
        });

        this.tweens.add({
            targets: backdrop,
            alpha: 0.3,
            duration: 150,
            yoyo: true,
            onComplete: function () { backdrop.destroy(); }
        });
    },

    _showFightText: function () {
        var W = this.W;
        var H = this.H;
        var scene = this;

        var text = this.add.text(W / 2, H / 2, 'FIGHT!', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '48px',
            color: '#ffd700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        });
        text.setOrigin(0.5, 0.5);
        text.setDepth(102);
        text.setScale(0.2);
        text.setAlpha(0);
        text.setShadow(0, 0, '#ffd700', 30, true, true, 10);

        var screenFlash = this.add.graphics();
        screenFlash.fillStyle(0xffd700, 0.15);
        screenFlash.fillRect(0, 0, W, H);
        screenFlash.setDepth(100);
        screenFlash.setAlpha(0);

        this.cameras.main.shake(600, 0.008);

        this.tweens.add({
            targets: text,
            scaleX: 1.15,
            scaleY: 1.15,
            alpha: 1,
            duration: 250,
            ease: 'Back.easeOut',
            onComplete: function () {
                scene.tweens.add({
                    targets: text,
                    scaleX: 2.5,
                    scaleY: 2.5,
                    alpha: 0,
                    duration: 800,
                    delay: 400,
                    ease: 'Power3',
                    onComplete: function () { text.destroy(); }
                });
            }
        });

        this.tweens.add({
            targets: screenFlash,
            alpha: 0.4,
            duration: 150,
            yoyo: true,
            onComplete: function () { screenFlash.destroy(); }
        });
    },


    // ===== UPDATE LOOP =====
    update: function (time, delta) {
        if (this._innerRing) {
            var innerScale = 1 + Math.sin(time * 0.003) * 0.08;
            this._innerRing.setScale(innerScale);
            this._innerRing.setAlpha(0.15 + Math.sin(time * 0.004) * 0.1);
        }

        if (this._enemyHeroBorder) {
            var borderAlpha = 0.6 + Math.sin(time * 0.005) * 0.2;
            this._enemyHeroBorder.setAlpha(borderAlpha);
        }

        // VS emblem glow pulse
        if (this._vsEmblemGlow) {
            var glowAlpha = 0.2 + Math.sin(time * 0.004) * 0.15;
            this._vsEmblemGlow.setAlpha(glowAlpha);
        }
        if (this._vsEmblemGlow2) {
            var glow2Alpha = 0.1 + Math.sin(time * 0.003 + 1) * 0.1;
            this._vsEmblemGlow2.setAlpha(glow2Alpha);
        }
        if (this._vsEmblemGlow3) {
            var glow3Alpha = 0.05 + Math.sin(time * 0.002 + 2) * 0.05;
            this._vsEmblemGlow3.setAlpha(glow3Alpha);
        }
    }

});
