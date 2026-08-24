// ============================================
// FarmChain AI — Fraud Detection Engine
// Scores transactions based on anomaly signals
// + QR Clone Velocity Detection
// + AI Visual Oracle quality gate
// ============================================

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
        message: `Price deviates ${Math.abs(transaction.priceDeviation).toFixed(0)}% from market average`,
      });
    } else if (transaction.priceDeviation && Math.abs(transaction.priceDeviation) > 20) {
      riskScore += 15;
      flags.push({
        type: 'PRICE_WARNING',
        severity: 'medium',
        message: `Price deviates ${Math.abs(transaction.priceDeviation).toFixed(0)}% from market average`,
      });
    }

    // 2. Volume anomaly (unusually large orders)
    if (transaction.quantity > 5000) {
      riskScore += 25;
      flags.push({
        type: 'VOLUME_ANOMALY',
        severity: 'high',
        message: `Unusually large order: ${transaction.quantity} ${transaction.unit || 'kg'}`,
      });
    } else if (transaction.quantity > 2000) {
      riskScore += 10;
      flags.push({
        type: 'VOLUME_WARNING',
        severity: 'low',
        message: `Large order volume: ${transaction.quantity} ${transaction.unit || 'kg'}`,
      });
    }

    // 3. Rapid transfers (multiple transfers within 1 hour)
    if (transaction.transferCount && transaction.transferCount > 3) {
      riskScore += 30;
      flags.push({
        type: 'RAPID_TRANSFER',
        severity: 'high',
        message: `${transaction.transferCount} ownership transfers in rapid succession`,
      });
    }

    // 4. New account activity
    if (transaction.accountAge && transaction.accountAge < 7) {
      riskScore += 15;
      flags.push({
        type: 'NEW_ACCOUNT',
        severity: 'medium',
        message: `Account is only ${transaction.accountAge} day(s) old`,
      });
    }

    // 5. Inconsistent location
    if (transaction.locationMismatch) {
      riskScore += 20;
      flags.push({
        type: 'LOCATION_MISMATCH',
        severity: 'medium',
        message: 'Product origin doesn\'t match seller location',
      });
    }

    // 6. QR Clone Velocity Detection (Spatial-Temporal Anti-Cloning)
    if (transaction.qrCloneVelocity && transaction.qrCloneVelocity > 500) {
      riskScore += 50;
      flags.push({
        type: 'QR_CLONE_VELOCITY',
        severity: 'high',
        message: `🚨 QR scanned at ${transaction.qrCloneVelocity.toLocaleString()} km/h — physically impossible velocity detected`,
      });
    } else if (transaction.qrCloneVelocity && transaction.qrCloneVelocity > 120) {
      riskScore += 20;
      flags.push({
        type: 'QR_VELOCITY_WARNING',
        severity: 'medium',
        message: `QR scan velocity ${transaction.qrCloneVelocity.toLocaleString()} km/h — possible QR sharing or rapid transport`,
      });
    }

    // 7. AI Visual Oracle — No quality verification
    if (transaction.noAiVerification) {
      riskScore += 10;
      flags.push({
        type: 'NO_AI_VERIFICATION',
        severity: 'low',
        message: 'Product registered without AI Visual Oracle quality verification (GIGO risk)',
      });
    }

    // 8. AI quality score below threshold
    if (transaction.aiQualityScore && transaction.aiQualityScore < 40) {
      riskScore += 25;
      flags.push({
        type: 'LOW_AI_QUALITY',
        severity: 'high',
        message: `AI Visual Oracle scored ${transaction.aiQualityScore}% — below quality gate threshold`,
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
        ? '🚨 Block transaction — manual review required'
        : riskScore >= 40
          ? '⚠️ Flag for review — proceed with caution'
          : riskScore >= 20
            ? 'ℹ️ Minor flags — monitor activity'
            : '✅ Transaction appears legitimate',
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
    ];

    return demoTransactions.map(tx => ({
      ...this.analyzeTransaction(tx),
      transaction: tx,
      alertId: `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now() - Math.random() * 86400000,
    })).sort((a, b) => b.riskScore - a.riskScore);
  }
}

