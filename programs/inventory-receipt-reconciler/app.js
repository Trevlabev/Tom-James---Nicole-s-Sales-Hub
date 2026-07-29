(() => {
  const U = window.NAH_APP;
  const tableBody = U.$('#inventory-body');
  const empty = U.$('#inventory-empty');
  const fileInput = U.$('#inventory-import');
  const filter = U.$('#inventory-filter');
  let rows = [];

  const fields = [
    'type', 'client', 'salesProfessional', 'order', 'cof', 'garment', 'expectedQty', 'receivedQty',
    'condition', 'completeness', 'location', 'nextAction', 'notes'
  ];

  const aliases = {
    type: ['workflow type', 'item type'], client: ['client name'], salesProfessional: ['sp', 'sales professional'],
    order: ['order number'], cof: ['cof line', 'cof/ticket'], garment: ['item', 'garment/item'],
    expectedQty: ['expected', 'quantity expected', 'qty expected'], receivedQty: ['received', 'quantity received', 'qty received'],
    condition: ['damage', 'item condition'], completeness: ['complete order', 'order completeness'],
    location: ['physical location', 'rack', 'shelf'], nextAction: ['action', 'suggested action'], notes: ['assistant notes']
  };

  function newRow(overrides = {}) {
    return {
      id: U.uid('receipt'), type: 'New order', client: '', salesProfessional: 'Nicole Arbogast', order: '', cof: '', garment: '',
      expectedQty: 1, receivedQty: 1, condition: 'Good', completeness: 'Unknown Completeness', location: 'Receiving Rack',
      nextAction: 'Verify and place', notes: '', ...overrides
    };
  }

  function discrepancy(row) {
    const expected = Number(row.expectedQty || 0);
    const received = Number(row.receivedQty || 0);
    const issues = [];
    if (!row.client && !['Office material', 'Fabric / swatch'].includes(row.type)) issues.push('Missing client');
    if (!row.order && !row.cof && !['Office material', 'Fabric / swatch'].includes(row.type)) issues.push('Missing identifier');
    if (!row.garment) issues.push('Missing item');
    if (expected !== received) issues.push(`${received < expected ? 'Missing' : 'Extra'} quantity`);
    if (row.condition !== 'Good') issues.push(row.condition);
    if (!row.location || row.location === 'Receiving Rack') issues.push('Not placed');
    if (!row.nextAction) issues.push('No next action');
    return issues;
  }

  function priority(row) {
    const issues = discrepancy(row);
    if (issues.some(x => /Missing quantity|Wrong item|Damaged|Unknown client|Not placed/.test(x))) return 'Critical';
    if (issues.length) return 'High';
    return 'Complete';
  }

  function cellSelect(row, key, options) {
    return `<select data-id="${row.id}" data-key="${key}">${options.map(x => `<option${row[key] === x ? ' selected' : ''}>${U.escapeHtml(x)}</option>`).join('')}</select>`;
  }

  function cellInput(row, key, type = 'text', min = '') {
    return `<input data-id="${row.id}" data-key="${key}" type="${type}" value="${U.escapeHtml(row[key])}"${min !== '' ? ` min="${min}"` : ''}>`;
  }

  function render() {
    const selected = filter.value;
    const visible = rows.filter(row => !selected || priority(row) === selected || row.type === selected);
    empty.hidden = visible.length > 0;
    tableBody.innerHTML = visible.map(row => {
      const issues = discrepancy(row);
      const p = priority(row);
      return `<tr>
        <td>${cellSelect(row, 'type', ['New order', 'Completed alteration', 'Client return', 'Exchange', 'Fabric / swatch', 'Office material'])}</td>
        <td>${cellInput(row, 'client')}<br><small>${cellInput(row, 'salesProfessional')}</small></td>
        <td>${cellInput(row, 'order')}<br><small>${cellInput(row, 'cof')}</small></td>
        <td>${cellInput(row, 'garment')}</td>
        <td>${cellInput(row, 'expectedQty', 'number', 0)}</td>
        <td>${cellInput(row, 'receivedQty', 'number', 0)}</td>
        <td>${cellSelect(row, 'condition', ['Good', 'Damaged', 'Wrong item', 'Unknown client', 'Needs inspection'])}</td>
        <td>${cellSelect(row, 'completeness', ['Complete Order', 'Partial Order', 'Unknown Completeness', 'Not applicable'])}</td>
        <td>${cellSelect(row, 'location', ['Receiving Rack', 'Main Rack', 'Shelf / Bin', 'Alteration Intake', 'Factory Return Area', 'Next-Day Staging', 'Shipping Rack', 'With Nicole', 'Verify Location'])}</td>
        <td>${cellInput(row, 'nextAction')}</td>
        <td><span class="status-pill status-${p.toLowerCase()}">${p}</span><br><small>${U.escapeHtml(issues.join('; ') || 'Matched')}</small></td>
        <td><div class="row-actions"><button class="btn btn-secondary btn-small" type="button" data-duplicate="${row.id}">Duplicate</button><button class="btn btn-danger btn-small" type="button" data-delete="${row.id}">Remove</button></div></td>
      </tr>`;
    }).join('');
    updateSummary();
  }

  function updateSummary() {
    const matched = rows.filter(row => priority(row) === 'Complete').length;
    const discrep = rows.filter(row => priority(row) !== 'Complete').length;
    const notPlaced = rows.filter(row => !row.location || row.location === 'Receiving Rack' || row.location === 'Verify Location').length;
    U.$('#metric-lines').textContent = rows.length;
    U.$('#metric-matched').textContent = matched;
    U.$('#metric-discrepancies').textContent = discrep;
    U.$('#metric-unplaced').textContent = notPlaced;
    U.$('#export-inventory').disabled = rows.length === 0;
    U.$('#export-discrepancy').disabled = rows.length === 0;
    U.$('#export-inventory-json').disabled = rows.length === 0;
  }

  function updateRow(id, key, value) {
    const row = rows.find(x => x.id === id);
    if (!row) return;
    row[key] = ['expectedQty', 'receivedQty'].includes(key) ? Number(value || 0) : value;
    render();
  }

  tableBody.addEventListener('change', event => {
    const input = event.target.closest('[data-id][data-key]');
    if (!input) return;
    updateRow(input.dataset.id, input.dataset.key, input.value);
  });
  tableBody.addEventListener('click', event => {
    const del = event.target.closest('[data-delete]');
    if (del) { rows = rows.filter(row => row.id !== del.dataset.delete); render(); return; }
    const dup = event.target.closest('[data-duplicate]');
    if (dup) {
      const source = rows.find(row => row.id === dup.dataset.duplicate);
      if (source) rows.push(newRow({ ...source, id: U.uid('receipt') }));
      render();
    }
  });

  U.$('#add-inventory-row').addEventListener('click', () => { rows.push(newRow()); render(); });
  U.$('#clear-inventory').addEventListener('click', () => {
    if (rows.length && !confirm('Clear all current receipt rows? Export first if needed.')) return;
    rows = []; render();
  });
  filter.addEventListener('change', render);

  U.$('#download-template').addEventListener('click', () => {
    const template = U.toCsv([newRow({ id: undefined })], fields.map(key => ({ key, label: key })));
    U.downloadText('inventory-receipt-template.csv', template, 'text/csv;charset=utf-8');
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const text = await U.readFileText(file);
      const imported = U.parseCsv(text).map(raw => {
        const mapped = U.mapCsvRow(raw, aliases);
        return newRow({
          ...mapped,
          expectedQty: Number(mapped.expectedQty || 1),
          receivedQty: Number(mapped.receivedQty || 0),
          salesProfessional: mapped.salesProfessional || 'Nicole Arbogast',
          condition: mapped.condition || 'Good',
          completeness: mapped.completeness || 'Unknown Completeness',
          location: mapped.location || 'Receiving Rack',
          nextAction: mapped.nextAction || 'Verify and place'
        });
      });
      rows.push(...imported);
      render();
      U.toast(`${imported.length} receipt line${imported.length === 1 ? '' : 's'} imported`, 'success');
    } catch (error) { U.toast(`Import failed: ${error.message}`, 'error'); }
    finally { fileInput.value = ''; }
  });

  const headers = fields.map(key => ({ key, label: key }));
  U.$('#export-inventory').addEventListener('click', () => U.downloadText('inventory-receipt-reconciliation.csv', U.toCsv(rows.map(row => ({ ...row, issues: discrepancy(row).join('; '), priority: priority(row) })), [...headers, { key: 'issues', label: 'issues' }, { key: 'priority', label: 'priority' }]), 'text/csv;charset=utf-8'));
  U.$('#export-discrepancy').addEventListener('click', () => {
    const issues = rows.filter(row => priority(row) !== 'Complete').map(row => ({ ...row, issues: discrepancy(row).join('; '), priority: priority(row) }));
    U.downloadText('inventory-discrepancy-report.csv', U.toCsv(issues, [...headers, { key: 'issues', label: 'issues' }, { key: 'priority', label: 'priority' }]), 'text/csv;charset=utf-8');
  });
  U.$('#export-inventory-json').addEventListener('click', () => U.downloadJson('inventory-receipt-reconciliation.json', { schema: 'nicole-ops.inventory-receipt.v1', createdAt: new Date().toISOString(), rows }));
  U.$('#print-inventory').addEventListener('click', () => window.print());

  rows = [newRow()];
  render();
})();
