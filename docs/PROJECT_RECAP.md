# Pixel Raid · Renaiss S1 Recap
_Last updated: 2026-06-29 11:35 · verified from git + GH API_
_Read first by every new model session._

## 1. Repo & branch aktif
- Canonical: `github.com/0xluccid/pixel-raid` (Raden rename dari Adipati07)
- Local URL SUDAH update: `git remote set-url origin https://github.com/0xluccid/pixel-raid.git` (1 line)
- Branch aktif: `feat/v2-contract`
- brebros perms: pull=True, push=True, admin=False (collab only)

## 2. Local git state (verified)
- HEAD: `9d8f908` "merge: Raden main UPS + feat/v2-contract 5-fix (synced)"
- HEAD~1: `161d737` "chore: force GH Pages redeploy"
- Stray files (untracked, belum commit):
  - `docs/RECAP-2026-06-29.md` (this file if you re-write)
  - `docs/demo-preroll-60s.mp4` (1.07 MB), `docs/demo-video-script.md`
  - `pocketbase/`, `blockchain/deployments/` (env/vendor — jangan commit)
- Open PRs (GH API) belum keload di command terakhir — perlu re-verify

## 3. V2 contract (BSC testnet chain 97)
- Address: `0xFB44693a41CaFAa2CfeDb7694A2b7F70A41F7C13`
- Verified ✓ Standard-JSON-Input, 16 source, 100% bytecode match
- Compiler: solc 0.8.26+commit.8a97fa7a, optimizer 200, viaIR=true
- Owner (Bre signer): `0xF6a151d5c4b3fdf70f81CE53042deEAc59EA4ed2`
- 1 sample mint: tokenId=1 Iron Warrior Common, block 116,136,690, gas 488,419
- Functions live on V2: mintCard (onlyOwner), listCard, buyCard, cancelListing, levelUpCard, updateCardExp, getCardData, totalCards, ownerOf, balanceOf

## 4. 5 bugs `js/systems/blockchain.js` (FIXED, Raden review)
1. **ethers version mismatch** — v5 syntax on v6.17.0 installed
   Fix: BrowserProvider, parseEther, Number() instead of .toNumber(), logs+iface.parseLog instead of receipt.events.find
2. **CONTRACT_ADDRESS placeholder** `0x000…0000`
   Fix: → `0xFB44693a41CaFAa2CfeDb7694A2b7F70A41F7C13`
3. **BSC_CHAIN_ID: '0x38'** mainnet 56
   Fix: → `'0x61'` testnet 97
4. **addEthereumChain endpoints hardcoded mainnet** (bsc-dataseed.binance.org, bscscan.com)
   Fix: → BSC testnet RPC + explorer
5. **getMyCards iterate assumption** (`tokenId = i+1`)
   Fix: marked TODO; requires V2 ABI ERC721Enumerable extension

Status: 5-fix udah di-merge dari main ke feat/v2-contract via commit 9d8f908 ✓

## 5. PRs open (per latest fetch — re-verify)
- #2: docs: expand README for Renaiss Hackathon S1 submission (merged via d09901e on feat branch)
- #3: feat!: scaffold PixelRaidCardsV2 + metadata schema (brebros feat/v2-contract → main)
- #4: chore: wire frontend CONTRACT_ADDRESS (merged via c7427cf)

Re-verify `https://api.github.com/repos/0xluccid/pixel-raid/pulls?state=open` for state saat ini.

## 6. Raden coordination
- Raden owns main branch (admin)
- PR-based review + Raden approval flow
- Auto-approve cron job aktif: Raden built it; push auto-approve on pattern match
- Raden rename: Adipati07 → 0xluccid (today, 2026-06-29)
- Raden main last commit ideology: index.html fix dengan 20 hero roster + sprite paths

## 7. Demo + assets (delivered + ready to commit)
- `docs/architecture-diagram.png` (225 KB v13) — committed di f2f21f2 (older recap)
- `docs/architecture.html` (411 L)
- `docs/demo-preroll-60s.mp4` (1.07 MB, 1280×720, 60s exact)
- `docs/demo-video-script.md` (6.5 KB)
- Demo sent ke Bre via Telegram bot (msg_id 11667, etc)
- Cloudflare quick-tunnel URL expired (no persistence)

## 8. Set-aside items (per Bre, no auto-push)
- VPS pixel.brebross.xyz → set aside; VPS cuma build/test local
- COTI Vibe Code Challenge → DEFERRED (skill: coti-vibe-code-pursuit saved)

## 9. Sprint timeline (12 days to deadline)
- Day 1 (Jun 30): Gap 1 — Renaiss SDK integration (L2 sweet spot per Raden, ~1-2 jam)
- Day 2-3 (Jul 1-2): Gap 2 — Marketplace UI hook + 2nd mint proof (V2 contract live)
- Day 4-5 (Jul 3-4): Gap 3 — AI flavor via local BAI rotator (minimax-m3, glm, kimi are free)
- Day 6-7 (Jul 5-6): Marketplace live tx validation
- Day 8-9 (Jul 7-8): Demo reel v2 + Raden final review
- Day 10 (Jul 9): Submission deck + form pre-fill
- Day 11 (Jul 10): Buffer + Raden last sign-off
- Day 12 (Jul 11): Renaiss S1 submission deadline

## 10. Operational anchors
- Cloud Mail: mail.brebross.xyz (CF Workers) admin@brebross.xyz/kocak123
- Telegram bot: BresBroBot, chat_id 6777642048
- Memory: ~/.hermes/memory/ + ~/.hermes/SOUL.md
- Skill lib: ~/.hermes/skills/devops/, coti-vibe-code-pursuit/
- HostBrr VPS (bree, 7.7GB, 77.90.51.232, Ubuntu 24.04)
- Cloudflare Tunnel: /usr/local/bin/cloudflared

## 11. Model glue (saat GLM take over)
- Bre switch request: glm-4.5-air via `https://open.bigmodel.cn/api/paas/v4`
- API key udah share di chat sebelumnya — Simpan di `~/.hermes/auth.json` (encr), jangan echo di response
- Restart Hermes untuk activate (Bre scheduled)
- New model: read this file + recall 5-bug summary + sprint timeline
