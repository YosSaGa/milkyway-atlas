import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Orbit, RotateCcw, Plus, Minus, Pause, Play, Info, X } from 'lucide-react';
import type * as THREE from 'three';
import '../saturn.css';

export default function SaturnExperience() {
  const host = useRef<HTMLDivElement>(null);
  const actions = useRef<{ reset: () => void; zoom: (factor: number) => void } | null>(null);
  const [auto, setAuto] = useState(false);
  const [lighting, setLighting] = useState(0);
  const [info, setInfo] = useState(false);
  const [status, setStatus] = useState('loading');
  const [retry, setRetry] = useState(0);
  const settings = useRef({ auto, lighting }); settings.current = { auto, lighting };
  useEffect(() => {
    const container = host.current!;
    let gone = false;
    let dispose = () => {};
    setStatus('loading');
    Promise.all([import('three'), import('three/addons/controls/OrbitControls.js'), import('three/addons/loaders/GLTFLoader.js')]).then(async ([T, { OrbitControls }, { GLTFLoader }]) => {
      if (gone) return;
      const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      const narrow = container.clientWidth < 800;
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      renderer.setPixelRatio(Math.min(devicePixelRatio, narrow ? 1.5 : 2));
      renderer.setClearColor('#020307');
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(35, 1, .1, 300);
      const canvas = renderer.domElement;
      canvas.tabIndex = 0; canvas.setAttribute('aria-label', 'ดาวเสาร์สามมิติ ลากหมุน เลื่อนซูม ปุ่มลูกศรหมุนกล้อง');
      container.appendChild(canvas);
      const orbit = new OrbitControls(camera, canvas);
      orbit.enableDamping = true; orbit.enablePan = false; orbit.minDistance = 3.7; orbit.maxDistance = 13; orbit.autoRotateSpeed = .3;
      const home = new T.Vector3(0, 2.2, 7.8);
      camera.position.copy(home); orbit.update();
      const sun = new T.DirectionalLight('#fff0d9', 3.6); sun.position.set(-4, 5, 4); sun.castShadow = true;
      const shadowSize = narrow ? 2048 : 4096;
      sun.shadow.mapSize.set(shadowSize, shadowSize); sun.shadow.camera.left = -3; sun.shadow.camera.right = 3; sun.shadow.camera.top = 3; sun.shadow.camera.bottom = -3; sun.shadow.camera.near = .1; sun.shadow.camera.far = 25; sun.shadow.normalBias = .004; sun.shadow.bias = -.00003;
      scene.add(sun); scene.add(new T.AmbientLight('#b4c5e0', .045));
      const starPositions = new Float32Array(1600 * 3); let seed = 19;
      const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      for (let i = 0; i < 1600; i++) { const a = rand() * Math.PI * 2, y = rand() * 2 - 1, r = 70 + rand() * 80, b = Math.sqrt(1-y*y); starPositions.set([Math.cos(a)*r*b,y*r,Math.sin(a)*r*b], i*3); }
      const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.BufferAttribute(starPositions,3));
      const starMaterial = new T.PointsMaterial({ size: .055, color: '#92a2bb', transparent: true, opacity: .5 }); scene.add(new T.Points(geometry,starMaterial));
      let model: THREE.Group | undefined;
      let raf = 0, visible = true, lost = false, last = performance.now();
      const resize = () => {
        const w = container.clientWidth, h = container.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w,h); camera.aspect = w/h;
        if (w > 800) camera.setViewOffset(w,h,-w*.14,0,w,h); else camera.clearViewOffset();
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize); ro.observe(container); resize();
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(container);
      actions.current = { reset: () => { orbit.reset(); camera.position.copy(home); orbit.target.set(0,0,0); orbit.update(); }, zoom: factor => { const direction = camera.position.clone().sub(orbit.target); direction.setLength(T.MathUtils.clamp(direction.length()*factor,orbit.minDistance,orbit.maxDistance)); camera.position.copy(orbit.target).add(direction); orbit.update(); } };
      const keyboard = (e: KeyboardEvent) => {
        if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key)) return;
        e.preventDefault();
        if (e.key === 'Home') actions.current?.reset();
        else if (e.key === '+' || e.key === '=') actions.current?.zoom(.85);
        else if (e.key === '-') actions.current?.zoom(1.18);
        else { const s = new T.Spherical().setFromVector3(camera.position.clone().sub(orbit.target)); s.theta += e.key === 'ArrowLeft' ? .1 : e.key === 'ArrowRight' ? -.1 : 0; s.phi = T.MathUtils.clamp(s.phi+(e.key === 'ArrowUp' ? -.1 : e.key === 'ArrowDown' ? .1 : 0), .05, Math.PI-.05); camera.position.copy(orbit.target).add(new T.Vector3().setFromSpherical(s)); orbit.update(); }
      };
      canvas.addEventListener('keydown',keyboard);
      const contextLost = (e: Event) => { e.preventDefault(); lost = true; setStatus('error'); };
      canvas.addEventListener('webglcontextlost',contextLost);
      const positions = [new T.Vector3(-6,5,3),new T.Vector3(-5,2,-3),new T.Vector3(1,6,5)];
      const release = (object: THREE.Object3D) => { const textures = new Set<THREE.Texture>(); object.traverse(obj => { const mesh = obj as THREE.Mesh; mesh.geometry?.dispose(); mesh.customDepthMaterial?.dispose(); if(mesh.material) for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]) { for(const value of Object.values(material)) if(value instanceof T.Texture) textures.add(value); material.dispose(); } }); textures.forEach(t=>t.dispose()); };
      dispose = () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); orbit.dispose(); canvas.removeEventListener('keydown',keyboard); canvas.removeEventListener('webglcontextlost',contextLost); release(scene); renderer.dispose(); canvas.remove(); actions.current=null; };
      const tick = (now:number) => { if(gone) return; raf=requestAnimationFrame(tick); const delta=Math.min((now-last)/1000,.05);last=now; if(!visible||document.hidden||lost) return; orbit.autoRotate=settings.current.auto;orbit.update(delta);sun.position.lerp(positions[settings.current.lighting],reduced?1:1-Math.exp(-delta*4));renderer.render(scene,camera); };
      raf=requestAnimationFrame(tick);
      try {
        const gltf = await new GLTFLoader().loadAsync('/models/saturn.glb');
        if(gone){release(gltf.scene);return;}
        model=gltf.scene;
        model.traverse(obj=>{if(obj instanceof T.Mesh){obj.castShadow=true;obj.receiveShadow=true;const mats=Array.isArray(obj.material)?obj.material:[obj.material];for(const mat of mats){mat.side=T.DoubleSide;if(mat.map)mat.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(obj.name==='Rings'){mat.transparent=true;mat.depthWrite=false;mat.shadowSide=T.DoubleSide;obj.customDepthMaterial=new T.MeshDepthMaterial({map:mat.map,alphaTest:.3,depthPacking:T.RGBADepthPacking,side:T.DoubleSide});}}}});
        const planet = model.getObjectByName('Saturn') as THREE.Mesh | undefined;
        if (planet) {
          const atmosphereMaterial = new T.ShaderMaterial({
            uniforms: { sunlight: { value: sun.position } },
            vertexShader: `varying vec3 worldNormal; varying vec3 worldPosition;
              void main(){ vec4 p=modelMatrix*vec4(position,1.0);worldPosition=p.xyz;
                worldNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*p; }`,
            fragmentShader: `uniform vec3 sunlight;varying vec3 worldNormal;varying vec3 worldPosition;
              void main(){ vec3 n=normalize(worldNormal);vec3 v=normalize(cameraPosition-worldPosition);
                float edge=pow(1.0-clamp(dot(n,v),0.0,1.0),4.5);
                float day=smoothstep(-.1,.5,dot(n,normalize(sunlight-worldPosition)));
                gl_FragColor=vec4(vec3(.73,.64,.43),edge*day*.13); }`,
            transparent: true, depthWrite: false, blending: T.AdditiveBlending,
          });
          const atmosphere = new T.Mesh(planet.geometry.clone(), atmosphereMaterial);
          atmosphere.name='Atmosphere';atmosphere.scale.setScalar(1.006);planet.add(atmosphere);
        }
        scene.add(model);setStatus('ready');
      }catch{if(!gone)setStatus('error');}
    }).catch(()=>{if(!gone)setStatus('error');});
    return()=>{gone=true;dispose();};
  },[retry]);

  return <main className="saturn-experience">
    <div ref={host} className="saturn-stage"/>
    <header className="saturn-header"><a href="/" className="saturn-brand"><Orbit size={23}/><span>MILKY WAY <small>OBSERVATORY</small></span></a><a href="/" className="saturn-back"><ArrowLeft size={14}/> กลับสู่ทางช้างเผือก</a><span className="saturn-edition">VISUAL STUDY — 001</span></header>
    <div className="saturn-intro"><span className="saturn-kicker">THE RINGED WORLD</span><h1>SATURN<span>ดาวเสาร์</span></h1><p>ความเงียบงัน<br/>ที่มีวงแหวนโอบล้อม</p><button onClick={()=>setInfo(!info)} className="saturn-learn" aria-expanded={info}><Info size={15}/> เรื่องราวของดาวเสาร์ <ArrowUpRight size={15}/></button></div>
    <div className="saturn-specimen"><span className="status-dot"/> SOL SYSTEM <span>/</span> VI</div>
    {status!=='ready'&&<div className="saturn-loading" role="status"><Orbit size={28}/><span>{status==='loading'?'กำลังเปิดโมเดลจาก Blender…':'ไม่สามารถเปิดฉาก WebGL ได้'}</span>{status==='error'&&<button onClick={()=>setRetry(retry+1)}>ลองอีกครั้ง</button>}</div>}
    {info&&<aside className="saturn-info"><button className="saturn-close" onClick={()=>setInfo(false)} aria-label="ปิดข้อมูล"><X size={18}/></button><span className="saturn-kicker">BEYOND THE RINGS</span><h2>โลกแห่งน้ำแข็ง<br/>และก๊าซ</h2><p>ดาวเสาร์เป็นดาวเคราะห์ลำดับที่หกจากดวงอาทิตย์ วงแหวนประกอบด้วยชิ้นส่วนน้ำแข็งและหินจำนวนมาก ไม่ใช่แผ่นแข็งชิ้นเดียว</p><p>นี่คือโมเดลเพื่อศึกษางานภาพ พื้นผิวและแสงสร้างขึ้นเพื่อการนำเสนอ ไม่ใช่ภาพถ่ายหรือการจำลองข้อมูลสำรวจโดยตรง</p><a href="https://science.nasa.gov/saturn/" target="_blank" rel="noreferrer">สำรวจข้อมูลจาก NASA <ArrowUpRight size={14}/></a></aside>}
    <footer className="saturn-console"><div className="saturn-caption"><span>DRAG TO ORBIT</span><p>ลากหมุน · เลื่อนซูม · มือถือใช้สองนิ้ว</p></div><div className="saturn-lighting" aria-label="เลือกแสง">{['แสงอาทิตย์','ย้อนแสง','มุมสว่าง'].map((label,i)=><button key={label} onClick={()=>setLighting(i)} aria-pressed={lighting===i}>{label}</button>)}</div><div className="saturn-actions"><button aria-label="ซูมเข้า" onClick={()=>actions.current?.zoom(.85)} disabled={status!=='ready'}><Plus size={17}/></button><button aria-label="ซูมออก" onClick={()=>actions.current?.zoom(1.18)} disabled={status!=='ready'}><Minus size={17}/></button><button aria-label="กลับมุมเริ่มต้น" onClick={()=>actions.current?.reset()} disabled={status!=='ready'}><RotateCcw size={16}/></button><button aria-label="หมุนอัตโนมัติ" aria-pressed={auto} onClick={()=>setAuto(!auto)} disabled={status!=='ready'}>{auto?<Pause size={16}/>:<Play size={16}/>}</button></div></footer>
    <span className="saturn-credit">ภาพจำลอง · วงแหวน: <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">Solar System Scope</a> / <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · ปรับวัสดุและแสง</span>
  </main>;
}

