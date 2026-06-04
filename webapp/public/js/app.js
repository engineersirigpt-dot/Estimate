/**
 * Pornchai RFQ Agent - Main Application
 * Sirivatana Interprint Public Company Limited
 */

const API = '';
const EST_FRONTEND = 'http://192.168.5.3:3040';

// ============================================================
// STATE
// ============================================================
const State = {
  rfqList: [],
  conversationId: null,
  currentView: 'home',
  chatOpen: false,
  // Form data model
  form: null,
  formMode: null, // 'create' | 'edit' | 'view'
  formEditId: null,
  fieldSource: {}, // tracks which fields were filled by AI
  _formTouched: false, // true = user/AI started filling → show warnings
  // Master data caches
  masters: {},
};

function freshForm() {
  return {
    job_name: '',
    customer: { customer_id: '', customer_name: '' },
    ae: { emp_id: '', emp_name: '' },
    estimator: { emp_id: '', emp_name: '' },
    currency_no: 'THB',
    exchange_rate: '1',
    tax: '7',
    ref_copy_id: '',
    doc_status: 'Draft',
    request_approve: false,
    new_customer: false,
    has_multi_f: false,
    f_data: [],  // Multi-F: array of freshFData()
    f_total_qty: 0,
    last_updated: '',
    created_by: '',
    credit_term: '',
    credit_term_id: '',
    credit_term_name: '',
    job_type: 'new',
    ink_type: 'conventional',  // conventional, UV
    print_type: 'Offset',     // Offset, Flexo, JetPress, Konica
    machine_id: '',           // Auto or specific machine ID
    flexo_size: '',
    limit_color: false,
    limit_color_qty: '',
    profit_sharing: false,
    is_reprinted: false,
    is_use_previous_plate: false,
    is_loss: false,
    // Qty
    qty: [''],
    run_on_percent: '0',
    run_on_values: ['0'],
    ae_qty: '',
    customer_qty: '',
    // Sections
    components: [freshComponent()],
    // Process info (top-level cost sections)
    process_info: {
      plate: [],      // ค่าแม่พิมพ์
      proof: [],      // ค่าพิสูจน์
      print: [],      // ค่าพิมพ์
      process: [],    // ค่ากระบวนการ
      other: [],      // อื่นๆ
      handwork: [],   // งานมือ
      material: [],   // วัสดุ
    },
    // Process checkboxes
    is_diecut: true,        // ปั๊มไดคัท (default: เปิด — งานบรรจุภัณฑ์ส่วนใหญ่มี diecut)
    is_trim: false,         // ตัดเจียน
    is_chip: true,          // แกะ (default: เปิด — ถ้ามี diecut ต้องแกะ)
    is_inspection: true,    // ตรวจงาน (default: เปิด)
    is_bag: false,
    is_shrinkwrap: false,
    estimate_check: false,
    // Legacy process arrays (simple)
    process: [],
    other_process: [],
    handwork_process: [],
    outsource: [],
    materials: [],
    other_items: [],
    attach_files: [],
    delivery: [],
    // Price adjustments
    otherCost: [],
    priceDiff: [],
    customer_gift: [],
    // Other
    customer_margin: false,
    customer_margin_value: '',
    remark: '',
    remark_ae: '',
  };
}

function freshComponent() {
  return {
    component_name: '',
    component_type: 1, // 1=ไม่ประกบลูกฟูก, 2=ประกบลูกฟูก, 3=เฉพาะลูกฟูก
    corrugate_type: 'none',
    // Corrugated (when component_type=2 or 3)
    corrugated: {
      layer: 0, flute_type: '', thickness: '', grade: ['', '', '', '', ''],
      cost_price: '', pricing_unit: 'bath', flute_side: '', cut_off: '',
    },
    box_type: { type_id: '', type_name: '', glued_spot: 0, packing_layer: 2, is_digital_diecut: false },
    packaging_size: {
      width: '', length: '', depth: '',
      glue_flap: '15', tuck_flap: '15', dust_flap: '',
    },
    // สี (color as numbers matching API)
    color: {
      outside: '', inside: '0', f_code: '',
      is_special_ink: false, black_printing_outside: false, black_printing_inside: false,
      special_ink: [],
    },
    // กระดาษ
    paper: {
      paper_source_id: '',
      paper_type: '', paper_code: '', paper_name: '',
      paper_gram: '', paper_thickness: '',
      paper_brand: '', paper_grade: '',
      paper_roll_cut: '0.0',
      paper_cost: '', paper_sale: '', paper_bkg: '',
      paper_price_per_sheet: false,
      paper_markup: '10', paper_percent: '0',
      paper_note: '', is_custom: false,
    },
    // Addon: coating, foil, emboss, deboss (matching API addon array)
    addon: [],
    // Block cost (ค่าบล็อค — กรอกเอง)
    block_cost: '',
    // Per-component process (e.g., diecut per component)
    comp_process: [],
    // Packing specs
    packing: [],
    // Carton hierarchy (extracted from spec or computed from packs/carton)
    qty_per_carton: 0,         // ชิ้นต่อ carton (จาก spec เช่น 1785)
    packs_per_carton: 0,       // packs ต่อ carton (auto = qty_per_carton / qty_per_pack)
    qty_per_paperband: 0,      // ชิ้นต่อ band
    cartons_per_pallet: 0,     // cartons ต่อ pallet (auto from physical limits)
    // Template
    template_id: '',
    f_detail: '',
    // Paper tolerance
    paper_tolerance: '',
  };
}
function freshAddon(type = 'coating') {
  return {
    type_id: '', type: type, process_id: '', name: '',
    info: { code: '', type: '', name: '', side: 1, width: '', length: '', material_type: '', coating_price: '', min_cost: '', unit_min_cost: 'sheet' },
    line: [],
  };
}
function freshCompProcess(type = 'afterpress') {
  return { type: type, type_id: '', process_id: '', name: '', info: {}, line: [] };
}
function freshPacking() {
  return { type: 'packing', name: '', type_id: 11, process_id: '', info: { unit_price: '', num_side: [1,1] }, line: [] };
}

function freshSpecialInk() { return { ink_color: '', ink_type: '', printing_style: '' }; }
function freshProcess() { return { type: '', type_id: '', process_id: '', name: '', line: '', info: {} }; }
function freshProcessInfoItem() { return { process_id: '', unit_id: 1, process_name: '', remark: '', is_apply_all_edition: true, info: {}, line: [{ process_qty: '', unit_price: '', price: '' }] }; }
function freshOtherProcess() { return { name: '', detail: '', cost: '', fixed_price: true }; }
function freshHandwork() { return { name: '', detail: '', cost: '', fixed_price: true }; }
function freshOutsource() { return { name: '', detail: '', cost: '', fixed_price: true }; }
function freshMaterial() { return { name: '', cost: '', fixed_qty: true, qty: '' }; }
function freshOtherItem() { return { name: '', cost: '', fixed_qty: true, qty: '' }; }
function freshDelivery() { return { round: '', destinationId: '', destinationName: '', province: '', dueDate: '', net_weight: '', split_delivery: false }; }
function freshOtherCost() { return { name: '', qty: '', unit_price: '', price: '' }; }
function freshPriceDiff() { return { name: '', value: '' }; }
function freshCustomerGift() { return { name: '', value: '' }; }
function freshFData() {
  return { f_code: '', qty: '', run_on_percent: '', run_on_value: '', ae_qty: '', customer_qty: '', total_qty: '', color_limit: false, color_limit_qty: '' };
}
function freshQuotation() {
  return {
    quotation_id: '', rfq_id: '', customer_name: '', customer_address: '',
    issue_date: new Date().toISOString().split('T')[0], payment_condition: '',
    valid_days: '30', valid_date: '', contact_person: '', contact_tel: '', contact_fax: '',
    contact_mobile: '', contact_email: '', ae_name: '', job_info_type: 'domestic',
    request_approve: false, approver1: '', approver2: '',
    currency_no: 'THB', exchange_rate: '1',
    items: [{ item_no: 1, item_name: '', unit: 'ชิ้น', qty: '', unit_price: '', total: '', unit_price_fc: '', total_fc: '' }],
    quotation_text: '',
  };
}

// ============================================================
// API HELPERS
// ============================================================
async function apiFetch(path, opts = {}) {
  // Timeout: 8s for data APIs, 60s for parse/chat APIs
  const timeoutMs = /parse-spec|chat/.test(path) ? 60000 : 8000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API}${path}`, { ...opts, signal: controller.signal });
    clearTimeout(timer);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Server ตอบกลับไม่ถูกต้อง (${res.status}): ${text.substring(0, 100)}`);
    }
    return res.json();
  } catch(e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error(`API timeout (${timeoutMs/1000}s): ${path}`);
    throw e;
  }
}

async function apiGet(path) { return apiFetch(path); }

async function apiPost(path, body) {
  return apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function autocomplete(type, term) {
  if (!term || term.length < 1) return [];
  // Employee search uses local cache endpoint (API only searches by ID, not name)
  if (type === 'employee') {
    return apiGet(`/api/employees/search?term=${encodeURIComponent(term)}`);
  }
  return apiGet(`/api/estimate/autocomplete?type=${type}&term=${encodeURIComponent(term)}`);
}

// Hardcoded fallback for critical master data (works offline)
const FALLBACK_MASTERS = {
  boxtemplate_info: [
    { type_id: 1, type_name: 'Reverse Tuck End : ฝาคู่แบบฝาสลับ' },
    { type_id: 2, type_name: 'Straight Tuck End : ฝาคู่แบบฝาตรง' },
    { type_id: 3, type_name: 'TTSLB : ออโต้ล็อคหูขัด' },
    { type_id: 4, type_name: 'TTAB : ออโต้ล็อคทากาว' },
    { type_id: 5, type_name: 'Double Glue Side Wall : กล่องฝาครอบ' },
    { type_id: 6, type_name: 'Frame-Vue Tray' },
    { type_id: 7, type_name: 'Four Corner Beers Tray' },
    { type_id: 8, type_name: 'Gable Top : กล่องจั่ว' },
    { type_id: 9, type_name: 'Sleeve : ปลอก' },
    { type_id: 10, type_name: 'Pillow Box : ทรงหมอน' },
    { type_id: 11, type_name: 'Seal End : ฝาปิดทากาว' },
    { type_id: 12, type_name: 'Custom : รูปแบบกำหนดเอง' },
  ],
  coating_info: [
    { coating_code: 'WTB', coating_type: 'Waterbase', coating_name: 'Waterbase', coating_option: 'Gloss' },
    { coating_code: 'WTB', coating_type: 'Waterbase', coating_name: 'Waterbase Matt', coating_option: 'Matt' },
    { coating_code: 'WTB-HR', coating_type: 'Waterbase Hi-Rub', coating_name: 'Waterbase Hi-Rub', coating_option: 'Gloss' },
    { coating_code: 'WTB-HR', coating_type: 'Waterbase Hi-Rub', coating_name: 'Waterbase Hi-Rub Matt', coating_option: 'Matt' },
    { coating_code: 'OPP', coating_type: 'OPP', coating_name: 'OPP Film', coating_option: 'Gloss' },
    { coating_code: 'OPP', coating_type: 'OPP', coating_name: 'OPP Film Matt', coating_option: 'Matt' },
    { coating_code: 'UV', coating_type: 'UV Coating', coating_name: 'UV Coating', coating_option: 'Gloss' },
    { coating_code: 'UVO', coating_type: 'UV Offset', coating_name: 'UV Offset', coating_option: 'Gloss' },
    { coating_code: 'PVA', coating_type: 'PVA', coating_name: 'PVA', coating_option: 'Gloss' },
    { coating_code: 'WP', coating_type: 'Water Proof', coating_name: 'Water Proof (กันชื้น)', coating_option: 'Other' },
  ],
  foilstamp_info: [
    { foil_code: 'GLD', foil_color: 'ทอง (Gold)', foil_type: 'metallic' },
    { foil_code: 'SLV', foil_color: 'เงิน (Silver)', foil_type: 'metallic' },
    { foil_code: 'GLD-M', foil_color: 'ทองด้าน (Matt Gold)', foil_type: 'metallic' },
    { foil_code: 'SLV-M', foil_color: 'เงินด้าน (Matt Silver)', foil_type: 'metallic' },
    { foil_code: 'RGD', foil_color: 'Rose Gold', foil_type: 'metallic' },
    { foil_code: 'RED', foil_color: 'แดง (Red)', foil_type: 'color' },
    { foil_code: 'BLU', foil_color: 'น้ำเงิน (Blue)', foil_type: 'color' },
    { foil_code: 'GRN', foil_color: 'เขียว (Green)', foil_type: 'color' },
    { foil_code: 'BLK', foil_color: 'ดำ (Black)', foil_type: 'color' },
    { foil_code: 'WHT', foil_color: 'ขาว (White)', foil_type: 'color' },
    { foil_code: 'HOLO', foil_color: 'Hologram', foil_type: 'hologram' },
  ],
  corrugated_info: [
    { num_layer: 2, flute_type: 'E', type_1: 'CA', gram_1: 125, type_2: 'CA', gram_2: 125 },
    { num_layer: 2, flute_type: 'E', type_1: 'CA', gram_1: 150, type_2: 'CA', gram_2: 150 },
    { num_layer: 2, flute_type: 'E', type_1: 'KA', gram_1: 125, type_2: 'CA', gram_2: 125 },
    { num_layer: 2, flute_type: 'E', type_1: 'KA', gram_1: 150, type_2: 'CA', gram_2: 150 },
    { num_layer: 2, flute_type: 'B', type_1: 'CA', gram_1: 125, type_2: 'CA', gram_2: 125 },
    { num_layer: 2, flute_type: 'B', type_1: 'KA', gram_1: 125, type_2: 'CA', gram_2: 125 },
    { num_layer: 3, flute_type: 'E', type_1: 'KA', gram_1: 125, type_2: 'CA', gram_2: 125, type_3: 'KA', gram_3: 125 },
    { num_layer: 3, flute_type: 'B', type_1: 'KA', gram_1: 125, type_2: 'CA', gram_2: 125, type_3: 'KA', gram_3: 125 },
  ],
  paper_code_type: [
    { code: 'AC', label: 'AC - Art Card' }, { code: 'AC C1s', label: 'AC C1s' }, { code: 'AC C2s', label: 'AC C2s' },
    { code: 'Dup GBB', label: 'Dup GBB - Duplex GBB' }, { code: 'Dup WBB', label: 'Dup WBB' }, { code: 'Dup BBB', label: 'Dup BBB' },
    { code: 'GA', label: 'GA - Grey Art' }, { code: 'MA', label: 'MA - Matt Art' },
    { code: 'SBS', label: 'SBS' }, { code: 'CRB', label: 'CRB' }, { code: 'IVR', label: 'IVR - Ivory' },
    { code: 'KA', label: 'KA - Kraft' }, { code: 'KI', label: 'KI' },
  ],
};

async function loadMaster(type) {
  if (State.masters[type]) return State.masters[type];
  try {
    const data = await apiGet(`/api/estimate/master_data?type=${type}`);
    if (Array.isArray(data) && data.length > 0) {
      State.masters[type] = data;
      return data;
    }
  } catch(e) {
    console.warn(`[loadMaster] ${type} failed:`, e.message);
  }
  // Fallback to hardcoded data
  if (FALLBACK_MASTERS[type]) {
    State.masters[type] = FALLBACK_MASTERS[type];
    return FALLBACK_MASTERS[type];
  }
  return [];
}

// ============================================================
// UTILITIES
// ============================================================
function $(id) { return document.getElementById(id); }
// Date format helpers: YYYY-MM-DD ↔ DD/MM/YYYY
function fmtDateDMY(isoDate) {
  if (!isoDate) return '';
  const m = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : isoDate;
}
function parseDateDMY(dmyStr) {
  if (!dmyStr) return '';
  const m = String(dmyStr).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}` : '';
}
function escapeHtml(t) {
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast-msg ${type}`;
  el.textContent = msg;
  $('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function debounce(fn, ms = 300) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

function num(v) { return v ? Number(v).toLocaleString() : '-'; }
function money(v) { const n = Number(v); return isNaN(n) ? '-' : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

// ============================================================
// VIEW MANAGEMENT
// ============================================================
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(id).classList.add('active');
  State.currentView = id;
}

function setTopBar(title, sub) {
  // Top bar is hidden in new layout; keep as no-op for compatibility
  const t = $('topTitle'); if (t) t.textContent = title;
  const s = $('topSub'); if (s) s.textContent = sub || '';
}

function updateNavActive(id) {
  document.querySelectorAll('.header-nav .nav-btn').forEach(b => b.classList.remove('active'));
  if (id) { const el = $(id); if (el) el.classList.add('active'); }
}

function goHome() {
  showView('viewHome');
  setTopBar('Pornchai RFQ Agent', 'Estimate Packaging System');
  updateNavActive('navHome');
}

// ============================================================
// THEME
// ============================================================
function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}
function updateThemeIcon(t) {
  $('themeIcon').className = t === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ============================================================
// RFQ LIST (renders into main view area)
// ============================================================
async function loadRFQList() {
  try {
    const data = await apiGet('/api/rfq/list?limit=50');
    State.rfqList = data;
    // Only render if user is on RFQ List page (not Tools or AI Brain)
    if (State._activeTab === 'rfqlist') renderRFQListInView(data);
  } catch (e) {
    if (State._activeTab === 'rfqlist') {
      const dc = $('dataContent');
      if (dc) dc.innerHTML = '<div class="loading-spinner" style="color:#f08080">เชื่อมต่อระบบไม่ได้</div>';
    }
  }
}

function renderRFQList(data) {
  // Legacy compat — now renders into main view
  renderRFQListInView(data);
}

function renderRFQListInView(data) {
  const dc = $('dataContent');
  if (!dc) return;
  const rows = data.map(item => {
    const sc = item.status === 'Approve' ? 'approve' : item.status === 'Pending' ? 'pending' : 'draft';
    return `<tr style="cursor:pointer" onclick="App.viewDetail('${item.job_id}')" onmouseover="this.style.background='var(--rfq-hover)'" onmouseout="this.style.background=''">
      <td><span style="color:var(--accent);font-weight:600">${item.job_id}</span></td>
      <td>${item.job_name || '-'}</td>
      <td>${item.customer || '-'}</td>
      <td>${item.ae || '-'}</td>
      <td style="text-align:right">${num(item.qty)}</td>
      <td style="text-align:right">${num(item.total_price)}</td>
      <td><span class="rfq-status ${sc}">${item.status || 'Draft'}</span></td>
      <td style="font-size:11px;color:var(--text-muted)">${item.created || '-'}</td>
    </tr>`;
  }).join('');
  dc.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <h4 style="margin:0;font-size:20px;font-weight:700"><i class="fas fa-list" style="color:var(--accent);margin-right:8px"></i>RFQ List</h4>
      <div style="display:flex;gap:6px;align-items:center">
        <input type="text" id="rfqListSearch" placeholder="ค้นหา RFQ..." oninput="App.filterRFQ(this.value)" class="form-input" style="width:clamp(140px,25vw,200px);padding:6px 12px;border-radius:20px;font-size:12px">
        <button class="icon-btn" onclick="App.toggleAdvSearch()" title="ค้นหาขั้นสูง" style="width:32px;height:32px;font-size:12px"><i class="fas fa-filter"></i></button>
        <button class="export-btn green" onclick="App.exportExcel()" title="Export Excel"><i class="fas fa-file-excel"></i> Export</button>
        <button onclick="App.loadRFQList()" class="text-btn" title="รีเฟรช"><i class="fas fa-sync-alt"></i></button>
      </div>
    </div>
    <div class="adv-search-panel" id="advSearchPanel" style="margin-bottom:12px;border-radius:8px">
      <div class="form-row" style="display:flex;gap:6px;margin-bottom:6px">
        <input type="text" id="advJobId" placeholder="Job ID" class="form-input" style="padding:5px 8px;font-size:11px">
        <input type="text" id="advJobName" placeholder="Job Name" class="form-input" style="padding:5px 8px;font-size:11px">
      </div>
      <div class="form-row" style="display:flex;gap:6px;margin-bottom:6px">
        <input type="text" id="advCustomer" placeholder="Customer" class="form-input" style="padding:5px 8px;font-size:11px">
        <input type="text" id="advAE" placeholder="AE Name" class="form-input" style="padding:5px 8px;font-size:11px">
      </div>
      <div class="form-row" style="display:flex;gap:6px;margin-bottom:6px">
        <input type="date" id="advDateFrom" title="From date" class="form-input" style="padding:5px 8px;font-size:11px">
        <input type="date" id="advDateTo" title="To date" class="form-input" style="padding:5px 8px;font-size:11px">
        <select id="advStatus" class="form-input" style="padding:5px 8px;font-size:11px">
          <option value="">ทุกสถานะ</option>
          <option value="0">Draft</option>
          <option value="1">Pending</option>
          <option value="2">Rejected</option>
          <option value="3">Approved</option>
        </select>
      </div>
      <div style="display:flex;gap:6px;margin-top:6px">
        <button onclick="App.clearAdvSearch()" class="text-btn" style="font-size:11px"><i class="fas fa-times"></i> ล้าง</button>
        <button onclick="App.advSearch()" class="btn-primary" style="padding:5px 12px;border-radius:6px;font-size:11px;border:none;color:#fff;background:var(--primary);cursor:pointer"><i class="fas fa-search"></i> ค้นหา</button>
      </div>
    </div>
    <div style="overflow-x:auto">
      <table class="detail-table" style="width:100%">
        <thead>
          <tr>
            <th style="min-width:90px">Job ID</th>
            <th>Job Name</th>
            <th>Customer</th>
            <th style="min-width:70px">AE</th>
            <th style="min-width:60px;text-align:right">Qty</th>
            <th style="min-width:70px;text-align:right">Price</th>
            <th style="min-width:60px">Status</th>
            <th style="min-width:80px">Created</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">ไม่พบข้อมูล</td></tr>'}</tbody>
      </table>
    </div>
    <div style="margin-top:10px;font-size:11px;color:var(--text-muted)">แสดง ${data.length} รายการ</div>`;
}

function showRFQListView() {
  State._activeTab = 'rfqlist';
  showView('viewData');
  setTopBar('RFQ List', 'รายการ RFQ ทั้งหมด');
  updateNavActive('navRFQList');
  $('dataContent').innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด...</div>';
  loadRFQList();
}

function filterRFQ(q) {
  if (!q) return renderRFQListInView(State.rfqList);
  const ql = q.toLowerCase();
  renderRFQListInView(State.rfqList.filter(i =>
    i.job_id?.toLowerCase().includes(ql) ||
    i.job_name?.toLowerCase().includes(ql) ||
    i.customer?.toLowerCase().includes(ql)
  ));
}

// ============================================================
// AI BRAIN DASHBOARD — Visualization of what AI knows
// ============================================================
async function showAIBrain() {
  showView('viewData');
  setTopBar('Pornchai AI', 'Printing Industry 3.0 — Intelligence Platform');
  updateNavActive('navTools');
  // Cleanup previous brain if exists
  if (window._brainCleanup) window._brainCleanup();

  // Fetch real data from all sources
  let brain = {};
  let rStats = { documents: 0, chunks: 0 };
  try {
    const results = await Promise.allSettled([
      apiGet('/api/brain/stats'),
      apiGet('/api/rag/stats')
    ]);
    if (results[0].status === 'fulfilled') brain = results[0].value || {};
    if (results[1].status === 'fulfilled') rStats = results[1].value || rStats;
  } catch (e) { /* use defaults */ }

  const totalRecords = brain.total_records || 0;
  const bp = brain.paper || {};
  const bc = brain.coating || {};
  const bf = brain.foil || {};
  const bb = brain.box || {};
  const bm = brain.machine || {};
  const bpr = brain.process || {};

  // Build nodes from REAL data
  const nodes = [];
  const edges = [];

  // Central node = AI Brain
  nodes.push({ id: 'brain', label: 'Pornchai AI', x: 0, y: 0, z: 0, size: 30, color: '#a855f7', type: 'core', glow: true });

  // Category nodes — sized by real record count
  const categories = [
    { id: 'paper', label: '\u0E01\u0E23\u0E30\u0E14\u0E32\u0E29 (' + (bp.total||0) + ')', color: '#3b82f6', icon: '\uD83D\uDCC4', count: bp.total||0 },
    { id: 'box', label: '\u0E01\u0E25\u0E48\u0E2D\u0E07 (' + (bb.total||0) + ')', color: '#10b981', icon: '\uD83D\uDCE6', count: bb.total||0 },
    { id: 'machine', label: '\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E1E\u0E34\u0E21\u0E1E\u0E4C (' + (bm.total||0) + ')', color: '#f59e0b', icon: '\uD83C\uDFED', count: bm.total||0 },
    { id: 'process', label: 'Coating (' + (bc.total||0) + ')', color: '#0ea5e9', icon: '\uD83D\uDCA7', count: bc.total||0 },
    { id: 'foil', label: 'Foil Stamp (' + (bf.total||0) + ')', color: '#d97706', icon: '\u2B50', count: bf.total||0 },
    { id: 'afterpress', label: '\u0E01\u0E23\u0E30\u0E1A\u0E27\u0E19\u0E01\u0E32\u0E23 (' + (bpr.total||0) + ')', color: '#ef4444', icon: '\u2699\uFE0F', count: bpr.total||0 },
    { id: 'rag', label: 'RAG (' + (rStats.chunks||0) + ')', color: '#ec4899', icon: '\uD83E\uDDE0', count: rStats.chunks||0 },
    { id: 'data', label: 'Data (' + (totalRecords) + ')', color: '#06b6d4', icon: '\uD83D\uDCCA', count: totalRecords },
  ];

  categories.forEach(function(cat, i) {
    const angle = (i / categories.length) * Math.PI * 2 - Math.PI / 2;
    const radius = 220;
    const sz = Math.max(14, Math.min(22, 14 + Math.log2(cat.count + 1) * 1.5));
    nodes.push({
      id: cat.id, label: cat.label,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: (Math.random() - 0.5) * 80,
      size: sz, color: cat.color, type: 'category', icon: cat.icon
    });
    edges.push({ from: 'brain', to: cat.id, color: cat.color, width: 2 });
  });

  // === PAPER detail nodes — from real paper codes ===
  (bp.codes || []).slice(0, 12).forEach(function(item, i) {
    const name = item[0], count = item[1];
    const parent = nodes.find(function(n) { return n.id === 'paper'; });
    const angle = (i / 12) * Math.PI * 2;
    const r = 90 + Math.random() * 40;
    nodes.push({
      id: 'paper_' + i, label: name + ' (' + count + ')',
      x: parent.x + Math.cos(angle) * r,
      y: parent.y + Math.sin(angle) * r,
      z: (Math.random() - 0.5) * 120,
      size: 5 + Math.min(count / 20, 10), color: '#60a5fa', type: 'detail'
    });
    edges.push({ from: 'paper', to: 'paper_' + i, color: '#3b82f640', width: 1 });
  });

  // === BOX detail nodes — from real box templates ===
  (bb.templates || []).forEach(function(item, i) {
    const name = item[0] || ('Type ' + (i+1));
    const nameTh = item[1] || '';
    const parent = nodes.find(function(n) { return n.id === 'box'; });
    const angle = (i / Math.max(bb.templates.length, 1)) * Math.PI * 2;
    const r = 80 + Math.random() * 30;
    nodes.push({
      id: 'box_' + i, label: (i+1) + '. ' + (nameTh || name).substring(0, 18),
      x: parent.x + Math.cos(angle) * r,
      y: parent.y + Math.sin(angle) * r,
      z: (Math.random() - 0.5) * 100,
      size: 6, color: '#34d399', type: 'detail'
    });
    edges.push({ from: 'box', to: 'box_' + i, color: '#10b98140', width: 1 });
  });

  // === MACHINE detail nodes — from real machine types ===
  (bm.types || []).forEach(function(item, i) {
    const name = item[0], count = item[1];
    const parent = nodes.find(function(n) { return n.id === 'machine'; });
    const angle = (i / Math.max(bm.types.length, 1)) * Math.PI * 2;
    const r = 80 + Math.random() * 30;
    nodes.push({
      id: 'machine_' + i, label: name + ' (' + count + ')',
      x: parent.x + Math.cos(angle) * r,
      y: parent.y + Math.sin(angle) * r,
      z: (Math.random() - 0.5) * 100,
      size: 6 + Math.min(count / 10, 8), color: '#fbbf24', type: 'detail'
    });
    edges.push({ from: 'machine', to: 'machine_' + i, color: '#f59e0b40', width: 1 });
  });

  // === COATING detail nodes — from real coating types ===
  (bc.types || []).slice(0, 10).forEach(function(item, i) {
    const name = item[0], count = item[1];
    const parent = nodes.find(function(n) { return n.id === 'process'; });
    const angle = (i / 10) * Math.PI * 2;
    const r = 80 + Math.random() * 35;
    nodes.push({
      id: 'coat_' + i, label: name.substring(0, 20) + (count > 1 ? ' (' + count + ')' : ''),
      x: parent.x + Math.cos(angle) * r,
      y: parent.y + Math.sin(angle) * r,
      z: (Math.random() - 0.5) * 100,
      size: 5 + Math.min(count / 3, 8), color: '#38bdf8', type: 'detail'
    });
    edges.push({ from: 'process', to: 'coat_' + i, color: '#0ea5e940', width: 1 });
  });

  // === FOIL detail nodes — from real foil colors ===
  (bf.colors || []).slice(0, 10).forEach(function(item, i) {
    const name = item[0], count = item[1];
    const parent = nodes.find(function(n) { return n.id === 'foil'; });
    const angle = (i / 10) * Math.PI * 2;
    const r = 80 + Math.random() * 35;
    nodes.push({
      id: 'foil_' + i, label: name + ' (' + count + ')',
      x: parent.x + Math.cos(angle) * r,
      y: parent.y + Math.sin(angle) * r,
      z: (Math.random() - 0.5) * 100,
      size: 5 + Math.min(count * 2, 8), color: '#fbbf24', type: 'detail'
    });
    edges.push({ from: 'foil', to: 'foil_' + i, color: '#d9770640', width: 1 });
  });

  // === PROCESS detail nodes — from real process types ===
  (bpr.list || []).slice(0, 10).forEach(function(name, i) {
    if (!name) return;
    const parent = nodes.find(function(n) { return n.id === 'afterpress'; });
    const angle = (i / 10) * Math.PI * 2;
    const r = 80 + Math.random() * 30;
    nodes.push({
      id: 'proc_' + i, label: name,
      x: parent.x + Math.cos(angle) * r,
      y: parent.y + Math.sin(angle) * r,
      z: (Math.random() - 0.5) * 100,
      size: 7, color: '#f87171', type: 'detail'
    });
    edges.push({ from: 'afterpress', to: 'proc_' + i, color: '#ef444440', width: 1 });
  });

  // === RAG nodes — real stats ===
  var ragNode = nodes.find(function(n) { return n.id === 'rag'; });
  nodes.push({ id: 'rag_docs', label: (rStats.documents || 0) + ' Documents', x: ragNode.x + 80, y: ragNode.y - 40, z: 30, size: 10, color: '#f472b6', type: 'detail' });
  nodes.push({ id: 'rag_chunks', label: (rStats.chunks || 0) + ' Chunks', x: ragNode.x + 80, y: ragNode.y + 40, z: -30, size: 10, color: '#f472b6', type: 'detail' });
  edges.push({ from: 'rag', to: 'rag_docs', color: '#ec489940', width: 1 });
  edges.push({ from: 'rag', to: 'rag_chunks', color: '#ec489940', width: 1 });
  // RAG categories
  if (rStats.categories) {
    var ci = 0;
    for (var catKey in rStats.categories) {
      nodes.push({ id: 'rag_cat_' + ci, label: catKey + ' (' + rStats.categories[catKey] + ')',
        x: ragNode.x - 40 + ci * 60, y: ragNode.y + 80, z: 20, size: 7, color: '#f9a8d4', type: 'detail' });
      edges.push({ from: 'rag', to: 'rag_cat_' + ci, color: '#ec489930', width: 1 });
      ci++;
    }
  }

  // === DATA hub nodes — sub-databases ===
  var dataNode = nodes.find(function(n) { return n.id === 'data'; });
  var dataSubs = [
    { label: 'Price Tiers (' + (brain.price_tiers?.total||0) + ')', count: brain.price_tiers?.total||0 },
    { label: 'Waste Tiers (' + (brain.waste_tiers?.total||0) + ')', count: brain.waste_tiers?.total||0 },
    { label: 'Delivery (' + (brain.delivery?.total||0) + ')', count: brain.delivery?.total||0 },
    { label: 'Corrugated (' + (brain.corrugated?.total||0) + ')', count: brain.corrugated?.total||0 },
    { label: 'Exchange Rate (' + (brain.exchange_rate?.length||0) + ')', count: brain.exchange_rate?.length||0 },
    { label: 'Block Stamp (' + (brain.blockstamp?.total||0) + ')', count: brain.blockstamp?.total||0 },
  ];
  dataSubs.forEach(function(ds, i) {
    const angle = (i / dataSubs.length) * Math.PI * 2;
    nodes.push({
      id: 'data_' + i, label: ds.label,
      x: dataNode.x + Math.cos(angle) * 90,
      y: dataNode.y + Math.sin(angle) * 90,
      z: (Math.random() - 0.5) * 80,
      size: 5 + Math.min(Math.log2(ds.count + 1) * 2, 8), color: '#22d3ee', type: 'detail'
    });
    edges.push({ from: 'data', to: 'data_' + i, color: '#06b6d440', width: 1 });
  });

  // Cross-connections for visual richness
  edges.push({ from: 'paper', to: 'box', color: 'rgba(255,255,255,0.04)', width: 0.5 });
  edges.push({ from: 'box', to: 'machine', color: 'rgba(255,255,255,0.04)', width: 0.5 });
  edges.push({ from: 'machine', to: 'process', color: 'rgba(255,255,255,0.04)', width: 0.5 });
  edges.push({ from: 'process', to: 'foil', color: 'rgba(255,255,255,0.04)', width: 0.5 });
  edges.push({ from: 'foil', to: 'afterpress', color: 'rgba(255,255,255,0.04)', width: 0.5 });
  edges.push({ from: 'rag', to: 'paper', color: 'rgba(255,255,255,0.03)', width: 0.5 });
  edges.push({ from: 'data', to: 'machine', color: 'rgba(255,255,255,0.03)', width: 0.5 });

  // ============ HOLOGRAPHIC BLUEPRINT — uses brain-render.js ============
  var brainInstance = initBrainRender($('dataContent'), nodes, edges, {
    totalRecords: totalRecords, bp: bp, bc: bc, bf: bf, bb: bb, bm: bm, bpr: bpr, rStats: rStats, brain: brain
  });
  window._brainCleanup = function() { if (brainInstance) brainInstance.cleanup(); window._brainCleanup = null; };
}
/* ===== OLD BRAIN RENDERING — replaced by brain-render.js ===== */
function _brainLegacyDEAD() {
  var cmykBar = '';

  $('dataContent').innerHTML = '<div style="position:relative;background:#080c14;width:100%;height:calc(100vh - 60px);overflow:hidden">' +
    cmykBar +
    '<canvas id="brainCanvas" style="width:100%;height:100%;cursor:grab"></canvas>' +
    // Top-left HUD panel
    '<div style="position:absolute;top:24px;left:24px;pointer-events:none;z-index:4">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">' +
        '<div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#00bcd4,#e91e90);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 20px rgba(0,188,212,0.3)">\uD83C\uDFA8</div>' +
        '<div>' +
          '<div style="font-size:20px;font-weight:800;letter-spacing:1px;background:linear-gradient(135deg,#00bcd4,#e91e90,#ffc107);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">PORNCHAI AI BRAIN</div>' +
          '<div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:3px;text-transform:uppercase;margin-top:1px">Printing Industry 3.0 \u2014 Knowledge Intelligence</div>' +
        '</div>' +
      '</div>' +
      // Stats ribbon
      '<div style="display:flex;gap:16px;margin-top:12px">' +
        '<div style="background:rgba(0,188,212,0.1);border:1px solid rgba(0,188,212,0.25);border-radius:8px;padding:6px 14px;backdrop-filter:blur(8px)">' +
          '<div style="font-size:9px;color:#00bcd4;text-transform:uppercase;letter-spacing:1px;font-weight:700">Master Data</div>' +
          '<div style="font-size:18px;font-weight:800;color:#fff;margin-top:2px">' + totalRecords.toLocaleString() + '</div></div>' +
        '<div style="background:rgba(233,30,144,0.1);border:1px solid rgba(233,30,144,0.25);border-radius:8px;padding:6px 14px;backdrop-filter:blur(8px)">' +
          '<div style="font-size:9px;color:#e91e90;text-transform:uppercase;letter-spacing:1px;font-weight:700">Papers</div>' +
          '<div style="font-size:18px;font-weight:800;color:#fff;margin-top:2px">' + (bp.total||0) + '</div></div>' +
        '<div style="background:rgba(255,193,7,0.1);border:1px solid rgba(255,193,7,0.25);border-radius:8px;padding:6px 14px;backdrop-filter:blur(8px)">' +
          '<div style="font-size:9px;color:#ffc107;text-transform:uppercase;letter-spacing:1px;font-weight:700">RAG Chunks</div>' +
          '<div style="font-size:18px;font-weight:800;color:#fff;margin-top:2px">' + (rStats.chunks||0).toLocaleString() + '</div></div>' +
      '</div>' +
      '<div style="font-size:10px;color:rgba(255,255,255,0.25);margin-top:10px">\u0E25\u0E32\u0E01\u0E40\u0E21\u0E32\u0E2A\u0E4C\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2B\u0E21\u0E38\u0E19 \u00B7 Scroll \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E0B\u0E39\u0E21 \u00B7 \u0E04\u0E25\u0E34\u0E01\u0E42\u0E2B\u0E19\u0E14\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14</div>' +
    '</div>' +
    '<div id="brainTooltip" style="position:absolute;display:none;background:rgba(8,12,20,0.95);color:#fff;padding:10px 18px;border-radius:10px;font-size:13px;pointer-events:none;border:1px solid rgba(0,188,212,0.4);backdrop-filter:blur(16px);box-shadow:0 8px 32px rgba(0,0,0,0.4)"></div>' +
    '<button onclick="App.showToolsTab()" style="position:absolute;top:24px;right:24px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.12);padding:10px 20px;border-radius:10px;cursor:pointer;font-size:13px;backdrop-filter:blur(8px);font-weight:600;transition:all 0.3s;z-index:5" onmouseover="this.style.background=\'rgba(0,188,212,0.15)\';this.style.borderColor=\'rgba(0,188,212,0.4)\';this.style.color=\'#00bcd4\'" onmouseout="this.style.background=\'rgba(255,255,255,0.06)\';this.style.borderColor=\'rgba(255,255,255,0.12)\';this.style.color=\'rgba(255,255,255,0.7)\'">\u2190 \u0E01\u0E25\u0E31\u0E1A Tools</button>' +
    '<div style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.15);font-size:10px;pointer-events:none;letter-spacing:3px;text-transform:uppercase">Pornchai AI Brain v3.0 \u2014 Printing Industry Intelligence Platform</div>' +
  '</div>';

  // === Canvas 3D rendering ===
  var canvas = document.getElementById('brainCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W, H, dpr = window.devicePixelRatio || 1;
  var rotX = -0.3, rotY = 0, zoom = 1, dragging = false, lastMX = 0, lastMY = 0;
  var hoveredNode = null;
  var autoRotate = false;
  var selectedNodeId = null;
  var animFrame = 0;
  var time = 0;

  // Pre-generate star field
  var stars = [];
  for (var si = 0; si < 150; si++) {
    stars.push({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random() * 1.5, b: 0.15 + Math.random() * 0.4, phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() * 3 });
  }

  // === ANIMATION ENHANCEMENTS ===

  // Flowing edge particles (multiple per main edge)
  var particles = [];
  for (var ei = 0; ei < edges.length; ei++) {
    if (edges[ei].width >= 2) {
      for (var pi = 0; pi < 4; pi++) {
        particles.push({ edgeIdx: ei, t: Math.random(), speed: 0.15 + Math.random() * 0.35, size: 1 + Math.random() * 2, brightness: 0.5 + Math.random() * 0.5 });
      }
    }
  }

  // Shooting stars
  var shootingStars = [];
  var lastShootTime = 0;
  function spawnShootingStar() {
    var startX = Math.random() * 0.6 + 0.2;
    var angle = Math.PI * 0.15 + Math.random() * Math.PI * 0.3;
    shootingStars.push({
      x: startX, y: -0.05,
      vx: Math.cos(angle) * (0.3 + Math.random() * 0.4),
      vy: Math.sin(angle) * (0.3 + Math.random() * 0.4),
      life: 1.0, decay: 0.6 + Math.random() * 0.8,
      len: 40 + Math.random() * 60,
      bright: 0.6 + Math.random() * 0.4
    });
  }

  // Nebula clouds
  var nebulae = [
    { x: 0.2, y: 0.3, r: 250, color: [100, 40, 180], vx: 0.008, vy: 0.005, phase: 0 },
    { x: 0.75, y: 0.6, r: 300, color: [30, 80, 200], vx: -0.006, vy: 0.007, phase: 2 },
    { x: 0.5, y: 0.2, r: 200, color: [20, 160, 180], vx: 0.005, vy: -0.004, phase: 4 },
    { x: 0.3, y: 0.75, r: 280, color: [80, 20, 160], vx: -0.007, vy: -0.006, phase: 1.5 }
  ];

  // Pulse waves from center (JARVIS style)
  var pulseWaves = [];
  var lastPulseTime = 0;

  // CMYK-themed HUD rings
  var hudRings = [
    { r: 1.6, speed: 0.4, dashCount: 36, dashLen: 0.06, width: 1.2, color: [0,188,212], alpha: 0.4 },     // Cyan
    { r: 2.0, speed: -0.25, dashCount: 24, dashLen: 0.08, width: 1.5, color: [233,30,144], alpha: 0.3 },   // Magenta
    { r: 2.5, speed: 0.15, dashCount: 48, dashLen: 0.04, width: 0.8, color: [255,193,7], alpha: 0.2 },     // Yellow
    { r: 3.0, speed: -0.35, dashCount: 16, dashLen: 0.12, width: 2, color: [0,188,212], alpha: 0.18 },     // Cyan
    { r: 3.6, speed: 0.2, dashCount: 60, dashLen: 0.03, width: 0.6, color: [233,30,144], alpha: 0.12 },    // Magenta
    { r: 4.2, speed: -0.12, dashCount: 8, dashLen: 0.2, width: 2.5, color: [0,150,136], alpha: 0.1 },      // Teal
  ];
  // CMYK Energy arcs
  var energyArcs = [
    { r: 2.3, speed: 0.6, start: 0, sweep: 0.5, width: 3, color: [0,188,212] },           // Cyan
    { r: 2.8, speed: -0.45, start: Math.PI, sweep: 0.7, width: 2, color: [233,30,144] },   // Magenta
    { r: 3.4, speed: 0.3, start: Math.PI*0.5, sweep: 0.4, width: 2.5, color: [255,193,7] },// Yellow
    { r: 1.8, speed: -0.8, start: Math.PI*1.5, sweep: 0.3, width: 1.5, color: [0,150,136] }, // Teal
  ];
  // Data scanline ring
  var scanAngle = 0;

  // Entry animation
  var entryProgress = 0;
  var entryDuration = 2.0; // seconds
  var entryStartPositions = [];
  for (var ni = 0; ni < nodes.length; ni++) {
    entryStartPositions.push({
      x: (Math.random() - 0.5) * 1500,
      y: (Math.random() - 0.5) * 1500,
      z: (Math.random() - 0.5) * 800
    });
  }

  // Node breathing phases
  for (var ni = 0; ni < nodes.length; ni++) {
    nodes[ni]._breathPhase = Math.random() * Math.PI * 2;
    nodes[ni]._breathSpeed = 0.8 + Math.random() * 1.2;
    nodes[ni]._orbitAngle = Math.random() * Math.PI * 2;
    nodes[ni]._orbitSpeed = 0.1 + Math.random() * 0.3;
    nodes[ni]._orbitRadius = 3 + Math.random() * 8;
    // Store original positions for orbit
    nodes[ni]._baseX = nodes[ni].x;
    nodes[ni]._baseY = nodes[ni].y;
    nodes[ni]._baseZ = nodes[ni].z;
  }

  function resize() {
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  var _brainResizeHandler = function() { resize(); };
  window.addEventListener('resize', _brainResizeHandler);

  // Project 3D to 2D
  function project(node) {
    var cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    var cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    var x = node.x, y = node.y, z = node.z || 0;
    // Rotate Y axis
    var x1 = x * cosY - z * sinY;
    var z1 = x * sinY + z * cosY;
    // Rotate X axis
    var y1 = y * cosX - z1 * sinX;
    var z2 = y * sinX + z1 * cosX;
    // Perspective projection
    var fov = 600;
    var scale = fov / (fov + z2) * zoom;
    return {
      sx: (W / 2) + x1 * scale,
      sy: (H / 2) + y1 * scale,
      scale: scale,
      z: z2
    };
  }

  function draw() {
    time += 0.016;
    ctx.clearRect(0, 0, W, H);

    // Entry animation progress
    if (entryProgress < 1) {
      entryProgress = Math.min(1, entryProgress + 0.016 / entryDuration);
    }
    // Ease function (ease-out cubic)
    var ease = 1 - Math.pow(1 - entryProgress, 3);

    // Update node positions with orbit (detail nodes orbit parent)
    for (var ni = 0; ni < nodes.length; ni++) {
      var nd = nodes[ni];
      if (nd.type === 'detail') {
        nd._orbitAngle += nd._orbitSpeed * 0.016;
        nd.x = nd._baseX + Math.cos(nd._orbitAngle) * nd._orbitRadius;
        nd.y = nd._baseY + Math.sin(nd._orbitAngle) * nd._orbitRadius;
        nd.z = nd._baseZ + Math.sin(nd._orbitAngle * 0.7) * nd._orbitRadius * 0.5;
      }
      // Apply entry animation: lerp from random start to final position
      if (entryProgress < 1) {
        var ep = entryStartPositions[ni];
        nd._renderX = ep.x + (nd.x - ep.x) * ease;
        nd._renderY = ep.y + (nd.y - ep.y) * ease;
        nd._renderZ = ep.z + (nd.z - ep.z) * ease;
      } else {
        nd._renderX = nd.x;
        nd._renderY = nd.y;
        nd._renderZ = nd.z;
      }
    }

    // Background — deep printing industry dark
    var bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.8);
    bgGrad.addColorStop(0, '#0d1520');
    bgGrad.addColorStop(0.4, '#080c14');
    bgGrad.addColorStop(1, '#040608');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // === CMYK Ink Clouds ===
    var cmykClouds = [
      { x: 0.15, y: 0.25, r: 280, c: [0,188,212] },   // Cyan
      { x: 0.8, y: 0.3, r: 250, c: [233,30,144] },     // Magenta
      { x: 0.5, y: 0.8, r: 260, c: [255,193,7] },      // Yellow
      { x: 0.3, y: 0.65, r: 200, c: [0,150,136] },     // Teal
    ];
    for (var ci2 = 0; ci2 < cmykClouds.length; ci2++) {
      var ck = cmykClouds[ci2];
      var ckAlpha = 0.025 + Math.sin(time * 0.2 + ci2 * 1.5) * 0.01;
      var ckR = ck.r + Math.sin(time * 0.3 + ci2) * 40;
      var ckX = ck.x * W + Math.sin(time * 0.08 + ci2) * 30;
      var ckY = ck.y * H + Math.cos(time * 0.06 + ci2) * 20;
      var ckGrad = ctx.createRadialGradient(ckX, ckY, 0, ckX, ckY, ckR);
      ckGrad.addColorStop(0, 'rgba(' + ck.c.join(',') + ',' + ckAlpha + ')');
      ckGrad.addColorStop(0.6, 'rgba(' + ck.c.join(',') + ',' + (ckAlpha * 0.3) + ')');
      ckGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = ckGrad;
      ctx.beginPath();
      ctx.arc(ckX, ckY, ckR, 0, Math.PI * 2);
      ctx.fill();
    }

    // === Halftone dot grid (printing pattern) ===
    var dotSpacing = 60;
    var dotPhase = time * 0.3;
    ctx.fillStyle = 'rgba(255,255,255,0.015)';
    for (var dx = 0; dx < W + dotSpacing; dx += dotSpacing) {
      for (var dy = 0; dy < H + dotSpacing; dy += dotSpacing) {
        var offsetX = (Math.floor(dy / dotSpacing) % 2) * dotSpacing * 0.5;
        var dotDist = Math.sqrt(Math.pow(dx + offsetX - W/2, 2) + Math.pow(dy - H/2, 2));
        var dotAlpha = Math.max(0, 0.02 - dotDist / (W * 0.8) * 0.02);
        if (dotAlpha > 0.001) {
          ctx.globalAlpha = dotAlpha + Math.sin(dotPhase + dx * 0.01 + dy * 0.01) * 0.005;
          ctx.beginPath();
          ctx.arc(dx + offsetX, dy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;

    // Stars (subtle)
    for (var si = 0; si < stars.length; si++) {
      var star = stars[si];
      var twinkle = star.b * 0.5 + Math.sin(time * star.speed + star.phase) * 0.15;
      ctx.fillStyle = 'rgba(255,255,255,' + Math.max(0.01, twinkle) + ')';
      ctx.beginPath();
      ctx.arc(star.x * W, star.y * H, star.s * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // === JARVIS PULSE WAVES from center ===
    if (time - lastPulseTime > 1.5) {
      pulseWaves.push({ t: 0, maxR: 400 + Math.random() * 150, style: Math.random() > 0.5 ? 'hex' : 'circle' });
      lastPulseTime = time;
    }
    var brainProj = projectRender(nodes[0]);
    var bx = brainProj.sx, by = brainProj.sy, bScale = brainProj.scale;
    for (var pwi = pulseWaves.length - 1; pwi >= 0; pwi--) {
      var pw = pulseWaves[pwi];
      pw.t += 0.01;
      if (pw.t >= 1) { pulseWaves.splice(pwi, 1); continue; }
      var pwR = pw.t * pw.maxR * zoom;
      var pwAlpha = (1 - pw.t) * 0.18;
      // Primary wave
      // CMYK colored waves
      var pwColors = [[0,188,212],[233,30,144],[255,193,7]];
      var pwc = pwColors[pwi % 3];
      ctx.strokeStyle = 'rgba(' + pwc.join(',') + ',' + pwAlpha + ')';
      ctx.lineWidth = 2.5 * (1 - pw.t);
      ctx.beginPath();
      ctx.arc(bx, by, pwR, 0, Math.PI * 2);
      ctx.stroke();
      // Fill glow wave
      var wGrad = ctx.createRadialGradient(bx, by, pwR * 0.95, bx, by, pwR * 1.05);
      wGrad.addColorStop(0, 'rgba(' + pwc.join(',') + ',0)');
      wGrad.addColorStop(0.5, 'rgba(' + pwc.join(',') + ',' + (pwAlpha * 0.3) + ')');
      wGrad.addColorStop(1, 'rgba(' + pwc.join(',') + ',0)');
      ctx.fillStyle = wGrad;
      ctx.beginPath();
      ctx.arc(bx, by, pwR * 1.05, 0, Math.PI * 2);
      ctx.arc(bx, by, pwR * 0.95, 0, Math.PI * 2);
      ctx.fill('evenodd');
      // Second wave
      if (pw.t > 0.12) {
        var pw2R = (pw.t - 0.12) * pw.maxR * zoom;
        var pwc2 = pwColors[(pwi + 1) % 3];
        ctx.strokeStyle = 'rgba(' + pwc2.join(',') + ',' + (pwAlpha * 0.4) + ')';
        ctx.lineWidth = 1.5 * (1 - pw.t);
        ctx.beginPath();
        ctx.arc(bx, by, pw2R, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Third wave dashed
      if (pw.t > 0.25) {
        var pw3R = (pw.t - 0.25) * pw.maxR * zoom;
        ctx.strokeStyle = 'rgba(255,255,255,' + (pwAlpha * 0.15) + ')';
        ctx.lineWidth = 1 * (1 - pw.t);
        ctx.setLineDash([3, 10]);
        ctx.beginPath();
        ctx.arc(bx, by, pw3R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // === JARVIS HUD RINGS around core ===
    var coreBaseR = nodes[0].size * bScale;
    scanAngle += 0.02;
    for (var hri = 0; hri < hudRings.length; hri++) {
      var hr = hudRings[hri];
      var hrR = coreBaseR * hr.r;
      var hrAngle = time * hr.speed;
      var segAngle = (Math.PI * 2) / hr.dashCount;
      var dashArc = segAngle * hr.dashLen / 0.08;
      ctx.lineWidth = hr.width * bScale;
      // Breathing alpha
      var hrAlpha = hr.alpha + Math.sin(time * 1.5 + hri) * 0.08;
      ctx.strokeStyle = 'rgba(' + hr.color.join(',') + ',' + hrAlpha + ')';
      for (var di = 0; di < hr.dashCount; di++) {
        var a1 = hrAngle + di * segAngle;
        var a2 = a1 + dashArc;
        ctx.beginPath();
        ctx.arc(bx, by, hrR, a1, a2);
        ctx.stroke();
      }
    }

    // === ENERGY ARCS (large sweeping glowing arcs) ===
    for (var eai = 0; eai < energyArcs.length; eai++) {
      var ea = energyArcs[eai];
      var eaR = coreBaseR * ea.r;
      var eaStart = ea.start + time * ea.speed;
      var eaSweep = ea.sweep + Math.sin(time * 0.8 + eai) * 0.15;
      var eaAlpha = 0.35 + Math.sin(time * 2 + eai * 1.5) * 0.15;
      // Glow layer
      ctx.strokeStyle = 'rgba(' + ea.color.join(',') + ',' + (eaAlpha * 0.3) + ')';
      ctx.lineWidth = (ea.width + 4) * bScale;
      ctx.beginPath();
      ctx.arc(bx, by, eaR, eaStart, eaStart + eaSweep);
      ctx.stroke();
      // Core arc
      ctx.strokeStyle = 'rgba(' + ea.color.join(',') + ',' + eaAlpha + ')';
      ctx.lineWidth = ea.width * bScale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(bx, by, eaR, eaStart, eaStart + eaSweep);
      ctx.stroke();
      ctx.lineCap = 'butt';
      // End-point sparks
      var sparkX = bx + Math.cos(eaStart + eaSweep) * eaR;
      var sparkY = by + Math.sin(eaStart + eaSweep) * eaR;
      var spGrad = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, 6 * bScale);
      spGrad.addColorStop(0, 'rgba(255,255,255,' + (eaAlpha * 0.8) + ')');
      spGrad.addColorStop(1, 'rgba(' + ea.color.join(',') + ',0)');
      ctx.fillStyle = spGrad;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, 6 * bScale, 0, Math.PI * 2);
      ctx.fill();
    }

    // === SCAN LINE (printing press sweep — Cyan) ===
    var scanR = coreBaseR * 4.5;
    var scanGrad = ctx.createConicGradient(scanAngle, bx, by);
    scanGrad.addColorStop(0, 'rgba(0,188,212,0.1)');
    scanGrad.addColorStop(0.06, 'rgba(0,188,212,0)');
    scanGrad.addColorStop(0.5, 'rgba(233,30,144,0)');
    scanGrad.addColorStop(0.5, 'rgba(233,30,144,0.04)');
    scanGrad.addColorStop(0.56, 'rgba(233,30,144,0)');
    scanGrad.addColorStop(1, 'rgba(0,188,212,0)');
    ctx.fillStyle = scanGrad;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.arc(bx, by, scanR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    // Scan leading edge
    ctx.strokeStyle = 'rgba(0,188,212,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(scanAngle) * scanR, by + Math.sin(scanAngle) * scanR);
    ctx.stroke();

    // Edge fade-in after entry animation
    var edgeAlpha = entryProgress < 0.6 ? 0 : Math.min(1, (entryProgress - 0.6) / 0.4);

    // Draw edges with glow
    ctx.globalAlpha = edgeAlpha;
    for (var ei = 0; ei < edges.length; ei++) {
      var e = edges[ei];
      var fromNode = null, toNode = null;
      for (var ni = 0; ni < nodes.length; ni++) {
        if (nodes[ni].id === e.from) fromNode = nodes[ni];
        if (nodes[ni].id === e.to) toNode = nodes[ni];
      }
      if (!fromNode || !toNode) continue;
      var p1 = projectRender(fromNode);
      var p2 = projectRender(toNode);
      var avgScale = (p1.scale + p2.scale) / 2;
      var lw = (e.width || 1) * avgScale;

      // Animated energy beam on main edges
      if (e.width >= 2) {
        var pulse = 0.4 + Math.sin(time * 1.5 + ei * 0.5) * 0.2;
        // Outer glow beam
        ctx.strokeStyle = e.color || 'rgba(168,85,247,0.3)';
        ctx.lineWidth = lw * 4;
        ctx.globalAlpha = pulse * 0.15 * edgeAlpha;
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
        // Mid beam
        ctx.lineWidth = lw * 2;
        ctx.globalAlpha = pulse * 0.35 * edgeAlpha;
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
        ctx.globalAlpha = edgeAlpha;
      }

      ctx.strokeStyle = e.color || 'rgba(168,85,247,0.2)';
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(p1.sx, p1.sy);
      ctx.lineTo(p2.sx, p2.sy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // === FLOWING PARTICLES along edges ===
    if (edgeAlpha > 0) {
      for (var fpi = 0; fpi < particles.length; fpi++) {
        var fp = particles[fpi];
        fp.t = (fp.t + fp.speed * 0.016) % 1;
        var fe = edges[fp.edgeIdx];
        var fpFrom = null, fpTo = null;
        for (var ni = 0; ni < nodes.length; ni++) {
          if (nodes[ni].id === fe.from) fpFrom = nodes[ni];
          if (nodes[ni].id === fe.to) fpTo = nodes[ni];
        }
        if (!fpFrom || !fpTo) continue;
        var fp1 = projectRender(fpFrom);
        var fp2 = projectRender(fpTo);
        var fpx = fp1.sx + (fp2.sx - fp1.sx) * fp.t;
        var fpy = fp1.sy + (fp2.sy - fp1.sy) * fp.t;
        var fpAvgScale = (fp1.scale + fp2.scale) / 2;
        // Particle glow
        var fpGlow = ctx.createRadialGradient(fpx, fpy, 0, fpx, fpy, fp.size * fpAvgScale * 4);
        fpGlow.addColorStop(0, (fe.color || '#a855f7') + Math.round(fp.brightness * edgeAlpha * 200).toString(16).padStart(2, '0'));
        fpGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = fpGlow;
        ctx.beginPath();
        ctx.arc(fpx, fpy, fp.size * fpAvgScale * 4, 0, Math.PI * 2);
        ctx.fill();
        // Particle core
        ctx.fillStyle = 'rgba(255,255,255,' + (fp.brightness * edgeAlpha * 0.9) + ')';
        ctx.beginPath();
        ctx.arc(fpx, fpy, fp.size * fpAvgScale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Sort nodes by Z for depth ordering (far first)
    var projected = [];
    for (var ni = 0; ni < nodes.length; ni++) {
      var proj = projectRender(nodes[ni]);
      projected.push({ node: nodes[ni], proj: proj });
    }
    projected.sort(function(a, b) { return b.proj.z - a.proj.z; });

    // Draw nodes
    for (var pi = 0; pi < projected.length; pi++) {
      var item = projected[pi];
      var n = item.node;
      var p = item.proj;

      // Breathing: sinusoidal size oscillation per node
      var breathFactor = 1 + Math.sin(time * n._breathSpeed + n._breathPhase) * (n.type === 'core' ? 0.12 : 0.05);
      var r = n.size * p.scale * breathFactor;
      var alpha = Math.max(0.25, Math.min(1, (600 + p.z) / 800));
      var isHovered = (hoveredNode === n.id);

      // Outer glow for core and category nodes
      if (n.type === 'core' || n.type === 'category' || isHovered) {
        var glowSize = n.type === 'core' ? r * 5 : r * 3.5;
        if (isHovered) glowSize *= 1.3;
        var glowPulse = 1 + Math.sin(time * 2 + n._breathPhase) * 0.18;
        var grad = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, glowSize * glowPulse);
        grad.addColorStop(0, n.color + '50');
        grad.addColorStop(0.4, n.color + '20');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, glowSize * glowPulse, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node body
      ctx.globalAlpha = alpha;

      // Core node — Printing Industry 3.0 Reactor
      if (n.type === 'core') {
        var cx = p.sx, cy = p.sy, coreR = r;

        // === Layer 1: Deep CMYK energy field ===
        var deepGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 5);
        deepGlow.addColorStop(0, 'rgba(0,188,212,0.12)');
        deepGlow.addColorStop(0.2, 'rgba(233,30,144,0.06)');
        deepGlow.addColorStop(0.4, 'rgba(255,193,7,0.03)');
        deepGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = deepGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR * 5, 0, Math.PI * 2);
        ctx.fill();

        // === Layer 2: CMYK color wheel shell ===
        // 4 CMYK quadrant glows
        var cmykQ = [[0,188,212],[233,30,144],[255,193,7],[0,150,136]];
        for (var qi = 0; qi < 4; qi++) {
          var qa = time * 0.2 + (qi / 4) * Math.PI * 2;
          var qx = cx + Math.cos(qa) * coreR * 0.2;
          var qy = cy + Math.sin(qa) * coreR * 0.2;
          var qGrad = ctx.createRadialGradient(qx, qy, 0, cx, cy, coreR * 1.1);
          qGrad.addColorStop(0, 'rgba(' + cmykQ[qi].join(',') + ',0.25)');
          qGrad.addColorStop(0.5, 'rgba(' + cmykQ[qi].join(',') + ',0.08)');
          qGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = qGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, coreR * 1.1, 0, Math.PI * 2);
          ctx.fill();
        }

        // Core orb
        var innerPulse = 0.8 + Math.sin(time * 3) * 0.2;
        var innerGrad = ctx.createRadialGradient(cx, cy - coreR * 0.1, coreR * 0.05, cx, cy, coreR * 0.85);
        innerGrad.addColorStop(0, 'rgba(255,255,255,' + (0.9 * innerPulse) + ')');
        innerGrad.addColorStop(0.15, 'rgba(0,230,255,' + (0.7 * innerPulse) + ')');
        innerGrad.addColorStop(0.4, 'rgba(0,150,180,' + (0.4 * innerPulse) + ')');
        innerGrad.addColorStop(0.7, 'rgba(233,30,144,0.15)');
        innerGrad.addColorStop(1, 'rgba(0,80,100,0.1)');
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Central bright point
        var eyePulse = 0.7 + Math.sin(time * 4) * 0.3;
        var eyeGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 0.3);
        eyeGrad.addColorStop(0, 'rgba(255,255,255,' + eyePulse + ')');
        eyeGrad.addColorStop(0.4, 'rgba(0,230,255,' + (eyePulse * 0.6) + ')');
        eyeGrad.addColorStop(1, 'rgba(0,188,212,0)');
        ctx.fillStyle = eyeGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // === Layer 3: CMYK Petals (4 ink colors) ===
        var petalCount = 4;
        var petalRotate = time * 0.25;
        for (var pi2 = 0; pi2 < petalCount; pi2++) {
          var pa = petalRotate + (pi2 / petalCount) * Math.PI * 2;
          var petalAlpha = 0.2 + Math.sin(time * 2 + pi2 * 1.5) * 0.1;
          ctx.fillStyle = 'rgba(' + cmykQ[pi2].join(',') + ',' + petalAlpha + ')';
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(pa) * coreR * 0.35, cy + Math.sin(pa) * coreR * 0.35);
          ctx.lineTo(cx + Math.cos(pa - 0.2) * coreR * 1.05, cy + Math.sin(pa - 0.2) * coreR * 1.05);
          ctx.lineTo(cx + Math.cos(pa + 0.2) * coreR * 1.05, cy + Math.sin(pa + 0.2) * coreR * 1.05);
          ctx.closePath();
          ctx.fill();
        }

        // === Layer 4: Registration marks (printing crosshair) ===
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1 * p.scale;
        // Crosshair
        var chLen = coreR * 1.3;
        ctx.beginPath(); ctx.moveTo(cx - chLen, cy); ctx.lineTo(cx + chLen, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - chLen); ctx.lineTo(cx, cy + chLen); ctx.stroke();
        // Circle registration mark
        ctx.strokeStyle = 'rgba(0,188,212,0.3)';
        ctx.lineWidth = 1.5 * p.scale;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR * 0.9, 0, Math.PI * 2);
        ctx.stroke();

        // Tick marks
        for (var ti = 0; ti < 36; ti++) {
          var ta = (ti / 36) * Math.PI * 2;
          var tLen = ti % 9 === 0 ? 0.18 : (ti % 3 === 0 ? 0.1 : 0.04);
          var tColor = ti % 9 === 0 ? cmykQ[Math.floor(ti/9) % 4] : [255,255,255];
          var tAlpha = ti % 9 === 0 ? 0.6 : (ti % 3 === 0 ? 0.2 : 0.08);
          ctx.strokeStyle = 'rgba(' + tColor.join(',') + ',' + tAlpha + ')';
          ctx.lineWidth = (ti % 9 === 0 ? 2 : 0.8) * p.scale;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ta) * coreR * (0.9 - tLen), cy + Math.sin(ta) * coreR * (0.9 - tLen));
          ctx.lineTo(cx + Math.cos(ta) * coreR * 0.9, cy + Math.sin(ta) * coreR * 0.9);
          ctx.stroke();
        }

        // === Layer 5: Orbiting CMYK ink dots ===
        for (var odi = 0; odi < 4; odi++) {
          var odAngle = time * (0.6 + odi * 0.25) + odi * Math.PI * 0.5;
          var odR = coreR * (1.8 + odi * 0.6);
          var odX = cx + Math.cos(odAngle) * odR;
          var odY = cy + Math.sin(odAngle) * odR;
          var odAlpha = 0.6 + Math.sin(time * 2.5 + odi) * 0.3;
          var odColor = cmykQ[odi];
          // Trail
          for (var trl = 1; trl <= 8; trl++) {
            var trAngle = odAngle - trl * 0.04;
            var trX = cx + Math.cos(trAngle) * odR;
            var trY = cy + Math.sin(trAngle) * odR;
            ctx.fillStyle = 'rgba(' + odColor.join(',') + ',' + (odAlpha * (1 - trl / 9) * 0.25) + ')';
            ctx.beginPath();
            ctx.arc(trX, trY, (3.5 - trl * 0.35) * bScale, 0, Math.PI * 2);
            ctx.fill();
          }
          // Dot
          var dotGrad = ctx.createRadialGradient(odX, odY, 0, odX, odY, 5 * bScale);
          dotGrad.addColorStop(0, 'rgba(255,255,255,' + odAlpha + ')');
          dotGrad.addColorStop(0.4, 'rgba(' + odColor.join(',') + ',' + (odAlpha * 0.6) + ')');
          dotGrad.addColorStop(1, 'rgba(' + odColor.join(',') + ',0)');
          ctx.fillStyle = dotGrad;
          ctx.beginPath();
          ctx.arc(odX, odY, 5 * bScale, 0, Math.PI * 2);
          ctx.fill();
        }

      } else {
        // Regular node with gradient
        var nodeGrad = ctx.createRadialGradient(p.sx - r * 0.25, p.sy - r * 0.25, 0, p.sx, p.sy, r);
        nodeGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
        nodeGrad.addColorStop(0.3, n.color);
        nodeGrad.addColorStop(1, n.color + 'cc');
        ctx.fillStyle = nodeGrad;
        var drawR = isHovered ? r * 1.3 : r;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, drawR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Specular highlight
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(p.sx - r * 0.25, p.sy - r * 0.3, r * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;

      // Labels for core and category nodes (Printing Industry 3.0)
      if (n.type === 'core') {
        var coreFontSize = Math.max(16, 22 * p.scale);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var labelY = p.sy + r * 1.3 + 28 * p.scale;
        // Title with CMYK gradient glow
        ctx.font = '800 ' + coreFontSize + 'px "Segoe UI", sans-serif';
        ctx.shadowColor = 'rgba(0,188,212,0.8)';
        ctx.shadowBlur = 25 + Math.sin(time * 2) * 8;
        ctx.fillStyle = '#fff';
        ctx.fillText(n.label, p.sx, labelY);
        ctx.shadowBlur = 0;
        // Subtitle
        var subSize = Math.max(9, 10 * p.scale);
        ctx.font = '700 ' + subSize + 'px "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(0,188,212,0.5)';
        ctx.fillText('P R I N T I N G   I N D U S T R Y   3 . 0', p.sx, labelY + coreFontSize * 0.85);
        // Status dots — CMYK
        var stY = labelY + coreFontSize * 0.85 + subSize + 4;
        var stColors = ['#00bcd4','#e91e90','#ffc107','#009688'];
        var stLabels = ['C','M','Y','K'];
        for (var sti = 0; sti < 4; sti++) {
          var stX = p.sx + (sti - 1.5) * 18 * p.scale;
          var stPulse = 0.5 + Math.sin(time * 3 + sti * 0.8) * 0.4;
          ctx.fillStyle = stColors[sti];
          ctx.globalAlpha = stPulse;
          ctx.beginPath();
          ctx.arc(stX, stY, 3 * p.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      } else if (n.type === 'category') {
        var fontSize = Math.max(10, 13 * p.scale);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.85 * alpha) + ')';
        ctx.font = 'bold ' + fontSize + 'px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 8 + Math.sin(time * 1.5 + n._breathPhase) * 4;
        ctx.fillText((n.icon || '') + ' ' + n.label, p.sx, p.sy + r + 15 * p.scale);
        ctx.shadowBlur = 0;
      }

      // Detail node label on hover
      if (isHovered && n.type === 'detail') {
        var hFontSize = Math.max(11, 12 * p.scale);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + hFontSize + 'px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = n.color || 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText(n.label, p.sx, p.sy - r * 1.5 - 8);
        ctx.shadowBlur = 0;
      }
    }

    // Selected node highlight ring
    if (selectedNodeId) {
      for (var sni = 0; sni < projected.length; sni++) {
        if (projected[sni].node.id === selectedNodeId) {
          var sn = projected[sni].node;
          var sp = projected[sni].proj;
          var snBreath = 1 + Math.sin(time * sn._breathSpeed + sn._breathPhase) * (sn.type === 'core' ? 0.12 : 0.05);
          var snR = sn.size * sp.scale * snBreath;
          var ringPulse = 1 + Math.sin(time * 3) * 0.15;
          // Outer pulsing ring
          ctx.strokeStyle = sn.color || '#a855f7';
          ctx.lineWidth = 2.5 * sp.scale * ringPulse;
          ctx.globalAlpha = 0.6 + Math.sin(time * 3) * 0.2;
          ctx.beginPath();
          ctx.arc(sp.sx, sp.sy, snR * 1.8 * ringPulse, 0, Math.PI * 2);
          ctx.stroke();
          // Inner bright ring
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5 * sp.scale;
          ctx.globalAlpha = 0.4 + Math.sin(time * 4 + 1) * 0.15;
          ctx.beginPath();
          ctx.arc(sp.sx, sp.sy, snR * 1.4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          break;
        }
      }
    }

    animFrame = requestAnimationFrame(draw);
  }

  // Project using render positions (for entry animation)
  function projectRender(node) {
    var cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    var cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    var x = node._renderX !== undefined ? node._renderX : node.x;
    var y = node._renderY !== undefined ? node._renderY : node.y;
    var z = node._renderZ !== undefined ? node._renderZ : (node.z || 0);
    var x1 = x * cosY - z * sinY;
    var z1 = x * sinY + z * cosY;
    var y1 = y * cosX - z1 * sinX;
    var z2 = y * sinX + z1 * cosX;
    var fov = 600;
    var scale = fov / (fov + z2) * zoom;
    return { sx: (W / 2) + x1 * scale, sy: (H / 2) + y1 * scale, scale: scale, z: z2 };
  }

  // Mouse interaction
  canvas.addEventListener('mousedown', function(e) {
    dragging = true; lastMX = e.clientX; lastMY = e.clientY; canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('mouseup', function() {
    dragging = false; canvas.style.cursor = 'grab';
  });
  canvas.addEventListener('mouseleave', function() {
    dragging = false; canvas.style.cursor = 'grab';
    hoveredNode = null;
    var tip = document.getElementById('brainTooltip');
    if (tip) tip.style.display = 'none';
  });
  canvas.addEventListener('mousemove', function(e) {
    if (dragging) {
      rotY += (e.clientX - lastMX) * 0.005;
      rotX += (e.clientY - lastMY) * 0.005;
      // Clamp rotX
      rotX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotX));
      lastMX = e.clientX; lastMY = e.clientY;
    }
    // Hit test for tooltip
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    hoveredNode = null;
    for (var ni = 0; ni < nodes.length; ni++) {
      var n = nodes[ni];
      var p = projectRender(n);
      var dx = mx - p.sx, dy = my - p.sy;
      var hitR = Math.max(n.size * p.scale + 5, 10);
      if (dx * dx + dy * dy < hitR * hitR) {
        hoveredNode = n.id;
        var tip = document.getElementById('brainTooltip');
        if (tip) {
          tip.style.display = 'block';
          tip.style.left = (e.clientX - rect.left + 18) + 'px';
          tip.style.top = (e.clientY - rect.top - 35) + 'px';
          tip.innerHTML = '<span style="color:' + n.color + ';font-weight:700;text-shadow:0 0 6px ' + n.color + '">\u25CF</span> ' + n.label;
        }
        canvas.style.cursor = 'pointer';
        break;
      }
    }
    if (!hoveredNode) {
      var tip2 = document.getElementById('brainTooltip');
      if (tip2) tip2.style.display = 'none';
      if (!dragging) canvas.style.cursor = 'grab';
    }
  });
  canvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    zoom = Math.max(0.3, Math.min(3, zoom - e.deltaY * 0.001));
  }, { passive: false });

  // Touch support for mobile
  canvas.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      dragging = true;
      lastMX = e.touches[0].clientX; lastMY = e.touches[0].clientY;
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', function(e) {
    if (dragging && e.touches.length === 1) {
      e.preventDefault();
      rotY += (e.touches[0].clientX - lastMX) * 0.005;
      rotX += (e.touches[0].clientY - lastMY) * 0.005;
      rotX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotX));
      lastMX = e.touches[0].clientX; lastMY = e.touches[0].clientY;
    }
  }, { passive: false });
  canvas.addEventListener('touchend', function() {
    dragging = false;
  }, { passive: true });

  // Click handler for node detail panel
  canvas.addEventListener('click', function(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var clicked = false;
    for (var ni = 0; ni < nodes.length; ni++) {
      var n = nodes[ni];
      var p = projectRender(n);
      var dx = mx - p.sx, dy = my - p.sy;
      if (dx * dx + dy * dy < (n.size * p.scale + 8) * (n.size * p.scale + 8)) {
        selectedNodeId = n.id;
        showNodeDetail(n);
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      selectedNodeId = null;
      var existingPanel = document.getElementById('brainDetailPanel');
      if (existingPanel) existingPanel.remove();
    }
  });

  // Show node detail panel (Jarvis style) — uses REAL data
  function showNodeDetail(node) {
    var detailHTML = '';

    if (node.type === 'core') {
      detailHTML = '<div class="stat-row"><span>Total Master Records</span><span>' + totalRecords + '</span></div>' +
        '<div class="stat-row"><span>\u0E01\u0E23\u0E30\u0E14\u0E32\u0E29 (Paper)</span><span>' + (bp.total||0) + '</span></div>' +
        '<div class="stat-row"><span>Coating</span><span>' + (bc.total||0) + '</span></div>' +
        '<div class="stat-row"><span>Foil Stamp</span><span>' + (bf.total||0) + '</span></div>' +
        '<div class="stat-row"><span>Box Templates</span><span>' + (bb.total||0) + '</span></div>' +
        '<div class="stat-row"><span>\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E1E\u0E34\u0E21\u0E1E\u0E4C</span><span>' + (bm.total||0) + '</span></div>' +
        '<div class="stat-row"><span>Process Types</span><span>' + (bpr.total||0) + '</span></div>' +
        '<div class="stat-row"><span>RAG Documents</span><span>' + (rStats.documents||0) + '</span></div>' +
        '<div class="stat-row"><span>RAG Chunks</span><span>' + (rStats.chunks||0) + '</span></div>' +
        '<div class="stat-row"><span>Corrugated</span><span>' + (brain.corrugated?.total||0) + '</span></div>' +
        '<div class="stat-row"><span>Price Tiers</span><span>' + (brain.price_tiers?.total||0) + '</span></div>' +
        '<div class="stat-row"><span>Waste Tiers</span><span>' + (brain.waste_tiers?.total||0) + '</span></div>' +
        (bp.gsm_range ? '<div class="stat-row"><span>GSM Range</span><span>' + bp.gsm_range[0] + ' - ' + bp.gsm_range[1] + '</span></div>' : '');
    } else if (node.id === 'paper') {
      detailHTML = '<div class="stat-row" style="border-bottom:1px solid rgba(96,165,250,0.2)"><span style="font-weight:700">Paper Code</span><span style="font-weight:700">\u0E08\u0E33\u0E19\u0E27\u0E19 GSM</span></div>';
      detailHTML += (bp.codes || []).slice(0, 15).map(function(item) {
        return '<div class="stat-row"><span>' + item[0] + '</span><span>' + item[1] + ' \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23</span></div>';
      }).join('');
      if (bp.gsm_range) detailHTML += '<div class="stat-row" style="margin-top:8px;border-top:1px solid rgba(96,165,250,0.15)"><span>GSM Range</span><span>' + bp.gsm_range[0] + ' - ' + bp.gsm_range[1] + '</span></div>';
      if (bp.brands) {
        detailHTML += '<div class="stat-row" style="border-bottom:1px solid rgba(96,165,250,0.2);margin-top:8px"><span style="font-weight:700">Brand</span><span style="font-weight:700">\u0E08\u0E33\u0E19\u0E27\u0E19</span></div>';
        detailHTML += (bp.brands || []).slice(0, 8).map(function(b) { return '<div class="stat-row"><span>' + b[0] + '</span><span>' + b[1] + '</span></div>'; }).join('');
      }
    } else if (node.id === 'box') {
      detailHTML = (bb.templates || []).map(function(item, i) {
        return '<div class="stat-row"><span>Type ' + (i+1) + ': ' + (item[0]||'') + '</span><span style="font-size:11px;opacity:0.7">' + (item[1]||'') + '</span></div>';
      }).join('');
    } else if (node.id === 'machine') {
      detailHTML = (bm.types || []).map(function(item) {
        return '<div class="stat-row"><span>' + item[0] + '</span><span>' + item[1] + ' \u0E02\u0E19\u0E32\u0E14</span></div>';
      }).join('');
    } else if (node.id === 'process') {
      detailHTML = '<div class="stat-row" style="border-bottom:1px solid rgba(56,189,248,0.2)"><span style="font-weight:700">Coating Type</span><span style="font-weight:700">\u0E08\u0E33\u0E19\u0E27\u0E19</span></div>';
      detailHTML += (bc.types || []).map(function(item) {
        return '<div class="stat-row"><span>' + item[0] + '</span><span>' + item[1] + '</span></div>';
      }).join('');
    } else if (node.id === 'foil') {
      detailHTML = '<div class="stat-row" style="border-bottom:1px solid rgba(251,191,36,0.2)"><span style="font-weight:700">\u0E2A\u0E35\u0E1F\u0E2D\u0E22\u0E25\u0E4C</span><span style="font-weight:700">\u0E08\u0E33\u0E19\u0E27\u0E19</span></div>';
      detailHTML += (bf.colors || []).map(function(item) {
        return '<div class="stat-row"><span>' + item[0] + '</span><span>' + item[1] + '</span></div>';
      }).join('');
    } else if (node.id === 'afterpress') {
      detailHTML = (bpr.list || []).map(function(name) {
        return '<div class="stat-row"><span>' + name + '</span><span style="color:#10b981">&#10003;</span></div>';
      }).join('');
    } else if (node.id === 'rag') {
      detailHTML = '<div class="stat-row"><span>Documents</span><span>' + (rStats.documents||0) + '</span></div>' +
        '<div class="stat-row"><span>Total Chunks</span><span>' + (rStats.chunks||0) + '</span></div>';
      if (rStats.categories) {
        for (var ck in rStats.categories) {
          detailHTML += '<div class="stat-row"><span>\u0E2B\u0E21\u0E27\u0E14: ' + ck + '</span><span>' + rStats.categories[ck] + ' docs</span></div>';
        }
      }
    } else if (node.id === 'data') {
      detailHTML = '<div class="stat-row"><span>Price Tiers</span><span>' + (brain.price_tiers?.total||0) + '</span></div>' +
        '<div class="stat-row"><span>Waste Tiers</span><span>' + (brain.waste_tiers?.total||0) + '</span></div>' +
        '<div class="stat-row"><span>Delivery Rates</span><span>' + (brain.delivery?.total||0) + '</span></div>' +
        '<div class="stat-row"><span>Corrugated</span><span>' + (brain.corrugated?.total||0) + '</span></div>' +
        '<div class="stat-row"><span>Exchange Rates</span><span>' + (brain.exchange_rate?.length||0) + '</span></div>' +
        '<div class="stat-row"><span>Block Stamp</span><span>' + (brain.blockstamp?.total||0) + '</span></div>' +
        '<div class="stat-row"><span>Block Die Cut</span><span>' + (brain.blockdiecut?.total||0) + '</span></div>' +
        '<div class="stat-row"><span>Special Ink</span><span>' + (brain.specialink?.total||0) + '</span></div>';
      if (brain.exchange_rate) {
        detailHTML += '<div class="stat-row" style="border-top:1px solid rgba(34,211,238,0.2);margin-top:6px"><span style="font-weight:700">Currency</span><span style="font-weight:700">Rate</span></div>';
        (brain.exchange_rate || []).forEach(function(er) {
          detailHTML += '<div class="stat-row"><span>' + (er.currency_no||er.symbol||'') + '</span><span>' + (er.exchange_rate||er.rate||'-') + '</span></div>';
        });
      }
    } else {
      detailHTML = '<div class="stat-row"><span>' + node.label + '</span></div>';
    }

    var panel = document.getElementById('brainDetailPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'brainDetailPanel';
      canvas.parentElement.appendChild(panel);
    }

    panel.style.cssText = 'position:absolute;right:0;top:3px;width:clamp(280px,30vw,360px);height:calc(100% - 3px);' +
      'background:rgba(8,12,20,0.95);backdrop-filter:blur(24px);' +
      'border-left:1px solid rgba(0,188,212,0.2);' +
      'padding:0;overflow-y:auto;' +
      'animation:brainSlideInRight 0.3s ease;' +
      'z-index:10;';

    var nodeTypeLabel = node.type === 'core' ? 'Printing Intelligence Core' : (node.type === 'category' ? 'Knowledge Category' : 'Data Node');
    var nodeColor = node.color || '#00bcd4';

    panel.innerHTML = '<style>' +
      '@keyframes brainSlideInRight { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }' +
      '@keyframes brainScanLine { 0% { left: -100%; } 100% { left: 100%; } }' +
      '#brainDetailPanel .brain-panel-header { padding:20px 24px; border-bottom:1px solid rgba(0,188,212,0.15); position:relative; overflow:hidden; }' +
      '#brainDetailPanel .brain-panel-header::after { content:""; position:absolute; top:0; left:-100%; width:100%; height:2px; background:linear-gradient(90deg, transparent, #00bcd4, #e91e90, transparent); animation: brainScanLine 2.5s linear infinite; }' +
      '#brainDetailPanel .stat-row { display:flex; justify-content:space-between; align-items:center; padding:10px 24px; border-bottom:1px solid rgba(255,255,255,0.04); font-size:13px; color:rgba(255,255,255,0.8); transition: background 0.2s; }' +
      '#brainDetailPanel .stat-row:hover { background:rgba(0,188,212,0.08); }' +
      '#brainDetailPanel .stat-row span:last-child { color:' + nodeColor + '; font-weight:600; }' +
      '</style>' +
      '<div class="brain-panel-header">' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<div style="width:40px;height:40px;border-radius:50%;background:' + nodeColor + ';display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 20px ' + nodeColor + '60">' +
            (node.icon || '\u25CF') +
          '</div>' +
          '<div>' +
            '<div style="color:#fff;font-size:16px;font-weight:700">' + node.label + '</div>' +
            '<div style="color:rgba(255,255,255,0.5);font-size:12px">' + nodeTypeLabel + '</div>' +
          '</div>' +
        '</div>' +
        '<button onclick="document.getElementById(\'brainDetailPanel\').remove()" style="position:absolute;top:16px;right:16px;background:none;border:none;color:rgba(255,255,255,0.5);font-size:18px;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color=\'#fff\'" onmouseout="this.style.color=\'rgba(255,255,255,0.5)\'">\u2715</button>' +
      '</div>' +
      '<div style="padding:8px 0">' + detailHTML + '</div>';
  }

  // Start animation
  draw();

  window._brainCleanup = null;
}
/* ===== END OLD BRAIN ===== */

// ============================================================
// TOOLS VIEW (renders in main content area)
// ============================================================
function showToolsTab() {
  State._activeTab = 'tools';
  $('dataContent').innerHTML = '';
  showView('viewData');
  setTopBar('Tools', 'เครื่องมือและข้อมูล');
  updateNavActive('navTools');
  $('dataContent').innerHTML = `<div style="max-width:800px;margin:0 auto;padding:32px 20px">

    <!-- Knowledge Base -->
    <div style="background:var(--bg-card);border:1.5px solid var(--border-color);border-radius:16px;padding:28px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.04)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#5b2d8e,#7b4db8);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i class="fas fa-brain" style="color:#fff;font-size:20px"></i>
        </div>
        <div>
          <h4 style="margin:0;font-size:18px;font-weight:700">Knowledge Base</h4>
          <p style="margin:2px 0 0;font-size:13px;color:var(--text-muted)">อัพโหลดเอกสารให้ AI เรียนรู้ — ราคากระดาษ, Spec เครื่องจักร, ข้อมูลลูกค้า</p>
        </div>
      </div>
      <div style="border:2px dashed var(--accent);border-radius:12px;padding:24px;text-align:center;cursor:pointer;transition:all 0.2s;background:var(--bg-input)" onclick="document.getElementById('ragFileInput').click()" onmouseover="this.style.borderColor='#7c3aed';this.style.background='var(--accent-light,rgba(124,58,237,0.05))'" onmouseout="this.style.borderColor='var(--accent)';this.style.background='var(--bg-input)'">
        <i class="fas fa-cloud-upload-alt" style="font-size:32px;color:var(--accent);margin-bottom:8px;display:block"></i>
        <div style="font-size:15px;font-weight:600;color:var(--text-primary)">อัพโหลดเอกสารให้ AI</div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px">Excel, PDF, Word, Text — ลากไฟล์มาวางหรือคลิกเพื่อเลือก</div>
        <input type="file" id="ragFileInput" accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.txt,.md" multiple onchange="App.ragUploadFiles(this.files)" style="display:none">
      </div>
      <div id="ragStatus" style="font-size:13px;color:var(--text-muted);margin-top:10px"></div>
      <div id="ragDocSummary" style="font-size:13px;color:var(--text-muted);margin-top:6px"></div>
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border-color)">
        <button class="tools-btn" onclick="App.showAIBrain()" style="width:100%;padding:14px;font-size:14px;background:linear-gradient(135deg,#5b2d8e,#302b63);color:#fff;border:1px solid rgba(167,139,250,0.3);border-radius:10px;cursor:pointer;transition:all 0.3s;font-weight:600" onmouseover="this.style.boxShadow='0 0 20px rgba(124,58,237,0.3)';this.style.transform='translateY(-1px)'" onmouseout="this.style.boxShadow='none';this.style.transform='none'">
          <i class="fas fa-brain" style="margin-right:8px"></i> AI Brain Knowledge Base
        </button>
      </div>
    </div>

    <!-- Master Data -->
    <div style="background:var(--bg-card);border:1.5px solid var(--border-color);border-radius:16px;padding:28px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.04)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:22px">
        <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#3b82f6);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i class="fas fa-database" style="color:#fff;font-size:20px"></i>
        </div>
        <div>
          <h4 style="margin:0;font-size:18px;font-weight:700">Master Data</h4>
          <p style="margin:2px 0 0;font-size:13px;color:var(--text-muted)">จัดการข้อมูลหลัก — เพิ่ม แก้ไข ลบได้</p>
        </div>
      </div>

      <!-- CRUD Section -->
      <div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:10px;padding-left:2px">
        <i class="fas fa-pen" style="margin-right:6px;font-size:10px"></i>จัดการข้อมูล (CRUD)
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px">
        <button class="tools-btn" onclick="App.viewMasterCRUD('paper_info','ข้อมูลกระดาษ')" style="padding:14px 16px;font-size:14px;margin-bottom:0"><i class="fas fa-scroll" style="margin-right:8px;color:#2563eb"></i> กระดาษ</button>
        <button class="tools-btn" onclick="App.viewMasterCRUD('coating_info','Coating')" style="padding:14px 16px;font-size:14px;margin-bottom:0"><i class="fas fa-fill-drip" style="margin-right:8px;color:#0ea5e9"></i> Coating</button>
        <button class="tools-btn" onclick="App.viewMasterCRUD('foilstamp_info','Foil Stamp')" style="padding:14px 16px;font-size:14px;margin-bottom:0"><i class="fas fa-star" style="margin-right:8px;color:#d97706"></i> Foil Stamp</button>
        <button class="tools-btn" onclick="App.viewMasterCRUD('machine_std_paper_info','เครื่องพิมพ์-กระดาษ')" style="padding:14px 16px;font-size:14px;margin-bottom:0"><i class="fas fa-print" style="margin-right:8px;color:#059669"></i> เครื่องพิมพ์</button>
      </div>

      <!-- Divider -->
      <div style="border-top:1px solid var(--border-color);margin-bottom:16px"></div>

      <!-- Read-only Section -->
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:10px;padding-left:2px">
        <i class="fas fa-eye" style="margin-right:6px;font-size:10px"></i>ดูข้อมูล (Read Only)
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
        <button class="tools-btn" onclick="App.viewMaster('paper_code_type','ประเภทกระดาษ')" style="padding:12px 16px;font-size:13px;margin-bottom:0"><i class="fas fa-file" style="margin-right:8px;color:var(--text-muted)"></i> ประเภทกระดาษ</button>
        <button class="tools-btn" onclick="App.viewMaster('boxtemplate_info','รูปแบบกล่อง')" style="padding:12px 16px;font-size:13px;margin-bottom:0"><i class="fas fa-box" style="margin-right:8px;color:var(--text-muted)"></i> รูปแบบกล่อง</button>
        <button class="tools-btn" onclick="App.viewMaster('exchange_rate','อัตราแลกเปลี่ยน')" style="padding:12px 16px;font-size:13px;margin-bottom:0"><i class="fas fa-money-bill" style="margin-right:8px;color:var(--text-muted)"></i> อัตราแลกเปลี่ยน</button>
        <button class="tools-btn" onclick="App.viewMaster('process_type','Process Types')" style="padding:12px 16px;font-size:13px;margin-bottom:0"><i class="fas fa-cogs" style="margin-right:8px;color:var(--text-muted)"></i> Process Types</button>
      </div>
    </div>

    <!-- Demo & Links -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">
      <div style="background:var(--bg-card);border:1.5px solid var(--border-color);border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.04)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#d97706,#f59e0b);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i class="fas fa-flask" style="color:#fff;font-size:16px"></i>
          </div>
          <h5 style="margin:0;font-size:16px;font-weight:700">Demo & Test</h5>
        </div>
        <button class="tools-btn" onclick="App.showDemoMenu()" style="width:100%;padding:12px;font-size:14px"><i class="fas fa-play" style="margin-right:8px"></i> ทดสอบ AI Agent Demo</button>
      </div>
      <div style="background:var(--bg-card);border:1.5px solid var(--border-color);border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.04)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#059669,#10b981);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i class="fas fa-external-link-alt" style="color:#fff;font-size:16px"></i>
          </div>
          <h5 style="margin:0;font-size:16px;font-weight:700">Links</h5>
        </div>
        <a href="${EST_FRONTEND}" target="_blank" class="tools-btn" style="text-decoration:none;display:block;width:100%;padding:12px;font-size:14px;text-align:center">
          <i class="fas fa-external-link-alt" style="margin-right:8px"></i> Estimate System
        </a>
      </div>
    </div>

  </div>`;
  ragLoadDocList();
}

function switchTab(tab, el) {
  // Legacy compat — now routes to views
  if (tab === 'rfq') {
    showRFQListView();
  } else {
    showToolsTab();
  }
}

// ============================================================
// RFQ DETAIL VIEW
// ============================================================
async function viewDetail(jobId, el) {
  showView('viewDetail');
  setTopBar(jobId, 'RFQ Detail');
  updateNavActive(null);
  $('detailContent').innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด...</div>';

  try {
    const data = await apiGet(`/api/rfq/detail/${jobId}`);
    renderDetail(jobId, data);
  } catch (e) {
    $('detailContent').innerHTML = `<div class="loading-spinner" style="color:#f08080">${e.message}</div>`;
  }
}

function renderDetail(jobId, d) {
  const jd = d.job_data || d;
  const job = jd.job || {};
  const ae = jd.ae || {};
  const cust = jd.customer || {};
  const est = jd.estimator || {};
  const qty = jd.qty || {};
  const comps = jd.component1 || jd.components || [];
  const procs = jd.process || [];
  const delivs = jd.delivery || [];
  const tp = jd.totalprice || {};
  const rmk = jd.remark || {};
  const sc = d.approve_status === 'Approve' ? 'approve' : d.approve_status === 'Pending' ? 'pending' : 'draft';

  let h = `<div class="detail-header">
    <div>
      <h4>${jobId} <span class="rfq-status ${sc}" style="font-size:12px">${d.approve_status || 'Draft'}</span></h4>
      <div style="color:var(--text-muted);font-size:13px">${job.job_name || d.job_name || '-'}</div>
    </div>
    <div class="detail-actions">
      <button class="text-btn" onclick="App.editRFQ('${jobId}')"><i class="fas fa-edit"></i> แก้ไข</button>
      <button class="text-btn" onclick="App.copyRFQ('${jobId}')"><i class="fas fa-copy"></i> คัดลอก</button>
      <button class="text-btn" onclick="App.viewQuotations('${jobId}')"><i class="fas fa-file-invoice"></i> Quotation</button>
      <button class="text-btn" onclick="App.viewHistory('${jobId}')"><i class="fas fa-history"></i> ประวัติ</button>
      <button class="text-btn" onclick="App.viewVersionHistory('${jobId}')"><i class="fas fa-code-branch"></i> เวอร์ชัน</button>
      <button class="text-btn" style="color:#e74c3c" onclick="App.deleteRFQ('${jobId}')"><i class="fas fa-trash"></i> ลบ</button>
      <a class="text-btn" href="${EST_FRONTEND}/rfq/${jobId}" target="_blank"><i class="fas fa-external-link-alt"></i> เปิดในระบบ</a>
    </div>
  </div>

  <div class="detail-card">
    <h6><i class="fas fa-file-alt"></i> ข้อมูลงาน</h6>
    <div class="detail-grid">
      <div class="detail-field"><label>Job ID</label><div class="value">${jobId}</div></div>
      <div class="detail-field"><label>ชื่องาน</label><div class="value">${job.job_name || d.job_name || '-'}</div></div>
      <div class="detail-field"><label>วันที่</label><div class="value">${d.estimate_date || '-'}</div></div>
      <div class="detail-field"><label>Ref/Copy</label><div class="value">${d.ref_copy_rfq || '-'}</div></div>
      <div class="detail-field"><label>Currency</label><div class="value">${jd.currency_no || 'THB'} ${jd.exchange_rate ? '(Rate: '+jd.exchange_rate+')':''}</div></div>
      <div class="detail-field"><label>Tax</label><div class="value">${jd.tax || '-'}</div></div>
    </div>
  </div>

  <div class="detail-card">
    <h6><i class="fas fa-users"></i> ลูกค้า / AE</h6>
    <div class="detail-grid">
      <div class="detail-field"><label>ลูกค้า</label><div class="value">${cust.customer_name || d.customer_name || '-'}</div></div>
      <div class="detail-field"><label>Customer ID</label><div class="value">${cust.customer_id || '-'}</div></div>
      <div class="detail-field"><label>AE</label><div class="value">${ae.ae_name || d.ae_name || '-'}</div></div>
      <div class="detail-field"><label>Estimator</label><div class="value">${est.estimator_name || '-'}</div></div>
    </div>
  </div>

  <div class="detail-card">
    <h6><i class="fas fa-sort-numeric-up"></i> จำนวน / ราคา</h6>
    <div class="detail-grid">
      <div class="detail-field"><label>จำนวน</label><div class="value">${formatQtyObj(qty)}</div></div>
      <div class="detail-field"><label>Total Price</label><div class="value">${formatPriceObj(tp)}</div></div>
    </div>
  </div>`;

  if (comps.length) {
    h += `<div class="detail-card"><h6><i class="fas fa-layer-group"></i> Components (${comps.length})</h6>
    <table class="detail-table"><thead><tr><th>#</th><th>ชื่อ</th><th>กล่อง</th><th>ขนาด</th><th>กระดาษ</th><th>สี</th></tr></thead><tbody>`;
    comps.forEach((c, i) => {
      const sz = c.packaging_size || c.size || {};
      const pp = c.paper || {};
      const cl = c.color?.[0] || c;
      h += `<tr><td>${i+1}</td><td>${c.component_name||c.name||'-'}</td>
        <td>${c.box_type?.type_name||c.box_type||'-'}</td>
        <td>${sz.width||'-'}x${sz.length||'-'}x${sz.depth||'-'}</td>
        <td>${pp.paper_code||pp.code||'-'} ${pp.paper_gram||pp.gram||''}</td>
        <td>${cl.outside||cl.color_outside||'-'}/${cl.inside||cl.color_inside||'-'}</td></tr>`;
    });
    h += '</tbody></table></div>';
  }

  if (procs.length) {
    h += `<div class="detail-card"><h6><i class="fas fa-cogs"></i> กระบวนการ (${procs.length})</h6>
    <table class="detail-table"><thead><tr><th>ประเภท</th><th>ชื่อ</th><th>Line</th></tr></thead><tbody>`;
    procs.forEach(p => { const ln = (typeof p.line === 'object' && p.line !== null) ? (p.line.name || p.line.line_name || JSON.stringify(p.line)) : (p.line||'-'); h += `<tr><td>${p.type||'-'}</td><td>${p.name||'-'}</td><td>${ln}</td></tr>`; });
    h += '</tbody></table></div>';
  }

  if (delivs.length) {
    h += `<div class="detail-card"><h6><i class="fas fa-truck"></i> การจัดส่ง (${delivs.length})</h6>
    <table class="detail-table"><thead><tr><th>รอบ</th><th>สถานที่</th><th>น้ำหนัก</th></tr></thead><tbody>`;
    delivs.forEach(dl => { h += `<tr><td>${dl.round||'-'}</td><td>${dl.destinationName||dl.destination||'-'}</td><td>${dl.net_weight||'-'}</td></tr>`; });
    h += '</tbody></table></div>';
  }

  if (rmk.remark || rmk.remark_ae) {
    h += `<div class="detail-card"><h6><i class="fas fa-sticky-note"></i> หมายเหตุ</h6>
    ${rmk.remark ? '<div style="margin-bottom:8px"><label style="font-size:11px;color:var(--text-muted)">Remark</label><div>'+escapeHtml(rmk.remark)+'</div></div>' : ''}
    ${rmk.remark_ae ? '<div><label style="font-size:11px;color:var(--text-muted)">Remark AE</label><div>'+escapeHtml(rmk.remark_ae)+'</div></div>' : ''}
    </div>`;
  }

  // Status workflow actions
  const st = d.approve_status || 'Draft';
  h += `<div class="detail-card" style="display:flex;gap:8px;justify-content:flex-end;padding:16px">`;
  if (st === 'Draft' || !st) {
    h += `<button class="text-btn success" onclick="App.requestApprove('${jobId}')" style="padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid #28a745;background:rgba(40,167,69,0.08);color:#28a745"><i class="fas fa-paper-plane"></i> ส่งขออนุมัติ</button>`;
  }
  if (st === 'Pending') {
    h += `<button class="text-btn success" onclick="App.approveRFQ('${jobId}')" style="padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid #28a745;background:rgba(40,167,69,0.08);color:#28a745"><i class="fas fa-check"></i> อนุมัติ</button>`;
    h += `<button class="text-btn danger" onclick="App.rejectRFQ('${jobId}')" style="padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid #dc3545;background:rgba(220,53,69,0.08);color:#dc3545"><i class="fas fa-times"></i> ปฏิเสธ</button>`;
  }
  h += `</div>`;

  $('detailContent').innerHTML = h;
}

function formatQtyObj(q) {
  if (!q) return '-';
  if (typeof q === 'string' || typeof q === 'number') return num(q);
  const vals = [];
  for (let i = 1; i <= 5; i++) if (q['qty'+i]) vals.push(num(q['qty'+i]));
  return vals.length ? vals.join(' / ') : '-';
}
function formatPriceObj(tp) {
  if (!tp) return '-';
  if (typeof tp === 'string' || typeof tp === 'number') return num(tp) + ' THB';
  const vals = [];
  for (let i = 1; i <= 5; i++) {
    const v = tp['total_price'+i] || tp['totalprice'+i];
    if (v) vals.push(num(v));
  }
  return vals.length ? vals.join(' / ') + ' THB' : '-';
}

// ============================================================
// RFQ FORM
// ============================================================
function newRFQ() {
  State.form = freshForm();
  State.formMode = 'create';
  State.formEditId = null;
  State.fieldSource = {};
  State._formTouched = false;
  renderForm();
  showView('viewForm');
  setTopBar('สร้าง RFQ ใหม่', 'กรอกข้อมูลหรือให้ Agent ช่วยกรอก');
  updateNavActive(null);
}

async function editRFQ(jobId) {
  showView('viewForm');
  setTopBar('แก้ไข ' + jobId, 'กำลังโหลดข้อมูล...');
  $('formContent').innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด...</div>';

  try {
    // MI system check (C3)
    const miStatus = await checkMIStatus(jobId);
    if (miStatus.locked) {
      toast(miStatus.message, 'error');
      $('formContent').innerHTML = `<div class="loading-spinner" style="color:#f08080"><i class="fas fa-lock"></i> ${miStatus.message}</div>`;
      return;
    }

    const data = await apiGet(`/api/rfq/detail/${jobId}`);
    State.form = mapApiToForm(data);

    // A5+B6: Check if view-only based on status and role
    const docStatus = (State.form.doc_status || '').toLowerCase();
    if (DocumentStatusManager.isViewOnly(docStatus) || !DocumentStatusManager.canEdit(docStatus)) {
      return viewOnlyRFQ(jobId);
    }

    State.formMode = 'edit';
    State.formEditId = jobId;
    State.fieldSource = {};
    State._formTouched = true; // editing existing = already has data
    renderForm();
    setTopBar('แก้ไข ' + jobId, 'Edit RFQ');
  } catch (e) {
    $('formContent').innerHTML = `<div class="loading-spinner" style="color:#f08080">${e.message}</div>`;
  }
}

// ============================================================
// A5: VIEW-ONLY MODE
// ============================================================
async function viewOnlyRFQ(jobId) {
  showView('viewForm');
  setTopBar('ดูรายละเอียด ' + jobId, 'View Only');
  $('formContent').innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด...</div>';
  try {
    const data = await apiGet(`/api/rfq/detail/${jobId}`);
    State.form = mapApiToForm(data);
    State.formMode = 'view';
    State.formEditId = jobId;
    State.fieldSource = {};
    renderForm();
    setTopBar('ดูรายละเอียด ' + jobId, 'View Only (Read-only)');
    // Disable all inputs in view mode
    setTimeout(() => {
      document.querySelectorAll('#formContent input, #formContent select, #formContent textarea').forEach(el => {
        el.disabled = true;
        el.style.opacity = '0.7';
      });
      document.querySelectorAll('#formContent button').forEach(btn => {
        if (!btn.textContent.includes('PDF') && !btn.textContent.includes('Layout') && !btn.textContent.includes('Price')) {
          btn.disabled = true;
          btn.style.opacity = '0.5';
        }
      });
      // Hide save/submit actions
      const actionsBar = document.querySelector('#formContent .form-actions, #formContent .preview-actions');
      if (actionsBar) actionsBar.style.display = 'none';
    }, 100);
  } catch (e) {
    $('formContent').innerHTML = `<div class="loading-spinner" style="color:#f08080">${e.message}</div>`;
  }
}

// ============================================================
// B6: DOCUMENT STATUS MANAGER (Role-based access)
// ============================================================
const DocumentStatusManager = {
  roles: { ae: 'AE', estimator: 'Estimator', manager: 'Manager', admin: 'Admin' },
  statuses: {
    draft:    { label: 'Draft',    color: '#888',  next: ['pending'] },
    pending:  { label: 'Pending',  color: '#e6a700', next: ['approved', 'rejected'] },
    approved: { label: 'Approved', color: '#28a745', next: [] },
    rejected: { label: 'Rejected', color: '#dc3545', next: ['draft', 'pending'] },
  },

  getUserRole() {
    const s = State.session;
    if (!s?.loggedIn) return null;
    const u = s.user || {};
    if (u.role) return u.role.toLowerCase();
    if (u.position?.toLowerCase().includes('manager')) return 'manager';
    if (u.dept_name?.toLowerCase().includes('estimate') || u.position?.toLowerCase().includes('estimate')) return 'estimator';
    return 'ae';
  },

  canEdit(status) {
    const role = this.getUserRole();
    if (role === 'admin') return true;
    if (status === 'approved') return false;
    if (status === 'pending' && role === 'ae') return false;
    return true;
  },

  canChangeStatus(currentStatus, newStatus) {
    const role = this.getUserRole();
    if (role === 'admin') return true;
    const allowed = this.statuses[currentStatus]?.next || [];
    if (!allowed.includes(newStatus)) return false;
    // Only manager/estimator can approve
    if (newStatus === 'approved' && role !== 'manager' && role !== 'estimator') return false;
    return true;
  },

  getAvailableActions(status) {
    const role = this.getUserRole();
    const actions = [];
    if (status === 'draft') {
      actions.push({ action: 'pending', label: 'ส่งอนุมัติ', icon: 'fa-paper-plane', color: '#e6a700' });
    }
    if (status === 'pending' && (role === 'manager' || role === 'estimator' || role === 'admin')) {
      actions.push({ action: 'approved', label: 'อนุมัติ', icon: 'fa-check', color: '#28a745' });
      actions.push({ action: 'rejected', label: 'ไม่อนุมัติ', icon: 'fa-times', color: '#dc3545' });
    }
    if (status === 'rejected') {
      actions.push({ action: 'draft', label: 'แก้ไขใหม่', icon: 'fa-redo', color: '#888' });
      actions.push({ action: 'pending', label: 'ส่งอนุมัติอีกครั้ง', icon: 'fa-paper-plane', color: '#e6a700' });
    }
    return actions;
  },

  getStatusBadge(status) {
    const s = this.statuses[status] || { label: status, color: '#888' };
    return `<span style="background:${s.color};color:#fff;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600">${s.label}</span>`;
  },

  isViewOnly(status) {
    return status === 'approved';
  },
};

// ============================================================
// B7: PROCESS INFO BUILDER (maps estimate processes → MI2 process IDs)
// ============================================================
const ProcessInfoBuilder = {
  // MI2 process type mapping
  processMap: {
    'trim':       { mi_id: 'P001', mi_name: 'Trim/Cut' },
    'die_cut':    { mi_id: 'P002', mi_name: 'Die Cut' },
    'score':      { mi_id: 'P003', mi_name: 'Score' },
    'fold':       { mi_id: 'P004', mi_name: 'Fold' },
    'glue':       { mi_id: 'P005', mi_name: 'Gluing' },
    'window':     { mi_id: 'P006', mi_name: 'Window Patch' },
    'laminate':   { mi_id: 'P007', mi_name: 'Laminate' },
    'coating':    { mi_id: 'P010', mi_name: 'Coating' },
    'foil_stamp': { mi_id: 'P011', mi_name: 'Foil Stamping' },
    'emboss':     { mi_id: 'P012', mi_name: 'Embossing' },
    'deboss':     { mi_id: 'P013', mi_name: 'Debossing' },
    'spot_uv':    { mi_id: 'P014', mi_name: 'Spot UV' },
    'varnish':    { mi_id: 'P015', mi_name: 'Varnish' },
    'bag':        { mi_id: 'P020', mi_name: 'Bag/Poly' },
    'shrinkwrap': { mi_id: 'P021', mi_name: 'Shrink Wrap' },
    'paperband':  { mi_id: 'P030', mi_name: 'Paper Band' },
    'kraftwrap':  { mi_id: 'P031', mi_name: 'Kraft Wrap' },
    'carton':     { mi_id: 'P032', mi_name: 'Carton Pack' },
    'pallet':     { mi_id: 'P033', mi_name: 'Pallet' },
    'print':      { mi_id: 'P040', mi_name: 'Printing' },
    'plate':      { mi_id: 'P041', mi_name: 'Plate Making' },
    'proof':      { mi_id: 'P042', mi_name: 'Color Proof' },
    'handwork':   { mi_id: 'P050', mi_name: 'Handwork' },
    'outsource':  { mi_id: 'P060', mi_name: 'Outsource' },
  },

  buildFromEstimate(form) {
    const f = form || State.form;
    const items = [];

    // From components: addons → processes
    f.components.forEach((c, ci) => {
      // Per-component processes
      (c.comp_process || []).forEach(cp => {
        if (cp.type) {
          const m = this.processMap[cp.type] || { mi_id: 'P099', mi_name: cp.type };
          items.push({ component: ci + 1, process_type: cp.type, mi_process_id: m.mi_id, mi_process_name: m.mi_name, name: cp.name || m.mi_name });
        }
      });
      // Addons → processes
      (c.addon || []).forEach(a => {
        const aType = (a.type || '').toLowerCase().replace(/\s+/g, '_');
        const m = this.processMap[aType] || this.processMap[aType.replace('_stamp', '')] || null;
        if (m) items.push({ component: ci + 1, process_type: aType, mi_process_id: m.mi_id, mi_process_name: m.mi_name, name: `${a.type} - ${a.code || '-'}` });
      });
    });

    // From process section
    (f.process || []).forEach(p => {
      if (p.type) {
        const key = p.type.toLowerCase().replace(/\s+/g, '_');
        const m = this.processMap[key] || { mi_id: 'P099', mi_name: p.type };
        items.push({ process_type: p.type, mi_process_id: m.mi_id, mi_process_name: m.mi_name, name: p.name || m.mi_name, line: p.line || '' });
      }
    });

    return items;
  },

  getMIProcessIds(form) {
    return this.buildFromEstimate(form).map(i => i.mi_process_id).filter((v, i, a) => a.indexOf(v) === i);
  },
};

// ============================================================
// B8: PACKING AUTO-SIZING
// ============================================================
function calcPackingAutoSize(component, qty) {
  const sz = component.packaging_size || {};
  const w = parseFloat(sz.width) || 0;
  const l = parseFloat(sz.length) || 0;
  const d = parseFloat(sz.depth) || 0;
  const layer = parseInt(component.box_type?.packing_layer) || 1;
  const PC = CalcEngine.CALC.packing;

  // Paperband: wrap around stack of boxes
  const pbQty = Math.ceil(qty / PC.paperband_qty);
  const stackH = (d * layer * PC.paperband_qty);
  const pbW = l + 20; // 20mm overlap
  const pbL = 2 * (w + stackH) + 40; // wrap around

  // Kraftwrap: one per stack
  const kwStackWeight = 0; // calculated elsewhere
  const kwW = w + 2 * d + 20;
  const kwL = l + 2 * d + 20;

  // Carton: fits box stack
  const cartonW = w + 10;
  const cartonL = l + 10;
  const cartonH = d * layer + 10;

  // Pallet sizing
  const palletW = 1100; // std mm
  const palletL = 1100;
  const boxesPerRow = Math.floor(palletW / Math.max(w, 1)) * Math.floor(palletL / Math.max(l, 1));
  const palletLayers = Math.min(Math.ceil(qty / Math.max(boxesPerRow, 1)), Math.floor(PC.pallet_max_height_inch * 25.4 / Math.max(d * layer, 1)));

  return {
    paperband: { qty: pbQty, width: Math.round(pbW), length: Math.round(pbL), pricePerPc: PC.paperband_price, total: pbQty * PC.paperband_price },
    kraftwrap: { width: Math.round(kwW), length: Math.round(kwL), pricePerPc: PC.kraftwrap_price },
    carton: { width: Math.round(cartonW), length: Math.round(cartonL), height: Math.round(cartonH) },
    pallet: { boxesPerRow, layers: palletLayers, totalBoxes: boxesPerRow * palletLayers },
  };
}

// ============================================================
// B9: EXCHANGE RATE AUTO-FETCH
// ============================================================
async function fetchExchangeRate(currency) {
  if (!currency || currency === 'THB') {
    State.form.exchange_rate = '1';
    renderForm();
    return;
  }
  try {
    const data = await apiGet(`/api/estimate/master_data?type=exchange_rate_info`);
    if (Array.isArray(data)) {
      const rate = data.find(r => r.currency === currency || r.currency_code === currency);
      if (rate) {
        State.form.exchange_rate = rate.rate || rate.exchange_rate || '1';
        toast(`Exchange rate ${currency}: ${State.form.exchange_rate}`, 'info');
        renderForm();
        return;
      }
    }
    toast(`ไม่พบ exchange rate สำหรับ ${currency}`, 'warning');
  } catch (e) {
    toast('ไม่สามารถดึง exchange rate ได้', 'warning');
  }
}

function mapApiToForm(d) {
  const jd = d.job_data || d;
  const job = jd.job || {};
  const ae = jd.ae || {};
  const cust = jd.customer || {};
  const est = jd.estimator || {};
  const q = jd.qty || {};
  const comps = jd.component1 || [];
  const rmk = jd.remark || {};

  const base = freshForm();
  // Job info
  base.job_name = job.job_name || d.job_name || '';
  base.customer = { customer_id: cust.customer_id || '', customer_name: cust.customer_name || '' };
  base.ae = { emp_id: ae.emp_id || ae.ae_id || '', emp_name: ae.ae_name || '' };
  base.estimator = { emp_id: est.emp_id || est.estimator_id || '', emp_name: est.estimator_name || '' };
  base.currency_no = jd.currency_no || 'THB';
  base.exchange_rate = jd.exchange_rate || '1';
  base.tax = jd.tax || '7';
  base.ref_copy_id = job.ref_copy_rfq || d.ref_copy_rfq || '';
  base.ink_type = job.ink_type || jd.ink_type || 'conventional';
  base.print_type = job.print_type || jd.print_type || 'Offset';
  base.machine_id = job.machine_id || jd.machine_id || '';
  base.flexo_size = job.flexo_size || '';
  base.has_multi_f = job.is_multiple_f || false;
  base.doc_status = job.status || jd.status || d.status || 'Draft';
  base.rfq_id = d.job_id || d.rfq_id || jd.rfq_id || '';
  base.profit_sharing = job.is_profit_sharing || false;
  base.is_reprinted = !!job.is_reprinted;
  // Job type: Reprint detection from parsed data (NOT from job_name alone — user can override via dropdown)
  if (d.job_type === 'repeat' || d.is_reprinted || job.is_reprinted) {
    base.job_type = 'repeat';
    base.is_reprinted = true;
  } else if (d.job_type === 'new') {
    // User/parser explicitly says new → respect it
    base.job_type = 'new';
    base.is_reprinted = false;
  } else if (/\b(?:re-?print(?:ed)?|re-?run|repeat\s*(?:job|order|งาน)?)\b/i.test(base.job_name || '') ||
             /รีพริ้น|รี[ปพ]ริ้?น?ท?|งานซ้ำ|พิมพ์ซ้ำ|พิมพ์ใหม่|สั่งซ้ำ|ปริ้นซ้ำ|ซ้ำเดิม|งานเก่า/.test(base.job_name || '')) {
    base.job_type = 'repeat';
    base.is_reprinted = true;
  }
  base.is_use_previous_plate = job.is_use_previous_plate || false;
  base.is_loss = job.is_loss || false;
  base.credit_term_id = job.credit_term_id || '';
  base.credit_term_name = job.credit_term_name || '';
  base.credit_term = job.credit_term_name || cust.credit_term || '';
  if (job.color_limit?.[0]) {
    base.limit_color = job.color_limit[0].is_color_limit || false;
    base.limit_color_qty = job.color_limit[0].qty || '';
  }
  // Qty
  const qMain = q.main || [];
  const qtyArr = [qMain[0]||q.qty1||'', qMain[1]||q.qty2||'', qMain[2]||q.qty3||'', qMain[3]||q.qty4||'', qMain[4]||q.qty5||''].map(String).filter(v => v && v !== '0');
  base.qty = qtyArr.length ? qtyArr : [''];
  base.run_on_percent = q.runon_percent || '';
  const runOnArr = (q.runon || []).map(String);
  base.run_on_values = runOnArr.length ? runOnArr : base.qty.map(() => '');
  base.ae_qty = q.ae || '';
  base.customer_qty = q.customer || '';
  // Components
  base.components = comps.length ? comps.map(c => {
    const comp = freshComponent();
    comp.component_name = c.component_name || '';
    comp.component_type = c.component_type || 1;
    comp.box_type = { type_id: c.box_type?.type_id||'', type_name: c.box_type?.type_name||'', glued_spot: c.box_type?.glued_spot||0, packing_layer: c.box_type?.packing_layer||2, is_digital_diecut: c.box_type?.is_digital_diecut||false };
    comp.packaging_size = {
      width: c.packaging_size?.width||'', length: c.packaging_size?.length||'', depth: c.packaging_size?.depth != null ? String(c.packaging_size.depth) : '',
      glue_flap: c.packaging_size?.glue_flap||'15', tuck_flap: c.packaging_size?.tuck_flap||'15', dust_flap: c.packaging_size?.dust_flap||'',
    };
    // Color
    const clr = c.color?.[0] || {};
    comp.color = {
      outside: clr.outside ?? '', inside: clr.inside ?? '0', f_code: clr.f_code || '',
      is_special_ink: clr.is_special_ink || false,
      black_printing_outside: clr.black_printing_outside || false,
      black_printing_inside: clr.black_printing_inside || false,
      special_ink: clr.special_ink || [],
    };
    // Paper
    if (c.paper) {
      comp.paper = { ...comp.paper, ...c.paper };
    }
    // Addon (C13: include sizes, f_code, depth, code, side)
    comp.addon = (c.addon || []).map(ad => ({
      type_id: ad.type_id||'', type: ad.type||'', process_id: ad.process_id||'', name: ad.name||'',
      code: ad.code || ad.addon_code || '', side: ad.side || ad.addon_side || '',
      f_code: ad.f_code || ad.addon_f_code || '',
      depth: ad.depth || ad.addon_depth || '',
      sizes: ad.sizes || (ad.addon_sizes ? (typeof ad.addon_sizes === 'string' ? JSON.parse(ad.addon_sizes) : ad.addon_sizes) : [{ width: '', length: '' }]),
      info: ad.info || {}, line: ad.line || [],
    }));
    // Block cost — extract from component process (diecut block)
    const diecutProc = (c.process || []).find(p => p.name === 'diecut');
    if (diecutProc?.line?.[0]?.block?.unit_price) {
      comp.block_cost = String(diecutProc.line[0].block.unit_price);
    }
    // Corrugated (C13)
    if (c.corrugated) {
      comp.corrugated = {
        layer: c.corrugated.layer || '',
        flute_type: c.corrugated.flute_type || '',
        thickness: c.corrugated.thickness || '',
        cost: c.corrugated.cost || '',
        grades: c.corrugated.grades || [],
        flute_side: c.corrugated.flute_side || '',
        cut_off: c.corrugated.cut_off || '',
        pricing_unit: c.corrugated.pricing_unit || 'sqft',
      };
    }
    // Special Ink (C13)
    if (c.color?.[0]?.special_ink?.length || c.special_ink?.length) {
      comp.special_ink = (c.special_ink || c.color?.[0]?.special_ink || []).map(ink => ({
        color: ink.color || '', type: ink.type || ink.ink_type || '',
        print_style: ink.print_style || '', paper_code: ink.paper_code || '',
      }));
    }
    // Per-component process
    comp.comp_process = (c.process || []).map(cp => ({
      type: cp.type||'', type_id: cp.type_id||'', process_id: cp.process_id||'', name: cp.name||'',
      info: cp.info || {}, line: cp.line || [],
    }));
    // Packing
    comp.packing = c.packing || [];
    comp.paper_tolerance = c.paper_tolerance || '';
    comp.f_detail = c.f_detail || '';
    return comp;
  }) : [freshComponent()];
  // Process (top-level)
  base.process = (jd.process || []).map(p => {
    const ln = (typeof p.line === 'object' && p.line !== null && !Array.isArray(p.line)) ? (p.line.name || p.line.line_name || '') : '';
    return { type: p.type||'', type_id: p.type_id||'', process_id: p.process_id||'', name: p.name||'', line: ln, info: p.info||{} };
  });
  // Process info
  if (jd.process_info) base.process_info = jd.process_info;
  // Delivery
  base.delivery = (jd.delivery || []).map(dl => {
    const dv = freshDelivery();
    dv.round = dl.round || '';
    dv.destinationId = dl.destinationId || dl.destination_id || '';
    dv.destinationName = dl.destinationName || dl.destination || '';
    dv.province = dl.province || '';
    dv.dueDate = dl.dueDate || dl.delivery_date || '';
    dv.net_weight = dl.net_weight || '';
    // C13: Split delivery
    if (dl.split_delivery) {
      dv.split_delivery = typeof dl.split_delivery === 'string' ? JSON.parse(dl.split_delivery) : dl.split_delivery;
    } else if (dl.has_split && dl.split_items) {
      dv.split_delivery = { enabled: true, items: typeof dl.split_items === 'string' ? JSON.parse(dl.split_items) : dl.split_items };
    }
    return dv;
  });
  // Other costs
  base.otherCost = jd.otherCost || [];
  base.priceDiff = jd.priceDiff || [];
  base.customer_gift = jd.customer_gift || [];
  // Material
  base.materials = (jd.material || []).map(m => ({ name: m.name||'', detail: m.detail||'', cost: m.cost||'' }));
  // Remark
  base.remark = typeof rmk === 'string' ? rmk : (rmk.remark || '');
  base.remark_ae = typeof rmk === 'string' ? '' : (rmk.remark_ae || '');
  return base;
}

// Helper: flat process row (matching original system layout)
function renderFlatProcessRow(label, arrKey, items) {
  const esc = (v) => escapeHtml(v || '');
  const chk = (v) => v ? 'checked' : '';
  const itemLabel = { other_process: 'Process:', handwork_process: 'Process:', outsource: 'จัดจ้าง:', materials: 'Material:', other_items: 'Other:' }[arrKey] || 'Item:';
  const isMaterial = ['materials', 'other_items'].includes(arrKey);
  return `<div class="flat-row">
    <div class="flat-row-header"><b>${label}</b> <button class="btn btn-secondary" onclick="App.addArrayItem('${arrKey}')" style="font-size:11px;padding:2px 8px"><i class="fas fa-plus"></i> เพิ่ม</button></div>
    ${items.map((p,i) => `<div style="display:flex;gap:6px;align-items:center;padding:5px 0;border-bottom:1px solid var(--border-color);flex-wrap:wrap">
      <button class="array-item-remove" onclick="App.removeArrayItem('${arrKey}',${i})" title="ลบ"><i class="fas fa-times"></i></button>
      <span style="font-size:12px;min-width:60px">${itemLabel}</span>
      <input class="form-input" value="${esc(p.name)}" oninput="App.setArrayItem('${arrKey}',${i},'name',this.value)" style="flex:2;min-width:150px;font-size:12px">
      ${isMaterial ? `
      <span style="font-size:11px;white-space:nowrap;color:var(--text-secondary)">ราคาต่อหน่วย:</span>
      <input class="form-input" type="text" inputmode="decimal" value="${esc(p.cost)}" onchange="App.setArrayItem('${arrKey}',${i},'cost',this.value)" style="width:80px;font-size:12px;text-align:center;font-weight:600" placeholder="0.00">
      <label class="checkbox-label" style="font-size:11px;white-space:nowrap"><input type="checkbox" ${chk(p.fixed_qty)} onchange="App.setArrayItem('${arrKey}',${i},'fixed_qty',this.checked)"> <i class="fas fa-lock" style="font-size:9px"></i> จำนวนคงที่</label>
      <input class="form-input" type="text" inputmode="numeric" value="${esc(p.qty)}" onchange="App.setArrayItem('${arrKey}',${i},'qty',this.value)" style="width:80px;font-size:12px;text-align:center;font-weight:600" placeholder="จำนวน">
      ` : `
      <label class="checkbox-label" style="font-size:11px;white-space:nowrap"><input type="checkbox" ${chk(p.fixed_price)} onchange="App.setArrayItem('${arrKey}',${i},'fixed_price',this.checked)"> <i class="fas fa-tag" style="font-size:9px"></i> ราคาต่อหน่วยคงที่:</label>
      <input class="form-input ${(!p.cost || parseFloat(p.cost) <= 0) && p.name ? 'input-missing' : ''}" type="text" inputmode="decimal" value="${esc(p.cost)}" onchange="App.setArrayItem('${arrKey}',${i},'cost',this.value)" style="width:80px;font-size:12px;text-align:center;font-weight:600" placeholder="0.00" title="${(!p.cost || parseFloat(p.cost) <= 0) && p.name ? 'กรุณาใส่ราคา — process นี้ยังไม่ได้กำหนด' : ''}">
      <span style="font-size:10px;color:var(--text-muted)">${p.fixed_price ? '× จำนวนชิ้น' : 'เหมา (ไม่คูณจำนวน)'}</span>
      `}
    </div>`).join('')}
  </div>`;
}

// Render prominent warning banner for missing fields
function renderMissingFieldsBanner() {
  // Use cached missing fields — only re-check when explicitly triggered, NOT every render
  // This prevents cascading re-renders that cause input focus loss
  const missing = State._missingFields;
  if (!missing || missing.length === 0) return '';
  // Don't show banner if form hasn't been touched yet (new blank form)
  if (!State._formTouched) return '';

  const items = missing.map(m =>
    `<div style="display:flex;align-items:center;gap:6px;padding:3px 0">
      <i class="fas fa-exclamation-circle" style="color:var(--warning-subtext, #dc2626);font-size:13px;flex-shrink:0"></i>
      <span>${m.label}</span>
    </div>`
  ).join('');

  return `<div class="missing-banner" style="background:var(--warning-bg, linear-gradient(135deg,#fef2f2,#fff1f2));border:2px solid var(--warning-border, #fca5a5);border-radius:12px;padding:14px 18px;margin-bottom:10px;box-shadow:0 2px 8px rgba(220,38,38,0.15)">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <div style="background:#dc2626;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;animation:pulse 2s infinite">
        <i class="fas fa-bell"></i>
      </div>
      <div>
        <div style="font-weight:700;font-size:14px;color:var(--warning-heading, #991b1b)">Pornchai AI แจ้งเตือน: ข้อมูลยังไม่ครบ ${missing.length} รายการ</div>
        <div style="font-size:11px;color:var(--warning-subtext, #b91c1c);margin-top:1px">กรุณาตรวจสอบและกรอกข้อมูลที่ขาดหายก่อนบันทึก</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:2px 16px;font-size:12px;color:var(--warning-text, #7f1d1d);padding-left:38px">
      ${items}
    </div>
  </div>
  <style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}</style>`;
}

function renderForm() {
  const f = State.form;
  if (!f) return;
  // Save scroll position before re-render
  const formEl = $('formContent');
  const viewEl = formEl?.closest('.view');
  const scrollTop = viewEl?.scrollTop || 0;

  const chk = (v) => v ? 'checked' : '';
  const sel = (a, b) => String(a) === String(b) ? 'selected' : '';
  const today = new Date().toLocaleDateString('en-GB', {day:'2-digit',month:'2-digit',year:'numeric'});

  let h = `

  <!-- AI Assistant Banner -->
  <div onclick="App.toggleChat()" style="display:flex;align-items:center;gap:14px;padding:12px 18px;margin-bottom:10px;background:linear-gradient(135deg,#2d1b4e 0%,#5b2d8e 40%,#7b4db8 100%);border-radius:14px;cursor:pointer;transition:all 0.3s;box-shadow:0 4px 16px rgba(91,45,142,0.35),inset 0 1px 0 rgba(255,255,255,0.1)" onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 20px rgba(91,45,142,0.45),inset 0 1px 0 rgba(255,255,255,0.1)'" onmouseout="this.style.transform='';this.style.boxShadow='0 4px 16px rgba(91,45,142,0.35),inset 0 1px 0 rgba(255,255,255,0.1)'">
    <div style="flex-shrink:0;width:52px;height:52px">${PORNCHAI_RFQ_SVG}</div>
    <div style="flex:1;min-width:0">
      <div style="color:#fff;font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px">Pornchai AI Agent <span style="font-size:10px;background:rgba(56,189,248,0.3);color:#7dd3fc;padding:2px 10px;border-radius:10px;border:1px solid rgba(56,189,248,0.3)"><i class="fas fa-circle" style="font-size:6px;color:#4ade80;margin-right:4px"></i>Online</span></div>
      <div style="color:rgba(255,255,255,0.75);font-size:12px;margin-top:3px">ส่งข้อมูลงานหรือ spec มาได้เลย - จะช่วยกรอกแบบฟอร์มให้อัตโนมัติ</div>
    </div>
    <div style="color:rgba(255,255,255,0.5);font-size:22px;transition:color 0.2s"><i class="fas fa-comment-dots"></i></div>
  </div>

  <!-- Missing Fields Warning Banner -->
  ${renderMissingFieldsBanner()}

  <!-- ===== SECTION 1: ข้อมูล Job (Job Header) ===== -->
  <div class="form-section" id="secJobHeader">
    <div class="form-section-header" onclick="toggleSection('secJobHeader')">
      <span><i class="fas fa-id-card"></i> 1. ข้อมูล Job (Job Header)</span>
      <i class="fas fa-chevron-down chevron"></i>
    </div>
    <div class="form-section-body">
  <!-- Info Bar -->
  <div style="font-size:12px;color:var(--text-muted);padding:4px 0">
    <div>Last Updated : ${esc(f.last_updated) || '-'}</div>
    <div class="rfq-info-flex">
      <span>Ref Copy. ID ${esc(f.ref_copy_id) || '-'}</span>
      <span>Created By ${esc(f.created_by || f.estimator.emp_name || f.ae.emp_name) || '-'}</span>
      <span>Date <input class="form-input-inline" type="text" value="${today}" readonly style="width:100px;text-align:center"></span>
      <span>Document Status <span class="form-input-inline" style="display:inline-block;min-width:80px;background:var(--readonly-bg, #f0f0f0);cursor:default">${esc(f.doc_status) || 'Draft'}</span></span>
    </div>
  </div>
  <hr style="margin:6px 0;border-color:var(--border-color)">

  <!-- Job Info -->
  <div id="secJob" style="padding:4px 0">
    <!-- Row: RFQ ID | AE Name* | Estimator | Request for approve -->
    <div class="rfq-grid-job">
      <div><label style="font-size:11px">RFQ ID</label><input class="form-input" value="${esc(f.formEditId || '')}" disabled style="background:var(--readonly-bg, #eee);width:100%"></div>
      <div class="autocomplete-wrap"><label style="font-size:11px">AE Name<span class="required">*</span></label>
        <input class="form-input ${aiClass('ae')}" id="acAE" value="${esc(f.ae.emp_name)}" oninput="App.acSearch('employee', this.value, 'acAEList')">
        <div class="autocomplete-list" id="acAEList"></div>
      </div>
      <div><label style="font-size:11px">Estimator</label>
        <input class="form-input" id="acEstimator" value="${esc(f.estimator.emp_name)}" readonly style="background:var(--readonly-bg, #eee);cursor:default">
      </div>
      <label class="checkbox-label" style="padding-bottom:6px;white-space:nowrap"><input type="checkbox" ${chk(f.request_approve)} onchange="App.setField('request_approve',this.checked)"> Request for approve</label>
    </div>
    <!-- Row: Job Name* -->
    <div class="rfq-grid-jobname">
      <label style="font-size:12px;font-weight:600">Job Name<span class="required">*</span></label>
      <input class="form-input ${aiClass('job_name')}" value="${esc(f.job_name)}" oninput="App.setField('job_name', this.value)">
    </div>
    <!-- Row: Customer* | ลูกค้าใหม่ | Credit Term -->
    <div class="rfq-grid-customer">
      <label style="font-size:12px;font-weight:600">Customer<span class="required">*</span></label>
      <div class="autocomplete-wrap">
        <input class="form-input ${aiClass('customer')}" id="acCustomer" value="${esc(f.customer.customer_name)}" oninput="App.acSearch('customer', this.value, 'acCustomerList')" ${f.new_customer ? 'readonly style="background:var(--readonly-bg, #eee)"' : ''}>
        <div class="autocomplete-list" id="acCustomerList"></div>
      </div>
      <label class="checkbox-label" style="white-space:nowrap"><input type="checkbox" ${chk(f.new_customer)} onchange="App.setField('new_customer',this.checked)"> ลูกค้าใหม่</label>
      <span style="font-size:12px;color:var(--text-muted);white-space:nowrap">Credit Term : ${esc(f.credit_term) || '-- ไม่พบข้อมูล --'}</span>
    </div>
    <!-- Row: งานมีหลาย F -->
    <div style="margin-bottom:8px;padding:4px 0;border-top:1px solid var(--border-color);border-bottom:1px solid var(--border-color)">
      <label class="checkbox-label" style="font-weight:500"><input type="checkbox" ${chk(f.has_multi_f)} onchange="App.setField('has_multi_f',this.checked)"> งานมีหลาย F</label>
    </div>
  </div>
    </div>
  </div>

  <!-- ===== SECTION 2: จำนวน (Quantity) ===== -->
  <div class="form-section" id="secQtySec">
    <div class="form-section-header" onclick="toggleSection('secQtySec')">
      <span><i class="fas fa-list-ol"></i> 2. จำนวน (Quantity)</span>
      <i class="fas fa-chevron-down chevron"></i>
    </div>
    <div class="form-section-body">
  <!-- Quantity (flat - matching original) -->
  <div id="secQty" style="padding:4px 0">
      ${!f.has_multi_f ? `
      <!-- Normal Qty Mode -->
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <button class="btn btn-secondary" onclick="App.addFQty()" style="font-size:12px"><i class="fas fa-plus"></i> เพิ่ม จำนวนยอด (Quantity)</button>
        ${f.qty.length > 1 ? `<button class="btn btn-danger" onclick="App.removeFQty()" style="font-size:12px"><i class="fas fa-minus"></i> ลด จำนวนยอด (Quantity)</button>` : ''}
      </div>
      <div class="qty-table-wrap">
      <!-- Quantity row -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;font-size:13px">
        <label style="font-weight:600;white-space:nowrap;width:90px;margin:0">Quantity<span class="required">*</span></label>
        ${f.qty.map((q,i) => `<input class="form-input ${aiClass('qty.'+i)}" type="number" value="${esc(q)}" oninput="App.setQty(${i}, this.value)" style="width:110px;text-align:center;font-weight:600">`).join('')}
      </div>
      <!-- Run-On row -->
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px">
        <label style="font-weight:600;white-space:nowrap;width:90px;margin:0">Run-On</label>
        <div style="display:inline-flex;gap:4px;align-items:center;width:110px">
          <input class="form-input" type="text" inputmode="numeric" value="${esc(f.run_on_percent)}" onchange="App.setField('run_on_percent',this.value)" placeholder="0" style="width:48px;text-align:center;font-weight:600">
          <span style="color:var(--text-muted);font-size:11px">%</span>
          <input class="form-input" type="text" inputmode="numeric" value="${esc(f.run_on_values[0] || '')}" data-runon="0" onchange="App.setRunOnValue(0, this.value)" style="width:52px;text-align:center;font-weight:600">
        </div>
        ${f.qty.slice(1).map((_,i) => `<input class="form-input" type="number" value="${esc(f.run_on_values[i+1] || '')}" data-runon="${i+1}" oninput="App.setRunOnValue(${i+1}, this.value)" style="width:110px;text-align:center;font-weight:600">`).join('')}
      </div>
      </div>
      <!-- AE Qty + Customer Qty (flex layout — เรียงตรงกับ Quantity/Run-On) -->
      <div style="display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap;font-size:13px">
        <label style="font-weight:600;white-space:nowrap;width:90px;margin:0">AE Qty</label>
        <input class="form-input" type="text" inputmode="numeric" value="${esc(f.ae_qty)}" onchange="App.setField('ae_qty',this.value)" style="width:110px;text-align:center;font-weight:600">
        <label style="font-weight:600;white-space:nowrap;margin:0 0 0 18px">Customer Qty</label>
        <input class="form-input" type="text" inputmode="numeric" value="${esc(f.customer_qty)}" onchange="App.setField('customer_qty',this.value)" style="width:110px;text-align:center;font-weight:600">
      </div>
      ` : `
      <!-- Multi-F Qty Mode — Qty รวมคำนวณจาก F-cards อัตโนมัติ -->
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <button class="btn btn-secondary" onclick="App.addFCard()" style="font-size:12px"><i class="fas fa-plus"></i> เพิ่ม จำนวน F</button>
        ${f.f_data.length > 1 ? `<button class="btn btn-danger" onclick="App.removeFCard()" style="font-size:12px"><i class="fas fa-minus"></i> ลด จำนวน F</button>` : ''}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${f.f_data.map((fd,fi) => `
        <div style="border:2px dashed var(--border-color);border-radius:8px;padding:10px;min-width:180px;flex:1;max-width:240px;background:var(--bg-input)">
          <input class="form-input" value="${esc(fd.f_code)}" oninput="App.setFData(${fi},'f_code',this.value)" placeholder="F Code" style="margin-bottom:6px;font-weight:600">
          ${fd.colors_out ? `<div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;display:flex;align-items:center;gap:4px">
            <i class="fas fa-palette" style="color:var(--accent);font-size:10px"></i>
            <span style="font-weight:600">${fd.colors_out}/${fd.colors_in || '0'}</span> <span style="color:var(--text-muted)">สี</span>
          </div>` : ''}
          <div class="form-group" style="margin-bottom:4px"><label style="font-size:11px;color:var(--accent)">Quantity*</label>
            <input class="form-input" type="number" value="${esc(fd.qty)}" oninput="App.setFData(${fi},'qty',this.value)">
          </div>
          <div style="display:flex;gap:4px;margin-bottom:4px">
            <div class="form-group" style="flex:1"><label style="font-size:10px">Run-On %</label>
              <input class="form-input" type="number" value="${esc(fd.run_on_percent)}" oninput="App.setFData(${fi},'run_on_percent',this.value)" style="font-size:11px">
            </div>
            <div class="form-group" style="flex:1"><label style="font-size:10px">Run-On</label>
              <input class="form-input" type="number" value="${esc(fd.run_on_value)}" oninput="App.setFData(${fi},'run_on_value',this.value)" style="font-size:11px">
            </div>
          </div>
          <div style="display:flex;gap:4px;margin-bottom:4px">
            <div class="form-group" style="flex:1"><label style="font-size:10px">AE Qty</label>
              <input class="form-input" type="number" value="${esc(fd.ae_qty)}" oninput="App.setFData(${fi},'ae_qty',this.value)" style="font-size:11px">
            </div>
            <div class="form-group" style="flex:1"><label style="font-size:10px">Customer Qty</label>
              <input class="form-input" type="number" value="${esc(fd.customer_qty)}" oninput="App.setFData(${fi},'customer_qty',this.value)" style="font-size:11px">
            </div>
          </div>
          <label class="checkbox-label" style="font-size:11px"><input type="checkbox" ${chk(fd.color_limit)} onchange="App.setFData(${fi},'color_limit',this.checked)"> ลิมิตสี</label>
          ${fd.color_limit ? `<input class="form-input" type="number" value="${esc(fd.color_limit_qty)}" oninput="App.setFData(${fi},'color_limit_qty',this.value)" placeholder="" style="width:80px;font-size:11px;margin-top:2px">` : ''}
        </div>
        `).join('')}
      </div>
      <div style="margin-top:8px;font-weight:600;font-size:13px">Total Qty: <span class="f-total-qty" style="color:var(--accent)">${num(f.f_total_qty)}</span></div>
      `}
    </div>
  </div>
    </div>
  </div>

  <!-- ===== SECTION 3: รายละเอียดงาน (Job Detail) ===== -->
  <div class="form-section" id="secSettings">
    <div class="form-section-header" onclick="toggleSection('secSettings')">
      <span><i class="fas fa-sliders-h"></i> 3. รายละเอียดงาน (Job Detail)</span>
      <i class="fas fa-chevron-down chevron"></i>
    </div>
    <div class="form-section-body">
      ${(() => {
        // Auto-select machine into dropdown when machine_id is empty
        let autoMachineId = '';
        if (!f.machine_id && typeof CalcEngine !== 'undefined' && f.components && f.components[0]?.box_type?.type_id) {
          const autoM = CalcEngine.selectMachine(f.components[0], f.print_type || 'Offset');
          if (autoM) {
            autoMachineId = autoM.id;
          } else {
            // Try other print types
            for (const pt of ['Offset','Flexo','JetPress','Konica']) {
              const m2 = CalcEngine.selectMachine(f.components[0], pt);
              if (m2) { autoMachineId = m2.id; break; }
            }
          }
        }
        const machineVal = f.machine_id || autoMachineId;
        return `
      <!-- Row 1: Dropdowns -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;align-items:end">
        <div class="form-group">
          <label>ประเภทงาน</label>
          <select class="form-input" onchange="App.setField('job_type',this.value)">
            <option value="new" ${sel(f.job_type,'new')}>งานใหม่</option>
            <option value="repeat" ${sel(f.job_type,'repeat')}>งาน Reprint</option>
          </select>
        </div>
        <div class="form-group">
          <label>ประเภทหมึก</label>
          <select class="form-input" onchange="App.setField('ink_type',this.value)">
            <option value="conventional" ${sel(f.ink_type,'conventional')}>ธรรมดา (Conventional)</option>
            <option value="UV" ${sel(f.ink_type,'UV')}>UV</option>
          </select>
        </div>
        <div class="form-group">
          <label>ประเภทพิมพ์</label>
          <select class="form-input" onchange="App.setField('print_type',this.value)">
            <option value="Offset" ${sel(f.print_type,'Offset')}>Offset</option>
            <option value="Flexo" ${sel(f.print_type,'Flexo')}>Flexo</option>
            <option value="JetPress" ${sel(f.print_type,'JetPress')}>Jet Press</option>
            <option value="Konica" ${sel(f.print_type,'Konica')}>Konica</option>
          </select>
        </div>
        <div class="form-group">
          <label>เครื่องพิมพ์</label>
          <select class="form-input" onchange="App.setField('machine_id',this.value)">
            <option value="">-- Auto --</option>
            ${(typeof CalcEngine !== 'undefined' ? CalcEngine.getAllMachines() : []).map(m =>
              '<option value="' + m.id + '" ' + sel(machineVal, m.id) + '>' + m.name + '</option>'
            ).join('')}
          </select>
        </div>
        ${f.print_type === 'Flexo' ? '<div class="form-group"><label>Flexo Size</label><input class="form-input" value="' + esc(f.flexo_size) + '" oninput="App.setField(\'flexo_size\',this.value)"></div>' : ''}
      </div>
      <!-- Row 2: Checkboxes -->
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:8px;padding:0 2px">
        <label class="checkbox-label" style="font-size:12px;display:inline-flex;align-items:center;gap:6px"><input type="checkbox" ${chk(f.limit_color)} onchange="App.setField('limit_color',this.checked)"> ลิมิตสี</label>
        ${f.limit_color ? `<span style="display:inline-flex;align-items:center;gap:4px;margin-left:-10px"><input class="form-input" type="text" inputmode="numeric" value="${esc(f.limit_color_qty)}" onchange="App.setField('limit_color_qty',this.value)" style="width:50px;text-align:center;font-size:13px;font-weight:600;padding:4px 6px !important;border-radius:4px !important;height:28px !important"><span style="font-size:12px;color:var(--text-secondary)">เล่ม</span></span>` : ''}
        <label class="checkbox-label" style="font-size:12px;opacity:0.45;cursor:not-allowed" title="ยกเลิกใช้งาน ตั้งแต่ 03/01/2025"><input type="checkbox" ${chk(f.profit_sharing)} disabled> Profit Sharing</label>
        ${(f.job_type === 'repeat' || f.job_type === 'modify') ? '<label class="checkbox-label" style="font-size:12px"><input type="checkbox" ' + (f.is_use_previous_plate ? 'checked' : '') + ' onchange="App.setField(\'is_use_previous_plate\',this.checked)"> ใช้ Plate เก่า</label>' : ''}
      </div>`;
      })()}
      <!-- Tax/Currency hidden - ใช้ค่า default: VAT 7%, THB, rate 1 -->
    </div>
  </div>

  <!-- ===== SECTION 4: Component (ชิ้นส่วนกล่อง) ===== -->
  <div class="form-section" id="secCompSec">
    <div class="form-section-header" onclick="toggleSection('secCompSec')">
      <span><i class="fas fa-cube"></i> 4. Component (ชิ้นส่วนกล่อง)</span>
      <i class="fas fa-chevron-down chevron"></i>
    </div>
    <div class="form-section-body">
  <!-- Buttons: เพิ่ม / ลด ชิ้นส่วน (Component) -->
  <div style="display:flex;gap:8px;margin:8px 0">
    <button class="btn btn-secondary" onclick="App.addComponent()" style="font-size:12px"><i class="fas fa-plus"></i> เพิ่ม ชิ้นส่วน (Component)</button>
    ${f.components.length > 1 ? `<button class="btn btn-danger" onclick="App.removeComponent(${f.components.length - 1})" style="font-size:12px"><i class="fas fa-minus"></i> ลด ชิ้นส่วน (Component)</button>` : ''}
  </div>

  <!-- Components (flat - matching original) -->
  <div id="secComp">
    ${f.components.map((c,i) => renderComponentItem(c, i)).join('')}
  </div>

  <!-- 7b. Packing per Component -->
  ${f.components.map((c, ci) => {
    const pkDetail = c.packing_detail || '';
    const pkItems = c.packing || [];
    const anyChecked = c._pk_kraftwrap || c._pk_paperband || c._pk_carton || c._pk_pallet;
    return `<div class="flat-row">
      <div class="flat-row-header" style="display:flex;align-items:center;gap:8px">
        <b><i class="fas fa-box-open" style="color:var(--accent)"></i> Packing :</b>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <label class="checkbox-label" style="font-size:12px"><input type="checkbox" ${c._pk_kraftwrap ? 'checked' : ''} onchange="App.togglePacking(${ci},'kraftwrap',this.checked)"> Kraftwrap</label>
          <label class="checkbox-label" style="font-size:12px"><input type="checkbox" ${c._pk_paperband ? 'checked' : ''} onchange="App.togglePacking(${ci},'paperband',this.checked)"> Paperband</label>
          <label class="checkbox-label" style="font-size:12px"><input type="checkbox" ${c._pk_carton ? 'checked' : ''} onchange="App.togglePacking(${ci},'carton',this.checked)"> Carton</label>
          <label class="checkbox-label" style="font-size:12px"><input type="checkbox" ${c._pk_pallet ? 'checked' : ''} onchange="App.togglePacking(${ci},'pallet',this.checked)"> Pallet</label>
        </div>
      </div>
      ${anyChecked && pkDetail ? `<div style="padding:6px 0;font-size:12px;color:var(--text-secondary)">
        <span style="background:var(--ai-highlight);padding:3px 10px;border-radius:6px"><i class="fas fa-info-circle" style="color:var(--accent)"></i> ${esc(pkDetail)}</span>
      </div>` : ''}
    </div>`;
  }).join('')}

    </div>
  </div>

  <!-- ===== SECTION 5: Process / Material / Other ===== -->
  <div class="form-section" id="secProcSec">
    <div class="form-section-header" onclick="toggleSection('secProcSec')">
      <span><i class="fas fa-cogs"></i> 5. Process / Material / Other</span>
      <i class="fas fa-chevron-down chevron"></i>
    </div>
    <div class="form-section-body">
  <!-- Other Process (flat row - matching original) -->
  ${renderFlatProcessRow('Other Process:', 'other_process', f.other_process)}
  ${renderFlatProcessRow('Handwork Process:', 'handwork_process', f.handwork_process)}
  ${renderFlatProcessRow('จัดจ้าง :', 'outsource', f.outsource)}
  ${renderFlatProcessRow('Materials:', 'materials', f.materials)}
  ${renderFlatProcessRow('Other:', 'other_items', f.other_items)}

  <!-- 9. Attach File (flat row) -->
  <div class="flat-row">
    <div class="flat-row-header"><b>Attach File :</b> ${f.attach_files.length < 10 ? `<button class="btn btn-secondary" onclick="App.addAttachSlot()" style="font-size:11px;padding:2px 8px"><i class="fas fa-plus"></i> เพิ่ม</button>` : ''} <span style="font-size:10px;color:var(--text-muted)">${f.attach_files.length}/10</span></div>
    ${f.attach_files.map((af,i) => `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border-color)">
      ${af.name ? `
        <span style="font-size:12px;flex:1"><i class="fas fa-paperclip" style="color:var(--accent);margin-right:4px"></i>${esc(af.name)}</span>
        <button onclick="App.previewFile(${i})" style="background:none;border:1px solid var(--accent);color:var(--accent);border-radius:4px;padding:3px 8px;cursor:pointer;font-size:12px" title="ดูไฟล์"><i class="fas fa-eye"></i></button>
        <button onclick="App.removeArrayItem('attach_files',${i})" style="background:none;border:1px solid #dc3545;color:#dc3545;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:12px" title="ลบ"><i class="fas fa-trash"></i></button>
      ` : `
        <label style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border:1px solid var(--accent);border-radius:6px;cursor:pointer;font-size:12px;color:var(--accent);transition:all 0.2s" onmouseover="this.style.background='var(--accent)';this.style.color='#fff'" onmouseout="this.style.background='';this.style.color='var(--accent)'">
          <i class="fas fa-upload"></i> เลือกไฟล์
          <input type="file" accept=".pdf,.doc,.docx,.txt,.xlsx,.jpg,.png,.jpeg,.gif" onchange="App.onFileSelected(${i},this)" style="display:none">
        </label>
        <button onclick="App.removeArrayItem('attach_files',${i})" style="background:none;border:1px solid #dc3545;color:#dc3545;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:12px" title="ลบ"><i class="fas fa-trash"></i></button>
      `}
    </div>`).join('')}
  </div>

    </div>
  </div>

  <!-- ===== SECTION 6: Delivery ===== -->
  ${(() => {
    const dl0 = f.delivery[0] || {};
    return `
  <div class="form-section" style="border:1px solid var(--border-color);border-radius:8px;padding:12px 16px;margin-bottom:8px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <h4 style="margin:0;font-size:14px;font-weight:700;color:var(--text-primary)"><i class="fas fa-truck" style="color:var(--accent);margin-right:6px"></i>6. Delivery</h4>
      <label class="checkbox-label" style="margin:0;font-size:12px"><input type="checkbox" ${chk(dl0.split_delivery)} onchange="App.toggleSplitDelivery(this.checked)"> <i class="fas fa-code-branch"></i> แบ่งส่ง</label>
    </div>

    ${!dl0.split_delivery ? `
    <div class="rfq-grid-delivery" style="max-width:500px">
      <div class="form-group" style="margin:0">
        <label style="font-size:11px;font-weight:600">จังหวัด</label>
        <input class="form-input" type="text" value="${esc(dl0.destinationName || '')}" placeholder="พิมพ์ชื่อจังหวัด..."
          onfocus="App.showDelivDropdown(0,this)"
          oninput="App.filterDelivDropdown(0,this)"
          onblur="setTimeout(()=>App.hideDelivDropdown(0),200)">
      </div>
      <div class="form-group" style="margin:0">
        <label style="font-size:11px;font-weight:600">วันที่ส่ง</label>
        <input class="form-input" type="date" value="${esc(dl0.dueDate || '')}" onchange="App.onDelivDatePick(0,this.value)" style="min-width:140px">
      </div>
    </div>` : `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <button onclick="App.addDeliveryRound()" class="btn btn-secondary" style="font-size:11px;padding:4px 12px"><i class="fas fa-plus"></i> เพิ่ม</button>
      <span style="font-size:11px;color:var(--text-muted)">${f.delivery.length} รอบ</span>
    </div>
    ${(() => {
      const isMultiF = f.has_multi_f && f.f_data && f.f_data.length > 1;
      const fOpts = isMultiF ? f.f_data.map(fd => fd.f_code).filter(c => c) : [];
      return `<div style="display:flex;flex-direction:column;gap:8px">
      ${(f.delivery || []).map((dl, di) => `
      <div class="rfq-grid-delivery-split" onmouseenter="this.style.borderColor='var(--accent)';this.style.boxShadow='0 2px 8px rgba(91,45,142,0.08)'" onmouseleave="this.style.borderColor='var(--border-color)';this.style.boxShadow=''">
        <span style="background:var(--accent);color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">${di+1}</span>
        ${isMultiF ? `<select class="form-input" style="flex:0 1 100px;min-width:80px;font-size:12px;font-weight:600" onchange="App.setDelivField(${di},'f_code',this.value)">
            <option value="">-</option>
            ${fOpts.map(fc => `<option value="${esc(fc)}"${fc === (dl.f_code||'') ? ' selected' : ''}>${esc(fc)}</option>`).join('')}
          </select>` : ''}
        <input class="form-input" type="number" value="${esc(dl.qty || '')}" oninput="App.setDelivField(${di},'qty',this.value)" placeholder="0" style="flex:0 1 100px;min-width:70px;font-size:13px;font-weight:700">
        <input class="form-input" type="text" value="${esc(dl.destinationName || '')}" placeholder="พิมพ์ชื่อจังหวัด..." style="font-size:12px;flex:1 1 150px;min-width:120px"
          onfocus="App.showDelivDropdown(${di},this)"
          oninput="App.filterDelivDropdown(${di},this)"
          onblur="setTimeout(()=>App.hideDelivDropdown(${di}),200)">
        <input class="form-input" type="date" value="${esc(dl.dueDate || '')}" onchange="App.onDelivDatePick(${di},this.value)" style="font-size:12px;flex:0 1 150px;min-width:130px">
        ${f.delivery.length > 1 ? `<button onclick="App.removeDeliveryRound(${di})" style="flex-shrink:0;width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(220,53,69,0.25);background:none;color:#dc3545;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all 0.2s" onmouseenter="this.style.background='#dc3545';this.style.color='#fff';this.style.borderColor='#dc3545'" onmouseleave="this.style.background='none';this.style.color='#dc3545';this.style.borderColor='rgba(220,53,69,0.25)'" title="ลบรอบส่งนี้"><i class="fas fa-trash-alt"></i></button>` : '<div style="width:36px;flex-shrink:0"></div>'}
      </div>`).join('')}
    </div>`;
    })()}`}
  </div>`;
  })()}

  <!-- ===== SECTION 7: Adjustments (ส่วนต่าง / ของขวัญ) ===== -->
  <div class="form-section" id="secAdjSec">
    <div class="form-section-header" onclick="toggleSection('secAdjSec')">
      <span><i class="fas fa-sliders-h"></i> 7. Adjustments (ส่วนต่าง / ของขวัญ)</span>
      <i class="fas fa-chevron-down chevron"></i>
    </div>
    <div class="form-section-body">
  <!-- ส่วนต่างลูกค้า -->
  <div style="display:flex;align-items:center;gap:8px;padding:6px 12px;margin-bottom:4px">
    <label class="checkbox-label" style="font-weight:600;white-space:nowrap"><input type="checkbox" ${chk(f.customer_margin)} onchange="App.setField('customer_margin',this.checked)"> ส่วนต่างลูกค้า(บาท/หน่วย) :</label>
    ${f.customer_margin ? `<input class="form-input" type="number" step="0.01" value="${esc(f.customer_margin_value)}" oninput="App.setField('customer_margin_value',this.value)" style="width:clamp(80px,15vw,120px)">` : ''}
  </div>

  <!-- 12. ของขวัญลูกค้า -->
  <div style="display:flex;align-items:center;gap:8px;padding:6px 12px;margin-bottom:4px">
    <label class="checkbox-label" style="font-weight:600;white-space:nowrap"><input type="checkbox" ${chk(f.has_customer_gift)} onchange="App.setField('has_customer_gift',this.checked)"> ของขวัญลูกค้า(บาท) :</label>
    ${f.has_customer_gift ? `<input class="form-input" type="number" step="0.01" value="${esc(f.customer_gift_value)}" oninput="App.setField('customer_gift_value',this.value)" style="width:clamp(80px,15vw,120px)">` : ''}
  </div>

    </div>
  </div>

  <!-- Action buttons -->
  ${(() => {
    const ms = State._missingFields || [];
    const canCalc = State._formTouched && ms.length === 0;
    const disStyle = !canCalc ? 'opacity:0.45;cursor:not-allowed;pointer-events:none' : '';
    const disTitle = !canCalc && State._formTouched ? 'title="กรุณากรอกข้อมูลให้ครบก่อนคำนวณ"' : !canCalc ? 'title="กรุณากรอกข้อมูลก่อน"' : '';
    return `<div style="text-align:center;margin:16px 0 8px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="App.calculateLayout()" style="font-size:14px;padding:10px 32px;${disStyle}" ${disTitle}><i class="fas fa-th"></i> คำนวณ Layout</button>
      ${State.layoutResults ? `<button class="btn btn-primary" onclick="App.calculatePrice()" style="font-size:14px;padding:10px 32px;background:#28a745;${disStyle}" ${disTitle}><i class="fas fa-calculator"></i> คำนวณ Price</button>` : ''}
    </div>`;
  })()}
  <div class="form-actions">
    <button class="btn btn-danger" onclick="App.cancelForm()"><i class="fas fa-times"></i> Cancel</button>
    <button class="btn btn-secondary" onclick="App.saveDraft()"><i class="fas fa-save"></i> Save Draft</button>
    <button class="btn btn-primary" onclick="App.showPreview()"><i class="fas fa-eye"></i> Preview</button>
  </div>`;

  $('formContent').innerHTML = h;
  // Restore scroll position after re-render
  if (viewEl && scrollTop > 0) requestAnimationFrame(() => { viewEl.scrollTop = scrollTop; });
  // Debounce missing fields check (don't block rendering)
  clearTimeout(State._missingCheckTimer);
  State._missingCheckTimer = setTimeout(() => {
    if (State.form && State._formTouched) {
      State._missingFields = checkMissingFields(State.form);
    }
  }, 500);
  // Real-time refresh 3D/Dieline views if active
  refreshBoxViews();
}

function renderComponentItem(c, i) {
  const chk = (v) => v ? 'checked' : '';
  const sel = (a, b) => String(a) === String(b) ? 'selected' : '';
  const p = c.paper || {};
  const clr = c.color || {};
  const sz = c.packaging_size || {};

  // paper_sub_codes built from paper_info DB (loaded at startup)

  // Build box template options from master data
  const btOpts = (State.masters.boxtemplate_info || []).map(bt =>
    `<option value="${bt.type_id}" ${sel(c.box_type.type_id, bt.type_id)}>${bt.type_name_th || bt.type_name}</option>`
  ).join('');

  return `<div class="array-item component-item">

    <!-- 7a. Component header (name + type dropdown + delete) -->
    <div class="array-item-header"><span>Component ที่ ${i+1}</span>
      ${State.form.components.length > 1 ? `<button class="array-item-remove" onclick="App.removeComponent(${i})"><i class="fas fa-times"></i></button>` : ''}
    </div>
    <div class="form-row three-col">
      <div class="form-group">
        <input class="form-input ${aiClass('comp.'+i+'.name')}${!c.component_name?.trim() ? ' input-missing' : ''}" value="${esc(c.component_name)}" oninput="App.setComp(${i},'component_name',this.value)" placeholder="เช่น box, lid, sleeve..." required>
      </div>
      <div class="form-group">
        <select class="form-input" onchange="App.setComp(${i},'component_type',parseInt(this.value))">
          <option value="1" ${c.component_type===1?'selected':''}>ไม่ประกบลูกฟูก</option>
          <option value="2" ${c.component_type===2?'selected':''}>ประกบลูกฟูก</option>
          <option value="3" ${c.component_type===3?'selected':''}>เฉพาะลูกฟูก</option>
        </select>
      </div>
      <div class="form-group">
        <button class="btn btn-danger btn-sm" style="padding:6px 12px;font-size:12px" onclick="App.removeComponent(${i})"><i class="fas fa-trash"></i> ลบ</button>
      </div>
    </div>

    <!-- 7b. สี และสีพิเศษ -->
    <div class="comp-sub-section">
      <div class="comp-sub-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span>สี และสีพิเศษ</span>
      </div>
      ${(() => {
        // === Multi-F: Per-F color cards (เหมือนระบบเก่า) ===
        if (State.form.has_multi_f && State.form.f_data?.length > 0) {
          // Auto-init _color_per_f from f_data (use colors_out/colors_in from f_data)
          if (!c._color_per_f || c._color_per_f.length !== State.form.f_data.length) {
            c._color_per_f = State.form.f_data.map(fd => {
              const existing = (c._color_per_f || []).find(cp => cp.f_code === fd.f_code);
              if (existing) return existing;
              return {
                f_code: fd.f_code || '',
                outside: fd.colors_out != null && fd.colors_out !== '' ? String(fd.colors_out) : (clr.outside || ''),
                inside: fd.colors_in != null && fd.colors_in !== '' ? String(fd.colors_in) : (clr.inside || '0'),
                is_special_ink: false,
                special_ink: [],
              };
            });
          }
          // CSS for consistent card layout
          const CS = 'padding:4px 6px !important;border-radius:4px !important;height:28px !important';
          // Responsive grid — wraps on narrow screens, equal-width cards
          const fCount = c._color_per_f.length;
          // Max 5 per row, min-width 180px per card — wraps automatically on narrow screens
          let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:6px">';
          c._color_per_f.forEach((cf, fi) => {
            const fCode = cf.f_code || State.form.f_data[fi]?.f_code || '';
            const colorBadge = (cf.outside || '0') + '/' + (cf.inside || '0');
            html += '<div style="border:1px solid var(--border-color);border-radius:6px;padding:8px;background:var(--bg-secondary)">';
            // Header: F-code + badge
            html += '<div style="display:flex;align-items:center;gap:4px;margin-bottom:6px"><span style="font-size:12px;font-weight:700;color:var(--accent)">' + esc(fCode) + '</span><span style="font-size:9px;color:var(--text-muted);background:var(--bg-card);padding:0 5px;border-radius:6px;border:1px solid var(--border-color);white-space:nowrap">' + colorBadge + ' สี</span></div>';
            // Outside row
            html += '<div style="display:flex;align-items:center;gap:3px;margin-bottom:2px">'
              + '<span style="font-size:11px;font-weight:600;min-width:50px;text-align:right">Outside*</span>'
              + '<input class="form-input" type="text" inputmode="numeric" value="' + esc(cf.outside) + '" onchange="App.setColorPerF(' + i + ',' + fi + ',\'outside\',this.value)" style="width:36px;text-align:center;font-size:12px;font-weight:600;' + CS + '">'
              + '<span style="font-size:10px;color:var(--text-muted)">cols</span></div>';
            // Inside row
            html += '<div style="display:flex;align-items:center;gap:3px;margin-bottom:4px">'
              + '<span style="font-size:11px;font-weight:600;min-width:50px;text-align:right">Inside*</span>'
              + '<input class="form-input" type="text" inputmode="numeric" value="' + esc(cf.inside) + '" onchange="App.setColorPerF(' + i + ',' + fi + ',\'inside\',this.value)" style="width:36px;text-align:center;font-size:12px;font-weight:600;' + CS + '">'
              + '<span style="font-size:10px;color:var(--text-muted)">cols</span></div>';
            // Checkbox
            html += '<label class="checkbox-label" style="font-size:11px;display:block;border-top:1px solid var(--border-color);padding-top:4px"><input type="checkbox" ' + chk(cf.is_special_ink) + ' onchange="App.setColorPerF(' + i + ',' + fi + ',\'is_special_ink\',this.checked)"> มีสีพิเศษ</label>';
            // Special Ink — compact single row per ink
            if (cf.is_special_ink) {
              (cf.special_ink || []).forEach((ink, si) => {
                // Row 1: [ลบ] [สี input] [ชนิดหมึก▼]
                // Row 2: [ลักษณะพิมพ์▼] — or inline if fits
                // Row 1: [ลบ] [สี] [ชนิดหมึก▼]    Row 2: [ลักษณะพิมพ์▼]
                html += '<div style="margin-top:4px">'
                  + '<div style="display:flex;align-items:center;gap:2px;margin-bottom:2px">'
                  + '<button class="array-item-remove" onclick="App.removeSpecialInkPerF(' + i + ',' + fi + ',' + si + ')" style="width:22px;height:22px;font-size:9px;flex-shrink:0"><i class="fas fa-times"></i></button>'
                  + '<input class="form-input" value="' + esc(ink.ink_color) + '" oninput="App.setSpecialInkPerF(' + i + ',' + fi + ',' + si + ',\'ink_color\',this.value)" style="width:55px;font-size:10px;padding:2px 4px !important;height:24px !important;border-radius:3px !important;text-align:center;font-weight:600" placeholder="">'
                  + '<select class="form-input" onchange="App.setSpecialInkPerF(' + i + ',' + fi + ',' + si + ',\'ink_type\',this.value)" style="font-size:10px;padding:1px 2px !important;height:24px !important;border-radius:3px !important;flex:1;min-width:0;text-align:center;text-align-last:center">'
                  + '<option value="หมึกพิเศษธรรมดา"' + (ink.ink_type==='หมึกพิเศษธรรมดา'?' selected':'') + '>หมึกพิเศษธรรมดา</option>'
                  + '<option value="หมึกเมทัลลิค"' + (ink.ink_type==='หมึกเมทัลลิค'?' selected':'') + '>หมึกเมทัลลิค</option>'
                  + '<option value="หมึกสะท้อนแสง"' + (ink.ink_type==='หมึกสะท้อนแสง'?' selected':'') + '>หมึกสะท้อนแสง</option>'
                  + '<option value="หมึกกันแดด"' + (ink.ink_type==='หมึกกันแดด'?' selected':'') + '>หมึกกันแดด</option>'
                  + '<option value="หมึก UV"' + (ink.ink_type==='หมึก UV'?' selected':'') + '>หมึก UV</option></select></div>'
                  + '<div style="padding-left:28px"><select class="form-input" onchange="App.setSpecialInkPerF(' + i + ',' + fi + ',' + si + ',\'printing_style\',this.value)" style="font-size:10px;padding:1px 2px !important;height:24px !important;border-radius:3px !important;width:100%;text-align:center;text-align-last:center">'
                  + '<option value="ตีพื้น"' + (ink.printing_style==='ตีพื้น'?' selected':'') + '>ตีพื้น</option>'
                  + '<option value="ลายเส้น"' + (ink.printing_style==='ลายเส้น'?' selected':'') + '>ลายเส้น</option></select></div>'
                  + '</div>';
              });
              html += '<button class="btn btn-secondary" onclick="App.addSpecialInkPerF(' + i + ',' + fi + ')" style="font-size:9px;padding:1px 6px;margin-top:3px"><i class="fas fa-plus"></i> เพิ่ม</button>';
            }
            html += '</div>';
          });
          html += '</div>';
          return html;
        }

        // === Single-F: แสดงสีรวม 1 card (เหมือนเดิม) ===
        let singleHtml = '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;border:1px dashed var(--border-color);border-radius:6px;padding:10px">'
          + '<label class="checkbox-label" style="min-width:80px"><input type="checkbox" ' + chk(clr.is_special_ink) + ' onchange="App.setCompColor(' + i + ',\'is_special_ink\',this.checked)"> มีสีพิเศษ</label>'
          + '<div style="display:flex;flex-direction:column;gap:6px">'
          + '<div style="display:flex;align-items:center;gap:6px"><span style="font-size:12px;font-weight:600;width:68px;text-align:right">: Outside <span class="required">*</span></span>'
          + '<input class="form-input" type="text" inputmode="numeric" value="' + esc(clr.outside) + '" onchange="App.setCompColor(' + i + ',\'outside\',this.value)" style="width:55px;text-align:center;font-size:13px;font-weight:600;padding:4px 6px !important;border-radius:4px !important;height:30px !important">'
          + '<span style="font-size:12px">cols</span></div>'
          + '<div style="display:flex;align-items:center;gap:6px"><span style="font-size:12px;font-weight:600;width:68px;text-align:right">: Inside <span class="required">*</span></span>'
          + '<input class="form-input" type="text" inputmode="numeric" value="' + esc(clr.inside) + '" onchange="App.setCompColor(' + i + ',\'inside\',this.value)" style="width:55px;text-align:center;font-size:13px;font-weight:600;padding:4px 6px !important;border-radius:4px !important;height:30px !important">'
          + '<span style="font-size:12px">cols</span></div></div></div>';
        if (clr.is_special_ink) {
          singleHtml += '<div style="margin-top:10px;border:1px dashed var(--border-color);border-radius:6px;padding:10px;background:var(--bg-main)">'
            + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="font-weight:600;font-size:13px">Special Ink (สีพิเศษ)</span>'
            + '<button class="btn btn-secondary" onclick="App.addSpecialInk(' + i + ')" style="font-size:11px;padding:2px 10px"><i class="fas fa-plus"></i> เพิ่ม</button></div>'
            + '<table style="width:100%;border-collapse:separate;border-spacing:4px 4px;font-size:12px"><thead><tr style="font-weight:600;color:var(--text-muted)"><td></td><td>สี</td><td>ชนิดหมึก</td><td>ลักษณะการพิมพ์สี</td></tr></thead><tbody>';
          (clr.special_ink || []).forEach((ink, si) => {
            singleHtml += '<tr><td style="width:30px"><button class="array-item-remove" onclick="App.removeSpecialInk(' + i + ',' + si + ')" style="width:24px;height:24px;font-size:10px"><i class="fas fa-times"></i></button></td>'
              + '<td><input class="form-input" value="' + esc(ink.ink_color) + '" oninput="App.setSpecialInk(' + i + ',' + si + ',\'ink_color\',this.value)" style="font-size:12px;text-align:center;font-weight:600" placeholder=""></td>'
              + '<td style="min-width:100px"><select class="form-input" onchange="App.setSpecialInk(' + i + ',' + si + ',\'ink_type\',this.value)" style="font-size:12px;text-align:center;text-align-last:center">'
              + '<option value="หมึกพิเศษธรรมดา"' + (ink.ink_type==='หมึกพิเศษธรรมดา'||ink.ink_type==='spot'?' selected':'') + '>หมึกพิเศษธรรมดา</option>'
              + '<option value="หมึกเมทัลลิค"' + (ink.ink_type==='หมึกเมทัลลิค'||ink.ink_type==='metallic'?' selected':'') + '>หมึกเมทัลลิค</option>'
              + '<option value="หมึกสะท้อนแสง"' + (ink.ink_type==='หมึกสะท้อนแสง'?' selected':'') + '>หมึกสะท้อนแสง</option>'
              + '<option value="หมึกกันแดด"' + (ink.ink_type==='หมึกกันแดด'?' selected':'') + '>หมึกกันแดด</option>'
              + '<option value="หมึก UV"' + (ink.ink_type==='หมึก UV'?' selected':'') + '>หมึก UV</option></select></td>'
              + '<td style="min-width:90px"><select class="form-input" onchange="App.setSpecialInk(' + i + ',' + si + ',\'printing_style\',this.value)" style="font-size:12px;text-align:center;text-align-last:center">'
              + '<option value="ตีพื้น"' + (ink.printing_style==='ตีพื้น'||ink.printing_style==='solid'?' selected':'') + '>ตีพื้น</option>'
              + '<option value="ลายเส้น"' + (ink.printing_style==='ลายเส้น'?' selected':'') + '>ลายเส้น</option></select></td></tr>';
          });
          singleHtml += '</tbody></table></div>';
        }
        return singleHtml;
      })()}
    </div>

    <!-- 7c. ประเภทกระดาษ -->
    <div class="comp-sub-section">
      <div class="comp-sub-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span>ประเภทกระดาษ</span>
        <span style="font-weight:400;font-size:12px">mark-up <input class="form-input-inline" type="number" value="${esc(p.paper_markup)}" oninput="App.setCompPaper(${i},'paper_markup',this.value)" style="width:50px"> %</span>
      </div>
      <!-- Row 1: Paper* (sub-code from DB) | Gsm | ราคา/แผ่น -->
      <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin-bottom:6px">
        <div class="form-group" style="min-width:180px;flex:1"><label>Paper<span class="required">*</span></label>
          <select class="form-input" onchange="App.setCompPaper(${i},'paper_code',this.value)">
            <option value="">-select type-</option>
            ${(State.masters._paper_sub_codes || []).map(sc => '<option value="'+esc(sc.code)+'" '+sel(p.paper_code,sc.code)+'>'+esc(sc.label)+'</option>').join('')}
            ${p.paper_code && !(State.masters._paper_sub_codes || []).find(sc => sc.code === p.paper_code) ? '<option value="'+esc(p.paper_code)+'" selected>'+esc(p.paper_code)+'</option>' : ''}
          </select>
        </div>
        <div class="form-group" style="min-width:80px"><label>Gsm</label>
          <select class="form-input" onchange="App.setCompPaper(${i},'paper_gram',this.value)">
            <option value="">-Gsm-</option>
            ${(State.masters['paper_gsm_' + (p.paper_code||'')] || []).map(g => '<option value="'+g+'" '+sel(p.paper_gram,g)+'>'+g+'</option>').join('')}
            ${p.paper_gram && !(State.masters['paper_gsm_' + (p.paper_code||'')] || []).includes(String(p.paper_gram)) ? '<option value="'+esc(p.paper_gram)+'" selected>'+esc(p.paper_gram)+'</option>' : ''}
          </select>
        </div>
        <div style="display:flex;align-items:center;gap:6px;padding-bottom:4px">
          <label class="checkbox-label"><input type="checkbox" ${chk(p.paper_price_per_sheet)} onchange="App.setCompPaper(${i},'paper_price_per_sheet',this.checked)"> ราคา/แผ่น</label>
        </div>
      </div>
      <!-- Row 2: Paper Brand -->
      <div style="font-size:12px;margin-bottom:6px">Paper Brand : ${esc(p.paper_brand) || '-'}</div>
      <!-- Row 3: กระดาษ* | ตัดม้วน(บาท) -->
      <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;margin-bottom:6px">
        <div class="form-group" style="min-width:160px;flex:1"><label>กระดาษ<span class="required">*</span></label>
          <select class="form-input" onchange="App.setCompPaper(${i},'paper_name',this.value)">
            <option value="">-select-</option>
            <option value="ในประเทศ" ${sel(p.paper_name,'ในประเทศ')}>ในประเทศ</option>
            <option value="ต่างประเทศ" ${sel(p.paper_name,'ต่างประเทศ')}>ต่างประเทศ</option>
          </select>
        </div>
        <div class="form-group" style="min-width:120px"><label>ตัดม้วน(บาท)</label>
          <input class="form-input" type="number" step="0.1" value="${esc(p.paper_roll_cut)}" oninput="App.setCompPaper(${i},'paper_roll_cut',this.value)">
        </div>
      </div>
      <!-- Row 4: Cost* | Sale + B/Kg label (matching original system) -->
      <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
        <div class="form-group" style="min-width:100px;flex:1"><label>Cost<span class="required">*</span></label>
          <input class="form-input" type="number" step="0.01" value="${esc(p.paper_cost)}" oninput="App.setCompPaper(${i},'paper_cost',this.value)">
        </div>
        <div class="form-group" style="min-width:100px;flex:1"><label>Sale</label>
          <div style="display:flex;align-items:center;gap:6px">
            <input class="form-input" type="number" step="0.01" value="${esc(p.paper_sale)}" data-field="paper_sale_${i}" oninput="App.setCompPaper(${i},'paper_sale',this.value)" style="flex:1">
            <span style="font-size:12px;white-space:nowrap;color:var(--text-secondary, #666);font-weight:500">${p.paper_price_per_sheet ? 'B/Sheet' : 'B/Kg'}</span>
          </div>
        </div>
      </div>
      <!-- Warning messages -->
      <div style="margin-top:6px;font-size:11px;color:#dc3545;font-weight:500;line-height:1.6">
        * หากใช้กระดาษแบรนด์อื่น กรุณาตรวจสอบราคากับฝ่ายจัดซื้อก่อนประเมินราคา !!!<br>
        * กรณีเปิด Job กรุณาตรวจสอบ Stock กับฝ่ายจัดซื้ออีกครั้งก่อนดำเนินการ !!!
      </div>
      <!-- Paper note -->
      <div style="margin-top:6px">
        <input class="form-input" value="${esc(p.paper_note||'')}" oninput="App.setCompPaper(${i},'paper_note',this.value)" placeholder="พิมพ์รายละเอียดเพิ่มเติมที่นี่" style="font-size:12px">
      </div>
    </div>

    ${(c.component_type === 2 || c.component_type === 3) ? (() => {
      const cr = c.corrugated || {};
      const layer = parseInt(cr.layer) || 0;
      const gradeTypes = getCorrugatedGradeTypes();
      const gradeOpts = gradeTypes.map(g => `<option value="${esc(g)}">${esc(g)}</option>`).join('');
      // เช็คว่ากรอกครบหรือยัง
      const crMissing = [];
      if (!layer) crMissing.push('จำนวนชั้น');
      if (!cr.flute_type) crMissing.push('ลอน (Flute)');
      const grades = cr.grade || [];
      if (grades.filter(g => g).length === 0) crMissing.push('เกรดกระดาษ');
      const crComplete = crMissing.length === 0;
      return `
    <!-- 7c-2. ลูกฟูก (Corrugated) -->
    <div class="comp-sub-section" style="border:2px solid ${crComplete ? '#28a745' : '#e67e22'};border-radius:8px;padding:10px;background:var(--section-bg,${crComplete ? '#f0fff4' : '#fffaf3'})">
      <div class="comp-sub-title" style="color:${crComplete ? '#28a745' : '#e67e22'}"><i class="fas fa-layer-group"></i> ลูกฟูก (Corrugated)</div>
      ${!crComplete ? `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:8px 12px;background:linear-gradient(135deg,#fff8f0,#fff3e0);border-radius:8px;border:1px dashed #e67e22">
        <svg viewBox="0 0 120 120" width="32" height="32" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
          <defs><linearGradient id="crHead" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#c9a0ff"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient><linearGradient id="crBody" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#6d28d9"/></linearGradient></defs>
          <circle cx="60" cy="15" r="3" fill="#e0c3ff"><animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite"/></circle>
          <line x1="60" y1="17" x2="60" y2="28" stroke="#c9a0ff" stroke-width="2" stroke-linecap="round"/>
          <rect x="30" y="28" width="60" height="42" rx="14" fill="url(#crHead)"><animate attributeName="y" values="28;26;28" dur="3s" repeatCount="indefinite"/></rect>
          <ellipse cx="45" cy="46" rx="6" ry="6.5" fill="#1e1b4b"/><ellipse cx="75" cy="46" rx="6" ry="6.5" fill="#1e1b4b"/>
          <circle cx="45" cy="45" r="3.5" fill="#38bdf8"><animate attributeName="r" values="3.5;2.5;3.5" dur="2.5s" repeatCount="indefinite"/></circle>
          <circle cx="75" cy="45" r="3.5" fill="#38bdf8"><animate attributeName="r" values="3.5;2.5;3.5" dur="2.5s" repeatCount="indefinite"/></circle>
          <path d="M48 58 Q60 66 72 58" fill="none" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round"/>
          <rect x="21" y="40" width="8" height="14" rx="4" fill="#8b5cf6"/>
          <rect x="91" y="40" width="8" height="14" rx="4" fill="#8b5cf6"/>
          <rect x="38" y="72" width="44" height="26" rx="10" fill="url(#crBody)"/>
          <circle cx="60" cy="83" r="4" fill="#38bdf8"><animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite"/></circle>
        </svg>
        <div style="font-size:12px;color:#e67e22;font-weight:500;line-height:1.5">
          <strong>Pornchai AI:</strong> อย่าลืมกรอกข้อมูลลูกฟูกนะครับ!
          <span style="color:#856404">ยังขาด: ${crMissing.join(', ')}</span>
        </div>
      </div>` : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">
        <div class="form-group" style="min-width:80px">
          <label>จำนวนชั้น</label>
          <select class="form-input" onchange="App.setCorrugated(${i},'layer',parseInt(this.value));App.renderForm()">
            <option value="" ${!layer||layer===0?'selected':''}>-เลือก-</option>
            <option value="2" ${layer===2?'selected':''}>2</option>
            <option value="3" ${layer===3?'selected':''}>3</option>
            <option value="5" ${layer===5?'selected':''}>5</option>
          </select>
        </div>
        <div class="form-group" style="min-width:80px">
          <label>ลอน (Flute)${!cr.flute_type ? '<span class="required">*</span>' : ''}</label>
          <select class="form-input" style="${!cr.flute_type ? 'border-color:#e67e22' : ''}" onchange="App.setCorrugated(${i},'flute_type',this.value);App.renderForm()">
            <option value="">-เลือก-</option>
            ${getCorrugatedFluteOpts(cr.flute_type || '')}
          </select>
        </div>
      </div>
      <div style="margin-top:8px;padding:8px;background:var(--bg-secondary,#f8f9fa);border-radius:6px">
        <div style="font-size:11px;font-weight:600;margin-bottom:6px;color:var(--text-secondary)">Grade</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end">
        ${Array.from({length: layer}, (_, gi) => {
          const gradeVal = (cr.grade||[])[gi] || '';
          const gramVal = (cr.gram||[])[gi] || '';
          // ดึง gram options จาก master data ตาม grade
          const corrDB = State.masters['corrugated_info'] || [];
          const gramOpts = gradeVal ? [...new Set(corrDB.filter(r => {
            const matchFlute = !cr.flute_type || r.flute_type === cr.flute_type;
            const matchLayer = !layer || r.num_layer === layer;
            return matchFlute && matchLayer && (r['type_'+(gi+1)] === gradeVal);
          }).map(r => r['gram_'+(gi+1)]).filter(Boolean))].sort((a,b)=>a-b) : [];
          return `
          <div style="display:flex;flex-direction:column;gap:2px;min-width:80px">
            <select class="form-input" style="font-size:11px;${!gradeVal ? 'border-color:#e67e22' : ''}" onchange="var g=JSON.parse(JSON.stringify(App.getState().form.components[${i}].corrugated.grade||['','','','','']));g[${gi}]=this.value;App.setCorrugated(${i},'grade',g);App.renderForm()">
              <option value="">-เลือก-</option>
              ${gradeOpts.replace(new RegExp('value="'+esc(gradeVal)+'"'), '$& selected')}
            </select>
            <select class="form-input" style="font-size:11px" onchange="var g=JSON.parse(JSON.stringify(App.getState().form.components[${i}].corrugated.gram||[0,0,0,0,0]));g[${gi}]=parseInt(this.value)||0;App.setCorrugated(${i},'gram',g)">
              <option value="">${gramVal || '-'}</option>
              ${gramOpts.map(g => `<option value="${g}"${g==gramVal?' selected':''}>${g}</option>`).join('')}
            </select>
          </div>`;
        }).join('<span style="align-self:center;font-size:14px;color:var(--text-muted)">/</span>')}
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin-top:8px">
      </div>
    </div>`;
    })() : ''}

    <!-- 7d. ส่วนประกอบอื่นๆ (Addons) -->
    <div class="comp-sub-section">
      <div class="comp-sub-title" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span>ส่วนประกอบอื่นๆ</span>
        <button class="btn btn-secondary" onclick="App.addCoating(${i})" style="font-size:12px;padding:2px 10px">+ Coating</button>
      </div>
      ${(() => {
        const foilAds = (c.addon||[]).filter(a => a.type === 'foilstamp');
        const foilAd = foilAds[0] || null;
        const foilIdx = (c.addon||[]).findIndex(a => a.type === 'foilstamp');
        const embossAd = (c.addon||[]).find(a => a.type === 'emboss');
        const embossIdx = (c.addon||[]).findIndex(a => a.type === 'emboss');
        const debossAd = (c.addon||[]).find(a => a.type === 'deboss');
        const debossIdx = (c.addon||[]).findIndex(a => a.type === 'deboss');
        let html = '';

        // F-code tag helper — shows assigned F-codes for Multi-F jobs
        const isMultiF = State.form.has_multi_f && State.form.f_data?.length > 1;
        const allFCodes = (State.form.f_data || []).map(fd => fd.f_code).filter(Boolean);
        const fCodeTags = (ci, ai, adFCodes) => {
          if (!isMultiF) return '';
          const codes = adFCodes || [];
          return '<div style="display:flex;align-items:center;gap:3px;margin-top:4px;flex-wrap:wrap">'
            + '<span style="font-size:10px;color:var(--text-muted);white-space:nowrap">F Code:</span>'
            + codes.map((fc, fi) =>
              '<span style="display:inline-flex;align-items:center;gap:2px;background:var(--accent);color:#fff;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:600">'
              + esc(fc)
              + '<span onclick="App.removeAddonFCode(' + ci + ',' + ai + ',' + fi + ')" style="cursor:pointer;opacity:0.7;margin-left:2px" title="ลบ">&times;</span></span>'
            ).join('')
            + '<select onchange="App.addAddonFCode(' + ci + ',' + ai + ',this.value);this.value=\'\'" style="font-size:10px;padding:1px 4px;height:22px;border:1px dashed var(--border-color);border-radius:4px;background:transparent;color:var(--text-muted);cursor:pointer">'
            + '<option value="">+ F</option>'
            + allFCodes.filter(fc => !codes.includes(fc)).map(fc => '<option value="' + esc(fc) + '">' + esc(fc) + '</option>').join('')
            + '</select></div>';
        };

        // --- ALL Coatings (multiple supported, like legacy) ---
        const coatingTypes = State.masters.coating_info || [];
        const uniqueCoatingTypes = [...new Set(coatingTypes.map(ct => ct.coating_code))];
        (c.addon||[]).forEach((ad, ai) => {
          if (ad.type !== 'coating') return;
          const cSide = parseInt(ad.info?.side) || 1;
          const cCode = ad.info?.coating_code || '';
          let typeSideOpts = '';
          uniqueCoatingTypes.forEach(code => {
            const typeName = coatingTypes.find(ct => ct.coating_code === code)?.coating_type || code;
            [1, 2].forEach(s => {
              const val = code + '|' + s;
              const sel = (code === cCode && s === cSide) ? ' selected' : '';
              typeSideOpts += `<option value="${val}"${sel}>${typeName} ${s} s</option>`;
            });
          });
          html += `<div style="border:1px solid var(--border-color);border-radius:6px;padding:8px 10px;margin-bottom:6px">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span style="font-weight:600;font-size:13px;min-width:55px">Coating</span>
              <select class="form-input" style="min-width:80px;flex:0 1 100px" onchange="App.setAddonInfo(${i},${ai},'coating_option',this.value);App.onCoatingOptionChange(${i},${ai})">
                <option value="">-</option>
                <option value="Gloss"${(ad.info?.coating_option||'')==='Gloss'?' selected':''}>Gloss</option>
                <option value="Matt"${(ad.info?.coating_option||'')==='Matt'?' selected':''}>Matt</option>
                <option value="Other"${(ad.info?.coating_option||'')==='Other'?' selected':''}>Other</option>
              </select>
              <select class="form-input" style="min-width:120px;flex:1 1 200px" onchange="var p=this.value.split('|');App.setAddonInfo(${i},${ai},'coating_code',p[0]);App.setAddonInfo(${i},${ai},'side',parseInt(p[1])||1);App.onCoatingCodeChange(${i},${ai},p[0])">
                <option value="">-select-</option>
                ${typeSideOpts}
              </select>
              <button class="array-item-remove" onclick="App.removeAddon(${i},${ai})" style="margin-left:auto"><i class="fas fa-times"></i></button>
            </div>
          </div>`;
        });

        // --- Shared compact components (override .form-input padding/radius) ---
        const CS = 'padding:4px 6px !important;border-radius:4px !important;font-size:12px !important;height:30px !important;line-height:20px !important';
        const sIn = (ci,ai,si,key,val) => `<input type="text" inputmode="decimal" value="${esc(val)}" onchange="App.setAddonSize(${ci},${ai},${si},'${key}',this.value)" style="width:42px;height:30px;font-size:13px;font-weight:600;text-align:center;border:1.5px solid var(--border-color);border-radius:4px;background:var(--bg-card);outline:none;padding:0;color:var(--text-primary);box-sizing:border-box">`;
        const szX = `<span style="font-size:12px;color:var(--text-muted);margin:0 2px;line-height:30px">x</span>`;
        const szRm = (ci,ai,si) => `<button class="array-item-remove" onclick="App.removeAddonSize(${ci},${ai},${si})" style="width:22px;height:22px;font-size:9px;margin-left:2px"><i class="fas fa-times"></i></button>`;
        const szAdd = (ci,ai) => `<span onclick="App.addAddonSize(${ci},${ai})" style="font-size:11px;color:var(--accent);cursor:pointer;white-space:nowrap" title="เพิ่มขนาด">+ เพิ่ม</span>`;
        const rowDel = (ci,ai) => `<button class="array-item-remove" onclick="App.removeAddon(${ci},${ai})" style="margin-left:auto;flex-shrink:0" title="ลบ"><i class="fas fa-times"></i></button>`;

        // --- Foil Stamp ---
        html += `<div style="border:1px solid var(--border-color);border-radius:6px;padding:8px 10px;margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px;${foilAds.length ? 'margin-bottom:4px' : ''}">
            <label class="checkbox-label" style="font-weight:600;font-size:13px;white-space:nowrap"><input type="checkbox" ${foilAd ? 'checked' : ''} onchange="App.toggleAddon(${i},'foilstamp',this.checked)"> Foil stamp</label>
            ${foilAd ? `<span onclick="App.addFoilStamp(${i})" style="font-size:11px;color:var(--accent);cursor:pointer;white-space:nowrap">+ เพิ่มสี</span>` : ''}
          </div>`;
        if (foilAds.length > 0) {
          foilAds.forEach((fAd, fIdx) => {
            const ri = (c.addon||[]).indexOf(fAd);
            const fSz = fAd.info?.sizes || [{ w: fAd.info?.size_w || '', l: fAd.info?.size_l || '' }];
            html += `<div style="display:flex;align-items:center;padding:4px 0;${fIdx > 0 ? 'border-top:1px dashed var(--border-color);margin-top:3px;padding-top:6px' : ''}">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;flex:1;min-width:0">
                <select class="form-input" style="min-width:80px;flex:0 1 110px;${CS}" onchange="App.setAddonInfo(${i},${ri},'foil_color',this.value);App.onFoilColorChange(${i},${ri},this.value)"><option value="">- สี -</option>${getFoilColorOpts(fAd.info?.foil_color)}</select>
                <select class="form-input" style="min-width:100px;flex:0 1 150px;${CS}" onchange="App.setAddonInfo(${i},${ri},'foil_code',this.value);App.onFoilCodeChange(${i},${ri},this.value)"><option value="">- code -</option>${getFoilCodeOpts(fAd.info?.foil_color, fAd.info?.foil_code)}</select>
                <span style="font-size:14px;cursor:pointer;color:var(--accent);line-height:30px" onclick="App.swapFoilColorCode(${i},${ri})" title="สลับ">⇆</span>
                <span style="width:1px;height:22px;background:var(--border-color);flex-shrink:0"></span>
                <span style="font-size:11px;color:var(--text-muted);white-space:nowrap">Size (in²)</span>
                ${fSz.map((s, si) => `<span style="display:inline-flex;align-items:center">${sIn(i,ri,si,'w',s.w)}${szX}${sIn(i,ri,si,'l',s.l)}${si > 0 ? szRm(i,ri,si) : ''}</span>`).join('')}
                ${szAdd(i,ri)}
              </div>
              ${foilAds.length > 1 ? rowDel(i,ri) : ''}
            </div>
            ${fCodeTags(i, ri, fAd.f_codes)}`;
          });
        }
        html += `</div>`;

        // --- Emboss ---
        html += `<div style="border:1px solid var(--border-color);border-radius:6px;padding:8px 10px;margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <label class="checkbox-label" style="font-weight:600;font-size:13px;white-space:nowrap"><input type="checkbox" ${embossAd ? 'checked' : ''} onchange="App.toggleAddon(${i},'emboss',this.checked)"> Emboss</label>`;
        if (embossAd) {
          const eSz = embossAd.info?.sizes || [{ w: embossAd.info?.size_w || '', l: embossAd.info?.size_l || '' }];
          html += `<span style="font-size:11px;color:var(--text-muted);white-space:nowrap">Size (in²)</span>
            ${eSz.map((s, si) => `<span style="display:inline-flex;align-items:center">${sIn(i,embossIdx,si,'w',s.w)}${szX}${sIn(i,embossIdx,si,'l',s.l)}${si > 0 ? szRm(i,embossIdx,si) : ''}</span>`).join('')}
            ${szAdd(i,embossIdx)}
            <span style="width:1px;height:22px;background:var(--border-color);flex-shrink:0"></span>
            <span style="font-size:11px;color:var(--text-muted);white-space:nowrap">ความนูน</span>
            <select class="form-input" style="width:95px;${CS}" onchange="App.setAddonInfo(${i},${embossIdx},'depth',this.value)">
              <option value="1.25" ${sel(embossAd.info?.depth,'1.25')}>1.25 mm</option>
              <option value="1.65" ${sel(embossAd.info?.depth,'1.65')}>1.65 mm</option>
            </select>`;
        }
        html += `</div>${embossAd ? fCodeTags(i, embossIdx, embossAd?.f_codes) : ''}</div>`;

        // --- Deboss ---
        html += `<div style="border:1px solid var(--border-color);border-radius:6px;padding:8px 10px;margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <label class="checkbox-label" style="font-weight:600;font-size:13px;white-space:nowrap"><input type="checkbox" ${debossAd ? 'checked' : ''} onchange="App.toggleAddon(${i},'deboss',this.checked)"> Deboss</label>`;
        if (debossAd) {
          const dSz = debossAd.info?.sizes || [{ w: debossAd.info?.size_w || '', l: debossAd.info?.size_l || '' }];
          html += `<span style="font-size:11px;color:var(--text-muted);white-space:nowrap">Size (in²)</span>
            ${dSz.map((s, si) => `<span style="display:inline-flex;align-items:center">${sIn(i,debossIdx,si,'w',s.w)}${szX}${sIn(i,debossIdx,si,'l',s.l)}${si > 0 ? szRm(i,debossIdx,si) : ''}</span>`).join('')}
            ${szAdd(i,debossIdx)}
            <span style="width:1px;height:22px;background:var(--border-color);flex-shrink:0"></span>
            <span style="font-size:11px;color:var(--text-muted);white-space:nowrap">ความลึก</span>
            <select class="form-input" style="width:95px;${CS}" onchange="App.setAddonInfo(${i},${debossIdx},'depth',this.value)">
              <option value="1.25" ${sel(debossAd.info?.depth,'1.25')}>1.25 mm</option>
              <option value="1.65" ${sel(debossAd.info?.depth,'1.65')}>1.65 mm</option>
            </select>`;
        }
        html += `</div>${debossAd ? fCodeTags(i, debossIdx, debossAd?.f_codes) : ''}</div>`;
        return html;
      })()}
    </div>

    <!-- 7e. Component Template + Size -->
    <div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding:6px 0">
      <span style="font-size:13px">Component ที่ ${i+1}</span>
      <select class="form-input" onchange="App.setCompBoxType(${i},this.value);App.renderForm()" style="max-width:100%;color:var(--accent, #c55);font-size:12px">
        <option value="">-Select Template-</option>
        ${getBoxTemplateOpts(c.box_type?.type_id)}
      </select>
    </div>
    ${(() => {
      // Auto-apply pending size if exists → no button needed
      if (c._pendingSize && (c._pendingSize.width || c._pendingSize.length)) {
        if (!c.packaging_size?.width && !c.packaging_size?.length) {
          c.packaging_size = {
            width: c._pendingSize.width || '', length: c._pendingSize.length || '',
            depth: c._pendingSize.depth || '', glue_flap: c.packaging_size?.glue_flap || '15',
            tuck_flap: c.packaging_size?.tuck_flap || '15', dust_flap: c.packaging_size?.dust_flap || '',
          };
        }
        // Don't delete _pendingSize — keep as backup for template switches
      }
      const hasTemplate = !!c.box_type?.type_id;

      // มี template → แสดง size section ปกติ (ขนาดกรอกไว้แล้วจาก auto-apply)
      if (hasTemplate) return renderBoxSizeSection(i, c);

      // ไม่มี template → ว่าง
      return '';
    })()}
  </div>`;
}

// Box viewer (3D / Dieline / JPG) — แสดงที่ "หน้าผลลัพธ์" (viewDetail) ไม่ใช่ในฟอร์มกรอกข้อมูล
function buildBoxDiagram(i, c) {
  const typeId = parseInt(c.box_type?.type_id) || 0;
  const fluteDir = c.corrugated?.flute_side || '';
  const isMode3D = State._boxViewMode?.[i] === '3d';
  const fluteOverlay = !isMode3D && fluteDir ? `
    <div style="position:absolute;bottom:8px;left:8px;background:rgba(255,255,255,0.95);padding:4px 8px;border-radius:6px;font-size:11px;border:1px solid #e67e22;display:flex;align-items:center;gap:6px">
      <span style="font-weight:600;color:#e67e22">ทิศทางลอน:</span>
      <img src="img/${fluteDir === 'short' ? 'fluteTemplate_H' : 'fluteTemplate_V'}.png" style="width:40px;height:40px">
    </div>` : '';
  // #92: Mini buttons switch view in-place, click content to popup enlarge
  const mbtn = `padding:2px 7px;border-radius:5px;font-size:9px;font-weight:600;cursor:pointer;border:none;`;
  const mbtnA = `${mbtn}background:#5b2d8e;color:#fff;`;
  const mbtnI = `${mbtn}background:var(--bg-tertiary);color:var(--text-secondary);border:1px solid var(--border);`;
  const boxViewId = `boxView_${i}`;
  return typeId >= 1 && typeId <= 12
    ? `<div>
        <div id="boxBtns_${i}" style="display:flex;gap:3px;margin-bottom:4px;flex-wrap:wrap;align-items:center">
          <button onclick="App.switchBoxView(${i},${typeId},'3d')" style="${mbtnI}"><i class="fas fa-cube"></i> 3D</button>
          <button onclick="App.switchBoxView(${i},${typeId},'svg')" style="${mbtnI}"><i class="fas fa-drafting-compass"></i> Dieline</button>
          <button onclick="App.switchBoxView(${i},${typeId},'jpg')" style="${mbtnA}"><i class="fas fa-image"></i> JPG</button>
          ${State.form.has_multi_f && c._color_per_f?.length > 1 ? `
          <span style="width:1px;height:18px;background:var(--border-color);margin:0 2px"></span>
          <span style="font-size:10px;color:var(--text-muted)">Preview:</span>
          ${c._color_per_f.map((cf, fi) => {
            const fc = cf.f_code || State.form.f_data?.[fi]?.f_code || '';
            const isActive = State._boxPreviewF?.[i] === fi;
            return '<button data-fpreview="' + fi + '" onclick="App.previewBoxF(' + i + ',' + fi + ',' + typeId + ')" style="font-size:10px;padding:1px 8px;border-radius:4px;cursor:pointer;border:1px solid ' + (isActive ? 'var(--accent)' : 'var(--border-color)') + ';background:' + (isActive ? 'var(--accent)' : 'transparent') + ';color:' + (isActive ? '#fff' : 'var(--text-muted)') + ';font-weight:' + (isActive ? '700' : '400') + '">' + esc(fc) + '</button>';
          }).join('')}
          ` : ''}
          <label style="margin-left:auto;font-size:10px;padding:2px 8px;border-radius:4px;cursor:pointer;border:1px dashed var(--border-color);color:var(--text-muted);display:inline-flex;align-items:center;gap:3px" title="อัพโหลด Artwork ลงบน 3D">
            <i class="fas fa-upload" style="font-size:9px"></i> Artwork
            <input type="file" accept="image/*" onchange="App.uploadBoxArtwork(${i},this)" style="display:none">
          </label>
          ${c._artwork ? `<button data-clear-artwork onclick="App.clearBoxArtwork(${i})" style="font-size:9px;padding:1px 6px;border-radius:4px;cursor:pointer;border:1px solid var(--danger,#dc3545);background:transparent;color:var(--danger,#dc3545)" title="ลบ Artwork">&times;</button>` : ''}
        </div>
        <div id="${boxViewId}" data-mode="jpg" data-ci="${i}" data-tid="${typeId}" style="width:clamp(280px,30vw,400px);height:clamp(235px,25vw,336px);border-radius:10px;border:1px solid var(--border);box-shadow:0 2px 8px rgba(91,45,142,0.1);overflow:hidden;cursor:pointer;position:relative" onclick="App.openBoxPopup(${i},${typeId})">
          <img src="img/${typeId}.jpg" style="width:100%;height:100%;object-fit:contain;display:block" alt="Box Template ${typeId}">
          ${fluteOverlay}
        </div>
      </div>`
    : `<div style="padding:40px;color:#999;font-size:13px">เลือกรูปแบบกล่อง</div>`;
}

// Helper: Render box template diagram + size fields (3-column layout matching original system)
function renderBoxSizeSection(i, c) {
  const sz = c.packaging_size || {};
  const bt = c.box_type || {};
  const typeId = parseInt(bt.type_id) || 0;
  const mm2in = v => { const n = parseFloat(v); return n ? mm2inchLegacy(n) : ''; };

  // หมายเหตุ: รูป 3D/Dieline/JPG ของกล่อง ย้ายไปแสดงที่ "หน้าผลลัพธ์" (viewDetail) แล้ว
  // ดู buildBoxDiagram() — ฟอร์มกรอกข้อมูลจะไม่แสดง viewer เพื่อให้โฟกัสที่การกรอก

  // Field visibility per box type (matching original setInputDimensionField)
  const hide = { glue: false, tuck: false, dust: false, ol: false, depth: false };
  switch (typeId) {
    case 1: case 2: hide.ol = true; break;
    case 5: hide.ol = true; hide.glue = true; hide.tuck = true; break;
    case 6: hide.glue = true; hide.tuck = true; break;
    case 7: hide.ol = true; hide.tuck = true; break;
    case 8: hide.dust = true; break;
    case 9: hide.dust = true; hide.tuck = true; hide.ol = true; break;
    case 10: hide.dust = true; hide.tuck = true; hide.ol = true; break;
    case 11: hide.tuck = true; hide.ol = true; break;
    case 12: hide.depth = true; hide.glue = true; hide.dust = true; hide.tuck = true; hide.ol = true; break;
  }

  const olLabel = typeId === 6 ? 'กรอบ' : 'OL (Overlap)';
  const tuckLabel = typeId === 8 ? 'ที่จับ' : 'ฝาเสียบ';

  // Size input row: label | [mm input] mm | [inch input] inch
  const sizeRow = (label, key, val, isHidden) => {
    if (isHidden) return '';
    return `<tr>
      <td style="padding:4px 8px"><div>${label}<strong style="color:red">*</strong></div></td>
      <td style="padding:4px 4px"><div><input class="form-input" type="number" step="0.1" style="width:70px;text-align:center" value="${esc(val)}" oninput="App.setCompSize(${i},'${key}',this.value);App.updateSizeCalc(${i})"> mm</div></td>
      <td style="padding:4px 4px"><div><input class="form-input" type="text" style="width:70px;text-align:center;background:var(--readonly-bg, #f5f5f5)" value="${mm2in(val)}" data-inch="${i}_${key}" readonly> inch</div></td>
    </tr>`;
  };

  // Fold Size calculation (matching original setCalculateFoldSize)
  const w = parseFloat(sz.width) || 0, l = parseFloat(sz.length) || 0, d = parseFloat(sz.depth) || 0;
  const t = parseFloat(sz.tuck_flap) || 0;
  let fW, fL, fD;
  if (typeId === 8) { fW = 2 * w + t; fL = l; fD = d; }
  else { fW = w; fL = l; fD = d; }

  // Open Size calculation (matching original setCalculateOpenSize)
  const g = parseFloat(sz.glue_flap) || 0;
  const ol = parseFloat(sz.ol) || 0;
  const dust = parseFloat(sz.dust_flap) || 0;
  let oW = 0, oL = 0;
  switch (typeId) {
    case 1: case 2: oW = 2 * (w + t) + d; oL = 2 * (w + l) + g; break;
    case 3: case 4: oW = t + w + d + w / 2 + ol; oL = 2 * (w + l) + g; break;
    case 5: oW = w + 4 * d; oL = l + 4 * d + 2 * dust; break;
    case 6: oW = w + 4 * d + 2 * dust + 2 * ol; oL = l + 4 * d + 2 * dust + 2 * ol; break;
    case 7: oW = 2 * (l + dust) + w; oL = 2 * (l + d) + l; break;
    case 8: oW = t + 2 * d + w / 2 + ol; oL = 2 * (w + l) + g; break;
    case 9: oW = d; oL = 2 * (w + l) + g; break;
    case 10: oW = l + d; oL = 2 * w + g; break;
    case 11: oW = 2 * w + d; oL = 2 * (w + l) + g; break;
    case 12: oW = parseFloat(sz.open_w) || w; oL = parseFloat(sz.open_l) || l; break;
  }

  // Readonly input for calculated sizes
  const roIn = v => `<input class="form-input" type="text" style="width:74px;text-align:center;background:var(--readonly-bg, #f0f0f0);font-size:12px" value="${v || ''}" readonly>`;
  const szIn = 'width:74px;text-align:center;background:var(--readonly-bg, #f0f0f0);font-size:12px';

  // Packing Size calculation (matching original setCalculatePackingSize)
  let pkW = 0, pkL = 0;
  switch (typeId) {
    case 1: case 2: pkW = d + 2 * (w + t); pkL = l + w; break;
    case 3: pkW = d + w + t + ol + w / 2; pkL = l + w; break;
    case 4: pkW = d + w + t; pkL = l + w; break;
    case 5: pkW = 4 * d + w; pkL = 2 * dust + 4 * d + l; break;
    case 6: pkW = 2 * dust + 4 * d + 2 * ol + w; pkL = 2 * dust + 4 * d + 2 * ol + l; break;
    case 7: pkW = w; pkL = l + d; break;
    case 8: pkW = t + 2 * d; pkL = l + w; break;
    case 9: pkW = d; pkL = l + w; break;
    case 10: pkW = l + d; pkL = w; break;
    case 11: pkW = d + 2 * w; pkL = l + w; break;
    case 12: pkW = parseFloat(sz.packing_w) || w; pkL = parseFloat(sz.packing_l) || l; break;
  }

  // Glued spot — always lookup from master data to ensure correct value
  let glueSpot = parseInt(bt.glued_spot) || 0;
  if (!glueSpot && bt.type_id) {
    const masterBt = (State.masters.boxtemplate_info || []).find(b => String(b.type_id) === String(bt.type_id));
    if (masterBt?.glued_spot) { glueSpot = masterBt.glued_spot; bt.glued_spot = glueSpot; }
  }
  const packingLayer = bt.packing_layer || 2;
  const isCustom = typeId === 12;

  return `<div style="border:1px solid var(--border-color);border-radius:8px;padding:10px;margin-top:8px;background:var(--section-bg, #fafbff);overflow-x:auto">
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <!-- Col 1 (Box Diagram 3D/Dieline/JPG) — ย้ายไปหน้าผลลัพธ์แล้ว -->
      <!-- Col 2: Size Inputs -->
      <div style="flex-shrink:0">
        <table cellpadding="0" style="font-size:13px">
          ${sizeRow('กว้าง', 'width', sz.width, false)}
          ${sizeRow('ยาว', 'length', sz.length, false)}
          ${sizeRow('ความสูง', 'depth', sz.depth, hide.depth)}
          ${sizeRow('ติดกาว', 'glue_flap', sz.glue_flap || '15', hide.glue)}
          ${sizeRow(tuckLabel, 'tuck_flap', sz.tuck_flap || '15', hide.tuck)}
          ${sizeRow('ปีกกล่อง', 'dust_flap', sz.dust_flap || '', hide.dust)}
          ${sizeRow(olLabel, 'ol', sz.ol || '', hide.ol)}
        </table>
      </div>
      <!-- Col 3: Fold/Open/Packing Size + Options -->
      <div style="flex:1;min-width:220px">
        <table cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:separate;border-spacing:0 2px;width:100%">
          <tr>
            <td rowspan="2" style="vertical-align:middle;padding-right:8px;font-weight:600;white-space:nowrap;font-size:12px">Fold Size</td>
            <td style="padding:2px 0"><div style="white-space:nowrap"><input class="form-input" type="text" style="${szIn}" value="${fW || ''}" data-calc="${i}" data-calc-type="fw" readonly> <span style="margin:0 1px;font-size:11px">x</span> <input class="form-input" type="text" style="${szIn}" value="${fL || ''}" data-calc="${i}" data-calc-type="fl" readonly> <span style="margin:0 1px;font-size:11px">x</span> <input class="form-input" type="text" style="${szIn}" value="${fD || ''}" data-calc="${i}" data-calc-type="fd" readonly> <span style="margin-left:3px;font-size:11px;color:var(--text-secondary)">mm</span></div></td>
          </tr>
          <tr>
            <td style="padding:2px 0"><div style="white-space:nowrap"><input class="form-input" type="text" style="${szIn}" value="${mm2in(fW)}" data-calc="${i}" data-calc-type="fw_in" readonly> <span style="margin:0 1px;font-size:11px">x</span> <input class="form-input" type="text" style="${szIn}" value="${mm2in(fL)}" data-calc="${i}" data-calc-type="fl_in" readonly> <span style="margin:0 1px;font-size:11px">x</span> <input class="form-input" type="text" style="${szIn}" value="${mm2in(fD)}" data-calc="${i}" data-calc-type="fd_in" readonly> <span style="margin-left:3px;font-size:11px;color:var(--text-secondary)">inch</span></div></td>
          </tr>
          <tr><td colspan="2" style="height:6px"></td></tr>
          <tr>
            <td rowspan="2" style="vertical-align:middle;padding-right:8px;font-weight:600;white-space:nowrap;font-size:12px">Open Size</td>
            <td style="padding:2px 0"><div style="white-space:nowrap"><input class="form-input" type="text" style="${szIn}" value="${oW || ''}" data-calc="${i}" data-calc-type="ow" readonly> <span style="margin:0 1px;font-size:11px">x</span> <input class="form-input" type="text" style="${szIn}" value="${oL || ''}" data-calc="${i}" data-calc-type="ol" readonly> <span style="margin-left:3px;font-size:11px;color:var(--text-secondary)">mm</span></div></td>
          </tr>
          <tr>
            <td style="padding:2px 0"><div style="white-space:nowrap"><input class="form-input" type="text" style="${szIn}" value="${mm2in(oW)}" data-calc="${i}" data-calc-type="ow_in" readonly> <span style="margin:0 1px;font-size:11px">x</span> <input class="form-input" type="text" style="${szIn}" value="${mm2in(oL)}" data-calc="${i}" data-calc-type="ol_in" readonly> <span style="margin-left:3px;font-size:11px;color:var(--text-secondary)">inch</span></div></td>
          </tr>
          <tr><td colspan="2" style="height:6px"></td></tr>
          <tr>
            <td rowspan="2" style="vertical-align:middle;padding-right:10px;font-weight:600;white-space:nowrap;font-size:12px">Packing Size</td>
            ${isCustom ? `
            <td style="padding:2px 0"><div style="white-space:nowrap"><input class="form-input" type="number" step="0.1" style="width:74px;text-align:center;font-size:12px" value="${pkW || ''}" data-calc="${i}" data-calc-type="pw" oninput="App.setCompSize(${i},'packing_w',this.value);App.updateSizeCalc(${i})"> <span style="margin:0 1px;font-size:11px">x</span> <input class="form-input" type="number" step="0.1" style="width:74px;text-align:center;font-size:12px" value="${pkL || ''}" data-calc="${i}" data-calc-type="pl" oninput="App.setCompSize(${i},'packing_l',this.value);App.updateSizeCalc(${i})"> <span style="margin-left:3px;font-size:11px;color:var(--text-secondary)">mm</span></div></td>
            ` : `
            <td style="padding:2px 0"><div style="white-space:nowrap"><input class="form-input" type="text" style="${szIn}" value="${pkW ? Math.round(pkW) : ''}" data-calc="${i}" data-calc-type="pw" readonly> <span style="margin:0 1px;font-size:11px">x</span> <input class="form-input" type="text" style="${szIn}" value="${pkL ? Math.round(pkL) : ''}" data-calc="${i}" data-calc-type="pl" readonly> <span style="margin-left:3px;font-size:11px;color:var(--text-secondary)">mm</span></div></td>
            `}
          </tr>
          <tr>
            ${isCustom ? `
            <td style="padding:2px 0"><div style="white-space:nowrap"><input class="form-input" type="number" step="0.01" style="width:74px;text-align:center;font-size:12px" value="${mm2in(pkW)}" data-calc="${i}" data-calc-type="pw_in" oninput="App.setCompSize(${i},'packing_w',String(Math.round(parseFloat(this.value)*25.4*10)/10));App.updateSizeCalc(${i})"> <span style="margin:0 1px;font-size:11px">x</span> <input class="form-input" type="number" step="0.01" style="width:74px;text-align:center;font-size:12px" value="${mm2in(pkL)}" data-calc="${i}" data-calc-type="pl_in" oninput="App.setCompSize(${i},'packing_l',String(Math.round(parseFloat(this.value)*25.4*10)/10));App.updateSizeCalc(${i})"> <span style="margin-left:3px;font-size:11px;color:var(--text-secondary)">inch</span></div></td>
            ` : `
            <td style="padding:2px 0"><div style="white-space:nowrap"><input class="form-input" type="text" style="${szIn}" value="${mm2in(pkW)}" data-calc="${i}" data-calc-type="pw_in" readonly> <span style="margin:0 1px;font-size:11px">x</span> <input class="form-input" type="text" style="${szIn}" value="${mm2in(pkL)}" data-calc="${i}" data-calc-type="pl_in" readonly> <span style="margin-left:3px;font-size:11px;color:var(--text-secondary)">inch</span></div></td>
            `}
          </tr>
          <tr><td colspan="2" style="height:4px"></td></tr>
          <tr>
            <td style="padding-right:10px;font-weight:600;white-space:nowrap">จำนวนทบ Packing</td>
            <td><input class="form-input" type="number" style="width:50px;text-align:center" value="${packingLayer}" oninput="App.setCompBoxField(${i},'packing_layer',parseInt(this.value)||2)"></td>
          </tr>
          ${(() => {
            // ลอนขนานด้าน — แสดงเฉพาะ component_type 2 (ประกบลูกฟูก) หรือ 3 (เฉพาะลูกฟูก) ตามระบบเก่า
            if (c.component_type !== 2 && c.component_type !== 3) return '';
            const ps = c._pendingSize || {};
            const useW = oW || w || parseFloat(ps.width) || 0;
            const useL = oL || l || parseFloat(ps.length) || 0;
            const shortSide = Math.min(useW || 9999, useL || 9999);
            const longSide = Math.max(useW || 0, useL || 0);
            const shortLabel = shortSide < 9999 && shortSide > 0 ? shortSide : '?';
            const longLabel = longSide > 0 ? longSide : '?';
            return `
          <tr>
            <td style="padding-right:10px;font-weight:600;white-space:nowrap">ลอนขนานด้าน</td>
            <td><select class="form-input" style="min-width:140px;max-width:100%" data-flute-side="${i}" onchange="App.setCorrugated(${i},'flute_side',this.value)">
              <option value="">-select flute side-</option>
              <option value="short" ${(c.corrugated?.flute_side||'')==='short'?'selected':''}>ด้านสั้นกล่อง: ${shortLabel} mm</option>
              <option value="long" ${(c.corrugated?.flute_side||'')==='long'?'selected':''}>ด้านยาวกล่อง: ${longLabel} mm</option>
            </select></td>
          </tr>`;
          })()}
          <tr><td colspan="2" style="height:6px"></td></tr>
          <tr>
            <td colspan="2"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
              <label style="white-space:nowrap;cursor:pointer"><input type="checkbox" ${glueSpot > 0 ? 'checked' : ''} onchange="App.setCompBoxField(${i},'glued_spot',this.checked?Math.max(${glueSpot},1):0);App.renderForm()"> ติดกาว</label>
              ${glueSpot > 0 ? `<input class="form-input" type="number" max="4" min="1" style="text-align:center;width:50px;font-size:14px;font-weight:600" value="${glueSpot}" oninput="App.setCompBoxField(${i},'glued_spot',parseInt(this.value)||0);App.renderForm()"> <span style="font-size:12px">จุด</span>` : ''}
            </div></td>
          </tr>
          <tr>
            <td colspan="2"><label style="white-space:nowrap;cursor:pointer"><input type="checkbox" ${bt.is_manual_layout ? 'checked' : ''} onchange="App.setCompBoxField(${i},'is_manual_layout',this.checked);App.renderForm()"> Manual Layout</label></td>
          </tr>
          ${bt.is_manual_layout ? `<tr><td colspan="2" style="padding-top:6px">
            <div style="background:var(--bg-tertiary);border:1px dashed var(--border-color);border-radius:6px;padding:8px;font-size:12px">
              <div style="font-weight:600;margin-bottom:6px;color:var(--accent)"><i class="fas fa-hand-pointer"></i> Manual Layout</div>
              <table style="border-collapse:separate;border-spacing:4px 4px">
                <tr><td style="white-space:nowrap">จำนวนด้านกว้าง</td><td><input class="form-input" type="number" min="1" style="width:50px;text-align:center" value="${bt.manual_nw || 1}" oninput="App.setCompBoxField(${i},'manual_nw',parseInt(this.value)||1)"></td></tr>
                <tr><td style="white-space:nowrap">จำนวนด้านยาว</td><td><input class="form-input" type="number" min="1" style="width:50px;text-align:center" value="${bt.manual_nl || 1}" oninput="App.setCompBoxField(${i},'manual_nl',parseInt(this.value)||1)"></td></tr>
              </table>
              <div style="margin-top:4px;color:var(--text-muted)">Ups = ${(bt.manual_nw||1) * (bt.manual_nl||1)} ดวง</div>
            </div>
          </td></tr>` : ''}
        </table>
      </div>
    </div>
  </div>`;
}


// Helper: Box Template dropdown options from master data
function getBoxTemplateOpts(selectedId) {
  const info = State.masters['boxtemplate_info'] || [];
  let html = '';
  info.forEach((bt, idx) => {
    const label = (idx + 1) + '. ' + bt.type_name + ' : ' + (bt.type_name_th || '');
    html += '<option value="' + esc(bt.type_id) + '"' + (String(bt.type_id) === String(selectedId) ? ' selected' : '') + '>' + esc(label) + '</option>';
  });
  return html;
}

function esc(v) { return v == null ? '' : String(v).replace(/"/g, '&quot;'); }

// Helper: Paper code dropdown from paper_info (real codes like AC C1s, Dup BBB, etc.)
function getPaperCodeOpts(selectedCode) {
  const allPapers = State.masters['_paper_info_all'] || [];
  if (allPapers.length > 0) {
    const seen = new Set();
    let html = '';
    allPapers.forEach(p => {
      if (p.paper_code && !seen.has(p.paper_code)) {
        seen.add(p.paper_code);
        html += '<option value="' + esc(p.paper_code) + '"' + (p.paper_code === selectedCode ? ' selected' : '') + '>' + esc(p.paper_code) + '</option>';
      }
    });
    return html;
  }
  // Fallback to paper_code_type
  const types = State.masters['paper_code_type'] || [];
  if (types.length > 0) {
    return types.map(function(pt) {
      return '<option value="' + esc(pt.paper_code) + '"' + (pt.paper_code === selectedCode ? ' selected' : '') + '>' + esc(pt.paper_code) + ' - ' + esc(pt.paper_type) + '</option>';
    }).join('');
  }
  return '<option value="AC">AC - Art Card</option><option value="GA">GA - Gloss Art</option><option value="MA">MA - Matt Art</option>';
}

// Helper: Coating type dropdown options from master data
function getCoatingTypeOpts(selectedCode) {
  const info = State.masters['coating_info'] || [];
  const seen = new Set();
  let html = '';
  info.forEach(c => {
    if (!seen.has(c.coating_code)) {
      seen.add(c.coating_code);
      html += '<option value="' + esc(c.coating_code) + '"' + (c.coating_code === selectedCode ? ' selected' : '') + '>' + esc(c.coating_type) + '</option>';
    }
  });
  return html || '<option value="UV">UV</option><option value="WTB">Waterbase</option><option value="OPP">OPP</option>';
}

// Helper: Coating option dropdown (Gloss/Matt etc) filtered by code
function getCoatingOptionOpts(coatingCode, selectedOption) {
  const info = State.masters['coating_info'] || [];
  const filtered = info.filter(c => c.coating_code === coatingCode);
  if (filtered.length === 0) return '<option value="Gloss">Gloss</option><option value="Matt">Matt</option>';
  const seen = new Set();
  let html = '';
  filtered.forEach(c => {
    if (!seen.has(c.coating_option)) {
      seen.add(c.coating_option);
      html += '<option value="' + esc(c.coating_option) + '"' + (c.coating_option === selectedOption ? ' selected' : '') + '>' + esc(c.coating_option) + '</option>';
    }
  });
  return html;
}

// Helper: Foil color dropdown options from master data
function getFoilColorOpts(selectedColor) {
  const info = State.masters['foilstamp_info'] || [];
  const seen = new Set();
  let html = '';
  info.forEach(f => {
    if (f.color_th && !seen.has(f.color_th)) {
      seen.add(f.color_th);
      html += '<option value="' + esc(f.color_th) + '"' + (f.color_th === selectedColor ? ' selected' : '') + '>' + esc(f.color_th) + '</option>';
    }
  });
  return html || '<option value="ขาว">ขาว</option><option value="ทองกลาง">ทองกลาง</option><option value="เงินเงา">เงินเงา</option>';
}

// Helper: Foil code dropdown filtered by selected color
function getFoilCodeOpts(selectedColor, selectedCode) {
  const info = State.masters['foilstamp_info'] || [];
  const filtered = info.filter(f => f.color_th === selectedColor);
  let html = '';
  filtered.forEach(f => {
    html += '<option value="' + esc(f.code) + '"' + (f.code === selectedCode ? ' selected' : '') + '>' + esc(f.code) + '</option>';
  });
  return html;
}

// Helper: Corrugated flute types from master data
function getCorrugatedFluteOpts(selectedFlute) {
  const info = State.masters['corrugated_info'] || [];
  const seen = new Set();
  let html = '';
  info.forEach(c => {
    if (c.flute_type && !seen.has(c.flute_type)) {
      seen.add(c.flute_type);
      html += '<option value="' + esc(c.flute_type) + '"' + (c.flute_type === selectedFlute ? ' selected' : '') + '>' + esc(c.flute_type) + ' Flute</option>';
    }
  });
  return html || '<option value="A">A Flute</option><option value="B">B Flute</option><option value="C">C Flute</option><option value="E">E Flute</option>';
}

// Helper: Corrugated paper grade types from master data
function getCorrugatedGradeTypes() {
  const info = State.masters['corrugated_info'] || [];
  const types = new Set();
  info.forEach(c => { if (c.type_1) types.add(c.type_1); if (c.type_2) types.add(c.type_2); if (c.type_3) types.add(c.type_3); });
  return [...types].filter(Boolean).sort();
}

// Helper: Delivery destination options from master data
function getDeliveryDestOpts(selectedDest) {
  const info = State.masters['delivery_rate_info'] || [];
  const seen = new Set();
  let html = '';
  info.forEach(d => {
    if (d.name && !seen.has(d.name)) {
      seen.add(d.name);
      html += '<option value="' + esc(d.name) + '"' + (d.name === selectedDest ? ' selected' : '') + '>' + esc(d.name) + '</option>';
    }
  });
  return html;
}

// Coating code change → re-render to update option dropdown
function onCoatingCodeChange(ci, ai, newCode) {
  // เมื่อเปลี่ยน coating type+side → อัพเดท type name + reload option dropdown
  const ad = State.form.components[ci].addon[ai];
  if (ad && ad.info) {
    const ct = (State.masters['coating_info'] || []).find(c => c.coating_code === newCode);
    if (ct) {
      ad.info.type = ct.coating_type || '';
      ad.type_id = ct.type_id || ct.process_id || '';
      ad.process_id = ct.process_id || '';
      // ถ้ายังไม่มี option → ตั้ง Gloss เป็น default
      if (!ad.info.coating_option) ad.info.coating_option = 'Gloss';
    }
  }
  renderForm();
}
function onCoatingOptionChange(ci, ai) { renderForm(); }

// Foil color change → auto-select first code + re-render
function onFoilColorChange(ci, ai, color) {
  const info = State.masters['foilstamp_info'] || [];
  const match = info.find(f => f.color_th === color);
  if (match) {
    const addon = State.form.components[ci].addon[ai];
    if (addon && addon.info) {
      addon.info.foil_code = match.code;
      addon.info.foil_roll_price = match.roll_price;
      addon.info.foil_width = match.width;
      addon.info.foil_length = match.length;
    }
  }
  renderForm();
}

// Foil code change → update price info
function onFoilCodeChange(ci, ai, code) {
  const info = State.masters['foilstamp_info'] || [];
  const match = info.find(f => f.code === code);
  if (match) {
    const addon = State.form.components[ci].addon[ai];
    if (addon && addon.info) {
      addon.info.foil_roll_price = match.roll_price;
      addon.info.foil_width = match.width;
      addon.info.foil_length = match.length;
    }
  }
}
function aiClass(field) { return State.fieldSource[field] === 'ai' ? 'ai-filled' : ''; }

// ============================================================
// AI LEARNING — Track realtime corrections
// เมื่อ user แก้ field ที่ AI กรอก → ส่ง correction ไป server (debounced)
// ============================================================
const _correctionDebounce = {};
function trackCorrection(field, newValue) {
  if (!State._lastParsedData || !State._lastSpecText) return;
  if (State.fieldSource[field] !== 'ai') return; // เฉพาะ field ที่ AI กรอก

  // หา ai_value จาก _lastParsedData
  const aiVal = getAIFieldValue(field);
  if (aiVal === null || aiVal === undefined) return;
  if (String(aiVal).trim() === String(newValue).trim()) return; // ไม่ใช่การแก้

  // Debounce 1.5s ต่อ field
  if (_correctionDebounce[field]) clearTimeout(_correctionDebounce[field]);
  _correctionDebounce[field] = setTimeout(() => {
    const cleanField = field.replace(/^comp\.\d+\./, '').replace(/\.\d+$/, '');
    apiPost('/api/corrections/add', {
      spec_text: State._lastSpecText,
      field: cleanField,
      ai_value: String(aiVal),
      user_value: String(newValue),
      context: State.form?.job_name || '',
    }).then(r => {
      if (r?.success) {
        console.log(`[Learn] saved correction for ${cleanField}: ${aiVal} → ${newValue}`);
        // Mark as learned (no longer ai)
        delete State.fieldSource[field];
      }
    }).catch(() => {});
  }, 1500);
}

// ============================================================
// SMART SUGGESTION — เมื่อ master data ไม่มีตัวที่ AI parse มา
// ค้นหาตัวใกล้เคียง (fuzzy) + ให้ user เลือก/ใส่ราคาเอง
// ============================================================

// Levenshtein distance for fuzzy matching
function _editDistance(a, b) {
  if (!a || !b) return Math.max((a || '').length, (b || '').length);
  a = a.toLowerCase(); b = b.toLowerCase();
  const m = a.length, n = b.length;
  const dp = Array.from({length: m + 1}, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
    }
  }
  return dp[m][n];
}

function _similarity(a, b) {
  if (!a || !b) return 0;
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - (_editDistance(a, b) / max);
}

// ค้นหากระดาษใกล้เคียงใน master data
function findSimilarPapers(targetCode, limit) {
  limit = limit || 5;
  const all = State.masters['_paper_info_all'] || [];
  if (!all.length || !targetCode) return [];
  const codes = [...new Set(all.map(p => p.paper_code).filter(Boolean))];
  return codes
    .map(code => ({ code, sim: _similarity(targetCode, code) }))
    .filter(s => s.sim > 0.4)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, limit);
}

// ค้นหา coating ใกล้เคียง
function findSimilarCoatings(target, limit) {
  limit = limit || 5;
  const coatings = State.masters['coating_info'] || [];
  if (!coatings.length || !target) return [];
  return coatings
    .map(c => {
      const name = c.coating_type || c.process_name || c.coating_code || '';
      return { item: c, name, sim: _similarity(target, name) };
    })
    .filter(s => s.sim > 0.3)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, limit);
}

// Normalize paper code: ลบ slash/dash + space ฯลฯ เพื่อเทียบ
function _normalizePaperCode(s) {
  return (s || '').toString().toLowerCase().replace(/[\s\/\-_.]/g, '');
}

// ตรวจสอบหลัง applyAgentData ว่ามี field ไหนที่ AI parse มาแต่ไม่ตรงกับ master data
async function checkUnmatchedMasterData() {
  const f = State.form;
  if (!f || !f.components) return;

  // Ensure paper_info loaded
  if (!State.masters['_paper_info_all']) {
    try {
      State.masters['_paper_info_all'] = await apiGet('/api/estimate/master_data?type=paper_info');
    } catch (e) { return; }
  }
  const allPapers = State.masters['_paper_info_all'] || [];
  const validCodes = new Set(allPapers.map(p => p.paper_code).filter(Boolean));
  // Build normalized lookup: "acc1s" → "AC C1s"
  const normalizedMap = {};
  validCodes.forEach(code => { normalizedMap[_normalizePaperCode(code)] = code; });

  const issues = [];
  f.components.forEach((c, i) => {
    const code = c.paper?.paper_code;
    if (!code) return;
    if (validCodes.has(code)) return;

    // Auto-fix: ถ้า normalize แล้ว match → แก้ให้เลย ไม่ต้องถาม
    const norm = _normalizePaperCode(code);
    if (normalizedMap[norm]) {
      const fixed = normalizedMap[norm];
      console.log(`[Paper Auto-Fix] "${code}" → "${fixed}" (slash/case normalize)`);
      c.paper.paper_code = fixed;
      // Reload paper from DB with corrected code
      loadPaperGsmOptions(fixed).then(() => {
        autoFillPaperFromDB(c.paper, c.paper.paper_name === 'ต่างประเทศ');
        renderForm();
      });
      return;
    }

    // ไม่พบจริง → ถาม user
    const similar = findSimilarPapers(code, 5);
    issues.push({
      type: 'paper_code',
      compIndex: i,
      original: code,
      suggestions: similar,
    });
  });

  // ตรวจ coating
  const coatings = State.masters['coating_info'] || [];
  if (coatings.length > 0) {
    f.components.forEach((c, i) => {
      (c.addon || []).forEach((a, ai) => {
        if (a.type === 'coating' && a._matchConfidence !== 'matched' && a.info?.type) {
          const matched = coatings.find(co => (co.coating_type || '') === a.info.type);
          if (!matched) {
            const similar = findSimilarCoatings(a.info.type || a.name, 5);
            if (similar.length > 0) {
              issues.push({
                type: 'coating',
                compIndex: i,
                addonIndex: ai,
                original: a.info.type || a.name,
                suggestions: similar,
              });
            }
          }
        }
      });
    });
  }

  if (issues.length > 0) {
    State._unmatchedIssues = issues;
    promptUnmatchedFlow();
  }
}

// ถาม user ผ่าน chat ทีละ issue (รูปแบบเดียวกับ paper mapping note: ปุ่มเรียงตาม %)
function promptUnmatchedFlow() {
  const issues = State._unmatchedIssues || [];
  if (issues.length === 0) {
    delete State._unmatchedIssues;
    return;
  }
  const issue = issues[0];
  State._unmatchedFlow = { active: true, issue };

  if (issue.type === 'paper_code') {
    addChatMsg(
      `📋 Pornchai AI — ตรวจสอบ Master Data\n` +
      `ไม่พบกระดาษ "${issue.original}" ใน Master Data\n` +
      `เสนอกระดาษที่ใกล้เคียงมากที่สุด:`,
      'agent'
    );
    if (issue.suggestions.length > 0) {
      // Top 3 sorted by similarity desc
      const top3 = issue.suggestions.slice(0, 3);
      const btns = top3.map((s, i) => {
        const score = Math.round(s.sim * 100);
        const isPrimary = i === 0;
        const bg = isPrimary ? 'var(--accent, #9b6dcc)' : 'var(--btn-bg, #fff)';
        const fg = isPrimary ? '#fff' : 'var(--text-primary, #333)';
        const star = isPrimary ? '★ ' : '';
        return `<button onclick="App.chooseUnmatchedPaper('${s.code.replace(/'/g, "\\'")}')" style="background:${bg};color:${fg};border:1.5px solid var(--accent, #9b6dcc);padding:8px 14px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px"><span>${star}${s.code}</span><span style="font-size:11px;opacity:0.85;background:${isPrimary?'rgba(255,255,255,0.2)':'rgba(155,109,204,0.12)'};padding:2px 6px;border-radius:6px">${score}%</span></button>`;
      }).join('');
      const customBtn = `<button onclick="App.askCustomPaperPrice()" style="background:transparent;color:var(--accent, #9b6dcc);border:1.5px dashed var(--accent, #9b6dcc);padding:8px 14px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600">✏️ ใส่ราคาเอง</button>`;
      addChatMsg('', 'agent', `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">${btns}${customBtn}</div>`);
    } else {
      addChatMsg(`⚠️ ไม่พบตัวที่ใกล้เคียง`, 'agent');
      const customBtn = `<button onclick="App.askCustomPaperPrice()" style="background:var(--accent, #9b6dcc);color:#fff;border:1.5px solid var(--accent);padding:8px 14px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600">✏️ ใส่ราคาเอง</button>`;
      addChatMsg('', 'agent', `<div style="margin-top:4px">${customBtn}</div>`);
    }
  } else if (issue.type === 'coating') {
    addChatMsg(
      `📋 Pornchai AI — ตรวจสอบ Master Data\n` +
      `ไม่พบ Coating "${issue.original}" ใน Master Data`,
      'agent'
    );
    if (issue.suggestions.length > 0) {
      const top3 = issue.suggestions.slice(0, 3);
      const btns = top3.map((s, i) => {
        const score = Math.round(s.sim * 100);
        const isPrimary = i === 0;
        const bg = isPrimary ? 'var(--accent, #9b6dcc)' : 'var(--btn-bg, #fff)';
        const fg = isPrimary ? '#fff' : 'var(--text-primary, #333)';
        const star = isPrimary ? '★ ' : '';
        const safeName = s.name.replace(/'/g, "\\'");
        return `<button onclick="App.chooseUnmatchedCoating('${safeName}')" style="background:${bg};color:${fg};border:1.5px solid var(--accent, #9b6dcc);padding:8px 14px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px"><span>${star}${s.name}</span><span style="font-size:11px;opacity:0.85;background:${isPrimary?'rgba(255,255,255,0.2)':'rgba(155,109,204,0.12)'};padding:2px 6px;border-radius:6px">${score}%</span></button>`;
      }).join('');
      const skipBtn = `<button onclick="App.skipUnmatched()" style="background:transparent;color:var(--text-muted);border:1px solid var(--border-color);padding:8px 14px;border-radius:10px;cursor:pointer;font-size:13px">ข้าม</button>`;
      addChatMsg('', 'agent', `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">${btns}${skipBtn}</div>`);
    } else {
      addChatMsg(`⚠️ ไม่พบตัวที่ใกล้เคียง`, 'agent');
    }
  }
}

// === Button handlers สำหรับ promptUnmatchedFlow ===
function chooseUnmatchedPaper(code) {
  const flow = State._unmatchedFlow;
  if (!flow || !flow.active || flow.issue.type !== 'paper_code') return;
  const issue = flow.issue;
  const c = State.form.components[issue.compIndex];
  if (c?.paper) {
    const previousCode = c.paper.paper_code;
    if (State._lastSpecText) {
      apiPost('/api/corrections/add', {
        spec_text: State._lastSpecText,
        field: 'paper_code',
        ai_value: previousCode,
        user_value: code,
        context: State.form?.job_name || '',
      }).catch(() => {});
    }
    c.paper.paper_code = code;
    loadPaperGsmOptions(code).then(() => {
      autoFillPaperFromDB(c.paper, c.paper.paper_name === 'ต่างประเทศ');
      renderForm();
    });
    addChatMsg(`✓ เปลี่ยนกระดาษเป็น "${code}" เรียบร้อย`, 'agent');
  }
  nextUnmatchedIssue();
}

function chooseUnmatchedCoating(name) {
  const flow = State._unmatchedFlow;
  if (!flow || !flow.active || flow.issue.type !== 'coating') return;
  const issue = flow.issue;
  const c = State.form.components[issue.compIndex];
  const a = c?.addon?.[issue.addonIndex];
  if (a) {
    // Find coating object by name
    const coatings = State.masters['coating_info'] || [];
    const found = coatings.find(co => (co.coating_type || co.process_name || '') === name);
    if (found) {
      a.info.type = found.coating_type || name;
      a.info.coating_code = found.coating_code || '';
      a.info.coating_option = found.coating_option || '';
      a.type_id = found.type_id || found.process_id || '';
      a._matchConfidence = 'matched';
    }
    renderForm();
    addChatMsg(`✓ เปลี่ยน coating เป็น "${name}" เรียบร้อย`, 'agent');
  }
  nextUnmatchedIssue();
}

function skipUnmatched() {
  addChatMsg(`ข้ามรายการนี้`, 'agent');
  nextUnmatchedIssue();
}

function askCustomPaperPrice() {
  addChatMsg(`💰 พิมพ์ราคาในช่อง chat (บาท/กก.) เช่น "28.50" — ระบบจะคำนวณ sale + B/Kg ให้อัตโนมัติ`, 'agent');
  // ตั้งสถานะรอ user พิมพ์ราคา
  State._unmatchedFlow.awaitingCustomPrice = true;
}

// Handle user response in unmatched flow (เฉพาะ custom price ตอนนี้ — ปุ่มอื่นใช้ button click)
function handleUnmatchedInput(text) {
  const flow = State._unmatchedFlow;
  if (!flow || !flow.active) return false;

  // รอ user พิมพ์ราคา custom หลังกดปุ่ม "ใส่ราคาเอง"
  if (flow.awaitingCustomPrice && flow.issue.type === 'paper_code') {
    const priceMatch = text.trim().match(/([\d.]+)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      const c = State.form.components[flow.issue.compIndex];
      if (c?.paper && price > 0) {
        c.paper.is_custom = true;
        c.paper.paper_cost = String(price);
        c.paper.paper_brand = 'Custom (User-defined)';
        const markup = parseFloat(c.paper.paper_markup) || 10;
        c.paper.paper_sale = (price * (1 + markup / 100)).toFixed(2);
        const gram = parseFloat(c.paper.paper_gram) || 0;
        if (gram > 0) c.paper.paper_bkg = (price * 1000 / gram).toFixed(2);
        renderForm();
        addChatMsg(`✓ ใช้ราคา custom: ${price.toFixed(2)} บาท/กก. (markup ${markup}%, sale ${c.paper.paper_sale} บาท)`, 'agent');
      }
      nextUnmatchedIssue();
      return true;
    }
    addChatMsg(`⚠️ กรุณาพิมพ์ตัวเลขราคา เช่น "28.50"`, 'agent');
    return true;
  }
  return false;
}

function nextUnmatchedIssue() {
  if (!State._unmatchedIssues) return;
  State._unmatchedIssues.shift();
  delete State._unmatchedFlow;
  if (State._unmatchedIssues.length > 0) {
    setTimeout(() => promptUnmatchedFlow(), 400);
  } else {
    delete State._unmatchedIssues;
    // Continue with normal fill flow
    setTimeout(() => {
      const missing = checkMissingFields(State.form);
      if (missing.length > 0) startFillFlow(true);
    }, 500);
  }
}

// Lookup AI's original value for a given fieldSource key
function getAIFieldValue(field) {
  const data = State._lastParsedData;
  if (!data) return null;
  // Top-level fields
  if (field === 'job_name') return data.job_name;
  if (field === 'ink_type') return data.ink_type;
  if (field === 'print_type') return data.print_type;
  if (field === 'customer') return data.customer_search || (typeof data.customer === 'string' ? data.customer : data.customer?.customer_name);
  if (field === 'ae') return data.ae_search || (typeof data.ae === 'string' ? data.ae : data.ae?.emp_name);
  // qty.0 / qty.1 ...
  const qm = field.match(/^qty\.(\d+)$/);
  if (qm) return Array.isArray(data.qty) ? data.qty[parseInt(qm[1])] : data.qty;
  // comp.<i>.xxx
  const cm = field.match(/^comp\.(\d+)\.(.+)$/);
  if (cm) {
    const c = data.components?.[parseInt(cm[1])];
    if (!c) return null;
    const sub = cm[2];
    if (sub === 'name') return c.component_name || c.name;
    if (sub === 'paper_code') return c.paper?.paper_code;
    if (sub === 'paper_gram') return c.paper?.paper_gram;
    if (sub === 'box_type') return String(c.box_type_id || c.box_type?.type_id || '');
    if (sub === 'color_out') return String(c.color?.outside ?? '');
    if (sub === 'color_in') return String(c.color?.inside ?? '');
    if (sub === 'width') return c.packaging_size?.width;
    if (sub === 'length') return c.packaging_size?.length;
    if (sub === 'depth') return c.packaging_size?.depth;
  }
  return null;
}
function toggleSection(id) { $(id).classList.toggle('collapsed'); }

// Form field setters
function setField(key, val) {
  State._formTouched = true;
  trackCorrection(key, val);
  State.form[key] = val;
  // Auto-calc run-on when % changes (อัพเดท DOM โดยตรง ไม่ renderForm)
  if (key === 'run_on_percent') {
    autoCalcRunOn();
    // อัพเดทค่า run-on ใน DOM โดยตรง
    document.querySelectorAll('input[data-runon]').forEach(el => {
      const idx = parseInt(el.dataset.runon);
      el.value = State.form.run_on_values[idx] || '';
    });
    return;
  }
  // B9: Auto-fetch exchange rate when currency changes
  if (key === 'currency_no') { fetchExchangeRate(val); return; }
  // Sync is_reprinted when job_type changes
  if (key === 'job_type') { State.form.is_reprinted = (val === 'repeat'); }
  // A1: Re-render machine list when print_type changes
  if (key === 'print_type') { State.form.machine_id = ''; renderForm(); return; }
  // Re-render for checkbox fields that reveal extra inputs
  // Initialize f_data when multi-F is toggled on
  if (key === 'has_multi_f' && val && State.form.f_data.length === 0) {
    State.form.f_data.push(freshFData());
  }
  // Auto-set Document Status based on Request for approve
  if (key === 'request_approve') {
    State.form.doc_status = val ? 'Pending' : 'Draft';
  }
  // Auto-fill customer as "ลูกค้าใหม่" when checked (matching original system)
  if (key === 'new_customer') {
    if (val) {
      State.form.customer = { customer_id: 'C9999998', customer_name: 'C9999998: ลูกค้าใหม่' };
      State.form.credit_term = 'มัดจำ 100% ก่อนพิมพ์';
    } else {
      State.form.customer = { customer_id: '', customer_name: '' };
      State.form.credit_term = '';
    }
  }
  if (['customer_margin','customer_gift','has_customer_gift','request_approve','new_customer','has_multi_f','limit_color'].includes(key)) renderForm();
}
function setQty(i, val) {
  State._formTouched = true;
  State.form.qty[i] = val;
  // Auto-recalc run-on value when qty changes
  autoCalcRunOn();
}
function autoCalcRunOn() {
  const f = State.form;
  if (!f) return;
  const pct = parseFloat(f.run_on_percent) || 0;
  if (pct > 0) {
    f.run_on_values = f.qty.map(q => String(Math.ceil((parseInt(q) || 0) * pct / 100)));
  }
}
function setComp(i, key, val) {
  State._formTouched = true;
  State.form.components[i][key] = val;
  // Re-render for checkbox fields
  if (['foil_stamp','emboss','deboss','has_special_color','corrugate_type','component_type'].includes(key)) renderForm();
}
function setCompSize(i, key, val) {
  State.form.components[i].packaging_size[key] = val;
  trackCorrection('comp.' + i + '.' + key, val);
  // Debounce refresh for real-time 3D/Dieline update
  clearTimeout(State._sizeRefreshTimer);
  State._sizeRefreshTimer = setTimeout(() => refreshBoxViews(), 300);
}
// AI กรอกขนาดให้ — ดึง _pendingSize ลงฟอร์ม
function applyPendingSize(i) {
  const c = State.form.components[i];
  if (!c || !c._pendingSize) return;
  const ps = c._pendingSize;
  const typeId = parseInt(c.box_type?.type_id) || 0;
  c.packaging_size.width = ps.width || c.packaging_size.width || '';
  c.packaging_size.length = ps.length || c.packaging_size.length || '';
  if (ps.depth != null && ps.depth !== '') c.packaging_size.depth = ps.depth;
  if (ps.glue_flap) c.packaging_size.glue_flap = ps.glue_flap;
  if (ps.tuck_flap) c.packaging_size.tuck_flap = ps.tuck_flap;
  if (ps.dust_flap) c.packaging_size.dust_flap = ps.dust_flap;
  else if ([5, 6].includes(typeId) && !c.packaging_size.dust_flap) c.packaging_size.dust_flap = '25';
  delete c._pendingSize;
  delete c._pendingTemplate;
  renderForm();
}
function getState() { return State; }
// อัพเดท inch + fold/open size ใน DOM โดยตรง (ไม่ renderForm)
function updateSizeCalc(i) {
  const comp = State.form.components[i];
  if (!comp) return;
  const sz = comp.packaging_size;
  const typeId = parseInt(comp.box_type?.type_id || comp.box_template?.type_id) || 0;

  // อัพเดท inch ทุกช่อง
  ['width','length','depth','glue_flap','tuck_flap','dust_flap','ol'].forEach(k => {
    const el = document.querySelector(`[data-inch="${i}_${k}"]`);
    if (el) el.value = mm2inchLegacy(parseFloat(sz[k]) || 0) || '';
  });

  // คำนวณ Fold/Open/Packing Size
  const w = parseFloat(sz.width) || 0, l = parseFloat(sz.length) || 0, d = parseFloat(sz.depth) || 0;
  const tf = parseFloat(sz.tuck_flap) || 0, g = parseFloat(sz.glue_flap) || 0;
  const ol = parseFloat(sz.ol) || 0, dust = parseFloat(sz.dust_flap) || 0;

  let fW, fL, fD;
  if (typeId === 8) { fW = 2 * w + tf; fL = l; fD = d; }
  else { fW = w; fL = l; fD = d; }

  let oW = 0, oL = 0;
  switch (typeId) {
    case 1: case 2: oW = 2 * (w + tf) + d; oL = 2 * (w + l) + g; break;
    case 3: case 4: oW = tf + w + d + w / 2 + ol; oL = 2 * (w + l) + g; break;
    case 5: oW = w + 4 * d; oL = l + 4 * d + 2 * dust; break;
    case 6: oW = w + 4 * d + 2 * dust + 2 * ol; oL = l + 4 * d + 2 * dust + 2 * ol; break;
    case 7: oW = 2 * (l + dust) + w; oL = 2 * (l + d) + l; break;
    case 8: oW = tf + 2 * d + w / 2 + ol; oL = 2 * (w + l) + g; break;
    case 9: oW = d; oL = 2 * (w + l) + g; break;
    case 10: oW = l + d; oL = 2 * w + g; break;
    case 11: oW = 2 * w + d; oL = 2 * (w + l) + g; break;
    case 12: oW = parseFloat(sz.open_w) || w; oL = parseFloat(sz.open_l) || l; break;
  }

  // Packing Size (ตาม template — ตรงกับ renderBoxSizeSection)
  let pkW = 0, pkL = 0;
  switch (typeId) {
    case 1: case 2: pkW = d + 2 * (w + tf); pkL = l + w; break;
    case 3: pkW = d + w + tf + ol + w / 2; pkL = l + w; break;
    case 4: pkW = d + w + tf; pkL = l + w; break;
    case 5: pkW = 4 * d + w; pkL = 2 * dust + 4 * d + l; break;
    case 6: pkW = 2 * dust + 4 * d + 2 * ol + w; pkL = 2 * dust + 4 * d + 2 * ol + l; break;
    case 7: pkW = w; pkL = l + d; break;
    case 8: pkW = tf + 2 * d; pkL = l + w; break;
    case 9: pkW = d; pkL = l + w; break;
    case 10: pkW = l + d; pkL = w; break;
    case 11: pkW = d + 2 * w; pkL = l + w; break;
    case 12: pkW = parseFloat(sz.packing_w) || w; pkL = parseFloat(sz.packing_l) || l; break;
  }

  // อัพเดท Fold/Open/Packing Size ใน DOM
  const calcEls = document.querySelectorAll(`[data-calc="${i}"]`);
  calcEls.forEach(el => {
    const ct = el.dataset.calcType;
    if (ct === 'fw') el.value = fW || '';
    if (ct === 'fl') el.value = fL || '';
    if (ct === 'fd') el.value = fD || '';
    if (ct === 'fw_in') el.value = mm2inchLegacy(fW) || '';
    if (ct === 'fl_in') el.value = mm2inchLegacy(fL) || '';
    if (ct === 'fd_in') el.value = mm2inchLegacy(fD) || '';
    if (ct === 'ow') el.value = oW || '';
    if (ct === 'ol') el.value = oL || '';
    if (ct === 'ow_in') el.value = mm2inchLegacy(oW) || '';
    if (ct === 'ol_in') el.value = mm2inchLegacy(oL) || '';
    if (ct === 'pw') el.value = pkW ? pkW.toFixed(0) : '';
    if (ct === 'pl') el.value = pkL ? pkL.toFixed(0) : '';
    if (ct === 'pw_in') el.value = mm2inchLegacy(pkW) || '';
    if (ct === 'pl_in') el.value = mm2inchLegacy(pkL) || '';
  });

  // อัพเดท ลอนขนานด้าน dropdown (real-time ตามกว้าง/ยาวจริง)
  const fluteSelect = document.querySelector(`[data-flute-side="${i}"]`);
  if (fluteSelect) {
    const useW = oW || w, useL = oL || l;
    const shortSide = Math.min(useW || 9999, useL || 9999);
    const longSide = Math.max(useW || 0, useL || 0);
    const shortLabel = shortSide < 9999 && shortSide > 0 ? Math.round(shortSide) : '?';
    const longLabel = longSide > 0 ? Math.round(longSide) : '?';
    const opts = fluteSelect.options;
    if (opts[1]) opts[1].text = `ด้านสั้นกล่อง: ${shortLabel} mm`;
    if (opts[2]) opts[2].text = `ด้านยาวกล่อง: ${longLabel} mm`;
  }
}
function setCompPaper(i, key, val) {
  const p = State.form.components[i].paper;
  p[key] = val;
  if (key === 'paper_code' || key === 'paper_gram') trackCorrection('comp.' + i + '.' + key, val);
  // Auto-calc sale = cost * (1 + markup/100) + roll_cut (A4)
  if (['paper_cost', 'paper_markup', 'paper_roll_cut'].includes(key)) {
    const cost = parseFloat(p.paper_cost) || 0;
    const markup = parseFloat(p.paper_markup) || 10;
    const rollCut = parseFloat(p.paper_roll_cut) || 0;
    p.paper_sale = (cost * (1 + markup / 100) + rollCut).toFixed(2);
    // Auto-calc B/Kg (A5)
    const gram = parseFloat(p.paper_gram) || 0;
    if (gram > 0 && cost > 0) {
      p.paper_bkg = (cost * 1000 / gram).toFixed(2);
    }
    // อัพเดท Sale + B/Kg ใน DOM โดยตรง (ไม่ renderForm เพื่อไม่ให้ focus หาย)
    const saleEl = document.querySelector(`input[data-field="paper_sale_${i}"]`);
    if (saleEl) saleEl.value = p.paper_sale;
    const bkgEl = document.querySelector(`input[data-field="paper_bkg_${i}"]`);
    if (bkgEl) bkgEl.value = p.paper_bkg || '';
  }
  // Load GSM options when paper_code changes + auto-fill brand/cost/sale
  if (key === 'paper_code') {
    // Set paper_type from sub-code label (e.g. "Matt Art")
    const subCode = (State.masters._paper_sub_codes || []).find(sc => sc.code === val);
    p.paper_type = subCode?.type || val;
    if (!p.paper_name) p.paper_name = 'ในประเทศ';
    const prevGram = p.paper_gram; // remember current GSM
    loadPaperGsmOptions(val).then(() => {
      // Keep previous GSM if available in new list, otherwise pick first
      const gsmList = State.masters['paper_gsm_' + val] || [];
      if (prevGram && gsmList.includes(String(prevGram))) {
        p.paper_gram = String(prevGram);
      } else {
        p.paper_gram = gsmList.length > 0 ? gsmList[0] : '';
      }
      // Auto-fill brand + cost + sale from DB
      autoFillPaperFromDB(p, p.paper_name === 'ต่างประเทศ');
      renderForm();
    });
    return;
  }
  // Auto-fill brand + cost when paper_name selected
  if (key === 'paper_name') {
    // "ในประเทศ"/"ต่างประเทศ" — auto-pick first paper from DB and fill brand/cost
    autoFillPaperFromDB(p, val === 'ต่างประเทศ');
    renderForm();
    return;
  }
  // Auto-fill brand + cost when gsm changes
  if (key === 'paper_gram') {
    if (!p.paper_name) p.paper_name = 'ในประเทศ'; // default domestic
    p.paper_brand = '';
    p.paper_cost = '';
    p.paper_sale = '';
    loadPaperGsmOptions(p.paper_code).then(() => {
      autoFillPaperFromDB(p, p.paper_name === 'ต่างประเทศ');
      renderForm();
    });
    return;
  }
  if (key === 'paper_price_per_sheet' || key === 'is_custom') renderForm();
}

// Auto-fill Paper Brand, Cost, Sale from master data
function autoFillPaperFromDB(p, isImport) {
  // Auto-set markup based on import/domestic (10% domestic, 13% import)
  p.paper_markup = isImport ? '13' : '10';
  p.paper_source_id = isImport ? '2' : '1';

  const listKey = 'paper_list_' + (p.paper_code||'') + '_' + (p.paper_gram||'');
  const list = State.masters[listKey] || [];
  if (list.length > 0) {
    const first = list[0]; // pick first matching paper
    p.paper_brand = first.paper_brand || '';
    const cost = isImport ? (parseFloat(first.paper_cost_import) || parseFloat(first.paper_cost) || 0) : (parseFloat(first.paper_cost) || 0);
    p.paper_cost = cost ? String(cost) : '';
    p.paper_thickness = first.thickness_mm || first.paper_thickness || '';
    // Auto-calc sale = cost * (1 + markup/100) + rollCut
    if (cost > 0) {
      const markup = parseFloat(p.paper_markup) || 10;
      const rollCut = parseFloat(p.paper_roll_cut) || 0;
      p.paper_sale = (cost * (1 + markup / 100) + rollCut).toFixed(2);
      // Auto-calc B/Kg
      const gram = parseFloat(p.paper_gram) || 0;
      if (gram > 0) p.paper_bkg = (cost * 1000 / gram).toFixed(2);
    }
  }
}

async function loadPaperGsmOptions(paperCode) {
  if (!paperCode) return;
  const cacheKey = 'paper_gsm_' + paperCode;
  if (State.masters[cacheKey]) return;
  try {
    // Load all paper_info once and cache
    if (!State.masters['_paper_info_all']) {
      State.masters['_paper_info_all'] = await apiGet('/api/estimate/master_data?type=paper_info');
    }
    const allPapers = State.masters['_paper_info_all'] || [];
    const filtered = allPapers.filter(d => d.paper_code === paperCode);
    const gsmList = [...new Set(filtered.map(d => String(d.gram || '')).filter(g => g && g !== '0'))].sort((a,b) => Number(a)-Number(b));
    State.masters[cacheKey] = gsmList;
    // Build paper name/brand list per gsm
    gsmList.forEach(gsm => {
      const listKey = 'paper_list_' + paperCode + '_' + gsm;
      if (!State.masters[listKey]) {
        const papers = filtered.filter(d => String(d.gram) === gsm);
        // Sort: non-FSC first (is_fsc=0), then FSC (is_fsc=1) — matching legacy system default
        papers.sort((a, b) => (a.is_fsc || 0) - (b.is_fsc || 0));
        // Deduplicate by id (API returns duplicates)
        const seen = new Set();
        const unique = papers.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
        State.masters[listKey] = unique.map(p => ({
          paper_name: p.paper_brand_supplier || ((p.brand || '') + ' : ' + (p.paper_type || '')),
          paper_brand: p.brand || '',
          paper_cost: p.price || 0,
          paper_cost_import: p.price_import || 0,
          paper_thickness: p.thickness_mm || 0,
          is_fsc: p.is_fsc || 0,
        }));
      }
    });
  } catch(e) {
    State.masters[cacheKey] = ['100','120','150','190','210','230','250','270','300','310','350','400','450','500'];
  }
}
function setCompColor(i, key, val) {
  State.form.components[i].color[key] = val;
  if (key === 'outside') trackCorrection('comp.' + i + '.color_out', val);
  else if (key === 'inside') trackCorrection('comp.' + i + '.color_in', val);
  // ถ้าติ๊กมีสีพิเศษ ให้เพิ่ม 1 แถวอัตโนมัติ
  if (key === 'is_special_ink' && val) {
    const clr = State.form.components[i].color;
    if (!clr.special_ink || clr.special_ink.length === 0) {
      clr.special_ink = [{ ink_color: '', ink_type: 'หมึกพิเศษธรรมดา', printing_style: 'ตีพื้น' }];
    }
  }
  if (['is_special_ink','black_printing_outside','black_printing_inside'].includes(key)) renderForm();
}
// Color per-F management (A2)
function addColorPerF(ci) {
  // Duplicate the color section for another F code
  const c = State.form.components[ci];
  if (!c._color_per_f) c._color_per_f = [];
  c._color_per_f.push({ f_code: '', outside: c.color.outside || '', inside: c.color.inside || '0', is_special_ink: false, special_ink: [] });
  renderForm();
}
function removeColorPerF(ci) {
  const c = State.form.components[ci];
  if (c._color_per_f && c._color_per_f.length > 0) { c._color_per_f.pop(); renderForm(); }
}
function copyColorPerF(ci) {
  const c = State.form.components[ci];
  if (!c._color_per_f) c._color_per_f = [];
  c._color_per_f.push({ ...c.color, special_ink: [...(c.color.special_ink || [])] });
  renderForm();
}
// Per-F color setters
function setColorPerF(ci, fi, key, val) {
  const c = State.form.components[ci];
  if (!c._color_per_f?.[fi]) return;
  c._color_per_f[fi][key] = val;
  if (key === 'is_special_ink' && val && (!c._color_per_f[fi].special_ink || c._color_per_f[fi].special_ink.length === 0)) {
    c._color_per_f[fi].special_ink = [{ ink_color: '', ink_type: 'หมึกพิเศษธรรมดา', printing_style: 'ตีพื้น' }];
  }
  if (['is_special_ink','f_code'].includes(key)) renderForm();
}
function addSpecialInkPerF(ci, fi) {
  const c = State.form.components[ci];
  if (!c._color_per_f?.[fi]) return;
  if (!c._color_per_f[fi].special_ink) c._color_per_f[fi].special_ink = [];
  c._color_per_f[fi].special_ink.push({ ink_color: '', ink_type: 'หมึกพิเศษธรรมดา', printing_style: 'ตีพื้น' });
  renderForm();
}
function removeSpecialInkPerF(ci, fi, si) {
  const c = State.form.components[ci];
  if (!c._color_per_f?.[fi]?.special_ink) return;
  c._color_per_f[fi].special_ink.splice(si, 1);
  renderForm();
}
function setSpecialInkPerF(ci, fi, si, key, val) {
  const c = State.form.components[ci];
  if (!c._color_per_f?.[fi]?.special_ink?.[si]) return;
  c._color_per_f[fi].special_ink[si][key] = val;
}
function setCompCoating(i, key, val) { State.form.components[i].coating[key] = val; }
function setCompBoxType(i, val) {
  State._formTouched = true;
  trackCorrection('comp.' + i + '.box_type', val);
  const c = State.form.components[i];
  const oldTypeId = c.box_type?.type_id || '';
  const newBt = (State.masters.boxtemplate_info || []).find(b => String(b.type_id) === String(val));

  // Same template — do nothing
  if (String(oldTypeId) === String(val)) return;

  // Save current size + flute_side to memory (keyed by typeId)
  if (!c._savedSizes) c._savedSizes = {};
  if (oldTypeId && c.packaging_size) {
    c._savedSizes[oldTypeId] = { ...c.packaging_size, _flute_side: c.corrugated?.flute_side || '' };
  }

  // Apply new template
  if (newBt) {
    const typeId = parseInt(newBt.type_id) || 0;
    c.box_type = {
      type_id: newBt.type_id, type_name: newBt.type_name,
      glued_spot: newBt.glued_spot, packing_layer: newBt.packing_layer,
      is_digital_diecut: false
    };
    // Restore ลอนขนานด้าน ถ้ามีค่าเดิม, ไม่ reset
    if (c.corrugated && c._savedSizes[val]?._flute_side) {
      c.corrugated.flute_side = c._savedSizes[val]._flute_side;
    }

    // Check if we have saved values for this template
    if (c._savedSizes[val]) {
      c.packaging_size = { ...c._savedSizes[val] };
    } else if (c._pendingSize && (c._pendingSize.width || c._pendingSize.length)) {
      // AI parsed size exists — use it instead of clearing
      c.packaging_size = {
        width: c._pendingSize.width || '', length: c._pendingSize.length || '', depth: c._pendingSize.depth || '',
        glue_flap: c._pendingSize.glue_flap || '15', tuck_flap: c._pendingSize.tuck_flap || '15',
        dust_flap: [5, 6].includes(typeId) ? '25' : (c._pendingSize.dust_flap || ''),
        ol: '',
      };
    } else {
      // New template — clear dimensions, set defaults
      c.packaging_size = {
        width: '', length: '', depth: '',
        glue_flap: '15', tuck_flap: '15',
        dust_flap: [5, 6].includes(typeId) ? '25' : '',
        ol: '',
      };
    }
  } else {
    c.box_type = { type_id: val };
  }
  renderForm();
}
function setCompBoxField(i, key, val) {
  State.form.components[i].box_type[key] = val;
  clearTimeout(State._sizeRefreshTimer);
  State._sizeRefreshTimer = setTimeout(() => refreshBoxViews(), 300);
}
// Addon setters
function setAddon(ci, ai, key, val) { State.form.components[ci].addon[ai][key] = val; }
function setAddonInfo(ci, ai, key, val) { if (!State.form.components[ci].addon[ai].info) State.form.components[ci].addon[ai].info = {}; State.form.components[ci].addon[ai].info[key] = val; }
function addAddon(ci) { State.form.components[ci].addon.push(freshAddon()); renderForm(); }
function addCoating(ci) {
  const ad = freshAddon('coating');
  ad.name = 'Coating';
  State.form.components[ci].addon.push(ad);
  renderForm();
}
function addAddonFromSelect(ci) {
  const sel = document.getElementById('addonSelect_' + ci);
  const type = sel ? sel.value : '';
  if (!type) { toast('กรุณาเลือก process ก่อน', 'warning'); return; }
  const ad = freshAddon(type);
  ad.name = { coating: 'Coating', foilstamp: 'Foil stamp', emboss: 'Emboss', deboss: 'Deboss' }[type] || type;
  State.form.components[ci].addon.push(ad);
  renderForm();
}
function removeAddon(ci, ai) { State.form.components[ci].addon.splice(ai, 1); renderForm(); }
// Toggle addon by type (checkbox style)
function toggleAddon(ci, type, checked) {
  const addons = State.form.components[ci].addon;
  if (checked) {
    const ad = freshAddon(type);
    ad.name = { coating: 'Coating', foilstamp: 'Foil stamp', emboss: 'Emboss', deboss: 'Deboss' }[type] || type;
    addons.push(ad);
  } else {
    // Remove ALL addons of this type
    State.form.components[ci].addon = addons.filter(a => a.type !== type);
  }
  renderForm();
}
function addFoilStamp(ci) {
  const ad = freshAddon('foilstamp');
  ad.name = 'Foil stamp';
  State.form.components[ci].addon.push(ad);
  renderForm();
}
function getAddonByType(ci, type) {
  const addons = State.form.components[ci].addon || [];
  return { addon: addons.find(a => a.type === type), index: addons.findIndex(a => a.type === type) };
}
// Set coating sub-field
function setCoatingField(ci, key, val) {
  const { addon, index } = getAddonByType(ci, 'coating');
  if (addon) { if (!addon.info) addon.info = {}; addon.info[key] = val; }
}
// Addon multi-size (A1)
function setAddonSize(ci, ai, si, key, val) {
  const ad = State.form.components[ci].addon[ai];
  if (!ad.info) ad.info = {};
  if (!ad.info.sizes) ad.info.sizes = [{ w: '', l: '' }];
  if (!ad.info.sizes[si]) ad.info.sizes[si] = { w: '', l: '' };
  ad.info.sizes[si][key] = val;
}
// F-code assignment per addon (Multi-F)
function addAddonFCode(ci, ai, fCode) {
  if (!fCode) return;
  const ad = State.form.components[ci].addon[ai];
  if (!ad.f_codes) ad.f_codes = [];
  if (!ad.f_codes.includes(fCode)) { ad.f_codes.push(fCode); renderForm(); }
}
function removeAddonFCode(ci, ai, fi) {
  const ad = State.form.components[ci].addon[ai];
  if (ad.f_codes?.length > 0) { ad.f_codes.splice(fi, 1); renderForm(); }
}

function addAddonSize(ci, ai) {
  const ad = State.form.components[ci].addon[ai];
  if (!ad.info) ad.info = {};
  if (!ad.info.sizes) ad.info.sizes = [{ w: '', l: '' }];
  ad.info.sizes.push({ w: '', l: '' });
  renderForm();
}
function removeAddonSize(ci, ai, si) {
  const ad = State.form.components[ci].addon[ai];
  if (ad.info?.sizes?.length > 1) { ad.info.sizes.splice(si, 1); renderForm(); }
}
// Comp process setters
function setCompProc(ci, pi, key, val) { State.form.components[ci].comp_process[pi][key] = val; }
function addCompProc(ci) { State.form.components[ci].comp_process.push(freshCompProcess()); renderForm(); }
function removeCompProc(ci, pi) { State.form.components[ci].comp_process.splice(pi, 1); renderForm(); }
// Comp packing setters
function togglePacking(ci, type, checked) {
  const c = State.form.components[ci];
  c['_pk_' + type] = checked;
  // Update packing_detail text
  const types = ['kraftwrap','paperband','carton','pallet'];
  const active = types.filter(t => c['_pk_' + t]);
  if (active.length > 0 && !c.packing_detail) {
    c.packing_detail = active.join(', ');
  }
  renderForm();
}
function setCompPacking(ci, pi, key, val) { const flat = State.form.components[ci].packing.flat(); if (flat[pi]) flat[pi][key] = val; }
function setCompPackingInfo(ci, pi, key, val) { const flat = State.form.components[ci].packing.flat(); if (flat[pi] && flat[pi].info) flat[pi].info[key] = val; }
function addCompPacking(ci) { State.form.components[ci].packing.push(freshPacking()); renderForm(); }
function removeCompPacking(ci, pi) { State.form.components[ci].packing.splice(pi, 1); renderForm(); }
// Process info setters
function setProcInfo(section, i, key, val) { if (State.form.process_info[section]?.[i]) State.form.process_info[section][i][key] = val; }
function setProcInfoLine(section, i, key, val) {
  const item = State.form.process_info[section]?.[i];
  if (item) { if (!item.line) item.line = [{}]; if (!item.line[0]) item.line[0] = {}; item.line[0][key] = val; }
}
function addProcInfo(section) { State.form.process_info[section].push(freshProcessInfoItem()); renderForm(); }
function removeProcInfo(section, i) { State.form.process_info[section].splice(i, 1); renderForm(); }
function setProcess(i, key, val) { State.form.process[i][key] = val; }
function setDelivery(i, key, val) {
  State.form.delivery[i][key] = val;
  if (key === 'split_delivery' && val && !State.form.delivery[i].splits) {
    State.form.delivery[i].splits = [{ qty: '', date: '', remark: '' }];
  }
}
function setDeliveryFlat(i, key, val) {
  if (!State.form.delivery[i]) State.form.delivery[i] = freshDelivery();
  State.form.delivery[i][key] = val;
}
function onDelivDestSelect(i, name) {
  if (!State.form.delivery[i]) State.form.delivery[i] = freshDelivery();
  State.form.delivery[i].destinationName = name;
  State.form.delivery[i].province = name;
  const info = State.masters['delivery_rate_info'] || [];
  const match = info.find(d => d.name === name);
  if (match) State.form.delivery[i].destinationId = match.destination_id || '';
}
// Delivery date input (DD/MM/YYYY text → store as YYYY-MM-DD)
function onDelivDateInput(i, val) {
  if (!State.form.delivery[i]) State.form.delivery[i] = freshDelivery();
  const iso = parseDateDMY(val);
  if (iso) State.form.delivery[i].dueDate = iso;
}
// Delivery date pick (from calendar picker → YYYY-MM-DD)
function onDelivDatePick(i, isoVal) {
  if (!State.form.delivery[i]) State.form.delivery[i] = freshDelivery();
  State.form.delivery[i].dueDate = isoVal;
}
// Autocomplete จังหวัดจาก master data (ค้นหา real-time ไม่ต้อง API)
function acDelivLocalSearch(i, term) {
  const listId = 'acDeliv' + i;
  const list = $(listId);
  if (!list) return;
  const info = State.masters['delivery_rate_info'] || [];
  const names = [...new Set(info.map(d => d.name).filter(Boolean))];

  if (!State.form.delivery[i]) State.form.delivery[i] = freshDelivery();
  // ถ้าว่าง → clear ค่า
  if (!term.trim()) {
    State.form.delivery[i].destinationName = '';
    State.form.delivery[i].province = '';
    State.form.delivery[i].destinationId = '';
    State.form.delivery[i]._inputText = undefined;
    list.classList.remove('show');
    return;
  }

  // ค้นหา
  const t = term.toLowerCase();
  const matches = names.filter(n => n.toLowerCase().includes(t));

  if (matches.length === 0) {
    list.classList.remove('show');
    // ไม่ตรง list = ค่าว่าง
    State.form.delivery[i].destinationName = '';
    State.form.delivery[i].province = '';
    State.form.delivery[i].destinationId = '';
    return;
  }

  list.innerHTML = matches.slice(0, 15).map(name =>
    `<div class="autocomplete-item" onclick="App.acDelivLocalSelect(${i},'${esc(name)}')">${name}</div>`
  ).join('');
  list.classList.add('show');
}
function acDelivLocalSelect(i, name) {
  onDelivDestSelect(i, name);
  if (State.form.delivery[i]) State.form.delivery[i]._inputText = name;
  const inp = $('acDelivDest' + i);
  if (inp) inp.value = name;
  $('acDeliv' + i)?.classList.remove('show');
}
function validateDelivDest(i) {
  const dl = State.form.delivery[i];
  if (!dl) return;
  const inp = $('acDelivDest' + i);
  const typedVal = inp ? inp.value.trim() : '';
  const info = State.masters['delivery_rate_info'] || [];
  const names = info.map(d => d.name).filter(Boolean);
  if (typedVal && !names.includes(typedVal)) {
    // ไม่ตรง list → clear ค่า + แสดง error
    dl.destinationName = '';
    dl.destinationId = '';
    dl._inputText = typedVal; // เก็บค่าที่พิมพ์ไว้แสดง error
    renderForm();
  } else if (typedVal) {
    dl._inputText = undefined; // clear error
  }
}
// Searchable province dropdown — uses FIXED position portal (never clipped by parent overflow)
let _delivDropEl = null;
let _delivDropDi = -1;
let _delivDropInput = null;

function _getDelivDestList() {
  const info = State.masters['delivery_rate_info'] || [];
  const seen = new Set();
  return info.filter(d => d.name && !seen.has(d.name) && seen.add(d.name)).map(d => d.name);
}

function _ensureDropPortal() {
  if (!_delivDropEl) {
    _delivDropEl = document.createElement('div');
    _delivDropEl.id = 'delivDropPortal';
    _delivDropEl.style.cssText = 'display:none;position:fixed;max-height:240px;overflow-y:auto;border-radius:10px;z-index:99999;min-width:200px';
    document.body.appendChild(_delivDropEl);
  }
  return _delivDropEl;
}

function showDelivDropdown(di, input) {
  _delivDropDi = di;
  _delivDropInput = input;
  filterDelivDropdown(di, input);
}

function filterDelivDropdown(di, input) {
  const drop = _ensureDropPortal();
  _delivDropDi = di;
  _delivDropInput = input;
  const q = (input.value || '').trim().toLowerCase();
  const all = _getDelivDestList();
  const filtered = q ? all.filter(n => n.toLowerCase().includes(q)) : all;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#2d1b4e' : '#ffffff';
  const border = isDark ? '#7c3aed' : '#9b6dcc';
  const hoverBg = isDark ? '#5b2d8e' : '#f0e8f7';
  const textCol = isDark ? '#f0eaf8' : '#1a1225';
  const mutedCol = isDark ? '#a090b8' : '#6b5f78';
  const accentCol = isDark ? '#c4a0ff' : '#7c3aed';

  if (filtered.length === 0) {
    drop.innerHTML = `<div style="padding:14px 16px;font-size:13px;color:${mutedCol};text-align:center"><i class="fas fa-map-marker-alt" style="margin-right:6px;opacity:0.5"></i>ไม่พบ "${escapeHtml(q)}"</div>`;
  } else {
    drop.innerHTML = filtered.map(n => {
      const hl = q ? n.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi'), `<b style="color:${accentCol}">$1</b>`) : n;
      return `<div data-name="${escapeHtml(n)}" style="padding:9px 16px;font-size:13px;cursor:pointer;color:${textCol};transition:background 0.1s"
        onmouseenter="this.style.background='${hoverBg}'" onmouseleave="this.style.background=''"
        onmousedown="App.selectDelivDest(${di},this.dataset.name)">${hl}</div>`;
    }).join('');
  }

  // Position: above input
  const rect = input.getBoundingClientRect();
  drop.style.cssText = `display:block;position:fixed;left:${rect.left}px;width:${Math.max(rect.width, 220)}px;max-height:240px;overflow-y:auto;border-radius:10px;z-index:99999;background:${bg};border:2px solid ${border};box-shadow:0 -8px 30px rgba(0,0,0,${isDark?0.4:0.12});bottom:${window.innerHeight - rect.top + 4}px`;
}

function selectDelivDest(di, name) {
  if (_delivDropInput) _delivDropInput.value = name;
  hideDelivDropdown(di);
  onDelivDestSelect(di, name);
}

function hideDelivDropdown(di) {
  if (_delivDropEl) _delivDropEl.style.display = 'none';
}

function toggleSplitDelivery(checked) {
  if (!State.form.delivery[0]) State.form.delivery[0] = freshDelivery();
  State.form.delivery[0].split_delivery = checked;
  if (checked) {
    // เริ่มต้น 1 รายการ (copy จาก delivery[0])
    if (State.form.delivery.length < 1) State.form.delivery.push(freshDelivery());
    State.form.delivery.forEach(dl => { if (!dl.f_items) dl.f_items = [{ f_code: '', qty: '' }]; });
  }
  renderForm();
}
function addDeliveryRound() {
  const dl = freshDelivery();
  dl.split_delivery = true;
  dl.qty = '';
  State.form.delivery.push(dl);
  renderForm();
}
function setDelivField(di, key, val) {
  if (State.form.delivery[di]) State.form.delivery[di][key] = val;
}
function removeDeliveryRound(di) {
  if (State.form.delivery.length > 1) { State.form.delivery.splice(di, 1); renderForm(); }
}
function setDelivFItem(di, fii, key, val) {
  if (!State.form.delivery[di].f_items) State.form.delivery[di].f_items = [];
  if (!State.form.delivery[di].f_items[fii]) State.form.delivery[di].f_items[fii] = { f_code: '', qty: '' };
  State.form.delivery[di].f_items[fii][key] = val;
}
function addDelivFItem(di) {
  if (!State.form.delivery[di].f_items) State.form.delivery[di].f_items = [];
  State.form.delivery[di].f_items.push({ f_code: '', qty: '' });
  renderForm();
}
function removeDelivFItem(di, fii) {
  if (State.form.delivery[di]?.f_items?.length > 1) { State.form.delivery[di].f_items.splice(fii, 1); renderForm(); }
}
// Legacy compat
function setSplitDelivery(di, si, key, val) {}
function addSplitDelivery(di) {}
function removeSplitDelivery(di, si) {}

// Generic array item setters for sub-sections
function setArrayItem(arr, i, key, val) { State.form[arr][i][key] = val; }
function addArrayItem(arr) {
  const factories = {
    other_process: freshOtherProcess,
    handwork_process: freshHandwork,
    outsource: freshOutsource,
    materials: freshMaterial,
    other_items: freshOtherItem,
    otherCost: freshOtherCost,
    priceDiff: freshPriceDiff,
    customer_gift: freshCustomerGift,
  };
  if (factories[arr]) {
    if (!Array.isArray(State.form[arr])) State.form[arr] = [];
    State.form[arr].push(factories[arr]()); renderForm();
  }
}
function toggleCustomerGift(checked) {
  if (checked) {
    if (!State.form.customer_gift || State.form.customer_gift.length === 0) {
      State.form.customer_gift = [freshCustomerGift()];
    }
  } else {
    State.form.customer_gift = [];
  }
  renderForm();
}
function removeArrayItem(arr, i) {
  customConfirm({ title: 'ลบรายการ', message: 'ต้องการลบรายการนี้หรือไม่?', type: 'danger', icon: 'fas fa-times-circle', okText: 'ลบ', cancelText: 'ยกเลิก' })
    .then(ok => { if (ok) { State.form[arr].splice(i, 1); renderForm(); }});
}
function addAttachFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.doc,.docx,.txt,.xlsx,.jpg,.png';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      State.form.attach_files.push({ name: file.name, file });
      renderForm();
    }
  };
  input.click();
}
// Add empty file slot (shows Choose File button)
function addAttachSlot() {
  if (State.form.attach_files.length >= 10) { toast('แนบไฟล์ได้สูงสุด 10 ไฟล์', 'warning'); return; }
  State.form.attach_files.push({ name: '', file: null });
  renderForm();
}
// File selected from slot
function onFileSelected(idx, input) {
  const file = input.files[0];
  if (file) {
    State.form.attach_files[idx] = { name: file.name, file };
    renderForm();
  }
}
function previewFile(idx) {
  const af = State.form.attach_files[idx];
  if (!af?.file) { toast('ไม่พบไฟล์', 'warning'); return; }
  const file = af.file;
  const url = URL.createObjectURL(file);
  const ext = (file.name || '').split('.').pop().toLowerCase();
  const isImage = ['jpg','jpeg','png','gif','webp','bmp'].includes(ext);
  const isPDF = ext === 'pdf';

  // สร้าง Modal overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s';
  overlay.onclick = (e) => { if (e.target === overlay) { URL.revokeObjectURL(url); overlay.remove(); } };

  let content = '';
  if (isImage) {
    content = `<img src="${url}" style="max-width:90vw;max-height:85vh;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.3)">`;
  } else if (isPDF) {
    content = `<iframe src="${url}" style="width:80vw;height:85vh;border:none;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.3)"></iframe>`;
  } else {
    content = `<div style="background:#fff;padding:30px 40px;border-radius:12px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.3)">
      <i class="fas fa-file" style="font-size:48px;color:var(--accent);margin-bottom:12px"></i>
      <div style="font-size:16px;font-weight:600;margin-bottom:8px">${esc(file.name)}</div>
      <div style="font-size:12px;color:#888;margin-bottom:16px">${(file.size / 1024).toFixed(1)} KB</div>
      <a href="${url}" download="${esc(file.name)}" style="background:var(--accent);color:#fff;padding:8px 20px;border-radius:6px;text-decoration:none;font-size:13px"><i class="fas fa-download"></i> ดาวน์โหลด</a>
    </div>`;
  }

  overlay.innerHTML = `
    <div style="position:relative">
      <button onclick="this.closest('div[style*=fixed]').remove()" style="position:absolute;top:-12px;right:-12px;width:32px;height:32px;border-radius:50%;background:#fff;border:none;font-size:16px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);z-index:1;display:flex;align-items:center;justify-content:center"><i class="fas fa-times"></i></button>
      ${content}
    </div>`;
  document.body.appendChild(overlay);
}

function addComponent() { State.form.components.push(freshComponent()); renderForm(); }
function removeComponent(i) {
  if (State.form.components.length <= 1) {
    customConfirm({ title: 'ไม่สามารถลบได้', message: 'ต้องมีอย่างน้อย 1 Component', type: 'warning', icon: 'fas fa-exclamation-triangle', okText: 'ตกลง', cancelText: '' });
    return;
  }
  customConfirm({ title: 'ลบ Component', message: `ต้องการลบ Component ${i+1} หรือไม่?`, type: 'danger', icon: 'fas fa-layer-group', okText: 'ลบ', cancelText: 'ยกเลิก' })
    .then(ok => { if (ok) { State.form.components.splice(i, 1); renderForm(); }});
}
function addProcess() { State.form.process.push(freshProcess()); renderForm(); }
function removeProcess(i) {
  customConfirm({ title: 'ลบ Process', message: `ต้องการลบ Process ${i+1} หรือไม่?`, type: 'danger', icon: 'fas fa-cogs', okText: 'ลบ', cancelText: 'ยกเลิก' })
    .then(ok => { if (ok) { State.form.process.splice(i, 1); renderForm(); }});
}
function addDelivery() { State.form.delivery.push(freshDelivery()); renderForm(); }
function removeDelivery(i) {
  customConfirm({ title: 'ลบการจัดส่ง', message: `ต้องการลบรอบจัดส่งที่ ${i+1} หรือไม่?`, type: 'danger', icon: 'fas fa-truck', okText: 'ลบ', cancelText: 'ยกเลิก' })
    .then(ok => { if (ok) { State.form.delivery.splice(i, 1); renderForm(); }});
}

function cancelForm() {
  customConfirm({
    title: 'ยกเลิกการกรอกข้อมูล',
    message: 'ข้อมูลที่กรอกไว้จะหายทั้งหมด คุณต้องการยกเลิกหรือไม่?',
    type: 'danger',
    icon: 'fas fa-trash-alt',
    okText: 'ยกเลิกข้อมูล',
    cancelText: 'กลับไปกรอกต่อ',
  }).then(ok => {
    if (ok) {
      State.form = null;
      showView('viewHome');
      setTopBar('Pornchai RFQ Agent', 'ระบบจัดการ RFQ - Sirivatana Interprint');
    }
  });
}

// ============================================================
// CUSTOM CONFIRM MODAL
// ============================================================
function customConfirm({ title = 'ยืนยัน', message = 'คุณแน่ใจหรือไม่?', type = 'warning', icon = 'fas fa-exclamation-triangle', okText = 'ตกลง', cancelText = 'ยกเลิก', inputPlaceholder = '', inputRequired = false } = {}) {
  return new Promise(resolve => {
    const overlay = $('confirmOverlay');
    const iconEl = $('confirmIcon');
    const titleEl = $('confirmTitle');
    const bodyEl = $('confirmBody');
    const okBtn = $('confirmOk');
    const cancelBtn = $('confirmCancel');

    iconEl.className = 'confirm-icon ' + type;
    iconEl.innerHTML = `<i class="${icon}"></i>`;
    titleEl.textContent = title;
    // Support optional text input in confirm dialog
    let inputHtml = '';
    if (inputPlaceholder) {
      inputHtml = `<textarea id="confirmInput" class="form-input" rows="3" placeholder="${escapeHtml(inputPlaceholder)}" style="margin-top:10px;width:100%;resize:vertical;font-size:13px"></textarea>`;
    }
    bodyEl.innerHTML = escapeHtml(message) + inputHtml;
    okBtn.textContent = okText;
    okBtn.className = 'confirm-ok ' + type;
    cancelBtn.textContent = cancelText;
    cancelBtn.style.display = cancelText ? '' : 'none';

    overlay.classList.add('show');
    if (inputPlaceholder) { const inp = $('confirmInput'); if (inp) setTimeout(() => inp.focus(), 100); }

    function cleanup(result) {
      const inputVal = $('confirmInput')?.value || '';
      overlay.classList.remove('show');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onOverlay);
      document.removeEventListener('keydown', onKey);
      // Return {ok, inputValue} when input exists, else boolean
      resolve(inputPlaceholder ? { ok: result, inputValue: inputVal } : result);
    }
    function onOk() {
      if (inputRequired && !($('confirmInput')?.value?.trim())) { toast('กรุณากรอกข้อมูล', 'error'); return; }
      cleanup(true);
    }
    function onCancel() { cleanup(false); }
    function onOverlay(e) { if (e.target === overlay) cleanup(false); }
    function onKey(e) { if (e.key === 'Escape') cleanup(false); }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onOverlay);
    document.addEventListener('keydown', onKey);
  });
}

// ============================================================
// AUTOCOMPLETE
// ============================================================
const acSearchDebounced = debounce(async (type, term, listId) => {
  if (term.length < 2) { $(listId).classList.remove('show'); return; }
  try {
    const data = await autocomplete(type, term);
    const list = $(listId);
    if (!data || !data.length) { list.classList.remove('show'); return; }
    list.innerHTML = data.slice(0, 15).map(item => {
      const label = item.label || item.value || item.name || '';
      const id = item.id || item.value || '';
      return `<div class="autocomplete-item" data-id="${id}" data-label="${label}"
                   onclick="App.acSelect('${type}','${listId}',${JSON.stringify(item).replace(/'/g,"\\'")})">${label} <small>${id}</small></div>`;
    }).join('');
    list.classList.add('show');
  } catch (e) { $(listId).classList.remove('show'); }
}, 300);

function acSearch(type, term, listId) { acSearchDebounced(type, term, listId); }

function acSelect(type, listId, item) {
  $(listId).classList.remove('show');
  const label = item.label || item.value || item.name || '';
  const id = item.id || item.value || '';
  if (type === 'customer') {
    State.form.customer = { customer_id: id, customer_name: label };
    $('acCustomer').value = label;
  } else if (type === 'employee' && listId === 'acAEList') {
    State.form.ae = { emp_id: id, emp_name: label };
    $('acAE').value = label;
  } else if (type === 'employee' && listId === 'acEstList') {
    State.form.estimator = { emp_id: id, emp_name: label };
    $('acEstimator').value = label;
  }
}

function acDeliverySearch(i, term) {
  debounce(async () => {
    const listId = 'acDeliv' + i;
    if (term.length < 2) { $(listId)?.classList.remove('show'); return; }
    const data = await autocomplete('delivery', term);
    const list = $(listId);
    if (!list || !data?.length) { list?.classList.remove('show'); return; }
    list.innerHTML = data.slice(0, 10).map(item => {
      const label = item.label || item.value || '';
      const id = item.id || item.value || '';
      return `<div class="autocomplete-item" onclick="App.acDeliverySelect(${i},${JSON.stringify(item).replace(/'/g,"\\'")})">${label}</div>`;
    }).join('');
    list.classList.add('show');
  }, 300)();
}

function acDeliverySelect(i, item) {
  const label = item.label || item.value || '';
  const id = item.id || item.value || '';
  State.form.delivery[i].destinationName = label;
  State.form.delivery[i].destinationId = id;
  State.form.delivery[i].province = label;
  $('acDeliv' + i)?.classList.remove('show');
  const inp = $('acDelivDest' + i);
  if (inp) inp.value = label;
  renderForm();
}

function acBoxType(i, term) {
  // Simple text set, could enhance with master data dropdown
  State.form.components[i].box_type.type_name = term;
}

// Close autocomplete on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.autocomplete-wrap')) {
    document.querySelectorAll('.autocomplete-list').forEach(l => l.classList.remove('show'));
  }
});

// ============================================================
// PREVIEW
// ============================================================
function showPreview() {
  const f = State.form;
  // Use comprehensive validation
  const missing = validateForm();

  showView('viewPreview');
  setTopBar('Preview RFQ', 'ตรวจสอบข้อมูลก่อนบันทึก');

  let h = `<div class="preview-banner">
    <div>
      <h4><i class="fas fa-eye" style="margin-right:8px"></i> Preview RFQ</h4>
      <div style="opacity:0.8;font-size:13px">ตรวจสอบข้อมูลก่อนบันทึกเข้าระบบ</div>
    </div>
    <div class="preview-actions">
      <button class="preview-btn-cancel" onclick="App.cancelForm()"><i class="fas fa-times"></i> ยกเลิก</button>
      <button class="preview-btn-edit" onclick="App.backToForm()"><i class="fas fa-edit"></i> แก้ไข</button>
      <button class="preview-btn-save" onclick="App.saveRFQ()" ${missing.length?'disabled style="opacity:0.5"':''}><i class="fas fa-save"></i> บันทึก</button>
    </div>
  </div>`;

  if (missing.length) {
    h += `<div class="detail-card" style="border-color:#ffc107;background:rgba(255,193,7,0.05)">
      <h6 style="color:#856404"><i class="fas fa-exclamation-triangle"></i> ข้อมูลไม่ครบ</h6>
      <div style="color:var(--text-secondary);font-size:13px">กรุณากลับไปกรอก: <strong>${missing.join(', ')}</strong></div>
    </div>`;
  }

  // Job Info
  h += `<div class="detail-card"><h6><i class="fas fa-file-alt"></i> ข้อมูลงาน</h6><div class="detail-grid">`;
  h += pField('ชื่องาน', f.job_name, 'job_name');
  h += pField('ลูกค้า', f.customer.customer_name, 'customer');
  h += pField('AE', f.ae.emp_name, 'ae');
  h += pField('Estimator', f.estimator.emp_name);
  h += pField('Currency', f.currency_no + ' (Rate: ' + f.exchange_rate + ')');
  h += pField('Tax', f.tax === '7' ? 'VAT 7%' : 'No VAT');
  h += `</div></div>`;

  // Qty
  h += `<div class="detail-card"><h6><i class="fas fa-sort-numeric-up"></i> จำนวน</h6><div class="detail-grid">`;
  f.qty.forEach((q, i) => { if (q) h += pField(`Qty ${i+1}`, num(q), 'qty.'+i); });
  h += `</div></div>`;

  // Components
  f.components.forEach((c, i) => {
    h += `<div class="detail-card"><h6><i class="fas fa-layer-group"></i> Component ${i+1}: ${esc(c.component_name) || '-'}</h6><div class="detail-grid">`;
    h += pField('ประเภทกล่อง', c.box_type.type_name);
    h += pField('ขนาด', `${c.packaging_size.width||'-'} x ${c.packaging_size.length||'-'} x ${c.packaging_size.depth||'-'} mm`);
    h += pField('กระดาษ', `${c.paper.paper_code||'-'} ${c.paper.paper_gram ? c.paper.paper_gram+'g' : ''}`);
    h += pField('สีนอก/ใน', `${c.color?.outside||'-'} / ${c.color?.inside||'-'}`);
    if (c.f_detail) h += pField('F Detail', c.f_detail);
    h += `</div></div>`;
  });

  // Process
  if (f.process.length) {
    h += `<div class="detail-card"><h6><i class="fas fa-cogs"></i> กระบวนการ (${f.process.length})</h6>
    <table class="detail-table"><thead><tr><th>ประเภท</th><th>ชื่อ</th><th>Line</th></tr></thead><tbody>`;
    f.process.forEach(p => { h += `<tr><td>${esc(p.type)||'-'}</td><td>${esc(p.name)||'-'}</td><td>${esc(p.line)||'-'}</td></tr>`; });
    h += '</tbody></table></div>';
  }

  // Delivery
  if (f.delivery.length) {
    h += `<div class="detail-card"><h6><i class="fas fa-truck"></i> การจัดส่ง (${f.delivery.length})</h6>
    <table class="detail-table"><thead><tr><th>รอบ</th><th>สถานที่</th><th>น้ำหนัก</th></tr></thead><tbody>`;
    f.delivery.forEach(d => { h += `<tr><td>${esc(d.round)||'-'}</td><td>${esc(d.destinationName)||'-'}</td><td>${esc(d.net_weight)||'-'}</td></tr>`; });
    h += '</tbody></table></div>';
  }

  // Remark
  if (f.remark || f.remark_ae) {
    h += `<div class="detail-card"><h6><i class="fas fa-sticky-note"></i> หมายเหตุ</h6><div class="detail-grid">`;
    if (f.remark) h += pField('Remark', f.remark);
    if (f.remark_ae) h += pField('Remark AE', f.remark_ae);
    h += '</div></div>';
  }

  $('previewContent').innerHTML = h;
}

function pField(label, val, fieldKey) {
  const isEmpty = !val || val === '-';
  const isAI = fieldKey && State.fieldSource[fieldKey] === 'ai';
  return `<div class="preview-field ${isEmpty?'empty':''} ${!val&&fieldKey?'missing':''}">
    <div class="pf-label">${label}${isAI?'<span class="ai-badge">AI</span>':''}</div>
    <div class="pf-value">${isEmpty ? '(ไม่ได้กรอก)' : escapeHtml(val)}</div>
  </div>`;
}

function backToForm() {
  showView('viewForm');
  setTopBar(State.formMode === 'edit' ? 'แก้ไข ' + State.formEditId : 'สร้าง RFQ ใหม่', 'แก้ไขข้อมูล');
  renderForm();
}

// ============================================================
// A3: PREPARE DATA TO DB FORMAT
// ============================================================
function prepareDatatoDB(form, calcResults) {
  const f = form || State.form;
  const calc = calcResults || State.priceResults;
  const now = new Date().toISOString();
  const empId = State.session?.emp_id || '';

  // tb_rfq - main RFQ record
  const tb_rfq = {
    rfq_id: f.rfq_id || '',
    est_type: 'packaging',
    job_name: f.job_name || '',
    customer_id: f.customer?.customer_id || '',
    customer_name: f.customer?.customer_name || '',
    ae_id: f.ae?.emp_id || '',
    ae_name: f.ae?.emp_name || '',
    estimator_id: f.estimator?.emp_id || '',
    estimator_name: f.estimator?.emp_name || '',
    print_type: f.print_type || 'Offset',
    machine_id: f.machine_id || '',
    ink_type: f.ink_type || 'Conventional',
    is_multiple_f: f.has_multi_f ? 1 : 0,
    is_profit_sharing: f.profit_sharing ? 1 : 0,
    is_reprinted: f.is_reprinted ? 1 : 0,
    is_use_previous_plate: f.is_use_previous_plate ? 1 : 0,
    is_loss: f.is_loss ? 1 : 0,
    color_limit: f.limit_color ? parseInt(f.limit_color_qty) || 0 : 0,
    flexo_size: f.flexo_size || '',
    credit_term_id: f.credit_term_id || '',
    credit_term_name: f.credit_term_name || '',
    currency_no: f.currency_no || 'THB',
    exchange_rate: parseFloat(f.exchange_rate) || 1,
    tax: parseFloat(f.tax) || 3,
    remark: f.remark || '',
    remark_ae: f.remark_ae || '',
    status: f.status || 'draft',
    created_by: empId,
    updated_by: empId,
    created_at: now,
    updated_at: now,
  };

  // tb_rfq_qty - quantity tiers
  const tb_rfq_qty = f.qty.map((q, i) => ({
    rfq_id: f.rfq_id || '',
    qty_no: i + 1,
    qty: parseInt(q) || 0,
    run_on_percent: parseFloat(f.run_on_percent) || 0,
    run_on_value: parseInt(f.run_on_values[i]) || 0,
    ae_qty: parseInt(f.ae_qty) || 0,
    customer_qty: parseInt(f.customer_qty) || 0,
  })).filter(q => q.qty > 0);

  // tb_rfq_list - component details
  const tb_rfq_list = f.components.map((c, ci) => ({
    rfq_id: f.rfq_id || '',
    component_no: ci + 1,
    component_name: c.component_name || '',
    component_type: parseInt(c.component_type) || 1,
    // Paper
    paper_type: c.paper?.paper_type || '',
    paper_name: c.paper?.paper_name || '',
    paper_gsm: parseInt(c.paper?.gsm) || 0,
    paper_thickness: parseFloat(c.paper?.thickness) || 0,
    paper_cost: parseFloat(c.paper?.cost) || 0,
    paper_sale: parseFloat(c.paper?.sale) || 0,
    paper_bkg: parseFloat(c.paper?.bkg) || 0,
    paper_markup: parseFloat(c.paper?.markup) || 10,
    paper_source: c.paper?.source || 'domestic',
    paper_brand: c.paper?.brand || '',
    paper_roll_cut: parseFloat(c.paper?.roll_cut) || 0,
    paper_tolerance: parseFloat(c.paper_tolerance) || 0,
    paper_note: c.paper?.note || '',
    paper_is_custom: c.paper?.is_custom ? 1 : 0,
    paper_is_per_sheet: c.paper?.is_per_sheet ? 1 : 0,
    // Size
    pkg_width: parseFloat(c.packaging_size?.width) || 0,
    pkg_length: parseFloat(c.packaging_size?.length) || 0,
    pkg_depth: parseFloat(c.packaging_size?.depth) || 0,
    pkg_glue_flap: parseFloat(c.packaging_size?.glue_flap) || 15,
    pkg_tuck_flap: parseFloat(c.packaging_size?.tuck_flap) || 15,
    pkg_dust_flap: parseFloat(c.packaging_size?.dust_flap) || 0,
    // Box type
    box_type_id: c.box_type?.type_id || '',
    box_type_name: c.box_type?.type_name || '',
    packing_layer: parseInt(c.box_type?.packing_layer) || 1,
    // Colors
    color_outside: parseInt(c.color?.outside) || 0,
    color_inside: parseInt(c.color?.inside) || 0,
    color_f_code: c.color?.f_code || '',
    black_front: c.color?.black_front ? 1 : 0,
    black_back: c.color?.black_back ? 1 : 0,
    has_special_ink: c.color?.has_special_ink ? 1 : 0,
    // Corrugated
    corrugated_layer: parseInt(c.corrugated?.layer) || 0,
    corrugated_flute: c.corrugated?.flute_type || '',
    corrugated_thickness: parseFloat(c.corrugated?.thickness) || 0,
    corrugated_cost: parseFloat(c.corrugated?.cost) || 0,
    // F detail
    f_detail: c.f_detail || '',
  }));

  // tb_rfq_addon - addons per component
  const tb_rfq_addon = [];
  f.components.forEach((c, ci) => {
    (c.addon || []).forEach((a, ai) => {
      tb_rfq_addon.push({
        rfq_id: f.rfq_id || '',
        component_no: ci + 1,
        addon_no: ai + 1,
        addon_type: a.type || '',
        addon_code: a.code || '',
        addon_side: a.side || '',
        addon_f_code: a.f_code || '',
        addon_depth: a.depth || '',
        addon_sizes: JSON.stringify(a.sizes || []),
      });
    });
  });

  // tb_rfq_special_ink
  const tb_rfq_special_ink = [];
  f.components.forEach((c, ci) => {
    (c.special_ink || []).forEach((ink, ii) => {
      tb_rfq_special_ink.push({
        rfq_id: f.rfq_id || '',
        component_no: ci + 1,
        ink_no: ii + 1,
        ink_color: ink.color || '',
        ink_type: ink.type || '',
        ink_print_style: ink.print_style || '',
        ink_paper_code: ink.paper_code || '',
      });
    });
  });

  // tb_rfq_price - calculated prices per qty
  const tb_rfq_price = [];
  if (calc && calc.totals) {
    calc.totals.forEach((t, qi) => {
      tb_rfq_price.push({
        rfq_id: f.rfq_id || '',
        qty_no: qi + 1,
        qty: t.qty,
        material_total: t.materialTotal || 0,
        production_total: t.productionTotal || 0,
        packing_total: t.packingTotal || 0,
        other_cost_total: t.otherCostTotal || 0,
        delivery_total: t.deliveryTotal || 0,
        process_info_total: t.processInfoTotal || 0,
        subtotal: t.subtotal || 0,
        marking_percent: t.markingPercent || 0,
        after_marking: t.afterMarking || 0,
        price_diff_total: t.priceDiffTotal || 0,
        gift_total: t.giftTotal || 0,
        tax: t.tax || 0,
        profit_sharing_amount: t.profitSharingAmount || 0,
        final_price: t.finalPrice || 0,
        unit_price: t.unitPrice || 0,
        weight: t.weight || 0,
      });
    });
  }

  // tb_rfq_component_price - per-component per-qty breakdown
  const tb_rfq_component_price = [];
  if (calc && calc.components) {
    calc.components.forEach((comp, ci) => {
      (comp.perQty || []).forEach((pq, qi) => {
        tb_rfq_component_price.push({
          rfq_id: f.rfq_id || '',
          component_no: ci + 1,
          qty_no: qi + 1,
          paper_cost: pq.paperCost || 0,
          corrugated_cost: pq.corrugatedCost || 0,
          plate_cost: pq.plateCost || 0,
          print_cost: pq.printCost || 0,
          special_ink_cost: pq.specialInkCost || 0,
          afterpress_cost: pq.afterPressCost || 0,
          proof_cost: pq.proofCost || 0,
          packing_cost: pq.packingCost || 0,
        });
      });
    });
  }

  // tb_rfq_delivery
  const tb_rfq_delivery = f.delivery.map((d, di) => ({
    rfq_id: f.rfq_id || '',
    delivery_no: di + 1,
    round: d.round || di + 1,
    destination_id: d.destinationId || '',
    destination_name: d.destinationName || '',
    province: d.province || '',
    due_date: d.dueDate || '',
    net_weight: parseFloat(d.net_weight) || 0,
    has_split: d.split_delivery?.enabled ? 1 : 0,
    split_items: JSON.stringify(d.split_delivery?.items || []),
  }));

  // tb_rfq_process
  const tb_rfq_process = f.process.map((p, pi) => ({
    rfq_id: f.rfq_id || '',
    process_no: pi + 1,
    process_type: p.type || '',
    process_name: p.name || '',
    process_line: p.line || '',
  }));

  // tb_rfq_process_info - process info cost items
  const tb_rfq_process_info = [];
  const procSections = ['plate','proof','print','process','handwork','material','other'];
  procSections.forEach(section => {
    (f.process_info?.[section] || []).forEach((item, ii) => {
      tb_rfq_process_info.push({
        rfq_id: f.rfq_id || '',
        section,
        item_no: ii + 1,
        name: item.name || '',
        qty: parseFloat(item.qty) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
        total: parseFloat(item.total) || 0,
        remark: item.remark || '',
      });
    });
  });

  // tb_rfq_other_cost
  const tb_rfq_other_cost = (f.otherCost || []).map((oc, i) => ({
    rfq_id: f.rfq_id || '', item_no: i + 1,
    name: oc.name || '', qty: parseFloat(oc.qty) || 0,
    unit_price: parseFloat(oc.unit_price) || 0, total: parseFloat(oc.total) || 0,
  }));

  // tb_rfq_price_diff
  const tb_rfq_price_diff = (f.priceDiff || []).map((pd, i) => ({
    rfq_id: f.rfq_id || '', item_no: i + 1,
    name: pd.name || '', amount: parseFloat(pd.amount) || 0,
  }));

  // tb_rfq_customer_gift
  const tb_rfq_customer_gift = (f.customer_gift || []).map((g, i) => ({
    rfq_id: f.rfq_id || '', item_no: i + 1,
    name: g.name || '', qty: parseFloat(g.qty) || 0,
    unit_price: parseFloat(g.unit_price) || 0, total: parseFloat(g.total) || 0,
  }));

  // tb_rfq_attach_file
  const tb_rfq_attach_file = (f.attach_files || []).map((af, i) => ({
    rfq_id: f.rfq_id || '', file_no: i + 1,
    file_name: af.name || af.file_name || '',
    file_path: af.path || af.file_path || '',
    file_url: af.url || af.file_url || '',
  }));

  return {
    tb_rfq,
    tb_rfq_qty,
    tb_rfq_list,
    tb_rfq_addon,
    tb_rfq_special_ink,
    tb_rfq_price,
    tb_rfq_component_price,
    tb_rfq_delivery,
    tb_rfq_process,
    tb_rfq_process_info,
    tb_rfq_other_cost,
    tb_rfq_price_diff,
    tb_rfq_customer_gift,
    tb_rfq_attach_file,
  };
}

// ============================================================
// SAVE RFQ
// ============================================================
async function saveRFQ() {
  const f = State.form;

  // Validate required fields
  const reqMissing = [];
  if (!f.ae?.emp_name?.trim()) reqMissing.push('AE Name');
  if (!f.job_name?.trim()) reqMissing.push('Job Name');
  if (!f.customer?.customer_name?.trim() && !f.new_customer) reqMissing.push('Customer');
  if (reqMissing.length > 0) {
    toast(`กรุณากรอกข้อมูลให้ครบ: ${reqMissing.join(', ')}`, 'error');
    return;
  }

  toast('กำลังบันทึก...', 'info');

  try {
    // A3: Transform form data to DB format
    const dbData = prepareDatatoDB(f, State.priceResults);

    // Build payload matching Estimate API format (includes both raw form + DB tables)
    const payload = {
      est_type: 'packaging',
      db_tables: dbData,
      job: {
        job_name: f.job_name,
        ink_type: f.ink_type,
        print_type: f.print_type,
        machine_id: f.machine_id,
        flexo_size: f.flexo_size,
        is_multiple_f: f.has_multi_f,
        is_profit_sharing: f.profit_sharing,
        is_reprinted: f.is_reprinted,
        is_use_previous_plate: f.is_use_previous_plate,
        is_loss: f.is_loss,
        color_limit: f.limit_color ? parseInt(f.limit_color_qty) || 0 : 0,
        credit_term_id: f.credit_term_id,
        credit_term_name: f.credit_term_name,
      },
      customer: f.customer,
      ae: f.ae,
      estimator: f.estimator,
      currency_no: f.currency_no,
      exchange_rate: f.exchange_rate,
      tax: f.tax,
      qty: {},
      component1: f.components.map(c => ({
        component_name: c.component_name,
        component_type: c.component_type,
        box_type: c.box_type,
        packaging_size: c.packaging_size,
        paper: c.paper,
        color: c.color,
        addon: c.addon,
        comp_process: c.comp_process,
        packing: c.packing,
        f_detail: c.f_detail,
        paper_tolerance: c.paper_tolerance,
      })),
      process: f.process,
      process_info: f.process_info,
      otherCost: f.otherCost,
      priceDiff: f.priceDiff,
      customer_gift: f.customer_gift,
      delivery: f.delivery.map(d => ({
        round: d.round,
        destinationId: d.destinationId,
        destinationName: d.destinationName,
        province: d.province,
        dueDate: d.dueDate,
        net_weight: d.net_weight,
        split_delivery: d.split_delivery,
      })),
      remark: { remark: f.remark, remark_ae: f.remark_ae },
    };

    f.qty.forEach((q, i) => { if (q) payload.qty['qty' + (i + 1)] = q; });

    if (State.formMode === 'edit' && State.formEditId) {
      payload.rfq_id = State.formEditId;
    }

    const result = await apiPost('/api/estimate/save_rfq', payload);

    if (result.error) {
      toast('บันทึกไม่สำเร็จ: ' + result.error, 'error');
    } else {
      toast('บันทึก RFQ สำเร็จ!', 'success');

      // === Knowledge Store: AI จดจำ spec นี้ ===
      try {
        const specText = State._lastSpecText || '';
        const aiParsed = State._lastParsedData || null;

        // Feedback Loop: compare AI parsed vs final form to find corrections
        const corrections = [];
        if (aiParsed) {
          const ac = aiParsed.components?.[0] || {};
          const fc = f.components?.[0] || {};
          // Job name
          if (aiParsed.job_name && aiParsed.job_name !== f.job_name) corrections.push({ field: 'job_name', ai: aiParsed.job_name, final: f.job_name });
          // Box type
          if (ac.box_type_id && String(ac.box_type_id) !== String(fc.box_type?.type_id)) corrections.push({ field: 'box_type', ai: String(ac.box_type_id), final: String(fc.box_type?.type_id) });
          // Paper code
          if (ac.paper?.paper_code && ac.paper.paper_code !== fc.paper?.paper_code) corrections.push({ field: 'paper_code', ai: ac.paper.paper_code, final: fc.paper?.paper_code });
          // Paper gram
          if (ac.paper?.paper_gram && String(ac.paper.paper_gram) !== String(fc.paper?.paper_gram)) corrections.push({ field: 'paper_gram', ai: String(ac.paper.paper_gram), final: String(fc.paper?.paper_gram) });
          // Color outside
          if (ac.color?.outside != null && String(ac.color.outside) !== String(fc.color?.outside)) corrections.push({ field: 'color_out', ai: String(ac.color.outside), final: String(fc.color?.outside) });
          // Ink type
          if (aiParsed.ink_type && aiParsed.ink_type !== f.ink_type) corrections.push({ field: 'ink_type', ai: aiParsed.ink_type, final: f.ink_type });

          if (corrections.length > 0) console.log('AI corrections detected:', corrections);
        }

        await apiPost('/api/knowledge/save', {
          spec_text: specText,
          parsed_data: aiParsed,
          final_form: f,
          job_id: result.rfq_id || result.job_id || '',
          corrections,
        });
        console.log('Knowledge saved successfully' + (corrections.length ? ` (${corrections.length} corrections)` : ''));
      } catch (ke) {
        console.log('Knowledge save failed:', ke.message);
      }

      loadRFQList();
      showView('viewHome');
      setTopBar('Pornchai RFQ Agent', 'ระบบจัดการ RFQ - Sirivatana Interprint');
    }
  } catch (e) {
    toast('เกิดข้อผิดพลาด: ' + e.message, 'error');
  }
}

async function saveDraft() {
  toast('กำลังบันทึก Draft...', 'info');
  await saveRFQ();
}

// ============================================================
// MASTER DATA VIEWER
// ============================================================
async function viewMaster(type, title) {
  showView('viewData');
  setTopBar(title, 'Master Data');
  $('dataContent').innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด...</div>';

  try {
    const data = await loadMaster(type);
    renderMasterData(title, type, data);
  } catch (e) {
    $('dataContent').innerHTML = `<div class="loading-spinner" style="color:#f08080">${e.message}</div>`;
  }
}

function renderMasterData(title, type, data) {
  let h = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
    <div style="font-size:18px;font-weight:700">${title} (${Array.isArray(data)?data.length:0} รายการ)</div>
    <button class="text-btn" onclick="App.showToolsTab()"><i class="fas fa-arrow-left"></i> กลับ Tools</button>
  </div>`;

  if (!data || !data.length) {
    h += '<div class="loading-spinner">ไม่พบข้อมูล</div>';
  } else if (type === 'paper_code_type') {
    h += '<div class="data-grid">';
    data.forEach(i => { h += `<div class="data-card"><div class="dc-title">${i.paper_code||i.code||'-'}</div><div class="dc-sub">${i.paper_name||i.name||''} ${i.paper_gram||i.gram?'('+( i.paper_gram||i.gram)+'g)':''}</div></div>`; });
    h += '</div>';
  } else if (type === 'boxtemplate_info') {
    h += '<div class="data-grid">';
    data.forEach(i => { h += `<div class="data-card"><div class="dc-title">${i.type_name||i.name||'-'}</div><div class="dc-sub">${i.type_name_th||i.name_th||''}</div></div>`; });
    h += '</div>';
  } else if (type === 'exchange_rate') {
    h += `<table class="detail-table" style="background:var(--bg-card);border-radius:8px;overflow:hidden">
      <thead><tr><th>Currency</th><th>Rate</th><th>Updated</th></tr></thead><tbody>`;
    (Array.isArray(data)?data:[data]).forEach(i => {
      h += `<tr><td>${i.currency||i.currency_name||'-'}</td><td style="font-weight:600">${i.rate||i.exchange_rate||'-'}</td><td>${i.updated_at||i.date||'-'}</td></tr>`;
    });
    h += '</tbody></table>';
  } else if (type === 'process_type') {
    h += '<div class="data-grid">';
    data.forEach(i => { h += `<div class="data-card"><div class="dc-title">${i.process_name||i.name||'-'}</div><div class="dc-sub">${i.process_type||i.type||''}</div></div>`; });
    h += '</div>';
  } else {
    h += `<div class="detail-card"><pre style="white-space:pre-wrap;font-size:12px;margin:0">${JSON.stringify(data,null,2)}</pre></div>`;
  }

  $('dataContent').innerHTML = h;
}

// ============================================================
// MASTER DATA CRUD
// ============================================================
const MD_SCHEMAS = {
  paper_info: {
    title: 'ข้อมูลกระดาษ', icon: 'fa-scroll', color: '#2563eb',
    columns: [
      { key:'paper_code', label:'Paper Code', w:'120px' },
      { key:'paper_type', label:'Type', w:'120px' },
      { key:'gram', label:'GSM', w:'70px', type:'number' },
      { key:'price', label:'ราคา', w:'80px', type:'number' },
      { key:'price_import', label:'ราคา Import', w:'90px', type:'number' },
      { key:'brand', label:'Brand', w:'100px' },
      { key:'is_enabled', label:'สถานะ', w:'70px', type:'badge' },
    ],
    fields: [
      { key:'paper_code', label:'Paper Code', required:true },
      { key:'paper_type', label:'Paper Type' },
      { key:'gram', label:'GSM (แกรม)', type:'number', required:true },
      { key:'thickness_micron', label:'Thickness (micron)', type:'number' },
      { key:'thickness_mm', label:'Thickness (mm)', type:'number', step:'0.01' },
      { key:'price', label:'ราคา (บาท/กก.)', type:'number', step:'0.01', required:true },
      { key:'price_import', label:'ราคา Import', type:'number', step:'0.01' },
      { key:'brand', label:'Brand' },
      { key:'paper_brand_supplier', label:'Brand : Supplier' },
      { key:'brand_import', label:'Brand Import' },
      { key:'paper_brand_supplier_import', label:'Brand Import : Supplier' },
      { key:'special_ink_paper_code', label:'Special Ink Code' },
      { key:'is_fsc', label:'FSC', type:'select', options:[{v:0,l:'No'},{v:1,l:'Yes'}] },
      { key:'is_enabled', label:'เปิดใช้งาน', type:'select', options:[{v:1,l:'เปิด'},{v:0,l:'ปิด'}] },
      { key:'print_type', label:'Print Type' },
    ],
    searchKeys: ['paper_code','paper_type','brand','gram'],
  },
  coating_info: {
    title: 'Coating', icon: 'fa-fill-drip', color: '#0ea5e9',
    columns: [
      { key:'coating_code', label:'Code', w:'90px' },
      { key:'coating_type', label:'ประเภท', w:'160px' },
      { key:'coating_option', label:'Option', w:'80px' },
      { key:'rate', label:'Rate', w:'80px', type:'number' },
      { key:'min_cost', label:'Min Cost', w:'90px', type:'number' },
      { key:'process_name', label:'Process', w:'150px' },
      { key:'is_enabled', label:'สถานะ', w:'70px', type:'badge' },
    ],
    fields: [
      { key:'coating_code', label:'Coating Code', required:true },
      { key:'coating_type', label:'ประเภท Coating', required:true },
      { key:'coating_option', label:'Option', type:'select', options:[{v:'Gloss',l:'Gloss'},{v:'Matt',l:'Matt'},{v:'Other',l:'Other'}] },
      { key:'rate', label:'Rate (บาท/ตร.ซม.)', type:'number', step:'0.0001', required:true },
      { key:'min_cost', label:'Min Cost', type:'number', step:'0.01' },
      { key:'unit_min_cost', label:'Unit Min Cost', type:'select', options:[{v:'sheet',l:'Sheet'},{v:'price',l:'Price'}] },
      { key:'pages', label:'Pages (จำนวนผ่าน)', type:'number' },
      { key:'process_name', label:'Process Name' },
      { key:'process_id', label:'Process ID', type:'number' },
      { key:'est_type', label:'Est Type' },
      { key:'coating_size', label:'ขนาด Coating' },
      { key:'material_type', label:'Material Type' },
      { key:'is_enabled', label:'เปิดใช้งาน', type:'select', options:[{v:1,l:'เปิด'},{v:0,l:'ปิด'}] },
    ],
    searchKeys: ['coating_code','coating_type','coating_option','process_name'],
  },
  foilstamp_info: {
    title: 'Foil Stamp', icon: 'fa-star', color: '#d97706',
    columns: [
      { key:'code', label:'Code', w:'140px' },
      { key:'color', label:'Color (EN)', w:'110px' },
      { key:'color_th', label:'สี (TH)', w:'110px' },
      { key:'width', label:'กว้าง (cm)', w:'80px', type:'number' },
      { key:'length', label:'ยาว (m)', w:'80px', type:'number' },
      { key:'roll_price', label:'ราคา/ม้วน', w:'100px', type:'number' },
      { key:'is_active', label:'สถานะ', w:'70px', type:'badge' },
    ],
    fields: [
      { key:'code', label:'Foil Code', required:true },
      { key:'color', label:'Color (EN)', required:true },
      { key:'color_th', label:'สี (ภาษาไทย)', required:true },
      { key:'width', label:'กว้าง (cm)', type:'number', required:true },
      { key:'length', label:'ยาว (m)', type:'number', required:true },
      { key:'roll_price', label:'ราคา/ม้วน (บาท)', type:'number', required:true },
      { key:'roll_min_price', label:'ราคาขั้นต่ำ/ม้วน', type:'number' },
      { key:'is_active', label:'เปิดใช้งาน', type:'select', options:[{v:1,l:'เปิด'},{v:0,l:'ปิด'}] },
    ],
    searchKeys: ['code','color','color_th'],
  },
  machine_std_paper_info: {
    title: 'เครื่องพิมพ์-กระดาษ', icon: 'fa-print', color: '#059669',
    idKey: 'std_paper_id',
    columns: [
      { key:'machineSize_type', label:'Machine', w:'80px' },
      { key:'std_paper_name', label:'ชื่อกระดาษ', w:'100px' },
      { key:'std_paper_size_width_mm', label:'W (mm)', w:'80px', type:'number' },
      { key:'std_paper_size_length_mm', label:'L (mm)', w:'80px', type:'number' },
      { key:'only_paper_type', label:'Paper Types', w:'160px' },
      { key:'is_default', label:'Default', w:'70px', type:'badge' },
    ],
    fields: [
      { key:'machineSize_type', label:'Machine Size Type', type:'number', required:true },
      { key:'std_paper_name', label:'ชื่อขนาดกระดาษ', required:true },
      { key:'std_paper_size_width_mm', label:'กว้าง W (mm)', type:'number', step:'0.1', required:true },
      { key:'std_paper_size_length_mm', label:'ยาว L (mm)', type:'number', step:'0.1', required:true },
      { key:'std_paper_size_width_in', label:'กว้าง W (inch)', type:'number', step:'0.1' },
      { key:'std_paper_size_length_in', label:'ยาว L (inch)', type:'number', step:'0.1' },
      { key:'std_paper_min_color', label:'Min Colors', type:'number' },
      { key:'std_paper_max_color', label:'Max Colors', type:'number' },
      { key:'only_paper_type', label:'Paper Types (comma separated)' },
      { key:'is_default', label:'Default', type:'select', options:[{v:true,l:'Yes'},{v:false,l:'No'}] },
    ],
    searchKeys: ['machineSize_type','std_paper_name','only_paper_type'],
  },
};

// State for CRUD viewer
const mdState = { type:'', data:[], filtered:[], page:1, perPage:30, search:'', sortKey:'', sortDir:'asc' };

async function viewMasterCRUD(type, title) {
  showView('viewData');
  setTopBar(title || MD_SCHEMAS[type]?.title || type, 'Master Data');
  $('dataContent').innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด...</div>';

  mdState.type = type;
  mdState.page = 1;
  mdState.search = '';
  mdState.sortKey = '';
  mdState.sortDir = 'asc';

  try {
    const data = await apiGet(`/api/master-data/${type}`);
    mdState.data = Array.isArray(data) ? data : [];
    mdState.filtered = [...mdState.data];
    renderMasterCRUD();
  } catch (e) {
    $('dataContent').innerHTML = `<div class="loading-spinner" style="color:#f08080">${e.message}</div>`;
  }
}

function renderMasterCRUD() {
  const schema = MD_SCHEMAS[mdState.type];
  if (!schema) return;
  const d = mdState.filtered;
  const total = d.length;
  const pages = Math.max(1, Math.ceil(total / mdState.perPage));
  if (mdState.page > pages) mdState.page = pages;
  const start = (mdState.page - 1) * mdState.perPage;
  const pageData = d.slice(start, start + mdState.perPage);
  const statusKey = schema.columns.find(c => c.type === 'badge')?.key;

  let h = `<div style="max-width:1200px;margin:0 auto">`;
  // Header
  h += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:38px;height:38px;border-radius:10px;background:${schema.color};display:flex;align-items:center;justify-content:center">
        <i class="fas ${schema.icon}" style="color:#fff;font-size:16px"></i>
      </div>
      <div>
        <div style="font-size:18px;font-weight:700">${schema.title}</div>
        <div style="font-size:12px;color:var(--text-muted)">${total} รายการ</div>
      </div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="text-btn" onclick="App.showToolsTab()"><i class="fas fa-arrow-left"></i> กลับ</button>
      <button onclick="App.mdOpenAdd()" style="padding:8px 16px;border-radius:8px;background:var(--accent);color:#fff;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:opacity 0.15s" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'"><i class="fas fa-plus" style="margin-right:6px"></i>เพิ่มข้อมูล</button>
    </div>
  </div>`;

  // Toolbar: search
  h += `<div class="md-toolbar">
    <div class="md-search-wrap">
      <i class="fas fa-search"></i>
      <input class="md-search" placeholder="ค้นหา..." value="${esc(mdState.search)}" oninput="App.mdSearch(this.value)">
    </div>
    <button onclick="App.mdRefreshData()" style="padding:8px 14px;border:1px solid var(--border-color);border-radius:8px;background:var(--btn-bg);color:var(--text-primary);cursor:pointer;font-size:12px;transition:all 0.15s" title="Refresh จาก API"><i class="fas fa-sync-alt"></i></button>
  </div>`;

  // Table
  h += '<div class="md-table-wrap"><table class="md-table"><thead><tr>';
  h += '<th style="width:50px">#</th>';
  schema.columns.forEach(col => {
    const arrow = mdState.sortKey === col.key ? (mdState.sortDir === 'asc' ? ' ▲' : ' ▼') : '';
    h += `<th style="width:${col.w||'auto'};cursor:pointer" onclick="App.mdSort('${col.key}')">${col.label}${arrow}</th>`;
  });
  h += '<th style="width:90px;text-align:right">จัดการ</th></tr></thead><tbody>';

  const idKey = schema.idKey || 'id';
  if (pageData.length === 0) {
    h += `<tr><td colspan="${schema.columns.length + 2}" style="text-align:center;padding:30px;color:var(--text-muted)">ไม่พบข้อมูล</td></tr>`;
  } else {
    pageData.forEach((row, i) => {
      const rid = row[idKey];
      h += '<tr>';
      h += `<td style="color:var(--text-muted);font-size:11px">${start + i + 1}</td>`;
      schema.columns.forEach(col => {
        const val = row[col.key];
        if (col.type === 'badge') {
          const on = val === 1 || val === true;
          h += `<td><span class="md-badge ${on?'md-badge-on':'md-badge-off'}">${on?'เปิด':'ปิด'}</span></td>`;
        } else if (col.type === 'number') {
          h += `<td style="font-variant-numeric:tabular-nums">${val != null ? val : '-'}</td>`;
        } else {
          h += `<td>${val != null ? esc(String(val)) : '-'}</td>`;
        }
      });
      h += `<td class="md-actions">
        <button class="md-edit" onclick="App.mdOpenEdit(${typeof rid==='string'?("'"+rid+"'"):rid})" title="แก้ไข"><i class="fas fa-pen"></i></button>
        <button class="md-del" onclick="App.mdConfirmDelete(${typeof rid==='string'?("'"+rid+"'"):rid})" title="ลบ"><i class="fas fa-trash"></i></button>
      </td>`;
      h += '</tr>';
    });
  }
  h += '</tbody></table></div>';

  // Pagination
  if (pages > 1) {
    h += '<div class="md-pagination">';
    h += `<button ${mdState.page<=1?'disabled':''} onclick="App.mdGoPage(${mdState.page-1})"><i class="fas fa-chevron-left"></i></button>`;
    const maxBtns = 7;
    let pStart = Math.max(1, mdState.page - Math.floor(maxBtns/2));
    let pEnd = Math.min(pages, pStart + maxBtns - 1);
    if (pEnd - pStart < maxBtns - 1) pStart = Math.max(1, pEnd - maxBtns + 1);
    for (let p = pStart; p <= pEnd; p++) {
      h += `<button class="${p===mdState.page?'md-pg-active':''}" onclick="App.mdGoPage(${p})">${p}</button>`;
    }
    h += `<button ${mdState.page>=pages?'disabled':''} onclick="App.mdGoPage(${mdState.page+1})"><i class="fas fa-chevron-right"></i></button>`;
    h += `<span style="margin-left:6px">จาก ${pages} หน้า</span>`;
    h += '</div>';
  }

  h += '</div>';
  $('dataContent').innerHTML = h;
}

function mdSearch(val) {
  mdState.search = val.trim().toLowerCase();
  const schema = MD_SCHEMAS[mdState.type];
  if (!schema) return;
  if (!mdState.search) {
    mdState.filtered = [...mdState.data];
  } else {
    mdState.filtered = mdState.data.filter(row =>
      schema.searchKeys.some(k => String(row[k]||'').toLowerCase().includes(mdState.search))
    );
  }
  mdState.page = 1;
  renderMasterCRUD();
  // Restore focus on search input
  setTimeout(() => {
    const inp = document.querySelector('.md-search');
    if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  }, 10);
}

function mdSort(key) {
  if (mdState.sortKey === key) {
    mdState.sortDir = mdState.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    mdState.sortKey = key;
    mdState.sortDir = 'asc';
  }
  mdState.filtered.sort((a, b) => {
    let va = a[key], vb = b[key];
    if (va == null) va = '';
    if (vb == null) vb = '';
    if (typeof va === 'number' && typeof vb === 'number') return mdState.sortDir === 'asc' ? va - vb : vb - va;
    return mdState.sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
  });
  renderMasterCRUD();
}

function mdGoPage(p) {
  mdState.page = p;
  renderMasterCRUD();
}

async function mdRefreshData() {
  toast('กำลัง refresh ข้อมูล...', 'info');
  try {
    await apiPost('/api/master-data/refresh', {});
    const data = await apiGet(`/api/master-data/${mdState.type}`);
    mdState.data = Array.isArray(data) ? data : [];
    mdState.search = '';
    mdState.filtered = [...mdState.data];
    mdState.page = 1;
    renderMasterCRUD();
    // Also refresh State.masters cache
    State.masters[mdState.type] = mdState.data;
    toast('Refresh สำเร็จ!', 'success');
  } catch (e) {
    toast('Refresh ผิดพลาด: ' + e.message, 'error');
  }
}

// --- Modal: Add / Edit ---
function mdBuildFormHTML(schema, item) {
  let h = '';
  const fields = schema.fields;
  // Use 2-column layout for fields
  h += '<div class="md-field-row">';
  fields.forEach((f, i) => {
    const val = item ? (item[f.key] != null ? item[f.key] : '') : (f.type === 'select' ? (f.options[0]?.v ?? '') : '');
    h += '<div class="md-field">';
    h += `<label>${f.label}${f.required?' <span style="color:#ef4444">*</span>':''}</label>`;
    if (f.type === 'select') {
      h += `<select name="${f.key}">`;
      (f.options||[]).forEach(o => {
        h += `<option value="${o.v}" ${String(val)===String(o.v)?'selected':''}>${o.l}</option>`;
      });
      h += '</select>';
    } else {
      const t = f.type === 'number' ? 'number' : 'text';
      const step = f.step ? ` step="${f.step}"` : (f.type==='number'?' step="any"':'');
      h += `<input type="${t}" name="${f.key}" value="${esc(String(val))}"${step}${f.required?' required':''}>`;
    }
    h += '</div>';
  });
  h += '</div>';
  return h;
}

function mdShowModal(title, bodyHTML, footHTML) {
  // Remove existing modal
  const old = document.getElementById('mdModalOverlay');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = 'mdModalOverlay';
  overlay.className = 'md-modal-overlay';
  overlay.innerHTML = `<div class="md-modal">
    <div class="md-modal-head"><h3>${title}</h3><button class="md-close" onclick="App.mdCloseModal()">&times;</button></div>
    <div class="md-modal-body">${bodyHTML}</div>
    <div class="md-modal-foot">${footHTML}</div>
  </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) mdCloseModal(); });
  document.body.appendChild(overlay);
}

function mdCloseModal() {
  const el = document.getElementById('mdModalOverlay');
  if (el) el.remove();
}

function mdGetFormData() {
  const schema = MD_SCHEMAS[mdState.type];
  if (!schema) return {};
  const obj = {};
  schema.fields.forEach(f => {
    const el = document.querySelector(`#mdModalOverlay [name="${f.key}"]`);
    if (!el) return;
    let v = el.value;
    if (f.type === 'number' || f.type === 'select') {
      const n = Number(v);
      if (!isNaN(n) && v !== '') v = n;
    }
    obj[f.key] = v;
  });
  return obj;
}

function mdOpenAdd() {
  const schema = MD_SCHEMAS[mdState.type];
  if (!schema) return;
  const body = mdBuildFormHTML(schema, null);
  const foot = `<button class="md-btn-cancel" onclick="App.mdCloseModal()">ยกเลิก</button>
    <button class="md-btn-save" onclick="App.mdSaveNew()"><i class="fas fa-plus" style="margin-right:6px"></i>เพิ่ม</button>`;
  mdShowModal(`<i class="fas fa-plus-circle" style="color:var(--accent);margin-right:8px"></i>เพิ่ม${schema.title}`, body, foot);
}

function mdOpenEdit(id) {
  const schema = MD_SCHEMAS[mdState.type];
  if (!schema) return;
  const idKey = schema.idKey || 'id';
  const item = mdState.data.find(r => r[idKey] === id);
  if (!item) return;
  const body = mdBuildFormHTML(schema, item);
  const foot = `<button class="md-btn-cancel" onclick="App.mdCloseModal()">ยกเลิก</button>
    <button class="md-btn-save" onclick="App.mdSaveEdit(${id})"><i class="fas fa-save" style="margin-right:6px"></i>บันทึก</button>`;
  mdShowModal(`<i class="fas fa-pen" style="color:var(--accent);margin-right:8px"></i>แก้ไข${schema.title}`, body, foot);
}

async function mdSaveNew() {
  const data = mdGetFormData();
  const schema = MD_SCHEMAS[mdState.type];
  // Validate required fields
  for (const f of schema.fields) {
    if (f.required && (data[f.key] === '' || data[f.key] == null)) {
      toast(`กรุณากรอก ${f.label}`, 'error');
      return;
    }
  }
  try {
    const res = await apiPost(`/api/master-data/${mdState.type}`, data);
    if (res.success) {
      mdCloseModal();
      toast('เพิ่มข้อมูลสำเร็จ!', 'success');
      mdState.data.push(res.item);
      mdState.filtered = mdState.search ? mdState.filtered : [...mdState.data];
      if (mdState.search) mdSearch(mdState.search);
      else renderMasterCRUD();
      State.masters[mdState.type] = mdState.data;
    }
  } catch (e) {
    toast('เพิ่มผิดพลาด: ' + e.message, 'error');
  }
}

async function mdSaveEdit(id) {
  const data = mdGetFormData();
  const schema = MD_SCHEMAS[mdState.type];
  const idKey = schema.idKey || 'id';
  for (const f of schema.fields) {
    if (f.required && (data[f.key] === '' || data[f.key] == null)) {
      toast(`กรุณากรอก ${f.label}`, 'error');
      return;
    }
  }
  try {
    const res = await apiPut(`/api/master-data/${mdState.type}/${id}`, data);
    if (res.success) {
      mdCloseModal();
      toast('บันทึกสำเร็จ!', 'success');
      const idx = mdState.data.findIndex(r => r[idKey] === id);
      if (idx !== -1) mdState.data[idx] = res.item;
      if (mdState.search) mdSearch(mdState.search);
      else { mdState.filtered = [...mdState.data]; renderMasterCRUD(); }
      State.masters[mdState.type] = mdState.data;
    }
  } catch (e) {
    toast('บันทึกผิดพลาด: ' + e.message, 'error');
  }
}

function mdConfirmDelete(id) {
  const schema = MD_SCHEMAS[mdState.type];
  const idKey = schema.idKey || 'id';
  const item = mdState.data.find(r => r[idKey] === id);
  if (!item) return;
  // Show key info for confirmation
  const cols = schema.columns.slice(0, 3);
  const info = cols.map(c => `<b>${c.label}:</b> ${item[c.key] || '-'}`).join(' &nbsp;|&nbsp; ');
  const body = `<div style="text-align:center;padding:10px 0">
    <i class="fas fa-exclamation-triangle" style="font-size:40px;color:#ef4444;margin-bottom:12px;display:block"></i>
    <div style="font-size:15px;font-weight:600;margin-bottom:8px">ยืนยันการลบข้อมูล?</div>
    <div style="font-size:13px;color:var(--text-muted);padding:10px;background:var(--bg-input);border-radius:8px">${info}</div>
    <div style="font-size:12px;color:#ef4444;margin-top:10px">การลบจะไม่สามารถกู้คืนได้</div>
  </div>`;
  const foot = `<button class="md-btn-cancel" onclick="App.mdCloseModal()">ยกเลิก</button>
    <button class="md-btn-danger" onclick="App.mdDoDelete(${id})"><i class="fas fa-trash" style="margin-right:6px"></i>ลบ</button>`;
  mdShowModal('ยืนยันการลบ', body, foot);
}

async function mdDoDelete(id) {
  const schema = MD_SCHEMAS[mdState.type];
  const idKey = schema.idKey || 'id';
  try {
    const res = await fetch(`/api/master-data/${mdState.type}/${id}`, { method:'DELETE' }).then(r => r.json());
    if (res.success) {
      mdCloseModal();
      toast('ลบสำเร็จ!', 'success');
      mdState.data = mdState.data.filter(r => r[idKey] !== id);
      if (mdState.search) mdSearch(mdState.search);
      else { mdState.filtered = [...mdState.data]; renderMasterCRUD(); }
      State.masters[mdState.type] = mdState.data;
    } else {
      toast('ลบผิดพลาด: ' + (res.error||''), 'error');
    }
  } catch (e) {
    toast('ลบผิดพลาด: ' + e.message, 'error');
  }
}

async function apiPut(url, body) {
  const r = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ============================================================
// CHAT PANEL
// ============================================================
function toggleChat() {
  State.chatOpen = !State.chatOpen;
  $('chatPanel').classList.toggle('open', State.chatOpen);
  $('chatToggleBtn').classList.toggle('active', State.chatOpen);
  // Show overlay on mobile/tablet only
  const overlay = $('chatOverlay');
  if (overlay && window.innerWidth <= 992) overlay.classList.toggle('show', State.chatOpen);
  if (overlay && window.innerWidth > 992) overlay.classList.remove('show');
}

function toggleSidebar() {
  // No-op — sidebar removed in new layout
}

// ============================================================
// RFQ MODE SELECTOR — Classic vs AI-Guided (Global Best Practice)
// ============================================================
// Inspired by Top 10 Global Packaging Estimate Systems:
// iQuote(ePS), PrintVis, Salesforce CPQ, Oracle CPQ, P3Source,
// DynamicsPrint, OnPrintShop, Radius ERP, BOSPrint, PrintXpand
// ============================================================

function renderChatWelcome() {
  const container = $('chatMessages');
  if (!container) return;
  container.innerHTML = `
    <div id="chatWelcomeScreen" style="padding:16px 12px;text-align:center">
      <div style="margin-bottom:16px">
        <div style="font-size:15px;font-weight:700;color:var(--text-primary)">สวัสดีครับ ผม Pornchai AI</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">RFQ Agent สำหรับงานพิมพ์บรรจุภัณฑ์</div>
      </div>

      <div style="font-size:11px;font-weight:600;color:var(--accent);margin-bottom:10px;text-transform:uppercase;letter-spacing:1px">เริ่มสร้าง RFQ</div>

      <!-- Mode Cards -->
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">

        <!-- AI-Guided Mode (New) -->
        <div onclick="App.startNewRFQMode()" style="cursor:pointer;background:linear-gradient(135deg,#7c3aed10,#a855f720);border:2px solid var(--accent,#7c3aed);border-radius:14px;padding:14px 12px;text-align:left;transition:all 0.3s;position:relative;overflow:hidden" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 25px rgba(124,58,237,0.2)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
          <div style="position:absolute;top:8px;right:10px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:9px;padding:2px 8px;border-radius:10px;font-weight:700">NEW</div>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#a855f7);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <i class="fas fa-magic" style="color:#fff;font-size:18px"></i>
            </div>
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--text-primary)">AI-Guided RFQ</div>
              <div style="font-size:10px;color:var(--text-muted);margin-top:2px;line-height:1.4">วาง spec หรือพิมพ์ข้อมูล<br>AI จัดการ + คำนวณให้อัตโนมัติ</div>
            </div>
          </div>
          <div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap">
            <span style="font-size:9px;padding:2px 6px;border-radius:6px;background:var(--accent,#7c3aed);color:#fff;opacity:0.8">Smart Parse</span>
            <span style="font-size:9px;padding:2px 6px;border-radius:6px;background:#0ea5e9;color:#fff;opacity:0.8">Auto Fill</span>
            <span style="font-size:9px;padding:2px 6px;border-radius:6px;background:#10b981;color:#fff;opacity:0.8">Live Price</span>
          </div>
        </div>

        <!-- Classic Mode -->
        <div onclick="App.startClassicRFQMode()" style="cursor:pointer;background:var(--bg-card,#fff);border:1.5px solid var(--border-color,#e5e7eb);border-radius:14px;padding:14px 12px;text-align:left;transition:all 0.3s" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 15px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#64748b,#475569);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <i class="fas fa-file-alt" style="color:#fff;font-size:18px"></i>
            </div>
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--text-primary)">Classic Mode</div>
              <div style="font-size:10px;color:var(--text-muted);margin-top:2px;line-height:1.4">ฟอร์ม RFQ แบบดั้งเดิม<br>ระบบคำนวณ Sirivatana v3.1</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:12px">
        <button onclick="App.sendChatText('/list')" style="font-size:10px;padding:5px 10px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-card);color:var(--text-secondary);cursor:pointer"><i class="fas fa-list"></i> RFQ ล่าสุด</button>
        <button onclick="App.showDemoMenu()" style="font-size:10px;padding:5px 10px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-card);color:var(--text-secondary);cursor:pointer"><i class="fas fa-flask"></i> Demo</button>
        <button onclick="App.sendChatText('ช่วยอธิบายระบบ RFQ หน่อย')" style="font-size:10px;padding:5px 10px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-card);color:var(--text-secondary);cursor:pointer"><i class="fas fa-question-circle"></i> ช่วยเหลือ</button>
      </div>

      <div style="font-size:9px;color:var(--text-muted);opacity:0.6">หรือพิมพ์ spec งานด้านล่างได้เลย</div>
    </div>`;
}

// ============================================================
// CONVERSATIONAL AI-GUIDED RFQ — Pornchai AI leads the flow
// Inspired by: iQuote CPQ, Salesforce CPQ, Oracle CPQ
// The AI asks questions one-by-one like a real conversation.
// User answers with interactive pickers → AI confirms → next Q
// ============================================================

function startNewRFQMode() {
  State._rfqMode = 'smart-conv';
  State._smartConvPhase = 'awaiting_spec';
  State._wzStep = null;
  State._formTouched = false;  // New blank form = no warnings yet
  State.form = freshForm();
  State.formMode = 'create';
  State.fieldSource = {};
  State._fillFlow = null;

  // Open chat panel
  const panel = $('chatPanel');
  if (panel && !panel.classList.contains('open')) toggleChat();

  // Clear chat
  const container = $('chatMessages');
  if (container) container.innerHTML = '';

  // Greeting
  addChatMsg('สวัสดีครับ! ผม Pornchai AI พร้อมช่วยสร้าง RFQ ให้แล้ว', 'agent');

  // Prompt with example + quick start
  setTimeout(() => {
    addChatMsg('', 'agent', `<div style="line-height:1.6">
      <div style="font-size:13px;margin-bottom:10px"><b>วาง spec งาน</b> หรือพิมพ์ข้อมูลที่มี ผมจะจัดการให้ครับ</div>
      <div style="background:var(--section-bg,#fafbff);border:1px dashed var(--border-color);border-radius:10px;padding:10px 12px;margin-bottom:10px;font-size:11px;color:var(--text-muted);line-height:1.6">
        <div style="font-weight:600;color:var(--text-secondary);margin-bottom:4px"><i class="fas fa-lightbulb" style="color:#f59e0b;margin-right:4px"></i> ตัวอย่าง</div>
        <div>"กล่องครีม Reverse Tuck 80x120x40mm AC350 4/0 เคลือบ UV 5000 ชิ้น"</div>
        <div style="margin-top:4px">"กล่อง Folding Duplex GBB400 8/0 485x440 gloss UV"</div>
        <div style="margin-top:4px">หรือแค่ <b>"กล่องครีม 5000 ใบ"</b> ก็ได้!</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button onclick="App.smartConvQuickStart()" style="flex:1;padding:8px 14px;border:1.5px solid var(--accent);border-radius:10px;background:var(--bg-card);color:var(--accent);font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='var(--accent)';this.style.color='#fff'" onmouseout="this.style.background='var(--bg-card)';this.style.color='var(--accent)'">
          <i class="fas fa-comments"></i> ไม่มี spec — ถามทีละข้อ
        </button>
      </div>
      <div style="font-size:9px;color:var(--text-muted);margin-top:8px;text-align:center">พิมพ์ข้อมูลด้านล่าง หรือวาง spec ทั้งก้อนได้เลย</div>
    </div>`);
  }, 400);
}

function startClassicRFQMode() {
  State._rfqMode = 'classic';
  State._smartConvPhase = null;  // Clear smart conv state
  State._fillFlow = null;        // Clear fill flow
  State._wzStep = null;
  State._formTouched = false;    // New blank form = no warnings yet
  State.form = freshForm();
  State.formMode = 'create';
  State.fieldSource = {};
  renderForm();
  showView('viewForm');
  setTopBar('สร้าง RFQ ใหม่', 'Classic Mode — กรอกข้อมูลหรือให้ Agent ช่วยกรอก');

  const panel = $('chatPanel');
  if (panel && !panel.classList.contains('open')) toggleChat();

  const container = $('chatMessages');
  if (container) container.innerHTML = '';
  addChatMsg('เริ่มสร้าง RFQ แบบ Classic ครับ! พิมพ์ spec มา หรือกรอกฟอร์มได้เลย', 'agent');
}

// ============================================================
// SMART CONVERSATION ENGINE
// User pastes spec → AI parses → shows understanding → asks missing
// ============================================================

async function handleSmartConvInput(text) {
  const sendBtn = $('btnSend');
  if (sendBtn) sendBtn.disabled = true;

  showTyping(true, [
    'Pornchai AI กำลังอ่าน spec...',
    'กำลังวิเคราะห์ข้อมูล...',
    'กำลังตรวจสอบความครบถ้วน...',
  ]);

  try {
    const res = await apiPost('/api/parse-spec', { message: text });
    showTyping(false);

    if (res.success && res.data) {
      State._lastParsedData = res.data;
      State._lastSpecText = text;

      // Apply parsed data to form (without the form-switching side effects)
      smartApplyData(res.data);

      // Show understanding card
      showUnderstandingCard(res.data, res.validation);

      // Check what's still missing
      const missing = checkMissingFields(State.form);

      if (missing.length === 0) {
        State._smartConvPhase = 'complete';
        setTimeout(() => showSmartSummary(), 600);
      } else {
        State._smartConvPhase = 'filling';
        setTimeout(() => {
          addChatMsg(`ยังขาดอีก ${missing.length} รายการ ผมจะถามทีละข้อครับ`, 'agent');
          const queue = missing.map(m => buildFillQuestion(m));
          State._fillFlow = {
            active: true,
            queue,
            currentIndex: 0,
            onComplete: () => smartConvFlowComplete()
          };
          setTimeout(() => askNextFillQuestion(), 400);
        }, 500);
      }
    } else {
      // Parse failed — offer fallback
      addChatMsg('ผมยังไม่เข้าใจ spec ครบ ลองระบุเพิ่ม หรือกดปุ่มด้านล่างเพื่อเริ่มกรอกทีละข้อครับ', 'agent',
        `<div style="margin-top:8px"><button onclick="App.smartConvQuickStart()" style="padding:6px 14px;border:1.5px solid var(--accent);border-radius:8px;background:var(--bg-card);color:var(--accent);font-size:12px;cursor:pointer"><i class="fas fa-comments"></i> เริ่มกรอกทีละข้อ</button></div>`);
    }
  } catch (e) {
    showTyping(false);
    addChatMsg('เกิดข้อผิดพลาด: ' + e.message + '\nลองใหม่อีกครั้ง หรือกดปุ่มด้านล่าง', 'agent',
      `<div style="margin-top:8px"><button onclick="App.smartConvQuickStart()" style="padding:6px 14px;border:1.5px solid var(--accent);border-radius:8px;background:var(--bg-card);color:var(--accent);font-size:12px;cursor:pointer"><i class="fas fa-comments"></i> เริ่มกรอกทีละข้อ</button></div>`);
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
}

// Apply parsed data to State.form without switching views (unlike applyAgentData)
function smartApplyData(data) {
  if (!data) return;
  const f = State.form;
  const src = State.fieldSource || {};

  if (data.job_name) { f.job_name = data.job_name; src.job_name = 'ai'; }
  if (data.qty) {
    if (Array.isArray(data.qty)) f.qty = data.qty.map(q => String(q));
    else f.qty = [String(data.qty)];
  }
  if (data.ink_type) f.ink_type = data.ink_type;
  if (data.print_type) f.print_type = data.print_type;
  if (data.delivery_date) { f.delivery_date = data.delivery_date; src.delivery_date = 'ai'; }
  if (data.delivery && Array.isArray(data.delivery)) { f.delivery = data.delivery; src.delivery = 'ai'; }

  // Customer
  if (data.customer_search) {
    f.customer = { customer_name: data.customer_search };
    src.customer = 'ai';
  } else if (data.customer) {
    if (typeof data.customer === 'string') f.customer.customer_name = data.customer;
    else Object.assign(f.customer, data.customer);
    src.customer = 'ai';
  }

  // AE search
  if (data.ae_search) { f.ae_search = data.ae_search; src.ae = 'ai'; }

  // Run-On
  if (data.run_on_percent) { f.run_on_percent = String(data.run_on_percent); }

  // Diecut flag
  if (data.is_diecut) { f.is_diecut = true; }

  // Machine
  if (data.machine_name) { f.machine_name = data.machine_name; }

  // Components
  if (data.components && data.components.length > 0) {
    data.components.forEach((dc, i) => {
      if (!f.components[i]) f.components.push({ paper: {}, color: {}, packaging_size: {}, box_type: {}, addon: [], component_type: 1, component_name: '' });
      const c = f.components[i];

      if (dc.component_name) c.component_name = dc.component_name;
      if (dc.component_type) c.component_type = dc.component_type;

      // Box type from parsed box_type_id
      if (dc.box_type_id) {
        if (!c.box_type) c.box_type = {};
        c.box_type.type_id = String(dc.box_type_id);
      }

      if (dc.paper) {
        if (!c.paper) c.paper = {};
        if (dc.paper.paper_code) c.paper.paper_code = dc.paper.paper_code;
        if (dc.paper.paper_gram) c.paper.paper_gram = String(dc.paper.paper_gram);
        if (dc.paper.paper_cost) c.paper.paper_cost = String(dc.paper.paper_cost);
        if (dc.paper.paper_markup) c.paper.paper_markup = String(dc.paper.paper_markup);
        if (dc.paper.paper_source_id) c.paper.paper_source_id = dc.paper.paper_source_id;
        if (dc.paper.paper_name) c.paper.paper_name = dc.paper.paper_name;
        if (dc.paper.paper_brand) c.paper.paper_brand = dc.paper.paper_brand;
      }
      if (dc.color) {
        if (!c.color) c.color = {};
        if (dc.color.outside != null) c.color.outside = String(dc.color.outside);
        if (dc.color.inside != null) c.color.inside = String(dc.color.inside);
        if (dc.color.f_code) c.color.f_code = dc.color.f_code;
      }
      if (dc.packaging_size) {
        if (!c.packaging_size) c.packaging_size = {};
        if (dc.packaging_size.width) c.packaging_size.width = String(dc.packaging_size.width);
        if (dc.packaging_size.length) c.packaging_size.length = String(dc.packaging_size.length);
        if (dc.packaging_size.depth != null) c.packaging_size.depth = String(dc.packaging_size.depth);
      }
      if (dc.box_type) c.box_type = dc.box_type;
      // Addons — normalize types and build proper addon objects
      console.log('[ApplyAddon] dc.addon:', dc.addon?.length || 0, 'items for comp:', dc.component_name || ci);
      if (dc.addon && dc.addon.length > 0) {
        if (!c.addon) c.addon = [];
        for (const raw of dc.addon) {
          // Normalize type: foil_stamp → foilstamp
          let adType = (raw.type || '').replace(/_/g, '');
          if (adType === 'hotfoil') adType = 'foilstamp';
          // Skip types that are just metadata (binding, finishing stored as note)
          if (['binding', 'finishing'].includes(raw.type)) {
            // Store as note but don't create form addon
            if (!c.notes) c.notes = [];
            c.notes.push(raw.detail || raw.type);
            continue;
          }
          const ad = freshAddon(adType);
          ad.name = { coating: 'Coating', foilstamp: 'Foil stamp', emboss: 'Emboss', deboss: 'Deboss' }[adType] || raw.detail || adType;
          // Foil stamp — parse color from detail
          if (adType === 'foilstamp' && raw.detail) {
            const foilColorMap = {
              'silver': 'เงิน', 'gold': 'ทอง', 'red': 'แดง', 'blue': 'น้ำเงิน',
              'green': 'เขียว', 'black': 'ดำ', 'white': 'ขาว', 'hologram': 'โฮโลแกรม',
              'rose gold': 'Rose Gold', 'copper': 'ทองแดง',
              'เงิน': 'เงิน', 'ทอง': 'ทอง', 'แดง': 'แดง', 'ดำ': 'ดำ'
            };
            const detailLower = raw.detail.toLowerCase();
            for (const [eng, th] of Object.entries(foilColorMap)) {
              if (detailLower.includes(eng)) { ad.info.foil_color = th; break; }
            }
          }
          // Coating — parse side and detail
          if (adType === 'coating' && raw.detail) {
            ad.info.name = raw.detail;
            if (raw.side) ad.info.side = raw.side;
          }
          // For foilstamp/emboss/deboss: allow multiple items (different colors/sizes)
          // For coating: replace existing to avoid true duplicates
          if (adType === 'coating') {
            const existKey = (ad.info?.name || '') + (ad.info?.side || '');
            c.addon = c.addon.filter(a => a.type !== 'coating' || ((a.info?.name || '') + (a.info?.side || '')) !== existKey);
          }
          // Parse size from detail for foil/emboss/deboss
          let parsedSize = null;
          if (['foilstamp','emboss','deboss'].includes(adType) && raw.detail) {
            const szMatch = raw.detail.match(/(\d+(?:\.\d+)?)\s*["""\u201C\u201D']?\s*[x×]\s*(\d+(?:\.\d+)?)/i);
            if (szMatch) parsedSize = { w: szMatch[1], l: szMatch[2] };
          }
          // Foil stamp: parse color + code
          if (adType === 'foilstamp' && raw.detail) {
            const colorMatch = raw.detail.match(/(ชมพู(?:อมม่วง)?|ทอง(?:กลาง|เข้ม|อ่อน|แดง)?|เงิน|แดง|น้ำเงิน|ดำ|ขาว|โฮโลแกรม)/i);
            if (colorMatch) ad.info.foil_color = colorMatch[1];
            const codeMatch = raw.detail.match(/\(([^)]+)\)/);
            if (codeMatch) {
              ad.info.foil_code_text = codeMatch[1];
              ad.info.foil_code = codeMatch[1]; // Used by dropdown
            }
          }
          // Foil stamp: merge sizes only if SAME color, otherwise create new addon
          // Emboss/Deboss: merge all sizes into one addon
          console.log('[AddonParse]', adType, 'color:', ad.info?.foil_color, 'size:', parsedSize, 'detail:', raw.detail?.substring(0, 50));
          if (adType === 'foilstamp') {
            const sameColor = ad.info?.foil_color && c.addon.find(a => a.type === 'foilstamp' && a.info?.foil_color === ad.info.foil_color);
            if (sameColor) {
              if (!sameColor.info.sizes) sameColor.info.sizes = [];
              if (parsedSize) sameColor.info.sizes.push(parsedSize);
            } else {
              if (parsedSize) ad.info.sizes = [parsedSize];
              c.addon.push(ad);
            }
          } else if (['emboss','deboss'].includes(adType)) {
            const existing = c.addon.find(a => a.type === adType);
            if (existing) {
              if (!existing.info.sizes) existing.info.sizes = [];
              if (parsedSize) existing.info.sizes.push(parsedSize);
            } else {
              if (parsedSize) ad.info.sizes = [parsedSize];
              c.addon.push(ad);
            }
          } else {
            c.addon.push(ad);
          }
        }
      }
      if (dc.packing_detail) c.packing_detail = dc.packing_detail;
    });
  }
}

function showUnderstandingCard(data, validation) {
  const comp = data.components?.[0] || {};
  const paper = comp.paper || {};
  const color = comp.color || {};
  const sz = comp.packaging_size || {};
  const addons = comp.addon || [];
  const labels = { coating: 'เคลือบ', foilstamp: 'ปั๊มฟอยล์', foil_stamp: 'ปั๊มฟอยล์', emboss: 'ปั๊มนูน', deboss: 'ปั๊มจม', binding: 'Binding', finishing: 'Finishing' };
  const addonText = addons.map(a => {
    const l = labels[a.type] || a.type;
    if (a.detail) {
      // Clean up detail: remove "foil stamp" prefix, "coating" prefix, "emboss"/"deboss" prefix
      let d = a.detail.replace(/^(?:foil\s*stamp|coating|emboss|deboss)\s*/i, '').trim();
      return d ? `${l}: ${d}` : l;
    }
    return l;
  }).join(', ');

  // Size display with inches if available — omit depth if 0 (2D product like book)
  const szInch = comp.packaging_size_inches;
  let szDisplay = null;
  if (sz.width) {
    const w = sz.width, l = sz.length || 0, d = sz.depth || 0;
    const hasDepth = d > 0;
    szDisplay = hasDepth ? `${w} x ${l} x ${d} mm` : `${w} x ${l} mm`;
    if (szInch) {
      szDisplay += hasDepth
        ? ` (${szInch.width}" x ${szInch.length}" x ${szInch.depth}")`
        : ` (${szInch.width}" x ${szInch.length}")`;
    }
  }

  // Determine status of each field — show ALL data from customer spec
  const fields = [
    { label: 'ชื่องาน', value: data.job_name, ok: !!data.job_name },
    { label: 'ลูกค้า', value: data.customer_search || null, ok: !!data.customer_search },
    { label: 'AE', value: data.ae_search || null, ok: !!data.ae_search },
    { label: 'วันจัดส่ง', value: data.delivery_date || null, ok: !!data.delivery_date },
    { label: 'ขนาด', value: szDisplay, ok: !!sz.width },
    { label: 'ทรงกล่อง', value: comp.box_type_id ? `Type ${comp.box_type_id}` : null, ok: !!comp.box_type_id },
    { label: 'กระดาษ', value: comp.paper_description || (paper.paper_code ? `${paper.paper_code} ${paper.paper_gram || '?'} gsm` : null), ok: !!(paper.paper_code && paper.paper_gram) },
    { label: 'ราคากระดาษ', value: paper.paper_cost ? `Cost: ${paper.paper_cost} / Markup: ${paper.paper_markup || '-'}%` : null, ok: !!paper.paper_cost },
    { label: 'สีพิมพ์', value: color.outside != null ? `${color.outside}/${color.inside || 0}` : null, ok: color.outside != null },
    { label: 'หมึก', value: data.ink_type || null, ok: !!data.ink_type },
    { label: 'ประเภทพิมพ์', value: data.print_type || null, ok: !!data.print_type },
    { label: 'ตกแต่ง', value: addonText || null, ok: addons.length > 0 },
    { label: 'จำนวน', value: data.qty?.length ? data.qty.map(q => parseInt(q).toLocaleString()).join(', ') + ' ชิ้น' : null, ok: data.qty?.some(q => q && parseInt(q) > 0) },
    { label: 'F Codes', value: data.f_codes?.length ? data.f_codes.map(fc => fc.f_code).join(', ') + ` (${data.f_codes.length} F)` : null, ok: data.f_codes?.length > 0 },
    { label: 'Diecut', value: data.is_diecut ? 'ใช่' : null, ok: !!data.is_diecut },
    { label: 'Extent', value: comp.extent || null, ok: !!comp.extent },
    { label: 'Material', value: comp.material_note || null, ok: !!comp.material_note },
    { label: 'Packing', value: comp.packing_detail || null, ok: !!comp.packing_detail },
    { label: 'จัดส่ง', value: data.delivery_province || (typeof data.delivery === 'string' ? data.delivery : null), ok: !!data.delivery_province },
  ];

  // Add any extra_details captured from unrecognized key-value pairs
  if (data.extra_details) {
    for (const ed of data.extra_details) {
      fields.push({ label: ed.key, value: ed.value, ok: true });
    }
  }

  // Only count core RFQ fields for percentage (not extras/info)
  const coreFields = fields.slice(0, 8); // ชื่องาน through จำนวน
  const filled = coreFields.filter(f => f.ok).length;
  const total = coreFields.length;
  const pct = Math.round(filled / total * 100);

  let rows = fields.map(f => {
    if (!f.value && !f.ok) return ''; // skip empty fields
    const icon = f.ok ? '<i class="fas fa-check-circle" style="color:#10b981;width:14px"></i>' : '<i class="fas fa-question-circle" style="color:#ef4444;width:14px"></i>';
    // Truncate long values for display
    const displayVal = f.value && f.value.length > 80 ? f.value.substring(0, 77) + '...' : (f.value || '-');
    return `<div style="display:flex;align-items:start;gap:8px;padding:4px 0;border-bottom:1px solid var(--border-color)20">
      <div style="margin-top:2px">${icon}</div>
      <span style="font-size:11px;color:var(--text-muted);width:60px;flex-shrink:0;margin-top:1px">${f.label}</span>
      <span style="font-size:12px;font-weight:600;color:var(--text-primary);flex:1;word-break:break-word">${displayVal}</span>
    </div>`;
  }).filter(r => r).join('');

  // Source badge
  const source = data._source === 'openclaw' ? 'AI Agent' : 'Built-in Parser';

  addChatMsg('', 'agent', `<div style="border:1.5px solid var(--accent);border-radius:14px;padding:14px;background:linear-gradient(135deg,rgba(124,58,237,0.03),rgba(168,85,247,0.08))">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div style="font-size:13px;font-weight:700;color:var(--text-primary)"><i class="fas fa-brain" style="color:var(--accent);margin-right:6px"></i>Pornchai AI เข้าใจแล้ว</div>
      <div style="font-size:10px;padding:2px 8px;border-radius:8px;background:var(--accent);color:#fff;font-weight:600">${pct}%</div>
    </div>
    <div style="height:4px;border-radius:2px;background:var(--border-color);margin-bottom:10px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#7c3aed,#10b981);border-radius:2px;transition:width 0.5s"></div>
    </div>
    ${rows}
    <div style="font-size:9px;color:var(--text-muted);margin-top:6px;text-align:right">via ${source}</div>
  </div>`);
}

function showSmartSummary() {
  const f = State.form || {};
  const comp = f.components?.[0] || {};
  const paper = comp.paper || {};
  const color = comp.color || {};
  const sz = comp.packaging_size || {};
  const hasMultiFQty = f.has_multi_f && f.f_data?.some(fd => parseInt(fd.qty) > 0);
  const qtys = hasMultiFQty ? [f.f_data.reduce((s, fd) => s + (parseInt(fd.qty) || 0), 0)] : (f.qty || []).filter(q => q && parseInt(q) > 0);
  const boxName = comp.box_type?.type_name_th || comp.box_type?.type_name || comp.component_name || '-';
  const addons = comp.addon || [];
  const addonText = formatAddonSummary(addons);

  // Try CalcEngine
  let priceHtml = '';
  if (qtys.length > 0) {
    try {
      if (typeof CalcEngine !== 'undefined') {
        const est = CalcEngine.calcFullEstimate(f);
        if (est && !est.error && est.totals) {
          priceHtml = `<div style="background:linear-gradient(135deg,rgba(16,185,129,0.05),rgba(5,150,105,0.1));border:2px solid #10b981;border-radius:14px;padding:14px;margin-bottom:12px">
            <div style="font-size:12px;font-weight:700;color:#10b981;margin-bottom:8px"><i class="fas fa-check-circle"></i> Estimate สำเร็จ!${est.isMultiF ? ' (Multi-F)' : ''}</div>`;
          est.totals.forEach(t => {
            priceHtml += `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #10b98120">
              <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${t.qty.toLocaleString()} ชิ้น</div>
              <div style="text-align:right">
                <div style="font-size:20px;font-weight:800;color:#10b981">${Math.round(t.finalPrice || 0).toLocaleString()} &#3647;</div>
                <div style="font-size:11px;color:var(--text-muted)">ชิ้นละ ${(t.unitPrice || 0).toFixed(2)} &#3647;</div>
              </div>
            </div>`;
          });
          priceHtml += '</div>';
        } else if (est?.error) {
          priceHtml = `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:10px;font-size:12px;color:#dc2626;margin-bottom:12px"><i class="fas fa-exclamation-triangle"></i> ${est.error}</div>`;
        }
      }
    } catch (e) {
      priceHtml = `<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">ยังคำนวณราคาไม่ได้ — ข้อมูลอาจไม่ครบ</div>`;
    }
  }

  addChatMsg('', 'agent', `<div>
    ${priceHtml}
    <div style="background:var(--bg-card);border:1.5px solid var(--border-color);border-radius:12px;padding:12px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:8px"><i class="fas fa-clipboard-list" style="color:var(--accent);margin-right:4px"></i> สรุป RFQ</div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:12px">
        <span style="color:var(--text-muted)">ชื่องาน</span><span style="font-weight:600;color:var(--text-primary)">${escapeHtml(f.job_name || '-')}</span>
        <span style="color:var(--text-muted)">กล่อง</span><span style="color:var(--text-primary)">${escapeHtml(boxName)}</span>
        <span style="color:var(--text-muted)">ขนาด</span><span style="color:var(--text-primary)">${sz.width||'-'} x ${sz.length||'-'} x ${sz.depth||'-'} mm</span>
        <span style="color:var(--text-muted)">กระดาษ</span><span style="color:var(--text-primary)">${paper.paper_code||'-'} ${paper.paper_gram||'-'} gsm</span>
        <span style="color:var(--text-muted)">สีพิมพ์</span><span style="color:var(--text-primary)">${color.outside||0}/${color.inside||0} หมึก ${f.ink_type||'UV'}</span>
        <span style="color:var(--text-muted)">ตกแต่ง</span><span style="color:var(--text-primary)">${escapeHtml(addonText)}</span>
        <span style="color:var(--text-muted)">จำนวน</span><span style="color:var(--text-primary)">${qtys.map(q => parseInt(q).toLocaleString()).join(', ')} ชิ้น</span>
      </div>
    </div>
    <div style="display:flex;gap:8px">
      <button onclick="App.smartConvApplyToForm()" style="flex:1;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:12px;font-weight:600;cursor:pointer"><i class="fas fa-edit"></i> เปิดฟอร์มแก้ไข</button>
      <button onclick="App.startNewRFQMode()" style="padding:10px 14px;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-card);color:var(--text-muted);font-size:12px;cursor:pointer"><i class="fas fa-redo"></i></button>
    </div>
  </div>`);
}

function smartConvApplyToForm() {
  renderForm();
  showView('viewForm');
  setTopBar('สร้าง RFQ ใหม่', 'AI-Guided — ตรวจสอบและแก้ไขฟอร์มได้');
  addChatMsg('ข้อมูลถูกใส่ลงฟอร์มแล้ว สามารถแก้ไขเพิ่มเติมในฟอร์มด้านซ้ายได้เลยครับ', 'agent');
  toast('ข้อมูลถูกใส่ลงฟอร์มแล้ว', 'success');
}

function smartConvFlowComplete() {
  State._smartConvPhase = 'complete';
  State._fillFlow = null;

  addChatMsg('ข้อมูลครบแล้วครับ! กำลังคำนวณราคาให้...', 'agent');
  setTimeout(() => showSmartSummary(), 500);
}

function smartConvQuickStart() {
  State._smartConvPhase = 'filling';
  if (!State.form) State.form = freshForm();

  addChatMsg('เริ่มจากศูนย์ — ถามทีละข้อ', 'user');

  setTimeout(() => {
    addChatMsg('ได้เลยครับ! ผมจะถามข้อมูลทีละข้อ ตอบหรือกดปุ่มเลือกได้เลย', 'agent');
    const missing = checkMissingFields(State.form);
    const queue = missing.map(m => buildFillQuestion(m));
    State._fillFlow = {
      active: true,
      queue,
      currentIndex: 0,
      onComplete: () => smartConvFlowComplete()
    };
    setTimeout(() => askNextFillQuestion(), 400);
  }, 300);
}

// ---- Conversational Flow Engine (legacy wizard — kept for compat) ----
// wzAsk(step)   → AI asks a question with interactive picker
// wzPick(...)   → user picks → show as user msg → AI confirms → next Q
// Each step = one chat exchange (AI question + user answer)

function wzAsk(stepId) {
  State._wzStep = stepId;
  // Freeze previous active picker so user can't re-pick
  document.querySelectorAll('.wz-live').forEach(el => {
    el.classList.remove('wz-live');
    el.querySelectorAll('[onclick]').forEach(b => { b.style.pointerEvents = 'none'; b.style.cursor = 'default'; });
    el.style.opacity = '0.5';
  });

  switch (stepId) {
    case 'box_type': wzAskBoxType(); break;
    case 'box_size': wzAskSize(); break;
    case 'material': wzAskMaterial(); break;
    case 'printing': wzAskPrinting(); break;
    case 'addons': wzAskAddons(); break;
    case 'quantity': wzAskQuantity(); break;
    case 'summary': wzShowSummary(); break;
  }
}

// Progress indicator — small dots at top of each AI message
function wzProgress(current) {
  const steps = ['box_type','box_size','material','printing','addons','quantity','summary'];
  const icons = ['fa-box','fa-ruler-combined','fa-scroll','fa-palette','fa-star','fa-sort-numeric-up','fa-calculator'];
  const idx = steps.indexOf(current);
  return `<div style="display:flex;gap:3px;margin-bottom:10px">${steps.map((s, i) => {
    const done = i < idx, active = i === idx;
    const bg = done ? '#10b981' : active ? 'var(--accent,#7c3aed)' : 'var(--border-color)';
    const size = active ? '24px' : '20px';
    return `<div style="width:${size};height:${size};border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;transition:all 0.3s"><i class="fas ${icons[i]}" style="font-size:${active?'10':'8'}px;color:${done||active?'#fff':'var(--text-muted)'}"></i></div>`;
  }).join('')}</div>`;
}

// ---- Step 1: Box Type ----
function wzAskBoxType() {
  const templates = State.masters?.boxtemplate_info || [];
  const popular = [1, 2, 3, 4, 11];
  let cards = '';
  templates.slice(0, 12).forEach(bt => {
    const isPop = popular.includes(bt.type_id);
    cards += `<div onclick="App.wzPickBox(${bt.type_id})" style="cursor:pointer;border:1.5px solid var(--border-color);border-radius:10px;padding:6px;text-align:center;transition:all 0.2s;background:var(--bg-card);position:relative" onmouseover="this.style.borderColor='var(--accent)';this.style.transform='scale(1.03)'" onmouseout="this.style.borderColor='var(--border-color)';this.style.transform=''">
      ${isPop ? '<div style="position:absolute;top:3px;right:5px;font-size:8px;color:#f59e0b">&#9733;</div>' : ''}
      <img src="img/${bt.type_id}.jpg" style="width:100%;max-height:50px;object-fit:contain;border-radius:4px;margin-bottom:3px" onerror="this.outerHTML='<i class=\\'fas fa-box\\' style=\\'font-size:20px;color:var(--text-muted);margin-bottom:3px;display:block\\'></i>'">
      <div style="font-size:9px;font-weight:600;color:var(--text-primary);line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${bt.type_name_th || bt.type_name}</div>
    </div>`;
  });

  addChatMsg('', 'agent', `<div class="wz-live">
    ${wzProgress('box_type')}
    <div style="font-size:13px;margin-bottom:8px">เลือก<b>รูปแบบกล่อง</b>ที่ต้องการครับ</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-height:240px;overflow-y:auto;padding:2px">${cards}</div>
    <div style="font-size:9px;color:var(--text-muted);margin-top:6px;text-align:center">&#9733; = ยอดนิยม | เลื่อนลงดูเพิ่ม</div>
  </div>`);
}

function wzPickBox(typeId) {
  if (!State.form) State.form = freshForm();
  const templates = State.masters?.boxtemplate_info || [];
  const bt = templates.find(b => b.type_id === typeId);
  if (!bt) return;
  State.form.components[0].box_type = { type_id: bt.type_id, type_name: bt.type_name, type_name_th: bt.type_name_th };
  State.form.components[0].component_name = bt.type_name;

  const name = bt.type_name_th || bt.type_name;
  addChatMsg(`${name}`, 'user');
  setTimeout(() => {
    addChatMsg(`${name} ครับ`, 'agent');
    setTimeout(() => wzAsk('box_size'), 300);
  }, 300);
}

// ---- Step 2: Size ----
function wzAskSize() {
  const sz = State.form?.components?.[0]?.packaging_size || {};
  addChatMsg('', 'agent', `<div class="wz-live">
    ${wzProgress('box_size')}
    <div style="font-size:13px;margin-bottom:10px">ขนาดกล่อง <b>กว้าง x ยาว x สูง</b> (mm) เท่าไหร่ครับ?</div>
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <div style="flex:1;text-align:center">
        <div style="font-size:9px;color:var(--text-muted);margin-bottom:3px">กว้าง (W)</div>
        <input id="wz_w" type="number" placeholder="100" value="${sz.width||''}" style="width:100%;padding:8px;border:1.5px solid var(--border-color);border-radius:8px;font-size:14px;text-align:center;background:var(--bg-input);color:var(--text-primary)">
      </div>
      <div style="align-self:center;color:var(--text-muted);font-size:16px;padding-top:14px">x</div>
      <div style="flex:1;text-align:center">
        <div style="font-size:9px;color:var(--text-muted);margin-bottom:3px">ยาว (L)</div>
        <input id="wz_l" type="number" placeholder="150" value="${sz.length||''}" style="width:100%;padding:8px;border:1.5px solid var(--border-color);border-radius:8px;font-size:14px;text-align:center;background:var(--bg-input);color:var(--text-primary)">
      </div>
      <div style="align-self:center;color:var(--text-muted);font-size:16px;padding-top:14px">x</div>
      <div style="flex:1;text-align:center">
        <div style="font-size:9px;color:var(--text-muted);margin-bottom:3px">สูง (D)</div>
        <input id="wz_d" type="number" placeholder="50" value="${sz.depth||''}" style="width:100%;padding:8px;border:1.5px solid var(--border-color);border-radius:8px;font-size:14px;text-align:center;background:var(--bg-input);color:var(--text-primary)">
      </div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:6px">
      <div style="font-size:9px;color:var(--text-muted);flex:1">ชื่องาน (ถ้ามี)</div>
    </div>
    <input id="wz_jobname" value="${escapeHtml(State.form?.job_name||'')}" placeholder="เช่น กล่องครีม ABC" style="width:100%;padding:7px 10px;border:1.5px solid var(--border-color);border-radius:8px;font-size:12px;background:var(--bg-input);color:var(--text-primary);margin-bottom:10px">
    <button onclick="App.wzPickSize()" style="width:100%;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:13px;font-weight:600;cursor:pointer">ถัดไป <i class="fas fa-arrow-right"></i></button>
  </div>`);
}

function wzPickSize() {
  const w = document.getElementById('wz_w')?.value || '';
  const l = document.getElementById('wz_l')?.value || '';
  const d = document.getElementById('wz_d')?.value || '';
  const job = document.getElementById('wz_jobname')?.value || '';
  if (!w || !l || !d) { toast('กรุณาระบุขนาดให้ครบ 3 ด้าน', 'warning'); return; }

  if (!State.form) State.form = freshForm();
  const comp = State.form.components[0];
  if (!comp.packaging_size) comp.packaging_size = {};
  comp.packaging_size.width = w;
  comp.packaging_size.length = l;
  comp.packaging_size.depth = d;
  if (job) State.form.job_name = job;

  addChatMsg(`${w} x ${l} x ${d} mm${job ? ' — ' + job : ''}`, 'user');
  setTimeout(() => {
    addChatMsg(`ขนาด ${w}x${l}x${d} mm ครับ`, 'agent');
    setTimeout(() => wzAsk('material'), 300);
  }, 300);
}

// ---- Step 3: Material (Paper + GSM) ----
function wzAskMaterial() {
  const topPapers = [
    { code: 'AC C1s', label: 'Art Card C1s', tip: 'เคลือบหน้าเดียว ยอดนิยม' },
    { code: 'AC C2s', label: 'Art Card C2s', tip: 'เคลือบสองหน้า' },
    { code: 'SBS',    label: 'SBS',          tip: 'ขาวทั้งสองด้าน' },
    { code: 'Dup GBB',label: 'Duplex เทา',   tip: 'หลังเทา ราคาประหยัด' },
    { code: 'Dup WBB',label: 'Duplex ขาว',   tip: 'หลังขาว' },
    { code: 'IVR',    label: 'Ivory',        tip: 'งานพรีเมียม' },
    { code: 'KA',     label: 'Kraft',        tip: 'กระดาษคราฟท์' },
    { code: 'MA',     label: 'Matt Art',     tip: 'ผิวด้าน' },
  ];

  let cards = topPapers.map(p =>
    `<div onclick="App.wzPickPaper('${p.code}')" style="cursor:pointer;padding:8px;border:1.5px solid var(--border-color);border-radius:10px;background:var(--bg-card);transition:all 0.2s;text-align:center" onmouseover="this.style.borderColor='var(--accent)';this.style.transform='scale(1.03)'" onmouseout="this.style.borderColor='var(--border-color)';this.style.transform=''">
      <div style="font-size:12px;font-weight:700;color:var(--text-primary)">${p.code}</div>
      <div style="font-size:9px;color:var(--text-muted);margin-top:2px">${p.tip}</div>
    </div>`
  ).join('');

  const sz = State.form?.components?.[0]?.packaging_size || {};
  const recPaper = (parseFloat(sz.depth) || 0) > 80 ? 'AC C1s' : 'AC C1s';
  const recGsm = (parseFloat(sz.depth) || 0) > 100 ? '350' : '300';

  addChatMsg('', 'agent', `<div class="wz-live">
    ${wzProgress('material')}
    <div style="font-size:13px;margin-bottom:4px">ใช้<b>กระดาษ</b>อะไรดีครับ?</div>
    <div style="background:linear-gradient(135deg,rgba(124,58,237,0.05),rgba(168,85,247,0.1));border:1px solid var(--accent);border-radius:8px;padding:6px 10px;margin-bottom:8px;font-size:10px;color:var(--accent)">
      <i class="fas fa-robot" style="margin-right:4px"></i> AI แนะนำ: <b>${recPaper} ${recGsm} gsm</b> สำหรับกล่องขนาดนี้
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">${cards}</div>
  </div>`);
}

function wzPickPaper(code) {
  if (!State.form) State.form = freshForm();
  const comp = State.form.components[0];
  if (!comp.paper) comp.paper = {};
  comp.paper.paper_code = code;

  addChatMsg(code, 'user');
  setTimeout(() => {
    addChatMsg(`กระดาษ ${code} ครับ เลือก<b>แกรม</b>เลย`, 'agent');
    setTimeout(() => wzAskGsm(code), 300);
  }, 300);
}

function wzAskGsm(paperCode) {
  const gsmKey = 'paper_gsm_' + paperCode;
  const gsmList = State.masters?.[gsmKey] || [200, 250, 270, 300, 350, 400];

  let btns = gsmList.map(g =>
    `<button onclick="App.wzPickGsm('${g}')" style="padding:8px 12px;border:1.5px solid var(--border-color);border-radius:8px;background:var(--bg-card);font-size:13px;font-weight:600;color:var(--text-primary);cursor:pointer;transition:all 0.2s;min-width:50px" onmouseover="this.style.borderColor='#0ea5e9';this.style.background='#0ea5e910'" onmouseout="this.style.borderColor='var(--border-color)';this.style.background='var(--bg-card)'">${g}</button>`
  ).join('');

  addChatMsg('', 'agent', `<div class="wz-live">
    <div style="font-size:13px;margin-bottom:8px">แกรม (GSM) เท่าไหร่ครับ?</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${btns}</div>
  </div>`);
}

function wzPickGsm(gsm) {
  const comp = State.form.components[0];
  if (!comp.paper) comp.paper = {};
  comp.paper.paper_gram = String(gsm);
  if (typeof autoFillPaperFromDB === 'function') autoFillPaperFromDB(comp.paper, false);

  addChatMsg(`${gsm} gsm`, 'user');
  setTimeout(() => {
    addChatMsg(`${comp.paper.paper_code} ${gsm} gsm ครับ`, 'agent');
    setTimeout(() => wzAsk('printing'), 300);
  }, 300);
}

// ---- Step 4: Printing (Color + Ink) ----
function wzAskPrinting() {
  // Quick presets for common color combos
  const presets = [
    { out: 4, in: 0, label: '4/0', tip: '4 สีด้านนอก (ยอดนิยม)' },
    { out: 4, in: 1, label: '4/1', tip: '4 สีนอก + 1 สีใน' },
    { out: 4, in: 4, label: '4/4', tip: '4 สี ทั้งสองด้าน' },
    { out: 1, in: 0, label: '1/0', tip: '1 สี (ประหยัด)' },
    { out: 2, in: 0, label: '2/0', tip: '2 สีด้านนอก' },
    { out: 5, in: 0, label: '5/0', tip: '5 สี + spot color' },
  ];

  let presetBtns = presets.map(p =>
    `<div onclick="App.wzPickColor(${p.out},${p.in})" style="cursor:pointer;padding:10px 8px;border:1.5px solid var(--border-color);border-radius:10px;background:var(--bg-card);text-align:center;transition:all 0.2s" onmouseover="this.style.borderColor='var(--accent)';this.style.transform='scale(1.05)'" onmouseout="this.style.borderColor='var(--border-color)';this.style.transform=''">
      <div style="font-size:18px;font-weight:800;color:var(--accent)">${p.label}</div>
      <div style="font-size:9px;color:var(--text-muted);margin-top:2px">${p.tip}</div>
    </div>`
  ).join('');

  addChatMsg('', 'agent', `<div class="wz-live">
    ${wzProgress('printing')}
    <div style="font-size:13px;margin-bottom:8px">พิมพ์<b>กี่สี</b>ครับ? (ด้านนอก/ด้านใน)</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">${presetBtns}</div>
    <div style="font-size:10px;color:var(--text-muted);text-align:center">หรือพิมพ์จำนวนสีเอง เช่น "6/2"</div>
  </div>`);
}

function wzPickColor(out, inn) {
  if (!State.form) State.form = freshForm();
  const comp = State.form.components[0];
  if (!comp.color) comp.color = {};
  comp.color.outside = out;
  comp.color.inside = inn;

  addChatMsg(`${out}/${inn} สี`, 'user');
  setTimeout(() => {
    // Auto-recommend ink type
    State.form.ink_type = 'UV';
    addChatMsg(`${out}/${inn} สี + หมึก UV ครับ`, 'agent');
    setTimeout(() => wzAsk('addons'), 300);
  }, 300);
}

// ---- Step 5: Addons ----
function wzAskAddons() {
  const addonOpts = [
    { type: 'coating', icon: 'fa-shield-alt', label: 'เคลือบ', color: '#10b981', tip: 'PVC, UV, WB' },
    { type: 'foilstamp', icon: 'fa-stamp', label: 'ปั๊มฟอยล์', color: '#f59e0b', tip: 'ทอง, เงิน, โฮโลแกรม' },
    { type: 'emboss', icon: 'fa-hand-point-up', label: 'ปั๊มนูน/จม', color: '#7c3aed', tip: 'Emboss / Deboss' },
  ];

  let cards = addonOpts.map(a =>
    `<div onclick="App.wzToggleAddon(this,'${a.type}')" data-type="${a.type}" style="cursor:pointer;padding:12px;border:1.5px solid var(--border-color);border-radius:10px;background:var(--bg-card);text-align:center;transition:all 0.2s" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform=''">
      <i class="fas ${a.icon}" style="font-size:20px;color:${a.color};display:block;margin-bottom:4px"></i>
      <div style="font-size:12px;font-weight:600;color:var(--text-primary)">${a.label}</div>
      <div style="font-size:9px;color:var(--text-muted)">${a.tip}</div>
      <div class="wz-check" style="margin-top:4px;font-size:9px;color:#10b981;display:none"><i class="fas fa-check-circle"></i> เลือกแล้ว</div>
    </div>`
  ).join('');

  addChatMsg('', 'agent', `<div class="wz-live" id="wzAddonPicker">
    ${wzProgress('addons')}
    <div style="font-size:13px;margin-bottom:8px">ต้องการ<b>ตกแต่งเพิ่ม</b>ไหมครับ? (กดเลือกได้หลายอย่าง)</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">${cards}</div>
    <div style="display:flex;gap:6px">
      <button onclick="App.wzPickAddons()" style="flex:2;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:13px;font-weight:600;cursor:pointer">ถัดไป <i class="fas fa-arrow-right"></i></button>
      <button onclick="App.wzSkipAddons()" style="flex:1;padding:10px;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-card);color:var(--text-muted);font-size:12px;cursor:pointer">ข้าม</button>
    </div>
  </div>`);
}

function wzToggleAddon(el, type) {
  if (!State.form) State.form = freshForm();
  const comp = State.form.components[0];
  if (!comp.addon) comp.addon = [];
  const idx = comp.addon.findIndex(a => a.type === type);
  if (idx >= 0) {
    comp.addon.splice(idx, 1);
    el.style.borderColor = 'var(--border-color)';
    el.querySelector('.wz-check').style.display = 'none';
  } else {
    comp.addon.push({ type, detail: '' });
    el.style.borderColor = '#10b981';
    el.style.background = '#10b98108';
    el.querySelector('.wz-check').style.display = 'block';
  }
}

function wzPickAddons() {
  const comp = State.form.components[0];
  const addons = comp.addon || [];
  const addonText = formatAddonSummary(addons);

  addChatMsg(addonText, 'user');
  setTimeout(() => {
    addChatMsg(addons.length > 0
      ? `เพิ่ม${addonText}ครับ`
      : 'ไม่เพิ่มงานตกแต่งครับ', 'agent');
    setTimeout(() => wzAsk('quantity'), 300);
  }, 300);
}

function wzSkipAddons() {
  addChatMsg('ไม่เพิ่มงานตกแต่ง', 'user');
  setTimeout(() => {
    addChatMsg('ข้ามงานตกแต่งครับ', 'agent');
    setTimeout(() => wzAsk('quantity'), 300);
  }, 300);
}

// ---- Step 6: Quantity ----
function wzAskQuantity() {
  const quickQtys = [1000, 3000, 5000, 10000, 20000, 50000];
  let quickBtns = quickQtys.map(q =>
    `<button onclick="App.wzPickQty(${q})" style="padding:8px 10px;border:1.5px solid var(--border-color);border-radius:8px;background:var(--bg-card);font-size:12px;font-weight:600;color:var(--text-primary);cursor:pointer;transition:all 0.2s;min-width:60px" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border-color)'">${q.toLocaleString()}</button>`
  ).join('');

  addChatMsg('', 'agent', `<div class="wz-live">
    ${wzProgress('quantity')}
    <div style="font-size:13px;margin-bottom:8px">สั่งผลิต<b>จำนวนเท่าไหร่</b>ครับ?</div>
    <div style="margin-bottom:8px">
      <input id="wz_qty" type="number" placeholder="ระบุจำนวน (ชิ้น)" style="width:100%;padding:10px;border:1.5px solid var(--border-color);border-radius:10px;font-size:14px;background:var(--bg-input);color:var(--text-primary);text-align:center">
    </div>
    <div style="font-size:10px;color:var(--text-muted);margin-bottom:6px">หรือเลือกด่วน</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${quickBtns}</div>
    <button onclick="App.wzPickQtyCustom()" style="width:100%;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:13px;font-weight:600;cursor:pointer">คำนวณราคา <i class="fas fa-calculator"></i></button>
  </div>`);
}

function wzPickQty(qty) {
  if (!State.form) State.form = freshForm();
  State.form.qty = [String(qty)];
  const input = document.getElementById('wz_qty');
  if (input) input.value = qty;

  addChatMsg(`${qty.toLocaleString()} ชิ้น`, 'user');
  setTimeout(() => {
    addChatMsg('กำลังคำนวณราคาให้ครับ...', 'agent');
    setTimeout(() => wzAsk('summary'), 500);
  }, 300);
}

function wzPickQtyCustom() {
  const val = document.getElementById('wz_qty')?.value;
  if (!val || parseInt(val) <= 0) { toast('กรุณาระบุจำนวน', 'warning'); return; }
  wzPickQty(parseInt(val));
}

// ---- Step 7: Summary + Live Price ----
function wzShowSummary() {
  const f = State.form || {};
  const comp = f.components?.[0] || {};
  const paper = comp.paper || {};
  const color = comp.color || {};
  const sz = comp.packaging_size || {};
  const hasMultiFQty2 = f.has_multi_f && f.f_data?.some(fd => parseInt(fd.qty) > 0);
  const qtys = hasMultiFQty2 ? [f.f_data.reduce((s, fd) => s + (parseInt(fd.qty) || 0), 0)] : (f.qty || []).filter(q => q);
  const boxName = comp.box_type?.type_name_th || comp.box_type?.type_name || '-';
  const addons = comp.addon || [];
  const addonText = formatAddonSummary(addons);

  // Try CalcEngine
  let priceHtml = '';
  if (qtys.length > 0) {
    try {
      if (typeof CalcEngine !== 'undefined') {
        const est = CalcEngine.calcFullEstimate(f);
        if (est && !est.error && est.totals) {
          priceHtml = `<div style="background:linear-gradient(135deg,rgba(16,185,129,0.05),rgba(5,150,105,0.1));border:2px solid #10b981;border-radius:14px;padding:14px;margin-bottom:12px">
            <div style="font-size:12px;font-weight:700;color:#10b981;margin-bottom:8px"><i class="fas fa-check-circle"></i> Estimate สำเร็จ!${est.isMultiF ? ' (Multi-F)' : ''}</div>`;
          est.totals.forEach(t => {
            priceHtml += `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #10b98120">
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${t.qty.toLocaleString()} ชิ้น</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:20px;font-weight:800;color:#10b981">${Math.round(t.finalPrice || 0).toLocaleString()} &#3647;</div>
                <div style="font-size:11px;color:var(--text-muted)">ชิ้นละ ${(t.unitPrice || 0).toFixed(2)} &#3647;</div>
              </div>
            </div>`;
          });
          priceHtml += '</div>';
        } else if (est?.error) {
          priceHtml = `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:10px;font-size:12px;color:#dc2626;margin-bottom:12px"><i class="fas fa-exclamation-triangle"></i> ${est.error}</div>`;
        }
      }
    } catch (e) {
      priceHtml = `<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">ยังคำนวณราคาไม่ได้ — ข้อมูลอาจไม่ครบ</div>`;
    }
  }

  addChatMsg('', 'agent', `<div class="wz-live">
    ${wzProgress('summary')}
    ${priceHtml}
    <div style="background:var(--bg-card);border:1.5px solid var(--border-color);border-radius:12px;padding:12px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:8px"><i class="fas fa-clipboard-list" style="color:var(--accent);margin-right:4px"></i> สรุป RFQ</div>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:12px">
        <span style="color:var(--text-muted)">ชื่องาน</span><span style="font-weight:600;color:var(--text-primary)">${f.job_name || '-'}</span>
        <span style="color:var(--text-muted)">กล่อง</span><span style="color:var(--text-primary)">${boxName}</span>
        <span style="color:var(--text-muted)">ขนาด</span><span style="color:var(--text-primary)">${sz.width||'-'} x ${sz.length||'-'} x ${sz.depth||'-'} mm</span>
        <span style="color:var(--text-muted)">กระดาษ</span><span style="color:var(--text-primary)">${paper.paper_code||'-'} ${paper.paper_gram||'-'} gsm</span>
        <span style="color:var(--text-muted)">สีพิมพ์</span><span style="color:var(--text-primary)">${color.outside||0}/${color.inside||0} หมึก ${f.ink_type||'UV'}</span>
        <span style="color:var(--text-muted)">ตกแต่ง</span><span style="color:var(--text-primary)">${addonText}</span>
        <span style="color:var(--text-muted)">จำนวน</span><span style="color:var(--text-primary)">${qtys.map(q => parseInt(q).toLocaleString()).join(', ')} ชิ้น</span>
      </div>
    </div>
    <div style="display:flex;gap:8px">
      <button onclick="App.wizardApplyToForm()" style="flex:1;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:12px;font-weight:600;cursor:pointer"><i class="fas fa-edit"></i> เปิดฟอร์มแก้ไข</button>
      <button onclick="App.wzStartOver()" style="flex:0 0 auto;padding:10px 14px;border:1px solid var(--border-color);border-radius:10px;background:var(--bg-card);color:var(--text-muted);font-size:12px;cursor:pointer"><i class="fas fa-redo"></i></button>
    </div>
  </div>`);
}

function wzStartOver() {
  startNewRFQMode();
}

// ---- Legacy Wizard Compat ----
function wizardApplyToForm() {
  renderForm();
  showView('viewForm');
  setTopBar('สร้าง RFQ ใหม่', 'AI-Guided — ตรวจสอบและแก้ไขฟอร์มได้');
  addChatMsg('ข้อมูลถูกใส่ลงฟอร์มแล้ว สามารถแก้ไขเพิ่มเติมในฟอร์มด้านซ้ายได้เลยครับ', 'agent');
  toast('ข้อมูลถูกใส่ลงฟอร์มแล้ว', 'success');
}

// Keep old function names as aliases for window.App
function wizardSetBoxType(id) { wzPickBox(id); }
function wizardUpdateField(f, v) { if(State.form) State.form[f] = v; }
function wizardUpdateSize(d, v) { if(State.form?.components?.[0]) { if(!State.form.components[0].packaging_size) State.form.components[0].packaging_size = {}; State.form.components[0].packaging_size[d] = v; } }
function wizardSetPaper(c) { wzPickPaper(c); }
function wizardSetGsm(g) { wzPickGsm(g); }
function wizardSetCompType(t) { if(State.form) State.form.components[0].component_type = t; }
function wizardSetColor(s, v) { if(State.form) { if(!State.form.components[0].color) State.form.components[0].color = {}; State.form.components[0].color[s] = v; } }
function wizardSetInk(t) { if(State.form) State.form.ink_type = t; }
function wizardToggleAddon(t) { }
function wizardSetQty(i, v) { if(State.form) { if(!State.form.qty) State.form.qty = ['']; State.form.qty[i] = String(v); } }
function wizardAddQty() { }
function wizardSetDelivery(t) { }
function wizardNext() { }
function wizardBack() { }
function wizardFinish() { }
function refreshWizardStep() { }

function addChatMsg(text, type = 'agent', extraHtml = '') {
  const container = $('chatMessages');
  const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const div = document.createElement('div');
  div.className = `message ${type}`;
  // Format: bold, links, validation markers
  let html = escapeHtml(text)
    .replace(/\[ขาด\]/g, '<span style="color:#dc3545;font-weight:600">[ขาด]</span>')
    .replace(/\[ตรวจสอบ\]/g, '<span style="color:#e67e22;font-weight:600">[ตรวจสอบ]</span>')
    .replace(/\[แจ้ง\]/g, '<span style="color:#3498db;font-weight:600">[แจ้ง]</span>')
    .replace(/!! (.+?) !!/g, '<div style="color:#dc3545;font-weight:700;margin-top:8px;padding:4px 0;border-top:1px solid #f5c6cb">$1</div>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#7c3aed;font-weight:700">$1</strong>')
    .replace(/-- (.+?) --/g, '<div style="color:#3498db;font-weight:600;margin-top:8px;padding:4px 0;border-top:1px solid #bee5eb">$1</div>')
    // URL → clickable link
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" style="color:#7c3aed;text-decoration:underline">$1</a>')
    .replace(/\n/g, '<br>');
  div.innerHTML = `${html}${extraHtml}<div class="msg-time">${time}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

let typingStepTimer = null;
function showTyping(show, steps) {
  const el = $('typingIndicator');
  const textEl = $('typingText');
  if (!el) return;
  el.classList.toggle('show', show);
  // Helper: render text with animated dots span
  const setText = (txt) => {
    if (!textEl) return;
    textEl.style.animation = 'none';
    void textEl.offsetHeight;
    textEl.style.animation = 'textSlideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
    textEl.innerHTML = txt + '<span class="dots"><span></span><span></span><span></span></span>';
  };
  if (show) {
    $('chatMessages').scrollTop = $('chatMessages').scrollHeight;
    if (steps && steps.length > 0) {
      let stepIdx = 0;
      setText(steps[0]);
      if (typingStepTimer) clearInterval(typingStepTimer);
      typingStepTimer = setInterval(() => {
        stepIdx++;
        if (stepIdx < steps.length) {
          setText(steps[stepIdx]);
        } else {
          // Loop back ถ้า steps น้อยกว่า delay จริง
          stepIdx = 0;
          setText(steps[0]);
        }
      }, 700);
    } else {
      setText('Pornchai AI กำลังประมวลผล');
    }
  } else {
    if (typingStepTimer) { clearInterval(typingStepTimer); typingStepTimer = null; }
  }
}

// Minimum display time for processing animation
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// SMART SPEC DETECTION — catch both formal specs and casual AE messages
// ============================================================
function detectSpec(text) {
  // 0. NOT a spec — conversation/question/request patterns
  if (/อยากได้|อยากให้|ช่วย.*หน่อย|ฟีเจอร์|feature|ต่อไป|ทำไม|ยังไง|คิดว่า|แนะนำ|ช่วยคิด|ช่วยออกแบบ|เพิ่ม.*ระบบ|แก้ไข.*ระบบ|หน้า.*คำนวณ|เปลี่ยน.*หน้า/i.test(text)) return false;
  if (/\?$|ไหม$|มั้ย$|ครับ$|ค่ะ$|นะ$|เหรอ$|หรือ$/i.test(text.trim())) {
    // Ends with question/polite particle — likely conversation, not spec
    // Unless it also has strong spec keywords
    if (!/TITLE|PAPER|PRINT|SIZE|gsm|แกรม|ลูกฟูก/i.test(text)) return false;
  }

  // 1. Formal spec keywords
  if (/TITLE|SIZE\s*\(|PAPER\s*-|PRINT\s*-|COMPONENT|gsm|Colors\s*$/im.test(text)) return true;

  // 2. Thai spec patterns
  if (/กระดาษ.*แกรม|พิมพ์.*สี|ประกบลูกฟูก|ขนาดขึ้นรูป|เคลือบ.*(UV|PVC|เงา|ด้าน)|ปั๊ม(ไดคัท|ฟอยล์|นูน|จม)/i.test(text)) return true;

  // 3. Paper code + gram pattern
  if (/\b(AC|MA|Dup|SBS|CRB|IVR|KA|KI|FCY|WC|MCA|GA)\s*(?:C[12]s\s*)?\d{2,3}\b/i.test(text)) return true;
  if (/\b(อาร์ต|ดูเพล็กซ์|คราฟท์|ไอวอรี่|duplex|ivory|art\s*card)\s*\d{2,3}/i.test(text)) return true;
  if (/หน้า\s*ขาว\s*หลัง\s*(เทา|ขาว|น้ำตาล)/i.test(text)) return true;

  // 4. Color notation
  if (/\b[1-8]\s*สี|\b[1-8]\/[0-8]\b|พิมพ์\s*\d\s*สี/i.test(text)) return true;

  // 5. Box/packaging keywords + size pattern
  if (/(กล่อง|ฝา|ถาด|sleeve|tray|lid|box)\s*.*\d+\s*[xX×]\s*\d+/i.test(text)) return true;

  // 6. Quantity + unit
  if (/\d{3,}[\s,]*\d*\s*(ชิ้น|กล่อง|ใบ|pcs|sets|ชุด)/i.test(text)) return true;

  // 7. Score-based: need 3+ weak signals (raised threshold to reduce false positives)
  let score = 0;
  if (/กล่อง|ฝา|ถาด|กระดาษ|box|lid|tray/i.test(text)) score++;
  if (/\d{2,3}\s*(แกรม|gsm|g)/i.test(text)) score++;
  if (/\d+\s*[xX×]\s*\d+/i.test(text)) score++;
  if (/ลูกฟูก|flute|corrugat/i.test(text)) score++;
  if (/coating|เคลือบ|ฟอยล์|foil|emboss/i.test(text)) score++;
  if (/offset|ออฟเซ็ท|flexo|เฟล็กโซ่/i.test(text)) score++;
  if (score >= 3) return true;

  return false;
}

async function sendChat() {
  const input = $('chatInput');
  let text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';

  // Smart Conversation mode — treat everything as spec input (AI-Guided only)
  if (State._rfqMode === 'smart-conv' && State._smartConvPhase === 'awaiting_spec') {
    addChatMsg(text, 'user');
    handleSmartConvInput(text);
    return;
  }

  // If unmatched-master-data flow is active, handle response first
  if (State._unmatchedFlow && State._unmatchedFlow.active) {
    addChatMsg(text, 'user');
    if (handleUnmatchedInput(text)) return;
    // ถ้าไม่ใช่คำสั่งที่รู้จัก → ปล่อยให้ระบบปกติจัดการต่อ
  }

  // If fill flow is active, handle the input as an answer
  if (State._fillFlow && State._fillFlow.active) {
    addChatMsg(text, 'user');
    handleFillFlowInput(text);
    return;
  }

  addChatMsg(text, 'user');

  $('btnSend').disabled = true;

  try {
    let parsedData = null;
    let replyText = '';
    let parseValidation = null;

    // === LLM-First Architecture ===
    // ข้อความยาว (spec) → ส่ง parse-spec API (LLM → Built-in fallback)
    // ข้อความสั้น (คำสั่ง/คำถาม) → ส่ง AI Agent Chat (LLM → Local fallback)
    const isLongSpec = text.split('\n').length >= 3 || text.length >= 150;
    const isStructuredSpec = /^TITLE\s*:/im.test(text) || (/SIZE\s*\(/i.test(text) && /PAPER/i.test(text));
    const looksLikeSpec = isLongSpec || isStructuredSpec || detectSpec(text);
    const wantsNewForm = /(?:สร้าง.*ใหม่|ฟอร์มใหม่|new.*rfq|new.*form|เริ่มใหม่|reset|clear|ล้าง)/i.test(text);

    // ถ้ามีฟอร์มอยู่แล้ว + ข้อความไม่ใช่ spec ใหม่
    if (State.form && State._formTouched && !isStructuredSpec && !wantsNewForm && !isLongSpec) {
      // ลอง local rules ก่อน (เร็วทันที)
      const localResult = handleFormModifyCommand(text);
      if (localResult.startsWith('✅') || localResult.startsWith('คุณหมายถึง') || localResult.startsWith('โอเคครับ')) {
        addChatMsg(localResult, 'agent');
        $('btnSend').disabled = false;
        input.focus();
        return;
      }
      // Local ไม่เข้าใจ → ส่ง LLM
      showTyping(true, ['Pornchai AI กำลังคิด...']);
      try {
        replyText = await aiAgentChat(text);
      } catch (e) {
        console.error('[Pornchai AI] LLM error:', e.message);
        replyText = localResult;
      }
      showTyping(false);
      addChatMsg(replyText, 'agent');
      $('btnSend').disabled = false;
      input.focus();
      return;
    }

    if (looksLikeSpec || wantsNewForm) {
      // === Client-side spec cache — skip API entirely for exact same spec ===
      // Cache is keyed by spec text + invalidated on page reload (new JS version = fresh cache)
      const specKey = text.replace(/\s+/g, ' ').trim().toLowerCase();
      if (!State._specCache) State._specCache = {};
      const clientCached = State._specCache[specKey];
      let res;

      if (!wantsNewForm && clientCached && (Date.now() - clientCached.ts < 10 * 60 * 1000)) {
        // Exact client cache hit — no network call (10min TTL)
        showTyping(true, ['พบข้อมูลที่เคย parse แล้ว...']);
        await delay(300);
        showTyping(false);
        res = clientCached.res;
        console.log('[Spec Cache] Client-side exact hit — no API call');
      } else {
        // === Production-grade loading: 5s minimum + 7 stages ===
        showTyping(true, [
          '🧠 Pornchai AI initializing neural engine',
          '📖 Reading & tokenizing spec',
          '🔍 Extracting paper · color · template',
          '🗃️ Cross-matching with master database',
          '🤖 Running 12-signal smart matcher',
          '📐 Validating dimensions & business rules',
          '✨ Finalizing structured output',
        ]);

        // Run parse + minimum 5s display for animation (7 stages × ~700ms = 4.9s)
        [res] = await Promise.all([
          apiPost('/api/parse-spec', { message: text }),
          delay(5000),
        ]);

        showTyping(false);

        // Cache the result client-side
        if (res.success && res.data) {
          State._specCache[specKey] = { res, ts: Date.now() };
          // Keep cache small (max 20 entries)
          const keys = Object.keys(State._specCache);
          if (keys.length > 20) delete State._specCache[keys[0]];
        }
      }

      if (res.success && res.data) {
        parsedData = res.data;
        parseValidation = res.validation || { missing: [], warnings: [], info: [], isComplete: true };
        // === เก็บ ambiguous warnings ไว้ตอบใน fill flow ===
        State._ambiguousProcs = (res.data._warnings || []).filter(w => w.type === 'ambiguous_process');
        // === Show learned corrections that were auto-applied ===
        if (Array.isArray(res._learned) && res._learned.length > 0) {
          const fixes = res._learned.map(l => `• ${l.field}: "${l.from}" → "${l.to}" (เคยผิด ${l.count}×)`).join('\n');
          addChatMsg(`🧠 AI Learning: แก้อัตโนมัติจากบทเรียนเก่า\n${fixes}`, 'agent');
        }
        // === Pornchai AI mapping notes — Smart matcher + ปุ่มเลือก ===
        State._pendingPaperMappings = 0;
        if (Array.isArray(res.data._aiNotes) && res.data._aiNotes.length > 0) {
          res.data._aiNotes.forEach((n, ni) => {
            if (n.type !== 'paper_mapping') return;

            const conf = n.confidence || 95;
            const isHighConf = conf >= 95;

            // High-confidence (≥95%) → แสดงเป็น info ไม่ต้องกด ไม่ block fill flow
            if (isHighConf) {
              const altsText = (n.alternatives || []).slice(0, 2).map(a => `${a.code} ${a.score}%`).join(' · ');
              let msg = `✓ Pornchai AI matched: "${n.from}" → ${n.to} (${conf}%)`;
              if (altsText) msg += `\nทางเลือก: ${altsText}`;
              if (n.signals?.length) msg += `\nsignals: ${n.signals.slice(0,2).join(', ')}`;
              addChatMsg(msg, 'agent');
              return;
            }

            // Low-confidence (<95%) → ปุ่มให้กดเลือก + block fill flow
            State._pendingPaperMappings++;
            const choices = [
              { code: n.to, score: conf },
              ...((n.alternatives || []).filter(a => a.code !== n.to)),
            ].sort((a, b) => b.score - a.score).slice(0, 3);

            State._paperMappings = State._paperMappings || {};
            State._paperMappings[ni] = { from: n.from, choices, gram: n.gram, applied: n.to };

            const headerMsg =
              `📋 Pornchai AI — ตรวจสอบ Master Data\n` +
              `ไม่แน่ใจว่า "${n.from}" คือกระดาษอะไร — กรุณายืนยัน:`;
            addChatMsg(headerMsg, 'agent');

            const btns = choices.map((c, ci) => {
              const isPrimary = ci === 0;
              const bg = isPrimary ? 'var(--accent, #9b6dcc)' : 'var(--btn-bg, #fff)';
              const fg = isPrimary ? '#fff' : 'var(--text-primary, #333)';
              const star = isPrimary ? '★ ' : '';
              return `<button onclick="App.choosePaperMapping(${ni}, '${c.code.replace(/'/g, "\\'")}')" style="background:${bg};color:${fg};border:1.5px solid var(--accent, #9b6dcc);padding:8px 14px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600;transition:all 0.2s;display:flex;align-items:center;gap:6px"><span>${star}${c.code}</span><span style="font-size:11px;opacity:0.85;background:${isPrimary?'rgba(255,255,255,0.2)':'rgba(155,109,204,0.12)'};padding:2px 6px;border-radius:6px">${c.score}%</span></button>`;
            }).join('');
            addChatMsg('', 'agent', `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">${btns}</div>`);
          });
        }
        const v = parseValidation;
        const compCount = (res.data.components || []).length;
        const compNames = (res.data.components || []).map(c => c.component_name || '-').join(', ');

        // === SHORT summary — just key info ===
        replyText = `วิเคราะห์ spec สำเร็จ`;
        if (v.missing?.length) replyText += ` แต่ข้อมูลบางส่วนไม่ครบ`;
        replyText += `\n\nชื่องาน: ${res.data.job_name || '-'}`;
        if (res.data.customer_search) replyText += `\nลูกค้า: ${res.data.customer_search}`;
        replyText += `\nComponents: ${compCount} รายการ (${compNames})`;

        // One-line per component
        (res.data.components || []).forEach((c, i) => {
          const parts = [];
          if (c.paper) parts.push(`${c.paper.paper_code||''} ${c.paper.paper_gram||''}gsm`);
          if (c.color) parts.push(`${c.color.outside||0}/${c.color.inside||0} สี`);
          if (c.addon?.length) parts.push(`${c.addon.length} addon`);
          if (c.component_type === 2) parts.push('ประกบลูกฟูก');
          replyText += `\n  ${c.component_name || 'Component '+(i+1)}: ${parts.join(', ')}`;
        });
        if (res.data.qty) replyText += `\nจำนวน: ${res.data.qty.join(', ')}`;

      } else {
        replyText = 'ไม่สามารถวิเคราะห์ spec ได้ กรุณาตรวจสอบรูปแบบข้อมูล';
      }
    } else {
      // ไม่มีฟอร์ม → ส่ง AI API
      showTyping(true, ['Pornchai AI กำลังคิด...']);
      try {
        replyText = await aiAgentChat(text);
      } catch (e) {
        console.error('[Pornchai AI] API error:', e.message);
        replyText = 'ลองส่ง spec งานมาก่อนได้เลยครับ แล้วผมจะวิเคราะห์ให้!';
      }
      showTyping(false);
    }

    // === AUTO-APPLY: กรอกฟอร์มทันที ไม่ต้องกดปุ่ม ===
    if (parsedData) {
      State._lastParsedData = parsedData;
      State._lastSpecText = text;

      // Auto-apply to form silently
      await applyAgentData(parsedData);
      if (State._lastSpecText) handleFormModifyCommand(State._lastSpecText);
      renderForm();

      // === Process ที่ parser จับได้แต่ไม่มีราคา → แจ้ง user ใส่เอง ===
      const procsNoPrice = [];
      ['other_process', 'handwork_process', 'outsource'].forEach(key => {
        (State.form[key] || []).forEach(p => {
          if (p.name?.trim() && (!p.cost || parseFloat(p.cost) <= 0)) {
            procsNoPrice.push({ name: p.name, section: key });
          }
        });
      });
      if (procsNoPrice.length > 0) {
        const list = procsNoPrice.map(p => `• ${p.name}`).join('\n');
        addChatMsg(
          `⚠️ Pornchai AI พบ process ที่ยังไม่ได้กำหนดราคา ${procsNoPrice.length} รายการ:\n${list}\n\n` +
          `📝 กรุณาใส่ราคาในฟอร์มก่อนคำนวณ Layout — ระบบจะ highlight ช่องราคาเป็นสีแดงให้เห็นชัด`,
          'agent'
        );
      }

      // === Smart Suggestion: ตรวจ master data unmatched ก่อน ===
      await checkUnmatchedMasterData();

      // ถ้ามี unmatched flow → จัดการก่อน fill flow (จะถาม fill flow ต่อใน nextUnmatchedIssue)
      if (State._unmatchedFlow?.active) {
        addChatMsg(`📋 รับข้อมูลพร้อมกรอกลงฟอร์มให้แล้วครับ`, 'agent');
        return;
      }

      // ถ้ามี paper mapping ที่รอ user กดเลือก → block fill flow ก่อน
      // (fill flow จะถูก trigger จาก choosePaperMapping เมื่อ user เลือกครบทุก mapping)
      if (State._pendingPaperMappings > 0) {
        addChatMsg(`📋 รับข้อมูลพร้อมกรอกลงฟอร์มให้แล้วครับ\n\n👉 กรุณาเลือกกระดาษด้านบนก่อนครับ`, 'agent');
        return;
      }

      // Check missing → show only what's needed
      const missing = checkMissingFields(State.form);
      const hasAmbiguous = (State._ambiguousProcs || []).length > 0;
      if (missing.length > 0 || hasAmbiguous) {
        const totalCount = missing.length + (hasAmbiguous ? 1 : 0);
        let msg = `📋 รับข้อมูลพร้อมกรอกลงฟอร์มให้แล้วครับ\n\n⚠️ ยังต้องยืนยัน ${totalCount} เรื่อง:`;
        if (hasAmbiguous) msg += `\n• Process ${State._ambiguousProcs.map(a => a.value).join(', ')} (คลุมเครือ)`;
        missing.forEach(m => msg += '\n• ' + m.label);
        addChatMsg(msg, 'agent');
        setTimeout(() => startFillFlow(true), 300);
      } else {
        addChatMsg('📋 รับข้อมูลพร้อมกรอกลงฟอร์มให้แล้วครับ ✅ ข้อมูลครบ! กดคำนวณ Layout ได้เลย\n\n💡 ข้อมูลอื่นๆ ที่ไม่ได้ระบุมา โปรดตรวจสอบในฟอร์มด้วยนะครับ', 'agent');
      }
    } else {
      addChatMsg(replyText, 'agent');
    }
  } catch (e) {
    showTyping(false);
    addChatMsg('เกิดข้อผิดพลาด: ' + e.message, 'agent');
  } finally {
    showTyping(false);
    $('btnSend').disabled = false;
    input.focus();
  }
}

function getLastParsedData() {
  return State._lastParsedData || {};
}

// === AI แก้ไขฟอร์ม ผ่าน chat (หลังกรอกข้อมูลแล้ว) ===
/**
 * Smart Spec Normalizer — cleans & normalizes input text before AI/rule parsing:
 * - Thai/English typo correction (fuzzy)
 * - Abbreviation expansion
 * - Case normalization for technical terms
 * - Unit standardization (cm→mm, inch→")
 * - Color format normalization ("4สี/0สี" → "4/0")
 */
function normalizeSpecText(raw) {
  if (!raw) return '';
  let s = raw;

  // === 1. Common typos & abbreviations (Thai + English) ===
  const TYPO_MAP = [
    // Kraftwrap
    [/kraft\s*warp|kraft\s*wrop|kraf\s*wrap|คราฟ(?:ท์)?(?:แร็ป|แรป|วาป|ว็อป|รัป)/gi, 'kraftwrap'],
    // Foil stamp
    [/foil\s*(?:stamp|stmap|stapm|stanp)|โฟล์?\s*(?:สแตม(?:ป์?)?|แสตม(?:ป์?)?|สแตป|แสตป)|ฟอยล์?\s*(?:สแตม(?:ป์?)?|ปั๊ม)/gi, 'foil stamp'],
    // Emboss
    [/(?:เอ็ม|เอม|แอม)บอส|em\s*boss|embos(?!s)|enbo[sz]/gi, 'emboss'],
    // Deboss
    [/(?:ดี|ดิ)บอส|de\s*boss|debos(?!s)|dnbo[sz]/gi, 'deboss'],
    // Die-cut
    [/die\s*[ck]ut|ได[คก]ั[ทต]|ไดค[ัา][ตท]|ปั๊ม(?:ไดค[ัา][ตท]|ดาย)/gi, 'die-cut'],
    // Coating types
    [/\bOPP\b/gi, 'OPP'], [/\bPVC\b/gi, 'PVC'], [/\bUV\b/gi, 'UV'], [/\bPE\b/gi, 'PE'],
    [/(?:เคลือบ|coat(?:ing)?)\s*(?:ด้าน|matte?|matt)/gi, 'coating Matt'],
    [/(?:เคลือบ|coat(?:ing)?)\s*(?:เงา|gloss)/gi, 'coating Gloss'],
    [/กัน(?:ซึม|ชื้น|น้ำ)|water\s*proof/gi, 'กันซึม (Water Proof)'],
    // Paper types
    [/\b(?:A\/?C)\s*C1[Ss]\b/gi, 'A/C C1s'], [/\b(?:A\/?C)\s*C2[Ss]\b/gi, 'A/C C2s'],
    [/\bDup(?:lex)?\s*GBB\b/gi, 'Dup GBB'], [/\bDup(?:lex)?\s*WBB\b/gi, 'Dup WBB'],
    [/\bDup(?:lex)?\s*BBB\b/gi, 'Dup BBB'],
    [/(?:อาร์ท|art)\s*(?:การ์ด|card)/gi, 'Art Card'],
    [/(?:ดูเพล็กซ์|duplex)/gi, 'Duplex'],
    // คำที่ AE ใช้เรียก Duplex (สำคัญมาก!)
    [/หน้า\s*ขาว\s*หลัง\s*เทา/gi, 'หน้าขาวหลังเทา (Dup GBB)'],
    [/หน้า\s*ขาว\s*หลัง\s*ขาว/gi, 'หน้าขาวหลังขาว (Dup WBB)'],
    [/หน้า\s*ขาว\s*หลัง\s*น้ำตาล/gi, 'หน้าขาวหลังน้ำตาล (Dup BBB)'],
    // Packing
    [/paper\s*band|เปเปอร์\s*แบนด์|กระดาษรัด/gi, 'paperband'],
    [/\bpallet\b|พาเลท|พาเล็ท|พาเลต/gi, 'pallet'],
    [/\bcarton\b|กล่อง(?:ลูกฟูก)?(?:ใส่|บรรจุ)|คาร์ตัน|กล่องนอก/gi, 'carton'],
    // Print type
    [/(?:ออฟ|อ้อฟ)(?:เซ็ท|เซท|เซต)|off\s*set/gi, 'Offset'],
    [/(?:เฟล็ก|เฟล็ค)โซ|flexo/gi, 'Flexo'],
    [/(?:เจ็ท|เจ็ต)\s*เพรส|jet\s*press/gi, 'JetPress'],
    // Corrugated
    [/ลูก(?:ฟู|ฝู)ก|ลอนลูกฟูก|corrugat(?:ed|e)/gi, 'ลูกฟูก'],
    [/ประกบ(?:ลูก)?(?:ฟู|ฝู)ก/gi, 'ประกบลูกฟูก'],
    // Units
    [/(\d)\s*(?:ซม\.?|cm)\b/gi, '$1cm'], [/(\d)\s*(?:มม\.?|mm)\b/gi, '$1mm'],
    [/(\d)\s*(?:นิ้ว|inch(?:es)?)\b/gi, '$1"'],
    [/(\d)\s*(?:แกรม|gsm|กรัม)\b/gi, '$1 gsm'],
  ];

  TYPO_MAP.forEach(([pat, rep]) => { s = s.replace(pat, rep); });

  // === 2. Color format normalization ===
  // "4สี/0สี" → "4/0", "5 สี ด้านนอก / 1 สี ด้านใน" → "5/1"
  s = s.replace(/(\d+)\s*สี?\s*(?:ด้านนอก|outside|หน้า)?\s*[\/\\]\s*(\d+)\s*สี?\s*(?:ด้านใน|inside|หลัง)?/gi, '$1/$2');
  s = s.replace(/(\d+)\s*(?:color|สี|col)s?\s*[\/\\]\s*(\d+)\s*(?:color|สี|col)s?/gi, '$1/$2');

  // === 3. Size format: ensure "x" separator ===
  // "145 x 85 x 115" OK, "145*85*115" → "145x85x115"
  s = s.replace(/(\d+(?:\.\d+)?)\s*[*×]\s*(\d+(?:\.\d+)?)/g, '$1x$2');

  // === 4. Quantity normalization ===
  // "10,000" → "10000", "1หมื่น" → "10000", "5พัน" → "5000"
  s = s.replace(/(\d+),(\d{3})/g, '$1$2');
  s = s.replace(/(\d+)\s*หมื่น/g, (_, n) => String(parseInt(n) * 10000));
  s = s.replace(/(\d+)\s*พัน/g, (_, n) => String(parseInt(n) * 1000));
  s = s.replace(/(\d+)\s*แสน/g, (_, n) => String(parseInt(n) * 100000));
  s = s.replace(/(\d+)\s*ล้าน/g, (_, n) => String(parseInt(n) * 1000000));

  // === 5. Trim extra whitespace ===
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

function handleFormModifyCommand(text) {
  const f = State.form;
  if (!f) return 'ยังไม่มีข้อมูลในฟอร์มครับ กรุณาส่ง spec มาก่อน';
  // Skip structured spec entirely — already parsed by server, don't re-process
  if (/^TITLE\s*:/im.test(text)) return '✅ Structured spec — ข้อมูลถูก parse โดย server แล้ว';
  const isStructuredSpec = false;
  // Apply smart normalizer
  text = normalizeSpecText(text);
  // Normalize: เว้นวรรคระหว่างตัวเลขกับตัวอักษร, ลบช่องว่างซ้ำ
  const t = text.replace(/(\d)([ก-๙a-z])/gi, '$1 $2').replace(/([ก-๙a-z])(\d)/gi, '$1 $2').toLowerCase().trim();
  let changed = [];
  const c0 = f.components?.[0];

  // === SANITIZE: ดึงข้อมูลที่มีรูปแบบชัดเจนออกก่อน เพื่อไม่ให้ parser อื่นจับผิด ===
  // สร้าง "clean text" ที่ลบ date, f-code, ขนาด WxLxD ออกแล้ว — ใช้สำหรับ parse สี/จำนวน
  let cleanText = text;

  // 1) Strip dates (dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, วันที่ dd/mm/yyyy)
  cleanText = cleanText.replace(/(?:วันที่\s*)?\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, ' ');
  cleanText = cleanText.replace(/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g, ' ');

  // 2) Strip size patterns like 384x252, 100×60×180, 10x15x5cm
  cleanText = cleanText.replace(/\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?(?:\s*[x×]\s*\d+(?:\.\d+)?)?\s*(?:mm|cm|นิ้ว|inch|")?/gi, ' ');

  // 3) Strip F-codes like F005613
  cleanText = cleanText.replace(/\bF\d{4,}/gi, ' ');

  // 4) Strip grade patterns like CA125/CA125
  cleanText = cleanText.replace(/\b[A-Z]{1,3}\d{2,3}\s*\/\s*[A-Z]{1,3}\d{2,3}/gi, ' ');

  // 5) Strip phone numbers
  cleanText = cleanText.replace(/\b0\d{1,2}[- ]?\d{3,4}[- ]?\d{4}\b/g, ' ');

  // 6) Clean up multiple spaces
  cleanText = cleanText.replace(/\s+/g, ' ').trim();

  // === ประเภทงาน (ไม่ต้องมี "เปลี่ยน" นำหน้า) ===
  if (/\b(?:re-?print(?:ed)?|re-?run|repeat\s*(?:job|order|งาน)?)\b/i.test(text) ||
      /รีพริ้น|รี[ปพ]ริ้?น?ท?|งานซ้ำ|พิมพ์ซ้ำ|พิมพ์ใหม่|สั่งซ้ำ|ปริ้นซ้ำ|ซ้ำเดิม|งานเก่า/.test(text)) {
    f.job_type = 'repeat'; f.is_reprinted = true;
    changed.push('ประเภทงาน → งาน Reprint');
  } else if (/(?:งานใหม่|new\s*job|job\s*type.*new)/i.test(text)) {
    f.job_type = 'new'; f.is_reprinted = false;
    changed.push('ประเภทงาน → งานใหม่');
  }

  // === ชื่องาน (Job Name) — only match explicit command "ชื่องาน: xxx" or "job name = xxx"
  // NOT from structured spec (which has TITLE: already parsed by server) ===
  if (!isStructuredSpec) {
    const jobNameMatch = text.match(/^(?:ชื่องาน|job\s*name)\s*(?:เป็น|=|:|คือ)\s*(.+)/im);
    if (jobNameMatch) {
      f.job_name = jobNameMatch[1].trim().substring(0, 120);
      changed.push(`ชื่องาน → ${f.job_name}`);
    }
  }

  // === ลูกค้า (Customer) ===
  const custMatch = text.match(/(?:ลูกค้า|customer)\s*(?:เป็น|=|:|คือ)?\s*(.+)/i);
  if (custMatch && !/(?:ส่วนต่าง|margin|gift)/i.test(custMatch[1])) {
    f.customer = { customer_id: '', customer_name: custMatch[1].trim() };
    changed.push(`ลูกค้า → ${custMatch[1].trim()}`);
  }

  // === AE Name ===
  const aeMatch = text.match(/(?:ae|เอ.?อี|ชื่อ.?ae)\s*(?:เป็น|=|:|คือ)?\s*(.+)/i);
  if (aeMatch) {
    f.ae = { emp_id: '', emp_name: aeMatch[1].trim() };
    changed.push(`AE → ${aeMatch[1].trim()}`);
  }

  // === จำนวน (Qty) — ใช้ cleanText (ลบ date/size/grade ออกแล้ว) ===
  const isCorrugatedCmd = /(?:ลูกฟูก|corrugat|flute|ลอน|เกรด|grade|ชั้น|layer)/i.test(text);
  const qtyPattern = /(?:จำนวน|qty|quantity|ยอด|order|สั่ง)\s*(?:=|:|เป็น)?\s*/i;
  if (!isCorrugatedCmd && (qtyPattern.test(cleanText) || /\d[\d,]*\s*(?:ชิ้น|pcs|ใบ|ตัว|กล่อง|box|ea)/i.test(cleanText))) {
    const qtyAll = [...cleanText.matchAll(/(\d[\d,]*)\s*(?:ชิ้น|pcs|ใบ|ตัว|กล่อง|box|ea)?/gi)]
      .map(m => m[1].replace(/,/g, ''))
      .filter(q => parseInt(q) >= 100); // ตัดตัวเลข < 100 ที่ไม่ใช่ qty (gsm, ชั้น, สี)
    if (qtyAll.length > 0) {
      qtyAll.forEach((q, i) => { f.qty[i] = q; });
      changed.push(`จำนวน → ${qtyAll.map(q => parseInt(q).toLocaleString()).join(', ')} ชิ้น`);
    }
  }

  // === Run-On — "Run-On 5, 250" or "run on 5%" or "runon 5 250" ===
  const runOnMatch = text.match(/(?:run.?on|รันออน)\s*(?:เป็น|=|:)?\s*(\d+)\s*[%,]?\s*(\d+)?/i);
  if (runOnMatch) {
    f.run_on_percent = runOnMatch[1];
    autoCalcRunOn();
    if (runOnMatch[2]) {
      f.run_on_values[0] = runOnMatch[2];
    }
    changed.push(`Run-On → ${runOnMatch[1]}%${runOnMatch[2] ? ', ' + parseInt(runOnMatch[2]).toLocaleString() : ''}`);
  }

  // === AE Qty ===
  const aeQtyMatch = text.match(/(?:ae\s*qty|AE\s*Qty|ae\s*จำนวน)\s*(?:เป็น|=|:)?\s*(\d[\d,]*)/i);
  if (aeQtyMatch) {
    f.ae_qty = aeQtyMatch[1].replace(/,/g, '');
    changed.push(`AE Qty → ${parseInt(f.ae_qty).toLocaleString()}`);
  }

  // === Customer Qty ===
  const custQtyMatch = text.match(/(?:customer\s*qty|Customer\s*Qty|ลูกค้า\s*qty|cust\.?\s*qty)\s*(?:เป็น|=|:)?\s*(\d[\d,]*)/i);
  if (custQtyMatch) {
    f.customer_qty = custQtyMatch[1].replace(/,/g, '');
    changed.push(`Customer Qty → ${parseInt(f.customer_qty).toLocaleString()}`);
  }

  // === ลิมิตสี ===
  if (/(?:ลิมิตสี|limit.?color|color.?limit)/i.test(text)) {
    const clqMatch = text.match(/(?:ลิมิตสี|limit.?color|color.?limit)\s*(?:เป็น|=|:)?\s*(\d+)/i);
    if (/(?:ลบ|ยกเลิก|ปิด|ไม่|remove|off)/i.test(text)) {
      f.limit_color = false; f.limit_color_qty = '';
      changed.push('ปิดลิมิตสี');
    } else {
      f.limit_color = true;
      if (clqMatch) f.limit_color_qty = clqMatch[1];
      changed.push(`ลิมิตสี → ${clqMatch ? clqMatch[1] + ' เล่ม' : 'เปิด'}`);
    }
  }

  // === ประเภทพิมพ์ (ไม่ต้องมีคำนำหน้า) ===
  if (/\boffset\b/i.test(text) && !/uv.*offset/i.test(text)) { f.print_type = 'offset'; f.machine_id = ''; changed.push('ประเภทพิมพ์ → Offset'); }
  else if (/\bflexo\b/i.test(text)) { f.print_type = 'flexo'; f.machine_id = ''; changed.push('ประเภทพิมพ์ → Flexo'); }
  else if (/jet.?press|digital\s*(?:print|พิมพ์)?/i.test(text)) { f.print_type = 'jetpress'; f.machine_id = ''; changed.push('ประเภทพิมพ์ → JetPress'); }
  else if (/\bkonica\b/i.test(text)) { f.print_type = 'konica'; f.machine_id = ''; changed.push('ประเภทพิมพ์ → Konica'); }

  // === หมึก (ไม่ต้องมีคำนำหน้า) ===
  if (/(?:หมึก|ink)\s*uv|uv\s*(?:ink|หมึก)/i.test(text)) { f.ink_type = 'uv'; changed.push('หมึก → UV'); }
  else if (/(?:หมึก|ink)\s*(?:ธรรมดา|conventional|normal)|(?:conventional|ธรรมดา|normal)\s*(?:ink|หมึก)/i.test(text)) { f.ink_type = 'conventional'; changed.push('หมึก → ธรรมดา'); }

  // === สี (Color) — ใช้ cleanText (ลบ date/size/grade/f-code ออกแล้ว) ===
  // Strip "ลิมิตสี N" from color parsing to avoid false match
  const colorText = cleanText.replace(/ลิมิตสี\s*\d*/gi, ' ').replace(/limit.?color\s*\d*/gi, ' ').replace(/สีพิเศษ/gi, ' ').replace(/\s+/g, ' ').trim();
  // "4/0", "สี4/0", "4สี", "สี 6/2", "7 สี", "CMYK", "CMYK+2spot"
  const cmykMatch = colorText.match(/cmyk\s*(?:\+\s*(\d+)\s*(?:spot|สี|c)?)?/i);
  if (cmykMatch && c0) {
    const extra = cmykMatch[1] ? parseInt(cmykMatch[1]) : 0;
    c0.color.outside = String(4 + extra);
    c0.color.inside = '0';
    changed.push(`สี → ${c0.color.outside}/0`);
  }
  // Color N/N pattern — only from colorText (dates/sizes/limitcolor already stripped)
  const colorMatch = !cmykMatch && (colorText.match(/(\d+)\s*[\/\\]\s*(\d+)\s*(?:สี|color)?/i) || colorText.match(/(?:สี|color)\s*(\d+)\s*[\/\\]\s*(\d+)/i));
  if (colorMatch && c0 && parseInt(colorMatch[1]) <= 12 && parseInt(colorMatch[2]) <= 12) {
    c0.color.outside = colorMatch[1];
    c0.color.inside = colorMatch[2];
    changed.push(`สี → ${colorMatch[1]}/${colorMatch[2]}`);
  } else if (!cmykMatch) {
    // "หน้า 4 สี หลัง 2 สี", "front 4 back 2"
    const frontBack = colorText.match(/(?:หน้า|front|outside)\s*(\d+)\s*(?:สี|color)?.*?(?:หลัง|back|inside)\s*(\d+)/i);
    if (frontBack && c0) {
      c0.color.outside = frontBack[1];
      c0.color.inside = frontBack[2];
      changed.push(`สี → ${frontBack[1]}/${frontBack[2]}`);
    } else {
      const colorSingle = colorText.match(/(\d+)\s*สี/i) || colorText.match(/(?:สี|color)\s*(\d+)/i);
      if (colorSingle && c0 && parseInt(colorSingle[1]) <= 12) {
        c0.color.outside = colorSingle[1];
        c0.color.inside = '0';
        changed.push(`สี → ${colorSingle[1]}/0`);
      }
    }
  }

  // === กระดาษ (Paper) — "AC 300gsm", "กระดาษAC300", "Dup GBB 400 gsm", "duplex gbb 350", "ivory 300" ===
  if (!isCorrugatedCmd && (/(?:กระดาษ|paper|gsm|แกรม|board)/i.test(text) || /\b(?:AC|GA|MA|SBS|CRB|IVR?|KA|KI|Dup|FBB|CCB|ivory|art\s*card|art\s*board|duplex|kraft)/i.test(text))) {
    if (c0) {
      const paperCodes = [
        { pattern: /dup(?:lex)?\s*gbb/i, code: 'Dup GBB' },
        { pattern: /dup(?:lex)?\s*wbb/i, code: 'Dup WBB' },
        { pattern: /dup(?:lex)?\s*bbb/i, code: 'Dup BBB' },
        { pattern: /\bduplex\b/i, code: 'Dup GBB' },  // default duplex = GBB
        { pattern: /\b(?:AC|art\s*card)\b/i, code: 'AC' },
        { pattern: /\b(?:GA|art\s*board)\b/i, code: 'GA' },
        { pattern: /\bMA\b/i, code: 'MA' },
        { pattern: /\b(?:SBS|FBB)\b/i, code: 'SBS' },
        { pattern: /\b(?:CRB|CCB)\b/i, code: 'CRB' },
        { pattern: /\b(?:IVR?|ivory)\b/i, code: 'IVR' },
        { pattern: /\bKA\b/i, code: 'KA' },
        { pattern: /\bKI\b/i, code: 'KI' },
        { pattern: /\bkraft\b/i, code: 'KA' },
      ];
      for (const pc of paperCodes) {
        if (pc.pattern.test(text)) { c0.paper.paper_code = pc.code; changed.push(`กระดาษ → ${pc.code}`); break; }
      }
      // GSM: "300gsm", "300g", "300 แกรม", "แกรม 300", "gsm300", standalone 3-digit after paper code
      const gsmMatch = text.match(/(\d{2,3})\s*(?:gsm|แกรม|g\b)/i)
        || text.match(/(?:gsm|แกรม)\s*(\d{2,3})/i)
        || (changed.some(c => c.startsWith('กระดาษ')) && text.match(/\b(\d{3})\b/));  // standalone 3 digits when paper detected
      if (gsmMatch) { c0.paper.paper_gram = gsmMatch[1]; changed.push(`แกรม → ${gsmMatch[1]} gsm`); }
      const costMatch = text.match(/(?:cost|ราคา|ต้นทุน)\s*(?:=|:)?\s*(\d+(?:\.\d+)?)/i);
      if (costMatch) {
        c0.paper.paper_cost = costMatch[1];
        const markup = parseFloat(c0.paper.paper_markup) || 10;
        const rollCut = parseFloat(c0.paper.paper_roll_cut) || 0;
        c0.paper.paper_sale = (parseFloat(costMatch[1]) * (1 + markup / 100) + rollCut).toFixed(2);
        changed.push(`Paper Cost → ${costMatch[1]} B/Kg`);
      }
    }
  }

  // === ขนาด (Size) — "200x150x50", "ขนาด200x150", "384 x 252 x 0" ===
  const sizeMatch = text.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)(?:\s*[x×]\s*(\d+(?:\.\d+)?))?/i);
  if (sizeMatch && c0 && (changed.length === 0 || /(?:ขนาด|size|กว้าง|ยาว)/i.test(text))) {
    c0.packaging_size.width = sizeMatch[1];
    c0.packaging_size.length = sizeMatch[2];
    if (sizeMatch[3]) c0.packaging_size.depth = sizeMatch[3];
    changed.push(`ขนาด → ${sizeMatch[1]} x ${sizeMatch[2]}${sizeMatch[3] ? ' x ' + sizeMatch[3] : ''} mm`);
  }
  // แยกตัว: "กว้าง384", "ยาว252", "สูง30", "w200", "l150", "h50", "w=200"
  const wMatch = text.match(/(?:กว้าง|width|^w(?:idth)?)\s*(?:=|:)?\s*(\d+(?:\.\d+)?)/im);
  if (wMatch && c0) { c0.packaging_size.width = wMatch[1]; changed.push(`กว้าง → ${wMatch[1]} mm`); }
  const lMatch = text.match(/(?:ยาว|length|^l(?:ength)?)\s*(?:=|:)?\s*(\d+(?:\.\d+)?)/im);
  if (lMatch && c0) { c0.packaging_size.length = lMatch[1]; changed.push(`ยาว → ${lMatch[1]} mm`); }
  const dMatch = text.match(/(?:สูง|ลึก|depth|height|^h(?:eight)?|^d(?:epth)?)\s*(?:=|:)?\s*(\d+(?:\.\d+)?)/im);
  if (dMatch && c0) { c0.packaging_size.depth = dMatch[1]; changed.push(`ความสูง → ${dMatch[1]} mm`); }

  // === Confirmation flow (ตอบ ใช่/yes) ===
  if (State._pendingConfirm && /^(?:ใช่|ใช่ครับ|ใช่คับ|ใช่คะ|ใช่ค่ะ|ใช่ค้า|ใช่คร้า|ใช่คร้าบ|ใช่จ้า|ใช่จ้|ครับ|ค่ะ|คับ|คะ|ถูกต้อง|ตกลง|โอเค|ok|yes|yep|yeah|y|confirm|เอา|ได้เลย|เลย|ตามนั้น|ใช่เลย|ชัวร์)$/i.test(t.replace(/\s+/g, ''))) {
    const action = State._pendingConfirm;
    State._pendingConfirm = null;
    if (action.type === 'template' && action.value && c0) {
      setCompBoxType(0, action.value);
      renderForm();
      return `✅ เลือก Template ${action.label} ให้แล้วครับ!`;
    }
    if (action.type === 'apply' && action.fn) {
      action.fn();
      renderForm();
      return action.msg || '✅ ทำให้แล้วครับ!';
    }
  }
  // ตอบ ไม่/no → ยกเลิก confirm
  if (State._pendingConfirm && /^(?:ไม่|ไม่ใช่|ไม่เอา|ไม่ครับ|ไม่ค่ะ|ยกเลิก|cancel|no|nope|n)$/i.test(t.replace(/\s+/g, ''))) {
    State._pendingConfirm = null;
    return 'โอเคครับ ยกเลิกแล้ว มีอะไรให้ช่วยอีกบอกได้เลยนะครับ 😊';
  }

  // === Box Template (ยืดหยุ่นมาก) ===
  if (/(?:template|เทมเพลต|แบบกล่อง|รูปแบบ|กล่อง.*type|เลือก.*กล่อง|ขอ.*กล่อง|box\s*type|กล่อง.*แบบ)/i.test(text) && c0) {
    const tmMatch = text.match(/(?:type|template|แบบ)\s*(\d{1,2})/i);
    if (tmMatch) {
      const tid = tmMatch[1];
      const bt = (State.masters.boxtemplate_info || []).find(b => String(b.type_id) === tid);
      if (bt) {
        setCompBoxType(0, tid);
        changed.push(`Box Template → ${tid}. ${bt.type_name}`);
      }
    } else {
      // จับ keyword ชื่อ template → ถามยืนยัน
      const TEMPLATE_KEYWORDS = [
        { patterns: /custom|กำหนดเอง|คัสตอม|ไม่มีแบบ/, typeId: '12', label: '12. Custom : กำหนดเอง' },
        { patterns: /reverse.*tuck|ฝาสลับ|ฝาเสียบ|rte\b/, typeId: '1', label: '1. Reverse Tuck End : ฝาคู่แบบฝาสลับ' },
        { patterns: /straight.*tuck|ฝาตรง|ste\b/, typeId: '2', label: '2. Straight Tuck End : ฝาคู่แบบฝาตรง' },
        { patterns: /ttslb|snap.*lock|ก้นขัด|หูขัด|ออโต้.*หูขัด|auto.*lock.*snap|ล็อค.*หูขัด/, typeId: '3', label: '3. TTSLB : ออโต้ล็อคหูขัด' },
        { patterns: /ttab|auto.*(?:bottom|lock.*glue)|ออโต้.*ทากาว|ก้นล็อค|auto.*glue/, typeId: '4', label: '4. TTAB : ออโต้ล็อคทากาว' },
        { patterns: /double.*glue|ฝาครอบ|lid.*(?:and|&).*base|ฝา.*ก้น/i, typeId: '5', label: '5. Double Glue Side Wall : กล่องฝาครอบ' },
        { patterns: /frame.*vue|เฟรม.*วิว/, typeId: '6', label: '6. Frame-Vue Tray' },
        { patterns: /four.*corner|beer.*tray|เบียร์|4.*corner/, typeId: '7', label: '7. Four Corner Beers Tray' },
        { patterns: /gable|จั่ว|หูหิ้ว|หลังคา.*จั่ว/, typeId: '8', label: '8. Gable Top : กล่องจั่ว' },
        { patterns: /sleeve|ปลอก|สลีฟ|แขนหุ้ม/, typeId: '9', label: '9. Sleeve : ปลอก' },
        { patterns: /pillow|หมอน|ทรงหมอน/, typeId: '10', label: '10. Pillow Box : ทรงหมอน' },
        { patterns: /seal.*end|ซีล.*เอ็น|ฝาปิด.*ทากาว|ซีลเอนด์/, typeId: '11', label: '11. Seal End : ฝาปิดทากาว' },
        { patterns: /tray|ถาด/, typeId: '5', label: '5. Double Glue Side Wall : กล่องฝาครอบ' },
      ];
      for (const tk of TEMPLATE_KEYWORDS) {
        if (tk.patterns.test(t)) {
          // ถามยืนยันก่อนเลือก
          State._pendingConfirm = { type: 'template', value: tk.typeId, label: tk.label };
          return `คุณหมายถึงให้ผมเลือก Component Template เป็น **${tk.label}** ถูกต้องไหมครับ? 🤔\n\nตอบ "ใช่" หรือ "ไม่" ได้เลยครับ`;
        }
      }
    }
  }

  // === ลูกฟูก (Corrugated) — รวม Component Type + Layer + Flute + Grade ===
  // Normalize text สำหรับลูกฟูก: เว้นวรรคระหว่างตัวอักษรกับตัวเลข
  const corrText = text.replace(/([A-Za-zก-๙])(\d)/g, '$1 $2').replace(/(\d)([A-Za-zก-๙])/g, '$1 $2');
  if (/(?:ประกบลูกฟูก|corrugat|ลูกฟูก|ชั้น.*ลอน|ลอน.*ชั้น)/i.test(text) && c0) {
    if (/(?:ไม่ประกบ|ไม่มี|ยกเลิก|remove)/i.test(text)) {
      c0.component_type = 1;
      changed.push('Component Type → ไม่ประกบลูกฟูก');
    } else {
      c0.component_type = 2;
      changed.push('Component Type → ประกบลูกฟูก');
    }
  }

  // --- Flute (ลอน): "ลอน E", "E flute", "flute B", "ลอนE", "ลูกฟูก 2 ชั้น E CA125" ---
  const fluteMatch = corrText.match(/(?:flute|ลอน)\s*(?:=|:)?\s*([A-Ga-g])\b/i)
    || corrText.match(/\b([A-Ga-g])\s*(?:flute|ลอน)/i)
    || (isCorrugatedCmd && corrText.match(/(?:ชั้น|ลูกฟูก|layer)\s+([A-Ga-g])\b/i)); // "2 ชั้น E", "ลูกฟูก...E"
  if (fluteMatch && c0 && /(?:ลูกฟูก|corrugat|flute|ลอน|ชั้น)/i.test(text)) {
    if (!c0.corrugated) c0.corrugated = { layer: 0, flute_type: '', grade: ['','','','',''], gram: [0,0,0,0,0] };
    c0.corrugated.flute_type = fluteMatch[1].toUpperCase().trim();
    changed.push(`ลอนลูกฟูก → ${c0.corrugated.flute_type} Flute`);
  }

  // --- จำนวนชั้น: "2 ชั้น", "ชั้นลูกฟูก 2", "จำนวนชั้น 2", "ลูกฟูก 3 ชั้น", "layer 2" ---
  const layerMatch = corrText.match(/(?:จำนวน\s*ชั้น)[ก-๙a-z\s]*(\d)/i)         // "จำนวนชั้นลูกฟูก 2"
    || corrText.match(/(\d)\s*(?:ชั้น|layers?\b)/i)                               // "2 ชั้น", "2 layer"
    || corrText.match(/(?:ชั้น\s*(?:ลูกฟูก)?)\s*(\d)/i)                           // "ชั้นลูกฟูก 2", "ชั้น 2"
    || corrText.match(/(?:layers?)\s*(\d)/i)                                       // "layer 2"
    || (isCorrugatedCmd && corrText.match(/(?:ลูกฟูก|corrugat\w*)\s*(\d)\b/i));    // "ลูกฟูก 2"
  if (layerMatch && c0 && [2,3,5].includes(parseInt(layerMatch[1]))) {
    if (!c0.corrugated) c0.corrugated = { layer: 0, flute_type: '', grade: ['','','','',''], gram: [0,0,0,0,0] };
    c0.corrugated.layer = parseInt(layerMatch[1]);
    c0.component_type = 2; // auto set ประกบลูกฟูก
    if (!changed.includes('Component Type → ประกบลูกฟูก')) changed.push('Component Type → ประกบลูกฟูก');
    changed.push(`จำนวนชั้น → ${layerMatch[1]} ชั้น`);
  }

  // --- Grade ลูกฟูก: "เกรด CA 125", "CA125", "KA/CA 125/150", "grade CA 125" ---
  if (/(?:ลูกฟูก|corrugat|เกรด|grade|ลอน|flute|ชั้น|layer)/i.test(text) && c0) {
    // ตัด flute letter ออกก่อน (E, B, C, F ที่อยู่หลัง ลอน/flute)
    let corrTextNoFlute = corrText.replace(/(?:flute|ลอน)\s*[A-Ga-g]\b/gi, '').replace(/\b[A-Ga-g]\s*(?:flute|ลอน)/gi, '');
    // ตัด standalone single letter ที่อยู่หลัง ชั้น (เป็น flute ไม่ใช่ grade)
    corrTextNoFlute = corrTextNoFlute.replace(/(?:ชั้น|layer)\s+[A-Ga-g]\b/gi, '');

    const GRADE_CODES = ['CA','KA','MA','CB','KB','KI','SC','WT','KS','SK','BF','KN','NS','CM','KT'];
    const gradeInText = [];

    // วิธี 1: จับ format "/" เช่น "KA/CA 125/150" หรือ "KA/CA/KA 125/150/125"
    const slashFormat = corrTextNoFlute.match(/([A-Z]{2}(?:\s*\/\s*[A-Z]{2})+)\s+([\d]+(?:\s*\/\s*[\d]+)*)/i);
    if (slashFormat) {
      const codes = slashFormat[1].split(/\s*\/\s*/);
      const grams = slashFormat[2].split(/\s*\/\s*/);
      codes.forEach((code, i) => {
        gradeInText.push({ code: code.toUpperCase(), gram: grams[i] ? parseInt(grams[i]) : 0 });
      });
    }

    // วิธี 2: จับ grade code + gram ทีละตัว (เรียงตาม position ใน text)
    if (gradeInText.length === 0) {
      const allMatches = [];
      for (const gc of GRADE_CODES) {
        const gcRegex = new RegExp('\\b' + gc + '\\s*(\\d{2,3})?', 'gi');
        let m;
        while ((m = gcRegex.exec(corrTextNoFlute)) !== null) {
          allMatches.push({ code: gc, gram: m[1] ? parseInt(m[1]) : 0, pos: m.index });
        }
      }
      // เรียงตาม position ใน text
      allMatches.sort((a, b) => a.pos - b.pos);
      gradeInText.push(...allMatches);
    }

    // วิธี 3 (Fallback): "เกรด XX 123"
    if (gradeInText.length === 0) {
      const gm = corrTextNoFlute.match(/(?:เกรด|grade)\s*(?:=|:)?\s*([A-Z]{2})\s*(\d{2,3})?/i);
      if (gm) gradeInText.push({ code: gm[1].toUpperCase(), gram: gm[2] ? parseInt(gm[2]) : 0 });
    }

    if (gradeInText.length > 0) {
      if (!c0.corrugated) c0.corrugated = { layer: 0, flute_type: '', grade: ['','','','',''], gram: [0,0,0,0,0] };
      if (!c0.corrugated.gram) c0.corrugated.gram = [0,0,0,0,0];
      const layer = c0.corrugated.layer || 0;

      if (gradeInText.length === 1 && layer >= 2) {
        // เกรดเดียว เช่น "CA 125" + 2 ชั้น → เติม CA 125 ทุกช่อง
        for (let gi = 0; gi < layer; gi++) {
          c0.corrugated.grade[gi] = gradeInText[0].code;
          if (gradeInText[0].gram) c0.corrugated.gram[gi] = gradeInText[0].gram;
        }
      } else {
        // หลายเกรด เช่น "KA/CA 125/150" → ใส่ตามลำดับ
        gradeInText.forEach((p, gi) => {
          if (gi < 5) {
            c0.corrugated.grade[gi] = p.code;
            if (p.gram) c0.corrugated.gram[gi] = p.gram;
          }
        });
      }
      const desc = Array.from({length: Math.max(layer, gradeInText.length)}, (_, gi) => {
        const code = c0.corrugated.grade[gi] || '';
        const gram = c0.corrugated.gram[gi] || '';
        return code + (gram ? ' ' + gram : '');
      }).filter(Boolean).join(' / ');
      changed.push(`เกรดลูกฟูก → ${desc}`);
    }
  }

  // === Coating ===
  if (/(?:coating|เคลือบ)/i.test(text) && c0) {
    if (/(?:ลบ|ยกเลิก|remove|delete).*(?:coating|เคลือบ)/i.test(text)) {
      c0.addon = c0.addon.filter(a => a.type !== 'coating');
      changed.push('ลบ Coating ทั้งหมด');
    } else if (/(?:เพิ่ม|add).*(?:coating|เคลือบ)/i.test(text)) {
      const ad = freshAddon('coating');
      ad.name = 'Coating';
      c0.addon.push(ad);
      changed.push('เพิ่ม Coating ใหม่');
    } else {
      // match coating type
      let coatAddon = c0.addon.find(a => a.type === 'coating');
      if (!coatAddon) { coatAddon = freshAddon('coating'); coatAddon.name = 'Coating'; c0.addon.push(coatAddon); }
      matchCoatingType(coatAddon, text);
      if (coatAddon.info?.type) changed.push(`Coating → ${coatAddon.info.type}`);
    }
  }

  // === Foil Stamp ===
  if (/(?:foil|ฟอยล์|ปั๊มฟอยล์|hot\s*stamp|ฟอย)/i.test(text) && c0) {
    if (/(?:ลบ|ยกเลิก|remove|delete|ไม่มี)/i.test(text)) {
      c0.addon = c0.addon.filter(a => a.type !== 'foilstamp');
      c0.foil_stamp = false;
      changed.push('ลบ Foil Stamp');
    } else {
      c0.foil_stamp = true;
      let foilAddon = c0.addon.find(a => a.type === 'foilstamp');
      if (!foilAddon) { foilAddon = freshAddon('foilstamp'); foilAddon.name = 'Foil stamp'; c0.addon.push(foilAddon); }
      matchFoilColor(foilAddon, text);
      if (foilAddon.info?.foil_color) changed.push(`Foil Stamp → ${foilAddon.info.foil_color}`);
      else changed.push('เปิด Foil Stamp');
    }
  }

  // === Emboss / Deboss ===
  if (/(?:emboss|ปั๊มนูน)/i.test(text) && c0) {
    c0.emboss = !/(?:ลบ|ยกเลิก|ไม่|remove)/i.test(text);
    changed.push(c0.emboss ? 'เปิด Emboss' : 'ปิด Emboss');
  }
  if (/(?:deboss|ปั๊มจม)/i.test(text) && c0) {
    c0.deboss = !/(?:ลบ|ยกเลิก|ไม่|remove)/i.test(text);
    changed.push(c0.deboss ? 'เปิด Deboss' : 'ปิด Deboss');
  }

  // === Special Ink (สีพิเศษ) ===
  if (/(?:สีพิเศษ|special\s*(?:ink|color)|PMS\s*\d|pantone|เมทัลลิ[คก]|สะท้อนแสง|fluorescent)/i.test(text) && c0) {
    if (/(?:ลบ|ยกเลิก|ไม่มี|remove|ปิด)/i.test(text)) {
      c0.color.is_special_ink = false;
      c0.color.special_ink = [];
      changed.push('ปิดสีพิเศษ');
    } else {
      c0.color.is_special_ink = true;
      if (!c0.color.special_ink) c0.color.special_ink = [];
      // Parse ink details: "PMS001 หมึก UV" / "สีพิเศษ PMS485 เมทัลลิค ตีพื้น"
      const inkColor = text.match(/\b(PMS\s*\d+|Pantone\s*\d+[A-Z]*)\b/i);
      const inkType = /เมทัลลิ[คก]|metallic/i.test(text) ? 'หมึกเมทัลลิค'
        : /สะท้อนแสง|fluorescen/i.test(text) ? 'หมึกสะท้อนแสง'
        : /แพนโทน|pantone/i.test(text) ? 'หมึกแพนโทน'
        : /กันแดด|sunblock/i.test(text) ? 'หมึกกันแดด'
        : /\bUV\b/i.test(text) ? 'หมึก UV'
        : 'หมึกพิเศษธรรมดา';
      const printStyle = /ลายเส้น|line|pattern/i.test(text) ? 'ลายเส้น' : 'ตีพื้น';
      const newInk = {
        ink_color: inkColor ? inkColor[1].replace(/\s+/g, '') : '',
        ink_type: inkType,
        printing_style: printStyle,
      };
      // Avoid duplicate same color
      const dup = c0.color.special_ink.find(s => s.ink_color && s.ink_color === newInk.ink_color);
      if (!dup) {
        c0.color.special_ink.push(newInk);
      }
      const desc = `${newInk.ink_color || 'สีพิเศษ'} ${newInk.ink_type}`;
      changed.push(`เพิ่มสีพิเศษ: ${desc}`);
    }
  }

  // === Packing ===
  if (/(?:packing|แพ็ค|kraftwrap|paperband|carton|pallet)/i.test(text) && c0) {
    if (/kraftwrap/i.test(text)) { changed.push('Packing: Kraftwrap'); }
    if (/paperband/i.test(text)) { changed.push('Packing: Paperband'); }
    if (/carton/i.test(text)) { changed.push('Packing: Carton'); }
    if (/pallet/i.test(text)) { changed.push('Packing: Pallet'); }
    const pqMatch = text.match(/(\d+)\s*(?:pcs|ชิ้น|ใบ)\s*(?:\/|per|ต่อ)\s*(?:pack|แพ็ค)/i);
    if (pqMatch) changed.push(`Packing qty → ${pqMatch[1]} pcs/pack`);
  }

  // === Delivery จังหวัด + วันที่ (แยกข้อมูล + match กับ master data) ===
  // Match delivery destination — only explicit "ส่งที่/จัดส่ง/delivery" commands (NOT from structured spec)
  const delivMatch = !isStructuredSpec && text.match(/(?:^|\n)\s*(?:ส่ง\s*(?:ที่|ไป)|จัดส่ง\s*(?:ที่|ไป|:)?|delivery\s*(?:to|:)?)\s+([ก-๙a-zA-Z].{1,30})/im);
  if (delivMatch) {
    if (!f.delivery[0]) f.delivery[0] = freshDelivery();
    let rawDest = delivMatch[1].trim();

    // แยกวันที่ออกจากข้อความ — ครอบคลุมทุกรูปแบบ
    // "วันที่ 14/04/2026", "วันที่ส่ง 14/04/2026", "วันส่ง 14-04-26", "14/04/2026"
    const dateRx = /(?:วันที่\s*(?:ส่ง|จัดส่ง)?\s*|วัน\s*(?:ส่ง|จัดส่ง)\s*|date\s*:?\s*)?(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i;
    const dateMatch = rawDest.match(dateRx);
    if (dateMatch) {
      const [fullMatch, dd, mm, yyyy] = dateMatch;
      const year = yyyy.length === 2 ? '20' + yyyy : yyyy;
      f.delivery[0].dueDate = `${year}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
      changed.push(`วันจัดส่ง → ${dd}/${mm}/${year}`);
      // ลบวันที่ + คำนำหน้าออกจาก rawDest เหลือแค่ชื่อจังหวัด
      rawDest = rawDest.replace(/\s*(?:วันที่\s*(?:ส่ง|จัดส่ง)?\s*|วัน\s*(?:ส่ง|จัดส่ง)\s*|date\s*:?\s*)?\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/i, '').trim();
    }

    // Match จังหวัดกับ delivery_rate_info master data
    if (rawDest) {
      const delivInfo = State.masters['delivery_rate_info'] || [];
      const destNames = [...new Set(delivInfo.map(d => d.name).filter(Boolean))];
      // Exact match first
      let matched = destNames.find(n => n === rawDest);
      // Partial match
      if (!matched) matched = destNames.find(n => n.includes(rawDest) || rawDest.includes(n));
      if (matched) {
        f.delivery[0].destinationName = matched;
        f.delivery[0].province = matched;
        const rateEntry = delivInfo.find(d => d.name === matched);
        if (rateEntry) f.delivery[0].destinationId = rateEntry.destination_id || rateEntry.id || '';
        changed.push(`Delivery → ${matched}`);
      } else if (rawDest.length <= 30 && !/SIZE|TITLE|PAPER|COMPONENT|\d+\s*x\s*\d+/i.test(rawDest)) {
        // Only set if it looks like a province name (short, no spec keywords)
        f.delivery[0].destinationName = rawDest;
        f.delivery[0].province = rawDest;
        changed.push(`Delivery → ${rawDest} (ไม่พบในระบบ)`);
      }
    }
  }

  // === ค่าจัดส่ง ===
  const delivCostMatch = text.match(/(?:ค่าส่ง|ค่าจัดส่ง|delivery.?cost)\s*(?:=|:)?\s*(\d[\d,]*)/i);
  if (delivCostMatch) {
    f.delivery_cost = delivCostMatch[1].replace(/,/g, '');
    changed.push(`ค่าจัดส่ง → ${parseInt(f.delivery_cost).toLocaleString()} บาท`);
  }

  // === Component Name ===
  const compNameMatch = text.match(/(?:ชื่อ.?component|component.?name)\s*(?:เป็น|=|:)?\s*(.+)/i);
  if (compNameMatch && c0) {
    c0.component_name = compNameMatch[1].trim();
    changed.push(`Component Name → ${c0.component_name}`);
  }

  // === Markup ===
  const markupMatch = text.match(/(?:markup|มาร์คอัพ)\s*(?:=|:)?\s*(\d+(?:\.\d+)?)\s*%?/i);
  if (markupMatch && c0) {
    c0.paper.paper_markup = markupMatch[1];
    const cost = parseFloat(c0.paper.paper_cost) || 0;
    const rollCut = parseFloat(c0.paper.paper_roll_cut) || 0;
    c0.paper.paper_sale = (cost * (1 + parseFloat(markupMatch[1]) / 100) + rollCut).toFixed(2);
    changed.push(`Paper Markup → ${markupMatch[1]}%`);
  }

  // === F-code Qty ===
  const fqMatch = text.match(/(?:f.?code|เอฟ)\s*(\S+)\s*(?:จำนวน|qty|=|:)\s*(\d[\d,]*)/i);
  if (fqMatch && f.f_data?.length > 0) {
    const fCode = fqMatch[1].toUpperCase();
    const fQty = fqMatch[2].replace(/,/g, '');
    const fd = f.f_data.find(d => d.f_code?.toUpperCase() === fCode);
    if (fd) { fd.qty = fQty; changed.push(`${fCode} qty → ${parseInt(fQty).toLocaleString()}`); }
  }

  // === ลบ Component ===
  if (/(?:ลบ|delete|remove).*(?:component|ชิ้นส่วน)/i.test(text)) {
    const delIdx = text.match(/(?:component|ชิ้นส่วน)\s*(?:ที่)?\s*(\d+)/i);
    if (delIdx && f.components.length > 1) {
      const idx = parseInt(delIdx[1]) - 1;
      if (idx >= 0 && idx < f.components.length) {
        f.components.splice(idx, 1);
        changed.push(`ลบ Component ${idx + 1}`);
      }
    }
  }

  // === เพิ่ม Component ===
  if (/(?:เพิ่ม|add).*(?:component|ชิ้นส่วน)/i.test(text)) {
    f.components.push(freshComponent());
    changed.push(`เพิ่ม Component ${f.components.length}`);
  }

  // === Estimator ===
  const estMatch = text.match(/(?:estimator|ผู้ประเมิน)\s*(?:เป็น|=|:|คือ)?\s*(.+)/i);
  if (estMatch) {
    f.estimator = { emp_id: '', emp_name: estMatch[1].trim() };
    changed.push(`Estimator → ${estMatch[1].trim()}`);
  }

  // === Diecut ===
  if (/(?:ไดคัท|die.?cut|diecut)/i.test(text)) {
    f.is_diecut = !/(?:ไม่|ลบ|ยกเลิก|ปิด|remove|no)/i.test(text);
    changed.push(f.is_diecut ? 'เปิด Diecut' : 'ปิด Diecut');
  }

  // === ใช้ Plate เก่า ===
  if (/(?:plate\s*เก่า|เพลท\s*เก่า|ใช้.*plate|use.*plate|previous.*plate)/i.test(text)) {
    f.is_use_previous_plate = !/(?:ไม่|ลบ|ยกเลิก|ปิด|remove|no)/i.test(text);
    changed.push(f.is_use_previous_plate ? 'ใช้ Plate เก่า' : 'ไม่ใช้ Plate เก่า');
  }

  // === Packing — structured qty parse ===
  if (/(?:packing|แพ็ค|kraftwrap|paperband|carton|pallet)/i.test(text) && c0) {
    // แต่ละ type: parse qty เช่น "kraftwrap 160 pcs/pack" "carton 480"
    const pkTypes = [
      { key: 'kraftwrap', rx: /kraftwrap\s*(\d+)?/i },
      { key: 'paperband', rx: /paper\s*band\s*(\d+)?/i },
      { key: 'carton', rx: /carton\s*(\d+)?/i },
      { key: 'pallet', rx: /pallet/i },
    ];
    pkTypes.forEach(pk => {
      const m = text.match(pk.rx);
      if (m) {
        c0['_pk_' + pk.key] = true;
        if (m[1]) c0['_pk_' + pk.key + '_qty'] = m[1];
        changed.push(`Packing: ${pk.key}${m[1] ? ' ' + m[1] : ''}`);
      }
    });
    // Parse generic packing qty: "160 pcs/pack" or "160 ชิ้น/แพ็ค"
    const pqMatch = text.match(/(\d+)\s*(?:pcs|ชิ้น|ใบ)\s*[\/per]*\s*(?:pack|แพ็ค)/i);
    if (pqMatch && !changed.some(c => c.includes('pcs'))) {
      c0._pk_kraftwrap_qty = pqMatch[1];
      changed.push(`Packing qty → ${pqMatch[1]} pcs/pack`);
    }
  }

  // === Other Process ===
  if (/(?:เพิ่ม|add).*(?:other\s*process|กระบวนการ|process อื่น)/i.test(text)) {
    const procName = text.match(/(?:other\s*process|กระบวนการ|process)\s*(?:=|:)?\s*(.+)/i);
    f.other_process.push(freshOtherProcess());
    if (procName) f.other_process[f.other_process.length - 1].name = procName[1].trim();
    changed.push(`เพิ่ม Other Process: ${procName ? procName[1].trim() : 'ใหม่'}`);
  }

  // === Handwork ===
  if (/(?:เพิ่ม|add).*(?:handwork|งานมือ|แฮนด์เวิร์ค)/i.test(text)) {
    const hwName = text.match(/(?:handwork|งานมือ|แฮนด์เวิร์ค)\s*(?:=|:)?\s*(.+)/i);
    f.handwork_process.push(freshHandwork());
    if (hwName) f.handwork_process[f.handwork_process.length - 1].name = hwName[1].trim();
    changed.push(`เพิ่ม Handwork: ${hwName ? hwName[1].trim() : 'ใหม่'}`);
  }

  // === Outsource (จัดจ้าง) ===
  if (/(?:เพิ่ม|add).*(?:outsource|จัดจ้าง)/i.test(text)) {
    const osName = text.match(/(?:outsource|จัดจ้าง)\s*(?:=|:)?\s*(.+)/i);
    f.outsource.push(freshOutsource());
    if (osName) f.outsource[f.outsource.length - 1].name = osName[1].trim();
    changed.push(`เพิ่ม จัดจ้าง: ${osName ? osName[1].trim() : 'ใหม่'}`);
  }

  // === Materials ===
  if (/(?:เพิ่ม|add).*(?:material|วัสดุ)/i.test(text)) {
    const matName = text.match(/(?:material|วัสดุ)\s*(?:=|:)?\s*(.+)/i);
    f.materials.push(freshMaterial());
    if (matName) f.materials[f.materials.length - 1].name = matName[1].trim();
    changed.push(`เพิ่ม Material: ${matName ? matName[1].trim() : 'ใหม่'}`);
  }

  // === Remark / หมายเหตุ ===
  const remarkMatch = text.match(/(?:หมายเหตุ|remark|note)\s*(?:=|:)?\s*(.+)/i);
  if (remarkMatch) {
    f.remark = (f.remark ? f.remark + '\n' : '') + remarkMatch[1].trim();
    changed.push(`หมายเหตุ: ${remarkMatch[1].trim()}`);
  }

  // === Remark AE ===
  const remarkAeMatch = text.match(/(?:หมายเหตุ\s*ae|remark\s*ae|ae\s*note)\s*(?:=|:)?\s*(.+)/i);
  if (remarkAeMatch) {
    f.remark_ae = (f.remark_ae ? f.remark_ae + '\n' : '') + remarkAeMatch[1].trim();
    changed.push(`หมายเหตุ AE: ${remarkAeMatch[1].trim()}`);
  }

  // === Flap sizes (ติดกาว, ฝาเสียบ, ปีกกล่อง) ===
  if (c0?.packaging_size) {
    const gfMatch = text.match(/(?:ติดกาว|glue.?flap|gf)\s*(?:=|:)?\s*(\d+(?:\.\d+)?)\s*(?:mm)?/i);
    if (gfMatch) { c0.packaging_size.glue_flap = gfMatch[1]; changed.push(`ติดกาว (GF) → ${gfMatch[1]} mm`); }
    const tfMatch = text.match(/(?:ฝาเสียบ|tuck.?flap|tf)\s*(?:=|:)?\s*(\d+(?:\.\d+)?)\s*(?:mm)?/i);
    if (tfMatch) { c0.packaging_size.tuck_flap = tfMatch[1]; changed.push(`ฝาเสียบ (TF) → ${tfMatch[1]} mm`); }
    const dfMatch = text.match(/(?:ปีกกล่อง|dust.?flap|df)\s*(?:=|:)?\s*(\d+(?:\.\d+)?)\s*(?:mm)?/i);
    if (dfMatch) { c0.packaging_size.dust_flap = dfMatch[1]; changed.push(`ปีกกล่อง (DF) → ${dfMatch[1]} mm`); }
    const olMatch = text.match(/(?:overlap|ol)\s*(?:=|:)?\s*(\d+(?:\.\d+)?)\s*(?:mm)?/i);
    if (olMatch) { c0.packaging_size.ol = olMatch[1]; changed.push(`Overlap → ${olMatch[1]} mm`); }
  }

  // === Machine ID (เลือกเครื่องพิมพ์) ===
  const machMatch = text.match(/(?:เครื่อง|machine)\s*(?:=|:)?\s*(cut\s*[123]|flexo|jet\s*press|konica|[A-Z]\d{2,4})/i);
  if (machMatch) {
    const keyword = machMatch[1].toLowerCase().replace(/\s+/g, '');
    const allMachines = typeof CalcEngine !== 'undefined' ? CalcEngine.getAllMachines() : [];
    const found = allMachines.find(m => m.id.toLowerCase().includes(keyword) || m.name.toLowerCase().includes(keyword));
    if (found) { f.machine_id = found.id; changed.push(`เครื่องพิมพ์ → ${found.name}`); }
  }

  // === Credit Term ===
  const ctMatch = text.match(/(?:credit\s*term|เครดิต|วงเงิน)\s*(?:=|:)?\s*(.+)/i);
  if (ctMatch) {
    f.credit_term = ctMatch[1].trim();
    changed.push(`Credit Term → ${ctMatch[1].trim()}`);
  }

  // === Request Approve ===
  if (/(?:request\s*approve|ขออนุมัติ)/i.test(text)) {
    f.request_approve = !/(?:ไม่|ยกเลิก|ปิด|cancel)/i.test(text);
    changed.push(f.request_approve ? 'Request Approve: เปิด' : 'Request Approve: ปิด');
  }

  // === งานมีหลาย F ===
  if (/(?:หลาย\s*f|multi.?f|multiple\s*f)/i.test(text)) {
    f.has_multi_f = !/(?:ไม่|ปิด|ยกเลิก|single)/i.test(text);
    changed.push(f.has_multi_f ? 'เปิด งานมีหลาย F' : 'ปิด งานมีหลาย F');
  }

  // === Flexo Size ===
  const flexoSzMatch = text.match(/(?:flexo\s*size)\s*(?:=|:)?\s*(.+)/i);
  if (flexoSzMatch) {
    f.flexo_size = flexoSzMatch[1].trim();
    changed.push(`Flexo Size → ${flexoSzMatch[1].trim()}`);
  }

  if (changed.length > 0) {
    renderForm();
    // Auto-check missing → start fill flow ถ้ายังขาด
    setTimeout(() => {
      const missing = checkMissingFields(State.form);
      if (missing.length > 0) startFillFlow(missing);
    }, 500);
    return '✅ แก้ไขให้แล้วครับ:\n' + changed.map(c => '• ' + c).join('\n');
  }

  // ไม่เข้าใจ — ตอบแบบ human + แนะนำ
  return `หมายถึงอะไรครับ? ผมยังไม่ค่อยเข้าใจ ลองบอกชัดๆ อีกทีนะครับ 😊

สั่ง Pornchai AI แก้ไขฟอร์มได้ทุกอย่าง เช่น:

📋 ข้อมูลทั่วไป:
• "เปลี่ยนเป็น Reprint"
• "ชื่องาน = กล่องครีม XYZ"
• "ลูกค้า = บริษัท ABC"
• "AE = สมชาย"

📊 จำนวน:
• "จำนวน 5000"
• "qty 1000, 2000, 5000"
• "run-on 5%"

🖨 การพิมพ์:
• "print type Offset"
• "หมึก UV"
• "สี 4/0" หรือ "6 สี"

📐 ขนาด:
• "ขนาด 200x150x50"
• "กว้าง 384" / "ยาว 252" / "สูง 30"
• "template type 5"

📄 กระดาษ:
• "กระดาษ AC 300 gsm"
• "markup 12%"
• "cost 22"

🎨 Addon:
• "เพิ่ม coating" / "ลบ coating"
• "foil สีเงิน" / "ลบ foil"
• "เปิด emboss" / "ปิด deboss"

📦 ลูกฟูก:
• "ลูกฟูก 2 ชั้น ลอน E เกรด CA 125"
• "corrugated 3 layer B flute KA/CA 125/150"
• "จำนวนชั้น 2 ลอน E CA125"

🔧 Process:
• "เพิ่ม other process ติดกาว"
• "เพิ่ม handwork ตรวจนับ"
• "เพิ่ม outsource ชุบ"
• "เพิ่ม material กาว"

✅ Flags:
• "มีไดคัท" / "ไม่มีไดคัท"
• "ใช้เพลทเก่า"
• "ลิมิตสี 3"
• "มีสีพิเศษ PMS001 หมึก UV"

📦 อื่นๆ:
• "ส่งที่ กรุงเทพ" / "delivery ชลบุรี"
• "เพิ่ม/ลบ component"
• "หมายเหตุ: ส่งด่วน"
• "ติดกาว 15mm" / "ฝาเสียบ 20mm"
• "run-on 5, 250" / "AE Qty 5"
• "credit term 30 วัน"

💡 Tips: พิมพ์ภาษาไทยหรืออังกฤษก็ได้ ไม่ต้องใส่คำว่า "เปลี่ยน" นำหน้า
หรือส่ง spec ใหม่มาได้เลยครับ!`;
}

// === Pornchai AI Agent: Full Persona + Guardrails ===
async function aiAgentChat(userText) {
  const f = State.form;
  const c0 = f?.components?.[0];

  // สรุปสถานะฟอร์มปัจจุบัน
  const formCtx = f ? {
    job_name: f.job_name || '', job_type: f.job_type || 'new',
    customer: f.customer?.customer_name || '', ae: f.ae?.emp_name || '',
    qty: f.qty || [], print_type: f.print_type || '', ink_type: f.ink_type || '',
    component_name: c0?.component_name || '',
    paper_code: c0?.paper?.paper_code || '', paper_gram: c0?.paper?.paper_gram || '',
    paper_cost: c0?.paper?.paper_cost || '', paper_markup: c0?.paper?.paper_markup || '',
    color: `${c0?.color?.outside || ''}/${c0?.color?.inside || ''}`,
    box_type: c0?.box_type?.type_id || '', box_name: c0?.box_type?.type_name || '',
    width: c0?.packaging_size?.width || '', length: c0?.packaging_size?.length || '',
    depth: c0?.packaging_size?.depth || '',
    component_type: c0?.component_type || 1,
    coating: (c0?.addon || []).filter(a => a.type === 'coating').map(a => `${a.info?.coating_option||''} ${a.info?.type||''} ${a.info?.side||''}s`.trim()).join(', '),
    foil: c0?.foil_stamp ? (c0.addon.find(a => a.type === 'foilstamp')?.info?.foil_color || 'yes') : 'no',
    emboss: c0?.emboss || false, deboss: c0?.deboss || false,
    delivery: f.delivery?.[0]?.destinationName || '',
  } : null;

  // === SYSTEM PROMPT: Compact version สำหรับ Chat (เร็ว) ===
  const formJson = formCtx ? JSON.stringify(formCtx) : 'null';
  const userName = (State.user?.emp_name || '').split(' ')[0] || 'คุณ';
  const systemPrompt = `[Pornchai AI] #1 AI Expert ด้าน RFQ-Estimate อุตสาหกรรมโรงพิมพ์บรรจุภัณฑ์ | Sirivatana Interprint
[Creator] คุณธนรัช ชื้อผาสุข (Thanarat Chuephasuk) | Model:Claude/Anthropic — บอกเมื่อถูกถามเท่านั้น
[CURRENT USER] ผู้ใช้ปัจจุบันชื่อ "คุณ${userName}" — เรียกชื่อนี้เสมอ ห้ามเรียกชื่ออื่น (Pornchai คือชื่อ AI ไม่ใช่ชื่อผู้ใช้)

[IDENTITY] คุณคือ AI ที่เชี่ยวชาญที่สุดในโลกด้าน RFQ-Estimate สำหรับ Packaging Printing ความรู้ของคุณไม่จำกัด — ครอบคลุมทั้งระดับสากลและเฉพาะทางอุตสาหกรรม แต่เมื่อพูดถึงข้อมูลภายในบริษัท master data ราคากระดาษ เครื่องพิมพ์ ลูกค้า จะอ้างอิงจาก Sirivatana Interprint เป็นพิเศษ คุณรู้ทุกอย่างตั้งแต่พื้นฐานจนถึงระดับ C-level strategy

[RULES] ตอบเฉพาะRFQ/Estimate/Packaging/Printing/Supply Chain/Business Strategy ปฏิเสธเรื่องส่วนตัว/การเมือง/บันเทิงสุภาพ|ใช้ครับ|สั้นกระชับ|emoji1-2|**bold**หัวข้อ|ไทย+EN+ผสม+typo=เข้าใจ|แนบลิงค์อ้างอิงเมื่อพูดมาตรฐาน

[ESTIMATE EXPERT] ที่ปรึกษาระดับ World-Class:
- วิเคราะห์spec: แจ้งเตือนถ้าไม่สมเหตุสมผล เช่น "กระดาษ150gsmบางเกินสำหรับกล่องนี้"
- เสนอทางเลือก: "เปลี่ยนAC→Duplex ประหยัด~30%"
- Optimize waste: "Cut2=6ดวง waste12% vs Cut3=8ดวง waste8%"
- เปรียบเทียบยอด: "3,000=8.50บ/ใบ vs 5,000=6.20บ/ใบ"
- แจ้งเตือนเสี่ยง: "ขนาดเกินOffset→ต้องFlexo คุณภาพสีต่าง"
- คำนวณ: Layout/OpenSize/FoldSize/PaperUsage/Waste/Cost/Plate/Print/AfterPress/Total/Markup
- ตอบทุกระดับ: เริ่มต้น→กลาง→ขั้นสูง→สากล (TCO/Break-even/ISO testing)

[KNOWLEDGE]
Box12แบบ: 1.ReverseTuck 2.StraightTuck 3.TTSLB(หูขัด) 4.TTAB(ทากาว) 5.Tray(ฝาครอบ) 6.FrameVue 7.FourCorner 8.GableTop(จั่ว) 9.Sleeve(ปลอก) 10.Pillow(หมอน) 11.SealEnd 12.Custom
Paper: AC,GA,MA,SBS,CRB,IVR,KA,KI,DupGBB/WBB/BBB,Kraft | GSM:80-600 | Markup:ในประเทศ10%/นำเข้า13%
Machine Sirivatana: ตัด2-LS540(5สี+Coat 720x1030 DEFAULT packaging) ตัด2-L640C(6สี+Coat 720x1030) ตัด1-G844C+IR(8สี+Coat 840x1150) Flexo(1448x2398) JetPress(585x750) Konica(330x487)
Afterpress: Folder(14เครื่อง) เย็บเข็ม(OSAKO/Heidelberg12เครื่อง) เย็บกี่(ASTRONIC/AsterPro) ไสกาว(MullerMartini24Head/Kolbus21Head) HardCover(CaseMaking/Liner/CaseIn) Coating(OPP22m/min,UV3500sph,SilkScreen,Waterbase2000sph,Blister) Diecut(Sanwa/Yoco/Asahi/Bobst5000sph/SHIHENG8000sph) Hotstamp(LCK/Heidelberg/Manual) WireO(15+เครื่อง) RigidBox(GS-230/GS-450F8) BoardBook(PhotoFast25/min)

[CALC ENGINE] สูตร OpenSize: T1/2:W=2(w+tf)+d,L=2(w+l)+gf | T3/4:W=tf+w+d+w/2+ol | T5:W=w+4d,L=l+4d+2dust | T6:W=w+4d+2dust+2ol | T7:W=2(l+dust)+w,L=2(l+d)+l | T8:W=tf+2d+w/2+ol | T9:W=d | T10:W=l+d,L=2w+gf | T11:W=2w+d | T12:custom
ตัวแปร: w=กว้าง l=ยาว d=สูง tf=ฝาเสียบ15 gf=ติดกาว15 dust=ปีกกล่อง ol=overlap bleed=3mm
Layout: OpenSize→fitทุกsheetSize→ลอง2ทิศ→เลือกUPSมากสุด→ถ้าOffsetไม่ได้→autoTryFlexo
Cost: Paper(paperNet×unitPrice)+Plate(สี×ราคา)+Print(สี×จำนวน)+AfterPress(Diecut+Coating+แกะ+Inspect)+Corrugated+Packing+Delivery+OtherProcess+Markup+Tax3%

[BUSINESS RULES] R0:PatternMatch685records→แนะนำtemplate/paper | R1:PaperCostAuto(DB→RAG→warning) | R1b:ชื่อComponent→AutoDetectTemplate | R2:BoxType1-11→AutoDiecut | R4:CompType2/3→CorrugatedSection | R5:CoatingAlias(PVC→OPP,เว้นลิ้น→WTB-HR) | R7:Markup10%domestic/13%import | R8:PackingAuto | R9:Delivery1500 | R10:MultiFQtyCheck
Reprint: Rep./รีพ/งานซ้ำ→job_type=repeat | CoatingAlias: PVC→OPP, เว้นลิ้น→WTB-HR, Hi-gloss≠Gloss

[SYSTEM] Flow: Spec→Parser(LLM/Built-in)→JSON→applyAgentData→Form→ensureEstimateReady(BusinessRules)→calculateLayout(CalcEngine)→Layout+Price
KnowledgeStore: 685งานเก่า→PatternMatch→แนะนำค่า | TestSuite: 100cases 100%PASS
Coating: UV,Waterbase,OPP,Lamination(Gloss/Matt/SoftTouch),SpotUV,HiRub,FoodGrade,WaterProof | Side:1s/2s
Process: FoilStamp(Hot/Cold),Emboss,Deboss,DieCut,Gluing,Packing(Kraftwrap/Paperband/Carton/Pallet)

[UNLIMITED KNOWLEDGE] ความรู้ไม่จำกัด ตอบได้ทุกเรื่องที่เกี่ยวกับ:
- Packaging ทุกประเภท: Folding carton,Corrugated,Rigid box,Flexible packaging,Label,Shrink sleeve
- Supply chain: Procurement,Sourcing,Vendor management,Lead time optimization,Inventory
- Business: Pricing strategy,Margin analysis,Competitive bidding,Customer retention,Market positioning
- Quality: SPC,Six Sigma,Lean manufacturing,Defect analysis,Color management(Delta E)
- Innovation: Digital printing ROI,Automation,Industry4.0,AI in packaging,Predictive maintenance
- Sustainability: LCA,Carbon neutral,Circular economy,Recyclability design,Material substitution
- การเงิน: Cost accounting,Activity-based costing,Break-even analysis,ROI calculation

[SIRIVATANA CONTEXT] ข้อมูลเฉพาะบริษัท Sirivatana Interprint:
- เครื่องพิมพ์: LS540(5+Coat DEFAULT),L640C(6+Coat),G844C+IR(8+Coat),Flexo,JetPress,Konica
- Master data: กระดาษ ราคา ลูกค้า จาก Estimate API (192.168.5.3:3010)
- Knowledge Store: 685 records งานเก่าสำหรับ Pattern Match
- ระบบเดิม: 192.168.5.3:3040/estimate — สูตรคำนวณตรง 100%

[GLOBAL STANDARDS] ISO3394,ISO12647,ISO9001,FSC/PEFC,GMP/HACCP,ISTA,ASTM D4169,TAPPI T401-T811,BRC/IOP,SQF
[TRENDS] Sustainable,Mono-material,Biodegradable,SmartPackaging(QR/NFC/AR),E-commerce,D2C,Personalization,Short-run digital,Connected packaging,Anti-counterfeit
[MARKET] Global packaging $1.2T(2026)|จีน>สหรัฐ>ยุโรป>ญี่ปุ่น>อาเซียน|PaperIndex:FOEX/Fastmarkets|Growth:4.5%CAGR

[REFERENCES] แนบlink: iso.org|fsc.org|smithers.com|fastmarkets.com|packagingeurope.com|worldpackaging.org|eur-lex.europa.eu|statista.com|grandviewresearch.com|tappi.org|drupa.com|mckinsey.com/packaging

[PHASE2 READY] เตรียมเป็นAI Wizard: คุยสร้างRFQจากศูนย์→แนะนำreal-time→เรียนรู้จากประวัติ→ตัดสินใจแทนuserได้→อธิบายเหตุผล→ให้คำปรึกษาระดับC-level

[FORM] ${formCtx ? formJson : 'ไม่มีฟอร์ม→แนะนำส่งspec'}
${formCtx ? '[CAN] แก้ทุกfield|แนะนำค่า|วิเคราะห์spec|เปรียบเทียบoption|ตอบคำถามEstimate|ให้คำปรึกษาธุรกิจ|วิเคราะห์ต้นทุน|แนะนำ strategy' : '[CAN] แนะนำส่งspec|ตอบทุกคำถามEstimate/Packaging/Business|อธิบายระบบ|ให้คำปรึกษา'}


## สำคัญมาก: ตอบเป็น JSON เท่านั้น ทุกครั้ง
แก้ฟอร์ม: {"action":"modify","changes":[{"field":"xxx","value":"xxx","label":"คำอธิบาย"}],"reply":"ข้อความ"}
สนทนา: {"action":"chat","reply":"ข้อความ"}

ตัวอย่าง:
- "สี 4/0" → {"action":"modify","changes":[{"field":"color","value":"4/0","label":"สี → 4/0"}],"reply":"เปลี่ยนสีเป็น 4/0 ให้แล้วครับ ✅"}
- "จำนวน 3000" → {"action":"modify","changes":[{"field":"qty","value":["3000"],"label":"จำนวน → 3,000"}],"reply":"เปลี่ยนจำนวนให้แล้วครับ ✅"}
- "เลือก template 5" → {"action":"modify","changes":[{"field":"box_type","value":"5","label":"Template → Type 5"}],"reply":"เลือก Template 5 ให้แล้วครับ ✅"}
- "Estimate ที่ดีเป็นแบบไหน" → {"action":"chat","reply":"Estimate ที่ดีควรมี..."}
- "สวัสดี" → {"action":"chat","reply":"สวัสดีครับ ${userName} 👋 มีอะไรให้ช่วยเรื่อง Estimate ครับ?"}
- "วันนี้ฝนตก" → {"action":"chat","reply":"ขอโทษครับ ผมช่วยได้เฉพาะเรื่อง RFQ-Estimate ครับ 😊 ส่ง spec มาได้เลย!"}

fields: job_type("new"/"repeat") job_name customer ae qty(array) print_type("offset"/"flexo"/"jetpress"/"konica") ink_type("conventional"/"uv") color("4/0") paper_code paper_gram paper_cost paper_markup width length depth box_type("1"-"12") component_type(1/2/3) flute_type component_name coating("add"/"remove"/name) foil_stamp("add"/"remove"/color) emboss(true/false) deboss(true/false) special_ink("add PMS001 หมึก UV ตีพื้น"/"remove") delivery run_on_percent delivery_cost`;

  const res = await apiPost('/api/chat', {
    message: userText,
    system: systemPrompt,
    context: 'pornchai_agent'
  });

  const aiText = res.reply || res.message || '';

  // พยายาม parse JSON จาก AI response
  const jsonMatch = aiText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // === Action: modify (แก้ไขฟอร์ม) ===
      if (parsed.action === 'modify' && parsed.changes?.length > 0 && f) {
        let changed = [];
        for (const ch of parsed.changes) {
          try { applyFieldChange(f, ch); changed.push(ch.label || `${ch.field} → ${ch.value}`); } catch (e) {}
        }
        if (changed.length > 0) {
          renderForm();
          const reply = parsed.reply || '✅ แก้ไขให้แล้วครับ';
          // Auto-check missing → ถ้ายังขาด → start fill flow
          setTimeout(() => {
            const missing = checkMissingFields(State.form);
            if (missing.length > 0) startFillFlow();
          }, 500);
          return reply + '\n' + changed.map(c => '• ' + c).join('\n');
        }
      }

      // === Action: chat (สนทนา) ===
      if (parsed.reply) return parsed.reply;
    } catch (e) { /* JSON parse failed — use raw text */ }
  }

  // ถ้า AI ตอบ plain text (ไม่ใช่ JSON)
  if (aiText.trim()) return aiText;

  return 'อืม... ผมยังไม่ค่อยเข้าใจครับ 🤔 ลองบอกอีกทีได้ไหมครับ? หรือลองพิมพ์สั้นๆ ตรงๆ เช่น "template custom" หรือ "สี 4/0" ครับ';
}

// Apply single field change to form
function applyFieldChange(f, ch) {
  const c0 = f.components?.[0];
  switch (ch.field) {
    case 'job_type': f.job_type = ch.value; f.is_reprinted = ch.value === 'repeat'; break;
    case 'job_name': f.job_name = ch.value; break;
    case 'customer': f.customer = { customer_id: '', customer_name: ch.value }; break;
    case 'ae': f.ae = { emp_id: '', emp_name: ch.value }; break;
    case 'qty':
      const qArr = Array.isArray(ch.value) ? ch.value : [ch.value];
      qArr.forEach((q, i) => { f.qty[i] = String(q).replace(/,/g, ''); });
      break;
    case 'print_type': f.print_type = ch.value; f.machine_id = ''; break;
    case 'ink_type': f.ink_type = ch.value; break;
    case 'color':
      if (c0) { const p = String(ch.value).split('/'); c0.color.outside = p[0] || '0'; c0.color.inside = p[1] || '0'; }
      break;
    case 'paper_code': if (c0) c0.paper.paper_code = ch.value; break;
    case 'paper_gram': if (c0) c0.paper.paper_gram = ch.value; break;
    case 'paper_cost':
      if (c0) {
        c0.paper.paper_cost = ch.value;
        const mk = parseFloat(c0.paper.paper_markup) || 10;
        c0.paper.paper_sale = (parseFloat(ch.value) * (1 + mk / 100) + (parseFloat(c0.paper.paper_roll_cut) || 0)).toFixed(2);
      }
      break;
    case 'paper_markup':
      if (c0) {
        c0.paper.paper_markup = ch.value;
        const cost = parseFloat(c0.paper.paper_cost) || 0;
        c0.paper.paper_sale = (cost * (1 + parseFloat(ch.value) / 100) + (parseFloat(c0.paper.paper_roll_cut) || 0)).toFixed(2);
      }
      break;
    case 'width': if (c0) c0.packaging_size.width = ch.value; break;
    case 'length': if (c0) c0.packaging_size.length = ch.value; break;
    case 'depth': if (c0) c0.packaging_size.depth = ch.value; break;
    case 'box_type': if (c0) setCompBoxType(0, ch.value); break;
    case 'component_type': if (c0) c0.component_type = parseInt(ch.value) || 1; break;
    case 'flute_type': if (c0) { if (!c0.corrugated) c0.corrugated = {}; c0.corrugated.flute_type = ch.value; } break;
    case 'component_name': if (c0) c0.component_name = ch.value; break;
    case 'coating':
      if (c0) {
        if (ch.value === 'remove') c0.addon = c0.addon.filter(a => a.type !== 'coating');
        else if (ch.value === 'add') { const ad = freshAddon('coating'); ad.name = 'Coating'; c0.addon.push(ad); }
        else { let a = c0.addon.find(a => a.type === 'coating'); if (!a) { a = freshAddon('coating'); a.name = 'Coating'; c0.addon.push(a); } matchCoatingType(a, ch.value); }
      }
      break;
    case 'foil_stamp':
      if (c0) {
        if (ch.value === 'remove') { c0.addon = c0.addon.filter(a => a.type !== 'foilstamp'); c0.foil_stamp = false; }
        else { c0.foil_stamp = true; let a = c0.addon.find(a => a.type === 'foilstamp'); if (!a) { a = freshAddon('foilstamp'); a.name = 'Foil stamp'; c0.addon.push(a); } if (ch.value !== 'add') matchFoilColor(a, ch.value); }
      }
      break;
    case 'emboss': if (c0) c0.emboss = ch.value === true || ch.value === 'true'; break;
    case 'deboss': if (c0) c0.deboss = ch.value === true || ch.value === 'true'; break;
    case 'special_ink':
      if (c0) {
        if (ch.value === 'remove') { c0.color.is_special_ink = false; c0.color.special_ink = []; }
        else {
          c0.color.is_special_ink = true;
          if (!c0.color.special_ink) c0.color.special_ink = [];
          const val = String(ch.value || '');
          const inkColor = val.match(/\b(PMS\s*\d+|Pantone\s*\d+[A-Z]*)\b/i);
          const inkType = /เมทัลลิ[คก]|metallic/i.test(val) ? 'หมึกเมทัลลิค' : /สะท้อนแสง|fluorescen/i.test(val) ? 'หมึกสะท้อนแสง' : /UV/i.test(val) ? 'หมึก UV' : 'หมึกพิเศษธรรมดา';
          const printStyle = /ลายเส้น|line/i.test(val) ? 'ลายเส้น' : 'ตีพื้น';
          c0.color.special_ink.push({ ink_color: inkColor ? inkColor[1].replace(/\s+/g, '') : val.replace(/^add\s*/i,'').trim(), ink_type: inkType, printing_style: printStyle });
        }
      }
      break;
    case 'delivery':
      if (!f.delivery[0]) f.delivery[0] = freshDelivery();
      f.delivery[0].destinationName = ch.value; f.delivery[0].province = ch.value;
      break;
    case 'delivery_cost': f.delivery_cost = String(ch.value).replace(/,/g, ''); break;
    case 'run_on_percent': f.run_on_percent = ch.value; autoCalcRunOn(); break;
  }
}

// Legacy: local rules (fallback when AI API offline)
async function aiInterpretFormCommand(userText) {
  const f = State.form;
  const c0 = f.components?.[0];

  // สรุปสถานะฟอร์มปัจจุบัน ส่งให้ AI เป็น context
  const formSummary = {
    job_name: f.job_name || '',
    job_type: f.job_type || 'new',
    customer: f.customer?.customer_name || '',
    ae: f.ae?.emp_name || '',
    qty: f.qty || [],
    print_type: f.print_type || '',
    ink_type: f.ink_type || '',
    component_name: c0?.component_name || '',
    paper_code: c0?.paper?.paper_code || '',
    paper_gram: c0?.paper?.paper_gram || '',
    color_outside: c0?.color?.outside || '',
    color_inside: c0?.color?.inside || '',
    box_type: c0?.box_type?.type_id || '',
    width: c0?.packaging_size?.width || '',
    length: c0?.packaging_size?.length || '',
    depth: c0?.packaging_size?.depth || '',
  };

  const prompt = `คุณคือ Pornchai AI Agent ช่วยแปลงคำสั่งจากผู้ใช้เป็น JSON สำหรับแก้ไขฟอร์ม RFQ-Estimate

สถานะฟอร์มปัจจุบัน:
${JSON.stringify(formSummary, null, 2)}

คำสั่งจากผู้ใช้: "${userText}"

ตอบเป็น JSON เท่านั้น (ไม่มีข้อความอื่น) ตามรูปแบบ:
{"changes":[{"field":"ชื่อ field","value":"ค่าใหม่","label":"คำอธิบายสั้นๆ"}]}

field ที่รองรับ:
- job_type: "new" หรือ "repeat"
- job_name, customer, ae: string
- qty: array of numbers เช่น ["1000","2000"]
- print_type: "offset","flexo","jetpress","konica"
- ink_type: "conventional","uv"
- color: "4/0" format
- paper_code: "AC","GA","MA","SBS","CRB","Dup GBB" etc.
- paper_gram: string number
- paper_cost: string number
- paper_markup: string number
- width, length, depth: string mm
- box_type: "1"-"12"
- component_type: 1,2,3
- flute_type: "A","B","C","E"
- coating: "add","remove", or coating name
- foil_stamp: "add","remove", or color name
- emboss: true/false
- deboss: true/false
- delivery: destination name
- component_name: string

ถ้าไม่เกี่ยวกับ RFQ-Estimate ให้ตอบ: {"changes":[],"message":"ขอโทษครับ..."}`;

  try {
    const res = await apiPost('/api/chat', { message: prompt });
    const aiText = res.reply || res.message || '';

    // หา JSON จาก response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('no json');

    const parsed = JSON.parse(jsonMatch[0]);

    // ถ้า AI บอกว่าไม่เกี่ยว
    if (parsed.message && (!parsed.changes || parsed.changes.length === 0)) {
      return parsed.message;
    }

    if (!parsed.changes || parsed.changes.length === 0) throw new Error('empty changes');

    // Apply changes
    let changed = [];
    for (const ch of parsed.changes) {
      try {
        switch (ch.field) {
          case 'job_type':
            f.job_type = ch.value;
            f.is_reprinted = ch.value === 'repeat';
            break;
          case 'job_name': f.job_name = ch.value; break;
          case 'customer':
            f.customer = { customer_id: '', customer_name: ch.value };
            break;
          case 'ae':
            f.ae = { emp_id: '', emp_name: ch.value };
            break;
          case 'qty':
            const qArr = Array.isArray(ch.value) ? ch.value : [ch.value];
            qArr.forEach((q, i) => { f.qty[i] = String(q).replace(/,/g, ''); });
            break;
          case 'print_type': f.print_type = ch.value; f.machine_id = ''; break;
          case 'ink_type': f.ink_type = ch.value; break;
          case 'color':
            if (c0) {
              const parts = String(ch.value).split('/');
              c0.color.outside = parts[0] || '0';
              c0.color.inside = parts[1] || '0';
            }
            break;
          case 'paper_code': if (c0) c0.paper.paper_code = ch.value; break;
          case 'paper_gram': if (c0) c0.paper.paper_gram = ch.value; break;
          case 'paper_cost':
            if (c0) {
              c0.paper.paper_cost = ch.value;
              const mk = parseFloat(c0.paper.paper_markup) || 10;
              const rc = parseFloat(c0.paper.paper_roll_cut) || 0;
              c0.paper.paper_sale = (parseFloat(ch.value) * (1 + mk / 100) + rc).toFixed(2);
            }
            break;
          case 'paper_markup':
            if (c0) {
              c0.paper.paper_markup = ch.value;
              const cost = parseFloat(c0.paper.paper_cost) || 0;
              const rc2 = parseFloat(c0.paper.paper_roll_cut) || 0;
              c0.paper.paper_sale = (cost * (1 + parseFloat(ch.value) / 100) + rc2).toFixed(2);
            }
            break;
          case 'width': if (c0) c0.packaging_size.width = ch.value; break;
          case 'length': if (c0) c0.packaging_size.length = ch.value; break;
          case 'depth': if (c0) c0.packaging_size.depth = ch.value; break;
          case 'box_type':
            if (c0) setCompBoxType(0, ch.value);
            break;
          case 'component_type':
            if (c0) c0.component_type = parseInt(ch.value) || 1;
            break;
          case 'flute_type':
            if (c0) {
              if (!c0.corrugated) c0.corrugated = {};
              c0.corrugated.flute_type = ch.value;
            }
            break;
          case 'component_name': if (c0) c0.component_name = ch.value; break;
          case 'coating':
            if (c0) {
              if (ch.value === 'remove') {
                c0.addon = c0.addon.filter(a => a.type !== 'coating');
              } else if (ch.value === 'add') {
                const ad = freshAddon('coating'); ad.name = 'Coating'; c0.addon.push(ad);
              } else {
                let coatAd = c0.addon.find(a => a.type === 'coating');
                if (!coatAd) { coatAd = freshAddon('coating'); coatAd.name = 'Coating'; c0.addon.push(coatAd); }
                matchCoatingType(coatAd, ch.value);
              }
            }
            break;
          case 'foil_stamp':
            if (c0) {
              if (ch.value === 'remove') {
                c0.addon = c0.addon.filter(a => a.type !== 'foilstamp');
                c0.foil_stamp = false;
              } else {
                c0.foil_stamp = true;
                let foilAd = c0.addon.find(a => a.type === 'foilstamp');
                if (!foilAd) { foilAd = freshAddon('foilstamp'); foilAd.name = 'Foil stamp'; c0.addon.push(foilAd); }
                if (ch.value !== 'add') matchFoilColor(foilAd, ch.value);
              }
            }
            break;
          case 'emboss': if (c0) c0.emboss = ch.value === true || ch.value === 'true'; break;
          case 'deboss': if (c0) c0.deboss = ch.value === true || ch.value === 'true'; break;
          case 'delivery':
            if (!f.delivery[0]) f.delivery[0] = freshDelivery();
            f.delivery[0].destinationName = ch.value;
            f.delivery[0].province = ch.value;
            break;
          case 'run_on_percent':
            f.run_on_percent = ch.value;
            autoCalcRunOn();
            break;
        }
        changed.push(ch.label || `${ch.field} → ${ch.value}`);
      } catch (e) { /* skip failed field */ }
    }

    if (changed.length > 0) {
      renderForm();
      return '✅ Pornchai AI เข้าใจแล้วครับ:\n' + changed.map(c => '• ' + c).join('\n');
    }

    return 'อืม ผมพยายามเข้าใจแล้วแต่ยังไม่แน่ใจครับ 😅 ลองบอกอีกทีได้ไหมครับ?';
  } catch (e) {
    // AI API ไม่ตอบ → fallback to help
    return `ขออภัยครับ ไม่เข้าใจคำสั่ง 🤔

ลองพิมพ์แบบนี้:
• "จำนวน 3000"
• "สี 4/0"
• "กระดาษ AC 300 gsm"
• "ขนาด 200x150x50"
• "reprint"
• "foil สีเงิน"

หรือส่ง spec ใหม่ได้เลยครับ!`;
  }
}

// Programmatically send a chat message (for quick-action buttons)
function sendChatText(text) {
  const input = $('chatInput');
  if (input) {
    input.value = text;
    // Make sure chat panel is visible
    const panel = $('chatPanel');
    if (panel && !panel.classList.contains('open')) toggleChat();
    sendChat();
  }
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
}

// Auto-resize
document.addEventListener('DOMContentLoaded', () => {
  $('chatInput')?.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });
});

// File upload
function uploadFile() { $('fileInput').click(); }
function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  addChatMsg(`[แนบไฟล์: ${file.name}]`, 'user');
  // For now, tell the user about file support
  addChatMsg(`ได้รับไฟล์ ${file.name} ครับ\nขณะนี้ระบบกำลังพัฒนาการอ่านไฟล์อัตโนมัติ\nกรุณาพิมพ์ข้อมูลจาก spec มาได้เลยครับ`, 'agent');
  e.target.value = '';
}

// ============================================================
// AGENT BRIDGE - Extract structured data from agent responses
// ============================================================
function extractRFQData(reply) {
  const match = reply.match(/<!--\s*RFQ_DATA_START\s*-->([\s\S]*?)<!--\s*RFQ_DATA_END\s*-->/);
  if (!match) return null;
  try { return JSON.parse(match[1].trim()); } catch { return null; }
}

async function applyAgentData(data) {
  if (!data || typeof data !== 'object') return;

  // === Detect "fresh structured spec" → reset form before apply ===
  // ถ้า user วาง spec ใหม่ทั้งก้อน (parser output มี components + ตัวบ่งชี้หัวงาน เช่น job_name/qty/customer)
  // ให้ reset ฟอร์มก่อน apply เพื่อไม่ให้ฟิลด์เก่า (foil/emboss/coating/addon ฯลฯ) จาก spec ก่อนหน้าค้างทับ
  // ระบบเดิม merge ทับ → spec A มี foil, spec B ไม่มี foil → ฟอร์มยังโผล่ foil ค้างจาก A (bug)
  const isFreshStructuredSpec =
    Array.isArray(data.components) && data.components.length > 0 &&
    (data.job_name || data.qty || data.customer_search || data.customer || data.f_codes);
  if (isFreshStructuredSpec && State.form && State._formTouched) {
    const prevMode = State.formMode || 'create';
    State.form = freshForm();
    State.formMode = prevMode;
    State.fieldSource = {};
    State._missingFields = [];
    State._lastBizActions = [];
    console.log('[applyAgentData] Fresh structured spec detected → form reset');
  }

  State._formTouched = true;

  if (!State.form) {
    State.form = freshForm();
    State.formMode = 'create';
  }

  const f = State.form;
  const src = State.fieldSource || {};
  State.fieldSource = src;

  // === 1. JOB NAME ===
  if (data.job_name) { f.job_name = data.job_name; src.job_name = 'ai'; }

  // === 2. CUSTOMER (search or direct) ===
  if (data.customer_search) {
    // Auto-search customer via autocomplete (await to ensure it's done before checkMissingFields)
    await autoSearchCustomer(data.customer_search);
    src.customer = 'ai';
  } else if (data.customer) {
    if (typeof data.customer === 'string') f.customer.customer_name = data.customer;
    else Object.assign(f.customer, data.customer);
    src.customer = 'ai';
  }
  if (data.new_customer !== undefined) {
    f.new_customer = data.new_customer;
    if (data.new_customer) {
      f.customer = { customer_id: 'C9999998', customer_name: 'C9999998: ลูกค้าใหม่' };
      f.credit_term = 'มัดจำ 100% ก่อนพิมพ์';
      src.customer = 'ai';
    }
  }
  // Default to new customer if no customer data
  if (!data.customer && !data.customer_search && data.new_customer === undefined) {
    f.new_customer = true;
    f.customer = { customer_id: 'C9999998', customer_name: 'C9999998: ลูกค้าใหม่' };
    f.credit_term = 'มัดจำ 100% ก่อนพิมพ์';
    src.customer = 'ai';
  }

  // === 3. AE / ESTIMATOR ===
  if (data.ae_search) {
    await autoSearchAE(data.ae_search);
    src.ae = 'ai';
  } else if (data.ae) {
    if (typeof data.ae === 'string') f.ae.emp_name = data.ae;
    else Object.assign(f.ae, data.ae);
    src.ae = 'ai';
  }
  if (data.estimator) {
    if (typeof data.estimator === 'string') f.estimator.emp_name = data.estimator;
    else Object.assign(f.estimator, data.estimator);
  }

  // === 4. PRINT/INK TYPE ===
  if (data.ink_type) f.ink_type = data.ink_type;
  if (data.print_type) f.print_type = data.print_type;
  if (data.flexo_size) f.flexo_size = data.flexo_size;

  // === 5. CHECKBOXES ===
  if (data.profit_sharing !== undefined) f.profit_sharing = data.profit_sharing;
  if (data.is_reprinted !== undefined) f.is_reprinted = data.is_reprinted;
  if (data.is_use_previous_plate !== undefined) f.is_use_previous_plate = data.is_use_previous_plate;
  if (data.is_loss !== undefined) f.is_loss = data.is_loss;
  if (data.is_diecut !== undefined) f.is_diecut = data.is_diecut;

  // === 6. CREDIT TERM ===
  if (data.credit_term_id) f.credit_term_id = data.credit_term_id;
  if (data.credit_term_name) f.credit_term_name = data.credit_term_name;

  // === 7. QTY ===
  if (data.qty) {
    if (Array.isArray(data.qty)) {
      f.qty = data.qty.map(q => String(q));
      data.qty.forEach((q, i) => { if (q) src['qty.' + i] = 'ai'; });
    } else if (typeof data.qty === 'object') {
      for (let i = 1; i <= 5; i++) {
        if (data.qty['qty' + i]) { f.qty[i - 1] = String(data.qty['qty' + i]); src['qty.' + (i - 1)] = 'ai'; }
      }
    } else {
      f.qty = [String(data.qty)]; src['qty.0'] = 'ai';
    }
  }
  if (data.run_on_percent) f.run_on_percent = data.run_on_percent;

  // === 8. EDITION (multi-edition qty with names) ===
  // Multi-F = หลายแบบ/สี ใช้บล็อค+เพลทเดียวกัน สั่งรวมทีเดียว
  // === 8. EDITION (multi-F) ===
  // edition_names = ชื่อ F-code แต่ละแบบ (เช่น "สีฟ้า 319", "สีชมพู 186")
  // edition_qtys = จำนวนแต่ละ F (อาจไม่มี — ต้องให้ user กรอกเอง)
  if (data.edition_names && Array.isArray(data.edition_names) && data.edition_names.length > 0) {
    f.has_multi_f = true;
    const hasQtys = data.edition_qtys && data.edition_qtys.length > 0;
    f.f_data = data.edition_names.map((name, i) => {
      const fd = freshFData();
      fd.f_code = name;
      if (hasQtys) {
        fd.qty = String(data.edition_qtys[i] || '');
        fd.total_qty = String(data.edition_qtys[i] || '');
      }
      return fd;
    });
    if (hasQtys) {
      const edTotal = data.edition_qtys.reduce((sum, q) => sum + (parseInt(q) || 0), 0);
      f.f_total_qty = edTotal;
      f.qty = [String(data.edition_total || edTotal)];
      src['qty.0'] = 'ai';
    }
    // ถ้าไม่มี edition_qtys → qty มาจาก "จำนวนผลิตรวม" (ถ้ามี) แต่แต่ละ F ว่าง → Fill Flow จะถาม
  }

  // === 8b. F-CODES (from structured spec — e.g. F015731, F015732) ===
  if (data.f_codes && Array.isArray(data.f_codes) && data.f_codes.length > 0) {
    // ติ๊ก Multi-F เฉพาะเมื่อมี unique F-code 2 ตัวขึ้นไป
    const uniqueFCodes = [...new Set(data.f_codes.map(fc => fc.f_code))];
    f.has_multi_f = uniqueFCodes.length >= 2;
    f.f_data = data.f_codes.map(fc => {
      const fd = freshFData();
      fd.f_code = fc.f_code || '';
      fd.colors_out = fc.colors_out || '';
      fd.colors_in = fc.colors_in || '0';
      return fd;
    });
    // If no separate qty specified, keep f_data qty empty for user to fill
  }

  // === 9. COMPONENTS ===
  if (data.components && Array.isArray(data.components)) {
    f.components = data.components.map((c, i) => {
      src['comp.' + i + '.name'] = 'ai';
      const base = freshComponent();

      // Component name
      base.component_name = c.component_name || c.name || '';

      // Component type (1=ไม่ประกบ, 2=ประกบลูกฟูก, 3=เฉพาะลูกฟูก)
      base.component_type = c.component_type || 1;

      // Box type — ไม่เลือกให้อัตโนมัติ เก็บไว้ใน _pendingTemplate แทน
      let suggestedTypeId = '';
      let suggestedTypeName = '';
      let suggestedConfidence = c._box_type_confidence || 'medium';

      // ลอง detect จาก job_name + component_name ก่อน
      // ⚠️ HIGH CONFIDENCE เท่านั้น — ถ้า spec ไม่บอก template ชัดเจน อย่าเดา
      // เช่น "Tray" ตัวเดียวมีได้หลาย template (5/6/7) → ไม่เดา ให้ user เลือกเอง
      const detectText = ((base.job_name || '') + ' ' + (c.component_name || '') + ' ' + (base.component_name || '')).toLowerCase();
      console.log('[Template Detect] text:', detectText, '| job:', base.job_name, '| comp:', c.component_name, base.component_name);
      const TEMPLATE_DETECT = [
        // เฉพาะคำที่ระบุ template ชัดเจน 100% — ห้ามเดาจากคำกลาง ๆ
        { p: /simple.?tray|double.?glue.?side.?wall/i, id: '5', name: 'Double Glue Side Wall (Simple Tray)' },
        { p: /frame.?vue/i, id: '6', name: 'Frame-Vue Tray' },
        { p: /four.?corner|beer.?tray|เบ(?:เน|น)โตะ/i, id: '7', name: 'Four Corner Beers Tray' },
        { p: /\bsleeve\b|สลีฟ|wrap.?around|wrapper|แรปเปอร์/i, id: '9', name: 'Sleeve' },
        { p: /gable.?top/i, id: '8', name: 'Gable Top' },
        { p: /pillow.?box/i, id: '10', name: 'Pillow Box' },
        { p: /seal.?end|ซีลเอ็น|ซีลเอนด์/i, id: '11', name: 'Seal End' },
        { p: /reverse.?tuck|ฝาสลับ|ฝาเสียบ/i, id: '1', name: 'Reverse Tuck End' },
        { p: /straight.?tuck|ฝาตรง/i, id: '2', name: 'Straight Tuck End' },
        { p: /ttslb|snap.?lock|ก้นขัด|หูขัด|\(2tt\)/i, id: '3', name: 'TTSLB' },
        { p: /ttab|auto.?bottom|ออโต้.*ทากาว|\(1tt\)/i, id: '4', name: 'TTAB' },
      ];
      for (const td of TEMPLATE_DETECT) {
        if (td.p.test(detectText)) {
          suggestedTypeId = td.id;
          suggestedTypeName = td.name;
          suggestedConfidence = 'high';
          console.log('[Template Detect] MATCHED:', td.name, 'id=' + td.id);
          break;
        }
      }
      // เพิ่ม safeguard: log ทุกครั้งที่ box_type.type_id ถูกตั้ง
      if (suggestedTypeId) {
        console.log('[Template Detect] Final suggestedTypeId=' + suggestedTypeId + ' for component "' + (c.component_name || 'unnamed') + '"');
      }

      // ถ้า detect ไม่ได้จาก keyword → ใช้จาก parser (แต่ถ้าเป็น 12=Custom ไม่แนะนำ)
      if (!suggestedTypeId) {
        if (c.box_type_id && String(c.box_type_id) !== '12') {
          suggestedTypeId = String(c.box_type_id);
          const btInfo = (State.masters?.boxtemplate_info || []).find(b => String(b.type_id) === String(c.box_type_id));
          if (btInfo) suggestedTypeName = btInfo.type_name || '';
        } else if (c.box_type && typeof c.box_type === 'object' && c.box_type.type_id && String(c.box_type.type_id) !== '12') {
          suggestedTypeId = String(c.box_type.type_id);
          suggestedTypeName = c.box_type.type_name || '';
        }
        // ถ้ายังไม่มี → ไม่แนะนำ (ปล่อยว่าง ให้ user เลือกเอง)
      }

      // เก็บ _pendingTemplate — AI แนะนำแต่ไม่ตั้ง
      base._pendingTemplate = {
        type_id: suggestedTypeId,
        type_name: suggestedTypeName,
        confidence: suggestedConfidence,
      };

      // Packaging size — ใส่ลงฟอร์มเลยทันที (ไม่ต้องรอกดปุ่ม)
      if (c.packaging_size) {
        const ps = {
          width: c.packaging_size.width ? String(c.packaging_size.width) : '',
          length: c.packaging_size.length ? String(c.packaging_size.length) : '',
          depth: c.packaging_size.depth != null ? String(c.packaging_size.depth) : '',
          glue_flap: c.packaging_size.glue_flap ? String(c.packaging_size.glue_flap) : '',
          tuck_flap: c.packaging_size.tuck_flap ? String(c.packaging_size.tuck_flap) : '',
          dust_flap: c.packaging_size.dust_flap ? String(c.packaging_size.dust_flap) : '',
        };
        // Apply directly to packaging_size (auto-fill)
        if (ps.width || ps.length) {
          base.packaging_size = { ...base.packaging_size, ...ps };
        }
        // Keep as backup
        base._pendingSize = ps;
      }

      // Paper — use sub-code directly from DB (e.g. "Dup GBB", "AC C1s")
      const paperCode = c.paper?.paper_code || c.paper_code || '';
      const paperGram = String(c.paper?.paper_gram || c.paper_gram || '');
      base.paper.paper_code = paperCode;
      const subMatch = (State.masters._paper_sub_codes || []).find(sc => sc.code === paperCode);
      base.paper.paper_type = c.paper?.paper_type || subMatch?.type || paperCode;
      base.paper.paper_gram = paperGram;
      // Map import/domestic to Thai labels
      let paperName = c.paper?.paper_name || 'ในประเทศ';
      if (paperName === 'import') paperName = 'ต่างประเทศ';
      else if (paperName === 'domestic') paperName = 'ในประเทศ';
      base.paper.paper_name = paperName;
      base.paper.paper_thickness = c.paper?.paper_thickness || '';
      base.paper.is_custom = c.paper?.is_custom || false;

      // Preserve parsed paper cost/markup/source to apply after DB auto-fill
      const parsedPaperCost = c.paper?.paper_cost;
      const parsedPaperMarkup = c.paper?.paper_markup;
      const parsedPaperSourceId = c.paper?.paper_source_id;

      // Auto-load paper GSM options + auto-fill brand/cost from DB
      if (paperCode) {
        loadPaperGsmOptions(paperCode).then(() => {
          autoFillPaperFromDB(base.paper, base.paper.paper_name === 'ต่างประเทศ');
          // Override with parsed values if provided (user-specified takes priority over DB)
          if (parsedPaperCost) base.paper.paper_cost = String(parsedPaperCost);
          if (parsedPaperMarkup) base.paper.paper_markup = String(parsedPaperMarkup);
          if (parsedPaperSourceId) base.paper.paper_source_id = parsedPaperSourceId;
          // Recalc sale price with overridden cost/markup
          const cost = parseFloat(base.paper.paper_cost) || 0;
          const markup = parseFloat(base.paper.paper_markup) || 10;
          const rollCut = parseFloat(base.paper.paper_roll_cut) || 0;
          if (cost > 0) {
            base.paper.paper_sale = (cost * (1 + markup / 100) + rollCut).toFixed(2);
            const gram = parseFloat(base.paper.paper_gram) || 0;
            if (gram > 0) base.paper.paper_bkg = (cost * 1000 / gram).toFixed(2);
          }
          renderForm();
        });
      }

      // Color
      if (c.color && typeof c.color === 'object') {
        base.color.outside = c.color.outside !== undefined ? String(c.color.outside) : '';
        base.color.inside = c.color.inside !== undefined ? String(c.color.inside) : '0';
        if (c.color.f_code) base.color.f_code = c.color.f_code;
        if (c.color.is_special_ink) base.color.is_special_ink = true;
        if (c.color.black_printing_outside) base.color.black_printing_outside = true;
        if (c.color.black_printing_inside) base.color.black_printing_inside = true;
        if (Array.isArray(c.color.special_ink) && c.color.special_ink.length > 0) {
          base.color.is_special_ink = true;
          base.color.special_ink = c.color.special_ink.map(ink => ({
            ink_color: ink.ink_color || ink.color || '',
            ink_type: ink.ink_type || ink.type || 'หมึกพิเศษธรรมดา',
            printing_style: ink.printing_style || ink.print_style || 'ตีพื้น',
            paper_code: ink.paper_code || '',
          }));
        }
      } else if (typeof c.color === 'string') {
        const colorMatch = c.color.match(/(\d+)\s*\/\s*(\d+)/);
        if (colorMatch) {
          base.color.outside = colorMatch[1];
          base.color.inside = colorMatch[2];
        }
      }
      // Special ink at component level (alternative location)
      if (Array.isArray(c.special_ink) && c.special_ink.length > 0 && !base.color.is_special_ink) {
        base.color.is_special_ink = true;
        base.color.special_ink = c.special_ink.map(ink => ({
          ink_color: ink.ink_color || ink.color || '',
          ink_type: ink.ink_type || ink.type || 'หมึกพิเศษธรรมดา',
          printing_style: ink.printing_style || ink.print_style || 'ตีพื้น',
          paper_code: ink.paper_code || '',
        }));
      }

      // F-detail (F codes)
      if (c.f_detail) base.f_detail = c.f_detail;

      // Addon array (coating, foilstamp, emboss, deboss)
      base.addon = [];
      if (c.addon && Array.isArray(c.addon)) {
        c.addon.forEach(a => {
          const addonType = normalizeAddonType(a.type);
          const ad = freshAddon(addonType);
          ad.type = addonType;
          ad.name = a.detail || a.name || getAddonDefaultName(addonType);

          if (addonType === 'coating') {
            // Match coating type from master data
            if (a.coating_type_name) {
              matchCoatingType(ad, a.coating_type_name);
            } else if (a.detail) {
              matchCoatingType(ad, a.detail);
            }
            ad.info.side = a.side || 1;
          }

          // Store F-code assignments from parser (e.g. [F001, F002, F003])
          if (a._fCodes && a._fCodes.length > 0) {
            ad.f_codes = [...a._fCodes];
          }

          // === Foil stamp: parse color/code/sizes from detail ===
          if (addonType === 'foilstamp') {
            const detail = a.detail || '';
            // Parse color from detail text (Thai color names)
            const colorMatch = detail.match(/(ชมพู(?:อมม่วง)?|ทอง(?:กลาง(?:ด้าน)?|เข้ม|อ่อน(?:ด้าน)?|แดง(?:อ่อน)?|ชมพู)?|เงิน(?:เงา|ด้าน)?|แดง|น้ำเงิน|สีน้ำเงิน|ดำ|ขาว|โฮโลแกรม|ฟ้า|ใส|ชมพูด้าน)/i);
            if (colorMatch) {
              // Use matchFoilColor to get exact master data color + price info
              matchFoilColor(ad, colorMatch[1]);
            } else if (a.foil_color) {
              matchFoilColor(ad, a.foil_color);
            } else {
              // Try matching full detail as fallback
              matchFoilColor(ad, detail);
            }
            // Parse foil code from parentheses — e.g. "(61-Y-1)" or "(21-i-3 : OSP-213)"
            const codeMatch = detail.match(/\(([^)]+)\)/);
            if (codeMatch) {
              const codeText = codeMatch[1].trim();
              ad.info.foil_code_text = codeText;
              // Match against master data codes for this color
              const foils = State.masters['foilstamp_info'] || [];
              const exactCode = foils.find(f => f.code === codeText);
              if (exactCode) {
                ad.info.foil_code = exactCode.code;
                ad.info.foil_color = exactCode.color_th || ad.info.foil_color;
                ad.info.foil_roll_price = exactCode.roll_price;
                ad.info.foil_width = exactCode.width;
                ad.info.foil_length = exactCode.length;
              } else {
                ad.info.foil_code = codeText;
              }
            }
            // Parse size from detail — e.g. '1"x2"', '2"×3"'
            const szMatch = detail.match(/(\d+(?:\.\d+)?)\s*["""\u201C\u201D']?\s*[x×]\s*(\d+(?:\.\d+)?)/i);
            const parsedSize = szMatch ? { w: szMatch[1], l: szMatch[2] } : null;
            // Merge same-color foil stamps into one addon with multiple sizes
            const sameColor = ad.info?.foil_color && base.addon.find(ea => ea.type === 'foilstamp' && ea.info?.foil_color === ad.info.foil_color);
            if (sameColor) {
              if (!sameColor.info.sizes) sameColor.info.sizes = [];
              if (parsedSize) sameColor.info.sizes.push(parsedSize);
              // Merge f_codes from this addon into existing
              if (ad.f_codes?.length) {
                if (!sameColor.f_codes) sameColor.f_codes = [];
                ad.f_codes.forEach(fc => { if (!sameColor.f_codes.includes(fc)) sameColor.f_codes.push(fc); });
              }
              return; // skip pushing duplicate addon
            } else {
              if (parsedSize) ad.info.sizes = [parsedSize];
              else ad.info.sizes = [];
            }
          }

          // === Emboss/Deboss: parse sizes from detail ===
          if (addonType === 'emboss' || addonType === 'deboss') {
            const detail = a.detail || '';
            const szMatch = detail.match(/(\d+(?:\.\d+)?)\s*["""\u201C\u201D']?\s*[x×]\s*(\d+(?:\.\d+)?)/i);
            const parsedSize = szMatch ? { w: szMatch[1], l: szMatch[2] } : null;
            // Merge multiple sizes into single emboss/deboss addon
            const existing = base.addon.find(ea => ea.type === addonType);
            if (existing) {
              if (!existing.info.sizes) existing.info.sizes = [];
              if (parsedSize) existing.info.sizes.push(parsedSize);
              // Merge f_codes
              if (ad.f_codes?.length) {
                if (!existing.f_codes) existing.f_codes = [];
                ad.f_codes.forEach(fc => { if (!existing.f_codes.includes(fc)) existing.f_codes.push(fc); });
              }
              return; // skip pushing duplicate
            } else {
              ad.info.sizes = parsedSize ? [parsedSize] : [];
            }
          }

          base.addon.push(ad);
        });
      } else {
        // Legacy format
        if (c.coating && c.coating !== 'none') {
          const ad = freshAddon('coating');
          ad.name = typeof c.coating === 'string' ? c.coating : 'Coating';
          base.addon.push(ad);
        }
        if (c.foil_stamp) {
          const ad = freshAddon('foilstamp');
          ad.name = typeof c.foil_stamp === 'string' ? c.foil_stamp : 'Foil stamp';
          base.addon.push(ad);
        }
        if (c.emboss) {
          const ad = freshAddon('emboss');
          ad.name = 'Emboss';
          base.addon.push(ad);
        }
        if (c.deboss) {
          const ad = freshAddon('deboss');
          ad.name = 'Deboss';
          base.addon.push(ad);
        }
      }

      // Block cost (ค่าบล็อค)
      if (c.block_cost) base.block_cost = String(c.block_cost);

      // Corrugated (when component_type = 2 or 3)
      if (c.corrugated && (base.component_type === 2 || base.component_type === 3)) {
        base.corrugate_type = base.component_type === 2 ? 'laminate' : 'corrugated_only';
        if (c.corrugated.flute_type) base.corrugated.flute_type = c.corrugated.flute_type;
        if (c.corrugated.color) base.corrugated.flute_side = c.corrugated.color;
        if (c.corrugated.layer) base.corrugated.layer = c.corrugated.layer;
        if (c.corrugated.thickness) base.corrugated.thickness = String(c.corrugated.thickness);
        if (c.corrugated.cost_price) base.corrugated.cost_price = String(c.corrugated.cost_price);
        if (c.corrugated.pricing_unit) base.corrugated.pricing_unit = c.corrugated.pricing_unit;
        // Grade + Gram (จาก server parser)
        if (c.corrugated.grade?.length) {
          base.corrugated.grade = [...c.corrugated.grade];
          // Pad to 5 slots
          while (base.corrugated.grade.length < 5) base.corrugated.grade.push('');
        }
        if (c.corrugated.gram?.length) {
          base.corrugated.gram = c.corrugated.gram.map(g => parseInt(g) || 0);
          while (base.corrugated.gram.length < 5) base.corrugated.gram.push(0);
        }
      }

      // Packing
      if (c.packing_detail) {
        base.packing_detail = c.packing_detail;
        const pk = freshPacking();
        pk.name = c.packing_detail;
        // Extract qty_per_pack from text like "kraftwrap 250 pcs/pack" or "kraftwrap 1,250 pcs/pack"
        const qppMatch = c.packing_detail.match(/kraft\w*\s*(\d[\d,]*)\s*(?:pcs?|ชิ้น)\s*[/\/]\s*(?:pack|แพ็ค)/i)
                      || c.packing_detail.match(/(\d[\d,]*)\s*(?:pcs?|ชิ้น)\s*[/\/]\s*(?:pack|แพ็ค)/i);
        if (qppMatch) pk.qty_per_pack = parseInt(qppMatch[1].replace(/,/g, ''));
        // Extract qty_per_carton from text like "carton 1,785 pcs/carton"
        const qpcMatch = c.packing_detail.match(/carton\s*(\d[\d,]*)\s*(?:pcs?|ชิ้น)\s*[/\/]\s*(?:carton|กล่อง|กล่องลูกฟูก)/i);
        if (qpcMatch) base.qty_per_carton = parseInt(qpcMatch[1].replace(/,/g, ''));
        // Extract qty_per_paperband from text like "paperband 50 pcs/band"
        const qpbMatch = c.packing_detail.match(/paper\s*band\s*(\d[\d,]*)\s*(?:pcs?|ชิ้น)\s*[/\/]\s*(?:band|แบนด์|รัด)/i);
        if (qpbMatch) base.qty_per_paperband = parseInt(qpbMatch[1].replace(/,/g, ''));
        // Auto-derive packs_per_carton if both pack and carton qty available
        if (base.qty_per_carton && pk.qty_per_pack) {
          base.packs_per_carton = Math.round(base.qty_per_carton / pk.qty_per_pack);
        }
        base.packing = [pk];
      } else if (c.packing) {
        base.packing = c.packing;
      }

      if (c.comp_process) base.comp_process = c.comp_process;
      if (c.paper_tolerance) base.paper_tolerance = c.paper_tolerance;

      return base;
    });
  }

  // === 10. PROCESSES ===
  // Other process (ค่าติดกาว, ประกาว, etc.)
  if (data.other_process && Array.isArray(data.other_process)) {
    f.other_process = data.other_process.map(p => ({
      name: p.name || '',
      detail: p.detail || '',
      cost: p.cost || '',
      fixed_price: p.fixed_price !== undefined ? p.fixed_price : true
    }));
  }
  // Handwork
  if (data.handwork_process && Array.isArray(data.handwork_process)) {
    f.handwork_process = data.handwork_process.map(p => ({
      name: p.name || '',
      detail: p.detail || '',
      cost: p.cost || '',
      fixed_price: p.fixed_price !== undefined ? p.fixed_price : true
    }));
  }
  // Outsource
  if (data.outsource && Array.isArray(data.outsource)) {
    f.outsource = data.outsource.map(p => ({
      name: p.name || '',
      detail: p.detail || '',
      cost: p.cost || '',
      fixed_price: p.fixed_price !== undefined ? p.fixed_price : true
    }));
  }
  // Materials
  if (data.materials && Array.isArray(data.materials)) {
    f.materials = data.materials.map(p => ({
      name: p.name || '',
      cost: p.cost || '',
      fixed_qty: p.fixed_qty !== undefined ? p.fixed_qty : true,
      qty: p.qty || ''
    }));
  }
  // Other items
  if (data.other_items && Array.isArray(data.other_items)) {
    f.other_items = data.other_items.map(p => ({
      name: p.name || '',
      cost: p.cost || '',
      fixed_qty: p.fixed_qty !== undefined ? p.fixed_qty : true,
      qty: p.qty || ''
    }));
  }

  // Legacy process array
  if (data.process && Array.isArray(data.process)) {
    data.process.forEach(p => {
      const type = p.type || '';
      if (type === 'coating' || type === 'hotfoil' || type === 'foil' || type === 'emboss') {
        if (f.components.length > 0) {
          const addonType = type === 'hotfoil' ? 'foilstamp' : type;
          const a = freshAddon(addonType);
          a.name = p.name || '';
          f.components[0].addon.push(a);
        }
      } else {
        f.other_process.push({ name: p.name || '', detail: '', cost: '', fixed_price: true });
      }
    });
  }
  if (data.process_info) Object.assign(f.process_info, data.process_info);

  // === 11. DELIVERY ===
  if (data.delivery_province) {
    if (f.delivery.length === 0) f.delivery.push(freshDelivery());
    // Validate: must look like a province name (not SIZE/spec text)
    const rawProv = data.delivery_province;
    const looksLikeProvince = rawProv.length <= 30 && !/SIZE|TITLE|PAPER|COMPONENT|PRINT|OTHER|\d+\s*x\s*\d+/i.test(rawProv);
    if (looksLikeProvince) {
      // Look up from local master data
      const delivInfo = State.masters['delivery_rate_info'] || [];
      const destNames = [...new Set(delivInfo.map(d => d.name).filter(Boolean))];
      const matched = destNames.find(n => n === rawProv) || destNames.find(n => n.includes(rawProv) || rawProv.includes(n));
      if (matched) {
        f.delivery[0].destinationName = matched;
        f.delivery[0].province = matched;
        const rateEntry = delivInfo.find(d => d.name === matched);
        if (rateEntry) f.delivery[0].destinationId = rateEntry.destination_id || '';
      } else {
        // Valid-looking text but not in DB — set as-is (user can correct)
        f.delivery[0].destinationName = rawProv;
        f.delivery[0].province = rawProv;
      }
    }
  }
  // Delivery date
  if (data.delivery_date && f.delivery.length > 0) {
    f.delivery[0].dueDate = data.delivery_date;
  }
  if (data.delivery && Array.isArray(data.delivery)) {
    f.delivery = data.delivery.map(d => {
      const base = freshDelivery();
      base.round = d.round || '';
      base.destinationId = d.destinationId || d.destination_id || '';
      base.destinationName = d.destinationName || d.destination || '';
      base.province = d.province || '';
      base.dueDate = d.dueDate || d.delivery_date || '';
      base.net_weight = d.net_weight || '';
      base.split_delivery = d.split_delivery || false;
      return base;
    });
  }

  // === 12. OTHER COSTS / PRICE DIFF / GIFTS ===
  if (data.otherCost) f.otherCost = data.otherCost;
  if (data.priceDiff) f.priceDiff = data.priceDiff;
  if (data.customer_gift) f.customer_gift = data.customer_gift;
  if (data.customer_margin !== undefined) f.customer_margin = data.customer_margin;
  if (data.customer_margin_value) f.customer_margin_value = data.customer_margin_value;

  // === 13. REMARKS ===
  if (data.remark !== undefined) f.remark = data.remark;
  if (data.remark_ae !== undefined) f.remark_ae = data.remark_ae;

  // === 14. SMART DEFAULTS — AI fills missing data intelligently ===
  const c0 = f.components[0];
  if (c0) {
    // Paper markup: default 10% domestic, 13% import
    if (c0.paper?.paper_code && !c0.paper.paper_markup) {
      c0.paper.paper_markup = (c0.paper.paper_source_id === '2' || c0.paper.paper_name === 'import' || c0.paper.paper_name === 'ต่างประเทศ') ? '13' : '10';
    }

    // Paper source: default ในประเทศ if not specified
    if (c0.paper?.paper_code && !c0.paper.paper_source_id) {
      c0.paper.paper_source_id = '1';
      c0.paper.paper_name = c0.paper.paper_name || 'ในประเทศ';
    }

    // Block cost: calc.js auto-lookup จาก blockdiecut_info ตามขนาด layout อัตโนมัติ
    // ไม่ต้อง set block_cost ที่นี่ — ให้ calcAfterPressCost() จัดการเอง

    // Packing: extract from packing_detail if available
    // qty_per_pack ไม่ hardcode จาก spec — ให้ calcPackingCost คำนวณจาก thickness/weight
    if (c0.packing_detail && c0.packing.length === 0) {
      if (/kraft/i.test(c0.packing_detail)) {
        c0.packing.push({ type: 'kraftwrap', name: 'kraftwrap' });
      }
      if (/paperband|รัดกระดาษ/i.test(c0.packing_detail)) {
        c0.packing.push({ type: 'paperband', name: 'paperband' });
      }
      if (/carton|กล่องลูกฟูก/i.test(c0.packing_detail)) {
        c0.packing.push({ type: 'carton', name: 'carton' });
      }
      if (/pallet|พาเลท/i.test(c0.packing_detail)) {
        c0.packing.push({ type: 'pallet', name: 'pallet' });
      }
    }

    // Component name: default 'box' if has box_type
    if (!c0.component_name && c0.box_type?.type_id) {
      c0.component_name = 'box';
    }

    // Component type: default 1 (ไม่ประกบลูกฟูก)
    if (!c0.component_type) c0.component_type = 1;
  }

  // Ink type: default 'conventional' if not specified
  if (!f.ink_type) f.ink_type = 'conventional';

  // Print type: default 'Offset' if not specified
  if (!f.print_type) f.print_type = 'Offset';

  // Delivery: if none specified, default with min delivery cost 1500 THB
  if (f.delivery.length === 0) {
    f.delivery.push(freshDelivery());
  }

  // === Business Rules — อุดช่องว่างตามกฎโรงพิมพ์ ===
  const bizResult = await ensureEstimateReady();

  // === RENDER ===
  renderForm();
  showView('viewForm');
  setTopBar('สร้าง RFQ ใหม่', 'Agent กรอกข้อมูลให้แล้ว - ตรวจสอบและแก้ไขได้');

  // Build summary of what was filled
  const filled = [];
  if (f.job_name) filled.push('ชื่องาน');
  if (f.customer?.customer_name?.trim()) filled.push('ลูกค้า');
  if (f.qty.some(q => q)) filled.push('จำนวน ' + f.qty.filter(q => q).length + ' รายการ');
  f.components.forEach((c, i) => {
    const parts = [];
    if (c.component_name) parts.push(c.component_name);
    if (c.paper.paper_code) parts.push(c.paper.paper_code + ' ' + c.paper.paper_gram + 'gsm');
    if (c.color.outside) parts.push(c.color.outside + '/' + c.color.inside + ' สี');
    if (c.addon.length) parts.push(c.addon.length + ' addon');
    if (c.component_type === 2) parts.push('ประกบลูกฟูก');
    filled.push('Component ' + (i + 1) + ': ' + parts.join(', '));
  });
  if (f.other_process.length) filled.push('Other Process: ' + f.other_process.length + ' รายการ');
  if (f.has_multi_f) filled.push('Multi-edition: ' + (f.f_data || []).length + ' แบบ');

  // Check required fields
  const missing = checkMissingFields(f);

  // No verbose chat message — sendChat auto-flow handles summary
  // Just log for debugging
  console.log('[ensureEstimateReady] filled:', filled.length, 'missing:', missing.length);

  // Show prominent warning banner on form if missing fields
  State._missingFields = missing;
  renderForm(); // Re-render to show the warning banner

  if (missing.length > 0) {
    toast('ข้อมูลยังไม่ครบ ' + missing.length + ' รายการ', 'warning');
    // No buttons — fill flow will start automatically from sendChat or user can fill form manually
  } else {
    toast('Agent กรอกข้อมูลครบแล้ว!', 'success');
  }
}

// Auto-fill missing fields with sensible defaults
function autoFillMissing() {
  if (!State.form) return;
  const f = State.form;
  const filled = [];

  // Header defaults
  if (!f.customer?.customer_name?.trim() && !f.new_customer) {
    f.new_customer = true;
    f.customer = { customer_id: 'C9999998', customer_name: 'C9999998: ลูกค้าใหม่' };
    f.credit_term = 'มัดจำ 100% ก่อนพิมพ์';
    filled.push('ลูกค้า → ลูกค้าใหม่');
  }
  if (!f.qty || !f.qty.some(q => q && parseInt(q) > 0)) {
    f.qty = ['5000'];
    filled.push('จำนวน → 5,000 ชิ้น');
  }

  // Component defaults
  (f.components || []).forEach((c, i) => {
    const p = 'Component ' + (i + 1) + ': ';

    // Paper default
    if (!c.paper?.paper_code) {
      const subs = State.masters._paper_sub_codes || [];
      if (subs.length > 0) {
        c.paper.paper_code = subs[0].code;
        c.paper.paper_type = subs[0].type || subs[0].code;
        filled.push(p + 'กระดาษ → ' + subs[0].code);
        // Load GSM
        loadPaperGsmOptions(subs[0].code).then(() => {
          const gsmList = State.masters['paper_gsm_' + subs[0].code] || [];
          if (gsmList.length > 0 && !c.paper.paper_gram) {
            c.paper.paper_gram = gsmList[0];
          }
          autoFillPaperFromDB(c.paper, false);
          renderForm();
        });
      }
    }
    if (!c.paper?.paper_gram) {
      c.paper.paper_gram = '300';
      filled.push(p + 'แกรม → 300gsm');
    }

    // Color default
    if (!c.color?.outside && c.color?.outside !== '0') {
      c.color.outside = '4';
      c.color.inside = '0';
      filled.push(p + 'สี → 4/0');
    }

    // Box template default
    if (!c.box_type?.type_id) {
      const templates = State.masters.boxtemplate_info || [];
      if (templates.length > 0) {
        const bt = templates[0]; // Type 1: Reverse Tuck End
        c.box_type = { type_id: bt.type_id, type_name: bt.type_name, glued_spot: bt.glued_spot, packing_layer: bt.packing_layer };
        if (!c.packaging_size) c.packaging_size = {};
        c.packaging_size.glue_flap = c.packaging_size.glue_flap || '15';
        c.packaging_size.tuck_flap = c.packaging_size.tuck_flap || '15';
        filled.push(p + 'รูปแบบ → ' + bt.type_name);
      }
    }

    // Box size defaults
    const sz = c.packaging_size || {};
    if (c.box_type?.type_id) {
      if (!sz.width || parseFloat(sz.width) <= 0) { sz.width = '100'; filled.push(p + 'กว้าง → 100mm'); }
      if (!sz.length || parseFloat(sz.length) <= 0) { sz.length = '150'; filled.push(p + 'ยาว → 150mm'); }
      const typeId = parseInt(c.box_type.type_id) || 0;
      if (typeId !== 12 && (sz.depth === '' || sz.depth === undefined || sz.depth === null)) { sz.depth = '50'; filled.push(p + 'ความสูง → 50mm'); }
      c.packaging_size = sz;
    }
  });

  // Re-check missing fields
  const missing = checkMissingFields(f);
  State._missingFields = missing;

  // Show result in chat
  if (filled.length > 0) {
    let msg = 'กรอกค่า default ให้แล้วครับ:\n' + filled.map(x => '  ✓ ' + x).join('\n');
    if (missing.length > 0) {
      msg += '\n\nยังขาดอีก ' + missing.length + ' รายการ:\n' + missing.map(m => '  • ' + m.label).join('\n');
    } else {
      msg += '\n\n✅ ข้อมูลครบแล้ว! กด "คำนวณ Layout" ได้เลยครับ';
    }
    addChatMsg(msg, 'agent');
    toast(missing.length > 0 ? 'กรอกให้แล้ว ยังขาด ' + missing.length + ' รายการ' : 'ข้อมูลครบแล้ว!', missing.length > 0 ? 'warning' : 'success');
  } else {
    addChatMsg('ไม่มีรายการที่ต้องกรอกเพิ่มแล้วครับ ✅', 'agent');
  }

  renderForm();
}

// ===== Business Rules Engine — กฎโรงพิมพ์ที่ AI ไม่ต้องรู้ ระบบรู้เอง =====
// รันหลัง AI กรอก + ก่อนคำนวณ Layout/Price
// ตรวจทุก component แล้วอุดช่องว่างตามกฎอุตสาหกรรม
async function ensureEstimateReady() {
  if (!State.form) return [];
  const f = State.form;
  const actions = []; // track what was auto-filled
  const warnings = []; // things user must fix manually

  for (let i = 0; i < f.components.length; i++) {
    const c = f.components[i];
    const p = `Component ${i + 1}: `;

    // === RULE 0: Pattern Match — หางานเก่าที่คล้าย → แนะนำค่าฟอร์ม ===
    try {
      const pmRes = await apiPost('/api/pattern-match', {
        component: {
          paper_code: c.paper?.paper_code || '',
          paper_gram: c.paper?.paper_gram || '',
          box_type_id: c.box_type?.type_id || '',
          component_type: c.component_type || 1,
          component_name: c.component_name || '',
          color_outside: c.color?.outside || '',
          size_w: c.packaging_size?.width || '',
          size_l: c.packaging_size?.length || '',
          job_name: f.job_name || '',
        }
      });

      if (pmRes.matches?.length > 0) {
        const topMatch = pmRes.matches[0];
        actions.push(p + `Pattern Match: เจอ ${pmRes.matches.length} งานคล้าย (top: ${topMatch.job_name?.substring(0,30)} score:${topMatch.score})`);
        // เก็บข้อมูล pattern match สำหรับแสดง reason ใน SVG
        const sugTypeId = pmRes.suggestions?.box_type_id;
        const matchesWithType = sugTypeId ? pmRes.matches.filter(m => String(m.box_type_id) === String(sugTypeId)) : [];
        c._patternMatchTop = {
          count: pmRes.matches.length,
          topName: topMatch.job_name?.substring(0, 35) || '',
          topScore: topMatch.score || 0,
          templateUsage: pmRes.matches.length > 0 && matchesWithType.length > 0 ? Math.round(matchesWithType.length / pmRes.matches.length * 100) : 0,
        };

        // Box type suggestion — เก็บเฉพาะเมื่อ keyword detect ยังไม่มี (keyword จาก job_name แม่นกว่า)
        if (pmRes.suggestions?.box_type_id && (!c.box_type?.type_id || c.box_type.type_id === '')) {
          const conf = pmRes.suggestions.box_type_confidence || 0;
          if (conf >= 0.5) {
            const bt = (State.masters.boxtemplate_info || []).find(b => String(b.type_id) === String(pmRes.suggestions.box_type_id));
            if (bt) {
              // เขียนทับเฉพาะเมื่อ applyAgentData ไม่ได้ detect จาก keyword (confidence != 'high')
              if (!c._pendingTemplate?.type_id || c._pendingTemplate?.confidence !== 'high') {
                c._pendingTemplate = {
                  type_id: String(bt.type_id), type_name: bt.type_name,
                  confidence: 'pattern_match',
                };
              }
              actions.push(p + `Box Template แนะนำ: ${bt.type_name} (${Math.round(conf*100)}% confidence)`);
            }
          }
        }

        // Corrugated suggestion — ถ้า component_type 2/3 แต่ยังไม่มี flute
        if (pmRes.suggestions?.corrugated && (c.component_type === 2 || c.component_type === 3)) {
          const corr = pmRes.suggestions.corrugated;
          if (!c.corrugated?.flute_type && corr.flute_type) {
            c.corrugated = c.corrugated || {};
            c.corrugated.flute_type = corr.flute_type;
            c.corrugated.layer = corr.layer || 3;
            actions.push(p + `ลูกฟูกจาก Pattern Match: ${corr.flute_type} ${corr.layer} ชั้น ${corr.grade || ''} (${corr.count} งานใช้)`);
          }
        }

        // Paper cost suggestion — ถ้ายังไม่มีราคา
        if (pmRes.suggestions?.paper && (!c.paper?.paper_cost || parseFloat(c.paper.paper_cost) <= 0)) {
          c.paper.paper_cost = pmRes.suggestions.paper.cost;
          c.paper.paper_markup = pmRes.suggestions.paper.markup || c.paper.paper_markup;
          const cost = parseFloat(c.paper.paper_cost) || 0;
          const markup = parseFloat(c.paper.paper_markup) || 10;
          if (cost > 0) c.paper.paper_sale = (cost * (1 + markup / 100)).toFixed(2);
          actions.push(p + `ราคากระดาษจาก Pattern Match: ${c.paper.paper_cost} บาท (${pmRes.suggestions.paper.count} งานใช้ราคานี้)`);
        }
      }
    } catch (e) { /* Pattern match API ไม่พร้อม — ข้ามไป */ }

    // === RULE 1: Paper cost ต้องมีค่า ===
    // ถ้ามี paper_code + paper_gram แต่ paper_cost = 0 → โหลดจาก DB
    if (c.paper?.paper_code && c.paper?.paper_gram && (!c.paper.paper_cost || parseFloat(c.paper.paper_cost) <= 0)) {
      try {
        await loadPaperGsmOptions(c.paper.paper_code);
        autoFillPaperFromDB(c.paper, c.paper.paper_name === 'ต่างประเทศ');

        // ถ้ายังไม่มีราคา → GSM อาจไม่มีใน paper_code นี้ → หา code ใกล้เคียงที่มี GSM นั้น
        if (!c.paper.paper_cost || parseFloat(c.paper.paper_cost) <= 0) {
          const allPapers = State.masters['_paper_info_all'] || [];
          const targetGsm = c.paper.paper_gram;
          // หากระดาษตระกูลเดียวกันที่มี GSM นี้ (เช่น AC C1s → AC C2s)
          const baseType = c.paper.paper_code.replace(/\s*C[12]s$/, ''); // "AC C1s" → "AC"
          const altPapers = allPapers.filter(d =>
            String(d.gram) === targetGsm && d.paper_code?.startsWith(baseType)
          );
          if (altPapers.length > 0) {
            const alt = altPapers[0];
            const oldCode = c.paper.paper_code;
            c.paper.paper_code = alt.paper_code;
            c.paper.paper_type = alt.paper_code;
            await loadPaperGsmOptions(alt.paper_code);
            autoFillPaperFromDB(c.paper, c.paper.paper_name === 'ต่างประเทศ');
            actions.push(p + `กระดาษ ${oldCode} ไม่มี ${targetGsm}gsm → เปลี่ยนเป็น ${alt.paper_code} (มีใน DB)`);
          } else {
            // DB ไม่มี → ลองค้น RAG Knowledge Base
            const ragResults = await ragSearchPrice(c.paper.paper_code, targetGsm);
            if (ragResults.length > 0) {
              const rd = ragResults[0].data;
              // Try to find price field in the data (flexible column names)
              const priceKeys = Object.keys(rd).filter(k => /price|ราคา|cost|บาท|baht/i.test(k));
              const priceVal = priceKeys.length > 0 ? parseFloat(rd[priceKeys[0]]) : 0;
              if (priceVal > 0) {
                c.paper.paper_cost = String(priceVal);
                const markup = parseFloat(c.paper.paper_markup) || 10;
                c.paper.paper_sale = (priceVal * (1 + markup / 100)).toFixed(2);
                actions.push(p + `ราคากระดาษจาก RAG: ${c.paper.paper_code} ${targetGsm}gsm → ${priceVal} บาท (จากไฟล์ ${ragResults[0].metadata?.filename || 'uploaded'})`);
              } else {
                warnings.push(p + `พบข้อมูลใน RAG แต่ไม่พบราคา — กรุณาตรวจสอบ: ${JSON.stringify(rd).substring(0, 100)}`);
              }
            } else {
              // ไม่มีทั้ง DB และ RAG
              const anyMatch = allPapers.filter(d => String(d.gram) === targetGsm);
              if (anyMatch.length > 0) {
                warnings.push(p + `${c.paper.paper_code} ไม่มี ${targetGsm}gsm — มีตัวเลือก: ${[...new Set(anyMatch.map(d=>d.paper_code))].join(', ')}`);
              } else {
                warnings.push(p + `ไม่พบกระดาษ ${targetGsm}gsm ทั้งใน DB และ RAG — กรุณาอัพโหลดตารางราคาหรือกรอกราคาเอง`);
              }
            }
          }
        }

        if (parseFloat(c.paper.paper_cost) > 0) {
          const cost = parseFloat(c.paper.paper_cost);
          const markup = parseFloat(c.paper.paper_markup) || 10;
          c.paper.paper_sale = (cost * (1 + markup / 100)).toFixed(2);
          actions.push(p + `ราคากระดาษ ${c.paper.paper_code} ${c.paper.paper_gram}gsm → ${c.paper.paper_cost} บาท (markup ${c.paper.paper_markup}%)`);
        }
      } catch (e) { /* silent */ }
    }

    // === RULE 1b: Auto-detect box template จากชื่อ component / job name ===
    if (!c.box_type?.type_id || c.box_type.type_id === '' || c.box_type.type_id === '12') {
      const searchText = ((c.component_name || '') + ' ' + (c.box_type?.type_name || '') + ' ' + (f.job_name || '')).toLowerCase();
      const templates = State.masters.boxtemplate_info || [];
      let detected = null;

      // Priority mapping: component name / keyword → box template (all 12 types)
      // === HIGH CONFIDENCE — ชื่อตรง ===
      const COMPONENT_TO_TEMPLATE = [
        // Type 1: Reverse Tuck End — กล่องฝาคู่ แบบฝาสลับ
        { patterns: /reverse\s*tuck|ฝาสลับ|ฝาเสียบ(?!.*ตรง)/i, typeId: 1, name: 'Reverse Tuck End' },
        // Type 2: Straight Tuck End — กล่องฝาคู่ แบบฝาตรง
        { patterns: /straight\s*tuck|ฝาตรง/i, typeId: 2, name: 'Straight Tuck End' },
        // Type 3: TTSLB — ออโต้ล็อคหูขัด / ก้นขัด / (2TT)
        { patterns: /ttslb|snap\s*lock|ก้นขัด|หูขัด|ฝาเปิดบน.*ก้น|ออโต้ล็อค.*หูขัด|\(2TT\)/i, typeId: 3, name: 'TTSLB' },
        // Type 4: TTAB — ออโต้ล็อคทากาว / (1TT)
        { patterns: /ttab|auto\s*(?:lock\s*)?bottom|ออโต้ล็อค.*ทากาว|ออโต้.*ทากาว|ก้นล็อค.*ทากาว|\(1TT\)/i, typeId: 4, name: 'TTAB' },
        // Type 5: Double Glue Side Wall (Simple Tray) — ฝาครอบ / ถาด
        { patterns: /simple\s*tray|double\s*glue|tray\s*(?:&|and)\s*lid|ฝาครอบ|(?:กล่อง)?ถาด(?:และฝา)?/i, typeId: 5, name: 'Tray' },
        // Type 6: Frame-Vue Tray — ฝาครอบมีขอบ
        { patterns: /frame[\s-]*vue|ฝาครอบ.*(?:มี)?ขอบ|เทรย์.*ขอบ/i, typeId: 6, name: 'Frame-Vue Tray' },
        // Type 7: Four Corner Beers Tray — เบเนโตะ
        { patterns: /four\s*corner|beers?\s*tray|4\s*corner|เบ(?:เน|น)โตะ|เบียร์เทรย์/i, typeId: 7, name: 'Four Corner Beers Tray' },
        // Type 8: Gable Top — จั่ว / หูหิ้ว
        { patterns: /gable\s*top|ทรงจั่ว|จั่ว|หูหิ้ว|กล่องหูหิ้ว/i, typeId: 8, name: 'Gable Top' },
        // Type 9: Sleeve — ปลอก / สลีฟ
        { patterns: /\bsleeve\b|ปลอก(?:กล่อง)?|สลีฟ|สายคาด|wrapper|แรปเปอร์|wrap\s*around|(?:กล่อง)?สวม/i, typeId: 9, name: 'Sleeve' },
        // Type 10: Pillow Box — ทรงหมอน
        { patterns: /pillow\s*box|pillow|ทรงหมอน|หมอน/i, typeId: 10, name: 'Pillow Box' },
        // Type 11: Seal End — ฝาปิดทากาว
        { patterns: /seal\s*end|ฝาปิด.*ทากาว|ซีล\s*เอ็น/i, typeId: 11, name: 'Seal End' },
      ];

      for (const rule of COMPONENT_TO_TEMPLATE) {
        if (rule.patterns.test(searchText)) {
          detected = rule;
          break;
        }
      }

      // === MEDIUM CONFIDENCE — ชื่อทั่วไป + keyword ประเภทสินค้า ===
      if (!detected) {
        const PRODUCT_TO_TEMPLATE = [
          // Tray / Cover / Lid
          { patterns: /\blid\b|\btray\b|ถาด|cover(?!.*sleeve)/i, typeId: 5, name: 'Tray/Cover', confidence: 'medium' },
          // ออโต้ (ไม่ระบุว่าหูขัดหรือทากาว)
          { patterns: /ออโต้(?:ล็อค)?|auto\s*lock/i, typeId: 3, name: 'TTSLB (auto-lock)', confidence: 'medium' },
          // กล่องทั่วไป (ครีม, สบู่, อาหาร, etc.)
          { patterns: /กล่อง(?:ครีม|เครื่องสำอาง|สบู่|ยา|อาหาร(?:เสริม)?|ขนม|ชา|กาแฟ|น้ำหอม|วิตามิน|เซรั่ม)/i, typeId: 1, name: 'Reverse Tuck (common)', confidence: 'medium' },
          // Folding / Carton (ไม่รวม inner box — inner box ใช้ได้หลาย template)
          { patterns: /folding\s*(?:carton|box)|carton\s*box/i, typeId: 1, name: 'Reverse Tuck (folding)', confidence: 'medium' },
        ];
        for (const rule of PRODUCT_TO_TEMPLATE) {
          if (rule.patterns.test(searchText)) {
            detected = { ...rule };
            break;
          }
        }
      }

      if (detected) {
        const bt = templates.find(b => String(b.type_id) === String(detected.typeId));
        if (bt) {
          // เก็บแนะนำไว้ใน _pendingTemplate ไม่ตั้งค่าอัตโนมัติ
          if (!c._pendingTemplate || !c._pendingTemplate.type_id) {
            c._pendingTemplate = {
              type_id: String(bt.type_id), type_name: bt.type_name,
              confidence: detected.confidence || 'high',
            };
          }
          actions.push(p + `Box Template แนะนำ: "${detected.name}" → ${bt.type_name} (จากชื่อ component)`);
        }
      }
    }

    // === RULE 2: Box type 1-11 = ต้องมี die-cut เสมอ ===
    const typeId = parseInt(c.box_type?.type_id) || 0;
    if (typeId >= 1 && typeId <= 11 && !f.is_diecut) {
      f.is_diecut = true;
      actions.push('ปั๊มไดคัท → เปิดอัตโนมัติ (box type 1-11 ต้องมี die-cut)');
    }

    // === RULE 3: glued_spot → จัดการผ่าน checkbox ติดกาว ในส่วน layout (ไม่ใส่ other_process) ===

    // === RULE 4: component_type = 2 → ต้องมี corrugated section (แต่ไม่เดา flute) ===
    if (c.component_type === 2 || c.component_type === 3) {
      c.corrugated = c.corrugated || {};
      // ถ้า spec ระบุ flute → ใช้ตาม spec, ถ้าไม่ระบุ → ปล่อยว่างให้ user เลือก (เหมือนระบบเดิม)
      // ไม่ตั้ง default layer — ปล่อยให้ user เลือกเอง
      if (c.corrugated.flute_type && !c.corrugated.layer) {
        actions.push(p + `ลูกฟูก: กลอน ${c.corrugated.flute_type}`);
      } else if (!c.corrugated.flute_type) {
        warnings.push(p + `ไม่ได้ระบุกลอนลูกฟูก (A/B/C/E/F/G) — กรุณาเลือกในฟอร์ม`);
      }
      // Load corrugated cost from master — match by flute_type + grade (type_1/type_2 + gram_1/gram_2)
      if (!c.corrugated.cost_price || parseFloat(c.corrugated.cost_price) <= 0) {
        const corrDB = State.masters.corrugated_info || [];
        const layer = c.corrugated.layer || 2;
        const ft = c.corrugated.flute_type || '';
        const g = c.corrugated.grade || [];
        const gm = c.corrugated.gram || [];
        // Find matching record: layer + flute + grade codes + grams
        const corrMatch = corrDB.find(ci =>
          ci.num_layer === layer && ci.flute_type === ft &&
          ci.type_1 === (g[0]||'') && ci.type_2 === (g[1]||'') &&
          ci.gram_1 === (gm[0]||0) && ci.gram_2 === (gm[1]||0)
        ) || corrDB.find(ci => ci.num_layer === layer && ci.flute_type === ft); // fallback: just layer+flute
        if (corrMatch?.rate) {
          c.corrugated.cost_price = String(corrMatch.rate);
          c.corrugated.flute_thickness = corrMatch.flute_thickness || 0;
          c.corrugated.total_gram = corrMatch.total_gram || 0;
          actions.push(p + `ราคาลูกฟูก ${corrMatch.grade || ft} → ${corrMatch.rate} บาท/แผ่น`);
        } else {
          warnings.push(p + `ไม่พบราคาลูกฟูก ${ft} ${g.join('/')} ใน Master Data`);
        }
      }
    }

    // === RULE 5: Coating type ต้อง match กับ master data ===
    (c.addon || []).forEach((ad, ai) => {
      if (ad.type === 'coating' && (ad.name || ad.detail) && (!ad.info?.code || !ad.info?.type)) {
        matchCoatingType(ad, ad.detail || ad.name);
        if (ad._matchConfidence === 'matched') {
          actions.push(p + `Coating "${ad.detail || ad.name}" → ${ad.info.type} (${ad.info.coating_code})`);
        } else if (ad._matchConfidence === 'not_found') {
          warnings.push(p + `Coating "${ad._searchText}" ไม่พบใน Master Data — กรุณาเลือกจาก dropdown`);
        }
      }
    });

    // === RULE 6: Paper source ต้องตั้งค่า ===
    if (c.paper?.paper_code && !c.paper.paper_source_id) {
      c.paper.paper_source_id = c.paper.paper_name === 'ต่างประเทศ' ? '2' : '1';
    }

    // === RULE 7: Paper markup ต้องมีค่า ===
    if (!c.paper?.paper_markup || parseFloat(c.paper.paper_markup) <= 0) {
      c.paper.paper_markup = c.paper?.paper_name === 'ต่างประเทศ' ? '13' : '10';
    }

    // === RULE 8: Packing — auto-set checkboxes from packing_detail ===
    const pkd = c.packing_detail || '';
    if (pkd) {
      if (/kraft/i.test(pkd) && c._pk_kraftwrap === undefined) { c._pk_kraftwrap = true; actions.push(p + 'Packing: Kraftwrap (จาก spec)'); }
      if (/paper\s*band|รัดกระดาษ/i.test(pkd) && c._pk_paperband === undefined) { c._pk_paperband = true; actions.push(p + 'Packing: Paperband (จาก spec)'); }
      if (/carton|กล่องลูกฟูก/i.test(pkd) && c._pk_carton === undefined) { c._pk_carton = true; actions.push(p + 'Packing: Carton (จาก spec)'); }
      if (/pallet|พาเลท/i.test(pkd) && c._pk_pallet === undefined) { c._pk_pallet = true; actions.push(p + 'Packing: Pallet (จาก spec)'); }
    }
    // Also from packing array
    (c.packing || []).forEach(pk => {
      const t = (pk.type || pk.name || '').toLowerCase();
      if (/kraft/i.test(t) && c._pk_kraftwrap === undefined) c._pk_kraftwrap = true;
      if (/paper.*band/i.test(t) && c._pk_paperband === undefined) c._pk_paperband = true;
      if (/carton/i.test(t) && c._pk_carton === undefined) c._pk_carton = true;
      if (/pallet/i.test(t) && c._pk_pallet === undefined) c._pk_pallet = true;
    });
  }

  // === RULE 9: Delivery default cost ===
  // ถ้าไม่ได้ระบุสถานที่ส่ง → ตั้งค่าส่งขั้นต่ำ 1,500 บาท (ไม่ใช่ 0)
  if (f.delivery?.length > 0) {
    const d0 = f.delivery[0];
    if (!d0.destinationId || d0.destinationId === '63') {
      // "ลูกค้ามารับเอง" หรือยังไม่ระบุ → ใช้ค่าจัดส่งขั้นต่ำ
      if (!d0._delivery_cost_override) {
        d0._delivery_cost_override = '1500'; // ขั้นต่ำ 1500 บาท
        actions.push('ค่าจัดส่ง default → 1,500 บาท (ขั้นต่ำ)');
      }
    }
  }

  // === RULE 10: Qty sanity check ===
  if (f.has_multi_f && f.f_data?.length > 0) {
    const edTotal = f.f_data.reduce((s, fd) => s + (parseInt(fd.qty) || 0), 0);
    if (edTotal > 0 && f.qty?.length === 1) {
      const qtyVal = parseInt(f.qty[0]) || 0;
      if (qtyVal !== edTotal && edTotal > qtyVal) {
        f.qty = [String(edTotal)];
        f.f_total_qty = edTotal;
        actions.push(`Qty รวม → ${edTotal} (จากยอดแต่ละ edition)`);
      }
    }
  }

  renderForm();
  return { actions, warnings };
}

// ===== Interactive Fill Flow — AI asks one field at a time =====
function startFillFlow(silent) {
  if (!State.form) return;
  if (State._fillFlow?.active) return; // prevent double-start
  const missing = checkMissingFields(State.form);

  // === Inject ambiguous process question ก่อน normal questions ===
  const ambiguousProcs = State._ambiguousProcs || [];
  const hasAmbiguous = ambiguousProcs.length > 0;

  if (missing.length === 0 && !hasAmbiguous) {
    if (!silent) addChatMsg('ข้อมูลครบแล้วครับ ✅', 'agent');
    return;
  }

  const queue = [];

  // 1. Ambiguous process question (ถ้ามี) — ถามก่อน
  if (hasAmbiguous) {
    const values = ambiguousProcs.map(a => a.value).join(', ');
    queue.push({
      key: '_ambiguous_proc',
      label: 'Ambiguous Process',
      section: 'process',
      question: `Process ${values} หมายถึงอะไรครับ?`,
      suggestions: [
        { label: 'Other Process', value: 'other_process' },
        { label: 'Handwork Process', value: 'handwork_process' },
        { label: 'จัดจ้าง', value: 'outsource' },
      ],
      applyFn: (val) => {
        if (val === '__skip__') {
          State._ambiguousProcs = [];
          return 'ข้าม';
        }
        const arrKey = val;
        const f = State.form;
        if (!f[arrKey]) f[arrKey] = [];
        ambiguousProcs.forEach(a => {
          f[arrKey].push({
            name: 'Process ' + a.value,
            detail: '',
            cost: '',
            fixed_price: true,
          });
        });
        State._ambiguousProcs = []; // clear
        renderForm();
        const sectionLabel = arrKey === 'other_process' ? 'Other Process' : arrKey === 'handwork_process' ? 'Handwork Process' : 'จัดจ้าง';
        return `${sectionLabel} (${ambiguousProcs.length} รายการ — ราคาจะถามต่อ)`;
      },
    });
  }

  // 2. Normal missing field questions
  const rawQueue = missing.map(m => buildFillQuestion(m));
  rawQueue.forEach(q => {
    queue.push(q);
    if (q._extraQuestions) {
      q._extraQuestions.forEach(eq => queue.push(eq));
      delete q._extraQuestions;
    }
  });

  State._fillFlow = { active: true, queue, currentIndex: 0 };
  // No intro message when called from auto-flow (silent=true)
  askNextFillQuestion();
}

function buildFillQuestion(m) {
  const f = State.form;
  const q = { key: m.key || m.label, label: m.label, section: m.section, question: '', suggestions: [] };

  // === Process / Material price input — match label "Process "X" — ราคายังไม่กำหนด" ===
  // ใช้ regex match ก่อน switch (เพราะ label เป็น dynamic ตามชื่อ process)
  const procPriceMatch = m.label.match(/^(Process|Handwork|จัดจ้าง|Material|Other)\s+"(.+)"\s+—\s+ราคายังไม่กำหนด$/);
  if (procPriceMatch) {
    const sectionLabel = procPriceMatch[1];
    const procName = procPriceMatch[2];
    // หา array key
    const arrKey = sectionLabel === 'Process' ? 'other_process'
                 : sectionLabel === 'Handwork' ? 'handwork_process'
                 : sectionLabel === 'จัดจ้าง' ? 'outsource'
                 : sectionLabel === 'Material' ? 'materials'
                 : 'other_items';
    // หา item index
    const arr = f[arrKey] || [];
    const itemIdx = arr.findIndex(p => p.name === procName);
    q.question = `${sectionLabel} "${procName}" — ราคาต่อหน่วย กี่บาทครับ? (พิมพ์ตัวเลขได้เลย)`;
    q.suggestions = [
      { label: '0.50', value: '0.50' },
      { label: '1.00', value: '1.00' },
      { label: '2.00', value: '2.00' },
      { label: '5.00', value: '5.00' },
      { label: '10.00', value: '10.00' },
      { label: '✏️ พิมพ์เอง...', value: '__type__' },
    ];
    q.applyFn = (val) => {
      if (val === '__type__') return '(พิมพ์ตัวเลขราคาในช่อง chat ได้เลยครับ เช่น 1.50)';
      const price = parseFloat(String(val).replace(/[^\d.]/g, '')) || 0;
      if (price <= 0) return '⚠️ ราคาต้องมากกว่า 0';
      if (itemIdx >= 0 && f[arrKey][itemIdx]) {
        f[arrKey][itemIdx].cost = String(price);
        // Default: fixed_price = true (× จำนวนชิ้น)
        if (f[arrKey][itemIdx].fixed_price === undefined) f[arrKey][itemIdx].fixed_price = true;
        renderForm();
      }
      return price.toFixed(2) + ' บาท/ชิ้น';
    };
    return q;
  }

  switch (m.label) {
    case 'ชื่อลูกค้า (Customer)':
      q.question = 'ชื่อลูกค้าคือใครครับ?';
      q.suggestions = [{ label: 'ลูกค้าใหม่', value: '__new_customer__' }];
      q.applyFn = (val) => {
        if (val === '__new_customer__') {
          f.new_customer = true;
          f.customer = { customer_id: 'C9999998', customer_name: 'C9999998: ลูกค้าใหม่' };
          f.credit_term = 'มัดจำ 100% ก่อนพิมพ์';
          return 'ลูกค้าใหม่';
        }
        f.customer = { customer_name: val };
        return val;
      };
      break;
    case 'AE Name':
      q.question = 'AE (ชื่อ Account Executive) คือใครครับ? พิมพ์ชื่อหรือรหัสพนักงานได้เลย';
      // Pre-load current user as suggestion if session available
      if (State.session?.emp_id) {
        q.suggestions = [{ label: State.session.emp_name || State.session.emp_id, value: State.session.emp_id }];
      }
      q.applyFn = (val) => {
        // Set name immediately so missing check passes right away
        f.ae = { emp_id: '', emp_name: val };
        // Then search API to enhance with emp_id + full name (async, updates form when done)
        autoSearchAE(val);
        return val;
      };
      break;
    case 'จำนวนสั่ง (Qty)':
      // Multi-F: ถามทีละ F-code แล้วรวม Total Qty
      if (f.has_multi_f && f.f_data?.length > 0) {
        // สร้าง questions สำหรับแต่ละ F
        const fQuestions = f.f_data.map((fd, fi) => ({
          key: 'f_qty_' + fi,
          label: fd.f_code || ('F' + (fi + 1)),
          section: 'header',
          question: `${fd.f_code || 'F' + (fi + 1)} จำนวนเท่าไหร่ครับ?`,
          suggestions: [
            { label: '500', value: '500' },
            { label: '1,000', value: '1000' },
            { label: '2,000', value: '2000' },
            { label: '5,000', value: '5000' },
            { label: '✏️ พิมพ์เอง...', value: '__type__' },
          ],
          applyFn: (val) => {
            if (val === '__type__') return '(พิมพ์จำนวนในช่อง chat ได้เลยครับ)';
            const qty = parseInt(val.replace(/,/g, '')) || 0;
            f.f_data[fi].qty = String(qty);
            f.f_data[fi].total_qty = String(qty);
            // Auto-sum total
            f.f_total_qty = f.f_data.reduce((s, fd2) => s + (parseInt(fd2.total_qty) || 0), 0);
            f.qty = [String(f.f_total_qty)];
            return qty.toLocaleString() + ' ชิ้น';
          },
        }));
        // Replace single question with first F question, add rest to queue
        Object.assign(q, fQuestions[0]);
        // Store remaining F questions to inject into queue
        q._extraQuestions = fQuestions.slice(1);
      } else {
        q.question = 'จำนวนสั่งกี่ชิ้นครับ? (พิมพ์ตัวเลขได้เลย หรือหลายจำนวนคั่น , เช่น 3000,5000,10000)';
        q.suggestions = [
          { label: '1,000', value: '1000' },
          { label: '3,000', value: '3000' },
          { label: '5,000', value: '5000' },
          { label: '10,000', value: '10000' },
          { label: '✏️ พิมพ์เอง...', value: '__type__' },
        ];
        q.applyFn = (val) => {
          if (val === '__type__') return '(พิมพ์จำนวนในช่อง chat ได้เลยครับ เช่น 5000 หรือ 3000,5000,10000)';
          const nums = val.split(/[,\s]+/).filter(v => parseInt(v) > 0);
          f.qty = nums.length > 0 ? nums : ['5000'];
          return f.qty.map(n => parseInt(n).toLocaleString()).join(', ') + ' ชิ้น';
        };
      }
      break;
    case 'จำนวนแต่ละ F (Multi-F Qty)':
      // ถามจำนวนทีละ F-code
      if (f.f_data?.length > 0) {
        const emptyFs = f.f_data.map((fd, fi) => ({ fd, fi })).filter(x => !x.fd.qty || parseInt(x.fd.qty) <= 0);
        if (emptyFs.length > 0) {
          const first = emptyFs[0];
          Object.assign(q, {
            key: 'f_qty_' + first.fi,
            label: first.fd.f_code || ('F' + (first.fi + 1)),
            question: `${first.fd.f_code || 'F' + (first.fi + 1)} จำนวนเท่าไหร่ครับ?`,
            suggestions: [
              { label: '500', value: '500' },
              { label: '1,000', value: '1000' },
              { label: '2,000', value: '2000' },
              { label: '5,000', value: '5000' },
              { label: '✏️ พิมพ์เอง...', value: '__type__' },
            ],
            applyFn: (val) => {
              if (val === '__type__') return '(พิมพ์จำนวนในช่อง chat ได้เลยครับ)';
              const qty = parseInt(val.replace(/,/g, '')) || 0;
              f.f_data[first.fi].qty = String(qty);
              f.f_data[first.fi].total_qty = String(qty);
              f.f_total_qty = f.f_data.reduce((s, fd2) => s + (parseInt(fd2.total_qty) || 0), 0);
              f.qty = [String(f.f_total_qty)];
              return qty.toLocaleString() + ' ชิ้น';
            },
          });
          // Add remaining F questions
          q._extraQuestions = emptyFs.slice(1).map(x => ({
            key: 'f_qty_' + x.fi,
            label: x.fd.f_code || ('F' + (x.fi + 1)),
            section: 'header',
            question: `${x.fd.f_code || 'F' + (x.fi + 1)} จำนวนเท่าไหร่ครับ?`,
            suggestions: [
              { label: '500', value: '500' },
              { label: '1,000', value: '1000' },
              { label: '2,000', value: '2000' },
              { label: '5,000', value: '5000' },
              { label: '✏️ พิมพ์เอง...', value: '__type__' },
            ],
            applyFn: (val) => {
              if (val === '__type__') return '(พิมพ์จำนวนในช่อง chat ได้เลยครับ)';
              const qty = parseInt(val.replace(/,/g, '')) || 0;
              f.f_data[x.fi].qty = String(qty);
              f.f_data[x.fi].total_qty = String(qty);
              f.f_total_qty = f.f_data.reduce((s, fd2) => s + (parseInt(fd2.total_qty) || 0), 0);
              f.qty = [String(f.f_total_qty)];
              return qty.toLocaleString() + ' ชิ้น';
            },
          }));
        }
      }
      break;
    default: {
      // Component-level fields
      const compMatch = m.label.match(/^Component (\d+): (.+)$/);
      if (compMatch) {
        const ci = parseInt(compMatch[1]) - 1;
        const fieldLabel = compMatch[2];
        const c = f.components[ci];
        if (!c) break;

        if (fieldLabel === 'ประเภทกระดาษ (Paper)') {
          const subs = State.masters._paper_sub_codes || [];
          q.question = `Component ${ci + 1}: กระดาษประเภทอะไรครับ?`;
          q.suggestions = subs.map(s => ({ label: s.label || s.code, value: s.code }));
          q.suggestions.push({ label: '✏️ พิมพ์เอง...', value: '__type__' });
          q.applyFn = (val) => {
            if (val === '__type__') return '(พิมพ์ชื่อกระดาษในช่อง chat ได้เลยครับ)';
            if (!c.paper) c.paper = {};
            const found = subs.find(s => s.code === val || s.label === val);
            if (found) { c.paper.paper_code = found.code; c.paper.paper_type = found.type || found.code; }
            else { c.paper.paper_code = val; }
            loadPaperGsmOptions(c.paper.paper_code).then(() => {
              autoFillPaperFromDB(c.paper, false);
              renderForm();
            });
            return c.paper.paper_code;
          };
        } else if (fieldLabel === 'แกรม (GSM)') {
          const gsmKey = 'paper_gsm_' + (c.paper?.paper_code || '');
          const gsmList = State.masters[gsmKey] || [];
          q.question = `Component ${ci + 1}: กระดาษกี่แกรมครับ? (พิมพ์ตัวเลขได้เลย)`;
          q.suggestions = gsmList.length > 0
            ? gsmList.map(g => ({ label: g + ' gsm', value: String(g) }))
            : [{ label: '190', value: '190' }, { label: '200', value: '200' }, { label: '210', value: '210' }, { label: '250', value: '250' }, { label: '270', value: '270' }, { label: '300', value: '300' }, { label: '350', value: '350' }, { label: '400', value: '400' }];
          q.suggestions.push({ label: '✏️ พิมพ์เอง...', value: '__type__' });
          // Extra question: ถาม paper source (ในประเทศ/ต่างประเทศ) หลังเลือก GSM
          q._extraQuestions = [{
            key: 'paper_source_' + ci,
            label: `Component ${ci + 1}: แหล่งกระดาษ`,
            section: 'comp' + ci,
            question: `Component ${ci + 1}: กระดาษ **ในประเทศ** หรือ **ต่างประเทศ** ครับ?\n(ราคาจะต่างกัน — ในประเทศ markup 10%, ต่างประเทศ 13%)`,
            suggestions: [
              { label: '🇹🇭 ในประเทศ', value: 'domestic' },
              { label: '🌍 ต่างประเทศ (Import)', value: 'import' },
            ],
            applyFn: (val) => {
              if (!c.paper) c.paper = {};
              const isImport = val === 'import';
              c.paper.paper_name = isImport ? 'ต่างประเทศ' : 'ในประเทศ';
              c.paper.paper_source_id = isImport ? '2' : '1';
              c.paper.paper_markup = isImport ? '13' : '10';
              // Re-fill price from DB with correct source
              autoFillPaperFromDB(c.paper, isImport);
              renderForm();
              return isImport ? 'ต่างประเทศ (Import)' : 'ในประเทศ';
            },
          }];
          q.applyFn = (val) => {
            if (val === '__type__') return '(พิมพ์ตัวเลขแกรมในช่อง chat ได้เลยครับ)';
            if (!c.paper) c.paper = {};
            c.paper.paper_gram = val.replace(/[^\d.]/g, '');
            autoFillPaperFromDB(c.paper, false);
            renderForm();
            return c.paper.paper_gram + ' gsm';
          };
        } else if (fieldLabel === 'จำนวนสี (Color)') {
          q.question = `Component ${ci + 1}: พิมพ์กี่สีครับ? (หน้า/หลัง เช่น 4/0, 4/1)`;
          q.suggestions = [
            { label: '1/0', value: '1/0' },
            { label: '2/0', value: '2/0' },
            { label: '4/0', value: '4/0' },
            { label: '4/1', value: '4/1' },
            { label: '4/4', value: '4/4' },
            { label: '5/0', value: '5/0' },
            { label: '6/0', value: '6/0' },
            { label: '7/0', value: '7/0' },
            { label: '8/0', value: '8/0' },
            { label: '✏️ พิมพ์เอง...', value: '__type__' },
          ];
          q.applyFn = (val) => {
            if (val === '__type__') return '(พิมพ์จำนวนสี เช่น 4/0 ในช่อง chat ได้เลยครับ)';
            const parts = val.split('/');
            if (!c.color) c.color = {};
            c.color.outside = parts[0] || '4';
            c.color.inside = parts[1] || '0';
            return c.color.outside + '/' + c.color.inside;
          };
        } else if (fieldLabel === 'รูปแบบกล่อง (Template)') {
          const templates = State.masters.boxtemplate_info || [];
          q.question = `Component ${ci + 1}: รูปแบบกล่องเป็นแบบไหนครับ?`;
          q.suggestions = templates.map(bt => ({ label: bt.type_name, value: String(bt.type_id) }));
          q.applyFn = (val) => {
            setCompBoxType(ci, val);
            const bt = templates.find(b => String(b.type_id) === String(val));
            return bt ? bt.type_name : 'Type ' + val;
          };
        } else if (fieldLabel === 'กว้าง (Width)') {
          q.question = `Component ${ci + 1}: ขนาดกว้างกี่ mm ครับ? (พิมพ์ตัวเลขได้เลย)`;
          q.suggestions = [{ label: '40', value: '40' }, { label: '65', value: '65' }, { label: '80', value: '80' }, { label: '100', value: '100' }, { label: '150', value: '150' }, { label: '185', value: '185' }, { label: '✏️ พิมพ์เอง...', value: '__type__' }];
          q.applyFn = (val) => {
            if (val === '__type__') return '(พิมพ์ตัวเลข mm ในช่อง chat ได้เลยครับ)';
            if (!c.packaging_size) c.packaging_size = {};
            c.packaging_size.width = val.replace(/[^\d.]/g, '');
            return c.packaging_size.width + ' mm';
          };
        } else if (fieldLabel === 'ยาว (Length)') {
          q.question = `Component ${ci + 1}: ขนาดยาวกี่ mm ครับ? (พิมพ์ตัวเลขได้เลย)`;
          q.suggestions = [{ label: '68', value: '68' }, { label: '85', value: '85' }, { label: '100', value: '100' }, { label: '150', value: '150' }, { label: '200', value: '200' }, { label: '225', value: '225' }, { label: '✏️ พิมพ์เอง...', value: '__type__' }];
          q.applyFn = (val) => {
            if (val === '__type__') return '(พิมพ์ตัวเลข mm ในช่อง chat ได้เลยครับ)';
            if (!c.packaging_size) c.packaging_size = {};
            c.packaging_size.length = val.replace(/[^\d.]/g, '');
            return c.packaging_size.length + ' mm';
          };
        } else if (fieldLabel === 'ความสูง (Depth)') {
          q.question = `Component ${ci + 1}: ความสูง (ลึก) กี่ mm ครับ? (พิมพ์ 0 ได้ถ้าไม่มีความสูง)`;
          q.suggestions = [{ label: '0', value: '0' }, { label: '30', value: '30' }, { label: '50', value: '50' }, { label: '75', value: '75' }, { label: '80', value: '80' }, { label: '115', value: '115' }, { label: '128', value: '128' }, { label: '✏️ พิมพ์เอง...', value: '__type__' }];
          q.applyFn = (val) => {
            if (val === '__type__') return '(พิมพ์ตัวเลข mm ในช่อง chat ได้เลยครับ)';
            if (!c.packaging_size) c.packaging_size = {};
            c.packaging_size.depth = val.replace(/[^\d.]/g, '');
            return c.packaging_size.depth + ' mm';
          };
        } else {
          q.question = `Component ${ci + 1}: ${fieldLabel} คือเท่าไหร่ครับ?`;
          q.applyFn = (val) => val;
        }
      } else {
        q.question = m.label + ' คือเท่าไหร่ครับ?';
        q.applyFn = (val) => val;
      }
    }
  }
  return q;
}

function askNextFillQuestion() {
  const flow = State._fillFlow;
  if (!flow || !flow.active) return;

  if (flow.currentIndex >= flow.queue.length) {
    // Re-check for new missing fields (e.g. size fields appear after box template is selected)
    const remaining = checkMissingFields(State.form);
    // Filter out fields already in the original queue (already asked/skipped)
    const askedLabels = new Set(flow.queue.map(q => q.label));
    const newMissing = remaining.filter(m => !askedLabels.has(m.label));

    if (newMissing.length > 0) {
      // Add new questions to the queue and continue asking
      const newQuestions = newMissing.map(m => buildFillQuestion(m));
      flow.queue.push(...newQuestions);
      addChatMsg(`พบข้อมูลที่ต้องกรอกเพิ่มอีก ${newMissing.length} รายการครับ`, 'agent');
      // Continue — don't return, fall through to ask the next question
    } else {
      // Truly done — show comprehensive summary from actual form data
      flow.active = false;
      State._missingFields = remaining;
      renderForm();

      if (flow.onComplete) { flow.onComplete(); return; }

      addChatMsg(buildFormSummary(flow), 'agent');
      toast(remaining.length > 0 ? `ยังขาด ${remaining.length} รายการ` : 'ข้อมูลครบแล้ว!', remaining.length > 0 ? 'warning' : 'success');
      return;
    }
  }

  const q = flow.queue[flow.currentIndex];
  const num = flow.currentIndex + 1;
  const total = flow.queue.length;

  addChatMsg(`(${num}/${total}) ${q.question}`, 'agent');

  // Add suggestion buttons
  if (q.suggestions && q.suggestions.length > 0) {
    const btns = q.suggestions.map(s =>
      `<button onclick="App.answerFillFlow('${s.value.replace(/'/g, "\\'")}')" style="background:var(--btn-bg, #fff);color:var(--text-primary, #333);border:1px solid var(--accent, #9b6dcc);padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;transition:all 0.2s" onmouseover="this.style.background='var(--accent, #9b6dcc)';this.style.color='#fff'" onmouseout="this.style.background='var(--btn-bg, #fff)';this.style.color='var(--text-primary, #333)'">${s.label}</button>`
    ).join('');
    const skipBtn = `<button onclick="App.skipFillQuestion()" style="background:transparent;color:var(--text-muted, #999);border:1px solid var(--border-color, #ddd);padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;transition:all 0.2s">ข้าม</button>`;
    addChatMsg('', 'agent', `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${btns}${skipBtn}</div>`);
  }

  // Focus chat input
  const input = $('chatInput');
  if (input) input.focus();
}

// Toggle Layout methodology disclosure (transparency: ที่มาของการแนะนำ)
function toggleLayoutMethodology(ri) {
  const el = document.getElementById('layoutMethodology_' + ri);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// Pornchai AI: user เลือกกระดาษจากปุ่ม mapping note
function choosePaperMapping(noteIndex, code) {
  const mapping = State._paperMappings?.[noteIndex];
  if (!mapping) return;
  // ป้องกันกดซ้ำ
  if (mapping._done) {
    addChatMsg(`⚠️ "${mapping.from}" เลือกไปแล้วครับ`, 'agent');
    return;
  }
  const f = State.form;
  if (!f || !f.components || !f.components[0]) return;

  const c = f.components[0];
  if (!c.paper) c.paper = {};
  const previousCode = c.paper.paper_code;

  if (code === previousCode) {
    addChatMsg(`✓ ยืนยันใช้ "${code}" สำหรับ "${mapping.from}"`, 'agent');
  } else {
    c.paper.paper_code = code;
    if (mapping.gram) c.paper.paper_gram = mapping.gram;

    // บันทึก correction (เป็นบทเรียนสำคัญสำหรับ AI Learning)
    if (State._lastSpecText) {
      apiPost('/api/corrections/add', {
        spec_text: State._lastSpecText,
        field: 'paper_code',
        ai_value: previousCode,
        user_value: code,
        context: f.job_name || mapping.from,
      }).catch(() => {});
    }

    loadPaperGsmOptions(code).then(() => {
      autoFillPaperFromDB(c.paper, c.paper.paper_name === 'ต่างประเทศ');
      renderForm();
    });
    addChatMsg(`✓ เปลี่ยนกระดาษเป็น "${code}" เรียบร้อย`, 'agent');
  }

  mapping.applied = code;
  mapping._done = true;
  State._pendingPaperMappings = Math.max(0, (State._pendingPaperMappings || 1) - 1);

  // ถ้าเลือกครบทุก mapping แล้ว → start fill flow ต่อ
  if (State._pendingPaperMappings === 0 && !State._fillFlow?.active) {
    setTimeout(() => {
      const missing = checkMissingFields(State.form);
      if (missing.length > 0) {
        addChatMsg(`⚠️ ยังขาด ${missing.length} รายการ:\n${missing.map(m => '• ' + m.label).join('\n')}`, 'agent');
        setTimeout(() => startFillFlow(true), 300);
      } else {
        addChatMsg('✅ ข้อมูลครบ! กดคำนวณ Layout ได้เลยครับ', 'agent');
      }
    }, 400);
  }
}

function answerFillFlow(val) {
  const flow = State._fillFlow;
  if (!flow || !flow.active) return;

  const q = flow.queue[flow.currentIndex];
  if (!q) return;

  // __type__ = "พิมพ์เอง" → แสดงข้อความแนะนำ แล้วรอพิมพ์ค่าจริง (ไม่ข้าม)
  if (val === '__type__') {
    addChatMsg('(พิมพ์เอง)', 'user');
    let hint = '';
    if (q.applyFn) { try { hint = q.applyFn(val); } catch (e) {} }
    addChatMsg(hint || 'พิมพ์ค่าในช่อง chat ได้เลยครับ', 'agent');
    $('chatInput')?.focus();
    return; // stay on same question
  }

  // Show user's answer in chat
  addChatMsg(val === '__new_customer__' ? 'ลูกค้าใหม่' : val, 'user');

  // Apply value
  let result = val;
  if (q.applyFn) {
    try { result = q.applyFn(val); } catch (e) { result = val; }
  }

  addChatMsg(`✓ ${q.label} → ${result}`, 'agent');

  // After last F-code qty, show Total Qty summary
  if (q.key?.startsWith('f_qty_')) {
    const f = State.form;
    const nextQ = flow.queue[flow.currentIndex + 1];
    const isLastF = !nextQ?.key?.startsWith('f_qty_');
    if (isLastF && f.f_total_qty > 0) {
      addChatMsg(`📊 Total Qty: ${f.f_total_qty.toLocaleString()} ชิ้น (รวมทุก F)`, 'agent');
    }
  }

  renderForm();

  // Mark as answered + move to next
  q._answered = true;
  flow.currentIndex++;
  setTimeout(() => askNextFillQuestion(), 300);
}

function skipFillQuestion() {
  const flow = State._fillFlow;
  if (!flow || !flow.active) return;

  const q = flow.queue[flow.currentIndex];
  q._skipped = true;
  addChatMsg('(ข้าม)', 'user');
  addChatMsg(`ข้าม ${q.label} ไปก่อนครับ`, 'agent');

  // ถ้าเป็น ambiguous process question → clear state เพื่อไม่ให้ถามซ้ำ
  if (q.key === '_ambiguous_proc') {
    State._ambiguousProcs = [];
  }

  flow.currentIndex++;
  setTimeout(() => askNextFillQuestion(), 300);
}

// Handle fill flow from chat input
function handleFillFlowInput(text) {
  const flow = State._fillFlow;
  if (!flow || !flow.active) return false;

  const q = flow.queue[flow.currentIndex];
  if (!q) return false;

  // Apply the text value
  let result = text;
  if (q.applyFn) {
    try { result = q.applyFn(text); } catch (e) { result = text; }
  }

  // ถ้า __type__ → แสดงข้อความแนะนำ แต่ไม่ข้าม ให้พิมพ์ค่าจริงต่อ
  if (text === '__type__' || (result && result.startsWith('('))) {
    addChatMsg(result, 'agent');
    return true; // consumed but stay on same question
  }

  addChatMsg(`✓ ${q.label} → ${result}`, 'agent');
  renderForm();

  flow.currentIndex++;
  setTimeout(() => askNextFillQuestion(), 300);
  return true; // consumed the input
}

// Check all required fields and return array of { label, section } for missing ones
function checkMissingFields(f) {
  const missing = [];
  const add = (label, section) => missing.push({ label, section });

  // Header
  if (!f.job_name?.trim()) add('ชื่องาน (Job Name)', 'header');
  if (!f.customer?.customer_name?.trim() && !f.new_customer) add('ชื่อลูกค้า (Customer)', 'header');
  if (!f.ae?.emp_name?.trim()) add('AE Name', 'header');
  // Qty check — Multi-F ใช้ "จำนวนแต่ละ F" แทน "จำนวนสั่ง" (ไม่ซ้ำ)
  if (f.has_multi_f && f.f_data?.length > 0) {
    const hasEmptyF = f.f_data.some(fd => fd.f_code && (!fd.qty || parseInt(fd.qty) <= 0));
    if (hasEmptyF) add('จำนวนแต่ละ F (Multi-F Qty)', 'header');
  } else {
    if (!f.qty || !f.qty.some(q => q && parseInt(q) > 0)) add('จำนวนสั่ง (Qty)', 'header');
  }

  // Components
  (f.components || []).forEach((c, i) => {
    const prefix = 'Component ' + (i + 1) + ': ';
    if (!c.component_name?.trim()) add(prefix + 'ชื่อ Component (Name)', 'comp' + i);
    if (!c.paper?.paper_code) add(prefix + 'ประเภทกระดาษ (Paper)', 'comp' + i);
    if (!c.paper?.paper_gram) add(prefix + 'แกรม (GSM)', 'comp' + i);
    if (!c.color?.outside && c.color?.outside !== '0') add(prefix + 'จำนวนสี (Color)', 'comp' + i);
    if (!c.box_type?.type_id) add(prefix + 'รูปแบบกล่อง (Template)', 'comp' + i);
    const sz = c.packaging_size || {};
    const ps = c._pendingSize || {};
    if (c.box_type?.type_id) {
      const hasW = (sz.width && parseFloat(sz.width) > 0) || (ps.width && parseFloat(ps.width) > 0);
      const hasL = (sz.length && parseFloat(sz.length) > 0) || (ps.length && parseFloat(ps.length) > 0);
      if (!hasW) add(prefix + 'กว้าง (Width)', 'comp' + i);
      if (!hasL) add(prefix + 'ยาว (Length)', 'comp' + i);
      const typeId = parseInt(c.box_type.type_id) || 0;
      const hasD = (sz.depth !== '' && sz.depth !== undefined && sz.depth !== null) || (ps.depth !== '' && ps.depth !== undefined && ps.depth !== null);
      if (typeId !== 12 && !hasD) add(prefix + 'ความสูง (Depth)', 'comp' + i);
    }
    // ลูกฟูก — เตือนในฟอร์มแทน ไม่ถามใน chat
  });

  // === Process / Material items — ต้องมีราคาทุกตัว (ไม่ใส่ราคา = ไม่ครบ) ===
  // ครอบคลุม: other_process, handwork_process, outsource (มี cost field)
  ['other_process', 'handwork_process', 'outsource'].forEach(key => {
    (f[key] || []).forEach((p, idx) => {
      if (!p.name?.trim()) return; // process ไม่มีชื่อ → ไม่นับ
      if (!p.cost || parseFloat(p.cost) <= 0) {
        const sectionName = key === 'other_process' ? 'Process' : key === 'handwork_process' ? 'Handwork' : 'จัดจ้าง';
        add(`${sectionName} "${p.name}" — ราคายังไม่กำหนด`, 'process');
      }
    });
  });
  // Materials & other_items — ต้องมี cost + qty
  ['materials', 'other_items'].forEach(key => {
    (f[key] || []).forEach((p, idx) => {
      if (!p.name?.trim()) return;
      if (!p.cost || parseFloat(p.cost) <= 0) {
        const sectionName = key === 'materials' ? 'Material' : 'Other';
        add(`${sectionName} "${p.name}" — ราคายังไม่กำหนด`, 'process');
      }
    });
  });

  return missing;
}

// === CONFIRM + SUCCESS OVERLAY ===

const PORNCHAI_SVG = `<svg viewBox="0 0 140 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ph" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#c9a0ff"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient>
    <linearGradient id="pb" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#6d28d9"/></linearGradient>
    <linearGradient id="pl" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#5b21b6"/></linearGradient>
    <filter id="pg"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <!-- Antenna -->
  <circle cx="70" cy="12" r="4" fill="#e0c3ff" filter="url(#pg)"><animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite"/></circle>
  <line x1="70" y1="15" x2="70" y2="26" stroke="#c9a0ff" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Head -->
  <g><animateTransform attributeName="transform" type="translate" values="0,0;0,-2;0,0" dur="4s" repeatCount="indefinite"/>
    <rect x="40" y="26" width="60" height="42" rx="14" fill="url(#ph)" stroke="#e9d5ff" stroke-width="1.5"/>
    <!-- Ears -->
    <rect x="33" y="38" width="8" height="12" rx="4" fill="#7c3aed" opacity="0.7"/>
    <rect x="99" y="38" width="8" height="12" rx="4" fill="#7c3aed" opacity="0.7"/>
    <!-- Eyes -->
    <ellipse cx="55" cy="44" rx="7" ry="7.5" fill="#1e1b4b"/><ellipse cx="85" cy="44" rx="7" ry="7.5" fill="#1e1b4b"/>
    <circle cx="55" cy="43" r="4" fill="#38bdf8" filter="url(#pg)"><animate attributeName="r" values="4;3;4" dur="3s" repeatCount="indefinite"/></circle>
    <circle cx="85" cy="43" r="4" fill="#38bdf8" filter="url(#pg)"><animate attributeName="r" values="4;3;4" dur="3s" repeatCount="indefinite"/></circle>
    <circle cx="53" cy="41" r="1.5" fill="#fff" opacity="0.9"/><circle cx="83" cy="41" r="1.5" fill="#fff" opacity="0.9"/>
    <!-- Mouth -->
    <path d="M58 56 Q70 64 82 56" fill="none" stroke="#1e1b4b" stroke-width="2.5" stroke-linecap="round"><animate attributeName="d" values="M58 56 Q70 64 82 56;M58 57 Q70 62 82 57;M58 56 Q70 64 82 56" dur="4s" repeatCount="indefinite"/></path>
  </g>
  <!-- Neck -->
  <rect x="62" y="68" width="16" height="6" rx="3" fill="#7c3aed"/>
  <!-- Body -->
  <g><animateTransform attributeName="transform" type="translate" values="0,0;0,-2;0,0" dur="4s" repeatCount="indefinite"/>
    <rect x="45" y="74" width="50" height="34" rx="12" fill="url(#pb)" stroke="#c9a0ff" stroke-width="1"/>
    <!-- Chest light -->
    <circle cx="70" cy="88" r="6" fill="#38bdf8" filter="url(#pg)"><animate attributeName="r" values="5;7;5" dur="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite"/></circle>
    <!-- Chest panel lines -->
    <rect x="56" y="96" width="28" height="3" rx="1.5" fill="#1e1b4b" opacity="0.3"/>
    <rect x="60" y="101" width="20" height="2" rx="1" fill="#1e1b4b" opacity="0.2"/>
  </g>
  <!-- Left Arm -->
  <g><animateTransform attributeName="transform" type="rotate" values="0,45,78;-12,45,78;0,45,78" dur="3s" repeatCount="indefinite"/>
    <rect x="22" y="76" width="22" height="11" rx="5.5" fill="#8b5cf6"/>
    <!-- Left Hand -->
    <circle cx="22" cy="81.5" r="7" fill="#c9a0ff" stroke="#8b5cf6" stroke-width="1.5"/>
    <circle cx="20" cy="79" r="1.5" fill="#7c3aed" opacity="0.5"/>
    <circle cx="24" cy="79" r="1.5" fill="#7c3aed" opacity="0.5"/>
    <circle cx="20" cy="83" r="1.5" fill="#7c3aed" opacity="0.5"/>
  </g>
  <!-- Right Arm -->
  <g><animateTransform attributeName="transform" type="rotate" values="0,95,78;15,95,78;0,95,78" dur="2.5s" repeatCount="indefinite"/>
    <rect x="96" y="76" width="22" height="11" rx="5.5" fill="#8b5cf6"/>
    <!-- Right Hand (waving) -->
    <circle cx="118" cy="81.5" r="7" fill="#c9a0ff" stroke="#8b5cf6" stroke-width="1.5"/>
    <circle cx="116" cy="79" r="1.5" fill="#7c3aed" opacity="0.5"/>
    <circle cx="120" cy="79" r="1.5" fill="#7c3aed" opacity="0.5"/>
    <circle cx="116" cy="83" r="1.5" fill="#7c3aed" opacity="0.5"/>
  </g>
  <!-- Left Leg -->
  <g><animateTransform attributeName="transform" type="rotate" values="0,60,108;5,60,108;0,60,108" dur="3s" repeatCount="indefinite"/>
    <rect x="52" y="108" width="12" height="22" rx="6" fill="url(#pl)"/>
    <!-- Left Foot -->
    <ellipse cx="58" cy="133" rx="10" ry="5" fill="#7c3aed"/>
  </g>
  <!-- Right Leg -->
  <g><animateTransform attributeName="transform" type="rotate" values="0,80,108;-5,80,108;0,80,108" dur="2.8s" repeatCount="indefinite"/>
    <rect x="76" y="108" width="12" height="22" rx="6" fill="url(#pl)"/>
    <!-- Right Foot -->
    <ellipse cx="82" cy="133" rx="10" ry="5" fill="#7c3aed"/>
  </g>
</svg>`;

// Pornchai holding clipboard — for RFQ banner
const PORNCHAI_RFQ_SVG = `<svg viewBox="0 0 140 150" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rh" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#c9a0ff"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient>
    <linearGradient id="rb" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#6d28d9"/></linearGradient>
    <filter id="rg"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <!-- Antenna -->
  <circle cx="70" cy="10" r="3.5" fill="#e0c3ff" filter="url(#rg)"><animate attributeName="r" values="2.5;4.5;2.5" dur="2s" repeatCount="indefinite"/></circle>
  <line x1="70" y1="13" x2="70" y2="23" stroke="#c9a0ff" stroke-width="2" stroke-linecap="round"/>
  <!-- Head (slight tilt) -->
  <g transform="rotate(-3,70,42)">
    <animateTransform attributeName="transform" type="rotate" values="-3,70,42;-1,70,42;-3,70,42" dur="4s" repeatCount="indefinite" additive="sum"/>
    <rect x="40" y="23" width="60" height="40" rx="13" fill="url(#rh)" stroke="#e9d5ff" stroke-width="1"/>
    <rect x="34" y="34" width="7" height="11" rx="3.5" fill="#7c3aed" opacity="0.7"/>
    <rect x="99" y="34" width="7" height="11" rx="3.5" fill="#7c3aed" opacity="0.7"/>
    <ellipse cx="56" cy="40" rx="6" ry="6.5" fill="#1e1b4b"/><circle cx="56" cy="39" r="3.5" fill="#38bdf8" filter="url(#rg)"><animate attributeName="r" values="3.5;2.5;3.5" dur="3s" repeatCount="indefinite"/></circle>
    <ellipse cx="84" cy="40" rx="6" ry="6.5" fill="#1e1b4b"/><circle cx="84" cy="39" r="3.5" fill="#38bdf8" filter="url(#rg)"><animate attributeName="r" values="3.5;2.5;3.5" dur="3s" repeatCount="indefinite" begin="0.5s"/></circle>
    <circle cx="54" cy="37.5" r="1.2" fill="#fff" opacity="0.9"/><circle cx="82" cy="37.5" r="1.2" fill="#fff" opacity="0.9"/>
    <path d="M60 52 Q70 58 80 52" fill="none" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round"><animate attributeName="d" values="M60 52 Q70 58 80 52;M60 53 Q70 56 80 53;M60 52 Q70 58 80 52" dur="4s" repeatCount="indefinite"/></path>
  </g>
  <!-- Neck -->
  <rect x="63" y="63" width="14" height="5" rx="2.5" fill="#7c3aed"/>
  <!-- Body -->
  <rect x="46" y="68" width="48" height="32" rx="10" fill="url(#rb)" stroke="#c9a0ff" stroke-width="0.8"/>
  <circle cx="70" cy="82" r="4.5" fill="#38bdf8" filter="url(#rg)"><animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite"/></circle>
  <!-- Left arm holding clipboard -->
  <g>
    <animateTransform attributeName="transform" type="rotate" values="0,46,72;-3,46,72;0,46,72" dur="3s" repeatCount="indefinite"/>
    <!-- Upper arm -->
    <rect x="24" y="71" width="22" height="10" rx="5" fill="#8b5cf6"/>
    <!-- Forearm pointing down-forward (holding clipboard) -->
    <rect x="16" y="78" width="10" height="20" rx="5" fill="#8b5cf6"/>
    <!-- Hand -->
    <circle cx="21" cy="98" r="5.5" fill="#c9a0ff" stroke="#8b5cf6" stroke-width="1"/>
    <!-- Clipboard -->
    <g>
      <rect x="4" y="86" width="26" height="34" rx="3" fill="#f5f3ff" stroke="#a78bfa" stroke-width="1.2"/>
      <!-- Clipboard clip -->
      <rect x="12" y="83" width="10" height="6" rx="2" fill="#7c3aed"/>
      <!-- Lines on clipboard -->
      <line x1="9" y1="95" x2="25" y2="95" stroke="#c9a0ff" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="9" y1="100" x2="22" y2="100" stroke="#ddd6fe" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="9" y1="105" x2="24" y2="105" stroke="#ddd6fe" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="9" y1="110" x2="18" y2="110" stroke="#ddd6fe" stroke-width="1.2" stroke-linecap="round"/>
      <!-- Checkmarks -->
      <path d="M7 94.5 l1.5 1.5 3-3" fill="none" stroke="#4ade80" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M7 99.5 l1.5 1.5 3-3" fill="none" stroke="#4ade80" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M7 104.5 l1.5 1.5 3-3" fill="none" stroke="#c9a0ff" stroke-width="1.2" stroke-linecap="round"/>
      <!-- Pen icon -->
      <circle cx="23" cy="113" r="2" fill="#f59e0b"><animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/></circle>
    </g>
  </g>
  <!-- Right arm (waving/pointing) -->
  <g>
    <animateTransform attributeName="transform" type="rotate" values="0,94,72;12,94,72;0,94,72" dur="2.5s" repeatCount="indefinite"/>
    <rect x="94" y="71" width="22" height="10" rx="5" fill="#8b5cf6"/>
    <circle cx="116" cy="76" r="5.5" fill="#c9a0ff" stroke="#8b5cf6" stroke-width="1"/>
    <!-- Thumb up -->
    <rect x="113" y="68" width="4" height="8" rx="2" fill="#c9a0ff"/>
  </g>
  <!-- Left Leg -->
  <g>
    <rect x="53" y="100" width="11" height="20" rx="5.5" fill="#6d28d9"/>
    <ellipse cx="58" cy="122" rx="9" ry="4.5" fill="#5b21b6"/>
  </g>
  <!-- Right Leg -->
  <g>
    <rect x="76" y="100" width="11" height="20" rx="5.5" fill="#6d28d9"/>
    <ellipse cx="82" cy="122" rx="9" ry="4.5" fill="#5b21b6"/>
  </g>
</svg>`;

// Pornchai "Thinking" head — used in calc loading overlay
const PORNCHAI_THINK_SVG = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tkH" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#d8b4fe"/><stop offset="50%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient>
    <linearGradient id="tkV" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#312e81"/><stop offset="100%" stop-color="#1e1b4b"/></linearGradient>
    <filter id="tkG"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <!-- Antenna -->
  <line x1="60" y1="8" x2="60" y2="22" stroke="#a78bfa" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="60" cy="5" r="4" fill="#e0c3ff" filter="url(#tkG)">
    <animate attributeName="r" values="3.5;5.5;3.5" dur="1.5s" repeatCount="indefinite"/>
    <animate attributeName="fill" values="#e0c3ff;#fff;#e0c3ff" dur="1.5s" repeatCount="indefinite"/>
  </circle>
  <!-- Head -->
  <rect x="14" y="22" width="92" height="68" rx="22" fill="url(#tkH)" stroke="#e9d5ff" stroke-width="1.5"/>
  <!-- Ears -->
  <rect x="0" y="40" width="15" height="24" rx="7" fill="#8b5cf6" stroke="#c9a0ff" stroke-width="1"/>
  <rect x="105" y="40" width="15" height="24" rx="7" fill="#8b5cf6" stroke="#c9a0ff" stroke-width="1"/>
  <circle cx="7.5" cy="52" r="3" fill="#38bdf8" opacity="0.7"><animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/></circle>
  <circle cx="112.5" cy="52" r="3" fill="#38bdf8" opacity="0.7"><animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" begin="0.3s"/></circle>
  <!-- Visor -->
  <rect x="28" y="36" width="64" height="30" rx="10" fill="url(#tkV)" stroke="#4c1d95" stroke-width="0.8"/>
  <!-- Eyes — looking up-right (thinking) -->
  <circle cx="46" cy="49" r="7.5" fill="#38bdf8" filter="url(#tkG)">
    <animate attributeName="cy" values="49;46;49;49;46;49" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="cx" values="46;50;46;46;50;46" dur="3s" repeatCount="indefinite"/>
  </circle>
  <circle cx="74" cy="49" r="7.5" fill="#38bdf8" filter="url(#tkG)">
    <animate attributeName="cy" values="49;46;49;49;46;49" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="cx" values="74;78;74;74;78;74" dur="3s" repeatCount="indefinite"/>
  </circle>
  <circle cx="46" cy="49" r="3.5" fill="#7dd3fc" opacity="0.8">
    <animate attributeName="cy" values="49;46;49;49;46;49" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="cx" values="46;50;46;46;50;46" dur="3s" repeatCount="indefinite"/>
  </circle>
  <circle cx="74" cy="49" r="3.5" fill="#7dd3fc" opacity="0.8">
    <animate attributeName="cy" values="49;46;49;49;46;49" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="cx" values="74;78;74;74;78;74" dur="3s" repeatCount="indefinite"/>
  </circle>
  <!-- Eye shine -->
  <circle cx="43" cy="46" r="2" fill="#fff" opacity="0.9">
    <animate attributeName="cy" values="46;43;46;46;43;46" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="cx" values="43;47;43;43;47;43" dur="3s" repeatCount="indefinite"/>
  </circle>
  <circle cx="71" cy="46" r="2" fill="#fff" opacity="0.9">
    <animate attributeName="cy" values="46;43;46;46;43;46" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="cx" values="71;75;71;71;75;71" dur="3s" repeatCount="indefinite"/>
  </circle>
  <!-- Mouth — thinking "hmm" flat line -->
  <path d="M48 76 Q60 74 72 76" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.7">
    <animate attributeName="d" values="M48 76 Q60 74 72 76;M48 75 Q60 78 72 75;M48 76 Q60 74 72 76" dur="4s" repeatCount="indefinite"/>
  </path>
  <!-- Thinking bubbles (top-right) -->
  <circle cx="98" cy="22" r="3" fill="#c9a0ff" opacity="0.6">
    <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="106" cy="12" r="4.5" fill="#c9a0ff" opacity="0.5">
    <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2s" repeatCount="indefinite" begin="0.3s"/>
  </circle>
  <circle cx="112" cy="2" r="2.5" fill="#c9a0ff" opacity="0.4">
    <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" begin="0.6s"/>
  </circle>
  <!-- Gears spinning around head -->
  <g opacity="0.35">
    <g transform-origin="16 18">
      <animateTransform attributeName="transform" type="rotate" values="0,16,18;360,16,18" dur="4s" repeatCount="indefinite"/>
      <text x="10" y="22" font-size="14" fill="#c9a0ff">&#x2699;</text>
    </g>
    <g transform-origin="102 92">
      <animateTransform attributeName="transform" type="rotate" values="360,102,92;0,102,92" dur="5s" repeatCount="indefinite"/>
      <text x="96" y="98" font-size="16" fill="#c9a0ff">&#x2699;</text>
    </g>
  </g>
</svg>`;

function confirmApply() {
  const data = State._lastParsedData;
  if (!data) return;
  // Prevent duplicate popup (only block if overlay is currently showing)
  if (document.getElementById('applyConfirmOverlay') || document.getElementById('applySuccessOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'applyConfirmOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease;cursor:pointer';
  overlay.innerHTML = `
      <div style="background:var(--bg-card, #fff);border-radius:20px;padding:36px 32px;max-width:420px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:fadeInUp 0.3s ease;cursor:default" onclick="event.stopPropagation()">
        <div style="width:90px;height:90px;margin:0 auto 16px;animation:successPop 0.4s ease">${PORNCHAI_SVG}</div>
        <h3 style="margin:0 0 8px;color:var(--text-primary, #1a1a2e);font-size:18px;font-weight:700">ยืนยันกรอกแบบฟอร์ม</h3>
        <p style="margin:0 0 6px;color:var(--text-secondary, #666);font-size:14px;line-height:1.6">
          Pornchai AI จะกรอกข้อมูลจาก spec<br>ลงในฟอร์ม RFQ ให้อัตโนมัติ
        </p>
        <p style="margin:0 0 24px;color:#e67e22;font-size:12px">ข้อมูลเดิมในฟอร์มจะถูกแทนที่</p>
        <div style="display:flex;gap:12px;justify-content:center">
          <button id="btnCancelApply"
            style="padding:10px 28px;border:1px solid var(--border-color, #ddd);border-radius:10px;background:var(--bg-card, #fff);color:var(--text-secondary, #666);font-size:14px;cursor:pointer;transition:all 0.2s">
            ยกเลิก
          </button>
          <button id="btnConfirmApply"
            style="padding:10px 28px;border:none;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:14px;cursor:pointer;font-weight:600;transition:all 0.2s;box-shadow:0 4px 15px rgba(124,58,237,0.35)">
            <i class="fas fa-check"></i> ยืนยัน กรอกเลย
          </button>
        </div>
      </div>`;
  document.body.appendChild(overlay);

  // Event listeners
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('btnCancelApply').addEventListener('click', () => overlay.remove());
  document.getElementById('btnConfirmApply').addEventListener('click', () => doApply());
}

async function doApply() {
  const confirmEl = document.getElementById('applyConfirmOverlay');
  if (confirmEl) confirmEl.remove();

  await applyAgentData(State._lastParsedData);

  // Post-apply: run local rules on original spec text to catch foil/emboss/coating that LLM may have missed
  if (State._lastSpecText) {
    const extraResult = handleFormModifyCommand(State._lastSpecText);
    if (extraResult.startsWith('✅')) console.log('[PostApply] Extra fields caught:', extraResult);
  }

  const success = document.createElement('div');
  success.id = 'applySuccessOverlay';
  success.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease';
  success.innerHTML = `
      <div style="background:var(--bg-card, #fff);border-radius:20px;padding:36px 32px 28px;max-width:360px;width:85%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:fadeInUp 0.3s ease">
        <div style="width:100px;height:100px;margin:0 auto 12px;position:relative;animation:successPop 0.5s ease">
          ${PORNCHAI_SVG}
          <div style="position:absolute;bottom:-2px;right:-2px;width:32px;height:32px;background:linear-gradient(135deg,#10b981,#34d399);border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid var(--bg-card, #fff);box-shadow:0 2px 8px rgba(16,185,129,0.4)">
            <i class="fas fa-check" style="color:#fff;font-size:14px"></i>
          </div>
        </div>
        <h3 style="margin:0 0 8px;color:var(--text-primary, #1a1a2e);font-size:20px;font-weight:700">กรอกข้อมูลสำเร็จ!</h3>
        <p style="margin:0 0 4px;color:var(--text-secondary, #666);font-size:14px">Pornchai AI กรอกข้อมูลลงฟอร์มให้แล้ว</p>
        <p style="margin:0;color:#e67e22;font-size:13px">กรุณาตรวจสอบข้อมูลก่อนบันทึก</p>
      </div>`;
  document.body.appendChild(success);

  // Auto-close after 2 seconds
  setTimeout(() => {
    if (success.parentNode) {
      success.style.animation = 'fadeIn 0.3s ease reverse';
      setTimeout(() => { if (success.parentNode) success.remove(); }, 280);
    }
  }, 2000);
}

// Apply parsed data AND immediately start ask-back flow for missing fields
async function applyAndAskBack() {
  const data = State._lastParsedData;
  if (!data) return;

  // Apply the parsed data to the form first
  await applyAgentData(data);
  renderForm();

  addChatMsg('กรอกข้อมูลจาก spec แล้ว ตรวจพบข้อมูลที่ยังขาด — Pornchai AI จะถามทีละรายการครับ', 'agent');

  // Trigger fill flow for missing fields
  setTimeout(() => {
    const missing = checkMissingFields(State.form);
    if (missing.length === 0) {
      addChatMsg('ข้อมูลครบแล้วครับ! ไม่มีรายการที่ต้องกรอกเพิ่ม ✅', 'agent');
      return;
    }
    const queue = missing.map(m => buildFillQuestion(m));
    State._fillFlow = { active: true, queue, currentIndex: 0 };
    addChatMsg(`พบข้อมูลที่ขาดอีก ${queue.length} รายการ จะถามทีละข้อครับ`, 'agent');
    askNextFillQuestion();
  }, 500);
}

// === HELPER FUNCTIONS for applyAgentData ===

function normalizeAddonType(type) {
  if (!type) return 'coating';
  const t = type.toLowerCase();
  if (t.includes('coat')) return 'coating';
  if (t.includes('foil')) return 'foilstamp';
  if (t.includes('emboss') || t.includes('นูน')) return 'emboss';
  if (t.includes('deboss') || t.includes('จม')) return 'deboss';
  return type;
}

function getAddonDefaultName(type) {
  return { coating: 'Coating', foilstamp: 'Foil stamp', emboss: 'Emboss', deboss: 'Deboss' }[type] || type;
}

// Format addon array into human-readable summary text
function formatAddonSummary(addons) {
  if (!addons || addons.length === 0) return 'ไม่มี';
  return addons.map(a => {
    if (a.type === 'coating') {
      const opt = a.info?.coating_option ? a.info.coating_option + ' ' : '';
      const typ = a.info?.type || a.info?.coating_type || 'เคลือบ';
      const side = a.info?.side ? ' ' + a.info.side + ' s' : '';
      return opt + typ + side;
    }
    if (a.type === 'foilstamp') {
      const color = a.info?.foil_color || '';
      const code = a.info?.foil_code ? `(${a.info.foil_code})` : '';
      const sizes = (a.info?.sizes || []).map(s => `${s.w}"x${s.l}"`).join(', ');
      return `ปั๊มฟอยล์ ${color}${code}${sizes ? ' ' + sizes : ''}`.trim();
    }
    if (a.type === 'emboss') {
      const sizes = (a.info?.sizes || []).map(s => `${s.w}"x${s.l}"`).join(', ');
      return `ปั๊มนูน${sizes ? ' ' + sizes : ''}`;
    }
    if (a.type === 'deboss') {
      const sizes = (a.info?.sizes || []).map(s => `${s.w}"x${s.l}"`).join(', ');
      return `ปั๊มจม${sizes ? ' ' + sizes : ''}`;
    }
    return a.name || a.type;
  }).join(', ');
}

function matchBoxTemplate(base, searchText) {
  const templates = State.masters['boxtemplate_info'] || [];
  if (!templates.length || !searchText) return;
  const s = searchText.toLowerCase().trim();
  // ⚠️ เข้มงวด: คำคลุมเครืออย่าง "tray", "cover", "lid", "box" → คืนค่าโดยไม่ match
  // เพราะมีหลาย template ที่ใช้คำนี้ได้
  const ambiguousTerms = ['tray', 'cover', 'lid', 'box', 'กล่อง', 'ฝา', 'ถาด'];
  if (ambiguousTerms.includes(s)) {
    console.log('[matchBoxTemplate] ambiguous term "' + s + '" — skipping auto-match');
    return;
  }
  // Match เฉพาะ exact match หรือ template name อยู่ใน searchText (ไม่ใช่กลับกัน)
  const found = templates.find(bt => {
    const tn = (bt.type_name || '').toLowerCase();
    const tnth = (bt.type_name_th || '').toLowerCase();
    // exact match
    if (tn === s || tnth === s) return true;
    // template name (ยาว) อยู่ใน searchText (สั้นกว่า) → ยอมรับ
    // เช่น search "Reverse Tuck End Box" จะ match "reverse tuck end"
    if (tn.length >= 8 && s.includes(tn)) return true;
    if (tnth.length >= 8 && s.includes(tnth)) return true;
    return false;
  });
  if (found) {
    console.log('[matchBoxTemplate] matched "' + s + '" → type ' + found.type_id + ' (' + found.type_name + ')');
    base.box_type.type_id = found.type_id;
    base.box_type.type_name = found.type_name;
    if (found.glued_spot !== undefined) base.box_type.glued_spot = found.glued_spot;
    if (found.packing_layer !== undefined) base.box_type.packing_layer = found.packing_layer;
  }
}

function matchCoatingType(addon, searchText) {
  const coatings = State.masters['coating_info'] || [];
  if (!coatings.length || !searchText) return;

  // === Alias mapping: ชื่อที่ AE ใช้ → coating_code + side ===
  // Normalize search text first (fix typos like เว้นลิ้่น → เว้นลิ้น)
  const searchNorm = searchText.replace(/ลิ้่น|ลิ้น|ลิ้่น/g, 'ลิ้น');
  const COATING_ALIASES = [
    { patterns: /hi.?rub.*(?:wb|waterbase).*(?:เว้นลิ้น|เว้นลิ้)/i, code: 'WTB-HR', side: 1, name: 'Hi-rub WB เว้นลิ้น' },
    { patterns: /(?:เว้นลิ้น|เว้นลิ้).*hi.?rub/i, code: 'WTB-HR', side: 1, name: 'Hi-rub WB เว้นลิ้น' },
    { patterns: /hi.?rub.*เว้นยิง|เว้นยิง.*lot/i, code: 'S-WTB-HR', side: 1, name: 'Hi-rub WB เว้นยิง Lot No.' },
    { patterns: /uv.*(?:เว้นลิ้น|เว้นลิ้)/i, code: 'UV_GAP', side: 1, name: 'UV เว้นลิ้น' },
    { patterns: /(?:เว้นลิ้น|เว้นลิ้).*uv/i, code: 'UV_GAP', side: 1, name: 'UV เว้นลิ้น' },
    // PVC = OPP ในระบบ (AE เรียก PVC แต่ DB ใช้ OPP)
    { patterns: /pvc.*เงา|pvc.*gloss/i, code: 'OPP', side: 1, name: 'OPP Gloss (PVC เงา)' },
    { patterns: /pvc.*ด้าน|pvc.*matt/i, code: 'OPP', side: 1, name: 'OPP Matt (PVC ด้าน)' },
    { patterns: /\bpvc\b/i, code: 'OPP', side: 1, name: 'OPP (PVC)' },
  ];
  for (const alias of COATING_ALIASES) {
    if (alias.patterns.test(searchNorm)) {
      const found = coatings.find(c => c.coating_code === alias.code);
      if (found) {
        addon.info.type = found.coating_type || alias.name;
        addon.info.coating_code = found.coating_code;
        addon.info.coating_option = found.coating_option || '';
        addon.info.side = alias.side;
        addon.type_id = found.type_id || found.process_id || '';
        addon.process_id = found.process_id || '';
        addon._matchConfidence = 'matched';
        return;
      }
    }
  }

  // Strip "coating" prefix for matching, keep side suffix for later
  let s = searchText.toLowerCase().replace(/^coating\s+/i, '').trim();
  // Extract side (1 s / 2 s) from search text
  const sideMatch = s.match(/(\d)\s*s\s*$/);
  const searchSide = sideMatch ? parseInt(sideMatch[1]) : 0;
  const sCore = s.replace(/\s+\d\s*s\s*$/, '').trim();
  // Normalize Thai chars
  const sNorm = sCore.replace(/ลิ้่น|ลิ้น/g, 'เว้นลิ้น');
  // Helper: get coating display name from any field
  const getName = (c) => (c.coating_type || c.process_name || c.name || '').toLowerCase().trim();

  // === Strategy: Score ALL coatings and pick best match ===
  let bestScore = -1;
  let found = null;

  // Extract important keywords from search
  const searchKeywords = sCore.split(/[\s,\-]+/).filter(k => k.length > 1);

  coatings.forEach(c => {
    const cName = getName(c);
    const cCode = (c.coating_code || '').toLowerCase();
    let score = 0;

    // Exact match = highest priority
    if (cName === sCore || cName === sNorm || cName === s) { score += 100; }

    // Keyword overlap scoring
    searchKeywords.forEach(k => { if (cName.includes(k) || cCode.includes(k)) score += 2; });

    // Check reverse: coating name keywords found in search text
    const coatingKeywords = cName.split(/[\s,\-]+/).filter(k => k.length > 1);
    coatingKeywords.forEach(k => { if (sCore.includes(k)) score += 2; });

    // Penalty: coating has keywords NOT in search (ตัวที่ยาวกว่าแต่ไม่ตรง)
    coatingKeywords.forEach(k => { if (!sCore.includes(k) && k.length > 2) score -= 1; });
    // Penalty: search has keywords NOT in coating (ตัวสั้นเกินไป ขาดคำสำคัญ)
    searchKeywords.forEach(k => { if (!cName.includes(k) && !cCode.includes(k) && k.length > 2) score -= 1; });

    // Key term boosters
    if (sCore.includes('hi-rub') || sCore.includes('hirub') || sCore.includes('hi rub')) {
      if (cName.includes('hi-rub') || cName.includes('hirub')) score += 5;
      else score -= 3; // ค้นหา hi-rub แต่ coating ไม่มี = penalty
    }
    // Gloss/Matt: match against both coating_type name AND coating_option
    const cOpt = (c.coating_option || '').toLowerCase();
    if (sCore.includes('gloss')) {
      if (cName.includes('gloss') || cOpt === 'gloss') score += 3;
      if (cOpt === 'matt') score -= 2; // penalty for wrong option
    }
    // แยก "gloss" vs "hi-gloss" — ถ้า search ไม่มี "hi" แต่ coating มี "hi-gloss" = penalty
    if (!sCore.includes('hi') && cName.includes('hi-gloss')) score -= 4;
    if (sCore.includes('hi-gloss') && cName.includes('hi-gloss')) score += 5;
    if (sCore.includes('hi-gloss') && !cName.includes('hi-gloss')) score -= 3;
    if (sCore.includes('matte') || sCore.includes('matt')) {
      if (cName.includes('matt') || cOpt === 'matt') score += 3;
      if (cOpt === 'gloss') score -= 2;
    }
    if (sCore.includes('uv') && cName.includes('uv')) score += 3;
    if (sCore.includes('uv') && !cName.includes('uv')) score -= 3;
    if (sCore.includes('pvc') && (cName.includes('opp') || cName.includes('pvc'))) score += 3;
    if (sCore.includes('opp') && cName.includes('opp')) score += 3;
    if (sCore.includes('waterbase') || sCore.includes('wb')) {
      if (cName.includes('waterbase') || cName.includes('wb')) score += 2;
    }
    if (sCore.includes('spot') && cName.includes('spot')) score += 3;
    if (sCore.includes('spot') && !cName.includes('spot')) score -= 2;
    if (sCore.includes('semi') && cName.includes('semi')) score += 3;
    if (sCore.includes('drip') && cName.includes('drip')) score += 3;
    if (sCore.includes('food') && cName.includes('food')) score += 3;
    if (sCore.includes('blister') && cName.includes('blister')) score += 3;
    if (sCore.includes('window') && cName.includes('window')) score += 3;
    if (sCore.includes('softouch') && cName.includes('softouch')) score += 3;

    // เว้นลิ้น / เว้นยิง differentiation
    if (sCore.includes('เว้นลิ้น') && cName.includes('เว้นลิ้น')) score += 3;
    if (sCore.includes('เว้นลิ้น') && cName.includes('เว้นยิง')) score -= 5;
    if (sCore.includes('เว้นยิง') && cName.includes('เว้นยิง')) score += 3;

    if (score > bestScore) { bestScore = score; found = c; }
  });
  if (bestScore <= 0) found = null;
  if (found) {
    addon.info.type = found.coating_type || found.process_name || found.name || '';
    addon.info.coating_code = found.coating_code || '';
    addon.info.coating_option = found.coating_option || '';
    addon.type_id = found.type_id || found.process_id || '';
    addon.process_id = found.process_id || '';
    // ตั้ง side จาก search text (1 s / 2 s)
    if (searchSide) addon.info.side = searchSide;
    addon._matchConfidence = 'matched';
  } else {
    // ไม่เจอใน DB — เก็บ warning ไว้แสดง
    addon._matchConfidence = 'not_found';
    addon._searchText = searchText;
  }
}

function matchFoilColor(addon, colorSearch) {
  const foils = State.masters['foilstamp_info'] || [];
  if (!foils.length || !colorSearch) return;
  const s = colorSearch.toLowerCase().trim();

  // Alias mapping TH ↔ EN สำหรับสี Foil
  const FOIL_ALIASES = [
    { patterns: /เงินเงา|silver.*gloss|เงา.*เงิน/i, search: 'เงินเงา' },
    { patterns: /เงินด้าน|silver.*matt|ด้าน.*เงิน/i, search: 'เงินด้าน' },
    { patterns: /ทองเข้ม|dark.*gold|gold.*dark/i, search: 'ทองเข้ม' },
    { patterns: /ทองอ่อน|light.*gold|gold.*light/i, search: 'ทองอ่อน' },
    { patterns: /ทองกลาง|gold|medium.*gold/i, search: 'ทองกลาง' },
    { patterns: /ทองกลางด้าน|gold.*matt/i, search: 'ทองกลางด้าน' },
    { patterns: /ทองแดงอ่อน|rose.*gold|copper.*light/i, search: 'ทองแดงอ่อน' },
    { patterns: /ทองแดง|copper|bronze/i, search: 'ทองแดง' },
    { patterns: /แดง|red/i, search: 'แดง' },
    { patterns: /น้ำเงิน|blue|สีน้ำเงิน/i, search: 'สีน้ำเงิน' },
    { patterns: /ชมพู.*ม่วง|pink.*purple/i, search: 'ชมพูอมม่วง' },
    { patterns: /ขาว|white/i, search: 'ขาว' },
    { patterns: /ใส|clear|transparent/i, search: 'ใส' },
    { patterns: /โฮโลแกรม|hologram/i, search: 'โฮโลแกรม' },
    { patterns: /ชมพูด้าน|pink.*matt/i, search: 'ชมพูด้าน' },
    { patterns: /เงิน|silver/i, search: 'เงินเงา' }, // default เงิน = เงินเงา
    { patterns: /ทอง|gold/i, search: 'ทองกลาง' }, // default ทอง = ทองกลาง
  ];

  // หาจาก alias ก่อน
  let searchKey = s;
  for (const alias of FOIL_ALIASES) {
    if (alias.patterns.test(colorSearch)) { searchKey = alias.search; break; }
  }

  // ค้นหาใน master data — ใช้ color_th เป็นหลัก
  let found = foils.find(f => (f.color_th || '').toLowerCase() === searchKey);
  if (!found) found = foils.find(f => (f.color_th || '').toLowerCase().includes(searchKey));
  if (!found) found = foils.find(f => (f.color_th || f.color || '').toLowerCase().includes(s));

  if (found) {
    addon.info.foil_color = found.color_th || found.color || '';
    addon.info.foil_code = found.code || found.foil_code || '';
    addon.info.foil_roll_price = found.roll_price || '';
    addon.info.foil_width = found.width || '';
    addon.info.foil_length = found.length || '';
  }
}

async function autoSearchAE(keyword) {
  try {
    const results = await apiGet('/api/employees/search?term=' + encodeURIComponent(keyword));
    if (results && results.length > 0) {
      const e = results[0];
      State.form.ae = {
        emp_id: e.id || e.emp_id || '',
        emp_name: e.label || e.value || ((e.id || '') + ': ' + (e.name || ''))
      };
      // Refresh missing fields and re-render
      State._missingFields = checkMissingFields(State.form);
      renderForm();
    }
  } catch (err) {
    console.log('AE search failed:', err.message);
  }
}

async function autoSearchCustomer(keyword) {
  try {
    const results = await apiGet('/api/estimate/autocomplete?type=customer&term=' + encodeURIComponent(keyword));
    if (results && results.length > 0) {
      const c = results[0];
      State.form.customer = {
        customer_id: c.customer_id || c.id || '',
        customer_name: (c.customer_id || '') + ': ' + (c.customer_name || c.label || c.name || '')
      };
      State.form.new_customer = false;
      // Load credit term
      if (c.customer_id) {
        try {
          const detail = await apiGet('/api/customer/' + c.customer_id);
          if (detail && detail.credit_term) {
            State.form.credit_term = detail.credit_term;
            State.form.credit_term_id = detail.credit_term_id || '';
          }
        } catch {}
      }
      State._missingFields = checkMissingFields(State.form);
      renderForm();
    } else {
      // Customer not found → tick "ลูกค้าใหม่"
      State.form.new_customer = true;
      State.form.customer = { customer_id: 'C9999998', customer_name: 'C9999998: ลูกค้าใหม่' };
      State.form.credit_term = 'มัดจำ 100% ก่อนพิมพ์';
      State._missingFields = checkMissingFields(State.form);
      renderForm();
    }
  } catch (e) {
    console.log('Customer search failed:', e.message);
    // On error → tick "ลูกค้าใหม่"
    State.form.new_customer = true;
    State.form.customer = { customer_id: 'C9999998', customer_name: 'C9999998: ลูกค้าใหม่' };
    State.form.credit_term = 'มัดจำ 100% ก่อนพิมพ์';
    State._missingFields = checkMissingFields(State.form);
    renderForm();
  }
}

// ============================================================
// CONNECTION CHECK
// ============================================================
async function checkConnections() {
  try {
    const data = await apiGet('/api/health');
    $('connEstimate').className = data.estimate ? 'conn-badge ok' : 'conn-badge fail';
    $('connEstimate').innerHTML = '<span class="dot"></span> Estimate API';
    $('connGateway').className = data.gateway ? 'conn-badge ok' : 'conn-badge fail';
    $('connGateway').innerHTML = '<span class="dot"></span> AI Agent';
    if (data.user) {
      State.user = data.user; // เก็บข้อมูล user สำหรับ AI Chat
      $('userName').textContent = ` ${data.user.emp_name} (${data.user.emp_id})`;
      $('userInfo').style.display = 'inline';
    } else {
      $('userInfo').style.display = 'none';
    }
  } catch {
    $('connEstimate').className = 'conn-badge fail';
    $('connGateway').className = 'conn-badge fail';
    $('userInfo').style.display = 'none';
  }
}

// ============================================================
// DEMO / MOCK DATA - สำหรับทดสอบ
// ============================================================
const DEMO_SCENARIOS = [
  {
    name: 'กล่องเครื่องสำอาง IMAGO',
    aeMessage: 'ลูกค้า IMAGO PUBLISHING สั่งกล่องครีมบำรุงผิว รุ่น Glow Serum 30ml\nจำนวน 5,000 / 10,000 / 20,000 ชิ้น\nกล่อง Folding Carton กระดาษ C1S 300 แกรม\nขนาด 45 x 45 x 120 mm\nพิมพ์ 4 สี ด้านนอก ด้านในไม่พิมพ์\nเคลือบด้าน + ปั๊มฟอยล์ทอง\nส่งโรงงานลูกค้าที่ บางพลี',
    agentReply: `รับทราบครับ ผมสรุปข้อมูลให้ดังนี้:

ชื่องาน: กล่องครีม Glow Serum 30ml - IMAGO
ลูกค้า: IMAGO PUBLISHING
จำนวน: 5,000 / 10,000 / 20,000 ชิ้น
กล่อง: Folding Carton, C1S 300g
ขนาด: 45 x 45 x 120 mm
สีพิมพ์: 4/0 (4 สีนอก / ไม่พิมพ์ใน)
กระบวนการ: เคลือบด้าน, ปั๊มฟอยล์ทอง
ส่ง: บางพลี

ผมกรอกแบบฟอร์มให้แล้วครับ กดปุ่มด้านล่างเพื่อ apply ข้อมูลเข้าฟอร์ม`,
    formData: {
      job_name: 'กล่องครีม Glow Serum 30ml - IMAGO',
      customer: { customer_id: 'C1020001', customer_name: 'IMAGO PUBLISHING' },
      ae: { emp_id: '2690006', emp_name: 'ธนรัช ชื้อผาสุข' },
      qty: { qty1: '5000', qty2: '10000', qty3: '20000' },
      components: [{
        component_name: 'กล่องหลัก',
        box_type: 'Folding Carton',
        packaging_size: { width: '45', length: '45', depth: '120' },
        paper_code: 'C1S', paper_gram: '300',
        color_outside: '4/0',
        color_inside: '',
        f_detail: '',
      }],
      process: [
        { type: 'coating', name: 'เคลือบด้าน (Matte)' },
        { type: 'hotfoil', name: 'ปั๊มฟอยล์ทอง' },
      ],
      delivery: [{ destination: 'โรงงานลูกค้า บางพลี' }],
    },
  },
  {
    name: 'กล่องอาหารเสริม 2 Components',
    aeMessage: 'ลูกค้า ลานนาเกษตรอุตสาหกรรม สั่งกล่องอาหารเสริม VitaPro Complex\nมี 2 ชิ้นส่วน: กล่องนอก + ถาดใน\nกล่องนอก: Folding Carton C2S 350g ขนาด 80x120x180mm พิมพ์ CMYK+2 spot/ไม่พิมพ์ใน\nถาดใน: Rigid Box กระดาษ Kraft 250g ขนาด 75x115x170mm ไม่พิมพ์\nจำนวน 3,000 / 5,000 / 8,000\nเคลือบด้าน + UV เฉพาะจุด + ปั๊มนูน กล่องนอก\nส่ง 2 รอบ: รอบแรก สำนักงานใหญ่ 60% รอบสอง คลังสินค้า นวนคร 40%',
    agentReply: `รับทราบครับ งานนี้มี 2 components ผมสรุปให้:

ชื่องาน: กล่องอาหารเสริม VitaPro Complex
ลูกค้า: ลานนาเกษตรอุตสาหกรรม
จำนวน: 3,000 / 5,000 / 8,000 ชิ้น

Component 1 - กล่องนอก:
  Folding Carton, C2S 350g, 80x120x180mm
  พิมพ์ CMYK+2 spot / ไม่พิมพ์ใน

Component 2 - ถาดใน:
  Rigid Box, Kraft 250g, 75x115x170mm
  ไม่พิมพ์

กระบวนการ: เคลือบด้าน, UV เฉพาะจุด, ปั๊มนูน
จัดส่ง 2 รอบ: สำนักงานใหญ่ + คลังนวนคร

ผมกรอกให้แล้วครับ ตรวจสอบได้เลย`,
    formData: {
      job_name: 'กล่องอาหารเสริม VitaPro Complex - ลานนา',
      customer: { customer_id: 'C003', customer_name: 'บริษัท ลานนาเกษตรอุตสาหกรรม จำกัด' },
      ae: { emp_id: '2690006', emp_name: 'ธนรัช ชื้อผาสุข' },
      qty: { qty1: '3000', qty2: '5000', qty3: '8000' },
      components: [
        {
          component_name: 'กล่องนอก',
          box_type: 'Folding Carton',
          packaging_size: { width: '80', length: '120', depth: '180' },
          paper_code: 'C2S', paper_gram: '350',
          color_outside: 'CMYK+2 spot',
          color_inside: '',
          f_detail: '',
        },
        {
          component_name: 'ถาดใน',
          box_type: 'Rigid Box',
          packaging_size: { width: '75', length: '115', depth: '170' },
          paper_code: 'Kraft', paper_gram: '250',
          color_outside: '',
          color_inside: '',
          f_detail: 'ไม่พิมพ์',
        },
      ],
      process: [
        { type: 'coating', name: 'เคลือบด้าน (Matte Varnish)' },
        { type: 'coating', name: 'UV เฉพาะจุด (Spot UV)' },
        { type: 'emboss', name: 'ปั๊มนูน (Emboss)' },
      ],
      delivery: [
        { round: '1', destination: 'สำนักงานใหญ่', net_weight: '' },
        { round: '2', destination: 'คลังสินค้า นวนคร', net_weight: '' },
      ],
    },
  },
  {
    name: 'ทดสอบ AI กรอก 4 ช่อง (AE/Estimator/Job/ลูกค้าใหม่)',
    aeMessage: 'ช่วยกรอกข้อมูลให้หน่อย AE ชื่อ ธนรัช ชื้อผาสุข Estimator ชื่อ สมชาย ประเสริฐ ชื่องาน กล่องเครื่องสำอาง Test Demo แล้วก็เป็นลูกค้าใหม่ครับ',
    agentReply: `รับทราบครับ ผมกรอกข้อมูลให้ 4 รายการ:

✅ AE Name: ธนรัช ชื้อผาสุข
✅ Estimator: สมชาย ประเสริฐ
✅ Job Name: กล่องเครื่องสำอาง Test Demo
✅ ลูกค้าใหม่: ติ๊กแล้ว (C9999998 / มัดจำ 100% ก่อนพิมพ์)

กดปุ่มด้านล่างเพื่อกรอกฟอร์มครับ`,
    formData: {
      ae: { emp_id: '2690006', emp_name: 'ธนรัช ชื้อผาสุข' },
      estimator: { emp_id: 'E001', emp_name: 'สมชาย ประเสริฐ' },
      job_name: 'กล่องเครื่องสำอาง Test Demo',
      new_customer: true,
    },
  },
  {
    name: 'ซองสบู่ Simple',
    aeMessage: 'ลูกค้า สยาม ดีเอส แบตเตอรี่ สั่งซองใส่สบู่ก้อน รุ่น Pure Soap\nขนาด 100x30x80mm กระดาษ C1S 250g พิมพ์ 2 สี จำนวน 50,000 ชิ้น\nไม่มีกระบวนการพิเศษ ส่งโรงงานที่ สำนักงานใหญ่',
    agentReply: `รับทราบครับ งาน simple ผมกรอกให้เลย:

ชื่องาน: ซองสบู่ Pure Soap
ลูกค้า: สยาม ดีเอส แบตเตอรี่
จำนวน: 50,000 ชิ้น
กล่อง: Folding Carton, C1S 250g, 100x30x80mm
พิมพ์: 2/0
ส่ง: สำนักงานใหญ่

ข้อมูลครบแล้วครับ กดปุ่มด้านล่างเพื่อกรอกฟอร์ม`,
    formData: {
      job_name: 'ซองสบู่ Pure Soap - สยาม ดีเอส',
      customer: { customer_id: 'C005', customer_name: 'บริษัท สยาม ดีเอส แบตเตอรี่ จำกัด' },
      ae: { emp_id: '2690006', emp_name: 'ธนรัช ชื้อผาสุข' },
      qty: { qty1: '50000' },
      components: [{
        component_name: 'ซองสบู่',
        box_type: 'Folding Carton',
        packaging_size: { width: '100', length: '30', depth: '80' },
        paper_code: 'C1S', paper_gram: '250',
        color_outside: '2/0',
        color_inside: '',
        f_detail: '',
      }],
      delivery: [{ round: '1', destination: 'สำนักงานใหญ่', net_weight: '' }],
    },
  },
  {
    name: 'ข้อมูลจริง E26030014 (Test Layout)',
    aeMessage: 'ลูกค้า IMAGO PUBLISHING สั่งกล่อง box กระดาษ Matt Art 128gsm\nขนาด 178x305mm (Custom) พิมพ์ 4 สี Offset UV\nจำนวน 7,500 ชิ้น ติดกาว 15mm ฝาเสียบ 15mm\nส่งลูกค้ามารับเอง',
    agentReply: `ข้อมูลจาก RFQ E26030014 (ของจริง):

ชื่องาน: Test 001
ลูกค้า: IMAGO PUBLISHING
AE: ศรวณีย์ อ่อนน้อม
จำนวน: 7,500 ชิ้น

Component 1 - box:
  กระดาษ: MA (Matt Art) 128gsm
  สีพิมพ์: 4/0 (Offset UV)
  รูปแบบ: Type 12 Custom (178x305mm)
  ติดกาว: 15mm / ฝาเสียบ: 15mm

ข้อมูลครบพร้อมคำนวณ Layout ได้เลยครับ`,
    formData: {
      job_name: 'Test 001',
      customer_search: 'IMAGO',
      ae_search: '2640038',
      qty: ['7500'],
      ink_type: 'UV',
      print_type: 'Offset',
      is_diecut: true,
      components: [{
        component_name: 'box',
        component_type: 1,
        paper: { paper_code: 'MA', paper_gram: '128', paper_cost: 31, paper_markup: 13, paper_percent: 0, paper_source_id: '2' },
        color: { outside: '4', inside: '0' },
        box_type: { type_id: 12 },
        packaging_size: {
          width: '178', length: '305', depth: '0',
          glue_flap: '15', tuck_flap: '15', dust_flap: '0', ol: '0',
          open_w: '178', open_l: '305'
        },
      }],
      delivery: [{ destinationId: '63', destinationName: 'ลูกค้ามารับเอง' }],
    },
  },
];

function runDemo(index) {
  const demo = DEMO_SCENARIOS[index];
  if (!demo) return;

  // Open chat if not open
  if (!State.chatOpen) toggleChat();

  // Simulate AE message
  addChatMsg(demo.aeMessage, 'user');
  showTyping(true);

  // Simulate Agent thinking + response
  setTimeout(() => {
    showTyping(false);
    const applyData = JSON.stringify(demo.formData).replace(/"/g, '&quot;');
    addChatMsg(demo.agentReply, 'agent',
      `<button class="apply-btn" onclick="App.applyAgentData(JSON.parse(this.dataset.json))" data-json='${JSON.stringify(demo.formData).replace(/'/g, "&#39;")}'><i class="fas fa-magic"></i> กรอกแบบฟอร์มให้</button>`
    );
  }, 1500);
}

function showDemoMenu() {
  // Show demo selection in chat
  if (!State.chatOpen) toggleChat();
  let btns = '<div style="margin-top:8px">';
  DEMO_SCENARIOS.forEach((d, i) => {
    btns += `<button class="apply-btn" style="display:block;margin-bottom:6px;width:100%" onclick="App.runDemo(${i})"><i class="fas fa-play"></i> ${d.name}</button>`;
  });
  btns += '</div>';
  addChatMsg('เลือก scenario ทดสอบได้เลยครับ:', 'agent', btns);
}

// ============================================================
// ADVANCED SEARCH
// ============================================================
function toggleAdvSearch() {
  const panel = $('advSearchPanel');
  panel.classList.toggle('show');
}

async function advSearch() {
  const params = new URLSearchParams();
  const jobId = $('advJobId')?.value;
  const jobName = $('advJobName')?.value;
  const customer = $('advCustomer')?.value;
  const ae = $('advAE')?.value;
  const dateFrom = $('advDateFrom')?.value;
  const dateTo = $('advDateTo')?.value;
  const status = $('advStatus')?.value;

  if (jobId) params.set('job_id', jobId);
  if (jobName) params.set('job_name', jobName);
  if (customer) params.set('customer_name', customer);
  if (ae) params.set('ae_name', ae);
  if (dateFrom) params.set('start_date', dateFrom);
  if (dateTo) params.set('end_date', dateTo);
  if (status) params.set('status_id', status);
  params.set('limit', '100');

  try {
    const dc = $('dataContent');
    if (dc) dc.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> กำลังค้นหา...</div>';
    const data = await apiGet(`/api/rfq/list?${params.toString()}`);
    State.rfqList = data;
    renderRFQListInView(data);
    toast(`พบ ${data.length} รายการ`, 'success');
  } catch (e) {
    toast('ค้นหาไม่สำเร็จ: ' + e.message, 'error');
  }
}

function clearAdvSearch() {
  ['advJobId','advJobName','advCustomer','advAE','advDateFrom','advDateTo'].forEach(id => { if ($(id)) $(id).value = ''; });
  if ($('advStatus')) $('advStatus').value = '';
  if ($('rfqListSearch')) $('rfqListSearch').value = '';
  loadRFQList();
}

// ============================================================
// COPY RFQ
// ============================================================
async function copyRFQ(jobId) {
  const ok = await customConfirm({
    title: 'คัดลอก RFQ',
    message: `ต้องการคัดลอก ${jobId} เพื่อสร้าง RFQ ใหม่หรือไม่?`,
    type: 'info', icon: 'fas fa-copy', okText: 'คัดลอก', cancelText: 'ยกเลิก',
  });
  if (!ok) return;

  try {
    toast('กำลังคัดลอก...', 'info');
    const data = await apiGet(`/api/rfq/detail/${jobId}`);
    State.form = mapApiToForm(data);
    State.form.ref_copy_id = jobId;
    State.form.doc_status = 'Draft';
    State.formMode = 'create';
    State.formEditId = null;
    State.fieldSource = {};
    renderForm();
    showView('viewForm');
    setTopBar('สร้าง RFQ ใหม่ (Copy)', `คัดลอกจาก ${jobId}`);
    toast(`คัดลอก ${jobId} สำเร็จ!`, 'success');
  } catch (e) {
    toast('คัดลอกไม่สำเร็จ: ' + e.message, 'error');
  }
}

// ============================================================
// RAG — Document Knowledge Base (UI functions)
// ============================================================
async function ragUploadFiles(files) {
  if (!files || files.length === 0) return;
  const category = 'general';
  const statusEl = document.getElementById('ragStatus');

  for (const file of files) {
    if (statusEl) statusEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> กำลังอัพโหลด ${file.name}...`;
    try {
      const buffer = await file.arrayBuffer();
      const resp = await fetch('/api/rag/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Filename': encodeURIComponent(file.name),
          'X-Category': category,
          'X-Description': encodeURIComponent(file.name),
        },
        body: buffer,
      });
      const result = await resp.json();
      if (result.success) {
        toast(`อัพโหลด ${file.name} สำเร็จ! (${result.chunks_extracted} chunks)`, 'success');
        if (statusEl) statusEl.innerHTML = `✅ ${file.name}: ${result.chunks_extracted} chunks`;
      } else {
        toast(`อัพโหลดล้มเหลว: ${result.error}`, 'error');
        if (statusEl) statusEl.innerHTML = `❌ ${file.name}: ${result.error}`;
      }
    } catch (e) {
      toast(`อัพโหลดล้มเหลว: ${e.message}`, 'error');
      if (statusEl) statusEl.innerHTML = `❌ Error: ${e.message}`;
    }
  }
  // Reset file input
  const input = document.getElementById('ragFileInput');
  if (input) input.value = '';
  ragLoadDocList();
}

async function ragLoadDocList() {
  const el = document.getElementById('ragDocSummary');
  if (!el) return;
  try {
    const docs = await apiGet('/api/rag/list');
    if (!docs || docs.length === 0) {
      el.innerHTML = '';
      return;
    }
    const totalChunks = docs.reduce((s, d) => s + (d.chunk_count || 0), 0);
    el.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between">
      <span><i class="fas fa-database" style="color:var(--accent)"></i> ${docs.length} เอกสาร · ${totalChunks.toLocaleString()} chunks</span>
      <button onclick="App.ragShowDocManager()" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:11px;text-decoration:underline">จัดการ</button>
    </div>`;
  } catch (e) {
    el.innerHTML = '';
  }
}

function ragShowDocManager() {
  // Show document list in main content area
  showView('viewData');
  setTopBar('Knowledge Base', 'จัดการเอกสารสำหรับ AI');
  apiGet('/api/rag/list').then(docs => {
    const rows = (docs || []).map(d => {
      const icon = d.file_type === 'xlsx' || d.file_type === 'xls' ? 'fa-file-excel' :
                   d.file_type === 'pdf' ? 'fa-file-pdf' :
                   d.file_type === 'docx' || d.file_type === 'doc' ? 'fa-file-word' : 'fa-file-alt';
      const color = d.file_type === 'xlsx' || d.file_type === 'xls' ? '#28a745' :
                    d.file_type === 'pdf' ? '#dc3545' : '#6c757d';
      const date = d.uploaded_at ? new Date(d.uploaded_at).toLocaleString('th-TH') : '-';
      return `<tr style="border-bottom:1px solid var(--border-color)">
        <td style="padding:10px 12px;text-align:left"><i class="fas ${icon}" style="color:${color};margin-right:6px"></i>${d.filename}</td>
        <td style="padding:10px 12px;text-align:center">${d.chunk_count}</td>
        <td style="padding:10px 12px;text-align:center">${date}</td>
        <td style="padding:10px 12px;text-align:center"><button onclick="App.ragDeleteDoc('${d.id}','${d.filename.replace(/'/g, "\\'")}');App.ragShowDocManager()" class="btn btn-danger" style="font-size:11px;padding:3px 10px"><i class="fas fa-trash"></i> ลบ</button></td>
      </tr>`;
    }).join('');
    const totalChunks = (docs || []).reduce((s, d) => s + (d.chunk_count || 0), 0);
    $('dataContent').innerHTML = `<div style="max-width:800px;margin:0 auto;padding:24px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h4 style="margin:0"><i class="fas fa-brain" style="color:var(--accent)"></i> Knowledge Base</h4>
        <button class="text-btn" onclick="App.showToolsTab()"><i class="fas fa-arrow-left"></i> กลับ Tools</button>
      </div>
      <div style="text-align:center;margin-bottom:24px">
        <p style="font-size:13px;color:var(--text-muted);margin:6px 0 0">เอกสารที่อัพโหลดจะถูก AI ใช้ค้นหาข้อมูลเมื่อไม่พบในฐานข้อมูลหลัก</p>
        <div style="font-size:12px;color:var(--accent);margin-top:4px;font-weight:600">${docs.length} เอกสาร · ${totalChunks.toLocaleString()} chunks</div>
      </div>
      ${docs.length === 0 ? '<div style="text-align:center;padding:40px;color:var(--text-muted)">ยังไม่มีเอกสาร — อัพโหลดได้ที่แถบ Tools ด้านซ้าย</div>' :
      `<table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="background:var(--bg-main);border-bottom:2px solid var(--accent)">
          <th style="padding:10px 12px;text-align:left">ไฟล์</th>
          <th style="padding:10px 12px;text-align:center">Chunks</th>
          <th style="padding:10px 12px;text-align:center">อัพโหลดเมื่อ</th>
          <th style="padding:10px 12px;text-align:center;width:80px"></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`}
    </div>`;
  });
}

async function ragDeleteDoc(docId, filename) {
  if (!confirm(`ลบเอกสาร "${filename}" ?`)) return;
  try {
    await fetch(`/api/rag/${docId}`, { method: 'DELETE' });
    toast(`ลบ ${filename} แล้ว`, 'success');
    ragLoadDocList();
  } catch (e) {
    toast('ลบไม่สำเร็จ', 'error');
  }
}

// Search RAG from Business Rules Engine
async function ragSearchPrice(paperCode, gram) {
  try {
    const resp = await apiGet(`/api/rag/price?paper_code=${encodeURIComponent(paperCode)}&gram=${gram}`);
    return resp?.results || [];
  } catch { return []; }
}

async function ragSearch(query) {
  try {
    const resp = await apiGet(`/api/rag/search?q=${encodeURIComponent(query)}`);
    return resp?.results || [];
  } catch { return []; }
}

// ============================================================
// EXPORT EXCEL
// ============================================================
function exportExcel() {
  if (!State.rfqList.length) { toast('ไม่มีข้อมูลให้ Export', 'error'); return; }
  if (typeof XLSX === 'undefined') { toast('กำลังโหลด Excel library...', 'info'); return; }

  const rows = State.rfqList.map(item => ({
    'Job ID': item.job_id,
    'Job Name': item.job_name,
    'Customer': item.customer,
    'AE': item.ae,
    'Qty': item.qty,
    'Total Price': item.total_price,
    'Unit Price': item.unit_price,
    'Status': item.status || 'Draft',
    'Created': item.created,
    //'Profit Sharing': item.is_profit_sharing ? 'Yes' : 'No',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'RFQ List');

  // Auto column widths
  const colWidths = Object.keys(rows[0]).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String(r[key] || '').length)) + 2
  }));
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, `RFQ_List_${new Date().toISOString().split('T')[0]}.xlsx`);
  toast('Export Excel สำเร็จ!', 'success');
}

// ============================================================
// DOCUMENT STATUS WORKFLOW
// ============================================================
async function changeStatus(jobId, newStatus, remark = '') {
  try {
    const payload = { rfq_id: jobId, status: newStatus };
    if (remark) payload.remark = remark;
    await apiPost('/api/estimate/save_rfq', payload);
    toast(`เปลี่ยนสถานะเป็น ${newStatus} สำเร็จ`, 'success');
    loadRFQList();
    viewDetail(jobId);
  } catch (e) {
    toast('เปลี่ยนสถานะไม่สำเร็จ: ' + e.message, 'error');
  }
}

async function requestApprove(jobId) {
  const ok = await customConfirm({
    title: 'ส่งขออนุมัติ',
    message: `ต้องการส่ง ${jobId} เพื่อขออนุมัติหรือไม่?`,
    type: 'warning', icon: 'fas fa-paper-plane', okText: 'ส่งขออนุมัติ', cancelText: 'ยกเลิก',
  });
  if (ok) changeStatus(jobId, 'Pending');
}

async function approveRFQ(jobId) {
  const ok = await customConfirm({
    title: 'อนุมัติ RFQ',
    message: `ต้องการอนุมัติ ${jobId} หรือไม่?`,
    type: 'info', icon: 'fas fa-check-circle', okText: 'อนุมัติ', cancelText: 'ยกเลิก',
  });
  if (ok) changeStatus(jobId, 'Approve');
}

async function rejectRFQ(jobId) {
  const result = await customConfirm({
    title: 'ปฏิเสธ RFQ',
    message: `ต้องการปฏิเสธ ${jobId} หรือไม่?`,
    type: 'danger', icon: 'fas fa-times-circle', okText: 'ปฏิเสธ', cancelText: 'ยกเลิก',
    inputPlaceholder: 'ระบุเหตุผลที่ปฏิเสธ...', inputRequired: true,
  });
  if (result.ok) changeStatus(jobId, 'Reject', result.inputValue);
}

// ============================================================
// RFQ DELETE (B3)
// ============================================================
async function deleteRFQ(jobId) {
  const ok = await customConfirm({
    title: 'ลบ RFQ',
    message: `ต้องการลบ ${jobId} หรือไม่? การลบไม่สามารถกู้คืนได้`,
    type: 'danger', icon: 'fas fa-trash-alt', okText: 'ลบ', cancelText: 'ยกเลิก',
  });
  if (!ok) return;
  try {
    await fetch(`/api/rfq/${jobId}`, { method: 'DELETE' }).then(r => r.json());
    toast(`ลบ ${jobId} สำเร็จ`, 'success');
    loadRFQList();
    goHome();
  } catch (e) {
    toast('ลบไม่สำเร็จ: ' + e.message, 'error');
  }
}

// ============================================================
// FILE UPLOAD (B2)
// ============================================================
async function uploadAttachFile(ci) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.jpg,.png,.xlsx,.docx,.zip';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    toast(`กำลังอัพโหลด ${file.name}...`, 'info');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'X-Filename': encodeURIComponent(file.name) },
        body: file,
      }).then(r => r.json());
      if (res.success) {
        if (!State.form.attach_files) State.form.attach_files = [];
        State.form.attach_files.push({ name: file.name, url: res.url, filename: res.filename });
        toast(`อัพโหลด ${file.name} สำเร็จ`, 'success');
        renderForm();
      } else {
        toast('อัพโหลดไม่สำเร็จ', 'error');
      }
    } catch (e) {
      toast('อัพโหลดไม่สำเร็จ: ' + e.message, 'error');
    }
  };
  input.click();
}

function removeAttachFile(i) {
  if (State.form?.attach_files) {
    State.form.attach_files.splice(i, 1);
    renderForm();
  }
}

// ============================================================
// MI SYSTEM CHECK (C3)
// ============================================================
async function checkMIStatus(jobId) {
  try {
    const data = await apiGet(`/api/rfq/mi-check/${jobId}`);
    if (data?.mi_status === 1 || data?.is_open_job) {
      return { locked: true, message: 'RFQ นี้ถูกเปิดเป็น Job ในระบบ MI แล้ว ไม่สามารถแก้ไขได้' };
    }
    return { locked: false };
  } catch {
    return { locked: false };
  }
}

// ============================================================
// ESTIMATE HISTORY
// ============================================================
async function viewHistory(jobId) {
  showView('viewHistory');
  setTopBar('ประวัติ ' + jobId, 'Estimate History');
  $('historyContent').innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด...</div>';

  try {
    const data = await apiGet(`/api/rfq/status-log/${jobId}`);
    const logs = Array.isArray(data) ? data : (data.data || []);
    let h = `<div class="detail-header">
      <div><h4>${jobId}</h4><div style="color:var(--text-muted);font-size:13px">ประวัติการเปลี่ยนแปลง</div></div>
      <div class="detail-actions">
        <button class="text-btn" onclick="App.viewDetail('${jobId}')"><i class="fas fa-arrow-left"></i> กลับ</button>
      </div>
    </div>`;

    if (logs.length === 0) {
      h += '<div class="detail-card"><p style="color:var(--text-muted);text-align:center;padding:20px">ไม่พบประวัติ</p></div>';
    } else {
      h += '<div class="detail-card"><h6><i class="fas fa-history"></i> Timeline</h6><ul class="history-timeline">';
      logs.forEach(log => {
        h += `<li class="history-item">
          <div class="history-dot"></div>
          <div class="history-content">
            <div><b>${log.status || log.action || '-'}</b> ${log.remark ? '- ' + escapeHtml(log.remark) : ''}</div>
            <div>โดย: ${log.emp_name || log.created_by || '-'}</div>
            <div class="time">${log.created_datetime || log.created || '-'}</div>
          </div>
        </li>`;
      });
      h += '</ul></div>';
    }

    $('historyContent').innerHTML = h;
  } catch (e) {
    $('historyContent').innerHTML = `<div class="detail-card"><p style="color:#f08080">${e.message}</p></div>`;
  }
}

// ============================================================
// SPECIAL INK MANAGEMENT
// ============================================================
function addSpecialInk(compIndex) {
  State.form.components[compIndex].color.special_ink.push(freshSpecialInk());
  renderForm();
}
function removeSpecialInk(compIndex, inkIndex) {
  State.form.components[compIndex].color.special_ink.splice(inkIndex, 1);
  renderForm();
}
function setSpecialInk(compIndex, inkIndex, key, val) {
  State.form.components[compIndex].color.special_ink[inkIndex][key] = val;
}
function copySpecialInk(compIndex, inkIndex) {
  const ink = { ...State.form.components[compIndex].color.special_ink[inkIndex] };
  State.form.components[compIndex].color.special_ink.push(ink);
  renderForm();
}

// ============================================================
// CORRUGATED SETTERS
// ============================================================
function setCorrugated(ci, key, val) {
  if (!State.form.components[ci].corrugated) State.form.components[ci].corrugated = {};
  State.form.components[ci].corrugated[key] = val;
  renderForm();
  // Re-render 3D/SVG views after corrugated change (e.g., flute_side)
  if (key === 'flute_side') setTimeout(refreshBoxViews, 100);
}
function setCorrugatedGrade(ci, gi, val) {
  State.form.components[ci].corrugated.grade[gi] = val;
}

// ============================================================
// CUSTOM PAPER POPUP
// ============================================================
let _paperPopupTarget = -1;
function openPaperPopup(compIndex) {
  _paperPopupTarget = compIndex;
  const p = State.form.components[compIndex]?.paper || {};
  $('ppPaperType').value = p.paper_type || '';
  $('ppPaperName').value = p.paper_name || '';
  $('ppPaperGram').value = p.paper_gram || '';
  $('ppPaperThick').value = p.paper_thickness || '';
  $('ppPaperPrice').value = p.paper_cost || '';
  $('paperPopupOverlay').classList.add('show');
}
function closePaperPopup() { $('paperPopupOverlay').classList.remove('show'); _paperPopupTarget = -1; }
function applyCustomPaper() {
  if (_paperPopupTarget < 0) return;
  const p = State.form.components[_paperPopupTarget].paper;
  p.paper_type = $('ppPaperType').value;
  p.paper_name = $('ppPaperName').value;
  p.paper_gram = $('ppPaperGram').value;
  p.paper_thickness = $('ppPaperThick').value;
  p.paper_cost = $('ppPaperPrice').value;
  p.is_custom = true;
  closePaperPopup();
  renderForm();
  toast('กำหนดกระดาษ Custom สำเร็จ', 'success');
}

// ============================================================
// CUSTOM FOIL POPUP
// ============================================================
let _foilPopupTarget = { ci: -1, ai: -1 };
function openFoilPopup(ci, ai) {
  _foilPopupTarget = { ci, ai };
  const ad = State.form.components[ci]?.addon?.[ai] || {};
  $('fpColor').value = ad.info?.name || '';
  $('fpCode').value = ad.info?.code || '';
  $('fpWidth').value = ad.info?.width || '';
  $('fpLength').value = ad.info?.length || '';
  $('fpPrice').value = ad.info?.coating_price || '';
  $('foilPopupOverlay').classList.add('show');
}
function closeFoilPopup() { $('foilPopupOverlay').classList.remove('show'); _foilPopupTarget = { ci: -1, ai: -1 }; }
function applyCustomFoil() {
  const { ci, ai } = _foilPopupTarget;
  if (ci < 0) return;
  const info = State.form.components[ci].addon[ai].info;
  info.name = $('fpColor').value;
  info.code = $('fpCode').value;
  info.width = $('fpWidth').value;
  info.length = $('fpLength').value;
  info.coating_price = $('fpPrice').value;
  closeFoilPopup();
  renderForm();
  toast('กำหนด Foil Roll Custom สำเร็จ', 'success');
}

// ============================================================
// CUSTOMER DETAIL LOOKUP
// ============================================================
async function lookupCustomer(customerId) {
  if (!customerId) return;
  try {
    const data = await apiGet(`/api/customer/${customerId}`);
    if (data && State.form) {
      if (data.credit_term) {
        State.form.credit_term = data.credit_term;
        State.form.credit_term_id = data.credit_term_id || '';
        State.form.credit_term_name = data.credit_term || '';
      }
      renderForm();
    }
  } catch { /* ignore */ }
}

// ============================================================
// QUOTATION MODULE
// ============================================================
async function viewQuotations(jobId) {
  showView('viewQuoteList');
  setTopBar('Quotation - ' + jobId, 'รายการใบเสนอราคา');
  $('quoteListContent').innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด...</div>';
  State.quoteRfqId = jobId;

  try {
    const [rfq, quotations] = await Promise.all([
      apiGet(`/api/rfq/detail/${jobId}`),
      apiGet(`/api/quotation/list?rfq_id=${jobId}`).catch(() => []),
    ]);
    const jd = rfq.job_data || rfq;
    const job = jd.job || {};
    const cust = jd.customer || {};
    const quoteList = Array.isArray(quotations) ? quotations : (quotations?.data || []);

    let h = `<div class="detail-header">
      <div>
        <h4>${jobId} <span class="rfq-status" style="font-size:12px">${rfq.approve_status || 'Draft'}</span></h4>
        <div style="color:var(--text-muted);font-size:13px">${job.job_name || rfq.job_name || '-'} | ${cust.customer_name || '-'}</div>
      </div>
      <div class="detail-actions">
        <button class="text-btn" onclick="App.viewDetail('${jobId}')"><i class="fas fa-arrow-left"></i> กลับ</button>
        <button class="text-btn primary" onclick="App.newQuotation('${jobId}')"><i class="fas fa-plus"></i> สร้างใบเสนอราคา</button>
      </div>
    </div>`;

    if (quoteList.length > 0) {
      h += `<div class="detail-card"><h6><i class="fas fa-file-invoice"></i> รายการ Quotation (${quoteList.length})</h6>
      <table class="detail-table"><thead><tr><th>ID</th><th>ลูกค้า</th><th>วันที่</th><th>สถานะ</th><th>ผู้อนุมัติ</th><th></th></tr></thead><tbody>`;
      quoteList.forEach(q => {
        const qid = q.quotation_id || q.id;
        h += `<tr>
          <td>${qid}</td>
          <td>${escapeHtml(q.customer_name || '-')}</td>
          <td>${q.issue_date || q.created_datetime || '-'}</td>
          <td><span class="rfq-status">${q.status || q.approve_status || '-'}</span></td>
          <td>${escapeHtml(q.approver || '-')}</td>
          <td style="display:flex;gap:4px">
            <button class="text-btn" onclick="App.editQuotation('${qid}')"><i class="fas fa-edit"></i></button>
            <button class="text-btn" onclick="App.deleteQuotation('${qid}','${jobId}')"><i class="fas fa-trash"></i></button>
            <button class="text-btn" onclick="App.printQuotation('${qid}')"><i class="fas fa-print"></i></button>
          </td>
        </tr>`;
      });
      h += '</tbody></table></div>';
    } else {
      h += `<div class="detail-card"><p style="color:var(--text-muted);text-align:center;padding:20px;font-size:13px">
        <i class="fas fa-info-circle"></i> ยังไม่มี Quotation - กดปุ่ม "สร้างใบเสนอราคา" เพื่อสร้างใหม่
      </p></div>`;
    }

    $('quoteListContent').innerHTML = h;
  } catch (e) {
    $('quoteListContent').innerHTML = `<div class="detail-card"><p style="color:#f08080">${e.message}</p></div>`;
  }
}

function newQuotation(rfqId) {
  State.quotation = freshQuotation();
  State.quotation.rfq_id = rfqId;
  showView('viewQuoteForm');
  setTopBar('สร้างใบเสนอราคา', rfqId);
  renderQuotationForm();
}

function renderQuotationForm() {
  const q = State.quotation;
  if (!q) return;

  let h = `<div class="form-topbar">
    <h4><i class="fas fa-file-invoice" style="color:var(--accent);margin-right:8px"></i> ใบเสนอราคา</h4>
    <div style="display:flex;gap:8px">
      <button class="btn btn-secondary" onclick="App.viewQuotations('${q.rfq_id}')"><i class="fas fa-arrow-left"></i> กลับ</button>
    </div>
  </div>

  <div class="form-section" id="secQuoteInfo">
    <div class="form-section-header" onclick="toggleSection('secQuoteInfo')">
      <span><i class="fas fa-info-circle"></i> ข้อมูลใบเสนอราคา</span>
      <i class="fas fa-chevron-down chevron"></i>
    </div>
    <div class="form-section-body">
      <div class="form-row four-col">
        <div class="form-group"><label>RFQ No</label><input class="form-input" value="${esc(q.rfq_id)}" disabled></div>
        <div class="form-group"><label>วันที่ออก</label><input class="form-input" type="date" value="${esc(q.issue_date)}" oninput="App.setQuote('issue_date',this.value)"></div>
        <div class="form-group"><label>วัน Valid</label><input class="form-input" type="number" value="${esc(q.valid_days)}" oninput="App.setQuote('valid_days',this.value)"></div>
        <div class="form-group"><label>เงื่อนไขชำระ</label><input class="form-input" value="${esc(q.payment_condition)}" oninput="App.setQuote('payment_condition',this.value)" placeholder="e.g. 30 วัน"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>ชื่อลูกค้า</label><input class="form-input" value="${esc(q.customer_name)}" oninput="App.setQuote('customer_name',this.value)"></div>
        <div class="form-group"><label>ที่อยู่</label><input class="form-input" value="${esc(q.customer_address)}" oninput="App.setQuote('customer_address',this.value)"></div>
      </div>
      <div class="form-row four-col">
        <div class="form-group"><label>ผู้ติดต่อ</label><input class="form-input" value="${esc(q.contact_person)}" oninput="App.setQuote('contact_person',this.value)"></div>
        <div class="form-group"><label>โทรศัพท์</label><input class="form-input" value="${esc(q.contact_tel)}" oninput="App.setQuote('contact_tel',this.value)"></div>
        <div class="form-group"><label>มือถือ</label><input class="form-input" value="${esc(q.contact_mobile)}" oninput="App.setQuote('contact_mobile',this.value)"></div>
        <div class="form-group"><label>Email</label><input class="form-input" value="${esc(q.contact_email)}" oninput="App.setQuote('contact_email',this.value)"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>AE</label><input class="form-input" value="${esc(q.ae_name)}" oninput="App.setQuote('ae_name',this.value)"></div>
        <div class="form-group"><label>ประเภทงาน</label>
          <select class="form-input" onchange="App.setQuote('job_info_type',this.value)">
            <option value="domestic" ${q.job_info_type==='domestic'?'selected':''}>ในประเทศ</option>
            <option value="export" ${q.job_info_type==='export'?'selected':''}>ต่างประเทศ</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <div class="form-section" id="secQuoteItems">
    <div class="form-section-header" onclick="toggleSection('secQuoteItems')">
      <span><i class="fas fa-list"></i> รายการสินค้า (${q.items.length})</span>
      <i class="fas fa-chevron-down chevron"></i>
    </div>
    <div class="form-section-body">
      <table class="detail-table" style="font-size:12px">
        <thead><tr><th>#</th><th>ชื่อรายการ</th><th>หน่วย</th><th>จำนวน</th><th>ราคา/หน่วย</th><th>รวม</th><th></th></tr></thead>
        <tbody>
        ${q.items.map((item, i) => `<tr>
          <td>${i+1}</td>
          <td><input class="form-input" value="${esc(item.item_name)}" oninput="App.setQuoteItem(${i},'item_name',this.value)" style="min-width:100px"></td>
          <td><input class="form-input" value="${esc(item.unit)}" oninput="App.setQuoteItem(${i},'unit',this.value)" style="min-width:40px;max-width:60px"></td>
          <td><input class="form-input" type="number" value="${esc(item.qty)}" oninput="App.setQuoteItem(${i},'qty',this.value)" style="min-width:50px;max-width:80px"></td>
          <td><input class="form-input" type="number" step="0.01" value="${esc(item.unit_price)}" oninput="App.setQuoteItem(${i},'unit_price',this.value)" style="min-width:60px;max-width:100px"></td>
          <td><input class="form-input" type="number" step="0.01" value="${esc(item.total)}" oninput="App.setQuoteItem(${i},'total',this.value)" style="min-width:60px;max-width:100px"></td>
          <td><button class="array-item-remove" onclick="App.removeQuoteItem(${i})"><i class="fas fa-times"></i></button></td>
        </tr>`).join('')}
        </tbody>
      </table>
      <button class="add-item-btn" onclick="App.addQuoteItem()" style="margin-top:8px"><i class="fas fa-plus"></i> เพิ่มรายการ</button>
    </div>
  </div>

  <div class="form-section" id="secQuoteText">
    <div class="form-section-header" onclick="toggleSection('secQuoteText')">
      <span><i class="fas fa-align-left"></i> ข้อความใบเสนอราคา</span>
      <i class="fas fa-chevron-down chevron"></i>
    </div>
    <div class="form-section-body">
      <textarea class="form-input" rows="6" placeholder="ข้อความเพิ่มเติม..." oninput="App.setQuote('quotation_text',this.value)">${esc(q.quotation_text)}</textarea>
    </div>
  </div>

  <div class="form-actions">
    <button class="btn btn-secondary" onclick="App.viewQuotations('${q.rfq_id}')">ยกเลิก</button>
    <button class="btn btn-primary" onclick="App.saveQuotation()"><i class="fas fa-save"></i> บันทึก</button>
  </div>`;

  $('quoteFormContent').innerHTML = h;
}

function setQuote(key, val) { if (State.quotation) State.quotation[key] = val; }
function setQuoteItem(i, key, val) {
  if (State.quotation?.items?.[i]) {
    State.quotation.items[i][key] = val;
    // Auto-calc total
    if (key === 'qty' || key === 'unit_price') {
      const item = State.quotation.items[i];
      item.total = String((parseFloat(item.qty || 0) * parseFloat(item.unit_price || 0)).toFixed(2));
      renderQuotationForm();
    }
  }
}
function addQuoteItem() {
  if (!State.quotation) return;
  const n = State.quotation.items.length + 1;
  State.quotation.items.push({ item_no: n, item_name: '', unit: 'ชิ้น', qty: '', unit_price: '', total: '', unit_price_fc: '', total_fc: '' });
  renderQuotationForm();
}
function removeQuoteItem(i) {
  if (State.quotation?.items?.length > 1) {
    State.quotation.items.splice(i, 1);
    renderQuotationForm();
  }
}
async function saveQuotation() {
  const q = State.quotation;
  if (!q) { toast('ไม่มีข้อมูล Quotation', 'error'); return; }
  if (!q.customer_name) { toast('กรุณาระบุชื่อลูกค้า', 'error'); return; }
  if (!q.items.length || !q.items[0].item_name) { toast('กรุณาเพิ่มรายการสินค้า', 'error'); return; }

  toast('กำลังบันทึก...', 'info');
  try {
    const payload = {
      rfq_id: q.rfq_id,
      quotation_id: q.quotation_id || undefined,
      customer_name: q.customer_name,
      customer_address: q.customer_address,
      contact_person: q.contact_person,
      contact_tel: q.contact_tel,
      contact_mobile: q.contact_mobile,
      contact_email: q.contact_email,
      ae_name: q.ae_name,
      issue_date: q.issue_date,
      valid_days: q.valid_days,
      payment_condition: q.payment_condition,
      job_info_type: q.job_info_type,
      quotation_text: q.quotation_text,
      items: q.items,
    };
    const res = await apiPost('/api/quotation/save', payload);
    if (res.quotation_id || res.success) {
      toast('บันทึก Quotation สำเร็จ!', 'success');
      viewQuotations(q.rfq_id);
    } else {
      toast('บันทึกไม่สำเร็จ: ' + (res.message || 'Unknown error'), 'error');
    }
  } catch (e) {
    toast('บันทึกไม่สำเร็จ: ' + e.message, 'error');
  }
}

async function editQuotation(quotationId) {
  toast('กำลังโหลด...', 'info');
  try {
    const data = await apiGet(`/api/quotation/history/${quotationId}`);
    const q = freshQuotation();
    // Map API data to quotation model
    if (data) {
      Object.assign(q, {
        quotation_id: quotationId,
        rfq_id: data.rfq_id || State.quoteRfqId,
        customer_name: data.customer_name || '',
        customer_address: data.customer_address || '',
        contact_person: data.contact_person || '',
        contact_tel: data.contact_tel || '',
        contact_mobile: data.contact_mobile || '',
        contact_email: data.contact_email || '',
        ae_name: data.ae_name || '',
        issue_date: data.issue_date || '',
        valid_days: data.valid_days || '30',
        payment_condition: data.payment_condition || '',
        job_info_type: data.job_info_type || 'domestic',
        quotation_text: data.quotation_text || '',
        items: data.items || q.items,
      });
    }
    State.quotation = q;
    showView('viewQuoteForm');
    setTopBar('แก้ไขใบเสนอราคา', quotationId);
    renderQuotationForm();
  } catch (e) {
    toast('โหลดข้อมูลไม่สำเร็จ: ' + e.message, 'error');
  }
}

async function deleteQuotation(quotationId, rfqId) {
  const ok = await customConfirm({
    title: 'ลบ Quotation',
    message: `ต้องการลบ Quotation ${quotationId} หรือไม่?`,
    type: 'danger', icon: 'fas fa-trash-alt', okText: 'ลบ', cancelText: 'ยกเลิก',
  });
  if (!ok) return;
  try {
    await fetch(`/api/quotation/${quotationId}`, { method: 'DELETE' }).then(r => r.json());
    toast('ลบ Quotation สำเร็จ', 'success');
    viewQuotations(rfqId);
  } catch (e) {
    toast('ลบไม่สำเร็จ: ' + e.message, 'error');
  }
}

function printQuotation(quotationId) {
  window.open(`http://192.168.5.3:3051/estimate/quotation/print?quotation_id=${quotationId}`, '_blank');
}

// ============================================================
// MULTIPLE F QTY
// ============================================================
function addFQty() {
  if (!State.form) return;
  State.form.qty.push('');
  State.form.run_on_values.push('');
  renderForm();
}
function removeFQty() {
  if (!State.form || State.form.qty.length <= 1) return;
  State.form.qty.pop();
  State.form.run_on_values.pop();
  renderForm();
}
function setRunOnValue(i, val) {
  if (!State.form) return;
  State.form.run_on_values[i] = val;
}

// Multi-F Card functions
function addFCard() {
  if (!State.form) return;
  State.form.f_data.push(freshFData());
  renderForm();
}
function removeFCard() {
  if (!State.form || State.form.f_data.length <= 1) return;
  State.form.f_data.pop();
  updateFTotalQty();
  renderForm();
}
function setFData(fi, key, val) {
  if (!State.form || !State.form.f_data[fi]) return;
  State.form.f_data[fi][key] = val;
  // Auto-calc total qty for this F card
  if (['qty', 'run_on_value'].includes(key)) {
    const fd = State.form.f_data[fi];
    fd.total_qty = (parseInt(fd.qty) || 0) + (parseInt(fd.run_on_value) || 0);
    updateFTotalQty();
  }
  // Auto-calc run_on_value from percent
  if (key === 'run_on_percent') {
    const fd = State.form.f_data[fi];
    const q = parseInt(fd.qty) || 0;
    const pct = parseFloat(val) || 0;
    fd.run_on_value = Math.ceil(q * pct / 100).toString();
    fd.total_qty = q + (parseInt(fd.run_on_value) || 0);
    updateFTotalQty();
  }
  if (key === 'color_limit') renderForm();
}
function updateFTotalQty() {
  if (!State.form) return;
  State.form.f_total_qty = State.form.f_data.reduce((sum, fd) => sum + (parseInt(fd.total_qty) || 0), 0);
  State.form.qty = [String(State.form.f_total_qty)];
  // Update Total Qty display without re-rendering (ไม่ให้ input หลุด focus)
  const totalEl = document.querySelector('#secQty .f-total-qty');
  if (totalEl) totalEl.textContent = State.form.f_total_qty.toLocaleString();
}
// Get F code list for dropdowns
function getFCodeList() {
  if (!State.form || !State.form.has_multi_f) return [];
  return State.form.f_data.filter(fd => fd.f_code).map(fd => fd.f_code);
}

// ============================================================
// LAYOUT CALCULATION
// ============================================================
// Loading overlay helper — Pornchai AI branded (uses PORNCHAI_SVG)
function showCalcOverlay(msg, mode) {
  const el = document.createElement('div');
  el.className = 'calc-overlay';
  el.id = 'calcOverlay';

  // Floating particles
  let particles = '<div class="calc-particles">';
  for (let i = 0; i < 24; i++) {
    const size = 2 + Math.random() * 6;
    const left = Math.random() * 100;
    const delay = Math.random() * 2;
    const dur = 2.5 + Math.random() * 3;
    particles += `<div class="calc-particle" style="width:${size}px;height:${size}px;left:${left}%;animation-duration:${dur}s;animation-delay:${delay}s"></div>`;
  }
  particles += '</div>';

  // Status-specific icon + steps
  const isLayout = mode === 'layout';
  const icon = isLayout
    ? '<i class="fas fa-ruler-combined" style="font-size:18px;color:#a78bfa"></i>'
    : '<i class="fas fa-calculator" style="font-size:18px;color:#38bdf8"></i>';
  const steps = isLayout
    ? ['Open Size', 'Paper Match', 'Layout Fit', 'Result']
    : ['Material', 'Production', 'Process', 'Total'];

  el.innerHTML = `
    ${particles}
    <div class="calc-avatar ${isLayout ? 'mode-layout' : 'mode-price'}">
      <div class="ring-glow"></div>
      <div class="ring2"></div>
      <div class="ring"></div>
      <div class="calc-bot-svg">${PORNCHAI_THINK_SVG}</div>
      <div class="calc-mode-icon">${icon}</div>
    </div>
    <div class="calc-brand">Pornchai AI</div>
    <div class="calc-sub">${isLayout ? 'Layout Engine' : 'Price Engine'}</div>
    <div class="calc-msg">${msg}</div>
    <div class="calc-bar"><div class="calc-bar-fill"></div></div>
    <div class="calc-steps">
      ${steps.map((s, i) => `<div class="calc-step-item" style="animation-delay:${0.3 + i * 0.4}s"><div class="calc-step-dot"></div><div class="calc-step-label">${s}</div></div>`).join('')}
    </div>`;
  document.body.appendChild(el);
}
function hideCalcOverlay() {
  const el = document.getElementById('calcOverlay');
  if (!el) return;
  el.classList.add('fade-out');
  setTimeout(() => el.remove(), 400);
}

async function calculateLayout(skipOverlay) {
  if (!State.form) { toast('กรุณาเปิดฟอร์ม RFQ ก่อน', 'error'); return; }
  if (typeof CalcEngine === 'undefined') { toast('กำลังโหลด Calculation Engine...', 'info'); return; }
  const f = State.form;
  if (!f.components.length) { toast('ไม่มี Component', 'error'); return; }

  // Validate ข้อมูลขั้นต่ำก่อนคำนวณ Layout
  const missing = [];
  const isMultiF = !!(f.has_multi_f && f.f_data?.length > 0);
  const validQtys = isMultiF
    ? f.f_data.filter(fd => fd.qty && parseInt(fd.qty) > 0)
    : f.qty.filter(q => q && parseInt(q) > 0);
  if (!validQtys.length) missing.push(isMultiF ? 'จำนวนในแต่ละ F' : 'จำนวน (Quantity)');
  f.components.forEach((c, ci) => {
    const cn = c.component_name || `Component ${ci+1}`;
    const sz = c.packaging_size || {};
    if (!parseFloat(sz.width) && !parseFloat(sz.length)) missing.push(`${cn}: ขนาด กว้าง × ยาว`);
    if (!c.box_type?.type_id) missing.push(`${cn}: Template กล่อง`);
  });
  if (missing.length > 0) {
    toast(`กรุณากรอกข้อมูลก่อนคำนวณ Layout:\n• ${missing.join('\n• ')}`, 'error');
    return;
  }

  // === Process / Material ที่มีชื่อแต่ไม่มีราคา → block ===
  const procsNoPrice = [];
  ['other_process', 'handwork_process', 'outsource', 'materials', 'other_items'].forEach(key => {
    (f[key] || []).forEach(p => {
      if (p.name?.trim() && (!p.cost || parseFloat(p.cost) <= 0)) {
        const label = key === 'other_process' ? 'Process' : key === 'handwork_process' ? 'Handwork' : key === 'outsource' ? 'จัดจ้าง' : key === 'materials' ? 'Material' : 'Other';
        procsNoPrice.push(`${label}: ${p.name}`);
      }
    });
  });
  if (procsNoPrice.length > 0) {
    toast(`กรุณาใส่ราคาให้ครบก่อนคำนวณ:\n• ${procsNoPrice.join('\n• ')}`, 'error');
    return;
  }

  // Build packing array from checkbox + packing_detail ก่อนคำนวณ
  f.components.forEach(c => {
    if (!c.packing || c.packing.length === 0) {
      c.packing = [];
      const types = ['kraftwrap','paperband','carton','pallet'];
      types.forEach(t => {
        if (c['_pk_' + t]) {
          const pk = freshPacking();
          pk.name = t;
          // ดึง qty_per_pack จาก packing_detail
          const detail = c.packing_detail || '';
          const qppMatch = detail.match(/(\d+)\s*(?:pcs?|ชิ้น)\s*[/\/]\s*(?:pack|แพ็ค)/i);
          if (qppMatch) pk.qty_per_pack = parseInt(qppMatch[1]);
          c.packing.push(pk);
        }
      });
    } else {
      // อัพเดท qty_per_pack จาก packing_detail ถ้ายังไม่มี
      const detail = c.packing_detail || '';
      const qppMatch = detail.match(/(\d+)\s*(?:pcs?|ชิ้น)\s*[/\/]\s*(?:pack|แพ็ค)/i);
      if (qppMatch) {
        c.packing.forEach(pk => {
          if (!pk.qty_per_pack && (pk.name || '').toLowerCase().includes('kraftwrap')) {
            pk.qty_per_pack = parseInt(qppMatch[1]);
          }
        });
      }
    }
  });

  // Run Business Rules Engine before calculating
  const bizResult = await ensureEstimateReady();
  if (bizResult.warnings?.length > 0) {
    toast(bizResult.warnings[0], 'warning');
  }

  if (skipOverlay) {
    // No overlay — instant recalc (for manual layout, recalc, back navigation)
    _doCalculateLayout();
  } else {
    // First time — show branded overlay
    showCalcOverlay('กำลังคำนวณ Layout...', 'layout');
    setTimeout(() => { _doCalculateLayout(); hideCalcOverlay(); }, 2500);
  }
}

function _doCalculateLayout() {
  const f = State.form;
  const printType = f.print_type || 'Offset';
  // Multi-F: ใช้ qty รวมทุก F สำหรับ paper usage
  const isMultiFL = !!(f.has_multi_f && f.f_data?.length > 0 && f.f_data.some(fd => parseInt(fd.qty) > 0));
  const qtys = isMultiFL
    ? [f.f_data.reduce((s, fd) => s + (parseInt(fd.qty) || 0), 0)]
    : f.qty.filter(q => q).map(q => parseInt(q));

  // A1: Auto-select or validate machine
  let selectedMachine = null;
  if (f.machine_id) {
    const validation = CalcEngine.validateMachine(f.machine_id, f.components[0]);
    if (!validation.valid) {
      toast(`เครื่อง ${f.machine_id}: ${validation.errors.join(', ')}`, 'warning');
    }
    selectedMachine = validation.machine;
  } else {
    selectedMachine = CalcEngine.selectMachine(f.components[0], printType);
    if (selectedMachine) {
      f.machine_id = selectedMachine.id;
      toast(`Auto-select: ${selectedMachine.name}`, 'info');
    }
  }

  // Store layout results on State for price calc and PDF
  State.layoutResults = [];

  const results = f.components.map((c, ci) => {
    if (State._customPaperSize) console.warn('[Layout] Custom paper override:', State._customPaperSize);
    let layout = CalcEngine.calcLayout(c, printType, selectedMachine, State._customPaperSize);
    console.log('[Layout] Component', ci, ':', layout.best?.nw+'x'+layout.best?.nl+'='+layout.best?.ups, layout.best?.sheetName, 'rot:'+layout.best?.rotated, 'paper:', layout.best?.sw?.toFixed(0)+'x'+layout.best?.sl?.toFixed(0));
    layout.machine = selectedMachine;

    // If layout fails, try other print types automatically
    if (layout.error && layout.unfolded) {
      const altTypes = ['Offset', 'Flexo', 'JetPress', 'Konica'].filter(t => t !== printType);
      for (const alt of altTypes) {
        const altMachine = CalcEngine.selectMachine(c, alt);
        const altLayout = CalcEngine.calcLayout(c, alt, altMachine);
        if (!altLayout.error) {
          altLayout.machine = altMachine;
          altLayout._autoPrintType = alt;
          layout = altLayout;
          toast(`Component ${ci+1}: ใช้ ${alt} แทน ${printType} เพราะขนาดเกิน`, 'info');
          break;
        }
      }
    }

    c._layout = layout; // attach for price calc
    State.layoutResults.push(layout);

    if (layout.error) return { name: c.component_name || `Component ${ci+1}`, error: layout.error, unfolded: layout.unfolded };

    // ถ้า user เคยเลือกกระดาษเองผ่าน "ใช้กระดาษ ..." → คงไว้ (override default best)
    if (c._chosenSheetName && layout.all?.length) {
      const chosen = layout.all.find(p => p.sheetName === c._chosenSheetName && !p.rotated)
                  || layout.all.find(p => p.sheetName === c._chosenSheetName);
      if (chosen) {
        const usedPT = layout._autoPrintType || printType;
        const tolP = CalcEngine.CALC.tolerance[usedPT.toLowerCase()] || CalcEngine.CALC.tolerance.offset;
        const openW = layout.unfolded.openW, openL = layout.unfolded.openL;
        const pW = chosen.nw * openW, pL = chosen.nl * openL;
        const sc = tolP.gripper + tolP.color_bar, lc = tolP.paper_edge * 2;
        if (pW <= pL) { chosen.layoutW_mm = pW + sc; chosen.layoutL_mm = pL + lc; }
        else { chosen.layoutW_mm = pW + lc; chosen.layoutL_mm = pL + sc; }
        chosen.printW_mm = pW; chosen.printL_mm = pL;
        layout.best = chosen;
      }
    }

    // Calculate paper usage per qty
    const ups = layout.best?.ups || 0;
    const paperResults = qtys.map(qty => CalcEngine.calcPaperUsage(qty, ups, c, printType));

    return {
      name: c.component_name || `Component ${ci+1}`,
      layout,
      paperResults,
    };
  });

  renderLayoutResults(results, printType);
}

/**
 * Re-render layout display from existing State.layoutResults (no recalculation)
 * Used by swap/manual edit to update display without recalculating from scratch
 */
function rerenderLayoutFromState() {
  if (!State.form || !State.layoutResults?.length) return;
  const f = State.form;
  const printType = f.print_type || 'Offset';
  const qtys = f.qty.filter(q => q).map(q => parseInt(q));

  const results = f.components.map((c, ci) => {
    const layout = State.layoutResults[ci];
    if (!layout || layout.error) return { name: c.component_name || `Component ${ci+1}`, error: layout?.error, unfolded: layout?.unfolded };
    const ups = layout.best?.ups || 0;
    const paperResults = qtys.map(qty => CalcEngine.calcPaperUsage(qty, ups, c, printType));
    return { name: c.component_name || `Component ${ci+1}`, layout, paperResults };
  });

  renderLayoutResults(results, printType);
}

/**
 * #92: Build dimension info bar below JPG template image
 */
let _boxPopupOverlay = null;

// Switch view in-place (inside form)
function refreshBoxViews() {
  if (!State.form?.components || !State._boxViewMode) return;
  State.form.components.forEach((c, ci) => {
    const mode = State._boxViewMode?.[ci];
    if (mode && mode !== 'jpg') {
      const tid = parseInt(c.box_type?.type_id) || 0;
      if (tid) setTimeout(() => switchBoxView(ci, tid, mode), 50);
    }
  });
}

function getFluteOverlayHtml(c) {
  const fluteDir = c?.corrugated?.flute_side || '';
  if (fluteDir) {
    return `<div style="position:absolute;bottom:8px;left:8px;background:rgba(255,255,255,0.95);padding:4px 8px;border-radius:6px;font-size:11px;border:1px solid #e67e22;display:flex;align-items:center;gap:6px;z-index:5">
      <span style="font-weight:600;color:#e67e22">ทิศทางลอน:</span>
      <img src="img/${fluteDir === 'short' ? 'fluteTemplate_H' : 'fluteTemplate_V'}.png" style="width:40px;height:40px">
    </div>`;
  }
  return '';
}

// F-code preview colors — each F gets a unique color for 3D preview
const F_PREVIEW_COLORS = [0x7c3aed, 0xe91e63, 0x2196f3, 0xff9800, 0x4caf50, 0x9c27b0, 0x00bcd4, 0xff5722, 0x3f51b5, 0x8bc34a];

// Artwork upload for 3D preview
function uploadBoxArtwork(ci, input) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const c = State.form.components[ci];
    if (c) {
      c._artwork = e.target.result; // data URL
      const typeId = parseInt(c.box_type?.type_id) || 1;
      // Switch to 3D view
      switchBoxView(ci, typeId, '3d');
      // Add ✕ button if not exists
      const btnContainer = document.getElementById('boxBtns_' + ci);
      if (btnContainer && !btnContainer.querySelector('[data-clear-artwork]')) {
        const btn = document.createElement('button');
        btn.dataset.clearArtwork = '';
        btn.onclick = () => App.clearBoxArtwork(ci);
        btn.style.cssText = 'font-size:9px;padding:1px 6px;border-radius:4px;cursor:pointer;border:1px solid var(--danger,#dc3545);background:transparent;color:var(--danger,#dc3545)';
        btn.title = 'ลบ Artwork';
        btn.innerHTML = '&times;';
        btnContainer.appendChild(btn);
      }
      // If popup open, re-render popup too
      if (_boxPopupOverlay) _boxPopupSwitch(ci, typeId, '3d');
    }
  };
  reader.readAsDataURL(file);
}
function clearBoxArtwork(ci) {
  const c = State.form.components[ci];
  if (c) {
    delete c._artwork;
    const typeId = parseInt(c.box_type?.type_id) || 1;
    // Update in-place 3D
    switchBoxView(ci, typeId, '3d');
    // Update ✕ button visibility without full re-render
    const btnContainer = document.getElementById('boxBtns_' + ci);
    if (btnContainer) {
      const clearBtn = btnContainer.querySelector('[data-clear-artwork]');
      if (clearBtn) clearBtn.remove();
    }
    // If popup open, re-render popup too
    if (_boxPopupOverlay) _boxPopupSwitch(ci, typeId, '3d');
  }
}

function previewBoxF(ci, fi, typeId) {
  if (!State._boxPreviewF) State._boxPreviewF = {};
  // Toggle: click same F again → deselect (show default)
  if (State._boxPreviewF[ci] === fi) {
    delete State._boxPreviewF[ci];
  } else {
    State._boxPreviewF[ci] = fi;
  }
  // Update F-button active states in both in-place and popup (no full re-render)
  document.querySelectorAll('[data-fpreview]').forEach(btn => {
    const bfi = parseInt(btn.dataset.fpreview);
    const isActive = State._boxPreviewF[ci] === bfi;
    btn.style.background = isActive ? 'var(--accent,#5b2d8e)' : '';
    btn.style.color = isActive ? '#fff' : '';
    btn.style.borderColor = isActive ? 'var(--accent,#5b2d8e)' : '';
    btn.style.fontWeight = isActive ? '700' : '';
  });
  // If popup is open → don't re-render in-place (popup handles its own via _boxPopupSwitch)
  if (!_boxPopupOverlay) {
    switchBoxView(ci, typeId, '3d');
  }
}

function switchBoxView(ci, typeId, mode) {
  const el = document.getElementById(`boxView_${ci}`);
  if (!el) return;
  const c = State.form?.components?.[ci];
  el.dataset.mode = mode;

  // Store mode for real-time refresh
  if (!State._boxViewMode) State._boxViewMode = {};
  State._boxViewMode[ci] = mode;
  const fluteHtml = getFluteOverlayHtml(c);

  // Update mini button active states
  const btns = document.getElementById(`boxBtns_${ci}`)?.querySelectorAll('button');
  if (btns) {
    const modes = ['3d','svg','jpg'];
    btns.forEach((btn, idx) => {
      if (modes[idx] === mode) {
        btn.style.background = '#5b2d8e'; btn.style.color = '#fff'; btn.style.border = 'none';
      } else {
        btn.style.background = 'var(--bg-tertiary)'; btn.style.color = 'var(--text-secondary)'; btn.style.border = '1px solid var(--border)';
      }
    });
  }

  // ไม่ destroy global — ให้ Box3D จัดการ per-container เอง

  if (mode === '3d') {
    el.innerHTML = '';
    el.style.background = '#1a1035';
    if (typeof Box3D !== 'undefined') {
      const szWithFlute = { ...c?.packaging_size, _fluteDir: c?.corrugated?.flute_side || null };
      // Artwork texture + coating info for realistic render
      if (c?._artwork) szWithFlute._artwork = c._artwork;
      const coatingAd = (c?.addon || []).find(a => a.type === 'coating');
      if (coatingAd) szWithFlute._coating = (coatingAd.info?.coating_option || '') + ' ' + (coatingAd.info?.type || '');
      // Per-F color preview — pass addon info for visual cues
      const activeFi = State._boxPreviewF?.[ci];
      if (activeFi != null) {
        szWithFlute._boxColor = F_PREVIEW_COLORS[activeFi % F_PREVIEW_COLORS.length];
        const cf = c?._color_per_f?.[activeFi];
        const fCode = cf?.f_code || State.form.f_data?.[activeFi]?.f_code || '';
        if (cf) szWithFlute._fLabel = fCode + ' (' + (cf.outside||0) + '/' + (cf.inside||0) + ' สี)';
        // Collect addons that apply to this F-code — pass full size data
        const addons = (c?.addon || []).filter(a => !a.f_codes?.length || a.f_codes.includes(fCode));
        const foilAds = addons.filter(a => a.type === 'foilstamp');
        szWithFlute._foils = foilAds.map(a => ({ color: a.info?.foil_color || '', sizes: a.info?.sizes || [] }));
        const embAd = addons.find(a => a.type === 'emboss');
        szWithFlute._emboss = embAd ? { sizes: embAd.info?.sizes || [] } : null;
        const debAd = addons.find(a => a.type === 'deboss');
        szWithFlute._deboss = debAd ? { sizes: debAd.info?.sizes || [] } : null;
        szWithFlute._hasSpecialInk = cf?.is_special_ink || false;
        szWithFlute._specialInkColor = cf?.special_ink?.[0]?.ink_color || '';
      }
      Box3D.render(el, typeId, szWithFlute);
    }
    else el.innerHTML = '<div style="color:#a78bfa;display:flex;align-items:center;justify-content:center;height:100%">Loading 3D...</div>';
    // 3D mode: box-3d.js handles flute overlay — no HTML overlay needed
  } else if (mode === 'svg') {
    el.style.background = '#fff';
    const svg = typeof BoxSVG !== 'undefined' ? BoxSVG.generate(typeId, c?.packaging_size) : '';
    el.innerHTML = (svg || `<img src="img/${typeId}.jpg" style="width:100%;height:100%;object-fit:contain">`) + fluteHtml;
  } else {
    el.style.background = '#fff';
    el.innerHTML = `<img src="img/${typeId}.jpg" style="width:100%;height:100%;object-fit:contain;display:block">` + fluteHtml;
  }
}

// Open popup — reads current mode from the in-place view
function openBoxPopup(ci, typeId, forceMode) {
  closeBoxPopup();
  const c = State.form?.components?.[ci];
  const el = document.getElementById(`boxView_${ci}`);
  const mode = forceMode || el?.dataset?.mode || 'jpg';

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
  overlay.onclick = e => { if (e.target === overlay) closeBoxPopup(); };

  const modal = document.createElement('div');
  modal.style.cssText = 'background:#fff;border-radius:16px;width:clamp(320px,85vw,850px);max-height:90vh;overflow:hidden;box-shadow:0 12px 48px rgba(0,0,0,0.4);display:flex;flex-direction:column';

  // Header: tabs left + info + close right
  const header = document.createElement('div');
  header.style.cssText = 'padding:10px 16px;display:flex;gap:8px;align-items:center;background:#f8f7fc;border-bottom:1px solid #e5e7eb;flex-shrink:0;flex-wrap:wrap';
  const btnStyle = (active) => `font-size:12px;padding:5px 14px;border-radius:7px;cursor:pointer;border:1px solid #d1d5db;font-weight:600;${active ? 'background:#5b2d8e;color:#fff;border-color:#5b2d8e' : 'background:#fff;color:#374151'}`;
  header.innerHTML = `
    <button id="bpBtn3d" style="${btnStyle(mode==='3d')}" onclick="App._boxPopupSwitch(${ci},${typeId},'3d')"><i class="fas fa-cube"></i> 3D</button>
    <button id="bpBtnSvg" style="${btnStyle(mode==='svg')}" onclick="App._boxPopupSwitch(${ci},${typeId},'svg')"><i class="fas fa-drafting-compass"></i> Dieline</button>
    <button id="bpBtnJpg" style="${btnStyle(!mode||mode==='jpg')}" onclick="App._boxPopupSwitch(${ci},${typeId},'jpg')"><i class="fas fa-image"></i> JPG</button>
    ${(() => {
      if (!State.form.has_multi_f || !c?._color_per_f || c._color_per_f.length <= 1) return '';
      let fBtns = '<span style="width:1px;height:20px;background:#d1d5db;margin:0 4px"></span><span style="font-size:11px;color:#6b7280">Preview:</span>';
      c._color_per_f.forEach((cf, fi) => {
        const fc = cf.f_code || State.form.f_data?.[fi]?.f_code || '';
        const isAct = State._boxPreviewF?.[ci] === fi;
        const bg = isAct ? '#5b2d8e' : '#fff';
        const fg = isAct ? '#fff' : '#374151';
        const bd = isAct ? '#5b2d8e' : '#d1d5db';
        const fw = isAct ? '700' : '400';
        fBtns += '<button data-fpreview="' + fi + '" onclick="App.previewBoxF(' + ci + ',' + fi + ',' + typeId + ');App._boxPopupSwitch(' + ci + ',' + typeId + ',&quot;3d&quot;)" style="font-size:11px;padding:2px 10px;border-radius:5px;cursor:pointer;border:1px solid ' + bd + ';background:' + bg + ';color:' + fg + ';font-weight:' + fw + '">' + escapeHtml(fc) + '</button>';
      });
      return fBtns;
    })()}
    <label style="font-size:11px;padding:3px 10px;border-radius:5px;cursor:pointer;border:1px dashed #d1d5db;color:#6b7280;display:inline-flex;align-items:center;gap:3px" title="อัพโหลด Artwork">
      <i class="fas fa-upload" style="font-size:9px"></i> Artwork
      <input type="file" accept="image/*" onchange="App.uploadBoxArtwork(${ci},this)" style="display:none">
    </label>
    ${c?._artwork ? '<button onclick="App.clearBoxArtwork(' + ci + ')" style="font-size:10px;padding:2px 8px;border-radius:5px;cursor:pointer;border:1px solid #e53e3e;background:transparent;color:#e53e3e" title="ลบ Artwork">&times; ลบ</button>' : ''}
    <span style="flex:1;min-width:20px"></span>
    <span style="display:inline-flex;align-items:center;gap:8px;flex-shrink:0;margin-left:auto">
      <span style="font-size:12px;color:#6b7280;font-weight:500;white-space:nowrap">Type ${typeId} | ${c?.component_name || ''}</span>
      <button onclick="App.closeBoxPopup()" style="width:30px;height:30px;border-radius:50%;background:#e53e3e;color:#fff;border:none;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 6px rgba(229,62,62,0.3)"><i class="fas fa-times"></i></button>
    </span>
  `;
  modal.appendChild(header);

  // Content area
  const content = document.createElement('div');
  content.id = 'boxPopupContent';
  content.style.cssText = 'width:100%;height:clamp(300px,65vh,640px);display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff';
  modal.appendChild(content);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  _boxPopupOverlay = overlay;

  // Show default view
  _boxPopupSwitch(ci, typeId, mode || 'jpg');
}

function _boxPopupSwitch(ci, typeId, mode) {
  const content = document.getElementById('boxPopupContent');
  if (!content) return;
  const c = State.form?.components?.[ci];

  // Update button active states
  ['3d','svg','jpg'].forEach(m => {
    const btn = document.getElementById(`bpBtn${m === 'svg' ? 'Svg' : m === '3d' ? '3d' : 'Jpg'}`);
    if (btn) {
      if (m === mode) {
        btn.style.background = '#5b2d8e'; btn.style.color = '#fff'; btn.style.borderColor = '#5b2d8e';
      } else {
        btn.style.background = '#fff'; btn.style.color = '#374151'; btn.style.borderColor = '#d1d5db';
      }
    }
  });

  if (typeof Box3D !== 'undefined') Box3D.destroy();
  const fluteHtml = getFluteOverlayHtml(c);
  content.style.position = 'relative';

  if (mode === '3d') {
    content.innerHTML = '';
    content.style.background = '#1a1035';
    if (typeof Box3D !== 'undefined') {
      const szFlute = { ...c?.packaging_size, _fluteDir: c?.corrugated?.flute_side || null };
      // Artwork + coating (same as switchBoxView)
      if (c?._artwork) szFlute._artwork = c._artwork;
      const coatingAd2 = (c?.addon || []).find(a => a.type === 'coating');
      if (coatingAd2) szFlute._coating = (coatingAd2.info?.coating_option || '') + ' ' + (coatingAd2.info?.type || '');
      // Per-F color preview (same logic as switchBoxView)
      const activeFi = State._boxPreviewF?.[ci];
      if (activeFi != null) {
        szFlute._boxColor = F_PREVIEW_COLORS[activeFi % F_PREVIEW_COLORS.length];
        const cf = c?._color_per_f?.[activeFi];
        const fCode = cf?.f_code || State.form.f_data?.[activeFi]?.f_code || '';
        if (cf) szFlute._fLabel = fCode + ' (' + (cf.outside||0) + '/' + (cf.inside||0) + ' สี)';
        const addons = (c?.addon || []).filter(a => !a.f_codes?.length || a.f_codes.includes(fCode));
        const foilAds2 = addons.filter(a => a.type === 'foilstamp');
        szFlute._foils = foilAds2.map(a => ({ color: a.info?.foil_color || '', sizes: a.info?.sizes || [] }));
        const embAd2 = addons.find(a => a.type === 'emboss');
        szFlute._emboss = embAd2 ? { sizes: embAd2.info?.sizes || [] } : null;
        const debAd2 = addons.find(a => a.type === 'deboss');
        szFlute._deboss = debAd2 ? { sizes: debAd2.info?.sizes || [] } : null;
        szFlute._hasSpecialInk = cf?.is_special_ink || false;
        szFlute._specialInkColor = cf?.special_ink?.[0]?.ink_color || '';
      }
      Box3D.render(content, typeId, szFlute);
    } else {
      content.innerHTML = '<div style="color:#a78bfa;font-size:14px">กำลังโหลด 3D Engine...</div>';
    }
    // 3D mode: box-3d.js handles flute overlay internally
  } else if (mode === 'svg') {
    content.style.background = '#fff';
    const svg = typeof BoxSVG !== 'undefined' ? BoxSVG.generate(typeId, c?.packaging_size) : '';
    content.innerHTML = (svg ? `<div style="transform:scale(1.2);transform-origin:center">${svg}</div>` : `<img src="img/${typeId}.jpg" style="max-width:100%;max-height:100%;object-fit:contain">`) + fluteHtml;
  } else {
    content.style.background = '#fff';
    content.innerHTML = `<img src="img/${typeId}.jpg" style="max-width:100%;max-height:100%;object-fit:contain">` + fluteHtml;
  }
}

function closeBoxPopup() {
  if (typeof Box3D !== 'undefined') Box3D.destroy();
  const wasOpen = !!_boxPopupOverlay;
  if (_boxPopupOverlay) { _boxPopupOverlay.remove(); _boxPopupOverlay = null; }
  // Re-render small preview only when actually closing the modal (not re-opening)
  if (wasOpen) setTimeout(() => { if (!_boxPopupOverlay) refreshBoxViews(); }, 150);
}

function buildDimensionBar(typeId, sz) {
  const w = parseFloat(sz?.width) || 0;
  const l = parseFloat(sz?.length) || 0;
  const d = parseFloat(sz?.depth) || 0;
  if (!w && !l) return '';

  const gf = parseFloat(sz?.glue_flap) || 15;
  const tf = parseFloat(sz?.tuck_flap) || 15;
  const df = parseFloat(sz?.dust_flap) || 0;
  const ol = parseFloat(sz?.ol) || 0;

  let openW = 0, openL = 0;
  switch (parseInt(typeId)) {
    case 1: case 2: openW = 2*(w+tf)+d; openL = 2*(w+l)+gf; break;
    case 3: case 4: openW = tf+w+d+w/2+ol; openL = 2*(w+l)+gf; break;
    case 5: openW = w+4*d; openL = l+4*d+2*df; break;
    case 6: openW = w+4*d+2*df+2*ol; openL = l+4*d+2*df+2*ol; break;
    case 7: openW = 2*(l+df)+w; openL = 2*(l+d)+l; break;
    case 8: openW = tf+2*d+w/2+ol; openL = 2*(w+l)+gf; break;
    case 9: openW = d; openL = 2*(w+l)+gf; break;
    case 10: openW = l+d; openL = 2*w+gf; break;
    case 11: openW = 2*w+d; openL = 2*(w+l)+gf; break;
    case 12: openW = parseFloat(sz?.open_w) || w; openL = parseFloat(sz?.open_l) || l; break;
  }

  return `<div style="margin-top:6px;display:flex;gap:6px;font-size:10px;font-weight:600;flex-wrap:wrap">
    <span style="background:var(--accent);color:#fff;padding:2px 8px;border-radius:4px">W=${w} L=${l} D=${d} mm</span>
    <span style="background:#38a169;color:#fff;padding:2px 8px;border-radius:4px">Open: ${openW.toFixed(1)}×${openL.toFixed(1)} mm</span>
  </div>`;
}

/**
 * #92: Generate parametric SVG dieline for all 12 box templates
 * Draws die-cut pattern with fold lines, cut lines, flaps, and dimension labels
 */
function generateBoxTemplateSVG(typeId, sz) {
  if (!typeId || typeId < 1 || typeId > 12) return '';
  // ใช้ขนาด default ถ้ายังไม่กรอก เพื่อให้แสดง SVG เสมอ
  const w = parseFloat(sz?.width) || 60;
  const l = parseFloat(sz?.length) || 80;
  const d = parseFloat(sz?.depth) || 30;
  const hasSize = !!(parseFloat(sz?.width) || parseFloat(sz?.length));

  const gf = parseFloat(sz?.glue_flap) || 15;
  const tf = parseFloat(sz?.tuck_flap) || 15;
  const df = parseFloat(sz?.dust_flap) || (([5,6].includes(typeId)) ? 25 : 0);
  const ol = parseFloat(sz?.ol) || ([3,4,6,8].includes(typeId) ? 10 : 0);

  const svgW = 400, svgH = 336;
  const pad = 32;
  const C = { // colors
    main: '#f5f0ff', flap: '#e8dff5', glue: '#ddd6fe', dust: '#ede9fe',
    stroke: '#5b2d8e', fold: '#b794f4', dim: '#7c3aed', cut: '#5b2d8e',
  };
  const names = { 1:'Reverse Tuck End', 2:'Straight Tuck End', 3:'TTSLB (ออโต้ล็อค หูขัด)',
    4:'TTAB (ออโต้ล็อค ทากาว)', 5:'Tray ฝาครอบ', 6:'Frame-Vue Tray',
    7:'Four Corner Beers Tray', 8:'Gable Top (จั่ว)', 9:'Sleeve (ปลอก)',
    10:'Pillow Box (หมอน)', 11:'Seal End (ทากาว)', 12:'Custom (กำหนดเอง)' };

  // Compute open size
  let openW, openL;
  switch (typeId) {
    case 1: case 2: openW = 2*(w+tf)+d; openL = 2*(w+l)+gf; break;
    case 3: case 4: openW = tf+w+d+w/2+ol; openL = 2*(w+l)+gf; break;
    case 5: openW = w+4*d; openL = l+4*d+2*df; break;
    case 6: openW = w+4*d+2*df+2*ol; openL = l+4*d+2*df+2*ol; break;
    case 7: openW = 2*(l+df)+w; openL = 2*(l+d)+l; break;
    case 8: openW = tf+2*d+w/2+ol; openL = 2*(w+l)+gf; break;
    case 9: openW = d||1; openL = 2*(w+l)+gf; break;
    case 10: openW = l+d; openL = 2*w+gf; break;
    case 11: openW = 2*w+d; openL = 2*(w+l)+gf; break;
    case 12: openW = w||100; openL = l||100; break;
    default: openW = 200; openL = 300;
  }

  // Scale to fit SVG
  const drawW = svgW - pad*2, drawH = svgH - pad*2 - 16;
  const sc = Math.min(drawW/(openW||1), drawH/(openL||1)) * 0.82;
  const ox = pad + (drawW - openW*sc)/2;
  const oy = pad + 10 + (drawH - openL*sc)/2;
  const S = v => v * sc;

  // SVG helpers
  let paths = '', labels = '', dimLines = '';
  const R = (x,y,rw,rh,f,cls) => { if(rw<=0||rh<=0) return; paths += `<rect x="${(ox+S(x)).toFixed(1)}" y="${(oy+S(y)).toFixed(1)}" width="${S(rw).toFixed(1)}" height="${S(rh).toFixed(1)}" fill="${f||C.main}" stroke="${C.stroke}" stroke-width="1.2" rx="0.5"/>`; };
  const Rd = (x,y,rw,rh) => { if(rw<=0||rh<=0) return; paths += `<rect x="${(ox+S(x)).toFixed(1)}" y="${(oy+S(y)).toFixed(1)}" width="${S(rw).toFixed(1)}" height="${S(rh).toFixed(1)}" fill="none" stroke="${C.fold}" stroke-width="1" stroke-dasharray="4,3"/>`; };
  const FL = (x1,y1,x2,y2) => { paths += `<line x1="${(ox+S(x1)).toFixed(1)}" y1="${(oy+S(y1)).toFixed(1)}" x2="${(ox+S(x2)).toFixed(1)}" y2="${(oy+S(y2)).toFixed(1)}" stroke="${C.fold}" stroke-width="0.8" stroke-dasharray="3,2"/>`; };
  const LB = (x,y,rw,rh,txt,size) => { labels += `<text x="${(ox+S(x+rw/2)).toFixed(1)}" y="${(oy+S(y+rh/2)+1).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="${C.stroke}" font-size="${size||8}" font-weight="600" opacity="0.65">${txt}</text>`; };
  const DH = (x,y,len,label) => { const x1=ox+S(x),x2=ox+S(x+len),yy=oy+S(y); dimLines += `<line x1="${x1.toFixed(1)}" y1="${yy.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${yy.toFixed(1)}" stroke="${C.dim}" stroke-width="0.7" marker-start="url(#aL)" marker-end="url(#aR)"/><text x="${((x1+x2)/2).toFixed(1)}" y="${(yy-3).toFixed(1)}" text-anchor="middle" fill="${C.dim}" font-size="9" font-weight="600">${label}</text>`; };
  const DV = (x,y,len,label) => { const xx=ox+S(x),y1=oy+S(y),y2=oy+S(y+len); dimLines += `<line x1="${xx.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${xx.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${C.dim}" stroke-width="0.7" marker-start="url(#aU)" marker-end="url(#aD)"/><text x="${(xx-3).toFixed(1)}" y="${((y1+y2)/2).toFixed(1)}" text-anchor="end" fill="${C.dim}" font-size="9" font-weight="600" dominant-baseline="middle">${label}</text>`; };

  // Grid helper: draw rows × cols of panels
  const drawGrid = (cols, rows, colorFn, labelFn) => {
    let cx = 0;
    cols.forEach((cw, ci) => {
      let ry = 0;
      rows.forEach((rh, ri) => {
        if (cw > 0 && rh > 0) {
          const color = colorFn ? colorFn(ci, ri) : C.main;
          if (color === 'dash') Rd(cx, ry, cw, rh);
          else R(cx, ry, cw, rh, color);
          if (labelFn) { const lb = labelFn(ci, ri); if (lb) LB(cx, ry, cw, rh, lb); }
        }
        ry += rh;
      });
      cx += cw;
    });
  };

  switch (typeId) {
    case 1: { // Reverse Tuck End — ฝาเสียบสลับด้าน
      const cols = [tf, w, d, w, tf];
      const rows = [w, l, w, l, gf]; // bottom-tuck | front | top-tuck | back | glue
      drawGrid(cols, rows,
        (ci, ri) => {
          if (ci === 0 && (ri === 0 || ri === 4)) return 'dash'; // left tuck flaps
          if (ci === 4 && (ri === 0 || ri === 4)) return 'dash';
          if (ci === 0 || ci === 4) return C.flap; // tuck flap panels
          if (ri === 0 || ri === 2) return C.flap; // top/bottom flaps
          if (ri === 4) return C.glue; // glue flap
          return C.main;
        },
        (ci, ri) => {
          if (ci === 1 && ri === 1) return `W×L`;
          if (ci === 2 && ri === 1) return `D`;
          if (ci === 0 && ri === 1) return `tf`;
          if (ci === 1 && ri === 4) return `gf`;
          return '';
        });
      DH(0, -3, openW, `${openW.toFixed(0)}`); DV(-5, 0, openL, `${openL.toFixed(0)}`);
      // Column dims
      let cx2 = 0; [tf,w,d,w,tf].forEach((v,i) => { if(i<3) DH(cx2, openL+2, v, i===0?'tf':i===1?'w':'d'); cx2+=v; });
      break;
    }
    case 2: { // Straight Tuck End — ฝาเสียบตรง (same layout, tucks same side)
      const cols = [tf, w, d, w, tf];
      const rows = [w, l, w, l, gf];
      drawGrid(cols, rows,
        (ci, ri) => {
          if ((ci === 0 || ci === 4) && (ri === 0 || ri === 4)) return 'dash';
          if (ci === 0 || ci === 4) return C.flap;
          if (ri === 0 || ri === 2) return C.flap;
          if (ri === 4) return C.glue;
          return C.main;
        },
        (ci, ri) => {
          if (ci === 1 && ri === 1) return `W×L`;
          if (ci === 2 && ri === 1) return `D`;
          if (ci === 0 && ri === 1) return `tf`;
          if (ci === 1 && ri === 4) return `gf`;
          return '';
        });
      DH(0, -3, openW, `${openW.toFixed(0)}`); DV(-5, 0, openL, `${openL.toFixed(0)}`);
      let cx2 = 0; [tf,w,d,w,tf].forEach((v,i) => { if(i<3) DH(cx2, openL+2, v, i===0?'tf':i===1?'w':'d'); cx2+=v; });
      break;
    }
    case 3: { // TTSLB — ออโต้ล็อค หูขัด
      const hw = w/2;
      const cols = [tf, w, d, hw, ol||10];
      const rows = [w, l, w, l, gf];
      drawGrid(cols, rows,
        (ci, ri) => {
          if (ci === 0 && (ri === 0 || ri === 4)) return 'dash';
          if (ci === 4) return C.dust; // overlap
          if (ci === 3 && (ri === 0 || ri === 2)) return C.dust; // half-w flaps
          if (ci === 0) return C.flap;
          if (ri === 0 || ri === 2) return C.flap;
          if (ri === 4) return C.glue;
          return C.main;
        },
        (ci, ri) => {
          if (ci === 1 && ri === 1) return `W×L`;
          if (ci === 2 && ri === 1) return `D`;
          if (ci === 3 && ri === 1) return `W/2`;
          if (ci === 4 && ri === 1) return `ol`;
          return '';
        });
      DH(0, -3, openW, `${openW.toFixed(0)}`); DV(-5, 0, openL, `${openL.toFixed(0)}`);
      break;
    }
    case 4: { // TTAB — ออโต้ล็อค ทากาว
      const hw = w/2;
      const cols = [tf, w, d, hw, ol||10];
      const rows = [w, l, w, l, gf];
      drawGrid(cols, rows,
        (ci, ri) => {
          if (ci === 0 && (ri === 0 || ri === 4)) return 'dash';
          if (ci === 4) return C.glue; // overlap/glue
          if (ci === 3 && (ri === 0 || ri === 2)) return C.dust;
          if (ci === 0) return C.flap;
          if (ri === 0 || ri === 2) return C.flap;
          if (ri === 4) return C.glue;
          return C.main;
        },
        (ci, ri) => {
          if (ci === 1 && ri === 1) return `W×L`;
          if (ci === 2 && ri === 1) return `D`;
          if (ci === 3 && ri === 1) return `W/2`;
          if (ci === 4 && ri === 1) return `ol`;
          return '';
        });
      DH(0, -3, openW, `${openW.toFixed(0)}`); DV(-5, 0, openL, `${openL.toFixed(0)}`);
      break;
    }
    case 5: { // Double Glue Side Wall — ฝาครอบ (Tray Lid)
      const cols = [d, d, w, d, d];
      const _df = df || 25;
      const rows = [_df, d, d, l, d, d, _df];
      drawGrid(cols, rows,
        (ci, ri) => {
          const isEdgeCol = ci === 0 || ci === 4;
          const isEdgeRow = ri === 0 || ri === 6;
          if (isEdgeCol && isEdgeRow) return C.dust; // corner tabs
          if (isEdgeRow) return C.dust; // dust flaps
          if (isEdgeCol && (ri === 1 || ri === 5)) return C.flap; // side walls
          if (ci === 2 && ri === 3) return C.main; // center = base
          return C.flap;
        },
        (ci, ri) => {
          if (ci === 2 && ri === 3) return `W×L`;
          if (ci === 0 && ri === 3) return `D`;
          if (ci === 2 && ri === 0) return df?'dust':'';
          return '';
        });
      DH(0, -3, openW, `${openW.toFixed(0)}`); DV(-5, 0, openL, `${openL.toFixed(0)}`);
      // show column dims
      let cx2=0; [d,d,w,d,d].forEach((v,i)=>{ if(i<=2) DH(cx2,openL+2,v,i===2?'w':'d'); cx2+=v; });
      break;
    }
    case 6: { // Frame-Vue Tray
      const _df = df || 25;
      const _ol = ol || 10;
      const cols = [_ol, _df, d, d, w, d, d, _df, _ol];
      const rows = [_ol, _df, d, d, l, d, d, _df, _ol];
      drawGrid(cols, rows,
        (ci, ri) => {
          const isOL = ci === 0 || ci === 8 || ri === 0 || ri === 8;
          const isDust = ci === 1 || ci === 7 || ri === 1 || ri === 7;
          if (isOL) return C.dust;
          if (isDust) return C.flap;
          if (ci === 4 && ri === 4) return C.main; // center base
          return C.flap;
        },
        (ci, ri) => {
          if (ci === 4 && ri === 4) return `W×L`;
          return '';
        });
      DH(0, -3, openW, `${openW.toFixed(0)}`); DV(-5, 0, openL, `${openL.toFixed(0)}`);
      break;
    }
    case 7: { // Four Corner Beers Tray
      const _df = df || 25;
      const cols = [l, _df, w, _df, l];
      const rows = [l, d, l, d, l];
      drawGrid(cols, rows,
        (ci, ri) => {
          const isCorner = (ci === 0 || ci === 4) && (ri === 0 || ri === 4);
          if (isCorner) return C.dust; // corner pieces
          if (ci === 0 || ci === 4) return C.flap; // side walls
          if (ri === 0 || ri === 4) return C.flap; // end walls
          if (ci === 1 || ci === 3) return C.dust; // dust flaps
          if (ci === 2 && ri === 2) return C.main; // base
          return C.flap;
        },
        (ci, ri) => {
          if (ci === 2 && ri === 2) return `W×L`;
          if (ci === 0 && ri === 2) return `L`;
          if (ci === 2 && ri === 1) return `D`;
          if (ci === 1 && ri === 2) return `df`;
          return '';
        });
      DH(0, -3, openW, `${openW.toFixed(0)}`); DV(-5, 0, openL, `${openL.toFixed(0)}`);
      break;
    }
    case 8: { // Gable Top — จั่ว
      const hw = w/2;
      const cols = [tf, d, d, hw, ol||10];
      const rows = [w, l, w, l, gf];
      drawGrid(cols, rows,
        (ci, ri) => {
          if (ci === 0 && (ri === 0 || ri === 4)) return 'dash';
          if (ci === 4) return C.dust;
          if (ci === 0) return C.flap;
          if (ri === 0 || ri === 2) return C.flap;
          if (ri === 4) return C.glue;
          return C.main;
        },
        (ci, ri) => {
          if (ci === 1 && ri === 1) return `D`;
          if (ci === 2 && ri === 1) return `D`;
          if (ci === 3 && ri === 1) return `W/2`;
          if (ci === 0 && ri === 1) return `tf`;
          return '';
        });
      DH(0, -3, openW, `${openW.toFixed(0)}`); DV(-5, 0, openL, `${openL.toFixed(0)}`);
      break;
    }
    case 9: { // Sleeve — ปลอก
      const rows = [gf, l, w, l, w];
      let ry = 0;
      rows.forEach((rh, ri) => {
        if (rh <= 0) { ry += rh; return; }
        R(0, ry, d, rh, ri === 0 ? C.glue : (ri % 2 === 0 ? C.flap : C.main));
        const lb = ri === 0 ? 'gf' : ri === 1 ? 'L' : ri === 2 ? 'W' : ri === 3 ? 'L' : 'W';
        LB(0, ry, d, rh, lb);
        // Fold lines between panels
        if (ri > 0) FL(0, ry, d, ry);
        ry += rh;
      });
      DH(0, -3, d, `D=${d}`); DV(-5, 0, openL, `${openL.toFixed(0)}`);
      // Row dims on right side
      ry = 0; rows.forEach((rh,ri) => { DV(d+3, ry, rh, ri===0?'gf':ri===1?`${l}`:ri===2?`${w}`:ri===3?`${l}`:`${w}`); ry+=rh; });
      break;
    }
    case 10: { // Pillow Box — หมอน
      const cols = [l, d];
      const rows = [gf, w, w];
      drawGrid(cols, rows,
        (ci, ri) => {
          if (ri === 0) return C.glue;
          if (ci === 1) return C.flap; // depth side
          return C.main;
        },
        (ci, ri) => {
          if (ci === 0 && ri === 1) return `L×W`;
          if (ci === 1 && ri === 1) return `D`;
          if (ci === 0 && ri === 0) return `gf`;
          return '';
        });
      // Draw curved pillow flap hints
      const cx1 = ox+S(0), cx2 = ox+S(l/2), cx3 = ox+S(l);
      const ty = oy+S(gf);
      const by = oy+S(gf+2*w);
      paths += `<path d="M${cx1.toFixed(1)},${ty.toFixed(1)} Q${cx2.toFixed(1)},${(ty-S(w*0.15)).toFixed(1)} ${cx3.toFixed(1)},${ty.toFixed(1)}" fill="none" stroke="${C.fold}" stroke-width="1" stroke-dasharray="4,3"/>`;
      paths += `<path d="M${cx1.toFixed(1)},${by.toFixed(1)} Q${cx2.toFixed(1)},${(by+S(w*0.15)).toFixed(1)} ${cx3.toFixed(1)},${by.toFixed(1)}" fill="none" stroke="${C.fold}" stroke-width="1" stroke-dasharray="4,3"/>`;
      DH(0, -3, openW, `${openW.toFixed(0)}`); DV(-5, 0, openL, `${openL.toFixed(0)}`);
      break;
    }
    case 11: { // Seal End — ทากาว
      const cols = [w, d, w];
      const rows = [w, l, w, l, gf];
      drawGrid(cols, rows,
        (ci, ri) => {
          if (ri === 0 || ri === 2) return C.flap; // end flaps
          if (ri === 4) return C.glue;
          if (ci === 1) return C.main; // front/back depth panel
          return C.main;
        },
        (ci, ri) => {
          if (ci === 0 && ri === 1) return `W`;
          if (ci === 1 && ri === 1) return `D`;
          if (ci === 2 && ri === 1) return `W`;
          if (ci === 1 && ri === 3) return `L`;
          if (ci === 0 && ri === 4) return `gf`;
          return '';
        });
      DH(0, -3, openW, `${openW.toFixed(0)}`); DV(-5, 0, openL, `${openL.toFixed(0)}`);
      let cx2=0; [w,d,w].forEach((v,i)=>{ DH(cx2,openL+2,v,i===1?'d':'w'); cx2+=v; });
      break;
    }
    case 12: { // Custom
      R(0, 0, openW, openL, C.main);
      LB(0, 0, openW, openL, 'Custom', 11);
      DH(0, -3, openW, `W=${w}`); DV(-5, 0, openL, `L=${l}`);
      break;
    }
  }

  return `<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="max-width:100%;height:auto;background:#fff;border-radius:8px;border:1px solid var(--border)">
    <defs>
      <marker id="aR" viewBox="0 0 6 6" refX="6" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L6,3 L0,6" fill="${C.dim}"/></marker>
      <marker id="aL" viewBox="0 0 6 6" refX="0" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M6,0 L0,3 L6,6" fill="${C.dim}"/></marker>
      <marker id="aD" viewBox="0 0 6 6" refX="3" refY="6" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L3,6 L6,0" fill="${C.dim}"/></marker>
      <marker id="aU" viewBox="0 0 6 6" refX="3" refY="0" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,6 L3,0 L6,6" fill="${C.dim}"/></marker>
    </defs>
    <text x="${svgW/2}" y="14" text-anchor="middle" fill="${C.stroke}" font-size="11" font-weight="700">Type ${typeId}: ${names[typeId]||''}</text>
    ${paths}${labels}${dimLines}
    <text x="${svgW/2}" y="${svgH-5}" text-anchor="middle" fill="#999" font-size="8">${hasSize ? `W=${w} L=${l} D=${d} mm | Open: ${openW.toFixed(1)}×${openL.toFixed(1)} mm` : 'กรอกขนาด W×L×D เพื่อดูขนาดจริง'}</text>
  </svg>`;
}

/**
 * Build Open Size formula display (#89)
 */
function buildOpenSizeFormula(comp, layout) {
  if (!comp || !layout?.unfolded) return '';
  const sz = comp.packaging_size;
  const bt = comp.box_type;
  if (!sz || !bt) return '';

  const w = parseFloat(sz.width) || 0;
  const l = parseFloat(sz.length) || 0;
  const d = parseFloat(sz.depth) || 0;
  const gf = parseFloat(sz.glue_flap) || 15;
  const tf = parseFloat(sz.tuck_flap) || 15;
  const df = parseFloat(sz.dust_flap) || 0;
  const ol = parseFloat(sz.ol) || 0;
  const b = CalcEngine.CALC.bleed;
  const tid = parseInt(bt.type_id) || 1;

  const templateNames = {
    1: 'Reverse Tuck End', 2: 'Straight Tuck End', 3: 'TTSLB (ออโต้ล็อคหูขัด)',
    4: 'TTAB (ออโต้ล็อคทากาว)', 5: 'Double Glue Side Wall (ฝาครอบ)', 6: 'Frame-Vue Tray',
    7: 'Four Corner Beers Tray', 8: 'Gable Top (จั่ว)', 9: 'Sleeve (ปลอก)',
    10: 'Pillow Box (หมอน)', 11: 'Seal End (ทากาว)', 12: 'Custom (กำหนดเอง)',
  };

  let formulaW = '', formulaL = '', calcW = '', calcL = '';
  switch (tid) {
    case 1: case 2:
      formulaW = `2(w + tf) + d`; calcW = `2(${w} + ${tf}) + ${d} = ${2*(w+tf)+d}`;
      formulaL = `2(w + l) + gf`; calcL = `2(${w} + ${l}) + ${gf} = ${2*(w+l)+gf}`;
      break;
    case 3: case 4:
      formulaW = `tf + w + d + w/2 + ol`; calcW = `${tf} + ${w} + ${d} + ${w/2} + ${ol} = ${tf+w+d+w/2+ol}`;
      formulaL = `2(w + l) + gf`; calcL = `2(${w} + ${l}) + ${gf} = ${2*(w+l)+gf}`;
      break;
    case 5:
      formulaW = `w + 4d`; calcW = `${w} + 4×${d} = ${w+4*d}`;
      formulaL = `l + 4d + 2×dust`; calcL = `${l} + 4×${d} + 2×${df} = ${l+4*d+2*df}`;
      break;
    case 6:
      formulaW = `w + 4d + 2×dust + 2×ol`; calcW = `${w} + 4×${d} + 2×${df} + 2×${ol} = ${w+4*d+2*df+2*ol}`;
      formulaL = `l + 4d + 2×dust + 2×ol`; calcL = `${l} + 4×${d} + 2×${df} + 2×${ol} = ${l+4*d+2*df+2*ol}`;
      break;
    case 7:
      formulaW = `2(l + dust) + w`; calcW = `2(${l} + ${df}) + ${w} = ${2*(l+df)+w}`;
      formulaL = `2(l + d) + l`; calcL = `2(${l} + ${d}) + ${l} = ${2*(l+d)+l}`;
      break;
    case 8:
      formulaW = `tf + 2d + w/2 + ol`; calcW = `${tf} + 2×${d} + ${w/2} + ${ol} = ${tf+2*d+w/2+ol}`;
      formulaL = `2(w + l) + gf`; calcL = `2(${w} + ${l}) + ${gf} = ${2*(w+l)+gf}`;
      break;
    case 9:
      formulaW = `d`; calcW = `${d}`;
      formulaL = `2(w + l) + gf`; calcL = `2(${w} + ${l}) + ${gf} = ${2*(w+l)+gf}`;
      break;
    case 10:
      formulaW = `l + d`; calcW = `${l} + ${d} = ${l+d}`;
      formulaL = `2w + gf`; calcL = `2×${w} + ${gf} = ${2*w+gf}`;
      break;
    case 11:
      formulaW = `2w + d`; calcW = `2×${w} + ${d} = ${2*w+d}`;
      formulaL = `2(w + l) + gf`; calcL = `2(${w} + ${l}) + ${gf} = ${2*(w+l)+gf}`;
      break;
    case 12:
      formulaW = `กำหนดเอง`; calcW = `${layout.unfolded.rawW}`;
      formulaL = `กำหนดเอง`; calcL = `${layout.unfolded.rawL}`;
      break;
  }

  const rawW = layout.unfolded.rawW;
  const rawL = layout.unfolded.rawL;

  return `<div style="background:var(--bg-tertiary);border-radius:6px;padding:6px 10px;font-size:11px;color:var(--text-secondary);border-left:3px solid var(--accent)">
    <div style="font-weight:600;margin-bottom:2px"><i class="fas fa-drafting-compass"></i> Type ${tid}: ${templateNames[tid] || ''}</div>
    <div>W = ${formulaW} → <b>${calcW}</b> mm</div>
    <div>L = ${formulaL} → <b>${calcL}</b> mm</div>
    <div style="color:var(--accent)">+ Bleed ${b}mm ×2 → <b>${rawW + 2*b} × ${rawL + 2*b}</b> mm</div>
  </div>`;
}

/**
 * Build Layout Summary (#91) — UPS, Waste%, Utilization
 */
function buildLayoutSummary(r, layout, printType) {
  if (!r.paperResults?.length || !layout?.best) return '';
  const best = layout.best;
  const u = layout.unfolded;
  const ups = best.ups;
  const isOverlap = best.layingType === 'overlap';

  // Paper utilization % — use actual print area for overlap
  const printArea = (best.printW_mm || u.openW * best.nw) * (best.printL_mm || u.openL * best.nl);
  const sheetArea = best.sw * best.sl;
  const utilization = sheetArea > 0 ? (printArea / sheetArea * 100) : 0;

  // Waste info from first qty
  const pr = r.paperResults[0];
  const wasteTotal = pr?.waste?.total || 0;
  const afterUps = pr?.afterUps || 0;
  const wastePct = afterUps > 0 ? (wasteTotal / afterUps * 100) : 0;

  // Laying type badge
  const layBadge = isOverlap
    ? `<span style="display:inline-block;font-size:9px;padding:1px 6px;border-radius:4px;background:#7c3aed;color:#fff;margin-top:2px">OVERLAP</span>`
    : `<span style="display:inline-block;font-size:9px;padding:1px 6px;border-radius:4px;background:var(--bg-secondary);color:var(--text-muted);margin-top:2px">STRAIGHT</span>`;

  // Corrugated board size
  const corrBoard = best.corrugatedBoard;
  // Only show Corrugated Board section when applicable
  if (!corrBoard) return '';

  const tolVal = corrBoard.tolerance || 0;
  const rndW = corrBoard.layoutRoundedW || mm2inchLegacy(best.layoutW_mm || 0);
  const rndL = corrBoard.layoutRoundedL || mm2inchLegacy(best.layoutL_mm || 0);

  return `<div style="margin-top:10px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:10px;padding:12px 16px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="font-size:13px;font-weight:700;color:#e67e22"><i class="fas fa-layer-group"></i> Corrugated Board</span>
      <span style="font-size:11px;color:var(--text-muted)">(ขนาดลูกฟูกที่ใช้ประกบ)</span>
    </div>
    <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
      <div style="text-align:center">
        <div style="font-size:20px;font-weight:700;color:#e67e22">${corrBoard.wIn}" × ${corrBoard.lIn}"</div>
        <div style="font-size:11px;color:var(--text-muted)">${corrBoard.wMm.toFixed(0)} × ${corrBoard.lMm.toFixed(0)} mm</div>
      </div>
      ${tolVal ? `<div style="font-size:11px;color:var(--text-secondary);line-height:1.5;border-left:2px solid var(--border-color);padding-left:12px">
        <div><b>สูตร:</b> Round(Layout) - ${tolVal}" ต่อด้าน</div>
        <div style="color:var(--text-muted)">W: Round(${mm2inchLegacy(best.layoutW_mm||0)}") = ${rndW}" → ${rndW}" - ${tolVal}" = <b>${corrBoard.wIn}"</b></div>
        <div style="color:var(--text-muted)">L: Round(${mm2inchLegacy(best.layoutL_mm||0)}") = ${rndL}" → ${rndL}" - ${tolVal}" = <b>${corrBoard.lIn}"</b></div>
        <div style="color:var(--text-muted);font-size:10px;margin-top:2px">* ปัดขนาด Layout ก่อน แล้วหัก ${tolVal}" (ลูกฟูกเล็กกว่ากระดาษเพื่อให้พับคลุมขอบได้)</div>
      </div>` : ''}
    </div>
  </div>`;
}

/**
 * #95: AI recommend afterpress machines (Diecut, Gluing, Coating, etc.)
 */
/**
 * Layout Comparison — compare top layouts, recommend only when better option exists
 */
function buildLayoutIntelligence(results, printType) {
  if (!State.form?.components?.length || !results?.length) return '';
  const qtys = (State.form.qty || []).filter(q => q).map(q => parseInt(q));
  const firstQty = qtys[0] || 0;
  if (!firstQty) return '';

  let h = '';

  results.forEach((r, ri) => {
    if (r.error || !r.layout?.all?.length) return;
    const lay = r.layout;
    const best = lay.best;
    const comp = State.form.components[ri];
    const openW = lay.unfolded.openW, openL = lay.unfolded.openL;

    // Deduplicate alternatives by sheetName + ups (some have rotated duplicates)
    // กรอง custom paper (user กรอกเอง) ออก — ไม่ใช่กระดาษจริงจาก master DB จะแนะนำไม่ได้
    // ยกเว้นว่า "ปัจจุบัน" คือ custom เอง (user เลือก) → แสดงเฉพาะ row นั้น
    const currentBest = lay.best;
    const currentIsCustom = !!currentBest?._isCustom;
    const seen = new Set();
    const alternatives = lay.all.filter(a => {
      // ไม่แนะนำ custom paper เด็ดขาด — ยกเว้น row "ปัจจุบัน" ที่ user เลือกเอง
      if (a._isCustom && !(currentIsCustom && a.sheetName === currentBest.sheetName && a.ups === currentBest.ups && a.rotated === currentBest.rotated)) {
        return false;
      }
      const key = `${a.sheetName}_${a.ups}_${a.rotated}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8); // max 8

    if (alternatives.length < 2) return; // only 1 option, nothing to compare

    // Calculate score for each layout
    const scored = alternatives.map(a => {
      const sheetArea = a.sw * a.sl;
      // For overlap: use actual print footprint, not openW*openL*ups
      let usedArea;
      if (a.layingType === 'overlap' && a._boxW) {
        const pw = a._overlapW > 0 && a.nw > 1 ? a._boxW + (a.nw-1)*(a._boxW - a._overlapW) : a.nw * a._boxW;
        const pl = a._overlapL > 0 && a.nl > 1 ? a._boxL + (a.nl-1)*(a._boxL - a._overlapL) : a.nl * a._boxL;
        usedArea = pw * pl;
      } else {
        usedArea = openW * openL * a.ups;
      }
      const utilization = sheetArea > 0 ? (usedArea / sheetArea * 100) : 0;
      const afterUps = Math.ceil(firstQty / a.ups);
      const waste = CalcEngine.calcWaste(afterUps, comp, printType);
      const paperNet = Math.ceil((afterUps + waste.total) / 100) * 100;
      const wastePct = afterUps > 0 ? (waste.total / afterUps * 100) : 0;

      // Estimate paper cost (simplified)
      const paperGram = parseFloat(comp.paper?.paper_gram) || 0;
      const paperCost = parseFloat(comp.paper?.paper_cost) || 0;
      const rollW = a.rollW_in || a.paperW_in || Math.round(a.sw/25.4);
      const rollL = a.rollL_in || a.paperL_in || Math.round(a.sl/25.4);
      const unitPrice = paperGram > 0 && paperCost > 0 ? (rollW * rollL * paperCost * 1.1 * paperGram / 1550000) : 0;
      const totalPaperCost = unitPrice * paperNet;
      const costPerPiece = firstQty > 0 && unitPrice > 0 ? (totalPaperCost / firstQty) : 0;

      return {
        ...a, utilization, afterUps, wastePct, paperNet, totalPaperCost, costPerPiece,
        isCurrent: a.sheetName === best.sheetName && a.ups === best.ups && a.rotated === best.rotated,
      };
    });

    // Sort by: UPS desc → utilization desc → wastePct asc
    scored.sort((a, b) => {
      if (b.ups !== a.ups) return b.ups - a.ups;
      if (Math.abs(b.utilization - a.utilization) > 2) return b.utilization - a.utilization;
      return a.wastePct - b.wastePct;
    });

    const current = scored.find(s => s.isCurrent) || scored[0];
    // แนะนำเฉพาะกระดาษจริงจาก master DB (ไม่เอา custom เป็น "แนะนำ")
    const recommended = scored.find(s => !s._isCustom) || scored[0];
    const hasBetter = !recommended.isCurrent && !recommended._isCustom && (
      recommended.ups > current.ups ||
      (recommended.ups === current.ups && recommended.utilization > current.utilization + 5)
    );

    // Build comparison table (top 5)
    const top = scored.slice(0, 5);

    h += `<div class="detail-card">`;
    h += `<h6 style="display:flex;align-items:center;gap:8px"><i class="fas fa-th"></i> Layout Comparison — ${escapeHtml(r.name)}
      <button onclick="App.toggleLayoutMethodology(${ri})" style="margin-left:auto;background:transparent;border:1px dashed var(--border-color);color:var(--text-muted);font-size:10px;padding:3px 8px;border-radius:5px;cursor:pointer"><i class="fas fa-info-circle"></i> ที่มา / วิธีคำนวณ</button>
    </h6>`;

    // === Methodology disclosure (collapsed by default) ===
    h += `<div id="layoutMethodology_${ri}" style="display:none;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:8px;padding:12px 14px;margin-bottom:10px;font-size:11px;line-height:1.6">
      <div style="font-weight:700;color:var(--text-primary);margin-bottom:6px"><i class="fas fa-cogs" style="color:#5b2d8e"></i> ที่มาของการแนะนำ — ไม่ใช่ AI/LLM, เป็น rule-based optimization</div>
      <div style="color:var(--text-secondary)">
        <b>📚 แหล่งข้อมูล:</b><br>
        • กระดาษมาตรฐาน: ตาราง <code>machine_std_paper_info</code> จาก Estimate API (192.168.5.3) — ฝ่ายจัดซื้อ maintain<br>
        • สูตร waste: ตาราง <code>waste_info</code> ตามจำนวนพิมพ์<br>
        • Tolerance เครื่อง: gripper, color bar, paper edge ตามสเปคเครื่องจริง<br>
        <br>
        <b>🧮 วิธีคำนวณ (deterministic — รันกี่ครั้งก็เท่าเดิม):</b><br>
        1. วน loop กระดาษมาตรฐานทุกขนาดที่เครื่องนี้ใช้ได้<br>
        2. ลองวาง (straight, rotated, overlap) → คำนวณ <b>UPS</b><br>
        3. คำนวณ <b>utilization</b> = พื้นที่ใช้พิมพ์ / พื้นที่กระดาษทั้งหมด<br>
        4. คำนวณ <b>waste %</b> + <b>paper net</b> + <b>ต้นทุน/ชิ้น</b><br>
        5. จัดเรียง: <b>UPS มาก → utilization สูง → waste น้อย</b><br>
        6. แนะนำตัวบนสุด (เฉพาะกระดาษจริงจาก master DB)<br>
        <br>
        <b>✅ น่าเชื่อถือเพราะ:</b> ใช้ master data เดียวกับระบบ Estimate API เก่า + สูตรเดียวกัน → ตรวจสอบได้<br>
        <b>⚠️ ข้อจำกัด:</b> ไม่ได้เช็ค stock จริงในคลัง / lead time / ราคาวันนี้ — ต้องตรวจสอบกับฝ่ายจัดซื้อก่อนสั่งจริง
      </div>
    </div>`;

    if (hasBetter) {
      const savePct = current.paperNet > 0 ? ((current.paperNet - recommended.paperNet) / current.paperNet * 100) : 0;
      const upsGain = recommended.ups - current.ups;
      const utilGain = recommended.utilization - current.utilization;
      // เหตุผลเชิงตัวเลข
      const reasons = [];
      if (upsGain > 0) reasons.push(`UPS เพิ่ม ${upsGain} ดวง (${current.ups}→${recommended.ups})`);
      if (utilGain > 1) reasons.push(`Utilization สูงกว่า ${utilGain.toFixed(1)}%`);
      if (savePct > 1) reasons.push(`ประหยัด ${num(current.paperNet - recommended.paperNet)} แผ่น (~${savePct.toFixed(0)}%)`);
      h += `<div style="background:rgba(56,161,105,0.1);border:1px solid #38a169;border-radius:8px;padding:10px 14px;margin-bottom:10px;font-size:12px">
        <div style="font-weight:700;color:#276749;margin-bottom:4px;display:flex;align-items:center;gap:6px"><i class="fas fa-lightbulb" style="color:#38a169"></i> แนะนำเปลี่ยนกระดาษ
          <span style="font-size:9px;background:#fff;color:#276749;padding:1px 6px;border-radius:4px;border:1px solid #38a169;font-weight:600">RULE-BASED</span>
        </div>
        <div style="color:#2f855a">กระดาษ <b>${recommended.sheetName}</b> ดีกว่าเพราะ:
          <ul style="margin:4px 0 0 18px;padding:0">${reasons.map(r => '<li>' + r + '</li>').join('')}</ul>
        </div>
        <div style="color:#276749;font-size:10px;margin-top:6px;font-style:italic">📊 ที่มา: machine_std_paper_info (Estimate API master DB) — กดดู "ที่มา / วิธีคำนวณ" ด้านบนสำหรับรายละเอียด</div>
        <button class="btn btn-primary" style="margin-top:8px;font-size:12px;padding:5px 16px;border-radius:6px" onclick="App.applyLayoutRecommendation(${ri},'${recommended.sheetName}')">
          <i class="fas fa-check"></i> ใช้กระดาษ ${recommended.sheetName}
        </button>
      </div>`;
    } else {
      h += `<div style="background:rgba(56,161,105,0.08);border:1px solid rgba(56,161,105,0.3);border-radius:8px;padding:8px 14px;margin-bottom:10px;font-size:12px;color:#276749">
        <i class="fas fa-check-circle" style="color:#38a169"></i> <b>กระดาษปัจจุบันเหมาะสมแล้ว</b> — ${current.sheetName} ได้ ${current.ups} UPS, utilization ${current.utilization.toFixed(1)}% (เทียบจากกระดาษมาตรฐานทุกขนาดของเครื่อง)
      </div>`;
    }

    // Comparison table
    const thI = 'style="text-align:center;padding:6px 4px;line-height:1.3"';
    h += `<table class="detail-table" style="font-size:11px;margin-top:6px"><thead><tr>
      <th ${thI}></th>
      <th ${thI}>กระดาษ<br><span style="font-weight:400;font-size:9px;color:var(--text-muted)">(Paper)</span></th>
      <th ${thI}>UPS<br><span style="font-weight:400;font-size:9px;color:var(--text-muted)">(จำนวนดวง)</span></th>
      <th ${thI}>LAYING<br><span style="font-weight:400;font-size:9px;color:var(--text-muted)">(วิธีวาง)</span></th>
      <th ${thI}>UTILIZATION<br><span style="font-weight:400;font-size:9px;color:var(--text-muted)">(ใช้พื้นที่)</span></th>
      <th ${thI}>WASTE%<br><span style="font-weight:400;font-size:9px;color:var(--text-muted)">(เสีย)</span></th>
      <th ${thI}>PAPER NET<br><span style="font-weight:400;font-size:9px;color:var(--text-muted)">(กระดาษสุทธิ)</span></th>
      ${top[0].costPerPiece > 0 ? `<th ${thI}>ต้นทุนกระดาษ/ชิ้น<br><span style="font-weight:400;font-size:9px;color:var(--text-muted)">(บาท)</span></th>` : ''}
    </tr></thead><tbody>`;

    top.forEach((s, si) => {
      const isCur = s.isCurrent;
      const isRec = si === 0 && hasBetter;
      const rowStyle = isCur ? 'background:rgba(124,58,237,0.06);font-weight:600' : isRec ? 'background:rgba(56,161,105,0.06)' : '';
      const badge = isCur ? '<span style="background:#5b2d8e;color:#fff;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:600">ปัจจุบัน</span>'
        : isRec ? '<span style="background:#38a169;color:#fff;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:600">แนะนำ</span>' : '';
      const utilColor = s.utilization > 70 ? '#38a169' : s.utilization > 55 ? '#d69e2e' : '#e53e3e';

      const layLabel = s.layingType === 'overlap'
        ? '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:#7c3aed;color:#fff">OL</span>'
        : '<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:var(--bg-secondary);color:var(--text-muted)">ST</span>';
      const tdI = 'style="text-align:center;padding:5px 4px"';
      h += `<tr style="${rowStyle}">
        <td ${tdI}>${badge}</td>
        <td ${tdI}>${s.sheetName} ${s.rotated ? '↻' : ''}</td>
        <td ${tdI} style="text-align:center;font-weight:600">${s.nw}×${s.nl}=${s.ups}</td>
        <td ${tdI}>${layLabel}</td>
        <td ${tdI} style="text-align:center;color:${utilColor};font-weight:600">${s.utilization.toFixed(1)}%</td>
        <td ${tdI}>${s.wastePct.toFixed(1)}%</td>
        <td ${tdI}>${num(s.paperNet)}</td>
        ${s.costPerPiece > 0 ? `<td ${tdI}>${s.costPerPiece.toFixed(2)} ฿/ชิ้น</td>` : ''}
      </tr>`;
    });

    h += `</tbody></table>`;
    h += `<div style="font-size:9px;color:var(--text-muted);margin-top:4px;text-align:right"><i class="fas fa-database"></i> ข้อมูลกระดาษจาก machine_std_paper_info (Estimate API) | Waste จาก waste_info | สูตรตามระบบเก่า</div>`;
    h += `</div>`;
  });

  return h;
}

/**
 * Apply layout recommendation — switch to recommended paper and recalculate
 */
function applyLayoutRecommendation(ri, sheetName) {
  if (!State.layoutResults?.[ri]) return;
  const lay = State.layoutResults[ri];
  const match = lay.all?.find(p => p.sheetName === sheetName && !p.rotated) || lay.all?.find(p => p.sheetName === sheetName);
  if (!match) { toast('ไม่พบกระดาษที่แนะนำ', 'error'); return; }

  // ป้องกันกดซ้ำ — ถ้าปัจจุบันเป็นตัวที่กดอยู่แล้ว ให้แจ้งเฉย ๆ
  if (lay.best?.sheetName === sheetName && lay.best?.ups === match.ups && lay.best?.rotated === match.rotated) {
    toast(`ใช้กระดาษ ${sheetName} อยู่แล้ว`, 'info');
    return;
  }

  // Apply: คำนวณ layout dimensions ใหม่สำหรับ match ที่เลือก
  const usedPT = lay._autoPrintType || State.form?.print_type || 'Offset';
  const tol = CalcEngine.CALC.tolerance[usedPT.toLowerCase()] || CalcEngine.CALC.tolerance.offset;
  const openW = lay.unfolded.openW, openL = lay.unfolded.openL;
  const printW = match.nw * openW, printL = match.nl * openL;
  const shortComp = tol.gripper + tol.color_bar, longComp = tol.paper_edge * 2;
  if (printW <= printL) { match.layoutW_mm = printW + shortComp; match.layoutL_mm = printL + longComp; }
  else { match.layoutW_mm = printW + longComp; match.layoutL_mm = printL + shortComp; }
  match.printW_mm = printW; match.printL_mm = printL;
  lay.best = match;

  // เก็บ choice ไว้บน component เผื่อ user คำนวณใหม่ จะได้ไม่ revert
  if (State.form?.components?.[ri]) {
    State.form.components[ri]._chosenSheetName = sheetName;
  }

  toast(`เปลี่ยนกระดาษเป็น ${sheetName} เรียบร้อย`, 'success');
  // ⚠️ สำคัญ: ใช้ rerenderLayoutFromState ไม่ใช่ calculateLayout
  // เพราะ calculateLayout จะ recalculate ใหม่ทั้งหมด → overwrite lay.best ที่เพิ่งตั้ง
  // → recommendation card จะโผล่กลับมา (bug)
  rerenderLayoutFromState();
}

/**
 * Build comprehensive form summary — checks ALL actual form data
 */
function buildFormSummary(flow) {
  const f = State.form;
  if (!f) return '';

  const received = [], skippedItems = [], missing = [];

  // Helper
  const has = v => v && v !== '' && v !== '0' && v !== 0;
  const check = (label, value, detail) => {
    if (has(value)) received.push(detail ? `${label}: ${detail}` : label);
    else missing.push(label);
  };

  // === Job Info ===
  check('ชื่องาน (Job Name)', f.job_name, f.job_name);
  check('ลูกค้า (Customer)', f.customer?.customer_name, f.customer?.customer_name);
  check('AE Name', f.ae?.emp_name, f.ae?.emp_name);
  // Qty — multi-F: show total + per-F breakdown
  if (f.has_multi_f && f.f_data?.length > 0 && f.f_data.some(fd => parseInt(fd.qty) > 0)) {
    const fTotal = f.f_data.reduce((s, fd) => s + (parseInt(fd.qty) || 0), 0);
    check('จำนวนสั่ง (Qty)', fTotal > 0, fTotal.toLocaleString() + ' ชิ้น');
  } else {
    check('จำนวนสั่ง (Qty)', f.qty?.filter(q=>q&&parseInt(q)>0).length, f.qty?.filter(q=>q).map(q=>parseInt(q).toLocaleString()).join(', ') + ' ชิ้น');
  }
  check('ประเภทพิมพ์', f.print_type, f.print_type);

  // === Components ===
  (f.components || []).forEach((c, ci) => {
    const cn = c.component_name || `Component ${ci+1}`;
    const prefix = f.components.length > 1 ? `${cn}: ` : '';

    check(`${prefix}ชื่อ Component`, c.component_name, c.component_name);

    // Component Type + Corrugated details (grouped together)
    const compTypeLabel = c.component_type === 2 ? 'ประกบลูกฟูก' : c.component_type === 3 ? 'ลูกฟูก' : 'ไม่ประกบลูกฟูก';
    received.push(`${prefix}ประเภท: ${compTypeLabel}`);

    if (c.component_type === 2 || c.component_type === 3) {
      const corr = c.corrugated || {};
      check(`${prefix}ลูกฟูก (Flute)`, corr.flute_type, `ลอน ${corr.flute_type}`);
      check(`${prefix}ลูกฟูก (จำนวนชั้น)`, corr.layer && corr.layer > 0, `${corr.layer} ชั้น`);
      const grades = (corr.grade || []).filter(g => g && g !== '' && g !== '-');
      const grams = (corr.gram || []).filter(g => g && g > 0);
      const gradeDetail = grades.length > 0 ? grades.join('/') + (grams.length > 0 ? ' ' + grams[0] : '') : null;
      check(`${prefix}ลูกฟูก (Grade)`, grades.length > 0, gradeDetail);
    }

    check(`${prefix}Template กล่อง`, c.box_type?.type_id, c.box_type?.type_name || `Type ${c.box_type?.type_id}`);

    // Size
    const sz = c.packaging_size || {};
    const hasSize = has(sz.width) && has(sz.length);
    check(`${prefix}ขนาด (W×L×D)`, hasSize, hasSize ? `${sz.width}×${sz.length}×${sz.depth||0} mm` : null);

    // Paper (แสดงแค่ประเภท+แกรม ไม่แสดงราคา)
    check(`${prefix}กระดาษ`, c.paper?.paper_code, `${c.paper?.paper_code || ''} ${c.paper?.paper_gram || ''}gsm`);

    // Color — multi-F: show per-F color breakdown
    const isMultiFSummary = f.has_multi_f && c._color_per_f?.length > 1;
    if (isMultiFSummary) {
      check(`${prefix}จำนวนสี`, c.color?.outside, `${c.color?.outside||0}/${c.color?.inside||0} สี`);
      received.push('**PRINT**');
      c._color_per_f.forEach((cf, fi) => {
        const fCode = cf.f_code || f.f_data?.[fi]?.f_code || ('F' + (fi + 1));
        const fQty = f.f_data?.[fi]?.qty || '';
        const colLabel = `${cf.outside||0}/${cf.inside||0} Colors`;
        received.push(`  - ${fCode} : ${colLabel}`);
      });
    } else {
      check(`${prefix}จำนวนสี`, c.color?.outside, `${c.color?.outside||0}/${c.color?.inside||0} สี`);
    }

    // Coating
    const coatings = (c.addon || []).filter(a => a.type === 'coating');
    if (coatings.length > 0) {
      if (isMultiFSummary) received.push('**OTHER**');
      received.push(`${prefix}Coating: ${coatings.map(a => {
        const opt = a.info?.coating_option ? a.info.coating_option + ' ' : '';
        const typ = a.info?.type || a.info?.coating_type || 'มี';
        const side = a.info?.side ? ' ' + a.info.side + ' s' : '';
        return opt + typ + side;
      }).join(', ')}`);
    }

    // Foil stamp — show F-codes that apply
    const foilList = (c.addon || []).filter(a => a.type === 'foilstamp');
    if (foilList.length > 0) {
      foilList.forEach(fl => {
        const fCodes = fl.f_codes || fl.info?.f_code || [];
        const fTag = isMultiFSummary && fCodes.length > 0 ? `[${fCodes.join(', ')}]: ` : '';
        const color = fl.info?.foil_color || '';
        const code = fl.info?.foil_code ? `(${fl.info.foil_code})` : '';
        const sizes = (fl.info?.sizes || []).map(s => `${s.w}"x${s.l}"`).join(', ');
        received.push(`${prefix}${fTag}Foil Stamp: ${color}${code}${sizes ? ' ' + sizes : ''}`.trim());
      });
    }
    // Emboss — show F-codes
    const embList = (c.addon || []).filter(a => a.type === 'emboss');
    embList.forEach(embAd => {
      const fCodes = embAd.f_codes || embAd.info?.f_code || [];
      const fTag = isMultiFSummary && fCodes.length > 0 ? `[${fCodes.join(', ')}]: ` : '';
      const embSizes = (embAd.info?.sizes || []).map(s => `${s.w}"x${s.l}"`).join(', ');
      received.push(`${prefix}${fTag}Emboss: ${embSizes || 'มี'}`);
    });
    // Deboss — show F-codes
    const debList = (c.addon || []).filter(a => a.type === 'deboss');
    debList.forEach(debAd => {
      const fCodes = debAd.f_codes || debAd.info?.f_code || [];
      const fTag = isMultiFSummary && fCodes.length > 0 ? `[${fCodes.join(', ')}]: ` : '';
      const debSizes = (debAd.info?.sizes || []).map(s => `${s.w}"x${s.l}"`).join(', ');
      received.push(`${prefix}${fTag}Deboss: ${debSizes || 'มี'}`);
    });

    // Packing
    const packs = c.packing?.length ? c.packing.map(p => p.name).join(', ') :
      ['kraftwrap','paperband','carton','pallet'].filter(t => c['_pk_'+t]).join(', ');
    if (packs) received.push(`${prefix}Packing: ${packs}`);
  });

  // === Process / Other Process (ขึ้นรูป, ค่าติดกาว, ไดคัท, etc.) ===
  // รวมจากทุก component + form-level
  const allProcs = [];
  if (Array.isArray(f.other_process)) {
    f.other_process.forEach(p => {
      const name = typeof p === 'string' ? p : (p?.name || '');
      if (name) allProcs.push(name);
    });
  }
  (f.components || []).forEach(c => {
    if (Array.isArray(c.other_process)) {
      c.other_process.forEach(p => {
        const name = typeof p === 'string' ? p : (p?.name || '');
        if (name && !allProcs.includes(name)) allProcs.push(name);
      });
    }
  });
  if (f.is_diecut && !allProcs.some(p => /ไดคัท|die\s*cut/i.test(p))) {
    allProcs.push('ปั๊มไดคัท');
  }
  if (allProcs.length > 0) {
    received.push(`Process: ${allProcs.join(', ')}`);
  }

  // Delivery — only show if valid province (not SIZE/spec text)
  const dlPlace = f.delivery?.[0]?.destinationName || f.delivery?.[0]?.province || '';
  if (dlPlace && dlPlace.length <= 30 && !/SIZE|TITLE|PAPER|COMPONENT|\d+\s*x\s*\d+/i.test(dlPlace)) {
    const dlDate = f.delivery[0].delivery_date || '';
    received.push(`จัดส่ง: ${dlPlace}${dlDate ? ' | วันที่ส่ง: ' + dlDate : ''}`);
  }

  // Skipped items from Fill Flow
  if (flow?.queue) {
    flow.queue.forEach(q => {
      if (q._skipped) skippedItems.push(q.label);
    });
  }

  // Build summary message
  let msg = '📋 **สรุปข้อมูลทั้งหมด:**\n';

  if (received.length > 0) {
    msg += received.map(r => `✅ ${r}`).join('\n') + '\n';
  }

  if (skippedItems.length > 0) {
    msg += '\n⏭️ **ข้าม:**\n' + skippedItems.map(s => `⏭️ ${s}`).join('\n') + '\n';
  }

  if (missing.length > 0) {
    msg += '\n❌ **ยังขาด:**\n' + missing.map(m => `❌ ${m}`).join('\n') + '\n';
  }

  if (missing.length === 0) {
    msg += '\n✅ **ข้อมูลครบแล้ว!** กด "คำนวณ Layout" ได้เลยครับ';
  } else {
    msg += `\n⚠️ ยังขาด ${missing.length} รายการ กรุณากรอกเพิ่มเติมครับ`;
  }

  return msg;
}

function buildMachineRecommendations(results, printType) {
  if (!State.form?.components?.length) return '';
  const recs = [];

  State.form.components.forEach((c, ci) => {
    const cn = c.component_name || `Component ${ci+1}`;
    const lay = c._layout;
    if (!lay?.best) return;

    const openW = lay.unfolded?.openW || 0;
    const openL = lay.unfolded?.openL || 0;
    const maxDim = Math.max(openW, openL);
    const minDim = Math.min(openW, openL);
    const tid = parseInt(c.box_type?.type_id) || 0;
    const hasCoating = (c.addon || []).some(a => a.type === 'coating');
    const hasDiecut = tid >= 1 && tid <= 11;
    const hasGluing = (c.other_process || []).some(p => (p.name || '').includes('ติดกาว') || (p.name || '').includes('glue'));
    const sheetW = lay.best.sw || lay.best.sheetW || 0;
    const sheetL = lay.best.sl || lay.best.sheetL || 0;

    const items = [];

    // Diecut machine recommendation
    if (hasDiecut) {
      if (maxDim <= 750) {
        items.push({ icon: 'fas fa-cut', name: 'Diecut', rec: 'Bobst / SHIHENG (Auto)', detail: `ขนาดคลี่ ${maxDim.toFixed(0)}mm ≤ 750mm`, color: '#38a169' });
      } else if (maxDim <= 1050) {
        items.push({ icon: 'fas fa-cut', name: 'Diecut', rec: 'Sanwa / Yoco / Asahi', detail: `ขนาดคลี่ ${maxDim.toFixed(0)}mm ≤ 1050mm`, color: '#d69e2e' });
      } else {
        items.push({ icon: 'fas fa-cut', name: 'Diecut', rec: 'Flexo Die / Manual', detail: `ขนาดคลี่ ${maxDim.toFixed(0)}mm > 1050mm`, color: '#e53e3e' });
      }
    }

    // Coating machine recommendation
    if (hasCoating) {
      const coatingType = (c.addon || []).find(a => a.type === 'coating')?.info?.coating_type || '';
      if (coatingType.includes('UV')) {
        items.push({ icon: 'fas fa-spray-can', name: 'Coating', rec: 'UV TYMI / Steinemann', detail: `UV Coating (3500 sph)`, color: '#7c3aed' });
      } else if (coatingType.includes('OPP')) {
        items.push({ icon: 'fas fa-spray-can', name: 'Coating', rec: 'OPP Laminator', detail: `OPP ${coatingType.includes('Matt') ? 'Matt' : 'Gloss'} (22m/min)`, color: '#7c3aed' });
      } else {
        items.push({ icon: 'fas fa-spray-can', name: 'Coating', rec: 'Waterbase Coater', detail: `Waterbase (2000 sph)`, color: '#7c3aed' });
      }
    }

    // Gluing machine recommendation
    if (hasGluing || [1,2,3,4,8,11].includes(tid)) {
      if ([3,4].includes(tid)) {
        items.push({ icon: 'fas fa-tape', name: 'Gluing', rec: 'ติดกาวออโต้ (Auto Bottom Lock)', detail: `Template ${tid}: Auto Lock`, color: '#2b6cb0' });
      } else {
        items.push({ icon: 'fas fa-tape', name: 'Gluing', rec: 'ติดกาว (Folder Gluer)', detail: `Heidelberg / Bobst`, color: '#2b6cb0' });
      }
    }

    // Inspection & Packing
    items.push({ icon: 'fas fa-search', name: 'QC', rec: 'ตรวจ + แกะ + นับ', detail: `แกะ + Inspection`, color: '#718096' });

    if (items.length > 0) {
      recs.push({ name: cn, items });
    }
  });

  if (recs.length === 0) return '';

  let h = `<div class="detail-card"><h6><i class="fas fa-robot"></i> AI แนะนำเครื่องจักรหลังพิมพ์</h6>`;
  recs.forEach(r => {
    h += `<div style="margin-bottom:8px"><b style="font-size:13px">${escapeHtml(r.name)}</b></div>`;
    h += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">`;
    r.items.forEach(item => {
      h += `<div style="flex:1;min-width:140px;background:var(--bg-tertiary);border-radius:8px;padding:8px 12px;border-left:3px solid ${item.color}">
        <div style="font-size:11px;color:var(--text-muted)"><i class="${item.icon}" style="color:${item.color}"></i> ${item.name}</div>
        <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${item.rec}</div>
        <div style="font-size:10px;color:var(--text-muted)">${item.detail}</div>
      </div>`;
    });
    h += `</div>`;
  });
  h += `<div style="font-size:10px;color:var(--text-muted);text-align:right"><i class="fas fa-info-circle"></i> คำแนะนำอัตโนมัติจากขนาดคลี่และ Template — กรุณาตรวจสอบกับ Production</div></div>`;
  return h;
}

function renderLayoutResults(results, printType) {

  // Render
  let h = `<div class="detail-header" style="display:flex;justify-content:space-between;align-items:center">
    <div><h4><i class="fas fa-th-large"></i> Layout Calculation</h4><div style="color:var(--text-muted);font-size:13px">ผลคำนวณ Layout จาก CalcEngine (12 Box Templates)</div></div>
    <button class="btn btn-secondary" onclick="App.backToForm()"><i class="fas fa-arrow-left"></i> กลับไปฟอร์ม</button>
  </div>`;

  results.forEach((r, ri) => {
    const comp = State.form?.components?.[ri];
    const compTypeName = comp?.component_type === 2 ? 'ประกบลูกฟูก' : comp?.component_type === 3 ? 'ลูกฟูก' : 'ไม่ประกบลูกฟูก';
    const compDisplayName = comp?.component_name || r.name || `Component ${ri+1}`;
    h += `<div class="detail-card"><h6 style="display:flex;justify-content:space-between;align-items:center"><span><i class="fas fa-box-open"></i> ${escapeHtml(r.name)}</span>${!r.error ? `<button class="btn btn-secondary" onclick="App.exportLayoutPNG(${ri})" style="font-size:10px;padding:3px 8px"><i class="fas fa-image"></i> PNG</button>` : ''}</h6>`;
    h += `<div style="display:flex;gap:12px;align-items:center;margin-bottom:8px;padding:6px 10px;background:var(--bg-secondary);border-radius:6px;font-size:12px">
      <span style="font-weight:600">Component ที่ ${ri+1}</span>
      <span style="background:var(--bg-primary);padding:2px 10px;border-radius:4px;border:1px solid var(--border)">${escapeHtml(compDisplayName)}</span>
      <span style="color:var(--text-muted)">${compTypeName}</span>
    </div>`;
    // Box viewer 3D/Dieline/JPG (ย้ายมาจากฟอร์ม → แสดงที่หน้าผลลัพธ์)
    if (comp?.box_type?.type_id) {
      h += `<div style="margin-bottom:12px;display:flex;justify-content:center">${buildBoxDiagram(ri, comp)}</div>`;
    }
    if (r.error) {
      h += `<p style="color:#f08080"><i class="fas fa-exclamation-triangle"></i> ${r.error}</p>`;
      if (r.unfolded) {
        h += `<p style="color:var(--text-muted);font-size:12px">ขนาดคลี่: ${r.unfolded.openW.toFixed(1)} x ${r.unfolded.openL.toFixed(1)} mm</p>`;
        h += `<p style="color:var(--text-muted);font-size:12px">กระดาษที่ใหญ่สุด (Offset): 740 x 1040 mm | (Flexo): 1448 x 2398 mm</p>`;
        if (r.unfolded.openW > 1448 || r.unfolded.openL > 2398) {
          h += `<p style="color:#e67e22;font-size:12px"><i class="fas fa-info-circle"></i> ขนาดคลี่ใหญ่เกินกระดาษทุกประเภท กรุณาตรวจสอบขนาดกล่อง (กว้าง/ยาว/สูง)</p>`;
        } else {
          h += `<p style="color:#e67e22;font-size:12px"><i class="fas fa-info-circle"></i> ลองเปลี่ยนประเภทพิมพ์เป็น Flexo หรือตรวจสอบขนาดกล่อง</p>`;
        }
      }
    } else {
      const lay = r.layout;
      const best = lay.best;
      if (lay._autoPrintType) {
        h += `<div style="background:rgba(255,193,7,0.1);border:1px solid #ffc107;border-radius:8px;padding:8px 12px;margin-bottom:8px;font-size:12px;color:#856404"><i class="fas fa-info-circle"></i> ขนาดเกิน ${printType} → ใช้ <b>${lay._autoPrintType}</b> แทนอัตโนมัติ</div>`;
      }
      const mm2in = v => v ? mm2inchLegacy(v) : '0';
      const usedPT = lay._autoPrintType || printType;
      const tol = CalcEngine.CALC.tolerance[(usedPT).toLowerCase()] || CalcEngine.CALC.tolerance.offset;

      // Machine info
      const machineInfo = lay.machine || (best.machine ? CalcEngine.getMachine(best.machine) : null);
      const machMinW = machineInfo?.w_min_in?.toFixed(2) || mm2in(machineInfo?.w_min_mm || 0);
      const machMinL = machineInfo?.l_min_in?.toFixed(2) || mm2in(machineInfo?.l_min_mm || 0);
      const machMaxW = machineInfo?.w_max_in?.toFixed(2) || mm2in(machineInfo?.w_max_mm || 0);
      const machMaxL = machineInfo?.l_max_in?.toFixed(2) || mm2in(machineInfo?.l_max_mm || 0);

      // Open Size WITHOUT bleed
      const rawOW = lay.unfolded.rawW;
      const rawOL = lay.unfolded.rawL;

      // Layout Size from CalcEngine
      const layoutW_in = mm2in(best.layoutW_mm);
      const layoutL_in = mm2in(best.layoutL_mm);

      // Paper size
      // Display roll/actual size (matching legacy shows 31x43 not 28x40)
      const paperW = best.rollW_in || best.paperW_in || Math.round(best.sheetW / 25.4);
      const paperL = best.rollL_in || best.paperL_in || Math.round(best.sheetL / 25.4);

      // Grain text
      const grainText = best.rotated ? 'แนวตั้ง' : 'แนวนอน';

      // Check: Paper size < Layout size → warning (matching legacy red text)
      const paperSizeOverflow = (best.layoutW_mm > best.sw + 1) || (best.layoutL_mm > best.sl + 1);
      const overflowWarning = paperSizeOverflow
        ? `<div style="color:#e53e3e;font-weight:700;font-size:12px;margin-top:6px;text-align:center">**Paper size น้อยกว่า Lay size<br>กรุณาแก้ Paper size**</div>`
        : '';

      // Build Std Paper dropdown options (deduplicate by sheetName)
      const allPapers = lay.all || [];
      const seenPapers = new Set();
      let stdPaperOptions = '';
      allPapers.forEach(p => {
        const key = p.sheetName;
        if (seenPapers.has(key)) return;
        seenPapers.add(key);
        const sel = (key === best.sheetName) ? 'selected' : '';
        const upsInfo = `${p.nw}x${p.nl}=${p.ups}`;
        stdPaperOptions += `<option value="${key}" ${sel}>${key}</option>`;
      });

      // Build Machine dropdown
      const machinesForPT = CalcEngine.getMachinesForPrintType(usedPT);
      let machineOptions = '';
      machinesForPT.forEach(m => {
        const sel = (m.id === (machineInfo?.id || best.machine)) ? 'selected' : '';
        machineOptions += `<option value="${m.id}" ${sel}>${m.name}</option>`;
      });

      // ===== FORMULA DISPLAY (#89) =====
      const comp = State.form?.components?.[ri];
      const formulaHtml = buildOpenSizeFormula(comp, lay);

      // ===== LAYOUT SUMMARY (#91) =====
      const summaryHtml = buildLayoutSummary(r, lay, printType);

      // ===== LAYOUT UI MATCHING LEGACY =====
      const tdLabel = 'style="font-weight:600;white-space:nowrap;padding-right:8px;font-size:13px"';
      const tdVal = 'style="font-size:13px"';
      const inputSm = 'style="width:50px;padding:2px 4px;border:1px solid var(--border);border-radius:3px;font-size:12px;text-align:center;background:var(--bg-secondary);color:var(--text-primary)"';
      const selectSm = 'style="padding:2px 4px;border:1px solid var(--border);border-radius:3px;font-size:12px;background:var(--bg-secondary);color:var(--text-primary);max-width:100%"';

      const isManual = lay._isManual || false;
      h += `<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start">
        <!-- Left: Info + Controls (like legacy) -->
        <div style="flex-shrink:0">
          <table style="border-collapse:separate;border-spacing:4px 5px">
            <tr><td ${tdLabel}>Open Size :</td><td ${tdVal}>${mm2in(rawOW)}" x ${mm2in(rawOL)}" <span style="color:var(--text-muted);font-size:11px">(${rawOW.toFixed(1)} x ${rawOL.toFixed(1)} mm)</span></td></tr>
            ${formulaHtml ? `<tr><td colspan="2">${formulaHtml}</td></tr>` : ''}
            ${isManual ? '' : `<tr><td ${tdLabel}>Layout Size :</td><td ${tdVal}>${layoutW_in}" x ${layoutL_in}"</td></tr>`}
            ${isManual ? (() => {
              const bt = comp?.box_type || {};
              const mLayW = bt.manual_layout_w_in || '';
              const mLayL = bt.manual_layout_l_in || '';
              const mPapW = bt.manual_paper_w_in || '';
              const mPapL = bt.manual_paper_l_in || '';
              const compType = parseInt(comp?.component_type) || 1;
              const isCorrugated = compType === 2 || compType === 3;
              return `
            <tr><td ${tdLabel}>Layout Size :</td><td>
              <input id="layLayoutW_${ri}" type="text" value="${mLayW}" ${inputSm} style="width:60px" placeholder="" oninput="App._updateManualRealtime(${ri})">
              <span style="margin:0 2px">x</span>
              <input id="layLayoutL_${ri}" type="text" value="${mLayL}" ${inputSm} style="width:60px" placeholder="" oninput="App._updateManualRealtime(${ri})">
              <span style="font-size:11px;color:var(--text-muted);margin-left:2px">"</span>
            </td></tr>
            <tr><td ${tdLabel}>เทรนชิ้นงาน :</td><td><select id="layGrain_${ri}" ${selectSm} onchange="App._updateManualRealtime(${ri})"><option value="">-เลือกด้านขนาน-</option><option value="WSize" id="layGrainW_${ri}" style="display:none"></option><option value="LSize" id="layGrainL_${ri}" style="display:none"></option></select></td></tr>
            <tr><td ${tdLabel}>Paper Size :</td><td>
              <input id="layPaperW_${ri}" type="text" value="${mPapW}" ${inputSm} style="width:60px" placeholder="" oninput="App._updateManualRealtime(${ri})">
              <span style="margin:0 2px">x</span>
              <input id="layPaperL_${ri}" type="text" value="${mPapL}" ${inputSm} style="width:60px" placeholder="" oninput="App._updateManualRealtime(${ri})">
              <span style="font-size:11px;color:var(--text-muted);margin-left:2px">"</span>
              <span id="manualOverflow_${ri}" style="color:#e53e3e;font-size:11px;margin-left:4px"></span>
            </td></tr>
            ${isCorrugated ? `<tr><td ${tdLabel}>ลอนลูกฟูก :</td><td><select id="layFluteSide_${ri}" ${selectSm} onchange="App._updateManualRealtime(${ri})"><option value="">-เลือกด้านขนาน-</option><option value="WSize" id="layFluteW_${ri}" style="display:none"></option><option value="LSize" id="layFluteL_${ri}" style="display:none"></option></select></td></tr>` : ''}
            `;
            })() : `
            <tr><td ${tdLabel}>Paper Size :</td><td>
              <input id="layPaperW_${ri}" type="number" step="1" value="${Math.round(paperW)}" ${inputSm} style="width:50px" onkeydown="if(event.key==='Enter')App.onCustomPaperChange(${ri})">
              <span style="margin:0 2px">x</span>
              <input id="layPaperL_${ri}" type="number" step="1" value="${Math.round(paperL)}" ${inputSm} style="width:50px" onkeydown="if(event.key==='Enter')App.onCustomPaperChange(${ri})">
              <span id="layPaperLabel_${ri}" style="margin-left:4px;font-size:11px;color:var(--text-muted)">(${best.sheetName || ''})</span>
            </td></tr>
            <tr><td ${tdLabel}>Std. Paper :</td><td><select id="layStdPaper_${ri}" ${selectSm} onchange="App.onStdPaperChange(${ri})">${stdPaperOptions}<option value="__custom__">-- กำหนดขนาดเอง --</option></select></td></tr>
            <tr><td ${tdLabel}>Layout Grain :</td><td><select id="layGrain_${ri}" ${selectSm} onchange="App.onLayoutRecalc(${ri})"><option value="normal" ${!best.rotated ? 'selected' : ''}>ถูก grain</option><option value="rotated" ${best.rotated ? 'selected' : ''}>ผิด grain</option></select></td></tr>
            `}
            <tr><td ${tdLabel}>Machine Size :</td><td><select id="layMachine_${ri}" ${selectSm} onchange="App.onMachineChange(${ri})">${machineOptions}</select></td></tr>
            <tr><td ${tdLabel}>Min Size :</td><td ${tdVal}>${machMinW}" x ${machMinL}"</td></tr>
            <tr><td ${tdLabel}>Max Size :</td><td ${tdVal}>${machMaxW}" x ${machMaxL}"</td></tr>
          </table>
          <div style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center">
            ${!isManual ? `<button class="btn btn-secondary" style="font-size:11px;padding:4px 12px" onclick="App.onLayoutRecalc(${ri})"><i class="fas fa-sync-alt"></i> คำนวณ Layout ใหม่</button>` : ''}
            <label style="font-size:12px;cursor:pointer;font-weight:600;color:${isManual ? '#e53e3e' : 'var(--text-secondary)'}"><input type="checkbox" ${isManual ? 'checked' : ''} onchange="App.toggleManualLayout(${ri},this.checked)"> Manual Layout</label>
          </div>
        </div>
        ${isManual ? `
        <!-- Manual Layout: legacy-style diagram (white box + arrow + labels) -->
        <div style="flex:1;min-width:200px;text-align:center">
          <canvas id="layoutCanvas_${ri}" width="300" height="230" style="max-width:100%;border-radius:4px;background:#fff"></canvas>
          <div id="manualGrainInfo_${ri}" style="font-size:12px;margin-top:4px;color:var(--text-secondary)"></div>
          <div id="manualWarning_${ri}" style="font-size:12px;margin-top:2px;color:#e67e22;font-weight:600"></div>
        </div>
        <div style="flex-shrink:0">
          <table style="font-size:13px;border-collapse:separate;border-spacing:6px 6px">
            <tr><td style="font-weight:600;text-align:right">จำนวนด้านกว้าง</td><td><input id="layManNW_${ri}" type="number" min="1" value="${best.nw}" ${inputSm} style="width:50px;font-size:15px;font-weight:700" oninput="App._updateManualRealtime(${ri})"></td></tr>
            <tr><td style="font-weight:600;text-align:right">จำนวนด้านยาว</td><td><input id="layManNL_${ri}" type="number" min="1" value="${best.nl}" ${inputSm} style="width:50px;font-size:15px;font-weight:700" oninput="App._updateManualRealtime(${ri})"></td></tr>
          </table>
          <div id="manualUps_${ri}" style="text-align:center;margin-top:8px"><b style="color:var(--accent);font-size:16px">${best.nw} x ${best.nl} = ${best.ups} ดวง</b></div>
        </div>` : `
        <!-- Center: Layout diagram (#93 front/back) -->
        <div style="flex:1;min-width:240px;text-align:center">
          ${(() => {
            const colorsIn = parseInt(comp?.color?.inside) || 0;
            const colorsOut = parseInt(comp?.color?.outside) || 0;
            if (colorsIn > 0 && colorsOut > 0) {
              return `<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
                <div>
                  <div style="font-size:11px;font-weight:600;color:var(--accent);margin-bottom:2px"><i class="fas fa-eye"></i> ด้านนอก (${colorsOut} สี)</div>
                  <canvas id="layoutCanvas_${ri}" width="1" height="1" style="max-width:100%;border-radius:4px;background:#fff"></canvas>
                </div>
                <div>
                  <div style="font-size:11px;font-weight:600;color:#e67e22;margin-bottom:2px"><i class="fas fa-eye-slash"></i> ด้านใน (${colorsIn} สี)</div>
                  <canvas id="layoutCanvasBack_${ri}" width="1" height="1" style="max-width:100%;border-radius:4px;background:#fff"></canvas>
                </div>
              </div>`;
            } else {
              return `<canvas id="layoutCanvas_${ri}" width="1" height="1" style="max-width:100%;border-radius:4px;background:#fff"></canvas>`;
            }
          })()}
          ${overflowWarning}
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">วางชิ้นงาน : แนวตั้ง / เทรนชิ้นงาน : ${grainText}</div>
        </div>`}
        <!-- Right: Layout edit + Tolerance (like legacy) -->
        <div style="flex-shrink:0">
          <div style="margin-bottom:10px">
            <label style="font-size:12px;cursor:pointer;display:block;margin-bottom:4px"><input type="checkbox" id="layEditNWNL_${ri}" onchange="var c=this.checked;document.getElementById('layNW_${ri}').readOnly=!c;document.getElementById('layNL_${ri}').readOnly=!c;document.getElementById('layNW_${ri}').style.background=c?'var(--bg-primary)':'var(--bg-secondary)';document.getElementById('layNL_${ri}').style.background=c?'var(--bg-primary)':'var(--bg-secondary)'"> แก้ไขจำนวน Lay เอง</label>
            <table style="font-size:13px;border-collapse:separate;border-spacing:4px 4px">
              <tr><td style="font-weight:600;padding-right:8px">จำนวนด้านกว้าง</td><td><input id="layNW_${ri}" type="number" value="${best.nw}" min="1" ${inputSm} readonly onchange="App.onManualLayoutChange(${ri})" style="background:var(--bg-secondary)"></td></tr>
              <tr><td style="font-weight:600;padding-right:8px">จำนวนด้านยาว</td><td><input id="layNL_${ri}" type="number" value="${best.nl}" min="1" ${inputSm} readonly onchange="App.onManualLayoutChange(${ri})" style="background:var(--bg-secondary)"></td></tr>
            </table>
            <div style="text-align:center;margin-top:6px">
              <button class="btn btn-secondary" style="font-size:11px;padding:4px 10px" onclick="App.onSwapLayout(${ri})"><i class="fas fa-exchange-alt"></i> สลับด้าน layout</button>
            </div>
            <div style="text-align:center;margin-top:4px"><b style="color:var(--accent);font-size:15px">${best.nw} x ${best.nl} = ${best.ups} ดวง</b></div>
          </div>
          <hr style="border-color:var(--border);margin:8px 0">
          <div>
            <label style="font-size:12px;cursor:pointer"><input type="checkbox" id="layCustomTol_${ri}" onchange="App.onCustomTolToggle(${ri})"> ระบุระยะเผื่อเอง</label>
            <table style="font-size:12px;border-collapse:separate;border-spacing:4px 3px;margin-top:4px">
              <tr><td>ความยาว gripper</td><td><input id="layGripper_${ri}" type="number" value="${tol.gripper}" ${inputSm} readonly></td><td>mm</td></tr>
              <tr><td>ความยาว color bar</td><td><input id="layColorBar_${ri}" type="number" value="${tol.color_bar}" ${inputSm} readonly></td><td>mm</td></tr>
              <tr><td>ระยะขอบกระดาษ</td><td><input id="layPaperEdge_${ri}" type="number" value="${tol.paper_edge}" ${inputSm} readonly></td><td>mm</td></tr>
              <tr><td>ระยะเผื่อเฉียน</td><td><input id="layBleed_${ri}" type="number" value="${CalcEngine.CALC.bleed}" ${inputSm} readonly></td><td>mm</td></tr>
            </table>
          </div>
        </div>
      </div>`;

      // Paper usage table
      if (r.paperResults && r.paperResults.length > 0) {
        const thC = 'style="text-align:center;padding:6px 4px;font-size:11px;line-height:1.3"';
        h += `<table class="detail-table" style="margin-top:12px;font-size:12px"><thead><tr>
          <th ${thC}>COMPONENT<br><span style="font-weight:400;font-size:10px;color:var(--text-muted)">(ชิ้นส่วน)</span></th>
          <th ${thC}>QTY<br><span style="font-weight:400;font-size:10px;color:var(--text-muted)">(จำนวน)</span></th>
          <th ${thC}>UPS<br><span style="font-weight:400;font-size:10px;color:var(--text-muted)">(ดวง)</span></th>
          <th ${thC}>AFTER UPS<br><span style="font-weight:400;font-size:10px;color:var(--text-muted)">(หลังหาร)</span></th>
          <th ${thC}>WASTE<br><span style="font-weight:400;font-size:10px;color:var(--text-muted)">(เสีย)</span></th>
          <th ${thC}>AFTER WASTE<br><span style="font-weight:400;font-size:10px;color:var(--text-muted)">(หลังบวกเสีย)</span></th>
          <th ${thC}>SIG<br><span style="font-weight:400;font-size:10px;color:var(--text-muted)">(รอบ)</span></th>
          <th ${thC}>PAPER PRINT<br><span style="font-weight:400;font-size:10px;color:var(--text-muted)">(พิมพ์)</span></th>
          <th ${thC}>SPLIT<br><span style="font-weight:400;font-size:10px;color:var(--text-muted)">(แบ่ง)</span></th>
          <th ${thC}>PAPER QTY<br><span style="font-weight:400;font-size:10px;color:var(--text-muted)">(จำนวนกระดาษ)</span></th>
          <th ${thC}>PAPER NET<br><span style="font-weight:400;font-size:10px;color:var(--text-muted)">(สุทธิ)</span></th>
          <th ${thC}>TONS<br><span style="font-weight:400;font-size:10px;color:var(--text-muted)">(ตัน)</span></th>
        </tr></thead><tbody id="paperTbody_${ri}">`;
        const tdC = 'style="text-align:center;padding:5px 4px"';
        r.paperResults.forEach(pr => {
          if (!pr) return;
          const sig = 1;
          const split = pr.split || 1;
          const paperPrint = pr.paperPrint || pr.afterWaste;
          const paperQty = pr.paperQty || paperPrint;
          h += `<tr>
            <td ${tdC}>${escapeHtml(r.name)}</td>
            <td ${tdC}>${num(pr.qty)}</td>
            <td ${tdC}>${best.ups}</td>
            <td ${tdC}>${num(pr.afterUps)}</td>
            <td ${tdC}>${num(pr.waste.total)}</td>
            <td ${tdC} style="text-align:center;color:var(--accent);font-weight:600">${num(pr.afterWaste)}</td>
            <td ${tdC}>${sig}</td>
            <td ${tdC}>${num(paperPrint)}</td>
            <td ${tdC} style="text-align:center;color:${split > 1 ? '#e67e22' : 'var(--accent)'};font-weight:600">${split}</td>
            <td ${tdC} style="text-align:center;color:var(--accent);font-weight:600">${num(paperQty)}</td>
            <td ${tdC}><b>${num(pr.paperNet)}</b></td>
            <td ${tdC}>${pr.weight_ton.toFixed(3)}</td>
          </tr>`;
        });
        h += '</tbody></table>';
      }

      // Layout Summary (#91)
      if (summaryHtml) {
        h += summaryHtml;
      }
    }
    h += '</div>';
  });

  // Layout Comparison — compare alternatives + recommend
  const layoutIntel = buildLayoutIntelligence(results, printType);
  if (layoutIntel) h += layoutIntel;

  // #95: AI Recommend afterpress machines — ซ่อนไว้ก่อน (Phase 2 feature)
  // const machineRecommendations = buildMachineRecommendations(results, printType);
  // if (machineRecommendations) h += machineRecommendations;

  // #94: One-click verify button
  h += `<div class="detail-card" style="display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;padding:16px">
    <button class="btn btn-primary" style="font-size:14px;padding:10px 28px;border-radius:8px" onclick="App.verifyFormComplete()"><i class="fas fa-check-circle"></i> ตรวจสอบข้อมูลครบถ้วน</button>
    <button class="btn btn-secondary" style="font-size:14px;padding:10px 28px;border-radius:8px" onclick="App.calculatePrice()"><i class="fas fa-calculator"></i> คำนวณราคา</button>
  </div>`;

  h += `<div class="detail-card" style="background:var(--bg-tertiary);padding:12px;text-align:center;font-size:12px;color:var(--text-muted)">
    <i class="fas fa-calculator"></i> คำนวณโดย CalcEngine v1.0 | Print Type: ${printType} | Bleed: ${CalcEngine.CALC.bleed}mm
  </div>`;

  $('detailContent').innerHTML = h;
  showView('viewDetail');
  setTopBar('Layout Calculation', 'ผลคำนวณ Layout');

  // Draw ALL layout diagrams — wait for full DOM render then draw all at once
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      results.forEach((r, ri) => {
        if (r.error || !r.layout?.best) return;
        // Manual mode → draw canvas (empty box or grid based on stored values)
        // Manual mode → draw empty/filled canvas based on stored values
        const isMan = r.layout._isManual || State.form?.components?.[ri]?.box_type?.is_manual_layout;
        if (isMan) {
          const mbt = State.form?.components?.[ri]?.box_type || {};
          _drawManualCanvas(ri,
            parseFloat(mbt.manual_layout_w_in) || 0,
            parseFloat(mbt.manual_layout_l_in) || 0,
            parseFloat(mbt.manual_paper_w_in) || 0,
            parseFloat(mbt.manual_paper_l_in) || 0,
            parseInt(mbt.manual_nw) || 1,
            parseInt(mbt.manual_nl) || 1, '', ''
          );
          return;
        }
        try { drawLayoutDiagram(`layoutCanvas_${ri}`, r.layout, printType, null, ri); } catch(e) { console.log('Draw error front', ri, e); }
        // #93: Draw back layout if exists (4/4 printing)
        const backCanvas = document.getElementById(`layoutCanvasBack_${ri}`);
        if (backCanvas) {
          try { drawLayoutDiagram(`layoutCanvasBack_${ri}`, r.layout, printType, '#fef3e0', ri); } catch(e) { console.log('Draw error back', ri, e); }
        }
      });
    });
  });
}

/**
 * Draw layout diagram on canvas (clean style matching legacy system)
 */
// Legacy mm2inch: rounds UP unless the 3rd decimal digit is exactly 0
function mm2inchLegacy(x, d = 2) {
  const num = Math.pow(10, d);
  const raw = x / 25.4 * (num * 10);
  const intStr = Math.floor(Math.abs(raw)).toString();
  const lastDigit = intStr[intStr.length - 1];
  if (lastDigit === '0') {
    return (Math.round(x / 25.4 * num) / num).toFixed(d);
  } else {
    return (Math.ceil(x / 25.4 * num) / num).toFixed(d);
  }
}

function drawLayoutDiagram(canvasId, layout, printType, bgColor, compIndex) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const b = layout.best;
  const u = layout.unfolded;
  if (!b || !u) return;

  // Paper dimensions (full sheet = outer rectangle)
  const paperW_mm = b.sw || 711;
  const paperL_mm = b.sl || 1016;
  // Layout dimensions (can exceed paper when swapped — shows overflow warning)
  const layoutW_mm = b.layoutW_mm || paperW_mm;
  const layoutL_mm = b.layoutL_mm || paperL_mm;
  // NW/NL: W = horizontal (columns), L = vertical (rows) — matching legacy
  const nCols = b.nw, nRows = b.nl;
  if (!nCols || !nRows) return;

  // Labels: "layoutSize (paperSize)" — use cut size (paperW_in) like legacy shows (40) not (43)
  const cutW = b.paperW_in || Math.round(paperW_mm / 25.4);
  const cutL = b.paperL_in || Math.round(paperL_mm / 25.4);
  const topLabel = `${mm2inchLegacy(layoutL_mm)} (${cutL})`;  // L direction = top
  const leftLabel = `${mm2inchLegacy(layoutW_mm)}`;
  const leftPaper = `(${cutW})`;

  // Scale: fit paper into canvas area
  const hasCorrBoard = b.corrugatedBoard && b.corrugatedBoard.tolerance;
  const padTop = hasCorrBoard ? 52 : 40, padLeft = hasCorrBoard ? 90 : 55, padRight = 15, padBottom = 50;
  const maxW = 380, maxH = 340;
  // Legacy: L direction = horizontal (top), W direction = vertical (left)
  const scale = Math.min(maxW / paperL_mm, maxH / paperW_mm, 0.45);
  const sheetDrawW = paperL_mm * scale;  // horizontal = L direction
  const sheetDrawH = paperW_mm * scale;  // vertical = W direction

  canvas.width = sheetDrawW + padLeft + padRight;
  canvas.height = sheetDrawH + padTop + padBottom;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor || '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const ox = padLeft, oy = padTop;

  // === Draw cells FULL paper (matching legacy — stretches to fill) ===
  const cellW = sheetDrawW / nRows;   // nRows along L (horizontal)
  const cellH = sheetDrawH / nCols;   // nCols along W (vertical)
  for (let row = 0; row < nRows; row++) {
    for (let col = 0; col < nCols; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? '#d4ecd4' : '#e8e0f0';
      ctx.fillRect(ox + row * cellW, oy + col * cellH, cellW, cellH);
    }
  }

  // Grid lines
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 0.5;
  for (let i = 1; i < nRows; i++) {
    const x = ox + i * cellW;
    ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy + sheetDrawH); ctx.stroke();
  }
  for (let i = 1; i < nCols; i++) {
    const y = oy + i * cellH;
    ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + sheetDrawW, y); ctx.stroke();
  }

  // Paper outline (bold border)
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(ox, oy, sheetDrawW, sheetDrawH);

  // === Grain arrow (►) top-left on border — matching legacy position ===
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.moveTo(ox + 24, oy);           // tip right
  ctx.lineTo(ox + 8, oy - 7);        // top-left
  ctx.lineTo(ox + 8, oy + 7);        // bottom-left
  ctx.closePath();
  ctx.fill();

  // === Grain hatch — quarter circle at bottom-right, direction follows flute_side ===
  const comp = compIndex != null ? State.form?.components?.[compIndex] : null;
  const fluteSide = comp?.corrugated?.flute_side || '';
  // fluteSide='short' → hatch lines horizontal (↕ ลอนตั้ง), 'long' → hatch lines vertical (↔ ลอนนอน)
  const hatchR = Math.min(sheetDrawW * 0.12, sheetDrawH * 0.15, 35);
  const hCx = ox + sheetDrawW;
  const hCy = oy + sheetDrawH;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(hCx, hCy);
  ctx.arc(hCx, hCy, hatchR, Math.PI, Math.PI * 1.5, false);
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  if (fluteSide === 'short') {
    // ลอนขนานด้านสั้น → hatch lines horizontal (ลอนวิ่งแนวตั้ง)
    for (let d = -hatchR; d < hatchR; d += 3.5) {
      ctx.beginPath();
      ctx.moveTo(hCx - hatchR, hCy + d);
      ctx.lineTo(hCx, hCy + d);
      ctx.stroke();
    }
  } else if (fluteSide === 'long') {
    // ลอนขนานด้านยาว → hatch lines vertical (ลอนวิ่งแนวนอน)
    for (let d = -hatchR; d < hatchR; d += 3.5) {
      ctx.beginPath();
      ctx.moveTo(hCx + d, hCy - hatchR);
      ctx.lineTo(hCx + d, hCy);
      ctx.stroke();
    }
  } else {
    // Default: Grain ขนานด้าน Gripper (ด้านสั้นกระดาษ = W direction)
    // Offset sheet-fed: grain runs parallel to gripper edge = vertical lines
    for (let d = -hatchR; d < hatchR; d += 3.5) {
      ctx.beginPath();
      ctx.moveTo(hCx + d, hCy - hatchR);
      ctx.lineTo(hCx + d, hCy);
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(hCx, hCy, hatchR, Math.PI, Math.PI * 1.5, false);
  ctx.lineTo(hCx, hCy);
  ctx.closePath();
  ctx.stroke();
  // Label grain/flute direction next to hatch
  {
    ctx.fillStyle = '#666';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    const fLabel = fluteSide === 'short' ? '↕ สั้น' : fluteSide === 'long' ? '↔ ยาว' : 'grain';
    ctx.fillText(fLabel, hCx - hatchR - 3, hCy - 2);
  }

  // === NW×NL watermark in center ===
  ctx.fillStyle = 'rgba(100, 90, 140, 0.12)';
  ctx.font = `bold ${Math.min(sheetDrawH * 0.35, 50)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${nCols}×${nRows}`, ox + sheetDrawW / 2, oy + sheetDrawH / 2);

  // === Dimension labels — Top: "30.79 (40)" ===
  ctx.fillStyle = '#333';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(topLabel, ox + sheetDrawW / 2, oy - 10);

  // === Left: "16.15\n(28)" — vertical center, not rotated ===
  ctx.fillStyle = '#333';
  ctx.textAlign = 'right';
  const leftMidY = oy + sheetDrawH / 2;
  ctx.textBaseline = 'bottom';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(leftLabel, ox - 6, leftMidY - 1);
  ctx.textBaseline = 'top';
  ctx.font = '10px sans-serif';
  ctx.fillText(leftPaper, ox - 6, leftMidY + 1);

  // === Corrugated Board dimensions (layout - 0.375" per side) ===
  const corrBoard = b.corrugatedBoard;
  if (corrBoard && corrBoard.tolerance) {
    // Top: corrugated L dimension (orange, below layout label)
    ctx.fillStyle = '#e67e22';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`Board: ${corrBoard.lIn}"`, ox + sheetDrawW / 2, oy - 0);

    // Left: corrugated W dimension (orange, below paper size)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`Board: ${corrBoard.wIn}"`, ox - 6, leftMidY + 14);

    // Small -0.375 annotation
    ctx.font = '8px sans-serif';
    ctx.fillStyle = '#b45309';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`(-${corrBoard.tolerance}")`, ox + sheetDrawW / 2 + 50, oy - 0);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`(-${corrBoard.tolerance}")`, ox - 6, leftMidY + 26);
  }

  // === Bottom info bar ===
  const utilizePct = paperW_mm > 0 && paperL_mm > 0 ? (u.openW * u.openL * b.ups) / (paperW_mm * paperL_mm) * 100 : 0;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  const infoY = oy + sheetDrawH + 10;
  ctx.fillStyle = '#555';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`${b.ups} UPS  (${nCols}W × ${nRows}L)`, ox + sheetDrawW / 2 - 55, infoY);
  ctx.fillStyle = utilizePct >= 70 ? '#27ae60' : utilizePct >= 50 ? '#e67e22' : '#e74c3c';
  ctx.fillText(`Util: ${utilizePct.toFixed(1)}%`, ox + sheetDrawW / 2 + 65, infoY);

}

// ============================================================
// PRICE CALCULATION (BASIC)
// ============================================================
function calculatePrice(skipOverlay) {
  if (!State.form) { toast('กรุณาเปิดฟอร์ม RFQ ก่อน', 'error'); return; }
  if (typeof CalcEngine === 'undefined') { toast('กำลังโหลด Calculation Engine...', 'info'); return; }
  const f = State.form;
  if (!f.components.length) { toast('ไม่มี Component', 'error'); return; }

  // Multi-F: ใช้ qty จาก f_data แทน form.qty
  const isMultiF = !!(f.has_multi_f && f.f_data?.length > 0 && f.f_data.some(fd => parseInt(fd.qty) > 0));
  if (isMultiF) {
    const fQtys = f.f_data.filter(fd => parseInt(fd.qty) > 0);
    if (!fQtys.length) { toast('กรุณาระบุจำนวนในแต่ละ F ก่อน', 'error'); return; }
  } else {
    const qtys = f.qty.filter(q => q).map(q => parseInt(q));
    if (!qtys.length) { toast('กรุณาระบุจำนวนก่อน', 'error'); return; }
  }

  // Validate ข้อมูลขั้นต่ำ
  const pMissing = [];
  f.components.forEach((c, ci) => {
    const cn = c.component_name || `Component ${ci+1}`;
    const sz = c.packaging_size || {};
    if (!parseFloat(sz.width) && !parseFloat(sz.length)) pMissing.push(`${cn}: ขนาด กว้าง × ยาว`);
    if (!c.paper?.paper_code && !c.paper?.is_custom) pMissing.push(`${cn}: ประเภทกระดาษ`);
    if (!c.paper?.paper_cost) pMissing.push(`${cn}: ราคากระดาษ`);
  });
  if (pMissing.length > 0) {
    toast(`กรุณากรอกข้อมูลก่อนคำนวณราคา:\n• ${pMissing.join('\n• ')}`, 'error');
    return;
  }

  if (skipOverlay) {
    try { _doCalculatePrice(); } catch (e) { console.error('[CalcPrice]', e); toast('เกิดข้อผิดพลาดในการคำนวณ: ' + e.message, 'error'); }
  } else {
    showCalcOverlay('กำลังคำนวณราคา...', 'price');
    setTimeout(() => {
      try { _doCalculatePrice(); } catch (e) { console.error('[CalcPrice]', e); toast('เกิดข้อผิดพลาดในการคำนวณ: ' + e.message, 'error'); }
      hideCalcOverlay();
    }, 2500);
  }
}

// ============================================================
// MULTI-F PRICE RENDERING (แสดงผลแยกตาม F-code)
// ============================================================
function _doRenderMultiFPrice(estimate) {
  const f = State.form;
  const fMeta = estimate.fMeta || [];
  const totalQty = fMeta.reduce(function(s, fm) { return s + (fm.qty || 0); }, 0);
  const isUV = (f.ink_type || '').toUpperCase() === 'UV';
  const printType = f.print_type || 'Offset';

  const R = function(v) { return '<td class="td-right">' + v + '</td>'; };
  const RB = function(v) { return '<td class="td-right td-bold">' + v + '</td>'; };
  const totalRow = function(label, val) { return '<tr class="row-total"><td colspan="7">' + label + '</td>' + RB(money(val)) + '</tr>'; };
  _formulaIdx = 0;
  _formulaData = {};
  const I = function(title, lines) {
    var id = '_fi' + (++_formulaIdx);
    _formulaData[id] = { title: title, lines: lines };
    return '<span class="formula-icon" onclick="App.showFormula(\'' + id + '\')" title="ดูสูตรคำนวณ"><i class="fas fa-info-circle"></i></span>';
  };

  // F-code badge
  var fBadge = function(fCode) { return '<span style="display:inline-block;background:var(--accent);color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;margin-right:4px">' + escapeHtml(fCode) + '</span>'; };

  var h = '<div class="detail-header" style="display:flex;justify-content:space-between;align-items:center">'
    + '<div><h4><i class="fas fa-calculator"></i> Price Estimation — Multi-F</h4>'
    + '<div style="color:var(--text-muted);font-size:13px">คำนวณแยกตาม F-code (' + fMeta.length + ' F, รวม ' + num(totalQty) + ' ชิ้น)</div></div>'
    + '<button class="btn btn-secondary" onclick="App.backToForm()"><i class="fas fa-arrow-left"></i> กลับไปฟอร์ม</button></div>';

  // F-code summary bar
  h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 12px">';
  fMeta.forEach(function(fm) {
    h += '<div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:8px;padding:6px 12px;font-size:12px">'
      + fBadge(fm.f_code) + '<b>' + num(fm.qty) + '</b> ชิ้น</div>';
  });
  h += '</div>';

  // === PER COMPONENT ===
  (estimate.components || []).forEach(function(cr, ci) {
    if (cr.error) {
      h += '<div class="detail-card"><p style="color:#f08080">' + escapeHtml(cr.error) + '</p></div>';
      return;
    }
    var comp = f.components[ci] || {};
    var compName = cr.name || ('Component ' + (ci + 1));
    var shared = cr.shared || {};
    var ap = shared.afterPress || {};
    var pk = shared.packingCost || {};
    var mpu = shared.mergedPaperUsage || {};
    var best = comp._layout?.best || {};

    h += '<div class="detail-card" style="padding:0;overflow:hidden">';
    h += '<table class="price-table">';
    h += '<colgroup><col style="width:12%"><col style="width:13%"><col style="width:10%"><col style="width:10%"><col style="width:10%"><col style="width:13%"><col style="width:12%"><col style="width:20%"></colgroup>';
    h += '<thead><tr>';
    h += '<th colspan="5" rowspan="2" style="text-align:center;vertical-align:middle">Description</th>';
    h += '<th style="text-align:center">Volume</th>';
    h += '<th style="text-align:right">' + num(totalQty) + '</th>';
    h += '<th style="text-align:right">' + num(totalQty) + '</th>';
    h += '</tr>';
    h += '<tr><th class="td-right">Unit Price</th><th class="td-right">Qty</th><th class="td-right">Price</th></tr>';
    h += '</thead><tbody>';

    // === MATERIAL: Paper per F ===
    var totalPaperCost = 0;
    var rollWin = best.rollW_in || best.paperW_in || ((best.sw||0) / 25.4);
    var rollLin = best.rollL_in || best.paperL_in || ((best.sl||0) / 25.4);
    (cr.fResults || []).forEach(function(fr) {
      if (fr.error) return;
      var pc = fr.paperCost || {};
      var pu = fr.paperUsage || {};
      totalPaperCost += pc.total || 0;
      h += '<tr><td>Paper ' + fBadge(fr.f_code) + ' ' + I('Paper Cost — ' + fr.f_code, [
        '<b>สูตร:</b> unitPrice = rollW" × rollL" × totalPrice × gsm / 1,550,000',
        '<b>Roll Size:</b> ' + rollWin.toFixed(2) + '" × ' + rollLin.toFixed(2) + '"',
        '<b>GSM:</b> ' + (pc.paperGram || '-'),
        '<b>Markup:</b> ' + (pc.markup || 10) + '%',
        '<b>unitPrice/แผ่น:</b> ' + money(pc.unitPrice || 0),
        '<b>จำนวนแผ่น:</b> ' + num(pc.paperNet || pu.paperNet || 0),
        '<b>Waste:</b> ' + num(pu.waste?.total || 0) + ' แผ่น',
        '<b>Total:</b> ' + num(pc.paperNet || pu.paperNet || 0) + ' × ' + money(pc.unitPrice || 0) + ' = <b>' + money(pc.total || 0) + '</b>',
      ]) + '</td><td>' + escapeHtml(compName) + '</td>'
        + '<td>' + escapeHtml(pc.paperCode || '') + '</td><td colspan="2">' + (pc.paperGram || '') + ' gsm</td>'
        + R(money(pc.unitPrice || 0)) + R(num(pc.paperNet || pu.paperNet || 0)) + R(money(pc.total || 0)) + '</tr>';
    });

    // Corrugated (shared)
    if (shared.corrugated?.board > 0) {
      var crd = shared.corrugated;
      h += '<tr><td>Corrugated Board</td><td>' + escapeHtml(compName) + '</td><td colspan="3"></td>'
        + R(money(crd.boardUnitPrice || 0)) + R(num(crd.boardQty || 0)) + R(money(crd.board || 0)) + '</tr>';
    }

    // Special Ink per F
    var totalSpecialInk = 0;
    (cr.fResults || []).forEach(function(fr) {
      if (fr.error) return;
      var si = fr.specialInk || {};
      if (si.total > 0) {
        totalSpecialInk += si.total;
        h += '<tr><td>Special Ink ' + fBadge(fr.f_code) + '</td><td>' + escapeHtml(compName) + '</td><td colspan="3"></td>'
          + R('-') + R('-') + R(money(si.total)) + '</tr>';
      }
    });

    h += totalRow('Total (Material)', cr.materialTotal);

    // === PLATE per F ===
    var totalPlateCost = 0;
    (cr.fResults || []).forEach(function(fr) {
      if (fr.error) return;
      var pl = fr.plateCost || {};
      if (!pl.total) return;
      totalPlateCost += pl.total;
      var machName = pl.machineName || 'Cut 2';
      h += '<tr><td rowspan="2">Plate ' + fBadge(fr.f_code) + ' ' + I('Plate Cost — ' + fr.f_code, [
        '<b>สูตร:</b> colors × pricePerColor × plateSets',
        '<b>Outside:</b> ' + (pl.colorsOut||0) + ' สี × 800 × ' + (pl.plateSets||1) + ' = <b>' + money(pl.outside||0) + '</b>',
        '<b>Inside:</b> ' + (pl.colorsIn||0) + ' สี × 800 × ' + (pl.plateSets||1) + ' = <b>' + money(pl.inside||0) + '</b>',
        '<b>Machine:</b> ' + machName,
        '<b>Total:</b> <b>' + money(pl.total||0) + '</b>',
      ]) + '</td>'
        + '<td>' + escapeHtml(compName) + ' Outside</td><td>' + (pl.colorsOut || 0) + ' cols</td><td colspan="2">' + machName + '</td>'
        + R(money(pl.outside || 0)) + R(pl.plateSets || 1) + R(money(pl.outside || 0)) + '</tr>';
      h += '<tr><td>' + escapeHtml(compName) + ' Inside</td><td>' + (pl.colorsIn || 0) + ' cols</td><td colspan="2">' + machName + '</td>'
        + R(money(pl.inside || 0)) + R(pl.plateSets || 1) + R(money(pl.inside || 0)) + '</tr>';
    });
    h += totalRow('Total (Plate)', totalPlateCost);

    // === PROOF per F ===
    var totalProofCost = 0;
    (cr.fResults || []).forEach(function(fr) {
      if (fr.error) return;
      var pf = fr.proofCost || {};
      totalProofCost += pf.total || 0;
    });
    h += '<tr class="row-total"><td colspan="7">Total (Proof)</td>' + RB(money(totalProofCost)) + '</tr>';

    // === PRINT per F ===
    var totalPrintCost = 0;
    var inkLabel = isUV ? ' UV' : '';
    (cr.fResults || []).forEach(function(fr) {
      if (fr.error) return;
      var pr = fr.printCost || {};
      if (!pr.total) return;
      totalPrintCost += pr.total;
      var machName = pr.machineName || 'Cut 2';
      h += '<tr><td rowspan="2">Print ' + fBadge(fr.f_code) + ' ' + I('Print Cost — ' + fr.f_code, [
        '<b>สูตร:</b> rate × afterUps × totalColors × inkFactor',
        '<b>afterUps:</b> ' + num(fr.paperUsage?.afterUps || 0) + ' แผ่น',
        '<b>Colors:</b> ' + (pr.colorsOut||0) + '/' + (pr.colorsIn||0),
        '<b>Ink:</b> ' + (isUV ? 'UV ×2.5' : 'Conventional'),
        '<b>Machine:</b> ' + machName,
        '<b>Outside:</b> <b>' + money(pr.outside||0) + '</b>',
        '<b>Inside:</b> <b>' + money(pr.inside||0) + '</b>',
        '<b>Total:</b> <b>' + money(pr.total||0) + '</b>',
      ]) + '</td>'
        + '<td>' + escapeHtml(compName) + ' Outside</td><td>' + (pr.colorsOut || 0) + ' cols' + inkLabel + '</td><td colspan="2">' + machName + '</td>'
        + R(money(pr.outside || 0)) + R(1) + R(money(pr.outside || 0)) + '</tr>';
      h += '<tr><td>' + escapeHtml(compName) + ' Inside</td><td>' + (pr.colorsIn || 0) + ' cols' + inkLabel + '</td><td colspan="2">' + machName + '</td>'
        + R(money(pr.inside || 0)) + R(1) + R(money(pr.inside || 0)) + '</tr>';
    });
    h += totalRow('Total (Print)', totalPrintCost);

    // === PROCESS (shared — คิดรวม) ===
    if (ap.coating > 0) {
      var cd = ap.coatingDetails || [];
      if (cd.length > 0) {
        cd.forEach(function(c) {
          var descParts = [c.option, c.type, c.side + ' s'].filter(Boolean);
          h += '<tr><td>Coating ' + I('Coating — ' + descParts.join(' '), [
            '<b>สูตร:</b> layoutW" × layoutL" × rate × sides',
            '<b>Rate:</b> ' + c.rate + ' B/sqinch',
            '<b>Side:</b> ' + c.side + ' ด้าน',
            '<b>Unit Price:</b> ' + c.unitPrice.toFixed(4) + ' B/แผ่น',
            '<b>Qty:</b> ' + num(c.qty) + ' แผ่น',
            '<b>Total:</b> <b>' + money(c.cost) + '</b>',
          ]) + '</td><td>' + escapeHtml(compName) + '</td><td>' + escapeHtml(descParts.join(' ')) + '</td><td></td><td></td>'
            + R(c.unitPrice.toFixed(4)) + R(num(c.qty)) + R(money(c.cost)) + '</tr>';
        });
      } else {
        h += '<tr><td>Coating</td><td>' + escapeHtml(compName) + '</td><td colspan="3"></td>' + R('-') + R('-') + R(money(ap.coating)) + '</tr>';
      }
    }
    if (shared.corrugated?.gluing > 0) {
      h += '<tr><td colspan="3">ทากาวประกบลูกฟูก</td><td colspan="2">' + escapeHtml(compName) + '</td>'
        + R(money(shared.corrugated.gluingUnitPrice || 0)) + R(num(shared.corrugated.boardQty || 0)) + R(money(shared.corrugated.gluing || 0)) + '</tr>';
    }
    if (ap.block > 0) {
      var isReprintJob = f.is_reprinted || false;
      h += '<tr><td colspan="3">Block Diecut ' + I('Block Diecut', [
        '<b>ประเภทงาน:</b> ' + (isReprintJob ? 'Reprint (ใช้บล็อคเดิม 500 ฿)' : 'งานใหม่ (Lookup จาก blockdiecut_info ตามขนาด Layout)'),
        '<b>ขนาด Layout:</b> ' + ((comp._layout?.best?.layoutW_mm||0)/25.4).toFixed(2) + '" × ' + ((comp._layout?.best?.layoutL_mm||0)/25.4).toFixed(2) + '"',
        '<b>Total:</b> <b>' + money(ap.block) + '</b>',
      ]) + '</td><td colspan="2">' + escapeHtml(compName) + '</td>' + R(money(ap.block)) + R(1) + R(money(ap.block)) + '</tr>';
    }
    if (ap.diecut > 0) {
      var dcRate = totalQty > 0 ? (ap.diecut / totalQty) : 0;
      h += '<tr><td colspan="3">Diecut ' + I('Diecut Cost', [
        '<b>สูตร:</b> max(minPrice, afterUps × tier.diecut)',
        '<b>Rate/ชิ้น:</b> ' + dcRate.toFixed(5) + ' THB',
        '<b>Qty:</b> ' + num(totalQty),
        '<b>Total:</b> <b>' + money(ap.diecut) + '</b>',
      ]) + '</td><td colspan="2">' + escapeHtml(compName) + '</td>' + R(dcRate.toFixed(5)) + R(num(totalQty)) + R(money(ap.diecut)) + '</tr>';
    }
    // Foil/Emboss Per-F (เฉพาะ F ที่ระบุ — ตรงกับระบบเก่า)
    (cr.fResults || []).forEach(function(fr) {
      if (fr.error) return;
      if (fr.foilCost > 0) {
        h += '<tr><td colspan="2">Foil Stamp ' + fBadge(fr.f_code) + ' ' + I('Foil Stamp — ' + fr.f_code, [
          '<b>สูตร:</b> max(minPrice, afterUps × tier.foilstamp)',
          '<b>afterUps:</b> ' + num(fr.paperUsage?.afterUps||0),
          '<b>เฉพาะ F:</b> ' + fr.f_code + ' (' + num(fr.qty) + ' ชิ้น)',
          '<b>Total:</b> <b>' + money(fr.foilCost) + '</b>',
        ]) + '</td><td colspan="3">' + escapeHtml(compName) + '</td>' + R('-') + R(num(fr.qty)) + R(money(fr.foilCost)) + '</tr>';
      }
      if (fr.embossCost > 0) {
        h += '<tr><td colspan="2">Emboss/Deboss ' + fBadge(fr.f_code) + ' ' + I('Emboss/Deboss — ' + fr.f_code, [
          '<b>สูตร:</b> max(minPrice, afterUps × tier.bossing)',
          '<b>afterUps:</b> ' + num(fr.paperUsage?.afterUps||0),
          '<b>เฉพาะ F:</b> ' + fr.f_code + ' (' + num(fr.qty) + ' ชิ้น)',
          '<b>Total:</b> <b>' + money(fr.embossCost) + '</b>',
        ]) + '</td><td colspan="3">' + escapeHtml(compName) + '</td>' + R('-') + R(num(fr.qty)) + R(money(fr.embossCost)) + '</tr>';
      }
    });
    if (ap.chip > 0) {
      var chipRate = totalQty > 0 ? (ap.chip / totalQty) : 0;
      h += '<tr><td colspan="5">แกะ ' + I('แกะ (Chip)', [
        '<b>สูตร:</b> qty × tier.chip',
        '<b>Qty:</b> ' + num(totalQty) + ' ชิ้น',
        '<b>Rate/ชิ้น:</b> ' + chipRate.toFixed(5),
        '<b>Total:</b> <b>' + money(ap.chip) + '</b>',
      ]) + '</td>' + R(chipRate.toFixed(2)) + R(num(totalQty)) + R(money(ap.chip)) + '</tr>';
    }
    if (ap.trim > 0) h += '<tr><td colspan="5">ตัดเจียน ' + I('ตัดเจียน (Trim)', ['<b>สูตร:</b> max(minPrice, afterUps × tier.trim)', '<b>Total:</b> <b>' + money(ap.trim) + '</b>']) + '</td>' + R('-') + R('-') + R(money(ap.trim)) + '</tr>';
    if (ap.inspection > 0) {
      var inspRate = totalQty > 0 ? (ap.inspection / totalQty) : 0;
      h += '<tr><td colspan="5">Inspection ' + I('Inspection (ตรวจงาน)', [
        '<b>สูตร:</b> qty × tier.inspection',
        '<b>Qty:</b> ' + num(totalQty) + ' ชิ้น',
        '<b>Rate/ชิ้น:</b> ' + inspRate.toFixed(5),
        '<b>Total:</b> <b>' + money(ap.inspection) + '</b>',
      ]) + '</td>' + R(inspRate.toFixed(2)) + R(num(totalQty)) + R(money(ap.inspection)) + '</tr>';
    }
    if (ap.assembly > 0) h += '<tr><td colspan="5">Assembly (Gluing) ' + I('Assembly (ติดกาว)', ['<b>สูตร:</b> max(minPrice, afterUps × tier.assembly)', '<b>Total:</b> <b>' + money(ap.assembly) + '</b>']) + '</td>' + R('-') + R('-') + R(money(ap.assembly)) + '</tr>';
    // Process total = afterPress.total - blanket (blanket อยู่ใน Material) + perF foil/emboss + corrugated gluing
    h += totalRow('Total (Process)', (ap.total || 0) - (ap.blanket || 0) + (shared.perFFoilTotal || 0) + (shared.perFEmbossTotal || 0) + (shared.corrugated?.gluing || 0));

    // === OTHER (form-level) ===
    var fpi = estimate.totals?.[0]?.formProcessItems || [];
    if (fpi.length > 0) {
      fpi.forEach(function(fp) {
        var secLabel = { other_process: 'Other Process', handwork_process: 'Handwork', outsource: 'จัดจ้าง', materials: 'Material', other_items: 'Other' }[fp.section] || fp.section;
        h += '<tr><td>' + escapeHtml(secLabel) + '</td><td colspan="4">' + escapeHtml(fp.name) + '</td>' + R(money(fp.cost)) + R(num(fp.qty || totalQty)) + R(money(fp.total)) + '</tr>';
      });
    }
    h += totalRow('Total (Other)', estimate.totals?.[0]?.formProcessTotal || 0);

    // === PACKING ===
    if (pk.kraftwrap > 0) h += '<tr><td colspan="2">Kraftwrap</td><td>' + escapeHtml(compName) + '</td><td colspan="2"></td>' + R(money(5)) + R(num(pk.kraftwrapPacks || 0)) + R(money(pk.kraftwrap)) + '</tr>';
    if (pk.paperband > 0) h += '<tr><td colspan="2">Paperband</td><td>' + escapeHtml(compName) + '</td><td colspan="2"></td>' + R('-') + R('-') + R(money(pk.paperband)) + '</tr>';
    if (pk.carton > 0) h += '<tr><td colspan="2">Carton</td><td>' + escapeHtml(compName) + '</td><td colspan="2"></td>' + R('-') + R('-') + R(money(pk.carton)) + '</tr>';
    if (pk.pallet > 0) h += '<tr><td colspan="2">Pallet</td><td>' + escapeHtml(compName) + '</td><td colspan="2"></td>' + R('-') + R('-') + R(money(pk.pallet)) + '</tr>';

    var dl = estimate.delivery?.[0];
    var dlName = f.delivery?.[0]?.destinationName || 'ไม่ระบุสถานที่จัดส่ง';
    h += '<tr><td colspan="3">Delivery</td><td colspan="2" style="text-align:center">' + escapeHtml(dlName) + '</td>' + R(money(dl?.deliveryCosts?.[0]?.total || 0)) + R('1.00') + R(money(dl?.deliveryTotal || 0)) + '</tr>';
    h += totalRow('Total (Packing)', (pk.total || 0) + (dl?.deliveryTotal || 0));

    h += '</tbody></table></div>';
  });

  // === SUMMARY SECTION ===
  var t = estimate.totals?.[0];
  if (t) {
    var matBase = t.materialTotal;
    var prodBase = t.productionTotal;
    var packBase = (t.packingTotal || 0) + (t.deliveryTotal || 0);
    var otherBase = (t.otherCostTotal || 0) + (t.processInfoTotal || 0) + (t.formProcessTotal || 0);
    var matMarkup = State.form._markup_material || 0;
    var prodMarkup = State.form._markup_production || 0;
    var matMarkupAmt = matBase * matMarkup / 100;
    var prodMarkupAmt = prodBase * prodMarkup / 100;
    var matAfter = matBase + matMarkupAmt;
    var prodAfter = prodBase + prodMarkupAmt;
    var subtotalAfterMarkup = matAfter + prodAfter + packBase + otherBase;
    var giftAmt = t.giftTotal || 0;
    var diffAmt = t.priceDiffTotal || 0;
    var subWithAdj = subtotalAfterMarkup + giftAmt + diffAmt;
    var taxAmt = subWithAdj * CalcEngine.CALC.tax_percent / 100;
    var totalPrice = subWithAdj + taxAmt;
    var unitPriceCps = totalQty > 0 ? totalPrice / totalQty : 0;

    h += '<div class="detail-card" style="margin-top:16px;padding:16px 20px">';
    h += '<table class="detail-table price-table" style="width:100%;font-size:12px">';
    h += '<thead><tr><th colspan="5"></th><th class="td-right">Unit Price</th><th class="td-right">Qty</th><th class="td-right">Price</th></tr></thead><tbody>';

    h += '<tr class="row-section"><td colspan="3" class="td-center">Mark Up/Down</td><td colspan="2" class="td-center">Materials</td>'
      + '<td class="td-center" style="white-space:nowrap"><input type="range" id="markupMatSlider" min="-100" max="100" step="1" value="' + matMarkup + '" style="width:80px;vertical-align:middle;cursor:pointer;accent-color:var(--accent)" oninput="document.getElementById(\'markupMat\').value=this.value;App.onMarkupChange()">'
      + '<input type="number" id="markupMat" value="' + matMarkup + '" step="1" style="width:42px;text-align:center;border:1px solid var(--border-color);border-radius:4px;padding:2px;font-size:12px;background:var(--bg-secondary);color:var(--text-primary);margin-left:2px" onchange="document.getElementById(\'markupMatSlider\').value=this.value;App.onMarkupChange()">%</td>'
      + '<td></td><td class="td-right" id="markupMatAmt">' + money(matMarkupAmt) + '</td></tr>';
    h += '<tr class="row-total"><td colspan="5" class="td-center">Subtotal Price (Materials)</td><td colspan="2" class="td-right">@' + (totalQty > 0 ? (matAfter / totalQty).toFixed(2) : '0') + '</td><td class="td-right td-bold" id="matAfterVal">' + money(matAfter) + '</td></tr>';

    h += '<tr class="row-section"><td colspan="3" class="td-center">Mark Up/Down</td><td colspan="2" class="td-center">Production</td>'
      + '<td class="td-center" style="white-space:nowrap"><input type="range" id="markupProdSlider" min="-100" max="100" step="1" value="' + prodMarkup + '" style="width:80px;vertical-align:middle;cursor:pointer;accent-color:var(--accent)" oninput="document.getElementById(\'markupProd\').value=this.value;App.onMarkupChange()">'
      + '<input type="number" id="markupProd" value="' + prodMarkup + '" step="1" style="width:42px;text-align:center;border:1px solid var(--border-color);border-radius:4px;padding:2px;font-size:12px;background:var(--bg-secondary);color:var(--text-primary);margin-left:2px" onchange="document.getElementById(\'markupProdSlider\').value=this.value;App.onMarkupChange()">%</td>'
      + '<td></td><td class="td-right" id="markupProdAmt">' + money(prodMarkupAmt) + '</td></tr>';
    h += '<tr class="row-total"><td colspan="5" class="td-center">Subtotal Price (Production)</td><td colspan="2" class="td-right">@' + (totalQty > 0 ? (prodAfter / totalQty).toFixed(2) : '0') + '</td><td class="td-right td-bold" id="prodAfterVal">' + money(prodAfter) + '</td></tr>';

    h += '<tr class="row-total"><td colspan="5" class="td-center td-bold">Subtotal Price</td><td colspan="2"></td><td class="td-right td-bold" id="subtotalVal">' + money(subtotalAfterMarkup) + '</td></tr>';
    h += '<tr><td colspan="5" class="td-center">ค่าของขวัญลูกค้า</td><td colspan="2"></td>' + R(money(giftAmt)) + '</tr>';
    h += '<tr><td colspan="5" class="td-center">ส่วนต่างลูกค้า</td><td colspan="2"></td>' + R(money(diffAmt)) + '</tr>';
    h += '<tr class="row-total"><td colspan="5" class="td-center" style="font-size:11px">Subtotal + ค่าของขวัญ + ส่วนต่าง</td><td colspan="2"></td><td class="td-right td-bold" id="subAdjVal">' + money(subWithAdj) + '</td></tr>';
    h += '<tr><td colspan="5" class="td-center">Tax <input type="number" id="taxPercentInput" value="' + CalcEngine.CALC.tax_percent + '" step="0.5" min="0" max="30" style="width:50px;text-align:center;border:1px solid var(--border);border-radius:4px;padding:2px 4px;font-size:12px;background:var(--bg-primary);color:var(--text-primary)" onchange="App.onTaxChange(parseFloat(this.value))"> %</td><td colspan="2"></td><td class="td-right" id="taxVal">' + money(taxAmt) + '</td></tr>';
    h += '<tr class="row-grand"><td colspan="5" class="td-center">Total Price</td><td colspan="2"></td><td class="td-right" style="color:var(--accent);font-weight:700;font-size:16px" id="totalPriceVal">' + money(totalPrice) + '</td></tr>';
    h += '<tr><td colspan="5" class="td-center td-bold">Unit Price/cps</td><td colspan="2"></td><td class="td-right td-bold" id="unitPriceVal">' + unitPriceCps.toFixed(2) + '</td></tr>';

    // Exchange Rate
    h += '<tr><td colspan="4" class="td-center">Unit Price (Exchange)</td><td class="td-center"><select id="exCurrency" style="border:1px solid var(--border);border-radius:4px;padding:2px 4px;font-size:11px;background:var(--bg-primary);color:var(--text-primary)" onchange="App.onCurrencyChange(this.value)"><option value="THB" selected>THB</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="JPY">JPY</option><option value="CNY">CNY</option><option value="GBP">GBP</option></select></td><td colspan="2"></td><td class="td-right" id="unitPriceExVal"></td></tr>';
    h += '<tr><td colspan="3" class="td-center">Exchange Rate</td><td class="td-center" id="exCurrLabel">THB</td><td class="td-center" id="exRateVal">1</td><td colspan="2"></td><td class="td-right" id="exUnitLabel" style="font-size:11px;color:var(--text-muted)"></td></tr>';

    window._priceBase = { matBase: matBase, prodBase: prodBase, packBase: packBase, otherBase: otherBase, giftAmt: giftAmt, diffAmt: diffAmt, qty: totalQty, taxPercent: CalcEngine.CALC.tax_percent, subWithAdj: subWithAdj };

    // Store rendered totalPrice as the single source of truth for qty compare cards
    window._renderedTotalPrice = totalPrice;
    window._renderedUnitPrice = Math.round(unitPriceCps * 100) / 100;

    // Per-F breakdown summary
    h += '<tr class="row-section"><td colspan="8" style="text-align:center;font-weight:600;padding:12px 0 4px"><i class="fas fa-layer-group"></i> Per-F Breakdown</td></tr>';
    fMeta.forEach(function(fm, fi) {
      var fMat = 0, fProd = 0;
      (estimate.components || []).forEach(function(cr) {
        var fr = cr.fResults?.[fi];
        if (!fr || fr.error) return;
        fMat += (fr.paperCost?.total || 0) + (fr.specialInk?.total || 0);
        fProd += (fr.plateCost?.total || 0) + (fr.printCost?.total || 0) + (fr.proofCost?.total || 0) + (fr.foilCost || 0) + (fr.embossCost || 0);
      });
      var fSub = fMat + fProd;
      var fUnit = fm.qty > 0 ? fSub / fm.qty : 0;
      h += '<tr style="font-size:12px"><td colspan="2">' + fBadge(fm.f_code) + '</td>'
        + '<td class="td-right">Material: ' + money(fMat) + '</td>'
        + '<td class="td-right" colspan="2">Production: ' + money(fProd) + '</td>'
        + '<td class="td-right">Subtotal: ' + money(fSub) + '</td>'
        + '<td class="td-right">@' + fUnit.toFixed(2) + '</td>'
        + '<td class="td-right">' + num(fm.qty) + ' pcs</td></tr>';
    });

    // Weight & Thickness per component
    f.components.forEach(function(fc, fci) {
      var cr = estimate.components?.[fci];
      var sharedW = cr?.shared?.weight || {};
      var openWin = fc?._layout?.unfolded ? (fc._layout.unfolded.openW / 25.4).toFixed(2) : '-';
      var openLin = fc?._layout?.unfolded ? (fc._layout.unfolded.openL / 25.4).toFixed(2) : '-';
      var wPc = sharedW.perPiece || 0;
      var thkIn = '-';
      if (fc?.paper?.paper_thickness && parseFloat(fc.paper.paper_thickness) > 0) {
        thkIn = (parseFloat(fc.paper.paper_thickness) / 25.4).toFixed(5);
      } else if (fc?.paper?.paper_gram) {
        thkIn = (parseFloat(fc.paper.paper_gram) * 0.0013 / 25.4).toFixed(5);
      }
      var kwCps2 = cr?.shared?.packingCost?.kraftwrapQtyPerPack || 100;
      var weightPerPack = wPc * kwCps2;
      var compTotalWeight = wPc * totalQty;
      var fcName = escapeHtml(fc?.component_name || ('Component ' + (fci + 1)));
      h += '<tr class="row-section" style="font-size:11px;text-align:center"><td rowspan="4" style="text-align:center;vertical-align:middle;font-weight:600">' + fcName + '</td><td>Weight</td><td>' + wPc.toFixed(5) + '</td><td>kg/1 cp.</td><td colspan="4" style="font-size:10px">Kraftwrap: กว้าง ' + openWin + ' ยาว ' + openLin + '</td></tr>';
      h += '<tr class="row-section" style="font-size:11px;text-align:center"><td>Thickness</td><td>' + thkIn + '</td><td>inch</td><td colspan="4" style="font-size:10px">Inner size: ' + openWin + ' x ' + openLin + '</td></tr>';
      h += '<tr class="row-section" style="font-size:11px;text-align:center"><td>Pallet size</td><td colspan="2">-</td><td colspan="4" style="font-size:10px">Net weight: ' + weightPerPack.toFixed(2) + ' kg/pack (' + kwCps2 + ' pcs)</td></tr>';
      h += '<tr class="row-section" style="font-size:11px;text-align:center"><td>วางสูง</td><td>-</td><td>ชั้นฯ ละ -</td><td colspan="4" style="font-size:10px">Gross weight: ' + weightPerPack.toFixed(2) + ' kg/pack | Total: ' + compTotalWeight.toFixed(2) + ' kg</td></tr>';
    });

    h += '<tr><td colspan="8" style="border:none;padding:4px 10px;font-size:11px;color:var(--text-muted)">' + bahtText(t.finalPrice) + '</td></tr>';
    h += '</tbody></table></div>';
  }

  // === Packing Detail + Diagram (matching normal mode) ===
  f.components.forEach(function(comp, ci) {
    var cr = estimate.components?.[ci];
    var pk2 = cr?.shared?.packingCost || {};
    var kwCps = pk2.kraftwrapQtyPerPack || 100;
    var hasPacking = comp.packing?.some(function(p) { return (p.name||'').toLowerCase().includes('kraftwrap'); });
    if (!hasPacking && !pk2.kraftwrap && pk2.kraftwrap !== 0) return;

    var compName2 = comp.component_name || ('Component ' + (ci + 1));
    var sz = comp.packaging_size || {};
    var foldW = parseFloat(sz.width) || 0;
    var foldL = parseFloat(sz.length) || 0;
    var baseWin = foldW > 0 ? (foldW / 25.4).toFixed(2) : '-';
    var baseLin = foldL > 0 ? (foldL / 25.4).toFixed(2) : '-';
    var numW2 = parseInt(comp._pk_numW) || 1;
    var numL2 = parseInt(comp._pk_numL) || 1;
    var packSizeW = foldW > 0 ? (foldW * numW2 / 25.4).toFixed(2) : baseWin;
    var packSizeL = foldL > 0 ? (foldL * numL2 / 25.4).toFixed(2) : baseLin;
    var canvasId = 'packingCanvas_' + ci;
    var pkTypes = comp.packing || [];
    var hasPB = pkTypes.some(function(p) { return (p.name||'').toLowerCase().includes('paperband'); });
    var hasKW = pkTypes.some(function(p) { return (p.name||'').toLowerCase().includes('kraftwrap'); });
    var hasCT = pkTypes.some(function(p) { return (p.name||'').toLowerCase().includes('carton'); });
    var hasPL = pkTypes.some(function(p) { return (p.name||'').toLowerCase().includes('pallet'); });
    var inputBox = 'style="width:50px;text-align:center;border:1px solid var(--border-color);border-radius:6px;padding:5px 4px;font-size:13px;font-weight:700;background:var(--bg-input);color:var(--text-primary)"';

    h += '<div class="detail-card" style="margin-top:16px;padding:0;overflow:hidden">'
      + '<div style="background:linear-gradient(135deg,var(--primary-dark),var(--primary));padding:12px 20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
      + '<i class="fas fa-box-open" style="color:#fff;font-size:16px"></i>'
      + '<span style="color:#fff;font-size:14px;font-weight:700">Component ' + (ci+1) + ': ' + escapeHtml(compName2) + '</span>'
      + '<span style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:500">Packing</span>'
      + '<div style="margin-left:auto;display:flex;gap:10px;flex-wrap:wrap">'
      + [['Paper Band',hasPB],['Kraftwrap',hasKW],['Carton',hasCT],['Pallet',hasPL]].map(function(arr) { return '<span style="font-size:11px;color:' + (arr[1] ? '#fff' : 'rgba(255,255,255,0.4)') + ';display:flex;align-items:center;gap:3px"><i class="fas fa-' + (arr[1] ? 'check-circle' : 'circle') + '" style="font-size:10px"></i>' + arr[0] + '</span>'; }).join('')
      + '</div></div>'
      + '<div style="display:flex;min-height:340px">'
      + '<div style="flex-shrink:0;padding:20px 24px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;gap:16px;min-width:160px;max-width:280px">'
      + '<div style="font-size:13px;font-weight:700;color:var(--accent)"><i class="fas fa-scroll" style="margin-right:6px"></i>Kraftwrap</div>'
      + '<div style="display:flex;flex-direction:column;gap:10px">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span style="font-size:12px;color:var(--text-secondary)">จำนวนด้านกว้าง</span><input type="number" id="pkNumW_' + ci + '" value="' + numW2 + '" min="1" max="2" ' + inputBox + ' onchange="App.onPackingNumChange(' + ci + ')"></div>'
      + '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span style="font-size:12px;color:var(--text-secondary)">จำนวนด้านยาว</span><input type="number" id="pkNumL_' + ci + '" value="' + numL2 + '" min="1" max="2" ' + inputBox + ' onchange="App.onPackingNumChange(' + ci + ')"></div>'
      + '</div>'
      + '<div style="border-top:1px solid var(--border-color);padding-top:12px"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Packing Size</div><div id="pkSizeLabel_' + ci + '" style="font-size:18px;font-weight:800;color:var(--primary)">' + packSizeW + '" × ' + packSizeL + '"</div></div>'
      + '<div><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">จำนวน/pack</div><div style="display:flex;align-items:center;gap:6px"><input type="number" id="pkCps_' + ci + '" value="' + kwCps + '" min="1" ' + inputBox + ' style="width:65px"><span style="font-size:12px;color:var(--text-muted)">ชิ้น</span></div></div>'
      + '</div>'
      + '<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:12px;position:relative;min-height:380px">'
      + '<canvas id="' + canvasId + '" style="max-width:100%;max-height:100%;cursor:pointer" onclick="App.showPackingPopup(\'' + canvasId + '\')" title="คลิกเพื่อดูภาพใหญ่"></canvas>'
      + '</div></div></div>';

    requestAnimationFrame(function() {
      if (typeof drawPackingDiagram === 'function') drawPackingDiagram(canvasId, parseFloat(packSizeW) || 5, parseFloat(packSizeL) || 5, numW2, numL2, kwCps, { hasPB: hasPB, hasKW: hasKW, hasCT: hasCT, hasPL: hasPL });
    });
  });

  // === Remark ===
  var remarkVal = State.form._priceRemark || '';
  h += '<div class="detail-card" style="margin-top:12px;padding:14px 20px">'
    + '<div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:6px"><i class="fas fa-sticky-note" style="color:var(--accent);margin-right:6px"></i>Remark</div>'
    + '<textarea id="priceRemark" placeholder="ใส่หมายเหตุเพิ่มเติม..." style="width:100%;min-height:60px;border:1px solid var(--border-color);border-radius:8px;padding:10px 12px;font-size:13px;resize:vertical;background:var(--bg-secondary);color:var(--text-primary);font-family:inherit;line-height:1.5" oninput="if(window.State)State.form._priceRemark=this.value">' + escapeHtml(remarkVal) + '</textarea></div>';

  // === Quantity Price Comparison (Multi-F) ===
  // Save original F proportions (immutable) for scaling
  var origFProportions = f.f_data.map(function(fd) { return parseInt(fd.qty) || 0; });
  var currentTotalQty = totalQty;
  window._multiFOrigProportions = origFProportions;
  window._multiFOrigTotal = currentTotalQty;

  var compareQtys = [1000, 3000, 5000, 10000, 20000, 50000];
  if (currentTotalQty > 0 && compareQtys.indexOf(currentTotalQty) === -1) compareQtys.push(currentTotalQty);
  compareQtys.sort(function(a, b) { return a - b; });

  window._qtyCompareCache = {};
  // For "ปัจจุบัน" use the RENDERED totalPrice (source of truth — matches display above)
  var curRenderedTotal = window._renderedTotalPrice || totalPrice;
  var curRenderedUnit = window._renderedUnitPrice || (totalQty > 0 ? curRenderedTotal / totalQty : 0);
  window._qtyCompareCache[currentTotalQty] = { total: Math.round(curRenderedTotal * 100) / 100, unitPrice: Math.round(curRenderedUnit * 100) / 100 };

  var qtyCards = compareQtys.map(function(q) {
    if (q === currentTotalQty) {
      return { qty: q, total: Math.round(curRenderedTotal * 100) / 100, unitPrice: Math.round(curRenderedUnit * 100) / 100, isCurrent: true };
    }
    // Scale F qtys and compute via CalcEngine (same formula as rendered summary)
    var scaled = _scaleMultiFQtys(origFProportions, currentTotalQty, q);
    var origFQtys = f.f_data.map(function(fd) { return fd.qty; });
    f.f_data.forEach(function(fd, i) { fd.qty = String(scaled[i]); });
    var total2 = 0, unitPrice2 = 0;
    try {
      var est2 = CalcEngine.calcFullEstimate(f);
      var t2 = est2.totals?.[0] || {};
      // Recalculate the SAME way as the summary section (with processInfoTotal)
      var sub2 = (t2.materialTotal || 0) + (t2.productionTotal || 0) + (t2.packingTotal || 0) + (t2.deliveryTotal || 0) + (t2.otherCostTotal || 0) + (t2.processInfoTotal || 0) + (t2.formProcessTotal || 0);
      sub2 += (t2.giftTotal || 0) + (t2.priceDiffTotal || 0);
      var tax2 = sub2 * CalcEngine.CALC.tax_percent / 100;
      total2 = sub2 + tax2;
      unitPrice2 = q > 0 ? total2 / q : 0;
    } catch(e) {}
    f.f_data.forEach(function(fd, i) { fd.qty = origFQtys[i]; }); // restore
    window._qtyCompareCache[q] = { total: Math.round(total2 * 100) / 100, unitPrice: Math.round(unitPrice2 * 100) / 100 };
    return { qty: q, total: Math.round(total2 * 100) / 100, unitPrice: Math.round(unitPrice2 * 100) / 100, isCurrent: false };
  });
  var minUnit = Math.min.apply(null, qtyCards.map(function(c) { return c.unitPrice; }).filter(function(u) { return u > 0; }));

  function buildQtyCardMF(c, minU) {
    var isBest = c.unitPrice === minU && c.unitPrice > 0;
    var isCur = c.isCurrent;
    var border = isCur ? '2px solid #7c3aed' : isBest ? '2px solid #16a34a' : '1px solid var(--border-color)';
    var badge = isCur ? '<div style="position:absolute;top:-1px;right:-1px;background:#7c3aed;color:#fff;font-size:10px;padding:2px 10px;border-radius:0 10px 0 8px;font-weight:700">ปัจจุบัน</div>'
      : isBest ? '<div style="position:absolute;top:-1px;right:-1px;background:#16a34a;color:#fff;font-size:10px;padding:2px 10px;border-radius:0 10px 0 8px;font-weight:700">ถูกสุด/ชิ้น</div>' : '';
    return '<div data-qty="' + c.qty + '" style="position:relative;background:var(--bg-tertiary);border:' + border + ';border-radius:12px;padding:16px 14px 14px;text-align:center;cursor:pointer;transition:all 0.15s;min-width:0" onclick="App.qtyCompareSelect(' + c.qty + ')"'
      + ' onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 4px 12px rgba(91,45,142,0.15)\'"'
      + ' onmouseleave="this.style.transform=\'\';this.style.boxShadow=\'\'">'
      + badge
      + '<div style="font-size:22px;font-weight:800;color:var(--accent)">' + c.qty.toLocaleString() + '</div>'
      + '<div style="font-size:11px;color:var(--text-muted)">ชิ้น</div>'
      + '<div style="border-top:1px solid var(--border-color);margin:8px -4px 0;padding-top:8px"><div style="font-size:11px;color:var(--text-muted)">รวม</div>'
      + '<div style="font-size:15px;font-weight:700;color:var(--text-primary)">' + (c.total > 0 ? c.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-') + '</div></div>'
      + '<div style="margin-top:6px"><div style="font-size:11px;color:var(--text-muted)">ต่อชิ้น</div>'
      + '<div style="font-size:18px;font-weight:800;color:' + (isBest ? '#16a34a' : 'var(--primary)') + '">' + (c.unitPrice > 0 ? c.unitPrice.toFixed(2) : '-') + '</div></div></div>';
  }

  h += '<div class="detail-card" style="margin-top:16px;border:2px solid var(--accent);border-radius:12px;overflow:hidden">'
    + '<div style="background:linear-gradient(135deg,#5b2d8e,#7b4db8);padding:10px 20px;color:#fff;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'
    + '<div><h5 style="margin:0;font-size:14px"><i class="fas fa-tags"></i> เปรียบเทียบราคาตามจำนวนสั่ง (Multi-F)</h5>'
    + '<div style="font-size:10px;opacity:0.7;margin-top:2px">สัดส่วนแต่ละ F คงเดิม — คลิกเพื่อเปลี่ยนจำนวน</div></div></div>'
    + '<div id="qtyCompareGrid" style="padding:14px 16px"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px">'
    + qtyCards.map(function(c) { return buildQtyCardMF(c, minUnit); }).join('')
    + '</div></div></div>';

  // Summary PDF button
  h += '<div style="text-align:center;margin:12px 0"><button class="btn btn-secondary" onclick="App.generateSummaryPDF()" style="font-size:12px"><i class="fas fa-file-pdf"></i> Summary PDF</button></div>';

  // Render into detail view (ใช้ detailContent + showView เหมือน normal path)
  $('detailContent').innerHTML = h;
  showView('viewDetail');
  setTopBar('Price Estimation', 'ผลคำนวณราคา (Multi-F)');
}

function _doCalculatePrice() {
  const f = State.form;
  const qtys = f.qty.filter(q => q).map(q => parseInt(q));

  console.log('[CalcPrice] Starting calcFullEstimate...', { qtys, components: f.components.length, printType: f.print_type });
  const estimate = CalcEngine.calcFullEstimate(f);
  State.lastEstimate = estimate;
  console.log('[CalcPrice] Result:', JSON.stringify(estimate, null, 0).slice(0, 500));

  if (estimate.error) { toast(estimate.error, 'error'); return; }

  // === Multi-F: render per-F breakdown ===
  if (estimate.isMultiF) { _doRenderMultiFPrice(estimate); return; }

  // Helpers
  const R = (v) => `<td class="td-right">${v}</td>`;
  const RB = (v) => `<td class="td-right td-bold">${v}</td>`;
  const totalRow = (label, val) => `<tr class="row-total"><td colspan="7">${label}</td>${RB(money(val))}</tr>`;
  // Info icon: clickable to show formula detail popup
  // ref = reference source tag HTML
  const REF = (sources) => `<hr><div style="font-size:11px;color:var(--text-muted);margin-top:4px"><i class="fas fa-book" style="margin-right:4px"></i><b>แหล่งอ้างอิง:</b><ul style="margin:4px 0 0 16px;padding:0">${sources.map(s => `<li>${s}</li>`).join('')}</ul></div>`;
  const I = (title, lines) => {
    const id = '_fi' + (++_formulaIdx);
    _formulaData[id] = { title, lines };
    return `<span class="formula-icon" onclick="App.showFormula('${id}')" title="ดูสูตรคำนวณ"><i class="fas fa-info-circle"></i></span>`;
  };
  _formulaIdx = 0;
  _formulaData = {};

  let h = `<div class="detail-header" style="display:flex;justify-content:space-between;align-items:center">
    <div><h4><i class="fas fa-calculator"></i> Price Estimation</h4><div style="color:var(--text-muted);font-size:13px">ผลคำนวณราคาจาก CalcEngine (Master Data)</div></div>
    <button class="btn btn-secondary" onclick="App.backToForm()"><i class="fas fa-arrow-left"></i> กลับไปฟอร์ม</button>
  </div>`;

  const firstQi = 0;
  const firstQty = qtys[0];
  const isUV = (f.ink_type || '').toUpperCase() === 'UV';

  (estimate.components || []).forEach((cr, ci) => {
    if (cr.error) {
      h += `<div class="detail-card"><p style="color:#f08080">${cr.error}</p></div>`;
      return;
    }

    const qr = cr.results?.[firstQi];
    if (!qr || qr.error) {
      h += `<div class="detail-card"><p style="color:#f08080"><i class="fas fa-exclamation-triangle"></i> ${cr.name || `Component ${ci+1}`}: ${qr?.error || 'ไม่สามารถคำนวณได้'}</p></div>`;
      return;
    }

    const compName = cr.name || `Component ${ci+1}`;
    const comp = f.components[ci] || {};
    const ap = qr.afterPress || {};
    const pc = qr.paperCost || {};
    const pl = qr.plateCost || {};
    const pr = qr.printCost || {};
    const pk = qr.packingCost || {};
    const si = qr.specialInk || {};
    const pf = qr.proofCost || {};
    const pu = qr.paperUsage || {};
    const best = comp._layout?.best || {};

    h += `<div class="detail-card" style="padding:0;overflow:hidden">`;

    // Volume header row inside table
    h += `<table class="price-table">`;
    h += `<colgroup><col style="width:12%"><col style="width:13%"><col style="width:10%"><col style="width:10%"><col style="width:10%"><col style="width:13%"><col style="width:12%"><col style="width:20%"></colgroup>`;
    h += `<thead><tr>`;
    h += `<th colspan="5" rowspan="2" style="text-align:center;vertical-align:middle">Description</th>`;
    h += `<th style="text-align:center">Volume</th>`;
    h += `<th style="text-align:right">${num(firstQty)}</th>`;
    h += `<th style="text-align:right">${num(firstQty)}</th>`;
    h += `</tr>`;
    h += `<tr><th class="td-right">Unit Price</th><th class="td-right">Qty</th><th class="td-right">Price</th></tr>`;
    h += `</thead><tbody>`;

    // === MATERIAL ===
    const paperSheetW = best.sw || best.paperW || 0;
    const paperSheetL = best.sl || best.paperL || 0;
    const rollWin = best.rollW_in || best.paperW_in || (paperSheetW / 25.4);
    const rollLin = best.rollL_in || best.paperL_in || (paperSheetL / 25.4);
    h += `<tr><td>Paper ${I('Paper Cost (ค่ากระดาษ)', [
      `<b>สูตร:</b> unitPrice = rollW" × rollL" × totalPrice × gsm / 1,550,000`,
      `<b>Paper Cost (ต้นทุน):</b> ${pc._baseCost || f.components[ci]?.paper?.paper_cost || '-'} THB/kg`,
      `<b>Markup:</b> ${pc.markup || 0}% (ในประเทศ=${CalcEngine.CALC.paper_markup_default}%, นำเข้า=${CalcEngine.CALC.paper_markup_import}%)`,
      `<b>totalPrice:</b> cost × (1 + markup/100) = ${(parseFloat(f.components[ci]?.paper?.paper_cost || 0) * (1 + (pc.markup || 0) / 100)).toFixed(2)}`,
      `<b>Roll Size:</b> ${rollWin.toFixed(2)}" × ${rollLin.toFixed(2)}"`,
      `<b>GSM:</b> ${pc.paperGram || '-'}`,
      `<b>unitPrice/แผ่น:</b> ${rollWin.toFixed(2)} × ${rollLin.toFixed(2)} × ${(parseFloat(f.components[ci]?.paper?.paper_cost || 0) * (1 + (pc.markup || 0) / 100)).toFixed(2)} × ${pc.paperGram} / 1,550,000 = <b>${money(pc.unitPrice || 0)}</b>`,
      `<hr>`,
      `<b>จำนวนแผ่น (paperNet):</b> ${num(pc.paperNet || pu.paperNet || 0)} แผ่น`,
      `<b>Total:</b> ${num(pc.paperNet || pu.paperNet || 0)} × ${money(pc.unitPrice || 0)} = <b>${money(pc.total || 0)}</b>`,
      REF([
        'ราคากระดาษ: <code>paper_info</code> (Estimate API Master Data)',
        'ค่าคงที่ 1,550,000: <code>calc.js → CALC.formula_value</code>',
        'Markup %: <code>calc.js → CALC.paper_markup_default/import</code>',
        'Roll Size: <code>std_paper_sizes[]</code> (Layout Engine)',
        'สูตรจากระบบเก่า: <code>js_function_estimate_calculation.js</code>',
      ]),
    ])}</td><td>${escapeHtml(compName)}</td><td>${escapeHtml(pc.paperName || pc.paperCode || '')}</td><td colspan="2">${pc.paperGram || ''} gsm</td>${R(money(pc.unitPrice || 0))}${R(num(pc.paperNet || pu.paperNet || 0))}${R(money(pc.total || 0))}</tr>`;
    if (qr.corrugated?.board > 0) {
      const crd = qr.corrugated;
      const corrGrade = comp?.corrugated?.grade?.filter(g=>g) || [];
      const corrGram = comp?.corrugated?.gram?.filter(g=>g) || [];
      const corrFlute = comp?.corrugated?.flute_type || '';
      const corrLayer = comp?.corrugated?.layer || 2;
      const gradeDisplay = corrGrade.map((g,i) => g + (corrGram[i] ? corrGram[i] : '')).join('/');
      const ratePerGrossFt = crd.rate || 0;
      const ratePerSqIn = ratePerGrossFt > 0 ? parseFloat((ratePerGrossFt / 144).toFixed(4)) : 0;

      // Row 1: Corrugated Board main row
      h += `<tr><td>Corrugated Board ${I('ราคาลูกฟูก', [
        '<b>สูตร:</b> rate/144 × (1+markup%) × flute_side" × cut_off"',
        '<b>Rate (ราคาทุน):</b> ' + ratePerGrossFt + ' B/กร.ฟ = ' + ratePerSqIn + ' B/กร.นิ้ว',
        '<b>Markup:</b> ' + (CalcEngine.CALC.corrugated_markup||10) + '%',
        '<b>ขนาดลูกฟูก:</b> ' + (crd.fluteSide_in||0) + '" × ' + (crd.cutOff_in||0) + '"',
        '<b>Unit price/แผ่น:</b> ' + money(crd.boardUnitPrice||0),
        '<b>Qty:</b> afterUps + waste = ' + num(crd.boardQty||0),
      ])}</td><td>${escapeHtml(compName)}</td><td>ลอน ${corrFlute} ${corrLayer} ชั้น</td><td colspan="2">${gradeDisplay}</td>${R(money(crd.boardUnitPrice||0))}${R(num(crd.boardQty||0))}${R(money(crd.board||0))}</tr>`;

      // Sub-detail rows ตรงกับระบบเก่า: แต่ละบรรทัดเป็น row มี border ช่องขวา merge ว่าง
      h += `<tr><td colspan="2" style="padding-left:20px;font-size:11px;color:var(--text-muted)">ลอนขนานด้าน x Cut off</td><td colspan="3" style="font-size:11px;color:var(--text-muted)">ราคาลูกฟูกต่อแผ่น</td><td colspan="3"></td></tr>`;
      h += `<tr><td colspan="2" style="padding-left:20px;font-size:11px;color:var(--text-muted)">${(crd.fluteSide_in||0).toFixed(3)} x ${(crd.cutOff_in||0).toFixed(3)}</td><td colspan="3" style="font-size:11px;color:var(--text-muted)">${money(crd.boardUnitPrice||0)}</td><td colspan="3"></td></tr>`;
      h += `<tr><td style="padding-left:20px;font-size:11px;color:var(--text-muted)">ราคาทุน</td><td style="font-size:11px;color:var(--text-muted)">${ratePerGrossFt.toFixed(2)}</td><td style="font-size:11px;color:var(--text-muted)">B/ตร.ฟุต</td><td style="font-size:11px;color:var(--text-muted)">${ratePerSqIn.toFixed(4)}</td><td style="font-size:11px;color:var(--text-muted)">B/ตร.นิ้ว</td><td colspan="3"></td></tr>`;
    }
    if (si.total > 0) {
      h += `<tr><td>Special Ink</td><td>${escapeHtml(compName)}</td><td colspan="3"></td>${R('-')}${R('-')}${R(money(si.total))}</tr>`;
    }
    // === Blanket (ผ้ายาง) — สำหรับ coating type ที่ต้องใช้ผ้ายางเว้นลิ้น ===
    // Source: legacy js_function_estimate.js:3924-3956 (getBlanketUVGap)
    if (ap.blanket > 0 && Array.isArray(ap.blanketDetails)) {
      ap.blanketDetails.forEach(bd => {
        const bTooltip = [
          `<b>ที่มา:</b> Material สำหรับงานเคลือบเว้นลิ้น (legacy: getBlanketUVGap)`,
          `<b>Coating type:</b> ${bd.coating_code}`,
          `<b>Unit price:</b> ${money(bd.unit_price)} บาท/ด้าน (ตายตัว — legacy reference)`,
          `<b>จำนวนด้าน:</b> ${bd.side}`,
          `<b>สูตร:</b> ${money(bd.unit_price)} × ${bd.side} = <b>${money(bd.cost)}</b>`,
          `<b>ที่มา:</b> <code>js_function_estimate.js:3924-3956</code> (Sirivatana legacy)`,
        ];
        h += `<tr><td>${escapeHtml(bd.name)} ${I(bd.name, bTooltip)}</td><td>${escapeHtml(compName)}</td><td colspan="3">${bd.coating_code}</td>${R(money(bd.unit_price))}${R(bd.side)}${R(money(bd.cost))}</tr>`;
      });
    }
    h += totalRow('Total (Material)', qr.materialTotal);

    // === PLATE ===
    const machName = pl.machineName || 'Cut 2';
    const ppu = CalcEngine.CALC.plate_price_per_color;
    h += `<tr><td rowspan="2">Plate ${I('Plate Cost (ค่าเพลท)', [
      `<b>สูตร:</b> price = colors × pricePerColor × plateSets`,
      `<b>Price/Color:</b> ${ppu} THB`,
      `<b>Plate Sets:</b> ${pl.plateSets || 1} (ชุดเพลทใหม่ทุก ${num(CalcEngine.CALC.plate_set_per_sheets)} แผ่น)`,
      `<b>Machine:</b> ${machName}`,
      `<hr>`,
      `<b>Outside:</b> ${pl.colorsOut || 0} สี × ${ppu} × ${pl.plateSets || 1} = <b>${money(pl.outside || 0)}</b>`,
      `<b>Inside:</b> ${pl.colorsIn || 0} สี × ${ppu} × ${pl.plateSets || 1} = <b>${money(pl.inside || 0)}</b>`,
      `<b>Total:</b> <b>${money(pl.total || 0)}</b>`,
      REF([
        'ราคา/สี: <code>calc.js → CALC.plate_price_per_color = ${CalcEngine.CALC.plate_price_per_color}</code>',
        'Cut 1 เพิ่ม: <code>CALC.plate_cut1_add = ${CalcEngine.CALC.plate_cut1_add}</code> THB/สี',
        'จำนวนสี: กรอกจากฟอร์ม (color outside/inside)',
        'สูตรจากระบบเก่า: <code>js_function_estimate_calculation.js → setCalculatePlateCost()</code>',
      ]),
    ])}</td><td>${escapeHtml(compName)} Outside</td><td>${pl.colorsOut || 0} cols</td><td colspan="2">${machName}</td>${R(money(pl.outside || 0))}${R(pl.plateSets || 1)}${R(money(pl.outside || 0))}</tr>`;
    h += `<tr><td>${escapeHtml(compName)} Inside</td><td>${pl.colorsIn || 0} cols</td><td colspan="2">${machName}</td>${R(money(pl.inside || 0))}${R(pl.plateSets || 1)}${R(money(pl.inside || 0))}</tr>`;
    h += totalRow('Total (Plate)', pl.total || 0);

    // === PROOF ===
    h += `<tr class="row-total"><td colspan="7">Total (Proof) ${I('Proof Cost (ค่าพิสูจน์สี)', [
      `<b>สูตร:</b> 500 THB ต่อด้าน (เฉพาะ Offset/Flexo)`,
      `<b>Print Type:</b> ${f.print_type}`,
      `<b>Outside:</b> ${(parseInt(f.components[ci]?.color?.outside) || 0) > 0 ? '500 THB (มีสีนอก)' : '0 (ไม่มีสีนอก)'}`,
      `<b>Inside:</b> ${(parseInt(f.components[ci]?.color?.inside) || 0) > 0 ? '500 THB (มีสีใน)' : '0 (ไม่มีสีใน)'}`,
      `<b>Total:</b> <b>${money(pf.total || 0)}</b>`,
      f.print_type === 'JetPress' || f.print_type === 'Konica' ? `<i>Digital print ไม่ต้องทำ proof</i>` : '',
      REF([
        'ราคา proof/ด้าน: <code>calc.js → calcProofCost() = 500 THB</code>',
        'Digital (JetPress/Konica) ไม่คิดค่า proof',
        'สูตรจากระบบเก่า: <code>js_function_estimate_calculation.js</code>',
      ]),
    ])}</td>${RB(money(pf.total || 0))}</tr>`;

    // === PRINT ===
    const inkLabel = isUV ? ' UV' : '';
    h += `<tr><td rowspan="2">Print ${I('Print Cost (ค่าพิมพ์)', [
      `<b>สูตร:</b> ดึง rate จาก price_info ตาม afterUps (จำนวนแผ่น)`,
      `<b>Print Type:</b> ${f.print_type}`,
      `<b>Ink:</b> ${f.ink_type || 'Normal'}${isUV ? ` (UV ×${CalcEngine.CALC.uv_ink_factor})` : ''}`,
      `<b>afterUps (แผ่นรวม waste):</b> ${num(pu.afterUps || 0)}`,
      `<b>Machine:</b> ${pr.machineName || machName}`,
      `<b>Rate key:</b> ${(parseInt(f.components[ci]?.color?.outside) || 0) >= 5 ? 'print_5col' : (parseInt(f.components[ci]?.color?.outside) || 0) >= 3 ? 'print_3col' : 'print_1col'}`,
      `<hr>`,
      `<b>Outside:</b> ${pr.colorsOut || 0} สี = <b>${money(pr.outside || 0)}</b>`,
      `<b>Inside:</b> ${pr.colorsIn || 0} สี = <b>${money(pr.inside || 0)}</b>`,
      `<b>Total:</b> <b>${money(pr.total || 0)}</b>`,
      REF([
        'Rate/แผ่น: <code>price_info</code> (Estimate API — tier ตามจำนวนแผ่น)',
        'UV factor: <code>calc.js → CALC.uv_ink_factor = ${CalcEngine.CALC.uv_ink_factor}</code>',
        'JetPress: 5 THB/แผ่น, Konica: 3 THB/แผ่น (color)',
        'Flexo: rate × 0.7 (70% ของ Offset)',
        'สูตรจากระบบเก่า: <code>js_function_estimate_calculation.js → setCalculatePrintCost()</code>',
      ]),
    ])}</td><td>${escapeHtml(compName)} Outside</td><td>${pr.colorsOut || 0} cols${inkLabel}</td><td colspan="2">${pr.machineName || machName}</td>${R(money(pr.outside || 0))}${R(1)}${R(money(pr.outside || 0))}</tr>`;
    h += `<tr><td>${escapeHtml(compName)} Inside</td><td>${pr.colorsIn || 0} cols${inkLabel}</td><td colspan="2">${pr.machineName || machName}</td>${R(money(pr.inside || 0))}${R(1)}${R(money(pr.inside || 0))}</tr>`;
    h += totalRow('Total (Print)', pr.total || 0);

    // === PROCESS (ลำดับตรงกับระบบเก่า: Coating → ทากาวลูกฟูก → Block Diecut → Diecut → แกะ → Inspection) ===
    // 1. Coating
    if (ap.coating > 0) {
      const cd = ap.coatingDetails || [];
      if (cd.length > 0) {
        cd.forEach(c => {
          const descParts = [c.option, c.type, c.side + ' s'].filter(Boolean);
          h += `<tr><td>Coating ${I('Coating Cost (ค่าเคลือบ)', [
            `<b>ชื่อ:</b> ${c.option ? c.option + ' ' : ''}${c.type}`,
            `<b>Side:</b> ${c.side} ด้าน`,
            `<b>สูตร:</b> layoutW" × layoutL" × rate × sides`,
            `<b>Rate:</b> ${c.rate} B/sqinch`,
            `<b>Unit Price:</b> ${c.unitPrice.toFixed(2)} B/แผ่น`,
            `<b>Qty:</b> ${num(c.qty)} แผ่น (afterWaste)`,
            `<b>Total:</b> ${money(c.cost)}`,
          ])}</td><td>${escapeHtml(compName)}</td><td>${escapeHtml(descParts.join(' '))}</td><td></td><td></td>${R(c.unitPrice.toFixed(4))}${R(num(c.qty))}${R(money(c.cost))}</tr>`;
        });
      } else {
        h += `<tr><td>Coating</td><td>${escapeHtml(compName)}</td><td colspan="3"></td>${R('-')}${R('-')}${R(money(ap.coating))}</tr>`;
      }
    }
    // 2. ทากาวประกบลูกฟูกกับกระดาษ (อยู่ใน Process section — ตรงกับระบบเก่า)
    if (qr.corrugated?.gluing > 0) {
      const crdg = qr.corrugated;
      h += `<tr><td colspan="2">ทากาวประกบลูกฟูกกับกระดาษ ${I('ค่าทากาว', [
        '<b>สูตร:</b> flute_side" × cut_off" × ' + CalcEngine.CALC.corrugated_glued_cost + ' B/sqinch',
        '<b>Unit price:</b> ' + money(crdg.gluingUnitPrice||0),
      ])}</td><td>${escapeHtml(compName)}</td><td colspan="2">${CalcEngine.CALC.corrugated_glued_cost} B/sqinch</td>${R(money(crdg.gluingUnitPrice||0))}${R(num(crdg.boardQty||0))}${R(money(crdg.gluing||0))}</tr>`;
    }
    // 3. Block Diecut
    if (ap.block > 0) {
      const bb = ap.breakdown?.block;
      const blockTooltip = ['<b>ที่มา:</b> Lookup blockdiecut_info ตามขนาด Layout (กระดาษคลี่)'];
      if (bb) {
        if (bb.source === 'reprint_fixed') {
          blockTooltip.push('<b>ประเภทงาน:</b> Reprint → ใช้บล็อกเดิม รหัสคงที่ 500 บาท');
        } else if (bb.source === 'manual_override') {
          blockTooltip.push('<b>ประเภทงาน:</b> Manual override (user ใส่เอง)');
        } else if (bb.source === 'lookup_blockdiecut_info') {
          blockTooltip.push('<b>ประเภทงาน:</b> งานใหม่ → lookup blockdiecut_info');
          blockTooltip.push(`<b>ขนาด Layout:</b> ${bb.layoutW.toFixed(2)}" × ${bb.layoutL.toFixed(2)}" (short=${Math.min(bb.layoutW,bb.layoutL).toFixed(2)}", long=${Math.max(bb.layoutW,bb.layoutL).toFixed(2)}")`);
          if (bb.matchedRow) {
            blockTooltip.push(`<b>Match:</b> id=${bb.matchedRow.id} → ${bb.matchedRow.width}" × ${bb.matchedRow.length}" → rate <b>${money(bb.matchedRow.rate)}</b>`);
          }
        }
        blockTooltip.push(`<b>Block qty:</b> ${bb.blockQty}${bb.hasOPPWindow ? ' (OPP Window → ต้อง diecut 2 รอบ)' : ''}`);
        if (bb.materialMarkup > 0) blockTooltip.push(`<b>Material markup:</b> +${bb.materialMarkup}% (${money(bb.rawRate)} → ${money(bb.finalRate)})`);
        blockTooltip.push(`<b>สูตร:</b> ${bb.blockQty} × ${money(bb.finalRate)} = <b>${money(bb.total)}</b>`);
      }
      blockTooltip.push('<b>ที่มา:</b> <code>blockdiecut_info</code> (Estimate API master DB)');
      h += `<tr><td colspan="3">Block Diecut ${I('Block Diecut (ค่าบล็อค)', blockTooltip)}</td><td colspan="2">${escapeHtml(compName)}</td>${R(money(ap.block))}${R(1)}${R(money(ap.block))}</tr>`;
    }
    // 4. Diecut
    if (ap.diecut > 0) {
      const dcRate = qr.qty > 0 ? (ap.diecut / qr.qty) : 0;
      const db = ap.breakdown?.diecut;
      const dcTooltip = ['<b>สูตร:</b> max(min_price, afterUps × tier.diecut)'];
      if (db) {
        dcTooltip.push(`<b>afterUps:</b> ${num(db.afterUps)} แผ่น`);
        dcTooltip.push(`<b>Tier:</b> id ${db.tierId} (qty ${num(db.tierMinQty)}–${num(db.tierMaxQty)})`);
        dcTooltip.push(`<b>Rate:</b> ${db.rate.toFixed(5)} บาท/แผ่น`);
        dcTooltip.push(`<b>Min price:</b> ${money(db.minPrice)} บาท`);
        dcTooltip.push(`<b>calc:</b> max(${money(db.minPrice)}, ${num(db.afterUps)} × ${db.rate.toFixed(5)})`);
        dcTooltip.push(`     = max(${money(db.minPrice)}, ${money(db.calc)})`);
        dcTooltip.push(`     = <b>${money(db.total)}</b>`);
        dcTooltip.push(`<b>Rate/ชิ้น:</b> ${money(db.total)} ÷ ${num(qr.qty)} = ${dcRate.toFixed(5)} บาท`);
      } else {
        dcTooltip.push(`<b>Rate/ชิ้น:</b> ${dcRate.toFixed(5)} THB`);
        dcTooltip.push(`<b>Total:</b> <b>${money(ap.diecut)}</b>`);
      }
      dcTooltip.push('<b>ที่มา:</b> <code>price_info → diecut</code> + <code>min_price_info → diecut</code>');
      h += `<tr><td colspan="3">Diecut ${I('Diecut Cost (ค่าไดคัท)', dcTooltip)}</td><td colspan="2">${escapeHtml(compName)}</td>${R(dcRate.toFixed(5))}${R(num(qr.qty))}${R(money(ap.diecut))}</tr>`;
    }
    // 5. Foil / Emboss
    if (ap.foil > 0) h += `<tr><td colspan="3">Foil Stamp</td><td colspan="2">${escapeHtml(compName)}</td>${R('-')}${R('-')}${R(money(ap.foil))}</tr>`;
    if (ap.emboss > 0) h += `<tr><td colspan="3">Emboss</td><td colspan="2">${escapeHtml(compName)}</td>${R('-')}${R('-')}${R(money(ap.emboss))}</tr>`;
    // 6. แกะ
    if (ap.chip > 0) {
      const chipRate = qr.qty > 0 ? (ap.chip / qr.qty) : 0;
      h += `<tr><td colspan="5">แกะ ${I('แกะ (Chip Cost — เก็บเศษไดคัท)', [
        `<b>สูตร:</b> qty × tier.chip (rate ตาม qty ชิ้น ไม่ใช่แผ่น)`,
        `<b>Qty:</b> ${num(qr.qty)} ชิ้น`,
        `<b>Rate/ชิ้น:</b> ${chipRate.toFixed(5)} THB`,
        `<b>Total:</b> ${num(qr.qty)} × ${chipRate.toFixed(5)} = <b>${money(ap.chip)}</b>`,
        REF(['Rate: <code>price_info → chip</code> (tier ตาม qty ชิ้น)', 'สูตรจากระบบเก่า: <code>js_function_estimate_calculation.js</code>']),
      ])}</td>${R(chipRate.toFixed(2))}${R(num(qr.qty))}${R(money(ap.chip))}</tr>`;
    }
    if (ap.trim > 0) h += `<tr><td colspan="5">ตัดเจียน ${I('ตัดเจียน (Trim Cost)', [
      `<b>สูตร:</b> max(minPrice, afterUps × tier.trim)`,
      `<b>afterUps:</b> ${num(pu.afterUps || 0)} แผ่น`,
      `<b>Total:</b> <b>${money(ap.trim)}</b>`,
      REF(['Rate: <code>price_info → trim</code>', 'Min: <code>min_price_info → trim</code>']),
    ])}</td>${R('-')}${R('-')}${R(money(ap.trim))}</tr>`;
    if (ap.inspection > 0) {
      const inspRate = qr.qty > 0 ? (ap.inspection / qr.qty) : 0;
      h += `<tr><td colspan="5">Inspection ${I('Inspection (ค่าตรวจงาน)', [
        `<b>สูตร:</b> qty × tier.inspection (rate ตาม qty ชิ้น)`,
        `<b>Qty:</b> ${num(qr.qty)} ชิ้น`,
        `<b>Rate/ชิ้น:</b> ${inspRate.toFixed(5)} THB`,
        `<b>Total:</b> ${num(qr.qty)} × ${inspRate.toFixed(5)} = <b>${money(ap.inspection)}</b>`,
        REF(['Rate: <code>price_info → inspection</code> (tier ตาม qty ชิ้น)', 'สูตรจากระบบเก่า: <code>js_function_estimate_calculation.js</code>']),
      ])}</td>${R(inspRate.toFixed(2))}${R(num(qr.qty))}${R(money(ap.inspection))}</tr>`;
    }
    if (ap.assembly > 0) h += `<tr><td colspan="5">Assembly (Gluing) ${I('Assembly (ค่าทากาว)', [
      `<b>สูตร:</b> max(minPrice, afterUps × tier.assembly_S/M/L)`,
      `<b>Size category:</b> ≤150mm=S, ≤300mm=M, >300mm=L`,
      `<b>Total:</b> <b>${money(ap.assembly)}</b>`,
      REF(['Rate: <code>price_info → assembly_S/M/L</code>', 'Min: <code>min_price_info → assembly</code>']),
    ])}</td>${R('-')}${R('-')}${R(money(ap.assembly))}</tr>`;
    // Process total = afterPress.total - blanket (blanket อยู่ใน Material) + corrugated gluing
    h += totalRow('Total (Process)', (ap.total || 0) - (ap.blanket || 0) + (qr.corrugated?.gluing || 0));

    // === OTHER (form-level process costs) — data is in totals, not component results ===
    const fpi = estimate.totals?.[firstQi]?.formProcessItems || [];
    if (fpi.length > 0) {
      fpi.forEach(fp => {
        const secLabel = { other_process: 'Other Process', handwork_process: 'Handwork', outsource: 'จัดจ้าง', materials: 'Material', other_items: 'Other' }[fp.section] || fp.section;
        const isProcess = ['other_process', 'handwork_process', 'outsource'].includes(fp.section);
        const qtyLabel = isProcess ? (fp.fixed_price ? num(qr.qty) : '1 (คงที่)') : num(fp.qty || 0);
        const unitLabel = money(fp.cost);
        h += `<tr><td>${escapeHtml(secLabel)}</td><td colspan="4">${escapeHtml(fp.name)}${isProcess && fp.fixed_price ? ' <span style="font-size:10px;color:var(--text-muted)">(ต่อชิ้น)</span>' : isProcess ? ' <span style="font-size:10px;color:var(--text-muted)">(เหมา)</span>' : ''}</td>${R(unitLabel)}${R(qtyLabel)}${R(money(fp.total))}</tr>`;
      });
    }
    h += totalRow('Total (Other)', estimate.totals?.[firstQi]?.formProcessTotal || 0);

    // === PACKING ===
    if (pk.kraftwrap > 0) {
      const kwPack = pk.kraftwrapPacks || Math.ceil(qr.qty / 65);
      const kwCps = pk.kraftwrapQtyPerPack || '-';
      const kwPrice = pk.kraftwrapPricePerPack || 5;
      h += `<tr><td colspan="2">Kraftwrap ${I('Kraftwrap (ห่อกระดาษ)', [
        `<b>สูตร:</b> ceil(qty / cps_per_pack) × price_per_pack`,
        `<b>Qty:</b> ${num(qr.qty)} ชิ้น`,
        `<b>Cps/pack:</b> ${kwCps} (คำนวณจาก weight/thickness)`,
        `<b>จำนวน pack:</b> ${num(kwPack)}`,
        `<b>ราคา/pack:</b> ${kwPrice.toFixed(2)} THB`,
        `<b>Total:</b> ${num(kwPack)} × ${kwPrice.toFixed(2)} = <b>${money(pk.kraftwrap)}</b>`,
        REF([
          'ราคา/pack: default 5 บาท — แก้ไขได้ที่ช่อง Unit Price',
          'Cps/pack: คำนวณจาก weight + thickness ตามระบบเก่า (setCalculateKraftwrapWeight)',
          'Weight limit: 5 kg, Height limit: 16.54" (A3 long side)',
        ]),
      ])}</td><td>${escapeHtml(compName)}</td><td>${kwCps}</td><td>Cps/pack</td><td class="td-right"><input type="number" id="kwPriceInput" value="${kwPrice.toFixed(2)}" step="0.5" min="0" style="width:55px;text-align:right;border:1px solid var(--border-color);border-radius:4px;padding:2px 4px;font-size:12px;background:var(--bg-secondary);color:var(--text-primary)" onchange="App.onKwPriceChange(parseFloat(this.value),${kwPack})"></td>${R(num(kwPack) + '.00')}<td class="td-right" id="kwTotalVal">${money(pk.kraftwrap)}</td></tr>`;
    }
    if (pk.paperband > 0) h += `<tr><td colspan="2">Paperband</td><td>${escapeHtml(compName)}</td><td colspan="2"></td>${R('-')}${R('-')}${R(money(pk.paperband))}</tr>`;
    if (pk.carton > 0) {
      const ctQty = pk._cartonQty || '-';
      const ctPrice = pk._cartonUnitPrice || '-';
      h += `<tr><td colspan="2">Carton ${I('Carton (กล่องลูกฟูก)', [
        `<b>สูตร:</b> ceil(totalWeight / maxWeight) × unitPrice`,
        `<b>Total Weight:</b> ${(qr.weight?.total || 0).toFixed(2)} kg`,
        `<b>Max Weight/carton:</b> ${CalcEngine.CALC.packing.carton_max_weight} kg`,
        `<b>จำนวน carton:</b> ${ctQty}`,
        `<b>ราคา/carton:</b> ${ctPrice}`,
        `<b>Total:</b> ${ctQty} × ${ctPrice} = <b>${money(pk.carton)}</b>`,
        REF([
          'Max weight: <code>CALC.packing.carton_max_weight = ${CalcEngine.CALC.packing.carton_max_weight}</code> kg',
          'Base price: <code>CALC.packing.carton_print_price = ${CalcEngine.CALC.packing.carton_print_price}</code> × (1 + markup ${CalcEngine.CALC.packing.carton_markup}%)',
          'เลือก Packing จากฟอร์ม: component.packing[] array',
        ]),
      ])}</td><td>${escapeHtml(compName)}</td><td>${pk._cartonCps || '-'}</td><td>Cps/carton</td>${R(money(pk._cartonUnitPrice || 0))}${R(ctQty)}${R(money(pk.carton))}</tr>`;
    }
    if (pk.pallet > 0) h += `<tr><td colspan="2">Pallet</td><td>${escapeHtml(compName)}</td><td colspan="2"></td>${R('-')}${R('-')}${R(money(pk.pallet))}</tr>`;
    const dl = estimate.delivery?.[firstQi];
    const dlName = f.delivery?.[0]?.destinationName || 'ไม่ระบุสถานที่จัดส่ง';
    const dlCost = dl?.deliveryCosts?.[0];
    h += `<tr><td colspan="3">Delivery</td><td colspan="2" style="text-align:center">${escapeHtml(dlName)}</td>${R(money(dlCost?.total || 0))}${R('1.00')}${R(money(dl?.deliveryTotal || 0))}</tr>`;
    h += totalRow('Total (Packing)', (pk.total || 0) + (dl?.deliveryTotal || 0));

    h += `</tbody></table>`;
    h += `</div>`;
  });

  // === SUMMARY SECTION (OUTSIDE component loop — renders ONCE for entire job) ===
  {
    const t = estimate.totals?.[firstQi];
    if (t) {
    h += `<div class="detail-card" style="margin-top:16px;padding:16px 20px">
      <table class="detail-table price-table" style="width:100%;font-size:12px">
      <thead><tr><th colspan="5"></th><th class="td-right">Unit Price</th><th class="td-right">Qty</th><th class="td-right">Price</th></tr></thead>
      <tbody>`;
      const materialAt = t.qty > 0 ? (t.materialTotal / t.qty).toFixed(2) : '0';
      const prodAt = t.qty > 0 ? (t.productionTotal / t.qty).toFixed(2) : '0';

      // Store base values for real-time markup recalc
      const matBase = t.materialTotal;
      const prodBase = t.productionTotal;
      const packBase = (t.packingTotal || 0) + (t.deliveryTotal || 0);
      const otherBase = (t.otherCostTotal || 0) + (t.processInfoTotal || 0) + (t.formProcessTotal || 0);
      const matMarkup = State.form._markup_material || 0;
      const prodMarkup = State.form._markup_production || 0;
      const matMarkupAmt = matBase * matMarkup / 100;
      const prodMarkupAmt = prodBase * prodMarkup / 100;
      const matAfter = matBase + matMarkupAmt;
      const prodAfter = prodBase + prodMarkupAmt;
      const subtotalAfterMarkup = matAfter + prodAfter + packBase + otherBase;
      const giftAmt = t.giftTotal || 0;
      const diffAmt = t.priceDiffTotal || 0;
      const subWithAdj = subtotalAfterMarkup + giftAmt + diffAmt;
      const taxAmt = subWithAdj * CalcEngine.CALC.tax_percent / 100;
      const totalPrice = subWithAdj + taxAmt;
      const unitPriceCps = firstQty > 0 ? totalPrice / firstQty : 0;

      // Store rendered totalPrice as source of truth for qty compare cards
      window._renderedTotalPrice = totalPrice;
      window._renderedUnitPrice = Math.round(unitPriceCps * 100) / 100;

      h += `<tr class="row-section"><td colspan="3" class="td-center">Mark Up/Down</td><td colspan="2" class="td-center">Materials</td>
        <td class="td-center" style="white-space:nowrap">
          <input type="range" id="markupMatSlider" min="-100" max="100" step="1" value="${matMarkup}" style="width:80px;vertical-align:middle;cursor:pointer;accent-color:var(--accent)" oninput="document.getElementById('markupMat').value=this.value;App.onMarkupChange()">
          <input type="number" id="markupMat" value="${matMarkup}" step="1" style="width:42px;text-align:center;border:1px solid var(--border-color);border-radius:4px;padding:2px;font-size:12px;background:var(--bg-secondary);color:var(--text-primary);margin-left:2px" onchange="document.getElementById('markupMatSlider').value=this.value;App.onMarkupChange()">%
        </td>
        <td></td><td class="td-right" id="markupMatAmt">${money(matMarkupAmt)}</td></tr>`;
      h += `<tr class="row-total"><td colspan="5" class="td-center">Subtotal Price (Materials)</td><td colspan="2" class="td-right">@${(firstQty > 0 ? (matAfter/firstQty).toFixed(2) : '0')}</td><td class="td-right td-bold" id="matAfterVal">${money(matAfter)}</td></tr>`;

      h += `<tr class="row-section"><td colspan="3" class="td-center">Mark Up/Down</td><td colspan="2" class="td-center">Production</td>
        <td class="td-center" style="white-space:nowrap">
          <input type="range" id="markupProdSlider" min="-100" max="100" step="1" value="${prodMarkup}" style="width:80px;vertical-align:middle;cursor:pointer;accent-color:var(--accent)" oninput="document.getElementById('markupProd').value=this.value;App.onMarkupChange()">
          <input type="number" id="markupProd" value="${prodMarkup}" step="1" style="width:42px;text-align:center;border:1px solid var(--border-color);border-radius:4px;padding:2px;font-size:12px;background:var(--bg-secondary);color:var(--text-primary);margin-left:2px" onchange="document.getElementById('markupProdSlider').value=this.value;App.onMarkupChange()">%
        </td>
        <td></td><td class="td-right" id="markupProdAmt">${money(prodMarkupAmt)}</td></tr>`;
      h += `<tr class="row-total"><td colspan="5" class="td-center">Subtotal Price (Production)</td><td colspan="2" class="td-right">@${(firstQty > 0 ? (prodAfter/firstQty).toFixed(2) : '0')}</td><td class="td-right td-bold" id="prodAfterVal">${money(prodAfter)}</td></tr>`;

      h += `<tr class="row-total"><td colspan="5" class="td-center td-bold">Subtotal Price</td><td colspan="2"></td><td class="td-right td-bold" id="subtotalVal">${money(subtotalAfterMarkup)}</td></tr>`;

      h += `<tr><td colspan="5" class="td-center">ค่าของขวัญลูกค้า</td><td colspan="2"></td>${R(money(giftAmt))}</tr>`;
      h += `<tr><td colspan="5" class="td-center">ส่วนต่างลูกค้า</td><td colspan="2"></td>${R(money(diffAmt))}</tr>`;

      h += `<tr class="row-total"><td colspan="5" class="td-center" style="font-size:11px">Subtotal + ค่าของขวัญ + ส่วนต่าง</td><td colspan="2"></td><td class="td-right td-bold" id="subAdjVal">${money(subWithAdj)}</td></tr>`;

      // Tax % — editable input, real-time recalc
      h += `<tr><td colspan="5" class="td-center">Tax <input type="number" id="taxPercentInput" value="${CalcEngine.CALC.tax_percent}" step="0.5" min="0" max="30" style="width:50px;text-align:center;border:1px solid var(--border);border-radius:4px;padding:2px 4px;font-size:12px;background:var(--bg-primary);color:var(--text-primary)" onchange="App.onTaxChange(parseFloat(this.value))"> %</td><td colspan="2"></td><td class="td-right" id="taxVal">${money(taxAmt)}</td></tr>`;

      h += `<tr class="row-grand"><td colspan="5" class="td-center">Total Price</td><td colspan="2"></td><td class="td-right" style="color:var(--accent);font-weight:700;font-size:16px" id="totalPriceVal">${money(totalPrice)}</td></tr>`;

      h += `<tr><td colspan="5" class="td-center td-bold">Unit Price/cps</td><td colspan="2"></td><td class="td-right td-bold" id="unitPriceVal">${unitPriceCps.toFixed(2)}</td></tr>`;

      // Exchange Rate — currency selector + rate
      h += `<tr><td colspan="4" class="td-center">Unit Price (Exchange)</td><td class="td-center"><select id="exCurrency" style="border:1px solid var(--border);border-radius:4px;padding:2px 4px;font-size:11px;background:var(--bg-primary);color:var(--text-primary)" onchange="App.onCurrencyChange(this.value)"><option value="THB" selected>THB</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="JPY">JPY</option><option value="CNY">CNY</option><option value="GBP">GBP</option></select></td><td colspan="2"></td><td class="td-right" id="unitPriceExVal"></td></tr>`;
      h += `<tr><td colspan="3" class="td-center">Exchange Rate</td><td class="td-center" id="exCurrLabel">THB</td><td class="td-center" id="exRateVal">1</td><td colspan="2"></td><td class="td-right" id="exUnitLabel" style="font-size:11px;color:var(--text-muted)"></td></tr>`;

      // Store base values for real-time recalc
      window._priceBase = { matBase, prodBase, packBase, otherBase, giftAmt, diffAmt, qty: firstQty, taxPercent: CalcEngine.CALC.tax_percent, subWithAdj };

      // Weight & Thickness — per component (loop all components)
      const wDeliv = estimate.delivery?.[firstQi];
      const totalOrderWeight = wDeliv?.totalWeight || 0;

      f.components.forEach((fc, fci) => {
        const compRes = estimate.components?.[fci]?.results?.[firstQi];
        const openWin = fc?._layout?.unfolded ? (fc._layout.unfolded.openW / 25.4).toFixed(2) : '-';
        const openLin = fc?._layout?.unfolded ? (fc._layout.unfolded.openL / 25.4).toFixed(2) : '-';
        const wPc = compRes?.weight?.perPiece || 0;

        let thkIn = '-';
        if (fc?.paper?.paper_thickness && parseFloat(fc.paper.paper_thickness) > 0) {
          thkIn = (parseFloat(fc.paper.paper_thickness) / 25.4).toFixed(5);
        } else if (fc?.paper?.paper_gram) {
          thkIn = (parseFloat(fc.paper.paper_gram) * 0.0013 / 25.4).toFixed(5);
        }

        const kwCps2 = compRes?.packingCost?.kraftwrapQtyPerPack || compRes?.packing?.kraftwrapQtyPerPack || 100;
        const weightPerPack = wPc * kwCps2;
        const compTotalWeight = wPc * firstQty;
        const fcName = escapeHtml(fc?.component_name || `Component ${fci+1}`);

        h += `<tr class="row-section" style="font-size:11px;text-align:center"><td rowspan="4" style="text-align:center;vertical-align:middle;font-weight:600">${fcName}</td><td>Weight</td><td>${wPc.toFixed(5)}</td><td>kg/1 cp.</td><td colspan="4" style="font-size:10px">Kraftwrap: กว้าง ${openWin} ยาว ${openLin}</td></tr>`;
        h += `<tr class="row-section" style="font-size:11px;text-align:center"><td>Thickness</td><td>${thkIn}</td><td>inch</td><td colspan="4" style="font-size:10px">Inner size: ${openWin} x ${openLin}</td></tr>`;
        h += `<tr class="row-section" style="font-size:11px;text-align:center"><td>Pallet size</td><td colspan="2">-</td><td colspan="4" style="font-size:10px">Net weight: ${weightPerPack.toFixed(2)} kg/pack (${kwCps2} pcs)</td></tr>`;
        h += `<tr class="row-section" style="font-size:11px;text-align:center"><td>วางสูง</td><td>-</td><td>ชั้นฯ ละ -</td><td colspan="4" style="font-size:10px">Gross weight: ${weightPerPack.toFixed(2)} kg/pack | Total: ${compTotalWeight.toFixed(2)} kg</td></tr>`;
      });

      h += `<tr><td colspan="8" style="border:none;padding:4px 10px;font-size:11px;color:var(--text-muted)">${bahtText(t.finalPrice)}</td></tr>`;

      h += `</tbody></table>`;
      h += `</div>`;
    }
  }

  // === Packing Detail + Diagram (matching legacy) ===
  f.components.forEach((comp, ci) => {
    const pk2 = estimate.components?.[ci]?.results?.[0]?.packingCost || {};
    const kwCps = pk2.kraftwrapQtyPerPack || 100;
    const hasPacking = comp.packing?.some(p => (p.name||'').toLowerCase().includes('kraftwrap'));
    if (!hasPacking && !pk2.kraftwrap && pk2.kraftwrap !== 0) return;

    const compName2 = comp.component_name || `Component ${ci+1}`;
    const sz = comp.packaging_size || {};
    // Packing Size = Fold Size (W × L of box, no bleed) — matching legacy
    const foldW = parseFloat(sz.width) || 0;
    const foldL = parseFloat(sz.length) || 0;
    const baseWin = foldW > 0 ? (foldW / 25.4).toFixed(2) : '-';
    const baseLin = foldL > 0 ? (foldL / 25.4).toFixed(2) : '-';
    const numW = parseInt(comp._pk_numW) || 1;
    const numL = parseInt(comp._pk_numL) || 1;
    const packSizeW = foldW > 0 ? (foldW * numW / 25.4).toFixed(2) : baseWin;
    const packSizeL = foldL > 0 ? (foldL * numL / 25.4).toFixed(2) : baseLin;

    // Canvas for packing diagram
    const canvasId = `packingCanvas_${ci}`;

    // Determine which packing types are active
    const pkTypes = comp.packing || [];
    const hasPB = pkTypes.some(p => (p.name||'').toLowerCase().includes('paperband') || (p.name||'').toLowerCase().includes('paper band'));
    const hasKW = pkTypes.some(p => (p.name||'').toLowerCase().includes('kraftwrap'));
    const hasCT = pkTypes.some(p => (p.name||'').toLowerCase().includes('carton'));
    const hasPL = pkTypes.some(p => (p.name||'').toLowerCase().includes('pallet'));

    // === Carton + Pallet auto-calculation ===
    const totalQty = parseInt(f.qty?.[0]) || 0;
    const qtyPerPack = parseInt(kwCps) || 100;
    const qtyPerCarton = parseInt(comp.qty_per_carton) || 0;
    // Auto: packs/carton = qty_per_carton / qty_per_pack (ถ้า user ไม่กำหนด)
    const packsPerCarton = comp.packs_per_carton
      || (qtyPerCarton && qtyPerPack ? Math.round(qtyPerCarton / qtyPerPack) : 0);
    // Estimate carton physical size (NW × NL × NH packs arrangement)
    // Default: 1 column wide, packs stacked in length, ~3-6 layers high
    let cartonPacksW = 1, cartonPacksL = 1, cartonPacksH = packsPerCarton || 1;
    if (packsPerCarton >= 4) {
      cartonPacksW = 1; cartonPacksL = 2; cartonPacksH = Math.ceil(packsPerCarton / 2);
    }
    if (packsPerCarton >= 12) {
      cartonPacksW = 2; cartonPacksL = 2; cartonPacksH = Math.ceil(packsPerCarton / 4);
    }
    // Pallet: estimate cartons (default 4×4 = 16 cartons per pallet, 1 layer)
    const cartonsPerPallet = comp.cartons_per_pallet || 16;
    const totalCartons = qtyPerCarton > 0 ? Math.ceil(totalQty / qtyPerCarton) : 0;
    const totalPallets = totalCartons > 0 ? Math.ceil(totalCartons / cartonsPerPallet) : 0;

    // === View mode (per-component state) ===
    if (!State._packingViewMode) State._packingViewMode = {};
    const viewMode = State._packingViewMode[ci] || 'pack'; // pack | carton | pallet

    const inputBox = 'style="width:50px;text-align:center;border:1px solid var(--border-color);border-radius:6px;padding:5px 4px;font-size:13px;font-weight:700;background:var(--bg-input);color:var(--text-primary)"';

    // Tab button helper
    const tabBtn = (mode, label, icon, enabled) => {
      const active = viewMode === mode;
      const disabled = !enabled;
      const bg = active ? 'rgba(255,255,255,0.25)' : 'transparent';
      const op = disabled ? '0.35' : '1';
      const cursor = disabled ? 'not-allowed' : 'pointer';
      return `<button onclick="${disabled ? '' : `App.setPackingView(${ci}, '${mode}')`}" style="background:${bg};border:1.5px solid ${active?'#fff':'rgba(255,255,255,0.3)'};color:#fff;padding:5px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:${cursor};opacity:${op};transition:all 0.2s;display:inline-flex;align-items:center;gap:4px"><i class="fas fa-${icon}"></i>${label}</button>`;
    };

    h += `<div class="detail-card" style="margin-top:16px;padding:0;overflow:hidden">
      <!-- Header bar -->
      <div style="background:linear-gradient(135deg,var(--primary-dark),var(--primary));padding:12px 20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <i class="fas fa-box-open" style="color:#fff;font-size:16px"></i>
        <span style="color:#fff;font-size:14px;font-weight:700">Component ${ci+1}: ${escapeHtml(compName2)}</span>
        <span style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:500">Packing</span>
        <div style="margin-left:auto;display:flex;gap:6px;align-items:center">
          ${tabBtn('pack', 'Pack', 'scroll', hasKW || hasPB)}
          ${tabBtn('carton', 'Carton', 'box', hasCT)}
          ${tabBtn('pallet', 'Pallet', 'pallet', hasPL)}
        </div>
      </div>
      <!-- Content: info left + 3D diagram right -->
      <div style="display:flex;min-height:380px">
        <!-- Left: Info Panel (เปลี่ยนตาม viewMode) -->
        <div style="flex-shrink:0;padding:20px 24px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;gap:14px;min-width:200px;max-width:280px">
          ${viewMode === 'pack' ? `
            <div style="font-size:13px;font-weight:700;color:var(--accent)"><i class="fas fa-scroll" style="margin-right:6px"></i>Kraftwrap</div>
            <div style="display:flex;flex-direction:column;gap:10px">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                <span style="font-size:12px;color:var(--text-secondary)">จำนวนด้านกว้าง</span>
                <input type="number" id="pkNumW_${ci}" value="${numW}" min="1" max="2" ${inputBox} onchange="App.onPackingNumChange(${ci})">
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                <span style="font-size:12px;color:var(--text-secondary)">จำนวนด้านยาว</span>
                <input type="number" id="pkNumL_${ci}" value="${numL}" min="1" max="2" ${inputBox} onchange="App.onPackingNumChange(${ci})">
              </div>
            </div>
            <div style="border-top:1px solid var(--border-color);padding-top:12px">
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Pack Size</div>
              <div id="pkSizeLabel_${ci}" style="font-size:18px;font-weight:800;color:var(--primary)">${packSizeW}" × ${packSizeL}"</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">จำนวน/pack</div>
              <div style="display:flex;align-items:center;gap:6px">
                <input type="number" id="pkCps_${ci}" value="${kwCps}" min="1" ${inputBox} style="width:75px">
                <span style="font-size:12px;color:var(--text-muted)">ชิ้น</span>
              </div>
            </div>
          ` : viewMode === 'carton' ? `
            <div style="font-size:18px;font-weight:700;color:#a0703e;margin-bottom:4px"><i class="fas fa-box" style="margin-right:8px"></i>Carton</div>
            <div style="background:var(--bg-tertiary);border-radius:10px;padding:14px 16px;font-size:14px;line-height:2">
              <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="color:var(--text-muted)">Pack ต่อ carton:</span><b style="font-size:16px;color:var(--text-primary)">${packsPerCarton || '?'}</b></div>
              <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="color:var(--text-muted)">ชิ้นต่อ carton:</span><b style="font-size:16px;color:var(--text-primary)">${qtyPerCarton.toLocaleString() || '?'}</b></div>
              <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="color:var(--text-muted)">Layout (W×L×H):</span><b style="font-size:16px;color:var(--text-primary)">${cartonPacksW}×${cartonPacksL}×${cartonPacksH}</b></div>
            </div>
            <div style="border-top:1px solid var(--border-color);padding-top:14px;margin-top:6px">
              <div style="font-size:13px;color:var(--text-muted);margin-bottom:6px;font-weight:600">Total cartons สำหรับยอดนี้</div>
              <div style="font-size:36px;font-weight:800;color:#a0703e;line-height:1">${totalCartons.toLocaleString()}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:6px">= ${totalQty.toLocaleString()} ÷ ${qtyPerCarton.toLocaleString() || '?'}</div>
            </div>
            ${packsPerCarton && qtyPerPack && (packsPerCarton * qtyPerPack !== qtyPerCarton) ? `
              <div style="background:rgba(220,38,38,0.1);border:1px solid #dc2626;border-radius:8px;padding:10px 12px;font-size:12px;color:#dc2626;font-weight:600">
                ⚠️ ${packsPerCarton}×${qtyPerPack} = ${packsPerCarton*qtyPerPack} ≠ ${qtyPerCarton}
                <div style="font-size:11px;font-weight:400;margin-top:4px">spec ระบุไม่ตรงกับการคำนวณ</div>
              </div>
            ` : ''}
          ` : `
            <div style="font-size:18px;font-weight:700;color:#876240;margin-bottom:4px"><i class="fas fa-pallet" style="margin-right:8px"></i>Pallet</div>
            <div style="background:var(--bg-tertiary);border-radius:10px;padding:14px 16px;font-size:14px;line-height:2">
              <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="color:var(--text-muted)">Cartons/pallet:</span><b style="font-size:16px;color:var(--text-primary)">${cartonsPerPallet}</b></div>
              <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="color:var(--text-muted)">Total cartons:</span><b style="font-size:16px;color:var(--text-primary)">${totalCartons.toLocaleString()}</b></div>
              <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="color:var(--text-muted)">Pack/pallet:</span><b style="font-size:16px;color:var(--text-primary)">${(cartonsPerPallet*packsPerCarton).toLocaleString() || '?'}</b></div>
              <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="color:var(--text-muted)">ชิ้น/pallet:</span><b style="font-size:16px;color:var(--text-primary)">${(cartonsPerPallet*qtyPerCarton).toLocaleString() || '?'}</b></div>
            </div>
            <div style="border-top:1px solid var(--border-color);padding-top:14px;margin-top:6px">
              <div style="font-size:13px;color:var(--text-muted);margin-bottom:6px;font-weight:600">Pallets ทั้งหมด</div>
              <div style="font-size:36px;font-weight:800;color:#876240;line-height:1">${totalPallets}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:6px">= ${totalCartons.toLocaleString()} ÷ ${cartonsPerPallet}</div>
            </div>
          `}
        </div>
        <!-- Right: Packing 3D Diagram -->
        <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:12px;position:relative;min-height:400px">
          <canvas id="${canvasId}" style="max-width:100%;max-height:100%;cursor:pointer" onclick="App.showPackingPopup('${canvasId}')" title="คลิกเพื่อดูภาพใหญ่"></canvas>
        </div>
      </div>
    </div>`;

    // Draw packing diagram after DOM render
    requestAnimationFrame(() => {
      drawPackingDiagram(canvasId, parseFloat(packSizeW) || 5, parseFloat(packSizeL) || 5, numW, numL, kwCps, {
        hasPB, hasKW, hasCT, hasPL,
        viewMode,
        packsPerCarton,
        qtyPerCarton,
        cartonPacksW, cartonPacksL, cartonPacksH,
        cartonsPerPallet, totalCartons, totalPallets, totalQty,
      });
    });
  });

  // === Remark ===
  const remarkVal = State.form._priceRemark || '';
  h += `<div class="detail-card" style="margin-top:12px;padding:14px 20px">
    <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:6px"><i class="fas fa-sticky-note" style="color:var(--accent);margin-right:6px"></i>Remark</div>
    <textarea id="priceRemark" placeholder="ใส่หมายเหตุเพิ่มเติม..." style="width:100%;min-height:60px;border:1px solid var(--border-color);border-radius:8px;padding:10px 12px;font-size:13px;resize:vertical;background:var(--bg-secondary);color:var(--text-primary);font-family:inherit;line-height:1.5" oninput="if(window.State)State.form._priceRemark=this.value">${escapeHtml(remarkVal)}</textarea>
  </div>`;

  // === Quantity Price Comparison Tool — Card Grid (all at once, real-time) ===
  const currentQty = parseInt(f.qty[0]) || 0;
  const compareQtys = [1000, 3000, 5000, 10000, 20000, 50000];
  if (currentQty > 0 && !compareQtys.includes(currentQty)) compareQtys.push(currentQty);
  compareQtys.sort((a, b) => a - b);

  // Pre-calculate and store for real-time access
  // For "ปัจจุบัน" → use rendered totalPrice (source of truth, matches summary above)
  window._qtyCompareCache = {};
  const curRenderedTotal_n = window._renderedTotalPrice || 0;
  const curRenderedUnit_n = window._renderedUnitPrice || (currentQty > 0 ? curRenderedTotal_n / currentQty : 0);
  if (curRenderedTotal_n > 0) {
    window._qtyCompareCache[currentQty] = {
      total: Math.round(curRenderedTotal_n * 100) / 100,
      unitPrice: Math.round(curRenderedUnit_n * 100) / 100,
    };
  }

  const qtyCards = compareQtys.map(q => {
    if (q === currentQty && curRenderedTotal_n > 0) {
      return {
        qty: q,
        total: Math.round(curRenderedTotal_n * 100) / 100,
        unitPrice: Math.round(curRenderedUnit_n * 100) / 100,
        isCurrent: true,
      };
    }
    const origQty = [...f.qty];
    f.qty = [String(q)];
    let total = 0, unitPrice = 0;
    try {
      const est = CalcEngine.calcFullEstimate(f);
      const t0 = est.totals?.[0] || {};
      // Same formula as rendered summary section
      const sub = (t0.materialTotal||0) + (t0.productionTotal||0) + (t0.packingTotal||0) + (t0.deliveryTotal||0) + (t0.otherCostTotal||0) + (t0.processInfoTotal||0) + (t0.formProcessTotal||0) + (t0.giftTotal||0) + (t0.priceDiffTotal||0);
      const tax = sub * CalcEngine.CALC.tax_percent / 100;
      total = sub + tax;
      unitPrice = q > 0 ? total / q : 0;
    } catch(e) {}
    f.qty = origQty;
    window._qtyCompareCache[q] = { total: Math.round(total * 100) / 100, unitPrice: Math.round(unitPrice * 100) / 100 };
    return { qty: q, total: Math.round(total * 100) / 100, unitPrice: Math.round(unitPrice * 100) / 100, isCurrent: q === currentQty };
  });
  const minUnit = Math.min(...qtyCards.map(c => c.unitPrice).filter(u => u > 0));

  function buildQtyCard(c, minU) {
    const isBest = c.unitPrice === minU && c.unitPrice > 0;
    const isCur = c.isCurrent;
    const border = isCur ? '2px solid #7c3aed' : isBest ? '2px solid #16a34a' : '1px solid var(--border-color)';
    const badge = isCur ? '<div style="position:absolute;top:-1px;right:-1px;background:#7c3aed;color:#fff;font-size:10px;padding:2px 10px;border-radius:0 10px 0 8px;font-weight:700">ปัจจุบัน</div>'
      : isBest ? '<div style="position:absolute;top:-1px;right:-1px;background:#16a34a;color:#fff;font-size:10px;padding:2px 10px;border-radius:0 10px 0 8px;font-weight:700">ถูกสุด/ชิ้น</div>' : '';
    const delBtn = !isCur ? `<button onclick="event.stopPropagation();App.qtyCompareRemove(this.closest('[data-qty]'))" style="position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;border:none;background:rgba(0,0,0,0.15);color:var(--text-muted);cursor:pointer;font-size:9px;line-height:16px;padding:0;display:none" class="qty-del-btn" title="ลบ">&times;</button>` : '';
    return `<div data-qty="${c.qty}" style="position:relative;background:var(--bg-tertiary);border:${border};border-radius:12px;padding:16px 14px 14px;text-align:center;cursor:pointer;transition:all 0.15s;min-width:0" onclick="App.qtyCompareSelect(${c.qty})" onmouseenter="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(91,45,142,0.12)';var d=this.querySelector('.qty-del-btn');if(d)d.style.display='block'" onmouseleave="this.style.transform='';this.style.boxShadow='';var d=this.querySelector('.qty-del-btn');if(d)d.style.display='none'">
      ${badge}${delBtn}
      <div style="font-size:22px;font-weight:800;color:var(--accent)">${c.qty.toLocaleString()}</div>
      <div style="font-size:11px;color:var(--text-muted)">ชิ้น</div>
      <div style="border-top:1px solid var(--border-color);margin:8px -4px 0;padding-top:8px">
        <div style="font-size:11px;color:var(--text-muted)">รวม</div>
        <div style="font-size:15px;font-weight:700;color:var(--text-primary)">${c.total > 0 ? c.total.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : '-'}</div>
      </div>
      <div style="margin-top:6px">
        <div style="font-size:11px;color:var(--text-muted)">ต่อชิ้น</div>
        <div style="font-size:18px;font-weight:800;color:${isBest ? '#16a34a' : 'var(--primary)'}">${c.unitPrice > 0 ? c.unitPrice.toFixed(2) : '-'}</div>
      </div>
    </div>`;
  }

  h += `<div class="detail-card" style="margin-top:16px;border:2px solid var(--accent);border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#5b2d8e,#7b4db8);padding:10px 20px;color:#fff;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div>
        <h5 style="margin:0;font-size:14px"><i class="fas fa-tags"></i> เปรียบเทียบราคาตามจำนวนสั่ง</h5>
        <div style="font-size:10px;opacity:0.7;margin-top:2px">คลิกเพื่อดูรายละเอียด — hover แล้วกด × เพื่อลบ</div>
      </div>
      <div style="display:flex;align-items:center;gap:0;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.15)">
        <input id="qtyCompareCustom" placeholder="ใส่จำนวน" style="min-width:70px;max-width:120px;flex:1;font-size:13px;padding:8px 14px;border:none;background:#fff;color:#333;outline:none;font-weight:600;letter-spacing:0.5px" onkeydown="if(event.key==='Enter'){App.qtyCompareAdd(parseInt(this.value));this.value=''}">
        <button onclick="App.qtyCompareAdd(parseInt(document.getElementById('qtyCompareCustom').value));document.getElementById('qtyCompareCustom').value=''" style="padding:8px 18px;border:none;background:#f0d080;color:#5b2d8e;cursor:pointer;font-size:13px;font-weight:700;white-space:nowrap;transition:background 0.15s" onmouseenter="this.style.background='#f5e0a0'" onmouseleave="this.style.background='#f0d080'"><i class="fas fa-plus" style="margin-right:4px"></i>เพิ่ม</button>
      </div>
    </div>
    <div id="qtyCompareGrid" style="padding:14px 16px">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px">
        ${qtyCards.map(c => buildQtyCard(c, minUnit)).join('')}
      </div>
    </div>
  </div>`;

  // Summary PDF button
  h += `<div style="text-align:center;margin:12px 0"><button class="btn btn-secondary" onclick="App.generateSummaryPDF()" style="font-size:12px"><i class="fas fa-file-pdf"></i> Summary PDF</button></div>`;

  // Footer label removed per user request

  $('detailContent').innerHTML = h;
  showView('viewDetail');
  setTopBar('Price Estimation', 'ผลคำนวณราคา');
}

// Real-time Mark Up/Down recalculate
function onMarkupChange() {
  const b = window._priceBase;
  if (!b) return;
  const matPct = parseFloat(document.getElementById('markupMat')?.value) || 0;
  const prodPct = parseFloat(document.getElementById('markupProd')?.value) || 0;

  // Save to form state
  State.form._markup_material = matPct;
  State.form._markup_production = prodPct;

  const matMarkupAmt = b.matBase * matPct / 100;
  const prodMarkupAmt = b.prodBase * prodPct / 100;
  const matAfter = b.matBase + matMarkupAmt;
  const prodAfter = b.prodBase + prodMarkupAmt;
  const subtotal = matAfter + prodAfter + b.packBase + b.otherBase;
  const subAdj = subtotal + b.giftAmt + b.diffAmt;
  const tax = subAdj * b.taxPercent / 100;
  const total = subAdj + tax;
  const unit = b.qty > 0 ? total / b.qty : 0;

  const m = v => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const _s = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  _s('markupMatAmt', m(matMarkupAmt));
  _s('matAfterVal', m(matAfter));
  _s('markupProdAmt', m(prodMarkupAmt));
  _s('prodAfterVal', m(prodAfter));
  _s('subtotalVal', m(subtotal));
  _s('subAdjVal', m(subAdj));
  _s('taxVal', m(tax));
  _s('totalPriceVal', m(total));
  _s('unitPriceVal', unit.toFixed(2));
  const exRate = window._exchangeRate || 1;
  if (exRate !== 1) _s('unitPriceExVal', (unit / exRate).toFixed(4));
  if (b) b.subWithAdj = subAdj;
}

// Kraftwrap price/pack change — real-time
// Packing จำนวนด้าน change → update size label + redraw diagram
/**
 * Show packing diagram in fullscreen popup lightbox
 */
function showPackingPopup(canvasId) {
  const src = document.getElementById(canvasId);
  if (!src) return;

  // Find ci from canvas id "packingCanvas_X"
  const ciMatch = canvasId.match(/packingCanvas_(\d+)/);
  if (!ciMatch) return;
  const ci = parseInt(ciMatch[1]);

  // Remove existing popup
  const old = document.getElementById('packingPopup');
  if (old) old.remove();

  // === Get current params for redraw ===
  const comp = State.form?.components?.[ci];
  if (!comp) return;
  const sz = comp.packaging_size || {};
  const foldW = parseFloat(sz.width) || 0;
  const foldL = parseFloat(sz.length) || 0;
  const numW = parseInt(comp._pk_numW) || 1;
  const numL = parseInt(comp._pk_numL) || 1;
  const baseW = foldW > 0 ? (foldW / 25.4) : 5;
  const baseL = foldL > 0 ? (foldL / 25.4) : 5;
  const packSizeW = foldW > 0 ? (foldW * numW / 25.4) : baseW;
  const packSizeL = foldL > 0 ? (foldL * numL / 25.4) : baseL;
  const pkT = comp.packing || [];
  const cpsVal = parseInt(document.getElementById(`pkCps_${ci}`)?.value) || 100;
  const viewMode = (State._packingViewMode && State._packingViewMode[ci]) || 'pack';

  // Auto-calc carton/pallet info (same as renderPriceView)
  const totalQty = parseInt(State.form?.qty?.[0]) || 0;
  const qtyPerPack = cpsVal;
  const qtyPerCarton = parseInt(comp.qty_per_carton) || 0;
  const packsPerCarton = comp.packs_per_carton
    || (qtyPerCarton && qtyPerPack ? Math.round(qtyPerCarton / qtyPerPack) : 0);
  let cartonPacksW = 1, cartonPacksL = 1, cartonPacksH = packsPerCarton || 1;
  if (packsPerCarton >= 4) { cartonPacksW = 1; cartonPacksL = 2; cartonPacksH = Math.ceil(packsPerCarton / 2); }
  if (packsPerCarton >= 12) { cartonPacksW = 2; cartonPacksL = 2; cartonPacksH = Math.ceil(packsPerCarton / 4); }
  const cartonsPerPallet = comp.cartons_per_pallet || 16;
  const totalCartons = qtyPerCarton > 0 ? Math.ceil(totalQty / qtyPerCarton) : 0;
  const totalPallets = totalCartons > 0 ? Math.ceil(totalCartons / cartonsPerPallet) : 0;

  const flags = {
    hasPB: pkT.some(p => (p.name||'').toLowerCase().includes('paperband') || (p.name||'').toLowerCase().includes('paper band')),
    hasKW: pkT.some(p => (p.name||'').toLowerCase().includes('kraftwrap')),
    hasCT: pkT.some(p => (p.name||'').toLowerCase().includes('carton')),
    hasPL: pkT.some(p => (p.name||'').toLowerCase().includes('pallet')),
    viewMode, packsPerCarton, qtyPerCarton,
    cartonPacksW, cartonPacksL, cartonPacksH,
    cartonsPerPallet, totalCartons, totalPallets, totalQty,
  };

  // === Create popup overlay ===
  const overlay = document.createElement('div');
  overlay.id = 'packingPopup';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);animation:fadeIn 0.2s ease';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '<i class="fas fa-times"></i>';
  closeBtn.style.cssText = 'position:absolute;top:20px;right:20px;width:48px;height:48px;border-radius:50%;border:2px solid rgba(255,255,255,0.3);background:rgba(0,0,0,0.5);color:#fff;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;z-index:10';
  closeBtn.onmouseenter = () => { closeBtn.style.background = 'rgba(220,50,50,0.8)'; closeBtn.style.borderColor = '#fff'; };
  closeBtn.onmouseleave = () => { closeBtn.style.background = 'rgba(0,0,0,0.5)'; closeBtn.style.borderColor = 'rgba(255,255,255,0.3)'; };
  closeBtn.onclick = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };

  // === Container ===
  const container = document.createElement('div');
  container.style.cssText = 'position:relative;background:#fff;border-radius:18px;box-shadow:0 25px 80px rgba(0,0,0,0.6);padding:24px;display:flex;flex-direction:column;align-items:center;gap:12px';

  // Title
  const title = document.createElement('div');
  title.style.cssText = 'font-size:18px;font-weight:700;color:#2d1b4e;display:flex;align-items:center;gap:8px';
  const viewLabels = { pack: '📜 Pack View', carton: '📦 Carton View', pallet: '🪵 Pallet View' };
  title.innerHTML = `${viewLabels[viewMode] || '📦 3D View'} <span style="font-size:13px;color:#888;font-weight:400">— Interactive (drag เพื่อหมุน · scroll เพื่อ zoom)</span>`;

  // Big interactive canvas
  const bigCanvas = document.createElement('canvas');
  bigCanvas.id = 'packingPopupCanvas';
  bigCanvas.style.cssText = 'cursor:grab;border-radius:12px;background:linear-gradient(135deg,#fafafa,#f0f0f5);max-width:min(900px,90vw);max-height:min(640px,75vh);user-select:none';

  // Control hint bar
  const hint = document.createElement('div');
  hint.style.cssText = 'display:flex;gap:16px;font-size:12px;color:#666;margin-top:4px;flex-wrap:wrap;justify-content:center';
  hint.innerHTML = `
    <span><i class="fas fa-mouse-pointer"></i> ลากเพื่อหมุน</span>
    <span><i class="fas fa-search-plus"></i> Scroll = Zoom</span>
    <span><i class="fas fa-redo"></i> ดับเบิลคลิก = Reset</span>
    <span><i class="fas fa-keyboard"></i> ESC = ปิด</span>
  `;

  container.appendChild(title);
  container.appendChild(bigCanvas);
  container.appendChild(hint);
  overlay.appendChild(closeBtn);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  // === Interactive state ===
  // viewState: rotation (radian), zoom factor
  const viewState = {
    rotation: Math.PI / 6,  // initial Y rotation (30°)
    tilt: Math.PI / 6,      // initial X tilt (30°)
    zoom: 1.0,
    minZoom: 0.4,
    maxZoom: 4.0,
  };

  function redraw() {
    drawPackingDiagram('packingPopupCanvas',
      packSizeW || 5, packSizeL || 5,
      numW, numL, cpsVal,
      { ...flags, _interactive: true, _rotation: viewState.rotation, _tilt: viewState.tilt, _zoom: viewState.zoom, _bigCanvas: true }
    );
  }
  // Initial draw
  requestAnimationFrame(redraw);

  // === Mouse drag rotate ===
  let dragging = false, lastX = 0, lastY = 0;
  bigCanvas.addEventListener('mousedown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    bigCanvas.style.cursor = 'grabbing';
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    viewState.rotation += dx * 0.01;
    viewState.tilt = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, viewState.tilt + dy * 0.005));
    redraw();
  });
  window.addEventListener('mouseup', () => {
    if (dragging) { dragging = false; bigCanvas.style.cursor = 'grab'; }
  });

  // === Touch support (mobile) ===
  bigCanvas.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    dragging = true;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
    e.preventDefault();
  }, { passive: false });
  bigCanvas.addEventListener('touchmove', (e) => {
    if (!dragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastX;
    const dy = e.touches[0].clientY - lastY;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
    viewState.rotation += dx * 0.01;
    viewState.tilt = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, viewState.tilt + dy * 0.005));
    redraw();
    e.preventDefault();
  }, { passive: false });
  bigCanvas.addEventListener('touchend', () => { dragging = false; });

  // === Scroll zoom ===
  bigCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    viewState.zoom = Math.max(viewState.minZoom, Math.min(viewState.maxZoom, viewState.zoom * delta));
    redraw();
  }, { passive: false });

  // === Double-click reset ===
  bigCanvas.addEventListener('dblclick', () => {
    viewState.rotation = Math.PI / 6;
    viewState.tilt = Math.PI / 6;
    viewState.zoom = 1.0;
    redraw();
  });

  // ESC key
  const onKey = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    }
  };
  document.addEventListener('keydown', onKey);
}

function onPackingNumChange(ci) {
  const nwEl = document.getElementById(`pkNumW_${ci}`);
  const nlEl = document.getElementById(`pkNumL_${ci}`);
  if (!nwEl || !nlEl) return;
  const nw = parseInt(nwEl.value) || 1;
  const nl = parseInt(nlEl.value) || 1;

  // Save to component
  if (State.form?.components?.[ci]) {
    State.form.components[ci]._pk_numW = nw;
    State.form.components[ci]._pk_numL = nl;
  }

  // Update Packing Size label (use Fold Size = box W×L, not Open Size)
  const comp = State.form?.components?.[ci];
  const foldW = parseFloat(comp?.packaging_size?.width) || 0;
  const foldL = parseFloat(comp?.packaging_size?.length) || 0;
  const psW = foldW > 0 ? (foldW * nw / 25.4).toFixed(2) : '-';
  const psL = foldL > 0 ? (foldL * nl / 25.4).toFixed(2) : '-';
  const sizeLabel = document.getElementById(`pkSizeLabel_${ci}`);
  if (sizeLabel) sizeLabel.innerHTML = `<b>${psW}" × ${psL}"</b>`;

  // Redraw diagram with flags from component packing data
  const cpsVal = parseInt(document.getElementById(`pkCps_${ci}`)?.value) || 100;
  const pkT = comp?.packing || [];
  const flags = {
    hasPB: pkT.some(p => (p.name||'').toLowerCase().includes('paperband') || (p.name||'').toLowerCase().includes('paper band')),
    hasKW: pkT.some(p => (p.name||'').toLowerCase().includes('kraftwrap')),
    hasCT: pkT.some(p => (p.name||'').toLowerCase().includes('carton')),
    hasPL: pkT.some(p => (p.name||'').toLowerCase().includes('pallet')),
  };
  drawPackingDiagram(`packingCanvas_${ci}`, parseFloat(psW) || 5, parseFloat(psL) || 5, nw, nl, cpsVal, flags);
}

/**
 * Draw 3D Isometric Packing Diagram — shows individual boxes stacked in layers
 * wrapped in kraftwrap. Realtime update on numW/numL/cps change.
 */
// === Set packing view mode (Pack/Carton/Pallet tab switch) ===
function setPackingView(ci, mode) {
  if (!State._packingViewMode) State._packingViewMode = {};
  State._packingViewMode[ci] = mode;
  // Re-render price view (use existing _doCalculatePrice which renders the price section)
  if (typeof _doCalculatePrice === 'function') {
    try {
      _doCalculatePrice();
    } catch (e) {
      console.error('[setPackingView] re-render failed:', e);
    }
  }
}

function drawPackingDiagram(canvasId, wIn, lIn, numW, numL, cps, flags) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const {
    hasPB, hasKW, hasCT, hasPL,
    viewMode = 'pack',
    packsPerCarton = 0,
    qtyPerCarton = 0,
    cartonPacksW = 1, cartonPacksL = 1, cartonPacksH = 1,
    cartonsPerPallet = 16,
    totalCartons = 0, totalPallets = 0,
    _interactive = false,
    _rotation = Math.PI / 6,  // Y rotation
    _tilt = Math.PI / 6,      // X tilt
    _zoom = 1.0,
    _bigCanvas = false,
  } = flags || {};

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const T = {
    boxFront: isDark ? '#5838a8' : '#ddd0f0',
    boxTop: isDark ? '#7050c0' : '#eee6fa',
    boxSide: isDark ? '#453088' : '#c8b8e0',
    boxEdge: isDark ? 'rgba(140,100,220,0.3)' : 'rgba(91,45,142,0.18)',
    kraftFront: isDark ? 'rgba(190,155,85,0.18)' : 'rgba(210,185,130,0.15)',
    kraftTop: isDark ? 'rgba(210,175,100,0.14)' : 'rgba(230,210,160,0.14)',
    kraftSide: isDark ? 'rgba(160,125,65,0.20)' : 'rgba(195,165,100,0.17)',
    kraftEdge: isDark ? 'rgba(200,160,80,0.20)' : 'rgba(170,130,60,0.14)',
    kraftLine: isDark ? '#e0c070' : '#c0a040',
    pbColor: isDark ? 'rgba(80,180,220,0.35)' : 'rgba(60,150,200,0.25)',
    pbEdge: isDark ? 'rgba(80,180,220,0.6)' : 'rgba(40,120,180,0.4)',
    ctFront: isDark ? 'rgba(160,120,60,0.25)' : 'rgba(200,170,110,0.22)',
    ctTop: isDark ? 'rgba(180,140,70,0.20)' : 'rgba(220,195,140,0.20)',
    ctSide: isDark ? 'rgba(140,100,45,0.28)' : 'rgba(180,150,90,0.25)',
    ctEdge: isDark ? 'rgba(180,140,70,0.4)' : 'rgba(160,120,60,0.3)',
    plTop: isDark ? '#5a4030' : '#c8a878',
    plFront: isDark ? '#4a3525' : '#b89868',
    plSide: isDark ? '#3a2a1a' : '#a88858',
    plEdge: isDark ? '#7a6040' : '#987848',
    dimLine: isDark ? '#c0a8e0' : '#8878a8',
    dimText: isDark ? '#ffffff' : '#3a1f5e',
    labelBg: isDark ? 'rgba(55,30,95,0.92)' : 'rgba(255,255,255,0.94)',
    labelText: isDark ? '#ffffff' : '#2d1b4e',
    shadow: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(91,45,142,0.10)',
  };

  const topD = parseFloat(lIn) || 5, leftD = parseFloat(wIn) || 5;
  const nw = numW || 1, nl = numL || 1;
  const pcs = cps || 100;
  const layers = Math.min(Math.max(Math.ceil(pcs / Math.max(nw * nl, 1)), 1), 12);

  // === Canvas dimensions (big mode for popup) ===
  const W = _bigCanvas ? 880 : 600;
  const H = _bigCanvas ? 600 : 440;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  // === Branch by viewMode (Pack / Carton / Pallet) ===
  if (viewMode === 'carton' || viewMode === 'pallet') {
    drawNestedPackingView(ctx, W, H, T, isDark, {
      viewMode, topD, leftD, packsPerCarton, qtyPerCarton,
      cartonPacksW, cartonPacksL, cartonPacksH,
      cartonsPerPallet, totalCartons, totalPallets,
      _interactive, _rotation, _tilt, _zoom, _bigCanvas,
    });
    return;
  }

  // === Default: Pack view (existing behavior — single pack with kraftwrap/paperband/carton/pallet wrapping) ===
  // Interactive mode: use _rotation/_tilt for projection
  const cosA = _interactive ? Math.cos(_tilt) : Math.cos(Math.PI / 6);
  const sinA = _interactive ? Math.sin(_tilt) : Math.sin(Math.PI / 6);
  const cosR_p = _interactive ? Math.cos(_rotation) : 1;
  const sinR_p = _interactive ? Math.sin(_rotation) : 0;
  const zoomFactor_p = _interactive ? _zoom : 1.0;
  const baseScale = _bigCanvas ? 240 : 160;
  const maxD = Math.max(topD * nl, leftD * nw, 3);
  const sc = Math.min(baseScale / maxD, 20) * zoomFactor_p;
  const bxW = topD * sc, bxD = leftD * sc * 0.5;
  const bxH = Math.min(bxW * 0.06, 6);
  const stackW = bxW * nl, stackD = bxD * nw, stackH = bxH * layers;

  // Offsets for each layer (bottom to top): Pallet → Boxes+PB+KW → Carton
  const plH = hasPL ? 12 * zoomFactor_p : 0;  // pallet height
  const ctP = hasCT ? 8 * zoomFactor_p : 0;   // carton padding
  const totalH = plH + stackH + (hasCT ? ctP * 2 : 0);
  // Center diagram: account for isometric projection shift (right side wider than left)
  const isoShiftX = (stackW - stackD) * cosA * 0.5;
  const ox = W * 0.5 - isoShiftX * 0.3, oy = H * 0.68 + totalH * 0.15;

  // Iso projection with optional Y-rotation around stack center
  const cxP = stackW * 0.5, cyP = stackD * 0.5;
  const iso = (x, y, z) => {
    let dx = x - cxP, dy = y - cyP;
    if (_interactive) {
      const rx = dx * cosR_p - dy * sinR_p;
      const ry = dx * sinR_p + dy * cosR_p;
      dx = rx; dy = ry;
    }
    const wx = dx + cxP, wy = dy + cyP;
    return [ox + (wx - wy) * cosA, oy - z - (wx + wy) * sinA];
  };
  const poly = (pts, fill, stroke, lw) => {
    ctx.beginPath(); ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(...pts[i]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  };
  const shell = (w, d, h, oX, oY, oZ, faces) => {
    const c = {};
    [[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]].forEach(([a,b,e]) => {
      c[`${a}${b}${e}`] = iso(oX + a * w, oY + b * d, oZ + e * h);
    });
    poly([c['010'], c['110'], c['111'], c['011']], faces.side, faces.edge, 1);
    poly([c['000'], c['010'], c['011'], c['001']], faces.side, faces.edge, 1);
    poly([c['001'], c['101'], c['111'], c['011']], faces.top, faces.edge, 1);
    poly([c['000'], c['100'], c['101'], c['001']], faces.front, faces.edge, 1.5);
    poly([c['100'], c['110'], c['111'], c['101']], faces.side, faces.edge, 1);
  };

  // Shadow
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(ox + stackW * 0.3, oy + 14, stackW * 0.7 + ctP, stackD * 0.35, -0.1, 0, Math.PI * 2);
  ctx.fillStyle = T.shadow; ctx.fill();
  ctx.restore();

  let baseZ = 0;

  // === PALLET (wooden base) ===
  if (hasPL) {
    const plW = stackW + 20, plD = stackD + 15;
    const plOX = -10, plOY = -7.5;
    // Draw wooden slats
    const slatCount = 5;
    const slatW = plW / slatCount;
    for (let s = 0; s < slatCount; s++) {
      const sx = plOX + s * slatW;
      const shade = s % 2 === 0 ? T.plTop : (isDark ? '#5e4535' : '#d0b088');
      shell(slatW - 1, plD, plH * 0.5, sx, plOY, 0,
        { front: T.plFront, top: shade, side: T.plSide, edge: T.plEdge });
    }
    // Cross beams
    for (let b = 0; b < 3; b++) {
      const by = plOY + b * (plD / 2);
      shell(plW, 3, plH * 0.4, plOX, by, plH * 0.5,
        { front: T.plSide, top: T.plFront, side: T.plSide, edge: T.plEdge });
    }
    baseZ = plH;
  }

  // === BOX STACK ===
  for (let layer = 0; layer < layers; layer++) {
    const z0 = baseZ + layer * bxH;
    for (let row = nw - 1; row >= 0; row--) {
      for (let col = 0; col < nl; col++) {
        shell(bxW, bxD, bxH, col * bxW, row * bxD, z0,
          { front: T.boxFront, top: T.boxTop, side: T.boxSide, edge: T.boxEdge });
      }
    }
  }

  // === PAPERBAND (colored bands around stack) ===
  if (hasPB) {
    const bandH = 3, bandP = -2;
    const midZ = baseZ + stackH * 0.5 - bandH / 2;
    // Horizontal band (wraps W direction)
    ctx.globalAlpha = 0.7;
    shell(stackW + 4, stackD + 4, bandH, -2, -2, midZ,
      { front: T.pbColor, top: T.pbColor, side: T.pbColor, edge: T.pbEdge });
    // Vertical band (wraps D direction)
    shell(bandH + 1, stackD + 4, stackH + 4, stackW * 0.5 - bandH / 2, -2, baseZ - 2,
      { front: T.pbColor, top: T.pbColor, side: T.pbColor, edge: T.pbEdge });
    ctx.globalAlpha = 1;
  }

  // === KRAFTWRAP (translucent shell around stack) ===
  if (hasKW) {
    const kp = 5;
    shell(stackW + kp * 2, stackD + kp * 2, stackH + kp * 2, -kp, -kp, baseZ - kp,
      { front: T.kraftFront, top: T.kraftTop, side: T.kraftSide, edge: T.kraftEdge });
    // Fold lines
    ctx.setLineDash([8, 5]); ctx.strokeStyle = T.kraftLine; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(...iso(-kp, -kp, baseZ + stackH * 0.5)); ctx.lineTo(...iso(stackW + kp, -kp, baseZ + stackH * 0.5)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(...iso(stackW * 0.5, -kp, baseZ + stackH + kp)); ctx.lineTo(...iso(stackW * 0.5, stackD + kp, baseZ + stackH + kp)); ctx.stroke();
    ctx.setLineDash([]);
  }

  // === CARTON (outer corrugated box) ===
  if (hasCT) {
    shell(stackW + ctP * 2, stackD + ctP * 2, stackH + ctP * 2 + 5, -ctP, -ctP, baseZ - ctP,
      { front: T.ctFront, top: T.ctTop, side: T.ctSide, edge: T.ctEdge });
    // Flap lines on top
    ctx.setLineDash([6, 4]); ctx.strokeStyle = isDark ? 'rgba(180,140,70,0.5)' : 'rgba(160,120,60,0.35)'; ctx.lineWidth = 1;
    const fZ = baseZ + stackH + ctP + 5;
    ctx.beginPath(); ctx.moveTo(...iso(-ctP, stackD * 0.5, fZ)); ctx.lineTo(...iso(stackW + ctP, stackD * 0.5, fZ)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(...iso(stackW * 0.5, -ctP, fZ)); ctx.lineTo(...iso(stackW * 0.5, stackD + ctP, fZ)); ctx.stroke();
    ctx.setLineDash([]);
  }

  // === DIMENSION LINES ===
  const font = '"Segoe UI", system-ui, sans-serif';
  const dO = 28;
  function pill(x, y, text) {
    ctx.font = `bold 13px ${font}`;
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = T.labelBg;
    ctx.beginPath(); ctx.roundRect(x - tw / 2 - 10, y - 10, tw + 20, 22, 11); ctx.fill();
    ctx.fillStyle = T.dimText; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }
  ctx.strokeStyle = T.dimLine; ctx.lineWidth = 1;
  const wL = iso(0, 0, -dO), wR = iso(stackW, 0, -dO);
  ctx.beginPath(); ctx.moveTo(...wL); ctx.lineTo(...wR); ctx.stroke();
  [0, stackW].forEach(x => { ctx.beginPath(); ctx.moveTo(...iso(x,0,-dO+5)); ctx.lineTo(...iso(x,0,-dO-5)); ctx.stroke(); });
  pill(iso(stackW / 2, 0, -dO)[0], iso(stackW / 2, 0, -dO)[1], `${topD}"`);

  ctx.strokeStyle = T.dimLine; ctx.lineWidth = 1;
  const dL2 = iso(stackW + dO * 0.4, 0, -dO * 0.15), dR2 = iso(stackW + dO * 0.4, stackD, -dO * 0.15);
  ctx.beginPath(); ctx.moveTo(...dL2); ctx.lineTo(...dR2); ctx.stroke();
  pill(iso(stackW + dO * 0.4, stackD / 2, -dO * 0.15)[0], iso(stackW + dO * 0.4, stackD / 2, -dO * 0.15)[1] - 12, `${leftD}"`);

  // === LEGEND BADGES ===
  const badges = [];
  if (hasPL) badges.push(['🪵 Pallet', T.plTop]);
  if (hasPB) badges.push(['🔵 Paperband', isDark ? '#50b4dc' : '#3c96c8']);
  if (hasKW) badges.push(['📦 Kraftwrap', T.kraftLine]);
  if (hasCT) badges.push(['📤 Carton', isDark ? '#b48c46' : '#a08040']);

  ctx.font = `bold 11px ${font}`;
  // Measure total legend width first → center it
  let totalBadgeW = 0;
  badges.forEach(([text]) => { totalBadgeW += ctx.measureText(text).width + 16 + 8; });
  totalBadgeW -= 8; // remove last gap
  let bx = Math.max(8, (W - totalBadgeW) / 2);
  badges.forEach(([text, col]) => {
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = isDark ? 'rgba(40,25,65,0.8)' : 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.roundRect(bx, 10, tw + 16, 24, 12); ctx.fill();
    ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + 8, 22);
    bx += tw + 24;
  });

  // Stack info
  ctx.font = `bold 12px ${font}`;
  const info = `${pcs} pcs/pack · ${layers} layers · ${nw}×${nl}`;
  const iTw = ctx.measureText(info).width;
  ctx.fillStyle = T.labelBg;
  ctx.beginPath(); ctx.roundRect(W / 2 - iTw / 2 - 14, H - 34, iTw + 28, 26, 13); ctx.fill();
  ctx.fillStyle = T.labelText; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(info, W / 2, H - 21);
}

// === Nested Packing View — Carton (packs inside) or Pallet (cartons stacked) ===
function drawNestedPackingView(ctx, W, H, T, isDark, opts) {
  const {
    viewMode, topD, leftD,
    packsPerCarton, qtyPerCarton,
    cartonPacksW, cartonPacksL, cartonPacksH,
    cartonsPerPallet, totalCartons, totalPallets,
    _interactive = false, _rotation = Math.PI / 6, _tilt = Math.PI / 6, _zoom = 1.0,
  } = opts;

  // Isometric projection helpers (interactive: use _tilt/_rotation)
  const cosA = _interactive ? Math.cos(_tilt) : Math.cos(Math.PI / 6);
  const sinA = _interactive ? Math.sin(_tilt) : Math.sin(Math.PI / 6);
  // Y-axis rotation for "orbit" — apply to (x, y) before iso projection
  const rotY = _interactive ? _rotation : 0;
  const cosR = Math.cos(rotY), sinR = Math.sin(rotY);
  const zoomFactor = _interactive ? _zoom : 1.0;

  // Pack base dimensions (1 kraftwrap pack)
  const packW_base = topD || 5;  // inches W
  const packL_base = leftD || 5; // inches L
  const packH_base = packL_base * 0.4; // estimated stack height

  if (viewMode === 'carton') {
    // === CARTON VIEW: Show ONE carton with N packs visible inside ===
    const ncw = cartonPacksW || 1;
    const ncl = cartonPacksL || 1;
    const nch = cartonPacksH || 1;

    // Carton inner dimensions (in "drawing units")
    const totalW_in = packW_base * ncw;
    const totalL_in = packL_base * ncl;
    const totalH_in = packH_base * nch;
    const maxDim = Math.max(totalW_in, totalL_in, totalH_in, 5);
    const scale = Math.min(180 / maxDim, 24) * zoomFactor;

    const pW = packW_base * scale;
    const pL = packL_base * scale * 0.5;
    const pH = packH_base * scale * 0.7;

    const ctP = 8 * zoomFactor; // carton padding
    const stackW = pW * ncw + ctP * 2;
    const stackD = pL * ncl + ctP * 2;
    const stackH_total = pH * nch + ctP * 2;

    const isoShiftX = (stackW - stackD) * cosA * 0.5;
    const ox = W * 0.5 - isoShiftX * 0.3;
    const oy = H * 0.62 + stackH_total * 0.15;

    // Iso projection with optional Y-rotation (orbit around vertical axis)
    // Rotate (x, y) around stack center → then apply standard iso projection
    const cx = stackW * 0.5, cy = stackD * 0.5;
    const iso = (x, y, z) => {
      let dx = x - cx, dy = y - cy;
      if (_interactive) {
        const rx = dx * cosR - dy * sinR;
        const ry = dx * sinR + dy * cosR;
        dx = rx; dy = ry;
      }
      const wx = dx + cx, wy = dy + cy;
      return [ox + (wx - wy) * cosA, oy - z - (wx + wy) * sinA];
    };
    const poly = (pts, fill, stroke, lw) => {
      ctx.beginPath(); ctx.moveTo(...pts[0]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(...pts[i]);
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
    };
    const shell = (w, d, h, oX, oY, oZ, faces) => {
      const c = {};
      [[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]].forEach(([a,b,e]) => {
        c[`${a}${b}${e}`] = iso(oX + a * w, oY + b * d, oZ + e * h);
      });
      poly([c['010'], c['110'], c['111'], c['011']], faces.side, faces.edge, 1);
      poly([c['000'], c['010'], c['011'], c['001']], faces.side, faces.edge, 1);
      poly([c['001'], c['101'], c['111'], c['011']], faces.top, faces.edge, 1);
      poly([c['000'], c['100'], c['101'], c['001']], faces.front, faces.edge, 1.5);
      poly([c['100'], c['110'], c['111'], c['101']], faces.side, faces.edge, 1);
    };

    // Shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ox + stackW * 0.3, oy + 14, stackW * 0.7, stackD * 0.35, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = T.shadow; ctx.fill();
    ctx.restore();

    // Draw packs inside carton (back to front, bottom to top)
    for (let h = 0; h < nch; h++) {
      for (let row = ncw - 1; row >= 0; row--) {
        for (let col = 0; col < ncl; col++) {
          shell(pW, pL, pH, ctP + col * pW, ctP + row * pL, ctP + h * pH,
            { front: T.kraftFront, top: T.kraftTop, side: T.kraftSide, edge: T.kraftLine });
        }
      }
    }

    // Draw carton outer (translucent)
    ctx.globalAlpha = 0.55;
    shell(stackW, stackD, stackH_total, 0, 0, 0,
      { front: T.ctFront, top: T.ctTop, side: T.ctSide, edge: T.ctEdge });
    ctx.globalAlpha = 1;
    // Carton flap lines
    ctx.setLineDash([5, 4]); ctx.strokeStyle = isDark ? 'rgba(180,140,70,0.6)' : 'rgba(160,120,60,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(...iso(0, stackD * 0.5, stackH_total)); ctx.lineTo(...iso(stackW, stackD * 0.5, stackH_total)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(...iso(stackW * 0.5, 0, stackH_total)); ctx.lineTo(...iso(stackW * 0.5, stackD, stackH_total)); ctx.stroke();
    ctx.setLineDash([]);

    // Title + info
    const font = '"Segoe UI", system-ui, sans-serif';
    ctx.font = `bold 14px ${font}`;
    ctx.fillStyle = T.labelText; ctx.textAlign = 'center';
    ctx.fillText(`📦 Carton View — ${ncw}×${ncl}×${nch} packs`, W / 2, 30);

    ctx.font = `bold 12px ${font}`;
    const info = `${packsPerCarton} packs/carton · ${qtyPerCarton.toLocaleString()} pcs · ${totalCartons.toLocaleString()} cartons total`;
    const iTw = ctx.measureText(info).width;
    ctx.fillStyle = T.labelBg;
    ctx.beginPath(); ctx.roundRect(W / 2 - iTw / 2 - 14, H - 36, iTw + 28, 26, 13); ctx.fill();
    ctx.fillStyle = T.labelText; ctx.textBaseline = 'middle';
    ctx.fillText(info, W / 2, H - 23);

  } else if (viewMode === 'pallet') {
    // === PALLET VIEW: Show 1 pallet with ACTUAL cartons ===
    const cartonsToShow = Math.min(totalCartons || cartonsPerPallet, cartonsPerPallet);

    // Auto-arrange grid: cnX cols × cnY rows × cnH layers
    // cnX = along long axis (L = 48"), cnY = along short axis (W = 40")
    let cnX, cnY, cnH;
    if (cartonsToShow <= 2) { cnX = cartonsToShow; cnY = 1; cnH = 1; }
    else if (cartonsToShow === 3) { cnX = 3; cnY = 1; cnH = 1; }
    else if (cartonsToShow === 4) { cnX = 2; cnY = 2; cnH = 1; }
    else if (cartonsToShow <= 6) { cnX = 3; cnY = 2; cnH = 1; }
    else if (cartonsToShow <= 9) { cnX = 3; cnY = 3; cnH = 1; }
    else if (cartonsToShow <= 12) { cnX = 4; cnY = 3; cnH = 1; }
    else if (cartonsToShow <= 16) { cnX = 4; cnY = 4; cnH = 1; }
    else { cnX = 4; cnY = 4; cnH = Math.ceil(cartonsToShow / 16); }

    // === Pallet sizing — simple fixed values ===
    // ratio sX:sY = 48":40" pallet
    const baseSX = _bigCanvas ? 380 : 280;
    const sX = baseSX * zoomFactor;
    const sY = sX * (40 / 48);  // 0.833
    const sPlH = sX * 0.08;
    const sCellH = sX * 0.18;
    const sH = sCellH * cnH;

    // Cell sizes (cartons fill grid equally)
    const sCellX = sX / cnX;
    const sCellY = sY / cnY;
    const gap = 4 * zoomFactor;

    // Center on canvas — simple formula:
    // ox = horizontal center, oy = vertical position so pallet is centered
    const isoBoxH = (sX + sY) * sinA + sPlH + sH;
    const ox = W / 2 - (sX - sY) * cosA * 0.5;
    // Place pallet so the ground point (0,0,0) is at canvas vertical center + half box height
    const oy = H / 2 + isoBoxH / 2 - sPlH;

    // Iso projection with optional Y-rotation
    const cx = sX * 0.5, cy = sY * 0.5;
    const iso = (x, y, z) => {
      let dx = x - cx, dy = y - cy;
      if (_interactive) {
        const rx = dx * cosR - dy * sinR;
        const ry = dx * sinR + dy * cosR;
        dx = rx; dy = ry;
      }
      const wx = dx + cx, wy = dy + cy;
      return [ox + (wx - wy) * cosA, oy - z - (wx + wy) * sinA];
    };
    const poly = (pts, fill, stroke, lw) => {
      ctx.beginPath(); ctx.moveTo(...pts[0]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(...pts[i]);
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
    };
    const shell = (w, d, h, oX, oY, oZ, faces) => {
      const c = {};
      [[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]].forEach(([a,b,e]) => {
        c[`${a}${b}${e}`] = iso(oX + a * w, oY + b * d, oZ + e * h);
      });
      poly([c['010'], c['110'], c['111'], c['011']], faces.side, faces.edge, 1);
      poly([c['000'], c['010'], c['011'], c['001']], faces.side, faces.edge, 1);
      poly([c['001'], c['101'], c['111'], c['011']], faces.top, faces.edge, 1);
      poly([c['000'], c['100'], c['101'], c['001']], faces.front, faces.edge, 1.5);
      poly([c['100'], c['110'], c['111'], c['101']], faces.side, faces.edge, 1);
    };

    // === Shadow ===
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ox + sX * 0.3, oy + 22, sX * 0.85, sY * 0.45, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = T.shadow; ctx.fill();
    ctx.restore();

    // === PALLET (wooden base) ===
    const plPad = 14;
    const plW = sX + plPad * 2;
    const plD = sY + plPad * 2;
    const plOX = -plPad;
    const plOY = -plPad;
    const slatCount = 5;
    const slatW = plW / slatCount;
    for (let s = 0; s < slatCount; s++) {
      const sx = plOX + s * slatW;
      const shade = s % 2 === 0 ? T.plTop : (isDark ? '#5e4535' : '#d0b088');
      shell(slatW - 1, plD, sPlH * 0.5, sx, plOY, 0,
        { front: T.plFront, top: shade, side: T.plSide, edge: T.plEdge });
    }
    // Cross beams
    for (let b = 0; b < 3; b++) {
      const by = plOY + b * (plD / 2);
      shell(plW, 4, sPlH * 0.45, plOX, by, sPlH * 0.5,
        { front: T.plSide, top: T.plFront, side: T.plSide, edge: T.plEdge });
    }

    // === CARTONS on pallet (back to front for proper depth ordering) ===
    let cartonIdx = 0;
    for (let layer = 0; layer < cnH; layer++) {
      for (let iy = cnY - 1; iy >= 0; iy--) {
        for (let ix = 0; ix < cnX; ix++) {
          if (cartonIdx >= cartonsToShow) continue;
          const px = ix * sCellX + gap;
          const py = iy * sCellY + gap;
          const pz = sPlH + layer * (sCellH + 1);
          shell(
            sCellX - gap * 2,
            sCellY - gap * 2,
            sCellH,
            px, py, pz,
            { front: T.ctFront, top: T.ctTop, side: T.ctSide, edge: T.ctEdge }
          );
          cartonIdx++;
        }
      }
    }

    // === Title + info ===
    const font = '"Segoe UI", system-ui, sans-serif';
    ctx.font = `bold 16px ${font}`;
    ctx.fillStyle = T.labelText; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const titleSuffix = totalCartons < cartonsPerPallet
      ? `${cartonsToShow} cartons (จาก capacity ${cartonsPerPallet})`
      : `${cnX}×${cnY}${cnH > 1 ? '×' + cnH : ''} cartons`;
    ctx.fillText(`🪵 Pallet View — ${titleSuffix}`, W / 2, 16);

    // Info pill at bottom
    ctx.font = `bold 13px ${font}`;
    const totalPcs = totalCartons * qtyPerCarton;
    const info = `${totalPallets} pallet${totalPallets > 1 ? 's' : ''} · ${totalCartons} cartons · ${totalPcs.toLocaleString()} pcs total`;
    const iTw = ctx.measureText(info).width;
    ctx.fillStyle = T.labelBg;
    ctx.beginPath(); ctx.roundRect(W / 2 - iTw / 2 - 16, H - 38, iTw + 32, 28, 14); ctx.fill();
    ctx.fillStyle = T.labelText; ctx.textBaseline = 'middle';
    ctx.fillText(info, W / 2, H - 24);
  }
}

function onKwPriceChange(price, packs) {
  if (isNaN(price) || price < 0) return;
  const newTotal = packs * price;
  const el = document.getElementById('kwTotalVal');
  if (el) el.textContent = newTotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
  // TODO: update packing total + subtotal chain if needed
}

// Tax % change — real-time recalc
function onTaxChange(pct) {
  if (isNaN(pct) || pct < 0) pct = 0;
  const b = window._priceBase;
  if (!b) return;
  b.taxPercent = pct;

  const subAdj = b.subWithAdj || 0;
  const tax = subAdj * pct / 100;
  const total = subAdj + tax;
  const unit = b.qty > 0 ? total / b.qty : 0;
  const exRate = window._exchangeRate || 1;
  const m = v => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const _s = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  _s('taxVal', m(tax));
  _s('totalPriceVal', m(total));
  _s('unitPriceVal', unit.toFixed(2));
  if (exRate !== 1) _s('unitPriceExVal', (unit / exRate).toFixed(4));
}

// Exchange Rate — Sipware (192.168.5.40) — บริษัทฝ่ายบัญชีกรอกเอง
// Use Export rate (ขายเป็น THB) เป็น default — สอดคล้องกับการคิดราคาขาย
window._exchangeRate = 1;
window._exchangeRates = { THB: 1 };
window._sipwareRates = null;
window._sipwareSyncedAt = null;

// Load sipware rates on startup (cached on server side, refreshes every 12h)
async function loadSipwareRates() {
  try {
    const r = await fetch('/api/exchange-rate/sipware', { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    if (data.success && data.rates) {
      window._sipwareRates = data.rates;
      window._sipwareSyncedAt = data.synced_at || null;
      // Cache as flat map { USD: 31.17, ... } using Export rate (ขาย — ตรงกับที่ใช้คำนวณราคา)
      Object.entries(data.rates).forEach(([cur, info]) => {
        if (cur === 'YEN') {
          // YEN เป็น per 100 → convert
          window._exchangeRates['JPY'] = info.export_per_unit;
          window._exchangeRates['YEN'] = info.export_per_unit;
        } else {
          window._exchangeRates[cur] = info.export;
        }
      });
      console.log('[sipware] Loaded', Object.keys(data.rates).length, 'rates from', data.date, data.time);
      return data;
    }
  } catch (e) {
    console.warn('[sipware] Load failed:', e.message);
  }
  return null;
}
// Auto-load on first call
loadSipwareRates();

function onCurrencyChange(currency) {
  if (currency === 'THB') {
    _applyExchangeRate(1, 'THB');
    return;
  }
  // Use cached sipware rate if available
  if (window._exchangeRates[currency]) {
    _applyExchangeRate(window._exchangeRates[currency], currency);
    return;
  }
  // Not loaded yet — fetch from sipware then apply
  loadSipwareRates().then(() => {
    if (window._exchangeRates[currency]) {
      _applyExchangeRate(window._exchangeRates[currency], currency);
    } else {
      // Fallback (sipware ไม่มี currency นี้)
      const fallback = { USD: 34.5, EUR: 37.5, JPY: 0.23, CNY: 4.8, GBP: 43.5 };
      const fallbackRate = fallback[currency] || 30;
      _applyExchangeRate(fallbackRate, currency);
      toast(`Sipware ไม่มี ${currency} — ใช้ค่าประมาณ ${fallbackRate}`, 'warning');
    }
  });
}

function _applyExchangeRate(rate, currency) {
  window._exchangeRate = rate;
  // Get unit price from DOM or recalculate from _priceBase
  let unitTHB = parseFloat(document.getElementById('unitPriceVal')?.textContent?.replace(/,/g,'')) || 0;
  if (!unitTHB && window._priceBase) {
    const b = window._priceBase;
    const totalPrice = (b.subWithAdj || 0) * (1 + (b.taxPercent || 3) / 100);
    unitTHB = b.qty > 0 ? totalPrice / b.qty : 0;
  }
  const unitEx = rate > 0 && rate !== 1 ? unitTHB / rate : unitTHB;

  const el = (id) => document.getElementById(id);
  if (el('exCurrLabel')) el('exCurrLabel').textContent = currency;
  if (el('exRateVal')) el('exRateVal').textContent = rate === 1 ? '1' : rate.toFixed(4);
  if (el('unitPriceExVal')) el('unitPriceExVal').textContent = rate !== 1 ? unitEx.toFixed(4) : '';
  if (el('exUnitLabel')) el('exUnitLabel').textContent = rate !== 1 ? `1 ${currency} = ${rate.toFixed(2)} THB` : '';
}

let _formulaIdx = 0, _formulaData = {};
function showFormula(id) {
  const d = _formulaData[id];
  if (!d) return;
  const html = d.lines.filter(l => l).map(l => `<div style="margin:4px 0;line-height:1.6">${l}</div>`).join('');
  // Create modal
  const overlay = document.createElement('div');
  overlay.className = 'formula-modal-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = `<div class="formula-modal">
    <div class="formula-modal-header">
      <span><i class="fas fa-flask"></i> ${escapeHtml(d.title)}</span>
      <button onclick="this.closest('.formula-modal-overlay').remove()" style="background:none;border:none;color:var(--text-secondary);font-size:18px;cursor:pointer">&times;</button>
    </div>
    <div class="formula-modal-body">${html}</div>
  </div>`;
  document.body.appendChild(overlay);
}

// B9: Re-calc (after change / after packing)
function recalcPrice() {
  if (!State.form) { toast('กรุณาเปิดฟอร์ม RFQ ก่อน', 'error'); return; }
  // Clear previous layout cache
  State.form.components.forEach(c => { delete c._layout; });
  State.layoutResults = null;
  State.lastEstimate = null;
  toast('กำลังคำนวณใหม่...', 'info');
  // Run layout first, then price
  calculateLayout(true); // skip overlay on recalc
  setTimeout(() => calculatePrice(true), 100); // skip overlay on recalc
}

// A7: Reject Remark History Popup
async function viewRejectRemarks(jobId) {
  try {
    const data = await apiGet(`/api/rfq/status-log/${jobId}`);
    const logs = (Array.isArray(data) ? data : (data.data || [])).filter(l => l.status === 'Reject' || l.approve_status === 'Reject');
    if (!logs.length) { toast('ไม่พบประวัติการปฏิเสธ', 'info'); return; }
    let msg = '<div style="text-align:left;max-height:300px;overflow-y:auto">';
    msg += '<table class="detail-table" style="font-size:12px"><thead><tr><th>วันที่</th><th>ผู้ปฏิเสธ</th><th>เหตุผล</th></tr></thead><tbody>';
    logs.forEach(l => {
      msg += `<tr><td>${l.created_datetime || l.edit_date || '-'}</td><td>${escapeHtml(l.editor || l.emp_name || '-')}</td><td>${escapeHtml(l.remark || '-')}</td></tr>`;
    });
    msg += '</tbody></table></div>';
    const bodyEl = $('confirmBody');
    const overlay = $('confirmOverlay');
    $('confirmIcon').className = 'confirm-icon danger';
    $('confirmIcon').innerHTML = '<i class="fas fa-times-circle"></i>';
    $('confirmTitle').textContent = 'ประวัติการปฏิเสธ';
    bodyEl.innerHTML = msg;
    $('confirmOk').textContent = 'ปิด';
    $('confirmOk').className = 'confirm-ok';
    $('confirmCancel').style.display = 'none';
    overlay.classList.add('show');
    $('confirmOk').onclick = () => { overlay.classList.remove('show'); $('confirmCancel').style.display = ''; };
  } catch (e) {
    toast('โหลดประวัติไม่สำเร็จ: ' + e.message, 'error');
  }
}

// B10: Wizard/History Search Modal
async function openWizardSearch() {
  let h = `<div style="max-width:600px;margin:0 auto">
    <div class="detail-header" style="display:flex;justify-content:space-between;align-items:center">
      <div><h4><i class="fas fa-magic"></i> Wizard - ค้นหา Estimate เดิม</h4>
        <div style="color:var(--text-muted);font-size:13px">ค้นหาจากชื่องาน ลูกค้า หรือ RFQ ID</div></div>
      <button class="btn btn-secondary" onclick="App.backToForm()"><i class="fas fa-arrow-left"></i> กลับไปฟอร์ม</button>
    </div>
    <div style="display:flex;gap:8px;margin:12px 0">
      <input class="form-input" id="wizardSearchInput" placeholder="พิมพ์คำค้นหา..." style="flex:1" oninput="App.doWizardSearch(this.value)">
      <button class="btn btn-secondary" onclick="App.wizardAISearch()" title="AI Smart Search"><i class="fas fa-robot"></i> AI</button>
    </div>
    <div id="wizardResults" style="max-height:400px;overflow-y:auto"><p style="color:var(--text-muted);text-align:center;padding:20px">กรุณาพิมพ์คำค้นหา</p></div>
  </div>`;
  $('detailContent').innerHTML = h;
  showView('viewDetail');
  setTopBar('Wizard Search', 'ค้นหา Estimate เดิม');
  setTimeout(() => $('wizardSearchInput')?.focus(), 100);
}

// B10: Wizard AI Search via n8n webhook
async function wizardAISearch() {
  const term = $('wizardSearchInput')?.value;
  if (!term || term.length < 2) { toast('กรุณาพิมพ์คำค้นหา', 'warning'); return; }
  $('wizardResults').innerHTML = '<div class="loading-spinner"><i class="fas fa-robot fa-spin"></i> AI กำลังค้นหา...</div>';
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `search estimate: ${term}`, conversationId: State.conversationId }),
    });
    const data = await res.json();
    if (data.reply) {
      // Try extract structured data from AI response
      const extracted = extractRFQData(data.reply);
      if (extracted) {
        $('wizardResults').innerHTML = `<div class="detail-card"><h6><i class="fas fa-robot"></i> AI Suggestion</h6><pre style="font-size:11px;white-space:pre-wrap;max-height:200px;overflow-y:auto">${escapeHtml(data.reply)}</pre>
          <button class="btn btn-primary" onclick="App.applyAgentData(${escapeHtml(JSON.stringify(extracted))})"><i class="fas fa-check"></i> ใช้ข้อมูลนี้</button></div>`;
      } else {
        $('wizardResults').innerHTML = `<div class="detail-card"><h6><i class="fas fa-robot"></i> AI Response</h6><pre style="font-size:11px;white-space:pre-wrap;max-height:300px;overflow-y:auto">${escapeHtml(data.reply)}</pre></div>`;
      }
    } else {
      toast('AI ไม่ส่งผลลัพธ์กลับมา', 'warning');
    }
  } catch (e) {
    $('wizardResults').innerHTML = `<p style="color:#f08080">AI search failed: ${e.message}</p>`;
  }
}

let _wizardTimer = null;
async function doWizardSearch(term) {
  clearTimeout(_wizardTimer);
  if (!term || term.length < 2) { $('wizardResults').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px">กรุณาพิมพ์อย่างน้อย 2 ตัวอักษร</p>'; return; }
  _wizardTimer = setTimeout(async () => {
    $('wizardResults').innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
    try {
      const params = new URLSearchParams({ job_name: term, limit: 20 });
      const data = await apiGet(`/api/rfq/list?${params}`);
      const list = Array.isArray(data) ? data : [];
      if (!list.length) { $('wizardResults').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px">ไม่พบผลลัพธ์</p>'; return; }
      let rh = '';
      list.forEach(r => {
        rh += `<div class="rfq-card" style="cursor:pointer;padding:10px;margin-bottom:6px;border:1px solid var(--border);border-radius:6px" onclick="App.loadWizardItem('${r.job_id}')">
          <div style="display:flex;justify-content:space-between"><b>${r.job_id}</b><span class="rfq-status" style="font-size:10px">${r.status || '-'}</span></div>
          <div style="font-size:12px;color:var(--text-secondary)">${escapeHtml(r.job_name || '-')} | ${escapeHtml(r.customer || '-')}</div>
          <div style="font-size:11px;color:var(--text-muted)">${r.ae || '-'} | Qty: ${r.qty || '-'}</div>
        </div>`;
      });
      $('wizardResults').innerHTML = rh;
    } catch (e) {
      $('wizardResults').innerHTML = `<p style="color:#f08080">${e.message}</p>`;
    }
  }, 400);
}

async function loadWizardItem(jobId) {
  toast('กำลังโหลด ' + jobId + '...', 'info');
  try {
    const data = await apiGet(`/api/rfq/detail/${jobId}`);
    State.form = mapApiToForm(data);
    State.form.ref_copy_id = jobId;
    State.form.doc_status = 'Draft';
    State.formMode = 'create';
    State.formEditId = null;
    renderForm();
    showView('viewForm');
    setTopBar('สร้างจาก ' + jobId, 'Wizard Copy');
    toast('โหลดข้อมูลจาก ' + jobId + ' สำเร็จ', 'success');
  } catch (e) {
    toast('โหลดไม่สำเร็จ: ' + e.message, 'error');
  }
}

// C11: Form Validation
function validateForm() {
  const f = State.form;
  if (!f) return ['ไม่มีข้อมูลฟอร์ม'];
  const errors = [];

  // Job info
  if (!f.job_name?.trim()) errors.push('กรุณาระบุชื่องาน (Job Name)');
  if (!f.customer?.customer_name?.trim()) errors.push('กรุณาระบุลูกค้า (Customer)');
  if (!f.ae?.emp_name?.trim()) errors.push('กรุณาระบุ AE');

  // Qty
  const validQtys = f.qty.filter(q => q && parseInt(q) > 0);
  if (!validQtys.length) errors.push('กรุณาระบุจำนวน (Qty) อย่างน้อย 1 รายการ');

  // Components
  if (!f.components.length) errors.push('กรุณาเพิ่ม Component อย่างน้อย 1 รายการ');
  f.components.forEach((c, ci) => {
    const cn = c.component_name || `Component ${ci+1}`;
    if (!c.component_name?.trim()) errors.push(`${cn}: กรุณาระบุชื่อ Component`);
    const sz = c.packaging_size || {};
    if (!sz.width || !sz.length) errors.push(`${cn}: กรุณาระบุขนาด (กว้าง x ยาว)`);
    if (!c.color?.outside && c.color?.outside !== '0') errors.push(`${cn}: กรุณาระบุจำนวนสี Outside`);
    if (parseInt(c.color?.outside) > 8) errors.push(`${cn}: สี Outside ไม่ควรเกิน 8`);
    if (parseInt(c.color?.inside) > 8) errors.push(`${cn}: สี Inside ไม่ควรเกิน 8`);

    // Paper
    if (!c.paper?.paper_code && !c.paper?.is_custom) errors.push(`${cn}: กรุณาเลือกประเภทกระดาษ`);
    if (!c.paper?.paper_gram) errors.push(`${cn}: กรุณาระบุแกรมกระดาษ`);
    if (!c.paper?.paper_cost) errors.push(`${cn}: กรุณาระบุราคากระดาษ`);

    // Box type
    if (!c.box_type?.type_id) errors.push(`${cn}: กรุณาเลือก Template กล่อง`);

    // Corrugated
    if (c.component_type > 1) {
      if (!c.corrugated?.cost_price) errors.push(`${cn}: กรุณาระบุต้นทุนลูกฟูก`);
    }

    // Foil/Emboss sizes — ⚠️ ไม่ block ถ้าไม่มีขนาด
    // เปลี่ยนจาก error → warning (เพราะ AE บางคนไม่ได้ใส่ขนาดใน spec)
    // ระบบจะคำนวณเป็น labor only + แสดง warning ใน price tooltip
    // (legacy ก็ยอม — ระบบเก่าไม่ block ถ้าไม่มีขนาด)
    /* DISABLED — allow calc without size
    (c.addon || []).forEach((ad, ai) => {
      if (['foilstamp','emboss','deboss'].includes(ad.type)) {
        const sizes = ad.info?.sizes || [];
        if (sizes.length === 0 || (!sizes[0]?.w && !sizes[0]?.l)) {
          errors.push(`${cn}: Addon ${ad.type} #${ai+1} - กรุณาระบุขนาด`);
        }
      }
    });
    */
  });

  // Delivery
  f.delivery.forEach((dl, di) => {
    if (!dl.destinationName?.trim() && !dl.province?.trim()) errors.push(`Delivery #${di+1}: กรุณาระบุจังหวัดหรือสถานที่`);
  });

  // Flexo size
  if (f.print_type === 'Flexo' && !f.flexo_size) errors.push('กรุณาระบุ Flexo Size');

  return errors;
}

/**
 * #94: One-click verify — check ALL required fields, show result overlay
 */
function verifyFormComplete() {
  const errors = validateForm();
  const warnings = [];

  // Additional warnings (not blocking, but recommended)
  const f = State.form;
  if (f) {
    f.components.forEach((c, ci) => {
      const cn = c.component_name || `Component ${ci+1}`;
      // Coating recommended for packaging
      if (!(c.addon || []).some(a => a.type === 'coating')) {
        warnings.push(`${cn}: ยังไม่ได้เลือกเคลือบ (Coating)`);
      }
      // Packing
      if (!c.packing?.length && !c['_pk_kraftwrap'] && !c['_pk_paperband'] && !c['_pk_carton']) {
        warnings.push(`${cn}: ยังไม่ได้เลือกแพ็ค (Packing)`);
      }
      // Depth for box types 1-11
      const tid = parseInt(c.box_type?.type_id) || 0;
      if (tid >= 1 && tid <= 11 && !(parseFloat(c.packaging_size?.depth) > 0)) {
        warnings.push(`${cn}: ยังไม่ได้ระบุความสูง (Depth)`);
      }
    });
    // Only warn about delivery if not already in errors
    const hasDeliveryError = errors.some(e => e.includes('Delivery'));
    if (!hasDeliveryError && !f.delivery?.[0]?.destinationName && !f.delivery?.[0]?.province) {
      warnings.push('ยังไม่ได้ระบุจังหวัดจัดส่ง');
    }
  }

  // Build result popup
  const allGood = errors.length === 0 && warnings.length === 0;
  const hasError = errors.length > 0;

  // Inject styles once
  if (!document.getElementById('vfy-css')) {
    const st = document.createElement('style');
    st.id = 'vfy-css';
    st.textContent = `
      .vfy-wrap{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;animation:vfyIn .2s ease}
      .vfy-bg{position:absolute;inset:0;background:rgba(0,0,0,.7)}
      .vfy-box{position:relative;width:380px;max-width:92vw;border-radius:16px;overflow:hidden;animation:vfyUp .3s cubic-bezier(.34,1.56,.64,1);box-shadow:0 24px 80px rgba(0,0,0,.6)}
      .vfy-top{padding:32px 24px 20px;text-align:center}
      .vfy-top.ok{background:linear-gradient(135deg,#1a3a2a,#1a2a1a)}
      .vfy-top.err{background:linear-gradient(135deg,#3a1a1a,#2a1a1a)}
      .vfy-top.warn{background:linear-gradient(135deg,#2d1b4e,#1a1225)}
      .vfy-icon{width:72px;height:72px;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff}
      .vfy-icon.ok{background:linear-gradient(135deg,#38a169,#68d391);box-shadow:0 0 24px rgba(72,187,120,.5)}
      .vfy-icon.err{background:linear-gradient(135deg,#e53e3e,#fc8181);box-shadow:0 0 24px rgba(229,62,62,.4)}
      .vfy-icon.warn{background:linear-gradient(135deg,#7c3aed,#a78bfa);box-shadow:0 0 24px rgba(124,58,237,.4)}
      .vfy-title{font-size:18px;font-weight:700;color:#fff;margin-bottom:4px}
      .vfy-sub{font-size:12px;color:rgba(255,255,255,.6)}
      .vfy-body{background:#1a1225;padding:16px 20px}
      .vfy-list{border-radius:8px;padding:10px 12px;margin-bottom:8px;text-align:left}
      .vfy-list.red{background:rgba(229,62,62,.08);border:1px solid rgba(229,62,62,.2)}
      .vfy-list.yellow{background:rgba(214,158,46,.08);border:1px solid rgba(214,158,46,.2)}
      .vfy-list-title{font-size:11px;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:5px}
      .vfy-list-title.red{color:#fc8181} .vfy-list-title.yellow{color:#ecc94b}
      .vfy-list-item{font-size:11px;color:rgba(255,255,255,.7);padding:3px 0 3px 12px;margin-bottom:3px}
      .vfy-list-item.red{border-left:2px solid #fc8181} .vfy-list-item.yellow{border-left:2px solid #ecc94b}
      .vfy-btns{display:flex;gap:10px;justify-content:center;padding:16px 20px;background:#1a1225;border-top:1px solid rgba(255,255,255,.06)}
      .vfy-btn{padding:10px 24px;font-size:13px;font-weight:600;border-radius:8px;border:none;cursor:pointer;transition:transform .1s,box-shadow .1s}
      .vfy-btn:hover{transform:translateY(-1px)}
      .vfy-btn.pri{background:linear-gradient(135deg,#7c3aed,#a78bfa);color:#fff;box-shadow:0 4px 16px rgba(124,58,237,.4)}
      .vfy-btn.sec{background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.12)}
      @keyframes vfyIn{from{opacity:0}to{opacity:1}}
      @keyframes vfyUp{from{transform:translateY(20px) scale(.95);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
    `;
    document.head.appendChild(st);
  }

  const cls = allGood ? 'ok' : hasError ? 'err' : 'warn';
  const icon = allGood ? 'fa-check' : hasError ? 'fa-exclamation' : 'fa-info';
  const title = allGood ? 'ข้อมูลครบถ้วน' : hasError ? 'ข้อมูลยังไม่ครบ' : 'พร้อมคำนวณ';
  const sub = allGood ? 'ทุกรายการผ่านการตรวจสอบแล้ว' : hasError ? `พบ ${errors.length} รายการที่ต้องแก้ไข` : `มี ${warnings.length} คำแนะนำ`;

  let body = '';
  if (errors.length > 0) {
    body += `<div class="vfy-list red"><div class="vfy-list-title red"><i class="fas fa-times-circle"></i> ต้องแก้ไข (${errors.length})</div>`;
    errors.forEach(e => body += `<div class="vfy-list-item red">${escapeHtml(e)}</div>`);
    body += '</div>';
  }
  if (warnings.length > 0) {
    body += `<div class="vfy-list yellow"><div class="vfy-list-title yellow"><i class="fas fa-exclamation-triangle"></i> คำแนะนำ (${warnings.length})</div>`;
    warnings.forEach(w => body += `<div class="vfy-list-item yellow">${escapeHtml(w)}</div>`);
    body += '</div>';
  }

  let btns = '';
  if (hasError) {
    btns = `<button class="vfy-btn pri" onclick="this.closest('.vfy-wrap')?.remove()"><i class="fas fa-edit"></i> กลับไปแก้ไข</button>`;
  } else {
    btns = `<button class="vfy-btn sec" onclick="this.closest('.vfy-wrap')?.remove()"><i class="fas fa-times"></i> ปิด</button>
            <button class="vfy-btn pri" onclick="this.closest('.vfy-wrap')?.remove();App.calculatePrice()"><i class="fas fa-calculator"></i> คำนวณราคา</button>`;
  }

  const overlay = document.createElement('div');
  overlay.className = 'vfy-wrap';
  overlay.innerHTML = `
    <div class="vfy-bg" onclick="this.parentElement.remove()"></div>
    <div class="vfy-box">
      <div class="vfy-top ${cls}">
        <div class="vfy-icon ${cls}"><i class="fas ${icon}"></i></div>
        <div class="vfy-title">${title}</div>
        <div class="vfy-sub">${sub}</div>
      </div>
      ${body ? `<div class="vfy-body">${body}</div>` : ''}
      <div class="vfy-btns">${btns}</div>
    </div>`;
  document.body.appendChild(overlay);
}

// ============================================================
// PDF GENERATION
// ============================================================
function generatePDF() {
  if (!State.form) { toast('กรุณาเปิดฟอร์ม RFQ ก่อน', 'error'); return; }
  if (typeof pdfMake === 'undefined') { toast('กำลังโหลด PDF library...', 'info'); return; }

  const f = State.form;
  const today = new Date().toLocaleDateString('th-TH', { day:'2-digit', month:'2-digit', year:'numeric' });
  const qtys = f.qty.filter(q => q).map(q => parseInt(q).toLocaleString()).join(' / ');
  const n = v => v ? parseFloat(v).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}) : '-';
  const headerFill = '#5b2d8e';
  const headerColor = '#ffffff';
  const tblLayout = { hLineWidth: ()=>0.5, vLineWidth: ()=>0.5, hLineColor: ()=>'#ddd', vLineColor: ()=>'#ddd', paddingLeft: ()=>4, paddingRight: ()=>4, paddingTop: ()=>2, paddingBottom: ()=>2 };
  const hdr = (cells) => cells.map(t => ({ text: t, bold: true, fillColor: headerFill, color: headerColor, fontSize: 8 }));

  const content = [
    { columns: [
      { text: 'ESTIMATE SPECIFICATION', style: 'header', width: '*' },
      { text: `${f.rfq_id || 'DRAFT'}\n${today}`, alignment: 'right', fontSize: 9, color: '#666' },
    ]},
    { text: 'Sirivatana Interprint Public Co., Ltd.', style: 'subheader' },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: headerFill }], margin: [0, 3, 0, 8] },

    // Section 1: Job Info (2 columns)
    { text: '1. Job Information', style: 'sectionHeader', margin: [0, 5, 0, 4] },
    { columns: [
      { width: '50%', table: { widths: [75, '*'], body: [
        [{ text: 'Job Name', bold: true }, f.job_name || '-'],
        [{ text: 'Customer', bold: true }, f.customer?.customer_name || '-'],
        [{ text: 'AE', bold: true }, f.ae?.emp_name || '-'],
        [{ text: 'Estimator', bold: true }, f.estimator?.emp_name || '-'],
        [{ text: 'Credit Term', bold: true }, f.credit_term_name || '-'],
      ]}, layout: tblLayout, fontSize: 9 },
      { width: '50%', table: { widths: [75, '*'], body: [
        [{ text: 'Print Type', bold: true }, f.print_type || '-'],
        [{ text: 'Machine', bold: true }, f.machine_id || 'Auto'],
        [{ text: 'Ink Type', bold: true }, f.ink_type || '-'],
        [{ text: 'Tax', bold: true }, f.tax === '7' ? 'VAT 7%' : f.tax === '3' ? 'WHT 3%' : 'No VAT'],
        [{ text: 'Currency', bold: true }, `${f.currency_no||'THB'} (${f.exchange_rate||1})`],
      ]}, layout: tblLayout, fontSize: 9 },
    ], columnGap: 8, margin: [0, 0, 0, 4] },

    // Flags row
    { text: [
      f.is_reprinted ? '[ Reprint ] ' : '',
      f.is_use_previous_plate ? '[ Use Previous Plate ] ' : '',
      f.is_loss ? '[ Loss ] ' : '',
      f.has_multi_f ? '[ Multiple F ] ' : '',
      f.limit_color ? `[ Color Limit: ${f.limit_color_qty} ] ` : '',
    ].filter(Boolean).join('') || '', fontSize: 8, color: '#666', margin: [0, 0, 0, 6] },

    // Section 2: Quantity
    { text: '2. Quantity', style: 'sectionHeader', margin: [0, 5, 0, 4] },
    { table: { widths: f.qty.filter(q=>q).map(()=>'*'), body: [
      hdr(f.qty.filter(q=>q).map((q,i)=>`Qty ${i+1}`)),
      f.qty.filter(q=>q).map(q => ({ text: parseInt(q).toLocaleString(), alignment: 'right', fontSize: 9 })),
    ]}, layout: tblLayout, margin: [0, 0, 0, 2] },
    f.run_on_percent ? { text: `Run-On: ${f.run_on_percent}% = ${(f.run_on_values||[]).filter(v=>v).join(', ')||'-'}`, fontSize: 8, color: '#666', margin: [0, 0, 0, 6] } : { text: '', margin: [0,0,0,4] },
  ];

  // Section 3: Components (detailed)
  f.components.forEach((c, i) => {
    const sz = c.packaging_size || {};
    content.push({ text: `3.${i+1} Component: ${c.component_name || '-'}`, style: 'sectionHeader', margin: [0, 8, 0, 4] });

    // Component info - 2 column layout
    const compType = c.component_type == 1 ? 'Plain' : c.component_type == 2 ? 'Corrugated Laminated' : c.component_type == 3 ? 'Corrugated Only' : '-';
    content.push({ columns: [
      { width: '50%', table: { widths: [80, '*'], body: [
        [{ text: 'Type', bold: true }, compType],
        [{ text: 'Box Template', bold: true }, c.box_type?.type_name || '-'],
        [{ text: 'Size (WxLxD)', bold: true }, `${sz.width||0} x ${sz.length||0} x ${sz.depth||0} mm`],
        [{ text: 'Glue/Tuck/Dust', bold: true }, `${sz.glue_flap||15} / ${sz.tuck_flap||15} / ${sz.dust_flap||0} mm`],
        [{ text: 'Packing Layer', bold: true }, c.box_type?.packing_layer || 1],
      ]}, layout: tblLayout, fontSize: 9 },
      { width: '50%', table: { widths: [80, '*'], body: [
        [{ text: 'Paper', bold: true }, `${c.paper?.paper_type||'-'} ${c.paper?.gsm||'-'}g`],
        [{ text: 'Paper Brand', bold: true }, c.paper?.brand || '-'],
        [{ text: 'Paper Cost', bold: true }, `${n(c.paper?.cost)} THB`],
        [{ text: 'Paper Sale', bold: true }, `${n(c.paper?.sale)} THB`],
        [{ text: 'Source/Markup', bold: true }, `${c.paper?.source||'domestic'} / ${c.paper?.markup||10}%`],
      ]}, layout: tblLayout, fontSize: 9 },
    ], columnGap: 8, margin: [0, 0, 0, 4] });

    // Colors
    const colorsOut = c.color?.outside || 0;
    const colorsIn = c.color?.inside || 0;
    let colorText = `Outside: ${colorsOut} colors   Inside: ${colorsIn} colors`;
    if (c.color?.f_code) colorText += `   F Code: ${c.color.f_code}`;
    if (c.color?.black_front) colorText += '   [Black Front]';
    if (c.color?.black_back) colorText += '   [Black Back]';
    content.push({ text: colorText, fontSize: 9, margin: [0, 0, 0, 2] });

    // Special Ink
    if (c.special_ink?.length) {
      const inkBody = [hdr(['Color', 'Type', 'Print Style', 'Paper Code'])];
      c.special_ink.forEach(ink => {
        inkBody.push([ink.color||'-', ink.type||'-', ink.print_style||'-', ink.paper_code||'-']);
      });
      content.push({ text: 'Special Ink:', bold: true, fontSize: 9, margin: [0, 3, 0, 2] });
      content.push({ table: { headerRows: 1, widths: ['*','*','*','*'], body: inkBody }, layout: tblLayout, fontSize: 8, margin: [0, 0, 0, 3] });
    }

    // Corrugated
    if (c.component_type != 1 && c.corrugated) {
      content.push({ text: `Corrugated: ${c.corrugated.layer||'-'} Layer, Flute: ${c.corrugated.flute_type||'-'}, Thickness: ${c.corrugated.thickness||'-'}mm, Cost: ${n(c.corrugated.cost)}`, fontSize: 9, margin: [0, 2, 0, 2] });
    }

    // Addons
    if (c.addon?.length) {
      const addonBody = [hdr(['Type', 'Code', 'Side', 'Size (WxL)', 'F Code', 'Depth'])];
      c.addon.forEach(a => {
        const sizes = (a.sizes||[]).map(s => `${s.width||0}x${s.length||0}"`).join(', ') || '-';
        addonBody.push([a.type||'-', a.code||'-', a.side||'-', sizes, a.f_code||'-', a.depth||'-']);
      });
      content.push({ text: 'Addons:', bold: true, fontSize: 9, margin: [0, 3, 0, 2] });
      content.push({ table: { headerRows: 1, widths: [55, 50, 35, '*', 45, 35], body: addonBody }, layout: tblLayout, fontSize: 8, margin: [0, 0, 0, 3] });
    }

    // Layout info
    if (c._layout && c._layout.best) {
      const b = c._layout.best;
      const u = c._layout.unfolded;
      content.push({ text: `Layout: ${b.sheetName} | Open Size: ${u.openW.toFixed(1)} x ${u.openL.toFixed(1)} mm | ${b.nw} x ${b.nl} = ${b.ups} ups${b.rotated ? ' (rotated)' : ''}`, fontSize: 9, color: '#2a7', bold: true, margin: [0, 3, 0, 3] });
    }

    // Per-component packing
    if (c.packing?.length) {
      content.push({ text: `Packing: ${c.packing.map(p => `${p.name||'-'} (${n(p.unit_price)})`).join(', ')}`, fontSize: 8, color: '#666', margin: [0, 0, 0, 3] });
    }
  });

  // Section 4: Process
  const hasProcs = f.process?.some(p => p.type || p.name);
  if (hasProcs) {
    content.push({ text: '4. Process', style: 'sectionHeader', margin: [0, 10, 0, 4] });
    const procBody = [hdr(['Type', 'Name', 'Line'])];
    f.process.forEach(p => { if (p.type || p.name) procBody.push([p.type||'-', p.name||'-', p.line||'-']); });
    content.push({ table: { headerRows: 1, widths: [80, '*', 60], body: procBody }, layout: tblLayout, fontSize: 9, margin: [0, 0, 0, 4] });
  }

  // Section 5: Process Info costs
  const procSections = ['plate','proof','print','process','handwork','material','other'];
  const hasProcInfo = procSections.some(s => f.process_info?.[s]?.length > 0);
  if (hasProcInfo) {
    content.push({ text: '5. Process Info (Cost Items)', style: 'sectionHeader', margin: [0, 8, 0, 4] });
    procSections.forEach(section => {
      const items = f.process_info?.[section];
      if (!items?.length) return;
      const body = [hdr(['Name', 'Qty', 'Unit Price', 'Total', 'Remark'])];
      items.forEach(it => body.push([it.name||'-', it.qty||'-', n(it.unit_price), n(it.total), it.remark||'-']));
      content.push({ text: section.charAt(0).toUpperCase() + section.slice(1), bold: true, fontSize: 9, margin: [0, 3, 0, 2] });
      content.push({ table: { headerRows: 1, widths: ['*', 40, 60, 60, '*'], body: body }, layout: tblLayout, fontSize: 8, margin: [0, 0, 0, 3] });
    });
  }

  // Section 6: Calculation results
  const est = State.lastEstimate;
  if (est && est.totals && est.totals.length > 0) {
    content.push({ text: '6. Cost Calculation', style: 'sectionHeader', margin: [0, 10, 0, 4] });

    // Per-component breakdown
    (est.components || []).forEach(cr => {
      if (cr.error || !cr.results) return;
      content.push({ text: cr.name, bold: true, fontSize: 9, margin: [0, 4, 0, 2] });
      const costRows = [hdr(['Qty', 'Paper', 'Corrugated', 'Plate', 'Print', 'Spe.Ink', 'AfterPress', 'Proof', 'Packing', 'Total'])];
      cr.results.forEach(qr => {
        if (qr.error) return;
        costRows.push([
          { text: qr.qty.toLocaleString(), alignment: 'right' },
          { text: n(qr.paperCost?.total), alignment: 'right' },
          { text: n(qr.corrugatedCost), alignment: 'right' },
          { text: n(qr.plateCost?.total), alignment: 'right' },
          { text: n(qr.printCost?.total), alignment: 'right' },
          { text: n(qr.specialInkCost), alignment: 'right' },
          { text: n(qr.afterPress?.total), alignment: 'right' },
          { text: n(qr.proofCost), alignment: 'right' },
          { text: n(qr.packingCost), alignment: 'right' },
          { text: n(qr.subtotal), alignment: 'right', bold: true },
        ]);
      });
      if (costRows.length > 1) {
        content.push({ table: { headerRows: 1, widths: [40,45,45,40,40,35,45,35,40,50], body: costRows }, layout: tblLayout, fontSize: 7, margin: [0, 0, 0, 4] });
      }
    });

    // Grand total
    content.push({ text: 'Grand Total', bold: true, fontSize: 11, color: headerFill, margin: [0, 6, 0, 3] });
    const totalRows = [hdr(['Qty', 'Material', 'Production', 'Packing', 'Delivery', 'ProcInfo', 'Marking%', 'Tax', 'Total', 'Unit Price'])];
    est.totals.forEach(t => {
      totalRows.push([
        { text: t.qty.toLocaleString(), alignment: 'right' },
        { text: n(t.materialTotal), alignment: 'right' },
        { text: n(t.productionTotal), alignment: 'right' },
        { text: n(t.packingTotal), alignment: 'right' },
        { text: n(t.deliveryTotal), alignment: 'right' },
        { text: n(t.processInfoTotal), alignment: 'right' },
        { text: `${t.markingPercent||0}%`, alignment: 'center' },
        { text: n(t.tax), alignment: 'right' },
        { text: n(t.finalPrice), alignment: 'right', bold: true },
        { text: t.unitPrice.toFixed(4), alignment: 'right', bold: true },
      ]);
    });
    content.push({ table: { headerRows: 1, widths: [38,45,48,42,42,40,32,38,50,48], body: totalRows }, layout: tblLayout, fontSize: 7, margin: [0, 0, 0, 4] });

    // Thai baht text for last total
    const lastT = est.totals[est.totals.length - 1];
    if (lastT && typeof bahtText === 'function') {
      content.push({ text: `( ${bahtText(lastT.finalPrice)} )`, fontSize: 9, italics: true, color: '#333', margin: [0, 2, 0, 6] });
    }
  }

  // Section 7: Delivery
  if (f.delivery.length) {
    content.push({ text: '7. Delivery', style: 'sectionHeader', margin: [0, 8, 0, 4] });
    const delivRows = [hdr(['Round', 'Destination', 'Province', 'Due Date', 'Weight (kg)'])];
    f.delivery.forEach(d => {
      delivRows.push([d.round||'-', d.destinationName||'-', d.province||'-', d.dueDate||'-', d.net_weight ? n(d.net_weight) : '-']);
      if (d.split_delivery?.enabled && d.split_delivery.items?.length) {
        d.split_delivery.items.forEach((s, si) => {
          delivRows.push([{ text: `  Split ${si+1}`, colSpan: 2, color: '#666', fontSize: 7 }, {}, s.remark||'-', s.date||'-', s.qty ? s.qty.toLocaleString() : '-']);
        });
      }
    });
    content.push({ table: { headerRows: 1, widths: [40, '*', 80, 70, 55], body: delivRows }, layout: tblLayout, fontSize: 9, margin: [0, 0, 0, 6] });
  }

  // Section 8: Other Costs
  const hasOther = (f.otherCost?.length) || (f.priceDiff?.length) || (f.customer_gift?.length);
  if (hasOther) {
    content.push({ text: '8. Other Costs / Adjustments', style: 'sectionHeader', margin: [0, 8, 0, 4] });
    if (f.otherCost?.length) {
      const ocBody = [hdr(['Name', 'Qty', 'Unit Price', 'Total'])];
      f.otherCost.forEach(oc => ocBody.push([oc.name||'-', oc.qty||'-', n(oc.unit_price), n(oc.total)]));
      content.push({ table: { headerRows: 1, widths: ['*', 50, 70, 70], body: ocBody }, layout: tblLayout, fontSize: 8, margin: [0, 0, 0, 3] });
    }
    if (f.priceDiff?.length) {
      content.push({ text: 'Price Difference:', bold: true, fontSize: 8, margin: [0, 3, 0, 2] });
      f.priceDiff.forEach(pd => content.push({ text: `  ${pd.name||'-'}: ${n(pd.amount)}`, fontSize: 8 }));
    }
    if (f.customer_gift?.length) {
      content.push({ text: 'Customer Gift:', bold: true, fontSize: 8, margin: [0, 3, 0, 2] });
      f.customer_gift.forEach(g => content.push({ text: `  ${g.name||'-'}: ${n(g.total)}`, fontSize: 8 }));
    }
  }

  // Section 9: Remarks
  if (f.remark || f.remark_ae) {
    content.push({ text: '9. Remarks', style: 'sectionHeader', margin: [0, 10, 0, 4] });
    if (f.remark) content.push({ text: f.remark, fontSize: 9, margin: [0, 0, 0, 3] });
    if (f.remark_ae) content.push({ text: `AE: ${f.remark_ae}`, fontSize: 9, color: '#666', margin: [0, 0, 0, 3] });
  }

  // Signature area
  content.push({ text: '', margin: [0, 20, 0, 0] });
  content.push({ columns: [
    { width: '33%', stack: [{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 0.5 }], margin: [0, 30, 0, 3] }, { text: 'Estimator', alignment: 'center', fontSize: 9 }, { text: f.estimator?.emp_name || '________________', alignment: 'center', fontSize: 8, color: '#666' }] },
    { width: '33%', stack: [{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 0.5 }], margin: [0, 30, 0, 3] }, { text: 'AE', alignment: 'center', fontSize: 9 }, { text: f.ae?.emp_name || '________________', alignment: 'center', fontSize: 8, color: '#666' }] },
    { width: '33%', stack: [{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 0.5 }], margin: [0, 30, 0, 3] }, { text: 'Approved By', alignment: 'center', fontSize: 9 }, { text: '________________', alignment: 'center', fontSize: 8, color: '#666' }] },
  ]});

  const docDefinition = {
    content,
    styles: {
      header: { fontSize: 16, bold: true, color: headerFill, margin: [0, 0, 0, 2] },
      subheader: { fontSize: 10, color: '#666', margin: [0, 0, 0, 3] },
      sectionHeader: { fontSize: 11, bold: true, color: '#3a1f5e' },
    },
    defaultStyle: { fontSize: 9 },
    pageSize: 'A4',
    pageMargins: [30, 30, 30, 35],
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `RFQ: ${f.rfq_id || 'DRAFT'} | ${f.job_name || '-'}`, fontSize: 7, color: '#999', margin: [30, 0, 0, 0] },
        { text: `Page ${currentPage}/${pageCount} | Pornchai RFQ Agent`, alignment: 'right', fontSize: 7, color: '#999', margin: [0, 0, 30, 0] },
      ],
    }),
  };

  pdfMake.createPdf(docDefinition).download(`RFQ_Spec_${f.rfq_id || f.job_name || 'draft'}_${today}.pdf`);
  toast('สร้าง PDF Spec Sheet สำเร็จ!', 'success');
}

// ============================================================
// LOGIN / LOGOUT
// ============================================================
function showLogin() {
  $('detailContent').innerHTML = `
    <div style="max-width:360px;margin:60px auto;text-align:center">
      <div style="width:80px;height:80px;margin:0 auto 20px">${PORNCHAI_SVG}</div>
      <h4 style="color:var(--text-primary);margin-bottom:20px">เข้าสู่ระบบ</h4>
      <div style="text-align:left;margin-bottom:12px">
        <label style="font-size:12px;font-weight:600;color:var(--text-secondary)">Username</label>
        <input class="form-input" id="loginUser" placeholder="รหัสพนักงาน" style="margin-top:4px">
      </div>
      <div style="text-align:left;margin-bottom:16px">
        <label style="font-size:12px;font-weight:600;color:var(--text-secondary)">Password</label>
        <input class="form-input" id="loginPass" type="password" placeholder="รหัสผ่าน" style="margin-top:4px">
      </div>
      <button class="primary-action" onclick="App.doLogin()" style="width:100%"><i class="fas fa-sign-in-alt"></i> เข้าสู่ระบบ</button>
      <p style="font-size:11px;color:var(--text-muted);margin-top:12px">ใช้รหัสพนักงานและรหัสผ่านเดียวกับระบบ Estimate</p>
    </div>`;
  showView('viewDetail');
  setTopBar('เข้าสู่ระบบ', 'Pornchai RFQ Agent');
}

async function doLogin() {
  const user = $('loginUser')?.value;
  const pass = $('loginPass')?.value;
  if (!user || !pass) { toast('กรุณากรอก Username และ Password', 'error'); return; }
  toast('กำลังเข้าสู่ระบบ...', 'info');
  try {
    const res = await apiPost('/api/user/login', { username: user, password: pass });
    if (res.accessToken) {
      // Store session
      State.session = {
        token: res.accessToken,
        user: res.user?.data?.[0] || {},
        loggedIn: true,
      };
      localStorage.setItem('rfq_session', JSON.stringify(State.session));
      toast(`เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ ${State.session.user.emp_name || user}`, 'success');
      updateSessionUI();
      goHome();
    } else {
      toast('Username หรือ Password ไม่ถูกต้อง', 'error');
    }
  } catch {
    toast('ไม่สามารถเชื่อมต่อระบบได้', 'error');
  }
}

function doLogout() {
  State.session = null;
  localStorage.removeItem('rfq_session');
  updateSessionUI();
  toast('ออกจากระบบแล้ว', 'info');
  showLogin();
}

function updateSessionUI() {
  const userEl = document.querySelector('.user-info');
  if (userEl && State.session?.loggedIn) {
    userEl.innerHTML = `<span style="font-size:12px;color:var(--text-secondary)"><i class="fas fa-user"></i> ${escapeHtml(State.session.user.emp_name || '')} </span><button class="text-btn" onclick="App.doLogout()" style="font-size:11px;color:var(--text-muted)"><i class="fas fa-sign-out-alt"></i></button>`;
  }
}

function restoreSession() {
  try {
    const saved = localStorage.getItem('rfq_session');
    if (saved) {
      State.session = JSON.parse(saved);
      updateSessionUI();
    }
  } catch {}
}

function requireLogin() {
  if (!State.session?.loggedIn) {
    showLogin();
    return false;
  }
  return true;
}

// ============================================================
// LAYOUT INTERACTIVE CONTROLS (matching legacy system)
// ============================================================
/**
 * Custom paper size input (#90) — recalculate layout with user-entered paper size
 */
function onCustomPaperSize(ri) {
  if (!State.form) return;
  const pw = parseFloat(document.getElementById(`layPaperW_${ri}`)?.value) || 0;
  const pl = parseFloat(document.getElementById(`layPaperL_${ri}`)?.value) || 0;
  if (pw <= 0 || pl <= 0) return;

  // Set std paper dropdown to "custom"
  const sel = document.getElementById(`layStdPaper_${ri}`);
  if (sel) sel.value = '__custom__';

  // Store custom paper size on State for CalcEngine
  State._customPaperSize = { w_in: pw, l_in: pl, w_mm: pw * 25.4, l_mm: pl * 25.4 };
  calculateLayout(true); // skip overlay
}

function onStdPaperChange(ri) {
  const sel = document.getElementById(`layStdPaper_${ri}`);
  if (!sel || !State.layoutResults?.[ri]) return;

  if (sel.value === '__custom__') {
    // Custom: highlight Paper Size inputs + focus
    const wEl = document.getElementById(`layPaperW_${ri}`);
    const lEl = document.getElementById(`layPaperL_${ri}`);
    if (wEl) { wEl.style.background = '#ffe0e0'; wEl.value = ''; wEl.focus(); }
    if (lEl) { lEl.style.background = '#ffe0e0'; lEl.value = ''; }
    const label = document.getElementById(`layPaperLabel_${ri}`);
    if (label) label.textContent = '(กรอกขนาดแล้วกด Enter)';
    return;
  }

  // Clear custom paper size — กลับมาใช้ std paper
  delete State._customPaperSize;

  const lay = State.layoutResults[ri];
  const match = lay.all?.find(p => p.sheetName === sel.value && !p.rotated) || lay.all?.find(p => p.sheetName === sel.value);
  if (match) {
    // Update Paper Size inputs
    const pw = Math.round(match.rollW_in || match.paperW_in || match.sheetW / 25.4);
    const pl = Math.round(match.rollL_in || match.paperL_in || match.sheetL / 25.4);
    const wEl = document.getElementById(`layPaperW_${ri}`);
    const lEl = document.getElementById(`layPaperL_${ri}`);
    if (wEl) { wEl.value = pw; wEl.style.background = ''; }
    if (lEl) { lEl.value = pl; lEl.style.background = ''; }
    const label = document.getElementById(`layPaperLabel_${ri}`);
    if (label) label.textContent = `(${match.sheetName})`;

    // Apply layout
    const usedPT = lay._autoPrintType || State.form?.print_type || 'Offset';
    const tol = CalcEngine.CALC.tolerance[usedPT.toLowerCase()] || CalcEngine.CALC.tolerance.offset;
    const openW = lay.unfolded.openW, openL = lay.unfolded.openL;
    const printW = match.nw * openW, printL = match.nl * openL;
    const shortComp = tol.gripper + tol.color_bar, longComp = tol.paper_edge * 2;
    if (printW <= printL) { match.layoutW_mm = printW + shortComp; match.layoutL_mm = printL + longComp; }
    else { match.layoutW_mm = printW + longComp; match.layoutL_mm = printL + shortComp; }
    match.printW_mm = printW; match.printL_mm = printL;

    // Recalculate Corrugated Board size for new layout
    const comp = State.form?.components?.[ri];
    const compType = comp?.component_type || 1;
    if (compType === 2 || compType === 3) {
      const fluteSide = comp?.corrugated?.flute_side || 'long_side';
      const isManual = !!comp?.box_type?.is_manual_layout;
      const layWIn = match.layoutW_mm / 25.4;
      const layLIn = match.layoutL_mm / 25.4;
      const laying = match.layoutW_mm <= match.layoutL_mm ? 'vertical' : 'horizontal';
      match.corrugatedBoard = CalcEngine.calcCorrugatedBoardSize(layWIn, layLIn, fluteSide, laying, isManual, compType);
    }

    lay.best = match;
    rerenderLayoutFromState();
  }
}

function onCustomPaperChange(ri) {
  // User กรอก Paper Size เอง + กด Enter → recalculate layout
  const wEl = document.getElementById(`layPaperW_${ri}`);
  const lEl = document.getElementById(`layPaperL_${ri}`);
  if (!wEl || !lEl || !State.form) return;

  const pw_in = parseInt(wEl.value) || 0;
  const pl_in = parseInt(lEl.value) || 0;

  // ต้องกรอกครบทั้ง 2 ช่อง
  if (pw_in <= 0 || pl_in <= 0) {
    toast('กรุณากรอก Paper Size ทั้ง 2 ช่อง แล้วกด Enter', 'warning');
    return;
  }

  // Set dropdown to "custom"
  const sel = document.getElementById(`layStdPaper_${ri}`);
  if (sel) sel.value = '__custom__';

  // Update label
  const label = document.getElementById(`layPaperLabel_${ri}`);
  if (label) label.textContent = `(Custom ${pw_in}"×${pl_in}")`;

  // Store custom paper size and recalculate
  State._customPaperSize = { w_in: pw_in, l_in: pl_in, w_mm: pw_in * 25.4, l_mm: pl_in * 25.4 };
  calculateLayout(true);
}

function onMachineChange(ri) {
  // When user selects a different machine, recalculate layout with that machine
  const sel = document.getElementById(`layMachine_${ri}`);
  if (!sel || !State.form) return;
  const machineId = sel.value;
  const machine = CalcEngine.getMachine(machineId);
  if (machine) {
    State.form.machine_id = machineId;
    calculateLayout(true); // skip overlay on machine change
  }
}

function onLayoutRecalc(ri) {
  // Recalculate layout (handles custom paper size, grain, tolerances)
  if (!State.form) return;
  // Check if custom tolerance is enabled
  const customTolChk = document.getElementById(`layCustomTol_${ri}`);
  if (customTolChk?.checked) {
    const gripper = parseFloat(document.getElementById(`layGripper_${ri}`)?.value) || 12;
    const color_bar = parseFloat(document.getElementById(`layColorBar_${ri}`)?.value) || 8;
    const paper_edge = parseFloat(document.getElementById(`layPaperEdge_${ri}`)?.value) || 4;
    const bleed = parseFloat(document.getElementById(`layBleed_${ri}`)?.value) || 3;
    // Store custom tolerances on State for this component
    State._customTolerance = { gripper, color_bar, paper_edge };
    State._customBleed = bleed;
  } else {
    delete State._customTolerance;
    delete State._customBleed;
  }
  calculateLayout(true); // skip overlay on recalc
}

// Legacy-compatible: NW/NL change triggers full recalc
function onManualUpsChange(ri) {
  _updateManualRealtime(ri);
}

// Legacy-compatible: Layout Size / Paper Size change triggers full recalc
function onManualCalcChange(ri) {
  _updateManualRealtime(ri);
}

/**
 * Core real-time update for Manual Layout — called on EVERY input change (oninput)
 * Reads all manual fields → stores in box_type → recalculates → updates DOM in-place
 * Does NOT full re-render (preserves focus/cursor position)
 */
function _updateManualRealtime(ri) {
  if (!State.form?.components?.[ri]) return;
  const c = State.form.components[ri];
  const bt = c.box_type || {};

  // 1. Read all manual inputs from DOM
  const nw = parseInt(document.getElementById(`layManNW_${ri}`)?.value) || 1;
  const nl = parseInt(document.getElementById(`layManNL_${ri}`)?.value) || 1;

  // Auto-format all 4 inch inputs (Layout W/L, Paper W/L): "4444" → "44.44"
  let layW = _autoFormatInch(document.getElementById(`layLayoutW_${ri}`));
  let layL = _autoFormatInch(document.getElementById(`layLayoutL_${ri}`));
  const papW = _autoFormatInch(document.getElementById(`layPaperW_${ri}`));
  const papL = _autoFormatInch(document.getElementById(`layPaperL_${ri}`));

  // 2. Store in box_type
  bt.manual_nw = nw;
  bt.manual_nl = nl;
  if (layW > 0) bt.manual_layout_w_in = layW; else delete bt.manual_layout_w_in;
  if (layL > 0) bt.manual_layout_l_in = layL; else delete bt.manual_layout_l_in;
  if (papW > 0) bt.manual_paper_w_in = papW; else delete bt.manual_paper_w_in;
  if (papL > 0) bt.manual_paper_l_in = papL; else delete bt.manual_paper_l_in;
  c.box_type = bt;

  // 3. Recalculate via CalcEngine (for paper table etc.)
  const printType = State.form.print_type || 'Offset';
  const machine = State.layoutResults?.[ri]?.machine || CalcEngine.selectMachine(c, printType);
  const layout = CalcEngine.calcLayout(c, printType, machine);
  layout.machine = machine;
  c._layout = layout;
  State.layoutResults[ri] = layout;

  // 4. Update grain/flute dropdown options (show "ขนานด้าน XX.XX"" when Layout Size is filled)
  const grainW = document.getElementById(`layGrainW_${ri}`);
  const grainL = document.getElementById(`layGrainL_${ri}`);
  if (grainW) { grainW.textContent = layW ? `ขนานด้าน ${layW}"` : ''; grainW.style.display = layW ? '' : 'none'; }
  if (grainL) { grainL.textContent = layL ? `ขนานด้าน ${layL}"` : ''; grainL.style.display = layL ? '' : 'none'; }
  const fluteW = document.getElementById(`layFluteW_${ri}`);
  const fluteL = document.getElementById(`layFluteL_${ri}`);
  if (fluteW) { fluteW.textContent = layW ? `ขนานด้าน ${layW}"` : ''; fluteW.style.display = layW ? '' : 'none'; }
  if (fluteL) { fluteL.textContent = layL ? `ขนานด้าน ${layL}"` : ''; fluteL.style.display = layL ? '' : 'none'; }

  // 5. Get grain/flute selections
  const grainSel = document.getElementById(`layGrain_${ri}`)?.value || '';
  const fluteSel = document.getElementById(`layFluteSide_${ri}`)?.value || '';

  // 6. Draw legacy-style diagram (white box + arrow + dimensions + flute hatch)
  _drawManualCanvas(ri, layW, layL, papW, papL, nw, nl, grainSel, fluteSel);

  // 7. Update UPS display
  const upsEl = document.getElementById(`manualUps_${ri}`);
  if (upsEl) upsEl.innerHTML = `<b style="color:var(--accent);font-size:16px">${nw} x ${nl} = ${nw * nl} ดวง</b>`;

  // 8. Grain info text
  const grainInfoEl = document.getElementById(`manualGrainInfo_${ri}`);
  if (grainInfoEl) {
    if (grainSel && layW > 0 && layL > 0) {
      const grainDir = grainSel === 'WSize' ? 'แนวตั้ง' : 'แนวนอน';
      grainInfoEl.innerHTML = `ถูกเกรน : เกรนชิ้นงาน${grainDir} เกรนกระดาษแนวนอน`;
    } else {
      grainInfoEl.innerHTML = '';
    }
  }

  // 9. Overflow warning
  const warnEl = document.getElementById(`manualWarning_${ri}`);
  if (warnEl) {
    let warnText = '';
    if (layW > 0 && papW > 0 && layW > papW) warnText = `ไม่สามารถวาง Lay. ได้ เนื่องจาก Layout Size (${layW}) มากกว่าขนาดกระดาษ (${papW})`;
    else if (layL > 0 && papL > 0 && layL > papL) warnText = `ไม่สามารถวาง Lay. ได้ เนื่องจาก Layout Size (${layL}) มากกว่าขนาดกระดาษ (${papL})`;
    warnEl.textContent = warnText;
  }

  // 10. Update paper table
  const ups = layout.best?.ups || 0;
  const qtys = State.form.qty.filter(q => q).map(q => parseInt(q));
  const tbody = document.getElementById(`paperTbody_${ri}`);
  if (tbody && ups > 0 && qtys.length > 0) {
    const paperResults = qtys.map(qty => CalcEngine.calcPaperUsage(qty, ups, c, printType));
    let rows = '';
    const compName = c.component_name || `Component ${ri + 1}`;
    paperResults.forEach(pr => {
      if (!pr) return;
      const split = pr.split || 1;
      const paperPrint = pr.paperPrint || pr.afterWaste;
      const paperQty = pr.paperQty || paperPrint;
      rows += `<tr>
        <td style="text-align:center;padding:5px 4px">${escapeHtml(compName)}</td>
        <td style="text-align:center;padding:5px 4px">${num(pr.qty)}</td>
        <td style="text-align:center;padding:5px 4px">${ups}</td>
        <td style="text-align:center;padding:5px 4px">${num(pr.afterUps)}</td>
        <td style="text-align:center;padding:5px 4px">${num(pr.waste.total)}</td>
        <td style="text-align:center;padding:5px 4px;color:var(--accent);font-weight:600">${num(pr.afterWaste)}</td>
        <td style="text-align:center;padding:5px 4px">1</td>
        <td style="text-align:center;padding:5px 4px">${num(paperPrint)}</td>
        <td style="text-align:center;padding:5px 4px;color:${split > 1 ? '#e67e22' : 'var(--accent)'};font-weight:600">${split}</td>
        <td style="text-align:center;padding:5px 4px;color:var(--accent);font-weight:600">${num(paperQty)}</td>
        <td style="text-align:center;padding:5px 4px"><b>${num(pr.paperNet)}</b></td>
        <td style="text-align:center;padding:5px 4px">${pr.weight_ton.toFixed(3)}</td>
      </tr>`;
    });
    tbody.innerHTML = rows;
  }
}

/**
 * Auto-format inch input (legacy behavior — runs on every keystroke via oninput):
 * - No decimal + integer >= 100 → insert decimal before last digit: "444" → "44.4"
 * - Has decimal → cap at 2 decimal places: "44.444" → "44.44"
 * - Returns parsed numeric value for CalcEngine
 */
function _autoFormatInch(el) {
  if (!el) return 0;
  let raw = el.value.trim();
  if (!raw) return 0;

  if (raw.includes('.')) {
    // Has decimal → cap at 2 decimal places
    const parts = raw.split('.');
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2);
      raw = parts.join('.');
      el.value = raw;
    }
    return parseFloat(raw) || 0;
  }

  // No decimal — pure integer
  const intVal = parseInt(raw);
  if (isNaN(intVal)) return 0;
  if (intVal >= 100) {
    // Insert decimal before last digit: "444" → "44.4", "4444" → "444.4"
    const formatted = (intVal / 10).toFixed(1);
    el.value = formatted;
    return parseFloat(formatted);
  }
  return intVal;
}

/**
 * Draw Manual Layout canvas — themed to match project design (purple accent)
 * Reads CSS variables from document for theme-aware rendering.
 */
function _drawManualCanvas(ri, layW, layL, papW, papL, nw, nl, grainSel, fluteSel) {
  const canvas = document.getElementById(`layoutCanvas_${ri}`);
  if (!canvas) return;

  // Read theme colors from CSS variables
  const cs = getComputedStyle(document.documentElement);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const colPrimary = cs.getPropertyValue('--primary').trim() || '#5b2d8e';
  const colAccent = cs.getPropertyValue('--accent').trim() || '#9b6dcc';
  const colText = isDark ? '#e0d4f0' : '#2d1b4e';
  const colMuted = isDark ? '#a090b8' : '#6b5f78';
  const colBorder = isDark ? '#5b3d8e' : '#9b6dcc';
  const colBg = isDark ? '#211832' : '#ffffff';
  const colSheetFill = isDark ? '#2d1b4e' : '#faf8fc';
  const colGrid = isDark ? 'rgba(155,109,204,0.15)' : 'rgba(91,45,142,0.06)';

  const W = 320, H = 240;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.fillStyle = colBg;
  ctx.fillRect(0, 0, W, H);

  const pad = { top: 28, left: 55, right: 18, bottom: 18 };
  const boxW = W - pad.left - pad.right;
  const boxH = H - pad.top - pad.bottom;
  const ox = pad.left, oy = pad.top;

  // 1. Sheet fill (subtle tinted background)
  ctx.fillStyle = colSheetFill;
  ctx.fillRect(ox, oy, boxW, boxH);

  // 2. Grid dots (subtle pattern inside sheet)
  ctx.fillStyle = colGrid;
  for (let gx = ox + 12; gx < ox + boxW; gx += 18) {
    for (let gy = oy + 12; gy < oy + boxH; gy += 18) {
      ctx.beginPath(); ctx.arc(gx, gy, 0.8, 0, Math.PI * 2); ctx.fill();
    }
  }

  // 3. Sheet border (accent color, rounded feel via double line)
  ctx.strokeStyle = colBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(ox, oy, boxW, boxH);
  // Inner shadow line
  ctx.strokeStyle = isDark ? 'rgba(155,109,204,0.15)' : 'rgba(91,45,142,0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(ox + 2, oy + 2, boxW - 4, boxH - 4);

  // 4. Grain arrow ► — accent colored, on top border
  ctx.fillStyle = colPrimary;
  ctx.beginPath();
  ctx.moveTo(ox + 26, oy);
  ctx.lineTo(ox + 10, oy - 8);
  ctx.lineTo(ox + 10, oy + 8);
  ctx.closePath();
  ctx.fill();
  // Arrow stem
  ctx.strokeStyle = colPrimary; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + 10, oy); ctx.stroke();

  // 5. Flute hatch — quarter circle at bottom-right
  if (fluteSel) {
    const hR = Math.min(boxW * 0.14, boxH * 0.16, 36);
    const cx = ox + boxW, cy = oy + boxH;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, hR, Math.PI, Math.PI * 1.5, false);
    ctx.closePath();
    ctx.clip();
    ctx.strokeStyle = isDark ? '#7b5daa' : '#8b6db8'; ctx.lineWidth = 1;
    if (fluteSel === 'WSize') {
      // Flute parallel to W (vertical) → vertical lines |||
      for (let d = -hR; d < hR; d += 3.5) { ctx.beginPath(); ctx.moveTo(cx + d, cy - hR); ctx.lineTo(cx + d, cy); ctx.stroke(); }
    } else {
      // Flute parallel to L (horizontal) → horizontal lines ≡
      for (let d = -hR; d < hR; d += 3.5) { ctx.beginPath(); ctx.moveTo(cx - hR, cy + d); ctx.lineTo(cx, cy + d); ctx.stroke(); }
    }
    ctx.restore();
    // Arc outline
    ctx.strokeStyle = colBorder; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, hR, Math.PI, Math.PI * 1.5, false);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.stroke();
  }

  // 6. Dimension labels — styled with theme colors
  // Top: "55.55 (66.66)"
  let topLabel = '';
  if (layL) topLabel += layL;
  if (papL) topLabel += ` (${papL})`;
  if (topLabel.trim()) {
    ctx.fillStyle = colText;
    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(topLabel, ox + boxW / 2, oy - 8);
  }

  // Left: "44.44\n(55.5)"
  const midY = oy + boxH / 2;
  if (layW) {
    ctx.fillStyle = colText;
    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText(`${layW}`, ox - 8, midY - 2);
  }
  if (papW) {
    ctx.fillStyle = colMuted;
    ctx.font = '10px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText(`(${papW})`, ox - 8, midY + 2);
  }

  // 7. NW×NL info — bottom center, subtle
  if (nw > 0 && nl > 0) {
    ctx.fillStyle = colMuted;
    ctx.font = '10px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(`${nw} × ${nl} = ${nw * nl} ดวง`, ox + boxW / 2, oy + boxH + 5);
  }
}

function toggleManualLayout(ri, checked) {
  if (!State.form?.components?.[ri]) return;
  const bt = State.form.components[ri].box_type || {};
  bt.is_manual_layout = checked;
  if (checked) {
    // Manual mode: all fields start EMPTY (like legacy)
    bt.manual_nw = 1;
    bt.manual_nl = 1;
    delete bt.manual_layout_w_in;
    delete bt.manual_layout_l_in;
    delete bt.manual_paper_w_in;
    delete bt.manual_paper_l_in;
  } else {
    // Switching back to auto — clear manual overrides
    delete bt.manual_layout_w_in;
    delete bt.manual_layout_l_in;
    delete bt.manual_paper_w_in;
    delete bt.manual_paper_l_in;
  }
  State.form.components[ri].box_type = bt;
  calculateLayout(true);
  // Init manual layout canvas + grain/flute options after DOM renders
  if (checked) setTimeout(() => _updateManualRealtime(ri), 50);
}

function onManualLayoutToggle(ri) {
  const chk = document.getElementById(`layManual_${ri}`);
  const nwInput = document.getElementById(`layNW_${ri}`);
  const nlInput = document.getElementById(`layNL_${ri}`);
  if (chk && nwInput && nlInput) {
    nwInput.readOnly = !chk.checked;
    nlInput.readOnly = !chk.checked;
    if (chk.checked) {
      nwInput.style.background = 'var(--bg-primary)';
      nlInput.style.background = 'var(--bg-primary)';
    } else {
      nwInput.style.background = 'var(--bg-secondary)';
      nlInput.style.background = 'var(--bg-secondary)';
    }
  }
}

function onManualLayoutChange(ri) {
  const nw = parseInt(document.getElementById(`layNW_${ri}`)?.value) || 1;
  const nl = parseInt(document.getElementById(`layNL_${ri}`)?.value) || 1;
  if (!State.layoutResults?.[ri]) return;
  const lay = State.layoutResults[ri];
  lay.best.nw = nw;
  lay.best.nl = nl;
  lay.best.ups = nw * nl;
  const usedPT = lay._autoPrintType || State.form?.print_type || 'Offset';
  const tol = CalcEngine.CALC.tolerance[usedPT.toLowerCase()] || CalcEngine.CALC.tolerance.offset;
  const printW = nw * lay.unfolded.openW, printL = nl * lay.unfolded.openL;
  const shortComp = tol.gripper + tol.color_bar, longComp = tol.paper_edge * 2;
  lay.best.layoutW_mm = printW + shortComp;
  lay.best.layoutL_mm = printL + longComp;
  rerenderLayoutFromState();
}

function onSwapLayout(ri) {
  if (!State.layoutResults?.[ri]) return;
  const lay = State.layoutResults[ri];
  const all = lay.all || [];

  // === Strategy ===
  // 1. ลอง find rotated alternative ใน lay.all ก่อน (ใช้ size + ups เดียวกัน แต่ rotated ต่าง)
  // 2. ถ้าไม่เจอ → swap nw↔nl ของ best (กรณี nw≠nl)
  // 3. ถ้า nw=nl → toggle rotated flag + recompute (จะหมุน orientation ของชิ้นงาน)

  const b = lay.best;
  const currentSheetName = b.sheetName;
  const currentRotated = b.rotated;

  // Strategy 1: หา rotated counterpart ใน alternatives
  let swapped = null;
  for (const alt of all) {
    if (alt === b) continue;
    if (alt.sheetName === currentSheetName && !!alt.rotated !== !!currentRotated) {
      swapped = alt;
      break;
    }
  }

  if (swapped) {
    // Found rotated version — use it
    lay.best = swapped;
    // Recompute layout dimensions for new best
    const usedPT2 = lay._autoPrintType || State.form?.print_type || 'Offset';
    const tol2 = CalcEngine.CALC.tolerance[usedPT2.toLowerCase()] || CalcEngine.CALC.tolerance.offset;
    const openW2 = swapped.rotated ? lay.unfolded.openL : lay.unfolded.openW;
    const openL2 = swapped.rotated ? lay.unfolded.openW : lay.unfolded.openL;
    const printW2 = swapped.nw * openW2;
    const printL2 = swapped.nl * openL2;
    const shortComp2 = tol2.gripper + tol2.color_bar;
    const longComp2 = tol2.paper_edge * 2;
    if (printW2 <= printL2) {
      swapped.layoutW_mm = printW2 + shortComp2;
      swapped.layoutL_mm = printL2 + longComp2;
    } else {
      swapped.layoutW_mm = printW2 + longComp2;
      swapped.layoutL_mm = printL2 + shortComp2;
    }
    swapped.printW_mm = printW2;
    swapped.printL_mm = printL2;

    // Recompute corrugated board size if component_type 2/3
    const compS = State.form?.components?.[ri];
    if (compS && (compS.component_type === 2 || compS.component_type === 3) && typeof CalcEngine?.calcCorrugatedBoardSize === 'function') {
      const fluteSide = compS.corrugated?.flute_side || 'long_side';
      const layWIn = swapped.layoutW_mm / 25.4;
      const layLIn = swapped.layoutL_mm / 25.4;
      const laying = swapped.layoutW_mm <= swapped.layoutL_mm ? 'vertical' : 'horizontal';
      try {
        swapped.corrugatedBoard = CalcEngine.calcCorrugatedBoardSize(layWIn, layLIn, fluteSide, laying, false, compS.component_type);
      } catch (e) { console.warn('[onSwapLayout] corrugated recompute failed:', e); }
    }

    rerenderLayoutFromState();
    toast(`สลับด้าน layout: ${swapped.nw}×${swapped.nl} = ${swapped.ups} ดวง (${swapped.rotated ? 'rotated' : 'normal'})`, 'success');
    return;
  }

  // Strategy 2: Swap nw and nl (legacy behavior)
  // Strategy 3: ถ้า nw === nl → toggle rotated เพื่อหมุน orientation ของชิ้นงาน
  const wasEqual = b.nw === b.nl;
  if (wasEqual) {
    // Toggle rotated → ชิ้นงานหมุน 90° → recalc fit ใหม่
    b.rotated = !b.rotated;
    // เมื่อ rotated เปลี่ยน → recompute fit ในกระดาษ (อาจได้ ups ใหม่)
    // ใช้ tryLayout จาก calc engine ถ้ามี
    if (typeof CalcEngine?.tryLayoutOnSheet === 'function') {
      const sheetW = b.sw, sheetL = b.sl;
      const openW = b.rotated ? lay.unfolded.openL : lay.unfolded.openW;
      const openL = b.rotated ? lay.unfolded.openW : lay.unfolded.openL;
      const newNw = Math.floor(sheetW / openW);
      const newNl = Math.floor(sheetL / openL);
      if (newNw > 0 && newNl > 0) {
        b.nw = newNw;
        b.nl = newNl;
        b.ups = newNw * newNl;
      }
    } else {
      // Fallback: คำนวณ fit ด้วยมือ
      const sheetW = b.sw || 0, sheetL = b.sl || 0;
      const openW_new = b.rotated ? lay.unfolded.openL : lay.unfolded.openW;
      const openL_new = b.rotated ? lay.unfolded.openW : lay.unfolded.openL;
      if (sheetW > 0 && sheetL > 0) {
        const newNw = Math.floor(sheetW / openW_new);
        const newNl = Math.floor(sheetL / openL_new);
        if (newNw > 0 && newNl > 0) {
          b.nw = newNw;
          b.nl = newNl;
          b.ups = newNw * newNl;
        }
      }
    }
  } else {
    // nw ≠ nl → swap ตามปกติ
    const tmpNw = b.nw; b.nw = b.nl; b.nl = tmpNw;
    b.ups = b.nw * b.nl;
  }

  // Recompute layout dimensions
  const usedPT = lay._autoPrintType || State.form?.print_type || 'Offset';
  const tol = CalcEngine.CALC.tolerance[usedPT.toLowerCase()] || CalcEngine.CALC.tolerance.offset;
  const openW = b.rotated ? lay.unfolded.openL : lay.unfolded.openW;
  const openL = b.rotated ? lay.unfolded.openW : lay.unfolded.openL;
  let printW, printL;
  if (b.layingType === 'overlap' && b._boxW) {
    const bw = b._boxW, bl = b._boxL, owS = b._overlapW || 0, olS = b._overlapL || 0;
    printW = owS > 0 && b.nw > 1 ? bw + (b.nw - 1) * (bw - owS) : b.nw * bw;
    printL = olS > 0 && b.nl > 1 ? bl + (b.nl - 1) * (bl - olS) : b.nl * bl;
  } else {
    printW = b.nw * openW; printL = b.nl * openL;
  }
  const shortComp = tol.gripper + tol.color_bar, longComp = tol.paper_edge * 2;
  b.layoutW_mm = printW + shortComp;
  b.layoutL_mm = printL + longComp;
  b.printW_mm = printW;
  b.printL_mm = printL;

  // Recompute corrugated board size if component_type 2/3
  const comp = State.form?.components?.[ri];
  if (comp && (comp.component_type === 2 || comp.component_type === 3) && typeof CalcEngine?.calcCorrugatedBoardSize === 'function') {
    const fluteSide = comp.corrugated?.flute_side || 'long_side';
    const layWIn = b.layoutW_mm / 25.4;
    const layLIn = b.layoutL_mm / 25.4;
    const laying = b.layoutW_mm <= b.layoutL_mm ? 'vertical' : 'horizontal';
    try {
      b.corrugatedBoard = CalcEngine.calcCorrugatedBoardSize(layWIn, layLIn, fluteSide, laying, false, comp.component_type);
    } catch (e) { console.warn('[onSwapLayout] corrugated recompute failed:', e); }
  }

  rerenderLayoutFromState();

  if (wasEqual) {
    toast(`หมุน orientation: ${b.nw}×${b.nl} = ${b.ups} ดวง`, 'success');
  } else {
    toast(`สลับด้าน: ${b.nw}×${b.nl} = ${b.ups} ดวง`, 'success');
  }
}

function onCustomTolToggle(ri) {
  const chk = document.getElementById(`layCustomTol_${ri}`);
  ['layGripper_', 'layColorBar_', 'layPaperEdge_', 'layBleed_'].forEach(prefix => {
    const inp = document.getElementById(prefix + ri);
    if (inp) {
      inp.readOnly = !chk?.checked;
      inp.style.background = chk?.checked ? 'var(--bg-primary)' : 'var(--bg-secondary)';
    }
  });
}

// ============================================================
// PUBLIC API (window.App)
// ============================================================
window.App = {
  // Navigation & Views
  switchTab, filterRFQ, viewDetail, showRFQListView, showToolsTab, showAIBrain,
  // Navigation
  goHome, newRFQ, editRFQ, toggleChat, toggleSidebar, showPreview, backToForm, cancelForm,
  // Advanced search
  toggleAdvSearch, advSearch, clearAdvSearch,
  // Copy
  copyRFQ,
  // Export
  exportExcel,
  // Status workflow
  requestApprove, approveRFQ, rejectRFQ,
  // History
  viewHistory, viewVersionHistory,
  // Form
  setField, setQty, setRunOnValue, setComp, setCompSize, updateSizeCalc, setCorrugated, applyPendingSize, getState, setCompPaper, setCompColor, setCompCoating,
  setCompBoxType, setCompBoxField,
  setAddon, setAddonInfo, addAddon, removeAddon,
  setCompProc, addCompProc, removeCompProc,
  togglePacking, setCompPacking, setCompPackingInfo, addCompPacking, removeCompPacking,
  setProcInfo, setProcInfoLine, addProcInfo, removeProcInfo,
  setProcess, setDelivery, setDeliveryFlat, onDelivDestSelect, onDelivDateInput, onDelivDatePick, acDelivLocalSearch, acDelivLocalSelect, validateDelivDest, toggleSplitDelivery,
  addDeliveryRound, removeDeliveryRound, setDelivField, showDelivDropdown, filterDelivDropdown, selectDelivDest, hideDelivDropdown, setDelivFItem, addDelivFItem, removeDelivFItem,
  setArrayItem, addArrayItem, removeArrayItem, addAttachFile, addAttachSlot, onFileSelected, previewFile,
  addComponent, removeComponent,
  addProcess, removeProcess,
  addDelivery, removeDelivery,
  acBoxType,
  addFQty, removeFQty,
  // Multi-F
  addFCard, removeFCard, setFData, getFCodeList,
  // Color per-F
  addColorPerF, removeColorPerF, copyColorPerF, setColorPerF,
  addSpecialInkPerF, removeSpecialInkPerF, setSpecialInkPerF,
  // Addon from select dropdown
  addAddonFromSelect, addCoating, toggleAddon, addFoilStamp, removeAddon, setCoatingField, onCoatingCodeChange, onCoatingOptionChange, onFoilColorChange, onFoilCodeChange,
  // Customer Gift toggle
  toggleCustomerGift,
  // Special Ink
  addSpecialInk, removeSpecialInk, setSpecialInk, copySpecialInk,
  // Corrugated
  setCorrugated, setCorrugatedGrade,
  // Custom popups
  openPaperPopup, closePaperPopup, applyCustomPaper,
  openFoilPopup, closeFoilPopup, applyCustomFoil,
  // Customer
  lookupCustomer,
  // Autocomplete
  acSearch, acSelect, acDeliverySearch, acDeliverySelect,
  // Save
  saveRFQ, saveDraft, prepareDatatoDB,
  // Calculation
  calculateLayout, calculatePrice, recalcPrice, validateForm, verifyFormComplete, qtyCompare, qtyCompareSelect, qtyCompareAdd, qtyCompareRemove, qtyCompareEdit, applyQtyCompare, onMarkupChange, onKwPriceChange, onPackingNumChange, showPackingPopup, onTaxChange, onCurrencyChange, onCustomPaperChange,
  // PDF
  generatePDF, generateSummaryPDF, showFormula,
  // Login / Session
  showLogin, doLogin, doLogout, requireLogin,
  // Delete
  deleteRFQ,
  // File upload
  uploadAttachFile, removeAttachFile,
  // MI check
  checkMIStatus,
  // View-only + Status Manager
  viewOnlyRFQ, DocumentStatusManager,
  // Reject remarks
  viewRejectRemarks,
  // Wizard search
  openWizardSearch, doWizardSearch, loadWizardItem, wizardAISearch,
  // Process Info Builder
  ProcessInfoBuilder,
  // Packing auto-sizing
  calcPackingAutoSize,
  // Exchange rate
  fetchExchangeRate,
  // Canvas/PNG export
  exportLayoutPNG,
  // Layout interactive controls
  switchBoxView, refreshBoxViews, openBoxPopup, closeBoxPopup, _boxPopupSwitch, applyLayoutRecommendation, previewBoxF, uploadBoxArtwork, clearBoxArtwork,
  onCustomPaperSize, onStdPaperChange, onMachineChange, onLayoutRecalc, rerenderLayoutFromState,
  onManualUpsChange, onManualCalcChange, _updateManualRealtime, toggleManualLayout, onManualLayoutToggle, onManualLayoutChange, onSwapLayout, onCustomTolToggle,
  // Addon multi-size
  setAddonSize, addAddonSize, removeAddonSize, addAddonFCode, removeAddonFCode,
  // Split delivery
  setSplitDelivery, addSplitDelivery, removeSplitDelivery,
  // Quotation (full CRUD)
  viewQuotations, newQuotation, editQuotation, deleteQuotation, printQuotation,
  setQuote, setQuoteItem, addQuoteItem, removeQuoteItem, saveQuotation,
  // Thai Baht
  bahtText,
  // Master data
  viewMaster,
  // Master data CRUD
  viewMasterCRUD, mdSearch, mdSort, mdGoPage, mdRefreshData,
  mdOpenAdd, mdOpenEdit, mdSaveNew, mdSaveEdit,
  mdConfirmDelete, mdDoDelete, mdCloseModal,
  // Render
  renderForm,
  // Chat
  sendChat, sendChatText, autoFillMissing, startFillFlow, answerFillFlow, skipFillQuestion, handleChatKey, uploadFile, handleFile, choosePaperMapping, chooseUnmatchedPaper, chooseUnmatchedCoating, skipUnmatched, askCustomPaperPrice, toggleLayoutMethodology, setPackingView,
  // Agent bridge
  applyAgentData, getLastParsedData, confirmApply, doApply, applyAndAskBack,
  // Demo
  runDemo, showDemoMenu,
  // RFQ list
  loadRFQList,
  // RFQ Mode Selector
  renderChatWelcome, startNewRFQMode, startClassicRFQMode,
  // Smart Conversation
  handleSmartConvInput, smartConvQuickStart, smartConvApplyToForm, smartConvFlowComplete,
  showUnderstandingCard, showSmartSummary,
  // Legacy wizard (kept for compat)
  wzPickBox, wzPickSize, wzPickPaper, wzPickGsm, wzPickColor,
  wzToggleAddon, wzPickAddons, wzSkipAddons,
  wzPickQty, wzPickQtyCustom, wzStartOver,
  wizardApplyToForm,
  wizardNext, wizardBack, wizardFinish,
  wizardSetBoxType, wizardUpdateField, wizardUpdateSize,
  wizardSetPaper, wizardSetGsm, wizardSetCompType,
  wizardSetColor, wizardSetInk, wizardToggleAddon,
  wizardSetQty, wizardAddQty, wizardSetDelivery,
  // RAG Knowledge Base
  ragUploadFiles, ragLoadDocList, ragDeleteDoc, ragSearch, ragSearchPrice, ragShowDocManager,
  // Theme
  toggleTheme() {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
  },
};

// ============================================================
// THAI BAHT TEXT CONVERSION (C4)
// ============================================================
function bahtText(num) {
  if (isNaN(num) || num === null) return '';
  const txt = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const unit = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  num = Math.abs(parseFloat(num));
  const baht = Math.floor(num);
  const satang = Math.round((num - baht) * 100);

  function readNumber(n) {
    if (n === 0) return 'ศูนย์';
    let s = '';
    const nStr = String(n);
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const d = parseInt(nStr[i]);
      const pos = len - i - 1;
      if (d === 0) continue;
      if (pos === 0 && d === 1 && len > 1) s += 'เอ็ด';
      else if (pos === 1 && d === 2) s += 'ยี่สิบ';
      else if (pos === 1 && d === 1) s += 'สิบ';
      else s += txt[d] + unit[pos % 7];
      if (pos >= 7 && pos % 6 === 1) s += 'ล้าน';
    }
    return s;
  }

  let result = readNumber(baht) + 'บาท';
  if (satang === 0) result += 'ถ้วน';
  else result += readNumber(satang) + 'สตางค์';
  return result;
}

// ============================================================
// INPUT MASKS (C2)
// ============================================================
function applyInputMasks() {
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.matches || !el.matches('input')) return;
    const mask = el.dataset?.mask;
    if (!mask) return;

    if (mask === 'integer') {
      el.value = el.value.replace(/[^0-9]/g, '');
    } else if (mask === 'decimal') {
      el.value = el.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
    } else if (mask === 'money') {
      const v = el.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
      el.value = v;
    } else if (mask === 'color') {
      const v = parseInt(el.value) || 0;
      if (v > 8) el.value = '8';
      if (v < 0) el.value = '0';
    } else if (mask === 'percent') {
      const v = parseFloat(el.value) || 0;
      if (v > 100) el.value = '100';
      if (v < 0) el.value = '0';
    }
  });
}

// ============================================================
// QTY COMPARE — เปรียบเทียบราคาตามจำนวนสั่ง (card grid, real-time)
// ============================================================

/**
 * Scale Multi-F qty array proportionally to hit a target total.
 * Uses largest-remainder method to avoid rounding drift.
 */
function _scaleMultiFQtys(origProportions, origTotal, targetTotal) {
  if (!origProportions || origTotal <= 0) return origProportions || [];
  const ratio = targetTotal / origTotal;
  const raw = origProportions.map(function(q) { return q * ratio; });
  const floored = raw.map(function(r) { return Math.floor(r); });
  var remainder = targetTotal - floored.reduce(function(s, v) { return s + v; }, 0);
  // Distribute remainder to items with largest fractional parts
  var fracs = raw.map(function(r, i) { return { i: i, frac: r - Math.floor(r) }; });
  fracs.sort(function(a, b) { return b.frac - a.frac; });
  for (var k = 0; k < remainder && k < fracs.length; k++) {
    floored[fracs[k].i]++;
  }
  return floored;
}

// Helper: calculate price for a qty (instant, no UI)
function _calcQtyPrice(qty) {
  if (window._qtyCompareCache?.[qty]) return window._qtyCompareCache[qty];
  const f = State.form;
  if (!f) return { total: 0, unitPrice: 0 };
  const isMultiF = !!(f.has_multi_f && f.f_data?.length > 0 && f.f_data.some(fd => parseInt(fd.qty) > 0));
  let total = 0, unitPrice = 0;
  try {
    if (isMultiF) {
      const origProps = window._multiFOrigProportions || f.f_data.map(fd => parseInt(fd.qty) || 0);
      const origTotal = window._multiFOrigTotal || origProps.reduce((s, v) => s + v, 0);
      const scaled = _scaleMultiFQtys(origProps, origTotal, qty);
      const origFQtys = f.f_data.map(fd => fd.qty);
      f.f_data.forEach((fd, i) => { fd.qty = String(scaled[i]); });
      const est = CalcEngine.calcFullEstimate(f);
      const t0 = est.totals?.[0] || {};
      // Same formula as rendered summary (matl + prod + pack + deliv + other + processInfo + formProcess + gift + diff + tax)
      const sub = (t0.materialTotal||0) + (t0.productionTotal||0) + (t0.packingTotal||0) + (t0.deliveryTotal||0) + (t0.otherCostTotal||0) + (t0.processInfoTotal||0) + (t0.formProcessTotal||0) + (t0.giftTotal||0) + (t0.priceDiffTotal||0);
      const tax = sub * CalcEngine.CALC.tax_percent / 100;
      total = sub + tax;
      unitPrice = qty > 0 ? total / qty : 0;
      f.f_data.forEach((fd, i) => { fd.qty = origFQtys[i]; });
    } else {
      const origQty = [...f.qty];
      f.qty = [String(qty)];
      const est = CalcEngine.calcFullEstimate(f);
      const t0 = est.totals?.[0] || {};
      // Same formula as rendered summary
      const sub = (t0.materialTotal||0) + (t0.productionTotal||0) + (t0.packingTotal||0) + (t0.deliveryTotal||0) + (t0.otherCostTotal||0) + (t0.processInfoTotal||0) + (t0.formProcessTotal||0) + (t0.giftTotal||0) + (t0.priceDiffTotal||0);
      const tax = sub * CalcEngine.CALC.tax_percent / 100;
      total = sub + tax;
      unitPrice = qty > 0 ? total / qty : 0;
      f.qty = origQty;
    }
  } catch(e) {}
  if (!window._qtyCompareCache) window._qtyCompareCache = {};
  window._qtyCompareCache[qty] = { total: Math.round(total * 100) / 100, unitPrice: Math.round(unitPrice * 100) / 100 };
  return window._qtyCompareCache[qty];
}

function qtyCompare(qty) {
  if (qty && qty > 0) qtyCompareSelect(qty);
}

// Click card → popup confirm → apply
function qtyCompareSelect(qty) {
  if (!qty || qty <= 0 || !State.form) return;
  const f = State.form;
  const isMultiF = !!(f.has_multi_f && f.f_data?.length > 0 && f.f_data.some(fd => parseInt(fd.qty) > 0));
  const currentQty = isMultiF
    ? f.f_data.reduce((s, fd) => s + (parseInt(fd.qty) || 0), 0)
    : (parseInt(f.qty?.[0]) || 0);
  if (qty === currentQty) return; // already selected

  const { total, unitPrice } = _calcQtyPrice(qty);
  const M = v => (v||0).toLocaleString(undefined,{minimumFractionDigits:2});

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.15s';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  overlay.innerHTML = `
    <div style="background:var(--bg-card,#fff);border-radius:16px;padding:24px 28px;max-width:380px;width:90%;box-shadow:0 16px 48px rgba(0,0,0,0.25);text-align:center">
      <div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:12px">เปลี่ยนจำนวนสั่ง?</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px">
        <div style="text-align:center;padding:8px 16px;background:var(--bg-tertiary);border-radius:8px;opacity:0.6">
          <div style="font-size:10px;color:var(--text-muted)">ปัจจุบัน</div>
          <div style="font-size:18px;font-weight:700;color:var(--text-secondary)">${currentQty.toLocaleString()}</div>
        </div>
        <div style="font-size:20px;color:var(--accent)">→</div>
        <div style="text-align:center;padding:8px 16px;background:#f3f0ff;border:2px solid var(--accent);border-radius:8px">
          <div style="font-size:10px;color:var(--accent)">ใหม่</div>
          <div style="font-size:18px;font-weight:700;color:var(--accent)">${qty.toLocaleString()}</div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px">
        ราคารวม <b>${M(total)}</b> บาท | ต่อชิ้น <b>${unitPrice.toFixed(2)}</b> บาท
      </div>
      <div style="display:flex;gap:8px;justify-content:center">
        <button onclick="this.closest('div[style*=fixed]').remove()" style="padding:8px 20px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-secondary);color:var(--text-secondary);cursor:pointer;font-size:12px;font-weight:600">ยกเลิก</button>
        <button onclick="this.closest('div[style*=fixed]').remove();App.applyQtyCompare(${qty})" style="padding:8px 20px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:12px;font-weight:600">ใช้จำนวน ${qty.toLocaleString()} ชิ้น</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

// Add custom qty card
function qtyCompareAdd(qty) {
  if (!qty || qty <= 0) { toast('กรุณาระบุจำนวนที่ถูกต้อง', 'warning'); return; }
  if (document.querySelector(`#qtyCompareGrid [data-qty="${qty}"]`)) { toast('จำนวนนี้มีอยู่แล้ว', 'warning'); return; }
  const currentCards = document.querySelectorAll('#qtyCompareGrid [data-qty]').length;
  if (currentCards >= 16) { toast('เต็มแล้ว (สูงสุด 16 รายการ)', 'warning'); return; }

  const { total, unitPrice } = _calcQtyPrice(qty);
  const currentQty = parseInt(State.form?.qty?.[0]) || 0;
  const grid = document.querySelector('#qtyCompareGrid > div');
  if (!grid) return;

  const card = document.createElement('div');
  card.dataset.qty = qty;
  card.style.cssText = 'position:relative;background:var(--bg-tertiary);border:1px solid #d69e2e;border-radius:10px;padding:12px 10px 10px;text-align:center;cursor:pointer;transition:all 0.15s;min-width:0';
  card.onclick = () => qtyCompareSelect(qty);
  card.onmouseenter = function() { this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(91,45,142,0.12)'; var d=this.querySelector('.qty-del-btn'); if(d)d.style.display='block'; };
  card.onmouseleave = function() { this.style.transform=''; this.style.boxShadow=''; var d=this.querySelector('.qty-del-btn'); if(d)d.style.display='none'; };
  card.innerHTML = `
    <div style="position:absolute;top:-1px;right:-1px;background:#d69e2e;color:#fff;font-size:8px;padding:1px 6px;border-radius:0 8px 0 6px;font-weight:600">เพิ่มเอง</div>
    <button onclick="event.stopPropagation();App.qtyCompareRemove(this.closest('[data-qty]'))" class="qty-del-btn" style="position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;border:none;background:rgba(0,0,0,0.15);color:var(--text-muted);cursor:pointer;font-size:9px;line-height:16px;padding:0;display:none" title="ลบ">&times;</button>
    <div style="font-size:17px;font-weight:700;color:var(--accent)">${qty.toLocaleString()}</div>
    <div style="font-size:9px;color:var(--text-muted)">ชิ้น</div>
    <div style="border-top:1px solid var(--border-color);margin:5px -4px 0;padding-top:5px">
      <div style="font-size:9px;color:var(--text-muted)">รวม</div>
      <div style="font-size:12px;font-weight:600;color:var(--text-primary)">${total > 0 ? total.toLocaleString(undefined,{maximumFractionDigits:0}) : '-'}</div>
    </div>
    <div style="margin-top:3px">
      <div style="font-size:9px;color:var(--text-muted)">ต่อชิ้น</div>
      <div style="font-size:14px;font-weight:700;color:var(--primary)">${unitPrice > 0 ? unitPrice.toFixed(2) : '-'}</div>
    </div>`;
  grid.appendChild(card);
  toast(`เพิ่ม ${qty.toLocaleString()} ชิ้น`, 'success');
}

// Remove a card (cannot remove current qty)
function qtyCompareRemove(cardEl) {
  if (!cardEl) return;
  const qty = parseInt(cardEl.dataset.qty);
  const currentQty = parseInt(State.form?.qty?.[0]) || 0;
  if (qty === currentQty) { toast('ไม่สามารถลบจำนวนปัจจุบันได้', 'warning'); return; }
  cardEl.style.transition = 'all 0.2s'; cardEl.style.opacity = '0'; cardEl.style.transform = 'scale(0.8)';
  setTimeout(() => cardEl.remove(), 200);
  if (window._qtyCompareCache) delete window._qtyCompareCache[qty];
}

// Legacy double-click edit (kept for compat)
function qtyCompareEdit(el, oldQty) { /* no-op — use click to select */ }

function applyQtyCompare(qty) {
  if (!State.form) return;
  const f = State.form;
  const isMultiF = !!(f.has_multi_f && f.f_data?.length > 0 && f.f_data.some(fd => parseInt(fd.qty) > 0));
  if (isMultiF) {
    // Always scale from ORIGINAL proportions (avoid rounding drift)
    const origProps = window._multiFOrigProportions || f.f_data.map(fd => parseInt(fd.qty) || 0);
    const origTotal = window._multiFOrigTotal || origProps.reduce((s, v) => s + v, 0);
    const scaled = _scaleMultiFQtys(origProps, origTotal, qty);
    f.f_data.forEach(function(fd, i) { fd.qty = String(scaled[i]); });
    // Update stored proportions to new values (for next scale)
    window._multiFOrigProportions = origProps; // keep original ratios
    window._multiFOrigTotal = origTotal;
  } else {
    f.qty = [String(qty)];
  }
  window._qtyCompareCache = {};
  calculatePrice(true);
}

// ============================================================
// SUMMARY PRINT PDF (C5)
// ============================================================
function generateSummaryPDF() {
  if (!State.lastEstimate) { toast('กรุณาคำนวณราคาก่อน', 'error'); return; }

  const f = State.form;
  const est = State.lastEstimate;
  const t0 = est.totals?.[0] || {};
  const isMultiF = !!est.isMultiF;
  const firstQty = isMultiF
    ? (est.fMeta || []).reduce((s, fm) => s + (fm.qty || 0), 0)
    : (parseInt(f.qty?.[0]) || 0);
  const today = new Date().toLocaleDateString('th-TH', { day:'2-digit', month:'2-digit', year:'numeric' });
  const M = v => (v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});

  // Build component rows — handle both normal and multi-F
  let compRows = '';
  (est.components || []).forEach((cr, ci) => {
    if (cr.error) return;
    const comp = f.components?.[ci];
    const compType = comp?.component_type === 2 ? 'ประกบลูกฟูก' : comp?.component_type === 3 ? 'ลูกฟูก' : 'ไม่ประกบลูกฟูก';
    const layoutInfo = cr.layout?.best ? `${cr.layout.best.sheetName} | ${cr.layout.best.nw}×${cr.layout.best.nl}=${cr.layout.best.ups} ups` : '-';

    if (isMultiF && cr.fResults) {
      // Multi-F: per-F rows
      const colorSummary = (est.fMeta||[]).map(fm => fm.f_code).join(', ');
      compRows += `<tr class="sec"><td colspan="5">${cr.name || 'Component ' + (ci+1)}</td></tr>`;
      compRows += `<tr class="sub"><td colspan="5">${compType} | ${comp?.paper?.paper_code||''} ${comp?.paper?.paper_gram||''}gsm | Multi-F (${(est.fMeta||[]).length} editions) | Layout: ${layoutInfo}</td></tr>`;

      // Paper per-F
      cr.fResults.forEach(fr => {
        if (fr.error) return;
        compRows += `<tr><td>กระดาษ (${fr.f_code})</td><td>${comp?.paper?.paper_code||''} ${comp?.paper?.paper_gram||''}gsm</td><td class="r">${fr.paperCost?.unitPrice?.toFixed(2)||'-'}</td><td class="r">${(fr.paperUsage?.paperNet||0).toLocaleString()}</td><td class="r">${M(fr.paperCost?.total)}</td></tr>`;
      });
      // Plate per-F
      cr.fResults.forEach(fr => {
        if (fr.error || !fr.plateCost?.total) return;
        compRows += `<tr><td>เพลท (${fr.f_code})</td><td>${fr.plateCost?.colorsOut||0}/${fr.plateCost?.colorsIn||0} สี</td><td class="r">-</td><td class="r">${fr.plateCost?.plateSets||1}</td><td class="r">${M(fr.plateCost?.total)}</td></tr>`;
      });
      // Print per-F
      cr.fResults.forEach(fr => {
        if (fr.error || !fr.printCost?.total) return;
        compRows += `<tr><td>พิมพ์ (${fr.f_code})</td><td>${fr.printCost?.colorsOut||0}/${fr.printCost?.colorsIn||0} สี</td><td class="r">-</td><td class="r">-</td><td class="r">${M(fr.printCost?.total)}</td></tr>`;
      });
      // Foil/Emboss per-F
      cr.fResults.forEach(fr => {
        if (fr.foilCost > 0) compRows += `<tr><td>Foil Stamp (${fr.f_code})</td><td></td><td class="r">-</td><td class="r">-</td><td class="r">${M(fr.foilCost)}</td></tr>`;
        if (fr.embossCost > 0) compRows += `<tr><td>Emboss/Deboss (${fr.f_code})</td><td></td><td class="r">-</td><td class="r">-</td><td class="r">${M(fr.embossCost)}</td></tr>`;
      });
      // Shared costs
      const sh = cr.shared || {};
      if (sh.afterPress?.coating > 0) compRows += `<tr><td>เคลือบ (Coating)</td><td></td><td class="r">-</td><td class="r">-</td><td class="r">${M(sh.afterPress.coating)}</td></tr>`;
      if (sh.afterPress?.diecut > 0) compRows += `<tr><td>Diecut+แกะ+Inspect</td><td></td><td class="r">-</td><td class="r">-</td><td class="r">${M((sh.afterPress.diecut||0)+(sh.afterPress.chip||0)+(sh.afterPress.inspection||0))}</td></tr>`;
      if (sh.afterPress?.block > 0) compRows += `<tr><td>Block Diecut</td><td></td><td class="r">-</td><td class="r">1</td><td class="r">${M(sh.afterPress.block)}</td></tr>`;
      if (sh.packingCost?.total > 0) compRows += `<tr><td>แพ็คกิ้ง (Packing)</td><td></td><td class="r">-</td><td class="r">-</td><td class="r">${M(sh.packingCost.total)}</td></tr>`;
      if (sh.corrugated?.total > 0) compRows += `<tr><td>ลูกฟูก (Corrugated)</td><td></td><td class="r">-</td><td class="r">-</td><td class="r">${M(sh.corrugated.total)}</td></tr>`;
    } else if (!cr.error && cr.results?.[0]) {
      // Normal (non-multi-F)
      const qr = cr.results[0];
      const pu = qr.paperUsage || {};
      const ap = qr.afterPress || {};
      const pk = qr.packingCost || {};
      compRows += `<tr class="sec"><td colspan="5">${cr.name || 'Component ' + (ci+1)}</td></tr>`;
      compRows += `<tr class="sub"><td colspan="5">${compType} | ${comp?.paper?.paper_code||''} ${comp?.paper?.paper_gram||''}gsm | ${comp?.color?.outside||0}/${comp?.color?.inside||0} สี | Layout: ${layoutInfo}</td></tr>`;
      compRows += `<tr><td>กระดาษ (Paper)</td><td>${comp?.paper?.paper_code||''} ${comp?.paper?.paper_gram||''}gsm</td><td class="r">${qr.paperCost?.unitPrice?.toFixed(2) || '-'}</td><td class="r">${(pu.paperNet||0).toLocaleString()}</td><td class="r">${M(qr.paperCost?.total)}</td></tr>`;
      compRows += `<tr><td>เพลท (Plate)</td><td>${comp?.color?.outside||0} สี</td><td class="r">${qr.plateCost?.total > 0 ? (qr.plateCost.total / Math.max(1,parseInt(comp?.color?.outside)||1)).toFixed(2) : '-'}</td><td class="r">${comp?.color?.outside||'-'}</td><td class="r">${M(qr.plateCost?.total)}</td></tr>`;
      compRows += `<tr><td>พิมพ์ (Print)</td><td>${comp?.color?.outside||0} สี</td><td class="r">-</td><td class="r">${(pu.afterWaste||0).toLocaleString()}</td><td class="r">${M(qr.printCost?.total)}</td></tr>`;
      compRows += `<tr><td>หลังพิมพ์ (After Press)</td><td>Coating+Diecut+แกะ+Inspect</td><td class="r">-</td><td class="r">-</td><td class="r">${M(ap.total)}</td></tr>`;
      compRows += `<tr><td>แพ็คกิ้ง (Packing)</td><td>Kraftwrap+Carton+Pallet</td><td class="r">-</td><td class="r">-</td><td class="r">${M(pk.total)}</td></tr>`;
      if (qr.corrugated?.total > 0) compRows += `<tr><td>ลูกฟูก (Corrugated)</td><td>${comp?.corrugated?.flute_type ? 'ลอน '+comp.corrugated.flute_type : '-'}</td><td class="r">-</td><td class="r">-</td><td class="r">${M(qr.corrugated.total)}</td></tr>`;
    }
  });

  // Delivery info
  const dlName = f.delivery?.[0]?.destinationName || f.delivery?.[0]?.province || '-';
  const dlCost = t0.deliveryTotal || 0;

  // Remark
  const remark = f?._priceRemark || '';

  // Coating list
  const coatings = f.components?.flatMap(c => (c.addon||[]).filter(a=>a.type==='coating').map(a => {
    const opt = a.info?.coating_option ? a.info.coating_option + ' ' : '';
    return opt + (a.info?.type || a.info?.coating_type || '') + ' ' + (a.info?.side || 1) + ' s';
  })) || [];

  // Quotation number (auto-generate)
  const qtNo = `QT-${new Date().getFullYear() + 543}-${String(Date.now()).slice(-5)}`;
  const validDays = 30;
  const validDate = new Date(Date.now() + validDays * 86400000).toLocaleDateString('th-TH', { day:'2-digit', month:'2-digit', year:'numeric' });

  // Component spec summary
  const comp0 = f.components?.[0];
  const sz = comp0?.packaging_size || {};
  const sizeText = sz.width && sz.length ? `${sz.width} × ${sz.length}${sz.depth ? ' × ' + sz.depth : ''} mm` : '-';
  const templateName = comp0?.box_type?.type_name || 'Custom';
  const compType = comp0?.component_type === 2 ? 'ประกบลูกฟูก' : comp0?.component_type === 3 ? 'ลูกฟูก' : 'ไม่ประกบลูกฟูก';

  // Foil — list ALL foils with F-codes
  const allFoils = (comp0?.addon||[]).filter(a => a.type === 'foilstamp');
  const foilText = allFoils.length > 0 ? allFoils.map(fl => {
    const fTag = isMultiF && fl.f_codes?.length ? `[${fl.f_codes.join(',')}] ` : '';
    return fTag + (fl.info?.foil_color || 'มี') + ((fl.info?.sizes||[]).length ? ' ' + fl.info.sizes.map(s => s.w+'"x'+s.l+'"').join(', ') : '');
  }).join('; ') : '-';

  // Emboss — list ALL with F-codes
  const allEmboss = (comp0?.addon||[]).filter(a => a.type === 'emboss' || a.type === 'deboss');
  const embossText = allEmboss.length > 0 ? allEmboss.map(em => {
    const fTag = isMultiF && em.f_codes?.length ? `[${em.f_codes.join(',')}] ` : '';
    const typ = em.type === 'deboss' ? 'Deboss' : 'Emboss';
    return fTag + typ + ((em.info?.sizes||[]).length ? ' ' + em.info.sizes.map(s => s.w+'"x'+s.l+'"').join(', ') : '');
  }).join('; ') : '-';

  // Print colors — multi-F: show per-F
  const printText = isMultiF && comp0?._color_per_f?.length > 1
    ? comp0._color_per_f.map((cf, fi) => {
        const fc = cf.f_code || f.f_data?.[fi]?.f_code || ('F'+(fi+1));
        return fc + ':' + (cf.outside||0) + '/' + (cf.inside||0);
      }).join(', ')
    : `${f?.print_type || 'Offset'} ${comp0?.color?.outside||0}/${comp0?.color?.inside||0} สี`;

  // Use rendered price (source of truth) if available
  const renderedTotal = window._renderedTotalPrice || t0.finalPrice || 0;
  const renderedUnit = window._renderedUnitPrice || (firstQty > 0 ? renderedTotal / firstQty : 0);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Quotation - ${f?.job_name || 'Draft'}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Tahoma, 'Microsoft Sans Serif', sans-serif; font-size: 10px; color: #333; line-height: 1.35; }
  .page { max-width: 210mm; margin: 0 auto; }

  /* Header */
  .hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px; }
  .hdr-left { display:flex; align-items:center; gap:10px; }
  .hdr-left img { width:48px; height:48px; }
  .hdr-left h1 { font-size:14px; color:#5b2d8e; }
  .hdr-left .co { font-size:9px; color:#666; }
  .hdr-right { text-align:right; }
  .hdr-right .qt-label { font-size:16px; font-weight:700; color:#5b2d8e; letter-spacing:1px; }
  .hdr-right .qt-no { font-size:11px; color:#333; margin-top:2px; }
  .hdr-right .qt-date { font-size:9px; color:#888; }
  .line { border:none; border-top:2.5px solid #5b2d8e; margin:4px 0 8px; }

  /* Info boxes */
  .info-row { display:flex; gap:8px; margin-bottom:8px; }
  .info-box { flex:1; border:1px solid #ddd; border-radius:5px; padding:5px 8px; }
  .info-box .lbl { font-size:7px; color:#999; text-transform:uppercase; letter-spacing:0.5px; }
  .info-box .val { font-size:10px; font-weight:600; margin-top:1px; }

  /* Spec table */
  .spec-tbl { width:100%; border-collapse:collapse; margin-bottom:8px; font-size:9px; }
  .spec-tbl td { padding:3px 6px; border:1px solid #e5e5e5; }
  .spec-tbl .lbl { background:#f8f7fc; font-weight:600; color:#5b2d8e; width:100px; }

  /* Main table */
  table.main { width:100%; border-collapse:collapse; margin-bottom:6px; }
  table.main th { background:#5b2d8e; color:#fff; font-size:8px; padding:4px 5px; text-align:center; font-weight:600; }
  table.main th:first-child { text-align:left; }
  table.main td { padding:3px 5px; font-size:9px; border-bottom:1px solid #eee; }
  table.main td.r { text-align:right; font-variant-numeric:tabular-nums; }
  table.main tr.sec td { background:#f3f0ff; font-weight:700; font-size:10px; color:#5b2d8e; border-bottom:1.5px solid #5b2d8e; }
  table.main tr.sub td { font-size:8px; color:#888; border-bottom:1px solid #e5e5e5; }

  /* Summary */
  .sum { border:1.5px solid #5b2d8e; border-radius:6px; padding:8px 12px; margin:8px 0; background:#faf9fc; }
  .sum h3 { font-size:11px; color:#5b2d8e; margin-bottom:4px; border-bottom:1px solid #e5e5e5; padding-bottom:3px; }
  .sum table { width:100%; border-collapse:collapse; }
  .sum td { padding:2px 0; font-size:9px; border:none; }
  .sum td.r { text-align:right; font-variant-numeric:tabular-nums; }
  .sum tr.grand td { font-size:13px; font-weight:700; color:#5b2d8e; border-top:2px solid #5b2d8e; padding-top:5px; }
  .sum tr.unit td { font-size:11px; font-weight:700; }

  .baht { font-style:italic; color:#666; font-size:9px; margin:2px 0 6px; }

  /* Terms */
  .terms { border:1px solid #ddd; border-radius:5px; padding:8px 10px; margin:6px 0; font-size:8px; color:#555; }
  .terms h4 { font-size:9px; color:#5b2d8e; margin-bottom:3px; }
  .terms li { margin-left:12px; margin-bottom:1px; }

  /* Remark */
  .remark { background:#fffbf0; border:1px solid #e5d5a0; border-radius:5px; padding:6px 10px; margin:6px 0; font-size:9px; }

  /* Signatures */
  .sig-row { display:flex; justify-content:space-around; margin-top:24px; }
  .sig-box { text-align:center; width:180px; }
  .sig-line { border-top:1px solid #333; margin-top:40px; padding-top:3px; font-size:9px; }
  .sig-role { font-size:8px; color:#888; }

  /* Footer */
  .foot { text-align:center; font-size:7px; color:#aaa; margin-top:12px; border-top:1px solid #eee; padding-top:4px; }

  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head><body>
<div class="page">

<!-- HEADER -->
<div class="hdr">
  <div class="hdr-left">
    <img src="img/logo.png" alt="Logo">
    <div>
      <h1>Sirivatana Interprint</h1>
      <div class="co">Public Company Limited</div>
      <div class="co">โทร. 02-xxx-xxxx | www.sirivatana.com</div>
    </div>
  </div>
  <div class="hdr-right">
    <div class="qt-label">QUOTATION</div>
    <div class="qt-no">${qtNo}</div>
    <div class="qt-date">Date: ${today}</div>
    <div class="qt-date">Valid until: ${validDate}</div>
  </div>
</div>
<hr class="line">

<!-- JOB INFO -->
<div class="info-row">
  <div class="info-box"><div class="lbl">Job Name</div><div class="val">${f?.job_name || '-'}</div></div>
  <div class="info-box"><div class="lbl">Customer</div><div class="val">${f?.customer?.customer_name || '-'}</div></div>
  <div class="info-box"><div class="lbl">AE</div><div class="val">${f?.ae?.emp_name || '-'}</div></div>
  <div class="info-box"><div class="lbl">Quantity</div><div class="val">${firstQty.toLocaleString()} ชิ้น</div></div>
</div>

<!-- PRODUCT SPEC -->
<table class="spec-tbl">
  <tr><td class="lbl">ขนาดชิ้นงาน</td><td>${sizeText}</td><td class="lbl">รูปแบบกล่อง</td><td>${templateName}</td></tr>
  <tr><td class="lbl">ประเภท</td><td>${compType}</td><td class="lbl">พิมพ์</td><td>${printText}</td></tr>
  <tr><td class="lbl">กระดาษ</td><td>${comp0?.paper?.paper_code||'-'} ${comp0?.paper?.paper_gram||''}gsm</td><td class="lbl">เคลือบ</td><td>${coatings.length ? coatings.join(', ') : '-'}</td></tr>
  <tr><td class="lbl">Foil Stamp</td><td>${foilText}</td><td class="lbl">Emboss</td><td>${embossText}</td></tr>
</table>

<!-- COST BREAKDOWN -->
<table class="main">
  <thead><tr><th style="text-align:left;min-width:80px">รายการ</th><th style="text-align:left">รายละเอียด</th><th style="min-width:55px">ราคา/หน่วย</th><th style="min-width:40px">จำนวน</th><th style="min-width:60px">จำนวนเงิน (฿)</th></tr></thead>
  <tbody>
    ${compRows}
    <tr><td colspan="3"></td><td style="text-align:right;font-weight:600;font-size:9px">ค่าจัดส่ง</td><td class="r" style="font-weight:600">${M(dlCost)}</td></tr>
  </tbody>
</table>

<!-- PRICE SUMMARY -->
<div class="sum">
  <h3>สรุปราคา / Price Summary</h3>
  <table>
    <tr><td>ต้นทุนวัสดุ (Material)</td><td class="r">${M(t0.materialTotal)}</td></tr>
    <tr><td>ต้นทุนการผลิต (Production)</td><td class="r">${M(t0.productionTotal)}</td></tr>
    <tr><td>แพ็คกิ้ง (Packing)</td><td class="r">${M(t0.packingTotal)}</td></tr>
    <tr><td>ค่าจัดส่ง (Delivery) — ${dlName}</td><td class="r">${M(dlCost)}</td></tr>
    <tr style="border-top:1px solid #ccc"><td><b>Subtotal</b></td><td class="r"><b>${M(t0.subtotal)}</b></td></tr>
    ${t0.markingPercent ? `<tr><td>Marking (${t0.markingPercent > 0 ? '+' : ''}${t0.markingPercent}%)</td><td class="r">${M(t0.afterMarking - t0.subtotal)}</td></tr>
    <tr><td>After Marking</td><td class="r">${M(t0.afterMarking)}</td></tr>` : ''}
    <tr><td>ภาษี (Tax ${CalcEngine?.CALC?.tax_percent || 3}%)</td><td class="r">${M(t0.tax)}</td></tr>
    <tr class="grand"><td>ราคารวมทั้งสิ้น (Total Price)</td><td class="r">${M(renderedTotal)}</td></tr>
    <tr class="unit"><td>ราคาต่อชิ้น (Unit Price)</td><td class="r" style="color:#5b2d8e">${renderedUnit.toFixed(2)} บาท</td></tr>
  </table>
</div>
<div class="baht">(${bahtText(renderedTotal)})</div>

<!-- REMARK -->
${remark ? `<div class="remark"><b>หมายเหตุ / Remark:</b><br>${remark.replace(/\n/g,'<br>')}</div>` : ''}

<!-- TERMS & CONDITIONS -->
<div class="terms">
  <h4>เงื่อนไข / Terms & Conditions</h4>
  <ol>
    <li>ใบเสนอราคานี้มีผล ${validDays} วัน นับจากวันที่ออก</li>
    <li>ราคาอาจเปลี่ยนแปลงตามราคากระดาษและวัตถุดิบ ณ วันที่สั่งผลิต</li>
    <li>ราคาไม่รวมค่าออกแบบ Artwork / ค่าแม่พิมพ์พิเศษ (ถ้ามี)</li>
    <li>เงื่อนไขการชำระ: มัดจำ 50% / ส่วนที่เหลือก่อนจัดส่ง</li>
    <li>ระยะเวลาผลิต: 15-20 วันทำการ หลังได้รับการยืนยัน Artwork</li>
    <li>จำนวนส่งมอบอาจเกิน/ขาดไม่เกิน ±10% ตามมาตรฐานอุตสาหกรรม</li>
  </ol>
</div>

<!-- SIGNATURES -->
<div class="sig-row">
  <div class="sig-box">
    <div class="sig-line">ผู้เสนอราคา / Prepared by</div>
    <div class="sig-role">${f?.ae?.emp_name || '________________'}</div>
    <div class="sig-role">วันที่ ____/____/________</div>
  </div>
  <div class="sig-box">
    <div class="sig-line">ผู้อนุมัติ / Approved by</div>
    <div class="sig-role">________________</div>
    <div class="sig-role">วันที่ ____/____/________</div>
  </div>
  <div class="sig-box">
    <div class="sig-line">ลูกค้ายืนยัน / Customer Accepted</div>
    <div class="sig-role">________________</div>
    <div class="sig-role">วันที่ ____/____/________</div>
  </div>
</div>

<!-- FOOTER -->
<div class="foot">
  ${qtNo} | Pornchai RFQ Agent — Sirivatana Interprint Public Co., Ltd. | Generated: ${new Date().toLocaleString('th-TH')}
</div>

</div>
</body></html>`;

  // Open in new window for print
  const win = window.open('', '_blank', 'width=800,height=1000');
  win.document.write(html);
  win.document.close();
  win.document.title = `Estimate - ${f?.job_name || 'Draft'}`;
  setTimeout(() => {
    win.print();
    // Detect when print dialog closes → show success
    win.onafterprint = () => {
      toast('บันทึก Summary PDF สำเร็จ!', 'success');
      setTimeout(() => win.close(), 500);
    };
    // Fallback: if onafterprint not supported, notify after delay
    setTimeout(() => {
      if (win && !win.closed) {
        toast('กด Save as PDF หรือ Print เพื่อบันทึก', 'info');
      }
    }, 3000);
  }, 500);
}

// ============================================================
// C11: CANVAS/PNG EXPORT FOR LAYOUT
// ============================================================
function exportLayoutPNG(componentIndex) {
  const ci = componentIndex || 0;
  const c = State.form?.components[ci];
  if (!c?._layout?.best) { toast('กรุณาคำนวณ Layout ก่อน', 'error'); return; }

  const layout = c._layout;
  const b = layout.best;
  const u = layout.unfolded;

  const canvas = document.createElement('canvas');
  const scale = 0.5; // mm to px
  const sheetW = b.sw * scale;
  const sheetL = b.sl * scale;
  const pad = 40;
  canvas.width = sheetW + pad * 2;
  canvas.height = sheetL + pad * 2 + 60;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = '#5b2d8e';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`Layout: ${c.component_name || 'Component '+(ci+1)} — ${b.sheetName}`, pad, 20);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText(`Sheet: ${b.sw}x${b.sl}mm | Open: ${u.openW.toFixed(1)}x${u.openL.toFixed(1)}mm | ${b.nw}x${b.nl}=${b.ups} ups`, pad, 36);

  // Draw sheet outline
  const ox = pad, oy = pad + 20;
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(ox, oy, sheetW, sheetL);

  // Tolerance zones
  const tol = CalcEngine.CALC.tolerance[(State.form.print_type||'offset').toLowerCase()] || CalcEngine.CALC.tolerance.offset;
  const gripper = tol.gripper * scale;
  const colorBar = tol.color_bar * scale;
  const paperEdge = tol.paper_edge * scale;

  ctx.fillStyle = 'rgba(255,200,200,0.3)';
  ctx.fillRect(ox, oy, sheetW, gripper); // gripper top
  ctx.fillRect(ox, oy + sheetL - colorBar, sheetW, colorBar); // color bar bottom
  ctx.fillRect(ox, oy, paperEdge, sheetL); // left edge
  ctx.fillRect(ox + sheetW - paperEdge, oy, paperEdge, sheetL); // right edge

  // Draw boxes
  const boxW = (b.rotated ? u.openL : u.openW) * scale;
  const boxH = (b.rotated ? u.openW : u.openL) * scale;
  const startX = ox + paperEdge;
  const startY = oy + gripper;
  const colors = ['#e8d4f8','#d4e8f8','#d4f8e8','#f8e8d4','#f8d4e8','#d4f8f8'];

  for (let row = 0; row < b.nl; row++) {
    for (let col = 0; col < b.nw; col++) {
      const bx = startX + col * boxW;
      const by = startY + row * boxH;
      ctx.fillStyle = colors[(row * b.nw + col) % colors.length];
      ctx.fillRect(bx, by, boxW - 1, boxH - 1);
      ctx.strokeStyle = '#5b2d8e';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, boxW - 1, boxH - 1);
      ctx.fillStyle = '#333';
      ctx.font = '9px sans-serif';
      ctx.fillText(`${col+1},${row+1}`, bx + 3, by + 12);
    }
  }

  // Labels
  ctx.fillStyle = '#999';
  ctx.font = '9px sans-serif';
  ctx.fillText('Gripper', ox + 4, oy + 10);
  ctx.fillText('Color Bar', ox + 4, oy + sheetL - 4);

  // Download
  const link = document.createElement('a');
  link.download = `Layout_${c.component_name || 'comp'+(ci+1)}_${b.sheetName}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  toast('Export Layout PNG สำเร็จ!', 'success');
}

// ============================================================
// ESTIMATE VERSION HISTORY (C1)
// ============================================================
async function viewVersionHistory(jobId) {
  showView('viewHistory');
  setTopBar('Version History - ' + jobId, 'ประวัติเวอร์ชัน');
  $('historyContent').innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด...</div>';

  try {
    const data = await apiGet(`/api/rfq/status-log/${jobId}`);
    const logs = Array.isArray(data) ? data : (data.data || []);

    let h = `<div class="detail-header">
      <div><h4>${jobId}</h4><div style="color:var(--text-muted);font-size:13px">ประวัติการแก้ไขและเปลี่ยนแปลง</div></div>
      <div class="detail-actions">
        <button class="text-btn" onclick="App.viewDetail('${jobId}')"><i class="fas fa-arrow-left"></i> กลับ</button>
      </div>
    </div>`;

    if (logs.length === 0) {
      h += '<div class="detail-card"><p style="color:var(--text-muted);text-align:center;padding:20px">ไม่พบประวัติ</p></div>';
    } else {
      h += '<div class="detail-card"><h6><i class="fas fa-history"></i> ประวัติทั้งหมด</h6>';
      h += '<table class="detail-table"><thead><tr><th>#</th><th>สถานะ</th><th>ผู้แก้ไข</th><th>วันที่</th><th>หมายเหตุ</th></tr></thead><tbody>';
      logs.forEach((log, i) => {
        h += `<tr>
          <td>${i + 1}</td>
          <td><span class="rfq-status">${log.status || log.approve_status || '-'}</span></td>
          <td>${escapeHtml(log.editor || log.emp_name || log.created_by || '-')}</td>
          <td>${log.created_datetime || log.edit_date || '-'}</td>
          <td>${escapeHtml(log.remark || '-')}</td>
        </tr>`;
      });
      h += '</tbody></table></div>';
    }

    $('historyContent').innerHTML = h;
  } catch (e) {
    $('historyContent').innerHTML = `<div class="detail-card"><p style="color:#f08080">${e.message}</p></div>`;
  }
}

// Make some functions globally available for onclick handlers
window.toggleSection = toggleSection;
window.showView = showView;
window.setTopBar = setTopBar;

// ============================================================
// INIT
// ============================================================
initTheme();
restoreSession();
applyInputMasks();
loadRFQList();
checkConnections();
setInterval(checkConnections, 30000);

// Pre-load master data for dropdowns
Promise.all([
  loadMaster('paper_code_type'),
  loadMaster('boxtemplate_info'),
  loadMaster('process_type'),
  loadMaster('exchange_rate'),
  loadMaster('coating_info'),
  loadMaster('foilstamp_info'),
  loadMaster('blockstamp_info'),
  loadMaster('blockdiecut_info'),
  loadMaster('corrugated_info'),
  loadMaster('delivery_rate_info'),
  loadMaster('machine_std_paper_info'),
  loadMaster('waste_info'),
  loadMaster('price_info'),
  loadMaster('min_price_info'),
  loadMaster('marking_price_info'),
]).then(() => {
  // Pre-load paper_info and build sub-code list for Paper dropdown
  apiGet('/api/estimate/master_data?type=paper_info').then(data => {
    State.masters['_paper_info_all'] = data || [];
    // Build unique sub-codes with labels: e.g. "Dup GBB", "AC C1s"
    const codeMap = new Map();
    (data || []).forEach(p => {
      if (p.paper_code && !codeMap.has(p.paper_code)) {
        codeMap.set(p.paper_code, { code: p.paper_code, type: p.paper_type || '', label: p.paper_code + (p.paper_type ? ' - ' + p.paper_type : '') });
      }
    });
    State.masters._paper_sub_codes = [...codeMap.values()].sort((a, b) => a.code.localeCompare(b.code));
    renderForm();
  }).catch(() => {});
}).catch(() => {});

// Load calculation engine master data (price_info, waste_info, etc.)
if (typeof CalcEngine !== 'undefined') {
  CalcEngine.loadCalcMasters().then(() => {
    console.log('CalcEngine master data loaded');
  }).catch(err => {
    console.warn('CalcEngine master data load error:', err);
  });
}

// Render chat welcome screen with mode selector
renderChatWelcome();
