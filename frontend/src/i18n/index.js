// src/i18n/index.js
import { translations } from './translations.js';

class I18nService {
  constructor() {
    this.currentLanguage = localStorage.getItem('farmchain_lang') || 'en';
    this.listeners = [];
  }

  getLanguage() {
    return this.currentLanguage;
  }

  setLanguage(lang) {
    if (translations[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem('farmchain_lang', lang);
      this.listeners.forEach(cb => cb(lang));
    }
  }

  t(key) {
    const dict = translations[this.currentLanguage] || translations.en;
    return dict[key] || translations.en[key] || key;
  }

  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  renderLanguageSelector() {
    return `
      <select class="form-select language-selector" id="lang-selector" style="padding: 4px 28px 4px 10px; font-size: 0.8rem; background-color: var(--bg-card); color: var(--text-primary); border-radius: var(--radius-full); cursor: pointer;">
        <option value="en" ${this.currentLanguage === 'en' ? 'selected' : ''}>🇬🇧 English</option>
        <option value="hi" ${this.currentLanguage === 'hi' ? 'selected' : ''}>🇮🇳 हिंदी (Hindi)</option>
        <option value="ta" ${this.currentLanguage === 'ta' ? 'selected' : ''}>🇮🇳 தமிழ் (Tamil)</option>
        <option value="te" ${this.currentLanguage === 'te' ? 'selected' : ''}>🇮🇳 తెలుగు (Telugu)</option>
      </select>
    `;
  }
}

export const i18n = new I18nService();
