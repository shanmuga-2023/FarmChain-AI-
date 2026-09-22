// ============================================
// FarmChain AI — Quality Guard (Anti-Fraud Engine)
// Prevents farmers from cheating intermediaries,
// consumers, and retailers with poor/waste products
// ============================================

import { store } from '../data/store.js';

/**
 * QualityGuard — Multi-layer anti-fraud protection system.
 *
 * Answers judges' question: "If farmer gives poor quality / waste
 * and cheats the intermediary, consumer, and retailer — what is the solution?"
 *
 * Solution layers:
 * 1. AI Quality Gate — blocks registration of products below 40% score
 * 2. Strike System — 3 strikes → account suspended
 * 3. Reputation Score — running score based on quality history
 * 4. Re-verification — intermediary & retailer can re-scan products
 * 5. Auto-Dispute — quality mismatch >20% triggers escrow hold
 * 6. GPS Verification — camera GPS must match registered farm
 * 7. Penalty Calculation — reduced farmer share for offenders
 */
export class QualityGuard {
  // Quality gate threshold (minimum score to register)
  static QUALITY_THRESHOLD = 40;

  // Strike thresholds
  static MAX_STRIKES = 3;
  static WARNING_STRIKES = 1;

  // Quality mismatch tolerance for re-verification (%)
  static MISMATCH_TOLERANCE = 20;

  /**
   * Check if a farmer is eligible to list new products
   * @param {string} farmerId
   * @returns {{ eligible, reason, reputation, strikes }}
   */
  static checkFarmerEligibility(farmerId) {
    const rep = this.getFarmerReputation(farmerId);

    if (rep.strikes >= this.MAX_STRIKES) {
      return {
        eligible: false,
        reason: `🚫 Account suspended — ${rep.strikes} quality strikes (max ${this.MAX_STRIKES})`,
        reputation: rep,
        strikes: rep.strikes,
      };
    }

    if (rep.reputationScore < 20) {
      return {
        eligible: false,
        reason: '🚫 Reputation too low — quality improvement required before listing',
        reputation: rep,
        strikes: rep.strikes,
      };
    }

    return {
      eligible: true,
      reason: rep.strikes > 0
        ? `⚠️ ${rep.strikes} strike(s) — maintain quality to avoid suspension`
        : '✅ Good standing — eligible to list products',
      reputation: rep,
      strikes: rep.strikes,
    };
  }

  /**
   * Record a quality check result for a farmer
   * @param {string} farmerId
   * @param {string} productId
   * @param {number} score - Quality score 0-100
   * @param {string} stage - 'registration', 'intermediary_check', 'retailer_check', 'consumer_complaint'
   * @returns {{ allowed, penalty, strikes }}
   */
  static recordQualityResult(farmerId, productId, score, stage = 'registration') {
    const reps = store.get('farmerReputations') || {};
    if (!reps[farmerId]) {
      reps[farmerId] = {
        farmerId,
        reputationScore: 85, // Start with good reputation
        strikes: 0,
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        qualityHistory: [],
        penalties: [],
        lastUpdated: Date.now(),
      };
    }

    const rep = reps[farmerId];
    const passed = score >= this.QUALITY_THRESHOLD;
    const record = {
      productId,
      score,
      stage,
      passed,
      timestamp: Date.now(),
    };

    rep.qualityHistory.push(record);
    rep.totalChecks++;

    if (passed) {
      rep.passedChecks++;
      // Improve reputation for good quality
      rep.reputationScore = Math.min(100, rep.reputationScore + (score >= 80 ? 2 : 1));
    } else {
      rep.failedChecks++;
      rep.strikes++;
      // Decrease reputation
      rep.reputationScore = Math.max(0, rep.reputationScore - 15);

      // Record penalty
      const penalty = this.calculatePenalty(farmerId, score < 20 ? 'waste_product' : 'low_quality');
      rep.penalties.push({
        ...penalty,
        productId,
        score,
        timestamp: Date.now(),
      });
    }

    rep.lastUpdated = Date.now();
    reps[farmerId] = rep;
    store.set('farmerReputations', reps);

    return {
      allowed: passed,
      penalty: passed ? null : rep.penalties[rep.penalties.length - 1],
      strikes: rep.strikes,
      reputation: rep.reputationScore,
    };
  }

  /**
   * Handle a quality dispute when re-verification shows different quality
   * @param {string} orderId
   * @param {string} farmerId
   * @param {number} originalScore - Farmer's original AI quality score
   * @param {number} reVerificationScore - Score at intermediary/retailer
   * @param {string} disputeBy - 'intermediary', 'retailer', 'consumer'
   * @returns {Object} dispute result
   */
  static handleQualityDispute(orderId, farmerId, originalScore, reVerificationScore, disputeBy) {
    const scoreDiff = originalScore - reVerificationScore;
    const isMismatch = scoreDiff > this.MISMATCH_TOLERANCE;

    const dispute = {
      disputeId: `DSP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      orderId,
      farmerId,
      disputeBy,
      originalScore,
      reVerificationScore,
      scoreDifference: scoreDiff,
      isMismatch,
      status: 'open',
      createdAt: Date.now(),
      resolution: null,
    };

    if (isMismatch) {
      // Auto-resolve: farmer is at fault
      dispute.status = 'resolved_against_farmer';
      dispute.resolution = {
        action: scoreDiff > 40 ? 'full_refund' : 'partial_refund',
        refundPercentage: scoreDiff > 40 ? 100 : Math.round(scoreDiff * 1.5),
        farmerPenalty: true,
        message: `Quality dropped ${scoreDiff}% from registration (${originalScore}% → ${reVerificationScore}%). ${scoreDiff > 40 ? 'Full refund issued.' : `${Math.round(scoreDiff * 1.5)}% partial refund.`}`,
      };

      // Add a strike to the farmer
      this.recordQualityResult(farmerId, orderId, reVerificationScore, `${disputeBy}_reverification`);
    } else {
      dispute.status = 'resolved_no_action';
      dispute.resolution = {
        action: 'none',
        refundPercentage: 0,
        farmerPenalty: false,
        message: `Quality difference (${scoreDiff}%) is within acceptable tolerance (±${this.MISMATCH_TOLERANCE}%).`,
      };
    }

    // Store dispute
    const disputes = store.get('qualityDisputes') || [];
    disputes.push(dispute);
    store.set('qualityDisputes', disputes);

    return dispute;
  }

  /**
   * Get farmer's reputation data
   * @param {string} farmerId
   * @returns {Object} reputation data
   */
  static getFarmerReputation(farmerId) {
    const reps = store.get('farmerReputations') || {};
    if (!reps[farmerId]) {
      return {
        farmerId,
        reputationScore: 85,
        strikes: 0,
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        qualityHistory: [],
        penalties: [],
        lastUpdated: null,
      };
    }
    return reps[farmerId];
  }

  /**
   * Calculate penalty for a quality offense
   * @param {string} farmerId
   * @param {string} fraudType - 'low_quality', 'waste_product', 'quality_mismatch', 'gps_mismatch'
   * @returns {Object} penalty details
   */
  static calculatePenalty(farmerId, fraudType) {
    const rep = this.getFarmerReputation(farmerId);
    const strikeCount = rep.strikes;

    const penalties = {
      low_quality: {
        1: { action: 'warning', farmerShareReduction: 5, message: '⚠️ Warning: Low quality detected. Farmer share reduced by 5%.' },
        2: { action: 'delist', farmerShareReduction: 10, message: '🚫 Product delisted. Farmer share reduced by 10%. One more strike → suspension.' },
        3: { action: 'suspend', farmerShareReduction: 100, message: '⛔ Account SUSPENDED. All pending escrow held for review.' },
      },
      waste_product: {
        1: { action: 'delist', farmerShareReduction: 15, message: '🚫 Waste product detected! Product blocked. Farmer share reduced by 15%.' },
        2: { action: 'suspend', farmerShareReduction: 50, message: '⛔ Repeat waste offense! Account suspended. 50% escrow penalty.' },
        3: { action: 'permanent_ban', farmerShareReduction: 100, message: '🚨 PERMANENT BAN. Fraudulent activity confirmed. All funds held.' },
      },
      quality_mismatch: {
        1: { action: 'warning', farmerShareReduction: 5, message: '⚠️ Quality mismatch detected at checkpoint. Investigation initiated.' },
        2: { action: 'delist', farmerShareReduction: 15, message: '🚫 Repeat quality mismatch. Products under review.' },
        3: { action: 'suspend', farmerShareReduction: 100, message: '⛔ Systematic quality fraud detected. Account suspended.' },
      },
      gps_mismatch: {
        1: { action: 'flag', farmerShareReduction: 0, message: '🚩 GPS location doesn\'t match registered farm. Flagged for review.' },
        2: { action: 'warning', farmerShareReduction: 5, message: '⚠️ Repeated GPS mismatch. Possible location fraud.' },
        3: { action: 'suspend', farmerShareReduction: 20, message: '⛔ Location fraud confirmed. Account suspended.' },
      },
    };

    const tier = Math.min(strikeCount + 1, 3);
    const penalty = penalties[fraudType]?.[tier] || penalties.low_quality[1];

    return {
      ...penalty,
      fraudType,
      strikeNumber: tier,
      totalStrikes: strikeCount + 1,
    };
  }

  /**
   * Get protection system summary for dashboard display
   * @returns {Object} summary stats
   */
  static getProtectionSummary() {
    const reps = store.get('farmerReputations') || {};
    const disputes = store.get('qualityDisputes') || [];

    const farmers = Object.values(reps);
    const totalFarmers = farmers.length || 1;
    const avgReputation = farmers.reduce((sum, f) => sum + f.reputationScore, 0) / totalFarmers;
    const suspendedFarmers = farmers.filter(f => f.strikes >= this.MAX_STRIKES).length;
    const totalStrikes = farmers.reduce((sum, f) => sum + f.strikes, 0);
    const activeDisputes = disputes.filter(d => d.status === 'open').length;
    const resolvedDisputes = disputes.filter(d => d.status !== 'open').length;
    const productsBlocked = farmers.reduce((sum, f) => sum + f.failedChecks, 0);

    return {
      totalFarmers,
      avgReputation: Math.round(avgReputation),
      suspendedFarmers,
      totalStrikes,
      activeDisputes,
      resolvedDisputes,
      productsBlocked,
      qualityPassRate: farmers.length > 0
        ? Math.round((farmers.reduce((sum, f) => sum + f.passedChecks, 0) / Math.max(1, farmers.reduce((sum, f) => sum + f.totalChecks, 0))) * 100)
        : 100,
    };
  }

  /**
   * Generate demo reputation data for seeded farmers
   */
  static seedDemoReputations() {
    const reps = store.get('farmerReputations') || {};

    // Only seed if no data exists
    if (Object.keys(reps).length > 0) return;

    const demoFarmers = {
      'farmer_rajesh': {
        farmerId: 'farmer_rajesh',
        reputationScore: 92,
        strikes: 0,
        totalChecks: 15,
        passedChecks: 15,
        failedChecks: 0,
        qualityHistory: [
          { productId: 'PROD-demo-1', score: 94, stage: 'registration', passed: true, timestamp: Date.now() - 86400000 * 10 },
          { productId: 'PROD-demo-2', score: 87, stage: 'registration', passed: true, timestamp: Date.now() - 86400000 * 5 },
          { productId: 'PROD-demo-1', score: 91, stage: 'intermediary_check', passed: true, timestamp: Date.now() - 86400000 * 8 },
        ],
        penalties: [],
        lastUpdated: Date.now(),
      },
      'farmer_priya': {
        farmerId: 'farmer_priya',
        reputationScore: 78,
        strikes: 1,
        totalChecks: 12,
        passedChecks: 11,
        failedChecks: 1,
        qualityHistory: [
          { productId: 'PROD-demo-3', score: 82, stage: 'registration', passed: true, timestamp: Date.now() - 86400000 * 15 },
          { productId: 'PROD-demo-4', score: 35, stage: 'registration', passed: false, timestamp: Date.now() - 86400000 * 3 },
        ],
        penalties: [
          { action: 'warning', farmerShareReduction: 5, fraudType: 'low_quality', productId: 'PROD-demo-4', score: 35, timestamp: Date.now() - 86400000 * 3 },
        ],
        lastUpdated: Date.now(),
      },
      'farmer_demo_fraud': {
        farmerId: 'farmer_demo_fraud',
        reputationScore: 25,
        strikes: 3,
        totalChecks: 8,
        passedChecks: 5,
        failedChecks: 3,
        qualityHistory: [
          { productId: 'PROD-demo-5', score: 15, stage: 'registration', passed: false, timestamp: Date.now() - 86400000 * 20 },
          { productId: 'PROD-demo-6', score: 22, stage: 'registration', passed: false, timestamp: Date.now() - 86400000 * 12 },
          { productId: 'PROD-demo-7', score: 30, stage: 'intermediary_check', passed: false, timestamp: Date.now() - 86400000 * 5 },
        ],
        penalties: [
          { action: 'warning', farmerShareReduction: 5, fraudType: 'waste_product', strikeNumber: 1, timestamp: Date.now() - 86400000 * 20 },
          { action: 'delist', farmerShareReduction: 50, fraudType: 'waste_product', strikeNumber: 2, timestamp: Date.now() - 86400000 * 12 },
          { action: 'suspend', farmerShareReduction: 100, fraudType: 'quality_mismatch', strikeNumber: 3, timestamp: Date.now() - 86400000 * 5 },
        ],
        lastUpdated: Date.now(),
      },
    };

    store.set('farmerReputations', demoFarmers);

    // Seed demo disputes
    const demoDisputes = [
      {
        disputeId: 'DSP-demo-1',
        orderId: 'ORD-demo-1',
        farmerId: 'farmer_demo_fraud',
        disputeBy: 'intermediary',
        originalScore: 78,
        reVerificationScore: 35,
        scoreDifference: 43,
        isMismatch: true,
        status: 'resolved_against_farmer',
        createdAt: Date.now() - 86400000 * 5,
        resolution: {
          action: 'full_refund',
          refundPercentage: 100,
          farmerPenalty: true,
          message: 'Quality dropped 43% from registration (78% → 35%). Full refund issued.',
        },
      },
      {
        disputeId: 'DSP-demo-2',
        orderId: 'ORD-demo-2',
        farmerId: 'farmer_priya',
        disputeBy: 'retailer',
        originalScore: 82,
        reVerificationScore: 70,
        scoreDifference: 12,
        isMismatch: false,
        status: 'resolved_no_action',
        createdAt: Date.now() - 86400000 * 2,
        resolution: {
          action: 'none',
          refundPercentage: 0,
          farmerPenalty: false,
          message: 'Quality difference (12%) is within acceptable tolerance (±20%).',
        },
      },
    ];

    store.set('qualityDisputes', demoDisputes);
  }

  /**
   * Render farmer reputation badge HTML
   * @param {string} farmerId
   * @returns {string} HTML string
   */
  static renderReputationBadge(farmerId) {
    const rep = this.getFarmerReputation(farmerId);
    const scoreColor = rep.reputationScore >= 80 ? '#22c55e' :
      rep.reputationScore >= 60 ? '#f59e0b' :
      rep.reputationScore >= 40 ? '#f97316' : '#ef4444';

    const strikeIcons = '🔴'.repeat(rep.strikes) + '⚪'.repeat(Math.max(0, this.MAX_STRIKES - rep.strikes));

    return `
      <div style="background: rgba(0,0,0,0.25); border: 1px solid ${scoreColor}33; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary, #fff);">🛡️ Farmer Trust Score</div>
          <div style="font-size: 1.2rem; font-weight: 800; color: ${scoreColor};">${rep.reputationScore}%</div>
        </div>
        <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
          <div style="width: ${rep.reputationScore}%; height: 100%; background: ${scoreColor}; border-radius: 3px; transition: width 0.5s;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted, rgba(255,255,255,0.5));">
          <span>Strikes: ${strikeIcons}</span>
          <span>Pass Rate: ${rep.totalChecks > 0 ? Math.round((rep.passedChecks / rep.totalChecks) * 100) : 100}%</span>
          <span>Checks: ${rep.totalChecks}</span>
        </div>
        ${rep.strikes >= this.MAX_STRIKES ? `
          <div style="margin-top: 8px; padding: 6px 10px; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); border-radius: 8px; font-size: 0.75rem; color: #ef4444; font-weight: 600;">
            ⛔ ACCOUNT SUSPENDED — Contact admin to resolve quality disputes
          </div>
        ` : rep.strikes > 0 ? `
          <div style="margin-top: 8px; padding: 6px 10px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); border-radius: 8px; font-size: 0.75rem; color: #f59e0b;">
            ⚠️ ${this.MAX_STRIKES - rep.strikes} strike(s) remaining before suspension
          </div>
        ` : ''}
      </div>
    `;
  }
}
