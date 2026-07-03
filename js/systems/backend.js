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
     * Pull Supabase → local GameState
     */
    async loadFromCloud() {
        if (!this.connected || !this.playerRow) return null;

        try {
            const { data, error } = await this.supabase
                .from('players')
                .select('*')
                .eq('id', this.playerRow.id)
                .single();

            if (error || !data) return null;

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
};
