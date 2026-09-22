(function(root){
 'use strict';
 const categories={expense:['餐饮','购物','交通','居住','娱乐','医疗','学习','其他'],income:['工资','奖金','兼职','理财','其他']};
 function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||value.slice(0,4)==='0000')return false;const d=new Date(value+'T00:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value;}
 function parseAmount(value){const text=String(value).trim();if(!/^\d{1,9}(\.\d{1,2})?$/.test(text))throw Error('请输入大于 0 的金额，最多两位小数，且小于 10 亿元。');const [whole,fraction='']=text.split('.');const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));if(cents<=0)throw Error('金额必须大于 0。');return cents;}
 function validRecord(r){return r&&typeof r.id==='string'&&r.id.length>0&&Object.hasOwn(categories,r.type)&&categories[r.type].includes(r.category)&&Number.isSafeInteger(r.cents)&&r.cents>0&&r.cents<100000000000&&typeof r.date==='string'&&validDate(r.date)&&typeof r.note==='string'&&r.note.length<=80;}
 function createRecord(input,id){const r={id,type:input.type,cents:parseAmount(input.amount),category:input.category,date:input.date,note:String(input.note||'').trim()};if(!validRecord(r))throw Error('请检查日期、分类和备注是否正确。');return r;}
 function decode(raw){if(raw===null)return [];const rows=JSON.parse(raw);if(!Array.isArray(rows)||!rows.every(validRecord)||new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('账目数据格式异常');return rows;}
 function summarize(records,month){const selected=records.filter(r=>r.date.slice(0,7)===month).sort((a,b)=>b.date.localeCompare(a.date));let income=0,expense=0,incomeCount=0,expenseCount=0;const groups={};for(const r of selected){if(r.type==='income'){income+=r.cents;incomeCount++;}else{expense+=r.cents;expenseCount++;groups[r.category]=(groups[r.category]||0)+r.cents;}}return {selected,income,expense,balance:income-expense,incomeCount,expenseCount,groups:Object.entries(groups).sort((a,b)=>b[1]-a[1])};}
 const api={categories,validDate,parseAmount,validRecord,createRecord,decode,summarize};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Ledger=api;
})(globalThis);
