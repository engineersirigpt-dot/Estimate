# Sirivatana Interprint - Estimate Packaging System API Documentation

> **System Version:** 3.1
> **Last Updated:** 2026-03-11
> **Base Network:** 192.168.5.x (Internal LAN)

---

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    SYSTEM OVERVIEW                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Frontend - Express]    http://192.168.5.3:3040             │
│       │                  HTML + jQuery + Axios + DataTables   │
│       │                                                      │
│       ├── [Node.js API]  http://192.168.5.3:3010   (หลัก)   │
│       │                  REST API สำหรับ CRUD ทั้งหมด        │
│       │                                                      │
│       ├── [PHP API]      http://192.168.5.3:80               │
│       │                  Apache 2.2.8 / PHP 5.2.6 (Win32)   │
│       │                  Path: /estimate_packaging           │
│       │                                                      │
│       ├── [Report API]   http://192.168.5.3:3051             │
│       │                  Javascript Report Generator         │
│       │                  Path: /estimate                     │
│       │                                                      │
│       └── [Wizard API]   http://192.168.5.3:3060             │
│                          Estimate Wizard Service             │
│                          Path: /api/estimate-wizard/*        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Server Details

| Server | IP:Port | Technology | Description |
|--------|---------|------------|-------------|
| **Frontend** | `192.168.5.3:3040` | Express (Node.js) | Web UI หลัก, serve static files, จัดการ cookie/session |
| **Node API** | `192.168.5.3:3010` | Node.js REST API | API หลักสำหรับทุก operation (CRUD RFQ, Master Data, Auth) |
| **PHP API** | `192.168.5.3:80` | Apache 2.2.8 / PHP 5.2.6 | Legacy API, path: `/estimate_packaging/controllers/estimate.php` |
| **Report API** | `192.168.5.3:3051` | Node.js | สร้างรายงาน PDF, path: `/estimate` |
| **Wizard API** | `192.168.5.3:3060` | Node.js | Estimate Wizard (AI-assisted estimate), path: `/api/estimate-wizard/*` |

---

## 3. Authentication

### 3.1 Login

```
POST http://192.168.5.3:3010/user/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "2690006",
  "password": "xxxxxxxx"
}
```

**Response (Success):**
```json
{
  "success": 1,
  "user": {
    "username": "2690006",
    "success": true,
    "message": "success",
    "isPassed": 1,
    "data": [
      {
        "emp_name": "ธนรัช ชื้อผาสุข",
        "emp_id": "2690006",
        "user_expired": 0
      }
    ],
    "roles": [
      {
        "user_group_id": 1,
        "sale_group_id": null,
        "enable_price_check": 1,
        "is_super_admin": 0,
        "authorized": 1
      }
    ]
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Token Details:**
- `accessToken`: JWT, หมดอายุ 15 นาที (900 วินาที)
- `refreshToken`: JWT, หมดอายุ 30 วัน
- Algorithm: HS256

### 3.2 Set Cookie (Frontend)

```
POST http://192.168.5.3:3040/set-cookie
Content-Type: application/json
```

**Request Body:**
```json
{
  "emp_id": "2690006",
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### 3.3 Using Token in API Calls

ใส่ token ใน Header ทุกครั้งที่เรียก API:

```
Authorization: Bearer <accessToken>
```

---

## 4. API Endpoints - Node.js API (Port 3010)

### 4.1 RFQ List (ดูรายการ RFQ)

```
POST http://192.168.5.3:3010/estimate/list
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "limit": 50,
  "user_group_id": [1],
  "sale_group_id": [null],
  "est_type": "packaging"
}
```

**Request Body (with search):**
```json
{
  "limit": 500,
  "user_group_id": [1],
  "sale_group_id": [null],
  "est_type": "packaging",
  "search": {
    "job_id": "",
    "job_name": "",
    "ae_name": "",
    "customer_name": "",
    "status_id": "",
    "start_date": "2026-03-01",
    "end_date": "2026-03-11",
    "is_profit_sharing": ""
  }
}
```

**Response:** `[ [array_of_rfq_records], [array_for_export] ]`

**RFQ Record Fields:**
```json
{
  "ref_copy_rfq": "",
  "job_id": "E26030014",
  "job_no": 6030014,
  "job_name": "Test 001",
  "customer_name": "IMAGO PUBLISHING",
  "customer_no_name": "C1020001 : IMAGO PUBLISHING",
  "ae_name": "ศรวณีย์ อ่อนน้อม",
  "ae_no_name": "2640038 : ศรวณีย์ อ่อนน้อม",
  "estimator_name": "ศรวณีย์ อ่อนน้อม",
  "updated_by": "ศรวณีย์ อ่อนน้อม",
  "created_by": "ศรวณีย์ อ่อนน้อม",
  "team_name": "อื่นๆ (ไม่ระบุ)",
  "job_qty": "7500",
  "qty_customer": 0,
  "qty_ae": 0,
  "total_price": "20431.7",
  "unit_price": "2.72",
  "is_profit_sharing": "No",
  "approve_status": "Approve",
  "created": "10/03/26",
  "created_datetime": "2026-03-10 15:51:11",
  "updated": "2026-03-10 15:52:45",
  "request_approve_datetime": "2026-03-10 15:51:44",
  "request_by": "ศรวณีย์ อ่อนน้อม",
  "approved": 1,
  "estimate_check": 1,
  "status_id": 3,
  "is_loss": 0,
  "remark": "",
  "log_data": "{...JSON...}",
  "mi_status_id": 0,
  "mi_doc_id": ""
}
```

---

### 4.2 RFQ Detail (ดูรายละเอียด RFQ)

```
POST http://192.168.5.3:3010/estimate/rfq
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "rfq_id": "E26030014",
  "type": "packaging"
}
```

**Response:**
```json
{
  "job_id": "E26030014",
  "job_data": "{...JSON string ของข้อมูลทั้งหมด...}",
  "estimate_date": "2026-03-10",
  "ref_copy_rfq": "",
  "estimate_check": 1,
  "open_job_status": null,
  "mi_job_id": null
}
```

> **Note:** `job_data` เป็น JSON string ที่ต้อง parse อีกครั้ง ภายในมีโครงสร้างครบทั้ง job, ae, customer, qty, delivery, process, material, component1

---

### 4.3 Save/Create RFQ (สร้าง/แก้ไข RFQ)

```
POST http://192.168.5.3:3010/estimate/save_rfq
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body (Full Structure):**
```json
{
  "action": "new | update",
  "job_id": "",
  "ref_copy_rfq": "",

  "tb_rfq": {
    "job_name": "ชื่องาน",
    "doc_type": "est",
    "customer_id": "C1020001",
    "sale_id": "2640038",
    "estimator_id": "2640038",
    "estimate_check": true,
    "is_reprinted": 0,
    "ink_type": "UV",
    "print_type": "Offset",
    "flexo_size": null,
    "qty_customer": 0,
    "qty_ae": 0,
    "tax": 7,
    "updated_by": "2690006",
    "remark": "",
    "is_use_previous_plate": 0,
    "is_multiple_f": 0,
    "is_different_packing": 0,
    "is_loss": 0,
    "is_profit_sharing": 0,
    "status_id": 3
  },

  "tb_rfq_list": {
    "job_name": "ชื่องาน",
    "doc_type": "est",
    "customer_id": "C1020001",
    "sale_id": "2640038",
    "estimator_id": "2640038",
    "estimate_check": true,
    "updated_by": "2690006",
    "remark": "",
    "is_multiple_version": 0,
    "is_different_packing": 0,
    "is_loss": 0,
    "is_profit_sharing": 0,
    "status_id": 3,
    "est_type": "packaging",
    "log_data": "{...JSON...}",
    "credit_term_id": "QT000113",
    "credit_term_name": "Credit 120 days"
  },

  "tb_rfq_qty": [],
  "tb_rfq_price": [],
  "tb_rfq_component_price": [],
  "tb_rfq_component_paper": [],
  "tb_rfq_component_spec": [],
  "tb_rfq_component_layout": [],
  "tb_rfq_log": {
    "job_data": "{...JSON string...}",
    "edited_by": "2690006"
  },
  "tb_rfq_item": [],
  "tb_rfq_paper": [],
  "tb_rfq_corrugated": [],
  "tb_rfq_material": [],
  "tb_rfq_foilstamp": [],
  "tb_rfq_bossing": [],
  "tb_rfq_coating": [],
  "tb_rfq_special_ink": [],
  "tb_rfq_waste": [],
  "tb_rfq_paperusage": [],
  "tb_rfq_paperband": [],
  "tb_rfq_kraftwrap": [],
  "tb_rfq_carton": [],
  "tb_rfq_pallet": [],
  "tb_rfq_delivery": [],
  "tb_rfq_subitem": [],
  "tb_rfq_other": [],
  "tb_rfq_file": [],
  "tb_rfq_delivery_new": [],
  "tb_rfq_f": [],
  "tb_rfq_f_other": [],
  "tb_rfq_color": [],
  "tb_rfq_status_log": {
    "job_id": "",
    "emp_id": "2690006",
    "from_status_id": 0,
    "to_status_id": 3,
    "remark": ""
  },
  "tb_rfq_delivery_head": [],
  "tb_rfq_delivery_detail": [],
  "tb_rfq_process_price": [],
  "tb_rfq_carton_info": []
}
```

**Response (Success):**
```json
{
  "success": true
}
```

---

### 4.4 Autocomplete APIs (ค้นหาอัตโนมัติ)

#### Customer Search
```
GET http://192.168.5.3:3010/estimate/autocomplete?type=customer
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "C1020001",
    "name": "IMAGO PUBLISHING",
    "label": "C1020001: IMAGO PUBLISHING",
    "value": "C1020001: IMAGO PUBLISHING",
    "credit_term_id": "QT000113",
    "credit_term_name": "Credit 120 days"
  }
]
```

#### Employee Search (AE / Estimator)
```
GET http://192.168.5.3:3010/estimate/autocomplete?type=employee
Authorization: Bearer <token>
```

#### Delivery Destination Search
```
GET http://192.168.5.3:3010/estimate/autocomplete?type=delivery
Authorization: Bearer <token>
```

---

### 4.5 Customer Detail

```
GET http://192.168.5.3:3010/estimate/customer?customer_id=C1020001
Authorization: Bearer <token>
```

---

### 4.6 Employee Status

```
GET http://192.168.5.3:3010/estimate/emp_status?emp_id=2690006
Authorization: Bearer <token>
```

---

### 4.7 RFQ Status Log

```
GET http://192.168.5.3:3010/estimate/rfq/status/log?rfq_id=E26030014&status_id=3
Authorization: Bearer <token>
```

---

### 4.8 File Management

#### Upload File
```
POST http://192.168.5.3:3010/estimate/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### Check File Exists
```
GET http://192.168.5.3:3010/estimate/file/<file_id>
Authorization: Bearer <token>
```

#### Delete File
```
DELETE http://192.168.5.3:3010/estimate/upload/<file_id>
Authorization: Bearer <token>
```

---

### 4.9 RFQ History

```
GET http://192.168.5.3:3010/estimate/history?job_id=E26030014
Authorization: Bearer <token>
```

---

## 5. Master Data APIs (Port 3010)

```
GET http://192.168.5.3:3010/estimate/master_data?type=<TYPE>
Authorization: Bearer <token>
```

### Master Data Types

| Type Parameter | Description | Data Size |
|---------------|-------------|-----------|
| `paper_info&estimate_type=packaging` | ข้อมูลกระดาษทั้งหมด | ~406 KB |
| `coating_info&estimate_type=packaging` | ข้อมูลการเคลือบ | ~19 KB |
| `corrugated_info&estimate_type=packaging` | ข้อมูลกระดาษลูกฟูก | ~467 KB |
| `foilstamp_info` | ข้อมูลฟอยล์สแตมป์ | ~8.5 KB |
| `blockstamp_info` | ข้อมูลบล็อกสแตมป์ | ~0.6 KB |
| `price_info` | ข้อมูลราคา (plate, print, process) | ~66 KB |
| `min_price_info` | ราคาขั้นต่ำ | ~4 KB |
| `waste_info` | ข้อมูลเปอร์เซ็นต์เสีย (waste) | ~81 KB |
| `blockdiecut_info` | ข้อมูลบล็อกไดคัท | ~1.3 KB |
| `boxtemplate_info` | รูปแบบกล่อง (12 แบบ) | ~2.3 KB |
| `specialink_info` | ข้อมูลหมึกพิเศษ | ~0.9 KB |
| `specialink_factor_info` | ค่า factor หมึกพิเศษ | ~4.2 KB |
| `jetpress_waste_info` | ข้อมูล waste สำหรับ Jetpress | ~0.8 KB |
| `jetpress_info` | ข้อมูลเครื่อง Jetpress | ~4.2 KB |
| `marking_price_info` | ข้อมูล mark up/down | ~0.9 KB |
| `machine_std_paper_info` | ขนาดกระดาษมาตรฐานตามเครื่อง | ~56 KB |
| `delivery_rate_info` | อัตราค่าจัดส่ง | ~37 KB |
| `paper_code_type` | ประเภทกระดาษ (10 ประเภท) | ~0.5 KB |
| `process_type` | ประเภท process (18 ประเภท) | ~1 KB |
| `price_type` | ประเภทราคา | ~0 (empty) |
| `konica_waste_info` | ข้อมูล waste สำหรับ Konica | ~1.2 KB |
| `exchange_rate` | อัตราแลกเปลี่ยน (8 สกุล) | ~0.5 KB |

---

## 6. Wizard API (Port 3060)

### 6.1 Get Wizard Data

```
GET http://192.168.5.3:3060/api/estimate-wizard/wizard?id=<wizard_id>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": "{...JSON string...}"
  }
}
```

**Wizard Data Structure (parsed):**
```json
{
  "projectName": "ชื่อโปรเจกต์",
  "boxTypeName": "ชื่อกล่อง",
  "boxType": 12,
  "materials": ["paper"],
  "colors": {
    "outside": 4,
    "inside": 0,
    "special_ink": 0
  },
  "customSize": {
    "width": 178,
    "length": 305
  },
  "quantity": 7500,
  "paperSelected": [
    {
      "id": "AC",
      "name": "Art Card",
      "gram": 350,
      "category": "paper"
    }
  ],
  "finishing": {
    "coating": { "type": "varnish", "option": "gloss", "side": "outside" },
    "foilStamping": { "isChecked": false, "size": [], "color": "" },
    "embossing": { "isChecked": false, "size": [] },
    "debossing": { "isChecked": false, "size": [] }
  }
}
```

### 6.2 Search Wizard List

```
GET http://192.168.5.3:3060/api/estimate-wizard/list?search=<keyword>
Content-Type: application/json
```

---

## 7. Report API (Port 3051)

```
GET http://192.168.5.3:3051/estimate
```

> ใช้สำหรับสร้างรายงาน PDF ของ Estimate

---

## 8. PHP API (Port 80)

```
GET http://192.168.5.3/estimate_packaging/controllers/estimate.php
```

> Legacy API, ใช้สำหรับบาง operation เก่า

---

## 9. Reference Data

### 9.1 Process Types (ประเภท Process)

| process_type_id | process_type_name | คำอธิบาย |
|----------------|-------------------|----------|
| 1 | plate | เพลท |
| 2 | print | พิมพ์ |
| 3 | coating | เคลือบ |
| 4 | foilstamp | ฟอยล์สแตมป์ |
| 5 | emboss | ปั๊มนูน |
| 6 | deboss | ปั๊มจม |
| 7 | afterpress / process | งานหลังพิมพ์ |
| 8 | other | อื่นๆ |
| 9 | handwork | งานมือ |
| 10 | material | วัสดุ |
| 11 | packing | บรรจุหีบห่อ |
| 12 | delivery | จัดส่ง |
| 13 | otherMaterial | วัสดุอื่นๆ |
| 14 | proof | พิสูจน์บท |
| 16 | extend | ขยาย |
| 17 | outsource | จ้างภายนอก |
| 18 | acetate | อะซิเตท |

### 9.2 Box Templates (รูปแบบกล่อง)

| type_id | type_name | type_name_th | packing_layer | glued_spot |
|---------|-----------|-------------|---------------|------------|
| 1 | Reverse Tuck End | กล่องฝาคู่ แบบฝาสลับ | 3 | 1 |
| 2 | Straight Tuck End | กล่องฝาคู่ แบบฝาตรง | 3 | 1 |
| 3 | Tuck Top Snap Lock Bottom (TTSLB) | กล่องออโต้ล็อคแบบหูขัด | 3 | 1 |
| 4 | Tuck Top Auto Bottom (TTAB) | กล่องออโต้ล็อคแบบทากาว | 5 | 3 |
| 5 | Double Glue Side Wall (Simple Tray) | กล่องฝาครอบ | 1 | 0 |
| 6 | Frame-Vue Tray | กล่องฝาครอบ มีขอบ | 1 | 0 |
| 7 | Four Corner Beers Tray with Lid | กล่องเบนโตะ | 6 | 0 |
| 8 | Gable Top with Auto Bottom | กล่องทรงจั่ว | 4 | 3 |
| 9 | Sleeve | ปลอกกล่อง | 3 | 1 |
| 10 | Pillow Box | กล่องทรงหมอน | 3 | 1 |
| 11 | Seal End | กล่องฝาปิดแบบทากาว | 3 | 1 |
| 12 | Custom | รูปแบบกล่องกำหนดเอง | 2 | 0 |

### 9.3 Paper Types (ประเภทกระดาษ)

| paper_code | paper_type |
|-----------|------------|
| AC | Art Card |
| Dup | Duplex |
| FCY | Fancy |
| GA | Gloss Art |
| - | Grey Board |
| K | Kraft |
| MA | Matt Art |
| MCA | Matt Card |
| WC | White Card |
| B | Woodfree |

### 9.4 Exchange Rates (อัตราแลกเปลี่ยน)

| currency_no | exchange_rate |
|-------------|--------------|
| THB | 1 |
| USD | 33.73 |
| GBP | 42.43 |
| EUR | 35.27 |
| YEN(:100) | 22.34 |
| AUD | 21.57 |
| NZD | 19.39 |
| SGD | 25.25 |

### 9.5 Print Types

| Value | Description |
|-------|-------------|
| `Offset` | พิมพ์ออฟเซ็ท |
| `Flexo` | พิมพ์เฟล็กโซ |

### 9.6 Ink Types

| Value | Description |
|-------|-------------|
| `UV` | หมึก UV |
| `Conventional` | หมึกธรรมดา |

---

## 10. Key Data Structures

### 10.1 est.mainData (Core Data Object)

```json
{
  "job": {
    "job_name": "ชื่องาน",
    "job_id": "E26030014",
    "ref_copy_rfq": "",
    "is_reprinted": 0,
    "ink_type": "UV",
    "print_type": "Offset",
    "flexo_size": null,
    "is_multiple_f": false,
    "is_use_previous_plate": false,
    "is_profit_sharing": false,
    "is_loss": false,
    "credit_term_id": "QT000113",
    "credit_term_name": "Credit 120 days",
    "color_limit": [{ "is_color_limit": false, "qty": 0 }]
  },
  "ae": {
    "ae_id": "2640038",
    "ae_name": "ชื่อ AE"
  },
  "customer": {
    "customer_id": "C1020001",
    "customer_name": "IMAGO PUBLISHING"
  },
  "estimator": {
    "estimator_id": "2640038",
    "estimator_name": "ชื่อ Estimator",
    "estimate_check": true,
    "approve_status": "3"
  },
  "qty": {
    "main": [7500],
    "runon": [0],
    "customer": 0,
    "ae": 0,
    "runon_percent": 0,
    "totalqty": [7500]
  },
  "remark": "",
  "tax": 7,
  "currency_no": "THB",
  "exchange_rate": 1,
  "date": {
    "create_date": "2026-03-10"
  },
  "component1": ["...see 10.2..."],
  "process": ["...see 10.3..."],
  "delivery": ["...see 10.4..."],
  "material": [],
  "totalprice": ["...see 10.5..."],
  "priceDiff": []
}
```

### 10.2 Component Structure (component1[])

```json
{
  "component_name": "box",
  "component_type": { "type": 1 },
  "box_type": {
    "type_id": 12,
    "type_name": "Custom",
    "glued_spot": 0,
    "is_digital_diecut": false,
    "packing_layer": 2
  },
  "color": [{
    "outside": 4,
    "inside": 0,
    "all": 4,
    "f_code": "",
    "is_special_ink": false,
    "special_ink": []
  }],
  "packaging_size": {
    "width": 178,
    "length": 305,
    "depth": 0,
    "glue_flap": 15,
    "tuck_flap": 15,
    "dust_flap": 0,
    "ol": 0,
    "fold_size": [7.01, 12.01, 0, 178, 305, 0],
    "open_size": [7.01, 12.01, 178, 305],
    "packing_size": [7.01, 12.01, 178, 305]
  },
  "paper": {
    "paper_code": "AC",
    "paper_gram": 350,
    "paper_markup": 0,
    "paper_percent": 0,
    "paper_cost": 0,
    "paper_total_price": 0,
    "paper_thickness": 0,
    "is_custom": false,
    "sheet_unit_price": false,
    "remark": ""
  },
  "corrugated_layer": {},
  "layout": {
    "laySize": [],
    "selected_layout": { "layout": [0, 0] },
    "layout_grain": "",
    "is_editLayout": false,
    "std_layout_id": null
  },
  "paper_usage": { "ups": 0, "sig": 0, "split": 0 },
  "paper_info": {
    "roll_width": 0,
    "cut_off": 0,
    "paper_grain": "",
    "paper_align": "",
    "std_paper_id": null
  },
  "paper_tolerance": {
    "gripper": 0,
    "color_bar": 0,
    "paper_edge": 0,
    "bleed": 0,
    "is_editTolerance": false
  },
  "machine": { "machine_size": { "id": "" } },
  "thickness": { "mm": { "thickness": 0, "packing_thickness": 0 } },
  "weight": { "weight": 0 },
  "gram": 0,
  "paperSize": [0, 0, 0, 0],
  "process": [],
  "addon": [],
  "packing": [[]]
}
```

### 10.3 Process Structure

```json
{
  "type_id": 7,
  "process_id": 22,
  "type": "afterpress",
  "name": "chip",
  "info": {},
  "line": [
    {
      "qty": 7500,
      "unit_price": 0.12829,
      "price": 962.17
    }
  ]
}
```

### 10.4 Delivery Structure

```json
{
  "round": 1,
  "destinationId": 63,
  "destinationName": "ลูกค้ามารับเอง",
  "dueDate": null,
  "detail": [{
    "componentId": 0,
    "f_code": "",
    "fIndex": 0,
    "qty": 7500,
    "totalqty": [7500],
    "total_weight": [{
      "qty": 4,
      "unit_price": 39,
      "price": 156,
      "compQty": 7500,
      "gross_weight": 16,
      "total_weight": 64,
      "packArr": [4],
      "qtyArr": [7500]
    }]
  }],
  "net_weight": 64,
  "qty_rate": [[{
    "net_weight": 64,
    "rate_id": 1257,
    "unit_price": 0,
    "qty": 1,
    "additional_price": 0,
    "price": 0
  }]]
}
```

### 10.5 Total Price Structure

```json
{
  "material": 0,
  "plate": 0,
  "print": 0,
  "afterpress": 0,
  "delivery": 0,
  "total_price": 0,
  "final_price": 0,
  "unit_price": 0,
  "tax": 0,
  "customer_gift": 0,
  "price_diff": 0,
  "marking_percent": 0,
  "mark_up_percent": 0,
  "mark_down_percent": 0,
  "mark_up_price": 0,
  "mark_down_price": 0,
  "loss": 0,
  "profit_sharing": 0
}
```

---

## 11. Frontend JavaScript Files

### Core Files

| File | Lines | Description |
|------|-------|-------------|
| `function_estimate.js` | 13,585 | ฟังก์ชันหลักทั้งหมดของหน้า Estimate |
| `function_estimate_calculation.js` | 8,819 | สูตรคำนวณราคาทั้งหมด |
| `prepare_data.js` | 3,590 | เตรียมข้อมูลก่อน save (prepareDatatoDB) |
| `function_estimate_validate.js` | 1,836 | ตรวจสอบความถูกต้องข้อมูล |
| `function_estimate_processInfo.js` | 967 | ข้อมูล process ต่างๆ |
| `function_index.js` | 619 | หน้า RFQ List (fetch, search, CRUD) |
| `commonFunction.js` | 567 | ฟังก์ชันทั่วไป (getDataRFQ, setDataRFQ) |
| `function_estimate_getMasterData.js` | 467 | ดึง master data จาก dropdown |
| `function_estimate_fetchData.js` | 141 | ฟังก์ชัน fetch ข้อมูลจาก API |
| `function_estimate_database.js` | 43 | database helper |

### Support Files

| File | Description |
|------|-------------|
| `function_estimate_readyFunction.js` | Document ready, โหลด master data ทั้งหมด |
| `function_estimate_layout.js` | คำนวณ layout กระดาษ |
| `function_estimate_displayData2UI.js` | แสดงข้อมูลบน UI |
| `function_pdf_estimate_spec.js` | สร้าง PDF spec |
| `documentStatusManagerClass.js` | จัดการสถานะเอกสาร |
| `estimateHistoryClass.js` | ประวัติการแก้ไข |
| `auth-interceptor.js` | จัดการ token refresh |
| `data/default.js` | ค่า default ของระบบ |
| `data/mockup.js` | ข้อมูล mockup สำหรับทดสอบ |

---

## 12. Status Flow

| status_id | Status Name | Description |
|-----------|-------------|-------------|
| 0 | Draft | ร่าง |
| 1 | Pending | รอดำเนินการ |
| 2 | Request for Approve | ส่งขออนุมัติ |
| 3 | Approve | อนุมัติแล้ว |

---

## 13. Quick Start - API Testing with cURL

### Login & Get Token
```bash
TOKEN=$(curl -s -X POST http://192.168.5.3:3010/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"2690006","password":"YOUR_PASSWORD"}' \
  | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
```

### List RFQ (Latest 50)
```bash
curl -s -X POST http://192.168.5.3:3010/estimate/list \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"limit":50,"user_group_id":[1],"sale_group_id":[null],"est_type":"packaging"}'
```

### Get RFQ Detail
```bash
curl -s -X POST http://192.168.5.3:3010/estimate/rfq \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"rfq_id":"E26030014","type":"packaging"}'
```

### Search Customer
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://192.168.5.3:3010/estimate/autocomplete?type=customer"
```

### Get Master Data
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://192.168.5.3:3010/estimate/master_data?type=boxtemplate_info"
```
