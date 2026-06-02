function getDataRFQ({ rfq_id, type, log_id }) {
    if (rfq_id) {
        return new Promise((resolve) => {
            const job_log = $.ajax({
                url: `${node_api}/estimate/rfq`,
                type: 'POST',
                data: JSON.stringify({ type, rfq_id, log_id }),
                dataType: 'json',
                cache: 'false',
                contentType: "application/json",
                beforeSend: function () { },
                success: function (data) {
                    console.log("getData", JSON.parse(data.job_data))
                },
                error: function () {
                    console.log('get RFQ_log ERROR')
                }
            })
            resolve(job_log)
        })
    }
}

async function setDataRFQ({ rfq_id, type, log_id }) {
    const { is_super_admin = false } = JSON.parse(localStorage.getItem("data"))
    const res = await getDataRFQ({ rfq_id, type, log_id })
    //var finalData = res.job_data.replace(/\\/g,"");
    var finalData = JSON.parse(res.job_data)
    if (finalData?.component1?.length > 0) {
        finalData = convertOldRFQDataToNewVersion(finalData)
    }

    //* UPDATE 13.02.23
    finalData = convertBossingSize(finalData)

    console.log("setDataRFQ", res, finalData)

    if (log_id) {
        var job_log = {
            job_id: res.job_id,
            job_data: finalData,
            created: res.created,
            status_id: finalData?.estimator?.approve_status,
            estimate_check: finalData?.estimator?.estimate_check ? true : false,
            request_for_approve: finalData?.estimator?.approve_status == 1 ? true : false,
            customer_name: res?.customer_name || '',
            customer_no_name: res?.customer_no_name || '',
            estimate_date: res?.estimate_date || '',
            log_id: res?.log_id,
            status_log: [],
            ref_copy_rfq: res?.ref_copy_rfq,
            created_by: res?.created_by,
            updated_by: `${moment(res?.updated, 'YYYY-MM-DD HH:mm')?.format('DD/MM/YYYY HH:mm')} - ${res?.updated_by}`,
            ae_name: res?.ae_name,
            ae_name_eng: res?.ae_name_eng,
        }

    } else {

        var job_log = {
            job_id: res.job_id,
            job_data: finalData,
            created: res.created,
            status_id: res?.status_id,
            estimate_check: res?.estimate_check ? true : false,
            request_for_approve: res?.request_approve_datetime ? true : false,
            customer_name: res?.customer_name || '',
            customer_no_name: res?.customer_no_name || '',
            estimate_date: res?.estimate_date || '',
            log_id: res?.log_id,
            status_log: [],
            ref_copy_rfq: res?.ref_copy_rfq,
            created_by: res?.created_by,
            updated_by: `${moment(res?.updated, 'YYYY-MM-DD HH:mm')?.format('DD/MM/YYYY HH:mm')} - ${res?.updated_by}`,
            ae_name: res?.ae_name,
            ae_name_eng: res?.ae_name_eng,
        }
    }

    job_log = {
        ...job_log,
        open_job_status: res?.open_job_status,
        mi_job_id: res?.mi_job_id
    }

    if (getPathnameAction(1) == 'estimate' && !validateOpenJobDocs(res?.open_job_status, is_super_admin) && !checkIsCopyRFQ()) {
        alert('เอกสารนี้ถูกนำไปเปิด Job. แล้ว, ไม่สามารถแก้ไขได้. \n (Error Code: EJ-001)')
        window.location = '/'
    }

    if (type == 'quote') {
        job_log.customer = {
            address: res.address,
            contact: res.contact,
            tel: res.tel,
            fax: res.fax,
            mobile: res.mobile,
            email: res.email,
            tax_id: res.tax_id,
            credit_term: res.credit_term,
        }
    }

    dat.data_rfq_log = job_log
}

async function getWizardBestMatch(objWizard = {}) {
    return await $.ajax({
        url: `http://192.168.5.25:5678/webhook/fe61420c-ae04-4b5e-b3d3-a5dec1e6db79`,
        type: 'POST',
        data: JSON.stringify(objWizard),
        dataType: 'json',
        cache: 'false',
        contentType: 'application/json',
        beforeSend: function () { },
        success: function (data) {
        },
        error: function () {
            console.log('get RFQ_log ERROR')
        }
    })
}

function getPathnameAction(index) {
    return ((window.location.pathname).split('/'))[index]
}

function parseURLParams(url) {
    var queryStart = url.indexOf("?") + 1,
        queryEnd = url.indexOf("#") + 1 || url.length + 1,
        query = url.slice(queryStart, queryEnd - 1),
        pairs = query.replace(/\+/g, " ").split("&"),
        parms = {}, i, n, v, nv;

    if (query === url || query === "") return;

    for (i = 0; i < pairs.length; i++) {
        nv = pairs[i].split("=", 2);
        n = decodeURIComponent(nv[0]);
        v = decodeURIComponent(nv[1]);

        if (!parms.hasOwnProperty(n)) parms[n] = [];
        parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
}

function getUrlParams(url) {
    return Object.fromEntries(new URL(url)?.searchParams?.entries())
}

function mm2inch(x, d = 2) {
    const num = Math.pow(10, d)
    var check = (x / 25.4 * (num * 10)).toString()
    var last_digit = (check.split('.')[0]).substring((check.split('.')[0]).length - 1)
    if (last_digit == '0') {
        return (Math.round(x / 25.4 * num) / num)
    } else {
        return (Math.ceil(x / 25.4 * num) / num)
    }
}
function inch2mm(x) {
    return x * 25.4
}

function removeDuplicateObj(arr, key) {
    return [...new Map(arr.map(item => [item[key], item])).values()];
}

function removeDuplicate(arr) {
    return [...new Set(arr)]
}

function remove_hash_from_url() {
    var uri = window.location.toString();
    if (uri.indexOf("#") > 0) {
        var clean_uri = uri.substring(0,
            uri.indexOf("#"));
        window.history.replaceState({},
            document.title, clean_uri);
    }
    $("html, body").animate({ scrollTop: 0 }, "slow");
}

function arrayEquals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

function roundToEven(value) {
    return Number.isNaN(value)
        ? 0.0
        : 2 * Math.round(Math.ceil(value) / 2);
}


function roundDecimal(value) {
    return Number.isNaN(value)
        ? 0.0
        : Math.ceil(value * 2) / 2
}

function toNumber(val = 0, decimal = 2) {
    const rawVal = typeof val == 'string' ? val?.split(',').join('') : val
    let value = Number.isNaN(parseFloat(rawVal || 0)) ? 0 : parseFloat(rawVal || 0)

    if (!Number.isFinite(value)) {
        value = 0
    }

    return parseFloat(value.toFixed(decimal))
}

function toFormat(val = 0, format = '0,000') {
    const num = (val + '').split('.')
    const decimal = num[1] || null
    return `${numeral(num[0]).format(format)}${decimal ? `.${decimal}` : ''}`
}

function toDateDBFormat(val, old_format = 'DD/MM/YYYY') {
    const date = moment(val, old_format).format('YYYY-MM-DD')
    return date
}
function toDateInput(val, old_format = 'YYYY-MM-DD') {
    return new Date(moment(val, old_format).toDate())
}

function displayDateInput(selector, date, dateFormat = 'YYYY-MM-DD') {
    const newDate = toDateInput(date, dateFormat)
    $(selector).datepicker("update", newDate)
}

function convertOldRFQDataToNewVersion(data = {}) {
    const mainData = data
    const component = data?.component1 || []
    const check = {
        splitDeliveryVersion: mainData?.delivery?.length > 0 ? true : false,
        multipleFVersion: false
    }

    component?.forEach(comp => {
        check.multipleFVersion = comp?.color?.length > 0 ? true : false
        // * Multiple F
        if (!check.multipleFVersion) {
            comp.color = [{
                ...comp.color,
                f_code: '',
                special_ink: comp?.special_ink?.map(obj => ({ ...obj, f_code: [] })) || []
            }]

            comp.packing = [comp.packing]
            comp.delivery = [comp.delivery]
        }
    })

    if (!check?.splitDeliveryVersion) {
        mainData.delivery = null
    }

    // * Update 21.10.22 - Color Limit v.2
    const checkColorLimit = mainData?.job?.color_limit?.length > 0 ? true : false
    if (!checkColorLimit) {
        // *old version
        const bookQty = mainData?.job?.color_limit || 0
        mainData.job.color_limit = []
        component[0]?.paper_usage?.line?.forEach(obj => {
            mainData.job.color_limit.push({
                is_color_limit: mainData?.job?.is_colorLimit ? true : false,
                qty: bookQty
            })
        })

        delete mainData.job.is_colorLimit
    }

    mainData.component1 = component

    return mainData
}

function convertBossingSize(data = {}) {
    data?.component1?.forEach(comp => {
        comp?.addon?.forEach(addon => {
            if (['emboss', 'deboss'].includes(addon.type)) {


                if (addon.line?.length > 0) {
                    addon.info.size = [[addon.info.width, addon.info.length]]

                    obj = {
                        labor: [],
                        block: []
                    }

                    obj.labor = addon.line.map(line => line.labor)
                    obj.block = [{
                        size: [addon.info.width, addon.info.length],
                        line: addon.line.map(line => line.block)
                    }]

                    addon.line = obj
                }

            }
        })
    })

    return data
}


function setDisplaySelectOption(selector, data = [], keyValue = '', keyName = '', selectFirst = false, blankText = ' - ') {
    let option = blankText == null ? '' : `<option value="">${blankText}</option>`

    if (data?.length > 0) {
        data?.forEach(obj => {
            option += `<option value="${obj[keyValue]}">${obj[keyName]}</option>`
        })
    }

    $(selector).html(option)

    if (!blankText) {
        $(selector).find('option:nth-child(1)').prop('selected', selectFirst ? true : false)
    } else {
        $(selector).find('option:nth-child(2)').prop('selected', selectFirst ? true : false)
    }
}

function toDecimal(number = 0) {
    return Number((number).toPrecision(15))
}

async function convertElementToPNG() {
    const {
        job: {
            is_multiple_f = false
        },
        component1 = []
    } = est.mainData || {}
    const arr = []

    return await new Promise(async (res, rej) => {
        const componentImg = []
        console.log("--- converting in progress ---")
        await component1?.forEach(async (component, cIndex) => {

            console.log("start converting")
            const template = $(`.componentTemplate:eq(${cIndex}) .inputType .template1`)[0]
            const spec = $(`.componentTemplate:eq(${cIndex}) .inputType .spec1 table`)[0]
            const size = $(`.componentTemplate:eq(${cIndex}) .inputType .size1 table`)[0]
            // const packingComponent = $(`.divPacking:eq(${cIndex})`)[0]
            const size_layout = $(`.componentInfo:eq(${cIndex}) .div_size_component`)[0]
            const layout = $(`.componentInfo:eq(${cIndex}) .tbLayout`)[0]
            const num_laying = $(`.componentInfo:eq(${cIndex}) .divEditLayout`)[0]
            const tolerance = $(`.componentInfo:eq(${cIndex}) .divEditTolerance`)[0]

            const paper_usage = $(`.componentInfo:eq(${cIndex}) .componentPaperUsage table`)[0]

            const imgs = await Promise.all([
                getCanvasImg(template),
                getCanvasImg(spec),
                getCanvasImg(size),
                getCanvasImg(size_layout),
                getCanvasImg(layout),
                getCanvasImg(num_laying),
                getCanvasImg(tolerance),
                getCanvasImg(paper_usage),
            ])

            console.log("imgs", imgs)
            componentImg.push(imgs)

            console.log(`-- converting success ${index + 1} -- `)

        })

        console.log("componentImg", componentImg)

        res(componentImg)
    })

}

async function getCanvasImg(element) {

    return await html2canvas(element).then(function (canvas) {
        const image = canvas.toDataURL('image/jpg');
        const img = document.createElement('img');
        img.src = image;
        return image
    }).catch(error => {
        console.log("error", error)

        return ''
    });
}

function snackAlert(text = 'Alert', type = 'none', duration = 3500, action = null) {
    let icon = ''
    switch (type) {
        case 'info':
            icon = `<i class="fa fa-3 fa-info-circle" style="font-size:20px;margin-right:10px;color: #66a1f4;"></i>`
            break;
        case 'warning':
            icon = `<i class="fa fa-3 fa-exclamation-triangle" style="font-size:20px;margin-right:10px;color: #ffa400;"></i>`
            break;
        case 'success':
            icon = `<i class="fa fa-3 fa-check" style="font-size:20px;margin-right:10px;color: #01e001;"></i>`
            break;
        default:
            break;
    }
    // * Ref. https://www.polonel.com/snackbar/
    Snackbar.show({
        icon: icon,
        text: `${text}`,
        pos: 'top-center',
        actionText: action || `<i class="fa fa-times" aria-hidden="true"></i>`,
        actionTextColor: 'red',
        duration,
        customClass: 'snack-alert'
    })
}

function roundCorrugated(number) {
    const stringNumber = number?.toString()

    if (stringNumber[stringNumber?.length - 1] <= 5) {
        return Math.floor(number / 10) * 10
    } else {
        return Math.ceil(number / 10) * 10
    }
}

function setAllInputMask() {

    const dateMask = `.date`
    setInputMask(dateMask, 'date')

    const dateMask2 = `.date-db`
    setInputMask(dateMask2, 'date-db')

    const color = `input.input-color`
    setInputMask(color, 'integer', [1, 0], min = 0, max = 8)

    const integerMask1 = `input.int1`
    setInputMask(integerMask1, 'integer', [1, 0])
    const integerMask2 = `input.int2`
    setInputMask(integerMask2, 'integer', [2, 0])
    const integerMask3 = `input.int3`
    setInputMask(integerMask3, 'integer', [3, 0])
    const integerMask4 = `input.int4`
    setInputMask(integerMask4, 'integer', [4, 0])
    const integerMask5 = `input.int5`
    setInputMask(integerMask5, 'integer', [5, 0])
    const integerMask6 = `input.int6`
    setInputMask(integerMask6, 'integer', [6, 0])
    const integerMask7 = `input.int7`
    setInputMask(integerMask7, 'integer', [7, 0])


    const decimalMask1 = `input.decimal, input.decimal1`
    setInputMask(decimalMask1, 'decimal', [3, 2])
    const decimalMask2 = `input.decimal2`
    setInputMask(decimalMask2, 'decimal', [4, 2])
    const decimalMask3 = `input.decimal3`
    setInputMask(decimalMask3, 'decimal', [6, 4])
    // *---
    const decimalMask33 = `input.decimal33`
    setInputMask(decimalMask33, 'decimal', [3, 3])

    const monenyMask6 = `input.money6`
    setInputMask(monenyMask6, 'decimal', [6, 2])
    const monenyMask7 = `input.money7`
    setInputMask(monenyMask7, 'decimal', [7, 2])
    const monenyMask8 = `input.money8`
    setInputMask(monenyMask8, 'decimal', [8, 2])
    const monenyMask9 = `input.money9`
    setInputMask(monenyMask9, 'decimal', [9, 3])

    const nDecimalMask1 = `input.ndecimal, input.ndecimal1`
    setInputMask(nDecimalMask1, 'ndecimal', [3, 2])
    const nDecimalMask2 = `input.ndecimal2`
    setInputMask(nDecimalMask2, 'ndecimal', [4, 2])
    const nDecimalMask3 = `input.ndecimal3`
    setInputMask(nDecimalMask3, 'ndecimal', [6, 4])

    const textMask = `.text`
    setInputMask(textMask, 'text')
}

function setInputMask(selector, type = 'decimal', digit = [7, 2], min = 0, max = 0) {

    switch (type) {
        case 'date':
            $(selector).not('.masked').datepicker({
                format: "dd/mm/yyyy",
                todayBtn: "linked",
                clearBtn: true,
                autoclose: true,
                todayHighlight: true,
                placeholder: 'dd/mm/yyyy'
            });

            break;
        case 'date-db':
            $(selector).not('.masked').datepicker({
                format: "yyyy-mm-dd",
                todayBtn: "linked",
                clearBtn: true,
                autoclose: true,
                todayHighlight: true,
                placeholder: 'yyyy-mm-dd'
            });

            break;
        case 'integer':
            $(selector).not('.masked').inputmask({
                max: max || toNumber('9'.repeat(digit[0])) + 1,
                min: min,
                alias: 'integer',
                groupSeparator: ',',
                autoGroup: true,
                digits: 0,
                digitsOptional: false,
                placeholder: ''
            })
            break;
        case 'decimal':
            $(selector).not('.masked').inputmask({
                max: max || toNumber('9'.repeat(digit[0])) + 1 - 0.01,
                min: min,
                alias: 'decimal',
                groupSeparator: ',',
                autoGroup: true,
                digits: digit[1],
                digitsOptional: digit[1] > 0 ? true : false,
                placeholder: ''
            })
            break;
        case 'ndecimal':
            $(selector).not('.masked').inputmask({
                max: max || toNumber('9'.repeat(digit[0])) + 1 - 0.01,
                min: min || -1000000000,
                alias: 'decimal',
                groupSeparator: ',',
                autoGroup: true,
                digits: digit[1],
                digitsOptional: digit[1] > 0 ? true : false,
                placeholder: ''
            })
            break;
        case 'text':
            const regexPattern = '[\\w\\dก-๙", :{}()+-/*[\\]&^#@!\\\\$%\n]*';
            $(selector).not('.masked').inputmask({
                regex: regexPattern, // This regex allows a-zA-Z0-9 and ก-๙
                placeholder: '', // Optional: Set a placeholder character
                showMaskOnHover: false, // Optional: Hide the mask on hover
            })
        default:
            break;
    }

    $(selector).addClass('masked')
}