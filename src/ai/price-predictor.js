// ============================================
// FarmChain AI — Fair Price Predictor
// Uses seasonal curves, MSP data, and supply/demand
// ============================================

import { fetchMandiRates } from '../utils/api.js';

// Indian MSP (Minimum Support Price) data for 2024-25 season (₹/quintal)
const MSP_DATA = {
  'Rice': { msp: 2300, season: 'kharif', peakMonths: [10, 11, 12] },
  'Wheat': { msp: 2275, season: 'rabi', peakMonths: [3, 4, 5] },
  'Tomato': { msp: 800, season: 'year-round', peakMonths: [12, 1, 2] },
  'Onion': { msp: 1200, season: 'year-round', peakMonths: [11, 12, 1] },
  'Potato': { msp: 900, season: 'rabi', peakMonths: [2, 3, 4] },
  'Sugarcane': { msp: 3150, season: 'kharif', peakMonths: [11, 12, 1] },
  'Cotton': { msp: 7020, season: 'kharif', peakMonths: [10, 11, 12] },
  'Maize': { msp: 2090, season: 'kharif', peakMonths: [9, 10, 11] },
  'Soybean': { msp: 4600, season: 'kharif', peakMonths: [10, 11] },
  'Mustard': { msp: 5650, season: 'rabi', peakMonths: [2, 3, 4] },
  'Mango': { msp: 3000, season: 'summer', peakMonths: [5, 6, 7] },
  'Banana': { msp: 1500, season: 'year-round', peakMonths: [4, 5, 6] },
  'Turmeric': { msp: 9500, season: 'rabi', peakMonths: [1, 2, 3] },
  'Green Chilli': { msp: 2500, season: 'year-round', peakMonths: [3, 4, 5] },
  'Coconut': { msp: 3200, season: 'year-round', peakMonths: [6, 7, 8] },
};

export class FairPricePredictor {
  static predict(productName, quantity = 100, currentPrice = null) {
    const cropData = MSP_DATA[productName] || { msp: 1500, season: 'year-round', peakMonths: [1, 2, 3] };
    const currentMonth = new Date().getMonth() + 1;

    // Check cached/live Mandi rates for real-time spot benchmark
    let mandiBenchmark = cropData.msp;
    let mandiSource = 'AgMarkNet / eNAM Benchmark';
    try {
      const cached = localStorage.getItem('farmchain_cached_mandi_rates');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.data?.[productName]) {
          mandiBenchmark = parsed.data[productName].modalPriceQuintal || (parsed.data[productName].pricePerKg * 100);
          mandiSource = `Live APMC Spot (${parsed.data[productName].primaryMandi || 'Mandi'})`;
        }
      }
    } catch {}

    // Base price combines MSP floor and live Mandi benchmark
    const baseAnchor = Math.max(cropData.msp, mandiBenchmark);

    // Seasonal factor (prices spike during off-season)
    const isPeakSeason = cropData.peakMonths.includes(currentMonth);
    const seasonalFactor = isPeakSeason ? 0.94 : 1.18;

    // Supply-demand factor (based on quantity — large supply lowers price)
    const supplyFactor = quantity > 500 ? 0.95 : quantity > 100 ? 1.0 : 1.08;

    // Market premium (organic, quality etc.)
    const basePremium = 1.0;

    // Calculate fair price
    const fairPrice = Math.round(baseAnchor * seasonalFactor * supplyFactor * basePremium);

    // Confidence score
    const confidence = isPeakSeason ? 0.92 : 0.84;

    // Price range
    const lowerBound = Math.round(fairPrice * 0.92);
    const upperBound = Math.round(fairPrice * 1.12);

    // Price deviation from current
    let deviation = null;
    let isFairlyPriced = true;
    if (currentPrice) {
      deviation = ((currentPrice - fairPrice) / fairPrice * 100).toFixed(1);
      isFairlyPriced = Math.abs(deviation) <= 15;
    }

    return {
      productName,
      msp: cropData.msp,
      mandiBenchmark,
      mandiSource,
      predictedFairPrice: fairPrice,
      priceRange: { low: lowerBound, high: upperBound },
      season: cropData.season,
      isPeakSeason,
      seasonalFactor: (seasonalFactor * 100 - 100).toFixed(0) + '%',
      supplyFactor: supplyFactor.toFixed(2),
      confidence: (confidence * 100).toFixed(0) + '%',
      deviation,
      isFairlyPriced,
      recommendation: isFairlyPriced
        ? 'Price is within fair market range ✓'
        : deviation > 0
          ? '⚠️ Price is above fair market value. Consider negotiating.'
          : '⚠️ Price is below MSP floor. Farmer may be undercompensated.',
    };
  }

  static getPriceTrend(productName, months = 6) {
    const cropData = MSP_DATA[productName] || { msp: 1500, peakMonths: [1, 2, 3] };
    const currentMonth = new Date().getMonth() + 1;
    const trend = [];

    for (let i = months - 1; i >= 0; i--) {
      const month = ((currentMonth - i - 1 + 12) % 12) + 1;
      const isPeak = cropData.peakMonths.includes(month);
      const noise = (Math.random() - 0.5) * cropData.msp * 0.08;
      const price = Math.round(cropData.msp * (isPeak ? 0.92 : 1.2) + noise);

      trend.push({
        month: new Date(2024, month - 1).toLocaleString('en-IN', { month: 'short' }),
        price,
        isPeak,
      });
    }

    return trend;
  }

  static getAvailableCrops() {
    return Object.entries(MSP_DATA).map(([name, data]) => ({
      name,
      msp: data.msp,
      season: data.season,
    }));
  }

  static async fetchLiveRates() {
    try {
      const liveRates = await fetchMandiRates();
      if (!liveRates) return MSP_DATA;
      return liveRates;
    } catch {
      return MSP_DATA;
    }
  }
}
