// ============================================================
// Import Knowledge from Legacy RFQ System
// ดึง RFQ ที่ Approve แล้วทั้งหมด → เก็บเป็น Knowledge Store
// Usage: node import-knowledge.js
// ============================================================

const BASE = 'http://localhost:3080';

async function main() {
  console.log('=== Importing Knowledge from Legacy RFQ System ===\n');

  // Step 1: Get all RFQs
  console.log('Fetching RFQ list...');
  const listRes = await fetch(`${BASE}/api/rfq/list?limit=500`);
  const allRFQs = await listRes.json();
  const list = Array.isArray(allRFQs) ? allRFQs : allRFQs.data || [];

  // Filter only Approved
  const approved = list.filter(d => d.status === 'Approve');
  console.log(`Found ${list.length} total RFQs, ${approved.length} Approved\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const rfq of approved) {
    try {
      // Step 2: Get detail for each RFQ
      const detailRes = await fetch(`${BASE}/api/rfq/detail/${rfq.job_id}`);
      const detail = await detailRes.json();
      const jd = detail.job_data || detail;
      const job = jd.job || {};
      const comps = jd.component1 || [];
      const customer = jd.customer || {};
      const ae = jd.ae || {};
      const qty = jd.qty || {};
      const delivery = jd.delivery || [];

      // Skip if no components
      if (comps.length === 0) {
        console.log(`  ⊘ ${rfq.job_id} - ${rfq.job_name} (no components, skip)`);
        skipped++;
        continue;
      }

      // Step 3: Build knowledge entry
      const components = comps.map(c => {
        const color = c.color?.[0] || {};
        const paper = c.paper || {};
        const boxType = c.box_type || {};
        const size = c.packaging_size || {};
        const compType = typeof c.component_type === 'object' ? c.component_type?.type : c.component_type;
        return {
          component_name: c.component_name || '',
          box_type_id: String(boxType.type_id || ''),
          box_type_name: String(boxType.type_name || ''),
          paper_code: String(paper.paper_code || ''),
          paper_gram: String(paper.paper_gram || ''),
          paper_source: String(paper.paper_name || ''),
          color_out: String(color.outside ?? ''),
          color_in: String(color.inside ?? '0'),
          size_w: String(size.width || ''),
          size_l: String(size.length || ''),
          size_d: String(size.depth || ''),
          addon: (c.addon || []).map(a => a.type + ':' + (a.name || a.info?.name || '')),
          packing: '',
          component_type: compType || 1,
        };
      });

      const entry = {
        spec_text: '', // ระบบเก่าไม่มี spec text ต้นฉบับ
        parsed_data: null,
        final_form: {
          job_name: job.job_name || rfq.job_name || '',
          customer: customer.customer_name || rfq.customer || '',
          qty: qty.main || [],
          ink_type: job.ink_type || '',
          print_type: job.print_type || '',
          components,
          delivery: delivery[0]?.destinationName || '',
        },
        job_id: rfq.job_id,
      };

      // Step 4: Save to Knowledge Store
      const saveRes = await fetch(`${BASE}/api/knowledge/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      const saveResult = await saveRes.json();

      if (saveResult.success) {
        const c0 = components[0] || {};
        console.log(`  ✓ ${rfq.job_id} - ${rfq.job_name} | ${c0.paper_code} ${c0.paper_gram}gsm | Box:${c0.box_type_id} | ${c0.color_out}/${c0.color_in}`);
        imported++;
      } else {
        console.log(`  ✗ ${rfq.job_id} - ${saveResult.error}`);
        errors++;
      }

      // Small delay to avoid overwhelming
      await new Promise(r => setTimeout(r, 100));

    } catch (e) {
      console.log(`  ✗ ${rfq.job_id} - ERROR: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n=== Import Complete ===`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Errors:   ${errors}`);

  // Show stats
  const statsRes = await fetch(`${BASE}/api/knowledge/stats`);
  const stats = await statsRes.json();
  console.log(`\n=== Knowledge Store Stats ===`);
  console.log(`  Total entries: ${stats.total}`);
  console.log(`  Box types:`, stats.box_types.slice(0, 5).map(([k,v]) => `${k}(${v})`).join(', '));
  console.log(`  Paper codes:`, stats.paper_codes.slice(0, 5).map(([k,v]) => `${k}(${v})`).join(', '));
}

main().catch(e => console.error('Fatal error:', e));
