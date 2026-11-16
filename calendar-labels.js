let calendarTags=load('calendarTags'),calendarFilter=new Set(),tagMenu='';
const calendarHost=document.getElementById('calendarView'),tools=node('div','','calendarTools'),tagPopup=node('div','','tagPopup');calendarHost.prepend(tools,tagPopup);
function tagButton(text,fn){const b=node('button',text);b.type='button';b.onclick=fn;return b}
function writeTags(){localStorage.setItem('calendarTags',JSON.stringify(calendarTags));save()}
function matchesLabel(e){return calendarFilter.size===0||calendarFilter.has(calendarTags.some(t=>t.id===e.tag)?e.tag:'untagged')}
function eventColor(e){return calendarTags.find(t=>t.id===e.tag)?.color||'#dce0da'}
function contrast(hex){const n=hex.slice(1);return parseInt(n.slice(0,2),16)*.299+parseInt(n.slice(2,4),16)*.587+parseInt(n.slice(4,6),16)*.114<145?'#fff':'#202723'}
function labelSelect(event){const select=node('select');select.setAttribute('aria-label','Event tag');[{id:'',name:'Untagged'},...calendarTags].forEach(t=>{const o=node('option',t.name);o.value=t.id;o.selected=t.id===(event.tag||'');select.append(o)});return select}
const eventTag=labelSelect({});eventTag.id='eventTag';document.getElementById('eventFields').append(eventTag,tagButton('+ New tag',()=>inlineTag(eventTag)));
const originalSubmit=document.querySelector('form').onsubmit;document.querySelector('form').onsubmit=e=>{const before=events.length,tag=eventTag.value;originalSubmit(e);if(events.length>before){events[events.length-1].tag=tag;save()}};
const calendarBase=drawCalendar;
drawCalendar=function(){calendarBase();tools.replaceChildren(tagButton('Filter'+(calendarFilter.size?' · '+calendarFilter.size:''),()=>{tagMenu=tagMenu==='filter'?'':'filter';drawCalendar();resize()}),tagButton('Tags',()=>{tagMenu=tagMenu==='tags'?'':'tags';drawCalendar();resize()}));tagPopup.hidden=!tagMenu;tagPopup.replaceChildren();if(tagMenu==='filter'){const choices=node('div','','tagChoices');[{id:'all',name:'All'},...calendarTags,{id:'untagged',name:'Untagged'}].forEach(t=>{const active=t.id==='all'?calendarFilter.size===0:calendarFilter.has(t.id),b=tagButton((active?'✓ ':'')+t.name,()=>{if(t.id==='all')calendarFilter.clear();else if(calendarFilter.has(t.id))calendarFilter.delete(t.id);else calendarFilter.add(t.id);writeTags()});b.setAttribute('aria-pressed',String(active));choices.append(b)});tagPopup.append(choices)}if(tagMenu==='tags'){calendarTags.forEach(t=>{const row=node('div','','tagRow'),color=node('input'),name=node('input');color.type='color';color.value=t.color;color.setAttribute('aria-label','Tag color');color.onchange=()=>{t.color=color.value;writeTags()};name.value=t.name;name.type='text';name.maxLength=40;name.setAttribute('aria-label','Tag name');name.onchange=()=>{t.name=name.value.trim()||'Tag';writeTags()};row.append(color,name,tagButton('×',()=>{events.forEach(e=>{if(e.tag===t.id)delete e.tag});calendarTags=calendarTags.filter(x=>x!==t);calendarFilter.delete(t.id);writeTags()}));tagPopup.append(row)});tagPopup.append(tagButton('+ New tag',()=>{calendarTags.push({id:crypto.randomUUID(),name:'New tag',color:'#c8d9ec'});writeTags()}))}if(tagMenu)tagPopup.append(tagButton('Done',()=>{tagMenu='';drawCalendar();resize()}));
// Rebuild both month cells and day detail using the same OR filter.
const grid=document.getElementById('grid');grid.querySelectorAll('.eventTitle').forEach(n=>n.remove());grid.querySelectorAll('button').forEach(b=>{const d=Number(b.querySelector('.daynumber').textContent);events.filter(e=>e.date===key(d)&&matchesLabel(e)).forEach(e=>{const bar=node('span',e.text,'eventTitle');bar.title=e.text;bar.style.background=eventColor(e);bar.style.color=contrast(eventColor(e));b.append(bar)})});const detail=document.getElementById('dayDetail');if(selected){detail.querySelectorAll('.eventRow,.empty').forEach(n=>n.remove());const items=events.filter(e=>e.date===selected&&matchesLabel(e)).sort((a,b)=>(a.time||'99').localeCompare(b.time||'99'));if(!items.length)detail.append(node('div','No matching events','empty'));items.forEach(e=>{const row=node('div','','eventRow'),title=node('span',e.text,'eventTitle');title.style.background=eventColor(e);title.style.color=contrast(eventColor(e));const select=labelSelect(e);select.onchange=()=>{e.tag=select.value;writeTags()};const edit=tagButton('Edit',()=>editCalendarEvent(e));row.append(title,node('div','Time: '+(e.time||'Not specified')+' · Place: '+(e.place||'Not specified'),'meta'),edit,select,tagButton('×',()=>{events.splice(events.indexOf(e),1);save()}));detail.append(row)})}const current=eventTag.value;eventTag.replaceChildren(...labelSelect({tag:current}).children);};render();

function editCalendarEvent(event){
 if(!fixed)lock();document.getElementById('eventEditor')?.remove();
 const form=node('form');form.id='eventEditor';
 const title=node('input'),date=node('input'),time=node('input'),place=node('input'),tag=labelSelect(event);
 title.value=event.text;title.required=true;title.maxLength=120;title.setAttribute('aria-label','Event name');
 date.type='date';date.required=true;date.value=event.date;date.setAttribute('aria-label','Event date');
 time.type='time';time.value=event.time||'';time.setAttribute('aria-label','Event time');
 place.value=event.place||'';place.maxLength=120;place.placeholder='Place (optional)';place.setAttribute('aria-label','Event place');
 const submit=node('button','Done');submit.type='submit';
 form.append(title,date,time,place,tag,tagButton('+ New tag',()=>inlineTag(tag)),tagButton('Cancel',()=>{form.remove();resize()}),submit);
 form.onsubmit=e=>{e.preventDefault();if(!title.value.trim())return;Object.assign(event,{text:title.value.trim(),date:date.value,time:time.value,place:place.value.trim(),tag:tag.value});form.remove();save()};
 document.getElementById('panel').append(form);resize();title.focus();
}

function inlineTag(target){
 document.getElementById('inlineTagEditor')?.remove();
 const box=node('div');box.id='inlineTagEditor';
 const name=node('input'),color=node('input');name.placeholder='Tag name';name.maxLength=40;name.setAttribute('aria-label','New tag name');color.type='color';color.value='#c8d9ec';color.setAttribute('aria-label','New tag color');
 box.append(name,color,tagButton('Create tag',()=>{if(!name.value.trim()){name.focus();return}const tag={id:crypto.randomUUID(),name:name.value.trim(),color:color.value};try{localStorage.setItem('calendarTags',JSON.stringify([...calendarTags,tag]));calendarTags.push(tag);target.replaceChildren(...labelSelect({tag:tag.id}).children);target.value=tag.id;box.remove();drawCalendar();resize()}catch{storageError()}}),tagButton('Cancel',()=>{box.remove();resize()}));target.parentElement.append(box);resize();name.focus();
}
