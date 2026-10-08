/* Original offline object illustrations. Geometry is authored at 128 units;
   material helpers describe construction, never a shared badge. */
const fs=require('fs'),vm=require('vm');
const P=(d,m='copper')=>`<path d="${d}" fill="url(#@${m})" stroke="#293c3c" stroke-width="1.8" stroke-linejoin="round"/>`;
const L=(d,color='#ecd5a5',w=1.8)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const E=(x,y,rx,ry,m='copper')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#@${m})" stroke="#354746" stroke-width="1.5"/>`;
const R=(x,y,w,h,m='copper',r=3)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#@${m})" stroke="#354746" stroke-width="1.8"/>`;
const rivets=(pts)=>pts.map(([x,y])=>E(x,y,2.5,2.5,'steel')+L(`M${x-1} ${y}h2`,'#45443a',1)).join('');
const leaf=(d,vein)=>P(d,'leaf')+L(vein,'#b9ce8c',1.3);
const pages=(x,y,w,h)=>R(x+3,y+5,w,h,'paper')+L(`M${x+4} ${y+h}h${w-2}m-${w-2} 3h${w-2}`,'#998a6c',1)+R(x,y,w,h-4,'enamel');
const writing=(x,y,w,n=4)=>Array.from({length:n},(_,i)=>L(`M${x} ${y+i*7}h${w-(i%2)*7}`,'#8c8068',1.5)).join('');
const bottle=(d,level,color='liquid')=>P(d,'glass')+P(level,color)+L('M49 42v24m0 8v8','#e1f6e7',3)+L('M82 66v26','#517e7a',2);
const dial=(x,y,r)=>E(x+2,y+3,r+3,r+3,'copper')+E(x,y,r,r,'paper')+L(`M${x-r+5} ${y}h4M${x} ${y-r+5}v4M${x+r-5} ${y}h-4M${x} ${y}l${r*.46} -${r*.6}`,'#374f50',2.4)+E(x,y,2,2,'steel');
const person=(coat,hat,tool)=>P('M22 108v-21q1-13 24-20h36q23 7 24 20v21Z',coat)+P('M49 63v12l15 15 15-15V63','skin')+E(64,43,19,24,'skin')+P(hat,'enamel')+L('M52 46h4m15 0h4M62 48l-2 9h5M58 63q6 3 12-1','#725144',1.6)+P('M45 76l19 15-7 17H39Zm38 0L64 91l8 17h17','cloth')+tool;
const A={};
// First material studies: textile dew pouch, nursery, lantern, foliage, tongs,
// ampoule, ledger, wax-and-wood stamp, pressure dial, copper coil, helper.
A.mist_pouch=P('M48 24l-8-12 22 6 25-5-9 14q-2 10 16 28 17 25 4 42-10 14-38 13-30 0-36-16-10-24 8-39 12-15 12-27Z','cloth')+P('M41 61q22-12 43-3l12 24q-9 20-30 20-27 0-32-18Z','glass')+L('M42 29q19 6 37-1M43 33q18 5 37-1','#bca677',3)+L('M46 45q-15 24-10 37M84 83q-2 17-19 18','#c0dacd',2)+E(51,68,3,5,'glass')+E(77,91,2,3,'glass')+L('M62 60q-15 11 0 17t0 17','#e9f0d9',2);
A.wick_bed=P('M18 75l85-5-10 34-64 3Z','enamel')+P('M18 75l11 32-9-8-9-26Z','copper')+E(59,74,44,8,'soil')+L('M37 73V44M64 73V29M87 72V47','#627d4e',3)+leaf('M37 51Q11 48 22 25q20 3 15 26Z','M25 32l12 19m-6-13-6 2')+leaf('M64 44Q43 31 55 12q22 12 9 32Z','M57 21l7 23m-4-13 8-3')+leaf('M86 58q-3-30 22-29-1 24-22 29Z','M86 58l16-21m-9 12 9 1')+L('M31 89l55-3','#91b9a4',2)+rivets([[30,81],[92,78]]);
A.dew_lantern=L('M44 29V20a20 18 0 0 1 40 0v9','#c39262',5)+P('M39 30h50l12 65-11 12H37L27 95Z','glass')+P('M35 87q29-8 60 0l-5 15H39Z','liquid')+P('M58 81q-18-12 4-36 21 21 10 33Z','amber')+P('M39 28h50v9H39ZM28 94h73v9H28Z','copper')+L('M42 40l-7 49M85 40l8 48','#edcf98',3)+L('M49 43l-4 28','#e6f6e8',3)+rivets([[43,32],[85,32]]);
A.amber_frond=L('M33 108Q62 83 89 17','#9b7947',5)+leaf('M54 88Q17 90 18 57q33-1 36 31Z','M24 64l30 24m-16-16-10 3m16 4 1-11')+leaf('M72 59Q34 60 44 24q30 4 28 35Z','M49 32l23 27m-14-14-10 2m17 5 0-11')+P('M65 76q5-33 42-29-11 30-42 29Z','amber')+L('M69 73l29-19m-14 12 1-10m5 6 7 2','#f8da93',1.5)+leaf('M87 28Q62 26 75 7q23 3 12 21Z','M78 13l9 15');
A.sorting_tong=P('M24 14l18 7 18 34-24 48-12-6 25-42-16-25-12-2Z','steel')+P('M104 17l-18 5-22 35 21 46 12-5-22-42 18-25 13-2Z','copper')+P('M24 14l18 7-9 9-12-2Z','enamel')+P('M104 17l-18 5 7 9 13-2Z','enamel')+E(62,59,8,7,'steel')+L('M60 58l4 2M34 90l8-15M87 89l-7-16','#f0d8af',3)+P('M83 34l6 4-5 8-5-4Z','patina');
A.saline_ampoule=bottle('M54 12h20v27l17 22v38q0 11-13 12H48q-13-1-13-12V61l19-22Z','M39 77q25-7 48 0v21q-1 8-10 8H49q-10-1-10-8Z')+E(63,77,24,4,'liquid')+R(53,12,22,8,'copper')+R(46,84,31,15,'paper')+L('M53 90h16m-10 4h10','#746e58',1)+P('M44 101l5-4 4 5-5 2Zm36-6 3 6-6 1Z','paper');
A.root_ledger=pages(30,20,65,85)+P('M30 20h12v81H30Z','copper')+R(49,32,36,45,'paper')+writing(54,40,24)+leaf('M64 88q-15-16-22-1 15 10 22 1Z','M49 86l15 2')+L('M64 87l6 20m-6-9-8 5m11-1 9 4','#6e8b5c',2)+rivets([[36,28],[36,89]]);
A.advance_stamp=P('M23 85l12-13h58l13 13v15H23Z','copper')+P('M56 74V54q-22-12-13-30 6-15 23-13 25 4 20 24-3 12-15 19v20Z','wood')+E(64,24,20,10,'wood')+L('M53 26q-7 12 8 24M64 56v13','#e0b784',3)+P('M29 102l55 5-9 11-52-6Z','paper')+E(47,108,11,4,'wax')+L('M36 88h52','#f6d09c',3);
A.pause_dial=P('M42 95h44l6 15H36Z','enamel')+dial(64,57,38)+R(36,83,13,8,'copper')+L('M44 78v8m8-8v8','#795b3b',3)+P('M88 34l9 4-3 7-8-4Z','patina');
A.condense_coil=R(27,20,12,89,'enamel')+R(86,20,12,89,'enamel')+L('M26 15h21v17h42q23 0 23 14T88 59H40q-22 0-22 15t22 15h48q23 0 23 14H60v9','#343c39',13)+L('M26 15h21v17h42q23 0 23 14T88 59H40q-22 0-22 15t22 15h48q23 0 23 14H60v9','#b78450',9)+L('M48 30h40q18 0 20 12M40 61q-19 0-19 13m20 13h47','#f1c98d',2)+L('M68 58h12M98 91l7 3','#6a9d8f',4)+rivets([[33,26],[92,26],[33,104],[92,104]]);
A.heat_clerk=person('enamel','M40 35l6-22h36l8 22Z',R(39,78,46,30,'cloth')+R(49,86,25,17,'copper')+L('M91 90l16-30','#a8b8ad',6)+R(101,48,12,21,'steel')+L('M50 24h28','#d8b580',3));
// Remaining production objects, individually composed.
A.fog_stitcher=P('M22 89V44h28V24h36l19 18v28H82V45H50v44Z','enamel')+R(15,89,97,16,'wood')+E(85,39,10,10,'copper')+L('M86 69v20M70 87h29','#e8d9b1',2)+R(52,11,19,13,'cloth')+L('M61 24v-13M29 54h14','#cfb07f',2)+rivets([[30,81],[97,49]]);
A.warm_pod=P('M62 28Q25 18 20 59q-6 37 42 49 43-3 47-42 2-39-47-38Z','amber')+P('M62 29q-17 28 0 79 20-28 0-79Z','leaf')+L('M62 29V15l18-7M36 41q-15 23-1 45M85 43q13 20 4 37','#f4d091',3)+leaf('M65 20Q78 1 98 17 80 27 65 20Z','M70 19l21-3');
A.nursery_gauge=dial(69,46,28)+P('M54 74h30v31H54Z','copper')+R(42,102,55,8,'wood')+L('M29 103V65','#6b915e',3)+leaf('M29 82Q5 79 17 56q19 4 12 26Z','M19 64l10 18')+L('M59 85h21m-21 7h21','#edd5ab',2);
A.ash_felt=P('M15 29l30-13 28 11 35-5-7 34 12 31-29 20-28-8-36 9 4-36Z','cloth')+P('M23 39l28-9 23 11 24-5-5 22 9 28-21 11-28-10-24 10 2-26Z','soil')+L('M28 45l20-8 24 10 18-5M28 62l22-8 24 11 15-7M30 82l20-8 21 10','#a79c86',2)+L('M18 35l9 3m72-7-7 8M28 103l3-10','#d2b890',2);
A.copper_burr=P('M22 13l25 6 8 35 44 5 13 24-13 26-29-8-18-23-26-9Z','copper')+P('M58 64l13-16 5 21 17-14-2 21 18 4-22 9 2 15-20-11Z','patina')+L('M30 23l13 35 20 10M62 78l14 16M86 74l10-5','#f3cf95',3)+rivets([[40,54],[89,84]]);
A.spent_gasket=P('M91 20a44 44 0 1 0 19 56l-27-8a18 18 0 1 1-20-25Z','soil')+L('M40 31Q8 65 43 96M26 65l9 2M42 95l6-9M92 91l-7-5','#918778',4)+P('M90 20l-5 15-13 10-9-2 8-12Z','copper')+L('M88 23l-9 14','#f6cb90',2);
A.sieve_drum=P('M32 24h61q27 37 0 72H32Z','steel')+E(32,60,20,36,'copper')+E(32,60,13,27,'soil')+L('M51 35h48M53 48h51M53 62h53M51 76h51M49 89h48M66 25v70m15-70v70m14-66v61','#455d5b',2)+P('M28 96l-8 14h13l7-14m49 0 8 14h12l-9-14','wood')+L('M59 28h29','#e0e7d4',3);
A.clinker_router=P('M14 18h101L91 49H74v23l37 23-14 17-34-27-32 27-16-17 37-24V49H36Z','copper')+P('M23 25h82L86 41H41Z','soil')+L('M62 47v29M24 95l9 8m59-5 9-4','#efcd94',3)+rivets([[44,45],[82,45]])+P('M77 55l10 2-3 9-10-3Z','patina');
A.furnace_auditor=P('M37 24h51l17 69-17 17H37L20 93Z','enamel')+L('M45 25V16q18-21 35 0v9','#bf8c55',6)+R(37,46,49,40,'copper')+R(45,53,33,26,'soil')+P('M49 76q-6-13 8-19 2 12 9 7l5 12Z','amber')+L('M34 96h54M37 36h49','#deb987',2)+dial(92,43,10);
A.dock_chime=R(15,15,100,10,'wood')+L('M37 25v18m51-18v18','#c6a573',3)+P('M34 43h59l-12 48H46Z','copper')+L('M41 50h43M47 84h29M64 91v15','#f3cf98',3)+E(64,109,6,6,'steel')+P('M73 66l13-4-3 15-14 4Z','patina');
A.pitch_fork=P('M28 14h14v42q0 20 22 20t22-20V14h14v42q0 29-28 34v24H56V90Q28 84 28 56Z','steel')+L('M32 19v34q0 28 27 31M90 19v31M60 97v13','#eef0db',3)+R(54,96,20,14,'wood');
A.fog_reed=P('M48 14l27 4 15 89-31 5-20-83Z','wood')+P('M52 20l15 3 13 79-16 3Z','copper')+L('M57 28l9 61M61 43l15-2m-12 22 15-2m-10 20 14-2','#eed0a0',3)+E(65,53,3,4,'soil')+E(70,73,3,4,'soil')+L('M42 30l-2 6m37 62 8 3','#618e84',3);
A.beat_spool=R(39,28,48,66,'cloth')+E(64,23,38,12,'wood')+E(64,100,38,12,'wood')+E(64,23,9,4,'soil')+Array.from({length:10},(_,i)=>L(`M40 ${34+i*5}q22 9 46 0`,'#d1b991',2)).join('')+L('M84 80q28 12 22 30','#e5cc9b',3);
A.chord_frame=P('M23 108V21h81v87H89V37H38v71Z','wood')+P('M38 37h51v8H38Z','copper')+L('M46 43v54m11-54v42m11-42v54m11-54v45','#e5cf9f',2)+rivets([[30,30],[97,30],[30,100],[97,100]])+L('M28 44v42M95 45v27','#ddb77d',2);
A.prism_hum=P('M64 14l34 27v51l-34 23-35-23V41Z','violet')+P('M29 41l35 21 34-21-34-27Z','glass')+P('M64 62l34-21v51l-34 23Z','enamel')+E(64,48,9,8,'amber')+L('M35 44v41l22 15M64 64v44','#e4d9ef',2)+R(24,106,79,6,'copper');
A.silence_keeper=person('violet','M42 22q22-20 44 0v13H42Z',P('M30 80h20v27H30Z','wood')+L('M39 86v14M90 77v29','#d4be97',3)+E(91,75,8,4,'cloth')+P('M49 44h31v10H49Z','cloth'));
A.harbor_conductor=person('enamel','M38 25l11-12h30l13 12-6 9H42Z',L('M92 96l17-69','#eed5ad',4)+R(28,83,23,22,'paper')+writing(31,89,15,2)+P('M48 76l16 16 16-16-16 31Z','wax'));
A.brine_strip=P('M21 19l33 8-17 84-30-12Z','cloth')+P('M68 13l29 5 17 86-31 8Z','glass')+L('M19 52l25 6m-30 18 25 6M78 40l24-3m-19 31 24-4','#f0e4ba',5)+P('M21 87l6-4 6 7-10 5ZM89 87l6-8 6 12-9 4Z','paper');
A.tide_prism=P('M27 36l49-23 36 43-36 56-61-26Z','glass')+P('M27 36l35 25 14-48Z','liquid')+P('M62 61h50l-36 51Z','violet')+P('M15 86l47-25 14 51Z','enamel')+L('M30 38l31 19 13-38M21 83l38-20','#d9f5df',3);
A.deep_still=P('M36 13h33v19l17 20v40l-17 19H31L15 92V53l21-21Z','copper')+P('M23 58h54v33l-13 12H35L23 89Z','enamel')+R(42,50,15,43,'glass')+L('M49 64v23M84 51h21v49h12','#c19c66',8)+L('M85 49h18v42','#f1d4a3',2)+E(51,19,16,6,'steel')+rivets([[31,58],[69,58],[31,92],[69,92]]);
A.crystal_index=R(16,39,96,67,'wood')+R(23,46,82,18,'paper')+writing(31,53,58,1)+P('M31 87l12-17 13 15-11 17Z','glass')+R(66,73,29,24,'paper')+writing(71,80,18,2)+R(27,19,26,20,'copper')+P('M73 9l25 2v28H73Z','violet')+L('M20 65h87','#e5c394',2);
A.pearl_separator=P('M17 22h96v12L76 73v28l-23 13V73L17 34Z','copper')+E(65,27,45,8,'steel')+E(65,27,8,6,'paper')+E(43,43,5,5,'paper')+L('M26 38l31 34v31','#f1cb96',3)+R(17,92,26,22,'glass')+E(30,102,7,5,'paper')+E(97,94,11,10,'paper')+P('M82 42l12-4-7 14Z','patina');
A.reserve_facet=P('M40 12l45 9 28 39-26 49H37L11 67Z','violet')+P('M40 12l10 48-39 7Z','glass')+P('M50 60l35-39 28 39Z','liquid')+P('M50 60l37 49H37Z','enamel')+P('M50 60l33 6-17 23Z','amber')+L('M42 19l9 35 30-29M17 68l24 34','#e6d5f1',2);
A.cargo_rope=L('M49 54C1 2 1 109 51 77l28-29c50-51 58 68 0 29L49 54M51 77l-25 35m53-35 28 32','#3b3932',15)+L('M49 54C1 2 1 109 51 77l28-29c50-51 58 68 0 29L49 54M51 77l-25 35m53-35 28 32','#bda16e',10)+L('M18 46l10 5m-11 13 12 2m4 13 6 7m58-39-10 4m15 8-11 2M34 100l-8-5m71 3 8-6','#ead4a4',3);
A.route_stub=P('M14 30h101v23q-16 10 0 20v26H14V73q15-10 0-20Z','paper')+P('M86 30h29v23q-16 10 0 20v26H86Z','amber')+writing(29,46,43,5)+L('M85 36v7m0 6v7m0 6v7m0 6v7m0 6v6','#816748',2)+E(58,78,10,10,'wax');
A.parcel_cage=P('M21 36l43-22 43 22v69H21Z','copper')+P('M25 41h77v60H25Z','soil')+R(37,57,50,40,'paper')+L('M60 57v40M37 75h50','#957754',4)+L('M21 39h86M35 40v65m29-65v65m29-65v65M21 74h86','#b79b68',5)+L('M25 37l39-19 39 19','#f4d098',2);
A.sorting_runner=person('cloth','M39 30l12-16h30l9 17-14 7H42Z',P('M72 81l29-6 12 24-28 11Z','paper')+L('M83 79l11 26m-17-13 29-5','#a68a5a',3)+R(31,86,24,17,'enamel')+L('M50 20h26','#d8c190',2));
A.manifest_desk=P('M14 66l22-27h74l8 27Z','wood')+P('M14 66h104v13H14Z','copper')+P('M23 79h9v32h-9m68-32h12v32H91','wood')+R(37,79,47,25,'wood')+R(53,89,15,5,'copper')+P('M41 48l49-4 8 14-49 4Z','paper')+writing(51,49,29,2)+R(34,18,36,22,'paper')+writing(40,24,23,2);
A.switch_lamp=R(57,13,13,21,'steel')+P('M48 34h33l16 21v30H32V55Z','enamel')+R(39,54,51,29,'glass')+E(65,68,16,11,'amber')+R(45,91,40,17,'copper')+L('M64 85v7M41 47h44','#e3c18b',3)+rivets([[38,40],[88,40]]);
A.transit_seal=P('M38 22l23-9 18 10 23 4 5 23 9 17-17 18-13 20-24-3-23 4-9-21-18-14 10-24Z','wax')+P('M40 97l-9 22 23-9m28-11 13 20 10-13','cloth')+E(65,63,28,28,'wax')+P('M46 54h40L75 75H57Z','copper')+L('M41 40q20-20 42 0M43 82q18 13 35 2','#eac0a0',2);
A.return_station=P('M12 49l51-36 54 36Z','enamel')+P('M23 49h80v60H23Z','wood')+R(42,65,41,44,'soil')+L('M25 59h17m43 0h16M28 100h11m48 0h12','#d0af7f',2)+R(43,30,39,14,'paper')+L('M49 37h25M75 86H51l8-8m-8 8 8 8','#56756b',3)+R(14,108,100,6,'copper');
A.pressure_pouch=P('M47 15h34v18q32 9 26 53-4 24-43 26-36-2-42-26-7-41 25-53Z','cloth')+R(46,15,36,14,'copper')+L('M30 57q33 12 68 0M27 86q38 15 76 0','#bca676',5)+L('M37 40q-12 21-8 38','#d6d8af',3)+R(57,6,12,9,'steel')+rivets([[48,22],[79,22]]);
A.feed_valve=R(12,56,103,34,'copper')+P('M39 55l16-13h18l17 13v36L72 105H56L39 91Z','enamel')+E(65,74,17,17,'copper')+E(65,74,9,9,'steel')+R(59,26,12,19,'copper')+E(65,22,28,7,'wax')+L('M33 22h64M22 60v25m85-25v25','#efcb94',3)+rivets([[44,59],[86,89]]);
A.surge_vessel=P('M36 32h58l18 22v38l-18 17H36L18 92V54Z','enamel')+R(42,14,45,18,'copper')+P('M18 58h94v9H18Zm0 27h94v9H18Z','copper')+R(57,67,18,18,'glass')+P('M57 80h18v5H57Z','liquid')+L('M28 43h60M36 108v8m58-8v8','#d6c79c',4)+rivets([[26,61],[102,61],[26,90],[102,90]]);
A.cracked_regulator=R(34,15,61,63,'enamel')+P('M34 78h61l17 22v13H17v-13Z','copper')+L('M71 16l-13 23 15 15-23 25 12 33','#17272b',5)+L('M73 16l-12 23 15 15-23 25','#a4b1a1',1)+dial(46,40,9)+R(80,34,10,26,'glass')+L('M19 99h26m37 0h25','#efc991',3)+P('M90 66l-9 6 2 9 12-4Z','patina');
A.safety_shim=P('M16 42l79-26 19 19-79 25Z','steel')+P('M16 42v12l19 18 79-26V35L35 60Z','copper')+P('M16 70l19 17 79-25v12L35 99 16 81Z','steel')+P('M16 91l19 17 79-25v11l-79 25-19-17Z','copper')+L('M26 44l66-22M37 82l69-22M38 104l68-22','#e4e1c5',2);
A.release_spire=P('M43 104l10-65h23l11 65Z','enamel')+R(35,105,61,9,'copper')+R(47,25,36,15,'copper')+R(60,10,10,16,'steel')+L('M52 68h25M51 84h29M56 47l-6 50','#d8b985',3)+E(65,25,17,5,'steel')+L('M46 13q-12-7-4-11M85 18q14-8 8-16','#a3b7ae',2);
A.demand_coupler=R(10,36,39,64,'steel')+R(79,36,39,64,'copper')+R(49,52,30,29,'enamel')+L('M23 29v78m14-78v78m56-78v78m13-78v78','#edcb94',4)+E(64,66,8,8,'copper')+rivets([[16,43],[43,93],[85,43],[112,93]]);
A.phase_chip=P('M14 50l54-26 41 32-50 35Z','violet')+P('M14 50v19l45 39 50-35V56L59 91Z','enamel')+P('M33 52l31-14 24 19-30 18Z','glass')+L('M20 51l38 32 44-29M59 94v9','#d8b7dd',2)+P('M76 11l34 29-8 11-36-28Z','glass');
A.spectrum_pin=L('M39 91l46-65q16-20 25-2 5 9-3 20L50 109q-19 18-28-2-5-9 2-20l50-70','#2b343f',12)+L('M39 91l46-65q16-20 25-2 5 9-3 20L50 109q-19 18-28-2-5-9 2-20l50-70','#b0afb8',7)+L('M40 89l45-64M23 100q3 16 16 12','#f6e1c0',2)+P('M82 62l14 7-12 16-13-8Z','violet');
A.cloudy_negative=P('M18 27l80-12 14 90-79 12Z','soil')+P('M33 39l53-8 10 60-54 9Z','violet')+P('M45 74q-15-21 5-26 14-13 22 3 25-1 16 18-9 14-25 9Z','glass')+L('M23 35l4 10m1 8 2 10m1 8 2 10m1 8 2 10M101 41l2 10m1 8 2 10m1 8 2 10','#c2b49f',4)+L('M46 43l35-5','#f0d7e0',2);
A.blank_facet=P('M29 24l54-10 28 54-43 44-54-30Z','glass')+P('M29 24l39 9 43 35-43 44-10-21-34-9Z','violet')+P('M31 43l34-13 30 40-33 24-35-18Z','glass')+L('M31 43l31 45 30-18M34 28l30 4','#efdcf1',3);
A.offset_reader=P('M17 28h50v23H51v39H17Z','enamel')+P('M66 51h42v52H51V90h15Z','copper')+R(28,10,28,18,'paper')+R(26,47,14,29,'glass')+R(73,64,25,20,'violet')+L('M20 98h26M108 78h13','#d5ba8d',5)+rivets([[23,35],[100,96]]);
A.alignment_cloth=P('M30 15l33 11 35-7-9 38 19 39-44-5-41 20 9-48Z','cloth')+L('M38 43h50M33 65h60M47 31v65M73 31v58','#8bada0',2)+L('M54 49l17 21m0-21L54 70','#efe0b9',3)+L('M31 25l5 3m61 4-7 4M30 99l6-3','#e4c897',2);
A.echo_plate=P('M35 16h75v69H35Z','steel')+P('M16 44h74v66H16Z','copper')+R(29,57,46,39,'violet')+R(48,29,47,35,'glass')+L('M40 72q17-14 26 0m-26 9q17-13 26 0M61 38q15-9 23 0','#d9d4dc',2)+rivets([[22,50],[84,104],[102,23]]);
A.split_register=R(14,32,43,78,'enamel')+R(73,14,42,96,'copper')+R(22,43,27,47,'paper')+writing(26,51,20,5)+R(81,27,27,58,'paper')+writing(85,36,18,7)+L('M57 54h16m-16 37h16','#a0b1a2',6)+R(26,97,18,6,'steel')+R(86,97,17,6,'steel');
A.arrears_slip=P('M27 13h56l24 23v78H27Z','paper')+P('M83 13v23h24Z','amber')+writing(40,48,51,6)+L('M17 33v73','#ba9872',4)+E(79,94,13,11,'wax')+L('M73 88l12 12m0-12-12 12','#e8bc9a',2);
A.lean_receipt=P('M33 17h69v78l-12-8-11 8-12-8-12 8V32H33Z','paper')+E(33,24,13,9,'paper')+P('M20 26h13v81H20Z','amber')+writing(65,28,26,7)+L('M37 17h60M20 103h13','#e9dfbf',2);
A.compliance_desk=P('M13 69h102v16H13Z','wood')+P('M22 85h11v30H22m72-30h11v30H94','copper')+R(28,22,44,47,'enamel')+R(34,29,32,32,'paper')+L('M40 44l8 7 12-15','#6b8e6d',4)+R(81,43,24,26,'copper')+P('M88 42V27q12-15 12 0v15Z','wood')+L('M36 94h55','#d5b389',3);
A.cleared_stub=P('M13 36h79l20 19v46H13V84q15-8 0-18Z','paper')+P('M92 36v19h20Z','amber')+L('M34 39v10m0 8v9m0 8v9m0 8v7M51 77l13 12 32-34','#6a8b6e',4)+L('M43 21h49','#caac79',4);
A.cancellation_clerk=person('enamel','M42 17h43v20H42Z',R(32,80,26,26,'paper')+writing(37,88,17,2)+P('M85 85l4-13h14l5 13v15H82Z','wax')+L('M90 54l16 17m0-17L90 71','#d5bfa4',5));
A.quota_margin=R(27,13,43,101,'paper')+R(70,29,35,29,'amber')+R(70,76,24,29,'violet')+L('M39 25h15m-15 18h15m-15 18h15m-15 18h15m-15 18h15M20 14v98','#7e8170',3)+writing(77,37,20,2)+writing(76,84,12,2);
A.settlement_beacon=P('M47 51h34v25l20 35H27l20-35Z','copper')+P('M36 49V28l28-16 28 16v21Z','enamel')+R(44,30,41,20,'glass')+E(65,40,11,7,'amber')+L('M51 76h26M40 100h47M42 28l23-12','#efcf99',3)+rivets([[45,82],[82,82]]);
// Upgrade illustrations: different silhouettes and functional construction.
const B={};
B.dew_calendar=R(23,22,83,88,'paper')+R(23,22,83,21,'enamel')+L('M42 13v22m44-22v22','#d7b783',6)+L('M38 56h13m22 0h13m-48 18h13m22 0h13','#8b8d72',4)+P('M79 79q-22 24 0 24t0-24Z','liquid');
B.root_wrap=E(65,96,36,15,'cloth')+R(29,28,72,68,'cloth')+E(65,28,36,14,'cloth')+E(65,28,21,8,'soil')+L('M31 47q35 18 68 0m-68 22q35 18 68 0M37 41l51 42M37 68l40 33','#c9bb8a',3)+leaf('M67 31q-7-19-25-9 6 16 25 9Z','M50 24l17 7');
B.nursery_scale=R(58,21,12,84,'copper')+R(35,105,58,9,'wood')+L('M19 36h91M30 36L14 78h33L30 36m66 0L79 78h33L96 36','#b89864',3)+E(30,79,18,6,'copper')+E(96,79,18,6,'copper')+leaf('M62 25Q34 22 42 7q20 0 20 18Z','M47 11l15 14')+leaf('M68 25Q95 22 87 7q-20 0-19 18Z','M82 11L68 25');
B.frost_glass=R(31,11,65,105,'copper')+R(39,19,49,89,'glass')+P('M40 72h47v35H40Z','liquid')+L('M62 29v25m-12-19 24 13m-24 0 24-13M44 65h38M46 25v31','#edf4df',3)+P('M47 87l10-7 7 13 16-10 5 21H44Z','paper');
B.sorting_apron=P('M44 34V18q20-18 40 0v16h7q-3 23 22 37v41H15V71q25-14 22-37Z','cloth')+L('M46 33V20q18-14 36 0v13','#c9b484',4)+R(39,76,49,26,'enamel')+L('M16 72H5m107 0h11M63 82v15','#d7c79b',3)+R(75,48,8,30,'copper');
B.waste_log=pages(29,13,70,99)+R(43,27,42,61,'paper')+writing(49,35,30,3)+P('M50 68l15-13 16 17-19 11Z','copper')+L('M35 20v78','#e2c08c',3);
B.offcut_chute=P('M15 15h39v39l57 31-17 30-65-37-14-16Z','steel')+P('M23 17v37l74 41 10-10-53-31V15Z','copper')+P('M74 14l21 5-9 21-24-9Z','patina')+P('M100 48l17 9-9 20-18-11Z','copper')+L('M30 24v24l59 34','#e6d4b2',3);
B.clean_mesh=R(30,12,79,78,'copper')+R(38,20,63,62,'steel')+L('M46 20v62m13-62v62m14-62v62m14-62v62M38 32h63m-63 13h63m-63 13h63m-63 13h63','#405a58',2)+P('M35 90l-18 25h19l17-25Z','wood')+rivets([[34,16],[105,86]]);
B.lane_clapper=P('M15 31l12-17 84 43-10 18Z','wood')+P('M18 94l80-49 15 19-82 48Z','copper')+L('M32 25l-7 10m29 0-7 10m29 0-7 10M41 86l9 12m13-27 9 12','#e3c794',4)+E(99,62,5,5,'steel');
B.rest_notch=P('M14 43h34v28h31V43h35v65H14Z','wood')+P('M22 82h83v17H22Z','cloth')+L('M17 27h28m38 0h28M64 13v39m-11-10 11 10 11-10','#bfa677',4)+rivets([[21,50],[106,50]]);
B.pitch_marker=P('M34 13h61v67l-31 34-30-34Z','copper')+P('M42 21h45v53L64 99 42 74Z','enamel')+L('M55 77V44l26-7v31M55 54l26-7','#e8d2a8',3)+E(49,78,7,5,'amber')+E(75,69,7,5,'amber');
B.shared_metronome=P('M52 13h24l32 101H21Z','wood')+P('M55 23h18l23 78H33Z','enamel')+L('M38 95h53M64 95l35-65M50 54h29M59 32h10','#ddc091',3)+R(87,22,22,16,'copper')+E(64,96,4,4,'steel');
B.brine_lining=P('M25 14h78v28L91 55v53H36V55L25 42Z','copper')+P('M38 19v20l11 12v44h28V51l13-12V19Z','glass')+P('M49 75h28v20H49Z','liquid')+L('M42 23v13l13 16v15','#e0eee0',3)+rivets([[30,35],[97,35],[41,103],[85,103]]);
B.fraction_gauge=R(25,10,32,103,'paper')+R(57,83,56,30,'copper')+L('M28 28h13m-13 18h23m-23 18h13m-13 18h23M74 91v20m22-12v12M86 16v46m-13-13 13 13 13-13','#718279',3)+R(17,10,8,103,'wood');
B.jar_rack=R(12,61,105,13,'wood')+R(21,74,8,39,'copper')+R(100,74,8,39,'copper')+R(22,99,86,8,'wood')+P('M28 61V39l9-13V13h17v13l9 13v22Z','glass')+P('M72 61V36l9-13V10h17v13l9 13v25Z','glass')+P('M30 49h31v12H30Z','liquid')+P('M74 44h31v17H74Z','violet')+R(35,12,20,8,'copper')+R(79,9,21,8,'copper');
B.residue_stamp=P('M42 13h45v19L71 48v24l30 13v25H26V85l30-13V48L42 32Z','wood')+R(26,88,75,22,'copper')+L('M33 103h60M56 25h19M39 111v8m25-8v8m25-8v8','#e0c394',3)+P('M74 88l17 3-7 8-12-4Z','patina');
B.manifest_clip=R(22,28,77,85,'paper')+L('M47 62V25q0-18 16-18t16 18v42q-12 20-22 0V28','#3b4947',9)+L('M47 62V25q0-18 16-18t16 18v42q-12 20-22 0V28','#bec3ad',5)+writing(35,82,49,4)+R(99,42,11,58,'copper');
B.return_track=L('M13 28h62q40 0 40 40t-40 40H32m0-17h43q23 0 23-23T75 45H13','#3c4a48',8)+L('M13 28h62q40 0 40 40t-40 40H32m0-17h43q23 0 23-23T75 45H13','#aeaa8a',4)+L('M28 22v28m25-28v28m29-27-5 28m25-18-17 22m27 0-26 3m24 19-24-7M47 79L25 99l22 20','#c29361',4);
B.small_hold=P('M32 12h63v27l16 18v53H16V57l16-18Z','wood')+P('M23 62h82v42H23Z','soil')+L('M32 40h63M24 68h80M24 89h80M46 68v36m32-36v36','#bd9b69',5)+R(47,21,32,11,'paper')+rivets([[22,58],[105,58]]);
B.exchange_hook=R(46,12,31,18,'copper')+P('M57 30h12v27q-37 1-37 31 2 27 30 28 39-5 32-44-5 30-28 29-24-6-6-24l9-5Z','steel')+L('M61 34v24q-33 10-24 37M63 110q22-4 26-22','#ece1c6',3)+L('M35 43H12l9-9m-9 9 9 9M91 26h25l-9-9m9 9-9 9','#b88d59',3);
B.pressure_index=pages(17,25,51,87)+R(25,40,30,58,'paper')+writing(31,48,20,6)+dial(87,40,25)+R(72,87,32,24,'copper')+L('M85 91v15','#e8c594',3);
B.insulation_shawl=P('M40 13q24 21 48 0l27 82-36 18-15-35-17 35L12 96Z','cloth')+P('M40 13l-9 65 23 12 10-12 12 12 21-12-9-65q-24 21-48 0Z','enamel')+L('M40 19l-7 54 22 13M87 19l8 54-22 13M20 93l24 12m39 0 24-12','#d8c291',3);
B.release_receipt=P('M30 13h69v102l-18-11-17 11-17-11-17 11Z','paper')+writing(43,26,41,3)+L('M64 55v35m-15-15 15 15 15-15','#77918a',4)+R(14,37,8,53,'copper')+R(107,51,8,53,'copper');
B.spare_baffle=R(27,12,19,103,'steel')+P('M46 36l65 28-65 28Z','copper')+L('M64 45v38m20-29v21M14 25h13m-13 76h13M39 22h13','#e8c999',4)+rivets([[36,32],[36,101]]);
B.safe_carbon=R(14,15,73,81,'paper')+R(34,34,78,81,'soil')+R(43,42,62,65,'violet')+L('M48 52l38 42m-38-23 20 23m6-42 15 22M96 50v40','#a49baa',3)+writing(23,27,51,2);
B.spectrum_book=P('M64 28q-23-15-55-7v82q32-10 55 11 25-22 56-11V21q-31-8-56 7Z','wood')+P('M64 32q-22-12-48-6v72q26-7 48 10 25-18 48-10V26q-26-6-48 6Z','paper')+L('M64 32v76M27 42v37m15-34v29','#b299b5',5)+writing(77,42,25,7)+L('M19 102q24-5 42 11m6 0q22-18 43-10','#d8c193',2);
B.registration_pin=P('M51 12h25l12 22-17 16v35l-7 31-8-31V50L39 34Z','steel')+P('M51 12h25l12 22H39Z','copper')+L('M46 31h36M61 55v33M19 65h25m40 0h25M22 101V86h23m39 0h22v15','#ecd2a6',3);
B.growth_negative=R(24,13,73,91,'soil')+R(36,27,48,61,'violet')+P('M44 77V58l16 7 17-30 6 4-21 36-13-8v10Z','glass')+L('M13 30v84h72M31 15v88M46 95h26','#c7b89c',3)+rivets([[29,20],[91,98]]);
B.low_balance_tab=R(17,13,31,81,'paper')+R(48,29,31,77,'amber')+R(79,45,31,70,'enamel')+writing(24,27,17,3)+writing(55,43,17,3)+writing(86,59,17,3)+L('M25 84h13m17 12h15m17 10h15','#7c8170',3);
B.compliance_carbon=P('M28 13h55l23 22v65H28Z','paper')+P('M83 13v22h23Z','amber')+P('M14 33h14v67h59v15H14Z','violet')+writing(42,43,48,3)+L('M43 79l16 11 28-28','#718c73',4);
B.audit_clip=R(22,32,73,80,'wood')+R(29,39,59,66,'paper')+L('M47 42V20q15-22 29 0v22','#b6baaa',7)+dial(63,72,23)+L('M81 89l26 28','#674e3b',10)+L('M80 87l27 27','#cda16b',5)+L('M54 71l7 8 13-18','#52786b',3);
B.margin_lantern=L('M47 30V20q17-24 34 0v10','#b88b55',5)+P('M35 31h58l13 67H22Z','glass')+P('M48 77q-4-25 17-35 23 14 16 35Z','amber')+R(22,98,84,14,'copper')+R(35,29,58,9,'enamel')+L('M44 42l-8 48m48-48 8 48M33 94h63M64 49v36','#f0d9a7',3);
const palette={copper:['#f3d59b','#b17b4b','#513b2c'],steel:['#e6e6c9','#92a39b','#344d50'],enamel:['#8cafa0','#3d6665','#203c42'],glass:['#edf5da','#9bc9b8','#466f75'],liquid:['#bce4c3','#6eb4a4','#32696f'],leaf:['#c5cf82','#72965d','#345e4d'],amber:['#ffe19a','#d29c4f','#835a37'],violet:['#d9c5e1','#9c86b1','#524b74'],paper:['#fff0c9','#e1d3ac','#b4a181'],wood:['#e0b780','#98714d','#513f31'],cloth:['#c8c5a4','#8f9e8c','#536b67'],soil:['#8b8470','#504e42','#2c3938'],patina:['#b0d0ae','#6a9b85','#3d6b67'],wax:['#f0a17d','#ac594d','#633b3b'],skin:['#f3d3a4','#c59674','#865e50']};
// Finish material studies with local structural detail, not surface-wide noise.
A.saline_ampoule+=L('M39 98q0 10 13 11h25q12-1 13-11M55 25h17M55 29h17','#c4e8d3',1.4)+E(80,63,2,3,'glass')+E(43,72,1.5,2,'glass');
A.mist_pouch+=L('M34 93l3 4m2 2 3 2m3 1 3 1m4 1 3 1m4 0h3m4-1 3-1m4-2 3-2M44 30l-9 17m42-17 10 16','#e6dec0',1.2);
A.root_ledger+=L('M43 99h50m-50 3h49m-50 3h48M88 34v40','#ad9d7b',1)+L('M33 38h5m-5 6h5m-5 6h5','#689889',2);
A.advance_stamp+=L('M72 36q4-9-2-17M72 61v8M27 98h74','#654830',1.5)+L('M32 83h62','#e9bd7c',1.2);
A.heat_clerk+=L('M42 82v23m40-23v23M51 101h20M43 88h5m-5 5h5','#b8c3a6',1.2)+R(89,86,7,16,'copper');
A.amber_frond+=L('M31 69l-5 2m13 5-9 4m21-30-7 0m16-6 1-9m24 24 7 0m-15 6 0 5','#799552',1);
A.sorting_tong+=L('M27 20l7 3m-7 2 5 2M95 24l7-2m-6 6 7-2M52 60l4 4m11-5 4 4','#8c8270',1)+L('M30 99l5 2m53-1 5-2','#b9c6b3',2);
A.condense_coil+=L('M34 42v9m0 25v10M91 37v8m0 24v8','#efc48b',1)+L('M101 46l6 2m-86 27 5 1','#628f80',2);
A.surge_vessel+=L('M24 64h21m38 0h22M24 91h17m51 0h13M61 70v9','#edcd99',1)+P('M94 94l9 2-4 8-8-3Z','patina');
A.deep_still+=L('M28 37l5-3M39 103h20M87 68h14m-14 6h14m-14 6h14','#709b86',2)+L('M44 54v29','#d9efda',1);
A.ash_felt+=L('M30 51l7 2m5-10 7 3m10 11 8 2m10-20 8 2m-53 28 7 2m6 8 8 2m13-8 8 2m-39 24 7 2m22-4 8 2','#9f9a7c',1);
B.spectrum_book+=L('M17 99q26-7 45 11m-45-8q26-7 45 11M67 111q24-17 44-10m-44 13q24-17 44-10','#9e8d70',1);
const defs=Object.entries(palette).map(([k,v])=>`<linearGradient id="@${k}" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="${v[0]}"/><stop offset=".47" stop-color="${v[1]}"/><stop offset="1" stop-color="${v[2]}"/></linearGradient>`).join('');
let src=fs.readFileSync('js/gdd1UI/icons.js','utf8');
// Keep the published route table and labels; remove the obsolete 32-unit artwork.
const groupStart=src.indexOf('  const GROUPS =');
const groupEnd=src.indexOf('  const ITEMS =',groupStart);
const groups=src.slice(groupStart,groupEnd<0?src.indexOf('const DEFS=',groupStart):groupEnd);
const header=`/* Original Fog Harbour night-shift objects, 128-unit material illustrations.
 * Generated offline by tools/art/build-objects.js. No external assets. */
(function(root){'use strict';
const ART=${JSON.stringify(A,null,2)};
const ITEMS=${JSON.stringify(B,null,2)};
`;
const routes=groups.replace("ART[id].join('')","ART[id]");
// Separate definitions from painted geometry; each call isolates its paint servers.
const api=`
const DEFS=${JSON.stringify(defs)};
let serial=0;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function wrap(body,cls){
 const prefix='fogobj-'+(++serial)+'-';
 const local=s=>s.replace(/@([a-z]+)/g,(_,key)=>prefix+key);
 const used=new Set((body.match(/@([a-z]+)/g)||[]).map(s=>s.slice(1)));
 const paints=DEFS.split('</linearGradient>').filter(s=>s && used.has(s.match(/id="@([a-z]+)"/)[1])).map(s=>s+'</linearGradient>').join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" class="sym'+(cls?' '+esc(cls):'')+'" viewBox="0 0 128 128" aria-hidden="true" focusable="false"><defs>'+local(paints)+'</defs><ellipse cx="66" cy="115" rx="41" ry="5" fill="#102b2c" opacity=".18"/><ellipse cx="66" cy="114" rx="29" ry="3" fill="#102b2c" opacity=".16"/><g class="sym-frame symbol-frame" stroke-linecap="round">'+local(body)+'</g><g class="sym-core symbol-core"></g></svg>';
}
const fallback=${JSON.stringify(R(38,25,52,77,'paper')+writing(49,42,29,6))};
function svg(type,cls){return wrap(ART[type]||fallback,cls);}
function itemSvg(id,cls){return wrap(ITEMS[String(id).replace(/^item_/,'')]||fallback,cls);}
root.ICONS={svg,itemSvg,ROUTES,MAP,routeOf:type=>MAP[type]?MAP[type].route:null,routeLabel:type=>MAP[type]?ROUTES[MAP[type].route].label:'',symbolIds:()=>Object.keys(MAP)};
root.GDD1ART={svg,itemSvg,objectIds:()=>Object.keys(ART),upgradeIds:()=>Object.keys(ITEMS),viewBox:'0 0 128 128'};
})(typeof window!=='undefined'?window:globalThis);
`;
if(Object.keys(A).length!==64||Object.keys(B).length!==32)throw Error('Incomplete artwork '+Object.keys(A).length+'/'+Object.keys(B).length);
fs.mkdirSync('assets/art/objects',{recursive:true});
fs.writeFileSync('js/gdd1UI/icons.js',header+routes+api);
const ctx={};vm.createContext(ctx);vm.runInContext(header+routes+api,ctx);
let cards=[];
for(const [kind,data] of [['production',A],['upgrades',B]])for(const id of Object.keys(data)){
 const svg=kind==='production'?ctx.ICONS.svg(id):ctx.ICONS.itemSvg(id);
 fs.mkdirSync('assets/art/objects/'+kind,{recursive:true});
 fs.writeFileSync('assets/art/objects/'+kind+'/'+id+'.svg',svg);
 cards.push(`<figure><img width="120" height="120" src="${kind}/${id}.svg"><img width="40" height="40" src="${kind}/${id}.svg"><figcaption>${id}</figcaption></figure>`);
}
fs.writeFileSync('assets/art/objects/atlas.html','<!doctype html><meta charset="utf-8"><title>Fog Harbour · 96 material studies</title><style>body{background:#243c40;color:#eadbbd;font:12px monospace;display:grid;grid-template-columns:repeat(8,1fr);gap:8px}figure{margin:0;background:#344e50;padding:8px}img{vertical-align:bottom}figcaption{margin-top:6px;overflow-wrap:anywhere}</style>'+cards.join(''));
console.log('Authored '+Object.keys(A).length+' production + '+Object.keys(B).length+' upgrades.');
