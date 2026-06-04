---
name: reference-draft-rfq-schema
description: Draft_RFQ.html is a fuller RFQ form-spec reference; its AI field names differ from the webapp's parse-spec schema
metadata:
  type: reference
---

`Draft_RFQ.html` (project root) = standalone spec extraction of the FULL Estimate RFQ form, sourced from a DIFFERENT codebase: `public/estimate.ejs` + `router/ai.js` (endpoint `/ai/parse-spec`). The webapp in THIS project uses `server.js`/`app.js` with endpoint `/api/parse-spec` and a more compact schema. Both ultimately map to `est.mainData` → POST `/estimate/save_rfq`.

**Concepts are the same, but AI field NAMES differ.** Key mapping (Draft_RFQ `data-ai` → webapp server.js):
- customer_name → customer_search ; is_new_customer → new_customer
- quantities[] → qty[] ; components[].name → component_name ; components[].type → component_type
- box_template_id (1-12 numeric) → box_type_search (name string)
- dimensions_mm{width,length,height} → packaging_size{width,length,depth}
- color_outside/color_inside → color{outside,inside}
- paper_type+paper_gram → paper{paper_code,paper_gram}
- coatings[]/foilstamps[]/embosses[]/debosses[] (separate arrays) → addon[]{type:'coating'|'foilstamp'|'emboss'|'deboss', ...}
- f_codes[]{code,qty} → f_detail + edition_names[]/edition_qtys[]
- deliveries[]{destination,qty,delivery_date} → delivery_province (single string)

**Draft_RFQ.html is RICHER** — captures fields the webapp parser does NOT yet: paper_cost, paper_markup_percent, paper_percent(ตัดม้วน), runon_percent, color_limit_qty, use_previous_plate, profit_sharing, emboss/deboss depth (1.25/1.65mm), foil code, special_inks[] details, priceDiff[], customer_gift[]. Use it as the reference template when upgrading the webapp parser to capture full data.

Related: [[project_classic_mode_status]]
