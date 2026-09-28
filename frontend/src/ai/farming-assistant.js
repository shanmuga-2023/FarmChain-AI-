// frontend/src/ai/farming-assistant.js
// Core AI farming assistant logic — voice, text, image, TTS
import { i18n } from '../i18n/index.js';
import { store } from '../data/store.js';
import { isServerOnline, API_BASE } from '../utils/api.js';


export class FarmingAssistant {
  constructor() {
    this.messages = [];
    this.isListening = false;
    this.recognition = null;
    this.synthesis = window.speechSynthesis || null;
    this._initSpeech();
  }

  _initSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
    }
  }

  async sendMessage(text, imageData = null) {
    const user = store.get('currentUser');
    if (!user) return { error: 'Not authenticated' };

    const lang = i18n.getLanguage();

    // Try backend first
    try {
      const online = await isServerOnline();
      if (online) {
        const res = await fetch(`${API_BASE}/assistant/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            message: text,
            language: lang,
            imageData: imageData ? imageData.substring(0, 500) : null
          })
        });

        if (res.ok) {
          const data = await res.json();
          return { response: data.response, timestamp: data.timestamp };
        }
        if (res.status === 429) {
          return { error: i18n.t('assistant.errors.tooManyRequests') };
        }
      }
    } catch (e) {
      console.warn('Backend assistant unavailable, using local fallback');
    }

    // Local fallback
    return { response: this._localFallback(text, lang), timestamp: new Date().toISOString() };
  }

  _localFallback(msg, lang) {
    const responses = {
      en: `I received your message: "${msg.substring(0, 50)}...". The AI backend is currently offline. Please try again later or check your connection.`,
      hi: `मैंने आपका संदेश प्राप्त किया: "${msg.substring(0, 50)}...". एआई बैकएंड वर्तमान में ऑफलाइन है।`,
      ta: `உங்கள் செய்தி பெறப்பட்டது: "${msg.substring(0, 50)}...". ஏஐ பின்னிணைப்பு தற்போது ஆஃப்லைனில் உள்ளது.`,
      te: `మీ సందేశం అందుకున్నాను: "${msg.substring(0, 50)}...". ఏఐ బ్యాకెండ్ ప్రస్తుతం ఆఫ్‌లైన్‌లో ఉంది.`
    };
    return responses[lang] || responses.en;
  }

  startListening(onResult, onError) {
    if (!this.recognition) {
      if (onError) onError(i18n.t('assistant.voiceNotSupported'));
      return;
    }

    const lang = i18n.getLanguage();
    const langMap = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN' };
    this.recognition.lang = langMap[lang] || 'en-IN';

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.isListening = false;
      if (onResult) onResult(transcript);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (onError) onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.isListening = true;
    this.recognition.start();
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  speak(text) {
    if (!this.synthesis) return;
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`]/g, ''));
    const lang = i18n.getLanguage();
    const langMap = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN' };
    utterance.lang = langMap[lang] || 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    this.synthesis.speak(utterance);
  }

  destroy() {
    this.stopListening();
    if (this.synthesis) this.synthesis.cancel();
  }
}
