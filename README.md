# MILKY WAY — บ้านของเราในจักรวาล

## Planet progress — 8 / 8

- `/?view=mercury`: ดาวพุธ — แผนที่พื้นผิว 8K รายละเอียดหลุมอุกกาบาตและรัศมีเศษหิน ไม่มีชั้นบรรยากาศเรืองแสง
- `/?view=venus`: ดาวศุกร์ — แผนที่ยอดเมฆ 4K และขอบบรรยากาศสีครีม ลวดลายขับรายละเอียดเพื่อการนำเสนอ
- `/?view=mars`: ดาวอังคาร — พื้นผิว 8K มุมเริ่มต้นบริเวณ Valles Marineris วัสดุผิวด้านและขอบบรรยากาศบาง
- `/?view=jupiter`: ดาวพฤหัสบดี — โมเดล Blender ทรงแป้นเล็กน้อย แผนที่แถบเมฆและจุดแดงใหญ่ 4K หมุนและปรับแสงได้
- `/?view=earth`: โลก — โมเดลจาก Blender, แผนที่พื้นผิว/ไฟเมือง/เมฆ 4K, ไฟเมืองแสดงเฉพาะด้านมืดด้วย shader และชั้นบรรยากาศแยก
- `/?view=saturn`: ดาวเสาร์ — พื้นผิวเมฆ 4K และวงแหวน 8K
- `/?view=uranus`: ยูเรนัส — เมฆ 2K แกนเอียงและวงแหวนบางแบบตัวแทน
- `/?view=neptune`: เนปจูน — เมฆ 2K ปรับโทนฟ้าอมเขียว แผนที่พายุเป็นภาพประกอบจากอดีต

ครบดาวเคราะห์ทั้ง 8 ดวงแล้ว

โหลด GLB เฉพาะดวงที่เลือกผ่านเมนูบนหน้า การนับนี้หมายถึงดาวเคราะห์ในระบบสุริยะ 8 ดวง ไม่รวมดวงอาทิตย์ ดาวเคราะห์แคระ หรือดาวฤกษ์ในกาแลคซี่

โลกสร้างซ้ำด้วย `blender --background --python art/create_earth.py`; ต้นฉบับ `art/earth.blend` และภาพตรวจงาน `art/earth-preview.png` เป็นภาพจาก Cycles ไม่ใช่ screenshot ของเว็บ เครดิตและข้อจำกัดใน `art/ATTRIBUTION.md`

## Blender visual study

เปิด `/?view=saturn` เพื่อดูฉากตัวอย่างดาวเสาร์เต็มจอ ซึ่งโหลดโมเดลจริงจาก `public/models/saturn.glb` มี OrbitControls, แสงสามมุม, เงาของวงแหวนและดาว, ซูม และรีเซ็ตมุมกล้อง

ไฟล์ต้นฉบับ: `art/saturn.blend` สร้างซ้ำได้ด้วย Blender 3.6: `blender --background --python art/create_saturn.py` ภาพ `art/saturn-preview.png` เป็นภาพเรนเดอร์ Cycles สำหรับตรวจงานโมเดล ไม่ใช่ screenshot ของ WebGL พื้นผิวเป็นภาพสร้างเชิงกระบวนการเพื่อการนำเสนอ ไม่ใช่ภาพสำรวจจริง

รุ่นปรับรายละเอียดใช้พื้นผิวชั้นเมฆ 4K และแผนที่วงแหวน 8K ของ Solar System Scope (CC BY 4.0); ดู `art/ATTRIBUTION.md` สำหรับเครดิตและแหล่งดาวน์โหลด เพิ่มเงา 4096 บนจอใหญ่ (2048 บนมือถือ), ขอบบรรยากาศด้านรับแสง และการเปลี่ยนทิศแสงอย่างนุ่มนวล รุ่น reduced-motion เปลี่ยนแสงทันที

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

Jupiter: regenerate with `blender --background --python art/create_jupiter.py`. The packed source is `art/jupiter.blend`; `art/jupiter-preview.png` is a Cycles render, not browser QA.

Mars: regenerate with `blender --background --python art/create_mars.py`; source `art/mars.blend`, Cycles preview `art/mars-preview.png`. Surface features are in the color map, not displaced terrain. Browser interaction has not been verified.

Venus: regenerate with `blender --background --python art/create_venus.py`; packed source `art/venus.blend`, Cycles preview `art/venus-preview.png`. Shows an illustrative cloud map, not exposed rock or a true-color observation.

Mercury: regenerate with `blender --background --python art/create_mercury.py`; source `art/mercury.blend`, Cycles preview `art/mercury-preview.png`. Crater detail is in the color texture, not displaced elevation.

Ice giants: `blender --background --python art/create_ice_giants.py` regenerates both GLBs, packed .blend sources and Cycles previews. Uranus rings are representative bands with exaggerated visibility; Neptune color is an artistic approximation, not calibrated true color. Browser interaction is not verified.

Default planet lighting is now camera-relative (สำรวจรอบดวง): the key light follows orbit controls immediately and ambient fill is increased. Earth day/night and atmospheric shaders share the same moving light position. Fixed lighting/night presets remain available. This exploration lighting is illustrative, not a real solar terminator.

The homepage is now a galaxy-themed planet selector with all eight destination links and a lightweight animated WebGL backdrop. Mobile uses a two-column grid; reduced motion and a pause button are supported. The original introduction remains at `/?view=about`. Planet cards use resized Blender previews, while GLBs load only on individual planet pages.
