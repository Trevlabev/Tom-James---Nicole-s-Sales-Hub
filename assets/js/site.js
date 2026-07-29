
(function () {
  const menu = document.querySelector('[data-menu-button]');
  const nav = document.querySelector('[data-nav-links]');
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
    });
  }
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  document.querySelectorAll('[data-quick-links]').forEach(container => {
    const links = (window.NAH_CONFIG && window.NAH_CONFIG.quickLinks) || [];
    container.innerHTML = links.map(item => {
      const configured = Boolean(item.href);
      const tag = configured ? 'a' : 'div';
      const attrs = configured ? `href="${item.href}"` : 'aria-disabled="true"';
      return `<${tag} class="quick-link ${configured ? '' : 'is-unconfigured'}" ${attrs}>
        <strong>${item.label}</strong>
        <small>${configured ? item.note : 'Configure this link in assets/js/config.js'}</small>
      </${tag}>`;
    }).join('');
  });

  const featured = document.querySelector('[data-featured-programs]');
  if (featured && window.NAH_PROGRAMS) {
    featured.innerHTML = window.NAH_PROGRAMS.filter(p => p.priority === 'Build first').slice(0,6).map(p => programCard(p, featured.dataset.base || './')).join('');
  }

  const catalog = document.querySelector('[data-program-catalog]');
  if (catalog && window.NAH_PROGRAMS) {
    const search = document.querySelector('[data-program-search]');
    const category = document.querySelector('[data-program-category]');
    const count = document.querySelector('[data-program-count]');
    const categories = [...new Set(window.NAH_PROGRAMS.map(p => p.category))].sort();
    category.innerHTML = '<option value="">All categories</option>' + categories.map(c => `<option value="${c}">${c}</option>`).join('');
    const render = () => {
      const q = (search.value || '').toLowerCase().trim();
      const cat = category.value;
      const items = window.NAH_PROGRAMS.filter(p => {
        const hay = `${p.title} ${p.summary} ${p.category} ${p.status}`.toLowerCase();
        return (!q || hay.includes(q)) && (!cat || p.category === cat);
      });
      count.textContent = `${items.length} program${items.length === 1 ? '' : 's'}`;
      catalog.innerHTML = items.length ? items.map(p => programCard(p, '../')).join('') : '<div class="empty-state card">No programs match the current filters.</div>';
    };
    search.addEventListener('input', render);
    category.addEventListener('change', render);
    render();
  }

  const resourceList = document.querySelector('[data-resource-list]');
  if (resourceList) {
    const items = (window.NAH_CONFIG && window.NAH_CONFIG.resources) || [];
    resourceList.innerHTML = items.map(item => {
      const configured = Boolean(item.href);
      return `<article class="resource-item">
        <div><span class="badge badge-blue">${item.type}</span><h3>${item.title}</h3><p>${item.status}</p></div>
        ${configured ? `<a class="btn btn-primary" href="${item.href}">Open resource</a>` : '<span class="badge badge-muted">Not linked</span>'}
      </article>`;
    }).join('');
  }

  function programCard(p, base) {
    return `<article class="card program-card" data-category="${p.category}">
      <div class="card-top"><div class="program-glyph" aria-hidden="true">${p.glyph}</div><span class="badge ${p.priority === 'Build first' ? 'badge-green' : 'badge-blue'}">${p.priority}</span></div>
      <h3>${p.title}</h3><p>${p.summary}</p>
      <div class="card-footer"><span class="badge ${p.status === 'Working v1' ? 'badge-green' : 'badge-muted'}">${p.status}</span><a class="text-link" href="${base}programs/${p.slug}/">${p.status === 'Working v1' ? 'Open program' : 'Open placeholder'} →</a></div>
    </article>`;
  }
})();
