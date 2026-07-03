/* ========================================
 * PIXEL RAID — AI Deck Builder (Sprint 4)
 * Recommends optimal deck based on hero class + collection
 * ======================================== */

const AIDeckBuilder = {
    /**
     * Generate AI-recommended deck for a hero
     * @param {Object} heroCard - The hero card from collection
     * @returns {{ cards: Array, synergies: Array, score: number, reasoning: string }}
     */
    recommendDeck(heroCard) {
        if (!heroCard) return null;

        const heroClass = heroCard.class || 'warrior';
        
        // Use skill card templates, not hero collection
        if (typeof SKILL_CARD_TEMPLATES === 'undefined') return null;
        
        // Score each skill card based on class synergy
        const scoredCards = SKILL_CARD_TEMPLATES.map(card => ({
            card,
            score: this._scoreCard(card, heroClass)
        }));

        // Sort by score descending
        scoredCards.sort((a, b) => b.score - a.score);

        // Pick top 4 cards
        const recommended = scoredCards.slice(0, 4).map(sc => sc.card);

        // Calculate synergies
        const synergies = this._calculateSynergies(recommended, heroClass);

        // Calculate overall score
        const score = this._calculateDeckScore(recommended, heroClass);

        // Generate reasoning
        const reasoning = this._generateReasoning(recommended, heroClass, synergies, score);

        return {
            cards: recommended,
            synergies,
            score,
            reasoning
        };
    },

    /**
     * Score a card based on hero class synergy
     * @param {Object} card - Skill card
     * @param {string} heroClass - Hero class
     * @returns {number} Score (0-100)
     */
    _scoreCard(card, heroClass) {
        let score = 50; // Base score

        // Class synergy bonuses
        const classBonus = {
            warrior: { attack: 20, defense: 25, buff: 15, special: 10 },
            mage: { attack: 25, special: 20, buff: 15, defense: 10 },
            archer: { attack: 20, special: 25, buff: 15, defense: 10 },
            healer: { buff: 25, defense: 20, attack: 10, special: 15 },
            assassin: { attack: 25, special: 20, buff: 15, defense: 10 }
        };

        const bonuses = classBonus[heroClass] || classBonus.warrior;
        score += bonuses[card.type] || 0;

        // Rarity bonus
        const rarityBonus = { common: 0, rare: 5, epic: 10, legendary: 15, mythic: 20 };
        score += rarityBonus[card.rarity] || 0;

        // Mana efficiency (lower cost = more plays)
        if (card.manaCost <= 2) score += 10;
        else if (card.manaCost >= 4) score -= 5;

        return Math.min(100, Math.max(0, score));
    },

    /**
     * Calculate synergies for the recommended deck
     * @param {Array} cards - Recommended cards
     * @param {string} heroClass - Hero class
     * @returns {Array} Active synergies
     */
    _calculateSynergies(cards, heroClass) {
        const synergies = [];
        const typeCounts = {};

        cards.forEach(card => {
            typeCounts[card.type] = (typeCounts[card.type] || 0) + 1;
        });

        // Check for type synergies
        if (typeCounts.attack >= 2) {
            synergies.push({
                name: 'Aggressive',
                description: '+15% ATK from 2+ attack cards',
                bonus: { atk: 0.15 }
            });
        }

        if (typeCounts.defense >= 2) {
            synergies.push({
                name: 'Defensive',
                description: '+15% DEF from 2+ defense cards',
                bonus: { def: 0.15 }
            });
        }

        if (typeCounts.buff >= 2) {
            synergies.push({
                name: 'Support',
                description: '+20% healing from 2+ buff cards',
                bonus: { heal: 0.20 }
            });
        }

        if (typeCounts.special >= 2) {
            synergies.push({
                name: 'Specialist',
                description: '+10% crit from 2+ special cards',
                bonus: { crit: 0.10 }
            });
        }

        // Check for class synergy
        if (heroClass === 'warrior' && typeCounts.defense >= 1) {
            synergies.push({
                name: 'Iron Will',
                description: 'Warrior + defense card: +10 DEF',
                bonus: { def: 10 }
            });
        }

        if (heroClass === 'mage' && typeCounts.attack >= 1) {
            synergies.push({
                name: 'Arcane Power',
                description: 'Mage + attack card: +10 ATK',
                bonus: { atk: 10 }
            });
        }

        if (heroClass === 'archer' && typeCounts.special >= 1) {
            synergies.push({
                name: 'Precision',
                description: 'Archer + special card: +10% crit',
                bonus: { crit: 0.10 }
            });
        }

        if (heroClass === 'healer' && typeCounts.buff >= 1) {
            synergies.push({
                name: 'Divine Grace',
                description: 'Healer + buff card: +20% healing',
                bonus: { heal: 0.20 }
            });
        }

        return synergies;
    },

    /**
     * Calculate overall deck score
     * @param {Array} cards - Recommended cards
     * @param {string} heroClass - Hero class
     * @returns {number} Score (0-100)
     */
    _calculateDeckScore(cards, heroClass) {
        if (cards.length === 0) return 0;

        let score = 0;
        cards.forEach(card => {
            score += this._scoreCard(card, heroClass);
        });

        // Average score
        score = Math.round(score / cards.length);

        // Synergy bonus
        const synergies = this._calculateSynergies(cards, heroClass);
        score += synergies.length * 5;

        return Math.min(100, score);
    },

    /**
     * Generate human-readable reasoning
     * @param {Array} cards - Recommended cards
     * @param {string} heroClass - Hero class
     * @param {Array} synergies - Active synergies
     * @param {number} score - Deck score
     * @returns {string} Reasoning text
     */
    _generateReasoning(cards, heroClass, synergies, score) {
        const classNames = {
            warrior: 'Warrior',
            mage: 'Mage',
            archer: 'Archer',
            healer: 'Healer',
            assassin: 'Assassin'
        };

        let reasoning = `Recommended for ${classNames[heroClass] || heroClass}:\n`;
        
        if (score >= 80) {
            reasoning += '• Excellent synergy — strong early game\n';
        } else if (score >= 60) {
            reasoning += '• Good synergy — solid mid-game\n';
        } else {
            reasoning += '• Decent deck — room for improvement\n';
        }

        if (synergies.length > 0) {
            reasoning += `• ${synergies.length} active synergy bonus${synergies.length > 1 ? 'es' : ''}\n`;
            synergies.forEach(s => {
                reasoning += `  - ${s.name}: ${s.description}\n`;
            });
        }

        // Mana curve analysis
        const avgMana = cards.reduce((sum, c) => sum + (c.manaCost || 0), 0) / cards.length;
        if (avgMana <= 2) {
            reasoning += '• Fast aggro deck — play many cards early\n';
        } else if (avgMana >= 4) {
            reasoning += '• Control deck — save mana for powerful combos\n';
        } else {
            reasoning += '• Balanced mana curve — flexible playstyle\n';
        }

        return reasoning;
    },

    /**
     * Auto-equip recommended deck to hero
     * @param {Object} heroCard - Hero card
     * @returns {boolean} Success
     */
    autoEquip(heroCard) {
        const recommendation = this.recommendDeck(heroCard);
        if (!recommendation || recommendation.cards.length === 0) return false;

        // Use skill card IDs (strings), not hero card IDs (numbers)
        const cardIds = recommendation.cards.map(c => c.id);
        DeckManager.buildDeck(heroCard, cardIds);
        
        // Also update GameState skillDeck
        GameState.skillDeck = cardIds;
        GameState.save();

        return true;
    },

    /**
     * Render AI recommendation panel
     * @param {Object} heroCard - Hero card
     * @param {HTMLElement} container - Target container
     */
    renderRecommendation(heroCard, container) {
        if (!heroCard || !container) return;

        const recommendation = this.recommendDeck(heroCard);
        if (!recommendation) {
            container.innerHTML = '<p style="color:var(--text-dim)">No cards available for recommendation</p>';
            return;
        }

        const scoreColor = recommendation.score >= 80 ? '#44cc44' : 
                          recommendation.score >= 60 ? '#ffcc00' : '#ff6644';

        let html = `
            <div class="ai-recommendation" style="
                background:var(--bg-darker);border:1px solid var(--border-color);
                border-radius:8px;padding:12px;margin-top:12px;
            ">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="font-family:'Press Start 2P';font-size:8px;color:var(--gold);">
                        🤖 AI RECOMMENDATION
                    </span>
                    <span style="font-size:10px;color:${scoreColor};font-weight:bold;">
                        Score: ${recommendation.score}/100
                    </span>
                </div>
                
                <div style="font-size:8px;color:var(--text-dim);margin-bottom:8px;white-space:pre-line;">
                    ${recommendation.reasoning}
                </div>

                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
                    ${recommendation.cards.map(card => `
                        <div style="
                            background:var(--bg-card);border:1px solid var(--border-color);
                            padding:6px 8px;border-radius:4px;font-size:7px;
                        ">
                            <div style="color:var(--text);">${card.name}</div>
                            <div style="color:var(--text-dim);">⚔${card.attack || 0} 🛡${card.defense || 0}</div>
                        </div>
                    `).join('')}
                </div>

                ${recommendation.synergies.length > 0 ? `
                    <div style="font-size:7px;color:var(--gold);margin-bottom:8px;">
                        ${recommendation.synergies.map(s => `✨ ${s.name}`).join(' • ')}
                    </div>
                ` : ''}

                <button class="btn btn-primary" style="width:100%;font-size:8px;" 
                    onclick="AIDeckBuilder.autoEquipAndRefresh('${heroCard.id}')">
                    ⚡ AUTO-EQUIP RECOMMENDED DECK
                </button>
            </div>
        `;

        container.innerHTML = html;
    },

    /**
     * Auto-equip and refresh UI
     * @param {string} heroId - Hero card ID
     */
    autoEquipAndRefresh(heroId) {
        const hero = GameState.getCardById(heroId);
        if (hero && this.autoEquip(hero)) {
            // Refresh strategy screen
            if (typeof UI !== 'undefined' && UI.showScreen) {
                UI.showScreen('formation');
            }
        }
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIDeckBuilder;
}
