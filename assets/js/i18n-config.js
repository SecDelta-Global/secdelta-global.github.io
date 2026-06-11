/**
 * SecDelta i18n Configuration and Core Functions
 * Handles language switching, geo-location detection, and content updates
 */

const I18n = (() => {
  let currentLanguage = 'en';
  let translations = {};
  let geoContent = {};
  let currentCountry = 'KSA';

  // Initialize translations and geo-content
  async function init() {
    try {
      // Load translations
      const transRes = await fetch('/assets/data/translations.json');
      translations = await transRes.json();

      // Load geo-content
      const geoRes = await fetch('/assets/data/geo-content.json');
      geoContent = await geoRes.json();

      // Get stored language or detect from browser
      currentLanguage = localStorage.getItem('secdelta-lang') || detectLanguage();
      currentCountry = localStorage.getItem('secdelta-country') || await detectCountry();

      // Set initial language
      setLanguage(currentLanguage);

      // Setup language toggle buttons
      setupLanguageToggles();

      // Setup country detection
      detectAndUpdateCountry();

    } catch (error) {
      console.error('i18n initialization failed:', error);
    }
  }

  // Detect browser language
  function detectLanguage() {
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'ar' ? 'ar' : 'en';
  }

  // Detect user country from timezone
  async function detectCountry() {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone.includes('Riyadh') || timezone.includes('Mecca') || timezone.includes('Asia/Riyadh')) {
        return 'KSA';
      }
      if (timezone.includes('Dubai') || timezone.includes('Abu_Dhabi') || timezone.includes('Asia/Dubai')) {
        return 'AUE';
      }
      if (timezone.includes('Cairo') || timezone.includes('Africa/Cairo')) {
        return 'EG';
      }
      // Fallback to geolocation API if available
      return await getCountryFromGeolocation();
    } catch (error) {
      console.warn('Country detection failed, defaulting to KSA:', error);
      return 'KSA';
    }
  }

  // Get country from geolocation API
  async function getCountryFromGeolocation() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const countryCode = data.country_code;
      
      if (countryCode === 'SA') return 'KSA';
      if (countryCode === 'AE') return 'AUE';
      if (countryCode === 'EG') return 'EG';
      
      return 'KSA'; // default
    } catch (error) {
      console.warn('Geolocation API failed:', error);
      return 'KSA';
    }
  }

  // Detect and update content based on country
  async function detectAndUpdateCountry() {
    const detected = await detectCountry();
    setCountry(detected);
  }

  // Set language
  function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('secdelta-lang', lang);

    // Update HTML attributes
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', lang === 'ar');
    document.body.classList.toggle('ltr', lang === 'en');

    // Add language class
    document.body.setAttribute('data-language', lang);

    // Update all translatable elements
    updateTranslations(lang);

    // Update meta tags
    updateMetaTags(lang);

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  }

  // Set country
  function setCountry(country) {
    currentCountry = country;
    localStorage.setItem('secdelta-country', country);
    document.body.setAttribute('data-country', country);

    // Update geo-specific content
    updateGeoContent(currentLanguage, country);

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('countryChanged', { detail: { country: country } }));
  }

  // Update all translated content
  function updateTranslations(lang) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (translations[lang] && translations[lang][key]) {
        element.textContent = translations[lang][key];
      }
    });

    // Update data attributes with translations
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      if (translations[lang] && translations[lang][key]) {
        element.setAttribute('placeholder', translations[lang][key]);
      }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      if (translations[lang] && translations[lang][key]) {
        element.setAttribute('title', translations[lang][key]);
      }
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(element => {
      const key = element.getAttribute('data-i18n-alt');
      if (translations[lang] && translations[lang][key]) {
        element.setAttribute('alt', translations[lang][key]);
      }
    });
  }

  // Update geo-specific content
  function updateGeoContent(lang, country) {
    if (!geoContent[country]) return;

    const content = geoContent[country][lang] || geoContent[country]['en'];

    document.querySelectorAll('[data-geo="country"]').forEach(el => {
      el.textContent = content.country;
    });

    document.querySelectorAll('[data-geo="city"]').forEach(el => {
      el.textContent = content.city;
    });

    document.querySelectorAll('[data-geo="phone"]').forEach(el => {
      el.textContent = content.phone;
      if (el.tagName === 'A' && el.getAttribute('href').startsWith('tel:')) {
        el.setAttribute('href', 'tel:' + content.phone.replace(/[^0-9+]/g, ''));
      }
    });

    document.querySelectorAll('[data-geo="email"]').forEach(el => {
      el.textContent = content.email;
      if (el.tagName === 'A' && el.getAttribute('href').startsWith('mailto:')) {
        el.setAttribute('href', 'mailto:' + content.email);
      }
    });

    document.querySelectorAll('[data-geo="description"]').forEach(el => {
      el.textContent = content.description;
    });
  }

  // Update meta tags for language and geo-targeting
  function updateMetaTags(lang) {
    // Update content-language meta tag
    const langMeta = document.querySelector('meta[http-equiv="content-language"]');
    if (langMeta) {
      langMeta.setAttribute('content', lang === 'ar' ? 'ar-SA' : 'en-US');
    }

    // Update og:locale
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) {
      ogLocale.setAttribute('content', lang === 'ar' ? 'ar_SA' : 'en_US');
    }

    // Update language meta tag
    const langTag = document.querySelector('meta[name="language"]');
    if (langTag) {
      langTag.setAttribute('content', lang === 'ar' ? 'Arabic' : 'English');
    }
  }

  // Setup language toggle buttons
  function setupLanguageToggles() {
    document.querySelectorAll('.lang-toggle').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const newLang = currentLanguage === 'en' ? 'ar' : 'en';
        setLanguage(newLang);
      });
    });

    // Setup country toggle buttons
    document.querySelectorAll('.country-toggle').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const country = this.getAttribute('data-country');
        if (country) {
          setCountry(country);
        }
      });
    });
  }

  // Get translation
  function t(key) {
    return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
  }

  // Get current language
  function getCurrentLanguage() {
    return currentLanguage;
  }

  // Get current country
  function getCurrentCountry() {
    return currentCountry;
  }

  return {
    init,
    setLanguage,
    setCountry,
    t,
    getCurrentLanguage,
    getCurrentCountry,
    detectAndUpdateCountry
  };
})();

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => I18n.init());
} else {
  I18n.init();
}
