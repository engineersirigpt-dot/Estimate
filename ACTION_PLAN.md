# Pornchai AI RFQ Agent — Action Plan
## ระบบ RFQ-Estimate อัจฉริยะ สำหรับอุตสาหกรรมโรงพิมพ์บรรจุภัณฑ์

---

## สรุปความคืบหน้า (20/03/2026)

| รายการ | ข้อมูล |
|--------|-------|
| วันเริ่มโปรเจกต์ | 16/03/2026 |
| วันที่ทำล่าสุด | 20/03/2026 |
| รวมจำนวนวันที่ทำ | 5 วัน |
| งานเสร็จแล้ว | 47 งาน |
| เป้าหมาย Phase 1 | 31/03/2026 |

---

## Phase 1: Classic Mode — งานที่เสร็จแล้ว

### Day 1 (16/03/2026) — เริ่มโปรเจกต์
| # | หมวด | งาน | หมายเหตุ |
|---|------|-----|---------|
| 1 | Setup | อ่านโค้ดทั้งโปรเจกต์ + วางแผน | อ่าน 4 ไฟล์หลัก + ระบบเก่า |

### Day 2 (17/03/2026) — Parser + Form + Calc พื้นฐาน
| # | หมวด | งาน | หมายเหตุ |
|---|------|-----|---------|
| 2 | Parser | Structured Parser (TITLE/SIZE/PAPER) | จับ structured format ครบ |
| 3 | Parser | Thai Free-text Parser | กล่องครีม อาร์ต 190 แกรม 4 สี |
| 4 | Form | applyAgentData ครบทุก field | 14 sections |
| 5 | Calc | Layout Calculation | 12 box templates |
| 6 | Calc | Price Calculation | Paper+Plate+Print+Process |
| 7 | UI | Fill Flow (ถามข้อมูลที่ขาด) | ถามทีละข้อ + ปุ่ม suggestion |

### Day 3 (18/03/2026) — RAG + Rules + UI Redesign
| # | หมวด | งาน | หมายเหตุ |
|---|------|-----|---------|
| 8 | Knowledge | RAG System (upload Excel/PDF) | 3 files, 1,137 chunks |
| 9 | Knowledge | Knowledge Store (685 records) | Import จากระบบเก่า |
| 10 | Rules | Business Rules Engine (10+ rules) | Auto-fill ตามกฎโรงพิมพ์ |
| 11 | UI | Header Navigation (ไม่มี sidebar) | Full-width layout |
| 12 | Form | Paper auto-fill + fallback | DB → RAG → auto-switch code |
| 13 | Form | Packing auto-detect | kraftwrap/paperband/carton/pallet |
| 14 | Calc | Kraftwrap qty_per_pack | 250 pcs/pack จาก spec |
| 15 | Calc | Qty Price Comparison Tool | เปรียบเทียบราคาตามจำนวน |
| 16 | Parser | Non-spec detection | ข้อความทั่วไป → ปฏิเสธ |
| 17 | Form | Component template change (save/restore) | เปลี่ยน template จำค่าเดิม |
| 18 | Knowledge | Test Suite (5 cases) | node test-suite.js |

### Day 4 (19/03/2026) — Multi-component + Bug fixes
| # | หมวด | งาน | หมายเหตุ |
|---|------|-----|---------|
| 19 | Parser | Multi-component Parser | Tray + Cover แยก component |
| 20 | Parser | F-code Detection (1TT/2TT) | (2TT)→TTSLB, (1TT)→TTAB |
| 21 | Parser | UV ink vs UV coating | coating gloss UV ≠ UV ink |
| 22 | Parser | Qty exclude packing | 125 pcs/pack ≠ qty |
| 23 | Rules | Pattern Match Engine | หา 685 งานเก่าคล้าย → แนะนำ |
| 24 | Form | Box Template 12 แบบ | keyword mapping TH+EN ครบ |
| 25 | Form | dust_flap default fix | Type 5,6 = 25mm |
| 26 | Form | mm2inch legacy conversion | ceil rounding เหมือนระบบเดิม |
| 27 | Calc | Other Process Cost (handwork/outsource) | คิดราคาจากฟอร์ม |
| 28 | UI | AI Brain Visualization | 3D Knowledge Graph |
| 29 | UI | Multiple Coating display | แสดงหลาย coating per component |
| 30 | Knowledge | Self-learning (save corrections) | Save RFQ → Knowledge Store |

### Day 5 (20/03/2026) — F-codes + Coating + UX + ฟีเจอร์ใหม่
| # | หมวด | งาน | หมายเหตุ |
|---|------|-----|---------|
| 31 | Parser | Multi-edition F-codes | สีฟ้า 319 = F-code name |
| 32 | Parser | W/L/H Format | W 212 / L 271 / H 30 |
| 33 | Form | Coating alias (PVC→OPP, เว้นลิ้น→WTB-HR) | 8 alias mappings |
| 34 | Form | Multi-F qty per F-code | AI ถามทีละ F → Total auto |
| 35 | UI | Input focus fix ทุกช่องฟอร์ม | พิมพ์ตัวเลขได้ลื่นทุกช่อง |
| 36 | UI | Warning Banner real-time | หายเมื่อกรอกครบ |
| 37 | Calc | Layout canvas Component 2+ | แก้ไขแสดง layout |
| 38 | Form | รองรับความสูง 0 mm | งานจริงมีกล่องแบนไม่มีความสูง |
| 39 | Form | Coating ปรับปรุงทั้งระบบ | จับ keyword ตรง spec, เพิ่มได้หลายตัว, ปุ่ม +Coating |
| 40 | Form | ลูกฟูก (Corrugated) กลับมาในฟอร์ม | แสดงเมื่อประกบลูกฟูก + Pornchai AI เตือนกรอก |
| 41 | Parser | จับ Reprint อัตโนมัติ | Rep./Reprint/รีพ → ประเภทงาน Reprint |
| 42 | AI | AI แก้ฟอร์มผ่าน chat | สั่งเปลี่ยนจำนวน สี ขนาด ประเภทงานผ่านแชทได้ |
| 43 | Form | Delivery ปรับปรุง + แบ่งส่ง | เลือกที่จัดส่ง+พิมพ์ได้ แบ่งส่งมี F-code+จำนวน |

---

## Phase 1: งานที่ค้าง

| # | หมวด | งาน | Priority | หมายเหตุ |
|---|------|-----|----------|---------|
| 44 | Form | Save RFQ ลง DB ระบบเก่า | สูง | ทดสอบ save_rfq API |
| 45 | Knowledge | Test Suite เพิ่ม case | กลาง | เพิ่มจาก use case ทดสอบ |
| 46 | Form | Packing per F-code | ต่ำ | แยก packing ตาม F |

---

## งานถัดไป: ปรับ Component Template Section

### แผน
**ปัจจุบัน:** AI เลือก template ให้อัตโนมัติ (เช่น Type 5 กล่องฝาครอบ) + แสดง mm/inch/fold/open size ทันที

**ใหม่:**
1. **Default = ไม่เลือก template** — dropdown เป็นว่าง ไม่มีภาพกล่อง ไม่มีช่อง mm
2. **AI เก็บค่าที่ parse ได้ไว้เบื้องหลัง** — ขนาด, template ที่แนะนำ, mm/inch ทั้งหมด
3. **แสดง Pornchai AI SVG + animation** บนตำแหน่ง template section:
   - บอกว่า "ผมมีข้อมูลขนาดพร้อมแล้วนะครับ"
   - แสดงค่า เช่น 📐 384 x 252 x 0 mm
   - แนะนำ template เช่น 📄 แนะนำ: Type 5 กล่องฝาครอบ
   - "เลือก template แล้วผมจะกรอกให้เลยครับ"
4. **พอผู้ใช้เลือก template** → AI ดึงค่าที่เก็บไว้ลงฟอร์มให้ครบ → SVG หายไป
5. **ยังเก็บข้อมูลเพื่อเรียนรู้เหมือนเดิม** — Knowledge Store ไม่เปลี่ยน

### UI ที่จะเห็น
```
Component ที่ 1    [— เลือก template —  v]

┌─────────────────────────────────────────┐
│  🤖 Pornchai AI (SVG animated)          │
│  "ผมมีข้อมูลขนาดพร้อมแล้วครับ!"       │
│   📐 384 x 252 x 0 mm                   │
│   📄 แนะนำ: Type 5 กล่องฝาครอบ          │
│   เลือก template แล้วผมจะกรอกให้เลยครับ │
└─────────────────────────────────────────┘
```
เลือก template → ค่าลงฟอร์ม → SVG หายไป

### สิ่งที่ต้องทำ
- [ ] แก้ `applyAgentData()` ไม่ตั้ง box_type อัตโนมัติ → เก็บไว้ใน `_pendingSize`
- [ ] แก้ `renderForm()` แสดง Pornchai SVG + ข้อมูลขนาดเมื่อมี `_pendingSize`
- [ ] แก้ `setCompBoxType()` ดึง `_pendingSize` ลงฟอร์มเมื่อเลือก template
- [ ] SVG animation ให้ดูมีชีวิต (ขยับ, กระพริบ)
- [ ] กรอกครบ → SVG หายไป

---

## Phase 2: AI-Guided RFQ Mode (รอพัฒนา)

| งาน | รายละเอียด |
|-----|-----------|
| Smart Conversation Flow | AI คุยกับ user สร้าง RFQ ทีละขั้นตอน |
| Understanding Card | แสดง summary ข้อมูลที่จับได้ |
| Step-by-step Wizard | ถามทีละขั้น: กล่อง → ขนาด → กระดาษ → สี → addon |
| Live Price Preview | แสดงราคาประมาณการระหว่างคุย |

---

## Phase 3: Global Platform (อนาคต)

| งาน | รายละเอียด |
|-----|-----------|
| PostgreSQL + pgvector | เมื่อ > 10,000 records |
| Vector Embedding + Semantic Search | Deep Learning สำหรับ spec matching |
| Multi-language (EN/TH/JP/CN) | รองรับหลายภาษา |
| Multi-tenant + Open API | SaaS model |

---

## วันที่อัพเดท
- 2026-03-16: เริ่มโปรเจกต์ อ่านโค้ด + วางแผน
- 2026-03-17: Parser + Form + Calc พื้นฐาน (6 งาน)
- 2026-03-18: RAG + Rules + UI ใหม่ (11 งาน)
- 2026-03-19: Multi-component + Bug fixes (12 งาน)
- 2026-03-20: F-codes + Coating + UX + ฟีเจอร์ใหม่ (13 งาน) — รวม 47 งาน
