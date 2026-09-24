// ============================================
// FarmChain AI — i18n Parity & Completeness Checker
// Verifies en, hi, ta, te have 1:1 key parity and no empty strings
// ============================================

import { translations } from '../frontend/src/i18n/translations.js';

const languages = ['en', 'hi', 'ta', 'te'];
let hasErrors = false;

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getAllKeys(v, fullKey));
    } else {
      keys.push({ key: fullKey, value: v });
    }
  }
  return keys;
}

console.log('🔍 Checking FarmChain AI i18n dictionaries...\n');

const dicts = {};
const keySets = {};

for (const lang of languages) {
  if (!translations[lang]) {
    console.error(`❌ Language "${lang}" is missing entirely from translations.js`);
    hasErrors = true;
    continue;
  }
  const entries = getAllKeys(translations[lang]);
  dicts[lang] = new Map(entries.map(e => [e.key, e.value]));
  keySets[lang] = new Set(entries.map(e => e.key));
  console.log(`📦 [${lang}] found ${entries.length} translation keys`);
}

if (hasErrors) {
  process.exit(1);
}

const enKeys = keySets['en'];

// 1. Check for empty or non-string values
for (const lang of languages) {
  for (const [key, val] of dicts[lang].entries()) {
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      console.error(`❌ [${lang}] Empty or invalid value for key: "${key}"`);
      hasErrors = true;
    }
  }
}

// 2. Check for missing keys compared to 'en'
for (const lang of ['hi', 'ta', 'te']) {
  const missingInLang = [];
  const extraInLang = [];

  for (const k of enKeys) {
    if (!keySets[lang].has(k)) {
      missingInLang.push(k);
    }
  }

  for (const k of keySets[lang]) {
    if (!enKeys.has(k)) {
      extraInLang.push(k);
    }
  }

  if (missingInLang.length > 0) {
    console.error(`\n❌ [${lang}] is missing ${missingInLang.length} keys present in [en]:`);
    missingInLang.slice(0, 15).forEach(k => console.error(`   - ${k}`));
    if (missingInLang.length > 15) console.error(`   ... and ${missingInLang.length - 15} more`);
    hasErrors = true;
  } else {
    console.log(`✅ [${lang}] has 100% key parity with [en]`);
  }

  if (extraInLang.length > 0) {
    console.warn(`⚠️ [${lang}] has ${extraInLang.length} keys NOT in [en]:`);
    extraInLang.slice(0, 5).forEach(k => console.warn(`   + ${k}`));
  }
}

if (hasErrors) {
  console.error('\n❌ i18n validation FAILED! Please fix the errors above.');
  process.exit(1);
} else {
  console.log('\n🎉 ALL LANGUAGES (en, hi, ta, te) HAVE 100% KEY PARITY AND NO EMPTY VALUES!');
  process.exit(0);
}
