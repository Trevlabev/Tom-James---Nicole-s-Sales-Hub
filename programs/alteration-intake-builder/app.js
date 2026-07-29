(() => {
  const U = window.NAH_APP;
  const form = U.$('#alteration-form');
  const output = U.$('#alteration-output');
  const validation = U.$('#validation-list');
  const instructionCount = U.$('#instruction-count');
  const fileInput = U.$('#intake-import');
  let currentRecord = null;

  const required = ['client', 'salesProfessional', 'garment', 'instructions', 'provider', 'currentLocation'];

  function normalize(data) {
    return {
      schema: 'nicole-ops.alteration-intake.v1',
      id: data.id || U.uid('alt'),
      createdAt: data.createdAt || new Date().toISOString(),
      client: String(data.client || '').trim(),
      salesProfessional: String(data.salesProfessional || '').trim(),
      order: String(data.order || '').trim(),
      cof: String(data.cof || '').trim(),
      itemId: String(data.itemId || '').trim(),
      garment: String(data.garment || '').trim(),
      quantity: Number(data.quantity || 1),
      cloth: String(data.cloth || '').trim(),
      serviceType: String(data.serviceType || '').trim(),
      provider: String(data.provider || '').trim(),
      currentLocation: String(data.currentLocation || '').trim(),
      clientRequiredDate: String(data.clientRequiredDate || '').trim(),
      etc: String(data.etc || '').trim(),
      status: String(data.status || 'Intake').trim(),
      instructions: String(data.instructions || '').trim(),
      notes: String(data.notes || '').trim(),
      photos: {
        wholeGarment: Boolean(data.wholeGarment),
        orderLabel: Boolean(data.orderLabel),
        writtenNotes: Boolean(data.writtenNotes),
        closeups: Boolean(data.closeups),
        garmentSeparated: Boolean(data.garmentSeparated)
      }
    };
  }

  function validate(record) {
    const issues = [];
    required.forEach(key => {
      if (!record[key]) issues.push(`${labelFor(key)} is required.`);
    });
    if (!record.cof && !record.order && !record.itemId) issues.push('Add at least one strong identifier: COF, order number, or item/line ID.');
    if (!record.clientRequiredDate && !record.etc) issues.push('Add a client-required date or provider ETC, or explicitly document that the date is unknown.');
    if (!record.photos.wholeGarment) issues.push('Whole-garment photo is not confirmed.');
    if (!record.photos.writtenNotes && !record.photos.closeups) issues.push('No instruction close-up or written-note photo is confirmed.');
    if (record.instructions.length < 5) issues.push('Alteration instructions appear too short to be actionable.');
    return issues;
  }

  function labelFor(key) {
    return ({ client: 'Client', salesProfessional: 'Sales Professional', garment: 'Garment', instructions: 'Instructions', provider: 'Provider', currentLocation: 'Current location' })[key] || key;
  }

  function title(record) {
    const date = record.etc || record.clientRequiredDate;
    const suffix = record.cof ? ` — COF ${record.cof}` : record.order ? ` — Order ${record.order}` : '';
    return `${record.client || 'Client'} — ${record.garment || 'Garment'} — ${record.provider || 'Provider'}${date ? ` — ETC ${U.formatDate(date)}` : ''}${suffix}`;
  }

  function trello(record) {
    const photoList = Object.entries(record.photos).filter(([, v]) => v).map(([k]) => ({
      wholeGarment: 'Whole garment', orderLabel: 'Order/COF label', writtenNotes: 'Written notes/pins', closeups: 'Instruction close-ups', garmentSeparated: 'Similar garments separately identified'
    })[k]);
    return [
      `CLIENT: ${record.client}`,
      `SALES PROFESSIONAL: ${record.salesProfessional}`,
      `ORDER / COF / ITEM: ${record.order || '—'} / ${record.cof || '—'} / ${record.itemId || '—'}`,
      `GARMENT: ${record.quantity} × ${record.garment}${record.cloth ? ` | ${record.cloth}` : ''}`,
      `SERVICE: ${record.serviceType || 'Alteration'} | PROVIDER: ${record.provider}`,
      `STATUS / LOCATION: ${record.status} | ${record.currentLocation}`,
      `CLIENT-REQUIRED DATE: ${record.clientRequiredDate ? U.formatDate(record.clientRequiredDate) : 'Needs date'}`,
      `PROVIDER ETC: ${record.etc ? U.formatDate(record.etc) : 'Needs date'}`,
      '',
      'INSTRUCTIONS',
      record.instructions,
      '',
      `PHOTOS CONFIRMED: ${photoList.length ? photoList.join('; ') : 'None confirmed'}`,
      `NOTES: ${record.notes || '—'}`,
      '',
      'NEXT ACTION: Confirm provider receipt, ETC, and physical custody after transfer.',
      `CREATED: ${new Date(record.createdAt).toLocaleString()}`
    ].join('\n');
  }

  function handoff(record) {
    return [
      'ALTERATION HANDOFF',
      `Client: ${record.client}`,
      `Sales Professional: ${record.salesProfessional}`,
      `Garment: ${record.quantity} × ${record.garment}`,
      `Order / COF / Item: ${record.order || '—'} / ${record.cof || '—'} / ${record.itemId || '—'}`,
      `Provider: ${record.provider}`,
      `Physical location: ${record.currentLocation}`,
      `Client-required: ${record.clientRequiredDate ? U.formatDate(record.clientRequiredDate) : 'Unknown'}`,
      `ETC: ${record.etc ? U.formatDate(record.etc) : 'Needs date'}`,
      '',
      'Exact instructions:',
      record.instructions,
      '',
      `Notes: ${record.notes || 'None'}`,
      '',
      'Before garment leaves office:',
      '☐ Garment and ticket match',
      '☐ All pieces counted',
      '☐ Photos attached to correct record',
      '☐ Provider / destination confirmed',
      '☐ Transfer date and custody updated',
      '☐ ETC or follow-up date assigned'
    ].join('\n');
  }

  function csvRow(record) {
    return U.toCsv([{
      client: record.client,
      salesProfessional: record.salesProfessional,
      order: record.order,
      cof: record.cof,
      itemId: record.itemId,
      garment: record.garment,
      quantity: record.quantity,
      cloth: record.cloth,
      serviceType: record.serviceType,
      provider: record.provider,
      status: record.status,
      currentLocation: record.currentLocation,
      clientRequiredDate: record.clientRequiredDate,
      etc: record.etc,
      instructions: record.instructions,
      notes: record.notes,
      createdAt: record.createdAt
    }], [
      { key: 'client', label: 'Client' }, { key: 'salesProfessional', label: 'Sales Professional' },
      { key: 'order', label: 'Order' }, { key: 'cof', label: 'COF' }, { key: 'itemId', label: 'Item ID' },
      { key: 'garment', label: 'Garment' }, { key: 'quantity', label: 'Quantity' }, { key: 'cloth', label: 'Cloth' },
      { key: 'serviceType', label: 'Service Type' }, { key: 'provider', label: 'Provider' },
      { key: 'status', label: 'Status' }, { key: 'currentLocation', label: 'Physical Location' },
      { key: 'clientRequiredDate', label: 'Client Required Date' }, { key: 'etc', label: 'ETC' },
      { key: 'instructions', label: 'Instructions' }, { key: 'notes', label: 'Notes' }, { key: 'createdAt', label: 'Created At' }
    ]);
  }

  function filenameSuggestions(record) {
    const base = [record.client, record.cof || record.order || record.itemId, record.garment].filter(Boolean).map(U.slugify).join('_');
    return [
      `${base || 'alteration'}_01_whole-garment.jpg`,
      `${base || 'alteration'}_02_order-label.jpg`,
      `${base || 'alteration'}_03_instructions.jpg`,
      `${base || 'alteration'}_04_detail.jpg`
    ].join('\n');
  }

  function render(record, issues) {
    validation.innerHTML = issues.length
      ? issues.map(x => `<li>${U.escapeHtml(x)}</li>`).join('')
      : '<li class="ok">Record passes the current required-field and evidence checks.</li>';
    output.innerHTML = `
      <div class="output-block">
        <div class="output-label"><strong>Trello card title</strong><button class="btn btn-secondary btn-small" type="button" data-copy="title">Copy</button></div>
        <div class="output-text" data-output="title">${U.escapeHtml(title(record))}</div>
      </div>
      <div class="output-block">
        <div class="output-label"><strong>Trello description</strong><button class="btn btn-secondary btn-small" type="button" data-copy="trello">Copy</button></div>
        <div class="output-text" data-output="trello">${U.escapeHtml(trello(record))}</div>
      </div>
      <div class="output-block">
        <div class="output-label"><strong>Provider handoff</strong><button class="btn btn-secondary btn-small" type="button" data-copy="handoff">Copy</button></div>
        <div class="output-text" data-output="handoff">${U.escapeHtml(handoff(record))}</div>
      </div>
      <div class="output-block">
        <div class="output-label"><strong>Photo filename suggestions</strong><button class="btn btn-secondary btn-small" type="button" data-copy="filenames">Copy</button></div>
        <div class="output-text" data-output="filenames">${U.escapeHtml(filenameSuggestions(record))}</div>
      </div>`;
    output.querySelectorAll('[data-copy]').forEach(button => {
      button.addEventListener('click', () => {
        const value = output.querySelector(`[data-output="${button.dataset.copy}"]`).textContent;
        U.copyText(value, 'Copied to clipboard');
      });
    });
  }

  function generate() {
    const data = U.formToObject(form);
    currentRecord = normalize(data);
    const issues = validate(currentRecord);
    render(currentRecord, issues);
    U.$('#export-json').disabled = false;
    U.$('#export-csv').disabled = false;
    U.$('#print-packet').disabled = false;
    U.toast(issues.length ? `${issues.length} issue${issues.length === 1 ? '' : 's'} need attention` : 'Alteration packet generated', issues.length ? 'info' : 'success');
  }

  form.addEventListener('submit', event => { event.preventDefault(); generate(); });
  U.$('#instructions').addEventListener('input', event => { instructionCount.textContent = `${event.target.value.length} characters`; });
  U.$('#reset-form').addEventListener('click', () => {
    form.reset();
    U.$('#quantity').value = 1;
    U.$('#salesProfessional').value = 'Nicole Arbogast';
    U.$('#status').value = 'Intake';
    instructionCount.textContent = '0 characters';
    output.innerHTML = '<div class="app-empty">Complete the intake form and generate the packet.</div>';
    validation.innerHTML = '<li>Validation results will appear after generation.</li>';
    currentRecord = null;
    ['#export-json', '#export-csv', '#print-packet'].forEach(id => U.$(id).disabled = true);
  });
  U.$('#export-json').addEventListener('click', () => currentRecord && U.downloadJson(`${U.slugify(currentRecord.client)}-alteration-intake.json`, currentRecord));
  U.$('#export-csv').addEventListener('click', () => currentRecord && U.downloadText(`${U.slugify(currentRecord.client)}-alteration-intake.csv`, csvRow(currentRecord), 'text/csv;charset=utf-8'));
  U.$('#print-packet').addEventListener('click', () => currentRecord && window.print());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await U.readFileText(file));
      const values = { ...parsed, ...(parsed.photos || {}) };
      U.setFormValues(form, values);
      U.$('#instructions').dispatchEvent(new Event('input'));
      generate();
      U.toast('Alteration record imported', 'success');
    } catch (error) {
      U.toast(`Import failed: ${error.message}`, 'error');
    } finally { fileInput.value = ''; }
  });

  U.$('#salesProfessional').value = 'Nicole Arbogast';
  U.$('#quantity').value = 1;
  U.$('#status').value = 'Intake';
})();
