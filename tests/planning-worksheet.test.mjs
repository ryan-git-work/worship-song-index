import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPlanningWorksheet} from '../scripts/planning-worksheet.mjs';
const fixture={id:'advent',title:'Advent worksheet',intro:'Plan & rehearse.',fields:['Date','Passage'],columns:['Moment','Song / version','Key','Leader','Cue'],moments:['Gathering','Reading','Response','Sending'],checklist:['Confirm chart','Rehearse handoff']};
test('worksheet produces labeled printable blank rows and a non-submitting print control',()=>{const h=renderPlanningWorksheet(fixture);assert.equal((h.match(/scope="row"/g)||[]).length,4);assert.equal((h.match(/scope="col"/g)||[]).length,5);assert.match(h,/type="button" data-print-worksheet/);assert.doesNotMatch(h,/<form|<input|https?:/);assert.match(h,/Plan &amp; rehearse/);});
test('worksheet rejects oversized output instead of silently truncating planning content',()=>{assert.throws(()=>renderPlanningWorksheet({...fixture,moments:Array(6).fill('Moment')}),/compact/);assert.throws(()=>renderPlanningWorksheet({...fixture,columns:Array(7).fill('Column')}),/compact/);});
