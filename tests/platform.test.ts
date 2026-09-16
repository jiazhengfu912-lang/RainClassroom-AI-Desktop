import { it, expect } from 'vitest';
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { Yuketang } from '../src/main/platform';

it('discovers already released questions from the actual hello timeline schema', async () => {
  let presentationReads = 0;
  const server = http.createServer((req,res) => {
    if(req.url?.includes('presentation/fetch')) presentationReads++;
    res.setHeader('Content-Type','application/json');
    const data = req.url?.includes('basic-info') ? { id:'1',name:'fixture' } : { slides:[{id:'31',cover:'https://www.yuketang.cn/fixture.png',problem:{problemId:'31',problemType:1,body:'fixture',options:[{key:'A',value:'a'},{key:'B',value:'b'}],result:null}}] };
    res.end(JSON.stringify({code:0,data}));
  });
  const wss = new WebSocketServer({server,path:'/wsapp/'});
  wss.on('connection',ws=>ws.on('message',raw=>{
    const d=JSON.parse(raw.toString());
    if(d.op==='hello'||d.op==='fetchtimeline')ws.send(JSON.stringify({op:d.op,timeline:[{type:'event',code:'LESSON_START',dt:1000},{type:'problem',prob:'31',pres:'21',sid:'31',si:0,dt:2000,limit:-1}]}));
    if(d.op==='probleminfo')ws.send(JSON.stringify({op:'probleminfo',problemid:d.problemid,limit:-1,now:3000,dt:2000}));
  }));
  await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
  const origin=`http://127.0.0.1:${(server.address() as any).port}`;
  const platform=new Yuketang({cookies:{get:async()=>[]},fetch} as any,origin,origin.replace('http:','ws:')+'/wsapp/');
  platform.identity={id:'1',name:'fixture'};
  let latest:any;
  const questions:string[]=[];platform.onQuestion=q=>{latest=q;questions.push(q.questionId);};
  try{
    await platform.attachLesson({id:'11',classroomId:'12',name:'fixture'},JSON.stringify({code:0,data:{lessonId:'11',role:3,lessonToken:'fixture'}}),'fixture');
    await expect.poll(()=>questions,{timeout:1500,interval:50}).toContain('31');
    expect(presentationReads,'Discovery must reuse the presentation already loaded from hello').toBe(1);
    await platform.resync();
    await expect.poll(()=>questions.length,{timeout:1500,interval:50}).toBe(2);
    expect(presentationReads,'Starting again must not refetch every presentation').toBe(1);
    await platform.fresh(latest);
    expect(presentationReads,'The pre-submit check must still fetch current content').toBe(2);
  }finally{
    platform.disconnect();for(const ws of wss.clients)ws.terminate();
    await new Promise<void>(r=>wss.close(()=>r()));await new Promise<void>(r=>server.close(()=>r()));
  }
});
