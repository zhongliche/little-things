const KEY = 'shunshou.tasks.v1';
const starter = [
  {id:'seed-1',title:'买一瓶洗衣液',type:'buy',created:Date.now()-7200000,reminder:null,focus:true,done:false},
  {id:'seed-2',title:'给妈妈回个电话',type:'do',created:Date.now()-3600000,reminder:null,focus:true,done:false},
  {id:'seed-3',title:'看看浴室置物架',type:'idea',created:Date.now()-1200000,reminder:null,focus:false,done:false}
];
let tasks = readTasks();
let selectedType = 'do';
let activeFilter = 'all';
let toastTimer;
const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
const typeInfo = {buy:['想买','🛍️'],do:['要做','☀️'],idea:['随手记','✎']};

function readTasks(){try{const saved=localStorage.getItem(KEY);return saved?JSON.parse(saved):starter}catch{return starter}}
function save(){localStorage.setItem(KEY,JSON.stringify(tasks));render()}
function updateGreeting(){const hour=new Date().getHours();const greeting=hour<5||hour>=23?'夜深了':hour<11?'早上好':hour<13?'中午好':hour<18?'下午好':'晚上好';const title=$('#greeting');if(title?.firstChild)title.firstChild.textContent=`${greeting}，零`}
function dateLabel(){const d=new Date();return `${d.getMonth()+1}月${d.getDate()}日 · ${['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]}`}
function reminderLabel(value){if(!value)return '';const time=new Date(value);if(time<new Date())return '现在可以看一下';return `${time.getMonth()+1}/${time.getDate()} ${String(time.getHours()).padStart(2,'0')}:${String(time.getMinutes()).padStart(2,'0')}`}
function esc(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function taskCard(task,{allowFocus=false,compact=false}={}){
 const [label,icon]=typeInfo[task.type]||typeInfo.idea;
 return `<article class="task-card glass ${task.done?'completed':''} ${compact?'compact':''}" data-id="${esc(task.id)}"><input class="task-check" type="checkbox" ${task.done?'checked':''} aria-label="${task.done?'取消完成':'完成'}：${esc(task.title)}"><div class="task-main"><span class="task-title">${esc(task.title)}</span><div class="task-meta"><span class="task-tag ${task.type==='buy'?'buy':''}">${icon} ${label}</span>${task.reminder?`<span class="task-reminder">◷ ${esc(reminderLabel(task.reminder))}</span>`:''}</div></div><div class="task-actions">${allowFocus&&!task.focus&&!task.done?'<button class="mini-action" data-action="focus">今天做</button>':''}${task.reminder&&!task.done?'<button class="mini-action" data-action="snooze">延后</button>':''}</div></article>`
}
function render(){
 const open=tasks.filter(t=>!t.done).sort((a,b)=>b.created-a.created), focused=tasks.filter(t=>t.focus&&!t.done).sort((a,b)=>a.created-b.created);
 $('#topDate').textContent=dateLabel();
 $('#focusCount').textContent=`${focused.length} / 3`;
 $('#focusList').innerHTML=focused.length?focused.slice(0,3).map(t=>taskCard(t)).join(''):`<div class="empty-state glass"><span>☁️</span><strong>今天先留一点空白</strong><p>从小事篮挑一件，放进今日聚焦。</p><button class="text-button" data-nav="pool">去挑一件 →</button></div>`;
 $('#inboxCount').textContent=open.length;
 $('#recentList').innerHTML=open.filter(t=>!t.focus).slice(0,2).map(t=>taskCard(t,{compact:true,allowFocus:true})).join('')||'<p class="subcopy" style="padding:0 2px">新的念头都会在这里等你。</p>';
 $('#poolList').innerHTML=open.filter(t=>activeFilter==='all'||t.type===activeFilter).map(t=>taskCard(t,{allowFocus:true})).join('');
 $('#emptyPool').classList.toggle('hidden',open.filter(t=>activeFilter==='all'||t.type===activeFilter).length>0);
 $('#allCount').textContent=open.length;
 $('#navBadge').classList.toggle('hidden',!open.length);
 $$('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===activeFilter));
 checkReminders();
}
function showToast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2500)}
function openCapture(){selectedType='do';$$('.type-chip').forEach(b=>b.classList.toggle('active',b.dataset.type===selectedType));$('#taskTitle').value='';$('#reminderChoice').value='';$('#captureDialog').showModal();setTimeout(()=>$('#taskTitle').focus(),100)}
function reminderTime(choice){const d=new Date();if(choice==='hour')d.setHours(d.getHours()+1);if(choice==='evening'){d.setHours(20,0,0,0);if(d<=new Date())d.setDate(d.getDate()+1)}if(choice==='tomorrow'){d.setDate(d.getDate()+1);d.setHours(10,0,0,0)}return choice?d.getTime():null}
function checkReminders(){const now=Date.now();const due=tasks.find(t=>!t.done&&t.reminder&&t.reminder<=now&&!t.notified);if(due){due.notified=true;localStorage.setItem(KEY,JSON.stringify(tasks));showToast(`温柔提醒：${due.title}`);if('Notification'in window&&Notification.permission==='granted'&&document.visibilityState==='visible')new Notification('顺手提醒你',{body:due.title,icon:'icon.svg'})}}
function navigate(name){$$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));$$('.nav-item[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));window.scrollTo({top:0,behavior:'smooth'})}
function completeTask(id,done){const task=tasks.find(t=>t.id===id);if(!task)return;task.done=done;if(done){task.focus=false;showToast('顺手完成一件，真不错 ✨')}save()}
function setFocus(id){const count=tasks.filter(t=>t.focus&&!t.done).length;if(count>=3){showToast('今日聚焦最多放三件，给自己留点空白');return}const task=tasks.find(t=>t.id===id);if(task){task.focus=true;save();showToast('放进今天了，慢慢来就好') }}
function snooze(id){const task=tasks.find(t=>t.id===id);if(task){task.reminder=Date.now()+60*60*1000;task.notified=false;save();showToast('好，过一小时再轻轻提醒你')}}

$('#topDate').textContent=dateLabel();
$('#captureOpen').addEventListener('click',openCapture);$('#captureOpenPool').addEventListener('click',openCapture);$('#captureNav').addEventListener('click',openCapture);
$('.close-button').addEventListener('click',()=>$('#captureDialog').close());
document.addEventListener('click',e=>{const nav=e.target.closest('[data-nav]');if(nav)navigate(nav.dataset.nav)});
$$('.type-chip').forEach(b=>b.addEventListener('click',()=>{selectedType=b.dataset.type;$$('.type-chip').forEach(x=>x.classList.toggle('active',x===b))}));
$('#captureForm').addEventListener('submit',e=>{e.preventDefault();const title=$('#taskTitle').value.trim();if(!title)return;const reminder=reminderTime($('#reminderChoice').value);tasks.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),title,type:selectedType,created:Date.now(),reminder,focus:false,done:false,notified:false});$('#captureDialog').close();save();showToast('收到了，先替你放好 🌱');if(reminder&&'Notification'in window&&Notification.permission==='default')Notification.requestPermission().catch(()=>{}) });
$$('.filter').forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter;render()}));
document.addEventListener('change',e=>{if(e.target.matches('.task-check'))completeTask(e.target.closest('[data-id]').dataset.id,e.target.checked)});
document.addEventListener('click',e=>{const action=e.target.closest('[data-action]');if(action){const id=action.closest('[data-id]').dataset.id;if(action.dataset.action==='focus')setFocus(id);if(action.dataset.action==='snooze')snooze(id)}});
function chooseDecision(random){const question=$('#decisionQuestion').value.trim();const choices=$('#decisionOptions').value.split(/\n|,|，/).map(x=>x.trim()).filter(Boolean);const out=$('#decisionResult');if(choices.length<2){out.classList.remove('hidden');out.innerHTML='先写下至少两个选项，我们再一起往前走一点。';return}const selected=choices[Math.floor(Math.random()*choices.length)];out.classList.remove('hidden');out.innerHTML=`${random?'给纠结一个轻轻的暂停键':'先试着选一个小方向'}${question?`<br><span>${esc(question)}</span>`:''}<strong>${esc(selected)}</strong><span>　试试看这个选择给你的感觉，再决定要不要采纳。</span>`}
$('#chooseForMe').addEventListener('click',()=>chooseDecision(false));$('#coinFlip').addEventListener('click',()=>chooseDecision(true));
$$('[data-decision]').forEach(b=>b.addEventListener('click',()=>{navigate('decide');$('#decisionQuestion').value=b.dataset.decision==='buy'?'我该不该买这个？':'我现在做还是稍后做？';$('#decisionOptions').value=b.dataset.decision==='buy'?'现在买\n先放进愿望清单':'现在做一点\n稍后再做';$('#decisionQuestion').focus()}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkReminders()});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();openCapture()}});
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
updateGreeting();
setInterval(updateGreeting,60*1000);
render();
