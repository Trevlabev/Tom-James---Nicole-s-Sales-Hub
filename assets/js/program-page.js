
(function () {
  const slug = document.body.dataset.programSlug;
  const program = (window.NAH_PROGRAMS || []).find(p => p.slug === slug);
  const root = document.querySelector('[data-program-page]');
  if (!program || !root) return;
  document.title = `${program.title} | Nicole's Operations Hub`;
  root.innerHTML = `
    <div class="breadcrumbs"><a href="../../index.html">Overview</a> / <a href="../index.html">Programs</a> / ${program.title}</div>
    <section class="program-hero">
      <div class="program-hero-grid">
        <div>
          <div class="eyebrow">${program.category} • ${program.status}</div>
          <h1>${program.title}</h1>
          <p class="lead">${program.summary}</p>
          <div class="button-row">
            ${program.launchUrl ? `<a class="btn btn-primary" href="${program.launchUrl}" target="_blank" rel="noopener">Launch program</a>` : '<span class="btn btn-disabled">Launch URL not configured</span>'}
            <a class="btn btn-secondary" href="../../embed-guide.html">Configure this program</a>
          </div>
        </div>
        <aside class="card meta-stack">
          <div class="meta-row"><span>Priority</span><strong>${program.priority}</strong></div>
          <div class="meta-row"><span>Category</span><strong>${program.category}</strong></div>
          <div class="meta-row"><span>Build status</span><strong>${program.status}</strong></div>
          <div class="meta-row"><span>Embed</span><strong>${program.embedUrl ? 'Configured' : 'Not configured'}</strong></div>
        </aside>
      </div>
    </section>
    <section class="section">
      <div class="detail-grid">
        <article class="card"><h2>Why this should exist</h2><p>${program.why}</p></article>
        <article class="card"><h2>Data boundary</h2><p>${program.security}</p></article>
      </div>
    </section>
    <section class="section">
      <div class="detail-grid">
        <article class="card"><h2>Inputs</h2><ul class="check-list">${program.inputs.map(x=>`<li>${x}</li>`).join('')}</ul></article>
        <article class="card"><h2>Outputs</h2><ul class="check-list">${program.outputs.map(x=>`<li>${x}</li>`).join('')}</ul></article>
      </div>
    </section>
    <section class="section">
      <div class="section-head"><div><div class="eyebrow">Program slot</div><h2>Embedded application</h2></div><p>Set <code>embedUrl</code> in <code>assets/js/programs.js</code>. If the app host blocks iframes, use the launch URL instead.</p></div>
      <div class="embed-shell" data-embed-shell>
        ${program.embedUrl ? `<iframe class="embed-frame" title="${program.title}" src="${program.embedUrl}" loading="lazy"></iframe>` : `<div class="embed-placeholder"><div class="program-glyph" style="margin:0 auto 16px">${program.glyph}</div><h2>Program placeholder is ready</h2><p>Build this tool in its own repository or hosting project, then paste its URL into <code>embedUrl</code> or <code>launchUrl</code>.</p><div class="button-row" style="justify-content:center"><a class="btn btn-primary" href="../../embed-guide.html">Read the embed guide</a></div></div>`}
      </div>
    </section>
    <section class="section">
      <div class="section-head"><div><div class="eyebrow">Recommended v1</div><h2>Build roadmap</h2></div></div>
      <div class="steps">${program.roadmap.map(x=>`<article class="step"><div><h3>${x}</h3><p>Keep the first version narrow, testable, and easy for the replacement to learn.</p></div></article>`).join('')}</div>
    </section>`;
})();
