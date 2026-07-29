(() => {
  const U = window.NAH_APP;
  const form = U.$('#return-form');
  const instructionInput = U.$('#return-instructions');
  const meter = U.$('#return-char-count');
  const segmentsRoot = U.$('#instruction-segments');
  const stepsRoot = U.$('#factory-steps');
  const outputRoot = U.$('#return-output');
  const importInput = U.$('#return-import');
  let current = null;

  const replacements = [
    [/finish functional buttonholes/gi, 'FFBH'],
    [/functional buttonholes/gi, 'FFBH'],
    [/half girth/gi, 'HG'],
    [/half back/gi, 'HB'],
    [/point to point/gi, 'PTP'],
    [/sport coat/gi, 'SC'],
    [/coat and pant/gi, 'CP'],
    [/as much as possible/gi, 'AMAP'],
    [/inches/gi, 'in'],
    [/inch/gi, 'in']
  ];

  function abbreviate(text) {
    return replacements.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text.trim());
  }

  function splitSegments(text, max = 50) {
    const clean = abbreviate(text).replace(/\s+/g, ' ').trim();
    if (!clean) return [];
    const words = clean.split(' ');
    const out = [];
    let line = '';
    for (const word of words) {
      if (word.length > max) {
        if (line) { out.push(line); line = ''; }
        for (let i = 0; i < word.length; i += max) out.push(word.slice(i, i + max));
        continue;
      }
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length <= max) line = candidate;
      else { out.push(line); line = word; }
    }
    if (line) out.push(line);
    return out;
  }

  function renderSegments() {
    const text = instructionInput.value;
    const segments = splitSegments(text);
    meter.textContent = `${text.length} source characters • ${segments.length} field${segments.length === 1 ? '' : 's'}`;
    meter.classList.toggle('over', segments.length > 4);
    segmentsRoot.innerHTML = segments.length
      ? segments.map(segment => `<div class="segment"><code>${U.escapeHtml(segment)}</code><span class="status-pill ${segment.length > 50 ? 'status-critical' : 'status-complete'}">${segment.length}/50</span></div>`).join('')
      : '<div class="app-empty">Instruction segments will appear here.</div>';
  }

  function getData() {
    const data = U.formToObject(form);
    return {
      schema: 'nicole-ops.factory-return.v1',
      id: data.id || U.uid('return'),
      createdAt: data.createdAt || new Date().toISOString(),
      factory: String(data.factory || '').trim(),
      client: String(data.client || '').trim(),
      salesProfessional: String(data.salesProfessional || '').trim(),
      order: String(data.order || '').trim(),
      cof: String(data.cof || '').trim(),
      itemId: String(data.itemId || '').trim(),
      garment: String(data.garment || '').trim(),
      returnType: String(data.returnType || '').trim(),
      returnReason: String(data.returnReason || '').trim(),
      authorizedBy: String(data.authorizedBy || '').trim(),
      destination: String(data.destination || '').trim(),
      clientRequiredDate: String(data.clientRequiredDate || '').trim(),
      enteredDate: String(data.enteredDate || U.todayIso()).trim(),
      returnNumber: String(data.returnNumber || '').trim(),
      trackingNumber: String(data.trackingNumber || '').trim(),
      instructions: instructionInput.value.trim(),
      instructionSegments: splitSegments(instructionInput.value),
      nextBusinessDayCheck: String(data.nextBusinessDayCheck || U.nextBusinessDay(data.enteredDate || U.todayIso())).trim(),
      stagedLocation: String(data.stagedLocation || '').trim(),
      notes: String(data.notes || '').trim()
    };
  }

  function validate(record) {
    const issues = [];
    ['factory', 'client', 'salesProfessional', 'cof', 'garment', 'returnType', 'returnReason', 'authorizedBy', 'destination', 'instructions'].forEach(key => {
      if (!record[key]) issues.push(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} is required.`);
    });
    if (record.instructionSegments.length > 4) issues.push('Instructions require more than four 50-character fields; add a clear printed attachment rather than over-compressing them.');
    if (!record.returnNumber) issues.push('Return number is not yet recorded. Keep the item in an entry/verification status until it is available.');
    if (!record.stagedLocation) issues.push('Physical staging location is missing.');
    return issues;
  }

  function steps(record) {
    const oneAtATime = /EA|English American|Oxxford/i.test(record.factory);
    const shirts = /shirt/i.test(record.garment);
    const behavior = oneAtATime
      ? 'Process each garment separately unless the current Secure Site behavior has been re-confirmed otherwise.'
      : shirts ? 'Multiple shirts may be selectable together if the current Secure Site permits it; verify before submission.'
        : 'Confirm current factory-specific selection behavior before processing multiple garments.';
    return [
      'Search the client in Contact Control and confirm the correct Sales Professional.',
      'Open Orders, select the correct COF, and verify the physical garment matches the record.',
      'If the garment is not checked in, complete Check-in before selecting Return.',
      `Select the exact garment. ${behavior}`,
      `Confirm Return To is ${record.destination || record.factory || 'the approved destination'}.`,
      `Choose the current approved return type and reason. Do not rely on a legacy reason code without confirming it fits the actual transaction.`,
      `Enter the alteration directions using the generated 50-character segments. Attach a printed continuation when necessary.`,
      'Save the return. Do not ignore an error unless the exact harmless warning has been confirmed locally; escalate any different failure.',
      'Print the return document, attach it to the correct garment, and stage it in the designated factory-return area.',
      `Record the return number, destination, entry date, staging location, and next follow-up in Trello and Excel. Verify upload/receipt on ${U.formatDate(record.nextBusinessDayCheck)}.`
    ];
  }

  function inquiry(record) {
    return [
      'FACTORY RETURN STATUS INQUIRY',
      'Store: 306',
      `Client: ${record.client}`,
      `Sales Professional: ${record.salesProfessional}`,
      `Return number: ${record.returnNumber || 'Pending'}`,
      `Order / COF / Item: ${record.order || '—'} / ${record.cof || '—'} / ${record.itemId || '—'}`,
      `Garment: ${record.garment}`,
      `Factory / destination: ${record.factory} / ${record.destination}`,
      `Entered: ${U.formatDate(record.enteredDate)}`,
      `Client-required date: ${record.clientRequiredDate ? U.formatDate(record.clientRequiredDate) : 'Unknown'}`,
      '',
      'Please confirm:',
      '• Factory receipt',
      '• Current status / remarks',
      '• Expected completion',
      '• Return tracking when available'
    ].join('\n');
  }

  function stagingLabel(record) {
    return [
      'FACTORY RETURN — STORE 306',
      `DESTINATION: ${record.destination || record.factory}`,
      `CLIENT: ${record.client}`,
      `SP: ${record.salesProfessional}`,
      `GARMENT: ${record.garment}`,
      `ORDER / COF: ${record.order || '—'} / ${record.cof}`,
      `RETURN #: ${record.returnNumber || 'PENDING'}`,
      `ENTERED: ${U.formatDate(record.enteredDate)}`,
      `VERIFY: ${U.formatDate(record.nextBusinessDayCheck)}`,
      `STAGING: ${record.stagedLocation || 'ASSIGN LOCATION'}`
    ].join('\n');
  }

  function render(record, issues) {
    U.$('#return-validation').innerHTML = issues.length
      ? issues.map(x => `<li>${U.escapeHtml(x)}</li>`).join('')
      : '<li class="ok">Return record passes the current completion checks.</li>';
    stepsRoot.innerHTML = steps(record).map(step => `<div class="step-row"><p>${U.escapeHtml(step)}</p></div>`).join('');
    outputRoot.innerHTML = `
      <div class="output-block"><div class="output-label"><strong>Internal status inquiry</strong><button class="btn btn-secondary btn-small" data-copy="inquiry" type="button">Copy</button></div><div class="output-text" data-output="inquiry">${U.escapeHtml(inquiry(record))}</div></div>
      <div class="output-block"><div class="output-label"><strong>Physical staging label</strong><button class="btn btn-secondary btn-small" data-copy="label" type="button">Copy</button></div><div class="output-text" data-output="label">${U.escapeHtml(stagingLabel(record))}</div></div>`;
    outputRoot.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', () => {
      U.copyText(outputRoot.querySelector(`[data-output="${button.dataset.copy}"]`).textContent, 'Copied');
    }));
  }

  function generate() {
    current = getData();
    render(current, validate(current));
    ['#return-json', '#return-print'].forEach(id => U.$(id).disabled = false);
    U.toast('Factory return helper generated', 'success');
  }

  instructionInput.addEventListener('input', renderSegments);
  U.$('#enteredDate').addEventListener('change', event => {
    U.$('#nextBusinessDayCheck').value = U.nextBusinessDay(event.target.value || U.todayIso());
  });
  form.addEventListener('submit', event => { event.preventDefault(); generate(); });
  U.$('#abbreviate').addEventListener('click', () => {
    instructionInput.value = abbreviate(instructionInput.value);
    renderSegments();
    U.toast('Known garment terms abbreviated', 'success');
  });
  U.$('#copy-segments').addEventListener('click', () => U.copyText(splitSegments(instructionInput.value).join('\n'), 'Instruction segments copied'));
  U.$('#return-json').addEventListener('click', () => current && U.downloadJson(`${U.slugify(current.client)}-factory-return.json`, current));
  U.$('#return-print').addEventListener('click', () => current && window.print());
  U.$('#return-reset').addEventListener('click', () => {
    form.reset();
    U.$('#salesProfessional').value = 'Nicole Arbogast';
    U.$('#enteredDate').value = U.todayIso();
    U.$('#nextBusinessDayCheck').value = U.nextBusinessDay();
    renderSegments();
    outputRoot.innerHTML = '<div class="app-empty">Generate the helper to create the inquiry and staging label.</div>';
    stepsRoot.innerHTML = '<div class="app-empty">Factory-specific steps will appear here.</div>';
    U.$('#return-validation').innerHTML = '<li>Validation results will appear after generation.</li>';
    current = null;
    ['#return-json', '#return-print'].forEach(id => U.$(id).disabled = true);
  });
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await U.readFileText(file));
      U.setFormValues(form, data);
      instructionInput.value = data.instructions || '';
      renderSegments();
      generate();
      U.toast('Return record imported', 'success');
    } catch (error) { U.toast(`Import failed: ${error.message}`, 'error'); }
    finally { importInput.value = ''; }
  });

  U.$('#salesProfessional').value = 'Nicole Arbogast';
  U.$('#enteredDate').value = U.todayIso();
  U.$('#nextBusinessDayCheck').value = U.nextBusinessDay();
  renderSegments();
})();
