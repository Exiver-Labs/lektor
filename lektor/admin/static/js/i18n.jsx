function loadTranslations() {
  const ctx = require.context("../../../translations", true, /\.json$/);
  const rv = {};
  ctx.keys().forEach((key) => {
    const langIdMatch = key.match(/([a-z]+)/);
    rv[langIdMatch[1]] = ctx(key);
  });
  return rv;
}

const translations = loadTranslations();

let currentLanguage = "en";
let currentTranslations = translations[currentLanguage];

export function setCurrentLanguage(lang) {
  currentLanguage = lang;
  currentTranslations = translations[currentLanguage];
}

export function getCurrentLanguge() {
  return currentLanguage;
}

export function trans(key) {
  if (typeof key === "object") {
    return key[currentLanguage] ?? key.en;
  }
  return currentTranslations[key] || key;
}
