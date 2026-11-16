const copy=v=>JSON.parse(JSON.stringify(v));
let pendingUndo=null,undoTimer;
function removeTask(task){
 clearTimeout(undoTimer);document.getElementById('undoNotice')?.remove();
 pendingUndo={task:copy(task),index:tasks.indexOf(task)};
 tasks.splice(pendingUndo.index,1);persist();
 const notice=node('div','','undo-notice');notice.id='undoNotice';
 notice.append(node('span','Task deleted'),btn('Undo','Undo deletion',()=>{
  if(!pendingUndo)return;const {task,index}=pendingUndo;
  if(task.section&&!sections.includes(task.section))delete task.section;
  tasks.splice(Math.min(index,tasks.length),0,task);pendingUndo=null;
  clearTimeout(undoTimer);notice.remove();persist();
 }));document.getElementById('panel').append(notice);resize();
 undoTimer=setTimeout(()=>{pendingUndo=null;notice.remove();resize()},6000);
}
let sections=load('taskSections'),rounds=load('taskRounds'),editing=false,sectionColors=Object.create(null);
try{const state=JSON.parse(localStorage.getItem('todoStateV2'));if(state&&Array.isArray(state.tasks)&&Array.isArray(state.sections)&&Array.isArray(state.rounds)){tasks=state.tasks;sections=state.sections;rounds=state.rounds;Object.assign(sectionColors,state.sectionColors)}}catch{}
const baseRender=render;
function writeState(nextTasks=tasks,nextRounds=rounds){localStorage.setItem('todoStateV2',JSON.stringify({version:2,tasks:nextTasks,sections,sectionColors,rounds:nextRounds}))}
function storageError(){document.getElementById('storageError')?.remove();const el=node('div','Could not save. Current tasks are kept. Please free disk space and retry.');el.id='storageError';el.setAttribute('role','alert');document.getElementById('panel').append(el);resize()}
const archiveButton=document.getElementById('archive');
const archiveEmpty=node('span','No tasks to archive.','archive-empty');
const archiveStatus=node('div','','archive-status');
archiveStatus.setAttribute('role','status');
archiveButton.before(archiveEmpty);
document.getElementById('historyView').before(archiveStatus);
let archiveConfirm,archiving=false,archiveMessage='';

function closeArchiveConfirm(){
 archiveConfirm?.remove();
 archiveConfirm=null;
 archiveButton.disabled=!tasks.length;
}
function revealArchiveConfirm(focus){
 focus.focus({preventScroll:true});
 archiveConfirm.scrollIntoView({block:'nearest'});
}
function openArchiveConfirm(){
 if(!tasks.length||archiveConfirm||archiving)return;
 if(!fixed)lock();
 const box=node('div','','archiveConfirm');
 const error=node('div','','archive-error');
 error.setAttribute('role','alert');
 const confirm=btn('Confirm archive','Confirm archive',()=>archiveRound(error));
 const cancel=btn('Cancel','Cancel archive',()=>{closeArchiveConfirm();resize();archiveButton.focus()});
 const controls=node('div','','archive-controls');
 controls.append(cancel,confirm);
 box.append(node('div','Move all current tasks to History and start a new round?'),error,controls);
 archiveConfirm=box;
 archiveButton.disabled=true;
 archiveButton.after(box);
 resize();
 revealArchiveConfirm(confirm);
}
function archiveRound(error){
 if(archiving||!tasks.length||!archiveConfirm)return;
 archiving=true;
 let next;
 try{
  next=[{at:new Date().toISOString(),sections:copy(sections),sectionColors:copy(sectionColors),tasks:copy(tasks)},...rounds];
  // Commit the snapshot and the new round together before changing the screen.
  writeState([],next);
 }catch{
  error.textContent='Could not save the archive. Your current tasks are still here. Try again.';
  resize();
  archiveConfirm.scrollIntoView({block:'nearest'});
  return;
 }finally{archiving=false}
 const count=tasks.length;
 rounds=next;
 tasks=[];
 pendingUndo=null;
 clearTimeout(undoTimer);
 document.getElementById('undoNotice')?.remove();
 closeArchiveConfirm();
 archiveMessage=`Archived ${count} ${count===1?'task':'tasks'}. Your new round is ready.`;
 view='history';
 editing=false;
 render();
 document.getElementById('panel').scrollTop=0;
 document.getElementById('history').focus({preventScroll:true});
}
function renderArchive(){
 if(view!=='todo'||!tasks.length)closeArchiveConfirm();
 archiveButton.disabled=!tasks.length||!!archiveConfirm;
 archiveEmpty.hidden=!!tasks.length;
 if(view!=='history')archiveMessage='';
 archiveStatus.hidden=view!=='history'||!archiveMessage;
 archiveStatus.textContent=archiveMessage;
}
function copyTaskBack(t){const task=copy(t);task.done=false;if(!sections.includes(task.section))delete task.section;try{writeState([...tasks,task]);tasks.push(task);view='todo';render()}catch{storageError()}}
function persist(){try{writeState();render()}catch{storageError()}}
save=function(){try{localStorage.setItem('calendarEvents',JSON.stringify(events));writeState();render()}catch{storageError()}};
function btn(text,label,fn){const b=node('button',text);b.type='button';b.setAttribute('aria-label',label);b.onclick=fn;return b}
const validColor=c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c);
function sectionChip(name,color){const chip=node('span',name,'section-chip');if(validColor(color)){chip.style.backgroundColor=color;const [r,g,b]=color.slice(1).match(/../g).map(x=>{const v=parseInt(x,16)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});chip.style.color=.2126*r+.7152*g+.0722*b>.179?'#000':'#fff'}return chip}
function ask(label,value,done){if(!fixed)lock();document.getElementById('sectionPrompt')?.remove();const f=node('form');f.id='sectionPrompt';const l=node('label',label),input=node('input');input.value=value;input.required=true;input.maxLength=80;l.append(input);
const color=node('input');color.type='color';color.setAttribute('aria-label','Section color');const existing=sectionColors[value];color.value=validColor(existing)?existing:'#dedbc8';const mode=node('select');mode.setAttribute('aria-label','Section color mode');for(const name of ['No color','Color'])mode.append(node('option',name));mode.value=validColor(existing)?'Color':'No color';color.oninput=()=>{mode.value='Color'};
const submit=node('button','Save');submit.type='submit';f.append(l,mode,color,btn('Cancel','Cancel',()=>{f.remove();resize()}),submit);f.onsubmit=e=>{e.preventDefault();const v=input.value.trim();if(!v)return;if(sections.includes(v)&&v!==value){input.setCustomValidity('This section already exists');input.reportValidity();return}f.remove();done(v,mode.value==='Color'?color.value:null)};input.oninput=()=>input.setCustomValidity('');document.getElementById('panel').append(f);resize();input.focus()}
function setSectionColor(name,color){if(validColor(color))sectionColors[name]=color;else delete sectionColors[name]}
const sectionManager=node('div','','section-manager');sectionManager.hidden=true;document.getElementById('taskActions').before(sectionManager);
function renderSectionManager(){sectionManager.hidden=view!=='todo'||!editing;sectionManager.replaceChildren();if(sectionManager.hidden)return;sectionManager.append(node('div','Manage sections'));sections.forEach((name,i)=>{const row=node('div','','section-manager-row');const reorder=delta=>{const j=i+delta;if(j<0||j>=sections.length)return;[sections[i],sections[j]]=[sections[j],sections[i]];persist()};row.append(sectionChip(name,sectionColors[name]),btn('Edit','Edit section '+name,()=>ask('Edit section',name,(v,color)=>{sections[i]=v;tasks.forEach(t=>{if(t.section===name)t.section=v});delete sectionColors[name];setSectionColor(v,color);persist()})),btn('↑','Move section up',()=>reorder(-1)),btn('↓','Move section down',()=>reorder(1)),btn('×','Delete section and keep tasks unsorted',()=>{sections.splice(i,1);delete sectionColors[name];tasks.forEach(t=>{if(t.section===name)delete t.section});persist()}));sectionManager.append(row)})}
function groups(host,items,names,historical=false,colors=sectionColors){['',...names].forEach(name=>{if(name&&items.some(t=>t.section===name)){const head=node('div','','section-head');head.append(sectionChip(name,colors[name]));host.append(head)}items.filter(t=>(t.section||'')===name).forEach(t=>{const row=node('div','','task'+(t.done?' done':'')),check=btn(t.done?'✓':'','Toggle completion',()=>{if(!historical){t.done=!t.done;persist()}});check.className='check';check.disabled=historical;check.setAttribute('aria-pressed',String(!!t.done));row.append(check,node('span',t.text,'label'+(/^[A-Za-z]/.test(t.text)?' english':'')));if(editing&&!historical){const select=node('select');select.setAttribute('aria-label','Move task to section');['',...sections].forEach(s=>{const o=node('option',s||'Unsorted');o.value=s;o.selected=s===(t.section||'');select.append(o)});select.onchange=()=>{t.section=select.value;persist()};row.append(select,btn('×','Delete task',()=>{removeTask(t)}))}if(historical)row.append(btn('↩','Copy task to Tasks',()=>copyTaskBack(t)));host.append(row)})})}
render=function(){baseRender();const h=document.getElementById('historyView');h.hidden=view!=='history';document.getElementById('history').classList.toggle('active',view==='history');document.getElementById('taskActions').hidden=view!=='todo';document.getElementById('edit').hidden=view!=='todo';document.getElementById('edit').textContent=editing?'Done':'Edit';document.getElementById('newSection').hidden=!editing;document.getElementById('plus').hidden=view==='history';if(view==='todo'){const list=document.getElementById('list');list.replaceChildren();groups(list,tasks,sections);if(!tasks.length)list.append(node('div','Add your first task with +','empty'))}if(view==='history'){h.replaceChildren();if(!rounds.length)h.append(node('div','No archived rounds yet','empty'));[...rounds].sort((a,b)=>new Date(b.at)-new Date(a.at)).forEach((r,i)=>{const d=node('details'),s=node('summary');d.open=i===0;s.append(node('span',new Date(r.at).toLocaleString('en-US')),node('span',r.tasks.filter(t=>t.done).length+'/'+r.tasks.length));d.append(s);groups(d,r.tasks,r.sections,true,r.sectionColors||Object.create(null));h.append(d)})}resize()};
const renderWithArchive=render;render=function(){renderWithArchive();renderArchive();renderSectionManager();if(view!=='todo'||!editing&&document.getElementById('plus').hidden)document.getElementById('sectionPrompt')?.remove()};
document.getElementById('history').onclick=()=>change('history');document.getElementById('edit').onclick=()=>{editing=!editing;if(!editing)document.getElementById('sectionPrompt')?.remove();if(editing&&!fixed)lock();render()};document.getElementById('newSection').onclick=()=>ask('New section','',(v,color)=>{sections.push(v);setSectionColor(v,color);persist()});archiveButton.onclick=openArchiveConfirm;
tasks.forEach(t=>{if(t.section&&!sections.includes(t.section))sections.push(t.section)});render();


// Section selection while creating a task; existing Edit controls remain available.
const taskSectionBox=node('div','','taskSectionBox'),taskSection=node('select');taskSection.id='taskSection';taskSection.setAttribute('aria-label','Task section');
const sectionLabel=node('label','Section ');sectionLabel.append(taskSection);
taskSectionBox.append(sectionLabel,btn('+ New section','Create section for new task',()=>ask('New section','',(name,color)=>{sections.push(name);setSectionColor(name,color);persist();refreshTaskSections();taskSection.value=name;resize()})));
document.getElementById('eventFields').before(taskSectionBox);
function refreshTaskSections(){const current=taskSection.value;taskSection.replaceChildren();['',...sections].forEach(name=>{const option=node('option',name||'Unsorted');option.value=name;taskSection.append(option)});taskSection.value=sections.includes(current)?current:'';taskSectionBox.hidden=view!=='todo'}
const renderWithSections=render;render=function(){renderWithSections();refreshTaskSections()};
const addTaskClick=document.getElementById('plus').onclick;document.getElementById('plus').onclick=e=>{refreshTaskSections();addTaskClick(e)};
refreshTaskSections();
