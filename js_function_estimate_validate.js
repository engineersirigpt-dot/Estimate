function checkSystemVersion(currentVersion = 0, requireVersion = 0) {
    if (currentVersion < requireVersion) {
        return false
    }
    return true
}

function checkValidateAll() {
    if (!checkValidateQty()) {
        return false
    }
    if (!checkValidateFlexoSize()) {
        return false
    }
    if (!checkValidateColorLimit()) {
        return false
    }
    if (!checkValidateComponentInput()) {
        return false
    }
    if (!checkValidateMultipleF()) {
        return false
    }
    console.log("pass validate")
    return checkValidateProcess()
}

function CheckValidateRFQInfo() {
    if ($('#aeLabel').val() == "") {
        $('#aeLabel').focus()
        alert('กรุณากรอก ขื่อ AE')
        return false
    } else if ($('#jobName input').val() == "") {
        $('#jobName input').focus()
        alert('กรุณากรอก ชื่อ Job')
        return false
    } else if ($('#customerLabel').val() == "") {
        $('#customerLabel').focus()
        alert('กรุณากรอก ชื่อลูกค้า')
        return false
    } else {
        return true
    }
}

function checkValidateQty() {
    const is_multiple_f = getIsMultipleF()
    let validate = true
    let selector = is_multiple_f ? '#multiple_f_qty_info' : "#qty_info"
    $(`${selector} .inputQty input`).each((index, ele) => {
        if ($(ele).val() === '') {
            alert('กรุณาระบุจำนวนชิ้นงาน ให้ครบถ้วน')
            $(ele).focus()
            validate = false
            return false
        }
    })
    return validate
}

function checkLimitAddQtyNumber() {
    let validate = false
    const limit = 10
    const currentQty = $('.inputQty:visible input')?.length || 1
    console.log("currentQty", currentQty)

    if (currentQty < limit) {
        validate = true
    } else {
        snackAlert(`ไม่สามารถเพิ่มยอดงานมากกว่า ${limit} ยอดได้`)
    }

    return { validate, limit }
}

function checkValidateFlexoSize() {
    if ($('#print_type select').val() == 'Flexo') {
        if ($('#flexo_size input:eq(0)').val() == "") {
            alert('กรุณาใส่ Flexo Size')
            $('#flexo_size input:eq(0)').focus()
            return false
        } else if ($('#flexo_size input:eq(1)').val() == "") {
            alert('กรุณาใส่ Flexo Size')
            $('#flexo_size input:eq(1)').focus()
            return false
        } else {
            return true
        }
    } else {
        return true
    }
}


function checkValidateSpecialInk(index) {
    let validate = true
    const className = '.component[index=' + index + ']'
    $(`${className} div.specialInk-container`).each((inkIndex, ele) => {
        if ($(ele).find('.has_speInk').prop('checked')) {
            $(ele).find('table.table_speInk tr.tr_speInk').each((speInkIndex, tr) => {
                if ($(tr).find('.speInk_name').val() == "") {
                    alert('กรุณาใส่ข้อมูลสี');
                    $(tr).find('.speInk_name').focus();
                    validate = false
                    return false;
                }

                if ($(`${className} .componentType`).val() == 3) {
                    alert('งานเฉพาะลูกฟูกไม่สามารถใส่สีพิเศษได้');
                    validate = false
                    return false;
                }
            })
            return true;
        }
    })
    return validate
}

function checkValidateSpecialInkCustomPaper(index) {
    const speInkLength = $(`.component[index=${index}] table.table_speInk tr.tr_speInk`).length || 0
    const isCustomPaper = getIsCustomPaperType(index)
    const paperType = $(`.component[index=${index}] .paperCode-custom`).text() || '-'
    console.log("checkValidateSpecialInkCustomPaper", speInkLength, isCustomPaper, paperType)
    if (!isCustomPaper) {
        return true
    }

    if (speInkLength > 0 && paperType == '-') {
        alert('Paper Type : Board ไม่สามารถเลือกสีพิเศษได้.')
        return false
    }

    return true
}

function checkValidateComponentInput() {
    if (checkValidatePaperMarkup() == false) {
        return false
    }
    for (var index = 0; index < $('.nameComp').length; index++) {
        if (checkValidateEachComponent(index) == false) {
            return false
        }
    }
    return true
}

function checkValidatePaperMarkup() {
    if ($('.paperMarkup input').val() == "") {
        alert('กรุณาใส่ % Paper Mark-up')
        $('.paperMarkup input').focus()
        return false
    } else {
        return true
    }
}

function checkValidateEachComponent(index) {
    var componentType = parseInt($('.component[index=' + index + '] .componentType').val())
    var type = getBoxTemplate(index) // number
    if (checkValidateNameComp(index) == false) {
        return false
    }
    if (!checkValidateF(index)) {
        return false
    }
    if (checkValidateColor(index) == false) {
        return false
    }
    if (checkValidatePaper(index) == false) {
        return false
    }
    if (checkValidatePapernCorrugated(index, componentType) == false) {
        return false
    }
    if (checkValidateAddon(index, 'coatingInput') == false) {
        return false
    }
    if (checkValidateAddon(index, 'foilstampInput') == false) {
        return false
    }
    if (checkValidateAddon(index, 'embossInput') == false) {
        return false
    }
    if (checkValidateAddon(index, 'debossInput') == false) {
        return false
    }
    if (checkValidateBoxTemplate(index) == false) {
        return false
    }
    if (checkValidateBoxDimension(type, index) == false) {
        return false
    }
    if (checkValidateFluteSide(index, componentType) == false) {
        return false
    }
    if (checkValidateSpecialInkCustomPaper(index) == false) {
        return false
    }
    if (checkValidateSpecialInk(index) == false) {
        return false
    }
    if (checkValidateComponentCustomCorrugated(index) == false) {
        return false
    }
    if (checkValidateMachineConditions(index) == false) {
        return false
    }

    return true
}
function checkValidateF(index) {
    let validate = true
    if ($('#is_multiple_f').prop('checked')) {
        $(`.f-code`).each((index, ele) => {
            if ($(ele).val() == '') {
                alert('กรุณาระบุ F Code')
                $(ele).focus()
                validate = false
                return
            }
        })
    }


    return validate
}
function checkValidateNameComp(index) {
    if ($(`.component[index=${index}] .nameComp`).val() == "") {
        alert('กรุณาใส่ชื่อ Component')
        $(`.component[index=${index}] .nameComp`).focus()
        return false
    } else {
        return true
    }
}

function checkValidateColor(index) {
    if ($(`.component[index=${index}] .colorOutside`).val() == "") {
        alert('กรุณาใส่จำนวนสี Outside')
        $(`.component[index=${index}] .colorOutside`).focus()
        return false
    } else if ($(`.component[index=${index}] .colorInside`).val() == "") {
        alert('กรุณาใส่จำนวนสี Inside')
        $(`.component[index=${index}] .colorInside`).focus()
        return false
    } else {
        return true
    }
}

function checkValidateMachineConditions(index) {

    const selector = $(`.component[index=${index}]`)
    const isProfitSharing = getIsProfitSharing()
    const printType = est.getPrintType()
    const inkType = getInkType()
    // * UV & Offset

    const colorList = []

    selector.find('.colorOutside, .colorInside').each((index, ele) => {
        const color = parseInt($(ele).val() || 0)
        colorList?.push(color)
    })

    const maxColor = Math.max(...colorList)

    console.log("checkValidateMachineConditions", maxColor, colorList, isProfitSharing)

    if (isProfitSharing && maxColor > 6) { //* Cut 2 Color : min 0 max 6
        alert('งาน Profit Sharing : จำนวนสีด้านที่มากที่สุดต้องไม่เกิน 6 สี')
        return false
    }

    if ((inkType == 'UV' && printType == 'Offset') && maxColor > 6) {
        alert('งาน Offset + UV : จำนวนสีด้านที่มากที่สุดต้องไม่เกิน 6 สี')
        return false
    }

}

function checkValidateBoxTemplate(index) {
    if (getBoxTemplate(index) == "") {
        alert('กรุณาเลือก รูปแบบชิ้นส่วน (Box Template)')
        $('.boxType[index=' + index + ']').focus()
        return false
    } else { return true }
}

function checkValidatePapernCorrugated(index, componentType) {
    const { min, max } = defaultData?.print_type_config?.getPrintTypeConfig()?.gsm
    const component = '.component[index=' + index + ']'
    switch (componentType) {
        case 1: //ชิ้นส่วนไม่ประกบลูกฟูก
            if ($(component + ' .custom-paper').attr('custom') == 0) {
                if ($(component + ' .paperType').val() == "") {
                    alert('กรุณาเลือก ชนิดกระดาษ (Paper Type)')
                    $(component + ' .paperType').focus()
                    return false
                } else if ($(component + ' .paperGram').val() == null) {
                    alert('กรุณาเลือก แกรมกระดาษ (Paper Gram)')
                    $(component + ' .paperGram').focus()
                    return false
                }
            } else {
                if (getPrintType() == 'Jet Press' && parseInt($(component + ' .paperGram-custom').text()) < min) {
                    alert(`แกรมของ Custom-Paper น้อยกว่า ${min} แกรม ไม่สามารถใช้ได้สำหรับงานพิมพ์ประเภท Jet Press กรุณากรอกใหม่`)
                    return false
                }
            }
            if ($(component + ' .paperCost').val() == "") {
                alert('กรุณาใส่ ราคากระดาษ (Paper Cost)')
                $(component + ' .paperCost').focus()
                return false
            } else if ($(component + ' .paperPercent').val() == "") {
                alert('กรุณาใส่ % ตัดกระดาษม้วน')
                $(component + ' .paperPercent').focus()
                return false
            } else {
                return true
            }

        case 2: //ชิ้นส่วนประกบลูกฟูก
            var isCustom = $(component + ' .custom-corrugated').attr('custom') == "1"
            if ($(component + ' .custom-paper').attr('custom') == 0) {
                if ($(component + ' .paperType').val() == "") {
                    alert('กรุณาเลือก ชนิดกระดาษ (Paper Type)')
                    $(component + ' .paperType').focus()
                    return false
                }
            }
            if ($(component + ' .paperCost').val() == "") {
                alert('กรุณาใส่ ราคากระดาษ (Paper Cost)')
                $(component + ' .paperCost').focus()
                return false
            } else if ($(component + ' .paperPercent').val() == "") {
                alert('กรุณาใส่ % ตัดกระดาษม้วน')
                $(component + ' .paperPercent').focus()
                return false
            }

            if (isCustom) {
                return true
            }

            if ($(component + ' .layerCorrugated').val() == "") {
                alert('กรุณาเลือก จำนวนชั้นลูกฟูก')
                $(component + ' .layerCorrugated').focus()
                return false
            } else if ($(component + ' .fluteCorrugated').val() == "") {
                alert('กรุณาเลือก ชนิดลูกฟูก')
                $(component + ' .fluteCorrugated').focus()
                return false
            } else if ($(component + ' .type_1').val() == "") {
                alert('กรุณาเลือก Grade ลูกฟูก ให้ครบถ้วน')
                $(component + ' .type_1').focus()
                return false
            } else if ($(component + ' .gram_1').val() == "") {
                alert('กรุณาเลือก Grade ลูกฟูก ให้ครบถ้วน')
                $(component + ' .gram_1').focus()
                return false
            } else if ($(component + ' .type_2').val() == "") {
                alert('กรุณาเลือก Grade ลูกฟูก ให้ครบถ้วน')
                $(component + ' .type_2').focus()
                return false
            } else if ($(component + ' .gram_2').val() == "") {
                alert('กรุณาเลือก Grade ลูกฟูก ให้ครบถ้วน')
                $(component + ' .gram_2').focus()
                return false
            }
            if (parseInt($(component + ' .layerCorrugated').val()) != 2) {
                if ($(component + ' .type_3').val() == "") {
                    alert('กรุณาเลือก Grade ลูกฟูก ให้ครบถ้วน')
                    $(component + ' .type_3').focus()
                    return false
                } else if ($(component + ' .gram_3').val() == "") {
                    alert('กรุณาเลือก Grade ลูกฟูก ให้ครบถ้วน')
                    $(component + ' .gram_3').focus()
                    return false
                } else {
                    return true
                }
            } else {
                return true
            }

        case 3: //ชิ้นส่วนเฉพาะลูกฟูก
            var isCustom = $(component + ' .custom-corrugated').attr('custom') == "1"
            if (isCustom) {
                return true
            }

            if ($(component + ' .layerCorrugated').val() == "") {
                alert('กรุณาเลือก จำนวนชั้นลูกฟูก')
                $(component + ' .layerCorrugated').focus()
                return false
            } else if ($(component + ' .fluteCorrugated').val() == "") {
                alert('กรุณาเลือก ชนิดลูกฟูก')
                $(component + ' .fluteCorrugated').focus()
                return false
            } else if ($(component + ' .type_1').val() == "") {
                alert('กรุณาเลือก Grade ลูกฟูก ให้ครบถ้วน')
                $(component + ' .type_1').focus()
                return false
            } else if ($(component + ' .gram_1').val() == "") {
                alert('กรุณาเลือก Grade ลูกฟูก ให้ครบถ้วน')
                $(component + ' .gram_1').focus()
                return false
            } else if ($(component + ' .type_2').val() == "") {
                alert('กรุณาเลือก Grade ลูกฟูก ให้ครบถ้วน')
                $(component + ' .type_2').focus()
                return false
            } else if ($(component + ' .gram_2').val() == "") {
                alert('กรุณาเลือก Grade ลูกฟูก ให้ครบถ้วน')
                $(component + ' .gram_2').focus()
                return false
            } else if (parseInt($(component + ' .layerCorrugated').val()) != 2) {
                if ($(component + ' .type_3').val() == "") {
                    alert('กรุณาเลือก Grade ลูกฟูก ให้ครบถ้วน')
                    $(component + ' .type_3').focus()
                    return false
                } else if ($(component + ' .gram_3').val() == "") {
                    alert('กรุณาเลือก Grade ลูกฟูก ให้ครบถ้วน')
                    $(component + ' .gram_3').focus()
                    return false
                } else {
                    return true
                }
            } else {
                return true
            }
    }
}

function checkValidateAddon(index, processClass) {
    let total_index = $('.' + processClass + '[index=' + index + ']').length
    var className = '.' + processClass + '[index=' + index + ']'
    let check_size = []
    for (var process_index = 0; process_index < total_index; process_index++) {
        switch (processClass) {
            case 'coatingInput':
                var type = $(className + '[process-index=' + process_index + '] .coatingType').val()
                const coating_code = type.substring(0, type.length - 2)

                if (total_index > 1) {
                    if ($(className + '[process-index=' + process_index + '] .coatingOption').val() == "") {
                        alert('กรุณาเลือก Coating Option')
                        $(className + '[process-index=' + process_index + '] .coatingOption').focus()
                        return false
                    }
                }

                if (['S-UV', 'S-UV-S'].includes(coating_code)) {
                    // if (type.substring(0, type.length - 2) == 'S-UV') {
                    if ($(className + '[process-index=' + process_index + '] .coatingSize:eq(0)').val() == "") {
                        alert('กรุณาใส่ ขนาด Coating')
                        $(className + '[process-index=' + process_index + '] .coatingSize:eq(0)').focus()
                        return false
                    }
                    if ($(className + '[process-index=' + process_index + '] .coatingSize:eq(1)').val() == "") {
                        alert('กรุณาใส่ ขนาด Coating')
                        $(className + '[process-index=' + process_index + '] .coatingSize:eq(1)').focus()
                        return false
                    }
                }

                if (coating_code == 'P-PAT') {
                    if ($(className + '[process-index=' + process_index + '] .coatingNumber').val() == "") {
                        alert('กรุณาใส่ เบอร์ Coating')
                        $(className + '[process-index=' + process_index + '] .coatingNumber').focus()

                        return false
                    }
                }
                break
            case 'foilstampInput':
                check_size.push(true)

                if (total_index > 1 && $(className + '[process-index=0] .foilstampCheck').prop('checked') == false) {
                    alert('กรุณา checked: Foil-stamp checkbox และใส่ข้อมูลให้ครบถ้วน')
                    $(className + '[process-index=0] .foilstampCheck').focus()
                    return false
                } else {
                    if ($(className + '[process-index=0] .foilstampCheck').prop('checked') == true) {

                        $(`${className}[process-index=${process_index}] table.tb_foilstampSize tr`).each((index, tr) => {
                            if ($(tr).find('.foilstampSize:eq(0)').val() == "") {
                                alert('กรุณาใส่ ขนาด Foil Stamp')
                                $(tr).find('.foilstampSize:eq(0)').focus()

                                check_size[process_index] = false
                                return false //* ออก loop 
                            }

                            if ($(tr).find('.foilstampSize:eq(1)').val() == "") {
                                alert('กรุณาใส่ ขนาด Foil Stamp')
                                $(tr).find('.foilstampSize:eq(1)').focus()

                                check_size[process_index] = false
                                return false //* ออก loop each
                            }

                        })

                        //* validate custom foil.
                        if ($(className + '[process-index=' + process_index + '] .custom-foil').attr('custom') == 0) {
                            if ($(className + '[process-index=' + process_index + '] .foilColor').val() == "") {
                                alert('กรุณาเลือก สี Foil')
                                $(className + '[process-index=' + process_index + '] .foilColor').focus()

                                check_size[process_index] = false
                            }
                        }

                        if (check_size[process_index] === false) {
                            return false
                        }

                    }
                }

            case 'embossInput':
                if (total_index > 1 && $(className + '[process-index=0] .embossCheck').prop('checked') == false) {
                    alert('กรุณา checked: Emboss checkbox และใส่ข้อมูลให้ครบถ้วน')
                    $(className + '[process-index=0] .embossCheck').focus()
                    return false
                } else {
                    if ($(className + '[process-index=0] .embossCheck').prop('checked') == true) {
                        if ($(className + '[process-index=' + process_index + '] .embossSize:eq(0)').val() == "") {
                            alert('กรุณาใส่ ขนาด Emboss')
                            $(className + '[process-index=' + process_index + '] .embossSize:eq(0)').focus()
                            return false
                        }
                        if ($(className + '[process-index=' + process_index + '] .embossSize:eq(1)').val() == "") {
                            alert('กรุณาใส่ ขนาด Emboss')
                            $(className + '[process-index=' + process_index + '] .embossSize:eq(1)').focus()
                            return false
                        }
                    }
                }
                break
            case 'debossInput':
                if (total_index > 1 && $(className + '[process-index=0] .debossCheck').prop('checked') == false) {
                    alert('กรุณา checked: Deboss checkbox และใส่ข้อมูลให้ครบถ้วน')
                    $(className + '[process-index=0] .debossCheck').focus()
                    return false
                } else {
                    if ($(className + '[process-index=0] .debossCheck').prop('checked') == true) {
                        if ($(className + '[process-index=' + process_index + '] .debossSize:eq(0)').val() == "") {
                            alert('กรุณาใส่ ขนาด Deboss')
                            $(className + '[process-index=' + process_index + '] .debossSize:eq(0)').focus()
                            return false
                        }
                        if ($(className + '[process-index=' + process_index + '] .debossSize:eq(1)').val() == "") {
                            alert('กรุณาใส่ ขนาด Deboss')
                            $(className + '[process-index=' + process_index + '] .debossSize:eq(1)').focus()
                            return false
                        }
                    }
                }
                break
        }
    }
    return true
}

function checkValidateBoxDimension(type, index) {
    const componentTemplate = '.componentTemplate[index=' + index + ']'
    if ($(componentTemplate + ' .width').val() == "") {
        alert('กรุณาใส่ความยาวด้านกว้าง')
        $(componentTemplate + ' .width').focus()
        return false
    }
    if ($(componentTemplate + ' .length').val() == "") {
        alert('กรุณาใส่ความยาวด้านยาว')
        $(componentTemplate + ' .length').focus()
        return false
    }
    if (type != 12) {
        if ($(componentTemplate + ' .depth').val() == "") {
            alert('กรุณาใส่ความสูง')
            $(componentTemplate + ' .depth').focus()
            return false
        }
    }

    if (type != 5 && type != 6 && type != 12) {
        if ($(componentTemplate + ' .glue').val() == "") {
            alert('กรุณาใส่ความยาวด้านติดกาว')
            $(componentTemplate + ' .glue').focus()
            return false
        }
    }
    if (type == 1 || type == 2 || type == 3 || type == 4 || type == 8) {
        if ($(componentTemplate + ' .tuck').val() == "") {
            alert('กรุณาใส่ความยาวฝาเสียบ')
            $(componentTemplate + ' .tuck').focus()
            return false
        }
    }
    if (type != 8 && type != 9 && type != 10 && type != 12) {
        if ($(componentTemplate + ' .dust').val() == "") {
            alert('กรุณาใส่ความยาวปีกกล่อง')
            $(componentTemplate + ' .dust').focus()
            return false
        }
    }
    if (type == 3 || type == 4 || type == 6 || type == 8) {
        if ($(componentTemplate + ' .ol').val() == "") {
            alert('กรุณาใส่ความยาวด้าน OL หรือ ความยาวกรอบ')
            $(componentTemplate + ' .ol').focus()
            return false
        }
    }
    if (type == 12) {
        if ($(componentTemplate + ' .openSizemm input:eq(0)').val() == "") {
            alert('กรุณาใส่ขนาด Open Size')
            $(componentTemplate + ' .openSizemm input:eq(0)').focus()
            return false
        }
        if ($(componentTemplate + ' .openSizemm input:eq(1)').val() == "") {
            alert('กรุณาใส่ขนาด Open Size')
            $(componentTemplate + ' .openSizemm input:eq(1)').focus()
            return false
        }
        if ($(componentTemplate + ' .packingsizemm input:eq(0)').val() == "") {
            alert('กรุณาใส่ขนาด Packing Size')
            $(componentTemplate + ' .packingsizemm input:eq(0)').focus()
            return false
        }
        if ($(componentTemplate + ' .packingsizemm input:eq(1)').val() == "") {
            alert('กรุณาใส่ขนาด Packing Size')
            $(componentTemplate + ' .packingsizemm input:eq(1)').focus()
            return false
        }
        if ($('.packingLayer[index=' + index + '] input').val() == "") {
            alert('กรุณาใส่จำนวนทบของ Packing Size')
            $('.packingLayer[index=' + index + '] input').focus()
            return false
        }
    }
    if (checkValidateGluedspot(index) == false) {
        return false
    }
    return true
}

function checkValidateGluedspot(index) {
    const componentTemplate = '.componentTemplate[index=' + index + ']'
    if ($(componentTemplate + ' .is_assembled').prop('checked')) {
        if ($(componentTemplate + ' .glued_spot').val() == "") {
            alert('กรุณาใส่จำนวนจุดติดกาว')
            $(componentTemplate + ' .glued_spot').focus()
            return false
        }
    }
    return true
}

function checkValidateFluteSide(index, componentType) {
    if (componentType == 2 || componentType == 3) {
        if ($('.inputType[index=' + index + '] .flute_side').val() == "") {
            alert('กรุณาเลือก ด้านขนานลอนลูกฟูก')
            $('.inputType[index=' + index + '] .flute_side').focus()
            return false
        }
    }
    return true
}

function checkValidateProcess() {
    let check_input = true
    var process_length = $('.otherProcess').length
    var handwork_length = $('.handworkProcess').length
    var material_length = $('.materialProcess').length
    var custom_length = $('.customProcess').length
    var otherCost_length = $('.otherCostProcess').length
    for (var i = 0; i < process_length; i++) {
        if ($('.otherProcess:eq(' + i + ') .nameProcess input').val() == "") {
            alert('กรุณาใส่ ชื่อ Process')
            $('.otherProcess:eq(' + i + ') .nameProcess input').focus()
            return false
        }

        $('.otherProcess:eq(' + i + ') .ppuProcess').each((index, td) => {
            if ($(td).find('input').val() == '') {
                $(td).find('input').focus()
                alert('กรุณาใส่ ราคาต่อหน่วย')
                check_input = false
                return false
            }
        })

        if (check_input == false) {
            return false
        }

        // if ($('.otherProcess:eq(' + i + ') .ppuProcess input').val() == "") {
        //     alert('กรุณาใส่ ราคาต่อหน่วย')
        //     $('.otherProcess:eq(' + i + ') .ppuProcess input').focus()
        //     return false
        // }
    }
    for (var j = 0; j < handwork_length; j++) {
        if ($('.handworkProcess:eq(' + j + ') .nameProcess input').val() == "") {
            alert('กรุณาใส่ ชื่อ Process')
            $('.handworkProcess:eq(' + j + ') .nameProcess input').focus()
            return false
        }
        // if ($('.handworkProcess:eq(' + j + ') .ppuProcess input').val() == "") {
        //     alert('กรุณาใส่ ราคาต่อหน่วย')
        //     $('.handworkProcess:eq(' + j + ') .ppuProcess input').focus()
        //     return false
        // }
        $('.handworkProcess:eq(' + i + ') .ppuProcess').each((index, td) => {
            if ($(td).find('input').val() == '') {
                $(td).find('input').focus()
                alert('กรุณาใส่ ราคาต่อหน่วย')
                check_input = false
                return false
            }
        })

        if (check_input == false) {
            return false
        }
    }
    for (var i = 0; i < custom_length; i++) {
        if ($('.customProcess:eq(' + i + ') .nameProcess input').val() == "") {
            alert('กรุณาใส่ ชื่อ Process')
            $('.customProcess:eq(' + i + ') .nameProcess input').focus()
            return false
        }
        // if ($('.customProcess:eq(' + i + ') .ppuProcess input').val() == "") {
        //     alert('กรุณาใส่ ราคาต่อหน่วย')
        //     $('.customProcess:eq(' + i + ') .ppuProcess input').focus()
        //     return false
        // }
        $('.customProcess:eq(' + i + ') .ppuProcess').each((index, td) => {
            if ($(td).find('input').val() == '') {
                $(td).find('input').focus()
                alert('กรุณาใส่ ราคาต่อหน่วย')
                check_input = false
                return false
            }
        })

        if (check_input == false) {
            return false
        }
    }
    for (var i = 0; i < handwork_length; i++) {
        if ($('.customProcess:eq(' + i + ') .nameProcess input').val() == "") {
            alert('กรุณาใส่ ชื่อ Process')
            $('.customProcess:eq(' + i + ') .nameProcess input').focus()
            return false
        }
        if ($('.customProcess:eq(' + i + ') .ppuProcess input').val() == "") {
            alert('กรุณาใส่ ราคาต่อหน่วย')
            $('.customProcess:eq(' + i + ') .ppuProcess input').focus()
            return false
        }
    }
    for (var k = 0; k < material_length; k++) {
        if ($('.materialProcess:eq(' + k + ') .nameProcess input').val() == "") {
            alert('กรุณาใส่ ชื่อ Process')
            $('.materialProcess:eq(' + k + ') .nameProcess input').focus()
            return false
        }
        if ($('.materialProcess:eq(' + k + ') .ppuProcess input').val() == "") {
            alert('กรุณาใส่ ราคาต่อหน่วย')
            $('.materialProcess:eq(' + k + ') .ppuProcess input').focus()
            return false
        }
        if ($('.materialProcess:eq(' + k + ') .is_fixedPrice').prop('checked')) {
            if ($('.materialProcess:eq(' + k + ') .numMat input').val() == "") {
                alert('กรุณาใส่ จำนวน Material')
                $('.materialProcess:eq(' + k + ') .numMat input').focus()
                return false
            }
        } else {
            var mat_length = $('.materialProcess:eq(' + k + ') .numMat').length
            for (var m = 0; m < mat_length; m++) {
                if ($('.materialProcess:eq(' + k + ') .numMat:eq(' + m + ') input').val() == "") {
                    alert('กรุณาใส่ จำนวน Material')
                    $('.materialProcess:eq(' + k + ') .numMat:eq(' + m + ') input').focus()
                    return false
                }
            }
        }
    }
    for (var k = 0; k < otherCost_length; k++) {
        if ($('.otherCostProcess:eq(' + k + ') .nameProcess input').val() == "") {
            alert('กรุณาใส่ ชื่อ Other')
            $('.otherCostProcess:eq(' + k + ') .nameProcess input').focus()
            return false
        }
        if ($('.otherCostProcess:eq(' + k + ') .ppuProcess input').val() == "") {
            alert('กรุณาใส่ ราคาต่อหน่วย')
            $('.otherCostProcess:eq(' + k + ') .ppuProcess input').focus()
            return false
        }
        if ($('.otherCostProcess:eq(' + k + ') .is_fixedPrice').prop('checked')) {
            if ($('.otherCostProcess:eq(' + k + ') .numMat input').val() == "") {
                alert('กรุณาใส่ จำนวน Other')
                $('.otherCostProcess:eq(' + k + ') .numMat input').focus()
                return false
            }
        } else {
            var mat_length = $('.otherCostProcess:eq(' + k + ') .numMat').length
            for (var m = 0; m < mat_length; m++) {
                if ($('.otherCostProcess:eq(' + k + ') .numMat:eq(' + m + ') input').val() == "") {
                    alert('กรุณาใส่ จำนวน Other')
                    $('.otherCostProcess:eq(' + k + ') .numMat:eq(' + m + ') input').focus()
                    return false
                }
            }
        }
    }
    return true
}

function checkValidateLayout() {
    const num_comp = $('.componentInfo').length
    for (var index = 0; index < num_comp; index++) {
        var componentType = getComponentType(index)
        var is_manual = $('.manualLayout[index=' + index + ']').prop('checked')
        var componentInfo = '.componentInfo[index=' + index + ']'
        if (is_manual) {
            // ! Manual lay.
            if ($(componentInfo + ' .wLaySize').val() == "") {
                alert('กรุณาใส่ Layout Size')
                $(componentInfo + ' .wLaySize').focus()
                return false
            } else if ($(componentInfo + ' .lLaySize').val() == "") {
                alert('กรุณาใส่ Layout Size')
                $(componentInfo + ' .lLaySize').focus()
                return false
            } else if (componentType != 3) {
                if ($(componentInfo + ' .parallelRollWidth').val() == "") {
                    alert('กรุณาเลือกด้านขนานหน้าม้วนกระดาษ')
                    $(componentInfo + ' .parallelRollWidth').focus()
                    return false
                }
            }

            if (componentType != 1) {
                if ($(componentInfo + ' .parallelFluteSide').val() == "") {
                    alert('กรุณาเลือกด้านขนานลอนลูกฟูก')
                    $(componentInfo + ' .parallelFluteSide').focus()
                    return false
                }
            }
        } else {
            // ! Auto Lay.
            if ($(componentInfo + ' .gripper input').val() == "") {
                alert('กรุณาใส่ระยะ gripper')
                $(componentInfo + ' .gripper input').focus()
                return false
            } else if ($(componentInfo + ' .color_bar input').val() == "") {
                alert('กรุณาใส่ระยะ color bar')
                $(componentInfo + ' .gripper input').focus()
                return false
            } else if ($(componentInfo + ' .paper_edge input').val() == "") {
                alert('กรุณาใส่ระยะขอบกระดาษ')
                $(componentInfo + ' .paper_edge input').focus()
                return false
            } else if ($(componentInfo + ' .bleed input').val() == "") {
                alert('กรุณาใส่ระยะเผื่อเจียน')
                $(componentInfo + ' .bleed input').focus()
                return false
            }

            if ($(componentInfo + ' .layout_grain').val() == "") {
                alert('กรุณาระบุ Layout grain')
                $(componentInfo + ' .layout_grain').focus()
                return false
            }
        }

        if ($(componentInfo + ' .wSize').val() == "") {
            alert('กรุณาใส่ Paper Size')
            $(componentInfo + ' .wSize').focus()
            return false
        } else if ($(componentInfo + ' .lSize').val() == "") {
            alert('กรุณาใส่ Paper Size')
            $(componentInfo + ' .lSize').focus()
            return false
        }

        if ($(componentInfo + ' .edit_w_layout input').val() == "") {
            alert('กรุณาใส่จำนวนชิ้นงานด้านกว้าง')
            $(componentInfo + ' .edit_w_layout input').focus()
            return false
        } else if ($(componentInfo + ' .edit_l_layout input').val() == "") {
            alert('กรุณาใส่จำนวนชิ้นงานด้านยาว')
            $(componentInfo + ' .edit_l_layout input').focus()
            return false
        }

        if ($('.alertNumLay').length) {
            alert('กรุณาตรวจสอบจำนวน Lay')
            return false
        }

        if ($('.alertLaysize_div').length) {
            alert('กรุณาตรวจสอบ Layout Size , Paper Size')
            return false
        }

        if ($('.divLayoutWarning *').length) {
            alert('กรุณาตรวจสอบคำแนะนำเรื่องการวาง Layout')
            return false
        }

        if ($('.recalc-layout:visible')?.length) {
            alert('กรุณาคำนวณ Layout ก่อน')
            return false
        }
    }
    return true
}

function checkValidatePackingCheckbox() {
    var check = true
    const isDiffPacking = getIsDifferentPacking()
    const num_comp = $('.component').length
    for (var index = 0; index < num_comp; index++) {
        let packingLength = isDiffPacking ? $('f_table').length : 1

        for (let fIndex = 0; fIndex < packingLength; fIndex++) {
            let count = 0
            $(`.packingCheck[index=${index}][fIndex=${fIndex}] input`).each(function () {
                if ($(this).prop('checked') == true) {
                    count += 1
                }
            })
            if (count == 0) {
                alert('กรุณาเลือก Packing')
                check = false
                break
            }
        }

    }

    return check
}

function checkValidatePaperbandPacking() {
    console.log("checkValidatePaperbandPacking")
    let check = true
    const isDiffPacking = getIsDifferentPacking()
    const num_comp = $('.component').length
    let qty_per_band = 0,
        kraftwrap_qty = 0
    // qty_per_carton = 0

    for (var index = 0; index < num_comp; index++) {
        let packingLength = isDiffPacking ? $('f_table').length : 1
        console.log("index", index)
        for (let fIndex = 0; fIndex < packingLength; fIndex++) {
            console.log("packingLength", fIndex)
            if ($(`.paperband[index=${index}][fIndex=${fIndex}] input`).prop('checked')) {
                qty_per_band = numeral($(`.qty_per_band[index=${index}][fIndex=${fIndex}]`).val() || 0).value()

                if (qty_per_band == "") {
                    alert('กรุณากรอก qty per paperband')
                    // $(`.qty_per_band[index=${index}][fIndex=${fIndex}]`).focus()
                    check = false
                    break;
                    // return false

                } else {
                    const { checkKraftwrap, checkCarton } = getPackingChecked(index, fIndex)
                    if (!checkKraftwrap && !checkCarton) {
                        alert('กรณีเลือก Packing: Paper Band กรุณาเลือกการ Packing แบบ Kraftwrap หรือ Carton ด้วย')
                        check = false
                        break;
                        // return false
                    }

                    if (checkKraftwrap) {
                        kraftwrap_qty = numeral($(`.kraftwrap_qty[index=${index}][fIndex=${fIndex}]`).val() || 0).value()
                        if (qty_per_band > kraftwrap_qty) {
                            alert('ไม่สามารถระบุ Qty./band มากกว่า Qty./kraftwrap ได้')
                            // $(`.qty_per_band[index=${index}][fIndex=${fIndex}]`).focus()
                            check = false
                            break;
                            // return false
                        }
                    }
                    // else if (checkCarton) {
                    //     qty_per_carton = numeral($(`.carton_info_qty_per_layer[index=${index}][fIndex=${fIndex}] input`).val() || 0).value()
                    //     if (qty_per_band > qty_per_carton) {
                    //         alert('ไม่สามารถระบุ Qty./band มากกว่า Qty./carton ได้')
                    //         $(`.qty_per_band[index=${index}][fIndex=${fIndex}]`).focus()
                    //         check = false
                    //         return false
                    //     }
                    // }
                }
            }

            if (!check) {
                break;
            }
        }

        if (!check) {
            break;
        }
    }

    return check
}

function checkValidateCustomPaper() {
    const { min, max } = defaultData?.print_type_config?.getPrintTypeConfig()?.gsm
    if ($('#paperCode-custom').val() == "") {
        alert('กรุณาเลือก Paper Type')
        return false
    }

    if ($('#paperType-custom').val() == "") {
        alert('กรุณากรอก Paper Name')
        $('#paperType-custom').focus()
        return false
    }

    if ($('#paperGram-custom').val() == "") {
        alert('กรุณากรอก Paper Gram')
        $('#paperGram-custom').focus()
        return false
    } else if ($('#paperGram-custom').val() != "") {
        if (getPrintType() == 'Jet Press') {
            if (parseInt($('#paperGram-custom').val()) < min) {
                alert(`Jet Press แกรมกระดาษต้องไม่น้อยกว่า ${min} แกรม กรุณากรอกแกรมใหม่`)
                $('#paperGram-custom').val("")
                $('#paperGram-custom').focus()
                return false
            }
        }
    }

    if ($('#paperThickness-custom').val() == "") {
        alert('กรุณากรอก ความหนากระดาษ')
        $('#paperThickness-custom').focus()
        return false
    } else {
        return true
    }
}

function checkValidateCustomCorrugated() {
    if ($('#corrugated-layer-custom').val() == "") {
        alert('กรุณาเลือก Layer')
        return false
    }

    if ($('#corrugated-flute-custom').val() == "") {
        alert('กรุณาเลือกลอน')
        return false
    }

    if ($('#corrugated-flute-custom').val() == "Custom") {
        if ($('#flute-info-custom').val() == "") {
            alert('กรุณากรอกข้อมูลลอน')
            $('#flute-info-custom').focus()
            return false
        }

        if ($('#thickness-custom-p').val() == "") {
            alert('กรุณากรอกข้อมูลลอน')
            $('#thickness-custom-p').focus()
            return false
        }
    }

    if ($('.type_custom1').val() == "") {
        alert('กรุณากรอกข้อมูล Grade')
        $('.type_custom1').focus()
        return false
    }

    if ($('.gram_custom1').val() == "") {
        alert('กรุณากรอกข้อมูล Grade')
        $('.gram_custom1').focus()
        return false
    }

    if ($('.type_custom2').val() == "") {
        alert('กรุณากรอกข้อมูล Grade')
        $('.type_custom2').focus()
        return false
    }

    if ($('.gram_custom2').val() == "") {
        alert('กรุณากรอกข้อมูล Grade')
        $('.gram_custom2').focus()
        return false
    }

    if ($('#corrugated-layer-custom').val() > 2) {
        if ($('.type_custom3').val() == "") {
            alert('กรุณากรอกข้อมูล Grade')
            $('.type_custom3').focus()
            return false
        }

        if ($('.gram_custom3').val() == "") {
            alert('กรุณากรอกข้อมูล Grade')
            $('.gram_custom3').focus()
            return false
        }
    }

    if ($('#corrugated-cost-custom').val() == "") {
        alert('กรุณากรอกราคา')
        $('#corrugated-cost-custom').focus()
        return false
    }

    if ($('#corrugated-bath-sheet').is(":checked")) {
        if ($('#flute-side-custom').val() == "") {
            alert('กรุณากรอกลอนขนานด้าน')
            $('#flute-side-custom').focus()
            return false
        }

        if ($('#cut-off-custom').val() == "") {
            alert('กรุณากรอก Cut off')
            $('#cut-off-custom').focus()
            return false
        }
    }

    return true
}

function checkValidateCustomFoilstamp() {
    if ($('#foilColor-custom').val() == "") {
        alert('กรุณากรอก Foil color')
        $('#foilColor-custom').focus()
        return false
    } else if ($('#foilCode-custom').val() == "") {
        alert('กรุณากรอก Foil code')
        $('#foilCode-custom').focus()
        return false
    } else if ($('#foilRollWidth-custom').val() == "") {
        alert('กรุณากรอก หน้าม้วน')
        $('#foilRollWidth-custom').focus()
        return false
    } else if ($('#foilRollLength-custom').val() == "") {
        alert('กรุณากรอก ความยาวม้วน')
        $('#foilRollLength-custom').focus()
        return false
    } else if ($('#foilRollPrice-custom').val() == "") {
        alert('กรุณากรอก ราคาม้วน')
        $('#foilRollPrice-custom').focus()
        return false
    }
    // else if ($('#foilRollMinPrice-custom').val() == "") {
    //     alert('กรุณากรอก ราคาม้วน')
    //     $('#foilRollMinPrice-custom').focus()
    //     return false
    // } 
    else {
        return true
    }
}

function checkValidateColorLimit() {
    let check = true
    $('.chk_color_limit:visible').each((index, ele) => {
        const checked = $(ele).prop('checked')
        const input = $(ele).closest('tr').find('.color_limit input');
        if (checked) {
            if (input.val() == "") {
                alert('กรุณาระบุจำนวนเล่มลิมิตสี')
                input.focus()
                check = false
                return false
            }
        }
    })

    console.log("test")
    return check
}

function checkLessOrMoreSize(item) {
    const {
        machine: { w_range, l_range }
    } = item

    let checkLay = {
        machineAvailable: w_range && l_range ? true : false,
        is_less: false,
        is_more: false,
    }

    const { short_side, long_side } = getShortLongSide(item)
    if (w_range && l_range) {
        checkLay = {
            ...checkLay,
            machineAvailable: true,
            is_less: short_side < w_range[2] || long_side < l_range[2] ? true : false,
            is_more: short_side > w_range[3] || long_side > l_range[3] ? true : false
        }
    }
    return checkLay
}

function checkValidateAllNameComponent() {
    for (var index = 0; index < $('.nameComp').length; index++) {
        if (checkValidateNameComp(index) === false) {
            return false
        }
    }
}

function storeDeliveryData() {
    /*
        validate & store data
        1. validate component.
        2. pack delivery data.
        3. validate delivery data.
        4. return validate
    */

    let validate = false
    //* check validate qty.
    if (checkValidateDelivery()) {
        const
            trDelivery = $(`.deliveryProcess`),
            is_splitDelivery = getIsSplitDelivery(),
            isMultipleF = getIsMultipleF(),
            deliveryData = [],
            { qty: { main: mainQty, runon, totalqty } } = est.mainData,
            component = est.mainData.component1

        //* 1. validate component
        if (component.length <= 0) {
            alert('ไม่พบข้อมูล Components')
            return false
        }

        //* 2. pack delivery data.
        for (let index = 0; index < trDelivery.length; index++) {
            const
                deliveryDetail = [],
                trComp = component.length > 1 || isMultipleF
                    ? $(`.deliveryProcess[index=${index}] .trDeliveryMultipleProcess`)
                    : $(`.deliveryProcess[index=${index}]`)
            const deliveryDate = $(`.deliveryProcess[index=${index}] input.deliveryDate`).val()

            //* delivery data obj. [ Round ]
            objDeliveryInfo = {
                round: index + 1,
                destinationId: parseInt($(`.deliveryProcess[index=${index}] input.deliveryDestinationId`).val()),
                destinationName: $(`.deliveryProcess[index=${index}] input.deliveryDestinationName`).val(),
                dueDate: deliveryDate ? toDateDBFormat(deliveryDate) : null,
                detail: []
            }

            //* get delivery detail
            if (is_splitDelivery) {
                //* split delivery
                if (trComp.length > 0) {
                    trComp.each((trIndex) => {
                        const trSelector = component.length > 1 || isMultipleF
                            ? `.deliveryProcess[index=${index}] .trDeliveryMultipleProcess:eq(${trIndex})`
                            : `.deliveryProcess[index=${index}]`
                        const compId = isMultipleF ? 0 : parseInt($(`${trSelector} select.deliveryComponentId`).val()) || 0
                        const f_code = isMultipleF ? $(`${trSelector} select.deliveryComponentId option:selected`).text() || '' : ''
                        const objDetail = {
                            componentId: compId,
                            f_code,
                            fIndex: parseInt($(`${trSelector} select.deliveryComponentId`).val()),
                            qty: numeral($(`${trSelector} .deliveryQty input`).val()).value(),
                            totalqty: mainQty?.map((qty, index) => qty + runon[index]),
                            total_weight: []
                        }
                        deliveryDetail.push(objDetail)
                    })
                }
            } else {
                //* onetime delivery
                deliveryDetail.push(
                    ...component.map((comp, compIndex) => ({
                        componentId: compIndex,
                        f_code: '',
                        fIndex: 0,
                        qty: totalqty?.reduce((total, curr) => total += curr, 0),
                        totalqty: mainQty?.map((qty, index) => qty + runon[index]),
                        total_weight: []
                    }))
                )
            }

            objDeliveryInfo.detail = deliveryDetail
            deliveryData.push(objDeliveryInfo)
        }

        //* 3. validate delivery data
        if (
            deliveryData.some(obj =>
                !obj.destinationId ||
                !obj.destinationName
                // || !obj.dueDate
            )
        ) {
            alert('กรุณาระบุข้อมูลสถานที่จัดส่ง')
            validate = false
        } else {
            validate = true
        }

        est.setDelivery(deliveryData)
        //* 4. return validate
    }
    return validate
}

function checkValidateDelivery() {
    const deliveryQty = est.checkDeliveryQty
    let check = true
    const is_splitDelivery = getIsSplitDelivery()
    const isMultipleF = getIsMultipleF()

    if (est.mainData.qty.totalqty.length === 1 && is_splitDelivery) {
        deliveryQty.forEach((comp, index) => {
            let compName = $(`.nameComponent[index=${index}] .nameComp`).val()
            if (isMultipleF) {
                compName = $(`.f_table .f-code:eq(${index})`).val() || '-ไม่พบข้อมูล-'
            }

            if (comp.balance > 0) {
                alert(`จำนวนยอดจัดส่ง"ไม่ครบ"ยอดที่ระบุไว้ กรุณาแก้ไขยอดจัดส่งของ ${compName}`)
                check = false
                return
            }

            if (comp.balance < 0) {
                alert(`จำนวนยอดจัดส่ง"เกินกว่า"ยอดที่ระบุไว้ กรุณาแก้ไขยอดจัดส่งของ ${compName}`)
                check = false
                return
            }
        })
    }

    return check
}

function checkValidateFCode() {
    let check = true
    let f_list = []
    $(`#multiple_f_qty_info input.f-code`).each((index, ele) => {
        const value = $(ele).val() || ''
        if (value !== '') {
            if (!f_list.includes(value)) {
                f_list.push(value)
            } else {
                check = false
                return false
            }
        }
    })

    return check
}

function checkValidateMultipleF() {
    const isMultipleF = getIsMultipleF()
    let check = true

    if (isMultipleF) {
        // * validate select code
        if (!checkNumberOfColorSelection(true)) {
            alert(`กรุณาตรวจสอบชุดสีให้สัมพันธ์กับจำนวน F`);
            check = false
        }

        //* validate select box
        $('.f-code-select').each((index, ele) => {
            const checkSelect = $(ele).find(':selected').val()
            let checkDisplay = $(ele).closest('.f-addon').css('display') === 'none'

            if (!checkSelect && !checkDisplay) {
                $(ele).focus()
                alert(`กรุณาระบุ F`)
                check = false
                return false
            }
        })

    }

    return check
}

function checkSomeCoatingType(compIndex, coatingType) {
    let returnValue = {
        validate: false,
        count: 0
    }

    if (!coatingType) {
        return returnValue;
    }

    $(`.component[index=${compIndex}] .coatingType`).each((index, ele) => {
        const eleType = ($(ele).val())?.substring(0, ($(ele).val())?.length - 2)
        if (eleType === 'UV-D') {
            returnValue.validate = true
            returnValue.count += 1
            // return;
        }
    })

    return returnValue
}


function checkNumberOfColorSelection(checkIsEqual = false) {
    const isMultipleF = getIsMultipleF()
    let check = true

    if (isMultipleF) {
        const
            colorLength = $(`.specialInk-container`).length || 0,
            fLength = $(`#qtyInput .f_table`).length || 0
        if (checkIsEqual) {
            if (colorLength == fLength) {
                check = true
            } else {
                check = false
            }
        } else {
            if (colorLength >= fLength) {
                check = false
            }
        }
    }

    return check
}

function checkValidateSelectedDuplicateFCode(value, selector) {
    let check = true
    if ($(selector).length > 0) {
        $(selector).each((index, ele) => {
            const thisValue = $(ele).find('option:selected').val()
            if (thisValue == value) {
                check = false
                return false
            }
        })
    }

    return check
}

function checkValidatePutRemark() {
    if ($("#reject-remark").length > 0) {
        if ($("#reject-remark").text() == "") {
            alert('กรุณาระบุเหตุผลที่ Reject')
            return false;
        }
    }

    return true;
}

function checkValidateDataBeforeSave() {
    if (!checkValidateLossInput()) {
        return false
    }

    return true
}


function checkValidateLossInput() {
    let check = true
    $('.loss_baht:visible').each((index, ele) => {
        if ($(ele).val() == '') {
            $(ele).focus()
            alert('กรุณาระบุจำนวนที่ขาดทุน')
            check = false
            return false
        }
    })

    return check
}

function checkValidateCustomPrice() {
    let check = true
    $('.price_difference_tr input').each((index, ele) => {
        if ($(ele).val() == '') {
            $(ele).focus()
            alert('กรุณาระบุส่วนต่างลูกค้าให้ครบถ้วน')
            check = false
            return false
        }
    })

    if (!check) {
        return check
    }

    $('.customer_gift_tr input').each((index, ele) => {
        if ($(ele).val() == '') {
            $(ele).focus()
            alert('กรุณาระบุค่าของขวัญลูกค้าให้ครบถ้วน')
            check = false
            return false
        }
    })

    return check
}


function checkValidatePutRemark() {
    if ($("#reject-remark").length > 0) {
        if ($("#reject-remark").text() == "") {
            alert('กรุณาระบุเหตุผลที่ Reject')
            return false;
        }
    }

    return true;
}

function checkValidateLayoutAlert(index) {
    const obj = {
        validate: true,
        message: ''
    }

    const layAlertLength = $(`.componentInfo[index=${index}]`).find('.alertZeroLay:visible, .alertLaySize:visible, .alertNumLay:visible').length || 0
    if (layAlertLength) {
        obj.validate = false
        obj.message = 'กรุณาตรวจสอบคำแนะนำเรื่องการวางเลย์'
    }

    if (!obj.validate) {
        alert(obj.message)
    }

    return obj.validate
}

function checkValidateLayoutSize(index) {
    const comp = est.mainData.component1[index] || {}

    $('.alertLaysize_div[index=' + index + ']').remove()

    const obj = {
        validate: true,
        message: ''
    }

    const layoutSize = [], paperSize = []

    $(`.componentInfo[index=${index}] .layoutSize input`).each((index, ele) => {
        const value = parseFloat(parseFloat($(ele).val() || 0).toFixed(3))
        if (value != 0) {
            layoutSize.push(value)
        }
    })

    $(`.componentInfo[index=${index}] .paperSize input`).each((index, ele) => {
        const value = parseFloat(parseFloat($(ele).val() || 0).toFixed(3))
        if (value != 0) {
            paperSize.push(value)
        }
    })

    console.log("layoutSize", layoutSize, paperSize)

    // if()
    if (layoutSize.length < 2) {
        console.log("validate case 0", layoutSize, paperSize)
        return obj
    }

    if ([2].includes(comp?.component_type?.type) && (comp?.corrugated_layer?.info?.is_price_per_sheet || false)) {
        const fluteSide = $(`.componentInfo[index=${index}] .parallelFluteSide`).val() || ''
        const corrugated_size = comp?.corrugated_layer?.info?.corrugated_size

        if (fluteSide == 'WSize') {
            if (corrugated_size[2] > paperSize[0]) {
                obj.message = `ไม่สามารถเลือกลอนลูกฟูกขนานด้านนี้ได้ เนื่องจากลอนลูกฟูกที่กำหนดในด้าน (${corrugated_size[2]}) มากกว่าหน้าม้วน (${paperSize[0]})`
                obj.validate = false
                console.log("validate case 0.1")
                return obj
            }

            if (corrugated_size[3] > paperSize[1]) {
                obj.message = `ไม่สามารถเลือกลอนลูกฟูกขนานด้านนี้ได้ เนื่องจากลอนลูกฟูกที่กำหนดในด้าน (${corrugated_size[3]}) มากกว่า Cut off (${paperSize[1]})`
                obj.validate = false
                console.log("validate case 0.2")
                return obj
            }

            if (layoutSize[0] < corrugated_size[2]) {
                obj.message = `Layout Size ในด้าน (${layoutSize[0]}) ที่ระบุ จะต้องมากกว่าหรือเท่ากับขนาดลูกฟูกที่กำหนดไว้ (${corrugated_size[2]})`
                obj.validate = false
                $('.componentInfo[index=' + index + '] .layoutSize input:eq(0)').select()
                console.log("validate case 1")
                return obj
            }

            if (layoutSize[1] < corrugated_size[3]) {
                obj.message = `Layout Size ในด้าน (${layoutSize[1]}) ที่ระบุ จะต้องมากกว่าหรือเท่ากับขนาดลูกฟูกที่กำหนดไว้ (${corrugated_size[3]})`
                obj.validate = false
                $('.componentInfo[index=' + index + '] .layoutSize input:eq(1)').select()
                console.log("validate case 2")
                return obj
            }

        } else if (fluteSide == 'LSize') {
            if (corrugated_size[3] > paperSize[0]) {
                obj.message = `ไม่สามารถเลือกลอนลูกฟูกขนานด้านนี้ได้ เนื่องจากลอนลูกฟูกที่กำหนดในด้าน (${corrugated_size[3]}) มากกว่า Cut off (${paperSize[0]})`
                obj.validate = false
                console.log("validate case 0.3")
                return obj
            }

            if (corrugated_size[2] > paperSize[1]) {
                obj.message = `ไม่สามารถเลือกลอนลูกฟูกขนานด้านนี้ได้ เนื่องจากลอนลูกฟูกที่กำหนดในด้าน (${corrugated_size[2]}) มากกว่าหน้าม้วน (${paperSize[1]})`
                obj.validate = false
                console.log("validate case 0.4")
                return obj
            }

            console.log('compare', layoutSize, corrugated_size)

            if (layoutSize[1] < corrugated_size[2]) {
                console.log(`${layoutSize[1]} < ${corrugated_size[2]}`)
                obj.message = `Layout Size ในด้าน (${layoutSize[1]}) ที่ระบุ จะต้องมากกว่าหรือเท่ากับขนาดลูกฟูกที่กำหนดไว้ (${corrugated_size[2]})`
                obj.validate = false
                $('.componentInfo[index=' + index + '] .layoutSize input:eq(1)').select()
                console.log("validate case 1")
                return obj
            }

            if (layoutSize[0] < corrugated_size[3]) {
                console.log(`${layoutSize[0]} < ${corrugated_size[3]}`)
                obj.message = `Layout Size ในด้าน (${layoutSize[0]}) ที่ระบุ จะต้องมากกว่าหรือเท่ากับขนาดลูกฟูกที่กำหนดไว้ (${corrugated_size[3]})`
                obj.validate = false
                $('.componentInfo[index=' + index + '] .layoutSize input:eq(0)').select()
                console.log("validate case 2")
                return obj
            }

        } else {
            obj.message = 'กรุณาเลือกลอนลูกฟูก'
            obj.validate = false
            $(`.componentInfo[index=${index}] .parallelFluteSide`).focus()
            return obj
        }
    }

    if (paperSize.length < 2) {
        console.log("validate case 0", layoutSize, paperSize)
        return obj
    }

    if (layoutSize[0] > paperSize[0]) {
        obj.message = `ไม่สามารถวาง Lay. ได้ เนื่องจาก Layout Size (${layoutSize[0]}) มากกว่าขนาดกระดาษ (${paperSize[0]})`
        obj.validate = false
        $('.componentInfo[index=' + index + '] .layoutSize input:eq(0)').focus()
        console.log("validate case 3")
        return obj
    }

    if (layoutSize[1] > paperSize[1]) {
        obj.message = `ไม่สามารถวาง Lay. ได้ เนื่องจาก Layout Size (${layoutSize[1]}) มากกว่าขนาดกระดาษ (${paperSize[1]})`
        obj.validate = false
        $('.componentInfo[index=' + index + '] .layoutSize input:eq(1)').focus()
        console.log("validate case 4")
        return obj
    }

    // * Validate Min size Machine.
    const { min_size = [] } = comp?.machine || {}


    if (
        (layoutSize[0] < min_size[0] || layoutSize[1] < min_size[1]) &&
        (layoutSize[0] < min_size[1] || layoutSize[1] < min_size[0])
    ) {
        obj.message = `ไม่สามารถวาง Lay. ได้ เนื่องจาก Layout Size น้อยกว่า Min. Size Machine`
        obj.validate = false
        $(`.componentInfo[index=${index}] .layoutSize input:eq(0)`).focus()
        console.log("validate case 5", layoutSize, min_size)
        return obj
    }

    console.log("obj validate", obj)
    return obj
}

function checkValidateComponentCustomCorrugated(index) {
    let validate = true

    // $(`.component[index=${index}]`).each((index,ele) => {
    const isManualLayout = $(`.component[index=${index}]`).find('.is_manualLayout').prop('checked') || false
    const compType = parseInt($(`.component[index=${index}]`).find('.componentType').val() || 0)
    const isCustom = $(`.component[index=${index}] .isPricePerSheet`).val() == '1' ? true : false

    if ([2].includes(compType)) {

        if (isCustom) {

            if (!isManualLayout) {

                validate = false
                alert('งานประกบลูกฟูก หากระบุขนาดลูกฟูกเอง กรุณาเลือก Manual Layout.')
                scrollToSection(`.componentTemplate[index=${index}]`)
                return false

            }
        }
    }
    // })

    return validate
}

function checkValidateManualLayout(index) { //* Validate for Manual Layout.
    let validate = true

    setWarningLayout(index, '') //* Clear Warning.
    /*
        1. layout size จะต้องมากกว่า corrugated size ในด้านที่ตรงกัน?
        2. layout size จะต้อง <= Paper Size
        3. ลอนลูกฟูกจะติดอยู่กับ layout size ถ้าเลือกด้านไหน แปลว่า จะต้องกลับด้าน layout
        4. เกรนชิ้นงานตาม layout
    */

    const isManualLayout = $(`.manualLayout[index=${index}]`).prop('checked') || false

    if (!isManualLayout) { //* Not Manual Layout
        return validate
    }

    console.log("start validate")

    const validateLaySizePaper = checkValidateLayoutSize(index)

    console.log("validateLaySizePaper", validateLaySizePaper)
    if (!validateLaySizePaper?.validate) {
        // alert(validateLaySizePaper.message)
        setWarningLayout(index, [validateLaySizePaper.message])
        validate = false
        return validate
    }


    // todo div Alert laying & check div alert before calc price
    return validate
}

// * validate
function validateRejectRemark() {
    let validate = true

    const remark = $('#reject_remark_text.required')

    if (remark?.length && remark?.val()?.trim() == '') {
        validate = false
        snackAlert('กรุณาระบุหมายเหตุที่ Reject')
    }

    return validate
}

function checkValidatePaper(index) {
    let validate = true
    const comp = $(`.component[index=${index}]`)
    const compType = getComponentType(index)

    if (!comp?.length || compType == 3) {
        return validate
    }

    const gram = parseInt(comp.find('.paperGram').val() || comp.find('.paperGram-custom').html() || 0)
    const paperCost = parseFloat(comp.find('.paperCost:visible').val() || 0, 2)

    if (!validatePrintTypeGram(gram)) {
        validate = false

        return validate
    }

    if (paperCost <= 0) {
        snackAlert('กรุณาตรวจสอบราคากระดาษ')

        scrollToSection(comp, -100)
        validate = false
    }

    return validate
}

function validatePrintTypeGram(gram = 0) {
    let validate = true

    const { gsm: { min = 0, max = 0 } } = defaultData.print_type_config.getPrintTypeConfig()

    if (gram < min || gram > max) {

        snackAlert(`กรุณาตรวจสอบ gram กระดาษ. ( min: ${min} , max: ${max} gsm )`)
        validate = false
    }

    return validate
}
// * validate

function validateOpenJobDocs(open_job_status = 0, is_super_admin = 0) {
    let validate = true

    if (open_job_status == 1 && is_super_admin == 0) {
        validate = false
    }

    return validate
}