window.NAH_TRELLO=(()=>{
  const AUTH_KEY='nah.trello.auth.v1';
  const API_KEY_KEY='nah.trello.apiKey.v1';
  const API_ROOT='https://api.trello.com/1';
  const safeParse=text=>{try{return JSON.parse(text)}catch{return null}};
  const getAuth=()=>{
    const session=safeParse(sessionStorage.getItem(AUTH_KEY))||{};
    const remembered=localStorage.getItem(API_KEY_KEY)||'';
    return {apiKey:session.apiKey||remembered,token:session.token||'',member:session.member||null,connectedAt:session.connectedAt||''};
  };
  const setAuth=(auth,{rememberKey=false}={})=>{
    const clean={apiKey:auth.apiKey||'',token:auth.token||'',member:auth.member||null,connectedAt:auth.connectedAt||new Date().toISOString()};
    sessionStorage.setItem(AUTH_KEY,JSON.stringify(clean));
    if(rememberKey&&clean.apiKey)localStorage.setItem(API_KEY_KEY,clean.apiKey);else if(!rememberKey)localStorage.removeItem(API_KEY_KEY);
    window.dispatchEvent(new CustomEvent('nah:trello-auth-change',{detail:{connected:!!clean.token}}));
    return clean;
  };
  const clearAuth=()=>{sessionStorage.removeItem(AUTH_KEY);window.dispatchEvent(new CustomEvent('nah:trello-auth-change',{detail:{connected:false}}));};
  const isConnected=()=>{const a=getAuth();return !!(a.apiKey&&a.token)};
  const authHeader=()=>{const a=getAuth();if(!a.apiKey||!a.token)throw new Error('Trello is not connected.');return `OAuth oauth_consumer_key="${a.apiKey}", oauth_token="${a.token}"`};

  async function request(path,{method='GET',params={},body=null,formData=null}={}){
    if(body!==null&&formData!==null)throw new Error('A Trello request cannot use JSON and FormData at the same time.');
    const url=new URL(`${API_ROOT}/${String(path).replace(/^\//,'')}`);
    Object.entries(params||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=='')url.searchParams.set(k,String(v))});
    const headers={Authorization:authHeader(),Accept:'application/json'};
    const opts={method,headers};
    if(body!==null){headers['Content-Type']='application/json';opts.body=JSON.stringify(body)}
    if(formData!==null)opts.body=formData;
    let res;
    try{res=await fetch(url,opts)}catch(err){throw new Error(`Could not reach Trello: ${err.message}`)}
    const text=await res.text();const data=text?safeParse(text)||text:null;
    if(!res.ok){
      if(res.status===401)clearAuth();
      const msg=(data&&data.message)||data||`${res.status} ${res.statusText}`;
      const e=new Error(`Trello request failed: ${msg}`);e.status=res.status;e.data=data;throw e;
    }
    return data;
  }

  function authorize({apiKey,expiration='30days',scope='read,write',rememberKey=false}={}){
    if(!apiKey) return Promise.reject(new Error('Enter a Trello API key first.'));
    sessionStorage.setItem(AUTH_KEY,JSON.stringify({apiKey,token:'',member:null,connectedAt:''}));
    if(rememberKey)localStorage.setItem(API_KEY_KEY,apiKey);else localStorage.removeItem(API_KEY_KEY);
    const returnUrl=new URL('trello-auth.html',location.href).href;
    const authUrl=new URL('https://trello.com/1/authorize');
    authUrl.searchParams.set('key',apiKey);
    authUrl.searchParams.set('name',"Nicole's Operations Suite");
    authUrl.searchParams.set('expiration',expiration);
    authUrl.searchParams.set('response_type','token');
    authUrl.searchParams.set('scope',scope);
    authUrl.searchParams.set('callback_method','fragment');
    authUrl.searchParams.set('return_url',returnUrl);
    return new Promise((resolve,reject)=>{
      let timer;
      const popup=window.open(authUrl.toString(),'nah-trello-auth','width=640,height=760,resizable=yes,scrollbars=yes');
      if(!popup){reject(new Error('The Trello authorization popup was blocked.'));return}
      const handler=async event=>{
        if(event.origin!==location.origin||!event.data||event.data.type!=='nah:trello-auth')return;
        cleanup();
        if(event.data.error){reject(new Error(event.data.error));return}
        try{
          setAuth({apiKey,token:event.data.token,connectedAt:new Date().toISOString()},{rememberKey});
          const member=await me();
          const current=getAuth();setAuth({...current,member},{rememberKey});
          resolve(member);
        }catch(err){reject(err)}
      };
      const cleanup=()=>{window.removeEventListener('message',handler);if(timer)clearInterval(timer)};
      window.addEventListener('message',handler);
      timer=setInterval(()=>{if(popup.closed){cleanup();reject(new Error('Trello authorization was closed before completion.'))}},700);
    });
  }

  const me=()=>request('members/me',{params:{fields:'id,fullName,username,avatarUrl'}});
  const boards=()=>request('members/me/boards',{params:{fields:'id,name,url,closed,dateLastActivity',filter:'open'}});
  const board=boardId=>request(`boards/${boardId}`,{params:{fields:'id,name,url,closed,dateLastActivity'}});
  const lists=boardId=>request(`boards/${boardId}/lists`,{params:{fields:'id,name,closed,pos',filter:'open'}});
  const cards=boardId=>request(`boards/${boardId}/cards`,{params:{fields:'id,name,desc,idList,due,dueComplete,dateLastActivity,url,closed',filter:'open',customFieldItems:'true'}});
  const createCard=data=>request('cards',{method:'POST',body:data});
  const updateCard=(id,data)=>request(`cards/${id}`,{method:'PUT',body:data});
  const addComment=(id,text)=>request(`cards/${id}/actions/comments`,{method:'POST',body:{text}});
  const createChecklist=(cardId,name,pos='bottom')=>request(`cards/${cardId}/checklists`,{method:'POST',params:{name,pos}});
  const addCheckItem=(checklistId,name,{pos='bottom',checked=false}={})=>request(`checklists/${checklistId}/checkItems`,{method:'POST',params:{name,pos,checked}});
  async function uploadAttachment(cardId,file,{name=file?.name||'attachment',setCover=false}={}){
    if(!(file instanceof Blob))throw new Error('Attachment must be a File or Blob.');
    const data=new FormData();
    data.append('file',file,name);
    data.append('name',name);
    data.append('setCover',setCover?'true':'false');
    return request(`cards/${cardId}/attachments`,{method:'POST',formData:data});
  }
  async function createIntakeCard({listId,name,desc,files=[],checklistName='Alteration Intake',checkItems=[],onProgress}={}){
    if(!listId)throw new Error('No Trello intake list is mapped.');
    if(!name)throw new Error('Card name is required.');
    const card=await createCard({idList:listId,name,desc,pos:'top'});
    const result={card,attachments:[],checklist:null,checkItems:[],warnings:[]};
    const total=files.length+checkItems.length+1;
    let completed=0;
    const report=(stage,detail='')=>{completed++;if(onProgress)onProgress({stage,detail,completed,total,percent:Math.min(100,Math.round(completed/Math.max(total,1)*100)),card})};
    for(let i=0;i<files.length;i++){
      const item=files[i];
      try{
        const attachment=await uploadAttachment(card.id,item.file||item,{name:item.name||(item.file||item).name,setCover:i===0});
        result.attachments.push(attachment);
      }catch(err){result.warnings.push(`Attachment ${i+1} failed: ${err.message}`)}
      report('attachment',item.name||(item.file||item).name||`Image ${i+1}`);
    }
    if(checkItems.length){
      try{
        result.checklist=await createChecklist(card.id,checklistName,'bottom');
        report('checklist',checklistName);
        for(const text of checkItems){
          try{result.checkItems.push(await addCheckItem(result.checklist.id,text))}catch(err){result.warnings.push(`Checklist item failed: ${text} — ${err.message}`)}
          report('check-item',text);
        }
      }catch(err){
        result.warnings.push(`Checklist creation failed: ${err.message}`);
        report('checklist',checklistName);
        for(const text of checkItems)report('check-item',text);
      }
    }else report('checklist','No checklist requested');
    return result;
  }

  const getSettings=()=>NAH_STORE.load().settings.trello||NAH_STORE.empty().settings.trello;
  const updateSettings=patch=>NAH_STORE.update(s=>{s.settings.trello={...s.settings.trello,...patch,mappings:{...s.settings.trello.mappings,...(patch.mappings||{})}};return s},{quiet:true});
  const mappedList=(type,r={})=>{
    const m=getSettings().mappings||{};
    if(type==='alterations'){
      const completed=['Returned / Verified','Completed—Scheduling','Completed Alterations to be scheduled','Scheduled / Ready','Ready for Client','Tailor Completed'].includes(r.status);
      return completed?(m.alterationsCompleted||m.alterationsActive):m.alterationsActive;
    }
    if(type==='inventory')return m.inventory;
    if(type==='shipments')return m.shipments;
    if(type==='orders')return (r.rush||r.rushDueDate||r.priority==='Critical')?(m.rush||m.orders):m.orders;
    return '';
  };
  const dueFor=(type,r)=>r.clientRequiredDate||r.etc||r.dueDate||r.rushDueDate||r.shipByDate||r.nextFollowUp||null;
  const clean=v=>v===undefined||v===null||v===''?'—':String(v);
  function cardTitle(type,r){
    const client=r.client||r.name||r.title||'Untitled';
    if(type==='alterations')return `${client} — ${r.garment||'Alteration'}${r.etc?` — ETC ${r.etc}`:''}${r.cof?` — COF ${r.cof}`:''}`;
    if(type==='inventory')return `${client} — ${r.garment||r.contents||'Inventory'}${r.cof?` — COF ${r.cof}`:''}`;
    if(type==='orders')return `${client} — ${r.garment||r.order||'Order'}${r.clientRequiredDate?` — Need ${r.clientRequiredDate}`:''}`;
    if(type==='shipments')return `${client} — ${r.contents||'Shipment'}${r.shipByDate?` — Ship ${r.shipByDate}`:''}`;
    return `${client} — ${type}`;
  }
  function cardDescription(type,r){
    const lines=[`NAH_SYNC|${type}|${r.id}`,'',`Client: ${clean(r.client)}`,`Order: ${clean(r.order)}`,`COF: ${clean(r.cof)}`];
    if(type==='alterations')lines.push(`Garment: ${clean(r.garment)}`,`Service Type: ${clean(r.serviceType)}`,`Provider: ${clean(r.provider)}`,`Status: ${clean(r.status)}`,`Location: ${clean(r.location)}`,`ETC: ${clean(r.etc)}`,`Client Required: ${clean(r.clientRequiredDate)}`,`Next Follow-Up: ${clean(r.nextFollowUp)}`,`Ticket / Return #: ${clean(r.ticketReturnNumber)}`,'',`Instructions: ${clean(r.instructions)}`,`Next Action: ${clean(r.nextAction)}`,`Notes: ${clean(r.notes)}`);
    if(type==='inventory')lines.push(`Garment: ${clean(r.garment||r.contents)}`,`Completeness: ${clean(r.completeness)}`,`Location: ${clean(r.location)}`,`Received: ${clean(r.receivedDate)}`,`Next Follow-Up: ${clean(r.nextFollowUp)}`,`Next Action: ${clean(r.nextAction)}`,`Notes: ${clean(r.notes)}`);
    if(type==='orders')lines.push(`Garment: ${clean(r.garment)}`,`Stage: ${clean(r.stage)}`,`Priority: ${clean(r.priority)}`,`Due Date: ${clean(r.dueDate)}`,`Rush Due: ${clean(r.rushDueDate)}`,`Client Required: ${clean(r.clientRequiredDate)}`,`Next Follow-Up: ${clean(r.nextFollowUp)}`,`Next Action: ${clean(r.nextAction)}`,`Notes: ${clean(r.notes)}`);
    if(type==='shipments')lines.push(`Contents: ${clean(r.contents)}`,`Status: ${clean(r.status)}`,`Physical Staging: ${r.physicalStage?'Yes':'No'}`,`Ship By: ${clean(r.shipByDate)}`,`Tracking: ${clean(r.tracking)}`,`Next Action: ${clean(r.nextAction)}`,`Notes: ${clean(r.notes)}`);
    lines.push('','Synced from Nicole\'s Operations Suite.');
    return lines.join('\n');
  }
  const marker=desc=>{const m=String(desc||'').match(/NAH_SYNC\|([^|\n]+)\|([^\s\n]+)/);return m?{type:m[1],id:m[2]}:null};
  const parseFields=desc=>{const out={};String(desc||'').split(/\r?\n/).forEach(line=>{const i=line.indexOf(':');if(i>0){const k=line.slice(0,i).trim().toLowerCase();const v=line.slice(i+1).trim();out[k]=v==='—'?'':v}});return out};
  async function syncRecord(type,record,{force=false}={}){
    if(!isConnected())return {status:'skipped',reason:'not-connected'};
    const settings=getSettings();if(!settings.enabled&&!force)return {status:'skipped',reason:'integration-disabled'};
    const idList=mappedList(type,record);if(!idList)return {status:'skipped',reason:'unmapped-list'};
    const payload={name:cardTitle(type,record),desc:cardDescription(type,record),idList,due:dueFor(type,record)||null};
    let card;
    if(record.trelloCardId){card=await updateCard(record.trelloCardId,payload)}else card=await createCard(payload);
    NAH_STORE.update(s=>{const arr=s.records[type]||[];const i=arr.findIndex(x=>x.id===record.id);if(i>=0)arr[i]={...arr[i],trelloCardId:card.id,trelloCardUrl:card.url,trelloListId:card.idList,trelloLastSyncedAt:new Date().toISOString(),trelloLastActivity:card.dateLastActivity||new Date().toISOString()};return s},{quiet:true});
    NAH_STORE.activity('trello',`${record.trelloCardId?'Updated':'Created'} Trello card: ${card.name}`,record.id);
    return {status:'synced',card};
  }
  async function syncAll({types=['alterations','inventory','orders','shipments'],force=true,onProgress}={}){
    const s=NAH_STORE.load();const report={synced:0,skipped:0,failed:0,details:[]};
    for(const type of types){for(const r of s.records[type]||[]){try{const result=await syncRecord(type,r,{force});report.details.push({type,id:r.id,...result});if(result.status==='synced')report.synced++;else report.skipped++}catch(err){report.failed++;report.details.push({type,id:r.id,status:'failed',reason:err.message})}if(onProgress)onProgress(report)}}
    updateSettings({lastPushAt:new Date().toISOString()});return report;
  }
  function reverseMappings(){const m=getSettings().mappings||{};const out={};Object.entries(m).forEach(([role,id])=>{if(id)out[id]=role});return out}
  function roleToType(role){if(role==='alterationsActive'||role==='alterationsCompleted')return'alterations';if(role==='inventory')return'inventory';if(role==='rush'||role==='orders')return'orders';if(role==='shipments')return'shipments';return''}
  function inferRecord(card,role){
    const f=parseFields(card.desc);const type=roleToType(role);const id=NAH_STORE.id(type.slice(0,3));const base={id,source:'trello',trelloCardId:card.id,trelloCardUrl:card.url,trelloListId:card.idList,trelloLastActivity:card.dateLastActivity,trelloLastSyncedAt:new Date().toISOString(),client:f.client||card.name.split(' — ')[0]||'Unknown',order:f.order||'',cof:f.cof||'',notes:f.notes||'',nextAction:f['next action']||'',updatedAt:new Date().toISOString()};
    if(type==='alterations')return {...base,garment:f.garment||card.name.split(' — ')[1]||'',serviceType:f['service type']||'',provider:f.provider||'',status:role==='alterationsCompleted'?'Returned / Verified':(f.status||'At Provider'),location:f.location||'',etc:(f.etc||card.due||'').slice(0,10),clientRequiredDate:(f['client required']||'').slice(0,10),nextFollowUp:(f['next follow-up']||'').slice(0,10),ticketReturnNumber:f['ticket / return #']||'',instructions:f.instructions||''};
    if(type==='inventory')return {...base,garment:f.garment||card.name.split(' — ')[1]||'',completeness:f.completeness||'Unknown Completeness',location:f.location||'Verify Location',receivedDate:(f.received||'').slice(0,10),nextFollowUp:(f['next follow-up']||'').slice(0,10)};
    if(type==='orders')return {...base,garment:f.garment||card.name.split(' — ')[1]||'',stage:f.stage||'',priority:role==='rush'?'Critical':(f.priority||'Review'),rush:role==='rush',dueDate:(f['due date']||card.due||'').slice(0,10),rushDueDate:(f['rush due']||'').slice(0,10),clientRequiredDate:(f['client required']||'').slice(0,10),nextFollowUp:(f['next follow-up']||'').slice(0,10)};
    if(type==='shipments')return {...base,contents:f.contents||card.name.split(' — ')[1]||'',status:f.status||'Open',physicalStage:/yes/i.test(f['physical staging']||''),shipByDate:(f['ship by']||card.due||'').slice(0,10),tracking:f.tracking||''};
    return base;
  }
  async function previewPull(){
    const settings=getSettings();if(!settings.boardId)throw new Error('Select a Trello board first.');
    const boardCards=await cards(settings.boardId),reverse=reverseMappings(),state=NAH_STORE.load();
    const result={cards:[],newCards:0,linked:0,conflicts:0,ignored:0};
    for(const card of boardCards){const role=reverse[card.idList];if(!role){result.ignored++;continue}const mark=marker(card.desc);const type=(mark&&mark.type)||roleToType(role);const local=mark&&state.records[type]?.find(x=>x.id===mark.id);let status='new';if(local){status='linked';result.linked++;const last=local.trelloLastSyncedAt?new Date(local.trelloLastSyncedAt):null;if(last&&new Date(card.dateLastActivity)>last&&new Date(local.updatedAt||0)>last){status='conflict';result.conflicts++}}else result.newCards++;result.cards.push({card,role,type,mark,local,status})}
    return result;
  }
  async function pull({strategy='safe'}={}){
    const preview=await previewPull();const state=NAH_STORE.load();let imported=0,updated=0,skipped=0;
    for(const item of preview.cards){const {card,role,type,local,status}=item;if(!type){skipped++;continue}
      if(status==='conflict'&&strategy==='safe'){skipped++;continue}
      if(local){
        const f=parseFields(card.desc);const patch={trelloCardId:card.id,trelloCardUrl:card.url,trelloListId:card.idList,trelloLastActivity:card.dateLastActivity,trelloLastSyncedAt:new Date().toISOString()};
        if(strategy==='trello'){
          if(type==='alterations'){patch.status=role==='alterationsCompleted'?'Returned / Verified':(f.status||local.status);patch.etc=(f.etc||card.due||local.etc||'').slice(0,10);patch.location=f.location||local.location}
          if(type==='orders'){patch.priority=role==='rush'?'Critical':(f.priority||local.priority);patch.dueDate=(f['due date']||card.due||local.dueDate||'').slice(0,10)}
          if(type==='shipments'){patch.status=f.status||local.status;patch.shipByDate=(f['ship by']||card.due||local.shipByDate||'').slice(0,10)}
          patch.nextAction=f['next action']||local.nextAction;
        }
        NAH_STORE.update(s=>{const arr=s.records[type]||[];const i=arr.findIndex(x=>x.id===local.id);if(i>=0)arr[i]={...arr[i],...patch,updatedAt:new Date().toISOString()};return s},{quiet:true});updated++;
      }else{
        const rec=inferRecord(card,role);NAH_STORE.update(s=>{s.records[type].unshift(rec);return s},{quiet:true});imported++;
      }
    }
    updateSettings({lastPullAt:new Date().toISOString()});NAH_STORE.activity('trello',`Pulled Trello board: ${imported} imported, ${updated} updated, ${skipped} skipped`);return {preview,imported,updated,skipped};
  }
  window.addEventListener('nah:record-upserted',event=>{const settings=getSettings();if(settings.enabled&&settings.syncMode==='auto'&&isConnected())syncRecord(event.detail.type,event.detail.item).catch(err=>console.warn('Trello auto-sync failed',err))});
  return {getAuth,setAuth,clearAuth,isConnected,authorize,request,me,boards,board,lists,cards,createCard,updateCard,addComment,createChecklist,addCheckItem,uploadAttachment,createIntakeCard,getSettings,updateSettings,mappedList,cardTitle,cardDescription,marker,parseFields,syncRecord,syncAll,previewPull,pull};
})();
