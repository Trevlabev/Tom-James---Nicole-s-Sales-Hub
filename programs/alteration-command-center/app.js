(() => {
  const U = window.NAH_APP;
  const tbody = U.$('#alt-center-body');
  const empty = U.$('#alt-center-empty');
  const filter = U.$('#alt-center-filter');
  const providerFilter = U.$('#alt-provider-filter');
  const importInput = U.$('#alt-center-import');
  let rows = [];

  const fields = ['client','order','cof','garment','provider','serviceType','ticketReturnNumber','transferDate','etc','clientRequiredDate','status','location','nextFollowUp','instructions','notes'];
  const aliases = {
    client:['client name'], order:['order number'], cof:['cof/ticket'], garment:['item'], provider:['tailor','factory'], serviceType:['service','type'],
    ticketReturnNumber:['ticket','return number','return #'], transferDate:['date sent','sent date','entered date'], etc:['due date','expected completion'],
    clientRequiredDate:['client required','client deadline'], status:['alteration status'], location:['physical location'], nextFollowUp:['follow up','next follow-up'],
    instructions:['alteration instructions','directions'], notes:['assistant notes']
  };

  function newRow(overrides={}) {
    return { id:U.uid('alteration'), client:'', order:'', cof:'', garment:'', provider:'', serviceType:'Local alteration', ticketReturnNumber:'', transferDate:U.todayIso(), etc:'', clientRequiredDate:'', status:'Intake', location:'Alteration Intake', nextFollowUp:'', instructions:'', notes:'', ...overrides };
  }

  function daysTo(value){return U.daysUntil(value);}
  function daysAtProvider(row){return U.daysBetween(row.transferDate);}
  function queueFlags(row){
    const flags=[]; const status=row.status;
    const active=!['Closed','Client Returned / Closed'].includes(status);
    const etcDays=daysTo(row.etc), clientDays=daysTo(row.clientRequiredDate), followDays=daysTo(row.nextFollowUp);
    if(active && !row.etc && ['At Provider','Prepared / At Shop','Reported Complete'].includes(status)) flags.push('Needs Date');
    if(active && etcDays!==null && etcDays<0 && !['Returned / Verified','Completed — Scheduling'].includes(status)) flags.push('Overdue');
    if(active && ((etcDays!==null && etcDays>=0 && etcDays<=7)||(clientDays!==null&&clientDays>=0&&clientDays<=7))) flags.push('Due Soon');
    if(status==='Reported Complete') flags.push('Reported Complete — Not Returned');
    if(['Returned / Verified','Completed — Scheduling'].includes(status)) flags.push('Awaiting Scheduling');
    if(active && followDays!==null && followDays<=0) flags.push('Follow-Up Due');
    if(active && (!row.location || row.location==='Verify Location')) flags.push('Custody Risk');
    return flags;
  }

  function priority(row){
    const flags=queueFlags(row); const clientDays=daysTo(row.clientRequiredDate);
    if(flags.includes('Custody Risk') || (clientDays!==null&&clientDays<0) || (clientDays!==null&&clientDays<=3&&flags.some(f=>['Overdue','Needs Date','Reported Complete — Not Returned'].includes(f)))) return 'Critical';
    if(flags.some(f=>['Overdue','Needs Date','Reported Complete — Not Returned','Due Soon','Follow-Up Due'].includes(f))) return 'High';
    if(['Closed','Client Returned / Closed'].includes(row.status)) return 'Complete';
    return 'Review';
  }

  function input(row,key,type='text'){return `<input data-id="${row.id}" data-key="${key}" type="${type}" value="${U.escapeHtml(row[key])}">`;}
  function select(row,key,options){return `<select data-id="${row.id}" data-key="${key}">${options.map(x=>`<option${row[key]===x?' selected':''}>${U.escapeHtml(x)}</option>`).join('')}</select>`;}

  function providers(){return [...new Set(rows.map(r=>r.provider).filter(Boolean))].sort();}
  function updateProviderFilter(){
    const current=providerFilter.value;
    providerFilter.innerHTML='<option value="">All providers</option>'+providers().map(p=>`<option${p===current?' selected':''}>${U.escapeHtml(p)}</option>`).join('');
  }

  function render(){
    updateProviderFilter();
    const q=filter.value,pf=providerFilter.value;
    const visible=rows.filter(r=>(!q||priority(r)===q||queueFlags(r).includes(q)||r.status===q)&&(!pf||r.provider===pf));
    empty.hidden=visible.length>0;
    tbody.innerHTML=visible.map(row=>{
      const flags=queueFlags(row),p=priority(row),age=daysAtProvider(row);
      return `<tr>
        <td>${input(row,'client')}<br><small>${input(row,'order')} / ${input(row,'cof')}</small></td>
        <td>${input(row,'garment')}<br><small>${select(row,'serviceType',['Local alteration','Factory alteration','In-shop alteration','Cleaner / pressing','Repair / reweaving','Return / exchange'])}</small></td>
        <td>${input(row,'provider')}<br><small>${input(row,'ticketReturnNumber')}</small></td>
        <td>${input(row,'transferDate','date')}<br><small>${age??'—'} days since transfer</small></td>
        <td>${input(row,'etc','date')}<br><small>Client: ${input(row,'clientRequiredDate','date')}</small></td>
        <td>${select(row,'status',['Intake','Prepared / At Shop','At Provider','Reported Complete','Returned / Verified','Completed — Scheduling','Client Returned / Closed','Closed'])}<br><small>${select(row,'location',['Alteration Intake','Main Rack','With Nicole','At Gegi','At Naziha','In Shop','Factory Return Area','At Factory','Cleaner / Repair','Next-Day Staging','Shipping Rack','Client Received','Verify Location'])}</small></td>
        <td>${input(row,'nextFollowUp','date')}</td>
        <td><span class="status-pill status-${p.toLowerCase()}">${p}</span><br><small>${U.escapeHtml(flags.join('; ')||'Routine active')}</small></td>
        <td><div class="row-actions"><button class="btn btn-secondary btn-small" type="button" data-summary="${row.id}">Summary</button><button class="btn btn-danger btn-small" type="button" data-delete="${row.id}">Remove</button></div></td>
      </tr>`;
    }).join('');
    updateMetrics(); renderQueues();
  }

  function updateMetrics(){
    U.$('#alt-metric-active').textContent=rows.filter(r=>priority(r)!=='Complete').length;
    U.$('#alt-metric-critical').textContent=rows.filter(r=>priority(r)==='Critical').length;
    U.$('#alt-metric-needs').textContent=rows.filter(r=>queueFlags(r).includes('Needs Date')).length;
    U.$('#alt-metric-returned').textContent=rows.filter(r=>queueFlags(r).includes('Awaiting Scheduling')).length;
    const disabled=rows.length===0; ['#alt-center-csv','#alt-center-json','#alt-center-followup'].forEach(id=>U.$(id).disabled=disabled);
  }

  function queueItems(flag){return rows.filter(r=>queueFlags(r).includes(flag)).sort((a,b)=>(daysTo(a.etc)??999)-(daysTo(b.etc)??999));}
  function queueHtml(items){return items.length?items.slice(0,10).map(r=>`<div class="queue-item"><strong>${U.escapeHtml(r.client||'Unknown')} — ${U.escapeHtml(r.garment||'Garment')}</strong><small>${U.escapeHtml(r.provider||'No provider')} • ${r.etc?`ETC ${U.formatDate(r.etc)}`:'No ETC'} • ${U.escapeHtml(r.location||'No location')}</small></div>`).join(''):'<div class="app-empty">None</div>';}
  function renderQueues(){
    const specs=[['Needs Date','needs'],['Overdue','overdue'],['Reported Complete — Not Returned','reported'],['Awaiting Scheduling','scheduling'],['Follow-Up Due','followup'],['Custody Risk','custody']];
    specs.forEach(([flag,id])=>{const items=queueItems(flag);U.$(`#alt-queue-${id}`).innerHTML=queueHtml(items);U.$(`#alt-count-${id}`).textContent=items.length;});
  }

  function internalSummary(row){
    return [
      `${priority(row)} ALTERATION — ${row.client} / ${row.garment}`,
      `Order / COF: ${row.order||'—'} / ${row.cof||'—'}`,
      `Service / Provider: ${row.serviceType} / ${row.provider||'Needs provider'}`,
      `Ticket / Return #: ${row.ticketReturnNumber||'—'}`,
      `Status / Location: ${row.status} / ${row.location||'Unknown'}`,
      `Transferred: ${row.transferDate?U.formatDate(row.transferDate):'—'} (${daysAtProvider(row)??'—'} days)` ,
      `ETC: ${row.etc?U.formatDate(row.etc):'Needs date'}`,
      `Client-required: ${row.clientRequiredDate?U.formatDate(row.clientRequiredDate):'Unknown'}`,
      `Next follow-up: ${row.nextFollowUp?U.formatDate(row.nextFollowUp):'Needs date'}`,
      `Queue flags: ${queueFlags(row).join('; ')||'Routine active'}`,
      `Instructions: ${row.instructions||'See ticket / attachments'}`,
      `Notes: ${row.notes||'—'}`,
      'NEXT ACTION: Verify custody, provider status, and the next dated commitment before client scheduling.'
    ].join('\n');
  }

  function updateRow(id,key,value){const row=rows.find(r=>r.id===id);if(!row)return;row[key]=value;render();}
  tbody.addEventListener('change',e=>{const el=e.target.closest('[data-id][data-key]');if(el)updateRow(el.dataset.id,el.dataset.key,el.value);});
  tbody.addEventListener('click',e=>{
    const del=e.target.closest('[data-delete]');if(del){rows=rows.filter(r=>r.id!==del.dataset.delete);render();return;}
    const sum=e.target.closest('[data-summary]');if(sum){const row=rows.find(r=>r.id===sum.dataset.summary);if(row)U.copyText(internalSummary(row),'Alteration summary copied');}
  });

  U.$('#add-alt-center-row').addEventListener('click',()=>{rows.push(newRow());render();});
  U.$('#clear-alt-center').addEventListener('click',()=>{if(rows.length&&!confirm('Clear all alteration rows? Export first if needed.'))return;rows=[];render();});
  filter.addEventListener('change',render);providerFilter.addEventListener('change',render);
  U.$('#alt-center-template').addEventListener('click',()=>U.downloadText('alteration-command-center-template.csv',U.toCsv([newRow({id:undefined})],fields.map(k=>({key:k,label:k}))),'text/csv;charset=utf-8'));

  function importJson(data){
    if(data.schema==='nicole-ops.alteration-intake.v1'){
      rows.push(newRow({client:data.client,order:data.order,cof:data.cof,garment:data.garment,provider:data.provider,serviceType:data.serviceType,ticketReturnNumber:'',transferDate:data.createdAt?.slice(0,10)||U.todayIso(),etc:data.etc,clientRequiredDate:data.clientRequiredDate,status:data.status||'Intake',location:data.currentLocation,nextFollowUp:'',instructions:data.instructions,notes:data.notes}));
      return 1;
    }
    if(Array.isArray(data.rows)){const imported=data.rows.map(x=>newRow({...x,id:U.uid('alteration')}));rows.push(...imported);return imported.length;}
    if(Array.isArray(data)){const imported=data.map(x=>newRow({...x,id:U.uid('alteration')}));rows.push(...imported);return imported.length;}
    rows.push(newRow({...data,id:U.uid('alteration')}));return 1;
  }

  importInput.addEventListener('change',async()=>{
    const file=importInput.files?.[0];if(!file)return;
    try{
      const text=await U.readFileText(file);let count=0;
      if(file.name.toLowerCase().endsWith('.json')) count=importJson(JSON.parse(text));
      else {const imported=U.parseCsv(text).map(raw=>{const m=U.mapCsvRow(raw,aliases);return newRow({...m,status:m.status||'Intake',location:m.location||'Alteration Intake'});});rows.push(...imported);count=imported.length;}
      render();U.toast(`${count} alteration record${count===1?'':'s'} imported`,'success');
    }catch(err){U.toast(`Import failed: ${err.message}`,'error');}finally{importInput.value='';}
  });

  U.$('#alt-center-csv').addEventListener('click',()=>U.downloadText('alteration-command-center.csv',U.toCsv(rows.map(r=>({...r,priority:priority(r),queues:queueFlags(r).join('; '),daysAtProvider:daysAtProvider(r)})),[...fields.map(k=>({key:k,label:k})),{key:'priority',label:'priority'},{key:'queues',label:'queues'},{key:'daysAtProvider',label:'daysAtProvider'}]),'text/csv;charset=utf-8'));
  U.$('#alt-center-json').addEventListener('click',()=>U.downloadJson('alteration-command-center.json',{schema:'nicole-ops.alteration-command-center.v1',createdAt:new Date().toISOString(),rows}));
  U.$('#alt-center-followup').addEventListener('click',()=>{
    const active=rows.filter(r=>priority(r)!=='Complete').sort((a,b)=>({Critical:0,High:1,Review:2}[priority(a)]??3)-({Critical:0,High:1,Review:2}[priority(b)]??3));
    U.copyText(active.map((r,i)=>`#${i+1}\n${internalSummary(r)}`).join('\n\n'),'Daily alteration follow-up list copied');
  });
  U.$('#print-alt-center').addEventListener('click',()=>window.print());

  rows=[newRow()];render();
})();
