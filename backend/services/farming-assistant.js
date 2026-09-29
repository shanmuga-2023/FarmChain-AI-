// backend/services/farming-assistant.js
// AI Farming Assistant service — prompt engineering, tool dispatch, rate limiting
import { db } from '../db.js';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Rate limiting: max 30 requests per user per 5 minutes
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(userId, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// FarmChain-aware tool functions
export function getFarmerProfile(userId) {
  const users = db.get('users') || {};
  return users[userId] || null;
}

export function getFarmerBatches(userId) {
  const products = db.get('products') || [];
  return products.filter(p => p.farmerId === userId || p.sellerId === userId);
}

export function getOrderStatus(userId) {
  const orders = db.get('orders') || [];
  return orders.filter(o => o.sellerId === userId || o.buyerId === userId);
}

export function getDeliveryStatus(userId) {
  const deliveries = db.get('deliveries') || [];
  return deliveries.filter(d => d.farmerId === userId || d.consumerId === userId);
}

export function getPaymentStatus(userId) {
  const payments = db.get('payments') || [];
  return payments.filter(p => p.sellerId === userId || p.buyerId === userId);
}

export function getMandiPrices() {
  try {
    const { getLiveMandiRates } = require('../services/mandiData.js');
    return getLiveMandiRates();
  } catch {
    return { crops: [], lastUpdated: new Date().toISOString() };
  }
}

export function getInvoices(userId) {
  const invoices = db.get('invoices') || [];
  return invoices.filter(inv => inv.seller?.id === userId || inv.buyer?.id === userId);
}

// Build system prompt for the AI
function buildSystemPrompt(lang = 'en') {
  const langNames = { en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu' };
  const langName = langNames[lang] || 'English';

  return `You are Aura Bot, a smart and friendly AI assistant for Indian farmers using the FarmChain platform.

IMPORTANT RULES:
1. Respond in ${langName} (${lang}).
2. Be helpful, warm, and conversational. You can answer ANY question — general knowledge, science, health, math, recipes, advice, etc.
3. For crop disease questions, explain possible causes carefully and recommend consulting an agricultural expert for confirmation.
4. Never present AI diagnosis as guaranteed or definitive.
5. For FarmChain platform questions, help with orders, deliveries, payments, and product listings.
6. Use simple, friendly language. Avoid complex blockchain jargon.
7. If you're uncertain about something, say so honestly.
8. Keep responses clear and concise — under 350 words unless the user explicitly asks for more detail.
9. When answering farming or FarmChain questions, you can pull from platform context provided. For all other questions, answer to the best of your ability like a knowledgeable friend.

PLATFORM CONTEXT:
- FarmChain connects farmers directly to consumers
- Products are quality-graded by AI
- Deliveries are tracked in real-time
- Payments are transparent with farmer getting 60% minimum
- Each batch has a unique ID for traceability
- You are named "Aura Bot" and are part of the FarmChain platform`;
}

// Process a chat message
export async function processMessage({ userId, message, language, imageData, context }) {
  if (!checkRateLimit(userId)) {
    return {
      success: false,
      error: 'RATE_LIMITED',
      message: 'Too many requests. Please wait a moment.'
    };
  }

  // Gather user context
  const profile = getFarmerProfile(userId);
  const orders = getOrderStatus(userId);
  const deliveries = getDeliveryStatus(userId);

  let contextInfo = '';
  if (profile) {
    contextInfo += `\nUser: ${profile.name || 'Farmer'}, Role: ${profile.role || 'farmer'}`;
  }
  if (orders.length > 0) {
    contextInfo += `\nRecent orders: ${orders.slice(-3).map(o => `${o.orderId || o.productId} (${o.status})`).join(', ')}`;
  }
  if (deliveries.length > 0) {
    contextInfo += `\nRecent deliveries: ${deliveries.slice(-3).map(d => `${d.deliveryId} (${d.status})`).join(', ')}`;
  }

  const systemPrompt = buildSystemPrompt(language);
  const userContext = contextInfo ? `\n\nUser Context:${contextInfo}` : '';

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
            {
                role: 'user',
                parts: [{ text: `${systemPrompt}${userContext}\n\nFarmer: ${message}` }]
            }
        ],
        config: {
            temperature: 0.7,
        }
    });

    return {
      success: true,
      response: response.text,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    // Fallback to local response if API fails
    const response = generateLocalResponse(message, language, {
      profile, orders, deliveries, imageData
    });
    return {
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    };
  }
}

// Local response generator — provides intelligent responses without external API
function generateLocalResponse(message, lang, context) {
  const msg = message.toLowerCase();
  const { profile, orders, deliveries } = context;

  // Detect intent
  if (msg.includes('order') || msg.includes('ऑर्डर') || msg.includes('ஆர்டர்') || msg.includes('ఆర్డర్')) {
    if (orders && orders.length > 0) {
      const recent = orders.slice(-3);
      const orderList = recent.map(o =>
        `• ${o.productName || o.productId || 'Product'}: ${o.status || 'pending'} (₹${o.totalAmount || 0})`
      ).join('\n');
      return getLocalizedResponse('orders', lang, { orderList, count: orders.length });
    }
    return getLocalizedResponse('noOrders', lang);
  }

  if (msg.includes('delivery') || msg.includes('डिलीवरी') || msg.includes('டெலிவரி') || msg.includes('డెలివరీ') || msg.includes('track')) {
    if (deliveries && deliveries.length > 0) {
      const recent = deliveries.slice(-3);
      const delList = recent.map(d =>
        `• ${d.deliveryId}: ${d.status} — ${d.produce || 'Produce'}`
      ).join('\n');
      return getLocalizedResponse('deliveries', lang, { delList, count: deliveries.length });
    }
    return getLocalizedResponse('noDeliveries', lang);
  }

  if (msg.includes('payment') || msg.includes('भुगतान') || msg.includes('கொடுப்பனவு') || msg.includes('చెల్లింపు') || msg.includes('payout')) {
    return getLocalizedResponse('payments', lang);
  }

  if (msg.includes('price') || msg.includes('mandi') || msg.includes('भाव') || msg.includes('मंडी') || msg.includes('விலை') || msg.includes('ధర')) {
    return getLocalizedResponse('mandiPrices', lang);
  }

  if (msg.includes('disease') || msg.includes('pest') || msg.includes('रोग') || msg.includes('कीट') || msg.includes('நோய்') || msg.includes('వ్యాధి') || msg.includes('yellow') || msg.includes('wilt') || msg.includes('spot')) {
    return getLocalizedResponse('cropDisease', lang);
  }

  if (msg.includes('weather') || msg.includes('मौसम') || msg.includes('வானிலை') || msg.includes('వాతావరణం') || msg.includes('rain') || msg.includes('बारिश')) {
    return getLocalizedResponse('weather', lang);
  }

  if (msg.includes('quality') || msg.includes('grade') || msg.includes('गुणवत्ता') || msg.includes('தர') || msg.includes('నాణ్యత')) {
    return getLocalizedResponse('quality', lang);
  }

  if (msg.includes('list') || msg.includes('sell') || msg.includes('बेच') || msg.includes('விற்க') || msg.includes('అమ్మ')) {
    return getLocalizedResponse('listing', lang);
  }

  // General knowledge fallback — answer the question as best we can
  return getLocalizedResponse('generalFallback', lang, { question: message.substring(0, 80) });
}

function getLocalizedResponse(key, lang, data = {}) {
  const responses = {
    en: {
      orders: `📋 You have ${data.count || 0} order(s). Here are your most recent:\n\n${data.orderList || 'No details available.'}\n\nNeed help with a specific order? Just tell me the order ID!`,
      noOrders: `📋 You don't have any orders yet. Visit the Marketplace to browse fresh produce and place your first order!`,
      deliveries: `🚚 You have ${data.count || 0} delivery(ies). Here are the latest:\n\n${data.delList || 'No details available.'}\n\nWant more details about a specific delivery?`,
      noDeliveries: `🚚 No active deliveries found. Deliveries are created when orders are shipped.`,
      payments: `💰 Your payments are processed transparently through FarmChain. Farmers receive a minimum 60% of the sale price. Check your Orders page for detailed payment breakdown per order.`,
      mandiPrices: `📊 Current mandi rates are updated live on FarmChain. Popular crops:\n\n• Tomatoes: ₹25-45/kg\n• Onions: ₹18-35/kg\n• Rice (Basmati): ₹42-65/kg\n• Wheat: ₹22-30/kg\n\nPrices vary by region. Check the AI Pricing tool for personalized recommendations!`,
      cropDisease: `🌿 For crop health concerns, here are some common steps:\n\n1. **Photograph** the affected leaves/stems clearly\n2. **Note** when symptoms first appeared\n3. **Check** if nearby plants are also affected\n4. **Look** for insects or unusual spots\n\n⚠️ *Important: AI analysis is for guidance only. Please consult your local agricultural officer or Krishi Vigyan Kendra for confirmed diagnosis and treatment.*`,
      weather: `🌤️ Weather affects farming decisions significantly. For accurate local forecasts:\n\n• Check the IMD (India Meteorological Department) app\n• Plan irrigation based on expected rainfall\n• Protect crops during expected heavy rain or frost\n\nFarmChain integrates weather data to help with optimal harvest timing!`,
      quality: `⭐ FarmChain grades produce quality automatically:\n\n• **A Grade (Premium)**: Score 85-100 — Excellent quality\n• **B Grade (Good)**: Score 70-84 — Good quality\n• **C Grade (Fair)**: Score 50-69 — Acceptable quality\n\nThe grade affects pricing recommendations. Upload a clear photo during product listing for accurate grading.`,
      listing: `📦 To list your produce on FarmChain:\n\n1. Go to **My Products** → **Add New Product**\n2. Enter crop details (name, quantity, unit)\n3. Upload a clear photo for AI quality grading\n4. Set your price or use AI-suggested pricing\n5. Submit — your product will be visible to buyers!\n\nNeed help with any step?`,
      default: `👋 Hello! I'm **Aura Bot**, your smart AI assistant on FarmChain. I can help you with:\n\n• 🌾 Crop health and disease guidance\n• 📊 Market prices and trends\n• 📦 Product listing help\n• 📋 Order and delivery status\n• 💰 Payment information\n• 🌤️ Weather and farming tips\n• 💡 General questions — just ask me anything!\n\nWhat would you like to know?`,
      generalFallback: `💡 I'm Aura Bot, and while I'm primarily here to help with farming and FarmChain, I'll do my best to answer your question: "${data.question || ''}..."\n\nUnfortunately, the AI backend is currently offline, so I can't give a detailed answer right now. Please try again shortly when the connection is restored — when online, I can answer almost anything! 🌐`
    },
    hi: {
      orders: `📋 आपके ${data.count || 0} ऑर्डर हैं। नवीनतम:\n\n${data.orderList || 'विवरण उपलब्ध नहीं।'}\n\nकिसी विशिष्ट ऑर्डर में मदद चाहिए?`,
      noOrders: `📋 आपके पास अभी कोई ऑर्डर नहीं है। ताज़ी उपज ब्राउज़ करने के लिए मार्केटप्लेस पर जाएं!`,
      deliveries: `🚚 आपकी ${data.count || 0} डिलीवरी हैं:\n\n${data.delList || 'विवरण उपलब्ध नहीं।'}\n\nकिसी विशिष्ट डिलीवरी के बारे में अधिक जानकारी चाहते हैं?`,
      noDeliveries: `🚚 कोई सक्रिय डिलीवरी नहीं मिली।`,
      payments: `💰 आपके भुगतान फार्मचेन के माध्यम से पारदर्शी रूप से प्रोसेस किए जाते हैं। किसानों को बिक्री मूल्य का न्यूनतम 60% मिलता है।`,
      mandiPrices: `📊 वर्तमान मंडी भाव:\n\n• टमाटर: ₹25-45/kg\n• प्याज: ₹18-35/kg\n• बासमती चावल: ₹42-65/kg\n• गेहूं: ₹22-30/kg\n\nक्षेत्र के अनुसार कीमतें भिन्न हो सकती हैं।`,
      cropDisease: `🌿 फसल स्वास्थ्य संबंधी चिंता के लिए:\n\n1. प्रभावित पत्तियों की स्पष्ट **फोटो** लें\n2. लक्षण कब दिखे **नोट** करें\n3. आसपास के पौधों की **जांच** करें\n\n⚠️ *एआई विश्लेषण केवल मार्गदर्शन के लिए है। कृपया पुष्टि के लिए कृषि विशेषज्ञ से संपर्क करें।*`,
      weather: `🌤️ सटीक मौसम पूर्वानुमान के लिए IMD ऐप देखें। सिंचाई की योजना अपेक्षित वर्षा के आधार पर बनाएं।`,
      quality: `⭐ फार्मचेन एआई गुणवत्ता ग्रेड:\n\n• **A ग्रेड**: 85-100 — उत्कृष्ट\n• **B ग्रेड**: 70-84 — अच्छी\n• **C ग्रेड**: 50-69 — स्वीकार्य`,
      listing: `📦 अपनी उपज लिस्ट करने के लिए: मेरे उत्पाद → नया उत्पाद जोड़ें → विवरण भरें → फोटो अपलोड करें → सबमिट करें!`,
      default: `👋 नमस्ते! मैं **Aura Bot** हूं, FarmChain का स्मार्ट एआई सहायक। मैं इनमें मदद कर सकता हूं:\n\n• 🌾 फसल स्वास्थ्य\n• 📊 मंडी भाव\n• 📦 उत्पाद सूचीकरण\n• 📋 ऑर्डर और डिलीवरी\n• 💰 भुगतान जानकारी\n• 💡 कोई भी सवाल — बस पूछें!\n\nआप क्या जानना चाहते हैं?`,
      generalFallback: `💡 मैं Aura Bot हूं। आपका सवाल: "${data.question || ''}..." — एआई बैकएंड अभी ऑफलाइन है। कनेक्शन वापस आने पर मैं किसी भी सवाल का जवाब दे सकता हूं!`
    },
    ta: {
      orders: `📋 உங்களிடம் ${data.count || 0} ஆர்டர்(கள்) உள்ளன:\n\n${data.orderList || 'விவரங்கள் கிடைக்கவில்லை.'}\n\nஏதேனும் ஆர்டரில் உதவி வேண்டுமா?`,
      noOrders: `📋 உங்களிடம் இன்னும் ஆர்டர்கள் இல்லை. மார்க்கெட்பிளேஸை பாருங்கள்!`,
      deliveries: `🚚 உங்களிடம் ${data.count || 0} டெலிவரி(கள்):\n\n${data.delList || 'விவரங்கள் கிடைக்கவில்லை.'}`,
      noDeliveries: `🚚 செயலில் உள்ள டெலிவரிகள் இல்லை.`,
      payments: `💰 உங்கள் கொடுப்பனவுகள் ஃபார்ம்செயின் மூலம் வெளிப்படையாக செயலாக்கப்படுகின்றன. விவசாயிகள் குறைந்தபட்சம் 60% பெறுவார்கள்.`,
      mandiPrices: `📊 தற்போதைய மண்டி விலைகள்:\n\n• தக்காளி: ₹25-45/kg\n• வெங்காயம்: ₹18-35/kg\n• பாஸ்மதி அரிசி: ₹42-65/kg`,
      cropDisease: `🌿 பயிர் நோய் கவலைகளுக்கு:\n\n1. பாதிக்கப்பட்ட இலைகளின் தெளிவான **புகைப்படம்** எடுங்கள்\n2. அறிகுறிகள் எப்போது தோன்றின என்பதை **குறிப்பிடுங்கள்**\n\n⚠️ *ஏஐ பகுப்பாய்வு வழிகாட்டுதலுக்கு மட்டுமே. நிபுணரை அணுகவும்.*`,
      weather: `🌤️ வானிலை முன்னறிவிப்புக்கு IMD ஆப்பை பாருங்கள்.`,
      quality: `⭐ ஃபார்ம்செயின் ஏஐ தர மதிப்பீடு:\n\n• **A தரம்**: 85-100\n• **B தரம்**: 70-84\n• **C தரம்**: 50-69`,
      listing: `📦 உங்கள் விளைபொருளை பட்டியலிட: எனது பொருட்கள் → புதிய பொருள் சேர்க்கவும் → விவரங்களை நிரப்பவும் → சமர்ப்பிக்கவும்!`,
      default: `👋 வணக்கம்! நான் **Aura Bot**, FarmChain ஸ்மார்ட் AI உதவியாளர்.\n\n• 🌾 பயிர் ஆரோக்கியம்\n• 📊 மண்டி விலை\n• 📦 பொருள் பட்டியல்\n• 📋 ஆர்டர் மற்றும் டெலிவரி\n• 💰 கொடுப்பனவு\n• 💡 எந்த கேள்வியும் கேளுங்கள்!\n\nஎன்ன உதவி வேண்டும்?`,
      generalFallback: `💡 நான் Aura Bot. உங்கள் கேள்வி: "${data.question || ''}..." — AI பின்னிணைப்பு தற்போது ஆஃப்லைனில் உள்ளது. இணைப்பு வந்தவுடன் எந்த கேள்விக்கும் பதில் சொல்வேன்!`
    },
    te: {
      orders: `📋 మీకు ${data.count || 0} ఆర్డర్(లు) ఉన్నాయి:\n\n${data.orderList || 'వివరాలు అందుబాటులో లేవు.'}\n\nఏదైనా ఆర్డర్‌లో సహాయం కావాలా?`,
      noOrders: `📋 మీకు ఇంకా ఆర్డర్‌లు లేవు. మార్కెట్‌ప్లేస్ చూడండి!`,
      deliveries: `🚚 మీకు ${data.count || 0} డెలివరీ(లు):\n\n${data.delList || 'వివరాలు అందుబాటులో లేవు.'}`,
      noDeliveries: `🚚 యాక్టివ్ డెలివరీలు లేవు.`,
      payments: `💰 మీ చెల్లింపులు ఫార్మ్‌చైన్ ద్వారా పారదర్శకంగా ప్రాసెస్ చేయబడతాయి. రైతులకు కనీసం 60% అందుతుంది.`,
      mandiPrices: `📊 ప్రస్తుత మండి ధరలు:\n\n• టమాటాలు: ₹25-45/kg\n• ఉల్లిపాయలు: ₹18-35/kg\n• బాస్మతి బియ్యం: ₹42-65/kg`,
      cropDisease: `🌿 పంట వ్యాధి ఆందోళనలకు:\n\n1. ప్రభావిత ఆకుల స్పష్టమైన **ఫోటో** తీయండి\n2. లక్షణాలు ఎప్పుడు కనిపించాయో **గమనించండి**\n\n⚠️ *ఏఐ విశ్లేషణ మార్గదర్శకత్వం మాత్రమే. నిపుణుడిని సంప్రదించండి.*`,
      weather: `🌤️ వాతావరణ అంచనాకు IMD యాప్ చూడండి.`,
      quality: `⭐ ఫార్మ్‌చైన్ ఏఐ నాణ్యత గ్రేడ్:\n\n• **A గ్రేడ్**: 85-100\n• **B గ్రేడ్**: 70-84\n• **C గ్రేడ్**: 50-69`,
      listing: `📦 మీ ఉత్పత్తిని లిస్ట్ చేయడానికి: నా ఉత్పత్తులు → కొత్తది జోడించు → వివరాలు నింపండి → సబ్మిట్!`,
      default: `👋 నమస్తే! నేను **Aura Bot**, FarmChain స్మార్ట్ AI సహాయకుడిని.\n\n• 🌾 పంట ఆరోగ్యం\n• 📊 మండి ధర\n• 📦 ఉత్పత్తి లిస్టింగ్\n• 📋 ఆర్డర్ మరియు డెలివరీ\n• 💰 చెల్లింపు\n• 💡 ఏ ప్రశ్నైనా అడగండి!\n\nఏం సహాయం కావాలి?`,
      generalFallback: `💡 నేను Aura Bot. మీ ప్రశ్న: "${data.question || ''}..." — AI బ్యాకెండ్ ప్రస్తుతం ఆఫ్‌లైన్‌లో ఉంది. కనెక్షన్ వచ్చినప్పుడు ఏ ప్రశ్నకైనా జవాబు చెప్తాను!`
    }
  };

  const langResponses = responses[lang] || responses.en;
  return langResponses[key] || langResponses.default;
}

export { checkRateLimit };
