const assert=require('node:assert/strict');
const {test}=require('node:test');
const {appContent}=require('../.domain-test/data/appContent.js');
const {CURRICULUM_ID}=require('../.domain-test/data/curriculum/index.js');
const {validateContent}=require('../.domain-test/domain/validateContent.js');
const {createLearningService}=require('../.domain-test/services/learningService.js');
const {createLearningApplication}=require('../.domain-test/services/learningApplication.js');
const {parseGameMessage}=require('../.domain-test/domain/gameBridge.js');
const {getCampaignProgress}=require('../.domain-test/domain/progression.js');
test('full map starts with only node 1 accessible and completing node 2 unlocks node 3',()=>{
  const campaign=appContent.campaigns.find(c=>c.id===CURRICULUM_ID);
  const snapshot={campaignId:campaign.id,campaignVersion:campaign.version,completedNodeIds:[],checkpoints:[]};
  const states=()=>getCampaignProgress(campaign,snapshot).nodes.map(node=>node.status);
  assert.deepEqual(states(),['available',...Array(14).fill('locked')]);
  snapshot.completedNodeIds.push(campaign.nodes[0].id);
  assert.deepEqual(states().slice(0,3),['completed','available','locked']);
  snapshot.completedNodeIds.push(campaign.nodes[1].id);
  assert.deepEqual(states().slice(0,4),['completed','completed','available','locked']);
});
test('active catalog contains full curriculum first and keeps legacy content readable',()=>{
  assert.deepEqual(validateContent(appContent),[]);
  assert.equal(appContent.campaigns[0].id,CURRICULUM_ID);
  assert.equal(appContent.campaigns.find(c=>c.id==='starter').version,2);
});
test('explicit campaign selection preserves legacy progress and retries profile writes',async()=>{
  const rows=new Map();let fail=true;
  const repository={read:async key=>structuredClone(rows.get(key.campaignId)??null),initialize:async initial=>{
    if(!rows.has(initial.campaignId))rows.set(initial.campaignId,structuredClone(initial));return structuredClone(rows.get(initial.campaignId));
  }};
  const service=createLearningService(appContent,repository);
  const profile={name:'Test',campaignId:'starter',dsaLevel:'beginner',aptitudeLevel:'advanced'};
  await service.initializeProgress({userId:'user',campaignId:'starter'},profile);
  const old=structuredClone(rows.get('starter'));
  const app=createLearningApplication(appContent,async()=>({userId:'user',learningService:service,readProfile:async()=>profile,
    saveProfile:async()=>{if(fail){fail=false;throw new Error('offline');}}}));
  await app.bootstrap();assert.equal(app.getSnapshot().profile.campaignId,'starter');
  assert.equal(await app.selectCampaign(CURRICULUM_ID),false);
  assert.equal(app.getSnapshot().profile.campaignId,'starter');
  assert.equal(await app.selectCampaign(CURRICULUM_ID),true);
  assert.equal(app.getSnapshot().progress.campaignId,CURRICULUM_ID);
  assert.deepEqual(rows.get('starter'),old);
  assert.ok(app.getQuest(`${CURRICULUM_ID}:node-01`));
  assert.equal(app.getQuest(`${CURRICULUM_ID}:node-02`),null);
});
test('game bridge rejects wrong sessions, versions, stages, malformed and unbounded messages',()=>{
  const value={bridgeVersion:1,type:'GAME_COMPLETE',sessionId:'test',stage:'break1',completed:true,score:10,coins:1};
  const parse=v=>parseGameMessage(JSON.stringify(v),'test','break1');
  assert.deepEqual(parse(value),{type:'GAME_COMPLETE',score:10,coins:1});
  for(const patch of [{sessionId:'other'},{stage:'break2'},{bridgeVersion:2},{completed:false},{score:-1},{coins:1.5},{type:'UNKNOWN'},{score:1000001}])assert.equal(parse({...value,...patch}),null);
  assert.equal(parseGameMessage('x'.repeat(5000),'test','break1'),null);
  assert.equal(parseGameMessage('{','test','break1'),null);
});
