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
 const actions=useRef<{enter:()=>void;back:()=>void;reset:()=>void;zoom:(n:number)=>void}|null>(null);
 const [level,setLevel]=useState<Level>('solar'),[moving,setMoving]=useState(false),[status,setStatus]=useState('loading');
 const [paused,setPaused]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 const pausedRef=useRef(paused);pausedRef.current=paused;
 const interacting=useRef(false);
 useEffect(()=>{
  let gone=false,dispose=()=>{};
  Promise.all([import('three'),import('three/addons/controls/OrbitControls.js')]).then(([T,{OrbitControls}])=>{
   if(gone||!host.current)return;
   const el=host.current,renderer=new T.WebGLRenderer({antialias:true,alpha:false});
   renderer.setClearColor('#02040a');renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));el.appendChild(renderer.domElement);
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
   galaxy.add(particles(innerWidth<700?20000:44000,'disk'),particles(9500,'core'));scene.add(particles(1300,'sky'));
   const origin=new T.Vector3(4.8,.12,3.2);
   const beacon=new T.Mesh(new T.SphereGeometry(.085,16,12),new T.MeshBasicMaterial({color:'#d6eeff'}));beacon.position.copy(origin);galaxy.add(beacon);
   const sun=new T.Mesh(new T.SphereGeometry(.62,32,24),new T.MeshBasicMaterial({color:'#ffe3a0'}));solar.add(sun);
   const light=new T.DirectionalLight('#fff3df',2.6);scene.add(light,new T.AmbientLight('#c1d8ef',1.2));
   const spheres:import('three').Mesh[]=[];let solarLoaded=false;
   function loadSolar(){if(solarLoaded)return;solarLoaded=true;const loader=new T.TextureLoader();
    planets.forEach(([id,,size],i)=>{
     const r=1.6+i*1.04,a=[.4,2.2,4.2,5.4,3.1,.8,4.4,5.75][i];
     const material=new T.MeshStandardMaterial({color:'#b7c2cc',roughness:1});
     const mesh=new T.Mesh(new T.SphereGeometry(size,40,28),material);mesh.position.set(Math.cos(a)*r,0,Math.sin(a)*r);mesh.userData.id=id;mesh.userData.radius=r;mesh.userData.angle=a;mesh.userData.speed=.22/(1+i*.3);solar.add(mesh);spheres.push(mesh);
     loader.load(`/planet-maps/${id}.jpg`,tex=>{if(gone){tex.dispose();return;}tex.colorSpace=T.SRGBColorSpace;textures.push(tex);material.map=tex;material.color.set('white');material.needsUpdate=true;});
     const pts=Array.from({length:161},(_,n)=>new T.Vector3(Math.cos(n*Math.PI/80)*r,0,Math.sin(n*Math.PI/80)*r));
     solar.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:'#47617d',transparent:true,opacity:.25})));
     if(id==='saturn'||id==='uranus'){const ring=new T.Mesh(new T.RingGeometry(size*1.35,size*(id==='saturn'?2.15:1.8),80),new T.MeshStandardMaterial({color:id==='saturn'?'#b1a58b':'#627a80',side:T.DoubleSide,transparent:true,opacity:id==='saturn'?.65:.35,roughness:1}));ring.rotation.x=id==='saturn'?Math.PI/2-.35:.25;mesh.add(ring);}
    });
   }
   loadSolar();
   let current:Level='solar',flight=0,start=0,frame=0,last=performance.now();const fromCamera=new T.Vector3(),fromTarget=new T.Vector3();
   const home=()=>{controls.target.set(0,0,0);camera.position.set(0,current==='galaxy'?13:15,current==='galaxy'?19:17);const fit=(current==='galaxy'?10:9)/Math.sin(24*Math.PI/180)/Math.min(el.clientWidth/el.clientHeight,1)*1.08;camera.position.setLength(Math.max(camera.position.length(),fit));controls.update();};home();
   actions.current={enter:()=>{if(current!=='galaxy'||flight)return;loadSolar();flight=1;start=performance.now();fromCamera.copy(camera.position);fromTarget.copy(controls.target);controls.enabled=false;setMoving(true);},back:()=>{flight=0;current='galaxy';galaxy.visible=true;solar.visible=false;controls.enabled=true;setLevel('galaxy');setMoving(false);home();},reset:home,zoom:n=>{camera.position.sub(controls.target).multiplyScalar(n).clampLength(controls.minDistance,controls.maxDistance).add(controls.target);controls.update();}};
   const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(el);resize();
   const ray=new T.Raycaster(),pointer=new T.Vector2();let downX=0,downY=0;
   const down=(e:PointerEvent)=>{interacting.current=true;downX=e.clientX;downY=e.clientY;};
   const up=(e:PointerEvent)=>{interacting.current=false;if(flight||Math.hypot(e.clientX-downX,e.clientY-downY)>6)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);if(current==='solar'){const hit=ray.intersectObjects(spheres,false)[0];if(hit)window.location.href=`/?view=${hit.object.userData.id}`;}else if(ray.intersectObject(beacon).length)actions.current?.enter();};
   const release=()=>{interacting.current=false;};window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('blur',release);
   renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
   const lost=(e:Event)=>{e.preventDefault();setStatus('error');};renderer.domElement.addEventListener('webglcontextlost',lost);
   const projected=new T.Vector3();
   function place(node:HTMLElement|null,position:import('three').Vector3,visible:boolean){if(!node)return;projected.copy(position).project(camera);const shown=visible&&projected.z>-1&&projected.z<1&&Math.abs(projected.x)<1&&Math.abs(projected.y)<1;node.style.visibility=shown?'visible':'hidden';node.style.left=`${(projected.x*.5+.5)*el.clientWidth}px`;node.style.top=`${(-projected.y*.5+.5)*el.clientHeight}px`;}
   const tick=(now:number)=>{if(gone)return;frame=requestAnimationFrame(tick);const delta=Math.min(Math.max((now-last)/1000,0),.05);last=now;if(document.hidden)return;
    if(current==='solar'&&!flight&&!pausedRef.current&&!interacting.current){spheres.forEach(sphere=>{sphere.userData.angle=(sphere.userData.angle+delta*sphere.userData.speed)%(Math.PI*2);const a=sphere.userData.angle,r=sphere.userData.radius;sphere.position.set(Math.cos(a)*r,0,Math.sin(a)*r);});}
    if(flight){const t=reduced?1:Math.min((now-start)/1500,1),ease=t*t*(3-2*t);camera.position.lerpVectors(fromCamera,origin.clone().add(new T.Vector3(0,1.2,2.5)),ease);controls.target.lerpVectors(fromTarget,origin,ease);if(t===1){flight=0;current='solar';galaxy.visible=false;solar.visible=true;setLevel('solar');setMoving(false);controls.enabled=true;home();}}
    controls.update();light.position.copy(camera.position);camera.updateMatrixWorld();place(marker.current,origin,current==='galaxy'&&!flight);spheres.forEach((sphere,i)=>place(labels.current[i],sphere.position,current==='solar'));renderer.render(scene,camera);
   };frame=requestAnimationFrame(tick);setStatus('ready');
   dispose=()=>{window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);window.removeEventListener('blur',release);cancelAnimationFrame(frame);ro.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(o=>{const m=o as import('three').Mesh;m.geometry?.dispose();if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(mat=>mat.dispose());});textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();actions.current=null;};
  }).catch(()=>{if(!gone)setStatus('error');});return()=>{gone=true;dispose();};
 },[]);
 return <main className="journey"><div ref={host} className="journey-stage"/>
  <header className="journey-header"><a href="/" className="journey-brand"><Orbit size={23}/> MILKY WAY <small>ATLAS</small></a><a href="/?view=about">เรื่องราวทางช้างเผือก <ArrowUpRight size={14}/></a></header>
  <section className="journey-title"><span>{level==='galaxy'?'01 / THE MILKY WAY':'02 / OUR SOLAR SYSTEM'}</span><h1>{level==='galaxy'?'ทางช้างเผือก':'ระบบสุริยะ'}</h1><p>{moving?'กำลังเดินทางสู่ระบบสุริยะ…':level==='galaxy'?'กาแลคซี่ของเรา และบ้านเล็ก ๆ ที่อยู่ข้างใน':'ดาวทั้ง 8 ดวงโคจรรอบดวงอาทิตย์ · กดดาวเพื่อสำรวจ'}</p>{level==='galaxy'?<button disabled={moving||status!=='ready'} onClick={()=>actions.current?.enter()}>ไปยังระบบสุริยะ <ArrowUpRight size={15}/></button>:<button onClick={()=>actions.current?.back()}><ArrowLeft size={15}/> กลับสู่ทางช้างเผือก</button>}</section>
  <button ref={marker} className="journey-marker" style={{visibility:'hidden'}} onClick={()=>actions.current?.enter()} disabled={moving} aria-label="เข้าสู่ระบบสุริยะ"><i/><span>เราอยู่ที่นี่<small>SOLAR SYSTEM ↗</small></span></button>
  {planets.map(([id,name],i)=><a ref={node=>{labels.current[i]=node;}} style={{visibility:'hidden'}} onPointerEnter={()=>{interacting.current=true;}} onPointerLeave={()=>{interacting.current=false;}} onFocus={()=>{interacting.current=true;}} onBlur={()=>{interacting.current=false;}} className="journey-label" key={id} href={`/?view=${id}`} tabIndex={level==='solar'?0:-1}>{name}<ArrowUpRight size={12}/></a>)}
  {status!=='ready'&&<div className="journey-status" role="status">{status==='loading'?'กำลังเปิดทางช้างเผือก…':'ฉาก WebGL เปิดไม่ได้ เลือกดาวจากรายการด้านล่างได้เลย'}</div>}
  {(level==='solar'||status==='error')&&<nav className="journey-destinations" aria-label="เลือกดาวเคราะห์">{planets.map(([id,name])=><a key={id} href={`/?view=${id}`}>{name}</a>)}</nav>}
  <footer className="journey-footer"><div>ลากเพื่อหมุน · เลื่อนเพื่อซูม<small>ภาพจำลองเพื่อสำรวจ · ขนาด ระยะห่าง และความเร็วโคจรปรับเพื่อการนำเสนอ</small></div><div className="journey-controls">{level==='solar'&&<button disabled={status!=='ready'||moving} onClick={()=>setPaused(!paused)} aria-label={paused?'เริ่มการโคจร':'หยุดการโคจร'} aria-pressed={paused}>{paused?<Play size={17}/>:<Pause size={17}/>}</button>}<button disabled={status!=='ready'||moving} onClick={()=>actions.current?.zoom(.85)} aria-label="ซูมเข้า"><Plus size={18}/></button><button disabled={status!=='ready'||moving} onClick={()=>actions.current?.zoom(1.18)} aria-label="ซูมออก"><Minus size={18}/></button><button disabled={status!=='ready'||moving} onClick={()=>actions.current?.reset()} aria-label="รีเซ็ตมุมกล้อง"><RotateCcw size={17}/></button></div></footer>
 </main>;
}
