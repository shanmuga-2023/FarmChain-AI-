// ============================================
// FarmChain AI — Fraud Detection Engine
// Scores transactions based on anomaly signals
// + QR Clone Velocity Detection
// + AI Visual Oracle quality gate
// + Quality Mismatch & Repeat Offender Detection
// ============================================

import { i18n } from '../i18n/index.js';

export class FraudDetector {
  static analyzeTransaction(transaction) {
    let riskScore = 0;
    const flags = [];

    // 1. Price deviation check (>40% above/below market)
    if (transaction.priceDeviation && Math.abs(transaction.priceDeviation) > 40) {
      riskScore += 35;
      flags.push({
        type: 'PRICE_ANOMALY',
        severity: 'high',
        message: i18n.t('ai.flagPriceAnomaly', { percent: Math.abs(transaction.priceDeviation).toFixed(0) }) ||
          `Price deviates ${Math.abs(transaction.priceDeviation).toFixed(0)}% from market average`,
      });
    } else if (transaction.priceDeviation && Math.abs(transaction.priceDeviation) > 20) {
      riskScore += 15;
      flags.push({
        type: 'PRICE_WARNING',
        severity: 'medium',
        message: i18n.t('ai.flagPriceWarning', { percent: Math.abs(transaction.priceDeviation).toFixed(0) }) ||
          `Price deviates ${Math.abs(transaction.priceDeviation).toFixed(0)}% from market average`,
      });
    }

    // 2. Volume anomaly (unusually large orders)
    if (transaction.quantity > 5000) {
      riskScore += 25;
      flags.push({
        type: 'VOLUME_ANOMALY',
        severity: 'high',
        message: i18n.t('ai.flagVolumeAnomaly', { qty: transaction.quantity, unit: transaction.unit || 'kg' }) ||
          `Unusually large order: ${transaction.quantity} ${transaction.unit || 'kg'}`,
      });
    } else if (transaction.quantity > 2000) {
      riskScore += 10;
      flags.push({
        type: 'VOLUME_WARNING',
        severity: 'low',
        message: i18n.t('ai.flagVolumeWarning', { qty: transaction.quantity, unit: transaction.unit || 'kg' }) ||
          `Large order volume: ${transaction.quantity} ${transaction.unit || 'kg'}`,
      });
    }

    // 3. Rapid transfers (multiple transfers within 1 hour)
    if (transaction.transferCount && transaction.transferCount > 3) {
      riskScore += 30;
      flags.push({
        type: 'RAPID_TRANSFER',
        severity: 'high',
        message: i18n.t('ai.flagRapidTransfer', { count: transaction.transferCount }) ||
          `${transaction.transferCount} ownership transfers in rapid succession`,
      });
    }

    // 4. New account activity
    if (transaction.accountAge && transaction.accountAge < 7) {
      riskScore += 15;
      flags.push({
        type: 'NEW_ACCOUNT',
        severity: 'medium',
        message: i18n.t('ai.flagNewAccount', { days: transaction.accountAge }) ||
          `Account is only ${transaction.accountAge} day(s) old`,
      });
    }

    // 5. Inconsistent location
    if (transaction.locationMismatch) {
      riskScore += 20;
      flags.push({
        type: 'LOCATION_MISMATCH',
        severity: 'medium',
        message: i18n.t('ai.flagLocationMismatch') || 'Product origin doesn\'t match seller location',
      });
    }

    // 6. QR Clone Velocity Detection (Spatial-Temporal Anti-Cloning)
    if (transaction.qrCloneVelocity && transaction.qrCloneVelocity > 500) {
      riskScore += 50;
      flags.push({
        type: 'QR_CLONE_VELOCITY',
        severity: 'high',
        message: i18n.t('ai.flagQrCloneVelocity', { velocity: transaction.qrCloneVelocity.toLocaleString() }) ||
          `🚨 QR scanned at ${transaction.qrCloneVelocity.toLocaleString()} km/h — physically impossible velocity detected`,
      });
    } else if (transaction.qrCloneVelocity && transaction.qrCloneVelocity > 120) {
      riskScore += 20;
      flags.push({
        type: 'QR_VELOCITY_WARNING',
        severity: 'medium',
        message: i18n.t('ai.flagQrVelocityWarning', { velocity: transaction.qrCloneVelocity.toLocaleString() }) ||
          `QR scan velocity ${transaction.qrCloneVelocity.toLocaleString()} km/h — possible QR sharing or rapid transport`,
      });
    }

    // 7. AI Visual Oracle — No quality verification
    if (transaction.noAiVerification) {
      riskScore += 10;
      flags.push({
        type: 'NO_AI_VERIFICATION',
        severity: 'low',
        message: i18n.t('ai.flagNoAi') || 'Product registered without AI Visual Oracle quality verification (GIGO risk)',
      });
    }

    // 8. AI quality score below threshold
    if (transaction.aiQualityScore && transaction.aiQualityScore < 40) {
      riskScore += 25;
      flags.push({
        type: 'LOW_AI_QUALITY',
        severity: 'high',
        message: i18n.t('ai.flagLowAi', { score: transaction.aiQualityScore }) ||
          `AI Visual Oracle scored ${transaction.aiQualityScore}% — below quality gate threshold`,
      });
    }

    // 9. Quality Mismatch — Re-verification score differs >20% from original
    if (transaction.qualityMismatch && transaction.qualityMismatch > 20) {
      riskScore += 40;
      flags.push({
        type: 'QUALITY_MISMATCH',
        severity: 'high',
        message: i18n.t('ai.flagQualityMismatch', { mismatch: transaction.qualityMismatch, stage: transaction.mismatchStage || 'checkpoint', original: transaction.originalScore, reverify: transaction.reVerifyScore }) ||
          `🚨 Quality mismatch: Score dropped ${transaction.qualityMismatch}% at ${transaction.mismatchStage || 'checkpoint'} (${transaction.originalScore}% → ${transaction.reVerifyScore}%)`,
      });
    }

    // 10. Repeat Quality Offender — Farmer with 2+ quality strikes
    if (transaction.qualityStrikes && transaction.qualityStrikes >= 2) {
      riskScore += 35;
      flags.push({
        type: 'REPEAT_QUALITY_OFFENDER',
        severity: 'high',
        message: i18n.t('ai.flagRepeatOffender', { strikes: transaction.qualityStrikes, reputation: transaction.farmerReputation || 'N/A' }) ||
          `⛔ Repeat offender: ${transaction.qualityStrikes} quality strikes. Farmer reputation: ${transaction.farmerReputation || 'N/A'}%`,
      });
    } else if (transaction.qualityStrikes && transaction.qualityStrikes >= 1) {
      riskScore += 15;
      flags.push({
        type: 'QUALITY_STRIKE_WARNING',
        severity: 'medium',
        message: i18n.t('ai.flagQualityStrikeWarning', { strikes: transaction.qualityStrikes }) ||
          `⚠️ Farmer has ${transaction.qualityStrikes} quality strike(s). Under monitoring.`,
      });
    }

    // 11. Waste Product Attempt — Farmer tried to register product with score <20%
    if (transaction.wasteProductAttempt) {
      riskScore += 45;
      flags.push({
        type: 'WASTE_PRODUCT_ATTEMPT',
        severity: 'high',
        message: i18n.t('ai.flagWasteAttempt', { score: transaction.wasteProductScore || '<20' }) ||
          `🚨 Waste product registration attempt! AI score: ${transaction.wasteProductScore || '<20'}% — deliberately submitting waste/rotten produce`,
      });
    }

    // 12. GPS Location Mismatch — Camera GPS doesn't match registered farm
    if (transaction.gpsLocationMismatch) {
      riskScore += 25;
      flags.push({
        type: 'GPS_LOCATION_MISMATCH',
        severity: 'high',
        message: i18n.t('ai.flagGpsMismatch', { captured: transaction.capturedLocation || 'unknown', registered: transaction.registeredLocation || 'unknown', dist: transaction.gpsDistance || '?' }) ||
          `📍 Camera GPS (${transaction.capturedLocation || 'unknown'}) doesn't match registered farm (${transaction.registeredLocation || 'unknown'}) — ${transaction.gpsDistance || '?'} km away`,
      });
    }

    // 13. No Live Camera Verification — File upload only (unverified)
    if (transaction.noLiveVerification) {
      riskScore += 8;
      flags.push({
        type: 'NO_LIVE_VERIFICATION',
        severity: 'low',
        message: i18n.t('ai.flagNoLive') || '📁 Product registered via file upload — no live camera GPS/timestamp verification',
      });
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    // Determine risk level
    let riskLevel;
    if (riskScore >= 70) riskLevel = 'critical';
    else if (riskScore >= 40) riskLevel = 'high';
    else if (riskScore >= 20) riskLevel = 'medium';
    else riskLevel = 'low';

    return {
      riskScore,
      riskLevel,
      flags,
      isApproved: riskScore < 70,
      recommendation: riskScore >= 70
        ? (i18n.t('ai.recBlock') || '🚨 Block transaction — manual review required')
        : riskScore >= 40
          ? (i18n.t('ai.recFlag') || '⚠️ Flag for review — proceed with caution')
          : riskScore >= 20
            ? (i18n.t('ai.recMinor') || 'ℹ️ Minor flags — monitor activity')
            : (i18n.t('ai.recLegit') || '✅ Transaction appears legitimate'),
    };
  }

  static generateAlerts(transactions) {
    return transactions
      .map(tx => {
        const analysis = this.analyzeTransaction(tx);
        if (analysis.riskScore >= 20) {
          return {
            ...analysis,
            transaction: tx,
            alertId: `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            timestamp: Date.now(),
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  static generateDemoAlerts() {
    const demoTransactions = [
      { productName: 'Premium Basmati Rice', quantity: 8000, unit: 'kg', priceDeviation: 55, accountAge: 2, transferCount: 5 },
      { productName: 'Organic Tomatoes', quantity: 500, unit: 'kg', priceDeviation: -35, accountAge: 30 },
      { productName: 'Fresh Onions', quantity: 3000, unit: 'kg', priceDeviation: 45, locationMismatch: true },
      { productName: 'Alphonso Mangoes', quantity: 200, unit: 'kg', priceDeviation: 10, accountAge: 120 },
      { productName: 'Raw Cotton', quantity: 6000, unit: 'kg', priceDeviation: 25, accountAge: 5, transferCount: 4 },
      // QR Clone demo alert
      { productName: '🚨 Cloned QR — Organic Rice Batch', quantity: 500, unit: 'kg', priceDeviation: 0, qrCloneVelocity: 12500, accountAge: 45 },
      // No AI verification demo
      { productName: 'Unverified Wheat Batch', quantity: 1000, unit: 'kg', priceDeviation: 15, noAiVerification: true, accountAge: 3 },
      // NEW: Quality mismatch — farmer cheating intermediary
      {
        productName: '🚨 Quality Fraud — Rotten Tomatoes sold as Premium',
        quantity: 800, unit: 'kg', priceDeviation: 0,
        qualityMismatch: 43, mismatchStage: 'intermediary re-verification',
        originalScore: 78, reVerifyScore: 35,
        qualityStrikes: 2, farmerReputation: 25,
      },
      // NEW: Waste product attempt
      {
        productName: '🚨 Waste Product — Composted Potatoes',
        quantity: 200, unit: 'kg', priceDeviation: -10,
        wasteProductAttempt: true, wasteProductScore: 12,
        qualityStrikes: 1, farmerReputation: 40,
      },
      // NEW: GPS mismatch — photo taken far from farm
      {
        productName: '📍 GPS Fraud — Rice (photo from warehouse, not farm)',
        quantity: 500, unit: 'kg', priceDeviation: 5,
        gpsLocationMismatch: true, capturedLocation: 'Mumbai Warehouse',
        registeredLocation: 'Nashik Farm', gpsDistance: 180,
        noLiveVerification: false,
      },
      // NEW: Repeat offender with multiple strikes
      {
        productName: '⛔ Suspended Farmer — Repeated Quality Fraud',
        quantity: 300, unit: 'kg', priceDeviation: 0,
        qualityStrikes: 3, farmerReputation: 15,
        wasteProductAttempt: true, wasteProductScore: 18,
      },
    ];

    return demoTransactions.map(tx => ({
      ...this.analyzeTransaction(tx),
      transaction: tx,
      alertId: `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now() - Math.random() * 86400000,
    })).sort((a, b) => b.riskScore - a.riskScore);
  }
}
