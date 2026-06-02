

const setLayoutTolerance = ({ laying, paper_tolerance, componentType }) => {
	if (!paper_tolerance) console.error("setLayoutTolerance Error. Missing paper_tolerance.")
	const { paper_edge = 4, gripper = 12, color_bar = 8 } = paper_tolerance || {}

	switch (componentType) {
		case 1:
		case 2:
			shortSideComponent = gripper + color_bar
			longSideComponent = paper_edge * 2
			break;
		case 3:
			shortSideComponent = gripper + color_bar + (paper_edge * 2)
			longSideComponent = paper_edge * 2
			break;
		default:
			shortSideComponent = gripper + color_bar
			longSideComponent = paper_edge * 2
			break;
	}

	return laying.map((lay) => {
		let wSide = 0, lSide = 0;
		if (lay?.printing[0] <= lay?.printing[1]) {
			wSide = lay?.printing[0] + shortSideComponent
			lSide = lay?.printing[1] + longSideComponent
		} else {
			wSide = lay?.printing[0] + longSideComponent
			lSide = lay?.printing[1] + shortSideComponent
		}

		return {
			...lay,
			layout_size: [
				wSide,
				lSide
			]
		}
	})
}

const setCalculateWSide = (w_case, n, w, l, d, b, dust, ol, g, t) => {
	switch (w_case) {
		case 1.1: //* dust<=(w+t)/2
			var side = (n + 1) * (w + t) + n * (2 * b + d)
			break
		case 1.2: //* dust>(w+t)/2
			var side = 2 * (w + t) + n * (2 * b + d) + (n - 1) * (2 * dust)
			break
		case 2.1: //* align: straight
			var side = 2 * (w + t) + n * (2 * b + d) + (n - 1) * (dust + w + t)
			break
		case 2.2: //* align: overlap, dust<=(w+t)/2
			var side = (n + 1) * (w + t) + n * (2 * b + d)
			break
		case 2.3: //* align: overlap, dust>(w+t)/2
			var side = 2 * (w + t) + n * (2 * b + d) + (n - 1) * (2 * dust)
			break
		case 3.1: //* align: straight
			var side = n * (ol + w / 2 + 2 * b + d) + (Math.floor(n / 2) + (n % 2)) * (w + t) + Math.floor(n / 2) * dust
			break
		case 3.2: //* align: overlap, dust<=(w+t)/2
			var side = n * (ol + w / 2 + 2 * b + d) + (Math.floor(n / 2) + (n % 2)) * (w + t)
			break
		case 3.3: //* align: overlap, dust>(w+t)/2
			var side = n * (ol + w / 2 + 2 * b + d) + (Math.floor(n / 2) + (n % 2)) * (w + t) + Math.floor(n / 2) * (2 * dust - w - t)
			break
		case 4.1: //* align: straight
			var side = n * (ol + w / 2 + 2 * b + d) + (Math.floor(n / 2) + (n % 2)) * (w + t) + Math.floor(n / 2) * dust
			break
		case 4.2: //* align: overlap, dust<=(w+t)/2
			var side = n * (ol + w / 2 + 2 * b + d) + (Math.floor(n / 2) + (n % 2)) * (w + t)
			break
		case 4.3: //* align: overlap, dust>(w+t)/2
			var side = n * (ol + w / 2 + 2 * b + d) + (Math.floor(n / 2) + (n % 2)) * (w + t) + Math.floor(n / 2) * (2 * dust - w - t)
			break
		case 5.0:
			var side = n * (w + 4 * d + 2 * b)
			break
		case 6.0:
			var side = n * (w + 4 * d + 2 * b + 2 * ol + 2 * dust)
			break
		case 7.1: //* glue<=(l+dust)/2
			var side = (n + 1) * (l + dust) + n * (2 * b + w)
			break
		case 7.2://* glue>(l+dust)/2
			var side = 2 * (l + dust) + n * (w + 2 * b) + 2 * (n - 1) * g
			break
		case 8.1:
			var side = n * (t + 2 * d + 2 * b) + n * w / 2 + (n % 2) * (ol)
			break
		case 9.0:
			var side = n * (d + 2 * b)
			break
		case 10.0:
			var side = n * (l + d + 2 * b)
			break
		case 11.0:
			var side = n * (d + 2 * w + 2 * b)
			break
	}
	return side
}

const setCalculateLSide = (l_case, n, w, l, d, b, dust, ol, g) => {
	//! recheck ว่ารับ parameter ครบมั้ย
	switch (l_case) {
		case 1.0:
			var side = n * (2 * (w + l + b) + g)
			break
		case 2.0: //* align:straight
			var side = n * (2 * (w + l + b) + g)
			break
		case 2.2: //* align:overlap
			var side = 2 * n * (l + b) + (2 * n + 1) * w + (n - 1) * g
			break
		case 2.3://* align:overlap
			var side = 2 * n * (l + b) + (2 * n + 1) * w + (n - 1) * g
			break
		case 3.0://* align:straight
			var side = n * (2 * (w + l + b) + g)
			break;
		case 3.2://* align:overlap
			var side = 2 * n * (l + b) + (2 * n + 1) * w + (n - 1) * g
			break
		case 3.3://* align:overlap
			var side = 2 * n * (l + b) + (2 * n + 1) * w + (n - 1) * g
			break
		case 4.0://* align:straight
			var side = n * (2 * (w + l + b) + g)
			break
		case 4.2://* align:overlap
			var side = 2 * n * (l + b) + (2 * n + 1) * w + (n - 1) * g
			break
		case 4.3://* align:overlap
			var side = 2 * n * (l + b) + (2 * n + 1) * w + (n - 1) * g
			break
		case 5.0:
			var side = n * (l + 4 * d + 2 * b + 2 * dust)
			break
		case 6.0:
			var side = n * (l + 4 * d + 2 * b + 2 * dust + 2 * ol)
			break
		case 7.0:
			var side = n * (2 * d + 2 * b + 3 * l)
			break
		case 8.0:
			var side = n * (2 * (w + l + b) + g)
		case 8.1:
			var side = 2 * n * (w + l + b) + (n + 1) * g
			break
		case 9.0:
			var side = n * (2 * (w + l + b) + g)
			break
		case 10.0:
			var side = n * (2 * w + 2 * b + g)
			break
		case 11.0:
			var side = n * (2 * (b + w + l) + g)
			break
	}
	return side
}

const calPaperSize = ({
	paper_info
}) => {
	// ? paperSize,realPaperSize : [Wmm,Lmm,Winch,Linch]
	const {
		paperSize = [],
		parallel_side = 'WSize',
		is_switchDisplay = false,
		paper_align = 'short',
		std_paper_id = null,
		realPaperSize = []
	} = paper_info || {}
	const tempPaperSize = realPaperSize.length ? realPaperSize : paperSize
	const returnData = {
		paperSize,
		roll_width: 0,
		cut_off: 0,
		parallel_roll_width: parallel_side,
		is_switchDisplay,
		std_paper_id,
		paper_align,
		paper_grain: 'horizontal'
	}

	if (parallel_side == "WSize") {
		returnData.roll_width = tempPaperSize[2]
		returnData.cut_off = tempPaperSize[3]
		returnData.paper_grain = 'horizontal'
	} else {
		returnData.roll_width = tempPaperSize[3]
		returnData.cut_off = tempPaperSize[2]
		returnData.paper_grain = 'vertical'
	}

	console.log("tempPaperSize", tempPaperSize, returnData)

	return returnData
}



// calculateLayingSize2({
// 	templateId:box_type.type_id,
// 	packaging_size,
// 	paperSize:paper_info.paperSize,
// 	componentType,
// 	paper_tolerance,
// 	laying:'vertical'
// })

const calculateLayingSize2 = ({
	templateId = null,
	packaging_size,
	paperSize,
	componentType,
	paper_tolerance,
	laying,
	flute_side
}) => {
	const {
		length: l
		, width: w
		, depth: d
		, glue_flap: g
		, tuck_flap: t
		, dust_flap: dust
		, ol
	} = packaging_size

	const { gripper, color_bar, paper_edge, bleed } = paper_tolerance
	let shortSideComponent = 0, longSideComponent = 0
	//? for corrugated 4 dim + paper_edge * 2
	switch (componentType) {
		case 1:
		case 2:
			shortSideComponent = gripper + color_bar
			longSideComponent = paper_edge * 2
			break;
		case 3:
			shortSideComponent = gripper + color_bar + (paper_edge * 2)
			longSideComponent = paper_edge * 2
			break;
	}

	let wCase = 0, lCase = 0, w1Case = 0, l1Case = 0
	let wOverlapCase = 0, lOverlapCase = 0, w1OverlapCase = 0, l1OverlapCase = 0
	switch (templateId) {
		case 1:
			if (dust <= ((w + t) / 2)) {
				wCase = 1.1
				lCase = 1.0
			} else {
				wCase = 1.2
				lCase = 1.0
			}
			// do
			break;
		case 2:
			// if(layingType === 'straight'){
			wCase = 2.1
			lCase = 2.0
			// } else {
			l1OverlapCase = 2.0
			if (dust <= (w + t) / 2) {
				wOverlapCase = 2.2
				lOverlapCase = 2.2
			} else {
				wOverlapCase = 2.3
				lOverlapCase = 2.3
			}
			// }
			// do
			break;
		case 3:
			// if(layingType === 'straight'){
			wCase = 3.1
			lCase = 3.0
			// } else {
			l1OverlapCase = 3.0
			if (dust <= ((w + t) / 2)) {
				wOverlapCase = 3.2
				lOverlapCase = 3.2
			} else {
				wOverlapCase = 3.3
				lOverlapCase = 3.3
			}
			// }
			// do
			break;
		case 4:
			wCase = 4.1
			lCase = 4.0
			l1OverlapCase = 4.0

			if (dust <= ((w + t) / 2)) {
				wOverlapCase = 4.2
				lOverlapCase = 4.2
			} else {
				wOverlapCase = 4.3
				lOverlapCase = 4.3
			}
			break;
		case 5:
			// do
			break;
		case 6:
			// do
			break;
		case 7:
			// do
			break;
		case 8:
			// do
			break;
		case 9:
			// do
			break;
		case 10:
			// do
			break;
		case 11:
			// do
			break;
		case 12:
			// do
			break;
		default:
			break;
	}
	const straightLaying = calculateStraightPrintSize({
		wCase,
		lCase,
		w1Case,
		l1Case,
		shortSideComponent,
		longSideComponent,
		packaging_size,
		paperSize,
		bleed,
		laying
	})
	const overlapLaying = calculateOverlapPrintSize({
		wCase: wOverlapCase,
		lCase: lOverlapCase,
		w1Case: w1OverlapCase,
		l1Case: l1OverlapCase,
		shortSideComponent,
		longSideComponent,
		packaging_size,
		paperSize,
		bleed,
		laying
	})

	// const overlapLaying = calculateStraightPrintSize({
	// 	wCase,
	// 	lCase,
	// 	w1Case,
	// 	l1Case,
	// 	shortSideComponent,
	// 	longSideComponent,
	// 	packaging_size,
	// 	paperSize,
	// 	bleed
	// })

	// console.log("overlapLaying",overlapLaying)
}
const calculateStraightPrintSize = ({
	wCase = 0,
	lCase = 0,
	w1Case = 0,
	l1Case = 0,
	shortSideComponent = 0,
	longSideComponent = 0,
	packaging_size,
	paperSize,
	bleed: b,
	// laying,
	flute_side
}) => {

	const {
		length: l
		, width: w
		, depth: d
		, glue_flap: g
		, tuck_flap: t
		, dust_flap: dust
		, ol
	} = packaging_size

	let w_side = 0,
		l_side = 0,
		lSideAmount = 1,
		wSideAmount = 1,
		printSize = [],
		laySize_mm = [],
		components = []

	const laying = [];
	// if(laying === 'vertical'){
	let objLayout = {
		laying_type: 'straight',
		laying: 'vertical',
		grain_box_type: 'horizontal',
		printSizeOne: [], //* 1
		laySizeOne: [], //* 2
		printSize: [], //* 3
		laySize: [], //* 4
		layout: [], //* 5
		num_laying: 0, //* 6
	}
	// * Straight / Vertical laying
	w_side = setCalculateWSide(wCase, wSideAmount, w, l, d, b, dust, ol, g, t)
	l_side = setCalculateLSide(lCase, lSideAmount, w, l, d, b, dust, ol, g)
	// * Set value 1.
	objLayout.printSizeOne = [w_side, l_side]
	if (w_side <= l_side) {
		laySize_mm[0] = w_side + shortSideComponent
		laySize_mm[1] = l_side + longSideComponent
		components = [shortSideComponent, longSideComponent]
	} else {
		laySize_mm[0] = w_side + longSideComponent
		laySize_mm[1] = l_side + shortSideComponent
		components = [longSideComponent, shortSideComponent]
	}

	// * Set value 2.
	objLayout.laySizeOne = [mm2inch(laySize_mm[0]), mm2inch(laySize_mm[1]), laySize_mm[0], laySize_mm[1]]

	if (paperSize?.length) {
		//? calc W side
		while (laySize_mm[0] <= paperSize[0]) {
			wSideAmount = wSideAmount + 1
			laySize_mm[0] = setCalculateWSide(wCase, wSideAmount, w, l, d, b, dust, ol, g, t) + components[0]
			if (laySize_mm[0] > paperSize[0]) {
				wSideAmount = wSideAmount - 1
				printSize[0] = setCalculateWSide(wCase, wSideAmount, w, l, d, b, dust, ol, g, t)
				laySize_mm[0] = printSize[0] + components[0]
				break
			}
		}
		//? calc L side
		lSideAmount = Math.floor((paperSize[1] / l_side))
		printSize[1] = l_side * lSideAmount
		laySize_mm[1] = printSize[1] + components[1]
		if (laySize_mm[1] > paperSize[1]) {
			lSideAmount = lSideAmount - 1
		}

		printSize[1] = l_side * lSideAmount
		laySize_mm[1] = printSize[1] + components[1]
	}

	objLayout = {
		...objLayout,
		// * Set value 3.
		printSize: printSize,
		// * Set value 4.
		laySize: [mm2inch(laySize_mm[0]), mm2inch(laySize_mm[1]), laySize_mm[0], laySize_mm[1]],
		// * Set value 5.
		layout: [wSideAmount, lSideAmount],
		// * Set value 6.
		num_laying: wSideAmount * lSideAmount || 0,
	}
	laying.push(objLayout)
	//* END Straight / Vertical
	// return objLayout

	// }else if (laying === 'horizontal'){
	// * START Straight / Horizontal
	w_side = 0
	l_side = 0
	lSideAmount = 1
	wSideAmount = 1
	printSize = []
	laySize_mm = []
	components = []

	objLayout = {
		laying_type: 'straight',
		laying: 'horizontal',
		grain_box_type: 'vertical',
		printSizeOne: [], //* 1
		laySizeOne: [], //* 2
		printSize: [], //* 3
		laySize: [], //* 4
		layout: [], //* 5
		num_laying: 0, //* 6
	}

	w_side = setCalculateLSide(lCase, wSideAmount, w, l, d, b, dust, ol, g)
	l_side = setCalculateWSide(wCase, lSideAmount, w, l, d, b, dust, ol, g, t)
	// * Set value 1.
	objLayout.printSizeOne = [w_side, l_side]

	if (w_side <= l_side) {
		laySize_mm[0] = w_side + shortSideComponent
		laySize_mm[1] = l_side + longSideComponent
		components = [shortSideComponent, longSideComponent]
	} else {
		laySize_mm[0] = w_side + longSideComponent
		laySize_mm[1] = l_side + shortSideComponent
		components = [longSideComponent, shortSideComponent]
	}

	// * Set value 2.
	objLayout.laySizeOne = [mm2inch(laySize_mm[0]), mm2inch(laySize_mm[1]), laySize_mm[0], laySize_mm[1]]

	if (paperSize?.length) {
		//? calc W side
		wSideAmount = Math.floor((paperSize[0] / w_side))
		printSize[0] = w_side * wSideAmount
		laySize_mm[0] = printSize[0] + components[0]

		if (laySize_mm[0] > paperSize[0]) {
			wSideAmount -= 0
		}

		printSize[0] = w_side * wSideAmount
		laySize_mm[0] = printSize[0] + components[0]

		//? calc L side
		while (laySize_mm[1] <= paperSize[1]) {
			lSideAmount += 1
			laySize_mm[1] = setCalculateWSide(wCase, lSideAmount, w, l, d, b, dust, ol, g, t) + components[1]
			if (laySize_mm[1] > paperSize[1]) {
				lSideAmount -= 1
				printSize[1] = setCalculateWSide(wCase, lSideAmount, w, l, d, b, dust, ol, g, t)
				laySize_mm[1] = printSize[1] + components[1]
				break
			}
		}
	}

	objLayout = {
		...objLayout,
		// * Set value 3.
		printSize: printSize,
		// * Set value 4.
		laySize: [mm2inch(laySize_mm[0]), mm2inch(laySize_mm[1]), laySize_mm[0], laySize_mm[1]],
		// * Set value 5.
		layout: [wSideAmount, lSideAmount],
		// * Set value 6.
		num_laying: wSideAmount * lSideAmount || 0,
	}
	// 	return objLayout
	// }else{
	// 	return "laying not found."
	// }
	laying.push(objLayout)
	return laying

}

const calculateOverlapPrintSize = ({
	wCase = 0,
	lCase = 0,
	w1Case = 0,
	l1Case = 0,
	shortSideComponent = 0,
	longSideComponent = 0,
	packaging_size,
	paperSize,
	bleed: b
}) => {

	const {
		length: l
		, width: w
		, depth: d
		, glue_flap: g
		, tuck_flap: t
		, dust_flap: dust
		, ol
	} = packaging_size

	let w_side = 0,
		l_side = 0,
		lSideAmount = 1,
		wSideAmount = 1,
		printSize = [],
		laySize_mm = [],
		components = []

	const laying = [];
	let objLayout = {
		laying_type: 'overlap',
		laying: 'vertical',
		grain_box_type: 'horizontal',
		printSizeOne: [], //* 1
		laySizeOne: [], //* 2
		printSize: [], //* 3
		laySize: [], //* 4
		layout: [], //* 5
		num_laying: 0, //* 6
	}

	//!--------------------------------------------------------------------------------
	// * Overlap / Vertical laying
	w_side = setCalculateWSide(wCase, wSideAmount, w, l, d, b, dust, ol, g, t)
	l_side = setCalculateLSide(lCase, lSideAmount, w, l, d, b, dust, ol, g)
	// * Set value 1.
	objLayout.printSizeOne = [w_side, l_side]

	if (w_side <= l_side) {
		laySize_mm[0] = w_side + shortSideComponent
		laySize_mm[1] = l_side + longSideComponent
		components = [shortSideComponent, longSideComponent]
	} else {
		laySize_mm[0] = w_side + longSideComponent
		laySize_mm[1] = l_side + shortSideComponent
		components = [longSideComponent, shortSideComponent]
	}

	// * Set value 2.
	objLayout.laySizeOne = [mm2inch(laySize_mm[0]), mm2inch(laySize_mm[1]), laySize_mm[0], laySize_mm[1]]
	if (paperSize?.length) {
		//? calc W side
		while (laySize_mm[0] <= paperSize[0]) {
			wSideAmount = wSideAmount + 1
			laySize_mm[0] = setCalculateWSide(wCase, wSideAmount, w, l, d, b, dust, ol, g, t) + components[0]
			if (laySize_mm[0] > paperSize[0]) {
				wSideAmount = wSideAmount - 1
				printSize[0] = setCalculateWSide(wCase, wSideAmount, w, l, d, b, dust, ol, g, t)
				laySize_mm[0] = printSize[0] + components[0]
				break
			}
		}

		//? calc L side
		while (laySize_mm[1] <= paperSize[1]) {
			lSideAmount += 1
			laySize_mm[1] = setCalculateLSide(lCase, lSideAmount, w, l, d, b, dust, ol, g) + components[1]
			if (laySize_mm[1] > paperSize[1]) {
				lSideAmount = lSideAmount - 1
				printSize[1] = setCalculateLSide(lCase, lSideAmount, w, l, d, b, dust, ol, g)
				laySize_mm[1] = printSize[1] + components[1]
				break
			}
		}

		//? summary
		if (wSideAmount === 1) {
			printSize[1] = setCalculateLSide(l1Case, 1, w, l, d, b, dust, ol, g)
			lSideAmount = Math.floor((paperSize[1] / printSize[1]))
			laySize_mm[1] = (printSize[1] * lSideAmount) + components[1]

			if (laySize_mm[1] > paperSize[1]) {
				lSideAmount = lSideAmount - 1
				laySize_mm[1] = (printSize[1] * lSideAmount) + components[1]
			}
			printSize[1] = printSize[1] * lSideAmount
		}
	}

	// else{
	// 	printSize[1] = printSize[1]
	// }
	objLayout = {
		...objLayout,
		// * Set value 3.
		printSize,
		// * Set value 4.
		laySize: [mm2inch(laySize_mm[0]), mm2inch(laySize_mm[1]), laySize_mm[0], laySize_mm[1]],
		// * Set value 5.
		layout: [wSideAmount, lSideAmount],
		// * Set value 6.
		num_laying: wSideAmount * lSideAmount || 0,
	}

	laying.push(objLayout)
	//* END Overlap / Vertical
	// ! ---------------------------------------------------------------------------------
	// * START Overlap / Horizontal
	w_side = 0
	l_side = 0
	lSideAmount = 1
	wSideAmount = 1
	printSize = []
	laySize_mm = []
	components = []

	objLayout = {
		laying_type: 'overlap',
		laying: 'horizontal',
		grain_box_type: 'vertical',
		printSizeOne: [], //* 1
		laySizeOne: [], //* 2
		printSize: [], //* 3
		laySize: [], //* 4
		layout: [], //* 5
		num_laying: 0, //* 6
	}

	w_side = setCalculateLSide(lCase, wSideAmount, w, l, d, b, dust, ol, g)
	l_side = setCalculateWSide(wCase, lSideAmount, w, l, d, b, dust, ol, g, t)
	// * Set value 1.
	objLayout.printSizeOne = [w_side, l_side]

	if (w_side <= l_side) {
		laySize_mm[0] = w_side + shortSideComponent
		laySize_mm[1] = l_side + longSideComponent
		components = [shortSideComponent, longSideComponent]
	} else {
		laySize_mm[0] = w_side + longSideComponent
		laySize_mm[1] = l_side + shortSideComponent
		components = [longSideComponent, shortSideComponent]
	}

	// * Set value 2.
	objLayout.laySizeOne = [mm2inch(laySize_mm[0]), mm2inch(laySize_mm[1]), laySize_mm[0], laySize_mm[1]]

	if (paperSize?.length) {
		//? calc W side
		while (laySize_mm[0] <= paperSize[0]) {
			wSideAmount++
			laySize_mm[0] = setCalculateLSide(lCase, wSideAmount, w, l, d, b, dust, ol, g) + components[0]
			if (laySize_mm[0] > paperSize[0]) {
				wSideAmount -= 1
				printSize[0] = setCalculateLSide(lCase, wSideAmount, w, l, d, b, dust, ol, g)
				laySize_mm[0] = printSize[0] + components[0]
				break
			}
		}

		//? calc L side
		while (laySize_mm[1] <= paperSize[1]) {
			lSideAmount++
			laySize_mm[1] = setCalculateWSide(wCase, lSideAmount, w, l, d, b, dust, ol, g, t) + components[1]
			if (laySize_mm[1] > paperSize[1]) {
				lSideAmount -= 1
				printSize[1] = setCalculateWSide(wCase, lSideAmount, w, l, d, b, dust, ol, g, t)
				laySize_mm[1] = printSize[1] + components[1]
				break
			}
		}

		//? summary

		if (lSideAmount === 1) {
			// ถ้าด้านยาวเป็น 1 หาด้านสั้นใหม่
			printSize[0] = setCalculateLSide(l1Case, 1, w, l, d, b, dust, ol, g)
			wSideAmount = Math.floor((paperSize[0] / printSize[0]))
			laySize_mm[0] = (printSize[0] * wSideAmount) + components[0]

			if (laySize_mm[0] > paperSize[0]) {
				wSideAmount -= 1
				laySize_mm[0] = (printSize[0] * wSideAmount) + components[0]
			}
			printSize[0] = printSize[0] * wSideAmount
		}
		// printSize = [printSize[1],printSize[0]]
	}

	objLayout = {
		...objLayout,
		// * Set value 3.
		printSize,
		// * Set value 4.
		laySize: [mm2inch(laySize_mm[0]), mm2inch(laySize_mm[1]), laySize_mm[0], laySize_mm[1]],
		// * Set value 5.
		layout: [wSideAmount, lSideAmount],
		// * Set value 6.
		num_laying: wSideAmount * lSideAmount || 0,
	}

	laying.push(objLayout)

	return laying
}

const calculateCorrugatedBoardSize = (size, laying, flute_side, is_manual_size) => {
	console.log("calc. board", size, is_manual_size)
	// * return board size after round up
	let corrugatedSize = []

	if (flute_side === 'short_side') {
		if (laying === 'vertical') {
			corrugatedSize = [roundToEven(size[0]), roundDecimal(size[1])]
		} else {
			corrugatedSize = [roundDecimal(size[0]), roundToEven(size[1])]
		}
	} else {
		if (laying === 'vertical') {
			corrugatedSize = [roundDecimal(size[0]), roundToEven(size[1])]
		} else {
			corrugatedSize = [roundToEven(size[0]), roundDecimal(size[1])]
		}
		// if (laying === 'vertical') {
		// 	corrugatedSize = [roundToEven(size[0]), roundDecimal(size[1])]
		// } else {
		// 	corrugatedSize = [roundDecimal(size[0]), roundToEven(size[1])]
		// }
	}

	if (is_manual_size) {
		corrugatedSize = [
			size[0],
			size[1],
		]
	}

	corrugatedSize = [
		parseFloat(corrugatedSize[0].toFixed(3)),
		parseFloat(corrugatedSize[1].toFixed(3)),
		parseFloat((corrugatedSize[0] * 25.4).toFixed(3)),
		parseFloat((corrugatedSize[1] * 25.4).toFixed(3)),
	]

	console.log("corrugatedSize", corrugatedSize)

	return corrugatedSize
}

const checkUsedCorrugatedBoardSize = (item, selectedLayout, index, isCustomLaying = false) => {
	// * return boolean 
	if (!selectedLayout) return false
	const { component_type: { type: compType }, machine } = item
	const { laying, layout_size, layout } = selectedLayout
	const matchMachine = est.getMachineList(item)

	if ([3].includes(compType)) {
		const {
			corrugated_layer: {
				component_flute_side: flute_side,
				info: {
					is_price_per_sheet = false,
					corrugated_size = []
				}
			}
		} = item

		size = layout_size
		// size = layout?.laySize?.length ? layout?.laySize : layout_size

		if (is_price_per_sheet) {
			size = [corrugated_size[2], corrugated_size[3]]
		}

		let boardSize = calculateCorrugatedBoardSize(size, laying, flute_side, is_price_per_sheet)
		boardSize.sort((a, b) => a - b)

		if (machine?.machine_id) {
			//* found machine
			const { w_range, l_range, min_size, max_size } = machine

			console.log("boardSize", boardSize)
			console.log("w_range,l_range", w_range, l_range)
			if (
				(boardSize[2] >= w_range[2]
					&& boardSize[2] <= w_range[3]
					&& boardSize[3] >= l_range[2]
					&& boardSize[3] <= l_range[3])
				||
				(boardSize[3] >= w_range[2]
					&& boardSize[3] <= w_range[3]
					&& boardSize[2] >= l_range[2]
					&& boardSize[2] <= l_range[3])
			) {
				// if(boardSize[2] >= min_size[2] && boardSize[2] <= max_size[])
				// if (
				// 	boardSize[2] >= min_size[2] &&
				// 	boardSize[2] <= min_size[3] &&
				// 	boardSize[3] >= max_size[2] &&
				// 	boardSize[3] <= max_size[3]
				// ) {

				console.log("check bord size [pass]")
				// pass
				return true
			} else {
				let [w_num, l_num] = layout



				// not pass
				if (!(boardSize[2] >= w_range[2] && boardSize[2] <= w_range[3])) {
					w_num = w_num - 1
				}
				if (!(boardSize[3] >= l_range[2] && boardSize[3] <= l_range[3])) {
					l_num = l_num - 1
				}

				if (!w_num || !l_num) {
					return false
				}

				if (isCustomLaying) {
					return false
				}

				console.log("check bord size [not pass]")
				return est.setCollectLaying(item, [w_num, l_num], false, index)
			}

		}
	} else {
		// type 1,2
		return true
	}

}

const getShortLongSide = (item, layout) => {
	const { paperSize, component_type: { type: compType } } = item
	const objSize = { short_side: 0, long_side: 0, board_size: [], paper_size: paperSize }

	if (compType === 3) {
		if (!layout) {
			// * return paper size
			if (paperSize[0] < paperSize[1]) {
				objSize.short_side = paperSize[0]
				objSize.long_side = paperSize[1]
			} else {
				objSize.short_side = paperSize[1]
				objSize.long_side = paperSize[0]
			}

			objSize.board_size = [paperSize[2], paperSize[3], paperSize[0], paperSize[1]]
		} else {
			// * return board size
			// const { corrugated_layer: { component_flute_side: flute_side } } = item
			// const boardSize = calculateCorrugatedBoardSize(layout.layout_size, layout.laying, flute_side)


			const {
				corrugated_layer: {
					component_flute_side: flute_side,
					info: {
						is_price_per_sheet = false,
						corrugated_size = []
					}
				},
				layout: layoutInfo = {}
			} = item

			size = layout.layout_size
			// size = layoutInfo?.laySize?.length ? layoutInfo?.laySize : layout.layout_size

			if (is_price_per_sheet) {
				size = [corrugated_size[2], corrugated_size[3]]
			}

			const boardSize = calculateCorrugatedBoardSize(size, layout.laying, flute_side, is_price_per_sheet)

			if (boardSize[2] < boardSize[3]) {
				objSize.short_side = boardSize[2]
				objSize.long_side = boardSize[3]
			} else {
				objSize.short_side = boardSize[3]
				objSize.long_side = boardSize[2]
			}

			objSize.board_size = boardSize
		}
	} else {
		// * return paper size
		if (paperSize[0] < paperSize[1]) {
			objSize.short_side = paperSize[0]
			objSize.long_side = paperSize[1]
		} else {
			objSize.short_side = paperSize[1]
			objSize.long_side = paperSize[0]
		}
	}
	console.log("getShortLongSide", objSize, item.corrugated_layer, item?.paper_info?.roll_width, item?.paper_info?.cut_off)
	return objSize
}