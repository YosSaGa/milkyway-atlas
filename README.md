# MILKY WAY — บ้านของเราในจักรวาล

## Blender visual study

เปิด `/?view=saturn` เพื่อดูฉากตัวอย่างดาวเสาร์เต็มจอ ซึ่งโหลดโมเดลจริงจาก `public/models/saturn.glb` มี OrbitControls, แสงสามมุม, เงาของวงแหวนและดาว, ซูม และรีเซ็ตมุมกล้อง

ไฟล์ต้นฉบับ: `art/saturn.blend` สร้างซ้ำได้ด้วย Blender 3.6: `blender --background --python art/create_saturn.py` ภาพ `art/saturn-preview.png` เป็นภาพเรนเดอร์ Cycles สำหรับตรวจงานโมเดล ไม่ใช่ screenshot ของ WebGL พื้นผิวเป็นภาพสร้างเชิงกระบวนการเพื่อการนำเสนอ ไม่ใช่ภาพสำรวจจริง

เว็บภาษาไทยสำหรับสำรวจทางช้างเผือก สร้างด้วย React, TypeScript, Vite และ Tailwind CSS v4

## สำรวจแบบ 3D

ฉาก Three.js จริงพร้อมกล้อง Perspective และ OrbitControls มีมุมมองทางช้างเผือกและดาวฤกษ์ ลากเมาส์หรือนิ้วเพื่อหมุน ใช้ล้อเมาส์หรือสองนิ้วเพื่อซูม คลิกวัตถุหรือชื่อดาวเพื่อย้ายกล้องไปสำรวจ ใช้ปุ่ม Home รีเซ็ตมุมมองได้เมื่อ canvas มีโฟกัส ปุ่มลูกศรหมุนมุมกล้อง และ + / - ซูม รองรับการเลือกจุดหมายด้วยคีย์บอร์ดผ่านรายการด้านข้าง

`src/components/ui/galaxy-explorer.tsx` ดูแลฉาก 3D, raycasting, กล้อง และการคืนทรัพยากร GPU เมื่อเปลี่ยนฉาก ส่วนสไตล์อยู่ใน `src/explorer.css` ปิดการ render เมื่อฉากอยู่นอกจอหรือแท็บถูกซ่อน และลดจำนวนอนุภาคบนหน้าจอเล็ก การหมุนอัตโนมัติเปิดได้ตามต้องการ

ตำแหน่งดาวและขนาดในฉากเป็นการจัดวางเพื่อเรียนรู้ ไม่ใช่ข้อมูลพิกัดทางดาราศาสตร์หรือมาตราส่วนจริง ต้องใช้เบราว์เซอร์ที่รองรับ WebGL 2 หากเปิดฉากไม่ได้ยังอ่านรายละเอียดจากรายการจุดหมายได้

## เริ่มพัฒนา

```sh
npm install
npm run dev
```

## ตรวจสอบและ build

```sh
npm run build
npm run preview
```

คำสั่ง build ตรวจ TypeScript และสร้างเว็บ static ใน `dist/`

## โครงสร้าง

- `src/App.tsx` — หน้าเว็บ ข้อมูลดาว การค้นหา ตัวกรอง แผนผังกาแลคซี่ และ dialog รายละเอียด
- `src/components/ui/blackhole-hero-section.tsx` — คอมโพเนนต์ WebGL จากไฟล์ที่ผู้ใช้ให้มา
- `src/index.css` — Tailwind และสไตล์ responsive
- `src/lib/utils.ts` — ฟังก์ชัน `cn` สำหรับคอมโพเนนต์ shadcn
- `components.json` — กำหนดโครงสร้าง shadcn และ alias `@/components/ui`

ใช้ `src/components/ui` เป็นโฟลเดอร์คอมโพเนนต์ UI เพื่อให้ import `@/components/ui/...` ตรงกับไฟล์ที่แนบและเครื่องมือ shadcn โดย `@` ชี้ไปยัง `src` สามารถเพิ่มคอมโพเนนต์ด้วย `npx shadcn@latest add <component>` ได้

ไม่ต้องมี API key หรือ backend การค้นหาและตัวกรองทำงานภายในเบราว์เซอร์ ฟอนต์โหลดจาก Google Fonts และมี system font สำรอง

ภาพหลุมดำเป็นการจำลองเชิงภาพ ไม่ใช่ภาพถ่าย Sagittarius A* ภาพดาวและแผนผังเป็นภาพประกอบ ไม่ใช่มาตราส่วนจริง แหล่งข้อมูล NASA, Chandra และ Event Horizon Telescope เชื่อมไว้ในเว็บไซต์

รองรับ reduced motion, เมนูมือถือ, keyboard focus และ native modal dialog หาก WebGL ใช้ไม่ได้จะแสดงภาพพื้นหลังสำรอง
