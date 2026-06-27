#!/usr/bin/env python3
"""Pixel Raid - Asset Generator
Generates 20 character sprites (64x64) and 5 backgrounds (1920x600)
"""
from PIL import Image, ImageDraw
import random
import os

S = 64  # sprite size

def px(draw, x, y, color, size=1):
    """Draw a pixel block"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=color)

def rect(draw, x1, y1, x2, y2, color):
    draw.rectangle([x1, y1, x2, y2], fill=color)

# ─── BASE BODY HELPERS ───

def draw_body(draw, skin=(210,170,130), armor=None, pants=None):
    """Draw standard humanoid body at center"""
    # Head
    rect(draw, 26, 8, 37, 19, skin)
    # Eyes
    px(draw, 28, 14, (255,255,255)); px(draw, 29, 14, (255,255,255))
    px(draw, 34, 14, (255,255,255)); px(draw, 35, 14, (255,255,255))
    px(draw, 29, 14, (40,40,60)); px(draw, 35, 14, (40,40,60))
    # Mouth
    px(draw, 30, 17, (180,120,100)); px(draw, 31, 17, (180,120,100)); px(draw, 32, 17, (180,120,100))
    # Neck
    rect(draw, 30, 20, 33, 21, skin)
    # Torso
    torso_color = armor or (150,120,90)
    rect(draw, 24, 22, 39, 37, torso_color)
    # Arms
    arm_color = skin
    rect(draw, 20, 22, 23, 35, arm_color)
    rect(draw, 40, 22, 43, 35, arm_color)
    # Pants
    pants_color = pants or (80,70,60)
    rect(draw, 26, 38, 32, 50, pants_color)
    rect(draw, 33, 38, 37, 50, pants_color)
    # Boots
    rect(draw, 25, 51, 32, 55, (60,50,40))
    rect(draw, 33, 51, 39, 55, (60,50,40))

def draw_hair(draw, color, style="short"):
    if style == "short":
        rect(draw, 25, 5, 38, 10, color)
    elif style == "long":
        rect(draw, 25, 5, 38, 10, color)
        rect(draw, 24, 10, 26, 20, color)
        rect(draw, 37, 10, 39, 20, color)
    elif style == "spiky":
        rect(draw, 25, 5, 38, 9, color)
        px(draw, 26, 3, color); px(draw, 30, 2, color); px(draw, 34, 3, color); px(draw, 37, 4, color)
    elif style == "bald":
        pass
    elif style == "hood":
        rect(draw, 23, 4, 40, 12, color)
        rect(draw, 23, 12, 26, 18, color)
        rect(draw, 37, 12, 40, 18, color)

def draw_helmet(draw, color, visor=None):
    rect(draw, 23, 4, 40, 12, color)
    rect(draw, 24, 12, 25, 16, color)
    rect(draw, 38, 12, 39, 16, color)
    if visor:
        rect(draw, 27, 12, 36, 15, visor)

# ─── CHARACTER DEFINITIONS ───

def iron_knight():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_helmet(d, (140,140,150), visor=(60,60,80))
    draw_body(d, skin=(200,170,140), armor=(120,50,50), pants=(100,40,40))
    # Shield (left)
    rect(d, 12, 22, 20, 35, (160,160,170))
    rect(d, 14, 24, 18, 33, (180,180,190))
    px(d, 16, 28, (200,180,50))
    # Sword (right)
    rect(d, 42, 15, 44, 38, (200,200,210))
    rect(d, 40, 38, 46, 40, (160,140,50))
    rect(d, 42, 40, 44, 42, (100,80,40))
    return img

def berserker():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_hair(d, (180,80,30), "spiky")
    draw_body(d, skin=(220,180,140), armor=(150,50,40), pants=(100,60,40))
    # Bare arms look - overwrite with skin
    rect(d, 20, 22, 23, 35, (220,180,140))
    rect(d, 40, 22, 43, 35, (220,180,140))
    # Dual axes
    rect(d, 10, 20, 12, 40, (120,80,40))
    rect(d, 8, 18, 14, 22, (180,180,190))
    rect(d, 51, 20, 53, 40, (120,80,40))
    rect(d, 49, 18, 55, 22, (180,180,190))
    return img

def paladin():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_helmet(d, (200,190,100), visor=(80,60,20))
    draw_body(d, skin=(210,180,150), armor=(200,190,100), pants=(180,170,80))
    # Holy sword with glow
    rect(d, 44, 10, 46, 42, (240,240,200))
    rect(d, 42, 42, 48, 44, (200,180,80))
    # Cross on armor
    px(d, 30, 26, (240,240,200)); px(d, 31, 26, (240,240,200)); px(d, 32, 26, (240,240,200))
    px(d, 31, 24, (240,240,200)); px(d, 31, 25, (240,240,200))
    px(d, 31, 27, (240,240,200)); px(d, 31, 28, (240,240,200))
    return img

def dark_knight():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_helmet(d, (50,50,60), visor=(200,30,30))
    draw_body(d, skin=(160,140,130), armor=(40,40,50), pants=(30,30,40))
    # Dark sword
    rect(d, 44, 12, 46, 44, (80,80,100))
    rect(d, 42, 44, 48, 46, (60,40,40))
    # Spikes on shoulders
    px(d, 22, 19, (60,60,70)); px(d, 42, 19, (60,60,70))
    return img

def fire_mage():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_hair(d, (200,80,30), "long")
    # Pointy hat
    rect(d, 26, 0, 37, 6, (150,50,50))
    rect(d, 28, -2, 35, 0, (150,50,50))
    px(d, 31, -3, (200,80,30))
    draw_body(d, skin=(210,180,150), armor=(150,50,50), pants=(130,40,40))
    # Fire staff
    rect(d, 12, 14, 14, 55, (120,80,40))
    # Fire on top
    px(d, 11, 10, (255,100,30)); px(d, 12, 9, (255,200,50)); px(d, 13, 10, (255,150,30))
    px(d, 12, 11, (255,80,20)); px(d, 12, 8, (255,255,100))
    return img

def ice_witch():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_hair(d, (150,200,240), "long")
    # Hat
    rect(d, 26, 0, 37, 6, (80,130,180))
    rect(d, 29, -2, 34, 0, (100,150,200))
    draw_body(d, skin=(200,210,230), armor=(80,130,180), pants=(70,120,170))
    # Ice crystal
    px(d, 48, 20, (180,230,255)); px(d, 47, 21, (150,210,240)); px(d, 49, 21, (150,210,240))
    px(d, 48, 18, (200,240,255)); px(d, 46, 22, (130,190,230)); px(d, 50, 22, (130,190,230))
    px(d, 48, 22, (170,220,250))
    return img

def lightning_lord():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_hair(d, (220,200,50), "spiky")
    draw_body(d, skin=(200,180,150), armor=(60,60,120), pants=(50,50,100))
    # Lightning bolt in hand
    pts = [(48,18),(50,24),(46,26),(50,32),(44,36),(48,30),(44,28)]
    d.polygon(pts, fill=(255,255,100))
    # Cape
    rect(d, 22, 22, 24, 50, (50,50,100))
    rect(d, 39, 22, 41, 50, (50,50,100))
    return img

def void_sorcerer():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_hood(d, (60,30,80))
    draw_body(d, skin=(170,150,190), armor=(60,30,80), pants=(50,25,70))
    # Overwrite face area with shadow
    rect(d, 27, 12, 36, 18, (30,15,40))
    # Eyes glow
    px(d, 29, 14, (200,100,255)); px(d, 34, 14, (200,100,255))
    # Purple orb
    rect(d, 46, 24, 52, 30, (150,50,200))
    rect(d, 47, 23, 51, 31, (180,80,230))
    px(d, 49, 26, (230,180,255))
    return img

def draw_hood(draw, color):
    rect(draw, 23, 4, 40, 12, color)
    rect(draw, 23, 12, 26, 18, color)
    rect(draw, 37, 12, 40, 18, color)

def wind_ranger():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_hair(d, (80,160,80), "long")
    draw_body(d, skin=(200,180,150), armor=(80,140,70), pants=(70,120,60))
    # Bow
    d.arc([46, 14, 58, 40], -70, 70, fill=(140,100,50), width=2)
    d.line([(52,14),(52,40)], fill=(180,180,160), width=1)
    # Arrow
    d.line([(48,28),(10,28)], fill=(160,130,80), width=1)
    # Hood
    rect(d, 24, 4, 38, 8, (60,120,50))
    return img

def shadow_sniper():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_hair(d, (40,40,50), "short")
    draw_body(d, skin=(180,160,140), armor=(50,50,60), pants=(40,40,50))
    # Crossbow
    rect(d, 42, 26, 58, 29, (100,80,50))
    d.line([(42,26),(38,18)], fill=(100,80,50), width=2)
    d.line([(42,29),(38,38)], fill=(100,80,50), width=2)
    # Scope
    px(d, 50, 24, (150,150,160))
    return img

def beast_tamer():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_hair(d, (160,120,60), "short")
    draw_body(d, skin=(200,175,145), armor=(120,100,60), pants=(100,85,50))
    # Small bow on back
    d.arc([16, 14, 24, 38], 110, 250, fill=(140,100,50), width=2)
    # Whistle
    rect(d, 44, 20, 48, 22, (200,180,100))
    px(d, 49, 21, (200,180,100))
    # Fur collar
    rect(d, 24, 20, 39, 23, (180,150,100))
    return img

def storm_archer():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_hair(d, (100,150,200), "spiky")
    draw_body(d, skin=(200,180,150), armor=(60,100,140), pants=(50,80,120))
    # Electric bow
    d.arc([46, 14, 58, 40], -70, 70, fill=(100,180,255), width=2)
    # Electric effect
    pts = [(52,16),(50,22),(54,26),(50,30),(52,36)]
    d.line(pts, fill=(200,230,255), width=1)
    return img

def holy_priest():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_hair(d, (220,200,180), "short")
    # Robe (longer)
    rect(d, 24, 22, 39, 52, (240,240,240))
    rect(d, 20, 22, 23, 48, (240,240,240))
    rect(d, 40, 22, 43, 48, (240,240,240))
    rect(d, 26, 8, 37, 19, (210,185,155))
    rect(d, 30, 20, 33, 21, (210,185,155))
    px(d, 28, 14, (255,255,255)); px(d, 29, 14, (60,60,80))
    px(d, 34, 14, (255,255,255)); px(d, 35, 14, (60,60,80))
    px(d, 30, 17, (180,140,120)); px(d, 31, 17, (180,140,120)); px(d, 32, 17, (180,140,120))
    # White staff
    rect(d, 12, 10, 14, 52, (220,220,210))
    px(d, 11, 8, (255,255,200)); px(d, 12, 7, (255,255,220)); px(d, 13, 8, (255,255,200))
    # Halo
    d.arc([27, 1, 36, 7], 0, 360, fill=(255,255,180), width=1)
    return img

def druid():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_hair(d, (80,120,50), "long")
    # Leaf crown
    rect(d, 24, 3, 39, 7, (60,140,50))
    px(d, 26, 2, (80,160,60)); px(d, 30, 1, (80,160,60)); px(d, 34, 2, (80,160,60))
    draw_body(d, skin=(190,170,140), armor=(80,120,60), pants=(70,100,50))
    # Nature staff with vine
    rect(d, 12, 14, 14, 52, (100,80,40))
    px(d, 11, 12, (60,140,50)); px(d, 13, 10, (80,160,60)); px(d, 12, 8, (60,140,50))
    px(d, 14, 16, (80,160,60)); px(d, 11, 20, (60,140,50))
    return img

def battle_medic():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_hair(d, (160,120,80), "short")
    draw_body(d, skin=(200,180,150), armor=(230,230,230), pants=(200,200,200))
    # Red cross on chest
    rect(d, 30, 26, 33, 33, (200,40,40))
    rect(d, 28, 29, 35, 31, (200,40,40))
    # Medical bag
    rect(d, 44, 32, 52, 40, (180,180,180))
    rect(d, 46, 34, 50, 38, (200,40,40))
    return img

def necromancer():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_hood(d, (40,30,50))
    draw_body(d, skin=(160,150,170), armor=(40,30,50), pants=(35,25,45))
    # Dark face
    rect(d, 27, 12, 36, 18, (25,15,35))
    px(d, 29, 14, (100,255,100)); px(d, 34, 14, (100,255,100))
    # Skull staff
    rect(d, 12, 14, 14, 52, (100,80,60))
    rect(d, 10, 9, 16, 15, (220,220,200))
    px(d, 11, 11, (30,20,30)); px(d, 15, 11, (30,20,30))
    px(d, 13, 13, (30,20,30))
    return img

def phantom_blade():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_hair(d, (80,70,100), "short")
    # Mask
    rect(d, 26, 14, 37, 19, (60,50,80))
    px(d, 28, 15, (200,200,255)); px(d, 35, 15, (200,200,255))
    draw_body(d, skin=(180,170,200), armor=(40,35,60), pants=(35,30,50))
    # Dual daggers
    rect(d, 10, 24, 12, 38, (180,180,200))
    px(d, 11, 22, (200,200,220))
    rect(d, 51, 24, 53, 38, (180,180,200))
    px(d, 52, 22, (200,200,220))
    return img

def venom_dancer():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_hair(d, (60,120,60), "long")
    draw_body(d, skin=(190,180,160), armor=(60,80,50), pants=(50,70,40))
    # Poison blades (curved)
    d.line([(10,24),(18,30),(10,36)], fill=(120,200,80), width=2)
    d.line([(53,24),(45,30),(53,36)], fill=(120,200,80), width=2)
    # Poison drip
    px(d, 10, 38, (80,200,50)); px(d, 53, 38, (80,200,50))
    return img

def shadow_monk():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_hair(d, (30,30,40), "bald")
    # Bald head with markings
    rect(d, 26, 8, 37, 19, (180,160,140))
    px(d, 28, 14, (255,255,255)); px(d, 29, 14, (40,30,50))
    px(d, 34, 14, (255,255,255)); px(d, 35, 14, (40,30,50))
    px(d, 30, 17, (160,140,120)); px(d, 31, 17, (160,140,120)); px(d, 32, 17, (160,140,120))
    # No armor - wraps
    rect(d, 24, 22, 39, 37, (60,50,40))
    rect(d, 20, 22, 23, 35, (180,160,140))
    rect(d, 40, 22, 43, 35, (180,160,140))
    # Wrapped fists
    rect(d, 19, 32, 24, 36, (200,200,180))
    rect(d, 39, 32, 44, 36, (200,200,180))
    # Pants
    rect(d, 26, 38, 32, 50, (50,40,35))
    rect(d, 33, 38, 37, 50, (50,40,35))
    rect(d, 25, 51, 32, 55, (40,35,30))
    rect(d, 33, 51, 39, 55, (40,35,30))
    # Shadow aura
    px(d, 22, 20, (80,60,100)); px(d, 41, 20, (80,60,100))
    return img

def reaper():
    img = Image.new("RGBA", (S,S), (0,0,0,0))
    d = ImageDraw.Draw(img)
    # Hood
    rect(d, 23, 4, 40, 12, (30,20,30))
    rect(d, 23, 12, 26, 18, (30,20,30))
    rect(d, 37, 12, 40, 18, (30,20,30))
    # Skull face
    rect(d, 27, 10, 36, 19, (220,210,190))
    px(d, 28, 14, (200,30,30)); px(d, 35, 14, (200,30,30))
    px(d, 30, 17, (180,170,150)); px(d, 31, 17, (180,170,150)); px(d, 32, 17, (180,170,150))
    # Dark robes
    rect(d, 24, 22, 39, 55, (25,15,25))
    rect(d, 20, 22, 23, 50, (25,15,25))
    rect(d, 40, 22, 43, 50, (25,15,25))
    # Scythe
    rect(d, 48, 8, 50, 55, (100,80,60))
    # Blade
    d.arc([42, 4, 56, 16], 180, 360, fill=(180,180,190), width=2)
    d.line([(48,4),(52,8)], fill=(180,180,190), width=2)
    return img

# ─── BACKGROUND GENERATORS ───

def generate_forest():
    w, h = 1920, 600
    img = Image.new("RGB", (w,h))
    d = ImageDraw.Draw(img)
    # Sky gradient
    for y in range(300):
        r = int(80 + y*0.1)
        g = int(140 + y*0.2)
        b = int(80 + y*0.1)
        d.line([(0,y),(w,y)], fill=(r,g,b))
    # Ground
    for y in range(300, h):
        r = int(30 + (y-300)*0.05)
        g = int(80 + (y-300)*0.03)
        b = int(20)
        d.line([(0,y),(w,y)], fill=(r,g,b))
    # Trees (pixelated)
    random.seed(42)
    for _ in range(30):
        tx = random.randint(0, w)
        th = random.randint(100, 250)
        tw = random.randint(40, 80)
        ty = 300 - th//2
        # Trunk
        rect(d, tx, ty+th//2, tx+tw//4, 300+20, (80,50,30))
        # Canopy layers
        for i in range(4):
            layer_w = tw - i*8
            layer_y = ty + i*15
            shade = random.randint(-20, 20)
            c = (30+shade, 90+shade+i*10, 20+shade)
            rect(d, tx+tw//2-layer_w//2, layer_y, tx+tw//2+layer_w//2, layer_y+20, c)
    return img

def generate_volcano():
    w, h = 1920, 600
    img = Image.new("RGB", (w,h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        r = int(40 + t * 80)
        g = int(10 + t * 20)
        b = int(15 + t * 10)
        d.line([(0,y),(w,y)], fill=(r,g,b))
    # Volcano
    pts = [(600,500),(960,100),(1320,500)]
    d.polygon(pts, fill=(60,40,30))
    # Lava glow
    for i in range(50):
        lx = random.randint(880, 1040)
        ly = random.randint(80, 120)
        px(d, lx, ly, (255, random.randint(100,200), 30))
    # Lava flow
    for y in range(100, 500):
        x = 960 + int((y-100)*0.3 * (1 if y%60<30 else -1))
        for dx in range(-8, 8):
            c = (255, random.randint(50,150), 0)
            px(d, x+dx, y, c)
    # Ground
    for y in range(480, h):
        for x in range(w):
            if random.random() > 0.7:
                px(d, x, y, (80+random.randint(-10,10), 30, 20))
    return img

def generate_ice():
    w, h = 1920, 600
    img = Image.new("RGB", (w,h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        r = int(20 + t * 30)
        g = int(30 + t * 50)
        b = int(60 + t * 60)
        d.line([(0,y),(w,y)], fill=(r,g,b))
    # Icicles
    random.seed(77)
    for _ in range(40):
        ix = random.randint(0, w)
        il = random.randint(40, 150)
        iw = random.randint(8, 20)
        for i in range(il):
            w_here = max(1, iw - i*iw//il)
            c = (180+random.randint(-20,20), 210+random.randint(-20,20), 240)
            rect(d, ix-w_here//2, i, ix+w_here//2, i, c)
    # Ice formations on ground
    for _ in range(15):
        bx = random.randint(0, w)
        bh = random.randint(30, 80)
        bw = random.randint(20, 60)
        rect(d, bx, 600-bh, bx+bw, 600, (150,180,210))
        rect(d, bx+4, 600-bh+4, bx+bw-4, 596, (190,210,230))
    return img

def generate_ruins():
    w, h = 1920, 600
    img = Image.new("RGB", (w,h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        v = int(20 + t * 25)
        d.line([(0,y),(w,y)], fill=(v,v,v+5))
    # Broken pillars
    random.seed(99)
    for _ in range(12):
        px_base = random.randint(50, w-50)
        ph = random.randint(100, 400)
        pw = random.randint(20, 40)
        broken = random.randint(0, ph//2)
        c = (50+random.randint(-10,10), 50+random.randint(-10,10), 55+random.randint(-10,10))
        rect(d, px_base, 600-ph+broken, px_base+pw, 600, c)
        # Cracks
        for _ in range(3):
            cy = random.randint(600-ph+broken, 580)
            cx = random.randint(px_base, px_base+pw)
            px(d, cx, cy, (30,30,35))
    # Arches
    for _ in range(4):
        ax = random.randint(100, w-200)
        d.arc([ax, 350, ax+120, 450], 0, 180, fill=(55,55,60), width=8)
        rect(d, ax, 400, ax+8, 600, (55,55,60))
        rect(d, ax+112, 400, ax+120, 600, (55,55,60))
    return img

def generate_void():
    w, h = 1920, 600
    img = Image.new("RGB", (w,h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        for x in range(0, w, 4):
            v = int(10 + 15 * ((x/w + y/h) % 1))
            r = v + random.randint(0, 15)
            g = v + random.randint(0, 5)
            b = v + 20 + random.randint(0, 20)
            rect(d, x, y, x+3, y, (r, g, b))
    # Stars
    random.seed(55)
    for _ in range(300):
        sx = random.randint(0, w)
        sy = random.randint(0, h)
        brightness = random.randint(150, 255)
        px(d, sx, sy, (brightness, brightness, brightness+20))
    # Cosmic nebula blobs
    for _ in range(8):
        nx = random.randint(0, w)
        ny = random.randint(0, h)
        for dx in range(-30, 30):
            for dy in range(-30, 30):
                if dx*dx + dy*dy < 900:
                    alpha = max(0, 40 - (dx*dx+dy*dy)//25)
                    ox, oy = nx+dx, ny+dy
                    if 0 <= ox < w and 0 <= oy < h:
                        old = img.getpixel((ox, oy))
                        nc = (old[0]+alpha, old[1]+alpha//2, old[2]+alpha)
                        nc = tuple(min(255, c) for c in nc)
                        px(d, ox, oy, nc)
    return img

# ─── MAIN ───

CHARACTERS = {
    "iron_knight": iron_knight,
    "berserker": berserker,
    "paladin": paladin,
    "dark_knight": dark_knight,
    "fire_mage": fire_mage,
    "ice_witch": ice_witch,
    "lightning_lord": lightning_lord,
    "void_sorcerer": void_sorcerer,
    "wind_ranger": wind_ranger,
    "shadow_sniper": shadow_sniper,
    "beast_tamer": beast_tamer,
    "storm_archer": storm_archer,
    "holy_priest": holy_priest,
    "druid": druid,
    "battle_medic": battle_medic,
    "necromancer": necromancer,
    "phantom_blade": phantom_blade,
    "venom_dancer": venom_dancer,
    "shadow_monk": shadow_monk,
    "reaper": reaper,
}

BACKGROUNDS = {
    "forest_bg": generate_forest,
    "volcano_bg": generate_volcano,
    "ice_bg": generate_ice,
    "ruins_bg": generate_ruins,
    "void_bg": generate_void,
}

if __name__ == "__main__":
    char_dir = "/tmp/pixel-raid/assets/characters"
    bg_dir = "/tmp/pixel-raid/assets/backgrounds"
    os.makedirs(char_dir, exist_ok=True)
    os.makedirs(bg_dir, exist_ok=True)
    
    for name, func in CHARACTERS.items():
        img = func()
        path = f"{char_dir}/{name}.png"
        img.save(path)
        print(f"✓ {path}")
    
    for name, func in BACKGROUNDS.items():
        img = func()
        path = f"{bg_dir}/{name}.png"
        img.save(path)
        print(f"✓ {path}")
    
    print(f"\nDone! Generated {len(CHARACTERS)} characters and {len(BACKGROUNDS)} backgrounds.")
