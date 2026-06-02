function createActionPlan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ===========================
  // Sheet 1: Action Plan (Phase 1)
  // ===========================
  let sheet = ss.getSheetByName('Action Plan');
  if (!sheet) sheet = ss.insertSheet('Action Plan');
  sheet.clear();
  const existingRules1 = sheet.getConditionalFormatRules();
  sheet.setConditionalFormatRules([]);

  const headers = ['#', 'Phase', 'หมวด', 'งาน', 'สถานะ', 'ผู้รับผิดชอบ', 'วันเริ่ม', 'วันเสร็จ', 'หมายเหตุ'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#5b2d8e').setFontColor('#fff').setFontWeight('bold').setFontSize(11);

  const data = [
    // Day 1 (16/03/2026) — เริ่มโปรเจกต์
    [1, 'Phase 1', 'Setup', 'อ่านโค้ดทั้งโปรเจกต์ + วางแผน', '✅ เสร็จ', 'Thanarat.Ch', '16/03/2026', '16/03/2026', 'อ่าน 4 ไฟล์หลัก + ระบบเก่า'],

    // Day 2 (17/03/2026) — Parser + Form + Calc พื้นฐาน
    [2, 'Phase 1', 'Parser', 'Structured Parser (TITLE/SIZE/PAPER)', '✅ เสร็จ', 'Thanarat.Ch', '17/03/2026', '17/03/2026', 'จับ structured format ครบ'],
    [3, 'Phase 1', 'Parser', 'Thai Free-text Parser', '✅ เสร็จ', 'Thanarat.Ch', '17/03/2026', '17/03/2026', 'กล่องครีม อาร์ต 190 แกรม 4 สี'],
    [4, 'Phase 1', 'Form', 'applyAgentData ครบทุก field', '✅ เสร็จ', 'Thanarat.Ch', '17/03/2026', '17/03/2026', '14 sections'],
    [5, 'Phase 1', 'Calc', 'Layout Calculation', '✅ เสร็จ', 'Thanarat.Ch', '17/03/2026', '17/03/2026', '12 box templates'],
    [6, 'Phase 1', 'Calc', 'Price Calculation', '✅ เสร็จ', 'Thanarat.Ch', '17/03/2026', '17/03/2026', 'Paper+Plate+Print+Process'],
    [7, 'Phase 1', 'UI', 'Fill Flow (ถามข้อมูลที่ขาด)', '✅ เสร็จ', 'Thanarat.Ch', '17/03/2026', '17/03/2026', 'ถามทีละข้อ + ปุ่ม suggestion'],

    // Day 3 (18/03/2026) — RAG + Rules + UI Redesign
    [8, 'Phase 1', 'Knowledge', 'RAG System (upload Excel/PDF)', '✅ เสร็จ', 'Thanarat.Ch', '18/03/2026', '18/03/2026', '3 files, 1,137 chunks'],
    [9, 'Phase 1', 'Knowledge', 'Knowledge Store (685 records)', '✅ เสร็จ', 'Thanarat.Ch', '18/03/2026', '18/03/2026', 'Import จากระบบเก่า'],
    [10, 'Phase 1', 'Rules', 'Business Rules Engine (10+ rules)', '✅ เสร็จ', 'Thanarat.Ch', '18/03/2026', '18/03/2026', 'Auto-fill ตามกฎโรงพิมพ์'],
    [11, 'Phase 1', 'UI', 'Header Navigation (ไม่มี sidebar)', '✅ เสร็จ', 'Thanarat.Ch', '18/03/2026', '18/03/2026', 'Full-width layout'],
    [12, 'Phase 1', 'Form', 'Paper auto-fill + fallback', '✅ เสร็จ', 'Thanarat.Ch', '18/03/2026', '18/03/2026', 'DB → RAG → auto-switch code'],
    [13, 'Phase 1', 'Form', 'Packing auto-detect', '✅ เสร็จ', 'Thanarat.Ch', '18/03/2026', '18/03/2026', 'kraftwrap/paperband/carton/pallet'],
    [14, 'Phase 1', 'Calc', 'Kraftwrap qty_per_pack', '✅ เสร็จ', 'Thanarat.Ch', '18/03/2026', '18/03/2026', '250 pcs/pack จาก spec'],
    [15, 'Phase 1', 'Calc', 'Qty Price Comparison Tool', '✅ เสร็จ', 'Thanarat.Ch', '18/03/2026', '18/03/2026', 'เปรียบเทียบราคาตามจำนวน'],
    [16, 'Phase 1', 'Parser', 'Non-spec detection', '✅ เสร็จ', 'Thanarat.Ch', '18/03/2026', '18/03/2026', 'ข้อความทั่วไป → ปฏิเสธ'],
    [17, 'Phase 1', 'Form', 'Component template change (save/restore)', '✅ เสร็จ', 'Thanarat.Ch', '18/03/2026', '18/03/2026', 'เปลี่ยน template จำค่าเดิม'],
    [18, 'Phase 1', 'Knowledge', 'Test Suite (5 cases)', '✅ เสร็จ', 'Thanarat.Ch', '18/03/2026', '18/03/2026', 'node test-suite.js'],

    // Day 4 (19/03/2026) — Multi-component + Bug fixes
    [19, 'Phase 1', 'Parser', 'Multi-component Parser', '✅ เสร็จ', 'Thanarat.Ch', '19/03/2026', '19/03/2026', 'Tray + Cover แยก component'],
    [20, 'Phase 1', 'Parser', 'F-code Detection (1TT/2TT)', '✅ เสร็จ', 'Thanarat.Ch', '19/03/2026', '19/03/2026', '(2TT)→TTSLB, (1TT)→TTAB'],
    [21, 'Phase 1', 'Parser', 'UV ink vs UV coating', '✅ เสร็จ', 'Thanarat.Ch', '19/03/2026', '19/03/2026', 'coating gloss UV ≠ UV ink'],
    [22, 'Phase 1', 'Parser', 'Qty exclude packing', '✅ เสร็จ', 'Thanarat.Ch', '19/03/2026', '19/03/2026', '125 pcs/pack ≠ qty'],
    [23, 'Phase 1', 'Rules', 'Pattern Match Engine', '✅ เสร็จ', 'Thanarat.Ch', '19/03/2026', '19/03/2026', 'หา 685 งานเก่าคล้าย → แนะนำ'],
    [24, 'Phase 1', 'Form', 'Box Template 12 แบบ', '✅ เสร็จ', 'Thanarat.Ch', '19/03/2026', '19/03/2026', 'keyword mapping TH+EN ครบ'],
    [25, 'Phase 1', 'Form', 'dust_flap default fix', '✅ เสร็จ', 'Thanarat.Ch', '19/03/2026', '19/03/2026', 'Type 5,6 = 25mm'],
    [26, 'Phase 1', 'Form', 'mm2inch legacy conversion', '✅ เสร็จ', 'Thanarat.Ch', '19/03/2026', '19/03/2026', 'ceil rounding เหมือนระบบเดิม'],
    [27, 'Phase 1', 'Calc', 'Other Process Cost (handwork/outsource)', '✅ เสร็จ', 'Thanarat.Ch', '19/03/2026', '19/03/2026', 'คิดราคาจากฟอร์ม'],
    [28, 'Phase 1', 'UI', 'AI Brain Visualization', '✅ เสร็จ', 'Thanarat.Ch', '19/03/2026', '19/03/2026', '3D Knowledge Graph'],
    [29, 'Phase 1', 'UI', 'Multiple Coating display', '✅ เสร็จ', 'Thanarat.Ch', '19/03/2026', '19/03/2026', 'แสดงหลาย coating per component'],
    [30, 'Phase 1', 'Knowledge', 'Self-learning (save corrections)', '✅ เสร็จ', 'Thanarat.Ch', '19/03/2026', '19/03/2026', 'Save RFQ → Knowledge Store'],

    // Day 5 (20/03/2026) — F-codes + Coating alias + Polish
    [31, 'Phase 1', 'Parser', 'Multi-edition F-codes', '✅ เสร็จ', 'Thanarat.Ch', '20/03/2026', '20/03/2026', 'สีฟ้า 319 = F-code name'],
    [32, 'Phase 1', 'Parser', 'W/L/H Format', '✅ เสร็จ', 'Thanarat.Ch', '20/03/2026', '20/03/2026', 'W 212 / L 271 / H 30'],
    [33, 'Phase 1', 'Form', 'Coating alias (PVC→OPP, เว้นลิ้น→WTB-HR)', '✅ เสร็จ', 'Thanarat.Ch', '20/03/2026', '20/03/2026', '8 alias mappings'],
    [34, 'Phase 1', 'Form', 'Multi-F qty per F-code', '✅ เสร็จ', 'Thanarat.Ch', '20/03/2026', '20/03/2026', 'AI ถามทีละ F → Total auto'],
    [35, 'Phase 1', 'UI', 'Input scroll fix', '✅ เสร็จ', 'Thanarat.Ch', '20/03/2026', '20/03/2026', 'พิมพ์แล้วไม่กระโดดขึ้นบน'],
    [36, 'Phase 1', 'UI', 'Warning Banner real-time', '✅ เสร็จ', 'Thanarat.Ch', '20/03/2026', '20/03/2026', 'หายเมื่อกรอกครบ'],

    // ยังต้องทำ
    [37, 'Phase 1', 'Calc', 'Layout canvas Component 2+', '🔄 กำลังทำ', 'Thanarat.Ch', '20/03/2026', '', 'ภาพ layout แสดงแค่ Component 1'],
    [38, 'Phase 1', 'Form', 'Save RFQ ลง DB ระบบเก่า', '⏳ รอ', 'Thanarat.Ch', '', '', 'ทดสอบ save_rfq API'],
    [39, 'Phase 1', 'Form', 'Coating เว้นลิ้น verify on browser', '🔄 กำลังทำ', 'Thanarat.Ch', '20/03/2026', '', 'Alias ทำงานใน regex แล้ว'],
    [40, 'Phase 1', 'Knowledge', 'Test Suite เพิ่ม case', '⏳ รอ', 'Thanarat.Ch', '', '', 'เพิ่มจาก use case ทดสอบ'],
    [41, 'Phase 1', 'Form', 'Packing per F-code', '⏳ รอ', '', '', '', 'แยก packing ตาม F'],
  ];

  sheet.getRange(2, 1, data.length, headers.length).setValues(data);

  // === Column widths ===
  sheet.setColumnWidth(1, 40);   // #
  sheet.setColumnWidth(2, 80);   // Phase
  sheet.setColumnWidth(3, 90);   // หมวด
  sheet.setColumnWidth(4, 350);  // งาน
  sheet.setColumnWidth(5, 100);  // สถานะ
  sheet.setColumnWidth(6, 100);  // ผู้รับผิดชอบ
  sheet.setColumnWidth(7, 100);  // วันเริ่ม
  sheet.setColumnWidth(8, 100);  // วันเสร็จ
  sheet.setColumnWidth(9, 300);  // หมายเหตุ

  sheet.setFrozenRows(1);

  // Conditional formatting — status colors
  const statusRange = sheet.getRange(2, 5, data.length, 1);
  const rules = [];
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('✅').setBackground('#d4edda').setFontColor('#155724').setRanges([statusRange]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('🔄').setBackground('#fff3cd').setFontColor('#856404').setRanges([statusRange]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('⏳').setBackground('#e2e3e5').setFontColor('#383d41').setRanges([statusRange]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('❌').setBackground('#f8d7da').setFontColor('#721c24').setRanges([statusRange]).build());
  sheet.setConditionalFormatRules(rules);

  // Border
  sheet.getRange(1, 1, data.length + 1, headers.length).setBorder(true, true, true, true, true, true);

  // === สรุปรวม + เป้าหมาย (ฝั่งขวาต่อจากหมายเหตุ) ===
  const sCol = 11; // col K (ต่อจาก I=หมายเหตุ, เว้น J)
  const vCol = 12; // col L (ค่า)
  const lastDataRow = data.length + 1;

  // Column widths สำหรับสรุป
  sheet.setColumnWidth(10, 20);  // J = เว้นช่องว่าง
  sheet.setColumnWidth(sCol, 250); // K = label
  sheet.setColumnWidth(vCol, 150); // L = value

  // Header สรุป — merge K-L row 1
  sheet.getRange(1, sCol, 1, 2).merge();
  sheet.getRange(1, sCol).setValue('📊 สรุปภาพรวม')
    .setBackground('#5b2d8e').setFontColor('#fff').setFontWeight('bold').setFontSize(11);

  // === ตารางสรุป row 2-7 (ทุกอย่าง real-time ด้วยสูตร) ===
  const R = lastDataRow;
  const summaryLabels = [
    ['รายการ', 'ข้อมูล'],
    ['วันเริ่มโปรเจกต์', '16/03/2026'],
    ['วันที่ทำล่าสุด', ''],
    ['รวมจำนวนวันที่ทำ', ''],
    ['งานเสร็จแล้ว', ''],
    ['งานกำลังทำ', ''],
    ['งานรอ', ''],
  ];
  sheet.getRange(2, sCol, summaryLabels.length, 2).setValues(summaryLabels);

  // Header row style
  sheet.getRange(2, sCol, 1, 2).setFontWeight('bold').setBackground('#5b2d8e').setFontColor('#fff');
  // Label bold
  sheet.getRange(3, sCol, 5, 1).setFontWeight('bold');

  // สูตร real-time ทั้งหมด — แก้ตาราง → อัพเดททันที
  // วันที่ทำล่าสุด = หาวันที่ล่าสุดจาก col G ที่ไม่ว่าง (sort text desc)
  sheet.getRange(4, vCol).setFormula(`=INDEX(SORT(FILTER(G2:G${R},G2:G${R}<>""),1,FALSE),1)`);
  // รวมจำนวนวัน = นับวันที่ไม่ซ้ำ (UNIQUE + COUNTA)
  sheet.getRange(5, vCol).setFormula(`=COUNTA(UNIQUE(FILTER(G2:G${R},G2:G${R}<>"")))&" วัน"`);
  // งานเสร็จ (นับจากคำ "เสร็จ")
  sheet.getRange(6, vCol).setFormula(`=COUNTIF(E2:E${R},"*เสร็จ*")&" งาน"`);
  // งานกำลังทำ (นับจากคำ "กำลังทำ")
  sheet.getRange(7, vCol).setFormula(`=COUNTIF(E2:E${R},"*กำลังทำ*")&" งาน"`);
  // งานรอ (นับจากคำ "รอ")
  sheet.getRange(8, vCol).setFormula(`=COUNTIF(E2:E${R},"*รอ*")&" งาน"`);

  // Border สรุป
  sheet.getRange(2, sCol, 7, 2).setBorder(true, true, true, true, true, true);

  // === ตารางเป้าหมาย row 10-13 ===
  const targetData = [
    ['เป้าหมาย', 'กำหนดเสร็จ'],
    ['Phase 1 — Classic Mode สมบูรณ์', '31/03/2026'],
    ['Phase 2 — AI-Guided RFQ Mode', 'Q2/2026'],
    ['Phase 3 — Global Platform', 'Q4/2026'],
  ];
  sheet.getRange(10, sCol, targetData.length, 2).setValues(targetData);

  // Header style
  sheet.getRange(10, sCol, 1, 2).setFontWeight('bold').setBackground('#5b2d8e').setFontColor('#fff');
  // Label bold
  sheet.getRange(11, sCol, 3, 1).setFontWeight('bold');

  // Border เป้าหมาย
  sheet.getRange(10, sCol, 4, 2).setBorder(true, true, true, true, true, true);

  // Auto filter (remove existing first)
  const existingFilter = sheet.getFilter();
  if (existingFilter) existingFilter.remove();
  sheet.getRange(1, 1, data.length + 1, headers.length).createFilter();

  // ===========================
  // Sheet 2: Phase 2-3 (แยก)
  // ===========================
  let sheet2 = ss.getSheetByName('Phase 2-3');
  if (!sheet2) sheet2 = ss.insertSheet('Phase 2-3');
  sheet2.clear();
  sheet2.setConditionalFormatRules([]);

  const headers2 = ['#', 'Phase', 'หมวด', 'งาน', 'สถานะ', 'ผู้รับผิดชอบ', 'เป้าหมายเสร็จ', 'หมายเหตุ'];
  sheet2.getRange(1, 1, 1, headers2.length).setValues([headers2])
    .setBackground('#1a73e8').setFontColor('#fff').setFontWeight('bold').setFontSize(11);

  const data2 = [
    // Phase 2: AI-Guided RFQ Mode
    [1, 'Phase 2', 'AI', 'Smart Conversation Flow', '⏳ รอ', 'GPT 5.4', 'Q2/2026', 'AI คุยกับ user สร้าง RFQ'],
    [2, 'Phase 2', 'AI', 'Understanding Card', '⏳ รอ', 'GPT 5.4', 'Q2/2026', 'แสดง summary ข้อมูลที่จับได้'],
    [3, 'Phase 2', 'AI', 'Step-by-step Wizard', '⏳ รอ', 'GPT 5.4', 'Q2/2026', 'ถามทีละขั้น'],
    [4, 'Phase 2', 'AI', 'Live Price Preview', '⏳ รอ', 'GPT 5.4', 'Q2/2026', 'แสดงราคาระหว่างคุย'],

    // Phase 3: Global Platform
    [5, 'Phase 3', 'Infra', 'PostgreSQL + pgvector', '⏳ รอ', '', 'Q4/2026', 'เมื่อ > 10,000 records'],
    [6, 'Phase 3', 'AI', 'Vector Embedding + Semantic Search', '⏳ รอ', '', 'Q4/2026', 'Deep Learning'],
    [7, 'Phase 3', 'Global', 'Multi-language (EN/TH/JP/CN)', '⏳ รอ', '', 'Q4/2026', 'รองรับหลายภาษา'],
    [8, 'Phase 3', 'Global', 'Multi-tenant + Open API', '⏳ รอ', '', 'Q4/2026', 'SaaS model'],
  ];

  sheet2.getRange(2, 1, data2.length, headers2.length).setValues(data2);

  // Column widths
  sheet2.setColumnWidth(1, 40);
  sheet2.setColumnWidth(2, 80);
  sheet2.setColumnWidth(3, 90);
  sheet2.setColumnWidth(4, 350);
  sheet2.setColumnWidth(5, 100);
  sheet2.setColumnWidth(6, 100);
  sheet2.setColumnWidth(7, 120);
  sheet2.setColumnWidth(8, 350);

  sheet2.setFrozenRows(1);

  // Conditional formatting
  const statusRange2 = sheet2.getRange(2, 5, data2.length, 1);
  const rules2 = [];
  rules2.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('✅').setBackground('#d4edda').setFontColor('#155724').setRanges([statusRange2]).build());
  rules2.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('🔄').setBackground('#fff3cd').setFontColor('#856404').setRanges([statusRange2]).build());
  rules2.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('⏳').setBackground('#e2e3e5').setFontColor('#383d41').setRanges([statusRange2]).build());
  sheet2.setConditionalFormatRules(rules2);

  // Border
  sheet2.getRange(1, 1, data2.length + 1, headers2.length).setBorder(true, true, true, true, true, true);

  // Filter
  const existingFilter2 = sheet2.getFilter();
  if (existingFilter2) existingFilter2.remove();
  sheet2.getRange(1, 1, data2.length + 1, headers2.length).createFilter();

  SpreadsheetApp.getUi().alert('สร้าง Action Plan เรียบร้อย! ✅\n• Action Plan — Phase 1 (41 งาน)\n• Phase 2-3 — แยก Sheet (8 งาน)');
}
