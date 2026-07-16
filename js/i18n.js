/**
 * i18n.js — Internationalization (English base, structure for ML/AR)
 */

const TRANSLATIONS = {
  en: {
    // App
    'app.title': 'Markaz Knowledge City',
    'app.subtitle': 'Smart Visitor Guide',
    'app.loading': 'Loading...',
    'app.you_are_here': 'You Are Here',
    // Nav tabs
    'nav.map': 'Map',
    'nav.posters': 'Posters',
    'nav.story': 'Story',
    'nav.social': 'Connect',
    'nav.review': 'Review',
    // Map
    'map.search_placeholder': 'Search buildings, facilities...',
    'map.nearby': 'Nearby Locations',
    'map.directions': 'Get Directions',
    'map.recenter': 'My Location',
    // Posters
    'posters.title': 'Poster Download Center',
    'posters.subtitle': 'Download & share official Markaz posters',
    'posters.download': 'Download',
    'posters.share': 'Share',
    'posters.share_title': 'Share Poster',
    'posters.whatsapp': 'WhatsApp',
    'posters.instagram': 'Instagram',
    'posters.facebook': 'Facebook',
    'posters.copy_link': 'Copy Link',
    // Story
    'story.title': 'Create Your Story',
    'story.subtitle': 'Design a personalized social media story',
    'story.choose_frame': 'Choose a Frame',
    'story.add_photo': 'Add Your Photo',
    'story.caption': 'Caption',
    'story.auto_caption': 'Auto-Generate',
    'story.download': 'Download Story',
    'story.share_ig': 'Share to Instagram',
    // Social
    'social.title': 'Connect With Us',
    'social.subtitle': 'Follow us on social media',
    // Review
    'review.title': 'Rate Your Visit',
    'review.subtitle': 'Your feedback helps us improve',
    'review.rate_us': 'Rate Your Experience',
    'review.submit': 'Submit Review',
    'review.google': 'Write on Google',
    'review.thankyou': 'Thank You!',
    'review.thankyou_msg': 'Your review means a lot to us. We\'re glad you visited Markaz Knowledge City!',
    // Toast
    'toast.copied': 'Link copied to clipboard!',
    'toast.downloaded': 'Poster saved to your device!',
    'toast.select_rating': 'Please select a star rating first!',
  },
  ml: {
    'app.title': 'മർകസ് നോളജ് സിറ്റി',
    'app.subtitle': 'സ്മാർട്ട് വിസിറ്റർ ഗൈഡ്',
    'app.loading': 'ലോഡ് ചെയ്യുന്നു...',
    'app.you_are_here': 'നിങ്ങൾ ഇവിടെ ആണ്',
    'nav.map': 'ഭൂപടം',
    'nav.posters': 'പോസ്റ്ററുകൾ',
    'nav.story': 'സ്റ്റോറി',
    'nav.social': 'കണക്ട്',
    'nav.review': 'അഭിപ്രായം',
    'map.search_placeholder': 'കെട്ടിടങ്ങൾ, സൗകര്യങ്ങൾ തിരയുക...',
    'map.nearby': 'സമീപ സ്ഥലങ്ങൾ',
    'map.directions': 'ദിശകൾ നേടുക',
    'review.title': 'നിങ്ങളുടെ സന്ദർശനം വിലയിരുത്തുക',
    'review.thankyou': 'നന്ദി!',
  },
  ar: {
    'app.title': 'مركز مدينة المعرفة',
    'app.subtitle': 'دليل الزوار الذكي',
    'app.loading': 'جار التحميل...',
    'app.you_are_here': 'أنت هنا',
    'nav.map': 'الخريطة',
    'nav.posters': 'ملصقات',
    'nav.story': 'قصة',
    'nav.social': 'تواصل',
    'nav.review': 'تقييم',
    'map.search_placeholder': 'ابحث عن المباني والمرافق...',
    'map.nearby': 'المواقع القريبة',
    'review.title': 'قيّم زيارتك',
    'review.thankyou': 'شكراً لك!',
  }
};

class I18n {
  constructor() {
    this.currentLang = localStorage.getItem('mkc_lang') || 'en';
    this.rtlLangs = ['ar'];
  }

  setLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    this.currentLang = lang;
    localStorage.setItem('mkc_lang', lang);

    // RTL support
    document.documentElement.dir = this.rtlLangs.includes(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    this.applyTranslations();
  }

  t(key) {
    return TRANSLATIONS[this.currentLang]?.[key] ||
           TRANSLATIONS['en']?.[key] ||
           key;
  }

  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const attr = el.dataset.i18nAttr;
      const value = this.t(key);
      if (attr) el.setAttribute(attr, value);
      else el.textContent = value;
    });
  }

  getCurrentLang() { return this.currentLang; }
}

window.I18n = new I18n();
