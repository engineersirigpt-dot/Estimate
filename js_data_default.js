const defaultData = {
	tolerance: {
		bleed: 3,
		color_bar: 8,
		gripper: 12,
		paper_edge: 4
	},
	color_limit: {
		max_color: 4,
		paper_waste: 300, //* 100 -> 300 22/02/23
		paper_waste_per_color: 50,
		jetpress_paper_waste: 150,
		jetpress_paper_waste_per_color: 20
	},
	special_customer_marking: 7, //* 7% extended
	paper_price_marking: 10, //* default 10% profit sharing 18%
	import_paper_price_marking: 13, //* default 13% profit sharing 18%
	addon_labor_price_marking: 20,
	afterpress_price_marking: 0,
	material_price_marking: 0,
	outsouce_price_marking: 0,
	packing_marking: 0, //* 0%
	delivery_marking: 0, //* 0%
	marking_total_price: {
		min: 0,
		percent: 0
	},
	profit_sharing: {
		plate_price: 1875, //* THB/color
		paper: {
			marking_price: 18, //* percent
		},
		print: {
			min_paper_qty: 10000,
			print_rate: 0.14,
			print_min_price: 1400
		},
		afterpress_price_marking: 20, //*percent 27.03.23
		material_price_marking: 25, //*percent
		outsouce_price_marking: 25, //*percent
		total_price_marking: 5, //*percent
		corrugated_markup: 20,
		packing_marking: 25, //* 25%
		delivery_marking: 20, //* 20%
		marking_total_price: {
			min: 5000,
			percent: 5
		}
	},
	default_marking: {
		plate_price: 800, //* THB/color
		paper: {
			marking_price: 10, //* percent
			import_marking_price: 13,
		},
		addon_labor_price_marking: 20, //*percent
		afterpress_price_marking: 0, //*percent
		material_price_marking: 0, //*percent
		outsouce_price_marking: 0, //*percent
		total_price_marking: 0, //*percent
		corrugated_markup: 10,
		packing_marking: 0, //* 0%
		delivery_marking: 0, //* 0%
		marking_total_price: {
			min: 0,
			percent: 0
		}
	},
	cut_1_plate_markup: 50, //THB
	plate_price: 800, //* revise 700-> 800 (+100 Digital Proof) revise date: Aug 4,2021
	/* 
	 ? plate_polymer_price -- THB/sqin // 10/03/22 +10% = 5.94 // 07/07/23 +10% = 6.53
	 ? 09/04/25 - 6.53 - 10% = 5.94 THB/sqin (เฉพาะงาน reprint)
	*/
	plate_polymer_price: 6.53,
	reprint_plate_polymer_price: 5.94,
	block_polymer_min_price: 50,
	reprintReducePlateCostPercent: 50, //* 50%
	// edge_paper:4,
	formula_value: 1550000,
	corrugated_tolerance: 0.375,
	corrugated_markup: 10, //* markup price 5%
	corrugated_glued_cost: 0.0015,//THB/sqinch update:22.03.22
	corrugated_assembly_markup_price: 0.1, //* THB update:14.03.24
	coating_opp_cold_film_cost_sqin: 0.0103,
	coating_opp_cold_film_min_price: 0,

	//* jet press config
	print_type_config: {
		selected: "Offset",
		"Offset": {
			print_type_id: 1,
			type: 'Offset',
			gsm: {
				min: 0,
				max: 50000
			},
			paperType: [],
			color: [
				[4, 0],
				[4, 4]
			],
			isHasSpecialInk: true,
			proof_price_per_component: 500,
			tolerance: {
				gripper: 12,
				color_bar: 8,
				paper_edge: 4,
				bleed: 3,
			},
			print_min_price: 0,
			reduce_paper_waste_percent: 0,
			color_limit_waste: {
				waste: 300,
				waste_per_color: 50
			},
			component_type: [1, 2, 3]
		},
		"Flexo": {
			print_type_id: 2,
			type: 'Flexo',
			gsm: {
				min: 0,
				max: 50000
			},
			paperType: [],
			color: [
				[4, 0],
				[4, 4]
			],
			isHasSpecialInk: true,
			proof_price_per_component: 500,
			tolerance: {
				gripper: 25, //mm  08.01.26 ref: พี่ม่อนแจ้งว่าใช้ขนาดเท่านี้ได้
				color_bar: 3,
				bleed: 3,
				paper_edge: 4

				// paper_edge: 10, /* แก้ไขยึดตามเอกสารที่มี */
				// bleed: 3,
				// gripper: 0,
				// color_bar: 0,
			},
			print_min_price: 0,
			reduce_paper_waste_percent: 0,
			color_limit_waste: {
				waste: 300,
				waste_per_color: 50
			},
			component_type: [3]
		},
		"Jet Press": {
			print_type_id: 3,
			type: 'Jet Press',
			gsm: {
				min: 190,
				max: 500
			},
			paperType: ['A/C C1s', 'A/C C2s', 'W/C', 'Duplex BBB', 'Duplex GBB', 'Duplex WBB'],
			color: [
				[4, 0],
				[4, 4]
			],
			isHasSpecialInk: false,
			proof_price_per_component: 500,
			tolerance: {
				gripper: 25, //mm
				color_bar: 3,
				bleed: 3,
				paper_edge: 4
			},
			print_min_price: 0,
			reduce_paper_waste_percent: 30,
			color_limit_waste: {
				waste: 150,
				waste_per_color: 20
			},
			component_type: [1, 2]
		},
		"Konica": {
			print_type_id: 4,
			type: 'Konica',
			gsm: {
				min: 60,
				max: 350
			},
			paperType: [
				'A/C C1s', 'A/C C2s', 'W/C',
				'Woodfree', 'Gloss Art',
				'Matt Art',
				'PP Gloss K-tek ( Sticker )',
				'PP Matt K-tek ( Sticker )',
				'PP Clear K-tek ( Sticker )',
				'PP Gloss SL ( Sticker )',
				'PP Matt SL ( Sticker )',
			],
			color: [
				[4, 0],
				[4, 4],
			],
			isHasSpecialInk: false,
			proof_price_per_component: 200,
			tolerance: {
				gripper: 35, //mm
				color_bar: 0,
				bleed: 3,
				paper_edge: 15
			},
			print_min_price: 0,
			reduce_paper_waste_percent: 30,
			reduce_paper_waste_percent_digital_diecut: 20,
			color_limit_waste: {
				waste: 150,
				waste_per_color: 20
			},
			component_type: [1]
		},
		getPrintTypeConfig: function () {
			return this[this.selected];
		},
		setPrintTypeConfig: function (type) {
			this.selected = type;
		}
	},
	//ยิงฟิล์ม foil stmamp, bossing
	film_rate: 1.25, //THB/sqinch
	film_min_cost: 120,

	//foil stamp
	foil_width_tolerance: 0.5, //inch
	foil_length_tolerance: 1,	//inch
	foilstamp_price: 0.8, //THB/sheet ค่าแรง foilstamp
	block_foilstamp_min_cost: 70, //THB/ตัว

	//bossing
	bossing_price: 0.8, //THB/sheet ค่าแรง ปั๊มจม ปั๊มนูน


	//Die cut rate
	reprinted_block: 500,


	assembly_size: [
		{
			width: 9,
			length: 11,
			type: 'assembly_S'
		},
		{
			width: 21,
			length: 31,
			type: 'assembly_M'
		},
		{
			width: 27,
			length: 39,
			type: 'assembly_L'
		}
	],
	a3_size: [
		parseFloat((Math.ceil(297 / 25.4 * 100) / 100).toFixed(2)),
		parseFloat((Math.ceil(420 / 25.4 * 100) / 100).toFixed(2)),
		297,
		420
	],
	tax: 0.03,
	tax_percent: 3,
	paperband: [
		{
			type: 'white_paper',
			price: 100,
			length: 100, //metre
			width: 30, //mm
			thickness: 0.2 //mm
		},
		{
			type: 'brown_paper',
			price: 100,
			length: 100, //metre
			width: 30, //mm
			thickness: 0.2 //mm
		},
		{
			type: 'plastic',
			price: 100,
			length: 100, //metre
			width: 30, //mm
			thickness: 0.2 //mm
		}
	],
	machine: [
		{
			machine_id: 9998,
			machine_name: "-",
			max_size: [99, 99, 2514.6, 2514.6],
			min_size: [0, 0, 0, 0],
			w_range: [0, 99, 0, 2514.6],
			l_range: [0, 99, 0, 2514.6],
			size_options: [],
			machine_size: {
				id: 9998,
				name: "-",
				split: 1
			},
			std_paper: [],
			print_type: ["Offset", "Flexo", "Jet Press", "Konica"],
			compType: [1, 2, 3],
			color: {
				min: 0,
				max: 0
			}
		},
		{
			machine_id: 3422,
			machine_name: "L444SP",
			max_size: [33, 45.275, 840, 1150],
			min_size: [18.11, 24.41, 460, 620.01],
			// [หน้ากว้างต่ำสุด  ,  หน้ากว้างสูงสุด  ,  ...]
			w_range: [18.11, 33, 460, 840],
			// [หน้ายาวต่ำสุด  ,  หน้ายาวสูงสุด  ,  ...]
			l_range: [24.41, 45.275, 620.01, 1150],
			size_options: [],
			machine_size: {
				id: 1,
				name: "Cut 1",
				split: 1,
			},
			std_paper: [],
			print_type: ["Offset"],
			compType: [1, 2],
			color: {
				min: 0,
				max: 8
			}
		},
		{
			machine_id: 3407,
			machine_name: "L440",
			max_size: [28.35, 40.56, 720.09, 1030.22],
			min_size: [14.18, 20.48, 360.17, 520.19],
			w_range: [14.18, 28.35, 360.17, 720.09],
			l_range: [20.48, 40.56, 520.19, 1030.22],
			size_options: [],
			machine_size: {
				id: 2,
				name: "Cut 2",
				split: 2
			},
			std_paper: [],
			print_type: ["Offset"],
			compType: [1, 2],
			color: {
				min: 0,
				max: 6
			}
		},
		{
			machine_id: 3507,
			machine_name: "LS1029",
			max_size: [20.87, 29.53, 530.1, 750.06],
			min_size: [10.24, 14.18, 260.09, 360.17],
			w_range: [10.24, 20.87, 260.09, 530.1],
			l_range: [14.18, 29.53, 360.17, 750.06],
			size_options: [],
			machine_size: {
				id: 3,
				name: "Cut 3",
				split: 3
			},
			std_paper: [],
			print_type: ["Offset"],
			compType: [1, 2],
			color: {
				min: 0,
				max: 8
			}
		},
		{
			machine_id: 5518,
			machine_name: "เครื่องทำกล่องบรรจุสินค้า",
			max_size: [0, 0, 0, 0],
			min_size: [0, 0, 0, 0],
			w_range: [0, 0, 0, 0],
			l_range: [0, 0, 0, 0],
			size_options: [
				/* ตัวเลขด้านซ้าย แสดงลอนขนานไม่เกิน */
				// {
				// 	corrugated_layer: [2],
				// 	max_size: [55, 57, 1397, 1447.8],
				// 	min_size: [15.75, 21, 400.05, 533.4],
				// 	w_range: [15.75, 55, 400.05, 1397],
				// 	l_range: [21, 57, 533.4, 1447.8],
				// },
				{
					corrugated_layer: [2],
					max_size: [57, 50, 1447.8, 1270],
					min_size: [15.75, 21, 400.05, 533.4],
					w_range: [15.75, 57, 400.05, 1447.8],
					l_range: [21, 50, 533.4, 1270],
				},
				{
					corrugated_layer: [3, 5],
					max_size: [57, 94.4, 1447.8, 2397.76],
					min_size: [15.75, 21, 400.05, 533.4],
					w_range: [15.75, 57, 400.05, 1447.8],
					l_range: [21, 94.4, 533.4, 2397.76],
				}
			],
			machine_size: {
				id: 4,
				name: "Flexo",
				split: 1
			},
			std_paper: [],
			print_type: ["Offset", "Flexo"],
			compType: [3],
			color: {
				min: 0,
				max: 8
			}
		},
		{
			machine_id: 5527,
			machine_name: "Jet Press",
			max_size: [23.03, 29.52, 585, 750],
			min_size: [15.5, 21.5, 393, 546],
			w_range: [15.5, 23.03, 393, 585],
			l_range: [21.5, 29.52, 546, 750],
			size_options: [],
			machine_size: {
				id: 5,
				name: "Jet Press",
				split: 1
			},
			std_paper: [],
			print_type: ["Jet Press"],
			compType: [1, 2],
			color: {
				min: 0,
				max: 8
			}
		},
		{
			machine_id: 5528,
			machine_name: "Konica",
			max_size: [13.00, 19.17, 330.2, 487],
			min_size: [5.51, 7.16, 140, 182],
			w_range: [5.51, 13.00, 140, 330.2],
			l_range: [7.16, 19.17, 182, 487],
			size_options: [],
			machine_size: {
				id: 6,
				name: "Konica",
				split: 1
			},
			std_paper: [],
			print_type: ["Konica"],
			compType: [1],
			color: {
				min: 0,
				max: 8
			}
		}
	],
	setMachineSize(machine_id, size_obj = { min_size, max_size, w_range, l_range }) {

		const machine = defaultData?.machine?.find(obj => obj.machine_size?.id === machine_id)

		if (machine) {
			machine.min_size = size_obj.min_size
			machine.max_size = size_obj.max_size
			machine.w_range = size_obj.w_range
			machine.l_range = size_obj.l_range
		}
	},
	getMachine(machine_id) {
		return defaultData?.machine?.find(obj => obj.machine_size?.id === machine_id)
	},
	paper: {
		paper_code: "GAR",
		paper_name: "Gloss art",
		paper_cost: 26.88,
		paper_thickness: 0.1,
		paper_gram: 300,
		paper_markup: 0
	},
	pallet: [
		{ id: 1, size: [40.00, 48.00, 6.50] },
		{ id: 2, size: [39.37, 47.24, 6.50] },
		{ id: 3, size: [45.90, 45.90, 6.50] },
		{ id: 4, size: [42.00, 45.00, 6.50] },
		{ id: 5, size: [43.30, 43.30, 6.50] },
		{ id: 6, size: [31.50, 47.24, 6.50] }
	],
	pallet_delivery: [
		{ id: 1, type: 'domestic', pallet_price: 400 },
		{ id: 2, type: 'abroad', pallet_price: 700 },
	],
	pallet_info: {
		limit_pallet_weight: 750, //kg
		empty_pallet_weight: 25,//kg
		limit_pallet_height: 44,//inch
		mif_unit_price: 1100, //* Pallet MIF
	},
	kraftwrap_info: {
		kraftwrap_price: 5, //ยึดตามนี้ไปก่อน (ค่า pack + กระดาษ)
		kraftwrap_thickness: 0.5, //0.5mm
		limit_kraftwrap_weight: 5,//kg
		limit_kraftwrap_height: 300,// mm
	},
	paperband_info: {
		paperband_price: 0.5, //THB/stack
		qty_per_paperband: 100,
		paperband_allowance: 25.4,//mm ทบติดกาว
	},
	carton_info: {
		carton_price: 5, //มั่วไปก่อน THB/carton
		carton_printing_price: 3, // THB/carton
		markup_price: 15, // update 26.01.24 เพิ่ม 5 + 10 บาท / กล่องไปตอนท้าย
		limit_carton_weight: 15,//kg
		corrugated_marking: 10, //* Percent
	},
	delivery_rate: 1500, //THB/ton
	component_type: [
		{
			type: 1,
			is_default: true,
			print_type: ["Offset", 'Jet Press', 'Konica'],
			type_name: 'ไม่ประกบลูกฟูก',
			corrugated_layer: [2, 3, 5],
			tolerance: {
				paper_edge: 4,
				bleed: 3,
				gripper: 12,
				color_bar: 8,
			}
		},
		{
			type: 2,
			is_default: false,
			print_type: ["Offset", 'Jet Press'],
			type_name: 'ประกบลูกฟูก',
			corrugated_layer: [2, 3, 5],
			tolerance: {
				paper_edge: 4,
				bleed: 3,
				gripper: 12,
				color_bar: 8,
			}
		},
		{
			type: 3,
			is_default: true,
			print_type: ["Flexo"],
			type_name: 'เฉพาะลูกฟูก',
			corrugated_layer: [2, 3, 5],
			tolerance: {
				paper_edge: 10,
				bleed: 3,
				gripper: 0,
				color_bar: 0,
			}
		}
	],
	box_template: [
		{
			id: 1,
			config: {
				dust: [], //* mm , inch
			}
		},
		{
			id: 2,
			config: {
				dust: [], //* mm , inch
			}
		},
		{
			id: 3,
			config: {
				dust: [], //* mm , inch
			}
		},
		{
			id: 4,
			config: {
				dust: [], //* mm , inch
			}
		},
		{
			id: 5,
			config: {
				dust: [25, 0.99], //* mm , inch
			}
		},
		{
			id: 6,
			config: {
				dust: [25, 0.99], //* mm , inch
			}
		},
		{
			id: 7,
			config: {
				dust: [], //* mm , inch
			}
		},
		{
			id: 8,
			config: {
				dust: [], //* mm , inch
			}
		},
		{
			id: 9,
			config: {
				dust: [], //* mm , inch
			}
		},
		{
			id: 10,
			config: {
				dust: [], //* mm , inch
			}
		},
		{
			id: 11,
			config: {
				dust: [], //* mm , inch
			}
		},
		{
			id: 12,
			config: {
				dust: [], //* mm , inch
			}
		},
	],
	printType: [
		'Offset',
		'Flexo',
		'Jet Press',
		'Konica'
	],

}