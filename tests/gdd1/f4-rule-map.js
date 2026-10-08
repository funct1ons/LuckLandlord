'use strict';
const fs=require('fs'),path=require('path');global.GDD1={};for(const f of ['contract','rng','schema','content','full-content','full-effects','resolver'])require('../../js/gdd1/'+f+'.js');
const F=GDD1,c=require('./f4-exact-contract.json');
const focused={dock_chime:['f4-dock-cases'],release_spire:['f4-spire-cases'],cracked_regulator:['f4-risk-cases'],safety_shim:['f4-risk-cases'],item_insulation_shawl:['f4-risk-cases'],item_spare_baffle:['f4-risk-cases'],item_small_hold:['f4-item-focused'],item_low_balance_tab:['f4-item-focused'],item_manifest_clip:['f4-item-focused'],item_root_wrap:['f4-item-focused','f4-age-order'],item_brine_lining:['f4-item-focused'],item_compliance_carbon:['f4-item-focused'],item_release_receipt:['f4-item-focused'],item_dew_calendar:['f4-age-order'],fog_stitcher:['f4-age-order']};
// Only list files containing actual focused semantic assertions, not registration matrices.
for(const [file,ids] of Object.entries({
 'f4-base-route-contracts':['mist_pouch','wick_bed','dew_lantern','amber_frond','root_ledger','warm_pod','nursery_gauge','ash_felt','sorting_tong','copper_burr','spent_gasket','sieve_drum','heat_clerk','clinker_router','furnace_auditor','fog_reed','prism_hum','brine_strip','saline_ampoule','condense_coil','tide_prism','deep_still','crystal_index','pearl_separator','reserve_facet','arrears_slip','lean_receipt','compliance_desk'],
 'f4-copy-cases':['offset_reader','pause_dial','blank_facet','cleared_stub','item_safe_carbon','item_registration_pin'],
 'f4-tag-cases':['phase_chip','spectrum_pin','alignment_cloth','echo_plate','split_register','item_spectrum_book','item_growth_negative'],
 'f4-cargo-bridges':['transit_seal','return_station'],
 'f4-contract-behaviors':['cancellation_clerk','quota_margin','demand_coupler','advance_stamp','settlement_beacon'],
 'f4-item-row-draw':['item_nursery_scale','item_clean_mesh','item_frost_glass','item_lane_clapper','item_rest_notch','item_pitch_marker'],
 'f4-item-commit':['item_return_track','item_audit_clip'],
 'f4-appearance-cases':['chord_frame','silence_keeper','harbor_conductor','route_stub','parcel_cage','manifest_desk','sorting_runner','switch_lamp'],
 'f4-reservation-priority':['switch_lamp','item_jar_rack','item_registration_pin'],
 'f4-adjacency-snapshot':['pitch_fork','cargo_rope'],
 'f4-item-lifecycle-boundaries':['item_margin_lantern','item_residue_stamp','item_sorting_apron','item_offcut_chute','item_waste_log','item_exchange_hook','item_fraction_gauge','feed_valve','cloudy_negative']
}))for(const id of ids)focused[id]=[...(focused[id]||[]),file];
const map={status:'PARTIAL / NOT ACCEPTED',source:c.source,sourceHash:c.sha256,warning:'Registration is not execution evidence. Focused semantic assertions and generic integration are distinct; no blanket acceptance.',sharedIntegrationEvidence:['f4-integration-reload-v3.json','f4-independent-regression-v6.json','f4-ui-cdp-v6-results.json','f4-focused-suite-v5.json','f4-id-command-save-v1.json','f4-events-save-integration-v1.json','f4-browser-exact-parity-v1-results.json','f4-historical-protection-v2.json','f4-protection-comparison-v2.json'],symbols:[],items:[],events:[]};
for(const kind of ['symbols','items','events'])for(const row of c[kind]){
 const defs=kind==='symbols'?F.fullSymbols:kind==='items'?F.fullItems:F.fullEvents,d=defs[row.id];
 const integrationCases=kind==='events'?['tests/gdd1/f4-event-transactions.js','tests/gdd1/f4-events-save-integration.js']:['tests/gdd1/f4-id-command-save.js'];
 const precise=kind==='events'?['f4-event-transactions','f4-event-windows','f4-event-draw']:focused[row.id]||[];
 const verifiedCycle=kind==='symbols'&&row.id==='beat_spool'||kind==='items'&&row.id==='item_shared_metronome';
 const verifiedPressure=kind==='symbols'&&['pressure_pouch','surge_vessel'].includes(row.id)||kind==='items'&&row.id==='item_pressure_index';
 if(precise.length){map[kind].push({contract:row,implementation:{file:'js/gdd1/full-effects.js',effects:d.effects||[],mechanics:d.mechanics||{},spinEffects:d.spinEffects||[],transactionOperation:d.op||null},executionEntry:kind==='events'?'js/gdd1/full-controller.js / resolver.js:eventEffects':'js/gdd1/resolver.js: generic primitives and item windows',cases:precise.map(x=>'tests/gdd1/'+x+'.js'),integrationCases,uncoveredBoundaries:['save/import fault atomicity','broader cross-route integration','action/depth/UID limits','UI behavior','complete frozen regression'],status:'FOCUSED BEHAVIOR VERIFIED; integration open'});continue;}
 map[kind].push({contract:row,implementation:{file:'js/gdd1/full-effects.js',effects:d.effects||[],transactionOperation:d.op||null},executionEntry:verifiedCycle?'js/gdd1/resolver.js:perform(cycle)':verifiedPressure?'js/gdd1/resolver.js:pressure-injection -> perform(pressure) -> dispatch -> pressure checkpoint':'OPEN: registration requires execution audit',integrationCases,cases:verifiedCycle?['tests/gdd1/f4-cycle-cases.js']:verifiedPressure?['tests/gdd1/f4-pressure-cases.js']:[],uncoveredBoundaries:['save/import fault atomicity','cross-route integration','all-stage progression','action/depth/UID limits'],status:verifiedCycle||verifiedPressure?'FOCUSED BEHAVIOR VERIFIED; integration open':'OPEN: exact behavior evidence required'});
}
const out=path.join(__dirname,process.argv[2]||'f4-rule-map-event-risk-v1.json');if(fs.existsSync(out))throw Error('Refusing to overwrite evidence: '+out);fs.writeFileSync(out,JSON.stringify(map,null,2)+'\n');console.log('Wrote truthful 64/32/8 contract -> registration -> precise-case map; no blanket acceptance');
