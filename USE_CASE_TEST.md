# Use-Case Test — ทดสอบภาพรวมทั้ง Flow

## วิธีทดสอบ
1. เปิด http://localhost:3080 → กด "สร้าง RFQ"
2. วาง spec ในแชท → กด Enter
3. ทดสอบตาม checklist ทีละข้อ
4. จด ❌ ทุก bug ที่เจอ + screenshot
5. ส่งผลมาให้ AI แก้ทีเดียวรวด

---

## Use-Case 1: งานง่าย (1 Component, ไม่มีลูกฟูก)
### Spec:
```
TITLE : กล่องครีม ABC 50ml
SIZE (mm.) : 60 x 80 x 120
COMPONENT TYPE
   - BOX: ไม่ประกบลูกฟูก
PAPER
   - BOX: Art Card 350 gsm
PRINT
   - BOX: 4/0 Colors
OTHER
   - BOX: coating Gloss Waterbase 1 s
PACKING
   - BOX: kraftwrap 200 pcs/pack
qty 5000
```

### Checklist:
- [ ] 1.1 วาง spec → AI parse สำเร็จ
- [ ] 1.2 ชื่องาน = "กล่องครีม ABC 50ml"
- [ ] 1.3 กระดาษ = AC 350 gsm
- [ ] 1.4 สี = 4/0
- [ ] 1.5 Coating = Gloss Waterbase 1 s
- [ ] 1.6 Packing = kraftwrap 200 pcs/pack ✅ ติ๊ก Kraftwrap
- [ ] 1.7 จำนวน = 5,000
- [ ] 1.8 ไม่ติ๊ก "งานมีหลาย F"
- [ ] 1.9 Pornchai SVG แสดงขนาด 60x80x120 mm
- [ ] 1.10 เลือก Template (เช่น Type 1) → ขนาดกรอกให้
- [ ] 1.11 กดปุ่ม AI กรอกขนาด → ค่า mm ลงช่อง
- [ ] 1.12 Fold Size + Open Size คำนวณถูก
- [ ] 1.13 กดคำนวณ Layout → แสดง Layout diagram
- [ ] 1.14 UPS + Paper Net สมเหตุสมผล
- [ ] 1.15 กดดูราคา → ราคารวมแสดง (ไม่ใช่ "-")
- [ ] 1.16 ราคาต่อชิ้นสมเหตุสมผล

---

## Use-Case 2: งาน Reprint + ประกบลูกฟูก
### Spec:
```
TITLE : Rep.Tray Wild Tides Tuna แพ็ค24x95g. (NEW)
SIZE (Inches) : 15.12" x 9.93" x 0"
SIZE (mm.) : 384 x 252 x 0
COMPONENT TYPE
   - F005613: ประกบลูกฟูก
PAPER
   - F005613: Duplex GBB 300 gsm
PRINT
   - F005613 : 4/0 Colors
OTHER
   - F005613: coating Gloss Waterbase Hi-Rub 1 s
PROCESS
PACKING
   - F005613: kraftwrap 100 pcs/pack
```

### Checklist:
- [ ] 2.1 ประเภทงาน = "งาน Reprint" (จับ Rep.)
- [ ] 2.2 Component Type = ประกบลูกฟูก
- [ ] 2.3 Coating = Waterbase Hi-Rub (ไม่ใช่แค่ Waterbase)
- [ ] 2.4 ส่วนลูกฟูก แสดง (ขอบส้ม) + Pornchai เตือนกรอก
- [ ] 2.5 Depth = 0 (ไม่ใช่ว่าง)
- [ ] 2.6 AI ไม่ถาม depth ซ้ำ
- [ ] 2.7 SVG แนะนำ Template ตรงกับ Chat
- [ ] 2.8 เลือก Template → กด AI กรอก → ขนาดลง
- [ ] 2.9 คำนวณ Layout ได้ (auto-switch Flexo ถ้าเกิน Offset)
- [ ] 2.10 ราคารวมแสดง + ราคาต่อชิ้นถูก

---

## Use-Case 3: งานหลาย F (Multi-F)
### Spec:
```
TITLE : Test งานหลาย F
SIZE (mm.) : 145 x 85 x 115
COMPONENT TYPE
   - BOX: ไม่ประกบลูกฟูก
PAPER
   - BOX: Duplex GBB 400 gsm
PRINT
   - F001 : 5/0 Colors
   - F002 : 4/0 Colors
   - F003 : 4/0 Colors
   - F004 : 4/0 Colors
   - F005 : 5/0 Colors
OTHER
   - BOX: coating gloss OPP 1 s
   - BOX: coating กันชื้น (Water Proof) 2 s
PACKING
   - F001: kraftwrap 160 pcs/pack
   - F002: kraftwrap 160 pcs/pack
   - F003: kraftwrap 160 pcs/pack
   - F004: kraftwrap 160 pcs/pack
   - F005: kraftwrap 160 pcs/pack
qty 10000
```

### Checklist:
- [ ] 3.1 ติ๊ก "งานมีหลาย F" อัตโนมัติ
- [ ] 3.2 F-card แสดง 5 ตัว (F001-F005)
- [ ] 3.3 สีแต่ละ F ถูก (F001=5/0, F002=4/0, ...)
- [ ] 3.4 AI ถามจำนวนทีละ F (5 ครั้ง)
- [ ] 3.5 Total Qty รวมถูกต้อง
- [ ] 3.6 Coating 2 ตัว (OPP + Water Proof)
- [ ] 3.7 เลือก Template + กรอกขนาด
- [ ] 3.8 คำนวณ Layout ได้
- [ ] 3.9 ราคาแสดงถูกต้อง

---

## Use-Case 4: AI Chat สั่งแก้ฟอร์ม
### ทดสอบหลังกรอก spec แล้ว พิมพ์ในแชท:

- [ ] 4.1 "reprint" → ประเภทงานเปลี่ยน
- [ ] 4.2 "จำนวน 3000" → qty เปลี่ยน
- [ ] 4.3 "สี 6/0" → color เปลี่ยน
- [ ] 4.4 "เลือก template 5" หรือ "ขอ tray" → ถามยืนยัน → ตอบ "ใช่"
- [ ] 4.5 "foil สีเงิน" → เพิ่ม foil stamp
- [ ] 4.6 "ลบ coating" → ลบ coating
- [ ] 4.7 "กระดาษ AC 300 gsm" → เปลี่ยนกระดาษ
- [ ] 4.8 "คุณเป็นใคร" → บอกเครดิต Thanarat Chuephasuk
- [ ] 4.9 "วันนี้อากาศดี" → ปฏิเสธสุภาพ
- [ ] 4.10 "Estimate ที่ดีเป็นแบบไหน" → ให้คำแนะนำ

---

## Use-Case 5: Thai Free-text (ไม่มี TITLE/PRINT)
### Spec:
```
กล่องสบู่สมุนไพร ขนาด 80x60x30 มม. กระดาษอาร์ต 300 แกรม พิมพ์ 4 สี เคลือบเงา 3000 ชิ้น
```

### Checklist:
- [ ] 5.1 AI parse ได้ (LLM หรือ Built-in)
- [ ] 5.2 ขนาด = 80x60x30
- [ ] 5.3 กระดาษ = AC 300 gsm
- [ ] 5.4 สี = 4/0
- [ ] 5.5 จำนวน = 3,000
- [ ] 5.6 มี Coating
- [ ] 5.7 เลือก Template + คำนวณ Layout + ราคาได้

---

## สรุปผล

| Use-Case | ผ่าน | ไม่ผ่าน | Bug |
|----------|------|---------|-----|
| 1. งานง่าย | /16 | | |
| 2. Reprint+ลูกฟูก | /10 | | |
| 3. หลาย F | /9 | | |
| 4. AI Chat | /10 | | |
| 5. Thai Free-text | /7 | | |
| **รวม** | **/52** | | |

จด bug ทุกตัว แล้วส่งมาให้ AI แก้ทีเดียวรวด!
