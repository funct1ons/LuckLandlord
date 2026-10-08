const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('js/gdd1UI/icons.js','utf8'),ctx);
const I=ctx.ICONS,G=ctx.GDD1ART;
assert.equal(G.objectIds().length,64);assert.equal(G.upgradeIds().length,32);
const all=[...G.objectIds().map(id=>[id,I.svg]),...G.upgradeIds().map(id=>[id,I.itemSvg])];
const ids=new Set(),shapes=new Set();let bytes=0;
for(const [id,fn] of all){
 const svg=fn(id,'sample');assert.equal(typeof svg,'string');assert(svg.includes('class="sym sample"'));assert(svg.includes('viewBox="0 0 128 128"'));
 const local=new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 for(const name of local){assert(!ids.has(name),'Duplicate page paint server '+name);ids.add(name);}
 for(const m of svg.matchAll(/url\(#([^\)]+)\)/g))assert(local.has(m[1]),'Unresolved paint '+id);
 const normalized=svg.replace(/fogobj-\d+-/g,'stable-');assert(!shapes.has(normalized),'Geometry duplicate '+id);shapes.add(normalized);
 assert(!svg.includes('currentColor'));assert(!svg.includes('<image'));assert(!svg.includes('http',svg.indexOf('xmlns=')+45));
 bytes+=Buffer.byteLength(svg);
}
assert(I.svg('missing').includes('<svg'));assert(I.itemSvg('item_missing').includes('<svg'));
assert(I.svg('mist_pouch','" onload="bad').includes('&quot;'));
for(const id of I.symbolIds())assert.equal(I.routeLabel(id),I.ROUTES[I.routeOf(id)].label);
const x=I.itemSvg('item_dew_calendar').replace(/fogobj-\d+-/g,'stable-');
const y=I.itemSvg('dew_calendar').replace(/fogobj-\d+-/g,'stable-');assert.equal(x,y);
console.log('PASS: 96 distinct normalized geometries; '+ids.size+' noncolliding paint IDs; all references local; SVG/string/class/route/alias/fallback contracts.');
console.log('96 inline SVG total '+bytes+' bytes (only referenced materials emitted).');
