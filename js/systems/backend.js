/* ========================================
 * PIXEL RAID — Supabase Backend Bridge
 * Cloud save/load + wallet auth
 * ======================================== */

const Backend = {
    supabase: null,
    user: null,
    playerRow: null,
    connected: false,

    URL: 'https://hchrdclodhasoxvjfxss.supabase.co',
    ANON_KEY: 'eyJhbG...c00Q',

    init() {
        if (typeof supabase === 'undefined' || !supabase.createClient) {
            console.warn('⚠️ Supabase SDK not loaded');
            return false;
        }
        this.supabase = supabase.createClient(this.URL, this.ANON_KEY);
        console.log('✅ Supabase connected');
        return true;
    },

    /**
     * Connect wallet → lookup/create player in Supabase
     */
    async connectWallet(walletAddress) {
        if (!this.supabase) return { error: 'Supabase not initialized' };

        try {
            // Lookup existing player
            const { data: existing } = await this.supabase
                .from('players')
                .select('*')
                .eq('wallet_address', walletAddress.toLowerCase())
                .single();

            if (existing) {
                this.playerRow = existing;
                this.connected = true;
                console.log('✅ Player loaded:', existing.display_name);
                return { success: true, player: existing, isNew: false };
            }

            // Create new player
            const newPlayer = {
                wallet_address: walletAddress.toLowerCase(),
                display_name: 'Adventurer',
                level: 1,
                exp: 0,
                gold: 100,
                gem: 5,
                current_stage: 1,
                highest_stage: 1,
                total_battles: 0,
                total_wins: 0,
                win_streak: 0,
                playtime_seconds: 0,
            };

            const { data: created, error: createError } = await this.supabase
                .from('players')
                .insert(newPlayer)
                .select()
                .single();

            if (createError) {
                console.error('❌ Create player failed:', createError);
                return { error: createError.message };
            }

            this.playerRow = created;
            this.connected = true;
            console.log('✅ New player created:', created.display_name);
            return { success: true, player: created, isNew: true };

        } catch (err) {
            console.error('❌ Wallet connect error:', err);
            return { error: err.message };
        }
    },

    /**
     * Push local GameState → Supabase
     */
    async saveToCloud(gameState) {
        if (!this.connected || !this.playerRow) return false;

        try {
            // Set wallet context untuk RLS policy
            await this._setWalletContext();

            // Validasi battle result sebelum save (jika ada battle baru)
            if (gameState.stats?.lastBattle) {
                const isValid = await this._validateBattle(gameState.stats.lastBattle);
                if (!isValid) {
                    console.warn('⚠️ Battle validation failed, skipping save');
                    return false;
                }
            }

            const update = {
                display_name: gameState.player.name || 'Adventurer',
                level: gameState.player.level || 1,
                exp: gameState.player.exp || 0,
                gold: gameState.player.gold || 0,
                gem: gameState.player.gems || 0,
                current_stage: gameState.player.stage || 1,
                highest_stage: gameState.stats.highestStage || 1,
                total_battles: (gameState.stats.battlesWon || 0) + (gameState.stats.battlesLost || 0),
                total_wins: gameState.stats.battlesWon || 0,
                win_streak: gameState.player.winStreak || 0,
                data_checksum: this._generateChecksum(gameState),
            };

            const { error } = await this.supabase
                .from('players')
                .update(update)
                .eq('wallet_address', this.playerRow.wallet_address);

            if (error) {
                console.error('❌ Cloud save failed:', error);
                return false;
            }

            console.log('☁️ Saved to cloud');
            return true;
        } catch (err) {
            console.error('❌ Cloud save error:', err);
            return false;
        }
    },

    /**
     * Pull Supabase → local GameState (with integrity check)
     */
    async loadFromCloud() {
        if (!this.connected || !this.playerRow) return null;

        try {
            const { data, error } = await this.supabase
                .from('players')
                .select('*')
                .eq('wallet_address', this.playerRow.wallet_address)
                .single();

            if (error || !data) return null;

            // Verify checksum — kalau mismatch, data mungkin di-inject
            if (data.data_checksum) {
                const expected = this._generateChecksumFromRow(data);
                if (data.data_checksum !== expected) {
                    console.warn('⚠️ Cloud data checksum mismatch! Possible tampering.');
                    // Tetap load tapi flag sebagai suspicious
                    data._suspicious = true;
                }
            }

            this.playerRow = data;
            console.log('☁️ Loaded from cloud');
            return data;
        } catch (err) {
            console.error('❌ Cloud load error:', err);
            return null;
        }
    },

    disconnect() {
        this.user = null;
        this.playerRow = null;
        this.connected = false;
        console.log('🔌 Disconnected');
    },

    /**
     * Set wallet context untuk RLS policy
     * Harus dipanggil sebelum update operation
     */
    async _setWalletContext() {
        if (!this.playerRow?.wallet_address) return;
        await this.supabase.rpc('app_set_config', {
            key: 'app.wallet',
            value: this.playerRow.wallet_address,
        });
    },

    /**
     * Generate checksum dari game state (simple hash)
     */
    _generateChecksum(gameState) {
        const payload = [
            gameState.player.name,
            gameState.player.level,
            gameState.player.exp,
            gameState.player.gold,
            gameState.player.gems,
            gameState.player.stage,
            gameState.stats.highestStage,
            gameState.stats.battlesWon,
            gameState.stats.battlesLost,
        ].join('|');
        return this._simpleHash(payload);
    },

    /**
     * Generate checksum dari row database
     */
    _generateChecksumFromRow(row) {
        const payload = [
            row.display_name,
            row.level,
            row.exp,
            row.gold,
            row.gem,
            row.current_stage,
            row.highest_stage,
            row.total_wins,
            row.total_battles - row.total_wins, // battlesLost
        ].join('|');
        return this._simpleHash(payload);
    },

    /**
     * Simple string hash (djb2)
     */
    _simpleHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    },

    /**
     * Fetch leaderboard dari Edge Function (cached server-side)
     */
    async fetchLeaderboard(sort = 'highest_stage', limit = 50) {
        try {
            const response = await fetch(
                `${this.URL}/functions/v1/leaderboard?sort=${sort}&limit=${limit}`,
                {
                    headers: {
                        'apikey': this.ANON_KEY,
                    },
                }
            );

            if (!response.ok) throw new Error('Leaderboard fetch failed');
            const result = await response.json();
            return result.data;
        } catch (err) {
            console.error('❌ Leaderboard error:', err);
            // Fallback: direct query
            const { data } = await this.supabase
                .from('players')
                .select('wallet_address, display_name, level, highest_stage, total_wins, total_battles, win_streak')
                .order(sort, { ascending: false })
                .limit(limit);
            return data || [];
        }
    },

    /**
     * Validate battle result via Edge Function
     */
    async _validateBattle(battleLog) {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            
            const response = await fetch(`${this.URL}/functions/v1/validate-battle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || this.ANON_KEY}`,
                    'apikey': this.ANON_KEY,
                },
                body: JSON.stringify(battleLog),
            });

            const result = await response.json();
            
            if (!response.ok || !result.valid) {
                console.warn('⚠️ Battle validation failed:', result.issues);
                return false;
            }

            return true;
        } catch (err) {
            console.error('❌ Validation error:', err);
            // Jika validation error, tetap allow save (fail-open)
            // Tapi log untuk monitoring
            return true;
        }
    },

    getStats() {
        if (!this.playerRow) return null;
        return {
            name: this.playerRow.display_name,
            level: this.playerRow.level,
            gold: this.playerRow.gold,
            gems: this.playerRow.gem,
            stage: this.playerRow.current_stage,
            highestStage: this.playerRow.highest_stage,
            battles: this.playerRow.total_battles,
            wins: this.playerRow.total_wins,
        };
    },

    /**
     * Log analytics event (fire-and-forget)
     */
    async trackEvent(eventType, data = {}) {
        try {
            const wallet = this.playerRow?.wallet_address;
            await fetch(`${this.URL}/functions/v1/analytics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.ANON_KEY}`,
                    'apikey': this.ANON_KEY,
                },
                body: JSON.stringify({
                    eventType,
                    walletAddress: wallet,
                    data,
                }),
            });
        } catch (_) { /* fire-and-forget */ }
    },
};
