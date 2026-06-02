# Pornchai AI RFQ — Complete Project Knowledge
## ระบบ RFQ-Estimate อัจฉริยะ สำหรับอุตสาหกรรมโรงพิมพ์บรรจุภัณฑ์

---

## 1. สถาปัตยกรรม (Architecture)

### Tech Stack
- Backend: Node.js + Express (server.js ~3000 lines)
- Frontend: Vanilla JS (app.js ~11000 lines) + HTML/CSS
- CalcEngine: Pure JS (calc.js ~1600 lines) — สูตรคำนวณทั้งหมด
- AI: Claude Opus 4.6 (parse) + Sonnet 4.6 (chat) via OpenClaw
- Database: Estimate API (192.168.5.3:3010) — master data, RFQ CRUD
- Knowledge: specs.json (685 records), RAG documents

### System Flow
```
User วาง spec → Parser (LLM/Built-in) → JSON
  → applyAgentData() → กรอกฟอร์ม
  → ensureEstimateReady() → Business Rules
  → calculateLayout() → CalcEngine → Layout diagram
  → calcFullEstimate() → Price Estimation
  → Save RFQ → Database
```

### API Endpoints
- POST /api/parse-spec — วิเคราะห์ spec → JSON
- POST /api/chat — AI Chat (Persona + Guardrails)
- GET /api/estimate/master_data?type=xxx — ดึง master data
- GET /api/employees/search?term=xxx — ค้นหาพนักงาน
- GET /api/rfq/list — รายการ RFQ
- GET /api/rfq/detail/:id — รายละเอียด RFQ

---

## 2. CalcEngine — สูตรคำนวณทั้งหมด

### Box Templates (12 แบบ) — สูตร Open Size (W × L)
| Type | ชื่อ | สูตร W | สูตร L |
|------|------|--------|--------|
| 1 | Reverse Tuck End | 2(w+tf)+d | 2(w+l)+gf |
| 2 | Straight Tuck End | 2(w+tf)+d | 2(w+l)+gf |
| 3 | TTSLB (ออโต้ล็อคหูขัด) | tf+w+d+w/2+ol | 2(w+l)+gf |
| 4 | TTAB (ออโต้ล็อคทากาว) | tf+w+d+w/2+ol | 2(w+l)+gf |
| 5 | Double Glue Side Wall (ฝาครอบ) | w+4d | l+4d+2dust |
| 6 | Frame-Vue Tray | w+4d+2dust+2ol | l+4d+2dust+2ol |
| 7 | Four Corner Beers Tray | 2(l+dust)+w | 2(l+d)+l |
| 8 | Gable Top (จั่ว) | tf+2d+w/2+ol | 2(w+l)+gf |
| 9 | Sleeve (ปลอก) | d | 2(w+l)+gf |
| 10 | Pillow Box (หมอน) | l+d | 2w+gf |
| 11 | Seal End (ทากาว) | 2w+d | 2(w+l)+gf |
| 12 | Custom (กำหนดเอง) | user input | user input |

ตัวแปร: w=กว้าง, l=ยาว, d=ความสูง, tf=ฝาเสียบ(default 15), gf=ติดกาว(default 15), dust=ปีกกล่อง, ol=overlap
Bleed: 3mm รอบด้าน

### Layout Calculation
1. คำนวณ Open Size จาก box template + ขนาด + bleed
2. ลอง fit ทุก sheet size ของเครื่องที่เลือก
3. ลอง 2 ทิศ: ปกติ + หมุน 90°
4. เลือก layout ที่ได้ UPS (จำนวนดวง) มากสุด
5. ถ้า Offset วางไม่ได้ → auto-try Flexo, JetPress, Konica

### Paper Usage
- sheets = ceil(qty / ups)
- waste = base_waste + (extra_per_color × colors)
- paperNet = sheets + waste

### Cost Components
1. **Paper Cost**: paperNet × unitPrice (B/Kg or B/Sheet)
2. **Plate Cost**: จำนวนสี × ราคา plate ตามเครื่อง
3. **Print Cost**: จำนวนสี × ราคาพิมพ์ ตามจำนวน + เครื่อง
4. **After Press**: Diecut + Coating + แกะ + Inspection
5. **Corrugated Cost**: ตาม flute + layer + grade + ตร.ฟุต
6. **Packing Cost**: Kraftwrap/Paperband/Carton/Pallet
7. **Delivery Cost**: ตามจังหวัด (default 1,500)
8. **Other Process**: ค่าติดกาว, ปั๊มฟอยล์, ปั๊มนูน, handwork
9. **Markup**: ตาม qty tier
10. **Tax**: 3%

---

## 3. เครื่องจักร Sirivatana Interprint

### Printing (Offset Sheet-fed)
- ตัด 1: L244(2สี), L444SP(4/4สี 820x1130), L444SPAPC, G844(8สี+Coat 840x1150)
- ตัด 2: L640(6สี), CD440A(4สี+Coat), LS440, L540APC(5สี), LS540(5สี+Coat), L640C(6สี+Coat), L640UVAPC(6สี+UV), GL640 Hybrid(6สี+UV/IR), KBA(8สี 740x1050), Akiyama(4/4), L640APC-A
- ตัด 3: LS1029P(10สี 530x750)

### Web Press
- 35M1, 35K1-K7, WEB38S, 442K1, 542K2, 440K1 (4/4สี, 45-130g)

### Digital
- JetPress 585x750mm
- Konica 330x487mm

### Afterpress (274 รายการ)
- Folder: 14 เครื่อง (Heidelberg, STAHL, MBO)
- เย็บเข็ม: 12 เครื่อง (OSAKO, Heidelberg)
- เย็บกี่: ASTRONIC, Aster Pro
- ไสกาว: Muller Martini 24Head, Kolbus 21Head
- Hard Cover: Case Making, Liner, Case In, RB
- Coating: OPP(22m/min), UV TYMI/Steinemann(3500sph), Silk Screen, Waterbase(2000sph), Blister
- Diecut: Sanwa, Yoco(3000sph), Asahi(3000sph), Bobst(5000sph), SHIHENG(8000sph)
- Hotstamp: LCK, Heidelberg Auto, Manual
- Wire-O: 15+ เครื่อง
- Rigid Box: GS-230, GS-450F8
- Board Book: Photo Fast(25/min)

### Flexo (Packaging)
- Semi auto 2 color flexo printer + slotter

---

## 4. Business Rules Engine (10+ rules)

| Rule | เงื่อนไข | ผล |
|------|---------|-----|
| Rule 0 | Pattern Match | หางานเก่าคล้ายจาก 685 records → แนะนำ template, corrugated, paper cost |
| Rule 1 | Paper cost ว่าง | Auto-fill จาก DB → same family → RAG → warning |
| Rule 1b | Component name มี keyword | Auto-detect box template (Tray→5, Sleeve→9, etc.) |
| Rule 2 | Box type 1-11 | Auto เปิด die-cut |
| Rule 3 | Glued spot | จัดการผ่าน checkbox ไม่ใส่ other_process |
| Rule 4 | Component type 2/3 | แสดง corrugated section (ไม่เดา flute) |
| Rule 5 | Coating text | Match กับ master data + alias mapping |
| Rule 6 | Paper source | Auto-detect ในประเทศ/ต่างประเทศ |
| Rule 7 | Paper markup | Default 10% domestic / 13% import |
| Rule 8 | Packing text | Auto-detect kraftwrap/paperband/carton/pallet |
| Rule 9 | Delivery | Default 1,500 THB |
| Rule 10 | Multi-F qty | Sanity check จำนวนแต่ละ F |

---

## 5. Parser — วิเคราะห์ Spec

### 4 ระดับ Parser
1. **Structured**: TITLE/SIZE/PAPER/PRINT/OTHER/PACKING → regex จับทีละบรรทัด
2. **English KV**: "Paper: AC 300gsm / Size: 6-1/4" x 7-1/2"" → key-value
3. **Thai Free-text**: "กล่องครีม อาร์ต 190 แกรม 4 สี" → NLP-like regex
4. **Casual One-liner**: "กล่องครีม AC350 4สี 5000ชิ้น" → compact regex

### LLM-First Architecture
- Structured spec → Built-in Parser (เร็ว + จับ F-codes ถูก)
- Free-text/casual → LLM Opus 4.6 (เข้าใจ typo + ภาษาธรรมชาติ)
- Fallback: Built-in Parser เสมอถ้า LLM offline

### สิ่งที่ Parser จับได้
- Job name, Customer, AE
- Size (mm/inch/cm → แปลงเป็น mm)
- Paper code + GSM
- Color (outside/inside)
- Coating + side
- Packing + qty_per_pack
- F-codes (Multi-F)
- Component type (ประกบลูกฟูก/ไม่ประกบ)
- Reprint detection (Rep./รีพริ้น/งานซ้ำ)
- Corrugated flute type
- Box template detection

---

## 6. Coating Alias Mapping

| AE เรียก | ระบบใช้ | Code |
|----------|--------|------|
| PVC เงา | OPP Gloss | OPP |
| PVC ด้าน | OPP Matt | OPP |
| เว้นลิ้น + Hi-rub | Hi-rub WB เว้นลิ้น | WTB-HR |
| เว้นยิง Lot No. | Hi-rub WB เว้นยิง | S-WTB-HR |
| UV เว้นลิ้น | UV เว้นลิ้น | UV_GAP |
| Gloss Waterbase | ≠ Hi-gloss Waterbase | ดู keyword |

---

## 7. Knowledge Store

- 685 records จากระบบเก่า
- ใช้สำหรับ Pattern Match (หางานเก่าคล้าย → แนะนำค่า)
- Scoring: job_name + paper + size + component_type + corrugated
- เรียนรู้จาก RFQ ที่ save → เพิ่ม record ใหม่

---

## 8. AI Agent Persona

- ชื่อ: Pornchai AI
- สร้างโดย: คุณธนรัช ชื้อผาสุข (Thanarat Chuephasuk)
- Model: Claude (Anthropic)
- บริษัท: Sirivatana Interprint
- Guardrails: เฉพาะ RFQ/Estimate/Packaging/Printing + Supply Chain + Business
- เรียกชื่อผู้ใช้จาก login (ชื่อต้น)
- ใส่ emoji 1-2 ตัว, bold หัวข้อ, แนบ reference link

---

## 9. UI Features

- Header Navigation (ไม่มี sidebar)
- Dark/Light Theme (CSS Variables)
- Chat Panel (Pornchai AI) + Fill Flow
- Component Template: AI SVG แนะนำ + ปุ่มกดกรอก
- Corrugated section: แสดงเมื่อประกบลูกฟูก + AI เตือน
- Delivery: datalist + แบ่งส่ง (F-code + จำนวน)
- Attach File: preview + limit 10
- Qty Price Comparison Tool
- Layout Canvas + auto-switch เครื่อง
- Price Estimation + auto-switch เครื่อง

---

## 10. Test Suite

- 100 automated test cases
- ครอบคลุม: Structured, Thai, English, Edge cases, Coating, F-codes, Corrugated
- รัน: `cd webapp && node test-suite.js`
- Score: 100% PASS
