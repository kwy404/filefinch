// filefinch seasons: picks a special date theme from the visitor's local
// date and sets data-season on <html>. Shared by the website and the app.
// ?season=<id> forces one, ?season=off turns it off, and a dismissed season
// stays off until next year (localStorage). No dependencies.
(function (g) {
  var IDS = ['newyear', 'carnival', 'easter', 'valentine', 'junina', 'halloween', 'christmas'];
  var KEY = 'filefinch:season-off:';

  // Easter Sunday, anonymous Gregorian algorithm. Returns a local Date.
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    var f = Math.floor((b + 8) / 25), h = (19 * a + b - d - Math.floor((b - f + 1) / 3) + 15) % 30;
    var l = (32 + 2 * e + 2 * Math.floor(c / 4) - h - (c % 4)) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var n = h + l - 7 * m + 114;
    return new Date(y, Math.floor(n / 31) - 1, (n % 31) + 1);
  }

  var day = function (dt) { return Math.round(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()) / 864e5); };
  var isBR = function (lang) { return /^pt-br$/i.test(String(lang || '')); };

  // The season of a date, or null. lang is the visitor language, like pt-BR.
  function seasonFor(date, lang) {
    var M = date.getMonth() + 1, D = date.getDate(), br = isBR(lang);
    var t = day(date), e = day(easter(date.getFullYear()));
    var carnival = t >= e - 50 && t <= e - 46;
    if ((M === 12 && D >= 30) || (M === 1 && D <= 2)) return 'newyear';
    if (M === 12 && D >= 18 && D <= 26) return 'christmas';
    if (M === 10 && D >= 24) return 'halloween';
    if (M === 6 && D >= 13 && D <= 29) return 'junina';
    if (carnival && br) return 'carnival';
    if ((M === 2 && D === 14) || (br && M === 6 && D === 12)) return 'valentine';
    if (carnival) return 'carnival';
    if (t >= e - 2 && t <= e) return 'easter';
    return null;
  }

  // The year a season belongs to, so a dismissal lasts until next year.
  var yearOf = function (id, date) { return date.getFullYear() + (id === 'newyear' && date.getMonth() === 11 ? 1 : 0); };

  function store() { try { return g.localStorage; } catch (e) { return null; } }

  function isOff(id, date) {
    var s = store();
    try { return !!s && s.getItem(KEY + id) === String(yearOf(id, date || new Date())); } catch (e) { return false; }
  }

  function setOff(id, date) {
    var s = store();
    try { if (s) s.setItem(KEY + id, String(yearOf(id, date || new Date()))); } catch (e) { /* private mode */ }
  }

  // The season to show: the override in search wins, then the date, unless dismissed.
  function active(o) {
    o = o || {};
    var date = o.date || new Date();
    var m = /[?&]season=([a-z]+)/.exec(o.search == null ? (g.location && g.location.search) || '' : o.search);
    if (m) return IDS.indexOf(m[1]) >= 0 ? m[1] : null;
    var id = seasonFor(date, o.lang == null ? (g.navigator && g.navigator.language) || '' : o.lang);
    return id && !(o.ignoreOff || isOff(id, date)) ? id : null;
  }

  var forced = function () { return /[?&]season=/.test((g.location && g.location.search) || ''); };

  var NAMES = {
    en: { newyear: 'New Year', carnival: 'Carnival', easter: 'Easter', valentine: "Valentine's Day", junina: 'Midsummer', halloween: 'Halloween', christmas: 'Christmas' },
    pt: { newyear: 'Ano Novo', carnival: 'Carnaval', easter: 'Páscoa', valentine: 'Namorados', junina: 'Festa Junina', halloween: 'Halloween', christmas: 'Natal' },
  };

  // Display name. The June theme is Festa Junina for pt-BR visitors.
  function label(id, uiLang, visitorLang) {
    var pt = /^pt/i.test(uiLang || '');
    if (id === 'junina' && isBR(visitorLang == null ? g.navigator && g.navigator.language : visitorLang)) return 'Festa Junina';
    return (pt ? NAMES.pt : NAMES.en)[id] || id;
  }

  function apply(doc) {
    doc = doc || g.document;
    if (!doc) return null;
    var id = active();
    if (id) doc.documentElement.setAttribute('data-season', id);
    else doc.documentElement.removeAttribute('data-season');
    return id;
  }

  // Turns the current season off for this year and removes the attribute.
  function off(doc) {
    doc = doc || g.document;
    var id = doc.documentElement.getAttribute('data-season');
    if (id && !forced()) setOff(id);
    doc.documentElement.removeAttribute('data-season');
    try { doc.dispatchEvent(new CustomEvent('seasonchange', { detail: null })); } catch (e) { /* old browser */ }
  }

  g.FFSeasons = { IDS: IDS, easter: easter, seasonFor: seasonFor, active: active, isOff: isOff, setOff: setOff, label: label, apply: apply, off: off };
  if (g.document) apply(g.document);
})(globalThis);
