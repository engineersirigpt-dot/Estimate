# Legacy Estimate System - Complete Reverse Engineering Summary

> Source: Sirivatana Interprint Legacy System (192.168.5.3:3040/estimate)
> Extracted from local JS files in project root
> Date: 2026-03-26

---

## Table of Contents
1. [System Architecture](#1-system-architecture)
2. [JavaScript Files Index](#2-javascript-files-index)
3. [Data Model & Classes](#3-data-model--classes)
4. [Master Data (Database)](#4-master-data-database)
5. [Default Configuration Values](#5-default-configuration-values)
6. [Box Templates (12 Types)](#6-box-templates-12-types)
7. [Open Size Formulas](#7-open-size-formulas)
8. [Fold Size Formulas](#8-fold-size-formulas)
9. [Packing Size Formulas](#9-packing-size-formulas)
10. [Layout Calculation System](#10-layout-calculation-system)
11. [W-Side Layout Formulas](#11-w-side-layout-formulas)
12. [L-Side Layout Formulas](#12-l-side-layout-formulas)
13. [Machine Specifications](#13-machine-specifications)
14. [Print Type Configuration](#14-print-type-configuration)
15. [Paper & Waste Calculation](#15-paper--waste-calculation)
16. [Price Rate System](#16-price-rate-system)
17. [Coating, Foilstamp & Emboss](#17-coating-foilstamp--emboss)
18. [Packing System](#18-packing-system)
19. [API Endpoints](#19-api-endpoints)
20. [Utility Functions](#20-utility-functions)
21. [Validation Rules](#21-validation-rules)
22. [Process Info Builder](#22-process-info-builder)

---

## 1. System Architecture

```
Legacy System (192.168.5.3:3040)
  |
  +-- Frontend: jQuery + Bootstrap + vanilla JS
  |     +-- Estimate Form (multi-step)
  |     +-- RFQ List / Detail views
  |     +-- PDF Export
  |
  +-- Backend API: Node.js (192.168.5.3:3010)
  |     +-- /estimate/master_data  (GET)
  |     +-- /estimate/rfq          (POST)
  |     +-- /estimate/customer     (GET)
  |     +-- /estimate/emp_status   (GET)
  |     +-- /estimate/file/:id     (GET)
  |     +-- /estimate/rfq/status/log (GET)
  |
  +-- Master Data DB
        +-- paper_info, coating_info, corrugated_info
        +-- foilstamp_info, block_stamp_info, price_info
        +-- waste_info, box_template_info, etc.
```

---

## 2. JavaScript Files Index

| File | Purpose | Key Functions |
|------|---------|---------------|
| `js_data_default.js` | Default config, machine specs, print type config, box template config | `defaultData` object |
| `js_function_estimate_calculation.js` | **Core Estimate class** - ALL calculation formulas | `setCalculateOpenSize`, `setCalculateFoldSize`, `setCalculateWSide`, `setCalculateLSide`, `setCalculateLayout`, `setWaste`, `setPriceRate`, etc. |
| `js_function_estimate.js` | UI interaction, store data to model, form handling | `storeJob`, `storeQty`, `storeComponent`, `getDimension`, `getComponentColor`, etc. |
| `js_function_estimate_getMasterData.js` | Master data queries from DB | `getPaperType`, `getPaperPrice`, `getDefaultGluedSpot`, `getDefaultDust`, `getMasterPaperWaste`, etc. |
| `js_function_estimate_fetchData.js` | AJAX calls to API | `fetchMasterData`, `getDataRFQ`, `setDataRFQ`, `getCustomerInfo` |
| `js_function_estimate_layout.js` | Alternative layout calculation (newer version) | `setLayoutTolerance`, `setCalculateWSide`, `setCalculateLSide`, `calculateLayingSize2`, `calculateCorrugatedBoardSize` |
| `js_function_estimate_database.js` | Database class for storing master data | `Database` class with `setInfo()` |
| `js_function_estimate_validate.js` | Form validation functions | `checkValidateAll`, `checkValidateQty`, `checkValidateComponentInput`, etc. |
| `js_commonFunction.js` | Utility functions | `mm2inch`, `inch2mm`, `roundToEven`, `roundDecimal`, `toNumber`, `removeDuplicate` |
| `js_function_estimate_processInfo.js` | Process info builder for data transform | `ProcessInfoBuilder` class |
| `js_function_estimate_displayData2UI.js` | Display RFQ data back to UI | Display functions |
| `js_function_estimate_readyFunction.js` | Document ready initialization | Init logic |
| `js_data_mockup.js` | Test/mock data | Mock data |
| `js_prepare_data.js` | Data preparation | Data prep |
| `js_print-pdf.js` | PDF generation | PDF export |
| `js_documentStatusManagerClass.js` | Document status management | Status workflow |
| `js_estimateHistoryClass.js` | Estimate history tracking | History |

---

## 3. Data Model & Classes

### Estimate Class (main data model)
```javascript
class Estimate {
  mainData = {
    job: {
      job_name, job_id, ref_copy_rfq,
      is_reprinted, ink_type, print_type,
      flexo_size, color_limit, is_multiple_f,
      is_use_previous_plate, is_profit_sharing,
      is_cancel_total_profit_sharing,
      credit_term_id, credit_term_name
    },
    ae: { ae_id, ae_name },
    customer: { customer_id, customer_name },
    qty: {
      main: [1000, 2000],  // array of quantities
      runon: 0,
      customer: 0,
      ae: 0,
      runon_percent: 0,
      totalqty: []
    },
    remark: '',
    delivery: [],
    component1: [  // array of components
      {
        component_name,
        box_type: {
          type_id,        // 1-12
          glued_spot,
          packing_layer,
          is_digital_diecut
        },
        packaging_size: {
          width, length, depth,
          glue_flap, tuck_flap, dust_flap, ol,
          fold_size: [],   // [w_in, l_in, d_in, w_mm, l_mm, d_mm]
          open_size: [],   // [w_in, l_in, w_mm, l_mm]
          packing_size: [] // [w_in, l_in, w_mm, l_mm]
        },
        component_type: { type: 1|2|3 },
        // type 1 = no corrugated
        // type 2 = with corrugated
        // type 3 = corrugated only
        color: [{
          outside: 0, inside: 0, all: 0,
          f_code: '',
          is_special_ink: false,
          black_printing_outside: false,
          black_printing_inside: false,
          special_ink: []
        }],
        paper: {
          paper_code, paper_name, paper_cost,
          paper_thickness, paper_gram, paper_markup
        },
        corrugated_layer: {
          info: {
            flute_type, all_gram, thickness, rate,
            num_layer, is_price_per_sheet, corrugated_size
          },
          component_flute_side
        },
        paper_tolerance: {
          gripper, color_bar, paper_edge, bleed
        },
        paperSize: [w_mm, l_mm, w_in, l_in],
        paper_info: {
          roll_width, cut_off,
          parallel_roll_width, // 'WSize' or 'LSize'
          is_switchDisplay,
          paper_grain, // 'horizontal' or 'vertical'
          paper_align,
          std_paper_id
        },
        machine: { /* machine object from defaultData.machine */ },
        layout: {
          layout: { laying: [], gripper, color_bar, paper_edge },
          selected_layout: {
            laying_type,    // 'straight' or 'overlap'
            laying,         // 'vertical' or 'horizontal'
            grain_box_type, // 'horizontal' or 'vertical'
            layout: [w_count, l_count],
            printing: [w_mm, l_mm],
            num_laying,
            paper_size: [roll_width, cut_off],
            layout_size: [w_mm, l_mm]
          },
          laySize: [w_mm, l_mm],
          paper_align,
          is_editLayout
        },
        layout_manual: false,
        addon: [],  // coating, foilstamp, emboss, deboss
        process: [], // afterpress processes
        paper_usage: {
          ups, sig, split,
          line: [{
            qty, after_ups, paper_print, waste,
            paper: { unit_price, price },
            plate: { inside: {}, outside: {} },
            print: { inside: {}, outside: {} },
            price: { proof: {} }
          }]
        },
        waste: {
          waste: [],
          waste_print: [],
          waste_afterpress: [],
          waste_coating: [],
          // ... more waste categories
        },
        weight: { paper_weight, corrugated_weight, weight },
        thickness: { mm: {}, inch: {} },
        packing: [[ /* kraftwrap, carton, paperband, pallet */ ]],
        f_detail: { f_qty: [], f_total_qty, f_list: [] }
      }
    ],
    process: [],    // chip, inspection, other, handwork, custom
    material: [],
    otherCost: [],
    specialInk: [],
    totalprice: [],
    tax: 3,
    currency_no: 'THB',
    exchange_rate: 1,
    fileUpload: [],
    estimator: {}
  }
}
```

### Database Class
```javascript
class Database {
  db = {
    paper_info,              // [0] Paper types, costs, GSM
    coating_info,            // [1] Coating options
    corrugated_info,         // [2] Corrugated board specs
    foilstamp_info,          // [3] Foil stamp colors/codes
    block_stamp_info,        // [4] Block stamp rates
    price_info,              // [5] Price rates per qty range
    min_price_info,          // [6] Minimum prices
    waste_info,              // [7] Waste rates per qty range
    block_diecut_info,       // [8] Die-cut block rates
    box_template_info,       // [9] Box template definitions
    special_ink_info,        // [10] Special ink types
    special_ink_factor_info, // [11] Special ink factors
    jetpress_waste_info,     // [12] JetPress waste
    jetpress_info,           // [13] JetPress pricing
    marking_price_info,      // [14] Markup pricing
    machine_std_paper_info,  // [15] Standard paper per machine
    delivery_rate_info,      // [16] Delivery rates
    paper_code_type,         // [17] Paper code mapping
    process_type,            // [18] Process types
    price_type,              // [19] Price types
    konica_waste_info,       // [20] Konica waste
    exchange_rate            // [21] Exchange rates
  }
}
```

---

## 4. Master Data (Database)

### Master Data API Call
```javascript
// Single call fetches ALL master data
fetchMasterData(type = '') // GET /estimate/master_data?type=<type>

// Types loaded at init (22 tables):
// paper_info, coating_info, corrugated_info, foilstamp_info,
// block_stamp_info, price_info, min_price_info, waste_info,
// block_diecut_info, box_template_info, special_ink_info,
// special_ink_factor_info, jetpress_waste_info, jetpress_info,
// marking_price_info, machine_std_paper_info, delivery_rate_info,
// paper_code_type, process_type, price_type, konica_waste_info,
// exchange_rate
```

### Key Master Data Structures

**paper_info**: `{ paper_code, paper_type, paper_name, gram, price, price_import, paper_thickness, print_type, is_fsc, special_ink_paper_code }`

**coating_info**: `{ coating_option, coating_code, coating_type, pages, condition_key, coating_size }`

**corrugated_info**: `{ layer, flute_type, type_1, gram_1, type_2, gram_2, type_3, gram_3, grade, total_gram, flute_thickness, rate }`

**price_info**: `{ min_qty, max_qty, print_1col, print_3col, print_5col, print_flexo, trim, diecut, foilstamp, bossing, chip, inspection, assembly_S, assembly_M, assembly_L }`

**waste_info**: `{ print_type, min_qty, max_qty, print_rate, afterpress_rate, coating_rate, foilstamp_rate, bossing_rate, corrugated_board_rate, print_col_add_rate, corrugatedglued_rate, digital_diecut_rate }`

**box_template_info**: `{ type_id, type_name, type_name_th, packing_layer, glued_spot }`

**jetpress_info**: `{ paper_size: [w_mm, l_mm], min, max, print_price }`

---

## 5. Default Configuration Values

### Tolerances (mm)
```javascript
tolerance: {
  bleed: 3,
  color_bar: 8,
  gripper: 12,
  paper_edge: 4
}
```

### Color Limits
```javascript
color_limit: {
  max_color: 4,
  paper_waste: 300,
  paper_waste_per_color: 50,
  jetpress_paper_waste: 150,
  jetpress_paper_waste_per_color: 20
}
```

### Markup Percentages
```javascript
paper_price_marking: 10,           // domestic paper markup %
import_paper_price_marking: 13,    // import paper markup %
addon_labor_price_marking: 20,
afterpress_price_marking: 0,
material_price_marking: 0,
outsouce_price_marking: 0,
packing_marking: 0,
delivery_marking: 0,
special_customer_marking: 7,       // 7% extended for special customers
```

### Profit Sharing Config
```javascript
profit_sharing: {
  plate_price: 1875,               // THB/color
  paper: { marking_price: 18 },    // percent
  print: {
    min_paper_qty: 10000,
    print_rate: 0.14,
    print_min_price: 1400
  },
  afterpress_price_marking: 20,    // percent
  material_price_marking: 25,
  outsouce_price_marking: 25,
  total_price_marking: 5,
  corrugated_markup: 20,
  packing_marking: 25,
  delivery_marking: 20,
  marking_total_price: { min: 5000, percent: 5 }
}
```

### Plate & Film Costs
```javascript
plate_price: 800,                   // THB/color
plate_polymer_price: 6.53,          // THB/sqin
reprint_plate_polymer_price: 5.94,  // THB/sqin (reprint jobs)
block_polymer_min_price: 50,
reprintReducePlateCostPercent: 50,  // 50%
film_rate: 1.25,                    // THB/sqin
film_min_cost: 120,
cut_1_plate_markup: 50,             // THB
```

### Foil Stamp
```javascript
foil_width_tolerance: 0.5,   // inch
foil_length_tolerance: 1,    // inch
foilstamp_price: 0.8,        // THB/sheet labor
block_foilstamp_min_cost: 70, // THB/block minimum
bossing_price: 0.8,          // THB/sheet emboss/deboss labor
```

### Other Constants
```javascript
formula_value: 1550000,
corrugated_tolerance: 0.375,
corrugated_markup: 10,                // %
corrugated_glued_cost: 0.0015,        // THB/sqinch
corrugated_assembly_markup_price: 0.1, // THB
coating_opp_cold_film_cost_sqin: 0.0103,
reprinted_block: 500,
tax: 0.03,
tax_percent: 3,
delivery_rate: 1500,                  // THB/ton
```

### Assembly Size Brackets
```javascript
assembly_size: [
  { width: 9, length: 11, type: 'assembly_S' },
  { width: 21, length: 31, type: 'assembly_M' },
  { width: 27, length: 39, type: 'assembly_L' }
]
```

### Component Types
```javascript
component_type: [
  {
    type: 1,
    type_name: 'no corrugated',
    print_type: ["Offset", 'Jet Press', 'Konica'],
    corrugated_layer: [2, 3, 5],
    tolerance: { paper_edge: 4, bleed: 3, gripper: 12, color_bar: 8 }
  },
  {
    type: 2,
    type_name: 'with corrugated',
    print_type: ["Offset", 'Jet Press'],
    corrugated_layer: [2, 3, 5],
    tolerance: { paper_edge: 4, bleed: 3, gripper: 12, color_bar: 8 }
  },
  {
    type: 3,
    type_name: 'corrugated only',
    print_type: ["Flexo"],
    corrugated_layer: [2, 3, 5],
    tolerance: { paper_edge: 10, bleed: 3, gripper: 0, color_bar: 0 }
  }
]
```

### Box Template Dust Defaults
```javascript
// Type 5, 6: dust_flap default = 25mm (0.99 inch)
// All other types: dust_flap = empty (user must input)
box_template: [
  { id: 5, config: { dust: [25, 0.99] } },
  { id: 6, config: { dust: [25, 0.99] } },
  // all others: { dust: [] }
]
```

---

## 6. Box Templates (12 Types)

| Type ID | English Name | Thai Name |
|---------|-------------|-----------|
| 1 | Reverse Tuck End (RTE) | ฝาเสียบกลับ |
| 2 | Straight Tuck End (STE) | ฝาเสียบตรง |
| 3 | Tuck Top Snap Lock Bottom (TTSLB) | ออโต้ล็อคหูขัด |
| 4 | Tuck Top Auto Bottom (TTAB) | ออโต้ล็อคทากาว |
| 5 | Double Glue Side Wall / Simplex Tray | ฝาครอบ |
| 6 | Frame-Vue Tray | ถาดหูพับ |
| 7 | Four Corner Beers Tray with Lid | ถาด 4 มุม |
| 8 | Gable Top with Auto Bottom | จั่ว |
| 9 | Sleeve | ปลอก |
| 10 | Pillow Box | หมอน |
| 11 | Seal End | ทากาว |
| 12 | Custom | กำหนดเอง |

### Dimension Variables
- **w** = width (mm)
- **l** = length (mm)
- **d** = depth (mm)
- **g** = glue_flap (mm)
- **t** = tuck_flap (mm)
- **dust** = dust_flap (mm)
- **ol** = overlap (mm)
- **b** = bleed (mm, default 3)

---

## 7. Open Size Formulas

All formulas return: `[w_inch, l_inch, w_mm, l_mm]`

```
Type 1 (RTE):
  W = 2*(w + t) + d
  L = 2*(w + l) + g

Type 2 (STE):
  W = 2*(w + t) + d
  L = 2*(w + l) + g

Type 3 (TTSLB):
  W = t + w + d + w/2 + ol
  L = 2*(w + l) + g

Type 4 (TTAB):
  W = t + w + d + w/2 + ol
  L = 2*(w + l) + g

Type 5 (Simplex Tray):
  W = w + 4*d
  L = l + 4*d + 2*dust

Type 6 (Frame-Vue Tray):
  W = w + 4*d + 2*dust + 2*ol
  L = l + 4*d + 2*dust + 2*ol

Type 7 (Four Corner):
  W = 2*(l + dust) + w
  L = 2*(l + d) + l          [Note: = 3*l + 2*d]

Type 8 (Gable Top):
  W = t + 2*d + w/2 + ol
  L = 2*(w + l) + g

Type 9 (Sleeve):
  W = d
  L = 2*(w + l) + g

Type 10 (Pillow Box):
  W = l + d
  L = 2*w + g

Type 11 (Seal End):
  W = 2*w + d
  L = 2*(w + l) + g

Type 12 (Custom):
  User-provided open_size [w_in, l_in, w_mm, l_mm]
```

---

## 8. Fold Size Formulas

Returns: `[w_inch, l_inch, d_inch, w_mm, l_mm, d_mm]`

```
Type 8 (Gable Top):
  fold_w = 2*w + t
  fold_l = l
  fold_d = d

All Other Types:
  fold_w = w
  fold_l = l
  fold_d = d
```

---

## 9. Packing Size Formulas

Returns: `[w_inch, l_inch, w_mm, l_mm]` - the folded box footprint for packing calculations.

```
Type 1 (RTE):     w_side = d + 2*(w + t),   l_side = l + w
Type 2 (STE):     w_side = d + 2*(w + t),   l_side = l + w
Type 3 (TTSLB):   w_side = d + w + t + ol + w/2,   l_side = l + w
Type 4 (TTAB):    w_side = d + w + t,       l_side = l + w
Type 5 (Tray):    w_side = 4*d + w,         l_side = 2*dust + 4*d + l
Type 6 (Frame):   w_side = 2*dust + 4*d + 2*ol + w,  l_side = 2*dust + 4*d + 2*ol + l
Type 7 (4Corner): w_side = w,               l_side = l + d
Type 8 (Gable):   w_side = t + 2*d,         l_side = l + w
Type 9 (Sleeve):  w_side = d,               l_side = l + w
Type 10 (Pillow): w_side = l + d,           l_side = w
Type 11 (Seal):   w_side = d + 2*w,         l_side = l + w
Type 12 (Custom): user-provided packing_size
```

---

## 10. Layout Calculation System

### Overview
The layout system determines how many box blanks (ups) fit on a sheet of paper.

### Step 1: Calculate Open Size + Bleed
Each box blank needs `bleed` (3mm) added on all sides.

### Step 2: Paper Tolerance (machine margins)
```javascript
// Component type 1, 2 (Offset/Digital):
shortSideComponent = gripper + color_bar   // e.g. 12 + 8 = 20mm
longSideComponent = paper_edge * 2         // e.g. 4 * 2 = 8mm

// Component type 3 (Flexo):
shortSideComponent = gripper + color_bar + paper_edge * 2
longSideComponent = paper_edge * 2
```

### Step 3: Calculate Available Paper Size
```javascript
paperSize[0] = roll_width_mm - shortSideComponent  // available width
paperSize[1] = cut_off_mm - longSideComponent       // available length
// (The shorter printing dimension gets shortSideComponent)
```

### Step 4: Try All Layout Orientations
For each box type, the system tries:
- **Vertical laying** (box W-side along paper W-side)
- **Horizontal laying** (box W-side along paper L-side)
- **Straight** alignment (no interleaving)
- **Overlap** alignment (interleaving for types 2,3,4 only)

### Step 5: Select Best Layout
1. Compare all laying options against machine size limits
2. Filter layouts that pass machine constraints
3. Among passing layouts, find maximum `num_laying` (ups)
4. Among equal ups, choose minimum paper area usage
5. Set `selected_layout`

### Layout Selection Algorithm
```javascript
// 1. Calculate all layout options
laying = setCalculateLayoutSize(index)

// 2. Check against machine size
correctLaying = checkCompareMachineSizeLaying(laying, item)

// 3. Find max ups
maxNum = checkMaximunNumLayout(correctLaying)

// 4. Find min area among max ups
selectedLayout = checkMinAreaUsageLayout(correctLaying, maxNum)
```

---

## 11. W-Side Layout Formulas

These calculate the printing width for `n` boxes side by side.

### Variables
- n = number of boxes
- w, l, d, b (bleed), dust, ol, g (glue), t (tuck)

```
Case 1.1 (RTE, dust <= (w+t)/2):
  side = (n+1)*(w+t) + n*(2*b+d)

Case 1.2 (RTE, dust > (w+t)/2):
  side = 2*(w+t) + n*(2*b+d) + (n-1)*(2*dust)

Case 2.1 (STE straight):
  side = 2*(w+t) + n*(2*b+d) + (n-1)*(dust+w+t)

Case 2.2 (STE overlap, dust <= (w+t)/2):
  side = (n+1)*(w+t) + n*(2*b+d)

Case 2.3 (STE overlap, dust > (w+t)/2):
  side = 2*(w+t) + n*(2*b+d) + (n-1)*(2*dust)

Case 3.1 (TTSLB straight):
  side = n*(ol + w/2 + 2*b + d) + (floor(n/2) + n%2)*(w+t) + floor(n/2)*dust

Case 3.2 (TTSLB overlap, dust <= (w+t)/2):
  side = n*(ol + w/2 + 2*b + d) + (floor(n/2) + n%2)*(w+t)

Case 3.3 (TTSLB overlap, dust > (w+t)/2):
  side = n*(ol + w/2 + 2*b + d) + (floor(n/2) + n%2)*(w+t) + floor(n/2)*(2*dust - w - t)

Case 4.1 (TTAB straight):
  [same as 3.1]

Case 4.2 (TTAB overlap, dust <= (w+t)/2):
  [same as 3.2]

Case 4.3 (TTAB overlap, dust > (w+t)/2):
  [same as 3.3]

Case 5.0 (Simplex Tray):
  side = n*(w + 4*d + 2*b)

Case 6.0 (Frame-Vue Tray):
  side = n*(w + 4*d + 2*b + 2*ol + 2*dust)

Case 7.1 (4-Corner, glue <= (l+dust)/2):
  side = (n+1)*(l+dust) + n*(2*b+w)

Case 7.2 (4-Corner, glue > (l+dust)/2):
  side = 2*(l+dust) + n*(w+2*b) + 2*(n-1)*g

Case 8.1 (Gable Top):
  side = n*(t + 2*d + 2*b) + n*w/2 + (n%2)*ol

Case 9.0 (Sleeve):
  side = n*(d + 2*b)

Case 10.0 (Pillow):
  side = n*(l + d + 2*b)

Case 11.0 (Seal End):
  side = n*(d + 2*w + 2*b)
```

---

## 12. L-Side Layout Formulas

```
Case 1.0 (RTE):
  side = n*(2*(w+l+b) + g)

Case 2.0 (STE straight):
  side = n*(2*(w+l+b) + g)

Case 2.2/2.3 (STE overlap):
  side = 2*n*(l+b) + (2*n+1)*w + (n-1)*g

Case 3.0 (TTSLB straight):
  side = n*(2*(w+l+b) + g)

Case 3.2/3.3 (TTSLB overlap):
  side = 2*n*(l+b) + (2*n+1)*w + (n-1)*g

Case 4.0 (TTAB straight):
  side = n*(2*(w+l+b) + g)

Case 4.2/4.3 (TTAB overlap):
  side = 2*n*(l+b) + (2*n+1)*w + (n-1)*g

Case 5.0 (Tray):
  side = n*(l + 4*d + 2*b + 2*dust)

Case 6.0 (Frame-Vue):
  side = n*(l + 4*d + 2*b + 2*dust + 2*ol)

Case 7.0 (4-Corner):
  side = n*(2*d + 2*b + 3*l)

Case 8.0 (Gable, n=1):
  side = n*(2*(w+l+b) + g)

Case 8.1 (Gable, n>1):
  side = 2*n*(w+l+b) + (n+1)*g

Case 9.0 (Sleeve):
  side = n*(2*(w+l+b) + g)

Case 10.0 (Pillow):
  side = n*(2*w + 2*b + g)

Case 11.0 (Seal End):
  side = n*(2*(b+w+l) + g)
```

---

## 13. Machine Specifications

### Machine List
| ID | Machine Name | Max Size (in) | Max Size (mm) | Min Size (mm) | Print Type | Comp Types |
|----|-------------|--------------|---------------|---------------|-----------|-----------|
| 9998 | - (any) | 99x99 | 2514x2514 | 0x0 | All | 1,2,3 |
| 3422 | L444SP | 33x45.275 | 840x1150 | 460x620 | Offset | 1,2 |
| 3407 | L440 | 28.35x40.56 | 720x1030 | 360x520 | Offset | 1,2 |
| 3507 | LS1029 | 20.87x29.53 | 530x750 | 260x360 | Offset | 1,2 |
| 5518 | Flexo | varies | varies | 400x533 | Offset/Flexo | 3 |
| 5527 | Jet Press | 23.03x29.52 | 585x750 | 393x546 | Jet Press | 1,2 |
| 5528 | Konica | 13x19.17 | 330x487 | 140x182 | Konica | 1 |

### Flexo Machine Size Options (by layer)
```javascript
// 2-layer corrugated:
max_size: [57, 50, 1447.8, 1270]

// 3 or 5-layer corrugated:
max_size: [57, 94.4, 1447.8, 2397.76]
```

### Machine Size Format
```javascript
// [w_inch, l_inch, w_mm, l_mm]
max_size: [28.35, 40.56, 720.09, 1030.22]
min_size: [14.18, 20.48, 360.17, 520.19]
w_range:  [14.18, 28.35, 360.17, 720.09]  // [min_in, max_in, min_mm, max_mm]
l_range:  [20.48, 40.56, 520.19, 1030.22]
```

### Machine Selection Logic
1. Filter by print_type (Offset/Flexo/JetPress/Konica)
2. Filter by component type (1,2,3)
3. Filter by max color count
4. For compType 1,2: default machine = Cut 2 (id=2)
5. For compType 3: default machine = Flexo (id=4)
6. Try standard paper sizes first, then fall back to max machine size

---

## 14. Print Type Configuration

```javascript
print_type_config: {
  "Offset": {
    print_type_id: 1,
    gsm: { min: 0, max: 50000 },
    tolerance: { gripper: 12, color_bar: 8, bleed: 3, paper_edge: 4 },
    color_limit_waste: { waste: 300, waste_per_color: 50 },
    reduce_paper_waste_percent: 0,
    component_type: [1, 2, 3]
  },
  "Flexo": {
    print_type_id: 2,
    tolerance: { gripper: 25, color_bar: 3, bleed: 3, paper_edge: 4 },
    color_limit_waste: { waste: 300, waste_per_color: 50 },
    reduce_paper_waste_percent: 0,
    component_type: [3]
  },
  "Jet Press": {
    print_type_id: 3,
    gsm: { min: 190, max: 500 },
    paperType: ['A/C C1s', 'A/C C2s', 'W/C', 'Duplex BBB', 'Duplex GBB', 'Duplex WBB'],
    tolerance: { gripper: 25, color_bar: 3, bleed: 3, paper_edge: 4 },
    color_limit_waste: { waste: 150, waste_per_color: 20 },
    reduce_paper_waste_percent: 30,
    component_type: [1, 2]
  },
  "Konica": {
    print_type_id: 4,
    gsm: { min: 60, max: 350 },
    tolerance: { gripper: 35, color_bar: 0, bleed: 3, paper_edge: 15 },
    color_limit_waste: { waste: 150, waste_per_color: 20 },
    reduce_paper_waste_percent: 30,
    reduce_paper_waste_percent_digital_diecut: 20,
    component_type: [1]
  }
}
```

---

## 15. Paper & Waste Calculation

### Paper Usage Calculation
```
1. ups = selected_layout.num_laying (boxes per sheet)
2. split = how many times the paper is cut from roll
3. For each qty:
   after_ups = ceil(qty / ups)
   paper_print = ceil(after_ups / split) + waste
```

### Waste Calculation
```
waste = waste_print                        // base print waste
      + waste_color_limit                   // if color > 4
      + waste_afterpress                    // afterpress waste
      + waste_afterpress_net                // digital diecut
      + col_add * waste_print_col_add       // if total colors > 4 (Offset only)
      + waste_coating (per addon)           // 1x or 2x per side
      + waste_foilstamp (if applicable)
      + waste_bossing (if applicable)

// Color limit waste (compType 1,2 only):
if (outside > 0):
  waste_color_limit += base_waste (300 for Offset, 150 for digital)
  if (outside > 4): waste_color_limit += (outside - 4) * waste_per_color

if (inside > 0):
  waste_color_limit += base_waste
  if (inside > 4): waste_color_limit += (inside - 4) * waste_per_color

// Waste reduction for digital:
// Jet Press: reduce 30% of afterpress, coating, foilstamp, bossing waste
// Konica: reduce 30%, digital diecut adds +20%
```

### Waste Source (from master data)
```javascript
getMasterPaperWaste(printType, after_ups)
// Returns: { print_rate, afterpress_rate, coating_rate, foilstamp_rate,
//            bossing_rate, corrugated_board_rate, print_col_add_rate,
//            corrugatedglued_rate, digital_diecut_rate }
```

---

## 16. Price Rate System

### Price Rate Lookup
```javascript
setPriceRate(type, qty, item)
// types: 'print_1col', 'print_3col', 'print_5col', 'print_flexo',
//        'trim', 'diecut', 'foilstamp', 'bossing',
//        'chip', 'inspection', 'assembly_S/M/L'

// Returns: { min_price, unit_price, price: max(qty * unit_price, min_price) }
```

### JetPress Pricing
```javascript
setPriceRate4JetPress(item, paper_print)
// Looks up in jetpress_info table by paper_size and qty range
```

### Block Die-Cut Rate
```javascript
setBlockDiecutRate2(layout)
// Sorts short/long side, looks up in block_diecut_info table
// If reprinted: returns defaultData.reprinted_block (500 THB)
```

### Total Price Calculation Flow
```javascript
setCalculatePrice() {
  est.setCalculateDeliveryPrice()
  est.setCalculateComponentMaterialCost()
  est.setCalculateProcessCost()
  est.setCalculateMaterialCost()
  est.setCalculateOtherCostCost()
  est.setCalculateChipCost()
  est.setCalculateInspectionCost()
  est.setExchangeRate()
  est.setCalculateTotalPrice()
}
```

---

## 17. Coating, Foilstamp & Emboss

### Coating
- Looked up from `coating_info` by `coating_option` and `coating_code`
- Has `pages` (1 or 2 sides) and `condition_key`
- `coating_size` field parsed as array of numbers

### Foil Stamp
- Colors from `foilstamp_info` (Thai color names)
- Foil roll dimensions: width + tolerance (0.5"), length + tolerance (1")
- Block cost from `block_stamp_info`
- Labor: `foilstamp_price` (0.8 THB/sheet)
- Film: `film_rate` (1.25 THB/sqin), min `film_min_cost` (120 THB)

### Emboss/Deboss
- Labor: `bossing_price` (0.8 THB/sheet)
- Block cost from `block_stamp_info`
- Film: same as foilstamp
- Can have multiple sizes per addon

---

## 18. Packing System

### Packing Hierarchy
```
Component
  -> Packing (per F index)
     -> Kraftwrap (default)
     -> Paperband (optional, needs kraftwrap or carton)
     -> Carton (optional)
     -> Pallet (optional)
```

### Kraftwrap Defaults
```javascript
kraftwrap_info: {
  kraftwrap_price: 5,           // THB per pack
  kraftwrap_thickness: 0.5,     // mm
  limit_kraftwrap_weight: 5,    // kg max
  limit_kraftwrap_height: 300   // mm max
}
```

### Paperband Defaults
```javascript
paperband_info: {
  paperband_price: 0.5,         // THB/stack
  qty_per_paperband: 100,
  paperband_allowance: 25.4     // mm (glue overlap)
}
```

### Carton Defaults
```javascript
carton_info: {
  carton_price: 5,              // THB/carton
  carton_printing_price: 3,     // THB/carton
  markup_price: 15,             // THB/carton (added at end)
  limit_carton_weight: 15,      // kg max
  corrugated_marking: 10        // %
}
```

### Pallet Config
```javascript
pallet: [
  { id: 1, size: [40.00, 48.00, 6.50] },
  { id: 2, size: [39.37, 47.24, 6.50] },
  { id: 3, size: [45.90, 45.90, 6.50] },
  { id: 4, size: [42.00, 45.00, 6.50] },
  { id: 5, size: [43.30, 43.30, 6.50] },
  { id: 6, size: [31.50, 47.24, 6.50] }
]
pallet_delivery: [
  { id: 1, type: 'domestic', pallet_price: 400 },
  { id: 2, type: 'abroad', pallet_price: 700 }
]
pallet_info: {
  limit_pallet_weight: 750,     // kg
  empty_pallet_weight: 25,      // kg
  limit_pallet_height: 44,      // inch
  mif_unit_price: 1100          // THB (MIF pallet)
}
```

### Component Weight Calculation
```javascript
area_box = setCalculateArea(item)  // sqmm (varies by box type)
paper_weight = area_box * gram / 1,000,000,000  // kg
corrugated_weight = area_box * all_gram * num_layer / 1,000,000,000  // kg
total_weight = paper_weight + corrugated_weight
```

---

## 19. API Endpoints

### Master Data
```
GET  /estimate/master_data?type=<type>     - Fetch master data tables
GET  /estimate/master_data?type=exchange_rate - Exchange rates
```

### RFQ Operations
```
POST /estimate/rfq                         - Get/Save RFQ data
     body: { type: 'estimate'|'quote', rfq_id, log_id }
GET  /estimate/rfq/status/log?rfq_id=X&status_id=Y  - Status logs
```

### Customer & Employee
```
GET  /estimate/customer?customer_id=X      - Customer info
GET  /estimate/emp_status?emp_id=X         - Employee info
```

### Files
```
GET  /estimate/file/:file_id               - Check file exists
```

### External
```
POST http://192.168.5.25:5678/webhook/...  - Wizard best match (n8n)
```

---

## 20. Utility Functions

### Unit Conversion
```javascript
mm2inch(x, d=2)  // mm to inch, ceil to d decimal places
inch2mm(x)        // x * 25.4

// Special rounding for corrugated:
roundToEven(value)   // round up to nearest even number
roundDecimal(value)  // ceil to nearest 0.5
roundCorrugated(num) // round to nearest 10 (5 rounds down)
```

### Number Formatting
```javascript
toNumber(val, decimal=2)     // parse to float with decimal places
toFormat(val, format)        // format with numeral.js
toDecimal(number)            // 15 digits precision
```

### Data Helpers
```javascript
removeDuplicate(arr)              // [...new Set(arr)]
removeDuplicateObj(arr, key)      // unique by key
arrayEquals(a, b)                 // deep array comparison
```

---

## 21. Validation Rules

### Required Fields
- AE name
- Job name
- Customer name
- At least 1 qty
- Each component needs: box type, dimensions, paper type, colors

### Validation Functions
```javascript
checkValidateAll()              // Master validation
checkValidateQty()              // Qty > 0
checkValidateFlexoSize()        // Flexo size if Flexo selected
checkValidateColorLimit()       // Color limit settings
checkValidateComponentInput()   // All component fields
checkValidateMultipleF()        // Multiple F validation
checkValidateProcess()          // Process validation
checkValidateNameComp(index)    // Component name
checkValidatePapernCorrugated(index, type)  // Paper/corrugated
checkValidateSpecialInk(index)  // Special ink
checkValidateGluedspot(index)   // Glued spots
```

---

## 22. Process Info Builder

The `ProcessInfoBuilder` class transforms legacy estimate data into a structured process_info format for integration with MI2 (Manufacturing Information) system.

### Process ID Mapping (key processes)
```javascript
paper:              73    corrugated:          145
plate:              74    plate_turn_back:     75
print:              76    print_turn_back:     77
proof:              81    coating:             34
foilstamp:          35    block_foilstamp:     99
emboss:             36    block_emboss:        100
deboss:             37    block_deboss:        101
diecut:             3     block_diecut:        98
digital_diecut:     80    corrugated_glue:     17
chip:               17    inspection:          82
assembly:           104   trim:                2
kraftwrap:          39    paperband:           38
carton:             40    pallet:              41
material:           65    other_process:       139
handwork:           63    outsource:           64
delivery:           60    special_ink:         78
```

### Unit Mapping
```javascript
pcs: 1, kg: 2, g: 3, mm: 4, cm: 5, inch: 6,
set: 7, tons: 8, ml: 9, L: 10, paperband: 11,
kraft wrap: 12, carton: 13, pallet: 14, unit: 15,
job: 16, roll: 17, box: 18, sheet: 19, plate: 20,
shipment: 21, minutes: 22, block: 23
```

---

## Summary: Key Calculation Flow

```
1. User inputs: box type, dimensions (w,l,d + optional: tuck, glue, dust, ol)
2. System calculates:
   a. Fold Size = physical folded box size
   b. Open Size = flat/unfolded sheet size (the "die line")
   c. Packing Size = footprint for packing calculation
3. Layout Calculation:
   a. Get available paper/machine sizes
   b. Try all layout orientations (vertical/horizontal + straight/overlap)
   c. Add paper tolerances (gripper, color_bar, paper_edge, bleed)
   d. Find maximum ups that fits within paper & machine limits
   e. Select optimal layout (max ups, min waste area)
4. Paper Usage:
   a. after_ups = ceil(total_qty / ups)
   b. Waste = base + color + afterpress + coating + foil + emboss
   c. paper_print = after_ups + waste
   d. Paper cost = paper_print * paper_unit_price
5. Price Calculation:
   a. Plate cost (per color)
   b. Print cost (rate lookup by qty)
   c. Coating/foil/emboss costs
   d. Die-cut cost (labor + block)
   e. Assembly cost
   f. Packing cost (kraftwrap + paperband + carton + pallet)
   g. Delivery cost
   h. Apply markups
   i. Total price + tax
```

---

## Files Referenced

All source files are located at: `d:\Pornchai AI RFQ\`

- `js_data_default.js` - Complete default configuration
- `js_function_estimate_calculation.js` - Core Estimate class (~5000+ lines)
- `js_function_estimate.js` - UI functions (~6000+ lines)
- `js_function_estimate_getMasterData.js` - Master data queries
- `js_function_estimate_fetchData.js` - API calls
- `js_function_estimate_layout.js` - Alternative layout engine
- `js_function_estimate_database.js` - Database class
- `js_function_estimate_validate.js` - Validation rules
- `js_commonFunction.js` - Utility functions
- `js_function_estimate_processInfo.js` - Process info builder
- `js_function_estimate_displayData2UI.js` - UI display functions
- `js_function_estimate_readyFunction.js` - Initialization
- `js_data_mockup.js` - Test data
- `js_prepare_data.js` - Data preparation
- `js_print-pdf.js` - PDF generation
- `js_documentStatusManagerClass.js` - Status management
- `js_estimateHistoryClass.js` - History tracking
