# งานถัดไป: ปรับ Component Template Section

## ปัจจุบัน
- AI เลือก template ให้อัตโนมัติ (เช่น Type 5 กล่องฝาครอบ)
- แสดง mm/inch/fold/open size ทันที

## ใหม่
1. **Default = ไม่เลือก template** — dropdown เป็นว่าง ไม่มีภาพกล่อง ไม่มีช่อง mm
2. **AI เก็บค่าที่ parse ได้ไว้เบื้องหลัง** — ขนาด, template ที่แนะนำ, mm/inch
3. **แสดง Pornchai AI SVG + animation** บนตำแหน่ง template section
   - "ผมมีข้อมูลขนาดพร้อมแล้วนะครับ!"
   - แสดงค่า เช่น 384 x 252 x 0 mm
   - แนะนำ template เช่น Type 5 กล่องฝาครอบ
   - "เลือก template แล้วผมจะกรอกให้เลยครับ"
4. **พอผู้ใช้เลือก template** → AI ดึงค่าลงฟอร์มให้ครบ → SVG หายไป
5. **ยังเก็บข้อมูลเพื่อเรียนรู้เหมือนเดิม**

## สิ่งที่ต้องทำ
- [ ] แก้ applyAgentData() ไม่ตั้ง box_type อัตโนมัติ → เก็บไว้ใน _pendingSize
- [ ] แก้ renderForm() แสดง Pornchai SVG + ข้อมูลขนาดเมื่อมี _pendingSize
- [ ] แก้ setCompBoxType() ดึง _pendingSize ลงฟอร์มเมื่อเลือก template
- [ ] SVG animation ให้ดูมีชีวิต
- [ ] กรอกครบ → SVG หายไป

---

# งานถัดไป: Attach File Preview

## ปัจจุบัน
- อัปโหลดไฟล์แนบได้ แต่ดูไฟล์ที่อัปโหลดไม่ได้

## ใหม่
1. **หลังอัปโหลดแสดงชื่อไฟล์ + ปุ่มดู** — icon ตา หรือ preview
2. **กดดู → Modal popup กลางจอ** — แสดง preview เอกสาร
   - รูปภาพ (jpg/png) → แสดงรูปเต็ม
   - PDF → embed PDF viewer
   - Excel/Word → แสดงชื่อไฟล์ + ปุ่มดาวน์โหลด
3. **ปิด Modal** — กด X หรือกดนอก Modal

## สิ่งที่ต้องทำ
- [ ] สร้าง Modal component สำหรับ preview (overlay กลางจอ)
- [ ] เพิ่มปุ่ม preview ข้างชื่อไฟล์ที่อัปโหลดแล้ว
- [ ] รองรับ preview รูปภาพ (jpg/png/gif)
- [ ] รองรับ preview PDF (embed)
- [ ] ไฟล์อื่นๆ แสดงชื่อ + ปุ่มดาวน์โหลด

---

# งานถัดไป: Foil Stamp Auto Select แก้ไข

## ปัจจุบัน
- ผู้ใช้กรอกสี Foil มาแล้ว (เช่น "เงินเงา") แต่ระบบเลือกผิดหรือไม่เลือกเลย
- dropdown สียังค้างที่ -select-
- ไม่รองรับการสั่งเปลี่ยนสี Foil ผ่านแชท AI

## ใหม่
1. **แก้ auto select สี Foil จาก spec** — กรอกมาว่าสีอะไร ต้องเลือกให้ตรงทันที
2. **รองรับ keyword TH/EN** — เงิน/silver/เงินเงา/เงินด้าน/ทอง/gold/ทองกลาง ฯลฯ
3. **รองรับจากแชท AI** — ผู้ใช้พิมพ์ "เปลี่ยน foil เป็นสีทอง" → เลือกให้ real-time
4. **เลือกสีแล้ว → foil code + ราคา ดึงจาก master data อัตโนมัติ**

## สิ่งที่ต้องทำ
- [ ] ตรวจสอบ matchFoilColor() ว่าจับคู่ผิดตรงไหน
- [ ] เพิ่ม alias mapping สี Foil (TH↔EN) ให้ครบทุกสีใน master data
- [ ] แก้ applyAgentData() ให้ auto select สี + code ถูกต้อง
- [ ] เพิ่มคำสั่ง Foil ใน handleFormModifyCommand() สำหรับแชท AI
- [ ] ทดสอบกับ master data จริง
