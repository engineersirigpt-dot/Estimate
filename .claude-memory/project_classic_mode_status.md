---
name: Classic Mode Near Completion
description: Phase 1 Classic Mode status - nearly complete, ready for testing against legacy system
type: project
---

Classic Mode is near completion as of 2026-04-01.

**Completed features:**
- AI Chat Parser (spec → auto-fill form, Foil/Emboss/Coating catch)
- Full RFQ Form (12 Box Templates, corrugated, coating, foil, packing, delivery)
- CalcEngine (Open Size, Layout, Paper, Plate, Print, After Press, Corrugated, Packing)
- Layout Calculation (auto layout, grain/flute direction, corrugated board 0.375" tolerance, PNG export)
- Price Calculation (all line items, coating details, markup slider 0-100%, editable tax %, kraftwrap price editable)
- Qty Comparison Cards (16 max, real-time, add/remove)
- Exchange Rate (THB/USD/EUR/JPY/CNY/GBP, live API)
- 3D Preview (holographic, flute texture on all component types)
- Summary PDF (HTML print, Thai+English, logo, remark)
- Machine specs (all machines from Excel, default LS540→L640C→G844)
- Master Data (22 local JSON files as offline fallback)

**Remaining for Phase 1:**
- Compare pricing with legacy system (when back at office network)
- Save RFQ to database (requires Estimate API 192.168.5.3:3010)
- Multi-component (multiple F codes) full testing
- RFQ List CRUD operations

**Why:** Phase 1 goal is 100% match with legacy system before building Phase 2 global platform.
**How to apply:** When user asks about project status or next steps, reference this milestone.
