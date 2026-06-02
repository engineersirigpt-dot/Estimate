# Master Data Summary - Sirivatana Interprint Estimate System

> **Generated:** 2026-03-26
> **API Source:** http://192.168.5.3:3010 (Sirivatana internal network)
> **API Status:** OFFLINE (not reachable from current machine)
> **Data Source:** Legacy JavaScript files + code analysis

---

## Important Note

The Estimate API at `192.168.5.3:3010` was **unreachable** during extraction. All master data schemas and structures below were reverse-engineered from the legacy JavaScript source files. To fetch the actual live data records, run:

```bash
cd webapp && node knowledge/legacy_system/master_data/fetch_master_data.js
```

This requires being connected to the Sirivatana internal network.

---

## Master Data Tables (22 Total)

The legacy system loads 22 master data tables at initialization via `fetchMasterData()`.

| # | API Type | File | Status | Description |
|---|----------|------|--------|-------------|
| 0 | `paper_info` | paper_info.json | Schema only | Paper types, pricing, GSM |
| 1 | `coating_info` | coating_info.json | Schema only | Coating options |
| 2 | `corrugated_info` | corrugated_info.json | Schema only | Corrugated board specs |
| 3 | `foilstamp_info` | foilstamp_info.json | Schema only | Foil stamp colors/codes |
| 4 | `blockstamp_info` | - | Schema in master_data_schemas.json | Block stamp rates |
| 5 | `price_info` | - | Schema in master_data_schemas.json | Price rates by qty range |
| 6 | `min_price_info` | - | Schema in master_data_schemas.json | Minimum prices |
| 7 | `waste_info` | - | Schema in master_data_schemas.json | Paper waste rates |
| 8 | `blockdiecut_info` | - | Schema in master_data_schemas.json | Die-cut block pricing |
| 9 | `boxtemplate_info` | boxtemplate_info.json | **COMPLETE** | Box template definitions |
| 10 | `specialink_info` | - | Schema in master_data_schemas.json | Special ink types |
| 11 | `specialink_factor_info` | - | Schema in master_data_schemas.json | Special ink factors |
| 12 | `jetpress_waste_info` | - | Schema in master_data_schemas.json | JetPress waste |
| 13 | `jetpress_info` | - | Schema in master_data_schemas.json | JetPress pricing |
| 14 | `marking_price_info` | - | Schema in master_data_schemas.json | Markup rules |
| 15 | `machine_std_paper_info` | - | Schema in master_data_schemas.json | Standard paper per machine |
| 16 | `delivery_rate_info` | delivery_rate_info.json | Schema only | Delivery rates |
| 17 | `paper_code_type` | paper_code_type.json | Schema only | Paper code mapping |
| 18 | `process_type` | - | Schema in master_data_schemas.json | Process types |
| 19 | `price_type` | - | Schema in master_data_schemas.json | Price types |
| 20 | `konica_waste_info` | - | Schema in master_data_schemas.json | Konica waste |
| 21 | `exchange_rate` | - | Schema in master_data_schemas.json | Exchange rates |

---

## Files Created (Static/Hardcoded Data)

These files contain complete data extracted from the legacy JavaScript files:

| File | Source | Content |
|------|--------|---------|
| `default_config.json` | js_data_default.js | All default values: tolerances, markups, plate prices, foil costs, etc. |
| `machine_info.json` | js_data_default.js | All 7 machine specifications with sizes |
| `print_type_config.json` | js_data_default.js | 4 print type configs (Offset, Flexo, JetPress, Konica) |
| `boxtemplate_info.json` | js_data_default.js + calculation.js | 12 box templates with formulas |
| `component_type.json` | js_data_default.js | 3 component types |
| `packing_info.json` | js_data_default.js | Pallet, kraftwrap, paperband, carton configs |
| `process_id_mapping.json` | js_function_estimate_processInfo.js | MI2 process ID + unit mappings (37 processes) |
| `master_data_schemas.json` | All JS files | Schema definitions for all 22 API tables |

---

## Key Data Structures

### paper_info (from API)
```json
{
  "paper_code": "GAR",
  "paper_type": "Gloss Art",
  "gram": 300,
  "price": 26.88,
  "price_import": 29.5,
  "paper_thickness": 0.1,
  "print_type": "1,3",
  "is_fsc": 0,
  "special_ink_paper_code": "..."
}
```

### waste_info (from API)
```json
{
  "print_type": 1,
  "min_qty": 0,
  "max_qty": 500,
  "print_rate": 300,
  "afterpress_rate": 100,
  "coating_rate": 50,
  "foilstamp_rate": 50,
  "bossing_rate": 50,
  "corrugated_board_rate": 0,
  "print_col_add_rate": 50,
  "corrugatedglued_rate": 0,
  "digital_diecut_rate": 0
}
```

### price_info (from API)
```json
{
  "min_qty": 0,
  "max_qty": 1000,
  "print_1col": 0.xxx,
  "print_3col": 0.xxx,
  "print_5col": 0.xxx,
  "print_flexo": 0.xxx,
  "trim": 0.xxx,
  "diecut": 0.xxx,
  "foilstamp": 0.xxx,
  "bossing": 0.xxx,
  "chip": 0.xxx,
  "inspection": 0.xxx,
  "assembly_S": 0.xxx,
  "assembly_M": 0.xxx,
  "assembly_L": 0.xxx
}
```

### corrugated_info (from API)
```json
{
  "layer": 3,
  "flute_type": "B",
  "type_1": "KA",
  "gram_1": 125,
  "type_2": "CA",
  "gram_2": 125,
  "type_3": "",
  "gram_3": 0,
  "total_gram": 250,
  "flute_thickness": 2.5,
  "rate": 0.xxx
}
```

---

## Default Configuration Highlights

### Tolerances (mm)
- Bleed: 3mm (all sides)
- Gripper: 12mm (Offset), 25mm (Flexo/JetPress), 35mm (Konica)
- Color bar: 8mm (Offset), 3mm (Flexo/JetPress), 0mm (Konica)
- Paper edge: 4mm (Offset/Flexo/JetPress), 15mm (Konica)

### Key Pricing Defaults (THB)
- Plate price: 800/color (default), 1,875/color (profit sharing)
- Plate polymer: 6.53/sqin (new), 5.94/sqin (reprint)
- Film rate: 1.25/sqin, min 120
- Foil stamp labor: 0.8/sheet
- Emboss/Deboss labor: 0.8/sheet
- Block foilstamp min: 70/block
- Delivery: 1,500/ton (default)
- Tax: 3%

### Markup Defaults
| Markup Type | Default % | Profit Sharing % |
|------------|-----------|-----------------|
| Paper (domestic) | 10% | 18% |
| Paper (import) | 13% | 18% |
| Afterpress | 0% | 20% |
| Material | 0% | 25% |
| Outsource | 0% | 25% |
| Corrugated | 10% | 20% |
| Packing | 0% | 25% |
| Delivery | 0% | 20% |
| Total price | 0% | 5% (min 5,000) |

---

## Machine Specifications Summary

| Machine | ID | Max Size (mm) | Min Size (mm) | Print Type | Split |
|---------|-----|--------------|---------------|------------|-------|
| L444SP (Cut 1) | 3422 | 840 x 1150 | 460 x 620 | Offset | 1 |
| L440 (Cut 2) | 3407 | 720 x 1030 | 360 x 520 | Offset | 2 |
| LS1029 (Cut 3) | 3507 | 530 x 750 | 260 x 360 | Offset | 3 |
| Flexo | 5518 | 1448 x 2398* | 400 x 533 | Flexo | 1 |
| Jet Press | 5527 | 585 x 750 | 393 x 546 | Jet Press | 1 |
| Konica | 5528 | 330 x 487 | 140 x 182 | Konica | 1 |

*Flexo max size varies by corrugated layer: 2-layer max 1448x1270, 3/5-layer max 1448x2398

---

## API Endpoints Reference

### Master Data
```
GET  /estimate/master_data?type=<type_name>
     Auth: Bearer token required
     Returns: Array of records
```

### Authentication
```
POST /user/login
     Body: { username, password }
     Returns: { accessToken, user }
```

### RFQ Operations
```
GET  /estimate/list              - RFQ list
POST /estimate/rfq               - Get/Save RFQ
GET  /estimate/rfq/status/log    - Status history
GET  /estimate/customer          - Customer info
GET  /estimate/emp_status        - Employee info
GET  /estimate/file/:id          - File check
GET  /estimate/quotations        - Quotation list
```

### Autocomplete
```
GET  /estimate/autocomplete?type=customer&term=xxx
GET  /estimate/autocomplete?type=delivery&term=xxx
GET  /estimate/autocomplete?type=employee&term=xxx
```

---

## How to Refresh Data

When connected to the Sirivatana network (192.168.5.3 reachable):

1. Run the fetch script:
   ```bash
   cd "d:/Pornchai AI RFQ/webapp"
   node knowledge/legacy_system/master_data/fetch_master_data.js
   ```

2. This will create `*_live.json` files for all 22 master data types.

3. The summary will be saved to `fetch_summary.json`.

---

## File Index

```
master_data/
  MASTER_DATA_SUMMARY.md          <- This file
  master_data_schemas.json        <- All 22 table schemas
  default_config.json             <- Hardcoded defaults (complete)
  machine_info.json               <- Machine specs (complete)
  print_type_config.json          <- Print type configs (complete)
  boxtemplate_info.json           <- Box templates + formulas (complete)
  component_type.json             <- Component types (complete)
  packing_info.json               <- Packing configs (complete)
  process_id_mapping.json         <- MI2 process IDs (complete)
  paper_info.json                 <- Schema only (needs API)
  coating_info.json               <- Schema only (needs API)
  corrugated_info.json            <- Schema only (needs API)
  foilstamp_info.json             <- Schema only (needs API)
  delivery_rate_info.json         <- Schema only (needs API)
  paper_code_type.json            <- Schema only (needs API)
  paper_sub_code.json             <- Not a known type
  fetch_master_data.js            <- Script to fetch live data
```
