'use strict';
const $=id=>document.getElementById(id), STORAGE_KEY='qingzhang.records.v1';
let records=[],storageReady=true,pendingDelete=null;
const money=cents=>new Intl.NumberFormat('zh-CN',{style:'currency',currency:'CNY'}).format(cents/100);
const today=new Date(),localDate=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
$('month').value=localDate.slice(0,7);$('date').value=localDate;
function feedback(message,error=false){$('feedback').textContent=message;$('feedback').classList.toggle('error',error);}
try{records=Ledger.decode(localStorage.getItem(STORAGE_KEY));}catch{storageReady=false;feedback('无法读取本地账目。为保护已有数据，已停止保存；请检查浏览器存储设置。',true);}
function persist(next){if(!storageReady){feedback('本地存储不可用，未修改账目。',true);return false;}try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));records=next;return true;}catch{feedback('保存失败，账目尚未更改。请检查浏览器存储空间和权限。',true);return false;}}
function element(tag,cls,text){const node=document.createElement(tag);node.className=cls;if(text!==undefined)node.textContent=text;return node;}
function empty(title,subtitle,icon){const box=element('div','empty');box.append(element('span','empty-icon',icon),element('strong','',title),element('p','',subtitle));return box;}
function updateCategories(){const type=document.querySelector('input[name="type"]:checked').value;$('category').replaceChildren(...Ledger.categories[type].map(value=>{const o=document.createElement('option');o.value=value;o.textContent=value;return o;}));$('note').placeholder=type==='income'?'这笔收入来自哪里？':'这笔钱花在哪里？';}
function render(){
 const s=Ledger.summarize(records,$('month').value);for(const key of ['income','expense','balance'])$(key).textContent=money(s[key]);$('income-count').textContent=`${s.incomeCount} 笔收入`;$('expense-count').textContent=`${s.expenseCount} 笔支出`;$('record-count').textContent=s.selected.length;$('category-count').textContent=`${s.groups.length} 个支出分类`;
 $('breakdown').replaceChildren();$('records').replaceChildren();
 for(const [category,cents]of s.groups){const row=element('div','category-row'),label=element('div','category-label'),bar=element('div','bar'),fill=element('div','bar-fill');label.append(element('span','',category),element('span','',`${money(cents)} · ${Math.round(cents/s.expense*100)}%`));fill.style.width=`${cents/s.expense*100}%`;bar.append(fill);row.append(label,bar);$('breakdown').append(row);}
 if(!s.groups.length)$('breakdown').append(empty('这个月还没有支出','记下第一笔，看看钱都花在哪里。','◷'));
 for(const r of s.selected){const row=element('div','record'),info=element('div','record-info');info.append(element('div','record-title',r.category),element('div','record-meta',`${r.date}${r.note?' · '+r.note:''}`));const remove=element('button','delete-button','×');remove.type='button';remove.setAttribute('aria-label',`删除 ${r.date} ${r.category} ${money(r.cents)}`);remove.addEventListener('click',()=>{pendingDelete=r.id;$('delete-dialog').showModal();$('cancel-delete').focus();});row.append(element('span',`record-icon ${r.type}`,r.type==='income'?'↙':'↗'),info,element('span',`record-amount ${r.type}`,`${r.type==='income'?'+':'−'}${money(r.cents)}`),remove);$('records').append(row);}
 if(!s.selected.length)$('records').append(empty('还没有账目','从「记一笔」开始记录今天的收支。','≡'));
}
document.querySelectorAll('input[name="type"]').forEach(input=>input.addEventListener('change',updateCategories));
$('month').addEventListener('change',()=>{if(!$('month').value)$('month').value=localDate.slice(0,7);render();});
$('entry-form').addEventListener('submit',event=>{event.preventDefault();try{const data=Object.fromEntries(new FormData(event.currentTarget));const r=Ledger.createRecord(data,crypto.randomUUID());if(!persist([r,...records]))return;$('month').value=r.date.slice(0,7);$('amount').value='';$('note').value='';render();feedback('已保存，月度统计已更新。');$('amount').focus();}catch(error){feedback(error.message,true);}});
$('cancel-delete').addEventListener('click',()=>$('delete-dialog').close());
$('confirm-delete').addEventListener('click',()=>{if(pendingDelete&&persist(records.filter(r=>r.id!==pendingDelete))){render();feedback('账目已删除。');}$('delete-dialog').close();});
$('delete-dialog').addEventListener('close',()=>{pendingDelete=null;});
window.addEventListener('storage',event=>{if(event.key!==STORAGE_KEY&&event.key!==null)return;try{records=Ledger.decode(localStorage.getItem(STORAGE_KEY));storageReady=true;render();feedback('账目已同步此浏览器其他窗口的更改。');}catch{storageReady=false;feedback('账目数据异常，已停止保存以保护数据。',true);}});
updateCategories();render();
