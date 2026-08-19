// server/services/mandiData.js
// Live AgMarkNet & eNAM Mandi spot price simulation engine

export const MANDI_BENCHMARK_RATES = {
  Rice: { baseMandiPrice: 2450, arrivalsQuintals: 12400, marketTrend: "up", state: "Punjab / Tamil Nadu", volatility: 0.04 },
  Wheat: { baseMandiPrice: 2380, arrivalsQuintals: 18200, marketTrend: "stable", state: "Madhya Pradesh / Haryana", volatility: 0.03 },
  Tomato: { baseMandiPrice: 1450, arrivalsQuintals: 32000, marketTrend: "down", state: "Maharashtra / Karnataka", volatility: 0.12 },
  Onion: { baseMandiPrice: 2100, arrivalsQuintals: 28000, marketTrend: "up", state: "Nashik, Maharashtra", volatility: 0.09 },
  Potato: { baseMandiPrice: 1150, arrivalsQuintals: 45000, marketTrend: "stable", state: "Uttar Pradesh", volatility: 0.05 },
  Mango: { baseMandiPrice: 4200, arrivalsQuintals: 6500, marketTrend: "up", state: "Ratnagiri, Maharashtra", volatility: 0.08 },
  Turmeric: { baseMandiPrice: 10800, arrivalsQuintals: 2800, marketTrend: "up", state: "Erode, Tamil Nadu", volatility: 0.06 },
  Banana: { baseMandiPrice: 1850, arrivalsQuintals: 15000, marketTrend: "stable", state: "Trichy, Tamil Nadu", volatility: 0.04 },
  Cotton: { baseMandiPrice: 7200, arrivalsQuintals: 8900, marketTrend: "down", state: "Gujarat / Telangana", volatility: 0.07 },
  Sugarcane: { baseMandiPrice: 3400, arrivalsQuintals: 52000, marketTrend: "stable", state: "Maharashtra / UP", volatility: 0.02 },
};

/**
 * Returns dynamic live Mandi spot prices with simulated intraday market fluctuations
 */
export function getLiveMandiRates() {
  const result = {};
  const now = new Date();
  
  for (const [crop, data] of Object.entries(MANDI_BENCHMARK_RATES)) {
    // Generate slight live volatility based on hour of day
    const hourFactor = Math.sin((now.getHours() + now.getMinutes() / 60) * 0.5);
    const fluctuation = (Math.random() - 0.48) * data.baseMandiPrice * data.volatility + (hourFactor * 15);
    const currentRate = Math.round(data.baseMandiPrice + fluctuation);

    result[crop] = {
      crop,
      modalPriceQuintal: currentRate,
      pricePerKg: +(currentRate / 100).toFixed(2),
      arrivalsQuintals: data.arrivalsQuintals + Math.round((Math.random() - 0.5) * 500),
      trend: data.marketTrend,
      primaryMandi: data.state,
      lastUpdated: now.toISOString(),
    };
  }
  return result;
}
