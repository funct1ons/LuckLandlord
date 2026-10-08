'use strict';
// Development-only HTTP parity server. Runtime modules never fetch.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const server=http.createServer((request,response)=>{
  const name=new URL(request.url,'http://127.0.0.1').pathname;
  const file=path.resolve(root,'.'+name);
  if(!name.startsWith('/tests/gdd1/')&&!name.startsWith('/js/gdd1/')||!file.startsWith(root+path.sep)){
    response.writeHead(403);response.end();return;
  }
  fs.readFile(file,(error,data)=>{
    if(error){response.writeHead(404);response.end();return;}
    response.setHeader('Content-Type',file.endsWith('.js')?'application/javascript; charset=utf-8':file.endsWith('.html')?'text/html; charset=utf-8':'application/json; charset=utf-8');
    response.setHeader('Cache-Control','no-store');response.end(data);
  });
});
server.listen(8314,'127.0.0.1',()=>console.log('GDD1 F1 test server ready http://127.0.0.1:8314/tests/gdd1/index.html'));
