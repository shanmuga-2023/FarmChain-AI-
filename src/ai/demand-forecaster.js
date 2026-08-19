// ============================================
// FarmChain AI — Demand Forecaster
// Time-series projection with seasonal decomposition
// ============================================

export class DemandForecaster {
  static forecast(productName, historicalData = null, forecastMonths = 6) {
    // Generate synthetic historical data if not provided
    const history = historicalData || this._generateHistory(productName, 12);

    // Calculate weighted moving average
    const weights = [0.1, 0.15, 0.25, 0.5]; // Recent months weighted higher
    const wmaValues = [];

    for (let i = weights.length - 1; i < history.length; i++) {
      let wma = 0;
      for (let j = 0; j < weights.length; j++) {
        wma += history[i - j].demand * weights[weights.length - 1 - j];
      }
      wmaValues.push(wma);
    }

    // Calculate trend (simple linear regression on WMA)
    const n = wmaValues.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += wmaValues[i];
      sumXY += i * wmaValues[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecast
    const forecast = [];
    const currentMonth = new Date().getMonth();
    const lastDemand = history[history.length - 1].demand;

    for (let i = 0; i < forecastMonths; i++) {
      const monthIndex = (currentMonth + i + 1) % 12;
      const trendValue = slope * (n + i) + intercept;
      const seasonalFactor = this._getSeasonalFactor(productName, monthIndex);
      const noise = (Math.random() - 0.5) * lastDemand * 0.05;

      const predicted = Math.max(0, Math.round(trendValue * seasonalFactor + noise));
      const confidence = Math.max(0.6, 0.95 - i * 0.05);

      forecast.push({
        month: new Date(2024, monthIndex).toLocaleString('en-IN', { month: 'short' }),
        monthIndex,
        predicted,
        lower: Math.round(predicted * (1 - (1 - confidence) * 1.5)),
        upper: Math.round(predicted * (1 + (1 - confidence) * 1.5)),
        confidence: (confidence * 100).toFixed(0) + '%',
      });
    }

    // Calculate summary stats
    const avgDemand = Math.round(forecast.reduce((s, f) => s + f.predicted, 0) / forecast.length);
    const peakMonth = forecast.reduce((max, f) => f.predicted > max.predicted ? f : max);
    const trendDirection = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';
    const trendPercentage = Math.abs((slope / (intercept || 1)) * 100).toFixed(1);

    return {
      productName,
      history: history.slice(-6),
      forecast,
      summary: {
        avgDemand,
        peakMonth: peakMonth.month,
        peakDemand: peakMonth.predicted,
        trend: trendDirection,
        trendPercentage,
        recommendation: trendDirection === 'increasing'
          ? `📈 Demand is trending up by ${trendPercentage}% monthly. Consider increasing production.`
          : trendDirection === 'decreasing'
            ? `📉 Demand is declining by ${trendPercentage}% monthly. Consider diversifying crops.`
            : `📊 Demand is stable. Maintain current production levels.`,
      },
    };
  }

  static _generateHistory(productName, months) {
    const baseDemand = {
      'Rice': 5000, 'Wheat': 4500, 'Tomato': 3000,
      'Onion': 3500, 'Potato': 2800, 'Cotton': 2000,
      'Mango': 1500, 'Banana': 2500, 'Sugarcane': 4000,
      'Turmeric': 800,
    };

    const base = baseDemand[productName] || 2000;
    const currentMonth = new Date().getMonth();
    const history = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthIndex = ((currentMonth - i) + 12) % 12;
      const seasonal = this._getSeasonalFactor(productName, monthIndex);
      const noise = (Math.random() - 0.5) * base * 0.15;
      const trend = base * (1 + (months - i) * 0.01); // slight upward trend

      history.push({
        month: new Date(2024, monthIndex).toLocaleString('en-IN', { month: 'short' }),
        monthIndex,
        demand: Math.max(0, Math.round(trend * seasonal + noise)),
      });
    }

    return history;
  }

  static _getSeasonalFactor(productName, monthIndex) {
    // Month-specific seasonal factors for Indian agriculture
    const seasonalPatterns = {
      'Rice': [0.7, 0.6, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.2, 0.9],
      'Wheat': [0.9, 1.0, 1.2, 1.3, 1.2, 0.8, 0.6, 0.6, 0.7, 0.8, 0.9, 0.9],
      'Tomato': [1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.2],
      'Onion': [1.2, 1.1, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 1.0, 1.1, 1.3, 1.3],
      'Mango': [0.4, 0.5, 0.7, 1.0, 1.5, 1.5, 1.3, 0.8, 0.4, 0.3, 0.3, 0.3],
    };

    const pattern = seasonalPatterns[productName];
    if (pattern) return pattern[monthIndex];

    // Default gentle pattern
    return 0.85 + Math.sin(monthIndex / 12 * Math.PI * 2) * 0.15;
  }

  static getMarketInsights() {
    const crops = ['Rice', 'Wheat', 'Tomato', 'Onion', 'Potato', 'Mango'];
    return crops.map(crop => {
      const result = this.forecast(crop, null, 3);
      return {
        crop,
        currentDemand: result.history[result.history.length - 1]?.demand || 0,
        forecastDemand: result.forecast[0]?.predicted || 0,
        trend: result.summary.trend,
        trendPercentage: result.summary.trendPercentage,
      };
    });
  }
}
