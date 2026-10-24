import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Expand, Minimize, Minus, Plus, RotateCcw, Orbit, Pause, Play, MousePointer2 } from 'lucide-react';
import type * as THREE from 'three';

type Mode = 'galaxy' | 'stars';
type Destination = { id: string; name: string; thai: string; position: [number, number, number]; color: string; radius: number; label: string; value: string; description: string };
const galaxy: Destination[] = [
  { id: 'center', name: 'Sagittarius A*', thai: 'ใจกลางทางช้างเผือก', position: [0, 0, 0], color: '#ffce8d', radius: .55, label: 'มวลโดยประมาณ', value: '4 ล้านดวงอาทิตย์', description: 'หลุมดำมวลยิ่งยวดที่ใจกลางกาแลคซี่ ล้อมรอบด้วยดาวฤกษ์ ก๊าซ และฝุ่นหนาแน่น จุดเรืองแสงในภาพแสดงบริเวณใจกลาง ไม่ใช่แสงจากตัวหลุมดำ' },
  { id: 'orion', name: 'Orion Spur', thai: 'บ้านของเราอยู่ที่นี่', position: [10.5, .25, 7], color: '#87deff', radius: .22, label: 'ห่างจากใจกลางประมาณ', value: '26,000 ปีแสง', description: 'ระบบสุริยะตั้งอยู่ในบริเวณแขนนายพราน เป็นเพียงจุดเล็ก ๆ ในจานของทางช้างเผือก ลองสลับไปยังมุมมองดาวใกล้บ้านเพื่อสำรวจดาวฤกษ์แต่ละดวง' },
  { id: 'arms', name: 'Spiral arms', thai: 'แขนกังหันของกาแลคซี่', position: [-13, .1, -7], color: '#c9b1ff', radius: .18, label: 'โครงสร้าง', value: 'ดาว ก๊าซ และฝุ่น', description: 'แขนกังหันเป็นบริเวณที่มีดาว ก๊าซ และฝุ่นเรียงตัวเป็นแนวโค้ง รวมถึงแหล่งก่อกำเนิดดาวใหม่ ภาพนี้จำลองโครงสร้างเพื่อการเรียนรู้ ไม่ใช่แผนที่ดาวจากการสำรวจ' },
];
const nearby: Destination[] = [
  { id: 'sun', name: 'The Sun', thai: 'ดวงอาทิตย์', position: [0, 0, 0], color: '#ffc276', radius: 1, label: 'ห่างจากโลกประมาณ', value: '8.3 นาทีแสง', description: 'ดาวฤกษ์ประจำระบบสุริยะ แหล่งพลังงานของโลก สร้างพลังงานจากฟิวชันในแกนกลาง ลากหมุนเพื่อดูดาวในฉากจากมุมอื่นได้' },
  { id: 'proxima', name: 'Proxima Centauri', thai: 'พร็อกซิมา เซนทอรี', position: [-7, 2, 4], color: '#ff7965', radius: .42, label: 'ห่างจากโลกประมาณ', value: '4.24 ปีแสง', description: 'ดาวแคระแดงขนาดเล็ก เป็นดาวฤกษ์ที่อยู่ใกล้ระบบสุริยะที่สุด แสงจางเกินกว่าจะมองเห็นด้วยตาเปล่า' },
  { id: 'sirius', name: 'Sirius', thai: 'ซิริอัส', position: [8, 1, 2], color: '#b4dcff', radius: 1.15, label: 'ห่างจากโลกประมาณ', value: '8.6 ปีแสง', description: 'ดาวฤกษ์ที่สว่างที่สุดบนท้องฟ้ายามค่ำคืนเมื่อมองจากโลก เป็นระบบดาวคู่ที่มีดาวแคระขาว Sirius B เป็นคู่หู' },
  { id: 'betelgeuse', name: 'Betelgeuse', thai: 'บีเทลจุส', position: [2, -1, -12], color: '#f99364', radius: 2.2, label: 'ห่างจากโลกโดยประมาณ', value: 'ราว 650 ปีแสง', description: 'ดาวมหายักษ์แดงในกลุ่มดาวนายพราน อยู่ในช่วงปลายของวิวัฒนาการดาวมวลมาก ระยะห่างยังมีความไม่แน่นอน' },
];
type Controller = { home: () => void; zoom: (factor: number) => void; focus: (id: string) => void };

export default function GalaxyExplorer() {
  const [mode, setMode] = useState<Mode>('galaxy');
  const [selected, setSelected] = useState('center');
  const [auto, setAuto] = useState(false);
  const [labels, setLabels] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const controls = useRef<Controller | null>(null);
  const settings = useRef({ auto, labels });
  settings.current = { auto, labels };
  const destinations = mode === 'galaxy' ? galaxy : nearby;
  const destination = destinations.find(d => d.id === selected) ?? destinations[0];

  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', close);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', close); };
  }, [expanded]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let cancelled = false;
    let cleanup = () => {};
    setStatus('loading');
    Promise.all([import('three'), import('three/addons/controls/OrbitControls.js')]).then(([T, { OrbitControls }]) => {
      if (cancelled) return;
      let renderer: THREE.WebGLRenderer;
      try { renderer = new T.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' }); }
      catch { setStatus('error'); return; }
      const canvas = renderer.domElement;
      canvas.tabIndex = 0;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'ฉากสามมิติ ลากเพื่อหมุน ใช้ล้อเมาส์เพื่อซูม หรือใช้ปุ่มควบคุมและรายการจุดสำรวจ');
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor('#03050a');
      container.appendChild(canvas);
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(48, 1, .1, 700);
      const orbit = new OrbitControls(camera, canvas);
      orbit.enableDamping = true;
      orbit.dampingFactor = .065;
      orbit.enablePan = false;
      orbit.autoRotateSpeed = .22;
      orbit.minDistance = mode === 'galaxy' ? 4 : 2.8;
      orbit.maxDistance = mode === 'galaxy' ? 95 : 65;
      orbit.maxPolarAngle = Math.PI * .94;
      orbit.minPolarAngle = .06;
      const narrow = container.clientWidth < 700;
      const home = new T.Vector3(...(mode === 'galaxy' ? (narrow ? [0, 46, 58] : [0, 30, 42]) : [0, 15, 28]) as [number, number, number]);
      camera.position.copy(home);
      orbit.update();
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      let flight: { target: THREE.Vector3; position: THREE.Vector3 } | null = null;
      const go = (target: THREE.Vector3, position: THREE.Vector3) => {
        if (reduced) { orbit.target.copy(target); camera.position.copy(position); orbit.update(); }
        else flight = { target, position };
      };
      const cancelFlight = () => { flight = null; };
      orbit.addEventListener('start', cancelFlight);
      controls.current = {
        home: () => go(new T.Vector3(), home.clone()),
        zoom: factor => {
          flight = null;
          const direction = camera.position.clone().sub(orbit.target);
          direction.setLength(T.MathUtils.clamp(direction.length() * factor, orbit.minDistance, orbit.maxDistance));
          camera.position.copy(orbit.target).add(direction);
          orbit.update();
        },
        focus: id => {
          const item = (mode === 'galaxy' ? galaxy : nearby).find(d => d.id === id);
          if (!item) return;
          const target = new T.Vector3(...item.position);
          const distance = mode === 'galaxy' ? 15 : Math.max(5, item.radius * 5);
          go(target, target.clone().add(new T.Vector3(.5, .45, 1).normalize().multiplyScalar(distance)));
        },
      };
      let seed = 12489;
      const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      const glowCanvas = document.createElement('canvas');
      glowCanvas.width = glowCanvas.height = 64;
      const context = glowCanvas.getContext('2d')!;
      const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, '#fff'); gradient.addColorStop(.12, '#ffffffed'); gradient.addColorStop(.35, '#ffffff55'); gradient.addColorStop(1, '#ffffff00');
      context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
      const glowTexture = new T.CanvasTexture(glowCanvas);
      const makePoints = (positions: number[], colors: number[], size: number, opacity: number) => {
        const geometry = new T.BufferGeometry();
        geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
        const material = new T.PointsMaterial({ size, map: glowTexture, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity });
        const cloud = new T.Points(geometry, material); scene.add(cloud); return cloud;
      };
      const backdrop: number[] = [], backdropColors: number[] = [];
      for (let i = 0; i < 1800; i++) {
        const angle = random() * Math.PI * 2, y = random() * 2 - 1, r = 110 + random() * 160;
        const ring = Math.sqrt(1 - y * y);
        backdrop.push(Math.cos(angle) * r * ring, y * r, Math.sin(angle) * r * ring);
        const shade = .35 + random() * .55; backdropColors.push(shade * .75, shade * .85, shade);
      }
      makePoints(backdrop, backdropColors, .32, .7);
      if (mode === 'galaxy') {
        const positions: number[] = [], colors: number[] = [];
        const warm = new T.Color('#ffc88a'), cold = new T.Color('#97bbff'), dust = new T.Color('#ac8bd5');
        for (let i = 0; i < (narrow ? 12500 : 24000); i++) {
          const core = i % 5 === 0;
          const r = core ? Math.pow(random(), 1.8) * 5 : 1.7 + Math.pow(random(), .75) * 22;
          const arm = (i % 4) * Math.PI / 2;
          const angle = core ? random() * Math.PI * 2 : arm + Math.log(r + 1) * 2.65 + (random() - .5) * (.3 + .7 / r);
          const scatter = (random() - .5) * (core ? 1 : 1.8);
          positions.push(Math.cos(angle) * r + scatter, (random() - .5) * (core ? 3.2 : .4 + r * .045), Math.sin(angle) * r + scatter);
          const color = warm.clone().lerp(i % 7 === 0 ? dust : cold, Math.min(1, r / 14)).multiplyScalar(.5 + random() * .8);
          colors.push(color.r, color.g, color.b);
        }
        makePoints(positions, colors, narrow ? .16 : .13, .9);
        const center = new T.Sprite(new T.SpriteMaterial({ map: glowTexture, color: '#eeb67d', transparent: true, opacity: .6, blending: T.AdditiveBlending, depthWrite: false }));
        center.scale.set(13, 8, 1); scene.add(center);
      }
      const objects = new Map<string, THREE.Mesh>();
      for (const item of mode === 'galaxy' ? galaxy : nearby) {
        const geometry = new T.SphereGeometry(item.radius, 32, 24);
        const material = new T.ShaderMaterial({
          uniforms: { tint: { value: new T.Color(item.color) }, time: { value: 0 } },
          vertexShader: 'varying vec3 normalView; varying vec3 localPosition; void main(){ normalView=normalize(normalMatrix*normal); localPosition=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
          fragmentShader: 'uniform vec3 tint; uniform float time; varying vec3 normalView; varying vec3 localPosition; void main(){ float grain=sin(localPosition.x*38.0+sin(localPosition.y*23.0+time*.15))*sin(localPosition.z*42.0+localPosition.y*18.0); float rim=pow(max(0.0,normalView.z),.38); vec3 color=tint*(.65+.35*rim+grain*.065); gl_FragColor=vec4(color,1.0); }',
        });
        const sphere = new T.Mesh(geometry, material); sphere.position.set(...item.position); scene.add(sphere); objects.set(item.id, sphere);
        const halo = new T.Sprite(new T.SpriteMaterial({ map: glowTexture, color: item.color, transparent: true, opacity: .5, blending: T.AdditiveBlending, depthWrite: false }));
        halo.scale.setScalar(item.radius * 6); sphere.add(halo);
      }
      const hitTest = new T.Raycaster();
      const pointer = new T.Vector2();
      let pointerDown = { x: 0, y: 0 };
      const down = (e: PointerEvent) => { pointerDown = { x: e.clientX, y: e.clientY }; };
      const up = (e: PointerEvent) => {
        if (Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y) > 5) return;
        const rect = canvas.getBoundingClientRect();
        pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
        hitTest.setFromCamera(pointer, camera);
        const hit = hitTest.intersectObjects([...objects.values()], false)[0];
        if (hit) for (const [id, mesh] of objects) if (hit.object === mesh) { setSelected(id); controls.current?.focus(id); break; }
      };
      canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointerup', up);
      const keyboard = (e: KeyboardEvent) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'].includes(e.key)) return;
        e.preventDefault(); flight = null;
        if (e.key === 'Home') controls.current?.home();
        else if (e.key === '+' || e.key === '=') controls.current?.zoom(.8);
        else if (e.key === '-') controls.current?.zoom(1.25);
        else {
          const spherical = new T.Spherical().setFromVector3(camera.position.clone().sub(orbit.target));
          spherical.theta += e.key === 'ArrowLeft' ? .12 : e.key === 'ArrowRight' ? -.12 : 0;
          spherical.phi = T.MathUtils.clamp(spherical.phi + (e.key === 'ArrowUp' ? -.12 : e.key === 'ArrowDown' ? .12 : 0), .06, Math.PI * .94);
          camera.position.copy(orbit.target).add(new T.Vector3().setFromSpherical(spherical)); orbit.update();
        }
      };
      canvas.addEventListener('keydown', keyboard);
      const resize = () => {
        const { width, height } = container.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize); ro.observe(container); resize();
      let visible = true, lost = false, raf = 0, last = performance.now(), elapsed = 0;
      const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }); io.observe(container);
      const onLost = (event: Event) => { event.preventDefault(); lost = true; setStatus('error'); };
      canvas.addEventListener('webglcontextlost', onLost);
      const projection = new T.Vector3();
      const tick = (now: number) => {
        if (cancelled) return;
        raf = requestAnimationFrame(tick);
        const delta = Math.min((now - last) / 1000, .05); last = now;
        if (!visible || document.hidden || lost) return;
        elapsed += delta;
        if (flight) {
          const alpha = 1 - Math.exp(-delta * 5);
          camera.position.lerp(flight.position, alpha); orbit.target.lerp(flight.target, alpha);
          if (camera.position.distanceTo(flight.position) < .015 && orbit.target.distanceTo(flight.target) < .015) flight = null;
        }
        orbit.autoRotate = settings.current.auto && !flight;
        orbit.update(delta);
        for (const [id, object] of objects) {
          if (!reduced) (object.material as THREE.ShaderMaterial).uniforms.time.value = elapsed;
          const marker = markerRefs.current[id];
          if (!marker) continue;
          projection.copy(object.position).project(camera);
          const shown = settings.current.labels && projection.z > -1 && projection.z < 1 && Math.abs(projection.x) < .93 && Math.abs(projection.y) < .85;
          marker.hidden = !shown;
          if (shown) { marker.style.left = `${(projection.x + 1) * 50}%`; marker.style.top = `${(1 - projection.y) * 50}%`; }
        }
        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(tick); setStatus('ready');
      cleanup = () => {
        cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); orbit.dispose(); controls.current = null;
        canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('keydown', keyboard); canvas.removeEventListener('webglcontextlost', onLost);
        scene.traverse(object => {
          const mesh = object as THREE.Mesh;
          mesh.geometry?.dispose();
          if (mesh.material) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) material.dispose();
        });
        glowTexture.dispose(); renderer.dispose(); canvas.remove();
      };
    }).catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; cleanup(); };
  }, [mode, retry]);

  const choose = (id: string) => { setSelected(id); controls.current?.focus(id); };
  const changeMode = (next: Mode) => { setMode(next); setSelected(next === 'galaxy' ? 'center' : 'sun'); };
  return <section className={`explorer-section ${expanded ? 'explorer-expanded' : ''}`} id="galaxy" aria-label="สำรวจกาแลคซี่สามมิติ">
    <div className="explorer-heading"><div><span className="eyebrow gold">01 / INTERACTIVE UNIVERSE</span><h2>ไม่ได้แค่มอง แต่ลองสำรวจ<span className="gold">.</span></h2></div><span className="live-3d"><span className="status-dot"/> LIVE 3D EXPLORER</span></div>
    <div className="explorer-shell">
      <div className="explorer-toolbar"><div className="view-switch" aria-label="เลือกฉากสามมิติ"><button onClick={() => changeMode('galaxy')} aria-pressed={mode === 'galaxy'}><Orbit size={15}/> ทางช้างเผือก</button><button onClick={() => changeMode('stars')} aria-pressed={mode === 'stars'}>สำรวจดวงดาว</button></div><button className="explorer-icon" onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'ย่อพื้นที่สำรวจ' : 'ขยายพื้นที่สำรวจ'} aria-pressed={expanded}>{expanded ? <Minimize size={18}/> : <Expand size={18}/>}</button></div>
      <div className="explorer-main"><div className="space-viewport"><div className="three-host" ref={host}/>
        <div className="space-labels">{destinations.map(item => <button key={item.id} hidden={status !== 'ready' || !labels} ref={el => { markerRefs.current[item.id] = el; }} className={`space-marker ${selected === item.id ? 'active' : ''}`} onClick={() => choose(item.id)} aria-pressed={selected === item.id}><i style={{ background: item.color }}/>{item.name}</button>)}</div>
        {status !== 'ready' && <div className="scene-status" role="status"><Orbit size={32}/><p>{status === 'loading' ? 'กำลังเปิดจักรวาลสามมิติ…' : 'ไม่สามารถเปิดฉาก 3D ได้บนอุปกรณ์นี้'}</p>{status === 'error' && <><small>ลองใช้เบราว์เซอร์ที่รองรับ WebGL 2 หรืออ่านข้อมูลผ่านรายการด้านข้าง</small><button onClick={() => setRetry(retry + 1)}>ลองโหลดอีกครั้ง</button></>}</div>}
        <div className="scene-hint"><MousePointer2 size={13}/><span>ลากเพื่อหมุน · เลื่อนเพื่อซูม · คลิกดาวเพื่อสำรวจ</span></div>
        <div className="space-controls"><button title="ซูมเข้า" aria-label="ซูมเข้า" onClick={() => controls.current?.zoom(.8)} disabled={status !== 'ready'}><Plus size={17}/></button><button title="ซูมออก" aria-label="ซูมออก" onClick={() => controls.current?.zoom(1.25)} disabled={status !== 'ready'}><Minus size={17}/></button><button title="กลับมุมมองเริ่มต้น" aria-label="กลับมุมมองเริ่มต้น" onClick={() => controls.current?.home()} disabled={status !== 'ready'}><RotateCcw size={16}/></button><button title="หมุนอัตโนมัติ" aria-label="หมุนอัตโนมัติ" aria-pressed={auto} onClick={() => setAuto(!auto)} disabled={status !== 'ready'}>{auto ? <Pause size={16}/> : <Play size={16}/>}</button></div>
        <span className="scene-coordinate">{mode === 'galaxy' ? 'MILKY WAY / GALACTIC VIEW' : 'STELLAR VIEW / ILLUSTRATIVE POSITIONS'}</span>
      </div><aside className="space-sidebar"><span className="eyebrow">เลือกจุดหมาย</span><div className="destination-list">{destinations.map(item => <button key={item.id} onClick={() => choose(item.id)} aria-pressed={selected === item.id}><span style={{ background: item.color }}/>{item.name}<ArrowUpRight size={14}/></button>)}</div><div className="destination-info" aria-live="polite"><span className="eyebrow gold">{destination.thai}</span><h3>{destination.name}</h3><p className="destination-value">{destination.value}<small>{destination.label}</small></p><p>{destination.description}</p></div>{mode === 'galaxy' && selected === 'orion' && <button className="text-button" onClick={() => changeMode('stars')}>ไปสำรวจดวงดาว <ArrowUpRight size={15}/></button>}<label className="label-toggle"><input type="checkbox" checked={labels} onChange={e => setLabels(e.target.checked)}/> แสดงชื่อในฉาก</label></aside></div>
      <div className="explorer-footer"><span>แบบจำลองเพื่อการเรียนรู้ · ตำแหน่ง ขนาด และระยะในฉากไม่ใช่มาตราส่วนจริง</span><span>มือถือ: ใช้สองนิ้วเพื่อซูม · คีย์บอร์ด: ลูกศร / + / − / Home</span></div>
    </div>
  </section>;
}
