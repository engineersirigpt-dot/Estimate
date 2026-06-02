/**
 * Pornchai RFQ Agent - Calculation Engine
 * Based on Sirivatana Interprint Estimate Packaging System v3.1
 */

// ============================================================
// CONSTANTS (from default.js)
// ============================================================
const CALC = {
  // Tolerances (mm)
  bleed: 3,
  // Corrugated
  corrugated_tolerance: 0.375, // inch — corrugated board smaller than paper by this amount per side
  corrugated_glued_cost: 0.0015, // B per sq.inch — ค่าทากาวประกบ
  afterpress_price_marking: 0, // % markup for afterpress (profit sharing)
  tolerance: {
    offset:   { gripper: 12, color_bar: 8,  paper_edge: 4 },
    flexo:    { gripper: 25, color_bar: 3,  paper_edge: 10 },
    jetpress: { gripper: 25, color_bar: 3,  paper_edge: 4 },
    konica:   { gripper: 35, color_bar: 3,  paper_edge: 15 },
  },

  // ===== MACHINES (จาก all spec machine Arunchai 29.7.65 + Excel แก้ไขเครื่อง spot UV ล่าสุด) =====
  machines: [
    // ============================================================
    // ตัด 1 (Cut 1) — Paper Size 820-840 x 1130-1150 mm
    // ============================================================
    {
      id: 'L244', name: 'Cut 1 - L244 (2 สี)', print_type: 'Offset', cut: 1,
      machineSize_type: 1,
      w_max_in: 32.28, l_max_in: 44.49, w_min_in: 18.11, l_min_in: 24.41,
      w_max_mm: 820, l_max_mm: 1143, w_min_mm: 460, l_min_mm: 620,
      print_w_max: 810, print_l_max: 1120, print_w_min: 460, print_l_min: 620,
      gsm_min: 40, gsm_max: 260, thickness_min: 0.04, thickness_max: 0.30,
      max_colors: 2, setup_min: 45,
      speed: 8000, component_types: [1, 2], sides: 1,
      has_coating: false, plate_size: '1130x900mm',
      paper_note: '40-260g (0.04-0.30mm)',
      remark: '2 สี พิมพ์ 1 หน้า',
      paper_types: ['AC','Dup','GA','K','MA','MCA','WC','B','FCY'],
    },
    {
      id: 'L444SP', name: 'Cut 1 - L444SP (4/4 สี)', print_type: 'Offset', cut: 1,
      machineSize_type: 1,
      w_max_in: 32.28, l_max_in: 44.49, w_min_in: 18.11, l_min_in: 24.41,
      w_max_mm: 820, l_max_mm: 1130, w_min_mm: 460, l_min_mm: 620,
      print_w_max: 810, print_l_max: 1120, print_w_min: 450, print_l_min: 610,
      gsm_min: 40, gsm_max: 210, thickness_min: 0.04, thickness_max: 0.21,
      max_colors: 4, setup_min: 45,
      speed: 8000, component_types: [1, 2], sides: 2,
      has_coating: false, plate_size: '1130x900mm',
      paper_note: '40-210g (0.04-0.21mm) พิมพ์ 2 หน้า กระดาษบาง',
      remark: 'Super Perfecting 4/4 พิมพ์ 2 หน้า',
      paper_types: ['AC','Dup','GA','K','MA','MCA','WC','B','FCY'],
    },
    {
      id: 'L444SPAPC', name: 'Cut 1 - L444SPAPC (4/4+APC)', print_type: 'Offset', cut: 1,
      machineSize_type: 1,
      w_max_in: 32.28, l_max_in: 45.275, w_min_in: 18.15, l_min_in: 24.41,
      w_max_mm: 820, l_max_mm: 1150, w_min_mm: 460, l_min_mm: 620,
      print_w_max: 810, print_l_max: 1140, print_w_min: 450, print_l_min: 610,
      gsm_min: 40, gsm_max: 230, thickness_min: 0.04, thickness_max: 0.23,
      max_colors: 4, setup_min: 45,
      speed: 8000, component_types: [1, 2], sides: 2,
      has_coating: false, plate_size: '1130x900mm',
      paper_note: '40-230g (0.04-0.23mm) การ์ดขาวได้ที่ 240แกรม พิมพ์ 2 หน้า',
      remark: 'Super Perfecting 4/4+APC พิมพ์ 2 หน้า',
      paper_types: ['AC','Dup','GA','K','MA','MCA','WC','B','FCY'],
    },
    {
      id: 'G844', name: 'Cut 1 - G844 C+IR (8+Coat)', print_type: 'Offset', cut: 1,
      machineSize_type: 1,
      w_max_in: 33, l_max_in: 45.275, w_min_in: 18.15, l_min_in: 24.41,
      w_max_mm: 840, l_max_mm: 1150, w_min_mm: 460, l_min_mm: 620,
      print_w_max: 820, print_l_max: 1140, print_w_min: 460, print_l_min: 620,
      gsm_min: 80, gsm_max: 700, thickness_min: 0.08, thickness_max: 1.00,
      max_colors: 8, setup_min: 45,
      speed: 15000, component_types: [1, 2], sides: 1,
      has_coating: true, coating_type: 'analog 60/80', plate_size: '1150x900mm',
      paper_note: '80-700g (0.08-1.00mm) พิมพ์ 1 หน้า + เคลือบ',
      remark: '8 สี + Coater (60/80 analog)',
      paper_types: ['AC','Dup','GA','K','MA','MCA','WC','B','FCY'],
    },
    // ============================================================
    // ตัด 2 (Cut 2) — Paper Size 720 x 1030 mm
    // DEFAULT: LS540 → L640C → G844
    // ============================================================
    {
      id: 'L640', name: 'Cut 2 - L640 (6 สี Waterless)', print_type: 'Offset', cut: 2,
      machineSize_type: 2,
      w_max_in: 28.25, l_max_in: 40.55, w_min_in: 14.17, l_min_in: 20.47,
      w_max_mm: 720, l_max_mm: 1030, w_min_mm: 360, l_min_mm: 520,
      print_w_max: 710, print_l_max: 1020, print_w_min: 350, print_l_min: 510,
      gsm_min: 40, gsm_max: 230, thickness_min: 0.04, thickness_max: 0.45,
      max_colors: 6, setup_min: 60,
      speed: 7000, component_types: [1, 2], sides: 1,
      has_coating: false, plate_size: '1030x800mm',
      paper_note: '40-230g (0.04-0.450mm) 40" waterless',
      remark: '6 สี waterless',
      paper_types: ['AC','Dup','GA','K','MA','MCA','WC','B','FCY'],
    },
    {
      id: 'CD440A', name: 'Cut 2 - CD440A (4+Coat)', print_type: 'Offset', cut: 2,
      machineSize_type: 2,
      w_max_in: 28.25, l_max_in: 40.50, w_min_in: 11.02, l_min_in: 16.54,
      w_max_mm: 720, l_max_mm: 1030, w_min_mm: 280, l_min_mm: 420,
      print_w_max: 710, print_l_max: 1020, print_w_min: 270, print_l_min: 410,
      gsm_min: 40, gsm_max: 600, thickness_min: 0.04, thickness_max: 0.62,
      max_colors: 4, setup_min: 50,
      speed: 8000, component_types: [1, 2], sides: 1,
      has_coating: true, coating_type: 'analog 60, สำรอง 60', plate_size: '1030x800mm',
      paper_note: '40-230-600g (0.04-0.23-0.62mm) พิมพ์ได้ทุกแกรม',
      remark: '4 สี + Coating',
      paper_types: ['AC','Dup','GA','K','MA','MCA','WC','B','FCY'],
    },
    {
      id: 'LS440', name: 'Cut 2 - LS440 (4 สี)', print_type: 'Offset', cut: 2,
      machineSize_type: 2,
      w_max_in: 28.25, l_max_in: 40.55, w_min_in: 14.17, l_min_in: 20.47,
      w_max_mm: 720, l_max_mm: 1030, w_min_mm: 360, l_min_mm: 520,
      print_w_max: 710, print_l_max: 1020, print_w_min: 350, print_l_min: 510,
      gsm_min: 40, gsm_max: 230, thickness_min: 0.04, thickness_max: 0.23,
      max_colors: 4, setup_min: 45,
      speed: 7000, component_types: [1, 2], sides: 1,
      has_coating: false, plate_size: '1030x800mm',
      paper_note: '40-230g (0.04-0.23mm) งาน Size เล็ก',
      remark: '4 สี งาน Size เล็ก',
      paper_types: ['AC','Dup','GA','K','MA','MCA','WC','B','FCY'],
    },
    {
      id: 'L540APC', name: 'Cut 2 - L540APC (5 สี)', print_type: 'Offset', cut: 2,
      machineSize_type: 2,
      w_max_in: 28.25, l_max_in: 40.55, w_min_in: 14.17, l_min_in: 20.47,
      w_max_mm: 720, l_max_mm: 1030, w_min_mm: 360, l_min_mm: 520,
      print_w_max: 705, print_l_max: 1020, print_w_min: 350, print_l_min: 510,
      gsm_min: 40, gsm_max: 230, thickness_min: 0.04, thickness_max: 0.23,
      max_colors: 5, setup_min: 30,
      speed: 8000, component_types: [1, 2], sides: 1,
      has_coating: false, plate_size: '1030x800mm',
      paper_note: '40-230g (0.04-0.23mm) กระดาษบาง',
      remark: '5 สี กระดาษบาง พิมพ์ 1 หน้า',
      paper_types: ['AC','Dup','GA','K','MA','MCA','WC','B','FCY'],
    },
    {
      id: 'LS540', name: 'Cut 2 - LS540 (5+Coat)', print_type: 'Offset', cut: 2,
      machineSize_type: 2,
      w_max_in: 28.25, l_max_in: 40.55, w_min_in: 14.17, l_min_in: 20.4,
      w_max_mm: 720, l_max_mm: 1030, w_min_mm: 360, l_min_mm: 520,
      print_w_max: 705, print_l_max: 1020, print_w_min: 350, print_l_min: 510,
      gsm_min: 200, gsm_max: 500, thickness_min: 0.20, thickness_max: 0.50,
      max_colors: 5, setup_min: 45,
      speed: 8000, component_types: [1, 2], sides: 1,
      has_coating: true, coating_type: 'analog 80, สำรอง 60 & 80', plate_size: '1030x800mm',
      paper_note: '200-500g (0.2-0.5mm) กระดาษหนา',
      remark: '5 สี + Coating กระดาษหนา — DEFAULT Packaging',
      paper_types: ['AC','Dup','GA','K','MA','MCA','WC','B'],
    },
    {
      id: 'L640C', name: 'Cut 2 - L640C (6+Coat)', print_type: 'Offset', cut: 2,
      machineSize_type: 2,
      w_max_in: 28.25, l_max_in: 40.55, w_min_in: 14.17, l_min_in: 20.4,
      w_max_mm: 720, l_max_mm: 1030, w_min_mm: 360, l_min_mm: 520,
      print_w_max: 705, print_l_max: 1020, print_w_min: 350, print_l_min: 510,
      gsm_min: 200, gsm_max: 500, thickness_min: 0.20, thickness_max: 0.50,
      max_colors: 6, setup_min: 45,
      speed: 8000, component_types: [1, 2], sides: 1,
      has_coating: true, coating_type: 'analog 80, สำรอง 60 & 80', plate_size: '1030x800mm',
      paper_note: '200-500g (0.2-0.5mm) กระดาษหนา',
      remark: '6 สี + Coating กระดาษหนา',
      paper_types: ['AC','Dup','GA','K','MA','MCA','WC','B'],
    },
    {
      id: 'L640UVAPC', name: 'Cut 2 - L640 UVAPC-B (6+2Coat UV)', print_type: 'Offset', cut: 2,
      machineSize_type: 2,
      w_max_in: 28.25, l_max_in: 40.55, w_min_in: 14.17, l_min_in: 20.47,
      w_max_mm: 720, l_max_mm: 1030, w_min_mm: 360, l_min_mm: 520,
      print_w_max: 705, print_l_max: 1020, print_w_min: 350, print_l_min: 510,
      gsm_min: 200, gsm_max: 500, thickness_min: 0.20, thickness_max: 0.50,
      max_colors: 6, setup_min: 45,
      speed: 7000, component_types: [1, 2], sides: 1,
      has_coating: true, coating_type: 'analog 60, สำรอง 100', has_uv: true, plate_size: '1030x800mm',
      paper_note: '200-500g (0.2-0.5mm) ระบบ UV strip plate กริ๊ปเปอร์ 48mm',
      remark: '6 สี + 2 Coating UV ย่อยร้อย 99.13 ด้านงานไม่ 100%',
      paper_types: ['AC','Dup','GA','K','MA','MCA','WC','B'],
    },
    {
      id: 'GL640', name: 'Cut 2 - GL640 Green Hybrid (6+Coat UV/IR)', print_type: 'Offset', cut: 2,
      machineSize_type: 2,
      w_max_in: 28.25, l_max_in: 40.55, w_min_in: 14.17, l_min_in: 20.47,
      w_max_mm: 720, l_max_mm: 1030, w_min_mm: 360, l_min_mm: 520,
      print_w_max: 710, print_l_max: 1020, print_w_min: 350, print_l_min: 510,
      gsm_min: 60, gsm_max: 700, thickness_min: 0.06, thickness_max: 0.80,
      max_colors: 6, setup_min: 45,
      speed: 16500, component_types: [1, 2], sides: 1,
      has_coating: true, coating_type: 'UV & IR Hybrid', plate_size: '1030x800mm',
      paper_note: '60-700g (0.06-0.80mm) Coater + UV & IR (Hybrid Press) ผ้ายาง 920x1040',
      remark: 'Hybrid Press including aluminum bar',
      paper_types: ['AC','Dup','GA','K','MA','MCA','WC','B','FCY'],
    },
    // ============================================================
    // ตัด 3 (Cut 3) — Paper Size 530 x 750 mm
    // ============================================================
    {
      id: 'LS1029', name: 'Cut 3 - LS1029P (10 สี)', print_type: 'Offset', cut: 3,
      machineSize_type: 3,
      w_max_in: 20.87, l_max_in: 29.53, w_min_in: 10.25, l_min_in: 14.17,
      w_max_mm: 530, l_max_mm: 750, w_min_mm: 260, l_min_mm: 360,
      print_w_max: 515, print_l_max: 735, print_w_min: 245, print_l_min: 345,
      gsm_min: 40, gsm_max: 450, thickness_min: 0.04, thickness_max: 0.45,
      max_colors: 10, setup_min: 45,
      speed: 7000, component_types: [1, 2], sides: 1,
      has_coating: false, plate_size: '740x605mm',
      paper_note: '40-450g (0.04-0.45mm)',
      remark: '10 สี',
      paper_types: ['AC','Dup','GA','K','MA','MCA','WC','B','FCY'],
    },
    // === Flexo ===
    {
      id: 'FLEXO', name: 'Flexo', print_type: 'Flexo',
      machineSize_type: 4,
      w_max_in: 57, l_max_in: 94.4, w_min_in: 20, l_min_in: 30,
      w_max_mm: 1448, l_max_mm: 2398, w_min_mm: 508, l_min_mm: 762,
      gsm_min: 100, gsm_max: 999, max_colors: 4, setup_min: 60,
      speed: 5000, component_types: [2, 3],
      remark: 'สำหรับกล่องลูกฟูก/packaging ขนาดใหญ่',
      paper_types: ['K','MA','WC','B'],
    },
    // === Digital ===
    {
      id: 'JETPRESS', name: 'Jet Press', print_type: 'JetPress',
      machineSize_type: 5,
      w_max_in: 23, l_max_in: 29.5, w_min_in: 8, l_min_in: 8,
      w_max_mm: 585, l_max_mm: 750, w_min_mm: 203, l_min_mm: 203,
      gsm_min: 64, gsm_max: 350, max_colors: 8, setup_min: 5,
      speed: 3600, component_types: [1],
      remark: 'Digital inkjet short-run',
      paper_types: ['AC','Dup','GA','K','MA','MCA','WC'],
    },
    {
      id: 'KONICA', name: 'Konica', print_type: 'Konica',
      machineSize_type: 6,
      w_max_in: 13, l_max_in: 19.2, w_min_in: 7, l_min_in: 7,
      w_max_mm: 330, l_max_mm: 487, w_min_mm: 178, l_min_mm: 178,
      gsm_min: 64, gsm_max: 300, max_colors: 8, setup_min: 5,
      speed: 2400, component_types: [1],
      remark: 'Digital toner short-run',
      paper_types: ['AC','Dup','GA','MA','MCA'],
    },
  ],

  // Print type configs
  printTypeConfig: {
    Offset:   { color_options: [1,2,3,4,5,6,7,8], default_colors: 4, has_uv: true },
    Flexo:    { color_options: [1,2,3,4], default_colors: 2, has_uv: false },
    JetPress: { color_options: [4], default_colors: 4, has_uv: false },
    Konica:   { color_options: [4], default_colors: 4, has_uv: false },
  },

  // Machine print area sizes (mm) - max printable area per machine
  sheets: {
    offset: [
      { name: 'Cut 2 (LS540)', w: 720, l: 1020, machine: 'LS540' },
      { name: 'Cut 1 (G844)', w: 840, l: 1150, machine: 'G844' },
      { name: 'Cut 3 (LS1029)', w: 530, l: 750, machine: 'LS1029' },
    ],
    flexo: [{ name: 'Flexo', w: 1448, l: 2398, machine: 'FLEXO' }],
    jetpress: [{ name: 'Jet Press', w: 585, l: 750, machine: 'JETPRESS' }],
    konica: [{ name: 'Konica', w: 330, l: 487, machine: 'KONICA' }],
  },

  // Standard paper sizes from database (scraped from real RFQ data)
  // w_mm/l_mm = trimmed paper size (for layout), roll_w/roll_l = raw roll size in inches (for weight)
  std_paper_sizes: [
    // AC (Art Card)
    { paper_code: 'AC', w_mm: 914.4, l_mm: 685.8, w_in: 36, l_in: 27, roll_w: 36, roll_l: 27 },
    { paper_code: 'AC', w_mm: 1092.2, l_mm: 749.3, w_in: 43, l_in: 29.5, roll_w: 43, roll_l: 29.5 },
    { paper_code: 'AC', w_mm: 838.2, l_mm: 914.4, w_in: 33, l_in: 36, roll_w: 33, roll_l: 36 },
    // AC C1s (Art Card Coated 1 Side) — most used
    { paper_code: 'AC C1s', w_mm: 914.4, l_mm: 635, w_in: 36, l_in: 25, roll_w: 36, roll_l: 25 },
    { paper_code: 'AC C1s', w_mm: 635, l_mm: 914.4, w_in: 25, l_in: 36, roll_w: 25, roll_l: 36 },
    { paper_code: 'AC C1s', w_mm: 711.2, l_mm: 1016, w_in: 28, l_in: 40, roll_w: 31, roll_l: 43 },
    { paper_code: 'AC C1s', w_mm: 787.4, l_mm: 1092.2, w_in: 31, l_in: 43, roll_w: 31, roll_l: 43 },
    { paper_code: 'AC C1s', w_mm: 787.4, l_mm: 363.22, w_in: 31, l_in: 14.3, roll_w: 31, roll_l: 43 },
    { paper_code: 'AC C1s', w_mm: 457.2, l_mm: 635, w_in: 18, l_in: 25, roll_w: 36, roll_l: 25 },
    { paper_code: 'AC C1s', w_mm: 393.7, l_mm: 546.1, w_in: 15.5, l_in: 21.5, roll_w: 31, roll_l: 43 },
    { paper_code: 'AC C1s', w_mm: 533.4, l_mm: 749.3, w_in: 21, l_in: 29.5, roll_w: 43, roll_l: 31 },
    { paper_code: 'AC C1s', w_mm: 546.1, l_mm: 393.7, w_in: 21.5, l_in: 15.5, roll_w: 43, roll_l: 31 },
    { paper_code: 'AC C1s', w_mm: 889, l_mm: 749.3, w_in: 35, l_in: 29.5, roll_w: 35, roll_l: 29.5 },
    { paper_code: 'AC C1s', w_mm: 1092.2, l_mm: 647.7, w_in: 43, l_in: 25.5, roll_w: 43, roll_l: 25.5 },
    // AC C2s (Art Card Coated 2 Sides)
    { paper_code: 'AC C2s', w_mm: 635, l_mm: 914.4, w_in: 25, l_in: 36, roll_w: 25, roll_l: 36 },
    { paper_code: 'AC C2s', w_mm: 914.4, l_mm: 635, w_in: 36, l_in: 25, roll_w: 36, roll_l: 25 },
    { paper_code: 'AC C2s', w_mm: 457.2, l_mm: 635, w_in: 18, l_in: 25, roll_w: 36, roll_l: 25 },
    // MA (Matt Art)
    { paper_code: 'MA', w_mm: 1016, l_mm: 711.2, w_in: 40, l_in: 28, roll_w: 43, roll_l: 31 },
    { paper_code: 'MA', w_mm: 330.2, l_mm: 482.6, w_in: 13, l_in: 19, roll_w: 31, roll_l: 43 },
    // Duplex GBB
    { paper_code: 'Dup GBB', w_mm: 711.2, l_mm: 1016, w_in: 28, l_in: 40, roll_w: 31, roll_l: 43, is_default: true },
    { paper_code: 'Dup GBB', w_mm: 889, l_mm: 990.6, w_in: 35, l_in: 39, roll_w: 35, roll_l: 39 },
    { paper_code: 'Dup GBB', w_mm: 787.4, l_mm: 952.5, w_in: 31, l_in: 37.5, roll_w: 31, roll_l: 37.5 },
    { paper_code: 'Dup GBB', w_mm: 939.8, l_mm: 717.55, w_in: 37, l_in: 28.25, roll_w: 37, roll_l: 28.25 },
    { paper_code: 'Dup GBB', w_mm: 889, l_mm: 546.1, w_in: 35, l_in: 21.5, roll_w: 35, roll_l: 21.5 },
    { paper_code: 'Dup GBB', w_mm: 889, l_mm: 363.22, w_in: 35, l_in: 14.3, roll_w: 35, roll_l: 43 },
    { paper_code: 'Dup GBB', w_mm: 1092.2, l_mm: 647.7, w_in: 43, l_in: 25.5, roll_w: 43, roll_l: 25.5 },
    { paper_code: 'Dup GBB', w_mm: 787.4, l_mm: 363.22, w_in: 31, l_in: 14.3, roll_w: 31, roll_l: 43 },
    { paper_code: 'Dup GBB', w_mm: 787.4, l_mm: 1092.2, w_in: 31, l_in: 43, roll_w: 31, roll_l: 43 },
    { paper_code: 'Dup GBB', w_mm: 889, l_mm: 1092.2, w_in: 35, l_in: 43, roll_w: 35, roll_l: 43 },
    { paper_code: 'Dup GBB', w_mm: 635, l_mm: 889, w_in: 25, l_in: 35, roll_w: 25, roll_l: 35 },
    { paper_code: 'Dup GBB', w_mm: 889, l_mm: 914.4, w_in: 35, l_in: 36, roll_w: 35, roll_l: 36 },
    { paper_code: 'Dup GBB', w_mm: 635, l_mm: 990.6, w_in: 25, l_in: 39, roll_w: 25, roll_l: 39 },
    { paper_code: 'Dup GBB', w_mm: 1092.2, l_mm: 1016, w_in: 43, l_in: 40, roll_w: 43, roll_l: 40 },
    // Duplex BBB
    { paper_code: 'Dup BBB', w_mm: 889, l_mm: 1092.2, w_in: 35, l_in: 43, roll_w: 35, roll_l: 43 },
    { paper_code: 'Dup BBB', w_mm: 787.4, l_mm: 1092.2, w_in: 31, l_in: 43, roll_w: 31, roll_l: 43 },
    { paper_code: 'Dup BBB', w_mm: 393.7, l_mm: 546.1, w_in: 15.5, l_in: 21.5, roll_w: 31, roll_l: 43 },
    { paper_code: 'Dup BBB', w_mm: 635, l_mm: 889, w_in: 25, l_in: 35, roll_w: 25, roll_l: 35 },
    // Duplex WBB
    { paper_code: 'Dup WBB', w_mm: 393.7, l_mm: 546.1, w_in: 15.5, l_in: 21.5, roll_w: 31, roll_l: 43 },
    { paper_code: 'Dup WBB', w_mm: 787.4, l_mm: 1092.2, w_in: 31, l_in: 43, roll_w: 31, roll_l: 43 },
    { paper_code: 'Dup WBB', w_mm: 914.4, l_mm: 635, w_in: 36, l_in: 25, roll_w: 36, roll_l: 25 },
    // Duplex plain
    { paper_code: 'Dup', w_mm: 889, l_mm: 914.4, w_in: 35, l_in: 36, roll_w: 35, roll_l: 36 },
    // Other paper types
    { paper_code: 'B', w_mm: 1059.94, l_mm: 698.5, w_in: 41.73, l_in: 27.5, roll_w: 41.73, roll_l: 27.5 },
    { paper_code: 'FCY', w_mm: 1059.94, l_mm: 699.77, w_in: 41.73, l_in: 27.55, roll_w: 41.73, roll_l: 27.55 },
    { paper_code: 'GA', w_mm: 444.5, l_mm: 304.8, w_in: 17.5, l_in: 12, roll_w: 35, roll_l: 24 },
    { paper_code: 'GY', w_mm: 482.6, l_mm: 330.2, w_in: 19, l_in: 13, roll_w: 41.5, roll_l: 27.5 },
    { paper_code: 'K', w_mm: 882.65, l_mm: 501.65, w_in: 34.75, l_in: 19.75, roll_w: 34.75, roll_l: 19.75 },
    { paper_code: 'KI', w_mm: 838.2, l_mm: 1143, w_in: 33, l_in: 45, roll_w: 35, roll_l: 47 },
    { paper_code: 'KS', w_mm: 889, l_mm: 596.9, w_in: 35, l_in: 23.5, roll_w: 35, roll_l: 47 },
    { paper_code: 'KS', w_mm: 930.15, l_mm: 520.7, w_in: 36.62, l_in: 20.5, roll_w: 36.62, roll_l: 20.5 },
    { paper_code: 'PP-CKT', w_mm: 330.2, l_mm: 482.6, w_in: 13, l_in: 19, roll_w: 13, roll_l: 19 },
    { paper_code: 'PP-GKT', w_mm: 330.2, l_mm: 482.6, w_in: 13, l_in: 19, roll_w: 13, roll_l: 19 },
    { paper_code: 'PP-MKT', w_mm: 330.2, l_mm: 482.6, w_in: 13, l_in: 19, roll_w: 13, roll_l: 19 },
    { paper_code: 'WF', w_mm: 609.6, l_mm: 889, w_in: 24, l_in: 35, roll_w: 24, roll_l: 35 },
  ],
  // Plate cost
  plate_price_per_color: 800,     // THB/color (Offset)
  plate_cut1_add: 50,             // THB extra for Cut 1
  plate_reprint_factor: 0.5,      // 50% reduction for reprint
  plate_set_per_sheets: 100000,   // new plate set every 100k sheets
  flexo_polymer_price: 6.53,      // THB/sq.inch
  flexo_reprint_polymer: 5.94,
  // Print
  uv_ink_factor: 2.5,
  // Paper
  paper_markup_default: 10,       // %
  paper_markup_import: 13,        // %
  paper_markup_profit_sharing: 18, // %
  formula_value: 1550000,         // for weight: gram / 1,550,000 * W_in * L_in
  // Waste
  waste_base_offset: 300,
  waste_base_digital: 150,
  waste_per_extra_color: 50,
  waste_max_colors_before_extra: 4,
  waste_reduce_digital: 30,       // % reduction for digital
  // Color Limit Waste (ลิมิตสี) — extra waste when enabled
  color_limit_waste: {
    offset:   { base: 300, per_color: 50 },  // +300 base, +50 per color > 4
    flexo:    { base: 300, per_color: 50 },
    jetpress: { base: 150, per_color: 20 },
    konica:   { base: 150, per_color: 20 },
  },
  // Profit sharing
  profit_sharing: {
    plate_ppu: 1875,
    paper_markup: 18,
    print_rate: 0.14,
    print_min: 1400,
    print_min_qty: 10000,
    afterpress_markup: 20,
    material_markup: 25,
    outsource_markup: 25,
    packing_markup: 25,
    delivery_markup: 20,
    total_markup: 5,
    total_min: 5000,
  },
  // Packing
  packing: {
    paperband_price: 0.5,
    paperband_qty: 100,
    kraftwrap_price: 5,
    kraftwrap_max_weight: 5,
    kraftwrap_max_height: 300,
    carton_print_price: 3,
    carton_markup: 15,
    carton_max_weight: 15,
    carton_corrugated_markup: 10,
    pallet_domestic: 400,
    pallet_abroad: 700,
    pallet_mif: 1100,
    pallet_max_weight: 750,
    pallet_max_height_inch: 44,
    pallet_empty_weight: 25,
  },
  // Delivery
  delivery_rate_per_ton: 1700,
  delivery_min: 1700,
  // Tax
  tax_percent: 3,
  marking_special: 7,
  // Block Diecut
  reprinted_block: 500, // THB — ค่าบล็อคงาน reprint (ใช้บล็อคเดิม)
  // Corrugated
  corrugated_markup: 10, // % — markup ราคาลูกฟูก (default from legacy system)
};

// ============================================================
// MASTER DATA CACHE
// ============================================================
let masterData = {
  // Original 8
  price_info: null,
  waste_info: null,
  min_price_info: null,
  delivery_rate_info: null,
  coating_info: null,
  paper_info: null,
  corrugated_info: null,
  marking_price_info: null,
  // A2: Additional 13 master data types
  foilstamp_info: null,
  blockstamp_info: null,
  special_ink_info: null,
  jetpress_info: null,
  konica_info: null,
  std_paper_info: null,
  paper_code_info: null,
  process_type_info: null,
  price_type_info: null,
  exchange_rate_info: null,
  box_template_info: null,
  machine_info: null,
  paper_gram_info: null,
  // Machine standard paper sizes (from legacy system DB)
  machine_std_paper_info: null,
  // Block diecut rates by size
  blockdiecut_info: null,
};

// === defaultData (from legacy js_data_default.js) ===
// Sync date: 2026-04-07. Stored locally at data/master/default_data.json
// ใช้สำหรับ foil stamp, emboss/deboss, coating, markup, tolerance ฯลฯ
let defaultData = {
  // Fallback values (ตรง legacy) — จะถูก override โดย loadDefaultData()
  film_rate: 1.25,
  film_min_cost: 120,
  foil_width_tolerance: 0.5,
  foil_length_tolerance: 1,
  foilstamp_price: 0.8,
  block_foilstamp_min_cost: 70,
  bossing_price: 0.8,
  reprinted_block: 500,
  addon_labor_price_marking: 20,
  afterpress_price_marking: 0,
  material_price_marking: 0,
  corrugated_glued_cost: 0.0015,
  corrugated_tolerance: 0.375,
  tax_percent: 3,
};

async function loadDefaultData() {
  try {
    const r = await fetch('/api/master-data/default_data');
    if (r.ok) {
      const json = await r.json();
      defaultData = { ...defaultData, ...json };
      return defaultData;
    }
  } catch (e) { console.warn('[loadDefaultData] failed:', e.message); }
  return defaultData;
}

async function loadCalcMasters() {
  const types = Object.keys(masterData);
  const results = await Promise.allSettled(
    types.map(t => fetch(`/api/estimate/master_data?type=${t}`).then(r => r.json()))
  );
  types.forEach((t, i) => {
    if (results[i].status === 'fulfilled' && Array.isArray(results[i].value) && results[i].value.length > 0) {
      masterData[t] = results[i].value;
    }
  });
  // Load defaultData (config values for foil/emboss/markup/tolerance)
  await loadDefaultData();
  return masterData;
}

// ============================================================
// MASTER DATA LOOKUPS
// ============================================================
function findPriceTier(qty) {
  if (!masterData.price_info) return null;
  return masterData.price_info.find(r => qty >= r.min_qty && qty <= r.max_qty) || masterData.price_info[masterData.price_info.length - 1];
}

function findWasteTier(qty, printType = 1) {
  if (!masterData.waste_info) return null;
  const filtered = masterData.waste_info.filter(w => w.print_type === printType || !w.print_type);
  return filtered.find(r => qty >= r.min_qty && qty <= r.max_qty) || filtered[filtered.length - 1];
}

/**
 * Find standard paper sizes for a given paper code
 * Returns array of { w_mm, l_mm, w_in, l_in }
 */
function findStdPaperSizes(paperCode) {
  if (!paperCode) return [];
  return CALC.std_paper_sizes.filter(p => p.paper_code === paperCode);
}

function findMinPrice(type, qty) {
  if (!masterData.min_price_info) return 0;
  const items = masterData.min_price_info.filter(r => r.type === type);
  const match = items.find(r => qty >= r.min_qty && qty <= r.max_qty);
  return match ? match.min_price : 0;
}

function findMarkingPercent(qty) {
  if (!masterData.marking_price_info) return 0;
  const match = masterData.marking_price_info.find(r => qty >= r.min_qty && qty <= r.max_qty);
  return match ? (match.marking_percent || 0) : 0;
}

function findCoatingRate(coatingCode) {
  if (!masterData.coating_info) return null;
  return masterData.coating_info.find(c => c.coating_code === coatingCode || c.coating_type === coatingCode);
}

function findDeliveryRate(destinationId, weight) {
  if (!masterData.delivery_rate_info) return null;
  return masterData.delivery_rate_info.find(r =>
    r.destination_id === parseInt(destinationId) &&
    weight >= r.min_weight_kg && weight <= r.max_weight_kg
  );
}

// ============================================================
// A1: MACHINE SELECTION
// ============================================================
function getMachine(machineId) {
  return CALC.machines.find(m => m.id === machineId) || null;
}

function getMachinesForPrintType(printType) {
  return CALC.machines.filter(m => m.print_type.toLowerCase() === printType.toLowerCase());
}

function getAllMachines() {
  return CALC.machines;
}

/**
 * Get standard paper sizes for a machine (from machine_std_paper_info master data)
 * Returns array of { id, name, w_in, l_in, w_mm, l_mm, ref_w_in, ref_l_in, split, is_default }
 */
function getStdPapersForMachine(machineId) {
  const machine = getMachine(machineId);
  if (!machine || !masterData.machine_std_paper_info) return [];
  const mst = machine.machineSize_type;
  if (!mst) return [];
  const seen = new Set();
  return masterData.machine_std_paper_info
    .filter(p => p.machineSize_type === mst && p.std_paper_status)
    .map(p => ({
      id: p.std_paper_id,
      name: p.std_paper_name || `${p.std_paper_size_width_in} x ${p.std_paper_size_length_in}`,
      w_in: p.std_paper_size_width_in,
      l_in: p.std_paper_size_length_in,
      w_mm: p.std_paper_size_width_mm,
      l_mm: p.std_paper_size_length_mm,
      ref_w_in: p.std_paper_size_ref_width_in,
      ref_l_in: p.std_paper_size_ref_length_in,
      split: p.std_paper_split || 1,
      is_default: p.is_default,
    }))
    .filter(p => { const k = `${p.w_in}x${p.l_in}`; if (seen.has(k)) return false; seen.add(k); return true; });
}

/**
 * Auto-select best machine based on paper GSM, open size, component type, and colors
 */
function selectMachine(component, printType = 'Offset') {
  const gsm = parseInt(component.paper?.paper_gram || component.paper?.gsm) || 200;
  const compType = parseInt(component.component_type) || 1;
  const colorsOut = parseInt(component.color?.outside) || 4;
  const unfolded = calcUnfoldedSize(component.packaging_size, component.box_type);

  const candidates = getMachinesForPrintType(printType).filter(m => {
    // GSM range check
    if (gsm < m.gsm_min || gsm > m.gsm_max) return false;
    // Component type check
    if (!m.component_types.includes(compType)) return false;
    // Color limit check
    if (colorsOut > m.max_colors) return false;
    // Size check: open size must fit within machine max (but NOT min check)
    // Machine min refers to minimum PAPER size the machine can feed,
    // not the open/unfolded size. A small box can be printed multiple-up on a large paper.
    // Legacy system does not check size when selecting machine — just defaults to Cut 2.
    if (unfolded) {
      const openW = unfolded.openW;
      const openL = unfolded.openL;
      // At least one orientation must fit within machine max
      const fitsNormal = openW <= m.w_max_mm && openL <= m.l_max_mm;
      const fitsRotated = openL <= m.w_max_mm && openW <= m.l_max_mm;
      if (!fitsNormal && !fitsRotated) return false;
    }
    return true;
  });

  if (candidates.length === 0) return null;

  // Default: LS540 → L640C → G844 (packaging priority order)
  if (printType === 'Offset') {
    const ls540 = candidates.find(m => m.id === 'LS540');
    if (ls540) return ls540;
    const l640c = candidates.find(m => m.id === 'L640C');
    if (l640c) return l640c;
    const g844 = candidates.find(m => m.id === 'G844');
    if (g844) return g844;
  }

  // For non-Offset or fallback: prefer smallest machine that fits
  candidates.sort((a, b) => (a.w_max_mm * a.l_max_mm) - (b.w_max_mm * b.l_max_mm));
  return candidates[0];
}

/**
 * Validate machine constraints for a component
 */
function validateMachine(machineId, component) {
  const m = getMachine(machineId);
  if (!m) return { valid: false, errors: ['ไม่พบเครื่องพิมพ์'] };

  const errors = [];
  const gsm = parseInt(component.paper?.paper_gram || component.paper?.gsm) || 0;
  const colorsOut = parseInt(component.color?.outside) || 0;
  const compType = parseInt(component.component_type) || 1;

  if (gsm < m.gsm_min) errors.push(`GSM ต่ำกว่า ${m.gsm_min} (min ของ ${m.name})`);
  if (gsm > m.gsm_max) errors.push(`GSM เกิน ${m.gsm_max} (max ของ ${m.name})`);
  if (colorsOut > m.max_colors) errors.push(`สีเกิน ${m.max_colors} สี (max ของ ${m.name})`);
  if (!m.component_types.includes(compType)) errors.push(`${m.name} ไม่รองรับ component type ${compType}`);

  const unfolded = calcUnfoldedSize(component.packaging_size, component.box_type);
  if (unfolded) {
    const openW = unfolded.openW, openL = unfolded.openL;
    const fitsNormal = openW <= m.w_max_mm && openL <= m.l_max_mm;
    const fitsRotated = openL <= m.w_max_mm && openW <= m.l_max_mm;
    if (!fitsNormal && !fitsRotated) errors.push(`ขนาดเกินพื้นที่พิมพ์ ${m.name} (${m.w_max_mm}x${m.l_max_mm}mm)`);
  }

  return { valid: errors.length === 0, errors, machine: m };
}

// A2: Additional master data lookups
function findFoilStampColor(code) {
  if (!masterData.foilstamp_info) return null;
  return masterData.foilstamp_info.find(f => f.foil_code === code || f.foil_color === code);
}

function findSpecialInkInfo(inkType) {
  if (!masterData.special_ink_info) return null;
  return masterData.special_ink_info.find(s => s.ink_type === inkType || s.ink_code === inkType);
}

function findPaperCode(paperType, gsm) {
  if (!masterData.paper_code_info) return null;
  return masterData.paper_code_info.find(p => p.paper_type === paperType && p.gsm === parseInt(gsm));
}

function findExchangeRate(currency) {
  if (!masterData.exchange_rate_info) return null;
  return masterData.exchange_rate_info.find(e => e.currency === currency);
}

function findProcessType(typeId) {
  if (!masterData.process_type_info) return null;
  return masterData.process_type_info.find(p => p.process_type_id === parseInt(typeId));
}

function findStdPaperSize(machineId) {
  if (!masterData.std_paper_info) return null;
  return masterData.std_paper_info.filter(p => p.machine_id === machineId);
}

// ============================================================
// LAYOUT CALCULATION
// ============================================================

/**
 * Corrugated board rounding (matching legacy js_commonFunction.js)
 * - roundToEven: ปัดขึ้นเป็นเลขคู่ (inch) — ใช้กับด้านขวาง flute
 * - roundDecimal: ปัดขึ้นเป็น 0.5 (inch) — ใช้กับด้านตาม flute
 */
function roundToEven(value) {
  return Number.isNaN(value) ? 0 : 2 * Math.round(Math.ceil(value) / 2);
}
function roundDecimal(value) {
  return Number.isNaN(value) ? 0 : Math.ceil(value * 2) / 2;
}

/**
 * Calculate corrugated board size after rounding
 * ระบบเก่า: ปัดขนาดกระดาษลูกฟูกตามทิศ flute + laying orientation
 * @param {number} wIn - layout width (inches)
 * @param {number} lIn - layout length (inches)
 * @param {string} fluteSide - 'short_side' or 'long_side'
 * @param {string} laying - 'vertical' or 'horizontal'
 * @param {boolean} isManual - ถ้า manual ไม่ปัด
 * @returns {{ wIn, lIn, wMm, lMm }} - rounded board size
 */
function calcCorrugatedBoardSize(wIn, lIn, fluteSide, laying, isManual, compType) {
  // Step 1: Round layout size first (to standard corrugated board sizes)
  let rw = wIn, rl = lIn;
  if (!isManual) {
    if (fluteSide === 'short_side') {
      if (laying === 'vertical') { rw = roundToEven(wIn); rl = roundDecimal(lIn); }
      else { rw = roundDecimal(wIn); rl = roundToEven(lIn); }
    } else { // long_side (default)
      if (laying === 'vertical') { rw = roundDecimal(wIn); rl = roundToEven(lIn); }
      else { rw = roundToEven(wIn); rl = roundDecimal(lIn); }
    }
  }

  // Step 2: Subtract tolerance AFTER rounding (board smaller than paper)
  // For component type 2 (ประกบลูกฟูก): board = rounded layout - 0.375" per side
  const tol = (compType === 2) ? (CALC.corrugated_tolerance || 0.375) : 0;
  const bw = Math.max(rw - tol, 0);
  const bl = Math.max(rl - tol, 0);

  return {
    wIn: parseFloat(bw.toFixed(3)),
    lIn: parseFloat(bl.toFixed(3)),
    wMm: parseFloat((bw * 25.4).toFixed(3)),
    lMm: parseFloat((bl * 25.4).toFixed(3)),
    tolerance: tol,
    // Keep rounded layout size for reference
    layoutRoundedW: parseFloat(rw.toFixed(3)),
    layoutRoundedL: parseFloat(rl.toFixed(3)),
  };
}

/**
 * Calculate unfolded (open/flat) size of a box blank
 * Based on template-specific formulas from function_estimate_layout.js
 */
function calcUnfoldedSize(sz, boxType) {
  const w = parseFloat(sz.width) || 0;
  const l = parseFloat(sz.length) || 0;
  const d = parseFloat(sz.depth) || 0;
  const b = CALC.bleed;
  const gf = parseFloat(sz.glue_flap) || 15;
  const tf = parseFloat(sz.tuck_flap) || 15;
  const df = parseFloat(sz.dust_flap) || 0;
  const templateId = parseInt(boxType?.type_id) || 1;

  if (!w || !l) return null;

  let openW, openL;
  const ol = parseFloat(sz.ol) || 0;

  // Template-specific formulas (matching original system's setCalculateOpenSize)
  switch (templateId) {
    case 1: // Reverse Tuck End - ฝาคู่แบบฝาสลับ
    default:
      openW = 2 * (w + tf) + d;
      openL = 2 * (w + l) + gf;
      break;
    case 2: // Straight Tuck End - ฝาคู่แบบฝาตรง
      openW = 2 * (w + tf) + d;
      openL = 2 * (w + l) + gf;
      break;
    case 3: // TTSLB - ออโต้ล็อคแบบหูขัด
      openW = tf + w + d + w / 2 + ol;
      openL = 2 * (w + l) + gf;
      break;
    case 4: // TTAB - ออโต้ล็อคแบบทากาว
      openW = tf + w + d + w / 2 + ol;
      openL = 2 * (w + l) + gf;
      break;
    case 5: // Double Glue Side Wall - กล่องฝาครอบ
      openW = w + 4 * d;
      openL = l + 4 * d + 2 * df;
      break;
    case 6: // Frame-Vue Tray - ฝาครอบมีขอบ
      openW = w + 4 * d + 2 * df + 2 * ol;
      openL = l + 4 * d + 2 * df + 2 * ol;
      break;
    case 7: // Four Corner Beers Tray - กล่องเบนโตะ
      openW = 2 * (l + df) + w;
      openL = 2 * (l + d) + l;
      break;
    case 8: // Gable Top - กล่องทรงจั่ว
      openW = tf + 2 * d + w / 2 + ol;
      openL = 2 * (w + l) + gf;
      break;
    case 9: // Sleeve - ปลอกกล่อง
      openW = d;
      openL = 2 * (w + l) + gf;
      break;
    case 10: // Pillow Box - กล่องทรงหมอน
      openW = l + d;
      openL = 2 * w + gf;
      break;
    case 11: // Seal End - กล่องฝาปิดแบบทากาว
      openW = 2 * w + d;
      openL = 2 * (w + l) + gf;
      break;
    case 12: // Custom - กำหนดเอง (use open_size directly if set, default = w x l)
      openW = parseFloat(sz.open_w) || w;
      openL = parseFloat(sz.open_l) || l;
      break;
  }

  return {
    openW: openW + 2 * b,  // add bleed both sides
    openL: openL + 2 * b,
    rawW: openW,
    rawL: openL,
  };
}

/**
 * Calculate area for weight computation (mm^2) - per template
 */
function calcBoxArea(sz, boxType) {
  const w = parseFloat(sz.width) || 0;
  const l = parseFloat(sz.length) || 0;
  const d = parseFloat(sz.depth) || 0;
  const gf = parseFloat(sz.glue_flap) || 15;
  const tf = parseFloat(sz.tuck_flap) || 15;
  const df = parseFloat(sz.dust_flap) || 0;
  const templateId = parseInt(boxType?.type_id) || 1;

  // Template-specific area formulas (B4)
  switch (templateId) {
    case 1: default:
      return (d * gf) + (2 * l * d) + (2 * w * d) + (4 * df * w) + (2 * l * (tf + w));
    case 2: // Roll-end front tuck
      return (2*d + 2*w + gf) * (tf + l + 2*d + df);
    case 3: // Auto-bottom
      return (2*d + 2*w + gf) * (tf + l + d + d/2 + w/2);
    case 4: // Sleeve
      return (2*d + 2*w + gf) * l;
    case 5: // Snap-lock bottom
      return (2*d + 2*w + gf) * (tf + l + 2*d);
    case 6: // Display box
      return (2*w + 2*d + gf) * (2*l + 2*d + tf);
    case 7: // Mailer
      return (2*d + 2*w + gf) * (2*l + 3*d);
    case 8: // Hexagonal
      return (6*w + gf) * (l + 2*d);
    case 9: // Pillow box
      return (Math.PI * w + gf) * (l + 2*tf);
    case 10: // Gable top
      return (2*d + 2*w + gf) * (l + d + tf + d);
    case 11: // Tray
      return (2*d + w) * (2*d + l);
    case 12: // Rigid box
      return (2*d + w + gf) * (2*d + l);
  }
}

/**
 * Calculate overlap savings per template
 * Overlap = กล่องข้างเคียงแชร์ขอบได้ (glue flap, tuck flap)
 * Returns { wSave, lSave } in mm — savings per additional piece in each direction
 */
function calcOverlapSaving(boxType, sz) {
  const tid = parseInt(boxType?.type_id) || 0;
  const w = parseFloat(sz.width) || 0;
  const tf = parseFloat(sz.tuck_flap) || 0;
  const gf = parseFloat(sz.glue_flap) || 0;
  const ol = parseFloat(sz.ol) || 0;

  switch (tid) {
    case 1: // Reverse Tuck End — W shares (w+tf), L shares gf
    case 2: // Straight Tuck End — same structure
      return { wSave: w + tf, lSave: gf };
    case 3: // TTSLB — W shares (w/2+ol), L shares gf
    case 4: // TTAB — same structure
      return { wSave: w / 2 + ol, lSave: gf };
    default:
      return { wSave: 0, lSave: 0 }; // No overlap for other templates
  }
}

/**
 * Try all layout orientations for a given sheet and open size
 * Supports both Straight (simple division) and Overlap (shared edge) layouts
 */
function tryLayout(sheetW, sheetL, openW, openL, tol, overlapW, overlapL) {
  const results = [];
  const oW = overlapW || 0; // overlap saving in W direction (mm)
  const oL = overlapL || 0; // overlap saving in L direction (mm)

  // Try paper as-is first (matching legacy: default orientation from DB)
  // Then try rotated sheet (like legacy "สลับด้าน layout")
  for (const [sw, sl, sheetRotated] of [[sheetW, sheetL, false], [sheetL, sheetW, true]]) {
    const pw = sw - tol.paper_edge * 2;
    const pl = sl - tol.gripper - tol.color_bar;

    // Only try normal box orientation (not rotated box) — matching legacy
    // Legacy never rotates the box, only the sheet via "สลับด้าน"
    const orientations = [
      { bw: openW, bl: openL, ow: oW, ol: oL, rotated: sheetRotated },
    ];

    for (const { bw, bl, ow, ol: olSave, rotated } of orientations) {
      // === Straight layout: simple floor division ===
      const nwS = Math.floor(pw / bw);
      const nlS = Math.floor(pl / bl);
      if (nwS > 0 && nlS > 0) {
        results.push({ sw, sl, nw: nwS, nl: nlS, ups: nwS * nlS, rotated, layingType: 'straight' });
      }

      // === Overlap layout: first piece = full, each additional = (full - saving) ===
      // Total for n pieces: n*(bw-ow) + ow ≤ printArea → n ≤ (printArea - ow) / (bw - ow)
      if (ow > 0 || olSave > 0) {
        const effW = bw - ow;
        const nwO = effW > 0 ? Math.floor((pw - ow) / effW) : Math.floor(pw / bw);
        const effL = bl - olSave;
        const nlO = effL > 0 ? Math.floor((pl - olSave) / effL) : Math.floor(pl / bl);

        const nwOv = Math.max(nwO, 0);
        const nlOv = Math.max(nlO, 0);
        if (nwOv > 0 && nlOv > 0) {
          const upsOv = nwOv * nlOv;
          // Only add overlap result if it's better than straight
          if (upsOv > nwS * nlS) {
            // Store box dims + overlap savings for correct print size calculation
            results.push({ sw, sl, nw: nwOv, nl: nlOv, ups: upsOv, rotated, layingType: 'overlap',
              _boxW: bw, _boxL: bl, _overlapW: ow, _overlapL: olSave });
          }
        }
      }
    }
  }

  // Don't sort here — let calcLayout handle the sorting with priority/dbIndex
  return results;
}

/**
 * Full layout calculation for a component
 * Uses real paper sizes from database when available, falls back to machine sheet sizes
 */
function calcLayout(component, printType = 'Offset', machineOverride = null, customPaper = null) {
  const sz = component.packaging_size;
  const unfolded = calcUnfoldedSize(sz, component.box_type);
  if (!unfolded) return { error: 'ไม่มีขนาด' };

  // === MANUAL LAYOUT MODE ===
  const bt = component.box_type || {};
  if (bt.is_manual_layout) {
    const manualNW = parseInt(bt.manual_nw) || 1;
    const manualNL = parseInt(bt.manual_nl) || 1;
    const manualUps = manualNW * manualNL;
    const machine = machineOverride || selectMachine(component, printType);

    // Tolerance for layout size calculation
    const tol = CALC.tolerance[printType.toLowerCase()] || CALC.tolerance.offset;
    const shortComp = tol.gripper + tol.color_bar;
    const longComp = tol.paper_edge * 2;

    // Layout size: auto-calculate from open size * nw/nl + tolerance, or use user override (inches → mm)
    const autoLayoutW_mm = unfolded.openW * manualNW + shortComp;
    const autoLayoutL_mm = unfolded.openL * manualNL + longComp;
    const layoutW_mm = bt.manual_layout_w_in ? parseFloat(bt.manual_layout_w_in) * 25.4 : autoLayoutW_mm;
    const layoutL_mm = bt.manual_layout_l_in ? parseFloat(bt.manual_layout_l_in) * 25.4 : autoLayoutL_mm;

    // Paper size: user input (inches) or machine max
    const defPapW_in = Math.round((machine?.w_max_mm || 720) / 25.4);
    const defPapL_in = Math.round((machine?.l_max_mm || 1020) / 25.4);
    const papW_in = parseFloat(bt.manual_paper_w_in) || defPapW_in;
    const papL_in = parseFloat(bt.manual_paper_l_in) || defPapL_in;
    const papW_mm = papW_in * 25.4;
    const papL_mm = papL_in * 25.4;

    // Split: how many layouts fit on one paper sheet (like legacy)
    const splitW = layoutW_mm > 0 ? Math.max(1, Math.floor(papW_mm / layoutW_mm)) : 1;
    const splitL = layoutL_mm > 0 ? Math.max(1, Math.floor(papL_mm / layoutL_mm)) : 1;
    const split = splitW * splitL;

    return {
      unfolded,
      machine,
      best: {
        sw: papW_mm,
        sl: papL_mm,
        nw: manualNW,
        nl: manualNL,
        ups: manualUps,
        rotated: false,
        sheetName: 'Manual',
        machine: machine?.id || 'LS540',
        machineName: machine?.name || 'Cut 2 (LS540)',
        sheetW: papW_mm,
        sheetL: papL_mm,
        paperW_in: papW_in,
        paperL_in: papL_in,
        rollW_in: papW_in, rollL_in: papL_in,
        split, fromStdPaper: false, priority: 0,
        layoutW_mm,
        layoutL_mm,
        printW_mm: layoutW_mm - shortComp,
        printL_mm: layoutL_mm - longComp,
      },
      all: [],
      _isManual: true,
    };
  }

  const ptKey = printType.toLowerCase();
  const tol = CALC.tolerance[ptKey] || CALC.tolerance.offset;

  // Select machine (legacy: default Cut 2 for Offset)
  const machine = machineOverride || selectMachine(component, printType);
  if (!machine) return { error: 'ไม่พบเครื่องพิมพ์ที่เหมาะสม', unfolded };

  const allLayouts = [];
  const paperCode = component.paper?.paper_code || '';

  // Compute overlap savings for this box type (templates 1-4 benefit from overlap)
  const overlapSave = calcOverlapSaving(component.box_type, component.packaging_size);
  const oW = overlapSave.wSave;
  const oL = overlapSave.lSave;

  // === Strategy 1: Use machine_std_paper_info from DB (matching legacy system) ===
  if (masterData.machine_std_paper_info && machine.machineSize_type) {
    const mst = machine.machineSize_type;

    // Get papers for this machine, filtered by paper_code
    const allPapersForMachine = masterData.machine_std_paper_info.filter(p => {
      if (p.machineSize_type !== mst) return false;
      if (!p.std_paper_status) return false;
      // Filter by paper_code (only_paper_type is comma-separated list)
      if (paperCode && p.only_paper_type) {
        const allowedTypes = p.only_paper_type.split(',').map(s => s.trim());
        if (!allowedTypes.includes(paperCode)) return false;
      }
      return true;
    });

    // Minimum paper size needed (open size in inches + tolerance, like legacy)
    const openW_in = unfolded.openW / 25.4;
    const openL_in = unfolded.openL / 25.4;
    const minW_in = openW_in + 1.04;  // legacy tolerance for width
    const minL_in = openL_in + 0.57;  // legacy tolerance for length

    // Filter papers that can fit at least 1 up (either orientation)
    const fittingPapers = (papers) => papers.filter(p => {
      const pw = p.std_paper_size_width_in;
      const pl = p.std_paper_size_length_in;
      return (minW_in <= pw && minL_in <= pl) || (minW_in <= pl && minL_in <= pw);
    });

    // Try default papers first (legacy priority)
    const defaultPapers = fittingPapers(allPapersForMachine.filter(p => p.is_default));
    const nonDefaultPapers = fittingPapers(allPapersForMachine.filter(p => !p.is_default));

    let dbIdx = 0; // Track DB order for sort tiebreaker (legacy picks first matching paper)
    const addPaperLayouts = (papers, priority) => {
      papers.forEach(paper => {
        // Use cut size (std_paper_size) for layout — legacy uses cut size, NOT roll size
        // Roll size (ref) is only for cost calculation
        const pw_mm = paper.std_paper_size_width_mm;
        const pl_mm = paper.std_paper_size_length_mm;
        const layouts = tryLayout(pw_mm, pl_mm, unfolded.openW, unfolded.openL, tol, oW, oL);
        layouts.forEach(lay => {
          allLayouts.push({
            ...lay,
            sheetName: paper.std_paper_name || `${paper.std_paper_size_width_in} x ${paper.std_paper_size_length_in}`,
            machineName: machine.name,
            machine: machine.id,
            sheetW: pw_mm,  // cut size used for layout (matching legacy)
            sheetL: pl_mm,
            paperW_in: paper.std_paper_size_width_in,
            paperL_in: paper.std_paper_size_length_in,
            rollW_in: paper.std_paper_size_ref_width_in || paper.std_paper_size_width_in,
            rollL_in: paper.std_paper_size_ref_length_in || paper.std_paper_size_length_in,
            costW_in: paper.std_paper_size_cost_width_in || paper.std_paper_size_ref_width_in || paper.std_paper_size_width_in,
            costL_in: paper.std_paper_size_cost_length_in || paper.std_paper_size_ref_length_in || paper.std_paper_size_length_in,
            split: paper.std_paper_split || 1,
            std_paper_id: paper.std_paper_id,
            fromStdPaper: true,
            isDefault: paper.is_default,
            priority, // 1=default, 2=non-default
            dbIndex: dbIdx++, // preserve DB order
          });
        });
      });
    };

    addPaperLayouts(defaultPapers, 1);
    addPaperLayouts(nonDefaultPapers, 2);
  }

  // === Strategy 2: Fallback to hardcoded std_paper_sizes (if no DB data) ===
  if (allLayouts.length === 0) {
    const stdPapers = findStdPaperSizes(paperCode);
    const machineSheet = CALC.sheets[ptKey]?.find(s => s.machine === machine.id);

    for (const paper of stdPapers) {
      // Paper must fit within machine's max print area
      const mw = machine.w_max_mm, ml = machine.l_max_mm;
      const paperFits = (paper.w_mm <= mw && paper.l_mm <= ml) ||
                        (paper.l_mm <= mw && paper.w_mm <= ml);
      if (!paperFits) continue;

      // Use cut size (w_mm/l_mm) for layout, roll size for cost — matching legacy
      const layouts = tryLayout(paper.w_mm, paper.l_mm, unfolded.openW, unfolded.openL, tol, oW, oL);
      layouts.forEach(lay => {
        allLayouts.push({
          ...lay,
          sheetName: `${paper.w_in} x ${paper.l_in}${paper.roll_w && paper.roll_w !== paper.w_in ? ' (' + paper.roll_w + ' x ' + paper.roll_l + ')' : ''}`,
          machine: machine.id,
          sheetW: paper.w_mm,
          sheetL: paper.l_mm,
          paperW_in: paper.w_in,
          paperL_in: paper.l_in,
          rollW_in: paper.roll_w || paper.w_in,
          rollL_in: paper.roll_l || paper.l_in,
          split: 1,
          fromStdPaper: true,
          isDefault: paper.is_default || false,
          priority: paper.is_default ? 1 : 3,
          dbIndex: paper.is_default ? 0 : 99,
        });
      });
    }

    // Last resort: machine sheet size
    if (allLayouts.length === 0 && machineSheet) {
      const layouts = tryLayout(machineSheet.w, machineSheet.l, unfolded.openW, unfolded.openL, tol, oW, oL);
      layouts.forEach(lay => {
        allLayouts.push({
          ...lay,
          sheetName: machineSheet.name,
          machine: machine.id,
          sheetW: machineSheet.w,
          sheetL: machineSheet.l,
          split: 1,
          fromStdPaper: false,
          priority: 4,
        });
      });
    }
  }

  // === Strategy 3: Custom paper size from user input (#90) ===
  // เพิ่ม custom layout เข้าไปด้านบน แต่เก็บ std layouts ไว้ให้เลือกกลับได้
  if (customPaper && customPaper.w_mm > 0 && customPaper.l_mm > 0) {
    const cpLayouts = tryLayout(customPaper.w_mm, customPaper.l_mm, unfolded.openW, unfolded.openL, tol, oW, oL);
    if (cpLayouts.length > 0) {
      // Insert custom at the beginning (highest priority) — keep std layouts
      const customEntries = cpLayouts.map(lay => ({
        ...lay,
        sheetName: `Custom ${customPaper.w_in}"×${customPaper.l_in}"`,
        machine: machine.id,
        machineName: machine.name,
        sheetW: customPaper.w_mm,
        sheetL: customPaper.l_mm,
        paperW_in: customPaper.w_in,
        paperL_in: customPaper.l_in,
        rollW_in: customPaper.w_in,
        rollL_in: customPaper.l_in,
        split: 1,
        fromStdPaper: false,
        priority: 0,
        _isCustom: true,
      }));
      allLayouts.unshift(...customEntries);
    }
  }

  if (allLayouts.length === 0) return { error: 'ไม่สามารถจัดวางได้ในกระดาษมาตรฐาน', unfolded };

  // Sort: matching legacy behavior — first default paper from DB, non-rotated, then by UPS
  // Legacy picks the FIRST default paper that fits, not the one with most UPS
  allLayouts.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    // Same priority: prefer earlier DB entry (legacy uses first matching paper)
    if ((a.dbIndex || 0) !== (b.dbIndex || 0)) return (a.dbIndex || 0) - (b.dbIndex || 0);
    // Same paper: non-rotated first (default orientation)
    if (a.rotated !== b.rotated) return a.rotated ? 1 : -1;
    // Same paper+orient: more UPS wins
    return b.ups - a.ups;
  });

  const best = allLayouts[0];

  // Compute layout size (matching legacy: shortSideComponent=gripper+colorbar, longSideComponent=2*paper_edge)
  // For overlap: total = firstPiece + (n-1) * (piece - saving)
  let printW_mm, printL_mm;
  if (best.layingType === 'overlap' && best._boxW) {
    const bw = best._boxW, bl = best._boxL, owS = best._overlapW || 0, olS = best._overlapL || 0;
    printW_mm = owS > 0 && best.nw > 1 ? bw + (best.nw - 1) * (bw - owS) : best.nw * bw;
    printL_mm = olS > 0 && best.nl > 1 ? bl + (best.nl - 1) * (bl - olS) : best.nl * bl;
  } else {
    printW_mm = best.nw * unfolded.openW;
    printL_mm = best.nl * unfolded.openL;
  }
  const shortComp = tol.gripper + tol.color_bar; // 20mm for offset
  const longComp = tol.paper_edge * 2;           // 8mm for offset
  // Legacy: W always gets shortComp (gripper+colorbar), L always gets longComp (paper_edge*2)
  // This is tied to paper orientation, NOT which print dimension is larger
  const layoutW_mm = printW_mm + shortComp;
  const layoutL_mm = printL_mm + longComp;
  best.layoutW_mm = layoutW_mm;
  best.layoutL_mm = layoutL_mm;
  best.printW_mm = printW_mm;
  best.printL_mm = printL_mm;

  // === Corrugated board rounding ===
  const compType = component.component_type || 1;
  let corrugatedBoard = null;
  if (compType === 2 || compType === 3) { // ประกบลูกฟูก
    const fluteSide = component.corrugated?.flute_side || 'long_side';
    const isManual = !!bt.is_manual_layout;
    // Layout size in inches
    const layWIn = layoutW_mm / 25.4;
    const layLIn = layoutL_mm / 25.4;
    // Determine laying orientation: shorter dim = 'vertical', longer = 'horizontal' (legacy convention)
    const laying = layoutW_mm <= layoutL_mm ? 'vertical' : 'horizontal';
    corrugatedBoard = calcCorrugatedBoardSize(layWIn, layLIn, fluteSide, laying, isManual, compType);
    best.corrugatedBoard = corrugatedBoard;
  }

  return {
    unfolded,
    best,
    alternatives: allLayouts.slice(1, 4),
    all: allLayouts,
    corrugatedBoard,
  };
}

// ============================================================
// WASTE CALCULATION
// ============================================================
function calcWaste(afterUps, component, printType = 'Offset', isProfitSharing = false, isColorLimit = false) {
  const ptKey = printType.toLowerCase();
  const isDigital = ptKey === 'jetpress' || ptKey === 'konica';
  const colorsOut = parseInt(component.color?.outside) || 0;
  const colorsIn = parseInt(component.color?.inside) || 0;
  const totalColors = colorsOut + colorsIn;
  const hasCoating = (component.addon || []).some(a => a.type === 'coating');
  const hasFoil = (component.addon || []).some(a => a.type === 'foilstamp');
  const hasBoss = (component.addon || []).some(a => a.type === 'emboss' || a.type === 'deboss');
  const compType = component.component_type || 1;

  // Try master data first
  const wasteTier = findWasteTier(afterUps, ptKey === 'offset' ? 1 : 2);

  let wastePrint = 0, wasteColor = 0, wasteAfterpress = 0;
  let wasteCoating = 0, wasteFoil = 0, wasteBoss = 0, wasteExtra = 0;

  if (wasteTier) {
    // From master data
    wastePrint = wasteTier.print_rate < 1 ? Math.ceil(afterUps * wasteTier.print_rate) : wasteTier.print_rate;
    wasteAfterpress = wasteTier.afterpress_rate || 0;
    wasteCoating = hasCoating ? (wasteTier.coating_rate || 50) : 0;
    wasteFoil = hasFoil ? (wasteTier.foilstamp_rate || 50) : 0;
    wasteBoss = hasBoss ? (wasteTier.bossing_rate || 50) : 0;

    // Extra color waste
    if (totalColors > CALC.waste_max_colors_before_extra) {
      wasteExtra = (totalColors - CALC.waste_max_colors_before_extra) * (wasteTier.print_col_add_rate || 50);
    }

    // Corrugated waste
    if (compType === 2 || compType === 3) {
      wasteAfterpress += wasteTier.corrugatedglued_rate || 50;
    }
  } else {
    // Fallback: use constants
    const baseWaste = isDigital ? CALC.waste_base_digital : CALC.waste_base_offset;
    wastePrint = baseWaste;
    if (colorsOut > 0) wasteColor += baseWaste;
    if (colorsIn > 0) wasteColor += baseWaste;
    if (totalColors > CALC.waste_max_colors_before_extra) {
      wasteExtra = (totalColors - CALC.waste_max_colors_before_extra) * CALC.waste_per_extra_color;
    }
    wasteAfterpress = 100;
    wasteCoating = hasCoating ? 50 : 0;
    wasteFoil = hasFoil ? 50 : 0;
    wasteBoss = hasBoss ? 50 : 0;
  }

  // Color Limit waste (ลิมิตสี) — only for component type 1,2 when enabled
  let wasteColorLimit = 0;
  if (isColorLimit && (compType === 1 || compType === 2)) {
    const clw = CALC.color_limit_waste[ptKey] || CALC.color_limit_waste.offset;
    if (colorsOut > 0) wasteColorLimit += clw.base;
    if (colorsIn > 0) wasteColorLimit += clw.base;
    // Extra per color beyond threshold
    if (colorsOut > CALC.waste_max_colors_before_extra) {
      wasteColorLimit += (colorsOut - CALC.waste_max_colors_before_extra) * clw.per_color;
    }
    if (colorsIn > CALC.waste_max_colors_before_extra) {
      wasteColorLimit += (colorsIn - CALC.waste_max_colors_before_extra) * clw.per_color;
    }
  }

  let totalWaste = wastePrint + wasteColor + wasteAfterpress + wasteCoating + wasteFoil + wasteBoss + wasteExtra + wasteColorLimit;

  // Digital waste reduction
  if (isDigital) {
    const reduced = Math.ceil(totalWaste * CALC.waste_reduce_digital / 100);
    totalWaste -= reduced;
  }

  return {
    wastePrint, wasteColor, wasteAfterpress, wasteCoating, wasteFoil, wasteBoss, wasteExtra, wasteColorLimit,
    total: totalWaste,
  };
}

// ============================================================
// PAPER USAGE CALCULATION
// ============================================================
function calcPaperUsage(qty, ups, component, printType = 'Offset', isColorLimit = false) {
  if (!ups || ups <= 0) return null;

  const afterUps = Math.ceil(qty / ups);
  const waste = calcWaste(afterUps, component, printType, false, isColorLimit);
  const afterWaste = afterUps + waste.total;

  // Layout result (set externally on component)
  const layout = component._layout;
  const split = layout?.best?.split || 1;

  // Paper calculation with split (like legacy: paper_print = afterWaste * sig, paper_qty = ceil(paper_print / split))
  const sig = 1; // signature factor (always 1 for now)
  const paperPrint = afterWaste * sig;
  const paperQty = split > 1 ? Math.ceil(paperPrint / split) : paperPrint;

  // Round to nearest 100 (except digital)
  const ptKey = printType.toLowerCase();
  const isDigital = ptKey === 'jetpress' || ptKey === 'konica';
  const paperNet = isDigital ? paperQty : Math.ceil(paperQty / 100) * 100;

  // Weight calculation — use cost/ref paper dimensions (inches) for weight, like legacy system
  const gram = parseFloat(component.paper?.paper_gram) || 0;
  let sheetW_in = 0, sheetL_in = 0;
  if (layout?.best) {
    if (layout.best.costW_in && layout.best.costL_in) {
      sheetW_in = layout.best.costW_in;
      sheetL_in = layout.best.costL_in;
    } else if (layout.best.rollW_in && layout.best.rollL_in) {
      sheetW_in = layout.best.rollW_in;
      sheetL_in = layout.best.rollL_in;
    } else if (layout.best.paperW_in && layout.best.paperL_in) {
      sheetW_in = layout.best.paperW_in;
      sheetL_in = layout.best.paperL_in;
    } else {
      sheetW_in = layout.best.sw / 25.4;
      sheetL_in = layout.best.sl / 25.4;
    }
  }
  const weight_kg = gram > 0 ? paperNet * gram / CALC.formula_value * sheetW_in * sheetL_in : 0;

  return {
    qty,
    ups, // ← layout UPS (used by foil/emboss/spot UV calc)
    afterUps,
    waste,
    afterWaste,
    paperNet,
    split,
    paperPrint,
    paperQty,
    weight_kg: Math.round(weight_kg * 100) / 100,
    weight_ton: Math.round(weight_kg / 10) / 100,
  };
}

// ============================================================
// PRICE CALCULATION
// ============================================================

function calcPaperCost(paperUsage, component, isProfitSharing = false, isImport = false) {
  const paper = component.paper || {};
  const paperCost = parseFloat(paper.paper_cost) || 0;
  if (paperCost <= 0) return { total: 0, unitPrice: 0 };

  let markup = parseFloat(paper.paper_markup) || CALC.paper_markup_default;
  if (isProfitSharing) markup = CALC.profit_sharing.paper_markup;
  else if (isImport) markup = CALC.paper_markup_import;

  const paperPercent = parseFloat(paper.paper_percent) || 0;
  const totalPrice = paperCost * (1 + markup / 100) + paperPercent;

  let unitPrice;
  if (paper.paper_price_per_sheet) {
    unitPrice = totalPrice;
  } else {
    // THB/kg pricing — use raw roll dimensions for weight-based pricing
    const gram = parseFloat(paper.paper_gram) || 0;
    const layout = component._layout;
    if (layout?.best && gram > 0) {
      const sw_in = layout.best.rollW_in || layout.best.paperW_in || (layout.best.sw / 25.4);
      const sl_in = layout.best.rollL_in || layout.best.paperL_in || (layout.best.sl / 25.4);
      unitPrice = sw_in * sl_in * totalPrice * gram / CALC.formula_value;
    } else {
      unitPrice = totalPrice;
    }
  }

  // Round unit price first (like legacy system), then multiply
  unitPrice = Math.round(unitPrice * 100) / 100;
  const total = paperUsage.paperNet * unitPrice;
  return {
    unitPrice,
    total: Math.round(total * 100) / 100,
    markup,
    paperNet: paperUsage.paperNet,
    paperCode: paper.paper_code || '',
    paperGram: paper.paper_gram || '',
    paperName: paper.paper_type || paper.paper_code || '',
  };
}

function calcPlateCost(paperUsage, component, printType = 'Offset', isReprint = false, isProfitSharing = false) {
  const colorsOut = parseInt(component.color?.outside) || 0;
  const colorsIn = parseInt(component.color?.inside) || 0;
  const ptKey = printType.toLowerCase();

  if (ptKey === 'jetpress' || ptKey === 'konica') return { total: 0 }; // digital = no plate

  let total = 0;

  let priceOut = 0, priceIn = 0, plateSets = 1, machineName = '';
  const layout = component._layout;

  if (ptKey === 'offset') {
    let ppu = isProfitSharing ? CALC.profit_sharing.plate_ppu : CALC.plate_price_per_color;
    const bestMachine = layout?.best?.machine || '';
    if (['L244','L444SP','L444SPAPC','G844'].includes(bestMachine)) ppu += CALC.plate_cut1_add;
    machineName = layout?.best?.machineName || 'Cut 2';

    // Legacy uses round() not ceil() — matching setCalculatePlateCost line 3708
    plateSets = Math.max(1, Math.round(paperUsage.afterWaste / CALC.plate_set_per_sheets));

    if (isReprint) ppu *= CALC.plate_reprint_factor;

    priceOut = colorsOut * ppu * plateSets;
    priceIn = colorsIn * ppu * plateSets;
    total = priceOut + priceIn;
  } else if (ptKey === 'flexo') {
    machineName = 'Flexo';
    if (layout?.best) {
      const flexoW = layout.best.sw / 25.4;
      const flexoL = layout.best.sl / 25.4;
      const polyPrice = isReprint ? CALC.flexo_reprint_polymer : CALC.flexo_polymer_price;
      const blockPrice = Math.max(50, polyPrice * flexoW * flexoL);
      priceOut = blockPrice * colorsOut;
      priceIn = blockPrice * colorsIn;
      total = priceOut + priceIn;
    }
  }

  return {
    total: Math.round(total * 100) / 100,
    outside: Math.round(priceOut * 100) / 100,
    inside: Math.round(priceIn * 100) / 100,
    colorsOut, colorsIn, plateSets, machineName,
  };
}

function calcPrintCost(paperUsage, component, printType = 'Offset', isProfitSharing = false, isUV = false) {
  const colorsOut = parseInt(component.color?.outside) || 0;
  const colorsIn = parseInt(component.color?.inside) || 0;
  const totalColors = colorsOut + colorsIn;
  const afterUps = paperUsage.afterUps;
  const ptKey = printType.toLowerCase();

  let total = 0;
  let priceOutOnly = 0, priceInOnly = 0;

  if (ptKey === 'offset') {
    if (isProfitSharing && paperUsage.qty >= CALC.profit_sharing.print_min_qty) {
      total = Math.max(CALC.profit_sharing.print_min, paperUsage.afterWaste * CALC.profit_sharing.print_rate);
      priceOutOnly = colorsOut > 0 ? total * colorsOut / Math.max(totalColors, 1) : 0;
      priceInOnly = colorsIn > 0 ? total * colorsIn / Math.max(totalColors, 1) : 0;
    } else {
      // === Legacy formula: per-side categorization (matching setCalculatePrintCost) ===
      // 1-2 cols → print_1col, 3-4 cols → print_3col, 5+ cols → print_5col
      // คิดแยก outside/inside ไม่รวมกัน
      const tier = findPriceTier(afterUps);
      if (tier) {
        const inkFactor = isUV ? (CALC.uv_ink_factor || 2.5) : 1;
        const sig = 1; // signature factor

        // Helper: get rate key based on color count for ONE side
        const getRateKey = (cols) => {
          if (cols >= 5) return 'print_5col';
          if (cols >= 3) return 'print_3col';
          return 'print_1col';
        };

        // Outside
        if (colorsOut > 0) {
          const rateKeyOut = getRateKey(colorsOut);
          const rateOut = tier[rateKeyOut] || 0;
          const minOut = findMinPrice(rateKeyOut, afterUps);
          // legacy: print_price.price = max(min, qty × rate) where qty = afterUps
          let printPriceOut = Math.max(minOut, afterUps * rateOut);
          // legacy: unitprice_out = ink_factor × print_price.price × outside × sig
          priceOutOnly = inkFactor * printPriceOut * colorsOut * sig;
        }

        // Inside
        if (colorsIn > 0) {
          const rateKeyIn = getRateKey(colorsIn);
          const rateIn = tier[rateKeyIn] || 0;
          const minIn = findMinPrice(rateKeyIn, afterUps);
          let printPriceIn = Math.max(minIn, afterUps * rateIn);
          priceInOnly = inkFactor * printPriceIn * colorsIn * sig;
        }

        total = priceOutOnly + priceInOnly;
      }
    }
  } else if (ptKey === 'flexo') {
    // Flexo: rate per sheet based on colors, similar to offset but lower rates
    if (isProfitSharing) {
      total = Math.max(CALC.profit_sharing.print_min, paperUsage.afterWaste * CALC.profit_sharing.print_rate * 0.8);
    } else {
      const tier = findPriceTier(afterUps);
      if (tier) {
        const rate = tier.print_1col || 0;
        total = afterUps * rate * totalColors * 0.7; // Flexo ~70% of offset rate
        const minPrice = findMinPrice('print_1col', afterUps);
        if (total < minPrice) total = minPrice;
      } else {
        total = afterUps * 0.08 * totalColors; // fallback
      }
    }
  } else if (ptKey === 'jetpress') {
    // JetPress: digital print cost per sheet, fixed rate
    const jpRate = 5; // THB per sheet (full color)
    total = paperUsage.afterWaste * jpRate;
    if (colorsIn > 0) total += paperUsage.afterWaste * jpRate * 0.5; // inside print
  } else if (ptKey === 'konica') {
    // Konica: 3 THB/sheet/side (color), 1 THB/sheet/side (black only)
    const colorRate = 3, bwRate = 1;
    const oCost = colorsOut > 0 ? paperUsage.afterWaste * (colorsOut > 1 ? colorRate : bwRate) : 0;
    const iCost = colorsIn > 0 ? paperUsage.afterWaste * (colorsIn > 1 ? colorRate : bwRate) : 0;
    priceOutOnly = oCost; priceInOnly = iCost;
    total = oCost + iCost;
  }

  const machineName = component._layout?.best?.machineName || (ptKey === 'flexo' ? 'Flexo' : ptKey === 'jetpress' ? 'JetPress' : ptKey === 'konica' ? 'Konica' : 'Cut 2');
  // หาก priceOutOnly/priceInOnly ยังไม่ได้ตั้ง (เช่น flexo/jetpress) ให้ split by ratio
  if (priceOutOnly === 0 && priceInOnly === 0 && total > 0) {
    priceOutOnly = colorsOut > 0 ? total * colorsOut / Math.max(totalColors, 1) : 0;
    priceInOnly = colorsIn > 0 ? total * colorsIn / Math.max(totalColors, 1) : 0;
  }
  return {
    total: Math.round(total * 100) / 100,
    outside: Math.round(priceOutOnly * 100) / 100,
    inside: Math.round(priceInOnly * 100) / 100,
    colorsOut, colorsIn, machineName,
  };
}

function calcAfterPressCost(paperUsage, component, printType = 'Offset', isReprint = false) {
  const afterUps = paperUsage.afterUps;
  const qty = paperUsage.qty;
  const tier = findPriceTier(afterUps);
  let diecutCost = 0, coatingCost = 0, foilCost = 0, bossCost = 0, trimCost = 0;
  const coatingDetails = [];
  let assemblyCost = 0, chipCost = 0, inspectionCost = 0, blockCost = 0;
  // === Blanket (ผ้ายาง) cost — สำหรับงาน "เว้นลิ้น" ===
  // Source: legacy js_function_estimate.js:3924-3956 (getBlanketUVGap)
  let blanketCost = 0;
  const blanketDetails = [];
  // === Calculation breakdown (สำหรับ tooltip transparency) ===
  const breakdown = {
    diecut: null, block: null, foil: null, emboss: null, trim: null, chip: null, inspection: null, assembly: null, blanket: null,
  };

  // Read process flags from component (set by form)
  const proc = component._process_flags || {};

  if (tier) {
    // Die-cut — only if form has diecut enabled (is_diecut flag)
    if (proc.diecut !== false) {
      const dcRate = tier.diecut || 0;
      const dcMin = findMinPrice('diecut', afterUps);
      const dcCalc = afterUps * dcRate;
      diecutCost = Math.max(dcMin, dcCalc);
      breakdown.diecut = {
        afterUps, tierId: tier.id, tierMinQty: tier.min_qty, tierMaxQty: tier.max_qty,
        rate: dcRate, minPrice: dcMin, calc: dcCalc, total: diecutCost,
      };
    }

    // Trim — only if form has trim enabled
    if (proc.trim !== false) {
      const tRate = tier.trim || 0;
      const tMin = findMinPrice('trim', afterUps);
      const tCalc = afterUps * tRate;
      trimCost = Math.max(tMin, tCalc);
      breakdown.trim = { afterUps, tierId: tier.id, rate: tRate, minPrice: tMin, calc: tCalc, total: trimCost };
    }

    // Chip (ค่าชิพ) — matching legacy setCalculateChipCost (line 6784)
    // Legacy: max(min, qty × rate) × (1 + afterpress_markup)
    if (proc.chip !== false && proc.diecut !== false) {
      const chipTier = findPriceTier(qty) || tier;
      const cRate = chipTier.chip || 0;
      const cMin = findMinPrice('chip', qty);
      const afterpress_markup = (defaultData?.afterpress_price_marking || 0) / 100;
      let cCalc = qty * cRate;
      if (cCalc < cMin) cCalc = cMin;
      chipCost = cCalc * (1 + afterpress_markup);
      breakdown.chip = { qty, tierId: chipTier.id, tierMinQty: chipTier.min_qty, tierMaxQty: chipTier.max_qty, rate: cRate, minPrice: cMin, calc: cCalc, total: chipCost };
    }

    // Inspection (ค่าตรวจงาน) — matching legacy setCalculateInspectionCost (line 7051)
    // Legacy: max(min, qty × rate) × (1 + afterpress_markup)
    if (proc.inspection !== false) {
      const inspTier = findPriceTier(qty) || tier;
      const iRate = inspTier.inspection || 0;
      const iMin = findMinPrice('inspection', qty);
      const afterpress_markup = (defaultData?.afterpress_price_marking || 0) / 100;
      let iCalc = qty * iRate;
      if (iCalc < iMin) iCalc = iMin;
      inspectionCost = iCalc * (1 + afterpress_markup);
      breakdown.inspection = { qty, tierId: inspTier.id, tierMinQty: inspTier.min_qty, tierMaxQty: inspTier.max_qty, rate: iRate, minPrice: iMin, calc: iCalc, total: inspectionCost };
    }
  }

  // Coating from addon (matching legacy setCalculateCoatingCost)
  const addons = component.addon || [];
  addons.forEach(ad => {
    if (ad.type === 'coating') {
      const cInfo = findCoatingRate(ad.info?.coating_type || ad.info?.type || ad.info?.coating_code);
      if (cInfo) {
        const sides = parseInt(ad.info?.side) || 1;
        // Layout size in inches (matching legacy: item.layout.laySize)
        const layW_in = (component._layout?.best?.layoutW_mm || 0) / 25.4;
        const layL_in = (component._layout?.best?.layoutL_mm || 0) / 25.4;
        const coatingRate = cInfo.rate || 0;
        const coatingCode = (ad.info?.coating_code || cInfo.coating_code || '').toUpperCase();

        // === Coating formula by type (matching legacy setCalculateCoatingCost) ===
        // Legacy logic (js_function_estimate_calculation.js:5979-6011):
        //   if (B-PACK)        → unit_price = coating_price × side  (flat × side)
        //   else if (P-PAT)    → unit_price = coating_price        (flat, NO side)
        //   else if (S-UV/S-UV-S) → unit_price = ups × spotW × spotL × rate × side
        //   else               → unit_price = 1 × layW × layL × rate × side
        const isBPACK = /^B-PACK/i.test(coatingCode);
        const isPPAT = /^P-PAT/i.test(coatingCode);
        const isSpotUV = /^S-UV/i.test(coatingCode);

        let unitPrice;
        if (isBPACK) {
          // Blister Pack: flat per sheet × side
          unitPrice = parseFloat((coatingRate * sides).toFixed(2));
        } else if (isPPAT) {
          // อัดลาย: flat per sheet — NO side multiplier (ตาม legacy line 6008)
          unitPrice = parseFloat((coatingRate).toFixed(2));
        } else if (isSpotUV) {
          // Spot UV: ups × spotW × spotL × rate × side
          // ⚠️ Legacy ใช้ spot pattern size (user-input) — NOT layout size
          // ถ้าไม่มี spot size → unit_price = 0 → min_cost handler ทำงาน (2500-4000 บาท)
          const spotW = parseFloat(ad.info?.width) || 0;
          const spotL = parseFloat(ad.info?.length) || 0;
          const upsFactor = component._layout?.best?.ups || paperUsage.ups || 1;
          unitPrice = parseFloat((upsFactor * spotW * spotL * coatingRate * sides).toFixed(2));
          // ถ้า user ไม่ระบุ spot pattern size → flag เพื่อแสดง warning
          if (spotW === 0 || spotL === 0) {
            ad._spotUVNoSize = true;
          }
        } else {
          // ทั่วไป (UV, Waterbase, OPP, etc.): per sq inch
          unitPrice = parseFloat((1 * layW_in * layL_in * coatingRate * sides).toFixed(2));
        }

        // Apply min_cost per sheet
        if (cInfo.unit_min_cost === 'sheet' && unitPrice < (cInfo.min_cost || 0)) {
          unitPrice = cInfo.min_cost;
        }

        // Qty = paper_print (afterWaste) — matching legacy line 6002
        const coatQty = paperUsage.afterWaste || afterUps;

        let thisCost;
        if (cInfo.unit_min_cost === 'price') {
          thisCost = Math.max(cInfo.min_cost || 0, coatQty * unitPrice);
        } else {
          thisCost = coatQty * unitPrice;
        }
        coatingCost += thisCost;
        coatingDetails.push({
          type: cInfo.coating_type || ad.info?.coating_type || ad.info?.type || '-',
          option: ad.info?.coating_option || '',
          side: sides,
          rate: coatingRate,
          unitPrice: unitPrice,
          qty: coatQty,
          cost: Math.round(thisCost * 100) / 100,
        });

        // === Blanket (ผ้ายาง) — for "เว้นลิ้น" coating types ===
        // Source: legacy js_function_estimate.js:11989-12003
        // ถ้า coating type อยู่ใน list นี้ → เพิ่ม material "ผ้ายาง" 1500 บาท × side
        const blanketTypes = {
          'UV_GAP':      'ผ้ายาง (UV เว้นลิ้น)',
          'UV_ANTI_GAP': 'ผ้ายาง (UV Anti-static เว้นลิ้น)',
          'S-WTB':       'ผ้ายาง (Spot Waterbase)',
          'S-WTB-HR':    'ผ้ายาง (Hi-rub WB เว้นลิ้น)',
          'S-H-WTB':     'ผ้ายาง (Hi-Gloss WB เว้นลิ้น)',
          'S-UV-ANTI':   'ผ้ายาง (UV anti. เว้นลิ้น)',
        };
        const codeKey = (ad.info?.coating_code || cInfo.coating_code || '').toUpperCase();
        if (blanketTypes[codeKey]) {
          const blanketUnitPrice = 1500; // THB/side (legacy: process_price)
          const thisBlanket = blanketUnitPrice * sides;
          blanketCost += thisBlanket;
          blanketDetails.push({
            name: blanketTypes[codeKey],
            coating_code: codeKey,
            unit_price: blanketUnitPrice,
            side: sides,
            cost: Math.round(thisBlanket * 100) / 100,
          });
        }
      } else {
        const fbCost = paperUsage.afterWaste * 0.5;
        coatingCost += fbCost;
        coatingDetails.push({
          type: ad.info?.coating_type || ad.info?.type || 'Unknown',
          option: ad.info?.coating_option || '',
          side: parseInt(ad.info?.side) || 1,
          rate: 0, unitPrice: 0.5,
          qty: paperUsage.afterWaste,
          cost: Math.round(fbCost * 100) / 100,
        });
      }
    } else if (ad.type === 'foilstamp') {
      // === Foil Stamp (matching legacy setCalculateFoilStampCost line 6333-6454) ===
      // 4 cost components: Block + Film + Labor + Foil Roll
      if (tier) {
        const ups = component._layout?.best?.ups || paperUsage.ups || 1;
        const film_rate = defaultData.film_rate || 1.25;
        const film_min_cost = defaultData.film_min_cost || 120;
        const block_foilstamp_min_cost = defaultData.block_foilstamp_min_cost || 70;
        const material_markup = (defaultData.material_price_marking || 0) / 100;
        const afterpress_markup = (defaultData.afterpress_price_marking || 0) / 100;
        const labor_markup = (defaultData.addon_labor_price_marking || 0) / 100;

        // Sizes: ad.info.sizes อาจมีหลาย size ใน 1 addon (จาก parser ที่ group ตามสี)
        // หรือ ad.info.width/length (single)
        const sizes = (ad.info?.sizes && ad.info.sizes.length > 0)
          ? ad.info.sizes.map(s => ({ w: parseFloat(s.w) || 0, l: parseFloat(s.l) || 0 }))
          : [{ w: parseFloat(ad.info?.width) || 0, l: parseFloat(ad.info?.length) || 0 }];

        const block_rate = parseFloat(ad.info?.block_rate) || 0;

        // Block + Film cost (per size) — apply material markup then × ups
        let blockTotal = 0, filmTotal = 0;
        sizes.forEach(s => {
          if (s.w <= 0 || s.l <= 0) return;
          // Block: max(min, w × l × block_rate)
          let blockUP = s.w * s.l * block_rate;
          if (blockUP < block_foilstamp_min_cost) blockUP = block_foilstamp_min_cost;
          // Film: max(min, w × l × film_rate)
          let filmUP = s.w * s.l * film_rate;
          if (filmUP < film_min_cost) filmUP = film_min_cost;
          blockTotal += blockUP * (1 + material_markup) * ups;
          filmTotal += filmUP * (1 + material_markup) * ups;
        });

        // Labor cost (per addon, charged once)
        const labor_rate = tier.foilstamp || 0;
        const labor_min = findMinPrice('foilstamp', afterUps);
        // labor_unit_price = (rate / ups) × (1 + labor markup)
        const labor_unit = (labor_rate / ups) * (1 + labor_markup);
        let labor_calc = labor_unit * qty;
        if (labor_calc < labor_min) labor_calc = labor_min;
        labor_calc = labor_calc * (1 + afterpress_markup);

        // Foil roll cost (ใช้ foil_unit_price ที่ form คำนวณไว้แล้วจาก foil_roll_price/pcs_per_roll)
        const foil_unit = parseFloat(ad.info?.foil_unit_price) || 0;
        const foil_roll_cost = foil_unit > 0 ? (qty * foil_unit) : 0;

        const fThis = blockTotal + filmTotal + labor_calc + foil_roll_cost;
        foilCost += fThis;
        breakdown.foil = breakdown.foil || { entries: [] };
        breakdown.foil.entries.push({
          sizes, block: blockTotal, film: filmTotal, labor: labor_calc, foil_roll: foil_roll_cost,
          subtotal: fThis, hasManualSizes: sizes.some(s => s.w > 0 && s.l > 0),
        });
        breakdown.foil.total = foilCost;
      }
    } else if (ad.type === 'emboss' || ad.type === 'deboss') {
      // === Bossing (matching legacy setCalculateBossingCost line 6456-6575) ===
      // ค่าแรงคิดครั้งเดียว / ค่า block คิดแยก size
      if (tier) {
        const ups = component._layout?.best?.ups || paperUsage.ups || 1;
        const film_rate = defaultData.film_rate || 1.25;
        const film_min_cost = defaultData.film_min_cost || 120;
        const material_markup = (defaultData.material_price_marking || 0) / 100;
        const afterpress_markup = (defaultData.afterpress_price_marking || 0) / 100;
        const labor_markup = (defaultData.addon_labor_price_marking || 0) / 100;

        const sizes = (ad.info?.sizes && ad.info.sizes.length > 0)
          ? ad.info.sizes.map(s => ({ w: parseFloat(s.w) || 0, l: parseFloat(s.l) || 0 }))
          : [{ w: parseFloat(ad.info?.width) || 0, l: parseFloat(ad.info?.length) || 0 }];

        const block_rate = parseFloat(ad.info?.block_rate) || 0;

        // Block per size
        let blockTotal = 0, filmTotal = 0;
        sizes.forEach(s => {
          if (s.w <= 0 || s.l <= 0) return;
          const blockUP = s.w * s.l * block_rate;
          let filmUP = s.w * s.l * film_rate;
          if (filmUP < film_min_cost) filmUP = film_min_cost;
          // (block + film) × ups × (1 + material markup)
          blockTotal += (blockUP * (1 + material_markup)) * ups;
          filmTotal += (filmUP * (1 + material_markup)) * ups;
        });

        // Labor (charged once per addon)
        const labor_rate = tier.bossing || 0;
        const labor_min = findMinPrice('bossing', afterUps);
        const labor_unit = (labor_rate / ups) * (1 + labor_markup);
        let labor_calc = labor_unit * qty;
        if (labor_calc < labor_min) labor_calc = labor_min;
        labor_calc = labor_calc * (1 + afterpress_markup);

        const bThis = blockTotal + filmTotal + labor_calc;
        bossCost += bThis;
        breakdown.emboss = breakdown.emboss || { entries: [] };
        breakdown.emboss.entries.push({
          type: ad.type, sizes, block: blockTotal, film: filmTotal, labor: labor_calc,
          subtotal: bThis, hasManualSizes: sizes.some(s => s.w > 0 && s.l > 0),
        });
        breakdown.emboss.total = bossCost;
      }
    }
  });

  // Assembly (gluing)
  const compProc = component.comp_process || [];
  const hasGluing = compProc.some(p => p.type === 'gluing');
  if (hasGluing && tier) {
    // Size category
    const sz = component.packaging_size;
    const openW = parseFloat(sz.width) || 0;
    const openL = parseFloat(sz.length) || 0;
    const maxDim = Math.max(openW, openL);
    let asmKey = 'assembly_S', sizeCat = 'S (≤150mm)';
    if (maxDim > 300) { asmKey = 'assembly_L'; sizeCat = 'L (>300mm)'; }
    else if (maxDim > 150) { asmKey = 'assembly_M'; sizeCat = 'M (151-300mm)'; }
    const aRate = tier[asmKey] || 0;
    const aMin = findMinPrice(asmKey, afterUps);
    const aCalc = afterUps * aRate;
    assemblyCost = Math.max(aMin, aCalc);
    breakdown.assembly = { afterUps, tierId: tier.id, sizeCat, asmKey, rate: aRate, minPrice: aMin, calc: aCalc, maxDim, total: assemblyCost };
  }

  // Block cost (ค่าบล็อค — matching legacy setCalculateDieCutCost + setBlockDiecutRate2)
  // Only apply when diecut is enabled
  if (proc.diecut !== false) {
    // OPP Window check — ถ้ามี OPP Window coating (process_id 36 or 51) ต้องทำ diecut 2 รอบ
    const hasOPPWindow = (component.addon || []).some(a =>
      a.type === 'coating' && [36, 51].includes(parseInt(a.info?.process_id || a.process_id || 0))
    );
    const blockQty = hasOPPWindow ? 2 : 1;

    let blockRate = 0;
    let blockSource = '';
    let blockMatchedRow = null;
    let blockLayW = 0, blockLayL = 0;

    // 1. Manual override from form
    if (component.block_cost) {
      blockRate = parseFloat(component.block_cost) || 0;
      blockSource = 'manual_override';
    }

    // 2. Auto-lookup: reprint → fixed 500 THB, otherwise lookup by layout size
    if (!blockRate) {
      if (isReprint) {
        blockRate = CALC.reprinted_block || 500;
        blockSource = 'reprint_fixed';
      } else if (component._layout?.best) {
        blockLayW = (component._layout.best.layoutW_mm || 0) / 25.4;
        blockLayL = (component._layout.best.layoutL_mm || 0) / 25.4;
        const shortSide = Math.min(blockLayW, blockLayL);
        const longSide = Math.max(blockLayW, blockLayL);
        const blockDB = masterData.blockdiecut_info || [];
        for (const item of blockDB) {
          if (shortSide <= item.width && longSide <= item.length) {
            blockRate = item.rate || 0;
            blockMatchedRow = item;
            blockSource = 'lookup_blockdiecut_info';
            break;
          }
        }
      }
    }

    // 3. Fallback: check addon
    if (!blockRate) {
      const blockAddon = (component.addon || []).find(a => a.type === 'block' || a.type === 'diecut_block');
      if (blockAddon) {
        blockRate = parseFloat(blockAddon.price) || parseFloat(blockAddon.cost) || 0;
        blockSource = 'addon_fallback';
      }
    }

    // Apply material markup (matching legacy: block_rate × (1 + material_price_marking/100))
    const materialMarkup = CALC.afterpress_price_marking || 0;
    const rawRate = blockRate;
    blockRate = parseFloat((blockRate * (1 + materialMarkup / 100)).toFixed(2));

    blockCost = parseFloat((blockQty * blockRate).toFixed(2));

    breakdown.block = {
      source: blockSource,
      rawRate, finalRate: blockRate, blockQty,
      hasOPPWindow,
      isReprint,
      layoutW: blockLayW, layoutL: blockLayL,
      matchedRow: blockMatchedRow,
      materialMarkup,
      total: blockCost,
    };
  }

  // Blanket breakdown for tooltip transparency
  if (blanketDetails.length > 0) {
    breakdown.blanket = {
      entries: blanketDetails,
      total: blanketCost,
      source: 'legacy js_function_estimate.js:3924-3956 (getBlanketUVGap)',
      note: '1500 บาท/ด้าน × side สำหรับ coating type ที่ต้องใช้ผ้ายาง',
    };
  }

  const total = diecutCost + coatingCost + foilCost + bossCost + trimCost + assemblyCost + chipCost + inspectionCost + blockCost + blanketCost;

  return {
    diecut: Math.round(diecutCost * 100) / 100,
    chip: Math.round(chipCost * 100) / 100,
    inspection: Math.round(inspectionCost * 100) / 100,
    block: Math.round(blockCost * 100) / 100,
    coating: Math.round(coatingCost * 100) / 100,
    coatingDetails,
    foil: Math.round(foilCost * 100) / 100,
    emboss: Math.round(bossCost * 100) / 100,
    trim: Math.round(trimCost * 100) / 100,
    assembly: Math.round(assemblyCost * 100) / 100,
    blanket: Math.round(blanketCost * 100) / 100,
    blanketDetails,
    total: Math.round(total * 100) / 100,
    breakdown, // ← calculation transparency for tooltips
  };
}

function calcComponentWeight(qty, component) {
  const area = calcBoxArea(component.packaging_size, component.box_type);
  const gram = parseFloat(component.paper?.paper_gram) || 0;
  const paperWeight = area * gram / 1e9; // mm^2 * g/m^2 / 1e9 = kg

  let corrWeight = 0;
  if ((component.component_type === 2 || component.component_type === 3) && component.corrugated) {
    const corrGram = parseFloat(component.corrugated.grade?.reduce((s, g) => s + (parseFloat(g) || 0), 0)) || 0;
    corrWeight = area * corrGram / 1e9;
  }

  const perPiece = paperWeight + corrWeight;
  return {
    perPiece: Math.round(perPiece * 10000) / 10000,
    total: Math.round(perPiece * qty * 100) / 100,
    paper: Math.round(paperWeight * 10000) / 10000,
    corrugated: Math.round(corrWeight * 10000) / 10000,
  };
}

// ============================================================
// PACKING COST (A2)
// ============================================================
function calcPackingCost(qty, component, totalWeight, isProfitSharing = false) {
  const packing = component.packing || [];
  const pk = CALC.packing;
  const markup = isProfitSharing ? CALC.profit_sharing.packing_markup : 0;
  let paperbandCost = 0, kraftwrapCost = 0, cartonCost = 0, palletCost = 0, otherCost = 0;
  let kraftwrapQtyPerPack = 0, kraftwrapPacks = 0;

  // Calculate weight & thickness per piece for packing calc (matching legacy setCalculateThickness)
  const weightPerPiece = qty > 0 ? totalWeight / qty : 0;
  // Paper thickness from master data (mm)
  const paperThickMm = parseFloat(component.paper?.paper_thickness) || parseFloat(component.paper?.thickness_mm) || 0.3;
  // Corrugated thickness from master data (flute_thickness) — NOT flute height
  let corrThickMm = 0;
  if (component.component_type === 2 || component.component_type === 3) {
    // Lookup from corrugated_info master data
    const corr = component.corrugated || {};
    const corrDB = masterData.corrugated_info || [];
    const corrMatch = corrDB.find(r =>
      r.flute_type === corr.flute_type && r.num_layer === (corr.layer || 2) &&
      r.type_1 === (corr.grade?.[0] || '') && r.gram_1 === parseInt(corr.gram?.[0]) &&
      r.type_2 === (corr.grade?.[1] || '') && r.gram_2 === parseInt(corr.gram?.[1])
    );
    corrThickMm = corrMatch?.flute_thickness || corrMatch?.thickness || 1.15;
  }
  const packingLayers = parseInt(component.box_type?.packing_layer) || 2;
  const thicknessPerPieceMm = (paperThickMm + corrThickMm) * packingLayers;
  const thicknessPerPieceIn = thicknessPerPieceMm / 25.4;

  packing.forEach(p => {
    const type = (p.name || p.type || '').toLowerCase();
    const unitPrice = parseFloat(p.unit_price) || 0;

    if (type.includes('paperband') || type.includes('รัดกระดาษ')) {
      const pcsPerBand = parseInt(p.qty_per_pack) || pk.paperband_qty;
      const bands = Math.ceil(qty / pcsPerBand);
      paperbandCost += unitPrice > 0 ? bands * unitPrice : bands * pk.paperband_price;
    } else if (type.includes('kraftwrap') || type.includes('ห่อกระดาษ')) {
      // Calculate pcs/pack from weight + thickness (matching legacy setCalculateKraftwrapWeight)
      let pcsPerPack = parseInt(p.qty_per_pack) || 0;

      if (!pcsPerPack && weightPerPiece > 0 && thicknessPerPieceIn > 0) {
        // Legacy algorithm: stack layers until weight limit or height limit reached
        const weightLimit = 5; // kg (default_limit_kraftwrap_weight)
        // Height limit = Kraftwrap height (depth of box × packing layers) or fallback A3
        const kwDepthMm = parseFloat(component.packaging_size?.depth) || 0;
        const kwHeightIn = kwDepthMm > 0
          ? (kwDepthMm / 25.4) * packingLayers  // depth × packing layers (matching legacy)
          : parseFloat((Math.ceil(420 / 25.4 * 100) / 100).toFixed(2)); // fallback A3 = 16.54"
        const heightLimit = kwHeightIn;
        const numBulkPerLayer = parseInt(p.num_side_w || 1) * parseInt(p.num_side_l || 1) || 1;
        const weightPerLayer = weightPerPiece * numBulkPerLayer;

        let layerPerPack = 1;
        let tw = 0, th = 0;

        if (Math.floor(weightLimit / weightPerLayer) !== 0) {
          do {
            tw = weightPerLayer * layerPerPack;
            th = layerPerPack * thicknessPerPieceIn;
            layerPerPack++;
          } while (tw <= weightLimit && th <= heightLimit);

          if (tw <= weightLimit || th <= heightLimit) {
            layerPerPack -= 1;
          }

          // Round down to nearest 5 (matching legacy: pack เต็ม 5)
          const fullPack = Math.ceil(layerPerPack / 10) * 10;
          if (fullPack !== layerPerPack) {
            const diffLayer = fullPack - layerPerPack;
            layerPerPack = diffLayer <= 5 ? fullPack - 5 : fullPack - 10;
          }
          if (layerPerPack <= 0) layerPerPack = 1;
        }

        pcsPerPack = layerPerPack * numBulkPerLayer;
      }

      if (!pcsPerPack) pcsPerPack = 100; // default 100 cps/pack

      kraftwrapQtyPerPack = pcsPerPack;
      kraftwrapPacks = Math.ceil(qty / pcsPerPack);
      kraftwrapCost += unitPrice > 0 ? kraftwrapPacks * unitPrice : kraftwrapPacks * pk.kraftwrap_price;
    } else if (type.includes('carton') || type.includes('กล่องลูกฟูก')) {
      const cartons = Math.ceil(totalWeight / pk.carton_max_weight);
      cartonCost += unitPrice > 0 ? cartons * unitPrice : cartons * pk.carton_print_price * (1 + pk.carton_markup / 100);
    } else if (type.includes('pallet') || type.includes('พาเลท')) {
      const pallets = Math.ceil(totalWeight / pk.pallet_max_weight);
      palletCost += unitPrice > 0 ? pallets * unitPrice : pallets * pk.pallet_domestic;
    } else {
      otherCost += unitPrice * (parseFloat(p.qty) || qty);
    }
  });

  const subtotal = paperbandCost + kraftwrapCost + cartonCost + palletCost + otherCost;
  const total = subtotal * (1 + markup / 100);

  return {
    paperband: Math.round(paperbandCost * 100) / 100,
    kraftwrap: Math.round(kraftwrapCost * 100) / 100,
    kraftwrapQtyPerPack,
    kraftwrapPacks,
    carton: Math.round(cartonCost * 100) / 100,
    pallet: Math.round(palletCost * 100) / 100,
    other: Math.round(otherCost * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

// ============================================================
// SPECIAL INK COST (A3)
// ============================================================
function calcSpecialInkCost(paperUsage, component) {
  const specialInks = component.special_ink || [];
  if (!specialInks.length || !component.color?.is_special_ink) return { total: 0, items: [] };

  const afterUps = paperUsage.afterUps;
  const tier = findPriceTier(afterUps);
  let total = 0;
  const items = [];

  specialInks.forEach(ink => {
    let cost = 0;
    const inkType = (ink.ink_type || '').toLowerCase();

    if (tier) {
      // Special ink: typically 1.5x-3x normal color rate depending on type
      let rate = tier.print_1col || 0;
      if (inkType.includes('metallic') || inkType.includes('เมทัลลิก')) rate *= 3;
      else if (inkType.includes('fluorescent') || inkType.includes('เรืองแสง')) rate *= 2.5;
      else if (inkType.includes('pantone') || inkType.includes('แพนโทน')) rate *= 1.5;
      else rate *= 2; // default special ink factor

      cost = afterUps * rate;
    } else {
      cost = afterUps * 0.15; // fallback
    }

    total += cost;
    items.push({ color: ink.ink_color, type: ink.ink_type, cost: Math.round(cost * 100) / 100 });
  });

  return { total: Math.round(total * 100) / 100, items };
}

// ============================================================
// CORRUGATED COST (A4)
// ============================================================
/**
 * Corrugated Board Cost — matching legacy setCalculateCorrugatedBoard
 * สูตร: rate จาก corrugated_info → unit_inch = rate/144 → unit_price = unit_inch × flute_side × cut_off
 * + Corrugated Gluing Cost: flute_side × cut_off × corrugated_glued_cost
 */
function calcCorrugatedCost(qty, component, layout) {
  const corr = component.corrugated;
  if (!corr || (component.component_type !== 2 && component.component_type !== 3)) {
    return { total: 0, board: 0, gluing: 0 };
  }

  // === 1. Find rate from corrugated_info (matching legacy: grade + flute_type + qty tier) ===
  const afterUps = layout?.best ? Math.ceil(qty / layout.best.ups) : qty;
  const grade = (corr.grade || []).filter(g => g).join('/');
  const gram = (corr.gram || []).filter(g => g).map(g => String(g)).join('/');
  const gradeKey = grade + (gram ? gram : ''); // e.g. "CA125/CA125"
  const corrDB = masterData.corrugated_info || [];

  // Find matching rate by grade + flute_type + qty tier
  let rate = 0;
  const matchExact = corrDB.find(r =>
    r.grade === gradeKey && r.flute_type === corr.flute_type &&
    afterUps >= (r.min_qty || 0) && afterUps <= (r.max_qty || 999999999)
  );
  if (matchExact) {
    rate = matchExact.rate || 0;
  } else {
    // Fallback: match by layer + flute + grade codes
    const g = corr.grade || [];
    const gm = corr.gram || [];
    const matchGrade = corrDB.find(r =>
      r.num_layer === (corr.layer || 2) && r.flute_type === corr.flute_type &&
      r.type_1 === (g[0]||'') && r.type_2 === (g[1]||'') &&
      r.gram_1 === (gm[0]||0) && r.gram_2 === (gm[1]||0) &&
      afterUps >= (r.min_qty || 0) && afterUps <= (r.max_qty || 999999999)
    );
    rate = matchGrade?.rate || parseFloat(corr.cost_price) || 0;
  }

  // === 2. Calculate board size: layout size - tolerance (0.375 inch) ===
  const corrTolerance = CALC.corrugated_tolerance || 0.375; // inch
  let fluteSide_in = 0, cutOff_in = 0;

  if (layout?.best) {
    const layW_in = (layout.best.layoutW_mm || 0) / 25.4;
    const layL_in = (layout.best.layoutL_mm || 0) / 25.4;
    // Component type 2: paper + corrugated → corrugated = layout - tolerance
    if (component.component_type === 2) {
      fluteSide_in = Math.max(layW_in - corrTolerance, 0);
      cutOff_in = Math.max(layL_in - corrTolerance, 0);
    } else {
      // Component type 3: corrugated only → use roll width/cut off directly
      fluteSide_in = layout.best.rollW_in || layout.best.paperW_in || layW_in;
      cutOff_in = layout.best.rollL_in || layout.best.paperL_in || layL_in;
    }
  }

  // === 3. Unit price per sheet ===
  const corrMarkup = parseFloat(corr.corrugated_markup) || CALC.corrugated_markup || 10;
  const unitInch = rate > 0 ? parseFloat((rate / 144 * (1 + corrMarkup / 100)).toFixed(4)) : 0;
  const boardUnitPrice = parseFloat((unitInch * fluteSide_in * cutOff_in).toFixed(2));

  // === 4. Qty: after_ups + waste from waste_info (corrugated_board_rate), rounded ===
  // Matching legacy: lookup corrugated_board_rate from waste_info by after_ups
  let wasteBoard = 0;
  const wasteDB = masterData.waste_info || [];
  const ptNum = 1; // Offset = 1 (TODO: map print type)
  const wasteTierCorr = wasteDB.find(r =>
    r.print_type === ptNum && afterUps >= (r.min_qty || 0) && afterUps <= (r.max_qty || 999999999)
  );
  if (wasteTierCorr) {
    wasteBoard = wasteTierCorr.corrugated_board_rate || 0;
  }
  let boardQty = afterUps + wasteBoard;
  // Round corrugated qty to nearest 10 — matching legacy: Math.round (not ceil)
  boardQty = Math.round(boardQty / 10) * 10;

  const boardTotal = parseFloat((boardUnitPrice * boardQty).toFixed(2));

  // === 5. Corrugated Gluing Cost (ทากาวประกบลูกฟูก) ===
  const gluedCostRate = CALC.corrugated_glued_cost || 0.0015; // B per sq.inch
  const afterpressMarkup = CALC.afterpress_price_marking || 0;
  let gluingUnitPrice = parseFloat((fluteSide_in * cutOff_in * gluedCostRate).toFixed(2));
  gluingUnitPrice = parseFloat((gluingUnitPrice * (1 + afterpressMarkup / 100)).toFixed(2));
  const gluingTotal = parseFloat((gluingUnitPrice * boardQty).toFixed(2));

  return {
    // Board
    board: boardTotal,
    boardUnitPrice,
    boardQty,
    rate,
    unitInch,
    fluteSide_in: parseFloat(fluteSide_in.toFixed(3)),
    cutOff_in: parseFloat(cutOff_in.toFixed(3)),
    // Gluing
    gluing: gluingTotal,
    gluingUnitPrice,
    // Total
    total: boardTotal + gluingTotal,
  };
}

// ============================================================
// PROOF COST (B6)
// ============================================================
function calcProofCost(component, printType = 'Offset', isReprint = false) {
  const ptKey = printType.toLowerCase();

  // Legacy system: Proof is ONLY for Jet Press / Konica (digital)
  // Offset / Flexo do NOT charge proof (they use plates instead)
  if (ptKey !== 'jetpress' && ptKey !== 'konica' && ptKey !== 'jet press') {
    return { total: 0 };
  }

  // Digital proof: 500 THB per component
  const proofPrice = 500;
  return { total: proofPrice };
}

// ============================================================
// DELIVERY COST
// ============================================================
function calcDeliveryCost(totalWeight, destinationId) {
  if (!destinationId || totalWeight <= 0) {
    // Fallback: simple rate
    return {
      total: Math.max(CALC.delivery_min, CALC.delivery_rate_per_ton * totalWeight / 1000),
    };
  }

  const rateInfo = findDeliveryRate(destinationId, totalWeight);
  if (rateInfo) {
    const price = rateInfo.price + (rateInfo.additional_price || 0);
    return { total: Math.round(price * 100) / 100, rate: rateInfo };
  }

  return {
    total: Math.max(CALC.delivery_min, CALC.delivery_rate_per_ton * totalWeight / 1000),
  };
}

// ============================================================
// FULL ESTIMATE CALCULATION
// ============================================================
// ============================================================
// MULTI-F ESTIMATE (แยกคำนวณตาม F-code)
// ============================================================
/**
 * Multi-F: แต่ละ F-code มี qty/สี ต่างกัน
 * - Per-F: Paper, Plate, Print, SpecialInk, Proof, Foil, Emboss, Deboss (สี/addon ต่างกัน)
 * - Shared (คิดรวม): Coating, Diecut, Chip, Assembly, Inspection, Block, Corrugated, Packing
 * ตรงกับระบบเก่า: js_function_estimate_calculation.js
 */
function _calcMultiFEstimate(form, printType, isUV, isReprint, isProfitSharing, isColorLimit) {
  const fItems = form.f_data.filter(fd => parseInt(fd.qty) > 0);
  const totalQtyAllF = fItems.reduce((s, fd) => s + (parseInt(fd.qty) || 0), 0);
  const components = form.components || [];
  if (!components.length) return { error: 'ไม่มี Component' };

  const processFlags = {
    diecut: form.is_diecut !== undefined ? !!form.is_diecut : true,
    trim: form.is_trim !== undefined ? !!form.is_trim : false,
    chip: form.is_diecut !== undefined ? !!form.is_diecut : true,
    inspection: form.is_inspection !== undefined ? !!form.is_inspection : true,
  };

  const compResults = components.map((comp, ci) => {
    // Layout (shared — ทุก F ใช้ layout เดียวกัน)
    let layout = calcLayout(comp, printType);
    let actualPrintType = printType;
    if (layout.error && layout.unfolded) {
      const altTypes = ['Offset', 'Flexo', 'JetPress', 'Konica'].filter(t => t !== printType);
      for (const alt of altTypes) {
        const altMachine = selectMachine(comp, alt);
        const altLayout = calcLayout(comp, alt, altMachine);
        if (!altLayout.error) {
          altLayout.machine = altMachine;
          altLayout._autoPrintType = alt;
          layout = altLayout;
          actualPrintType = alt;
          break;
        }
      }
    }
    comp._layout = layout;
    comp._actualPrintType = actualPrintType;
    comp._process_flags = processFlags;
    if (layout.error) return { name: comp.component_name || ('Component ' + (ci + 1)), layout, error: layout.error };

    const ups = layout.best?.ups || 0;
    const pt = actualPrintType;

    // === Per-F results (Paper, Plate, Print, SpecialInk, Proof, Foil, Emboss, Deboss) ===
    const fResults = fItems.map((fd, fi) => {
      const fQty = parseInt(fd.qty) || 0;
      const fCode = fd.f_code || ('F' + (fi + 1));
      const fColorLimit = fd.color_limit || isColorLimit;

      // สร้าง temp component ด้วย per-F color override + per-F addon filter
      const fColor = comp._color_per_f?.[fi];
      let tempComp = Object.create(comp);

      // Color override
      if (fColor) {
        tempComp.color = {
          outside: fColor.outside != null ? fColor.outside : comp.color?.outside,
          inside: fColor.inside != null ? fColor.inside : comp.color?.inside,
          f_code: fColor.f_code || fCode,
          is_special_ink: !!fColor.is_special_ink,
        };
        if (fColor.is_special_ink && fColor.special_ink?.length > 0) {
          tempComp.special_ink = fColor.special_ink;
        } else {
          tempComp.special_ink = [];
        }
      }

      // Per-F addon filter: keep coating (shared waste) + only foil/emboss/deboss that apply to this F
      // ตรงกับระบบเก่า: addon.info?.f_code.includes(fCode)
      const allAddons = comp.addon || [];
      tempComp.addon = allAddons.filter(function(ad) {
        if (ad.type === 'foilstamp' || ad.type === 'emboss' || ad.type === 'deboss') {
          // Per-F: include only if this F is in addon's f_codes (or f_codes is empty = all F)
          var adFCodes = ad.f_codes || ad.info?.f_code || [];
          if (!adFCodes || !adFCodes.length) return true; // no restriction = all F
          return adFCodes.indexOf(fCode) >= 0;
        }
        return true; // coating and other addons: keep for waste calculation
      });

      const paperUsage = calcPaperUsage(fQty, ups, tempComp, pt, fColorLimit);
      if (!paperUsage) return { f_code: fCode, qty: fQty, error: 'Cannot calculate' };

      const paperCost = calcPaperCost(paperUsage, tempComp, isProfitSharing, comp.paper?.paper_source_id === '2');
      const plateCost = calcPlateCost(paperUsage, tempComp, pt, isReprint, isProfitSharing);
      const printCost = calcPrintCost(paperUsage, tempComp, pt, isProfitSharing, isUV);
      const specialInk = calcSpecialInkCost(paperUsage, tempComp);
      const proofCost = calcProofCost(tempComp, pt, isReprint);

      // Per-F foil/emboss/deboss cost (ตรงกับระบบเก่า: คิดเฉพาะ F ที่ระบุ)
      let foilCost = 0, embossCost = 0;
      const perFTier = findPriceTier(paperUsage.afterUps);
      if (perFTier) {
        tempComp.addon.forEach(function(ad) {
          if (ad.type === 'foilstamp') {
            foilCost += Math.max(findMinPrice('foilstamp', paperUsage.afterUps), paperUsage.afterUps * (perFTier.foilstamp || 0));
          } else if (ad.type === 'emboss' || ad.type === 'deboss') {
            embossCost += Math.max(findMinPrice('bossing', paperUsage.afterUps), paperUsage.afterUps * (perFTier.bossing || 0));
          }
        });
      }

      return {
        f_code: fCode,
        qty: fQty,
        paperUsage,
        paperCost,
        plateCost,
        printCost,
        specialInk,
        proofCost,
        foilCost: Math.round(foilCost * 100) / 100,
        embossCost: Math.round(embossCost * 100) / 100,
      };
    });

    // === Shared costs (คิดรวม — ใช้ total qty/paperUsage รวมทุก F) ===
    const totalAfterUps = fResults.reduce((s, fr) => s + (fr.paperUsage?.afterUps || 0), 0);
    const totalAfterWaste = fResults.reduce((s, fr) => s + (fr.paperUsage?.afterWaste || 0), 0);
    const totalPaperNet = fResults.reduce((s, fr) => s + (fr.paperUsage?.paperNet || 0), 0);
    const mergedPaperUsage = {
      qty: totalQtyAllF,
      ups: ups,
      afterUps: totalAfterUps,
      afterWaste: totalAfterWaste,
      paperNet: totalPaperNet,
      waste: { total: totalAfterWaste - totalAfterUps },
    };

    // Shared afterPress: strip foil/emboss/deboss (เพราะคิดเป็น per-F แล้ว)
    var sharedComp = Object.create(comp);
    sharedComp.addon = (comp.addon || []).filter(function(ad) {
      return ad.type !== 'foilstamp' && ad.type !== 'emboss' && ad.type !== 'deboss';
    });
    sharedComp._layout = comp._layout;
    sharedComp._process_flags = comp._process_flags;

    const afterPress = calcAfterPressCost(mergedPaperUsage, sharedComp, pt, isReprint);
    const corrugated = calcCorrugatedCost(totalQtyAllF, comp, layout);
    const weight = calcComponentWeight(totalQtyAllF, comp);
    const packingCost = calcPackingCost(totalQtyAllF, comp, weight.total, isProfitSharing);

    // === Per-F totals ===
    const perFMaterialTotal = fResults.reduce((s, fr) => s + (fr.paperCost?.total || 0), 0);
    const perFSpecialInk = fResults.reduce((s, fr) => s + (fr.specialInk?.total || 0), 0);
    const perFPlateTotal = fResults.reduce((s, fr) => s + (fr.plateCost?.total || 0), 0);
    const perFPrintTotal = fResults.reduce((s, fr) => s + (fr.printCost?.total || 0), 0);
    const perFProofTotal = fResults.reduce((s, fr) => s + (fr.proofCost?.total || 0), 0);
    const perFFoilTotal = fResults.reduce((s, fr) => s + (fr.foilCost || 0), 0);
    const perFEmbossTotal = fResults.reduce((s, fr) => s + (fr.embossCost || 0), 0);

    const materialTotal = perFMaterialTotal + perFSpecialInk + (corrugated.board || 0);
    const productionTotal = perFPlateTotal + perFPrintTotal + perFProofTotal + afterPress.total + perFFoilTotal + perFEmbossTotal + (corrugated.gluing || 0);
    const packingTotal = packingCost.total;
    const subtotal = materialTotal + productionTotal + packingTotal;

    return {
      name: comp.component_name || ('Component ' + (ci + 1)),
      layout,
      fResults,
      shared: { afterPress, corrugated, weight, packingCost, mergedPaperUsage, perFFoilTotal, perFEmbossTotal },
      // Summary totals
      materialTotal: Math.round(materialTotal * 100) / 100,
      productionTotal: Math.round(productionTotal * 100) / 100,
      packingTotal: Math.round(packingTotal * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
    };
  });

  // === Delivery ===
  const totalWeight = compResults.reduce((sum, cr) => sum + (cr.shared?.weight?.total || 0), 0);
  const deliveryCosts = (form.delivery || []).map(dl => calcDeliveryCost(totalWeight, dl.destinationId));
  const deliveryTotal = deliveryCosts.reduce((s, d) => s + d.total, 0);
  const deliveryResults = [{
    qty: totalQtyAllF,
    totalWeight: Math.round(totalWeight * 100) / 100,
    deliveryCosts,
    deliveryTotal,
  }];

  // === Grand totals ===
  let materialTotal = 0, productionTotal = 0, packingTotal = 0;
  compResults.forEach(cr => {
    materialTotal += cr.materialTotal || 0;
    productionTotal += cr.productionTotal || 0;
    packingTotal += cr.packingTotal || 0;
  });

  let otherCostTotal = (form.otherCost || []).reduce((s, oc) => s + (parseFloat(oc.price) || 0), 0);
  let priceDiffTotal = (form.priceDiff || []).reduce((s, pd) => s + (parseFloat(pd.value) || 0) * totalQtyAllF, 0);
  let giftTotal = (form.customer_gift || []).reduce((s, cg) => s + (parseFloat(cg.value) || 0), 0);

  let processInfoTotal = 0;
  ['plate', 'proof', 'print', 'process', 'handwork', 'material', 'other'].forEach(function(sec) {
    (form.process_info?.[sec] || []).forEach(function(item) {
      processInfoTotal += parseFloat(item.line?.[0]?.price) || 0;
    });
  });

  let formProcessTotal = 0;
  const formProcessItems = [];
  ['other_process', 'handwork_process', 'outsource'].forEach(function(key) {
    (form[key] || []).forEach(function(p) {
      const cost = parseFloat(p.cost) || 0;
      if (cost > 0) {
        const itemTotal = p.fixed_price ? cost * totalQtyAllF : cost;
        formProcessTotal += itemTotal;
        formProcessItems.push({ name: p.name, cost: cost, fixed_price: p.fixed_price, total: itemTotal, section: key });
      }
    });
  });
  ['materials', 'other_items'].forEach(function(key) {
    (form[key] || []).forEach(function(p) {
      const cost = parseFloat(p.cost) || 0;
      const itemQty = p.fixed_qty ? (parseFloat(p.qty) || 1) : totalQtyAllF;
      if (cost > 0) {
        const itemTotal = cost * itemQty;
        formProcessTotal += itemTotal;
        formProcessItems.push({ name: p.name, cost: cost, qty: itemQty, total: itemTotal, section: key });
      }
    });
  });

  const subtotal = materialTotal + productionTotal + packingTotal + otherCostTotal + deliveryTotal + processInfoTotal + formProcessTotal;
  const markingPercent = findMarkingPercent(totalQtyAllF);
  const afterMarking = subtotal * (1 + markingPercent / 100);
  const withAdjust = afterMarking + priceDiffTotal + giftTotal;
  const tax = withAdjust * CALC.tax_percent / 100;
  const withTax = withAdjust + tax;
  let profitSharingAmount = 0;
  if (isProfitSharing) {
    profitSharingAmount = Math.max(CALC.profit_sharing.total_min, withTax * CALC.profit_sharing.total_markup / 100);
  }
  const finalPrice = withTax + profitSharingAmount;
  const unitPrice = totalQtyAllF > 0 ? finalPrice / totalQtyAllF : 0;

  return {
    isMultiF: true,
    fMeta: fItems.map(fd => ({ f_code: fd.f_code, qty: parseInt(fd.qty) || 0 })),
    components: compResults,
    delivery: deliveryResults,
    totals: [{
      qty: totalQtyAllF,
      materialTotal: Math.round(materialTotal * 100) / 100,
      productionTotal: Math.round(productionTotal * 100) / 100,
      packingTotal: Math.round(packingTotal * 100) / 100,
      otherCostTotal: Math.round(otherCostTotal * 100) / 100,
      deliveryTotal: Math.round(deliveryTotal * 100) / 100,
      processInfoTotal: Math.round(processInfoTotal * 100) / 100,
      formProcessTotal: Math.round(formProcessTotal * 100) / 100,
      formProcessItems,
      subtotal: Math.round(subtotal * 100) / 100,
      markingPercent,
      afterMarking: Math.round(afterMarking * 100) / 100,
      priceDiffTotal: Math.round(priceDiffTotal * 100) / 100,
      giftTotal: Math.round(giftTotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      profitSharingAmount: Math.round(profitSharingAmount * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
      unitPrice: Math.round(unitPrice * 100) / 100,
      weight: Math.round(totalWeight * 100) / 100,
    }],
  };
}

function calcFullEstimate(form) {
  const printType = form.print_type || 'Offset';
  const isUV = form.ink_type === 'UV';
  const isReprint = form.is_reprinted || false;
  const isProfitSharing = form.profit_sharing || false;
  const isColorLimit = !!form.limit_color;

  // === MULTI-F MODE: คำนวณแยกตาม F-code (แต่ละ F มีสี/จำนวนต่างกัน) ===
  const isMultiF = !!(form.has_multi_f && form.f_data?.length > 0 && form.f_data.some(fd => parseInt(fd.qty) > 0));
  if (isMultiF) {
    return _calcMultiFEstimate(form, printType, isUV, isReprint, isProfitSharing, isColorLimit);
  }

  const qtys = form.qty.filter(q => q).map(q => parseInt(q));
  if (!qtys.length) return { error: 'ไม่มีจำนวน' };

  const components = form.components || [];
  if (!components.length) return { error: 'ไม่มี Component' };

  // Build process flags from form
  const processFlags = {
    diecut: form.is_diecut !== undefined ? !!form.is_diecut : true,
    trim: form.is_trim !== undefined ? !!form.is_trim : false,
    chip: form.is_diecut !== undefined ? !!form.is_diecut : true,
    inspection: form.is_inspection !== undefined ? !!form.is_inspection : true,
  };

  // Step 1: Calculate layout for each component (auto-switch print type ถ้าขนาดเกิน)
  const compResults = components.map((comp, ci) => {
    let layout = calcLayout(comp, printType);
    let actualPrintType = printType;

    // Auto-switch: ถ้า layout error + มี unfolded → ลองเครื่องอื่น
    if (layout.error && layout.unfolded) {
      const altTypes = ['Offset', 'Flexo', 'JetPress', 'Konica'].filter(t => t !== printType);
      for (const alt of altTypes) {
        const altMachine = selectMachine(comp, alt);
        const altLayout = calcLayout(comp, alt, altMachine);
        if (!altLayout.error) {
          altLayout.machine = altMachine;
          altLayout._autoPrintType = alt;
          layout = altLayout;
          actualPrintType = alt;
          break;
        }
      }
    }

    comp._layout = layout;
    comp._actualPrintType = actualPrintType;
    comp._process_flags = processFlags;

    if (layout.error) return { name: comp.component_name || `Component ${ci+1}`, layout, error: layout.error };

    const ups = layout.best?.ups || 0;

    // Step 2: Paper usage, waste, cost for each qty (ใช้ actualPrintType จาก auto-switch)
    const pt = actualPrintType;
    const qtyResults = qtys.map(qty => {
      const paperUsage = calcPaperUsage(qty, ups, comp, pt, isColorLimit);
      if (!paperUsage) return { qty, error: 'Cannot calculate' };

      const paperCost = calcPaperCost(paperUsage, comp, isProfitSharing, comp.paper?.paper_source_id === '2');
      const plateCost = calcPlateCost(paperUsage, comp, pt, isReprint, isProfitSharing);
      const printCost = calcPrintCost(paperUsage, comp, pt, isProfitSharing, isUV);
      const afterPress = calcAfterPressCost(paperUsage, comp, pt, isReprint);
      const specialInk = calcSpecialInkCost(paperUsage, comp);
      const corrugated = calcCorrugatedCost(qty, comp, comp._layout);
      const proofCost = calcProofCost(comp, pt, isReprint);
      const weight = calcComponentWeight(qty, comp);
      const packingCost = calcPackingCost(qty, comp, weight.total, isProfitSharing);

      // Material = Paper + Corrugated Board + Blanket (ผ้ายาง — สำหรับงานเว้นลิ้น)
      // ไม่รวม gluing — gluing อยู่ใน Process ตามระบบเก่า
      const materialTotal = paperCost.total + (corrugated.board || 0) + (afterPress.blanket || 0);
      // Production = Plate + Print + Process + SpecialInk + Proof + Corrugated Gluing
      // ⚠️ Process ใน production ต้องลบ blanket ออก (เพราะนับใน material แล้ว)
      const processOnlyTotal = (afterPress.total || 0) - (afterPress.blanket || 0);
      const productionTotal = plateCost.total + printCost.total + processOnlyTotal + specialInk.total + proofCost.total + (corrugated.gluing || 0);
      const packingTotal = packingCost.total;
      const subtotal = materialTotal + productionTotal + packingTotal;

      return {
        qty,
        paperUsage,
        paperCost,
        plateCost,
        printCost,
        afterPress,
        specialInk,
        corrugated,
        proofCost,
        packingCost,
        weight,
        materialTotal: Math.round(materialTotal * 100) / 100,
        productionTotal: Math.round(productionTotal * 100) / 100,
        packingTotal: Math.round(packingTotal * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
      };
    });

    return {
      name: comp.component_name || `Component ${ci+1}`,
      layout,
      results: qtyResults,
    };
  });

  // Step 3: Delivery cost
  const deliveryResults = qtys.map((qty, qi) => {
    const totalWeight = compResults.reduce((sum, cr) => {
      const qr = cr.results?.[qi];
      return sum + (qr?.weight?.total || 0);
    }, 0);

    const deliveryCosts = (form.delivery || []).map(dl => {
      return calcDeliveryCost(totalWeight, dl.destinationId);
    });

    return {
      qty,
      totalWeight: Math.round(totalWeight * 100) / 100,
      deliveryCosts,
      deliveryTotal: deliveryCosts.reduce((s, d) => s + d.total, 0),
    };
  });

  // Step 4: Totals per qty
  const totals = qtys.map((qty, qi) => {
    let materialTotal = 0, productionTotal = 0, packingTotal = 0;
    compResults.forEach(cr => {
      const qr = cr.results?.[qi];
      if (qr) {
        materialTotal += qr.materialTotal;
        productionTotal += qr.productionTotal;
        packingTotal += qr.packingTotal || 0;
      }
    });

    // Other costs
    let otherCostTotal = (form.otherCost || []).reduce((s, oc) => s + (parseFloat(oc.price) || 0), 0);
    let priceDiffTotal = (form.priceDiff || []).reduce((s, pd) => s + (parseFloat(pd.value) || 0) * qty, 0);
    let giftTotal = (form.customer_gift || []).reduce((s, cg) => s + (parseFloat(cg.value) || 0), 0);

    const deliveryTotal = deliveryResults[qi]?.deliveryTotal || 0;

    // Process info costs (from legacy process_info structure)
    let processInfoTotal = 0;
    const piSections = ['plate','proof','print','process','handwork','material','other'];
    piSections.forEach(sec => {
      (form.process_info?.[sec] || []).forEach(item => {
        processInfoTotal += parseFloat(item.line?.[0]?.price) || 0;
      });
    });

    // Form-level process costs (other_process, handwork, outsource, materials, other_items)
    let formProcessTotal = 0;
    const formProcessItems = [];
    ['other_process', 'handwork_process', 'outsource'].forEach(key => {
      (form[key] || []).forEach(p => {
        const cost = parseFloat(p.cost) || 0;
        if (cost > 0) {
          const itemTotal = p.fixed_price ? cost * qty : cost;
          formProcessTotal += itemTotal;
          formProcessItems.push({ name: p.name, cost, fixed_price: p.fixed_price, total: itemTotal, section: key });
        }
      });
    });
    ['materials', 'other_items'].forEach(key => {
      (form[key] || []).forEach(p => {
        const cost = parseFloat(p.cost) || 0;
        const itemQty = p.fixed_qty ? (parseFloat(p.qty) || 1) : qty;
        if (cost > 0) {
          const itemTotal = cost * itemQty;
          formProcessTotal += itemTotal;
          formProcessItems.push({ name: p.name, cost, qty: itemQty, total: itemTotal, section: key });
        }
      });
    });

    const subtotal = materialTotal + productionTotal + packingTotal + otherCostTotal + deliveryTotal + processInfoTotal + formProcessTotal;

    // Marking (discount for volume)
    const markingPercent = findMarkingPercent(qty);
    const afterMarking = subtotal * (1 + markingPercent / 100);

    // Price diff & gift
    const withAdjust = afterMarking + priceDiffTotal + giftTotal;

    // Tax
    const tax = withAdjust * CALC.tax_percent / 100;
    const withTax = withAdjust + tax;

    // Profit sharing
    let profitSharingAmount = 0;
    if (isProfitSharing) {
      profitSharingAmount = Math.max(CALC.profit_sharing.total_min, withTax * CALC.profit_sharing.total_markup / 100);
    }

    const finalPrice = withTax + profitSharingAmount;
    const unitPrice = qty > 0 ? finalPrice / qty : 0;

    return {
      qty,
      materialTotal: Math.round(materialTotal * 100) / 100,
      productionTotal: Math.round(productionTotal * 100) / 100,
      packingTotal: Math.round(packingTotal * 100) / 100,
      otherCostTotal: Math.round(otherCostTotal * 100) / 100,
      deliveryTotal: Math.round(deliveryTotal * 100) / 100,
      processInfoTotal: Math.round(processInfoTotal * 100) / 100,
      formProcessTotal: Math.round(formProcessTotal * 100) / 100,
      formProcessItems,
      subtotal: Math.round(subtotal * 100) / 100,
      markingPercent,
      afterMarking: Math.round(afterMarking * 100) / 100,
      priceDiffTotal: Math.round(priceDiffTotal * 100) / 100,
      giftTotal: Math.round(giftTotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      profitSharingAmount: Math.round(profitSharingAmount * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
      unitPrice: Math.round(unitPrice * 100) / 100,
      weight: deliveryResults[qi]?.totalWeight || 0,
    };
  });

  return {
    components: compResults,
    delivery: deliveryResults,
    totals,
  };
}

// ============================================================
// EXPORTS
// ============================================================
window.CalcEngine = {
  CALC,
  loadCalcMasters,
  calcLayout,
  calcUnfoldedSize,
  calcCorrugatedBoardSize,
  calcOverlapSaving,
  roundToEven,
  roundDecimal,
  calcPaperUsage,
  calcWaste,
  calcPaperCost,
  calcPlateCost,
  calcPrintCost,
  calcAfterPressCost,
  calcPackingCost,
  calcSpecialInkCost,
  calcCorrugatedCost,
  calcProofCost,
  calcComponentWeight,
  calcDeliveryCost,
  calcFullEstimate,
  calcBoxArea,
  // A1: Machine selection
  getMachine,
  getMachinesForPrintType,
  getAllMachines,
  selectMachine,
  validateMachine,
  // lookups (original + A2 new)
  findPriceTier,
  findWasteTier,
  findMinPrice,
  findCoatingRate,
  findDeliveryRate,
  findMarkingPercent,
  findFoilStampColor,
  findSpecialInkInfo,
  findPaperCode,
  findExchangeRate,
  findProcessType,
  findStdPaperSize,
  findStdPaperSizes,
  getStdPapersForMachine,
  masterData,
};
