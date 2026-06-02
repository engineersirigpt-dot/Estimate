/**
 * Pornchai RFQ — Automated Test Suite
 * ทดสอบ Parser + Form Mapping + CalcEngine อัตโนมัติ
 *
 * Usage: node test-suite.js
 * หรือ: node test-suite.js --case 1   (รันเฉพาะ case)
 */

const API = 'http://localhost:3080';

// ============================================================
// CALC ENGINE LOADER (Node-side) — โหลด public/js/calc.js เข้า vm sandbox
// ใช้สำหรับ Layout + Price test cases (เรียก CalcEngine โดยตรงจาก Node)
// ============================================================
const path = require('path');
const fs = require('fs');
const vm = require('vm');

let _calcEngine = null;
async function getCalcEngine() {
  if (_calcEngine) return _calcEngine;

  const calcPath = path.join(__dirname, 'public', 'js', 'calc.js');
  const code = fs.readFileSync(calcPath, 'utf-8');

  // Shim window + fetch (point at live server) เพื่อให้ loadCalcMasters() ทำงานได้
  const sandbox = {
    window: {},
    console,
    fetch: (url, opts) => fetch(url.startsWith('http') ? url : API + url, opts),
    setTimeout, clearTimeout, setInterval, clearInterval,
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'calc.js' });

  const engine = sandbox.window.CalcEngine;
  if (!engine) throw new Error('CalcEngine ไม่ถูกโหลด');

  // โหลด master data จาก server (จำเป็นสำหรับ price/layout calc)
  try {
    await engine.loadCalcMasters();
  } catch (e) {
    console.warn('  ⚠️  loadCalcMasters warning:', e.message);
  }

  _calcEngine = engine;
  return engine;
}

// === Helper: build form ขั้นต่ำสำหรับ calcFullEstimate ===
function buildForm(opts = {}) {
  const c = opts.component || {};
  const comp = {
    component_name: c.component_name || 'Box',
    component_type: c.component_type || 1,
    packaging_size: c.packaging_size || { width: 80, length: 120, depth: 40, glue_flap: 15, tuck_flap: 15, dust_flap: 0 },
    box_type: c.box_type || { type_id: 1 },
    paper: c.paper || { paper_code: 'AC', paper_gram: 300 },
    color: c.color || { outside: 4, inside: 0 },
    addon: c.addon || [],
    special_ink: c.special_ink || [],
    corrugated: c.corrugated || null,
    packing_detail: c.packing_detail || '',
    ...c._extra,
  };
  return {
    print_type: opts.print_type || 'Offset',
    ink_type: opts.ink_type || 'conventional',
    is_reprinted: !!opts.is_reprinted,
    profit_sharing: !!opts.profit_sharing,
    limit_color: !!opts.limit_color,
    is_diecut: opts.is_diecut !== undefined ? opts.is_diecut : true,
    is_trim: !!opts.is_trim,
    is_inspection: opts.is_inspection !== undefined ? opts.is_inspection : true,
    qty: (opts.qty || [5000]).map(String),
    components: [comp, ...(opts.extraComponents || [])],
    delivery: opts.delivery || [],
    otherCost: [], priceDiff: [], customer_gift: [],
    process_info: {}, other_process: [], handwork_process: [], outsource: [], materials: [], other_items: [],
    has_multi_f: !!opts.has_multi_f,
    f_data: opts.f_data || [],
  };
}

// ============================================================
// TEST CASES — เพิ่มได้เรื่อยๆ
// ============================================================
const TEST_CASES = [

  // ============================================================
  // Cases จาก user ที่ส่งมาทดสอบจริง
  // ============================================================

  // === CASE 1: Structured — Rep.Inner box + F-codes + Kraftwrap ===
  {
    id: 1,
    name: 'Structured: Rep.Inner box ประกบลูกฟูก + F-codes + Kraftwrap 250',
    spec: `TITLE : Rep.Inner box Clover leaf Snacks 90g.NEW (2TT)  LD
SIZE (Inches) : 1.58" x 2.68" x 5.04"
SIZE (mm.) : 40 x 68 x 128
COMPONENT TYPE
   - BOX: ประกบลูกฟูก
PAPER
   - BOX: Duplex GBB 350 gsm
PRINT
   - F015731 : 7/0 Colors
   - F015732  : 7/0 Colors
OTHER
   - BOX: coating gloss UV เว้นลิ้น 1 s
PROCESS
PACKING
   - BOX: kraftwrap 250 pcs/pack`,
    expect: {
      job_name: /Rep\.Inner box Clover leaf/,
      components: [{
        component_name: /box/i,
        component_type: 2,
        paper_code: 'Dup GBB',
        paper_gram: '350',
        color_outside: '7',
        color_inside: '0',
        packaging_size: { width: '40', length: '68', depth: '128' },
      }],
      f_codes: ['F015731', 'F015732'],
      has_coating: true,
      coating_side: 1,
      packing_detail: /kraftwrap.*250/i,
    }
  },

  // === CASE 2: Thai — ประกบลูกฟูก + 5 editions + ก้นขัด ===
  {
    id: 2,
    name: 'Thai: กล่องออฟเซ็ท ประกบลูกฟูก + 5 editions + ก้นขัด',
    spec: `งานพิมพ์กล่องออฟเซ็ท ประกบกระดาษลูกฟูก
ทรงฝาเปิดบนก้นขัด
กล่อง  ขนาดขึ้นรูป  18x18x37 cm
กระดาษอาร์ต 190 แกรม พิมพ์ 4 สี เคลือบ PVC เงา
ประกบลูกฟูกลอน E สีน้ำตาล
ปั๊มไดคัท ปะกาวข้าง 2 ตำแหน่ง
มี 5 แบบ รายละเอียดเดียวกัน
สีฟ้า 319
สีชมพู 186
สีเขียว 313
สีเทา 244
สีน้ำตาล 188
จำนวนผลิตรวม 1250 กล่อง (บล็อคเดียวกันหมด)`,
    expect: {
      job_name: /กล่องออฟเซ็ท.*ประกบ/,
      print_type: 'Offset',
      components: [{
        component_type: 2,
        paper_code: /AC/,
        paper_gram: '190',
        color_outside: '4',
        color_inside: '0',
        packaging_size: { width: '180', length: '180', depth: '370' },
        box_type_id: '3',
      }],
      corrugated_flute: 'E',
      is_diecut: true,
      has_other_process: true,
      qty: ['1250'],
      edition_count: 5,
      remark: /บล็อค/,
    }
  },

  // === CASE 3: Thai — ประกบลูกฟูก + 5 editions (confirm) ===
  {
    id: 3,
    name: 'Thai: กล่องออฟเซ็ท ประกบลูกฟูก (confirm case 2)',
    spec: `งานพิมพ์กล่องออฟเซ็ท ประกบกระดาษลูกฟูก
ทรงฝาเปิดบนก้นขัด
กล่อง  ขนาดขึ้นรูป  18x18x37 cm
กระดาษอาร์ต 190 แกรม พิมพ์ 4 สี เคลือบ PVC เงา
ประกบลูกฟูกลอน E สีน้ำตาล
ปั๊มไดคัท ปะกาวข้าง 2 ตำแหน่ง
มี 5 แบบ รายละเอียดเดียวกัน
สีฟ้า 319
สีชมพู 186
สีเขียว 313
สีเทา 244
สีน้ำตาล 188
จำนวนผลิตรวม 1250 กล่อง (บล็อคเดียวกันหมด)`,
    expect: {
      print_type: 'Offset',
      components: [{
        component_type: 2,
        paper_code: /AC/,
        paper_gram: '190',
        color_outside: '4',
      }],
      corrugated_flute: 'E',
      is_diecut: true,
      qty: ['1250'],
      edition_count: 5,
    }
  },

  // === CASE 4: Structured — Sleeve box + Hi-rub WB + ค่าติดกาว ===
  {
    id: 4,
    name: 'Structured: Sleeve box + ประกบลูกฟูก + Hi-rub WB + ค่าติดกาว',
    spec: `TITLE : Sleeve box Rio Mare Linght Meat Tuna in Water
SIZE (Inches) : 1.5" x 3.39" x 3.39"
SIZE (mm.) : 38 x 86 x 86
COMPONENT TYPES
   - Sleeve: ประกบลูกฟูก
PAPER
   - Sleeve: Duplex GBB 400 gsm
PRINT
   - Sleeve : 6/0 Colors
OTHER
   - Sleeve: coating Gloss Hi-rub WB เว้นลิ้่น 1 s (เคลือบ)
PROCESSS
   - ค่าติดกาว
PACKING
   - Sleeve: kraftwrap 250 pcs/pack
qty 1000`,
    expect: {
      job_name: /Sleeve box Rio Mare/,
      components: [{
        component_name: /sleeve/i,
        component_type: 2,
        paper_code: 'Dup GBB',
        paper_gram: '400',
        color_outside: '6',
        color_inside: '0',
        packaging_size: { width: '38', length: '86', depth: '86' },
      }],
      has_coating: true,
      has_other_process: true,
      qty_includes: '1000',
      packing_detail: /kraftwrap.*250/i,
    }
  },

  // === CASE 5: Structured — Rep.Inner box (confirm) ===
  {
    id: 5,
    name: 'Structured: Rep.Inner box (confirm case 1)',
    spec: `TITLE : Rep.Inner box Clover leaf Snacks 90g.NEW (2TT)  LD
SIZE (Inches) : 1.58" x 2.68" x 5.04"
SIZE (mm.) : 40 x 68 x 128
COMPONENT TYPE
   - BOX: ประกบลูกฟูก
PAPER
   - BOX: Duplex GBB 350 gsm
PRINT
   - F015731 : 7/0 Colors
   - F015732  : 7/0 Colors
OTHER
   - BOX: coating gloss UV เว้นลิ้น 1 s
PROCESS
PACKING
   - BOX: kraftwrap 250 pcs/pack`,
    expect: {
      job_name: /Rep\.Inner box/,
      components: [{
        component_type: 2,
        paper_code: 'Dup GBB',
        paper_gram: '350',
        color_outside: '7',
        color_inside: '0',
        packaging_size: { width: '40', length: '68', depth: '128' },
      }],
      f_codes: ['F015731', 'F015732'],
      has_coating: true,
      packing_detail: /kraftwrap.*250/i,
    }
  },

  // ============================================================
  // NEW CASES (6-40) — ครอบคลุมฟีเจอร์ใหม่ทั้งหมด
  // ============================================================

  // === Reprint Detection ===
  { id: 6, name: 'Reprint: Rep. ใน TITLE',
    spec: `TITLE : Rep.Tray Wild Tides Tuna แพ็ค24x95g. (NEW)\nSIZE (mm.) : 384 x 252 x 0\nCOMPONENT TYPE\n   - F005613: ประกบลูกฟูก\nPAPER\n   - F005613: Duplex GBB 300 gsm\nPRINT\n   - F005613 : 4/0 Colors`,
    expect: { job_name: /Rep\.Tray/, job_type: 'repeat', components: [{ component_type: 2, paper_code: 'Dup GBB', paper_gram: '300' }] }
  },
  { id: 7, name: 'Reprint: รีพริ้น ภาษาไทย',
    spec: `รีพริ้นกล่องครีม ขนาด 80x120x40 มม. กระดาษ AC 350 แกรม พิมพ์ 4 สี จำนวน 5000`,
    expect: { job_type: 'repeat', components: [{ paper_gram: '350', color_outside: '4' }], qty_includes: '5000' }
  },

  // === Depth = 0 ===
  { id: 8, name: 'Depth=0: SIZE 384x252x0',
    spec: `TITLE : Tray Flat\nSIZE (mm.) : 384 x 252 x 0\nPAPER\n   - Tray: Duplex GBB 300 gsm\nPRINT\n   - Tray : 4/0 Colors`,
    expect: { components: [{ packaging_size: { width: '384', length: '252', depth: '0' } }] }
  },

  // === W/L/H Format ===
  { id: 9, name: 'W/L/H Format: W 212 / L 271 / H 30',
    spec: `TITLE : กล่อง ABC\nW 212 / L 271 / H 30\nกระดาษ AC 300 แกรม\nพิมพ์ 4 สี`,
    expect: { components: [{ packaging_size: { width: '212', length: '271', depth: '30' } }] }
  },

  // === Inches to mm ===
  { id: 10, name: 'Inches: 15.12" x 9.93" x 0" → mm',
    spec: `TITLE : Tray Test Inches\nSIZE (Inches) : 15.12" x 9.93" x 0"\nSIZE (mm.) : 384 x 252 x 0\nPAPER\n   - Tray: Dup GBB 300 gsm\nPRINT\n   - Tray: 4/0 Colors`,
    expect: { components: [{ packaging_size: { width: '384', length: '252', depth: '0' } }] }
  },

  // === Multi-component ===
  { id: 11, name: 'Multi-component: Tray + Cover',
    spec: `TITLE : กล่อง Gift Set\nCOMPONENT TYPE\n   - Tray: ไม่ประกบลูกฟูก\n   - Cover: ไม่ประกบลูกฟูก\nPAPER\n   - Tray: AC 350 gsm\n   - Cover: AC 300 gsm\nPRINT\n   - Tray: 4/0 Colors\n   - Cover: 4/0 Colors\nSIZE (mm.) : 200 x 150 x 50`,
    expect: { component_count: 2 }
  },

  // === F-code in Component Type ===
  { id: 12, name: 'F-code: F005613 ประกบลูกฟูก',
    spec: `TITLE : Tray Test\nSIZE (mm.) : 384 x 252 x 0\nCOMPONENT TYPE\n   - F005613: ประกบลูกฟูก\nPAPER\n   - F005613: Dup GBB 300 gsm\nPRINT\n   - F005613 : 4/0 Colors`,
    expect: { components: [{ component_type: 2 }] }
  },

  // === Multi-F with editions ===
  { id: 13, name: 'Multi-F: สีฟ้า 319, สีชมพู 186',
    spec: `งานพิมพ์กล่อง ขนาด 18x18x37 cm กระดาษอาร์ต 190 แกรม 4 สี\nมี 2 แบบ\nสีฟ้า 319\nสีชมพู 186\nจำนวน 1000`,
    expect: { edition_count: 2, qty_includes: '1000' }
  },

  // === (2TT) / (1TT) Detection ===
  { id: 14, name: '(2TT) → TTSLB',
    spec: `TITLE : กล่อง ABC (2TT)\nSIZE (mm.) : 40 x 68 x 128\nPAPER\n   - BOX: AC 350 gsm\nPRINT\n   - BOX: 4/0 Colors`,
    expect: { components: [{ box_type_id: '3' }] }
  },
  { id: 15, name: '(1TT) → TTAB',
    spec: `TITLE : กล่อง XYZ (1TT)\nSIZE (mm.) : 40 x 68 x 128\nPAPER\n   - BOX: AC 350 gsm\nPRINT\n   - BOX: 4/0 Colors`,
    expect: { components: [{ box_type_id: '4' }] }
  },

  // === Thai Casual ===
  { id: 16, name: 'Thai casual: กล่องครีม AC350 4สี 5000ชิ้น',
    spec: `กล่องครีม AC350 4สี 5000ชิ้น`,
    expect: { components: [{ paper_code: /AC/, paper_gram: '350', color_outside: '4' }], qty_includes: '5000' }
  },
  { id: 17, name: 'Thai: ประกบลูกฟูก ลอน B',
    spec: `กล่องประกบลูกฟูก ลอน B ขนาด 200x150x100 กระดาษ Dup GBB 350 แกรม 4 สี จำนวน 3000`,
    expect: { components: [{ component_type: 2, paper_code: 'Dup GBB' }], corrugated_flute: 'B' }
  },
  { id: 18, name: 'Thai: เคลือบ PVC เงา → OPP alias',
    spec: `กล่องครีม AC 300 แกรม 4 สี เคลือบ PVC เงา ขนาด 80x120x40 จำนวน 2000`,
    expect: { has_coating: true, components: [{ paper_gram: '300' }] }
  },
  { id: 19, name: 'Thai: kraftwrap 100 ชิ้น/แพ็ค',
    spec: `กล่อง AC 350 แกรม 4สี ขนาด 100x150x50 จำนวน 5000\nkraftwrap 100 pcs/pack`,
    expect: { packing_detail: /kraftwrap.*100/i }
  },
  { id: 20, name: 'Thai: ขนาด กว้างxยาวxสูง mm',
    spec: `กล่องสบู่ ขนาด 80x60x30 มม. กระดาษ AC 300 แกรม พิมพ์ 4 สี 3000 ชิ้น`,
    expect: { components: [{ packaging_size: { width: '80', length: '60', depth: '30' } }] }
  },

  // === English ===
  { id: 21, name: 'English KV: Paper AC 300gsm',
    spec: `TITLE : Cream Box Premium\nPAPER\n   - Box: Art Card 300 gsm\nPRINT\n   - Box: 4/0 Colors\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { components: [{ paper_code: /AC/, paper_gram: '300', color_outside: '4' }] }
  },
  { id: 22, name: 'English: 7/0 Colors + special ink',
    spec: `TITLE : Luxury Box\nPAPER\n   - Box: AC 350 gsm\nPRINT\n   - Box: 7/0 Colors (Pantone 485, Gold)\nSIZE (mm.) : 100 x 150 x 50`,
    expect: { components: [{ color_outside: '7' }] }
  },
  { id: 23, name: 'English: Gloss Waterbase Hi-Rub 1 s',
    spec: `TITLE : Tray Premium\nPAPER\n   - Tray: Dup GBB 300 gsm\nPRINT\n   - Tray: 4/0 Colors\nOTHER\n   - Tray: coating Gloss Waterbase Hi-Rub 1 s\nSIZE (mm.) : 384 x 252 x 30`,
    expect: { has_coating: true, coating_side: 1 }
  },
  { id: 24, name: 'English: kraftwrap 250 pcs/pack',
    spec: `TITLE : Box Test\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nPACKING\n   - Box: kraftwrap 250 pcs/pack\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { packing_detail: /kraftwrap.*250/i }
  },

  // === Edge Cases ===
  { id: 25, name: 'Non-spec: สวัสดีครับ (Thai)',
    spec: `สวัสดีครับ วันนี้อากาศดีจัง`,
    expect: { should_fail_parse: true }
  },
  { id: 26, name: 'Non-spec: Hello English',
    spec: `Hello, how are you today?`,
    expect: { should_fail_parse: true }
  },
  { id: 27, name: 'Qty exclude packing: 125 pcs/pack ≠ qty',
    spec: `TITLE : Box Small\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nPACKING\n   - Box: kraftwrap 125 pcs/pack\nSIZE (mm.) : 50 x 80 x 30\nqty 5000`,
    expect: { qty_includes: '5000' }
  },
  { id: 28, name: 'UV ink vs UV coating',
    spec: `TITLE : Box UV Test\nPAPER\n   - Box: AC 350 gsm\nPRINT\n   - Box: 4/0 Colors\nOTHER\n   - Box: coating gloss UV 1 s\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { has_coating: true, ink_type_not: 'uv' }
  },
  { id: 29, name: 'Coating: PVC เงา → OPP',
    spec: `TITLE : กล่อง PVC Test\nกระดาษ AC 300 แกรม 4 สี เคลือบ PVC เงา\nขนาด 80x120x40 จำนวน 2000`,
    expect: { has_coating: true }
  },
  { id: 30, name: 'Empty fields: spec ขาดบางฟิลด์',
    spec: `TITLE : Minimal Box\nPAPER\n   - Box: AC 300 gsm`,
    expect: { job_name: /Minimal Box/, components: [{ paper_code: /AC/ }] }
  },
  { id: 31, name: 'Long spec: 15+ lines',
    spec: `TITLE : Rep.Premium Gift Set Christmas 2026 Special Edition\nSIZE (Inches) : 8" x 10" x 3"\nSIZE (mm.) : 203 x 254 x 76\nCOMPONENT TYPE\n   - Tray: ไม่ประกบลูกฟูก\n   - Cover: ไม่ประกบลูกฟูก\nPAPER\n   - Tray: Art Card 350 gsm\n   - Cover: Art Card 300 gsm\nPRINT\n   - Tray: 6/0 Colors\n   - Cover: 4/0 Colors\nOTHER\n   - Tray: coating Gloss Waterbase 1 s\n   - Cover: coating Matt Lamination 1 s\nPROCESS\n   - ปั๊มฟอยล์ทอง\n   - ปั๊มนูน\nPACKING\n   - kraftwrap 50 pcs/pack`,
    expect: { job_name: /Premium Gift Set/, component_count: 2, has_coating: true }
  },

  // === Coating Matching ===
  { id: 32, name: 'Coating: Hi-Rub exact (ไม่ใช่แค่ Waterbase)',
    spec: `TITLE : Test Hi-Rub\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nOTHER\n   - Box: coating Gloss Waterbase Hi-Rub 1 s\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { has_coating: true }
  },
  { id: 33, name: 'Coating: Spot UV 1 s',
    spec: `TITLE : Spot UV Box\nPAPER\n   - Box: AC 350 gsm\nPRINT\n   - Box: 4/0 Colors\nOTHER\n   - Box: coating Spot UV 1 s\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { has_coating: true }
  },
  { id: 34, name: 'Coating: เว้นลิ้น ≠ เว้นยิง',
    spec: `TITLE : เว้นลิ้น Test\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nOTHER\n   - Box: coating gloss UV เว้นลิ้น 1 s\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { has_coating: true }
  },
  { id: 35, name: 'Multi-coating: 2 coatings in spec',
    spec: `TITLE : Multi Coat Box\nPAPER\n   - Box: AC 350 gsm\nPRINT\n   - Box: 6/0 Colors\nOTHER\n   - Box: coating Gloss Waterbase 1 s\n   - Box: coating Matt Lamination 2 s\nSIZE (mm.) : 100 x 150 x 50`,
    expect: { has_coating: true, coating_count_min: 2 }
  },

  // === Form / Business Rules ===
  { id: 36, name: 'Corrugated: component_type=2',
    spec: `TITLE : Box ประกบลูกฟูก\nCOMPONENT TYPE\n   - Box: ประกบลูกฟูก\nPAPER\n   - Box: Dup GBB 350 gsm\nPRINT\n   - Box: 4/0 Colors\nSIZE (mm.) : 200 x 150 x 100`,
    expect: { components: [{ component_type: 2 }] }
  },
  { id: 37, name: 'Corrugated: component_type=3 (เฉพาะลูกฟูก)',
    spec: `TITLE : Corrugated Only\nCOMPONENT TYPE\n   - Box: เฉพาะลูกฟูก\nPAPER\n   - Box: KA 200 gsm\nPRINT\n   - Box: 2/0 Colors\nSIZE (mm.) : 300 x 200 x 150`,
    expect: { components: [{ component_type: 3 }] }
  },
  { id: 38, name: 'Box template: Tray → Type 5',
    spec: `TITLE : Simple Tray ABC\nPAPER\n   - Tray: AC 300 gsm\nPRINT\n   - Tray: 4/0 Colors\nSIZE (mm.) : 200 x 150 x 30`,
    expect: { components: [{ component_name: /tray/i }] }
  },
  { id: 39, name: 'Box template: Sleeve → Type 9',
    spec: `TITLE : Sleeve Wrapper XYZ\nCOMPONENT TYPE\n   - Sleeve: ไม่ประกบลูกฟูก\nPAPER\n   - Sleeve: AC 300 gsm\nPRINT\n   - Sleeve: 4/0 Colors\nSIZE (mm.) : 10 x 200 x 100`,
    expect: { components: [{ component_name: /sleeve/i }] }
  },
  { id: 40, name: 'Foil stamp detection',
    spec: `TITLE : Luxury Foil Box\nPAPER\n   - Box: AC 350 gsm\nPRINT\n   - Box: 4/0 Colors\nPROCESS\n   - ปั๊มฟอยล์ทอง\nSIZE (mm.) : 100 x 150 x 50`,
    expect: { has_foilstamp: true }
  },

  // ============================================================
  // CASES 41-100 — Extended Coverage
  // ============================================================

  // === Thai Variations (พิมพ์หลายรูปแบบ) ===
  { id: 41, name: 'Thai: กล่องครีม แบบย่อสุด',
    spec: `กล่องครีม AC300 4สี 3000`,
    expect: { components: [{ paper_code: /AC/, paper_gram: '300', color_outside: '4' }] }
  },
  { id: 42, name: 'Thai: ใช้คำว่า "แกรม" แทน gsm',
    spec: `กล่องสบู่ กระดาษอาร์ต 250 แกรม พิมพ์ 6 สี ขนาด 70x100x35 จำนวน 10000`,
    expect: { components: [{ paper_gram: '250', color_outside: '6' }], qty_includes: '10000' }
  },
  { id: 43, name: 'Thai: ขนาดใช้ cm แทน mm',
    spec: `กล่องขนม ขนาด 15x20x8 cm กระดาษ AC 300 แกรม 4 สี 5000 ชิ้น`,
    expect: { components: [{ packaging_size: { width: '150', length: '200', depth: '80' } }] }
  },
  { id: 44, name: 'Thai: Matt Art paper',
    spec: `กล่อง Matt Art 128 แกรม พิมพ์ 4 สี ขนาด 60x90x30 จำนวน 8000`,
    expect: { components: [{ paper_code: /MA/, paper_gram: '128' }] }
  },
  { id: 45, name: 'Thai: Gloss Art paper',
    spec: `กล่อง Gloss Art 157 แกรม 4 สี ขนาด 80x120x40 จำนวน 5000`,
    expect: { components: [{ paper_code: /GA/, paper_gram: '157' }] }
  },
  { id: 46, name: 'Thai: Ivory paper',
    spec: `กล่องไอวอรี่ 250 แกรม 4 สี ขนาด 100x150x50 จำนวน 3000`,
    expect: { components: [{ paper_gram: '250' }] }
  },
  { id: 47, name: 'Thai: พิมพ์ 4 สี 1 หน้า (4/0)',
    spec: `กล่อง AC 350 พิมพ์ 4 สี ด้านนอก ขนาด 80x120x40 จำนวน 5000`,
    expect: { components: [{ color_outside: '4', color_inside: '0' }] }
  },
  { id: 48, name: 'Thai: พิมพ์ 4/1 (มีด้านใน)',
    spec: `TITLE : กล่อง 2 หน้า\nPAPER\n   - Box: AC 350 gsm\nPRINT\n   - Box: 4/1 Colors\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { components: [{ color_outside: '4', color_inside: '1' }] }
  },
  { id: 49, name: 'Thai: เคลือบด้าน (Matt)',
    spec: `กล่อง AC 300 แกรม 4 สี เคลือบด้าน ขนาด 80x120x40 จำนวน 5000`,
    expect: { has_coating: true }
  },
  { id: 50, name: 'Thai: ปั๊มไดคัท + ปั๊มนูน',
    spec: `กล่อง AC 350 แกรม 4 สี ปั๊มไดคัท ปั๊มนูน ขนาด 80x120x40 จำนวน 3000`,
    expect: { is_diecut: true }
  },

  // === Size Formats ===
  { id: 51, name: 'Size: mm with spaces',
    spec: `TITLE : Box Space Test\nSIZE (mm.) : 100 x 200 x 50\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors`,
    expect: { components: [{ packaging_size: { width: '100', length: '200', depth: '50' } }] }
  },
  { id: 52, name: 'Size: mm without spaces',
    spec: `TITLE : Box NoSpace\nSIZE (mm.) : 100x200x50\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors`,
    expect: { components: [{ packaging_size: { width: '100', length: '200', depth: '50' } }] }
  },
  { id: 53, name: 'Size: 2 dimensions only (no depth)',
    spec: `TITLE : Flat Card\nSIZE (mm.) : 210 x 297\nPAPER\n   - Card: AC 300 gsm\nPRINT\n   - Card: 4/0 Colors`,
    expect: { components: [{ packaging_size: { width: '210', length: '297' } }] }
  },
  { id: 54, name: 'Size: fraction inches 6-1/4" x 7-1/2"',
    spec: `TITLE : Fraction Box\nSIZE (Inches) : 6-1/4" x 7-1/2" x 2"\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors`,
    expect: { job_name: /Fraction Box/ }
  },
  { id: 55, name: 'Size: decimal mm',
    spec: `TITLE : Decimal Box\nSIZE (mm.) : 85.5 x 120.3 x 40.0\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors`,
    expect: { job_name: /Decimal Box/ }
  },

  // === Paper Codes ===
  { id: 56, name: 'Paper: SBS',
    spec: `TITLE : SBS Box\nPAPER\n   - Box: SBS 300 gsm\nPRINT\n   - Box: 4/0 Colors\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { components: [{ paper_code: /SBS/, paper_gram: '300' }] }
  },
  { id: 57, name: 'Paper: CRB',
    spec: `TITLE : CRB Box\nPAPER\n   - Box: CRB 350 gsm\nPRINT\n   - Box: 4/0 Colors\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { components: [{ paper_code: /CRB/, paper_gram: '350' }] }
  },
  { id: 58, name: 'Paper: Kraft',
    spec: `กล่อง Kraft 200 แกรม 2 สี ขนาด 150x200x100 จำนวน 3000`,
    expect: { components: [{ paper_gram: '200', color_outside: '2' }] }
  },
  { id: 59, name: 'Paper: Duplex WBB',
    spec: `TITLE : WBB Box\nPAPER\n   - Box: Duplex WBB 400 gsm\nPRINT\n   - Box: 4/0 Colors\nSIZE (mm.) : 200 x 150 x 80`,
    expect: { components: [{ paper_code: 'Dup WBB', paper_gram: '400' }] }
  },
  { id: 60, name: 'Paper: Duplex BBB',
    spec: `TITLE : BBB Box\nPAPER\n   - Box: Duplex BBB 450 gsm\nPRINT\n   - Box: 4/0 Colors\nSIZE (mm.) : 200 x 150 x 80`,
    expect: { components: [{ paper_code: 'Dup BBB', paper_gram: '450' }] }
  },

  // === Qty Variations ===
  { id: 61, name: 'Qty: single with comma',
    spec: `TITLE : Qty Comma\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nSIZE (mm.) : 80 x 120 x 40\nqty 10,000`,
    expect: { qty_includes: '10000' }
  },
  { id: 62, name: 'Qty: multiple quantities',
    spec: `TITLE : Multi Qty\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nSIZE (mm.) : 80 x 120 x 40\nqty 1000/3000/5000`,
    expect: { job_name: /Multi Qty/ }
  },
  { id: 63, name: 'Qty: Thai "ชิ้น"',
    spec: `กล่อง AC 300 แกรม 4 สี ขนาด 80x120x40 จำนวน 5,000 ชิ้น`,
    expect: { qty_includes: '5000' }
  },
  { id: 64, name: 'Qty: English "pcs"',
    spec: `TITLE : Qty PCS\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nSIZE (mm.) : 80 x 120 x 40\n3000 pcs`,
    expect: { qty_includes: '3000' }
  },
  { id: 65, name: 'Qty: ไม่ระบุจำนวน (ไม่ crash)',
    spec: `TITLE : No Qty Box\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { job_name: /No Qty Box/ }
  },

  // === Coating Variations ===
  { id: 66, name: 'Coating: Waterbase 2 s (ทั้ง 2 ด้าน)',
    spec: `TITLE : WB 2s Box\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nOTHER\n   - Box: coating Gloss Waterbase 2 s\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { has_coating: true }
  },
  { id: 67, name: 'Coating: Matt Lamination',
    spec: `TITLE : Matt Lam Box\nPAPER\n   - Box: AC 350 gsm\nPRINT\n   - Box: 4/0 Colors\nOTHER\n   - Box: coating Matt Lamination 1 s\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { has_coating: true }
  },
  { id: 68, name: 'Coating: OPP Window',
    spec: `TITLE : Window Box\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nOTHER\n   - Box: coating OPP Window 1 s\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { has_coating: true }
  },
  { id: 69, name: 'Coating: PE Food Grade',
    spec: `TITLE : Food Box\nPAPER\n   - Box: SBS 300 gsm\nPRINT\n   - Box: 4/0 Colors\nOTHER\n   - Box: coating PE Food Grade 1 s\nSIZE (mm.) : 150 x 100 x 50`,
    expect: { has_coating: true }
  },
  { id: 70, name: 'Coating: กันชื้น (Water Proof)',
    spec: `TITLE : Waterproof Box\nPAPER\n   - Box: Dup GBB 350 gsm\nPRINT\n   - Box: 4/0 Colors\nOTHER\n   - Box: coating กันชื้น (Water Proof) 2 s\nSIZE (mm.) : 200 x 150 x 80`,
    expect: { has_coating: true }
  },

  // === Process / Addon ===
  { id: 71, name: 'Process: ปั๊มฟอยล์เงิน',
    spec: `TITLE : Silver Foil Box\nPAPER\n   - Box: AC 350 gsm\nPRINT\n   - Box: 4/0 Colors\nPROCESS\n   - ปั๊มฟอยล์เงิน\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { has_foilstamp: true }
  },
  { id: 72, name: 'Process: ปั๊มนูน + ปั๊มจม',
    spec: `TITLE : Emboss Deboss Box\nPAPER\n   - Box: AC 350 gsm\nPRINT\n   - Box: 4/0 Colors\nPROCESS\n   - ปั๊มนูน\n   - ปั๊มจม\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { job_name: /Emboss Deboss/ }
  },
  { id: 73, name: 'Process: ค่าติดกาว + ค่าปะกาวข้าง',
    spec: `TITLE : Glue Process\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nPROCESS\n   - ค่าติดกาว\n   - ปะกาวข้าง 2 ตำแหน่ง\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { has_other_process: true }
  },
  { id: 74, name: 'Process: Spot UV + Foil + Emboss combo',
    spec: `TITLE : Premium Combo\nPAPER\n   - Box: AC 350 gsm\nPRINT\n   - Box: 6/0 Colors\nOTHER\n   - Box: coating Spot UV 1 s\nPROCESS\n   - ปั๊มฟอยล์ทอง\n   - ปั๊มนูน\nSIZE (mm.) : 100 x 150 x 50`,
    expect: { has_coating: true, has_foilstamp: true }
  },
  { id: 75, name: 'Special ink: Pantone + Metallic',
    spec: `TITLE : Special Ink Box\nPAPER\n   - Box: AC 350 gsm\nPRINT\n   - Box: 4/0 Colors + Pantone 485 + Metallic Gold\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { components: [{ color_outside: '4' }] }
  },

  // === Box Template Detection ===
  { id: 76, name: 'Template: ฝาเสียบ → Reverse Tuck',
    spec: `กล่องฝาเสียบ AC 350 แกรม 4 สี ขนาด 80x120x40 จำนวน 5000`,
    expect: { job_name: /ฝาเสียบ/ }
  },
  { id: 77, name: 'Template: ออโต้ล็อค → TTSLB/TTAB',
    spec: `กล่องออโต้ล็อค AC 300 แกรม 4 สี ขนาด 60x90x30 จำนวน 10000`,
    expect: { job_name: /ออโต้ล็อค/ }
  },
  { id: 78, name: 'Template: กล่องจั่ว → Gable Top',
    spec: `กล่องจั่ว AC 350 แกรม 4 สี ขนาด 100x80x150 จำนวน 3000`,
    expect: { job_name: /จั่ว/ }
  },
  { id: 79, name: 'Template: Pillow Box',
    spec: `TITLE : Pillow Box Gift\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nSIZE (mm.) : 150 x 100 x 30`,
    expect: { job_name: /Pillow Box/ }
  },
  { id: 80, name: 'Template: Seal End',
    spec: `TITLE : Seal End Toothpaste\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nSIZE (mm.) : 40 x 30 x 160`,
    expect: { job_name: /Seal End/ }
  },

  // === Packing Variations ===
  { id: 81, name: 'Packing: paperband',
    spec: `TITLE : Paperband Box\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nPACKING\n   - Box: paperband 50 pcs/pack\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { packing_detail: /paperband.*50/i }
  },
  { id: 82, name: 'Packing: carton',
    spec: `TITLE : Carton Pack\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nPACKING\n   - Box: carton\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { packing_detail: /carton/i }
  },
  { id: 83, name: 'Packing: pallet',
    spec: `TITLE : Pallet Pack\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nPACKING\n   - Box: pallet\nSIZE (mm.) : 80 x 120 x 40`,
    expect: { packing_detail: /pallet/i }
  },

  // === Mixed Language ===
  { id: 84, name: 'Mixed: Thai+English spec',
    spec: `กล่อง Premium Gift Set\nPaper: AC 350gsm\nพิมพ์ 6 สี เคลือบ Gloss UV\nSize: 100x150x50mm\nQty: 5000`,
    expect: { components: [{ paper_gram: '350', color_outside: '6' }], qty_includes: '5000' }
  },
  { id: 85, name: 'Mixed: English title + Thai details',
    spec: `TITLE : Cream Box Luxury\nกระดาษ AC 300 แกรม\nพิมพ์ 4 สี\nเคลือบเงา\nขนาด 80x120x40\nจำนวน 3000`,
    expect: { job_name: /Cream Box/, components: [{ paper_gram: '300' }] }
  },

  // === F-code Variations ===
  { id: 86, name: 'F-code: single F with qty',
    spec: `TITLE : Single F\nSIZE (mm.) : 80 x 120 x 40\nPAPER\n   - F001: AC 300 gsm\nPRINT\n   - F001: 4/0 Colors\nqty 5000`,
    expect: { qty_includes: '5000' }
  },
  { id: 87, name: 'F-code: 3 F-codes',
    spec: `TITLE : Triple F Box\nSIZE (mm.) : 80 x 120 x 40\nPAPER\n   - F001: AC 300 gsm\nPRINT\n   - F001: 4/0 Colors\n   - F002: 4/0 Colors\n   - F003: 4/0 Colors`,
    expect: { f_codes: ['F001', 'F002', 'F003'] }
  },
  { id: 88, name: 'F-code: F-code ใน PACKING ไม่สร้าง component ใหม่',
    spec: `TITLE : F in Packing\nSIZE (mm.) : 80 x 120 x 40\nCOMPONENT TYPE\n   - BOX: ไม่ประกบลูกฟูก\nPAPER\n   - BOX: AC 300 gsm\nPRINT\n   - F001: 4/0 Colors\nPACKING\n   - F001: kraftwrap 100 pcs/pack`,
    expect: { component_count: 1 }
  },

  // === Corrugated Variations ===
  { id: 89, name: 'Corrugated: ลอน A',
    spec: `กล่องประกบลูกฟูก ลอน A ขนาด 300x200x150 กระดาษ Dup GBB 400 แกรม 4 สี 2000`,
    expect: { corrugated_flute: 'A', components: [{ component_type: 2 }] }
  },
  { id: 90, name: 'Corrugated: ลอน C',
    spec: `กล่องประกบลูกฟูก ลอน C ขนาด 400x300x200 กระดาษ Dup GBB 450 แกรม 4 สี 1000`,
    expect: { corrugated_flute: 'C', components: [{ component_type: 2 }] }
  },
  { id: 91, name: 'Corrugated: English "with corrugated"',
    spec: `TITLE : Corrugated Laminated Box\nCOMPONENT TYPE\n   - Box: ประกบลูกฟูก\nPAPER\n   - Box: AC 350 gsm\nPRINT\n   - Box: 4/0 Colors\nSIZE (mm.) : 200 x 150 x 100`,
    expect: { components: [{ component_type: 2 }] }
  },

  // === Real-world Messy Specs ===
  { id: 92, name: 'Messy: extra spaces + typos',
    spec: `TITLE :   กล่อง   ครีม   ABC  \n  SIZE (mm.) :  80  x  120  x  40  \nPAPER\n   -  Box :  AC   300  gsm  \nPRINT\n   -  Box :  4/0  Colors`,
    expect: { components: [{ paper_code: /AC/, paper_gram: '300' }] }
  },
  { id: 93, name: 'Messy: tabs instead of spaces',
    spec: `TITLE : Tab Box\nSIZE (mm.) :\t80\tx\t120\tx\t40\nPAPER\n\t- Box: AC 300 gsm\nPRINT\n\t- Box: 4/0 Colors`,
    expect: { components: [{ packaging_size: { width: '80' } }] }
  },
  { id: 94, name: 'Messy: missing TITLE keyword',
    spec: `กล่อง No Title Keyword\nSIZE (mm.) : 80 x 120 x 40\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors`,
    expect: { components: [{ paper_code: /AC/ }] }
  },
  { id: 95, name: 'Messy: all lowercase',
    spec: `title : lowercase box\nsize (mm.) : 80 x 120 x 40\npaper\n   - box: ac 300 gsm\nprint\n   - box: 4/0 colors`,
    expect: { components: [{ paper_gram: '300' }] }
  },

  // === Large / Complex ===
  { id: 96, name: 'Complex: 3 components + multi-F + coating',
    spec: `TITLE : Premium 3-Piece Gift Set\nCOMPONENT TYPE\n   - Tray: ไม่ประกบลูกฟูก\n   - Cover: ไม่ประกบลูกฟูก\n   - Sleeve: ไม่ประกบลูกฟูก\nPAPER\n   - Tray: AC 350 gsm\n   - Cover: AC 300 gsm\n   - Sleeve: AC 250 gsm\nPRINT\n   - F001: 6/0 Colors\n   - F002: 4/0 Colors\nOTHER\n   - Tray: coating Gloss UV 1 s\n   - Cover: coating Matt Lamination 1 s\nSIZE (mm.) : 200 x 150 x 80`,
    expect: { component_count: 3, has_coating: true }
  },
  { id: 97, name: 'Complex: Full spec with everything',
    spec: `TITLE : Rep.Premium Box Christmas 2026\nSIZE (mm.) : 250 x 180 x 60\nCOMPONENT TYPE\n   - Box: ประกบลูกฟูก\nPAPER\n   - Box: Art Card 350 gsm\nPRINT\n   - F001: 8/0 Colors + Pantone 485\nOTHER\n   - Box: coating Gloss Waterbase Hi-Rub 1 s\nPROCESS\n   - ปั๊มฟอยล์ทอง\n   - ปั๊มนูน\n   - ค่าติดกาว\nPACKING\n   - Box: kraftwrap 100 pcs/pack\nqty 5000`,
    expect: { job_type: 'repeat', components: [{ component_type: 2, color_outside: '8' }], has_coating: true, has_foilstamp: true, has_other_process: true, qty_includes: '5000' }
  },

  // === Boundary / Stress ===
  { id: 98, name: 'Boundary: very small size',
    spec: `TITLE : Tiny Box\nSIZE (mm.) : 10 x 15 x 5\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors`,
    expect: { components: [{ packaging_size: { width: '10', length: '15', depth: '5' } }] }
  },
  { id: 99, name: 'Boundary: very large size',
    spec: `TITLE : Huge Display Box\nSIZE (mm.) : 800 x 600 x 400\nPAPER\n   - Box: Dup GBB 450 gsm\nPRINT\n   - Box: 4/0 Colors`,
    expect: { components: [{ packaging_size: { width: '800', length: '600', depth: '400' } }] }
  },
  { id: 100, name: 'Boundary: very large qty',
    spec: `TITLE : Mass Production\nPAPER\n   - Box: AC 300 gsm\nPRINT\n   - Box: 4/0 Colors\nSIZE (mm.) : 80 x 120 x 40\nqty 500000`,
    expect: { qty_includes: '500000' }
  },

  // ============================================================
  // CASES 101-150 — LAYOUT + PRICE + PARSER/FORM EXTENDED
  // ทดสอบ CalcEngine โดยตรง (ผ่าน vm sandbox + master data จาก server)
  // ============================================================

  // ===== A. LAYOUT CALCULATION (101-115) =====

  { id: 101, name: 'Layout: Reverse Tuck 80x120x40 4/0 → ups>0',
    calc: { type: 'layout',
      component: { packaging_size: { width: 80, length: 120, depth: 40, glue_flap: 15, tuck_flap: 15 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } } },
    expect: { layoutUpsMin: 1, hasMachine: true, hasUnfolded: true, sheetWMin: 400 }
  },

  { id: 102, name: 'Layout: Sleeve template 9 (10x200x100)',
    calc: { type: 'layout',
      component: { packaging_size: { width: 10, length: 200, depth: 100, glue_flap: 15, tuck_flap: 0 },
                   box_type: { type_id: 9 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } } },
    expect: { layoutUpsMin: 1, openWMax: 200, openLMin: 200 }
  },

  { id: 103, name: 'Layout: Tray template 5 (200x150x30)',
    calc: { type: 'layout',
      component: { packaging_size: { width: 200, length: 150, depth: 30, dust_flap: 10 },
                   box_type: { type_id: 5 }, paper: { paper_code: 'AC', paper_gram: 350 }, color: { outside: 4, inside: 0 } } },
    expect: { layoutUpsMin: 1, hasMachine: true }
  },

  { id: 104, name: 'Layout: Auto-switch — ขนาดคลี่ใหญ่เกิน Offset',
    calc: { type: 'estimate',
      // 800x600x400 → คลี่ ~ 2*(800+600)+15=2815mm × 2*(800+15)+400=2030mm → เกิน Offset
      component: { packaging_size: { width: 800, length: 600, depth: 400 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } },
      qty: [1000] },
    expect: { layoutNonOffsetOrError: true } // ต้อง switch เครื่อง หรือ error
  },

  { id: 105, name: 'Layout: Manual mode (manual_nw=2, manual_nl=3)',
    calc: { type: 'layout',
      component: { packaging_size: { width: 80, length: 120, depth: 40 },
                   box_type: { type_id: 1, is_manual_layout: true, manual_nw: 2, manual_nl: 3 },
                   paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } } },
    expect: { layoutUps: 6, isManual: true }
  },

  { id: 106, name: 'Layout: Best fit small box 30x40x10 → many ups',
    calc: { type: 'layout',
      component: { packaging_size: { width: 30, length: 40, depth: 10 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } } },
    expect: { layoutUpsMin: 10 }
  },

  { id: 107, name: 'Layout: Corrugated component_type=2 → corrugatedBoard ออกมา',
    calc: { type: 'layout',
      component: { component_type: 2, packaging_size: { width: 200, length: 150, depth: 100 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'Dup GBB', paper_gram: 350 }, color: { outside: 4, inside: 0 },
                   corrugated: { grade: ['KA','CA'], flute_type: 'E', flute_side: 'long_side' } } },
    expect: { hasCorrugatedBoard: true, layoutUpsMin: 1 }
  },

  { id: 108, name: 'Layout: Pillow Box template 10',
    calc: { type: 'layout',
      component: { packaging_size: { width: 60, length: 150, depth: 30 },
                   box_type: { type_id: 10 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } } },
    expect: { layoutUpsMin: 1 }
  },

  { id: 109, name: 'Layout: Seal End template 11',
    calc: { type: 'layout',
      component: { packaging_size: { width: 40, length: 30, depth: 160 },
                   box_type: { type_id: 11 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } } },
    expect: { layoutUpsMin: 1 }
  },

  { id: 110, name: 'Layout: TTSLB template 3 + overlap saving',
    calc: { type: 'layout',
      component: { packaging_size: { width: 40, length: 60, depth: 100, glue_flap: 12, tuck_flap: 12, ol: 5 },
                   box_type: { type_id: 3 }, paper: { paper_code: 'AC', paper_gram: 350 }, color: { outside: 4, inside: 0 } } },
    expect: { layoutUpsMin: 1 }
  },

  { id: 111, name: 'Layout: Frame-Vue Tray template 6',
    calc: { type: 'layout',
      component: { packaging_size: { width: 100, length: 100, depth: 30, dust_flap: 10, ol: 5 },
                   box_type: { type_id: 6 }, paper: { paper_code: 'AC', paper_gram: 350 }, color: { outside: 4, inside: 0 } } },
    expect: { layoutUpsMin: 1 }
  },

  { id: 112, name: 'Layout: Gable Top template 8',
    calc: { type: 'layout',
      component: { packaging_size: { width: 70, length: 70, depth: 150, glue_flap: 15, tuck_flap: 15, ol: 0 },
                   box_type: { type_id: 8 }, paper: { paper_code: 'AC', paper_gram: 350 }, color: { outside: 4, inside: 0 } } },
    expect: { layoutUpsMin: 1 }
  },

  { id: 113, name: 'Layout: Custom template 12 (open size override)',
    calc: { type: 'layout',
      component: { packaging_size: { width: 100, length: 200, depth: 0, open_w: 250, open_l: 350 },
                   box_type: { type_id: 12 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } } },
    expect: { layoutUpsMin: 1, openWBetween: [250, 260] }
  },

  { id: 114, name: 'Layout: utilization % > 0 (printArea/sheetArea)',
    calc: { type: 'layout',
      component: { packaging_size: { width: 80, length: 120, depth: 40 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } } },
    expect: { utilizationMin: 0.10 }
  },

  { id: 115, name: 'Layout: Reprint vs new — same layout (deterministic)',
    calc: { type: 'layout',
      component: { packaging_size: { width: 100, length: 150, depth: 50 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } } },
    expect: { layoutUpsMin: 1, hasMachine: true }
  },

  // ===== B. PRICE CALCULATION (116-135) =====

  { id: 116, name: 'Price: Simple 4/0 box → finalPrice > 0 + ครบทุกหมวด',
    calc: { type: 'estimate',
      component: { packaging_size: { width: 80, length: 120, depth: 40 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } },
      qty: [5000] },
    expect: { finalPriceMin: 100, materialMin: 1, productionMin: 1, hasAllSections: true }
  },

  { id: 117, name: 'Price: Material > 0 (paper cost)',
    calc: { type: 'estimate',
      component: { packaging_size: { width: 100, length: 150, depth: 50 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 350 }, color: { outside: 4, inside: 0 } },
      qty: [3000] },
    expect: { paperCostMin: 1, materialMin: 1 }
  },

  { id: 118, name: 'Price: Plate cost ขึ้นกับจำนวนสี',
    calc: { type: 'estimate',
      component: { packaging_size: { width: 80, length: 120, depth: 40 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 6, inside: 0 } },
      qty: [3000] },
    expect: { plateCostMin: 1 }
  },

  { id: 119, name: 'Price: Print cost > 0',
    calc: { type: 'estimate',
      component: { packaging_size: { width: 80, length: 120, depth: 40 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } },
      qty: [5000] },
    expect: { printCostMin: 1 }
  },

  { id: 120, name: 'Price: Color limit waste สูงกว่า normal',
    calc: { type: 'estimate_compare',
      component: { packaging_size: { width: 80, length: 120, depth: 40 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } },
      qty: [3000], compareKey: 'limit_color' },
    expect: { colorLimitGreater: true }
  },

  { id: 121, name: 'Price: Special ink Metallic ×3 rate',
    calc: { type: 'special_ink', inkType: 'metallic', qty: 5000 },
    expect: { specialInkMultiplier: 3 }
  },

  { id: 122, name: 'Price: Special ink Pantone ×1.5 rate',
    calc: { type: 'special_ink', inkType: 'pantone', qty: 5000 },
    expect: { specialInkMultiplier: 1.5 }
  },

  { id: 123, name: 'Price: Special ink Fluorescent ×2.5 rate',
    calc: { type: 'special_ink', inkType: 'fluorescent', qty: 5000 },
    expect: { specialInkMultiplier: 2.5 }
  },

  { id: 124, name: 'Price: Special ink UV/อื่นๆ → default ×2',
    calc: { type: 'special_ink', inkType: 'UV', qty: 5000 },
    expect: { specialInkMultiplier: 2 }
  },

  { id: 125, name: 'Price: AfterPress coating → cost > 0',
    calc: { type: 'estimate',
      component: { packaging_size: { width: 80, length: 120, depth: 40 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 },
                   addon: [{ type: 'coating', detail: 'gloss UV', side: 1 }] },
      qty: [5000] },
    expect: { afterPressMin: 0 } // อย่างน้อยมี afterPress object
  },

  { id: 126, name: 'Price: Foilstamp addon → cost ปรากฏ',
    calc: { type: 'estimate',
      component: { packaging_size: { width: 80, length: 120, depth: 40 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 350 }, color: { outside: 4, inside: 0 },
                   addon: [{ type: 'foilstamp', detail: 'ฟอยล์ทอง' }] },
      qty: [5000] },
    expect: { afterPressMin: 0 }
  },

  { id: 127, name: 'Price: Emboss + Deboss addon',
    calc: { type: 'estimate',
      component: { packaging_size: { width: 80, length: 120, depth: 40 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 350 }, color: { outside: 4, inside: 0 },
                   addon: [{ type: 'emboss', detail: 'นูน' }, { type: 'deboss', detail: 'จม' }] },
      qty: [5000] },
    expect: { afterPressMin: 0 }
  },

  { id: 128, name: 'Price: Multi-F per-F prices → fResults length 2',
    calc: { type: 'estimate',
      component: { packaging_size: { width: 80, length: 120, depth: 40 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } },
      qty: [3000],
      has_multi_f: true,
      f_data: [{ f_code: 'F001', qty: '2000' }, { f_code: 'F002', qty: '1000' }] },
    expect: { isMultiF: true, fResultsLength: 2, finalPriceMin: 100 }
  },

  { id: 129, name: 'Price: Total = Material + Production + Packing + Delivery + extras',
    calc: { type: 'estimate',
      component: { packaging_size: { width: 80, length: 120, depth: 40 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } },
      qty: [5000] },
    expect: { subtotalEqualsSum: true }
  },

  { id: 130, name: 'Price: Two qtys → totals length 2',
    calc: { type: 'estimate',
      component: { packaging_size: { width: 80, length: 120, depth: 40 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } },
      qty: [3000, 5000] },
    expect: { totalsLength: 2, finalPriceMin: 100 }
  },

  { id: 131, name: 'Price: ขนาดใหญ่ → unit price ลด',
    calc: { type: 'estimate_qty_compare',
      component: { packaging_size: { width: 80, length: 120, depth: 40 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } },
      qtyA: 1000, qtyB: 10000 },
    expect: { unitPriceDecreases: true }
  },

  { id: 132, name: 'Price: เครื่อง Offset cut2 default sheet',
    calc: { type: 'estimate',
      component: { packaging_size: { width: 100, length: 150, depth: 50 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 350 }, color: { outside: 4, inside: 0 } },
      qty: [5000] },
    expect: { hasMachineId: true, finalPriceMin: 100 }
  },

  { id: 133, name: 'Price: Reprint flag → ไม่ crash',
    calc: { type: 'estimate', is_reprinted: true,
      component: { packaging_size: { width: 80, length: 120, depth: 40 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } },
      qty: [5000] },
    expect: { finalPriceMin: 100 }
  },

  { id: 134, name: 'Price: Profit sharing → finalPrice มี markup',
    calc: { type: 'estimate_compare', compareKey: 'profit_sharing',
      component: { packaging_size: { width: 80, length: 120, depth: 40 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 }, color: { outside: 4, inside: 0 } },
      qty: [5000] },
    expect: { profitSharingGreater: true }
  },

  { id: 135, name: 'Price: Corrugated component → board cost > 0',
    calc: { type: 'estimate',
      component: { component_type: 2, packaging_size: { width: 200, length: 150, depth: 100 },
                   box_type: { type_id: 1 }, paper: { paper_code: 'Dup GBB', paper_gram: 350 }, color: { outside: 4, inside: 0 },
                   corrugated: { grade: ['KA','CA'], flute_type: 'E', flute_side: 'long_side' } },
      qty: [3000] },
    expect: { finalPriceMin: 100 }
  },

  // ===== C. PARSER + FORM EXTENDED (136-150) =====

  { id: 136, name: 'Parser: f_codes มีสีต่อ F-code',
    spec: `TITLE : Multi F\nSIZE (mm.) : 40 x 68 x 128\nCOMPONENT TYPE\n   - BOX: ไม่ประกบลูกฟูก\nPAPER\n   - BOX: AC 350 gsm\nPRINT\n   - F015731 : 7/0 Colors\n   - F015732 : 6/1 Colors`,
    expect: { f_codes_with_colors: [
      { f_code: 'F015731', colors_out: 7, colors_in: 0 },
      { f_code: 'F015732', colors_out: 6, colors_in: 1 },
    ] }
  },

  { id: 137, name: 'Parser: Foil F-code → addon._fCodes',
    spec: `TITLE : Foil Per F\nSIZE (mm.) : 80 x 120 x 40\nPAPER\n   - BOX: AC 350 gsm\nPRINT\n   - F001 : 4/0 Colors\n   - F002 : 4/0 Colors\nPROCESS\n   - F001: ปั๊มฟอยล์ทอง`,
    expect: { addon_fcodes_for_type: 'foil_stamp' }
  },

  { id: 138, name: 'Parser: Spec cache hit (call ครั้งที่ 2 = _cached)',
    spec: `TITLE : Cache Test ${Date.now()}\nSIZE (mm.) : 80 x 120 x 40\nPAPER\n   - BOX: AC 300 gsm\nPRINT\n   - BOX: 4/0 Colors`,
    expect: { cached_on_second: true }
  },

  { id: 139, name: 'Parser: AI Learning _learned ปรากฏ (array)',
    spec: `TITLE : Learning Test\nSIZE (mm.) : 80 x 120 x 40\nPAPER\n   - BOX: AC 300 gsm\nPRINT\n   - BOX: 4/0 Colors`,
    expect: { has_learned_field: true }
  },

  { id: 140, name: 'Parser: Coating addon มี _fCodes (per-F coating)',
    spec: `TITLE : Coating Per F\nSIZE (mm.) : 80 x 120 x 40\nPAPER\n   - BOX: AC 350 gsm\nPRINT\n   - F001 : 4/0 Colors\n   - F002 : 4/0 Colors\nOTHER\n   - F001: coating gloss UV 1 s`,
    expect: { coating_has_fcodes: true }
  },

  { id: 141, name: 'Parser: Emboss F-code assignment',
    spec: `TITLE : Emboss F Test\nSIZE (mm.) : 80 x 120 x 40\nPAPER\n   - BOX: AC 350 gsm\nPRINT\n   - F001 : 4/0 Colors\n   - F002 : 4/0 Colors\nPROCESS\n   - F002: ปั๊มนูน`,
    expect: { addon_fcodes_for_type: 'emboss' }
  },

  { id: 142, name: 'Parser: Deboss F-code assignment',
    spec: `TITLE : Deboss F Test\nSIZE (mm.) : 80 x 120 x 40\nPAPER\n   - BOX: AC 350 gsm\nPRINT\n   - F001 : 4/0 Colors\n   - F002 : 4/0 Colors\nPROCESS\n   - F002: ปั๊มจม`,
    expect: { addon_fcodes_for_type: 'deboss' }
  },

  { id: 143, name: 'Parser: 3 F-codes มีจำนวนสีต่างกัน',
    spec: `TITLE : Triple F Diff Colors\nSIZE (mm.) : 80 x 120 x 40\nPAPER\n   - BOX: AC 350 gsm\nPRINT\n   - F001 : 4/0 Colors\n   - F002 : 5/0 Colors\n   - F003 : 6/0 Colors`,
    expect: { f_codes_with_colors: [
      { f_code: 'F001', colors_out: 4, colors_in: 0 },
      { f_code: 'F002', colors_out: 5, colors_in: 0 },
      { f_code: 'F003', colors_out: 6, colors_in: 0 },
    ] }
  },

  { id: 144, name: 'Parser: Form reset ทำงาน — spec ใหม่ → ไม่ค้างของเก่า',
    spec: `TITLE : Brand New Spec\nSIZE (mm.) : 50 x 70 x 20\nPAPER\n   - BOX: AC 250 gsm\nPRINT\n   - BOX: 2/0 Colors`,
    expect: { components: [{ paper_gram: '250', color_outside: '2' }] }
  },

  { id: 145, name: 'Parser: ไม่มี F-codes → has_multi_f = false',
    spec: `TITLE : Single Job\nSIZE (mm.) : 80 x 120 x 40\nPAPER\n   - BOX: AC 300 gsm\nPRINT\n   - BOX: 4/0 Colors`,
    expect: { no_f_codes: true }
  },
];

// ============================================================
// CALC ENGINE TEST RUNNER (Layout + Price)
// ============================================================
async function runCalcCase(tc) {
  const results = [];
  const engine = await getCalcEngine();
  const c = tc.calc;
  const expect = tc.expect || {};

  // ----- LAYOUT TYPE -----
  if (c.type === 'layout') {
    const form = buildForm({ component: c.component });
    const layout = engine.calcLayout(form.components[0], form.print_type || 'Offset');
    if (layout.error && !expect.layoutNonOffsetOrError) {
      results.push({ pass: false, msg: `layout error: ${layout.error}` });
      return results;
    }
    const best = layout.best || {};
    const ups = best.ups || 0;

    if (expect.layoutUps !== undefined) results.push({ pass: ups === expect.layoutUps, msg: `ups: ${ups}`, expected: expect.layoutUps });
    if (expect.layoutUpsMin !== undefined) results.push({ pass: ups >= expect.layoutUpsMin, msg: `ups: ${ups}`, expected: `>= ${expect.layoutUpsMin}` });
    if (expect.hasMachine) results.push({ pass: !!(best.machine || layout.machine), msg: `machine: ${best.machine || (layout.machine && layout.machine.id)}` });
    if (expect.hasUnfolded) results.push({ pass: !!layout.unfolded, msg: `unfolded: ${layout.unfolded ? `${Math.round(layout.unfolded.openW)}x${Math.round(layout.unfolded.openL)}` : 'none'}` });
    if (expect.sheetWMin !== undefined) results.push({ pass: (best.sheetW || 0) >= expect.sheetWMin, msg: `sheetW: ${best.sheetW}`, expected: `>= ${expect.sheetWMin}` });
    if (expect.openWMax !== undefined) results.push({ pass: (layout.unfolded?.openW || Infinity) <= expect.openWMax * 1.5, msg: `openW: ${layout.unfolded?.openW}` });
    if (expect.openLMin !== undefined) results.push({ pass: (layout.unfolded?.openL || 0) >= expect.openLMin, msg: `openL: ${layout.unfolded?.openL}` });
    if (expect.openWBetween) {
      const ow = layout.unfolded?.openW || 0;
      results.push({ pass: ow >= expect.openWBetween[0] && ow <= expect.openWBetween[1] + 20, msg: `openW: ${ow}`, expected: `in ${JSON.stringify(expect.openWBetween)}` });
    }
    if (expect.isManual) results.push({ pass: !!layout._isManual, msg: `_isManual: ${layout._isManual}` });
    if (expect.hasCorrugatedBoard) results.push({ pass: !!layout.corrugatedBoard, msg: `corrugatedBoard: ${!!layout.corrugatedBoard}` });
    if (expect.utilizationMin !== undefined) {
      const sheetArea = (best.sheetW || 0) * (best.sheetL || 0);
      const printArea = (best.printW_mm || 0) * (best.printL_mm || 0);
      const util = sheetArea > 0 ? printArea / sheetArea : 0;
      results.push({ pass: util >= expect.utilizationMin, msg: `utilization: ${(util * 100).toFixed(1)}%`, expected: `>= ${(expect.utilizationMin * 100).toFixed(0)}%` });
    }
    return results;
  }

  // ----- ESTIMATE TYPE -----
  if (c.type === 'estimate') {
    const form = buildForm({
      component: c.component, qty: c.qty, is_reprinted: c.is_reprinted,
      has_multi_f: c.has_multi_f, f_data: c.f_data,
    });
    const est = engine.calcFullEstimate(form);

    if (expect.layoutNonOffsetOrError) {
      const cr = est.components?.[0];
      const switched = cr?.layout?._autoPrintType && cr.layout._autoPrintType !== 'Offset';
      const errored = !!cr?.error || !!est.error;
      results.push({ pass: switched || errored, msg: `auto-switch or error: switched=${!!switched}, error=${errored}` });
      return results;
    }

    if (est.error) { results.push({ pass: false, msg: `estimate error: ${est.error}` }); return results; }

    const t0 = est.totals?.[0] || {};
    const cr0 = est.components?.[0];
    const qr0 = cr0?.results?.[0];

    if (expect.finalPriceMin !== undefined) results.push({ pass: (t0.finalPrice || 0) >= expect.finalPriceMin, msg: `finalPrice: ${t0.finalPrice}`, expected: `>= ${expect.finalPriceMin}` });
    if (expect.materialMin !== undefined) results.push({ pass: (t0.materialTotal || 0) >= expect.materialMin, msg: `material: ${t0.materialTotal}`, expected: `>= ${expect.materialMin}` });
    if (expect.productionMin !== undefined) results.push({ pass: (t0.productionTotal || 0) >= expect.productionMin, msg: `production: ${t0.productionTotal}`, expected: `>= ${expect.productionMin}` });
    if (expect.paperCostMin !== undefined) results.push({ pass: (qr0?.paperCost?.total || 0) >= expect.paperCostMin, msg: `paperCost: ${qr0?.paperCost?.total}` });
    if (expect.plateCostMin !== undefined) results.push({ pass: (qr0?.plateCost?.total || 0) >= expect.plateCostMin, msg: `plateCost: ${qr0?.plateCost?.total}` });
    if (expect.printCostMin !== undefined) results.push({ pass: (qr0?.printCost?.total || 0) >= expect.printCostMin, msg: `printCost: ${qr0?.printCost?.total}` });
    if (expect.afterPressMin !== undefined) results.push({ pass: (qr0?.afterPress?.total || 0) >= expect.afterPressMin, msg: `afterPress: ${qr0?.afterPress?.total}` });
    if (expect.hasAllSections) {
      const ok = qr0 && qr0.paperCost && qr0.plateCost && qr0.printCost && qr0.afterPress;
      results.push({ pass: !!ok, msg: `sections present: paper=${!!qr0?.paperCost} plate=${!!qr0?.plateCost} print=${!!qr0?.printCost} afterPress=${!!qr0?.afterPress}` });
    }
    if (expect.hasMachineId) {
      const mid = cr0?.layout?.best?.machine || cr0?.layout?.machine?.id;
      results.push({ pass: !!mid, msg: `machine: ${mid}` });
    }
    if (expect.subtotalEqualsSum) {
      const sum = (t0.materialTotal || 0) + (t0.productionTotal || 0) + (t0.packingTotal || 0) +
                  (t0.deliveryTotal || 0) + (t0.otherCostTotal || 0) + (t0.processInfoTotal || 0) + (t0.formProcessTotal || 0);
      const diff = Math.abs(sum - (t0.subtotal || 0));
      results.push({ pass: diff < 1, msg: `subtotal: ${t0.subtotal} vs sum: ${sum.toFixed(2)} (diff ${diff.toFixed(2)})` });
    }
    if (expect.totalsLength !== undefined) results.push({ pass: (est.totals || []).length === expect.totalsLength, msg: `totals length: ${(est.totals || []).length}`, expected: expect.totalsLength });
    if (expect.isMultiF) results.push({ pass: !!est.isMultiF, msg: `isMultiF: ${est.isMultiF}` });
    if (expect.fResultsLength !== undefined) results.push({ pass: (cr0?.fResults || []).length === expect.fResultsLength, msg: `fResults: ${(cr0?.fResults || []).length}`, expected: expect.fResultsLength });
    return results;
  }

  // ----- ESTIMATE COMPARE (toggle a flag and compare) -----
  if (c.type === 'estimate_compare') {
    const baseOpts = { component: c.component, qty: c.qty };
    const formA = buildForm(baseOpts);
    const formB = buildForm({ ...baseOpts, [c.compareKey]: true });
    const estA = engine.calcFullEstimate(formA);
    const estB = engine.calcFullEstimate(formB);
    const tA = estA.totals?.[0] || {};
    const tB = estB.totals?.[0] || {};

    if (expect.colorLimitGreater) {
      results.push({ pass: (tB.finalPrice || 0) >= (tA.finalPrice || 0), msg: `finalPrice normal=${tA.finalPrice}, limit_color=${tB.finalPrice}` });
    }
    if (expect.profitSharingGreater) {
      results.push({ pass: (tB.finalPrice || 0) > (tA.finalPrice || 0), msg: `finalPrice normal=${tA.finalPrice}, profit_sharing=${tB.finalPrice}` });
    }
    return results;
  }

  // ----- ESTIMATE QTY COMPARE (unit price vs qty) -----
  if (c.type === 'estimate_qty_compare') {
    const formA = buildForm({ component: c.component, qty: [c.qtyA] });
    const formB = buildForm({ component: c.component, qty: [c.qtyB] });
    const tA = engine.calcFullEstimate(formA).totals?.[0] || {};
    const tB = engine.calcFullEstimate(formB).totals?.[0] || {};
    if (expect.unitPriceDecreases) {
      results.push({ pass: (tB.unitPrice || 0) <= (tA.unitPrice || Infinity), msg: `unitPrice qty=${c.qtyA}: ${tA.unitPrice} → qty=${c.qtyB}: ${tB.unitPrice}` });
    }
    return results;
  }

  // ----- SPECIAL INK MULTIPLIER -----
  if (c.type === 'special_ink') {
    const baseComp = {
      packaging_size: { width: 80, length: 120, depth: 40 },
      box_type: { type_id: 1 }, paper: { paper_code: 'AC', paper_gram: 300 },
      color: { outside: 4, inside: 0, is_special_ink: true },
      special_ink: [{ ink_color: 'Test', ink_type: c.inkType, printing_style: 'ตีพื้น' }],
    };
    const form = buildForm({ component: baseComp, qty: [c.qty] });
    const est = engine.calcFullEstimate(form);
    const cr = est.components?.[0];
    const qr = cr?.results?.[0];
    const afterUps = qr?.paperUsage?.afterUps || 0;
    const tier = engine.findPriceTier(afterUps);
    const expectedRate = (tier?.print_1col || 0) * expect.specialInkMultiplier;
    const expectedCost = afterUps * expectedRate;
    const actualCost = qr?.specialInk?.total || 0;
    const ok = expectedCost === 0
      ? actualCost > 0
      : Math.abs(actualCost / expectedCost - 1) < 0.05;
    results.push({ pass: ok, msg: `specialInk ${c.inkType}: actual=${actualCost.toFixed(2)}, expected=${expectedCost.toFixed(2)} (×${expect.specialInkMultiplier})` });
    return results;
  }

  results.push({ pass: false, msg: `unknown calc.type: ${c.type}` });
  return results;
}

// ============================================================
// TEST RUNNER
// ============================================================
async function runTests(caseFilter) {
  console.log('\n' + '='.repeat(60));
  console.log('  Pornchai RFQ — Test Suite');
  console.log('  ' + new Date().toLocaleString('th-TH'));
  console.log('='.repeat(60) + '\n');

  // Check server
  try {
    const health = await fetch(API + '/api/health').then(r => r.json());
    console.log(`Server: ✅ (Estimate API: ${health.estimate ? '✅' : '❌'}, AI: ${health.gateway ? '✅' : '❌'})\n`);
  } catch {
    console.log('Server: ❌ ไม่สามารถเชื่อมต่อ ' + API);
    console.log('กรุณารัน: cd webapp && node server.js\n');
    process.exit(1);
  }

  const cases = caseFilter
    ? TEST_CASES.filter(c => c.id === parseInt(caseFilter))
    : TEST_CASES;

  let passed = 0, failed = 0, errors = [];

  for (const tc of cases) {
    process.stdout.write(`Case ${tc.id}: ${tc.name} ... `);

    try {
      // === BRANCH: CALC ENGINE TESTS (Layout/Price) ===
      if (tc.calc) {
        const r = await runCalcCase(tc);
        const failedR = r.filter(x => !x.pass);
        if (failedR.length === 0) {
          console.log(`✅ PASS (${r.length} assertions)`);
          passed++;
        } else {
          console.log(`❌ FAIL (${failedR.length}/${r.length} failed)`);
          failedR.forEach(x => console.log(`   ❌ ${x.msg}${x.expected ? ' (expected: ' + x.expected + ')' : ''}`));
          failed++;
          errors.push({ case: tc.id, name: tc.name, failures: failedR });
        }
        continue;
      }

      // Call parse-spec API
      const res = await fetch(API + '/api/parse-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: tc.spec }),
      }).then(r => r.json());

      const data = res.data || {};
      const validation = res.validation || {};
      const results = [];

      // === Extended Parser assertions ===

      // f_codes with colors_out / colors_in
      if (tc.expect.f_codes_with_colors) {
        const fc = data.f_codes || [];
        tc.expect.f_codes_with_colors.forEach((exp, i) => {
          const got = fc[i];
          if (!got) { results.push({ pass: false, msg: `f_codes[${i}]: ไม่มี` }); return; }
          const ok = got.f_code === exp.f_code && got.colors_out === exp.colors_out && got.colors_in === exp.colors_in;
          results.push({ pass: ok, msg: `f_codes[${i}]: ${got.f_code} ${got.colors_out}/${got.colors_in}`,
                         expected: `${exp.f_code} ${exp.colors_out}/${exp.colors_in}` });
        });
      }

      // No f_codes (single F job)
      if (tc.expect.no_f_codes) {
        const fc = data.f_codes || [];
        results.push({ pass: fc.length === 0, msg: `f_codes count: ${fc.length}`, expected: '0' });
      }

      // addon._fCodes for type
      if (tc.expect.addon_fcodes_for_type) {
        const t = tc.expect.addon_fcodes_for_type;
        let found = null;
        (data.components || []).forEach(c => {
          (c.addon || []).forEach(a => { if (a.type === t && Array.isArray(a._fCodes) && a._fCodes.length > 0) found = a; });
        });
        results.push({ pass: !!found, msg: `addon ${t} _fCodes: ${found ? JSON.stringify(found._fCodes) : 'ไม่พบ'}` });
      }

      // Coating addon has _fCodes
      if (tc.expect.coating_has_fcodes) {
        let found = null;
        (data.components || []).forEach(c => {
          (c.addon || []).forEach(a => { if (a.type === 'coating' && Array.isArray(a._fCodes) && a._fCodes.length > 0) found = a; });
        });
        results.push({ pass: !!found, msg: `coating._fCodes: ${found ? JSON.stringify(found._fCodes) : 'ไม่พบ'}` });
      }

      // Spec cache hit on second call
      if (tc.expect.cached_on_second) {
        const res2 = await fetch(API + '/api/parse-spec', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: tc.spec }),
        }).then(r => r.json());
        results.push({ pass: !!res2._cached, msg: `_cached on 2nd call: ${res2._cached}` });
      }

      // Has _learned field (array)
      if (tc.expect.has_learned_field) {
        results.push({ pass: Array.isArray(res._learned), msg: `_learned: ${JSON.stringify(res._learned)}` });
      }

      // === Run assertions ===

      // Non-spec check
      if (tc.expect.should_fail_parse) {
        // Check that it was NOT successfully parsed as a complete spec
        const isComplete = validation.isComplete;
        const hasManyMissing = (validation.missing?.length || 0) >= 3;
        if (!isComplete || hasManyMissing) {
          results.push({ pass: true, msg: 'ไม่ถูก parse เป็น spec (ถูกต้อง)' });
        } else {
          results.push({ pass: false, msg: `ถูก parse เป็น spec ทั้งที่ไม่ควร: ${data.job_name}` });
        }
      }

      // Job name
      if (tc.expect.job_name) {
        const jn = data.job_name || '';
        if (tc.expect.job_name instanceof RegExp) {
          results.push({ pass: tc.expect.job_name.test(jn), msg: `job_name: "${jn}"`, expected: tc.expect.job_name.toString() });
        } else {
          results.push({ pass: jn === tc.expect.job_name, msg: `job_name: "${jn}"`, expected: tc.expect.job_name });
        }
      }

      // Job type (new/repeat)
      if (tc.expect.job_type) {
        const jt = data.job_type || (data.is_reprinted ? 'repeat' : '') || (/\brep(?:rint|eat)?\.?/i.test(data.job_name || '') ? 'repeat' : 'new');
        results.push({ pass: jt === tc.expect.job_type, msg: `job_type: ${jt}`, expected: tc.expect.job_type });
      }

      // Print type
      if (tc.expect.print_type) {
        results.push({ pass: data.print_type === tc.expect.print_type, msg: `print_type: ${data.print_type}`, expected: tc.expect.print_type });
      }

      // Ink type NOT (e.g. UV coating ≠ UV ink)
      if (tc.expect.ink_type_not) {
        const it = data.ink_type || 'conventional';
        results.push({ pass: it !== tc.expect.ink_type_not, msg: `ink_type: ${it} (should NOT be ${tc.expect.ink_type_not})` });
      }

      // Components
      if (tc.expect.components) {
        const comps = data.components || [];
        tc.expect.components.forEach((ec, ci) => {
          const c = comps[ci];
          if (!c) { results.push({ pass: false, msg: `Component ${ci}: ไม่มี` }); return; }

          if (ec.component_type !== undefined) {
            results.push({ pass: c.component_type === ec.component_type, msg: `comp[${ci}].type: ${c.component_type}`, expected: ec.component_type });
          }
          if (ec.paper_code) {
            const pc = c.paper?.paper_code || '';
            if (ec.paper_code instanceof RegExp) {
              results.push({ pass: ec.paper_code.test(pc), msg: `comp[${ci}].paper: ${pc}`, expected: ec.paper_code.toString() });
            } else {
              results.push({ pass: pc === ec.paper_code, msg: `comp[${ci}].paper: ${pc}`, expected: ec.paper_code });
            }
          }
          if (ec.paper_gram) {
            const pg = String(c.paper?.paper_gram || '');
            results.push({ pass: pg === ec.paper_gram, msg: `comp[${ci}].gram: ${pg}`, expected: ec.paper_gram });
          }
          if (ec.color_outside) {
            const co = String(c.color?.outside ?? '');
            results.push({ pass: co === ec.color_outside, msg: `comp[${ci}].color_out: ${co}`, expected: ec.color_outside });
          }
          if (ec.color_inside !== undefined) {
            const ci2 = String(c.color?.inside ?? '');
            results.push({ pass: ci2 === ec.color_inside, msg: `comp[${ci}].color_in: ${ci2}`, expected: ec.color_inside });
          }
          if (ec.packaging_size) {
            const ps = c.packaging_size || {};
            ['width', 'length', 'depth'].forEach(dim => {
              if (ec.packaging_size[dim] !== undefined) {
                const v = String(ps[dim] ?? '');
                const exp = String(ec.packaging_size[dim]);
                results.push({ pass: v === exp || Number(v) === Number(exp), msg: `comp[${ci}].${dim}: ${v}`, expected: exp });
              }
            });
          }
          if (ec.box_type_id) {
            const bt = String(c.box_type_id || '');
            results.push({ pass: bt === ec.box_type_id, msg: `comp[${ci}].box_type: ${bt}`, expected: ec.box_type_id });
          }
          if (ec.component_name) {
            const cn = c.component_name || '';
            if (ec.component_name instanceof RegExp) {
              results.push({ pass: ec.component_name.test(cn), msg: `comp[${ci}].name: ${cn}`, expected: ec.component_name.toString() });
            }
          }
        });
      }

      // Corrugated
      if (tc.expect.corrugated_flute) {
        const cf = data.components?.[0]?.corrugated?.flute_type || '';
        results.push({ pass: cf === tc.expect.corrugated_flute, msg: `corrugated: ${cf}`, expected: tc.expect.corrugated_flute });
      }

      // Qty
      if (tc.expect.qty) {
        const q = data.qty || [];
        const match = JSON.stringify(q) === JSON.stringify(tc.expect.qty);
        results.push({ pass: match, msg: `qty: ${JSON.stringify(q)}`, expected: JSON.stringify(tc.expect.qty) });
      }
      if (tc.expect.qty_includes) {
        const q = data.qty || [];
        results.push({ pass: q.includes(tc.expect.qty_includes), msg: `qty includes ${tc.expect.qty_includes}: ${JSON.stringify(q)}` });
      }

      // Edition
      if (tc.expect.edition_count) {
        const en = data.edition_names?.length || 0;
        results.push({ pass: en === tc.expect.edition_count, msg: `editions: ${en}`, expected: tc.expect.edition_count });
      }
      if (tc.expect.edition_total) {
        const et = data.edition_total || (data.edition_qtys?.reduce((s, q) => s + q, 0)) || 0;
        results.push({ pass: et === tc.expect.edition_total, msg: `edition_total: ${et}`, expected: tc.expect.edition_total });
      }

      // F-codes
      if (tc.expect.f_codes) {
        const fc = data.f_codes?.map(f => f.f_code) || [];
        const match = JSON.stringify(fc) === JSON.stringify(tc.expect.f_codes);
        results.push({ pass: match, msg: `f_codes: ${JSON.stringify(fc)}`, expected: JSON.stringify(tc.expect.f_codes) });
      }

      // Component count
      if (tc.expect.component_count) {
        const cc = (data.components || []).length;
        results.push({ pass: cc === tc.expect.component_count, msg: `component_count: ${cc}`, expected: tc.expect.component_count });
      }

      // Coating
      if (tc.expect.has_coating) {
        const hasCoating = data.components?.some(c => c.addon?.some(a => a.type === 'coating'));
        results.push({ pass: !!hasCoating, msg: `has_coating: ${hasCoating}` });
      }
      if (tc.expect.coating_side) {
        const side = data.components?.[0]?.addon?.find(a => a.type === 'coating')?.side;
        results.push({ pass: side === tc.expect.coating_side, msg: `coating_side: ${side}`, expected: tc.expect.coating_side });
      }

      // Coating count
      if (tc.expect.coating_count_min) {
        const cc = (data.components || []).reduce((sum, c) => sum + (c.addon?.filter(a => a.type === 'coating')?.length || 0), 0);
        results.push({ pass: cc >= tc.expect.coating_count_min, msg: `coating_count: ${cc}`, expected: `>= ${tc.expect.coating_count_min}` });
      }

      // Foil stamp
      if (tc.expect.has_foilstamp) {
        const hasFoil = data.components?.some(c =>
          c.addon?.some(a => /foil/i.test(a.type || '')) ||
          /foil/i.test(JSON.stringify(data))
        );
        results.push({ pass: !!hasFoil, msg: `has_foilstamp: ${hasFoil}` });
      }

      // Packing
      if (tc.expect.packing_detail) {
        const pd = data.components?.[0]?.packing_detail || '';
        if (tc.expect.packing_detail instanceof RegExp) {
          results.push({ pass: tc.expect.packing_detail.test(pd), msg: `packing: "${pd}"`, expected: tc.expect.packing_detail.toString() });
        }
      }

      // Die cut
      if (tc.expect.is_diecut !== undefined) {
        results.push({ pass: !!data.is_diecut === tc.expect.is_diecut, msg: `is_diecut: ${data.is_diecut}`, expected: tc.expect.is_diecut });
      }

      // Other process
      if (tc.expect.has_other_process) {
        const has = data.other_process?.length > 0;
        results.push({ pass: has, msg: `other_process: ${data.other_process?.length || 0} items` });
      }

      // Remark
      if (tc.expect.remark) {
        const rm = data.remark || '';
        if (tc.expect.remark instanceof RegExp) {
          results.push({ pass: tc.expect.remark.test(rm), msg: `remark: "${rm}"`, expected: tc.expect.remark.toString() });
        }
      }

      // === Tally results ===
      const failedResults = results.filter(r => !r.pass);
      if (failedResults.length === 0) {
        console.log(`✅ PASS (${results.length} assertions)`);
        passed++;
      } else {
        console.log(`❌ FAIL (${failedResults.length}/${results.length} failed)`);
        failedResults.forEach(r => {
          console.log(`   ❌ ${r.msg}${r.expected ? ' (expected: ' + r.expected + ')' : ''}`);
        });
        failed++;
        errors.push({ case: tc.id, name: tc.name, failures: failedResults });
      }

    } catch (e) {
      console.log(`💥 ERROR: ${e.message}`);
      failed++;
      errors.push({ case: tc.id, name: tc.name, error: e.message });
    }
  }

  // === Summary ===
  console.log('\n' + '='.repeat(60));
  console.log(`  Results: ${passed} passed, ${failed} failed (${cases.length} total)`);
  console.log(`  Score: ${Math.round(passed / cases.length * 100)}%`);
  console.log('='.repeat(60));

  if (errors.length > 0) {
    console.log('\nFailed cases:');
    errors.forEach(e => {
      console.log(`  Case ${e.case}: ${e.name}`);
      if (e.error) console.log(`    Error: ${e.error}`);
      if (e.failures) e.failures.forEach(f => console.log(`    - ${f.msg}`));
    });
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

// Run
const caseArg = process.argv.find(a => a.startsWith('--case'));
const caseId = caseArg ? caseArg.split('=')[1] || process.argv[process.argv.indexOf(caseArg) + 1] : null;
runTests(caseId);
