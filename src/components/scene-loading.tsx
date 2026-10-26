import { useEffect, useState } from 'react';
import '../scene-loading.css';

export default function SceneLoading({ title = 'จักรวาล', progress, phase = 'กำลังเตรียมการเดินทาง', error = false, onRetry }: { title?: string; progress?: number; phase?: string; error?: boolean; onRetry?: () => void }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setSlow(true), 10000); return () => clearTimeout(timer); }, []);
  return <div className="scene-loading" role="status" aria-live="polite">
    <span className="scene-loading-brand">MILKY WAY / ATLAS</span>
    <div className="scene-loading-orbit" aria-hidden="true"><i/><b/></div>
    <span className="scene-loading-eyebrow">{error ? 'JOURNEY INTERRUPTED' : 'PREPARING YOUR JOURNEY'}</span>
    <h1>{title}</h1>
    <p>{error ? 'โหลดฉากไม่สำเร็จ กรุณาลองอีกครั้ง' : phase}</p>
    {!error && <div className={`scene-loading-track ${progress === undefined ? 'indeterminate' : ''}`} role="progressbar" aria-label="ความคืบหน้าการโหลด" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress === undefined ? undefined : Math.round(progress)}><span style={progress === undefined ? undefined : { width: `${progress}%` }}/></div>}
    <small>{error ? 'คุณยังกลับไปเลือกดาวดวงอื่นได้' : slow ? 'ฉากรายละเอียดสูงอาจใช้เวลาสักครู่ ขึ้นอยู่กับการเชื่อมต่อและอุปกรณ์' : 'เตรียมพื้นผิว แสง และโมเดลสามมิติ'}</small>
    {error && onRetry && <button onClick={onRetry}>ลองอีกครั้ง</button>}
    <a href="/">กลับสู่หน้ารวม ↗</a>
  </div>;
}
