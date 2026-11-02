(function(root){
'use strict';
function totals(rows,region,month,cumulative){const selected=rows.filter(r=>(region==='all'||r.region===region)&&(cumulative?r.dt_month.slice(0,4)===month.slice(0,4)&&r.dt_month<=month:r.dt_month===month));if(!selected.length)return {revenue:null,cost:null,profit:null,margin:null};const revenue=selected.reduce((s,r)=>s+r.revenue_amount,0),cost=selected.reduce((s,r)=>s+r.cost_amount,0);return {revenue,cost,profit:revenue-cost,margin:revenue===0?null:(revenue-cost)/revenue};}
function calculate(rows,region='North',month='2025-02-01'){const prior=String(Number(month.slice(0,4))-1)+month.slice(4),monthly=totals(rows,region,month,false),ytd=totals(rows,region,month,true),previous=totals(rows,region,prior,true);return {monthly,ytd,previous,change:ytd.margin===null||previous.margin===null?null:100*(ytd.margin-previous.margin)};}
const api={totals,calculate};if(typeof module==='object'&&module.exports)module.exports=api;else root.DMLMetricMath=api;
})(typeof window==='undefined'?globalThis:window);
