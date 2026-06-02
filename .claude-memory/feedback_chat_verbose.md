---
name: Chat AI Too Verbose
description: AI chat responses are too long, repetitive. Missing items listed twice. Buttons lead to same questions already shown.
type: feedback
---

AI chat after spec parsing is too verbose and repetitive. User finds it annoying.

**Problems:**
1. Missing items listed TWICE (once in summary, once as "ยังขาด" section)
2. Then buttons "กรอกแบบฟอร์มให้" and "ถามข้อมูลที่ขาด" lead to SAME questions already shown
3. Too much text — user doesn't want to read long messages

**Why:** User wants quick, actionable flow. Not walls of text repeating the same info.

**How to apply:**
- Show missing items ONCE only
- Combine "กรอกฟอร์ม + ถามข้อมูลที่ขาด" into ONE action — auto-fill what's available, then ask missing items immediately
- Keep chat responses SHORT and direct
