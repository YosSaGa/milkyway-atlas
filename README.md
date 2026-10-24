# MILKY WAY — บ้านของเราในจักรวาล

เว็บภาษาไทยสำหรับสำรวจทางช้างเผือก สร้างด้วย React, TypeScript, Vite และ Tailwind CSS v4

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
