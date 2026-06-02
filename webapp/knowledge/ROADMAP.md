# Knowledge Store — Roadmap

## สถานะปัจจุบัน: Phase 1 (JSON Prototype) ✅

### สิ่งที่ทำเสร็จแล้ว
- [x] Knowledge Store API (save, search, stats)
- [x] Auto-save เมื่อ user กด Save RFQ
- [x] Feedback Loop — จับ corrections (AI ผิดตรงไหน)
- [x] Smart Context Builder — ค้นหา spec คล้ายๆ ใส่เป็น context ให้ LLM
- [x] Knowledge-enhanced detectBoxTemplate — ใช้ข้อมูลอดีตเลือก box type
- [x] Import 343 RFQ จากระบบเก่า (Sirivatana Interprint)
- [x] import-knowledge.js — script ดึง RFQ ที่ Approve มาเก็บ

### Storage: JSON file
- ไฟล์: `knowledge/specs.json`
- ขนาดปัจจุบัน: ~343 records
- ข้อดี: ไม่ต้องติดตั้งอะไรเพิ่ม, debug ง่าย
- ข้อจำกัด: ช้าเมื่อข้อมูลเยอะ, ไม่ safe สำหรับ concurrent writes

---

## Phase 2: SQLite (เมื่อ > 1,000 records)

### ทำไมต้องย้าย
- JSON อ่านทั้งไฟล์ทุกครั้ง → ช้าเมื่อข้อมูลเยอะ
- หลาย user เขียนพร้อมกัน → data corrupt ได้

### สิ่งที่ต้องทำ
- [ ] สร้าง SQLite database (`knowledge/knowledge.db`)
- [ ] Table: `specs` (id, date, job_id, spec_text, final_json, corrections_json)
- [ ] Table: `components` (id, spec_id, component_name, box_type_id, paper_code, paper_gram, color_out, color_in, ...)
- [ ] Index: job_name, paper_code, box_type_id
- [ ] FTS5 full-text search สำหรับ spec_text + job_name
- [ ] Migration script: JSON → SQLite
- [ ] เปลี่ยน loadKnowledge/saveKnowledge ใน server.js ให้ใช้ SQLite
- [ ] API layer เดิมไม่ต้องเปลี่ยน (เปลี่ยนแค่ storage)

### เทคโนโลยี
- `better-sqlite3` (npm) — synchronous, เร็ว, ไม่ต้อง setup server
- รองรับ 1-10 users, < 100,000 records

---

## Phase 3: PostgreSQL + pgvector + Deep Learning (เมื่อ > 10,000 records หรือ multi-user)

### ทำไมต้องย้าย
- SQLite ไม่รองรับ concurrent writes หลาย user
- ต้องการ vector similarity search (ค้นหา spec ที่ "ความหมายคล้าย" ไม่ใช่แค่ keyword ตรง)
- Keyword/Regex จับไม่ครบทุกรูปแบบ → ต้องใช้ AI เข้าใจความหมาย

### สิ่งที่ต้องทำ
- [ ] Setup PostgreSQL server
- [ ] Install pgvector extension
- [ ] สร้าง embedding สำหรับ spec_text (ใช้ OpenAI embeddings หรือ local model)
- [ ] เปลี่ยน search จาก keyword match → vector similarity search
- [ ] Connection pooling สำหรับ multi-user

### Deep Learning — Semantic Understanding
ปัญหาของ Keyword/Regex:
```
"กล่องหูหิ้ว"  → regex จับ "หูหิ้ว" → Type 8 ✅
"กล่องมีหูจับ"  → regex ไม่มีคำนี้ → ❌ ไม่รู้จัก
"box with handle" → regex ไม่มี → ❌
```

Vector Embedding แก้ปัญหานี้:
```
"กล่องมีหูจับ" → embedding → คล้ายกับ "กล่องหูหิ้ว" 0.92 → Type 8 ✅
"box with handle" → embedding → คล้ายกับ "Gable Top" 0.88 → Type 8 ✅
```

สิ่งที่ต้องทำเพิ่ม:
- [ ] สร้าง embedding สำหรับ box template descriptions (12 แบบ)
- [ ] สร้าง embedding สำหรับ paper type descriptions
- [ ] Classification model: spec text → component type (trained จาก Knowledge Store)
- [ ] Fine-tune model ด้วยข้อมูล RFQ จริงจาก Sirivatana (685+ records)

### ประโยชน์
- "กล่องครีม" จะค้นเจอ "cosmetic box" ด้วย (semantic search)
- AI เข้าใจคำใหม่ที่ไม่เคยเจอ โดยเทียบกับความหมายที่คล้ายกัน
- รองรับผู้ใช้หลายคนพร้อมกัน
- Query เร็วแม้ข้อมูลเป็นแสน record

---

## Phase 4: Vector DB + Full RAG + AI Agent (Global Platform)

### ทำไมต้องย้าย
- ต้องการ AI ที่ฉลาดระดับ production สำหรับผู้ใช้ทั่วโลก
- ต้องรองรับ multi-language (EN/TH/JP/CN/KR)
- ต้องการให้ AI เรียนรู้และปรับตัวได้เองจากข้อมูลใหม่

### สิ่งที่ต้องทำ
- [ ] เลือก Vector DB: Pinecone / Weaviate / Qdrant / ChromaDB
- [ ] Embedding pipeline: spec text → vector (auto เมื่อ save)
- [ ] RAG pipeline: query → retrieve similar → augment LLM prompt → generate
- [ ] Multi-tenant: แต่ละบริษัทมี Knowledge Store แยกกัน
- [ ] Analytics dashboard: AI accuracy, correction rate, popular patterns

### AI Self-Learning Pipeline
```
1. AE ส่ง spec → AI parse → กรอกฟอร์ม
2. User แก้ไขตรงที่ผิด → Save
3. ระบบบันทึก corrections → Fine-tune dataset
4. Auto re-train model ทุกสัปดาห์/เดือน
5. AI รุ่นใหม่แม่นยำขึ้น → ผิดน้อยลงเรื่อยๆ
```

### Multi-Language AI
- [ ] Translation layer: spec ภาษาอะไรก็ได้ → แปลเป็น structured data
- [ ] Language-agnostic embedding: ค้นหาข้ามภาษาได้ (TH → EN → JP)
- [ ] Localized Business Rules: กฎโรงพิมพ์แต่ละประเทศอาจต่างกัน

### สถาปัตยกรรม
```
User spec (any language)
    ↓
Embedding Model → Vector Search (top-K similar from all tenants)
    ↓
LLM + Context (similar specs + master data + domain rules + corrections history)
    ↓
Parsed Result (high accuracy, self-improving)
    ↓
User correction → feedback → re-train cycle
```

---

## หลักการสำคัญ

1. **API layer ไม่เปลี่ยน** — เปลี่ยนแค่ storage ข้างหลัง client ไม่ต้องแก้
2. **ยิ่งใช้ยิ่งเก่ง** — ทุก Save RFQ = training data ใหม่
3. **เสียงส่วนใหญ่ชนะ** — ข้อมูลผิด 2-3 ครั้ง ไม่กระทบ AI ถ้ามีข้อมูลถูก 100+ ครั้ง
4. **Backward compatible** — ย้าย storage ได้ทุกเมื่อโดยไม่กระทบ feature

---

## วันที่อัพเดท
- 2026-03-17: Phase 1 เสร็จ (JSON + 343 records imported)
- 2026-03-18: Phase 1.5 — RAG system, Business Rules Engine (10 rules), 685 records, keyword mapping ครบ 12 templates
- 2026-03-19: อัพเดท ROADMAP Phase 3-4 — Deep Learning + Semantic Search + Self-Learning AI
