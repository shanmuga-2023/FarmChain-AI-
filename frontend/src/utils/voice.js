// ============================================
// FarmChain AI — Vernacular Voice Recognition & Parser
// Multi-lingual support: Tamil (ta-IN), Hindi (hi-IN), Telugu (te-IN), English (en-IN)
// ============================================

import { i18n } from '../i18n/index.js';

// Agricultural Crop Dictionary with regional terms
export const CROP_DICTIONARY = {
  // English
  'basmati': { name: 'Basmati Rice', category: 'Grains', unit: 'kg', price: 48 },
  'rice': { name: 'Basmati Rice', category: 'Grains', unit: 'kg', price: 45 },
  'paddy': { name: 'Organic Paddy', category: 'Grains', unit: 'kg', price: 30 },
  'wheat': { name: 'Sharbati Wheat', category: 'Grains', unit: 'kg', price: 38 },
  'tomato': { name: 'Desi Tomato', category: 'Vegetables', unit: 'kg', price: 25 },
  'onion': { name: 'Nashik Red Onion', category: 'Vegetables', unit: 'kg', price: 32 },
  'potato': { name: 'Fresh Potato', category: 'Vegetables', unit: 'kg', price: 22 },
  'turmeric': { name: 'Salem Turmeric', category: 'Spices', unit: 'kg', price: 95 },
  'mango': { name: 'Alphonso Mango', category: 'Fruits', unit: 'kg', price: 120 },
  'banana': { name: 'Robusta Banana', category: 'Fruits', unit: 'kg', price: 40 },
  'green chilli': { name: 'Green Chilli', category: 'Vegetables', unit: 'kg', price: 50 },
  'chilli': { name: 'Green Chilli', category: 'Vegetables', unit: 'kg', price: 50 },
  'cotton': { name: 'Raw Cotton', category: 'Cash Crops', unit: 'kg', price: 75 },
  'sugarcane': { name: 'Sweet Sugarcane', category: 'Cash Crops', unit: 'quintal', price: 320 },
  'maize': { name: 'Sweet Maize', category: 'Grains', unit: 'kg', price: 24 },
  'garlic': { name: 'Desi Garlic', category: 'Spices', unit: 'kg', price: 140 },
  'ginger': { name: 'Fresh Ginger', category: 'Spices', unit: 'kg', price: 110 },
  'coconut': { name: 'Fresh Coconut', category: 'Fruits', unit: 'dozen', price: 360 },

  // Hindi (हिन्दी)
  'चावल': { name: 'Basmati Rice', category: 'Grains', unit: 'kg', price: 45 },
  'बासमती': { name: 'Basmati Rice', category: 'Grains', unit: 'kg', price: 48 },
  'धान': { name: 'Organic Paddy', category: 'Grains', unit: 'kg', price: 30 },
  'गेहूं': { name: 'Sharbati Wheat', category: 'Grains', unit: 'kg', price: 38 },
  'गेहू': { name: 'Sharbati Wheat', category: 'Grains', unit: 'kg', price: 38 },
  'टमाटर': { name: 'Desi Tomato', category: 'Vegetables', unit: 'kg', price: 25 },
  'प्याज': { name: 'Nashik Red Onion', category: 'Vegetables', unit: 'kg', price: 32 },
  'कांदा': { name: 'Nashik Red Onion', category: 'Vegetables', unit: 'kg', price: 32 },
  'आलू': { name: 'Fresh Potato', category: 'Vegetables', unit: 'kg', price: 22 },
  'हल्दी': { name: 'Salem Turmeric', category: 'Spices', unit: 'kg', price: 95 },
  'आम': { name: 'Alphonso Mango', category: 'Fruits', unit: 'kg', price: 120 },
  'केला': { name: 'Robusta Banana', category: 'Fruits', unit: 'kg', price: 40 },
  'मिर्च': { name: 'Green Chilli', category: 'Vegetables', unit: 'kg', price: 50 },
  'हरी मिर्च': { name: 'Green Chilli', category: 'Vegetables', unit: 'kg', price: 50 },
  'कपास': { name: 'Raw Cotton', category: 'Cash Crops', unit: 'kg', price: 75 },
  'गन्ना': { name: 'Sweet Sugarcane', category: 'Cash Crops', unit: 'quintal', price: 320 },
  'मक्का': { name: 'Sweet Maize', category: 'Grains', unit: 'kg', price: 24 },
  'लहसुन': { name: 'Desi Garlic', category: 'Spices', unit: 'kg', price: 140 },
  'अदरक': { name: 'Fresh Ginger', category: 'Spices', unit: 'kg', price: 110 },
  'नारियल': { name: 'Fresh Coconut', category: 'Fruits', unit: 'dozen', price: 360 },

  // Tamil (தமிழ்)
  'பாசுமதி': { name: 'Basmati Rice', category: 'Grains', unit: 'kg', price: 48 },
  'அரிசி': { name: 'Basmati Rice', category: 'Grains', unit: 'kg', price: 45 },
  'நெல்': { name: 'Organic Paddy', category: 'Grains', unit: 'kg', price: 30 },
  'கோதுமை': { name: 'Sharbati Wheat', category: 'Grains', unit: 'kg', price: 38 },
  'தக்காளி': { name: 'Desi Tomato', category: 'Vegetables', unit: 'kg', price: 25 },
  'வெங்காயம்': { name: 'Nashik Red Onion', category: 'Vegetables', unit: 'kg', price: 32 },
  'சின்ன வெங்காயம்': { name: 'Nashik Red Onion', category: 'Vegetables', unit: 'kg', price: 50 },
  'உருளைக்கிழங்கு': { name: 'Fresh Potato', category: 'Vegetables', unit: 'kg', price: 22 },
  'உருளை': { name: 'Fresh Potato', category: 'Vegetables', unit: 'kg', price: 22 },
  'மஞ்சள்': { name: 'Salem Turmeric', category: 'Spices', unit: 'kg', price: 95 },
  'மாம்பழம்': { name: 'Alphonso Mango', category: 'Fruits', unit: 'kg', price: 120 },
  'வாழைப்பழம்': { name: 'Robusta Banana', category: 'Fruits', unit: 'kg', price: 40 },
  'வாழை': { name: 'Robusta Banana', category: 'Fruits', unit: 'kg', price: 40 },
  'மிளகாய்': { name: 'Green Chilli', category: 'Vegetables', unit: 'kg', price: 50 },
  'பச்சை மிளகாய்': { name: 'Green Chilli', category: 'Vegetables', unit: 'kg', price: 50 },
  'பருத்தி': { name: 'Raw Cotton', category: 'Cash Crops', unit: 'kg', price: 75 },
  'கரும்பு': { name: 'Sweet Sugarcane', category: 'Cash Crops', unit: 'quintal', price: 320 },
  'மக்காச்சோளம்': { name: 'Sweet Maize', category: 'Grains', unit: 'kg', price: 24 },
  'சோளம்': { name: 'Sweet Maize', category: 'Grains', unit: 'kg', price: 24 },
  'பூண்டு': { name: 'Desi Garlic', category: 'Spices', unit: 'kg', price: 140 },
  'இஞ்சி': { name: 'Fresh Ginger', category: 'Spices', unit: 'kg', price: 110 },
  'தேங்காய்': { name: 'Fresh Coconut', category: 'Fruits', unit: 'dozen', price: 360 },

  // Telugu (తెలుగు)
  'బాస్మతి': { name: 'Basmati Rice', category: 'Grains', unit: 'kg', price: 48 },
  'బియ్యం': { name: 'Basmati Rice', category: 'Grains', unit: 'kg', price: 45 },
  'వరి': { name: 'Organic Paddy', category: 'Grains', unit: 'kg', price: 30 },
  'గోధుమ': { name: 'Sharbati Wheat', category: 'Grains', unit: 'kg', price: 38 },
  'గోధుమలు': { name: 'Sharbati Wheat', category: 'Grains', unit: 'kg', price: 38 },
  'టమోటా': { name: 'Desi Tomato', category: 'Vegetables', unit: 'kg', price: 25 },
  'టమాట': { name: 'Desi Tomato', category: 'Vegetables', unit: 'kg', price: 25 },
  'ఉల్లిపాయ': { name: 'Nashik Red Onion', category: 'Vegetables', unit: 'kg', price: 32 },
  'ఎర్రగడ్డ': { name: 'Nashik Red Onion', category: 'Vegetables', unit: 'kg', price: 32 },
  'బంగాళాదుంప': { name: 'Fresh Potato', category: 'Vegetables', unit: 'kg', price: 22 },
  'ఆలుగడ్డ': { name: 'Fresh Potato', category: 'Vegetables', unit: 'kg', price: 22 },
  'పసుపు': { name: 'Salem Turmeric', category: 'Spices', unit: 'kg', price: 95 },
  'మామిడి': { name: 'Alphonso Mango', category: 'Fruits', unit: 'kg', price: 120 },
  'అరటి': { name: 'Robusta Banana', category: 'Fruits', unit: 'kg', price: 40 },
  'అరటిపండు': { name: 'Robusta Banana', category: 'Fruits', unit: 'kg', price: 40 },
  'మిరపకాయ': { name: 'Green Chilli', category: 'Vegetables', unit: 'kg', price: 50 },
  'పచ్చిమిర్చి': { name: 'Green Chilli', category: 'Vegetables', unit: 'kg', price: 50 },
  'పత్తి': { name: 'Raw Cotton', category: 'Cash Crops', unit: 'kg', price: 75 },
  'చెరకు': { name: 'Sweet Sugarcane', category: 'Cash Crops', unit: 'quintal', price: 320 },
  'మొక్కజొన్న': { name: 'Sweet Maize', category: 'Grains', unit: 'kg', price: 24 },
  'జొన్నలు': { name: 'Sweet Maize', category: 'Grains', unit: 'kg', price: 24 },
  'వెల్లుల్లి': { name: 'Desi Garlic', category: 'Spices', unit: 'kg', price: 140 },
  'అల్లం': { name: 'Fresh Ginger', category: 'Spices', unit: 'kg', price: 110 },
  'కొబ్బరి': { name: 'Fresh Coconut', category: 'Fruits', unit: 'dozen', price: 360 },
};

// Word-to-number mapping for major spoken terms
const NUMBER_WORDS = {
  // English
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'twenty': 20, 'twenty five': 25, 'thirty': 30, 'forty': 40, 'fifty': 50,
  'hundred': 100, 'two hundred': 200, 'three hundred': 300, 'five hundred': 500,
  'thousand': 1000,

  // Hindi
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5,
  'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'बीस': 20, 'पच्चीस': 25, 'तीस': 30, 'चालीस': 40, 'पचास': 50,
  'सौ': 100, 'दो सौ': 200, 'तीन सौ': 300, 'चार सौ': 400, 'पांच सौ': 500,
  'हजार': 1000, 'हज़ार': 1000,

  // Tamil
  'ஒன்று': 1, 'ஒன்னு': 1, 'இரண்டு': 2, 'ரெண்டு': 2, 'மூன்று': 3, 'மூணு': 3, 'நான்கு': 4, 'நாற்பது': 40,
  'ஐந்து': 5, 'அஞ்சு': 5, 'பத்து': 10, 'இருபது': 20, 'இருபத்தைந்து': 25, 'முப்பது': 30, 'ஐம்பது': 50,
  'நூறு': 100, 'இருநூறு': 200, 'முந்நூறு': 300, 'ஐந்நூறு': 500, 'ஆயிரம்': 1000,

  // Telugu
  'ఒకటి': 1, 'రెండు': 2, 'మూడు': 3, 'నాలుగు': 4, 'ఐదు': 5,
  'పది': 10, 'ఇరవై': 20, 'ఇరవై ఐదు': 25, 'ముప్పై': 30, 'నలభై': 40, 'యాభై': 50,
  'వంద': 100, 'రెండు వందలు': 200, 'ఐదు వందలు': 500, 'వెయ్యి': 1000,
};

/**
 * Check if Web Speech API is supported
 */
export function isSpeechSupported() {
  return typeof window !== 'undefined' &&
    (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));
}

/**
 * Normalize vernacular digits to standard ASCII numbers
 */
function normalizeDigits(str) {
  if (!str) return '';
  // Hindi/Devanagari: ०-९
  str = str.replace(/[०-९]/g, d => '०१२३४५६७८९'.indexOf(d));
  // Tamil: ௦-௯
  str = str.replace(/[௦-௯]/g, d => '௦௧௨௩௪௫௬௭௮௯'.indexOf(d));
  // Telugu: ౦-౯
  str = str.replace(/[౦-౯]/g, d => '౦౧౨౩౪౫౬౭౮౯'.indexOf(d));
  return str;
}

/**
 * Extract numbers from natural spoken text (handles digits and words)
 */
function extractNumbers(text) {
  const normalized = normalizeDigits(text.toLowerCase());
  const found = [];

  // Match digit patterns
  const digitMatches = normalized.match(/\d+(\.\d+)?/g);
  if (digitMatches) {
    for (const d of digitMatches) {
      found.push(parseFloat(d));
    }
  }

  // Match number words if digits are scarce
  if (found.length < 2) {
    for (const [word, val] of Object.entries(NUMBER_WORDS)) {
      if (normalized.includes(word) && !found.includes(val)) {
        found.push(val);
      }
    }
  }

  return found;
}

/**
 * Parse natural language spoken transcript into structured product fields
 */
export function parseSpokenCropText(rawText) {
  const text = (rawText || '').trim();
  const lower = text.toLowerCase();

  let name = '';
  let category = 'Grains';
  let unit = 'kg';
  let defaultPrice = 45;

  // Check organic keywords
  const isOrganic = lower.includes('organic') ||
    lower.includes('जैविक') || lower.includes('இயற்கை') ||
    lower.includes('நாட்டு') || lower.includes('సేంద్రీయ') || lower.includes('నాటు');

  // Match crop in dictionary
  for (const [keyword, data] of Object.entries(CROP_DICTIONARY)) {
    if (lower.includes(keyword.toLowerCase())) {
      name = data.name;
      category = data.category;
      unit = data.unit;
      defaultPrice = data.price || defaultPrice;
      break;
    }
  }

  // Fallback crop matching if exact key not found
  if (!name) {
    if (lower.includes('rice') || lower.includes('चावल') || lower.includes('அரிசி') || lower.includes('బియ్యం')) {
      name = 'Basmati Rice'; category = 'Grains';
    } else if (lower.includes('wheat') || lower.includes('गेहूं') || lower.includes('கோதுமை') || lower.includes('గోధుమ')) {
      name = 'Sharbati Wheat'; category = 'Grains';
    } else if (lower.includes('tomato') || lower.includes('टमाटर') || lower.includes('தக்காளி') || lower.includes('టమోటా')) {
      name = 'Desi Tomato'; category = 'Vegetables';
    } else if (lower.includes('onion') || lower.includes('प्याज') || lower.includes('வெங்காயம்') || lower.includes('ఉల్లిపాయ')) {
      name = 'Nashik Red Onion'; category = 'Vegetables';
    } else if (lower.includes('potato') || lower.includes('आलू') || lower.includes('உருளை') || lower.includes('దుంప')) {
      name = 'Fresh Potato'; category = 'Vegetables';
    } else if (lower.includes('mango') || lower.includes('आम') || lower.includes('மாம்பழம்') || lower.includes('మామిడి')) {
      name = 'Alphonso Mango'; category = 'Fruits';
    } else if (lower.includes('banana') || lower.includes('केला') || lower.includes('வாழை') || lower.includes('అరటి')) {
      name = 'Robusta Banana'; category = 'Fruits';
    } else {
      name = 'Organic Farm Harvest';
    }
  }

  // Check units
  if (lower.includes('quintal') || lower.includes('क्विंटल') || lower.includes('குவிண்டால்') || lower.includes('குவிண்டல்') || lower.includes('క్వింటాల్')) {
    unit = 'quintal';
  } else if (lower.includes('ton') || lower.includes('टन') || lower.includes('டன்') || lower.includes('టన్ను')) {
    unit = 'ton';
  } else if (lower.includes('dozen') || lower.includes('दर्जन') || lower.includes('டஜன்') || lower.includes('డజను')) {
    unit = 'dozen';
  } else {
    unit = 'kg';
  }

  // Parse numbers for quantity and price
  const numbers = extractNumbers(text);
  let quantity = 500;
  let price = defaultPrice;

  if (numbers.length >= 2) {
    // If two numbers found: usually larger is quantity, smaller is price per kg
    // unless units are mentioned
    if (numbers[0] >= numbers[1] && numbers[1] <= 500) {
      quantity = Math.round(numbers[0]);
      price = Math.round(numbers[1]);
    } else if (numbers[1] > 100 && numbers[0] <= 200) {
      price = Math.round(numbers[0]);
      quantity = Math.round(numbers[1]);
    } else {
      quantity = Math.round(numbers[0]);
      price = Math.round(numbers[1]);
    }
  } else if (numbers.length === 1) {
    const val = Math.round(numbers[0]);
    if (val >= 100) {
      quantity = val;
      price = defaultPrice;
    } else {
      price = val;
      quantity = 500;
    }
  }

  return {
    name,
    category,
    quantity,
    unit,
    price,
    isOrganic,
    rawText: text,
  };
}

/**
 * Start a SpeechRecognition session with live transcript and error handling
 */
export function startVoiceRecognition({
  language = null,
  onInterim = null,
  onResult = null,
  onError = null,
  onStart = null,
  onEnd = null,
}) {
  if (!isSpeechSupported()) {
    const errorMsg = i18n.t('voiceUnsupported');
    onError?.({ message: errorMsg, type: 'unsupported', canSwitchToManual: true });
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  // Use provided language or app's current language
  const targetLang = language || i18n.getSpeechLang();
  recognition.lang = targetLang;
  recognition.continuous = false;
  recognition.interimResults = true; // Enables live real-time transcript
  recognition.maxAlternatives = 1;

  let finalTranscript = '';
  let hasResult = false;

  recognition.onstart = () => {
    onStart?.();
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const piece = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += piece;
        hasResult = true;
      } else {
        interimTranscript += piece;
      }
    }

    // Report live interim transcript while speaking
    const currentTranscript = finalTranscript || interimTranscript;
    onInterim?.({ transcript: currentTranscript });

    // If final, parse into fields
    if (hasResult && finalTranscript.trim()) {
      const parsed = parseSpokenCropText(finalTranscript);
      onResult?.({ transcript: finalTranscript.trim(), ...parsed });
    }
  };

  recognition.onerror = (event) => {
    const errType = event.error || 'unknown';
    let friendlyMessage = '';

    switch (errType) {
      case 'not-allowed':
      case 'service-not-allowed':
        friendlyMessage = i18n.t('voiceMicDenied');
        break;
      case 'no-speech':
        friendlyMessage = i18n.t('voiceNoSpeech');
        break;
      case 'network':
        friendlyMessage = i18n.t('voice.networkError') || 'Voice recognition network error. Please try again or switch to manual mode.';
        break;
      default:
        friendlyMessage = i18n.t('voice.genericError', { error: errType }) || `Voice recognition error (${errType}). Please type manually.`;
    }

    onError?.({
      type: errType,
      message: friendlyMessage,
      canSwitchToManual: true,
    });
  };

  recognition.onend = () => {
    // If recognition finished with an interim transcript that never became final, parse it
    if (!hasResult && finalTranscript.trim()) {
      const parsed = parseSpokenCropText(finalTranscript);
      onResult?.({ transcript: finalTranscript.trim(), ...parsed });
    }
    onEnd?.();
  };

  try {
    recognition.start();
    return recognition;
  } catch (err) {
    console.error('Failed to start speech recognition:', err);
    onError?.({
      type: 'start_failed',
      message: i18n.t('voice.micFailed') || 'Could not activate microphone. Please type manually.',
      canSwitchToManual: true,
    });
    return null;
  }
}
