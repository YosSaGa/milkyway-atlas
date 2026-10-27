import SceneLoading from './scene-loading';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Orbit, Plus, Minus, RotateCcw, Pause, Play } from 'lucide-react';
import '../galaxy-hub.css';
const planets = [
 ['mercury','ดาวพุธ',.17],['venus','ดาวศุกร์',.25],['earth','โลก',.27],['mars','ดาวอังคาร',.21],
 ['jupiter','ดาวพฤหัสบดี',.55],['saturn','ดาวเสาร์',.46],['uranus','ดาวยูเรนัส',.34],['neptune','ดาวเนปจูน',.33],
] as const;
type Level='galaxy'|'solar';
export default function GalaxyHub(){
 const host=useRef<HTMLDivElement>(null),marker=useRef<HTMLButtonElement>(null),labels=useRef<(HTMLAnchorElement|null)[]>([]);
 const actions=useRef<{enter:()=>void;back:()=>void;reset:()=>void;zoom:(n:number)=>void;select:(id:string)=>void}|null>(null);
 const [level,setLevel]=useState<Level>('solar'),[moving,setMoving]=useState(false),[status,setStatus]=useState('loading');
 const [destination,setDestination]=useState('');
 const [focused,setFocused]=useState('');
 const detailButton=useRef<HTMLAnchorElement>(null);
 useEffect(()=>{if(focused)detailButton.current?.focus({preventScroll:true});},[focused]);
 const [loadProgress,setLoadProgress]=useState(0);
 const [paused,setPaused]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 const pausedRef=useRef(paused);pausedRef.current=paused;
 const interacting=useRef(false);
 const hovered=useRef<string|null>(null);
 useEffect(()=>{
  let gone=false,dispose=()=>{};
  Promise.all([import('three'),import('three/addons/controls/OrbitControls.js'),import('three/addons/loaders/GLTFLoader.js')]).then(([T,{OrbitControls},{GLTFLoader}])=>{
   if(gone||!host.current)return;
   const el=host.current,renderer=new T.WebGLRenderer({antialias:true,alpha:false});
   renderer.setClearColor('#02040a');renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));el.appendChild(renderer.domElement);
   const scene=new T.Scene(),camera=new T.PerspectiveCamera(48,1,.1,250),controls=new OrbitControls(camera,renderer.domElement);
   controls.enableDamping=true;controls.enablePan=false;controls.minDistance=5;controls.maxDistance=90;controls.maxPolarAngle=Math.PI*.86;
   const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   const galaxy=new T.Group(),solar=new T.Group();galaxy.visible=false;scene.add(galaxy,solar);
   const textures:import('three').Texture[]=[];
   let seed=79;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
   function particles(count:number,kind:'disk'|'core'|'sky'){
    const pos=new Float32Array(count*3),col=new Float32Array(count*3),size=new Float32Array(count);
    for(let i=0;i<count;i++){
     let x,y,z;const c=new T.Color();
     if(kind==='disk'){
      const r=.8+Math.pow(rand(),.65)*9,a=(i%4)*Math.PI/2+Math.log(r+1)*2.7+(rand()-.5)*(.22+r*.045);
      x=Math.cos(a)*r;y=(rand()-.5)*(.12+.18*(1-r/10));z=Math.sin(a)*r;
      c.setRGB(.42+rand()*.3,.5+rand()*.25,.8+rand()*.2);if(rand()<.035)c.setRGB(.95,.4,.62);
     }else if(kind==='core'){
      const r=Math.pow(rand(),1.7)*2.3,a=rand()*Math.PI*2,h=rand()*2-1;
      x=Math.cos(a)*r;y=h*r*.36;z=Math.sin(a)*r*.55;c.setRGB(1,.68+rand()*.2,.4+rand()*.3);
     }else{const r=50+rand()*40,a=rand()*Math.PI*2,h=rand()*2-1;x=Math.cos(a)*r*Math.sqrt(1-h*h);y=h*r;z=Math.sin(a)*r*Math.sqrt(1-h*h);c.setRGB(.55,.65,.8);}
     pos.set([x,y,z],i*3);col.set([c.r,c.g,c.b],i*3);size[i]=kind==='core'?3+rand()*8:kind==='sky'?2+rand()*3:2+rand()*6;
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('color',new T.BufferAttribute(col,3));geo.setAttribute('pointSize',new T.BufferAttribute(size,1));
    const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,blending:T.AdditiveBlending,
     vertexShader:'attribute float pointSize;varying vec3 tint;void main(){tint=color;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(pointSize*12.0/-p.z,1.,24.);}',
     fragmentShader:'varying vec3 tint;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(tint,exp(-r*r*5.)*.7);}' });
    return new T.Points(geo,mat);
   }
   galaxy.add(particles(innerWidth<700?20000:44000,'disk'),particles(9500,'core'));scene.add(particles(3200,'sky'));
   const band=particles(18000,'sky');const bp=band.geometry.attributes.position;for(let i=0;i<bp.count;i++){const x=(rand()-.5)*150,w=(rand()+rand()+rand()-1.5)*(5+3*Math.sin(x*.07));bp.setXYZ(i,x,x*.28+Math.sin(x*.09)*3+w,-65-rand()*20);}scene.add(band);
   const origin=new T.Vector3(4.8,.12,3.2);
   const beacon=new T.Mesh(new T.SphereGeometry(.085,16,12),new T.MeshBasicMaterial({color:'#d6eeff'}));beacon.position.copy(origin);galaxy.add(beacon);
   const sunMaterial=new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec3 surface;varying vec3 n;void main(){surface=position;n=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:
     'uniform float time;varying vec3 surface;varying vec3 n;float hash(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}void main(){vec3 p=surface*12.+vec3(time*.015,0,0);float v=noise(p)*.5+noise(p*2.1)*.3+noise(p*5.)*.2;vec3 color=mix(vec3(1.,.22,.025),vec3(1.,.88,.43),v);gl_FragColor=vec4(color*1.35,1.);}' });
   const sun=new T.Mesh(new T.SphereGeometry(1.5,64,48),sunMaterial);sun.position.set(-8,4,-12);solar.add(sun);
   const glowCanvas=document.createElement('canvas');glowCanvas.width=256;glowCanvas.height=256;const ctx=glowCanvas.getContext('2d')!;const glowGradient=ctx.createRadialGradient(128,128,10,128,128,128);glowGradient.addColorStop(0,'rgba(255,225,148,1)');glowGradient.addColorStop(.2,'rgba(255,160,55,.7)');glowGradient.addColorStop(.45,'rgba(238,86,12,.13)');glowGradient.addColorStop(1,'rgba(180,50,8,0)');ctx.fillStyle=glowGradient;ctx.fillRect(0,0,256,256);const glowMap=new T.CanvasTexture(glowCanvas);textures.push(glowMap);const corona=new T.Sprite(new T.SpriteMaterial({map:glowMap,color:'#ffd4a2',transparent:true,blending:T.AdditiveBlending,depthWrite:false}));corona.scale.set(11,11,1);corona.material.opacity=.55;corona.position.copy(sun.position);solar.add(corona);
   const light=new T.DirectionalLight('#dceaff',1.8);const sunlight=new T.PointLight('#ffd4a3',18,0,1);sunlight.position.copy(sun.position);solar.add(sunlight);scene.add(light,new T.AmbientLight('#b9c9df',.18));
   // Distant cloud layers and nearby motes provide parallax without postprocessing.
   for(let i=0;i<12;i++){const haze=new T.Sprite(new T.SpriteMaterial({map:glowMap,color:i%3===0?'#6b476e':'#294c73',transparent:true,opacity:.09,depthWrite:false,blending:T.AdditiveBlending}));haze.position.set(-45+i*8,(-45+i*8)*.28,-60);haze.scale.set(30,18,1);scene.add(haze);}
   const dust=new T.Group();const dustGeo=new T.BufferGeometry(),dp=new Float32Array(450*3);for(let i=0;i<450;i++)dp.set([(rand()-.5)*70,(rand()-.5)*35,(rand()-.5)*60],i*3);dustGeo.setAttribute('position',new T.BufferAttribute(dp,3));dust.add(new T.Points(dustGeo,new T.PointsMaterial({size:.025,color:'#bdcbd9',transparent:true,opacity:.38,depthWrite:false})));scene.add(dust);
   const spheres:import('three').Group[]=[];let solarLoaded=false,loadedModels=0;
   const releaseModel=(root:import('three').Object3D)=>root.traverse(o=>{const m=o as import('three').Mesh;m.geometry?.dispose();if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(mat=>{Object.values(mat).forEach(value=>{if(value instanceof T.Texture)value.dispose();});mat.dispose();});});
   function loadSolar(){if(solarLoaded)return;solarLoaded=true;const loader=new GLTFLoader(),queue:(()=>Promise<void>)[]=[];
    planets.forEach(([id,,size],i)=>{
     const layout=[[-4,1,-7],[-1,3,-12],[4,-.8,7],[-2,-2,-2],[8,3,-9],[-7,-2,2],[1,5,-19],[16,-1,-6]][i];const r=Math.hypot(layout[0],layout[2]),a=Math.atan2(layout[2],layout[0]);
     const anchor=new T.Group();anchor.position.set(...layout as [number,number,number]);Object.assign(anchor.userData,{id,radius:r,angle:a,height:layout[1],speed:.006/(1+i*.3)});solar.add(anchor);spheres.push(anchor);
     /* const pts=Array.from({length:161},(_,n)=>new T.Vector3(Math.cos(n*Math.PI/80)*r,0,Math.sin(n*Math.PI/80)*r));
     solar.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:'#92a9c3',transparent:true,opacity:.085}))); */
     queue.push(()=>new Promise<void>(done=>{const loadModel=(attempt=0)=>loader.load('/models/overview/'+id+'.glb'+(attempt?'?retry='+attempt:''),async gltf=>{
      const model=gltf.scene;if(gone){releaseModel(model);done();return;}
      const body=model.getObjectByName(id[0].toUpperCase()+id.slice(1)) as import('three').Mesh|undefined;
      if(!body?.geometry){releaseModel(model);setStatus('error');done();return;}
      body.geometry.computeBoundingSphere();model.scale.setScalar((id==='earth'?2.4:id==='saturn'?1.3:id==='jupiter'?1.8:size*2)/(body.geometry.boundingSphere?.radius||1));
      model.traverse(o=>{o.userData.id=id;const mesh=o as import('three').Mesh;if(!mesh.material)return;
       (Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(material=>{
        const mat=material as import('three').MeshStandardMaterial;
        if(mat.emissiveMap)mat.emissiveIntensity=.12;
        if(mat.transparent){mat.depthWrite=false;mat.side=T.DoubleSide;}
        Object.values(mat).forEach(value=>{if(value instanceof T.Texture)value.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());});
       });
      });
      if(id==='saturn')model.rotation.x=.35;
      if(id==='earth'||id==='neptune'||id==='venus'){
       const rim=new T.Mesh(body.geometry.clone(),new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{tint:{value:new T.Color(id==='venus'?'#e4bd82':'#498dff')}},vertexShader:'varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'uniform vec3 tint;varying vec3 n;varying vec3 v;void main(){float f=pow(1.-max(dot(normalize(n),normalize(v)),0.),4.);gl_FragColor=vec4(tint,f*.45);}'}));rim.scale.setScalar(1.018);rim.userData.id=id;body.add(rim);
      }
      anchor.add(model);loadedModels++;setLoadProgress(loadedModels/planets.length*95);if(loadedModels===planets.length){try{await renderer.compileAsync(scene,camera);if(!gone){renderer.render(scene,camera);setLoadProgress(100);setStatus('ready');}}catch{if(!gone)setStatus('error');}}done();
     },undefined,error=>{if(gone){done();return;}if(attempt<2){loadModel(attempt+1);return;}console.warn('Planet model failed:',id,error);setStatus('error');done();});loadModel();}));
    });
    const work=async()=>{while(queue.length&&!gone)await queue.shift()!();};void work();void work();
   }
   loadSolar();
   // Camera-local streaks create acceleration parallax without a full-screen blur pass.
   const streakPositions=new Float32Array(120*6),streakSeeds=Array.from({length:120},()=>({angle:rand()*Math.PI*2,r:2+rand()*12,z:rand()*28}));
   const streakGeometry=new T.BufferGeometry();streakGeometry.setAttribute('position',new T.BufferAttribute(streakPositions,3));
   const streakMaterial=new T.LineBasicMaterial({color:'#a9dfff',transparent:true,opacity:0,depthWrite:false,depthTest:false,blending:T.AdditiveBlending});
   const streaks=new T.LineSegments(streakGeometry,streakMaterial);streaks.frustumCulled=false;streaks.visible=false;camera.add(streaks);scene.add(camera);
   let selected='',travelling=false,travelDistance=7,travelStart=0;const travelPosition=new T.Vector3(),travelCamera=new T.Vector3(),travelTarget=new T.Vector3(),travelOffset=new T.Vector3(),flightOffset=new T.Vector3(),flightAxis=new T.Vector3(0,1,0);
   let current:Level='solar',flight=0,start=0,frame=0,last=performance.now();const fromCamera=new T.Vector3(),fromTarget=new T.Vector3();
   const home=()=>{camera.fov=48;camera.up.set(0,1,0);camera.updateProjectionMatrix();streaks.visible=false;selected='';travelling=false;setFocused('');setDestination('');setMoving(false);controls.enabled=true;controls.minDistance=5;controls.maxDistance=90;controls.target.set(0,0,0);camera.position.set(0,current==='galaxy'?13:2,current==='galaxy'?19:24);const fit=(current==='galaxy'?10:9)/Math.sin(24*Math.PI/180)/Math.min(el.clientWidth/el.clientHeight,1)*.92;camera.position.setLength(Math.max(camera.position.length(),fit));controls.update();};home();
   actions.current={select:id=>{if(travelling||flight)return;const target=spheres.find(s=>s.userData.id===id);if(!target)return;selected=id;travelling=true;setFocused('');const bounds=new T.Box3().setFromObject(target).getBoundingSphere(new T.Sphere());travelDistance=Math.max(2,bounds.radius/Math.sin(24*Math.PI/180)/Math.min(camera.aspect,1)*1.15);controls.minDistance=Math.max(.6,bounds.radius*1.3);controls.maxDistance=Math.max(13,travelDistance*2);hovered.current=null;travelStart=performance.now();travelPosition.copy(target.position);controls.update();travelCamera.copy(camera.position);travelOffset.copy(camera.position).sub(target.position);travelTarget.copy(controls.target);controls.enabled=false;setDestination(planets.find(p=>p[0]===id)?.[1]||'');setMoving(true);},enter:()=>{if(current!=='galaxy'||flight)return;loadSolar();flight=1;start=performance.now();fromCamera.copy(camera.position);fromTarget.copy(controls.target);controls.enabled=false;setMoving(true);},back:()=>{flight=0;current='galaxy';galaxy.visible=true;solar.visible=false;controls.enabled=true;setLevel('galaxy');setMoving(false);home();},reset:home,zoom:n=>{camera.position.sub(controls.target).multiplyScalar(n).clampLength(controls.minDistance,controls.maxDistance).add(controls.target);controls.update();}};
   const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(el);resize();
   const ray=new T.Raycaster(),pointer=new T.Vector2();let downX=0,downY=0;
   const down=(e:PointerEvent)=>{interacting.current=true;downX=e.clientX;downY=e.clientY;};
   const up=(e:PointerEvent)=>{interacting.current=false;if(flight||Math.hypot(e.clientX-downX,e.clientY-downY)>6)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);if(current==='solar'){const hit=ray.intersectObjects(spheres,true)[0];if(hit)actions.current?.select(hit.object.userData.id);}else if(ray.intersectObject(beacon).length)actions.current?.enter();};
   const hover=(e:PointerEvent)=>{if(current!=='solar'||e.buttons)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(spheres,true)[0];hovered.current=hit?hit.object.userData.id:null;renderer.domElement.style.cursor=hit?'pointer':'grab';};
   const leave=()=>{hovered.current=null;};renderer.domElement.addEventListener('pointermove',hover);renderer.domElement.addEventListener('pointerleave',leave);
   const release=()=>{interacting.current=false;};window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('blur',release);
   renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
   const lost=(e:Event)=>{e.preventDefault();setStatus('error');};renderer.domElement.addEventListener('webglcontextlost',lost);
   const projected=new T.Vector3();
   function place(node:HTMLElement|null,position:import('three').Vector3,visible:boolean){if(!node)return;projected.copy(position).project(camera);const shown=visible&&projected.z>-1&&projected.z<1&&Math.abs(projected.x)<1&&Math.abs(projected.y)<1;node.style.visibility=shown?'visible':'hidden';node.style.left=`${(projected.x*.5+.5)*el.clientWidth}px`;node.style.top=`${(-projected.y*.5+.5)*el.clientHeight}px`;}
   const tick=(now:number)=>{if(gone)return;frame=requestAnimationFrame(tick);const delta=Math.min(Math.max((now-last)/1000,0),.05);last=now;if(document.hidden)return;
    if(current==='solar'&&!flight&&!selected&&!pausedRef.current&&!interacting.current){spheres.forEach(sphere=>{sphere.userData.angle=(sphere.userData.angle+delta*sphere.userData.speed)%(Math.PI*2);const a=sphere.userData.angle,r=sphere.userData.radius;sphere.position.set(Math.cos(a)*r,sphere.userData.height,Math.sin(a)*r);});}
    if(flight){const t=reduced?1:Math.min((now-start)/1500,1),ease=t*t*(3-2*t);camera.position.lerpVectors(fromCamera,origin.clone().add(new T.Vector3(0,1.2,2.5)),ease);controls.target.lerpVectors(fromTarget,origin,ease);if(t===1){flight=0;current='solar';galaxy.visible=false;solar.visible=true;setLevel('solar');setMoving(false);controls.enabled=true;home();}}
    if(travelling){
     const t=Math.min((now-travelStart)/(reduced?1000:3200),1),e=t*t*t*(t*(t*6-15)+10);
     const energy=reduced?0:Math.pow(Math.sin(Math.PI*t),2),turn=reduced?.18:1.85;
     // Orbit the destination while pulling inward; the radius bump clears the surface.
     const radius=T.MathUtils.lerp(travelOffset.length(),travelDistance,e)+Math.sin(Math.PI*e)*travelDistance*.5;
     flightOffset.copy(travelOffset).normalize().applyAxisAngle(flightAxis,turn*e).multiplyScalar(radius);
     flightOffset.y+=Math.sin(Math.PI*e)*travelDistance*.35;
     camera.position.copy(travelPosition).add(flightOffset);
     controls.target.lerpVectors(travelTarget,travelPosition,1-Math.pow(1-e,3));
     camera.fov=48+energy*16;camera.updateProjectionMatrix();camera.up.set(0,1,0);camera.lookAt(controls.target);
     camera.rotateZ(-Math.sin(Math.PI*t*2)*energy*.075);
     streaks.visible=energy>.005;streakMaterial.opacity=energy*.48;
     streakSeeds.forEach((v,i)=>{const z=-2-((v.z+(now-travelStart)*.018)%28),x=Math.cos(v.angle)*v.r,y=Math.sin(v.angle)*v.r;
      streakPositions.set([x,y,z,x*1.025,y*1.025,z-1-energy*4],i*6);});
     streakGeometry.attributes.position.needsUpdate=true;
     if(t===1){travelling=false;streaks.visible=false;camera.fov=48;camera.up.set(0,1,0);camera.lookAt(controls.target);camera.updateProjectionMatrix();controls.enabled=true;controls.update();setMoving(false);setFocused(selected);}
    }
    if(!reduced&&!pausedRef.current){dust.rotation.y+=delta*.008;corona.material.opacity=.55+Math.sin(now*.0007)*.035;}
    if(!travelling)controls.update();light.position.copy(camera.position).add(new T.Vector3(-5,4,0));camera.updateMatrixWorld();place(marker.current,origin,current==='galaxy'&&!flight);spheres.forEach((sphere,i)=>place(labels.current[i],sphere.position,current==='solar'&&!selected&&hovered.current===sphere.userData.id));sunMaterial.uniforms.time.value=now/1000;renderer.render(scene,camera);
   };frame=requestAnimationFrame(tick);
   dispose=()=>{window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);window.removeEventListener('blur',release);cancelAnimationFrame(frame);renderer.domElement.removeEventListener('pointermove',hover);renderer.domElement.removeEventListener('pointerleave',leave);ro.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('webglcontextlost',lost);releaseModel(scene);textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();actions.current=null;};
  }).catch(()=>{if(!gone)setStatus('error');});return()=>{gone=true;dispose();};
 },[]);
 return <main className={`journey ${moving?'is-travelling':''} ${focused?'is-focused':''}`}><div ref={host} className="journey-stage"/>
  <header className="journey-header"><a href="/" className="journey-brand"><Orbit size={23}/> MILKY WAY <small>ATLAS</small></a><a href="/?view=about">เรื่องราวทางช้างเผือก <ArrowUpRight size={14}/></a></header>
  <section className="journey-title"><span>{level==='galaxy'?'01 / THE MILKY WAY':'MISSION 01 / SOLAR FRONTIER'}</span><h1>{level==='galaxy'?'ทางช้างเผือก':<>ออกไป<br/>ไกลกว่า</>}</h1><p>{moving?'กำลังเดินทางสู่ระบบสุริยะ…':level==='galaxy'?'กาแลคซี่ของเรา และบ้านเล็ก ๆ ที่อยู่ข้างใน':'จากบ้านสีน้ำเงิน สู่แปดโลกท่ามกลางความมืด'}</p>{level==='galaxy'?<button disabled={moving||status!=='ready'} onClick={()=>actions.current?.enter()}>ไปยังระบบสุริยะ <ArrowUpRight size={15}/></button>:<button onClick={()=>actions.current?.back()}><ArrowLeft size={15}/> กลับสู่ทางช้างเผือก</button>}</section>
  <button ref={marker} className="journey-marker" style={{visibility:'hidden'}} onClick={()=>actions.current?.enter()} disabled={moving} aria-label="เข้าสู่ระบบสุริยะ"><i/><span>เราอยู่ที่นี่<small>SOLAR SYSTEM ↗</small></span></button>
  {planets.map(([id,name],i)=><a ref={node=>{labels.current[i]=node;}} style={{visibility:'hidden'}} onPointerEnter={()=>{interacting.current=true;}} onPointerLeave={()=>{interacting.current=false;}} onFocus={()=>{interacting.current=true;}} onBlur={()=>{interacting.current=false;}} className="journey-label" key={id} href={`/?view=${id}`} onClick={e=>{if(!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&status==='ready'){e.preventDefault();actions.current?.select(id);}}} tabIndex={level==='solar'?0:-1}>{name}<ArrowUpRight size={12}/></a>)}
  {status!=='ready'&&<SceneLoading title="ระบบสุริยะ" progress={loadProgress} phase={loadProgress>=95?'กำลังจัดแสงและเตรียมภาพ':'กำลังโหลดดาวเคราะห์ทั้ง 8 ดวง'} error={status==='error'} onRetry={()=>window.location.reload()}/>}

  {(level==='solar'||status==='error')&&<nav className="journey-destinations" aria-label="เลือกดาวเคราะห์">{planets.map(([id,name])=><a key={id} onPointerEnter={()=>{hovered.current=id;interacting.current=true;}} onPointerLeave={()=>{hovered.current=null;interacting.current=false;}} onFocus={()=>{hovered.current=id;interacting.current=true;}} onBlur={()=>{hovered.current=null;interacting.current=false;}} href={`/?view=${id}`} onClick={e=>{if(!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&status==='ready'){e.preventDefault();actions.current?.select(id);}}}><small>{String(planets.findIndex(p=>p[0]===id)+1).padStart(2,'0')}</small><span>{name}</span></a>)}</nav>}
  {moving&&destination&&<div className="journey-flight" role="status"><span>ORBITAL APPROACH / กำลังเดินทาง</span><strong>{destination}</strong><i/></div>}
  {focused&&<section className="journey-arrival" aria-label="ดาวที่เลือก"><span>ARRIVAL / {focused.toUpperCase()}</span><h2>{destination}</h2><p>ลากหมุนชมได้ หรือเปิดรายละเอียดเพื่อสำรวจต่อ</p><div><a ref={detailButton} className="journey-detail" href={`/?view=${focused}`}>ดูรายละเอียด <ArrowUpRight size={16}/></a><button onClick={()=>actions.current?.reset()}><ArrowLeft size={15}/> กลับหน้ารวม</button></div></section>}
  <div className="journey-coordinate" aria-hidden="true">LOCAL ARM · ORION<br/><span>25,000 LY FROM GALACTIC CENTER</span></div>
  <footer className="journey-footer"><div>ลากเพื่อหมุน · เลื่อนเพื่อซูม<small>ภาพจำลองเพื่อสำรวจ · ขนาด ระยะห่าง และความเร็วโคจรปรับเพื่อการนำเสนอ</small></div><div className="journey-controls">{level==='solar'&&!focused&&<button disabled={status!=='ready'||moving} onClick={()=>setPaused(!paused)} aria-label={paused?'เริ่มการโคจร':'หยุดการโคจร'} aria-pressed={paused}>{paused?<Play size={17}/>:<Pause size={17}/>}</button>}<button disabled={status!=='ready'||moving} onClick={()=>actions.current?.zoom(.85)} aria-label="ซูมเข้า"><Plus size={18}/></button><button disabled={status!=='ready'||moving} onClick={()=>actions.current?.zoom(1.18)} aria-label="ซูมออก"><Minus size={18}/></button><button disabled={status!=='ready'||moving} onClick={()=>actions.current?.reset()} aria-label="รีเซ็ตมุมกล้อง"><RotateCcw size={17}/></button></div></footer>
 </main>;
}
