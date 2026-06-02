function get_box_template_arr(index) {
    console.log('> boxType', $('.boxType[index=' + index + ']'));
    db.db.box_template_info.forEach((item) => {
        $('.boxType[index=' + index + ']').append("<option value=" + item.type_id + ">" + item.type_id + ". " + item.type_name + " : " + item.type_name_th + "</opion>")
    })
}

function get_corrugated_type(layer) {
    if (layer != "") {
        var arr1 = []
        db.db.corrugated_info.forEach((item1) => {
            if (item1.layer == layer) {
                arr1.push(item1.flute_type)
            }
        })
    }
    return removeDuplicate(arr1)
}

function get_corrugated_grade_type1(layer, flute_type) {
    if (flute_type != "") {
        var arr = []
        db.db.corrugated_info.forEach((item1) => {
            if (item1.layer == layer && item1.flute_type == flute_type) {
                arr.push(item1.type_1)
            }
        })
    } else {
        var arr = []
    }
    return removeDuplicate(arr)
}

function get_corrugated_grade_gram1(layer, flute_type, type1) {
    if (flute_type != "") {
        var arr = []
        db.db.corrugated_info.forEach((item1, index1) => {
            if (item1.layer == layer && item1.flute_type == flute_type && item1.type_1 == type1) {
                arr.push(item1.gram_1)
            }
        })
    } else {
        var arr = []
    }
    return removeDuplicate(arr)
}

function get_corrugated_grade_type2(layer, flute_type, type_1, gram_1) {
    if (flute_type != "") {
        var arr = []
        db.db.corrugated_info.forEach((item1) => {
            if (item1.layer == layer && item1.flute_type == flute_type && item1.type_1 == type_1 && item1.gram_1 == gram_1) {
                arr.push(item1.type_2)
            }
        })
    } else {
        arr = []
    }
    return removeDuplicate(arr)
}

function get_corrugated_grade_gram2(layer, flute_type, type_1, gram_1, type_2) {
    if (flute_type != "") {
        var arr = []
        db.db.corrugated_info.forEach((item1) => {
            if (item1.layer == layer && item1.flute_type == flute_type && item1.type_1 == type_1 && item1.gram_1 == gram_1 && item1.type_2 == type_2) {
                arr.push(item1.gram_2)
            }
        })
    } else {
        arr = []
    }
    return removeDuplicate(arr)
}

function get_corrugated_grade_type3(layer, flute_type, type_1, gram_1, type_2, gram_2) {
    if (flute_type != "") {
        var arr = []
        db.db.corrugated_info.forEach((item1) => {
            if (item1.layer == layer && item1.flute_type == flute_type && item1.type_1 == type_1 && item1.gram_1 == gram_1 &&
                item1.type_2 == type_2 && item1.gram_2 == gram_2) {
                arr.push(item1.type_3)
            }
        })
    } else {
        arr = []
    }
    return removeDuplicate(arr)
}
function get_corrugated_grade_gram3(layer, flute_type, type_1, gram_1, type_2, gram_2, type_3) {
    if (flute_type != "") {
        var arr = []
        db.db.corrugated_info.forEach((item1) => {
            if (item1.layer == layer && item1.flute_type == flute_type && item1.type_1 == type_1 && item1.gram_1 == gram_1 &&
                item1.type_2 == type_2 && item1.gram_2 == gram_2 && item1.type_3 == type_3) {
                arr.push(item1.gram_3)
            }
        })
    } else {
        arr = []
    }
    return removeDuplicate(arr)
}

function get_coating_code(coating_option, allow_conditions = []) {
    if (coating_option != "") {
        var arr = []
        db.db.coating_info.forEach((item1) => {
            // if (item1?.condition_key && !allow_conditions?.includes(item1?.condition_key)) return //* ไม่แสดง coating code ที่มี conditions

            if (item1.coating_option == coating_option) {
                arr.push({
                    coating_code: item1.coating_code,
                    coating_type: item1.coating_type,
                    pages: item1.pages,
                    condition_key: item1.condition_key
                })
            }
        })
        arr = removeDuplicateObj(arr, 'coating_code')
    } else {
        var arr = ""
    }
    return arr
}

function get_foilstamp_code(stampColor) {
    var arr = []
    db.db.foilstamp_info.forEach((item1) => {
        if (item1.color_th == stampColor) {
            arr.push(item1.code)
        }
    })
    return arr
}

function getFoilStampColor(index) {
    var arr = db.db.foilstamp_info.map((item1) => {
        return (item1.color_th)
    })
    var data = removeDuplicate(arr)
    var option = `<option value="">-select-</option>`

    data.forEach((item1) => {
        option += `<option value=${item1}>${item1}</option>`
    })
    if (index) {
        $('.foilstampInput[index=' + index + '] .foilColor:last').append(option)
    } else {
        $('.foilColor:last').append(option)
    }

}

function getMasterPaperPrintType() {
    const { gsm, print_type_id = 1 } = defaultData.print_type_config.getPrintTypeConfig()

    return db.db.paper_info.filter(paper =>
        paper?.print_type?.split(',')?.includes(`${print_type_id}`)
        && paper?.is_fsc == 0 //* packaging ยังไม่มี FSC
    )
}

function getPaperTypeInfo(paperType, paperGram) {
    const info = getMasterPaperPrintType()?.find(obj =>
        obj.paper_code === paperType
        && obj.gram === paperGram
        && obj?.is_fsc == 0
    ) || {}

    return info || null
}

function getPaperPrice(paperType, paperGram, sourcePaperId = 1) {
    const price = getMasterPaperPrintType()?.find(obj =>
        obj.paper_code === paperType
        && obj.gram === paperGram
        && obj?.is_fsc == 0
    ) || {}

    console.log("price", price)

    return (sourcePaperId == 2 ? price?.price_import : price?.price) || 0
}

function getPaperType(index) {
    var arr = getMasterPaperPrintType().map(obj => ({
        code: obj.paper_code,
        type: obj.paper_type
    }))

    arr = removeDuplicateObj(arr, 'code')

    const typeList = getDefaultPaperTypeList();

    arr = arr.filter((item) => typeList.includes(item.code))

    $(`.paperInput[index=${index}] .paperType`).html('<option value="">-select type</option>')

    arr.forEach((item1) => {
        $(`.paperInput[index=${index}] .paperType`).append(`<option value="${item1.code}">${item1.type}</option>`)
    })
}

function getDefaultPaperTypeList() {
    const { gsm, print_type_id = 1 } = defaultData.print_type_config.getPrintTypeConfig()

    // const printType = defaultData.print_type_config.selected || ''

    // todo get print type id

    const paperTypeList = [... new Set(getMasterPaperPrintType()?.filter(paper =>
        paper.gram >= gsm.min &&
        paper.gram <= gsm.max
    )?.map(paper => paper.paper_code))]

    return paperTypeList
}

function get_papergram_arr(paperType) {
    const { gsm } = defaultData.print_type_config.getPrintTypeConfig()

    const typeGram = getMasterPaperPrintType()?.filter(paper =>
        paper.paper_code == paperType &&
        paper.gram >= gsm.min &&
        paper.gram <= gsm.max
    )?.map(paper => paper.gram)

    return [... new Set(typeGram)]
}

function getDefaultGluedSpot(box_type) {
    var arr = db.db.box_template_info.filter((item) => { return item.type_id == box_type })
    if (arr.length != 0) {
        return arr[0].glued_spot
    } else {
        return 0
    }
}

function getDefaultDust(box_type) {
    const { box_template } = defaultData || {}
    const { config } = box_template?.find(template => template?.id == box_type) || {}
    if (config) {
        return config?.dust?.length ? config?.dust : ['', '']
    } else {
        return ['', '']
    }
}

function getSpeInkListInfo(db_arr, value_key, caption_key, class_name) {
    var arr = []
    db_arr.forEach((item) => {
        arr.push({
            value: item[value_key],
            caption: item[caption_key]
        })
    })
    arr = removeDuplicateObj(arr, 'value')
    arr.forEach((item) => {
        $('.' + class_name + ':last').append('<option value="' + item.value + '">' + item.caption + '</option>');
    })
}

function getSpeInkListOption(db_arr, value_key, caption_key) {
    var arr = []
    db_arr.forEach((item) => {
        arr.push({
            value: item[value_key],
            caption: item[caption_key]
        })
    })
    arr = removeDuplicateObj(arr, 'value')
    return arr.map(item => `<option value="${item.value}">${item.caption}</option>`)
}

function getSpecialInkType(process_id) {
    return db.db.special_ink_info.filter((item) => item.process_id == process_id)
        .map(({ special_ink_type_th }) => special_ink_type_th)[0];
}

function getSpeInkInfo(key_filter, print_style, key_ans) {
    var arr = removeDuplicateObj(db.db.special_ink_factor_info, key_filter);
    return arr.filter((item) => item[key_filter] == print_style)
        .map((item) => item[key_ans])[0];
}



function getPaperCodeSpecialInk(paper_code) {
    arr = removeDuplicateObj(db.db.paper_info, 'paper_code');
    return arr.filter((item) => item.paper_code == paper_code)
        .map(({ special_ink_paper_code }) => special_ink_paper_code)[0]

}

function getStdPaperSize(std_paper_id) {
    // obj size of std. paper
    const stdPaperSize = db.db.machine_std_paper_info.filter(item => item.std_paper_id == std_paper_id)
    return stdPaperSize ? stdPaperSize[0] : {}
}

function getStdPaperList(item, is_default = false) {
    const { special_paper_code } = defaultData
    const { color: { outside, inside }, paper } = item || {}
    const { paper_code } = paper || {}
    const maxColor = (outside < inside ? inside : outside) || 0
    let paperList = []

    console.log("getStdPaperList", maxColor, paper_code)

    paperList = db.db.machine_std_paper_info.filter(paper => {
        const {
            machineSize_type,
            std_paper_min_color,
            std_paper_max_color
        } = paper

        return machineSize_type == item.machine.machine_size.id
        // && maxColor >= std_paper_min_color
        // && maxColor <= std_paper_max_color
    });

    paperList = paperList.filter(({ only_paper_type }) => {
        const paperCondition = only_paper_type?.split(",") || []
        if (paperCondition?.length > 0) {
            return paperCondition.includes(paper_code)
        } else {
            return true
        }
    })

    if (is_default) {
        paperList = paperList.filter(({ is_default }) => is_default)
    }


    console.log("paperList", paperList, is_default, item)
    return paperList
}

function getComponentTypeOption() {
    $('.componentType option').remove()
    const matchType = defaultData.component_type

    const componentTypeOption = matchType.map(({ type, is_default, type_name }) =>
        (`<option value='${type}' >${type_name}</option>`)
    )

    if (componentTypeOption.length) {
        $('.componentType').append(componentTypeOption.join(''))
    } else {
        alert("กรุณาเลือก Component type ใหม่ เนื่องจากประเภทพิมพ์ไม่เหมาะสมกับ Compoent type ที่เลือกไว้")
    }
}

function getCorrugatedLayer(index, component_type) {
    $('.corrugatedInput[index=' + index + '] .layerCorrugated option').remove()
    const layerArr = defaultData.component_type.find(({ type }) => type === component_type)?.corrugated_layer
    let layerOption = [`<option value='' >- Select layer -</option>`]

    if (layerArr.length) {
        layerOption = layerOption.concat(layerArr.map(layer => `<option value='${layer}' >${layer}</option>`))
    }

    if (layerOption.length) {
        $('.corrugatedInput[index=' + index + '] .layerCorrugated').append(layerOption.join(''))
    }
}

function getCorrugatedLayerCustom() {
    $('#corrugated-layer-custom option').remove()
    const layerArr = defaultData.component_type.find(({ type }) => type === 2)?.corrugated_layer
    let layerOption = [`<option value='' >- Select layer -</option>`]

    if (layerArr.length) {
        layerOption = layerOption.concat(layerArr.map(layer => `<option value='${layer}' >${layer}</option>`))
    }

    if (layerOption.length) {
        $('#corrugated-layer-custom').append(layerOption.join(''))
    }
}

function getMachineSizeOption(index, item) {
    $('.cut_size[index=' + index + '] option').remove()
    const machineArr = est.getMachineList(item)

    let layerOption = []


    console.log("machineArr", machineArr)
    if (machineArr.length) {
        layerOption = layerOption.concat(machineArr.map(({ machine_size: { id, name } }) => `<option value='${id}' >${name}</option>`))
    }

    if (layerOption.length) {
        $('.cut_size[index=' + index + ']').append(layerOption.join(''))
    }
}

// function getMachineSize(id) {
//     let size = {
//         max_size: [0, 0, 0, 0],
//         mim_size: [0, 0, 0, 0],
//     }

//     const machine = defaultData.machine.find(obj => obj.machine_size.id === id)

//     if (machine) {
//         size = {
//             max_size: machine.max_size,
//             min_size: machine.min_size,
//         }
//     }
//     return size
// }

function getDeliveryRate(destination_id) {
    return db.db.delivery_rate_info.filter(obj => obj.destination_id === destination_id)
}
function getDeliveryRateInfo(destination_id, weight) {
    const rate_list = db.db.delivery_rate_info.filter(obj => obj.destination_id === destination_id)
    let selected_rate = rate_list.find(obj => weight >= obj.min_weight_kg && weight <= obj.max_weight_kg)
    if (rate_list.length > 1 && !selected_rate) {
        selected_rate = rate_list.reduce((prev, curr) => prev = prev.max_weight_kg < curr.max_weight_kg ? curr : prev, rate_list[0])
    }
    return selected_rate
}

function getPaperCodeType() {
    db.db?.paper_code_type?.forEach((item) => {
        $('#paperCode-custom').append("<option value=" + item.paper_code + ">" + item.paper_type + "</opion>")
    })
}


function getMasterPaperWaste(printType = '', after_ups = 0) {
    let list = []

    switch (printType) {
        case 'Jet Press':
            list = db.db.waste_info?.filter(obj => obj?.print_type == 3)
            break;
        case 'Konica':
            list = db.db.waste_info?.filter(obj => obj?.print_type == 4)
            break;
        case 'Offset':
        case 'Flexo':
        default:
            list = db.db.waste_info?.filter(obj => obj?.print_type == 1)
            break;
    }

    //todo add waste after press to jetpress , konica table
    return list?.find(wasteObj =>
        wasteObj.min_qty <= after_ups &&
        wasteObj.max_qty >= after_ups
    )
}

function getExchangeRateList() {
    return db.db.exchange_rate
}

function getExchangeRateInfo(currency_no = 'THB') {
    return db.db.exchange_rate?.find(obj => obj.currency_no == currency_no)
}