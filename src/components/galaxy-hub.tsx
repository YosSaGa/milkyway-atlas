import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Orbit, Pause, Play } from 'lucide-react';
import '../galaxy-hub.css';

const destinations = [
  ['mercury','ดาวพุธ','MERCURY','โลกหินแห่งรอยอุกกาบาต',17,25],
  ['venus','ดาวศุกร์','VENUS','ใต้ม่านเมฆสีครีม',38,14],
  ['earth','โลก','EARTH','บ้านสีน้ำเงินของเรา',62,14],
  ['mars','ดาวอังคาร','MARS','หุบเขาบนดาวสีแดง',83,25],
  ['jupiter','ดาวพฤหัสบดี','JUPITER','ยักษ์ใหญ่แห่งพายุ',17,70],
  ['saturn','ดาวเสาร์','SATURN','โลกที่มีวงแหวนโอบล้อม',38,82],
  ['uranus','ดาวยูเรนัส','URANUS','ยักษ์น้ำแข็งที่หมุนตะแคง',62,82],
  ['neptune','ดาวเนปจูน','NEPTUNE','สายลมสุดขอบระบบสุริยะ',83,70],
] as const;

function GalaxyBackdrop({ paused }: { paused: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const stopped = useRef(paused);stopped.current=paused;
  useEffect(()=>{
    let cancelled=false,cleanup=()=>{};
    import('three').then(T=>{
      if(cancelled||!host.current)return;
      const container=host.current;
      let renderer;
      try{renderer=new T.WebGLRenderer({alpha:true,antialias:false});}catch{return;}
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));container.appendChild(renderer.domElement);
      const scene=new T.Scene(),camera=new T.PerspectiveCamera(48,1,.1,100);
      camera.position.set(0,7,10);camera.lookAt(0,0,0);
      const count=6500,positions=new Float32Array(count*3),colors=new Float32Array(count*3);
      let seed=134;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
      for(let i=0;i<count;i++){
        const r=Math.pow(random(),.65)*6,arm=i%4*Math.PI/2;
        const angle=arm+r*.8+(random()-.5)*(.3+r*.1);
        positions.set([Math.cos(angle)*r,(random()-.5)*.25,Math.sin(angle)*r],i*3);
        const color=new T.Color().setRGB(.6+r*.035,.48+r*.025,.32+r*.09);colors.set([color.r,color.g,color.b],i*3);
      }
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('color',new T.BufferAttribute(colors,3));
      const material=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexColors:true,
        vertexShader:'varying vec3 tint; void main(){tint=color;vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;gl_PointSize=clamp(32.0/-p.z,1.0,7.0);}',
        fragmentShader:'varying vec3 tint;void main(){float r=length(gl_PointCoord-.5)*2.0;if(r>1.0)discard;gl_FragColor=vec4(tint,pow(1.0-r,2.0)*.65);}' });
      const galaxy=new T.Points(geometry,material);galaxy.rotation.z=-.22;scene.add(galaxy);
      let frame=0,last=0;
      const resize=()=>{const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};
      const observer=new ResizeObserver(resize);observer.observe(container);resize();
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      const tick=(now:number)=>{frame=requestAnimationFrame(tick);const delta=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;if(!stopped.current&&!reduced)galaxy.rotation.y+=delta*.018;renderer.render(scene,camera);};frame=requestAnimationFrame(tick);
      cleanup=()=>{cancelAnimationFrame(frame);observer.disconnect();geometry.dispose();material.dispose();renderer.dispose();renderer.domElement.remove();};
    }).catch(()=>{});
    return()=>{cancelled=true;cleanup();};
  },[]);
  return <div ref={host} className="hub-galaxy" aria-hidden="true"/>;
}

export default function GalaxyHub(){
  const [paused,setPaused]=useState(false);
  return <main className="galaxy-hub">
    <GalaxyBackdrop paused={paused}/>
    <header className="hub-header"><a className="hub-brand" href="/"><Orbit size={25}/><span>MILKY WAY<small>YOUR COSMIC ATLAS</small></span></a><a className="hub-about" href="/?view=about">รู้จักทางช้างเผือก <ArrowUpRight size={15}/></a><button className="hub-motion" onClick={()=>setPaused(!paused)} aria-label={paused?'เล่นภาพกาแลคซี่':'หยุดภาพกาแลคซี่'} aria-pressed={paused}>{paused?<Play size={15}/>:<Pause size={15}/>}</button></header>
    <section className="hub-heading"><span>THE SOLAR COLLECTION · 08 WORLDS</span><h1>เลือกดาวดวงถัดไป<br/><em>แล้วออกเดินทาง</em></h1><p>จากโลกของเรา สู่แปดโลกที่แตกต่าง<br/>เลือกดาวเพื่อเปิดฉาก 3D แล้วหมุนสำรวจได้รอบดวง</p></section>
    <section className="hub-map" aria-label="เลือกดาวเคราะห์ทั้ง 8 ดวง">
      <div className="hub-orbit hub-orbit-one"/><div className="hub-orbit hub-orbit-two"/>
      <div className="hub-center" aria-hidden="true"><span className="hub-sun"/><small>OUR SOLAR SYSTEM</small><strong>หนึ่งมุมเล็ก ๆ<br/>ในทางช้างเผือก</strong></div>
      {destinations.map(([id,thai,en,description,x,y],index)=><a className={`hub-planet hub-${id}`} key={id} href={`/?view=${id}`} style={{left:`${x}%`,top:`${y}%`}} aria-label={`สำรวจ${thai}แบบ 3D`}><div className="hub-planet-art"><img src={`/planets/${id}.png`} alt="" width={480} height={367} decoding="async"/><span className="hub-enter"><ArrowUpRight size={18}/></span></div><div className="hub-planet-label"><span>{String(index+1).padStart(2,'0')} / {en}</span><h2>{thai}</h2><p>{description}</p></div></a>)}
    </section>
    <footer className="hub-footer"><span><i/> 8 DESTINATIONS · READY TO EXPLORE</span><p>ฉากจัดวางเพื่อการสำรวจ · ตำแหน่งและขนาดไม่ใช่มาตราส่วนจริง</p><a href="/?view=earth">กลับบ้านที่โลก <ArrowUpRight size={14}/></a></footer>
  </main>;
}
