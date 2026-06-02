function displayEstimateData(data) {
	est.mainData = {}
	est.mainData = data ? data : dat.data_rfq_log.job_data

	console.log("est.mainData", est.mainData)

	let role_data = localStorage.getItem("data")
	role_data = JSON.parse(role_data)

	// return

	if (getPathnameAction(1) == 'view') {
		displaySave(false)
	}

	est.mainData.job.job_id = dat.data_rfq_log.job_id

	checkDefaultValue()
	const mainData = est.mainData

	displayJobInfo2(mainData)
	setJobProfitSharing()
	// displayRejectRemark(dat?.data_rfq_log?.status_id, mainData?.rejectRemark, role_data?.enable_price_check)
	displayJobQty2(mainData)
	displayComponent2(mainData.component1)
	displayProcess(mainData, 'other')
	displayProcess(mainData, 'handwork')
	displayProcess(mainData, 'custom')
	displayMaterial(mainData)
	displayOtherCost(mainData)
	displayFileUpload(mainData)
	displayDelivery(mainData)
	create_tbComponent()
	displayLayout(mainData)
	setDisplayForJetPress()
	setDisplayForKonica()
	displayPriceDifference(mainData?.priceDiff)
	displayCustomerGift(mainData?.customer_gift)


	// console.log("mainData", mainData)
	if (!mainData?.totalprice?.length) {
		$('#calc_layout, #calc_price_after_change').hide()
		$('#calc_price').show()
		// return
	} else {
		// * กรณี delivery ไม่มี rate ให้คำนวณหา rate (แก้ปัญหา RFQ เก่าๆ)
		if (!mainData?.delivery?.every(item => item?.qty_rate?.length)) {
			console.log("fixed delivery bug.")
			est.setCalculateDeliveryPrice()
		}

		summary(true)
		setDivPacking(mainData?.job?.is_different_packing || false)
		displayPacking(mainData)
		summary_excel(true)
		setProfitAndLossQtySection(mainData?.job?.is_loss || false)
		exportExcel()
		$('#excel-bttn,#summary-bttn,#layout-bttn').show()
		$('#calc_layout, #calc_price_after_change').hide()

		$('#calc_price_after_packing').show()
		$('#print').show()

		$('textarea').each((index, ele) => {
			$(ele).css('height', 25 + ele.scrollHeight + 'px')
		})
	}


	checkCopyRFQ()
	checkRequiredInput()
	STATUS.renderDocumentByRoles()
}

function checkDefaultValue() {
	//? for new added value in old rfq
	if (est.mainData.job.print_type == null) {
		est.mainData.job.print_type = 'Offset'
		est.mainData.job.flexo_size = null
	}


	if (est.mainData.customer.customer_id == 'C20120006' && est.mainData.customer.customer_name == 'ลูกค้าใหม่') {
		est.mainData.customer.customer_id = 'C9999998' //? change customer id of 'ลูกค้าใหม่' from C20120006 to C9999998
	}

	est.mainData.material.forEach((item) => {
		if (item.info.from_process == null) {
			item.info.from_process = item.info.comp_index = item.info.process_index = null
		}
	})

	est.mainData.component1.forEach((item) => {
		if (item.box_type.glued_spot == null) {
			//*set glued spot for assembly
			item.box_type.glued_spot = 1
		}
	})

}

function displayJobInfo2(mainData) {

	$('#created_by').html(dat?.data_rfq_log?.created_by || '-')
	$('#updated_by').html(dat?.data_rfq_log?.updated_by || '-')
	$('#ref_copy_rfq').html(dat?.data_rfq_log?.ref_copy_rfq || '---ไม่พบข้อมูล---')
	$('#refCopyID input').val(dat?.data_rfq_log?.ref_copy_rfq || '')
	if (dat?.data_rfq_log?.ref_copy_rfq) {
		$('#ref_copy_rfq').addClass('active')
	}


	$('#rfqID input').val(dat.data_rfq_log.job_id)
	$('#jobName input').val(mainData.job.job_name)
	$('#aeID').val(mainData.ae.ae_id)
	$('#aeName').val(mainData.ae.ae_name)
	$('#aeLabel').val(mainData.ae.ae_id + ': ' + mainData.ae.ae_name)

	setIsViewOnly(mainData.job.estimate_check)

	//* ------ status management ------
	STATUS.setDocStatus({
		status_id: dat?.data_rfq_log?.status_id,
		remark: '',
		history: dat?.data_rfq_log?.status_log || []
	})

	$('#request_for_approve').prop('checked', dat?.data_rfq_log?.request_for_approve)

	//* ------ status management ------
	if (mainData?.estimator?.estimate_check) {
		$('#estID').val(mainData?.estimator?.estimator_id)
		$('#estName').val(mainData?.estimator?.estimator_name)
		$('#estLabel').val(`${mainData?.estimator?.estimator_id}: ${mainData?.estimator?.estimator_name}`)
	}

	$('#custID').val(mainData.customer.customer_id)
	$('#custName').val(mainData.customer?.customer_name)
	$('#customerLabel').val(mainData.customer.customer_id ? mainData.customer.customer_id + ' : ' + mainData.customer?.customer_name : '')

	setCustomerCreditTermInfo(mainData.job)

	if (typeof (dat.data_rfq_log.created.search('/')) == 'number') {
		var date_arr = dat.data_rfq_log.created.split('/')
		// var date = date_arr[2]+'-'+date_arr[1]+'-'+date_arr[0]
		var date = `${date_arr[0]}/${date_arr[1]}/${date_arr[2]}`
	}

	$('#date input').val(date)
	setIsReprint(mainData.job.is_reprinted)
	$('#ink_type select').val(mainData.job.ink_type)
	$('#print_type select').val(mainData.job.print_type)
	$('.chk_profit_sharing').prop('checked', mainData.job?.is_profit_sharing)
	setChangePrintType(mainData.job.print_type)

	if (mainData.job.print_type == 'Flexo') {
		$('#flexo_size').show()
		$('#flexo_size input:eq(0)').val(mainData.job.flexo_size[0])
		$('#flexo_size input:eq(1)').val(mainData.job.flexo_size[1])
	}

	if (mainData.job?.is_multiple_f) {
		toggleMultipleF(true, true)
	}

	if (mainData.job.is_reprinted && mainData.job.print_type == 'Offset') {
		$('.use_prev_plate').show()
		$('#is_use_previous_plate').prop('checked', mainData.job?.is_use_previous_plate)
	}

	getComponentTypeOption()
}

function resetJobInfo() {

	$('#created_by').html('-')
	$('#updated_by').html('-')
	$('#ref_copy_rfq').html('---ไม่พบข้อมูล---')
	$('#refCopyID input').val('')

	$('#ref_copy_rfq').removeClass('active')

	$('#rfqID input').val('')
	$('#jobName input').val('')
	$('#aeID').val('')
	$('#aeName').val('')
	$('#aeLabel').val('')

	//* ------ status management ------
	STATUS.setDocStatus({
		status_id: 0,
		remark: '',
		history: []
	})

	$('#request_for_approve').prop('checked', false)

	//* ------ status management ------
	$('#estID').val('')
	$('#estName').val('')
	$('#estLabel').val('')

	$('#custID').val('')
	$('#custName').val('')
	$('#customerLabel').val('')

	setCustomerCreditTermInfo({})

	if (typeof (dat.data_rfq_log.created.search('/')) == 'number') {
		var date_arr = dat.data_rfq_log.created.split('/')
		// var date = date_arr[2]+'-'+date_arr[1]+'-'+date_arr[0]
		var date = `${date_arr[0]}/${date_arr[1]}/${date_arr[2]}`
	}

	$('#date input').val(date)
	setIsReprint(false)
	$('#ink_type select').val(mainData.job.ink_type)
	$('#print_type select').val(mainData.job.print_type)
	$('.chk_profit_sharing').prop('checked', mainData.job?.is_profit_sharing)
	setChangePrintType(mainData.job.print_type)

	$('#flexo_size').hide()
	$('#flexo_size input:eq(0)').val('')
	$('#flexo_size input:eq(1)').val('')

	toggleMultipleF(false, true)

	$('.use_prev_plate').hide()
	$('#is_use_previous_plate').prop('checked', false)

	getComponentTypeOption()
}

function displayJobQty(mainData) {
	var num_qty = mainData.qty.main.length
	for (var i = 0; i < num_qty; i++) {
		if (i > 0) {
			addQty()
		}
		$('.inputQty input:eq(' + i + ')').val(mainData.qty.main[i])
		$('.runonQty input:eq(' + i + ')').val(mainData.qty.runon[i])
	}
	$('.aeQty input').val(mainData.qty.ae)
	$('.customerQty input').val(mainData.qty.customer)
	$('.runonPercent').val(mainData.qty.runon_percent)
}
function displayJobQty2(mainData) {
	const component = mainData?.component1 || []
	const { is_multiple_f, color_limit } = mainData?.job || {}
	if (is_multiple_f) {
		component.forEach(({ f_detail }, compIndex) => {
			f_detail?.f_list?.forEach((f_info, index) => {
				const {
					f_code,
					f_qty,
					runon_percent,
					runon_qty,
					ae_qty,
					customer_qty,
					total_qty
				} = f_info || {}
				const selector = `.f_table:eq(${index})`

				if (index > 0) {
					addFQty()
				}

				$(`${selector} .f-code`).val(f_code || "")
				$(`${selector} .inputQty input`).val(f_qty || "")
				$(`${selector} .runonPercent`).val(runon_percent || "")
				$(`${selector} .runonQty input`).val(runon_qty || "")
				$(`${selector} .aeQty input`).val(ae_qty || "")
				$(`${selector} .customerQty input`).val(customer_qty || "")
				$(`${selector} .f-totalQty input`).val(total_qty || "")

				if (color_limit[index]?.is_color_limit) {
					$(`${selector} .color_limit_f`).show()
					$(`${selector} .chk_color_limit`).prop('checked', true)
					$(`${selector} .color_limit input`).val(color_limit[index]?.qty || 0)
				}
			})
			const num_qty = f_detail?.f_total_qty
			$(`.f-sumTotalQty:eq(${compIndex})`).val(num_qty)
		})

	} else {

		var num_qty = mainData.qty.main.length

		for (var i = 0; i < num_qty; i++) {
			if (i > 0) {
				addQty()
			}
			$('.inputQty input:eq(' + i + ')').val(mainData.qty.main[i])
			$('.runonQty input:eq(' + i + ')').val(mainData.qty.runon[i])
		}

		$('.aeQty input').val(mainData.qty.ae)
		$('.customerQty input').val(mainData.qty.customer)
		$('.runonPercent').val(mainData.qty.runon_percent)

		if (color_limit[0]?.is_color_limit) {
			$(`.color_limit_normal`).show()
			$(`.chk_color_limit:visible`).prop('checked', true)
			$(`.color_limit_normal.color_limit input`).val(color_limit[0]?.qty || 0)
		}
	}
}

function displayComponent2(component_arr) {
	const inkType = getInkType()
	// if(is_multiple_f){
	component_arr.forEach((comp, index) => {
		const { color, component_name, component_type: { type } } = comp || {}
		var paper_markup = 'none'

		if (comp.component_type.type != 3) {
			paper_markup = comp.paper.paper_markup
		}

		if (index > 0) {
			addComponent(index)
		}

		$(`.component[index=${index}] .nameComp`).val(component_name)
		$(`.component[index=${index}] .componentType`).val(type)
		changeComponent(index, type)
		getFCodeSelectOption() //* get f code for <select></select>
		//* F Color

		$(`.paperMarkup[index=${index}] input`).val(paper_markup != 'none' ? paper_markup : 7)

		displayComponentSpec2(index, comp)

		if (color?.length > 0) {
			// * F * //

			//* color section
			color.forEach((col, colIndex) => {
				const {
					f_code,
					outside,
					inside,
					special_ink,
					is_black_printing = false,
					black_printing_outside = false,
					black_printing_inside = false,
				} = col || {}

				if (colIndex > 0) {
					// * add color
					addSpecialInkF(index)
				}

				const selector = `.component[index=${index}] .specialInk-container:eq(${colIndex})`

				// * เงื่อนไขเก่า ไม่มีบอก in - out
				if (is_black_printing) {
					if (outside > 0) {
						setPaperBlackPrinting(index, colIndex, is_black_printing, 'outside')
					}
					if (inside > 0) {
						setPaperBlackPrinting(index, colIndex, is_black_printing, 'inside')
					}
				}

				if (black_printing_outside) {
					setPaperBlackPrinting(index, colIndex, black_printing_outside, 'outside')
				}

				if (black_printing_inside) {
					setPaperBlackPrinting(index, colIndex, black_printing_inside, 'inside')
				}

				$(`${selector} select.specialInkFCode`).val(f_code)
				$(`${selector} .colorOutside`).val(outside)
				$(`${selector} .colorInside`).val(inside)


				if (special_ink?.length > 0) {
					//* checked has special ink
					setEnableComponentSpecialInk(index, colIndex, true)

					special_ink.forEach((ink_obj, inkIndex) => {
						let obj = null
						if (ink_obj.info.ink_name === 'Drip off') {
							// return false
							// obj = {
							// 	name: "Drip off",
							// 	type: '47',
							// 	filling: "stripe",
							// 	className: 'ink-drip-off'
							// }
							setCoatingDripOffComponent(index)
							return false
						}

						// if (inkIndex > 0) {
						addSpecialInk(index, obj, colIndex);
						// }

						$(`${selector} .tr_speInk:eq(${inkIndex}) .speInk_name`).val(ink_obj.info.ink_name);
						$(`${selector} .tr_speInk:eq(${inkIndex}) .speInk_type`).val(ink_obj.process_id);
						$(`${selector} .tr_speInk:eq(${inkIndex}) .speInk_fillingStyle`).val(ink_obj.info.print_style);
						$(`${selector} .tr_speInk:eq(${inkIndex}) .speInk_paperType`).val(ink_obj.info.paper_code);
					})

					setSpecialInkTypeForUV(inkType)
				}
				// displaySpecialInk2(index, comp, is_multiple_f)
			})

		}

	})
	// $('.componentTemplate .is_manualLayout').prop('disabled', true)
}

function setPaperBlackPrinting(index, colIndex = 0, is_black_printing = false, side = 'inside') {
	const selector = $(`.component[index=${index}] .specialInk-container:eq(${colIndex})`)

	selector.find(`.is_black_printing.${side}`).prop('checked', is_black_printing)
	console.log(`.is_black_printing.${side}`, is_black_printing)

	if (is_black_printing) {
		side == 'outside' && selector.find(`.colorOutside`).val('').attr('max', 1)
		side == 'inside' && selector.find(`.colorInside`).val('').attr('max', 1)
	} else {
		side == 'outside' && selector.find(`.colorOutside`).val('').removeAttr('max')
		side == 'inside' && selector.find(`.colorInside`).val('').removeAttr('max')
	}
}

function displayComponentSpec2(index, component) {
	displayPaper(index, component)
	displayCorrugated(index, component)
	displayCoating(index, component)

	/* มีผลต่อ F */
	displayFoilstamp(index, component)
	displayBossing('emboss', index, component)
	displayBossing('deboss', index, component)

	displayBoxTemplate(component.box_type.type_id, index)
	setInputDimensionField(component.box_type.type_id, index)
	displayDimension(index, component)
	checkChangePaperConditions(index)
}

function displayPaper(index, component) {
	const { enable_price_check } = JSON.parse(localStorage.getItem('data'))

	const main_comp = '.component[index=' + index + ']'
	if (component.component_type.type != 3) {

		if (component.paper.is_custom == 0 || !component.paper.is_custom) {
			$(main_comp + ' .paperType').val(component.paper.paper_code)
			getPaperGram(get_papergram_arr((component.paper.paper_code)), index)
			$(main_comp + ' .paperGram').val(component.paper.paper_gram)
			$(main_comp + ' .paperCost').prop("readonly", !enable_price_check)
		} else {
			$(main_comp + ' .paperGram').val('<option value="">-</option>')
			$(main_comp + ' .paperGram-custom').text(component.paper.paper_gram)
			$(main_comp + ' .paperCode-custom').text(component.paper.paper_code)
			$(main_comp + ' .paperType-custom').text(component.paper.paper_name)
			$(main_comp + ' .paperThickness-custom').text(component.paper.paper_thickness)
			$(main_comp + ' .paperType-custom,' + main_comp + ' .paperGram-custom').show()
			$(main_comp + ' .paperType,' + main_comp + ' .paperGram').hide()
			$(main_comp + ' .custom-paper').attr('custom', 1)
			$(main_comp + ' .paperCost').prop("readonly", false)

		}

		$(main_comp + ' .select_paper_source').val(component.paper?.paper_source_id || 1)

		$(main_comp + ' .paperPercent').val(component.paper.paper_percent)
		$(main_comp + ' .paperCost').val(component.paper.paper_cost)
		$(main_comp + ' .paperSale').val(component.paper.paper_total_price)
		$(main_comp + ' .paper_brand_supplier').html(component.paper?.brand || '-')
		$(main_comp + ' input.paper_brand_supplier').html(component.paper?.brand || '')
		// $(main_comp + ' .sheet_unit_price').prop('checked', component.paper.sheet_unit_price)

		if (component.paper.remark) {
			$(main_comp + ' .remark-paper').val(component.paper.remark)
		}

		console.log("before setChangeComponentPaper", index)
		setChangeComponentPaper(index)
		setChangePricePerSheet(index, component.paper.sheet_unit_price)

		$(main_comp + ' .paperMarkup input').prop("readonly", !enable_price_check)
	}

	console.log("after setChangeComponentPaper", index)

}

function displayCorrugated(index, component) {
	const main_comp = '.component[index=' + index + ']'
	if (component.component_type.type != 1) {
		const corrugated_info = component.corrugated_layer.info

		console.log("displayCorrugated", index, main_comp, corrugated_info)

		if (!corrugated_info?.is_custom) {
			var grade = corrugated_info.name.split('/')
			var grade_arr = []
			grade.forEach((item1) => {
				if (item1.search('SCG') > -1) {
					grade_arr.push((item1.substring(0, 6)), item1.substring(6, 9))
				} else if (item1.search('ยูไนเต็ด') > -1) {
					grade_arr.push((item1.substring(0, 11)), item1.substring(11, 14))
				} else {
					if (item1.length == 5) {
						grade_arr.push((item1.substring(0, 2)), item1.substring(2, 5))
					} else {
						grade_arr.push((item1.substring(0, 3)), item1.substring(3, 6))
					}
				}
			})

			$(main_comp + ' .layerCorrugated').val(corrugated_info.num_layer)
			getFluteTypeOption(get_corrugated_type(corrugated_info.num_layer), index)
			setCorrugatedGram(corrugated_info.num_layer, index)
			getCorrugatedOption(get_corrugated_grade_type1(corrugated_info.num_layer, corrugated_info.flute_type), "type_1", index)
			getCorrugatedOption(get_corrugated_grade_gram1(corrugated_info.num_layer, corrugated_info.flute_type, grade_arr[0]), "gram_1", index)
			getCorrugatedOption(get_corrugated_grade_type2(corrugated_info.num_layer, corrugated_info.flute_type, grade_arr[0], grade_arr[1]), "type_2", index)
			getCorrugatedOption(get_corrugated_grade_gram2(corrugated_info.num_layer, corrugated_info.flute_type, grade_arr[0], grade_arr[1], grade_arr[2]), "gram_2", index)
			if (corrugated_info.num_layer != 2) {
				getCorrugatedOption(get_corrugated_grade_type3(corrugated_info.num_layer, corrugated_info.flute_type, grade_arr[0], grade_arr[1], grade_arr[2], grade_arr[3]), "type_3", index)
				getCorrugatedOption(get_corrugated_grade_gram3(corrugated_info.num_layer, corrugated_info.flute_type, grade_arr[0], grade_arr[1], grade_arr[2], grade_arr[3], grade_arr[4]), "gram_3", index)

			}
			$(main_comp + ' .fluteCorrugated').val(corrugated_info.flute_type)
			$(main_comp + ' .type_1').val(grade_arr[0])
			$(main_comp + ' .gram_1').val(grade_arr[1])
			$(main_comp + ' .type_2').val(grade_arr[2])
			$(main_comp + ' .gram_2').val(grade_arr[3])
			$(main_comp + ' .type_3').val(grade_arr[4])
			$(main_comp + ' .gram_3').val(grade_arr[5])
			$(main_comp + ' .remark-corrugated').val(corrugated_info.remark)
		} else {
			const flute_type = corrugated_info.fluteInfo_custom || corrugated_info.flute_type
			$(main_comp + ' .layerCorrugated-custom').text(corrugated_info.num_layer)
			$(main_comp + " .fluteCorrugated-custom").text(corrugated_info.flute_type)
			$(main_comp + " .layerCorrugated-custom," + main_comp + " .fluteCorrugated-type").show()
			$(main_comp + " .layerCorrugated," + main_comp + " .fluteCorrugated").hide()
			$(main_comp + ' .remark-corrugated').val(corrugated_info.remark)

			$(main_comp + " .fluteInfo-custom").text(corrugated_info.fluteInfo_custom)
			$(main_comp + " .fluteCorrugated-type").text(flute_type)
			$(main_comp + " .thickness-custom").text(corrugated_info.thickness)
			$(main_comp + " .costCorrugated-custom").text(corrugated_info.costCorrugated_custom)
			$(main_comp + " .isPricePerSheet").val(corrugated_info?.is_price_per_sheet ? 1 : 0)
			$(main_comp + " .fluteSide-custom").text(corrugated_info.fluteSide_custom)
			$(main_comp + " .cutOff-custom").text(corrugated_info.cutOff_custom)

			var num_layer = corrugated_info.num_layer;
			var flute_layer = ""
			if (num_layer == 5) {
				flute_layer = 3
			}

			console.log("num layer", num_layer, corrugated_info)
			if (num_layer == 2 || num_layer == "") {
				var cc = `<span class="type_custom_1">${corrugated_info.type[0]}</span>
							<span class="gram_custom_1">${corrugated_info.gram[0]}</span>
							/ 
							<span class="type_custom_2">${corrugated_info.type[1]}</span>
							<span class="gram_custom_2">${corrugated_info.gram[1]}</span>`
			} else {
				var cc = `<span class="type_custom_1">${corrugated_info.type[0]}</span>
							<span class="gram_custom_1">${corrugated_info.gram[0]}</span>
							/ ${flute_layer}
							<span class="type_custom_2">${corrugated_info.type[1]}</span>
							<span class="gram_custom_2">${corrugated_info.gram[1]}</span>
							/
							<span class="type_custom_3">${corrugated_info.type[2]}</span>
							<span class="gram_custom_3">${corrugated_info.gram[2]}</span>`
			}

			$(main_comp + " .corrugatedGrade").html(cc)
			$(main_comp + ' .custom-corrugated').attr('custom', 1)
		}

	}
}

// ! Check
function displayComponentCorrugated(index, corrugated) {
	const comp = $(`.component[index=${index}]`)

	const corrugated_info = corrugated

	comp.find('.layerCorrugated').val(corrugated_info.layer)
	getFluteTypeOption(get_corrugated_type(corrugated_info.layer), index)
	setCorrugatedGram(corrugated_info.layer, index)
	getCorrugatedOption(get_corrugated_grade_type1(corrugated_info.layer, corrugated_info.flute_type), "type_1", index)
	getCorrugatedOption(get_corrugated_grade_gram1(corrugated_info.layer, corrugated_info.flute_type, corrugated?.type_1), "gram_1", index)
	getCorrugatedOption(get_corrugated_grade_type2(corrugated_info.layer, corrugated_info.flute_type, corrugated?.type_1, corrugated?.gram_1), "type_2", index)
	getCorrugatedOption(get_corrugated_grade_gram2(corrugated_info.layer, corrugated_info.flute_type, corrugated?.type_1, corrugated?.gram_1, corrugated?.type_2), "gram_2", index)

	if (corrugated_info.layer != 2) {
		getCorrugatedOption(get_corrugated_grade_type3(corrugated_info.layer, corrugated_info.flute_type, corrugated?.type_1, corrugated?.gram_1, corrugated?.type_2, corrugated?.gram_2), "type_3", index)
		getCorrugatedOption(get_corrugated_grade_gram3(corrugated_info.layer, corrugated_info.flute_type, corrugated?.type_1, corrugated?.gram_1, corrugated?.type_2, corrugated?.gram_2, corrugated?.type_3), "gram_3", index)

	}

	comp.find('.fluteCorrugated').val(corrugated_info.flute_type)
	comp.find('.type_1').val(corrugated?.type_1)
	comp.find('.gram_1').val(corrugated?.gram_1)
	comp.find('.type_2').val(corrugated?.type_2)
	comp.find('.gram_2').val(corrugated?.gram_2)
	comp.find('.type_3').val(corrugated?.type_3)
	comp.find('.gram_3').val(corrugated?.gram_3)
}

function displayCoating(index, component) {
	var process_index = -1
	const coatings = component.addon?.filter(addon => addon.type === 'coating') || []

	coatings?.forEach((item1) => {
		process_index += 1
		var coating = '.coatingInput[index=' + index + '][process-index=' + process_index + ']'

		if (process_index > 0) {
			addAddon(index, 'coating')
		}

		$(coating + ' .coatingOption').val(item1.info.name)
		getCoatingTypeOption(get_coating_code(item1.info.name), index, process_index)
		$(coating + ' .coatingType').val(item1.info.code + '-' + item1.info.side)
		removeTRCoatingSpecialInput(index, process_index)

		if (['S-UV', 'S-UV-S'].includes(item1.info.code)) {
			// if (item1.info.code == 'S-UV') {
			getTRCoatingSpecialInput(index, process_index, item1.info.code)
			$(coating + ' .coatingSize:eq(0)').val(item1.info.width)
			$(coating + ' .coatingSize:eq(1)').val(item1.info.length)
		} else if (item1.info.code == 'B-PACK') {
			getTRCoatingSpecialInput(index, process_index, item1.info.code)
			$(coating + ' .coatingMaterialType').val(item1.info.material_type)
		} else if (item1?.info?.code == 'P-PAT') {
			getTRCoatingSpecialInput(index, process_index, item1.info.code)
			$(coating + ' .coatingNumber').val(item1.info?.number)
		}
	})

	// setCoatingDripOffComponent(index)
}

function displayFoilstamp(compIndex, component) {
	const is_multiple_f = getIsMultipleF()
	const foilstampAddon = component.addon.filter(obj => obj.type === 'foilstamp')
	const num_process = []

	foilstampAddon.forEach((addon, index2) => {
		const process_index = addon?.info?.process_index >= 0 ? addon?.info?.process_index : index2
		if (!num_process.includes(process_index)) {
			num_process.push(process_index)
		}
	})

	//* ได้เลขกรอบทั้งหมดของ foilstamp
	num_process.forEach(process_id => {
		const selector = '.foilstampInput[index=' + compIndex + '][process-index=' + process_id + ']'
		//* เพิ่ม Addon
		if (process_id === 0) { //* process foilstamp แรก
			$(selector + ' .foilstampCheck').prop('checked', true)
			$(selector + ' .tdInput').show()
		} else { //* process ถัดๆไป add ก่อน
			addAddon(compIndex, 'foilstamp')
		}

		//* หา process_id จาก addon list ที่ตรงกัน
		// const foilstampSize = foilstampAddon.filter((addon, a_index) => addon?.info?.process_index === process_id)

		const foilstampSize = foilstampAddon.filter((addon, a_index) => addon?.info?.process_index >= 0 ? addon?.info?.process_index == process_id : a_index == process_id)

		console.log("foilstampSize", foilstampSize)
		foilstampSize.forEach((size, index3) => {
			const {
				f_code,
				is_customFoil,
				code,
				color_th,
				foil_width,
				foil_length,
				foil_roll_price,
				foil_roll_min_price = 0,
				width,
				length
			} = size.info

			//* select สี , code option
			getFoilStampCodeOption(get_foilstamp_code(color_th), compIndex, process_id)

			// * loop Size(in2)
			// if (process_id === 0 && index3 > 0) {
			if (index3 > 0) {
				addAddonSize('foilstampInput', compIndex, process_id)
			}

			$(`${selector} table:last tr:eq(${index3}) .foilstampSize:eq(0)`).val(width)
			$(`${selector} table:last tr:eq(${index3}) .foilstampSize:eq(1)`).val(length)


			if (is_customFoil) {
				$(selector + ' .custom-foil').attr('custom', 1)
				$(selector + ' .custom-foil').css('color', 'green')
				$(selector + ' .Code-custom,' + selector + ' .foilCode-custom,' + selector + ' .foilColor-custom').show()
				$(selector + ' .foilColor,' + selector + ' .foilCode').hide()
				$(selector + ' .foilCode-custom').text(code)
				$(selector + ' .foilColor-custom').text(color_th)
				$(selector + ' .foilRollWidth-custom').val(foil_width)
				$(selector + ' .foilRollLength-custom').val(foil_length)
				$(selector + ' .foilRollPrice-custom').val(foil_roll_price)
				// $(selector + ' .foilRollMinPrice-custom').val(foil_roll_min_price)
			} else {
				$(selector + ' .Code-custom,' + selector + ' .foilCode-custom,' + selector + ' .foilColor-custom').hide()
				$(selector + ' .foilColor,' + selector + ' .foilCode').show()
				$(selector + ' .foilColor').val(color_th)
				$(selector + ' .foilCode').val(code)
			}

			if (is_multiple_f) {
				$(`${selector} .f-addon`).show()
				f_code?.forEach((f, fIndex) => {
					if (fIndex > 0 && index3 == 0) {
						addAddonFCode('foilstampInput', 'foilstamp', compIndex, process_id)
					}
					getFCodeSelectOption()

					$(`${selector} .foilstampFCode:eq(${fIndex})`).val(f)
				})
			}
		})
	})

}

function displayBossing(bossing, index, component) {
	const is_multiple_f = getIsMultipleF()
	var process_index = -1
	const bossingAddon = component.addon.filter(obj => obj.type === bossing)
	bossingAddon.forEach((item1, process_id) => {
		if (item1.type == bossing) {
			const { info: { f_code, width, length, depth } } = item1 || {}
			process_index += 1
			const selector = '.' + bossing + 'Input[index=' + index + '][process-index=' + process_index + ']'
			if (process_index > 0) {
				addAddon(index, bossing)
			} else {
				$(selector + ' .' + bossing + 'Check').prop('checked', true)
				$(selector + ' .tdInput').show()
			}

			item1?.info?.size?.forEach((size, sIndex) => {
				if (sIndex > 0) {
					addAddonSize(`${bossing}Input`, index, process_index)
				}
				$(selector).find(`.tb_${bossing}Size tbody tr:last input.${bossing}Size:eq(0)`).val(size[0])
				$(selector).find(`.tb_${bossing}Size tbody tr:last input.${bossing}Size:eq(1)`).val(size[1])
			})

			$(selector + ' .' + bossing + 'Depth').val(depth)


			if (is_multiple_f) {
				$(`${selector} .f-addon`).show()
				f_code?.forEach((f, fIndex) => {
					if (fIndex > 0) {
						addAddonFCode(`${bossing}Input`, bossing, index, process_id)
					}
					getFCodeSelectOption()
					$(`${selector} .${bossing}FCode:eq(${fIndex})`).val(f)
				})
			}
		}
	})
}

function displayDimension(index, component) {
	const main_comp = '.component[index=' + index + ']'
	$(main_comp + ' .boxType').val(component.box_type.type_id)

	if (component?.packaging_size) {
		if (component.box_type.type_id == 12) {
			$(main_comp + ' .packingsizemm  input').each((index1) => $(main_comp + ' .packingsizemm input:eq(' + index1 + ')').val(component.packaging_size.packing_size[index1 + 2]))
			$(main_comp + ' .packingsizeinch input').each((index1) => $(main_comp + ' .packingsizeinch input:eq(' + index1 + ')').val(component.packaging_size.packing_size[index1]))
			$(main_comp + ' .packingLayer input').val(component.box_type.packing_layer)
		}

		$(main_comp + ' .specmm.width').val(component.packaging_size.width)
		$(main_comp + ' .specin.widthin').val(mm2inch(component.packaging_size.width))
		$(main_comp + ' .specmm.length').val(component.packaging_size.length)
		$(main_comp + ' .specin.lengthin').val(mm2inch(component.packaging_size.length))
		$(main_comp + ' .specmm.depth').val(component.packaging_size.depth)
		$(main_comp + ' .specin.depthin').val(mm2inch(component.packaging_size.depth))
		$(main_comp + ' .specmm.glue').val(component.packaging_size.glue_flap)
		$(main_comp + ' .specin.gluein').val(mm2inch(component.packaging_size.glue_flap))
		$(main_comp + ' .specmm.tuck').val(component.packaging_size.tuck_flap)
		$(main_comp + ' .specin.tuckin').val(mm2inch(component.packaging_size.tuck_flap))
		$(main_comp + ' .specmm.dust').val(component.packaging_size.dust_flap)
		$(main_comp + ' .specin.dustin').val(mm2inch(component.packaging_size.dust_flap))
		$(main_comp + ' .specmm.ol').val(component.packaging_size.ol)
		$(main_comp + ' .specin.olin').val(mm2inch(component.packaging_size.ol))
		$(main_comp + ' .foldSizemm input').each((index1) => $(main_comp + ' .foldSizemm input:eq(' + index1 + ')').val(component.packaging_size.fold_size[index1 + 3]))
		$(main_comp + ' .foldSizein input').each((index1) => $(main_comp + ' .foldSizein input:eq(' + index1 + ')').val(component.packaging_size.fold_size[index1]))
		$(main_comp + ' .openSizemm  input').each((index1) => $(main_comp + ' .openSizemm input:eq(' + index1 + ')').val(component.packaging_size.open_size[index1 + 2]))
		$(main_comp + ' .openSizein input').each((index1) => $(main_comp + ' .openSizein input:eq(' + index1 + ')').val(component.packaging_size.open_size[index1]))
		$(main_comp + ' .is_manualLayout:eq(' + index + ')').prop('checked', component.layout_manual)

		hilightText('is_manualLayout', component.layout_manual, index)
		setfluteAlign(index, component.component_type.type)

		if (component.component_type.type != 1) {
			$(main_comp + ' .flute_side').val(component.corrugated_layer.component_flute_side)
			getFluteAlignonTemplate(index, component.corrugated_layer.component_flute_side)
		}

		if (component.box_type.glued_spot == 0) {
			$(main_comp + ' .is_assembled').prop('checked', false)
			$(main_comp + ' .td-glued-spot').hide()
		} else {
			$(main_comp + ' .is_assembled').prop('checked', true)
			$(main_comp + ' .td-glued-spot').show()
			$(main_comp + ' .glued_spot').val(component.box_type.glued_spot)
		}

		$(main_comp + ' .is_digital_diecut').prop('checked', component.box_type?.is_digital_diecut)
	}

}

function displayProcess(mainData, process) {
	var process_index = -1
	mainData.process.forEach((item) => {
		if (item.type == process) {
			process_index += 1
			const processName = process + 'Process'
			const processTr = `${process}Process:eq(${process_index})`
			const is_fixedPrice = item.info.is_fixedPrice === undefined ? true : item.info.is_fixedPrice

			addProcess(process)
			$('.' + processTr + ' .nameProcess input').val(item.name)
			$('.' + processTr + ' .ppuProcess input').val(item?.info?.unit_price || item?.info?.unit_price[0] || 0)
			$('.' + processTr + ' .is_fixedPrice').prop('checked', is_fixedPrice)

			createTdNumInput(process_index, is_fixedPrice, processName)

			if (is_fixedPrice) {
				$('.' + processTr + ' .ppuProcess input').val(item?.info?.unit_price || item?.info?.unit_price[0] || 0)
			} else {
				$('.' + processTr + ' .ppuProcess input').each(((index1, ele) => $(ele).val(item?.info?.unit_price[index1] || 0)))
			}

			if (item.info.from_process != null) {
				$(`.${processTr}`).attr('from-process', item.info.from_process)
				$(`.${processTr}`).attr('comp-index', item.info.comp_index)
				$(`.${processTr}`).attr('process-index', item.info.process_index)
				$(`.${processTr}` + ' input').prop('readonly', true)
				$(`.${processTr}` + ' .deleteProcess').hide()
			}
		}
	})
}

function displayMaterial(mainData) {
	var process_index = -1
	mainData.material.forEach((item) => {
		process_index += 1
		addProcess('material')
		var materialProcess = '.materialProcess:eq(' + process_index + ')'
		$(materialProcess + ' .nameProcess input').val(item.name)
		$(materialProcess + ' .ppuProcess input').val(item.info.unit_price)
		$(materialProcess + ' .is_fixedPrice').prop('checked', item.info.is_fixedPrice)
		createTdNumInput(process_index, item.info.is_fixedPrice, "materialProcess")
		if (item.info.is_fixedPrice) {
			$(materialProcess + ' .numMat input').val(item.info.qty_material)
		} else {
			$(materialProcess + ' .numMat input').each((index1) => $(materialProcess + ' .numMat input:eq(' + index1 + ')').val(item.info.qty_material[index1]))
		}
		if (item.info.from_process != null) {
			$(materialProcess).attr('from-process', item.info.from_process)
			$(materialProcess).attr('comp-index', item.info.comp_index)
			$(materialProcess).attr('process-index', item.info.process_index)
			$(materialProcess + ' input').prop('readonly', true)
			$(materialProcess + ' .deleteProcess').hide()
		}
	})
}

function displayOtherCost(mainData) {
	var process_index = -1
	mainData?.otherCost && mainData?.otherCost?.forEach((item) => {
		process_index += 1
		var otherCostProcess = '.otherCostProcess:eq(' + process_index + ')'

		addProcess('otherCost')


		createTdNumInput(process_index, item.info.is_fixedPrice, "otherCostProcess")

		$(otherCostProcess + ' .nameProcess input').val(item.name)
		$(otherCostProcess + ' .ppuProcess input').val(item.info.unit_price)
		$(otherCostProcess + ' .is_fixedPrice').attr('checked', item.info.is_fixedPrice)

		if (item.info.is_fixedPrice) {
			$(otherCostProcess + ' .numMat input').val(item.info.qty_other)
		} else {
			$(otherCostProcess + ' .numMat input').each((index1) => $(otherCostProcess + ' .numMat input:eq(' + index1 + ')').val(item.info.qty_other[index1]))
		}

		if (item.info.from_process != null) {
			$(otherCostProcess).attr('from-process', item.info.from_process)
			$(otherCostProcess).attr('comp-index', item.info.comp_index)
			$(otherCostProcess).attr('process-index', item.info.process_index)
			$(otherCostProcess + ' input').prop('readonly', true)
			$(otherCostProcess + ' .deleteProcess').hide()
		}
	})
}

function displayFileUpload(mainData) {
	let fileTr = '';

	mainData?.fileUpload && mainData?.fileUpload?.forEach((file, index) => {
		const { filePath, id, originFileName, fileName } = file
		const linkFilePath = node_api + '/estimate/file/view/' + fileName
		const fileDisplay = `<a href='${linkFilePath}' target='_blank' file-id='${id}' class="file_path">${originFileName}</a>`

		fileTr += `<tr class='file_upload' index="${index}"> 
			<td style="width: 50px;"><div class="deleteFile">ลบ</div></td>
			<td>
				<div class="file_display">
					${fileDisplay}
				</div>
			</td>
		</tr>`
	})
	$('#file_upload_table table tbody').append(fileTr)
}

function displayDelivery(mainData) {
	const { delivery, qty: { totalqty }, component1, job: { is_multiple_f = false } } = mainData || {}
	const splitDelivery = delivery?.length > 1 ? true : false

	// * change condition to mainData.splitDelivery
	if (totalqty.length > 1) {
		$('.chk_split_delivery').prop("disabled", true)
	}

	if (!delivery) {
		return false
	}

	let f_list = []
	if (is_multiple_f) {
		f_list = component1[0]?.f_detail?.f_list?.map(obj => obj?.f_code)
	}

	if (splitDelivery) {
		est.setCalculateCheckDeliveryQty()

		delivery.forEach((obj, index) => {
			const roundElement = `.deliveryProcess[index=${index}]`
			if (index === 0) {
				$('.chk_split_delivery').click()
			} else {
				addProcess('delivery')
			}
			$(`.deliveryProcess[index=${index}] input.deliveryDestinationId`).val(delivery[index].destinationId)
			$(`.deliveryProcess[index=${index}] input.deliveryDestinationName`).val(delivery[index].destinationName)
			displayDateInput(`.deliveryProcess[index=${index}] input.deliveryDate`, delivery[index].dueDate)
			obj.detail.forEach((objDetail, indexDetail) => {
				if (indexDetail > 0) {
					addDeliveryMultipleProcess(index)
				}
				if (component1.length === 1 && !is_multiple_f) {
					$(`${roundElement} .deliveryQty input:eq(${indexDetail})`).val(objDetail.qty)
				} else {
					let selectedValue = is_multiple_f ? objDetail.fIndex : objDetail.componentId || 0

					// ! Here is temp. bug fixed fIndex not found in detail
					if (is_multiple_f && objDetail.fIndex == null) {
						selectedValue = f_list?.indexOf(objDetail.f_code)
					}

					$(`${roundElement} .trDeliveryMultipleProcess:eq(${indexDetail}) select.deliveryComponentId`).val(selectedValue)
					$(`${roundElement} .trDeliveryMultipleProcess:eq(${indexDetail}) .deliveryQty input`).val(objDetail.qty)
				}

			})
		})
		est.setCalculateCheckDeliveryQty()
	} else {
		$(`.deliveryProcess[index=0] input.deliveryDestinationId`).val(delivery[0].destinationId)
		$(`.deliveryProcess[index=0] input.deliveryDestinationName`).val(delivery[0].destinationName)
		displayDateInput(`.deliveryProcess[index=0] input.deliveryDate`, delivery[0].dueDate)
	}
}


function displayLayout(mainData) {
	mainData.component1.forEach((item, index) => {
		divLayout(index)
		divComponentName(index)
		divComponentSize(index)
		imgLayout(index)
		editLayout(index)
		tbPaperUsage(index)
		getPaperUsageTable(index)
		rowPaperUsage(index)
		var layout_comp = '.componentInfo[index=' + index + ']'
		hilightText('manual_layout', item.layout_manual, index)
		if (item.layout_manual) {
			$(layout_comp + ' .manualLayout').prop('checked', true)
			prepareDivManualLayout(index)
			console.log("item.layout.laySize", item.layout.laySize)
			$(layout_comp + ' .wLaySize').val(item.layout.laySize[0])
			$(layout_comp + ' .lLaySize').val(item.layout.laySize[1])
			getLayoutGrainSelectOption(index, 'wLaySize', item.layout.laySize[0])
			getLayoutGrainSelectOption(index, 'lLaySize', item.layout.laySize[1])
			$(layout_comp + ' .edit_w_layout input').val(item.layout.selected_layout.layout[0])
			$(layout_comp + ' .edit_l_layout input').val(item.layout.selected_layout.layout[1])
			getNumLayoutbyManual(item.layout.selected_layout.layout, index)

			if (item.component_type.type != 3) {
				$(layout_comp + ' .layout_grain').val(item.layout.selected_layout?.grain_box_type)
				$(layout_comp + ' .parallelRollWidth').val(item.paper_info.parallel_roll_width)
				createPaperGrainDiv(index, item.paper_info.parallel_roll_width)
			}

			if (item.component_type.type != 1) {
				// if(item.corrugated_layer?.info?.is_price_per_sheet){
				// 	if(item.corrugated_layer?.info?.flute_align == 'vertical'){
				// 		var parallelFluteSide = "WSize"
				// 	}else if(item.corrugated_layer?.info?.flute_align == 'horizontal'){
				// 		var parallelFluteSide = "LSize"
				// 	}
				// }else{
				// 	if (item.corrugated_layer.component_flute_side == 'short_side') {
				// 		var parallelFluteSide = 'WSize'
				// 	} else if (item.corrugated_layer.component_flute_side == 'long_side') {
				// 		var parallelFluteSide = 'LSize'
				// 	}
				// }
				if (item.corrugated_layer?.info?.flute_align == 'vertical') {
					var parallelFluteSide = "WSize"
				} else if (item.corrugated_layer?.info?.flute_align == 'horizontal') {
					var parallelFluteSide = "LSize"
				}


				$(layout_comp + ' .parallelFluteSide').val(parallelFluteSide)
				createFluteSideImgDiv(index, parallelFluteSide)
			}

		}
		$(layout_comp + ' .wSize').val(item.paper_info.roll_width)
		$(layout_comp + ' .lSize').val(item.paper_info.cut_off)
		displayMachineSize(index, item.machine)
		displayManualLayoutSize(index)
	})
}



function displayPacking(mainData) {
	mainData.component1.forEach((item, index) => {
		item.packing?.forEach((fPack, fIndex) => {
			fPack.forEach((packing) => {
				switch (packing.name) {
					case 'paperband':
						displayPaperband(index, packing, fIndex)
						break
					case 'kraftwrap':
						displayKraftwrap(index, packing, fIndex)
						break
					case 'carton':
						displayCarton(index, packing, fIndex)
						break
					case 'pallet':
						displayPallet(index, packing, fIndex)
						break
				}
			})
		})
	})
}

function displayPaperband(index, paperband_obj, fIndex = 0) {
	const paperband = `.divPaperband[index=${index}][fIndex=${fIndex}]`
	$(`.packingCheck[index=${index}][fIndex=${fIndex}] .paperband input`).prop('checked', true)
	$(paperband).show()
	$(`${paperband} .paperbandType`).val(paperband_obj.info.type)
	$(`${paperband} .qty_per_band`).val(paperband_obj.info.qty_per_paperband)
}

function displayKraftwrap(index, kraftwrap_obj, fIndex = 0) {
	const obj = {
		lay_size: kraftwrap_obj.info.cube_size,
		bulk_size: kraftwrap_obj.info.bulk_size
	}
	const kraftwrap = `.divKraftwrap[index=${index}][fIndex=${fIndex}]`

	$(`.packingCheck[index=${index}][fIndex=${fIndex}] .kraftwrap input`).prop('checked', true)
	$(kraftwrap).show()
	imgLayoutKraftwrap(index, kraftwrap_obj.info.num_side[0], kraftwrap_obj.info.num_side[1], obj, fIndex)
	$(`${kraftwrap} .numW_Kraftwrap`).val(kraftwrap_obj.info.num_side[0])
	$(`${kraftwrap} .numL_Kraftwrap`).val(kraftwrap_obj.info.num_side[1])
	$(`${kraftwrap} .kraftwrap_qty`).val(kraftwrap_obj.info.qty_per_pack)
	$(`${kraftwrap} .edit_kraftwrap_qty`).attr('checked', kraftwrap_obj.info?.is_editKraftwrapQty)
	$(`${kraftwrap} .kraftwrap_qty`).attr('readonly', !kraftwrap_obj.info?.is_editKraftwrapQty)
}
function displayCarton(index, carton_obj, fIndex = 0) {
	const carton = `.divCarton[index=${index}][fIndex=${fIndex}]`
	const corrugated = carton_obj.info.corrugated
	var grade = corrugated.grade.split('/')
	var grade_arr = []
	grade.forEach((item1) => {
		if (item1.length == 6) {
			grade_arr.push(item1.substring(1, 3), item1.substring(3, 6))
		} else {
			grade_arr.push(item1.substring(0, 2), item1.substring(2, 5))
		}
	})
	//var grade_arr=[grade[0].substring(0,2),grade[0].substring(2,5),grade[grade.length-1].substring(0,2),grade[grade.length-1].substring(2,5)]
	$(`.packingCheck[index=${index}][fIndex=${fIndex}] .carton input`).prop('checked', true)
	$(carton).show()
	showCartonInfo(index, carton_obj, fIndex)
	setCalculateCorrugatedCtn(index, fIndex)
	getCartonFluteTypeOption(index, get_corrugated_type(corrugated.corrugated_layer), fIndex)
	getCartonOption(index, get_corrugated_grade_type1(corrugated.corrugated_layer, corrugated.flute_type), 'type_1', fIndex)
	getCartonOption(index, get_corrugated_grade_gram1(corrugated.corrugated_layer, corrugated.flute_type, grade_arr[0]), 'gram_1', fIndex)
	getCartonOption(index, get_corrugated_grade_type2(corrugated.corrugated_layer, corrugated.flute_type, grade_arr[0], grade_arr[1]), 'type_2', fIndex)
	getCartonOption(index, get_corrugated_grade_gram2(corrugated.corrugated_layer, corrugated.flute_type, grade_arr[0], grade_arr[1], grade_arr[2]), "gram_2", fIndex)
	if (corrugated.corrugated_layer != 2) {
		getCartonOption(index, get_corrugated_grade_type3(corrugated.corrugated_layer, corrugated.flute_type, grade_arr[0], grade_arr[1], grade_arr[2], grade_arr[3]), 'type_3', fIndex)
		getCartonOption(index, get_corrugated_grade_gram3(corrugated.corrugated_layer, corrugated.flute_type, grade_arr[0], grade_arr[1], grade_arr[2], grade_arr[3], grade_arr[4]), "gram_3", fIndex)
	}
	$(carton + ' .cartonLayer').val(corrugated.corrugated_layer)
	$(carton + ' .fluteCtn_corrugated select').val(corrugated.flute_type)
	$(carton + ' .type_1Ctn').val(grade_arr[0])
	$(carton + ' .gram_1Ctn').val(grade_arr[1])
	$(carton + ' .type_2Ctn').val(grade_arr[2])
	$(carton + ' .gram_2Ctn').val(grade_arr[3])
	$(carton + ' .type_3Ctn').val(grade_arr[4])
	$(carton + ' .gram_3Ctn').val(grade_arr[5])
}
function displayPallet(index, pallet_obj, fIndex = 0) {
	const pallet = `.divPallet[index=${index}][fIndex=${fIndex}]`
	$(`.packingCheck[index=${index}][fIndex=${fIndex}] .pallet input`).prop('checked', true)
	$(pallet).show()
	$(pallet + ' .palletSize select').val(pallet_obj.info.pallet_id)
	$(pallet + ' .palletDelivery select').val(pallet_obj.info.delivery_id)
	$(pallet + ' .is_mif_pallet').prop('checked', pallet_obj?.info?.is_mif_pallet)
}


function displayPriceDifference(data) {
	if (data?.length > 0) {
		$('.chk_price_difference').prop('checked', true)
		setChangeNumberOfPriceDiffInputQty()

		data.forEach((price, index) => {
			$(`.price_difference_tr input:eq(${index})`).val(price)
		})
	}
}
function displayCustomerGift(data) {
	if (data?.length > 0) {
		$('.chk_customer_gift').prop('checked', true)
		setChangeNumberOfCustomerGiftInputQty()

		data.forEach((price, index) => {
			$(`.customer_gift_tr input:eq(${index})`).val(price)
		})
	}
}

function displaySave(bool = false) {
	const saveBttn = $('#save-bttn')
	const docsBttn = $('#print, #summary-bttn, #excel-bttn')

	saveBttn.hide()
	docsBttn.hide()

	console.log("display Save Button", bool)

	if (!bool) {
		return false
	}

	if ($('#calc_layout').is(':visible')) {
		console.log('can not display #save-bttn. cuz #calc_layout is visible')
		return false
	}

	if ($('.display-layout-bttn').is(':visible')) {
		console.log('can not display #save-bttn. cuz .display-layout-bttn is visible')
		return false
	}

	if ($('.recalc-paperusage-bttn').is(':visible')) {
		console.log('can not display #save-bttn. cuz .recalc-paperusage-bttn is visible')
		return false
	}

	saveBttn.show()

	// * ---------- PDF -----------
	if ($('#calc_price_after_packing').is(':visible')) {
		docsBttn.show()
	} else {
		est.resetTotalPrice()
	}
}