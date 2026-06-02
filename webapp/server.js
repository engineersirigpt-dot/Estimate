import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3080;

// OpenClaw Gateway
const OPENCLAW_GATEWAY = 'http://localhost:18789';
const OPENCLAW_TOKEN = 'e1750b0b22fe283aeb3c9f2116890fc3c5256eaaa4f6d16a';
const AGENT_ID = 'pornchai-rfq';

// Estimate API
const ESTIMATE_API = 'http://192.168.5.3:3010';
const EST_USER = '2690006';
const EST_PASS = 'golfthefa9';
  
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// --- Estimate API Auth ---
let cachedToken = null;
let tokenExpiry = 0;
let cachedUser = null;

async function getEstimateToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${ESTIMATE_API}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: EST_USER, password: EST_PASS })
  });
  const data = await res.json();
  cachedToken = data.accessToken;
  tokenExpiry = Date.now() + 14 * 60 * 1000; // 14 min
  if (data.user?.data?.[0]) {
    cachedUser = {
      emp_id: data.user.data[0].emp_id,
      emp_name: data.user.data[0].emp_name
    };
  }
  return cachedToken;
}

// --- Employee Cache (API only searches by ID, not name) ---
let employeeCache = null;
let employeeCacheTime = 0;
const EMPLOYEE_CACHE_TTL = 3600000; // 1 hour

async function loadEmployeeCache() {
  if (employeeCache && Date.now() - employeeCacheTime < EMPLOYEE_CACHE_TTL) return employeeCache;
  const token = await getEstimateToken();
  // Fetch all prefixes 00-99 in parallel (much faster than sequential)
  const prefixes = [];
  for (let p = 0; p <= 9; p++) {
    for (let d = 0; d <= 9; d++) prefixes.push(`${p}${d}`);
  }
  const results = await Promise.allSettled(
    prefixes.map(pfx =>
      fetch(`${ESTIMATE_API}/estimate/autocomplete?type=employee&term=${pfx}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json())
    )
  );
  const all = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) all.push(...r.value);
  }
  // Deduplicate by id
  const map = new Map();
  all.forEach(e => {
    if (e.id && !map.has(e.id)) {
      e.name = (e.name || '').replace(/[\r\n]+/g, '').trim();
      e.label = `${e.id}: ${e.name}`;
      e.value = e.label;
      map.set(e.id, e);
    }
  });
  employeeCache = Array.from(map.values());
  employeeCacheTime = Date.now();
  console.log(`Employee cache loaded: ${employeeCache.length} employees`);
  return employeeCache;
}

app.get('/api/employees/search', async (req, res) => {
  try {
    const term = (req.query.term || '').toLowerCase().trim();
    if (!term) return res.json([]);
    const employees = await loadEmployeeCache();
    const results = employees.filter(e =>
      e.id.includes(term) || (e.name || '').toLowerCase().includes(term) || (e.label || '').toLowerCase().includes(term)
    ).slice(0, 15);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Local Master Data (fallback when API offline) ---
const MASTER_DATA_DIR = join(__dirname, 'data', 'master');
if (!existsSync(MASTER_DATA_DIR)) mkdirSync(MASTER_DATA_DIR, { recursive: true });

function loadLocalMasterData(type) {
  const filePath = join(MASTER_DATA_DIR, `${type}.json`);
  if (existsSync(filePath)) {
    try {
      return JSON.parse(readFileSync(filePath, 'utf8'));
    } catch { return null; }
  }
  return null;
}

// --- Proxy to Estimate API (with local fallback) ---
app.get('/api/estimate/:path(*)', async (req, res) => {
  try {
    const token = await getEstimateToken();
    const url = `${ESTIMATE_API}/estimate/${req.params.path}?${new URLSearchParams(req.query)}`;
    const result = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    }).then(r => r.json());
    res.json(result);
  } catch (err) {
    // Fallback: if path is master_data, try local file
    if (req.params.path === 'master_data' && req.query.type) {
      const local = loadLocalMasterData(req.query.type);
      if (local) {
        console.log(`[master_data] API offline → local fallback: ${req.query.type}`);
        return res.json(local);
      }
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/estimate/:path(*)', async (req, res) => {
  try {
    const token = await getEstimateToken();
    const url = `${ESTIMATE_API}/estimate/${req.params.path}`;
    const result = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    }).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Refresh: ดึง master data จาก API เก่ามาเก็บ local ---
const MASTER_DATA_TYPES = [
  'paper_info', 'coating_info', 'corrugated_info', 'foilstamp_info',
  'blockstamp_info', 'price_info', 'min_price_info', 'waste_info',
  'blockdiecut_info', 'boxtemplate_info', 'specialink_info', 'specialink_factor_info',
  'jetpress_waste_info', 'jetpress_info', 'marking_price_info', 'machine_std_paper_info',
  'delivery_rate_info', 'paper_code_type', 'process_type', 'price_type',
  'konica_waste_info', 'exchange_rate',
];

app.post('/api/master-data/refresh', async (req, res) => {
  try {
    const token = await getEstimateToken();
    const results = {};
    for (const type of MASTER_DATA_TYPES) {
      try {
        const r = await fetch(`${ESTIMATE_API}/estimate/master_data?type=${type}&estimate_type=packaging`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: AbortSignal.timeout(10000),
        });
        const data = await r.json();
        const filePath = join(MASTER_DATA_DIR, `${type}.json`);
        writeFileSync(filePath, JSON.stringify(data, null, 0), 'utf8');
        results[type] = { ok: true, records: Array.isArray(data) ? data.length : 1 };
      } catch (e) {
        results[type] = { ok: false, error: e.message };
      }
    }
    console.log('[master-data] Refresh complete:', Object.entries(results).map(([k,v]) => `${k}:${v.ok?v.records:'ERR'}`).join(', '));
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// SIPWARE EXCHANGE RATE — Source: 192.168.5.40 (Sirivatana intranet)
// JSON API: ./controllers/controller.php?post_type=get_exchange_rate
// Rates เป็นค่าที่ฝ่ายบัญชี/finance กรอกเอง (ไม่ใช่ live API)
// ============================================================
const SIPWARE_API_URL = 'http://192.168.5.40/sipware/controllers/controller.php?post_type=get_exchange_rate';
const SIPWARE_CACHE_PATH = join(MASTER_DATA_DIR, 'sipware_exchange_rate.json');

// Convert sipware JSON response to normalized format
function normalizeSipwareData(rawArray) {
  if (!Array.isArray(rawArray) || rawArray.length === 0) return null;
  const result = {
    rates: {},
    date: '',
    time: '',
    source: 'sipware',
    source_url: 'http://192.168.5.40/sipware/index.php',
    synced_at: new Date().toISOString(),
    raw_count: rawArray.length,
  };

  // Extract date from first record (created field: "01-04-2026 09:00")
  if (rawArray[0]?.created) {
    const m = String(rawArray[0].created).match(/(\d{2}-\d{2}-\d{4})\s+(\d{2}:\d{2})/);
    if (m) { result.date = m[1]; result.time = m[2]; }
  } else if (rawArray[0]?.update_date) {
    result.date = rawArray[0].update_date;
  }

  for (const item of rawArray) {
    let cur = String(item.currency || '').trim();
    if (!cur) continue;
    const exportRate = parseFloat(item.export_rate);
    const importRate = parseFloat(item.import_rate);
    if (!(exportRate > 0) || !(importRate > 0)) continue;

    // Detect "YEN(:100)" → store as JPY with per_100 flag
    const isPer100 = /\(:100\)|:100/.test(cur);
    if (isPer100) cur = cur.replace(/\(:100\)|:100/g, '').trim();
    if (cur === 'YEN') cur = 'YEN'; // keep YEN, also alias to JPY below

    const entry = {
      currency: cur,
      export: exportRate,
      import: importRate,
      mid: parseFloat(((exportRate + importRate) / 2).toFixed(4)),
      per_100: isPer100,
      update_date: item.update_date || '',
      created: item.created || '',
    };
    if (isPer100) {
      entry.export_per_unit = parseFloat((exportRate / 100).toFixed(4));
      entry.import_per_unit = parseFloat((importRate / 100).toFixed(4));
      entry.mid_per_unit = parseFloat((entry.mid / 100).toFixed(4));
    }
    result.rates[cur] = entry;
    // Alias YEN → JPY for international standard
    if (cur === 'YEN') result.rates['JPY'] = { ...entry, currency: 'JPY' };
  }

  return Object.keys(result.rates).length > 0 ? result : null;
}

async function fetchSipwareRates() {
  const r = await fetch(SIPWARE_API_URL, {
    signal: AbortSignal.timeout(10000),
    headers: { 'User-Agent': 'Pornchai-RFQ/1.0', 'Accept': 'application/json' },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  const normalized = normalizeSipwareData(data);
  if (!normalized) throw new Error('Could not parse sipware response');
  return normalized;
}

// Sync exchange rate from sipware (manual trigger)
app.post('/api/exchange-rate/sync-sipware', async (req, res) => {
  try {
    console.log('[sipware] Fetching from', SIPWARE_API_URL);
    const parsed = await fetchSipwareRates();
    writeFileSync(SIPWARE_CACHE_PATH, JSON.stringify(parsed, null, 2), 'utf8');
    console.log('[sipware] Synced', Object.keys(parsed.rates).length, 'rates, date:', parsed.date, parsed.time);
    res.json({ success: true, ...parsed });
  } catch (err) {
    console.log('[sipware] Sync failed:', err.message);
    if (existsSync(SIPWARE_CACHE_PATH)) {
      try {
        const cached = JSON.parse(readFileSync(SIPWARE_CACHE_PATH, 'utf8'));
        return res.json({ success: false, error: err.message, cached: true, ...cached });
      } catch (e) {}
    }
    res.status(500).json({ error: err.message });
  }
});

// Get current exchange rate (from local cache; auto-sync if stale > 12h)
app.get('/api/exchange-rate/sipware', async (req, res) => {
  try {
    let cached = null;
    let needsSync = true;
    if (existsSync(SIPWARE_CACHE_PATH)) {
      try {
        cached = JSON.parse(readFileSync(SIPWARE_CACHE_PATH, 'utf8'));
        if (cached.synced_at) {
          const age = Date.now() - new Date(cached.synced_at).getTime();
          if (age < 12 * 60 * 60 * 1000) needsSync = false;
        }
      } catch (e) {}
    }

    if (needsSync) {
      console.log('[sipware] Cache stale or missing, syncing...');
      try {
        const parsed = await fetchSipwareRates();
        writeFileSync(SIPWARE_CACHE_PATH, JSON.stringify(parsed, null, 2), 'utf8');
        cached = parsed;
        console.log('[sipware] Auto-synced on-demand');
      } catch (e) {
        console.log('[sipware] Auto-sync failed (using cache):', e.message);
      }
    }

    if (!cached) return res.status(404).json({ error: 'No exchange rate data available — try POST /api/exchange-rate/sync-sipware first' });
    res.json({ success: true, ...cached });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- List local master data status ---
app.get('/api/master-data/status', (req, res) => {
  const status = {};
  for (const type of MASTER_DATA_TYPES) {
    const filePath = join(MASTER_DATA_DIR, `${type}.json`);
    if (existsSync(filePath)) {
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf8'));
        const stat = statSync(filePath);
        status[type] = { exists: true, records: Array.isArray(data) ? data.length : 1, updated: stat.mtime };
      } catch {
        status[type] = { exists: true, error: 'parse error' };
      }
    } else {
      status[type] = { exists: false };
    }
  }
  res.json(status);
});

// --- CRUD for local master data JSON files ---
app.get('/api/master-data/:type', (req, res) => {
  const data = loadLocalMasterData(req.params.type);
  if (data) return res.json(data);
  res.status(404).json({ error: 'Not found' });
});

// ID key mapping: some types use different id field names
const MASTER_ID_KEYS = { machine_std_paper_info: 'std_paper_id' };
function getMasterIdKey(type) { return MASTER_ID_KEYS[type] || 'id'; }

app.post('/api/master-data/:type', (req, res) => {
  try {
    const type = req.params.type;
    const idKey = getMasterIdKey(type);
    const filePath = join(MASTER_DATA_DIR, `${type}.json`);
    let data = loadLocalMasterData(type) || [];
    if (!Array.isArray(data)) data = [data];
    const newItem = req.body;
    const maxId = data.reduce((mx, r) => Math.max(mx, r[idKey] || 0), 0);
    newItem[idKey] = maxId + 1;
    newItem.modified = new Date().toISOString();
    data.push(newItem);
    writeFileSync(filePath, JSON.stringify(data, null, 0), 'utf8');
    console.log(`[master-data] CREATE ${type} ${idKey}=${newItem[idKey]}`);
    res.json({ success: true, item: newItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/master-data/:type/:id', (req, res) => {
  try {
    const type = req.params.type;
    const idKey = getMasterIdKey(type);
    const id = Number(req.params.id);
    const filePath = join(MASTER_DATA_DIR, `${type}.json`);
    let data = loadLocalMasterData(type) || [];
    if (!Array.isArray(data)) data = [data];
    const idx = data.findIndex(r => r[idKey] === id);
    if (idx === -1) return res.status(404).json({ error: 'Record not found' });
    const updated = { ...data[idx], ...req.body, [idKey]: id, modified: new Date().toISOString() };
    data[idx] = updated;
    writeFileSync(filePath, JSON.stringify(data, null, 0), 'utf8');
    console.log(`[master-data] UPDATE ${type} ${idKey}=${id}`);
    res.json({ success: true, item: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/master-data/:type/:id', (req, res) => {
  try {
    const type = req.params.type;
    const idKey = getMasterIdKey(type);
    const id = Number(req.params.id);
    const filePath = join(MASTER_DATA_DIR, `${type}.json`);
    let data = loadLocalMasterData(type) || [];
    if (!Array.isArray(data)) data = [data];
    const before = data.length;
    data = data.filter(r => r[idKey] !== id);
    if (data.length === before) return res.status(404).json({ error: 'Record not found' });
    writeFileSync(filePath, JSON.stringify(data, null, 0), 'utf8');
    console.log(`[master-data] DELETE ${type} ${idKey}=${id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// MASTER DATA CACHE for AI System Prompt
// ============================================================
let masterDataCache = null;
let masterDataExpiry = 0;

async function loadMasterDataForPrompt() {
  if (masterDataCache && Date.now() < masterDataExpiry) return masterDataCache;

  const token = await getEstimateToken();
  const load = async (type) => {
    try {
      const r = await fetch(`${ESTIMATE_API}/estimate/master_data?type=${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await r.json();
    } catch { return []; }
  };

  const [paperInfo, coatingInfo, foilInfo, , corrugatedInfo, boxTemplateInfo, deliveryInfo] = await Promise.all([
    load('paper_info'),
    load('coating_info'),
    load('foilstamp_info'),
    load('blockstamp_info'),
    load('corrugated_info'),
    load('boxtemplate_info'),
    load('delivery_rate_info'),
  ]);

  // Extract unique paper codes from paper_info
  const paperCodes = [...new Set((paperInfo || []).map(p => p.paper_code).filter(Boolean))].sort();

  // Extract paper code → gsm mapping
  const paperCodeGsm = {};
  (paperInfo || []).forEach(p => {
    if (!p.paper_code || !p.gram) return;
    if (!paperCodeGsm[p.paper_code]) paperCodeGsm[p.paper_code] = new Set();
    paperCodeGsm[p.paper_code].add(String(p.gram));
  });
  const paperCodeGsmList = {};
  for (const [code, gsmSet] of Object.entries(paperCodeGsm)) {
    paperCodeGsmList[code] = [...gsmSet].sort((a, b) => Number(a) - Number(b));
  }

  // Coating types
  const coatingTypes = [...new Set((coatingInfo || []).map(c => c.process_name || c.name).filter(Boolean))];

  // Foil colors
  const foilColors = [...new Set((foilInfo || []).map(f => f.color || f.foil_color).filter(Boolean))];

  // Box templates
  const boxTemplates = (boxTemplateInfo || []).map(bt => ({
    type_id: bt.type_id,
    type_name: bt.type_name,
    type_name_th: bt.type_name_th || ''
  }));

  // Corrugated flutes
  const corrugatedFlutes = [...new Set((corrugatedInfo || []).map(c => c.flute_type || c.flute).filter(Boolean))];

  // Delivery provinces
  const provinces = [...new Set((deliveryInfo || []).map(d => d.destination_name || d.province).filter(Boolean))].sort();

  masterDataCache = {
    paperCodes,
    paperCodeGsmList,
    coatingTypes,
    foilColors,
    boxTemplates,
    corrugatedFlutes,
    provinces,
  };
  masterDataExpiry = Date.now() + 30 * 60 * 1000; // 30 min cache
  return masterDataCache;
}

// ============================================================
// SYSTEM PROMPT BUILDER
// ============================================================
function buildSystemPrompt(masterData) {
  return `คุณคือ AI Agent สำหรับระบบ RFQ Estimate Packaging ของบริษัท Sirivatana Interprint
หน้าที่ของคุณคือรับข้อมูล spec งานพิมพ์บรรจุภัณฑ์ แล้วแยกข้อมูลลงในฟอร์ม RFQ ให้ถูกต้อง 100%

## กฎสำคัญ
1. ตอบเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอก JSON
2. ถ้าไม่มีข้อมูลในฟิลด์ใด ให้ละไว้ (ไม่ต้องใส่)
3. ขนาดต้องเป็น mm เสมอ (ถ้าได้รับเป็น cm ให้ x10, ถ้าเป็น inches ให้แปลงเป็น mm)
4. สี "8/0" หมายถึง outside=8, inside=0
5. "พิมพ์ 4 สี" หมายถึง outside=4, inside=0
6. paper_code ต้อง match กับรายการที่มีในระบบ (ดูด้านล่าง)
7. component_type: 1=ไม่ประกบลูกฟูก, 2=ประกบลูกฟูก, 3=เฉพาะลูกฟูก

## รหัสกระดาษในระบบ (paper_code)
${JSON.stringify(masterData.paperCodes)}

## GSM ที่มีของแต่ละรหัสกระดาษ
${JSON.stringify(masterData.paperCodeGsmList, null, 0)}

## การแปลงชื่อกระดาษ → paper_code
- "Duplex GBB" หรือ "ดูเพล็กซ์ GBB" → "Dup GBB"
- "Duplex WBB" → "Dup WBB"
- "Duplex BBB" → "Dup BBB"
- **"หน้าขาวหลังเทา"** หรือ **"ขาว/เทา"** หรือ **"ขาวเทา"** → "Dup GBB" (Grey Back — ที่ AE เรียกบ่อย)
- **"หน้าขาวหลังขาว"** หรือ **"ขาว/ขาว"** → "Dup WBB" (White Back)
- **"หน้าขาวหลังน้ำตาล"** หรือ **"ขาว/น้ำตาล"** → "Dup BBB" (Brown Back)
- "อาร์ต" หรือ "Art card" หรือ "AC" → ดูว่า C1s หรือ C2s (ถ้าไม่ระบุใช้ "AC C1s")
- "กระดาษอาร์ต" → "AC C1s"
- "SBS" → "SBS"
- "CRB" → "CRB"
- "Ivory" → "IVR"
- "กระดาษคราฟท์" → "KA" หรือ "KI"
- ถ้าไม่แน่ใจ ใส่ชื่อที่ใกล้เคียงที่สุดจากรายการ
- **สำคัญ**: ถ้า spec มีแค่ "หน้าขาวหลังเทา 350gsm" ให้ตั้ง paper_code="Dup GBB", paper_gram="350" ทันที — อย่าปล่อยว่าง

## ประเภท Coating ในระบบ
${JSON.stringify(masterData.coatingTypes)}

## การแปลง Coating
- "coating gloss UV เว้นลิ้น 1 s" → coating_type_name ที่ใกล้เคียงที่สุด, side=1
- "เคลือบ PVC เงา" → หา coating type ที่มี PVC
- "coating Gloss Hi-rub WB" → หา coating type ที่มี Hi-rub
- "เว้นลิ้น" = side=1 (เคลือบด้านเดียว)
- "2 s" หรือ "2 ด้าน" = side=2

## สี Foil ในระบบ
${JSON.stringify(masterData.foilColors)}

## Box Templates ในระบบ
${JSON.stringify(masterData.boxTemplates)}

## Corrugated Flutes ในระบบ
${JSON.stringify(masterData.corrugatedFlutes)}

## เครื่องจักร Sirivatana Interprint (จาก all spec machine)
Offset: LS540(5สี+Coat 720x1030mm 200-500g DEFAULT packaging), L640C(6สี+Coat 720x1030mm 200-500g), G844C+IR(8สี+Coat 840x1150mm 80-700g)
Flexo: 1448x2398mm สำหรับลูกฟูก/packaging
Digital: JetPress(585x750mm), Konica(330x487mm)
Afterpress: Coating(OPP/UV/Waterbase/SilkScreen/Blister) Diecut(Yoco/Asahi/Bobst/SHIHENG) Hotstamp(LCK/Heidelberg) Folder(14เครื่อง) เย็บเข็ม(12เครื่อง) ไสกาว(MullerMartini/Kolbus)
ถ้า spec ไม่ระบุ print_type → ดูขนาด: ≤720x1030→LS540/L640C, ≤840x1150→G844, >840→Flexo

## Box Template สูตร Open Size
Type1(ReverseTuck):W=2(w+tf)+d,L=2(w+l)+gf | Type2(StraightTuck):เหมือน1 | Type3(TTSLB):W=tf+w+d+w/2+ol | Type4(TTAB):เหมือน3 | Type5(Tray):W=w+4d,L=l+4d+2dust | Type6(FrameVue):W=w+4d+2dust+2ol | Type7(FourCorner):W=2(l+dust)+w,L=2(l+d)+l | Type8(Gable):W=tf+2d+w/2+ol | Type9(Sleeve):W=d,L=2(w+l)+gf | Type10(Pillow):W=l+d,L=2w+gf | Type11(SealEnd):W=2w+d | Type12(Custom):user input
ตัวแปร: w=กว้าง l=ยาว d=ความสูง tf=ฝาเสียบ(15) gf=ติดกาว(15) dust=ปีกกล่อง ol=overlap bleed=3mm

## Business Rules
R0:PatternMatch→หางานเก่าคล้าย685records | R1:PaperCost→DB→RAG→warning | R1b:ComponentName→AutoDetectTemplate | R2:BoxType1-11→AutoDiecut | R3:GluedSpot→checkbox | R4:CompType2/3→CorrugatedSection | R5:CoatingMatch+Alias | R6:PaperSource→Auto | R7:Markup10%domestic/13%import | R8:PackingAutoDetect | R9:Delivery1500THB | R10:MultiFQtyCheck

## Reprint Detection
คำที่ = reprint: reprint, re-print, reprinted, re-run, repeat job, รีพริ้น, รีปริ้น, รีพรินท์, งานซ้ำ, พิมพ์ซ้ำ, พิมพ์ใหม่, สั่งซ้ำ, ปริ้นซ้ำ, ซ้ำเดิม, งานเก่า → job_type="repeat"
สำคัญ: "Rep." ที่ติดกับชื่อสินค้า เช่น "Rep.Tray Wild Tides" ไม่ใช่ reprint — เป็นชื่องาน ต้องดูบริบท

## จังหวัดจัดส่งในระบบ
${JSON.stringify(masterData.provinces.slice(0, 20))}... (รวม ${masterData.provinces.length} จังหวัด)

## โครงสร้าง JSON ที่ต้องตอบ
{
  "job_name": "ชื่องาน",
  "customer_search": "keyword สำหรับค้นหาลูกค้า (ถ้ามี)",
  "new_customer": false,
  "print_type": "Offset|Flexo|JetPress|Konica",
  "ink_type": "conventional|UV",
  "qty": ["1000", "500"],
  "components": [{
    "component_name": "กล่อง|BOX|Sleeve|ฝา|ถาด|...",
    "component_type": 1,
    "box_type_search": "ชื่อทรงกล่องสำหรับค้นหา",
    "packaging_size": { "width": 485, "length": 440, "depth": 0 },
    "paper": {
      "paper_code": "Dup GBB",
      "paper_gram": "400"
    },
    "color": { "outside": 8, "inside": 0 },
    "f_detail": "รหัส F code ถ้ามี เช่น F015731, F015732",
    "addon": [{
      "type": "coating",
      "detail": "coating gloss UV เว้นลิ้น 1 s",
      "coating_type_name": "ชื่อ coating type ที่ match กับระบบ",
      "side": 1
    }, {
      "type": "foilstamp",
      "detail": "ปั๊มฟอยล์ทอง",
      "foil_color": "สีที่ match กับระบบ"
    }, {
      "type": "emboss",
      "detail": "ปั๊มนูน"
    }, {
      "type": "deboss",
      "detail": "ปั๊มจม"
    }],
    "corrugated": {
      "flute_type": "E",
      "color": "สีน้ำตาล"
    },
    "packing_detail": "kraftwrap 50 pcs/pack"
  }],
  "other_process": [{ "name": "ค่าติดกาว", "detail": "" }],
  "handwork_process": [{ "name": "งานมือ", "detail": "" }],
  "outsource": [{ "name": "จัดจ้าง", "detail": "" }],
  "materials": [{ "name": "วัสดุ" }],
  "is_diecut": true,
  "delivery_province": "กรุงเทพฯ",
  "remark": "หมายเหตุเพิ่มเติม",
  "remark_ae": "หมายเหตุจาก AE",
  "edition_names": ["สีฟ้า", "สีชมพู"],
  "edition_qtys": [319, 186]
}

## ตัวอย่างการแปลง

### ตัวอย่าง 1: Structured Format
Input: "TITLE : กล่อง Folding Duplex\\nSIZE (mm.) : 485 x 440 x 0\\nPAPER - กล่อง : Duplex GBB 400 gsm\\nPRINT - กล่อง : 8/0 Colors\\nOTHER - กล่อง : coating gloss UV เว้นลิ้น 1 s\\nPACKING - กล่อง : kraftwrap 50 pcs/pack"

Output:
{
  "job_name": "กล่อง Folding Duplex",
  "components": [{
    "component_name": "กล่อง",
    "component_type": 1,
    "packaging_size": { "width": 485, "length": 440, "depth": 0 },
    "paper": { "paper_code": "Dup GBB", "paper_gram": "400" },
    "color": { "outside": 8, "inside": 0 },
    "addon": [{ "type": "coating", "detail": "coating gloss UV เว้นลิ้น 1 s", "side": 1 }],
    "packing_detail": "kraftwrap 50 pcs/pack"
  }]
}

### ตัวอย่าง 2: Thai Free-text Format
Input: "งานพิมพ์กล่องออฟเซ็ท ประกบกระดาษลูกฟูก\\nทรงฝาเปิดบนก้นขัด\\nกล่อง ขนาดขึ้นรูป 18x18x37 cm\\nกระดาษอาร์ต 190 แกรม พิมพ์ 4 สี เคลือบ PVC เงา\\nประกบลูกฟูกกลอน E สีน้ำตาล\\nปั๊มไดคัท ประกาวข้าง 2 ตำแหน่ง\\n5 แบบ: สีฟ้า 319, สีชมพู 186, สีเขียว 313, สีเทา 244, สีน้ำตาล 188\\nรวม 1250 กล่อง"

Output:
{
  "job_name": "งานพิมพ์กล่องออฟเซ็ท ประกบกระดาษลูกฟูก",
  "print_type": "Offset",
  "qty": ["319", "186", "313", "244", "188"],
  "components": [{
    "component_name": "กล่อง",
    "component_type": 2,
    "box_type_search": "ฝาเปิดบนก้นขัด",
    "packaging_size": { "width": 180, "length": 180, "depth": 370 },
    "paper": { "paper_code": "AC C1s", "paper_gram": "190" },
    "color": { "outside": 4, "inside": 0 },
    "addon": [{ "type": "coating", "detail": "เคลือบ PVC เงา", "side": 1 }],
    "corrugated": { "flute_type": "E", "color": "สีน้ำตาล" },
    "packing_detail": ""
  }],
  "is_diecut": true,
  "other_process": [{ "name": "ประกาวข้าง 2 ตำแหน่ง" }],
  "edition_names": ["สีฟ้า", "สีชมพู", "สีเขียว", "สีเทา", "สีน้ำตาล"],
  "edition_qtys": [319, 186, 313, 244, 188],
  "remark": "บล็อคเดียวกันหมด"
}

## หมายเหตุสำคัญ
- "ประกบลูกฟูก" หรือ "ประกบกระดาษลูกฟูก" → component_type = 2
- "ไม่ประกบลูกฟูก" → component_type = 1
- "เฉพาะลูกฟูก" → component_type = 3
- ถ้ามีหลาย component (เช่น กล่อง + ฝา + ถาด) ให้แยกเป็น array
- "ลูกค้า XXX" → customer_search = "XXX"
- "ออฟเซ็ท" → print_type = "Offset"
- "เฟล็กโซ่" → print_type = "Flexo"
- ปั๊มไดคัท → is_diecut = true
- ค่าติดกาว, ประกาว → other_process
- F code (F015731 เป็นต้น) → f_detail ใน component
- qty อาจมาเป็นตัวเลขเดียว หรือหลายตัว (แต่ละแบบ/edition)
- ถ้ามีหลาย edition ที่ qty ต่างกัน ให้ใส่ใน qty array + edition_names + edition_qtys`;
}

// ============================================================
// SPEC PARSE CACHE — avoid redundant API calls for same/similar specs
// ============================================================
const specCache = new Map(); // key: normalized hash → { data, validation, source, timestamp }
const SPEC_CACHE_MAX = 50;
const SPEC_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function normalizeSpecForCache(text) {
  // Normalize whitespace, case-insensitive, strip trailing spaces per line
  return text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/ +\n/g, '\n').trim().toLowerCase();
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

// Jaccard similarity on word tokens (0-1)
function specSimilarity(a, b) {
  const tokA = new Set(a.split(/[\s,/|]+/).filter(w => w.length > 1));
  const tokB = new Set(b.split(/[\s,/|]+/).filter(w => w.length > 1));
  if (tokA.size === 0 && tokB.size === 0) return 1;
  let inter = 0;
  for (const w of tokA) { if (tokB.has(w)) inter++; }
  return inter / (tokA.size + tokB.size - inter);
}

function findCachedSpec(normalized) {
  const now = Date.now();
  const hash = simpleHash(normalized);

  // 1. Exact match by hash
  if (specCache.has(hash)) {
    const entry = specCache.get(hash);
    if (now - entry.timestamp < SPEC_CACHE_TTL) {
      return { ...entry, matchType: 'exact', similarity: 1.0 };
    }
    specCache.delete(hash);
  }

  // 2. Similarity match (>= 90%)
  for (const [key, entry] of specCache) {
    if (now - entry.timestamp >= SPEC_CACHE_TTL) { specCache.delete(key); continue; }
    const sim = specSimilarity(normalized, entry.normalized);
    if (sim >= 0.9) {
      return { ...entry, matchType: 'similar', similarity: sim };
    }
  }
  return null;
}

function cacheSpec(normalized, data, validation, source) {
  const hash = simpleHash(normalized);
  // Evict oldest if full
  if (specCache.size >= SPEC_CACHE_MAX) {
    const oldest = [...specCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    if (oldest) specCache.delete(oldest[0]);
  }
  specCache.set(hash, { data, validation, source, normalized, timestamp: Date.now() });
}

// ============================================================
// PARSE SPEC ENDPOINT - LLM-based parsing (with cache)
// ============================================================
app.post('/api/parse-spec', async (req, res) => {
  let { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  // === Pre-normalize spec text (bullet/colon/whitespace/size/color/gram/paper-code) ===
  // ใช้ normalized version ตลอดทั้ง pipeline เพื่อให้ทุก parser ได้ผลตรงกัน
  message = normalizeSpecPreParse(message);

  // === Cache check ===
  const normalized = normalizeSpecForCache(message);
  const cached = findCachedSpec(normalized);
  if (cached) {
    console.log(`[Spec Cache] ${cached.matchType} hit (${(cached.similarity * 100).toFixed(0)}%) — skipping parse`);
    return res.json({
      success: true,
      data: cached.data,
      source: cached.source + '_cached',
      validation: cached.validation,
      _cached: true,
      _matchType: cached.matchType,
      _similarity: cached.similarity,
    });
  }

  try {
    // Load master data for prompt
    const masterData = await loadMasterDataForPrompt();

    // === Smart Context Builder: find similar past specs from Knowledge Store ===
    let knowledgeContext = '';
    try {
      const knowledge = loadKnowledge();
      if (knowledge.length > 0) {
        const words = message.toLowerCase().split(/[\s,/]+/).filter(w => w.length > 2);
        const similar = knowledge
          .map(k => {
            const kText = (k.spec_text + ' ' + k.final.job_name + ' ' + (k.final.components?.[0]?.paper_code || '')).toLowerCase();
            const score = words.filter(w => kText.includes(w)).length;
            return { k, score };
          })
          .filter(s => s.score >= 2)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        if (similar.length > 0) {
          knowledgeContext = '\n\n## ตัวอย่าง spec ที่เคย parse สำเร็จมาก่อน (ใช้เป็น reference)\n';
          similar.forEach((s, i) => {
            const c = s.k.final.components?.[0] || {};
            knowledgeContext += `ตัวอย่าง ${i + 1}: "${s.k.spec_text?.substring(0, 100) || s.k.final.job_name}"\n`;
            knowledgeContext += `  → paper: ${c.paper_code} ${c.paper_gram}gsm, box: ${c.box_type_name || 'Type ' + c.box_type_id}, color: ${c.color_out}/${c.color_in}\n`;
          });
        }
      }
    } catch (e) { /* knowledge not available */ }

    // === Correction Learning Context: คำเตือนจาก field ที่เคยผิด ===
    const correctionContext = buildCorrectionContext(message);

    const systemPrompt = buildSystemPrompt(masterData) + knowledgeContext + correctionContext;

    // === Smart Routing: Structured spec → Built-in Parser (เร็ว+แม่น F-codes)
    //                    Free-text/casual → LLM (เข้าใจ typo+ภาษาธรรมชาติ) ===
    const isStructured = /^TITLE\s*:/im.test(message) && (/PAPER/i.test(message) || /PRINT/i.test(message));
    if (isStructured) {
      console.log('[Smart Parse] Structured spec detected → Built-in Parser first');
      const parsed = builtInSpecParser(message);
      const validation = validateParsedData(parsed);
      // ถ้า Built-in จับได้ดี (มี job_name + components) → ใช้เลย
      if (parsed.job_name && parsed.components?.length > 0) {
        const { applied } = applyLearnedCorrections(parsed, message);
        cacheSpec(normalized, parsed, validation, 'builtin_smart');
        return res.json({ success: true, data: parsed, source: 'builtin_smart', validation, _learned: applied });
      }
      console.log('[Smart Parse] Built-in incomplete, trying LLM...');
    }

    // === LLM: สำหรับ free-text/casual spec หรือ structured ที่ Built-in จับไม่ครบ ===
    try {
      const { execSync } = await import('child_process');
      const fs = await import('fs');
      const os = await import('os');
      const tmpPath = await import('path');
      const fullPrompt = `${systemPrompt}\n\n---\n\nSpec ที่ต้องแยกข้อมูล:\n${message}\n\n---\nตอบเป็น JSON เท่านั้น:`;
      const tmpFile = tmpPath.default.join(os.default.tmpdir(), `pornchai_parse_${Date.now()}.txt`);
      fs.default.writeFileSync(tmpFile, fullPrompt, 'utf-8');
      // ใช้ pornchai-chat (Sonnet) แทน coder (Opus) — ประหยัด 5x, parse ได้ดีเท่ากัน
      console.log(`[LLM Parse] Sending spec to Sonnet via OpenClaw... (${message.length} chars)`);
      const cmd = `openclaw agent --agent pornchai-chat --message "$(cat '${tmpFile.replace(/\\/g, '/')}')" --json`;
      let stdout;
      try {
        stdout = execSync(cmd, { timeout: 60000, maxBuffer: 2 * 1024 * 1024, encoding: 'utf-8', shell: 'bash' });
      } finally {
        try { fs.default.unlinkSync(tmpFile); } catch {}
      }
      // Extract JSON from stdout
      const jsonCli = stdout.match(/\{[\s\S]*\}/);
      if (!jsonCli) throw new Error('No JSON in CLI output');
      const cliResult = JSON.parse(jsonCli[0]);
      const reply = cliResult.result?.payloads?.[0]?.text || '';
      const parsed = extractJsonFromReply(reply);
      console.log(`[LLM Parse] Response (${cliResult.result?.meta?.durationMs || '?'}ms): ${reply.substring(0, 100)}`);

      if (parsed) {
        const validation = validateParsedData(parsed);
        const { applied } = applyLearnedCorrections(parsed, message);
        cacheSpec(normalized, parsed, validation, 'llm_opus');
        return res.json({ success: true, data: parsed, source: 'llm_opus', validation, raw: reply, _learned: applied });
      }
      console.log('[LLM Parse] Could not extract JSON from LLM response, falling back to built-in');
    } catch (llmErr) {
      console.log('[LLM Parse] LLM not available, using built-in parser:', llmErr.message?.substring(0, 80));
    }

    // Fallback: Built-in rule-based parser (covers common patterns)
    const parsed = builtInSpecParser(message);
    const validation = validateParsedData(parsed);
    const { applied } = applyLearnedCorrections(parsed, message);
    cacheSpec(normalized, parsed, validation, 'builtin');
    res.json({ success: true, data: parsed, source: 'builtin', validation, _learned: applied });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// INFER COMPONENT NAME — AI วิเคราะห์ประเภทงานจาก context
// ============================================================
function inferComponentName(comp, jobNameOrText) {
  const text = (jobNameOrText || '').toLowerCase();
  const boxTypeId = parseInt(comp.box_type?.type_id) || 0;
  const boxSearch = (comp.box_type_search || '').toLowerCase();
  // 1. Detect from job name / original text
  if (/book|หนังสือ|สมุด|catalog|แคตตาล็อก|brochure|โบรชัวร์|leaflet|แผ่นพับ|pamphlet/i.test(text)) return 'book';
  if (/sleeve|ปลอก|สลีฟ|wrapper|แรปเปอร์/i.test(text)) return 'sleeve';
  if (/lid|ฝา|cover|ฝาปิด/i.test(text)) return 'lid';
  if (/tray|ถาด|insert|อินเสิร์ท/i.test(text)) return 'tray';
  if (/label|ฉลาก|สติ๊กเกอร์|sticker/i.test(text)) return 'label';
  if (/card|การ์ด|แท็ก|tag|hang\s*tag/i.test(text)) return 'card';
  if (/pouch|ซอง|bag|ถุง/i.test(text)) return 'pouch';

  // 2. Detect from box type
  if (boxTypeId === 9 || /sleeve|ปลอก/i.test(boxSearch)) return 'sleeve';
  if (boxTypeId === 10 || /pillow/i.test(boxSearch)) return 'box';
  if (boxTypeId === 5 || boxTypeId === 6 || /tray|ถาด|frame/i.test(boxSearch)) return 'tray';
  if (boxTypeId >= 1 && boxTypeId <= 12) return 'box';
  if (/กล่อง|box|carton|folding/i.test(boxSearch)) return 'box';

  // 3. Detect from keywords in full text
  if (/กล่อง|box|carton|packaging/i.test(text)) return 'box';

  // 4. Default: if has box_type or size → likely a box
  if (comp.box_type?.type_id || (comp.packaging_size?.width && comp.packaging_size?.length)) return 'box';

  return '';
}

// ============================================================
// VALIDATION - Check parsed data for missing/unclear fields
// ============================================================
function validateParsedData(data) {
  const missing = [];   // ข้อมูลที่ขาด (จำเป็น)
  const warnings = [];  // ข้อมูลที่ไม่ชัดเจน / ควรตรวจสอบ
  const info = [];      // ข้อมูลเพิ่มเติม

  // === REQUIRED FIELDS ===
  if (!data.job_name) {
    missing.push({ field: 'job_name', label: 'ชื่องาน', message: 'ไม่พบชื่องาน กรุณาระบุชื่องาน' });
  }

  if (!data.qty || data.qty.length === 0 || !data.qty.some(q => q && q !== '0')) {
    missing.push({ field: 'qty', label: 'จำนวนผลิต', message: 'ไม่พบจำนวนผลิต กรุณาระบุจำนวนที่ต้องการผลิต' });
  }

  // === COMPONENT VALIDATION ===
  if (!data.components || data.components.length === 0) {
    missing.push({ field: 'components', label: 'Component', message: 'ไม่พบข้อมูล Component กรุณาระบุรายละเอียดชิ้นงาน' });
  } else {
    data.components.forEach((c, i) => {
      const ci = data.components.length > 1 ? ` (Component ${i + 1})` : '';

      // Paper
      if (!c.paper || !c.paper.paper_code) {
        missing.push({ field: `comp.${i}.paper_code`, label: `ประเภทกระดาษ${ci}`, message: `ไม่พบประเภทกระดาษ${ci} กรุณาระบุ เช่น Duplex GBB, AC C1s` });
      }
      if (!c.paper || !c.paper.paper_gram) {
        missing.push({ field: `comp.${i}.paper_gram`, label: `แกรมกระดาษ${ci}`, message: `ไม่พบน้ำหนักกระดาษ (แกรม)${ci}` });
      }

      // Color
      if (!c.color || (c.color.outside === undefined && c.color.outside !== 0)) {
        missing.push({ field: `comp.${i}.color`, label: `สีพิมพ์${ci}`, message: `ไม่พบจำนวนสีพิมพ์${ci} กรุณาระบุ เช่น 4/0, 8/0` });
      }

      // Size
      if (!c.packaging_size || (!c.packaging_size.width && !c.packaging_size.length)) {
        missing.push({ field: `comp.${i}.size`, label: `ขนาด${ci}`, message: `ไม่พบขนาดชิ้นงาน${ci} กรุณาระบุ (กว้าง x ยาว x สูง)` });
      }

      // Component name — auto-infer from context if missing
      if (!c.component_name) {
        c.component_name = inferComponentName(c, data.job_name || text);
        if (c.component_name) {
          warnings.push({ field: `comp.${i}.name`, label: `ชื่อ Component${ci}`, message: `AI วิเคราะห์ว่าเป็นงาน "${c.component_name}" — แก้ไขได้ถ้าไม่ถูกต้อง` });
        } else {
          missing.push({ field: `comp.${i}.name`, label: `ชื่อ Component${ci}`, message: `ไม่พบชื่อ Component${ci} กรุณาระบุ เช่น box, กล่อง, sleeve, book` });
        }
      }

      // Coating - unclear type
      if (c.addon && c.addon.length > 0) {
        c.addon.forEach((a, ai) => {
          if (a.type === 'coating' && a.detail) {
            // Check if coating detail is vague
            if (!/gloss|matte|matt|uv|pvc|hi-rub|wb|pe|water/i.test(a.detail)) {
              warnings.push({ field: `comp.${i}.addon.${ai}`, label: `Coating${ci}`, message: `ประเภท Coating "${a.detail}" ไม่ชัดเจน กรุณาตรวจสอบ (เช่น Gloss UV, Matte, PVC เงา)` });
            }
          }
        });
      }

      // Corrugated but no flute info
      if (c.component_type === 2 && (!c.corrugated || !c.corrugated.flute_type)) {
        warnings.push({ field: `comp.${i}.corrugated`, label: `ลูกฟูก${ci}`, message: `ระบุว่าประกบลูกฟูกแต่ไม่มีข้อมูลกลอน (A/B/C/E/F) กรุณาตรวจสอบ` });
      }

      // Box type not specified or auto-detected with medium confidence
      if (!c.box_type_search && !c.box_type_id && (!c.box_type || (!c.box_type.type_id && !c.box_type.type_name))) {
        info.push({ field: `comp.${i}.box_type`, label: `ทรงกล่อง${ci}`, message: `ไม่ได้ระบุทรงกล่อง กรุณาเลือก Template กล่องด้วยตนเอง` });
      } else if (c._box_type_confidence === 'medium') {
        warnings.push({ field: `comp.${i}.box_type`, label: `ทรงกล่อง${ci}`, message: `AI วิเคราะห์ว่าน่าจะเป็น Template ${c.box_type_id} — กรุณาตรวจสอบ` });
      }

      // Packing
      if (!c.packing_detail && (!c.packing || c.packing.length === 0)) {
        info.push({ field: `comp.${i}.packing`, label: `Packing${ci}`, message: `ไม่ได้ระบุวิธี Packing` });
      }
    });
  }

  // === CUSTOMER ===
  if (!data.customer_search && !data.customer && !data.new_customer) {
    info.push({ field: 'customer', label: 'ลูกค้า', message: 'ไม่พบข้อมูลลูกค้า ระบบจะตั้งเป็น "ลูกค้าใหม่"' });
  }

  // === DELIVERY ===
  if (!data.delivery_province && (!data.delivery || data.delivery.length === 0)) {
    info.push({ field: 'delivery', label: 'สถานที่จัดส่ง', message: 'ไม่ได้ระบุสถานที่จัดส่ง' });
  }

  // === EDITION AMBIGUITY ===
  if (data.edition_names && data.edition_qtys) {
    const total = data.edition_qtys.reduce((s, q) => s + (parseInt(q) || 0), 0);
    if (data.qty && data.qty.length === 1 && parseInt(data.qty[0]) !== total) {
      warnings.push({ field: 'qty_mismatch', label: 'จำนวนผลิต', message: `จำนวนรวม edition (${total}) ไม่ตรงกับจำนวนที่ระบุ (${data.qty[0]}) กรุณาตรวจสอบ` });
    }
  }

  // === PRINT TYPE AMBIGUITY ===
  if (!data.print_type) {
    info.push({ field: 'print_type', label: 'ระบบพิมพ์', message: 'ไม่ได้ระบุระบบพิมพ์ ระบบจะใช้ค่าเริ่มต้น "Offset"' });
  }

  return { missing, warnings, info, isComplete: missing.length === 0 };
}

// Extract JSON from AI reply text
function extractJsonFromReply(text) {
  if (!text) return null;
  // Try direct JSON parse
  try { return JSON.parse(text.trim()); } catch {}
  // Try extracting from markdown code block
  const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    try { return JSON.parse(codeMatch[1].trim()); } catch {}
  }
  // Try finding first { ... } block
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try { return JSON.parse(braceMatch[0]); } catch {}
  }
  return null;
}

// ============================================================
// BOX TEMPLATE AUTO-DETECT
// ============================================================
function detectBoxTemplate(text) {
  // Normalize text for matching
  const t = (text || '').toLowerCase();

  // Each rule: { keywords (any match), id, confidence: 'high'|'medium' }
  // HIGH CONFIDENCE RULES RUN FIRST — before Knowledge Store
  const rules = [
    // === HIGH CONFIDENCE — ชื่อตรง ครบ 12 แบบ ===
    // Type 1: Reverse Tuck End — ฝาสลับ
    { id: 1,  confidence: 'high', test: () => /\breverse\s*tuck\b|ฝาสลับ|ฝาเสียบ(?!.*ตรง)/.test(t) },
    // Type 2: Straight Tuck End — ฝาตรง
    { id: 2,  confidence: 'high', test: () => /\bstraight\s*tuck\b|ฝาตรง/.test(t) },
    // Type 3: TTSLB — ออโต้ล็อคหูขัด / ก้นขัด / (2TT)
    { id: 3,  confidence: 'high', test: () => /\bttslb\b|snap\s*lock|ออโต้ล็อค.*หูขัด|หูขัด|ก้นขัด|ฝาเปิดบน.*ก้น|\(2tt\)/.test(t) },
    // Type 4: TTAB — ออโต้ล็อคทากาว / (1TT)
    { id: 4,  confidence: 'high', test: () => /\bttab\b|auto\s*(?:lock\s*)?bottom|ออโต้ล็อค.*ทากาว|ออโต้.*ทากาว|ก้นล็อค.*ทากาว|\(1tt\)/.test(t) },
    // Type 5: Double Glue Side Wall (Tray) — ฝาครอบ / ถาด
    { id: 5,  confidence: 'high', test: () => /\b(?:simple\s*tray|double\s*glue|tray\s*(?:&|and)\s*lid)\b|ฝาครอบ|(?:กล่อง)?ถาด(?:และฝา)?/.test(t) },
    // Type 6: Frame-Vue Tray — ฝาครอบมีขอบ
    { id: 6,  confidence: 'high', test: () => /\bframe[\s-]*vue\b|ฝาครอบ.*(?:มี)?ขอบ|เทรย์.*ขอบ/.test(t) },
    // Type 7: Four Corner Beers Tray — เบเนโตะ
    { id: 7,  confidence: 'high', test: () => /\b(?:four\s*corner|beers?\s*tray|4\s*corner)\b|เบ(?:เน|น)โตะ|เบียร์เทรย์/.test(t) },
    // Type 8: Gable Top — จั่ว / หูหิ้ว
    { id: 8,  confidence: 'high', test: () => /\bgable\s*top\b|ทรงจั่ว|จั่ว|หูหิ้ว|กล่องหูหิ้ว/.test(t) },
    // Type 9: Sleeve — ปลอก / สลีฟ / สายคาด
    { id: 9,  confidence: 'high', test: () => /\bsleeve\b|ปลอก(?:กล่อง)?|สลีฟ|สายคาด/.test(t) },
    // Type 10: Pillow Box — หมอน
    { id: 10, confidence: 'high', test: () => /\bpillow\s*(?:box)?\b|ทรงหมอน|หมอน/.test(t) },
    // Type 11: Seal End — ฝาปิดทากาว / ซีลเอ็น
    { id: 11, confidence: 'high', test: () => /\bseal\s*end\b|ฝาปิด.*ทากาว|ซีล\s*เอ็น/.test(t) },
    // Type 12: Custom — กำหนดเอง
    { id: 12, confidence: 'high', test: () => /\bcustom\b|กำหนดเอง/.test(t) },

  ];

  // Run HIGH confidence rules first
  for (const rule of rules) {
    if (rule.confidence === 'high' && rule.test()) {
      return { type_id: rule.id, confidence: 'high' };
    }
  }

  // Then try Knowledge Store (majority vote from past specs)
  try {
    const knowledge = loadKnowledge();
    if (knowledge.length >= 3) {
      const words = t.split(/[\s,/]+/).filter(w => w.length > 2);
      const matchedBoxTypes = {};
      let totalMatches = 0;
      for (const k of knowledge) {
        const kText = (k.spec_text + ' ' + k.final.job_name).toLowerCase();
        const matchScore = words.filter(w => kText.includes(w)).length;
        if (matchScore >= 2) {
          const btId = k.final.components?.[0]?.box_type_id;
          if (btId) { matchedBoxTypes[btId] = (matchedBoxTypes[btId] || 0) + 1; totalMatches++; }
        }
      }
      if (totalMatches >= 3) {
        const best = Object.entries(matchedBoxTypes).sort((a, b) => b[1] - a[1])[0];
        const ratio = best[1] / totalMatches;
        if (ratio >= 0.6) {
          return { type_id: parseInt(best[0]), confidence: ratio >= 0.8 ? 'high' : 'medium', source: 'knowledge', matches: totalMatches };
        }
      }
    }
  } catch (e) {}

  // Then MEDIUM confidence rules
  const mediumRules = [
    { id: 9,  test: () => /(?:กล่อง)?ปลอก|wrap\s*around|(?:กล่อง)?สวม|wrapper|แรปเปอร์/.test(t) },
    { id: 5,  test: () => /\blid\b|\btray\b|ถาด|cover(?!.*sleeve)/.test(t) },
    { id: 3,  test: () => /ออโต้(?:ล็อค)?|auto\s*lock/.test(t) },
    { id: 1,  test: () => /กล่อง(?:ครีม|เครื่องสำอาง|สบู่|ยา|อาหาร(?:เสริม)?|ขนม|ชา|กาแฟ|น้ำหอม|วิตามิน|เซรั่ม)|(?:folding|carton)\s*box/.test(t) },
  ];
  for (const rule of mediumRules) {
    if (rule.test()) return { type_id: rule.id, confidence: 'medium' };
  }

  return null;
}

// ============================================================
// BUILT-IN SPEC PARSER (Rule-based fallback)
// ============================================================

/**
 * normalizeSpecPreParse — comprehensive normalizer ที่ทำให้ spec ทุกรูปแบบ
 * ผ่าน parser ได้แบบ deterministic
 *
 * จัดการ:
 * - Bullet styles: -, –, —, •, *, ▪, ‣, o, ◦, ●
 * - Colons: :, ：(fullwidth), ; (some users use)
 * - Whitespace: tab, non-breaking space (\u00a0), zero-width, fullwidth space (\u3000)
 * - Size separators: ×, *, X, ✕ → x
 * - Color separators: 4+0, 4-0, 4 c x 0 c → 4/0
 * - Gram suffixes: GSM, Gsm, gsm, แกรม, gram, grams, g (with number)
 * - Paper code variants: A/C, A-C, A.C, AC → AC (canonical)
 * - Quotes: "X", 'X', "X", 'X' → X
 * - Brackets in component names: (Tray) → Tray
 * - Multiple spaces → single space
 * - Trailing whitespace per line
 */
function normalizeSpecPreParse(text) {
  if (!text) return '';
  let s = text;

  // 1. Normalize line endings + remove BOM
  s = s.replace(/\r\n|\r/g, '\n').replace(/^\ufeff/, '');

  // 2. Normalize whitespace characters
  s = s.replace(/[\u00a0\u2000-\u200b\u202f\u205f\u3000]/g, ' '); // various spaces → regular space
  s = s.replace(/\t/g, ' '); // tab → space

  // 3. Normalize bullet styles → "-"
  s = s.replace(/^(\s*)[•▪‣◦●○■□✓\*]\s+/gm, '$1- ');
  s = s.replace(/^(\s*)[–—]\s+/gm, '$1- '); // en-dash, em-dash → hyphen

  // 4. Normalize colons (fullwidth → ASCII)
  s = s.replace(/：/g, ':');

  // 5. Normalize size separators: ×, *, ✕, X → x (only between numbers)
  s = s.replace(/(\d)\s*[×*✕X]\s*(\d)/g, '$1x$2');
  s = s.replace(/(\d)\s*[×*✕X]\s*(\d)/g, '$1x$2'); // run twice for triple-dim "WxLxD"

  // 6. Normalize color notation: 4+0, 4-0, 4 c x 0 c, 4 col / 0 col → 4/0
  s = s.replace(/(\d+)\s*[cC]\s*[xX]\s*(\d+)\s*[cC]/g, '$1/$2');
  s = s.replace(/(\d+)\s*\+\s*(\d+)\s*(?=cols?|colors?|สี|c\b|$|\s)/gi, '$1/$2');
  s = s.replace(/(\d+)\s*สี\s*\/\s*(\d+)\s*สี/g, '$1/$2');

  // 7. Normalize gram suffix: ensure "gsm" detection works
  s = s.replace(/(\d+)\s*[Gg][Ss][Mm]\b/g, '$1 gsm');
  s = s.replace(/(\d+)\s*แกรม/g, '$1 gsm');
  s = s.replace(/(\d+)\s*[Gg]rams?\b/g, '$1 gsm');
  s = s.replace(/(\d+)\s*[Gg]\b(?!\w)/g, '$1 gsm'); // 350g → 350 gsm

  // 8. Normalize paper code: A/C, A-C, A.C → A/C (canonical form parser knows)
  s = s.replace(/\bA\s*[\/\-.]\s*C\s*(C[12]s)\b/gi, 'A/C $1');
  s = s.replace(/\b(Dup|Duplex)\s*\.\s*(GBB|WBB|BBB)\b/gi, '$1 $2');

  // 9. Normalize Thai paper aliases (consistent spacing)
  s = s.replace(/อาร์ท/g, 'อาร์ต'); // อาร์ท → อาร์ต
  s = s.replace(/ดูเพล็ค(?:ซ)?/g, 'ดูเพล็กซ์');

  // 10. Strip quotes around words
  s = s.replace(/[""''](.*?)[""'']/g, '$1');

  // 11. Strip leading bullets from component names that user wrapped in (...)
  // "- (Tray): ไม่ประกบ..." → "- Tray: ไม่ประกบ..."
  s = s.replace(/^(\s*[-]\s*)\(([^)]+)\)\s*:/gm, '$1$2:');
  s = s.replace(/^(\s*[-]\s*)\[([^\]]+)\]\s*:/gm, '$1$2:');

  // 12. Collapse multiple spaces (preserve newlines)
  s = s.split('\n').map(line => line.replace(/[ ]+/g, ' ').trimEnd()).join('\n');

  // 13. Remove blank lines that are just whitespace
  s = s.split('\n').map(l => l.trim().length === 0 ? '' : l).join('\n');

  return s;
}

// ============================================================
// SMART PAPER MATCHER — multi-signal matching
// ใช้ทุก column ของ master DB + correction history + fuzzy
// ============================================================

// Levenshtein distance
function _levDist(a, b) {
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
function _strSim(a, b) {
  if (!a || !b) return 0;
  const max = Math.max(a.length, b.length);
  return max === 0 ? 1 : 1 - (_levDist(a, b) / max);
}

// Normalize: lowercase, remove all separators, collapse
function _normPaperKey(s) {
  return (s || '').toString().toLowerCase().replace(/[\s\/\-_.]/g, '').trim();
}

// Token overlap score (0-1)
function _tokenOverlap(a, b) {
  if (!a || !b) return 0;
  const ta = new Set(a.toLowerCase().split(/[\s\/\-_,]+/).filter(t => t.length > 0));
  const tb = new Set(b.toLowerCase().split(/[\s\/\-_,]+/).filter(t => t.length > 0));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  ta.forEach(t => { if (tb.has(t)) inter++; });
  return inter / Math.max(ta.size, tb.size);
}

// Hardcoded Thai/AE alias → canonical paper_code (high confidence shortcuts)
// อิงจาก master DB จริง: AC C1s, AC C2s, Dup BBB/GBB/WBB, GA, GG, GY, GB,
// KP, KI, KS, TS, MA, MG, MY, PP-CKT, PP-GKT, PP-MKT, WC, WF
const PAPER_ALIASES = [
  // === Duplex variants (หน้าขาวหลัง...) ===
  { patterns: [
    /หน้า\s*ขาว\s*หลัง\s*เทา/i, /ขาว[\/\-\s]*เทา/i,
    /ดูเพล็กซ์.*(?:เทา|gbb)/i, /duplex.*gbb/i, /\bgbb\b/i,
    /กระดาษแข็งหลังเทา/i,
  ], code: 'Dup GBB', confidence: 98 },
  { patterns: [
    /หน้า\s*ขาว\s*หลัง\s*ขาว/i, /ขาว[\/\-\s]*ขาว(?!ครีม)/i,
    /ดูเพล็กซ์.*(?:ขาวล้วน|wbb)/i, /duplex.*wbb/i, /\bwbb\b/i,
    /กระดาษแข็งหลังขาว/i,
  ], code: 'Dup WBB', confidence: 98 },
  { patterns: [
    /หน้า\s*ขาว\s*หลัง\s*(?:น้ำตาล|ครีม)/i, /ขาว[\/\-\s]*(?:น้ำตาล|ครีม)/i,
    /ดูเพล็กซ์.*(?:น้ำตาล|bbb)/i, /duplex.*bbb/i, /\bbbb\b/i,
    /กระดาษแข็งหลังน้ำตาล/i,
  ], code: 'Dup BBB', confidence: 98 },

  // === Art Card C1s/C2s (เกรด 1 ด้าน / 2 ด้าน) ===
  { patterns: [
    /\bAC\s*C1s\b/i, /\bA[\/\-\s]C\s*C1s\b/i,
    /อาร์ต(?:การ์ด|การ์ต)?\s*c1s/i,
    /art\s*card\s*c1s/i, /art\s*board\s*1\s*side/i,
    /\b1\s*side\s*coat/i, /เคลือบ\s*1\s*ด้าน/i,
  ], code: 'AC C1s', confidence: 99 },
  { patterns: [
    /\bAC\s*C2s\b/i, /\bA[\/\-\s]C\s*C2s\b/i,
    /อาร์ต(?:การ์ด|การ์ต)?\s*c2s/i,
    /art\s*card\s*c2s/i, /art\s*board\s*2\s*side/i,
    /\b2\s*side\s*coat/i, /เคลือบ\s*2\s*ด้าน/i,
  ], code: 'AC C2s', confidence: 99 },
  // อาร์ตการ์ด ทั่วไป (ไม่ระบุ C1/C2 → default C1s)
  { patterns: [
    /^อาร์ต(?:การ์ด|การ์ต)?\s*\d/i,
    /อาร์ตการ์ด/i, /อาร์ทการ์ด/i,
    /art\s*card(?!\s*c[12])/i,
    /\bAC\b(?!\s*C[12])/i,
  ], code: 'AC C1s', confidence: 88 },

  // === Matt Art ===
  { patterns: [
    /matt?\s*art\b/i, /อาร์ต\s*ด้าน/i, /อาร์ทด้าน/i,
    /\bMA\b(?!\s*[a-z])/i, /matt?\s*coat/i,
    /กระดาษด้าน/i,
  ], code: 'MA', confidence: 96 },
  // Matt white / green back (MG)
  { patterns: [
    /matt?\s*white.*green/i, /matt?.*หลังเขียว/i, /\bmg\b/i,
    /ด้าน.*หลังเขียว/i,
  ], code: 'MG', confidence: 95 },
  // Matt white / yellow back (MY)
  { patterns: [
    /matt?\s*white.*yellow/i, /matt?.*หลังเหลือง/i, /\bmy\b/i,
    /ด้าน.*หลังเหลือง/i,
  ], code: 'MY', confidence: 95 },

  // === Gloss Art ===
  { patterns: [
    /gloss\s*art\b/i, /อาร์ต\s*เงา/i, /อาร์ทเงา/i,
    /\bGA\b(?!\s*[a-z])/i, /อาร์ตมัน/i, /กระดาษเงา/i,
  ], code: 'GA', confidence: 96 },
  // Gloss white / green back (GG)
  { patterns: [
    /gloss\s*white.*green/i, /\bgg\b/i,
    /เงา.*หลังเขียว/i,
  ], code: 'GG', confidence: 95 },
  // Gloss white / yellow back (GY)
  { patterns: [
    /gloss\s*white.*yellow/i, /\bgy\b/i,
    /เงา.*หลังเหลือง/i,
  ], code: 'GY', confidence: 95 },

  // === Grey Board (GB) ===
  { patterns: [
    /grey\s*board/i, /gray\s*board/i, /\bGB\b(?!\s*[a-z])/i,
    /กระดาษเทา/i, /กระดาษจั่วปัง/i, /จั่วปัง/i,
  ], code: 'GB', confidence: 95 },

  // === Kraft variants ===
  // KS = white kraft top liner
  { patterns: [
    /kraft.*top.*liner.*white/i, /kraft.*white.*top/i,
    /คราฟ?ท?\s*(?:ขาว|top|topliner)/i,
    /\bks\b/i, /white\s*kraft/i,
  ], code: 'KS', confidence: 92 },
  // KI = cream kraft top liner
  { patterns: [
    /kraft.*top.*liner.*cream/i, /kraft.*cream/i,
    /คราฟ?ท?\s*ครีม/i, /\bki\b/i,
  ], code: 'KI', confidence: 92 },
  // KP = generic Kraft KP
  { patterns: [
    /\bKraft\s*KP\b/i, /\bKP\b(?!\s*[a-z])/i,
    /คราฟ?ท?\s*kp/i,
  ], code: 'KP', confidence: 90 },
  // TS = generic Kraft TS
  { patterns: [
    /\bKraft\s*TS\b/i, /\bTS\b(?!\s*[a-z])/i,
  ], code: 'TS', confidence: 90 },
  // คราฟท์ทั่วไป → KP (default kraft)
  { patterns: [
    /คราฟ?ท?(?:\s|$)/i, /\bkraft\b/i, /กระดาษคราฟ/i,
    /กระดาษน้ำตาล/i, /สีน้ำตาลธรรมชาติ/i,
  ], code: 'KP', confidence: 80 },

  // === Sticker / PP K-tek ===
  { patterns: [
    /pp.*clear|clear.*sticker|สติกเกอร์ใส/i, /\bpp[\s\-]?ckt\b/i,
  ], code: 'PP-CKT', confidence: 95 },
  { patterns: [
    /pp.*gloss|gloss.*sticker|สติกเกอร์เงา/i, /\bpp[\s\-]?gkt\b/i,
  ], code: 'PP-GKT', confidence: 95 },
  { patterns: [
    /pp.*matt?|matt?.*sticker|สติกเกอร์ด้าน/i, /\bpp[\s\-]?mkt\b/i,
  ], code: 'PP-MKT', confidence: 95 },
  { patterns: [
    /sticker|สติ๊กเกอร์|สติกเกอร์|label\s*paper/i,
  ], code: 'PP-MKT', confidence: 70 }, // generic sticker → matte default

  // === Coated / Woodfree ===
  { patterns: [
    /\bWC\b/i, /coated\s*card/i, /w[\/\-]c/i,
  ], code: 'WC', confidence: 92 },
  { patterns: [
    /\bWF\b/i, /woodfree/i, /\bwoodfree\b/i,
    /กระดาษปอนด์/i, /ปอนด์ขาว/i,
  ], code: 'WF', confidence: 95 },
];

// Load corrections store (cached)
let _correctionsCache = null;
let _correctionsCacheTs = 0;
function getCorrectionsForMatching() {
  const now = Date.now();
  if (_correctionsCache && (now - _correctionsCacheTs) < 60000) return _correctionsCache;
  try {
    if (existsSync(CORRECTIONS_PATH)) {
      _correctionsCache = JSON.parse(readFileSync(CORRECTIONS_PATH, 'utf8'));
      _correctionsCacheTs = now;
      return _correctionsCache;
    }
  } catch (e) {}
  return { patterns: [] };
}

// Load knowledge store (cached)
let _knowledgeCache = null;
let _knowledgeCacheTs = 0;
function getKnowledgeForMatching() {
  const now = Date.now();
  if (_knowledgeCache && (now - _knowledgeCacheTs) < 60000) return _knowledgeCache;
  try {
    if (existsSync(KNOWLEDGE_PATH)) {
      _knowledgeCache = JSON.parse(readFileSync(KNOWLEDGE_PATH, 'utf8'));
      _knowledgeCacheTs = now;
      return _knowledgeCache;
    }
  } catch (e) {}
  return [];
}

// === Character n-gram similarity (semantic-like, fast) ===
// แตกข้อความเป็น 2-3 char windows แล้วเทียบ overlap
// ทนต่อ typo, word reorder, subword matching ได้ดีกว่า Levenshtein
function _ngrams(s, n) {
  if (!s || s.length < n) return new Set([s || '']);
  s = s.toLowerCase().replace(/\s+/g, ' ');
  const grams = new Set();
  for (let i = 0; i <= s.length - n; i++) grams.add(s.slice(i, i + n));
  return grams;
}
function _ngramSim(a, b, n) {
  n = n || 3;
  const ga = _ngrams(a, n);
  const gb = _ngrams(b, n);
  if (ga.size === 0 || gb.size === 0) return 0;
  let inter = 0;
  ga.forEach(g => { if (gb.has(g)) inter++; });
  return (2 * inter) / (ga.size + gb.size); // Dice coefficient
}

// === Customer paper preference (semantic boost) ===
// ดูว่าลูกค้าคนนี้เคยใช้ paper อะไรบ่อยที่สุด
function getCustomerPaperPreference(customerName) {
  if (!customerName) return {};
  const knowledge = getKnowledgeForMatching();
  const cnLower = customerName.toLowerCase();
  const freq = {};
  knowledge.forEach(k => {
    const kCust = (k.final?.customer || '').toLowerCase();
    if (!kCust || !kCust.includes(cnLower.substring(0, 8))) return;
    (k.final?.components || []).forEach(c => {
      if (c.paper_code) freq[c.paper_code] = (freq[c.paper_code] || 0) + 1;
    });
  });
  return freq;
}

// === Component-context paper preference ===
// "tray" / "sleeve" / "lid" / "box" → paper ที่ใช้บ่อยตาม knowledge
function getComponentPaperPreference(componentName) {
  if (!componentName) return {};
  const knowledge = getKnowledgeForMatching();
  const cn = componentName.toLowerCase();
  const freq = {};
  knowledge.forEach(k => {
    (k.final?.components || []).forEach(c => {
      const ckn = (c.component_name || '').toLowerCase();
      if (ckn === cn || ckn.includes(cn) || cn.includes(ckn)) {
        if (c.paper_code) freq[c.paper_code] = (freq[c.paper_code] || 0) + 1;
      }
    });
  });
  return freq;
}

// === Auto-learned aliases — สะสมจาก corrections ===
// ถ้า user แก้ "X" → "Y" บ่อย ๆ (count ≥ 3) → กลายเป็น alias ถาวร
function getAutoLearnedAliases() {
  const corrections = getCorrectionsForMatching();
  const aliases = [];
  (corrections.patterns || []).forEach(p => {
    if (p.field !== 'paper_code') return;
    if ((p.count || 1) < 3) return; // ต้องเคยแก้ ≥ 3 ครั้ง
    aliases.push({
      from: p.ai_value,
      to: p.user_value,
      count: p.count,
      keywords: p.keywords || [],
    });
  });
  return aliases;
}

/**
 * Smart Paper Matcher — multi-signal scoring
 * @param {string} query - paper text จาก user (เช่น "A/C C1s", "หน้าขาวหลังเทา", "อาร์ต 350")
 * @param {string|number} gram - น้ำหนัก gsm (optional)
 * @param {string} specContext - spec text เต็ม (สำหรับ correction matching)
 * @param {object} ctx - { customerName, componentName }
 * @returns {object} { code, confidence, signals, alternatives }
 */
function smartMatchPaper(query, gram, specContext, ctx) {
  if (!query) return null;

  let papers = [];
  try { papers = loadLocalMasterData('paper_info') || []; } catch (e) {}
  if (papers.length === 0) return null;

  // De-dupe by paper_code → keep first occurrence's metadata
  const codeMap = {};
  papers.forEach(p => {
    if (!p.paper_code) return;
    if (!codeMap[p.paper_code]) {
      codeMap[p.paper_code] = {
        paper_code: p.paper_code,
        paper_type: p.paper_type || '',
        brand: p.brand || '',
        brand_import: p.brand_import || '',
        supplier: p.paper_brand_supplier || '',
        supplier_import: p.paper_brand_supplier_import || '',
        special_ink_code: p.special_ink_paper_code || '',
        grams: new Set(),
      };
    }
    if (p.gram) codeMap[p.paper_code].grams.add(String(p.gram));
  });
  const candidates = Object.values(codeMap);

  const qNorm = _normPaperKey(query);
  const qLower = query.toLowerCase().trim();
  const signals = [];
  const scores = {}; // code → { score, reasons[] }

  function addScore(code, score, reason) {
    if (!scores[code]) scores[code] = { score: 0, reasons: [] };
    scores[code].score = Math.max(scores[code].score, score);
    scores[code].reasons.push(reason);
  }

  // === Signal 1: Hardcoded alias (highest priority) ===
  for (const alias of PAPER_ALIASES) {
    if (alias.patterns.some(p => p.test(query))) {
      if (codeMap[alias.code]) {
        addScore(alias.code, alias.confidence, `alias: ${alias.code}`);
        signals.push(`alias→${alias.code}`);
      }
    }
  }

  // === Signal 2: Exact match on paper_code or paper_type ===
  candidates.forEach(c => {
    if (c.paper_code.toLowerCase() === qLower) {
      addScore(c.paper_code, 100, 'exact paper_code');
    }
    if (c.paper_type && c.paper_type.toLowerCase() === qLower) {
      addScore(c.paper_code, 99, 'exact paper_type');
    }
  });

  // === Signal 3: Normalized match (slash/space-insensitive) ===
  candidates.forEach(c => {
    if (_normPaperKey(c.paper_code) === qNorm) {
      addScore(c.paper_code, 97, 'norm paper_code');
    }
    if (c.paper_type && _normPaperKey(c.paper_type) === qNorm) {
      addScore(c.paper_code, 96, 'norm paper_type');
    }
    if (c.special_ink_code && _normPaperKey(c.special_ink_code) === qNorm) {
      addScore(c.paper_code, 92, 'special_ink_code');
    }
  });

  // === Signal 4: Substring/contains match ===
  // Pre-pass: count how many candidates contain the query as substring
  // ถ้ามีแค่ตัวเดียว = unique → boost confidence สูง (95+)
  let substringCandidates = 0;
  if (qLower.length >= 2) {
    candidates.forEach(c => {
      const codeL = c.paper_code.toLowerCase();
      const typeL = (c.paper_type || '').toLowerCase();
      if ((codeL && codeL.includes(qLower)) || (typeL && typeL.includes(qLower))) {
        substringCandidates++;
      }
    });
  }
  candidates.forEach(c => {
    const codeL = c.paper_code.toLowerCase();
    const typeL = (c.paper_type || '').toLowerCase();
    // Unique substring match = strong signal (เช่น "C1s" → unique to "AC C1s" only)
    const isUniqueSubstring = substringCandidates === 1;
    const codeContainsQ = codeL && codeL.includes(qLower);
    const typeContainsQ = typeL && typeL.includes(qLower);
    if (codeContainsQ || typeContainsQ) {
      // ถ้า unique → boost ถึง 96 (high confidence)
      const baseScore = isUniqueSubstring ? 96 : (codeContainsQ ? 85 : 84);
      addScore(c.paper_code, baseScore, isUniqueSubstring ? 'unique substring' : (codeContainsQ ? 'substring code' : 'substring type'));
    }
    // Reverse: query contains code/type (less reliable)
    if (codeL && qLower.includes(codeL) && !codeContainsQ) {
      addScore(c.paper_code, 82, 'query⊃code');
    }
    if (typeL && qLower.includes(typeL) && !typeContainsQ) {
      addScore(c.paper_code, 81, 'query⊃type');
    }
  });

  // === Signal 5: Token overlap ===
  candidates.forEach(c => {
    const tokenScore = Math.max(
      _tokenOverlap(query, c.paper_code),
      _tokenOverlap(query, c.paper_type || ''),
      _tokenOverlap(query, c.brand || '') * 0.7,
      _tokenOverlap(query, c.supplier || '') * 0.6,
    );
    if (tokenScore > 0.5) {
      addScore(c.paper_code, Math.round(60 + tokenScore * 30), `token ${(tokenScore*100).toFixed(0)}%`);
    }
  });

  // === Signal 6: Fuzzy similarity (Levenshtein) ===
  candidates.forEach(c => {
    const sim = Math.max(
      _strSim(query, c.paper_code),
      _strSim(query, c.paper_type || ''),
    );
    if (sim > 0.6) {
      addScore(c.paper_code, Math.round(50 + sim * 35), `fuzzy ${(sim*100).toFixed(0)}%`);
    }
  });

  // === Signal 6b: Character n-gram (Dice coefficient) — semantic-like ===
  // ทนต่อ word order, typo, subword ดีกว่า Levenshtein
  candidates.forEach(c => {
    const ng = Math.max(
      _ngramSim(query, c.paper_code, 3),
      _ngramSim(query, c.paper_type || '', 3),
      _ngramSim(query, c.brand || '', 3) * 0.6,
    );
    if (ng > 0.45) {
      addScore(c.paper_code, Math.round(55 + ng * 35), `ngram ${(ng*100).toFixed(0)}%`);
    }
  });

  // === Signal 7: Gram availability boost ===
  if (gram) {
    Object.keys(scores).forEach(code => {
      const c = codeMap[code];
      if (c && c.grams.has(String(gram))) {
        scores[code].score = Math.min(100, scores[code].score + 2);
        scores[code].reasons.push('gram match');
      }
    });
  }

  // === Signal 8: Correction history boost (AI Learning) ===
  // ถ้า user เคยแก้ paper_code ใน spec คล้ายๆ → boost code นั้น
  try {
    const corrections = getCorrectionsForMatching();
    const queryWords = (specContext || query).toLowerCase().split(/\s+/).filter(w => w.length > 1);
    (corrections.patterns || []).forEach(p => {
      if (p.field !== 'paper_code') return;
      const overlap = (p.keywords || []).filter(k => queryWords.includes(k)).length;
      if (overlap >= 2) {
        // user เคยแก้ในเคสคล้ายๆ → boost user_value
        const boost = Math.min(20, overlap * 3 + (p.count || 1) * 2);
        if (codeMap[p.user_value]) {
          addScore(p.user_value, Math.min(100, 70 + boost), `learned (×${p.count})`);
        }
      }
    });
  } catch (e) {}

  // === Signal 9: Knowledge boost (past RFQ choices) ===
  try {
    const knowledge = getKnowledgeForMatching();
    const queryWords = (specContext || query).toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length > 0) {
      const codeFreq = {};
      knowledge.forEach(k => {
        const kText = ((k.spec_text || '') + ' ' + (k.final?.job_name || '')).toLowerCase();
        const overlap = queryWords.filter(w => kText.includes(w)).length;
        if (overlap >= 2) {
          (k.final?.components || []).forEach(c => {
            if (c.paper_code && codeMap[c.paper_code]) {
              codeFreq[c.paper_code] = (codeFreq[c.paper_code] || 0) + overlap;
            }
          });
        }
      });
      Object.entries(codeFreq).forEach(([code, freq]) => {
        const boost = Math.min(15, freq);
        addScore(code, Math.min(100, 65 + boost), `history (${freq})`);
      });
    }
  } catch (e) {}

  // === Signal 10: Customer paper preference ===
  // ลูกค้าคนนี้เคยใช้ paper อะไรบ่อย → boost
  if (ctx?.customerName) {
    try {
      const custFreq = getCustomerPaperPreference(ctx.customerName);
      Object.entries(custFreq).forEach(([code, freq]) => {
        if (codeMap[code]) {
          const boost = Math.min(12, freq * 2);
          addScore(code, Math.min(100, 60 + boost), `customer ×${freq}`);
        }
      });
    } catch (e) {}
  }

  // === Signal 11: Component context ===
  // "tray" / "sleeve" / "lid" / "box" → paper preference
  if (ctx?.componentName) {
    try {
      const compFreq = getComponentPaperPreference(ctx.componentName);
      Object.entries(compFreq).forEach(([code, freq]) => {
        if (codeMap[code]) {
          const boost = Math.min(8, freq);
          addScore(code, Math.min(100, 55 + boost), `comp ×${freq}`);
        }
      });
    } catch (e) {}
  }

  // === Signal 12: Auto-learned aliases (corrections ≥3 ครั้ง = แน่ใจ) ===
  try {
    const learned = getAutoLearnedAliases();
    learned.forEach(la => {
      const matched =
        _normPaperKey(la.from) === qNorm ||
        la.from.toLowerCase() === qLower ||
        _ngramSim(query, la.from, 3) > 0.7;
      if (matched && codeMap[la.to]) {
        addScore(la.to, Math.min(100, 88 + Math.min(10, la.count)), `auto-alias ×${la.count}`);
      }
    });
  } catch (e) {}

  // === Pick best + alternatives ===
  const ranked = Object.entries(scores)
    .map(([code, info]) => ({ code, score: info.score, reasons: info.reasons }))
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) return null;

  const best = ranked[0];
  const alts = ranked.slice(1, 4).map(r => ({ code: r.code, score: r.score }));

  return {
    code: best.code,
    confidence: Math.round(best.score),
    signals: best.reasons,
    alternatives: alts,
    isExact: best.score >= 95,
    fromQuery: query,
    gram: gram || '',
  };
}

// Build paper mapping note with confidence + alternatives from master DB
function buildPaperMappingNote(fromText, toCode, gram) {
  const backTypeAlts = {
    'Dup GBB': [{ code: 'Dup WBB', score: 78 }, { code: 'Dup BBB', score: 72 }, { code: 'KB', score: 60 }],
    'Dup WBB': [{ code: 'Dup GBB', score: 78 }, { code: 'AC C1s', score: 65 }, { code: 'SBS', score: 55 }],
    'Dup BBB': [{ code: 'Dup GBB', score: 72 }, { code: 'KA', score: 60 }, { code: 'KI', score: 55 }],
  };
  // Verify target exists in master DB
  let confidence = 95;
  try {
    const paperInfo = loadLocalMasterData('paper_info') || [];
    const exists = paperInfo.some(p => p.paper_code === toCode);
    if (exists) {
      confidence = 95;
      // Bonus if gram is also available
      if (gram && paperInfo.some(p => p.paper_code === toCode && String(p.gram) === String(gram))) {
        confidence = 98;
      }
    } else {
      confidence = 70;
    }
  } catch (e) { /* fallback */ }

  return {
    type: 'paper_mapping',
    from: fromText,
    to: toCode,
    gram: gram || '',
    confidence,
    alternatives: backTypeAlts[toCode] || [],
  };
}

function builtInSpecParser(text) {
  // === Pre-normalize: bullet/colon/whitespace/size/color/gram/paper-code ===
  text = normalizeSpecPreParse(text);
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);

  // --- Detect structured format (TITLE/SIZE/PAPER/PRINT/OTHER) ---
  const isStructured = lines.some(l => /^TITLE\s*:/i.test(l));

  if (isStructured) {
    const result = parseStructuredSpec(lines);
    const comp = result?.components?.[0];
    if (comp) postProcessParsedSpec(result, comp, text);
    return result;
  }

  // --- Detect English key-value format (Key: Value pairs) ---
  const engKvKeys = ['Date', 'Size', 'Text\\/Cover', 'Cover', 'Paper', 'Packing', 'Shipping', 'Foil\\s*stamp', 'Binding', 'Extent', 'Material', 'Finishing', 'Job\\s*Name', 'Title', 'Customer', 'Client', 'AE\\s*Name', 'AE', 'Sales', 'Qty', 'Quantity', 'Color', 'Colour', 'Print\\s*Type', 'Ink', 'Box\\s*Type', 'Template', 'Diecut', 'Die\\s*Cut', 'Delivery', 'Paper\\s*Cost', 'Paper\\s*Markup', 'Brand', 'Component', 'Coating', 'Run[\\s-]*On', 'Machine'];
  const engKvCount = lines.filter(l => new RegExp('^(?:' + engKvKeys.join('|') + ')\\s*:', 'i').test(l)).length;
  let result;
  if (engKvCount >= 2) {
    result = parseEnglishKvSpec(lines);
  } else if (lines.length <= 3 && text.length < 300) {
    result = parseCasualSpec(text) || parseThaiSpec(lines, text);
  } else {
    result = parseThaiSpec(lines, text);
  }
  if (!result) return result;

  // === Post-process ALL parsers: extract inline data from full text ===
  const comp = result.components?.[0];
  if (comp) {
    postProcessParsedSpec(result, comp, text);
  }
  return result;
}

// Post-process: scan full text for ANY recognizable data patterns
// This runs AFTER all parsers — fills in anything they missed
function postProcessParsedSpec(result, comp, fullText) {
  const t = fullText; // shorthand

  // ===== JOB TYPE: Reprint detection =====
  // ครอบคลุมทุกรูปแบบ + พิมพ์ตก — แต่ห้ามจับ "Rep." ที่ติดกับชื่อสินค้า
  const reprintRx = /\b(?:re-?print(?:ed)?|re-?run|repeat\s*(?:job|order|งาน)?)\b/i;
  const reprintTh = /รีพริ้น|รี[ปพ]ริ้?น?ท?|งานซ้ำ|พิมพ์ซ้ำ|พิมพ์ใหม่|สั่งซ้ำ|ปริ้นซ้ำ|พิมพ์ทวน|ทำซ้ำ|ซ้ำเดิม|งานเก่า|repeat/;
  if (reprintRx.test(t) || reprintTh.test(t)) {
    result.job_type = 'repeat';
    result.is_reprinted = true;
  }

  // ===== BOX TEMPLATE =====
  if (!comp.box_type_id) {
    // Explicit: "= 12. Custom", "template 1", "Type 3"
    const btm = t.match(/(?:=|template|type)\s*(\d{1,2})[\.\s:,)]/i);
    if (btm && parseInt(btm[1]) >= 1 && parseInt(btm[1]) <= 12) {
      comp.box_type_id = parseInt(btm[1]);
    }
    // Auto-detect from product keywords
    if (!comp.box_type_id) {
      const detect = detectBoxTemplate(t);
      if (detect) {
        comp.box_type_id = detect.type_id;
        comp._box_type_confidence = detect.confidence;
      }
    }
  }

  // ===== PAPER (code + gram) =====
  if (!comp.paper?.paper_code) {
    if (!comp.paper) comp.paper = {};
    let found = false;

    // Pattern 1: "Paper XXX NNN gsm" (with or without colon)
    let pm = t.match(/\bPaper\s*:?\s*((?:Matt?\s*Art|MA|AC\s*C[12]s|Dup(?:lex)?\s*(?:GBB|WBB|BBB)?|SBS|CRB|IVR|KA|KI|Ivory|Art\s*Card|kraft|กระดาษ\S*)[^/\n]*?)\s*(\d{2,3})\s*(?:gsm|Gsm|แกรม|G\b)/i);
    if (pm) { comp.paper.paper_code = mapPaperCode(pm[1].trim()); comp.paper.paper_gram = pm[2]; found = true; }

    // Pattern 2: "XXX NNN gsm" without "Paper" prefix (e.g. "Matt Art 128 Gsm")
    if (!found) {
      pm = t.match(/\b(Matt?\s*Art|Gloss\s*Art|Duplex\s*(?:GBB|WBB|BBB)?|AC\s*C[12]s|Art\s*(?:Card|Board)|C[12]S\s*(?:Board)?|SBS|CRB|IVR|Ivory|Kraft)\s*(\d{2,3})\s*(?:gsm|Gsm|แกรม|G\b)/i);
      if (pm) { comp.paper.paper_code = mapPaperCode(pm[1].trim()); comp.paper.paper_gram = pm[2]; found = true; }
    }

    // Pattern 3: code+gram no space "AC350", "MA128", "SBS300"
    if (!found) {
      pm = t.match(/\b(AC|MA|SBS|CRB|IVR|KA|KI|FCY|WC|MCA|GA)\s*(\d{2,3})\b/i);
      if (pm) {
        let code = pm[1].toUpperCase();
        if (code === 'AC') code = 'AC C1s';
        comp.paper.paper_code = code; comp.paper.paper_gram = pm[2]; found = true;
      }
    }

    // Pattern 4: "Dup GBB 400" / "Duplex 350"
    if (!found) {
      pm = t.match(/\b(?:Dup(?:lex)?)\s*(GBB|WBB|BBB)?\s*(\d{2,3})\b/i);
      if (pm) { comp.paper.paper_code = 'Dup ' + (pm[1] || 'GBB').toUpperCase(); comp.paper.paper_gram = pm[2]; found = true; }
    }

    // Pattern 5: Thai paper names — "อาร์ต 350 แกรม", "ดูเพล็กซ์ 400", "กระดาษ แข็ง 300"
    if (!found) {
      pm = t.match(/(อาร์ต(?:การ์ด)?|ดูเพล็กซ์|ดูเพล็ค|คราฟท์|คราฟ|ไอวอรี่|ไอวอรี|กระดาษแข็ง|กระดาษขาว)\s*(\d{2,3})\s*(?:แกรม|gsm|G\b)?/i);
      if (pm) {
        const nameMap = { 'อาร์ต': 'AC C1s', 'อาร์ตการ์ด': 'AC C1s', 'ดูเพล็กซ์': 'Dup GBB', 'ดูเพล็ค': 'Dup GBB', 'คราฟท์': 'KA', 'คราฟ': 'KA', 'ไอวอรี่': 'IVR', 'ไอวอรี': 'IVR', 'กระดาษแข็ง': 'Dup GBB', 'กระดาษขาว': 'AC C1s' };
        comp.paper.paper_code = nameMap[pm[1]] || pm[1]; comp.paper.paper_gram = pm[2]; found = true;
      }
    }

    // Pattern 5b: คำที่ AE ใช้บรรยายแบบ "หน้าขาวหลังเทา 350" → Dup GBB (Grey Back)
    //              "หน้าขาวหลังขาว" → Dup WBB (White Back)
    //              "หน้าขาวหลังน้ำตาล" → Dup BBB (Brown Back)
    //              "ขาวเทา 350", "ขาว/เทา 350" — รูปแบบสั้น
    if (!found) {
      pm = t.match(/หน้า\s*ขาว\s*หลัง\s*(เทา|ขาว|น้ำตาล|ครีม|กล่อง)\s*(\d{2,3})?\s*(?:แกรม|gsm|G\b)?/i);
      if (pm) {
        const backMap = { 'เทา': 'Dup GBB', 'ขาว': 'Dup WBB', 'น้ำตาล': 'Dup BBB', 'ครีม': 'Dup GBB', 'กล่อง': 'Dup GBB' };
        const code = backMap[pm[1]] || 'Dup GBB';
        comp.paper.paper_code = code;
        if (pm[2]) comp.paper.paper_gram = pm[2];
        found = true;
        result._aiNotes = result._aiNotes || [];
        result._aiNotes.push(buildPaperMappingNote('หน้าขาวหลัง' + pm[1], code, pm[2] || ''));
      }
    }
    if (!found) {
      pm = t.match(/ขาว\s*[\/\-]?\s*(เทา|ขาว|น้ำตาล)\s*(\d{2,3})\s*(?:แกรม|gsm|G\b)?/i);
      if (pm) {
        const backMap = { 'เทา': 'Dup GBB', 'ขาว': 'Dup WBB', 'น้ำตาล': 'Dup BBB' };
        const code = backMap[pm[1]] || 'Dup GBB';
        comp.paper.paper_code = code;
        comp.paper.paper_gram = pm[2];
        found = true;
        result._aiNotes = result._aiNotes || [];
        result._aiNotes.push(buildPaperMappingNote('ขาว/' + pm[1], code, pm[2]));
      }
    }

    // Pattern 6: just "NNN gsm" or "NNN แกรม" (gram only, no code)
    if (!found && !comp.paper.paper_gram) {
      pm = t.match(/\b(\d{2,3})\s*(?:gsm|Gsm|แกรม)\b/i);
      if (pm) comp.paper.paper_gram = pm[1];
    }

    if (!found && !comp.paper.paper_code) delete comp.paper; // cleanup if nothing found
  }

  // ===== SMART PAPER MATCHER (Deep matching against master DB) =====
  // ใช้ 12 signals: alias / exact / normalized / substring / token / fuzzy / ngram /
  //                gram / corrections / knowledge / customer / component / auto-alias
  if (comp.paper && comp.paper.paper_code) {
    const queryText = comp.paper.paper_code;
    const ctx = {
      customerName: result.customer_search || result.customer?.customer_name || result.customer || '',
      componentName: comp.component_name || comp.name || '',
    };
    const matched = smartMatchPaper(queryText, comp.paper.paper_gram, fullText, ctx);
    if (matched && matched.code) {
      const original = comp.paper.paper_code;
      // ถ้า match ได้ตรง 95%+ และไม่ใช่ code เดิม → swap แบบเงียบ
      if (matched.isExact && matched.code !== original) {
        comp.paper.paper_code = matched.code;
        comp.paper._matchConfidence = matched.confidence;
        comp.paper._matchSignals = matched.signals;
        // เก็บ note ถ้า user ใช้คำที่ต่างจาก master DB
        if (_normPaperKey(original) !== _normPaperKey(matched.code)) {
          result._aiNotes = result._aiNotes || [];
          result._aiNotes.push({
            type: 'paper_mapping',
            from: original,
            to: matched.code,
            gram: comp.paper.paper_gram || '',
            confidence: matched.confidence,
            alternatives: matched.alternatives || [],
            signals: matched.signals,
          });
        }
      } else if (matched.isExact) {
        // match ตรงกับ code เดิมแล้ว → แค่บันทึก confidence
        comp.paper._matchConfidence = matched.confidence;
      } else if (matched.confidence >= 70) {
        // ไม่ตรงเป๊ะ แต่มี candidate ดี → เก็บเป็น suggestion
        result._aiNotes = result._aiNotes || [];
        result._aiNotes.push({
          type: 'paper_mapping',
          from: original,
          to: matched.code,
          gram: comp.paper.paper_gram || '',
          confidence: matched.confidence,
          alternatives: matched.alternatives || [],
          signals: matched.signals,
        });
        // Apply matched code (user สามารถกดเปลี่ยนใน chat ได้)
        comp.paper.paper_code = matched.code;
        comp.paper._matchConfidence = matched.confidence;
      }
      console.log(`[Smart Paper] "${original}" → "${matched.code}" (${matched.confidence}%) [${matched.signals.slice(0,2).join(', ')}]`);
    }
  }

  // ===== PAPER SOURCE =====
  if (comp.paper && !comp.paper.paper_source_id) {
    if (/ต่างประเทศ|นำเข้า|\bimport\b/i.test(t)) { comp.paper.paper_source_id = '2'; comp.paper.paper_name = 'import'; }
    else if (/ในประเทศ|\bdomestic\b/i.test(t)) { comp.paper.paper_source_id = '1'; }
  }

  // ===== PAPER MARKUP =====
  if (comp.paper && !comp.paper.paper_markup) {
    const mkm = t.match(/mark[\s-]*up\s*([\d.]+)\s*%?/i);
    if (mkm) comp.paper.paper_markup = mkm[1];
  }

  // ===== PAPER COST =====
  if (comp.paper && !comp.paper.paper_cost) {
    const pcm = t.match(/(?:paper\s*)?cost\s*:?\s*([\d.]+)/i);
    if (pcm) comp.paper.paper_cost = pcm[1];
  }

  // ===== QTY =====
  if (!result.qty) {
    // "qty 9000", "จำนวน 5,000", "9000 ชิ้น", "qty: 5000/10000"
    let qm = t.match(/(?:qty|quantity|จำนวน)\s*:?\s*([\d,]+)(?:\s*[\/,]\s*([\d,]+))?(?:\s*[\/,]\s*([\d,]+))?/i);
    if (qm) {
      result.qty = [qm[1].replace(/,/g, '')];
      if (qm[2]) result.qty.push(qm[2].replace(/,/g, ''));
      if (qm[3]) result.qty.push(qm[3].replace(/,/g, ''));
    }
    // Fallback: "5000ชิ้น", "10,000 ใบ", "3000 pcs"
    // Exclude packing context: "125 pcs/pack", "90 pcs/band", "450 pcs/carton"
    if (!result.qty) {
      qm = t.match(/([\d,]+)\s*(?:ชิ้น|ใบ|กล่อง|pcs|sets|ชุด)(?!\s*\/\s*(?:pack|band|carton|pallet|แพ็ค|มัด))/i);
      if (qm && parseInt(qm[1].replace(/,/g, '')) >= 100) result.qty = [qm[1].replace(/,/g, '')];
    }
  }

  // ===== INK TYPE =====
  // "UV" ต้องเป็น ink type จริงๆ ไม่ใช่ชื่อ coating
  // ตัวอย่างที่ไม่ใช่ ink: "coating gloss UV", "UV เว้นลิ้น", "UV coat", "UV varnish"
  if (!result.ink_type) {
    const hasUV = /\bUV\b/i.test(t);
    const isCoatingUV = /(?:coating|coat|เคลือบ|varnish|lamin).*UV|UV\s*(?:coat|เคลือบ|varnish|lamin|เว้นลิ้น|drip|anti)/i.test(t);
    if (hasUV && !isCoatingUV) result.ink_type = 'UV';
    // Explicit ink UV: "หมึก UV", "ink: UV", "ประเภทหมึก UV"
    if (/หมึก\s*UV|ink\s*:?\s*UV|ประเภทหมึก.*UV/i.test(t)) result.ink_type = 'UV';
  }

  // ===== COLOR =====
  if (!comp.color) {
    // "Outside 4 cols", "4 สี", "4/0", "4c x 0c", "พิมพ์ 4 สี"
    let cm = t.match(/Outside\s+(\d)\s*cols?/i);
    if (cm) {
      comp.color = { outside: parseInt(cm[1]), inside: 0 };
      const cmi = t.match(/Inside\s+(\d)\s*cols?/i);
      if (cmi) comp.color.inside = parseInt(cmi[1]);
    }
    if (!comp.color) {
      cm = t.match(/(\d)\s*\/\s*(\d)\s*(?:สี|col|color)/i);
      if (cm) comp.color = { outside: parseInt(cm[1]), inside: parseInt(cm[2]) };
    }
    if (!comp.color) {
      cm = t.match(/(\d)\s*\/\s*(\d)(?!\s*[\d,])/); // "4/0" but not before qty like /10000
      if (cm && parseInt(cm[1]) <= 8 && parseInt(cm[2]) <= 8) {
        comp.color = { outside: parseInt(cm[1]), inside: parseInt(cm[2]) };
      }
    }
    if (!comp.color) {
      cm = t.match(/(?:พิมพ์\s*)?(\d)\s*สี/);
      if (cm) comp.color = { outside: parseInt(cm[1]), inside: 0 };
    }
  }

  // ===== COMPONENT TYPE — ต้อง check "ไม่" ก่อน "ใช่" เสมอ =====
  if (/ไม่\s*ประกบ|ไม่\s*ประกอบ|without\s*corrugat|no\s*corrugat/i.test(t)) comp.component_type = 1;
  else if (/เฉพาะลูกฟูก|only\s*corrugat/i.test(t)) comp.component_type = 3;
  else if (/ประกบลูกฟูก|ประกอบลูกฟูก|with\s*corrugat|laminate.*corrugat/i.test(t)) comp.component_type = 2;
  else if (!comp.component_type) comp.component_type = 1;

  // ===== CORRUGATED FLUTE (ลอน A/B/C/E/F) =====
  if (comp.component_type >= 2 && (!comp.corrugated || !comp.corrugated.flute_type)) {
    const fluteM = t.match(/ลอน\s*([A-Fa-f])\b/);
    if (fluteM) {
      if (!comp.corrugated) comp.corrugated = {};
      comp.corrugated.flute_type = fluteM[1].toUpperCase();
    }
  }

  // ===== CORRUGATED LAYER (จำนวนชั้น) =====
  if (comp.component_type >= 2) {
    if (!comp.corrugated) comp.corrugated = {};
    if (!comp.corrugated.layer) {
      const layM = t.match(/(\d)\s*ชั้น/i) || t.match(/ชั้น\s*(?:ลูกฟูก)?\s*(\d)/i) || t.match(/(\d)\s*layer/i);
      if (layM) comp.corrugated.layer = parseInt(layM[1]);
    }
  }

  // ===== CORRUGATED GRADE (เกรด CA125, KA150 etc.) =====
  if (comp.component_type >= 2 && comp.corrugated && !comp.corrugated.grade) {
    const GRADE_CODES = ['CA','KA','MA','CB','KB','KI','SC','WT','KS','SK','BF','KN','NS','CM','KT'];
    const grades = [];
    for (const gc of GRADE_CODES) {
      const gcRx = new RegExp('\\b' + gc + '\\s*(\\d{2,3})', 'gi');
      let m;
      while ((m = gcRx.exec(t)) !== null) {
        grades.push({ code: gc, gram: parseInt(m[1]) });
      }
    }
    if (grades.length > 0) {
      comp.corrugated.grade = grades.map(g => g.code);
      comp.corrugated.gram = grades.map(g => g.gram);
      // Auto-fill remaining slots for layer count
      const layer = comp.corrugated.layer || 2;
      while (comp.corrugated.grade.length < layer) {
        comp.corrugated.grade.push(grades[0].code);
        comp.corrugated.gram.push(grades[0].gram);
      }
    }
  }

  // ===== DELIVERY DESTINATION + DATE =====
  if (!result.delivery_province) {
    const delivM = t.match(/(?:ส่ง|delivery|จัดส่ง)\s*(?:ที่|ไป|to)?\s*([ก-๙a-z]+)/i);
    if (delivM) result.delivery_province = delivM[1].trim();
  }
  if (!result.delivery_date) {
    const dateRx = t.match(/(?:วัน(?:ที่)?(?:ส่ง|จัดส่ง)?\s*)(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i);
    if (dateRx) {
      const year = dateRx[3].length === 2 ? '20' + dateRx[3] : dateRx[3];
      result.delivery_date = `${year}-${dateRx[2].padStart(2,'0')}-${dateRx[1].padStart(2,'0')}`;
    }
  }

  // ===== COMPONENT NAME =====
  if (!comp.component_name) {
    const nm = t.match(/component\s*(?:\d+)?\s*=?\s*(box|sleeve|tray|lid|กล่อง|ปลอก|ถาด|ฝา)/i);
    if (nm) comp.component_name = nm[1].toLowerCase();
  }

  // ===== SIZE =====
  if (!comp.packaging_size) {
    // Priority 1: "W 212\nL 271\nH 30" format (Dimension Score line)
    const wLine = t.match(/\bW\s+(\d+(?:\.\d+)?)\b/);
    const lLine = t.match(/\bL\s+(\d+(?:\.\d+)?)\b/);
    const hLine = t.match(/\bH\s+(\d+(?:\.\d+)?)\b/);
    if (wLine && lLine) {
      comp.packaging_size = { width: Math.round(parseFloat(wLine[1])), length: Math.round(parseFloat(lLine[1])), depth: hLine ? Math.round(parseFloat(hLine[1])) : 0 };
    }
    // Priority 2: "กว้าง 178 mm / ยาว 305 mm"
    if (!comp.packaging_size) {
      const wm = t.match(/กว้าง\s*([\d.]+)\s*(?:mm|มม)/i);
      const lm = t.match(/ยาว\s*([\d.]+)\s*(?:mm|มม)/i);
      const dm = t.match(/(?:สูง|ลึก|depth|height)\s*([\d.]+)\s*(?:mm|มม)/i);
      if (wm && lm) {
        comp.packaging_size = { width: Math.round(parseFloat(wm[1])), length: Math.round(parseFloat(lm[1])), depth: dm ? Math.round(parseFloat(dm[1])) : 0 };
      }
    }
    // Priority 3: "W178 x L305 x D128" or "178x305x128 mm"
    if (!comp.packaging_size) {
      const szm = t.match(/(?:W\s*)?(\d+(?:\.\d+)?)\s*[xX×]\s*(?:L\s*)?(\d+(?:\.\d+)?)\s*(?:[xX×]\s*(?:D\s*)?(\d+(?:\.\d+)?))?\s*(?:mm|มม)?/i);
      if (szm && parseFloat(szm[1]) < 2000 && parseFloat(szm[2]) < 2000) {
        comp.packaging_size = { width: Math.round(parseFloat(szm[1])), length: Math.round(parseFloat(szm[2])), depth: szm[3] ? Math.round(parseFloat(szm[3])) : 0 };
      }
    }
  }

  // ===== PRINT TYPE =====
  if (!result.print_type) {
    if (/\bflexo\b|เฟล็กโซ่?/i.test(t)) result.print_type = 'Flexo';
    else if (/\bjet\s*press\b/i.test(t)) result.print_type = 'Jet Press';
    else if (/\bkonica\b/i.test(t)) result.print_type = 'Konica';
    else if (/\boffset\b|ออฟเซ[็ต]?/i.test(t)) result.print_type = 'Offset';
  }

  // ===== DIECUT =====
  if (!result.is_diecut) {
    if (/die\s*cut|ไดคัท|ปั๊มไดคัท/i.test(t)) result.is_diecut = true;
  }

  // ===== DELIVERY =====
  if (!result.delivery_province) {
    const dlm = t.match(/(?:delivery|จัดส่ง|ส่ง(?:ที่)?)\s*:?\s*(ลูกค้ามารับเอง|กรุงเทพ\S*|[\u0E00-\u0E7F]+(?:ธานี|บุรี|ราช\S*|นคร\S*)?)/i);
    if (dlm) result.delivery_province = dlm[1].trim();
  }

  // ===== COATING =====
  if (!comp.addon) comp.addon = [];
  if (comp.addon.length === 0 || !comp.addon.some(a => a.type === 'coating')) {
    const ctm = t.match(/(?:เคลือบ|coating)\s*((?:PVC|UV|gloss|matt?e?|ด้าน|เงา|แมท|aqueous|varnish|hi[\s-]*rub|WB)[^/\n,]*)/i);
    if (ctm) {
      const detail = ctm[0].trim();
      const sideM = detail.match(/(\d)\s*(?:s\b|side|ด้าน)/i);
      comp.addon.push({ type: 'coating', detail, side: sideM ? parseInt(sideM[1]) : 1 });
    }
  }

  // ===== PACKING (Fuzzy / Typo-tolerant) =====
  if (!comp.packing_detail) {
    // Fuzzy match packing keywords (รองรับ typo เช่น raftwrap, kraftwarp, paperbnad)
    const packingFuzzy = [
      { pattern: /k?r[ao]ft\s*w[ar]+[ae]?p/i, name: 'kraftwrap' },
      { pattern: /paper\s*b[ao]n?d/i, name: 'paperband' },
      { pattern: /shrink\s*w[ar]+[ae]?p/i, name: 'shrinkwrap' },
      { pattern: /band\s*w[ar]+[ae]?p/i, name: 'bandwrap' },
      { pattern: /rubber|รัดยาง/i, name: 'rubber' },
      { pattern: /pallet|พาเลท/i, name: 'pallet' },
      { pattern: /carton|กล่องลูกฟูก/i, name: 'carton' },
    ];
    for (const pk of packingFuzzy) {
      const m = t.match(new RegExp(pk.pattern.source + '\\s*(\\d+)\\s*(?:pcs?|ชิ้น|ใบ)\\s*(?:\\/\\s*(?:pack|แพ็ค))?', 'i'));
      if (m) { comp.packing_detail = pk.name + (m[1] ? ' ' + m[1] + ' pcs/pack' : ''); break; }
      if (pk.pattern.test(t)) { comp.packing_detail = pk.name; break; }
    }
    // Fallback: "packing: xxx"
    if (!comp.packing_detail) {
      const pkm = t.match(/(?:packing|แพ็ค)\s*:?\s*([^\n]{3,30})/i);
      if (pkm) comp.packing_detail = pkm[1].trim();
    }
  }

  // ===== AE NAME (from "AE Name: xxx" pattern without colon separation) =====
  if (!result.ae_search) {
    const aem = t.match(/\bAE\s*(?:Name)?\s*:?\s*(\d+)\s*:?\s*([\u0E00-\u0E7F\s]+)/i);
    if (aem) {
      result.ae_search = (aem[1] + ': ' + aem[2]).trim();
    }
  }

  // ===== JOB NAME from "Job Name: xxx" =====
  if (!result.job_name) {
    const jnm = t.match(/(?:Job\s*Name|ชื่องาน)\s*:?\s*(.+?)(?:\n|\/|$)/i);
    if (jnm) result.job_name = jnm[1].trim();
  }

  // ===== CUSTOMER =====
  if (!result.customer_search && !result.new_customer) {
    if (/new\s*customer|ลูกค้าใหม่/i.test(t)) {
      result.new_customer = true;
    }
    // Only match "Customer: xxx" or "ลูกค้า: xxx" with explicit separator (not "new customer" inline)
    const custm = t.match(/^(?:customer|ลูกค้า)\s*:\s*([\u0E00-\u0E7FA-Za-z][\u0E00-\u0E7FA-Za-z\s.()]*)/im);
    if (custm && !/ใหม่|new/i.test(custm[1])) {
      result.customer_search = custm[1].trim();
    }
  }
}

// --- Casual one-liner parser for AE quick messages ---
// Handles: "กล่องครีม IMAGO AC350 4สี 5000ชิ้น"
//          "กล่อง MA270 4/0 เคลือบ PVC 10x15x5cm 3000ใบ"
//          "sleeve อาร์ต 300 แกรม 4 สี 8000 ชิ้น"
function parseCasualSpec(text) {
  const result = { components: [{ addon: [] }] };
  const comp = result.components[0];
  let jobParts = [];

  // 1. Extract paper code + gram
  //    Pattern: "AC350", "AC C1s 350", "MA270", "Dup GBB 400", "อาร์ต 350", "SBS300"
  let m;

  // "AC C1s 350" or "AC C2s 350" style
  m = text.match(/\b(AC)\s*(C[12]s)\s*(\d{2,3})\b/i);
  if (m) {
    comp.paper = { paper_code: m[1].toUpperCase() + ' ' + m[2], paper_gram: m[3] };
  }
  // "Dup GBB 400" / "Dup WBB 350" / "Dup BBB 300"
  if (!comp.paper) {
    m = text.match(/\b(Dup)\s*(GBB|WBB|BBB)\s*(\d{2,3})\b/i);
    if (m) comp.paper = { paper_code: 'Dup ' + m[2].toUpperCase(), paper_gram: m[3] };
  }
  // "AC350" / "MA270" / "SBS300" (code + gram no space)
  if (!comp.paper) {
    m = text.match(/\b(AC|MA|SBS|CRB|IVR|KA|KI|FCY|WC|MCA|GA)\s*(\d{2,3})\b/i);
    if (m) {
      let code = m[1].toUpperCase();
      if (code === 'AC') code = 'AC C1s'; // default to C1s
      comp.paper = { paper_code: code, paper_gram: m[2] };
    }
  }
  // "อาร์ต 350 แกรม" / "ดูเพล็กซ์ 400 แกรม"
  if (!comp.paper) {
    m = text.match(/(อาร์ต|ดูเพล็กซ์|คราฟท์|ไอวอรี่)\s*(\d{2,3})\s*(แกรม|gsm)?/i);
    if (m) {
      const nameMap = { 'อาร์ต': 'AC C1s', 'ดูเพล็กซ์': 'Dup GBB', 'คราฟท์': 'KA', 'ไอวอรี่': 'IVR' };
      comp.paper = { paper_code: nameMap[m[1]] || m[1], paper_gram: m[2] };
    }
  }
  // "หน้าขาวหลังเทา 350" / "ขาว/เทา 350" — AE Thai descriptive
  if (!comp.paper) {
    m = text.match(/หน้า\s*ขาว\s*หลัง\s*(เทา|ขาว|น้ำตาล|ครีม|กล่อง)\s*(\d{2,3})?\s*(?:แกรม|gsm)?/i);
    if (m) {
      const backMap = { 'เทา': 'Dup GBB', 'ขาว': 'Dup WBB', 'น้ำตาล': 'Dup BBB', 'ครีม': 'Dup GBB', 'กล่อง': 'Dup GBB' };
      comp.paper = { paper_code: backMap[m[1]] || 'Dup GBB', paper_gram: m[2] || '' };
    }
  }
  if (!comp.paper) {
    m = text.match(/ขาว\s*[\/\-]?\s*(เทา|ขาว|น้ำตาล)\s*(\d{2,3})\s*(?:แกรม|gsm)?/i);
    if (m) {
      const backMap = { 'เทา': 'Dup GBB', 'ขาว': 'Dup WBB', 'น้ำตาล': 'Dup BBB' };
      comp.paper = { paper_code: backMap[m[1]] || 'Dup GBB', paper_gram: m[2] };
    }
  }
  // "กระดาษ XXX NNN แกรม" pattern
  if (!comp.paper) {
    m = text.match(/กระดาษ\s*(\S+)\s*(\d{2,3})\s*(แกรม|gsm)/i);
    if (m) comp.paper = { paper_code: mapPaperCode(m[1]), paper_gram: m[2] };
  }

  // 2. Extract color — "4สี", "4/0", "พิมพ์ 4 สี"
  //    Use specific pattern to avoid matching "E 5,000/10,000"
  m = text.match(/(?:พิมพ์\s*)?([1-8])\s*\/\s*([0-8])\s*(?:สี|Colors?)?/i);
  if (!m) m = text.match(/\b([1-8])\s*\/\s*([0-8])\b(?!\s*[\d,])/); // avoid matching before qty like 5,000
  if (m) {
    comp.color = { outside: parseInt(m[1]), inside: parseInt(m[2]) };
  } else {
    m = text.match(/(?:พิมพ์\s*)?(\d)\s*สี/i);
    if (m) comp.color = { outside: parseInt(m[1]), inside: 0 };
  }

  // 3. Extract size — "10x15x5cm", "80x120mm", "180x305 mm"
  m = text.match(/(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(?:[xX×]\s*(\d+(?:\.\d+)?))?\s*(cm|mm|ซม|มม)?/i);
  if (m) {
    let w = parseFloat(m[1]), l = parseFloat(m[2]), d = m[3] ? parseFloat(m[3]) : 0;
    const unit = (m[4] || '').toLowerCase();
    if (unit === 'cm' || unit === 'ซม') { w *= 10; l *= 10; d *= 10; }
    comp.packaging_size = { width: Math.round(w), length: Math.round(l), depth: Math.round(d) };
  }

  // 4. Extract quantity — "5000ชิ้น", "3,000 กล่อง", "10000 ใบ", "5000/10000"
  m = text.match(/([\d,]+)\s*(?:\/\s*([\d,]+))?\s*(ชิ้น|กล่อง|ใบ|pcs|sets|ชุด)/i);
  if (m) {
    const q1 = m[1].replace(/,/g, '');
    result.qty = [q1];
    if (m[2]) result.qty.push(m[2].replace(/,/g, ''));
  } else {
    // "5000/10000" without unit
    m = text.match(/([\d,]{4,})\s*\/\s*([\d,]{4,})/);
    if (m) result.qty = [m[1].replace(/,/g, ''), m[2].replace(/,/g, '')];
  }

  // 5. Extract coating — "เคลือบ PVC เงา", "เคลือบ UV", "coating gloss"
  //    Stop before size patterns (digits x digits) or quantity patterns
  m = text.match(/(?:เคลือบ|coating)\s*(\S+(?:\s+(?:เงา|ด้าน|gloss|matte|hi-rub|WB))?)/i);
  if (m) {
    comp.addon.push({ type: 'coating', detail: m[0].trim(), side: 1 });
  }

  // 6. Extract component type keywords
  if (/ประกบลูกฟูก|ประกบกระดาษลูกฟูก/i.test(text)) {
    comp.component_type = 2;
    m = text.match(/(?:ก?ลอน|flute)\s*([A-F])/i);
    if (m) comp.corrugated = { flute_type: m[1].toUpperCase(), color: 'สีน้ำตาล' };
  } else {
    comp.component_type = 1;
  }

  // 7. Diecut
  if (/ปั๊มไดคัท|die\s*cut/i.test(text)) result.is_diecut = true;

  // 8. Extract component name / job name
  //    Common: "กล่อง", "ฝา", "ถาด", "sleeve"
  m = text.match(/(กล่อง|ฝา|ถาด|sleeve|tray|lid|box)/i);
  if (m) {
    comp.component_name = m[1];
    // Try to get job name from surrounding text
    const beforePaper = text.split(/\b(AC|MA|Dup|SBS|CRB|IVR|KA|อาร์ต|ดูเพล็กซ์|กระดาษ)/i)[0];
    if (beforePaper && beforePaper.trim().length > 2) {
      jobParts.push(beforePaper.trim());
    }
  }

  // 9. Extract customer — "ลูกค้า XXX" or known company patterns
  m = text.match(/ลูกค้า\s*(\S+)/i);
  if (m) result.customer_search = m[1];

  // Build job_name from collected parts
  if (jobParts.length > 0) {
    result.job_name = jobParts.join(' ').replace(/\s+/g, ' ').trim();
  } else {
    // Use first portion of text as job name (up to paper/color/qty info)
    const truncated = text.replace(/\b(AC|MA|Dup|SBS)\s*\w*\s*\d{2,3}.*/i, '').trim();
    if (truncated.length > 2) result.job_name = truncated.substring(0, 80);
  }

  // Validate: must have at least paper or color or size to be a valid parse
  if (!comp.paper && !comp.color && !comp.packaging_size && !result.qty) return null;

  // Clean up empty addon array
  if (comp.addon.length === 0) delete comp.addon;

  return result;
}

// --- English Key-Value spec parser ---
// Handles specs like:
//   Date: 26-Jan-2026
//   Size: 6-1/4" x 7-1/2" (Portrait)
//   Text/Cover: 350gsm C1S board (Apollopape FSC) +
//   Packing: Into export cartons and palletised
//   Shipping terms : FOB Hong Kong / Yantian
//   Foil stamp: silver
function parseEnglishKvSpec(lines) {
  const result = { components: [{}] };
  const comp = result.components[0];
  comp.addon = [];
  const unmatched = [];

  // Helper: parse fractional inch like "6-1/4" → 6.25, "7.1/2" → 7.5
  function parseFracInch(s) {
    s = s.replace(/"/g, '').trim();
    // "6-1/4" or "7.1/2" (dash or dot as separator)
    const fracM = s.match(/^(\d+)\s*[-._]\s*(\d+)\s*\/\s*(\d+)$/);
    if (fracM) return parseInt(fracM[1]) + parseInt(fracM[2]) / parseInt(fracM[3]);
    const simpleFrac = s.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (simpleFrac) return parseInt(simpleFrac[1]) / parseInt(simpleFrac[2]);
    return parseFloat(s) || 0;
  }

  for (const line of lines) {
    let m;

    // ===== Job Name / Title =====
    m = line.match(/^(?:Job\s*Name|Title|Product\s*Name|Item\s*Name|Item|Product)\s*:\s*(.+)/i);
    if (m) {
      let jobRaw = m[1].trim();
      // Smart split: "Test A / new customer" → job="Test A", customer="new customer"
      const slashParts = jobRaw.split(/\s*\/\s*/);
      if (slashParts.length > 1) {
        const possibleCust = slashParts[slashParts.length - 1];
        // Check if last part looks like customer info
        if (/customer|ลูกค้า|client|company|บริษัท|co\.\s*ltd/i.test(possibleCust)) {
          result.job_name = slashParts.slice(0, -1).join(' / ').trim();
          if (/new\s*customer|ลูกค้าใหม่/i.test(possibleCust)) {
            result.new_customer = true;
          } else {
            result.customer_search = possibleCust.replace(/^(?:customer|ลูกค้า)\s*:?\s*/i, '').trim();
          }
        } else {
          result.job_name = jobRaw;
        }
      } else {
        result.job_name = jobRaw;
      }
      continue;
    }

    // ===== Customer =====
    m = line.match(/^(?:Customer|Client|Company|ลูกค้า)\s*:\s*(.+)/i);
    if (m) {
      result.customer_search = m[1].trim();
      continue;
    }

    // ===== AE / Salesperson =====
    m = line.match(/^(?:AE\s*Name|AE|Sales|Salesperson|Account\s*Executive|พนักงานขาย)\s*:\s*(.+)/i);
    if (m) {
      result.ae_search = m[1].trim();
      continue;
    }

    // ===== Date → delivery_date (NOT job name!) =====
    m = line.match(/^(?:Date|Delivery\s*Date|Due\s*Date|วันจัดส่ง)\s*:\s*(.+)/i);
    if (m) {
      result.delivery_date = m[1].trim();
      continue;
    }

    // ===== Size — supports both mm and inches =====
    m = line.match(/^Size\s*:\s*(.+)/i);
    if (m) {
      const sizeStr = m[1];
      // Check if unit is mm or cm (not inches)
      const isMetric = /mm|มม|cm|ซม/i.test(sizeStr);
      const isCm = /cm|ซม/i.test(sizeStr);

      if (isMetric) {
        // Parse metric: "178 x 305 mm", "17.8 x 30.5 cm", "178x305x50mm"
        const mParts = sizeStr.match(/([\d.]+)\s*[xX×]\s*([\d.]+)(?:\s*[xX×]\s*([\d.]+))?/);
        if (mParts) {
          let w = parseFloat(mParts[1]), l = parseFloat(mParts[2]), d = mParts[3] ? parseFloat(mParts[3]) : 0;
          if (isCm) { w *= 10; l *= 10; d *= 10; }
          comp.packaging_size = {
            width: Math.round(w),
            length: Math.round(l),
            depth: Math.round(d)
          };
        }
      } else {
        // Parse inches (fractional): 6-1/4" x 7-1/2"
        const parts = sizeStr.match(/([\d\s\-\/."]+)/g);
        if (parts && parts.length >= 2) {
          const w = parseFracInch(parts[0]);
          const l = parseFracInch(parts[1]);
          const d = parts[2] ? parseFracInch(parts[2]) : 0;
          if (w > 0 || l > 0) {
            comp.packaging_size_inches = { width: w, length: l, depth: d };
            comp.packaging_size = {
              width: Math.round(w * 25.4),
              length: Math.round(l * 25.4),
              depth: Math.round(d * 25.4)
            };
          }
        }
      }
      // Orientation
      if (/portrait/i.test(sizeStr)) comp.orientation = 'Portrait';
      if (/landscape/i.test(sizeStr)) comp.orientation = 'Landscape';
      continue;
    }

    // ===== Ink Type =====
    m = line.match(/^(?:Ink|Ink\s*Type|ประเภทหมึก)\s*:\s*(.+)/i);
    if (m) {
      const inkVal = m[1].trim();
      result.ink_type = /UV/i.test(inkVal) ? 'UV' : 'conventional';
      continue;
    }

    // ===== Print Type =====
    m = line.match(/^(?:Print\s*Type|ประเภทพิมพ์|Printing)\s*:\s*(.+)/i);
    if (m) {
      const ptVal = m[1].trim();
      if (/flexo/i.test(ptVal)) result.print_type = 'Flexo';
      else if (/jet\s*press/i.test(ptVal)) result.print_type = 'Jet Press';
      else if (/konica/i.test(ptVal)) result.print_type = 'Konica';
      else result.print_type = 'Offset';
      continue;
    }

    // ===== Box Type =====
    m = line.match(/^(?:Box\s*Type|Template|ทรงกล่อง|รูปแบบกล่อง)\s*:\s*(.+)/i);
    if (m) {
      const btVal = m[1].trim();
      const typeNum = btVal.match(/(\d+)/);
      if (typeNum) {
        comp.box_type_id = parseInt(typeNum[1]);
      }
      continue;
    }

    // ===== Color — "4c x 0c", "4/0", "4 สี", "CMYK" =====
    m = line.match(/^(?:Color|Colour|สีพิมพ์|Print\s*Color)s?\s*:\s*(.+)/i);
    if (m) {
      const colorStr = m[1];
      // "4c x 0c" or "4C+0C"
      let colorM = colorStr.match(/(\d+)\s*[cC]\s*[x×+]\s*(\d+)\s*[cC]/);
      if (colorM) {
        comp.color = { outside: parseInt(colorM[1]), inside: parseInt(colorM[2]) };
      } else {
        // "4/0"
        colorM = colorStr.match(/(\d+)\s*\/\s*(\d+)/);
        if (colorM) comp.color = { outside: parseInt(colorM[1]), inside: parseInt(colorM[2]) };
        else if (/CMYK/i.test(colorStr)) comp.color = { outside: 4, inside: 0 };
        else {
          colorM = colorStr.match(/(\d+)\s*(?:สี|colors?)/i);
          if (colorM) comp.color = { outside: parseInt(colorM[1]), inside: 0 };
        }
      }
      continue;
    }

    // ===== Text/Cover or Cover or Paper =====
    m = line.match(/^(?:Text\s*\/\s*Cover|Cover|Paper)\s*:\s*(.+)/i);
    if (m) {
      const paperStr = m[1].trim();

      // Extract paper code + gram from various formats:
      //  "MA Matt Art 128gsm import" → code=MA, gram=128, import
      //  "350gsm C1S board" → code=AC C1s, gram=350
      //  "AC C1s 350" → code=AC C1s, gram=350

      // Try explicit code first: "MA Matt Art 128gsm" or "MA 128gsm"
      const codeFirst = paperStr.match(/^(AC\s*C[12]s|Dup\s*(?:GBB|WBB|BBB)|MA|SBS|CRB|IVR|KA|KI|FCY|WC|MCA|GA|B)\b/i);
      const gsmM = paperStr.match(/(\d+)\s*(?:gsm|แกรม)/i);
      const gramPlain = !gsmM ? paperStr.match(/\b(\d{2,3})\b/) : null;
      const gram = gsmM ? gsmM[1] : (gramPlain ? gramPlain[1] : '');

      if (codeFirst) {
        let code = codeFirst[1].trim();
        // Normalize
        if (/^MA$/i.test(code)) code = 'MA';
        else if (/^AC\s*C1s$/i.test(code)) code = 'AC C1s';
        else if (/^AC\s*C2s$/i.test(code)) code = 'AC C2s';
        else code = code.toUpperCase();
        comp.paper = { paper_code: code, paper_gram: gram };
      } else if (gsmM || gramPlain) {
        // Detect paper type from description
        let paperCode = '';
        if (/C1S/i.test(paperStr)) paperCode = 'AC C1s';
        else if (/C2S/i.test(paperStr)) paperCode = 'AC C2s';
        else if (/Matt\s*Art|MA\b/i.test(paperStr)) paperCode = 'MA';
        else if (/SBS/i.test(paperStr)) paperCode = 'SBS';
        else if (/duplex|GBB/i.test(paperStr)) paperCode = 'Dup GBB';
        else if (/CRB/i.test(paperStr)) paperCode = 'CRB';
        else if (/ivory/i.test(paperStr)) paperCode = 'IVR';
        else if (/kraft/i.test(paperStr)) paperCode = 'KA';
        else if (/art\s*card|art\s*board/i.test(paperStr)) paperCode = 'AC C1s';
        else paperCode = paperStr.replace(/\d+\s*(?:gsm|แกรม)/i, '').replace(/\(.*?\)/g, '').replace(/\+\s*$/, '').replace(/import|domestic|ในประเทศ|ต่างประเทศ/gi, '').trim() || 'AC C1s';
        comp.paper = { paper_code: paperCode, paper_gram: gram };
      }

      // Import/Domestic detection
      if (/import|ต่างประเทศ|นำเข้า/i.test(paperStr)) {
        if (!comp.paper) comp.paper = {};
        comp.paper.paper_source_id = '2'; // import
        comp.paper.paper_name = 'import';
      } else if (/domestic|ในประเทศ/i.test(paperStr)) {
        if (!comp.paper) comp.paper = {};
        comp.paper.paper_source_id = '1'; // domestic
      }

      // Extract color from paper line — "(4c x 0c)", "4C+0C", "(4/0)"
      const colorInPaper = paperStr.match(/(\d+)\s*[cC]\s*[x×+]\s*(\d+)\s*[cC]/);
      if (colorInPaper) {
        comp.color = { outside: parseInt(colorInPaper[1]), inside: parseInt(colorInPaper[2]) };
      }
      if (!comp.color) {
        const colorSlash = paperStr.match(/(\d+)\s*\/\s*(\d+)\s*(?:col|color)/i);
        if (colorSlash) comp.color = { outside: parseInt(colorSlash[1]), inside: parseInt(colorSlash[2]) };
      }
      // Extract coating from paper line
      const coatingInPaper = paperStr.match(/(\d\/S\s+)?(?:gloss|matt?e?|satin)\s*(?:UV|varnish|lamination|aqueous|lamin)[^(]*/i);
      if (coatingInPaper) {
        const coatDetail = coatingInPaper[0].trim();
        const sideM = coatDetail.match(/^(\d)\/S/i);
        comp.addon.push({ type: 'coating', detail: coatDetail, side: sideM ? parseInt(sideM[1]) : 1 });
      }
      // Store raw paper description
      comp.paper_description = paperStr;
      continue;
    }

    // ===== Paper Cost =====
    m = line.match(/^Paper\s*Cost\s*:\s*([\d.]+)/i);
    if (m) {
      if (!comp.paper) comp.paper = {};
      comp.paper.paper_cost = m[1];
      continue;
    }

    // ===== Paper Markup =====
    m = line.match(/^Paper\s*Markup\s*:\s*([\d.]+)\s*%?/i);
    if (m) {
      if (!comp.paper) comp.paper = {};
      comp.paper.paper_markup = m[1];
      continue;
    }

    // ===== Paper Brand =====
    m = line.match(/^(?:Paper\s*)?Brand\s*:\s*(.+)/i);
    if (m) {
      if (!comp.paper) comp.paper = {};
      comp.paper.paper_brand = m[1].trim();
      continue;
    }

    // ===== Diecut =====
    m = line.match(/^(?:Diecut|Die\s*Cut|ไดคัท)\s*:\s*(.+)/i);
    if (m) {
      const v = m[1].trim().toLowerCase();
      if (/yes|ใช่|มี|true/i.test(v)) result.is_diecut = true;
      continue;
    }

    // ===== Delivery / Shipping =====
    m = line.match(/^(?:Delivery|Shipping|จัดส่ง|การจัดส่ง|Shipping\s*terms?)\s*:\s*(.+)/i);
    if (m) {
      result.delivery_province = m[1].trim();
      continue;
    }

    // ===== Extent =====
    m = line.match(/^Extent\s*:\s*(.+)/i);
    if (m) {
      comp.extent = m[1].trim();
      continue;
    }

    // ===== Material =====
    m = line.match(/^Material\s*:\s*(.+)/i);
    if (m) {
      comp.material_note = m[1].trim();
      continue;
    }

    // ===== Binding =====
    m = line.match(/^Binding\s*:\s*(.+)/i);
    if (m) {
      comp.binding = m[1].trim();
      comp.addon.push({ type: 'binding', detail: m[1].trim() });
      continue;
    }

    // ===== Packing =====
    m = line.match(/^Packing\s*:\s*(.+)/i);
    if (m) {
      comp.packing_detail = m[1].trim();
      continue;
    }

    // ===== Foil stamp =====
    m = line.match(/^Foil\s*stamp\s*:\s*(.+)/i);
    if (m) {
      comp.addon.push({ type: 'foil_stamp', detail: 'Foil stamp: ' + m[1].trim() });
      continue;
    }

    // ===== Finishing =====
    m = line.match(/^Finishing\s*:\s*(.+)/i);
    if (m) {
      const finishStr = m[1].trim();
      const finishes = finishStr.split(/\s*\+\s*/);
      for (const f of finishes) {
        if (/lamin/i.test(f)) comp.addon.push({ type: 'coating', detail: f.trim() });
        else if (/UV|varnish/i.test(f)) comp.addon.push({ type: 'coating', detail: f.trim() });
        else if (/foil|stamp/i.test(f)) comp.addon.push({ type: 'foil_stamp', detail: f.trim() });
        else if (/emboss/i.test(f)) comp.addon.push({ type: 'emboss', detail: f.trim() });
        else comp.addon.push({ type: 'finishing', detail: f.trim() });
      }
      continue;
    }

    // ===== Coating =====
    m = line.match(/^(?:Coating|เคลือบ)\s*:\s*(.+)/i);
    if (m) {
      comp.addon.push({ type: 'coating', detail: m[1].trim() });
      continue;
    }

    // ===== Quantity =====
    m = line.match(/^(?:Qty|Quantity|Run|Copies|จำนวน)\s*:\s*([\d,]+)(?:\s*\/\s*([\d,]+))?/i);
    if (m) {
      result.qty = [m[1].replace(/,/g, '')];
      if (m[2]) result.qty.push(m[2].replace(/,/g, ''));
      continue;
    }

    // ===== Run-On =====
    m = line.match(/^Run[\s-]*On\s*:\s*([\d.]+)\s*%?/i);
    if (m) {
      result.run_on_percent = m[1];
      continue;
    }

    // ===== Component Name =====
    m = line.match(/^(?:Component|ชิ้นส่วน)\s*:\s*(.+)/i);
    if (m) {
      comp.component_name = m[1].trim();
      continue;
    }

    // ===== Glue Flap =====
    m = line.match(/^(?:Glue\s*Flap|ติดกาว)\s*:\s*([\d.]+)/i);
    if (m) {
      if (!comp.packaging_size) comp.packaging_size = {};
      comp.packaging_size.glue_flap = m[1];
      continue;
    }

    // ===== Tuck Flap =====
    m = line.match(/^(?:Tuck\s*Flap|ฝาเสียบ)\s*:\s*([\d.]+)/i);
    if (m) {
      if (!comp.packaging_size) comp.packaging_size = {};
      comp.packaging_size.tuck_flap = m[1];
      continue;
    }

    // ===== Machine =====
    m = line.match(/^(?:Machine|เครื่องพิมพ์)\s*:\s*(.+)/i);
    if (m) {
      result.machine_name = m[1].trim();
      continue;
    }

    // ===== Unmatched — generic KV capture =====
    const kvMatch = line.match(/^([A-Za-z\u0E00-\u0E7F][A-Za-z\u0E00-\u0E7F\s\/]*?)\s*:\s*(.+)/);
    if (kvMatch) {
      if (!result.extra_details) result.extra_details = [];
      result.extra_details.push({ key: kvMatch[1].trim(), value: kvMatch[2].trim() });
    } else {
      unmatched.push(line);
    }
  }

  // Build job_name from unmatched lines if not set
  if (!result.job_name && unmatched.length > 0) {
    result.job_name = unmatched[0].substring(0, 80);
  }

  // === Post-process: scan ALL lines (including unmatched) for common AE patterns ===
  // These patterns don't use "Key: Value" but embed data inline with "/" separators
  const fullText = lines.join('\n');

  // Paper without colon — "Paper Matt Art 128 Gsm" or "Paper MA 128gsm"
  if (!comp.paper?.paper_code) {
    let pm = fullText.match(/\bPaper\s+((?:Matt?\s*Art|MA|AC\s*C[12]s|Dup(?:lex)?\s*(?:GBB|WBB|BBB)?|SBS|CRB|IVR|KA|Ivory|Art\s*Card|kraft)[^/\n]*?)\s*(\d{2,3})\s*(?:gsm|Gsm|แกรม)/i);
    if (pm) {
      const rawCode = pm[1].trim();
      if (!comp.paper) comp.paper = {};
      comp.paper.paper_code = mapPaperCode(rawCode);
      comp.paper.paper_gram = pm[2];
    }
  }
  // Paper source — ต่างประเทศ / import / domestic / ในประเทศ
  if (comp.paper && !comp.paper.paper_source_id) {
    if (/ต่างประเทศ|import|นำเข้า/i.test(fullText)) {
      comp.paper.paper_source_id = '2';
      comp.paper.paper_name = 'import';
    } else if (/ในประเทศ|domestic/i.test(fullText)) {
      comp.paper.paper_source_id = '1';
    }
  }

  // qty without colon — "qty 9000" or "qty 5000/10000"
  if (!result.qty) {
    const qm = fullText.match(/\bqty\s+([\d,]+)(?:\s*\/\s*([\d,]+))?/i);
    if (qm) {
      result.qty = [qm[1].replace(/,/g, '')];
      if (qm[2]) result.qty.push(qm[2].replace(/,/g, ''));
    }
  }

  // Ink type — "UV" or "conventional" mentioned inline
  if (!result.ink_type) {
    if (/\/\s*UV\b|\bUV\s*\//i.test(fullText)) result.ink_type = 'UV';
  }

  // Color without colon — "Outside 4 cols" or "4 สี"
  if (!comp.color) {
    const cm = fullText.match(/Outside\s+(\d+)\s*cols?/i);
    if (cm) comp.color = { outside: parseInt(cm[1]), inside: 0 };
    const cmi = fullText.match(/Inside\s+(\d+)\s*cols?/i);
    if (cmi && comp.color) comp.color.inside = parseInt(cmi[1]);
  }

  // Paper markup — "mark-up 13%" or "markup 10%"
  if (comp.paper && !comp.paper.paper_markup) {
    const mkm = fullText.match(/mark[\s-]*up\s+([\d.]+)\s*%?/i);
    if (mkm) comp.paper.paper_markup = mkm[1];
  }

  // Component type — "ไม่ประกบลูกฟูก" or "ประกบลูกฟูก"
  if (comp.component_type === undefined) {
    if (/ไม่ประกบลูกฟูก/i.test(fullText)) comp.component_type = 1;
    else if (/ประกบลูกฟูก/i.test(fullText)) comp.component_type = 2;
  }

  // Box template from inline — "Component ที่ 1 = 12. Custom" or "= 1. Reverse Tuck"
  if (!comp.box_type_id) {
    const btm = fullText.match(/=\s*(\d{1,2})\.\s*(Reverse|Straight|Tuck|Double|Frame|Four|Gable|Sleeve|Pillow|Seal|Custom)/i);
    if (btm) comp.box_type_id = parseInt(btm[1]);
  }

  // Size from inline — "กว้าง 178 mm" + "ยาว 305 mm"
  if (!comp.packaging_size) {
    const wm = fullText.match(/กว้าง\s+([\d.]+)\s*mm/i);
    const lm = fullText.match(/ยาว\s+([\d.]+)\s*mm/i);
    if (wm && lm) {
      comp.packaging_size = { width: Math.round(parseFloat(wm[1])), length: Math.round(parseFloat(lm[1])), depth: 0 };
    }
  }

  // Clean up empty addon
  if (comp.addon && comp.addon.length === 0) delete comp.addon;

  return result;
}

function parseStructuredSpec(lines) {
  const result = { components: [] };
  const compMap = {}; // name → component index
  let currentCompName = null;
  let currentSection = ''; // PROCESS, PAPER, OTHER, PACKING — track sections from headers

  function getComp(name) {
    // Get or create component by name
    const key = (name || 'BOX').toLowerCase();
    if (compMap[key] === undefined) {
      console.log(`[parseStructuredSpec] NEW COMPONENT created: key="${key}" name="${name}" (total: ${result.components.length + 1})`);
      compMap[key] = result.components.length;
      result.components.push({ component_name: name || 'BOX', addon: [] });
    }
    return result.components[compMap[key]];
  }

  // Default component (for lines without component prefix)
  let comp = null;

  for (const line of lines) {
    // === Section header tracking — "PROCESS", "PAPER", "OTHER", "PACKING", etc. ===
    // ใช้สำหรับ context detection เช่น "- 1" ใต้ PROCESS = ambiguous
    const sectionMatch = line.match(/^(TITLE|SIZE|COMPONENT(?:\s*TYPE)?|PAPER|PRINT|OTHER|PROCESS|PACKING|กระบวนการ|ขั้นตอน)\s*$/i);
    if (sectionMatch) {
      currentSection = sectionMatch[1].toUpperCase().replace(/\s+/g, '_');
      continue;
    }

    // TITLE
    let m = line.match(/^TITLE\s*:\s*(.+)/i);
    if (m) {
      result.job_name = m[1].trim();
      // Extract customer if embedded: "... ลูกค้า ABC"
      const custMatch = m[1].match(/ลูกค้า\s*(\S+(?:\s*\([^)]+\))?)/);
      if (custMatch) {
        result.customer_search = custMatch[1].trim();
        result.job_name = m[1].replace(/\s*ลูกค้า\s*\S+(?:\s*\([^)]+\))?\s*/, ' ').trim();
      }
      continue;
    }

    // SIZE (mm) — applies to all components (shared size)
    m = line.match(/^SIZE\s*\(mm\.?\)\s*:\s*(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/i);
    if (m) {
      result._sharedSize = { width: parseInt(m[1]), length: parseInt(m[2]), depth: parseInt(m[3]) };
      continue;
    }

    // SIZE (Inches)
    m = line.match(/^SIZE\s*\(Inch(?:es)?\)\s*:\s*([\d.]+)"?\s*x\s*([\d.]+)"?\s*x\s*([\d.]+)"?/i);
    if (m) {
      result._sharedSizeInches = { width: parseFloat(m[1]), length: parseFloat(m[2]), depth: parseFloat(m[3]) };
      if (!result._sharedSize) {
        result._sharedSize = {
          width: Math.round(parseFloat(m[1]) * 25.4),
          length: Math.round(parseFloat(m[2]) * 25.4),
          depth: Math.round(parseFloat(m[3]) * 25.4)
        };
      }
      continue;
    }

    // COMPONENT TYPE — "- Tray: ไม่ประกบลูกฟูก" หรือ "- Box ไม่ประกบ: ไม่ประกบลูกฟูก" (มี space ในชื่อ component)
    // ใช้ [^:]+? เพื่อจับชื่อ component ที่อาจมี space (non-greedy ก่อน colon แรก)
    m = line.match(/[-–]\s*([^:]+?)\s*:\s*(ไม่ประกบลูกฟูก|ประกบลูกฟูก|เฉพาะลูกฟูก)/);
    if (m) {
      const compName = m[1].trim();
      comp = getComp(compName);
      comp.component_type = m[2] === 'ไม่ประกบลูกฟูก' ? 1 : m[2] === 'ประกบลูกฟูก' ? 2 : 3;
      currentCompName = compName;
      continue;
    }

    // Helper: extract component name from line prefix "- Tray: ..." or "- Cover: ..." or "- Box ไม่ประกบ: ..."
    // Skip F-codes (F001, F002, etc.) and F-code groups ([F001, F002]) — these are editions, NOT component names
    const compPrefix = line.match(/^[-–]\s*([^:]+?)\s*:/);
    const prefixName = (compPrefix?.[1] || '').trim();
    const isFCode = /^F\d+$/i.test(prefixName);
    // Detect "[F001, F002, F003]:" or "[F001]:" grouped F-code prefix
    const isFCodeGroup = /^\[F\d+/.test(prefixName) || /^\[.*F\d+/.test(line.substring(0, 30));
    const lineComp = (compPrefix && !isFCode && !isFCodeGroup) ? getComp(prefixName) : comp;

    // Parse F-code group prefix: "[F001, F002, F003]: foil stamp ..." → extract F-codes for metadata
    let lineApplyFCodes = null;
    const fGroupMatch = line.match(/^\s*[-–]?\s*\[([^\]]+)\]\s*:\s*/);
    if (fGroupMatch) {
      lineApplyFCodes = fGroupMatch[1].split(/[,\s]+/).filter(f => /^F\d+$/i.test(f));
    }

    // PAPER — "- Tray: A/C C1s 350 gsm" หรือ "- Box ไม่ประกบ: A/C C1s 350 gsm"
    m = line.match(/[-–]\s*[^:]+?\s*:\s*(Duplex|Dup|AC|A\/C|SBS|CRB|Ivory|IVR|Art|อาร์ต|ดูเพล็กซ์|กระดาษ)\s*([\w\s]*?)\s*(\d+)\s*(?:gsm|แกรม)/i);
    if (m && lineComp) {
      const rawCode = (m[1] + ' ' + m[2]).trim();
      lineComp.paper = { paper_code: mapPaperCode(rawCode), paper_gram: m[3] };
      continue;
    }

    // PAPER (Thai descriptive) — "- BOX: หน้าขาวหลังเทา 350 gsm"
    m = line.match(/[-–]\s*[^:]+?\s*:\s*(หน้า\s*ขาว\s*หลัง\s*(?:เทา|ขาว|น้ำตาล|ครีม|กล่อง))\s*(\d+)\s*(?:gsm|แกรม)?/i);
    if (m && lineComp) {
      const backMap = { 'เทา': 'Dup GBB', 'ขาว': 'Dup WBB', 'น้ำตาล': 'Dup BBB', 'ครีม': 'Dup GBB', 'กล่อง': 'Dup GBB' };
      const backKey = m[1].match(/(เทา|ขาว|น้ำตาล|ครีม|กล่อง)$/)?.[1];
      const code = backMap[backKey] || 'Dup GBB';
      lineComp.paper = { paper_code: code, paper_gram: m[2] };
      result._aiNotes = result._aiNotes || [];
      result._aiNotes.push(buildPaperMappingNote(m[1].trim(), code, m[2]));
      continue;
    }
    // PAPER (Thai short) — "- BOX: ขาว/เทา 350 gsm"
    m = line.match(/[-–]\s*[^:]+?\s*:\s*(ขาว\s*[\/\-]?\s*(?:เทา|ขาว|น้ำตาล))\s*(\d+)\s*(?:gsm|แกรม)?/i);
    if (m && lineComp) {
      const backMap = { 'เทา': 'Dup GBB', 'ขาว': 'Dup WBB', 'น้ำตาล': 'Dup BBB' };
      const backKey = m[1].match(/(เทา|ขาว|น้ำตาล)$/)?.[1];
      const code = backMap[backKey] || 'Dup GBB';
      lineComp.paper = { paper_code: code, paper_gram: m[2] };
      result._aiNotes = result._aiNotes || [];
      result._aiNotes.push(buildPaperMappingNote(m[1].trim(), code, m[2]));
      continue;
    }

    // PRINT (color) — "- Tray : 4/1 Colors"
    m = line.match(/(\d+)\s*\/\s*(\d+)\s*Colors?/i);
    if (m && !line.match(/^[-–]\s*F\d+/i) && lineComp) {
      lineComp.color = { outside: parseInt(m[1]), inside: parseInt(m[2]) };
      continue;
    }

    // F-codes — "- F015731 : 7/0 Colors"
    m = line.match(/[-–]\s*(F\d+)\s*:?\s*(\d+)\s*\/\s*(\d+)/i);
    if (m) {
      if (!result.f_codes) result.f_codes = [];
      result.f_codes.push({ f_code: m[1], colors_out: parseInt(m[2]), colors_in: parseInt(m[3]) });
      const fComp = comp || getComp('BOX');
      fComp.f_detail = (fComp.f_detail ? fComp.f_detail + ', ' : '') + m[1];
      if (!fComp.color) fComp.color = { outside: parseInt(m[2]), inside: parseInt(m[3]) };
      continue;
    }

    // Flexible prefix: "- BOX:" or "- [F001, F002, F003]:" or "- Tray:"
    // Using regex literals (not new RegExp) to avoid escaping issues
    const addonTarget = lineComp || comp;

    // OTHER (coating) — "- Tray: coating gloss UV 1 s" or "- [F001]: coating ..." or "- Box ไม่ประกบ: coating ..."
    m = line.match(/[-–]\s*(?:\[[^\]]*\]|[^:]+?)\s*:\s*(coating\s+.+)/i);
    if (m && addonTarget) {
      const detail = m[1].trim();
      const sideMatch = detail.match(/(\d)\s*s\b/);
      addonTarget.addon = addonTarget.addon || [];
      addonTarget.addon.push({ type: 'coating', detail, side: sideMatch ? parseInt(sideMatch[1]) : 1, _fCodes: lineApplyFCodes });
      continue;
    }

    // OTHER — foil stamp (with component prefix)
    m = line.match(/[-–]\s*(?:\[[^\]]*\]|[^:]+?)\s*:\s*(foil\s*stamp\s+.+)/i);
    if (m && addonTarget) {
      addonTarget.addon = addonTarget.addon || [];
      addonTarget.addon.push({ type: 'foil_stamp', detail: m[1].trim(), _fCodes: lineApplyFCodes });
      continue;
    }
    // OTHER — foil (standalone, no prefix, no "stamp" word)
    // เช่น "- foil สีเงิน", "- ฟอยล์ ทอง", "- foil แดง", "- ปั๊มฟอยล์ silver"
    m = line.match(/^[-–]\s*(?:ปั๊ม)?(?:foil|ฟอยล์|ฟอยส์)\s+(.+)/i);
    if (m && addonTarget) {
      addonTarget.addon = addonTarget.addon || [];
      addonTarget.addon.push({ type: 'foilstamp', detail: m[1].trim(), _fCodes: lineApplyFCodes });
      continue;
    }

    // OTHER — emboss (with component prefix)
    m = line.match(/[-–]\s*(?:\[[^\]]*\]|[^:]+?)\s*:\s*(emboss\s+.+)/i);
    if (m && addonTarget) {
      addonTarget.addon = addonTarget.addon || [];
      addonTarget.addon.push({ type: 'emboss', detail: m[1].trim(), _fCodes: lineApplyFCodes });
      continue;
    }
    // OTHER — emboss (standalone)
    // เช่น "- emboss 1x2", "- ปั๊มนูน", "- ปั๊มนูน โลโก้"
    m = line.match(/^[-–]\s*(?:ปั๊ม)?(?:emboss|นูน|ปั๊มนูน)(?:\s+(.+))?/i);
    if (m && addonTarget) {
      addonTarget.addon = addonTarget.addon || [];
      addonTarget.addon.push({ type: 'emboss', detail: (m[1] || '').trim() || 'emboss', _fCodes: lineApplyFCodes });
      continue;
    }

    // OTHER — deboss (with component prefix)
    m = line.match(/[-–]\s*(?:\[[^\]]*\]|[^:]+?)\s*:\s*(deboss\s+.+)/i);
    if (m && addonTarget) {
      addonTarget.addon = addonTarget.addon || [];
      addonTarget.addon.push({ type: 'deboss', detail: m[1].trim(), _fCodes: lineApplyFCodes });
      continue;
    }
    // OTHER — deboss (standalone)
    m = line.match(/^[-–]\s*(?:ปั๊ม)?(?:deboss|จม|ปั๊มจม)(?:\s+(.+))?/i);
    if (m && addonTarget) {
      addonTarget.addon = addonTarget.addon || [];
      addonTarget.addon.push({ type: 'deboss', detail: (m[1] || '').trim() || 'deboss', _fCodes: lineApplyFCodes });
      continue;
    }

    // PACKING — "- Tray: kraftwrap 125 pcs/pack" (fuzzy: raftwrap, kraftwarp, paperbnad)
    m = line.match(/[-–]\s*[^:]+?\s*:\s*(k?r[ao]ft\s*w[ar]+[ae]?p|shrink\s*w[ar]+p|band\s*w[ar]+p|rubber|carton|paper\s*b[ao]n?d|pallet|รัดยาง|ห่อ|พาเลท).*/i);
    if (m && lineComp) {
      lineComp.packing_detail = (lineComp.packing_detail ? lineComp.packing_detail + ', ' : '') + m[0].replace(/^[-–]\s*[^:]+?\s*:\s*/, '').trim();
      continue;
    }

    // PROCESS items (ค่าติดกาว, ปั๊มไดคัท, ปั๊มฟอยล์, ปั๊มนูน, ขึ้นรูป, etc.)
    m = line.match(/[-–]\s*(ค่า\S+|ปั๊ม\S+|ประก(?:า)?ว\S*|ติดกาว|ขึ้นรูป\S*|die\s*cut|foil\s*stamp|forming|setup|set\s*up)/i);
    if (m) {
      if (!result.other_process) result.other_process = [];
      const procName = m[0].replace(/^[-–]\s*/, '').trim();
      if (/ไดคัท|die\s*cut/i.test(procName)) {
        result.is_diecut = true;
        result.other_process.push({ name: procName });
      } else if (/ฟอยล์|foil/i.test(procName)) {
        const targetComp = comp || result.components[0] || getComp('BOX');
        targetComp.addon = targetComp.addon || [];
        targetComp.addon.push({ type: 'foilstamp', detail: procName });
      } else if (/นูน|emboss/i.test(procName)) {
        const targetComp = comp || result.components[0] || getComp('BOX');
        targetComp.addon = targetComp.addon || [];
        targetComp.addon.push({ type: 'emboss', detail: procName });
      } else {
        result.other_process.push({ name: procName });
      }
      continue;
    }

    // PROCESS — ตัวเลขล้วน (เช่น "- 1", "- 2") = คลุมเครือ
    // user อาจหมายถึง process IDs หรือ numbered list ที่ไม่ได้กรอกชื่อ
    // → flag เป็น warning แทนที่จะเดา
    m = line.match(/^[-–]\s*(\d+)\s*$/);
    if (m && currentSection === 'PROCESS') {
      result._warnings = result._warnings || [];
      result._warnings.push({
        type: 'ambiguous_process',
        value: m[1],
        line: line,
        message: `พบ "${line.trim()}" ใน PROCESS section — ตัวเลขล้วนคลุมเครือ ระบบไม่กล้าใส่ลงฟอร์ม กรุณาระบุชื่อ process ที่ชัดเจน เช่น "ขึ้นรูป", "ทากาว"`,
      });
      continue;
    }

    // qty
    m = line.match(/^qty\s+(\d[\d,]*)/i);
    if (m) {
      result.qty = [m[1].replace(/,/g, '')];
      continue;
    }
  }

  // If no components were created, add default
  if (result.components.length === 0) {
    result.components.push({ component_name: 'BOX', addon: [] });
  }

  // Apply shared size to all components that don't have their own
  if (result._sharedSize) {
    result.components.forEach(c => {
      if (!c.packaging_size) c.packaging_size = { ...result._sharedSize };
    });
    delete result._sharedSize;
  }
  if (result._sharedSizeInches) {
    result.components.forEach(c => {
      if (!c.packaging_size_inches) c.packaging_size_inches = { ...result._sharedSizeInches };
    });
    delete result._sharedSizeInches;
  }

  // Handle multiple F-codes in PRINT section
  const fCodes = lines.filter(l => /[-–]\s*F\d+/i.test(l));
  if (fCodes.length > 1) {
    const firstComp = result.components[0];
    firstComp.f_detail = fCodes.map(l => {
      const m2 = l.match(/(F\d+)/i);
      return m2 ? m2[1] : '';
    }).filter(Boolean).join(', ');
  }
  if (!result.f_codes && fCodes.length > 0) {
    result.f_codes = fCodes.map(l => {
      const m2 = l.match(/[-–]\s*(F\d+)\s*:?\s*(\d+)\s*\/\s*(\d+)/i);
      return m2 ? { f_code: m2[1], colors_out: parseInt(m2[2]), colors_in: parseInt(m2[3]) } : null;
    }).filter(Boolean);
  }

  // Clean up empty addons
  result.components.forEach(c => {
    if (c.addon && c.addon.length === 0) delete c.addon;
  });

  return result;
}

function parseThaiSpec(lines, fullText) {
  const result = { components: [{}] };
  const comp = result.components[0];
  comp.addon = [];
  result.other_process = [];

  // Job name = first line or combined context
  result.job_name = lines[0] || '';

  // Print type
  if (/ออฟเซ็ท|offset/i.test(fullText)) result.print_type = 'Offset';
  if (/เฟล็กโซ่|flexo/i.test(fullText)) result.print_type = 'Flexo';

  // Component type
  if (/ประกบ(?:กระดาษ)?ลูกฟูก/.test(fullText) && !/ไม่ประกบ/.test(fullText)) {
    comp.component_type = 2;
  } else if (/ไม่ประกบลูกฟูก/.test(fullText)) {
    comp.component_type = 1;
  } else if (/เฉพาะลูกฟูก/.test(fullText)) {
    comp.component_type = 3;
  }

  // Component name
  const compNameMatch = fullText.match(/(กล่อง|BOX|Sleeve|ฝา|ถาด)/i);
  if (compNameMatch) comp.component_name = compNameMatch[1];

  // Box type search
  const boxMatch = fullText.match(/ทรง(.+?)(?:\n|$)/);
  if (boxMatch) comp.box_type_search = boxMatch[1].trim();

  // Size in cm: 18x18x37 cm
  let sizeMatch = fullText.match(/ขนาด(?:ขึ้นรูป)?\s*(\d+)\s*[xX×]\s*(\d+)\s*[xX×]\s*(\d+)\s*cm/i);
  if (sizeMatch) {
    comp.packaging_size = {
      width: parseInt(sizeMatch[1]) * 10,
      length: parseInt(sizeMatch[2]) * 10,
      depth: parseInt(sizeMatch[3]) * 10
    };
  }
  // Size in mm
  if (!comp.packaging_size) {
    sizeMatch = fullText.match(/ขนาด(?:ขึ้นรูป)?\s*(\d+)\s*[xX×]\s*(\d+)\s*[xX×]\s*(\d+)\s*(?:mm|มม)/i);
    if (sizeMatch) {
      comp.packaging_size = {
        width: parseInt(sizeMatch[1]),
        length: parseInt(sizeMatch[2]),
        depth: parseInt(sizeMatch[3])
      };
    }
  }

  // Paper
  const paperMatch = fullText.match(/(?:กระดาษ)(อาร์ต|อาร์ท|ดูเพล็กซ์|คราฟท์|SBS|CRB|Ivory|AC|Duplex)?\s*(\d+)\s*(?:แกรม|gsm)/i);
  if (paperMatch) {
    const rawName = paperMatch[1] || '';
    comp.paper = { paper_code: mapPaperCode(rawName), paper_gram: paperMatch[2] };
  }

  // Color: "พิมพ์ N สี"
  const colorMatch = fullText.match(/พิมพ์?\s*(\d+)\s*สี/);
  if (colorMatch) {
    comp.color = { outside: parseInt(colorMatch[1]), inside: 0 };
  }
  // Color: N/N
  if (!comp.color) {
    const colorMatch2 = fullText.match(/(\d+)\s*\/\s*(\d+)\s*(?:สี|Colors?)/i);
    if (colorMatch2) {
      comp.color = { outside: parseInt(colorMatch2[1]), inside: parseInt(colorMatch2[2]) };
    }
  }

  // Coating
  const coatingMatch = fullText.match(/(?:เคลือบ|coating)\s*(.+?)(?:\n|$)/i);
  if (coatingMatch) {
    const detail = coatingMatch[0].trim();
    const sideM = detail.match(/(\d)\s*(?:s|ด้าน)\b/);
    comp.addon.push({ type: 'coating', detail: detail, side: sideM ? parseInt(sideM[1]) : 1 });
  }

  // Corrugated
  const corrMatch = fullText.match(/(?:ประกบ)?ลูกฟูก\s*(?:ก?ลอน)?\s*([A-F])\s*(สี\S+)?/i);
  if (corrMatch) {
    comp.corrugated = { flute_type: corrMatch[1].toUpperCase(), color: corrMatch[2] || '' };
  }

  // Die cut
  if (/ปั๊มไดคัท|die\s*cut/i.test(fullText)) {
    result.is_diecut = true;
  }

  // Processes: ค่าติดกาว, ประกาว, etc.
  if (/ค่าติดกาว/.test(fullText)) result.other_process.push({ name: 'ค่าติดกาว' });
  const glueMatch = fullText.match(/(?:ประก(?:า)?ว|ปะกาว)(?:ข้าง)?\s*(\d+)?\s*ตำแหน่ง/);
  if (glueMatch) result.other_process.push({ name: glueMatch[0] });

  // Qty - single
  const qtyMatch = fullText.match(/(?:จำนวน(?:ผลิตรวม)?|qty)\s*([\d,]+)\s*(?:กล่อง|ชิ้น|pcs)?/i);
  if (qtyMatch) result.qty = [qtyMatch[1].replace(/,/g, '')];

  // Multi-edition F-codes: "สีฟ้า 319" → F-code name = "สีฟ้า 319" (ตัวเลขเป็นรหัส ไม่ใช่จำนวน)
  const editionPattern = /(สี\S+)\s+(\d+)/g;
  const editionNames = [];
  let edMatch;
  while ((edMatch = editionPattern.exec(fullText)) !== null) {
    // เก็บชื่อ + ตัวเลข เป็น F-code name ทั้งตัว
    editionNames.push(edMatch[0].trim()); // "สีฟ้า 319"
  }
  if (editionNames.length > 0) {
    result.edition_names = editionNames;
    // ไม่ใส่ edition_qtys — ต้องให้ user กรอกจำนวนแต่ละ F เอง
    // qty รวม มาจาก "จำนวนผลิตรวม" ที่จับได้ก่อนหน้า
  }

  // Packing (fuzzy: raftwrap, kraftwarp, paperbnad)
  const packMatch = fullText.match(/(k?r[ao]ft\s*w[ar]+[ae]?p|shrink\s*w[ar]+p|band\s*w[ar]+p|rubber|paper\s*b[ao]n?d|carton|pallet|รัดยาง|ห่อ|พาเลท).*/i);
  if (packMatch) comp.packing_detail = packMatch[0].trim();

  // Remark — text in parentheses or after หมายเหตุ
  const remarkMatch = fullText.match(/\(([^)]{4,})\)|หมายเหตุ\s*[:\-]?\s*(.+?)(?:\n|$)/i);
  if (remarkMatch) result.remark = (remarkMatch[1] || remarkMatch[2] || '').trim();

  return result;
}

function mapPaperCode(rawName) {
  if (!rawName) return 'AC C1s';

  // คำที่ AE ใช้บรรยายสีกระดาษ Duplex แทนชื่อ technical
  if (/หน้า\s*ขาว\s*หลัง\s*เทา|ขาว[\/\-]?เทา/i.test(rawName)) return 'Dup GBB';
  if (/หน้า\s*ขาว\s*หลัง\s*ขาว|ขาว[\/\-]?ขาว/i.test(rawName)) return 'Dup WBB';
  if (/หน้า\s*ขาว\s*หลัง\s*น้ำตาล|ขาว[\/\-]?น้ำตาล/i.test(rawName)) return 'Dup BBB';

  // === Normalize: ลบ slash/dash ใน A/C, A-C → AC (master DB ใช้ไม่มี slash) ===
  // "A/C C1s" → "AC C1s", "A-C C2s" → "AC C2s"
  if (/\bA[\/\-]?C\s*C[12]s/i.test(rawName)) {
    const grade = rawName.match(/C([12])s/i);
    return grade ? 'AC C' + grade[1] + 's' : 'AC C1s';
  }
  // ทั่วไป: ลบ slash จาก code letters (A/C → AC, P/E → PE)
  const slashNormalized = rawName.replace(/\b([A-Z])[\/\-]([A-Z])\b/gi, '$1$2');

  if (/dup.*gbb|duplex.*gbb|ดูเพล็กซ์.*gbb/i.test(slashNormalized)) return 'Dup GBB';
  if (/dup.*wbb|duplex.*wbb/i.test(slashNormalized)) return 'Dup WBB';
  if (/dup.*bbb|duplex.*bbb/i.test(slashNormalized)) return 'Dup BBB';
  if (/matt?\s*art/i.test(slashNormalized)) return 'MA';
  if (/gloss\s*art/i.test(slashNormalized)) return 'GA';
  if (/\bAC\s*C1s\b/i.test(slashNormalized)) return 'AC C1s';
  if (/\bAC\s*C2s\b/i.test(slashNormalized)) return 'AC C2s';
  if (/อาร์ต|อาร์ท|art.*card|^ac\b/i.test(slashNormalized)) return 'AC C1s';
  if (/sbs/i.test(slashNormalized)) return 'SBS';
  if (/crb/i.test(slashNormalized)) return 'CRB';
  if (/ivory|ivr/i.test(slashNormalized)) return 'IVR';
  if (/คราฟท์|kraft/i.test(slashNormalized)) return 'KA';
  if (/duplex/i.test(slashNormalized)) return 'Dup GBB';
  return slashNormalized.trim() || 'AC C1s';
}

// --- Enhanced spec detection (mirrors client-side detectSpec) ---
function serverDetectSpec(text) {
  // English key-value format (Date:, Size:, Text/Cover:, Packing:, Foil stamp:, etc.)
  const engKvKeys = ['Date', 'Size', 'Text\\/Cover', 'Cover', 'Paper', 'Packing', 'Shipping', 'Foil\\s*stamp', 'Binding', 'Extent', 'Material', 'Finishing'];
  const engKvCount = text.split(/\n/).filter(l => new RegExp('^\\s*(?:' + engKvKeys.join('|') + ')\\s*:', 'i').test(l)).length;
  if (engKvCount >= 2) return true;
  if (/TITLE|SIZE\s*\(|PAPER\s*-|PRINT\s*-|COMPONENT|gsm|Colors\s*$/im.test(text)) return true;
  if (/กระดาษ.*แกรม|พิมพ์.*สี|ประกบลูกฟูก|ขนาดขึ้นรูป|เคลือบ.*(UV|PVC|เงา|ด้าน)|ปั๊ม(ไดคัท|ฟอยล์|นูน|จม)/i.test(text)) return true;
  if (/\b(AC|MA|Dup|SBS|CRB|IVR|KA|KI|FCY|WC|MCA|GA)\s*(?:C[12]s\s*)?\d{2,3}\b/i.test(text)) return true;
  if (/\b(อาร์ต|ดูเพล็กซ์|คราฟท์|ไอวอรี่|duplex|ivory|art\s*card)\s*\d{2,3}/i.test(text)) return true;
  if (/หน้า\s*ขาว\s*หลัง\s*(เทา|ขาว|น้ำตาล)/i.test(text)) return true;
  if (/\b[1-8]\s*สี|\b[1-8]\/[0-8]\b|พิมพ์\s*\d\s*สี/i.test(text)) return true;
  if (/(กล่อง|ฝา|ถาด|sleeve|tray|lid|box)\s*.*\d+\s*[xX×]\s*\d+/i.test(text)) return true;
  if (/\d{3,}[\s,]*\d*\s*(ชิ้น|กล่อง|ใบ|pcs|sets|ชุด)/i.test(text)) return true;
  let score = 0;
  if (/กล่อง|ฝา|ถาด|กระดาษ|box|lid|tray/i.test(text)) score++;
  if (/\d{2,3}\s*(แกรม|gsm|g)/i.test(text)) score++;
  if (/\d+\s*[xX×]\s*\d+/i.test(text)) score++;
  if (/\d{3,}/i.test(text)) score++;
  if (/ลูกฟูก|flute|corrugat/i.test(text)) score++;
  if (/coating|เคลือบ|ฟอยล์|foil|emboss/i.test(text)) score++;
  if (/offset|ออฟเซ็ท|flexo|เฟล็กโซ่/i.test(text)) score++;
  return score >= 2;
}

// --- Conversational system prompt (for non-spec chat, based on SOUL.md) ---
function buildChatPrompt(masterData) {
  const paperCodes = masterData?.paperCodes ? JSON.stringify(masterData.paperCodes) : '[]';
  const boxTemplates = masterData?.boxTemplates ? JSON.stringify(masterData.boxTemplates) : '[]';
  return `คุณคือ "Pornchai AI" — AI Agent เฉพาะทางสำหรับระบบ RFQ Estimate Packaging ของบริษัท Sirivatana Interprint
คุณช่วย AE (Account Executive) สร้างใบเสนอราคางานพิมพ์บรรจุภัณฑ์ (กล่อง)

## กฎเหล็ก (จาก SOUL.md)
1. **ไม่แน่ใจ = ถามกลับ** — ห้ามเดาข้อมูลเด็ดขาด ถ้า input กำกวม ให้ถามกลับทันที พร้อมแสดงตัวเลือก
2. **Validate กับ Master Data** — กระดาษ, กล่อง, ลูกค้า ต้อง match กับข้อมูลในระบบ
3. **สรุปก่อน Save** — ก่อนบันทึก ต้องแสดงสรุปข้อมูลให้ AE ยืนยัน
4. **บอกสิ่งที่ทำไม่ได้ตรงๆ** — ถ้าข้อมูลไม่พอให้บอกว่าขาดอะไร

## ข้อมูลที่ต้องรู้
- รหัสกระดาษ: ${paperCodes}
- รูปแบบกล่อง: ${boxTemplates}
- สถานะ RFQ: Draft(0), Pending(1), Request for Approve(2), Approve(3)
- RFQ ID format: E + ปี พ.ศ. 2 หลัก + เดือน 2 หลัก + running 4 หลัก (เช่น E26030014)

## วิธีตอบ
- ตอบเป็น **ภาษาไทย** เสมอ สุภาพ กระชับ ใช้ครับ/ค่ะ
- ถ้า AE ส่ง spec งาน → วิเคราะห์แล้วสรุปข้อมูลที่ได้ + บอกข้อมูลที่ยังขาด
- ถ้า AE ถามเรื่องระบบ → อธิบายสั้นๆ ตรงประเด็น
- ถ้า AE ต้องการแก้ไขข้อมูล → ทำตามที่ขอ
- ถ้าไม่เกี่ยวกับงานพิมพ์บรรจุภัณฑ์ → บอกว่าเชี่ยวชาญเรื่อง RFQ Packaging โดยเฉพาะ

## Skill Commands ที่ AE อาจถาม
- /list — ดูรายการ RFQ ล่าสุด
- /search [keyword] — ค้นหา RFQ
- /detail [id] — ดูรายละเอียด RFQ
- /customer [name] — ค้นหาลูกค้า
- /paper-types — ดูประเภทกระดาษ
- /box-templates — ดูรูปแบบกล่อง
- /delivery — ดูจังหวัดจัดส่ง

ห้ามสร้างข้อมูลปลอม ห้ามใส่ค่า default โดยไม่บอก AE`;
}

// --- Chat with Pornchai Agent via OpenClaw Gateway ---
app.post('/api/chat', async (req, res) => {
  const { message, conversationId, system, context } = req.body;

  try {
    let masterData;
    try { masterData = await loadMasterDataForPrompt(); } catch {}

    const payload = {
      agentId: AGENT_ID,
      message: message,
      ...(conversationId && { conversationId })
    };

    const looksLikeSpec = serverDetectSpec(message);

    if (context === 'pornchai_agent' && system) {
      // Pornchai AI Agent mode: ใช้ system prompt จาก client (Persona + Guardrails)
      payload.message = `[System]\n${system}\n\n[User]\n${message}`;
      console.log(`[Pornchai Agent] Sending to AI: "${message.substring(0, 50)}..." (system prompt: ${system.length} chars)`);
    } else if (looksLikeSpec && masterData) {
      // Spec mode: inject full spec-parsing system prompt
      const systemPrompt = buildSystemPrompt(masterData);
      payload.message = `${systemPrompt}\n\n---\n\nSpec ที่ต้องแยกข้อมูล:\n${message}\n\n---\nตอบเป็น JSON เท่านั้น:`;
    } else if (masterData) {
      // Conversational mode: inject SOUL.md-based chat prompt
      const chatPrompt = buildChatPrompt(masterData);
      payload.message = `[System]\n${chatPrompt}\n\n[User]\n${message}`;
    }

    // === LLM-First: ใช้ OpenClaw Agent CLI (WebSocket → Claude Opus 4.6) ===
    console.log(`[LLM] Sending to Claude Opus 4.6 via OpenClaw... (${payload.message.length} chars)`);
    const { execSync } = await import('child_process');
    let result = {};
    try {
      // เขียน message ลงไฟล์ชั่วคราว แล้วอ่านผ่าน $(cat file) เพื่อหลีกเลี่ยง shell escaping
      const fs = await import('fs');
      const os = await import('os');
      const tmpPath = await import('path');
      const tmpFile = tmpPath.default.join(os.default.tmpdir(), `pornchai_msg_${Date.now()}.txt`);
      fs.default.writeFileSync(tmpFile, payload.message, 'utf-8');
      // Hybrid Model: chat ใช้ Sonnet (เร็ว), parse-spec ใช้ Opus (แม่นยำ)
      // Hybrid: Chat ใช้ Sonnet (เร็ว+ถูก) / Parse Spec ใช้ Opus (แม่น)
      const agentName = context === 'pornchai_agent' ? 'pornchai-chat' : 'coder';
      const cmd = `openclaw agent --agent ${agentName} --message "$(cat '${tmpFile.replace(/\\/g, '/')}')" --json`;
      let stdout;
      try {
        stdout = execSync(cmd, { timeout: 60000, maxBuffer: 2 * 1024 * 1024, encoding: 'utf-8', shell: 'bash' });
      } finally {
        try { fs.default.unlinkSync(tmpFile); } catch {}
      }
      // Extract JSON from stdout (อาจมี text อื่นปนมา)
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in CLI output: ' + stdout.substring(0, 100));
      const parsed = JSON.parse(jsonMatch[0]);
      const replyText = parsed.result?.payloads?.[0]?.text || '';
      result = { reply: replyText, conversationId: parsed.runId };
      console.log(`[LLM] Response (${parsed.result?.meta?.durationMs || '?'}ms): ${replyText.substring(0, 150)}`);
    } catch (cliErr) {
      console.error(`[LLM] CLI error: ${cliErr.message?.substring(0, 100)}`);
      throw cliErr; // fallback to built-in parser
    }

    const reply = result.reply || result.message || result.text || '';
    const extracted = extractJsonFromReply(reply);

    if (extracted && looksLikeSpec) {
      res.json({
        reply: `วิเคราะห์ spec เรียบร้อยแล้วครับ พบข้อมูลดังนี้:\n- ชื่องาน: ${extracted.job_name || '-'}\n- Components: ${(extracted.components || []).length} รายการ`,
        parsedData: extracted,
        conversationId: result.conversationId
      });
    } else {
      res.json(result);
    }
  } catch (err) {
    // Fallback: built-in parser for spec, or polite error for chat
    const looksLikeSpec = serverDetectSpec(message);

    if (looksLikeSpec) {
      try {
        const parsed = builtInSpecParser(message);
        res.json({
          reply: `[ใช้ Built-in Parser] วิเคราะห์ spec เรียบร้อยแล้วครับ\n- ชื่องาน: ${parsed.job_name || '-'}\n- Components: ${(parsed.components || []).length} รายการ`,
          parsedData: parsed,
        });
        return;
      } catch {}
    }

    res.json({
      reply: `ขออภัยครับ AI Agent ไม่สามารถตอบได้ในขณะนี้\n\nกรุณาลองใหม่อีกครั้ง หรือพิมพ์ spec งานให้ Pornchai AI วิเคราะห์ครับ`,
      error: err.message
    });
  }
});

// --- Direct RFQ Operations (ไม่ผ่าน Agent, สำหรับ UI) ---
app.get('/api/rfq/list', async (req, res) => {
  try {
    const token = await getEstimateToken();
    const limit = parseInt(req.query.limit) || 50;

    // Build search filter from query params
    const search = {};
    if (req.query.job_id) search.job_id = req.query.job_id;
    if (req.query.job_name) search.job_name = req.query.job_name;
    if (req.query.customer_name) search.customer_name = req.query.customer_name;
    if (req.query.ae_name) search.ae_name = req.query.ae_name;
    if (req.query.status_id) search.status_id = req.query.status_id;
    if (req.query.start_date) search.start_date = req.query.start_date;
    if (req.query.end_date) search.end_date = req.query.end_date;

    const body = {
      limit,
      user_group_id: [1],
      sale_group_id: [null],
      est_type: 'packaging'
    };
    if (Object.keys(search).length > 0) body.search = search;

    const result = await fetch(`${ESTIMATE_API}/estimate/list`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(r => r.json());

    const rfqList = result[0]?.map(item => ({
      job_id: item.job_id,
      job_name: item.job_name,
      customer: item.customer_name,
      ae: item.ae_name,
      qty: item.job_qty?.trim(),
      total_price: item.total_price?.trim(),
      unit_price: item.unit_price?.trim(),
      status: item.approve_status,
      created: item.created_datetime,
      is_profit_sharing: item.is_profit_sharing
    })) || [];

    res.json(rfqList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rfq/detail/:id', async (req, res) => {
  try {
    const token = await getEstimateToken();
    const result = await fetch(`${ESTIMATE_API}/estimate/rfq`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rfq_id: req.params.id, type: 'packaging' })
    }).then(r => r.json());

    if (result.job_data) {
      result.job_data = JSON.parse(result.job_data);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Status Log ---
app.get('/api/rfq/status-log/:id', async (req, res) => {
  try {
    const token = await getEstimateToken();
    const result = await fetch(`${ESTIMATE_API}/estimate/rfq/status/log?rfq_id=${req.params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Customer Detail ---
app.get('/api/customer/:id', async (req, res) => {
  try {
    const token = await getEstimateToken();
    const result = await fetch(`${ESTIMATE_API}/estimate/customer?customer_id=${req.params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Health Check ---
app.get('/api/health', async (req, res) => {
  const health = { estimate: false, gateway: false, user: null };

  // Check Estimate API
  try {
    const token = await getEstimateToken();
    if (token) {
      health.estimate = true;
      health.user = cachedUser;
    }
  } catch {}

  // Check OpenClaw Gateway
  try {
    const gwRes = await fetch(`${OPENCLAW_GATEWAY}/health`, {
      headers: { 'Authorization': `Bearer ${OPENCLAW_TOKEN}` },
      signal: AbortSignal.timeout(3000)
    });
    if (gwRes.ok) health.gateway = true;
  } catch {}

  res.json(health);
});

// --- User Login (client-side session) ---
app.post('/api/user/login', async (req, res) => {
  try {
    const result = await fetch(`${ESTIMATE_API}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    }).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Quotation CRUD ---
app.get('/api/quotation/list', async (req, res) => {
  try {
    const token = await getEstimateToken();
    const result = await fetch(`${ESTIMATE_API}/estimate/quotations?rfq_id=${req.query.rfq_id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quotation/save', async (req, res) => {
  try {
    const token = await getEstimateToken();
    const result = await fetch(`${ESTIMATE_API}/estimate/quotations`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    }).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quotation/status', async (req, res) => {
  try {
    const token = await getEstimateToken();
    const result = await fetch(`${ESTIMATE_API}/estimate/quotations/status`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    }).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/quotation/:id', async (req, res) => {
  try {
    const token = await getEstimateToken();
    const result = await fetch(`${ESTIMATE_API}/estimate/quotations/${req.params.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/quotation/history/:id', async (req, res) => {
  try {
    const token = await getEstimateToken();
    const result = await fetch(`${ESTIMATE_API}/estimate/quotations_history?quotation_id=${req.params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- File Upload ---
import { writeFile, mkdir } from 'fs/promises';

const UPLOAD_DIR = join(__dirname, 'public', 'uploads');

app.post('/api/upload', express.raw({ type: '*/*', limit: '20mb' }), async (req, res) => {
  try {
    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${Date.now()}_${req.headers['x-filename'] || 'file'}`;
    const filepath = join(UPLOAD_DIR, filename);
    await writeFile(filepath, req.body);
    res.json({ success: true, filename, url: `/uploads/${filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RFQ Delete ---
app.delete('/api/rfq/:id', async (req, res) => {
  try {
    const token = await getEstimateToken();
    const result = await fetch(`${ESTIMATE_API}/estimate/rfq/${req.params.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MI System Check ---
app.get('/api/rfq/mi-check/:id', async (req, res) => {
  try {
    const token = await getEstimateToken();
    const result = await fetch(`${ESTIMATE_API}/estimate/emp_status?rfq_id=${req.params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// KNOWLEDGE STORE — AI learns from every saved RFQ
// ============================================================
const KNOWLEDGE_PATH = join(__dirname, 'knowledge', 'specs.json');

function loadKnowledge() {
  try {
    if (existsSync(KNOWLEDGE_PATH)) {
      return JSON.parse(readFileSync(KNOWLEDGE_PATH, 'utf8'));
    }
  } catch (e) { console.log('Knowledge load error:', e.message); }
  return [];
}

function saveKnowledge(data) {
  try {
    writeFileSync(KNOWLEDGE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) { console.log('Knowledge save error:', e.message); }
}

// Save: เมื่อ user กด Save RFQ → เก็บ spec + ผลลัพธ์ที่ถูกต้อง
app.post('/api/knowledge/save', (req, res) => {
  try {
    const { spec_text, parsed_data, final_form, job_id, corrections } = req.body;
    if (!spec_text && !final_form) return res.status(400).json({ error: 'No data to save' });

    const knowledge = loadKnowledge();
    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      job_id: job_id || '',
      spec_text: spec_text || '',
      // What AI parsed initially
      ai_parsed: parsed_data || null,
      // What user confirmed/corrected (the "truth")
      final: {
        job_name: final_form?.job_name || '',
        customer: final_form?.customer?.customer_name || '',
        qty: final_form?.qty || [],
        ink_type: final_form?.ink_type || '',
        print_type: final_form?.print_type || '',
        is_diecut: !!final_form?.is_diecut,
        has_multi_f: !!final_form?.has_multi_f,
        components: (final_form?.components || []).map(c => ({
          component_name: c.component_name || '',
          component_type: parseInt(c.component_type) || 1,
          box_type_id: String(c.box_type?.type_id || c.box_type_id || ''),
          box_type_name: String(c.box_type?.type_name || c.box_type_name || ''),
          glued_spot: parseInt(c.box_type?.glued_spot) || 0,
          paper_code: String(c.paper?.paper_code || c.paper_code || ''),
          paper_gram: String(c.paper?.paper_gram || c.paper_gram || ''),
          paper_source: String(c.paper?.paper_name || c.paper_source || ''),
          paper_cost: String(c.paper?.paper_cost || ''),
          paper_markup: String(c.paper?.paper_markup || ''),
          color_out: String(c.color?.outside ?? c.color_out ?? ''),
          color_in: String(c.color?.inside ?? c.color_in ?? '0'),
          is_special_ink: !!c.color?.is_special_ink,
          size_w: String(c.packaging_size?.width || c.size_w || ''),
          size_l: String(c.packaging_size?.length || c.size_l || ''),
          size_d: String(c.packaging_size?.depth || c.size_d || ''),
          glue_flap: String(c.packaging_size?.glue_flap || '15'),
          tuck_flap: String(c.packaging_size?.tuck_flap || '15'),
          dust_flap: String(c.packaging_size?.dust_flap || ''),
          // Corrugated detail
          corrugated_flute: c.corrugated?.flute_type || '',
          corrugated_layer: parseInt(c.corrugated?.layer) || 0,
          corrugated_grade: c.corrugated?.grade?.join?.('/') || '',
          // Addons with full detail
          addon: (c.addon || []).map(a => {
            if (typeof a === 'string') return a;
            const detail = a.info?.type || a.info?.code || '';
            const name = a.info?.name || a.name || '';
            const side = a.info?.side || 1;
            return `${a.type}:${detail} ${name} ${side}s`.trim();
          }),
          packing: c.packing_detail || (c._pk_kraftwrap ? 'kraftwrap' : '') + (c._pk_paperband ? ',paperband' : '') + (c._pk_carton ? ',carton' : '') + (c._pk_pallet ? ',pallet' : '') || '',
          block_cost: c.block_cost || '',
        })),
        delivery: final_form?.delivery?.[0]?.destinationName || final_form?.delivery || '',
      },
      // Fields that user corrected (AI got wrong)
      corrections: corrections || [],
    };

    knowledge.push(entry);

    // Keep last 1000 entries max
    if (knowledge.length > 1000) knowledge.splice(0, knowledge.length - 1000);

    saveKnowledge(knowledge);
    console.log(`Knowledge saved: ${entry.job_id || 'new'} (total: ${knowledge.length})`);
    res.json({ success: true, total: knowledge.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Search: ค้นหา spec คล้ายๆ จาก Knowledge Store
app.get('/api/knowledge/search', (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    if (!q) return res.json([]);

    const knowledge = loadKnowledge();
    const query = q.toLowerCase();
    const words = query.split(/[\s,/]+/).filter(w => w.length > 1);

    // Score each entry by keyword match
    const scored = knowledge.map(entry => {
      const searchText = [
        entry.spec_text,
        entry.final.job_name,
        entry.final.customer,
        ...(entry.final.components || []).map(c => [c.component_name, c.paper_code, c.box_type_name, c.packing].join(' ')),
      ].join(' ').toLowerCase();

      let score = 0;
      for (const w of words) {
        if (searchText.includes(w)) score += 1;
      }
      return { entry, score };
    }).filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit));

    res.json(scored.map(s => ({ ...s.entry, _score: s.score })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Stats: ดูสถิติ Knowledge Store
app.get('/api/knowledge/stats', (req, res) => {
  try {
    const knowledge = loadKnowledge();
    const boxTypes = {};
    const paperCodes = {};
    knowledge.forEach(k => {
      (k.final.components || []).forEach(c => {
        if (c.box_type_name) boxTypes[c.box_type_name] = (boxTypes[c.box_type_name] || 0) + 1;
        if (c.paper_code) paperCodes[c.paper_code] = (paperCodes[c.paper_code] || 0) + 1;
      });
    });
    res.json({
      total: knowledge.length,
      box_types: Object.entries(boxTypes).sort((a, b) => b[1] - a[1]),
      paper_codes: Object.entries(paperCodes).sort((a, b) => b[1] - a[1]),
      latest: knowledge.slice(-5).map(k => ({ date: k.date, job: k.final.job_name, id: k.job_id })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// CORRECTIONS STORE — AI Learning จาก field ที่ user แก้
// แยกจาก knowledge store เพื่อ query เร็ว + จัดเป็น pattern
// ============================================================
const CORRECTIONS_PATH = join(__dirname, 'knowledge', 'corrections.json');

function loadCorrections() {
  try {
    if (existsSync(CORRECTIONS_PATH)) {
      return JSON.parse(readFileSync(CORRECTIONS_PATH, 'utf8'));
    }
  } catch (e) { console.log('Corrections load error:', e.message); }
  return { patterns: [], total: 0, updated: '' };
}

function saveCorrections(data) {
  try {
    writeFileSync(CORRECTIONS_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) { console.log('Corrections save error:', e.message); }
}

// Extract distinctive keywords from spec text (ignore common words)
function extractSpecKeywords(text) {
  if (!text) return [];
  const STOP = new Set(['และ','หรือ','ของ','กับ','การ','ที่','ใน','เป็น','ครับ','ค่ะ','สี','กล่อง','box','the','and','or','for','with','a','an','of','in','to','is']);
  return [...new Set(
    text.toLowerCase()
      .replace(/[^\u0E00-\u0E7Fa-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !STOP.has(w))
  )].slice(0, 30);
}

// Save a single correction pattern
// Body: { spec_text, field, ai_value, user_value, context }
app.post('/api/corrections/add', (req, res) => {
  try {
    const { spec_text, field, ai_value, user_value, context } = req.body;
    if (!field || ai_value === undefined || user_value === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (String(ai_value).trim() === String(user_value).trim()) {
      return res.json({ success: false, reason: 'no change' });
    }

    const store = loadCorrections();
    const keywords = extractSpecKeywords(spec_text || '');

    // หา pattern เดิมที่ field+ai_value+user_value เหมือนกัน
    const existing = store.patterns.find(p =>
      p.field === field &&
      String(p.ai_value) === String(ai_value) &&
      String(p.user_value) === String(user_value)
    );

    if (existing) {
      existing.count = (existing.count || 1) + 1;
      existing.last_seen = new Date().toISOString();
      const merged = new Set([...(existing.keywords || []), ...keywords]);
      existing.keywords = [...merged].slice(0, 50);
    } else {
      store.patterns.push({
        id: Date.now(),
        field,
        ai_value: String(ai_value),
        user_value: String(user_value),
        keywords,
        context: context || '',
        count: 1,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      });
    }

    store.patterns.sort((a, b) => (b.count || 1) - (a.count || 1));
    if (store.patterns.length > 500) store.patterns = store.patterns.slice(0, 500);

    store.total = store.patterns.length;
    store.updated = new Date().toISOString();
    saveCorrections(store);

    console.log(`[Correction] ${field}: "${ai_value}" → "${user_value}" (×${existing?.count || 1})`);
    res.json({ success: true, total: store.total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Find correction patterns relevant to current spec text
function findRelevantCorrections(specText, limit) {
  limit = limit || 10;
  const store = loadCorrections();
  if (!store.patterns || store.patterns.length === 0) return [];
  const words = extractSpecKeywords(specText);
  if (words.length === 0) return store.patterns.slice(0, limit);

  const scored = store.patterns.map(p => {
    const overlap = (p.keywords || []).filter(k => words.includes(k)).length;
    const score = overlap * 2 + Math.log(p.count || 1);
    return { p, score, overlap };
  }).filter(s => s.overlap > 0 || (s.p.count || 1) >= 3);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.p);
}

// GET endpoint: retrieve correction patterns
app.get('/api/corrections/list', (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const store = loadCorrections();
    if (!q) return res.json({ total: store.total, patterns: store.patterns.slice(0, parseInt(limit)) });
    const matched = findRelevantCorrections(q, parseInt(limit));
    res.json({ total: matched.length, patterns: matched });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Apply learned corrections to parsed data (auto-fix common AI mistakes)
function applyLearnedCorrections(parsed, specText) {
  if (!parsed || !specText) return { parsed, applied: [] };
  const relevant = findRelevantCorrections(specText, 20);
  const applied = [];

  relevant.forEach(p => {
    if ((p.count || 1) < 2) return; // High-confidence only

    const c0 = parsed.components && parsed.components[0];
    let fixed = false;

    switch (p.field) {
      case 'paper_code':
        if (c0 && c0.paper && c0.paper.paper_code === p.ai_value) {
          c0.paper.paper_code = p.user_value;
          fixed = true;
        }
        break;
      case 'paper_gram':
        if (c0 && c0.paper && String(c0.paper.paper_gram) === String(p.ai_value)) {
          c0.paper.paper_gram = p.user_value;
          fixed = true;
        }
        break;
      case 'box_type':
        if (c0 && String(c0.box_type_id || (c0.box_type && c0.box_type.type_id)) === String(p.ai_value)) {
          c0.box_type_id = p.user_value;
          if (c0.box_type) c0.box_type.type_id = p.user_value;
          fixed = true;
        }
        break;
      case 'color_out':
        if (c0 && c0.color && String(c0.color.outside) === String(p.ai_value)) {
          c0.color.outside = p.user_value;
          fixed = true;
        }
        break;
      case 'ink_type':
        if (parsed.ink_type === p.ai_value) {
          parsed.ink_type = p.user_value;
          fixed = true;
        }
        break;
    }

    if (fixed) applied.push({ field: p.field, from: p.ai_value, to: p.user_value, count: p.count });
  });

  return { parsed, applied };
}

// Build correction context for LLM prompt
function buildCorrectionContext(specText) {
  const relevant = findRelevantCorrections(specText, 5);
  if (relevant.length === 0) return '';
  let ctx = '\n\n## บทเรียนจาก Corrections เก่า (User เคยแก้ AI ใน field เหล่านี้)\n';
  ctx += 'ระวัง! อย่าทำผิดซ้ำในเคสคล้ายๆ กัน:\n';
  relevant.forEach((p, i) => {
    ctx += `${i + 1}. field "${p.field}": AI เคยตอบ "${p.ai_value}" แต่ที่ถูกคือ "${p.user_value}" (ผิดมาแล้ว ${p.count || 1} ครั้ง)\n`;
  });
  return ctx;
}

// --- Brain Stats: aggregate all master data for AI Brain visualization ---
app.get('/api/brain/stats', (req, res) => {
  try {
    const load = (type) => { try { return loadLocalMasterData(type) || []; } catch { return []; } };

    const paperInfo = load('paper_info');
    const coatingInfo = load('coating_info');
    const foilInfo = load('foilstamp_info');
    const boxInfo = load('boxtemplate_info');
    const processInfo = load('process_type');
    const machineStd = load('machine_std_paper_info');
    const corrugated = load('corrugated_info');
    const exchangeRate = load('exchange_rate');
    const priceInfo = load('price_info');
    const wasteInfo = load('waste_info');
    const blockstamp = load('blockstamp_info');
    const blockdiecut = load('blockdiecut_info');
    const specialink = load('specialink_info');
    const delivery = load('delivery_rate_info');

    // Paper: group by code
    const paperCodes = {};
    paperInfo.forEach(p => { if (p.paper_code) paperCodes[p.paper_code] = (paperCodes[p.paper_code] || 0) + 1; });
    const paperBrands = {};
    paperInfo.forEach(p => { if (p.brand) paperBrands[p.brand] = (paperBrands[p.brand] || 0) + 1; });
    const gsms = paperInfo.map(p => p.gram).filter(Boolean);

    // Coating: group by type
    const coatingTypes = {};
    coatingInfo.forEach(c => { const k = c.coating_type || c.coating_code; if (k) coatingTypes[k] = (coatingTypes[k] || 0) + 1; });

    // Foil: group by color
    const foilColors = {};
    foilInfo.forEach(f => { if (f.color_th) foilColors[f.color_th] = (foilColors[f.color_th] || 0) + 1; });

    // Machine: unique types
    const machineTypes = {};
    machineStd.forEach(m => { const k = 'Type ' + m.machineSize_type; machineTypes[k] = (machineTypes[k] || 0) + 1; });

    // Corrugated: group by flute
    const corrFlutes = {};
    corrugated.forEach(c => { const k = c.flute_type || c.corrugated_type || 'Other'; corrFlutes[k] = (corrFlutes[k] || 0) + 1; });

    res.json({
      total_records: paperInfo.length + coatingInfo.length + foilInfo.length + machineStd.length + corrugated.length + priceInfo.length + wasteInfo.length + blockstamp.length + delivery.length,
      paper: {
        total: paperInfo.length,
        codes: Object.entries(paperCodes).sort((a, b) => b[1] - a[1]),
        brands: Object.entries(paperBrands).sort((a, b) => b[1] - a[1]),
        gsm_range: gsms.length ? [Math.min(...gsms), Math.max(...gsms)] : [0, 0],
      },
      coating: {
        total: coatingInfo.length,
        types: Object.entries(coatingTypes).sort((a, b) => b[1] - a[1]),
      },
      foil: {
        total: foilInfo.length,
        colors: Object.entries(foilColors).sort((a, b) => b[1] - a[1]),
      },
      box: {
        total: boxInfo.length,
        templates: boxInfo.map(b => [b.type_name || b.name || '', b.type_name_th || '']),
      },
      machine: {
        total: machineStd.length,
        types: Object.entries(machineTypes).sort((a, b) => b[1] - a[1]),
      },
      process: {
        total: Array.isArray(processInfo) ? processInfo.length : 0,
        list: (Array.isArray(processInfo) ? processInfo : []).map(p => p.process_type_name || p.process_name || ''),
      },
      corrugated: { total: corrugated.length, flutes: Object.entries(corrFlutes).sort((a, b) => b[1] - a[1]) },
      exchange_rate: exchangeRate,
      delivery: { total: delivery.length },
      blockstamp: { total: blockstamp.length },
      blockdiecut: { total: blockdiecut.length },
      specialink: { total: specialink.length },
      price_tiers: { total: priceInfo.length },
      waste_tiers: { total: wasteInfo.length },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// PATTERN MATCH ENGINE — หางานเก่าที่คล้าย → แนะนำค่าฟอร์ม
// ============================================================

app.post('/api/pattern-match', (req, res) => {
  try {
    const { component } = req.body;
    if (!component) return res.json({ matches: [], suggestions: {} });

    const knowledge = loadKnowledge();
    if (knowledge.length === 0) return res.json({ matches: [], suggestions: {} });

    const inputPaper = (component.paper_code || '').toLowerCase();
    const inputGram = String(component.paper_gram || '');
    const inputBoxType = String(component.box_type_id || '');
    const inputCompType = parseInt(component.component_type) || 1;
    const inputName = (component.component_name || '').toLowerCase();
    const inputColorOut = String(component.color_outside || component.color_out || '');
    const inputSizeW = parseFloat(component.size_w || component.packaging_size?.width || 0);
    const inputSizeL = parseFloat(component.size_l || component.packaging_size?.length || 0);
    const inputJobName = (component.job_name || '').toLowerCase();

    // Score each record
    const scored = [];
    for (const k of knowledge) {
      const comps = k.final?.components || [];
      for (const c of comps) {
        let score = 0;
        const reasons = [];

        // Paper code match (strong signal)
        if (inputPaper && c.paper_code?.toLowerCase() === inputPaper) {
          score += 30; reasons.push('paper_code');
        } else if (inputPaper && c.paper_code?.toLowerCase().startsWith(inputPaper.substring(0, 2))) {
          score += 10; reasons.push('paper_family');
        }

        // Paper gram match
        if (inputGram && String(c.paper_gram) === inputGram) {
          score += 15; reasons.push('paper_gram');
        }

        // Box type match (very strong)
        if (inputBoxType && String(c.box_type_id) === inputBoxType) {
          score += 40; reasons.push('box_type');
        }

        // Component type match
        if (inputCompType === parseInt(c.component_type || 1)) {
          score += 10; reasons.push('comp_type');
        }

        // Component name similarity
        if (inputName && c.component_name?.toLowerCase().includes(inputName)) {
          score += 15; reasons.push('comp_name');
        }

        // Color match
        if (inputColorOut && String(c.color_out) === inputColorOut) {
          score += 10; reasons.push('color');
        }

        // Size similarity (within 30% range)
        if (inputSizeW > 0 && c.size_w) {
          const ratio = Math.abs(parseFloat(c.size_w) - inputSizeW) / Math.max(inputSizeW, 1);
          if (ratio < 0.1) { score += 15; reasons.push('size_exact'); }
          else if (ratio < 0.3) { score += 5; reasons.push('size_close'); }
        }

        // Job name keyword match
        if (inputJobName) {
          const words = inputJobName.split(/[\s,/]+/).filter(w => w.length > 2);
          const jobText = (k.final?.job_name || '').toLowerCase();
          const matched = words.filter(w => jobText.includes(w)).length;
          if (matched >= 3) { score += 20; reasons.push('job_name_strong'); }
          else if (matched >= 1) { score += 5; reasons.push('job_name_weak'); }
        }

        if (score >= 20) {
          scored.push({
            score,
            reasons,
            job_id: k.job_id,
            job_name: k.final?.job_name,
            component: c,
          });
        }
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const topMatches = scored.slice(0, 10);

    // Build suggestions from top matches (majority vote)
    const suggestions = {};
    if (topMatches.length >= 2) {
      // Box type suggestion
      if (!inputBoxType || inputBoxType === '12') {
        const btVotes = {};
        topMatches.forEach(m => {
          const bt = m.component.box_type_id;
          if (bt && bt !== '12') btVotes[bt] = (btVotes[bt] || 0) + m.score;
        });
        const bestBt = Object.entries(btVotes).sort((a, b) => b[1] - a[1])[0];
        if (bestBt) {
          const total = Object.values(btVotes).reduce((s, v) => s + v, 0);
          suggestions.box_type_id = bestBt[0];
          suggestions.box_type_name = topMatches.find(m => String(m.component.box_type_id) === bestBt[0])?.component.box_type_name;
          suggestions.box_type_confidence = bestBt[1] / total;
        }
      }

      // Addon suggestions (most common addons in matching jobs)
      const addonVotes = {};
      topMatches.forEach(m => {
        (m.component.addon || []).forEach(a => {
          const key = typeof a === 'string' ? a : a.type || '';
          if (key) addonVotes[key] = (addonVotes[key] || 0) + 1;
        });
      });
      suggestions.common_addons = Object.entries(addonVotes)
        .filter(([, v]) => v >= 2)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ addon: k, count: v, percent: Math.round(v / topMatches.length * 100) }));

      // Packing suggestions
      const packVotes = {};
      topMatches.forEach(m => {
        const pk = m.component.packing;
        if (pk) packVotes[pk] = (packVotes[pk] || 0) + 1;
      });
      suggestions.common_packing = Object.entries(packVotes)
        .filter(([, v]) => v >= 2)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => ({ packing: k, count: v }));

      // Corrugated suggestion (for component_type 2/3)
      const corrVotes = {};
      topMatches.forEach(m => {
        const cf = m.component.corrugated_flute;
        const cl = m.component.corrugated_layer;
        const cg = m.component.corrugated_grade;
        if (cf) {
          const key = `${cf}|${cl}|${cg}`;
          corrVotes[key] = (corrVotes[key] || 0) + 1;
        }
      });
      const bestCorr = Object.entries(corrVotes).sort((a, b) => b[1] - a[1])[0];
      if (bestCorr && bestCorr[1] >= 2) {
        const [flute, layer, grade] = bestCorr[0].split('|');
        suggestions.corrugated = { flute_type: flute, layer: parseInt(layer) || 3, grade, count: bestCorr[1] };
      }

      // Paper cost suggestion
      const costVotes = {};
      topMatches.forEach(m => {
        const cost = m.component.paper_cost;
        const markup = m.component.paper_markup;
        if (cost) costVotes[cost + '|' + markup] = (costVotes[cost + '|' + markup] || 0) + 1;
      });
      const bestCost = Object.entries(costVotes).sort((a, b) => b[1] - a[1])[0];
      if (bestCost && bestCost[1] >= 2) {
        const [cost, markup] = bestCost[0].split('|');
        suggestions.paper = { cost, markup, count: bestCost[1] };
      }
    }

    res.json({
      matches: topMatches.map(m => ({
        score: m.score,
        reasons: m.reasons,
        job_id: m.job_id,
        job_name: m.job_name,
        component_type: m.component.component_type,
        box_type: m.component.box_type_id + ' - ' + (m.component.box_type_name || ''),
        paper: m.component.paper_code + ' ' + m.component.paper_gram + 'gsm',
        paper_cost: m.component.paper_cost,
        paper_markup: m.component.paper_markup,
        corrugated: m.component.corrugated_flute ? `${m.component.corrugated_flute} ${m.component.corrugated_layer}ชั้น ${m.component.corrugated_grade}` : '',
        color: m.component.color_out + '/' + m.component.color_in,
        addon: m.component.addon,
        packing: m.component.packing,
      })),
      suggestions,
      total_searched: knowledge.length,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// RAG — Document Knowledge Store
// Upload Excel/PDF/Word/Text → Extract → Chunk → Store → Search
// ============================================================

const RAG_FILE = join(__dirname, 'knowledge', 'documents.json');
const RAG_UPLOAD_DIR = join(__dirname, 'public', 'uploads', 'rag');

function loadDocuments() {
  try { return existsSync(RAG_FILE) ? JSON.parse(readFileSync(RAG_FILE, 'utf8')) : []; }
  catch { return []; }
}
function saveDocuments(docs) {
  writeFileSync(RAG_FILE, JSON.stringify(docs, null, 2), 'utf8');
}

// Initialize upload dir
try { mkdirSync(RAG_UPLOAD_DIR, { recursive: true }); } catch {}

// --- File Extractors ---

async function extractExcel(buffer, filename) {
  // Use dynamic import for xlsx (SheetJS) — works in ESM
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const chunks = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (jsonData.length === 0) continue;

    // Each row becomes a chunk with all column data
    const headers = Object.keys(jsonData[0]);
    jsonData.forEach((row, ri) => {
      const text = headers.map(h => `${h}: ${row[h]}`).join(' | ');
      chunks.push({
        text,
        metadata: { filename, sheet: sheetName, row: ri + 2, headers },
        data: row, // keep structured data for price lookups
      });
    });

    // Also store summary chunk for the sheet
    chunks.push({
      text: `[Sheet: ${sheetName}] ${jsonData.length} rows, columns: ${headers.join(', ')}`,
      metadata: { filename, sheet: sheetName, type: 'summary', row_count: jsonData.length, headers },
      data: null,
    });
  }
  return chunks;
}

async function extractPDF(buffer, filename) {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  const pages = data.text.split(/\f|\n{3,}/); // split by page breaks
  return pages.filter(p => p.trim()).map((page, i) => ({
    text: page.trim().substring(0, 2000), // limit chunk size
    metadata: { filename, page: i + 1, type: 'pdf_page' },
    data: null,
  }));
}

async function extractWord(buffer, filename) {
  const mammoth = (await import('mammoth')).default;
  const result = await mammoth.extractRawText({ buffer });
  const paragraphs = result.value.split(/\n{2,}/);
  return paragraphs.filter(p => p.trim()).map((para, i) => ({
    text: para.trim().substring(0, 2000),
    metadata: { filename, paragraph: i + 1, type: 'word_paragraph' },
    data: null,
  }));
}

function extractText(buffer, filename) {
  const text = buffer.toString('utf8');
  const lines = text.split(/\n{2,}/);
  return lines.filter(l => l.trim()).map((line, i) => ({
    text: line.trim().substring(0, 2000),
    metadata: { filename, line: i + 1, type: 'text_block' },
    data: null,
  }));
}

// --- RAG API Endpoints ---

// Upload document → extract → store
app.post('/api/rag/upload', express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
  try {
    const filename = decodeURIComponent(req.headers['x-filename'] || 'unknown');
    const category = req.headers['x-category'] || 'general';
    const description = decodeURIComponent(req.headers['x-description'] || '');
    const buffer = req.body;

    if (!buffer || buffer.length === 0) return res.status(400).json({ error: 'No file data' });

    const ext = filename.split('.').pop().toLowerCase();
    let chunks = [];

    // Extract based on file type
    if (['xlsx', 'xls', 'csv'].includes(ext)) {
      chunks = await extractExcel(buffer, filename);
    } else if (ext === 'pdf') {
      chunks = await extractPDF(buffer, filename);
    } else if (['doc', 'docx'].includes(ext)) {
      chunks = await extractWord(buffer, filename);
    } else if (['txt', 'md', 'csv'].includes(ext)) {
      chunks = extractText(buffer, filename);
    } else {
      return res.status(400).json({ error: `Unsupported file type: .${ext}` });
    }

    if (chunks.length === 0) return res.status(400).json({ error: 'No data extracted from file' });

    // Save to knowledge store
    const docs = loadDocuments();
    const docId = 'doc_' + Date.now();
    const doc = {
      id: docId,
      filename,
      category,
      description,
      file_type: ext,
      chunk_count: chunks.length,
      uploaded_at: new Date().toISOString(),
      chunks,
    };
    docs.push(doc);

    // Limit total documents
    if (docs.length > 100) docs.splice(0, docs.length - 100);
    saveDocuments(docs);

    // Save original file
    const savePath = join(RAG_UPLOAD_DIR, docId + '.' + ext);
    writeFileSync(savePath, buffer);

    res.json({
      success: true,
      id: docId,
      filename,
      chunks_extracted: chunks.length,
      category,
      // Show sample data for verification
      sample: chunks.slice(0, 3).map(c => c.text.substring(0, 200)),
    });
  } catch (e) {
    console.error('RAG upload error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Search documents
app.get('/api/rag/search', (req, res) => {
  try {
    const query = (req.query.q || '').toLowerCase().trim();
    const category = req.query.category || '';
    const limit = parseInt(req.query.limit) || 20;

    if (!query) return res.json({ results: [] });

    const docs = loadDocuments();
    const words = query.split(/[\s,/]+/).filter(w => w.length > 1);
    const results = [];

    for (const doc of docs) {
      if (category && doc.category !== category) continue;

      for (const chunk of doc.chunks) {
        const chunkText = (chunk.text || '').toLowerCase();
        const chunkDataStr = chunk.data ? JSON.stringify(chunk.data).toLowerCase() : '';
        const searchIn = chunkText + ' ' + chunkDataStr;

        // Score: count matching words
        const score = words.filter(w => searchIn.includes(w)).length;
        if (score >= 1) {
          results.push({
            score,
            text: chunk.text,
            data: chunk.data,
            metadata: { ...chunk.metadata, doc_id: doc.id, category: doc.category },
          });
        }
      }
    }

    results.sort((a, b) => b.score - a.score);
    res.json({ results: results.slice(0, limit), total: results.length, query });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Search specifically for price data (structured)
app.get('/api/rag/price', (req, res) => {
  try {
    const paperCode = (req.query.paper_code || '').trim();
    const gram = (req.query.gram || '').trim();
    const category = req.query.category || 'price';

    const docs = loadDocuments();
    const matches = [];

    for (const doc of docs) {
      if (category && doc.category !== category) continue;

      for (const chunk of doc.chunks) {
        if (!chunk.data) continue;
        const d = chunk.data;
        const dataStr = JSON.stringify(d).toLowerCase();

        // Match paper code (fuzzy)
        const codeMatch = paperCode && Object.values(d).some(v =>
          String(v).toLowerCase().includes(paperCode.toLowerCase())
        );
        const gramMatch = gram && Object.values(d).some(v => String(v) === gram);

        if (codeMatch || gramMatch) {
          matches.push({
            data: d,
            metadata: chunk.metadata,
            code_match: codeMatch,
            gram_match: gramMatch,
            score: (codeMatch ? 2 : 0) + (gramMatch ? 2 : 0),
          });
        }
      }
    }

    matches.sort((a, b) => b.score - a.score);
    res.json({ results: matches.slice(0, 10), total: matches.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List all documents
app.get('/api/rag/list', (req, res) => {
  try {
    const docs = loadDocuments();
    res.json(docs.map(d => ({
      id: d.id,
      filename: d.filename,
      category: d.category,
      description: d.description,
      file_type: d.file_type,
      chunk_count: d.chunk_count,
      uploaded_at: d.uploaded_at,
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete document
app.delete('/api/rag/:id', (req, res) => {
  try {
    const docs = loadDocuments();
    const idx = docs.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    const removed = docs.splice(idx, 1)[0];
    saveDocuments(docs);

    // Delete file
    const filePath = join(RAG_UPLOAD_DIR, removed.id + '.' + removed.file_type);
    try { import('fs').then(fs => fs.unlinkSync(filePath)); } catch {}

    res.json({ success: true, deleted: removed.filename });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// RAG stats
app.get('/api/rag/stats', (req, res) => {
  try {
    const docs = loadDocuments();
    const byCategory = {};
    docs.forEach(d => { byCategory[d.category] = (byCategory[d.category] || 0) + 1; });
    const totalChunks = docs.reduce((s, d) => s + (d.chunk_count || 0), 0);
    res.json({ documents: docs.length, chunks: totalChunks, categories: byCategory });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Pornchai RFQ Web App running at http://localhost:${PORT}`);
  console.log(`OpenClaw Gateway: ${OPENCLAW_GATEWAY}`);
  console.log(`Estimate API: ${ESTIMATE_API}`);
  // Pre-load employee cache so first search is instant
  loadEmployeeCache().then(() => console.log('Employee cache pre-loaded')).catch(() => {});
});
