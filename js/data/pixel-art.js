/**
 * PIXEL RAID — Unit Pixel Art (Generated SVG Data URIs)
 * 8x8 pixel art sprites for each unit card
 * No external dependencies, no image generation API needed
 */

const PIXEL_ART = (() => {
    // 8x8 pixel patterns: 0=transparent, 1=dark, 2=body, 3=light, 4=accent
    const patterns = {
        goblin_scout: [
            '00044000',
            '00222200',
            '02122120',
            '00222200',
            '00244200',
            '02222220',
            '01200210',
            '01100110',
        ],
        slime: [
            '00000000',
            '00033300',
            '00333330',
            '03311330',
            '03333330',
            '03333330',
            '00333300',
            '00000000',
        ],
        skeleton: [
            '00222200',
            '02222220',
            '02122120',
            '02222220',
            '00200200',
            '00222200',
            '02011020',
            '02000020',
        ],
        goblin_warrior: [
            '00444400',
            '00222200',
            '02122120',
            '00222200',
            '00244200',
            '02222220',
            '01200210',
            '01100110',
        ],
        forest_archer: [
            '00033000',
            '00222200',
            '02122120',
            '00222200',
            '00244200',
            '02222220',
            '00200200',
            '00100100',
        ],
        skeleton_knight: [
            '02222220',
            '22222222',
            '23222232',
            '22222222',
            '02200220',
            '02222220',
            '02011020',
            '02000020',
        ],
        fire_imp: [
            '04000040',
            '00222200',
            '02122120',
            '00222200',
            '00244200',
            '02222220',
            '01200210',
            '01100110',
        ],
        iron_sentinel: [
            '02222220',
            '22222222',
            '23222232',
            '22222222',
            '24222422',
            '22222222',
            '02200220',
            '02200220',
        ],
        goblin_shaman: [
            '00444400',
            '00222200',
            '02122120',
            '00222200',
            '00244200',
            '02222220',
            '00200200',
            '00100100',
        ],
        wolf_rider: [
            '00022000',
            '00222200',
            '02122120',
            '02222220',
            '02244220',
            '22222222',
            '21000012',
            '21000012',
        ],
        dark_knight: [
            '02222220',
            '22222222',
            '23422432',
            '22222222',
            '22222222',
            '02222220',
            '02200220',
            '02200220',
        ],
        necromancer: [
            '00044000',
            '00222200',
            '02122120',
            '00222200',
            '00224200',
            '02222220',
            '00200200',
            '00100100',
        ],
        war_golem: [
            '22222222',
            '22222222',
            '23222232',
            '22222222',
            '24222242',
            '22222222',
            '22200222',
            '22200222',
        ],
        goblin_chief: [
            '44444444',
            '00222200',
            '02122120',
            '00222200',
            '00244200',
            '02222220',
            '01200210',
            '01100110',
        ],
        dire_wolf: [
            '20000002',
            '02222220',
            '23222232',
            '22222222',
            '02244220',
            '02222220',
            '21000012',
            '21000012',
        ],
        paladin: [
            '44444444',
            '02222220',
            '03222230',
            '02222220',
            '02244220',
            '02222220',
            '02200220',
            '02200220',
        ],
        vampire_lord: [
            '20000002',
            '02222220',
            '02122120',
            '02222220',
            '02200220',
            '02222220',
            '02011020',
            '02000020',
        ],
        mech_titan: [
            '22222222',
            '24222422',
            '22233222',
            '22222222',
            '24222422',
            '22222222',
            '22200222',
            '22200222',
        ],
        dragon_whelp: [
            '20000002',
            '02222220',
            '03322330',
            '02222220',
            '02244220',
            '02222220',
            '21200212',
            '01000010',
        ],
        lich_king: [
            '00044000',
            '02222220',
            '02122120',
            '02222220',
            '02244220',
            '02222220',
            '02011020',
            '02000020',
        ],
    };

    // Color palettes per unit: [dark, body, light, accent]
    const palettes = {
        goblin_scout:   ['#2d5a27', '#66aa44', '#88cc66', '#ffcc00'],
        slime:          ['#228855', '#44cc88', '#88ffdd', '#ffffff'],
        skeleton:       ['#999988', '#ccccaa', '#ffffff', '#ff4444'],
        goblin_warrior: ['#338822', '#55aa33', '#77cc55', '#ffcc00'],
        forest_archer:  ['#228844', '#44aa66', '#66cc88', '#88eeaa'],
        skeleton_knight:['#888888', '#aaaaaa', '#cccccc', '#ff6644'],
        fire_imp:       ['#cc3322', '#ff6644', '#ff8866', '#ffcc00'],
        iron_sentinel:  ['#666688', '#8888aa', '#aabbee', '#4444aa'],
        goblin_shaman:  ['#66aa22', '#88cc44', '#aadd66', '#ff88ff'],
        wolf_rider:     ['#886633', '#aa8855', '#ccaa77', '#ff4444'],
        dark_knight:    ['#442266', '#664488', '#8866aa', '#cc0000'],
        necromancer:    ['#7722aa', '#9944aa', '#bb66cc', '#ff00ff'],
        war_golem:      ['#555577', '#777799', '#9999bb', '#ffcc00'],
        goblin_chief:   ['#228800', '#44aa22', '#66cc44', '#ffd700'],
        dire_wolf:      ['#664422', '#886644', '#aa8866', '#ff4444'],
        paladin:        ['#bb8822', '#ddaa44', '#ffcc66', '#ffffff'],
        vampire_lord:   ['#990022', '#cc2244', '#ee4466', '#ff0000'],
        mech_titan:     ['#334488', '#5566aa', '#7788cc', '#00ffff'],
        dragon_whelp:   ['#cc2200', '#ff4422', '#ff6644', '#ffd700'],
        lich_king:      ['#4400aa', '#6622cc', '#8844ee', '#00ff88'],
    };

    const PX = 8; // pixel size in SVG units
    const SIZE = 64; // total SVG size

    function makeSVG(unitId) {
        const pattern = patterns[unitId];
        const colors = palettes[unitId];
        if (!pattern || !colors) return null;
        const [dark, body, light, accent] = colors;

        let rects = '';
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const c = pattern[y][x];
                if (c === '0') continue;
                let fill;
                if (c === '1') fill = dark;
                else if (c === '2') fill = body;
                else if (c === '3') fill = light;
                else if (c === '4') fill = accent;
                else continue;
                rects += `<rect x="${x * PX}" y="${y * PX}" width="${PX}" height="${PX}" fill="${fill}"/>`;
            }
        }

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0f3460"/>${rects}</svg>`;
        return 'data:image/svg+xml,' + encodeURIComponent(svg);
    }

    // Build lookup
    const art = {};
    for (const id of Object.keys(patterns)) {
        art[id] = makeSVG(id);
    }
    return art;
})();
