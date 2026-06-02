# Pornchai AI RFQ Agent

## สำหรับ AI ที่เข้ามาทำงานในโปรเจกต์นี้

> **อ่านไฟล์โค้ดทั้งหมดและทำความเข้าใจทั้งระบบก่อนเริ่มพัฒนาเสมอ**
> ถ้าครบหมดแล้วตอบสั้นๆ "ok"

---

## โปรเจกต์นี้คืออะไร

ระบบ **RFQ-Estimate สำหรับอุตสาหกรรมโรงพิมพ์บรรจุภัณฑ์ (Packaging Printing)** มี AI Agent ชื่อ "Pornchai" ช่วยผู้ใช้ทำ Estimate อัตโนมัติ — วาง spec → AI parse → กรอกฟอร์ม → คำนวณ Layout + ราคา

**เป้าหมาย:** ระบบ RFQ-Estimate อันดับ 1 ของโลกสายโรงพิมพ์บรรจุภัณฑ์

---

## หลักการสำคัญ

- **อ่านโค้ดทั้งหมดก่อนแก้ไข** — เข้าใจ flow ทั้งระบบก่อนแตะ
- **ตรวจสอบกับระบบเก่า** (192.168.5.3:3040) เสมอ
- **ห้ามทำให้ฟีเจอร์ที่ใช้งานได้อยู่แล้วพัง** — ตรวจสอบ syntax ด้วย `node --check` ทุกครั้ง
- **ใช้ CSS Variables** สำหรับสี (รองรับ dark/light mode)
- **อัพเดท cache buster** (`?v=YYYYMMDD+letter`) หลังแก้ JS
- **ตอบเป็นภาษาไทยเป็นหลัก**
- **3 คำหลัก: ง่าย + ไว + ถูกต้อง**

---

## โครงสร้างไฟล์

```
webapp/
├── server.js          — Express server, API proxy, spec parser, cache
├── public/
│   ├── index.html     — HTML + CSS + responsive styles
│   └── js/
│       ├── app.js     — Main app logic (15,000+ lines)
│       ├── calc.js    — CalcEngine สูตรคำนวณ
│       ├── box-3d.js  — 3D box viewer (Three.js)
│       └── box-svg.js — SVG dieline generator
├── data/master/       — Local master data cache (JSON)
└── knowledge/         — AI prompt context

ไฟล์ระบบเก่า (root — อ่านอย่างเดียว เป็น reference):
├── js_function_estimate*.js
├── js_data_default.js
└── estimate_page.html
```

---

## การรันโปรเจกต์

```bash
cd d:\Pornchai AI RFQ\webapp
node server.js
# เปิด http://localhost:3080
```

---

## สิ่งที่ต้องระวัง

- **Inline styles ใน app.js** ต้องใช้ `var(--name, fallback)` ไม่ hardcode สี
- **Template literal ซ้อนกัน** — ใน IIFE `(() => {})()` ให้ใช้ string concatenation แทน nested backtick
- **`new RegExp()` escaping** — ใช้ regex literal แทน `new RegExp(PFX.source + '...')` เพราะ `\\s` จะกลายเป็น `s`
- **Client cache** (`State._specCache`) — อาจเก็บผลเก่า ถ้าแก้ parser ต้อง hard refresh
- **ขนาดคลี่ > 740x1040mm** = เกิน Offset → ต้อง auto-switch print type

---

## เจ้าของโปรเจค

ผู้เชี่ยวชาญด้าน RFQ-Estimate สายโรงพิมพ์ ทำงานที่ Sirivatana Interprint ต้องการ:
- ผลลัพธ์ถูกต้อง ตรงกับระบบจริง
- Code คุณภาพสูง ทันสมัย
- Design สวย modern ระดับ Production
- ทำงานเร็ว กระชับ ไม่อ้อมค้อม
