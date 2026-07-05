/* ========================================
 * Phaser Battle Scene — WebGL battle field renderer
 * Hero-as-Entity Edition (v5)
 * Each side has one hero entity with HP bar
 * Skills activate in the center battlefield
 * ======================================== */

const PhaserBattleScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function PhaserBattleScene() {
        Phaser.Scene.call(this, { key: 'PhaserBattleScene' });

        // Layout constants
        this.W = 800;
        this.H = 500;

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

        // === LAYER 0: VOID BACKGROUND (#07071a) ===
        var voidBg = this.add.graphics();
        voidBg.setDepth(0);
        voidBg.fillStyle(0x07071a, 1);
        voidBg.fillRect(0, 0, W, H);

        // === STAR PARTICLES (~40 tiny dots, fade in/out, drift down) ===
        this.starParticles = [];
        var starColors = [0x4ECDC4, 0xFFD700, 0x9B59B6];
        for (var si = 0; si < 40; si++) {
            var sColor = starColors[si % 3];
            var sGfx = this.add.graphics();
            sGfx.fillStyle(sColor, 1);
            sGfx.fillRect(-1, -1, 2, 2);
            sGfx.setPosition(Math.random() * W, Math.random() * H);
            sGfx.setDepth(0);
            sGfx.setAlpha(0.1 + Math.random() * 0.5);
            this.starParticles.push({
                gfx: sGfx,
                speed: 0.15 + Math.random() * 0.4,
                baseAlpha: 0.1 + Math.random() * 0.5,
                fadeDir: Math.random() > 0.5 ? 1 : -1,
                fadeSpeed: 0.003 + Math.random() * 0.008
            });
        }

        // === LAYER 1: ARENA FLOOR ===
        this.bgGraphics = this.add.graphics();
        this.bgGraphics.setDepth(1);
        this._drawBackground();

        // === LAYER 2: MAGICAL CIRCLE (static parts) ===
        this.gridGraphics = this.add.graphics();
        this.gridGraphics.setDepth(2);
        this._drawGrid();

        // === ZONE OUTLINES (depth 3) ===
        var zones = this.add.graphics();
        zones.setDepth(3);

        // Monster Zone 1 (enemy): x=124, y=32, w=100, h=140 — red pulsing
        this._enemyMZ1Gfx = this.add.graphics();
        this._enemyMZ1Gfx.setDepth(3);
        this._drawMZZone(this._enemyMZ1Gfx, 124, 32, 100, 140, 0xE94560, true);
        // "M" label
        this.add.text(174, 102, 'M', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#E94560',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5).setDepth(3);

        // Monster Zone 2 (enemy): x=228, y=32, w=100, h=140 — teal standby
        zones.lineStyle(2, 0x4ECDC4, 0.5);
        zones.strokeRect(228, 32, 100, 140);

        // Monster Zone 1 (player): x=128, y=188, w=100, h=140 — teal pulse
        zones.lineStyle(2, 0x4ECDC4, 0.7);
        zones.strokeRect(128, 188, 100, 140);

        // Monster Zone 2 (player): x=232, y=188, w=100, h=140 — teal standby
        zones.lineStyle(2, 0x4ECDC4, 0.5);
        zones.strokeRect(232, 188, 100, 140);

        // Skill/Trap Zone 1 (enemy): x=362, y=136, w=96, h=65
        zones.lineStyle(1, 0x9B59B6, 0.6);
        zones.strokeRect(362, 136, 96, 65);

        // Skill/Trap Zone 2 (player): x=366, y=204, w=96, h=68
        zones.lineStyle(1, 0x9B59B6, 0.6);
        zones.strokeRect(366, 204, 96, 68);

        // GY + Field Slot (enemy): x=462, y=32, w=94, h=140
        zones.lineStyle(1, 0x4ECDC4, 0.4);
        zones.strokeRect(462, 32, 94, 140);
        zones.lineStyle(1, 0x4ECDC4, 0.3);
        zones.beginPath();
        zones.moveTo(462, 102);
        zones.lineTo(556, 102);
        zones.strokePath();
        zones.lineStyle(1, 0x4ECDC4, 0.2);
        zones.strokeRect(467, 110, 84, 12);
        zones.strokeRect(467, 124, 84, 12);
        zones.strokeRect(467, 138, 84, 12);

        // GY + Field Slot (player): x=466, y=188, w=94, h=140
        zones.lineStyle(1, 0x4ECDC4, 0.4);
        zones.strokeRect(466, 188, 94, 140);
        zones.lineStyle(1, 0x4ECDC4, 0.3);
        zones.beginPath();
        zones.moveTo(466, 258);
        zones.lineTo(560, 258);
        zones.strokePath();
        zones.lineStyle(1, 0x4ECDC4, 0.2);
        zones.strokeRect(471, 266, 84, 12);
        zones.strokeRect(471, 280, 84, 12);
        zones.strokeRect(471, 294, 84, 12);

        // === PHASE BAR (y=0, h=28, full width) ===
        var phaseBar = this.add.graphics();
        phaseBar.setDepth(4);
        phaseBar.fillStyle(0x0a0a20, 1);
        phaseBar.fillRect(0, 0, W, 28);
        var tabLabels = ['DRAW', 'ENERGY', 'PLAY', 'ARRANGE', 'BATTLE', 'RESULT'];
        for (var p = 0; p < tabLabels.length; p++) {
            var tabX = 40 + p * 95;
            phaseBar.lineStyle(1, 0x4ECDC4, 0.3);
            phaseBar.strokeRect(tabX, 3, 88, 22);
            this.add.text(tabX + 44, 14, tabLabels[p], {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '6px',
                color: '#888899'
            }).setOrigin(0.5, 0.5).setDepth(4);
        }
        this.add.text(14, 14, '⚙', {
            fontSize: '12px',
            color: '#666688'
        }).setOrigin(0.5, 0.5).setDepth(4);
        this.add.text(W - 30, 14, '◆', {
            fontSize: '10px',
            color: '#ffd700'
        }).setOrigin(0.5, 0.5).setDepth(4);

        // === CARD HAND ZONE BACKGROUND (y=340) ===
        phaseBar.fillStyle(0x0a0a20, 1);
        phaseBar.fillRect(0, 340, W, H - 340);

        // === CENTER DIVIDER ===
        this._createCenterDivider();

        // === HERO PANELS ===
        this._createHeroPanel('player', false);
        this._createHeroPanel('enemy', true);

        // === SKILL SLOTS (board unit zones) ===
        this._createSkillSlots();
    },

    _drawMZZone: function (gfx, x, y, w, h, color, cornerDots) {
        gfx.lineStyle(2, color, 0.7);
        gfx.strokeRect(x, y, w, h);
        if (cornerDots) {
            var dotSize = 4;
            gfx.fillStyle(color, 0.8);
            gfx.fillRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
            gfx.fillRect(x + w - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
            gfx.fillRect(x - dotSize / 2, y + h - dotSize / 2, dotSize, dotSize);
            gfx.fillRect(x + w - dotSize / 2, y + h - dotSize / 2, dotSize, dotSize);
        }
    },

    _drawBackground: function () {
        var g = this.bgGraphics;
        var W = this.W;
        g.clear();

        // Arena floor: x=60, y=28, w=680, h=310 — #131328
        g.fillStyle(0x131328, 1);
        g.fillRect(60, 28, 680, 310);

        // Horizontal thin lines every ~63px (stone slab effect, #1a1a3a, opacity 0.3)
        g.lineStyle(1, 0x1a1a3a, 0.3);
        for (var ly = 91; ly < 338; ly += 63) {
            g.beginPath();
            g.moveTo(60, ly);
            g.lineTo(740, ly);
            g.strokePath();
        }

        // Vertical thin lines at x=170, 340, 510 (column dividers)
        g.lineStyle(1, 0x1a1a3a, 0.3);
        g.beginPath();
        g.moveTo(170, 28);
        g.lineTo(170, 338);
        g.strokePath();
        g.beginPath();
        g.moveTo(340, 28);
        g.lineTo(340, 338);
        g.strokePath();
        g.beginPath();
        g.moveTo(510, 28);
        g.lineTo(510, 338);
        g.strokePath();

        // Random crack/retak paths for aged stone texture (2-3 cracks)
        g.lineStyle(1, 0x1a1a3a, 0.4);
        g.beginPath();
        g.moveTo(200, 100);
        g.lineTo(215, 115);
        g.lineTo(210, 135);
        g.lineTo(225, 150);
        g.strokePath();
        g.beginPath();
        g.moveTo(450, 200);
        g.lineTo(460, 215);
        g.lineTo(455, 235);
        g.lineTo(470, 250);
        g.lineTo(465, 260);
        g.strokePath();
        g.beginPath();
        g.moveTo(600, 80);
        g.lineTo(615, 95);
        g.lineTo(610, 110);
        g.strokePath();
    },

    _drawGrid: function () {
        var g = this.gridGraphics;
        g.clear();

        var cx = 400;
        var cy = 183;

        // Outer ring: teal (#4ECDC4), radiusX=130, radiusY=80
        g.lineStyle(1, 0x4ECDC4, 0.25);
        g.strokeEllipse(cx, cy, 260, 160);

        // Mid ring: gold (#FFD700), radiusX=90, radiusY=55
        g.lineStyle(1, 0xFFD700, 0.2);
        g.strokeEllipse(cx, cy, 180, 110);

        // Inner ring: purple (#9B59B6), radiusX=50, radiusY=30 — separate for pulse
        this._innerRing = this.add.graphics();
        this._innerRing.setDepth(2);
        this._innerRing.lineStyle(1, 0x9B59B6, 0.3);
        this._innerRing.strokeEllipse(0, 0, 100, 60);
        this._innerRing.setPosition(cx, cy);

        // 4 spoke lines from center to cardinal directions (to outer ring)
        g.lineStyle(1, 0x4ECDC4, 0.15);
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(cx, cy - 80);
        g.strokePath();
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(cx, cy + 80);
        g.strokePath();
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(cx - 130, cy);
        g.strokePath();
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(cx + 130, cy);
        g.strokePath();

        // Rune dots 6x6px at each spoke endpoint (alternating teal/gold)
        var runeColors = [0x4ECDC4, 0xFFD700, 0x4ECDC4, 0xFFD700];
        var runePositions = [
            { x: cx, y: cy - 80 },
            { x: cx, y: cy + 80 },
            { x: cx - 130, y: cy },
            { x: cx + 130, y: cy }
        ];
        for (var r = 0; r < runePositions.length; r++) {
            g.fillStyle(runeColors[r], 0.5);
            g.fillRect(runePositions[r].x - 3, runePositions[r].y - 3, 6, 6);
        }
    },

    _createHeroPanel: function (side, isTop) {
        var scene = this;
        var panelW, panelH, panelX, panelY;

        if (side === 'player') {
            panelX = 560;
            panelY = 188;
            panelW = 120;
            panelH = 150;
        } else {
            panelX = 0;
            panelY = 28;
            panelW = 120;
            panelH = 152;
        }

        var container = this.add.container(panelX, panelY);
        container.setDepth(5);

        // Panel background
        var bg = this.add.graphics();
        bg.fillStyle(0x0a0a1e, 0.92);
        bg.fillRect(0, 0, panelW, panelH);
        container.add(bg);

        // Border — enemy: red (#E94560), player: teal (#4ECDC4)
        var borderColor = side === 'player' ? 0x4ECDC4 : 0xE94560;
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

        // Class color strip at top
        var strip = this.add.graphics();
        strip.fillStyle(borderColor, 0.6);
        strip.fillRect(0, 0, panelW, 3);
        container.add(strip);

        // Hero art area
        var artBg = this.add.graphics();
        artBg.fillStyle(0x0f3460, 1);
        artBg.fillRect(10, 5, panelW - 20, 85);
        artBg.lineStyle(1, 0xc8a832, 0.5);
        artBg.strokeRect(10, 5, panelW - 20, 85);
        container.add(artBg);

        var spriteText = this.add.text(panelW / 2, 48, '⚔', {
            fontSize: '20px',
            color: side === 'player' ? 'rgba(78,205,196,0.3)' : 'rgba(233,69,96,0.3)'
        });
        spriteText.setOrigin(0.5, 0.5);
        container.add(spriteText);
        this.heroSprite[side] = spriteText;

        // Name text
        var nameText = this.add.text(10, 93, 'Hero', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '7px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        container.add(nameText);
        this.heroNameText[side] = nameText;

        // Class + Level
        var classText = this.add.text(10, 105, '', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '5px',
            color: '#aaaaaa'
        });
        container.add(classText);
        this.heroClassText[side] = classText;

        var levelText = this.add.text(panelW - 10, 105, '', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '5px',
            color: '#ffd700'
        });
        levelText.setOrigin(1, 0);
        container.add(levelText);
        this.heroLevelText[side] = levelText;

        // HP bar
        var hpBarX = 10;
        var hpBarY = 115;
        var hpBarW = panelW - 20;
        var hpBarH = 14;

        var hpBg = this.add.graphics();
        hpBg.fillStyle(0x000000, 0.9);
        hpBg.fillRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 3);
        hpBg.lineStyle(1, 0xffffff, 0.2);
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
            fontSize: '6px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        hpText.setOrigin(0.5, 0.5);
        container.add(hpText);
        this.heroHPText[side] = hpText;

        // ATK / DEF stats row
        var statY = hpBarY + hpBarH + 3;
        var halfW = (hpBarW - 4) / 2;

        var atkBg = this.add.graphics();
        atkBg.fillStyle(0xE94560, 0.5);
        atkBg.fillRect(hpBarX, statY, halfW, 10);
        container.add(atkBg);

        var atkText = this.add.text(hpBarX + 3, statY + 1, '⚔ 0', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '6px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        container.add(atkText);

        var defBg = this.add.graphics();
        defBg.fillStyle(0x4488ff, 0.5);
        defBg.fillRect(hpBarX + halfW + 4, statY, halfW, 10);
        container.add(defBg);

        var defText = this.add.text(hpBarX + halfW + 7, statY + 1, '🛡 0', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '6px',
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
        var dividerY = 181;

        // Gold line at y=181, full width, opacity 0.45
        var line = this.add.graphics();
        line.setDepth(3);
        line.fillStyle(0xFFD700, 0.45);
        line.fillRect(0, dividerY, W, 2);

        // Node dots 6x6px at intervals (alternating gold and teal)
        var dotColors = [0xFFD700, 0x4ECDC4];
        for (var d = 0; d < W; d += 60) {
            var dotColor = dotColors[(d / 60) % 2 === 0 ? 0 : 1];
            line.fillStyle(dotColor, 0.6);
            line.fillRect(d + 30, dividerY - 2, 6, 6);
        }

        // VS Emblem: x=305, y=168, w=70, h=32
        var vsContainer = this.add.container(305, 168);
        vsContainer.setDepth(6);

        var vsBg = this.add.graphics();
        vsBg.fillStyle(0x0a0a20, 0.95);
        vsBg.fillRect(0, 0, 70, 32);
        vsBg.lineStyle(2, 0xFFD700, 0.8);
        vsBg.strokeRect(0, 0, 70, 32);
        vsBg.lineStyle(1, 0x4ECDC4, 0.5);
        vsBg.strokeRect(3, 3, 64, 26);
        // Corner dots 4x4px
        vsBg.fillStyle(0xFFD700, 0.7);
        vsBg.fillRect(-2, -2, 4, 4);
        vsBg.fillRect(68, -2, 4, 4);
        vsBg.fillRect(-2, 30, 4, 4);
        vsBg.fillRect(68, 30, 4, 4);
        vsContainer.add(vsBg);

        // "V" (gold)
        this.vsText = this.add.text(18, 16, 'V', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: '#FFD700',
            fontStyle: 'bold'
        });
        this.vsText.setOrigin(0.5, 0.5);
        vsContainer.add(this.vsText);

        // "S" (teal)
        var sText = this.add.text(52, 16, 'S', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: '#4ECDC4',
            fontStyle: 'bold'
        });
        sText.setOrigin(0.5, 0.5);
        vsContainer.add(sText);

        // VS glow animation
        this._vsEmblemGlow = this.add.graphics();
        this._vsEmblemGlow.setDepth(5);
        this._vsEmblemGlow.lineStyle(2, 0x4ECDC4, 0.3);
        this._vsEmblemGlow.strokeRect(303, 166, 74, 36);

        // Turn text (left of center on divider)
        this.turnText = this.add.text(W / 2 - 80, dividerY + 1, 'Turn 0', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '7px',
            color: 'rgba(255,255,255,0.6)'
        });
        this.turnText.setOrigin(0, 0.5);
        this.turnText.setDepth(6);

        // Phase text (right of center on divider)
        this.phaseText = this.add.text(W / 2 + 80, dividerY + 1, '', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '7px',
            color: 'rgba(78,205,196,0.8)'
        });
        this.phaseText.setOrigin(0, 0.5);
        this.phaseText.setDepth(6);

        // Energy Bar: x=470, y=176, w=84, h=14
        var energyBar = this.add.graphics();
        energyBar.setDepth(4);
        energyBar.fillStyle(0xFFD700, 0.3);
        energyBar.fillRect(470, 176, 84, 14);
        energyBar.lineStyle(1, 0xFFD700, 0.5);
        energyBar.strokeRect(470, 176, 84, 14);
    },

    updateCenterDivider: function (state) {
        if (this.turnText) this.turnText.setText('Turn ' + state.turn);
        if (this.phaseText) {
            var phaseNames = { draw: 'DRAW', energy: 'ENERGY', play: 'PLAY', arrange: 'ARRANGE', battle: 'BATTLE', result: 'RESULT' };
            this.phaseText.setText(phaseNames[state.phase] || '');
        }
    },

    _createSkillSlots: function () {
        // 2 monster zones per side for board units
        // Player: MZ1 at x=128, y=188; MZ2 at x=232, y=188
        // Enemy: MZ1 at x=124, y=32; MZ2 at x=228, y=32
        var playerMZs = [
            { x: 128, y: 188, w: 100, h: 140 },
            { x: 232, y: 188, w: 100, h: 140 }
        ];
        var enemyMZs = [
            { x: 124, y: 32, w: 100, h: 140 },
            { x: 228, y: 32, w: 100, h: 140 }
        ];

        for (var i = 0; i < enemyMZs.length; i++) {
            var mz = enemyMZs[i];
            this._drawSkillSlot(mz.x, mz.y, mz.w, mz.h, 'enemy', i);
        }
        for (var i = 0; i < playerMZs.length; i++) {
            var mz = playerMZs[i];
            this._drawSkillSlot(mz.x, mz.y, mz.w, mz.h, 'player', i);
        }
    },

    _drawSkillSlot: function (x, y, w, h, side, index) {
        var container = this.add.container(x, y);
        container.setDepth(3);

        var bg = this.add.graphics();
        bg.fillStyle(0x141432, 0.3);
        bg.fillRect(0, 0, w, h);
        bg.lineStyle(1, side === 'player' ? 0x4ECDC4 : 0xE94560, 0.15);
        bg.strokeRect(0, 0, w, h);
        container.add(bg);

        var icon = this.add.text(w / 2, h / 2, '✨', {
            fontSize: '24px',
            color: 'rgba(155,89,182,0.15)'
        });
        icon.setOrigin(0.5, 0.5);
        container.add(icon);

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
        var scaleX = rect.width / 800;
        var scaleY = rect.height / 500;

        if (!this._tooltipEl) {
            this._tooltipEl = document.createElement('div');
            this._tooltipEl.style.cssText = 'position:absolute;pointer-events:none;z-index:200;font-family:"Press Start 2P",monospace;font-size:8px;color:#fff;background:rgba(0,0,0,0.9);border:1px solid rgba(255,215,0,0.4);border-radius:4px;padding:6px 10px;text-align:center;white-space:pre-line;transition:opacity 0.15s;max-width:200px;';
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
            var unitText = scene.add.text(cx, cy - 8, emoji, {
                fontSize: '38px'
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
            var nameText = scene.add.text(cx, cy + 20, nameStr, {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '8px',
                color: '#ffd700'
            });
            nameText.setOrigin(0.5, 0.5);
            scene._boardUnitTexts[side].push(nameText);

            // HP bar mini
            var hpPct = unit.hp / (unit.maxHp || 1);
            var barW = slot.w - 12;
            var barH = 7;
            var barX = slot.x + 6;
            var barY = slot.y + slot.h - 12;

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
            var atkText = scene.add.text(slot.x + 6, slot.y + 4, '⚔' + (unit.atk || 0), {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '8px',
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
        // (a) Pulse magical circle inner ring
        if (this._innerRing) {
            var ringAlpha = 0.15 + Math.sin(time * 0.003) * 0.15;
            this._innerRing.setAlpha(ringAlpha);
        }

        // (b) Pulse enemy hero panel border
        if (this._enemyHeroBorder) {
            var borderAlpha = 0.5 + Math.sin(time * 0.004) * 0.3;
            this._enemyHeroBorder.setAlpha(borderAlpha);
        }

        // (c) Update star particles — drift down, fade in/out
        if (this.starParticles) {
            for (var i = 0; i < this.starParticles.length; i++) {
                var star = this.starParticles[i];
                star.gfx.y += star.speed;
                if (star.gfx.y > this.H + 5) {
                    star.gfx.y = -5;
                    star.gfx.x = Math.random() * this.W;
                }
                var t = (time * 0.001 + i * 1.7) % (Math.PI * 2);
                var alpha = 0.1 + Math.abs(Math.sin(t)) * 0.5;
                star.gfx.setAlpha(alpha);
            }
        }
    }

});
