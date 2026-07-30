(() => {
  const U = window.NAH_APP;

  // Render Quick Links
  document.querySelectorAll('[data-quick-links]').forEach(container => {
    container.innerHTML = (NAH_CONFIG.quickLinks || []).map(item =>
      item.href ? `<a class="quick-link" href="${U.escapeHtml(item.href)}" target="_blank" rel="noopener"><strong>${U.escapeHtml(item.label)}</strong><small>${U.escapeHtml(item.note)}</small></a>`
        : `<a class="quick-link is-unconfigured" href="privacy.html#links"><strong>${U.escapeHtml(item.label)}</strong><small>Configure link</small></a>`
    ).join('');
  });

  function card(p, base = '') {
    return `
      <article class="card program-card">
        <div class="card-top">
          <span class="program-glyph">${p.glyph || '🧰'}</span>
          <span class="badge badge-blue">${U.escapeHtml(p.categoryLabel || p.category)}</span>
        </div>
        <h3>${U.escapeHtml(p.shortTitle || p.title)}</h3>
        <p>${U.escapeHtml(p.summary)}</p>
        <div class="card-footer">
          <span class="badge badge-green">${p.status}</span>
          <a class="text-link" href="${base}programs/${p.slug}/">Launch Tool →</a>
        </div>
      </article>
    `;
  }

  // Render Catalog
  const catalog = document.querySelector('[data-program-catalog]');
  if (catalog) {
    const search = document.querySelector('[data-program-search]');
    const categorySelect = document.querySelector('[data-program-category]');
    const count = document.querySelector('[data-program-count]');
    const catTabs = document.querySelectorAll('[data-category-tabs] .cat-tab');

    const cats = [...new Set(NAH_PROGRAMS.map(x => x.category))];
    categorySelect.innerHTML = '<option value="">All Categories</option>' + cats.map(x => `<option value="${U.escapeHtml(x)}">${U.escapeHtml(x)}</option>`).join('');

    let currentCat = '';

    const render = () => {
      const q = search.value.toLowerCase();
      const items = NAH_PROGRAMS.filter(x => {
        const matchesQ = !q || `${x.title} ${x.shortTitle || ''} ${x.summary} ${x.category}`.toLowerCase().includes(q);
        const matchesCat = !currentCat || x.category === currentCat;
        return matchesQ && matchesCat;
      });

      count.textContent = `Showing ${items.length} of ${NAH_PROGRAMS.length} applications`;
      catalog.innerHTML = items.length ? items.map(x => card(x, '../')).join('') : `
        <div class="empty-state" style="grid-column:1/-1;">
          <p>No tools matched your search "${U.escapeHtml(q)}".</p>
        </div>
      `;
    };

    catTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        catTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCat = tab.dataset.cat || '';
        categorySelect.value = currentCat;
        render();
      });
    });

    search.addEventListener('input', render);
    categorySelect.addEventListener('change', (e) => {
      currentCat = e.target.value;
      catTabs.forEach(t => t.classList.toggle('active', (t.dataset.cat || '') === currentCat));
      render();
    });

    render();
  }

  // Render Resources
  const resources = document.querySelector('[data-resource-list]');
  if (resources) {
    resources.innerHTML = (NAH_CONFIG.resources || []).map(x => `
      <article class="card">
        <div class="card-head">
          <span class="badge badge-blue">${U.escapeHtml(x.type)}</span>
          ${x.href ? '<span class="badge badge-green">Linked</span>' : '<span class="badge badge-muted">Needs Link</span>'}
        </div>
        <h3>${U.escapeHtml(x.title)}</h3>
        <p>${U.escapeHtml(x.status)}</p>
        <div style="margin-top:14px;">
          ${x.href ? `<a class="btn btn-primary btn-small" target="_blank" rel="noopener" href="${U.escapeHtml(x.href)}">Open Resource</a>` : '<a class="btn btn-secondary btn-small" href="privacy.html#links">Configure Link</a>'}
        </div>
      </article>
    `).join('');
  }
})();
