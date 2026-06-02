class Estimate {

	mainData = {
		job: {},
		ae: {
			ae_id: '',
			ae_name: ''
		},
		customer: {
			customer_id: '',
			customer_name: ''
		},
		qty: {
			main: [1000, 2000],
			//over: 0,
			runon: 0,
			//advance: 0,
			customer: 0,
			ae: 0,
		},
		remark: '',
		delivery: []
	}

	checkDeliveryQty = [
		{
			qty: 0,
			balance: 0,
		}
	]
	mockupData = {}
	mockupData2 = {}
	process = {
		isReCalLayout: false,
		isReCalPrice: false,
		isReCalPaperUsage: false,
	}

	// * wizard
	wizardData = null

	constructor() {
		console.log('init Estimate class')
		this.mockupData = mockupData
		this.mockupData2 = mockupData2
	}

	setWizardData(data) {
		this.wizardData = data
	}

	getWizardData() {
		return this.wizardData
	}

	getWizardPacking() {
		return this.wizardData.packing.selected || []
	}

	setMockupData() {
		let check = false
		// displayJobInfo(this.mockupData)
		if (this.mockupData?.job?.is_multiple_f) {
			$('#is_multiple_f').click()
		}
		const isMultipleF = getIsMultipleF()
		if ((isMultipleF && this.mockupData?.job?.is_multiple_f) || (!isMultipleF && !this.mockupData?.job?.is_multiple_f)) {
			displayJobQty2(this.mockupData)
			$("#aeID").val(this.mockupData.ae.ae_id)
			$("#aeName").val(this.mockupData.ae.ae_name)
			$("#aeLabel").val(this.mockupData.ae.ae_name)
			$("#jobName input").val(this.mockupData.job.job_name)
			$("#custID").val(this.mockupData.customer.customer_id)
			$("#custName").val(this.mockupData.customer.customer_name)
			$("#customerLabel").val("C9999999: TEST MIS ครับบ")

			$(`.deliveryDestinationId`).val(49)
			$(`.deliveryDestinationName`).val('ฉะเชิงเทรา')
			displayComponent2(this.mockupData.component1)
			check = true
		}
		checkRequiredInput()
		return check
	}

	setMockupData2() {
		this.mockupData = this.mockupData2
		return this.setMockupData()

	}

	setDefaultDeliveryQty(arr = []) {
		this.checkDeliveryQty = arr
	}
	setCheckDeliverChangeQty(qty) {
		this.checkDeliveryQty = this.checkDeliveryQty.map(obj => ({ ...obj, qty, balance: qty }))
	}
	setCheckDeliveryQtyAddComp(action, qty) {
		action === 'add'
			? this.checkDeliveryQty.push({
				qty: this.checkDeliveryQty[this.checkDeliveryQty.length - 1]?.qty || qty,
				balance: this.checkDeliveryQty[this.checkDeliveryQty.length - 1]?.qty || qty
			})
			: this.checkDeliveryQty.pop()
	}
	getBalanceDeliveryQty(compIndex) {
		return this.checkDeliveryQty[compIndex]?.balance || 0
	}

	setCalculateCheckDeliveryQty() {
		const is_multiple_f = getIsMultipleF()
		const checkQty = []
		this.checkDeliveryQty = []

		//* เก็บยอดทั้งหมด
		if (is_multiple_f) {
			$(`.f_table`).each((fIndex, ele) => {
				const f_index = fIndex
				const qty = numeral($(ele).find(`.inputQty input`).val() || 0).value()
				const runon_qty = numeral($(ele).find(`.runonQty input`).val() || 0).value()
				const total_qty = qty + runon_qty

				this.checkDeliveryQty.push({
					comp: f_index,
					qty: total_qty,
					balance: total_qty
				})
			})
		} else {
			$('.component').each((compIndex, ele) => {
				const qty = numeral($('#qty_info .inputQty input:eq(0)').val()).value()
				const runon_qty = numeral($('#qty_info .runonQty input:eq(0)').val()).value()
				const total_qty = qty + runon_qty

				this.checkDeliveryQty.push({
					comp: compIndex,
					qty: total_qty,
					balance: total_qty,
				})
			})
		}

		//* หายอดที่คีย์ไปแล้ว
		if ($('.component').length === 1 && !is_multiple_f) {
			//* เก็บข้อมูลแบ่งส่งที่คีย์แล้ว กรณี 1 Comp.
			const trLength = $('#deliveryProcess table:first .deliveryProcess').length
			for (let index = 0; index < trLength; index++) {
				const comp = 0
				const qty = numeral($(`#deliveryProcess table:first .deliveryProcess[index=${index}] .deliveryQty input`).val() || 0).value()
				checkQty.push({ comp, qty })
			}
		} else {
			//* เก็บข้อมูลแบ่งส่งที่คีย์แล้ว กรณี หลาย Comp. หรือ งานหลาย F
			const trLength = $('.trDeliveryMultipleProcess').length
			for (let index = 0; index < trLength; index++) {
				const comp = parseInt($(`.trDeliveryMultipleProcess select.deliveryComponentId:eq(${index})`).val())
				const qty = numeral($(`.trDeliveryMultipleProcess .deliveryQty input:eq(${index})`).val() || 0).value()
				checkQty.push({ comp, qty })
			}
		}

		//* ยอดทั้งหมด - ยอดที่คีย์แล้ว
		this.checkDeliveryQty = this.checkDeliveryQty.map((obj, index) => {
			const balance = checkQty.reduce((total, curr) => total += curr.comp == obj?.comp ? curr.qty : 0, 0)
			return {
				...obj,
				balance: obj.qty - balance
			}
		})
	}

	setPrevData(data) {
		this.prevData = data
	}

	setJob(obj) {

		this.mainData.job.job_name = obj.job_name
		this.mainData.job.job_id = obj.job_id
		this.mainData.job.ref_copy_rfq = obj?.ref_copy_rfq || ''
		this.mainData.job.is_reprinted = obj.is_reprinted
		this.mainData.job.ink_type = obj.ink_type
		this.mainData.job.print_type = obj.print_type
		this.mainData.job.flexo_size = obj.flexo_size
		this.mainData.job.color_limit = obj.color_limit
		this.mainData.job.is_multiple_f = obj.is_multiple_f
		this.mainData.job.is_use_previous_plate = obj.is_use_previous_plate
		this.mainData.job.is_profit_sharing = obj.is_profit_sharing
		this.mainData.job.is_cancel_total_profit_sharing = obj?.is_cancel_total_profit_sharing
		this.mainData.job.credit_term_id = obj?.credit_term_id
		this.mainData.job.credit_term_name = obj?.credit_term_name
	}

	setDifferentPacking(bool = false) {
		this.mainData.job.is_different_packing = bool
	}

	setCustomer(obj) {
		this.mainData.customer = obj
	}

	setAE(obj) {
		this.mainData.ae = obj
	}

	setEstimator(obj) {
		this.mainData.estimator = obj
	}

	setRejectRemark(arr) {
		this.mainData.rejectRemark = arr
	}

	setDate(obj) {
		this.mainData.date = obj
		console.log(obj, this.mainData.date)
	}

	setRfqRemark(text) {
		this.mainData.remark = text
	}

	setFileUpload({ action, fileInfo, fileId }) {
		if (!this.mainData.fileUpload?.length) {
			this.mainData.fileUpload = []
		}
		if (action === 'add') {
			this.mainData.fileUpload = [...this.mainData.fileUpload, fileInfo]
		} else {
			this.mainData.fileUpload = this.mainData.fileUpload.filter(file => {
				return file.id != fileId
			})
		}
	}

	setIsEditLayout(index, boolean) {
		this.mainData.component1[index].layout.is_editLayout = boolean
	}
	setIsEditTolerance(index, boolean) {
		this.mainData.component1[index].paper_tolerance.is_editTolerance = boolean
	}

	setInActiveFile(index, fileId) {
		if (fileId) {
			this.mainData.fileUpload = this.mainData?.fileUpload?.map(file => file.id === fileId ? ({ ...file, active: false }) : file)
		}
		$(`#file_upload_table table tr:eq(${index})`).remove()
		const elements = $(`#file_upload_table table tr`)
		for (let index = 0; index < elements.length; index++) {
			elements[index].attributes.index.value = index
		}
	}
	setDelivery(arr) {
		this.mainData.delivery = arr
	}

	//! must be deleted *************************
	// setJobSize(obj){
	// 	this.mainData.job_size=obj
	// }

	setTax(obj) {
		if (obj == "") {
			this.mainData.tax = 3
		} else {
			this.mainData.tax = obj.tax
		}
	}

	setExchangeRate(obj) {
		this.mainData.currency_no = obj?.currency_no || 'THB'
		this.mainData.exchange_rate = obj?.exchange_rate || 1
	}

	setMarkingPercent(index, obj) {
		this.mainData.totalprice[index] = {
			...this.mainData.totalprice[index],
			...obj
		}
	}

	setQty(obj) {
		this.mainData.qty.main = obj.main
		this.mainData.qty.runon_percent = obj.runon_percent
		this.mainData.qty.runon = obj.runon
		this.mainData.qty.customer = obj.customer
		this.mainData.qty.ae = obj.ae
		this.mainData.qty.totalqty = []
		this.setTotalQty()
	}

	setTotalQty() {
		const qtyInfo = this.mainData.qty
		this.mainData.qty.main.forEach((qty, index) => {
			this.mainData.qty.totalqty.push(qty + qtyInfo.runon[index] + qtyInfo.customer + qtyInfo.ae)
		})
	}

	setFDetail(f_detail) {
		this.mainData.component1.forEach(comp => comp.f_detail = f_detail)
	}

	setBoxType(item, id) {
		var boxType = db.db.box_template_info.filter(({ type_id }) => type_id == id)[0]

		item.box_type.type_name = boxType.type_name_th + " : " + boxType.type_name,
			item.box_type.packing_layer = boxType.packing_layer

		if (id == 12) {
			item.box_type.packing_layer = item.packing_layer
			delete item.packing_layer
		}
	}

	setComponent1(components) {
		/*
			1. Set component to rfq.
			2. Set default data.
		*/
		this.setDefaultProcess()

		if (components.length > 0) {
			this.mainData.component1 = components
		}

		this.mainData.component1.forEach((comp) => {
			const { box_type: { type_id } } = comp || {}
			this.setPackagingSize(comp, type_id)
			this.setCompTypeTolerance(comp, false)
			this.setBoxType(comp, type_id)
			this.setMachine(comp)
		})
	}

	setDefaultProcess() {
		//* set Process array and Material array
		this.mainData.process = [
			{
				type_id: 7,
				process_id: 22,
				type: 'afterpress',
				name: 'chip',
				info: {},
				line: []
			},
			{
				type_id: 7,
				process_id: 23,
				type: 'afterpress',
				name: 'inspection',
				info: {},
				line: []
			}
		]

		this.mainData.material = []
	}

	setOtherProcess(arr) {
		this.mainData.process = this.mainData.process.filter((item) => item.type != 'other')
		this.mainData.process.push(...arr)
	}

	setHandworkProcess(arr) {
		this.mainData.process = this.mainData.process.filter((item) => item.type != 'handwork')
		this.mainData.process.push(...arr)
	}

	setCustomProcess(arr) {
		this.mainData.process = this.mainData.process.filter((item) => item.type != 'custom')
		this.mainData.process.push(...arr)
	}

	setMaterial(arr) {
		this.mainData.material = arr
	}

	setOtherCost(arr) {
		this.mainData.otherCost = arr
	}

	setSpecialInk(arr) {
		this.mainData.specialInk = arr
	}

	setManualLayout(index, boolean) {
		this.mainData.component1[index].layout_manual = boolean
	}

	setLayout4Manual(index) {
		this.mainData.component1[index].layout = {
			laySize: this.getOpenSize(index),
			layout: {},
			selected_layout: {
				grain_box_type: "",
				laying: "",
				laying_type: "",
				layout: [1, 1],
				num_laying: 1,
				paper_size: [],
				printing: []
			}
		}
	}

	setPaperSize(item, paperSize, obj) {
		const {
			parallel_side = 'WSize',
			is_switchDisplay,
			paper_align,
			std_paper_id = null,
			realPaperSize = []
		} = obj || {}

		const tempPaperSize = realPaperSize.length ? realPaperSize : paperSize

		console.log("setPaperSize Params", paperSize, obj, tempPaperSize)

		item.paperSize = paperSize

		if (item.layout_manual) {

			item.paper_info = {
				paper_align,
				parallel_roll_width: parallel_side,
				is_switchDisplay: is_switchDisplay
			}
			if (parallel_side == "WSize") {
				item.paper_info.roll_width = tempPaperSize[2]
				item.paper_info.cut_off = tempPaperSize[3]
				item.paper_info.paper_grain = 'horizontal'
			} else {
				item.paper_info.roll_width = tempPaperSize[3]
				item.paper_info.cut_off = tempPaperSize[2]
				item.paper_info.paper_grain = 'vertical'
			}

		} else {

			item.paper_info = {}
			item.paper_info.std_paper_id = std_paper_id,
				item.paper_info.paper_align = paper_align,
				item.paper_info.parallel_roll_width = parallel_side
			item.paper_info.is_switchDisplay = is_switchDisplay

			if (is_switchDisplay) {
				if (parallel_side == "WSize") {
					console.log("setPaperSize", 1)
					item.paper_info.roll_width = tempPaperSize[3]
					item.paper_info.cut_off = tempPaperSize[2]
					item.paper_info.paper_grain = 'horizontal'
				} else {
					console.log("setPaperSize", 2)
					item.paper_info.roll_width = tempPaperSize[2]
					item.paper_info.cut_off = tempPaperSize[3]
					item.paper_info.paper_grain = 'vertical'
				}
			} else {
				if (parallel_side == "WSize") {
					console.log("setPaperSize", 3)
					item.paper_info.roll_width = tempPaperSize[2]
					item.paper_info.cut_off = tempPaperSize[3]
					item.paper_info.paper_grain = 'horizontal'
				} else {
					console.log("setPaperSize", 4)
					item.paper_info.roll_width = tempPaperSize[3]
					item.paper_info.cut_off = tempPaperSize[2]
					item.paper_info.paper_grain = 'vertical'
				}
			}

		}

		console.log("after setPaperSize :", item, item?.corrugated_layer?.info, item.paper_info, item.paperSize)

	}

	getPrintType() {
		return this.mainData.job.print_type || $('#print_type select').val()
	}

	setMachine(comp, customMachineId, is_manualPaperSize = false) {
		const {
			component_type: { type: compType },
			color = [],
			packaging_size: { open_size },
		} = comp || {}

		const machineList = est.getMachineList(comp)
		const printType = this.getPrintType()

		console.log("printType", printType)
		const ink_type = getInkType()

		let std_paper_id = null
		let defaultPaperSize = []
		let realPaperSize = []
		let defaultStdPaperSize = []
		let parallel_side = 'WSize',
			is_switchDisplay = false,
			limit_paper_min_size = ''

		const maxColor = color?.reduce((max, curr) => max = max < Math.max(curr.inside, curr.outside) ? Math.max(curr.inside, curr.outside) : max, 0)
		console.log("setMachine", maxColor)
		//* Only Corrugated
		if ([3].includes(compType)) {
			const {
				corrugated_layer: {
					info: {
						is_price_per_sheet = false,
						corrugated_size = [],
						corrugated_flute_side = 'WSize',
						num_layer
					}
				}
			} = comp || {}


			if (is_price_per_sheet) { //* custom corrugated size
				parallel_side = corrugated_flute_side
				is_manualPaperSize = true
				comp.paperSize = corrugated_size
			}

			let flexoMachine = machineList

			if (flexoMachine.length) {
				let tempPaperSize = [0, 0, 0, 0]

				let defaultFlexo = flexoMachine.find(obj => obj.machine_size.id == 4)

				if (customMachineId) {
					defaultFlexo = flexoMachine.find(obj => obj.machine_size.id == customMachineId)
				} else {
					const isMatchMachine =
						(open_size[2] <= defaultFlexo.max_size[2] && open_size[3] <= defaultFlexo.max_size[3])
						||
						(open_size[2] <= defaultFlexo.max_size[3] && open_size[3] <= defaultFlexo.max_size[2])

					if (!isMatchMachine) {
						defaultFlexo = flexoMachine.find(obj => obj.machine_size.id == 9998)
					}
				}

				console.log("defaultFlexo", customMachineId, defaultFlexo)
				comp.machine = defaultFlexo
				tempPaperSize = defaultFlexo?.max_size

				if (is_manualPaperSize) {
					defaultPaperSize = comp.paperSize
				} else {
					defaultPaperSize = [
						tempPaperSize[2],
						tempPaperSize[3],
						tempPaperSize[0],
						tempPaperSize[1]
					]
				}
			} else {
				alert('ไม่พบเครื่องที่เหมาะสมกับประเภทพิมพ์ Flexo')
			}
		}

		// * Only With Corrugated
		if ([2].includes(compType)) {
			const {
				corrugated_layer: {
					info: {
						is_price_per_sheet = false,
						corrugated_size = [],
						corrugated_flute_side = 'WSize'
					}
				}
			} = comp || {}

			if (is_price_per_sheet) { //* custom corrugated size
				parallel_side = corrugated_flute_side
				limit_paper_min_size = [corrugated_size[2] + 0.375, corrugated_size[3] + 0.375] //* spread between corrugated and paper
				// is_manualPaperSize = true
				// comp.paperSize = corrugated_size
			}
		}

		if ([1, 2].includes(compType)) {
			let selectedMachine = null
			let matchLaySizePaper = []

			// * get machine detail.
			if (customMachineId) {
				selectedMachine = machineList?.find(obj => obj?.machine_size.id == customMachineId) || machineList[0]
			} else {
				// * Default Machine 
				selectedMachine = machineList?.find(obj => obj?.machine_size.id == 2) || machineList[0]
			}
			// * set comp. machine.
			comp.machine = selectedMachine

			// default use max_size from any machine_size
			// 0 = W-inch , 1 = L-inch , 2 = W-mm , 3 = L-mm
			defaultPaperSize = [
				selectedMachine.max_size[2],
				selectedMachine.max_size[3],
				selectedMachine.max_size[0],
				selectedMachine.max_size[1],
			]

			if (is_manualPaperSize) {
				defaultPaperSize = comp.paperSize
			} else {
				defaultStdPaperSize = getStdPaperList(comp, true)
				const { packaging_size: { open_size } } = comp || {}
				const [wSize, lSize] = open_size

				if (limit_paper_min_size == '') {
					limit_paper_min_size = [wSize + 1.04, lSize + 0.57] //* default open size for find std. paper size
				}

				if (!customMachineId && ['Offset']?.includes(printType)) {
					//* not fixed machine
					matchLaySizePaper = this.findMatchStdPaperWithLaySize(defaultStdPaperSize, limit_paper_min_size)

					if (matchLaySizePaper.length > 0) {
						defaultStdPaperSize = matchLaySizePaper
					} else if (ink_type == 'UV' && maxColor > 0) {
						defaultStdPaperSize = getStdPaperList(comp, false)

						if (!defaultPaperSize?.length) {
							comp.machine = machineList?.find(obj => obj?.machine_size.id == 2)
							defaultStdPaperSize = getStdPaperList(comp, true)
						}
					} else {
						comp.machine = machineList[0]
						defaultStdPaperSize = []
					}
				}

				matchLaySizePaper = this.findMatchStdPaperWithLaySize(defaultStdPaperSize, limit_paper_min_size)

				if (matchLaySizePaper.length > 0) {
					defaultStdPaperSize = matchLaySizePaper
				} else {
					//* use other std. paper not only default
					defaultStdPaperSize = getStdPaperList(comp, false)
					matchLaySizePaper = this.findMatchStdPaperWithLaySize(defaultStdPaperSize, limit_paper_min_size)
					defaultStdPaperSize = matchLaySizePaper

					if (matchLaySizePaper.length <= 0) {
						defaultStdPaperSize = []
					}
				}

				if (defaultStdPaperSize.length > 0) { //* have std paper
					//* std. paper
					const {
						std_paper_size_width_mm,
						std_paper_size_length_mm,
						std_paper_size_width_in,
						std_paper_size_length_in,
						//* ref std.paper
						std_paper_size_ref_width_in,
						std_paper_size_ref_length_in,
						std_paper_size_ref_width_mm,
						std_paper_size_ref_length_mm
					} = defaultStdPaperSize[0] //* now set found first size

					defaultPaperSize = [
						std_paper_size_width_mm,
						std_paper_size_length_mm,
						std_paper_size_width_in,
						std_paper_size_length_in,
					]

					realPaperSize = [
						std_paper_size_ref_width_mm,
						std_paper_size_ref_length_mm,
						std_paper_size_ref_width_in,
						std_paper_size_ref_length_in
					]

					std_paper_id = defaultStdPaperSize[0].std_paper_id

				} else {
					// use default
					defaultPaperSize = [
						comp.machine.max_size[2],
						comp.machine.max_size[3],
						comp.machine.max_size[0],
						comp.machine.max_size[1],
					]
				}
			}
		}

		// if (customMachineId && !defaultStdPaperSize.length) {
		// 	return false
		// } else {
		const paper_align_info = {
			paper_align: 'short',
			parallel_side: parallel_side || 'WSize',
			std_paper_id,
			realPaperSize,
			is_switchDisplay: is_switchDisplay
		}

		this.setPaperSize(comp, defaultPaperSize, paper_align_info)
		return true
		// }
	}

	getMachineList(component = {}, customColor = []) { //* หาเครื่องจักรที่ใช้งานได้ตามเงื่อนไข
		const {
			color = [],
			component_type: {
				type = 1
			}
		} = component || {}

		const isProfitSharing = getIsProfitSharing()
		const printType = this.getPrintType()
		const inkType = getInkType()
		let colorList = color

		if (customColor?.length) {
			colorList = customColor
		}

		const maxColor = colorList?.reduce((max, curr) => max = max < Math.max(curr.inside, curr.outside) ? Math.max(curr.inside, curr.outside) : max, 0)


		// * เงื่อนไข รูปแบบพิมพ์ Offset , Flexo , Jet Press , Konica
		let machineList = _.cloneDeep(defaultData.machine?.filter(obj => obj.print_type?.includes(printType)))

		console.log("machineList 1", machineList)
		const isOnlyCut2 = getIsOnlyCut2(component, customColor)

		if (isOnlyCut2) {
			// machineList = machineList?.filter(obj => obj.machine_size.id == 2)
			machineList = _.cloneDeep(defaultData.machine?.filter(obj => obj.machine_size.id == 2))
		}
		console.log("machineList 2", machineList)

		// * เงื่อนไข รูปแบบ component. ไม่ประกบ , ประกบ , เฉพาะ
		machineList = machineList?.filter(({ compType }) => compType.includes(type))
		console.log("machineList 3", machineList)


		// * เงื่อนไข min , max สี
		machineList = machineList?.filter(obj => maxColor >= obj.color?.min && maxColor <= obj.color?.max)

		// * New Condition for Flexo 07.01.25
		if (type == 3) {
			const {
				corrugated_layer: {
					info: {
						is_price_per_sheet = false,
						corrugated_size = [],
						corrugated_flute_side = 'WSize',
						num_layer
					}
				}
			} = component || {}

			machineList?.forEach(mc => {
				if (mc?.machine_size?.id == 4) {

					const flexoSize = mc?.size_options?.find(obj => obj?.corrugated_layer?.includes(num_layer)) || null

					if (mc && flexoSize) {
						// defaultData.setMachineSize(mc.machine_size.id, flexoSize)
						mc.min_size = flexoSize.min_size
						mc.max_size = flexoSize.max_size
						mc.w_range = flexoSize.w_range
						mc.l_range = flexoSize.l_range
					}

				}
			})
		}


		console.log("machineList 4", machineList)
		return machineList
	}

	setPaperInfo(index) {
		const componentType = getComponentType(index)
		const { paper, corrugated_layer, gram } = getPapernCorrugated(index, componentType)

		this.mainData.component1[index].paper = paper
		this.mainData.component1[index].corrugated_layer = corrugated_layer
		this.mainData.component1[index].gram = gram
	}

	setPackagingSize(comp, type) {
		// * set fold_size, open_size, packing_size

		comp.packaging_size.fold_size = this.setCalculateFoldSize(comp.packaging_size, type)
		if (type != 12) { //check is type12 (custom template) or not
			comp.packaging_size.open_size = this.setCalculateOpenSize(comp.packaging_size, type)
			comp.packaging_size.packing_size = this.getPackingSize(comp)
		} else {
			comp.packaging_size.open_size = comp.open_size
			comp.packaging_size.packing_size = comp.packing_size

			delete comp.open_size
			delete comp.packing_size
		}

	}

	setCompTypeTolerance(comp, is_custom = false, tolerance) {
		// * set all "border" by component type
		// const printType = getPrintType()
		const { component_type: { type: compType } } = comp || {}

		const { tolerance: defaultTolerance } = defaultData?.print_type_config?.getPrintTypeConfig()

		// let defaultTolerance = defaultData?.component_type.find(obj => obj.type === compType)?.tolerance
		// if (printType == 'Jet Press') {
		// 	defaultTolerance = defaultData?.jetPress?.tolerance
		// }

		const compTolerance = is_custom
			? tolerance
			: defaultTolerance || defaultData.tolerance


		const { gripper, color_bar, paper_edge, bleed } = compTolerance

		this.setTolerance(comp,
			gripper,
			color_bar,
			paper_edge,
			bleed
		)
	}

	setTolerance(comp, gripper = 0, color_bar = 0, paper_edge = 0, bleed = 0) {
		comp.paper_tolerance = {
			...comp.paper_tolerance,
			gripper,
			color_bar,
			paper_edge,
			bleed,
		}
	}

	setWaste(item) {
		const is_multiple_f = getIsMultipleF()
		const printType = getPrintType()
		const { color_limit } = this.mainData.job || {}
		const {
			color, // array
			f_detail,
			component_type: { type: compType },
			box_type: { is_digital_diecut = false }
		} = item
		const { color_limit: default_color_limit } = defaultData
		const printTypeConfig = defaultData?.print_type_config?.getPrintTypeConfig()

		let wasteReducePercent = 0

		item.waste = {
			waste: [],
			waste_print: [],
			waste_afterpress: [],
			waste_print_col_add: [],
			waste_coating: [],
			waste_coating_net: [],
			waste_foilstamp: [],
			waste_bossing: [],
			waste_corrugated_board: [],
			waste_color_limit: [],
			waste_reduce_percent: [],
			waste_afterpress_net: [],
			total_reduce: []
		}

		item.paper_usage.line.forEach((item1, index1) => { //* วนลูปยอดแต่ละ F หรือ ตามจำนวน qty.
			const thisColorLimit = color_limit[index1]
			//* Reduce Waste
			wasteReducePercent = 0

			wasteReducePercent += printTypeConfig?.reduce_paper_waste_percent || 0

			const fCode = f_detail?.f_list[index1]?.f_code || ""
			let waste_color_limit = 0,
				waste_print = 0,
				waste_afterpress = 0,
				waste_coating = 0,
				waste_afterpress_net = 0,
				waste_coating_net = 0

			let colorDetail = color[0],
				total_waste_reduce = 0

			//* find f code color
			if (fCode) {
				colorDetail = color?.find(obj => obj?.f_code === fCode) || color[0]
			}

			const { outside = 0, inside = 0, all } = colorDetail || {}

			//* only no corrugated , with corrguated & use limit color
			if ([1, 2].includes(compType) && thisColorLimit.is_color_limit) {
				if (outside > 0) {
					waste_color_limit += printTypeConfig?.color_limit_waste?.waste
					waste_color_limit += outside > 4 ? (outside - default_color_limit.max_color) * printTypeConfig?.color_limit_waste?.waste_per_color : 0
				}

				if (inside > 0) {
					waste_color_limit += printTypeConfig?.color_limit_waste?.waste
					waste_color_limit += inside > 4 ? (inside - default_color_limit.max_color) * printTypeConfig?.color_limit_waste?.waste_per_color : 0
				}
			}

			//* set waste -- start --
			// * print ใช้เรทตาม type , waste อื่นๆใช้เรทตาม Offset
			const { print_rate: master_waste_print = 0, digital_diecut_rate = 0, coating_rate = 0 } = getMasterPaperWaste(printType, item1.after_ups)
			const wasteInfo = getMasterPaperWaste(null, item1.after_ups)
			console.log("wasteInfo", wasteInfo)

			//* START Calc. WASTE [ print ]
			waste_print = master_waste_print
			waste_afterpress = wasteInfo.afterpress_rate
			waste_coating = wasteInfo.coating_rate

			if (master_waste_print < 1) { //* print_rate in % must be less than 1.00
				waste_print = Math.ceil(item1.after_ups * master_waste_print)
			}

			if (wasteInfo?.afterpress_rate < 1) { //* afterpress_rate in % must be less than 1.00
				waste_afterpress = Math.ceil(item1.after_ups * wasteInfo.afterpress_rate)
			}


			item.waste.waste_print.push(waste_print)
			//* END Calc. WASTE [ print ]

			if (compType != 1) {
				waste_afterpress += wasteInfo.corrugatedglued_rate
			}

			if (is_digital_diecut) {
				wasteReducePercent += printTypeConfig?.reduce_paper_waste_percent_digital_diecut || 0

				waste_afterpress = 0
				waste_coating = 0
				waste_afterpress_net = digital_diecut_rate
				waste_coating_net = coating_rate
			}


			item.waste.waste_afterpress.push(waste_afterpress)
			item.waste.waste_afterpress_net.push(waste_afterpress_net)
			item.waste.waste_coating.push(waste_coating)
			item.waste.waste_coating_net.push(waste_coating_net)
			item.waste.waste_print_col_add.push(wasteInfo.print_col_add_rate)
			item.waste.waste_foilstamp.push(wasteInfo.foilstamp_rate)
			item.waste.waste_bossing.push(wasteInfo.bossing_rate)
			item.waste.waste_corrugated_board.push(wasteInfo.corrugated_board_rate)
			item.waste.waste_color_limit.push(waste_color_limit)

			//* set waste -- end --

			//* start reduce waste process
			item.waste.waste_reduce_percent.push(wasteReducePercent)

			Object.entries(item.waste).forEach(([key, value]) => {
				if (!['waste_print', 'waste', 'total_reduce', 'waste_reduce_percent', 'waste_color_limit', 'waste_afterpress_net', 'waste_coating_net'].includes(key)) {
					let total_reduce = Math.ceil((value[index1] * (wasteReducePercent / 100)) || 0)
					total_waste_reduce += Math.ceil((value[index1] - total_reduce) || 0)
					item.waste[key][index1] = Math.ceil((value[index1] - total_reduce) || 0)
				}
			})

			item.waste.total_reduce.push(total_waste_reduce)
			//* end reduce waste process

			//* SUM ALL WASTE
			var waste = 0

			if (['Jet Press', 'Konica']?.includes(printType)) {
				if (outside > 0) {
					waste += item.waste.waste_print[index1]
				}

				if (inside > 0) {
					waste += item.waste.waste_print[index1]
				}
			} else {
				waste += item.waste.waste_print[index1]
			}

			waste += item.waste.waste_color_limit[index1]
			waste += item.waste.waste_afterpress[index1]
			waste += item.waste.waste_afterpress_net[index1]

			if (all > 4 && !['Jet Press', 'Konica']?.includes(printType)) {
				var col_add = all - 4
				waste += col_add * item.waste.waste_print_col_add[index1]
			}

			//* check waste addon
			item.addon.forEach((addon) => {

				//* add waste every F
				if (addon.type == 'coating') {
					if (addon.info.side == 1) {
						waste += item.waste.waste_coating[index1]
						waste += item.waste.waste_coating_net[index1]
					} else {
						waste += 2 * item.waste.waste_coating[index1]
						waste += 2 * item.waste.waste_coating_net[index1]
					}
				}

				//* add some F
				if (is_multiple_f) {
					if (addon.type == 'foilstamp' && addon.info?.f_code.includes(fCode)) {
						waste += item.waste.waste_foilstamp[index1]
					}
					if (addon.type == 'emboss' && addon.info?.f_code.includes(fCode)) {
						waste += item.waste.waste_bossing[index1]
					}
					if (addon.type == 'deboss' && addon.info?.f_code.includes(fCode)) {
						waste += item.waste.waste_bossing[index1]
					}

				} else {
					if (addon.type == 'foilstamp') {
						waste += item.waste.waste_foilstamp[index1]
					}
					if (addon.type == 'emboss') {
						waste += item.waste.waste_bossing[index1]
					}
					if (addon.type == 'deboss') {
						waste += item.waste.waste_bossing[index1]
					}

				}
			})

			item.waste.waste.push(waste)
		})
	}

	setPriceRate(type, qty, item = 0) {
		const printType = getPrintType()
		var price_rate = 0, min_price = 0

		let check_print_type = 0

		//* find price rate
		db.db.price_info.forEach((item1) => {
			if (item1.min_qty <= qty && item1.max_qty >= qty) {
				switch (type) {

					case 'print_1col':
						price_rate = item1.print_1col
						break
					case 'print_3col':
						price_rate = item1.print_3col
						break
					case 'print_5col':
						price_rate = item1.print_5col
						break
					case 'print_flexo':
						price_rate = item1.print_flexo
						break
					case 'trim':
						price_rate = item1.trim
						break
					case 'diecut':
						price_rate = item1.diecut
						break
					case 'foilstamp':
						price_rate = item1.foilstamp
						break
					case 'bossing':
						price_rate = item1.bossing
						break
					case 'chip':
						price_rate = item1.chip
						break
					case 'inspection':
						price_rate = item1.inspection
						break
					case 'assembly_S':
						price_rate = item1.assembly_S * this.getAssemblyFactor(item)
						break
					case 'assembly_M':
						price_rate = item1.assembly_M * this.getAssemblyFactor(item)
						break
					case 'assembly_L':
						price_rate = item1.assembly_L * this.getAssemblyFactor(item)
						break
					default:
						console.log('price_rate NO MATCH')
						break
				}
			}
		})

		//* find min price
		const min_price_info = db.db.min_price_info?.find(obj =>
			obj?.type == type &&
			obj.min_qty <= qty && obj.max_qty >= qty
		)

		switch (printType) {
			case 'Jet Press':
				min_price = min_price_info?.min_price_jet_press
				break;
			case 'Konica':
				min_price = min_price_info?.min_price_konica
				break;
			default:
				min_price = min_price_info?.min_price
				break;
		}

		if (qty * price_rate < min_price) {
			var price = min_price
		} else {
			var price = parseFloat((qty * price_rate).toFixed(2))
		}

		var price_obj = {
			min_price: min_price,
			unit_price: price_rate,
			price: price
		}

		return price_obj
	}

	setPriceRate4JetPress(item, paper_print = 0) {
		const {
			layout_manual = false,
			paperSize = [0, 0, 0, 0],
			layout: { laySize = [0, 0, 0, 0] }
		} = item || {}
		let compareSize = [paperSize[0], paperSize[1]]
		let print_price = 1

		if (layout_manual) {
			compareSize = [laySize[2], laySize[3]]
		}

		print_price = db.db.jetpress_info?.find(obj => {
			return compareSize[0] == obj?.paper_size[0] && compareSize[1] == obj?.paper_size[1] &&
				paper_print >= obj?.min && paper_print <= obj?.max
		})?.print_price || 1

		return print_price
	}

	// New update 26.02.22
	setBlockDiecutRate2(layout) {
		let shortSide,
			longSide = 0
		if (layout[0] <= layout[1]) {
			shortSide = layout[0]
			longSide = layout[1]
		} else {
			shortSide = layout[1]
			longSide = layout[0]
		}

		if (this.mainData.job.is_reprinted) {
			return defaultData.reprinted_block
		} else {
			for (var index = 0; index < db.db.block_diecut_info.length; index++) {
				var item = db.db.block_diecut_info[index]
				if (shortSide <= item.width && longSide <= item.length) {
					return item.rate
				}
			}
		}

	}


	setAssemblyType(openSize) {
		var check = false
		for (var index = 0; index < defaultData.assembly_size.length; index++) {
			var item = defaultData.assembly_size[index]
			if (openSize[0] <= item.width && openSize[1] <= item.length) {
				check = true
				return item.type
			}
		}
		if (check == false) {
			return 'assembly_L'
		}
	}

	setCalculateNumLayout(number) {
		//หาจำนวน ด้านกว้าง*ด้านยาว ที่เป็นไปได้
		var arr = []
		var arr1 = []
		for (var i = 1; i <= number; i++) {
			if (number % i == 0) {
				arr.push(i)
			}
		}
		for (var i = 1; i <= arr.length / 2; i++) {
			arr1.push([arr[i - 1], arr[arr.length - i]])
		}
		if (arr.length % 2 == 1) {
			arr1.push([arr[Math.floor(arr.length / 2)], arr[Math.floor(arr.length / 2)]])
		}
		return arr1
	}

	setCutSize(item, is_useMachineSize) {
		var check = false
		const { component_type: { type: compType } } = item || {}
		const { short_side, long_side, board_size } = getShortLongSide(item, item.layout?.selected_layout)

		if (is_useMachineSize == false) {
			//* from recal_bttn do this case.

			var current_machine = 0

			const machineList = this.getMachineList(item)
			const matchMachine = getUsableMachine(item, machineList.filter((item1) =>
				item1.machine_size.id == item?.machine?.machine_size?.id
			))[0]

			if (matchMachine) {
				current_machine = matchMachine
			} else {
				console.log('can not find current_machine')
				current_machine = machineList?.length ? machineList[0] : 0
			}

			const { w_range, l_range } = current_machine

			if (compType == 3) {
				// * เฉพาะลูกฟูก  Flexo เทียบด้าน : ด้าน (ด้านซ้ายเป็นลอนเสมอ) 08.01.25
				// * condition ref code: FLEXO080125

				if (
					board_size[2] >= w_range[2]
					&& board_size[2] <= w_range[3]
					&& board_size[3] >= l_range[2]
					&& board_size[3] <= l_range[3]
				) {
					// paper size match with curr. machine
					check = true
				}
			} else {

				if (
					short_side >= w_range[2]
					&& short_side <= w_range[3]
					&& long_side >= l_range[2]
					&& long_side <= l_range[3]
				) {
					// paper size match with curr. machine
					check = true
				}
			}
		}
		return check

	}

	setCalculatePackingCarton(arr, lay_bulk_size) {
		var laying = []
		arr.forEach((item, index) => {
			var v_w_side = item[0] * lay_bulk_size[0]
			var v_l_side = item[1] * lay_bulk_size[1]
			var h_w_side = item[0] * lay_bulk_size[1]
			var h_l_side = item[1] * lay_bulk_size[0]
			laying.push(
				{
					laying: 'vertical',
					layout: item,
					w_side: [parseFloat(v_w_side.toFixed(2)), parseFloat(item[0] * lay_bulk_size[3])],
					l_side: [parseFloat(v_l_side.toFixed(2)), parseFloat(item[1] * lay_bulk_size[4])],
					diff: Math.abs(v_l_side - v_w_side),

				},
				{
					laying: 'horizontal',
					layout: item,
					w_side: [parseFloat(h_w_side.toFixed(2)), parseFloat(item[0] * lay_bulk_size[4])],
					l_side: [parseFloat(h_l_side.toFixed(2)), parseFloat(item[1] * lay_bulk_size[3])],
					diff: Math.abs(h_l_side - h_w_side)
				}
			)
		})

		var min = Infinity
		var best_laying

		laying.forEach((item, index) => {
			if (item.diff < min) {
				min = item.diff
				best_laying = item
			}
		})

		return best_laying
	}

	setCalculateCustomLayingSize(item, num_layout) {
		//* Calculate Layout size from number of layout 
		const { packaging_size, paper_tolerance, box_type, component_type: { type: compType }, paperSize } = item

		console.log("layyyyyyyy", item, num_layout, item.paper_info)
		const { roll_width, cut_off } = item.paper_info
		const { paper_edge, gripper, color_bar, bleed: b } = paper_tolerance
		const {
			length: l
			, width: w
			, depth: d
			, glue_flap: g
			, tuck_flap: t
			, dust_flap: dust
			, ol
		} = packaging_size

		switch (box_type.type_id) {
			case 1:
				//* Reverse Tuck End : RTE
				if (dust <= ((w + t) / 2)) {
					var aa = 1.1
				} else { var aa = 1.2 }
				var v_w_side = this.setCalculateWSide(aa, num_layout[0], w, l, d, b, dust, ol, g, t)
				var v_l_side = num_layout[1] * this.setCalculateLSide(1.0, 1, w, l, d, b, dust, ol, g)
				var h_w_side = num_layout[0] * this.setCalculateLSide(1.0, 1, w, l, d, b, dust, ol, g)
				var h_l_side = this.setCalculateWSide(aa, num_layout[1], w, l, d, b, dust, ol, g, t)

				console.log(`this.setCalculateLSide(1.0, 1, ${w}, ${l}, ${d}, ${b}, ${dust}, ${ol}, ${g})`, this.setCalculateLSide(1.0, 1, w, l, d, b, dust, ol, g))
				console.log(`this.setCalculateWSide(${aa}, ${num_layout[1]}, ${w}, ${l}, ${d}, ${b}, ${dust}, ${ol}, ${g}, ${t})`, this.setCalculateWSide(aa, num_layout[1], w, l, d, b, dust, ol, g, t))
				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [num_layout[0], num_layout[1]],
						printing: [v_w_side, v_l_side],
						num_laying: num_layout[0] * num_layout[1],
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [num_layout[0], num_layout[1]],
						printing: [h_w_side, h_l_side],
						num_laying: num_layout[0] * num_layout[1],
					},
				]
				break
			case 2:
				//* Straight Tuck End:STE
				//* OPTION 1 :Straight
				var aa1 = 2.1
				var v1_w_side = this.setCalculateWSide(aa1, num_layout[0], w, l, d, b, dust, ol, g, t)
				var v1_l_side = num_layout[1] * this.setCalculateLSide(2.0, 1, w, l, d, b, dust, ol, g)
				var h1_w_side = num_layout[0] * this.setCalculateLSide(2.0, 1, w, l, d, b, dust, ol, g)
				var h1_l_side = this.setCalculateWSide(aa1, num_layout[1], w, l, d, b, dust, ol, g, t)

				//*OPTION2 : Overlap(Lay เหลื่อม)
				if (dust <= (w + t) / 2) {
					var aa2 = 2.2
				} else { var aa2 = 2.3 }
				var v2_w_side = this.setCalculateWSide(aa2, num_layout[0], w, l, d, b, dust, ol, g, t)
				var v2_l_side = this.setCalculateLSide(aa2, num_layout[1], w, l, d, b, dust, ol, g)
				var h2_w_side = this.setCalculateLSide(aa2, num_layout[0], w, l, d, b, dust, ol, g)
				var h2_l_side = this.setCalculateWSide(aa2, num_layout[1], w, l, d, b, dust, ol, g, t)
				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [num_layout[0], num_layout[1]],
						printing: [v1_w_side, v1_l_side],
						num_laying: num_layout[0] * num_layout[1],
					},
					{
						laying_type: 'overlap',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [num_layout[0], num_layout[1]],
						printing: [v2_w_side, v2_l_side],
						num_laying: num_layout[0] * num_layout[1],
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [num_layout[0], num_layout[1]],
						printing: [h1_w_side, h1_l_side],
						num_laying: num_layout[0] * num_layout[1],
					},
					{
						laying_type: 'overlap',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [num_layout[0], num_layout[1]],
						printing: [h2_w_side, h2_l_side],
						num_laying: num_layout[0] * num_layout[1],
					},
				]
				break
			case 3:
				//*  Tuck Top Snap Lock Bottom:TTSLB
				//*  OPTION1: Straight(Lay แบบตรงกัน)
				var aa1 = 3.1
				var v1_w_side = this.setCalculateWSide(aa1, num_layout[0], w, l, d, b, dust, ol, g, t)
				var v1_l_side = num_layout[1] * this.setCalculateLSide(3.0, 1, w, l, d, b, dust, ol, g)
				var h1_w_side = num_layout[0] * this.setCalculateLSide(3.0, 1, w, l, d, b, dust, ol, g)
				var h1_l_side = this.setCalculateWSide(aa1, num_layout[1], w, l, d, b, dust, ol, g, t)

				//* OPTION2: Overlap(Lay แบบเหลื่อมกัน)			
				if (dust <= ((w + t) / 2)) {
					var aa2 = 3.2
				} else {
					var aa2 = 3.3
				}
				var v2_w_side = this.setCalculateWSide(aa2, num_layout[0], w, l, d, b, dust, ol, g, t)
				var v2_l_side = this.setCalculateLSide(aa2, num_layout[1], w, l, d, b, dust, ol, g)
				var h2_w_side = this.setCalculateLSide(aa2, num_layout[0], w, l, d, b, dust, ol, g)
				var h2_l_side = this.setCalculateWSide(aa2, num_layout[1], w, l, d, b, dust, ol, g, t)
				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [num_layout[0], num_layout[1]],
						printing: [v1_w_side, v1_l_side],
						num_laying: num_layout[0] * num_layout[1],
					},
					{
						laying_type: 'overlap',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [num_layout[0], num_layout[1]],
						printing: [v2_w_side, v2_l_side],
						num_laying: num_layout[0] * num_layout[1],
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [num_layout[0], num_layout[1]],
						printing: [h1_w_side, h1_l_side],
						num_laying: num_layout[0] * num_layout[1],
					},
					{
						laying_type: 'overlap',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [num_layout[0], num_layout[1]],
						printing: [h2_w_side, h2_l_side],
						num_laying: num_layout[0] * num_layout[1],
					},
				]
				break
			case 4:
				//* Tuck Top Auto Bottom:TTAB
				//*  OPTION1: Straight(Lay แบบตรงกัน)
				var aa1 = 4.1
				var v1_w_side = this.setCalculateWSide(aa1, num_layout[0], w, l, d, b, dust, ol, g, t)
				var v1_l_side = num_layout[1] * this.setCalculateLSide(4.0, 1, w, l, d, b, dust, ol, g)
				var h1_w_side = num_layout[0] * this.setCalculateLSide(4.0, 1, w, l, d, b, dust, ol, g)
				var h1_l_side = this.setCalculateWSide(aa1, num_layout[1], w, l, d, b, dust, ol, g, t)


				//*OPTION2: Overlap(Lay แบบเหลื่อมกัน)
				if (dust <= ((w + t) / 2)) {
					var aa2 = 4.2
				} else { var aa2 = 4.3 }
				var v2_w_side = this.setCalculateWSide(aa2, num_layout[0], w, l, d, b, dust, ol, g, t)
				var v2_l_side = this.setCalculateLSide(aa2, num_layout[1], w, l, d, b, dust, ol, g)
				var h2_w_side = this.setCalculateLSide(aa2, num_layout[0], w, l, d, b, dust, ol, g)
				var h2_l_side = this.setCalculateWSide(aa2, num_layout[1], w, l, d, b, dust, ol, g, t)

				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [num_layout[0], num_layout[1]],
						printing: [v1_w_side, v1_l_side],
						num_laying: num_layout[0] * num_layout[1]
					},
					{
						laying_type: 'overlap',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [num_layout[0], num_layout[1]],
						printing: [v2_w_side, v2_l_side],
						num_laying: num_layout[0] * num_layout[1]
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [num_layout[0], num_layout[1]],
						printing: [h1_w_side, h1_l_side],
						num_laying: num_layout[0] * num_layout[1]
					},
					{
						laying_type: 'overlap',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [num_layout[0], num_layout[1]],
						printing: [h2_w_side, h2_l_side],
						num_laying: num_layout[0] * num_layout[1]
					},
				]
				break
			case 5:
				//* Double Glue Side Wall (Simplex Tray)
				var v_w_side = num_layout[0] * this.setCalculateWSide(5.0, 1, w, l, d, b, dust, ol, g, t)
				var v_l_side = num_layout[1] * this.setCalculateLSide(5.0, 1, w, l, d, b, dust, ol, g)
				var h_w_side = num_layout[0] * this.setCalculateLSide(5.0, 1, w, l, d, b, dust, ol, g)
				var h_l_side = num_layout[1] * this.setCalculateWSide(5.0, 1, w, l, d, b, dust, ol, g, t)

				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [num_layout[0], num_layout[1]],
						printing: [v_w_side, v_l_side],
						num_laying: num_layout[0] * num_layout[1]
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [num_layout[0], num_layout[1]],
						printing: [h_w_side, h_l_side],
						num_laying: num_layout[0] * num_layout[1]
					}
				]
				break
			case 6:
				//* Frame-Vue Tray
				var v_w_side = num_layout[0] * this.setCalculateWSide(6.0, 1, w, l, d, b, dust, ol, g, t)
				var v_l_side = num_layout[1] * this.setCalculateLSide(6.0, 1, w, l, d, b, dust, ol, g)
				var h_w_side = num_layout[0] * this.setCalculateLSide(6.0, 1, w, l, d, b, dust, ol, g)
				var h_l_side = num_layout[1] * this.setCalculateWSide(6.0, 1, w, l, d, b, dust, ol, g, t)

				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [num_layout[0], num_layout[1]],
						printing: [v_w_side, v_l_side],
						num_laying: num_layout[0] * num_layout[1]
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [num_layout[0], num_layout[1]],
						printing: [h_w_side, h_l_side],
						num_laying: num_layout[0] * num_layout[1]
					}
				]
				break
			case 7:
				//* Four Corner Beers Tray with Lid
				if (g <= (d + dust) / 2) {
					var aa = 7.1
				} else { var aa = 7.2 }
				var v_w_side = this.setCalculateWSide(aa, num_layout[0], w, l, d, b, dust, ol, g, t)
				var v_l_side = num_layout[1] * this.setCalculateLSide(7.0, 1, w, l, d, b, dust, ol, g)
				var h_w_side = num_layout[0] * this.setCalculateLSide(7.0, 1, w, l, d, b, dust, ol, g)
				var h_l_side = this.setCalculateWSide(aa, num_layout[1], w, l, d, b, dust, ol, g, t)

				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [num_layout[0], num_layout[1]],
						printing: [v_w_side, v_l_side],
						num_laying: num_layout[0] * num_layout[1]
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [num_layout[0], num_layout[1]],
						printing: [h_w_side, h_l_side],
						num_laying: num_layout[0] * num_layout[1]
					}
				]
				break
			case 8:
				//* Gable Top with Auto Bottom
				var aa = 8.1
				if (num_layout[0] == 1) {
					var v_l_aa = 8.0
				} else { var v_l_aa = 8.1 }
				if (num_layout[1] == 1) {
					var h_w_aa = 8.0
				} else {
					var h_w_aa = 8.1
				}
				var v_w_side = this.setCalculateWSide(aa, num_layout[0], w, l, d, b, dust, ol, g, t)
				var v_l_side = this.setCalculateLSide(v_l_aa, num_layout[1], w, l, d, b, dust, ol, g)
				var h_w_side = this.setCalculateLSide(h_w_aa, num_layout[0], w, l, d, b, dust, ol, g)
				var h_l_side = this.setCalculateWSide(aa, num_layout[1], w, l, d, b, dust, ol, g, t)

				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [num_layout[0], num_layout[1]],
						printing: [v_w_side, v_l_side],
						num_laying: num_layout[0] * num_layout[1]
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [num_layout[0], num_layout[1]],
						printing: [h_w_side, h_l_side],
						num_laying: num_layout[0] * num_layout[1]
					}
				]
				break
			case 9:
				//* Sleeve	
				var v_w_side = num_layout[0] * this.setCalculateWSide(9.0, 1, w, l, d, b, dust, ol, g, t)
				var v_l_side = num_layout[1] * this.setCalculateLSide(9.0, 1, w, l, d, b, dust, ol, g)
				var h_w_side = num_layout[0] * this.setCalculateLSide(9.0, 1, w, l, d, b, dust, ol, g)
				var h_l_side = num_layout[1] * this.setCalculateWSide(9.0, 1, w, l, d, b, dust, ol, g, t)

				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [num_layout[0], num_layout[1]],
						printing: [v_w_side, v_l_side],
						num_laying: num_layout[0] * num_layout[1]
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [num_layout[0], num_layout[1]],
						printing: [h_w_side, h_l_side],
						num_laying: num_layout[0] * num_layout[1]
					}
				]
				break
			case 10:
				//* Pillow Box
				var v_w_side = num_layout[0] * this.setCalculateWSide(10.0, 1, w, l, d, b, dust, ol, g, t)
				var v_l_side = num_layout[1] * this.setCalculateLSide(10.0, 1, w, l, d, b, dust, ol, g)
				var h_w_side = num_layout[0] * this.setCalculateLSide(10.0, 1, w, l, d, b, dust, ol, g)
				var h_l_side = num_layout[1] * this.setCalculateWSide(10.0, 1, w, l, d, b, dust, ol, g, t)


				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'vertical',
						layout: [num_layout[0], num_layout[1]],
						printing: [v_w_side, v_l_side],
						num_laying: num_layout[0] * num_layout[1]
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'horizontal',
						layout: [num_layout[0], num_layout[1]],
						printing: [h_w_side, h_l_side],
						num_laying: num_layout[0] * num_layout[1]
					}
				]
				break
			case 11:
				//* Seal End
				var v_w_side = num_layout[0] * this.setCalculateWSide(11.0, 1, w, l, d, b, dust, ol, g, t)
				var v_l_side = num_layout[1] * this.setCalculateLSide(11.0, 1, w, l, d, b, dust, ol, g)
				var h_w_side = num_layout[0] * this.setCalculateLSide(11.0, 1, w, l, d, b, dust, ol, g)
				var h_l_side = num_layout[1] * this.setCalculateWSide(11.0, 1, w, l, d, b, dust, ol, g, t)

				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [num_layout[0], num_layout[1]],
						printing: [v_w_side, v_l_side],
						num_laying: num_layout[0] * num_layout[1]
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [num_layout[0], num_layout[1]],
						printing: [h_w_side, h_l_side],
						num_laying: num_layout[0] * num_layout[1]
					}
				]
				break
			case 12:
				//* Custom Template 
				var w_side = packaging_size.open_size[2] + 2 * b
				var l_side = packaging_size.open_size[3] + 2 * b
				var v_w_side = num_layout[0] * w_side
				var v_l_side = num_layout[1] * l_side

				var h_x = num_layout[0]
				var h_y = num_layout[1]

				var h_w = h_x * l_side
				var h_l = h_y * w_side
				var h_xy = h_x * h_y
				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [num_layout[0], num_layout[1]],
						printing: [v_w_side, v_l_side],
						num_laying: num_layout[0] * num_layout[1]
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [h_x, h_y],
						printing: [h_w, h_l],
						num_laying: h_xy,
					}
				]
				break

		}

		console.log("after laying", laying, roll_width, cut_off)
		laying = laying.map(obj => ({
			...obj,
			paper_size: [roll_width, cut_off],
			layout_size: this.setLayoutTolerance([obj], paper_tolerance, compType, paperSize)[0]
		}))

		return {
			laying,
			gripper,
			color_bar,
			paper_edge
		}
	}

	setComparewithCutSize(item, laying) {
		const { component_type: { type: compType } } = item
		const printType = this.getPrintType()
		var pass_laying = []
		var cut_size = []
		let usableMachine = est.getMachineList(item)
		let machineId = 0


		laying.forEach((layout) => {
			const { short_side, long_side, board_size } = getShortLongSide(item, layout)

			switch (printType) {
				case 'Jet Press':
					for (var index = 0; index <= 3; index++) {
						var w = db.db.jetpress_info[index].paper_size[0]
						var l = db.db.jetpress_info[index].paper_size[1]
						if (short_side <= w && long_side <= l) {
							pass_laying.push(layout)
							cut_size.push({
								cut_id: index,
								cut_size: 'cut ' + (index + 1)
							})
							break
						}
					}

					break;
				case 'Flexo':
				case 'Offset':
				default:

					for (let index = usableMachine.length - 1; index >= 0; index--) {
						const w_cut_size = usableMachine[index].w_range
						const l_cut_size = usableMachine[index].l_range
						machineId = usableMachine[index].machine_size.id

						if (compType == 3) {
							// * เฉพาะลูกฟูก  Flexo เทียบด้าน : ด้าน (ด้านซ้ายเป็นลอนเสมอ) 08.01.25
							// * condition ref code: FLEXO080125

							if (
								board_size[2] >= w_cut_size[2]
								&& board_size[2] <= w_cut_size[3]
								&& board_size[3] >= l_cut_size[2]
								&& board_size[3] <= l_cut_size[3]
							) {
								pass_laying.push({
									...layout,
									cut_size: {
										cut_id: machineId,
										cut_size: 'cut ' + machineId
									}
								})
								break
							}
						} else {

							if (
								short_side >= w_cut_size[2]
								&& short_side <= w_cut_size[3]
								&& long_side >= l_cut_size[2]
								&& long_side <= l_cut_size[3]
							) {
								pass_laying.push({
									...layout,
									cut_size: {
										cut_id: machineId,
										cut_size: 'cut ' + machineId
									}
								})
								break
							}
						}
					}

					break;
			}
		})


		return {
			laying: pass_laying,
			check: pass_laying.length != 0 ? true : false
		}

	}

	setCollectLaying(item, layout, is_useMachineSize, index) {
		// from switch lay is_useMachineSize = false
		// var selected_layout
		const laying = this.setCalculateCustomLayingSize(item, layout)
		// ! update 12.04.22
		item.layout.layout = laying

		var pass_laying = this.setComparewithCutSize(item, laying.laying)
		if (pass_laying.check) {
			item.layout.layout.laying = pass_laying.laying

			const { correctLaying, selected_layout } = this.checkSelectedLayout(index, pass_laying.laying)

			item.layout.layout.laying = correctLaying

			if (!selected_layout?.num_laying || selected_layout?.num_laying <= 0) {
				item.layout = {
					...item.layout,
					selected_layout: null
				}
				return false
			} else {
				item.layout = {
					...item.layout,
					selected_layout,
					paper_align: item.paper_info.paper_align
				}
				// if paper size or machine cut size has been change
				//* check this function 
				const checkMinMaxSizeMachine = this.setCalculateLaysize(index, is_useMachineSize)
				console.log("setParallelRollWidth 1")
				this.setParallelRollWidth(item)
				return checkMinMaxSizeMachine
			}
		} else {
			item.layout = {
				...item.layout,
				selected_layout: null
			}
			return false
		}
	}

	setCalculateCustomLayout(item, layout, is_useMachineSize, index) {
		const laying = this.setCalculateCustomLayingSize(item, layout)
		item.layout.layout = laying
		console.log("laying", laying)
		const { correctLaying, selected_layout } = this.checkSelectedLayout(index, laying.laying)
		console.log("selected_layout", selected_layout)
		item.layout = {
			...item.layout,
			layout: { ...item.layout.layout, laying: correctLaying },
			selected_layout,
			paper_align: item.paper_info.paper_align
		}

		let checkCorrugatedBoard = false

		if (item.component_type.type === 3) {
			checkCorrugatedBoard = checkUsedCorrugatedBoardSize(item, selected_layout, index, true)
		}

		if (selected_layout?.num_laying <= 0 || (item.component_type.type === 3 && !checkCorrugatedBoard)) {
			return false
		} else {
			const checkPaperMaxSizeMachine = this.setCalculateLaysize(index, is_useMachineSize)
			console.log("setParallelRollWidth 2")
			this.setParallelRollWidth(item)
			return checkPaperMaxSizeMachine
		}
	}

	setCalculateLayout(index) {
		/*
			1. calculate layout
			2. check layout can drop open size
			3. set component.layout = {laying,gripper,...}
			4. find best layout and set selected_layout
			5. set paper_info by selected_layout
			6. return bool found 4. ? true , false
		*/
		var item = this.mainData.component1[index]

		// calc. layout 
		var laying = this.setCalculateLayoutSize(index)
		console.log("laying", laying)

		// just check layout and return old or new layout
		// find best laying and min area used and use that layout
		const { correctLaying, selected_layout } = this.checkSelectedLayout(index, laying.laying)
		/*
			if compType = 3 
			1. calc. corrugated board size 
			2. compare with machine size
			3. laying - 1
			4. calc. layout with num_laying [w,l]
		*/

		item.layout = {
			...item.layout,
			layout: { ...laying, laying: correctLaying }, // {laying,gripper,...}
			selected_layout,
			paper_align: item.paper_info.paper_align
		}

		console.log("in setCalculateLayout fn.", laying, correctLaying, selected_layout)

		let checkCorrugatedBoard = false

		if (item.component_type.type === 3) {
			checkCorrugatedBoard = checkUsedCorrugatedBoardSize(item, selected_layout, index)
		}

		console.log("checkCorrugatedBoard", checkCorrugatedBoard, selected_layout, item, index)

		if (item?.layout?.selected_layout?.num_laying <= 0 || (item.component_type.type === 3 && !checkCorrugatedBoard)) {
			// can't set layout cuz open size too big
			return false
		} else {

			this.setCalculateLaysize(index, true)
			console.log("setParallelRollWidth 3")
			this.setParallelRollWidth(item)

			return true
		}
	}

	checkMaximunNumLayout(laying) {
		//* find maximun number of layout
		var num = 0
		laying.filter(lay => lay.pass_laying).forEach((item1) => {
			if (num < item1.num_laying) {
				num = item1.num_laying
			}
		})
		return num
	}

	checkMinAreaUsageLayout(laying, num) {
		// num = จำนวนชิ้นงานที่มากที่สุด
		//* if remaining layout more than 1 => choose minimum area
		var area_compare = Infinity
		var selected_layout = null
		if (laying != null) {
			const passLaying = laying.filter(lay => lay.pass_laying && lay.num_laying === num)
			if (passLaying.length > 0) {
				//* CASE TRUE LAYING
				passLaying.forEach((item1) => {
					// find what layout that match to max num
					if (item1.num_laying == num) {
						if (item1.layout_size[0] * item1.layout_size[1] < area_compare) {
							area_compare = item1.layout_size[0] * item1.layout_size[1]
							selected_layout = item1
						}
					}
				})
			} else {
				//* THIS CASE FOR ALERT LAY : selected_layout = min area
				laying.forEach((item1) => {
					// find what layout that match to max num
					// if(item1.num_laying == num){
					if (item1.layout_size[0] * item1.layout_size[1] < area_compare) {
						area_compare = item1.layout_size[0] * item1.layout_size[1]
						selected_layout = item1
					}
					// }
				})
			}
		}
		return selected_layout
	}

	checkCompareMachineSizeLaying(laying, item) {
		const { machine: { w_range, l_range }, component_type: { type: compType } } = item
		let correct_laying = []
		correct_laying = laying.map((layout) => {
			const { short_side, long_side, board_size } = getShortLongSide(item, layout)

			if (compType == 3) {

				// * เฉพาะลูกฟูก  Flexo เทียบด้าน : ด้าน (ด้านซ้ายเป็นลอนเสมอ) 08.01.25
				// * condition ref code: FLEXO080125

				const is_less = board_size[2] < w_range[2] || board_size[3] < l_range[2] ? true : false
				const is_more = board_size[2] > w_range[3] || board_size[3] > l_range[3] ? true : false

				if (
					board_size[2] >= w_range[2]
					&& board_size[2] <= w_range[3]
					&& board_size[3] >= l_range[2]
					&& board_size[3] <= l_range[3]
				) {
					return {
						...layout,
						pass_laying: true,
						is_less,
						is_more
					}
				} else {
					return {
						...layout,
						pass_laying: false,
						is_less,
						is_more
					}
				}
			} else {
				const is_less = short_side < w_range[2] || long_side < l_range[2] ? true : false
				const is_more = short_side > w_range[3] || long_side > l_range[3] ? true : false

				if (
					short_side >= w_range[2]
					&& short_side <= w_range[3]
					&& long_side >= l_range[2]
					&& long_side <= l_range[3]
				) {
					return {
						...layout,
						pass_laying: true,
						is_less,
						is_more
					}
				} else {
					return {
						...layout,
						pass_laying: false,
						is_less,
						is_more
					}
				}
			}
		})
		return correct_laying
	}

	setParallelRollWidth(item) {
		const {
			layout: { selected_layout: { paper_size, laying, layout_size }, laySize },
			paper_info: { paper_grain },
			component_type: { type: compType },
		} = item
		item.paper_info.is_switchDisplay = this.setSwitchDisplay(item)
		console.log("set parallel", paper_grain, paper_size, laying, layout_size)
		/*
			1. parallel_roll_width หน้าม้วนขนาน
			1. grain vertical = แนวตั้ง , horizontal = แนวนอน
			2. ถ้าเป็นแนวตั้ง cut_off(แนวตัด) = width , roll_width(หน้าม้วน) = length
			3. paper_grain = grain_box_type
		*/
		let paperSize = []
		switch (compType) {
			case 1:
			case 2:
				paperSize = [paper_size[0], paper_size[1]]
				break;
			case 3:
			default:
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

				if (is_price_per_sheet) {
					size = [corrugated_size[2], corrugated_size[3]]
				}

				paperSize = calculateCorrugatedBoardSize(size, laying, flute_side, is_price_per_sheet)

				console.log("setParallelRollWidth", paperSize, size, laying, flute_side, is_price_per_sheet)
				item.paperSize = paperSize
				break;
		}

		if (paper_grain == 'vertical') {
			item.paper_info.parallel_roll_width = 'LSize'
			// item.paper_info.cut_off = item.paperSize[2]
			// item.paper_info.roll_width = item.paperSize[3]
			item.paper_info.paper_grain = 'vertical'
			item.paper_info.roll_width = paperSize[1]
			item.paper_info.cut_off = paperSize[0]
			console.log("setParallelRollWidth vertical", paperSize[1], paperSize[0])

		} else if (paper_grain == 'horizontal') {
			item.paper_info.parallel_roll_width = 'WSize'
			// item.paper_info.cut_off = item.paperSize[3]
			// item.paper_info.roll_width = item.paperSize[2]
			item.paper_info.roll_width = paperSize[0]
			item.paper_info.cut_off = paperSize[1]
			item.paper_info.paper_grain = 'horizontal'
			console.log("setParallelRollWidth horizontal", paperSize[0], paperSize[1])
		}
		console.log("item after set parallel", item.paper_info, item.paperSize, item.paper_info.roll_width, item.paper_info.cut_off)
	}

	setSwitchDisplay(item) {
		// old : paper_size
		// new : layout_size
		var laySize = item.layout.selected_layout.layout_size
		// if(laySize[0] <= laySize[1]){
		var is_switchDisplay = 0
		// }else{ 
		// 	var is_switchDisplay = 1
		// }
		return is_switchDisplay
	}

	setCalculateLayoutSize(index) {
		var item = this.mainData.component1[index]
		//* paperSize from setPaperSize()
		const {
			packaging_size,
			paperSize: paperSize1,
			paper_tolerance,
			box_type,
			component_type: { type: compType }
		} = item

		const { roll_width, cut_off } = item.paper_info

		const { paper_edge, gripper, color_bar, bleed: b } = paper_tolerance

		const {
			length: l
			, width: w
			, depth: d
			, glue_flap: g
			, tuck_flap: t
			, dust_flap: dust
			, ol
		} = packaging_size

		const tolerance = this.getLayoutPaperTolarance(compType, paper_tolerance)
		const {
			shortSide: shortSideComponent = 0,
			longSide: longSideComponent = 0,
		} = tolerance || {}

		// let paperSize = paperSize1
		let paperSize = this.getLayoutPaperSize(paperSize1, tolerance)

		console.log("setCalculateLayoutSize", paperSize1, paperSize, tolerance)

		switch (box_type.type_id) {
			case 1:
				//* Reverse Tuck End : RTE
				//* calc the best amount of vertical layout
				if (dust <= ((w + t) / 2)) {
					var aa = 1.1
				} else {
					var aa = 1.2
				}

				var v_check = 0
				var v_x = 1
				var v_l_side = this.setCalculateLSide(1.0, 1, w, l, d, b, dust, ol, g)
				var v_y = Math.floor((paperSize[1] / v_l_side))
				var v_w_side = this.setCalculateWSide(aa, v_x, w, l, d, b, dust, ol, g, t)

				while (v_w_side <= paperSize[0] && v_check == 0) {
					v_x += 1
					v_w_side = this.setCalculateWSide(aa, v_x, w, l, d, b, dust, ol, g, t)
					if (v_w_side > paperSize[0]) {
						v_check = 1
						v_x = v_x - 1
						v_w_side = this.setCalculateWSide(aa, v_x, w, l, d, b, dust, ol, g, t)
					}
				}

				if ((v_l_side * v_y) > paperSize[1]) {
					v_y = v_y - 1
				}

				var v_w = v_w_side
				var v_l = v_l_side * v_y
				var v_xy = v_x * v_y

				//*calc the best amount of horizontal layout
				var h_check = 0
				var h_y = 1
				var h_l_side = this.setCalculateLSide(1.0, 1, w, l, d, b, dust, ol, g)
				var h_x = Math.floor((paperSize[0] / h_l_side))
				var h_w_side = this.setCalculateWSide(aa, h_y, w, l, d, b, dust, ol, g, t)

				while (h_w_side <= paperSize[1] && h_check == 0) {
					h_y += 1
					h_w_side = this.setCalculateWSide(aa, h_y, w, l, d, b, dust, ol, g, t)

					if (h_w_side > paperSize[1]) {
						h_check = 1
						h_y = h_y - 1
						h_w_side = this.setCalculateWSide(aa, h_y, w, l, d, b, dust, ol, g, t)
					}
				}
				if ((h_l_side * h_x) > paperSize[0]) {
					h_x = h_x - 1
				}

				var h_w = h_l_side * h_x
				var h_l = h_w_side
				var h_xy = h_x * h_y
				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [v_x, v_y],
						printing: [v_w, v_l],
						num_laying: v_xy
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [h_x, h_y],
						printing: [h_w, h_l],
						num_laying: h_xy
					}
				]
				break
			case 2:
				//*Straight Tuck End:STE
				//*OPTION 1 :Straight
				//*calc the best amount of vertical layout
				var aa1 = 2.1
				var v1_check = 0
				var v1_x = 1
				var v1_l_side = this.setCalculateLSide(2.0, 1, w, l, d, b, dust, ol, g)
				var v1_y = Math.floor((paperSize[1] / v1_l_side))
				var v1_w_side = this.setCalculateWSide(aa1, v1_x, w, l, d, b, dust, ol, g, t)
				while (v1_w_side <= paperSize[0] && v1_check == 0) {
					v1_x += 1
					v1_w_side = this.setCalculateWSide(aa1, v1_x, w, l, d, b, dust, ol, g, t)
					if (v1_w_side > paperSize[0]) {
						v1_check = 1
						v1_x = v1_x - 1
						v1_w_side = this.setCalculateWSide(aa1, v1_x, w, l, d, b, dust, ol, g, t)
					}
				}
				if ((v1_l_side * v1_y) > paperSize[1]) {
					v1_y = v1_y - 1
				}
				var v1_w = v1_w_side
				var v1_l = v1_l_side * v1_y
				var v1_xy = v1_x * v1_y

				//* calc the best amount of horizontal layout
				var h1_check = 0
				var h1_y = 1
				var h1_l_side = this.setCalculateLSide(2.0, 1, w, l, d, b, dust, ol, g)
				var h1_x = Math.floor((paperSize[0] / h1_l_side))
				var h1_w_side = this.setCalculateWSide(aa1, h1_y, w, l, d, b, dust, ol, g, t)

				while (h1_w_side <= paperSize[1] && h1_check == 0) {
					h1_y += 1
					h1_w_side = this.setCalculateWSide(aa1, h1_y, w, l, d, b, dust, ol, g, t)
					if (h1_w_side > paperSize[1]) {
						h1_check = 1
						h1_y = h1_y - 1
						h1_w_side = this.setCalculateWSide(aa1, h1_y, w, l, d, b, dust, ol, g, t)
					}
				}
				if ((h1_l_side * h1_x) > paperSize[0]) {
					h1_x = h1_x - 1
				}

				var h1_w = h1_l_side * h1_x
				var h1_l = h1_w_side
				var h1_xy = h1_x * h1_y
				//*OPTION2 : Overlap(Lay เหลื่อม)
				//* calc the best amount of vertical layout
				if (dust <= (w + t) / 2) {
					var aa2 = 2.2
				} else {
					var aa2 = 2.3
				}
				var v2_check_w = 0
				var v2_check_l = 0
				var v2_x = 1
				var v2_y = 1
				var v2_w_side = this.setCalculateWSide(aa2, v2_x, w, l, d, b, dust, ol, g, t)
				var v2_l_side = this.setCalculateLSide(aa2, v2_y, w, l, d, b, dust, ol, g)
				while (v2_w_side <= paperSize[0] && v2_check_w == 0) {
					v2_x += 1
					v2_w_side = this.setCalculateWSide(aa2, v2_x, w, l, d, b, dust, ol, g, t)
					if (v2_w_side > paperSize[0]) {
						v2_check_w = 1
						v2_x = v2_x - 1
						v2_w_side = this.setCalculateWSide(aa2, v2_x, w, l, d, b, dust, ol, g, t)
					}
				}
				while (v2_l_side <= paperSize[1] && v2_check_l == 0) {
					v2_y += 1
					v2_l_side = this.setCalculateLSide(aa2, v2_y, w, l, d, b, dust, ol, g)
					if (v2_l_side > paperSize[1]) {
						v2_check_l = 1
						v2_y = v2_y - 1
						v2_l_side = this.setCalculateLSide(aa2, v2_y, w, l, d, b, dust, ol, g)
					}
				}

				if (v2_x == 1) {
					v2_l_side = this.setCalculateLSide(2.0, 1, w, l, d, b, dust, ol, g)
					v2_y = Math.floor((paperSize[1] / v2_l_side))
					if (v2_y * v2_l_side > paperSize[1]) {
						v2_y = v2_y - 1
					}
					var v2_l = v2_y * v2_l_side
				} else { var v2_l = v2_l_side }
				var v2_w = v2_w_side
				var v2_xy = v2_x * v2_y

				//*calc the best amount of horizontal layout
				var h2_check_w = 0
				var h2_check_l = 0
				var h2_x = 1
				var h2_y = 1
				var h2_w_side = this.setCalculateWSide(aa2, h2_y, w, l, d, b, dust, ol, g, t)
				var h2_l_side = this.setCalculateLSide(aa2, h2_x, w, l, d, b, dust, ol, g)
				while (h2_l_side <= paperSize[0] && h2_check_w == 0) {
					h2_x += 1
					h2_l_side = this.setCalculateLSide(aa2, h2_x, w, l, d, b, dust, ol, g)
					if (h2_l_side > paperSize[0]) {
						h2_check_w = 1
						h2_x = h2_x - 1
						h2_l_side = this.setCalculateLSide(aa2, h2_x, w, l, d, b, dust, ol, g)
					}
				}
				while (h2_w_side <= paperSize[1] && h2_check_l == 0) {
					h2_y += 1
					h2_w_side = this.setCalculateWSide(aa2, h2_y, w, l, d, b, dust, ol, g, t)
					if (h2_w_side > paperSize[1]) {
						h2_check_l = 1
						h2_y = h2_y - 1
						h2_w_side = this.setCalculateWSide(aa2, h2_y, w, l, d, b, dust, ol, g, t)
					}
				}

				if (h2_y == 1) {
					h2_l_side = this.setCalculateLSide(2.0, 1, w, l, d, b, dust, ol, g)
					h2_x = Math.floor((paperSize[0] / h2_l_side))
					if (h2_x * h2_l_side > paperSize[0]) {
						h2_x = h2_x - 1
					}
					var h2_w = h2_x * h2_l_side
				} else {
					var h2_w = h2_l_side
				}

				var h2_l = h2_w_side
				var h2_xy = h2_x * h2_y

				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [v1_x, v1_y],
						printing: [v1_w, v1_l],
						num_laying: v1_xy
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [h1_x, h1_y],
						printing: [h1_w, h1_l],
						num_laying: h1_xy
					},
					{
						laying_type: 'overlap',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [v2_x, v2_y],
						printing: [v2_w, v2_l],
						num_laying: v2_xy
					},
					{
						laying_type: 'overlap',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [h2_x, h2_y],
						printing: [h2_w, h2_l],
						num_laying: h2_xy
					},
				]
				break
			case 3:
				//* Tuck Top Snap Lock Bottom:TTSLB
				//* OPTION1: Straight(Lay แบบตรงกัน)
				//* calc the best amount of vertical layout
				var aa1 = 3.1
				var v1_check = 0
				var v1_x = 1
				var v1_l_side = this.setCalculateLSide(3.0, 1, w, l, d, b, dust, ol, g)
				var v1_y = Math.floor((paperSize[1] / v1_l_side))
				var v1_w_side = this.setCalculateWSide(aa1, v1_x, w, l, d, b, dust, ol, g, t)
				while (v1_w_side <= paperSize[0] && v1_check == 0) {
					v1_x += 1
					v1_w_side = this.setCalculateWSide(aa1, v1_x, w, l, d, b, dust, ol, g, t)
					if (v1_w_side > paperSize[0]) {
						v1_check = 1
						v1_x = v1_x - 1
						v1_w_side = this.setCalculateWSide(aa1, v1_x, w, l, d, b, dust, ol, g, t)
					}
				}
				if ((v1_l_side * v1_y) > paperSize[1]) {
					v1_y = v1_y - 1
				}
				var v1_w = v1_w_side
				var v1_l = v1_l_side * v1_y
				var v1_xy = v1_x * v1_y

				//*calc the best amount of horizontal layout
				var h1_check = 0
				var h1_y = 1
				var h1_l_side = this.setCalculateLSide(3.0, 1, w, l, d, b, dust, ol, g)
				var h1_x = Math.floor((paperSize[0] / h1_l_side))
				var h1_w_side = this.setCalculateWSide(aa1, h1_y, w, l, d, b, dust, ol, g, t)
				while (h1_w_side <= paperSize[1] && h1_check == 0) {
					h1_y += 1
					h1_w_side = this.setCalculateWSide(aa1, h1_y, w, l, d, b, dust, ol, g, t)
					if (h1_w_side > paperSize[1]) {
						h1_check = 1
						h1_y = h1_y - 1
						h1_w_side = this.setCalculateWSide(aa1, h1_y, w, l, d, b, dust, ol, g, t)
					}
				}
				if ((h1_l_side * h1_x) > paperSize[0]) {
					h1_x = h1_x - 1
				}
				var h1_w = h1_l_side * h1_x
				var h1_l = h1_w_side
				var h1_xy = h1_x * h1_y

				//*OPTION2: Overlap(Lay แบบเหลื่อมกัน)					
				//*calc the best amount of vertical layout
				if (dust <= ((w + t) / 2)) {
					var aa2 = 3.2
				} else {
					var aa2 = 3.3
				}

				var v2_check_w = 0
				var v2_check_l = 0
				var v2_x = 1
				var v2_y = 1
				var v2_w_side = this.setCalculateWSide(aa2, v2_x, w, l, d, b, dust, ol, g, t)
				var v2_l_side = this.setCalculateLSide(aa2, v2_y, w, l, d, b, dust, ol, g)

				while (v2_w_side <= paperSize[0] && v2_check_w == 0) {
					v2_x += 1
					v2_w_side = this.setCalculateWSide(aa2, v2_x, w, l, d, b, dust, ol, g, t)
					if (v2_w_side > paperSize[0]) {
						v2_check_w = 1
						v2_x = v2_x - 1
						v2_w_side = this.setCalculateWSide(aa2, v2_x, w, l, d, b, dust, ol, g, t)
					}
				}

				while (v2_l_side <= paperSize[1] && v2_check_l == 0) {
					v2_y += 1
					v2_l_side = this.setCalculateLSide(aa2, v2_y, w, l, d, b, dust, ol, g)
					if (v2_l_side > paperSize[1]) {
						v2_check_l = 1
						v2_y = v2_y - 1
						v2_l_side = this.setCalculateLSide(aa2, v2_y, w, l, d, b, dust, ol, g)
					}
				}

				if (v2_x == 1) {
					v2_l_side = this.setCalculateLSide(3.0, 1, w, l, d, b, dust, ol, g)
					v2_y = Math.floor((paperSize[1] / v2_l_side))
					if (v2_y * v2_l_side > paperSize[1]) {
						v2_y = v2_y - 1
					}
					var v2_l = v2_y * v2_l_side
				} else {
					var v2_l = v2_l_side
				}

				var v2_w = v2_w_side
				var v2_xy = v2_x * v2_y

				//*calc the best amount of horizontal layout
				var h2_check_w = 0
				var h2_check_l = 0
				var h2_x = 1
				var h2_y = 1
				var h2_w_side = this.setCalculateWSide(aa2, h2_y, w, l, d, b, dust, ol, g, t)
				var h2_l_side = this.setCalculateLSide(aa2, h2_x, w, l, d, b, dust, ol, g)
				while (h2_l_side <= paperSize[0] && h2_check_w == 0) {
					h2_x += 1
					h2_l_side = this.setCalculateLSide(aa2, h2_x, w, l, d, b, dust, ol, g)
					if (h2_l_side > paperSize[0]) {
						h2_check_w = 1
						h2_x = h2_x - 1
						h2_l_side = this.setCalculateLSide(aa2, h2_x, w, l, d, b, dust, ol, g)
					}
				}
				while (h2_w_side <= paperSize[1] && h2_check_l == 0) {
					h2_y += 1
					h2_w_side = this.setCalculateWSide(aa2, h2_y, w, l, d, b, dust, ol, g, t)
					if (h2_w_side > paperSize[1]) {
						h2_check_l = 1
						h2_y = h2_y - 1
						h2_w_side = this.setCalculateWSide(aa2, h2_y, w, l, d, b, dust, ol, g, t)
					}
				}

				if (h2_y == 1) {
					h2_l_side = this.setCalculateLSide(3.0, 1, w, l, d, b, dust, ol, g)
					h2_x = Math.floor((paperSize[0] / h2_l_side))
					if (h2_x * h2_l_side > paperSize[0]) {
						h2_x = h2_x - 1
					}
					var h2_w = h2_x * h2_l_side
				} else {
					var h2_w = h2_l_side
				}

				var h2_l = h2_w_side
				var h2_xy = h2_x * h2_y


				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [v1_x, v1_y],
						printing: [v1_w, v1_l],
						num_laying: v1_xy
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [h1_x, h1_y],
						printing: [h1_w, h1_l],
						num_laying: h1_xy
					},
					{
						laying_type: 'overlap',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [v2_x, v2_y],
						printing: [v2_w, v2_l],
						num_laying: v2_xy
					},
					{
						laying_type: 'overlap',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [h2_x, h2_y],
						printing: [h2_w, h2_l],
						num_laying: h2_xy
					},
				]
				break
			case 4:
				//*Tuck Top Auto Bottom:TTAB

				//* OPTION1: Straight(Lay แบบตรงกัน)
				//* calc the best amount of vertical layout
				var aa1 = 4.1
				var v1_check = 0
				var v1_x = 1
				var v1_l_side = this.setCalculateLSide(4.0, 1, w, l, d, b, dust, ol, g)
				var v1_y = Math.floor((paperSize[1] / v1_l_side))
				var v1_w_side = this.setCalculateWSide(aa1, v1_x, w, l, d, b, dust, ol, g, t)
				while (v1_w_side <= paperSize[0] && v1_check == 0) {
					v1_x += 1
					v1_w_side = this.setCalculateWSide(aa1, v1_x, w, l, d, b, dust, ol, g, t)
					if (v1_w_side > paperSize[0]) {
						v1_check = 1
						v1_x = v1_x - 1
						v1_w_side = this.setCalculateWSide(aa1, v1_x, w, l, d, b, dust, ol, g, t)
					}
				}
				if ((v1_l_side * v1_y) > paperSize[1]) {
					v1_y = v1_y - 1
				}
				var v1_w = v1_w_side
				var v1_l = v1_l_side * v1_y
				var v1_xy = v1_x * v1_y

				//*calc the best amount of horizontal layout
				var h1_check = 0
				var h1_y = 1
				var h1_l_side = this.setCalculateLSide(4.0, 1, w, l, d, b, dust, ol, g)
				var h1_x = Math.floor((paperSize[0] / h1_l_side))
				var h1_w_side = this.setCalculateWSide(aa1, h1_y, w, l, d, b, dust, ol, g, t)
				while (h1_w_side <= paperSize[1] && h1_check == 0) {
					h1_y += 1
					h1_w_side = this.setCalculateWSide(aa1, h1_y, w, l, d, b, dust, ol, g, t)
					if (h1_w_side > paperSize[1]) {
						h1_check = 1
						h1_y = h1_y - 1
						h1_w_side = this.setCalculateWSide(aa1, h1_y, w, l, d, b, dust, ol, g, t)
					}
				}
				if ((h1_l_side * h1_x) > paperSize[0]) {
					h1_x = h1_x - 1
				}
				var h1_w = h1_l_side * h1_x
				var h1_l = h1_w_side
				var h1_xy = h1_x * h1_y
				//*OPTION2: Overlap(Lay แบบเหลื่อมกัน)
				//*calc the best amount of vertical layout
				if (dust <= ((w + t) / 2)) {
					var aa2 = 4.2
				} else {
					var aa2 = 4.3
				}
				var v2_check_w = 0
				var v2_check_l = 0
				var v2_x = 1
				var v2_y = 1
				var v2_w_side = this.setCalculateWSide(aa2, v2_x, w, l, d, b, dust, ol, g, t)
				var v2_l_side = this.setCalculateLSide(aa2, v2_y, w, l, d, b, dust, ol, g)
				while (v2_w_side <= paperSize[0] && v2_check_w == 0) {
					v2_x += 1
					v2_w_side = this.setCalculateWSide(aa2, v2_x, w, l, d, b, dust, ol, g, t)
					if (v2_w_side > paperSize[0]) {
						v2_check_w = 1
						v2_x = v2_x - 1
						v2_w_side = this.setCalculateWSide(aa2, v2_x, w, l, d, b, dust, ol, g, t)
					}
				}
				while (v2_l_side <= paperSize[1] && v2_check_l == 0) {
					v2_y += 1
					v2_l_side = this.setCalculateLSide(aa2, v2_y, w, l, d, b, dust, ol, g)
					if (v2_l_side > paperSize[1]) {
						v2_check_l = 1
						v2_y = v2_y - 1
						v2_l_side = this.setCalculateLSide(aa2, v2_y, w, l, d, b, dust, ol, g)
					}
				}

				if (v2_x == 1) {
					v2_l_side = this.setCalculateLSide(4.0, 1, w, l, d, b, dust, ol, g)
					v2_y = Math.floor((paperSize[1] / v2_l_side))
					if (v2_y * v2_l_side > paperSize[1]) {
						v2_y = v2_y - 1
					}
					var v2_l = v2_y * v2_l_side
				} else {
					var v2_l = v2_l_side
				}

				var v2_w = v2_w_side
				var v2_xy = v2_x * v2_y

				//*calc the best amount of horizontal layout
				var h2_check_w = 0
				var h2_check_l = 0
				var h2_x = 1
				var h2_y = 1
				var h2_w_side = this.setCalculateWSide(aa2, h2_y, w, l, d, b, dust, ol, g, t)
				var h2_l_side = this.setCalculateLSide(aa2, h2_x, w, l, d, b, dust, ol, g)

				while ((h2_l_side) <= paperSize[0] && h2_check_w == 0) {
					h2_x += 1
					h2_l_side = this.setCalculateLSide(aa2, h2_x, w, l, d, b, dust, ol, g)
					if ((h2_l_side) > paperSize[0]) {
						h2_check_w = 1
						h2_x = h2_x - 1
						h2_l_side = this.setCalculateLSide(aa2, h2_x, w, l, d, b, dust, ol, g)
					}
				}
				while ((h2_w_side) <= paperSize[1] && h2_check_l == 0) {
					h2_y += 1
					h2_w_side = this.setCalculateWSide(aa2, h2_y, w, l, d, b, dust, ol, g, t)
					if ((h2_w_side) > paperSize[1]) {
						h2_check_l = 1
						h2_y = h2_y - 1
						h2_w_side = this.setCalculateWSide(aa2, h2_y, w, l, d, b, dust, ol, g, t)
					}
				}

				if (h2_y == 1) {
					h2_l_side = this.setCalculateLSide(4.0, 1, w, l, d, b, dust, ol, g)
					h2_x = Math.floor((paperSize[0] / h2_l_side))
					if (h2_x * h2_l_side > paperSize[0]) {
						h2_x = h2_x - 1
					}
					var h2_w = h2_x * h2_l_side
				} else {
					var h2_w = h2_l_side
				}

				var h2_l = h2_w_side
				var h2_xy = h2_x * h2_y

				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [v1_x, v1_y],
						printing: [v1_w, v1_l],
						num_laying: v1_xy
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [h1_x, h1_y],
						printing: [h1_w, h1_l],
						num_laying: h1_xy
					},
					{
						laying_type: 'overlap',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [v2_x, v2_y],
						printing: [v2_w, v2_l],
						num_laying: v2_xy
					},
					{
						laying_type: 'overlap',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [h2_x, h2_y],
						printing: [h2_w, h2_l],
						num_laying: h2_xy
					},
				]
				break

			case 5:
				//*(Double Glue Side Wall (Simplex Tray)
				//*calc the best amount of vertical layout
				var w_side = this.setCalculateWSide(5.0, 1, w, l, d, b, dust, ol, g, t)
				var l_side = this.setCalculateLSide(5.0, 1, w, l, d, b, dust, ol, g)

				var v_x = Math.floor(paperSize[0] / w_side)
				var v_y = Math.floor(paperSize[1] / l_side)
				if ((v_x * w_side) > paperSize[0]) {
					v_x = v_x - 1
				}
				if ((v_y * l_side) > paperSize[1]) {
					v_y = v_y - 1
				}
				var v_w = v_x * w_side
				var v_l = v_y * l_side
				var v_xy = v_x * v_y

				//*calc the best amount of horizontal layout
				var h_x = Math.floor(paperSize[0] / l_side)
				var h_y = Math.floor(paperSize[1] / w_side)
				if ((h_x * l_side) > paperSize[0]) {
					h_x = h_x - 1
				}
				if ((h_y * w_side) > paperSize[1]) {
					h_y = h_y - 1
				}
				var h_w = h_x * l_side
				var h_l = h_y * w_side
				var h_xy = h_x * h_y

				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [v_x, v_y],
						printing: [v_w, v_l],
						num_laying: v_xy
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [h_x, h_y],
						printing: [h_w, h_l],
						num_laying: h_xy
					}
				]
				break
			case 6:
				//*Frame-Vue Tray
				//*calc the best amount of vertical layout
				var w_side = this.setCalculateWSide(6.0, 1, w, l, d, b, dust, ol, g, t)
				var l_side = this.setCalculateLSide(6.0, 1, w, l, d, b, dust, ol, g)
				var v_x = Math.floor(paperSize[0] / w_side)
				var v_y = Math.floor(paperSize[1] / l_side)
				if ((v_x * w_side) > paperSize[0]) {
					v_x = v_x - 1
				}
				if ((v_y * l_side) > paperSize[1]) {
					v_y = v_y - 1
				}
				var v_w = v_x * w_side
				var v_l = v_y * l_side
				var v_xy = v_x * v_y

				//*calc the best amount of vertical layout
				var h_x = Math.floor(paperSize[0] / l_side)
				var h_y = Math.floor(paperSize[1] / w_side)
				if ((h_x * l_side) > paperSize[0]) {
					h_x = h_x - 1
				}
				if ((h_y * w_side) > paperSize[1]) {
					h_y = h_y - 1
				}
				var h_w = h_x * l_side
				var h_l = h_y * w_side
				var h_xy = h_x * h_y

				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [v_x, v_y],
						printing: [v_w, v_l],
						num_laying: v_xy
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [h_x, h_y],
						printing: [h_w, h_l],
						num_laying: h_xy
					}
				]
				break
			case 7:
				//*Four Corner Beers Tray with Lid

				//*calc the best amount of vertical layout
				if (g <= (l + dust) / 2) {
					var aa = 7.1
				} else {
					var aa = 7.2
				}

				var v_check = 0
				var v_x = 1
				var v_l_side = this.setCalculateLSide(7.0, 1, w, l, d, b, dust, ol, g) //becuase tuck flap is always shorter than depth side
				var v_y = Math.floor(paperSize[1] / v_l_side)
				var v_w_side = this.setCalculateWSide(aa, v_x, w, l, d, b, dust, ol, g, t)

				while ((v_w_side) <= paperSize[0] && v_check == 0) {
					v_x += 1
					v_w_side = this.setCalculateWSide(aa, v_x, w, l, d, b, dust, ol, g, t)
					if ((v_w_side) > paperSize[0]) {
						v_check = 1
						v_x = v_x - 1
						v_w_side = this.setCalculateWSide(aa, v_x, w, l, d, b, dust, ol, g, t)
					}
				}
				if ((v_l_side * v_y) > paperSize[1]) {
					v_y = v_y - 1
				}
				var v_w = v_w_side
				var v_l = v_l_side * v_y
				var v_xy = v_x * v_y

				//*calc the best amount of horizontal layout
				var h_check = 0
				var h_y = 1
				var h_l_side = this.setCalculateLSide(7.0, 1, w, l, d, b, dust, ol, g)
				var h_x = Math.floor((paperSize[0] / h_l_side))
				var h_w_side = this.setCalculateWSide(aa, h_y, w, l, d, b, dust, ol, g, t)

				while ((h_w_side) <= paperSize[1] && h_check == 0) {
					h_y += 1
					h_w_side = this.setCalculateWSide(aa, h_y, w, l, d, b, dust, ol, g, t)
					if ((h_w_side) > paperSize[1]) {
						h_check = 1
						h_y = h_y - 1
						h_w_side = this.setCalculateWSide(aa, h_y, w, l, d, b, dust, ol, g, t)
					}
				}
				if ((h_l_side * h_x) > paperSize[0]) {
					h_x = h_x - 1
				}
				var h_w = h_l_side * h_x
				var h_l = h_w_side
				var h_xy = h_x * h_y
				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [v_x, v_y],
						printing: [v_w, v_l],
						num_laying: v_xy
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [h_x, h_y],
						printing: [h_w, h_l],
						num_laying: h_xy
					}
				]
				break
			case 8:
				//*Gable Top with Auto Bottom
				//*calc the best amount of vertical layout
				var aa = 8.1
				var v_check_w = 0
				var v_check_l = 0
				var v_x = 1
				var v_y = 1
				var v_w_side = this.setCalculateWSide(aa, v_x, w, l, d, b, dust, ol, g, t)
				var v_l_side = this.setCalculateLSide(aa, v_y, w, l, d, b, dust, ol, g)

				while ((v_w_side) <= paperSize[0] && v_check_w == 0) {
					v_x += 1
					v_w_side = this.setCalculateWSide(aa, v_x, w, l, d, b, dust, ol, g, t)
					if ((v_w_side) > paperSize[0]) {
						v_check_w = 1
						v_x = v_x - 1
						v_w_side = this.setCalculateWSide(aa, v_x, w, l, d, b, dust, ol, g, t)
					}
				}

				while ((v_l_side) <= paperSize[1] && v_check_l == 0) {
					v_y += 1
					v_l_side = this.setCalculateLSide(aa, v_y, w, l, d, b, dust, ol, g)
					if ((v_l_side) > paperSize[1]) {
						v_check_l = 1
						v_y = v_y - 1
						v_l_side = this.setCalculateLSide(aa, v_y, w, l, d, b, dust, ol, g)
					}
				}


				if (v_x == 1) {
					v_l_side = this.setCalculateLSide(8.0, 1, w, l, d, b, dust, ol, g)
					v_y = Math.floor((paperSize[1] / v_l_side))
					if (v_y * v_l_side > paperSize[1]) {
						v_y = v_y - 1
					}
					var v_l = v_y * v_l_side
				} else {
					var v_l = v_l_side
				}
				var v_w = v_w_side
				var v_xy = v_x * v_y

				//*calc the best amount of horizontal layout
				var h_check_w = 0
				var h_check_l = 0
				var h_x = 1
				var h_y = 1
				var h_w_side = this.setCalculateWSide(aa, h_y, w, l, d, b, dust, ol, g, t)
				var h_l_side = this.setCalculateLSide(aa, h_x, w, l, d, b, dust, ol, g)
				while ((h_l_side) <= paperSize[0] && h_check_w == 0) {
					h_x += 1
					h_l_side = this.setCalculateLSide(aa, h_x, w, l, d, b, dust, ol, g)
					if ((h_l_side) > paperSize[0]) {
						h_check_w = 1
						h_x = h_x - 1
						h_l_side = this.setCalculateLSide(aa, h_x, w, l, d, b, dust, ol, g)
					}
				}
				while ((h_w_side) <= paperSize[1] && h_check_l == 0) {
					h_y += 1
					h_w_side = this.setCalculateWSide(aa, h_y, w, l, d, b, dust, ol, g, t)
					if ((h_w_side) > paperSize[1]) {
						h_check_l = 1
						h_y = h_y - 1
						h_w_side = this.setCalculateWSide(aa, h_y, w, l, d, b, dust, ol, g, t)
					}
				}

				if (h_y == 1) {
					h_l_side = this.setCalculateLSide(8.0, 1, w, l, d, b, dust, ol, g)
					h_x = Math.floor((paperSize[0] / h_l_side))
					if (h_x * h_l_side > paperSize[0]) {
						h_x = h_x - 1
					}
					var h_w = h_x * h_l_side
				} else {
					var h_w = h_l_side
				}
				var h_l = h_w_side
				var h_xy = h_x * h_y
				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [v_x, v_y],
						printing: [v_w, v_l],
						num_laying: v_xy
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [h_x, h_y],
						printing: [h_w, h_l],
						num_laying: h_xy
					}
				]
				break
			case 9:
				//*Sleeve
				//*calc the best amount of vertical layout
				var w_side = this.setCalculateWSide(9.0, 1, w, l, d, b, dust, ol, g, t)
				var l_side = this.setCalculateLSide(9.0, 1, w, l, d, b, dust, ol, g)
				var v_x = Math.floor(paperSize[0] / w_side)
				var v_y = Math.floor(paperSize[1] / l_side)
				if ((v_x * w_side) > paperSize[0]) {
					v_x = v_x - 1
				}
				if ((v_y * l_side) > paperSize[1]) {
					v_y = v_y - 1
				}
				var v_w = v_x * w_side
				var v_l = v_y * l_side
				var v_xy = v_x * v_y

				//*calc the best amount of horizontal layout
				var h_x = Math.floor(paperSize[0] / l_side)
				var h_y = Math.floor(paperSize[1] / w_side)
				if ((h_x * l_side) > paperSize[0]) {
					h_x = h_x - 1
				}
				if ((h_y * w_side) > paperSize[1]) {
					h_y = h_y - 1
				}
				var h_w = h_x * l_side
				var h_l = h_y * w_side
				var h_xy = h_x * h_y
				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [v_x, v_y],
						printing: [v_w, v_l],
						num_laying: v_xy
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [h_x, h_y],
						printing: [h_w, h_l],
						num_laying: h_xy
					}
				]
				break
			case 10:
				//*Pillow Box
				//*calc the best amount of vertical layout
				var w_side = this.setCalculateWSide(10.0, 1, w, l, d, b, dust, ol, g, t)
				var l_side = this.setCalculateLSide(10.0, 1, w, l, d, b, dust, ol, g)
				var v_x = Math.floor(paperSize[0] / w_side)
				var v_y = Math.floor(paperSize[1] / l_side)
				if ((v_x * w_side) > paperSize[0]) {
					v_x = v_x - 1
				}
				if ((v_y * l_side) > paperSize[1]) {
					v_y = v_y - 1
				}
				var v_w = v_x * w_side
				var v_l = v_y * l_side
				var v_xy = v_x * v_y

				//*calc the best amount of horizontal layout
				var h_x = Math.floor(paperSize[0] / l_side)
				var h_y = Math.floor(paperSize[1] / w_side)
				if ((h_x * l_side) > paperSize[0]) {
					h_x = h_x - 1
				}
				if ((h_y * w_side) > paperSize[1]) {
					h_y = h_y - 1
				}
				var h_w = h_x * l_side
				var h_l = h_y * w_side
				var h_xy = h_x * h_y

				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'vertical',
						layout: [v_x, v_y],
						printing: [v_w, v_l],
						num_laying: v_xy
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'horizontal',
						layout: [h_x, h_y],
						printing: [h_w, h_l],
						num_laying: h_xy
					}
				]
				break
			case 11:
				//*Seal End
				//*calc the best amount of vertical layout
				var w_side = this.setCalculateWSide(11.0, 1, w, l, d, b, dust, ol, g, t)
				var l_side = this.setCalculateLSide(11.0, 1, w, l, d, b, dust, ol, g)
				var v_x = Math.floor(paperSize[0] / w_side)
				var v_y = Math.floor(paperSize[1] / l_side)
				if ((v_x * w_side) > paperSize[0]) {
					v_x = v_x - 1
				}
				if ((v_y * l_side) > paperSize[1]) {
					v_y = v_y - 1
				}
				var v_w = v_x * w_side
				var v_l = v_y * l_side
				var v_xy = v_x * v_y

				//*calc the best amount of horizontal layout
				var h_x = Math.floor(paperSize[0] / l_side)
				var h_y = Math.floor(paperSize[1] / w_side)
				if ((h_x * l_side) > paperSize[0]) {
					h_x = h_x - 1
				}
				if ((h_y * w_side) > paperSize[1]) {
					h_y = h_y - 1
				}
				var h_w = h_x * l_side
				var h_l = h_y * w_side
				var h_xy = h_x * h_y
				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [v_x, v_y],
						printing: [v_w, v_l],
						num_laying: v_xy
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [h_x, h_y],
						printing: [h_w, h_l],
						num_laying: h_xy
					}
				]
				break
			case 12:
				//*Custom
				//*calc the best amount of vertical layout
				var w_side = packaging_size.open_size[2] + 2 * b
				var l_side = packaging_size.open_size[3] + 2 * b

				var v_x = Math.floor(paperSize[0] / w_side)
				var v_y = Math.floor(paperSize[1] / l_side)
				if ((v_x * w_side) > paperSize[0]) {
					v_x = v_x - 1
				}
				if ((v_y * l_side) > paperSize[1]) {
					v_y = v_y - 1
				}
				var v_w = v_x * w_side
				var v_l = v_y * l_side
				var v_xy = v_x * v_y

				//*calc the best amount of horizontal layout
				var h_x = Math.floor(paperSize[0] / l_side)
				var h_y = Math.floor(paperSize[1] / w_side)
				if ((h_x * l_side) > paperSize[0]) {
					h_x = h_x - 1
				}
				if ((h_y * w_side) > paperSize[1]) {
					h_y = h_y - 1
				}
				var h_w = h_x * l_side
				var h_l = h_y * w_side
				var h_xy = h_x * h_y
				var laying = [
					{
						laying_type: 'straight',
						laying: 'vertical',
						grain_box_type: 'horizontal',
						layout: [v_x, v_y],
						printing: [v_w, v_l],
						num_laying: v_xy
					},
					{
						laying_type: 'straight',
						laying: 'horizontal',
						grain_box_type: 'vertical',
						layout: [h_x, h_y],
						printing: [h_w, h_l],
						num_laying: h_xy
					}
				]
				break
		}

		laying = laying.map(obj => ({
			...obj,
			paper_size: [roll_width, cut_off],
			laying_paper_size: paperSize,
			layout_size: this.setLayoutTolerance([obj] /* layout */, paper_tolerance, compType, paperSize1)[0]
		}))

		return {
			laying,
			gripper,
			color_bar,
			paper_edge
		}
	}

	setCalculateWSide(w_case, n, w, l, d, b, dust, ol, g, t) {
		console.log("setCalculateWSide", w_case, n, w, l, d, b, dust, ol, g, t)
		switch (w_case) {
			case 1.1: //* dust<=(w+t)/2
				var side = (n + 1) * (w + t) + n * (2 * b + d)
				console.log("formula : ", ` side = (${n} + 1) * (${w} + ${t}) + ${n} * (2 * ${b} + ${d})`)
				break
			case 1.2: //* dust>(w+t)/2
				var side = 2 * (w + t) + n * (2 * b + d) + (n - 1) * (2 * dust)
				console.log("formula : ", ` side = 2 * (${w} + ${t}) + ${n} * (2 * ${b} + ${d}) + (${n} - 1) * (2 * ${dust})`)
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

	setCalculateLSide(l_case, n, w, l, d, b, dust, ol, g) {
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


	setSelectedLayout(txt) {
		// เลือกแนวที่ชอบ
		if (txt != "") {
			if (txt == "vertical") {
				this.mainData.component.layout.selected_layout = this.mainData.component.layout.layout[0]
			} else {
				this.mainData.component.layout.selected_layout = this.mainData.component.layout.layout[1]
			}
		}
	}

	setCalculateLaysize(index, is_useMachineSize) {
		//set item.layout.laySize
		var item = this.mainData.component1[index]
		const {
			layout: { selected_layout },
			component_type: { type: compType },
			paper_tolerance,
			paperSize
		} = item || {}

		item.layout.laySize = this.setLayoutTolerance([selected_layout], paper_tolerance, compType, paperSize)[0]
		return this.setCutSize(item, is_useMachineSize)
	}

	setCalculateUps(index) {
		var item = this.mainData.component1[index]
		item.paper_usage = {}
		item.paper_usage.ups = item.layout.selected_layout.num_laying
		item.paper_usage.sig = 1
		item.paper_usage.line = []
		this.setCalculatePaperWeight(index) //* F done.
		this.setCalculateCorrugatedBoard(index) //* F done.
		this.setCalculateComponentWeight(index) //* ไม่ต้องแก้
		setCalculatePackingCost(index)
	}

	setCalculateSplit(index) {
		const item = this.mainData.component1[index]

		const {
			layout_manual,
			paperSize,
			paper_info: { roll_width, cut_off, parallel_roll_width },
			component_type: { type: compType },
			layout: { laySize }
		} = item || {}

		let split = 1
		if (layout_manual) { //* manual layout
			if (compType != 3) {
				if (parallel_roll_width == 'WSize') {
					const w_side = Math.floor(roll_width / laySize[0])
					const l_side = Math.floor(cut_off / laySize[1])
					split = w_side * l_side
				} else if (parallel_roll_width == 'LSize') {
					const w_side = Math.floor(roll_width / laySize[1])
					const l_side = Math.floor(cut_off / laySize[0])
					split = w_side * l_side
				}
			} else {
				const { corrugated_layer: { component_flute_side } } = item
				const w_side = Math.floor(roll_width / laySize[0])
				const l_side = Math.floor(cut_off / laySize[1])
				split = w_side * l_side
			}
		} else {
			if (compType != 3) {
				if (parallel_roll_width == 'WSize') {
					const w_side = Math.floor(roll_width / paperSize[2])
					const l_side = Math.floor(cut_off / paperSize[3])
					split = w_side * l_side
				} else if (parallel_roll_width == 'LSize') {
					const w_side = Math.floor(roll_width / paperSize[3])
					const l_side = Math.floor(cut_off / paperSize[2])
					split = w_side * l_side
				}
			} else {
				const w_side = Math.floor(roll_width / laySize[0])
				const l_side = Math.floor(cut_off / laySize[1])
				split = w_side * l_side
			}
		}

		item.paper_usage.split = split
	}

	setCalculatePaperWeight(index) {
		const is_multiple_f = getIsMultipleF()
		const printType = this.getPrintType()

		var item = this.mainData.component1[index]
		item.paper_usage.line = []
		// * calc. split paper with layout size
		console.log("before setCalculateSplit", item?.paper_info?.roll_width, item?.paper_info?.cut_off, item?.paperSize)
		this.setCalculateSplit(index)

		//* set qty.
		if (is_multiple_f) {
			const { f_detail: { f_list } } = item || {}
			item.paper_usage.line = f_list?.map(info => ({
				// f_code: info?.f_code,
				qty: info?.total_qty || 0,
				after_ups: Math.ceil(info?.total_qty / item.paper_usage.ups)
			})
			)
		} else {
			this.mainData.qty.totalqty.forEach((item1, index1) => {
				item.paper_usage.line.push({ qty: item1 })
				item.paper_usage.line[index1].after_ups = Math.ceil(item1 / item.paper_usage.ups)
				// item.paper_usage.line[index1].f_code = ""
			})
		}

		this.setWaste(item)
		const { paper_info: { roll_width, cut_off } } = item || {}
		//if(item.paper.corrugated_only==false){
		if (item.component_type.type != 3) {
			item.paper_usage.line.forEach((item1, index1) => {
				item1.paper_waste = item.waste.waste[index1]
				item1.waste = item.waste.waste[index1]
				item1.after_waste = item1.after_ups + item1.waste
				item1.paper_print = item1.after_waste * item.paper_usage.sig
				item1.paper_qty = Math.ceil(item1.paper_print / item.paper_usage.split)
				item1.paper_net = Math.ceil(item1.paper_qty / 100) * 100

				// * เงื่อนไขใหม่ 03/10/24
				if (['Konica']?.includes(printType)) {
					item1.paper_net = item1.paper_qty
				}

				item1.kilogram = parseFloat((item1.paper_net * item.gram / 1550000 * roll_width * cut_off).toFixed(2)),
					// item1.kilogram = parseFloat((item1.paper_net*item.gram/1550000*item.paperSize[2]*item.paperSize[3]).toFixed(2)),
					item1.ton = parseFloat((item1.kilogram / 1000).toFixed(3))
			})
		} else {
			item.paper_usage.line.forEach((item1, index1) => {
				item1.paper_waste = item.waste.waste[index1]
				item1.waste = item.waste.waste_corrugated_board[index1]
				item1.after_waste = item1.after_ups + item1.waste
				item1.paper_print = item1.after_waste * item.paper_usage.sig
				item1.paper_qty = Math.ceil(item1.paper_print / item.paper_usage.split)
				item1.paper_net = Math.ceil(item1.paper_qty / 100) * 100

				// * เงื่อนไขใหม่ 03/10/24
				if (['Konica']?.includes(printType)) {
					item1.paper_net = item1.paper_qty
				}

				item1.kilogram = parseFloat((item1.paper_net * item.gram / 1550000 * roll_width * cut_off).toFixed(2)),
					// item1.kilogram = parseFloat((item1.paper_net*item.gram/1550000*item.paperSize[2]*item.paperSize[3]).toFixed(2)),
					item1.ton = parseFloat((item1.kilogram / 1000).toFixed(3))

			})
		}
		this.setCalculatePaperCost(item) //1 ตามยอดของแต่ละ F done
		this.setCalculatePlateCost(item) //1 ตามยอดของแต่ละ F done
		this.setCalculateProofCost(item) // new
		this.setCalculatePrintCost(item) //1 ตามยอดของแต่ละ F done

		this.setCalculateCoatingCost(item) //3 คิดรวม //? done

		this.setCalculateFoilStampCost(item) //2 แยกตามเลือก F //? done
		this.setCalculateBossingCost(item) //2 แยกตามเลือก F //? done
		this.setCalculateSpecialInkCost(item) //1 ตามยอดของแต่ละ F //? done

		this.setCalculateAssemblyCost(item) //3 คิดรวม //? done
		this.setCalculateDieCutCost(item) //3 คิดรวม //? done
		this.setCalculateDigitalDieCutCost(item)
	}

	setCalculatePaperCost(item) {
		let { roll_width, cut_off, std_paper_id } = item.paper_info

		if (std_paper_id) {
			// get std. paper cost size for calculate cost
			const {
				std_paper_size_cost_width_in: wCostSize,
				std_paper_size_cost_length_in: lCostSize
			} = getStdPaperSize(std_paper_id)

			roll_width = wCostSize
			cut_off = lCostSize
		}

		if (item.component_type.type != 3) {
			item.paper.paper_total_price = parseFloat(
				((item.paper.paper_cost * (1 + item.paper.paper_markup / 100)) + item.paper.paper_percent).toFixed(2)
			)

			item.paper_usage.line.forEach((item1, index1) => {
				let unit_price = 0

				if (!item1.price) {
					item1.price = {}
				}

				if (item.paper.sheet_unit_price) {
					//* unit price -> THB/sheet
					unit_price = item.paper.paper_total_price
				} else {
					//* unit price -> THB/Kg
					unit_price = parseFloat((roll_width * cut_off * item.paper.paper_total_price * item.paper.paper_gram / 1550000).toFixed(2))
				}

				item1.price.paper = {
					type_id: 10,
					process_id: 31,
					type: 'material',
					name: 'paper',
					qty: item1.paper_net,
					unit_price: unit_price,
					price: parseFloat((item1.paper_net * unit_price).toFixed(2))
				}
			})
		}
	}


	setCalculatePlateCost(item) {
		const print_type = this.getPrintType()
		const is_RePrinted = getIsRePrint()
		const is_usePrevPlate = getIsUsePreviousPlate()

		const is_cut1 = item?.machine?.machine_size?.id == 1 ? true : false
		let checkUsePrevPlate = 0

		const {
			block_polymer_min_price: defaultBlockPolymerMinPrice,
		} = defaultData || {}

		if (is_RePrinted && is_usePrevPlate) {
			checkUsePrevPlate = 1
		}

		function getPlatePrice({ print_type, is_RePrinted, is_usePrevPlate, is_cut1 }) {

			const {
				cut_1_plate_markup = 0,
				plate_price: defaultPlatePrice,
				plate_polymer_price: defaultPlatePolymerPrice,
				reprint_plate_polymer_price: defaultReprintPlatePolymerPrice,
				block_polymer_min_price: defaultBlockPolymerMinPrice,
				reprintReducePlateCostPercent
			} = defaultData || {}

			let plateMarkupPrice = is_cut1 ? cut_1_plate_markup : 0

			let platePolymerPriceSqin = is_RePrinted ? defaultReprintPlatePolymerPrice : defaultPlatePolymerPrice

			if (print_type == 'Offset') {
				var process_id = 1,
					name = 'plate',
					plate_ppu = defaultPlatePrice

				//* UPDATE 24.10.22
				if (is_RePrinted && is_usePrevPlate) {
					plate_ppu = plate_ppu - (plate_ppu * (reprintReducePlateCostPercent / 100))
				}

				plate_ppu += plateMarkupPrice

			} else if (print_type == 'Flexo') {
				var process_id = 38,
					name = 'plate polymer',
					plate_ppu = platePolymerPriceSqin * est?.mainData?.job?.flexo_size[0] * est?.mainData?.job?.flexo_size[1]
			} else {
				var process_id = null,
					name = ''
			}

			return { process_id, plate_ppu, name }
		}

		let { process_id, plate_ppu, name } = getPlatePrice({ print_type, is_RePrinted, is_usePrevPlate, is_cut1 })


		item.paper_usage.is_useReprintPlate = 0

		item.paper_usage.line.forEach((item1, index1) => {

			const fCode = item?.f_detail?.f_list[index1]?.f_code || ""
			let colorDetail = item.color[0]

			//* find f code color
			if (fCode) {
				colorDetail = item.color?.find(obj => obj?.f_code === fCode) || item.color[0]
			}

			const { outside = 0, inside = 0 } = colorDetail || {}

			if (!item1.price) {
				item1.price = {}
			}

			item1.price.plate = {
				type_id: 1,
				process_id: process_id,
				type: 'plate',
				name: name,
				reprint: {}
			}

			switch (print_type) {
				case 'Offset':

					let qty = Math.max(Math.round(item1?.after_waste / 100000), 1)
					let reprint_qty = qty > 1 ? qty - 1 : 0

					let unit_price_out = toNumber(outside * item.paper_usage.sig * plate_ppu, 2)
					let unit_price_in = toNumber(inside * item.paper_usage.sig * plate_ppu, 2)
					let price_out = unit_price_out * qty
					let price_in = unit_price_in * qty

					let reprint_unit_price_out = 0, reprint_unit_price_in = 0, reprint_price_out = 0, reprint_price_in = 0

					if (!checkUsePrevPlate && qty > 1) {
						qty = 1
						price_out = unit_price_out * qty
						price_in = unit_price_in * qty

						// * ----------- reprint plate --------------
						const { plate_ppu } = getPlatePrice({ print_type, is_RePrinted: true, is_usePrevPlate: true, is_cut1 })

						reprint_unit_price_out = toNumber(outside * item.paper_usage.sig * plate_ppu, 2)
						reprint_unit_price_in = toNumber(inside * item.paper_usage.sig * plate_ppu, 2)

						reprint_price_out += (reprint_unit_price_out * reprint_qty)
						reprint_price_in += (reprint_unit_price_in * reprint_qty)

						item.paper_usage.is_useReprintPlate = 1
					}

					item1.price.plate.outside = {
						unit_price: unit_price_out,
						qty: qty,
						price: price_out
					}

					item1.price.plate.inside = {
						unit_price: unit_price_in,
						qty: qty,
						price: price_in
					}

					item1.price.plate.reprint.outside = {
						unit_price: reprint_unit_price_out,
						qty: reprint_qty,
						price: reprint_price_out
					}

					item1.price.plate.reprint.inside = {
						unit_price: reprint_unit_price_in,
						qty: reprint_qty,
						price: reprint_price_in
					}

					break;
				case 'Flexo':
					// update 10.03.22 add min price
					const outside_price = parseFloat((plate_ppu * item.paper_usage.ups * outside).toFixed(2))
					const inside_price = parseFloat((plate_ppu * item.paper_usage.ups * inside).toFixed(2))
					item1.price.plate.outside = {
						unit_price: plate_ppu,
						qty: item.paper_usage.ups * outside,
						price: outside_price > 0 && outside_price < defaultBlockPolymerMinPrice
							? defaultBlockPolymerMinPrice
							: outside_price
					}
					item1.price.plate.inside = {
						unit_price: plate_ppu,
						qty: item.paper_usage.ups * inside,
						price: inside_price > 0 && inside_price < defaultBlockPolymerMinPrice
							? defaultBlockPolymerMinPrice
							: inside_price
					}
					break;
				case 'Jet Press':
				case 'Konica':
				default:
					item1.price.plate.outside = {
						unit_price: 0,
						qty: 0,
						price: 0
					}
					item1.price.plate.inside = {
						unit_price: 0,
						qty: 0,
						price: 0
					}
					break;
			}
		})
	}


	setCalculatePrintCost(item) {
		const isProfitSharing = getIsProfitSharing()
		const print_type = this.getPrintType()

		item.paper_usage.line.forEach((item1, index1) => {
			const fCode = item?.f_detail?.f_list[index1]?.f_code || ""
			const printObj = {
				process_id: null,
				name: null,
				type_outside: null,
				type_inside: null,
				ink_factor: 1
			}
			let unit_price_all = 0,
				qty_all = 0,
				total_price = 0

			let colorDetail = item?.color[0]

			//* find f code color
			if (fCode) {
				colorDetail = item?.color?.find(obj => obj?.f_code === fCode) || item?.color[0]
			}

			const {
				outside = 0,
				inside = 0,
				is_black_printing = false,
				black_printing_outside = false,
				black_printing_inside = false,
			} = colorDetail || {}

			switch (print_type) {
				case 'Offset':
					printObj.process_id = 2
					printObj.name = 'print-sheet'
					printObj.type_outside = outside < 3
						? 'print_1col'
						: outside < 5
							? 'print_3col'
							: 'print_5col'
					printObj.type_inside = inside < 3
						? 'print_1col'
						: inside < 5
							? 'print_3col'
							: 'print_5col'
					if (this.mainData.job.ink_type == 'UV') {
						//* if UV ink -> unit price is 4 times much more than conventional ink (revise date: Aug 4,2021)
						//* if UV ink -> unit price is 3 times much more than conventional ink (revise date: Feb 22,2023)
						//* if UV ink -> unit price is 2.5 times much more than conventional ink (revise date: Sep 14,2023)
						printObj.ink_factor = 2.5
					}
					break;
				case 'Flexo':
					printObj.process_id = 37
					printObj.name = 'print-flexo'
					printObj.type_outside = 'print_flexo'
					printObj.type_inside = 'print_flexo'
					break;
				case 'Jet Press':
					printObj.process_id = 44
					printObj.name = 'print-jetpress'
					break;
				case 'Konica':
					printObj.process_id = 56
					printObj.name = 'print-konica'
					break;
				default:
					break;
			}

			if (!item1.price) {
				item1.price = {}
			}

			let print_price_out, unitprice_out, qty_out, price_out = 0
			let print_price_in, unitprice_in, qty_in, price_in = 0

			if (!['Jet Press', 'Konica']?.includes(print_type)) {
				//* Profit Sharing Only
				if (isProfitSharing) {
					const { print } = defaultData?.profit_sharing || {}
					let print_price = parseFloat((item1.after_ups * print.print_rate).toFixed(4))

					if (print_price < print.print_min_price) {
						print_price = print.print_min_price
					}

					print_price_out = {
						price: print_price
					}
					print_price_in = {
						price: print_price
					}
				} else {
					print_price_out = this.setPriceRate(printObj.type_outside, item1.after_ups)
					print_price_in = this.setPriceRate(printObj.type_inside, item1.after_ups)
				}

				unitprice_out = parseFloat((printObj.ink_factor * print_price_out.price * outside * item.paper_usage.sig).toFixed(2))
				qty_out = 1
				price_out = parseFloat((unitprice_out * qty_out).toFixed(2))

				unitprice_in = parseFloat((printObj.ink_factor * print_price_in.price * inside * item.paper_usage.sig).toFixed(2))
				qty_in = 1
				price_in = parseFloat((unitprice_in * qty_in).toFixed(2))

			} else if (print_type == 'Konica') {
				var col_factor_out = outside == 0 ? 0 : 1,
					col_factor_in = inside == 0 ? 0 : 1

				//* 3 บาท/ใบพิมพ์/ด้าน
				print_price_out = 3
				print_price_in = 3

				// * เงื่อนไขเก่า ไม่มีระบุด้าน
				if (is_black_printing) {
					if (outside > 0) {
						print_price_out = 1
					}

					if (inside > 0) {
						print_price_in = 1
					}
				}

				if (black_printing_outside) {
					print_price_out = 1
				}

				if (black_printing_inside) {
					print_price_in = 1
				}

				//* print out color
				unitprice_out = col_factor_out * print_price_out
				qty_out = item1.paper_print
				price_out = parseFloat((unitprice_out * qty_out).toFixed(2))

				//* print in color
				unitprice_in = col_factor_in * print_price_in
				qty_in = item1.paper_print
				price_in = parseFloat((unitprice_in * qty_in).toFixed(2))

				// qty_all = col_factor_out + col_factor_in
				// unit_price_all = (print_price_out + print_price_in) * item1.paper_print
				// total_price = unit_price_all * qty_all
			} else {
				//* Jet Press
				var col_factor_out = outside == 0 ? 0 : 1,
					col_factor_in = inside == 0 ? 0 : 1,
					print_price = this.setPriceRate4JetPress(item, item1.paper_print)

				//* print out color
				unitprice_out = col_factor_out * print_price
				qty_out = item1.paper_print
				price_out = parseFloat((unitprice_out * qty_out).toFixed(2))

				//* print in color
				unitprice_in = col_factor_in * print_price
				qty_in = item1.paper_print
				price_in = parseFloat((unitprice_in * qty_in).toFixed(2))

				qty_all = col_factor_out + col_factor_in
				unit_price_all = print_price * item1.paper_print
				total_price = unit_price_all * qty_all
			}

			item1.price.print = {
				type_id: 2,
				process_id: printObj.process_id,
				type: 'print',
				name: printObj.name,
				outside: {
					unit_price: unitprice_out,
					qty: qty_out,
					price: price_out
				},
				inside: {
					unit_price: unitprice_in,
					qty: qty_in,
					price: price_in
				},
				all: {
					unit_price: unit_price_all,
					qty: qty_all,
					price: total_price
				}
			}
		})
	}

	setCalculateProofCost(item) {
		//* for Jet Press : 500 per component or per F
		const print_type = this.getPrintType()
		const isMultipleF = getIsMultipleF()

		if (!['Jet Press', 'Konica'].includes(print_type)) {
			return false
		}

		const { proof_price_per_component: unit_price = 0 } = defaultData?.print_type_config?.getPrintTypeConfig()

		let qty = (isMultipleF ? 1 : 1) || 0
		item.paper_usage.line.forEach((item1, index1) => {

			if (!item1.price) {
				item1.price = {}
			}

			item1.price.proof = {
				type_id: 14,
				process_id: 48,
				type: 'proof',
				name: 'proof',
				all: {
					unit_price: unit_price,
					qty: qty,
					price: qty * unit_price
				}
			}

		})
	}

	setCalculateOpenSize(item, type) {
		switch (type) {
			case 1:
				var rect_size = [
					mm2inch(2 * (item.width + item.tuck_flap) + item.depth),
					mm2inch(2 * (item.width + item.length) + item.glue_flap),
					2 * (item.width + item.tuck_flap) + item.depth,
					2 * (item.width + item.length) + item.glue_flap
				]
				break
			case 2:
				var rect_size = [
					mm2inch(2 * (item.width + item.tuck_flap) + item.depth),
					mm2inch(2 * (item.width + item.length) + item.glue_flap),
					2 * (item.width + item.tuck_flap) + item.depth,
					2 * (item.width + item.length) + item.glue_flap
				]
				break
			case 3:
				var rect_size = [
					mm2inch(item.tuck_flap + item.width + item.depth + item.width / 2 + item.ol),
					mm2inch(2 * (item.width + item.length) + item.glue_flap),
					item.tuck_flap + item.width + item.depth + item.width / 2 + item.ol,
					2 * (item.width + item.length) + item.glue_flap
				]
				break
			case 4:
				var rect_size = [
					mm2inch(item.tuck_flap + item.width + item.depth + item.width / 2 + item.ol),
					mm2inch(2 * (item.width + item.length) + item.glue_flap),
					item.tuck_flap + item.width + item.depth + item.width / 2 + item.ol,
					2 * (item.width + item.length) + item.glue_flap
				]
				break
			case 5:
				var rect_size = [
					mm2inch(item.width + 4 * item.depth),
					mm2inch(item.length + 4 * item.depth + 2 * item.dust_flap),
					item.width + 4 * item.depth,
					item.length + 4 * item.depth + 2 * item.dust_flap
				]
				break
			case 6:
				var rect_size = [
					mm2inch(item.width + 4 * item.depth + 2 * item.dust_flap + 2 * item.ol),
					mm2inch(item.length + 4 * item.depth + 2 * item.dust_flap + 2 * item.ol),
					item.width + 4 * item.depth + 2 * item.dust_flap + 2 * item.ol,
					item.length + 4 * item.depth + 2 * item.dust_flap + 2 * item.ol
				]
				break
			case 7:
				var rect_size = [
					mm2inch(2 * (item.length + item.dust_flap) + item.width),
					mm2inch(2 * (item.length + item.depth) + item.length),
					2 * (item.length + item.dust_flap) + item.width,
					2 * (item.length + item.depth) + item.length
				]
				break
			case 8:
				var rect_size = [
					mm2inch(item.tuck_flap + 2 * item.depth + item.width / 2 + item.ol),
					mm2inch(2 * (item.width + item.length) + item.glue_flap),
					item.tuck_flap + 2 * item.depth + item.width / 2 + item.ol,
					2 * (item.width + item.length) + item.glue_flap
				]
				break
			case 9:
				var rect_size = [
					mm2inch(item.depth),
					mm2inch(2 * (item.width + item.length) + item.glue_flap),
					item.depth,
					2 * (item.width + item.length) + item.glue_flap
				]
				break
			case 10:
				var rect_size = [
					mm2inch(item.length + item.depth),
					mm2inch(2 * item.width + item.glue_flap),
					item.length + item.depth,
					2 * item.width + item.glue_flap,
				]
				break
			case 11:
				var rect_size = [
					mm2inch(2 * item.width + item.depth),
					mm2inch(2 * (item.width + item.length) + item.glue_flap),
					2 * item.width + item.depth,
					2 * (item.width + item.length) + item.glue_flap
				]
				break
		}
		return rect_size
	}

	setCalculateFoldSize(item, type) {
		if (type == 8) {
			var fold_size = [
				mm2inch((2 * item.width + item.tuck_flap)),
				mm2inch(item.length),
				mm2inch(item.depth),
				(2 * item.width + item.tuck_flap),
				item.length,
				item.depth
			]
		} else {
			var fold_size = [
				mm2inch(item.width),
				mm2inch(item.length),
				mm2inch(item.depth),
				item.width,
				item.length,
				item.depth,
			]
		}
		return fold_size
	}

	setCalculatePackingSize(item) {
		const { type_id: box_type_id } = item.box_type
		const { length, width, depth, tuck_flap, ol, dust_flap, packing_size: prev_packing_size } = item.packaging_size || {}
		let
			packing_size = [],
			w_side = 0,
			l_side = 0

		// * calc. box template each side size
		switch (box_type_id) {
			case 1:
				// w_side = length + 2 * (depth + tuck_flap) 
				// l_side = width + depth
				w_side = depth + 2 * (width + tuck_flap)
				l_side = length + width
				break
			case 2:
				// w_side = length + 2 * (depth + tuck_flap)
				// l_side = width + depth
				w_side = depth + 2 * (width + tuck_flap)
				l_side = length + width
				break
			case 3:
				// w_side = length + depth + tuck_flap + depth / 2 + ol
				// l_side = width + depth
				w_side = depth + width + tuck_flap + ol + (width / 2)
				l_side = length + width
				break
			case 4:
				// w_side = length + depth + tuck_flap
				// l_side = width + depth
				w_side = depth + width + tuck_flap
				l_side = length + width
				break
			case 5:
				// w_side = width + 4 * depth
				// l_side = length + 4 * depth + 2 * dust_flap
				w_side = (4 * depth) + width
				l_side = (2 * dust_flap) + (4 * depth) + length
				break
			case 6:
				// w_side = width + 4 * depth + 2 * dust_flap + 2 * ol
				// l_side = length + 4 * depth + 2 * dust_flap + 2 * ol
				w_side = (2 * dust_flap) + (4 * depth) + (2 * ol) + width
				l_side = (2 * dust_flap) + (4 * depth) + (2 * ol) + length
				break
			case 7:
				// w_side = width
				// l_side = depth + length
				w_side = width
				l_side = length + depth
				break
			case 8:
				// w_side = 2 * width + tuck_flap
				// l_side = 2 * (depth + length)
				w_side = tuck_flap + (2 * depth)
				l_side = length + width
				break
			case 9:
				// w_side = length
				// l_side = width + depth
				w_side = depth
				l_side = length + width
				break
			case 10:
				// w_side = length + depth
				// l_side = width
				w_side = length + depth
				l_side = width
				break
			case 11:
				// w_side = length + 2 * dust_flap
				// l_side = width + depth
				w_side = depth + (2 * width)
				l_side = length + width
				break
			case 12:
			default:
				// packing_size = prev_packing_size
				packing_size = prev_packing_size
				break
		}

		// * convert packing each side mm to inch []
		if (![12].includes(box_type_id)) {
			packing_size = [
				mm2inch(w_side),
				mm2inch(l_side),
				w_side,
				l_side
			]
		}

		return packing_size
	}

	setCalculateArea(item) {
		const {
			packaging_size: {
				open_size,
				width,
				length,
				depth,
				dust_flap: dust,
				glue_flap: glue,
				tuck_flap: tuck,
				ol
			}
		} = item

		let area_box = 0

		switch (item.box_type.type_id) {
			//! already edited : 1,2,3,4,5,6,7,8,9,10,11
			//! last Edit : Jul 12, 2021 11:16 AM
			case 1:
				area_box = (depth * glue) + (2 * length * depth) + (2 * width * depth) + (4 * dust * width) + (2 * length * (tuck + width))
				break
			case 2:
				area_box = (depth * glue) + (2 * length * depth) + (2 * width * depth) + (4 * dust * width) + (2 * length * (tuck + width))
				break
			case 3:
				area_box = (depth * glue) + (2 * length * depth) + (2 * width * depth) + (2 * dust * width) + ((tuck + width) * length) + ((width / 2 + ol) * (2 * width + 2 * length))
				break
			case 4:
				area_box = (depth * glue) + (2 * length * depth) + (2 * width * depth) + (2 * dust * width) + ((tuck + width) * length) + (2 * length * (width / 2 + ol)) + (width * width)
				break
			case 5:
				area_box = ((width + 4 * depth) * length) + (2 * (width + 2 * depth) * depth) + (2 * (depth + dust) * width)
				break
			case 6:
				area_box = ((width + 4 * depth + 2 * ol + 2 * dust) * length) + ((4 * depth + 2 * ol + width) + 2 * depth) + (2 * (ol + depth + dust * width))
				break
			case 7:
				area_box = (3 * width * length) + (2 * depth * width) + (2 * (length + dust) * depth) + (4 * (length + glue))
				break
			case 8:
				area_box = (glue * depth) + (4 * depth * length) + (2 * width * depth) + (2 * length * tuck) + (length + width) * width + (ol * length) + (width * depth)
				break
			case 9:
				area_box = (glue * depth) + (2 * width * depth) + (2 * length * depth)
				break
			case 10:
				area_box = (glue * length) + (2 * length * width) + (2 * width * depth)
				break
			case 11:
				area_box = (glue * length) + (2 * length * depth) + (2 * width * depth) + (4 * (width + length) * width)
				break
			case 12:
				area_box = open_size[2] * open_size[3]
				break
		}
		return area_box
	}

	setCalculateComponentWeight(index) {
		const item = this.mainData.component1[index]
		const { component_type: { type: compType }, gram, corrugated_layer } = item || {}
		let paper_weight = 0,
			corrugated_weight = 0

		const area_box = this.setCalculateArea(item)

		if ([2, 3].includes(compType)) {
			// * with corrugated  , corrugated only
			corrugated_weight = parseFloat((area_box * corrugated_layer.info.all_gram * corrugated_layer.info.num_layer / 1000000000).toFixed(4))
			if ([2].includes(compType)) {
				paper_weight = parseFloat((area_box * gram / 1000000000).toFixed(6))
			}
		} else {
			// * no corrugated
			paper_weight = parseFloat((area_box * gram / 1000000000).toFixed(6))
		}

		item.weight = {
			paper_weight,
			corrugated_weight,
			weight: parseFloat((paper_weight + corrugated_weight).toFixed(6))
		}

		this.setCalculateThickness(item)
	}

	setCalculateThickness(item) {
		const {
			component_type: { type: compType },
			corrugated_layer,
			paper,
			box_type: { packing_layer = 0 }
		} = item || {}
		let paper_thickness = 0,
			corrugated_thickness = 0

		if ([2, 3].includes(compType)) {
			// * with , corrugated only
			corrugated_thickness = corrugated_layer.info.thickness
			if ([2].includes(compType)) {
				//* with corrugated
				paper_thickness = paper.paper_thickness
			}
		} else {
			// * no corrugated
			paper_thickness = paper.paper_thickness
		}
		const total_hickness_mm = paper_thickness + corrugated_thickness
		const packing_thickness_mm = (total_hickness_mm * (packing_layer || 1))
		item.thickness = {
			mm: {
				paper_thickness,
				corrugated_thickness,
				thickness: parseFloat(total_hickness_mm.toFixed(2)),
				packing_thickness: parseFloat(packing_thickness_mm.toFixed(2))
			},
			inch: {
				paper_thickness: parseFloat((Math.ceil(paper_thickness / 25.4 * 100000) / 100000).toFixed(5)),
				corrugated_thickness: parseFloat((Math.ceil(corrugated_thickness / 25.4 * 100000) / 100000).toFixed(5)),
				thickness: parseFloat((Math.ceil(total_hickness_mm / 25.4 * 100000) / 100000).toFixed(5)),
				packing_thickness: parseFloat((Math.ceil(packing_thickness_mm / 25.4 * 100000) / 100000).toFixed(5))
			},
		}
	}

	setDefaultPacking(compIndex, is_different_packing = false) {
		console.log("setDefaultPacking", is_different_packing)
		//Set to Kraftwrap
		const item = this.mainData.component1[compIndex]
		item.packing = [[]]

		var packing_size = this.getPackingSize(item)
		var num_side = [1, 1],
			w_side = num_side[0] * packing_size[0],
			l_side = num_side[1] * packing_size[1]

		var lay_kraftwrap_size = [
			parseFloat(w_side.toFixed(2)),
			parseFloat(l_side.toFixed(2)),
			parseFloat(inch2mm(w_side).toFixed(2)),
			parseFloat(inch2mm(l_side).toFixed(2))
		]

		var kraftwrap_obj = {
			bulk_size: packing_size,
			layKraftwrap: lay_kraftwrap_size,
			num_side,
			qty_per_kraftwrap: "",
			is_editKraftwrapQty: false
		}

		//* For Multiple F & Different Packaging
		if (is_different_packing) {
			item?.f_detail?.f_list?.forEach((fInfo, fIndex) => {
				if (fIndex > 0) {
					item.packing.push([])
				}
				this.setKraftwrap(compIndex, kraftwrap_obj, fIndex)
				this.setCarton(compIndex, "", fIndex)
				this.setPaperband(compIndex, "", fIndex)
				this.setPallet(compIndex, "", fIndex)
				console.log("item.packing", item.packing)
			})
		} else {
			const defaultFIndex = 0
			this.setKraftwrap(compIndex, kraftwrap_obj, defaultFIndex)
			this.setCarton(compIndex, "", defaultFIndex)
			this.setPaperband(compIndex, "", defaultFIndex)
			this.setPallet(compIndex, "", defaultFIndex)
		}
	}

	setPaperband(index, obj, fIndex = 0) {
		var item = this.mainData.component1[index]

		if (obj != "") {
			const check_paperband = this.getPackingObj(item, 'paperband', fIndex)
			if (!check_paperband) {
				// * add paperband
				item.packing[fIndex].push({
					type_id: 11,
					type: 'packing',
					process_id: 25,
					name: 'paperband',
					info: {},
					line: [],
					detail: []
				})
			}

			const defaultPaperband = defaultData.paperband.find((item1) => item1.type === obj.type)

			item.packing[fIndex].forEach((item1, index1) => {
				if (item1.name == 'paperband') {
					item1.info = {
						roll_width: defaultPaperband.width,
						roll_length: defaultPaperband.length,
						type: obj.type,
						roll_price: defaultPaperband.price,
						thickness: defaultPaperband.thickness,
						qty_per_paperband: obj.qty_per_paperband
					}
					item1.line = [],
						item1.detail = []
				}
			})
		} else {
			// * remove paperband
			item.packing[fIndex].forEach((item1, index1) => {
				if (item1.name == 'paperband') {
					item.packing[fIndex].splice(index1, 1)
				}
			})
		}
	}


	setCalculatePaperbandCost(item, fIndex = 0) {
		const { paperband_price: default_paperband_price } = defaultData.paperband_info || {}
		item.packing[fIndex].forEach((objPacking) => {
			if (objPacking.name !== 'paperband') return

			const {
				packing_marking = 0
			} = defaultData || {}

			const { paperband, deliveryDetail } = this.setCalculatePaperbandStack(item, objPacking, fIndex)

			objPacking.info.paperband = paperband

			objPacking.line = paperband.map((item2) => {
				const unit_price = default_paperband_price + item2.cost_per_stack
				const total_price = parseFloat((unit_price * item2.stack * (1 + (packing_marking / 100))).toFixed(2))
				return {
					unit_price: parseFloat((default_paperband_price + item2.cost_per_stack).toFixed(2)),
					qty: item2.stack,
					price: total_price
				}
			})

			// ! NEW Delivery
			objPacking.detail = deliveryDetail?.map(round => ({
				...round, detail: round.detail.map(objDetail => {
					const unit_price = default_paperband_price + objDetail.cost_per_stack
					const total_price = parseFloat((unit_price * objDetail.stack * (1 + (packing_marking / 100))).toFixed(2))
					return {
						unit_price: parseFloat((unit_price).toFixed(2)),
						qty: objDetail.stack,
						price: total_price,
						objDetail
					}
				})
			}))
		})
	}

	setCalculatePaperbandStack(item, item1, fIndex = 0) {
		const { paperband_allowance: default_paperband_allowance } = defaultData.paperband_info || {}
		var packing_size = this.getPackingSize(item)
		var thickness_per_cp = item.thickness.mm.packing_thickness
		var circ = 0,
			paperband_per_roll = 0,
			stack_height = 0

		if (packing_size[2] < packing_size[3]) {
			var short_side = packing_size[2], long_side = packing_size[3]
		} else {
			var short_side = packing_size[3], long_side = packing_size[2]
		}

		//* circ = circumference เส้นรอบวง
		// var circ = parseFloat((2 * short_side + (2 * item1.info.qty_per_paperband * thickness_per_cp) + default_paperband_allowance).toFixed(2))
		// var paperband_per_roll = Math.floor(item1.info.roll_length * 1000 / circ)
		var paperband = []

		var kraftwrap_item = this.getPackingObj(item, 'kraftwrap', fIndex)
		var carton_item = this.getPackingObj(item, 'carton', fIndex)

		if (kraftwrap_item != null) {
			//มีการ Pack Kraftwrap 
			const kraftwrap_qty_per_pack = kraftwrap_item.info.qty_per_pack
			var qty_per_band = item1.info.qty_per_paperband || 0
			if (kraftwrap_qty_per_pack <= item1.info.qty_per_paperband) {
				qty_per_band = kraftwrap_qty_per_pack
				item1.info.qty_per_paperband = kraftwrap_qty_per_pack
			}

			circ = parseFloat((2 * short_side + (2 * item1.info.qty_per_paperband * thickness_per_cp) + default_paperband_allowance).toFixed(2))
			paperband_per_roll = Math.floor(item1.info.roll_length * 1000 / circ)
			stack_height = item1.info.qty_per_paperband * thickness_per_cp

			/*
			 หาว่า box นี้มีแบ่งส่งออกไปกี่ยอด
			*/
			// ! new version
			// if(this.mainData.qty.totalqty.length > 1){
			// * จำนวน qty มากกว่า 1
			kraftwrap_item.line.forEach((item3, index3) => {
				const kraftwrap_qty = item3.qty //* จำนวน kraftwrap ที่ใช้
				const wrappedQty = (kraftwrap_qty - 1) * kraftwrap_qty_per_pack // * จำนวนแพ๊ค - 1 * จำนวนใน1แพ๊ค
				const qty = this.mainData.qty.main[index3] + this.mainData.qty.runon[index3] // * จำนวนยอด
				// * จำนวนชั้น ?? ทั้งหมดที่ใช้กับ qty ทั้งหมด
				const stack = Math.ceil(wrappedQty / qty_per_band) + Math.ceil((qty - wrappedQty) / qty_per_band)
				paperband.push({
					qty: qty,
					stack: stack,
					roll_usage: Math.ceil(stack * kraftwrap_qty / paperband_per_roll),
					cost_per_stack: parseFloat((item1.info.roll_price / paperband_per_roll).toFixed(2))
				})
			})
			// }else{
			// * จำนวน qty = 1
			var deliveryDetail = kraftwrap_item?.detail?.map(obj => { //* loop round.
				/*
					หาจำนวนของแต่ละ comp. ที่ส่งในรอบนี้
				*/
				const detail = obj?.detail?.map(objDetail => {
					const { qty: kraftwrap_qty, compQty: qty } = objDetail
					let stack = 0

					if (objDetail?.packArr?.length > 0 && objDetail?.qtyArr?.length > 0) {
						const stackArr = objDetail?.packArr?.map((qty, qtyIndex) => {
							const wrappedQty = (qty - 1) * kraftwrap_qty_per_pack
							return Math.ceil(wrappedQty / qty_per_band) + Math.ceil((objDetail?.qtyArr[qtyIndex] - wrappedQty) / qty_per_band)
						})
						stack = stackArr?.reduce((total, current) => total += current, 0)
					} else {
						const wrappedQty = (kraftwrap_qty - 1) * kraftwrap_qty_per_pack // 17010
						stack = Math.ceil(wrappedQty / qty_per_band) + Math.ceil((qty - wrappedQty) / qty_per_band)
					}

					return {
						qty: qty,
						stack: stack,
						roll_usage: Math.ceil(stack * kraftwrap_qty / paperband_per_roll),
						cost_per_stack: parseFloat((item1.info.roll_price / paperband_per_roll).toFixed(2))
					}
				})

				return {
					...obj,
					unit_price: item1.info.roll_price,
					detail: detail
				}
			})

		} else if (carton_item != null) {
			//มีการ Pack Carton
			const qty_per_carton = carton_item.info.carton.qty_per_carton

			var qty_per_band = item1.info.qty_per_paperband

			if (qty_per_carton <= item1.info.qty_per_paperband) {
				var qty_per_band = qty_per_carton
				item1.info.qty_per_paperband = qty_per_carton
			}

			circ = parseFloat((2 * short_side + (2 * item1.info.qty_per_paperband * thickness_per_cp) + default_paperband_allowance).toFixed(2))
			paperband_per_roll = Math.floor(item1.info.roll_length * 1000 / circ)
			stack_height = item1.info.qty_per_paperband * thickness_per_cp

			// if(this.mainData.qty.totalqty.length > 1){
			// * จำนวน qty > 1
			carton_item.line.forEach((item3, index3) => {
				const carton_qty = item3.qty
				const in_carton_qty = (carton_qty - 1) * qty_per_carton
				const qty = this.mainData.qty.totalqty[index3]
				// * จำนวนชั้น ?? ทั้งหมดที่ใช้กับ qty ทั้งหมด
				var stack = Math.ceil(in_carton_qty / qty_per_band) + Math.ceil(qty - in_carton_qty / qty_per_band)
				paperband.push({
					qty: qty,
					stack: stack,
					roll_usage: Math.ceil(stack * carton_qty / paperband_per_roll),
					cost_per_stack: parseFloat((item1.info.roll_price / paperband_per_roll).toFixed(2))
				})
			})

			// }else{
			// * จำนวน qty = 1
			var deliveryDetail = carton_item.detail.map(obj => { //* loop round.
				/*
					หาจำนวนของแต่ละ comp. ที่ส่งในรอบนี้
				*/

				const detail = obj.detail.map(objDetail => {
					const { qty: carton_qty, compQty: qty } = objDetail
					// const in_carton_qty = (carton_qty - 1) * qty_per_carton
					// const stack = Math.ceil(in_carton_qty / qty_per_band) + Math.ceil((qty - in_carton_qty) / qty_per_band)

					let stack = 0

					if (objDetail?.packArr?.length > 0 && objDetail?.qtyArr?.length > 0) {
						const stackArr = objDetail?.packArr?.map((qty, qtyIndex) => {
							const in_carton_qty = (qty - 1) * qty_per_carton
							return Math.ceil(in_carton_qty / qty_per_band) + Math.ceil((objDetail?.qtyArr[qtyIndex] - in_carton_qty) / qty_per_band)
						})
						stack = stackArr?.reduce((total, current) => total += current, 0)
					} else {
						const in_carton_qty = (carton_qty - 1) * qty_per_carton // 17010
						stack = Math.ceil(in_carton_qty / qty_per_band) + Math.ceil((qty - in_carton_qty) / qty_per_band)
					}

					return {
						qty: qty,
						stack: stack,
						roll_usage: Math.ceil(stack * carton_qty / paperband_per_roll),
						cost_per_stack: parseFloat((item1.info.roll_price / paperband_per_roll).toFixed(2))
					}
				})


				return {
					...obj,
					unit_price: item1.info.roll_price,
					detail: detail
				}
			})
			// }

		} else {
			alert('ไม่สามารถกำหนดรูปแบบการ Packing ได้. เนื่องจากไม่พบข้อมูล Kraftwrap , Carton')
			return
		}

		this.setCalculatePaperbandStackSize(item, item1, short_side, long_side, stack_height)
		return { paperband, deliveryDetail }
	}

	setCalculatePaperbandStackSize(item, item1, short_side, long_side, stack_height) {
		let stack_size = this.getPaperbandStackSize(item1.info.thickness, short_side, long_side, stack_height)
		let stack_weight = item.weight.weight * item1.info.qty_per_paperband
		item1.info.stack_size = stack_size
		item1.info.stack_weight = stack_weight
	}

	getPaperbandStackSize(thickness = 0, short_side = 0, long_side = 0, stack_height = 0) {
		let stack_size = [
			mm2inch(short_side + 2 * (thickness)),
			mm2inch(long_side),
			mm2inch(stack_height + 3 * (thickness)),
			short_side + 2 * (thickness),
			long_side,
			stack_height + 3 * (thickness)
		]

		return stack_size
	}

	setCarton(index, obj, fIndex = 0) {
		let item = this.mainData.component1[index]

		if (!obj) {
			// * remove carton
			item.packing[fIndex].forEach((item1, index1) => {
				if (item1.name == 'carton') {
					item.packing[fIndex].splice(index1, 1)
				}
			})

			return false
		}

		let carton_check = this.getPackingObj(item, 'carton', fIndex)
		if (carton_check == null) {
			// * add carton
			item.packing[fIndex].push({
				type_id: 11,
				type: 'packing',
				process_id: 27,
				name: 'carton',
				info: {},
				line: [],
				detail: []
			})
		}

		item.packing[fIndex].forEach((item1) => {
			if (item1.name == 'carton') {
				item1.info = {
					inner_size: obj.inner_size,
					layer_carton: obj.layer_carton,
					corrugated: obj.corrugated,
					bulk: { unit: obj.unit },
					custom_info: obj?.custom || null
				}
				item1.line = []
				item1.detail = []
			}
		})
	}

	getPackingObj(item, packing_type, fIndex = 0) {
		const packing = item.packing[fIndex].filter((item1) => {
			return item1.name == packing_type
		})
		if (packing.length == 0) {
			return null
		} else {
			return packing[0]
		}

	}

	//? TEST --------------------------------------------
	setCalculateCartonCost(item, is_reCalc, compIndex, fIndex = 0) {
		const isSplitDelivery = getIsSplitDelivery()
		const isDiffPacking = getIsDifferentPacking()
		const {
			carton_price: default_carton_price,
			corrugated_marking,
			markup_price: default_carton_markup_price = 0,
			carton_printing_price = 3,
		} = defaultData.carton_info || {}

		const {
			packing_marking = 0
		} = defaultData || {}

		item.packing[fIndex].forEach((item1) => {
			if (item1.name !== 'carton') return
			const {
				is_custom_inner_size = false,
				is_carton_printing = false,
				is_custom_qty_per_carton = false,
				layout: custom_layout = [],
				carton_layer = 1,
			} = item1?.info?.custom_info || {}

			let bulk_unit = item1.info.bulk.unit

			var packing_size = this.getPackingSize(item) //* 5,8

			switch (bulk_unit) {
				case 'piece':
					var bulk_size = [
						packing_size[0],
						packing_size[1],
						item.thickness.inch.packing_thickness,
						packing_size[2],
						packing_size[3],
						item.thickness.mm.packing_thickness
					]
					var unit_info = ""
					break
				case 'paperband':
					if (packing_size[2] < packing_size[3]) {
						var short_side = packing_size[2], long_side = packing_size[3]
					} else {
						var short_side = packing_size[3], long_side = packing_size[2]
					}

					var unit_info = this.getPackingObj(item, 'paperband', fIndex)

					let stack_height = unit_info.info.qty_per_paperband * item.thickness.mm.packing_thickness

					var bulk_size = this.getPaperbandStackSize(unit_info.info.thickness, short_side, long_side, stack_height)
					break;
				case 'kraftwrap':
					var bulk_size = this.getPackingObj(item, 'kraftwrap', fIndex).info.outer_size
					var unit_info = this.getPackingObj(item, 'kraftwrap', fIndex)
					break
			}

			let inner_size = ""

			if (is_custom_inner_size) {
				inner_size = item1.info.inner_size

				var customLayout = {
					is_custom_inner_size,
				}
			}

			if (is_custom_qty_per_carton) {
				var customLayout = {
					is_custom_inner_size,
					layout: custom_layout,
					layer: carton_layer
				}
			}

			item1.info.bulk = this.getBulkCartonObj(item, bulk_unit, unit_info, bulk_size)

			//* Calc. carton layout , size
			var carton_info = this.setCalculateCarton(item1.info.bulk, inner_size, customLayout)

			item1.info.size = {
				cube: carton_info.size.cube
			}

			// * For default size
			item1.info.dummy_size = carton_info.size

			if (is_custom_inner_size) {
				item1.info.size.inner_size = [
					parseFloat((item1.info.inner_size[0]).toFixed(3)),
					parseFloat((item1.info.inner_size[1]).toFixed(3)),
					parseFloat((item1.info.inner_size[2]).toFixed(3)),
					parseFloat((item1.info.inner_size[0] * 25.4).toFixed(3)),
					parseFloat((item1.info.inner_size[1] * 25.4).toFixed(3)),
					parseFloat((item1.info.inner_size[2] * 25.4).toFixed(3)),
				]
				item1.info.size.outer_size = [
					item1.info.size.inner_size[0] + 0.5,
					item1.info.size.inner_size[1] + 0.5,
					item1.info.size.inner_size[2] + 0.5,
					parseFloat((item1.info.size.inner_size[3] + (0.5 * 25.4)).toFixed(3)),
					parseFloat((item1.info.size.inner_size[4] + (0.5 * 25.4)).toFixed(3)),
					parseFloat((item1.info.size.inner_size[5] + (0.5 * 25.4)).toFixed(3)),
				]

			} else {
				item1.info.size.inner_size = item1.info.dummy_size.inner_size
				item1.info.size.outer_size = item1.info.dummy_size.outer_size
			}

			item1.info.carton = carton_info.carton
			item1.info.net_weight = parseFloat((item1.info.carton.weight_per_layer * item1.info.carton.layer_per_carton).toFixed(2))
			item1.info.gross_weight = item1.info.net_weight + 1

			var corrugated_board = this.setCalculateCorrugatedcarton(item1.info.size.inner_size)
			item1.info.corrugated = { ...item1.info.corrugated, ...corrugated_board }
			item1.info.corrugated.price_inch = parseFloat((item1.info.corrugated.price / 144).toFixed(4))
			item1.info.corrugated.board_price_per_carton = parseFloat((item1.info.corrugated.price * item1.info.corrugated.area_corrugated).toFixed(2))

			//* price after markup
			item1.info.corrugated.board_price_per_carton = parseFloat((item1.info.corrugated.board_price_per_carton * (1 + (corrugated_marking / 100))).toFixed(2))

			item1.line = []
			let unit_price = parseFloat(((default_carton_price + item1.info.corrugated.board_price_per_carton) + default_carton_markup_price).toFixed(2))

			if (is_carton_printing) {
				unit_price += carton_printing_price //* THB พิมพ์บน carton
			}

			this.mainData.qty.totalqty.forEach((item2) => {

				let process_unit_price = unit_price
				const qty = Math.ceil(item2 / item1.info.carton.qty_per_carton)

				if (is_carton_printing) {
					process_unit_price += Math.ceil(1000 / qty)
				}

				const totalPrice = parseFloat((qty * process_unit_price) * (1 + (packing_marking / 100)).toFixed(2))

				item1.line.push({
					qty: qty,
					unit_price: process_unit_price,
					price: totalPrice
				})
			})

			//* NEW  Calc.
			const compDeliveryInfo = this.mainData?.delivery?.filter(obj => obj.detail.some(detail => {
				if (isDiffPacking) {
					if (isSplitDelivery) {
						return detail.componentId == compIndex && detail.fIndex == fIndex
					} else {
						return detail.componentId == compIndex
					}
				} else {
					return detail.componentId == compIndex
				}
			}))

			// ****** Calc. price section *********
			// * new this for <tr></tr>
			item1.detail = compDeliveryInfo?.map(({ round, detail }) => {
				//* คำนวณ cost แบ่งส่งแต่ละรอบ

				let qtyDetail = []
				//* this for <td></td> [1500], [1500,5000,20000]
				if (this.mainData.qty.totalqty.length > 1) {
					// * จำนวน qty มากกว่า 1
					this.mainData.qty.totalqty.forEach((objQty, index) => {
						const { main, runon } = this.mainData.qty || {}

						let process_unit_price = unit_price
						const qty = main[index] + runon[index]
						// * หาจำนวน Pack
						const packQty = Math.ceil((qty / item1.info.carton.qty_per_carton))

						if (is_carton_printing) {
							process_unit_price += Math.ceil(1000 / packQty)
						}

						const totalPrice = parseFloat(((packQty * process_unit_price) * (1 + (packing_marking / 100))).toFixed(2))

						qtyDetail.push({
							qty: packQty,
							unit_price: process_unit_price,
							price: totalPrice,
							compQty: qty,
							gross_weight: item1.info.gross_weight,
							total_weight: item1.info.gross_weight * packQty
						})
					})
				} else {
					// * หาจำนวน Pack
					const { qtyArr, totalQty, packArr, packQty } = this.setCalculatePackingQty(compIndex, detail, item1.info.carton.qty_per_carton, fIndex)

					let process_unit_price = unit_price
					if (is_carton_printing) {
						process_unit_price += Math.ceil(1000 / packQty)
					}

					const totalPrice = parseFloat(((packQty * process_unit_price) * (1 + (packing_marking / 100))).toFixed(2))

					qtyDetail.push({
						qty: packQty,
						unit_price: process_unit_price,
						price: totalPrice,
						compQty: totalQty,
						gross_weight: item1.info.gross_weight,
						total_weight: item1.info.gross_weight * packQty,
						packArr,
						qtyArr
					})
				}

				return {
					roundId: round,
					// unit_price,
					detail: qtyDetail,
				}
			})
		})
	}
	//? TEST --------------------------------------------

	getBulkCartonObj(comp_obj, unit, unit_info, bulk_size) {
		switch (unit) {
			case 'piece':
				var bulk = {
					unit: unit,
					bulk_size: bulk_size,
					qty_per_bulk: 1,
					weight_per_bulk: comp_obj.weight.weight
				}
				break
			case 'paperband':
				var bulk = {
					unit: unit,
					bulk_size: bulk_size,
					qty_per_bulk: unit_info.info.qty_per_paperband,
					weight_per_bulk: comp_obj.weight.weight * unit_info.info.qty_per_paperband,
				}
				break
			case 'kraftwrap':
				var bulk = {
					unit: unit,
					bulk_size: bulk_size,
					qty_per_bulk: unit_info.info.qty_per_pack,
					weight_per_bulk: unit_info.info.gross_weight
				}
				break
		}

		return bulk
	}

	setInnerSizeCarton(item, inner, fIndex = 0) {
		const { carton_price: default_carton_price } = defaultData.carton_info || {}

		var inner_size = [
			parseFloat((inner[0]).toFixed(2)),
			parseFloat((inner[1]).toFixed(2)),
			parseFloat((inner[2]).toFixed(2)),
			parseFloat((inner[0] * 25.4).toFixed(2)),
			parseFloat((inner[1] * 25.4).toFixed(2)),
			parseFloat((inner[2] * 25.4).toFixed(2))
		]

		var outer_size = [
			parseFloat((inner[0] + 0.5).toFixed(2)),
			parseFloat((inner[1] + 0.5).toFixed(2)),
			parseFloat((inner[2] + 0.5).toFixed(2)),
			parseFloat((inner[0] + (0.5 * 25.4)).toFixed(2)),
			parseFloat((inner[1] + (0.5 * 25.4)).toFixed(2)),
			parseFloat((inner[2] + (0.5 * 25.4)).toFixed(2))
		]

		item.packing[fIndex].forEach((packing, index1) => {

			if (packing.name == 'carton') {

				packing.info.inner_size = inner_size
				packing.info.outer_size = outer_size

				var corrugated_board = this.setCalculateCorrugatedcarton(packing.info.inner_size)
				packing.info.corrugated = { ...packing.info.corrugated, ...corrugated_board }
				packing.info.corrugated.price_inch = parseFloat((packing.info.corrugated.price / 144).toFixed(4))
				packing.info.corrugated.board_price_per_carton = parseFloat((packing.info.corrugated.price * packing.info.corrugated.area_corrugated).toFixed(2))
				packing.line = []
				//! item.qty.totalqty.forEach((item2,index2)=>{
				this.mainData.qty.totalqty.forEach((item2, index2) => {
					const
						unit_price = parseFloat(default_carton_price + packing.info.corrugated.board_price_per_carton).toFixed(2),
						qty = Math.ceil(item2 / packing.info.carton.qty_per_carton)

					packing.line.push({
						qty,
						unit_price: parseFloat(unit_price),
						price: parseFloat((qty * parseFloat((default_carton_price + packing.info.corrugated.board_price_per_carton).toFixed(2))).toFixed(2))
					})
				})
			}

		})
	}

	getRearrangeBulkSize(bulk_size) {
		if (bulk_size[0] > bulk_size[1]) {
			var lay_bulk_size = [
				bulk_size[0],
				bulk_size[2],
				bulk_size[1],
				bulk_size[3],
				bulk_size[5],
				bulk_size[4]
			]
		} else {
			var lay_bulk_size = [
				bulk_size[1],
				bulk_size[2],
				bulk_size[0],
				bulk_size[4],
				bulk_size[5],
				bulk_size[3]
			]
		}
		return lay_bulk_size
	}

	getMinCartonSize(bulk_size, carton_size) {
		var max = Math.max(bulk_size[0], bulk_size[1]),
			min = Math.min(bulk_size[0], bulk_size[1])

		var min_w = carton_size[0],
			min_l = carton_size[1]

		if (carton_size[0] < min && carton_size[1] < min) { // 1
			min_w = min
			min_l = max
		} else if (carton_size[0] < min && carton_size[1] >= min && carton_size[1] < max) { // 2
			min_w = max
		} else if (carton_size[0] < min && carton_size[1] >= max) { // 3
			min_w = min
		} else if (carton_size[0] >= min && carton_size[0] < max && carton_size[1] < max) { // 4
			min_l = max
		} else if (carton_size[0] >= max && carton_size[1] < min) { // 5
			min_l = min
		}
		return [min_w, min_l]
	}

	setCalculateCarton(bulk_obj, inner_size, customLayout = null) {

		const { limit_carton_weight: default_limit_carton_weight } = defaultData.carton_info || {}
		let limit_carton_weight = customLayout?.is_custom_inner_size ? 720 : default_limit_carton_weight

		var lay_bulk_size = this.getRearrangeBulkSize(bulk_obj.bulk_size)
		if (inner_size == "") {
			var default_carton = [11, 17]
			var carton_lay_height = ""
			var carton_lay_size = this.getMinCartonSize(lay_bulk_size, default_carton)
		} else {
			var carton_lay_size = [
				parseFloat((inner_size[0] - 0.75).toFixed(3)),
				parseFloat((inner_size[1] - 0.75).toFixed(3)),
				parseFloat((inner_size[2] - 0.75).toFixed(3))
			]
			var carton_lay_height = parseFloat((inner_size[2] - 0.75).toFixed(3))
		}

		var laying = this.setCalculateBoxLayinginCarton(carton_lay_size, lay_bulk_size, customLayout?.layout)
		var bulk_per_layer = laying.qty

		var weight_per_layer = bulk_per_layer * bulk_obj.weight_per_bulk

		if (customLayout?.layer) {
			layer_per_carton = customLayout?.layer || 1

			total_weight = weight_per_layer * layer_per_carton
			total_height = layer_height * layer_per_carton
		} else {
			if (carton_lay_height == "") {
				if (Math.floor(limit_carton_weight / weight_per_layer) == 0) {
					var layer_per_carton = 1
				} else {
					var layer_per_carton = Math.floor(limit_carton_weight / weight_per_layer)
					console.log("layer case 1", layer_per_carton, limit_carton_weight)
				}

			} else {
				var layer_height = lay_bulk_size[2]
				var layer_per_carton = 1
				var total_weight = weight_per_layer * layer_per_carton
				var total_height = layer_height * layer_per_carton
				while (total_height <= carton_lay_height && total_weight <= limit_carton_weight) {
					layer_per_carton++
					total_weight = weight_per_layer * layer_per_carton
					total_height = layer_height * layer_per_carton
				}

				if (total_height > carton_lay_height || total_weight > limit_carton_weight) {
					layer_per_carton = layer_per_carton - 1
				}

				if (layer_per_carton == 0) {
					layer_per_carton = 1
				}

				total_weight = weight_per_layer * layer_per_carton
				total_height = layer_height * layer_per_carton
			}

		}

		var cube_size = [
			parseFloat((laying.lay_size[0]).toFixed(2)),
			parseFloat((laying.lay_size[1]).toFixed(2)),
			parseFloat(layer_per_carton * lay_bulk_size[2]),
			parseFloat((laying.lay_size[0] * 25.4).toFixed(2)),
			parseFloat((laying.lay_size[1] * 25.4).toFixed(2)),
			parseFloat(layer_per_carton * lay_bulk_size[5]),
		]

		var carton_info = {
			carton: {
				layer_per_carton: layer_per_carton,
				qty_per_layer: bulk_per_layer * bulk_obj.qty_per_bulk,
				bulk_per_layer: bulk_per_layer,
				num_layout: laying.layout,
				weight_per_layer: parseFloat(weight_per_layer.toFixed(2)),
				qty_per_carton: parseInt(bulk_per_layer * bulk_obj.qty_per_bulk * layer_per_carton)
			},
			size: {
				cube: cube_size,
				inner_size: [
					parseFloat((cube_size[0] + 0.75).toFixed(3)),
					parseFloat((cube_size[1] + 0.75).toFixed(3)),
					parseFloat((cube_size[2] + 0.75).toFixed(3)),
					parseFloat((cube_size[3] + (0.75 * 25.4)).toFixed(3)),
					parseFloat((cube_size[4] + (0.75 * 25.4)).toFixed(3)),
					parseFloat((cube_size[5] + (0.75 * 25.4)).toFixed(3)),
				],
				outer_size: [
					parseFloat((cube_size[0] + 0.75 + 0.5).toFixed(3)),
					parseFloat((cube_size[1] + 0.75 + 0.5).toFixed(3)),
					parseFloat((cube_size[2] + 0.75 + 0.5).toFixed(3)),
					parseFloat((cube_size[3] + (0.75 + 0.5 * 25.4)).toFixed(3)),
					parseFloat((cube_size[4] + (0.75 + 0.5 * 25.4)).toFixed(3)),
					parseFloat((cube_size[5] + (0.75 + 0.5 * 25.4)).toFixed(3)),
				]
			}
		}

		return carton_info
	}


	setCalculateCorrugatedcarton(inner_size) {
		//ตาม excel คิดพื้นที่ลูกฟูกที่ใช้ทำกล่อง
		const w_mm_side = parseFloat(((inner_size[2] * 25.4 + 8) + (inner_size[0] * 25.4 + 8)).toFixed(3))
		const l_mm_side = parseFloat(((2 * inner_size[1] * 25.4) + (2 * inner_size[0] * 25.4) + 40 + 32).toFixed(3))

		const w_inch_side = mm2inch(w_mm_side, 3)
		const l_inch_side = mm2inch(l_mm_side, 3)

		const area_corrugated = parseFloat((w_inch_side * l_inch_side / 144).toFixed(3))
		const length_metre = parseFloat((l_inch_side / 1000).toFixed(2))

		const corrugated_board = {
			size: [
				w_mm_side,
				l_mm_side,
				w_inch_side,
				l_inch_side
			],
			area_corrugated,
			length_metre
		}
		return corrugated_board
	}

	setPallet(index, obj, fIndex = 0) {
		var item = this.mainData.component1[index]
		if (obj != "") {
			const check_pallet = this.getPackingObj(item, 'pallet', fIndex)
			if (!check_pallet) {
				// * add pallet
				item.packing[fIndex].push({
					type_id: 11,
					type: 'packing',
					process_id: 28,
					name: 'pallet',
					info: {},
					line: [],
					detail: []
				})
			}
			item.packing[fIndex].forEach((item1) => {
				if (item1.name == 'pallet') {
					item1.info = {
						delivery_id: obj.delivery_id,
						pallet_id: obj.pallet_id,
						is_mif_pallet: obj.is_mif_pallet
					}
					item1.line = [],
						item1.detail = []
				}
			})
		} else {
			//* remove pallet
			item.packing[fIndex].forEach((item1, index1) => {
				if (item1.name == 'pallet') {
					item.packing[fIndex].splice(index1, 1)
				}
			})
		}
	}

	setCalculatePalletCost(item, compIndex, fIndex = 0) {
		const {
			packing_marking = 0,
			pallet_info: {
				mif_unit_price = 0
			}
		} = defaultData || {}

		const isSplitDelivery = getIsSplitDelivery()
		const isDiffPacking = getIsDifferentPacking()
		var check_paperband = this.getPackingObj(item, 'paperband', fIndex)
		var check_kraftwrap = this.getPackingObj(item, 'kraftwrap', fIndex)
		var check_carton = this.getPackingObj(item, 'carton', fIndex)
		let unit_price = 0

		//* find unit
		if (check_paperband == null && check_kraftwrap == null && check_carton == null) {
			var unit = 'pieces'
		} else if (check_paperband != null && check_kraftwrap != null && check_carton == null) {
			var unit = 'kraftwrap'
			var kraftwrap_item = check_kraftwrap
		} else if (check_paperband != null && check_kraftwrap == null && check_carton != null) {
			var unit = 'carton'
			var carton_item = check_carton
		} else if (check_kraftwrap != null && check_carton == null) {
			var unit = 'kraftwrap'
			var kraftwrap_item = check_kraftwrap
		} else {
			var unit = 'carton'
			var carton_item = check_carton
		}

		item.packing[fIndex].forEach((item1,) => {
			if (item1.name !== 'pallet') return

			var pallet_size = defaultData.pallet.filter((item2) => {
				return item2.id == item1.info.pallet_id
			})
			var delivery_type = defaultData.pallet_delivery.filter((item2) => {
				return item2.id == item1.info.delivery_id
			})

			unit_price = delivery_type[0].pallet_price

			if (item1?.info?.is_mif_pallet) {
				unit_price = mif_unit_price
			}

			item1.info.pallet_size = pallet_size[0].size
			item1.info.delivery_type = delivery_type[0].type
			item1.info.pallet_price = unit_price


			switch (unit) {
				case 'pieces':
					var bulk_size = this.getPackingSize(item)
					var bulk_height = [item.thickness.inch.packing_thickness, item.thickness.mm.packing_thickness]
					item1.info.bulk_size = [bulk_size[0], bulk_size[1], bulk_height[0], bulk_size[2], bulk_size[3], bulk_height[1]]
					item1.info.laying = this.setCalculateBoxLayingPallet(item1.info.pallet_size, bulk_size)
					item1.info.weight_per_layer = parseFloat((item1.info.laying.qty_layer * item.weight.weight).toFixed(2))
					var { layer_per_pallet, pallet_weight, pallet_height } = this.setCalculatePalletLayer(item1.info.weight_per_layer, bulk_height[0])
					item1.info.layer_per_pallet = layer_per_pallet
					item1.info.pallet_weight = pallet_weight
					item1.info.pallet_height = pallet_height
					item1.info.bulk_qty_pallet = item1.info.laying.qty_layer * item1.info.layer_per_pallet
					item1.info.qty_pallet = item1.info.bulk_qty_pallet
					break
				case 'kraftwrap':
					item1.info.bulk_size = kraftwrap_item.info.outer_size
					item1.info.laying = this.setCalculateBoxLayingPallet(item1.info.pallet_size, item1.info.bulk_size)
					item1.info.weight_per_layer = parseFloat((item1.info.laying.qty_layer * kraftwrap_item.info.gross_weight).toFixed(2))
					var { layer_per_pallet, pallet_weight, pallet_height } = this.setCalculatePalletLayer(item1.info.weight_per_layer, item1.info.bulk_size[2])
					item1.info.layer_per_pallet = layer_per_pallet
					item1.info.pallet_weight = pallet_weight
					item1.info.pallet_height = pallet_height
					item1.info.bulk_qty_pallet = item1.info.laying.qty_layer * item1.info.layer_per_pallet
					item1.info.qty_pallet = item1.info.bulk_qty_pallet * kraftwrap_item.info.qty_per_pack
					break
				case 'carton':
					item1.info.bulk_size = carton_item.info.size.outer_size
					item1.info.laying = this.setCalculateBoxLayingPallet(item1.info.pallet_size, item1.info.bulk_size)
					item1.info.weight_per_layer = parseFloat((item1.info.laying.qty_layer * carton_item.info.gross_weight).toFixed(2))
					var { layer_per_pallet, pallet_weight, pallet_height } = this.setCalculatePalletLayer(item1.info.weight_per_layer, item1.info.bulk_size[2])
					item1.info.layer_per_pallet = layer_per_pallet
					item1.info.pallet_weight = pallet_weight
					item1.info.pallet_height = pallet_height
					item1.info.bulk_qty_pallet = item1.info.laying.qty_layer * item1.info.layer_per_pallet
					item1.info.qty_pallet = item1.info.bulk_qty_pallet * carton_item.info.carton.qty_per_carton
					break
			}

			item1.line = []
			this.mainData.qty.totalqty.forEach((item2) => {
				item1.line.push({
					qty: Math.ceil(item2 / item1.info.qty_pallet),
					unit_price: unit_price,
					price: parseFloat(((Math.ceil(item2 / item1.info.qty_pallet) * unit_price)).toFixed(2))
				})
			})


			const compDeliveryInfo = this.mainData?.delivery?.filter(obj => obj.detail.some(detail => {
				if (isDiffPacking) {
					if (isSplitDelivery) {
						return detail.componentId == compIndex && detail.fIndex == fIndex
					} else {
						return detail.componentId == compIndex
					}
				} else {
					return detail.componentId == compIndex
				}
			}))


			const palletDetail = compDeliveryInfo?.map(({ round, detail }) => {
				//* คำนวณ cost แบ่งส่งแต่ละรอบ

				let qtyDetail = []
				//* this for <td></td> [1500], [1500,5000,20000]
				if (this.mainData.qty.totalqty.length > 1) {
					// * จำนวน qty มากกว่า 1
					this.mainData.qty.totalqty.forEach((objQty, index) => {
						const { main, runon } = this.mainData.qty || {}
						const qty = main[index] + runon[index]
						// * หาจำนวน Pack
						const packQty = Math.ceil((qty / item1.info.qty_pallet))
						const totalPrice = parseFloat(((packQty * unit_price) * (1 + (packing_marking / 100))).toFixed(2))

						qtyDetail.push({
							qty: packQty,
							unit_price,
							price: totalPrice,
							compQty: qty,
							gross_weight: item1.info.pallet_weight,
							total_weight: item1.info.pallet_weight * packQty
						})
					})
				} else {
					// * จำนวน qty = 1
					// * หาจำนวน qty. ของ comp. นี้ ในแต่ละรอบแบ่งส่ง
					// const qty = detail.reduce((prev, curr) => prev += curr.componentId == compIndex ? curr.qty : 0, 0)
					// * หาจำนวน Pack
					// const packQty = Math.ceil(qty / item1.info.qty_pallet)
					const { qtyArr, totalQty, packArr, packQty } = this.setCalculatePackingQty(compIndex, detail, item1.info.qty_pallet, fIndex)
					const totalPrice = parseFloat(((packQty * unit_price) * (1 + (packing_marking / 100))).toFixed(2))

					qtyDetail.push({
						qty: packQty,
						unit_price,
						price: totalPrice,
						compQty: totalQty,
						gross_weight: item1.info.pallet_weight,
						total_weight: item1.info.pallet_weight * packQty,
						packArr,
						qtyArr,
						packQty
					})
				}

				return {
					roundId: round,
					unit_price,
					detail: qtyDetail,
				}
			})
			item1.detail = palletDetail

		})
	}

	setCalculatePalletLayer(weight_layer, height_layer) {
		const {
			limit_pallet_weight,
			empty_pallet_weight,
			limit_pallet_height
		} = defaultData?.pallet_info || {}
		//เงื่อนไขจำกัดด้วยน้ำหรักหรือความสูง
		var
			limit_pack_weight = limit_pallet_weight - empty_pallet_weight,
			total_weight = 0,
			total_height = 0,
			n = 0

		do {
			total_weight += weight_layer
			total_height += height_layer
			n += 1
		}
		while (total_weight <= limit_pack_weight && total_height <= limit_pallet_height)

		if (total_weight > limit_pack_weight || total_height > limit_pallet_height) {
			total_weight -= weight_layer
			total_height -= height_layer
			n -= 1
		}

		if (n == 0) {
			n = 1
			total_weight = weight_layer,
				total_height = height_layer
		}

		var obj = {
			layer_per_pallet: n,
			pallet_weight: parseFloat(total_weight.toFixed(2)),
			pallet_height: parseFloat(total_height.toFixed(2))
		}
		return obj
	}

	setKraftwrap(index, obj, fIndex = 0) {
		var item = this.mainData.component1[index]
		const { kraftwrap_price: default_kraftwrap_price } = defaultData.kraftwrap_info

		if (obj != "") {
			var isExistKraftwrap = this.getPackingObj(item, 'kraftwrap', fIndex)

			if (isExistKraftwrap == null) {
				// * if not have packing = kraftwrap add new kraftwrap
				item.packing[fIndex].push({
					type: 'packing',
					name: 'kraftwrap',
					type_id: 11,
					process_id: 26,
					info: {},
					line: [],
					detail: []
				})
			}

			item.packing[fIndex].forEach((item1) => {
				if (item1.name == 'kraftwrap') {
					item1.info = {
						unit_price: default_kraftwrap_price,
						num_side: obj.num_side,
						cube_size: obj.layKraftwrap,
						bulk_size: obj.bulk_size,
						num_bulk_per_layer: obj.num_side[0] * obj.num_side[1],
						qty_per_kraftwrap: obj.qty_per_kraftwrap,
						is_editKraftwrapQty: obj?.is_editKraftwrapQty || false
					}
					item1.line = []
					item1.detail = []
				}
			})

		} else {
			// * if obj = "" remove packing name = kraftwrap
			item.packing[fIndex].forEach((item1, index1) => {
				if (item1.name == 'kraftwrap') {
					item.packing[fIndex].splice(index1, 1)
				}
			})
		}
	}

	setCalculateKraftwrapCost2(item, compIndex, fIndex = 0) {
		const isSplitDelivery = getIsSplitDelivery()
		const isDiffPacking = getIsDifferentPacking()
		const {
			thickness: {
				mm: { packing_thickness: packing_thickness_mm },
				inch: { packing_thickness: packing_thickness_inch }
			},
			packing,
			weight: { weight }
		} = item || {}

		const {
			kraftwrap_thickness: default_kraftwrap_thickness
		} = defaultData?.kraftwrap_info || {}

		const {
			packing_marking = 0
		} = defaultData || {}

		const bulk_height = [parseFloat((packing_thickness_inch).toFixed(5)), parseFloat((packing_thickness_mm).toFixed(5))]

		item.packing[fIndex] = packing[fIndex].map((objPacking) => {
			if (objPacking.name !== 'kraftwrap') {
				return objPacking
			}

			const {
				info: { num_bulk_per_layer, qty_per_kraftwrap, cube_size, unit_price }
			} = objPacking || {}

			const obj = {
				num_per_layer: num_bulk_per_layer,
				weight_per_layer: parseFloat((weight * num_bulk_per_layer).toFixed(6)),
				qty_per_kraftwrap: qty_per_kraftwrap,
				cube_size: cube_size,
				layer_per_pack: 1,
				qty_per_pack: 0,
				bulk_height: bulk_height,
				net_weight: 0,
				gross_weight: 0,
				unit_price,
				inner_size: [],
				outer_size: []
			}

			obj.layer_per_pack = this.setCalculateKraftwrapWeight(obj.weight_per_layer, obj.bulk_height, obj.qty_per_kraftwrap, weight)

			if (obj.qty_per_kraftwrap == "") {
				obj.qty_per_pack = obj.layer_per_pack * obj.num_per_layer
				obj.net_weight = parseFloat((obj.weight_per_layer * obj.layer_per_pack).toFixed(2))
			} else {
				obj.qty_per_pack = obj.qty_per_kraftwrap
				obj.net_weight = parseFloat((weight * obj.qty_per_pack).toFixed(2))
			}

			obj.gross_weight = obj.net_weight

			//* set inner_size
			obj.inner_size = [
				obj.cube_size[0],
				obj.cube_size[1],
				parseFloat((obj.bulk_height[0] * obj.layer_per_pack).toFixed(2)),
				obj.cube_size[2],
				obj.cube_size[3],
				obj.bulk_height[1] * obj.layer_per_pack
			]
			const doubleThickness = default_kraftwrap_thickness * 2
			//* set outer_size
			obj.outer_size = [
				parseFloat((obj.cube_size[0] + mm2inch(doubleThickness)).toFixed(2)),
				parseFloat((obj.cube_size[1] + mm2inch(doubleThickness)).toFixed(2)),
				parseFloat((obj.bulk_height[0] * obj.layer_per_pack + mm2inch(doubleThickness)).toFixed(2)),
				parseFloat((obj.cube_size[2] + doubleThickness).toFixed(2)),
				parseFloat((obj.cube_size[3] + doubleThickness).toFixed(2)),
				parseFloat((obj.bulk_height[1] * obj.layer_per_pack + doubleThickness).toFixed(2))
			]

			//* find country that has comp.
			const compDeliveryInfo = this.mainData?.delivery?.filter(obj => obj.detail.some(detail => {
				if (isDiffPacking) {
					if (isSplitDelivery) {
						return detail.componentId == compIndex && detail.fIndex == fIndex
					} else {
						return detail.componentId == compIndex
					}
				} else {
					return detail.componentId == compIndex
				}
			}))

			// *----------------------- Calc. price section -----------------------*
			// * new this for <tr></tr>
			const kraftwrapDetail = compDeliveryInfo?.map(({ round, detail }) => {
				//* คำนวณ cost แบ่งส่งแต่ละรอบ

				let qtyDetail = []
				//* this for <td></td> [1500], [1500,5000,20000]
				if (this.mainData.qty.totalqty.length > 1) {
					//* ไม่แบ่งส่ง , และไม่ใช่งานหลาย F
					// * จำนวน qty มากกว่า 1
					this.mainData.qty.totalqty.forEach((objQty, index) => {
						const { main, runon } = this.mainData.qty || {}
						const qty = main[index] + runon[index]
						// * หาจำนวน Pack // qty / qty_per_pack = kraftwrap qty.
						const packQty = Math.ceil((qty / obj.qty_per_pack))

						const total_price = parseFloat(((packQty * obj.unit_price) * (1 + (packing_marking / 100))).toFixed(2))

						qtyDetail.push({
							qty: packQty,
							unit_price,
							price: total_price,
							compQty: qty,
							gross_weight: obj.gross_weight,
							total_weight: obj.gross_weight * packQty
						})
					})
				} else {
					const { qtyArr, totalQty, packArr, packQty } = this.setCalculatePackingQty(compIndex, detail, obj.qty_per_pack, fIndex)

					const total_price = parseFloat(((packQty * obj.unit_price) * (1 + (packing_marking / 100))).toFixed(2))

					qtyDetail.push({
						qty: packQty,
						unit_price,
						price: total_price,
						compQty: totalQty,
						gross_weight: obj.gross_weight,
						total_weight: obj.gross_weight * packQty,
						packArr,
						qtyArr,
						packQty
					})
				}

				return {
					roundId: round,
					unit_price,
					detail: qtyDetail,
				}
			})

			// * old
			let kraftwrapLine = ''
			//* multiple F - Different Packaging
			kraftwrapLine = this.mainData.qty.totalqty.map(qty => {

				let thisQty = Math.ceil((qty / obj.qty_per_pack))

				const total_price = parseFloat(((thisQty * unit_price) * (1 + (packing_marking / 100))).toFixed(2))

				return {
					qty: thisQty,
					unit_price,
					price: total_price
				}
			})

			// ** set value / obj to kraftwrap packing
			return {
				...objPacking,
				info: {
					...objPacking.info,
					...obj
				},
				detail: kraftwrapDetail,
				line: kraftwrapLine
			}
		})

	}

	setCalculateKraftwrapWeight(weight_per_layer, height, qty_per_kraftwrap, weight_per_qty) {
		// obj.weight_per_layer, bulk_height, obj.qty_per_kraftwrap, weight
		const {
			kraftwrap_info: { limit_kraftwrap_weight: default_limit_kraftwrap_weight },
			a3_size: default_a3_size
		} = defaultData

		let layer_per_pack = 1,
			total_weight = 0,
			total_height = 0

		if (qty_per_kraftwrap == "") {
			if (Math.floor(default_limit_kraftwrap_weight / weight_per_layer) !== 0) {
				do {
					total_weight = weight_per_layer * layer_per_pack
					total_height = layer_per_pack * height[0]
					layer_per_pack++
				} while (total_weight <= default_limit_kraftwrap_weight
					&& total_height <= default_a3_size[1]
				)

				if (
					total_weight <= default_limit_kraftwrap_weight ||
					total_height <= default_a3_size[1]
				) {
					layer_per_pack -= 1
				}

				//pack เต็ม 5
				const full_pack = Math.ceil(layer_per_pack / 10) * 10

				//* หักลบ layer ส่วนเกินจาก limit / pack เต็ม 5
				if (full_pack !== layer_per_pack) {
					const diff_layer = full_pack - layer_per_pack
					layer_per_pack = diff_layer <= 5 ? full_pack - 5 : full_pack - 10
				}

				if (layer_per_pack <= 0) {
					layer_per_pack = 1
				}
			}
		} else {
			layer_per_pack = Math.ceil(weight_per_qty * qty_per_kraftwrap / weight_per_layer)
		}

		return layer_per_pack
	}



	setShrinkwrap(check) {
		if (check) {
			var shrinkwrap = this.mainData.process.filter((item, index) => {
				return item.type == 'shrinkwrap'
			})
			if (shrinkwrap.length == 0) {
				this.mainData.process.push({
					type: 'shrinkwrap',
					info: {},
					line: []
				})
			}

			this.mainData.process.forEach((item, index) => {
				if (item.type == 'shrinkwrap') {
					item.line = []
				}
			})
		} else {
			this.mainData.process.forEach((item, index) => {
				if (item.type == 'shrinkwrap') {
					this.mainData.process.splice(index, 1)
				}
			})
		}
	}

	setCalculateShrinkwrapCost(item) {
		this.mainData.process.forEach((item, index) => {
			if (item.type == 'shrinkwrap') {
				item.line = []
				var qty = []
				this.mainData.component1.forEach((item1, index1) => {
					item1.qty.totalqty.forEach((item2, index2) => {
						if (!qty[index2]) {
							qty[index2] = 0
						}
						qty[index2] += item2
					})
				})
				qty.forEach((item1, index1) => {
					var shrinkwrap_price = 0.1 //fix ค่าไว้ก่อน
					item.line.push({
						qty: item1,
						unit_price: shrinkwrap_price,
						price: parseFloat((item1 * shrinkwrap_price).toFixed(2))
					})
				})
			}
		})
	}

	setBag(check) {
		if (check) {
			var bag = this.mainData.process.filter((item, index) => {
				return item.type == 'bag'
			})
			if (bag.length == 0) {
				this.mainData.process.push({
					type: 'bag',
					info: {},
					line: []
				})
			}
			this.mainData.process.forEach((item, index) => {
				if (item.type == 'bag') {
					item.line = []
				}
			})
		} else {
			this.mainData.process.forEach((item, index) => {
				if (item.type == 'bag') {
					this.mainData.process.splice(index, 1)
				}
			})
		}
	}

	setCalculateBagCost() {
		this.mainData.process.forEach((item, index) => {
			if (item.type == 'bag') {
				item.line = []
				var qty = []
				this.mainData.component1.forEach((item1, index1) => {
					item1.qty.totalqty.forEach((item2, index2) => {
						if (!qty[index2]) {
							qty[index2] = 0
						}
						qty[index2] += item2
					})
				})
				qty.forEach((item1, index1) => {
					var bag_price = 0.1 //  ยัง fix ค่าไว้อยู่
					item.line.push({
						qty: item1,
						unit_price: bag_price,
						price: parseFloat((item1 * bag_price).toFixed(2))
					})
				})
			}
		})
	}

	setTrim(check) {
		if (check) {
			var trim = this.mainData.process.filter((item, index) => {
				return item.type == 'trim'
			})
			if (trim.length == 0) {
				this.mainData.process.push({
					type: 'trim',
					info: {},
					line: []
				})
			}
			this.mainData.process.forEach((item, index) => {
				if (item.type == 'trim') {
					item.line = []
				}
			})
		} else {
			this.mainData.process.forEach((item, index) => {
				if (item.type == 'trim') {
					this.mainData.process.splice(index, 1)
				}
			})
		}
	}

	setCalculateTrimCost() {
		this.mainData.process.forEach((item, index) => {
			if (item.type == 'trim') {
				item.line = []
				var qty = []

				this.mainData.component1.forEach((item1) => {
					item1.qty.totalqty.forEach((item2, index2) => {
						if (!qty[index2]) {
							qty[index2] = 0
						}
						qty[index2] += item2
					})
				})
				qty.forEach((item1) => {
					var trim_price = this.setPriceRate('trim', item1)
					item.line.push({
						qty: item1,
						unit_price: trim_price.unit_price,
						price: trim_price.price
					})
				})
			}
		})
	}

	getBlisterPackRate(layout, matType) {
		if (layout[0] < layout[1]) {
			var w = layout[0], l = layout[1]
		} else {
			var w = layout[1], l = layout[0]
		}
		var layout_arr = [], special_lay = {}, check = 0
		db.db.coating_info.forEach((item) => {
			if (item.coating_code == 'B-PACK' && item.material_type == 'PVC') {
				if (!arrayEquals(item.coating_size, [14, 31])) {
					layout_arr.push(item.coating_size)
				} else {
					special_lay = {
						min: [0, 0],
						max: item.coating_size
					}
				}
			}
		})
		var arr_length = layout_arr.length, size = []
		for (var index = 0; index < arr_length; index++) {
			if (index == 0) {
				size.push({
					min: [0, 0],
					max: [layout_arr[index][0], layout_arr[index][1]],
				})
			} else {
				size.push({
					min: [layout_arr[index - 1][0], layout_arr[index - 1][1]],
					max: [layout_arr[index][0], layout_arr[index][1]],
				})
			}
		}
		var matched_size, price_obj = {}
		size.forEach((item) => {
			if (item.min[0] <= w && item.max[0] > w && item.min[1] <= l && item.max[1] > l && check == 0) {
				matched_size = item.max
				check = 1
			}
		})
		if (check == 0) {
			if (special_lay.min[0] <= w && special_lay.max[0] > w && special_lay.min[1] <= l && special_lay.max[1] > l && check == 0) {
				matched_size = special_lay.max
				check = 1
			}
		}
		if (check == 1) {
			db.db.coating_info.forEach((item) => {
				if (item.coating_code == 'B-PACK' && item.material_type == matType && arrayEquals(item.coating_size, matched_size)) {
					price_obj = {
						rate: item.rate,
						min_cost: item.min_cost,
						unit_min_cost: item.unit_min_cost
					}
				}
			})
		} else {
			//* use maximum price if any size not match
			const max_size = layout_arr[arr_length - 1]
			db.db.coating_info.forEach((item) => {
				if (item.coating_code == 'B-PACK' && item.material_type == matType && arrayEquals(item.coating_size, max_size)) {
					price_obj = {
						rate: item.rate,
						min_cost: item.min_cost,
						unit_min_cost: item.unit_min_cost
					}
				}
			})
		}
		return price_obj
	}

	setCalculateCoatingCost(item) {
		item.addon.forEach((item1) => {
			if (item1.type == 'coating') {
				const {
					afterpress_price_marking = 0
				} = defaultData || {}
				const is_multiple_f = getIsMultipleF()
				let unit_price = 1,
					ups_factor = 1

				item1.line = []

				if (!['S-UV', 'S-UV-S'].includes(item1.info.code)) {
					item1.info.width = item.layout.laySize[0]
					item1.info.length = item.layout.laySize[1]
				}

				if (item1.info.code == 'B-PACK') {
					var price_obj = this.getBlisterPackRate([item1.info.width, item1.info.length], item1.info.material_type)
					item1.info.coating_price = price_obj.rate
					item1.info.unit_min_cost = price_obj.unit_min_cost
					item1.info.min_cost = price_obj.min_cost
				}

				if (['S-UV', 'S-UV-S'].includes(item1.info.code)) {
					ups_factor = item.paper_usage.ups
				}


				this.mainData.qty?.totalqty?.forEach((totalQty, qtyIndex) => {
					let qty = 0

					if (is_multiple_f) {
						qty = item.paper_usage.line?.reduce((total, curr) => total += curr.paper_print, 0)
					} else {
						qty = item.paper_usage.line[qtyIndex].paper_print
					}

					if (item1.info.code == 'B-PACK') {
						unit_price = parseFloat((item1.info.coating_price * item1.info.side).toFixed(2))
					} else if (item1.info.code == 'P-PAT') {
						unit_price = parseFloat((item1.info.coating_price).toFixed(2))
					} else {
						unit_price = parseFloat((ups_factor * item1.info.width * item1.info.length * item1.info.coating_price * item1.info.side).toFixed(2))
					}

					if (item1.info.unit_min_cost == 'sheet') {
						if (unit_price < item1.info.min_cost) {
							unit_price = item1.info.min_cost
						}

						unit_price = parseFloat((unit_price * (1 + (afterpress_price_marking / 100))).toFixed(2))

						item1.line.push({
							qty,
							unit_price: unit_price,
							price: parseFloat((qty * unit_price).toFixed(2))
						})

					} else if (item1.info.unit_min_cost == 'price') {
						if (qty * unit_price < item1.info.min_cost) {
							var price = item1.info.min_cost
						} else {
							var price = parseFloat((qty * unit_price).toFixed(2))
						}

						price = parseFloat((price * (1 + (afterpress_price_marking / 100))).toFixed(2))

						item1.line.push({
							qty,
							unit_price: unit_price,
							price: price
						})
					}
				})

			}
		})
	}

	setCalculateCorrugatedBoard(index) {
		//* component_type -> paper+corrugated or corrugated only
		var item = this.mainData.component1[index]
		const is_multiple_f = getIsMultipleF()

		if (item.component_type.type === 1) return false;

		const {
			corrugated_layer: {
				info,
				component_flute_side,
			},
			component_type: { type: compType },
			layout: { laySize, selected_layout: { laying } },
			paper_info: { roll_width: wSide, cut_off: lSide }
		} = item

		const { corrugated_glued_cost, corrugated_tolerance } = defaultData || {}

		let price = [],
			unit_inch_arr = [],
			unit_price_arr = [],
			flute_side = 0,
			cut_off = 0,
			flute = null

		if (info?.is_custom) {
			//* update : v17.4
			this.mainData.qty.totalqty.forEach((qty, qIndex) => {
				price.push(info?.costCorrugated_custom)
			})

		} else {
			if (info.num_layer == 2) {
				console.log("Debug Corrugated : ", index, item, info, info.name, info.flute_type)
				this.mainData.qty.totalqty.forEach((qty) => {
					const after_ups = Math.ceil(qty / item.paper_usage.ups)
					const cost = db.db.corrugated_info.find((item2) => {
						return (
							item2.grade == info.name
							&& item2.flute_type == info.flute_type
							&& item2.min_qty <= after_ups
							&& item2.max_qty >= after_ups
						)
					}) || {}
					price.push(cost?.rate || 0)
				})

			} else {
				const cost = getCorrugatedInfo(index)

				this.mainData.qty.totalqty.forEach((qty, qIndex) => {
					price.push(cost?.cost)
				})
			}
		}

		item.corrugated_layer.info.cost = price

		//* find flute_side, cut_off, flute by component type
		switch (compType) {
			case 1:
				break;
			case 2:
				//* calc. paper size & flute img 
				//* component type : paper + corrugated
				//* corrugated size must be 0.375 inches shorter than paper size
				if (info?.is_price_per_sheet) {
					const fluteSide = getLayingFluteSide(index)
					flute_side = info?.corrugated_size[2]
					cut_off = info?.corrugated_size[3]

					if (fluteSide == 'WSize') {
						flute = "vertical"
					} else {
						flute = "horizontal"
					}

				} else {

					if (item.layout_manual) {
						const fluteSide1 = getLayingFluteSide(index)

						if (fluteSide1 == 'WSize') {
							flute = "vertical"
							flute_side = parseFloat((laySize[0] - corrugated_tolerance).toFixed(3))
							cut_off = parseFloat((laySize[1] - corrugated_tolerance).toFixed(3))
						} else {
							flute = "horizontal"
							flute_side = parseFloat((laySize[1] - corrugated_tolerance).toFixed(3))
							cut_off = parseFloat((laySize[0] - corrugated_tolerance).toFixed(3))
						}

					} else {
						//* FALSE -> Calculate Layout by Estimate Program
						if (
							(component_flute_side == 'short_side' && laying == 'vertical') ||
							(component_flute_side == 'long_side' && laying == 'horizontal')
						) {
							flute_side = parseFloat((laySize[0] - corrugated_tolerance).toFixed(3))
							cut_off = parseFloat((laySize[1] - corrugated_tolerance).toFixed(3))
							flute = "vertical"

						} else {
							flute_side = parseFloat((laySize[1] - corrugated_tolerance).toFixed(3))
							cut_off = parseFloat((laySize[0] - corrugated_tolerance).toFixed(3))
							flute = "horizontal"
						}
					}

				}


				break;
			case 3:
				//* component type : corrugated only
				//* corrugated size is paper size (no paper size in this component_type)
				if (item.layout_manual) {
					//* TRUE -> Manual Layout by User
					// ? note : change laySize[0,1] to roll_width, cut_off
					// * fixed หน้าม้วนเป็น wSide เสมอ
					flute_side = parseFloat((wSide).toFixed(3))
					cut_off = parseFloat((lSide).toFixed(3))

					const fluteSide = getLayingFluteSide(index)

					if (fluteSide == 'WSize') {
						flute = "vertical"
					} else {
						flute = "horizontal"

						flute_side = parseFloat((lSide).toFixed(3))
						cut_off = parseFloat((wSide).toFixed(3))
					}

					if (info?.is_price_per_sheet) {
						flute_side = info?.corrugated_size[2]
						cut_off = info?.corrugated_size[3]
					}

				} else {
					//* FALSE -> Calculate Layout by Estimate Program
					flute_side = parseFloat((wSide).toFixed(3))
					cut_off = parseFloat((lSide).toFixed(3))

					console.log('setCalculateCorrugatedBoard Before : ', component_flute_side, flute_side, cut_off)

					if (component_flute_side === 'short_side') {
						if (laying === 'vertical') {
							// paperSize = [roundToEven(laySize[0]),roundDecimal(laySize[1])]
							flute = "vertical"
							console.log(`change flute : ${component_flute_side} / ${laying} = ${flute}`)
						} else {
							// paperSize = [roundDecimal(laySize[0]),roundToEven(laySize[1])]
							flute = "horizontal"
							console.log(`change flute : ${component_flute_side} / ${laying} = ${flute}`)
						}
					} else {
						if (laying === 'vertical') {
							// paperSize = [roundDecimal(laySize[0]),roundToEven(laySize[1])]
							flute = "horizontal"
							console.log(`change flute : ${component_flute_side} / ${laying} = ${flute}`)
						} else {
							// paperSize = [roundToEven(laySize[0]),roundDecimal(laySize[1])]
							flute = "vertical"
							console.log(`change flute : ${component_flute_side} / ${laying} = ${flute}`)
						}

						// flute_side = parseFloat((lSide).toFixed(3))
						// cut_off = parseFloat((wSide).toFixed(3))
					}

					console.log('setCalculateCorrugatedBoard After : ', component_flute_side, flute_side, cut_off)
				}

				break;
			default:
				break;
		}

		item.corrugated_layer.info.corrugated_glued_cost = corrugated_glued_cost
		item.corrugated_layer.info.flute_side = flute_side
		item.corrugated_layer.info.cut_off = cut_off
		item.corrugated_layer.info.flute_align = flute

		item.corrugated_layer.info.cost.forEach((price) => {
			const unit_inch = parseFloat((price / 144 * (1 + (info?.corrugated_markup / 100))).toFixed(4))

			let unit_price = 0
			if (item.corrugated_layer.info?.is_price_per_sheet) {
				unit_price = parseFloat((price * (1 + (info?.corrugated_markup / 100))).toFixed(2))
			} else {
				unit_price = parseFloat((unit_inch * info?.flute_side * info?.cut_off).toFixed(2))
			}

			unit_inch_arr.push(unit_inch)
			unit_price_arr.push(unit_price)
		})

		item.corrugated_layer.info.unit_inch = unit_inch_arr
		item.corrugated_layer.info.unit_price = unit_price_arr
		item.corrugated_layer.price = []


		if (compType == 3) {
			this.mainData.qty.totalqty.forEach((_, qtyIndex) => {
				let qty = 0
				if (is_multiple_f) {
					qty = item.paper_usage.line.reduce((total, curr, currIndex) =>
						total += curr.paper_net
						, 0)
				} else {
					qty = item.paper_usage.line[qtyIndex].paper_net
				}

				item.corrugated_layer.price.push({
					qty,
					unit_price: info.unit_price[qtyIndex],
					price: parseFloat((qty * unit_price_arr[qtyIndex]).toFixed(2))
				})

			})

		} else {

			this.mainData.qty.totalqty.forEach((_, qtyIndex) => {
				let qty = 0
				if (is_multiple_f) {
					qty = item.paper_usage.line.reduce((total, curr, currIndex) =>
						total += curr.after_ups + item.waste.waste_corrugated_board[currIndex]
						, 0)
				} else {
					qty = item.paper_usage.line[qtyIndex].after_ups + item.waste.waste_corrugated_board[qtyIndex]
				}

				qty = roundCorrugated(qty)

				item.corrugated_layer.price.push({
					qty,
					unit_price: info.unit_price[qtyIndex],
					price: parseFloat((qty * unit_price_arr[qtyIndex]).toFixed(2))
				})

			})
		}

		this.setCalculateCorrugatedGluedCost(item, is_multiple_f)
	}

	setCalculateCorrugatedGluedCost(item, is_multiple_f) { //* edited for F - 27.07.22
		item.process.forEach((item1) => {
			if (item1.name == 'corrugated_glued') {
				const {
					afterpress_price_marking = 0
				} = defaultData || {}
				const { corrugated_layer: { info } } = item || {}

				item1.info = {
					name: item1.type
				}
				item1.line = []

				this.mainData.qty.totalqty.forEach((_, qtyIndex) => {
					let unit_price = parseFloat((info.flute_side * info.cut_off * info.corrugated_glued_cost).toFixed(2))
					let qty = 0
					if (is_multiple_f) {
						qty = item.paper_usage.line.reduce((total, curr, currIndex) =>
							total += curr.after_ups + item.waste.waste_corrugated_board[currIndex]
							, 0)
					} else {
						qty = item.paper_usage.line[qtyIndex].after_ups + item.waste.waste_corrugated_board[qtyIndex]
					}

					//* profit sharing
					unit_price = parseFloat((unit_price * (1 + (afterpress_price_marking / 100))).toFixed(2))

					item1.line.push({
						qty,
						unit_price,
						price: parseFloat(qty * unit_price)
					})
				})
			}
		})
	}

	setCalculateFoilStampCost(item) {
		const isMultipleF = getIsMultipleF()
		item.addon.forEach((addon) => {
			if (addon.type !== 'foilstamp') {
				return
			}

			const {
				info: {
					foil_width,
					foil_length,
					width,
					length,
					foil_roll_price,
					block_rate,
					foil_roll_min_price = 0,
					f_code
				},
			} = addon || {}

			const {
				foil_width_tolerance,
				foil_length_tolerance,
				film_rate,
				block_foilstamp_min_cost,
				film_min_cost,
				afterpress_price_marking = 0,
				material_price_marking = 0,
				addon_labor_price_marking = 0
			} = defaultData || {}

			let labor_price = 0,
				temp_block_unit_price = 0,
				temp_film_unit_price = 0,
				temp_unit_price = 0

			addon.line = []

			// * Set data
			const num_roll_width_side = Math.floor(foil_width / (width + foil_width_tolerance * 2))
			const num_roll_long_side = Math.floor(foil_length * 12 / (length + foil_length_tolerance))
			const pcs_per_roll = num_roll_width_side * num_roll_long_side
			const foil_unit_price = parseFloat(((foil_roll_price * (1 + (material_price_marking / 100))) / pcs_per_roll).toFixed(4))

			addon.info.pcs_per_roll = pcs_per_roll
			addon.info.foil_unit_price = foil_unit_price
			addon.info.film_rate = film_rate

			if (width * length * block_rate < block_foilstamp_min_cost) {
				temp_block_unit_price = block_foilstamp_min_cost
			} else {
				temp_block_unit_price = parseFloat((width * length * block_rate).toFixed(2))
			}

			if (width * length * film_rate < film_min_cost) {
				temp_film_unit_price = film_min_cost
			} else {
				temp_film_unit_price = parseFloat((width * length * film_rate).toFixed(2))
			}

			addon.info.block = {
				film_unit_price: temp_film_unit_price,
				block_unit_price: temp_block_unit_price
			}

			//* Block unit price
			temp_unit_price = parseFloat((temp_block_unit_price + temp_film_unit_price).toFixed(2))

			// * Block unit price + Profit Sharing
			temp_unit_price = parseFloat((temp_unit_price * (1 + (material_price_marking / 100))).toFixed(2))

			this.mainData.qty.totalqty.forEach((_, qtyIndex) => {
				let qty = 0,
					after_ups = 0

				if (isMultipleF && f_code?.length) { //* multiple F
					f_code.forEach(fCode => {
						const fIndex = this.getFCodeIndex(fCode)
						qty += item.paper_usage.line[fIndex].qty
						after_ups += item.paper_usage.line[fIndex].after_ups
					})
				} else {
					qty = item.paper_usage.line[qtyIndex].qty
					after_ups += item.paper_usage.line[qtyIndex].after_ups
				}

				const { unit_price, min_price } = this.setPriceRate('foilstamp', after_ups)
				const labor_unit_price = parseFloat(((unit_price / item.paper_usage.ups) * (1 + addon_labor_price_marking / 100)).toFixed(5))
				const foil_price = parseFloat(((qty) * foil_unit_price).toFixed(2))

				if (labor_unit_price * qty < min_price) {
					labor_price = min_price
				} else {
					labor_price = parseFloat((labor_unit_price * qty).toFixed(2))
				}

				// * ค่าแรง - Profit Sharing
				labor_price = parseFloat((labor_price * (1 + (afterpress_price_marking / 100))).toFixed(2))

				let roll_min_price = parseFloat((foil_roll_min_price * (1 + (material_price_marking / 100))).toFixed(2))

				addon.line.push({
					labor: {
						qty: qty,  //คิดต่อยอด
						unit_price: labor_unit_price,
						price: labor_price,
					},
					foil_roll: {
						qty: qty,
						unit_price: foil_unit_price,
						price: foil_price < foil_roll_min_price ? roll_min_price : foil_price,
					},
					block: {
						qty: item.paper_usage.ups,
						unit_price: temp_unit_price,
						price: parseFloat((temp_unit_price * item.paper_usage.ups).toFixed(2))
					}
				})
			})

		})
	}

	setCalculateBossingCost(item) {
		const isMultipleF = getIsMultipleF()
		const {
			film_rate: defaultFilmRate,
			film_min_cost: defaultFilmMinCost,
			afterpress_price_marking = 0,
			addon_labor_price_marking = 0,
			material_price_marking = 0
		} = defaultData || {}

		item.addon.forEach((item1) => {
			if (!['emboss', 'deboss'].includes(item1.type)) {
				return false
			}

			const {
				info: {
					// width,
					// length,
					block_rate,
					f_code,
					size = []
				}
			} = item1 || {}

			item1.line = []

			//* ค่าแรงคิดครั้งเดียว / ค่า block คิดแยก size
			const objCost = {
				labor: [],
				block: []
			}

			size?.forEach((size, sIndex) => {
				const [width, length] = size || []

				const blockObj = {
					size: [width, length],
					line: []
				}

				let temp_unit_price = 1,
					labor_price = 0

				const block_unit_price = parseFloat((width * length * block_rate).toFixed(2))

				item1.info.film_rate = defaultFilmRate
				let film_unit_price = width * length * defaultFilmRate

				if (film_unit_price < defaultFilmMinCost) {
					film_unit_price = defaultFilmMinCost
				} else {
					film_unit_price = parseFloat(film_unit_price.toFixed(2))
				}

				item1.info.block = {
					film_unit_price,
					block_unit_price,
				}

				temp_unit_price = parseFloat((film_unit_price + block_unit_price).toFixed(2))

				//* profit sharing
				temp_unit_price = parseFloat((temp_unit_price * (1 + (material_price_marking / 100))).toFixed(2))


				this.mainData.qty.totalqty.forEach((_, qtyIndex) => {
					let qty = 0, after_ups = 0

					if (isMultipleF && f_code?.length) {
						f_code.forEach(fCode => {
							const fIndex = this.getFCodeIndex(fCode)
							qty += item.paper_usage.line[fIndex].qty
							after_ups += item.paper_usage.line[fIndex].after_ups
						})

					} else {
						qty = item.paper_usage.line[qtyIndex].qty
						after_ups += item.paper_usage.line[qtyIndex].after_ups
					}

					const { unit_price, min_price } = this.setPriceRate('bossing', after_ups)
					const labor_unit_price = parseFloat(((unit_price / item.paper_usage.ups) * (1 + addon_labor_price_marking / 100)).toFixed(5))

					labor_price = parseFloat((labor_unit_price * qty).toFixed(2))

					if (labor_price < min_price) {
						labor_price = min_price
					}

					//* profit sharing
					labor_price = parseFloat((labor_price * (1 + (afterpress_price_marking / 100))).toFixed(2))

					if (sIndex == 0) { // * ค่าแรงคิดครั้งเดียว
						objCost.labor.push(
							{
								qty,
								unit_price: labor_unit_price,
								price: labor_price
							}
						)
					}

					blockObj.line.push(
						{ //* ไม่ต้องแก้
							qty: item.paper_usage.ups,
							unit_price: temp_unit_price,
							price: parseFloat((temp_unit_price * item.paper_usage.ups).toFixed(2))
						}
					)

				}) //* mainData.qty.totalqty

				objCost.block.push(blockObj)
			}) //* size

			item1.line = objCost

		}) //* addon
	}

	setCalculateMaterialCost() {
		const {
			material_price_marking = 0
		} = defaultData || {}
		const isMultipleF = getIsMultipleF()
		//* calculate cost for materials
		this.mainData.material.forEach((item) => {
			let unit_price = item.info.unit_price
			unit_price = parseFloat((unit_price * (1 + (material_price_marking / 100))).toFixed(4))

			item.line = []

			this.mainData.qty.totalqty.forEach((_, index1) => {

				if (item.info.is_fixedPrice) {
					item.line.push({
						qty: item.info.qty_material,
						unit_price: unit_price,
						price: parseFloat((item.info.qty_material * unit_price).toFixed(2))
					})
				} else {
					if (isMultipleF) {
						this.mainData.component1?.forEach((comp, compIndex) => {
							comp?.f_detail?.f_list?.forEach((fInfo, fIndex) => {
								item.line.push({
									qty: item.info.qty_material[fIndex], //qty_material number from input qty.
									unit_price: unit_price,
									price: parseFloat((item.info.qty_material[fIndex] * unit_price).toFixed(2))
								})
							})
						})
					} else {
						item.line.push({
							qty: item.info.qty_material[index1], //qty_material number from input qty.
							unit_price: unit_price,
							price: parseFloat((item.info.qty_material[index1] * unit_price).toFixed(2))
						})
					}
				}

			})
		})
	}

	setCalculateProcessCost() {
		const {
			outsouce_price_marking = 0
		} = defaultData || {}

		const isMultipleF = getIsMultipleF()
		//* calculate cost for both other process and handwork process
		this.mainData.process.forEach((item) => {
			if (item.type == 'other' || item.type == 'handwork' || item.type == 'custom') {
				let process_marking_percent = outsouce_price_marking

				// if (item.type == 'custom') {
				// 	process_marking_percent = outsouce_price_marking
				// }

				item.line = []

				this.mainData.qty.totalqty.forEach((qty1, index1) => {
					let unit_price = 0

					if (item.info.is_fixedPrice) {
						unit_price = item.info.unit_price
						unit_price = parseFloat((unit_price * (1 + (process_marking_percent / 100))).toFixed(4))

						item.line.push({
							qty: qty1,
							unit_price: unit_price,
							price: parseFloat((qty1 * unit_price).toFixed(2))
						})
					} else {

						if (isMultipleF) {
							this.mainData.component1?.forEach((comp, compIndex) => {
								comp?.f_detail?.f_list?.forEach((fInfo, fIndex) => {
									unit_price = item.info.unit_price[fIndex]
									unit_price = parseFloat((unit_price * (1 + (process_marking_percent / 100))).toFixed(4))

									item.line.push({
										qty: fInfo.total_qty, //qty number from input qty.
										unit_price: unit_price,
										price: parseFloat((fInfo.total_qty * unit_price).toFixed(2))
									})
								})
							})
						} else {
							unit_price = item.info.unit_price[index1]
							unit_price = parseFloat((unit_price * (1 + (process_marking_percent / 100))).toFixed(4))

							item.line.push({
								qty: qty1,
								unit_price: unit_price,
								price: parseFloat((qty1 * unit_price).toFixed(2))
							})
						}
					}
				})
			}

		})
	}

	setCalculateOtherCostCost() {
		const {
			outsouce_price_marking = 0
		} = defaultData || {}

		const isMultipleF = getIsMultipleF()
		//* calculate cost for other cost
		this.mainData?.otherCost?.forEach((item) => {
			item.line = []
			this.mainData.qty.totalqty.forEach((_, index1) => {
				let unit_price = parseFloat((item.info.unit_price).toFixed(2))

				if (item.info.unit_price > 0) {
					unit_price = parseFloat((unit_price * (1 + (outsouce_price_marking / 100))).toFixed(4))
				}

				if (item.info.is_fixedPrice) {
					item.line.push({
						qty: item.info.qty_other,
						unit_price: unit_price,
						price: parseFloat((item.info.qty_other * unit_price).toFixed(2))
					})
				} else {
					if (isMultipleF) {
						this.mainData.component1?.forEach((comp, compIndex) => {
							comp?.f_detail?.f_list?.forEach((fInfo, fIndex) => {
								item.line.push({
									qty: item.info.qty_other[fIndex],
									unit_price: unit_price,
									price: parseFloat((item.info.qty_other[fIndex] * unit_price).toFixed(2))
								})
							})
						})
					} else {
						item.line.push({
							qty: item.info.qty_other[index1],
							unit_price: unit_price,
							price: parseFloat((item.info.qty_other[index1] * unit_price).toFixed(2))
						})
					}

				}

			})
		})
	}

	setCalculateSpecialInkCost(item) {
		if (item.color.length > 0) {
			const {
				material_price_marking = 0
			} = defaultData || {}

			const is_multiple_f = getIsMultipleF()

			item.color.forEach(colorInfo => {
				colorInfo.special_ink.forEach((speInk) => {
					// if(speInk.info?.is_custom_paper_code){

					// }else{
					var { factor, filling_percent } = this.getSpecialInkFactor(speInk.info.paper_code, speInk.info.print_style) || {};
					// }

					speInk.line = []
					let after_waste = 0
					//* หา after_waste ของ F นี้

					this.mainData.qty.totalqty.forEach((_, qtyIndex) => {
						if (is_multiple_f) {
							const { f_code } = colorInfo || {}
							const fIndex = this.getFCodeIndex(f_code)
							after_waste = item.paper_usage.line[fIndex].after_waste
						} else {
							after_waste = item.paper_usage.line[qtyIndex].after_waste
						}
						const qty = Math.ceil(1.05 * item.layout.laySize[0] * item.layout.laySize[1] * after_waste * filling_percent / factor)
						let unit_price = this.getSpecialInkPrice(speInk.process_id)

						unit_price = parseFloat((unit_price * (1 + (material_price_marking / 100))).toFixed(2))

						speInk.line.push({
							qty,
							unit_price,
							price: parseFloat((qty * unit_price).toFixed(2))
						})
					})
				})
			})
		}
	}

	getSpecialInkFactor(paper_code, print_style) {
		return db.db.special_ink_factor_info.filter((item) => item.paper_code == paper_code && item.filling_style == print_style)
			.map(({ factor, filling_percent }) => ({ factor, filling_percent }))[0]

	}

	getSpecialInkPrice(ink_id) {
		return db.db.special_ink_info.filter((item) => item.process_id == ink_id)
			.map(({ price }) => (price))[0]
	}

	setCalculateChipCost() {
		const isMultipleF = getIsMultipleF()
		this.mainData.process.forEach((item) => {
			if (item.name == 'chip') {
				const {
					afterpress_price_marking = 0
				} = defaultData || {}

				item.line = []
				var qty = []

				this.mainData.qty.totalqty.forEach((_, qtyIndex) => {
					let allQty = 0
					if (isMultipleF) {
						allQty = this.mainData.component1.reduce((total, obj) =>
							total += obj?.box_type?.is_digital_diecut //* ไม่คิดค่า แกะ กรณีเลือก digital diecut
								? 0
								: obj?.paper_usage?.line?.reduce((total2, obj2) => total2 += obj2?.qty, 0)
							, 0)
					} else {
						allQty = this.mainData.component1.reduce((total, obj) =>
							total += obj?.box_type?.is_digital_diecut //* ไม่คิดค่า แกะ กรณีเลือก digital diecut
								? 0
								: obj?.paper_usage?.line[qtyIndex]?.qty
							, 0)
					}
					qty.push(allQty)
				})

				this.mainData.qty.totalqty.forEach((_, qtyIndex) => {
					const allQty = qty[qtyIndex]
					var price_obj = this.setPriceRate('chip', allQty)
					var unit_price = price_obj.unit_price

					if (unit_price * allQty < price_obj.min_price) {
						var price = price_obj.min_price
					} else {
						var price = parseFloat((unit_price * allQty).toFixed(2))
					}

					//* profit sharing
					price = parseFloat((price * (1 + (afterpress_price_marking / 100))).toFixed(2))

					item.line.push({
						qty: allQty,
						unit_price: unit_price,
						price: price
					})
				})
			}
		})
	} l

	setCalculateComponentMaterialCost() {
		const isMultipleF = getIsMultipleF()

		const {
			coating_opp_cold_film_cost_sqin = 0,
			coating_opp_cold_film_min_price = 0,
			material_price_marking = 0
		} = defaultData || {}

		this.mainData.component1?.forEach((comp) => {
			comp?.process?.filter(obj => obj?.type === 'material')?.forEach((item) => {

				item.line = []
				var qty = []

				if (item?.process_id == 140) {
					// * Cold Film
					const unitPriceSqin = coating_opp_cold_film_cost_sqin
					const [layW, layL] = comp?.layout?.laySize
					const unit_price = parseFloat((unitPriceSqin * layW * layL).toFixed(2))
					const min_price = coating_opp_cold_film_min_price

					this.mainData.qty.totalqty.forEach((_, qtyIndex) => {
						let allQty = 0
						if (isMultipleF) {
							allQty = this.mainData.component1.reduce((total, obj) => {
								total += obj?.paper_usage?.line?.reduce((total2, obj2) => total2 += obj2?.paper_print, 0)

								return total
							}, 0)
						} else {
							allQty = this.mainData.component1.reduce((total, obj) => {
								total += obj?.paper_usage?.line[qtyIndex]?.paper_print

								return total
							}, 0)
						}
						qty.push(allQty)
					})

					this.mainData.qty.totalqty.forEach((_, qtyIndex) => {
						const allQty = qty[qtyIndex]
						// var unit_price = price_obj.unit_price

						if (unit_price * allQty < min_price) {
							var price = min_price
						} else {
							var price = parseFloat((unit_price * allQty).toFixed(2))
						}

						//* profit sharing
						price = parseFloat((price * (1 + (material_price_marking / 100))).toFixed(2))

						item.line.push({
							qty: allQty,
							unit_price: unit_price,
							price: price
						})
					})
				}
			})
		})
	}

	getAssemblyFactor(item) {
		const glued_spot = item.box_type.glued_spot
		switch (glued_spot) {
			case 1:
				return 1
			case 2:
				return 1.5
			case 3:
				return 1.75
			case 4:
				return 1.9
		}
	}

	setCalculateAssemblyCost(item) {
		item.process.forEach((item1) => {
			if (item1.name == 'assembly') {
				const {
					afterpress_price_marking = 0,
					corrugated_assembly_markup_price = 0
				} = defaultData || {}

				var type = this.setAssemblyType(item.packaging_size.open_size)
				item1.line = []

				this.mainData.qty.totalqty.forEach((qty) => {
					const { min_price, unit_price } = this.setPriceRate(type, qty, item) || {}

					let proc_unit_price = unit_price

					if ([2, 3].includes(item?.component_type?.type)) {
						proc_unit_price += corrugated_assembly_markup_price
					}

					if (proc_unit_price * qty < min_price) {
						var price = min_price
					} else {
						var price = parseFloat((proc_unit_price * qty).toFixed(2))
					}

					price = parseFloat((price * (1 + (afterpress_price_marking / 100))).toFixed(2))

					item1.line.push({
						qty,
						unit_price: proc_unit_price,
						price: price
					})
				})
			}
		})
	}

	setCalculateDieCutCost(item) {
		item.process.forEach((item1) => {
			if (item1.name == 'diecut') {
				const {
					afterpress_price_marking = 0,
					material_price_marking = 0
				} = defaultData || {}

				item1.line = []
				//? Check Is this item has OPP WINDOW COATING
				let is_OPPWIN = item.addon.some(obj => [36, 51].includes(obj.process_id)) // true , false
				let block_qty = 1
				let factor = 1

				if (is_OPPWIN) {
					factor = 2
					block_qty = 2
				}

				//* number of totalqty will depend on input qty. but if multiple F it will depend on totalQty.
				this.mainData.qty.totalqty.forEach((qty) => {
					const after_ups = Math.ceil(qty / item.paper_usage.ups)
					const labor_diecut_rate = this.setPriceRate('diecut', after_ups)
					const labor_diecut_unit_price = parseFloat((labor_diecut_rate.unit_price / item.paper_usage.ups).toFixed(5))

					if (labor_diecut_unit_price * qty < labor_diecut_rate.min_price) {
						var labor_diecut_price = labor_diecut_rate.min_price
					} else {
						var labor_diecut_price = parseFloat(((labor_diecut_unit_price * factor) * qty).toFixed(2))
					}

					//* New update 29.03.22 edit unit price
					var block_rate = this.setBlockDiecutRate2(item.layout.laySize)

					//* profit sharing
					block_rate = parseFloat((block_rate * (1 + (material_price_marking / 100))).toFixed(2))
					labor_diecut_price = parseFloat((labor_diecut_price * (1 + (afterpress_price_marking / 100))).toFixed(2))

					item1.line.push({
						block: {
							qty: block_qty,
							// unit_price: block_rate * factor,
							unit_price: block_rate,
							price: parseFloat((parseFloat(block_qty * block_rate)).toFixed(2))
						},
						labor: {
							qty: qty,
							unit_price: labor_diecut_unit_price * factor,
							price: labor_diecut_price
						}
					})
				})
			}
		})
	}

	setCalculateDigitalDieCutCost(item) {
		const isMultipleF = getIsMultipleF()

		item.process.forEach((item1) => {
			if (item1.name == 'digital_diecut') {
				const {
					afterpress_price_marking = 0,
					material_price_marking = 0
				} = defaultData || {}

				item1.line = []

				//* number of totalqty will depend on input qty. but if multiple F it will depend on totalQty.
				this.mainData.qty.totalqty.forEach((_, qtyIndex) => {
					let unit_price = 5
					let min_price = 0
					let after_waste = item?.paper_usage?.line[qtyIndex]?.after_waste || 0

					if (isMultipleF) {
						after_waste = item?.paper_usage?.line?.reduce((total, curr) => total += curr?.after_waste || 0, 0)
					}

					if (unit_price * after_waste < min_price) {
						var price = min_price
					} else {
						var price = parseFloat((unit_price * after_waste).toFixed(2))
					}

					price = parseFloat((price * (1 + (afterpress_price_marking / 100))).toFixed(2))

					item1.line.push({
						qty: after_waste,
						unit_price: unit_price,
						price: price
					})
				})
			}
		})
	}



	setCalculateInspectionCost() {
		const isMultipleF = getIsMultipleF()
		this.mainData.process.forEach((item, index) => {
			if (item.name == 'inspection') {
				const {
					afterpress_price_marking = 0
				} = defaultData || {}

				item.line = []
				var qty = []

				this.mainData.qty.totalqty.forEach((_, qtyIndex) => {
					let allQty = 0
					if (isMultipleF) {
						allQty = this.mainData.component1.reduce((total, obj) => {
							total += obj?.box_type?.is_digital_diecut ? 0 : obj?.paper_usage?.line?.reduce((total2, obj2) => total2 += obj2?.qty, 0)

							return total
						}, 0)
					} else {
						allQty = this.mainData.component1.reduce((total, obj) => {
							total += obj?.box_type?.is_digital_diecut ? 0 : obj?.paper_usage?.line[qtyIndex]?.qty

							return total
						}, 0)
					}
					qty.push(allQty)
				})

				this.mainData.qty.totalqty.forEach((_, qtyIndex) => {
					const allQty = qty[qtyIndex]
					var price_obj = this.setPriceRate('inspection', allQty)
					var unit_price = price_obj.unit_price

					if (unit_price * allQty < price_obj.min_price) {
						var price = price_obj.min_price
					} else {
						var price = parseFloat((unit_price * allQty).toFixed(2))
					}

					//* profit sharing
					price = parseFloat((price * (1 + (afterpress_price_marking / 100))).toFixed(2))

					item.line.push({
						qty: allQty,
						unit_price: unit_price,
						price: price
					})
				})
			}
		})
	}

	setCalculateBoxLayinginCarton(p, c, layout = null) {
		console.log("carton_lay_size", p, c)
		//* หาจำนวน bulk ที่วางใน carton ได้ 
		//* v: width/length, length/width
		//* h: width/width, length/length
		const
			v_x = Math.floor(toDecimal(p[0] / c[1])),
			v_y = Math.floor(toDecimal(p[1] / c[0])),
			v_xy = v_x * v_y,
			v_w_side = parseFloat((v_x * c[1]).toFixed(2)),
			v_l_side = parseFloat((v_y * c[0]).toFixed(2))

		const
			h_x = Math.floor(toDecimal(p[0] / c[0])),
			h_y = Math.floor(toDecimal(p[1] / c[1])),
			h_xy = h_x * h_y,
			h_w_side = parseFloat((h_x * c[0]).toFixed(2)),
			h_l_side = parseFloat((h_y * c[1]).toFixed(2))

		switch (Math.max(v_xy, h_xy)) {
			case v_xy:
				var laying = {
					laying: 'vertical',
					lay_size: [v_w_side, v_l_side],
					layout: [v_x, v_y],
					qty: v_xy
				}
				break
			case h_xy:
				var laying = {
					laying: 'horizontal',
					lay_size: [h_w_side, h_l_side],
					layout: [h_x, h_y],
					qty: h_xy
				}
				break
		}

		if (layout) {
			laying = {
				laying: 'custom',
				lay_size: [
					parseFloat((c[1] * layout[0]).toFixed(2)),
					parseFloat((c[0] * layout[1]).toFixed(2)),
				],
				layout,
				qty: layout[0] * layout[1]
			}
		}
		return laying
	}

	setCalculateBoxLayingPallet(p, c) {
		//หาจำนวน bulk ที่วางใน carton ได้ (palletization)
		//horizontal_1
		const v_x1 = Math.floor(p[0] / c[0])
		const v_y1 = Math.floor(p[1] / c[1])
		var v_xy1 = v_x1 * (v_y1)
		const y_remain1 = p[1] - ((v_y1) * c[1])
		const v_xx1 = Math.floor(p[0] / c[1])
		const v_yy1 = Math.floor(y_remain1 / c[0])
		v_xy1 += v_xx1 * v_yy1
		var aa1 = parseFloat((((v_y1) * c[1]) + (v_yy1 * c[0])).toFixed(2))
		if (v_x1 * c[0] > v_xx1 * c[1]) {
			var bb1 = parseFloat((v_x1 * c[0]).toFixed(2))
		} else { var bb1 = parseFloat((v_xx1 * c[1]).toFixed(2)) }
		if (aa1 < bb1) {
			var v_box1 = [aa1, bb1]
		} else {
			var v_box1 = [bb1, aa1]
		}

		//horizontal_2
		const v_x2 = Math.floor(p[0] / c[0])
		const v_y2 = Math.floor(p[1] / c[1])
		var v_xy2 = v_x2 * (v_y2 - 1)
		const y_remain2 = p[1] - ((v_y2 - 1) * c[1])
		const v_xx2 = Math.floor(p[0] / c[1])
		const v_yy2 = Math.floor(y_remain2 / c[0])
		v_xy2 += v_xx2 * v_yy2
		var aa2 = parseFloat((((v_y2 - 1) * c[1]) + (v_yy2 * c[0])).toFixed(2))
		if (v_x2 * c[0] > v_xx2 * c[1]) {
			var bb2 = parseFloat((v_x2 * c[0]).toFixed(2))
		} else { var bb2 = parseFloat((v_xx2 * c[1]).toFixed(2)) }
		if (aa2 < bb2) {
			var v_box2 = [aa2, bb2]
		} else { var v_box2 = [bb2, aa2] }


		//vertical_1
		const h_x1 = Math.floor(p[0] / c[1])
		const h_y1 = Math.floor(p[1] / c[0])
		var h_xy1 = h_x1 * h_y1
		const x_remain1 = p[0] - (h_x1 * c[1])
		const h_xx1 = Math.floor(x_remain1 / c[0])
		const h_yy1 = Math.floor(p[1] / c[1])
		h_xy1 += h_xx1 * h_yy1
		var cc1 = parseFloat(((h_x1 * c[1]) + (h_xx1 * c[0])).toFixed(2))
		if (h_y1 * c[0] > h_yy1 * c[1]) {
			var dd1 = parseFloat((h_y1 * c[0]).toFixed(2))
		} else { var dd1 = parseFloat((h_yy1 * c[1]).toFixed(2)) }
		if (cc1 < dd1) {
			var h_box1 = [cc1, dd1]
		} else { var h_box1 = [cc1, dd1] }

		//vertical_2
		const h_x2 = Math.floor(p[0] / c[1])
		const h_y2 = Math.floor(p[1] / c[0])
		var h_xy2 = (h_x2 - 1) * h_y2
		const x_remain2 = p[0] - ((h_x2 - 1) * c[1])
		const h_xx2 = Math.floor(x_remain2 / c[0])
		const h_yy2 = Math.floor(p[1] / c[1])
		h_xy2 += h_xx2 * h_yy2
		var cc2 = parseFloat((((h_x2 - 1) * c[1]) + (h_xx2 * c[0])).toFixed(2))
		if (h_y2 * c[0] > h_yy2 * c[1]) {
			var dd2 = parseFloat((h_y2 * c[0]).toFixed(2))
		} else { var dd2 = parseFloat((h_yy2 * c[1]).toFixed(2)) }
		if (cc2 < dd2) {
			var h_box2 = [cc2, dd2]
		} else { var h_box2 = [cc2, dd2] }

		switch (Math.max(v_xy1, v_xy2, h_xy1, h_xy2)) {
			case v_xy1:
				var box_laying = {
					laying: [
						{
							laying: "horizontal",
							pcs_per_row: v_x1,
							row: v_y1
						},
						{
							laying: "vertical",
							pcs_per_row: v_xx1,
							row: v_yy1,
						},
					],
					qty_layer: v_xy1,
					cube_size: v_box1,
				}
				break
			case v_xy2:
				var box_laying = {
					laying: [
						{
							laying: "horizontal",
							pcs_per_row: v_x2,
							row: v_y2 - 1
						},
						{
							laying: "vertical",
							pcs_per_row: v_xx2,
							row: v_yy2
						},
					],
					qty_layer: v_xy2,
					cube_size: v_box2,

				}
				break
			case h_xy1:
				var box_laying = {
					laying: [
						{
							laying: "horizontal",
							pcs_per_row: h_x1,
							row: h_y1
						},
						{
							laying: "vertical",
							pcs_per_row: h_xx1,
							row: h_yy1,
						},
					],
					qty_layer: h_xy1,
					cube_size: h_box1,
				}
				break
			case h_xy2:
				var box_laying = {
					laying: [
						{
							laying: "horizontal",
							pcs_per_row: h_x2 - 1,
							row: h_y2
						},
						{
							laying: "vertical",
							pcs_per_row: h_xx2,
							row: h_yy2,
						},
					],
					qty_layer: h_xy2,
					cube_size: h_box2,
				}
				break
		}
		return box_laying
	}

	setCalculateDelivery(item, fIndex = 0) {
		//* item = component
		const { delivery_rate } = defaultData
		const { totalqty } = this.mainData.qty || {}

		let objDelivery = {
			type_id: 12,
			type: 'delivery',
			process_id: 20,
			name: 'delivery',
			net_weight: 0,
			gross_weight: 0,
			unit_price: 0,
			price: [],
			packing_detail: [],
			fIndex
		}

		const
			carton = item.packing[fIndex].find(packing => packing.name === 'carton'),
			kraftwrap = item.packing[fIndex].find(packing => packing.name === 'kraftwrap'),
			pallet = item.packing[fIndex].find(packing => packing.name === 'pallet')

		if (!kraftwrap && !carton && pallet) {
			// * unit = 'piece'
			var
				{ info: { pallet_weight }, line, detail } = pallet,
				net_weight = pallet_weight,
				gross_weight = pallet_weight,
				unit_price = parseFloat((delivery_rate * pallet_weight / 1000).toFixed(2))

		} else if (kraftwrap && !carton) {
			// * unit = 'kraftwrap'
			var
				{ info: { net_weight, gross_weight }, line, detail } = kraftwrap,
				unit_price = parseFloat((delivery_rate * gross_weight / 1000).toFixed(2))

		} else if (carton) {
			// * unit = 'carton'
			var
				{ info: { net_weight, gross_weight }, line, detail } = carton,
				unit_price = parseFloat((delivery_rate * gross_weight / 1000).toFixed(2))

		}

		objDelivery = {
			...objDelivery,
			net_weight,
			gross_weight,
			unit_price, // ไม่ใช้แล้ว
			price: this.getDeliveryPrice(totalqty, delivery_rate, unit_price, line), //ไม่ใช้แล้ว
			packing_detail: detail
		}
		// let weight = { gross_weight, net_weight }
		item.delivery.push(objDelivery)

	}

	setCalculateTotalPrice(arrObjMarking) {
		const { material_price_marking = 0 } = defaultData || {}

		const printType = getPrintType()
		const isMultipleF = getIsMultipleF()
		var arr = []

		this.resetTotalPrice()
		const checkDelivery = this.mainData?.delivery

		this.mainData.qty.totalqty.forEach((item, index) => {
			const defaultMarking = this.getDefaultMarkingPercent(item)

			let mark_up_percent = 0,
				mark_down_percent = 0,
				marking_material_percent = 0,
				marking_production_percent = 0

			//* markup - down
			if (arrObjMarking?.length) {
				mark_up_percent = arrObjMarking[index]?.mark_up_percent || defaultMarking.mark_up_percent || 0
				mark_down_percent = arrObjMarking[index]?.mark_down_percent || defaultMarking.mark_down_percent || 0
				marking_material_percent = arrObjMarking[index]?.marking_material_percent || 0
				marking_production_percent = arrObjMarking[index]?.marking_production_percent || 0
			} else {
				mark_up_percent = defaultMarking.mark_up_percent
				mark_down_percent = defaultMarking.mark_down_percent
			}

			//* initial value
			if (!arr[index]) {
				arr[index] = {
					paper: 0,
					corrugated: 0,
					special_ink: 0,
					material: 0,
					plate: 0,
					proof: 0,
					print: 0,
					afterpress: 0,
					block: 0,
					delivery: 0,
					other: 0,
					mark_up_percent,
					mark_up_price: 0,
					mark_down_percent,
					mark_down_price: 0,
					total_price: 0
				}
			}

			this.mainData.component1.forEach((comp) => {
				//* paper cost
				if (comp.component_type.type != 3) {
					if (isMultipleF) {
						arr[index].paper += comp.paper_usage.line?.reduce((total, obj) => total += obj.price.paper.price, 0) || 0
					} else {
						arr[index].paper += comp.paper_usage.line[index].price.paper.price
					}
				}

				//* corrugated cost
				if (comp.corrugated_layer) {
					if (isMultipleF) {
						arr[index].paper += comp.corrugated_layer.price?.reduce((total, obj) => total += obj.price, 0) || 0
					} else {
						arr[index].corrugated += comp.corrugated_layer.price[index].price
					}
				}

				//* plate, print cost
				if (isMultipleF) {
					arr[index].plate += comp.paper_usage?.line?.reduce((total, obj) => total += (
						obj.price.plate.outside.price +
						obj.price.plate.inside.price +
						(obj.price.plate?.reprint?.outside?.price || 0) +
						(obj.price.plate?.reprint?.inside?.price || 0)
					) || 0, 0)
					arr[index].print += comp.paper_usage?.line?.reduce((total, obj) => total += (obj.price.print.outside.price + obj.price.print.inside.price) || 0, 0)
					if (['Jet Press', 'Konica'].includes(printType)) {
						arr[index].proof += comp.paper_usage?.line?.reduce((total, obj) => total += (obj.price.proof.all.price) || 0, 0)
					}

				} else {
					arr[index].plate += comp.paper_usage.line[index].price.plate.outside.price
					arr[index].plate += comp.paper_usage.line[index].price.plate.inside.price
					arr[index].plate += comp.paper_usage.line[index].price.plate?.reprint?.outside?.price || 0
					arr[index].plate += comp.paper_usage.line[index].price.plate?.reprint?.inside?.price || 0

					arr[index].print += comp.paper_usage.line[index].price.print.outside.price
					arr[index].print += comp.paper_usage.line[index].price.print.inside.price
					if (['Jet Press', 'Konica'].includes(printType)) {
						arr[index].proof += comp.paper_usage.line[index].price.proof.all.price
					}
				}

				//* block, afterpress cost [emboss, deboss, foilstamp]
				comp.addon.forEach((addon) => {
					if (addon.type == 'emboss' || addon.type == 'deboss') {
						arr[index].block += addon.line?.block?.reduce((total, block) => total += block?.line[index]?.price || 0, 0)
						// arr[index].block += addon.line[index].block.price
						arr[index].afterpress += addon.line?.labor[index].price
					} else if (addon.type == 'foilstamp') {
						arr[index].block += addon.line[index].block.price
					} else {
						arr[index].afterpress += addon.line[index].price
					}
				})

				//* start foilstamp
				const foilstampAddon = comp.addon.filter(obj => obj.type === 'foilstamp')
				const num_process = []

				foilstampAddon.forEach((addon, index) => {
					const process_index = addon?.info?.process_index >= 0 ? addon?.info?.process_index : index
					if (!num_process.includes(process_index)) {
						num_process.push(process_index)
					}
				})

				num_process.forEach(process_id => {
					const foilstampSize = foilstampAddon.filter((addon, a_index) =>
						addon?.info?.process_index >= 0
							? addon?.info?.process_index === process_id
							: a_index === process_id
					)

					const summary = {
						foilRoll: [],
						foilStamp: []
					}

					for (let qtyIndex = 0; qtyIndex < est.mainData.qty.totalqty.length; qtyIndex++) {
						summary.foilRoll.push({
							unit_price: 0,
							qty: 0,
							price: 0
						})
						summary.foilStamp.push({
							unit_price: 0,
							qty: 0,
							price: 0
						})
					}

					foilstampSize.forEach((size, sizeIndex) => { //* foilstamp size แต่ละกรอบ [x*y , x*y]
						const { line } = size
						line.forEach((qtyDetail, qtyIndex) => {
							const { labor, foil_roll } = qtyDetail

							summary.foilRoll[qtyIndex].unit_price += foil_roll.unit_price
							summary.foilRoll[qtyIndex].qty = foil_roll.qty
							summary.foilRoll[qtyIndex].price += foil_roll.qty * foil_roll.unit_price
							//* คิดค่า stamp ครั้งเดียว
							summary.foilStamp[qtyIndex].unit_price = labor.unit_price
							summary.foilStamp[qtyIndex].qty = labor.qty
							summary.foilStamp[qtyIndex].price = labor.price
						})

					})


					//* check min price
					foilstampSize.forEach((size, sizeIndex) => {
						const { line, info: { foil_roll_min_price = 0 } } = size

						let roll_min_price = parseFloat((foil_roll_min_price * (1 + (material_price_marking / 100))).toFixed(2))

						line.forEach((qtyDetail, qtyIndex) => {
							summary.foilRoll[qtyIndex].price = summary.foilRoll[qtyIndex].price < foil_roll_min_price ? roll_min_price : summary.foilRoll[qtyIndex].price
						})
					})

					arr[index].afterpress += (summary.foilRoll[index].price + summary.foilStamp[index].price)

				})
				//* end foilstamp


				if (comp.color?.length > 0) {
					comp?.color?.forEach(col => {
						// col?.special_ink.forEach((item2) => {
						// 	arr[index].special_ink += item2.line[index].price
						// })

						arr[index].special_ink += col?.special_ink.reduce((total, obj) => total += obj?.line[index].price, 0)
					})
				}

				comp.process.forEach((item2) => {
					if (item2.name == 'diecut') {
						arr[index].afterpress += item2.line[index].labor.price
						arr[index].block += item2.line[index].block.price
					} else {
						arr[index].afterpress += item2.line[index].price
					}
				})

				if (isMultipleF) {
					if (this.mainData.job?.is_different_packing) {
						//* Different Packing
						comp?.f_detail?.f_list.forEach((fInfo, fIndex) => {
							comp.packing[fIndex].forEach((packing) => {
								// ! update 13.05.22 change delivery process
								// arr[index].delivery += packing.line[index].price
								// ? index = qty index
								if (checkDelivery) {
									//* UPDATE : 20.05.22 index = totalqty index
									arr[index].delivery += packing.detail?.reduce((prev, curr) => prev += curr.detail[index].price, 0)
								} else {
									arr[index].delivery += packing.line[index].price
								}
							})
						})
					} else {
						//* Multiple F AND same packing
						comp.packing[0].forEach((packing) => {
							// ! update 13.05.22 change delivery process
							// arr[index].delivery += packing.line[index].price
							// ? index = qty index
							if (checkDelivery) {
								//* UPDATE : 20.05.22 index = totalqty index
								arr[index].delivery += packing.detail?.reduce((prev, curr) => prev += curr.detail[index].price, 0)
							} else {
								arr[index].delivery += packing.line[index].price
							}
						})
					}
				} else {
					comp.packing[0].forEach((packing) => {
						// ! update 13.05.22 change delivery process
						// arr[index].delivery += packing.line[index].price
						// ? index = qty index
						if (checkDelivery) {
							//* UPDATE : 20.05.22 index = totalqty index
							arr[index].delivery += packing.detail?.reduce((prev, curr) => prev += curr.detail[index].price, 0)
						} else {
							arr[index].delivery += packing.line[index].price
						}
					})
				}

				if (comp.delivery && !checkDelivery) {
					arr[index].delivery += comp.delivery[0].price[index].price
				}
			})

			if (checkDelivery) {
				//* UPDATE : 20.05.22
				arr[index].delivery += this.mainData?.delivery?.reduce((totalRound, round) => totalRound += round?.rate_line?.reduce((totalLine, line) => totalLine += line[index].price, 0), 0)
			}

			this.mainData.material.forEach((item1) => {
				if (isMultipleF) {
					arr[index].material += item1.line.reduce((total, curr) => total += curr.price, 0)
				} else {
					arr[index].material += item1.line[index].price
				}
			})

			this.mainData.process.forEach((item1) => {
				if (isMultipleF && ['other', 'handwork', 'custom'].includes(item1.type)) {
					arr[index].afterpress += item1.line.reduce((total, curr) => total += curr.price, 0)
				} else {
					arr[index].afterpress += item1.line[index].price
				}
			})

			this.mainData?.otherCost?.forEach((item1) => {
				if (isMultipleF) {
					arr[index].other += item1.line.reduce((total, curr) => total += curr.price, 0)
				} else {
					arr[index].other += item1.line[index].price
				}
			})


			arr[index].price_diff = (this.mainData.qty.main[index] * this.mainData?.priceDiff[index]) || 0
			// arr[index].customer_gift = (this.mainData.qty.main[index] * this.mainData?.customer_gift[index]) || 0
			arr[index].customer_gift = this.mainData?.customer_gift[index] || 0


			arr[index].total_price =
				arr[index].paper
				+ arr[index].corrugated
				+ arr[index].special_ink
				+ arr[index].material
				+ arr[index].plate
				+ arr[index].print
				+ arr[index].proof
				+ arr[index].afterpress
				+ arr[index].block
				+ arr[index].delivery
				+ arr[index].other

			arr[index].sub_total_price_material =
				arr[index].paper
				+ arr[index].corrugated
				+ arr[index].special_ink
				+ arr[index].material

			arr[index].sub_total_price_production =
				+ arr[index].plate
				+ arr[index].print
				+ arr[index].proof
				+ arr[index].afterpress
				+ arr[index].block
				+ arr[index].delivery
				+ arr[index].other

			const unit_price_material = parseFloat((arr[index].sub_total_price_material / this.mainData.qty.main[index]).toFixed(2))
			const unit_price_production = parseFloat((arr[index].sub_total_price_production / this.mainData.qty.main[index]).toFixed(2))

			const newPrice = {
				raw: arr[index],
				special_ink: parseFloat((arr[index].special_ink)),
				material: parseFloat((arr[index].paper + arr[index].corrugated + arr[index].material + arr[index].special_ink).toFixed(2)),
				plate: parseFloat((arr[index].plate).toFixed(2)),
				proof: parseFloat((arr[index].proof).toFixed(2)),
				print: parseFloat((arr[index].print).toFixed(2)),
				afterpress: parseFloat((arr[index].afterpress + arr[index].block).toFixed(2)),
				block: parseFloat((arr[index].block).toFixed(2)),
				delivery: parseFloat((arr[index].delivery).toFixed(2)),
				other: parseFloat((arr[index].other).toFixed(2)),
				mark_up_percent: arr[index].mark_up_percent,
				mark_up_price: this.getMarkingPrice(arr[index].total_price, arr[index].mark_up_percent),
				mark_down_percent: arr[index].mark_down_percent,
				mark_down_price: this.getMarkingPrice(arr[index].total_price, arr[index].mark_down_percent),
				customer_gift: arr[index].customer_gift,
				price_diff: arr[index].price_diff,
				total_price: 0,
				total_with_price_diff: 0,

				sub_total_price_material: parseFloat((arr[index].sub_total_price_material).toFixed(2)), //* ก่อน markup
				marking_material_percent,
				total_marking_material: 0, //* markup
				sub_total_price_material_marking: 0, //* หลัง markup
				unit_price_material: unit_price_material, //* unit price ก่อน markup
				unit_price_material_marking: 0, //* unit price หลัง markup

				sub_total_price_production: parseFloat((arr[index].sub_total_price_production).toFixed(2)), //* ก่อน markup
				marking_production_percent,
				total_marking_production: 0, //* markup
				sub_total_price_production_marking: 0, //* หลัง markup
				unit_price_production: unit_price_production,
				unit_price_production_marking: 0,

				// total_marking_material_production: parseFloat((arr[index].sub_total_price_material_marking + arr[index].sub_total_price_production_marking).toFixed(2))
			}

			const priceMarking = this.calculateMaterialProductionMarking(index, newPrice)

			const extraCost = arr[index].price_diff + arr[index].customer_gift

			let total_price = this.setPriceAfterMarking(arr[index].total_price, (arr[index].mark_up_percent - arr[index].mark_down_percent))
			let total_with_price_diff = total_price + extraCost

			if (checkSystemVersion(this.getSystemVersion(), 3.1)) {
				total_price = priceMarking.total_price_marking_material_production
				total_with_price_diff = total_price + extraCost
			}

			this.mainData.totalprice.push({
				...newPrice,
				...priceMarking,
				total_price,
				total_with_price_diff
			})
		})

		this.setCalculateTax()

		const processInfoBuilder = new ProcessInfoBuilder(this)
		this.mainData.component1.forEach((comp, compIndex) => {
			processInfoBuilder.buildProcessInfo(compIndex)
		})

		const targetLength = this.mainData.qty.totalqty.length

		// Initialize process_info structure
		this.mainData.process_info = {
			material: [],
			plate: [],
			proof: [],
			print: [],
			process: [],
			other: [],
			handwork: [],
			packing: []
		}

		processInfoBuilder.addMaterialProcess(null, targetLength)
		processInfoBuilder.addChipProcess(null, targetLength)
		processInfoBuilder.addInspectionProcess(null, targetLength)
		processInfoBuilder.addCustomProcess(null, targetLength)
		processInfoBuilder.addOtherCostProcess(null, targetLength)
		processInfoBuilder.addShrinkwrapProcess(null, targetLength)
		processInfoBuilder.addBagProcess(null, targetLength)
		processInfoBuilder.addTrimProcess(null, targetLength)
	}

	setSystemVersion(version) {
		this.mainData.SYSTEM_VERSION = version
	}

	getSystemVersion() {
		return this.mainData.SYSTEM_VERSION || 0
	}

	getDefaultMarkingPercent(qty) {
		let marking = {
			mark_up_percent: 0,
			mark_down_percent: 0
		}
		const markingInfo = db.db.marking_price_info.find((item) => qty >= item.min_qty && qty <= item.max_qty)
		if (markingInfo) {
			marking = {
				...marking,
				mark_up_percent: Math.abs(markingInfo.mark_up_percent || 0),
				mark_down_percent: Math.abs(markingInfo.mark_down_percent || 0),
			}
		}
		return marking
	}
	getMarkingPrice(totalprice, markingPercent) {
		return parseFloat((totalprice * (markingPercent / 100)).toFixed(2))
	}


	setPriceAfterMarking(totalprice, marking_percent) {
		const markingPrice = totalprice * (marking_percent / 100)
		const priceAfterMarking = totalprice + markingPrice
		return parseFloat(priceAfterMarking.toFixed(2))
	}

	setCalculatePriceAfterMarking(index) {
		const thisTotalPrice = this.mainData.totalprice[index] || {}
		const prev_total_price =
			thisTotalPrice.material
			+ thisTotalPrice.plate
			+ thisTotalPrice.print
			+ thisTotalPrice.proof
			+ thisTotalPrice.afterpress
			+ thisTotalPrice.delivery
			+ thisTotalPrice.other

		const {
			mark_up_percent = 0,
			mark_down_percent = 0,
			price_diff = 0,
			customer_gift = 0
		} = thisTotalPrice

		// * 1
		const total_price = this.setPriceAfterMarking(prev_total_price, mark_up_percent - mark_down_percent)
		const total_with_price_diff = total_price + price_diff + customer_gift
		this.mainData.totalprice[index] = {
			...this.mainData.totalprice[index],
			total_price,
			mark_up_percent: mark_up_percent,
			mark_up_price: this.getMarkingPrice(prev_total_price, mark_up_percent),
			mark_down_percent: mark_down_percent,
			mark_down_price: this.getMarkingPrice(prev_total_price, mark_down_percent),
			total_with_price_diff
		}

		this.setCalculateTax()
	}

	setCalculatePriceAfterMarking2(index) {
		const thisTotalPrice = this.mainData.totalprice[index] || {}
		const priceMarking = this.calculateMaterialProductionMarking(index, thisTotalPrice)

		const {
			total_marking_material,
			sub_total_price_material_marking,
			unit_price_material_marking,

			total_marking_production,
			sub_total_price_production_marking,
			unit_price_production_marking,

			total_marking_material_production, //* production + material
			total_price_marking_material_production //* "total" production + material
		} = priceMarking

		const {
			mark_up_percent = 0,
			mark_down_percent = 0,
			price_diff = 0,
			customer_gift = 0
		} = thisTotalPrice

		// * 1
		const extraCost = price_diff + customer_gift
		const total_price = sub_total_price_material_marking + sub_total_price_production_marking

		const total_with_price_diff = total_price + extraCost

		console.log("setCalculatePriceAfterMarking2", index, priceMarking, total_price)
		this.mainData.totalprice[index] = {
			...this.mainData.totalprice[index],
			...priceMarking,
			total_price,
			mark_up_percent: mark_up_percent,
			mark_up_price: 0,
			mark_down_percent: mark_down_percent,
			mark_down_price: 0,
			total_with_price_diff
		}

		this.setCalculateTax()
	}

	calculateMaterialProductionMarking(index = 0, objPrice = {}) {
		const {
			marking_material_percent = 0,
			marking_production_percent = 0,
			sub_total_price_material = 0,
			sub_total_price_production = 0
		} = objPrice || {}

		const qty = this.mainData.qty.main[index] || 0

		// * --------- Marking Material ----------------
		const total_marking_material = parseFloat((sub_total_price_material * (marking_material_percent / 100)).toFixed(2))
		const sub_total_price_material_marking = parseFloat((sub_total_price_material + total_marking_material).toFixed(2))
		const unit_price_material_marking = parseFloat((sub_total_price_material_marking / qty).toFixed(2))

		// * --------- Marking Production ----------------
		const total_marking_production = parseFloat((sub_total_price_production * (marking_production_percent / 100)).toFixed(2))
		const sub_total_price_production_marking = parseFloat((sub_total_price_production + total_marking_production).toFixed(2))
		const unit_price_production_marking = parseFloat((sub_total_price_production_marking / qty).toFixed(2))

		const total_marking_material_production = parseFloat((total_marking_material + total_marking_production).toFixed(2))

		const total_price_marking_material_production = parseFloat((sub_total_price_material_marking + sub_total_price_production_marking).toFixed(2))

		return {
			total_marking_material,
			sub_total_price_material_marking,
			unit_price_material_marking,

			total_marking_production,
			sub_total_price_production_marking,
			unit_price_production_marking,

			total_marking_material_production, //* production + material
			total_price_marking_material_production //* "total" production + material
		}
	}

	setCalculateTax() {
		this.mainData.totalprice.forEach((item) => {
			const total_with_price_diff = item?.total_with_price_diff || 0
			item.tax = parseFloat((total_with_price_diff * this.mainData.tax / 100).toFixed(2))
			item.final_price = parseFloat((total_with_price_diff + item.tax).toFixed(2))
		})

		// * cancel 21.09.23 ยกเลิกการคิด profit sharing จากยอดรวม
		this.setCalculateProfitSharingTotalPrice()
		this.setCalculateUnitPrice()
		this.setCalculateUnitPriceExchangeRate(this.mainData?.exchange_rate || 1)
		setDefaultLoss()
	}

	setCalculateProfitSharingTotalPrice() {
		const {
			is_cancel_total_profit_sharing = false
		} = this.mainData?.job

		const {
			marking_total_price: {
				min = 0,
				percent = 0
			}
		} = defaultData || {}

		if (is_cancel_total_profit_sharing) {
			return false
		}

		this.mainData.totalprice.forEach((item) => {
			const profit_sharing = Math.max(min, (item.final_price * (percent / 100)))
			item.profit_sharing = parseFloat((profit_sharing).toFixed(2))
			item.final_price = item.final_price + item.profit_sharing
		})
	}

	setCalculateUnitPrice() {
		this.mainData.totalprice.forEach((item, index) => {
			item.unit_price = parseFloat(((item.final_price) / this.mainData.qty.main[index]).toFixed(2))
		})

		this.setCalculateUnitPriceExchangeRate(this.mainData?.exchange_rate || 1)
	}

	setCalculateUnitPriceExchangeRate(exchange_rate = 1) {
		this.mainData.totalprice.forEach((item, index) => {
			console.log("calculate exchange", index, item?.unit_price, exchange_rate)
			item.unit_price_exchange = parseFloat((item.unit_price / exchange_rate).toFixed(4))
		})
	}

	getOpenSize(index) {
		return this.mainData.component1[index].packaging_size.open_size
	}

	getFoldSize(index) {
		return this.mainData.component1[index].packaging_size.fold_size
	}

	getPackingSize(item) {
		var packing_size = this.setCalculatePackingSize(item)
		return packing_size
	}

	getMainData() {
		return this.mainData
	}

	setLayoutTolerance(layout, tolerance, compType, paperSize = []) {
		if (!tolerance) console.error("setLayoutTolerance Error. Missing tolerance.")
		const {
			shortSide: shortSideComponent = 0,
			longSide: longSideComponent = 0
		} = this.getLayoutPaperTolarance(compType, tolerance)

		return layout.map((obj) => {
			let wSide = 0, lSide = 0;

			if (paperSize[0] <= paperSize[1]) {
				wSide = obj?.printing[0] + shortSideComponent
				lSide = obj?.printing[1] + longSideComponent
			} else {
				wSide = obj?.printing[0] + longSideComponent
				lSide = obj?.printing[1] + shortSideComponent
			}

			return [
				mm2inch(wSide),
				mm2inch(lSide),
				wSide,
				lSide
			]
		})
	}

	getLayoutPaperTolarance(compType, tolerance) {
		const printType = getPrintType()
		const { paper_edge = 4, gripper = 12, color_bar = 8 } = tolerance || {}

		let shortSide = 0, longSide = 0

		switch (compType) {
			case 1:
			case 2:
				shortSide = gripper + color_bar
				longSide = paper_edge * 2
				break;
			case 3:
				shortSide = gripper + color_bar + (paper_edge * 2)
				longSide = paper_edge * 2
				break;
			default:
				shortSide = gripper + color_bar
				longSide = paper_edge * 2
				break;
		}

		if (printType == 'Konica') {
			shortSide = paper_edge * 2
			longSide = paper_edge + gripper
		}

		return { shortSide, longSide }
	}

	getLayoutPaperSize(paperSize = [], tolerance = { shortSide: 0, longSide: 0 }) {
		const { shortSide, longSide } = tolerance || {}

		const sideShorter = paperSize[0] < paperSize[1] ? 'W' : 'L'

		let newSize = []

		if (sideShorter == 'W') {
			newSize = [
				toNumber(paperSize[0] - shortSide, 2),
				toNumber(paperSize[1] - longSide, 2),
				toNumber(paperSize[2] - mm2inch(shortSide), 2),
				toNumber(paperSize[3] - mm2inch(longSide), 2),
			]
		} else {
			newSize = [
				toNumber(paperSize[0] - longSide, 2),
				toNumber(paperSize[1] - shortSide, 2),
				toNumber(paperSize[2] - mm2inch(longSide), 2),
				toNumber(paperSize[3] - mm2inch(shortSide), 2),
			]
		}

		return newSize
	}

	calculateLayoutDetail(template, packaging_size, paperSize, tolerance, laying = 'vertical') {
		//* require components to calculate.
		const {
			open_size
			, length: l
			, width: w
			, depth: d
			, glue_flap: g
			, tuck_flap: t
			, dust_flap: dust
			, ol
		} = packaging_size
		const { gripper, color_bar, paper_edge, bleed } = tolerance
		const [paperWidth, paperLength] = paperSize

		//* initial obj.
		const layoutDetail = {
			wSideSize: 0,
			lSideSize: 0,
			wSideAmount: 1,
			lSideAmount: 1,
			totalAmount: 0,
			printSize: [],
			layoutSize: [],
			layout: []
		}
		//* initial var.
		let printSizeW, printSizeL = 0
		let layoutW, layoutL = 0
		let shortSide = 'W'
		const shortSideComponent = gripper + color_bar
			, longSideComponent = paper_edge * 2

		//?---------------------------------------
		//* initial calculate side size case.
		let wCase, lCase = 0.0
		switch (template) {
			case 1:
				// find w case to cal w side
				dust <= ((w + t) / 2) ? wCase = 1.1 : wCase = 1.2
				lCase = 1.0
				break
			case 2:
				wCase = 2.1
				lCase = 2.0
				//todo overlap case
				break
			case 3:
				wCase = 3.1
				lCase = 3.0
				//todo overlap case
				break
			case 4:
				wCase = 4.1
				lCase = 4.0
				//todo overlap case
				break
			case 5:
				wCase = 5.0
				lCase = 5.0
				break
			case 6:
				wCase = 6.0
				lCase = 6.0
				break
			case 7:
				g <= (l + dust) / 2 ? wCase = 7.1 : wCase = 7.2
				lCase = 7.0
				break
			case 8:
				wCase = 8.1
				lCase = 8.1
				//todo lCase = 8.0 when w amount is 1
				break
			case 9:
				wCase = 9.0
				lCase = 9.0
				break
			case 10:
				wCase = 10.0
				lCase = 10.0
				break
			case 11:
				wCase = 11.0
				lCase = 11.0
				break
			case 12:
			default:
				break
		}

		//?---------------------------------------
		//? set & cal each side size
		// init amount = 1
		if (![12].includes(template)) {
			layoutDetail.wSideSize = this.setCalculateWSide(wCase, layoutDetail.wSideAmount, w, l, d, bleed, dust, ol, g, t)
			layoutDetail.lSideSize = this.setCalculateLSide(lCase, layoutDetail.lSideAmount, w, l, d, bleed, dust, ol, g)
		} else {
			// template = 12 Custom 
			layoutDetail.wSideSize = open_size[2] + 2 * bleed
			layoutDetail.lSideSize = open_size[3] + 2 * bleed
		}


		//?---------------------------------------
		//? Calc first max laying each side

		//* vertical lay w / w
		if (laying === 'vertical') {
			//! find amount of layout by paper / sideSize
			layoutDetail.wSideAmount = Math.floor(paperWidth / layoutDetail.wSideSize)
			layoutDetail.lSideAmount = Math.floor(paperLength / layoutDetail.lSideSize)
			// calc. vertical laying print size
			//! case 1
			// printSizeW = layoutDetail.wSideAmount * layoutDetail.wSideSize
			// printSizeL = layoutDetail.lSideAmount * layoutDetail.lSideSize
			//! case 2
			if (![12].includes(template)) {
				printSizeW = this.setCalculateWSide(wCase, layoutDetail.wSideAmount, w, l, d, bleed, dust, ol, g, t)
				printSizeL = this.setCalculateLSide(lCase, layoutDetail.lSideAmount, w, l, d, bleed, dust, ol, g)
			} else {
				printSizeW = layoutDetail.wSideAmount * layoutDetail.wSideSize
				printSizeL = layoutDetail.lSideAmount * layoutDetail.lSideSize
			}
		} else {
			//* horizontal lay w / l
			layoutDetail.wSideAmount = Math.floor(paperWidth / layoutDetail.lSideSize)
			layoutDetail.lSideAmount = Math.floor(paperLength / layoutDetail.wSideSize)
			// calc. horizontal laying print size
			// printSizeW = layoutDetail.wSideAmount * layoutDetail.lSideSize
			// printSizeL = layoutDetail.lSideAmount * layoutDetail.wSideSize
			//! case 2
			if (![12].includes(template)) {
				printSizeW = this.setCalculateWSide(wCase, layoutDetail.lSideAmount, w, l, d, bleed, dust, ol, g, t)
				printSizeL = this.setCalculateLSide(lCase, layoutDetail.wSideAmount, w, l, d, bleed, dust, ol, g)
			} else {
				printSizeW = layoutDetail.wSideAmount * layoutDetail.lSideSize
				printSizeL = layoutDetail.lSideAmount * layoutDetail.wSideSize
			}
		}


		//?---------------------------------------
		//? find short , long side & calc. layout size

		if (printSizeW <= printSizeL) {
			layoutW = printSizeW + shortSideComponent
			layoutL = printSizeL + longSideComponent
		} else {
			shortSide = 'L'
			layoutW = printSizeW + longSideComponent
			layoutL = printSizeL + shortSideComponent
		}


		//?---------------------------------------
		//? Calc. max lyaing
		//* 1. find best fit amount width side laying
		while (layoutW > paperWidth) {
			// 1.1.	Decrease width side laying
			layoutDetail.wSideAmount += -1

			// 1.2.	Calc. print size
			if (![12].includes(template)) {
				printSizeW = this.setCalculateWSide(wCase, layoutDetail.wSideAmount, w, l, d, bleed, dust, ol, g, t)
			} else {
				if (laying === 'vertical') {
					printSizeW = layoutDetail.wSideAmount * layoutDetail.wSideSize
				} else {
					printSizeW = layoutDetail.wSideAmount * layoutDetail.lSideSize
				}
			}
			// 1.3. Set layout component
			shortSide === 'W'
				? layoutW = printSizeW + shortSideComponent
				: layoutW = printSizeW + longSideComponent
		}


		//* 2. find best fit amount length side laying
		while (layoutL > paperLength) {
			// 2.1. Decrease length side laying
			layoutDetail.lSideAmount += -1

			// 2.2.	Calc. print size
			if (![12].includes(template)) {
				printSizeL = this.setCalculateLSide(lCase, layoutDetail.lSideAmount, w, l, d, bleed, dust, ol, g)
			} else {
				if (laying === 'vertical') {
					printSizeL = layoutDetail.lSideAmount * layoutDetail.lSideSize
				} else {
					printSizeL = layoutDetail.lSideAmount * layoutDetail.wSideSize
				}
			}

			// 2.3. Set layout component
			shortSide === 'W'
				? layoutL = printSizeL + longSideComponent
				: layoutL = printSizeL + shortSideComponent


		}

		//! template 8 
		if ([8].includes(template)) {
			if (laying === 'vertical') {
				if (layoutDetail.wSideAmount === 1) {
					layoutDetail.lSideSize = this.setCalculateLSide(8.0, 1, w, l, d, b, dust, ol, g)
					layoutDetail.lSideAmount = Math.floor(paperLength / layoutDetail.lSideSize)

					printSizeL = layoutDetail.lSideAmount * layoutDetail.lSideSize

					shortSide === 'W'
						? layoutL = printSizeL + longSideComponent
						: layoutL = printSizeL + shortSideComponent

					if (layoutL > paperLength) {
						layoutDetail.lSideAmount += -1
						printSizeL = layoutDetail.lSideAmount * layoutDetail.lSideSize
					}
				} else {
					printSizeL = printSizeL
				}
			} else {
				if (layoutDetail.lSideAmount === 1) {
					layoutDetail.lSideSize = this.setCalculateLSide(8.0, 1, w, l, d, b, dust, ol, g)
					layoutDetail.wSideAmount = Math.floor(paperWidth / layoutDetail.lSideSize)

					printSizeW = layoutDetail.wSideAmount * layoutDetail.lSideSize

					shortSide === 'W'
						? layoutW = printSizeW + longSideComponent
						: layoutW = printSizeW + shortSideComponent

					if (layoutW > paperWidth) {
						layoutDetail.wSideAmount += -1
						printSizeW = layoutDetail.wSideAmount * layoutDetail.lSideSize
					}
				} else {
					printSizeW = printSizeW
				}
			}
		}

		// const calPrintSize = ({template,wCase,lCase,wAmount,lAmount})

		// if(laying === 'vertical'){
		// 	if(layoutDetail.wSideAmount === 1){
		// 		switch (template) {
		// 			case 8:
		// 				lCase = 8.0
		// 				break
		// 			default:
		// 				break
		// 		}
		// 		printSizeL = this.setCalculateWSide(wCase,1,w,l,d,bleed,dust,ol,g,t)
		// 		layoutDetail.wSideAmount = Math.floor(paperWidth / printSizeL)
		// 	}
		// }else{
		// 	if(layoutDetail.lSideAmount === 1){

		// 	}
		// }

		//?---------------------------------------
		//? Summary.

		layoutDetail.printSize = [printSizeW, printSizeL]
		layoutDetail.layoutSize = [layoutW, layoutL]
		layoutDetail.layout = [layoutDetail.wSideAmount, layoutDetail.lSideAmount]
		layoutDetail.totalAmount = layoutDetail.wSideAmount * layoutDetail.lSideAmount

		return layoutDetail
	}

	setSelectedLayoutGrain(index, layout_grain) {
		const item = est.mainData.component1[index]
		let tempLayoutGrain = "horizontal"
		if (layout_grain) {
			tempLayoutGrain = layout_grain
		} else {
			tempLayoutGrain = $(`.layout_grain[index=${index}]`).val()
		}
		item.layout = {
			...item.layout,
			layout_grain: tempLayoutGrain
		}
	}


	checkSelectedGrainLaying(index, laying) {
		const {
			component_type: {
				type = 0
			},
			layout = {}
		} = est.mainData.component1[index] || {}

		let filterLaying = laying,
			collect_laying = ''

		if ([3].includes(type)) {

			const {
				corrugated_layer: {
					component_flute_side = 'short_side', //* short_side, long_side
					info: {
						corrugated_flute_side = 'WSize',
						is_price_per_sheet = false
					}
				}
			} = est.mainData.component1[index] || {}

			// if (is_price_per_sheet) {
			switch (true) {
				case corrugated_flute_side == 'WSize' && component_flute_side == 'short_side':
					console.log("case1")
				case corrugated_flute_side == 'LSize' && component_flute_side == 'long_side':
					console.log("case2")
					collect_laying = 'vertical'
					break;
				case corrugated_flute_side == 'WSize' && component_flute_side == 'long_side':
					console.log("case3")
				case corrugated_flute_side == 'LSize' && component_flute_side == 'short_side':
					console.log("case4")
					collect_laying = 'horizontal'
					break;
				default:
					console.log("default")
					break;
			}

			if (collect_laying) {
				filterLaying = laying.filter(lay => lay.laying == collect_laying)
			}
			// }

			console.log("corrugated_flute_side", corrugated_flute_side, component_flute_side)
			console.log("component type 3 laying : ", collect_laying, filterLaying)
			laying = filterLaying
		}

		if ([1, 2].includes(type)) {
			//* 1, 2
			// if (layout?.layout_grain) {
			switch (layout?.layout_grain) {
				case 'vertical':
					filterLaying = laying.filter(lay => lay.grain_box_type == 'vertical')
					break;
				case 'horizontal':
				default:
					this.setSelectedLayoutGrain(index, "horizontal")
					filterLaying = laying.filter(lay => lay.grain_box_type == 'horizontal')
					break;
			}
			// }
		}

		if ([2].includes(type) && !filterLaying.length) {
			console.log("can't find absolute laying in checkSelectedGrainLaying function.", filterLaying, laying)
			filterLaying = laying
		}


		return filterLaying
	}

	checkPaperMaxSizeMachine(index) {
		let validate = {
			match: false,
			matchIndex: null,
		}
		const item = est.mainData.component1[index]
		const { machine: { l_range, w_range }, component_type: { type: compType } } = item

		const { short_side, long_side, board_size } = getShortLongSide(item)

		if (compType == 3) {
			// * เฉพาะลูกฟูก  Flexo เทียบด้าน : ด้าน (ด้านซ้ายเป็นลอนเสมอ) 08.01.25
			// * condition ref code: FLEXO080125

			if (
				board_size[2] >= w_range[2]
				&& board_size[2] <= w_range[3]
				&& board_size[3] >= l_range[2]
				&& board_size[3] <= l_range[3]
			) {
				validate.match = true
			}
		} else {

			console.log(`
				${short_side} >= ${w_range[2]}
				&& ${short_side} <= ${w_range[3]}
				&& ${long_side} >= ${l_range[2]}
				&& ${long_side} <= ${l_range[3]}
			`)

			if (
				short_side >= w_range[2]
				&& short_side <= w_range[3]
				&& long_side >= l_range[2]
				&& long_side <= l_range[3]
			) {
				validate.match = true
			}
		}

		return validate
	}

	checkCompareLayingPaperSize(index, laying) {
		const { paperSize } = est.mainData.component1[index]
		return laying.map(lay => {
			const { layout_size } = lay
			if (layout_size[2] <= paperSize[0] && layout_size[3] <= paperSize[1]) {
				return ({ ...lay, pass_laying: true })
			} else {
				return ({ ...lay, pass_laying: false })
			}
		})
	}

	checkSelectedLayout(index, laying) {
		const item = this.mainData.component1[index]
		const { component_type: { type: compType } } = item
		let correctLaying = []

		switch (compType) {
			// correctLaying = laying.laying
			case 1: // not corrug.
			case 2: // with corrug.
				correctLaying = this.checkSelectedGrainLaying(index, laying)
				correctLaying = this.checkCompareMachineSizeLaying(correctLaying, item)
				correctLaying = this.checkCompareLayingPaperSize(index, correctLaying)
				break;
			case 3: // corrug. only
				correctLaying = this.checkSelectedGrainLaying(index, laying)
				console.log("after check flute", correctLaying)
				correctLaying = this.checkCompareMachineSizeLaying(correctLaying, item)
				console.log("after check machine size", correctLaying)
				break;
			default:
				break;
		}

		// find best laying and min area used and use that layout
		var num = this.checkMaximunNumLayout(correctLaying)
		return { correctLaying, selected_layout: this.checkMinAreaUsageLayout(correctLaying, num) }
	}

	getDeliveryPrice(totalqty = [], delivery_rate, unit_price, line = []) {
		const arrPrice = totalqty.map((_, index1) => {
			const qty = line[index1].qty
			if (qty * unit_price < delivery_rate) {
				// * ถ้าค่าส่งต่ำกว่า delivery_rate ให้ใช้ delivery_rate
				var price = delivery_rate
			} else {
				var price = parseFloat((qty * unit_price).toFixed(2))
			}

			return {
				qty,
				unit_price,
				price
			}
		})

		return arrPrice
	}

	setCalculateDeliveryPrice() {
		const isMultipleF = getIsMultipleF()
		const { qty: { totalqty } } = this.mainData || {};
		const {
			delivery_marking = 0
		} = defaultData || {}

		this.mainData?.delivery?.forEach((round) => {
			const delivery_rate_list = getDeliveryRate(round.destinationId);
			let net_weight = []
			//* วนลูป รอบส่ง
			if (delivery_rate_list.length <= 0) {
				alert(`พบข้อผิดพลาด กรุณาตรวจสอบสถานที่จัดส่ง รอบที่ ${round.round} ไม่พบสถานที่จัดส่งนี้ในระบบ`);
				return false;
			}

			// *ในการส่งแต่ละรอบมี net_weight เท่าไหร่ (รวมทุก Comp ทุกส่งรอบนั้นๆ)

			if (isMultipleF) {
				const roundWeight = []
				this?.mainData?.component1[0]?.delivery?.forEach(obj => {
					obj?.packing_detail?.forEach(obj2 => {
						if (obj2?.roundId === round.round) {
							const total_weight = obj2?.detail?.reduce((total, curr) => total += curr.total_weight, 0)
							roundWeight.push(total_weight)
						}
					})
				})
				net_weight.push(roundWeight?.reduce((total, curr) => total += curr, 0))
				// detail.total_weight = roundWeight

			} else {
				//* 1. หาว่าแต่ละ comp. มี total_weight ตามแต่ละยอดเท่าไหร่
				round.detail.forEach(detail => {
					/*
						total_weight = [{total_weight ยอดที่ 1, total_weight ยอดที่ 2, ...}]
					*/
					const component = this.mainData.component1[detail.componentId]

					const arr_total_weight = component?.delivery[0]?.packing_detail?.find(obj => obj.roundId === round.round)?.detail || []

					detail.total_weight = arr_total_weight


				})
				//* 2. หา net_weight / รอบ
				// const net_weight = parseFloat(round.detail.reduce((prev,curr) => prev += curr.total_weight[0].total_weight,0).toFixed(3))
				//* หา net_weight ของแต่ละจำนวน totalqty

				//* น้ำหนักรวมทั้งหมดของแต่ละรอบ
				for (let index = 0; index < totalqty.length; index++) {
					net_weight.push(parseFloat(round.detail.reduce((prev, curr) => prev += curr?.total_weight[index].total_weight || 0, 0).toFixed(3)))
				}
			}

			round.qty_rate = net_weight.map((this_net_weight, index) => {
				let rate_by_qty = []
				//! จะเริ่มแก้ปัญหา totalqty โดย ลูบ จาก net_weight
				round.net_weight = this_net_weight
				let balance_weight = this_net_weight
				//* 3. หา rate ส่งตามน้ำหนัก
				console.log("round.destinationId, this_net_weight", round.destinationId, this_net_weight)
				let rate_info1 = getDeliveryRateInfo(round.destinationId, this_net_weight)
				// * หาจำนวนที่ต้องใช้ตามน้ำหนักทั้งหมด
				let qty = Math.floor(this_net_weight / rate_info1.max_weight_kg) //* จำนวนเต็ม
				if (qty <= 0) {
					// * น้ำหนักรวมอยู่ในเกณฑ์
					qty = 1
					balance_weight = 0
				} else {
					// * เหลือเศษ
					balance_weight = this_net_weight % rate_info1.max_weight_kg
				}

				console.log("this_net_weight", this_net_weight, qty)

				rate_by_qty.push({
					net_weight: this_net_weight,
					rate_id: rate_info1.id,
					unit_price: rate_info1.price + rate_info1.additional_price,
					qty,
					additional_price: rate_info1.additional_price,
					price: parseFloat((((rate_info1.price + rate_info1.additional_price) * qty) * (1 + (delivery_marking / 100))).toFixed(2)),
				})

				while (balance_weight > 0) {
					console.log("balance_weight", balance_weight)
					let rate_info2 = getDeliveryRateInfo(round.destinationId, balance_weight)
					console.log("rate_info2", rate_info2)
					let qty2 = Math.floor(balance_weight / rate_info1.max_weight_kg) //* จำนวนเต็ม
					if (qty2 <= 0) {
						// * น้ำหนักรวมอยู่ในเกณฑ์
						qty2 = 1
						balance_weight = 0
					} else {
						// * เหลือเศษ
						balance_weight = balance_weight % rate_info1.max_weight_kg
					}

					const check_rate_exist = rate_by_qty.some(rate => rate.rate_id == rate_info2.id)
					console.log("check_rate_exist", check_rate_exist, rate_by_qty)
					if (check_rate_exist) {
						rate_by_qty = rate_by_qty.map(rate => rate.rate_id == rate_info2.id
							? ({
								...rate,
								qty: rate.qty + qty2,
								price: parseFloat(((rate.unit_price * (rate.qty + qty2)) * (1 + (delivery_marking / 100))).toFixed(2)),
							})
							: rate
						)
					} else {
						rate_by_qty.push({
							net_weight: this_net_weight,
							rate_id: rate_info2.id,
							unit_price: rate_info2.price + rate_info2.additional_price,
							qty: qty2,
							additional_price: rate_info2.additional_price,
							price: parseFloat(((rate_info2.price + rate_info2.additional_price) * qty2) * (1 + (delivery_marking / 100)).toFixed(2)),
						})
					}
				}
				return rate_by_qty
			}) //* close net_weight.map

			const mockUpData = {
				net_weight: 0,
				rate_id: null,
				unit_price: 0,
				qty: 0,
				additional_price: 0,
				price: 0,
			}

			const max_num_rate = round.qty_rate.reduce((max, curr) => max = max < curr.length ? curr.length : max, 0)
			round.qty_rate = round.qty_rate.map(qtyRate => qtyRate.length < max_num_rate ? [...qtyRate, mockUpData] : qtyRate)

			round.rate_line = []
			for (let index = 0; index < max_num_rate; index++) {
				round.rate_line.push(round.qty_rate.map(rate => rate[index]))
			}
		})
	}


	checkIsSplitDelivery() {
		return this.mainData?.delivery?.length > 1 ? true : false
	}

	findMatchStdPaperWithLaySize(stdPaper = [], laySize = []) {
		const matchSizePaper = stdPaper.filter(paper => {
			const { std_paper_size_width_in, std_paper_size_length_in } = paper || {}

			return laySize[0] <= std_paper_size_width_in
				&& laySize[1] <= std_paper_size_length_in
			// return lay_short <= paper_short
			// 	&& lay_long <= paper_long
		})

		return matchSizePaper
	}

	getFCodeIndex(fCode = '') {
		const is_multiple_f = getIsMultipleF()

		if (is_multiple_f && !fCode) {
			alert('พบข้อผิดพลาด ไม่สามารถหาข้อมูล F ได้')
			return false;
		}

		return est.mainData.component1[0].f_detail?.f_list.findIndex(fInfo => fInfo.f_code === fCode)
	}

	setCalculatePackingQty(compIndex = 0, deliveryDetail = [], qty_per_pack = 1, fIndex = 0) {
		const isMultipleF = getIsMultipleF()
		const isDiffPacking = getIsDifferentPacking()
		const isSplitDelivery = getIsSplitDelivery()

		let qtyArr = [],
			packArr = [],
			packQty = 0,
			totalQty = 0

		if (isMultipleF) { //* แบ่ง F
			const { f_detail } = this.mainData.component1[compIndex] || {}

			if (isDiffPacking) { //* แต่ละ F Packing ต่างกัน
				// qtyArr = deliveryDetail.filter(obj => obj.componentId == compIndex && obj.fIndex == fIndex)?.map(obj => obj.qty)
				if (isSplitDelivery) { //* Packing เหมือนกัน - แบ่งส่ง
					qtyArr = deliveryDetail.filter(obj => obj.componentId == compIndex && obj.fIndex == fIndex).map(obj => obj.qty)

				} else { //* Packing เหมือนกัน - ไม่แบ่งส่ง (ใช้ยอดของแต่ละ F)
					qtyArr = [f_detail?.f_qty[fIndex]]
				}
			} else {
				if (isSplitDelivery) { //* Packing เหมือนกัน - แบ่งส่ง
					qtyArr = deliveryDetail.filter(obj => obj.componentId == compIndex).map(obj => obj.qty)

				} else { //* Packing เหมือนกัน - ไม่แบ่งส่ง (ใช้ยอดของแต่ละ F)
					qtyArr = f_detail?.f_qty
				}
			}

		} else { //* ไม่แบ่ง F
			qtyArr.push(deliveryDetail.reduce((prev, curr) => prev += curr.componentId == compIndex
				? curr.qty
				: 0
				, 0)
			)
		}

		// * หาจำนวน Pack แต่ละยอด
		packArr = qtyArr.map(qty => Math.ceil(qty / qty_per_pack))
		// * หาจำนวนรวม Pack
		packQty = packArr.reduce((totalPack, currPack) => totalPack += currPack, 0)

		totalQty = qtyArr.reduce((total, curr) => total += curr, 0)

		return { qtyArr, totalQty, packArr, packQty }
	}


	setStdLayoutSize(index, std_layout_id) {
		this.mainData.component1[index].layout.std_layout_id = std_layout_id
	}

	setColorLimit() {
		const isMultipleF = getIsMultipleF()
		const colorLimit = []
		if (isMultipleF) {
			$('.color_limit_f input').each((index, ele) => {
				const checked = $(ele).closest('tr').find('.chk_color_limit').prop('checked')
				const value = parseInt($(ele).val() || 0)

				colorLimit.push({
					is_color_limit: checked,
					qty: value
				})
			})
		} else {
			$('.inputQty:visible input').each(() => {
				const checked = $('.chk_color_limit:visible').prop('checked')
				const value = parseInt($('.color_limit.color_limit_normal input').val() || 0)
				colorLimit.push({
					is_color_limit: checked,
					qty: value
				})
			})
		}
		this.mainData.job.color_limit = colorLimit
		return colorLimit
	}


	setLoss(loss) {
		this.mainData.job.is_loss = false

		if (loss.length > 0) {
			this.mainData.job.is_loss = true
		}

		this.mainData.totalprice = this.mainData?.totalprice?.map((obj, index) => ({ ...obj, loss: loss[index] || 0 }))
	}


	setPriceDifference(data = []) {
		this.mainData.priceDiff = data
	}

	setCustomerGift(data = []) {
		this.mainData.customer_gift = data
	}

	getComponent(index) {
		return this.mainData.component1[index]
	}

	resetTotalPrice() {
		this.mainData.totalprice = []
	}

	getIsUseReprintPlate() {
		return this.mainData?.component1?.some(comp => comp?.paper_usage?.is_useReprintPlate) || false
	}
}
var est = new Estimate