(function(root){
'use strict';const F=root.GDD1,store=F.store,load=F.load;
F.FULL_SAVE_KEY=F.SAVE_KEY+'.full-v1';
function storageForFull(storage){return {getItem(key){return storage.getItem(key===F.SAVE_KEY?F.FULL_SAVE_KEY:key)},setItem(key,value){return storage.setItem(key===F.SAVE_KEY?F.FULL_SAVE_KEY:key,value)}};}
F.store=function(storage,state){return store(state&&state.profile==='full-v1'?storageForFull(storage):storage,state)};
F.load=function(storage,profile){return load(profile==='full-v1'?storageForFull(storage):storage,profile)};
})(typeof window!=='undefined'?window:globalThis);
