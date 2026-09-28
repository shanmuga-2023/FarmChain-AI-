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

    const oldLang = this.currentLanguage;
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
        document.title = `${docTitle} — FarmChain`;
      }
      const metaDesc = document.querySelector('meta[name="description"]');
      const translatedDesc = this.t('meta.description') || this.t('heroSubtitle');
      if (metaDesc && translatedDesc && translatedDesc !== 'meta.description') {
        metaDesc.setAttribute('content', translatedDesc);
      }
      
      // dynamically update DOM without reloading or replacing components!
      this._applyDynamicTranslations(oldLang, lang);
    }

    // Trigger all registered change listeners (modals, etc that need custom logic, if any remain)
    this.listeners.forEach((cb) => {
      try {
        cb(lang);
      } catch (err) {
        console.error('i18n listener error:', err);
      }
    });

    // Dispatch both event names for compatibility
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('farmchain:lang_updated', { detail: { language: lang } }));
      window.dispatchEvent(new CustomEvent('farmchain:lang_changed', { detail: { language: lang } }));
    }
  }

  _applyDynamicTranslations(oldLang, newLang) {
    if (typeof document === 'undefined') return;
    
    const oldDict = translations[oldLang] || translations.en;
    const enDict = translations.en;
    
    // Create reverse map: "String in old language" -> "Translation Key"
    const reverseMap = {};
    const buildReverseMap = (dict, prefix = '') => {
      for (const [k, v] of Object.entries(dict)) {
        if (typeof v === 'string') {
          const trimmed = v.trim();
          if (trimmed && !reverseMap[trimmed]) { // avoid overwrite collisions
            reverseMap[trimmed] = prefix ? `${prefix}.${k}` : k;
          }
        } else if (typeof v === 'object' && v !== null) {
          buildReverseMap(v, prefix ? `${prefix}.${k}` : k);
        }
      }
    };
    buildReverseMap(oldDict);
    
    // Also build a map of English fallback strings just in case
    if (oldLang !== 'en') {
       buildReverseMap(enDict);
    }

    // 1. Update all text nodes
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    const textNodesToUpdate = [];
    while ((node = walker.nextNode())) {
      if (!node.nodeValue) continue;
      const originalText = node.nodeValue.trim();
      if (!originalText) continue;
      
      // Sometimes multiple keys might be in one text node or exact match
      if (reverseMap[originalText]) {
        textNodesToUpdate.push({ node, key: reverseMap[originalText], exact: true, originalText });
      } else {
        // Try substring matching for longer text nodes
        for (const [str, key] of Object.entries(reverseMap)) {
           if (str.length > 3 && node.nodeValue.includes(str)) {
              textNodesToUpdate.push({ node, key, exact: false, strToReplace: str });
              break; // simplified one-pass replacement
           }
        }
      }
    }
    
    textNodesToUpdate.forEach(({ node, key, exact, originalText, strToReplace }) => {
       const newText = this.t(key);
       if (exact) {
         node.nodeValue = node.nodeValue.replace(originalText, newText);
       } else {
         node.nodeValue = node.nodeValue.replaceAll(strToReplace, newText);
       }
    });

    // 2. Update Attributes (placeholder, title, aria-label)
    const elements = document.querySelectorAll('[placeholder], [title], [aria-label]');
    elements.forEach(el => {
      ['placeholder', 'title', 'aria-label'].forEach(attr => {
        if (el.hasAttribute(attr)) {
          const attrVal = el.getAttribute(attr).trim();
          if (attrVal && reverseMap[attrVal]) {
            el.setAttribute(attr, el.getAttribute(attr).replace(attrVal, this.t(reverseMap[attrVal])));
          }
        }
      });
    });
    
    // 3. Form buttons (value attribute)
    const inputBtns = document.querySelectorAll('input[type="button"], input[type="submit"]');
    inputBtns.forEach(el => {
      const val = el.value.trim();
      if (val && reverseMap[val]) {
         el.value = el.value.replace(val, this.t(reverseMap[val]));
      }
    });
  }

  // (Removed _captureFormData and _restoreFormData as they are no longer needed!)

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

  // Alias for compatibility with pages that call setLocale
  setLocale(lang) {
    return this.setLanguage(lang);
  }

  get currentLocale() {
    return this.currentLanguage;
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
