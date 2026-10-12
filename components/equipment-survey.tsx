"use client";
import {Checkbox} from '@/components/ui/checkbox';
import {equipmentChoices,defaultInventory,type EquipmentInventory} from '@/lib/equipment';
import type {Profile} from '@/lib/training';
export function EquipmentSurvey({profile,onChange}:{profile:Profile;onChange:(v:EquipmentInventory)=>void}){
 const v=profile.inventory||defaultInventory(profile.equipment);
 const edit=(patch:Partial<EquipmentInventory>)=>onChange({...v,...patch,confirmed:false});
 return <section className="equipment-survey" aria-label="Equipment inventory"><h2>What can you actually use?</h2><p className="small-copy">All equipment starts selected. Remove anything unavailable, then confirm this location.</p>
 <div className="button-row"><button type="button" onClick={()=>onChange({...defaultInventory(),confirmed:false})}>Select all equipment</button><button type="button" onClick={()=>edit({items:[],dumbbells:'none'})}>Clear equipment</button></div><label className="field"><span>Dumbbells available</span><select aria-label="Dumbbells available" value={v.dumbbells} onChange={e=>edit({dumbbells:e.target.value as EquipmentInventory['dumbbells']})}><option value="none">None</option><option value="single">One dumbbell</option><option value="pair">Two equal dumbbells / matching pairs</option></select></label>
 {v.dumbbells!=='none'&&<label className="field"><span>Dumbbell weight choices</span><select aria-label="Dumbbell weight choices" value={v.dumbbellLoading} onChange={e=>edit({dumbbellLoading:e.target.value as EquipmentInventory['dumbbellLoading']})}><option value="fixed">Fixed weight — no heavier option</option><option value="adjustable">Adjustable or a range of weights</option></select></label>}
 {[...new Set(equipmentChoices.map(x=>x[2]))].map(group=><details className="guide-extra" key={group} open={group==='Basics'||undefined}><summary>{group} · {equipmentChoices.filter(x=>x[2]===group&&v.items.includes(x[0])).length} selected</summary>{equipmentChoices.filter(x=>x[2]===group).map(([key,label])=><label className="check-line" key={key}><Checkbox checked={v.items.includes(key)} onCheckedChange={yes=>edit({items:yes?[...v.items,key]:v.items.filter(x=>x!==key)})}/>{label}</label>)}</details>)}
 <label className="check-line"><Checkbox checked={v.confirmed} onCheckedChange={yes=>onChange({...v,confirmed:!!yes})}/>This list matches equipment I can reliably use here.</label>
 {!profile.inventory&&<p className="small-copy">Existing equipment labels are unconfirmed until you complete this list.</p>}
 </section>;
}
