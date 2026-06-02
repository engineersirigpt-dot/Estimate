# Frontend Test Checklist — Pornchai AI RFQ
## ทดสอบบน Browser (localhost:3080)

---

## 1. ส่ง Spec → AI กรอกฟอร์ม

### 1.1 Structured Spec (ภาษาอังกฤษ)
- [ ] วาง spec ที่มี TITLE/SIZE/PAPER/PRINT/OTHER/PACKING → AI parse + กรอกฟอร์มครบ
- [ ] ชื่องาน (Job Name) ถูกต้อง
- [ ] กระดาษ (Paper Code + GSM) ถูกต้อง
- [ ] สี (Color outside/inside) ถูกต้อง
- [ ] ขนาด (Size) เก็บไว้ใน Pornchai SVG รอเลือก template
- [ ] Coating ถูกต้อง (เช่น Hi-Rub ไม่ใช่แค่ Waterbase)
- [ ] Packing ถูกต้อง (kraftwrap + qty_per_pack)

### 1.2 Thai Free-text Spec
- [ ] วาง spec ภาษาไทย เช่น "กล่องครีม AC350 4สี 5000ชิ้น" → กรอกได้
- [ ] ขนาดใช้ cm → แปลงเป็น mm ถูก (เช่น 15x20x8 cm → 150x200x80 mm)

### 1.3 Reprint Detection
- [ ] spec มี "Rep." หรือ "Reprint" → ประเภทงานเปลี่ยนเป็น "งาน Reprint"
- [ ] spec มี "รีพริ้น" → ประเภทงานเปลี่ยนเป็น "งาน Reprint"

### 1.4 Multi-component
- [ ] spec มี Tray + Cover → สร้าง 2 components

### 1.5 F-code / Multi-F
- [ ] spec มี F-code → ติ๊ก "งานมีหลาย F" + สร้าง F-card
- [ ] spec มี edition (สีฟ้า 319, สีชมพู 186) → สร้าง F-code names

---

## 2. Component Template + Pornchai SVG

### 2.1 ไม่เลือก template อัตโนมัติ
- [ ] หลัง parse spec → dropdown template เป็นว่าง "-Select Template-"
- [ ] Pornchai SVG แสดงข้อมูลขนาด + แนะนำ template
- [ ] แสดงเหตุผลแนะนำ (จาก Pattern Match / ชื่อ component)

### 2.2 เลือก template → AI กรอกขนาด
- [ ] เลือก template จาก dropdown → แสดง size section
- [ ] ปุ่ม "กดเพื่อให้ Pornchai AI กรอกขนาดให้" ปรากฏ
- [ ] กดปุ่ม → ค่า mm กรอกลงช่อง → ปุ่มหายไป
- [ ] Fold Size / Open Size คำนวณถูก

### 2.3 Banner สีแดง
- [ ] ก่อนเลือก template → ไม่แจ้งเตือน width/length (เพราะ AI มีค่ารอ)
- [ ] เลือก template แล้ว → banner "รูปแบบกล่อง" หายไป
- [ ] กรอกครบทุกช่อง → banner หายหมด

---

## 3. ช่อง Input พิมพ์ลื่น

### 3.1 ไม่กระตุก
- [ ] พิมพ์ตัวเลขในช่อง Cost → ลื่นไม่กระตุก
- [ ] พิมพ์ตัวเลขในช่อง Markup → ลื่น + Sale อัพเดท
- [ ] พิมพ์ตัวเลขในช่อง ตัดม้วน → ลื่น + Sale อัพเดท
- [ ] พิมพ์ตัวเลขในช่อง Run-On % → ลื่น + ค่า run-on อัพเดท

### 3.2 Component Size
- [ ] พิมพ์กว้าง/ยาว/สูง → inch + Fold Size + Open Size อัพเดททันที
- [ ] ไม่กระตุก ไม่เด้งขึ้นบน

---

## 4. ความสูง 0 mm

- [ ] spec มี depth=0 → ช่อง "ความสูง" แสดง 0 (ไม่ใช่ว่าง)
- [ ] AI ไม่ถามความสูงซ้ำ (เพราะ 0 = มีค่าแล้ว)
- [ ] Open Size คำนวณถูก (depth=0 ไม่ error)

---

## 5. Coating

### 5.1 Auto-detect
- [ ] spec มี "Waterbase Hi-Rub 1 s" → เลือก Waterbase Hi-Rub (ไม่ใช่แค่ Waterbase)
- [ ] spec มี "PVC เงา" → เลือก OPP

### 5.2 เพิ่ม/ลบ Coating
- [ ] กดปุ่ม "+ Coating" → เพิ่ม coating ใหม่
- [ ] เลือก Gloss/Matt/Other ได้
- [ ] เลือก type+side ได้
- [ ] กดปุ่ม X → ลบ coating

---

## 6. ลูกฟูก (Corrugated)

- [ ] spec มี "ประกบลูกฟูก" → แสดง section ลูกฟูก (ขอบสีส้ม)
- [ ] Pornchai SVG เตือน "อย่าลืมกรอกข้อมูลลูกฟูก"
- [ ] เลือก Flute + ด้านประกบ + เกรด → เตือนหายไป + ขอบเปลี่ยนสีเขียว
- [ ] เลือก "ไม่ประกบลูกฟูก" → section ลูกฟูกหายไป

---

## 7. Foil Stamp

- [ ] ติ๊ก Foil stamp → แสดงช่องเลือกสี + code
- [ ] spec มี "ปั๊มฟอยล์ทอง" → ติ๊ก Foil stamp + เลือกสี (ถ้า match ได้)

---

## 8. Delivery

### 8.1 ปกติ
- [ ] พิมพ์จังหวัด → แสดง list จาก master data (datalist)
- [ ] เลือกจังหวัด → บันทึกค่า
- [ ] เลือกวันที่ส่ง → บันทึกค่า

### 8.2 แบ่งส่ง
- [ ] ติ๊ก "แบ่งส่ง" → แสดง section แบ่งส่ง
- [ ] กดปุ่ม "+ เพิ่มรอบส่ง" → เพิ่มรอบใหม่
- [ ] เลือก F Code + จำนวนในแต่ละรอบ
- [ ] กดปุ่ม + → เพิ่ม F Code ในรอบเดียวกัน
- [ ] กดปุ่ม "ลบ" → ลบรอบนั้น

---

## 9. Attach File

- [ ] กดปุ่ม "+ เพิ่ม" → แสดงปุ่ม "เลือกไฟล์"
- [ ] เลือกไฟล์ → แสดงชื่อไฟล์ + icon ดู + icon ลบ
- [ ] กดปุ่ม icon ดู (ตา) → แสดง Modal preview กลางจอ
  - [ ] รูปภาพ (jpg/png) → แสดงรูปเต็ม
  - [ ] PDF → แสดง PDF viewer
  - [ ] ไฟล์อื่น → แสดงชื่อ + ปุ่มดาวน์โหลด
- [ ] กดปุ่ม X หรือนอก Modal → ปิด Modal
- [ ] กดปุ่ม icon ลบ (ถังขยะ) → ลบไฟล์
- [ ] เพิ่มได้สูงสุด 10 ไฟล์ → แสดง x/10
- [ ] ครบ 10 → ปุ่ม "เพิ่ม" หายไป

---

## 10. AI Chat

### 10.1 สั่งแก้ฟอร์ม (มีฟอร์มอยู่แล้ว)
- [ ] พิมพ์ "reprint" → ประเภทงานเปลี่ยน
- [ ] พิมพ์ "จำนวน 3000" → qty เปลี่ยน
- [ ] พิมพ์ "สี 6/0" → color เปลี่ยน
- [ ] พิมพ์ "ขนาด 200x150x50" → size เปลี่ยน
- [ ] พิมพ์ "กระดาษ AC 350 gsm" → paper เปลี่ยน
- [ ] พิมพ์ "offset" → print type เปลี่ยน
- [ ] พิมพ์ "foil สีเงิน" → เพิ่ม foil stamp
- [ ] พิมพ์ "เพิ่ม coating" → เพิ่ม coating
- [ ] พิมพ์ "ลบ coating" → ลบ coating
- [ ] พิมพ์ "ประกบลูกฟูก" → component_type เปลี่ยน
- [ ] พิมพ์ "flute B" → flute_type เปลี่ยน

### 10.2 Confirmation Flow
- [ ] พิมพ์ "ขอ template custom" → AI ถามยืนยัน
- [ ] พิมพ์ "ใช่" → เลือก template + แจ้งสำเร็จ
- [ ] พิมพ์ "ไม่" → ยกเลิก

### 10.3 AI Persona
- [ ] พิมพ์เรื่องไม่เกี่ยว → AI ปฏิเสธสุภาพ (ไม่ใช่ error แข็งๆ)
- [ ] ถาม "คุณเป็นใคร" → AI ตอบเครดิต Thanarat Chuephasuk + Claude
- [ ] ถามเรื่อง Estimate → AI ให้คำแนะนำได้
- [ ] ถามเรื่อง Packaging มาตรฐานสากล → AI ตอบ + แนบ reference link

### 10.4 ภาษาไทย + English
- [ ] พิมพ์ภาษาไทย → AI เข้าใจ
- [ ] พิมพ์ภาษาอังกฤษ → AI เข้าใจ
- [ ] พิมพ์ผสม → AI เข้าใจ

---

## 11. คำนวณ Layout

- [ ] กดปุ่ม "คำนวณ Layout" → แสดงผล Layout
- [ ] จำนวนดวง (ups) ถูกต้อง
- [ ] Waste % สมเหตุสมผล
- [ ] Paper usage ถูกต้อง
- [ ] ถ้าขนาดเกิน Offset → auto-switch เครื่อง

---

## 12. คำนวณราคา

- [ ] หลังคำนวณ Layout → แสดงราคาทั้งหมด
- [ ] Paper Cost ถูกต้อง
- [ ] Plate Cost ถูกต้อง
- [ ] Print Cost ถูกต้อง
- [ ] Coating / Foil / Emboss cost ถูกต้อง
- [ ] Packing cost ถูกต้อง
- [ ] Total Price ถูกต้อง

---

## 13. UI ทั่วไป

- [ ] Dark Mode / Light Mode สลับได้
- [ ] Responsive (ย่อจอแล้วไม่เพี้ยน)
- [ ] Chat panel เปิด/ปิดได้
- [ ] หน้า RFQ List โหลดได้
- [ ] หน้า Tools โหลดได้

---

## วิธีทดสอบ
1. เปิด http://localhost:3080
2. กด "สร้าง RFQ"
3. วาง spec ในช่อง chat แล้วทดสอบตาม checklist
4. ติ๊กช่องที่ผ่าน [ ] → [x]
5. จดปัญหาที่เจอแจ้ง AI แก้ไข
