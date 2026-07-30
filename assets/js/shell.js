(() => {
  const page = document.body.dataset.page || '';
  const depth = Number(document.body.dataset.depth || 0);
  const base = '../'.repeat(depth);

  const nav = [
    ['dashboard', '📊 Dashboard', 'index.html'],
    ['workbench', '📋 Workbench', 'workbench.html'],
    ['operations', '⚡ Daily Ops', 'operations.html'],
    ['programs', '🧰 All Tools', 'programs/'],
    ['trello', '🔄 Trello Sync', 'trello.html'],
    ['training', '🎓 Training', 'training.html'],
    ['resources', '📚 Resources', 'resources.html']
  ];

  const header = `
    <a class="skip-link" href="#main">Skip to main content</a>
    <header class="site-header">
      <div class="container nav-wrap">
        <a class="brand" href="${base}index.html">
          <span class="brand-mark">NA</span>
          <span class="brand-copy">
            <strong>Nicole's Operations Suite</strong>
            <span>Sales & Tailoring Control Center</span>
          </span>
        </a>
        <button class="menu-button" type="button" data-menu aria-expanded="false">☰ Navigation</button>
        <nav class="nav-links" data-nav>
          ${nav.map(([id, label, url]) => `<a href="${base}${url}"${page === id ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
        </nav>
        <div class="nav-actions">
          <span class="workspace-indicator" title="Local browser storage mode">
            <span class="workspace-dot"></span>
            <span data-storage-label>Loading...</span>
          </span>
          <a class="icon-btn" href="${base}privacy.html" title="Workspace & Security Settings" aria-label="Workspace settings">⚙️</a>
        </div>
      </div>
    </header>
  `;

  const footer = `
    <footer>
      <div class="container footer-grid">
        <div>
          <strong>Nicole's Operations Suite</strong>
          <p>Local-first office control platform for Tom James sales operations & tailoring workflow. Real client data stays on your device.</p>
        </div>
        <div class="footer-links">
          <a href="${base}privacy.html">🔒 Privacy & Storage</a>
          <a href="${base}embed-guide.html">📖 Deployment Guide</a>
          <a href="${base}programs/">🧰 All 15 Tools</a>
        </div>
      </div>
      <div class="container" style="margin-top:20px; color:rgba(255,255,255,.6); font-size:.8rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <span>© <span data-year></span> Tom James Office Toolkit — Built for Nicole & Assistant</span>
        <span>Mode: <strong data-storage-mode-text style="color:#fff;">Session</strong></span>
      </div>
    </footer>
    <div class="privacy-ribbon">
      <strong>Public Repository Notice:</strong> Do not commit client confidential records, credentials, or private contact details to git.
    </div>
  `;

  document.body.insertAdjacentHTML('afterbegin', header);
  document.body.insertAdjacentHTML('beforeend', footer);

  const menu = document.querySelector('[data-menu]'), navEl = document.querySelector('[data-nav]');
  if (menu && navEl) {
    menu.addEventListener('click', () => {
      const open = navEl.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
    });
  }

  document.querySelectorAll('[data-year]').forEach(x => x.textContent = new Date().getFullYear());

  function updateLabel() {
    const isLocal = NAH_STORE.getMode() === 'local';
    document.querySelectorAll('[data-storage-label]').forEach(x => x.textContent = isLocal ? 'Saved on Device' : 'Session Workspace');
    document.querySelectorAll('[data-storage-mode-text]').forEach(x => x.textContent = isLocal ? 'Local Storage (Persistent)' : 'Session Storage (Tab Only)');
  }
  updateLabel();
  window.addEventListener('nah:workspace-change', updateLabel);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register(`${base}sw.js`).catch(() => {});
  }
})();
