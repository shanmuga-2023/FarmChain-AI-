// src/i18n/index.js
import { translations } from './translations.js';

function detectBrowserLanguage() {
  const supported = ['en', 'hi', 'ta', 'te'];
  if (typeof navigator !== 'undefined') {
    const navLangs = navigator.languages || [navigator.language || 'en'];
    for (const l of navLangs) {
      if (!l) continue;
      const code = l.toLowerCase().split('-')[0];
      if (supported.includes(code)) return code;
    }
  }
  return 'en';
}

class I18nService {
  constructor() {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('farmchain_lang') : null;
    this.currentLanguage = stored || detectBrowserLanguage();
    this.listeners = [];

    if (typeof document !== 'undefined') {
      document.documentElement.lang = this.currentLanguage;

      // Global listener for language selector changes
      document.addEventListener('change', (e) => {
        if (
          e.target &&
          (e.target.matches('.language-selector') ||
            e.target.id === 'lang-selector' ||
            e.target.classList.contains('farmchain-lang-select'))
        ) {
          this.setLanguage(e.target.value);
        }
      });
    }
  }

  getLanguage() {
    return this.currentLanguage;
  }

  getLocale(lang = null) {
    const target = lang || this.currentLanguage;
    const map = {
      'ta': 'ta-IN',
      'hi': 'hi-IN',
      'te': 'te-IN',
      'en': 'en-IN',
    };
    return map[target] || 'en-IN';
  }

  getSpeechLang(lang = null) {
    return this.getLocale(lang);
  }

  setLanguage(lang) {
    if (!translations[lang]) {
      console.warn(`[i18n] Unsupported language requested: "${lang}"`);
      return;
    }

    if (this.currentLanguage === lang) return;

    this.currentLanguage = lang;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('farmchain_lang', lang);
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;

      // Sync any other language selectors on page
      document
        .querySelectorAll('.language-selector, #lang-selector, .farmchain-lang-select')
        .forEach((sel) => {
          if (sel.value !== lang) sel.value = lang;
        });

      // Update document title and meta description if available
      const docTitle = this.t('meta.title') || this.t('appName');
      if (docTitle && docTitle !== 'meta.title') {
        document.title = `${docTitle} — FarmChain AI`;
      }
      const metaDesc = document.querySelector('meta[name="description"]');
      const translatedDesc = this.t('meta.description') || this.t('heroSubtitle');
      if (metaDesc && translatedDesc && translatedDesc !== 'meta.description') {
        metaDesc.setAttribute('content', translatedDesc);
      }
    }

    // Preserve active form state across re-renders
    const savedFormData = this._captureFormData();

    // Trigger all registered change listeners
    this.listeners.forEach((cb) => {
      try {
        cb(lang);
      } catch (err) {
        console.error('i18n listener error:', err);
      }
    });

    // Re-render current route without full page reload
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('farmchain:lang_changed', { detail: { language: lang } }));
      this._restoreFormData(savedFormData);
    }
  }

  _captureFormData() {
    if (typeof document === 'undefined') return null;
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select:not(.farmchain-lang-select)');
    const state = [];
    inputs.forEach((el, index) => {
      const identifier = el.id ? `#${el.id}` : el.name ? `[name="${el.name}"]` : null;
      if (identifier) {
        state.push({
          identifier,
          type: el.type,
          value: el.value,
          checked: el.checked,
        });
      }
    });
    return state;
  }

  _restoreFormData(state) {
    if (!state || state.length === 0 || typeof document === 'undefined') return;
    setTimeout(() => {
      state.forEach((item) => {
        try {
          const el = document.querySelector(item.identifier);
          if (el) {
            if (item.type === 'checkbox' || item.type === 'radio') {
              el.checked = item.checked;
            } else {
              el.value = item.value;
            }
          }
        } catch (_) {}
      });
    }, 50);
  }

  _resolveKey(dict, key) {
    if (!dict || !key) return undefined;
    if (dict[key] !== undefined) return dict[key];

    if (key.includes('.')) {
      const parts = key.split('.');
      let cur = dict;
      let matched = true;
      for (const p of parts) {
        if (cur && typeof cur === 'object' && cur[p] !== undefined) {
          cur = cur[p];
        } else {
          matched = false;
          break;
        }
      }
      if (matched && cur !== undefined) return cur;

      // Smart sub-namespace fallback (e.g. "farmer.dashboard.quickActionsTitle" -> "farmer.quickActionsTitle")
      if (parts.length > 2) {
        const directSub = dict[parts[0]];
        if (directSub && typeof directSub === 'object') {
          const lastPart = parts[parts.length - 1];
          if (directSub[lastPart] !== undefined) return directSub[lastPart];
        }
      }
    } else {
      // Fallback for flat keys inside major domain sections
      const domains = ['farmer', 'common', 'nav', 'roles', 'auth', 'camera', 'scanner', 'wallet', 'crops', 'admin', 'ai', 'trace', 'errors', 'time', 'status', 'landing'];
      for (const d of domains) {
        if (dict[d] && typeof dict[d] === 'object' && dict[d][key] !== undefined) {
          return dict[d][key];
        }
      }
    }
    return undefined;
  }

  t(key, params = {}) {
    if (!key) return '';
    const dict = translations[this.currentLanguage] || translations.en;
    let str = this._resolveKey(dict, key);

    if (str === undefined && this.currentLanguage !== 'en') {
      str = this._resolveKey(translations.en, key);
    }

    if (str === undefined) {
      // Dev mode missing key warning
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.warn(`[i18n] Missing translation for key: "${key}" in language: "${this.currentLanguage}"`);
      }
      str = key;
    }

    // Interpolate {param} placeholders
    if (params && typeof str === 'string') {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`{${k}}`, v !== undefined && v !== null ? v : '');
      }
    }

    return str;
  }

  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Text-to-Speech (SpeechSynthesis)
   * Reads text aloud in current or specified language
   */
  speak(text, lang = null, onEnd = null) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      return false;
    }

    try {
      window.speechSynthesis.cancel();

      const speechLang = this.getSpeechLang(lang);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechLang;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(
        (v) => v.lang === speechLang || v.lang.startsWith(speechLang.slice(0, 2))
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.error('SpeechSynthesis error:', err);
      if (onEnd) onEnd();
      return false;
    }
  }

  stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  renderLanguageSelector(customId = 'lang-selector', customStyle = '') {
    const defaultStyle =
      'padding: 6px 14px; font-size: 0.82rem; font-weight: 600; background-color: var(--bg-card, #1e293b); color: var(--text-primary, #f8fafc); border: 1px solid var(--border-rule, rgba(255,255,255,0.15)); border-radius: var(--radius-full, 9999px); cursor: pointer; display: inline-flex; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);';
    return `
      <select class="form-select language-selector farmchain-lang-select" id="${customId}" style="${customStyle || defaultStyle}" title="Select Language">
        <option value="en" ${this.currentLanguage === 'en' ? 'selected' : ''}>EN | English</option>
        <option value="hi" ${this.currentLanguage === 'hi' ? 'selected' : ''}>हिन्दी (Hindi)</option>
        <option value="ta" ${this.currentLanguage === 'ta' ? 'selected' : ''}>தமிழ் (Tamil)</option>
        <option value="te" ${this.currentLanguage === 'te' ? 'selected' : ''}>తెలుగు (Telugu)</option>
      </select>
    `;
  }
}

export const i18n = new I18nService();
