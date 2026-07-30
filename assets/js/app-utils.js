window.NAH_APP = (() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const escapeHtml = (v = '') => String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const parseDate = v => { if (!v) return null; const d = new Date(`${v}T12:00:00`); return isNaN(d) ? null : d; };
  const daysUntil = (v, from = todayIso()) => { const a = parseDate(v), b = parseDate(from); return a && b ? Math.ceil((a - b) / 86400000) : null; };
  const daysBetween = (a, b = todayIso()) => { const x = parseDate(a), y = parseDate(b); return x && y ? Math.round((y - x) / 86400000) : null; };
  const formatDate = v => { const d = parseDate(v); return d ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d) : '—'; };
  const nextBusinessDay = (v = todayIso()) => { const d = parseDate(v) || new Date(); do d.setDate(d.getDate() + 1); while ([0, 6].includes(d.getDay())); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  function toast(message, type = '') {
    let stack = $('.toast-stack');
    if (!stack) { stack = document.createElement('div'); stack.className = 'toast-stack'; document.body.append(stack); }
    const el = document.createElement('div'); el.className = `toast ${type}`; el.textContent = message; stack.append(el);
    setTimeout(() => el.remove(), 3500);
  }

  function downloadText(name, text, mime = 'text/plain;charset=utf-8') {
    const blob = new Blob([text], { type: mime }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const downloadJson = (name, obj) => downloadText(name, JSON.stringify(obj, null, 2), 'application/json;charset=utf-8');

  async function copyText(text, msg = 'Copied to clipboard') {
    try { await navigator.clipboard.writeText(text); toast(msg, 'success'); }
    catch {
      const ta = document.createElement('textarea'); ta.value = text; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast(msg, 'success');
    }
  }

  const csvEscape = v => /[",\n]/.test(String(v ?? '')) ? `"${String(v ?? '').replaceAll('"', '""')}"` : String(v ?? '');
  function toCsv(rows, headers) {
    const specs = headers.map(h => typeof h === 'string' ? { key: h, label: h } : h);
    return [specs.map(x => csvEscape(x.label)).join(','), ...rows.map(r => specs.map(x => csvEscape(r[x.key])).join(','))].join('\n');
  }

  function parseCsv(text) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i], n = text[i + 1];
      if (c === '"' && q && n === '"') { cell += '"'; i++; }
      else if (c === '"') q = !q;
      else if (c === ',' && !q) { row.push(cell); cell = ''; }
      else if ((c === '\n' || c === '\r') && !q) { if (c === '\r' && n === '\n') i++; row.push(cell); if (row.some(x => x !== '')) rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    row.push(cell); if (row.some(x => x !== '')) rows.push(row); if (!rows.length) return [];
    const headers = rows.shift().map(x => x.trim()); return rows.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
  }

  const readFileText = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsText(f); });
  const readFileDataUrl = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); });

  function bindTabs(root = document) {
    $$('[data-tab]', root).forEach(btn => btn.addEventListener('click', () => {
      const group = btn.closest('[data-tabs]') || root;
      $$('[data-tab]', group).forEach(x => x.classList.toggle('active', x === btn));
      $$('[data-panel]', group).forEach(x => x.hidden = x.dataset.panel !== btn.dataset.tab);
    }));
  }

  function modal(title, html) {
    let back = $('.modal-backdrop');
    if (!back) {
      back = document.createElement('div'); back.className = 'modal-backdrop';
      back.innerHTML = '<section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h2 data-modal-title></h2><button class="modal-close" aria-label="Close">×</button></div><div data-modal-body></div></section>';
      document.body.append(back);
      back.querySelector('.modal-close').addEventListener('click', () => back.classList.remove('open'));
      back.addEventListener('click', e => { if (e.target === back) back.classList.remove('open'); });
    }
    back.querySelector('[data-modal-title]').textContent = title;
    back.querySelector('[data-modal-body]').innerHTML = html;
    back.classList.add('open');
    return back;
  }

  function priorityBadge(p) {
    const map = {
      Critical: '<span class="badge badge-red">🔴 Critical Risk</span>',
      High: '<span class="badge badge-amber">🟡 High Priority</span>',
      Review: '<span class="badge badge-blue">🔵 In Review</span>',
      Complete: '<span class="badge badge-green">🟢 Completed</span>'
    };
    return map[p] || `<span class="badge badge-muted">${escapeHtml(p)}</span>`;
  }

  function showGlossaryModal() {
    modal('Office Jargon & Terms Glossary', `
      <p style="color:var(--muted); margin-bottom:16px;">Common abbreviations and operational terms used across Nicole’s tailoring & sales hub:</p>
      <dl class="glossary-grid">
        <div class="glossary-item">
          <dt>COF (Client Order File)</dt>
          <dd>The unique internal order number assigned to a client's custom garment purchase.</dd>
        </div>
        <div class="glossary-item">
          <dt>ETC (Estimated Time of Completion)</dt>
          <dd>The target date provided by the tailor or factory when alterations will be finished.</dd>
        </div>
        <div class="glossary-item">
          <dt>WIP (Work In Progress)</dt>
          <dd>Garments currently being manufactured in factories (e.g. English American, Oxxford, Blue Delta).</dd>
        </div>
        <div class="glossary-item">
          <dt>Watch List</dt>
          <dd>Orders flagged for potential delays, missing measurements, fabric holds, or upcoming event deadlines.</dd>
        </div>
        <div class="glossary-item">
          <dt>Custody Risk / Unverified Location</dt>
          <dd>A garment record without a confirmed rack location (e.g. Needs verification if at Gegi, Main Rack, or with Nicole).</dd>
        </div>
        <div class="glossary-item">
          <dt>Blue Pencil Stage</dt>
          <dd>The pattern-cutting and initial production verification stage at the manufacturing factory.</dd>
        </div>
      </dl>
    `);
  }

  return { $, $$, escapeHtml, todayIso, parseDate, daysUntil, daysBetween, formatDate, nextBusinessDay, toast, downloadText, downloadJson, copyText, toCsv, parseCsv, readFileText, readFileDataUrl, bindTabs, modal, priorityBadge, showGlossaryModal };
})();
