(()=>{
  const U=NAH_APP,T=NAH_TRELLO,R=U.$('#app-root');
  const MAX_FILES=12;
  const state={files:[],busy:false,lastCard:null};
  const checklistItems=[
    'Client identified',
    'Every circled or referenced garment identified',
    'Order / COF verified',
    'Nicole\'s handwriting transcribed exactly',
    'Instructions separated by garment',
    'Fit photographs matched to the correct garment',
    'Secure Site categories determined',
    'Unknowns and contradictions documented',
    'Ticket ready for Secure Site entry'
  ];

  R.innerHTML=`
    <div class="app-layout">
      <div class="stack">
        <section class="card">
          <div class="card-head">
            <div><h2>1. Add the source packet</h2><p>The first image becomes the Trello card cover. Add the annotated swatch screenshot first, followed by fitting photographs.</p></div>
            <span class="badge badge-gold" data-count>0 / ${MAX_FILES}</span>
          </div>
          <div class="callout"><strong>One image is enough to create the card.</strong><br>Missing client, garment, measurement, or construction details remain explicitly unresolved rather than being guessed.</div>
          <div class="btn-row" style="margin-top:14px">
            <label class="btn btn-primary" for="capture-photo">Take photo</label>
            <label class="btn btn-secondary" for="select-images">Select images</label>
            <button class="btn btn-danger" type="button" data-clear-files>Clear images</button>
          </div>
          <input id="capture-photo" type="file" accept="image/*" capture="environment" hidden>
          <input id="select-images" type="file" accept="image/*,.heic,.heif" multiple hidden>
          <div data-previews style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:18px"></div>
        </section>

        <section class="card">
          <div class="card-head"><div><h2>2. Optional identification</h2><p>Leave these blank when the image is all you have. The Trello card will still be created as an unidentified intake.</p></div><span class="badge badge-muted">Optional</span></div>
          <div class="form-grid">
            <div class="field half"><label>Client</label><input data-f="client" autocomplete="off" placeholder="Read from image later if unknown"></div>
            <div class="field quarter"><label>Order</label><input data-f="order" autocomplete="off"></div>
            <div class="field quarter"><label>COF</label><input data-f="cof" autocomplete="off"></div>
            <div class="field half"><label>Garment / packet description</label><input data-f="garment" placeholder="Suit, two sport coats, trousers…"></div>
            <div class="field quarter"><label>Request type</label><select data-f="serviceType"><option>Alteration intake</option><option>Repair / pressing</option><option>Factory / remake</option><option>Unknown request type</option></select></div>
            <div class="field quarter"><label>Priority</label><select data-f="priority"><option>Normal</option><option>Rush</option><option>Unknown</option></select></div>
            <div class="field full"><label>Known instruction or note</label><textarea data-f="instructions" placeholder="Optional: paste or type anything already known. The source image remains authoritative."></textarea></div>
          </div>
        </section>

        <section class="card">
          <div class="card-head"><div><h2>3. Create the Trello intake</h2><p>The card, attachments, and interpretation checklist are created directly in Nicole's mapped Active Alterations list.</p></div><span class="badge badge-muted" data-ready-badge>Not ready</span></div>
          <div data-connection></div>
          <div class="btn-row" style="margin-top:14px">
            <button class="btn btn-primary" type="button" data-create-card>Create Trello intake</button>
            <label class="checkbox-row"><input type="checkbox" data-open-card checked><span>Open the Trello card after creation</span></label>
          </div>
          <div class="progress" style="margin-top:16px"><span data-progress style="width:0%"></span></div>
          <div class="output-box" data-output>No card has been created.</div>
        </section>
      </div>

      <aside class="stack app-sidebar">
        <section class="card">
          <h3>What this version guarantees</h3>
          <div class="queue-list">
            <div class="queue-item"><strong>✓ Image packet reaches Trello</strong><br><small>Images are uploaded directly from this browser to the created card.</small></div>
            <div class="queue-item"><strong>✓ No invented information</strong><br><small>Unknown client, garment, measurements, and category decisions remain unknown.</small></div>
            <div class="queue-item"><strong>✓ Interpretation checklist</strong><br><small>The card shows exactly what must be determined before Secure Site entry.</small></div>
          </div>
        </section>
        <section class="callout warning"><strong>Static-site boundary</strong><br>This GitHub Pages app can create and attach the intake packet. It cannot safely perform full AI handwriting and garment-fit interpretation without an additional protected AI service.</section>
      </aside>
    </div>`;

  const fields=()=>Object.fromEntries(U.$$('[data-f]').map(x=>[x.dataset.f,x.value.trim()]));
  const mappedList=()=>T.getSettings()?.mappings?.alterationsActive||'';
  const formatBytes=n=>n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(1)} MB`;
  const safeName=name=>String(name||'image').replace(/[^a-z0-9._-]+/gi,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'image';

  function renderConnection(){
    const connected=T.isConnected(),settings=T.getSettings(),listId=mappedList();
    const member=T.getAuth().member;
    const el=U.$('[data-connection]');
    if(!connected){
      el.innerHTML='<div class="callout warning"><strong>Trello is not connected.</strong><br>Open Trello setup, enter the API key, authorize Nicole\'s account, then return here.</div>';
    }else if(!listId){
      el.innerHTML='<div class="callout warning"><strong>Active Alterations is not mapped.</strong><br>Open Trello setup and map the Active alterations workflow to the correct Trello list.</div>';
    }else{
      el.innerHTML=`<div class="integration-status is-connected"><div><strong>Ready for Trello</strong><span>${U.escapeHtml(member?.fullName||'Authorized user')} • ${U.escapeHtml(settings.boardName||'Selected board')}</span></div><a class="text-link" href="../../trello.html">Review setup →</a></div>`;
    }
    const ready=connected&&!!listId&&state.files.length>0&&!state.busy;
    const badge=U.$('[data-ready-badge]');
    badge.className=`badge ${ready?'badge-green':'badge-muted'}`;
    badge.textContent=ready?'Ready':'Not ready';
    U.$('[data-create-card]').disabled=!ready;
  }

  function revokePreview(item){if(item.url)URL.revokeObjectURL(item.url)}
  function addFiles(fileList){
    const incoming=[...fileList].filter(Boolean);
    const room=MAX_FILES-state.files.length;
    if(room<=0){U.toast(`Maximum ${MAX_FILES} images per intake.`,'error');return}
    if(incoming.length>room)U.toast(`Only the first ${room} additional images were added.`,'error');
    incoming.slice(0,room).forEach(file=>state.files.push({id:NAH_STORE.id('img'),file,url:URL.createObjectURL(file)}));
    renderFiles();
  }
  function renderFiles(){
    U.$('[data-count]').textContent=`${state.files.length} / ${MAX_FILES}`;
    const root=U.$('[data-previews]');
    root.innerHTML=state.files.length?state.files.map((item,i)=>`
      <article class="card no-shadow" style="padding:10px;background:#faf8f3">
        <div style="aspect-ratio:4/3;background:#eee;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:8px">
          <img src="${item.url}" alt="Selected source ${i+1}" style="width:100%;height:100%;object-fit:contain">
        </div>
        <div style="margin-top:8px"><strong>${i===0?'Source / cover':'Fit photo '+i}</strong><br><small>${U.escapeHtml(item.file.name)} • ${formatBytes(item.file.size)}</small></div>
        <div class="btn-row" style="margin-top:8px">
          ${i>0?`<button class="btn btn-secondary btn-small" type="button" data-make-first="${item.id}">Make first</button>`:''}
          <button class="btn btn-danger btn-small" type="button" data-remove-file="${item.id}">Remove</button>
        </div>
      </article>`).join(''):'<div class="empty-state" style="grid-column:1/-1">No images selected. Take one photo or choose an annotated screenshot.</div>';
    renderConnection();
  }

  async function imageDimensions(file){
    if(!file.type.startsWith('image/'))return null;
    try{
      const bitmap=await createImageBitmap(file);
      const out={width:bitmap.width,height:bitmap.height};
      bitmap.close();return out;
    }catch{return null}
  }
  async function prepareUpload(item,index){
    const file=item.file;
    const prefix=String(index+1).padStart(2,'0');
    const originalName=`${prefix}-${safeName(file.name)}`;
    if(!file.type.startsWith('image/')||/hei[cf]/i.test(file.type)||/\.hei[cf]$/i.test(file.name))return {file,name:originalName};
    const dimensions=await imageDimensions(file);
    const shouldCompress=file.size>8*1024*1024||(dimensions&&Math.max(dimensions.width,dimensions.height)>3200);
    if(!shouldCompress||file.type==='image/png')return {file,name:originalName};
    try{
      const bitmap=await createImageBitmap(file);
      const scale=Math.min(1,2400/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.88));
      if(!blob||blob.size>=file.size)return {file,name:originalName};
      const jpgName=originalName.replace(/\.[^.]+$/,'.jpg');
      return {file:new File([blob],jpgName,{type:'image/jpeg',lastModified:file.lastModified}),name:jpgName};
    }catch{return {file,name:originalName}}
  }

  function buildRecord(){
    const f=fields(),now=new Date();
    const client=f.client||'Unidentified Client';
    const garment=f.garment||'Unidentified garment packet';
    return {
      schema:'nicole-ops.alteration-image-intake.v1',
      id:NAH_STORE.id('alt'),
      source:'github-pages-image-intake',
      client,
      order:f.order,
      cof:f.cof,
      garment,
      serviceType:f.serviceType,
      priority:f.priority,
      provider:'Pending review',
      status:'Needs Interpretation',
      location:'Trello Intake',
      instructions:f.instructions||'See attached annotated source image and fitting photographs.',
      notes:'Created from image packet. No unsupported measurements, garment identities, construction details, or Secure Site categories were inferred.',
      photoManifest:state.files.map((x,i)=>`${i+1}. ${x.file.name}`).join('\n'),
      sourceImageCount:state.files.length,
      nextAction:'Interpret attached source packet; identify garments; translate Nicole\'s instructions; determine Secure Site work blocks; document unknowns.',
      createdAt:now.toISOString(),
      updatedAt:now.toISOString()
    };
  }
  function titleFor(r){
    const stamp=new Date(r.createdAt).toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'});
    const cof=r.cof?` | COF ${r.cof}`:'';
    return `ALTERATION INTAKE | ${r.client} | ${r.garment}${cof} | ${stamp}`.slice(0,512);
  }
  function descriptionFor(r){
    return [
      `NAH_SYNC|alterations|${r.id}`,
      '',
      '## SOURCE PACKET',
      `Images attached: ${r.sourceImageCount}`,
      `Submitted: ${new Date(r.createdAt).toLocaleString()}`,
      `Source: Nicole's Operations Suite — One-Image Alteration Intake`,
      '',
      '## IDENTIFICATION',
      `Client: ${r.client}`,
      `Order: ${r.order||'Unknown'}`,
      `COF: ${r.cof||'Unknown'}`,
      `Garment: ${r.garment}`,
      `Request Type: ${r.serviceType}`,
      `Priority: ${r.priority}`,
      '',
      '## ORIGINAL / KNOWN INSTRUCTION',
      r.instructions,
      '',
      '## IMAGE MANIFEST',
      r.photoManifest,
      '',
      '## INTERPRETATION STATUS',
      'Needs Interpretation',
      '',
      '## NEXT ACTION',
      r.nextAction,
      '',
      '## SAFETY RULE',
      'Do not infer missing measurements, garment identity, construction type, instruction scope, or alteration direction. Use the attached images as evidence and document unresolved items.'
    ].join('\n');
  }

  async function createCard(){
    if(state.busy)return;
    if(!state.files.length){U.toast('Add at least one image.','error');return}
    if(!T.isConnected()){U.toast('Connect Trello first.','error');return}
    const listId=mappedList();if(!listId){U.toast('Map the Active Alterations Trello list first.','error');return}
    state.busy=true;renderConnection();U.$('[data-progress]').style.width='3%';U.$('[data-output]').textContent='Preparing images…';
    try{
      const record=buildRecord();
      const prepared=[];
      for(let i=0;i<state.files.length;i++){
        U.$('[data-output]').textContent=`Preparing image ${i+1} of ${state.files.length}…`;
        prepared.push(await prepareUpload(state.files[i],i));
        U.$('[data-progress]').style.width=`${Math.round((i+1)/state.files.length*20)}%`;
      }
      const result=await T.createIntakeCard({
        listId,
        name:titleFor(record),
        desc:descriptionFor(record),
        files:prepared,
        checklistName:'Alteration Intake — Interpretation & Validation',
        checkItems:checklistItems,
        onProgress:p=>{
          U.$('[data-progress]').style.width=`${20+Math.round(p.percent*.8)}%`;
          U.$('[data-output]').textContent=`Creating Trello intake…\n${p.stage}: ${p.detail}\n${p.percent}% of Trello work complete`;
        }
      });
      const saved={...record,trelloCardId:result.card.id,trelloCardUrl:result.card.url,trelloListId:result.card.idList,trelloLastSyncedAt:new Date().toISOString(),trelloLastActivity:result.card.dateLastActivity||new Date().toISOString()};
      NAH_STORE.update(s=>{const existing=(s.records.alterations||[]).findIndex(x=>x.id===saved.id);if(existing>=0)s.records.alterations[existing]=saved;else s.records.alterations.unshift(saved);return s},{quiet:true});
      NAH_STORE.activity('trello',`Created image-based Trello intake: ${record.client}`,record.id);
      state.lastCard=result.card;U.$('[data-progress]').style.width='100%';
      const warningText=result.warnings.length?`\n\nWarnings:\n- ${result.warnings.join('\n- ')}`:'';
      U.$('[data-output]').innerHTML=`<strong>Trello intake created.</strong><br>${result.attachments.length} of ${state.files.length} images attached.<br><a class="text-link" target="_blank" rel="noopener" href="${U.escapeHtml(result.card.url)}">Open ${U.escapeHtml(result.card.name)}</a>${warningText?`<pre style="white-space:pre-wrap;margin-top:12px">${U.escapeHtml(warningText.trim())}</pre>`:''}`;
      U.toast(result.warnings.length?'Card created with warnings':'Trello intake created',result.warnings.length?'error':'success');
      if(U.$('[data-open-card]').checked)window.open(result.card.url,'_blank','noopener');
    }catch(err){
      console.error(err);U.$('[data-output]').textContent=`Creation failed: ${err.message}`;U.$('[data-progress]').style.width='0%';U.toast(err.message,'error');
    }finally{state.busy=false;renderConnection()}
  }

  U.$('#capture-photo').addEventListener('change',e=>{addFiles(e.target.files);e.target.value=''});
  U.$('#select-images').addEventListener('change',e=>{addFiles(e.target.files);e.target.value=''});
  R.addEventListener('click',e=>{
    const remove=e.target.closest('[data-remove-file]');
    if(remove){const i=state.files.findIndex(x=>x.id===remove.dataset.removeFile);if(i>=0){revokePreview(state.files[i]);state.files.splice(i,1);renderFiles()}return}
    const first=e.target.closest('[data-make-first]');
    if(first){const i=state.files.findIndex(x=>x.id===first.dataset.makeFirst);if(i>0){const [item]=state.files.splice(i,1);state.files.unshift(item);renderFiles()}return}
    if(e.target.closest('[data-clear-files]')){state.files.forEach(revokePreview);state.files=[];renderFiles();return}
    if(e.target.closest('[data-create-card]'))createCard();
  });
  window.addEventListener('nah:trello-auth-change',renderConnection);
  window.addEventListener('beforeunload',()=>state.files.forEach(revokePreview));
  renderFiles();
})();
