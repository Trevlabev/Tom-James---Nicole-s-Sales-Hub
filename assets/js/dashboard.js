(() => {
  const U = NAH_APP;

  function recordPriority(type, r) {
    const d = U.daysUntil(r.clientRequiredDate || r.etc || r.dueDate || r.shipByDate);
    if (r.location === 'Verify Location' || r.priority === 'Critical' || (d !== null && d < 0)) return 'Critical';
    if (r.priority === 'High' || (d !== null && d <= 7) || !r.nextFollowUp) return 'High';
    return 'Review';
  }

  function renderFeaturedPrograms() {
    const el = document.querySelector('[data-featured-programs]');
    if (!el || !window.NAH_PROGRAMS) return;
    const featured = window.NAH_PROGRAMS.filter(p => p.featured).slice(0, 6);
    el.innerHTML = featured.map(p => `
      <a class="program-card" href="programs/${p.slug}/">
        <div class="card-top">
          <span class="program-glyph">${p.glyph || '🧰'}</span>
          <span class="badge badge-muted">${U.escapeHtml(p.categoryLabel || p.category)}</span>
        </div>
        <h3>${U.escapeHtml(p.shortTitle || p.title)}</h3>
        <p>${U.escapeHtml(p.summary)}</p>
        <div class="card-footer">
          <span>Open Tool →</span>
        </div>
      </a>
    `).join('');
  }

  function renderTrelloStatus() {
    const ts = window.NAH_TRELLO?.getSettings?.() || {};
    const connected = window.NAH_TRELLO?.isConnected?.();
    const tb = document.querySelector('[data-trello-dashboard-badge]');
    const tc = document.querySelector('[data-trello-dashboard-copy]');
    const tl = document.querySelector('[data-trello-board-link]');

    if (tb) {
      tb.className = `badge ${connected && ts.enabled ? 'badge-green' : connected ? 'badge-amber' : 'badge-muted'}`;
      tb.textContent = connected && ts.enabled ? 'Sync Enabled' : connected ? 'Authorized' : 'Not Connected';
    }
    if (tc) {
      tc.textContent = connected
        ? (ts.boardName ? `Connected to "${ts.boardName}"${ts.syncMode === 'auto' ? ' with automatic sync.' : ' (Manual mode).'}` : 'Select and map a board in Trello Settings.')
        : 'Connect Trello to publish workspace records and track board movement.';
    }
    if (tl) {
      if (ts.boardId && ts.boardUrl) {
        tl.href = ts.boardUrl;
        tl.hidden = false;
      } else {
        tl.hidden = true;
      }
    }
  }

  function render() {
    const s = NAH_STORE.load(), st = NAH_STORE.stats(s), now = new Date();
    const greetingEl = document.querySelector('[data-greeting]');
    if (greetingEl) {
      greetingEl.textContent = `${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
    }

    const metrics = [
      ['Active Alterations', st.activeAlt, st.criticalAlt ? `${st.criticalAlt} critical risk` : 'All alterations on track', st.criticalAlt ? 'is-risk' : 'is-good'],
      ['WIP Orders at Risk', st.riskOrders, st.riskOrders ? 'Review WIP & Watch List' : 'No factory delays logged', st.riskOrders ? 'is-warning' : 'is-good'],
      ['Inventory Check-In', st.inventoryNeeds, st.inventoryNeeds ? 'Needs location assignment' : 'All arrivals tagged & racked', st.inventoryNeeds ? 'is-warning' : 'is-good'],
      ['Open Deliveries', st.shippingOpen, st.shippingOpen ? 'Pending client shipping' : 'No open shipments', '']
    ];

    const metricsEl = document.querySelector('[data-dashboard-metrics]');
    if (metricsEl) {
      metricsEl.innerHTML = metrics.map(([l, v, d, c]) => `
        <div class="metric-card ${c}">
          <div class="metric-label">${l}</div>
          <div class="metric-value">${v}</div>
          <div class="metric-detail">${d}</div>
        </div>
      `).join('');
    }

    const issues = [];
    Object.entries(s.records).forEach(([type, rows]) => rows.forEach(r => {
      const p = recordPriority(type, r);
      if (p !== 'Review' && !r.complete) issues.push({ type, p, r });
    }));

    const weight = { Critical: 0, High: 1 };
    issues.sort((a, b) => (weight[a.p] ?? 3) - (weight[b.p] ?? 3));

    const riskQueueEl = document.querySelector('[data-risk-queue]');
    if (riskQueueEl) {
      riskQueueEl.innerHTML = issues.length ? issues.slice(0, 6).map(x => `
        <div class="queue-item">
          <div style="display:flex; justify-content:space-between; align-items:start; gap:8px;">
            <strong>${U.escapeHtml(x.r.client || x.r.title || x.r.name || 'Open Record')} — ${U.escapeHtml(x.r.garment || x.r.order || x.type)}</strong>
            ${U.priorityBadge(x.p)}
          </div>
          <small>
            👉 ${U.escapeHtml(x.r.nextAction || x.r.status || 'Review record')}
            ${x.r.nextFollowUp ? `• Follow up ${U.formatDate(x.r.nextFollowUp)}` : ''}
          </small>
        </div>
      `).join('') : `
        <div class="callout success" style="background:var(--green-soft); border-color:#a7f3d0; padding:16px; border-radius:12px;">
          <strong style="color:var(--green-dark);">🎉 Workspace is clear! No critical risks logged.</strong>
          <p style="margin-top:4px; font-size:.85rem; color:var(--muted);">Click "Load Sample Office Workspace" above to test all features with demo records.</p>
        </div>
      `;
    }

    const activityEl = document.querySelector('[data-activity]');
    if (activityEl) {
      activityEl.innerHTML = s.activity.length ? s.activity.slice(0, 6).map(a => `
        <div class="activity-item">
          <span class="activity-dot"></span>
          <div>
            <strong>${U.escapeHtml(a.message)}</strong><br>
            <small style="color:var(--muted);">${U.escapeHtml(a.type)}</small>
          </div>
          <time>${new Date(a.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time>
        </div>
      `).join('') : '<div class="empty-state">No recent activity logged yet.</div>';
    }

    const countEl = document.querySelector('[data-workspace-count]');
    if (countEl) countEl.textContent = st.total;
    const taskEl = document.querySelector('[data-open-task-count]');
    if (taskEl) taskEl.textContent = st.tasksOpen;

    renderFeaturedPrograms();
    renderTrelloStatus();
  }

  // Bind glossary button
  document.querySelector('[data-glossary-btn]')?.addEventListener('click', () => {
    U.showGlossaryModal();
  });

  // Bind load demo workspace button
  document.querySelector('[data-load-demo]')?.addEventListener('click', () => {
    const today = U.todayIso(), plus = n => {
      const d = new Date(`${today}T12:00:00`);
      d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    };

    const currentSettings = NAH_STORE.load().settings;
    const s = NAH_STORE.empty();
    s.settings = currentSettings; // Preserve user's Trello and office settings!

    s.records.alterations = [
      { id: 'demo-a1', client: 'Jordan Ellis', order: '306-0248101', cof: '248101', garment: 'Navy suit coat', provider: 'Gegi', serviceType: 'Local alteration', transferDate: plus(-8), etc: plus(1), clientRequiredDate: plus(3), status: 'At Provider', location: 'At Gegi', nextFollowUp: today, nextAction: 'Confirm ETC and pickup' },
      { id: 'demo-a2', client: 'Morgan Lee', order: '306-0248120', cof: '248120', garment: 'Custom Trousers', provider: 'EA / English American', serviceType: 'Factory alteration', transferDate: plus(-14), etc: plus(-1), clientRequiredDate: plus(4), status: 'Reported Complete', location: 'At Factory', nextFollowUp: today, nextAction: 'Obtain tracking number' }
    ];
    s.records.orders = [
      { id: 'demo-o1', client: 'Avery Mason', order: '306-0248200', garment: 'Sport coat (Blue Pencil)', stage: 'Pattern Cut', dueDate: plus(-2), clientRequiredDate: plus(6), priority: 'High', nextFollowUp: today, nextAction: 'Request revised factory ETA' }
    ];
    s.records.inventory = [
      { id: 'demo-i1', client: 'Taylor Reed', order: '306-0248191', cof: '248191', garment: '2 Custom Shirts', receivedDate: plus(-4), completeness: 'Complete Order', location: 'Main Rack', nextAction: 'Schedule fitting appointment', nextFollowUp: plus(1) }
    ];
    s.records.shipments = [
      { id: 'demo-s1', client: 'Casey Holt', contents: 'Completed Alteration - Sport Coat', shipByDate: today, status: 'Ready to Process', physicalStage: true, tracking: '', nextAction: 'Generate shipping label' }
    ];
    s.activity = [
      { id: 'act-demo', type: 'workspace', message: 'Demonstration office workspace populated', at: new Date().toISOString() }
    ];

    NAH_STORE.save(s);
    U.toast('Sample office records loaded successfully!', 'success');
    render();
  });

  window.addEventListener('nah:workspace-change', render);
  window.addEventListener('nah:trello-auth-change', render);
  render();
})();
