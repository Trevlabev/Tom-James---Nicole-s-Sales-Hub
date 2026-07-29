window.NAH_APP = (() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function todayIso() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function parseDate(value) {
    if (!value) return null;
    const d = new Date(`${value}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function daysBetween(fromValue, toValue = todayIso()) {
    const a = parseDate(fromValue);
    const b = parseDate(toValue);
    if (!a || !b) return null;
    return Math.round((b - a) / 86400000);
  }

  function daysUntil(value, fromValue = todayIso()) {
    const target = parseDate(value);
    const from = parseDate(fromValue);
    if (!target || !from) return null;
    return Math.ceil((target - from) / 86400000);
  }

  function formatDate(value) {
    const d = parseDate(value);
    if (!d) return '—';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  }

  function nextBusinessDay(value = todayIso()) {
    const d = parseDate(value) || new Date();
    do d.setDate(d.getDate() + 1); while (d.getDay() === 0 || d.getDay() === 6);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function uid(prefix = 'item') {
    if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function downloadText(filename, text, mime = 'text/plain;charset=utf-8') {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadJson(filename, value) {
    downloadText(filename, JSON.stringify(value, null, 2), 'application/json;charset=utf-8');
  }

  async function copyText(text, successMessage = 'Copied') {
    try {
      await navigator.clipboard.writeText(text);
      toast(successMessage, 'success');
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      textarea.remove();
      toast(ok ? successMessage : 'Copy failed', ok ? 'success' : 'error');
      return ok;
    }
  }

  function csvEscape(value) {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }

  function toCsv(rows, headers) {
    const keys = headers.map(h => typeof h === 'string' ? h : h.key);
    const labels = headers.map(h => typeof h === 'string' ? h : h.label);
    return [labels.map(csvEscape).join(','), ...rows.map(row => keys.map(k => csvEscape(row[k])).join(','))].join('\n');
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      const next = text[i + 1];
      if (ch === '"' && quoted && next === '"') { cell += '"'; i += 1; continue; }
      if (ch === '"') { quoted = !quoted; continue; }
      if (ch === ',' && !quoted) { row.push(cell); cell = ''; continue; }
      if ((ch === '\n' || ch === '\r') && !quoted) {
        if (ch === '\r' && next === '\n') i += 1;
        row.push(cell); cell = '';
        if (row.some(v => v.trim() !== '')) rows.push(row);
        row = [];
        continue;
      }
      cell += ch;
    }
    row.push(cell);
    if (row.some(v => v.trim() !== '')) rows.push(row);
    if (!rows.length) return [];
    const headers = rows[0].map(h => h.trim());
    return rows.slice(1).map(values => Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ''])));
  }

  function normalizeHeader(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function mapCsvRow(row, aliases) {
    const normalized = Object.fromEntries(Object.entries(row).map(([k, v]) => [normalizeHeader(k), v]));
    const result = {};
    for (const [target, names] of Object.entries(aliases)) {
      const keys = [target, ...names].map(normalizeHeader);
      const match = keys.find(k => Object.hasOwn(normalized, k));
      result[target] = match ? normalized[match] : '';
    }
    return result;
  }

  function readFileText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Unable to read file.'));
      reader.readAsText(file);
    });
  }

  function toast(message, type = 'info') {
    let root = document.querySelector('[data-toast-root]');
    if (!root) {
      root = document.createElement('div');
      root.className = 'toast-root';
      root.dataset.toastRoot = '';
      root.setAttribute('aria-live', 'polite');
      document.body.appendChild(root);
    }
    const item = document.createElement('div');
    item.className = `toast toast-${type}`;
    item.textContent = message;
    root.appendChild(item);
    requestAnimationFrame(() => item.classList.add('show'));
    setTimeout(() => {
      item.classList.remove('show');
      setTimeout(() => item.remove(), 220);
    }, 2600);
  }

  function formToObject(form) {
    const out = {};
    const data = new FormData(form);
    data.forEach((value, key) => {
      if (Object.hasOwn(out, key)) {
        out[key] = Array.isArray(out[key]) ? [...out[key], value] : [out[key], value];
      } else out[key] = value;
    });
    $$('input[type="checkbox"]', form).forEach(input => {
      if (!Object.hasOwn(out, input.name)) out[input.name] = false;
      else if (input.value === 'on') out[input.name] = input.checked;
    });
    return out;
  }

  function setFormValues(form, values) {
    Object.entries(values || {}).forEach(([key, value]) => {
      const fields = $$(`[name="${CSS.escape(key)}"]`, form);
      fields.forEach(field => {
        if (field.type === 'checkbox') field.checked = Boolean(value);
        else if (field.type === 'radio') field.checked = String(field.value) === String(value);
        else field.value = value ?? '';
      });
    });
  }

  function slugify(value) {
    return String(value || 'record').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'record';
  }

  return {
    $, $$, escapeHtml, todayIso, parseDate, daysBetween, daysUntil, formatDate, nextBusinessDay,
    uid, downloadText, downloadJson, copyText, toCsv, parseCsv, mapCsvRow, readFileText, toast,
    formToObject, setFormValues, slugify
  };
})();
