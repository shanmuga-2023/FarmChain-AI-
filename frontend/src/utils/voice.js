// ============================================
// FarmChain AI — Vernacular Voice Recognition & Parser
// Web Speech API for Hindi (hi-IN), Tamil (ta-IN), English (en-IN)
// ============================================

const CROP_DICTIONARY = {
  // English
  'rice': { name: 'Basmati Rice', category: 'Grains', unit: 'kg' },
  'paddy': { name: 'Organic Paddy', category: 'Grains', unit: 'kg' },
  'wheat': { name: 'Sharbati Wheat', category: 'Grains', unit: 'kg' },
  'tomato': { name: 'Desi Tomato', category: 'Vegetables', unit: 'kg' },
  'onion': { name: 'Nashik Red Onion', category: 'Vegetables', unit: 'kg' },
  'potato': { name: 'Fresh Potato', category: 'Vegetables', unit: 'kg' },
  'turmeric': { name: 'Salem Turmeric', category: 'Spices', unit: 'kg' },
  'mango': { name: 'Alphonso Mango', category: 'Fruits', unit: 'kg' },
  'banana': { name: 'Robusta Banana', category: 'Fruits', unit: 'kg' },
  'cotton': { name: 'Raw Cotton', category: 'Grains', unit: 'kg' },

  // Hindi
  'चावल': { name: 'Basmati Rice', category: 'Grains', unit: 'kg' },
  'धान': { name: 'Organic Paddy', category: 'Grains', unit: 'kg' },
  'गेहूं': { name: 'Sharbati Wheat', category: 'Grains', unit: 'kg' },
  'टमाटर': { name: 'Desi Tomato', category: 'Vegetables', unit: 'kg' },
  'प्याज': { name: 'Nashik Red Onion', category: 'Vegetables', unit: 'kg' },
  'कांदा': { name: 'Nashik Red Onion', category: 'Vegetables', unit: 'kg' },
  'आलू': { name: 'Fresh Potato', category: 'Vegetables', unit: 'kg' },
  'हल्दी': { name: 'Salem Turmeric', category: 'Spices', unit: 'kg' },
  'आम': { name: 'Alphonso Mango', category: 'Fruits', unit: 'kg' },
  'केला': { name: 'Robusta Banana', category: 'Fruits', unit: 'kg' },
  'कपास': { name: 'Raw Cotton', category: 'Grains', unit: 'kg' },

  // Tamil
  'அரிசி': { name: 'Basmati Rice', category: 'Grains', unit: 'kg' },
  'நெல்': { name: 'Organic Paddy', category: 'Grains', unit: 'kg' },
  'கோதுமை': { name: 'Sharbati Wheat', category: 'Grains', unit: 'kg' },
  'தக்காளி': { name: 'Desi Tomato', category: 'Vegetables', unit: 'kg' },
  'வெங்காயம்': { name: 'Nashik Red Onion', category: 'Vegetables', unit: 'kg' },
  'உருளைக்கிழங்கு': { name: 'Fresh Potato', category: 'Vegetables', unit: 'kg' },
  'மஞ்சள்': { name: 'Salem Turmeric', category: 'Spices', unit: 'kg' },
  'மாம்பழம்': { name: 'Alphonso Mango', category: 'Fruits', unit: 'kg' },
  'வாழைப்பழம்': { name: 'Robusta Banana', category: 'Fruits', unit: 'kg' },
  'பருத்தி': { name: 'Raw Cotton', category: 'Grains', unit: 'kg' },
};

/**
 * Check if Web Speech API is supported
 */
export function isSpeechSupported() {
  return ('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window);
}

/**
 * Parse natural language spoken transcript into structured product fields
 */
export function parseSpokenCropText(text) {
  const clean = text.toLowerCase();
  let name = '';
  let category = 'Grains';
  let unit = 'kg';
  let isOrganic = clean.includes('organic') || clean.includes('जैविक') || clean.includes('இயற்கை') || clean.includes('நாட்டு');

  // Match crop name
  for (const [keyword, data] of Object.entries(CROP_DICTIONARY)) {
    if (clean.includes(keyword)) {
      name = data.name;
      category = data.category;
      unit = data.unit;
      break;
    }
  }

  // If no exact match, try general keywords
  if (!name) {
    if (clean.includes('rice') || clean.includes('चावल') || clean.includes('அரிசி')) name = 'Basmati Rice';
    else if (clean.includes('wheat') || clean.includes('गेहूं') || clean.includes('கோதுமை')) name = 'Sharbati Wheat';
    else if (clean.includes('tomato') || clean.includes('टमाटर') || clean.includes('தக்காளி')) name = 'Desi Tomato';
    else if (clean.includes('onion') || clean.includes('प्याज') || clean.includes('வெங்காயம்')) name = 'Red Onion';
    else name = 'Organic Crop Batch';
  }

  // Extract numbers
  const numbers = text.match(/\d+(\.\d+)?/g);
  let quantity = 500;
  let price = 45;

  if (numbers && numbers.length >= 2) {
    quantity = parseInt(numbers[0], 10);
    price = parseInt(numbers[1], 10);
  } else if (numbers && numbers.length === 1) {
    const val = parseInt(numbers[0], 10);
    if (val > 150) quantity = val;
    else price = val;
  }

  // Check for quintal unit
  if (clean.includes('quintal') || clean.includes('क्विंटल') || clean.includes('குவிண்டால்')) {
    unit = 'quintal';
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
 * Start speech recognition session
 */
export function startVoiceRecognition({ language = 'hi-IN', onResult, onError, onStart, onEnd }) {
  if (!isSpeechSupported()) {
    onError?.('Speech recognition is not supported in this browser.');
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.lang = language;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => onStart?.();
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const parsed = parseSpokenCropText(transcript);
    onResult?.({ transcript, ...parsed });
  };

  recognition.onerror = (event) => {
    onError?.(event.error || 'Voice recognition error');
  };

  recognition.onend = () => onEnd?.();

  try {
    recognition.start();
    return recognition;
  } catch (err) {
    onError?.(err.message);
    return null;
  }
}
