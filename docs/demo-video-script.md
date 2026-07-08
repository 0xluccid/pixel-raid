# Pixel Raid · Demo Video (Renaiss S1)

## Overview
- **Length:** 60 detik (1 menit) — tight, RENAISS-style
- **Format:** 1920×1080 landscape MP4 (also extract 1080×1920 short)
- **Codec:** H.264 video + AAC audio (128 kbps)
- **Style:** Faceless diorama style — pure screen capture + burned-in captions (no avatar / no face)
- **Toolchain:** Playwright headless → frame screenshots → ffmpeg stitch → burn captions → audio sync → final 60fps MP4

## Tone
- **Bahasa Indonesia** (Bre's voice-of-channel). Lugas, santai-informatif.
- Caption pair: bold ID text (top) + EN micro-glossary (bottom).
- Background music: silent or low-fi royalty-free chiptune (~-12 dB).

---

## Timeline (5 shots × ~12 detik each)

### Scene 1 · CONNECT WALLET (0:00–0:12)
**On-screen:** Browser opens `pixel.brebross.xyz` → top pulse dot live → click `#connect-wallet` → MetaMask popup auto-resolves (test signer pre-seeded) → "✓ Connected" indicator appears.

**Voice-over:**
> "Buka Pixel Raid. Sambungkan MetaMask — sekali klik, langsung masuk."

**Burned caption:**
```
❶ Connect · MetaMask → Browser inject
   Signer: 0xF6a1…ed2 (BSC testnet)
```

**Visual cues:** green pulse dot top-left, MetaMask rose circle ❶.

---

### Scene 2 · PICK HEROES (0:12–0:24)
**On-screen:** Roster grid (20 hero cards) → click 3 cards (Warrior, Mage, Berserker) → formation auto-arrange → "Start Battle" button click → battle loop animation (auto-resolve).

**Voice-over:**
> "Pilih 3 hero dari 20 roster. Battle auto-resolve, no manual input needed."

**Burned caption:**
```
❷ ethers.js → V2 contract (signed tx)
   20 heroes · 5 rarities · BSC chain 97
```

**Visual cues:** emerald ✓ coin ❷ — tx signature animation, ethers→V2 path arrow.

---

### Scene 3 · MINT PATH (0:24–0:36)
**On-screen:** Battle victory banner → "Claim NFT" button click → server-side relayer sign (rose path → contract) → tx submission to BSC testnet.

**Voice-over:**
> "Menang → relayer trigger mint. Server-side, onlyOwner path. Sekali tx, sekali block."

**Burned caption:**
```
❸ Server-side mint · onlyOwner tx
   Gas: 488,419 · 0.1 gwei = ~$0.001
```

**Visual cues:** rose pulse ❸, vertical arrow up into V2 contract.

---

### Scene 4 · VERIFY ON BSCSCAN (0:36–0:48)
**On-screen:** tx receipt block number → pull up BSCscan testnet page → 0xFB44693… contract address visible → click "Contract" tab → verified source visible (Green ✓ Verified badge).

**Voice-over:**
> "Langsung diverifikasi di BSCscan. Standard-JSON Input — 16 sources, 100% bytecode match."

**Burned caption:**
```
❹ token URL ⬇ metadata
   ✓ Standard-JSON verified · 16 sources
```

**Visual cues:** green ✓ badge from BSCscan screen, ❹+text aligned.

---

### Scene 5 · NFT IN INVENTORY (0:48–0:60)
**On-screen:** Back to game UI → NFT #1 "Iron Warrior Common" appears in inventory panel → click for detail view → opens metadata JSON served live by nginx (`/metadata/1.json`).

**Voice-over:**
> "NFT live di inventory. metadata JSON served langsung dari nginx — bukan第三方 host."

**Burned caption:**
```
Live Minting Pipeline · production-ready
▼ Sample token: Iron Warrior Common
```

**Visual cues:** violet pulse box (NFT State) lights up, metadata JSON visible.

---

## Shot + Tool Pipeline

| Phase | Tool | Output |
|-------|------|--------|
| 1 | `playwright codegen pixel.brebross.xyz/game.html` | action script |
| 2 | Walkthrough.js (custom) — 5 stages, auto-screenshot | 30 PNG screenshots |
| 3 | `ffmpeg -i %d.png -framerate 2 -c:v libx264 timeline.mp4` | intermediate 60fps MP4 |
| 4 | `ffmpeg -i timeline.mp4 -i vo.mp3 -i srt.srt -c:v libx264 -c:a aac final.mp4` | final composite |
| 5 | `ffmpeg -i final.mp4 -vf "crop=in_w:in_w*9/16" -short.mp4` | Shorts vertical cut |

### CMD one-liner (after screenshots gathered):
```bash
ffmpeg -framerate 2 -i shot-%02d.png -i vo.wav \
  -filter_complex "[0:v]drawtext=... [v]" \
  -map "[v]" -map 1:a -c:v libx264 -c:a aac -shortest demo-60s.mp4
```

---

## Caption overlays (SRT format)

```
1
00:00:00,000 --> 00:00:12,000
❶ Connect · MetaMask → Browser inject

2
00:00:12,000 --> 00:00:24,000
❷ ethers.js → V2 contract (signed tx)

3
00:00:24,000 --> 00:00:36,000
❸ Server-side mint · onlyOwner tx

4
00:00:36,000 --> 00:00:48,000
❹ token URL ⬇ metadata

5
00:00:48,000 --> 00:00:60,000
Live Minting Pipeline · production-ready
```

---

## VO Transcript (untuk TTS / Bre direct record)

```
[Scene 1]
"Buka Pixel Raid. Sambungkan MetaMask — sekali klik, langsung masuk."

[Scene 2]
"Pilih 3 hero dari 20 roster. Battle auto-resolve, no manual input needed."

[Scene 3]
"Menang → relayer trigger mint. Server-side, onlyOwner path. Sekali tx, sekali block."

[Scene 4]
"Langsung diverifikasi di BSCscan. Standard-JSON Input — 16 sources, 100% bytecode match."

[Scene 5]
"NFT live di inventory. metadata JSON served langsung dari nginx — bukan第三方 host."
```

---

## Slider/Cut list (per second)

| t | Scene | Cut action |
|---|-------|------------|
| 0:00 | 1 | hard cut to game.html |
| 0:03 | 1 | click connect button |
| 0:06 | 1 | MetaMask popup auto-resolve |
| 0:10 | 1 | wallet indicator lights up |
| 0:12 | 2 | hard cut to roster grid |
| 0:15 | 2 | click 3 hero cards in rapid sequence |
| 0:20 | 2 | "Start Battle" click + animation |
| 0:24 | 3 | battle victory → "Claim NFT" click |
| 0:28 | 3 | relayer logs visible |
| 0:32 | 3 | tx receipt appears |
| 0:36 | 4 | jump-cut to BSCSCan verify page |
| 0:40 | 4 | ✓ Verified badge pop-in (animated) |
| 0:44 | 4 | zoom on Standard-JSON Input row |
| 0:48 | 5 | cut back to inventory |
| 0:52 | 5 | NFT #1 card reveal animation |
| 0:56 | 5 | click → metadata JSON view |
| 0:58 | 5 | freeze on final screen |
| 0:60 | end | end card + 'follow for S2' |

---

## Notes Production
- **NO face cam** (faceless channel treatment konsisten dgn NeuralDrop style)
- **Music:** chiptune royalty-free, ~-12 dB under VO
- **Caption style:** JetBrains Mono, white fs 24 dgn 2px stroke bottom, top-left aligned
- **Aspect crop:** generate 16:9 (YouTube) + 9:16 (Shorts/TikTok variants)
- **Resolution:** 1080p@60fps base → upscaled to 4K for archival

══════════📦 FILE: docs/demo-video-script.md (template + shot list) ══════════
Next: IronVO Bre voice → ready? gue sediain walkthrough.js + Playwright automation.
Gas lo buat mulai screenshot capture pipeline (avoid GPU burn via local-only).
