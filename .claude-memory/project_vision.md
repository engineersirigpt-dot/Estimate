---
name: Project Vision - Pornchai AI RFQ Agent
description: Grand vision to build world's #1 RFQ-Estimate system for printing industry, starting from legacy system understanding then creating simpler, global-ready platform
type: project
---

## Vision
สร้าง Pornchai AI RFQ Agent ให้เป็น RFQ-Estimate System อันดับ 1 ของโลก สายงานโรงพิมพ์

## Roadmap
1. **Phase 1: เข้าใจระบบเก่าทั้งหมด** — ศึกษา Sirivatana Interprint Estimate System (192.168.5.3:3040) ให้ครบทุกฟีเจอร์ ทุกสูตรคำนวณ
2. **Phase 2: สร้างวิธีคิดใหม่** — ออกแบบ calculation engine ที่ง่ายกว่าเดิม ไม่ซับซ้อน แต่ตอบโจทย์
3. **Phase 3: Global Platform** — เปิดให้ผู้ใช้งานทั่วโลกใช้งานได้ ง่ายและมีประสิทธิภาพ

## Core Principles
- ง่ายกว่าเดิม ไม่ซับซ้อน
- ตอบโจทย์วงการโรงพิมพ์จริง
- AI-first approach (Pornchai AI เป็นตัวหลัก)
- Modern design ทันสมัย
- Global-ready (multi-language, multi-currency ready)

## Current State (2026-03-13)
- Express.js webapp on port 3080
- Proxying to legacy Estimate API (192.168.5.3:3010)
- CalcEngine (calc.js) with 12 box templates, layout calculation, paper usage, waste, machine selection
- AI Agent chat with spec parsing (OpenClaw/built-in parser)
- Interactive fill flow for missing fields
- Dark/Light mode support
