window.NAH_STORE=(()=>{
  const MODE_KEY='nah.storageMode.v2';
  const DATA_KEY='nah.workspace.v2';
  const empty=()=>({
    schema:'nicole-ops.workspace.v2',updatedAt:new Date().toISOString(),
    settings:{officeName:"Nicole's Operations Suite",salesProfessional:'Nicole Arbogast',storeNumber:'306',assistantName:'',storageMode:'session',setupDismissed:false,
      locations:['Receiving Rack','Main Rack','Shelf / Bin','Alteration Intake','Factory Return Area','Next-Day Staging','Shipping Rack','With Nicole','At Gegi','At Naziha','At Factory','Cleaner / Repair','Client Received','Verify Location'],
      providers:['Gegi','Naziha','In Shop','EA / English American','Oxxford','Individualized Shirts','Measure Up','Blue Delta','Cleaner / Repair']},
    records:{alterations:[],inventory:[],orders:[],shipments:[],tasks:[],contacts:[],backOffice:[],lookbooks:[]},
    training:{completed:[],scenarioScores:[],startedAt:''},activity:[]
  });
  const getMode=()=>{try{return localStorage.getItem(MODE_KEY)||'session'}catch{return 'session'}};
  const engine=(mode=getMode())=>mode==='local'?localStorage:sessionStorage;
  const safeParse=(text)=>{try{return JSON.parse(text)}catch{return null}};
  function normalize(data){
    const base=empty(); if(!data||typeof data!=='object')return base;
    const out={...base,...data,settings:{...base.settings,...(data.settings||{})},records:{...base.records,...(data.records||{})},training:{...base.training,...(data.training||{})}};
    Object.keys(base.records).forEach(k=>{if(!Array.isArray(out.records[k]))out.records[k]=[]});
    if(!Array.isArray(out.activity))out.activity=[];return out;
  }
  function load(){try{return normalize(safeParse(engine().getItem(DATA_KEY)))}catch{return empty()}}
  function save(data,opts={}){const state=normalize(data);state.updatedAt=new Date().toISOString();try{engine().setItem(DATA_KEY,JSON.stringify(state));window.dispatchEvent(new CustomEvent('nah:workspace-change',{detail:{state,quiet:opts.quiet}}));return state}catch(e){console.warn(e);return state}}
  function update(mutator,opts={}){const state=load();const next=mutator(state)||state;return save(next,opts)}
  function id(prefix='rec'){return crypto?.randomUUID?`${prefix}-${crypto.randomUUID()}`:`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`}
  function activity(type,message,recordId=''){update(s=>{s.activity.unshift({id:id('act'),type,message,recordId,at:new Date().toISOString()});s.activity=s.activity.slice(0,100);return s},{quiet:true})}
  function upsert(type,record,logMessage=''){
    const item={...record,id:record.id||id(type.slice(0,3)),updatedAt:new Date().toISOString()};
    update(s=>{const arr=s.records[type]||(s.records[type]=[]);const idx=arr.findIndex(x=>x.id===item.id);if(idx>=0)arr[idx]={...arr[idx],...item};else arr.unshift(item);return s},{quiet:true});
    activity(type,logMessage||`${idxText(record.id)} ${type.slice(0,-1)||type}: ${item.client||item.title||item.name||'record'}`,item.id);return item;
  }
  const idxText=(existing)=>existing?'Updated':'Added';
  function remove(type,id){update(s=>{s.records[type]=(s.records[type]||[]).filter(x=>x.id!==id);return s},{quiet:true});activity(type,`Removed ${type.slice(0,-1)||type}`,id)}
  function setMode(mode){if(!['session','local'].includes(mode))return;const current=load();try{const old=engine();localStorage.setItem(MODE_KEY,mode);engine(mode).setItem(DATA_KEY,JSON.stringify({...current,settings:{...current.settings,storageMode:mode}}));if(old!==engine(mode))old.removeItem(DATA_KEY)}catch{}window.dispatchEvent(new CustomEvent('nah:workspace-change',{detail:{state:load()}}))}
  function exportWorkspace(){return JSON.stringify(load(),null,2)}
  function importWorkspace(data){const parsed=typeof data==='string'?safeParse(data):data;if(!parsed)throw new Error('Invalid workspace JSON');save(normalize(parsed));activity('workspace','Imported workspace backup');return load()}
  function clear(){try{engine().removeItem(DATA_KEY)}catch{}window.dispatchEvent(new CustomEvent('nah:workspace-change',{detail:{state:load()}}))}
  function stats(state=load()){
    const now=new Date();const iso=d=>d?new Date(`${d}T12:00:00`):null;const days=d=>{const x=iso(d);return x?Math.ceil((x-now)/86400000):null};
    const activeAlt=state.records.alterations.filter(x=>!['Closed','Client Returned / Closed'].includes(x.status));
    const criticalAlt=activeAlt.filter(x=>x.location==='Verify Location'||(days(x.etc)!==null&&days(x.etc)<0)||(days(x.clientRequiredDate)!==null&&days(x.clientRequiredDate)<=3));
    const riskOrders=state.records.orders.filter(x=>x.priority==='Critical'||x.priority==='High'||(days(x.clientRequiredDate)!==null&&days(x.clientRequiredDate)<=7));
    const inventoryNeeds=state.records.inventory.filter(x=>!x.location||x.location==='Verify Location'||!x.nextAction||x.completeness==='Unknown Completeness');
    const shippingOpen=state.records.shipments.filter(x=>!['Delivered','Closed'].includes(x.status));
    const tasksOpen=state.records.tasks.filter(x=>!x.complete);
    return {activeAlt:activeAlt.length,criticalAlt:criticalAlt.length,riskOrders:riskOrders.length,inventoryNeeds:inventoryNeeds.length,shippingOpen:shippingOpen.length,tasksOpen:tasksOpen.length,total:Object.values(state.records).reduce((n,a)=>n+a.length,0)};
  }
  return {load,save,update,upsert,remove,setMode,getMode,exportWorkspace,importWorkspace,clear,id,activity,stats,empty};
})();
