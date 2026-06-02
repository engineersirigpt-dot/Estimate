//* INDEX ---START-------------------------------------------------------------------------------------
//* function to store data from ui to est.mainData object
//* function to get info from input field
//* function to get list info from DB to ui input/select
//* common function in estimate page
//? About Login
//? SAVE DATA TO DATABASE
//? About Autocomplete
//? Export to Excel xlsx
//? About facillate to user and animate UI
//* function input change EVENT
//* function to get info from est.mainData
//* function check if print type change
//* function interact to HTML element
//? About Hilight Text
//? About change specification input
//? About Display Box Template and specification in each component
//? About Add/Change number of component
//? About add special ink tr
//? About delete special ink tr
//? About set special ink to default when add new component
//? About add addon
//? About Coating Addon
//? About Manual Layout
//? About Add process (other process, handwork process, material)
//? About Add Qty
//? About Display Layout Section
//? About Paper Usage Table
//? About Packing Section
//? About Packing: Kraftwrap
//? About Packing: CARTON
//* function to CHECK input data before calcutation
//* function custom spec 
//* function create SUMMARY TABLE
//? for displayed Summary Table
//? for EXCEL Summary Table
//* function RESET index elements
//? for reset deliveryProcess index
//* INDEX --END----------------------------------------------------------------------------------------

//* START function to store data from ui to est.mainData object ---------------------------------------
function storeDate() {
    var date = $('#date input').val()
    console.log("date", date)
    est.setDate({
        create_date: toDateDBFormat(date)
    })

}

function storeJob() {
    let job_name = $('#jobName input').val(),
        job_id = $('#rfqID input').val(),
        ref_copy_rfq = $('#refCopyID input').val() || '',
        is_reprinted = parseInt($('#is_reprinted select').val()),
        is_use_previous_plate = $('#is_use_previous_plate').prop('checked'),
        ink_type = $('#ink_type select').val(),
        print_type = $('#print_type select').val(),
        // chk_color_limit = $(".chk_color_limit").prop('checked'),
        // color_limit = 0,
        flexo_size = null,
        is_multiple_f = $('#is_multiple_f').prop('checked'),
        is_different_packing = $('#is_different_packing').prop('checked'),
        is_request_approve = $('#request_for_approve').prop('checked'),
        approve_status = $('#status_id').val(),
        color_limit = est.setColorLimit(),
        is_profit_sharing = getIsProfitSharing(),
        credit_term_id = $('#credit_term_id').val() || ''

    let credit_term_name = credit_term_id ? $('#credit_term_name').html() : ''


    if (print_type == 'Flexo') {
        flexo_size = [numeral($('#flexo_size input:eq(0)').val()).value(), numeral($('#flexo_size input:eq(1)').val()).value()]
    }

    est.setJob({
        job_name,
        job_id,
        ref_copy_rfq,
        is_reprinted,
        is_use_previous_plate,
        ink_type,
        print_type,
        flexo_size,
        color_limit,
        is_multiple_f,
        is_different_packing,
        is_request_approve,
        approve_status,
        is_profit_sharing,
        is_cancel_total_profit_sharing: true,
        credit_term_id,
        credit_term_name,
    })
}

function storeAEName() {
    var ae_obj = {
        ae_id: $('#aeID').val(),
        ae_name: $('#aeName').val()
    }
    est.setAE(ae_obj)
}

function storeCustomerName() {
    var customer_obj = {
        customer_id: $('#custID').val(),
        customer_name: $('#custName').val()
    }
    est.setCustomer(customer_obj)
}

function storeEstimatorName() {
    var estimator_obj = {
        estimator_id: $('#estID').val(),
        estimator_name: $('#estName').val(),
        estimate_check: $('#status_id').val() == 3 ? true : false,
        approve_status: $('#status_id').val() || 0
    }

    est.setEstimator(estimator_obj)
}

function storeTax() {
    if ($('#tax input').length == 0) {
        var obj = ""
    } else {
        var obj = {
            tax: parseFloat($('#tax input').val()),
        }
    }
    est.setTax(obj)
}

function storeExchangeRate() {
    const currency_no = $('.select_currency_no').val() || 'THB'

    const info = getExchangeRateInfo(currency_no)

    est.setExchangeRate({
        currency_no: currency_no,
        exchange_rate: info?.exchange_rate || 1,
    })
}

function storeMarkingPercent(index) {
    if ($('.MarkUp input, .MarkDown input, .MarkingPercentMaterial input, .MarkingPercentProduction input').length == 0) {
        var obj = ""
    } else {
        var obj = {
            mark_up_percent: parseFloat($(`.MarkUp[index=${index}] input`).val() || 0),
            mark_down_percent: parseFloat($(`.MarkDown[index=${index}] input`).val() || 0),
            marking_material_percent: parseFloat($(`.MarkingPercentMaterial[index=${index}] input`).val() || 0),
            marking_production_percent: parseFloat($(`.MarkingPercentProduction[index=${index}] input`).val() || 0),
        }
    }
    est.setMarkingPercent(index, obj)
}

function storePaperSize(index) {

    const item = est.mainData.component1[index]
    const checkManual = $('.manualLayout[index=' + index + ']').prop('checked')

    let arr = [], realPaperSize = [], paperSize = []

    const std_paper_id = parseInt($('.cut_size_std_paper[index=' + index + ']').val())
    //* store paperSize to arr
    $('.paperSize[index=' + index + '] input').each(function () {
        if ($(this).val() != "") {
            arr.push(parseFloat($(this).val()))
        }
    })

    const stdPaperSize = getStdPaperSize(std_paper_id)

    if (stdPaperSize) {
        const {
            std_paper_size_width_in,
            std_paper_size_length_in,
            // ref std.paper
            std_paper_size_ref_width_in,
            std_paper_size_ref_length_in,
            std_paper_size_ref_width_mm,
            std_paper_size_ref_length_mm
        } = stdPaperSize

        if (stdPaperSize) {
            arr = [std_paper_size_width_in, std_paper_size_length_in]

            realPaperSize = [
                std_paper_size_ref_width_mm,
                std_paper_size_ref_length_mm,
                std_paper_size_ref_width_in,
                std_paper_size_ref_length_in,
            ]
        }
    }

    if (arr.length == 2) {
        if (checkManual) {
            //TRUE -> Manual Layout
            //* 27.05.22 : fix WSize
            var obj = {
                paper_align: 'short',
                parallel_side: 'WSize',
                is_switchDisplay: 0,
                std_paper_id,
                realPaperSize
            }
        } else {
            // check W < L
            var is_switchDisplay = checkIsSwitchDisplay(item)
            var dummy_paper_align = item.paper_info.paper_align

            //*!  Fix Horizontal grain only
            var obj = {
                paper_align: 'short',
                dummy_paper_align: dummy_paper_align,
                parallel_side: 'WSize',
                is_switchDisplay: is_switchDisplay,
                std_paper_id: std_paper_id || null,
                realPaperSize
            }
        }

        paperSize = [
            parseFloat(inch2mm(arr[0]).toFixed(2)),
            parseFloat(inch2mm(arr[1]).toFixed(2)),
            arr[0],
            arr[1]
        ]


        est.setPaperSize(item, paperSize, obj)
    }
}

function storeTolerance(index) {
    const item = est.mainData.component1[index]
    const divEditTolerance = '.divEditTolerance[index=' + index + ']'
    var gripper = parseFloat($(divEditTolerance + ' .gripper input').val()) || 0
    var color_bar = parseFloat($(divEditTolerance + ' .color_bar input').val() || 0)
    var paper_edge = parseFloat($(divEditTolerance + ' .paper_edge input').val() || 0)
    var bleed = parseFloat($(divEditTolerance + ' .bleed input').val() || 0)
    // est.setTolerance(item,gripper,color_bar,paper_edge,bleed)
    est.setCompTypeTolerance(item, true, { gripper, color_bar, paper_edge, bleed })
}

function storeQty() {
    /*

    */
    let ae, customer, runon_percent
    ae = parseInt(numeral($('.aeQty input').val()).value() || 0)
    runon_percent = parseFloat($('.runonPercent').val() || 0)
    customer = parseInt(numeral($('.customerQty input').val()).value() || 0)

    const qty = [], runon = []

    $('#inputInfo div[class=inputQty] input').each(function () {
        if ($(this).val() == "") {
            qty.push(0)
        } else {
            qty.push(numeral($(this).val()).value())
        }
    })

    $('#inputInfo div[class=runonQty] input').each(function () {
        if ($(this).val() == "") {
            runon.push(0)
        } else {
            runon.push(numeral($(this).val()).value())
        }
    })

    var qty_obj = {
        main: qty,
        runon_percent: runon_percent,
        runon: runon,
        ae: ae,
        customer: customer,
    }
    est.setQty(qty_obj)
}

function storeQty2() { //* new version for multiple F 07.07.22
    const is_multiple_f = getIsMultipleF()

    //* store Qty.
    const qtyInfo = {
        main: [],
        runon: [],
        ae: 0,
        customer: 0,
        runon_percent: 0,
        totalqty: []
    }
    const f_detail = {
        f_qty: [],
        f_total_qty: 0,
        f_list: []
    }

    if (is_multiple_f) { //* หลาย F
        qtyInfo.main.push(0)
        qtyInfo.runon.push(0)

        $(`#multiple_f_qty_info .f_table`).each((index, ele) => {
            const fCode = $(ele).find('.f-code').val()
            const runonPercent = numeral($(ele).find('.runonPercent').val() || 0).value()
            const fQty = numeral($(ele).find('.inputQty input').val() || 0).value()
            const runonQty = numeral($(ele).find('.runonQty input').val() || 0).value()
            const aeQty = numeral($(ele).find('.aeQty input').val() || 0).value()
            const customerQty = numeral($(ele).find('.customerQty input').val() || 0).value()
            const totalQty = fQty + runonQty + aeQty + customerQty
            f_detail.f_qty.push(fQty)
            f_detail.f_list.push(
                {
                    f_code: fCode,
                    f_qty: fQty,
                    runon_percent: runonPercent,
                    runon_qty: runonQty,
                    ae_qty: aeQty,
                    customer_qty: customerQty,
                    total_qty: totalQty
                }
            )
            f_detail.f_total_qty += totalQty


            qtyInfo.main[0] += fQty
            qtyInfo.runon[0] += runonQty
            qtyInfo.ae += aeQty
            qtyInfo.customer += customerQty
            qtyInfo.totalqty.push(totalQty)
        })

    } else {
        qtyInfo.ae = parseInt(numeral($('.aeQty input').val()).value() || 0)
        qtyInfo.customer = parseInt(numeral($('.customerQty input').val()).value() || 0)
        qtyInfo.runon_percent = parseFloat($('.runonPercent').val() || 0)

        $('#qty_info div[class=inputQty] input').each(function () {
            qtyInfo.main.push(numeral($(this).val() || 0).value())
        })

        $('#qty_info div[class=runonQty] input').each(function () {
            qtyInfo.runon.push(numeral($(this).val() || 0).value())
        })

    }
    est.setQty(qtyInfo)
    return f_detail
}

function storeOtherProcess() {
    var arr = []
    $('.otherProcess').each(function (index) {
        var otherProcess = `.otherProcess:eq(${index})`

        if ($(`${otherProcess} .is_fixedPrice`).prop('checked')) {
            var unit_price = parseFloat($(`${otherProcess} .ppuProcess:eq(0) input`).val())

        } else {
            var unit_price = []
            $(`${otherProcess} .ppuProcess`).each(function (index1) {
                unit_price.push(parseFloat($(`${otherProcess} .ppuProcess:eq(${index1}) input`).val()))
            })
        }

        arr.push({
            type: 'other',
            type_id: 8,
            name: $(`${otherProcess} .nameProcess input`).val(),
            info: {
                is_fixedPrice: $(`${otherProcess} .is_fixedPrice`).prop('checked'),
                unit_price
            },
            line: []
        })
    })
    est.setOtherProcess(arr)
}

function storeHandworkProcess() {
    var arr = []
    $('.handworkProcess').each(function (index) {
        var handworkProcess = '.handworkProcess:eq(' + index + ')'

        if ($(`${handworkProcess} .is_fixedPrice`).prop('checked')) {
            var unit_price = parseFloat($(`${handworkProcess} .ppuProcess:eq(0) input`).val())

        } else {
            var unit_price = []
            $(`${handworkProcess} .ppuProcess`).each(function (index1) {
                unit_price.push(parseFloat($(`${handworkProcess} .ppuProcess:eq(${index1}) input`).val()))
            })
        }

        arr.push({
            type: 'handwork',
            type_id: 9,
            name: $(handworkProcess + ' .nameProcess input').val(),
            info: {
                is_fixedPrice: $(`${handworkProcess} .is_fixedPrice`).prop('checked'),
                unit_price
            },
            line: []
        })
    })
    est.setHandworkProcess(arr)
}

function storeCustomProcess() {
    var arr = []
    $('.customProcess').each(function (index) {
        var customProcess = '.customProcess:eq(' + index + ')'

        if ($(`${customProcess} .is_fixedPrice`).prop('checked')) {
            var unit_price = parseFloat($(`${customProcess} .ppuProcess:eq(0) input`).val())

        } else {
            var unit_price = []
            $(`${customProcess} .ppuProcess`).each(function (index1) {
                unit_price.push(parseFloat($(`${customProcess} .ppuProcess:eq(${index1}) input`).val()))
            })
        }

        arr.push({
            type: 'custom',
            type_id: 9,
            name: $(customProcess + ' .nameProcess input').val(),
            info: {
                is_fixedPrice: $(`${customProcess} .is_fixedPrice`).prop('checked'),
                unit_price
            },
            line: []
        })
    })
    est.setCustomProcess(arr)
}

function storeMaterial() {
    var arr = []

    $('.materialProcess').each(function (index) {
        var materialProcess = `.materialProcess:eq(${index})`;
        if ($(`${materialProcess} .is_fixedPrice`).prop('checked')) {
            var qty_material = parseFloat($(`${materialProcess} .numMat input`).val())

        } else {
            var qty_material = []
            $(`${materialProcess} .numMat`).each(function (index1) {
                qty_material.push(parseFloat($(`${materialProcess} .numMat:eq(${index1}) input`).val()))
            })

        }

        if ($(materialProcess).attr('from-process') != null) {
            var from_process = $(materialProcess).attr('from-process')
            var comp_index = parseInt($(materialProcess).attr('comp-index'))
            var process_index = parseInt($(materialProcess).attr('process-index'))

        } else {
            var from_process = comp_index = process_index = null

        }

        arr.push({
            type: 'material',
            type_id: 10,
            name: $(`${materialProcess} .nameProcess input`).val(),
            info: {
                unit_price: parseFloat($(`${materialProcess} .ppuProcess input`).val()),
                is_fixedPrice: $(`${materialProcess} .is_fixedPrice`).prop('checked'),
                qty_material,
                from_process,
                comp_index,
                process_index,
            },
            line: []
        })
    })
    est.setMaterial(arr)
}

function getSpecialInk2(index, colorIndex) {
    var arr = []
    const selector = `.specialInkSection[index=${index}] .specialInk-container:eq(${colorIndex})`;
    // const class_name= '.component[index='+index+']'
    if ($(`${selector} .has_speInk`).prop('checked')) {
        const isCustomPaper = $(`.paperInput[index=${index}] .custom-paper`).attr('custom') == 1 ? true : false
        const paperType = isCustomPaper ? $(`.component[index=${index}] .paperCode-custom`).text() : $(`.component[index=${index}] .paperType`).val()

        console.log("isCustomPaper", isCustomPaper, paperType, isCustomPaper ? paperType : getPaperCodeSpecialInk(paperType))

        $(`${selector} .tr_speInk`).each(function (ink_index) {
            const speInk = `${selector} .tr_speInk:eq(${ink_index})`

            const data = {
                type: 'material',
                type_id: 10,
                process_id: parseInt($(`${speInk} .speInk_type`).val()),
                name: getSpecialInkType(parseInt($(`${speInk} .speInk_type`).val())),
                info: {
                    ink_name: $(`${speInk} .speInk_name`).val(),
                    print_style: $(`${speInk} .speInk_fillingStyle`).val(),
                    paper_code: isCustomPaper ? paperType : getPaperCodeSpecialInk(paperType),
                    is_custom_paper_code: isCustomPaper ? true : false
                },
                line: []

            }


            arr.push(data)
        })
    }
    console.log("arr", arr)
    return arr
}


function storeOtherCost() {
    var arr = []

    $('.otherCostProcess').each(function (index) {
        var otherCostProcess = `.otherCostProcess:eq(${index})`;

        if ($(`${otherCostProcess} .is_fixedPrice`).prop('checked')) {
            var qty_other = parseFloat($(otherCostProcess + ' .numMat input').val())
        } else {
            var qty_other = []

            $(`${otherCostProcess} .numMat`).each(function (index1) {
                qty_other.push(parseFloat($(`${otherCostProcess} .numMat:eq(${index1}) input`).val()))
            })
        }

        if ($(otherCostProcess).attr('from-process') != null) {
            var from_process = $(otherCostProcess).attr('from-process')
            var comp_index = parseInt($(otherCostProcess).attr('comp-index'))
            var process_index = parseInt($(otherCostProcess).attr('process-index'))
        } else {
            var from_process = comp_index = process_index = null
        }

        arr.push({
            type: 'otherCost',
            type_id: 13,
            name: $(otherCostProcess + ' .nameProcess input').val(),
            info: {
                unit_price: parseFloat($(otherCostProcess + ' .ppuProcess input').val()),
                qty_other: qty_other,
                is_fixedPrice: $(otherCostProcess + ' .is_fixedPrice').prop('checked'),
                from_process: from_process,
                comp_index: comp_index,
                process_index: process_index,
            },
            line: []
        })
    })
    est.setOtherCost(arr)
}

function storeDataBeforeCalcPrice() {
    storeJob()
    storePriceDifference()
    storeCustomerGift()
    const num_comp = $('.component').length

    if (checkValidateFlexoSize() && checkValidatePaperMarkup()) {
        for (var index = 0; index < num_comp; index++) {
            const item = est.mainData.component1[index]
            const componentType = getComponentType(index)

            if (
                checkValidateNameComp(index) &&
                checkValidatePapernCorrugated(index, componentType) &&
                checkValidateSpecialInk(index) &&
                checkValidateGluedspot(index)
            ) {
                //store component name
                item.component_name = $(`.nameComponent[index=${index}] .nameComp`).val()
                item.box_type.glued_spot = getGluedspot(index)
                item.process = getDefaultProcess(index)
                item.color = getComponentColor(index)
                item.process.push(...getCoatingDefaultProcess(index))


                switch (componentType) {
                    //store paper and corrugated board
                    case 1:
                        item.paper = getPaperInfo(index)
                        break
                    case 2:
                        item.paper = getPaperInfo(index)
                        item.corrugated_layer.info = getCorrugatedInfo(index)
                        item.process.push({
                            type: 'afterpress',
                            name: 'corrugated_glued',
                            type_id: 7,
                            process_id: 24,
                            info: {},
                            line: [],
                        })
                        break
                    case 3:
                        item.corrugated_layer.info = getCorrugatedInfo(index)
                        break
                }

                est.setDefaultPacking(index)
                est.setCalculateUps(index)

            } else {
                return false
            }
        }

        if (checkValidateProcess()) {
            storeOtherProcess()
            storeHandworkProcess()
            storeCustomProcess()
            storeMaterial()
            storeOtherCost()
        } else {
            console.log("else validate process")
            return false
        }

    } else {
        return false
    }

    return true
}

function setCalculatePrice() {
    est.setSystemVersion(SYSTEM_VERSION)
    est.mainData.tax = defaultData?.tax_percent
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

function storePacking(index, fIndex = 0) {
    var item = est.mainData.component1[index]
    const checked = $(`.carton[index=${index}][fIndex=${fIndex}] input`).prop('checked')
    if (!checked) {
        item.packing[fIndex].forEach((packing, packingIndex) => {
            if (packing.name == 'carton') {
                item.packing[fIndex].splice(packingIndex, 1)
            }
        })
    } else {
        var inner_width = parseFloat((parseFloat($(`.w_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val())))
        var inner_length = parseFloat((parseFloat($(`.l_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val())))
        var inner_height = parseFloat((parseFloat($(`.h_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val())))
        var inner = [inner_width, inner_length, inner_height]

        est.setInnerSizeCarton(item, inner, fIndex)
    }

    if ($(`.kraftwrap[index=${index}][fIndex=${fIndex}] input`).prop('checked') == false) {
        item.packing[fIndex].forEach((packing, packingIndex) => {
            if (packing.name == 'kraftwrap') {
                item.packing[fIndex].splice(packingIndex, 1)
            }
        })
    }

    storePaperband(index, fIndex)
    storePallet(index, fIndex)
}

function storePaperband(index, fIndex = 0) {
    if ($(`.paperband[index=${index}][fIndex=${fIndex}] input`).prop('checked') == true) {
        var paperband_obj = {
            type: $(`.paperbandType[index=${index}][fIndex=${fIndex}]`).val(),
            qty_per_paperband: parseInt($(`.qty_per_band[index=${index}][fIndex=${fIndex}]`).val())
        }
    } else {
        var paperband_obj = ""
    }

    est.setPaperband(index, paperband_obj, fIndex)
}

function storeKraftwrap(index, fIndex = 0) {
    var num_side = [
        parseInt($(`.numW_Kraftwrap[index=${index}][fIndex=${fIndex}]`).val()),
        parseInt($(`.numL_Kraftwrap[index=${index}][fIndex=${fIndex}]`).val()),
    ]
    var pack_size = setCalculateKraftwrapSize(index, num_side, fIndex)
    const is_editKraftwrapQty = $(`.edit_kraftwrap_qty[index=${index}][fIndex=${fIndex}]`).prop('checked')

    if ($(`.edit_kraftwrap_qty[index=${index}][fIndex=${fIndex}]`).prop(`checked`) == true) {
        var qty_per_kraftwrap = parseInt($(`.kraftwrap_qty[index=${index}][fIndex=${fIndex}]`).val().replace(/,/g, ''))
    } else {
        var qty_per_kraftwrap = ""
    }

    if ($(`.kraftwrap[index=${index}][fIndex=${fIndex}] input`).prop('checked') == true) {
        var kraftwrap_obj = {
            num_side: num_side,
            ...pack_size,
            qty_per_kraftwrap: qty_per_kraftwrap,
            is_editKraftwrapQty
        }
    } else {
        var kraftwrap_obj = ""
    }

    est.setKraftwrap(index, kraftwrap_obj, fIndex)
}

function storeCarton(index, fIndex = 0) {
    const selector = $(`.packingComponent[index=${index}][fIndex=${fIndex}]`)
    const checked = selector.find('.carton input').prop('checked') || false

    if (!checked) {
        // * ลบ packing carton
        var carton_obj = ""
        est.setCarton(index, carton_obj, fIndex)

        return false
    }

    // *---------------------------------------------------

    var unit = getUnitPackingCarton(index, fIndex)
    var num_layer = parseInt($(`.cartonLayer[index=${index}][fIndex=${fIndex}]`).val())
    var flute_type = $(`.fluteCtn_corrugated[index=${index}][fIndex=${fIndex}] select`).val()
    var type_1 = $(`.type_1Ctn[index=${index}][fIndex=${fIndex}]`).val()
    var gram_1 = parseInt($(`.gram_1Ctn[index=${index}][fIndex=${fIndex}]`).val()) || ''
    var type_2 = $(`.type_2Ctn[index=${index}][fIndex=${fIndex}]`).val()
    var gram_2 = parseInt($(`.gram_2Ctn[index=${index}][fIndex=${fIndex}]`).val()) || ''
    var type_3 = $(`.type_3Ctn[index=${index}][fIndex=${fIndex}]`).val()
    var gram_3 = parseInt($(`.gram_3Ctn[index=${index}][fIndex=${fIndex}]`).val()) || ''
    var gram = [gram_1, gram_2, gram_3]

    if (gram_2 == "") {
        alert('กรุณากรอกข้อมูล Packing: Carton ให้ครบถ้วน')
        var carton_obj = ""
        est.setCarton(index, carton_obj, fIndex)
        return false
    }

    // *---------------------------------------------------

    var carton_size = []
    const layer_carton = parseInt(selector.find(`.carton_layer`).val() || 1)

    $(`.innerCtnSize[index=${index}][fIndex=${fIndex}] input`).each((index2) => {
        const inputValue = $(`.innerCtnSize[index=${index}][fIndex=${fIndex}] input:eq(${index2})`).val()

        if (inputValue != "") {
            carton_size.push(parseFloat(inputValue))
        } else {
            carton_size.push("")
        }
    })

    const custom = {
        is_custom_inner_size: selector.find(`.is_custom_inner_size`).prop('checked'),
        is_custom_qty_per_carton: selector.find(`.is_custom_qty_per_carton`).prop('checked'),
        is_carton_printing: selector.find(`.is_carton_printing`).prop('checked'),
        carton_layer: layer_carton,
        layout: [
            parseInt(selector.find('.carton_laying_width').val() || 0),
            parseInt(selector.find('.carton_laying_length').val() || 0),
        ],
    }

    const corrugatedInfo = db.db.corrugated_info?.find(item1 =>
        item1.flute_type == flute_type &&
        item1.type_1 == type_1 &&
        item1.gram_1 == gram_1 &&
        item1.type_2 == type_2 &&
        item1.gram_2 == gram_2 &&
        item1.type_3 == type_3 &&
        item1.gram_3 == gram_3
    )

    const obj = {
        grade: corrugatedInfo?.grade,
        all_gram: corrugatedInfo?.total_gram,
        thickness: corrugatedInfo?.flute_thickness,
        cost: corrugatedInfo?.rate
    }

    var carton_obj = {
        inner_size: carton_size,
        layer_carton: layer_carton,
        corrugated: {
            flute_type: flute_type,
            grade: obj.grade,
            gram: gram,
            all_gram: obj.all_gram,
            thickness: obj.thickness,
            corrugated_layer: num_layer,
            price: obj.cost
        },
        custom,
        unit: unit
    }

    console.log("storeCarton", carton_obj)

    est.setCarton(index, carton_obj, fIndex)
}

function storePallet(index, fIndex = 0) {
    var palletDelivery = parseInt($(`.palletDelivery[index=${index}][fIndex=${fIndex}] select`).val())
    var palletSize = parseInt($(`.palletSize[index=${index}][fIndex=${fIndex}] select`).val())
    var is_mif_pallet = $(`.is_mif_pallet[index=${index}][fIndex=${fIndex}]`).prop('checked') || false

    if ($(`.pallet[index=${index}][fIndex=${fIndex}] input`).prop('checked') == true) {
        var pallet_obj = {
            delivery_id: palletDelivery,
            pallet_id: palletSize,
            is_mif_pallet
        }
    } else {
        var pallet_obj = ""
    }

    est.setPallet(index, pallet_obj, fIndex)
}

function storeDataBeforeSave() {
    storeEstimatorName()
    storeLossInput()
}


function storeLossInput() {
    const loss = []

    $('.loss_baht:visible').each((index, ele) => {
        const val = $(ele).val().split(',')
        loss.push(parseFloat(val.join('') || 0))
    })

    est.setLoss(loss)
}
//* END function to store data from ui to est.mainData object ---------------------------------------

//* START function to get info from input field -------------------------------------------------------
function getComponentDetail(index) { //* New version for F 07.07.22
    const f_detail = storeQty2()
    var componentType = getComponentType(index)
    var dim = getDimension(index)
    var component = {
        box_type: {
            type_id: getBoxTemplate(index),
            glued_spot: getGluedspot(index),
            is_digital_diecut: getIsDigitalDiecut(index)
        },
        component_name: $('.nameComponent[index=' + index + '] .nameComp').val(),
        color: getComponentColor(index),
        packaging_size: {
            width: dim.width,
            length: dim.length,
            depth: dim.depth,
            glue_flap: dim.glue,
            tuck_flap: dim.tuck,
            dust_flap: dim.dust,
            ol: dim.ol
        },
        packing: []
    }

    if (getBoxTemplate(index) == 12) {
        var opensize = [],
            packingsize = []

        $(`.inputType[index=${index}] .openSizein input`).each(function () {
            opensize.push(parseFloat($(this).val()))
        })
        $(`.inputType[index=${index}] .openSizemm input`).each(function () {
            opensize.push(parseFloat($(this).val()))
        })
        $(`.inputType[index=${index}] .packingsizeinch input`).each(function () {
            packingsize.push(parseFloat($(this).val()))
        })
        $(`.inputType[index=${index}] .packingsizemm input`).each(function () {
            packingsize.push(parseFloat($(this).val()))
        })
        component.packing_layer = parseInt($(`.packingLayer[index=${index}] input`).val())
        component.open_size = opensize
        component.packing_size = packingsize
    }

    var default_obj = getPapernCorrugated(index, componentType)
    var addon_arr = getAddon2(index)
    var special_ink = getSpecialInk2(index)

    return {
        ...component,
        ...default_obj,
        special_ink: [
            ...special_ink
        ],
        addon: addon_arr,
        layout_manual: false,
        f_detail
    }
}

function getDimension(index) {
    const componentTemplate = '.componentTemplate[index=' + index + ']'
    if ($(componentTemplate + ' .width').val() == "") {
        var width = 0
    } else {
        var width = parseFloat($(componentTemplate + ' .width').val())
    }
    if ($(componentTemplate + ' .length').val() == "") {
        var length = 0
    } else {
        var length = parseFloat($(componentTemplate + ' .length').val())
    }
    if ($(componentTemplate + ' .depth').val() == "") {
        var depth = 0
    } else {
        var depth = parseFloat($(componentTemplate + ' .depth').val())
    }
    if ($(componentTemplate + ' .glue').val() == "") {
        var glue = 0
    } else {
        var glue = parseFloat($(componentTemplate + ' .glue').val())
    }
    if ($(componentTemplate + ' .dust').val() == "") {
        var dust = 0
    } else {
        var dust = parseFloat($(componentTemplate + ' .dust').val())
    }
    if ($(componentTemplate + ' .tuck').val() == "") {
        var tuck = 0
    } else {
        var tuck = parseFloat($(componentTemplate + ' .tuck').val())
    }
    if ($(componentTemplate + ' .ol').val() == "") {
        var ol = 0
    } else {
        var ol = parseFloat($(componentTemplate + ' .ol').val())
    }
    return {
        width: width,
        length: length,
        depth: depth,
        glue: glue,
        dust: dust,
        tuck: tuck,
        ol: ol
    }
}

function getComponentColor(index) { //* New version for F 07.07.22

    const selector = `.specialInkSection[index=${index}] .specialInk-container `;

    const colorList = []

    $(selector).each(function (colorIndex, ele) {
        const obj = {
            outside: parseInt($(ele).find('.colorOutside').val() || 0),
            inside: parseInt($(ele).find('.colorInside').val() || 0),
            f_code: $(ele).find('.f-code-select option:selected')?.val() || "",
            is_special_ink: $(ele).find('.has_speInk').prop('checked') || false,
            // is_black_printing: $(ele).find('.is_black_printing').prop('checked') || false,
            black_printing_outside: $(ele).find('.is_black_printing.outside').prop('checked') || false,
            black_printing_inside: $(ele).find('.is_black_printing.inside').prop('checked') || false,
            all: 0,
            special_ink: []
        }

        obj.all = obj?.outside + obj?.inside

        obj.special_ink = getSpecialInk2(index, colorIndex)

        colorList.push(obj)
    })

    return colorList
}

function getPrintType() {
    return $('#print_type select').val()
}

function getInkType() {
    return $('#ink_type select').val()
}

function getIsProfitSharing() {
    return $('.chk_profit_sharing').prop('checked') || false
}

function getComponentType(index) {
    //component type : paper, paper+corrugated, corrugated
    return parseInt($('.componentSpec[index=' + index + '] .componentType').val())
}

function getBoxTemplate(index) {
    if ($('.componentTemplate[index=' + index + '] .boxType').val() != "") {
        return parseInt($('.componentTemplate[index=' + index + '] .boxType').val())
    } else {
        return ""
    }
}

function getGluedspot(index) {
    if ($('.componentTemplate[index=' + index + '] .is_assembled').prop('checked')) {
        return parseInt($('.componentTemplate[index=' + index + '] .glued_spot').val())
    } else {
        return 0
    }
}

function getIsDigitalDiecut(index) {
    return $('.componentTemplate[index=' + index + '] .is_digital_diecut').prop('checked')
}

function getComponentSize(index) {
    const componentTemplate = '.componentTemplate[index=' + index + ']'
    if (getBoxTemplate(index) != 0) {
        var type = getBoxTemplate(index)
        var componentType = getComponentType(index)
        if ($(componentTemplate + ' .width').val() == "") {
            var width = 0
        } else {
            var width = parseFloat($(componentTemplate + ' .width').val())
        }
        if ($(componentTemplate + ' .length').val() == "") {
            var length = 0
        } else {
            var length = parseFloat($(componentTemplate + ' .length').val())
        }
        if ($(componentTemplate + ' .depth').val() == "") {
            var depth = 0
        } else {
            var depth = parseFloat($(componentTemplate + ' .depth').val())
        }
        if ($(componentTemplate + ' .glue').val() == "") {
            var glue = 0
        } else {
            var glue = parseFloat($(componentTemplate + ' .glue').val())
        }
        if ($(componentTemplate + ' .dust').val() == "") {
            var dust = 0
        } else {
            var dust = parseFloat($(componentTemplate + ' .dust').val())
        }
        if ($(componentTemplate + ' .tuck').val() == "") {
            var tuck = 0
        } else {
            var tuck = parseFloat($(componentTemplate + ' .tuck').val())
        }
        if ($(componentTemplate + ' .ol').val() == "") {
            var ol = 0
        } else {
            var ol = parseFloat($(componentTemplate + ' .ol').val())
        }
        var dimension_obj = {
            width: width,
            length: length,
            depth: depth,
            glue_flap: glue,
            tuck_flap: tuck,
            dust_flap: dust,
            ol: ol
        }
        if (type != 12) {
            var openSize_arr = est.setCalculateOpenSize(dimension_obj, type)
            var foldSize_arr = est.setCalculateFoldSize(dimension_obj, type)
            $(componentTemplate + ' .foldSizemm input').each(function (index1) {
                if (foldSize_arr[index1 + 3] == 0) {
                    $(this).val("")
                } else {
                    $(this).val(foldSize_arr[index1 + 3])
                }
            })
            $(componentTemplate + ' .foldSizein input').each(function (index1) {
                if (foldSize_arr[index1] == 0) {
                    $(this).val("")
                } else {
                    $(this).val(foldSize_arr[index1])
                }
            })

            $(componentTemplate + ' .openSizemm input').each(function (index1) {
                if (openSize_arr[index1 + 2] == 0) {
                    $(this).val("")
                } else {
                    $(this).val(openSize_arr[index1 + 2])
                }
            })
            $(componentTemplate + ' .openSizein input').each(function (index1) {
                if (openSize_arr[index1] == 0) {
                    $(this).val("")
                } else {
                    $(this).val(openSize_arr[index1])
                }
            })
        } else {
            var foldSize_arr = est.setCalculateFoldSize(dimension_obj, type)
            $(componentTemplate + ' .foldSizemm input').each(function (index1) {
                if (foldSize_arr[index1 + 3] == 0) {
                    $(this).val("")
                } else {
                    $(this).val(foldSize_arr[index1 + 3])
                }
            })
            $(componentTemplate + ' .foldSizein input').each(function (index1) {
                if (foldSize_arr[index1] == 0) {
                    $(this).val("")
                } else {
                    $(this).val(foldSize_arr[index1])
                }
            })
        }
        setfluteAlign(index, componentType)
    }
}

function getPapernCorrugated(index, componentType) {
    var process = getDefaultProcess(index)
    switch (componentType) {
        case 1: //only paper
            var paper = getPaperInfo(index)
            var gram = parseInt($('.component[index=' + index + '] .paperGram').val() || $('.component[index=' + index + '] .paperGram-custom').text())
            var paper_source_id = parseInt($('.component[index=' + index + '] .select_paper_source').val())
            var component_type = {
                type: 1,
                type_name: 'paper',
                detail: 'only paper',
                detail_th: 'ไม่ประกบลูกฟูก'
            }
            return { paper, gram, component_type, process, paper_source_id }
        case 2: // paper + corrugated
            var paper = getPaperInfo(index)
            var gram = parseInt($('.component[index=' + index + '] .paperGram').val() || $('.component[index=' + index + '] .paperGram-custom').text())
            var paper_source_id = parseInt($('.component[index=' + index + '] .select_paper_source').val())
            var component_type = {
                type: 2,
                type_name: 'both',
                detail: 'paper+corrugated',
                detail_th: 'ประกบลูกฟูก'
            }
            var corrugated_layer = {
                type_id: 10,
                type: 'material',
                process_id: 30,
                name: 'corrugated',
                info: getCorrugatedInfo(index),
                component_flute_side: $('.inputType[index=' + index + '] .flute_side').val(),
                price: []
            }
            process.push({
                type: 'afterpress',
                name: 'corrugated_glued',
                type_id: 7,
                process_id: 24,
                info: {},
                line: [],
            })
            return { paper, gram, component_type, corrugated_layer, process, paper_source_id }
        case 3: //only corrugated
            var corrugated_layer = {
                type_id: 10,
                type: 'material',
                process_id: 30,
                name: 'corrugated',
                info: getCorrugatedInfo(index),
                component_flute_side: $('.inputType[index=' + index + '] .flute_side').val(),
                price: []
            }
            var component_type = {
                type: 3,
                type_name: 'corrugated',
                detail: 'only corrugated',
                detail_th: 'เฉพาะลูกฟูก'
            }
            var gram = corrugated_layer.info.all_gram
            return { corrugated_layer, gram, component_type, process }
    }
}

function getDefaultProcess(index) {
    var process_arr = [{
        type: 'afterpress',
        name: 'diecut',
        type_id: 7,
        process_id: 21,
        info: {},
        line: []
    }]

    var glued_spot = getGluedspot(index)
    if (glued_spot > 0) {
        process_arr.push(
            {
                type: 'afterpress',
                name: 'assembly',
                type_id: 7,
                process_id: 20,
                info: {},
                line: []
            },
        )
    }

    const is_digital_diecut = $(`.inputType[index=${index}] .is_digital_diecut`).prop('checked') || false
    if (is_digital_diecut) {
        process_arr.push(
            {
                type: 'afterpress',
                name: 'digital_diecut',
                type_id: 7,
                process_id: 54,
                info: { is_digital_diecut },
                line: []
            },
        )

        // * เงื่อนไข : กรณีเลือก digital diecut จะไม่มี diecut , block ปกติ
        process_arr = process_arr?.filter(obj => obj.process_id != 21)
    }

    return process_arr
}

function getCoatingDefaultProcess(index) {
    const item = est.mainData.component1[index]
    return item?.addon?.filter(obj => obj?.info?.code == 'OPPC')?.map(obj => {
        return {
            type: 'material',
            name: 'opp_cold_film',
            type_id: 10,
            process_id: 140,
            info: {
                obj,
                component_info: {
                    component_name: item?.component_name,
                    index,
                    component_type: item?.component_type
                },
                process_name: 'OPP Cold Film'
            },
            line: []
        }
    })
}

function getPaperInfo(index) {

    const objPaperInfo = {
        paper_source_id: parseInt($(`.component[index=${index}] .select_paper_source`).val() || 0),
        paper_markup: parseInt($(`.paperMarkup[index=${index}] input`).val() || 0),
        paper_percent: parseFloat($(`.component[index=${index}] .paperPercent`).val() || 0),
        sheet_unit_price: $(`.component[index=${index}] .sheet_unit_price`).prop('checked'),
        paper_cost: parseFloat($(`.component[index=${index}] .paperCost`).val() || 0),
        paper_code: null,
        paper_name: null, // type
        paper_thickness: 0,
        is_custom: 0,
        remark: $(`.component[index=${index}] .remark-paper`).val(),
        paper_gram: 0,
        brand: $(`.component[index=${index}] input.paper_brand_supplier`).val() || ''
    }

    if (getIsCustomPaperType(index)) {
        const paper_code = $(`.component[index=${index}] .paperCode-custom`).text()
        const type = $(`.component[index=${index}] .paperType-custom`).text()

        objPaperInfo.paper_gram = parseInt($(`.component[index=${index}] .paperGram-custom`).text() || 0)
        objPaperInfo.paper_thickness = parseFloat($(`.component[index=${index}] .paperThickness-custom`).text() || 0)
        objPaperInfo.paper_code = paper_code
        objPaperInfo.paper_name = type
        objPaperInfo.is_custom = 1

    } else {
        const type = $(`.component[index=${index}] .paperType`).val()

        objPaperInfo.paper_gram = parseInt($(`.component[index=${index}] .paperGram`).val() || 0)

        db.db.paper_info.forEach((item1) => {
            if (item1.paper_code == type && item1.gram == objPaperInfo.paper_gram && item1?.is_fsc == 0) {
                objPaperInfo.paper_code = item1.paper_code
                objPaperInfo.paper_name = item1.paper_type
                objPaperInfo.paper_thickness = item1.thickness_mm
                objPaperInfo.brand = objPaperInfo?.paper_source_id == 2 ? item1.brand_import : item1.brand
            }
        })
    }

    return objPaperInfo
}

function getCorrugatedInfo(index) {
    if ($(`.corrugatedInput[index=${index}] .custom-corrugated`).attr('custom') == 1) {
        let flute_side = 'WSize'
        var num_layer = $(`.component[index=${index}] .layerCorrugated-custom`).text()
        var flute_type = $(`.component[index=${index}] .fluteCorrugated-custom`).text()
        var type_1 = $(`.component[index=${index}] .type_custom_1`).text()
        var gram_1 = parseInt($(`.component[index=${index}] .gram_custom_1`).text())
        var type_2 = $(`.component[index=${index}] .type_custom_2`).text()
        var gram_2 = parseInt($(`.component[index=${index}] .gram_custom_2`).text())
        var type = [type_1, type_2]
        var gram = [gram_1, gram_2]
        var remark = $(`.component[index=${index}] .remark-corrugated`).val()
        var thickness = toNumber($(`.component[index=${index}] .thickness-custom`).text())
        var all_gram = 0
        var name = `${type_1}${gram_1}/${type_2}${gram_2}`

        var fluteInfo_custom = $(`.component[index=${index}] .fluteInfo-custom`).text()
        var costCorrugated_custom = toNumber($(`.component[index=${index}] .costCorrugated-custom`).text(), 3)
        var fluteSide_custom = toNumber($(`.component[index=${index}] .fluteSide-custom`).text(), 3)
        var cutOff_custom = toNumber($(`.component[index=${index}] .cutOff-custom`).text(), 3)

        var is_price_per_sheet = getIsCustomCorrugated(index) //$(`.component[index=${index}] .isPricePerSheet`).val() == 1 ? true : false

        var corrugated_size = [
            toNumber(inch2mm(fluteSide_custom), 3),
            toNumber(inch2mm(cutOff_custom), 3),
            toNumber(fluteSide_custom, 3),
            toNumber(cutOff_custom, 3)
        ]

        corrugated_flute_side = 'WSize'

        // * find thickness
        if (flute_type !== 'Custom') {

            var obj = db.db.corrugated_info?.find(corr =>
                corr.flute_type == flute_type
                && corr.num_layer == num_layer
            )

            if (!obj) {
                console.log("can't find corrugated thickness")
            }

            thickness = obj?.flute_thickness || 1
        }

        gram.forEach((element) => {
            all_gram += element
        })

        if (num_layer == 2) {
            var corrugated_obj = {
                flute_type: flute_type, //* custom -> fluteInfo_custom
                num_layer: parseInt(num_layer),
                type: type,
                gram: gram,
                all_gram: all_gram,
                thickness: thickness,
                corrugated_markup: defaultData.corrugated_markup,
                corrugated_glued_cost: defaultData.corrugated_glued_cost,
                remark: remark,
                name: name,
                is_custom: 1,

                fluteInfo_custom: fluteInfo_custom,
                costCorrugated_custom: costCorrugated_custom,
                is_price_per_sheet: is_price_per_sheet,
                fluteSide_custom: fluteSide_custom,
                cutOff_custom: cutOff_custom,
                corrugated_size: corrugated_size,
                corrugated_flute_side
            }

            return corrugated_obj
        } else {
            var type_3 = $('.component[index=' + index + '] .type_custom_3').text()
            var gram_3 = parseInt($('.component[index=' + index + '] .gram_custom_3').text())
            name += `/${type_3}${gram_3}`

            type.push(type_3)
            gram.push(gram_3)
            all_gram += gram_3

            var corrugated_obj = {
                flute_type: flute_type,
                num_layer: parseInt(num_layer),
                type: type,
                gram: gram,
                all_gram: all_gram,
                thickness: thickness,
                cost: 0,
                corrugated_markup: defaultData.corrugated_markup,
                remark: remark,
                name: name,
                is_custom: 1,

                fluteInfo_custom: fluteInfo_custom,
                costCorrugated_custom: costCorrugated_custom,
                is_price_per_sheet: is_price_per_sheet,
                fluteSide_custom: fluteSide_custom,
                cutOff_custom: cutOff_custom,
                corrugated_size: corrugated_size,
                flute_side,
                corrugated_flute_side
            }

            return corrugated_obj
        }
    } else {
        var num_layer = $(`.component[index=${index}] .layerCorrugated`).val()
        var flute_type = $(`.component[index=${index}] .fluteCorrugated`).val()
        var type_1 = $(`.component[index=${index}] .type_1`).val()
        var gram_1 = parseInt($(`.component[index=${index}] .gram_1`).val())
        var type_2 = $(`.component[index=${index}] .type_2`).val()
        var gram_2 = parseInt($(`.component[index=${index}] .gram_2`).val())
        var gram = [gram_1, gram_2]
        var remark = $(`.component[index=${index}] .remark-corrugated`).val()

        if (num_layer == 2) {
            var obj = db.db.corrugated_info?.find(corr =>
                corr.flute_type == flute_type
                && corr.type_1 == type_1
                && corr.gram_1 == gram_1
                && corr.type_2 == type_2
                && corr.gram_2 == gram_2
                && corr.num_layer == num_layer
            )

            var corrugated_obj = {
                name: obj.grade,
                flute_type: flute_type,
                num_layer: parseInt(num_layer),
                gram: gram,
                all_gram: obj.total_gram,
                thickness: obj.flute_thickness,
                corrugated_markup: defaultData.corrugated_markup,
                corrugated_glued_cost: defaultData.corrugated_glued_cost,
                remark: remark,
                is_custom: 0
            }

            return corrugated_obj
        } else {
            var type_3 = $('.component[index=' + index + '] .type_3').val()
            var gram_3 = parseInt($('.component[index=' + index + '] .gram_3').val())

            gram.push(gram_3)

            var obj = db.db.corrugated_info?.find(corr =>
                corr.flute_type == flute_type
                && corr.type_1 == type_1
                && corr.gram_1 == gram_1
                && corr.type_2 == type_2
                && corr.gram_2 == gram_2
                && corr.type_3 == type_3
                && corr.gram_3 == gram_3
            )

            var corrugated_obj = {
                name: obj.grade,
                flute_type: flute_type,
                num_layer: parseInt(num_layer),
                gram: gram,
                all_gram: obj.total_gram,
                thickness: obj.flute_thickness,
                cost: obj.rate,
                corrugated_markup: defaultData.corrugated_markup,
                remark: remark,
                is_custom: 0
            }

            return corrugated_obj
        }
    }
}

function getProcessIndex(index, process) {
    var last_process_index = parseInt($('.' + process + 'Input[index=' + index + ']:last').attr('process-index'))
    return (last_process_index + 1)
}

function getFoilStampInfo(index) {
    // * index = compIndex
    var processClass = '.foilstampInput[index=' + index + ']'
    //var price=defaultData.foilstamp_price // default ไปก่อน
    //* arr เก็บ foilstamp แต่ละกรอบ
    var arr = []
    $(processClass).each(function (index1) {
        const processClassIndex = `${processClass}[process-index=${index1}]`
        const is_customFoil = parseInt($(`${processClassIndex} .custom-foil`).attr('custom'))

        const
            color = $(`${processClassIndex} .foilColor`).val(),
            code = $(`${processClassIndex} .foilCode`).val()

        const f_code = getAddonFCodeValue(processClassIndex) || []
        const block_foil_stamp = db.db.block_stamp_info.find(({ stamp_type }) => stamp_type === 'foil')
        //* loop foilstamp แต่ละกรอบ
        $(`${processClassIndex} table.tb_foilstampSize tr`).each((index, tr) => {
            size = []
            $(tr).find(`.foilstampSize`).each((index2, input) => {
                size.push(parseFloat($(input).val() || null))
            })
            //* custom foil
            //! แก้การเก็บข้อมูล width , length
            if (is_customFoil) {
                arr.push({
                    process_index: index1,
                    code: $(`${processClassIndex} .foilCode-custom`).text(),
                    color: '-',
                    color_th: $(`${processClassIndex} .foilColor-custom`).text(),
                    width: size[0],
                    length: size[1],
                    size,
                    foil_width: parseFloat($(`${processClassIndex} .foilRollWidth-custom`).val()),
                    foil_length: parseFloat($(`${processClassIndex} .foilRollLength-custom`).val()),
                    foil_roll_price: parseFloat($(`${processClassIndex} .foilRollPrice-custom`).val()),
                    foil_roll_min_price: parseFloat($(`${processClassIndex} .foilRollPrice-custom`).val()),
                    is_customFoil: is_customFoil,
                    depth_type: block_foil_stamp.depth_type,
                    depth: block_foil_stamp.depth_mm,
                    block_rate: block_foil_stamp.rate,
                    f_code
                })
            } else {
                //* use foil info from db.
                db.db.foilstamp_info.forEach((foil, index2) => {
                    if (foil.code == code && foil.color_th == color) {
                        arr.push({
                            process_index: index1,
                            code: foil.code,
                            color: foil.color,
                            color_th: foil.color_th,
                            width: size[0],
                            length: size[1],
                            size,
                            //unit_price:parseFloat(price),
                            foil_width: foil.width,
                            foil_length: foil.length,
                            foil_roll_price: foil.roll_price,
                            foil_roll_min_price: foil.roll_min_price,
                            is_customFoil: is_customFoil,
                            depth_type: block_foil_stamp.depth_type,
                            depth: block_foil_stamp.depth_mm,
                            block_rate: block_foil_stamp.rate,
                            f_code
                        })
                    }
                })
            }
        })



        // //* หาค่า block
        // if(arr[index1]){
        //     db.db.block_stamp_info.forEach((item2)=>{
        //         if(item2.stamp_type=='foil'){
        //             arr[index1].depth_type = item2.depth_type
        //             arr[index1].depth = item2.depth_mm
        //             arr[index1].block_rate = item2.rate
        //         }
        //     })
        // }
    })

    return arr
}

function getBossingInfo(index, bossing) {
    const processClass = `.${bossing}Input[index=${index}]`
    const addon = []

    if ($(`${processClass} .${bossing}Check`).prop('checked')) {

        $(processClass).each(function (index1) { //* กรอบ
            const depth = $(`${processClass}[process-index=${index1}] .${bossing}Depth`).val()

            let size = []

            $(`${processClass}[process-index=${index1}] .tb_${bossing}Size tbody tr`).each((index, tr) => {
                size.push([])

                $(tr).find(`.${bossing}Size`).each(function () {

                    if ($(this).val() != "") {
                        size[index].push(parseFloat($(this).val()))
                    }
                })
            })

            const f_code = getAddonFCodeValue(`${processClass}[process-index=${index1}]`) || []

            db.db.block_stamp_info.forEach((info) => {
                if (info.stamp_type == bossing && info.depth_mm == depth) {
                    addon.push({
                        // width: size[0],
                        // length: size[1],
                        size: size, //* [[1, 2], [1, 2]]
                        depth_type: info.depth_type,
                        depth: info.depth_mm,
                        block_rate: info.rate,
                        f_code
                    })
                }
            })

        })

    }

    return addon
}

function getCoatingInfo(index) {
    var arr = [], process_arr = []
    $('.coatingInput[index=' + index + ']').each(function (index1) {
        var count_type = 0
        var processClass = '.coatingInput[index=' + index + '][process-index=' + index1 + ']'
        var code = $(processClass + ' .coatingType').val()
        var option = $(processClass + ' .coatingOption').val()
        var type = code.substring(0, code.length - 2);
        var side = code.substring(code.length - 1)
        let coatingNumber = $(processClass + ' .coatingNumber').val()

        if (['S-UV', 'S-UV-S'].includes(type)) {
            var width = parseFloat($(processClass + ' .coatingSize:eq(0)').val())
            var length = parseFloat($(processClass + ' .coatingSize:eq(1)').val())
        } else {
            var width = 0, length = 0
        }

        if (type == 'B-PACK') {
            var material_type = $(processClass + ' .coatingMaterialType').val()
        } else {
            var material_type = ""
        }
        const f_code = getAddonFCodeValue(processClass) || []

        db.db.coating_info.forEach((item2) => {
            if (item2.coating_code == type && item2.coating_option == option) {
                if (count_type == 0) {
                    arr.push({
                        code: type,
                        type: item2.coating_type,
                        name: option,
                        side: parseInt(side),
                        // coating_price:item2.rate,
                        // min_cost:item2.min_cost,
                        // unit_min_cost:item2.unit_min_cost,
                        width: width,
                        length: length,
                        material_type: material_type,
                        f_code,
                        number: coatingNumber,
                    })
                    if (type == 'B-PACK') {
                        arr[index1].coating_price = 0
                        arr[index1].min_cost = 0
                        arr[index1].unit_min_cost = "sheet"
                    } else {
                        arr[index1].coating_price = item2.rate
                        arr[index1].min_cost = item2.min_cost
                        arr[index1].unit_min_cost = item2.unit_min_cost
                    }
                    amin_cost = ""
                    process_arr.push({
                        process_id: item2.process_id,
                        name: item2.process_name
                    })
                    count_type += 1
                }
            }
        })
    })
    return { info: arr, process_name: process_arr }
}

function getAddonFCodeValue(processClassIndex = '') {
    const isMultipleF = getIsMultipleF()
    const f_code = []
    if (isMultipleF && processClassIndex) {
        $(`${processClassIndex} .f-code-select`).each((index, ele) => {
            const fCode = $(ele).find('option:selected')?.val() || ''
            if (fCode !== '') {
                f_code.push(fCode)
            }
        })
    }
    return f_code
}

function getAddon(index) {
    var addon_arr = []
    if (checkValidateAddon(index, 'coatingInput')) {
        var coating_obj = getCoatingInfo(index)
        if (coating_obj.info.length > 0) {
            coating_obj.info.forEach((item1, index1) => {
                addon_arr.push({
                    type_id: 3,
                    type: 'coating',
                    process_id: coating_obj.process_name[index1].process_id,
                    name: coating_obj.process_name[index1].name,
                    info: item1,
                    line: []
                })
            })
        }
    } else {
        return false
    }

    if (checkValidateAddon(index, 'foilstampInput')) {
        var foilstamp_arr = getFoilStampInfo(index)
        if (foilstamp_arr.length > 0) {
            foilstamp_arr.forEach((item1, index1) => {
                addon_arr.push({
                    type: 'foilstamp',
                    name: 'foilstamp',
                    type_id: 4,
                    process_id: 3,
                    info: item1,
                    line: []
                })
            })
        }
    } else {
        return false
    }

    if (checkValidateAddon(index, 'embossInput')) {
        var emboss_arr = getBossingInfo(index, 'emboss')
        if (emboss_arr.length > 0) {
            emboss_arr.forEach((item1, index1) => {
                addon_arr.push({
                    type: 'emboss',
                    name: 'emboss',
                    type_id: 5,
                    process_id: 4,
                    info: item1,
                    line: []
                })
            })
        }
    } else {
        return false
    }

    if (checkValidateAddon(index, 'debossInput')) {
        var debosss_arr = getBossingInfo(index, 'deboss')
        if (debosss_arr.length > 0) {
            debosss_arr.forEach((item1, index1) => {
                addon_arr.push({
                    type: 'deboss',
                    name: 'deboss',
                    type_id: 6,
                    process_id: 5,
                    info: item1,
                    line: []
                })
            })
        }
    } else {
        return false
    }

    return addon_arr
}

function getAddon2(index) { //* New version for F 07.07.22
    var addon_arr = []

    if (checkValidateAddon(index, 'coatingInput')) {
        var coating_obj = getCoatingInfo(index)
        if (coating_obj.info.length > 0) {
            coating_obj.info.forEach((item1, index1) => {
                addon_arr.push({
                    type_id: 3,
                    type: 'coating',
                    process_id: coating_obj.process_name[index1].process_id,
                    name: coating_obj.process_name[index1].name,
                    info: item1,
                    line: []
                })
            })
        }
    } else {
        return false
    }

    if (checkValidateAddon(index, 'foilstampInput')) {
        var foilstamp_arr = getFoilStampInfo(index)
        if (foilstamp_arr.length > 0) {
            foilstamp_arr.forEach((item1, index1) => {
                addon_arr.push({
                    type: 'foilstamp',
                    name: 'foilstamp',
                    type_id: 4,
                    process_id: 3,
                    info: item1,
                    line: []
                })
            })
        }
    } else {
        return false
    }

    if (checkValidateAddon(index, 'embossInput')) {
        var emboss_arr = getBossingInfo(index, 'emboss')
        if (emboss_arr.length > 0) {
            emboss_arr.forEach((item1, index1) => {
                addon_arr.push({
                    type: 'emboss',
                    name: 'emboss',
                    type_id: 5,
                    process_id: 4,
                    info: item1,
                    line: []
                })
            })
        }
    } else {
        return false
    }

    if (checkValidateAddon(index, 'debossInput')) {
        var debosss_arr = getBossingInfo(index, 'deboss')
        if (debosss_arr.length > 0) {
            debosss_arr.forEach((item1, index1) => {
                addon_arr.push({
                    type: 'deboss',
                    name: 'deboss',
                    type_id: 6,
                    process_id: 5,
                    info: item1,
                    line: []
                })
            })
        }
    } else {
        return false
    }

    return addon_arr
}

function checkComponentInfo() {
    if ($('.componentInfo').length != 0) {
        return true
    } else {
        return false
    }
}

function checkDivPaperUsage(index) {
    if ($('.componentPaperUsage[index=' + index + ']').length == 0) {
        tbPaperUsage(index)
    }
}

function getKraftwrapSize(index, fIndex = 0) {
    var num_size = [
        parseInt($(`.numW_Kraftwrap[index=${index}][fIndex=${fIndex}]`).val()),
        parseInt($(`.numL_Kraftwrap[index=${index}][fIndex=${fIndex}]`).val()),
    ]
    var layKraftwrap = setCalculateKraftwrapSize(index, num_size, fIndex)

    return {
        lay_size: layKraftwrap.layKraftwrap,
        bulk_size: layKraftwrap.bulk_size
    }
}
function getUnitPackingCarton(index, fIndex = 0) {
    var kraftwrap = $(`.kraftwrap[index=${index}][fIndex=${fIndex}] input`).prop('checked')
    var paperband = $(`.paperband[index=${index}][fIndex=${fIndex}] input`).prop('checked')

    if (kraftwrap == true) {
        var unit = 'kraftwrap'
    } else if (paperband == true) {
        var unit = 'paperband'
    } else {
        var unit = 'piece'
    }

    return unit
}
function getUnitPacking(index, is_forDisplay, fIndex = 0) {
    if (is_forDisplay) {
        const item = est.mainData.component1[index]
        var carton_obj = est.getPackingObj(item, 'carton', fIndex)
        if (carton_obj != null) {
            var carton = true
        } else {
            var carton = false
        }

        var kraftwrap_obj = est.getPackingObj(item, 'kraftwrap', fIndex)
        if (kraftwrap_obj != null) {
            var kraftwrap = true
        } else {
            var kraftwrap = false
        }

        var pallet_obj = est.getPackingObj(item, 'pallet', fIndex)
        if (pallet_obj != null) {
            var pallet = true
        } else {
            var pallet = false
        }

    } else {
        var carton = $(`.carton[index=${index}][fIndex=${fIndex}] input`).prop('checked')
        var kraftwrap = $(`.kraftwrap[index=${index}][fIndex=${fIndex}] input`).prop('checked')
        var pallet = $(`.pallet[index=${index}][fIndex=${fIndex}] input`).prop('checked')
    }

    if (kraftwrap == false && carton == false && pallet == true) {
        var unit = 'piece'
    } else if ((kraftwrap == true && carton == false)) {
        var unit = 'kraftwrap'
    } else if (carton == true) {
        var unit = 'carton'
    } else {
        var unit = 'kraftwrap'
    }
    return unit
}
//* END function to get info from input field -------------------------------------------------------

//* START function to get list info from DB to ui input/select --------------------------------------

function setChangeComponentPaper(index) {
    const comp = $(`.component[index=${index}]`)
    const paperType = comp?.find(`.paperType:visible`).val()
    const paperGram = toNumber(comp?.find(`.paperGram:visible`).val(), 0)
    const info = getPaperTypeInfo(paperType, paperGram) || null
    const {
        is_only_baht_per_sheet = false,
        special_ink_paper_code = null
    } = info || {}

    const default_sheet_unit_price = info && is_only_baht_per_sheet ? true : false
    const disabled = info && is_only_baht_per_sheet ? true : false

    $(`.component[index=${index}] .sheet_unit_price`).prop('disabled', disabled)

    setChangePricePerSheet(index, default_sheet_unit_price, disabled)
    $(`.component[index=${index}] .sheet_unit_price`).prop('checked', default_sheet_unit_price).prop('disabled', disabled)

    checkChangePaperConditions(index)
}

function setChangePricePerSheet(index, bool = false) {
    $(`.component[index=${index}] .sheet_unit_price`).prop('checked', bool)


    console.log("price_per_sheet", index, bool)
    if (bool) {
        $(`.paperInput[index=${index}] .paper_unit_price`).text(' B/Sheet')
    } else {
        $(`.paperInput[index=${index}] .paper_unit_price`).text(' B/Kg')
    }
}

function getPaperGram(data, index) {
    var gram_option = ""
    data.forEach((item) => {
        gram_option += `<option value="${item}">${item}</option>`
    })
    $('.component[index=' + index + '] .paperGram option').remove()
    $('.component[index=' + index + '] .paperGram').append(gram_option)
}

function displayPaperPrice(index, paperType, paperGram, sourcePaperId = 1) {
    var price = getPaperPrice(paperType, paperGram, sourcePaperId)
    var info = getPaperInfo(index)
    $('.component[index=' + index + '] .paperCost').val(price || '')
    $('.component[index=' + index + '] .paper_brand_supplier').html(info?.brand || '-')
    $('.component[index=' + index + '] input.paper_brand_supplier').val(info?.brand || '')
}

function displayPaperFinalPrice(index) {
    var paperPercent = parseFloat($(`.paperInput[index=${index}] .paperPercent`).val() || 0)
    var markup = parseFloat($(`.paperMarkup[index=${index}] input`).val() || 0)
    var paperCost = parseFloat($(`.paperInput[index=${index}] .paperCost`).val() || 0)
    var paperSale = parseFloat(((paperCost * (1 + markup / 100)) + paperPercent).toFixed(2))
    $(`.paperInput[index=${index}] .paperSale`).val(paperSale)
}

function getCoatingTypeOption(data, index, process_index) {
    var coating_type = ""
    if (data != "") {
        coating_type = data.map(({ pages, coating_code, coating_type, condition_key }) => {
            let options = ""
            for (let page = 1; page <= pages; page++) {
                options += `<option value="${coating_code}-${page}" side="${page}" ${condition_key ? `data-condition_key="${condition_key}"` : ""}>${coating_type} ${page} s</option>`
            }
            return options
        })

    } else {
        coating_type += `<option value="">-</option>`
    }
    $('.coatingInput[index=' + index + '][process-index=' + process_index + '] .coatingType option').remove()
    $('.coatingInput[index=' + index + '][process-index=' + process_index + '] .coatingType').append(coating_type)

    $('.coatingInput[index=' + index + '][process-index=' + process_index + '] [data-condition_key]').prop('disabled', true)
}

function getFluteTypeOption(data, index) {
    if (data == "") {
        var option = `<option value="">-</option>`
        $('#corrugatedType select').append(option)
    } else {
        var option = `<option value="">-</option>`
        data.forEach((item1) => {
            option += `<option value="${item1}">${item1}</option>`
        })
    }
    $('.component[index=' + index + '] .fluteCorrugated option').remove()
    $('.component[index=' + index + '] .fluteCorrugated').append(option)
}
function getCorrugatedOption(data, type, index) {
    var option = `<option value="">-</option>`
    data.forEach((item1) => {
        option += `<option value="${item1}">${item1}</option>`
    })
    $('.component[index=' + index + '] .' + type + ' option').remove()
    $('.component[index=' + index + '] .' + type).append(option)
}

function getFoilStampCodeOption(data, index, process_index) {
    var option = ""
    data.forEach((item1) => {
        option += `<option value="${item1}">${item1}</option>`
    })
    $('.foilstampInput[index=' + index + '][process-index=' + process_index + '] .foilCode option').remove()
    $('.foilstampInput[index=' + index + '][process-index=' + process_index + '] .foilCode').append(option)
}

function getCartonFluteTypeOption(index, data, fIndex = 0) {
    $(`.fluteCtn_corrugated[index=${index}][fIndex=${fIndex}] select option`).remove()

    if (data == "") {
        var option = `<option value="">-</option>`
        $(`.fluteCtn_corrugated[index=${index}][fIndex=${fIndex}] select`).append(option)
    } else {
        var option = `<option value="">-</option>`
        data.forEach((item1, index1) => {
            option += `<option value="${item1}">${item1}</option>`
        })

        $(`.fluteCtn_corrugated[index=${index}][fIndex=${fIndex}] select`).append(option)
    }
}

function getCartonOption(index, data, type, fIndex = 0) {
    var option = `<option value="">-</option>`
    data.forEach((item1) => {
        option += `<option value="${item1}">${item1}</option>`
    })
    $(`.${type}Ctn[index=${index}][fIndex=${fIndex}] option`).remove()
    $(`.${type}Ctn[index=${index}][fIndex=${fIndex}]`).append(option)
}

function getCutSizeStdPaper(displaySelector, data, index, isManualLayout = false) {
    const printType = getPrintType()
    const {
        paper_info: {
            std_paper_id: selected_id
        },
        component_type: {
            type
        }
    } = est.mainData.component1[index]

    var stdPaper = ""

    if (!['Konica']?.includes(printType)) {
        stdPaper += `<option value="" style="text-align:center;"> กำหนดเอง </option>`
    }
    // else {
    //     stdPaper += `<option value="" style="text-align:center;"> -- กำหนด layout -- </option>`
    // }
    data.forEach(({
        std_paper_id, std_paper_size_width_in,
        std_paper_size_length_in,
        std_paper_use_ref_size_status,
        std_paper_size_ref_width_in,
        std_paper_size_ref_length_in
    }) => {

        stdPaper +=
            std_paper_use_ref_size_status && !isManualLayout
                ? `<option value="${std_paper_id}" style="text-align:center;">${std_paper_size_width_in} x ${std_paper_size_length_in} (${std_paper_size_ref_width_in} x ${std_paper_size_ref_length_in})</option>`
                : `<option value="${std_paper_id}" style="text-align:center;">${std_paper_size_width_in} x ${std_paper_size_length_in}</option>`
    })

    console.log("stdPaper", stdPaper)

    $(`${displaySelector}[index=${index}] option`).remove()
    $(`${displaySelector}[index=${index}]`).append(stdPaper)

    if (selected_id && !isManualLayout) {
        // $(`.paperSize[index=${index}] input`).attr('readOnly', true)
        setEnableLayoutPaperSize(index, false)
    } else {
        // $(`.paperSize[index=${index}] input`).attr('readOnly', false)
        setEnableLayoutPaperSize(index, true)
    }

    if (type == 3) {
        const {
            corrugated_layer: {
                info: {
                    is_price_per_sheet = false
                }
            }
        } = est.mainData.component1[index]

        setEnableLayoutPaperSize(index, !is_price_per_sheet)
    }

    setEnableLayingForCustomCorrugated(index)
}

//* END function to get list info from DB to ui input/select ----------------------------------------

//* START common function in estimate page ----------------------------------------------------------
//? About Login -----------
function blockUI() {
    return new Promise((resolve) => {
        $.blockUI({
            css: {
                border: 'none',
                padding: '15px',
                backgroundColor: '#E0F0F7',
                '-webkit-border-radius': '15px',
                '-moz-border-radius': '15px',
                opacity: 1,
                color: '#000000',
            }, message: 'Loading'
        })
        resolve(true)
    })
}
function showLogin_estimate(data) {
    $('#login-bttn').text('Log in as ' + data.emp_name)
}

function setIsViewOnly(bool) {
    $('#summary').find('input, select, textarea').not('.is_loss').prop('disabled', bool)

    if (bool) {
        $('#view-only').show()
    } else {
        $('#view-only').hide()
    }
}

function setPage() {
    const action = getPathnameAction(1)
    if (action == 'view') {
        // $('#view-only').show()
        setIsViewOnly(true)
        $('#status_id, #request_for_approve').prop('disabled', true)
        // $('#right-menu').find('div:not(#logout-bttn, #print-bttn)').hide()
    }
}

function setSuperAdmin(bool = false) {

    console.log("is_super_admin", bool)
    if (bool) {
        $('#summary').find('input').not('.is_loss').prop('disabled', !bool)
    }
}

function getJobID(url) {
    const { jobid, log_id } = getUrlParams(url)
    return new Promise(async (res, rej) => {
        if (jobid) {
            console.log("getJobID", jobid)
            await (async () => {
                await setDataRFQ({ rfq_id: jobid, type: 'common', log_id })
                const status_log = await getRFQStatusLog({ rfq_id: jobid, status_id: 2 })
                dat.data_rfq_log.status_log = status_log?.data || []
                displayEstimateData()
            })()
            document.title = jobid
        } else {
            console.log("getJobID", 'New')
            STATUS.setDocStatus({
                status_id: 0,
                remark: '',
                history: []
            })

            STATUS.updateStatus(0)

            STATUS.renderDocumentByRoles()

            setDisplayForJetPress()
            setDisplayForKonica()
        }
        res(true)
    })
}

function setInput2Default() {
    // $('body input').val("")
    $('.paperMarkup input').val(defaultData?.paper_price_marking)
    $('.paperPercent').val("0.0")
    $('#is_newCustomer').prop('checked', false)
    //$('.nameComp:eq(0)').val('Box')
    Date.prototype.toDateInputValue = (function () {
        var local = new Date(this);
        local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
        return local.toJSON().slice(0, 10);
    });
    const newDate = new Date().toDateInputValue()
    displayDateInput("#date input.datepicker", newDate)
}

async function setPrintPDF() {
    await blockUI()

    $(document).find('body').css('zoom', '80%')
    $('button').hide()

    await new Promise(async (res, rej) => {

        const componentElement = est?.mainData?.component1?.map((component, cIndex) => {

            console.log("start converting")
            const template = $(`.componentTemplate:eq(${cIndex}) .inputType .template1`)[0]
            const spec = $(`.componentTemplate:eq(${cIndex}) .inputType .spec1 table`)[0]
            const size = $(`.componentTemplate:eq(${cIndex}) .inputType .size1 table`)[0]
            const size_layout = $(`.componentInfo:eq(${cIndex}) .div_size_component`)[0]
            const layout = $(`.componentInfo:eq(${cIndex}) .tbLayout`)[0]
            const num_laying = $(`.componentInfo:eq(${cIndex}) .divEditLayout`)[0]
            const tolerance = $(`.componentInfo:eq(${cIndex}) .divEditTolerance`)[0]

            const paper_usage = $(`.componentInfo:eq(${cIndex}) .componentPaperUsage table`)[0]

            const obj = {
                template,
                spec,
                size,
                size_layout,
                layout,
                num_laying,
                tolerance,
                paper_usage,
            }

            return obj

        })

        res(componentElement)

    }).then(async res => {

        const res2 = await res?.map((objEle, index) => {
            const {
                template,
                spec,
                size,
                size_layout,
                layout,
                num_laying,
                tolerance,
                paper_usage,
            } = objEle || {}

            return Promise.all([
                getCanvasImg(template),
                getCanvasImg(spec),
                getCanvasImg(size),
                getCanvasImg(size_layout),
                getCanvasImg(layout),
                getCanvasImg(num_laying),
                getCanvasImg(tolerance),
                getCanvasImg(paper_usage),
            ])

        })

        return res2

    }).then(async res => {

        for (let i = 0; i < res?.length; i++) {
            const resData = await res[i]
            est.mainData.component1[i].pdf_img = resData
        }
    })

    /* PACKING */
    await new Promise(async (res, rej) => {
        const packing = []

        $(`.divPacking`).each((index, ele) => {
            packing.push(ele)
        })

        res(packing)

    }).then(async res => {

        const res2 = await res?.map((objEle, index) => {
            return getCanvasImg(objEle)
        })

        return Promise.all(res2)

    }).then(async res => {

        est.mainData.pdf_packing_img = res
    })

    est.mainData.status_id = dat?.data_rfq_log?.status_id
    est.mainData.create_date = dat?.data_rfq_log?.created
    est.mainData.estimate_date = dat?.data_rfq_log?.estimate_date
    PDF.generatePDF(est.mainData)

    $.unblockUI()
}

function getListfromDB() {
    get_box_template_arr(0)
    getFoilStampColor(0)
    getPaperType(0)
    getSpeInkListInfo(db.db.special_ink_factor_info, 'filling_style', 'filling_style_th', 'speInk_fillingStyle')
    getSpeInkListInfo(db.db.special_ink_info, 'process_id', 'special_ink_type_th', 'speInk_type')
    getPaperCodeType()
}

//? SAVE DATA TO DATABASE -----------
function save_data() {
    prepareDatatoDB()
    // console.log("dat.data_DB", dat.data_DB)
    $.ajax({
        url: `${node_api}/estimate/save_rfq`,
        type: 'POST',
        data: JSON.stringify(dat.data_DB),
        dataType: 'json',
        cache: 'false',
        contentType: false,
        processData: false,
        contentType: "application/json",
        beforeSend: () => $('.loader').show(),
        success: async function (res) {
            if (res.success) {
                await saveDeleteFile()
                $('.loader').hide()
                console.log('save success', res)
                window.location = '/'
            } else {
                console.log("res", res)
                alert('เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้. กรุณาติดต่อ MIS')
            }

        },
        error: function (e) {
            $('.loader').hide()
            console.log("Error !", e)
            console.log('save unsuccess')
            alert('เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้')
        }
    })
}
async function saveDeleteFile() {
    const deleteFileList = est.mainData?.fileUpload?.filter(file => file.active === false)
    if (deleteFileList?.length) {
        return Promise.all(deleteFileList.map(file => deleteFile(file.id))).then(respFile => {
            console.log("delete success", respFile)
            return true
        }).catch(error => {
            console.log("Error delete file.", error)
            return false
        })
    }
}

function uploadFile(trIndex, file) {
    var form_data = new FormData();
    form_data.append('index', trIndex);
    // form_data.append('action', 'add');
    form_data.append('file', file);
    form_data.append('originFileName', encodeURIComponent(file.name));
    $.ajax({
        // url: api_url + '/upload.php',
        // dataType: 'json',  // <-- what to expect back from the PHP script, if anything
        // cache: false,
        // contentType: false,
        // processData: false,
        // data: form_data,
        // type: 'post',
        url: `${node_api}/estimate/upload`,
        type: 'POST',
        data: form_data,
        dataType: 'json',
        cache: 'false',
        contentType: false,
        processData: false,
        // contentType: "application/json",
        xhr: function () {

            var xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function (evt) {
                if (evt.lengthComputable) {
                    var percentComplete = (evt.loaded / evt.total) * 100;
                    $('.loader-message').html(`Upload ${Math.round(percentComplete)}/100`)
                    //Do something with upload progress here
                }
            }, false);
            return xhr;
        },
        beforeSend: () => {
            console.log('file', file)
            $('.loading').show()
        },
        success: function (res) {
            if (res.success) {
                const { fileIndex, fileName, filePath, id, originFileName } = res
                $(`.file_upload[index=${trIndex}] input.input_file_upload`).hide();
                const linkFilePath = node_api + '/estimate/file/view/' + fileName
                const fileDisplay = `<a href='${linkFilePath}' target='_blank' file-id='${id}' class="file_path">${originFileName}</a>`
                $(`.file_upload[index=${trIndex}] .file_display a`).remove()
                $(`.file_upload[index=${trIndex}] .file_display`).append(`${fileDisplay}`)
                est.setFileUpload({ action: 'add', fileInfo: res })
            } else {
                console.log("upload fail.")
                alert("ไม่สามารถอัปโหลดไฟล์ได้.")
            }
            $('.loading').hide()
        },
        error: () => {
            console.log("Upload Error !!!")
            $('.loading').hide()
        }
    });
}

function deleteFile(fileId) {
    if (fileId) {
        return $.ajax({
            url: `${node_api}/estimate/upload/${fileId}`,
            type: 'DELETE',
            data: {},
            dataType: 'json',
            cache: 'false',
            contentType: false,
            processData: false,
            // contentType: "application/json",
            // url: api_url + '/upload.php',
            // dataType: 'json',  // <-- what to expect back from the PHP script, if anything
            // cache: false,
            // contentType: false,
            // processData: false,
            // data: form_data,
            // type: 'post',
            success: function (res) {
                console.log("res", res)
                if (res.success) {
                    console.log("delete success")
                    return true
                    // est.setFileUpload({action:'remove',fileId})
                } else {
                    console.log("พบข้อผิดพลาด ไม่สามารถลบไฟล์ได้");
                    console.log("delete fail.")
                    return false
                }
            }
        });
    }
}


//? About Autocomplete -----------
function autocomplete_customer(e, displayCreditTerm = null) {
    $("#customerLabel").autocomplete({
        //source: "timesheetmanager.php?action=autocomplete_machine",
        //source: [ { label: "Choice1", value: "value1" } ],
        source: `${node_api}/estimate/autocomplete?type=customer`,
        minLength: 1,
        select: function (event, ui) {
            $(`#customerLabel`).val(ui.item.value)
            $(`#custID`).val(ui.item.id)
            $(`#custName`).val(ui.item.name)
            displayCreditTerm && displayCreditTerm(ui.item)
            return false;
        }
    });
}

function autocomplete_employee(e, id) {
    $('#' + id + 'Label').autocomplete({
        // source: api_url + "/controllers/estimate.php?post_type=autocomplete_employee",
        source: `${node_api}/estimate/autocomplete?type=employee`,
        minLength: 1,
        select: function (event, ui) {
            $("#" + id + "Name").val(ui.item.name)
            $("#" + id + "ID").val(ui.item.id)
            $("#" + id + "Label").val(ui.item.value)
            return false;
        }
    })
}

function autocomplete_delivery_destination(ele, id, is_oneTimeDelivery) {
    const index = $(ele).closest('tr.deliveryProcess').attr('index')

    $(`.oneTimeDelivery .deliveryDestinationName, .deliveryProcess[index=${index}] .deliveryDestinationName`).autocomplete({
        // source: api_url + "/controllers/estimate.php?post_type=autocomplete_delivery_destination",
        source: `${node_api}/estimate/autocomplete?type=delivery`,
        minLength: 1,
        select: function (event, ui) {
            $(`.deliveryProcess[index=${index}] .${id}Id`).val(ui.item.id)
            $(`.deliveryProcess[index=${index}] .${id}Name`).val(ui.item.value)
            return false;
        }
    })
}

function setCustomerCreditTermInfo(obj = { credit_term_id: null, credit_term_name: '' }) {
    $("#credit_term_id").val(obj?.credit_term_id || '')
    $("#credit_term_name").html(obj?.credit_term_name || '-- ไม่พบข้อมูล --')
}

//? Export to Excel xlsx
function exportExcel() {
    $("#tb_excel").tableExport({
        formats: ["xlsx"],
        sheetname: "Packaging"
    })
}

//? About facillate to user and animate UI
function displaySnackbar(id) {
    var x = $(id)
    x.addClass('show')
    setTimeout(function () { x.removeClass('show'); }, 3000);
}
function addFocusSupport() {
    $('body').on('keypress', ('input:visible'), function (e) {
        if (e.keyCode === 13) {
            var index = $(('input')).index(this) + 1;
            var check_vis, check_read
            if ($(('input')).index(this) < ($('input').length - 1)) {
                check_vis = $('input').eq(index).is(':visible')
                check_read = $('input').eq(index).is('[readonly]')
                while ((check_vis == false || check_read == true) && index <= ($('input').length - 1)) {
                    index = index + 1
                    check_vis = $('input').eq(index).is(':visible')
                    check_read = $('input').eq(index).is('[readonly]')
                }
            }
            $('input').eq(index).focus()
        }
    })
}
function scrollToSection(id) {
    $('html, body').animate({
        scrollTop: $(id).offset().top + 'px'
    }, 'medium');
}
function checkRequiredInput() {
    //*check blank required input to show red-visible-background
    $('body .required').each(function () {
        if ($(this).val() == "") {
            $(this).css("background-color", "#fddfdf")
        } else {
            $(this).css("background-color", "#ffffff")
        }
    })
}

//* END common function in estimate page ----------------------------------------------------------

//* START function input change EVENT -------------------------------------------------------------

function changeAddonEvent(index) {
    var addon_arr = getAddon(index)
    if (addon_arr) {
        est.mainData.component1[index].addon = addon_arr
        est.mainData.component1[index].color = getComponentColor(index)
        est.setCalculateUps(index)
        return true
    }
}

function changeDimensionEvent(index) {
    if (checkValidateQty()) {
        if (checkValidateEachComponent(index)) {
            var is_manualLayout = $('.componentTemplate[index=' + index + '] .is_manualLayout').prop('checked') || false
            storeJob()
            var component_detail = getComponentDetail(index)

            component_detail.layout = {}
            component_detail.layout.layout_manual = is_manualLayout

            if (!est.mainData.component1[index]) {
                est.mainData.component1.push(component_detail)
            } else {
                est.mainData.component1[index] = component_detail
            }
            var item = est.mainData.component1[index]

            est.setCompTypeTolerance(item, false)
            est.setPackagingSize(item, item.box_type.type_id)
            est.setBoxType(item, item.box_type.type_id)
            est.setMachine(item)
            if (is_manualLayout) {
                est.setManualLayout(index, true)
                est.setLayout4Manual(index)
                est.setDefaultPacking(index)
                est.setCalculateUps(index)

            } else {
                console.log("setCalculateLayout (changeDimensionEvent)")
                if (est.setCalculateLayout(index) == false) {
                    checkLaysize(index, false)
                    alert('ไม่สามารถวางเลย์ได้ เนื่องจาก open size มีขนาดใหญ่กว่าไซส์กระดาษ หรือ max machine size (2)')
                    return
                }

                est.setCalculateLaysize(index, true)
                est.setDefaultPacking(index)
                est.setCalculateUps(index)

            }
            return true
        } else {
            return false
        }
    }
}

function changeQtyEvent() {
    console.log("changeQtyEvent")
    const num_comp = $('.component').length
    for (var index = 0; index < num_comp; index++) {
        if (checkComponentInfo()) {
            $('.componentPaperUsage[index=' + index + '] .recalc-paperusage').addClass('show-bttn')
            $('.componentPaperUsage[index=' + index + '] table').hide()
            showCalcBttnPrice()
        }
    }
    $('#Summary,#summary,#packing_section').remove()
}

function changeTaxEvent() {
    storeTax()
    storeExchangeRate()
    est.setCalculateTax()
    $('body #summary .totalTax').each(function (index) {
        $('body #summary .totalTax:eq(' + index + ')').text(numeral(est.mainData.totalprice[index].tax).format('0,0.00'))
        $('body #summary .totalProfitSharing:eq(' + index + ')').text(numeral(est.mainData.totalprice[index]?.profit_sharing || 0).format('0,0.00'))
        $('body #summary .totalFinalPrice:eq(' + index + ')').text(numeral(est.mainData.totalprice[index].final_price).format('0,0.00'))
        $('body #summary .totalUnitPrice:eq(' + index + ')').text(numeral(est.mainData.totalprice[index].unit_price).format('0,0.00'))
        $('body #summary .totalUnitPriceExchange:eq(' + index + ')').text(numeral(est.mainData.totalprice[index]?.unit_price_exchange || est.mainData.totalprice[index].unit_price).format('0,0.0000'))
    })
    summary_excel(false)
    exportExcel()
    displaySave(true)
}

function changeMarkingEvent(index1) {
    storeMarkingPercent(index1)
    if (checkSystemVersion(est.getSystemVersion(), 3.1)) {
        est.setCalculatePriceAfterMarking2(index1)
    } else {
        est.setCalculatePriceAfterMarking(index1)
    }
    const item = est.mainData.totalprice[index1]
    console.log("changeMarkingEvent", item, item?.unit_price_exchange)

    $(`body #summary .MarkUp[index=${index1}] input`).val(item.mark_up_percent)
    $(`body #summary .MarkDown[index=${index1}] input`).val(item.mark_down_percent)
    $(`body #summary .totalMarkUp[indexqty=${index1}]`).text(numeral(item.mark_up_price).format('0,0.00'))
    $(`body #summary .totalMarkDown[indexqty=${index1}]`).text(numeral(item.mark_down_price).format('0,0.00'))

    // * New for 3.1 ++
    $(`body #summary .MarkingPercentMaterial[index=${index1}] input`).val(item?.marking_material_percent || 0)
    $(`body #summary .MarkingPercentProduction[index=${index1}] input`).val(item?.marking_production_percent || 0)
    $(`body #summary .totalMarkingPercentMaterial[indexqty=${index1}]`).text(numeral(item?.total_marking_material || 0).format('0,0.00'))
    $(`body #summary .totalMarkingPercentProduction[indexqty=${index1}]`).text(numeral(item?.total_marking_production || 0).format('0,0.00'))
    $(`body #summary .totalSubtotalPriceMaterial[indexqty=${index1}]`).text(numeral(item?.sub_total_price_material_marking || 0).format('0,0.00'))
    $(`body #summary .totalSubtotalPriceProduction[indexqty=${index1}]`).text(numeral(item?.sub_total_price_production_marking || 0).format('0,0.00'))

    let displayUnitPriceMaterial = !item?.marking_material_percent ?
        item?.unit_price_material ? `@${item?.unit_price_material}` : ''
        : `@${item?.unit_price_material} -> @${item?.unit_price_material_marking}`
    $(`body #summary .SubtotalPriceMaterial[index=${index1}]`).text(displayUnitPriceMaterial)

    let displayUnitPriceProduction = !item?.marking_production_percent ?
        item?.unit_price_production ? `@${item?.unit_price_production}` : ''
        : `@${item?.unit_price_production} -> @${item?.unit_price_production_marking}`
    $(`body #summary .SubtotalPriceProduction[index=${index1}]`).text(displayUnitPriceProduction)


    $(`body #summary .totalPrice[indexqty=${index1}]`).text(numeral(item.total_price).format('0,0.00'))
    $(`body #summary .totalDiffPrice[indexqty=${index1}]`).text(numeral(item.total_with_price_diff).format('0,0.00'))
    $(`body #summary .totalTax[indexqty=${index1}]`).text(numeral(item.tax).format('0,0.00'))
    $(`body #summary .totalFinalPrice[indexqty=${index1}]`).text(numeral(item.final_price).format('0,0.00'))
    $(`body #summary .totalUnitPrice[indexqty=${index1}]`).text(numeral(item.unit_price).format('0,0.00'))
    $(`body #summary .totalProfitSharing[indexqty=${index1}]`).text(numeral(item?.profit_sharing).format('0,0.00'))
    $(`body #summary .totalUnitPriceExchange[indexqty=${index1}]`).text(numeral(item?.unit_price_exchange || item.unit_price).format('0,0.0000'))

    setDefaultLoss()
    summary_excel(false)
    exportExcel()
    displaySave(true)
}

function changeExchangeRate(currency_no = 'THB', exchange_rate = null) {
    const selector = $(`body #summary`)

    const rate_info = getExchangeRateInfo(currency_no)
    console.log("currency_no", currency_no)

    selector.find('.exchange_rate').html(exchange_rate || rate_info?.exchange_rate || 1)
    selector.find('.select_currency_no').val(currency_no)
    selector.find('.currency_no').html(currency_no)

    return
}


//* END function input change EVENT -------------------------------------------------------------

//* START function to get info from est.mainData ------------------------------------------------
function checkIsSwitchDisplay(item) {
    // ถ้าด้านกว้าง น้อยกว่า ด้านยาว ? 0 : 1
    // if(laySize[0] <= laySize[1]){
    var is_switchDisplay = 0
    // }else{
    //     var is_switchDisplay = 1
    // }
    return is_switchDisplay
}

//? TEST --------------

function getDisplayFlute_align(item) {
    const comp_flute_align = item.corrugated_layer.component_flute_side
    const laying_align = item.layout.selected_layout.laying
    if (comp_flute_align == 'short_side' && laying_align == 'horizontal') {
        var display_flute = 'fluteH2'
    } else if (comp_flute_align == 'short_side' && laying_align == 'vertical') {
        var display_flute = 'fluteV2'
    } else if (comp_flute_align == 'long_side' && laying_align == 'horizontal') {
        var display_flute = 'fluteV2'
    } else if (comp_flute_align == 'long_side' && laying_align == 'vertical') {
        var display_flute = 'fluteH2'
    }
    if (checkIsSwitchDisplay(item)) {
        if (display_flute == 'fluteV2') {
            display_flute = 'fluteH2'
        } else { display_flute = 'fluteV2' }
    }
    return display_flute
}

function getFluteImg_obj(index) {
    const item = est.mainData.component1[index]
    var is_switchDisplay = checkIsSwitchDisplay(item)
    var is_manualLayout = item.layout_manual
    const grain = item.paper_info.paper_grain

    console.log("paper grain", grain)
    if (item.component_type.type != 3) {
        if (is_switchDisplay) {
            //paper grain
            if (grain == 'vertical') {
                var id = 'arrowH', img = 'testH', img1 = 'fluteV2'
            } else {
                var id = 'arrowV', img = 'testV', img1 = 'fluteH2'
            }
        } else {
            //paper grain
            if (grain == 'vertical') {
                var id = 'arrowV', img = 'testV', img1 = 'fluteH2'
            } else {
                var id = 'arrowH', img = 'testH', img1 = 'fluteV2'
            }
        }
        if (item.component_type.type == 2 && is_manualLayout == false) {
            var display_flute = getDisplayFlute_align(item)
            if (display_flute == img1) {
                console.log('align fluteeeeeeeee')
            } else {
                img1 = display_flute
                console.log('not align fluteeeeeeeee')
            }
        }

    } else {
        var flute_side = item.corrugated_layer.info.flute_align

        console.log("flute_side layer.info.flute_align", flute_side)

        if (is_switchDisplay) {
            if (flute_side == 'vertical') {
                var flute_align = 'horizontal'
            } else {
                var flute_align = 'vertical'
            }
        } else {
            var flute_align = flute_side
        }

        if (flute_align == 'vertical') {
            var id = 'arrowV', img = 'testV', img1 = 'fluteV2'
        } else {
            var id = 'arrowH', img = 'testH', img1 = 'fluteH2'
        }
    }

    return { id, img, img1, grain }
}
//? TEST
function getLayout4Display(index) {
    const item = est.mainData.component1[index]
    const { layout: { laySize, selected_layout: { layout } }, component_type: { type: compType } } = item
    if (compType != 3) {
        // if(item.paper_info.roll_width < item.paper_info.cut_off){
        var num_vertical_side = layout[0]
        var num_horizontal_side = layout[1]
        var vertical_size = laySize[0]
        var horizontal_size = laySize[1]
        //     }else{
        //        var num_vertical_side = layout[0]
        //        var num_horizontal_side = layout[1]
        //        var vertical_size = laySize[1]
        //        var horizontal_size = laySize[0]
        //    }
    } else {
        // if(item.paper_info.roll_width < item.paper_info.cut_off){
        var num_vertical_side = layout[0]
        var num_horizontal_side = layout[1]
        var vertical_size = laySize[0]
        var horizontal_size = laySize[1]
        // }else{
        //    var num_vertical_side=layout[0]
        //    var num_horizontal_side=layout[1]
        //    var vertical_size=laySize[1]
        //    var horizontal_size=laySize[0]
        // }
    }
    return { num_vertical_side, num_horizontal_side, vertical_size, horizontal_size }
}
//? TEST -----
// function getLayout4Display(index){
//     const item = est.mainData.component1[index]
//     var is_switchDisplay = checkIsSwitchDisplay(item)
//     var layout = item.layout.selected_layout.layout
//     var laySize = item.layout.laySize

//     if(is_switchDisplay){
//         var num_vertical_side=layout[1]
//         var num_horizontal_side=layout[0]
//         var vertical_size=laySize[1]
//         var horizontal_size=laySize[0]
//     }else{
//         var num_vertical_side=layout[0]
//         var num_horizontal_side=layout[1]
//         var vertical_size=laySize[0]
//         var horizontal_size=laySize[1]
//     }
//     return {num_vertical_side,num_horizontal_side,vertical_size,horizontal_size}
// }
//? TEST -----
function getCartonBulkSize(index, fIndex = 0) {
    var item = est.mainData.component1[index]
    console.log("getCartonBulkSize", item, index, est.mainData.component1)
    var carton = est.getPackingObj(item, 'carton', fIndex)

    if (carton.info.bulk.bulk_size[0] > carton.info.bulk.bulk_size[1]) {
        return [
            carton.info.bulk.bulk_size[0],
            carton.info.bulk.bulk_size[2],
            carton.info.bulk.bulk_size[1]
        ]
    } else {
        return [
            carton.info.bulk.bulk_size[1],
            carton.info.bulk.bulk_size[2],
            carton.info.bulk.bulk_size[0]
        ]
    }
}
function getLayoutSize(index) {

    const item = est.mainData.component1[index]
    //paper [W,L]
    // var paper_size=[parseFloat($('.paperSize[index='+index+'] .wSize').val()),parseFloat($('.paperSize[index='+index+'] .lSize').val())]
    const { paperSize, layout: { laySize } } = item
    // if(paper_size[0]<paper_size[1]){
    var w_paper = paperSize[2], l_paper = paperSize[3]
    // }else{
    //     var w_paper=paper_size[1], l_paper=paper_size[0]
    // }
    // if(item.layout.laySize[0]<item.layout.laySize[1]){
    var lay_size = [laySize[0], laySize[1]]
    // }else{
    //     var lay_size=[item.layout.laySize[1],item.layout.laySize[0]]
    // }
    return { w_paper, l_paper, lay_size }
}
//* END function to get info from est.mainData --------------------------------------------------

//* START function check if print type change ---------------------------------------------------

function resetPaperTypeList(num_comp) {
    const printType = getPrintType()
    for (var index = 0; index < num_comp; index++) {
        if (getComponentType(index) != 3) {
            var paper_type = $(`.component[index=${index}] .paperType`).val()
            getPaperType(index, printType)

            if (paper_type != "") {
                if (printType == 'Jet Press' && getDefaultPaperTypeList().includes(paper_type)) {
                    $(`.component[index=${index}] .paperType`).val('')

                } else {
                    $(`.component[index=${index}] .paperType`).val(paper_type)
                }
            } else {
                $(`.component[index=${index}] .paperType`).val('')
                $(`.component[index=${index}] .paperType .paperGram`).html('<option value="">-</option>')
            }
        }
    }
}

function resetPaperGramList(num_comp) {
    const printType = getPrintType()
    const jetPressMinGram = defaultData?.print_type_config?.getPrintTypeConfig()?.gsm?.min || 0
    var count_reGram = 0
    for (var index = 0; index < num_comp; index++) {
        if (getComponentType(index) != 3) {
            var component = `.component[index=${index}]`
            var paper_type = $(`${component} .paperType`).val()
            var paper_gram = parseInt($(`${component} .paperGram`).val())

            if ($(`${component} .paperGram`).val() != "") {
                getPaperGram(get_papergram_arr(paper_type, printType), index)
                if (paper_gram >= 200) {
                    $(`${component} .paperGram`).val(paper_gram)
                } else if (printType == 'Jet Press' && paper_gram < jetPressMinGram) {
                    $(`${component} .paperType`).val('')
                    $(`${component} .paperGram`).html('<option value="">-</option>')
                    $(`${component} .paperCost,${component} .paperSale`).val("")
                }
            } else {
                $(`${component} .paperType`).val('')
                $(`${component} .paperGram`).html('<option value="">-</option>')

            }

            if ($(`${component} .custom-paper`).attr('custom') == 1) {
                var custom_gram = parseInt($(`${component} .paperGram-custom`).text())
                if (printType == 'Jet Press' && custom_gram < jetPressMinGram) {
                    count_reGram++;
                }
            }

            if (count_reGram > 0) {
                alert(`แกรมของ Custom-Paper น้อยกว่า ${jetPressMinGram} แกรม ไม่สามารถใช้ได้สำหรับงานพิมพ์ประเภท Jet Press กรุณากรอกใหม่`)
            }

        }
    }
}

function resetCorrugated(num_comp) {
    const print_type = getPrintType()
    for (var index = 0; index < num_comp; index++) {
        if (print_type != "") {
            if (['Flexo'].includes(print_type)) {
                changeComponent(index, 3)
            } else {
                changeComponent(index, getComponentType(index))
            }
        }
    }
}

function checkNumColor4Flexo(num_comp) {
    var is_alert = 0
    for (var index = 0; index < num_comp; index++) {
        // $(`.specialInk-container`)
        if (parseInt($('.componentSpec[index=' + index + '] .colorOutside').val()) > 2) {
            $('.componentSpec[index=' + index + '] .colorOutside').val('')
            is_alert += 1
        }
        if (parseInt($('.componentSpec[index=' + index + '] .colorInside').val()) > 2) {
            $('.componentSpec[index=' + index + '] .colorInside').val('')
            is_alert += 1
        }
    }
    if (is_alert > 0) {
        alert('Flexo Printing สามารถใส่จำนวนสีได้ไม่เกิน 2 สีต่อด้านพิมพ์')
    }
}

//* END function check if print type change -----------------------------------------------------

//* START function interact to HTML element -----------------------------------------------------
//? About Hilight Text
function hilightText(checkbox, value, index) {
    switch (checkbox) {
        case 'manual_layout':
            if (value) {
                $('.manualLayout[index=' + index + ']').parent().css({
                    "background-color": "yellow",
                    "color": "red",
                    "font-weight": "bold"
                })
            } else {
                $('.manualLayout[index=' + index + ']').parent().css({
                    "background-color": "",
                    "color": "",
                    "font-weight": ""
                })
            }
            break
        case 'estimate_check':
            if (value) {
                $('#approve_checked').css({
                    "background-color": "yellow",
                    "color": "red",
                    "font-weight": "bold"
                }).show()
            } else {
                $('#approve_checked').css({
                    "background-color": "",
                    "color": "",
                    "font-weight": ""
                }).hide()
            }
        case 'is_manualLayout':
            if (value) {
                $('.componentTemplate[index=' + index + '] .is_manualLayout').parent().css({
                    "background-color": "yellow",
                    "color": "red",
                    "font-weight": "bold"
                })
            } else {
                $('.componentTemplate[index=' + index + '] .is_manualLayout').parent().css({
                    "background-color": "",
                    "color": "",
                    "font-weight": ""
                })
            }

            break
    }

}
//? About change specification input
function showCalcBttnPrice() {
    // delete est.mainData.totalprice
    var count = 0
    count += $('.show-bttn').length
    if (count == 0 && !$('#calc_price').is(":visible")) {
        $('#calc_price_after_change').show()
        displaySave(true)
    } else {
        $('#calc_price_after_change').hide()
    }
}
function recalcLayoutEachComponent(index) {
    // delete est.mainData.totalprice
    $('.recalc-layout[index=' + index + ']').addClass('show-bttn')
    $('.componentLayout[index=' + index + '],.componentPaperUsage[index=' + index + ']').html("")
}
function setUItoRecalcLayout() {
    // delete est.mainData.totalprice
    $('#Summary,#summary,#packing_section').remove()
    $('#calc_price,#calc_price_after_packing,#excel-bttn,#summary-bttn').hide()
    displaySave(false)
}

function setUItoRecalcProc() {
    $('#Summary,#summary,#packing_section').remove()
    // delete est.mainData.totalprice
    $('#calc_layout,#summary-bttn').hide()
    $('#calc_price_after_packing,#excel-bttn').hide()
    if ($('#calc_price').is(":visible")) {
        $('#calc_price_after_change').hide()
    } else {
        $('#calc_price_after_change').show()
        $("save-bttn").show();
    }
}

//? About Display Box Template and specification in each component
function displayBoxTemplate(box_type, index) {
    const componentTemplate = '.componentTemplate[index=' + index + ']'
    $('.inputType[index=' + index + ']').remove()
    var ol = box_type == 6 ? 'กรอบ' : 'OL (Overlap)'
    var tuck_flap = box_type == 8 ? 'ที่จับ' : 'ฝาเสียบ'

    if (box_type != 0) {
        const glued_spot = getDefaultGluedSpot(box_type)
        const [dust_mm, dust_inch] = getDefaultDust(box_type)

        if (glued_spot == 0) {
            var is_assembled = '', is_displayedGlueSpot = 'none'
        } else {
            var is_assembled = 'checked', is_displayedGlueSpot = 'block'
        }

        var div = `<div class="inputType" index=${index} style="margin:10px">
                    <div class="tbColumn position-relative template1">
                        <img style="width:500px; height:420px;" src="./img/${box_type}.jpg">
                        <div class="flute_template" style="vertical-align:middle;display:none">
                            ทิศทางลอน: 
                        </div>
                    </div>
                    <div class="tbColumn spec1">
                        <table cellpadding="8" >
                            <tr>
                                <td><div>กว้าง<strong style="color:red">*</strong></div></td>
                                <td><div><input class="specmm width required"  style="width:50px; text-align:center" value=""> mm</div><td>
                                <td><div><input class="specin widthin required" style="width:50px; text-align:center" value=""> inch</div><td>
                            </tr>
                            <tr>
                                <td><div>ยาว<strong style="color:red">*</strong></div></td>
                                <td><div><input class="specmm length required" style="width:50px; text-align:center" value=""> mm</div><td>
                                <td><div><input class="specin lengthin required" style="width:50px; text-align:center" value=""> inch</div><td>
                            </tr>
                            <tr>
                                <td><div>ความสูง<strong style="color:red">*</strong></div></td>
                                <td><div><input class="specmm depth required" style="width:50px; text-align:center" value=""> mm</div><td>
                                <td><div><input class="specin depthin required" style="width:50px; text-align:center" value=""> inch</div><td>
                            </tr>
                            <tr>
                                <td><div>ติดกาว<strong style="color:red">*</strong></div></td>
                                <td><div><input class="specmm glue required" style="width:50px; text-align:center" value="15"> mm</div><td>
                                <td><div><input class="specin gluein required" style="width:50px; text-align:center" value="0.59"> inch</div><td>
                            </tr>
                            <tr>
                                <td><div>${tuck_flap}<strong style="color:red">*</strong></div></td>
                                <td><div><input class="specmm tuck required" style="width:50px; text-align:center" value="15"> mm</div><td>
                                <td><div><input class="specin tuckin required" style="width:50px; text-align:center" value="0.59" > inch</div><td>
                            </tr>
                            <tr>
                                <td><div>ปีกกล่อง<strong style="color:red">*</strong></div></td>
                                <td><div><input class="specmm dust required" style="width:50px; text-align:center" value="${dust_mm}"> mm</div><td>
                                <td><div><input class="specin dustin required" style="width:50px; text-align:center" value="${dust_inch}"> inch</div><td>
                            </tr>
                            <tr>
                                <td><div>${ol}<strong style="color:red">*</strong></div></td>
                                <td><div><input class="specmm ol required" style="width:50px; text-align:center"> mm</div><td>
                                <td><div><input class="specin olin required" style="width:50px; text-align:center"> inch</div><td>
                            </tr>
                        </table>
                    </div>
                    <div class="tbColumn size1">
                        <table cellpadding="8">
                            <tr>
                                <td rowspan="2">Fold Size</td>
                                <td colspan="5"><div class="foldSizemm"><input style="width:50px; text-align:center" readonly > x <input style="width:50px; text-align:center" readonly> x <input style="width:50px; text-align:center" readonly> mm</div></td>
                            </tr>
                            <tr>
                                <td colspan="5"><div class="foldSizein"><input style="width:50px; text-align:center" readonly > x <input style="width:50px; text-align:center" readonly> x <input style="width:50px; text-align:center" readonly> inch</div></td>
                            </tr>
                            <tr>
                                <td rowspan="2">Open Size</td>
                                <td colspan="5"><div class="openSizemm "><input style="width:50px; text-align:center" value="" readonly > x <input style="width:50px; text-align:center" value="" readonly> mm</div></td>
                            </tr>
                            <tr>
                                <td colspan="5"><div class="openSizein"><input style="width:50px; text-align:center" readonly value=""> x <input style="width:50px; text-align:center" readonly value=""> inch</div></td>
                            </tr>
                            <tr>
                                <td><div><input class="is_assembled" type="checkbox" ${is_assembled} >ติดกาว</div></td>
                                <td colspan="5" class="td-glued-spot" style="display:${is_displayedGlueSpot}"><div><input class="glued_spot required" type="number" max="4" min="1" style="text-align:center;width:35px" value="${glued_spot}"> จุด</div></td>
                            </tr>
                            <tr class="div-digital-diecut d-none">
                                <td><div><input class="is_digital_diecut" type="checkbox">Digital Diecut</div></td>
                                <td colspan="5" class="td-digital-diecut"></td>
                            </tr>
                            <tr>
                                <td></td>
                                <td><div style="width:120px" ><input class="is_manualLayout" type="checkbox">Manual Layout</div></td>
                            </tr>
                        </table>
                    </div>
                </div>`
        $(componentTemplate).append(div)
        if (box_type == 11) {
            $(componentTemplate + ' .specmm.dust').val($(componentTemplate + ' .specmm.depth').val())
            $(componentTemplate + ' .specin.dustin').val($(componentTemplate + ' .specin.depthin').val())
        } else if (box_type == 12) {
            var tr_packing_size = `<tr>
                                    <td rowspan="2">Packing Size</td>
                                    <td colspan="5"><div class="packingsizemm" index="${index}"><input class="required" style="width:50px; text-align:center" value=""> x <input class="required" style="width:50px; text-align:center" value=""> mm </div></td>
                                </tr>
                                <tr>
                                    <td colspan="5"><div class="packingsizeinch" index="${index}"><input class="required" style="width:50px; text-align:center" value=""> x <input class="required" style="width:50px; text-align:center" value=""> inch </div></td>
                                </tr>
                                <tr>
                                    <td >จำนวนทบ Packing</td>
                                    <td colspan="5"><div class="packingLayer" index="${index}"><input class="required" style="width:20px; text-align:center" value="2"></div></td>
                                </tr>`
            $(componentTemplate + ' .tbColumn:last table tr:eq(4)').before(tr_packing_size)
            //$(componentTemplate+' .openSizein input,'+componentTemplate+' .openSizemm input').prop('readonly',false)
            $(componentTemplate + ' .openSizein input,' + componentTemplate + ' .openSizemm input').addClass("required")
        }
    }

    $(componentTemplate + ' .specmm,' + componentTemplate + ' .specin').inputmask({ regex: "^[0-9]{1,5}(\\.\\d{1,2})?$", placeholder: "" })

    if (box_type == 12) {
        $(componentTemplate + ' .openSizemm input,' + componentTemplate + ' .openSizein input,' + componentTemplate + ' .packingsizemm input,'
            + componentTemplate + ' .packingsizeinch input').inputmask({ regex: "^[0-9]{1,5}(\\.\\d{1,2})?$", placeholder: "" })
        $(componentTemplate + ' .packingLayer input').inputmask({ regex: "^[0-9]{1}", placeholder: "" })

    }

}
function setInputDimensionField(type, index) {
    const inputType = '.inputType[index=' + index + ']'
    switch (parseInt(type)) {
        case 1:
            $('.ol').parent().parent().parent().hide()
            break
        case 2:
            $('.ol').parent().parent().parent().hide()
            break
        case 5:
            $(inputType + ' .ol').parent().parent().parent().hide()
            $(inputType + ' .glue').parent().parent().parent().hide()
            $(inputType + ' .tuck').parent().parent().parent().hide()
            break
        case 6:
            $(inputType + ' .glue').parent().parent().parent().hide()
            $(inputType + ' .tuck').parent().parent().parent().hide()
            break
        case 7:
            $(inputType + ' .ol').parent().parent().parent().hide()
            $(inputType + ' .tuck').parent().parent().parent().hide()
            break
        case 8:
            $(inputType + ' .dust').parent().parent().parent().hide()
            break
        case 9:
            $(inputType + ' .dust').parent().parent().parent().hide()
            $(inputType + ' .tuck').parent().parent().parent().hide()
            $(inputType + ' .ol').parent().parent().parent().hide()
            break
        case 10:
            $(inputType + ' .dust').parent().parent().parent().hide()
            $(inputType + ' .tuck').parent().parent().parent().hide()
            $(inputType + ' .ol').parent().parent().parent().hide()
            break
        case 11:
            $(inputType + ' .tuck').parent().parent().parent().hide()
            $(inputType + ' .ol').parent().parent().parent().hide()
            break
        case 12:
            $(inputType + ' .depth').parent().parent().parent().hide()
            $(inputType + ' .glue').parent().parent().parent().hide()
            $(inputType + ' .dust').parent().parent().parent().hide()
            $(inputType + ' .tuck').parent().parent().parent().hide()
            $(inputType + ' .ol').parent().parent().parent().hide()
    }
}

function setSize4Template12(index) {
    var openSizein = []
    $('.inputType[index=' + index + '] .openSizemm input').each(function (index1) {
        openSizein.push(mm2inch(parseFloat($(this).val())))
        $('.packingsizemm[index=' + index + '] input:eq(' + index1 + ')').val($(this).val())
    })
    $('.inputType[index=' + index + '] .openSizein input').each(function (index1) {
        $(this).val(openSizein[index1])
        $('.packingsizeinch[index=' + index + '] input:eq(' + index1 + ')').val(openSizein[index1])
    })

}

function setfluteAlign(index, componentType) {
    const componentTemplate = '.componentTemplate[index=' + index + ']'
    $(componentTemplate + ' .fluteAlign').remove()
    var open_size = [$(componentTemplate + ' .openSizemm input:eq(0)').val(), $(componentTemplate + ' .openSizemm input:eq(1)').val()]
    var tr = `<tr class="fluteAlign">
                <td>ลอนขนานด้าน</td>
                <td>
                    <select class="flute_side required" style="text-align-last:center">
                        <option value="">-select flute side-</option>
                        <option value="short_side">ด้านสั้นกล่อง:  ${open_size[0]} mm</option>
                        <option value="long_side">ด้านยาวกล่อง:  ${open_size[1]} mm</option>
                    </select>
                </td>
            </tr>`
    $(componentTemplate + ' .flute_template').hide()
    if (componentType == 2 || componentType == 3) {
        $(componentTemplate + ' .tbColumn:last table tr:last').before(tr)
    } else {
        $(componentTemplate + ' .fluteAlign').remove()
    }
}
function getFluteAlignonTemplate(index, align) {
    const componentTemplate = '.componentTemplate[index=' + index + ']'
    $(componentTemplate + ' .flute_side').val(align)
    $(componentTemplate + ' .flute_template').hide()
    $(componentTemplate + ' .flute_template img').remove()
    if (align == 'short_side') {
        $(componentTemplate + ' .flute_template').show()
        var img = `<img style="width:50px; height:50px;" src="./img/fluteTemplate_V.png">`
    } else if (align == 'long_side') {
        $(componentTemplate + ' .flute_template').show()
        var img = `<img style="width:50px; height:50px;" src="./img/fluteTemplate_H.png">`
    }
    $(componentTemplate + ' .flute_template').append(img)
}

//? About Add/Change number of component
function addComponent(index) {
    $('.component:last').clone().appendTo($('#component'))
    $('.component:last').attr('index', index)
    $('.component:last div').attr('index', index)
    $('.component:last .paperMarkup').attr('index', index)
    $('.component:last .colorOutside,.component:last .nameComp').val("")
    $('.component:last .has_speInk').prop('checked', false).prop("disabled", false)
    $('.component:last .div-speInk').hide()
    $('.component:last .trCoatingSpecialInput').remove()
    $('.detailComp[index=' + index + '] .coatingOption').val('')
    $('.detailComp[index=' + index + '] .coatingType').html('<option value="">-</option>')
    $('.component:last .colorOutside,.component:last .colorInside').removeAttr('max').inputmask({ regex: "^[0-8]{1}", placeholder: "" })
    $('.detailComp[index=' + index + '] .foilstampSize,.detailComp[index=' + index + '] .embossSize,.detailComp[index=' + index + '] .debossSize').inputmask({ regex: "^[0-9]{0,3}(\\.\\d{1,2})?$", placeholder: "" })
    $('.componentTemplate[index=' + index + '] span').text('Component ที่ ' + (index + 1))
    $('.componentTemplate[index=' + index + '] .boxType').attr('index', index)
    $('.inputType[index=' + index + ']').remove()
    $(`.nameComponent[index=${index}] .componentIndex`).html(`Component ที่ ${index + 1}`)
    $('.component:last .tr_speInk').remove()

    //* fixed bug custom foil
    $('.component:last .custom-foil').attr('custom', 0)
    setDefualtfoilstampCustom(index, 0)

    changeComponent(index, 1)
    setDefaultAddonInput(index, 'all')
    setDefaultSpecialInk2NewComp(index)
    est.setCheckDeliveryQtyAddComp('add')
}
function setDefaultAddonInput(index, type) {
    const typeInput = '.' + type + 'Input[index=' + index + ']'
    switch (type) {
        case 'foilstamp':
            $(typeInput + ' .tdInput').hide()
            $(`${typeInput} .f-addon`).hide()
            $(typeInput + ' input').val("")
            $(typeInput + ' .foilColor').val("")
            $(typeInput + ' .foilCode').html('<option value="">-</option>')
            $(typeInput + ' .custom-foil').css('color', 'black')
            setDefualtfoilstampCustom(index, 0)
            break
        case 'emboss':
            $(typeInput + ' .tdInput').hide()
            $(`${typeInput} .f-addon`).hide()
            $(typeInput + ' input').val("")
            $(typeInput + ' .embossDepth').val("1.25")
            break
        case 'deboss':
            $(typeInput + ' .tdInput').hide()
            $(`${typeInput} .f-addon`).hide()
            $(typeInput + ' input').val("")
            $(typeInput + ' .debossDepth').val("1.25")
            break
        case 'all':
            $(`.f-addon`).hide()
            $('.detailComp[index=' + index + '] input[type=checkbox]').prop('checked', false)
            $('.foilstampInput[index=' + index + '] .tdInput,.embossInput[index=' + index + '] .tdInput,.debossInput[index=' + index + '] .tdInput').hide()
            $('.foilstampInput[index=' + index + '] input,.embossInput[index=' + index + '] input,.debossInput[index=' + index + '] input').val("")
            $('.foilstampInput[index=' + index + '] .foilColor').val("")
            $('.embossInput[index=' + index + '] .embossDepth,.debossInput[index=' + index + '] .debossDepth').val("1.25")
            $('.foilstampInput[index=' + index + '] .foilCode').html('<option value="">-</option>')
            $('.addedProcess[index=' + index + ']').remove()
            $(`.foilstampInput[index=${index}] .tb_foilstampSize tr`).not(':eq(0)').remove()
            $(`.embossInput[index=${index}] .tb_embossSize tr`).not(':eq(0)').remove()
            $(`.debossInput[index=${index}] .tb_debossSize tr`).not(':eq(0)').remove()
    }
    checkRequiredInput()
}
function changeComponent(index, componentType) {
    const { enable_price_check } = JSON.parse(localStorage.getItem("data"));
    const printType = getPrintType()
    $('.paperInput[index=' + index + ']').remove()
    $('.corrugatedInput[index=' + index + ']').remove()
    switch (componentType) {
        case 1: //ชิ้นส่วนไม่ประกบลูกฟูก
            var div = createDivPaperInput(index)
            $('.component[index=' + index + '] .colorInside').val("")
            break
        case 2: //ชิ้นส่วนประกบลูกฟูก
            var div = createDivPaperInput(index)
            div += createDivCorrugated(index)

            $('.component[index=' + index + '] .colorInside').val(0)
            break
        case 3: //ชิ้นส่วนเฉพาะลูกฟูก
            var div = createDivCorrugated(index)
            $('.component[index=' + index + '] .colorInside').val(0)
            break
    }

    $('.detailComp[index=' + index + '] .paper-section .section-detail').append(div)
    getPaperType(index, printType)
    $('.paperInput[index=' + index + '] .paperCost,.paperInput[index=' + index + '] .paperSale').inputmask({ regex: "^[0-9]{1,3}(\\.\\d{1,2})?$", placeholder: "" })
    $('.component[index=' + index + '] .paperPercent').inputmask({ regex: "^[0-9]{0,2}(\\.\\d{1,2})?$", placeholder: "" })
    $('.component[index=' + index + '] .paperPercent').val('0.0')
    $('.component[index=' + index + '] .componentType').val(componentType)
    getCorrugatedLayer(index, componentType)
    $("#component_" + index).val(componentType)

    $('.component[index=' + index + '] .paperCost').prop("readonly", !enable_price_check)
    $('.component[index=' + index + '] .paperMarkup input').prop("readonly", !enable_price_check)

    setChangeComponentPaper(index)
    setDefaultElement()
}

function createDivPaperInput(index) {
    var div = `<div index=${index} class="paperInput">
                <table cellspacing="8">
                    <tr>
                        <td style="text-align:center;">Paper<strong style="color:red">*</strong></td>
                        <td style="text-align:center;" colspan="2">
                            <select class="paperType required" style="text-align-last:center; width:100%;">
                                <option value="">-select type-</option>
                            </select>
                            <span class="paperCode-custom" style="display:none"></span>
                            <span class="paperType-custom" style="display:none"></span>
                        </td>
                        <td style="text-align:center;">
                            <select class="paperGram required" style="text-align-last:center;">
                                <option value="">-</option>
                            </select>
                            <span class="paperGram-custom" style="display:none"></span>
                            <span class="paperThickness-custom" style="display:none" ></span>
                            Gsm
                        </td>
                        <!-- <td style="text-align:center;"></td> -->
                        <td>
                            <input class="sheet_unit_price" type="checkbox">ราคา/แผ่น 
                            <span class="custom-paper" custom="0"><i class="fa fa-exchange" style="font-size: 22px;"></i></span>
                        </td>
                        
                    </tr>
                    <tr>
                        <td colspan="4">
                            <span class="">Paper Brand : </span>
                            <span class="paper_brand_supplier">-</span>
                            <input type="hidden" class="paper_brand_supplier"/>
                        </td>
                    </tr>
                  <tr>
                        <td style="text-align:center;">กระดาษ<strong style="color:red">*</strong></td>
                        <td style="text-align:center;width:80px;">
                            <select class="select_paper_source required">
                                <option value="">-select-</option>
                                <option value="1">ในประเทศ</option>
                                <option value="2">ต่างประเทศ</option>
                            </select>
                        </td>
                        <td style="text-align:right;">ตัดม้วน(บาท)</td>
                        <td style="text-align:left;">
                            <input class="paperPercent required" style="width:80px;text-align:center" title="% ค่าตัดกระดาษม้วน">
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align:center;">Cost<strong style="color:red">*</strong></td>
                        <td style="text-align:center;"><input class="paperCost required" style="width:80px;text-align:center" value=""></td>
                        <td style="text-align:right">Sale</td>
                        <td style="text-align:left;">
                            <input class="paperSale" style="width:80px;text-align:center" value="" readonly>
                            <span class="paper_unit_price">B/Kg</span>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="5">
                        <div>
                            <span class="require"
                            ><b>*</b> หากใช้กระดาษแบรนด์อื่น
                            กรุณาตรวจสอบราคากับฝ่ายจัดซื้อก่อนประเมินราคา
                            !!!</span
                            >
                        </div>
                        <div>
                            <span class="require"
                            ><b>*</b> กรณีเปิด Job กรุณาตรวจสอบ Stock
                            กับฝ่ายจัดซื้ออีกครั้งก่อนดำเนินการ !!!</span
                            >
                        </div>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="5">
                            <textarea class="remark-paper" rows="1" placeholder="พิมพ์รายละเอียดเพิ่มเติมที่นี่"></textarea>
                        </td>
                    </tr>
                </table>
            </div>`
    return div
}

function createDivCorrugated(index) {
    //var liner="ไลน์เนอร์",flute="ลอน"
    var liner = "", flute = ""
    // <option value="2">2</option>
    // <option value="3">3</option>
    // <option value="5">5</option>
    var div = `<div index=${index} class="corrugatedInput">
                <table cellspacing="8">
                    <tr>
                        <td style="text-align:center;">Corrugated<strong style="color:red;">*</strong></td>
                        <td >
                            <select class="layerCorrugated required" style="text-align-last:center;width:100%;">
                                <option value="">-select layer-</option>
                            </select>
                            <span class="layerCorrugated-custom" style="display:none" ></span>
                            <span class="fluteInfo-custom" style="display:none" ></span>
                            <span class="thickness-custom" style="display:none" ></span>
                            <span class="costCorrugated-custom" style="display:none" ></span>
                            <input class="isPricePerSheet" type="hidden" >
                            <span class="fluteSide-custom" style="display:none" ></span>
                            <span class="cutOff-custom" style="display:none" ></span>
                        </td>
                        <td>
                            <select class="fluteCorrugated required" style="text-align:center;width:100%;">
                                <option value="">-</option>
                            </select>
                            <span class="fluteCorrugated-custom" style="display:none" ></span>
                            <span class="fluteCorrugated-type" style="display:none" ></span>
                        </td>
                        <td>
                            <span class="custom-corrugated" custom="0"><i class="fa fa-exchange" style="font-size: 22px;"></i></span>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align:center;">Grade</td>
                        <td colspan="2">
                            <div class="corrugatedGrade">
                                ${flute} 
                                <select class="type_1 required" style="text-align-last:center;">
                                    <option value="">-</option>
                                </select>
                                <select class="gram_1 required" style="text-align-last:center;">
                                    <option value="">-</option>
                                </select>/
                                ${liner}
                                <select class="type_2 required" style="text-align-last:center;">
                                    <option value="">-</option>
                                </select>
                                <select class="gram_2 required" style="text-align-last:center;">
                                    <option value="">-</option>
                                </select>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3">
                            <textarea class="remark-corrugated" rows="1" placeholder="พิมพ์รายละเอียดเพิ่มเติมที่นี่"></textarea>
                        <td>
                    </tr>
                </table>
            </div>`
    return div
}

//? About add special ink tr
function addSpecialInk(index, obj, f_index) {
    const inkType = getInkType()

    const div = `.div-speInk[index=${index}][f_index=${f_index}]`
    const fillingOption = getSpeInkListOption(db.db.special_ink_factor_info, 'filling_style', 'filling_style_th')
    const speInkInfo = getSpeInkListOption(db.db.special_ink_info, 'process_id', 'special_ink_type_th')
    const newTr = `
        <tr class="tr_speInk">
            <td style="width:60px;text-align:center;"><div class="deleteSpeInk speInk-btn ml-1">ลบ</div></td>
            <td style="width:180px;text-align:center;"><input class="w-100 speInk_name speInk-input required" placeholder="color name/pantone"></td>
            <td style="width:120px;text-align:center;"><select class="w-100 speInk_type speInk-input" style="text-align-last: center;">${speInkInfo}</select></td>
            <td style="width:120px;text-align:center;"><select class="w-100 speInk_fillingStyle speInk-input" style="text-align-last:center;">${fillingOption}</select></td>
        </tr>
    `
    $(`${div} .table_speInk tbody`).append(newTr);
    setSpecialInkInfo2DefaultValue(index, f_index, $(`${div} .tr_speInk`).length - 1, obj)
    setSpecialInkTypeForUV(inkType)
}

function setSpecialInkTypeForUV(inkType = '') {
    if (inkType == 'UV') {
        $('.speInk_type option:not([value=47])').prop('disabled', true)
        $('.speInk_type').val(47)
    } else {
        $('.speInk_type option').prop('disabled', false)
    }
}

function addSpecialInkF(index) {
    const newSpeInkF = $('div.specialInkSection').find('.specialInk-list .specialInk-container:first').clone()

    const countSpeInkF = $(`.specialInkSection[index=${index}] .specialInk-container`).length
    $(`.specialInkSection[index=${index}] .specialInk-list`).append(newSpeInkF)
    $(`.specialInkSection[index=${index}] .specialInk-list .specialInk-container:last input`).val('').removeAttr('max')
    $(`.specialInkSection[index=${index}] .specialInk-list .specialInk-container:last input[type='checkbox']`).prop('checked', false)
    $(`.specialInkSection[index=${index}] .specialInk-list .specialInk-container:last input[type='checkbox']`).attr('data-f_index', countSpeInkF)
    $(`.specialInkSection[index=${index}] .specialInk-list .specialInk-container:last div.div-speInk`).attr('f_index', countSpeInkF)
    $(`.specialInkSection[index=${index}] .specialInk-list .specialInk-container:last div.div-speInk .tr_speInk`).remove()
    $(`div.div-speInk[f_index=${countSpeInkF}]`).hide()
    getFCodeSelectOption()
}

//? About set special info to default
function setSpecialInkInfo2DefaultValue(index, f_index = 0, ink_index, obj) {
    const { className, name, type, filling } = obj || {}
    const div = `.div-speInk[index=${index}][f_index=${f_index}]`

    $(`${div} .speInk_name:eq(${ink_index})`).val(name || "")
    $(`${div} .speInk_type:eq(${ink_index})`).val(type || $(`${div} .speInk_type:eq(${ink_index}) option:first`).val());
    $(`${div} .speInk_fillingStyle:eq(${ink_index})`).val(filling || $(`${div} .speInk_fillingStyle:eq(${ink_index}) option:first`).val());
    $(`${div} .tr_speInk:eq(${ink_index})`).addClass(className)

    if (name === 'Drip off') {
        setReadOnlySpecialInkTr(div, ink_index)
    }
}

//? About delete special ink tr
function deleteSpecialInk(index, f_index, selector) {
    if ($(`.div-speInk[index=${index}][f_index=${f_index}] .tr_speInk`).length > 1) {
        selector.closest('tr').remove()
    }
}

//? About set special ink to default when add new component
function setDefaultSpecialInk2NewComp(index, f_index = 0) {
    setSpecialInkInfo2DefaultValue(index, 0, 0)
    $('.div-speInk[index=' + index + '] .tr_speInk:not(:eq(0))').not('.div-speInk[index=' + index + '] .tr_speInk:eq(0)').remove()

}

function setReadOnlySpecialInkTr(div, ink_index) {
    // const div='.div-speInk[index='+index+']'
    $(`${div} .speInk_name:eq(${ink_index})`).attr('readonly', true)
    $(`${div} .speInk_type:eq(${ink_index})`).attr('disabled', true)
    $(`${div} .speInk_fillingStyle:eq(${ink_index})`).attr('disabled', true)
    $(`${div} .tr_speInk:eq(${ink_index})`).addClass('special-ink-readonly')
    $(`${div} .deleteSpeInk.speInk-btn:eq(${ink_index})`).hide()
}
//? About add addon
function addAddon(index, process) {
    const is_multiple_f = getIsMultipleF()
    var process_index = getProcessIndex(index, process)
    var process_div = createAddonDiv(index, process_index, process)
    switch (process) {
        case 'coating':
            var proc_class = '.coatingInput'
            break
        case 'foilstamp':
            var proc_class = '.foilstampInput'
            break
        case 'emboss':
            var proc_class = '.embossInput'
            break
        case 'deboss':
            var proc_class = '.debossInput'
            break
    }
    $(proc_class + '[index=' + index + ']:last').after(process_div)
    if (process == 'foilstamp') {
        getFoilStampColor(index)
    }
    if (process == 'foilstamp' || process == 'emboss' || process == 'deboss') {
        $(proc_class + '[index=' + index + ']:last .' + process + 'Size').inputmask({ regex: "^[0-9]{0,3}(\\.\\d{1,2})?$", placeholder: "" })
    }
    if (is_multiple_f) {
        $(`${proc_class}[index=${index}]:last .f-addon`).show()
        getFCodeSelectOption()
    } else {
        $(`${proc_class}[index=${index}]:last .f-addon`).hide()
    }


}
function createAddonDiv(index, process_index, process) {
    switch (process) {
        case 'coating':
            var div = `<div index=${index} class="coatingInput addonInput addedProcess position-relative" process-index=${process_index}>
                        
                        <table cellspacing="8" class="tbAddonInput">
                            <tr>
                                <td><div class="deleteAddon" style="text-align:center;mr-3"><strong>ลบ</strong></div></td>
                                <td style="text-align:center;">Coating</td>
                                <td>
                                    <select class="coatingOption required" style="text-align-last:center;width:70px">
                                        <option value="">-select-</option>
                                        <option value="Gloss">Gloss</option>
                                        <option value="Matt">Matt</option>
                                        <option value="Other">อื่นๆ</option>
                                    </select>
                                </td>
                                <td>
                                    <select class="coatingType required" style="text-align-last:center;width:230px;">
                                        <option value="">-</option>
                                    </select>
                                </td>
                            </tr>
                        </table>
                    </div>`
            break
        case 'foilstamp':
            var div = `<div index=${index} class="foilstampInput addonInput addedProcess position-relative" process-index=${process_index}>
                        <table cellspacing="8" class="tbAddonInput">
                            <tr>
                                <td style="text-align:center;">Foil stamp</td>
                                <td style="text-align:center;">Size (in²)</td>
                                <td style="text-align:center;" colspan="2">
                                    <table class="tb_foilstampSize">
                                        <tr>
                                            <td>
                                                <input class="foilstampSize required" style="width:45px;text-align:center"> x <input class="foilstampSize required" style="width:45px;text-align:center">
                                            </td>
                                            <td>
                                                <div class="add-addon-size">เพิ่ม</div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="text-align:right;">สี</td>
                                <td style="text-align:center;">
                                    <select class="foilColor required" style="text-align-last:center;"></select>
                                    <span class="foilColor-custom" style="display: none;"></span>
                                </td>
                                <td>
                                    <select class="foilCode required" style="text-align-last:center;width:100%;">
                                        <option value="" >-</option>
                                    </select>
                                    <span class="Code-custom" style="display: none;">Code</span> <span class="foilCode-custom" style="display: none;"></span>
                                </td>
                                <td class="custom-foil" custom="0" style="text-align:center;">
                                    <i class="fa fa-exchange" style="font-size: 22px;"></i>
                                    <input class="foilRollWidth-custom" type="hidden">
                                    <input class="foilRollLength-custom" type="hidden">
                                    <input class="foilRollPrice-custom" type="hidden">
                                    <input class="foilRollMinPrice-custom" type="hidden">
                                </td>
                            </tr>
                            <!-- FOR F -->
                            <tr class="trInputF f-addon">
                                <td></td>
                                <td style="text-align:center;">F Code</td>
                                <td>
                                    <select class="foilstampFCode f-code-select required" style="text-align-last:center;width:120px;">
                                        <option value="">- F Code -</option>
                                    </select>
                                </td>
                                <td>
                                    <div class="add-addon-f-code" data-name="foilstamp">เพิ่ม</div>
                                </td>
                            </tr>
                        </table>
                        <div class="deleteAddon" style="text-align:center;margin:10px;"><strong>ลบ</strong></div>
                    </div>`
            break
        case 'emboss':
            var div = `<div index=${index} class="embossInput addonInput addedProcess position-relative" process-index=${process_index}>
                        <table cellspacing="8" class="tbAddonInput">
                            <tr>
                                <td style="text-align:center;">Emboss</td>
                                <td style="text-align:right;">Size (in²)</td>
                                <td colspan="2">
                                    <table class="tb_embossSize w-100">
                                        <tr>
                                            <td style="text-align:center;">
                                                <input class="embossSize required" style="width:45px;text-align:center"> x <input class="embossSize required" style="width:45px;text-align:center">
                                            </td>
                                            <td>
                                                <div class="add-addon-size">เพิ่ม</div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td></td>
                                <td style="text-align:right;">ความนูน</td>
                                <td style="text-align:left;">
                                    <select class="embossDepth" style="text-align-last:center;width:100%;">
                                        <option value="1.25">1.25 mm</option>
                                        <option value="1.65">1.65 mm</option>
                                    </select>
                                </td>
                            </tr>
                            <!-- FOR F -->
                            <tr class="trInputF f-addon">
                                <td></td>
                                <td style="text-align:center;">F Code</td>
                                <td>
                                    <select class="embossFCode f-code-select required" style="text-align-last:center;width:120px;">
                                        <option value="">- F Code -</option>
                                    </select>
                                </td>
                                <td>
                                    <div class="add-addon-f-code" data-name="emboss">เพิ่ม</div>
                                </td>
                            </tr>
                        </table>
                        <div class="deleteAddon" style="text-align:center;margin:10px;"><strong>ลบ</strong></div>
                    </div>`
            break
        case 'deboss':
            var div = `<div index=${index} class="debossInput addonInput addedProcess position-relative" process-index=${process_index}>
                        <table cellspacing="8" class="tbAddonInput">
                            <tr>
                                <td style="text-align:center;">Deboss</td>
                                <td style="text-align:right;">Size (in²)</td>
                                <td colspan="2">
                                    <table class="tb_debossSize w-100">
                                        <tr>
                                            <td style="text-align:center;">
                                                <input class="debossSize required" style="width:45px;text-align:center"> x <input class="debossSize required" style="width:45px;text-align:center">
                                            </td>
                                            <td>
                                                <div class="add-addon-size">เพิ่ม</div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td></td>
                                <td style="text-align:right;">ความลึก</td>
                                <td style="text-align:left;">
                                    <select class="debossDepth" style="text-align-last:center;width:100%;">
                                        <option value="1.25">1.25 mm</option>
                                        <option value="1.65">1.65 mm</option>
                                    </select>
                                </td>
                            </tr>
                            <!-- FOR F -->
                            <tr class="trInputF f-addon">
                                <td></td>
                                <td style="text-align:center;">F Code</td>
                                <td>
                                    <select class="debossFCode f-code-select required" style="text-align-last:center;width:120px;">
                                        <option value="">- F Code -</option>
                                    </select>
                                </td>
                                <td>
                                    <div class="add-addon-f-code" data-name="deboss">เพิ่ม</div>
                                </td>
                            </tr>
                        </table>
                        <div class="deleteAddon" style="text-align:center;margin:10px;"><strong>ลบ</strong></div>
                    </div>`

            break
    }
    return div
}
//? About Coating Addon
function getTRCoatingSpecialInput(index, process_index, type) {
    let td = ''

    switch (type) {
        case 'S-UV-S':
        case 'S-UV':
            td = `<td style="text-align:center;">Size (in²)</td>
                    <td><input class="coatingSize required" style="width:40px;text-align:center;"> x <input class="coatingSize required" style="width:40px;text-align:center;"></td>`
            break
        case 'B-PACK':
            td = `<td style="text-align:center">พลาสติก</td>
                    <td>
                        <select class="coatingMaterialType" style="text-align-last:center;width:100px;">
                            <option value="PVC">PVC</option>
                            <option value="PET">PET</option>
                        </select>
                    </td>`
            break
        case 'P-PAT':
            td = `<td style="text-align:center">ระบุเบอร์</td>
                <td>
                    <input class="coatingNumber required" style="text-align:center;width:40px;">
                </td>
            `
            break;
        default:
            break;
    }
    var tr = `<tr class="trCoatingSpecialInput">
                <td></td>${td}
            </tr>`
    $('.coatingInput[index=' + index + '][process-index=' + process_index + '] table').append(tr)
    $('.coatingInput[index=' + index + '][process-index=' + process_index + '] input').inputmask({ regex: "^[0-9]{1,3}(\\.\\d{1,2})?$", placeholder: "" })
}
function removeTRCoatingSpecialInput(index, process_index) {
    $('.coatingInput[index=' + index + '][process-index=' + process_index + '] .trCoatingSpecialInput').remove()
}

function getBlanketUVGap(index, process_index, type, side = 1) {
    const nameOfProcess = {
        "S-WTB": "ผ้ายาง (Spot Waterbase)",
        "UV_GAP": "ผ้ายาง (UV เว้นลิ้น)",
        "UV_ANTI_GAP": "ผ้ายาง (UV เว้นลิ้น)",
        "S-WTB-HR": "ผ้ายาง (Gloss Hi-rub WB เว้นลิ้น)",
        "S-H-WTB": "ผ้ายาง (Gloss Hi-GlossWB เว้นลิ้น)",
        "S-UV-ANTI": "ผ้ายาง (Gloss UV anti. เว้นลิ้น)",
    }

    let process_price = 1500, nameProc = nameOfProcess[type]

    // if (type == 'S-WTB') {
    //     var nameProc = 'ผ้ายาง (Spot Waterbase)'
    //     process_price = 1500
    // } else if (type == 'UV_GAP') {
    //     var nameProc = 'ผ้ายาง (UV เว้นลิ้น)'
    //     process_price = 1500
    // } else if (type == 'UV_ANTI_GAP') {
    //     var nameProc = 'ผ้ายาง (UV Anti-static & tapetest เว้นลิ้น)'
    //     process_price = 1500
    // }

    addProcess('material')
    $('.materialProcess:last').attr('from-process', 'coating')
    $('.materialProcess:last').attr('comp-index', index)
    $('.materialProcess:last').attr('process-index', process_index)
    $('.materialProcess:last .nameProcess input').val(nameProc)
    $('.materialProcess:last .ppuProcess input').val(process_price)
    $('.materialProcess:last .numMat input').val(side)
    $('.materialProcess:last input').prop('readonly', true)
    $('.materialProcess:last .deleteProcess').hide()
}


function removeBlanketUVGap(index, process_index) {
    $('.materialProcess[from-process=coating][comp-index=' + index + '][process-index=' + process_index + ']').remove()
}

//? About Manual Layout
function prepareDivManualLayout(index) {
    const item = est.mainData.component1[index]
    $('.div_size_component[index=' + index + '], .tbLayout[index=' + index + '],.divEditTolerance[index=' + index + ']').remove()
    $('.editLayout[index=' + index + '],.changeLayout_bttn[index=' + index + ']').hide()
    $('.divEditLayout[index=' + index + '] input').prop('readonly', false)
    $('.divEditLayout[index=' + index + '] input').val(1)
    $('.div_component_name[index=' + index + ']').after(setDivforManualLayout(index))
    getMachineSizeOption(index, item)
    setDisplayMachineSize(index, getPrintType(), item)

    $('.paperSize[index=' + index + '] input').inputmask({ regex: "^[0-9]{1,2}(\\.\\d{1,3})?$", placeholder: "" })
    $('.layoutSize[index=' + index + '] input').inputmask({ regex: "^[0-9]{1,2}(\\.\\d{1,2})?$", placeholder: "" })

    setDisplayForJetPress()
    setDisplayForKonica()
    getCutSizeStdPaper('.std_layout_size', getStdPaperList(item, false), index, true)

    if (item?.component_type?.type == 3 && item?.corrugated_layer?.info?.is_price_per_sheet) {
        setEnableLayoutPaperSize(index, false)
    } else {
        setEnableLayoutPaperSize(index, true)
    }

    setEnableLayingForCustomCorrugated(index)
    displayMachineInfo(index, item?.machine?.machine_size?.id)
}

function setDivforManualLayout(index) {
    const printType = getPrintType()
    const component_type = getComponentType(index)
    const item = est.mainData.component1[index]
    const { max_size, min_size } = item.machine

    let paperSize = ['', '']
    var label = "Paper Size"
    let layoutSection = ''

    if (printType === 'Jet Press') {
        layoutSection += `
            <select class="std_layout_size" style="vertical-align:center;text-align:center;" index="${index}">								
            </select>
        `
    }

    var tr_rollwidth = `<tr>
                        <td>เกรนชิ้นงาน</td>
                        <td>
                            <select class="layout_grain required" index="${index}" style="text-align-last:center; width:100%;">
                                <option value="">-เลือกด้านขนาน-</option>
                                <option class="optionWSize" value="vertical" style="display:none;"></option>
                                <option class="optionLSize" value="horizontal" style="display:none;" selected></option>
                            </select>
                            <select class="parallelRollWidth required" index="${index}" style="text-align-last:center; width:100%;display:none;">
                                <option value="">-เลือกหน้าม้วน-</option>
                                <option class="optionWSize" value="WSize" style="display:none;" selected></option>
                                <option class="optionLSize" value="LSize" style="display:none;"></option>
                            </select>
                        </td>
                    </tr>`

    var tr_flute_side = `<tr>
                            <td>ลอนลูกฟูก</td>
                            <td>
                                <select class="parallelFluteSide required" index="${index}" style="text-align-last:center; width:100%;">
                                    <option value="">-เลือกด้านขนาน-</option>
                                    <option class="optionWSize" value="WSize" style="display:none;"></option>
                                    <option class="optionLSize" value="LSize" style="display:none;"></option>
                                </select>
                            </td>
                        </tr>`

    let isSwitchDisplay = false

    switch (component_type) {
        case 1: //paper only
            tr_flute_side = ""
            break
        case 2://paper+corrugated
            isSwitchDisplay = item?.corrugated_layer?.info?.is_price_per_sheet ? true : false
            break
        case 3://corrugated only
            const {
                corrugated_layer: {
                    info: {
                        is_price_per_sheet = false,
                        corrugated_size = []
                    }
                }
            } = item

            if (is_price_per_sheet) {
                paperSize = [corrugated_size[2], corrugated_size[3]]
            }

            label = "Corrugated Size"
            tr_rollwidth = ""
            break
    }

    let div = ''

    if (isSwitchDisplay) {

        div = `<div class="div_size_component" index="${index}">
        <table>
            <tr>
                <td>Open Size</td>
                <td style="text-align:center; ">${item.packaging_size.open_size[0]}" x ${item.packaging_size.open_size[1]}"</td>
            </tr>
            ${tr_flute_side}
            <tr>
                <td>Layout Size</td>
                <td style="text-align:center">
                    ${layoutSection}
                    <div class="layoutSize machine-display" index="${index}">
                    <input class="wLaySize required" style="width:40px; text-align:center" > x <input class="lLaySize required" style="width:40px; text-align:center" >
                    </div>
                </td>
            </tr>
            <tr>
                <td>${label}</td>
                <td style="text-align:center">
                    <div class="paperSize" index="${index}">
                        <input class="wSize required" style="width:40px; text-align:center" value='${paperSize[0]}'> x <input class="lSize required" style="width:40px; text-align:center" value='${paperSize[1]}'>
                    </div>
                </td>
            </tr>
            ${tr_rollwidth}
            <tr class="machine-display">
                <td>Machine Size</td>
                <td style="text-align:center">
                    <div>
                        <select class="cut_size" style="vertical-align:center" index="${index}">
                            <option value="9998">-</option>
                            <option value="1">Cut 1</option>
                            <option value="2">Cut 2</option>
                            <option value="3">Cut 3</option>
                            <option value="4">Flexo</option>							
                            <option value="5">Jet Press</option>						
                            <option value="6">Konica</option>						
                        </select>
                    </div>
                </td>
            </tr>
            <tr class="machine-display">
                <td>Min Size :</td>
                <td style="text-align:center;" class="cut_size_size cut_size_min" index="${index}">
                    ${min_size[0]}" x ${min_size[1]}"
                </td>
            </tr>
            <tr class="machine-display">
                <td>Max Size :</td>
                <td style="text-align:center;" class="cut_size_size cut_size_max" index="${index}">
                    ${max_size[0]}" x ${max_size[1]}"
                </td>
            </tr>
        </table>
    </div>
    <div class="tbLayout position-relative" index="${index}">
        <table width="300" height="230">
            <tr>
                <td rowspan="2" class="layoutWSize" style="width:50px; font-size:13px; text-align:center;" ></td>
                <td colspan="2" class="layoutLSize" style="height:25px; font-size:13px; text-align:center;" ></td>
            </tr>
            <tr class="rowLayout">
                <td class="cellLayout" ></td>
            </tr>
            <tr class="row_noti_layout_grain">
                <td colspan="2" class="noti_layout_grain" style="height:40.12px; font-size:13px; text-align:center;" ></td>
            </tr>
        </table>
    </div>`

    } else {

        div = `<div class="div_size_component" index="${index}">
                <table>
                    <tr>
                        <td>Open Size</td>
                        <td style="text-align:center; ">${item.packaging_size.open_size[0]}" x ${item.packaging_size.open_size[1]}"</td>
                    </tr>
                    <tr>
                        <td>Layout Size</td>
                        <td style="text-align:center">
                            ${layoutSection}
                            <div class="layoutSize machine-display" index="${index}">
                            <input class="wLaySize required" style="width:40px; text-align:center" > x <input class="lLaySize required" style="width:40px; text-align:center" >
                            </div>
                        </td>
                    </tr>
                    ${tr_rollwidth}
                    <tr>
                        <td>${label}</td>
                        <td style="text-align:center">
                            <div class="paperSize" index="${index}">
                                <input class="wSize required" style="width:40px; text-align:center" value='${paperSize[0]}'> x <input class="lSize required" style="width:40px; text-align:center" value='${paperSize[1]}'>
                            </div>
                        </td>
                    </tr>
                    ${tr_flute_side}
                    <tr class="machine-display">
                        <td>Machine Size</td>
                        <td style="text-align:center">
                            <div>
                                <select class="cut_size" style="vertical-align:center" index="${index}">
                                    <option value="9998">-</option>
                                    <option value="1">Cut 1</option>
                                    <option value="2">Cut 2</option>
                                    <option value="3">Cut 3</option>
                                    <option value="4">Flexo</option>							
                                    <option value="5">Jet Press</option>							
                                    <option value="6">Konica</option>							
                                </select>
                            </div>
                        </td>
                    </tr>
                    <tr class="machine-display">
                        <td>Min Size :</td>
                        <td style="text-align:center;" class="cut_size_size cut_size_min" index="${index}">
                            ${min_size[0]}" x ${min_size[1]}"
                        </td>
                    </tr>
                    <tr class="machine-display">
                        <td>Max Size :</td>
                        <td style="text-align:center;" class="cut_size_size cut_size_max" index="${index}">
                            ${max_size[0]}" x ${max_size[1]}"
                        </td>
                    </tr>
                </table>
            </div>
            <div class="tbLayout position-relative" index="${index}">
                <table width="300" height="230">
                    <tr>
                        <td rowspan="2" class="layoutWSize" style="width:50px; font-size:13px; text-align:center;" ></td>
                        <td colspan="2" class="layoutLSize" style="height:25px; font-size:13px; text-align:center;" ></td>
                    </tr>
                    <tr class="rowLayout">
                        <td class="cellLayout" ></td>
                    </tr>
                    <tr class="row_noti_layout_grain">
                        <td colspan="2" class="noti_layout_grain" style="height:40.12px; font-size:13px; text-align:center;" ></td>
                    </tr>
                </table>
            </div>`

    }

    return div
}

function getNumLayoutbyManual(num, index) {
    var row, column
    for (var i = 0; i < num[0]; i++) {
        row += `<tr class="rowLayout"></tr>`
    }
    for (var i = 0; i < num[1]; i++) {
        column += `<td class="cellLayout"></td>`
    }
    row += `
        <tr class="row_noti_layout_grain">
            <td colspan="2" class="noti_layout_grain" style="height:40.12px; font-size:13px; text-align:center;" ></td>
        </tr>
    `

    $('.tbLayout[index=' + index + '] .rowLayout,.tbLayout[index=' + index + '] .row_noti_layout_grain').remove()
    $('.tbLayout[index=' + index + '] .layoutWSize').attr('rowspan', (num[0] + 1))
    $('.tbLayout[index=' + index + '] .layoutLSize').attr('colspan', num[1])
    $('.tbLayout[index=' + index + '] table').append(row)
    $('.tbLayout[index=' + index + '] .noti_layout_grain').attr('colspan', (num[1] + 1))
    $('.tbLayout[index=' + index + '] table .rowLayout').append(column)
}
function setDivComponentLayout(index, checkManual) {
    if (checkManual) {
        prepareDivManualLayout(index)
        est.setLayout4Manual(index)
        est.setCalculateUps(index)
        recalcPaperUsageTable(index)
    } else {
        $('.div_size_component[index=' + index + '],.tbLayout[index=' + index + '],.divEditLayout[index=' + index + '],.divEditTolerance[index=' + index + ']').remove()
        divComponentSize(index)
        imgLayout(index)
        checkLaysize(index)
        storePaperSize(index)
        est.setCalculatePaperWeight(index)
        editLayout(index)
        $('.paperSize[index=' + index + '] input').inputmask({ regex: "^[0-9]{1,2}(\\.\\d{1,3})?$", placeholder: "" })
        recalcPaperUsageTable(index)
    }
}

function setChangeMachine(index) {
    var item = est.getComponent(index)
    const machine_id = parseInt($('.cut_size[index=' + index + ']').val())
    item.machine = est.getMachineList(item)?.find(obj => obj.machine_size.id == machine_id)
}

function setDataforManualLayout(index) {
    //* เก็บขนาด paper size
    storePaperSize(index)
    var item = est.getComponent(index)
    const { paperSize } = item

    const component_type = getComponentType(index)

    //* เปลี่ยนจาก ด้านขนาน > เกรนชิ้นงานขนานด้านไหน
    const layout_grain = $('.layout_grain[index=' + index + ']').val()
    // const layout_grain = parallel_side === 'WSize' ? 'vertical' : 'horizontal'

    // const machine_id = parseInt($('.cut_size[index=' + index + ']').val())

    //* เก็บจำนวนชิ้นงานในแต่ละด้าน
    if ($('.divEditLayout[index=' + index + '] .edit_w_layout input').val() != "") {
        var num_w = parseInt($('.divEditLayout[index=' + index + '] .edit_w_layout input').val())
    } else {
        var num_w = ""
    }

    if ($('.divEditLayout[index=' + index + '] .edit_l_layout input').val() != "") {
        var num_l = parseInt($('.divEditLayout[index=' + index + '] .edit_l_layout input').val())
    } else {
        var num_l = ""
    }

    //* เก็บขนาด lay isze
    const w_laySize = parseFloat($('.layoutSize[index=' + index + '] .wLaySize').val() || 0)
    const l_laySize = parseFloat($('.layoutSize[index=' + index + '] .lLaySize').val() || 0)
    const laySize = [
        w_laySize,
        l_laySize,
        parseFloat((w_laySize * 25.4).toFixed(2)),
        parseFloat((l_laySize * 25.4).toFixed(2))
    ]

    let component_flute_side = ''

    item.layout.laySize = laySize

    if (layout_grain != "" && num_w != "" && num_l != "") {


        //* set corrugated board comp type = 2, 3
        if (component_type != 1) {
            const fluteSide = getLayingFluteSide(index)

            if (fluteSide != "") {
                if (fluteSide == 'WSize') {
                    component_flute_side = "short_side"
                } else {
                    component_flute_side = "long_side"
                }
            } else {
                component_flute_side = "short_side"
            }

            item.corrugated_layer.component_flute_side = component_flute_side
        }



        item.layout.layout_grain = layout_grain
        item.layout.selected_layout.grain_box_type = layout_grain
        item.layout.selected_layout.layout = [num_w, num_l]

        item.layout.selected_layout.layout = [num_w, num_l]
        item.layout.selected_layout.num_laying = num_w * num_l
        item.layout.selected_layout.layout_size = laySize
        item.layout.selected_layout.printing = [laySize[2], laySize[3]]
        item.layout.selected_layout.paper_size = [paperSize[2], paperSize[3]]
        est.setCalculateUps(index)
        recalcPaperUsageTable(index)
        const { max_size, min_size } = item.machine
        $(`.cut_size_min[index=${index}]`).html(`${min_size[0]}" x ${min_size[1]}"`)
        $(`.cut_size_max[index=${index}]`).html(`${max_size[0]}" x ${max_size[1]}"`)
    }

    displayManualLayoutSize(index)
}
//? About Add process (other process, handwork process, material)
function addProcess(id) {
    switch (id) {
        case 'other':
            var className = 'otherProcess'
            var label = "Process:"
            var unit = `<td class="ppuProcess"><input class="required" style="width:80px;font-size:10px;text-align:center"></td>`
            break
        case 'handwork':
            var className = 'handworkProcess'
            var label = "Process:"
            var unit = `<td class="ppuProcess"><input class="required" style="width:80px;font-size:10px;text-align:center"></td>`
            break
        case 'custom':
            var className = 'customProcess'
            var label = "จัดจ้าง:"
            var unit = `<td class="ppuProcess"><input class="required" style="width:80px;font-size:10px;text-align:center"></td>`
            break
        case 'material':
            var className = 'materialProcess'
            var label = "Material:"
            var unit = `"<td><input class="is_fixedPrice" type="checkbox" checked>จำนวนคงที่</td>
            <td class="numMat"><input class="required" style="width:80px;font-size:10px;text-align:center;"></td>`
            break
        case 'otherCost':
            var className = 'otherCostProcess'
            var label = "Other:"
            var unit = `"<td><input class="is_fixedPrice" type="checkbox" checked>จำนวนคงที่</td>
            <td class="numMat"><input class="required" style="width:80px;font-size:10px;text-align:center;"></td>`
            break
        case 'delivery':
            var className = 'deliveryProcess'
            var label = "จำนวน"
            var unit = `<td>วันที่ส่ง <input type="text" class="required deliveryDate datepicker" style="width:120px;text-align:center;"></td>`
            break
    }
    //*get the next process-index
    const nextIndex = $(`#deliveryProcess table:first tr.${className}`).length
    if (['delivery'].includes(id)) {
        const is_multiple_f = getIsMultipleF()
        const compOptions = getSelectDeliveryComponent()
        const balanceQty = est.getBalanceDeliveryQty(0)
        const compLength = $(`div.nameComponent`).length

        if (compLength === 1 && !is_multiple_f) {
            var tr = `<tr class=${className} index="${nextIndex}"> 
                <td style="width: 50px;"><div class="deleteProcess">ลบ</div></td>
                <td><div class="deliveryQty">${label} <input class="required" style="width:100px" value="${balanceQty}"></div></td>
                <td>
                    <div>
                        <select class="deliveryComponentId required" placeholder="เลือก Component." style="display:none;">
                            <option value="0" selected>Comp.1</option>
                        </select>
                        จังหวัด 
                        <input class="deliveryDestinationId" type="hidden">
                        <input class="required deliveryDestinationName" style="width:200px;" onKeyup="autocomplete_delivery_destination(this,'deliveryDestination');" autocomplete="off">
                        <!--div class="snackbar-delivery snackbar" >กรุณาระบุสถานที่จัดส่ง</div-->
                    </div>
                </td>
                ${unit}
            </tr>`
        } else {
            var tr = `
            <tr class=${className} index=${nextIndex}> 
                <td>
                    <div class="deliveryMultipleProcess">
                        <div>
                            <table cellspacing="5px">
                                <tr>
                                    <td style="width: 50px;"><div class="deleteProcessDelivery">ลบ</div></td>
                                    <td>
                                        จังหวัด 
                                        <input class="deliveryDestinationId" type="hidden">
                                        <input class="deliveryDestinationName required" style="width:200px;margin-right:10px;" onKeyup="autocomplete_delivery_destination(this,'deliveryDestination',false);" autocomplete="off">
                                        วันที่ส่ง 
                                        <input type="text" class="required deliveryDate datepicker" style="width:120px;text-align:center;">
                                    </td>
                                </tr>
                            </table>
                        </div>
                        <div class="tableDeliveryMultipleProcess">
                            <table cellspacing="10px">
                                <tbody>
                                    <tr class='trDeliveryMultipleProcess'> 
                                        <td style="width: 50px;"></td>
                                        <td>
                                            <div>
                                                ${is_multiple_f ? "F Code " : "Component "}
                                                <select class="deliveryComponentId ${is_multiple_f ? 'f-code-select' : ''} required" placeholder="เลือก Component.">
                                                    ${compOptions}
                                                </select>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="deliveryQty">${label} <input class="required" style="width:100px"></div>
                                        </td>
                                        <td><div class="addTrDeliveryMultiple" style="margin-left:10px;">เพิ่ม</div></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </td>
            </tr>`
        }
    } else if (['other', 'handwork', 'custom'].includes(id)) {
        var tr = `<tr class='${className}'> 
            <td style="width: 50px;"><div class="deleteProcess">ลบ</div></td>
            <td><div class="nameProcess">${label} <input class="required" style="width:350px"></div></td>
            <td><div class="processChecked"><input class="is_fixedPrice" type="checkbox" checked> ราคาต่อหน่วยคงที่:</div></td>
            ${unit}
        </tr>`
    } else {
        var tr = `<tr class='${className}'> 
            <td style="width: 50px;"><div class="deleteProcess">ลบ</div></td>
            <td><div class="nameProcess">${label} <input class="required" style="width:350px"></div></td>
            <td><div class="ppuProcess">ราคาต่อหน่วย: <input class="required" style="width:80px;font-size:10px;text-align:center"></div></td>
            ${unit}
        </tr>`
    }

    $('#' + className + ' table:first').append(tr)

    if (['otherCostProcess', 'materialProcess'].includes(className)) {
        $('.' + className + ':last .ppuProcess input').inputmask({ regex: "^-?[0-9]{1,10}(\\.\\d{1,4})?$", placeholder: "" })
    } else {
        $('.' + className + ':last .ppuProcess input').inputmask({ regex: "^[0-9]{1,10}(\\.\\d{1,4})?$", placeholder: "" })
    }

    $('.deliveryQty input').inputmask({
        'alias': 'decimal',
        'groupSeparator': ',',
        'autoGroup': true,
        'digits': 0,
        'digitsOptional': false,
        'placeholder': ''
    })

    $('.' + className + ':last .numMat input').inputmask({ regex: "^[0-9]{1,10}(\\.\\d{1,2})?$", placeholder: "" })

    $('.datepicker').datepicker({
        format: "dd/mm/yyyy",
        todayBtn: "linked",
        clearBtn: true,
        autoclose: true,
        todayHighlight: true
    });

    if (['delivery'].includes(id)) {
        est.setCalculateCheckDeliveryQty()
    }
}
function addDeliveryMultipleProcess(index) {
    const is_multiple_f = getIsMultipleF()
    const nextIndex = $(`tr.deliveryProcess[index=${index}] .tableDeliveryMultipleProcess tr.trDeliveryMultipleProcess`).length
    const compOptions = getSelectDeliveryComponent()
    const tr = `
        <tr class='trDeliveryMultipleProcess'> 
            <td style="width: 50px;">${nextIndex !== 0 ? '<div class="deleteTrDeliveryMultiple">ลบ</div>' : ''}</td>
            <td>
                <div>
                    ${is_multiple_f ? "F Code " : "Component "}
                    <select class="deliveryComponentId ${is_multiple_f ? 'f-code-select' : ''} required" placeholder="เลือก Component.">
                    ${compOptions}
                    </select>
                </div>
            </td>
            <td>
                <div class="deliveryQty">จำนวน <input class="required" style="width:100px"></div>
            </td>
        </tr>
    `
    $(`tr.deliveryProcess[index=${index}] .tableDeliveryMultipleProcess table tbody`).append(tr)
    $('.deliveryQty input').inputmask({
        'alias': 'decimal',
        'groupSeparator': ',',
        'autoGroup': true,
        'digits': 0,
        'digitsOptional': false,
        'placeholder': ''
    })
}
function deleteDeliveryMultipleProcess(deleteBtn) {
    $(deleteBtn).closest('tr.trDeliveryMultipleProcess').remove()
}
function getSelectDeliveryComponent() {
    const is_multiple_f = getIsMultipleF()
    let options = [`<option value="">-- เลือก ${is_multiple_f ? 'F Code' : 'Component'} --</option>`]
    const data = []
    if (is_multiple_f) {
        //* multiple F
        const fLength = $(`table.f_table`).length
        for (let index = 0; index < fLength; index++) {
            const delivery_name = $(`table.f_table:eq(${index}) input.f-code`).val()
            data.push({ index, delivery_name })
        }
    } else {
        //* multiple component
        const compLength = $(`div.nameComponent`).length
        for (let index = 0; index < compLength; index++) {
            const delivery_name = $(`div.nameComponent[index=${index}] input.nameComp`).val()
            data.push({ index, delivery_name })
        }

    }

    options = [...options, ...data.map((obj) => `<option value="${obj?.index}">${obj?.delivery_name}</option>`)]
    return options
    // $(`#deliveryProcess tr.deliveryProcess[index=${index}] select.deliveryComponentId:eq(${trCompIndex})`).html(options)
}

function resetDelivery() {
    const is_multiple_f = getIsMultipleF()
    $('.chk_split_delivery').prop("checked", false)
    $('.oneTimeDelivery').show()
    $('#deliveryProcess table tr').remove()
    $('.splitDelivery').hide()
    // $(`.oneTimeDelivery input`).val("")
    if ($(`#qtyInput`).find('.inputQty input').length > 1 && !is_multiple_f) {
        $('.chk_split_delivery').prop("disabled", true)
        est.setCheckDeliverChangeQty(0)
    } else {
        $('.chk_split_delivery').prop("disabled", false)
        $('.oneTimeDelivery').closest('tr').addClass("deliveryProcess").attr("index", 0)
        // * When change qty.
        let changeQty = 0
        $('#inputInfo div[class=inputQty] input').each(function () {
            changeQty = numeral($(this).val() || 0).value()
        })
        est.setCheckDeliverChangeQty(changeQty)
    }
}

function tdNumMaterial(action) {
    switch (action) {
        case 'add':
            var td = `<td class="numMat"><input class="required" style="width:80px;font-size:10px;text-align:center;"></td>`
            var tdPrice = `<td class="ppuProcess"><input class="required" style="width:80px;font-size:10px;text-align:center;"></td>`
            // other
            $('.otherProcess').each(function (index) {
                if ($('.otherProcess:eq(' + index + ') .is_fixedPrice').prop('checked') == false) {
                    $('.otherProcess:eq(' + index + ')').append(tdPrice)
                    $('.otherProcess:last .ppuProcess input:last').inputmask({ regex: "^[0-9]{1,5}(\\.\\d{1,2})?$", placeholder: "" })
                }
            })
            // handwork
            $('.handworkProcess').each(function (index) {
                if ($('.handworkProcess:eq(' + index + ') .is_fixedPrice').prop('checked') == false) {
                    $('.handworkProcess:eq(' + index + ')').append(tdPrice)
                    $('.handworkProcess:last .ppuProcess input:last').inputmask({ regex: "^[0-9]{1,5}(\\.\\d{1,2})?$", placeholder: "" })
                }
            })
            // custom
            $('.customProcess').each(function (index) {
                if ($('.customProcess:eq(' + index + ') .is_fixedPrice').prop('checked') == false) {
                    $('.customProcess:eq(' + index + ')').append(tdPrice)
                    $('.customProcess:last .ppuProcess input:last').inputmask({ regex: "^[0-9]{1,5}(\\.\\d{1,2})?$", placeholder: "" })
                }
            })
            // material
            $('.materialProcess').each(function (index) {
                if ($('.materialProcess:eq(' + index + ') .is_fixedPrice').prop('checked') == false) {
                    $('.materialProcess:eq(' + index + ')').append(td)
                    $('.materialProcess:last .numMat input:last').inputmask({ regex: "^[0-9]{1,5}(\\.\\d{1,2})?$", placeholder: "" })
                }
            })
            // other
            $('.otherCostProcess').each(function (index) {
                if ($('.otherCostProcess:eq(' + index + ') .is_fixedPrice').prop('checked') == false) {
                    $('.otherCostProcess:eq(' + index + ')').append(td)
                    $('.otherCostProcess:last .numMat input:last').inputmask({ regex: "^[0-9]{1,5}(\\.\\d{1,2})?$", placeholder: "" })
                }
            })
            break
        case 'delete':
            // other
            $('.otherProcess').each(function (index) {
                if ($('.otherProcess:eq(' + index + ') .is_fixedPrice').prop('checked') == false) {
                    $('.otherProcess:eq(' + index + ') .ppuProcess:last').remove()
                }
            })
            // handwork
            $('.handworkProcess').each(function (index) {
                if ($('.handworkProcess:eq(' + index + ') .is_fixedPrice').prop('checked') == false) {
                    $('.handworkProcess:eq(' + index + ') .ppuProcess:last').remove()
                }
            })
            // custom
            $('.customProcess').each(function (index) {
                if ($('.customProcess:eq(' + index + ') .is_fixedPrice').prop('checked') == false) {
                    $('.customProcess:eq(' + index + ') .ppuProcess:last').remove()
                }
            })
            // material
            $('.materialProcess').each(function (index) {
                if ($('.materialProcess:eq(' + index + ') .is_fixedPrice').prop('checked') == false) {
                    $('.materialProcess:eq(' + index + ') .numMat:last').remove()
                }
            })
            // other
            $('.otherCostProcess').each(function (index) {
                if ($('.otherCostProcess:eq(' + index + ') .is_fixedPrice').prop('checked') == false) {
                    $('.otherCostProcess:eq(' + index + ') .numMat:last').remove()
                }
            })
            break
    }
}

function createTdNumInput(index, is_fixedPrice, classProcess) {
    const is_multiple_f = getIsMultipleF()
    let td = ''

    if (['otherProcess', 'handworkProcess', 'customProcess'].includes(classProcess)) {
        $(`.${classProcess}:eq(${index}) td.ppuProcess`).remove()
    } else {
        $(`.${classProcess}:eq(${index}) .numMat`).remove()
    }

    if (is_fixedPrice) {
        if (['otherProcess', 'handworkProcess', 'customProcess'].includes(classProcess)) {
            td = `<td class="ppuProcess"><input class="required" style="width:80px;font-size:10px;text-align:center;"></td>`
        } else {
            td = `<td class="numMat"><input class="required" style="width:80px;font-size:10px;text-align:center;"></td>`
        }

    } else {
        if (is_multiple_f) {
            $('#multiple_f_qty_info .f_table').each(function () {
                //var qty=$('.inputQty:eq('+index+') input').val()
                if (['otherProcess', 'handworkProcess', 'customProcess'].includes(classProcess)) {
                    td += `<td class="ppuProcess"><input class="required" style="width:80px;font-size:10px;text-align:center;"></td>`
                } else {
                    td += `
                        <td class="numMat">
                            <input class="required" style="width:80px;font-size:10px;text-align:center;" >
                        </td>
                    `
                }
            })
        } else {
            $('#qty_info .inputQty').each(function () {
                //var qty=$('.inputQty:eq('+index+') input').val()
                if (['otherProcess', 'handworkProcess', 'customProcess'].includes(classProcess)) {
                    td += `<td class="ppuProcess"><input class="required" style="width:80px;font-size:10px;text-align:center;"></td>`
                } else {
                    td += `
                    <td class="numMat">
                        <input class="required" style="width:80px;font-size:10px;text-align:center;" >
                    </td>
                `}
            })
        }
    }

    $(`.${classProcess}:eq(${index})`).append(td)

    if (['otherProcess', 'handworkProcess', 'customProcess'].includes(classProcess)) {
        $(`.${classProcess}:eq(${index}) .ppuProcess input`).inputmask({ regex: "^[0-9]{1,10}(\\.\\d{1,4})?$", placeholder: "" })
    } else {
        $(`.${classProcess}:eq(${index}) .numMat input`).inputmask({ regex: "^[0-9]{1,10}(\\.\\d{1,2})?$", placeholder: "" })
    }
}

//? About Add Qty
function addQty() {
    const qtySelector = `#qty_info`
    $(`${qtySelector} .inputQty:last`).parent().clone().appendTo($(`${qtySelector} .inputQty:last`).parent().parent())
    $(`${qtySelector} .runonQty:last`).parent().clone().appendTo($(`${qtySelector} .runonQty:last`).parent().parent())
    $(`${qtySelector} .inputQty:last input, ${qtySelector} .runonQty:last input`).val('')
    tdNumMaterial('add')
    //mask input 
}

function addFQty() {
    const newTable = $('#multiple_f_qty_info #qtyInput .f-container table.f_table:last').clone()
    $('#multiple_f_qty_info #qtyInput .f-container').append(newTable)
    $('#multiple_f_qty_info #qtyInput .f-container table.f_table:last input').val('')
    $('.f-container table.f_table:last input[type=checkbox]').prop('checked', false)
    $('.f-container table.f_table:last .color_limit_f').hide()
    $('.inputQty input,.runonQty input,.aeQty input,.customerQty input,.color_limit input,.f-totalQty input,input.f-sumTotalQty').inputmask({
        'alias': 'decimal',
        'groupSeparator': ',',
        'autoGroup': true,
        'digits': 0,
        'digitsOptional': false,
        'placeholder': ''
    })
    $('.runonPercent').inputmask("9[9]", { "placeholder": "" })
    tdNumMaterial('add')
}

function addFile() {
    const nextIndex = $('#file_upload_table table tr').length
    var tr = `<tr class='file_upload' index="${nextIndex}"> 
        <td style="width: 50px;"><div class="deleteFile">ลบ</div></td>
        <td><div class="file_display"><input type="file" name="file[]" class="input_file_upload" style="width:200px"></div></td>
    </tr>`
    $('#file_upload_table table').append(tr)
}

//? About Display Layout Section
function delete_div_layout_img() {
    $('#tbComponent').remove()
}
function create_tbComponent() {
    var tbComponent = `<div id="Layout"><br/></div>
                        <div id="tbComponent">
                    </div>`
    $('#Layout,#tbComponent').remove()
    $('body #div_bttn').before(tbComponent)
}
function tbComponent(index) {
    divLayout(index)
    divComponentName(index)
    divComponentSize(index)
    imgLayout(index)
    //  just check laySize match for machine
    checkLaysize(index)
    editLayout(index)
    tbPaperUsage(index)
    getPaperUsageTable(index)
    rowPaperUsage(index)
    // setPaperSize 2
    storePaperSize(index)

    est.setCalculatePaperWeight(index)

    checkRequiredInput()
}
function addDivComponentInfo(index) {
    divLayout(index)
    $('.recalc-layout[index=' + index + ']').addClass('show-bttn')
}
function divLayout(index) {
    var component = `<div class="componentInfo" index="${index}">
            <div class="recalc-layout" index="${index}">
            <button class="display-layout-bttn">คำนวณ Layout ใหม่</button>
            </div>
            <div class="componentLayout" index="${index}">
            </div>
        </div>`
    $('#tbComponent').append(component)
}
function divComponentName(index) {
    var item = est.mainData.component1[index]
    var div = `<div class="div_component_name" index="${index}">
                <table>
                    <tr>
                        <td style="text-align:center;" class="component_no">Component ที่ ${parseInt(index) + 1}</td>
                    </tr>
                    <tr>
                    <td style="text-align:center;">${item.component_name}</td>
                    </tr>
                    <tr>
                        <td style='text-align:center;'><input index="${index}" class="manualLayout" type="checkbox">Manual Layout</td>
                    </tr>
                </table>
            </div>`
    $('.componentLayout[index=' + index + ']').append(div)
}
function divComponentSize(index) {
    var item = est.mainData.component1[index]
    const {
        machine: { machine_size: { id }, max_size, min_size },
        component_type: { type: compType },
        packaging_size: { open_size },
    } = item || {}
    const { roll_width_side, cut_off_side } = getRealPaperSize4Display(item)
    const { vertical_size, horizontal_size } = getLayout4Display(index)
    // var {paperSize} = item
    let compTypeComponent = ''

    console.log(`divComponentSize width: ${roll_width_side} / length : ${cut_off_side}`)

    if (![3].includes(compType)) {
        compTypeComponent = `
            <tr>
                <td style="text-align:left; ">Paper Size :</td>
                <td style="text-align:center">
                    <div class="paperSize" index="${index}">
                        <input class="wSize required" style="width:40px; text-align:center" value="${roll_width_side}"> x <input class="lSize required" style="width:40px; text-align:center" value="${cut_off_side}">
                    </div>
                </td>
            </tr>
            <tr>
                <td style="text-align:left; ">Std. Paper :</td>
                <td style="text-align:center">
                    <div>
                        <select class="cut_size_std_paper"style="vertical-align:center;text-align:center;" index="${index}">								
                        </select>
                    </div>
                </td>
            </tr>
            <tr class="machine-display">
                <td style="text-align:left; ">Layout Grain :</td>
                <td style="text-align:center">
                    <div>
                        <select class="layout_grain" style="vertical-align:center;text-align:center;" index="${index}">
                            <option value="">-- เลือก grain --</option>
                            <option value="vertical">ผิด grain</option>
                            <option value="horizontal">ถูก grain</option>
                        </select>
                    </div>
                </td>
            </tr>
        `
    } else {
        compTypeComponent = `
            <tr>
                <td style="text-align:left; ">Corrugated Size :</td>
                <td style="text-align:center">
                    <div class="paperSize" index="${index}">
                        <input class="wSize required" style="width:40px; text-align:center" value="${roll_width_side}"> x <input class="lSize required" style="width:40px; text-align:center" value="${cut_off_side}">
                    </div>
                </td>
            </tr>
            <tr>
                <td style="text-align:left; ">Std. Corrugated :</td>
                <td style="text-align:center">
                    <div>
                        <select class="cut_size_std_paper"style="vertical-align:center;text-align:center;" index="${index}">								
                        </select>
                    </div>
                </td>
            </tr>
            <tr style="display:none;">
                <td style="text-align:left; ">Layout Grain :</td>
                <td style="text-align:center">
                    <div>
                        <select class="layout_grain" style="vertical-align:center;text-align:center;" index="${index}">
                            <option value="">-- เลือก grain --</option>
                            <option value="vertical">ผิด grain</option>
                            <option value="horizontal">ถูก grain</option>
                        </select>
                    </div>
                </td>
            </tr>
        `
    }

    var div = `<div class="div_size_component" index="${index}"> 
                    <table>
                        <tr>
                            <td style="text-align:left; ">Open Size :</td>
                            <td style="text-align:center; ">${open_size[0]}" x ${open_size[1]}"</td>
                        </tr>
                        <tr>
                            <td style="text-align:left; ">Layout Size :</td>
                            <td style="text-align:center; " class="laySize" index="${index}">
                                ${vertical_size}" x ${horizontal_size}"
                            </td>
                        </tr>
                        ${compTypeComponent}
                        <tr class="machine-display">
                           
                            <td style="text-align:left; ">Machine Size :</td>
                            <td style="text-align:center">
                                <div>
                                    <select class="cut_size"style="vertical-align:center" index="${index}">						
                                    </select>
                                </div>
                            </td>
                        </tr>
                        <tr class="machine-display">
                            <td>Min Size :</td>
                            <td style="text-align:center;" class="cut_size_size cut_size_min" index="${index}">
                                ${min_size[0]}" x ${min_size[1]}"
                            </td>
                        </tr>
                        <tr class="machine-display">
                            <td>Max Size :</td>
                            <td style="text-align:center;" class="cut_size_size cut_size_max" index="${index}">
                                ${max_size[0]}" x ${max_size[1]}"
                            </td>
                        </tr>
                        <tr>
                            <td colspan='2' style="text-align:center;"><button class="recalc_layout_bttn" index="${index}">คำนวณ Layout ใหม่</button></td>
                        </tr>
                        
                    </table>
                </div>`

    $('.componentLayout[index=' + index + ']').append(div)
    getMachineSizeOption(index, item)
    setDisplayMachineSize(index, getPrintType(), item)
    $('.paperSize[index=' + index + '] input').inputmask({ regex: "^[0-9]{1,2}(\\.\\d{1,3})?$", placeholder: "" })
    getCutSizeStdPaper('.cut_size_std_paper', getStdPaperList(item, false), index)

}
function editLayout(index) {
    var item = est.mainData.component1[index]
    const {
        paper_tolerance: { gripper, color_bar, paper_edge, bleed, is_editTolerance = 0 },
        layout: { is_editLayout = 0 }
    } = item
    const { num_vertical_side: w_side, num_horizontal_side: l_side } = getLayout4Display(index)
    // $('.componentLayout[index=' + index + '] .divEditLayout, .componentLayout[index=' + index + '] .divEditTolerance').remove()
    $(`.componentLayout[index=${index}]`).find('.divEditLayout, .divEditTolerance, .divLayoutWarning').remove()

    var div = `<div class="divEditLayout position-relative" index="${index}" style="align-self:flex-start;width:200px;">
                <table >
                    <tr>
                        <td colspan="2">
                            <div class="editLayout" index="${index}">
                            <input type="checkbox" ${is_editLayout ? 'checked' : ''}> แก้ไขจำนวน Lay เอง
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="w_caption" index="${index}">จำนวนด้านกว้าง</td>
                        <td>
                            <div class="edit_w_layout">
                                <input class="required" style="width:40px; text-align:center" value="${w_side}" ${!is_editLayout ? 'readonly' : ''}>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="l_caption" index="${index}">จำนวนด้านยาว</td>
                        <td>
                            <div class="edit_l_layout">
                                <input class="required" style="width:40px; text-align:center" value="${l_side}" ${!is_editLayout ? 'readonly' : ''}>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style="text-align:center">
                            <div>
                                <button class="changeLayout_bttn" index="${index}">สลับด้าน layout</button>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="divEditTolerance" index="${index}" style="align-self:flex-start">
                <table>
                    <tr>
                        <td>
                            <div class="editTolerance" index="${index}">
                                <input type="checkbox" ${is_editTolerance ? 'checked' : ''} >ระบุระยะเผื่อเอง
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>ความยาว gripper</td>
                        <td>
                            <div class="gripper">
                                <input class="required" style="width:35px; text-align:center"  value="${gripper}" ${!is_editTolerance ? 'readonly' : ''}> mm
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>ความยาว color bar</td>
                        <td>
                            <div class="color_bar">
                                <input class="required" style="width:35px; text-align:center" value="${color_bar}" ${!is_editTolerance ? 'readonly' : ''}> mm
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>ระยะขอบกระดาษ</td>
                        <td>
                            <div class="paper_edge">
                                <input class="required" style="width:35px; text-align:center" value="${paper_edge}" ${!is_editTolerance ? 'readonly' : ''}> mm
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>ระยะเผื่อเจียน</td>
                        <td>
                            <div class="bleed">
                                <input class="required" style="width:35px; text-align:center" value="${bleed}" ${!is_editTolerance ? 'readonly' : ''}> mm
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="divLayoutWarning w-100 text-center" index=${index}>
                
            </div>
            `

    /* 
                <div class="divLayoutWarning w-100 text-center" index=${index} style="height:30px; background-color:#f6f6f6;">
         
     </div>
    */
    $('.componentLayout[index=' + index + ']').append(div)
    $('.divEditTolerance[index=' + index + '] input').inputmask({ regex: "^[0-9]{2}(\\.\\d{1,2})?$", placeholder: "" })
    $('.divEditLayout[index=' + index + '] input').inputmask({ regex: "^[0-9]{1,3}", placeholder: "" })
    setDisplayForJetPress()
    setDisplayForKonica()
}



function imgLayout(index) {
    var item = est.mainData.component1[index]
    var img_obj = getFluteImg_obj(index),
        layout_obj = getLayout4Display(index),
        row,
        column
    // old
    // var cut_off=item.paper_info.cut_off
    // var roll_width=item.paper_info.roll_width
    //new
    // cut_off , roll_width = item.paperSize[2,3]
    const { roll_width_side, cut_off_side } = getRealPaperSize4Display(item)
    const { layout: { selected_layout: { laying, grain_box_type } } } = item
    const { wSide, lSide } = getPaperSize4Display(item)

    for (var i = 0; i < layout_obj.num_vertical_side; i++) {
        row += `<tr class="rowLayout"></tr>`
    }
    for (var i = 0; i < layout_obj.num_horizontal_side; i++) {
        column += `<td class="cellLayout" ></td>`
    }
    var div = `<div class="tbLayout position-relative" index="${index}">
                <div class="grainPaper" grain="${img_obj.id}" index="${index}">
                    <img src="./img/${img_obj.img}.png">
                </div>
                <div class="fluteImg" index="${index}">
                    <img src="./img/${img_obj.img1}.png">
                </div>
                <table width="300" height="230" >
                    <tr>
                        <td style="width:50px; font-size:13px; text-align:center;" rowspan="${layout_obj.num_vertical_side + 1}">
                            ${layout_obj.vertical_size}<br>(${wSide})
                        </td>
                        <td style="height:25px; font-size:13px; text-align:center;" colspan="${layout_obj.num_horizontal_side}">
                            ${layout_obj.horizontal_size}  (${lSide})
                        </td>
                    </tr>
                </table>
            </div>
            <div class="divLayoutWarning w-100 text-center" index=${index}>
            </div>
            `
    row += `<tr>
        <td style="height:40.12px; font-size:13px; text-align:center;"  colspan="${layout_obj.num_horizontal_side + 1}">
        <strong>วางชิ้นงาน</strong> : ${laying === "horizontal" ? "แนวนอน" : "แนวตั้ง"} /
        <strong>เกรนชิ้นงาน</strong> : ${grain_box_type === "horizontal" ? "แนวนอน" : "แนวตั้ง"}
        </td>
    </tr>`
    $('.componentLayout[index=' + index + ']').append(div)
    $('.paperSize[index=' + index + '] .wSize').val(roll_width_side)
    $('.paperSize[index=' + index + '] .lSize').val(cut_off_side)
    $('.tbLayout[index=' + index + '] table').append(row)
    $('.tbLayout[index=' + index + '] table tr[class=rowLayout]').append(column)
    displayMachineSize(index, item.machine)
    displayStdPaperSize(index, item.paper_info.std_paper_id)
    setComponentDivValue(index)
    displayGrainFluteImg(index, item.component_type.type)
}
function editImgLayout(index) {
    $('.tbLayout[index=' + index + ']').children().remove()
    var item = est.mainData.component1[index]

    const { vertical_size, horizontal_size } = getLayout4Display(index)
    const { layout: { selected_layout: { laying, grain_box_type } } } = item
    var { wSide, lSide } = getPaperSize4Display(item)
    var { roll_width_side, cut_off_side } = getRealPaperSize4Display(item)
    var img_obj = getFluteImg_obj(index),
        layout_obj = getLayout4Display(index),
        row,
        column

    for (var i = 0; i < layout_obj.num_vertical_side; i++) {
        row += `<tr class="rowLayout"></tr>`
    }

    for (var i = 0; i < layout_obj.num_horizontal_side; i++) {
        column += `<td class="cellLayout" ></td>`
    }

    var div = `<div class="grainPaper" grain="${img_obj.id}"  index=${index}>
                    <img src="./img/${img_obj.img}.png">
                </div>
                <div class="fluteImg" index=${index}>
                    <img src="./img/${img_obj.img1}.png">
                </div>
                <table width="300" height="230" >
                    <tr>
                        <td style="width:50px; font-size:13px; text-align:center;" rowspan="${layout_obj.num_vertical_side + 1}">
                        ${layout_obj.vertical_size}<br>(${wSide})
                        </td>
                        <td style="height:25px; font-size:13px; text-align:center;" colspan="${layout_obj.num_horizontal_side}">
                        ${layout_obj.horizontal_size}   (${lSide})
                        </td>
                    </tr>
                </table>`

    row += `<tr>
        <td style="height:25px; font-size:13px; text-align:center;"  colspan="${layout_obj.num_horizontal_side + 1}">
        <strong>วางชิ้นงาน</strong> : ${laying === "horizontal" ? "แนวนอน" : "แนวตั้ง"} /
        <strong>เกรนชิ้นงาน</strong> : ${grain_box_type === "horizontal" ? "แนวนอน" : "แนวตั้ง"}
        </td>
    </tr>`

    $('.laySize[index=' + index + ']').text(`${vertical_size}" x ${horizontal_size}"`)
    $('.paperSize[index=' + index + '] input').inputmask('remove')
    $('.paperSize[index=' + index + '] .wSize').val(roll_width_side)
    $('.paperSize[index=' + index + '] .lSize').val(cut_off_side)
    $('.tbLayout[index=' + index + ']').append(div)
    $('.tbLayout[index=' + index + '] table').append(row)
    $('.tbLayout[index=' + index + '] table tr[class=rowLayout]').append(column)
    displayMachineSize(index, item.machine)
    //$('.cut_size[index='+index+']').val(item.machine.machine_size.id-1)
    displayGrainFluteImg(index, item.component_type.type)
    checkLaysize(index)
    storePaperSize(index)
    est.setCalculatePaperWeight(index)
}

function getPaperSize4Display(item) {
    if (item.component_type.type != 3) {
        //* component_type : paper only or paper+corrugated -> show paper size
        var wSide = item.paperSize[2]
        var lSide = item.paperSize[3]

    } else {
        //* component_type : only corrugated -> show corrugated size 
        // var wSide = item.paperSize[2]
        // var lSide = item.paperSize[3]
        var wSide = item.corrugated_layer.info.flute_side
        var lSide = item.corrugated_layer.info.cut_off
    }

    return { wSide, lSide }
}

function getRealPaperSize4Display(item) {
    if (item.component_type.type != 3) {
        //* component_type : paper only or paper+corrugated -> show paper size

        var roll_width_side = item.paper_info.roll_width
        var cut_off_side = item.paper_info.cut_off

    } else {
        //* component_type : only corrugated -> show corrugated size 

        var roll_width_side = item.corrugated_layer.info.flute_side
        var cut_off_side = item.corrugated_layer.info.cut_off
    }

    return { roll_width_side, cut_off_side }
}

function setDisplayMachineSize(index, print_type, item = {}) {
    const isProfitSharing = getIsProfitSharing()
    const ink_type = getInkType()
    const is_printing = getComponentIsPrinting(item, null)

    if (print_type == 'Jet Press') {
        $(`.cut_size[index=${index}] option`).hide()
        $(`.cut_size[index=${index}] option[value=5]`).show()
        $(`.cut_size[index=${index}] option[value=5]`).attr('selected', true)
    } else if (print_type == 'Konica') {
        $(`.cut_size[index=${index}] option`).hide()
        $(`.cut_size[index=${index}] option[value=6]`).show()
        $(`.cut_size[index=${index}] option[value=6]`).attr('selected', true)
    } else if (print_type == 'Flexo') {
        $(`.cut_size[index=${index}] option`).hide()
        $(`.cut_size[index=${index}] option[value=4]`).show()
        $(`.cut_size[index=${index}] option[value=4]`).attr('selected', true)
    } else {
        // * Offset
        $(`.cut_size[index=${index}] option`).hide()
        $(`.cut_size[index=${index}] option:not([value=5], [value=6])`).show()
        $(`.cut_size[index=${index}] option[value=1]`).attr('selected', true)

        if (ink_type == 'UV') {
            $(`.cut_size[index=${index}] option:not([value=2],[value=4])`).hide()
            $(`.cut_size[index=${index}]`).val(2)
        }

        if (isProfitSharing) {
            $(`.cut_size[index=${index}] option:not([value=2])`).hide()
            $(`.cut_size[index=${index}]`).val(2)
        }
    }

    if (!is_printing) {
        $(`.cut_size[index=${index}] option[value=9998]`).show()
    }
}

function displayMachineSize(index, machine_obj) {
    $(`.cut_size[index=${index}]`).val(machine_obj.machine_size.id)
}

function displayStdPaperSize(index, std_paper_id) {
    if (std_paper_id) {
        $(`.cut_size_std_paper[index=${index}]`).val(std_paper_id)
    }
}

function displayGrainFluteImg(index, componentType) {
    switch (componentType) {
        case 1: //* paper only
            $('.grainPaper[index=' + index + ']').show()
            $('.fluteImg[index=' + index + ']').hide()
            break
        case 2: //* paper+corrugated
            $('.grainPaper[index=' + index + ']').show()
            $('.fluteImg[index=' + index + ']').show()
            break
        case 3: //* corrugated only
            $('.grainPaper[index=' + index + ']').hide()
            $('.fluteImg[index=' + index + ']').show()
            break
    }
}

function getLayoutGrainSelectOption(index, optionSize, size) {
    const {
        component_type: {
            type = 0
        }
    } = est.mainData.component1[index]
    const isCustomCorrugated = getIsCustomCorrugated(index)

    console.log("getLayoutGrain option:", index, optionSize, size, type)

    if (!isCustomCorrugated) {
        switch (optionSize) {
            case 'wLaySize':
                if (size != "") {
                    $('.layout_grain[index=' + index + '] .optionWSize,.parallelFluteSide[index=' + index + '] .optionWSize').text("ขนานด้าน " + size + '"')
                    $('.layout_grain[index=' + index + '] .optionWSize,.parallelFluteSide[index=' + index + '] .optionWSize').show()
                } else {
                    $('.layout_grain[index=' + index + '] .optionWSize,.parallelFluteSide[index=' + index + '] .optionWSize').hide()
                    $('.layout_grain[index=' + index + '],.parallelFluteSide[index=' + index + ']').val("")
                }

                break
            case 'lLaySize':
                if (size != "") {
                    $('.layout_grain[index=' + index + '] .optionLSize,.parallelFluteSide[index=' + index + '] .optionLSize').text("ขนานด้าน " + size + '"')
                    $('.layout_grain[index=' + index + '] .optionLSize,.parallelFluteSide[index=' + index + '] .optionLSize').show()
                } else {
                    $('.layout_grain[index=' + index + '] .optionLSize,.parallelFluteSide[index=' + index + '] .optionLSize').hide()
                    $('.layout_grain[index=' + index + '],.parallelFluteSide[index=' + index + ']').val("")
                }
                break
        }
    } else {
        let layGrainOption = [],
            parallelFluteOption = []

        parallelFluteOption = [
            $(`.parallelFluteSide[index=${index}] .optionWSize`).text(),
            $(`.parallelFluteSide[index=${index}] .optionLSize`).text(),
        ]

        layGrainOption = [
            $(`.layout_grain[index=${index}] .optionWSize`).text(),
            $(`.layout_grain[index=${index}] .optionLSize`).text(),
        ]

        console.log("before change ", layGrainOption)

        if ([2].includes(type)) {
            parallelFluteOption = [
                'ขนานด้านหน้าม้วน',
                'ขนานด้าน Cut off',
            ]



            switch (optionSize) {
                case 'wLaySize':
                    if (size != "") {
                        layGrainOption[0] = `ขนานด้าน ${size}" `
                    } else {
                        layGrainOption[0] = ``
                    }

                    break

                case 'lLaySize':
                    if (size != "") {
                        layGrainOption[1] = `ขนานด้าน ${size}" `
                    } else {
                        layGrainOption[1] = ``
                    }

                    break
            }

            console.log("comp 2 change lay.", optionSize, size, layGrainOption)
            // $(`.layout_grain[index=${index}] .optionWSize`).text(layGrainOption[1])
            // $(`.layout_grain[index=${index}] .optionLSize`).text(layGrainOption[0])

            // //? เลือกด้านขนาน layout size
            // $(`.parallelFluteSide[index=${index}] .optionWSize`).text(parallelFluteOption[0])
            // $(`.parallelFluteSide[index=${index}] .optionLSize`).text(parallelFluteOption[1])

        } else if ([3].includes(type)) {
            switch (optionSize) {
                case 'wLaySize':
                    if (size != "") {
                        parallelFluteOption[0] = `ขนานด้าน ${size}" `
                    } else {
                        parallelFluteOption[0] = ``
                    }

                    break

                case 'lLaySize':
                    if (size != "") {
                        parallelFluteOption[1] = `ขนานด้าน ${size}" `
                    } else {
                        parallelFluteOption[1] = ``
                    }

                    break
            }
        }

        if (layGrainOption[0]) {
            // ? Incorrect grain laying
            $(`.layout_grain[index=${index}] .optionWSize`).show()
        } else {
            $(`.layout_grain[index=${index}] .optionWSize`).hide()
            $(`.layout_grain[index=${index}]`).val('')
        }

        if (layGrainOption[1]) {
            // ? Correct grain laying
            $(`.layout_grain[index=${index}] .optionLSize`).show()
        } else {
            $(`.layout_grain[index=${index}] .optionLSize`).hide()
            $(`.layout_grain[index=${index}]`).val('')
        }

        if (parallelFluteOption[0]) {
            // ? Correct grain laying
            $(`.parallelFluteSide[index=${index}] .optionWSize`).show()
        } else {
            $(`.parallelFluteSide[index=${index}] .optionWSize`).hide()
            $(`.parallelFluteSide[index=${index}]`).val('')
        }

        if (parallelFluteOption[1]) {
            // ? Incorrect grain laying
            $(`.parallelFluteSide[index=${index}] .optionLSize`).show()
        } else {
            $(`.parallelFluteSide[index=${index}] .optionLSize`).hide()
            $(`.parallelFluteSide[index=${index}]`).val('')
        }

        //? Correct grain must have horizontal grain
        $(`.layout_grain[index=${index}] .optionWSize`).text(layGrainOption[0])
        //? Incorrect grain must have vertical grain
        $(`.layout_grain[index=${index}] .optionLSize`).text(layGrainOption[1])

        //? เลือกด้านขนาน layout size หน้าม้วน / cut off
        $(`.parallelFluteSide[index=${index}] .optionWSize`).text(parallelFluteOption[0])
        $(`.parallelFluteSide[index=${index}] .optionLSize`).text(parallelFluteOption[1])
    }
}

function createPaperGrainDiv(index, parallelSide) {
    $('.grainPaper[index=' + index + ']').remove()
    if (parallelSide != "") {
        //* 27.05.22 : กระดาษวางแนวนอนเสมอ w = หน้าม้วน
        if (parallelSide == 'WSize') {
            var id = 'arrowH'
            var img = 'testH'
        } else if (parallelSide == 'LSize') {
            var id = 'arrowV'
            var img = 'testV'
        }
        var div = `<div class="grainPaper" grain="${id}" index="${index}">
                    <img src="./img/${img}.png">
                </div>`
        $('.tbLayout[index=' + index + ']').append(div)
    }
}
function createFluteSideImgDiv(index, parallelSide) {
    $('.fluteImg[index=' + index + ']').remove()
    if (parallelSide != "") {
        if (parallelSide == 'WSize') {
            var img = 'fluteV2'
        } else if (parallelSide == 'LSize') {
            var img = 'fluteH2'
        }
        var div = `<div class="fluteImg" index="${index}">
                    <img src="./img/${img}.png">
                </div>`
        $('.tbLayout[index=' + index + ']').append(div)
    }
}
function setCalculateLayout(index, is_useMachineSize) {
    //? function_estimate.js:3368
    //? if call function from recal_bttn = false
    //* if is_useMachineSize == true mean use maximum machine size and set machine cut size following current machine cut size
    //* if is_useMachineSize == false mean use paper size and find machine cut size compare with current machine cut size if cannot fit then base on paper size 

    var item = est.mainData.component1[index]
    var dummy_paper_align = item.paper_info.paper_align
    var paperSize = []
    let realPaperSize = []
    let std_paper_id = null
    let obj = {}
    // update 22.02.22 this is true only when change .cut_size
    if (is_useMachineSize) {
        var cut_id = parseInt($('.componentLayout[index=' + index + '] .cut_size').val())
        // update : 22.02.22
        std_paper_id = parseInt($('.componentLayout[index=' + index + '] .cut_size_std_paper').val()) || null

        console.log("std_paper_id", std_paper_id)

        const defaultMachine = est.getMachineList(item)?.find(obj => obj.machine_size.id === cut_id)
        //?case 1 : set default from machine max_size
        paperSize = [
            defaultMachine.max_size[2],
            defaultMachine.max_size[3],
            defaultMachine.max_size[0],
            defaultMachine.max_size[1]
        ]

        //?case 2 : if selected std_paper_size use std. paper
        if (std_paper_id) {
            const stdPaperSize = getStdPaperSize(std_paper_id)
            if (stdPaperSize) {
                const {
                    std_paper_size_width_mm,
                    std_paper_size_length_mm,
                    std_paper_size_width_in,
                    std_paper_size_length_in,
                    // real size std.paper
                    std_paper_size_ref_width_in,
                    std_paper_size_ref_length_in,
                    std_paper_size_ref_width_mm,
                    std_paper_size_ref_length_mm
                } = stdPaperSize

                if (stdPaperSize) {

                    paperSize = [
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
                    obj = {
                        ...obj,
                        is_switchDisplay: false,
                        parallel_side: 'WSize',
                    }
                }
            }
        }

        obj = {
            ...obj,
            paper_align: 'short',
            dummy_paper_align,
            realPaperSize,
            std_paper_id
        }
        est.setPaperSize(item, paperSize, obj)
    } else {
        // 1. form reaclc_layout_bttn click
        storePaperSize(index)
    }
    //? update : 11.03.22
    if (est.checkPaperMaxSizeMachine(index).match === false) {
        alert('ไซส์กระดาษไม่อยู่ในเกณฑ์ที่กำหนดของ Machine กรุณาตรวจสอบไซส์กระดาษ')
        return false
    }

    est.setSelectedLayoutGrain(index)
    console.log("setCalculateLayout (setCalculateLayout)")
    if (est.setCalculateLayout(index) == false) {
        checkLaying(index)
        alert('ไม่สามารถวางเลย์ได้. เนื่องจากขนาดชิ้นงาน หรือ ขนาดกระดาษไม่เหมาะสมกับ min , max size machine')
        return false
    }
    // set item laySize and check match machine
    est.setCalculateLaysize(index, is_useMachineSize)
    est.setDefaultPacking(index)
    console.log("data before calc. ups", item?.paper_info?.roll_width, item?.paper_info?.cut_off, item?.paperSize)
    est.setCalculateUps(index)
    setDivComponentLayout(index, false)
}
function getPaperSize(index, num_lay) {
    var item = est.mainData.component1[index]
    storeTolerance(index)
    var check = est.setCalculateCustomLayout(item, num_lay, false, index)
    if (item.component_type.type === 3) {
        if (checkComponentPaperSize(index)) {
            est.setDefaultPacking(index)
            est.setCalculateUps(index)
            editImgLayout(index)
            recalcPaperUsageTable(index)
        }

        checkNumLay(index, check, item.layout.selected_layout)
    } else {
        est.setDefaultPacking(index)
        est.setCalculateUps(index)
        editImgLayout(index)
        recalcPaperUsageTable(index)
        checkNumLay(index, check, item.layout.selected_layout)
        checkComponentPaperSize(index)
    }

}

//? About Paper Usage Table
function tbPaperUsage(index) {
    var div = `<div class="componentPaperUsage" index="${index}" style="margin-top:45px;text-align:center;">
                <div class="recalc-paperusage">
                    <button class="recalc-paperusage-bttn">คำนวณ Paper Usage ใหม่</button>
                </div>
            </div>`
    $('.componentInfo[index=' + index + ']').append(div)
}

function getPaperUsageTable(index) {
    const paperUsage = '.componentPaperUsage[index=' + index + ']'
    if ($(paperUsage + '  .recalc-paperusage').length == 0) {
        var div = `<div class="recalc-paperusage">
                    <button class="recalc-paperusage-bttn">คำนวณ Paper Usage ใหม่</button>
                </div>`
        $(paperUsage).append(div)
    }
    var table = `<table style="text-align:center; border:1px solid black;margin-left:auto;margin-right:auto" border cellpadding="5">
                    <tr>
                        <th>Component </th>
                        <th style="width:45px">Qty</th>
                        <th style="width:45px">Ups</th>
                        <th>After ups</th>
                        <th style="width:45px">Waste</th>
                        <th>After waste</th>
                        <th style="width:45px">Sig</th>
                        <th>Paper Print</th>
                        <th style="width:45px">Split</th>
                        <th>Paper qty</th>
                        <th>Paper Net</th>
                        <th style="width:45px">Tons</th>
                    </tr>
                </table>`
    $(paperUsage).append(table)
    return table
}
function rowPaperUsage(index) {
    const is_multiple_f = getIsMultipleF()
    const paperUsage = '.componentPaperUsage[index=' + index + ']'
    var item = est.mainData.component1[index],
        row = ''
    item.paper_usage.line.forEach((item1, index1) => {
        const compName = is_multiple_f ? item?.f_detail.f_list[index1].f_code : item.component_name
        row += `<tr index1="${index1}">
            <td class="col_component_name">${compName}</td>
            <td class="col_qty">${numeral(item1.qty).format('0,0')}</td>
            <td class="col_ups">${numeral(item.paper_usage.ups).format('0,0')}</td>
            <td class="col_after_ups">${numeral(item1.after_ups).format('0,0')}</td>
            <td class="col_waste">${numeral(item1.waste).format('0,0')}</td>
            <td class="col_after_waste">${numeral(item1.after_waste).format('0,0')}</td>
            <td class="col_sig">${numeral(item.paper_usage.sig).format('0,0')}</td>
            <td class="col_paper_print">${numeral(item1.paper_print).format('0,0')}</td>
            <td class="col_split">${numeral(item.paper_usage.split).format('0,0')}</td>
            <td class="col_paper_qty">${numeral(item1.paper_qty).format('0,0')}</td>
            <td class="col_paper_net">${numeral(item1.paper_net).format('0,0')}</td>
            <td class="col_ton">${numeral(item1.ton).format('0,0.000')}</td>
        </tr>`
    })
    $(paperUsage + ' table tr').not(':first').remove()
    $(paperUsage + ' table').append(row)
    $(paperUsage + ' table td').addClass('alCenter')
}
function edittbPaperUsage(index) {
    const is_multiple_f = getIsMultipleF()
    var item = est.mainData.component1[index]

    item.paper_usage.line.forEach((item1, index1) => {
        const compName = is_multiple_f ? item?.f_detail.f_list[index1].f_code : item.component_name
        var paperUsage = '.componentPaperUsage[index=' + index + '] tr[index1=' + index1 + ']'
        $(paperUsage + ' .col_component_name').text(compName)
        $(paperUsage + ' .col_qty').text(numeral(item1.qty).format('0,0'))
        $(paperUsage + ' .col_ups').text(numeral(item.paper_usage.ups).format('0,0'))
        $(paperUsage + ' .col_after_ups').text(numeral(item1.after_ups).format('0,0'))
        $(paperUsage + ' .col_waste').text(numeral(item1.waste).format('0,0'))
        $(paperUsage + ' .col_after_waste').text(numeral(item1.after_waste).format('0,0'))
        $(paperUsage + ' .col_sig').text(numeral(item.paper_usage.sig).format('0,0'))
        $(paperUsage + ' .col_paper_print').text(numeral(item1.paper_print).format('0,0'))
        $(paperUsage + ' .col_split').text(numeral(item.paper_usage.split).format('0,0'))
        $(paperUsage + ' .col_paper_qty').text(numeral(item1.paper_qty).format('0,0'))
        $(paperUsage + ' .col_paper_net').text(numeral(item1.paper_net).format('0,0'))
        $(paperUsage + ' .col_ton').text(numeral(item1.ton).format('0,0.000'))
    })
}

function recalcPaperUsageTable(index) {
    console.log("recalcPaperUsageTable")
    if (checkValidateQty()) {
        const f_detail = storeQty2()
        est.setFDetail(f_detail)
        est.setPaperInfo(index)
        if (changeAddonEvent(index)) {

            $('.componentPaperUsage[index=' + index + '] table').remove()
            getPaperUsageTable(index)
            rowPaperUsage(index)
            $('.componentPaperUsage[index=' + index + '] .recalc-paperusage').removeClass('show-bttn')

        }
    }
}
//? About Packing Section
function setDefaultDivPacking(is_different_packing = false) {
    const is_multiple_f = getIsMultipleF()
    $('#packing_section').remove()
    setDivPacking(is_different_packing)

    if (is_multiple_f && is_different_packing) {
        est.mainData?.component1?.forEach((comp, compIndex) => {
            const { f_detail } = comp || {}

            f_detail?.f_list.forEach((fInfo, fIndex) => {
                const kraftwrap = est.getPackingObj(comp, 'kraftwrap', fIndex)
                const layKraftwrapSize = getKraftwrapSize(compIndex, fIndex)

                imgLayoutKraftwrap(compIndex, 1, 1, layKraftwrapSize, fIndex)
                $(`.kraftwrap[index=${compIndex}][fIndex=${fIndex}] input`).prop('checked', true)
                $(`.divKraftwrap[index=${compIndex}][fIndex=${fIndex}]`).show()
                $(`.kraftwrap_qty[index=${compIndex}][fIndex=${fIndex}]`).val(numeral(kraftwrap.info.qty_per_pack).format('0,0'))
            })
        })
    } else {
        $('.component').each(function (compIndex) {
            const fIndex = 0 //* default for non diff.
            const kraftwrap = est.getPackingObj(est.mainData.component1[compIndex], 'kraftwrap', fIndex)
            const layKraftwrapSize = getKraftwrapSize(compIndex, fIndex)

            imgLayoutKraftwrap(compIndex, 1, 1, layKraftwrapSize, fIndex)
            $(`.kraftwrap[index=${compIndex}][fIndex=${fIndex}] input`).prop('checked', true)
            $(`.divKraftwrap[index=${compIndex}][fIndex=${fIndex}]`).show()
            $(`.kraftwrap_qty[index=${compIndex}][fIndex=${fIndex}]`).val(numeral(kraftwrap.info.qty_per_pack).format('0,0'))
        })
    }
}

function setDivPacking(is_different_packing = false) {
    console.log("display packing")
    const is_multiple_f = getIsMultipleF()
    const { qty_per_paper_band: default_qty_per_paperband } = defaultData.paperband_info || {}
    var div_child = ""

    est.mainData?.component1?.forEach((comp, compIndex) => {
        let packingLength = 1

        if (is_different_packing) {
            packingLength = est.mainData?.component1[0]?.f_detail?.f_list?.length || 1
        }

        console.log("packingLength", is_different_packing, packingLength)

        for (let fIndex = 0; fIndex < packingLength; fIndex++) {
            console.log("loop packing", fIndex)
            const {
                component_name,
                f_detail
            } = est.mainData?.component1[is_different_packing ? 0 : compIndex] || {}

            const compName = is_different_packing ? `${f_detail?.f_list[fIndex].f_code}` : `Component ที่ ${parseInt(compIndex || 0) + 1} : ${component_name}`

            div_child += `<div class="packingComponent" index="${compIndex}" fIndex="${fIndex}">
                            <div class="packingCheck" index="${compIndex}" fIndex="${fIndex}">
                                <table cellpadding="10">
                                    <tr>
                                        <td><strong>${compName}</strong></td>
                                        <td><strong>Packing</strong></td>
                                        <td><div class="paperband" index="${compIndex}" fIndex="${fIndex}"><input type="checkbox">Paper Band</div></td>
                                        <td><div class="kraftwrap" index="${compIndex}" fIndex="${fIndex}"><input type="checkbox">Kraftwrap</div></td>
                                        <td><div class="carton" index="${compIndex}" fIndex="${fIndex}"><input type="checkbox">Carton</div></td>
                                        <td><div class="pallet" index="${compIndex}" fIndex="${fIndex}"><input type="checkbox">Pallet</div></td>
                                    </tr>
                                </table>
                            </div>
                            <div class="divPacking" index="${compIndex}" fIndex="${fIndex}">
                                <div class="div-child divPaperband" index="${compIndex}" fIndex="${fIndex}" style="display:none">
                                    <table>
                                        <tr>
                                            <td style="width:100px">Paper Band</td>
                                            <td style="align:center; width:80px">ชนิดสายคาด</td>
                                            <td>
                                                <select class="paperbandType" index="${compIndex}" fIndex="${fIndex}" style="vertical-align:center">
                                                    <option value="white_paper">White Paper</option>
                                                    <option value="brown_paper">Brown Paper</option>
                                                    <option value="plastic">Plastic</option>
                                                </select>
                                            </td>
                                            <td style="text-align:center">Quantity/band</td>
                                            <td style="text-align:center"><input class="qty_per_band" index="${compIndex}" fIndex="${fIndex}" style="text-align:center;width:50px;" value="${default_qty_per_paperband}"></td>
                                        </tr>
                                    </table>	
                                </div>
                                <div class="div-child divKraftwrap flex-row-parent" index="${compIndex}" fIndex="${fIndex}" style="display:none">
                                    <div style="width:100px;" class="flex-row-child">Kraftwrap</div>
                                    <div class="flex-row-child">
                                        <table  cellpadding="5">
                                            <tr>
                                                <td>จำนวนด้านกว้าง</td>
                                                <td><input class="numW_Kraftwrap" index="${compIndex}" fIndex="${fIndex}" style="width:30px; text-align:center" value="1"></td>
                                            </tr>
                                            <tr>
                                                <td>จำนวนด้านยาว</td>
                                                <td><input class="numL_Kraftwrap" index="${compIndex}" fIndex="${fIndex}" style="width:30px; text-align:center" value="1"></td>
                                            </tr>
                                            <tr>
                                                <td>Packing Size</td>
                                                <td class="bulk_size" index="${compIndex}" fIndex="${fIndex}"></td>
                                            </tr>
                                            <tr>
                                                <td><input type="checkbox" class="edit_kraftwrap_qty" index="${compIndex}" fIndex="${fIndex}" >แก้ไขจำนวนทั้งหมด</td>
                                                <td><input class="kraftwrap_qty" index="${compIndex}" fIndex="${fIndex}" style="width:50px;text-align:center" value="" readonly> ชิ้น</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="flex-row-child" style="text-align:right; width:150px; margin-top:5px">รูปแบบการ Packing</div>
                                </div>
                                <div class="div-child flex-row-parent divCarton" index="${compIndex}" fIndex="${fIndex}" style="display:none">
                                    <div style="width:100px;" class="flex-row-child">Carton</div>
                                    <div class="flex-row-child">
                                        <div style="margin-bottom:10px">
                                            <table cellpadding="5">
                                                <tr style="">
                                                    <td>
                                                        <input type="checkbox" class="is_carton_printing mr-1">
                                                        <span>มีพิมพ์บน Carton</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="text-align:center">จำนวนชั้นลูกฟูก</td>
                                                    <td style="text-align:center; width:50px;">
                                                        <div>
                                                            <select class="cartonLayer" index="${compIndex}" fIndex="${fIndex}" style="text-align-last:center">
                                                                <option value="3">3</option>
                                                                <option value="5" selected>5</option>
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td style="text-align:center; width:100px">ชนิดลอน</td>
                                                    <td>
                                                        <div class="fluteCtn_corrugated" index="${compIndex}" fIndex="${fIndex}">
                                                            <select class="required" style="text-align-last:center">
                                                                <option value="BC">BC</option>
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td style="text-align:center; width:100px">ชนิดลูกฟูก</td>
                                                    <td >
                                                        <div class="gradeCtn_corrugated" index="${compIndex}" fIndex="${fIndex}">
                                                            <select class="type_1Ctn required"  index="${compIndex}" fIndex="${fIndex}" style="text-align-last:center">
                                                                <option value="CA">CA</option>
                                                                <option value="KI">KI</option>
                                                                <option value="KA">KA</option>
                                                                <option value="KS">KS</option>
                                                            </select>
                                                            <select class="gram_1Ctn required" index="${compIndex}" fIndex="${fIndex}" style="text-align-last:center">
                                                                <option value="">-</option>
                                                                <option value="125" selected>125</option>
                                                            </select>
                                                            /<span class="corrugatedFlute">3</span>
                                                            <select class="type_2Ctn required" index="${compIndex}" fIndex="${fIndex}" style="text-align-last:center;">
                                                                <option value="">-</option>
                                                                <option value="CA" selected>CA</option>
                                                            </select>
                                                            <select class="gram_2Ctn required" index="${compIndex}" fIndex="${fIndex}" style="text-align-last:center;">
                                                                <option value="">-</option>
                                                                <option value="125" selected>125</option>
                                                            </select>
                                                            /<select class="type_3Ctn required" index="${compIndex}" fIndex="${fIndex}" style="text-align-last:center">
                                                                <option value="">-</option>
                                                                <option value="CA" selected>CA</option>
                                                            </select>
                                                            <select class="gram_3Ctn required" index="${compIndex}" fIndex="${fIndex}" style="text-align-last:center">
                                                                <option value="">-</option>
                                                                <option value="125" selected>125</option>
                                                            </select>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                        <div class="flex-row-parent">
                                            <div style="margin-right:50px">
                                                <table cellpadding="5" >
                                                    <tr>
                                                        <td style="text-align:left;" class="td-packing-label">Unit</td>
                                                        <td ><div class="carton_info_unit" index="${compIndex}" fIndex="${fIndex}">unit!!!</div></td>
                                                    </tr>
                                                    <tr>
                                                        <td style="text-align:left;" class="td-packing-label">Unit size</td>
                                                        <td colspan="3"><div class="carton_info_unit_size" index="${compIndex}" fIndex="${fIndex}">unit size</div></td>
                                                    </tr>
                                                    <tr>
                                                        <td></td>
                                                        <td colspan="3">
                                                            <input class="is_custom_inner_size mr" type="checkbox" /> <span>กำหนดเอง</span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="text-align:left;" class="td-packing-label">Carton (Inner size)</td>
                                                        <td colspan="3">
                                                            <div class="innerCtnSize" index="${compIndex}" fIndex="${fIndex}">
                                                                <input readonly class="w_innerCtnSize" index="${compIndex}" fIndex="${fIndex}" style="width:40px; text-align:center" > 
                                                                x <input readonly class="l_innerCtnSize" index="${compIndex}" fIndex="${fIndex}" style="width:40px; text-align:center" > 
                                                                x <input readonly class="h_innerCtnSize" index="${compIndex}" fIndex="${fIndex}" style="width:40px; text-align:center" > inch 
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td colspan="4" class="text-center">
                                                            <button class="recalc_carton">Re-Calculate Carton</button>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="text-align:left;" class="td-packing-label"></td>
                                                        <td>
                                                            <span class="ml-2 mr-5">กว้าง</span>
                                                            <span>ยาว</span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="text-align:left;" class="td-packing-label" index="${compIndex}" fIndex="${fIndex}">
                                                            <input type="checkbox" class="is_custom_qty_per_carton"/>
                                                            <span>กำหนดจำนวน/กล่องเอง</span>
                                                        </td>
                                                        <td>
                                                            <div class="carton_laying custom_qty_per_carton" index="${compIndex}" fIndex="${fIndex}">
                                                                <input class="carton_laying_width mr" style="width:50px; text-align:center" readonly>
                                                                <span class="mr">x</span>
                                                                <input class="carton_laying_length" style="width:50px; text-align:center" readonly>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="text-align:left;" class="td-packing-label">จำนวนชิ้น(งาน)/กล่อง</td>
                                                        <td>
                                                            <div class="total_qty_per_carton" index="${compIndex}" fIndex="${fIndex}">
                                                                <input style="width:50px; text-align:center" readonly> ชิ้น
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="text-align:left;" class="td-packing-label">จำนวนชิ้น(งาน)/<span class="carton_bulk_unit">xx</span></td>
                                                        <td>
                                                            <div class="qty_bulk_per_pack" index="${compIndex}" fIndex="${fIndex}">
                                                                <input style="width:50px; text-align:center" readonly> ชิ้น
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="text-align:left;" class="td-packing-label">จำนวนชิ้น(<span class="carton_bulk_unit">xx</span>)/กล่อง</td>
                                                        <td>
                                                            <div class="qty_per_carton" index="${compIndex}" fIndex="${fIndex}">
                                                                <input style="width:50px; text-align:center" readonly> ชิ้น
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="text-align:left;" class="td-packing-label">จำนวนชิ้น(<span class="carton_bulk_unit">xx</span>)/ชั้น</td>
                                                        <td>
                                                            <div class="qty_per_layer" index="${compIndex}" fIndex="${fIndex}">
                                                                <input style="width:50px; text-align:center" readonly> ชิ้น
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="text-align:left;" class="td-packing-label">จำนวนชั้น</td>
                                                        <td>
                                                            <div index="${compIndex}" fIndex="${fIndex}">
                                                                <input class="carton_layer" style="width:50px; text-align:center" readonly>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="text-align:left;" class="td-packing-label">น้ำหนัก</td>
                                                        <td>
                                                            <div class="carton_info_weight_per_carton" index="${compIndex}" fIndex="${fIndex}">
                                                                <input style="width:50px; text-align:center" readonly> kg
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            <div class="flex-row-parent flex-row-child">
                                                <div class="flex-row-child" style="width:550px; margin-left:20px">
                                                    <div style="text-align:center">
                                                        <table cellpadding="5">
                                                            <tr>
                                                                <td style="text-align:center; width:100px" >ขนาดแผ่นลูกฟูก</td>
                                                                <td colspan="2"><div class="mmSizeCtn_corrugated" index="${compIndex}" fIndex="${fIndex}"><input style="width:60px; text-align:center" readonly> x <input  style="width:60px; text-align:center" readonly> mm</div></td>
                                                                <td colspan="2"><div class="inchSizeCtn_corrugated" index="${compIndex}" fIndex="${fIndex}"><input style="width:60px; text-align:center" readonly> x <input  style="width:60px; text-align:center" readonly> inch</div></td>
                                                            </tr>
                                                            <tr>
                                                                <td style="text-align:center">พื้นที่</td>
                                                                <td><div class="areaCtn_corrugated" index="${compIndex}" fIndex="${fIndex}"><input style="width:50px; text-align:center" readonly> ft²</div></td>
                                                                <td style="text-align:center">ความยาวต่อแผ่น</td>
                                                                <td><div class="lengthCtn_corrugated" index="${compIndex}" fIndex="${fIndex}" style="text-align:left"><input style="width:50px; text-align:center" readonly> metre</div></td>
                                                            </tr>
                                                        </table>
                                                    </div>
                                                    
                                                    <div class="img_corrugated position-relative" index="${compIndex}" fIndex="${fIndex}">
                                                        <img src="./img/corrugated.png" width="100%">
                                                        <div class="w0_corrugated" index="${compIndex}" fIndex="${fIndex}">35</div>
                                                        <div class="w1_corrugated" index="${compIndex}" fIndex="${fIndex}"></div>
                                                        <div class="w2_corrugated" index="${compIndex}" fIndex="${fIndex}"></div>
                                                        <div class="w3_corrugated" index="${compIndex}" fIndex="${fIndex}"></div>
                                                        <div class="w4_corrugated" index="${compIndex}" fIndex="${fIndex}"></div>
                                                        <div class="w_corrugated" index="${compIndex}" fIndex="${fIndex}"></div>
                                                        <div class="l0_corrugated" index="${compIndex}" fIndex="${fIndex}"></div>
                                                        <div class="l1_corrugated" index="${compIndex}" fIndex="${fIndex}"></div>
                                                        <div class="l2_corrugated" index="${compIndex}" fIndex="${fIndex}" ></div>
                                                        <div class="l_corrugated" index="${compIndex}" fIndex="${fIndex}"></div>
                                                        <div style="position:absolute; bottom:10px; right:5px">หน่วย:mm</div>
                                                        <div class="flute_carton_img"><img src="./img/fluteV2.png" width="100%"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="div-child divPallet" index="${compIndex}" fIndex="${fIndex}" style="display:none">
                                    <table>
                                        <tr>
                                            <td style="width:80px;">Pallet</td>
                                            <td style="text-align:center; width:100px;">Pallet size</td>
                                            <td style="text-align:center; width:200px;">
                                                <div class="palletSize" index="${compIndex}" fIndex="${fIndex}" >
                                                    <select style="text-align-last:center">
                                                        <option value="1">40.00" x 48.00" x 6.50"</option>
                                                        <option value="2">39.37" x 47.24" x 6.50"</option>
                                                        <option value="3">45.90" x 45.90" x 6.50"</option>
                                                        <option value="4">42.00" x 45.00" x 6.50"</option>
                                                        <option value="5">43.30" x 43.30" x 6.50"</option>
                                                        <option value="6">31.50" x 47.24" x 6.50"</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <input type="checkbox" class="is_mif_pallet" index="${compIndex}" fIndex="${fIndex}"/> MIF
                                                </div>
                                            </td>
                                            <td style="text-align:center; width:100px">การขนส่ง</td>
                                            <td style="text-align:center; width:120px">
                                                <div class="palletDelivery" index="${compIndex}" fIndex="${fIndex}">
                                                    <select style="text-align-last:center">
                                                        <option value="1">ในประเทศ</option>
                                                        <option value="2">ต่างประเทศ</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>

                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </div>`
        }
    })



    const packingDiv = `<div id="packing_section" style="margin:20px">
                <div id="packing">
                    ${div_child}
                </div>
            </div>`


    $('body').append(packingDiv)

    if (is_multiple_f && est.mainData?.component1?.length > 0) {
        const checkboxDiffPacking = `<div class="ml-2 mt-2">
            <input type="checkbox" id="is_different_packing" ${is_different_packing ? 'checked' : ''}/> <label for="is_different_packing">แต่ละ F มีรูปแบบการ Packing แตกต่างกัน</label>
        </div>`

        $(`#packing_section`).prepend(checkboxDiffPacking)
    }


    $('.divPaperband .qty_per_band').inputmask({ regex: "^[0-9]{1,3}", placeholder: "" })
    $('.numW_Kraftwrap, .numL_Kraftwrap, .carton_layer').inputmask({ regex: "^[0-9]{1,2}", placeholder: "" })
    // $('.innerCtnSize input').inputmask({ alias: "numeric", placeholder: "" })
    $('.innerCtnSize input').inputmask({ regex: "^[0-9]{1,3}(\\.\\d{1,3})?$", placeholder: "" })
    $('.kraftwrap_qty').inputmask({
        'alias': 'decimal',
        'groupSeparator': ',',
        'autoGroup': true,
        'digits': 0,
        'digitsOptional': false,
        'placeholder': ''
    })
}

function setDifferentPacking(is_different_packing = false) {
    est.setDifferentPacking(is_different_packing) // set data only
    est.setDefaultPacking(0, is_different_packing)
    setCalculatePackingCost(0)
    setDefaultDivPacking(is_different_packing)
}

function setCalculatePackingCost(index, isRecalc = false) {
    const item = est.mainData.component1[index]

    if (!storeDeliveryData()) {
        return false
    }

    item.delivery = []
    item?.packing?.forEach((_, fIndex) => {
        est.setCalculateKraftwrapCost2(item, index, fIndex)
        est.setCalculateCartonCost(item, isRecalc, index, fIndex)
        est.setCalculatePaperbandCost(item, fIndex)
        est.setCalculatePalletCost(item, index, fIndex)
        est.setCalculateDelivery(item, fIndex)
    })
}

//? About Packing: Kraftwrap
function imgLayoutKraftwrap(compIndex, w, l, layKraftwrapSize, fIndex = 0) {
    var row, column, finalRow,
        w_size = layKraftwrapSize.bulk_size[0],
        l_size = layKraftwrapSize.bulk_size[1],
        div = ''

    for (var i = 0; i < w; i++) {
        row += `<tr class="rowLayoutKraftwrap" index="${compIndex}" fIndex="${fIndex}"></tr>`
    }
    for (var i = 0; i < l; i++) {
        column += `<td class="cellLayout" index="${compIndex}" fIndex="${fIndex}"></td>`
    }

    $(`.tbLayoutKraftwrap[index=${compIndex}][fIndex=${fIndex}]`).remove()
    div = `<div class="flex-row-child position-relative tbLayoutKraftwrap" index="${compIndex}" fIndex="${fIndex}" >
                <div class="wLayoutKraftwrap" index="${compIndex}" fIndex="${fIndex}" style="font-size:12px">${w_size}"</div>
                <div class="lLayoutKraftwrap" index="${compIndex}" fIndex="${fIndex}" style="font-size:12px">${l_size}"</div>
                <table width="300" height="230" >
                    <tr>
                        <td style="width:45px; font-size:14px; text-align:center;" rowspan="${w + 1}">${layKraftwrapSize.lay_size[0]}"</td>
                        <td style="height:25px; font-size:14px; text-align:center;" colspan="${l}">${layKraftwrapSize.lay_size[1]}"</td>
                    </tr>
                </table>
            </div>`
    $(`.divKraftwrap[index=${compIndex}][fIndex=${fIndex}]`).append(div)
    $(`.tbLayoutKraftwrap[index=${compIndex}][fIndex=${fIndex}] table`).append(row)
    $(`.tbLayoutKraftwrap[index=${compIndex}][fIndex=${fIndex}] tr[class=rowLayoutKraftwrap]`).append(column)
    $(`.bulk_size[index=${compIndex}][fIndex=${fIndex}]`).text(`${w_size}" x ${l_size}"`)
}

function setCalculateKraftwrapSize(index, num_side, fIndex = 0) {
    var item = est.mainData.component1[index]
    var packing_size = est.getPackingSize(item)

    if ($(`.paperband[index=${index}][fIndex=${fIndex}] input`).prop('checked') == true) {
        var paperband_type = defaultData.paperband.filter((item1, index1) => {
            return item1.type == $(`.paperbandType[index=${index}][fIndex=${fIndex}]`).val()
        })
        var thickness = paperband_type[0].thickness

        //* หาด้านสั้น-ยาว และนำด้านสั้น + 2* thickness
        if (packing_size[2] < packing_size[3]) {
            var short_inch_side = packing_size[0]
            var long_inch_side = packing_size[1]
            var short_mm_side = packing_size[2]
            var long_mm_side = packing_size[3]
            var size = [
                parseFloat((short_inch_side + mm2inch(2 * thickness)).toFixed(2)),
                long_inch_side,
                short_mm_side + (2 * thickness),
                long_mm_side
            ]
        } else {
            var short_inch_side = packing_size[1]
            var long_inch_side = packing_size[0]
            var short_mm_side = packing_size[3]
            var long_mm_side = packing_size[2]
            var size = [
                long_inch_side,
                parseFloat((short_inch_side + mm2inch(2 * thickness)).toFixed(2)),
                long_mm_side,
                short_mm_side + (2 * thickness),
            ]
        }
    } else {
        var size = packing_size
    }


    var layKraftwrap = [
        parseFloat((num_side[0] * size[0]).toFixed(2)),
        parseFloat((num_side[1] * size[1]).toFixed(2)),
        parseFloat((num_side[0] * size[0] * 25.4).toFixed(2)),
        parseFloat((num_side[1] * size[1] * 25.4).toFixed(2))
    ]

    var layout_obj = {
        bulk_size: size,
        layKraftwrap: layKraftwrap
    }
    return layout_obj
}

function getKraftwrapQty(index, fIndex = 0) {
    var kraftwrap = est.getPackingObj(est.mainData.component1[index], 'kraftwrap', fIndex)
    $(`.kraftwrap_qty[index=${index}][fIndex=${fIndex}]`).val(kraftwrap.info.qty_per_pack)
}

//? About Packing: CARTON
function setCalculateCorrugatedCtn(index, fIndex = 0) {
    var w_ctn = parseFloat($(`.w_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val())
    var l_ctn = parseFloat($(`.l_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val())
    var h_ctn = parseFloat($(`.h_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val())
    var w1 = (l_ctn * 25.4) + 4, w2 = (w_ctn * 25.4) + 4, w3 = (w_ctn * 25.4) - 3 + 4, w = 35 + 2 * w1 + w2 + w3
    var l0 = (w2 / 2) + 3, l1 = (h_ctn * 25.4) + 5, l2 = (w2 / 2) + 3, l = l0 + l1 + l2
    var w_mm_side = parseFloat(((h_ctn * 25.4 + 8) + (w_ctn * 25.4 + 8)).toFixed(3))
    var l_mm_side = parseFloat(((2 * l_ctn * 25.4) + (2 * w_ctn * 25.4) + 40 + 32).toFixed(3))
    var w_inch_side = mm2inch((h_ctn * 25.4 + 8) + (w_ctn * 25.4 + 8), 3), l_inch_side = mm2inch((2 * l_ctn * 25.4) + (2 * w_ctn * 25.4) + 40 + 32, 3)
    var area = ((mm2inch((h_ctn * 25.4 + 8) + (w_ctn * 25.4 + 8), 3) * mm2inch((2 * l_ctn * 25.4) + (2 * w_ctn * 25.4) + 40 + 32, 3) / 144).toFixed(3))
    var corrugated_mm_side = [w_mm_side, l_mm_side], corrugated_inch_side = [w_inch_side, l_inch_side]
    var l_metre = parseFloat((((2 * l_ctn * 25.4) + (2 * w_ctn * 25.4) + 40 + 32) / 1000).toFixed(2))
    $(`.w1_corrugated[index=${index}][fIndex=${fIndex}]`).text(Math.round(w1))
    $(`.w2_corrugated[index=${index}][fIndex=${fIndex}]`).text(Math.round(w2))
    $(`.w3_corrugated[index=${index}][fIndex=${fIndex}]`).text(Math.round(w1))
    $(`.w4_corrugated[index=${index}][fIndex=${fIndex}]`).text(Math.round(w3))
    $(`.w_corrugated[index=${index}][fIndex=${fIndex}]`).text(numeral(Math.round(w)).format('0,0'))
    $(`.l0_corrugated[index=${index}][fIndex=${fIndex}]`).text(Math.round(l0))
    $(`.l1_corrugated[index=${index}][fIndex=${fIndex}]`).text(Math.round(l1))
    $(`.l2_corrugated[index=${index}][fIndex=${fIndex}]`).text(Math.round(l2))
    $(`.l_corrugated[index=${index}][fIndex=${fIndex}]`).text(numeral(Math.round(l)).format('0,0'))

    $(`.mmSizeCtn_corrugated[index=${index}][fIndex=${fIndex}] input`).each(function (index1) {
        $(this).val(numeral(corrugated_mm_side[index1]).format('0,0.00'))
    })

    $(`.inchSizeCtn_corrugated[index=${index}][fIndex=${fIndex}] input`).each(function (index1) {
        $(this).val(numeral(corrugated_inch_side[index1]).format('0,0.00'))
    })

    $(`.areaCtn_corrugated[index=${index}][fIndex=${fIndex}] input`).val(area)
    $(`.lengthCtn_corrugated[index=${index}][fIndex=${fIndex}] input`).val(numeral(l_metre).format('0,0.00'))
}

function showCartonInfo(index, carton_info, fIndex = 0) {
    var bulk_size = getCartonBulkSize(index, fIndex)
    let unit = 'pcs'

    switch (carton_info.info?.bulk?.unit) {
        case 'kraftwrap':
            unit = 'pack'
            break;
        case 'paperband':
            unit = 'band'
            break;
        default:
            unit = 'pcs'
            break;
    }
    const selector = $(`.packingComponent[index=${index}][fIndex=${fIndex}]`)

    selector.find(`.carton_info_unit`).text(carton_info.info.bulk.unit)
    selector.find(`.carton_info_unit_size`).text(bulk_size[1] + '" x ' + bulk_size[0] + '" x ' + bulk_size[2] + '" (' + numeral(carton_info.info.bulk.qty_per_bulk).format('0,0') + ' pcs : 1 unit)')
    selector.find(`.w_innerCtnSize`).val(carton_info.info.size.inner_size[0])
    selector.find(`.l_innerCtnSize`).val(carton_info.info.size.inner_size[1])
    selector.find(`.h_innerCtnSize`).val(carton_info.info.size.inner_size[2])

    selector.find(`.is_carton_printing`).prop('checked', carton_info.info?.is_carton_printing)

    selector.find(`.carton_laying_width`).val(carton_info.info.carton?.num_layout[0])
    selector.find(`.carton_laying_length`).val(carton_info.info.carton?.num_layout[1])
    selector.find('.carton_bulk_unit').html(unit)
    selector.find(`.total_qty_per_carton input`).val(numeral(carton_info.info.carton.qty_per_carton).format('0,0'))
    selector.find(`.qty_bulk_per_pack input`).val(numeral(carton_info.info?.bulk?.qty_per_bulk || 0).format('0,0'))
    selector.find(`.qty_per_carton input`).val(numeral(carton_info?.info?.carton?.bulk_per_layer * carton_info?.info?.carton?.layer_per_carton).format('0,0'))
    selector.find(`.qty_per_layer input`).val(numeral(carton_info.info.carton.bulk_per_layer).format('0,0'))
    selector.find(`.carton_layer`).val(carton_info.info.carton.layer_per_carton)
    // selector.find(`.weightLayerCtn input`).val(numeral(carton_info.info.net_weight).format('0,0.00'))

    selector.find(`.carton_info_weight_per_carton input`).val(numeral(carton_info.info.net_weight).format('0,0.00'))
    // selector.find(`.qty_per_layer input`).val(numeral(carton_info.info.carton.qty_per_layer).format('0,0'))
    // selector.find(`.carton_info_weight_per_layer input`).val(numeral(carton_info.info.carton.weight_per_layer).format('0,0.00'))
    // selector.find(`.qtyLayerCtn input`).val(carton_info.info.qty_per_carton)
    selector.find('.is_carton_printing').prop('checked', carton_info?.info?.custom_info?.is_carton_printing || false)
    setCustomInnerSizeCarton(index, fIndex, carton_info.info?.custom_info?.is_custom_inner_size)
    setCustomQtyPerCarton(index, fIndex, carton_info.info?.custom_info?.is_custom_qty_per_carton)
}

function setCustomInnerSizeCarton(index = 0, fIndex = 0, bool = false) {
    const selector = $(`.packingComponent[index=${index}][fIndex=${fIndex}]`)

    selector.find('.is_custom_inner_size').prop('checked', bool)

    if (bool) {
        selector.find('.innerCtnSize input').prop('readonly', false).removeClass('readonly')
    } else {
        selector.find('.innerCtnSize input').prop('readonly', true).addClass('readonly')
    }
}

function setCustomQtyPerCarton(index = 0, fIndex = 0, bool = false) {
    const selector = $(`.packingComponent[index=${index}][fIndex=${fIndex}]`)

    selector.find('.is_custom_qty_per_carton').prop('checked', bool)

    if (bool) {
        selector.find('.custom_qty_per_carton input, .carton_layer').prop('readonly', false).removeClass('readonly')
    } else {
        selector.find('.custom_qty_per_carton input, .carton_layer').prop('readonly', true).addClass('readonly')
    }
}

function setCorrugatedGram(layer, index) {
    var flute_layer = ""
    //var liner="ไลน์เนอร์",flute="ลอน"
    var liner = "", flute = ""
    if (layer == 5) {
        flute_layer = 3
    }
    if (layer == 2 || layer == "") {
        var cc = `<div class="corrugatedGrade">
                    ${flute}
                    <select class="type_1 required" style="text-align-last:center;">
                        <option value="">-</option>
                    </select>
                    <select class="gram_1 required" style="text-align-last:center;">
                        <option value="">-</option>
                    </select>/
                    ${liner}
                    <select class="type_2 required" style="text-align-last:center;">
                        <option value="">-</option>
                    </select>
                    <select class="gram_2 required" style="text-align-last:center;">
                        <option value="">-</option>
                    </select>
                </div>`
    } else {
        var cc = `<div class="corrugatedGrade">
                    ${liner}
                    <select class="type_1 required" style="text-align-last:center;">
                        <option value="">-</option>
                    </select>
                    <select class="gram_1 required" style="text-align-last:center;">
                        <option value="">-</option>
                    </select>
                    /${flute} ${flute_layer}
                    <select class="type_2 required" style="text-align-last:center;">
                        <option value="">-</option>
                    </select>
                    <select class="gram_2 required" style="text-align-last:center;">
                        <option value="">-</option>
                    </select>
                    /${liner}
                    <select class="type_3 required" style="text-align-last:center;">
                        <option value="">-</option>
                    </select>
                    <select class="gram_3 required" style="text-align-last:center;">
                        <option value="">-</option>
                    </select>
                </div>`
    }
    $('.component[index=' + index + '] .corrugatedGrade').html(cc)
}
function getCartonInfo(index, fIndex = 0) {
    storePaperband(index, fIndex)
    storeKraftwrap(index, fIndex)
    storeCarton(index, fIndex)
    if (setCalculatePackingCost(index) !== false) {
        getCartonInfo_after_recalc(index, fIndex)
    }

}
function getCartonInfo_after_recalc(index, fIndex = 0) {
    var item = est.mainData.component1[index]
    var carton = est.getPackingObj(item, 'carton', fIndex)
    showCartonInfo(index, carton, fIndex)
}
//* END function interact to HTML element -------------------------------------------------------

//* START function to CHECK input data before calcutation ---------------------------------------
function checkNumLay(index, check, layout) {
    if (!check) alert("ไม่สามารถลง Size เครื่องจักรได้")
    const { is_less, is_more } = layout
    // machineAvailable
    // is_less
    // is_more
    //Alert number of layout CANNOT fit to cut size WHEN change numble of layout
    var div = `<div class="alertNumLay" index="${index}" >
    **ไม่สามารถลง Size เครื่องจักรได้**
    ${is_less ? "* ขนาด Lay. หรือ Paper Size น้อยกว่า Min. Size" : ""}
    ${is_more ? "* ขนาด Lay. หรือ Paper Size มากกว่า Max. Size" : ""}
    </div>`
    $(`.alertNumLay[index=${index}]`).remove()
    setUItoRecalcProc()
    if (is_less || is_more) {
        $('.divEditLayout[index=' + index + ']').append(div)
    }
}
function checkPaperSize() {

    let check = false

    for (var index = 0; index < $('.component').length; index++) {
        var layout_obj = getLayoutSize(index)
        const { w_paper, l_paper, lay_size } = layout_obj || {}

        console.log("checkPaperSize", layout_obj)
        if (
            // todo check this conditions
            // (
            //     w_paper < lay_size[0] &&
            //     l_paper < lay_size[1]
            //     // 55 < 60 && 30 < 50
            // )
            // &&
            // (
            //     w_paper < lay_size[1] &&
            //     l_paper < lay_size[0]
            // )
            w_paper < lay_size[0]
            ||
            l_paper < lay_size[1]

        ) {
            alert('Paper size น้อยกว่า Lay size กรุณาแก้  Paper size')
            $('.paperSize[index=' + index + '] .wSize').focus()
            check = false
            break
        } else {
            if (
                // ["Flexo"].includes(est.mainData.job.print_type) && 
                !est.mainData.component1[index].layout_manual &&
                est.checkPaperMaxSizeMachine(index).match === false
            ) {
                alert('ไซส์กระดาษไม่อยู่ในเกณฑ์ที่กำหนดของ Machine กรุณาตรวจสอบไซส์กระดาษ')
                check = false
                break
            } else {
                if (checkLaying(index) === false) {
                    alert('ไม่สามารถวางเลย์ได้กรุณาตรวจสอบ Paper size หรือ Layout grain')
                    check = false
                    break
                } else {
                    check = true
                }
            }
        }
    }
    return check
}
function checkCutSize() {
    //*check paper thickness and cut size
    const num_comp = $('.component').length
    for (var index = 0; index < num_comp; index++) {
        const item = est.mainData.component1[index]
        const cut_size = $(`.div_size_component[index=${index}] .cut_size`).val()

        if (cut_size == 3 && item.paper) {
            if (item.paper.paper_thickness > 0.45) {
                alert(`Component ที่ ${index + 1} ความหนาของกระดาษมากกว่า 0.45 mm ไม่สามารถลง Machine size: Cut 3 ได้`)
                return false
            }
        }
    }
    return true
}
function checkComponentPaperSize(index) {
    $('.alertLaysize_div[index=' + index + ']').remove()
    var layout_obj = getLayoutSize(index)
    var div = `<div class="alertLaysize_div" index='${index}'>**Paper size น้อยกว่า Lay size กรุณาแก้  Paper size**</div>`
    if (
        // paper width < lay width
        layout_obj.w_paper < layout_obj.lay_size[0]
        ||
        // paper length < lay length
        layout_obj.l_paper < layout_obj.lay_size[1]
    ) {
        var check = false
        $('.divEditLayout[index=' + index + ']').append(div)
        $('.paperSize[index=' + index + '] .wSize').focus()
    } else {
        var check = true
    }
    return check
}

function checkCustomCorrugatedSize(index) {
    console.log("est.mainData.component1[index]", index, est.mainData.component1[index])
    const {
        component_type: {
            type
        }
    } = est.mainData.component1[index]


    if (![2, 3].includes(type)) {
        return true
    }
    //* 1

    const {
        corrugated_layer: {
            info: {
                is_price_per_sheet = false,
                corrugated_size = []
            }
        }
    } = est.mainData.component1[index]

    console.log("checkCustomCorrugatedSize", is_price_per_sheet, corrugated_size)

    if (!is_price_per_sheet) {
        return true
    }
    //* 2

    $('.alertLaysize_div[index=' + index + ']').remove()

    let arr = [], validate = true, div = ''

    $('.paperSize[index=' + index + '] input').each(function () {
        if ($(this).val() != "") {
            arr.push(parseFloat($(this).val()))
        }
    })

    console.log("arr", arr)

    if (arr[0] > corrugated_size[2]) {
        validate = false
        div = `<div class="alertLaysize_div" index='${index}'>** Corrugated Size ที่กำหนด เกินกว่า Custom ลูกฟูก Size (${corrugated_size[2]} x ${corrugated_size[3]}) **</div>`
    }

    if (arr[1] > corrugated_size[3]) {
        validate = false
        div = `<div class="alertLaysize_div" index='${index}'>** Corrugated Size ที่กำหนด เกินกว่า Custom ลูกฟูก Size (${corrugated_size[2]} x ${corrugated_size[3]}) **</div>`
    }

    $('.divEditLayout[index=' + index + ']').append(div)
    return validate
}

function checkLaysize(index) {
    // check lay can match all side machine (หมุนเลย์ด้านไหนก็ได้ให้เข้าเครื่องได้)
    var item = est.mainData.component1[index]
    const { component_type: { type: compType } } = item

    var check = false
    var div = `<div class="alertLaySize" index="${index}" >** Paper Size ไม่สามารถลงเครื่องจักรได้ ** </div>`
    const { short_side, long_side, board_size } = getShortLongSide(item, item.layout.selected_layout)

    const usableMachine = est.getMachineList(item)

    for (var index1 = usableMachine.length - 1; index1 >= 0; index1--) {
        const { w_range, l_range } = usableMachine[index1]

        if (compType == 3) {
            // * เฉพาะลูกฟูก  Flexo เทียบด้าน : ด้าน (ด้านซ้ายเป็นลอนเสมอ) 08.01.25
            // * condition ref code: FLEXO080125

            if (
                board_size[2] >= w_range[2]
                && board_size[2] <= w_range[3]
                && board_size[3] >= l_range[2]
                && board_size[3] <= l_range[3]
            ) {
                check = true
                break
            }

        } else {
            if (
                short_side >= w_range[2]
                && short_side <= w_range[3]
                && long_side >= l_range[2]
                && long_side <= l_range[3]
            ) {
                check = true
                break
            }

        }
    }

    if (check == false) {
        $('.tbLayout[index=' + index + ']').append(div)
        return false
    } else {
        $('.alertLaySize[index=' + index + ']').remove()
        return true
    }
}
function checkCartonInnerSizeBeforeCalcPrice() {
    for (var index = 0; index < $('.component').length; index++) {
        var check = true
        var item = est.mainData.component1[index]

        item?.packing?.forEach((packing, fIndex) => {
            packing?.forEach(() => {
                var inner_width = parseFloat($(`.w_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val())
                var inner_length = parseFloat($(`.l_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val())
                var inner_height = parseFloat($(`.h_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val())
                var carton = est.getPackingObj(item, 'carton', fIndex)
                if (carton == null) {
                    return
                }

                var dummy_inner_size = carton.info.dummy_size.inner_size

                if (inner_width < dummy_inner_size[0]) {
                    alert('ความกว้าง Inner size น้อยเกินไป')
                    $(`.w_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(dummy_inner_size[0])
                    check = false
                    return
                }

                if (inner_length < dummy_inner_size[1]) {
                    alert('ความยาว Inner size น้อยเกินไป')
                    $(`.l_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(dummy_inner_size[1])
                    check = false
                    return
                }

                if (inner_height < dummy_inner_size[2]) {
                    alert('ความสูง Inner size น้อยเกินไป')
                    $(`.h_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(dummy_inner_size[2])
                    check = false
                    // break
                    return
                }
            })
        })

        return check
    }
}
function checkCartonInnerSize(index, fIndex = 0) {
    let check = false
    const bulk_size = getCartonBulkSize(index, fIndex)
    if ($(`.w_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val() == "") {
        $(`.w_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(0)
    }
    if ($(`.l_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val() == "") {
        $(`.l_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(0)
    }
    if ($(`.h_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val() == "") {
        $(`.h_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(0)
    }

    const innerSize = [ //* w , l , h
        parseFloat($(`.w_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val()),
        parseFloat($(`.l_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val()),
        parseFloat($(`.h_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val())
    ]

    let max = Math.max(bulk_size[0], bulk_size[1]) + 0.75,
        min = Math.min(bulk_size[0], bulk_size[1]) + 0.75,
        min_height = innerSize[2]

    if (innerSize[2] < bulk_size[2] + 0.75) {
        min_height = bulk_size[2] + 0.75
    }

    if (innerSize[0] < min && innerSize[1] < min) {
        check = true
        $(`.w_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(min)
        $(`.l_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(max)
        $(`.h_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(min_height)

    } else if (innerSize[0] < min && innerSize[1] >= min && innerSize[1] < max) {
        check = true
        $(`.w_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(max)
        $(`.h_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(min_height)

    } else if (innerSize[0] < min && innerSize[1] >= max) {
        check = true
        $(`.w_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(min)
        $(`.h_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(min_height)

    } else if (innerSize[0] >= min && innerSize[0] < max && innerSize[1] < max) {
        check = true
        $(`.l_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(max)
        $(`.h_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(min_height)

    } else if (innerSize[0] >= max && innerSize[1] < min) {
        check = true
        $(`.l_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(min)
        $(`.h_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(min_height)

    } else if (innerSize[2] < bulk_size[2] + 0.75) {
        check = true
        $(`.h_innerCtnSize[index=${index}][fIndex=${fIndex}]`).val(min_height)

    }

    if (check) {
        alert('Carton Inner size น้อยเกินไป Program จะใช้ Carton Inner Size ที่เป็นไปได้')
    }
}

function checkLaying(index) {
    const { layout: { selected_layout } } = est.mainData.component1[index] || {}
    const { num_laying = 0 } = selected_layout || {}

    var div = `<div class="alertZeroLay" index="${index}" >** ไม่สามารถวางเลย์ได้กรุณาตรวจสอบ Paper size หรือ Layout grain ** </div>`
    $(`.alertZeroLay[index=${index}]`).remove()
    if (num_laying <= 0 || !num_laying) {
        $('.tbLayout[index=' + index + ']').append(div)
    }

    return num_laying > 0 ? true : false
}

function warningText(index, bool, text) {
    $(`.alertZeroLay[index=${index}]`).remove()
    if (bool && text) {
        const alertEle = `<div class="alertZeroLay" index="${index}" >${text}</div>`
        $('.tbLayout[index=' + index + ']').append(alertEle)
    }
}
//* END function to CHECK input data before calcutation -----------------------------------------

//* START function custom spec ------------------------------------------------------------------
function storeSelector(index, process_index) {
    $('#index').val(index)
    $('#process-index').val(process_index)
}
function managePopup(action, div, index, process_index) {
    var selector = '#' + div + '-popup'
    switch (div) {
        case 'foilstamp':
            const foilstamp_class = '.foilstampInput[index=' + index + '][process-index=' + process_index + ']'
            $('#foilColor-custom').val($(foilstamp_class + ' .foilColor-custom').text())
            $('#foilCode-custom').val($(foilstamp_class + ' .foilCode-custom').text())
            $('#foilRollWidth-custom').val($(foilstamp_class + ' .foilRollWidth-custom').val())
            $('#foilRollLength-custom').val($(foilstamp_class + ' .foilRollLength-custom').val())
            $('#foilRollPrice-custom').val($(foilstamp_class + ' .foilRollPrice-custom').val())
            // $('#foilRollMinPrice-custom').val($(foilstamp_class + ' .foilRollMinPrice-custom').val())
            break
        case 'paper':
            const paper_class = '.paperInput[index=' + index + ']'
            $('#paperCode-custom').val($(paper_class + ' .paperCode-custom').text())
            $('#paperType-custom').val($(paper_class + ' .paperType-custom').text())
            $('#paperGram-custom').val($(paper_class + ' .paperGram-custom').text())
            $('#paperThickness-custom').val($(paper_class + ' .paperThickness-custom').text())
            break
        case 'remark':
            $("#remark-popup table tr:not(#remark-button-row)").remove();
            $("[id^='old-reject-remark-']").each(function (index) {
                $(`
                    <tr>
                        <td><div style="text-align: center;">
                            Reject ${index + 1}:<br>${$(this).data("updated")}
                        </div></td>
                        <td style="width: 600px">
                            <textarea disabled style="width: 100%">${$(this).text()}</textarea>
                        </td>
                    </tr>
                `).insertBefore($('#remark-save').closest("tr"))
            })
            if ($('#reject-remark').length != 0) {
                $(`
                    <tr>
                        <td><div style="text-align: center;">
                            Reject ${$("[id^='old-reject-remark-']").length + 1}:<br>${$('#reject-remark').data("updated")}
                        </div></td>
                        <td style="width: 600px">
                            <textarea id="reject-remark-popup" rows="3" placeholder="พิมพ์รายละเอียดเพิ่มเติมที่นี่"  style="width: 100%">${$('#reject-remark').text()}</textarea>
                        </td>
                    </tr>
                `).insertBefore($('#remark-save').closest("tr"))

                $("#remark-button-row").show();
                $("#remark-close").hide();
            } else {
                $("#remark-button-row").hide();
                $("#remark-close").show();
            }
            break
        case 'corrugated':
            getCorrugatedLayerCustom()
            const corrugated_class = '.corrugatedInput[index=' + index + ']'

            var layerCorrugated = $(corrugated_class + ' .layerCorrugated-custom').text()
            $('#corrugated-layer-custom').val(layerCorrugated)
            getFluteTypeOptionCustom(get_corrugated_type(layerCorrugated))
            setCorrugatedGramCustom(layerCorrugated)
            $('.type_custom1').val($(corrugated_class + ' .type_custom_1').text())
            $('.gram_custom1').val($(corrugated_class + ' .gram_custom_1').text())
            $('.type_custom2').val($(corrugated_class + ' .type_custom_2').text())
            $('.gram_custom2').val($(corrugated_class + ' .gram_custom_2').text())
            if (layerCorrugated > 2) {
                $('.type_custom3').val($(corrugated_class + ' .type_custom_3').text())
                $('.gram_custom3').val($(corrugated_class + ' .gram_custom_3').text())
            }

            var fluteCorrugated = $(corrugated_class + ' .fluteCorrugated-custom').text()
            $('#corrugated-flute-custom').val(fluteCorrugated)
            if (fluteCorrugated == "Custom") {
                $("#flute-custom").show()
                $('#flute-info-custom').val($(corrugated_class + ' .fluteInfo-custom').text())
                $('#thickness-custom-p').val($(corrugated_class + ' .thickness-custom').text())
            } else {
                $("#flute-custom").hide()
                $('#flute-info-custom').val("")
                $('#thickness-custom-p').val("")
            }

            $('#corrugated-cost-custom').val($(corrugated_class + ' .costCorrugated-custom').text())
            var isPricePerSheet = $(corrugated_class + ' .isPricePerSheet').val() == '1' ? true : false
            $('#corrugated-bath-sheet').prop("checked", isPricePerSheet);
            if (isPricePerSheet) {
                $("#corrugated-size-row").show();
                $('#flute-side-custom').val($(corrugated_class + ' .fluteSide-custom').text())
                $('#cut-off-custom').val($(corrugated_class + ' .cutOff-custom').text())
                $("#unit-price").text("B/Sheet")
            } else {
                $("#corrugated-size-row").hide();
                $('#flute-side-custom').val("")
                $('#cut-off-custom').val("")
                $("#unit-price").text("B/ตร.ฟุต")
            }
            break
    }

    switch (action) {
        case 'open':
            $('#popup').show()
            $('#popup ' + selector).show()

            if (div == 'remark') {
                $("#remark-popup").scrollTop($("#remark-popup")[0].scrollHeight);
            }
            break
        case 'close':
            $('#popup').hide()
            $('#popup ' + selector).hide()
            break
    }
}

function cancelCustomPaper() {
    const index = $('#index').val()
    const paper_class = '.paperInput[index=' + index + ']'
    managePopup('close', 'paper')
    if ($(paper_class + ' .paperType-custom').text() == "") {
        $(paper_class + ' .custom-paper').attr('custom', 0)
    }
    $(paper_class + ' .paperCost').val('')
    $(paper_class + ' .paper_brand_supplier').html("-")
    $(paper_class + ' input.paper_brand_supplier').val("")
}

function saveCustomPaper() {
    const index = $('#index').val()
    const paper_class = '.paperInput[index=' + index + ']'
    $(paper_class + ' .custom-paper').attr('custom', 1)
    $(paper_class + ' .paperCode-custom').text($('#paperCode-custom').val())
    $(paper_class + ' .paperType-custom').text($('#paperType-custom').val())
    // $(paper_class + ' .paperType').text($('#paperType-custom').val())
    $(paper_class + ' .paperGram-custom').text($('#paperGram-custom').val())
    $(paper_class + ' .paperThickness-custom').text($('#paperThickness-custom').val())
    $(paper_class + ' .paperType-custom,' + paper_class + ' .paperGram-custom').show()
    $(paper_class + ' .paperType,' + paper_class + ' .paperGram').val('').hide()
    $(paper_class + ' .paperCost').val('')
    $(paper_class + ' .paper_brand_supplier').html("-")
    $(paper_class + ' input.paper_brand_supplier').val("")
    managePopup('close', 'paper')
}

function setDefaultPaper(index) {
    const paper_class = '.paperInput[index=' + index + ']'
    $(paper_class + ' .paperType,' + paper_class + ' .paperGram').show()
    $(paper_class + ' .paperType,' + paper_class + ' .paperCost,' + paper_class + ' .paperSale').val("")
    $(paper_class + ' .paper_brand_supplier').html("-")
    $(paper_class + ' input.paper_brand_supplier').val("")
    $(paper_class + ' .paperGram').html('<option value="">-</option>')
    $(paper_class + ' .paperType-custom,' + paper_class + ' .paperGram-custom').hide()
    $(paper_class + ' .paperCode-custom,' + paper_class + ' .paperType-custom,' + paper_class + ' .paperGram-custom,' + paper_class + ' .paperThickness-custom').text("")
}

function cancelCustomFoilstamp() {
    const index = $('#index').val()
    const process_index = $('#process-index').val()
    const foilstamp_class = '.foilstampInput[index=' + index + '][process-index=' + process_index + ']'
    managePopup('close', 'foilstamp')
    if ($(foilstamp_class + ' .foilRollPrice-custom').val() == "") {
        $(foilstamp_class + ' .custom-foil').attr('custom', 0)
    }
}
function saveCustomFoilstamp() {
    const index = $('#index').val()
    const process_index = $('#process-index').val()
    const foilstamp_class = '.foilstampInput[index=' + index + '][process-index=' + process_index + ']'
    $(foilstamp_class + ' .custom-foil').attr('custom', 1).css('color', '')
    $(foilstamp_class + ' .foilColor-custom').text($('#foilColor-custom').val())
    $(foilstamp_class + ' .foilCode-custom').text($('#foilCode-custom').val())
    $(foilstamp_class + ' .foilRollWidth-custom').val($('#foilRollWidth-custom').val())
    $(foilstamp_class + ' .foilRollLength-custom').val($('#foilRollLength-custom').val())
    $(foilstamp_class + ' .foilRollPrice-custom').val($('#foilRollPrice-custom').val())
    // $(foilstamp_class + ' .foilRollMinPrice-custom').val($('#foilRollMinPrice-custom').val())
    managePopup('close', 'foilstamp')
    $(foilstamp_class + ' .foilColor-custom,' + foilstamp_class + ' .foilCode-custom,' + foilstamp_class + ' .Code-custom').show()
    $(foilstamp_class + ' .foilColor,' + foilstamp_class + ' .foilCode').hide()
}
function setDefualtfoilstampCustom(index, process_index) {
    const foilstamp_class = '.foilstampInput[index=' + index + '][process-index=' + process_index + ']'
    $(foilstamp_class + ' .custom-foil').attr('custom', 0).css('color', 'black')
    $(foilstamp_class + ' .foilColor-custom,' + foilstamp_class + ' .foilCode-custom,' + foilstamp_class + ' .Code-custom').hide()
    $(foilstamp_class + ' .foilColor,' + foilstamp_class + ' .foilCode').show()
    $(foilstamp_class + ' .foilColor-custom,' + foilstamp_class + ' .foilCode-custom').text("")
    $(foilstamp_class + ' .foilRollWidth-custom,' + foilstamp_class + ' .foilRollLength-custom,' + foilstamp_class + ' .foilRollPrice-custom,' + foilstamp_class + ' .foilRollMinPrice-custom').val("")
    $(foilstamp_class + ' .foilColor').val("")
    $(foilstamp_class + ' .foilCode').html('<option value="">-</option>')
}

function saveCustomCorrugated() {
    const index = $('#index').val()
    const corrugated_class = '.corrugatedInput[index=' + index + ']'
    var layer = $('#corrugated-layer-custom').val()
    const flute_type = $('#flute-info-custom').val() || $('#corrugated-flute-custom').val()

    $(corrugated_class + ' .custom-corrugated').attr('custom', 1)
    $(corrugated_class + " .layerCorrugated-custom").text(layer)
    $(corrugated_class + " .fluteCorrugated-custom").text($('#corrugated-flute-custom').val())
    $(corrugated_class + " .fluteCorrugated-type").text(flute_type)
    $(corrugated_class + " .layerCorrugated-custom," + corrugated_class + " .fluteCorrugated-type").show()
    $(corrugated_class + " .layerCorrugated," + corrugated_class + " .fluteCorrugated").hide()

    $(corrugated_class + " .fluteInfo-custom").text($('#flute-info-custom').val())
    $(corrugated_class + " .thickness-custom").text($('#thickness-custom-p').val())
    $(corrugated_class + " .costCorrugated-custom").text($('#corrugated-cost-custom').val())
    $(corrugated_class + " .isPricePerSheet").val($('#corrugated-bath-sheet').is(":checked") ? 1 : 0)
    $(corrugated_class + " .fluteSide-custom").text($('#flute-side-custom').val())
    $(corrugated_class + " .cutOff-custom").text($('#cut-off-custom').val())

    var flute_layer = ""
    if (layer == 5) {
        flute_layer = 3
    }

    if (layer == 2 || layer == "") {
        var cc = `<span class="type_custom_1">${$(".type_custom1").val()}</span>
                    <span class="gram_custom_1">${$(".gram_custom1").val()}</span>
                    / 
                    <span class="type_custom_2">${$(".type_custom2").val()}</span>
                    <span class="gram_custom_2">${$(".gram_custom2").val()}</span>`
    } else {
        var cc = `<span class="type_custom_1">${$(".type_custom1").val()}</span>
                    <span class="gram_custom_1">${$(".gram_custom1").val()}</span>
                    / ${flute_layer}
                    <span class="type_custom_2">${$(".type_custom2").val()}</span>
                    <span class="gram_custom_2">${$(".gram_custom2").val()}</span>
                    /
                    <span class="type_custom_3">${$(".type_custom3").val()}</span>
                    <span class="gram_custom_3">${$(".gram_custom3").val()}</span>`
    }

    $(corrugated_class + " .corrugatedGrade").html(cc)

    managePopup('close', 'corrugated')
}

function cancelCustomCorrugated() {
    managePopup('close', 'corrugated')
}
//* END function custom spec --------------------------------------------------------------------

//* START function create SUMMARY TABLE ---------------------------------------------------------
//? for displayed Summary Table
function summary(is_forDisplay) {
    console.log("summary", is_forDisplay)
    const { is_cancel_total_profit_sharing = false } = est.mainData?.job || {}
    const check_has_delivery = est.mainData.component1?.every(comp => comp.packing?.every(packing => {
        return packing.every(obj => obj?.detail?.length > 0)

    }
        // packing?.detail?.length > 0
    )) || false

    $('#Summary,#summary').remove()

    const table = `<div id="Summary"><br/><br/><br/></div>
            <div id="summary">
                <table border cellpadding="5" align="center" id="tb_summary_1">
                    <tr head_row="1">
                        <th colspan="5" rowspan="2">Description</th>
                    </tr>
                    <tr head_row="2"></tr>
                </table>
                <br/><br/>
            </div>`;

    const trRemark = `
        <tr class="trRemark">
            <td colspan="17" class="td_remark">
                <div class="rfq_remark">
                    <label>Remark : </label>
                    <br>
                    <textarea id="rfq_remark" name="rfq_remark" rows="3" placeholder="หมายเหตุ"></textarea>
                </div>
            </td>
        </tr>
    `;

    let head1 = '',
        head2 = ''

    $('#div_bttn').before(table)

    est.mainData.qty.main.forEach((item, index) => {
        head1 += `<th>Volume</th> 
                    <th>${numeral(est.mainData.qty.totalqty[index]).format('0,0')}</th>
                    <th>${numeral(item).format('0,0')}</th>`
        head2 += `<th>Unit Price</th>
                <th>Qty</th>
                <th>Price</th>`
    })

    $('#summary table tr[head_row=1]').append(head1)
    $('#summary table tr[head_row=2]').append(head2)


    if (check_has_delivery) {
        var tr_packing = summary_packing_tr2();
    } else {
        var tr_packing = summary_packing_tr();
    }

    let summary_version = [
        summary_total_tr('MarkUp'),
        summary_total_tr('MarkDown')
    ]

    if (checkSystemVersion(est.getSystemVersion(), 3.1)) {
        summary_version = [
            summary_total_tr('MarkingPercentMaterial'),
            summary_total_tr('SubtotalPriceMaterial'),
            summary_total_tr('MarkingPercentProduction'),
            summary_total_tr('SubtotalPriceProduction'),
        ]
    }

    const checkReprintPlateCondition = est.getIsUseReprintPlate()

    $('#summary tbody').append(
        getTrSummary('paper'),
        getTrSummary('corrugated'),
        getTrSummary('special_ink'),
        getTrSummary('component_material'),
        getTrSummary('material'),
        summary_total_tr('Material'),
        getTrSummary('print_plate', 'plate'),
        checkReprintPlateCondition && getTrSummary('reprint_plate', 'reprint_plate'),
        summary_total_tr('Plate'),
        getTrSummary('print_plate', 'proof'),
        summary_total_tr('Proof'),
        getTrSummary('print_plate', 'print'),
        summary_total_tr('Print'),
        getTrSummary('coating'),
        getTrSummary('corrugated_glued'),
        getTrSummary('foilstamp'),
        getTrSummary('bossing', 'emboss'),
        getTrSummary('bossing', 'deboss'),
        getTrSummary('diecut'),
        getTrSummary('digital_diecut'),
        getTrSummary('main_process', 'chip'),
        getTrSummary('main_process', 'trim'),
        getTrSummary('main_process', 'bag'),
        getTrSummary('main_process', 'shrinkwrap'),
        getTrSummary('process', 'other'),
        getTrSummary('process', 'handwork'),
        getTrSummary('process', 'custom'),
        getTrSummary('assembly'),
        getTrSummary('main_process', 'inspection'),
        summary_total_tr('Process'),
        getTrSummary('otherCost'),
        summary_total_tr('Other'),
        tr_packing.paperband_tr,
        tr_packing.kraftwrap_tr,
        tr_packing.carton_tr,
        tr_packing.pallet_tr,
        tr_packing.delivery_tr,
        summary_total_tr('Packing'),
        summary_version?.join(''),
        summary_total_tr('Price'),
        summary_total_tr('Gift'),
        summary_total_tr('CustomerPriceDiff'),
        summary_total_tr('DiffPrice'),
        summary_total_tr('Tax'),
        is_cancel_total_profit_sharing ? '' : summary_total_tr('ProfitSharing'),
        summary_total_tr('FinalPrice'),
        summary_total_tr('UnitPrice'),
        summary_total_tr('UnitPriceExchange'),
        summary_total_tr('Exchange'),
        summary_tr_weight(is_forDisplay),
        trRemark,
    )


    $('#summary #tax input').inputmask({ regex: "^[0-9]{1,3}(\\.\\d{1,2})?$", placeholder: "" })
    $('#rfq_remark').val(est.mainData.remark)

    displayCurrencyOption()
    changeExchangeRate(est.mainData.currency_no, est.mainData.exchange_rate)
    getProfitAndLossSection()
    setEnableMarkingPercent()
    getMarkDownSection()
    setMarkDownQtySection(true)
}

function getTrSummary(tb_row, sub_proc) {
    const isMultipleF = getIsMultipleF()

    return isMultipleF ? summary_tr_for_f(tb_row, sub_proc) : summary_tr(tb_row, sub_proc)
}

function summary_tr(tb_row, sub_proc) {
    const
        mainData = est.mainData,
        comp_arr = est.mainData.component1
    var tr = ""

    const printType = mainData.job.print_type

    switch (tb_row) {
        case 'paper':
            var paperColumn_arr = [],
                paperRow_arr = [],
                num_trPaper = 0

            //* number of line 
            const numTrPaper = comp_arr?.filter(comp => comp?.component_type?.type != 3)?.length || 0

            comp_arr.forEach((item, index) => {
                let paperColumn = ''

                if (item.component_type.type != 3) {
                    item.paper_usage.line.forEach((item1, index1) => {
                        paperColumn += `
                            <td class="alRight">
                                <div class="paperRowUnitPrice" index="${index}" indexqty="${index1}">${numeral(item1.price.paper.unit_price).format('0,0.00')}</div>
                            </td>
                            <td class="alCenter">
                                <div class="paperRowQty" index="${index}" indexqty="${index1}">${numeral(item1.price.paper.qty).format('0,0')}</div>
                            </td>
                            <td class="alRight">
                                <div class="paperRowPrice" index="${index}" indexqty="${index1}">${numeral(item1.price.paper.price).format('0,0.00')}</div>
                            </td>
                        `
                    })

                    paperColumn_arr.push(paperColumn)

                    if (paperColumn_arr.length == 1) {
                        var paper_tr = `
                            <tr class="paper_tr" index=${index}>
                                <td rowspan="${numTrPaper}">Paper</td>
                                <td class="alCenter">
                                    <div class="paperRowComponentName" index=${index}>${item.component_name}</div>
                                </td>
                                <td class="alCenter">
                                    <div class="paperRowPaperType" index=${index}>${item.paper.paper_name}</div>
                                </td>
                                <td colspan="2" class="alCenter">
                                    <div class="paperRowPaperGram" index=${index}>${item.paper.paper_gram} gsm</div>
                                </td>
                            `

                    } else {
                        var paper_tr = `
                            <tr class="paper_tr" index=${index}>
                                <td class="alCenter">
                                    <div class="paperRowComponentName" index=${index}>${item.component_name}</div>
                                </td>
                                <td class="alCenter">
                                    <div class="paperRowPaperType" index=${index}>${item.paper.paper_name}</div>
                                </td>
                                <td colspan="2" class="alCenter">
                                    <div class="paperRowPaperGram" index=${index}>${item.paper.paper_gram} gsm</div>
                                </td>
                        `

                    }

                    paperRow_arr.push(paper_tr)
                }
            })

            if (paperColumn_arr.length != 0) {
                paperColumn_arr.forEach((item, index) => {
                    tr += paperRow_arr[index] + item + `</tr>`
                })
            }

            break
        case 'corrugated':
            comp_arr.forEach((item, index) => {

                let is_price_per_sheet = item?.corrugated_layer?.info?.is_price_per_sheet || false

                var corrugatedColumn1,
                    corrugatedColumn2

                if (item.corrugated_layer) {
                    item.corrugated_layer.price.forEach((item1, index1) => {
                        corrugatedColumn1 += `<td class="alRight"><div class="corugatedRowUnitPrice" index="${index}" indexqty="${index1}">${numeral(item1.unit_price).format('0,0.00')}</div></td>
                                        <td class="alCenter"><div class="corugatedRowQty" index="${index}" indexqty="${index1}">${numeral(item1.qty).format('0,0')}</div></td>
                                        <td class="alRight"><div class="corugatedRowPrice" index="${index}" indexqty="${index1}">${numeral(item1.price).format('0,0.00')}</div></td>`
                        corrugatedColumn2 += `<td colspan="3" rowspan="3">`
                    })
                    tr += `<tr class="corrugated_tr" index="${index}">
                            <td>Corrugated Board</td>
                            <td class="alCenter"><div class="corrugatedRowComponentName" index="${index}">${item.component_name}</div></td>
                            <td class="alCenter"><div class="corrugatedRowFlute" index="${index}">ลอน ${item.corrugated_layer.info.flute_type} ${item.corrugated_layer.info?.fluteInfo_custom || ''} ${item.corrugated_layer.info.num_layer} ชั้น</div></td>
                            <td colspan="2" class="alCenter"><div class="corrugatedRowName" index="${index}">${item.corrugated_layer.info.name}</div></td>
                            ${corrugatedColumn1}
                        </tr>
                        <tr class="corrugated_tr" index="${index}">
                            <td colspan="2" class="alCenter"><div>ลอนขนานด้าน x Cut off</div></td>
                            <td class="alCenter" colspan="3">ราคาลูกฟูกต่อแผ่น</td>
                            ${corrugatedColumn2}
                        </tr>
                        <tr class="corrugated_tr" index="${index}">
                            <td colspan="2" class="alCenter"><div class="corrugatedRowSize" index="${index}">${item.corrugated_layer.info.flute_side} x ${item.corrugated_layer.info.cut_off}</div></td>
                            <td class="alCenter" colspan="3"><div class="corrugatedRowUnit" index="${index}">${numeral(Math.max(...item.corrugated_layer.info.unit_price)).format('0,0.00')}</div></td>
                        </tr>
                        <tr class="corrugated_tr" index="${index}">
                            <td class="alCenter"><div>ราคาทุน</div></td>
                            <td class="alCenter"><div class="corrugatedRowCost" index="${index}">${numeral(Math.max(...item.corrugated_layer.info.cost)).format('0,0.00')}</div></td>
                            <td class="alCenter"><div>${is_price_per_sheet ? 'B/Sheet' : 'B/ตร.ฟุต'}</div></td>
                            ${is_price_per_sheet ? `
                                <td colspan='2'></td>
                                ` :
                            `<td class="alCenter"><div class="corrugatedRowUnitInch" index="${index}">${numeral(Math.max(...item.corrugated_layer.info.unit_inch)).format('0,0.0000')}</div></td>
                                <td class="alCenter"><div>B/ตร.นิ้ว</div></td>`
                        }
                        </tr>`
                }
            })
            break
        case 'special_ink':
            let countSpeInk = 0
            comp_arr.forEach((item, compIndex) => {
                if (![null, undefined].includes(item?.color)) {
                    const speInkTr = comp_arr?.reduce((sumtr, comp) => sumtr += comp?.color?.reduce((total, curr) => total += curr?.special_ink?.length || 0, 0), 0)

                    item?.color?.forEach((color, colorIndex) => {
                        const { special_ink } = color || {}

                        special_ink?.forEach((specialInk, specialInkIndex) => {

                            var special_ink_column = ""
                            specialInk?.line?.forEach((line, lineIndex) => {

                                special_ink_column += `
                                        <td class="alRight">
                                            <div class="specialInkRowUnitPrice" index="${compIndex}" indexqty="${0}">${numeral(line.unit_price).format('0,0.00')}</div>
                                        </td>
                                        <td class="alCenter">
                                            <div class="specialInkRowQty" index="${compIndex}" indexqty="${0}">${numeral(line.qty).format('0,0')}</div>
                                        </td>
                                        <td class="alRight">
                                            <div class="specialInkRowPrice" index="${compIndex}" indexqty="${0}">${numeral(line.price).format('0,0.00')}</div>
                                        </td>
                                    `
                            })

                            if (countSpeInk == 0 && colorIndex == 0 && specialInkIndex == 0) {
                                tr += `<tr class="special_ink_tr" index="${compIndex}">
                                    <td rowspan="${speInkTr}">Special Ink</td>
                                    <td class="alCenter">
                                        <div class="paperRowComponentName" index=${compIndex}>${item.component_name}</div>
                                    </td>
                                    <td colspan="3">${specialInk.name} : ${specialInk.info.ink_name}</td>
                                    ${special_ink_column}
                                </tr>`
                                countSpeInk++
                            } else {
                                tr += `<tr class="special_ink_tr" index="${compIndex}">
                                        <td class="alCenter">
                                        <div class="paperRowComponentName" index=${compIndex}>${item.component_name}</div>
                                    </td>
                                    <td colspan="3">${specialInk.name} : ${specialInk.info.ink_name}</td>
                                    ${special_ink_column}
                                </tr>`
                            }
                        })

                    })
                }


            })
            break
        case 'component_material':
            mainData?.component1?.forEach((comp, cIndex) => {
                comp?.process?.filter(obj => obj?.type === 'material')?.forEach((item, index) => {
                    var material_column = ""
                    item.line.forEach((item1, index1) => {
                        material_column += `<td class="alRight"><div class="materialUnitPrice" index="${index}" indexqty="${index1}">${numeral(item1.unit_price).format('0,0.00')}</div></td>
                                      <td class="alCenter"><div class="materialRowQty" index="${index}" indexqty="${index1}">${numeral(item1.qty).format('0,0.00')}</div></td>
                                      <td class="alRight"><div class="materialRowPrice" index="${index}" indexqty="${index1}">${numeral(item1.price).format('0,0.00')}</div></td>`
                    })
                    tr += `<tr class="material_tr" index=${index}">
                        <td colspan="2" >${item?.info?.component_info?.component_name}</td>
                        <td colspan="3" >${item?.info?.process_name}</td>
                        ${material_column}
                    </tr>`
                })
            })
            break
        case 'material':
            mainData.material.forEach((item, index) => {
                var material_column = ""
                item.line.forEach((item1, index1) => {
                    material_column += `<td class="alRight"><div class="materialUnitPrice" index="${index}" indexqty="${index1}">${numeral(item1.unit_price).format('0,0.00')}</div></td>
                                      <td class="alCenter"><div class="materialRowQty" index="${index}" indexqty="${index1}">${numeral(item1.qty).format('0,0.00')}</div></td>
                                      <td class="alRight"><div class="materialRowPrice" index="${index}" indexqty="${index1}">${numeral(item1.price).format('0,0.00')}</div></td>`
                })
                tr += `<tr class="material_tr" index=${index}">
                        <td colspan="5" >${item.name}</td>
                        ${material_column}
                    </tr>`
            })
            break
        case 'print_plate':
            if (sub_proc == 'plate') {
                if (printType == 'Offset') {
                    var proc_label = 'Plate', color_label = 'cols'
                } else if (printType == 'Flexo') {
                    var proc_label = 'Plate Polymer (' + mainData.job.flexo_size[0] + ' x ' + mainData.job.flexo_size[1] + ' in²)',
                        color_label = 'cols'
                } else {
                    var proc_label = 'Plate'
                    var color_label = 'cols'
                }

            } else if (sub_proc == 'proof') {
                if (['Jet Press', 'Konica']?.includes(printType)) {
                    var proc_label = 'Proof'
                    var color_label = 'cols'
                }
            } else {
                if (printType == 'Offset') {
                    var proc_label = 'Print'
                    if (mainData.job.ink_type == 'UV') {
                        var color_label = 'cols UV'
                    } else {
                        var color_label = 'cols'
                    }
                } else if (printType == 'Flexo') {
                    var proc_label = 'Print Flexo'
                    var color_label = 'cols'
                } else {
                    var proc_label = 'Print'
                    var color_label = 'cols'
                }
            }

            comp_arr.forEach((item, index) => {
                var column_outside, column_inside

                if (!['Jet Press']?.includes(printType) && !(printType == 'Konica' && sub_proc == 'plate')) { //* Offset , Flexo , Konica ( Only print )
                    if (['plate', 'print'].includes(sub_proc)) {
                        var machine_size = item.machine.machine_size.name
                        item.paper_usage.line.forEach((item1, index1) => {
                            if (sub_proc == 'plate') {
                                var proc = item1.price.plate
                            } else {
                                var proc = item1.price.print
                            }

                            column_outside += `<td class="alRight"><div class="${sub_proc}RowUnitPrice" index="${index}" indexqty="${index1}">${numeral(proc.outside.unit_price).format('0,0.00')}</div></td>
                            <td class="alCenter"><div class="${sub_proc}RowQty" index="{index}" indexqty="${index1}">${numeral(proc.outside.qty).format('0,0')}</div></td>
                            <td class="alRight"><div class="${sub_proc}RowPrice" index="{index}" indexqty="${index1}">${numeral(proc.outside.price).format('0,0.00')}</div></td>`
                            column_inside += `<td class="alRight"><div class="${sub_proc}RowUnitPrice" index="${index}" indexqty="${index1}">${numeral(proc.inside.unit_price).format('0,0.00')}</div></td>
                            <td class="alCenter"><div class="${sub_proc}RowQty" index="{index}" indexqty="${index1}">${numeral(proc.inside.qty).format('0,0')}</div></td>
                            <td class="alRight"><div class="${sub_proc}RowPrice" index="{index}" indexqty="${index1}">${numeral(proc.inside.price).format('0,0.00')}</div></td>`
                        })

                        if (index == 0) {
                            tr += `<tr index=${index} class="${sub_proc}Outside_tr">
                                <td rowspan="${comp_arr.length * 2}">${proc_label}</td>
                                <td class="alLeft"><div class="${sub_proc}RowOutside" index="${index}">${item.component_name} Outside</div></td>
                                <td class="alCenter"><div class="${sub_proc}RowColOutside" index="${index}">${item.color[0].outside} ${color_label}</div></td>
                                <td colspan="2" class="alCenter"><div class="${sub_proc}CutOutside" index="${index}"">${machine_size}</div></td>
                                ${column_outside}
                            </tr>
                            <tr index=${index} class="${sub_proc}Inside_tr">
                                <td class="alLeft"><div class="${sub_proc}RowInside" index="${index}">${item.component_name} Inside</div></td>
                                <td class="alCenter"><div class="${sub_proc}RowColInside" index="${index}">${item.color[0].inside} ${color_label}</div></td>
                                <td colspan="2" class="alCenter"><div class="${sub_proc}CutInside" index="${index}">${machine_size}</div></td>
                                ${column_inside}
                            </tr>`
                        } else {
                            tr += `<tr index=${index} class="${sub_proc}Outside_tr">
                                <td class="alLeft"><div class="${sub_proc}RowOutside" index="${index}">${item.component_name} Outside</div></td>
                                <td class="alCenter"><div class="${sub_proc}RowColOutside" index="${index}">${item.color[0].outside} ${color_label}</div></td>
                                <td colspan="2" class="alCenter"><div class="${sub_proc}CutOutside" index="${index}">${machine_size}</div></td>
                                ${column_outside}
                            </tr>
                            <tr index=${index} class="${sub_proc}Inside_tr">
                                <td class="alLeft"><div class="${sub_proc}RowInside" index="${index}">${item.component_name} Inside</div></td>
                                <td class="alCenter"><div class="${sub_proc}RowColInside" index="${index}">${item.color[0].inside} ${color_label}</div></td>
                                <td colspan="2" class="alCenter"><div class="${sub_proc}CutInside" index="${index}">${machine_size}</div></td>
                                ${column_inside}
                            </tr>`
                        }
                    }
                }

                if (['Jet Press', 'Konica']?.includes(printType) && !(printType == 'Konica' && sub_proc == 'print')) { //* Jet Press and Konica (ONly proof)
                    if (['proof', 'print'].includes(sub_proc)) {
                        let colorLabel = `${item.color[0]?.outside ? 4 : 0}/${item.color[0]?.inside ? 4 : 0} ${color_label}`
                        var machine_size = printType,
                            column_all = ''

                        item.paper_usage.line.forEach((item1, index1) => {
                            if (sub_proc == 'proof') {
                                var proc = item1.price.proof
                            } else {
                                var proc = item1.price.print
                            }


                            column_all += `<td class="alRight"><div class="${sub_proc}RowUnitPrice" index="${index}" indexqty="${index1}">${numeral(proc.all.unit_price).format('0,0.00')}</div></td>
                                <td class="alCenter"><div class="${sub_proc}RowQty" index="${index}" indexqty="${index1}">${numeral(proc.all.qty).format('0,0')}</div></td>
                                <td class="alRight"><div class="${sub_proc}RowPrice" index="${index}" indexqty="${index1}">${numeral(proc.all.price).format('0,0.00')}</div></td>`
                        })

                        if (index == 0) {
                            if (sub_proc == 'proof') {
                                tr += `<tr index=${index} class="${sub_proc}Allside_tr">
                                    <td rowspan="${comp_arr.length}">${proc_label}</td>
                                    <td class="alCenter" colspan="4"><div class="${sub_proc}RowAll" index="${index}">${item.component_name}</div></td>
                                    ${column_all}
                                </tr>`
                            } else { //* print
                                tr += `<tr index=${index} class="${sub_proc}Allside_tr">
                                    <td rowspan="${comp_arr.length}">${proc_label}</td>
                                    <td class="alCenter"><div class="${sub_proc}RowAll" index="${index}">${colorLabel}</div></td>
                                    <td class="alCenter" colspan="3"><div class="${sub_proc}RowAll" index="${index}">${item.component_name}</div></td>
                                    ${column_all}
                                </tr>`
                            }

                        } else {
                            if (sub_proc == 'proof') {
                                tr += `<tr index=${index} class="${sub_proc}Allside_tr">
                                        <td class="alCenter" colspan="4"><div class="${sub_proc}RowAll" index="${index}">${item.component_name}</div></td>
                                        ${column_all}
                                    </tr>`
                            } else {
                                tr += `<tr index=${index} class="${sub_proc}Allside_tr">
                                        <td class="alCenter"><div class="${sub_proc}RowAll" index="${index}">${colorLabel}</div></td>
                                        <td class="alCenter" colspan="3"><div class="${sub_proc}RowAll" index="${index}">${item.component_name}</div></td>
                                        ${column_all}
                                    </tr>`
                            }
                        }
                    }
                }
            })
            break
        case 'reprint_plate':
            if (printType != 'Offset') return ''
            var proc_label = 'Plate (สำรอง)', color_label = 'cols'

            comp_arr.forEach((item, index) => {
                var column_outside, column_inside

                var machine_size = item.machine.machine_size.name
                item.paper_usage.line.forEach((item1, index1) => {
                    var proc = item1.price.plate?.reprint

                    column_outside += `<td class="alRight"><div class="${sub_proc}RowUnitPrice" index="${index}" indexqty="${index1}">${numeral(proc.outside.unit_price).format('0,0.00')}</div></td>
                            <td class="alCenter"><div class="${sub_proc}RowQty" index="{index}" indexqty="${index1}">${numeral(proc.outside.qty).format('0,0')}</div></td>
                            <td class="alRight"><div class="${sub_proc}RowPrice" index="{index}" indexqty="${index1}">${numeral(proc.outside.price).format('0,0.00')}</div></td>`
                    column_inside += `<td class="alRight"><div class="${sub_proc}RowUnitPrice" index="${index}" indexqty="${index1}">${numeral(proc.inside.unit_price).format('0,0.00')}</div></td>
                            <td class="alCenter"><div class="${sub_proc}RowQty" index="{index}" indexqty="${index1}">${numeral(proc.inside.qty).format('0,0')}</div></td>
                            <td class="alRight"><div class="${sub_proc}RowPrice" index="{index}" indexqty="${index1}">${numeral(proc.inside.price).format('0,0.00')}</div></td>`
                })

                if (index == 0) {
                    tr += `<tr index=${index} class="${sub_proc}Outside_tr">
                                <td rowspan="${comp_arr.length * 2}">${proc_label}</td>
                                <td class="alLeft"><div class="${sub_proc}RowOutside" index="${index}">${item.component_name} Outside</div></td>
                                <td class="alCenter"><div class="${sub_proc}RowColOutside" index="${index}">${item.color[0].outside} ${color_label}</div></td>
                                <td colspan="2" class="alCenter"><div class="${sub_proc}CutOutside" index="${index}"">${machine_size}</div></td>
                                ${column_outside}
                            </tr>
                            <tr index=${index} class="${sub_proc}Inside_tr">
                                <td class="alLeft"><div class="${sub_proc}RowInside" index="${index}">${item.component_name} Inside</div></td>
                                <td class="alCenter"><div class="${sub_proc}RowColInside" index="${index}">${item.color[0].inside} ${color_label}</div></td>
                                <td colspan="2" class="alCenter"><div class="${sub_proc}CutInside" index="${index}">${machine_size}</div></td>
                                ${column_inside}
                            </tr>`
                } else {
                    tr += `<tr index=${index} class="${sub_proc}Outside_tr">
                                <td class="alLeft"><div class="${sub_proc}RowOutside" index="${index}">${item.component_name} Outside</div></td>
                                <td class="alCenter"><div class="${sub_proc}RowColOutside" index="${index}">${item.color[0].outside} ${color_label}</div></td>
                                <td colspan="2" class="alCenter"><div class="${sub_proc}CutOutside" index="${index}">${machine_size}</div></td>
                                ${column_outside}
                            </tr>
                            <tr index=${index} class="${sub_proc}Inside_tr">
                                <td class="alLeft"><div class="${sub_proc}RowInside" index="${index}">${item.component_name} Inside</div></td>
                                <td class="alCenter"><div class="${sub_proc}RowColInside" index="${index}">${item.color[0].inside} ${color_label}</div></td>
                                <td colspan="2" class="alCenter"><div class="${sub_proc}CutInside" index="${index}">${machine_size}</div></td>
                                ${column_inside}
                            </tr>`
                }
            })
            break
        case 'coating':
            var coatingColumn_arr = [], coatingRow_arr = [], num_trCoating = 0
            comp_arr.forEach((item) => {
                item.addon.forEach((item1) => {
                    if (item1.type == 'coating') {
                        num_trCoating += 1
                    }
                })
            })
            comp_arr.forEach((item, index) => {
                item.addon.forEach((item1) => {
                    var coatingColumn = ""
                    if (item1.info.name == 'Other') {
                        var coating_option = ""
                    } else { var coating_option = item1.info.name }
                    if (item1.type == 'coating') {
                        item1.line.forEach((item2, index2) => {
                            coatingColumn += `<td class="alRight"><div class="coatingRowUnitPrice" index="${index}" indexqty="${index2}">${numeral(item2.unit_price).format('0,0.00')}</div></td>
                                    <td class="alCenter"><div class="coatingRowQty" index="${index}" indexqty="${index2}">${numeral(item2.qty).format('0,0')}</div></td>
                                    <td class="alRight"><div class="coatingRowPrice" index="${index}" indexqty="${index2}">${numeral(item2.price).format('0,0.00')}</div></td>`
                        })
                        coatingColumn_arr.push(coatingColumn)
                        if (['S-UV', 'S-UV-S'].includes(item1.info.code)) {
                            // if (item1.info.code == 'S-UV') {
                            var size_label = "(" + item1.info.width + " x " + item1.info.length + " in²)"
                        } else if (item1.info?.code == 'P-PAT') {
                            var size_label = `(เบอร์ ${item1?.info?.number})`
                        } else {
                            var size_label = ""
                        }
                        if (coatingColumn_arr.length == 1) {
                            var coating_tr = `<tr class='coating_tr' index="${index}">
                                <td rowspan="${num_trCoating}">Coating</td>
                                <td class="alLeft"><div class="coatingRowComponentName" index="${index}">${item.component_name}</div></td>
                                <td colspan="3" class="alLeft"><div class="coatingRowCoatingType" index="${index}">${coating_option} ${item1.info.type} ${item1.info.side} s ${size_label}</div></td>`
                        } else {
                            var coating_tr = `<tr>
                                <td class="alLeft"><div class="coatingRowComponentName" index="${index}">${item.component_name}</div></td>
                                <td colspan="3" class="alLeft"><div class="coatingRowCoatingType" index="${index}">${coating_option} ${item1.info.type} ${item1.info.side} s ${size_label}</div></td>`
                        }
                        coatingRow_arr.push(coating_tr)
                    }
                })
            })
            if (coatingColumn_arr.length != 0) {
                coatingColumn_arr.forEach((item, index) => {
                    tr += coatingRow_arr[index] + item + `</tr>`
                })
            }
            break
        case 'foilstamp':
            comp_arr.forEach((component, compIndex) => { //* loop components.
                const { material_price_marking = 0 } = defaultData || {}
                const foilstampAddon = component.addon.filter(obj => obj.type === 'foilstamp')
                const num_process = []

                foilstampAddon.forEach((addon, index) => {
                    const process_index = addon?.info?.process_index >= 0 ? addon?.info?.process_index : index
                    if (!num_process.includes(process_index)) {
                        num_process.push(process_index)
                    }
                })


                //* ได้เลขกรอบทั้งหมดของ foilstamp
                num_process.forEach(process_id => { //* foilstamp แต่ละกรอบ
                    let trBlock = ``,
                        trRoll = ``,
                        trStamp = ``
                    //* หา process_id จาก addon list ที่ตรงกัน
                    const foilstampSize = foilstampAddon.filter((addon, a_index) => addon?.info?.process_index >= 0 ? addon?.info?.process_index === process_id : a_index === process_id)
                    const summary = {
                        foilRoll: [],
                        foilStamp: []
                    }

                    // if(foilstampSize.length > 1){
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
                    // }

                    foilstampSize.forEach((size, sizeIndex) => { //* foilstamp size แต่ละกรอบ [x*y , x*y]
                        const { line, info: { foil_roll_min_price = 0 } } = size

                        let blockStampColumn = ""


                        line.forEach((qtyDetail, qtyIndex) => {
                            const { labor, block, foil_roll } = qtyDetail

                            blockStampColumn += `<td class="alRight"><div class="blockStampRowUnitPrice" index="${process_id}" sizeIndex="${sizeIndex}" indexqty="${qtyIndex}">${numeral(block.unit_price).format('0,0.00')}</div></td>
                                <td class="alCenter"><div class="blockStampRowQty" index="${process_id}" sizeIndex="${sizeIndex}" indexqty="${qtyIndex}">${numeral(block.qty).format('0,0')}</div></td>
                                <td class="alRight"><div class="blockStampRowPrice" index="${process_id}" sizeIndex="${sizeIndex}" indexqty="${qtyIndex}">${numeral(block.price).format('0,0.00')}</div></td>`

                            summary.foilRoll[qtyIndex].unit_price += foil_roll.unit_price
                            summary.foilRoll[qtyIndex].qty = foil_roll.qty
                            summary.foilRoll[qtyIndex].price += foil_roll.qty * foil_roll.unit_price

                            //* คิดค่า stamp ครั้งเดียว
                            summary.foilStamp[qtyIndex].unit_price = labor.unit_price
                            summary.foilStamp[qtyIndex].qty = labor.qty
                            summary.foilStamp[qtyIndex].price = labor.price
                        })

                        //* แต่ละกรอบมีค่า Block ตามจำนวน size
                        trBlock += `<tr class='foilStamp_tr' index="${process_id}" sizeIndex="${sizeIndex}">
                            <td>Block Foil  Stamp</td>
                            <td colspan="2" style="text-align:center"><div class="foilRowComponentName" index="${process_id}" sizeIndex="${sizeIndex}" >${component.component_name}</div></td>
                            <td colspan="2" style="text-align:center"><div class="foilRowArea" index="${process_id}" sizeIndex="${sizeIndex}" >Area (in²) : ${size.info.width} x ${size.info.length}</div></td>
                            ${blockStampColumn}
                        </tr>`
                    })

                    //* check min price
                    foilstampSize.forEach((size, sizeIndex) => {
                        const { line, info: { foil_roll_min_price = 0 } } = size

                        let roll_min_price = parseFloat((foil_roll_min_price * (1 + (material_price_marking / 100))).toFixed(2))

                        line.forEach((qtyDetail, qtyIndex) => {
                            summary.foilRoll[qtyIndex].price = summary.foilRoll[qtyIndex].price < foil_roll_min_price ? roll_min_price : summary.foilRoll[qtyIndex].price
                        })
                    })

                    let foilRollColumn = "",
                        foilStampColumn = ""

                    est.mainData.qty.totalqty.map((qty, qtyIndex) => {
                        foilRollColumn += `<td class="alRight"><div class="foilRollRowUnitPrice" index="${index}" indexqty="${qtyIndex}">${numeral(summary.foilRoll[qtyIndex].unit_price).format('0,0.0000')}</div></td>
                            <td class="alCenter"><div class="foilRollRowQty" index="${index}" indexqty="${qtyIndex}">${numeral(summary.foilRoll[qtyIndex].qty).format('0,0')}</div></td>
                            <td class="alRight"><div class="foilRollRowPrice" index="${index}" indexqty="${qtyIndex}">${numeral(summary.foilRoll[qtyIndex].price).format('0,0.00')}</div></td>`

                        foilStampColumn += `<td class="alRight"><div class="foilStampRowUnitPrice" index="${index}" indexqty="${qtyIndex}">${numeral(summary.foilStamp[qtyIndex].unit_price).format('0,0.00000')}</div></td>
                            <td class="alCenter"><div class="foilStampRowQty" index="${index}" indexqty="${qtyIndex}">${numeral(summary.foilStamp[qtyIndex].qty).format('0,0')}</div></td>
                            <td class="alRight"><div class="foilStampRowPrice" index="${index}" indexqty="${qtyIndex}">${numeral(summary.foilStamp[qtyIndex].price).format('0,0.00')}</div></td>`
                    })

                    //* แต่ละกรอบมีการสรุปข้อมูล Roll , Stamp กรอบละ 1 แถว
                    trRoll += `<tr class='foilStamp_tr' index="${process_id}">
                        <td colspan="3"><div class="foilRowRollWidth" index="${process_id}">Foil หน้าม้วน  ${foilstampSize[0].info.foil_width}" ความยาว ${foilstampSize[0].info.foil_length} ft </td>
                        <td colspan="2" class="alCenter"><div class="foilRowCode" index="${process_id}">สี${foilstampSize[0].info.color_th} ${foilstampSize[0].info.code}</div></td>
                        ${foilRollColumn}
                    </tr>`

                    trStamp += `<tr class='foilStamp_tr' index="${process_id}">
                        <td colspan="3">Foil Stamp</td>
                        <td colspan="2" class="alRight"></td>
                        ${foilStampColumn}
                    </tr>`

                    tr += trBlock + trRoll + trStamp

                }) //* END foilstamp แต่ละกรอบ

            })
            break
        case 'bossing':

            // const bossing = comp_arr?.map(comp => comp?.addon?.filter(addon => addon.type == sub_proc))

            if (sub_proc == 'emboss') {
                var proc_label = "Block Emboss", sub_proc_upper = "Emboss"
            } else {
                var proc_label = "Block Deboss", sub_proc_upper = "Deboss"
            }

            comp_arr.forEach((item, index) => {
                const bossing = item?.addon?.filter(addon => addon.type == sub_proc)
                //     item.addon.forEach((item1,) => {
                //         if (item1.type == sub_proc) {
                bossing?.forEach(addon => {

                    let blockTr = "",
                        bossingTr = ""

                    let blockColumn = [],
                        bossingColumn = []

                    let block = []

                    //* BLOCK COST
                    addon.line?.block?.forEach((block, bIndex) => {
                        blockColumn = ''

                        blockTr += `
                            <tr class="${sub_proc}_tr">
                                <td>${proc_label}</td>
                                <td colspan="2" class="alCenter"><div class="${sub_proc}RowComponentName">${item.component_name}</div></td>
                                <td colspan="2" class="alCenter"><div class="${sub_proc}RowArea">Area (in²) : ${block.size[0]} x ${block.size[1]}</div></td>
                                
                        `

                        block?.line?.forEach((line, lIndex) => {
                            blockColumn += `
                                <td class="alRight">
                                    <div class="block${sub_proc_upper}RowUnitPrice" indexqty="${lIndex}">${numeral(line.unit_price).format('0,0.00')}</div>
                                </td>
                                <td class="alCenter">
                                    <div class="block${sub_proc_upper}RowQty" indexqty="${lIndex}">${numeral(line.qty).format('0,0')}</div>
                                </td>
                                <td class="alRight">
                                    <div class="block${sub_proc_upper}RowPrice" indexqty="${lIndex}">${numeral(line.price).format('0,0.00')}</div>
                                </td>
                            `
                        })

                        blockTr += `
                            ${blockColumn}
                        </tr>
                        `
                    })

                    //*LABOR
                    bossingTr += `
                    <tr class="${sub_proc}_tr">
                        <td colspan="3">${sub_proc_upper}</td>
                        <td colspan="2" class="alCenter"></td>
                    `

                    addon.line?.labor?.forEach((price, pIndex) => {

                        bossingColumn += `
                            <td class="alRight">
                                <div class="block${sub_proc_upper}RowUnitPrice" indexqty="${pIndex}">${numeral(price.unit_price).format('0,0.00000')}</div>
                            </td>
                            <td class="alCenter">
                                <div class="block${sub_proc_upper}RowQty" indexqty="${pIndex}">${numeral(price.qty).format('0,0')}</div>
                            </td>
                            <td class="alRight">
                                <div class="block${sub_proc_upper}RowPrice" indexqty="${pIndex}">${numeral(price.price).format('0,0.00')}</div>
                            </td>
                        `

                    })

                    bossingTr += `
                        ${bossingColumn}
                        </tr>
                    `

                    tr += blockTr
                    tr += bossingTr
                })

            }) //* Component

            break
        case 'diecut':
            var diecutColumn_arr = [], blockColumn_arr = [], diecutRow_arr = [], blockRow_arr = []
            if (mainData.job.is_reprinted) {
                var block_label = 'Block Diecut (Reprint)'
            } else {
                var block_label = 'Block Diecut'
            }

            const num_tr = comp_arr?.reduce((total, curr) => total += curr?.process?.filter((item) => item.name == 'diecut')?.length || 0, 0)

            comp_arr.forEach((item) => {

                item.process.forEach((item1, index1) => {
                    if (item1.name == 'diecut') {
                        var diecutColumn = "", blockColumn = ""
                        item1.line.forEach((item2, index2) => {
                            blockColumn += `<td class="alRight"><div class="blockDiecutRowUnitPrice" index="${index1}" indexqty="${index2}">${numeral(item2.block.unit_price).format('0,0.00')}</div></td>
                                        <td class="alCenter"><div class="blockDiecutRowQty" index="${index1}" indexqty="${index2}">${numeral(item2.block.qty).format('0,0')}</div></td>
                                        <td class="alRight"><div class="blockDiecutRowPrice" index="${index1}" indexqty="${index2}">${numeral(item2.block.price).format('0,0.00')}</div></td>`
                            diecutColumn += `<td class="alRight"><div class="diecutRowUnitPrice" index="${index1}" indexqty="${index2}">${numeral(item2.labor.unit_price).format('0,0.00000')}</div></td>
                                        <td class="alCenter"><div class="diecutRowQty" index="${index1}" indexqty="${index2}">${numeral(item2.labor.qty).format('0,0')}</div></td>
                                        <td class="alRight"><div class="diecutRowPrice" index="${index1}" indexqty="${index2}">${numeral(item2.labor.price).format('0,0.00')}</div></td>`
                        })
                        diecutColumn_arr.push(diecutColumn)
                        blockColumn_arr.push(blockColumn)

                        if (blockColumn_arr.length == 1) {
                            var blockRow = `<tr index="${index1}" class="diecut_tr">
                                    <td colspan="3" rowspan="${num_tr}">${block_label}</td>
                                    <td colspan="2" class="alCenter"><div class="diecutRowComponentName" index="${index1}">${item.component_name}</div></td>`
                            var diecutRow = `<tr>
                                    <td colspan="3" rowspan="${num_tr}">Diecut</td>
                                    <td colspan="2" class="alCenter"><div class="diecutRowComponentName" index="${index1}">${item.component_name}</div></td>`
                        } else {
                            var blockRow = `<tr index="${index1}" class="diecut_tr">
                                        <td colspan="2" class="alCenter"><div class="diecutRowComponentName" index="${index1}">${item.component_name}</div></td>`
                            var diecutRow = `<tr>
                                        <td colspan="2" class="alCenter"><div class="diecutRowComponentName" index="${index1}">${item.component_name}</div></td>`
                        }
                        diecutRow_arr.push(diecutRow)
                        blockRow_arr.push(blockRow)
                    }
                })
            })
            if (blockColumn_arr.length != 0) {
                blockColumn_arr.forEach((item, index) => {
                    tr += blockRow_arr[index] + item + `</tr>`
                })
            }
            if (diecutColumn_arr.length != 0) {
                diecutColumn_arr.forEach((item, index) => {
                    tr += diecutRow_arr[index] + item + `</tr>`
                })
            }
            break
        case 'main_process':
            switch (sub_proc) {
                case 'chip':
                    var proc_label = "แกะ"
                    break
                case 'inspection':
                    var proc_label = "Inspection"
                    break
                case 'trim':
                    var proc_label = "Trim"
                    break
                case 'shrinkwrap':
                    var proc_label = "Shrinkwrap"
                    break
                case 'digital_diecut':
                    var proc_label = "Digital Diecut"
                    break
            }
            mainData.process.forEach((item) => {
                if (item.name == sub_proc) {
                    var Column = ""
                    item.line.forEach((item1, index1) => {
                        Column += `<td class="alRight"><div class="${sub_proc}RowUnitPrice" indexqty="${index1}">${numeral(item1.unit_price).format('0,0.00')}</div></td>
                                    <td class="alCenter"><div class="${sub_proc}RowQty" indexqty="${index1}">${numeral(item1.qty).format('0,0')}</div></td>
                                    <td class="alRight"><div class="${sub_proc}RowPrice" indexqty="${index1}">${numeral(item1.price).format('0,0.00')}</div></td>`
                    })
                    tr = `<tr class="${sub_proc}_tr">
                            <td colspan="5">${proc_label}</td>
                            ${Column}
                        </tr>`
                }
            })
            break
        case 'digital_diecut':
            var digitalDiecutColumn_arr = [], digitalDiecutRow_arr = [], num_trDigitalDiecut = 0
            comp_arr.forEach((item,) => {
                item.process.forEach((item1,) => {
                    if (item1.name == 'digital_diecut') {
                        num_trDigitalDiecut += 1
                    }
                })
            })
            comp_arr.forEach((item, index) => {
                item.process.forEach((item1) => {
                    var digitalDiecutColumn = ""
                    if (item1.name == 'digital_diecut') {
                        item1.line.forEach((item2, index2) => {
                            digitalDiecutColumn += `<td class="alRight"><div class="digitalDiecutRowUnitprice" index="${index}" indexqty="${index2}">${numeral(item2.unit_price).format('0,0.00')}</div></td>
                                    <td class="alCenter"><div class="digitalDiecutRowQty" index="${index}" indexqty="${index2}">${numeral(item2.qty).format('0,0')}</div></td>
                                    <td class="alRight"><div class="digitalDiecutRowprice" index="${index}" indexqty="${index2}">${numeral(item2.price).format('0,0.00')}</div></td>`
                        })
                        digitalDiecutColumn_arr.push(digitalDiecutColumn)
                        if (digitalDiecutColumn_arr.length == 1) {
                            var corrugated_tr = `<tr class="digitalDiecut_tr" index="${index}" >
                                <td rowspan="${num_trDigitalDiecut}" >Digital Diecut</td>
                                <td colspan="2" class="alCenter"><div class="digitalDiecutRowComponentName" index="${index}">${item.component_name}</div></td>
                                <td colspan="2" class="alCenter"><div class="digitalDiecutRowComponentName" index="${index}"></div></td>
                                `
                        } else {
                            var corrugated_tr = `<tr class="digitalDiecut_tr" index="${index}">
                                <td colspan="2" class="alCenter"><div class="digitalDiecutRowComponentName" index="${index}">${item.component_name}</div></td>
                                <td colspan="2" class="alCenter"><div class="digitalDiecutRowComponentName" index="${index}"></div></td>
                                `
                        }
                        digitalDiecutRow_arr.push(corrugated_tr)
                    }
                })
            })
            if (digitalDiecutColumn_arr.length != 0) {
                digitalDiecutColumn_arr.forEach((item, index) => {
                    tr += digitalDiecutRow_arr[index] + item + `</tr>`
                })
            }
            break
        case 'corrugated_glued':
            var corrugatedGluedColumn_arr = [], corrugatedGluedRow_arr = [], num_trCorrugatedGlued = 0
            comp_arr.forEach((item,) => {
                item.process.forEach((item1,) => {
                    if (item1.name == 'corrugated_glued') {
                        num_trCorrugatedGlued += 1
                    }
                })
            })
            comp_arr.forEach((item, index) => {
                item.process.forEach((item1) => {
                    var corrugatedGluedColumn = ""
                    if (item1.name == 'corrugated_glued') {
                        item1.line.forEach((item2, index2) => {
                            corrugatedGluedColumn += `<td class="alRight"><div class="corrugatedGluedRowUnitprice" index="${index}" indexqty="${index2}">${numeral(item2.unit_price).format('0,0.00')}</div></td>
                                    <td class="alCenter"><div class="corrugatedGluedRowQty" index="${index}" indexqty="${index2}">${numeral(item2.qty).format('0,0')}</div></td>
                                    <td class="alRight"><div class="corrugatedGluedRowprice" index="${index}" indexqty="${index2}">${numeral(item2.price).format('0,0.00')}</div></td>`
                        })
                        corrugatedGluedColumn_arr.push(corrugatedGluedColumn)
                        if (corrugatedGluedColumn_arr.length == 1) {
                            var corrugated_tr = `<tr class="corrugatedGlued_tr" index="${index}" >
                                <td rowspan="${num_trCorrugatedGlued}" colspan="2">ทากาวประกบลูกฟูกกับกระดาษ</td>
                                <td class="alCenter"><div class="corrugatedGluedRowComponentName" index="${index}">${item.component_name}</div></td>
                                <td colspan="2" class="alCenter"><div class="corrugatedRowGlued" index="${index}">${defaultData.corrugated_glued_cost} B/sqinch</div></td>`
                        } else {
                            var corrugated_tr = `<tr class="corrugatedGlued_tr" index="${index}">
                                <td class="alCenter"><div class="corrugatedGluedRowComponentName" index="${index}">${item.component_name}</div></td>
                                <td colspan="2" class="alCenter"><div class="corrugatedGluedRowGlued" index="${index}">${defaultData.corrugated_glued_cost} B/sqinch</div></td>`
                        }
                        corrugatedGluedRow_arr.push(corrugated_tr)
                    }
                })
            })
            if (corrugatedGluedColumn_arr.length != 0) {
                corrugatedGluedColumn_arr.forEach((item, index) => {
                    tr += corrugatedGluedRow_arr[index] + item + `</tr>`
                })
            }
            break
        case 'assembly':
            var assemblyColumn_arr = [], assemblyRow_arr = []
            var num_trAssembly = 0
            comp_arr.forEach((item) => {
                item.process.forEach((item1) => {
                    if (item1.name == 'assembly') {
                        num_trAssembly += 1
                    }
                })
            })
            comp_arr.forEach((item, index) => {
                item.process.forEach((item1, index1) => {
                    if (item1.name == 'assembly') {
                        var assemblyColumn = ""
                        item1.line.forEach((item2) => {
                            assemblyColumn += `<td class="alRight"><div class="assemblyRowUnitPrice" index="${index}" indexqty="${index1}">${numeral(item2.unit_price).format('0,0.00')}</div></td>
                                        <td class="alCenter"><div class="assemblyRowQty" index="${index}" indexqty="${index1}">${numeral(item2.qty).format('0,0')}</div></td>
                                        <td class="alRight"><div class="assemblyRowPrice"  index="${index}"indexqty="${index1}">${numeral(item2.price).format('0,0.00')}</div></td>`
                        })
                        assemblyColumn_arr.push(assemblyColumn)
                        if (assemblyColumn_arr.length == 1) {
                            var assembly_tr = `<tr index="${index}" class="assembly_tr">
                                        <td rowspan="${num_trAssembly}" colspan="3">Assembly (ประกบ/ติดลิ้นกาว)</td>
                                        <td colspan="2" class="alCenter""><div class="assemblyRowComponentName">${item.component_name} ติดกาว ${item.box_type.glued_spot} จุด</div></td>`
                        } else {
                            var assembly_tr = `<tr index="${index}" class="assembly_tr">
                                        <td colspan="2" class="alCenter""><div class="assemblyRowComponentName">${item.component_name} ติดกาว ${item.box_type.glued_spot} จุด</div></td>`
                        }
                        assemblyRow_arr.push(assembly_tr)
                    }
                })
            })
            if (assemblyColumn_arr.length != 0) {
                assemblyColumn_arr.forEach((item, index) => {
                    tr += assemblyRow_arr[index] + item + `</tr>`
                })
            }
            break
        case 'process':
            var tr = ""
            mainData.process.forEach((item, index) => {
                if (sub_proc == 'other') {
                    var label = 'otherProcess'
                } else if (sub_proc == 'handwork') {
                    var label = 'handworkProcess'
                } else if (sub_proc == 'custom') {
                    var label = 'customProcess'
                } else {
                    console.log('sub_proc not match // process')
                }

                if (item.type == sub_proc) {
                    var process_column = ""
                    item.line.forEach((item1, index1) => {
                        process_column += `<td class="alRight"><div class="${label}UnitPrice" index="${index}" indexqty="${index1}">${numeral(item1.unit_price).format('0,0.0000')}</div></td>
                                            <td class="alCenter"><div class="${label}RowQty" index="${index}" indexqty="${index1}">${numeral(item1.qty).format('0,0')}</div></td>
                                            <td class="alRight"><div class="${label}RowPrice" index="${index}" indexqty="${index1}">${numeral(item1.price).format('0,0.00')}</div></td>`
                    })
                    tr += `<tr class="${label}_tr" index=${index}">
                            <td colspan="5" >${item.name}</td>
                            ${process_column}
                        </tr>`
                }
            })
            break
        //? update: 14.03.22
        case 'otherCost':
            mainData?.otherCost && mainData?.otherCost?.forEach((item, index) => {
                var otherCost_column = ""
                item.line.forEach((item1, index1) => {
                    otherCost_column += `
                        <td class="alRight"><div class="otherCostUnitPrice" index="${index}" indexqty="${index1}">${numeral(item1.unit_price).format('0,0.00')}</div></td>
                        <td class="alCenter"><div class="otherCostRowQty" index="${index}" indexqty="${index1}">${numeral(item1.qty).format('0,0.00')}</div></td>
                        <td class="alRight"><div class="otherCostRowPrice" index="${index}" indexqty="${index1}">${numeral(item1.price).format('0,0.00')}</div></td>
                    `
                })
                tr += `
                <tr class="material_tr" index=${index}">
                    <td colspan="5" >${item.name}</td>
                    ${otherCost_column}
                </tr>
                `
            })
            break

    }
    return tr
}

function summary_tr_for_f(tb_row, sub_proc) {
    const
        mainData = est.mainData,
        comp_arr = est.mainData.component1
    const qtyLength = mainData?.qty?.totalqty || 0
    var tr = ""

    const printType = mainData.job.print_type

    switch (tb_row) {
        case 'paper':
            var paperColumn_arr = [],
                paperRow_arr = []

            comp_arr.forEach((comp, compIndex) => {
                const numTrPaper = comp?.f_detail?.f_list?.length || 1
                let paperColumn = ''
                if (comp.component_type.type != 3) {

                    comp?.f_detail?.f_list?.forEach((fInfo, fIndex) => {
                        const paper_usage = comp.paper_usage.line[fIndex]

                        if (fIndex == 0 && compIndex == 0) {
                            var paper_tr = `
                                <tr class="paper_tr" index=${compIndex} fIndex=${fIndex}>
                                    <td rowspan="${numTrPaper}">Paper</td>
                                    <td class="alCenter">
                                        <div class="paperRowComponentName" index=${compIndex}>${fInfo?.f_code}</div>
                                    </td>
                                    <td class="alCenter">
                                        <div class="paperRowPaperType" index=${compIndex}>${comp.paper.paper_name}</div>
                                    </td>
                                    <td colspan="2" class="alCenter">
                                        <div class="paperRowPaperGram" index=${compIndex}>${comp.paper.paper_gram} gsm</div>
                                    </td>
                                `

                        } else {
                            var paper_tr = `
                                <tr class="paper_tr" index=${compIndex}>
                                    <td class="alCenter">
                                        <div class="paperRowComponentName" index=${compIndex}>${fInfo?.f_code}</div>
                                    </td>
                                    <td class="alCenter">
                                        <div class="paperRowPaperType" index=${compIndex}>${comp.paper.paper_name}</div>
                                    </td>
                                    <td colspan="2" class="alCenter">
                                        <div class="paperRowPaperGram" index=${compIndex}>${comp.paper.paper_gram} gsm</div>
                                    </td>
                            `

                        }

                        paperRow_arr.push(paper_tr)

                        paperColumn = `
                            <td class="alRight">
                                <div class="paperRowUnitPrice" index="${compIndex}" fIndex=${fIndex} indexqty="${0}">${numeral(paper_usage.price.paper.unit_price).format('0,0.00')}</div>
                            </td>
                            <td class="alCenter">
                                <div class="paperRowQty" index="${compIndex}" fIndex=${fIndex} indexqty="${0}">${numeral(paper_usage.price.paper.qty).format('0,0')}</div>
                            </td>
                            <td class="alRight">
                                <div class="paperRowPrice" index="${compIndex}" fIndex=${fIndex} indexqty="${0}">${numeral(paper_usage.price.paper.price).format('0,0.00')}</div>
                            </td>
                        `

                        paperColumn_arr.push(paperColumn)
                    })

                }
            })

            if (paperColumn_arr.length != 0) {
                paperColumn_arr.forEach((item, index) => {
                    tr += paperRow_arr[index] + item + `</tr>`
                })
            }

            break
        case 'corrugated':
            comp_arr.forEach((item, index) => {
                var corrugatedColumn1, corrugatedColumn2
                if (item.corrugated_layer) {
                    let is_price_per_sheet = item?.corrugated_layer?.info?.is_price_per_sheet || false

                    item.corrugated_layer.price.forEach((item1, index1) => {
                        corrugatedColumn1 += `<td class="alRight"><div class="corugatedRowUnitPrice" index="${index}" indexqty="${index1}">${numeral(item1.unit_price).format('0,0.00')}</div></td>
                                        <td class="alCenter"><div class="corugatedRowQty" index="${index}" indexqty="${index1}">${numeral(item1.qty).format('0,0')}</div></td>
                                        <td class="alRight"><div class="corugatedRowPrice" index="${index}" indexqty="${index1}">${numeral(item1.price).format('0,0.00')}</div></td>`
                        corrugatedColumn2 += `<td colspan="3" rowspan="3">`
                    })
                    tr += `<tr class="corrugated_tr" index="${index}">
                            <td>Corrugated Board</td>
                            <td class="alCenter"><div class="corrugatedRowComponentName" index="${index}">${item.component_name}</div></td>
                            <td class="alCenter"><div class="corrugatedRowFlute" index="${index}">ลอน ${item.corrugated_layer.info.flute_type} ${item.corrugated_layer.info?.fluteInfo_custom || ''} ${item.corrugated_layer.info.num_layer} ชั้น</div></td>
                            <td colspan="2" class="alCenter"><div class="corrugatedRowName" index="${index}">${item.corrugated_layer.info.name}</div></td>
                            ${corrugatedColumn1}
                        </tr>
                        <tr class="corrugated_tr" index="${index}">
                            <td colspan="2" class="alCenter"><div>ลอนขนานด้าน x Cut off</div></td>
                            <td class="alCenter" colspan="3">ราคาลูกฟูกต่อแผ่น</td>
                            ${corrugatedColumn2}
                        </tr>
                        <tr class="corrugated_tr" index="${index}">
                            <td colspan="2" class="alCenter"><div class="corrugatedRowSize" index="${index}">${item.corrugated_layer.info.flute_side} x ${item.corrugated_layer.info.cut_off}</div></td>
                            <td class="alCenter" colspan="3"><div class="corrugatedRowUnit" index="${index}">${numeral(Math.max(...item.corrugated_layer.info.unit_price)).format('0,0.00')}</div></td>
                        </tr>
                        <tr class="corrugated_tr" index="${index}">
                            <td class="alCenter"><div>ราคาทุน</div></td>
                            <td class="alCenter"><div class="corrugatedRowCost" index="${index}">${numeral(Math.max(...item.corrugated_layer.info.cost)).format('0,0.00')}</div></td>
                            ${is_price_per_sheet ? `
                                <td colspan='2'></td>
                                ` :
                            `<td class="alCenter"><div class="corrugatedRowUnitInch" index="${index}">${numeral(Math.max(...item.corrugated_layer.info.unit_inch)).format('0,0.0000')}</div></td>
                                <td class="alCenter"><div>B/ตร.นิ้ว</div></td>`
                        }
                        </tr>`
                }
            })

            break
        case 'special_ink':
            let isFirstSpeink = true
            comp_arr.forEach((item, compIndex) => {
                if (![null, undefined].includes(item?.color)) {
                    const speInkTr = item?.color?.reduce((total, curr) => total += curr?.special_ink?.length || 0, 0)

                    item?.color?.forEach((color, colorIndex) => {
                        const { f_code, special_ink } = color || {}

                        special_ink?.forEach((specialInk, specialInkIndex) => {

                            var special_ink_column = ""
                            specialInk?.line?.forEach((line, lineIndex) => {

                                special_ink_column += `
                                        <td class="alRight">
                                            <div class="specialInkRowUnitPrice" index="${compIndex}" indexqty="${0}">${numeral(line.unit_price).format('0,0.00')}</div>
                                        </td>
                                        <td class="alCenter">
                                            <div class="specialInkRowQty" index="${compIndex}" indexqty="${0}">${numeral(line.qty).format('0,0')}</div>
                                        </td>
                                        <td class="alRight">
                                            <div class="specialInkRowPrice" index="${compIndex}" indexqty="${0}">${numeral(line.price).format('0,0.00')}</div>
                                        </td>
                                    `
                            })

                            if (compIndex == 0 && isFirstSpeink) {
                                tr += `<tr class="special_ink_tr" index="${compIndex}">
                                    <td rowspan="${speInkTr}">Special Ink</td>
                                    <td class="alCenter">
                                        <div class="paperRowComponentName" index=${compIndex}>${f_code}</div>
                                    </td>
                                    <td colspan="3">${specialInk.name} : ${specialInk.info.ink_name}</td>
                                    ${special_ink_column}
                                </tr>`

                                isFirstSpeink = false
                            } else {
                                tr += `<tr class="special_ink_tr" index="${compIndex}">
                                        <td class="alCenter">
                                        <div class="paperRowComponentName" index=${compIndex}>${f_code}</div>
                                    </td>
                                    <td colspan="3">${specialInk.name} : ${specialInk.info.ink_name}</td>
                                    ${special_ink_column}
                                </tr>`
                            }
                        })

                    })
                }


            })
            break;
        case 'component_material':
            mainData?.component1?.forEach((comp, cIndex) => {
                comp?.process?.filter(obj => obj?.type === 'material')?.forEach((item, index) => {
                    var material_column = ""
                    item.line.forEach((item1, index1) => {
                        material_column += `<td class="alRight"><div class="componentMaterialUnitPrice" index="${index}" indexqty="${index1}">${numeral(item1.unit_price).format('0,0.00')}</div></td>
                                      <td class="alCenter"><div class="componentMaterialRowQty" index="${index}" indexqty="${index1}">${numeral(item1.qty).format('0,0.00')}</div></td>
                                      <td class="alRight"><div class="componentMaterialRowPrice" index="${index}" indexqty="${index1}">${numeral(item1.price).format('0,0.00')}</div></td>`
                    })
                    tr += `<tr class="material_tr" index=${index}">
                        <td colspan="2" >${item?.info?.component_info?.component_name}</td>
                        <td colspan="3" >${item?.info?.process_name}</td>
                        ${material_column}
                    </tr>`
                })
            })
            break
        case 'material':
            mainData.material.forEach((item, compIndex) => {
                item.line.forEach((item1, fIndex) => {
                    var material_column = ""

                    mainData.qty.totalqty.forEach((qty, qtyIndex) => {
                        material_column += `<td class="alRight"><div class="materialUnitPrice" index="${compIndex}" indexqty="${qtyIndex}">${numeral(item1.unit_price).format('0,0.00')}</div></td>
                                      <td class="alCenter"><div class="materialRowQty" index="${compIndex}" indexqty="${qtyIndex}">${numeral(item1.qty).format('0,0.00')}</div></td>
                                      <td class="alRight"><div class="materialRowPrice" index="${compIndex}" indexqty="${qtyIndex}">${numeral(item1.price).format('0,0.00')}</div></td>`
                    })

                    tr += `<tr class="material_tr" index=${compIndex}" fIndex=${fIndex}>
                                <td colspan="5" >${item.name}</td>
                                ${material_column}
                            </tr>`

                })
            })
            break;
        case 'print_plate':
            var proc_label = '',
                color_label = ''

            if (sub_proc == 'plate') {
                if (printType == 'Offset') {
                    proc_label = 'Plate'
                    color_label = 'cols'

                } else if (printType == 'Flexo') {
                    proc_label = `Plate Polymer (${mainData.job.flexo_size[0]} x ${mainData.job.flexo_size[1]} in²)`
                    color_label = 'cols'

                } else {
                    proc_label = 'Plate'
                    color_label = 'cols'
                }

            } else if (sub_proc == 'proof') {
                if (['Jet Press', 'Konica']?.includes(printType)) {
                    proc_label = 'Proof'
                    color_label = 'cols'
                }
            } else {
                if (printType == 'Offset') {
                    proc_label = 'Print'

                    if (mainData.job.ink_type == 'UV') {
                        color_label = 'cols UV'
                    } else {
                        color_label = 'cols'
                    }

                } else if (printType == 'Flexo') {
                    proc_label = 'Print Flexo'
                    color_label = 'cols'

                } else {
                    proc_label = 'Print'
                    color_label = 'cols'
                }
            }

            comp_arr.forEach((comp, compIndex) => {
                const { machine, f_detail: { f_list }, paper_usage, color } = comp || {}
                var machineName = '',
                    proc = ''

                if (printType != 'Jet Press') {
                    machineName = machine.machine_size.name
                } else {
                    machineName = printType
                }

                f_list?.forEach((fInfo, fIndex) => {
                    const paperUasgeInfo = paper_usage.line[fIndex]
                    const fColor = color.find(col => col.f_code === fInfo?.f_code) || {}
                    let column_outside = '',
                        column_inside = ''

                    if (sub_proc == 'plate') {
                        proc = paperUasgeInfo.price.plate
                    } else if (sub_proc == 'proof') {
                        proc = paperUasgeInfo.price?.proof
                    } else {
                        proc = paperUasgeInfo.price.print
                    }

                    if (!['Jet Press']?.includes(printType) && !(printType == 'Konica' && sub_proc == 'plate')) { //* Offset , Flexo , Konica (Print )
                        if (['plate', 'print'].includes(sub_proc)) {
                            mainData.qty.totalqty.forEach((qty, qtyIndex) => {
                                column_outside += `
                                <td class="alRight">
                                    <div class="${sub_proc}RowUnitPrice" index="${compIndex}" indexqty="${0}">${numeral(proc.outside.unit_price).format('0,0.00')}</div>
                                </td>
                                <td class="alCenter">
                                    <div class="${sub_proc}RowQty" index="{index}" indexqty="${0}">${numeral(proc.outside.qty).format('0,0')}</div>
                                </td>
                                <td class="alRight">
                                    <div class="${sub_proc}RowPrice" index="{index}" indexqty="${0}">${numeral(proc.outside.price).format('0,0.00')}</div>
                                </td>`

                                column_inside += `
                                <td class="alRight">
                                    <div class="${sub_proc}RowUnitPrice" index="${compIndex}" indexqty="${0}">${numeral(proc.inside.unit_price).format('0,0.00')}</div>
                                </td>
                                <td class="alCenter">
                                    <div class="${sub_proc}RowQty" index="{index}" indexqty="${0}">${numeral(proc.inside.qty).format('0,0')}</div>
                                </td>
                                <td class="alRight">
                                    <div class="${sub_proc}RowPrice" index="{index}" indexqty="${0}">${numeral(proc.inside.price).format('0,0.00')}</div>
                                </td>`
                            })

                            if (compIndex == 0 && fIndex == 0) {
                                tr += `<tr index=${compIndex} class="${sub_proc}Outside_tr">
                                        <td rowspan="${comp_arr.length * 2 * (f_list.length || 1)}">${proc_label}</td>
                                        <td class="alLeft"><div class="${sub_proc}RowOutside" index="${compIndex}">${fInfo?.f_code} Outside</div></td>
                                        <td class="alCenter"><div class="${sub_proc}RowColOutside" index="${compIndex}">${fColor?.outside} ${color_label}</div></td>
                                        <td colspan="2" class="alCenter"><div class="${sub_proc}CutOutside" index="${compIndex}"">${machineName}</div></td>
                                        ${column_outside}
                                    </tr>
                                    <tr index=${compIndex} class="${sub_proc}Inside_tr">
                                        <td class="alLeft"><div class="${sub_proc}RowInside" index="${compIndex}">${fInfo?.f_code} Inside</div></td>
                                        <td class="alCenter"><div class="${sub_proc}RowColInside" index="${compIndex}">${fColor?.inside} ${color_label}</div></td>
                                        <td colspan="2" class="alCenter"><div class="${sub_proc}CutInside" index="${compIndex}">${machineName}</div></td>
                                        ${column_inside}
                                    </tr>`
                            } else {
                                tr += `<tr index=${compIndex} class="${sub_proc}Outside_tr">
                                        <td class="alLeft"><div class="${sub_proc}RowOutside" index="${compIndex}">${fInfo?.f_code} Outside</div></td>
                                        <td class="alCenter"><div class="${sub_proc}RowColOutside" index="${compIndex}">${fColor?.outside} ${color_label}</div></td>
                                        <td colspan="2" class="alCenter"><div class="${sub_proc}CutOutside" index="${compIndex}">${machineName}</div></td>
                                        ${column_outside}
                                    </tr>
                                    <tr index=${compIndex} class="${sub_proc}Inside_tr">
                                        <td class="alLeft"><div class="${sub_proc}RowInside" index="${compIndex}">${fInfo?.f_code} Inside</div></td>
                                        <td class="alCenter"><div class="${sub_proc}RowColInside" index="${compIndex}">${fColor?.inside} ${color_label}</div></td>
                                        <td colspan="2" class="alCenter"><div class="${sub_proc}CutInside" index="${compIndex}">${machineName}</div></td>
                                        ${column_inside}
                                    </tr>`
                            }
                        }
                    }

                    if (['Jet Press', 'Konica']?.includes(printType) && !(printType == 'Konica' && sub_proc == 'print')) { //* Jet Press and Konica (ONly proof)
                        if (['proof', 'print'].includes(sub_proc)) {
                            let colorLabel = `${fColor?.outside ? 4 : 0}/${fColor?.inside ? 4 : 0} ${color_label}`,
                                column_all = ''

                            mainData.qty.totalqty.forEach((qty, qtyIndex) => {
                                column_all += `
                                <td class="alRight">
                                    <div class="${sub_proc}RowUnitPrice" index="${compIndex}" indexqty="${0}">${numeral(proc.all.unit_price).format('0,0.00')}</div>
                                </td>
                                <td class="alCenter">
                                    <div class="${sub_proc}RowQty" index="{index}" indexqty="${0}">${numeral(proc.all.qty).format('0,0')}</div>
                                </td>
                                <td class="alRight">
                                    <div class="${sub_proc}RowPrice" index="{index}" indexqty="${0}">${numeral(proc.all.price).format('0,0.00')}</div>
                                </td>`
                            })

                            if (compIndex == 0 && fIndex == 0) {
                                if (sub_proc == 'proof') {
                                    tr += `<tr index=${compIndex} class="${sub_proc}Allside_tr">
                                    <td rowspan="${comp_arr.length * 1 * (f_list.length || 1)}">${proc_label}</td>
                                    <td class="alCenter" colspan="4"><div class="${sub_proc}RowAll" index="${compIndex}">${fInfo?.f_code}</div></td>
                                    ${column_all}
                                </tr>`
                                } else {
                                    tr += `<tr index=${compIndex} class="${sub_proc}Allside_tr">
                                            <td rowspan="${comp_arr.length * 1 * (f_list.length || 1)}">${proc_label}</td>
                                            <td class="alCenter"><div class="${sub_proc}RowColAll" index="${compIndex}">${colorLabel}</div></td>
                                            <td class="alCenter" colspan="3"><div class="${sub_proc}RowAll" index="${compIndex}">${fInfo?.f_code}</div></td>
                                            ${column_all}
                                        </tr>`
                                }
                            } else {
                                if (sub_proc == 'proof') {
                                    tr += `<tr index=${compIndex} class="${sub_proc}Allside_tr">
                                <td class="alCenter" colspan="4"><div class="${sub_proc}RowAll" index="${compIndex}">${fInfo?.f_code}</div></td>
                                            ${column_all}
                                        </tr>`
                                } else {
                                    tr += `<tr index=${compIndex} class="${sub_proc}Allside_tr">
                                <td class="alCenter"><div class="${sub_proc}RowColAll" index="${compIndex}">${colorLabel}</div></td>
                                <td class="alCenter" colspan="3"><div class="${sub_proc}RowAll" index="${compIndex}">${fInfo?.f_code}</div></td>
                                            ${column_all}
                                        </tr>`
                                }
                            }
                        }
                    }
                })

            })
            break
        case 'reprint_plate':
            var proc_label = '',
                color_label = ''

            if (printType != 'Offset') return ''

            proc_label = 'Plate (สำรอง)'
            color_label = 'cols'


            comp_arr.forEach((comp, compIndex) => {
                const { machine, f_detail: { f_list }, paper_usage, color } = comp || {}
                var machineName = '',
                    proc = ''

                machineName = machine.machine_size.name

                f_list?.forEach((fInfo, fIndex) => {
                    const paperUasgeInfo = paper_usage.line[fIndex]
                    const fColor = color.find(col => col.f_code === fInfo?.f_code) || {}
                    let column_outside = '',
                        column_inside = ''

                    proc = paperUasgeInfo.price.plate?.reprint

                    mainData.qty.totalqty.forEach((qty, qtyIndex) => {
                        column_outside += `
                                <td class="alRight">
                                    <div class="${sub_proc}RowUnitPrice" index="${compIndex}" indexqty="${0}">${numeral(proc.outside.unit_price).format('0,0.00')}</div>
                                </td>
                                <td class="alCenter">
                                    <div class="${sub_proc}RowQty" index="{index}" indexqty="${0}">${numeral(proc.outside.qty).format('0,0')}</div>
                                </td>
                                <td class="alRight">
                                    <div class="${sub_proc}RowPrice" index="{index}" indexqty="${0}">${numeral(proc.outside.price).format('0,0.00')}</div>
                                </td>`

                        column_inside += `
                                <td class="alRight">
                                    <div class="${sub_proc}RowUnitPrice" index="${compIndex}" indexqty="${0}">${numeral(proc.inside.unit_price).format('0,0.00')}</div>
                                </td>
                                <td class="alCenter">
                                    <div class="${sub_proc}RowQty" index="{index}" indexqty="${0}">${numeral(proc.inside.qty).format('0,0')}</div>
                                </td>
                                <td class="alRight">
                                    <div class="${sub_proc}RowPrice" index="{index}" indexqty="${0}">${numeral(proc.inside.price).format('0,0.00')}</div>
                                </td>`
                    })

                    if (compIndex == 0 && fIndex == 0) {
                        tr += `<tr index=${compIndex} class="${sub_proc}Outside_tr">
                                        <td rowspan="${comp_arr.length * 2 * (f_list.length || 1)}">${proc_label}</td>
                                        <td class="alLeft"><div class="${sub_proc}RowOutside" index="${compIndex}">${fInfo?.f_code} Outside</div></td>
                                        <td class="alCenter"><div class="${sub_proc}RowColOutside" index="${compIndex}">${fColor?.outside} ${color_label}</div></td>
                                        <td colspan="2" class="alCenter"><div class="${sub_proc}CutOutside" index="${compIndex}"">${machineName}</div></td>
                                        ${column_outside}
                                    </tr>
                                    <tr index=${compIndex} class="${sub_proc}Inside_tr">
                                        <td class="alLeft"><div class="${sub_proc}RowInside" index="${compIndex}">${fInfo?.f_code} Inside</div></td>
                                        <td class="alCenter"><div class="${sub_proc}RowColInside" index="${compIndex}">${fColor?.inside} ${color_label}</div></td>
                                        <td colspan="2" class="alCenter"><div class="${sub_proc}CutInside" index="${compIndex}">${machineName}</div></td>
                                        ${column_inside}
                                    </tr>`
                    } else {
                        tr += `<tr index=${compIndex} class="${sub_proc}Outside_tr">
                                        <td class="alLeft"><div class="${sub_proc}RowOutside" index="${compIndex}">${fInfo?.f_code} Outside</div></td>
                                        <td class="alCenter"><div class="${sub_proc}RowColOutside" index="${compIndex}">${fColor?.outside} ${color_label}</div></td>
                                        <td colspan="2" class="alCenter"><div class="${sub_proc}CutOutside" index="${compIndex}">${machineName}</div></td>
                                        ${column_outside}
                                    </tr>
                                    <tr index=${compIndex} class="${sub_proc}Inside_tr">
                                        <td class="alLeft"><div class="${sub_proc}RowInside" index="${compIndex}">${fInfo?.f_code} Inside</div></td>
                                        <td class="alCenter"><div class="${sub_proc}RowColInside" index="${compIndex}">${fColor?.inside} ${color_label}</div></td>
                                        <td colspan="2" class="alCenter"><div class="${sub_proc}CutInside" index="${compIndex}">${machineName}</div></td>
                                        ${column_inside}
                                    </tr>`
                    }
                })

            })
            break
        case 'coating':
            var coatingColumn_arr = [], coatingRow_arr = [], num_trCoating = 0
            comp_arr.forEach((item) => {
                item.addon.forEach((item1) => {
                    if (item1.type == 'coating') {
                        num_trCoating += 1
                    }
                })
            })

            comp_arr.forEach((item, index) => {
                item.addon.forEach((item1) => {
                    var coatingColumn = '',
                        coating_option = '',
                        compName = 'All'

                    if (item1.info.name != 'Other') {
                        coating_option = item1.info.name
                    }

                    if (item1.type == 'coating') {
                        item1.line.forEach((item2, index2) => {
                            coatingColumn += `
                                <td class="alRight">
                                    <div class="coatingRowUnitPrice" index="${index}" indexqty="${index2}">${numeral(item2.unit_price).format('0,0.00')}</div>
                                </td>
                                <td class="alCenter">
                                    <div class="coatingRowQty" index="${index}" indexqty="${index2}">${numeral(item2.qty).format('0,0')}</div>
                                </td>
                                <td class="alRight">
                                    <div class="coatingRowPrice" index="${index}" indexqty="${index2}">${numeral(item2.price).format('0,0.00')}</div>
                                </td>`
                        })

                        coatingColumn_arr.push(coatingColumn)

                        if (['S-UV', 'S-UV-S'].includes(item1.info.code)) {
                            var size_label = "(" + item1.info.width + " x " + item1.info.length + " in²)"
                        } else if (item1.info?.code == 'P-PAT') {
                            var size_label = `(เบอร์ ${item1?.info?.number})`
                        } else {
                            var size_label = ""
                        }

                        if (coatingColumn_arr.length == 1) {
                            var coating_tr = `<tr class='coating_tr' index="${index}">
                                <td rowspan="${num_trCoating}">Coating</td>
                                <td rowspan="${num_trCoating}"class="alCenter">
                                    <div class="coatingRowComponentName" index="${index}">${compName}</div>
                                </td>
                                <td colspan="3" class="alLeft">
                                    <div class="coatingRowCoatingType" index="${index}">${coating_option} ${item1.info.type} ${item1.info.side} s ${size_label}</div>
                                </td>`
                        } else {
                            var coating_tr = `<tr>
                                <td colspan="3" class="alLeft">
                                    <div class="coatingRowCoatingType" index="${index}">${coating_option} ${item1.info.type} ${item1.info.side} s ${size_label}</div>
                                </td>`
                        }

                        coatingRow_arr.push(coating_tr)
                    }
                })
            })

            if (coatingColumn_arr.length != 0) {
                coatingColumn_arr.forEach((item, index) => {
                    tr += coatingRow_arr[index] + item + `</tr>`
                })
            }
            break
        case 'foilstamp':
            comp_arr.forEach((component, compIndex) => { //* loop components.
                const foilstampAddon = component.addon.filter(obj => obj.type === 'foilstamp')
                const num_process = []

                foilstampAddon.forEach((addon, index) => {
                    const process_index = addon?.info?.process_index >= 0 ? addon?.info?.process_index : index
                    if (!num_process.includes(process_index)) {
                        num_process.push(process_index)
                    }
                })


                //* ได้เลขกรอบทั้งหมดของ foilstamp
                num_process.forEach(process_id => { //* foilstamp แต่ละกรอบ
                    let trBlock = ``,
                        trRoll = ``,
                        trStamp = ``

                    //* หา process_id จาก addon list ที่ตรงกัน
                    const foilstampSize = foilstampAddon.filter((addon, a_index) => addon?.info?.process_index >= 0 ? addon?.info?.process_index === process_id : a_index === process_id)
                    const summary = {
                        foilRoll: [],
                        foilStamp: []
                    }

                    // if(foilstampSize.length > 1){
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
                    // }

                    foilstampSize.forEach((size, sizeIndex) => { //* foilstamp size แต่ละกรอบ [x*y , x*y]
                        const { line, info: { f_code } } = size || {}

                        let blockStampColumn = ""
                        const compName = f_code.join(", ")

                        line.forEach((qtyDetail, qtyIndex) => {
                            const { labor, block, foil_roll } = qtyDetail

                            blockStampColumn += `<td class="alRight"><div class="blockStampRowUnitPrice" index="${process_id}" sizeIndex="${sizeIndex}" indexqty="${qtyIndex}">${numeral(block.unit_price).format('0,0.00')}</div></td>
                                <td class="alCenter"><div class="blockStampRowQty" index="${process_id}" sizeIndex="${sizeIndex}" indexqty="${qtyIndex}">${numeral(block.qty).format('0,0')}</div></td>
                                <td class="alRight"><div class="blockStampRowPrice" index="${process_id}" sizeIndex="${sizeIndex}" indexqty="${qtyIndex}">${numeral(block.price).format('0,0.00')}</div></td>`

                            summary.foilRoll[qtyIndex].unit_price += foil_roll.unit_price
                            summary.foilRoll[qtyIndex].qty = foil_roll.qty
                            summary.foilRoll[qtyIndex].price += foil_roll.qty * foil_roll.unit_price

                            //* คิดค่า stamp ครั้งเดียว
                            summary.foilStamp[qtyIndex].unit_price = labor.unit_price
                            summary.foilStamp[qtyIndex].qty = labor.qty
                            summary.foilStamp[qtyIndex].price = labor.price
                        })

                        //* แต่ละกรอบมีค่า Block ตามจำนวน size
                        trBlock += `<tr class='foilStamp_tr' index="${process_id}" sizeIndex="${sizeIndex}">
                            <td>Block Foil  Stamp</td>
                            <td colspan="2" style="text-align:center"><div class="foilRowComponentName" index="${process_id}" sizeIndex="${sizeIndex}" >${compName}</div></td>
                            <td colspan="2" style="text-align:center"><div class="foilRowArea" index="${process_id}" sizeIndex="${sizeIndex}" >Area (in²) : ${size.info.width} x ${size.info.length}</div></td>
                            ${blockStampColumn}
                        </tr>`
                    })

                    //* check min price
                    foilstampSize.forEach((size, sizeIndex) => {
                        const { line, info: { foil_roll_min_price = 0 } } = size
                        line.forEach((qtyDetail, qtyIndex) => {
                            summary.foilRoll[qtyIndex].price = summary.foilRoll[qtyIndex].price < foil_roll_min_price ? foil_roll_min_price : summary.foilRoll[qtyIndex].price
                        })
                    })




                    let foilRollColumn = "",
                        foilStampColumn = ""

                    est.mainData.qty.totalqty.map((qty, qtyIndex) => {
                        foilRollColumn += `<td class="alRight"><div class="foilRollRowUnitPrice" index="${index}" indexqty="${qtyIndex}">${numeral(summary.foilRoll[qtyIndex].unit_price).format('0,0.0000')}</div></td>
                            <td class="alCenter"><div class="foilRollRowQty" index="${index}" indexqty="${qtyIndex}">${numeral(summary.foilRoll[qtyIndex].qty).format('0,0')}</div></td>
                            <td class="alRight"><div class="foilRollRowPrice" index="${index}" indexqty="${qtyIndex}">${numeral(summary.foilRoll[qtyIndex].price).format('0,0.00')}</div></td>`

                        foilStampColumn += `<td class="alRight"><div class="foilStampRowUnitPrice" index="${index}" indexqty="${qtyIndex}">${numeral(summary.foilStamp[qtyIndex].unit_price).format('0,0.00000')}</div></td>
                            <td class="alCenter"><div class="foilStampRowQty" index="${index}" indexqty="${qtyIndex}">${numeral(summary.foilStamp[qtyIndex].qty).format('0,0')}</div></td>
                            <td class="alRight"><div class="foilStampRowPrice" index="${index}" indexqty="${qtyIndex}">${numeral(summary.foilStamp[qtyIndex].price).format('0,0.00')}</div></td>`
                    })

                    //* แต่ละกรอบมีการสรุปข้อมูล Roll , Stamp กรอบละ 1 แถว
                    trRoll += `<tr class='foilStamp_tr' index="${process_id}">
                        <td colspan="3"><div class="foilRowRollWidth" index="${process_id}">Foil หน้าม้วน  ${foilstampSize[0].info.foil_width}" ความยาว ${foilstampSize[0].info.foil_length} ft </td>
                        <td colspan="2" class="alCenter"><div class="foilRowCode" index="${process_id}">สี${foilstampSize[0].info.color_th} ${foilstampSize[0].info.code}</div></td>
                        ${foilRollColumn}
                    </tr>`

                    trStamp += `<tr class='foilStamp_tr' index="${process_id}">
                        <td colspan="3">Foil Stamp</td>
                        <td colspan="2" class="alRight"></td>
                        ${foilStampColumn}
                    </tr>`

                    tr += trBlock + trRoll + trStamp

                }) //* END foilstamp แต่ละกรอบ

            })
            break
        case 'bossing':
            var proc_label = 'Block Deboss',
                sub_proc_upper = 'Deboss',
                compName = ''
            if (sub_proc == 'emboss') {
                proc_label = "Block Emboss"
                sub_proc_upper = "Emboss"
            }

            comp_arr.forEach((item, index) => {
                const bossing = item?.addon?.filter(addon => addon.type == sub_proc)
                //     item.addon.forEach((item1,) => {
                //         if (item1.type == sub_proc) {
                bossing?.forEach(addon => {

                    let blockTr = "",
                        bossingTr = ""

                    let blockColumn = '',
                        bossingColumn = ''

                    let block = []

                    //* BLOCK COST
                    addon.line?.block?.forEach((block, bIndex) => {
                        blockColumn = ''

                        blockTr += `
                            <tr class="${sub_proc}_tr">
                                <td>${proc_label}</td>
                                <td colspan="2" class="alCenter"><div class="${sub_proc}RowComponentName">${item.component_name}</div></td>
                                <td colspan="2" class="alCenter"><div class="${sub_proc}RowArea">Area (in²) : ${block.size[0]} x ${block.size[1]}</div></td>
                                
                        `

                        block?.line?.forEach((line, lIndex) => {
                            blockColumn += `
                                <td class="alRight">
                                    <div class="block${sub_proc_upper}RowUnitPrice" indexqty="${lIndex}">${numeral(line.unit_price).format('0,0.00')}</div>
                                </td>
                                <td class="alCenter">
                                    <div class="block${sub_proc_upper}RowQty" indexqty="${lIndex}">${numeral(line.qty).format('0,0')}</div>
                                </td>
                                <td class="alRight">
                                    <div class="block${sub_proc_upper}RowPrice" indexqty="${lIndex}">${numeral(line.price).format('0,0.00')}</div>
                                </td>
                            `
                        })

                        blockTr += `
                            ${blockColumn}
                        </tr>
                        `
                    })

                    //*LABOR
                    bossingTr += `
                    <tr class="${sub_proc}_tr">
                        <td colspan="3">${sub_proc_upper}</td>
                        <td colspan="2" class="alCenter"></td>
                    `

                    addon.line?.labor?.forEach((price, pIndex) => {

                        bossingColumn += `
                            <td class="alRight">
                                <div class="block${sub_proc_upper}RowUnitPrice" indexqty="${pIndex}">${numeral(price.unit_price).format('0,0.00000')}</div>
                            </td>
                            <td class="alCenter">
                                <div class="block${sub_proc_upper}RowQty" indexqty="${pIndex}">${numeral(price.qty).format('0,0')}</div>
                            </td>
                            <td class="alRight">
                                <div class="block${sub_proc_upper}RowPrice" indexqty="${pIndex}">${numeral(price.price).format('0,0.00')}</div>
                            </td>
                        `

                    })

                    bossingTr += `
                        ${bossingColumn}
                        </tr>
                    `

                    tr += blockTr
                    tr += bossingTr
                })
            })
            break
        case 'diecut':
            var diecutColumn_arr = [],
                blockColumn_arr = [],
                diecutRow_arr = [],
                blockRow_arr = [],
                block_label = 'Block Diecut',
                compName = 'All'

            if (mainData.job.is_reprinted) {
                block_label = 'Block Diecut (Reprint)'
            }

            comp_arr.forEach((item) => {
                const diecutArr = item.process?.filter(obj => obj.name == 'diecut') || []
                diecutArr.forEach((item1, index1) => {
                    var diecutColumn = "",
                        blockColumn = ""

                    item1.line.forEach((item2, index2) => {
                        blockColumn += `<td class="alRight"><div class="blockDiecutRowUnitPrice" index="${index1}" indexqty="${index2}">${numeral(item2.block.unit_price).format('0,0.00')}</div></td>
                                    <td class="alCenter"><div class="blockDiecutRowQty" index="${index1}" indexqty="${index2}">${numeral(item2.block.qty).format('0,0')}</div></td>
                                    <td class="alRight"><div class="blockDiecutRowPrice" index="${index1}" indexqty="${index2}">${numeral(item2.block.price).format('0,0.00')}</div></td>`
                        diecutColumn += `<td class="alRight"><div class="diecutRowUnitPrice" index="${index1}" indexqty="${index2}">${numeral(item2.labor.unit_price).format('0,0.00000')}</div></td>
                                    <td class="alCenter"><div class="diecutRowQty" index="${index1}" indexqty="${index2}">${numeral(item2.labor.qty).format('0,0')}</div></td>
                                    <td class="alRight"><div class="diecutRowPrice" index="${index1}" indexqty="${index2}">${numeral(item2.labor.price).format('0,0.00')}</div></td>`
                    })

                    diecutColumn_arr.push(diecutColumn)
                    blockColumn_arr.push(blockColumn)

                    if (blockColumn_arr.length == 1) {
                        var blockRow = `
                            <tr index="${index1}" class="diecut_tr">
                                <td colspan="3"rowspan="${comp_arr.length}">${block_label}</td>
                                <td colspan="2" class="alCenter"><div class="diecutRowComponentName" index="${index1}">${compName}</div></td>`

                        var diecutRow = `
                            <tr>
                                <td colspan="3" rowspan="${comp_arr.length}">Diecut</td>
                                <td colspan="2" class="alCenter"><div class="diecutRowComponentName" index="${index1}">${compName}</div></td>`
                    } else {
                        var blockRow = `
                            <tr index="${index1}" class="diecut_tr">
                                <td colspan="2" class="alCenter"><div class="diecutRowComponentName" index="${index1}">${compName}</div></td>`
                        var diecutRow = `
                            <tr>
                                <td colspan="2" class="alCenter"><div class="diecutRowComponentName" index="${index1}">${compName}</div></td>`
                    }

                    diecutRow_arr.push(diecutRow)
                    blockRow_arr.push(blockRow)
                })
            })

            if (blockColumn_arr.length != 0) {
                blockColumn_arr.forEach((item, index) => {
                    tr += blockRow_arr[index] + item + `</tr>`
                })
            }

            if (diecutColumn_arr.length != 0) {
                diecutColumn_arr.forEach((item, index) => {
                    tr += diecutRow_arr[index] + item + `</tr>`
                })
            }
            break
        case 'main_process':
            var proc_label = ''

            switch (sub_proc) {
                case 'chip':
                    proc_label = "แกะ"
                    break
                case 'inspection':
                    proc_label = "Inspection"
                    break
                case 'trim':
                    proc_label = "Trim"
                    break
                case 'shrinkwrap':
                    proc_label = "Shrinkwrap"
                    break
            }

            mainData.process.forEach((item) => {
                if (item.name == sub_proc) {
                    var columns = ""

                    item.line.forEach((item1, index1) => {
                        columns += `<td class="alRight"><div class="${sub_proc}RowUnitPrice" indexqty="${index1}">${numeral(item1.unit_price).format('0,0.00')}</div></td>
                                    <td class="alCenter"><div class="${sub_proc}RowQty" indexqty="${index1}">${numeral(item1.qty).format('0,0')}</div></td>
                                    <td class="alRight"><div class="${sub_proc}RowPrice" indexqty="${index1}">${numeral(item1.price).format('0,0.00')}</div></td>`
                    })

                    tr = `<tr class="${sub_proc}_tr">
                            <td colspan="5">${proc_label}</td>
                            ${columns}
                        </tr>`
                }
            })
            break
        case 'digital_diecut':
            var digitalDiecutColumn_arr = [], digitalDiecutRow_arr = [], num_trDigitalDiecut = 0
            comp_arr.forEach((item,) => {
                item.process.forEach((item1,) => {
                    if (item1.name == 'digital_diecut') {
                        num_trDigitalDiecut += 1
                    }
                })
            })
            comp_arr.forEach((item, index) => {
                item.process.forEach((item1) => {
                    var digitalDiecutColumn = ""
                    if (item1.name == 'digital_diecut') {
                        item1.line.forEach((item2, index2) => {
                            digitalDiecutColumn += `<td class="alRight"><div class="digitalDiecutRowUnitprice" index="${index}" indexqty="${index2}">${numeral(item2.unit_price).format('0,0.00')}</div></td>
                                        <td class="alCenter"><div class="digitalDiecutRowQty" index="${index}" indexqty="${index2}">${numeral(item2.qty).format('0,0')}</div></td>
                                        <td class="alRight"><div class="digitalDiecutRowprice" index="${index}" indexqty="${index2}">${numeral(item2.price).format('0,0.00')}</div></td>`
                        })
                        digitalDiecutColumn_arr.push(digitalDiecutColumn)
                        if (digitalDiecutColumn_arr.length == 1) {
                            var corrugated_tr = `<tr class="digitalDiecut_tr" index="${index}" >
                                    <td rowspan="${num_trDigitalDiecut}" >Digital Diecut</td>
                                    <td colspan="2" class="alCenter"><div class="digitalDiecutRowComponentName" index="${index}">${item.component_name}</div></td>
                                    <td colspan="2" class="alCenter"><div class="digitalDiecutRowComponentName" index="${index}"></div></td>
                                    `
                        } else {
                            var corrugated_tr = `<tr class="digitalDiecut_tr" index="${index}">
                                    <td colspan="2" class="alCenter"><div class="digitalDiecutRowComponentName" index="${index}">${item.component_name}</div></td>
                                    <td colspan="2" class="alCenter"><div class="digitalDiecutRowComponentName" index="${index}"></div></td>
                                    `
                        }
                        digitalDiecutRow_arr.push(corrugated_tr)
                    }
                })
            })
            if (digitalDiecutColumn_arr.length != 0) {
                digitalDiecutColumn_arr.forEach((item, index) => {
                    tr += digitalDiecutRow_arr[index] + item + `</tr>`
                })
            }
            break
        case 'corrugated_glued':
            var corrugatedGluedColumn_arr = [],
                corrugatedGluedRow_arr = [],
                compName = 'All'

            const num_trCorrugatedGlued = comp_arr?.reduce((total, item) => total += item.process.filter(obj => obj.name == 'corrugated_glued')?.length || 0, 0)

            comp_arr.forEach((item, index) => {
                item.process.forEach((item1) => {
                    var corrugatedGluedColumn = ""
                    if (item1.name == 'corrugated_glued') {
                        item1.line.forEach((item2, index2) => {
                            corrugatedGluedColumn += `<td class="alRight"><div class="corrugatedGluedRowUnitprice" index="${index}" indexqty="${index2}">${numeral(item2.unit_price).format('0,0.00')}</div></td>
                                    <td class="alCenter"><div class="corrugatedGluedRowQty" index="${index}" indexqty="${index2}">${numeral(item2.qty).format('0,0')}</div></td>
                                    <td class="alRight"><div class="corrugatedGluedRowprice" index="${index}" indexqty="${index2}">${numeral(item2.price).format('0,0.00')}</div></td>`
                        })
                        corrugatedGluedColumn_arr.push(corrugatedGluedColumn)
                        if (corrugatedGluedColumn_arr.length == 1) {
                            var corrugated_tr = `<tr class="corrugatedGlued_tr" index="${index}" >
                                <td rowspan="${num_trCorrugatedGlued}" colspan="2">ทากาวประกบลูกฟูกกับกระดาษ</td>
                                <td class="alCenter"><div class="corrugatedGluedRowComponentName" index="${index}">${compName}</div></td>
                                <td colspan="2" class="alCenter"><div class="corrugatedRowGlued" index="${index}">${defaultData.corrugated_glued_cost} B/sqinch</div></td>`
                        } else {
                            var corrugated_tr = `<tr class="corrugatedGlued_tr" index="${index}">
                                <td class="alCenter"><div class="corrugatedGluedRowComponentName" index="${index}">${compName}</div></td>
                                <td colspan="2" class="alCenter"><div class="corrugatedGluedRowGlued" index="${index}">${defaultData.corrugated_glued_cost} B/sqinch</div></td>`
                        }
                        corrugatedGluedRow_arr.push(corrugated_tr)
                    }
                })
            })

            if (corrugatedGluedColumn_arr.length != 0) {
                corrugatedGluedColumn_arr.forEach((item, index) => {
                    tr += corrugatedGluedRow_arr[index] + item + `</tr>`
                })
            }
            break
        case 'assembly':
            var assemblyColumn_arr = [],
                assemblyRow_arr = [],
                compName = 'All'
            const num_trAssembly = comp_arr?.reduce((total, item) => total += item.process.filter(obj => obj.name == 'assembly')?.length || 0, 0)

            comp_arr.forEach((item, index) => {
                item.process.forEach((item1, index1) => {
                    if (item1.name == 'assembly') {
                        var assemblyColumn = ""
                        item1.line.forEach((item2) => {
                            assemblyColumn += `<td class="alRight"><div class="assemblyRowUnitPrice" index="${index}" indexqty="${index1}">${numeral(item2.unit_price).format('0,0.00')}</div></td>
                                        <td class="alCenter"><div class="assemblyRowQty" index="${index}" indexqty="${index1}">${numeral(item2.qty).format('0,0')}</div></td>
                                        <td class="alRight"><div class="assemblyRowPrice"  index="${index}"indexqty="${index1}">${numeral(item2.price).format('0,0.00')}</div></td>`
                        })
                        assemblyColumn_arr.push(assemblyColumn)

                        if (assemblyColumn_arr.length == 1) {
                            var assembly_tr = `<tr index="${index}" class="assembly_tr">
                                        <td rowspan="${num_trAssembly}" colspan="3">Assembly (ประกบ/ติดลิ้นกาว)</td>
                                        <td colspan="2" class="alCenter""><div class="assemblyRowComponentName">${compName} ติดกาว ${item.box_type.glued_spot} จุด</div></td>`
                        } else {
                            var assembly_tr = `<tr index="${index}" class="assembly_tr">
                                        <td colspan="2" class="alCenter""><div class="assemblyRowComponentName">${compName} ติดกาว ${item.box_type.glued_spot} จุด</div></td>`
                        }
                        assemblyRow_arr.push(assembly_tr)
                    }
                })
            })

            if (assemblyColumn_arr.length != 0) {
                assemblyColumn_arr.forEach((item, index) => {
                    tr += assemblyRow_arr[index] + item + `</tr>`
                })
            }

            break
        case 'process':
            var tr = ""
            mainData.process.forEach((item, index) => {
                if (sub_proc == 'other') {
                    var label = 'otherProcess'
                } else if (sub_proc == 'handwork') {
                    var label = 'handworkProcess'
                } else if (sub_proc == 'custom') {
                    var label = 'customProcess'
                } else {
                    console.log('sub_proc not match // process')
                }

                if (item.type == sub_proc) {

                    item.line.forEach((item1, fIndex) => {
                        var process_column = ""

                        mainData.qty.totalqty.forEach((qty, qtyIndex) => {
                            process_column += `<td class="alRight"><div class="${label}UnitPrice" index="${index}" indexqty="${qtyIndex}">${numeral(item1.unit_price).format('0,0.0000')}</div></td>
                                            <td class="alCenter"><div class="${label}RowQty" index="${index}" indexqty="${qtyIndex}">${numeral(item1.qty).format('0,0')}</div></td>
                                            <td class="alRight"><div class="${label}RowPrice" index="${index}" indexqty="${qtyIndex}">${numeral(item1.price).format('0,0.00')}</div></td>`
                        })

                        tr += `<tr class="${label}_tr" index=${index}" fIndex=${fIndex}>
                                    <td colspan="5" >${item.name}</td>
                                    ${process_column}
                                </tr>`

                    })


                    // var process_column = ""
                    // item.line.forEach((item1, index1) => {
                    //     process_column += `<td class="alRight"><div class="${label}UnitPrice" index="${index}" indexqty="${index1}">${numeral(item1.unit_price).format('0,0.0000')}</div></td>
                    //                         <td class="alCenter"><div class="${label}RowQty" index="${index}" indexqty="${index1}">${numeral(item1.qty).format('0,0')}</div></td>
                    //                         <td class="alRight"><div class="${label}RowPrice" index="${index}" indexqty="${index1}">${numeral(item1.price).format('0,0.00')}</div></td>`
                    // })
                    // tr += `<tr class="${label}_tr" index=${index}">
                    //         <td colspan="5" >${item.name}</td>
                    //         ${process_column}
                    //     </tr>`
                }
            })
            break
        //? update: 14.03.22
        case 'otherCost':
            mainData?.otherCost && mainData?.otherCost?.forEach((item, index) => {
                item.line.forEach((item1, index1) => {
                    var otherCost_column = ""
                    mainData.qty.totalqty.forEach((qty, qtyIndex) => [
                        otherCost_column += `
                        <td class="alRight"><div class="otherCostUnitPrice" index="${index}" indexqty="${index1}">${numeral(item1.unit_price).format('0,0.00')}</div></td>
                        <td class="alCenter"><div class="otherCostRowQty" index="${index}" indexqty="${index1}">${numeral(item1.qty).format('0,0.00')}</div></td>
                        <td class="alRight"><div class="otherCostRowPrice" index="${index}" indexqty="${index1}">${numeral(item1.price).format('0,0.00')}</div></td>
                    `
                    ])
                    tr += `
                    <tr class="material_tr" index=${index}">
                        <td colspan="5" >${item.name}</td>
                        ${otherCost_column}
                    </tr>
                    `
                })
            })
            break

    }
    return tr
}

function summary_packing_tr() {
    const comp_arr = est.mainData.component1

    var num_trPaperband = 0,
        num_trKraftwrap = 0,
        num_trCarton = 0,
        num_trPallet = 0,
        num_trDelivery = 0,
        check_packing = []

    // * count type of packaging
    comp_arr.forEach((item, index) => {
        check_packing.push({
            kraftwrap: false,
            carton: false
        })

        item.packing[0].forEach((item1) => {
            if (item1.name == 'paperband') {
                num_trPaperband += 1
            }
            if (item1.name == 'kraftwrap') {
                num_trKraftwrap += 1
                check_packing[index].kraftwrap = true
            }
            if (item1.name == 'carton') {
                num_trCarton += 1
                check_packing[index].carton = true
            }
            if (item1.name == 'pallet') {
                num_trPallet += 1
            }
        })
        if (check_packing[index].kraftwrap == false && check_packing[index].carton == false) {
            check_packing[index].unit_pallet = 'Cps/Pallet'
        } else if (check_packing[index].kraftwrap == true && check_packing[index].carton == false) {
            check_packing[index].unit_pallet = 'Pack/Pallet'
        } else if (check_packing[index].carton == true) {
            check_packing[index].unit_pallet = 'Carton/Pallet'
        }
        if (item.delivery?.length > 0) {
            num_trDelivery += item.delivery?.length || 1
        }
    })

    var paperbandColumn_arr = [],
        kraftwrapColumn_arr = [],
        cartonColumn_arr = [],
        palletColumn_arr = [],
        deliveryColumn_arr = [],
        paperbandRow_arr = [],
        kraftwrapRow_arr = [],
        cartonRow_arr = [],
        palletRow_arr = [],
        deliveryRow_arr = [],
        packing_obj = {}

    //* Loop components
    comp_arr.forEach((item, index) => {

        var paperbandColumn = "",
            kraftwrapColumn = "",
            cartonColumn = "",
            palletColumn = "",
            deliveryColumn = ""

        item.packing[0].forEach((item1) => {
            if (item1.name == 'paperband') {
                item1.line.forEach((item2, index2) => {
                    paperbandColumn += `<td  class="alRight"><div class="paperbandRowUnitprice" index="${index}" indexqty="${index2}">${numeral(item2.unit_price).format('0,0.00')}</div></td>
                                    <td  class="alCenter"><div class="paperbandRowQty" index="${index}" indexqty="${index2}">${numeral(item2.qty).format('0,0.00')}</div></td>
                                    <td  class="alRight"><div class="paperbandRowPrice" index="${index}" indexqty="${index2}">${numeral(item2.price).format('0,0.00')}</div></td>`
                })
                paperbandColumn_arr.push(paperbandColumn)
                if (paperbandColumn_arr.length == 1) {
                    var paperband_tr = `<tr class="packing_tr paperband_tr" index="${index}">
                                        <td rowspan="${num_trPaperband}" colspan="2">Paper Band</td>
                                        <td class="alCenter"><div class="paperbandRowComponentName" index="${index}">${item.component_name}</div></td>
                                        <td class="alCenter"><div class="paperbandRowUnitQty" index="${index}">${item1.info.qty_per_paperband}</div></td>
                                        <td class="alCenter"><div class="paperbandRowUnit" index="${index}">Cps/band</div></td>`
                } else {
                    var paperband_tr = `<tr class="packing_tr paperband_tr" index="${index}">
                                        <td class="alCenter"><div class="paperbandRowComponentName" index="${index}">${item.component_name}</div></td>
                                        <td class="alCenter"><div class="paperbandRowUnitQty" index="${index}">${item1.info.qty_per_paperband}</div></td>
                                        <td class="alCenter"><div class="paperbandRowUnit" index="${index}">Cps/band</div></td>`
                }
                paperbandRow_arr.push(paperband_tr)
            }
            if (item1.name == 'kraftwrap') {
                item1.line.forEach((item2, index2) => {
                    kraftwrapColumn += `<td class="alRight"><div class="kraftwrapRowUnitprice" index="${index}" indexqty="${index2}">${numeral(item2.unit_price).format('0,0.00')}</div></td>
                                    <td class="alCenter"><div class="kraftwrapRowQty" index="${index}" indexqty="${index2}">${numeral(item2.qty).format('0,0.00')}</div></td>
                                    <td class="alRight"><div class="kraftwrapRowPrice" index="${index}" indexqty="${index2}">${numeral(item2.price).format('0,0.00')}</div></td>`
                })
                kraftwrapColumn_arr.push(kraftwrapColumn)
                if (kraftwrapColumn_arr.length == 1) {
                    var kraftwrap_tr = `<tr class="packing_tr kraftwrap_tr" index="${index}">
                                        <td rowspan="${num_trKraftwrap}" colspan="2">Kraftwrap</td>
                                        <td class="alCenter"><div class="kraftwrapRowComponentName" index="${index}">${item.component_name}</div></td>
                                        <td class="alCenter"><div class="kraftwrapRowUnitQty" index="${index}">${numeral(item1.info.qty_per_pack).format('0,0')}</div></td>
                                        <td class="alCenter"><div class="kraftwrapRowUnit" index="${index}">Cps/pack</div></td>`
                } else {
                    var kraftwrap_tr = `<tr class="packing_tr kraftwrap_tr" index="${index}">
                                        <td class="alCenter"><div class="kraftwrapRowComponentName" index="${index}">${item.component_name}</div></td>
                                        <td class="alCenter"><div class="kraftwrapRowUnitQty" index="${index}">${numeral(item1.info.qty_per_pack).format('0,0')}</div></td>
                                        <td class="alCenter"><div class="kraftwrapRowUnit" index="${index}">Cps/pack</div></td>`
                }
                kraftwrapRow_arr.push(kraftwrap_tr)
            }
            if (item1.name == 'carton') {
                item1.line.forEach((item2, index2) => {
                    cartonColumn += `<td class="alRight"><div class="cartonRowUnitprice" index="${index}" indexqty="${index2}">${numeral(item2.unit_price).format('0,0.00')}</div></td>
                                    <td class="alCenter"><div class="cartonRowQty" index="${index}" indexqty="${index2}">${numeral(item2.qty).format('0,0.00')}</div></td>
                                    <td class="alRight"><div class="cartonRowPrice" index="${index}" indexqty="${index2}">${numeral(item2.price).format('0,0.00')}</div></td>`
                })
                cartonColumn_arr.push(cartonColumn)
                if (cartonColumn_arr.length == 1) {
                    var carton_tr = `<tr class="packing_tr carton_tr" index="${index}">
                                        <td rowspan="${num_trCarton}" colspan="2">Carton</td>
                                        <td class="alCenter"><div class="cartonRowComponentName" index="${index}">${item.component_name}</div></td>
                                        <td class="alCenter"><div class="cartonRowUnitQty" index="${index}">${numeral(item1.info.carton.qty_per_carton).format('0,0')}</div></td>
                                        <td class="alCenter"><div class="cartonRowUnit" index="${index}">Cps/carton</div></td>`
                } else {
                    var carton_tr = `<tr class="packing_tr carton_tr" index="${index}">
                                        <td class="alCenter"><div class="cartonRowComponentName" index="${index}">${item.component_name}</div></td>
                                        <td class="alCenter"><div class="cartonRowUnitQty" index="${index}">${numeral(item1.info.carton.qty_per_carton).format('0,0')}</div></td>
                                        <td class="alCenter"><div class="cartonRowUnit" index="${index}">Cps/carton</div></td>`
                }
                cartonRow_arr.push(carton_tr)
            }
            if (item1.name == 'pallet') {
                item1.line.forEach((item2, index2) => {
                    palletColumn += `<td class="alRight"><div class="cartonRowUnitprice" index="${index}" indexqty="${index2}">${numeral(item2.unit_price).format('0,0.00')}</div></td>
                                    <td class="alCenter"><div class="cartonRowQty" index="${index}" indexqty="${index2}">${numeral(item2.qty).format('0,0.00')}</div></td>
                                    <td class="alRight"><div class="cartonRowPrice" index="${index}" indexqty="${index2}">${numeral(item2.price).format('0,0.00')}</div></td>`
                })
                palletColumn_arr.push(palletColumn)
                if (palletColumn_arr.length == 1) {
                    var pallet_tr = `<tr class="packing_tr pallet_tr" index="${index}">
                                        <td rowspan="${num_trPallet}" colspan="2">Pallet</td>
                                        <td class="alCenter"><div class="palletRowComponentName" index="${index}">${item.component_name}</div></td>
                                        <td class="alCenter"><div class="palletRowUnitQty" index="${index}">${numeral(item1.info.bulk_qty_pallet).format('0,0')}</div></td>
                                        <td class="alCenter""><div class="palletRowUnit" index="${index}">${check_packing[index].unit_pallet}</div></td>`
                } else {
                    var pallet_tr = `<tr class="packing_tr pallet_tr" index="${index}">
                                        <td class="alCenter"><div class="palletRowComponentName" index="${index}">${item.component_name}</div></td>
                                        <td class="alCenter"><div class="palletRowUnitQty" index="${index}">${numeral(item1.info.bulk_qty_pallet).format('0,0')}</div></td>
                                        <td class="alCenter"><div class="palletRowUnit" index="${index}">${check_packing[index].unit_pallet}</div></td>`
                }
                palletRow_arr.push(pallet_tr)
            }
        })

        if (item.delivery?.length > 0) {
            item.delivery[0].price.forEach((item1) => {
                deliveryColumn += `<td class="alRight"><div class="deliveryRowUnitPrice" index="${index}" indexqty="${item1}">${numeral(item1.unit_price).format('0,0.00')}</div></td>
                                <td class="alCenter"><div class="deliveryRowQty" index="${index}" indexqty="${item1}">${numeral(item1.qty).format('0,0.00')}</div></td>
                                <td class="alRight"><div class="deliveryRowPrice" index="${index}" indexqty="${item1}">${numeral(item1.price).format('0,0.00')}</div></td>`
            })

            deliveryColumn_arr.push(deliveryColumn)

            if (deliveryColumn_arr.length == 1) {
                var delivery_tr = `<tr class="packing_tr delivery_tr" index="${index}">
                                    <td rowspan="${num_trDelivery}" colspan="3">Delivery</td>
                                    <td colspan="2" class="alCenter"><div class="deliveryRowComponentname" index="${index}">${item.component_name}</div></td>`
            } else {
                var delivery_tr = `<tr class="packing_tr delivery_tr" index="${index}">
                                    <td colspan="2" class="alCenter"><div class="deliveryRowComponentname" index="${index}">${item.component_name}</div></td>`
            }

            deliveryRow_arr.push(delivery_tr)
        }

        packing_obj = {
            paperband_tr: "",
            kraftwrap_tr: "",
            carton_tr: "",
            pallet_tr: "",
            delivery_tr: ""
        }

        if (paperbandColumn_arr.length != 0) {
            paperbandColumn_arr.forEach((item, index) => {
                packing_obj.paperband_tr += paperbandRow_arr[index] + item + `</tr>`
            })
        }
        if (kraftwrapColumn_arr.length != 0) {
            kraftwrapColumn_arr.forEach((item, index) => {
                packing_obj.kraftwrap_tr += kraftwrapRow_arr[index] + item + `</tr>`
            })
        }
        if (cartonColumn_arr.length != 0) {
            cartonColumn_arr.forEach((item, index) => {
                packing_obj.carton_tr += cartonRow_arr[index] + item + `</tr>`
            })
        }
        if (palletColumn_arr.length != 0) {
            palletColumn_arr.forEach((item, index) => {
                packing_obj.pallet_tr += palletRow_arr[index] + item + `</tr>`
            })
        }
        if (deliveryColumn_arr.length != 0) {
            deliveryColumn_arr.forEach((item, index) => {
                packing_obj.delivery_tr += deliveryRow_arr[index] + item + `</tr>`
            })
        }
    })

    return packing_obj
}

function summary_packing_tr2() {
    const isMultipleF = getIsMultipleF()
    const { is_different_packing = false } = est.mainData.job || {}
    const comp_arr = est.mainData.component1
    const delivery = est.mainData?.delivery || []

    var num_trPaperband = 0,
        num_trKraftwrap = 0,
        num_trCarton = 0,
        num_trPallet = 0,
        num_trDelivery = 0,
        check_packing = []

    // * count type of packaging
    comp_arr.forEach((item, index) => {
        const packingLength = is_different_packing ? item?.f_detail?.f_list?.length : 1
        for (let fIndex = 0; fIndex < packingLength; fIndex++) {
            check_packing.push([])

            const check_has_delivery = item.packing[fIndex].every(obj => obj?.detail?.length > 0)

            check_packing[fIndex].push({
                kraftwrap: false,
                carton: false
            })

            item.packing[fIndex].forEach((item1) => {
                if (item1.name == 'paperband') {
                    num_trPaperband += 1
                    check_packing[fIndex][index].paperband = true
                }
                if (item1.name == 'kraftwrap') {
                    num_trKraftwrap += 1
                    check_packing[fIndex][index].kraftwrap = true
                }
                if (item1.name == 'carton') {
                    num_trCarton += 1
                    check_packing[fIndex][index].carton = true
                }
                if (item1.name == 'pallet') {
                    num_trPallet += 1
                }
            })
            // * + row span split delivery
            // * check delivery
            if (check_has_delivery) {
                item.packing[fIndex].forEach(packing => {
                    if (packing.name === 'kraftwrap') {
                        num_trKraftwrap += packing.detail?.length - 1
                    } else if (packing.name === 'carton') {
                        num_trCarton += packing.detail?.length - 1
                    } else if (packing.name === 'pallet') {
                        num_trPallet += packing.detail?.length - 1
                    } else if (packing.name === 'paperband') {
                        num_trPaperband += packing.detail?.length - 1
                    }
                })
            }

            if (check_packing[fIndex][index].kraftwrap == false && check_packing[fIndex][index].carton == false) {
                check_packing[fIndex][index].unit_pallet = 'Cps/Pallet'

            } else if (check_packing[fIndex][index].kraftwrap == true && check_packing[fIndex][index].carton == false) {
                check_packing[fIndex][index].unit_pallet = 'Pack/Pallet'

            } else if (check_packing[fIndex][index].carton == true) {
                check_packing[fIndex][index].unit_pallet = 'Carton/Pallet'
            }
        }

    })

    // * หาจำนวนรวมของเรทส่งส่งทุกรอบ
    /*
    delivery.length = รอบส่ง
    */

    var paperbandRow_arr = [],
        kraftwrapRow_arr = [],
        cartonRow_arr = [],
        palletRow_arr = [],
        packing_obj = {}

    //* Loop components
    let checkFirst = {
        paperband: 0,
        kraftwrap: 0,
        carton: 0,
        pallet: 0
    }

    comp_arr.forEach((item, compIndex) => {
        const packingLength = is_different_packing ? item?.f_detail?.f_list?.length : 1
        var paperbandCompTr = "",
            kraftwrapCompTr = "",
            cartonCompTr = "",
            palletCompTr = ""

        for (let fIndex = 0; fIndex < packingLength; fIndex++) {
            let compName = item.component_name
            var paperbandColumn = "",
                kraftwrapColumn = "",
                cartonColumn = "",
                palletColumn = ""

            if (isMultipleF) {
                compName = packingLength == 1 ? 'All' : item?.f_detail?.f_list[fIndex]?.f_code || 'Error'
            }

            item.packing[fIndex].forEach((item1) => {
                let newTr = ''

                if (item1.name == 'paperband') {
                    // * loop by delivery round.
                    newTr = item1.detail.map((roundDetail, roundIndex) => {
                        // * draw <td></td> by number of qty.
                        paperbandColumn = roundDetail.detail.map(qtyDetail =>
                            `<td class="alRight"><div class="paperbandRowUnitprice" index="${compIndex}" indexqty="0">${numeral(qtyDetail.unit_price).format('0,0.00')}</div></td>
                        <td class="alCenter"><div class="paperbandRowQty" index="${compIndex}" indexqty="0">${numeral(qtyDetail.qty).format('0,0.00')}</div></td>
                        <td class="alRight"><div class="paperbandRowPrice" index="${compIndex}" indexqty="0">${numeral(qtyDetail.price).format('0,0.00')}</div></td>`
                        )

                        // * draw <tr></tr> by number of round of delivery
                        let paperband_tr = ""
                        if (checkFirst.paperband === 0 && roundIndex === 0) {
                            //* Title of summary table tr โชว์ หัวข้อ paperband ให้แสดงชื่อ Comp. และ qty_per_paperband
                            paperband_tr = `<tr class="packing_tr paperband_tr" index="${compIndex}">
                            <td rowspan="${num_trPaperband}" colspan="2">Paperband</td>
                            <td rowspan="${item1.detail.length}" class="alCenter"><div class="paperbandRowComponentName" index="${compIndex}">${compName}</div></td>
                            <td rowspan="${item1.detail.length}" class="alCenter"><div class="paperbandRowUnitQty" index="${compIndex}">${numeral(item1.info.qty_per_paperband).format('0,0')}</div></td>
                            <td rowspan="${item1.detail.length}" class="alCenter"><div class="paperbandRowUnit" index="${compIndex}">Cps/band</div></td>
                            ${paperbandColumn}
                        </tr>
                        `
                        } else {
                            if (roundIndex === 0) {
                                // * รอบแรกของแต่ละ Comp. ให้แสดงชื่อ Comp. และ qty_per_paperband
                                paperband_tr = `<tr class="packing_tr paperband_tr" index="${compIndex}">
                                <td rowspan="${item1.detail.length}" class="alCenter"><div class="paperbandRowComponentName" index="${compIndex}">${compName}</div></td>
                                <td rowspan="${item1.detail.length}" class="alCenter"><div class="paperbandRowUnitQty" index="${compIndex}">${numeral(item1.info.qty_per_paperband).format('0,0')}</div></td>
                                <td rowspan="${item1.detail.length}" class="alCenter"><div class="paperbandRowUnit" index="${compIndex}">Cps/band</div></td>
                                ${paperbandColumn}
                            </tr>
                            `
                            } else {
                                // * รอบส่งอื่นๆให้แสดงเฉพาะจำนวน และราคา
                                paperband_tr = `<tr class="packing_tr paperband_tr" index="${compIndex}">
                                ${paperbandColumn}
                            </tr>
                            `
                            }
                        }
                        checkFirst.paperband += 1
                        return paperband_tr
                    })

                    paperbandCompTr = [...paperbandCompTr, ...newTr]
                }

                if (item1.name == 'kraftwrap') {
                    // * loop by qty.
                    // item1.line.forEach((item2,index2)=>{
                    //     kraftwrapColumn+=`<td class="alRight"><div class="kraftwrapRowUnitprice" index="${compIndex}" indexqty="${index2}">${numeral(item2.unit_price).format('0,0.00')}</div></td>
                    //                     <td class="alCenter"><div class="kraftwrapRowQty" index="${compIndex}" indexqty="${index2}">${numeral(item2.qty).format('0,0.00')}</div></td>
                    //                     <td class="alRight"><div class="kraftwrapRowPrice" index="${compIndex}" indexqty="${index2}">${numeral(item2.price).format('0,0.00')}</div></td>`
                    // })
                    // * loop by delivery round.
                    newTr = item1.detail.map((roundDetail, roundIndex) => {
                        // * draw <td></td> by number of qty.
                        kraftwrapColumn = roundDetail.detail.map(qtyDetail =>
                            `<td class="alRight"><div class="kraftwrapRowUnitprice" index="${compIndex}" indexqty="0">${numeral(qtyDetail.unit_price).format('0,0.00')}</div></td>
                        <td class="alCenter"><div class="kraftwrapRowQty" index="${compIndex}" indexqty="0">${numeral(qtyDetail.qty).format('0,0.00')}</div></td>
                        <td class="alRight"><div class="kraftwrapRowPrice" index="${compIndex}" indexqty="0">${numeral(qtyDetail.price).format('0,0.00')}</div></td>`
                        )

                        // * draw <tr></tr> by number of round of delivery
                        let kraftwrap_tr = ""
                        if (checkFirst.kraftwrap === 0 && roundIndex === 0) {
                            //* Title of summary table tr โชว์ หัวข้อ Kraftwrap ให้แสดงชื่อ Comp. และ qty_per_pack
                            kraftwrap_tr = `<tr class="packing_tr kraftwrap_tr" index="${compIndex}">
                            <td rowspan="${num_trKraftwrap}" colspan="2">Kraftwrap</td>
                            <td rowspan="${item1.detail.length}" class="alCenter"><div class="kraftwrapRowComponentName" index="${compIndex}">${compName}</div></td>
                            <td rowspan="${item1.detail.length}" class="alCenter"><div class="kraftwrapRowUnitQty" index="${compIndex}">${numeral(item1.info.qty_per_pack).format('0,0')}</div></td>
                            <td rowspan="${item1.detail.length}" class="alCenter"><div class="kraftwrapRowUnit" index="${compIndex}">Cps/pack</div></td>
                            ${kraftwrapColumn}
                        </tr>
                        `
                        } else {
                            if (roundIndex === 0) {
                                // * รอบแรกของแต่ละ Comp. ให้แสดงชื่อ Comp. และ qty_per_pack
                                kraftwrap_tr = `<tr class="packing_tr kraftwrap_tr" index="${compIndex}">
                                <td rowspan="${item1.detail.length}" class="alCenter"><div class="kraftwrapRowComponentName" index="${compIndex}">${compName}</div></td>
                                <td rowspan="${item1.detail.length}" class="alCenter"><div class="kraftwrapRowUnitQty" index="${compIndex}">${numeral(item1.info.qty_per_pack).format('0,0')}</div></td>
                                <td rowspan="${item1.detail.length}" class="alCenter"><div class="kraftwrapRowUnit" index="${compIndex}">Cps/pack</div></td>
                                ${kraftwrapColumn}
                            </tr>
                            `
                            } else {
                                // * รอบส่งอื่นๆให้แสดงเฉพาะจำนวน และราคา
                                kraftwrap_tr = `<tr class="packing_tr kraftwrap_tr" index="${compIndex}">
                                ${kraftwrapColumn}
                            </tr>
                            `
                            }
                        }
                        checkFirst.kraftwrap += 1
                        return kraftwrap_tr
                    })

                    kraftwrapCompTr = [...kraftwrapCompTr, ...newTr]
                }

                if (item1.name == 'carton') {
                    // * loop by delivery round.
                    newTr = item1.detail.map((roundDetail, roundIndex) => {
                        // * draw <td></td> by number of qty.
                        cartonColumn = roundDetail.detail.map(qtyDetail =>
                            `<td class="alRight"><div class="cartonRowUnitprice" index="${compIndex}" indexqty="0">${numeral(qtyDetail.unit_price).format('0,0.00')}</div></td>
                        <td class="alCenter"><div class="cartonRowQty" index="${compIndex}" indexqty="0">${numeral(qtyDetail.qty).format('0,0.00')}</div></td>
                        <td class="alRight"><div class="cartonRowPrice" index="${compIndex}" indexqty="0">${numeral(qtyDetail.price).format('0,0.00')}</div></td>`
                        )

                        // * draw <tr></tr> by number of round of delivery
                        let carton_tr = ""
                        if (checkFirst.carton === 0 && roundIndex === 0) {
                            //* Title of summary table tr โชว์ หัวข้อ carton ให้แสดงชื่อ Comp. และ qty_per_carton
                            carton_tr = `<tr class="packing_tr carton_tr" index="${compIndex}">
                            <td rowspan="${num_trCarton}" colspan="2">Carton</td>
                            <td rowspan="${item1.detail.length}" class="alCenter"><div class="cartonRowComponentName" index="${compIndex}">${compName}</div></td>
                            <td rowspan="${item1.detail.length}" class="alCenter"><div class="cartonRowUnitQty" index="${compIndex}">${numeral(item1.info.carton.qty_per_carton).format('0,0')}</div></td>
                            <td rowspan="${item1.detail.length}" class="alCenter"><div class="cartonRowUnit" index="${compIndex}">Cps/carton</div></td>
                            ${cartonColumn}
                        </tr>
                        `
                        } else {
                            if (roundIndex === 0) {
                                // * รอบแรกของแต่ละ Comp. ให้แสดงชื่อ Comp. และ qty_per_carton
                                carton_tr = `<tr class="packing_tr carton_tr" index="${compIndex}">
                                <td rowspan="${item1.detail.length}" class="alCenter"><div class="cartonRowComponentName" index="${compIndex}">${compName}</div></td>
                                <td rowspan="${item1.detail.length}" class="alCenter"><div class="cartonRowUnitQty" index="${compIndex}">${numeral(item1.info.carton.qty_per_carton).format('0,0')}</div></td>
                                <td rowspan="${item1.detail.length}" class="alCenter"><div class="cartonRowUnit" index="${compIndex}">Cps/carton</div></td>
                                ${cartonColumn}
                            </tr>
                            `
                            } else {
                                // * รอบส่งอื่นๆให้แสดงเฉพาะจำนวน และราคา
                                carton_tr = `<tr class="packing_tr carton_tr" index="${compIndex}">
                                ${cartonColumn}
                            </tr>
                            `
                            }
                        }
                        checkFirst.carton += 1
                        return carton_tr
                    })

                    cartonCompTr = [...cartonCompTr, ...newTr]
                }

                if (item1.name == 'pallet') {
                    // * loop by delivery round.
                    newTr = item1.detail.map((roundDetail, roundIndex) => {
                        // * draw <td></td> by number of qty.
                        palletColumn = roundDetail.detail.map(qtyDetail =>
                            `<td class="alRight"><div class="palletRowUnitprice" index="${compIndex}" indexqty="0">${numeral(qtyDetail.unit_price).format('0,0.00')}</div></td>
                        <td class="alCenter"><div class="palletRowQty" index="${compIndex}" indexqty="0">${numeral(qtyDetail.qty).format('0,0.00')}</div></td>
                        <td class="alRight"><div class="palletRowPrice" index="${compIndex}" indexqty="0">${numeral(qtyDetail.price).format('0,0.00')}</div></td>`
                        )

                        // * draw <tr></tr> by number of round of delivery
                        let pallet_tr = ""
                        if (checkFirst.pallet === 0 && roundIndex === 0) {
                            //* Title of summary table tr โชว์ หัวข้อ pallet ให้แสดงชื่อ Comp. และ qty_per_pallet
                            pallet_tr = `<tr class="packing_tr pallet_tr" index="${compIndex}">
                            <td rowspan="${num_trPallet}" colspan="2">Pallet</td>
                            <td rowspan="${item1.detail.length}" class="alCenter"><div class="palletRowComponentName" index="${compIndex}">${compName}</div></td>
                            <td rowspan="${item1.detail.length}" class="alCenter"><div class="palletRowUnitQty" index="${compIndex}">${numeral(item1.info.bulk_qty_pallet).format('0,0')}</div></td>
                            <td rowspan="${item1.detail.length}" class="alCenter"><div class="palletRowUnit" index="${compIndex}">${check_packing[fIndex][compIndex].unit_pallet}</div></td>
                            ${palletColumn}
                        </tr>
                        `
                        } else {
                            if (roundIndex === 0) {
                                // * รอบแรกของแต่ละ Comp. ให้แสดงชื่อ Comp. และ qty_per_pallet
                                pallet_tr = `<tr class="packing_tr pallet_tr" index="${compIndex}">
                                <td rowspan="${item1.detail.length}" class="alCenter"><div class="palletRowComponentName" index="${compIndex}">${compName}</div></td>
                                <td rowspan="${item1.detail.length}" class="alCenter"><div class="palletRowUnitQty" index="${compIndex}">${numeral(item1.info.bulk_qty_pallet).format('0,0')}</div></td>
                                <td rowspan="${item1.detail.length}" class="alCenter"><div class="palletRowUnit" index="${compIndex}">${check_packing[fIndex][compIndex].unit_pallet}</div></td>
                                ${palletColumn}
                            </tr>
                            `
                            } else {
                                // * รอบส่งอื่นๆให้แสดงเฉพาะจำนวน และราคา
                                pallet_tr = `<tr class="packing_tr pallet_tr" index="${compIndex}">
                                ${palletColumn}
                            </tr>


                            `
                            }
                        }
                        checkFirst.pallet += 1
                        return pallet_tr
                    })

                    palletCompTr = [...palletCompTr, ...newTr]
                }
            })
        }

        packing_obj = {
            paperband_tr: "",
            kraftwrap_tr: "",
            carton_tr: "",
            pallet_tr: "",
            delivery_tr: ""
        }

        // if(paperbandColumn_arr.length!=0){
        //     paperbandColumn_arr.forEach((item,index)=>{
        //         packing_obj.paperband_tr+=paperbandRow_arr[index]+item+`</tr>`
        //     })
        // }
        if (paperbandCompTr.length > 0) {
            paperbandRow_arr.push(paperbandCompTr.join(""))
        }
        if (kraftwrapCompTr.length > 0) {
            kraftwrapRow_arr.push(kraftwrapCompTr.join(""))
        }
        if (cartonCompTr.length > 0) {
            cartonRow_arr.push(cartonCompTr.join(""))
        }
        if (palletCompTr.length > 0) {
            palletRow_arr.push(palletCompTr.join(""))
        }
    })
    // * concat tr element string
    packing_obj.paperband_tr = paperbandRow_arr.join("")
    packing_obj.kraftwrap_tr = kraftwrapRow_arr.join("")
    packing_obj.carton_tr = cartonRow_arr.join("")
    packing_obj.pallet_tr = palletRow_arr.join("")


    //* หาจำนวนแถวที่ต้อง rowspan  // prev = จำนวน rate ในแต่ละรอบส่ง
    const tr_rowspan = delivery?.reduce((prev, curr) =>
        prev += curr?.qty_rate?.reduce((prevRate, currRate) => //* prev (จำนวน rate รวมของทุกรอบส่ง) += จำนวน rate ที่มากที่สุดของยอด qty ทั้งหมด
            prevRate = prevRate < currRate.length  //*ค่าก่อนหน้า < ค่าปัจจุบัน
                ? currRate.length
                : prevRate
            , 0 //*ค่าเริ่มต้นของ qty_rate.reduce
        ), 0) //*ค่าเริ่มต้นของ delivery.reduce

    // * delivery process
    if (tr_rowspan > 0) {
        packing_obj.delivery_tr = delivery.map((obj, roundIndex) => {
            //* 1. รอบส่ง
            const tr_round_rowspan = obj.qty_rate.reduce((max, curr) => max = max < curr.length ? curr.length : max, 0)
            let tr = obj.rate_line.map((line, lineIndex) => {
                /*
                rate_line = จำนวนเรทส่ง // 1 ยอด อาจมีเรทส่งได้มากกว่า1 เรท ขึ้นอยู่กับน้ำหนัก
                line = เรทส่ง, lineIndex = ลำดับของเรทส่ง
                */

                let td = '', tr_line = ''

                line.forEach((qtyInfo, qtyIndex) => {
                    /*
                        qtyInfo = ยอดส่งนั้นๆ, qtyIndex = ลำดับของยอดส่ง
                    */
                    td += `<td class="alRight"><div class="deliveryRowUnitPrice" index="${roundIndex}" indexqty="${qtyIndex}">${numeral(qtyInfo.unit_price).format('0,0.00')}</div></td>
                        <td class="alCenter"><div class="deliveryRowQty" index="${roundIndex}" indexqty="${qtyIndex}">${numeral(qtyInfo.qty).format('0,0.00')}</div></td>
                        <td class="alRight"><div class="deliveryRowPrice" index="${roundIndex}" indexqty="${qtyIndex}">${numeral(qtyInfo.price).format('0,0.00')}</div></td>`
                })

                if (roundIndex === 0 && lineIndex === 0) {
                    //! รอบส่งแรก + เรทส่งแรก
                    tr_line += `<tr class="packing_tr delivery_tr" index="${roundIndex}">
                        <td rowspan="${tr_rowspan}" colspan="2">Delivery</td>
                        <td rowspan="${tr_round_rowspan}" colspan="3" class="alCenter"><div class="deliveryRowComponentname" index="${roundIndex}">${obj.destinationName} ${obj.dueDate ? `- ${moment(obj.dueDate, "YYYY-MM-DD").format("DD/MM/YYYY")}` : ""}</div></td>
                        ${td}
                    </tr>
                    `
                } else {
                    // ! รอบส่งครั้งถัดๆไป
                    if (lineIndex === 0) {
                        // ! จำนวนแรก
                        tr_line += `<tr class="packing_tr delivery_tr" index="${roundIndex}">
                            <td rowspan="${tr_round_rowspan}" colspan="3" class="alCenter"><div class="deliveryRowComponentname" index="${roundIndex}">${obj.destinationName} ${obj.dueDate ? `- ${moment(obj.dueDate, "YYYY-MM-DD").format("DD/MM/YYYY")}` : ""}</div></td>
                            ${td}
                        </tr>
                        `
                    } else {
                        // ! จำนวนอื่นๆ
                        tr_line += `<tr class="packing_tr delivery_tr" index="${roundIndex}">
                            ${td}
                        </tr>
                        `
                    }

                }

                return tr_line
            })
            return tr
        }).join("")
    }

    return packing_obj
}

function summary_total_tr(tb_total_row) {
    const { enable_price_check } = JSON.parse(localStorage.getItem('data'))
    const mainData = est.mainData
    var totalColumn = "", remark = '',
        tr = "", total_label, total_price, align_class1, align_class2, align_class3
    mainData?.totalprice?.forEach((item, index) => {
        switch (tb_total_row) {
            case 'Material':
                total_price = item.material
                total_label = 'Total (Material)'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                align_class3 = ""
                break
            case 'Print':
                total_price = item.print
                total_label = 'Total (Print)'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                align_class3 = ""
                break
            case 'Plate':
                total_price = item.plate
                total_label = 'Total (Plate)'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                align_class3 = ""
                break
            case 'Proof':
                total_price = item?.proof || 0
                total_label = 'Total (Proof)'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                align_class3 = ""
                break
            case 'Process':
                total_price = item.afterpress
                total_label = 'Total (Process)'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                align_class3 = ""
                break
            case 'Packing':
                total_price = item.delivery
                total_label = 'Total (Packing)'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                align_class3 = ""
                break
            case 'MarkUp':
                total_price = item?.mark_up_price || 0
                total_label = 'Mark up'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                align_class3 = "alCenter"
                break
            case 'MarkDown':
                total_price = item?.mark_down_price || 0
                total_label = 'Mark down'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                align_class3 = "alCenter"
                break

            case 'MarkingPercentMaterial':
                total_price = item?.total_marking_material || 0
                total_label = ''
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                align_class3 = ""
                break
            case 'MarkingPercentProduction':
                total_price = item?.total_marking_production || 0
                total_label = ''
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                align_class3 = ""
                break
            case 'SubtotalPriceMaterial':
                total_price = item?.sub_total_price_material_marking
                total_label = 'Subtotal Price (Materials)'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                align_class3 = ""
                break
            case 'SubtotalPriceProduction':
                total_price = item?.sub_total_price_production_marking
                total_label = 'Subtotal Price (Production)'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                align_class3 = ""
                break
            case 'Price':
                total_price = item.total_price
                total_label = 'Subtotal Price'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                align_class3 = ""
                break
            case 'DiffPrice':
                total_price = item?.total_with_price_diff
                remark = ``
                total_label = 'Subtotal Price + ค่าของขวัญลูกค้า + ส่วนต่างลูกค้า'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                align_class3 = ""
                break
            case 'CustomerPriceDiff':
                total_price = item?.price_diff
                remark = `<input type="text" readonly value='${mainData?.priceDiff?.length ? mainData?.priceDiff[index] : ''}' class='readonly text-center' style='width:65px;'>`
                total_label = 'ส่วนต่างลูกค้า'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                align_class3 = ""
                break
            case 'Gift':
                total_price = item?.customer_gift
                remark = `<input type="text" readonly value='${mainData?.customer_gift?.length ? mainData?.customer_gift[index] : ''}' class='readonly text-center' style='width:65px;'>`
                total_label = 'ค่าของขวัญลูกค้า'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                align_class3 = ""
                break
            case 'Tax':
                total_price = item.tax
                total_label = 'Tax ' + mainData.tax + ' %'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                align_class3 = ""
                break
            case 'FinalPrice':
                total_price = item.final_price
                total_label = 'Total Price'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                align_class3 = ""
                break
            case 'ProfitSharing':
                total_price = item?.profit_sharing || 0
                total_label = 'Profit Sharing'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                break
            case 'UnitPrice':
                total_price = item.unit_price
                total_label = 'Unit Price/cps'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                align_class3 = ""
                break
            case 'UnitPriceExchange':
                total_price = item?.unit_price_exchange || item?.unit_price
                total_label = 'Unit Price ( Exchange )'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                align_class3 = ""
                break
            case 'Exchange':
                total_price = item?.exchange_rate || 1
                total_label = 'Exchange Rate'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                align_class3 = ""
                break
            case 'Other':
                total_price = item.other
                total_label = 'Total (Other)'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                align_class3 = ""
                break
        }
        console.log("summary_total_tr", item)
        switch (tb_total_row) {
            case 'MarkUp':
            case 'MarkDown':
                const markingPercent = tb_total_row === 'MarkDown'
                    ? item['mark_down_percent'] || Math.abs(item['marking_percent']) || 0
                    : item['mark_up_percent'] || 0

                totalColumn += `
                    <td colspan="2" class="${align_class3}">
                        <div class="${tb_total_row}" index="${index}"> 
                            <input style="width:40px;text-align:center" value="${markingPercent}"> %
                        </div>
                    </td>
                    <td class="${align_class1}">
                        <div class="total${tb_total_row}" indexqty="${index}">${numeral(total_price).format('0,0.00')}</div>
                    </td>
                `
                break;
            case 'MarkingPercentMaterial':
                totalColumn += `
                    <td colspan="2" class="${align_class3}">
                        <div class="${tb_total_row} ${align_class1}" index="${index}"> 
                            <input style="width:40px;text-align:center" value="${item['marking_material_percent'] || 0}"> %
                        </div>
                    </td>
                    <td class="${align_class1}">
                        <div class="total${tb_total_row}" indexqty="${index}">${numeral(total_price).format('0,0.00')}</div>
                    </td>
                `
                break;
            case 'MarkingPercentProduction':
                totalColumn += `
                    <td colspan="2" class="${align_class3}">
                        <div class="${tb_total_row} ${align_class1}" index="${index}"> 
                            <input style="width:40px;text-align:center" value="${item['marking_production_percent'] || 0}"> %
                        </div>
                    </td>
                    <td class="${align_class1}">
                        <div class="total${tb_total_row}" indexqty="${index}">${numeral(total_price).format('0,0.00')}</div>
                    </td>
                `
                break;
            case 'SubtotalPriceMaterial':
                let displayUnitPriceMaterial = !item?.marking_material_percent ?
                    item?.unit_price_material ? `@${item?.unit_price_material}` : ''
                    : `@${item?.unit_price_material} -> @${item?.unit_price_material_marking}`

                totalColumn += `
                    <td colspan="2" class="${align_class3}">
                        <div class="${tb_total_row} ${align_class1}" index="${index}"> 
                           ${displayUnitPriceMaterial}
                        </div>
                    </td>
                    <td class="${align_class1}">
                        <div class="total${tb_total_row}" indexqty="${index}">${numeral(item['sub_total_price_material_marking']).format('0,0.00')}</div>
                    </td>
                `
                break;
            case 'SubtotalPriceProduction':
                let displayUnitPriceProduction = !item?.marking_production_percent ?
                    item?.unit_price_production ? `@${item?.unit_price_production}` : ''
                    : `@${item?.unit_price_production} -> @${item?.unit_price_production_marking}`

                totalColumn += `
                    <td colspan="2" class="${align_class3}">
                        <div class="${tb_total_row} ${align_class1}" index="${index}"> 
                            ${displayUnitPriceProduction}
                        </div>
                    </td>
                    <td class="${align_class1}">
                        <div class="total${tb_total_row}" indexqty="${index}">${numeral(item['sub_total_price_production_marking']).format('0,0.00')}</div>
                    </td>
                `
                break;
            case 'Exchange':
                totalColumn += `<td colspan="2"></td><td></td>`
                break;
            case 'UnitPriceExchange':
                totalColumn += `
                    <td colspan="2" class="${align_class1}">${remark}</td>
                    <td class="${align_class1}">
                        <div class="total${tb_total_row}" indexqty="${index}">${numeral(total_price).format('0,0.0000')}</div>
                    </td>
                `
                break;
            default:

                totalColumn += `
                    <td colspan="2" class="${align_class1}">${remark}</td>
                    <td class="${align_class1}">
                        <div class="total${tb_total_row}" indexqty="${index}">${numeral(total_price).format('0,0.00')}</div>
                    </td>
                `
                break;
        }

    })

    if (tb_total_row == 'Tax') {
        tr = `<tr class="totalRow total${tb_total_row}_tr">
            <td colspan="5" class="${align_class2}"><div id="tax">Tax <input style="width:40px;text-align:center" ${!enable_price_check ? 'readonly' : ''} value="${mainData.tax}"> %</div></td>
            ${totalColumn}
        </tr>`
    } else if (tb_total_row == 'Exchange') {
        tr = `<tr class="totalRow total${tb_total_row}_tr">
            <td colspan="3" class="${align_class2}">
                Exchange Rate
            </td>
            <td class="${align_class2}">
                <select class="select_currency_no" style="width:80px;text-align:center;">
                    <option value="THB">THB</option>
                </select>
            </td>
            <td class="${align_class2}">
                <span class="exchange_rate">1</span>
            </td>
            ${totalColumn}
        </tr>`
    } else if (tb_total_row == 'UnitPriceExchange') {
        tr = `<tr class="totalRow total${tb_total_row}_tr">
                <td colspan="4" class="${align_class2}">${total_label}</td>
                <td class="${align_class2}">
                    <span class="currency_no">THB</span>
                </td>
                ${totalColumn}
            </tr>`
    } else {
        tr = `<tr class="totalRow total${tb_total_row}_tr">
            <td colspan="5" class="${align_class2}">${total_label}</td>
            ${totalColumn}
        </tr>`
    }

    if (tb_total_row == 'MarkingPercentMaterial') {
        tr = `<tr class="totalRow total${tb_total_row}_tr">
            <td colspan="3" class="${align_class2}">Mark Up/Down</td>
            <td colspan="2" class="${align_class2}">Materials</td>
            ${totalColumn}
        </tr>`
    }

    if (tb_total_row == 'MarkingPercentProduction') {
        tr = `<tr class="totalRow total${tb_total_row}_tr">
            <td colspan="3" class="${align_class2}">Mark Up/Down</td>
            <td colspan="2" class="${align_class2}">Production</td>
            ${totalColumn}
        </tr>`
    }

    return tr
}

function summary_tr_weight(is_forDisplay) {
    const isMultipleF = getIsMultipleF()
    const isDiffPacking = getIsDifferentPacking()
    const comp_arr = est.mainData.component1
    var weightRow = ''

    comp_arr.forEach((comp, index) => {
        let summaryLength = isMultipleF && isDiffPacking ? comp?.f_detail?.f_list?.length : 1
        let compName = comp.component_name

        for (let fIndex = 0; fIndex < summaryLength; fIndex++) {
            let bulk, bulk_name, bulk_unit,
                kraftwrap_item, carton_item, pallet_item

            const pallet = est.getPackingObj(comp, 'pallet', fIndex)
            const unit = getUnitPacking(index, is_forDisplay, fIndex)
            const deliveryInfo = comp?.delivery[fIndex]
            let pallet_size = layer = qty_layer = '-'

            if (isMultipleF) {
                compName = summaryLength == 1 ? 'All' : comp?.f_detail?.f_list[fIndex]?.f_code || 'Error'
            }

            if (pallet != null) {
                pallet_size = pallet.info.pallet_size[0] + '" x ' + pallet.info.pallet_size[1] + '" x ' + pallet.info.pallet_size[2] + '"'
                layer = pallet.info.layer_per_pallet
                qty_layer = pallet.info.laying.qty_layer
            }

            comp.packing[fIndex].forEach((packing) => {
                if (packing.name == 'kraftwrap') {
                    kraftwrap_item = packing
                }
                if (packing.name == 'carton') {
                    carton_item = packing
                }
                if (packing.name == 'pallet') {
                    pallet_item = packing
                }
            })

            switch (unit) {
                case 'piece':
                    bulk_name = 'Pallet size'
                    bulk = [pallet_item.info.laying.cube_size[0], pallet_item.info.laying.cube_size[1], pallet_item.info.pallet_height]
                    bulk_unit = 'pcs'
                    break
                case 'kraftwrap':
                    bulk_name = 'Kraftwrap size'
                    bulk = kraftwrap_item.info.inner_size
                    bulk_unit = 'kraftwrap'
                    break
                case 'carton':
                    bulk_name = 'Carton size'
                    bulk = carton_item.info.size.inner_size
                    bulk_unit = 'carton'
                    break
            }

            weightRow += `
                <tr class="weight_tr alCenter">
                    <td rowspan="4">${compName}</td>
                    <td>Weight</td>
                    <td>${comp.weight.weight}</td>
                    <td>kg/1 cp.</td>
                    <td style="text-align:center">${bulk_name}</td>
                    <td>กว้าง</td>
                    <td>ยาว</td>
                    <td>สูง</td>
                </tr>
                <tr class="weight_tr alCenter">
                    <td>Thickness</td>
                    <td>${comp.thickness.inch.packing_thickness}</td>
                    <td>inch</td>
                    <td style="text-align:center">Inner size (inch)</td>
                    <td>${numeral(bulk[0]).format('0,0.00')}</td>
                    <td>${numeral(bulk[1]).format('0,0.00')}</td>
                    <td>${numeral(bulk[2]).format('0,0.00')}</td>
                </tr>
                <tr class="weight_tr alCenter">
                    <td>Pallet size</td>
                    <td colspan="4">${pallet_size}</td>
                    <td>Net weight</td>
                    <td><div>${numeral(deliveryInfo.net_weight).format('0,0.00')}</div></td>
                    <td>kg/pack</td>
                </tr>
                <tr class="weight_tr alCenter">
                    <td>วางสูง</td>
                    <td>${layer}</td>
                    <td>ชั้นๆ ละ</td>
                    <td>${qty_layer}</td>
                    <td>${bulk_unit}</td>
                    <td>Gross weight</td>
                    <td>${numeral(deliveryInfo.gross_weight).format('0,0.00')}</td>
                    <td>kg/pack</td>
                </tr>
            `
        }
    })

    return weightRow
}

function summary_after_packing() {
    const mainData = est.mainData
    $('#summary .packing_tr,#summary .weight_tr').remove()
    var tr_packing = summary_packing_tr2()
    $('#summary .totalOther_tr').after(tr_packing.paperband_tr, tr_packing.kraftwrap_tr, tr_packing.carton_tr, tr_packing.pallet_tr, tr_packing.delivery_tr)
    $('#summary .trRemark').before(summary_tr_weight(false))
    mainData.totalprice.forEach((item, index) => {
        $(`body #summary .MarkUp[index=${index}] input`).val(item.mark_up_percent)
        $(`body #summary .MarkDown[index=${index}] input`).val(item.mark_down_percent)
        $(`body #summary .totalMarkUp[indexqty=${index}]`).text(numeral(item.mark_up_price).format('0,0.00'))
        $(`body #summary .totalMarkDown[indexqty=${index}]`).text(numeral(item.mark_down_price).format('0,0.00'))

        // * New for 3.1 ++
        $(`body #summary .MarkingPercentMaterial[index=${index}] input`).val(item?.marking_material_percent || 0)
        $(`body #summary .MarkingPercentProduction[index=${index}] input`).val(item?.marking_production_percent || 0)
        $(`body #summary .totalMarkingPercentMaterial[indexqty=${index}]`).text(numeral(item?.total_marking_material || 0).format('0,0.00'))
        $(`body #summary .totalMarkingPercentProduction[indexqty=${index}]`).text(numeral(item?.total_marking_production || 0).format('0,0.00'))
        $(`body #summary .totalSubtotalPriceMaterial[indexqty=${index}]`).text(numeral(item?.sub_total_price_material_marking || 0).format('0,0.00'))
        $(`body #summary .totalSubtotalPriceProduction[indexqty=${index}]`).text(numeral(item?.sub_total_price_production_marking || 0).format('0,0.00'))

        let displayUnitPriceMaterial = !item?.marking_material_percent ?
            item?.unit_price_material ? `@${item?.unit_price_material}` : ''
            : `@${item?.unit_price_material} -> @${item?.unit_price_material_marking}`
        $(`body #summary .SubtotalPriceMaterial[index=${index}]`).text(displayUnitPriceMaterial)

        let displayUnitPriceProduction = !item?.marking_production_percent ?
            item?.unit_price_production ? `@${item?.unit_price_production}` : ''
            : `@${item?.unit_price_production} -> @${item?.unit_price_production_marking}`
        $(`body #summary .SubtotalPriceProduction[index=${index}]`).text(displayUnitPriceProduction)

        $('#summary .totalPacking[indexqty=' + index + ']').text(numeral(item.delivery).format('0,0.00'))
        $('#summary .totalPrice[indexqty=' + index + ']').text(numeral(item.total_price).format('0,0.00'))
        $('#summary .totalDiffPrice[indexqty=' + index + ']').text(numeral(item?.total_with_price_diff || 0).format('0,0.00'))
        $('#summary .totalTax[indexqty=' + index + ']').text(numeral(item.tax).format('0,0.00'))
        $('#summary .totalProfitSharing[indexqty=' + index + ']').text(numeral(item?.profit_sharing || 0).format('0,0.00'))
        $('#summary .totalFinalPrice[indexqty=' + index + ']').text(numeral(item.final_price).format('0,0.00'))
        $('#summary .totalUnitPrice[indexqty=' + index + ']').text(numeral(item.unit_price).format('0,0.00'))
        $('#summary .totalUnitPriceExchange[indexqty=' + index + ']').text(numeral(item?.unit_price_exchange || item?.unit_price).format('0,0.0000'))
    })
}

//? for EXCEL Summary Table
function summary_excel(is_forDisplay) {
    const { is_cancel_total_profit_sharing = false } = est.mainData?.job || {}

    $('#summaryExcel').remove()
    var tr_packing = summary_excel_packing_tr()
    var table = `<div id="summaryExcel" style="display:none" >
                    <table id="tb_excel" border cellpadding="5"><tbody></tbody></table>
                </div>`
    const trRemark = `
        <tr class="trRemark">
            <td colspan="17" class="td_remark">
                <div class="rfq_remark">
                    <label>Remark : </label>
                    <br>
                    <textarea id="rfq_remark" name="rfq_remark" rows="3" placeholder="หมายเหตุ">${est?.mainData?.remark}</textarea>
                </div>
            </td>
        </tr>
    `

    $('body').append(table)
    $('#tb_excel').append(
        summary_job_info(),
        summary_size_info(),
        summary_qty_info(),
        summary_component_spec(),
        summary_component_special_ink(),
        summary_paper_usage_tr(),
        summary_head_excel_summary(),
        summary_excel_tr('paper'),
        summary_excel_tr('corrugated'),
        summary_excel_tr('special_ink'),
        summary_excel_tr('material'),
        summary_excel_total_tr('Material'),
        summary_excel_tr('print_plate', 'plate'),
        summary_excel_total_tr('Plate'),
        summary_excel_tr('print_plate', 'print'),
        summary_excel_total_tr('Print'),
        summary_excel_tr('coating'),
        summary_excel_tr('corrugated_glued'),
        summary_excel_tr('foilstamp'),
        summary_excel_tr('bossing', 'emboss'),
        summary_excel_tr('bossing', 'deboss'),
        summary_excel_tr('diecut'),
        summary_excel_tr('main_process', 'chip'),
        summary_excel_tr('main_process', 'trim'),
        summary_excel_tr('main_process', 'bag'),
        summary_excel_tr('main_process', 'shrinkwrap'),
        summary_excel_tr('process', 'other'),
        summary_excel_tr('process', 'handwork'),
        summary_excel_tr('process', 'custom'),
        summary_excel_tr('assembly'),
        summary_excel_tr('main_process', 'inspection'),
        summary_excel_total_tr('Process'),
        summary_excel_tr('otherCost'),
        summary_excel_total_tr('Other'),
        tr_packing.paperband_tr,
        tr_packing.kraftwrap_tr,
        tr_packing.carton_tr,
        tr_packing.pallet_tr,
        tr_packing.delivery_tr,
        summary_excel_total_tr('Packing'),
        summary_excel_total_tr('MarkUp'),
        summary_excel_total_tr('MarkDown'),
        summary_excel_total_tr('Price'),
        summary_excel_total_tr('Tax'),
        is_cancel_total_profit_sharing ? '' : summary_excel_total_tr('ProfitSharing'),
        summary_excel_total_tr('FinalPrice'),
        summary_excel_total_tr('UnitPrice'),
        summary_excel_total_tr('UnitPriceExchange'),
        summary_excel_total_tr('Exchange'),
        summary_excel_tr_weight(is_forDisplay),
        trRemark,
        getTRLoss(),
    );
    // setDefaultElement()
}

function summary_job_info() {
    const mainData = est.mainData
    var tr = `<tr class="job_info_tr">
                <td>RFD ID</td>
                <td colspan="2" class="jobid_td">${mainData.job.job_id}</td>
                <td >AE</td>
                <td colspan="2" class="ae_td">${mainData.ae.ae_id}: ${mainData.ae.ae_name}</td>
                <td >Estimator</td>
                <td colspan="2" class="estimator_td">${mainData.estimator.estimator_id}: ${mainData.estimator.estimator_name}</td>
                <td >DATE</td>
                <td colspan="2">${mainData.date.create_date}</td>
            </tr>
            <tr class="job_info_tr">
                <td colspan="3">Job Name</td>
                <td colspan="3" class="jobname_td">${mainData.job.job_name}</td>
                <td >Customer</td>
                <td colspan="2" class="customer_td">${mainData.customer.customer_id}: ${mainData.customer.customer_name}</td>
            </tr>`
    return tr
}

function summary_size_info() {
    const comp_arr = est.mainData.component1
    var tr = `<tr>
                <td></td><td></td><td></td>
                <td>กว้าง</td>
                <td>ยาว</td>
                <td>สูง</td>
                <td></td>
                <td>กว้าง</td>
                <td>ยาว</td>
                <td>สูง</td>
            </tr>`
    comp_arr.forEach((item, index) => {
        tr += `<tr class="size_info_tr" index="${index}">
                <td rowspan="2" colspan="2">${item.component_name}</td>
                <td>Folded Size</td>
                <td>${item.packaging_size.fold_size[0]}</td>
                <td>${item.packaging_size.fold_size[1]}</td>
                <td>${item.packaging_size.fold_size[2]}</td>
                <td>inch</td>
                <td>${item.packaging_size.fold_size[3]}</td>
                <td>${item.packaging_size.fold_size[4]}</td>
                <td>${item.packaging_size.fold_size[5]}</td>
                <td>mm</td>
                <td colspan="2"></td><td>ชนิด Packaging</td>
                <td colspan="6">${item.box_type.type_name}</td>
            </tr>
            <tr class="size_info_tr" index="${index}">
                <td>Open Size</td>
                <td>${item.packaging_size.open_size[0]}</td>
                <td>${item.packaging_size.open_size[1]}</td>
                <td></td>
                <td>inch</td>
                <td>${item.packaging_size.open_size[2]}</td>
                <td>${item.packaging_size.open_size[3]}</td>
                <td></td>
                <td>mm</td>
            </tr>`
    })
    return tr
}

function summary_qty_info() {
    const mainData = est.mainData, comp_arr = est.mainData.component1
    var main, runon, total
    mainData.qty.main.forEach((item, index) => {
        main += `<td indexqty="${index}">${item}</td>`
        runon += `<td indexqty="${index}">${mainData.qty.runon[index]}</td>`
        total += `<td indexqty="${index}">${mainData.qty.totalqty[index]}</td>`
    })
    var num = 0, markup = 0
    comp_arr.forEach((item) => {
        if (item.component_type.type != 3) {
            num += 1
            markup = item.paper.paper_markup
        }
    })
    if (num > 0) {
        var paper_markup_tr = `tr class="paper_markup_tr">
                                <td colspan="6"></td>
                                <td>mark-up</td>
                                <td>${markup}</td>
                                <td>%</td>
                                <td colspan="2">Paper brand</td></tr>
                            </tr>`
    } else {
        var paper_markup_tr = ""
    }

    var tr = `<tr class="qty_info_tr">
                <td colspan="3">Quantity</td>
                ${main}
            </tr>
            <tr class="qty_info_tr">
                <td colspan="3">Quantity Run-on </td>
                ${runon}
            </tr>
            <tr class="qty_info_tr">
                <td colspan="3">จำนวนตัวอย่างลูกค้า</td>
                <td>${mainData.qty.customer}</td>
                <td colspan="3">จำนวนตัวอย่าง AE</td>
                <td>${mainData.qty.ae}</td>
            </tr>
            <tr class="qty_info_tr">
                <td colspan="3">Quantity ยอดรวม </td>
                ${total}
            </tr>
            ${paper_markup_tr}`
    return tr
}

function summary_component_spec() {
    const comp_arr = est.mainData.component1
    var tr, tr_tr1 = [], tr_tr2 = [], tr_addon_tr1, tr_addon_tr2
    comp_arr.forEach((item) => {
        tr_addon_tr1 = "", tr_addon_tr2 = ""
        if (item.component_type.type != 3) {
            if (item.paper.sheet_unit_price) {
                var label = "ราคา/แผ่น", unit_price = " B/Sheet"
            } else {
                var label = "ราคา/ม้วน", unit_price = " B/Kg"
            }
            tr_addon_tr1 += `<td class="paper_td">Paper Type</td>
                            <td class="paper_td">${item.paper.paper_name}</td>
                            <td class="paper_td">${item.paper.paper_gram}</td>
                            <td class="paper_td">Gsm</td>
                            <td class="paper_td">Brand</td>
                            <td class="paper_td">${label}</td>`
            tr_addon_tr2 += `<td class="paper_td">${item.paper.paper_percent}</td>
                            <td class="paper_td">Cost</td>
                            <td class="paper_td">${item.paper.paper_cost}</td>
                            <td class="paper_td">Sale</td>
                            <td class="paper_td">${item.paper.paper_total_price}</td>
                            <td class="paper_td">${unit_price}</td>`
            if (item.corrugated_layer) {
                tr_addon_tr1 += `<td class="corrugated_td">Corrugated Board</td>
                            <td class="corrugated_td">${item.corrugated_layer.info.num_layer}</td>
                            <td class="corrugated_td">ชั้น</td>
                            <td class="corrugated_td">ลอน</td>
                            <td class="corrugated_td">${item.corrugated_layer.info.flute_type}</td>`
                tr_addon_tr2 += `<td class="corrugated_td">Grade</td>
                            <td class="corrugated_td" colspan="4">${item.corrugated_layer.info.name}</td>`
            }
        } else {
            if (item.corrugated_layer) {
                tr_addon_tr1 += `<td class="corrugated_td">Corrugated Board</td>
                            <td class="corrugated_td">${item.corrugated_layer.info.num_layer}</td>
                            <td class="corrugated_td">ชั้น</td>
                            <td class="corrugated_td">ลอน</td>
                            <td class="corrugated_td">${item.corrugated_layer.info.flute_type}</td>`
                tr_addon_tr2 += `<td class="corrugated_td">Grade</td>
                            <td class="corrugated_td" colspan="4">${item.corrugated_layer.info.name}</td>`
            }
        }
        item.addon.forEach((item1) => {
            if (item1.type == 'foilstamp') {
                tr_addon_tr1 += `<td class="foilstamp_td">Foil Stamp</td>
                                <td class="foilstamp_td">${item1.info.width} x ${item1.info.length}</td>
                                <td class="foilstamp_td">in²</td>`
                tr_addon_tr2 += `<td class="foilstamp_td"></td>
                                <td colspan="2" class="foilstamp_td">สี${item1.info.color_th} ${item1.info.code}</td>`
            }
            if (item1.type == 'emboss') {
                tr_addon_tr1 += `<td class="emboss_td">Emboss</td>
                                <td class="emboss_td">${item1.info.width} x ${item1.info.length}</td>
                                <td class="emboss_td">in²</td>`
                tr_addon_tr2 += `<td class="emboss_td"></td>
                                <td colspan="2" class="emboss_td">ความนูน ${item1.info.depth}</td>`

            }
            if (item1.type == 'deboss') {
                tr_addon_tr1 += `<td class="deboss_td">Deboss</td>
                                <td class="deboss_td">${item1.info.width} x ${item1.info.length}</td>
                                <td class="deboss_td">in²</td>`
                tr_addon_tr2 += `<td class="deboss_td"></td>
                                <td colspan="2" class="deboss_td">ความลึก ${item1.info.depth}</td>`
            }
            if (item1.type == 'coating') {
                tr_addon_tr1 += `<td class="coating_tr">Coating</td>
                                <td class="coating_tr">${item1.info.name}</td>
                                <td class="coating_tr">${item1.info.type} ${item1.info.side} s</td>`
                tr_addon_tr2 += `<td class="coating_tr"></td>
                                <td class="coating_tr"></td>
                                <td class="coating_tr"></td>`
            }
        })
        tr_tr1.push(tr_addon_tr1)
        tr_tr2.push(tr_addon_tr2)
    })

    comp_arr.forEach((item, index) => {
        tr += `<tr class="component_spec_tr" index="${index}">
                <td rowspan="2" colspan="2">${item.component_name}</td>
                <td>:Outside</td>
                <td>${item.color.outside}</td>
                <td>cols</td>
                ${tr_tr1[index]}
            </tr>
            <tr class="component_spec_tr" index="${index}">
                <td>:Inside</td>
                <td>${item.color.inside}</td>
                <td>cols</td>
                ${tr_tr2[index]}
            </tr>`
    })
    return tr
}

function summary_component_special_ink() {
    const comp_arr = est.mainData.component1
    var tr = `<tr><td></td></tr><tr><td>สีพิเศษ</td></td>`;
    comp_arr.forEach((item) => {
        if (item.special_ink != null) {
            var count_ink = item.special_ink.length
            item.special_ink.forEach((item1, index1) => {
                if (index1 == 0) {
                    tr += `<tr>
                            <td rowspan="${count_ink}">${item.component_name}</td>
                            <td>${item1.name}</td>
                            <td>${item1.info.ink_name}</td>
                            <td>การพิมพ์สี</td>
                            <td>${getSpeInkInfo('filling_style', item1.info.print_style, 'filling_style_th')}</td>
                            <td>กระดาษ</td>
                            <td>${getSpeInkInfo('paper_code', item1.info.paper_code, 'paper_type_th')}</td>

                        </tr>`
                } else {
                    tr += `<tr>
                            <td>${item1.name}</td>
                            <td>${item1.info.ink_name}</td>
                            <td>การพิมพ์สี</td>
                            <td>${getSpeInkInfo('filling_style', item1.info.print_style, 'filling_style_th')}</td>
                            <td>กระดาษ</td>
                            <td>${getSpeInkInfo('paper_code', item1.info.paper_code, 'paper_type_th')}</td>
                        </tr>`
                }
            })
        }
    })
    return tr;
}

function summary_paper_usage_tr() {
    const comp_arr = est.mainData.component1
    var tr = `<tr><td></td></tr>`
    comp_arr.forEach((item) => {
        var paper_tr = ""
        tr += `<tr></tr>
            <tr>
                <td>Component</td>
                <td>Qty</td>
                <td>Ups</td>
                <td>After ups</td>
                <td>Waste</td>
                <td>After waste</td>
                <td>Sig</td>
                <td>Paper Print</td>
                <td>Split</td>
                <td>Paper Qty</td>
                <td>Paper Net</td>
                <td>Kilogram</td>
                <td>Tons</td>
            </tr>`
        item.paper_usage.line.forEach((item1, index1) => {
            if (index1 == 0) {
                paper_tr += `<td rowspan="${item.paper_usage.line.length}">${item.component_name}</td>`
            }
            paper_tr += `<td>${item1.qty}</td>
                        <td>${item.paper_usage.ups}</td>
                        <td>${item1.after_ups}</td>
                        <td>${item1.waste}</td>
                        <td>${item1.after_waste}</td>
                        <td>${item.paper_usage.sig}</td>
                        <td>${item1.paper_print}</td>
                        <td>${item.paper_usage.split}</td>
                        <td>${item1.paper_qty}</td>
                        <td>${item1.paper_net}</td>
                        <td>${item1.kilogram}</td>
                        <td>${item1.ton}</td>
                    </tr>`
        })
        tr += paper_tr
    })
    tr += `<tr><td></td></tr>`
    return tr
}

function summary_head_excel_summary() {
    const mainData = est.mainData
    var head1, head2
    mainData.qty.main.forEach((item, index) => {
        head1 += `<th>Volume</th>
                <th>${est.mainData.qty.totalqty[index]}</th>
                <th>${item}</th>`
        head2 += `<th>Unit Price</th>
                <th>Qty</th>
                <th>Price</th>`
    })
    var tr = `<tr>
                <th colspan="5" rowspan="2">Description</th>
                ${head1}
            </tr>
            <tr head_row="2">
                ${head2}
            </tr>`
    return tr
}

function summary_excel_tr(tb_row, sub_proc) {
    const mainData = est.mainData, comp_arr = est.mainData.component1
    var tr = ""
    switch (tb_row) {
        case 'paper':
            var paperColumn_arr = [], paperRow_arr = [], num_trPaper = 0
            comp_arr.forEach((item) => {
                if (item.component_type.type != 3) {
                    num_trPaper += 1
                }
            })
            comp_arr.forEach((item, index) => {
                var paperColumn
                if (item.component_type.type != 3) {
                    item.paper_usage.line.forEach((item1, index1) => {
                        paperColumn += `<td class="alRight"><div class="paperRowUnitPrice" index="${index}" indexqty="${index1}">${item1.price.paper.unit_price}</div></td>
                                    <td class="alCenter"><div class="paperRowQty" index="${index}" indexqty="${index1}">${item1.price.paper.qty}</div></td>
                                    <td class="alRight"><div class="paperRowPrice" index="${index}" indexqty="${index1}">${item1.price.paper.price}</div></td>`
                    })
                    paperColumn_arr.push(paperColumn)

                    if (paperColumn_arr.length == 1) {
                        var paper_tr = `<tr class="paper_tr" index=${index}>
                                <td rowspan="${num_trPaper}">Paper</td>
                                <td class="alCenter"><div class="paperRowComponentName" index=${index}>${item.component_name}</div></td>
                                <td class="alCenter"><div class="paperRowPaperType" index=${index}>${item.paper.paper_name}</div></td>
                                <td colspan="2" class="alCenter"><div class="paperRowPaperGram" index=${index}>${item.paper.paper_gram} gsm</div></td>`
                    } else {
                        var paper_tr = `<tr class="paper_tr" index=${index}>
                                <td class="alCenter"><div class="paperRowComponentName" index=${index}>${item.component_name}</div></td>
                                <td class="alCenter"><div class="paperRowPaperType" index=${index}>${item.paper.paper_name}</div></td>
                                <td colspan="2" class="alCenter"><div class="paperRowPaperGram" index=${index}>${item.paper.paper_gram} gsm</div></td>`
                    }
                    paperRow_arr.push(paper_tr)
                }
            })
            if (paperColumn_arr.length != 0) {
                paperColumn_arr.forEach((item, index) => {
                    tr += paperRow_arr[index] + item + `</tr>`
                })
            }
            break
        case 'corrugated':
            comp_arr.forEach((item, index) => {
                var corrugatedColumn1
                if (item.corrugated_layer) {
                    item.corrugated_layer.price.forEach((item1, index1) => {
                        corrugatedColumn1 += `<td class="alRight"><div class="corugatedRowUnitPrice" index="${index}" indexqty="${index1}">${item1.unit_price}</div></td>
                                        <td class="alCenter"><div class="corugatedRowQty" index="${index}" indexqty="${index1}">${item1.qty}</div></td>
                                        <td class="alRight"><div class="corugatedRowPrice" index="${index}" indexqty="${index1}">${item1.price}</div></td>`

                    })
                    tr += `<tr class="corrugated_tr" index="${index}">
                            <td>Corrugated Board</td>
                            <td class="alCenter"><div class="corrugatedRowComponentName" index="${index}">${item.component_name}</div></td>
                            <td class="alCenter"><div class="corrugatedRowFlute" index="${index}">ลอน ${item.corrugated_layer.info.flute_type} ${item.corrugated_layer.info.num_layer} ชั้น</div></td>
                            <td colspan="2" class="alCenter"><div class="corrugatedRowName" index="${index}">${item.corrugated_layer.info.name}</div></td>
                            ${corrugatedColumn1}
                        </tr>
                        <tr class="corrugated_tr" index="${index}">
                            <td colspan="2" class="alCenter"><div>ลอนขนานด้าน x Cut off</div></td>
                            <td class="alCenter" colspan="3">ราคาลูกฟูกต่อแผ่น</td>
                        </tr>
                        <tr class="corrugated_tr" index="${index}">
                            <td colspan="2" class="alCenter"><div class="corrugatedRowSize" index="${index}">${item.corrugated_layer.info.flute_side} x ${item.corrugated_layer.info.cut_off}</div></td>
                            <td class="alCenter" colspan="3"><div class="corrugatedRowUnit" index="${index}">${Math.max(...item.corrugated_layer.info.unit_price)}</div></td>
                        </tr>
                        <tr class="corrugated_tr" index="${index}">
                            <td class="alCenter"><div>ราคาทุน</div></td>
                            <td class="alCenter"><div class="corrugatedRowCost" index="${index}">${Math.max(...item.corrugated_layer.info.cost)}</div></td>
                            <td class="alCenter"><div>B/ตร.ฟุต</div></td>
                            <td class="alCenter"><div class="corrugatedRowUnitInch" index="${index}">${Math.max(...item.corrugated_layer.info.unit_inch)}</div></td>
                            <td class="alCenter"><div>B/ตร.นิ้ว</div></td>
                        </tr>`
                }
            })
            break
        case 'special_ink':
            comp_arr.forEach((item, index) => {
                if (item.special_ink != null) {
                    if (item.special_ink.length != 0) {
                        item.special_ink.forEach((item1) => {
                            var special_ink_column = ""
                            item1.line.forEach((item2, index2) => {
                                special_ink_column += `<td class="alRight"><div class="specialInkRowUnitPrice" index="${index}" indexqty="${index2}">${numeral(item2.unit_price).format('0,0.00')}</div></td>
                                                    <td class="alCenter"><div class="specialInkRowQty" index="${index}" indexqty="${index2}">${numeral(item2.qty).format('0,0')}</div></td>
                                                    <td class="alRight"><div class="specialInkRowPrice" index="${index}" indexqty="${index2}">${numeral(item2.price).format('0,0.00')}</div></td>`
                            })
                            tr += `<tr class="special_ink_tr" index="${index}">
                                <td>${item1.name} : ${item1.info.ink_name}</td>
                                <td></td><td></td><td></td><td></td>
                                ${special_ink_column}
                            </tr>`
                        })


                    }
                }
            })
            break
        case 'material':
            var tr = ""
            mainData.material.forEach((item, index) => {
                var material_column = ""
                item.line.forEach((item1, index1) => {
                    material_column += `<td class="alRight"><div class="materialUnitPrice" index="${index}" indexqty="${index1}">${item1.unit_price}</div></td>
                                      <td class="alCenter"><div class="materialRowQty" index="${index}" indexqty="${index1}">${item1.qty}</div></td>
                                      <td class="alRight"><div class="materialRowPrice" index="${index}" indexqty="${index1}">${item1.price}</div></td>`
                })
                tr += `<tr class="material_tr" index=${index}">
                        <td>${item.name}</td>
                        <td></td><td></td><td></td><td></td>
                        ${material_column}
                    </tr>`
            })
            break
        case 'reprint_plate':
            if (mainData.job.print_type != 'Offset') return ''

            var proc_label = 'Plate (สำรอง)', color_label = 'cols'

            comp_arr.forEach((item, index) => {
                var column_outside, column_inside
                var machine_size = item.machine.machine_size.name

                item.paper_usage.line.forEach((item1, index1) => {
                    var proc = item1.price.plate?.reprint


                    column_outside += `<td class="alRight"><div class="${sub_proc}RowUnitPrice" index="${index}" indexqty="${index1}">${proc.outside.unit_price}</div></td>
                        <td class="alCenter"><div class="${sub_proc}RowQty" index="{index}" indexqty="${index1}">${proc.outside.qty}</div></td>
                        <td class="alRight"><div class="${sub_proc}RowPrice" index="{index}" indexqty="${index1}">${proc.outside.price}</div></td>`
                    column_inside += `<td class="alRight"><div class="${sub_proc}RowUnitPrice" index="${index}" indexqty="${index1}">${proc.inside.unit_price}</div></td>
                        <td class="alCenter"><div class="${sub_proc}RowQty" index="{index}" indexqty="${index1}">${proc.inside.qty}</div></td>
                        <td class="alRight"><div class="${sub_proc}RowPrice" index="{index}" indexqty="${index1}">${proc.inside.price}</div></td>`
                })
                if (index == 0) {
                    tr += `<tr index=${index} class="${sub_proc}Outside_tr">
                            <td rowspan="${comp_arr.length * 2}">${proc_label}</td>
                            <td class="alLeft"><div class="${sub_proc}RowOutside" index="${index}">${item.component_name} Outside</div></td>
                            <td class="alCenter"><div class="${sub_proc}RowColOutside" index="${index}">${item.color.outside} ${color_label}</div></td>
                            <td class="alCenter"><div class="${sub_proc}CutOutside" index="${index}">${machine_size}</div></td>
                            <td class="alCenter"><div class="${sub_proc}CutOutside" index="${index}"></div></td>
                            ${column_outside}
                        </tr>
                        <tr index=${index} class="${sub_proc}Inside_tr">
                            <td class="alLeft"><div class="${sub_proc}RowInside" index="${index}">${item.component_name} Inside</div></td>
                            <td class="alCenter"><div class="${sub_proc}RowColInside" index="${index}">${item.color.inside} ${color_label}</div></td>
                            <td class="alCenter"><div class="${sub_proc}CutInside" index="${index}">${machine_size}</div></td>
                            <td class="alCenter"><div class="${sub_proc}CutInside" index="${index}"></div></td>
                            ${column_inside}
                        </tr>`
                } else {
                    tr += `<tr index=${index} class="${sub_proc}Outside_tr">
                            <td class="alLeft"><div class="${sub_proc}RowOutside" index="${index}">${item.component_name} Outside</div></td>
                            <td class="alCenter"><div class="${sub_proc}RowColOutside" index="${index}">${item.color.outside} ${color_label}</div></td>
                            <td class="alCenter"><div class="${sub_proc}CutOutside" index="${index}">${machine_size}</div></td>
                            <td class="alCenter"><div class="${sub_proc}CutOutside" index="${index}"></div></td>
                            ${column_outside}
                        </tr>
                        <tr index=${index} class="${sub_proc}Inside_tr">
                            <td class="alLeft"><div class="${sub_proc}RowInside" index="${index}">${item.component_name} Inside</div></td>
                            <td class="alCenter"><div class="${sub_proc}RowColInside" index="${index}">${item.color.inside} ${color_label}</div></td>
                            <td class="alCenter"><div class="${sub_proc}CutInside" index="${index}">${machine_size}</div></td>
                            <td class="alCenter"><div class="${sub_proc}CutInside" index="${index}"></div></td>
                            ${column_inside}
                        </tr>`
                }
            })
            break
        case 'print_plate':
            if (sub_proc == 'plate') {
                if (mainData.job.print_type == 'Offset') {
                    var proc_label = 'Plate', color_label = 'cols'
                } else if (mainData.job.print_type == 'Flexo') {
                    var proc_label = 'Plate Polymer (' + mainData.job.flexo_size[0] + ' x ' + mainData.job.flexo_size[1] + ' in²)',
                        color_label = 'cols'
                } else {
                    var proc_label = 'Plate'
                    var color_label = 'cols'
                }
            } else {
                if (mainData.job.print_type == 'Offset') {
                    var proc_label = 'Print'
                    if (mainData.job.ink_type == 'UV') {
                        var color_label = 'cols UV'
                    } else {
                        var color_label = 'cols'
                    }
                } else if (mainData.job.print_type == 'Flexo') {
                    var proc_label = 'Print Flexo'
                    var color_label = 'cols'
                } else {
                    var proc_label = 'Print'
                    var color_label = 'cols'
                }
            }
            comp_arr.forEach((item, index) => {
                var column_outside, column_inside
                if (mainData.job.print_type != 'Jet Press') {
                    var machine_size = item.machine.machine_size.name
                } else {
                    var machine_size = mainData?.job?.print_type
                }
                item.paper_usage.line.forEach((item1, index1) => {
                    if (sub_proc == 'plate') {
                        var proc = item1.price.plate
                    } else {
                        var proc = item1.price.print
                    }

                    column_outside += `<td class="alRight"><div class="${sub_proc}RowUnitPrice" index="${index}" indexqty="${index1}">${proc.outside.unit_price}</div></td>
                        <td class="alCenter"><div class="${sub_proc}RowQty" index="{index}" indexqty="${index1}">${proc.outside.qty}</div></td>
                        <td class="alRight"><div class="${sub_proc}RowPrice" index="{index}" indexqty="${index1}">${proc.outside.price}</div></td>`
                    column_inside += `<td class="alRight"><div class="${sub_proc}RowUnitPrice" index="${index}" indexqty="${index1}">${proc.inside.unit_price}</div></td>
                        <td class="alCenter"><div class="${sub_proc}RowQty" index="{index}" indexqty="${index1}">${proc.inside.qty}</div></td>
                        <td class="alRight"><div class="${sub_proc}RowPrice" index="{index}" indexqty="${index1}">${proc.inside.price}</div></td>`
                })
                if (index == 0) {
                    tr += `<tr index=${index} class="${sub_proc}Outside_tr">
                            <td rowspan="${comp_arr.length * 2}">${proc_label}</td>
                            <td class="alLeft"><div class="${sub_proc}RowOutside" index="${index}">${item.component_name} Outside</div></td>
                            <td class="alCenter"><div class="${sub_proc}RowColOutside" index="${index}">${item.color.outside} ${color_label}</div></td>
                            <td class="alCenter"><div class="${sub_proc}CutOutside" index="${index}">${machine_size}</div></td>
                            <td class="alCenter"><div class="${sub_proc}CutOutside" index="${index}"></div></td>
                            ${column_outside}
                        </tr>
                        <tr index=${index} class="${sub_proc}Inside_tr">
                            <td class="alLeft"><div class="${sub_proc}RowInside" index="${index}">${item.component_name} Inside</div></td>
                            <td class="alCenter"><div class="${sub_proc}RowColInside" index="${index}">${item.color.inside} ${color_label}</div></td>
                            <td class="alCenter"><div class="${sub_proc}CutInside" index="${index}">${machine_size}</div></td>
                            <td class="alCenter"><div class="${sub_proc}CutInside" index="${index}"></div></td>
                            ${column_inside}
                        </tr>`
                } else {
                    tr += `<tr index=${index} class="${sub_proc}Outside_tr">
                            <td class="alLeft"><div class="${sub_proc}RowOutside" index="${index}">${item.component_name} Outside</div></td>
                            <td class="alCenter"><div class="${sub_proc}RowColOutside" index="${index}">${item.color.outside} ${color_label}</div></td>
                            <td class="alCenter"><div class="${sub_proc}CutOutside" index="${index}">${machine_size}</div></td>
                            <td class="alCenter"><div class="${sub_proc}CutOutside" index="${index}"></div></td>
                            ${column_outside}
                        </tr>
                        <tr index=${index} class="${sub_proc}Inside_tr">
                            <td class="alLeft"><div class="${sub_proc}RowInside" index="${index}">${item.component_name} Inside</div></td>
                            <td class="alCenter"><div class="${sub_proc}RowColInside" index="${index}">${item.color.inside} ${color_label}</div></td>
                            <td class="alCenter"><div class="${sub_proc}CutInside" index="${index}">${machine_size}</div></td>
                            <td class="alCenter"><div class="${sub_proc}CutInside" index="${index}"></div></td>
                            ${column_inside}
                        </tr>`
                }
            })
            break
        case 'coating':
            var coatingColumn_arr = [], coatingRow_arr = [], num_trCoating = 0
            comp_arr.forEach((item) => {
                item.addon.forEach((item1) => {
                    if (item1.type == 'coating') {
                        num_trCoating += 1
                    }
                })
            })
            comp_arr.forEach((item, index) => {
                item.addon.forEach((item1) => {
                    var coatingColumn = ""
                    if (item1.info.name == 'Other') {
                        var coating_option = ""
                    } else { var coating_option = item1.info.name }
                    if (item1.type == 'coating') {
                        item1.line.forEach((item2, index2) => {
                            coatingColumn += `<td class="alRight"><div class="coatingRowUnitPrice" index="${index}" indexqty="${index2}">${item2.unit_price}</div></td>
                                    <td class="alCenter"><div class="coatingRowQty" index="${index}" indexqty="${index2}">${item2.qty}</div></td>
                                    <td class="alRight"><div class="coatingRowPrice" index="${index}" indexqty="${index2}">${item2.price}</div></td>`
                        })
                        coatingColumn_arr.push(coatingColumn)
                        if (['S-UV', 'S-UV-S'].includes(item1.info.code)) {
                            var size_label = "(" + item1.info.width + " x " + item1.info.length + " in²)"
                        } else if (item1.info?.code == 'P-PAT') {
                            var size_label = `(เบอร์ ${item1?.info?.number})`
                        } else {
                            var size_label = ""
                        }
                        if (coatingColumn_arr.length == 1) {
                            var coating_tr = `<tr class='coating_tr' index="${index}">
                                <td rowspan="${num_trCoating}">Coating</td>
                                <td class="alLeft"><div class="coatingRowComponentName" index="${index}">${item.component_name}</div></td>
                                <td class="alCenter"><div class="coatingRowCoatingType" index="${index}">${coating_option}</div></td>
                                <td class="alCenter"><div class="coatingRowCoatingType" index="${index}">${item1.info.type}</div></td>
                                <td class="alCenter"><div class="coatingRowCoatingType" index="${index}">${item1.info.side} s ${size_label}</div></td>`
                        } else {
                            var coating_tr = `<tr>
                                <td class="alLeft"><div class="coatingRowComponentName" index="${index}">${item.component_name}</div></td>
                                <td class="alCenter"><div class="coatingRowCoatingType" index="${index}">${coating_option}</div></td>
                                <td class="alCenter"><div class="coatingRowCoatingType" index="${index}">${item1.info.type}</div></td>
                                <td class="alCenter"><div class="coatingRowCoatingType" index="${index}">${item1.info.side} s ${size_label}</div></td>`
                        }
                        coatingRow_arr.push(coating_tr)
                    }
                })
            })
            if (coatingColumn_arr.length != 0) {
                coatingColumn_arr.forEach((item, index) => {
                    tr += coatingRow_arr[index] + item + `</tr>`
                })
            }
            break
        case 'foilstamp':
            comp_arr.forEach((item, index) => {
                item.addon.forEach((item1) => {
                    if (item1.type == 'foilstamp') {
                        var foilStampColumn = "", blockStampColumn = "", foilRollColumn = ""
                        item1.line.forEach((item2, index2) => {
                            foilStampColumn += `<td class="alRight"><div class="foilStampRowUnitPrice" index="${index}" indexqty="${index2}">${item2.labor.unit_price}</div></td>
                                        <td class="alCenter"><div class="foilStampRowQty" index="${index}" indexqty="${index2}">${item2.labor.qty}</div></td>
                                        <td class="alRight"><div class="foilStampRowPrice" index="${index}" indexqty="${index2}">${item2.labor.price}</div></td>`
                            blockStampColumn += `<td class="alRight"><div class="blockStampRowUnitPrice" index="${index}" indexqty="${index2}">${item2.block.unit_price}</div></td>
                                        <td class="alCenter"><div class="blockStampRowQty" index="${index}" indexqty="${index2}">${item2.block.qty}</div></td>
                                        <td class="alRight"><div class="blockStampRowPrice" index="${index}" indexqty="${index2}">${item2.block.price}</div></td>`
                            foilRollColumn += `<td class="alRight"><div class="foilRollRowUnitPrice" index="${index}" indexqty="${index2}">${item2.foil_roll.unit_price}</div></td>
                                        <td class="alCenter"><div class="foilRollRowQty" index="${index}" indexqty="${index2}">${item2.foil_roll.qty}</div></td>
                                        <td class="alRight"><div class="foilRollRowPrice" index="${index}" indexqty="${index2}">${item2.foil_roll.price}</div></td>`
                        })
                        tr += `<tr class='foilStamp_tr' index="${index}">
                                <td>Block Foil  Stamp</td>
                                <td colspan="2" style="text-align:center"><div class="foilRowComponentName" index="${index}">${item.component_name}</div></td>
                                <td colspan="2" style="text-align:center"><div class="foilRowArea" index]"${index}">Area (in²) : ${item1.info.width} x ${item1.info.length}</div></td>
                                ${blockStampColumn}
                            </tr>
                            <tr class='foilStamp_tr' index="${index}">
                                <td colspan="3"><div class="foilRowRollWidth" index="${index}">Foil หน้าม้วน  ${item1.info.foil_width}" ความยาว ${item1.info.foil_length} ft </td>
                                <td colspan="2" class="alRight"><div class="foilRowCode" index="${index}">สี${item1.info.color_th} ${item1.info.code}</div></td>
                                ${foilRollColumn}
                            </tr>
                            <tr class='foilStamp_tr' index="${index}">
                                <td colspan="3">Foil Stamp</td>
                                <td colspan="2" class="alRight"></td>
                                ${foilStampColumn}
                            </tr>`
                    }
                })
            })
            break
        case 'bossing':
            if (sub_proc == 'emboss') {
                var proc_label = "Block Emboss", sub_proc_upper = "Emboss"
            } else {
                var proc_label = "Block Deboss", sub_proc_upper = "Deboss"
            }

            comp_arr.forEach((item, index) => {
                const bossing = item?.addon?.filter(addon => addon.type == sub_proc)
                //     item.addon.forEach((item1,) => {
                //         if (item1.type == sub_proc) {
                bossing?.forEach(addon => {

                    let blockTr = "",
                        bossingTr = ""

                    let blockColumn = [],
                        bossingColumn = []

                    let block = []

                    //* BLOCK COST
                    addon.line?.block?.forEach((block, bIndex) => {
                        blockColumn = ''

                        blockTr += `
                            <tr class="${sub_proc}_tr">
                                <td>${proc_label}</td>
                                <td colspan="2" class="alCenter"><div class="${sub_proc}RowComponentName">${item.component_name}</div></td>
                                <td colspan="2" class="alCenter"><div class="${sub_proc}RowArea">Area (in²) : ${block.size[0]} x ${block.size[1]}</div></td>
                                
                        `

                        block?.line?.forEach((line, lIndex) => {
                            blockColumn += `
                                <td class="alRight">
                                    <div class="block${sub_proc_upper}RowUnitPrice" indexqty="${lIndex}">${numeral(line.unit_price).format('0,0.00')}</div>
                                </td>
                                <td class="alCenter">
                                    <div class="block${sub_proc_upper}RowQty" indexqty="${lIndex}">${numeral(line.qty).format('0,0')}</div>
                                </td>
                                <td class="alRight">
                                    <div class="block${sub_proc_upper}RowPrice" indexqty="${lIndex}">${numeral(line.price).format('0,0.00')}</div>
                                </td>
                            `
                        })

                        blockTr += `
                            ${blockColumn}
                        </tr>
                        `
                    })

                    //*LABOR
                    bossingTr += `
                    <tr class="${sub_proc}_tr">
                        <td colspan="3">${sub_proc_upper}</td>
                        <td colspan="2" class="alCenter"></td>
                    `

                    addon.line?.labor?.forEach((price, pIndex) => {

                        bossingColumn += `
                            <td class="alRight">
                                <div class="block${sub_proc_upper}RowUnitPrice" indexqty="${pIndex}">${numeral(price.unit_price).format('0,0.00000')}</div>
                            </td>
                            <td class="alCenter">
                                <div class="block${sub_proc_upper}RowQty" indexqty="${pIndex}">${numeral(price.qty).format('0,0')}</div>
                            </td>
                            <td class="alRight">
                                <div class="block${sub_proc_upper}RowPrice" indexqty="${pIndex}">${numeral(price.price).format('0,0.00')}</div>
                            </td>
                        `

                    })

                    bossingTr += `
                        ${bossingColumn}
                        </tr>
                    `

                    tr += blockTr
                    tr += bossingTr
                })

            }) //* Component

            // comp_arr.forEach((item, index) => {
            //     item.addon.forEach((item1) => {
            //         if (item1.type == sub_proc) {
            //             var blockColumn = "", bossingColumn = ""
            //             item1.line.forEach((item2, index2) => {
            //                 blockColumn += `<td class="alRight"><div class="block${sub_proc_upper}RowUnitPrice" index="${index}" indexqty="${index2}">${item2.block.unit_price}</div></td>
            //                         <td class="alCenter"><div class="block${sub_proc_upper}RowQty" index="${index}" indexqty="${index2}">${item2.block.qty}</div></td>
            //                         <td class="alRight"><div class="block${sub_proc_upper}RowPrice" index="${index}" indexqty="${index2}">${item2.block.price}</div></td>`
            //                 bossingColumn += `<td class="alRight"><div class="${sub_proc}RowUnitPrice" index="${index}" indexqty="${index2}">${item2.labor.unit_price}</div></td>
            //                         <td class="alCenter"><div class="${sub_proc}RowQty" index="${index}" indexqty="${index2}">${item2.labor.qty}</div></td>
            //                         <td class="alRight"><div class="${sub_proc}RowPrice" index="${index}" indexqty="${index2}">${item2.labor.price}</div></td>`
            //             })
            //             tr += `<tr index="${index} class="${sub_proc}_tr">
            //                     <td>${proc_label}</td>
            //                     <td colspan="2" class="alCenter"><div class="${sub_proc}RowComponentName" index="${index}">${item.component_name}</div></td>
            //                     <td colspan="2" class="alCenter"><div class="${sub_proc}RowArea" index="${index}">Area (in²) : ${item1.info.width} x ${item1.info.length}</div></td>
            //                     ${blockColumn}
            //                 </tr>
            //                 <tr index="${index} class="${sub_proc}_tr">
            //                     <td colspan="3">${sub_proc_upper}</td>
            //                     <td colspan="2" class="alCenter"></td>
            //                     ${bossingColumn}
            //                 </tr>`
            //         }
            //     })
            // })
            break
        case 'diecut':
            var diecutColumn_arr = [], blockColumn_arr = [], diecutRow_arr = [], blockRow_arr = []
            if (mainData.job.is_reprinted) {
                var block_label = 'Block Diecut (Reprint)'
            } else {
                var block_label = 'Block Diecut'
            }
            comp_arr.forEach((item) => {
                item.process.forEach((item1, index1) => {
                    if (item1.name == 'diecut') {
                        var diecutColumn = "", blockColumn = ""
                        item1.line.forEach((item2, index2) => {
                            blockColumn += `<td class="alRight"><div class="blockDiecutRowUnitPrice" index="${index1}" indexqty="${index2}">${item2.block.unit_price}</div></td>
                                        <td class="alCenter"><div class="blockDiecutRowQty" index="${index1}" indexqty="${index2}">${item2.block.qty}</div></td>
                                        <td class="alRight"><div class="blockDiecutRowPrice" index="${index1}" indexqty="${index2}">${item2.block.price}</div></td>`
                            diecutColumn += `<td class="alRight"><div class="diecutRowUnitPrice" index="${index1}" indexqty="${index2}">${item2.labor.unit_price}</div></td>
                                        <td class="alCenter"><div class="diecutRowQty" index="${index1}" indexqty="${index2}">${item2.labor.qty}</div></td>
                                        <td class="alRight"><div class="diecutRowPrice" index="${index1}" indexqty="${index2}">${item2.labor.price}</div></td>`

                        })
                        diecutColumn_arr.push(diecutColumn)
                        blockColumn_arr.push(blockColumn)
                        if (blockColumn_arr.length == 1) {
                            var blockRow = `<tr index="${index1}" class="diecut_tr">
                                    <td colspan="3"rowspan="${comp_arr.length}">${block_label}</td>
                                    <td class="alCenter"><div class="diecutRowComponentName" index="${index1}">${item.component_name}</div></td>
                                    <td></td>`
                            var diecutRow = `<tr>
                                    <td colspan="3" rowspan="${comp_arr.length}">Diecut</td>
                                    <td class="alCenter"><div class="diecutRowComponentName" index="${index1}">${item.component_name}</div></td>
                                    <td></td>`
                        } else {
                            var blockRow = `<tr index="${index1}" class="diecut_tr">
                                        <td class="alCenter"><div class="diecutRowComponentName" index="${index1}">${item.component_name}</div></td>
                                        <td></td>`
                            var diecutRow = `<tr>
                                        <td class="alCenter"><div class="diecutRowComponentName" index="${index1}">${item.component_name}</div></td>
                                        <td></td>`
                        }
                        diecutRow_arr.push(diecutRow)
                        blockRow_arr.push(blockRow)
                    }
                })
            })
            if (blockColumn_arr.length != 0) {
                blockColumn_arr.forEach((item, index) => {
                    tr += blockRow_arr[index] + item + `</tr>`
                })
            }
            if (diecutColumn_arr.length != 0) {
                diecutColumn_arr.forEach((item, index) => {
                    tr += diecutRow_arr[index] + item + `</tr>`
                })
            }
            break
        case 'main_process':
            switch (sub_proc) {
                case 'chip':
                    var proc_label = "แกะ"
                    break
                case 'inspection':
                    var proc_label = "Inspection"
                    break
                case 'trim':
                    var proc_label = "Trim"
                    break
                case 'shrinkwrap':
                    var proc_label = "Shrinkwrap"
                    break
            }
            mainData.process.forEach((item) => {
                if (item.name == sub_proc) {
                    var Column = ""
                    item.line.forEach((item1, index1) => {
                        Column += `<td class="alRight"><div class="${sub_proc}RowUnitPrice" indexqty="${index1}">${item1.unit_price}</div></td>
                                    <td class="alCenter"><div class="${sub_proc}RowQty" indexqty="${index1}">${item1.qty}</div></td>
                                    <td class="alRight"><div class="${sub_proc}RowPrice" indexqty="${index1}">${item1.price}</div></td>`
                    })
                    tr = `<tr class="${sub_proc}_tr">
                            <td colspan="5">${proc_label}</td>
                            ${Column}
                        </tr>`
                }
            })
            break
        case 'corrugated_glued':
            corrugatedGluedColumn_arr = [], corrugatedGluedRow_arr = [], num_trCorrugatedGlued = 0
            comp_arr.forEach((item) => {
                item.process.forEach((item1) => {
                    if (item1.name == 'corrugated_glued') {
                        num_trCorrugatedGlued += 1
                    }
                })
            })
            comp_arr.forEach((item, index) => {
                item.process.forEach((item1) => {
                    var corrugatedGluedColumn = ""
                    if (item1.name == 'corrugated_glued') {
                        item1.line.forEach((item2, index2) => {
                            corrugatedGluedColumn += `<td class="alRight"><div class="corrugatedGluedRowUnitprice" index="${index}" indexqty="${index2}">${item2.unit_price}</div></td>
                                    <td class="alCenter"><div class="corrugatedGluedRowQty" index="${index}" indexqty="${index2}">${item2.qty}</div></td>
                                    <td class="alRight"><div class="corrugatedGluedRowprice" index="${index}" indexqty="${index2}">${item2.price}</div></td>`
                        })
                        corrugatedGluedColumn_arr.push(corrugatedGluedColumn)
                        if (corrugatedGluedColumn_arr.length == 1) {
                            var corrugated_tr = `<tr class="corrugatedGlued_tr" index="${index}" >
                                <td rowspan="${num_trCorrugatedGlued}" colspan="2">ทากาวประกบลูกฟูกกับกระดาษ</td>
                                <td class="alCenter"><div class="corrugatedGluedRowComponentName" index="${index}">${item.component_name}</div></td>
                                <td class="alCenter"><div class="corrugatedRowGlued" index="${index}">${defaultData.corrugated_glued_cost}</div></td>
                                <td class="alCenter"><div class="corrugatedRowGlued" index="${index}">B/sqinch</div></td>`
                        } else {
                            var corrugated_tr = `<tr class="corrugatedGlued_tr" index="${index}">
                                <td class="alCenter"><div class="corrugatedGluedRowComponentName" index="${index}">${item.component_name}</div></td>
                                <td class="alCenter"><div class="corrugatedGluedRowGlued" index="${index}">${defaultData.corrugated_glued_cost}</div></td>
                                <td class="alCenter"><div class="corrugatedGluedRowGlued" index="${index}">B/sqinch</div></td>`
                        }
                        corrugatedGluedRow_arr.push(corrugated_tr)
                    }
                })
            })
            if (corrugatedGluedColumn_arr.length != 0) {
                corrugatedGluedColumn_arr.forEach((item, index) => {
                    tr += corrugatedGluedRow_arr[index] + item + `</tr>`
                })
            }
            break
        case 'assembly':
            assemblyColumn_arr = [], assemblyRow_arr = [], num_trAssembly = 0
            comp_arr.forEach((item) => {
                item.process.forEach((item1) => {
                    if (item1.name == 'assembly') {
                        num_trAssembly += 1
                    }
                })
            })
            comp_arr.forEach((item, index) => {
                item.process.forEach((item1, index1) => {
                    if (item1.name == 'assembly') {
                        var assemblyColumn = ""
                        item1.line.forEach((item2) => {
                            assemblyColumn += `<td class="alRight"><div class="assemblyRowUnitPrice" index="${index}" indexqty="${index1}">${item2.unit_price}</div></td>
                                        <td class="alCenter"><div class="assemblyRowQty" index="${index}" indexqty="${index1}">${item2.qty}</div></td>
                                        <td class="alRight"><div class="assemblyRowPrice"  index="${index}"indexqty="${index1}">${item2.price}</div></td>`
                        })
                        assemblyColumn_arr.push(assemblyColumn)
                        if (assemblyColumn_arr.length == 1) {
                            var assembly_tr = `<tr index="${index}" class="assembly_tr">
                                        <td rowspan="${num_trAssembly}" colspan="3">Assembly (ประกบ/ติดลิ้นกาว)</td>
                                        <td class="alCenter""><div class="assemblyRowComponentName">${item.component_name} ติดกาว ${item.box_type.glued_spot} จุด</div></td>
                                        <td class="alCenter""></td>`
                        } else {
                            var assembly_tr = `<tr index="${index}" class="assembly_tr">
                                        <td class="alCenter""><div class="assemblyRowComponentName">${item.component_name} ติดกาว ${item.box_type.glued_spot} จุด</div></td>
                                        <td class="alCenter""></td>`
                        }
                        assemblyRow_arr.push(assembly_tr)
                    }
                })
            })
            if (assemblyColumn_arr.length != 0) {
                assemblyColumn_arr.forEach((item, index) => {
                    tr += assemblyRow_arr[index] + item + `</tr>`
                })
            }
            break
        case 'process':
            var tr = ""
            mainData.process.forEach((item, index) => {
                if (sub_proc == 'other') {
                    var label = 'otherProcess'
                } else if (sub_proc == 'handwork') {
                    var label = 'handworkProcess'
                } else if (sub_proc == 'custom') {
                    var label = 'customProcess'
                } else {
                    console.log('sub_proc not match // process')
                }
                if (item.type == sub_proc) {
                    var process_column = ""
                    item.line.forEach((item1, index1) => {
                        process_column += `<td class="alRight"><div class="${label}UnitPrice" index="${index}" indexqty="${index1}">${item1.unit_price}</div></td>
                                            <td class="alCenter"><div class="${label}RowQty" index="${index}" indexqty="${index1}">${item1.qty}</div></td>
                                            <td class="alRight"><div class="${label}RowPrice" index="${index}" indexqty="${index1}">${item1.price}</div></td>`
                    })
                    tr += `<tr class="${label}_tr" index=${index}">
                            <td>${item.name}</td>
                            <td></td><td></td><td></td><td></td>
                            ${process_column}
                        </tr>`
                }
            })
            break
        case 'otherCost':
            var tr = ""
            mainData?.otherCost && mainData?.otherCost.forEach((item, index) => {
                var otherCost_column = ""
                item.line.forEach((item1, index1) => {
                    otherCost_column += `<td class="alRight"><div class="otherCostUnitPrice" index="${index}" indexqty="${index1}">${item1.unit_price}</div></td>
                                      <td class="alCenter"><div class="otherCostRowQty" index="${index}" indexqty="${index1}">${item1.qty}</div></td>
                                      <td class="alRight"><div class="otherCostRowPrice" index="${index}" indexqty="${index1}">${item1.price}</div></td>`
                })
                tr += `<tr class="otherCost_tr" index=${index}">
                        <td>${item.name}</td>
                        <td></td><td></td><td></td><td></td>
                        ${otherCost_column}
                    </tr>`
            })
            break
    }
    return tr
}

function summary_excel_packing_tr(fIndex = 0) {
    const comp_arr = est.mainData.component1
    var num_trPaperband = 0,
        num_trKraftwrap = 0,
        num_trCarton = 0,
        num_trPallet = 0,
        num_trDelivery = 0,
        check_packing = []

    comp_arr.forEach((item, index) => {
        check_packing.push({
            kraftwrap: false,
            carton: false
        })

        item.packing[fIndex].forEach((item1, index1) => {
            if (item1.name == 'paperband') {
                num_trPaperband += 1
            }
            if (item1.name == 'kraftwrap') {
                num_trKraftwrap += 1
                check_packing[index].kraftwrap = true
            }
            if (item1.name == 'carton') {
                num_trCarton += 1
                check_packing[index].carton = true
            }
            if (item1.name == 'pallet') {
                num_trPallet += 1
            }
        })

        if (check_packing[index].kraftwrap == false && check_packing[index].carton == false) {
            check_packing[index].unit_pallet = 'Cps/Pallet'
        } else if (check_packing[index].kraftwrap == true && check_packing[index].carton == false) {
            check_packing[index].unit_pallet = 'Pack/Pallet'
        } else if (check_packing[index].carton == true) {
            check_packing[index].unit_pallet = 'Carton/Pallet'
        }

        if (item.delivery?.length > 0) {
            num_trDelivery += item?.delivery?.length || 1
        }
    })

    var paperbandColumn_arr = [],
        kraftwrapColumn_arr = [],
        cartonColumn_arr = [],
        palletColumn_arr = [],
        deliveryColumn_arr = [],
        paperbandRow_arr = [],
        kraftwrapRow_arr = [],
        cartonRow_arr = [],
        palletRow_arr = [],
        deliveryRow_arr = [],
        packing_obj = {}

    comp_arr.forEach((item, index) => {
        var paperbandColumn = "", kraftwrapColumn = "", cartonColumn = "", palletColumn = "", deliveryColumn = ""

        item.packing[fIndex].forEach((item1) => {

            if (item1.name == 'paperband') {
                item1.line.forEach((item2, index2) => {
                    paperbandColumn += `<td  class="alRight"><div class="paperbandRowUnitprice" index="${index}" indexqty="${index2}">${item2.unit_price}</div></td>
                                    <td  class="alCenter"><div class="paperbandRowQty" index="${index}" indexqty="${index2}">${item2.qty}</div></td>
                                    <td  class="alRight"><div class="paperbandRowPrice" index="${index}" indexqty="${index2}">${item2.price}</div></td>`
                })
                paperbandColumn_arr.push(paperbandColumn)
                if (paperbandColumn_arr.length == 1) {
                    var paperband_tr = `<tr class="packing_tr paperband_tr" index="${index}">
                                        <td rowspan="${num_trPaperband}" colspan="2">Paper Band</td>
                                        <td class="alCenter"><div class="paperbandRowComponentName" index="${index}">${item.component_name}</div></td>
                                        <td class="alCenter"><div class="paperbandRowUnitQty" index="${index}">${item1.info.qty_per_paperband}</div></td>
                                        <td class="alCenter"><div class="paperbandRowUnit" index="${index}">Cps/band</div></td>`
                } else {
                    var paperband_tr = `<tr class="packing_tr paperband_tr" index="${index}">
                                        <td class="alCenter"><div class="paperbandRowComponentName" index="${index}">${item.component_name}</div></td>
                                        <td class="alCenter"><div class="paperbandRowUnitQty" index="${index}">${item1.info.qty_per_paperband}</div></td>
                                        <td class="alCenter"><div class="paperbandRowUnit" index="${index}">Cps/band</div></td>`
                }
                paperbandRow_arr.push(paperband_tr)
            }

            if (item1.name == 'kraftwrap') {
                item1.line.forEach((item2, index2) => {
                    kraftwrapColumn += `<td class="alRight"><div class="kraftwrapRowUnitprice" index="${index}" indexqty="${index2}">${item2.unit_price}</div></td>
                                    <td class="alCenter"><div class="kraftwrapRowQty" index="${index}" indexqty="${index2}">${item2.qty}</div></td>
                                    <td class="alRight"><div class="kraftwrapRowPrice" index="${index}" indexqty="${index2}">${item2.price}</div></td>`
                })
                kraftwrapColumn_arr.push(kraftwrapColumn)
                if (kraftwrapColumn_arr.length == 1) {
                    var kraftwrap_tr = `<tr class="packing_tr kraftwrap_tr" index="${index}">
                                        <td rowspan="${num_trKraftwrap}" colspan="2">Kraftwrap</td>
                                        <td class="alCenter"><div class="kraftwrapRowComponentName" index="${index}">${item.component_name}</div></td>
                                        <td class="alCenter"><div class="kraftwrapRowUnitQty" index="${index}">${item1.info.qty_per_pack}</div></td>
                                        <td class="alCenter"><div class="kraftwrapRowUnit" index="${index}">Cps/pack</div></td>`
                } else {
                    var kraftwrap_tr = `<tr class="packing_tr kraftwrap_tr" index="${index}">
                                        <td class="alCenter"><div class="kraftwrapRowComponentName" index="${index}">${item.component_name}</div></td>
                                        <td class="alCenter"><div class="kraftwrapRowUnitQty" index="${index}">${item1.info.qty_per_pack}</div></td>
                                        <td class="alCenter"><div class="kraftwrapRowUnit" index="${index}">Cps/pack</div></td>`
                }
                kraftwrapRow_arr.push(kraftwrap_tr)
            }
            if (item1.name == 'carton') {
                item1.line.forEach((item2, index2) => {
                    cartonColumn += `<td class="alRight"><div class="cartonRowUnitprice" index="${index}" indexqty="${index2}">${item2.unit_price}</div></td>
                                    <td class="alCenter"><div class="cartonRowQty" index="${index}" indexqty="${index2}">${item2.qty}</div></td>
                                    <td class="alRight"><div class="cartonRowPrice" index="${index}" indexqty="${index2}">${item2.price}</div></td>`
                })
                cartonColumn_arr.push(cartonColumn)
                if (cartonColumn_arr.length == 1) {
                    var carton_tr = `<tr class="packing_tr carton_tr" index="${index}">
                                    <td rowspan="${num_trCarton}" colspan="2">Carton</td>
                                    <td class="alCenter"><div class="cartonRowComponentName" index="${index}">${item.component_name}</div></td>
                                    <td class="alCenter"><div class="cartonRowUnitQty" index="${index}">${item1.info.carton.qty_per_carton}</div></td>
                                    <td class="alCenter"><div class="cartonRowUnit" index="${index}">Cps/carton</div></td>`
                } else {
                    var carton_tr = `<tr class="packing_tr carton_tr" index="${index}">
                                    <td class="alCenter"><div class="cartonRowComponentName" index="${index}">${item.component_name}</div></td>
                                    <td class="alCenter"><div class="cartonRowUnitQty" index="${index}">${item1.info.carton.qty_per_carton}</div></td>
                                    <td class="alCenter"><div class="cartonRowUnit" index="${index}">Cps/carton</div></td>`
                }
                cartonRow_arr.push(carton_tr)
            }
            if (item1.name == 'pallet') {
                item1.line.forEach((item2, index2) => {
                    palletColumn += `<td class="alRight"><div class="cartonRowUnitprice" index="${index}" indexqty="${index2}">${item2.unit_price}</div></td>
                                    <td class="alCenter"><div class="cartonRowQty" index="${index}" indexqty="${index2}">${item2.qty}</div></td>
                                    <td class="alRight"><div class="cartonRowPrice" index="${index}" indexqty="${index2}">${item2.price}</div></td>`
                })
                palletColumn_arr.push(palletColumn)
                if (palletColumn_arr.length == 1) {
                    var pallet_tr = `<tr class="packing_tr pallet_tr" index="${index}">
                                        <td rowspan="${num_trPallet}" colspan="2">Pallet</td>
                                        <td class="alCenter"><div class="palletRowComponentName" index="${index}">${item.component_name}</div></td>
                                        <td class="alCenter"><div class="palletRowUnitQty" index="${index}">${item1.info.bulk_qty_pallet}</div></td>
                                        <td class="alCenter""><div class="palletRowUnit" index="${index}">${check_packing[index].unit_pallet}</div></td>`
                } else {
                    var pallet_tr = `<tr class="packing_tr pallet_tr" index="${index}">
                                        <td class="alCenter"><div class="palletRowComponentName" index="${index}">${item.component_name}</div></td>
                                        <td class="alCenter"><div class="palletRowUnitQty" index="${index}">${item1.info.bulk_qty_pallet}</div></td>
                                        <td class="alCenter"><div class="palletRowUnit" index="${index}">${check_packing[index].unit_pallet}</div></td>`
                }
                palletRow_arr.push(pallet_tr)
            }
        })

        if (item.delivery) {
            item.delivery[0].price.forEach((item1, index1) => {
                deliveryColumn += `<td class="alRight"><div class="deliveryRowUnitPrice" index="${index}" indexqty="${item1}">${item1.unit_price}</div></td>
                                <td class="alCenter"><div class="deliveryRowQty" index="${index}" indexqty="${item1}">${item1.qty}</div></td>
                                <td class="alRight"><div class="deliveryRowPrice" index="${index}" indexqty="${item1}">${item1.price}</div></td>`
            })

            deliveryColumn_arr.push(deliveryColumn)

            if (deliveryColumn_arr.length == 1) {
                var delivery_tr = `<tr class="packing_tr delivery_tr" index="${index}">
                                    <td rowspan="${num_trDelivery}" colspan="3">Delivery</td>
                                    <td class="alCenter"><div class="deliveryRowComponentname" index="${index}">${item.component_name}</div></td>
                                    <td class="alCenter"></td>`
            } else {
                var delivery_tr = `<tr class="packing_tr delivery_tr" index="${index}">
                                    <td class="alCenter"><div class="deliveryRowComponentname" index="${index}">${item.component_name}</div></td>
                                    <td class="alCenter"></td>`
            }

            deliveryRow_arr.push(delivery_tr)
        }

        packing_obj = {
            paperband_tr: "",
            kraftwrap_tr: "",
            carton_tr: "",
            pallet_tr: "",
            delivery_tr: ""
        }

        if (paperbandColumn_arr.length != 0) {
            paperbandColumn_arr.forEach((item, index) => {
                packing_obj.paperband_tr += paperbandRow_arr[index] + item + `</tr>`
            })
        }
        if (kraftwrapColumn_arr.length != 0) {
            kraftwrapColumn_arr.forEach((item, index) => {
                packing_obj.kraftwrap_tr += kraftwrapRow_arr[index] + item + `</tr>`
            })
        }
        if (cartonColumn_arr.length != 0) {
            cartonColumn_arr.forEach((item, index) => {
                packing_obj.carton_tr += cartonRow_arr[index] + item + `</tr>`
            })
        }
        if (palletColumn_arr.length != 0) {
            palletColumn_arr.forEach((item, index) => {
                packing_obj.pallet_tr += palletRow_arr[index] + item + `</tr>`
            })
        }
        if (deliveryColumn_arr.length != 0) {
            deliveryColumn_arr.forEach((item, index) => {
                packing_obj.delivery_tr += deliveryRow_arr[index] + item + `</tr>`
            })
        }
    })
    return packing_obj
}

function summary_excel_total_tr(tb_total_row) {
    const mainData = est.mainData
    var totalColumn = "", tr = "", total_label, total_price, align_class1, align_class2, align_class3 = ""
    mainData.totalprice && mainData.totalprice.forEach((item, index) => {
        switch (tb_total_row) {
            case 'Material':
                total_price = item.material
                total_label = 'Total (Material)'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                break
            case 'Print':
                total_price = item.print
                total_label = 'Total (Print)'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                break
            case 'Plate':
                total_price = item.plate
                total_label = 'Total (Plate)'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                break
            case 'Process':
                total_price = item.afterpress
                total_label = 'Total (Process)'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                break
            case 'Other':
                total_price = item.other
                total_label = 'Total (Other)'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                break
            case 'Packing':
                total_price = item.delivery
                total_label = 'Total (Packing)'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                break
            case 'MarkUp':
                total_price = item?.mark_up_price || 0
                total_label = 'Mark up'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                align_class3 = "alCenter"
                break
            case 'MarkDown':
                total_price = item?.mark_down_price || 0
                total_label = 'Mark down'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                align_class3 = "alCenter"
                break
            case 'Price':
                total_price = item.total_price
                total_label = 'Subtotal Price'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                break
            case 'Tax':
                total_price = item.tax
                total_label = 'Tax ' + mainData.tax + ' %'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                break
            case 'FinalPrice':
                total_price = item.final_price
                total_label = 'Total Price'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                break
            case 'profit_sharing':
                total_price = item?.profit_sharing || 0
                total_label = 'Profit Sharing'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                break
            case 'UnitPrice':
                total_price = item.unit_price
                total_label = 'Unit Price/cps'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                break
            case 'UnitPriceExchange':
                total_price = item?.unit_price_fob_exchange || item?.unit_price
                total_label = 'Unit Price ( Exchange )'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                align_class3 = ""
                break
            case 'Exchange':
                total_price = item?.exchange_rate || 1
                total_label = 'Exchange Rate'
                align_class1 = "alCenter"
                align_class2 = "alCenter"
                align_class3 = ""
                break
            case 'Other':
                total_price = item.other
                total_label = 'Total (Other)'
                align_class1 = "alRight"
                align_class2 = "alLeft"
                align_class3 = ""
                break
        }
        if (['MarkUp', 'MarkDown'].includes(tb_total_row)) {
            totalColumn += `
                <td colspan="2" class="${align_class3}">
                    <div class="${tb_total_row}" index="${index}"> 
                    ${item[tb_total_row === 'MarkUp' ? 'mark_up_percent' : 'mark_down_percent']} %
                    </div>
                </td>
                <td class="${align_class1}">
                    <div class="total${tb_total_row}" indexqty="${index}">${total_price}</div>
                </td>
            `
        } else {
            totalColumn += `<td colspan="2"></td>
            <td class="${align_class1}"><div class="total${tb_total_row}" indexqty="${index}">${total_price}</div></td>`
        }

    })
    tr = `<tr class="totalRow total${tb_total_row}_tr">
            <td colspan="5" class="${align_class2}">${total_label}</td>
            ${totalColumn}
        </tr>`
    return tr
}

function summary_excel_tr_weight(is_forDisplay) {
    const isMultipleF = getIsMultipleF()
    const isDiffPacking = getIsDifferentPacking()
    const comp_arr = est.mainData.component1
    var weightRow = ''

    comp_arr.forEach((comp, index) => {
        let summaryLength = isMultipleF && isDiffPacking ? comp?.f_detail?.f_list?.length : 1
        let compName = comp.component_name

        for (let fIndex = 0; fIndex < summaryLength; fIndex++) {
            let bulk, bulk_name, bulk_unit,
                kraftwrap_item, carton_item, pallet_item

            const pallet = est.getPackingObj(comp, 'pallet', fIndex)
            const unit = getUnitPacking(index, is_forDisplay, fIndex)
            const deliveryInfo = comp?.delivery[fIndex]
            let pallet_size = layer = qty_layer = '-'

            if (isMultipleF) {
                compName = summaryLength == 1 ? 'All' : comp?.f_detail?.f_list[fIndex]?.f_code || 'Error'
            }

            if (pallet != null) {
                pallet_size = pallet.info.pallet_size[0] + '" x ' + pallet.info.pallet_size[1] + '" x ' + pallet.info.pallet_size[2] + '"'
                layer = pallet.info.layer_per_pallet
                qty_layer = pallet.info.laying.qty_layer
            }

            comp.packing[fIndex].forEach((item1, index1) => {
                if (item1.name == 'kraftwrap') {
                    kraftwrap_item = item1
                }
                if (item1.name == 'carton') {
                    carton_item = item1
                }
                if (item1.name == 'pallet') {
                    pallet_item = item1
                }
            })

            switch (unit) {
                case 'piece':
                    bulk_name = 'Pallet size'
                    bulk = [pallet_item.info.laying.cube_size[0], pallet_item.info.laying.cube_size[1], pallet_item.info.pallet_height]
                    bulk_unit = 'pcs'
                    break
                case 'kraftwrap':
                    bulk_name = 'Kraftwrap size'
                    bulk = kraftwrap_item.info.inner_size
                    bulk_unit = 'kraftwrap'
                    break
                case 'carton':
                    bulk_name = 'Carton size'
                    bulk = carton_item.info.size.inner_size
                    bulk_unit = 'carton'
                    break
            }

            weightRow += `<tr class="weight_tr  td-align-center">
                    <td rowspan="4">${compName}</td>
                    <td>Weight</td>
                    <td>${comp.weight.weight}</td>
                    <td>kg/1 cp.</td>
                    <td style="text-align:center">${bulk_name}</td>
                    <td>กว้าง</td>
                    <td>ยาว</td>
                    <td>สูง</td>
                </tr>
                <tr class="weight_tr  td-align-center">
                    <td>Thickness</td>
                    <td>${comp.thickness.inch.packing_thickness}</td>
                    <td>inch</td>
                    <td style="text-align:center">Inner size (inch)</td>
                    <td>${bulk[0]}</td>
                    <td>${bulk[1]}</td>
                    <td>${bulk[2]}</td>
                </tr>
                <tr class="weight_tr alCenter">
                    <td>Pallet size</td>
                    <td colspan="4">${pallet_size}</td>
                    <td>Net weight</td>
                    <td><div>${numeral(deliveryInfo.net_weight).format('0,0.00')}</div></td>
                    <td>kg/pack</td>
                </tr>
                <tr class="weight_tr alCenter">
                    <td>วางสูง</td>
                    <td>${layer}</td>
                    <td>ชั้นๆ ละ</td>
                    <td>${qty_layer}</td>
                    <td>${bulk_unit}</td>
                    <td>Gross weight</td>
                    <td>${numeral(deliveryInfo.gross_weight).format('0,0.00')}</td>
                    <td>kg/pack</td>
                </tr>
            `

        }

    })
    return weightRow
}

function setComponentDivValue(index) {
    const {
        layout: { layout_grain, selected_layout },
    } = est.mainData.component1[index]

    $(`.layout_grain[index=${index}]`).val(layout_grain || selected_layout?.grain_box_type || null)
}


//* END function create SUMMARY TABLE ------------------------------------------------------------


//* START RESET INDEX ------------
function resetDeliveryIndex() {
    const deliveryProcessTr = $(`#deliveryProcess table:first tr.deliveryProcess`)
    for (let index = 0; index < deliveryProcessTr.length; index++) {
        deliveryProcessTr[index].attributes.index.value = index
    }
}
//* END RESET INDEX -------------

function toggleSplitDelivery(ele, bool = false) {
    const is_multiple_f = getIsMultipleF()
    if (bool) {
        $(ele).closest('tr').removeClass('deliveryProcess').removeAttr('index')
        const arrQty = []
        if (is_multiple_f) {
            $('.f_table').each((fIndex, ele) => {
                const qty = numeral($(`#multiple_f_qty_info .inputQty:eq(${fIndex}) input`).val()).value()
                arrQty.push({
                    comp: fIndex,
                    qty: qty,
                    balance: qty
                })
            })
        } else {
            const qty = numeral($('#qty_info .inputQty input:eq(0)').val()).value()
            $('.component').each((index, comp) => {
                arrQty.push({
                    comp: index,
                    qty: qty,
                    balance: qty
                })
            })
        }
        est.setDefaultDeliveryQty(arrQty)
        $('.splitDelivery').show()
        $('.oneTimeDelivery').hide()
        $('.splitDelivery').click()
        // $('.deliveryDate').addClass('required')
    } else {
        $(ele).closest('tr').addClass('deliveryProcess').attr('index', 0)
        $('.splitDelivery').hide()
        $('.chk_split_delivery').prop("checked", false)
        $('.oneTimeDelivery').show()
        $('#deliveryProcess table tr').remove()
        // $('.deliveryDate').removeClass('required')
    }
}


function resetTrDeliveryIndex() {
    $(`#deliveryProcess table:first tr.deliveryProcess`).each((index) => {
        $(`#deliveryProcess table:first tr.deliveryProcess:eq(${index})`).attr("index", index)
    })

}

function displayManualLayoutSize(index) {
    const item = est.mainData.component1[index]
    const { layout: { laySize, selected_layout, std_layout_id }, paper_info } = item || {}
    const { grain_box_type } = selected_layout || {}
    const { roll_width, cut_off } = item.paper_info || {}
    const { parallel_roll_width } = paper_info || {}
    $('.tbLayout[index=' + index + '] .layoutWSize').html(`${laySize[0]} <br>(${roll_width})`)
    $('.tbLayout[index=' + index + '] .layoutLSize').html(`${laySize[1]} (${cut_off})`)
    $(`.tbLayout[index=${index}]`).find('tr.row_noti_layout_grain td').html("")

    if (!grain_box_type || !parallel_roll_width || !parallel_roll_width) {
        return
    }
    let check_layout_grain = {
        check: 'ผิดเกรน',
        layout_grain: 'เกรนชิ้นงานแนวตั้ง',
        paper_grain: 'เกรนกระดาษแนวนอน'
    }

    if (grain_box_type === 'horizontal' && parallel_roll_width === 'WSize') {
        check_layout_grain = {
            check: 'ถูกเกรน',
            layout_grain: 'เกรนชิ้นงานแนวนอน',
            paper_grain: 'เกรนกระดาษแนวนอน'
        }
    } else {
        check_layout_grain.layout_grain = grain_box_type === 'horizontal' ? 'เกรนชิ้นงานแนวนอน' : 'เกรนชิ้นงานแนวตั้ง'
        check_layout_grain.paper_grain = parallel_roll_width === 'WSize' ? 'เกรนกระดาษแนวนอน' : 'เกรนกระดาษแนวตั้ง'
    }
    if (item.layout_manual && laySize && roll_width && cut_off) {
        $('.tbLayout[index=' + index + '] td.noti_layout_grain').html(`
           <center>
                <div class="noti_manualLay">
                    <div class="v_align_top text-right">${check_layout_grain.check} :</div>
                    <div class="v_align_top text-left">
                        ${check_layout_grain.layout_grain}<br>
                        ${check_layout_grain.paper_grain}
                    </div>
                </div>
           </center>
        `)
    }

    $(`.std_layout_size[index=${index}]`).val(std_layout_id || '');
}

function addAddonSize(className, compIndex, process_index) {
    const selector = `div.${className}[index=${compIndex}][process-index=${process_index}] table:last`
    const newTr = $(`${selector} tr:first`).clone()
    $(selector).append(newTr)
    $(selector).find('tr:last input').val('')
    $(selector).find('tr:last .add-addon-size').remove()
    //  $(selector).find('.delete-addon-size').remove()
    $(selector).find('tr:last td:last').append('<div class="delete-addon-size">ลบ</div>')
}

function addAddonFCode(className, name, compIndex, process_index) {
    const selector = `div.${className}[index=${compIndex}][process-index=${process_index}] table.tbAddonInput > tbody`
    const newTr = `								
        <tr class="trInputF f-addon">
            <td colspan="2"></td>
            <td>
                <select class="${name}FCode f-code-select required" style="text-align-last:center;width:120px;">
                    <option value="">- F Code -</option>
                </select>
            </td>
            <td>
             <div class="delete-addon-f-code">ลบ</div>
            </td>
        </tr>
    `
    $(`${selector} .trInputF:last`).after(newTr)
    $(selector).find('tr.f-addon:last select').val('')
    $(selector).find('.f-addon').show()

    //  $(selector).find('tr.f-addon:last .add-addon-size').remove()
    //  $(selector).find('.delete-addon-size').remove()
    //  $(selector).find('tr.f-addon:last td:last').append('<div class="delete-addon-size">ลบ</div>')
}



function showRecalcPaperUsage(compIndex, callback) {
    if (checkComponentInfo()) {
        $('.componentPaperUsage[index=' + compIndex + '] .recalc-paperusage').addClass('show-bttn')
        $('.componentPaperUsage[index=' + compIndex + '] table').hide()
        showCalcBttnPrice()
        callback && callback()
    }
}


function toggleMultipleF(bool = false, isConfirm = false) {
    $('.chk_color_limit').prop('checked', false)
    if (bool) {
        if ($('div.component').length > 1) {
            const check_confirm = confirm('งานหลาย F สามารถทำได้ 1 Comp. ต่อ 1 RFQ เท่านั้น ต้องการลบ Comp. อื่นๆหรือไม่ ?')
            if (!check_confirm) {
                $('#is_multiple_f').prop('checked', false)
                return
            }
            if (est.mainData.component1?.length > 1) {
                est.mainData.component1.length = 1
            }
        }

        if (!isConfirm) {
            const confirmChange = confirm('การเลือกงานหลาย F จะทำให้ข้อมูลบางส่วนที่กรอกไว้ก่อนหน้านี้หายไป\nยืนยันใช่ หรือไม่ ?')
            if (!confirmChange) {
                $('#is_multiple_f').prop('checked', false)
                return
            }
        } else {
            $('#is_multiple_f').prop('checked', true)
        }

        $('.color_limit_normal').hide()
        $('.color_limit_f').hide()

        $('.inputQty input,.runonQty input').closest('td').not(`:nth-child(2)`).remove()
        // * reset input value
        $('.f-code,.f-totalQty input,.f-sumTotalQty input, .runonPercent, .inputQty input, .runonQty input, .aeQty input, .customerQty input').val('')
        $('#add-remove-component-bttn, #qty_info').hide()
        $('div.component').not(':first').remove()
        $('div.componentInfo').not(':first').remove()
        $('#multiple_f_qty_info, .f-input, .f-section').show()
        //* addon
        $(`.addonInput`).each((index, ele) => {
            const checked = $(ele).find(`input[type=checkbox]`).prop('checked')
            const checkAdded = $(ele).hasClass('addedProcess')
            if (checked || checkAdded) {
                $(ele).find('.f-addon').show()
            }
        })

        getFCodeSelectOption()


    } else {
        $('#qty_info').show()
        $('#add-remove-component-bttn').show()
        $('#multiple_f_qty_info').hide()
        $('#multiple_f_qty_info table.f_table').not('table.f_table:first').remove()
        $('#multiple_f_qty_info table.f_table input').val('')
        $('.f-input, .f-section, .f-addon').hide()
        $('.component').each((index, ele) => {
            $(ele).find('.specialInk-container').not(':first').remove()
            recalcLayoutEachComponent(index)
        })
        $('#is_different_packing').attr('checked', false)

        $('.color_limit_normal').not('.color_limit').show()

        est.setDifferentPacking(false)
    }

    // checkRequiredInput()
    // if (checkComponentInfo()) {
    //     showCalcBttnPrice()
    // }

    setChangeNumberOfPriceDiffInputQty()
    setChangeNumberOfCustomerGiftInputQty()
    resetDelivery()

    recalcAllLayout()
    checkRequiredInput()
}

function setDefaultElement() {

    $('.datepicker').datepicker({
        format: "dd/mm/yyyy",
        todayBtn: "linked",
        clearBtn: true,
        autoclose: true,
        todayHighlight: true,
        placeholder: 'dd/mm/yyyy'
    });

    $("textarea:not(#reject-remark-popup)").each(function () {
        this.setAttribute("style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden;");
    }).on("input", function () {
        this.style.height = "auto";
        this.style.height = (this.scrollHeight) + "px";
    });

    $('.colorOutside,.colorInside').inputmask({ regex: "^[0-8]{1}", placeholder: "" })
    $('#tax input,.markUp input,.markDown input').inputmask({ regex: "^[0-9]{0,3}(\\.\\d{1,2})?$", placeholder: "" })
    $('.MarkingPercentMaterial input, .MarkingPercentProduction input').inputmask({ regex: "^[0-9]{0,3}(\\.\\d{1,2})?$", placeholder: "" })
    $('.inputQty input,.runonQty input,.aeQty input,.customerQty input,.color_limit input,.f-totalQty input,input.f-sumTotalQty').inputmask({
        'alias': 'decimal',
        'groupSeparator': ',',
        'autoGroup': true,
        'digits': 0,
        'digitsOptional': false,
        'placeholder': ''
    })
    $('.runonPercent').inputmask("9[9]", { "placeholder": "" })
    $('#foilRollWidth-custom, #foilRollLength-custom, #foilRollPrice-custom, #foilRollMinPrice-custom').inputmask({ regex: "^[0-9]{0,7}(\\.\\d{1,2})?$", placeholder: "" })
}

function getIsSplitDelivery() {
    return $(`input.chk_split_delivery`).prop('checked') || false
}

function getIsMultipleF() {
    return $(`#is_multiple_f`).prop('checked') || false
}

function setIsReprint(bool = false) {
    $('#is_reprinted select').val(bool ? 1 : 0)
    displayIsReprinted()
}

function getIsRePrint() {
    return $(`#is_reprinted select`).val() == 1 ? true : false
}

function getIsUsePreviousPlate() {
    return $(`#is_use_previous_plate`).prop('checked') || false
}

function getIsDifferentPacking() {
    const isMultipleF = getIsMultipleF()
    return isMultipleF ? est.mainData.job?.is_different_packing : false
}

function getFCodeSelectOption() {
    const arrFCode = []
    $(`.f-code`).each((index, ele) => {
        if ($(ele).val()) {
            arrFCode.push($(ele).val())
        }
    })

    const options = arrFCode.map((fcode) => `<option value="${fcode}">${fcode}</option>`)
    options.unshift(`<option value="">--- F Code ---</option>`)

    // options.concat()
    $('.f-code-select').each((index, element) => {
        const currChecked = $(element).find("option:checked").index() || ""
        $(element).html(options)
        if (currChecked >= 0) {
            $(element).find('option').eq(currChecked).prop('selected', true)
        }
    })
    // return options
    checkRequiredInput()
}

function storeAllData(isNotLayout = false) {
    /* 
    1.validate ข้อมูล
    2.เก็บข้อมูล job info , ประเภทงาน , หมึก , ประเภทพิมพ์ , ลิมิตสี
    3.เก็บข้อมูล qty
    4.เก็บข้อมูล comp.
        4.1 comp. info
        4.2 color
        4.3 paper
        4.4 addon
        4.5 comp. template & size
    5. เก็บข้อมูล delivery
    */

    storeDate()
    storeJob()
    storeAEName()
    storeCustomerName()
    storeEstimatorName()

    if (!isNotLayout) {
        var comp_arr = []
        $('.component').each(function (index) {
            var component_detail = getComponentDetail(index)
            comp_arr.push(component_detail)
        })
        est.setComponent1(comp_arr)
    }

    storeTax()
    storeExchangeRate()
    storeOtherProcess()
    storeHandworkProcess()
    storeCustomProcess()
    storeMaterial()
    storeOtherCost()
    storePriceDifference()
    storeCustomerGift()

    //* END store Qty
}

function recalcTotalFQty() {
    let sumTotalQty = 0

    $(`#multiple_f_qty_info .f_table`).each((index, ele) => {
        const fQty = numeral($(ele).find('.inputQty input').val() || 0).value()
        const runonQty = numeral($(ele).find('.runonQty input').val() || 0).value()
        const aeQty = numeral($(ele).find('.aeQty input').val() || 0).value()
        const customerQty = numeral($(ele).find('.customerQty input').val() || 0).value()

        // const runonQty = parseFloat((fQty * runonPercent).toFixed(2))
        const totalQty = fQty + runonQty + aeQty + customerQty
        $(ele).find('.f-totalQty input').val(totalQty)
        sumTotalQty += totalQty
    })

    $(`.f-sumTotalQty`).val(sumTotalQty)
}

function setCoatingComponent(compIndex, processIndex, coatingType, coatingSide) {
    const listOfCoating = ['S-WTB', 'UV_GAP', 'UV_ANTI_GAP', 'S-WTB-HR', 'S-H-WTB', 'S-UV-ANTI']
    removeTRCoatingSpecialInput(compIndex, processIndex)
    removeBlanketUVGap(compIndex, processIndex)
    setCoatingDripOffComponent(compIndex)

    if (coatingType) {
        if (['S-UV', 'S-UV-S', 'B-PACK', 'P-PAT'].includes(coatingType)) {
            getTRCoatingSpecialInput(compIndex, processIndex, coatingType)

        } else if (listOfCoating.includes(coatingType)) {
            getBlanketUVGap(compIndex, processIndex, coatingType, coatingSide)

        }
    }
}

function setCoatingDripOffComponent(compIndex) {
    const is_multiple_f = getIsMultipleF()
    const printType = getPrintType()
    const {
        validate: isDripOff,
        count: countDripOff
    } = checkSomeCoatingType(compIndex, 'UV-D') || {}

    if (!isDripOff) {
        //* not have coating diff off
        $(`.component[index=${compIndex}] .has_speInk`).prop("disabled", false)
        $(`.component[index=${compIndex}] .tr_speInk.ink-drip-off`).remove()

        if (
            $(`.component[index=${compIndex}] .has_speInk`).prop("checked") &&
            $(`.component[index=${compIndex}] .tr_speInk`).length === 0
        ) {
            $(`.component[index=${compIndex}] .has_speInk`).prop("checked", false)
            $(`.div-speInk[index=${compIndex}]`).hide();
        }

    } else {
        if (!['Jet Press', 'Konica']?.includes(printType)) {

            $(`.component[index=${compIndex}] .specialInk-container`).each((eleIndex, ele) => {
                const countTrDripOff = $(ele).find('tr.ink-drip-off').length || 0

                if (countTrDripOff < isDripOff) {
                    if (countDripOff > 0) {
                        //* check speInk and disabled to un-checked
                        $(`.component[index=${compIndex}] .has_speInk`).prop("checked", true).prop("disabled", true)
                    }
                    //* have coating diff off
                    if (countTrDripOff < countDripOff) {
                        const obj = {
                            name: "Drip off",
                            type: '47',
                            filling: "stripe",
                            className: 'ink-drip-off'
                        }

                        if (is_multiple_f) {
                            // $('.specialInk-container').each((colorIndex) => {
                            addSpecialInk(compIndex, obj, eleIndex)
                            // })
                        } else {
                            addSpecialInk(compIndex, obj, 0)
                        }
                    } else if (countTrDripOff > countDripOff) { //* delete drip off
                        const diffNumber = countTrDripOff - countDripOff

                        if (diffNumber <= 0) {
                            return false;
                        }

                        $(`.component[index=${compIndex}] .table_speInk`).each((_, table_speInk) => {
                            $(table_speInk).find(`tr.ink-drip-off:gt(${diffNumber - 1})`).remove()
                        })
                    }
                }
            })
            $(`.div-speInk[index=${compIndex}]`).show();
        }

    }
}

function setSummaryProcess() {
    const { isReCalPrice } = est.process || {}
    if (!isReCalPrice) {
        //*  set ค่าเริ่มต้นของข้อมูล และสดงผล
        setDefaultDivPacking()
        /*
        setDefaultDivPacking >
            remove ของเดิม
            setDivPacking()
        */
    } else {
        //* ใช้ข้อมูลที่มีอยู่มาแสดง
        setDivPacking()
        displayPacking(est.mainData)
    }

    summary_excel(true)
    exportExcel()
    $('#calc_price_after_change').hide()
    $('#calc_price_after_packing').show()
    scrollToSection('#Summary')

    displaySave(true)
}

function getNumKraftwrap(compIndex, fIndex = 0) {
    const numKraftwrap = [
        parseInt($(`.numW_Kraftwrap[index=${compIndex}][fIndex=${fIndex}]`).val() || 1),
        parseInt($(`.numL_Kraftwrap[index=${compIndex}][fIndex=${fIndex}]`).val() || 1)
    ]
    return numKraftwrap
}

function getPackingChecked(compIndex, fIndex = 0) {
    return {
        checkPaperband: $(`.paperband[index=${compIndex}][fIndex=${fIndex}] input`).prop('checked') || false,
        checkKraftwrap: $(`.kraftwrap[index=${compIndex}][fIndex=${fIndex}] input`).prop('checked') || false,
        checkCarton: $(`.carton[index=${compIndex}][fIndex=${fIndex}] input`).prop('checked') || false,
        checkPallet: $(`.pallet[index=${compIndex}][fIndex=${fIndex}] input`).prop('checked') || false,
    }
}

function setEnableSpecialInk(bool = true) {
    if (bool) {
        $('.group_check_special_ink').show()
    } else {
        $('.group_check_special_ink').hide()
        $('.has_speInk').prop('checked', false)
        $('.div-speInk').hide()
        $('.tr_speInk').remove()
    }
}

function setEnableBlackPrinting(bool = true) {
    if (bool) {
        $('.group_check_black_printing').show()
    } else {
        $('.group_check_black_printing').hide()
        $('.is_black_printing').prop('checked', false)
    }
}

function setEnableDigitalDiecut(bool = true) {
    if (bool) {
        $('.div-digital-diecut').show()
    } else {
        $('.div-digital-diecut').hide()
        $('.is_digital_diecut').prop('checked', false)
    }
}

function setDisplayForKonica() {
    const printType = getPrintType()

    console.log('setDisplayForKonica', printType)
    if (printType == 'Konica') {
        setEnableBlackPrinting(true)
        setEnableDigitalDiecut(true)
        $('.componentType option').hide()
        $('.componentType option[value=1]').show()
    } else {
        setEnableBlackPrinting(false)
        setEnableDigitalDiecut(false)
    }
}

function setDisplayForJetPress() {
    const printType = getPrintType()
    if (['Jet Press'].includes(printType)) {
        // $('.machine-display').hide()
        $('.componentType option[value=3]').hide()
    } else {
        // $('.machine-display').show()
        $('.componentType option[value=3]').show()
    }
}

function getUsableMachine(item, machineList) {
    const ink_type = getInkType()
    const print_type = getPrintType()
    const isOnlyCut2 = getIsOnlyCut2(item)
    let usableMachine = machineList
    if (ink_type == 'UV' && print_type == 'Offset' && isOnlyCut2) {
        usableMachine = machineList?.filter(obj => obj.machine_size.id == 2)
    }

    return usableMachine
}


function displayIsReprinted() {
    const printType = getPrintType()
    const is_rePrinted = getIsRePrint()

    if (printType === 'Offset' && is_rePrinted == 1) {
        $('.use_prev_plate').show()
    } else {
        $('.use_prev_plate').hide()
        $('#is_use_previous_plate').prop('checked', false)
    }

}

function getProfitAndLossSection(table_id = '#summary') {
    $('#profit_and_lost').remove()
    const div = `
        <tr id="profit_and_lost">
            <td colspan="17">
                <div class="profit_and_lost_control" style="padding:5px;">
                    <input type='checkbox' class='is_loss' disabled> <span class="mr-1">ขาดทุน</span>
                </div>
            </td>
        </tr>
    `

    $(`${table_id} table tbody`).append(div)
}

function getMarkDownSection(table_id = '#summary') {
    if (!checkSystemVersion(est.getSystemVersion(), 3.1)) return

    $('#markdown_section').remove()
    const div = `
        <tr id="markdown_section">
            <td colspan="17">
                <div class="markdown_section_control" style="padding:5px;margin-left:25px;">
                    <span class="mr-1">Mark down</span>
                </div>
            </td>
        </tr>
    `

    $(`${table_id} table tbody`).append(div)
}

function setProfitAndLossQtySection(bool = false) {
    let ele = ''

    $('#profit_and_lost .profit_and_lost_control input:not(:first)').remove()

    $('.is_loss').prop('checked', bool)

    if (bool) {
        ele += `
            <input type='text' class='loss_baht required text-right mr-1' style='width:80px;' value="${0}" readonly>
        `

        ele = ele.repeat(est.mainData.totalprice?.length)

        $('#profit_and_lost .profit_and_lost_control').append(ele)

        $('.loss_baht').inputmask({ regex: "^[0-9]{0,7}(\\.\\d{1,2})?$", placeholder: "" })
        $('.loss_baht').inputmask({
            'alias': 'decimal',
            'groupSeparator': ',',
            'autoGroup': true,
            'digits': 2,
            'digitsOptional': true,
            'placeholder': ''
        })


        for (let i = 0; i < est.mainData?.totalprice?.length; i++) {
            const total = est.mainData?.totalprice[i]
            $(`.loss_baht:visible:eq(${i})`).val(total?.loss || 0)
        }
    }

}

function setMarkDownQtySection(bool = false) {
    if (!checkSystemVersion(est.getSystemVersion(), 3.1)) return
    let ele = ''

    $('#markdown_section .markdown_section_control input:not(:first)').remove()

    if (bool) {
        ele += `
            <input type='text' class='totalMarkdown required text-right mr-1' style='width:80px;' value="${0}" readonly>
        `

        ele = ele.repeat(est.mainData.totalprice?.length)

        $('#markdown_section .markdown_section_control').append(ele)

        for (let i = 0; i < est.mainData?.totalprice?.length; i++) {
            const total = est.mainData?.totalprice[i]
            $(`.totalMarkdown:visible:eq(${i})`).val(total?.total_marking_material_production >= 0 ? '' : numeral(Math.abs(total?.total_marking_material_production)).format('0,000.00'))
            console.log("display MarkDown : ", total?.total_marking_material_production)
        }
    }

}

function setDefaultLoss() {

    const is_loss = $('.is_loss').prop('checked') || false

    if (!is_loss) {
        $(`.loss_baht`).val(0)
        return
    }

    est.mainData.totalprice.forEach((total, index) => {
        $(`.loss_baht:visible:eq(${index})`).val(total?.mark_down_percent >= 12 ? total?.mark_down_price || 0 : 0)
    })
}

function getTRLoss() {
    let tr = `
        <tr id="profit_and_lost">
            <td>
                <div class="profit_and_lost_control" style="padding:5px;">
                    <span class="mr-1">ขาดทุน</span>
                </div>
            </td>
        
    `
    est.mainData.totalprice && est.mainData.totalprice.forEach(total => {
        // const val = total?.loss || 0
        tr += `
           <td>
           ${total?.loss || 0}
           </td>
        `
    })

    tr += `
            
    </tr>
    `

    return tr
}

function setChangeNumberOfPriceDiffInputQty() {
    const isMultipleF = getIsMultipleF()
    const isDifferent = $('.chk_price_difference').prop('checked') || false
    const qtyLength = isMultipleF ? 1 : $(`div.inputQty:visible`).length

    if (isDifferent) {
        let tdInput = []

        $('td:has(input.price_difference)').each((_, ele) => {
            tdInput.push(ele)
        })

        let td = ''
        if (qtyLength < tdInput.length) {

            td = tdInput.splice(0, qtyLength)
            $('.price_difference_tr').html(td)
        } else {
            td = `
                <td>
                    <input type='text' class='price_difference required' style="width:80px;text-align:center;">
                </td>
            `.repeat((qtyLength - tdInput.length))

            $('.price_difference_tr').append(td)
        }

        $('.price_difference_tr input:not(.masked)').inputmask({ regex: "^[0-9]{1,5}(\\.\\d{1,4})?$", placeholder: "" }).addClass('masked')
    } else {
        $('.price_difference_tr td').remove()
    }

    checkRequiredInput()
}
function setChangeNumberOfCustomerGiftInputQty() {
    const isMultipleF = getIsMultipleF()
    const isCustomerGift = $('.chk_customer_gift').prop('checked') || false
    const qtyLength = isMultipleF ? 1 : $(`div.inputQty:visible`).length
    if (isCustomerGift) {
        let tdInput = []

        $('td:has(input.customer_gift)').each((_, ele) => {
            tdInput.push(ele)
        })

        let td = ''
        if (qtyLength < tdInput.length) {

            td = tdInput.splice(0, qtyLength)
            $('.customer_gift_tr').html(td)
        } else {
            td = `
                <td>
                    <input type='text' class='customer_gift required' style="width:80px;text-align:center;">
                </td>
            `.repeat((qtyLength - tdInput.length))

            $('.customer_gift_tr').append(td)
        }

        $('.customer_gift_tr input:not(.masked)').inputmask({ regex: "^[0-9]{1,7}(\\.\\d{1,2})?$", placeholder: "" }).addClass('masked')
    } else {
        $('.customer_gift_tr td').remove()
    }

    checkRequiredInput()
}

function storePriceDifference() {
    let priceDiff = []
    $('.price_difference_tr input').each((index, element) => {
        priceDiff.push(parseFloat($(element).val() || 0))
    })

    est.setPriceDifference(priceDiff)
}

function storeCustomerGift() {
    let custGift = []
    $('.customer_gift_tr input').each((index, element) => {
        custGift.push(parseFloat($(element).val() || 0))
    })

    est.setCustomerGift(custGift)
}

function setEnableMarkingPercent() {
    const isAdmin = JSON.parse(localStorage.getItem('data'))?.roles?.some(obj => obj.user_group_id === 1) || false
    const { is_super_admin } = JSON.parse(localStorage.getItem('data')) || false
    const isRequestCustomerCommission = $('.chk_price_difference:checked')?.length ? true : false
    const markingSelector = '.MarkDown input, .MarkUp input, .MarkingPercentMaterial input, .MarkingPercentProduction input'

    $(markingSelector).attr('readonly', true)

    if (isAdmin) {
        $(markingSelector).attr('readonly', false)
    }

    if (isRequestCustomerCommission) {
        $('.MarkDown input').attr('readonly', true)
    }

    if (is_super_admin) {
        $('.MarkDown input').attr('readonly', false)
    }
}
function setChangePrintType(printType = '') {

    defaultData.print_type_config.setPrintTypeConfig(printType)

    switch (printType) {
        case 'Offset':
            // setEnableSpecialInk(true)
            setEnableProfitSharing(true)
            break;
        case 'Konica':
        case 'Flexo':
        case 'Jet Press':
            // setEnableSpecialInk(false)
            setEnableProfitSharing(false)
            $('.chk_profit_sharing').prop('checked', false)
        default:
            break;
    }

    const num_comp = $('.component').length

    if (num_comp) {
        resetPaperTypeList(num_comp)
        resetPaperGramList(num_comp)
        getComponentTypeOption()
        resetCorrugated(num_comp)

        for (var index = 0; index < num_comp; index++) {
            switch (printType) {
                case 'Flexo':
                    $('#flexo_size').show()
                    $('#flexo_size input').val("")
                    checkNumColor4Flexo(num_comp)
                    changeComponent(index, 3)
                    setfluteAlign(index, 3)
                    break;
                case 'Offset':
                case 'Jet Press':
                case 'Konica':
                default:
                    changeComponent(index, 1)
                    setfluteAlign(index, 1)
                    $('#flexo_size').hide()
                    setCoatingDripOffComponent(index)
                    break;
            }

            recalcLayoutEachComponent(index)
        }

        setPrintTypeSpecialInk()

        setJobProfitSharing()
        setPaperMarkingPrice()

        setDisplayForJetPress()
        setDisplayForKonica()

        displayIsReprinted()
        recalcAllLayout()
    }

    checkRequiredInput()
}

function setPrintTypeSpecialInk() {
    const printType = getPrintType()

    if (['Jet Press', 'Flexo', 'Konica'].includes(printType)) {
        setEnableSpecialInk(false)
    } else {
        setEnableSpecialInk(true)
    }
}

function setPaperMarkingPrice() {

    $('.component').each(function (index) {
        setChangePaperSource(index)

        displayPaperFinalPrice(index)
    })
}

function setChangePaperSource(index) {
    $(`.paperMarkup[index=${index}] input`).val(defaultData?.paper_price_marking)

    const paper_source_id = $(`.select_paper_source:eq(${index})`).val() || 1

    if (paper_source_id == 2) {
        $(`.paperMarkup[index=${index}] input`).val(defaultData?.import_paper_price_marking)
    }
}

function setEnableProfitSharing(bool = false) {
    if (bool) {
        // $('.chk_profit_sharing').prop('disabled', !bool)
        $('.profit_sharing').show()
    } else {
        $('.profit_sharing').hide()
    }
}

function setJobProfitSharing() {
    const isProfitSharing = getIsProfitSharing()

    const {
        profit_sharing: {
            paper: {
                marking_price
            },
            plate_price,
            afterpress_price_marking,
            material_price_marking,
            outsouce_price_marking,
            corrugated_markup,
            marking_total_price,
            packing_marking = 0,
            delivery_marking = 0
        },
        default_marking,
        special_customer_marking = 0
    } = defaultData || {}
    // set master

    setUpdatePaperMarking()

    if (isProfitSharing) {
        // $('tr.otherCostProcess').remove()
        // $('#otherCost div.addProcess').addClass('disabled')
        // defaultData.paper_price_marking = marking_price + special_customer_marking
        // defaultData.import_paper_price_marking = marking_price + special_customer_marking
        defaultData.plate_price = plate_price
        defaultData.afterpress_price_marking = afterpress_price_marking
        defaultData.material_price_marking = material_price_marking
        defaultData.outsouce_price_marking = outsouce_price_marking
        // defaultData.corrugated_markup = corrugated_markup
        defaultData.corrugated_markup = material_price_marking
        defaultData.marking_total_price = marking_total_price
        defaultData.packing_marking = packing_marking
        defaultData.delivery_marking = delivery_marking

        setIsReprint(0)
        $('#is_reprinted select').prop('disabled', true)
    } else {
        // $('#otherCost div.addProcess').removeClass('disabled')
        // defaultData.paper_price_marking = default_marking.paper.marking_price + special_customer_marking
        // defaultData.import_paper_price_marking = default_marking.paper.import_marking_price + special_customer_marking
        defaultData.plate_price = default_marking.plate_price
        defaultData.afterpress_price_marking = default_marking.afterpress_price_marking
        defaultData.material_price_marking = default_marking.material_price_marking
        defaultData.outsouce_price_marking = default_marking.outsouce_price_marking
        // defaultData.corrugated_markup = default_marking.corrugated_markup
        defaultData.corrugated_markup = default_marking.corrugated_markup
        defaultData.marking_total_price = default_marking.marking_total_price
        defaultData.packing_marking = default_marking.packing_marking
        defaultData.delivery_marking = default_marking.delivery_marking
        $('#is_reprinted select').prop('disabled', false)
    }
}

function setUpdatePaperMarking() {
    const isProfitSharing = getIsProfitSharing()

    const {
        profit_sharing: {
            paper: {
                marking_price
            },
        },
        default_marking,
        special_customer_marking: special_marking = 0
    } = defaultData || {}

    const isSpecialCustomer = getIsSpecialCustomer()

    let special_customer_marking = isSpecialCustomer ? special_marking : 0

    if (isProfitSharing) {
        // $('tr.otherCostProcess').remove()
        // $('#otherCost div.addProcess').addClass('disabled')
        defaultData.paper_price_marking = marking_price + special_customer_marking
        defaultData.import_paper_price_marking = marking_price + special_customer_marking
    } else {
        // $('#otherCost div.addProcess').removeClass('disabled')
        defaultData.paper_price_marking = default_marking.paper.marking_price + special_customer_marking
        defaultData.import_paper_price_marking = default_marking.paper.import_marking_price + special_customer_marking
    }
}

function checReCalculatation() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const is_recalc = urlParams.get('recalc') == 1 ? true : false
    if (is_recalc) {
        recalcAllLayout()
    } else {
        console.log("no request calc")
    }
}

function recalcAllLayout() {
    setUItoRecalcLayout()

    $('.component').each((index, ele) => {
        recalcLayoutEachComponent(index)
    })

    checkRequiredInput()
    if (checkComponentInfo()) {
        showCalcBttnPrice()
    }
}

function checkCopyRFQ() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const rfq_id = urlParams.get('jobid') || ''

    if (checkIsCopyRFQ()) {
        // * remove all attach file
        est.mainData.fileUpload = []
        est.mainData.tax = defaultData?.tax_percent || 0
        est.mainData.job.is_different_packing = false
        $('tr.file_upload').remove()

        $('.chk_profit_sharing').prop('checked', false)

        setJobProfitSharing()
        setPaperMarkingPrice()
        updatePaperPrice()
        updateCusterPaymentTerm()
        updateAEStatus()
        // recalcAllLayout()
        $('.component').each((index, ele) => {
            showRecalcPaperUsage(index)
        })

        $('#rfqID input').val('')
        $('#estID,#estName,#estLabel').val("")
        $('#updated_by, #created_by').html('-')
        $('#is_estimate_checked').attr('checked', false)

        // * แก้ไขจากแจ้งซ่อม : คลิก New Copy ให้ล้างค่า ส่วนต่าง / ค่าของขวัญลูกค้า 04/11/25
        $('.chk_price_difference').prop('checked', false)
        $('.chk_customer_gift').prop('checked', false)
        setChangeNumberOfPriceDiffInputQty()
        setChangeNumberOfCustomerGiftInputQty()

        STATUS.setDocStatus({
            status_id: 0,
            remark: '',
            history: []
        })

        STATUS.updateStatus(0)

        STATUS.renderDocumentByRoles()

        $('#date input').val(moment().format('DD/MM/YYYY'))

        setIsViewOnly(false)

        $('#refCopyID input').val(rfq_id)
        $('#calc_price').hide()
        setUItoRecalcProc()
        showCalcBttnPrice()
    }
}

function checkUseEstimateWizrd() {
    const wizrdNo = getLoadWizard()

    console.log("wizrdNo", wizrdNo)
    if (wizrdNo) {
        loadEstimateWizard(wizrdNo)
    }
}

async function loadEstimateWizard(wizardNo) {

    if (!wizardNo) return

    const { data } = await $.ajax({
        url: `${wizard_api}/api/estimate-wizard/wizard`,
        method: 'GET',
        data: {
            id: wizardNo
        },
        cache: false,
        dataType: 'json',
        contentType: 'application/json'
    }).then(res => {
        if (res.success) {
            return res.data
        }
        return { data: null }
    }).catch(err => {
        console.log("loadEstimateWizard", wizardNo, err)
        return { data: null }
    })

    console.log("resp", data)
    if (!data) return

    const obj = JSON.parse(data)
    console.log("loadEstimateWizard", obj)
    const bestMatch = await getWizardBestMatch(obj)

    console.log("bestMatch", bestMatch)

    const { job_data } = await getDataRFQ({ rfq_id: bestMatch?.job_id, type: 'rfq', log_id: '' }) || {}

    let refData = null
    if (job_data) {
        refData = JSON.parse(job_data)
    }

    est.setWizardData(obj)

    console.log("refData", refData)
    // # Reset 

    // # Set
    const comp = $('.component[index=0]')

    $('#jobName input').val(obj?.projectName || '')

    // # Set Comp. Type
    let compType = 1
    if (obj?.materials?.length == 2) {
        compType = 2
    } else if (obj?.materials?.includes('paper')) {
        compType = 1
    } else if (obj?.materials?.includes('corrugated')) {
        compType = 3
    }

    comp.find('.componentType').val(compType)
    changeComponent(0, compType)
    setfluteAlign(0, compType)

    comp.find('input.nameComp').val(obj?.boxTypeName)

    // # Set Color.
    comp.find('.colorOutside').val(obj?.colors?.outside).change()
    comp.find('.colorInside').val(obj?.colors?.inside).change()
    if (obj?.colors?.special_ink) {
        comp.find('.has_speInk').prop('checked', true).change()

        for (let i = 0; i < obj?.colors?.special_ink; i++) {
            console.log("special_ink ", i)
            if (i > 0) {
                addSpecialInk(0, null, 0)
            }
        }
    }

    // # Set Box type
    comp.find('.boxType').val(obj?.boxType).change()

    comp.find('.foilstampCheck').prop('checked', obj?.finishing?.foilStamping?.isChecked).change()
    if (obj?.finishing?.foilStamping?.isChecked) {
        obj?.finishing?.foilStamping?.size?.forEach((size, index) => {
            if (index > 0) {
                addAddonSize('foilstampInput', 0, 0)
            }

            comp.find(`.tb_foilstampSize tr:eq(${index})`).find(`input:eq(0)`).val(size[0])
            comp.find(`.tb_foilstampSize tr:eq(${index})`).find(`input:eq(1)`).val(size[1])
        })

        comp.find('.foilColor').val(obj?.finishing?.foilStamping?.color).change()
    }

    comp.find('.embossCheck').prop('checked', obj?.finishing?.embossing?.isChecked).change()
    if (obj?.finishing?.embossing?.isChecked) {
        obj?.finishing?.embossing?.size?.forEach((size, index) => {
            if (index > 0) {
                addAddonSize('embossInput', 0, 0)
            }

            comp.find(`.tb_embossSize tr:eq(${index})`).find(`input:eq(0)`).val(size[0])
            comp.find(`.tb_embossSize tr:eq(${index})`).find(`input:eq(1)`).val(size[1])
        })
    }

    comp.find('.debossCheck').prop('checked', obj?.finishing?.debossing?.isChecked).change()
    if (obj?.finishing?.debossing?.isChecked) {
        obj?.finishing?.debossing?.size?.forEach((size, index) => {
            if (index > 0) {
                addAddonSize('debossInput', 0, 0)
            }

            comp.find(`.tb_debossSize tr:eq(${index})`).find(`input:eq(0)`).val(size[0])
            comp.find(`.tb_debossSize tr:eq(${index})`).find(`input:eq(1)`).val(size[1])
        })
    }

    comp.find('.coatingOption').val(obj?.finishing?.coating.type).change()
    comp.find('.coatingType').val(obj?.finishing?.coating.option + '-' + obj?.finishing?.coating?.side).change()

    // # Set Qty.
    $('.inputQty input:eq(0)').val(obj?.quantity).change()

    // # Set Paper
    obj?.paperSelected?.forEach((paper, index) => {
        if (paper?.category == 'paper') {
            // * Paper
            comp.find('.paperType').val(paper?.id).change()
            comp.find('.paperGram').val(paper?.gram).change()
            comp.find('.select_paper_source').val(1).change()

        } else if (paper?.category == 'corrugated') {
            // * Corrugated
            const corrugated = db.db.corrugated_info?.find(obj => obj?.grade == paper?.grade && obj?.flute_type == paper?.flute_type && obj.layer == paper?.layer)
            displayComponentCorrugated(0, corrugated)
        }
    })

    if (refData) {
        displayDimension(0, refData.component1[0])
    }

    comp.find('.is_manualLayout').prop('checked', false).change()

    console.log("-------- finished replaceSimpleEstimate --------")

    checkRequiredInput()
}

function setWizardPacking() {
    const packing = est.getWizardPacking()

    if (packing?.length) {
        $('.packingCheck input[type=checkbox]').prop('checked', false).change()

        packing?.forEach((name) => {
            switch (name) {
                case 'paper-band':
                    $('.packingCheck .paperband input[type=checkbox]').prop('checked', true).change()
                    break;
                case 'kraft-wrap':
                    $('.packingCheck .kraftwrap input[type=checkbox]').prop('checked', true).change()
                    break;
                case 'carton':
                    $('.packingCheck .carton input[type=checkbox]').prop('checked', true).change()
                    break;
                case 'pallet':
                    $('.packingCheck .pallet input[type=checkbox]').prop('checked', true).change()
                    break;

                default:
                    break;
            }
        })
    }
}

function loadList(searchText = "") {
    // axios.get("http://localhost:3000/api/estimate-wizard/list", {
    //     params: { search: searchText }
    // })
    $.ajax({
        url: `${wizard_api}/api/estimate-wizard/list`,
        method: 'GET',
        data: {
            search: searchText
        },
        cache: false,
        dataType: 'json',
        contentType: 'application/json'
    })
        .then(function (res) {
            let data = res.data; // สมมติว่า API คืน Array
            console.log("loadList", data)
            let html = "";
            data.forEach(obj => {
                console.log("obj", obj)
                const item = JSON.parse(obj?.data)
                const updated = obj.updated
                console.log("updated", updated, obj.updated)
                html += `
                 <div class="modal-item" data-id="${obj.id}">
                    <div class="item-title">${obj.description}</div>
                    <div class="item-meta"><i class="bi bi-box"></i> ${item.boxTypeName} &nbsp;|&nbsp; ${item.customSize.width} × ${item.customSize.length} ซม. &nbsp;|&nbsp; ${item.quantity.toLocaleString()} ชิ้น</div>
                    <div class="item-meta"><i class="bi bi-layers"></i> ${item.paperSelected.map(p => p.name).join(", ")}</div>
                    <div class="item-meta"><i class="bi bi-calendar3"></i> ${updated}</div>
                </div>
            `;
            });
            $("#modalList").html(html);
        })
        .catch(function (err) {
            console.error(err);
        });
}

async function updateCusterPaymentTerm() {
    const customer_id = est?.mainData?.customer?.customer_id

    const obj = await getCustomerInfo(customer_id) || {}

    setCustomerCreditTermInfo(obj)
}

async function updateAEStatus() {
    let is_employee = true

    const emp_id = $('#aeID').val() || null
    const emp_info = await getEmployeeInfo(emp_id) || {}

    console.log("updateAEStatus", emp_id, emp_info)
    if (!emp_info?.emp_status == 1) {
        is_employee = false
        $('#aeID, #aeName, #aeLabel').val("")
    }

    checkRequiredInput()
}

function checkIsCopyRFQ() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const is_copy = urlParams.get('copy') == 1 ? true : false

    return is_copy
}

function getLoadWizard() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    return urlParams.get('wizard') || false
}

function updatePaperPrice() {
    $('.component').each((index, ele) => {
        const comp_type = getComponentType(index)

        if ([1, 2].includes(comp_type)) {
            const paperType = $(`.component[index=${index}] .paperType`).val()
            const paperGram = parseInt($(`.component[index=${index}] .paperGram`).val())
            const is_custom = $(`.component[index=${index}] .custom-paper`).attr('custom') == 1 ? true : false
            const sourcePaperId = parseInt($(`.component[index=${index}] .select_paper_source`).val())

            if (is_custom) return

            displayPaperPrice(index, paperType, paperGram, sourcePaperId)
            displayPaperFinalPrice(index)
        }
    })
}

async function onPrint(res) {
    $(document).find('body').css('zoom', '80%')
    // await blockUI()
    $('button').hide()

    await convertElementToPNG()

    res(true)
}

//* START function remark ------------------------------------------------------------------
function saveRemark() {
    $('#reject-remark').text($('#reject-remark-popup').val())
    storeRejectRemark()
    managePopup('close', 'remark')
}

function cancelRemark() {
    managePopup('close', 'remark')
}

function storeRejectRemark() {
    var reject_remark_arr = []

    $("[id^='old-reject-remark-']").each(function (index) {
        reject_remark_arr.push({
            remark: $(this).text(),
            updated: $(this).data("updated")
        })
    })
    if ($('#reject-remark').length != 0) {
        reject_remark_arr.push({
            remark: $('#reject-remark').text(),
            updated: $('#reject-remark').data("updated")
        })
    }

    est.setRejectRemark(reject_remark_arr)
}


function displayRejectRemark(status_id, rejectRemark, enable_price_check) {
    if (rejectRemark?.length > 0) {
        if (status_id == 2 && enable_price_check) {
            rejectRemark.forEach((element, index) => {
                if (index == rejectRemark.length - 1) {
                    $('#reject-remark-btn').parent().append(`<span id="reject-remark" data-updated="${element.updated}" style="display:none">${element.remark}</span>`)
                } else {
                    $('#reject-remark-btn').parent().append(`<span id="old-reject-remark-${index}" data-updated="${element.updated}" style="display:none">${element.remark}</span>`)
                }
            })
        } else {
            rejectRemark.forEach((element, index) => {
                $('#reject-remark-btn').parent().append(`<span id="old-reject-remark-${index}" data-updated="${element.updated}" style="display:none">${element.remark}</span>`)
            })
        }


        $('.reject-remark-btn').show();
    }
}
//* END function remark --------------------------------------------------------------------

function setDefaultCorrugated(index) {
    const corrugated_class = '.corrugatedInput[index=' + index + ']'
    $(corrugated_class + ' .layerCorrugated,' + corrugated_class + ' .fluteCorrugated').show()
    $(corrugated_class + ' .fluteCorrugated').html('<option value="">-</option>')
    $(corrugated_class + ' .layerCorrugated,' + corrugated_class + ' .fluteCorrugated').val("")
    $(corrugated_class + ' .layerCorrugated-custom,' + corrugated_class + ' .fluteCorrugated-type').hide()
    $(corrugated_class + ' .layerCorrugated-custom,'
        + corrugated_class + ' .fluteCorrugated-custom,'
        + corrugated_class + ' .fluteCorrugated-type,'
        + corrugated_class + ' .fluteInfo-custom,'
        + corrugated_class + ' .thickness-custom,'
        + corrugated_class + ' .costCorrugated-custom,'
        + corrugated_class + ' .fluteSide-custom,'
        + corrugated_class + ' .cutOff-custom').text("")
    $(corrugated_class + ' .isPricePerSheet').val("")

    var liner = "", flute = ""
    var cg = `
        ${flute} 
        <select class="type_1 required" style="text-align-last:center;">
            <option value="">-</option>
        </select>
         <select class="gram_1 required" style="text-align-last:center;">
            <option value="">-</option>
        </select>/
        ${liner}
        <select class="type_2 required" style="text-align-last:center;">
            <option value="">-</option>
        </select>
        <select class="gram_2 required" style="text-align-last:center;">
            <option value="">-</option>
        </select>
    `

    $(corrugated_class + ' .corrugatedGrade').html(cg)
}

function getFluteTypeOptionCustom(data) {
    var option = `<option value="">-</option>`
    data.forEach((item1) => {
        option += `<option value="${item1}">${item1}</option>`
    })
    if (data.length != 0) {
        option += `<option value="Custom">Custom</option>`
    }

    $('#corrugated-flute-custom option').remove()
    $('#corrugated-flute-custom').append(option)
}

function setCorrugatedGramCustom(layer) {
    var flute_layer = ""
    if (layer == 5) {
        flute_layer = 3
    }
    if (layer == 2 || layer == "") {
        var cc = `<input class="type_custom1 required" style="width:30px;">
                    <input class="gram_custom1 required" style="width:30px;"> 
                    / 
                    <input class="type_custom2 required" style="width:30px;">
                    <input class="gram_custom2 required" style="width:30px;">`
    } else {
        var cc = `<input class="type_custom1 required" style="width:30px;">
                    <input class="gram_custom1 required" style="width:30px;">
                    / ${flute_layer}
                    <input class="type_custom2 required" style="width:30px;">
                    <input class="gram_custom2 required" style="width:30px;">
                    /
                    <input class="type_custom3 required" style="width:30px;">
                    <input class="gram_custom3 required" style="width:30px;">`
    }
    $('#corrugated-grade-custom').html(cc)
    $('.gram_custom1').inputmask({ regex: "^[0-9]{3}", placeholder: "" })
    $('.gram_custom2').inputmask({ regex: "^[0-9]{3}", placeholder: "" })
    if (layer > 2) {
        $('.gram_custom3').inputmask({ regex: "^[0-9]{3}", placeholder: "" })
    }
}


function getIsCustomPaperType(index) {
    return $(`.paperInput[index=${index}] .custom-paper`).attr('custom') == 1 ? true : false
}

function checkCustomCorrugatedLayout() {
    /* 
        case : เฉพาะลูกฟูก
        1. ลอนขนาน W Size / ชิ้นงานลอนขนาน short_side -> laying = vertical
        2. ลอนขนาน W Size / ชิ้นงานลอนขนาน long_side -> laying = horizontal
        1. ลอนขนาน L Size / ชิ้นงานลอนขนาน short_side -> laying = horizontal
        2. ลอนขนาน L Size / ชิ้นงานลอนขนาน long_side -> laying = vertical

        case : ประกบลูกฟูก

    */
}

function checkOpenSizeWithMachine(item, machineId = '') {
    const {
        packaging_size: {
            open_size = [0, 0, 0, 0]
        },
        machine = {}
    } = item || {}

    let selectedMachine = machine
    const [a, b, short_side, long_side] = [...open_size].sort((a, b) => a - b)

    if (machineId) {
        //* custom machine id
        selectedMachine = est.getMachineList(item).find(obj => obj.machine_size.id == machineId) || {}
    }

    if (!selectedMachine) {
        return { success: false, message: 'ไม่พบ Machine' }
    }

    const { l_range, w_range } = selectedMachine || {}


    console.log(`
    checkOpenSizeWithMachine : [${a}, ${b}, ${short_side}, ${long_side}]
      ${short_side} <= ${w_range[3]}
        && ${long_side} <= ${l_range[3]}
    `)
    if (
        short_side <= w_range[3]
        && long_side <= l_range[3]
    ) {
        return { success: true, message: '' }
    } else {
        return { success: false, message: 'ขนาด Open size ไม่สามารถลงเครื่องนี้ได้' }
    }

}

function displayMachineInfo(index, machineId = '') {
    if (!machineId) {
        return false
    }

    const { machine } = est.getComponent(index)
    const { min_size, max_size } = machine || {}

    $(`.div_size_component[index=${index}]`).find('.cut_size').val(machineId)
    $(`.div_size_component[index=${index}]`).find('.cut_size_min').html(` ${min_size[0]}" x ${min_size[1]}"`)
    $(`.div_size_component[index=${index}]`).find('.cut_size_max').html(` ${max_size[0]}" x ${max_size[1]}"`)
}

function setEnableLayingForCustomCorrugated(index) {
    const comp = est.mainData.component1[index]
    const selector = $(`.componentInfo[index=${index}]`)
    const {
        component_type: {
            type = 0
        }
    } = comp || {}

    selector.find('.manualLayout').prop('disabled', false)

    if (comp?.corrugated_layer?.info?.is_price_per_sheet) {
        // const corrugated_flute_side = comp?.corrugated_layer?.info?.corrugated_flute_side || 'WSize'

        getLayoutGrainSelectOption(index, 'wLaySize', comp?.layout?.laySize[0])
        getLayoutGrainSelectOption(index, 'lLaySize', comp?.layout?.laySize[1])

        // * for default manual laying
        if (
            comp?.corrugated_layer?.component_flute_side == 'long_side' &&
            !comp?.layout?.selected_layout?.layout_size?.length
        ) {
            getLayoutGrainSelectOption(index, 'wLaySize', comp?.layout?.laySize[1])
            getLayoutGrainSelectOption(index, 'lLaySize', comp?.layout?.laySize[0])
        }

        selector.find('.parallelFluteSide').val('WSize')

        if (type == 2) {
            selector.find('.layout_grain').prop('disabled', true)
            selector.find('.manualLayout').prop('disabled', true)

            if (comp?.corrugated_layer?.component_flute_side == 'long_side') {
                selector.find('.parallelFluteSide').val('LSize')
            }
        }

        if (type == 3) {
            selector.find('.parallelFluteSide').prop('disabled', true)

            // if(corrugated_flute_side == 'WSize'){
            //     selector.find('.parallelFluteSide').val('WSize')
            // }else{
            //     selector.find('.parallelFluteSide').val('LSize')
            // }
        }
    }
}

function setEnableLayoutPaperSize(index, bool = false) {
    $(`.paperSize[index=${index}] input`).attr('readOnly', !bool)
}


function setWarningLayout(index, text = '') {
    $(`.divLayoutWarning[index=${index}] *`).remove()

    let alertText = ''

    if (text?.length) {
        text.forEach((text) => {
            alertText += `<div><span class="warning">${text}</span></div>`
        })
    }

    $(`.divLayoutWarning[index=${index}]`).html(alertText)
}

function getIsCustomCorrugated(index = '') {
    const isCustom = $(`.component[index=${index}] .isPricePerSheet`).val() == '1' ? true : false
    return isCustom
}

function setChangeParallelFluteSide(index) {
    const comp = est.mainData.component1[index] || {}
    let grain = ''

    if (comp?.component_type?.type == 1) {
        return false
    }

    if (comp?.component_type?.type == 2) {
        const fluteSide = getLayingFluteSide(index)

        const {
            corrugated_layer: {
                component_flute_side = '',
                info: {
                    corrugated_flute_side = 'WSize',
                    is_price_per_sheet = false
                }
            }
        } = comp

        if (is_price_per_sheet) {

            if (fluteSide == 'WSize') {
                switch (true) {
                    case component_flute_side == 'long_side' && corrugated_flute_side == 'WSize':
                    case component_flute_side == 'short_side' && corrugated_flute_side == 'LSize':
                        grain = 'vertical'
                        break;

                    case component_flute_side == 'short_side' && corrugated_flute_side == 'WSize':
                    case component_flute_side == 'long_side' && corrugated_flute_side == 'LSize':
                    default:
                        grain = 'horizontal'
                        break;
                }
            }

            if (fluteSide == 'LSize') {
                switch (true) {
                    case component_flute_side == 'long_side' && corrugated_flute_side == 'WSize':
                    case component_flute_side == 'short_side' && corrugated_flute_side == 'LSize':
                        grain = 'horizontal'
                        break;

                    case component_flute_side == 'short_side' && corrugated_flute_side == 'WSize':
                    case component_flute_side == 'long_side' && corrugated_flute_side == 'LSize':
                    default:
                        grain = 'vertical'
                        break;
                }
            }

            console.log("setChangeParallel", component_flute_side, corrugated_flute_side, grain)

            $(`.layout_grain[index=${index}]`).val(grain)
        }
    }
}

function getLayingFluteSide(index) {
    return $(`.componentInfo[index=${index}] .parallelFluteSide`).val() || ''
}

function setEnableComponentSpecialInk(index, fIndex, bool = false) {
    $(`.component[index=${index}] .specialInk-container:eq(${fIndex}) .has_speInk`).prop('checked', bool)

    if (bool) {
        $(`div.div-speInk[index=${index}][f_index=${fIndex}]`).show()

    } else {
        $(`.div-speInk[index=${index}][f_index=${fIndex}]`).hide();
        $(`.div-speInk[index=${index}][f_index=${fIndex}] .tr_speInk`).remove();
    }
}

function setChangeEstimateCheck(bool) {
    $('#is_estimate_checked').prop('checked', bool)

    if (bool) {
        var data_user = JSON.parse(localStorage.getItem("data"))

        $('#estID').val(data_user.emp_id)
        $('#estName').val(data_user.emp_name)
        $('#estLabel').val(data_user.emp_id + ': ' + data_user.emp_name)
        $('#status_id').val(3)
    } else {
        $('#estID,#estName,#estLabel').val("")
        $('#status_id').val(STATUS.fromStatusId)
    }

    hilightText('estimate_check', bool)
}


function displayCurrencyOption() {
    const selector = $(`.select_currency_no`)
    const option = getExchangeRateList()
    setDisplaySelectOption(selector, option, "currency_no", "currency_no", true, null)
}

function getIsSpecialCustomer() {
    const lisOfSpecialCustomer = ['C1010257']

    const cust_id = $('#custID').val() || ''

    return lisOfSpecialCustomer.includes(cust_id) || false
}

async function confirmBeforeSave() {
    const config = {
        width: "50%",
        showDenyButton: true,
        confirmButtonText: "บันทึก",
        denyButtonText: `ตรวจสอบข้อมูล`,
        denyButtonColor: '#DCE0E8',
        showConfirmButton: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
        showCloseButton: true,
    }

    if ($('#summary').is(':visible')) {
        config.title = 'คุณต้องการบันทึกข้อมูล ?'
    } else {
        config.title = ""
        config.html = `
        <img class="swal-img" src="./images/calc_price_tooltip.png" alt="ปุ่มคำนวณราคา">
        <p class="swal-layout-tooltip mt-2 text-center">
        <b>ยังไม่ได้กดปุ่มคำนวณราคา</b> <br> คุณต้องการบันทึกข้อมูล ?
        </p>
        `
    }

    return await Swal.fire(config).then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
            return true
        } else {
            return false
        }

    })
}

async function setShowHistorySection(bool = false) {
    const { job_id, log_id: currentLogId, ref_copy_rfq = null } = dat?.data_rfq_log || {}
    const { log_id } = getUrlParams(window.location.href)

    if (!bool) {
        return false
    }

    if (!job_id) {
        return false
    }

    HISTORY.setAPI(`${node_api}/estimate/history?job_id=${job_id}`)
    HISTORY.setButtonContainer(`#flex-menu`)
    HISTORY.renderHistorySection()
    HISTORY.setShowHistoryButton(bool)
    HISTORY.setHistoryJob(job_id, currentLogId, ref_copy_rfq)

    if (!log_id) {
        return false
    }

    await HISTORY.setDisplayHistory()

    HISTORY.setHistoryMode(true)
}

function setRemoveComponents(index = null) {
    if (!(index >= 0)) {
        return
    }

    $(`.component[index=${index}]`).remove()
    $(`.componentInfo[index=${index}]`).remove()

    if (est?.mainData?.component1?.length) {
        est.mainData.component1.splice(index, 1)
    }

    setRunComponentIndex()
}

function setRunComponentIndex() {
    $('.component').each((index, ele) => {
        $(ele).attr('index', index)

        $(ele).find('[index]').attr('index', index)
        $(ele).find(`.nameComponent .componentIndex, .componentTemplate > span`).html(`Component ที่ ${parseInt(index) + 1}`)
        $(`.div_component_name[index=${index}] .component_no`).html(`Component ที่ ${parseInt(index) + 1}`)
    })

    $('.componentInfo').each((index, ele) => {
        $(ele).attr('index', index)

        $(ele).find('[index]').attr('index', index)
        $(ele).find(`.component_no`).html(`Component ที่ ${parseInt(index) + 1}`)
    })
}

function getComponentIsPrinting(item, fCode) {
    let is_printing = false

    is_printing = item?.color?.some(obj => obj?.inside > 0 || obj?.outside > 0) || false

    //* find f code color
    if (fCode) {
        colorDetail = color?.find(obj => obj?.f_code === fCode) || color[0]

        is_printing = colorDetail?.inside > 0 || colorDetail?.outside > 0
    }

    return is_printing
}

function getIsOnlyCut2(comp = {}, customColor = []) {
    let bool = false

    const {
        color = [],
    } = comp || {}

    const isProfitSharing = getIsProfitSharing()
    const printType = est.getPrintType()
    const inkType = getInkType()

    let colorList = color

    if (customColor?.length) {
        colorList = customColor
    }

    const maxColor = colorList?.reduce((max, curr) => max = max < Math.max(curr.inside, curr.outside) ? Math.max(curr.inside, curr.outside) : max, 0)

    // * เงื่อนไข รูปแบบพิมพ์ Offset , Flexo , Jet Press , Konica
    bool = (inkType == 'UV' && printType == 'Offset' && maxColor > 0) || isProfitSharing

    return bool
}

function setEnabledConditions(index, condition_key, bool = false) {
    const $comp = $(`.component[index=${index}]`)

    switch (condition_key) {
        case 'packaging.konica.paper.pp_sticker':
            // $comp?.find(`[data-condition_key='${condition_key}']`).prop('disabled', !bool)

            const $selector = $comp?.find(`[data-condition_key='${condition_key}']`);

            $selector?.each((index, ele) => {
                const $ele = $(ele)
                $ele.prop('disabled', !bool)

                const elementType = $(ele).get(0).tagName || $(ele).get(0).nodeName || ""

                // * Remove coating option
                if ($ele?.closest('.coatingInput')?.length && !bool) {
                    const $coatingList = $ele?.closest('.component').find('.coatingInput')
                    const typeNotAllowed = ['OPPC-1', 'OPPC-2']

                    console.log("$coatingList", $coatingList)
                    $coatingList?.each((index, ele) => {
                        const $coating = $(ele)
                        const coatingType = $coating.find('.coatingType option:selected').val()

                        console.log("-----> $coating : ", $coating)
                        console.log("-----> type : ", coatingType)

                        if (typeNotAllowed?.includes(coatingType)) {
                            const idx = $coating?.attr('index')
                            const processIndex = $coating?.attr('process-index')

                            console.log("processIndex", idx, processIndex)

                            $coating.find('.coatingOption').val('')
                            getCoatingTypeOption(get_coating_code(''), idx, processIndex)
                            $coating.find('.coatingType').val('')
                        }
                    })

                }

                // // * Set Conditions Value to Empty
                if (['input', 'select', 'textarea']?.includes(elementType) && !bool) {
                    $ele.val('')
                }


            })


            break;

        default:
            break;
    }
}

function checkChangePaperConditions(index) {
    // const $comp = $(`.component[index=${index}]`)
    const printType = getPrintType()
    const paperInfo = getPaperInfo(index)

    if (printType == 'Konica' && ['PP-CKT', 'PP-GKT', 'PP-MKT']?.includes(paperInfo?.paper_code)) {
        setEnabledConditions(index, 'packaging.konica.paper.pp_sticker', true)
    } else {
        setEnabledConditions(index, 'packaging.konica.paper.pp_sticker', false)
    }

}