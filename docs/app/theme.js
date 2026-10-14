// Runs before the page paints: applies the saved theme (shared with the site, key voodoo:theme)
// and language so there is no flash of the wrong colors or words.
(function () {
  var root = document.documentElement;
  try {
    var t = localStorage.getItem('voodoo:theme');
    if (t && t.charAt(0) === '"') t = JSON.parse(t);
    if (t === 'light' || t === 'dark') {
      root.setAttribute('data-theme', t);
      root.style.colorScheme = t;
    }
    var lang = localStorage.getItem('filefinch:lang');
    if (!lang) lang = /^pt\b/i.test(navigator.language || '') ? 'pt' : 'en';
    root.setAttribute('lang', lang === 'pt' ? 'pt-BR' : 'en');
  } catch (e) {}
})();
