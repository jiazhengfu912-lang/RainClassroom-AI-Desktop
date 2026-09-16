import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const repository='jiazhengfu912-lang/RainClassroom-Auto-Answer';
const gh=(...args)=>execFileSync('gh',args,{encoding:'utf8'}).trim();
const issues=JSON.parse(readFileSync('docs/issues.json','utf8'));
const existingLabels=JSON.parse(gh('api',`repos/${repository}/labels`));
for(const [name,color,description] of [['enhancement','a2eeef','New feature or capability'],['status:ready','0e8a16','Ready to start; acceptance remains open'],['status:blocked','d4c5f9','Depends on acceptance of earlier issues']]){
  if(!existingLabels.some(l=>l.name===name))gh('label','create',name,'--repo',repository,'--color',color,'--description',description);
}
const existing=JSON.parse(gh('issue','list','--repo',repository,'--state','all','--limit','100','--json','title,url'));
const directory=mkdtempSync(path.join(tmpdir(),'rain-issues-'));
const urls=[];
for(const [i,issue] of issues.entries()){
  const found=existing.find(e=>e.title===issue.title);
  if(found){urls.push(found.url);continue;}
  const blockers=issue.blockedBy.map(n=>`- ${urls[n-1]}`).join('\n')||'None - can start immediately';
  const body=`## What to build\n\n${issue.build}\n\n## Acceptance criteria\n\n${issue.criteria.map(c=>`- [ ] ${c}`).join('\n')}\n\n## Blocked by\n\n${blockers}\n`;
  const file=path.join(directory,`${i+1}.md`);writeFileSync(file,body);
  urls.push(gh('issue','create','--repo',repository,'--title',issue.title,'--body-file',file,'--label','enhancement','--label',issue.blockedBy.length?'status:blocked':'status:ready'));
}
console.log(urls.join('\n'));
