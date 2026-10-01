import assert from 'node:assert/strict';
import {COURSE,ROUNDS,getRound,newFlight,startFlight,advanceRound,stepFlight} from '../flight.js';
const dt=1/60;
assert.deepEqual(ROUNDS.map(r=>[r.rings,r.time,r.required]),[[12,75,8],[15,90,10],[18,105,12],[21,120,14]]);
assert.equal(COURSE,ROUNDS[0].course);
assert.throws(()=>getRound(0),RangeError);assert.throws(()=>getRound(5),RangeError);
let s=newFlight(),original=structuredClone(s);
stepFlight(s,dt,{up:true});assert.deepEqual(s,original);assert.throws(()=>advanceRound(s));
startFlight(s);for(let i=0;i<60;i++)stepFlight(s,dt,{up:true,right:true});assert(s.x>35&&s.y>125&&s.z< -60);
s.phase='paused';original=structuredClone(s);stepFlight(s,dt,{down:true,boost:true});assert.deepEqual(s,original);
startFlight(s);for(let i=0;i<100;i++)stepFlight(s,dt,{boost:true});assert(s.speed>105&&s.boost<50);
for(let i=0;i<160;i++)stepFlight(s,dt,{});assert(s.boost>80&&s.speed<66);
startFlight(s);s.z=-239;const events=stepFlight(s,.05);assert.equal(s.hits,1);assert.equal(s.totalHits,1);assert.equal(s.score,175);assert(events.some(e=>e.type==='hit'&&e.perfect));
startFlight(s);s.x=100;s.z=-239;stepFlight(s,.05);assert.equal(s.results[0],'miss');assert(s.time<71&&s.time>69);
startFlight(s);s.y=8;stepFlight(s,.05);assert.equal(s.lives,2);assert.equal(s.y,48);
function flyCourse(state){
 let ticks=0;const events=[];
 while(state.phase==='flying'&&ticks++<9000){const r=getRound(state.round).course[state.next];events.push(...stepFlight(state,dt,{left:state.x-r.x>3,right:r.x-state.x>3,up:r.y-state.y>3,down:state.y-r.y>3}));}
 assert(ticks<9000,'Course must finish');return events;
}
startFlight(s);const summaries=[];
for(let round=1;round<=4;round++){
 const config=getRound(round),previousScore=s.score;
 assert.equal(s.round,round);assert.equal(s.time,config.time);assert.equal(s.results.length,config.rings);
 const events=flyCourse(s);assert.equal(s.hits,config.rings);assert.equal(s.outcome,'win');assert.equal(s.roundsCleared,round);assert(s.score>previousScore);
 summaries.push({round,rings:s.hits,score:s.score});original=structuredClone(s);stepFlight(s,1,{boost:true});assert.deepEqual(s,original);
 if(round<4){
  assert.equal(s.phase,'round-cleared');assert(events.some(e=>e.type==='round-clear'));
  const score=s.score,totalHits=s.totalHits;s.lives=1;s.boost=0;advanceRound(s);
  assert.equal(s.score,score);assert.equal(s.totalHits,totalHits);assert.equal(s.hits,0);assert.equal(s.next,0);assert.equal(s.combo,0);
  assert.equal(s.lives,3);assert.equal(s.boost,100);assert.equal(s.z,0);assert.throws(()=>advanceRound(s),'Cannot skip an uncleared round');
 }else{assert.equal(s.phase,'ended');assert(events.some(e=>e.type==='end'));assert.equal(s.totalHits,66);assert.throws(()=>advanceRound(s));}
}
startFlight(s);assert.equal(s.round,1);assert.equal(s.score,0);assert.equal(s.roundsCleared,0);
// Every later-round failure must restart the entire challenge.
for(const reason of ['timeout','crash','rings'])for(const round of [2,3,4]){
 s=newFlight(round);s.phase='flying';s.score=5000;s.roundsCleared=round-1;s.totalHits=12;
 if(reason==='timeout')s.time=.001;
 else if(reason==='crash'){s.y=8;s.lives=1;}
 else{const last=getRound(round).course.at(-1);s.next=getRound(round).rings-1;s.x=160;s.y=260;s.z=last.z+1;}
 stepFlight(s,.05);assert.equal(s.phase,'ended');assert.equal(s.outcome,reason);assert.throws(()=>advanceRound(s));startFlight(s);
 assert.equal(s.round,1);assert.equal(s.time,75);assert.equal(s.score,0);assert.equal(s.totalHits,0);assert.equal(s.roundsCleared,0);assert.equal(s.results.length,12);
}
// Crossing the last ring with an expired clock is still a failure.
s=newFlight();s.phase='flying';s.next=11;s.hits=10;s.time=.001;const last=COURSE.at(-1);s.z=last.z+1;s.x=160;s.y=260;
stepFlight(s,.05);assert.equal(s.outcome,'timeout');
console.log(JSON.stringify({passed:true,rounds:summaries,checks:'Movement, boost, pause, four-round progression, cumulative scoring, final victory, failures in rounds 2–4, timeout priority'}));
