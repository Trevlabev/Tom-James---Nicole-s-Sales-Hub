(() => {
  const U = window.NAH_APP;
  const tbody = U.$('#wip-body');
  const empty = U.$('#wip-empty');
  const filter = U.$('#wip-filter');
  const fileInput = U.$('#wip-import');
  let rows = [];

  const fields = ['client','order','cof','garment','stage','stageDate','standardDue','clientRequired','exception','source','trelloStatus','excelStatus','factoryResponse','nextFollowUp'];
  const aliases = {
    client:['client name'], order:['order number'], cof:['cof line','cof/ticket'], garment:['item','garment/item'],
    stage:['milestone','wip stage'], stageDate:['stage date','status date'], standardDue:['due','due date','standard due date'],
    clientRequired:['client required date','event date','client deadline'], exception:['reason','watch reason','delay'], source:['status source'],
    trelloStatus:['trello','trello status'], excelStatus:['excel','excel status'], factoryResponse:['response','factory remarks'],
    nextFollowUp:['follow up','next follow-up','next follow up']
  };

  function newRow(overrides={}) {
    return { id:U.uid('wip'), client:'', order:'', cof:'', garment:'', stage:'Booked', stageDate:U.todayIso(), standardDue:'', clientRequired:'', exception:'', source:'Secure Site / WIP', trelloStatus:'', excelStatus:'', factoryResponse:'', nextFollowUp:'', ...overrides };
  }

  function stageAge(row) { return U.daysBetween(row.stageDate); }
  function dueDays(row) {
    const values = [row.clientRequired, row.standardDue].filter(Boolean).map(v => U.daysUntil(v)).filter(v => v !== null);
    return values.length ? Math.min(...values) : null;
  }
  function mismatch(row) { return row.trelloStatus && row.excelStatus && row.trelloStatus.trim().toLowerCase() !== row.excelStatus.trim().toLowerCase(); }
  function priority(row) {
    const days = dueDays(row);
    const age = stageAge(row);
    const exception = row.exception.trim();
    if (days !== null && days < 0) return 'Critical';
    if (days !== null && days <= 3) return 'Critical';
    if (/missing|lost|late|back order|backordered|hold|fabric out|lining hold/i.test(exception)) return days !== null && days <= 14 ? 'Critical' : 'High';
    if (mismatch(row)) return 'High';
    if (days !== null && days <= 14) return 'High';
    if (age !== null && age >= 14 && !/shipped|delivered|received/i.test(row.stage)) return 'High';
    if (!row.nextFollowUp && (exception || (days !== null && days <= 30))) return 'High';
    return 'Review';
  }

  function issues(row) {
    const out=[];
    const age=stageAge(row), days=dueDays(row);
    if (!row.client) out.push('Missing client');
    if (!row.order && !row.cof) out.push('Missing order/COF');
    if (!row.garment) out.push('Missing garment');
    if (!row.stageDate) out.push('Missing stage date');
    if (age !== null && age >= 14 && !/shipped|delivered|received/i.test(row.stage)) out.push(`${age} days in stage`);
    if (days !== null && days < 0) out.push(`${Math.abs(days)} days overdue`);
    else if (days !== null && days <= 14) out.push(`${days} days to earliest deadline`);
    if (row.exception) out.push(row.exception);
    if (mismatch(row)) out.push('Trello/Excel mismatch');
    if (!row.nextFollowUp && priority(row) !== 'Review') out.push('No next follow-up');
    return out;
  }

  function select(row,key,options) {
    return `<select data-id="${row.id}" data-key="${key}">${options.map(x=>`<option${row[key]===x?' selected':''}>${U.escapeHtml(x)}</option>`).join('')}</select>`;
  }
  function input(row,key,type='text') { return `<input data-id="${row.id}" data-key="${key}" type="${type}" value="${U.escapeHtml(row[key])}">`; }

  function render() {
    const chosen=filter.value;
    const visible=rows.filter(r=>!chosen || priority(r)===chosen || r.stage===chosen);
    empty.hidden=visible.length>0;
    tbody.innerHTML=visible.map(row=>{
      const p=priority(row); const age=stageAge(row); const days=dueDays(row); const issueText=issues(row).join('; ')||'No current exception';
      return `<tr>
        <td>${input(row,'client')}<br><small>${input(row,'order')}</small><br><small>${input(row,'cof')}</small></td>
        <td>${input(row,'garment')}</td>
        <td>${select(row,'stage',['Booked','Blue Pencil','Released','Pattern','Cutting','Manufacturing / Sewing','Back Ordered','Cloth / Lining Hold','Shipped','Received / Inventory','Delivered'])}<br><small>${input(row,'stageDate','date')}</small></td>
        <td>${input(row,'standardDue','date')}<br><small>Client: ${input(row,'clientRequired','date')}</small></td>
        <td>${input(row,'exception')}</td>
        <td>${input(row,'trelloStatus')}<br><small>${input(row,'excelStatus')}</small></td>
        <td>${input(row,'factoryResponse')}<br><small>${input(row,'nextFollowUp','date')}</small></td>
        <td><span class="status-pill status-${p.toLowerCase()}">${p}</span><br><small>Stage age: ${age ?? '—'} days<br>Deadline: ${days===null?'—':days+' days'}<br>${U.escapeHtml(issueText)}</small></td>
        <td><div class="row-actions"><button class="btn btn-secondary btn-small" type="button" data-brief="${row.id}">Brief</button><button class="btn btn-danger btn-small" type="button" data-delete="${row.id}">Remove</button></div></td>
      </tr>`;
    }).join('');
    updateSummary(); renderQueues();
  }

  function updateSummary(){
    ['Critical','High','Review'].forEach(level=>U.$(`#metric-${level.toLowerCase()}`).textContent=rows.filter(r=>priority(r)===level).length);
    U.$('#metric-mismatch').textContent=rows.filter(mismatch).length;
    const disabled=rows.length===0;
    ['#wip-export','#wip-json','#wip-brief-all'].forEach(id=>U.$(id).disabled=disabled);
  }

  function renderQueues(){
    const groups={Critical:[],High:[],Mismatch:[],FollowUp:[]};
    rows.forEach(row=>{
      if(priority(row)==='Critical') groups.Critical.push(row);
      if(priority(row)==='High') groups.High.push(row);
      if(mismatch(row)) groups.Mismatch.push(row);
      if(row.nextFollowUp && (U.daysUntil(row.nextFollowUp)??99)<=0) groups.FollowUp.push(row);
    });
    const renderList=(items)=>items.length?items.slice(0,8).map(r=>`<div class="queue-item"><strong>${U.escapeHtml(r.client||'Unknown')} — ${U.escapeHtml(r.garment||'Item')}</strong><small>${U.escapeHtml(issues(r).join('; ')||r.stage)}</small></div>`).join(''):'<div class="app-empty">None</div>';
    U.$('#queue-critical').innerHTML=renderList(groups.Critical); U.$('#count-critical').textContent=groups.Critical.length;
    U.$('#queue-high').innerHTML=renderList(groups.High); U.$('#count-high').textContent=groups.High.length;
    U.$('#queue-mismatch').innerHTML=renderList(groups.Mismatch); U.$('#count-mismatch').textContent=groups.Mismatch.length;
    U.$('#queue-followup').innerHTML=renderList(groups.FollowUp); U.$('#count-followup').textContent=groups.FollowUp.length;
  }

  function updateRow(id,key,value){ const row=rows.find(r=>r.id===id); if(!row)return; row[key]=value; render(); }
  tbody.addEventListener('change',e=>{const el=e.target.closest('[data-id][data-key]'); if(el)updateRow(el.dataset.id,el.dataset.key,el.value);});
  tbody.addEventListener('click',e=>{
    const del=e.target.closest('[data-delete]'); if(del){rows=rows.filter(r=>r.id!==del.dataset.delete);render();return;}
    const brief=e.target.closest('[data-brief]'); if(brief){const row=rows.find(r=>r.id===brief.dataset.brief); if(row)U.copyText(decisionBrief(row),'Decision brief copied');}
  });

  function decisionBrief(row){
    return [
      `CLIENT / ITEM: ${row.client} — ${row.garment}`,
      `ORDER / COF: ${row.order||'—'} / ${row.cof||'—'}`,
      `COMMITMENT: ${row.clientRequired?`Client-required ${U.formatDate(row.clientRequired)}`:row.standardDue?`Standard due ${U.formatDate(row.standardDue)}`:'No verified date'}`,
      `VERIFIED STATUS: ${row.stage} since ${U.formatDate(row.stageDate)} (${stageAge(row)??'—'} days)`,
      `EXCEPTION: ${row.exception||'None documented'}`,
      `FACTORY RESPONSE: ${row.factoryResponse||'Not yet obtained'}`,
      `RECONCILIATION: Trello “${row.trelloStatus||'—'}” / Excel “${row.excelStatus||'—'}”${mismatch(row)?' — MISMATCH':''}`,
      `RISK: ${issues(row).join('; ')||'Routine review'}`,
      `NEXT FOLLOW-UP: ${row.nextFollowUp?U.formatDate(row.nextFollowUp):'Needs date'}`,
      'RECOMMENDATION: Verify the next production milestone and protect the earliest client deadline before communicating a promise.',
      'DECISION NEEDED: Confirm whether the client should be updated, the appointment moved, or an alternative pursued.'
    ].join('\n');
  }

  U.$('#add-wip-row').addEventListener('click',()=>{rows.push(newRow());render();});
  U.$('#clear-wip').addEventListener('click',()=>{if(rows.length&&!confirm('Clear all WIP/Watch rows?'))return;rows=[];render();});
  filter.addEventListener('change',render);
  U.$('#wip-template').addEventListener('click',()=>U.downloadText('wip-watch-template.csv',U.toCsv([newRow({id:undefined})],fields.map(k=>({key:k,label:k}))),'text/csv;charset=utf-8'));
  fileInput.addEventListener('change',async()=>{
    const file=fileInput.files?.[0]; if(!file)return;
    try{
      const imported=U.parseCsv(await U.readFileText(file)).map(raw=>{const m=U.mapCsvRow(raw,aliases);return newRow({...m,stage:m.stage||'Booked',stageDate:m.stageDate||U.todayIso(),source:m.source||'Imported report'});});
      rows.push(...imported);render();U.toast(`${imported.length} WIP/Watch row${imported.length===1?'':'s'} imported`,'success');
    }catch(err){U.toast(`Import failed: ${err.message}`,'error');}finally{fileInput.value='';}
  });
  U.$('#wip-export').addEventListener('click',()=>U.downloadText('wip-watch-review.csv',U.toCsv(rows.map(r=>({...r,stageAge:stageAge(r),daysToDeadline:dueDays(r),priority:priority(r),issues:issues(r).join('; ')})),[...fields.map(k=>({key:k,label:k})),{key:'stageAge',label:'stageAge'},{key:'daysToDeadline',label:'daysToDeadline'},{key:'priority',label:'priority'},{key:'issues',label:'issues'}]),'text/csv;charset=utf-8'));
  U.$('#wip-json').addEventListener('click',()=>U.downloadJson('wip-watch-review.json',{schema:'nicole-ops.wip-watch.v1',createdAt:new Date().toISOString(),rows}));
  U.$('#wip-brief-all').addEventListener('click',()=>{
    const items=rows.filter(r=>priority(r)!=='Review').sort((a,b)=>({Critical:0,High:1}[priority(a)]??2)-({Critical:0,High:1}[priority(b)]??2));
    U.copyText(items.map((r,i)=>`#${i+1} ${priority(r)}\n${decisionBrief(r)}`).join('\n\n'),'All decision briefs copied');
  });
  U.$('#print-wip').addEventListener('click',()=>window.print());

  rows=[newRow()]; render();
})();
