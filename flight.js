const ROUTE=[
  [0,100],[25,122],[70,150],[25,115],[-60,95],[-100,130],
  [-20,170],[80,140],[110,95],[30,120],[-65,150],[0,110],
  [45,140],[85,165],[10,125],[-80,100],[-30,135],[60,170],
  [110,130],[40,105],[-60,140]
];
export const ROUNDS=Object.freeze([12,15,18,21].map((rings,index)=>{
  const course=Object.freeze(ROUTE.slice(0,rings).map(([x,y],i)=>Object.freeze({
    x:index%2?-x:x,
    y:index===0?y:Math.round(y+Math.sin(i*.8+index)*12),
    z:-240-i*235
  })));
  return Object.freeze({number:index+1,rings,time:75+index*15,required:Math.ceil(rings*2/3),course});
}));
export const COURSE=ROUNDS[0].course;
export function getRound(number){
  if(!Number.isInteger(number)||number<1||number>ROUNDS.length)throw new RangeError('라운드는 1부터 4까지입니다.');
  return ROUNDS[number-1];
}
export function newFlight(round=1){const config=getRound(round);return {phase:'ready',round,roundsCleared:0,totalHits:0,x:0,y:100,z:0,vx:0,vy:0,speed:65,time:config.time,boost:100,boostLocked:false,boosting:false,lives:3,invulnerable:0,score:0,combo:0,hits:0,perfects:0,next:0,results:Array(config.rings).fill(null),outcome:null};}
export function startFlight(s){Object.assign(s,newFlight(),{phase:'flying'});}
export function advanceRound(s){
  if(s.phase!=='round-cleared'||s.round>=ROUNDS.length)throw new Error('라운드를 성공한 뒤에만 다음 라운드로 갈 수 있습니다.');
  const progress={score:s.score,totalHits:s.totalHits,roundsCleared:s.roundsCleared};
  Object.assign(s,newFlight(s.round+1),progress,{phase:'flying'});
}
export function finishFlight(s,reason){
  if(reason==='win')s.roundsCleared=s.round;
  s.phase=reason==='win'&&s.round<ROUNDS.length?'round-cleared':'ended';
  s.boosting=false;s.outcome=reason;
  return {type:s.phase==='round-cleared'?'round-clear':'end',reason};
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function stepFlight(s,dt,keys={}){
  if(s.phase!=='flying'||!Number.isFinite(dt)||dt<=0)return [];
  dt=Math.min(dt,.1);const events=[];const before={x:s.x,y:s.y,z:s.z};const config=getRound(s.round),course=config.course;
  const ix=Number(Boolean(keys.right))-Number(Boolean(keys.left));
  const iy=Number(Boolean(keys.up))-Number(Boolean(keys.down));
  const smooth=1-Math.exp(-dt*6);
  s.vx+=(ix*54-s.vx)*smooth;s.vy+=(iy*44-s.vy)*smooth;
  if(!keys.boost||s.boost>=30)s.boostLocked=false;
  s.boosting=!!keys.boost&&s.boost>0&&!s.boostLocked;
  s.boost=clamp(s.boost+(s.boosting?-34:19)*dt,0,100);
  if(s.boost<=0)s.boostLocked=true;
  s.speed+=((s.boosting?113:65)-s.speed)*(1-Math.exp(-dt*3));
  s.x=clamp(s.x+s.vx*dt,-160,160);s.y=clamp(s.y+s.vy*dt,8,265);s.z-=s.speed*dt;
  s.invulnerable=Math.max(0,s.invulnerable-dt);s.time=Math.max(0,s.time-dt);
  if(s.y<13&&s.invulnerable<=0){s.lives--;s.combo=0;s.y=48;s.vy=20;s.invulnerable=2.5;events.push({type:'collision'});if(s.lives<=0){events.push(finishFlight(s,'crash'));return events;}}
  while(s.next<course.length&&s.z<=course[s.next].z){
    const ring=course[s.next];
    const t=clamp((before.z-ring.z)/(before.z-s.z),0,1);
    const x=before.x+(s.x-before.x)*t,y=before.y+(s.y-before.y)*t;
    const distance=Math.hypot(x-ring.x,y-ring.y);
    if(distance<25){s.hits++;s.totalHits++;s.combo++;const perfect=distance<9;if(perfect)s.perfects++;const points=100*Math.min(s.combo,5)+(perfect?75:0);s.score+=points;s.time+=2;s.results[s.next]='hit';events.push({type:'hit',index:s.next,points,perfect,combo:s.combo});}
    else{s.combo=0;s.time=Math.max(0,s.time-5);s.results[s.next]='miss';events.push({type:'miss',index:s.next});}
    s.next++;
  }
  if(s.time<=0)events.push(finishFlight(s,'timeout'));
  else if(s.next===course.length){const won=s.hits>=config.required;if(won)s.score+=Math.floor(s.time)*10;events.push(finishFlight(s,won?'win':'rings'));}
  return events;
}
