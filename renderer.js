const $=s=>document.querySelector(s);function load(k){try{const v=JSON.parse(localStorage.getItem(k));return Array.isArray(v)?v:[]}catch{return []}}let tasks=load('tasks'),events=load('calendarEvents'),view='todo',fixed=false,expanded=false,selected='',month=new Date(),drag=null,moved=false,timer;month.setDate(1);
function resize(){if(expanded)requestAnimationFrame(()=>window.desktop.expand({width:view==='calendar'?520:320,height:Math.min(720,Math.ceil($('#panel').scrollHeight+2))}))}
function expand(open){if(!open&&fixed)return;expanded=open;document.body.classList.toggle('expanded',open);document.getElementById("orb").textContent=open?"⚲":String(tasks.filter(t=>!t.done).length);$('#panel').hidden=!open;if(open)resize();else window.desktop.expand(false)}
let composing=false,pointerOutside=false;
function busy(){return composing||!!document.querySelector('#panel form:not([hidden]),.tagPopup:not([hidden])')||!!document.activeElement?.matches('input,textarea,select,[contenteditable=true]')}
function cancelCollapse(){clearTimeout(timer);timer=null}
function scheduleCollapse(){if(fixed||drag||busy()){cancelCollapse();return}if(timer)return;timer=setTimeout(()=>{timer=null;if(pointerOutside&&!fixed&&!drag&&!busy())expand(false)},160)}
function outside(){pointerOutside=true;document.body.classList.add('away');scheduleCollapse()}
$('#orb').onmouseenter=()=>{pointerOutside=false;cancelCollapse();expand(true)};
document.body.onmouseenter=()=>{pointerOutside=false;cancelCollapse();document.body.classList.remove('away')};document.body.onmouseleave=outside;
window.desktop.onPointerOutside(()=>{if(expanded)outside()});
document.addEventListener('focusin',()=>{cancelCollapse();document.body.classList.remove('away')});
document.addEventListener('focusout',()=>setTimeout(()=>{if(pointerOutside)scheduleCollapse()},0));
document.addEventListener('compositionstart',()=>{composing=true;cancelCollapse()});document.addEventListener('compositionend',()=>{composing=false;if(pointerOutside)scheduleCollapse()});
new MutationObserver(()=>{if(pointerOutside)scheduleCollapse()}).observe($('#panel'),{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
function lock(){cancelCollapse();fixed=!fixed;window.desktop.setPinned(fixed);document.getElementById("orb").setAttribute("aria-pressed",String(fixed));document.getElementById("orb").title=fixed?"已固定，点击解除固定":"点击固定";document.body.classList.toggle('pinned',fixed);document.body.classList.remove('away');$('#lock').textContent=fixed?'Unpin':'Pin';expand(true);if(!fixed&&pointerOutside)scheduleCollapse()}$('#lock').onclick=lock;let pressOrigin=null;
$('#orb').onpointerdown=e=>{if(e.button!==0)return;cancelCollapse();pressOrigin=[e.screenX,e.screenY];drag=[e.screenX,e.screenY];moved=false;e.currentTarget.setPointerCapture(e.pointerId);e.preventDefault()};
$('#orb').onpointermove=e=>{if(!drag)return;if(!moved&&Math.hypot(e.screenX-pressOrigin[0],e.screenY-pressOrigin[1])<8)return;moved=true;const delta=[e.screenX-drag[0],e.screenY-drag[1]];drag=[e.screenX,e.screenY];window.desktop.move(delta)};
$('#orb').onpointerup=e=>{if(!drag)return;const wasDrag=moved;drag=null;pressOrigin=null;if(wasDrag)window.desktop.dragEnd();else lock();e.preventDefault()};
$('#orb').onclick=e=>e.preventDefault();
$('#orb').onpointercancel=()=>{drag=null;pressOrigin=null;moved=false};
$('#close').onclick=()=>window.desktop.close();
function save(){localStorage.setItem('tasks',JSON.stringify(tasks));localStorage.setItem('calendarEvents',JSON.stringify(events));render()}
function node(tag,text,cls){const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el}
function render(){const remaining=tasks.filter(t=>!t.done).length;document.getElementById('orb').textContent=expanded?'⚲':String(remaining);document.getElementById('orb').setAttribute('aria-label',remaining+' incomplete tasks');document.body.classList.toggle('calendar',view==='calendar');const list=$('#list');list.replaceChildren();list.hidden=view!=='todo';$('#calendarView').hidden=view!=='calendar';$('#todo').classList.toggle('active',view==='todo');$('#calendar').classList.toggle('active',view==='calendar');tasks.forEach((t,i)=>{const row=node('div','','task'+(t.done?' done':'')),check=node('button',t.done?'✓':'','check');check.setAttribute('aria-label',t.done?'取消完成':'标记完成');check.setAttribute('aria-pressed',String(!!t.done));check.onclick=()=>{t.done=!t.done;save()};const del=node('button','×','delete');del.title='删除';del.onclick=()=>{tasks.splice(i,1);save()};row.append(check,node('span',t.text,'label'),del);list.append(row)});if(!tasks.length)list.append(node('div','Add your first task with +','empty'));drawCalendar();resize()}
function key(d){return `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
function drawCalendar(){$('#month').textContent=month.toLocaleDateString('en-US',{month:'long',year:'numeric'});const grid=$('#grid');grid.replaceChildren();for(let i=0;i<(month.getDay()+6)%7;i++)grid.append(node('span',''));const n=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();for(let d=1;d<=n;d++){const date=key(d),b=node('button','',selected===date?'selected':'');b.append(node('span',String(d),'daynumber'));events.filter(t=>t.date===date).forEach(t=>{const title=node('span',t.text,'eventTitle');title.title=t.text;b.append(title)});b.onclick=()=>{selected=date;document.querySelector('form').hidden=true;drawCalendar();resize()};grid.append(b)}const detail=$('#dayDetail');detail.replaceChildren();detail.hidden=!selected;grid.hidden=!!selected;document.querySelector('#calendarView .week').hidden=!!selected;document.querySelector('#calendarView .month').hidden=!!selected;if(selected){const back=node('button','‹ Back to calendar','backCalendar');back.onclick=()=>{selected='';document.querySelector('form').hidden=true;drawCalendar();resize()};detail.append(back,node('h3',selected));const items=events.filter(t=>t.date===selected).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));if(!items.length)detail.append(node('div','No events','empty'));items.forEach(t=>{const row=node('div','','eventRow'),del=node('button','×','delete');del.title='删除日历活动';del.onclick=()=>{events.splice(events.indexOf(t),1);save()};row.append(node('span',t.text),del,node('div','Time: '+(t.time||'Not specified'),'meta'),node('div','Place: '+(t.place||'Not specified'),'meta'));detail.append(row)})}}
function change(v){view=v;$('form').hidden=true;selected='';render()}$('#todo').onclick=()=>change('todo');$('#calendar').onclick=()=>change('calendar');$('#prev').onclick=()=>{month.setMonth(month.getMonth()-1);selected='';render()};$('#next').onclick=()=>{month.setMonth(month.getMonth()+1);selected='';render()};$('#plus').onclick=()=>{const form=$('form');form.hidden=!form.hidden;$('#eventFields').hidden=view!=='calendar';$('#date').required=view==='calendar';if(view==='calendar')$('#date').value=selected||key(new Date().getMonth()===month.getMonth()?new Date().getDate():1);resize();if(!form.hidden)$('#text').focus()};$('#cancel').onclick=()=>{$('form').hidden=true;resize()};$('form').onsubmit=e=>{e.preventDefault();const text=$('#text').value.trim();if(!text)return;if(view==='todo')tasks.push({text,done:false,section:document.getElementById('taskSection')?.value||''});else events.push({text,date:$('#date').value,time:$('#time').value,place:$('#place').value.trim()});$('form').reset();$('form').hidden=true;save()};new ResizeObserver(resize).observe($('#panel'));render();




window.desktop.onLayout(l=>{const orb=document.getElementById('orb'),panel=document.getElementById('panel');orb.style.position='absolute';orb.style.left=(l?l.orb.x:4)+'px';orb.style.top=(l?l.orb.y:4)+'px';if(l){document.body.classList.toggle("opens-left",l.side==="left");panel.style.left=l.panel.x+'px';panel.style.top=l.panel.y+'px';panel.style.width=l.panel.width+'px';panel.style.maxHeight=l.panel.height+'px'}});





// Optional idle translucency, remembered across launches.
let idleFade = localStorage.getItem('idleFade') === 'true';
const fadeToggle = document.getElementById('fadeToggle');
function applyIdleFade() {
 document.body.classList.toggle('idle-fade-enabled', idleFade);
 fadeToggle.textContent = 'Auto fade: ' + (idleFade ? 'On' : 'Off');
 fadeToggle.setAttribute('aria-pressed', String(idleFade));
}
fadeToggle.onclick = () => { idleFade = !idleFade; localStorage.setItem('idleFade', String(idleFade)); applyIdleFade(); };
applyIdleFade();



const resetPositionButton=document.getElementById('resetPosition');
let resetFeedbackTimer;
resetPositionButton.addEventListener('click',()=>window.desktop.resetPosition());
window.desktop.onPositionReset(()=>{
 clearTimeout(resetFeedbackTimer);
 resetPositionButton.textContent='Position reset';
 resetFeedbackTimer=setTimeout(()=>{resetPositionButton.textContent='Reset Position'},1400);
 const orb=document.getElementById('orb');
 orb.getAnimations().filter(animation=>animation.id==='position-reset').forEach(animation=>animation.cancel());
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
  orb.animate([{outline:'3px solid #9c937d'},{outline:'3px solid transparent'}],{duration:1100}).id='position-reset';
 }
});
