import * as THREE from './vendor/three.module.js';
import {COURSE,newFlight,startFlight,stepFlight} from './flight.js';

const $=id=>document.getElementById(id);
const host=$('scene');
let renderer;
try {renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
catch(error){$('error').hidden=false;$('error').textContent='3D 화면을 열 수 없어요. 하드웨어 가속을 지원하는 브라우저에서 다시 열어 주세요.';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor(0xaad4df);renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xb5d9df,650,2200);
const camera=new THREE.PerspectiveCamera(57,1,1,3500);
scene.add(new THREE.HemisphereLight(0xe9f9ff,0x5d9298,2.4));
const sun=new THREE.DirectionalLight(0xffefd5,3);sun.position.set(-350,600,100);scene.add(sun);
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.9,flatShading:true,...extra});
const seaMat=mat(0x338f9f,{metalness:.16,roughness:.58});
const sea=new THREE.Mesh(new THREE.PlaneGeometry(10000,10000),seaMat);sea.rotation.x=-Math.PI/2;sea.position.set(0,-2,-1400);scene.add(sea);
const waterLines=new THREE.Group();const lineMat=new THREE.MeshBasicMaterial({color:0x80c7cb,transparent:true,opacity:.2});
let seed=20261001;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<700;i++){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(4+rand()*21,.25+rand()*.3),lineMat);mesh.rotation.x=-Math.PI/2;mesh.position.set((rand()-.5)*3200,.05,300-rand()*4400);waterLines.add(mesh);}scene.add(waterLines);
const sand=mat(0xded6a9),rock=mat(0x729c86),grass=mat(0x719f72),treeMat=mat(0x3d7761),trunkMat=mat(0x847b53);
function island(x,z,s){
 const group=new THREE.Group();group.position.set(x,-3,z);group.rotation.y=rand()*6;
 const beach=new THREE.Mesh(new THREE.CylinderGeometry(s*.72,s,13,9),sand);beach.position.y=4;group.add(beach);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(s*.63,s*.78,22,8),grass);base.position.y=13;group.add(base);
 const mountain=new THREE.Mesh(new THREE.ConeGeometry(s*.56,s*.85,6),rock);mountain.position.set(-s*.12,s*.35,0);mountain.rotation.y=.5;group.add(mountain);
 const peak=new THREE.Mesh(new THREE.ConeGeometry(s*.27,s*.5,5),grass);peak.position.set(s*.3,s*.23,s*.14);group.add(peak);
 for(let j=0;j<9;j++){const a=rand()*6.28,r=s*(.32+rand()*.24),tx=Math.cos(a)*r,tz=Math.sin(a)*r,h=8+rand()*11;
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.8,1,h*.55,4),trunkMat);trunk.position.set(tx,26,tz);group.add(trunk);
 const tree=new THREE.Mesh(new THREE.ConeGeometry(h*.35,h,5),treeMat);tree.position.set(tx,29+h*.3,tz);group.add(tree);}
 scene.add(group);
}
for(let i=0;i<25;i++){const side=i%2===0?-1:1;island(side*(270+rand()*550),230-i*155,65+rand()*130);}
island(-210,-350,90);island(295,-770,85);
const cloudMat=mat(0xf6f4e9,{transparent:true,opacity:.93});
const clouds=[];
for(let i=0;i<33;i++){const cloud=new THREE.Group();cloud.position.set((rand()-.5)*2100,290+rand()*180,450-rand()*4400);for(let j=0;j<4;j++){const c=new THREE.Mesh(new THREE.IcosahedronGeometry(19+rand()*25,1),cloudMat);c.scale.set(1.5,.62,.8);c.position.set(j*29,rand()*13,rand()*8);cloud.add(c);}scene.add(cloud);clouds.push(cloud);}
const ringData=COURSE.map(r=>({...r,result:null}));
const gold=mat(0xffc366,{metalness:.32,roughness:.35,emissive:0xd98516,emissiveIntensity:.25});
const ringMeshes=ringData.map((r,i)=>{const g=new THREE.Group();g.position.set(r.x,r.y,r.z);const ring=new THREE.Mesh(new THREE.TorusGeometry(27,1.8,8,64),gold.clone());g.add(ring);const outer=new THREE.Mesh(new THREE.TorusGeometry(30,.2,4,64),new THREE.MeshBasicMaterial({color:0xffe2a5,transparent:true,opacity:.5}));g.add(outer);for(let j=0;j<4;j++){const tick=new THREE.Mesh(new THREE.BoxGeometry(2.4,5,1.8),gold);tick.position.set(Math.sin(j*Math.PI/2)*27,Math.cos(j*Math.PI/2)*27,0);tick.rotation.z=-j*Math.PI/2;g.add(tick);}scene.add(g);return g;});
const plane=new THREE.Group();const white=mat(0xf0eee5,{roughness:.45,metalness:.1}),orange=mat(0xe99440,{roughness:.46}),dark=mat(0x1c3d4b,{roughness:.24,metalness:.4});
function part(geometry,material,x,y,z,rx=0,ry=0,rz=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);plane.add(m);return m;}
const body=part(new THREE.CylinderGeometry(1.4,2.7,17,10),white,0,0,.7,Math.PI/2);
part(new THREE.SphereGeometry(2.7,12,8),white,0,0,-7).scale.set(1,.85,1.7);
part(new THREE.SphereGeometry(2.05,12,8),dark,0,1.65,-1.7).scale.set(.83,.68,1.85);
function wing(points,material,y){const shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,z):shape.moveTo(x,z));shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:.45,bevelEnabled:true,bevelThickness:.18,bevelSize:.15,bevelSegments:1});const m=new THREE.Mesh(geo,material);m.rotation.x=Math.PI/2;m.position.y=y;plane.add(m);return m;}
wing([[-18,2],[-18,-1],[-3,-3],[3,-3],[18,-1],[18,2],[3,3.5],[-3,3.5]],white,0);
wing([[-18,2],[-18,-1],[-14,-1.55],[-14,2.4]],orange,.1);wing([[14,2.4],[14,-1.55],[18,-1],[18,2]],orange,.1);
wing([[-7,9],[-7,7.5],[0,5.5],[7,7.5],[7,9]],white,.8);
part(new THREE.BoxGeometry(.5,4.5,4),orange,0,2,7.3,-.25);
part(new THREE.CylinderGeometry(.8,.8,1,10),dark,0,0,-11.5,Math.PI/2);
const propeller=part(new THREE.BoxGeometry(.32,8,.25),dark,0,0,-12.2);
const propBlur=part(new THREE.CircleGeometry(4,32),new THREE.MeshBasicMaterial({color:0xd4edf2,transparent:true,opacity:.08,side:THREE.DoubleSide}),0,0,-12.2);
plane.position.set(0,100,0);scene.add(plane);
const mapCtx=$('map').getContext('2d');
ringData.forEach(()=>{$('segments').appendChild(document.createElement('i'));});
function drawMap(){const ctx=mapCtx;ctx.clearRect(0,0,360,130);ctx.strokeStyle='#a2b9c2';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ringData.forEach((r,i)=>{const x=17+i*29,y=65-r.x*.24;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.setLineDash([]);ringData.forEach((r,i)=>{ctx.beginPath();ctx.arc(17+i*29,65-r.x*.24,4,0,6.28);ctx.fillStyle=r.result==='hit'?'#d8973c':r.result==='miss'?'#9babb3':'#718f9a';ctx.fill();});const p=Math.max(0,Math.min(1,(-plane.position.z-240)/2585));ctx.save();ctx.translate(17+p*319,65-plane.position.x*.24);ctx.fillStyle='#d98929';ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-6,-5);ctx.lineTo(-3,0);ctx.lineTo(-6,5);ctx.closePath();ctx.fill();ctx.restore();}
function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(host);resize();
camera.position.set(0,124,70);camera.lookAt(0,108,-150);
const state=newFlight();const keys=new Set();let last=performance.now(),feedbackUntil=0,muted=true,audioCtx,engine,engineGain,engineFilter,best=0;
try{best=Number(localStorage.getItem('skyline-best-v1'))||0;}catch{}
const particles=[];const particleGeo=new THREE.SphereGeometry(.65,4,3);const particleMat=new THREE.MeshBasicMaterial({color:0xffd27e});
function audioReady(){if(!audioCtx){try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();engine=audioCtx.createOscillator();engine.type='sawtooth';engineFilter=audioCtx.createBiquadFilter();engineFilter.type='lowpass';engineFilter.frequency.value=180;engineGain=audioCtx.createGain();engineGain.gain.value=0;engine.connect(engineFilter).connect(engineGain).connect(audioCtx.destination);engine.start();}catch{return;}}if(audioCtx.state==='suspended')void audioCtx.resume();}
function chime(good=true){if(muted||!audioCtx)return;const t=audioCtx.currentTime;[0,.085,.17].forEach((offset,i)=>{const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type='sine';osc.frequency.value=good?[523,659,784][i]:[220,180,140][i];gain.gain.setValueAtTime(0,t+offset);gain.gain.linearRampToValueAtTime(.09,t+offset+.01);gain.gain.exponentialRampToValueAtTime(.001,t+offset+.24);osc.connect(gain).connect(audioCtx.destination);osc.start(t+offset);osc.stop(t+offset+.25);});}
function toggleSound(){muted=!muted;audioReady();$('soundLabel').textContent=muted?'OFF':'ON';$('sound').setAttribute('aria-label',muted?'소리 켜기':'소리 끄기');$('sound').setAttribute('aria-pressed',String(!muted));}
function notify(title,subtitle='',color='#fff2ce'){const node=$('feedback');node.replaceChildren();node.append(document.createTextNode(title));if(subtitle){const small=document.createElement('small');small.textContent=subtitle;node.append(small);}node.style.color=color;node.style.opacity='1';feedbackUntil=performance.now()+1600;}
function snapshot(){return {phase:state.phase,outcome:state.outcome,rings:state.hits,checked:state.next,total:12,score:state.score,time:Math.ceil(state.time),altitude:Math.round(state.y),speed:Math.round(state.speed*3.6),boost:Math.round(state.boost),lives:state.lives};}
function start(){startFlight(state);keys.clear();ringData.forEach((r,i)=>{r.result=null;ringMeshes[i].visible=true;ringMeshes[i].children[0].material.color.set(0xffc366);});particles.forEach(p=>scene.remove(p.mesh));particles.length=0;plane.position.set(0,100,0);plane.rotation.set(0,0,0);plane.visible=true;camera.position.set(0,124,70);camera.fov=57;camera.updateProjectionMatrix();$('startCard').hidden=true;$('overlay').hidden=true;document.body.classList.add('playing');$('targetHint').hidden=false;audioReady();notify('좋은 비행 되세요','WASD / 방향키 · 링의 가운데를 향해');$('game').focus({preventScroll:true});updateHud();}
function pause(){if(state.phase!=='flying')return;state.phase='paused';keys.clear();$('dialogTag').textContent='FLIGHT PAUSED';$('dialogTitle').textContent='잠시 쉬어가기';$('dialogDescription').textContent='P 또는 Enter를 누르면 비행을 계속합니다.';$('resultStats').hidden=true;$('resumeLabel').textContent='비행 계속';$('resumeKey').textContent='P';$('restartButton').hidden=false;$('overlay').hidden=false;$('resumeButton').focus({preventScroll:true});updateHud();}
function resume(){if(state.phase!=='paused')return;state.phase='flying';keys.clear();$('overlay').hidden=true;$('game').focus({preventScroll:true});audioReady();last=performance.now();updateHud();}
function end(){keys.clear();const won=state.outcome==='win';const perfect=state.hits===12;const newRecord=state.score>best;if(newRecord){best=state.score;try{localStorage.setItem('skyline-best-v1',String(best));}catch{}}
 $('dialogTag').textContent=won?(perfect?'PERFECT FLIGHT':'MISSION COMPLETE'):'FLIGHT COMPLETE';
 $('dialogTitle').textContent=won?(perfect?'완벽한 비행!':'멋진 비행이었어요'):'다시 날아볼까요?';
 $('dialogDescription').textContent=state.outcome==='crash'?'바다에 세 번 닿았어요. W 또는 ↑로 고도를 높여 보세요.':state.outcome==='timeout'?'제한시간이 끝났어요. 링을 통과하면 2초를 얻습니다.':won?'아일랜드 코스를 완주했습니다. 다음엔 모든 링의 정중앙을 노려보세요.':'완주 성공까지 링 8개가 필요해요. 다음 비행에서 도전해 보세요.';
 $('resultStats').replaceChildren();[[newRecord?'새 최고 점수':'이번 점수',state.score.toLocaleString()],['통과한 링',`${state.hits} / 12`],['이 기기 최고',best.toLocaleString()]].forEach(([label,value])=>{const span=document.createElement('span');span.textContent=label;const b=document.createElement('strong');b.textContent=value;span.append(b);$('resultStats').append(span);});
 $('resultStats').hidden=false;$('resumeLabel').textContent='다시 비행하기';$('resumeKey').textContent='ENTER ↵';$('restartButton').hidden=true;$('overlay').hidden=false;$('resumeButton').focus({preventScroll:true});$('targetHint').hidden=true;chime(won);updateHud();
}
function burst(index){const r=ringData[index];for(let j=0;j<28;j++){const a=j/28*Math.PI*2;const mesh=new THREE.Mesh(particleGeo,particleMat);mesh.position.set(r.x+Math.cos(a)*25,r.y+Math.sin(a)*25,r.z);scene.add(mesh);particles.push({mesh,v:new THREE.Vector3(Math.cos(a)*12,Math.sin(a)*12,12),life:1});}}
function updateHud(){const s=state;$('score').textContent=String(s.score).padStart(5,'0');const seconds=Math.max(0,Math.ceil(s.time));$('timer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;document.querySelector('.scoreboard').classList.toggle('danger',seconds<=15);$('ringCount').innerHTML=`${String(s.hits).padStart(2,'0')} <small>/ 12 RINGS</small>`;$('speed').textContent=Math.round(s.speed*3.6);$('altitude').textContent=Math.round(s.y);$('speedBar').style.width=`${s.speed/113*100}%`;$('altitudeBar').style.width=`${s.y/265*100}%`;$('boostBar').style.width=`${s.boost}%`;$('boostText').textContent=s.boosting?'부스트 사용 중':s.boost<99?'부스트 충전 중':'가속 준비 완료';$('statusText').textContent=s.phase==='ready'?'READY TO FLY':s.phase==='paused'?'FLIGHT PAUSED':s.phase==='ended'?'FLIGHT COMPLETE':s.boosting?'BOOST ACTIVE':'CRUISING';$('lives').textContent='♥ '.repeat(s.lives)+'♡ '.repeat(3-s.lives);$('lowWarning').hidden=s.y>34||s.phase!=='flying';$('routePercent').textContent=Math.min(100,Math.round(-s.z/2825*100))+'%';if(s.next<12){$('distance').textContent=Math.max(0,Math.round(s.z-COURSE[s.next].z))+' m';}
 [...$('segments').children].forEach((el,i)=>el.className=s.results[i]||'');drawMap();}
const supported=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter','KeyP','Escape','KeyR','KeyM']);
window.addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey||!supported.has(e.code))return;e.preventDefault();if(e.repeat)return;keys.add(e.code);if(e.code==='Enter'){if(state.phase==='ready'||state.phase==='ended')start();else if(state.phase==='paused')resume();}else if(e.code==='KeyP'||e.code==='Escape'){state.phase==='flying'?pause():resume();}else if(e.code==='KeyR')start();else if(e.code==='KeyM')toggleSound();});
window.addEventListener('keyup',e=>{keys.delete(e.code);if(supported.has(e.code))e.preventDefault();});
window.addEventListener('blur',()=>{keys.clear();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();pause();}});
$('startButton').addEventListener('click',start);$('resumeButton').addEventListener('click',()=>state.phase==='ended'?start():resume());$('restartButton').addEventListener('click',start);$('sound').addEventListener('click',toggleSound);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();$('error').hidden=false;$('error').textContent='3D 화면 연결이 잠시 끊겼어요. 페이지를 새로고침하면 다시 비행할 수 있습니다.';});
const cameraGoal=new THREE.Vector3(),lookGoal=new THREE.Vector3();let hudTick=0;
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;
 if(state.phase==='flying'){
  const events=stepFlight(state,dt,{left:keys.has('KeyA')||keys.has('ArrowLeft'),right:keys.has('KeyD')||keys.has('ArrowRight'),up:keys.has('KeyW')||keys.has('ArrowUp'),down:keys.has('KeyS')||keys.has('ArrowDown'),boost:keys.has('Space')});
  for(const e of events){if(e.type==='hit'){ringData[e.index].result='hit';ringMeshes[e.index].visible=false;burst(e.index);notify(e.perfect?'PERFECT!':`NICE FLIGHT!`,`+${e.points}  ·  ${Math.min(e.combo,5)}× COMBO  ·  +2초`);chime();}else if(e.type==='miss'){ringData[e.index].result='miss';ringMeshes[e.index].visible=false;notify('다음 링을 노려보세요','−5초 · 연속 보너스 초기화','#ffe7d1');chime(false);}else if(e.type==='collision'){notify('바다에 닿았어요','기체 복구 · W / ↑로 상승','#ffd7c0');chime(false);}else if(e.type==='end')end();}
  plane.position.set(state.x,state.y,state.z);const smooth=1-Math.exp(-dt*5);plane.rotation.z+=(-state.vx*.009-plane.rotation.z)*smooth;plane.rotation.x+=(state.vy*.006-plane.rotation.x)*smooth;plane.rotation.y+=(-state.vx*.002-plane.rotation.y)*smooth;plane.visible=state.invulnerable<=0||Math.floor(now/120)%2===0;
  cameraGoal.set(state.x*.83,state.y+24,state.z+70);camera.position.lerp(cameraGoal,1-Math.exp(-dt*4));lookGoal.set(state.x*.96,state.y+8,state.z-150);camera.lookAt(lookGoal);camera.fov+=((state.boosting?65:57)-camera.fov)*smooth;camera.updateProjectionMatrix();
 }else if(state.phase==='ready'){plane.position.y=100+Math.sin(now*.0008)*.9;plane.rotation.z=Math.sin(now*.00045)*.025;}
 if(state.phase==='ready'||state.phase==='flying'){propeller.rotation.z+=dt*(state.boosting?62:38);particles.forEach(p=>{p.life-=dt;p.mesh.position.addScaledVector(p.v,dt);p.mesh.scale.setScalar(Math.max(0,p.life));});for(let i=particles.length-1;i>=0;i--)if(particles[i].life<=0){scene.remove(particles[i].mesh);particles.splice(i,1);}}
 if(engineGain&&audioCtx){engineGain.gain.setTargetAtTime(!muted&&state.phase==='flying'?.022:0,audioCtx.currentTime,.2);engine.frequency.setTargetAtTime(42+state.speed*.65,audioCtx.currentTime,.1);}
 if(now>feedbackUntil)$('feedback').style.opacity='0';hudTick+=dt;if(hudTick>.08){updateHud();hudTick=0;}renderer.render(scene,camera);
}
const context=document.modelContext;
if(context?.registerTool){const controller=new AbortController();const register=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:controller.signal})).catch(()=>{});}catch{}};
 register({name:'get_flight_status',title:'비행 상태 확인',description:'현재 점수, 통과한 링, 남은 시간과 비행 상태를 확인합니다.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:input=>{if(input&&Object.keys(input).length)throw new Error('입력값이 필요하지 않습니다.');return snapshot();}});
 register({name:'control_flight',title:'비행 시작 또는 일시정지',description:'화면의 버튼과 동일하게 비행을 시작, 일시정지, 재개하거나 처음부터 다시 시작합니다. restart는 현재 점수를 초기화합니다.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['start','pause','resume','restart']}},required:['action'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||Object.keys(input).length!==1||!['start','pause','resume','restart'].includes(input.action))throw new Error('올바른 비행 동작을 선택하세요.');const a=input.action;if(a==='start'&&state.phase!=='ready'&&state.phase!=='ended')throw new Error('진행 중인 비행은 resume 또는 restart를 사용하세요.');if(a==='pause'&&state.phase!=='flying')throw new Error('비행 중에만 일시정지할 수 있습니다.');if(a==='resume'&&state.phase!=='paused')throw new Error('일시정지 상태에서만 계속할 수 있습니다.');if(a==='start'||a==='restart')start();else if(a==='pause')pause();else resume();return snapshot();}});
 window.addEventListener('pagehide',()=>controller.abort(),{once:true});
}
updateHud();$('game').focus({preventScroll:true});requestAnimationFrame(animate);
