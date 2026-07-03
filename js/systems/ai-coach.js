/* ========================================
 * PIXEL RAID — AI Coach (Sprint 5)
 * Post-battle analysis and recommendations
 * ======================================== */

const AICoach = {
    /**
     * Analyze a completed battle and generate coaching feedback
     * @param {boolean} isWin - Whether player won
     * @param {Object} battleData - Battle data from BattleEngine
     * @returns {{ analysis: string, tips: Array, recommendation: string }}
     */
    analyzeBattle(isWin, battleData) {
        if (!battleData) return null;

        const { turnNumber, player, enemy } = battleData;
        
        const analysis = {
            isWin,
            turns: turnNumber,
            playerHPRemaining: player.heroHp,
            playerHPMax: player.heroMaxHp,
            enemyHPRemaining: enemy.heroHp,
            enemyHPMax: enemy.heroMaxHp,
            tips: [],
            recommendation: ''
        };

        // Generate tips based on battle performance
        if (isWin) {
            analysis.tips = this._generateWinTips(analysis);
            analysis.recommendation = this._generateWinRecommendation(analysis);
        } else {
            analysis.tips = this._generateLossTips(analysis);
            analysis.recommendation = this._generateLossRecommendation(analysis);
        }

        return analysis;
    },

    /**
     * Generate tips for winning battles
     * @param {Object} analysis - Battle analysis data
     * @returns {Array} Array of tip objects
     */
    _generateWinTips(analysis) {
        const tips = [];

        // Fast win
        if (analysis.turns <= 5) {
            tips.push({
                icon: '⚡',
                text: 'Blitz Victory! Won in just ' + analysis.turns + ' turns.',
                color: '#44ff88'
            });
        }

        // Dominant win (high HP remaining)
        const hpPercent = (analysis.playerHPRemaining / analysis.playerHPMax) * 100;
        if (hpPercent >= 80) {
            tips.push({
                icon: '🛡️',
                text: 'Dominant win with ' + Math.round(hpPercent) + '% HP remaining.',
                color: '#44ccff'
            });
        }

        // Close win
        if (hpPercent <= 30 && hpPercent > 0) {
            tips.push({
                icon: '😰',
                text: 'Close call! Only ' + Math.round(hpPercent) + '% HP left.',
                color: '#ffcc44'
            });
        }

        // Long battle
        if (analysis.turns >= 15) {
            tips.push({
                icon: '⏱️',
                text: 'Long battle (' + analysis.turns + ' turns). Consider faster cards.',
                color: '#ff8844'
            });
        }

        return tips;
    },

    /**
     * Generate tips for losing battles
     * @param {Object} analysis - Battle analysis data
     * @returns {Array} Array of tip objects
     */
    _generateLossTips(analysis) {
        const tips = [];

        // Lost quickly
        if (analysis.turns <= 5) {
            tips.push({
                icon: '💀',
                text: 'Defeated quickly in ' + analysis.turns + ' turns.',
                color: '#ff4444'
            });
            tips.push({
                icon: '💡',
                text: 'Your frontline may be too weak. Add defense cards.',
                color: '#ffcc44'
            });
        }

        // Lost after long battle
        if (analysis.turns >= 10) {
            tips.push({
                icon: '⏱️',
                text: 'Lost after ' + analysis.turns + ' turns.',
                color: '#ff8844'
            });
            tips.push({
                icon: '💡',
                text: 'You ran out of steam. Add more low-cost cards for early pressure.',
                color: '#ffcc44'
            });
        }

        // Enemy had high HP remaining
        const enemyHPPct = (analysis.enemyHPRemaining / analysis.enemyHPMax) * 100;
        if (enemyHPPct >= 70) {
            tips.push({
                icon: '👹',
                text: 'Enemy had ' + Math.round(enemyHPPct) + '% HP left. Damage output too low.',
                color: '#ff6644'
            });
            tips.push({
                icon: '💡',
                text: 'Add more ATK cards or use hero synergies for bonus damage.',
                color: '#ffcc44'
            });
        }

        // Close loss
        if (enemyHPPct <= 20 && enemyHPPct > 0) {
            tips.push({
                icon: '😤',
                text: 'So close! Enemy had only ' + Math.round(enemyHPPct) + '% HP left.',
                color: '#ffcc44'
            });
            tips.push({
                icon: '💡',
                text: 'One more attack card could tip the balance.',
                color: '#44ff88'
            });
        }

        return tips;
    },

    /**
     * Generate recommendation for winning battles
     * @param {Object} analysis - Battle analysis data
     * @returns {string} Recommendation text
     */
    _generateWinRecommendation(analysis) {
        const hpPercent = (analysis.playerHPRemaining / analysis.playerHPMax) * 100;

        if (hpPercent >= 80) {
            return 'Excellent performance! Your deck is well-balanced. Keep grinding to level up your hero.';
        } else if (hpPercent >= 50) {
            return 'Good win! Consider adding more defense cards to survive longer in harder stages.';
        } else {
            return 'Narrow victory! Your damage output is great, but you need more sustain. Add buff/heal cards.';
        }
    },

    /**
     * Generate recommendation for losing battles
     * @param {Object} analysis - Battle analysis data
     * @returns {string} Recommendation text
     */
    _generateLossRecommendation(analysis) {
        const enemyHPPct = (analysis.enemyHPRemaining / analysis.enemyMaxHp) * 100;

        if (analysis.turns <= 5) {
            return 'Your frontline collapsed too fast. Replace a damage card with a defense card like "Shield Up" or "Iron Wall".';
        } else if (enemyHPPct >= 70) {
            return 'You barely scratched the enemy. Add more ATK cards or use the AI Deck Builder for optimal synergy.';
        } else if (enemyHPPct <= 20) {
            return 'Almost won! Try using lower-cost cards to play more per turn, or add a healer for sustain.';
        } else {
            return 'Balanced loss. Check your mana curve — too many expensive cards means fewer plays per turn.';
        }
    },

    /**
     * Render AI Coach panel
     * @param {boolean} isWin - Whether player won
     * @param {Object} battleData - Battle data
     * @param {HTMLElement} container - Target container
     */
    renderCoach(isWin, battleData, container) {
        if (!battleData || !container) return;

        const analysis = this.analyzeBattle(isWin, battleData);
        if (!analysis) return;

        const borderColor = isWin ? '#44cc44' : '#ff4444';
        const glowColor = isWin ? 'rgba(68,204,68,0.3)' : 'rgba(255,68,68,0.3)';

        let html = `
            <div class="ai-coach" style="
                background:var(--bg-darker);border:1px solid ${borderColor};
                border-radius:8px;padding:12px;margin-top:12px;
                box-shadow:0 0 20px ${glowColor};
            ">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="font-family:'Press Start 2P';font-size:8px;color:${borderColor};">
                        🧙 AI COACH
                    </span>
                    <span style="font-size:8px;color:var(--text-dim);">
                        ${isWin ? '✅ Victory' : '❌ Defeat'} — ${analysis.turns} turns
                    </span>
                </div>

                <div style="font-size:8px;color:var(--text-dim);margin-bottom:8px;">
                    Your HP: ${analysis.playerHPRemaining}/${analysis.playerHPMax} • 
                    Enemy HP: ${analysis.enemyHPRemaining}/${analysis.enemyHPMax}
                </div>

                ${analysis.tips.length > 0 ? `
                    <div style="margin-bottom:8px;">
                        ${analysis.tips.map(tip => `
                            <div style="font-size:7px;color:${tip.color};margin-bottom:4px;">
                                ${tip.icon} ${tip.text}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <div style="
                    background:rgba(255,255,255,0.05);border-radius:4px;padding:8px;
                    font-size:7px;color:var(--text);line-height:1.4;
                ">
                    💡 <strong>Recommendation:</strong> ${analysis.recommendation}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AICoach;
}
