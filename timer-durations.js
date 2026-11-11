/* Duration grammar, independent of DOM, recipes, clocks and storage. */
(function(root){
 'use strict';
 const N='\\d+(?:[.,]\\d+)?';
 const H='(?:horas?|hrs?|h)', M='(?:minutos?|mins?|min|m)', S='(?:segundos?|segs?|seg|s)';
 const atom=`(?:${N}\\s*${H}(?:\\s*(?:e\\s*)?${N}(?:\\s*${M})?)?(?:\\s*(?:e\\s*)?${N}\\s*${S})?|${N}\\s*${M}(?:\\s*(?:e\\s*)?${N}\\s*${S})?|${N}\\s*${S})`;
 function value(text,inherited=0){
  const s=text.trim().replaceAll(',','.');
  if(/^\d+(?:\.\d+)?$/.test(s))return Number(s)*inherited;
  const h=s.match(/^(\d+(?:\.\d+)?)\s*(?:horas?|hrs?|h)(.*)$/i);
  if(h){const tail=h[2].trim().replace(/^e\s+/i,'');if(!tail)return Number(h[1])*3600;const secondsOnly=tail.match(/^(\d+(?:\.\d+)?)\s*(?:segundos?|segs?|seg|s)$/i);if(secondsOnly)return Number(h[1])*3600+Number(secondsOnly[1]);const m=tail.match(/^(\d+(?:\.\d+)?)(?:\s*(?:minutos?|mins?|min|m))?(?:\s*(?:e\s*)?(\d+(?:\.\d+)?)\s*(?:segundos?|segs?|seg|s))?$/i);return m?Number(h[1])*3600+Number(m[1])*60+Number(m[2]||0):NaN;}
  const m=s.match(/^(\d+(?:\.\d+)?)\s*(?:minutos?|mins?|min|m)(?:\s*(?:e\s*)?(\d+(?:\.\d+)?)\s*(?:segundos?|segs?|seg|s))?$/i);
  if(m)return Number(m[1])*60+Number(m[2]||0);
  const sec=s.match(/^(\d+(?:\.\d+)?)\s*(?:segundos?|segs?|seg|s)$/i);return sec?Number(sec[1]):NaN;
 }
 function parse(text){
  const re=new RegExp(`(?<![\\w.,])((?:${atom}|${N})\\s*(?:até|a|[–—-])\\s*${atom}|${atom})(?![\\p{L}])`,'giu');
  const out=[];
  for(const match of text.matchAll(re)){
   const raw=match[0];
   const split=raw.match(/^(.*?)\s*(?:até|\ba(?=\s|\d))\s*(.*)$|^(.*?)[–—-](.*)$/i);
   let min,max;
   if(split){const left=split[1]??split[3],right=split[2]??split[4];max=value(right);const unit=/h/i.test(right)?3600:/m/i.test(right)?60:1;min=value(left,unit);}else min=max=value(raw);
   if(Number.isFinite(min)&&Number.isFinite(max)&&min>=1&&max>=min&&max<=604800)out.push({raw,context:text.slice(Math.max(0,match.index-30),Math.min(text.length,match.index+raw.length+35)).replace(/\s+/g,' ').trim(),min:Math.round(min),max:Math.round(max),start:match.index,end:match.index+raw.length});
  }
  return out;
 }
 const api={parse,value};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ElGuapoDurations=api;
})(globalThis);
