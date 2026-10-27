(function (root) {
  'use strict';
  function humidity(temp, dew) {
    return Math.min(100, Math.max(0, Math.round(100 * Math.exp(17.625 * dew / (243.04 + dew) - 17.625 * temp / (243.04 + temp)))));
  }
  function dewpoint(temp, rh) {
    const g = Math.log(Math.max(1, rh) / 100) + 17.625 * temp / (243.04 + temp);
    return Math.round(243.04 * g / (17.625 - g) * 10) / 10;
  }
  function direction(value) {
    if (value === null || value === undefined) return '결측';
    return ['북', '북북동', '북동', '동북동', '동', '동남동', '남동', '남남동', '남', '남남서', '남서', '서남서', '서', '서북서', '북서', '북북서'][Math.round(value / 22.5) % 16];
  }
  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function csvCell(value) {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function csv(rows) { return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n'); }
  function parcelAt1km(temp, rh) {
    const td = dewpoint(temp, rh), lcl = Math.max(0, 125 * (temp - td));
    const dry = Math.min(1000, lcl);
    return { temperature: Math.round((temp - dry / 100 - (1000 - dry) / 200) * 10) / 10, lcl: Math.round(lcl) };
  }
  function elapsedHours(times) {
    let previous=-1,day=0;
    const hours=times.map(t=>{
      const h=Number(String(t).match(/(\d{1,2})시/)[1]);
      if(h<previous)day+=24;
      previous=h;return day+h;
    });
    return hours.map(h=>h-hours[0]);
  }
  function bounds(key, frames) {
    const fixed={humidity:[0,100,20],cloud:[0,100,20],precipitation:[0,40,10],visibility:[0,25,5],windSpeed:[0,8,2]};
    if(fixed[key])return fixed[key];
    const values=frames.flat().map(r=>r[key]);
    const rawLow=Math.min(...values)-2,rawHigh=Math.max(...values)+2;
    const rough=(rawHigh-rawLow)/4;
    const step=[1,2,5,10,20,50].find(s=>s>=rough)||100;
    return [Math.floor(rawLow/step)*step,Math.ceil(rawHigh/step)*step,step];
  }
  function difference(key, before, after) {
    const d=Math.round((after-before)*10)/10;
    return {value:d,unit:['humidity','cloud'].includes(key)?'%p':key==='windSpeed'?'m/s':key==='precipitation'?'mm':key==='visibility'?'km':'℃'};
  }
  const api = { humidity, dewpoint, direction, escapeHTML, csv, parcelAt1km, elapsedHours, bounds, difference };
  root.WeatherCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
