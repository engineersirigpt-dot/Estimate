/**
 * Master Data Fetcher
 * Run this script when connected to Sirivatana network (192.168.5.3 accessible)
 *
 * Usage: cd webapp && node knowledge/legacy_system/master_data/fetch_master_data.js
 */

const fs = require('fs');
const path = require('path');

const ESTIMATE_API = 'http://192.168.5.3:3010';
const EST_USER = '2690006';
const EST_PASS = 'golfthefa9';
const OUTPUT_DIR = __dirname;

// All 22 master data types from the legacy system
const MASTER_DATA_TYPES = [
  { type: 'paper_info&estimate_type=packaging', filename: 'paper_info_live.json' },
  { type: 'coating_info&estimate_type=packaging', filename: 'coating_info_live.json' },
  { type: 'corrugated_info&estimate_type=packaging', filename: 'corrugated_info_live.json' },
  { type: 'foilstamp_info', filename: 'foilstamp_info_live.json' },
  { type: 'blockstamp_info', filename: 'blockstamp_info_live.json' },
  { type: 'price_info', filename: 'price_info_live.json' },
  { type: 'min_price_info', filename: 'min_price_info_live.json' },
  { type: 'waste_info', filename: 'waste_info_live.json' },
  { type: 'blockdiecut_info', filename: 'blockdiecut_info_live.json' },
  { type: 'boxtemplate_info', filename: 'boxtemplate_info_live.json' },
  { type: 'specialink_info', filename: 'specialink_info_live.json' },
  { type: 'specialink_factor_info', filename: 'specialink_factor_info_live.json' },
  { type: 'jetpress_waste_info', filename: 'jetpress_waste_info_live.json' },
  { type: 'jetpress_info', filename: 'jetpress_info_live.json' },
  { type: 'marking_price_info', filename: 'marking_price_info_live.json' },
  { type: 'machine_std_paper_info', filename: 'machine_std_paper_info_live.json' },
  { type: 'delivery_rate_info', filename: 'delivery_rate_info_live.json' },
  { type: 'paper_code_type', filename: 'paper_code_type_live.json' },
  { type: 'process_type', filename: 'process_type_live.json' },
  { type: 'price_type', filename: 'price_type_live.json' },
  { type: 'konica_waste_info', filename: 'konica_waste_info_live.json' },
  { type: 'exchange_rate', filename: 'exchange_rate_live.json' },
];

// Additional endpoints to try
const EXTRA_ENDPOINTS = [
  { url: '/estimate/list', filename: 'sample_rfq_list.json', method: 'GET' },
  // { url: '/estimate/rfq', filename: 'sample_rfq_detail.json', method: 'POST', body: { type: 'estimate', rfq_id: 'E26030017' } },
];

async function getToken() {
  const res = await fetch(`${ESTIMATE_API}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: EST_USER, password: EST_PASS })
  });
  const data = await res.json();
  console.log('Login result:', data.accessToken ? 'SUCCESS' : 'FAILED');
  return data.accessToken;
}

async function fetchData(token, type) {
  const url = `${ESTIMATE_API}/estimate/master_data?type=${type}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await res.json();
}

async function main() {
  console.log('=== Master Data Fetcher ===');
  console.log(`API: ${ESTIMATE_API}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log('');

  // Test connectivity
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 5000);
    await fetch(`${ESTIMATE_API}`, { signal: ctrl.signal });
  } catch (e) {
    console.error('ERROR: Cannot reach Estimate API at ' + ESTIMATE_API);
    console.error('Make sure you are connected to Sirivatana network.');
    process.exit(1);
  }

  // Get auth token
  const token = await getToken();
  if (!token) {
    console.error('ERROR: Failed to get auth token');
    process.exit(1);
  }

  // Fetch all master data types
  const summary = {};
  for (const { type, filename } of MASTER_DATA_TYPES) {
    try {
      console.log(`Fetching ${type}...`);
      const data = await fetchData(token, type);
      const filepath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');

      const count = Array.isArray(data) ? data.length : (data?.data?.length || 'object');
      console.log(`  -> ${count} records -> ${filename}`);

      summary[type] = {
        filename,
        records: count,
        sample: Array.isArray(data) ? data.slice(0, 2) : data,
        keys: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : []
      };
    } catch (e) {
      console.error(`  ERROR: ${e.message}`);
      summary[type] = { error: e.message };
    }
  }

  // Fetch extra endpoints
  for (const { url, filename, method, body } of EXTRA_ENDPOINTS) {
    try {
      console.log(`Fetching ${url}...`);
      const opts = {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      if (body) opts.body = JSON.stringify(body);

      const res = await fetch(`${ESTIMATE_API}${url}`, opts);
      const data = await res.json();
      const filepath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`  -> saved to ${filename}`);
    } catch (e) {
      console.error(`  ERROR: ${e.message}`);
    }
  }

  // Write summary
  const summaryPath = path.join(OUTPUT_DIR, 'fetch_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    fetched_at: new Date().toISOString(),
    api: ESTIMATE_API,
    types: summary
  }, null, 2), 'utf-8');

  console.log('');
  console.log('=== Done! Summary saved to fetch_summary.json ===');
}

main().catch(console.error);
