$(function () {
    const data_user = JSON.parse(localStorage.getItem("data"))

    STATUS.setUserRoles({
        request: true,
        approve: data_user?.enable_price_check,
        reject: data_user?.enable_price_check,
        is_super_admin: data_user?.is_super_admin
    })

    STATUS.setCallbackFunction(() => displaySave(true))
    STATUS.setCallbackDocumentApprovedFunction((bool) => setChangeEstimateCheck(bool))
    STATUS.setCallbackDocumentReadonlyFunction((bool) => setIsViewOnly(bool))

    $('.datepicker').datepicker({
        format: "dd/mm/yyyy",
        todayBtn: "linked",
        clearBtn: true,
        autoclose: true,
        todayHighlight: true,
        placeholder: 'dd/mm/yyyy'
    });

    remove_hash_from_url()

    var data = localStorage.getItem("data")
    localStorage.setItem('url', (location.pathname + location.search).substr(1))

    if (data) {
        data = JSON.parse(data)
        if (data.user_group_id.length > 0 && data?.roles) {
            if (data.enable_price_check) {
                $('#is_estimate_checked').prop('disabled', false)
                $('.app_status').show()
                $(".paperCost").prop("readonly", false)
                $(".paperMarkup input").prop("readonly", false)
            } else {
                $('#is_estimate_checked').prop('disabled', true)
                $('.app_status').hide()
                $(".paperCost").prop("readonly", true)
                $(".paperMarkup input").prop("readonly", true)
            }

            localStorage.removeItem("url")
            $.unblockUI();
            showLogin_estimate(data);
            setPage()
            setInput2Default()
        } else {
            alert('เนื่องจากระบบมีการปรับเปลี่ยนสิทธิ์การใช้งาน กรุณา Log-in ใหม่')
            localStorage.removeItem("data")
            window.location = '/'
        }
    } else {

        if (getPathnameAction(1) != 'view') {
            window.location = '/'
        } else {
            setPage()
        }
    }

    (async () => {
        //fetch table form database
        await blockUI()
        await Promise.all([
            fetchMasterData('paper_info&estimate_type=packaging'),
            fetchMasterData('coating_info&estimate_type=packaging'),
            fetchMasterData('corrugated_info&estimate_type=packaging'),
            fetchMasterData('foilstamp_info'),
            fetchMasterData('blockstamp_info'),
            fetchMasterData('price_info'),
            fetchMasterData('min_price_info'),
            fetchMasterData('waste_info'),
            fetchMasterData('blockdiecut_info'),
            fetchMasterData('boxtemplate_info'),
            fetchMasterData('specialink_info'),
            fetchMasterData('specialink_factor_info'),
            fetchMasterData('jetpress_waste_info'),
            fetchMasterData('jetpress_info'),
            fetchMasterData('marking_price_info'),
            fetchMasterData('machine_std_paper_info'),
            fetchMasterData('delivery_rate_info'),
            fetchMasterData('paper_code_type'),
            fetchMasterData('process_type'),
            fetchMasterData('price_type'),
            fetchMasterData('konica_waste_info'),
            fetchMasterData('exchange_rate'),
        ]).then((data) => {
            db.setInfo(data)
        })
        console.log('Load Data Success')

        getListfromDB()
        await getJobID(window.location.href)

        checkRequiredInput()
        $.unblockUI()

        setPage()

        await setShowHistorySection(data_user?.enable_price_check)
        setSuperAdmin(data_user?.is_super_admin)
    })()

    checkUseEstimateWizrd()
    addFocusSupport() //press 'Enter' to go to next input

    // * Wizard -------------------------
    $('#view-wizard').on('click', () => {
        $("#wizardModal").fadeIn();
        $("body").css("overflow", "hidden");
        loadList(); // โหลดข้อมูลเริ่มต้น
        // loadEstimateWizard(44)
    })

    $("#closeModal, #closeBtn").on("click", function () {
        $("body").css("overflow", "");
        $("#wizardModal").fadeOut();
    });

    // Event ค้นหา
    $("#searchInput").on("keyup", function () {
        let val = $(this).val();
        loadList(val);
    });

    // Event คลิกรายการ
    $(document).on("click", ".modal-item", function () {
        let id = $(this).data("id");
        let name = $(this).find("strong").text();
        if (confirm(`คุณต้องการโหลดข้อมูล ${name} ใช่หรือไม่?`)) {
            console.log("Selected ID:", id);
            // คุณสามารถทำงานต่อที่นี่

            window.location = '/estimate?wizard=' + id
        }
    });

    $('#create-wizard').on('click', function () {
        window.location = 'http://localhost:3000/'
    })
    // * Wizard -------------------------

    $('#logout-bttn').on('click', () => {
        if (confirm('Are you sure you want to Logout? All the changes will be lost.')) {
            // localStorage.removeItem("data")
            // window.location = './'

            window.location = '/logout'
        }
    })

    $('#test4').on('click', function () {
        prepareDatatoDB()
    })

    $('#print-bttn').on('click', function () {
        window.print()
    })

    $('body').on('change', ('#job_info'), function () {
        displaySave(true)
    })

    $('body').on('click', ('#home-bttn'), function () {
        if (getPathnameAction(1) == 'view') {
            window.location = './'
        } else {
            if (confirm('Are you sure you want to exit? All the changes will be lost.')) {
                window.location = './'
            }
        }

    })

    $('body').on('click', ('.child-menu'), function () {
        var id_bttn = $(this).attr('id')
        switch (id_bttn) {
            case 'job-info-bttn':
                window.location = window.location.href.split("#")[0] + '#jobInfo'
                break
            case 'spec-info-bttn':
                window.location = window.location.href.split("#")[0] + '#job_detail'
                break
            case 'layout-bttn':
                window.location = window.location.href.split("#")[0] + '#Layout'
                break
            case 'summary-bttn':
                window.location = window.location.href.split("#")[0] + '#Summary'
                break
        }
    })


    $('body').on(('change'), ('.required'), function () {
        checkRequiredInput()
    })

    $('body').on('mouseover', ('#excel-bttn'), function () {
        $('#excel-bttn button').css("background-color", "#dfe3ee")
    })

    $('body').on('mouseleave', ('#excel-bttn'), function () {
        $('#excel-bttn button').css("background-color", "#95b8e3")
    })

    $('body').on('click', ('#save-bttn'), async function () {
        storeJob()

        if (!est.mainData?.totalprice?.length) {
            if (!storeDeliveryData()) {
                return false
            }

            if (!storeDataBeforeCalcPrice()) {
                return false
            }
        } else {
            if (!$('#summary').is(':visible')) {
                est.mainData.totalprice = null
            }
        }

        if (!validateRejectRemark()) {
            return false
        }

        if (checkValidateDataBeforeSave()) {
            storeDataBeforeSave()

            prepareDatatoDB()
            console.log("est.mainData", est.mainData)
            console.log(dat.data_DB)

            if (CheckValidateRFQInfo()) {
                if ((await confirmBeforeSave())) {
                    save_data()
                }
            }
        }
    })

    $('body').on('click', ('#ref_copy_rfq.active'), function () {
        const refRFQ = $('#ref_copy_rfq').html()?.trim() || null

        if (!refRFQ) {
            return
        }

        const link = '/view?jobid=' + refRFQ

        window.open(link, '_blank')
    })

    $('body').on('change', ('#jobName input'), function () {
        storeJob()
        $('#summaryExcel .jobid_td').text(est.mainData.job.job_id)
        $('#summaryExcel .jobname_td').text(est.mainData.job.job_name)
    })

    $('body').on('keyup', ('#customerLabel'), function (event) {
        autocomplete_customer(this, setCustomerCreditTermInfo)
    })

    $('body').on('keyup', ('#customerLabel'), function () {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode != 13) {
            $('#custID').val("")
            $('#custName').val("")
        }
    })

    $('body').on('blur', ('#customerLabel'), function () {
        if ($('#custID').val() == "") {
            $('#custName,#customerLabel').val("")
            setCustomerCreditTermInfo(null)
            displaySnackbar('#snackbar-customer')
        }
        checkRequiredInput()
        storeCustomerName()
        $('#summaryExcel .customer_td').text(est.mainData.customer.customer_id + ': ' + est.mainData.customer.customer_name)

        setUpdatePaperMarking() //* add 7%
        setPaperMarkingPrice()
        setUItoRecalcLayout()

        $('.component').each((index, ele) => {
            showRecalcPaperUsage(index)
        })

        checkRequiredInput()
    })

    $('body').on('change', ('#is_newCustomer'), function () {
        if ($(this).prop('checked')) {
            $('#customerLabel').val('C9999998: ลูกค้าใหม่')
            $('#customerLabel').prop('readonly', true)
            $('#custID').val('C9999998')
            $('#custName').val('ลูกค้าใหม่')
            setCustomerCreditTermInfo({ credit_term_id: 'QT000002', credit_term_name: 'มัดจำ 100% ก่อนพิมพ์' })
        } else {
            $('#customerLabel').val('')
            $('#custID,#custName').val("")
            $('#customerLabel').prop('readonly', false)
            setCustomerCreditTermInfo(null)
        }
        storeCustomerName()

        setUpdatePaperMarking() //* add 7%
        setPaperMarkingPrice()
        setUItoRecalcLayout()

        $('.component').each((index, ele) => {
            showRecalcPaperUsage(index)
        })

        checkRequiredInput()
    })

    $('body').on('keyup', ('#aeLabel'), function () {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode != 13) {
            $('#aeID').val("")
            $('#aeName').val("")
        }
    })

    $('body').on('blur', ('#aeLabel'), function () {
        if ($('#aeID').val() == "") {
            $('#aeName,#aeLabel').val("")
            displaySnackbar('#snackbar-ae')
        }

        checkRequiredInput()
        storeAEName()
        $('#summaryExcel .ae_td').text(est.mainData.ae.ae_id + ': ' + est.mainData.ae.ae_name)
    })

    $('body').on('change', ('.has_speInk'), function () {
        const compIndex = $(this).closest('.component').attr('index')
        const fIndex = $(this).data('f_index')
        const is_hasSpeInk = $(this).prop('checked') || false

        setEnableComponentSpecialInk(compIndex, fIndex, is_hasSpeInk)

        if (is_hasSpeInk) {
            addSpecialInk(compIndex, null, fIndex)
        }
    })

    $('body').on('click', ('.inputPacking input'), function () {
        //event on checkbox packing to show detail input
        var arrPacking = []
        $('.inputPacking input').each(function () {
            arrPacking.push($(this).prop('checked'))
        })
        var check = arrPacking.reduce((t, v) => {
            return t + v
        })
        if (check == 0) {
            $('#InputPacking').hide()
        } else { $('#InputPacking').show() }
    })

    $('body').on('change', ('.boxType'), function () {
        console.log("change box type")
        var index = $(this).attr('index')
        var box_type = $(this).val()
        var componentType = getComponentType(index)
        displayBoxTemplate(box_type, index)
        setDisplayForKonica()
        getComponentSize(index)
        setInputDimensionField(box_type, index)  //to show only needed dimension
        $('body input[readonly]').attr('tabindex', -1)
        scrollToSection('.componentTemplate[index=' + index + ']')
        setfluteAlign(index, componentType)
        checkRequiredInput()
    })

    $('body').on('change', ('.is_assembled'), function () {
        const index = $(this).parent().parent().parent().parent().parent().parent().parent().attr('index')
        var glued_spot = getDefaultGluedSpot(getBoxTemplate(index))
        if ($(this).prop('checked')) {
            if (glued_spot == 0) {
                var glued_spot = 1
            }
            $('.componentTemplate[index=' + index + '] .td-glued-spot').show()
            $('.componentTemplate[index=' + index + '] .glued_spot').val(glued_spot)
        } else {
            $('.componentTemplate[index=' + index + '] .td-glued-spot').hide()
            $('.componentTemplate[index=' + index + '] .glued_spot').val('')
        }
        checkRequiredInput()
    })

    // Function Calculate Layout
    $('body').on('click', ('#calc_layout'), function () {
        const num_component = $('.component').length
        if (checkValidateAll()) {
            storeAllData()
            create_tbComponent()

            for (var index = 0; index < num_component; index++) {
                if ($('.componentTemplate[index=' + index + '] .is_manualLayout').prop('checked')) {
                    est.setManualLayout(index, true)
                    est.setLayout4Manual(index)
                    est.setDefaultPacking(index)
                    est.setCalculateUps(index)
                    divLayout(index)
                    divComponentName(index)

                    hilightText('manual_layout', true, index)
                    editLayout(index)
                    prepareDivManualLayout(index)
                    tbPaperUsage(index)
                    getPaperUsageTable(index)
                    rowPaperUsage(index)
                    $('.alertLaysize_div[index=' + index + '], .alertNumLay[index=' + index + ']').remove()

                } else {

                    if (est.setCalculateLayout(index) == false) {
                        checkLaying(index)
                        alert('ไม่สามารถวางเลย์ได้ เนื่องจาก open size มีขนาดใหญ่กว่าไซส์กระดาษ / max machine size')
                        return
                    }
                    est.setDefaultPacking(index)
                    est.setCalculateUps(index)
                    tbComponent(index)
                }
            }

            scrollToSection('#Layout')
            $('#layout-bttn, #calc_price').show()
            $('#calc_layout').hide()
            checkRequiredInput()
        }

        displaySave(true)
    })

    $('body').on('click', ('.recalc_layout_bttn'), function () {
        var index = $(this).attr('index')
        if (checkValidateAll()) {
            storeAllData(true)
            setCalculateLayout(index, false)
            setDisplayForJetPress()
        }

        checkRequiredInput();
        console.log("click calc. layout")
        displaySave(true)
    })

    $('body').on('click', ('#calc_price'), function () {
        if (!checkValidateLayout()) return false
        if (!checkPaperSize()) return false
        if (!checkValidateComponentInput()) return false
        if (!storeDeliveryData()) return false
        if (!checkValidateCustomPrice()) return false
        if (!storeDataBeforeCalcPrice()) return false
        if (!checkCutSize()) return false

        setCalculatePrice()

        summary(false)
        setDefaultDivPacking(false)

        summary_excel(false)
        exportExcel()

        $('#calc_price, #calc_price_after_change').hide()
        $('#calc_price_after_packing, #excel-bttn, #summary-bttn').show()
        scrollToSection('#Summary')

        displaySave(true)
        console.log(est.mainData)
    })

    $('body').on('click', ('#calc_price_after_change'), function () {
        est.mainData.job.is_different_packing = false

        const isDiffPacking = getIsDifferentPacking()
        if (!checkValidateLayout()) return false
        if (!checkPaperSize()) return false

        console.log("isDiffPacking", isDiffPacking)
        $('.component').each((index, ele) => {
            est.setDefaultPacking(index, isDiffPacking)
            // setCalculatePackingCost(index)
        })
        if (!storeDeliveryData()) return false
        if (!checkValidateCustomPrice()) return false
        if (!storeDataBeforeCalcPrice()) return false
        if (!checkCutSize()) return false

        setCalculatePrice()

        summary(true)
        setDivPacking(isDiffPacking)
        displayPacking(est.mainData)

        $('#calc_price_after_change').hide()
        summary_excel(true)
        exportExcel()
        $('#calc_price_after_packing,#excel-bttn,#summary-bttn').show()
        scrollToSection('#Summary')

        displaySave(true)
        console.log(est.mainData)
    })

    $('body').on('click', ('#calc_price_after_packing'), function () {
        if (!checkValidatePackingCheckbox()) {
            return false
        }
        if (!checkValidatePaperbandPacking()) {
            return false
        }
        if (!checkCartonInnerSizeBeforeCalcPrice()) {
            return false
        }
        if (!checkValidateCustomPrice()) {
            return false
        }
        if (storeDeliveryData()) {
            if ($('#tax input').val() != "") {
                storeTax()
                storeExchangeRate()
                storePriceDifference()
                storeCustomerGift()

                let arrObjMarking = []
                $('.component').each(function (index) {
                    const isDiffPacking = getIsDifferentPacking()
                    const packingLength = isDiffPacking ? $('.f_table')?.length || 1 : 1

                    for (let fIndex = 0; fIndex < packingLength; fIndex++) {
                        storePacking(index, fIndex)
                        // est.setInnerSizeCarton(index, inner, fIndex)
                        // est.mainData.component1.forEach(item => est.setCalculateDelivery(item, fIndex))
                    }
                    setCalculatePackingCost(index, true)
                })

                $('.inputQty').each((index) => {
                    arrObjMarking.push({
                        mark_up_percent: parseFloat($(`.MarkUp[index=${index}] input`).val() || 0),
                        mark_down_percent: parseFloat($(`.MarkDown[index=${index}] input`).val() || 0),
                        marking_material_percent: parseFloat($(`.MarkingPercentMaterial[index=${index}] input`).val() || 0),
                        marking_production_percent: parseFloat($(`.MarkingPercentProduction[index=${index}] input`).val() || 0),
                    })
                })
                //* Update 27.05.22
                console.log("#calc_price_after_packing", arrObjMarking)
                est.setCalculateDeliveryPrice()
                est.setCalculateTotalPrice(arrObjMarking)
                getMarkDownSection()
                setMarkDownQtySection(true)
                summary_after_packing()
                summary_excel(false)
                exportExcel()

                displaySave(true)
                console.log(est.mainData)
            } else {
                alert('กรุณากรอก % Tax')
                $('#tax input').focus()
                return
            }
        }
    })


    $('body').on('change', ('#packing input, #packing select'), function () {
        $('#calc_price_after_packing').show()
        displaySave(false)
    })

    $('body').on('click', ('#packing button'), function () {
        $('#calc_price_after_packing').show()
        displaySave(false)
    })

    //! NEW vvvvvv
    //change addon in each component => re-calc paper usage table
    $('body').on('change', ('#inputInfo select:not(#status_id),#inputInfo input:not(#job_info input,#file_upload_table input)'), function () {
        setUItoRecalcLayout()
    })

    $('body').on('click', ('#inputInfo button,.addProcess:not(.disabled),.deleteProcess,.speInk-btn'), function () {
        setUItoRecalcLayout()
    })

    $('body').on('change', (`
        #material input,#otherCost input,#other input,#handwork input,#custom input ,.nameComp,#job_detail select:not(#print_type select),#job_detail input,.paperInput select,
        .paperInput input,.paperInput textarea,.corrugatedInput select,.add-addon select,.paperMarkup input,.is_assembled,.glued_spot,.has_speInk,.speInk-input,
        #is_use_previous_plate, .price_difference_tr input, .customer_gift_tr input,
        #delivery input, #delivery select, #delivery
        `
    ), function () {
        if (checkComponentInfo()) {
            showCalcBttnPrice()
        }
    })

    $('body').on('click', ('.addProcess:not(.disabled),.deleteProcess,.speInk-btn,.chk_price_difference, .chk_customer_gift'), function () {
        if (checkComponentInfo()) {
            showCalcBttnPrice()
        }
    })

    $('body').on('change', ('.addonInput select,.addonInput input'), function () {
        const compIndex = $(this).closest('div.addonInput').attr('index')
        showRecalcPaperUsage(compIndex)
    })

    $('body').on('click', ('.add-addon-bttn,.add-addon-size'), function (e) {
        const compIndex = $(this).closest('div.component').attr('index')
        setUItoRecalcLayout()
        showRecalcPaperUsage(compIndex)
    })

    $('body').on('click', ('.add-addon-size'), function () {
        const compIndex = $(this).closest('div.component').attr('index')
        const className = $(this).closest('div.addonInput').attr('class').split(" ")[0]
        const processIndex = $(this).closest('div.addonInput').attr('process-index')
        addAddonSize(className, compIndex, processIndex)
        checkRequiredInput()
    })
    $('body').on('click', ('.delete-addon-size'), function () {
        const compIndex = $(this).closest('div.addonInput').attr('index')
        const tbEle = $(this).closest('table')
        const prevIndex = $(this).closest('tr').index() - 1
        $(this).closest('tr').remove()

        if (prevIndex > 0) {
            $(tbEle).find(`tr:eq(${prevIndex}) td:last`).append('<div class="delete-addon-size">ลบ</div>')
        }
        setUItoRecalcLayout()
        showRecalcPaperUsage(compIndex)
    })

    $('body').on('click', ('.recalc-paperusage-bttn'), function () {
        const index = $(this).parent().parent().attr('index')
        if (!checkValidateLayoutAlert(index)) return false
        if (!checkValidatePaper(index)) return false
        if (!checkValidateSpecialInkCustomPaper(index)) return false
        // if (!checkCustomCorrugatedSize(index)) return false
        if (!checkValidateMultipleF()) return false
        if (checkValidateColorLimit()) {
            est.setColorLimit()

            recalcPaperUsageTable(index)
            showCalcBttnPrice()
            scrollToSection('.componentInfo[index=' + index + ']')
        }

        displaySave(true)
    })
    //change color inside,outside in each component => re-calc paper usage table
    $('body').on('change', ('.colorOutside,.colorInside'), function () {
        const index = $(this).parent().parent().parent().parent().parent().attr('index')
        const max = parseInt($(this).attr('max') || 0)
        const print_type = getPrintType()
        const ink_type = getInkType()
        const color = parseInt($(this).val())

        if (print_type == 'Flexo') {
            if (color > 2) {
                alert('Flexo Printing สามารถใส่จำนวนสีได้ไม่เกิน 2 สีต่อด้านพิมพ์')
                $(this).val("")
                $(this).focus()
            }
        }

        if (color > 6 && print_type == 'Offset' && ink_type == 'UV') {
            alert('ประเภทหมึก UV สามารถใส่จำนวนสีได้ไม่เกิน 6 สีต่อด้านพิมพ์')
            $(this).val("")
            $(this).focus()
        }

        if (max && color > max) {
            snackAlert(`ไม่สามารถระบุจำนวนสี เกิน ${max} ได้`)
            $(this).val("")
            $(this).focus()
        }

        if (print_type == 'Offset' && $(`.componentInfo[index=${index}]`)?.length) {
            // * วางเลย์ใหม่
            const item = est.mainData.component1[index] || null

            if (!item) {
                return false
            }

            const colorList = getComponentColor(index)

            item.color = colorList

            const machineList = est.getMachineList(item)

            getMachineSizeOption(index, item)

            if (!machineList?.some(obj => obj?.machine_size?.id == item?.machine?.machine_size?.id)) {
                // * วางเลย์ใหม่
                if (checkComponentInfo()) {
                    recalcLayoutEachComponent(index)
                    showCalcBttnPrice()
                }
            }
        }

        showRecalcPaperUsage(index)
        checkRequiredInput()
    })

    $('body').on('change', ('.is_black_printing'), function () {
        const is_black_printing = $(this).prop('checked') || false
        const compIndex = $(this).closest('.component').attr('index')
        const colIndex = $(this).closest('.specialInk-container').index()
        const side = $(this).data('color_side') || ''

        setPaperBlackPrinting(compIndex, colIndex, is_black_printing, side)
        checkRequiredInput()

    })

    //change dimension/component type/box template in each component => re-calc layout 
    $('body').on('change', ('.inputType input:not(.is_assembled,.glued_spot),.inputType select,.boxType,.componentType'), function () {
        var class_name = $(this).attr('class')
        if (class_name.search('componentType') != -1) {
            var index = $(this).parent().parent().parent().parent().parent().parent().attr('index')
        } else if (class_name.search('boxType') != -1) {
            var index = $(this).parent().attr('index')
        } else if (class_name.search('specmm') != 1 || class_name.search('specin') != 1) {
            var index = $(this).parent().parent().parent().parent().parent().parent().parent().attr('index')
        } else {
            var index = $(this).parent().parent().parent().parent().parent().parent().parent().attr('index')
        }
        if (checkComponentInfo()) {
            recalcLayoutEachComponent(index)
            showCalcBttnPrice()
        }
    })


    $('body').on('change', ('#print_type select'), function () {
        var printType = $(this).val()
        setChangePrintType(printType)
    })


    $('body').on('change', ('#ink_type select'), function () {
        const inkType = $(this).val()
        const print_type = getPrintType()

        $('.colorOutside,.colorInside').each((index, ele) => {
            const color = parseInt($(ele).val() || 0)
            if (print_type == 'Offset') {
                if (inkType == 'UV' && color > 6) {
                    alert('ประเภทหมึก UV สามารถระบุจำนวนสีได้ไม่เกิน 6 สี/ด้านพิมพ์')
                    $(ele).val('')
                    $(ele).focus()
                    return false;
                }
            }
        })

        setSpecialInkTypeForUV(inkType)

        $('.component').each((index) => {
            recalcLayoutEachComponent(index)
        })

        if (checkComponentInfo()) {
            showCalcBttnPrice()
        }

        checkRequiredInput()
    })

    $('body').on('change', ('#is_reprinted select'), function () {
        const is_reprinted = toNumber($(this).val() || 0, 0)

        setIsReprint(is_reprinted)

        if (checkComponentInfo()) {
            showCalcBttnPrice()
        }

        checkRequiredInput()
    })

    $('body').on('click', ('.display-layout-bttn'), function () {
        const index = $(this).parent().attr('index')
        const is_manualLayout = $('.componentTemplate[index=' + index + '] .is_manualLayout').prop('checked')
        if (checkValidateAll()) {
            if (changeDimensionEvent(index)) {
                // $('.componentTemplate[index=' + index + '] .is_manualLayout').prop('disabled', true)
                $('.recalc-layout[index=' + index + ']').removeClass('show-bttn')
                divComponentName(index)
                if (is_manualLayout) {
                    $('.manualLayout[index=' + index + ']').prop('checked', true)
                    hilightText('manual_layout', true, index)
                    editLayout(index)
                    prepareDivManualLayout(index)
                } else {
                    divComponentSize(index)
                    imgLayout(index)
                    checkLaysize(index)
                    editLayout(index)
                    checkDivPaperUsage(index)
                    storePaperSize(index)
                }
                getPaperUsageTable(index)
                rowPaperUsage(index)
                showCalcBttnPrice()
                scrollToSection('.componentInfo[index=' + index + ']')
            }
        } else {
            return
        }
        checkRequiredInput()
    })

    //change qty, runon, ae qty, customer qty || click add qty, delete qty
    $('body').on('click', ('#addQty,#removeQty'), function () {
        // changeQtyEvent()
        resetDelivery()
    })
    $('body').on('change', ('#qtyInput input'), function () {
        changeQtyEvent()
        resetDelivery()
    })
    //! NEW ^^^^^^^

    $('body').on('change', ('#delivery input'), function (e) {
        if (checkComponentInfo()) {
            setUItoRecalcProc()
        }
    })

    $('body').on('change', ('#delivery select'), function (e) {
        if (checkComponentInfo()) {
            setUItoRecalcProc()
        }
    })

    $('body').on('change', ('#tbComponent input,#tbComponent select'), function () {
        if (checkComponentInfo()) {
            setUItoRecalcProc()
        }
    })

    $('body').on('click', ('#tbComponent .recalc_layout_bttn'), function () {
        if (checkComponentInfo()) {
            setUItoRecalcProc()
        }
    })

    $('body').on('blur', ('.inputQty input'), function () {
        const isMultipleF = getIsMultipleF()
        const qty = numeral($(this).val()).value()
        if (isMultipleF) {
            var idSelector = '#multiple_f_qty_info'
            var index = $(this).closest('table').index()
            var runon = parseFloat($(`${idSelector} .runonPercent:eq(${index})`).val() || 0) / 100

        } else {
            var idSelector = '#qty_info'
            var index = $(this).index('.inputQty input')
            var runon = parseFloat($(`${idSelector} .runonPercent:eq(0)`).val() || 0) / 100

        }
        $(`${idSelector} .runonQty:eq(${index}) input`).val(parseFloat((qty * runon).toFixed(2)))

        isMultipleF && recalcTotalFQty()
    })

    $('#multiple_f_qty_info').on('blur', ('.runonPercent,.runonQty input, .aeQty input, .customerQty input'), function () {
        recalcTotalFQty()
    })

    $('body').on('keyup', ('.runonPercent'), function () {
        const runon = parseFloat($(this).val()) / 100
        const isMultipleF = getIsMultipleF()
        if (isMultipleF) {
            const qty = numeral($(this).closest('table').find('.inputQty input').val()).value()

            $(this).closest('table').find('.runonQty input').val(qty * runon)
        } else {
            const idSelector = '#qty_info'

            $(`${idSelector} .runonQty input`).each(function (index) {
                const qty = numeral($(`${idSelector} .inputQty input:eq(${index})`).val()).value()
                const runonQty = qty * runon
                $(`${idSelector} .runonQty:eq(${index}) input`).val(runonQty)
            })
        }
    })


    $('body').on('change', ('.specmm'), function () {
        var index = $(this).parent().parent().parent().parent().parent().parent().parent().attr('index')
        var specin = []
        const component = '.component[index=' + index + ']'
        $('.inputType[index=' + index + '] .specmm').each(function () {

            specin.push(mm2inch(parseFloat($(this).val())))
        })
        $('.inputType[index=' + index + '] .specin').each(function (index1) {
            $(this).val(specin[index1])
        })
        if (getBoxTemplate(index) == 12) {
            if ($(this).attr('class').search('width') != -1) {
                $(component + ' .openSizemm input:eq(0)').val($(component + ' .specmm.width').val())
                $(component + ' .openSizein input:eq(0)').val(mm2inch(parseFloat($(component + ' .specmm.width').val())))
            }
            if ($(this).attr('class').search('length') != -1) {
                $(component + ' .openSizemm input:eq(1)').val($(component + ' .specmm.length').val())
                $(component + ' .openSizein input:eq(1)').val(mm2inch(parseFloat($(component + ' .specmm.length').val())))
            }
            setSize4Template12(index)
        }
        getComponentSize(index)
        checkRequiredInput()
    })

    $('body').on('change', ('.specin'), function () {
        var index = $(this).parent().parent().parent().parent().parent().parent().parent().attr('index')
        var specmm = []
        const component = '.component[index=' + index + ']'
        $('.inputType[index=' + index + '] .specin').each(function () {
            specmm.push(Math.round((parseFloat($(this).val()) * 25.4)))
        })

        $('.inputType[index=' + index + '] .specmm').each(function (index1) {
            $(this).val(specmm[index1])
        })
        if (getBoxTemplate(index) == 12) {
            if ($(this).attr('class').search('widthin') != -1) {
                $(component + ' .openSizemm input:eq(0)').val(Math.round((parseFloat($(component + ' .specin.widthin').val() * 25.4))))
                $(component + ' .openSizein input:eq(0)').val($(component + ' .specin.widthin').val())
            }
            if ($(this).attr('class').search('lengthin') != -1) {
                $(component + ' .openSizemm input:eq(1)').val(Math.round((parseFloat($(component + ' .specin.lengthin').val() * 25.4))))
                $(component + ' .openSizein input:eq(1)').val($(component + ' .specin.lengthin').val())
            }
            setSize4Template12(index)
        }
        getComponentSize(index)
        checkRequiredInput()
        console.log("change spec")
    })

    $('body').on('change', ('.openSizemm input'), function () {
        const index = $(this).parent().parent().parent().parent().parent().parent().parent().attr('index')
        const componentType = getComponentType(index)
        if (getBoxTemplate(index) == 12) {
            setSize4Template12(index)
            setfluteAlign(index, componentType)
            checkRequiredInput()
        }

    })

    $('body').on('change', ('.openSizein input'), function () {
        const index = $(this).parent().parent().parent().parent().parent().parent().parent().attr('index')
        const componentType = getComponentType(index)
        if (getBoxTemplate(index) == 12) {
            setSize4Template12(index)
            setfluteAlign(index, componentType)
            checkRequiredInput()
        }
    })


    $('body').on('change', ('.packingsizemm input'), function () {
        var index = $(this).parent().attr('index')
        var packinginch = []
        $('.packingsizemm[index=' + index + '] input').each(function () {
            packinginch.push(mm2inch(parseFloat($(this).val())))
        })
        $('.packingsizeinch[index=' + index + '] input').each(function (index1) {
            $(this).val(packinginch[index1])
        })
        //getComponentSize(index)
        checkRequiredInput()
    })

    $('body').on('change', ('.packingsizeinch input'), function () {
        var index = $(this).parent().attr('index')
        var packingmm = []
        $('.packingsizeinch[index=' + index + '] input').each(function () {
            packingmm.push(parseFloat((parseFloat($(this).val()) * 25.4).toFixed(2)))
        })
        $('.packingsizemm[index=' + index + '] input').each(function (index1) {
            $(this).val(packingmm[index1])
        })
        //getComponentSize(index)
        checkRequiredInput()
    })

    $('body').on('change', ('.glued_spot'), function () {
        var index = $(this).parent().parent().parent().parent().parent().parent().parent().attr('index')
        var glued_spot = parseInt($('.inputType[index=' + index + '] .glued_spot').val())
        var glued_spot_arr = [1, 2, 3, 4]
        if (glued_spot_arr.includes(glued_spot) == false) {
            alert('จำนวนจุดติดกาวสูงสุด ไม่เกิน 4 จุด')
            $('.inputType[index=' + index + '] .glued_spot').val(1)
        }
    })

    $('body').on('click', ('#addQty'), function () {
        const { validate, limit } = checkLimitAddQtyNumber()
        if (!validate) {
            snackAlert(`ไม่สามารถเพิ่มยอดงานมากกว่า ${limit} ยอดได้`)
            return false
        }

        addQty()
        setDefaultElement()
        setChangeNumberOfPriceDiffInputQty()
        setChangeNumberOfCustomerGiftInputQty()
        $('.component').each((index, ele) => {
            showRecalcPaperUsage(index)
        })
        checkRequiredInput()
    })

    $('body').on('click', ('#removeQty'), function () {
        const qtySelector = `#qty_info`
        if ($(`${qtySelector} .inputQty`).parent().length > 1) {
            $(`${qtySelector} .inputQty:last`).parent().remove()
            $(`${qtySelector} .runonQty:last`).parent().remove()
            tdNumMaterial('delete')
        }
        setChangeNumberOfPriceDiffInputQty()
        setChangeNumberOfCustomerGiftInputQty()

        $('.component').each((index, ele) => {
            // showRecalcPaperUsage(index)
            showRecalcPaperUsage(index)
        })
    })

    $('body').on('click', ('#addComp'), function () {
        const index = $('.component').length;
        addDivComponentInfo(index)
        addComponent(index)
        resetDelivery()
        checkRequiredInput()
        $(`.paperInput[index=${index}] .paperCost`).prop("readonly", !data.enable_price_check)
        $(`.paperInput[index=${index}] .paperMarkup input`).prop("readonly", !data.enable_price_check)

        if (checkComponentInfo()) {
            showCalcBttnPrice()
        }
    })

    $('body').on('click', ('#removeComp'), function () {
        const num_comp_ui = $('.component').length
        const num_comp_est = est.mainData.component1 == null ? 0 : est.mainData.component1.length
        if ($('.component').length > 1) {
            est.setCheckDeliveryQtyAddComp("remove")
            resetDelivery()
            $('.component:last').remove()
            $('.componentInfo:last').remove()
            if (num_comp_ui <= num_comp_est) {
                est.mainData.component1.pop()
            }
        }

        if (checkComponentInfo()) {
            showCalcBttnPrice()
        }
    })

    $('body').on('click', ('.deleteComponent'), function () {
        const index = $(this).closest('.component').attr('index') || null

        if ($('.component').length <= 1) {
            alert('ไม่สามารถลบได้. ต้องมีอย่างน้อย 1 Component')
            return
        }

        const isConfirm = confirm('คุณต้องการลบ Component นี้ใช่หรือไม่ ?');

        if (!isConfirm) {
            return
        }

        est.setCheckDeliveryQtyAddComp("remove")
        resetDelivery()

        // $('.component:last').remove()
        // $('.componentInfo:last').remove()
        // if (num_comp_ui <= num_comp_est) {
        //     est.mainData.component1.pop()
        // }

        setRemoveComponents(index)

        // if (checkComponentInfo()) {
        //     showCalcBttnPrice()
        // }

        if (checkComponentInfo()) {
            setUItoRecalcProc()
        }
    })

    $('body').on('click', ('.paperType-custom,.paperGram-custom'), function () {
        const index = $(this).parent().parent().parent().parent().parent().attr('index')
        const process_index = 0
        storeSelector(index, process_index)
        managePopup('open', 'paper', index, process_index)
    })

    $('body').on('click', ('.custom-paper'), function () {
        const index = $(this).parent().parent().parent().parent().parent().attr('index')
        const process_index = 0
        const paper_class = '.paperInput[index=' + index + ']'
        const { enable_price_check } = JSON.parse(localStorage.getItem("data"));

        if ($(this).attr('custom') == 0) {

            storeSelector(index, process_index)
            managePopup('open', 'paper', index, process_index)
        } else {
            $(this).attr('custom', 0)
            setDefaultPaper(index)
            $(paper_class + ' .paperCost').prop("readonly", !enable_price_check)
        }
        setUItoRecalcLayout()
        if (checkComponentInfo()) {
            showCalcBttnPrice()
        }
        checkRequiredInput()
    })

    $('body').on('click', ('.custom-foil'), function () {
        const index = $(this).parent().parent().parent().parent().attr('index')
        const process_index = $(this).parent().parent().parent().parent().attr('process-index')
        if ($(this).attr('custom') == 0) {
            storeSelector(index, process_index)
            managePopup('open', 'foilstamp', index, process_index)
        } else {
            console.log("remove custom")
            $(this).attr('custom', 0)
            setDefualtfoilstampCustom(index, process_index)
        }

        setUItoRecalcLayout()
        showRecalcPaperUsage(index)
        // if(checkComponentInfo()){
        //         $('.componentPaperUsage[index='+index+'] .recalc-paperusage').addClass('show-bttn')
        //         $('.componentPaperUsage[index='+index+'] table').hide()
        //         showCalcBttnPrice()
        // }
        checkRequiredInput()
    })

    $('body').on('click', ('.foilColor-custom,.foilCode-custom'), function () {
        const index = $(this).parent().parent().parent().parent().parent().attr('index')
        const process_index = $(this).parent().parent().parent().parent().parent().attr('process-index')
        storeSelector(index, process_index)
        managePopup('open', 'foilstamp', index, process_index)
    })

    $('body').on('click', ('#foil-custom-cancel'), function () {
        cancelCustomFoilstamp()
        setUItoRecalcLayout()
        showRecalcPaperUsage(index)
    })

    $('body').on('click', ('#paper-custom-cancel'), function () {
        const index = $('#index').val()

        cancelCustomPaper()
        setChangeComponentPaper(index)
        setUItoRecalcLayout()
        showRecalcPaperUsage(index)
        checkRequiredInput()
    })

    $('body').on('click', ('#foil-custom-save'), function () {
        const index = $('#index').val()
        if (checkValidateCustomFoilstamp()) {
            saveCustomFoilstamp()
            setUItoRecalcLayout()
            showRecalcPaperUsage(index)
        }
    })

    $('body').on('click', ('#paper-custom-save'), function () {
        const index = $('#index').val()

        if (checkValidateCustomPaper()) {
            saveCustomPaper()

            const main_comp = '.component[index=' + index + ']';
            $(main_comp + ' .paperCost').prop("readonly", false)

            // setUItoRecalcLayout()
            // if (checkComponentInfo()) {
            //     showCalcBttnPrice()
            // }
        }

        setChangeComponentPaper(index)
        setUItoRecalcLayout()
        showRecalcPaperUsage(index)
        checkRequiredInput()
    })


    $('body').on('click', ('.add-addon-bttn'), function () {
        const index = $(this).parent().parent().parent().parent().parent().attr('index')
        var process = $('.add-addon[index=' + index + '] select').val()
        if (process != "") {
            addAddon(index, process)
        }
        $('.add-addon[index=' + index + '] select').val("")
        checkRequiredInput()
    })

    $('body').on('click', ('.deleteAddon'), function () {
        const compIndex = $(this).closest('div.addonInput').attr('index')
        const processIndex = $(this).closest('div.addonInput').attr('process-index')
        const className = $(this).closest('div.addonInput').attr('class')?.split(" ")[0]

        $(this).closest('div.addonInput').remove()

        if (['coatingInput'].includes(className)) {
            setCoatingComponent(compIndex, processIndex, 'UV-D')
        }


        //* reset process index
        $(`.${className}[index=${compIndex}]`).each((index, ele) => {
            $(ele).attr('process-index', index)
        })

        setUItoRecalcLayout()
        showRecalcPaperUsage(compIndex)
    })

    $('body').on('keyup', ('.paperPercent'), function () {
        var index = $(this).closest('.component').attr('index')
        displayPaperFinalPrice(index)
    })

    $('body').on('keyup', ('.paperCost'), function () {
        var index = $(this).closest('.component').attr('index')
        displayPaperFinalPrice(index)
    })

    $('body').on('keyup', ('.paperMarkup input'), function () {
        const index = $(this).closest('.component').attr('index')
        // var markup = parseFloat($(this).val())
        // $('.component').each(function (index) {
        displayPaperFinalPrice(index)
        // })
    })

    $('body').on('change', ('.sheet_unit_price'), function () {
        const index = $(this).closest('.component').attr('index')
        const is_price_per_sheet = $(this).prop('checked') || false
        setChangePricePerSheet(index, is_price_per_sheet)
    })

    $('body').on('keyup', ('#tax input'), function () {
        changeTaxEvent()
    })

    $('body').on('blur', ('#tax input'), function () {
        if ($(this).val() == "") {
            $(this).val(0)
            changeTaxEvent()
        }
    })

    $('body').on('change', ('.select_currency_no'), function () {
        const currency_no = $(this).val() || 'THB'

        if (currency_no != 'THB') {
            $('#tax input').val(0)
        } else {
            $('#tax input').val(3)
        }

        changeExchangeRate(currency_no)
        changeTaxEvent()
    })

    $('body').on('change', ('.MarkDown input'), function () {
        const arrMarkDown = []

        $('.MarkDown:visible').each(function (index) {
            const val = $(this).find('input').val()
            arrMarkDown.push(val)
        })

        console.log("arrMarkDown", arrMarkDown)

        if (arrMarkDown?.some(val => val >= 12)) {
            setProfitAndLossQtySection(true)
        }

        if (arrMarkDown?.every(val => val < 12)) {
            setProfitAndLossQtySection(false)
        }
    })

    $('body').on('change', ('.MarkDown input, .MarkUp input'), (e) => {
        const thisInput = e.target
        const index = $(e.target).parent().attr('index')
        const value = e.target.value

        console.log("markup", value)
        if (value >= 0) {
            changeMarkingEvent(index)
        } else {
            $(thisInput).val(0)
            changeMarkingEvent(index)
        }
    })

    $('body').on('focus', ('.MarkingPercentMaterial input, .MarkingPercentProduction input'), function () {
        $(this).select()
    })

    $('body').on('change', ('.MarkingPercentMaterial input, .MarkingPercentProduction input'), (e) => {
        const thisInput = e.target
        const index = $(e.target).parent().attr('index')
        const value = parseFloat(parseFloat((e.target.value)).toFixed(2))

        const isRequestCustomerCommission = $('.chk_price_difference:checked')?.length ? true : false

        const authData = localStorage.getItem('data') || {}

        const { is_super_admin = false } = JSON.parse(authData) || {}

        console.log("markup/down", isRequestCustomerCommission && value < 0 && !is_super_admin, isRequestCustomerCommission, value, !is_super_admin)
        if (isRequestCustomerCommission && value < 0 && !is_super_admin) {
            snackAlert('ไม่สามารถลดราคาได้ เนื่องจากงานมีการขอค่านายหน้า', 'warning', 5000)
            $(thisInput).val(0)
            // return false
        }

        console.log("markup", value)
        if (typeof value == 'number' && value != NaN && value != Infinity) {
            changeMarkingEvent(index)
        } else {
            $(thisInput).val(0)
            changeMarkingEvent(index)
        }

        getMarkDownSection()
        setMarkDownQtySection(true)
    })

    $('body').on('change', ('.componentType'), function () {
        var index = $(this).parent().parent().parent().parent().parent().attr('index')
        var componentType = parseInt($(this).val())
        changeComponent(index, componentType)
        setfluteAlign(index, componentType)
        checkRequiredInput()
    })

    $('body').on('change', ('.flute_side'), function () {
        var index = $(this).parent().parent().parent().parent().parent().parent().attr('index')
        var align = $(this).val()
        getFluteAlignonTemplate(index, align)
    })

    $('body').on('change', ('.foilstampCheck'), function () {
        var compIndex = $(this).closest('div.component').attr('index')
        const isMultipleF = getIsMultipleF()
        if ($(this).prop('checked') == true) {
            $(`.foilstampInput[index=${compIndex}] .tdInput`).show()
            if (isMultipleF) {
                $(`.foilstampInput[index=${compIndex}] .f-addon`).show()
            }
        } else {
            setDefaultAddonInput(compIndex, 'foilstamp')
        }
        //checkRequiredInput()
    })

    $('body').on('change', ('.embossCheck'), function () {
        var compIndex = $(this).closest('div.component').attr('index')
        const isMultipleF = getIsMultipleF()
        if ($(this).prop('checked') == true) {
            $(`.embossInput[index=${compIndex}] .tdInput`).show()
            if (isMultipleF) {
                $(`.embossInput[index=${compIndex}] .f-addon`).show()
            }
        } else {
            setDefaultAddonInput(compIndex, 'emboss')
        }
        //checkRequiredInput()
    })

    $('body').on('change', ('.debossCheck'), function () {
        var compIndex = $(this).closest('div.component').attr('index')
        const isMultipleF = getIsMultipleF()
        if ($(this).prop('checked') == true) {
            $(`.debossInput[index=${compIndex}] .tdInput`).show()
            if (isMultipleF) {
                $(`.debossInput[index=${compIndex}] .f-addon`).show()
            }
        } else {
            setDefaultAddonInput(compIndex, 'deboss')
        }
        //checkRequiredInput()
    })

    $('body').on('change', ('.foilColor'), function () {
        var index = $(this).closest('div.component').attr('index')
        var process_index = $(this).parent().parent().parent().parent().parent().attr('process-index')
        var stampColor = $(this).val()
        if ($(this).val() != '') {
            getFoilStampCodeOption(get_foilstamp_code(stampColor), index, process_index)
        } else {
            $('.foilstampInput[index=' + index + '][process-index=' + process_index + '] .foilCode').html('<option value="">-</option>')
        }
        checkRequiredInput()
    })

    $('body').on('change', ('.paperType'), function () {
        var index = $(this).parent().parent().parent().parent().parent().attr('index')
        // const item = est.mainData?.component1[index] || {}
        var paperType = $(this).val()
        var printType = $('#print_type select').val()
        var sourcePaperId = parseInt($('.component[index=' + index + '] .select_paper_source').val())

        if ($(this).val() != '') {
            getPaperGram(get_papergram_arr(paperType), index)
        } else {
            $('.component[index=' + index + '] .paperGram').html('<option value="">-</option>')
        }

        var paperGram = parseInt($('.component[index=' + index + '] .paperGram').val())

        setChangeComponentPaper(index)
        displayPaperPrice(index, paperType, paperGram, sourcePaperId)
        displayPaperFinalPrice(index)
        // if(defaultData.special_paper_code.includes(paperType)){
        if (checkComponentInfo()) {
            recalcLayoutEachComponent(index)
            showCalcBttnPrice()
        }
        // }
        checkRequiredInput()

    })

    $('body').on('change', ('.paperGram'), function () {
        var index = $(this).parent().parent().parent().parent().parent().attr('index')
        var paperType = $('.component[index=' + index + '] .paperType').val()
        var paperGram = parseInt($(this).val())
        var sourcePaperId = parseInt($('.component[index=' + index + '] .select_paper_source').val())

        setChangeComponentPaper(index)
        displayPaperPrice(index, paperType, paperGram, sourcePaperId)
        displayPaperFinalPrice(index)
        checkRequiredInput()
    })

    $('body').on('change', ('.select_paper_source'), function () {
        var index = $(this).parent().parent().parent().parent().parent().attr('index')
        var paperType = $('.component[index=' + index + '] .paperType').val()
        var paperGram = parseInt($('.component[index=' + index + '] .paperGram').val())
        var sourcePaperId = parseInt($(this).val())

        console.log("sourcePaperId", sourcePaperId)

        setChangePaperSource(index)
        displayPaperPrice(index, paperType, paperGram, sourcePaperId)
        displayPaperFinalPrice(index)
        checkRequiredInput()
    })

    $('body').on('change', ('.coatingOption'), function () {
        var compIndex = $(this).closest('.component').attr('index')
        var index = $(this).closest('.coatingInput').attr('index')
        var process_index = $(this).closest('.coatingInput').attr('process-index')
        var coatingOption = $(this).val()

        getCoatingTypeOption(get_coating_code(coatingOption), index, process_index)
        removeTRCoatingSpecialInput(index, process_index)
        removeBlanketUVGap(index, process_index)
        checkRequiredInput()

        if (!coatingOption) {
            $(`.component[index=${index}] .has_speInk`).prop("disabled", false)
            $(`.component[index=${index}] .tr_speInk.ink-drip-off`).remove()
            if ($(`.component[index=${index}] .has_speInk`).prop("checked") && $(`.component[index=${index}] .tr_speInk`).length === 0) {
                $(`.component[index=${index}] .has_speInk`).prop("checked", false)
                $(`.div-speInk[index=${index}]`).hide();
            }
        }

        checkChangePaperConditions(compIndex)
    })

    $('body').on('change', ('.coatingType'), function () {
        const compIndex = $(this).closest('div.addonInput').attr('index')
        const processIndex = $(this).closest('div.addonInput').attr('process-index')
        const coatingCode = $(this).val()
        const coatingType = coatingCode.substring(0, coatingCode.length - 2)
        const coatingSide = coatingCode.substring(coatingCode.length - 1)

        setCoatingComponent(compIndex, processIndex, coatingType, coatingSide)
        checkRequiredInput()
    })

    $('body').on('change', ('.layerCorrugated'), function () {
        var index = $(this).parent().parent().parent().parent().parent().attr('index')
        getFluteTypeOption(get_corrugated_type($(this).val()), index)
        setCorrugatedGram($(this).val(), index)

        setUItoRecalcLayout()
        if (checkComponentInfo()) {
            recalcLayoutEachComponent(index)
            showCalcBttnPrice()
        }
        checkRequiredInput()
    })

    $('body').on('change', ('.fluteCorrugated'), function () {
        var index = $(this).parent().parent().parent().parent().parent().attr('index')
        var num_layer = $('.component[index=' + index + '] .layerCorrugated').val()
        getCorrugatedOption(get_corrugated_grade_type1(num_layer, $(this).val()), "type_1", index)
        getCorrugatedOption([], "gram_1", index)
        getCorrugatedOption([], "type_2", index)
        getCorrugatedOption([], "gram_2", index)
        getCorrugatedOption([], "type_3", index)
        getCorrugatedOption([], "gram_3", index)
        checkRequiredInput()
    })

    $('body').on('change', ('.type_1'), function () {
        var index = $(this).parent().parent().parent().parent().parent().parent().parent().attr('index')
        var num_layer = $('.component[index=' + index + '] .layerCorrugated').val()
        var flute_type = $('.component[index=' + index + '] .fluteCorrugated').val()
        getCorrugatedOption(get_corrugated_grade_gram1(num_layer, flute_type, $(this).val()), "gram_1", index)
        getCorrugatedOption([], "type_2", index)
        getCorrugatedOption([], "gram_2", index)
        getCorrugatedOption([], "type_3", index)
        getCorrugatedOption([], "gram_3", index)
        checkRequiredInput()
    })

    $('body').on('change', ('.gram_1'), function () {
        var index = $(this).parent().parent().parent().parent().parent().parent().parent().attr('index')
        var num_layer = $('.component[index=' + index + '] .layerCorrugated').val()
        var flute_type = $('.component[index=' + index + '] .fluteCorrugated').val()
        var type_1 = $('.component[index=' + index + '] .type_1').val()
        getCorrugatedOption(get_corrugated_grade_type2(num_layer, flute_type, type_1, $(this).val()), "type_2", index)
        getCorrugatedOption([], "gram_2", index)
        getCorrugatedOption([], "type_3", index)
        getCorrugatedOption([], "gram_3", index)
        checkRequiredInput()
    })

    $('body').on('change', ('.type_2'), function () {
        var index = $(this).parent().parent().parent().parent().parent().parent().parent().attr('index')
        var num_layer = $('.component[index=' + index + '] .layerCorrugated').val()
        var flute_type = $('.component[index=' + index + '] .fluteCorrugated').val()
        var type_1 = $('.component[index=' + index + '] .type_1').val()
        var gram_1 = $('.component[index=' + index + '] .gram_1').val()
        getCorrugatedOption(get_corrugated_grade_gram2(num_layer, flute_type, type_1, gram_1, $(this).val()), "gram_2", index)
        getCorrugatedOption([], "type_3", index)
        getCorrugatedOption([], "gram_3", index)
        checkRequiredInput()
    })

    $('body').on('change', ('.gram_2'), function () {
        var index = $(this).parent().parent().parent().parent().parent().parent().parent().attr('index')
        var num_layer = $('.component[index=' + index + '] .layerCorrugated').val()
        var flute_type = $('.component[index=' + index + '] .fluteCorrugated').val()
        var type_1 = $('.component[index=' + index + '] .type_1').val()
        var gram_1 = $('.component[index=' + index + '] .gram_1').val()
        var type_2 = $('.component[index=' + index + '] .type_2').val()
        if (num_layer != 2) {
            getCorrugatedOption(get_corrugated_grade_type3(num_layer, flute_type, type_1, gram_1, type_2, $(this).val()), "type_3", index)
            getCorrugatedOption([], "gram_3", index)
            checkRequiredInput()
        }
    })

    $('body').on('change', ('.type_3'), function () {
        var index = $(this).parent().parent().parent().parent().parent().parent().parent().attr('index')
        var num_layer = $('.component[index=' + index + '] .layerCorrugated').val()
        var flute_type = $('.component[index=' + index + '] .fluteCorrugated').val()
        var type_1 = $('.component[index=' + index + '] .type_1').val()
        var gram_1 = $('.component[index=' + index + '] .gram_1').val()
        var type_2 = $('.component[index=' + index + '] .type_2').val()
        var gram_2 = $('.component[index=' + index + '] .gram_2').val()
        if (num_layer != 2) {
            getCorrugatedOption(get_corrugated_grade_gram3(num_layer, flute_type, type_1, gram_1, type_2, gram_2, $(this).val()), "gram_3", index)
            checkRequiredInput()
        }
    })

    $('body').on('change', ('.cartonLayer'), function () {
        const index = $(this).attr('index')
        const fIndex = $(this).attr('fIndex') || 0

        getCartonFluteTypeOption(index, get_corrugated_type($(this).val()), fIndex)
        getCartonOption(index, [], 'type_1', fIndex)
        getCartonOption(index, [], 'gram_1', fIndex)
        getCartonOption(index, [], 'type_2', fIndex)
        getCartonOption(index, [], "gram_2", fIndex)
        getCartonOption(index, [], 'type_3', fIndex)
        getCartonOption(index, [], "gram_3", fIndex)
        if ($(this).val() == 3) {
            $(`.gradeCtn_corrugated[index=${index}][fIndex=${fIndex}] .corrugatedFlute`).text('')
        } else {
            $(`.gradeCtn_corrugated[index=${index}][fIndex=${fIndex}] .corrugatedFlute`).text('3')
        }
        checkRequiredInput()
    })

    $('body').on('change', ('.fluteCtn_corrugated select'), function () {
        const index = $(this).parent().attr('index')
        const fIndex = $(this).parent().attr('fIndex') || 0
        const num_layer = $(`.cartonLayer[index=${index}][fIndex=${fIndex}]`).val()

        getCartonOption(index, get_corrugated_grade_type1(num_layer, $(this).val()), 'type_1', fIndex)
        getCartonOption(index, [], 'gram_1', fIndex)
        getCartonOption(index, [], 'type_2', fIndex)
        getCartonOption(index, [], 'gram_2', fIndex)
        getCartonOption(index, [], 'type_3', fIndex)
        getCartonOption(index, [], "gram_3", fIndex)
        checkRequiredInput()
    })

    $('body').on('change', ('.type_1Ctn'), function () {
        const index = $(this).attr('index')
        const fIndex = $(this).attr('fIndex') || 0
        const num_layer = $(`.cartonLayer[index=${index}][fIndex=${fIndex}]`).val()
        const flute_type = $(`.fluteCtn_corrugated[index=${index}][fIndex=${fIndex}] select`).val()

        getCartonOption(index, get_corrugated_grade_gram1(num_layer, flute_type, $(this).val()), 'gram_1', fIndex)
        getCartonOption(index, [], 'type_2', fIndex)
        getCartonOption(index, [], "gram_2", fIndex)
        getCartonOption(index, [], 'type_3', fIndex)
        getCartonOption(index, [], "gram_3", fIndex)
        checkRequiredInput()
    })

    $('body').on('change', ('.gram_1Ctn'), function () {
        const index = $(this).attr('index')
        const fIndex = $(this).attr('fIndex') || 0
        const num_layer = $(`.cartonLayer[index=${index}][fIndex=${fIndex}]`).val()
        const flute_type = $(`.fluteCtn_corrugated[index=${index}][fIndex=${fIndex}] select`).val()

        const type_1 = $(`.type_1Ctn[index=${index}][fIndex=${fIndex}]`).val()
        getCartonOption(index, get_corrugated_grade_type2(num_layer, flute_type, type_1, $(this).val()), 'type_2', fIndex)
        getCartonOption(index, [], "gram_2", fIndex)
        getCartonOption(index, [], 'type_3', fIndex)
        getCartonOption(index, [], "gram_3", fIndex)
        checkRequiredInput()
    })

    $('body').on('change', ('.type_2Ctn'), function () {
        const index = $(this).attr('index')
        const fIndex = $(this).attr('fIndex') || 0
        const num_layer = $(`.cartonLayer[index=${index}][fIndex=${fIndex}]`).val()
        const flute_type = $(`.fluteCtn_corrugated[index=${index}][fIndex=${fIndex}] select`).val()

        const type_1 = $(`.type_1Ctn[index=${index}][fIndex=${fIndex}]`).val()
        const gram_1 = $(`.gram_1Ctn[index=${index}][fIndex=${fIndex}]`).val()
        getCartonOption(index, get_corrugated_grade_gram2(num_layer, flute_type, type_1, gram_1, $(this).val()), "gram_2", fIndex)
        getCartonOption(index, [], 'type_3', fIndex)
        getCartonOption(index, [], "gram_3", fIndex)
        checkRequiredInput()
    })

    $('body').on('change', ('.gram_2Ctn'), function () {
        const index = $(this).attr('index')
        const fIndex = $(this).attr('fIndex') || 0
        const num_layer = $(`.cartonLayer[index=${index}][fIndex=${fIndex}]`).val()
        const flute_type = $(`.fluteCtn_corrugated[index=${index}][fIndex=${fIndex}] select`).val()

        const type_1 = $(`.type_1Ctn[index=${index}][fIndex=${fIndex}]`).val()
        const gram_1 = $(`.gram_1Ctn[index=${index}][fIndex=${fIndex}]`).val()
        const type_2 = $(`.type_2Ctn[index=${index}][fIndex=${fIndex}]`).val()
        getCartonOption(index, get_corrugated_grade_type3(num_layer, flute_type, type_1, gram_1, type_2, $(this).val()), "type_3", fIndex)
        getCartonOption(index, [], "gram_3", fIndex)
        checkRequiredInput()
    })

    $('body').on('change', ('.type_3Ctn'), function () {
        const index = $(this).attr('index')
        const fIndex = $(this).attr('fIndex') || 0
        const num_layer = $(`.cartonLayer[index=${index}][fIndex=${fIndex}]`).val()
        const flute_type = $(`.fluteCtn_corrugated[index=${index}][fIndex=${fIndex}] select`).val()

        const type_1 = $(`.type_1Ctn[index=${index}][fIndex=${fIndex}]`).val()
        const gram_1 = $(`.gram_1Ctn[index=${index}][fIndex=${fIndex}]`).val()
        const type_2 = $(`.type_2Ctn[index=${index}][fIndex=${fIndex}]`).val()
        const gram_2 = $(`.gram_2Ctn[index=${index}][fIndex=${fIndex}]`).val()
        getCartonOption(index, get_corrugated_grade_gram3(num_layer, flute_type, type_1, gram_1, type_2, gram_2, $(this).val()), "gram_3", fIndex)
        checkRequiredInput()
    })

    $('body').on('change', ('.gram_3Ctn'), function () {
        const index = $(this).attr('index')
        const fIndex = $(this).attr('fIndex') || 0
        const item = est.mainData.component1[index]

        checkCartonInnerSize(index, fIndex)
        storePaperband(index, fIndex)
        storeKraftwrap(index, fIndex)
        storeCarton(index, fIndex)
        est.setCalculateKraftwrapCost2(item, index, fIndex)
        est.setCalculateCartonCost(item, true, index, fIndex)
        getCartonInfo_after_recalc(index, fIndex)
    })

    $('body').on('change', ('.cut_size'), function () {
        const index = $(this).attr('index')
        const isManualLayout = $('.manualLayout[index=' + index + ']').prop('checked')
        const cut_index = parseInt($(this).val())
        const item = est.mainData.component1[index]
        if (isManualLayout) {
            //*TRUE -> Calculate Layout Manual by User
            setChangeMachine(index)
            displayMachineInfo(index, cut_index)

            if (checkValidateManualLayout(index)) {
                setDataforManualLayout(index)
            }
        } else {
            //*FALSE -> Calculate Layout by Estimate Program
            const checkMatchMachine = checkOpenSizeWithMachine(item, cut_index)
            getCutSizeStdPaper('.cut_size_std_paper', getStdPaperList(item, false), index)
            console.log("--------------------", getStdPaperList(item, false))

            if (!checkMatchMachine?.success) {
                alert(checkMatchMachine.message || '')
                warningText(index, true, checkMatchMachine.message || '')
                $('.paperSize[index=' + index + '] input').attr('readOnly', false)
                displayMachineInfo(index, cut_index)
                setUItoRecalcLayout()
                showRecalcPaperUsage(index)
                return false
            } else {
                est.setMachine(item, cut_index, false)
                displayMachineInfo(index, cut_index)
                getCutSizeStdPaper('.cut_size_std_paper', getStdPaperList(item, false), index)
                // add <option></option> to std. paper select box
                // set selectd id to std. paper
                const { std_paper_id } = item.paper_info
                const stdPaperSize = getStdPaperSize(std_paper_id);

                console.log("stdPaperSize", stdPaperSize)
                if (stdPaperSize) {
                    const {
                        std_paper_size_ref_width_in,
                        std_paper_size_ref_length_in
                    } = stdPaperSize
                    $('.paperSize[index=' + index + '] input').attr('readOnly', true)
                    $('.paperSize[index=' + index + '] .wSize').val(std_paper_size_ref_width_in)
                    $('.paperSize[index=' + index + '] .lSize').val(std_paper_size_ref_length_in)
                } else {
                    $('.paperSize[index=' + index + '] input').attr('readOnly', false)
                }

                $('.layout_grain[index=' + index + ']').val("horizontal")

                displayStdPaperSize(index, std_paper_id)
                setCalculateLayout(index, true)
                est.setCalculatePaperWeight(index)
            }
        }
        checkRequiredInput()
    })

    $('body').on('change', ('.cut_size_std_paper'), function () {
        const index = $(this).attr('index')
        const std_paper_id = parseInt($(this).val())
        const stdPaperSize = getStdPaperSize(std_paper_id);
        if (stdPaperSize) {
            const {
                std_paper_size_ref_width_in,
                std_paper_size_ref_length_in
            } = stdPaperSize
            // $('.paperSize[index=' + index + '] input').attr('readOnly', true)
            setEnableLayoutPaperSize(index, false)
            $('.paperSize[index=' + index + '] .wSize').val(std_paper_size_ref_width_in)
            $('.paperSize[index=' + index + '] .lSize').val(std_paper_size_ref_length_in)
        } else {
            // $('.paperSize[index=' + index + '] input').attr('readOnly', false)
            setEnableLayoutPaperSize(index, true)
        }

        setCalculateLayout(index, false)
        setComponentDivValue(index)
        est.setCalculatePaperWeight(index)
        checkRequiredInput()
    })

    $('body').on('change', ('.std_layout_size'), (e) => {
        const index = $(e.target).attr('index')
        const std_layout_id = parseInt($(e.target).val())
        const stdPaperSize = getStdPaperSize(std_layout_id);
        const component_type = getComponentType(index)
        var item = est.mainData.component1[index]
        let laySize = ['', '']

        console.log("change std_layout_size", index, std_layout_id, stdPaperSize)
        if (stdPaperSize) {
            const {
                std_paper_size_width_in,
                std_paper_size_length_in,
            } = stdPaperSize

            laySize = [std_paper_size_width_in, std_paper_size_length_in]

        }

        // * Get grain option
        console.log("laySize", laySize)
        $(`.componentInfo[index=${index}] .wLaySize`).val(laySize[0])
        $(`.componentInfo[index=${index}] .lLaySize`).val(laySize[1])
        getLayoutGrainSelectOption(index, 'wLaySize', item.paper_info.roll_width)
        getLayoutGrainSelectOption(index, 'lLaySize', item.paper_info.cut_off)

        //* comp type 1, 2
        if (component_type != 3) {
            createPaperGrainDiv(index, $('.parallelRollWidth[index=' + index + ']').val())
            if (stdPaperSize) {
                $(`.layout_grain[index=${index}]`).val('horizontal')
            } else {
                $(`.layout_grain[index=${index}]`).val('')
            }
        }
        //* comp type 2, 3
        if (component_type != 1) {
            createFluteSideImgDiv(index, $('.parallelFluteSide[index=' + index + ']').val())
            if (stdPaperSize) {
                $(`.parallelRollWidth[index=${index}]`).val('WSize')
            } else {
                $(`.parallelRollWidth[index=${index}]`).val('')
            }
        }

        est.setStdLayoutSize(index, std_layout_id)

        setDataforManualLayout(index)

        checkRequiredInput()

    })

    $('body').on('change', ('.layout_grain'), function () {
        const index = $(this).attr('index')
        if ($('.manualLayout[index=' + index + ']').prop('checked')) {
            // const component_type = getComponentType(index)
            // if(component_type!=3){
            //     createPaperGrainDiv(index,$(this).val())
            // }
            // storePaperSize(index)
            // *fixed
            createPaperGrainDiv(index, 'WSize')
            setDataforManualLayout(index)
        } else {
            const index = $(this).attr('index')
            if (!setCalculateLayout(index, false)) {
                $(this).focus()
            }
            checkLaying(index)
            checkRequiredInput()
        }
    })

    // !START Event About Packing
    $('body').on('change', ('.packingCheck input'), function () {
        const index = $(this).closest('div').attr('index')
        const fIndex = $(this).closest('div').attr('fIndex') || 0

        let check = 0
        $(`.packingCheck[index=${index}][fIndex=${fIndex}] input`).each(function (index1) {
            if ($(this).prop('checked') == true) {
                check += 1
            }
        })
        if (check == 0) {
            $(`.divPacking[index=${index}][fIndex=${fIndex}]`).hide()
        } else {
            $(`.divPacking[index=${index}][fIndex=${fIndex}]`).show()
        }
    })

    $('body').on('change', ('.paperband input'), function () {
        const index = $(this).closest('div').attr('index')
        const fIndex = $(this).closest('div').attr('fIndex') || 0
        const checked = $(this).prop('checked') || false
        const { checkKraftwrap, checkCarton } = getPackingChecked(index, fIndex) || {}

        if (checked) {
            const { qty_per_paperband: default_qty_per_paperband } = defaultData.paperband_info || {}
            $(`.divPaperband[index=${index}][fIndex=${fIndex}]`).show()
            $(`.qty_per_band[index=${index}][fIndex=${fIndex}]`).val(default_qty_per_paperband)
        } else {
            $(`.divPaperband[index=${index}][fIndex=${fIndex}]`).hide()
        }

        if (checkKraftwrap) {
            const numKraftwrap = getNumKraftwrap(index, fIndex)
            const layKraftwrapSize = getKraftwrapSize(index, fIndex)

            $(`.tbLayoutKraftwrap[index=${index}][fIndex=${fIndex}]`).remove()
            imgLayoutKraftwrap(index, numKraftwrap[0], numKraftwrap[1], layKraftwrapSize, fIndex)
            storeKraftwrap(index, fIndex)
            setCalculatePackingCost(index)
        }

        if (checkCarton) {
            getCartonInfo(index, fIndex)
            setCalculateCorrugatedCtn(index, fIndex)
        }
    })

    $('body').on('change', ('.kraftwrap input'), function () {
        const index = $(this).closest('div').attr('index')
        const fIndex = $(this).closest('div').attr('fIndex') || 0
        const checked = $(this).prop('checked') || false
        const checkCarton = $(`.carton[index=${index}][fIndex=${fIndex}] input`).prop('checked') || false

        if (checked) {
            $(`.divKraftwrap[index=${index}][fIndex=${fIndex}]`).show()
            storeKraftwrap(index, fIndex)
            setCalculatePackingCost(index)
            getKraftwrapQty(index, fIndex)
        } else {
            $(`.divKraftwrap[index=${index}][fIndex=${fIndex}]`).hide()
        }

        if (checkCarton) {
            getCartonInfo(index, fIndex)
            setCalculateCorrugatedCtn(index, fIndex)
        }
    })

    $('body').on('change', ('.carton input'), function () {
        const index = $(this).closest('div').attr('index')
        const fIndex = $(this).closest('div').attr('fIndex') || 0
        const checked = $(this).prop('checked') || false

        if (checked) {
            $('body input[readonly]').attr('tabindex', -1)
            $(`.divCarton[index=${index}][fIndex=${fIndex}]`).show()

            getCartonInfo(index, fIndex)
            setCalculateCorrugatedCtn(index, fIndex)
        } else {
            $(`.divCarton[index=${index}][fIndex=${fIndex}]`).hide()
        }
    })

    $('body').on('change', ('.pallet input'), function () {
        const index = $(this).closest('div').attr('index')
        const fIndex = $(this).closest('div').attr('fIndex') || 0
        const checked = $(this).prop('checked') || false

        if (checked) {
            $(`.divPallet[index=${index}][fIndex=${fIndex}]`).show()
        } else {
            $(`.divPallet[index=${index}][fIndex=${fIndex}]`).hide()
        }
    })

    $('body').on('change', ('.paperbandType'), function () {
        const index = $(this).attr('index')
        const fIndex = $(this).attr('fIndex') || 0
        const layKraftwrapSize = getKraftwrapSize(index, fIndex)
        const numKraftwrap = getNumKraftwrap(index, fIndex)

        $(`.tbLayoutKraftwrap[index=${index}][fIndex=${fIndex}]`).remove()
        imgLayoutKraftwrap(index, numKraftwrap[0], numKraftwrap[1], layKraftwrapSize, fIndex)
    })

    $('body').on('keyup', ('.numW_Kraftwrap, .numL_Kraftwrap'), function () {
        const index = $(this).attr('index')
        const fIndex = $(this).attr('fIndex') || 0
        const layKraftwrapSize = getKraftwrapSize(index, fIndex)
        const numKraftwrap = getNumKraftwrap(index, fIndex)
        const checkCarton = $(`.carton[index=${index}][fIndex=${fIndex}] input`).prop('checked') || false

        $(`.tbLayoutKraftwrap[index=${index}][fIndex=${fIndex}]`).remove()
        imgLayoutKraftwrap(index, numKraftwrap[0], numKraftwrap[1], layKraftwrapSize, fIndex)

        storeKraftwrap(index, fIndex)
        setCalculatePackingCost(index)
        getKraftwrapQty(index, fIndex)

        if (checkCarton) {
            getCartonInfo(index, fIndex)
            setCalculateCorrugatedCtn(index, fIndex)
        }
    })

    $('body').on('click', ('.edit_kraftwrap_qty'), function () {
        const index = $(this).attr('index')
        const fIndex = $(this).attr('fIndex') || 0
        const checked = $(`.edit_kraftwrap_qty[index=${index}][fIndex=${fIndex}]`).prop('checked')

        if (checked) {
            $(`.kraftwrap_qty[index=${index}][fIndex=${fIndex}]`).prop('readonly', false)

        } else {
            $(`.kraftwrap_qty[index=${index}][fIndex=${fIndex}]`).prop('readonly', true)

            storeKraftwrap(index, fIndex)
            setCalculatePackingCost(index)
            getKraftwrapQty(index, fIndex)
        }
    })

    $('body').on('blur', ('.kraftwrap_qty'), function () {
        const index = $(this).attr('index')
        const fIndex = $(this).attr('fIndex') || 0
        const { checkCarton } = getPackingChecked(index, fIndex) || {}

        storeKraftwrap(index, fIndex)
        setCalculatePackingCost(index)

        if (checkCarton) {
            getCartonInfo(index, fIndex)
            setCalculateCorrugatedCtn(index, fIndex)
        }
    })

    $('body').on('blur', ('.qty_per_band'), function () {
        const index = $(this).closest('div').attr('index')
        const fIndex = $(this).closest('div').attr('fIndex') || 0
        const { checkCarton, checkKraftwrap } = getPackingChecked(index, fIndex) || {}
        console.log("blur")
        if (!checkValidatePaperbandPacking()) {
            return false
        }

        storePaperband(index, fIndex)

        if (checkCarton && !checkKraftwrap) {
            checkCartonInnerSize(index, fIndex)
            storeCarton(index, fIndex)

            const item = est.mainData.component1[index]
            est.setCalculateCartonCost(item, false, index, fIndex)
            getCartonInfo_after_recalc(index, fIndex)
        }

        setCalculatePackingCost(index)

    })

    $('body').on('change', ('#is_different_packing'), (e) => {
        const checked = e.target.checked

        setDifferentPacking(checked)
    })
    // !END Event About Packing

    //ABOUT Manual Layout event 
    $('body').on('change', ('.is_manualLayout'), function () {
        //CHECKBOX in div component spec
        const index = $(this).parent().parent().parent().parent().parent().parent().parent().attr('index')
        hilightText('is_manualLayout', $(this).prop('checked'), index)

        setUItoRecalcLayout()
        if (checkComponentInfo()) {
            recalcLayoutEachComponent(index)
            showCalcBttnPrice()
        }

        checkRequiredInput()
    })

    $('body').on('change', ('.manualLayout'), function () {
        //CHECKBOX in div Layout
        const index = $(this).attr('index')
        const item = est.mainData.component1[index]
        hilightText('manual_layout', $(this).prop('checked'), index)
        hilightText('is_manualLayout', $(this).prop('checked'), index)
        $('.componentTemplate[index=' + index + '] .is_manualLayout').prop('checked', $(this).prop('checked'))

        if ($(this).prop('checked')) {
            est.setManualLayout(index, true)
            setDivComponentLayout(index, true)
            $('.alertLaysize_div[index=' + index + ']').remove()
            $('.alertNumLay[index=' + index + ']').remove()
        } else {
            est.setManualLayout(index, false)
            est.setMachine(item)

            if (est.setCalculateLayout(index) == false) {
                checkLaying(index)
                alert('ไม่สามารถวางเลย์ได้ เนื่องจาก open size มีขนาดใหญ่กว่าไซส์กระดาษ หรือ max machine size')
                return
            }

            est.setDefaultPacking(index)
            est.setCalculateUps(index)
            setDivComponentLayout(index, false)
        }

        checkRequiredInput()
    })

    $('body').on('change', ('.parallelRollWidth'), function () {
        const index = $(this).attr('index')
        const component_type = getComponentType(index)
        if (component_type != 3) { createPaperGrainDiv(index, $(this).val()) }
        // storePaperSize(index)
        setDataforManualLayout(index)
    })

    $('body').on('change', ('.parallelFluteSide'), function () {
        const index = $(this).attr('index')
        const component_type = getComponentType(index)

        if (component_type != 1) {
            // let align = ''
            createFluteSideImgDiv(index, $(this).val())

            // if ($(this).val() == 'WSize') {
            //     align = 'short_side'
            // } else {
            //     align = 'long_side'
            // }

            // getFluteAlignonTemplate(index, align)
        }

        setChangeParallelFluteSide(index)

        if (checkValidateManualLayout(index)) {
            setDataforManualLayout(index)
        }
    })

    $('body').on('change', ('.wLaySize,.lLaySize'), function () {
        var index = $(this).parent().attr('index')
        var className = ($(this).attr('class').split(" "))[0] // wLaySize , lLaySize
        var component_type = getComponentType(index)
        // * Get grain option
        getLayoutGrainSelectOption(index, className, $(this).val())

        //* comp type 1, 2
        if ([1, 2].includes(component_type)) {
            createPaperGrainDiv(index, $('.parallelRollWidth[index=' + index + ']').val())
        }

        //* comp type 2, 3
        if ([2, 3].includes(component_type)) {
            createFluteSideImgDiv(index, $('.parallelFluteSide[index=' + index + ']').val())
        }

        setChangeParallelFluteSide(index)

        if (checkValidateManualLayout(index)) {
            setDataforManualLayout(index)
        }
    })

    //ABOUT Manual Layout event ^^^^^^
    $('body').on('change', ('.is_carton_printing'), function () {
        const index = $(this).closest('.packingComponent').attr('index')
        const fIndex = $(this).closest('.packingComponent').attr('fIndex') || 0
        const item = est.mainData.component1[index]

        getCartonInfo(index, fIndex)
        est.setCalculateCartonCost(item, true, index, fIndex)
    })

    $('body').on('change', ('.is_custom_inner_size'), function () {
        const checked = $(this).prop('checked') || false
        const index = $(this).closest('.packingComponent').attr('index')
        const fIndex = $(this).closest('.packingComponent').attr('fIndex') || 0
        const item = est.mainData.component1[index]

        setCustomInnerSizeCarton(index, fIndex, checked)
        checkCartonInnerSize(index, fIndex)
        getCartonInfo(index, fIndex)
        setCalculateCorrugatedCtn(index, fIndex)
        est.setCalculateKraftwrapCost2(item, index, fIndex)
        est.setCalculateCartonCost(item, true, index, fIndex)

    })

    $('body').on('blur', ('.w_innerCtnSize, .l_innerCtnSize, .h_innerCtnSize'), function () {
        const index = $(this).closest('.packingComponent').attr('index')
        const fIndex = $(this).closest('.packingComponent').attr('fIndex') || 0
        setCalculateCorrugatedCtn(index, fIndex)
    })

    $('body').on('click', ('.recalc_carton'), function () {
        const index = $(this).closest('.packingComponent').attr('index')
        const fIndex = $(this).closest('.packingComponent').attr('fIndex') || 0
        const item = est.mainData.component1[index]

        checkCartonInnerSize(index, fIndex)
        getCartonInfo(index, fIndex)
        setCalculateCorrugatedCtn(index, fIndex)
        est.setCalculateKraftwrapCost2(item, index, fIndex)
        est.setCalculateCartonCost(item, true, index, fIndex)
    })

    $('body').on('change', ('.is_custom_qty_per_carton'), function () {
        const checked = $(this).prop('checked') || false
        const index = $(this).closest('.packingComponent').attr('index')
        const fIndex = $(this).closest('.packingComponent').attr('fIndex') || 0
        const item = est.mainData.component1[index]

        setCustomQtyPerCarton(index, fIndex, checked)
        checkCartonInnerSize(index, fIndex)
        getCartonInfo(index, fIndex)
        setCalculateCorrugatedCtn(index, fIndex)
        est.setCalculateKraftwrapCost2(item, index, fIndex)
        est.setCalculateCartonCost(item, true, index, fIndex)
    })

    $('body').on('change', ('.paperSize input'), function (e) {
        var index = $(this).parent().attr('index')

        if ($('.manualLayout[index=' + index + ']').prop('checked')) {
            //TRUE -> Manual Layout
            // setDataforManualLayout(index)
            setChangeParallelFluteSide(index)

            if (checkValidateManualLayout(index)) {
                setDataforManualLayout(index)
            }
        } else {
            //FALSE -> Calculate by Estimate Progeam
            storePaperSize(index)
            if (checkComponentPaperSize(index)) {
                est.setDefaultPacking(index)
                est.setCalculateUps(index)
                recalcPaperUsageTable(index)
            }
        }

    })

    $('body').on('change', ('.editLayout input'), function (e) {
        var index = $(this).parent().attr('index')
        const item = est.mainData.component1[index]
        const checked = $(this).prop('checked')
        est.setIsEditLayout(index, checked)

        if (checked) {
            $('.divEditLayout[index=' + index + '] input').prop('readonly', false)
            localStorage.setItem("prevLayout", `[]`)
        } else {
            const component_type = getComponentType(index)

            if ([3].includes(component_type)) {
                const { max_size } = item?.machine
                $(`.paperSize[index=${index}] input.wSize`).val(max_size[0])
                $(`.paperSize[index=${index}] input.lSize`).val(max_size[1])
            }

            setCalculateLayout(index, false)
            $('.divEditLayout[index=' + index + '] input').prop('readonly', true)
        }
        checkRequiredInput()
    })

    $('body').on('change', ('.editTolerance input'), function () {
        var index = $(this).parent().attr('index')
        const checked = $(this).prop('checked')
        est.setIsEditTolerance(index, checked)
        if (checked) {
            $('.divEditTolerance[index=' + index + '] input').prop('readonly', false)
        } else {
            let { tolerance } = defaultData?.print_type_config?.getPrintTypeConfig()

            const { gripper, color_bar, paper_edge, bleed } = tolerance || defaultData.tolerance
            $('.divEditTolerance[index=' + index + '] .gripper input').val(gripper)
            $('.divEditTolerance[index=' + index + '] .color_bar input').val(color_bar)
            $('.divEditTolerance[index=' + index + '] .paper_edge input').val(paper_edge)
            $('.divEditTolerance[index=' + index + '] .bleed input').val(bleed)
            $('.divEditTolerance[index=' + index + '] input').prop('readonly', true)
        }
    })

    $('body').on('change', ('.edit_w_layout input,.edit_l_layout input'), function (e) {
        var index = $(this).parent().parent().parent().parent().parent().parent().attr('index')

        if (parseInt(e.target.value) === 0) {
            alert("จำนวน Lay ในแต่ละด้านต้องมากกว่า 0 !")
            $(this).val(1)
            // return false
        }

        var num = [
            parseInt($('.divEditLayout[index=' + index + '] .edit_w_layout input').val()),
            parseInt($('.divEditLayout[index=' + index + '] .edit_l_layout input').val())
        ]

        if ($('.manualLayout[index=' + index + ']').prop('checked')) {
            //TRUE -> Manual Layout by USER
            getNumLayoutbyManual(num, index)
            setDataforManualLayout(index)
        } else {
            //FALSE -> Calculate Layout by Estimate Program
            getPaperSize(index, num)
            // checkComponentPaperSize(index)
        }

    })

    $('body').on('click', ('.changeLayout_bttn'), function () {
        var index = $(this).attr('index')
        var num_layout = [parseInt($('.componentLayout[index=' + index + '] .edit_w_layout input').val()), parseInt($('.componentLayout[index=' + index + '] .edit_l_layout input').val())]
        $('.componentLayout[index=' + index + '] .edit_w_layout input').val(num_layout[1])
        $('.componentLayout[index=' + index + '] .edit_l_layout input').val(num_layout[0])
        var new_num_layout = [num_layout[1], num_layout[0]]
        getPaperSize(index, new_num_layout)
        // checkComponentPaperSize(index)
    })

    $('body').on('blur', ('.divEditTolerance input'), function () {
        var index = $(this).parent().parent().parent().parent().parent().parent().attr('index')
        var num = [parseInt($('.divEditLayout[index=' + index + '] .edit_w_layout input').val()), parseInt($('.divEditLayout[index=' + index + '] .edit_l_layout input').val())]
        getPaperSize(index, num)
        // checkComponentPaperSize(index)
    })

    $('body').on('change', ('.editTolerance input'), function () {
        var index = $(this).parent().attr('index')
        if ($(this).prop('checked') == false) {
            var num = [parseInt($('.divEditLayout[index=' + index + '] .edit_w_layout input').val()), parseInt($('.divEditLayout[index=' + index + '] .edit_l_layout input').val())]
            getPaperSize(index, num)
            // checkComponentPaperSize(index)
        }
    })

    $('body').on('blur', ('#rfq_remark'), function () {
        const rfq_remark = $(this).val() || "";
        est.setRfqRemark(rfq_remark)
    })

    $('body').on('click', ('.addFile'), function () {
        addFile()
    })

    $('body').on('change', ('.input_file_upload'), function (e) {
        const trIndex = $(this).closest('tr').attr('index')
        const file = $(this)[0].files[0];
        uploadFile(trIndex, file)
    })

    $('body').on('click', ('.deleteFile'), function () {
        const result = confirm("Confirm delete?");
        if (result) {
            const index = $(this).closest('tr').attr('index')
            const fileId = parseInt($(this).closest('tr').find('a')?.attr('file-id'))
            est.setInActiveFile(index, fileId)
        }
    })

    $('body').on('click', '.file_path', async (e) => {
        e.preventDefault();

        const file_id = $(e.target).attr('file-id')
        const filePath = e.currentTarget.href
        const checkFile = await checkFileExist(file_id);
        if (checkFile) {
            window.open(filePath, "_blank")

        } else {
            alert('พบข้อผิดพลาด ไฟล์มีปัญหาไม่สามารถเปิดไฟล์ได้')
        }
    })

    $('body').on('change', ('.chk_color_limit'), function (e) {
        const isMultipleF = getIsMultipleF()
        const checked = $(this).prop('checked')

        if (isMultipleF) {
            var td = $(e.target).closest('tr').find('.color_limit_f')
        } else {
            var td = $('.color_limit_normal.color_limit')
        }

        if (checked) {
            td.show()
        } else {
            td.hide()
            td.find('input').val('')
        }

        if (checkComponentInfo()) {
            $('.componentPaperUsage .recalc-paperusage').addClass('show-bttn')
            $('.componentPaperUsage table').hide()
            showCalcBttnPrice()
        }
        checkRequiredInput()
    })

    $('body').on('change', ('.color_limit input'), (e) => {
        if (checkComponentInfo()) {
            $('.componentPaperUsage .recalc-paperusage').addClass('show-bttn')
            $('.componentPaperUsage table').hide()
            showCalcBttnPrice()
        }
        checkRequiredInput()
    })

    $('body').on('change', ('.chk_profit_sharing'), function () {
        setJobProfitSharing()
        setPaperMarkingPrice()
        recalcAllLayout()
    })

    $('body').on('change', ('.chk_split_delivery'), function (e) {
        const is_multiple_f = getIsMultipleF()
        const checked = $(this).prop("checked")
        if (checked) {
            if (is_multiple_f) {
                $(`.f-totalQty input`).each((index, ele) => {
                    if (numeral($(ele).val() || 0).value() <= 0) {
                        alert('กรุณาระบุจำนวน Qty. ให้ครบถ้วนก่อนทำแบ่งส่ง')
                        $('.chk_split_delivery').prop("checked", false)
                        $(ele).focus()
                        return false
                    }
                })
            } else {
                if (numeral($('.inputQty input:eq(0)').val()).value() <= 0) {
                    alert('กรุณาระบุจำนวน Qty. ก่อนทำแบ่งส่ง')
                    $('.chk_split_delivery').prop("checked", false)
                    $('.inputQty input:eq(0)').focus()
                    return
                }
            }

            if (checkValidateAllNameComponent() === false) {
                $('.chk_split_delivery').prop("checked", false)
                return
            }
        }

        toggleSplitDelivery(this, checked)
        checkRequiredInput()
    })

    $('body').on('blur', ('.deliveryDestinationName'), function (e) {
        const index = $(this).closest('tr.deliveryProcess').attr('index')
        if (index !== undefined) {
            if ($(`.deliveryProcess[index=${index}] .deliveryDestinationId`).val() == "") {
                $(`.deliveryProcess[index=${index}] .deliveryDestinationName`).val("")
                // displaySnackbar('.snackbar-delivery')
            }
        } else {
            if ($(`.oneTimeDelivery .deliveryDestinationId`).val() == "") {
                $(`.oneTimeDelivery .deliveryDestinationName`).val("")
                displaySnackbar('.oneTimeDelivery .snackbar-delivery')
            }
        }
        checkRequiredInput()
    })

    $('body').on('keyup', ('.deliveryDestinationName'), function (event) {
        const index = $(this).closest('tr').attr('index')
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (index !== undefined) {
            if (keycode != 13) {
                $(`.deliveryProcess[index=${index}] .deliveryDestinationId`).val("")
            }
        } else {
            if (keycode != 13) {
                $(`.oneTimeDelivery .deliveryDestinationId`).val("")
            }
        }
        checkRequiredInput()
    })


    $('body').on('change', ('.remark-paper,.remark-corrugated'), function () {
        if (checkComponentInfo()) {
            setUItoRecalcProc()
        }
    })


    //*Event about Other Process, Handwork Process, Material vvvvvvvvvvvvvvvvvvv -----------

    $('body').on('click', ('.deleteProcess'), function () {
        const className = $(this).closest('tr').attr('class')
        $(this).parent().parent().remove()
        if (['deliveryProcess'].includes(className)) {
            resetTrDeliveryIndex()
            est.setCalculateCheckDeliveryQty()
        }
    })

    $('body').on('click', ('.addProcess:not(.disabled)'), function () {
        var id = $(this).parent().parent().parent().parent().parent().parent().attr('id')
        addProcess(id)
        checkRequiredInput()
    })

    $('body').on('change', ('.is_fixedPrice'), function (e) {
        const is_fixedPrice = $(this).prop('checked')
        const index = $(this).closest('tr').index()
        const className = $(this).closest('tr').attr('class').split(' ')[0]
        createTdNumInput(index, is_fixedPrice, className)
        checkRequiredInput()
    })

    //*Event about Other Process, Handwork Process, Material ^^^^^^^^^^^^^^^^^^^ ----------


    //* Event for delivery Section vvvvvvvvvvvvvvvvvvvvvv
    $('body').on('click', ('.addTrDeliveryMultiple'), function () {
        const index = $(this).closest('tr.deliveryProcess').attr('index')
        addDeliveryMultipleProcess(index)
        checkRequiredInput()
    })
    $('body').on('click', ('.deleteProcessDelivery'), function () {
        $(this).closest('tr.deliveryProcess').remove()
        resetDeliveryIndex()
        checkRequiredInput()
    })
    $('body').on('click', ('.deleteTrDeliveryMultiple'), function () {
        deleteDeliveryMultipleProcess(this)
        est.setCalculateCheckDeliveryQty()
        checkRequiredInput()
    })

    $('body').on('change', ('.deliveryComponentId'), function (e) {
        const isMultipleF = getIsMultipleF()
        const compIndex = e.target.value
        $(this).closest('tr').find('div.deliveryQty input').val(0)
        est.setCalculateCheckDeliveryQty()

        const balanceQty = est.getBalanceDeliveryQty(compIndex)

        if (balanceQty === 0 && compIndex != '') {
            const compName = isMultipleF
                ? `F : ${$(`.f_table input.f-code:eq(${compIndex})`).val()}`
                : `Comp. ${$(`.nameComponent[index=${compIndex}] .nameComp`).val()}`
            alert(`ยอดส่งของ ${compName} ครบตามจำนวนที่กำหนดแล้ว`)
            // return false
        }

        $(this).closest('tr').find('div.deliveryQty input').val(balanceQty)
        est.setCalculateCheckDeliveryQty()
        checkRequiredInput()
    })

    $('body').on('keyup', ('.deliveryQty input'), function () {
        const isMultipleF = getIsMultipleF()
        est.setCalculateCheckDeliveryQty()
        let compIndex = 0
        if ($(`.component`).length > 1) {
            compIndex = parseInt($(this).closest('tr').find('select.deliveryComponentId').val())
        }

        const balanceQty = est.getBalanceDeliveryQty(compIndex)
        if (balanceQty < 0) {
            const compName = isMultipleF
                ? `F : ${$(`.f_table:eq(${compIndex}) input.f-code`).val()}`
                : `Comp. ${$(`.nameComponent[index=${compIndex}] .nameComp`).val()}`
            alert(`ยอดส่งของ ${compName} เกินจำนวนที่กำหนด กรุณาแก้ไขข้อมูล`)
            // return false
        }
        checkRequiredInput()
    })

    //* Event for delivery section ^^^^^^^^^^^^^^^^^^^^^^


    //* Event for multiple F. Job vvvvvvvvvvvvvvvvvvvvvvvv

    $(`body`).on('change', ('#is_multiple_f'), function (e) {
        const checked = e.target.checked
        toggleMultipleF(checked)
        checkRequiredInput()
    })

    $('body').on('click', ('#addFQty'), function () {
        const { validate, limit } = checkLimitAddQtyNumber()
        if (!validate) {
            snackAlert(`ไม่สามารถเพิ่มยอดงานมากกว่า ${limit} ยอดได้`)
            return false
        }

        addFQty()
        setDefaultElement()
    })
    $('body').on('click', ('#removeFQty'), function () {
        if ($('table.f_table').length > 1) {
            $('table.f_table:last').remove()
            tdNumMaterial('delete')
            getFCodeSelectOption()
        }
    })

    $('body').on('click', ('#addFQty, #removeFQty'), function () {
        resetDelivery()
        setChangeNumberOfPriceDiffInputQty()
        setChangeNumberOfCustomerGiftInputQty()
        $('.component').each((index, ele) => {
            showRecalcPaperUsage(index)
        })
        checkRequiredInput()
    })

    //? special ink for f
    $('body').on('click', ('.deleteSpeInk'), function () {
        const compIndex = $(this).closest(`.component`).attr('index')
        const f_index = $(this).closest(`.div-speInk`).attr('f_index')
        // const countSpeInkF=$(`.specialInkSection[index=${index}] .specialInk-container`
        deleteSpecialInk(compIndex, f_index, $(this))
    })

    $('body').on('click', ('.addSpeInk'), function () {
        const compIndex = $(this).closest(`.component`).attr('index')
        const f_index = $(this).closest(`.div-speInk`).attr('f_index')
        addSpecialInk(compIndex, 0, f_index)
        checkRequiredInput()
    })

    $('body').on('click', ('.addSpeInk-f'), function () {
        const index = $(this).closest('.component').attr('index')
        if (checkNumberOfColorSelection()) {
            addSpecialInkF(index)
            setCoatingDripOffComponent(index)
        } else {
            alert('ไม่สามารถเพิ่มจำนวนสีได้อีก เนื่องจากครบตามจำนวน F แล้ว')
        }
    })

    $('body').on('click', ('.copySpeInk-f'), function () {
        const index = $(this).closest('.component').attr('index')
        if (checkNumberOfColorSelection()) {
            const countSpeInkF = $(`.specialInkSection[index=${index}] .specialInk-container`).length
            const prototype = $(this).closest('div.specialInkSection').find('.specialInk-list .specialInk-container:last')
            const newSpeInkF = prototype.clone()

            const cloneValue = []
            prototype.find('.tr_speInk').each((index, ele) => {
                const inkType = $(ele).find(`select.speInk_type option:checked`).val() || ''
                const filling = $(ele).find(`select.speInk_fillingStyle option:checked`).val() || ''
                cloneValue.push({
                    inkType,
                    filling
                })
            })
            newSpeInkF.find('.tr_speInk').each((index, ele) => {
                $(ele).find(`select.speInk_type`).val(cloneValue[index].inkType)
                $(ele).find(`select.speInk_fillingStyle`).val(cloneValue[index].filling)
            })
            $(`.specialInkSection[index=${index}] .specialInk-list`).append(newSpeInkF)

            $(`.specialInkSection[index=${index}] .specialInk-list .specialInk-container:last input[type='checkbox']`).attr('data-f_index', countSpeInkF)
            $(`.specialInkSection[index=${index}] .specialInk-list .specialInk-container:last div.div-speInk`).attr('f_index', countSpeInkF)
            checkRequiredInput()
        } else {
            alert('ไม่สามารถเพิ่มจำนวนสีได้อีก เนื่องจากครบตามจำนวน F แล้ว')
        }
    })

    $('body').on('click', ('.deleteSpeInk-f'), function () {
        const speInkFLength = $(this).closest('div.specialInkSection').find('.specialInk-container').length
        if (speInkFLength > 1) {
            $(this).closest('div.specialInkSection').find('.specialInk-list .specialInk-container:last').remove()
        }
    })

    $('body').on('click', '.add-addon-f-code', function () {
        const compIndex = $(this).closest('div.component').attr('index')
        const className = $(this).closest('div.addonInput').attr('class').split(" ")[0]
        const processIndex = $(this).closest('div.addonInput').attr('process-index')
        const name = $(this).data('name')

        addAddonFCode(className, name, compIndex, processIndex)
        getFCodeSelectOption()
        checkRequiredInput()
    })

    $('body').on('click', ('.delete-addon-f-code'), function () {
        $(this).closest('tr').remove()
    })


    $('body').on('blur', ('.f-code'), (e) => {
        if (!checkValidateFCode()) {
            alert('ไม่สามารถระบุ F ซ้ำกันได้, กรุณาเปลี่ยนเลข F');
            $(e.target).val('')
        }
        getFCodeSelectOption()
        checkRequiredInput()
    })

    $('body').on('change', ('select.f-code-select'), (e) => {
        let className = `${$(e.target).attr('class').split(" ")[0]}`
        const value = e.target.value
        let selector = ''
        if (value != '' && className != 'deliveryComponentId') {
            $(e.target).val('');
            if (['foilstampFCode', 'embossFCode', 'debossFCode'].includes(className)) {
                selector = $(e.target).closest('div.addonInput').find('select.f-code-select')
            } else {
                selector = $(`.${className}`)
            }


            const check = checkValidateSelectedDuplicateFCode(value, selector)

            if (!check) {
                $(e.target).val('');
                alert('ไม่สามารถเลือก F ซ้ำได้');
            } else {
                $(e.target).val(value);
            }


        }
        checkRequiredInput()
    })

    //? special ink for f

    //* Event for multiple F. Job ^^^^^^^^^^^^^^^^^^^^^^^

    //* Update 02/11/22

    $('body').on('change', ('.is_loss'), function () {
        const isLoss = $(this).prop('checked') || false

        setProfitAndLossQtySection(isLoss)
        checkRequiredInput()
    })

    //* Update 02/11/22

    //* Update 22/11/22
    $('body').on('click', ('.chk_price_difference'), function () {
        setChangeNumberOfPriceDiffInputQty()
        displaySave(true)
    })
    $('body').on('click', ('.chk_customer_gift'), function () {
        setChangeNumberOfCustomerGiftInputQty()
        displaySave(true)
    })

    //* update 05/07/23
    $('body').on('change', ('.paperGram, .fluteCorrugated'), function (e) {
        const compIndex = $(this).closest('div.component').attr('index')
        setUItoRecalcLayout()
        showRecalcPaperUsage(compIndex)
    })

    $('#check-est-data').click(function () {
        console.log("Check Data :", est.mainData)
    })

    $('#reset-est-data').click(function () {
        window.location.reload()
    })

    $('#mockup-est-data').click(function () { // แบ่ง F
        $('.loading').show()
        let check = est.setMockupData()
        if (check) {
            setTimeout(() => {
                $('.loading').hide()
            }, 800);
            $(this).attr("disabled", true)
            $('#mockup-est-data2').attr("disabled", true)
        } else {
            $('.loading').hide()
        }
    })

    $('#mockup-est-data2').click(function () { // ไม่แบ่ง F
        $('.loading').show()
        let check = est.setMockupData2()
        if (check) {
            setTimeout(() => {
                $('.loading').hide()
            }, 800);
            $(this).attr("disabled", true)
            $('#mockup-est-data').attr("disabled", true)
        } else {
            $('.loading').hide()
        }
    })

    $('#check-validate-data').click(function () {
        // checkValidateMultipleF()
        storeAllData()
    })

    $('#check-component-data').click(function () {
        console.log("Check Component :", est.mainData.component1)

        est.mainData.component1.forEach((comp, compIndex) => {
            console.log(`Component : ${compIndex + 1}`)
            console.log(`คิดราคาแยกแต่ละ F`)
            console.log(`Paper Usage :`, comp.paper_usage)
            console.log(`Special Ink :`, comp.color)
            console.log(`Plate :`, comp.paper_usage.line.map(obj => obj.price.filter(obj2 => obj2.type === 'plate')))
            console.log(`Print :`, comp.paper_usage.line.map(obj => obj.price.filter(obj2 => obj2.type === 'print')))
            console.log(`----------------`)
            console.log(`คิดราคาแยกตามการเลือก F`)
            console.log(`Deboss`, comp.addon.filter(obj => obj.type === 'deboss')?.map(obj => obj.line))
            console.log(`Emboss`, comp.addon.filter(obj => obj.type === 'emboss')?.map(obj => obj.line))
            console.log(`Foil-Stamp`, comp.addon.filter(obj => obj.type === 'foilstamp')?.map(obj => obj.line))
            console.log(`----------------`)
            console.log(`คิดราคารวมทุก F`)
            console.log(`Block Die-cut`, comp.process.filter(obj => obj.name === 'diecut'))
            console.log(`Die-cut`, 100)
            console.log(`การประกบลูกฟูก`, 100)
            console.log(`แกะ`, 100)
            console.log(`Inspection`, 100)
            console.log(`Assembly`, 100)
            console.log(`Coating`, 100)
            console.log(`Packing`, 100)
            console.log(`Delivery`, 100)
            console.log(`------END-------`)
        })

    })

    $('#check-component-data').click(function () {
        console.log("Save Data")
    })

    $('#print').click(async function () {
        await setPrintPDF()
    })

    $('body').on('keyup', ('textarea'), function () {
        $(this).css('height', this.scrollHeight - 4 + 'px')
    })


    $('.colorOutside,.colorInside').inputmask({ regex: "^[0-8]{1}", placeholder: "" })

    $('#tax input,.markUp input,.markDown input').inputmask({ regex: "^[0-9]{0,3}(\\.\\d{1,2})?$", placeholder: "" })
    $('.MarkingPercentMaterial input, .MarkingPercentProduction input').inputmask({ regex: "^[0-9]{0,3}(\\.\\d{1,2})?$", placeholder: "" })
    $('.foilstampSize,.embossSize,.debossSize,.paperCost,.paperSale,.paperPercent,.paperMarkup input, #thickness-custom-p').inputmask({ regex: "^[0-9]{1,3}(\\.\\d{1,2})?$", placeholder: "" })
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
    $('#paperGram-custom').inputmask({ regex: "^[0-9]{0,7}(\\.\\d{1,2})?$", placeholder: "" })
    $('#paperThickness-custom').inputmask({ regex: "^[0-9]{0,7}(\\.\\d{1,4})?$", placeholder: "" })
    $('#flexo_size input').inputmask({ regex: "^[0-9]{0,5}(\\.\\d{1,4})?$", placeholder: "" })

    $('body').on('click', ('.custom-corrugated'), function () {
        const index = $(this).parent().parent().parent().parent().parent().attr('index')
        if ($(this).attr('custom') == 0) {
            storeSelector(index, 0)
            managePopup('open', 'corrugated', index, 0)
        } else {
            $(this).attr('custom', 0)
            setDefaultCorrugated(index)
        }

        setUItoRecalcLayout()
        if (checkComponentInfo()) {
            recalcLayoutEachComponent(index)
            showCalcBttnPrice()
        }

        checkRequiredInput()
    })

    $('body').on('click', ('#corrugated-custom-save'), function () {
        const index = $('#index').val()
        console.log("save costom corrugated", index)
        if (checkValidateCustomCorrugated()) {
            saveCustomCorrugated()

            setUItoRecalcLayout()
            if (checkComponentInfo()) {
                recalcLayoutEachComponent(index)
                showCalcBttnPrice()
            }

            checkRequiredInput()
        }
    })

    $('body').on('click', ('#corrugated-custom-cancel'), function () {
        cancelCustomCorrugated()

        checkRequiredInput()
    })

    $('body').on('click', ('.layerCorrugated-custom,.fluteCorrugated-type'), function () {
        const index = $(this).parent().parent().parent().parent().parent().attr('index')
        const process_index = 0
        storeSelector(index, process_index)
        managePopup('open', 'corrugated', index, process_index)
        checkRequiredInput()
    })

    $('body').on('click', ('.type_custom_1,.gram_custom_1,.type_custom_2,.gram_custom_2,.type_custom_3,.gram_custom_3'), function () {
        const index = $(this).parent().parent().parent().parent().parent().parent().attr('index')
        const process_index = 0
        storeSelector(index, process_index)
        managePopup('open', 'corrugated', index, process_index)
        checkRequiredInput()
    })

    $('body').on('change', ('#corrugated-layer-custom'), function () {
        getFluteTypeOptionCustom(get_corrugated_type($(this).val()))
        setCorrugatedGramCustom($(this).val())
        $("#flute-custom").hide()
        $('#flute-info-custom').val("")
        $('#thickness-custom-p').val("")
        checkRequiredInput()
    })

    $('body').on('change', ('#corrugated-flute-custom'), function () {
        if ($(this).val() == "Custom") {
            $("#flute-custom").show()
        } else {
            $("#flute-custom").hide()
        }

        $('#flute-info-custom').val("")
        checkRequiredInput()
    })

    $('body').on('change', ('#corrugated-bath-sheet'), function () {
        if ($(this).is(":checked")) {
            $("#corrugated-size-row").show();
            $("#unit-price").text("B/Sheet")

        } else {
            $("#corrugated-size-row").hide();
            $("#unit-price").text("B/ตร.ฟุต")
        }

        checkRequiredInput()
    })

    $('body').on('change', (`.corrugatedInput input,
        .corrugatedInput select, .corrugatedInput textarea,
        .paperMarkup input, .paperInput input, .paperInput select, .paperInput textarea,
        .specialInk-container input, .specialInk-container select,
        .coating-section input, .coating-section select,
        .foilstamp-section input, .foilstamp-section select,
        .emboss-section input, .emboss-section select,
        .deboss-section input, .deboss-section select
    `), function () {
        const compIndex = $(this).closest('div.component').attr('index')
        setUItoRecalcLayout()
        showRecalcPaperUsage(compIndex)
        displaySave(false)
    })

    $('body').on('click', ('.mockup-template-tool button'), function () {
        const job_id = $(this).data('job_id') || ''

        if (job_id == '#') {
            window.location = '/estimate'
        } else {
            window.location = '/estimate?jobid=' + job_id + '&copy=1'
        }
    })


    $('#corrugated-cost-custom, #flute-side-custom, #cut-off-custom').inputmask({ regex: "^[0-9]{1,5}(\\.\\d{1,3})?$", placeholder: "" })
    //END ready function
})