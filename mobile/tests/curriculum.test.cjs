const assert = require('node:assert/strict');
const { test } = require('node:test');
const { curriculumContent: content, CURRICULUM_ID } = require('../.domain-test/data/curriculum/index.js');
const { visualizationSteps } = require('../.domain-test/domain/visualizations.js');
const { validateContent } = require('../.domain-test/domain/validateContent.js');
const { createQuestController } = require('../.domain-test/domain/questController.js');
const { getCampaignProgress } = require('../.domain-test/domain/progression.js');
const { createLearningService } = require('../.domain-test/services/learningService.js');

test('15-node catalog has 30 complete lessons, 30 balanced quizzes, 90 explained questions, and 15 traces', () => {
  assert.deepEqual(validateContent(content), []);
  assert.equal(content.lessons.length, 30);
  assert.equal(content.quests.length, 15);
  assert.equal(content.questions.length, 90);
  assert.equal(new Set(content.questions.map(q => q.prompt)).size, 90);
  for (const lesson of content.lessons) {
    assert.ok(lesson.introduction.length >= 3);
    assert.ok(lesson.workedExample.steps.length >= 3);
  }
  for (const [i, quest] of content.quests.entries()) {
    assert.deepEqual(quest.sections.map(s => s.subject), ['aptitude', 'dsa']);
    assert.equal(quest.questionIds.length, 6);
    for (const section of quest.sections) {
      const questions = section.questionIds.map(id => content.questions.find(q => q.id === id));
      assert.deepEqual(questions.map(q => q.evidence), ['process', 'process', 'outcome']);
      for (const q of questions) {
        assert.equal(q.difficulty, i < 5 ? 1 : i < 10 ? 2 : 3);
        assert.ok(q.hint.trim() && q.explanation.trim());
        assert.equal(new Set(q.options.map(o => o.text)).size, 3);
        assert.ok(q.options.filter(o => o.id !== q.correctOptionId).every(o => q.distractorFeedback[o.id]?.trim()));
      }
    }
    assert.ok(visualizationSteps(quest.sections[1].visualization).length > 1);
  }
});

// Independent answers: arithmetic/combinatorics and small reference algorithms,
// not copies of answer IDs from the catalog.
test('all 30 outcome answer keys agree with independently computed results', () => {
  const combinations = (n, r) => { let v = 1; for (let i = 1; i <= r; i++) v = v * (n - i + 1) / i; return v; };
  const modPow = (a, n, m) => { let v = 1; for (let i = 0; i < n; i++) v = v * a % m; return v; };
  const aptitude = [String(350 * 18 / 100), String(840 / 7 * 4), String((8 * 15 + 2 * 20) / 10),
    String(1000 * .9 * .8), `${Number((1 / (1 / 12 + 1 / 18)).toFixed(1))} days`, String(150 / (72 * 5 / 18)),
    String(Math.round(1000 * 1.1 ** 2 - 1000)), String(modPow(3, 10, 7)), String(combinations(7, 3)),
    '3/5', `${(120 + 180) / (200 + 300) * 100}%`, String(80 - (45 + 35 - 20)),
    'B', `${(800 * 1.25 * .9 - 800) / 800 * 100}%`, '20/3 days'];
  const arrangements = [];
  const permute = a => { if (a.length === 1) return [a]; return a.flatMap((x, i) => permute(a.filter((_, j) => j !== i)).map(rest => [x, ...rest])); };
  for (const p of permute(['A','B','C','D'])) if (p.indexOf('B') === p.indexOf('A') + 1 && p[0] === 'C' && p[3] !== 'D') arrangements.push(p);
  assert.deepEqual(arrangements, [['C','D','A','B']]);
  assert.ok(Math.abs((3/5)*(2/4) + (2/5)*(3/4) - 3/5) < 1e-12);
  assert.ok(Math.abs((1 - 2*(1/10+1/15))/(1/10) - 20/3) < 1e-12);
  const bubble = [3,2,1]; for (let i=0;i<2;i++) if (bubble[i]>bubble[i+1]) [bubble[i],bubble[i+1]]=[bubble[i+1],bubble[i]];
  const sums = [4,-1,2,6,-3].slice(0,-1).map((v,i) => v + [4,-1,2,6,-3][i+1]);
  const coinCounts=[]; for(let twos=0;twos<=5;twos++) for(let fives=0;fives<=2;fives++) if(2*twos+5*fives===11) coinCounts.push(twos+fives);
  const dsa = [String([4,1,8,2].reduce((a,b)=>a+b,0)), String([2,4,8,6,1].indexOf(6)+1), String([3,1,4,2].slice(1,3).reduce((a,b)=>a+b,0)),
    '3', `[${bubble.join(', ')}]`, '2 and 7', String(Math.max(...sums)), String([4,2,4,4,2,7].filter(v=>v===4).length),
    'No: ) mismatches the top [', '2', String([5,8,2].reverse()[0]), String(2**4), 'Right child of 5', String(Math.min(...coinCounts)), '3'];
  for (let i=0;i<15;i++) for (const [subject, expected] of [['aptitude',aptitude[i]], ['dsa',dsa[i]]]) {
    const section = content.quests[i].sections.find(s=>s.subject===subject);
    const q = content.questions.find(q=>q.id===section.questionIds[2]);
    assert.equal(q.options.find(o=>o.id===q.correctOptionId).text, expected, `Node ${i+1} ${subject}`);
  }
});

test('every node follows the full ordered flow with hints, no partial result, and separate scores', () => {
  for (const node of content.campaigns[0].nodes) {
    const c = createQuestController(content, CURRICULUM_ID, node.id);
    const phases = [];
    for(let step=0;step<600 && c.getSnapshot().phase!=='result';step++) {
      const v=c.getSnapshot(); const label=`${v.section.subject}:${v.phase}`;
      if(phases.at(-1)!==label) phases.push(label);
      assert.equal(v.result,null);
      if(v.phase==='question') {
        assert.equal(v.hint,null);
        c.dispatch({type:'hint',revision:v.revision});
        assert.ok(c.getSnapshot().hint);
        const q=content.questions.find(q=>q.id===v.question.id);
        c.dispatch({type:'answer',revision:c.getSnapshot().revision,questionId:q.id,selectedOptionId:q.correctOptionId});
      } else c.dispatch({type:v.phase==='visualization'&&!v.visualization.canContinue?'visualization_next':'next',revision:v.revision});
    }
    const result=c.getSnapshot().result;
    assert.ok(result, node.id);
    assert.equal(result.answers.length,6);
    assert.ok(result.answers.every(a=>a.hintUsed));
    assert.deepEqual(result.sectionPerformances.map(s=>s.performance.score),[95,95]);
    assert.deepEqual(phases, ['aptitude:lesson','aptitude:example',...Array(3).fill(['aptitude:question','aptitude:feedback']).flat(),
      'dsa:lesson','dsa:visualization','dsa:example',...Array(3).fill(['dsa:question','dsa:feedback']).flat()]);
  }
});

test('curriculum progression gates 6 and 11 on explicit checkpoint resolution and exposes final boss', () => {
  const campaign=content.campaigns[0];
  const snapshot={campaignId:CURRICULUM_ID,campaignVersion:1,completedNodeIds:[],checkpoints:[]};
  for(let i=0;i<15;i++) {
    let p=getCampaignProgress(campaign,snapshot);
    assert.equal(p.nodes[i].status,'available');
    snapshot.completedNodeIds.push(campaign.nodes[i].id);
    p=getCampaignProgress(campaign,snapshot);
    if([4,9,14].includes(i)) {
      const cp=campaign.checkpoints[Math.floor(i/5)];
      assert.equal(p.checkpoints.find(c=>c.id===cp.id).status,'available');
      if(i<14) assert.equal(p.nodes[i+1].status,'locked');
      snapshot.checkpoints.push({checkpointId:cp.id,status:'skipped'});
    }
  }
  assert.equal(getCampaignProgress(campaign,snapshot).educationCompleted,true);
});

test('each assessed skill is seeded from its own onboarding category', async () => {
  const service=createLearningService(content,{initialize:async p=>p});
  const p=await service.initializeProgress({userId:'test',campaignId:CURRICULUM_ID},{aptitudeLevel:'advanced',dsaLevel:'beginner'});
  for(const [skill,estimate] of Object.entries(p.skills)) {
    assert.equal(estimate.mastery,['quantitative_aptitude','logical_reasoning'].includes(skill)?75:30);
    assert.equal(estimate.evidenceCount,0);
  }
});

test('visualization algorithms handle success, absence, negative values, cycles, and impossible states', () => {
  const last=c=>visualizationSteps(c).at(-1);
  assert.equal(last({type:'linear_search',values:[1,2,1],target:1}).state.foundIndex,0);
  assert.equal(last({type:'linear_search',values:[1],target:8}).state.foundIndex,-1);
  assert.equal(last({type:'binary_search',values:[1,3,5],target:3}).state.foundIndex,1);
  assert.equal(last({type:'binary_search',values:[1,3,5],target:2}).state.foundIndex,-1);
  assert.deepEqual(last({type:'bubble_sort',values:[3,-2,3,1]}).values,[-2,1,3,3]);
  assert.equal(last({type:'two_pointers',values:[1,2,4],target:8}).state.found,false);
  assert.equal(last({type:'two_pointers',values:[-3,1,4],target:1}).state.found,true);
  assert.equal(last({type:'sliding_window',values:[-5,-2,-3],width:2}).state.best,-5);
  assert.deepEqual(last({type:'prefix_sums',values:[2,-1,3]}).state.prefix,[0,2,1,4]);
  assert.deepEqual(last({type:'frequency_count',values:[2,1,2]}).state.counts,[2,1]);
  for(const text of ['([)]','(()',')(']) assert.equal(last({type:'brackets',text}).state.valid,false);
  assert.equal(last({type:'brackets',text:'([])'}).state.valid,true);
  const bfs=last({type:'bfs',edges:[[1],[0,2],[],[]],start:0,target:3});
  assert.deepEqual(bfs.state.distance,[0,1,2,null]); assert.deepEqual(bfs.state.path,[]);
  const reachable=last({type:'bfs',edges:[[1,2],[3],[3],[]],start:0,target:3});
  assert.deepEqual(reachable.state.path,[0,1,3]);
  assert.deepEqual(last({type:'linked_list_reverse',values:[5,8,2]}).state.next,[null,0,1]);
  assert.equal(last({type:'subsets',values:[1,2,3]}).state.count,8);
  const leaves=visualizationSteps({type:'subsets',values:[1,2,3]}).filter(s=>s.explanation.startsWith('Emit'));
  assert.equal(new Set(leaves.map(s=>JSON.stringify(s.state.chosen))).size,8);
  assert.equal(last({type:'bst_search',values:[8,3,10,1,5,6],target:6}).state.foundIndex,5);
  assert.equal(last({type:'bst_search',values:[8,3,10],target:6}).state.foundIndex,-1);
  assert.equal(last({type:'min_coins',values:[1,3,4],amount:6}).state.minimum,2);
  assert.equal(last({type:'min_coins',values:[2],amount:3}).state.minimum,null);
  assert.equal(last({type:'min_coins',values:[2],amount:0}).state.minimum,0);
});

test('trace inputs are bounded and trace snapshots cannot mutate previous steps', () => {
  for(const c of [ {type:'binary_search',values:[3,1],target:1}, {type:'two_pointers',values:[2,1],target:3},
    {type:'sliding_window',values:[1],width:2}, {type:'min_coins',values:[0],amount:3},
    {type:'bfs',edges:[[2],[]],start:0,target:1}, {type:'subsets',values:[1,1]}, {type:'bst_search',values:[1,1],target:1},
    {type:'brackets',text:'abc'}, {type:'min_coins',values:[1],amount:1000}, {type:'unknown',values:[1]} ]) assert.throws(()=>visualizationSteps(c));
  for(const quest of content.quests) {
    const trace=visualizationSteps(quest.sections[1].visualization);
    assert.ok(Object.isFrozen(trace));
    for(const step of trace) {
      assert.ok(Object.isFrozen(step)&&Object.isFrozen(step.values)&&Object.isFrozen(step.state));
      for(const value of Object.values(step.state)) if(Array.isArray(value)) assert.ok(Object.isFrozen(value));
      assert.ok(step.explanation.length>0);
    }
  }
});
