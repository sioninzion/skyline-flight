export const COURSE=Object.freeze([
  [0,100],[25,122],[70,150],[25,115],[-60,95],[-100,130],
  [-20,170],[80,140],[110,95],[30,120],[-65,150],[0,110]
].map(([x,y],i)=>Object.freeze({x,y,z:-240-i*235})));
export function newFlight(){return {phase:'ready',x:0,y:100,z:0,vx:0,vy:0,speed:65,time:75,boost:100,boostLocked:false,boosting:false,lives:3,invulnerable:0,score:0,combo:0,hits:0,perfects:0,next:0,results:Array(12).fill(null),outcome:null};}
export function startFlight(s){Object.assign(s,newFlight(),{phase:'flying'});}
export function finishFlight(s,reason){s.phase='ended';s.boosting=false;s.outcome=reason;return {type:'end',reason};}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function stepFlight(s,dt,keys={}){
  if(s.phase!=='flying'||!Number.isFinite(dt)||dt<=0)return [];
  dt=Math.min(dt,.1);const events=[];const before={x:s.x,y:s.y,z:s.z};
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
  while(s.next<COURSE.length&&s.z<=COURSE[s.next].z){
    const ring=COURSE[s.next];
    const t=clamp((before.z-ring.z)/(before.z-s.z),0,1);
    const x=before.x+(s.x-before.x)*t,y=before.y+(s.y-before.y)*t;
    const distance=Math.hypot(x-ring.x,y-ring.y);
    if(distance<25){s.hits++;s.combo++;const perfect=distance<9;if(perfect)s.perfects++;const points=100*Math.min(s.combo,5)+(perfect?75:0);s.score+=points;s.time+=2;s.results[s.next]='hit';events.push({type:'hit',index:s.next,points,perfect,combo:s.combo});}
    else{s.combo=0;s.time=Math.max(0,s.time-5);s.results[s.next]='miss';events.push({type:'miss',index:s.next});}
    s.next++;
  }
  if(s.next===COURSE.length){const won=s.hits>=8;if(won)s.score+=Math.floor(s.time)*10;events.push(finishFlight(s,won?'win':'rings'));}
  else if(s.time<=0)events.push(finishFlight(s,'timeout'));
  return events;
}
