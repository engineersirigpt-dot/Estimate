---
name: Parse All Data First
description: Core principle - AI must extract ALL customer data completely before any calculation. Customer details come first, form supplements come second, calculation is last.
type: feedback
---

## หลักการ: ดึงข้อมูลครบก่อน → ค่อยคำนวณ

ลำดับความสำคัญ:
1. **ดึงข้อมูลจากลูกค้าให้ครบ 100%** — ทุกอย่างที่ลูกค้าระบุมาต้องจับได้หมด ห้ามตกหล่น
2. **ถามเสริมเฉพาะที่ขาด** — ตามฟอร์มที่กำหนดไว้
3. **คำนวณ** — เป็นขั้นสุดท้าย เมื่อข้อมูลพร้อมแล้ว

เพราะ spec ที่ลูกค้าให้มาคือ "รายละเอียดที่ลูกค้าต้องการ" — ถ้าจับไม่ครบ = เข้าใจลูกค้าผิด = ทุกอย่างที่ตามมาก็ผิดหมด

Parser ต้อง:
- จับทุก key-value pair แม้ไม่รู้จัก field → เก็บไว้แสดงให้ผู้ใช้เห็น
- ไม่ทิ้งข้อมูลใดๆ ที่ลูกค้าระบุมา
- แสดง understanding card ที่สะท้อนข้อมูลจริงทั้งหมด
