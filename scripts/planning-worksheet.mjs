const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function renderPlanningWorksheet(data) {
  if (!data.id || !data.title || !Array.isArray(data.fields) || !Array.isArray(data.moments) || !Array.isArray(data.columns) || !Array.isArray(data.checklist)) throw new Error('Incomplete planning worksheet');
  if (data.moments.length > 5 || data.columns.length > 6 || data.fields.length > 6 || data.checklist.length > 6) throw new Error('Worksheet exceeds compact print limits');
  return `<section id="planning-worksheet" class="planning-worksheet" data-planning-worksheet aria-labelledby="worksheet-title">
<div class="worksheet-heading"><h2 id="worksheet-title">${escape(data.title)}</h2><button type="button" data-print-worksheet>${escape(data.printLabel || 'Print worksheet')}</button></div>
<p class="worksheet-intro">${escape(data.intro)}</p>
<dl class="worksheet-fields">${data.fields.map(label=>`<div><dt>${escape(label)}</dt><dd><span class="write-line" aria-hidden="true"></span></dd></div>`).join('')}</dl>
<table><thead><tr>${data.columns.map(label=>`<th scope="col">${escape(label)}</th>`).join('')}</tr></thead><tbody>${data.moments.map(label=>`<tr><th scope="row">${escape(typeof label==='string'?label:label.label)}</th>${data.columns.slice(1).map(()=>'<td><span class="write-space" aria-hidden="true"></span></td>').join('')}</tr>`).join('')}</tbody></table>
<ul class="worksheet-checks">${data.checklist.map(label=>`<li><span class="write-checkbox" aria-hidden="true"></span>${escape(label)}</li>`).join('')}</ul>
</section>
<link rel="stylesheet" href="/planning-worksheet.css">
<script src="/planning-worksheet.js" defer></script>`;
}
