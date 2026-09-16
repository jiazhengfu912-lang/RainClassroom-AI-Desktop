import { _electron as electron } from 'playwright';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
mkdirSync('test-results',{recursive:true});
const profile=mkdtempSync(path.resolve('test-results','启动恢复-'));
const env={...process.env,RAIN_E2E:'1',RAIN_TEST_DATA:profile,RAIN_TEST_ORIGIN:'http://127.0.0.1:1'};
delete env.ELECTRON_RUN_AS_NODE;
let app;
try{
  app=await electron.launch({args:['.'],env,timeout:15000});
  let page=await app.firstWindow();await page.getByRole('heading',{name:'课堂工作台',exact:true}).waitFor();
  await page.evaluate(()=>window.rain.command({type:'saveModel',config:{baseUrl:'https://example.com/v1',model:'vision-test',apiKey:'synthetic-key-for-restart'}}));
  await app.close();app=null;
  writeFileSync(path.join(profile,'platform-session.json'),Buffer.from('unreadable-session-snapshot'));
  app=await electron.launch({args:['.'],env,timeout:15000});
  page=await app.firstWindow({timeout:8000});await page.getByRole('heading',{name:'课堂工作台',exact:true}).waitFor();
  const state=await page.evaluate(()=>window.rain.command({type:'state'}));
  assert.equal(state.model.hasKey,true,'An unreadable login snapshot must not hide the API configuration');
  assert.equal(state.model.baseUrl,'https://example.com/v1');
  assert.equal(state.model.model,'vision-test');
  await page.getByRole('button',{name:'模型设置',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#base-url')?.value==='https://example.com/v1'&&document.querySelector('#model-name')?.value==='vision-test');
  assert.match(state.notice,/登录.*恢复|登录.*读取/);
  console.log('PASS: API configuration and form values survive an unreadable login snapshot');
}finally{if(app)await app.close();}
