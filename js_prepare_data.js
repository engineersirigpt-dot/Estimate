class Data {
    data_DB = ""
    data_Estimate = ""
    data_rfq_log = ""
    data_fetchList = ""
}

var dat = new Data

function prepareDatatoDB() {
    est.setCalculateDeliveryPrice()
    const mainData = est.mainData

    var data_user = JSON.parse(localStorage.getItem("data"))

    if (mainData.job.job_id == "") {
        var action = "new"
    } else {
        var action = "update"
    }

    if (mainData.job.print_type == 'Offset') {
        var flexo_size = null
    } else if (mainData.job.print_type == 'Flexo') {
        var flexo_size = mainData.job.flexo_size[0] + ',' + mainData.job.flexo_size[1]
    }

    const
        is_multiple_f = mainData?.job?.is_multiple_f || false,
        mainQty = mainData?.qty?.main[0]

    const listSubItemProcess = [];

    var data = {
        action: action,
        job_id: mainData.job.job_id,
        ref_copy_rfq: mainData.job.ref_copy_rfq,
        tb_rfq: {},
        tb_rfq_list: {},
        tb_rfq_price: [],
        tb_rfq_component_price: [],
        tb_rfq_component_paper: [],
        tb_rfq_component_spec: [],
        tb_rfq_component_layout: [],
        tb_rfq_log: {},
        tb_rfq_qty: [],
        tb_rfq_item: [],
        tb_rfq_paper: [],
        tb_rfq_corrugated: [],
        tb_rfq_material: [],
        tb_rfq_foilstamp: [],
        tb_rfq_bossing: [],
        tb_rfq_coating: [],
        tb_rfq_special_ink: [],
        tb_rfq_waste: [],
        tb_rfq_paperusage: [],
        tb_rfq_paperband: [],
        tb_rfq_kraftwrap: [],
        tb_rfq_carton: [],
        tb_rfq_pallet: [],
        tb_rfq_delivery: [],
        tb_rfq_subitem: [],
        tb_rfq_other: [],
        tb_rfq_file: [],
        tb_rfq_delivery_new: [],
        tb_rfq_f: [],
        tb_rfq_f_other: [],
        tb_rfq_color: [],
        tb_rfq_status_log: {},
        tb_rfq_delivery_head: [],
        tb_rfq_delivery_detail: [],
        tb_rfq_process_price: [],
        tb_rfq_carton_info: []
    }

    if (mainData?.fileUpload?.length) {
        var uploadFileList = mainData?.fileUpload?.filter(file => file?.active !== false)
        data.tb_rfq_file = uploadFileList.map((file, index) => ({
            job_id: null,
            fileId: file.id,
            fileIndex: index
        }))
    }

    data.tb_rfq_log = {
        job_data: JSON.stringify({
            ...mainData,
            fileUpload: uploadFileList
        }), edited_by: data_user.emp_id
    }

    data.tb_rfq_log.job_data = data.tb_rfq_log.job_data.replaceAll(/['–]/g, "-")
    data.tb_rfq_log.job_data = data.tb_rfq_log.job_data.replaceAll(/[”]/g, "inch ")

    const status_log = STATUS.getStatusDetails()

    const status_id = status_log.to_status_id

    data.tb_rfq_status_log = {
        job_id: '',
        emp_id: data_user.emp_id,
        from_status_id: status_log?.from_status_id || 0,
        to_status_id: status_log?.to_status_id || 0,
        remark: status_log?.remark || ''
    }

    data.tb_rfq = {
        //job_id:mainData.job.job_id,
        job_name: mainData.job.job_name.replaceAll(/['–]/g, "-"),
        //rfq_reference:,
        doc_type: 'est',
        customer_id: mainData.customer.customer_id,
        sale_id: mainData.ae.ae_id,
        estimator_id: mainData.estimator.estimator_id,
        estimate_check: mainData.estimator.estimate_check,
        is_reprinted: mainData.job.is_reprinted,
        ink_type: mainData.job.ink_type,
        print_type: mainData.job.print_type,
        flexo_size: flexo_size,
        qty_customer: mainData.qty.customer,
        qty_ae: mainData.qty.ae,
        tax: mainData.tax,
        updated_by: data_user.emp_id,
        remark: mainData?.remark.replaceAll(/["]/g, "inch") || '',
        is_use_previous_plate: mainData?.job?.is_use_previous_plate ? 1 : 0,
        // color_limit: color_limit,
        is_multiple_f: mainData.job?.is_multiple_f ? 1 : 0,
        is_different_packing: mainData.job?.is_different_packing ? 1 : 0,
        is_loss: mainData.job?.is_loss ? 1 : 0,
        is_profit_sharing: mainData.job?.is_profit_sharing ? 1 : 0,
        status_id
    }

    data.tb_rfq_list = {
        job_name: mainData.job.job_name,
        doc_type: 'est',
        customer_id: mainData.customer.customer_id,
        sale_id: mainData.ae.ae_id,
        estimator_id: mainData.estimator.estimator_id,
        estimate_check: mainData.estimator.estimate_check,
        updated_by: data_user.emp_id,
        remark: mainData?.remark,
        is_multiple_version: mainData.job?.is_multiple_f ? 1 : 0,
        is_different_packing: mainData.job?.is_different_packing ? 1 : 0,
        is_loss: mainData.job?.is_loss ? 1 : 0,
        is_profit_sharing: mainData.job?.is_profit_sharing ? 1 : 0,
        status_id,
        est_type: 'packaging',
        log_data: JSON.stringify(mainData.job),
        credit_term_id: mainData?.job?.credit_term_id || '',
        credit_term_name: mainData?.job?.credit_term_name || '',
    }

    if (!mainData?.totalprice?.length) {
        dat.data_DB = data
        return false
    }

    mainData?.totalprice?.length && mainData.qty.main.forEach((item, index) => {
        data.tb_rfq_qty.push({
            //job_id:mainData.job.job_id,
            //qty_id:index+1,
            qty_main: item,
            qty_runon: mainData.qty.runon[index],
            qty_total: mainData.qty.totalqty[index],
            material_price: mainData.totalprice[index].material,
            plate_price: mainData.totalprice[index].plate,
            print_price: mainData.totalprice[index].print,
            afterpress_price: mainData.totalprice[index].afterpress,
            packing_price: mainData.totalprice[index].delivery,
            subtotal_price: mainData.totalprice[index].total_price,
            total_price: mainData.totalprice[index].final_price,
            unit_price: mainData.totalprice[index].unit_price,
            tax: mainData.totalprice[index].tax,

            customer_gift: mainData.totalprice[index]?.customer_gift || 0,
            price_diff: mainData.totalprice[index]?.price_diff || 0,
            // ! update 19.04.22
            // marking_percent: mainData.totalprice[index]?.marking_percent,
            marking_percent: mainData.totalprice[index]?.marking_percent || 0,

            mark_up_percent: mainData.totalprice[index]?.mark_up_percent || 0,
            mark_down_percent: mainData.totalprice[index]?.mark_down_percent || mainData.totalprice[index]?.marking_percent || 0,
            mark_up_price: mainData.totalprice[index]?.mark_up_price || 0,
            mark_down_price: mainData.totalprice[index]?.mark_down_price || 0,
            loss: mainData.totalprice[index]?.loss || 0,
            profit_sharing: mainData.totalprice[index]?.profit_sharing || 0,
        })

        data.tb_rfq_price.push({
            qty_id: index,
            qty: item,
            main_qty: item,
            main_total_qty: mainData.qty.totalqty[index],

            runon_qty: mainData.qty.runon[index],
            ae_qty: mainData.qty.ae,
            customer_qty: mainData.qty.customer,

            unit_price: mainData.totalprice[index].unit_price,
            unit_price_fob: 0,
            unit_price_exchange: mainData.totalprice[index].unit_price_exchange,
            sub_total_price: mainData.totalprice[index].total_price,
            total_price: mainData.totalprice[index].final_price,
            currency_no: mainData?.currency_no || 'THB',
            exchange_rate: mainData?.exchange_rate || 1,
            customer_gift: mainData.totalprice[index]?.customer_gift || 0,
            customer_price_diff: mainData.totalprice[index]?.price_diff || 0,
            customer_price_diff_ratio: mainData?.priceDiff[index] || 0,
            profit_sharing: mainData.totalprice[index]?.profit_sharing || 0,
            marking_percent: mainData.totalprice[index]?.mark_up_percent + (-mainData.totalprice[index]?.mark_down_percent) || 0,
            marking_price: mainData.totalprice[index]?.mark_up_price + (-mainData.totalprice[index]?.mark_down_price) || 0,
            tax: mainData.totalprice[index].tax,
            tax_percent: mainData?.tax || 0,
            est_type: 'packaging',

            total_material: mainData.totalprice[index]?.material || 0,
            total_plate: mainData.totalprice[index]?.plate || 0,
            total_proof: mainData.totalprice[index]?.proof || 0,
            total_print: mainData.totalprice[index]?.print || 0,
            total_process: mainData.totalprice[index]?.afterpress || 0,
            total_other: mainData.totalprice[index]?.other || 0,
            total_packing: mainData.totalprice[index]?.delivery || 0,

            sub_total_price_material: mainData.totalprice[index]?.sub_total_price_material || 0,
            total_marking_material: mainData.totalprice[index]?.total_marking_material || 0,
            sub_total_price_material_marking: mainData.totalprice[index]?.sub_total_price_material_marking || 0,
            sub_total_price_production: mainData.totalprice[index]?.sub_total_price_production || 0,
            total_marking_production: mainData.totalprice[index]?.total_marking_production || 0,
            sub_total_price_production_marking: mainData.totalprice[index]?.sub_total_price_production_marking || 0,
            total_marking_material_production: mainData.totalprice[index]?.total_marking_material_production || 0,
        })

        data.tb_rfq_component_price.push({
            qty_id: index,
            qty: item,
            total_qty: mainData.qty.totalqty[index],

            runon_qty: mainData.qty.runon[index],
            ae_qty: mainData.qty.ae,
            customer_qty: mainData.qty.customer,

            unit_price: mainData.totalprice[index].unit_price,
            unit_price_fob: 0,
            unit_price_fob_thb: mainData.totalprice[index].unit_price,
            unit_price_fob_exchange: mainData.totalprice[index].unit_price_exchange,
            sub_total_price: mainData.totalprice[index].total_price,
            total_price: mainData.totalprice[index].final_price,
            currency_no: mainData?.currency_no || 'THB',
            exchange_rate: mainData?.exchange_rate || 1,
            fob_percent: 0,
            est_type: 'packaging',
            component_name: 'Packaging',
            component_index: 0,

            customer_gift: mainData.totalprice[index]?.customer_gift || 0,
            customer_price_diff: mainData.totalprice[index]?.price_diff || 0,
            customer_price_diff_ratio: mainData?.priceDiff[index] || 0,
            profit_sharing: mainData.totalprice[index]?.profit_sharing || 0,
            marking_percent: mainData.totalprice[index]?.mark_up_percent + (-mainData.totalprice[index]?.mark_down_percent) || 0,
            marking_price: mainData.totalprice[index]?.mark_up_price + (-mainData.totalprice[index]?.mark_down_price) || 0,
            tax: mainData.totalprice[index].tax,
            tax_percent: mainData?.tax || 0,

            total_material: mainData.totalprice[index]?.material || 0,
            total_plate: mainData.totalprice[index]?.plate || 0,
            total_proof: mainData.totalprice[index]?.proof || 0,
            total_print: mainData.totalprice[index]?.print || 0,
            total_process: mainData.totalprice[index]?.afterpress || 0,
            total_other: mainData.totalprice[index]?.other || 0,
            total_packing: mainData.totalprice[index]?.delivery || 0,

            is_loss: mainData.totalprice[index]?.loss != 0 ? 1 : 0,
            total_loss: mainData.totalprice[index]?.loss || 0,


            sub_total_price_material: mainData.totalprice[index]?.sub_total_price_material ?? 0,
            marking_percent_material: mainData.totalprice[index]?.marking_material_percent ?? 0,
            marking_price_material: mainData.totalprice[index]?.total_marking_material ?? 0,
            sub_total_price_material_marking: mainData.totalprice[index]?.sub_total_price_material_marking ?? 0,
            unit_price_material: mainData.totalprice[index]?.unit_price_material ?? 0,
            unit_price_material_marking: mainData.totalprice[index]?.unit_price_material_marking ?? 0,

            sub_total_price_production: mainData.totalprice[index]?.sub_total_price_production ?? 0,
            marking_percent_production: mainData.totalprice[index]?.marking_production_percent ?? 0,
            marking_price_production: mainData.totalprice[index]?.total_marking_production ?? 0,
            sub_total_price_production_marking: mainData.totalprice[index]?.sub_total_price_production_marking ?? 0,
            unit_price_production: mainData.totalprice[index]?.unit_price_production ?? 0,
            unit_price_production_marking: mainData.totalprice[index]?.unit_price_production_marking ?? 0,
            marking_price_material_production: mainData.totalprice[index]?.total_marking_material_production ?? 0,
        })
    })

    mainData.component1.forEach((item, index) => {
        if (item.layout_manual) {
            var is_layoutManual = 1
        } else {
            var is_layoutManual = 0
        }

        var p = item.packaging_size
        var t = item.paper_tolerance

        var machine_id = item.machine.machine_size.id

        data.tb_rfq_component_spec.push({
            component_index: index,
            component_name: item?.component_name,
            weight: item?.weight?.weight,
            net_weight: item?.weight?.weight,
            gross_weight: item?.weight?.weight,
            est_type: 'packaging'
        })

        data.tb_rfq_item.push({
            component_id: index + 1,
            component_name: item.component_name,
            component_type: item.component_type.type,
            template_id: item.box_type.type_id,
            packing_layer: item.box_type.packing_layer,
            glued_spot: item.box_type.glued_spot,
            fcol: item.color?.outside || 0,
            bcol: item.color?.inside || 0,
            all_color: item.color?.all || 0,
            all_gram: item.gram,
            finishSize_width: item.packaging_size.fold_size[3],
            finishSize_length: item.packaging_size.fold_size[4],
            finishSize_depth: item.packaging_size.fold_size[5],
            openSize_width: item.packaging_size.open_size[2],
            openSize_length: item.packaging_size.open_size[3],
            packingSize_width: item.packaging_size.packing_size[2],
            packingSize_length: item.packaging_size.packing_size[3],
            is_layoutManual: is_layoutManual,
            machineSize_type: machine_id,
            ////machineSize_name:,
            laySize_width: item.layout.laySize[2],
            laySize_length: item.layout.laySize[3],
            layout: item.layout.selected_layout.layout[0] + ',' + item.layout.selected_layout.layout[1],
            dimension: p.width + ',' + p.length + ',' + p.depth + ',' + p.glue_flap + ',' + p.tuck_flap + ',' + p.dust_flap + ',' + p.ol,
            tolerance: t.gripper + ',' + t.color_bar + ',' + t.paper_edge + ',' + t.bleed,
            ups: item.paper_usage.ups,
            sig: item.paper_usage.sig,
            split: item.paper_usage.split,
            thickness: item.thickness.mm.thickness,
            packing_thickness: item.thickness.mm.packing_thickness,
            weight: item.weight.weight,

            paperSize_width: item.paperSize[0],
            paperSize_length: item.paperSize[1],
            paperSize_width_in: item.paperSize[2],
            paperSize_length_in: item.paperSize[3],
            roll_width: item.paper_info.roll_width,
            cut_off: item.paper_info.cut_off,

            dummy_paper_align: item.paper_info.dummy_paper_align,
            paper_align: item.paper_info.paper_align,
            paper_grain: item.paper_info.paper_grain,
            parallel_rollWidth: item.paper_info.parallel_roll_width,
            is_switchDisplay: item.paper_info.is_switchDisplay,

            std_paper_id: item.paper_info.std_paper_id,
            layout_grain: item.layout.layout_grain,

            is_editLayout: item?.layout?.is_editLayout ? 1 : 0,
            is_editTolerance: t?.is_editTolerance ? 1 : 0,
            std_layout_id: item.layout?.std_layout_id || null
        })

        //* store paper
        if (item.component_type.type != 3) {
            //* component type => paper or paper+corrugated
            if (item.paper.sheet_unit_price) {
                var is_sheetUnitPrice = 1
            } else {
                var is_sheetUnitPrice = 0
            }
            data.tb_rfq_paper.push({
                component_id: index + 1,
                paper_code: item.paper.paper_code,
                gram: item.paper.paper_gram,
                mark_up: item.paper.paper_markup,
                rollCut_percent: item.paper.paper_percent,
                is_sheetUnitPrice: is_sheetUnitPrice,
                is_custom: item.paper.is_custom,
                cost: item.paper.paper_cost,
                total_cost: item.paper.paper_total_price,
                thickness: item.paper.paper_thickness,
                remark: item.paper.remark
            })
        }

        //* store corrugated
        if (item.component_type.type != 1) {
            //* component type => corrugated or paper+corrugated
            data.tb_rfq_corrugated.push({
                component_id: index + 1,
                name: item.corrugated_layer.info.name,
                flute_type: item.corrugated_layer.info.flute_type,
                flute_align: item.corrugated_layer.info.flute_align,
                num_layer: item.corrugated_layer.info.num_layer,
                thickness: item.corrugated_layer.info.thickness,
                all_gram: item.corrugated_layer.info.all_gram,
                gram: item.corrugated_layer.info.gram.join(),
                corrugated_glued_cost: item.corrugated_layer.info.corrugated_glued_cost,
                mark_up: item.corrugated_layer.info.corrugated_markup,
                cost: item.corrugated_layer.info.cost.join(),
                unitPrice_inch: item.corrugated_layer.info.unit_inch.join(),
                unit_price: item.corrugated_layer.info.unit_price.join(),
                flute_side: item.corrugated_layer.info.flute_side,
                cut_off: item.corrugated_layer.info.cut_off,
                component_flute_side: item.corrugated_layer.component_flute_side,
                remark: item.corrugated_layer.info.remark
            })

            item.corrugated_layer.price.forEach((item1, index1) => {
                listSubItemProcess.push({
                    component_id: index + 1,
                    component_name: item?.box_type?.type_name || item?.component_name,
                    component_name_custom: item?.component_name,
                    part_name: item?.component_type?.detail_th || null,
                    part_name_custom: item?.component_type?.detail_th || null,
                    process_type_id: item.corrugated_layer.type_id,
                    process_type_name: item.corrugated_layer.type,
                    process_id: item.corrugated_layer.process_id,
                    process_name: item.corrugated_layer.name,
                    //price_type_id:,
                    price_type_name: 'all',
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    proc_qty: item1.qty,
                    unit_price: item1.unit_price,
                    price: item1.price,
                    version_name: null,
                })
            })
        }

        //* store process
        if (item.process.length > 0) {
            item.process.forEach((item1) => {
                if (item1.name == 'diecut') {
                    item1.line.forEach((item2, index2) => {
                        listSubItemProcess.push(
                            {
                                component_id: index + 1,
                                component_name: item?.box_type?.type_name || item?.component_name,
                                component_name_custom: item?.component_name,
                                part_name: item?.component_type?.detail_th || null,
                                part_name_custom: item?.component_type?.detail_th || null,
                                process_type_id: item1.type_id,
                                process_type_name: item1.type,
                                process_id: item1.process_id,
                                process_name: item1.name,
                                //price_type_id:,
                                price_type_name: 'labor',
                                job_qty: mainData.qty.main[index2],
                                proc_qty: item2.labor.qty,
                                unit_price: item2.labor.unit_price,
                                price: item2.labor.price,
                                version_name: null,
                            },
                            {
                                component_id: index + 1,
                                component_name: item?.box_type?.type_name || item?.component_name,
                                component_name_custom: item?.component_name,
                                part_name: item?.component_type?.detail_th || null,
                                part_name_custom: item?.component_type?.detail_th || null,
                                process_type_id: item1.type_id,
                                process_type_name: item1.type,
                                process_id: item1.process_id,
                                process_name: item1.name,
                                //price_type_id:,
                                price_type_name: 'block',
                                job_qty: mainData.qty.main[index2],
                                proc_qty: item2.block.qty,
                                unit_price: item2.block.unit_price,
                                price: item2.block.price,
                                version_name: null,
                            },
                        )
                    })
                } else {
                    item1.line.forEach((item2, index2) => {
                        listSubItemProcess.push({
                            component_id: index + 1,
                            component_name: item?.box_type?.type_name || item?.component_name,
                            component_name_custom: item?.component_name,
                            part_name: item?.component_type?.detail_th || null,
                            part_name_custom: item?.component_type?.detail_th || null,
                            process_type_id: item1.type_id,
                            process_type_name: item1.type,
                            process_id: item1.process_id,
                            process_name: item1.name,
                            //price_type_id:,
                            price_type_name: 'all',
                            job_qty: mainData.qty.main[index2],
                            proc_qty: item2.qty,
                            unit_price: item2.unit_price,
                            price: item2.price,
                            version_name: null,
                        })
                    })
                }
            })
        }

        //* store add-on
        if (item.addon.length > 0) {
            var num_foilstamp = 0, num_coating = 0, num_emboss = 0, num_deboss = 0

            const foil_process = []
            item.addon.forEach((item1) => {
                if (item1.type == 'foilstamp') {
                    num_foilstamp += 1

                    data.tb_rfq_foilstamp.push({
                        //job_id:mainData.job.job_id,
                        component_id: index + 1,
                        foilstamp_id: num_foilstamp,
                        //process_id:3,
                        is_customFoil: item1.info.is_customFoil,
                        code: item1.info.code,
                        color: item1.info.color,
                        color_th: item1.info.color_th,
                        film_rate: item1.info.film_rate,
                        block_rate: item1.info.block_rate,
                        unitPrice_film: item1.info.block.film_unit_price,
                        unitPrice_block: item1.info.block.block_unit_price,
                        foilRoll_length: item1.info.foil_length,
                        foilRoll_width: item1.info.foil_width,
                        foilRoll_price: item1.info.foil_roll_price,
                        foilRoll_min_price: item1.info.foil_roll_min_price,
                        unitPrice_foil: item1.info.foil_unit_price,
                        pcs_per_roll: item1.info.pcs_per_roll,
                        ////labor_rate:,
                        width: item1.info.width,
                        length: item1.info.length
                    })

                    if (item1.info?.f_code?.length > 0) {
                        data.tb_rfq_f_other.push({
                            job_id: null,
                            f_code: item1.info?.f_code?.join(',') || '',
                            field_key: 'foilstamp',
                            field_index: num_foilstamp - 1,
                            remark: 'f_code for this foilstamp'
                        })
                    }

                    item1.line.forEach((item2, index2) => {

                        if (!foil_process?.includes(item1?.info?.process_index)) {
                            foil_process.push(item1?.info?.process_index)

                            const roll_unit_price = item?.addon?.filter(obj => obj.type == 'foilstamp' && obj.info?.process_index == item1?.info?.process_index)?.reduce((acc, obj) => acc + obj.line[index2]?.foil_roll?.unit_price, 0)
                            const qty = item2.foil_roll.qty
                            let total_price = parseFloat((roll_unit_price * qty).toFixed(2))

                            if (total_price < item1.info.foil_roll_min_price) {
                                total_price = item1.info.foil_roll_min_price
                            }

                            listSubItemProcess.push(
                                {
                                    component_id: index + 1,
                                    component_name: item?.box_type?.type_name || item?.component_name,
                                    component_name_custom: item?.component_name,
                                    part_name: item?.component_type?.detail_th || null,
                                    part_name_custom: item?.component_type?.detail_th || null,
                                    process_type_id: item1.type_id,
                                    process_type_name: item1.type,
                                    process_id: item1.process_id,
                                    process_name: `Foil หน้าม้วน ${item1?.info?.foil_width}" ความยาว ${item1?.info?.foil_length} ft`,
                                    //price_type_id:,
                                    price_type_name: 'roll',
                                    job_qty: mainData.qty.main[index2],
                                    proc_qty: qty,
                                    unit_price: roll_unit_price,
                                    price: total_price,
                                    version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                },
                                {
                                    component_id: index + 1,
                                    component_name: item?.box_type?.type_name || item?.component_name,
                                    component_name_custom: item?.component_name,
                                    part_name: item?.component_type?.detail_th || null,
                                    part_name_custom: item?.component_type?.detail_th || null,
                                    process_type_id: item1.type_id,
                                    process_type_name: item1.type,
                                    process_id: item1.process_id,
                                    process_name: item1.name,
                                    //price_type_id:,
                                    price_type_name: 'labor',
                                    job_qty: mainData.qty.main[index2],
                                    proc_qty: item2.labor.qty,
                                    unit_price: item2.labor.unit_price,
                                    price: item2.labor.price,
                                    version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                },
                                {
                                    component_id: index + 1,
                                    component_name: item?.box_type?.type_name || item?.component_name,
                                    component_name_custom: item?.component_name,
                                    part_name: item?.component_type?.detail_th || null,
                                    part_name_custom: item?.component_type?.detail_th || null,
                                    process_type_id: item1.type_id,
                                    process_type_name: item1.type,
                                    process_id: item1.process_id,
                                    process_name: `Block ${item1.name} (${item1?.info?.size[0]}" x ${item1?.info?.size[1]}")`,
                                    //price_type_id:,
                                    price_type_name: 'block',
                                    job_qty: mainData.qty.main[index2],
                                    proc_qty: item2.block.qty,
                                    unit_price: item2.block.unit_price,
                                    price: item2.block.price,
                                    version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                }
                            )
                        } else {
                            // * duplicate foilstamp
                            listSubItemProcess.push(
                                {
                                    component_id: index + 1,
                                    component_name: item?.box_type?.type_name || item?.component_name,
                                    component_name_custom: item?.component_name,
                                    part_name: item?.component_type?.detail_th || null,
                                    part_name_custom: item?.component_type?.detail_th || null,
                                    process_type_id: item1.type_id,
                                    process_type_name: item1.type,
                                    process_id: item1.process_id,
                                    process_name: `Block ${item1.name} (${item1?.info?.size[0]}" x ${item1?.info?.size[1]}")`,
                                    //price_type_id:,
                                    price_type_name: 'block',
                                    job_qty: mainData.qty.main[index2],
                                    proc_qty: item2.block.qty,
                                    unit_price: item2.block.unit_price,
                                    price: item2.block.price,
                                    version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                }
                            )
                        }
                    })
                } else if (item1.type == 'emboss') {
                    num_emboss += 1
                    data.tb_rfq_bossing.push({
                        //job_id:mainData.job.job_id,
                        component_id: index + 1,
                        bossing_id: num_emboss,
                        process_id: 4,
                        bossing_type: item1.type,
                        depth_type: item1.info.depth_type,
                        depth: item1.info.depth,
                        film_rate: item1.info.film_rate,
                        block_rate: item1.info.block_rate,
                        unitPrice_film: item1.info.block.film_unit_price,
                        unitPrice_block: item1.info.block.block_unit_price,
                        width: item1.info?.width || 0,
                        length: item1.info?.length || 0,
                        ////labor_rate:,
                    })

                    if (item1.info?.f_code?.length > 0) {
                        data.tb_rfq_f_other.push({
                            job_id: null,
                            f_code: item1.info?.f_code?.join(',') || '',
                            field_key: 'emboss',
                            field_index: num_emboss - 1,
                            remark: 'f_code for this emboss'
                        })
                    }

                    item1.line.labor?.forEach((labor, index2) => {
                        listSubItemProcess.push(
                            {
                                component_id: index + 1,
                                component_name: item?.box_type?.type_name || item?.component_name,
                                component_name_custom: item?.component_name,
                                part_name: item?.component_type?.detail_th || null,
                                part_name_custom: item?.component_type?.detail_th || null,
                                process_type_id: item1.type_id,
                                process_type_name: item1.type,
                                process_id: item1.process_id,
                                process_name: item1.name,
                                price_type_id: null,
                                price_type_name: 'labor',
                                job_qty: mainData.qty.main[index2],
                                proc_qty: labor.qty,
                                unit_price: labor.unit_price,
                                price: labor.price,
                                version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                            },
                        )
                    })

                    item1.line.block.forEach((block, bIndex) => {
                        block?.line?.forEach((line, index2) => {
                            listSubItemProcess.push(
                                {
                                    component_id: index + 1,
                                    component_name: item?.box_type?.type_name || item?.component_name,
                                    component_name_custom: item?.component_name,
                                    part_name: item?.component_type?.detail_th || null,
                                    part_name_custom: item?.component_type?.detail_th || null,
                                    process_type_id: item1.type_id,
                                    process_type_name: item1.type,
                                    process_id: item1.process_id,
                                    process_name: `Block ${item1.name} (${block?.size[0]}" x ${block?.size[1]}")`,
                                    price_type_id: null,
                                    price_type_name: 'block',
                                    job_qty: mainData.qty.main[index2],
                                    proc_qty: line.qty,
                                    unit_price: line.unit_price,
                                    price: line.price,
                                    version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                }
                            )
                        })
                    })
                } else if (item1.type == 'deboss') {
                    num_deboss += 1
                    data.tb_rfq_bossing.push({
                        //job_id:mainData.job.job_id,
                        component_id: index + 1,
                        bossing_id: num_deboss,
                        process_id: 5,
                        bossing_type: item1.type,
                        depth_type: item1.info.depth_type,
                        depth: item1.info.depth,
                        film_rate: item1.info.film_rate,
                        block_rate: item1.info.block_rate,
                        unitPrice_film: item1.info.block.film_unit_price,
                        unitPrice_block: item1.info.block.block_unit_price,
                        width: item1.info?.width || 0,
                        length: item1.info?.length || 0,
                        ////labor_rate:,
                    })

                    if (item1.info?.f_code?.length > 0) {
                        data.tb_rfq_f_other.push({
                            job_id: null,
                            f_code: item1.info?.f_code?.join(',') || '',
                            field_key: 'deboss',
                            field_index: num_deboss - 1,
                            remark: 'f_code for this deboss'
                        })
                    }

                    item1.line?.labor?.forEach((labor, index2) => {
                        listSubItemProcess.push(
                            {
                                component_id: index + 1,
                                component_name: item?.box_type?.type_name || item?.component_name,
                                component_name_custom: item?.component_name,
                                part_name: item?.component_type?.detail_th || null,
                                part_name_custom: item?.component_type?.detail_th || null,
                                process_type_id: item1.type_id,
                                process_type_name: item1.type,
                                process_id: item1.process_id,
                                process_name: item1.name,
                                price_type_id: null,
                                price_type_name: 'labor',
                                job_qty: mainData.qty.main[index2],
                                proc_qty: labor.qty,
                                unit_price: labor.unit_price,
                                price: labor.price,
                                version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                            }
                        )
                    })


                    item1.line?.block?.forEach((block, bIndex) => {
                        block?.line?.forEach((line, index2) => {
                            listSubItemProcess.push(
                                {
                                    component_id: index + 1,
                                    component_name: item?.box_type?.type_name || item?.component_name,
                                    component_name_custom: item?.component_name,
                                    part_name: item?.component_type?.detail_th || null,
                                    part_name_custom: item?.component_type?.detail_th || null,
                                    process_type_id: item1.type_id,
                                    process_type_name: item1.type,
                                    process_id: item1.process_id,
                                    process_name: `Block ${item1.name} (${block?.size[0]}" x ${block?.size[1]}")`,
                                    price_type_id: null,
                                    price_type_name: 'block',
                                    job_qty: mainData.qty.main[index2],
                                    proc_qty: line.qty,
                                    unit_price: line.unit_price,
                                    price: line.price,
                                    version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                }
                            )
                        })
                    })
                } else if (item1.type == 'coating') {
                    num_coating += 1
                    data.tb_rfq_coating.push({
                        //job_id:mainData.job.job_id,
                        component_id: index + 1,
                        coating_id: num_coating,
                        process_id: item1.process_id,
                        code: item1.info.code,
                        ////type:,
                        width: item1.info.width,
                        length: item1.info.length,
                        coating_option: item1.info.name,
                        material_type: item1.info.material_type,
                        side: item1.info.side,
                        unit_min_cost: item1.info.unit_min_cost,
                        min_cost: item1.info.min_cost,
                        unit_price: item1.info.coating_price,
                    })

                    item1.line.forEach((item2, index2) => {
                        listSubItemProcess.push({
                            component_id: index + 1,
                            component_name: item?.box_type?.type_name || item?.component_name,
                            component_name_custom: item?.component_name,
                            part_name: item?.component_type?.detail_th || null,
                            part_name_custom: item?.component_type?.detail_th || null,

                            process_id: item1.process_id,
                            process_type_id: item1.type_id,
                            process_type_name: item1.type,
                            process_name: `${item1?.info?.name} ${item1?.info?.type} ${item1?.info?.side} s ${item1?.info?.code == 'S-UV' ? `(${item1?.info?.width}" x ${item1?.info?.length}")` : ''}`,
                            //price_type_id:,
                            price_type_name: 'all',
                            job_qty: mainData.qty.main[index2],
                            proc_qty: item2.qty,
                            unit_price: item2.unit_price,
                            price: item2.price,
                            version_name: null,
                        })
                    })
                }
            })
        }

        //* store color , special ink
        if (item.color && item.color?.length > 0) {
            item.color.forEach((color, colorIndex) => {
                color?.special_ink.forEach((item1, index1) => {
                    data.tb_rfq_special_ink.push({
                        component_id: index + 1,
                        special_ink_id: index1 + 1,
                        process_id: item1.process_id,
                        special_ink_name: item1.info.ink_name,
                        print_style: item1.info.print_style,
                        paper_code: item1.info.paper_code,
                    })

                    item1.line.forEach((item2, index2) => {
                        listSubItemProcess.push({
                            component_id: index + 1,
                            component_name: item?.box_type?.type_name || item?.component_name,
                            component_name_custom: item?.component_name,
                            part_name: item?.component_type?.detail_th || null,
                            part_name_custom: item?.component_type?.detail_th || null,

                            process_id: item1.process_id,
                            process_type_id: item1.type_id,
                            process_type_name: item1.type,
                            process_name: `Special Ink : ${item1.info.ink_name} : ${item1?.name} - ${item1?.info?.print_style == 'stripe' ? 'ตีพื้น' : 'ลายเส้น'}`,
                            //price_type_id:,
                            price_type_name: 'all',
                            job_qty: mainData.qty.main[index2],
                            proc_qty: item2.qty,
                            unit_price: item2.unit_price,
                            price: item2.price,
                            version_name: (mainData?.job?.is_multiple_f && item?.f_detail?.f_list[colorIndex]?.f_code) || null,
                        })
                    })

                    if (color?.f_code) {
                        data.tb_rfq_f_other.push({
                            job_id: null,
                            f_code: color?.f_code,
                            field_key: 'color',
                            field_index: colorIndex,
                            remark: 'f_code for this color'
                        })
                    }
                })

                data.tb_rfq_color.push({
                    inside: color?.inside,
                    outside: color?.outside,
                    all_color: color?.all,
                    f_code: color?.f_code || '',
                    component_id: index,
                    job_id: null,
                })
            })
        }

        //* store waste
        data.tb_rfq_waste.push({
            //job_id:mainData.job.job_id,
            component_id: index + 1,
            total_waste: item.waste.waste.join(),
            print_waste: item.waste.waste_print.join(),
            printColAdd_waste: item.waste.waste_print_col_add.join(),
            corrugated_waste: item.waste.waste_corrugated_board.join(),
            coating_waste: item.waste.waste_coating.join(),
            bossing_waste: item.waste.waste_bossing.join(),
            foilstamp_waste: item.waste.waste_foilstamp.join(),
            afterpress_waste: item.waste.waste_afterpress.join(),
            colorLimit_waste: item.waste?.waste_color_limit?.join(),
        })

        var job_qty = [],
            after_ups = [],
            waste = [],
            after_waste = [],
            paper_print = [],
            paper_qty = [],
            paper_net = [],
            kg = [],
            ton = []

        item.paper_usage.line.forEach((item1, index1) => {
            job_qty.push(item1.qty)
            after_ups.push(item1.after_ups)
            waste.push(item1.waste)
            after_waste.push(item1.after_waste)
            paper_print.push(item1.paper_print)
            paper_qty.push(item1.paper_qty)
            paper_net.push(item1.paper_net)
            kg.push(item1.kilogram)
            ton.push(item1.ton)

            if (item.component_type.type != 3) {
                listSubItemProcess.push({
                    component_id: index + 1,
                    component_name: item?.box_type?.type_name || item?.component_name,
                    component_name_custom: item?.component_name,
                    part_name: item?.component_type?.detail_th || null,
                    part_name_custom: item?.component_type?.detail_th || null,
                    process_type_id: item1.price.paper.type_id,
                    process_type_name: item1.price.paper.type,
                    process_id: item1.price.paper.process_id,
                    process_name: item1.price.paper.name,
                    //price_type_id:,
                    price_type_name: 'all',
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    proc_qty: item1.price.paper.qty,
                    unit_price: item1.price.paper.unit_price,
                    price: item1.price.paper.price,
                    version_name: (mainData?.job?.is_multiple_f && item?.f_detail?.f_list[index1]?.f_code) || null,
                })
            }

            if (item1?.price?.proof) {
                listSubItemProcess.push({
                    component_id: index + 1,
                    component_name: item?.box_type?.type_name || item?.component_name,
                    component_name_custom: item?.component_name,
                    part_name: item?.component_type?.detail_th || null,
                    part_name_custom: item?.component_type?.detail_th || null,
                    process_type_id: item1.price.proof.type_id,
                    process_type_name: item1.price.proof.type,
                    process_id: item1.price.proof.process_id,
                    process_name: item1.price.proof.name,
                    //price_type_id:,
                    price_type_name: 'all',
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    proc_qty: item1.price.proof?.all?.qty,
                    unit_price: item1.price.proof?.all?.unit_price,
                    price: item1.price.proof?.all?.price,
                    version_name: null,
                })
            }

            listSubItemProcess.push(
                {
                    //job_id:mainData.job.job_id,
                    component_id: index + 1,
                    component_name: item?.box_type?.type_name || item?.component_name,
                    component_name_custom: item?.component_name,
                    part_name: item?.component_type?.detail_th || null,
                    part_name_custom: item?.component_type?.detail_th || null,
                    process_type_id: item1.price.plate.type_id,
                    process_type_name: item1.price.plate.type,
                    process_id: item1.price.plate.process_id,
                    process_name: item1.price.plate.name,
                    //price_type_id:,
                    price_type_name: 'inside',
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    proc_qty: item1.price.plate.inside.qty,
                    unit_price: item1.price.plate.inside.unit_price,
                    price: item1.price.plate.inside.price,
                    version_name: (mainData?.job?.is_multiple_f && item?.f_detail?.f_list[index1]?.f_code) || null,
                },
                {
                    //job_id:mainData.job.job_id,
                    component_id: index + 1,
                    component_name: item?.box_type?.type_name || item?.component_name,
                    component_name_custom: item?.component_name,
                    part_name: item?.component_type?.detail_th || null,
                    part_name_custom: item?.component_type?.detail_th || null,
                    process_type_id: item1.price.plate.type_id,
                    process_type_name: item1.price.plate.type,
                    process_id: item1.price.plate.process_id,
                    process_name: item1.price.plate.name,
                    //price_type_id:,
                    price_type_name: 'outside',
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    proc_qty: item1.price.plate.outside.qty,
                    unit_price: item1.price.plate.outside.unit_price,
                    price: item1.price.plate.outside.price,
                    version_name: (mainData?.job?.is_multiple_f && item?.f_detail?.f_list[index1]?.f_code) || null,
                },
                {
                    //job_id:mainData.job.job_id,
                    component_id: index + 1,
                    component_name: item?.box_type?.type_name || item?.component_name,
                    component_name_custom: item?.component_name,
                    part_name: item?.component_type?.detail_th || null,
                    part_name_custom: item?.component_type?.detail_th || null,
                    process_type_id: item1.price.print.type_id,
                    process_type_name: item1.price.print.type,
                    process_id: item1.price.print.process_id,
                    process_name: item1.price.print.name,
                    //price_type_id:,
                    price_type_name: 'outside',
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    proc_qty: item1.price.print.outside.qty,
                    unit_price: item1.price.print.outside.unit_price,
                    price: item1.price.print.outside.price,
                    version_name: (mainData?.job?.is_multiple_f && item?.f_detail?.f_list[index1]?.f_code) || null,
                },
                {
                    //job_id:mainData.job.job_id,
                    component_id: index + 1,
                    component_name: item?.box_type?.type_name || item?.component_name,
                    component_name_custom: item?.component_name,
                    part_name: item?.component_type?.detail_th || null,
                    part_name_custom: item?.component_type?.detail_th || null,
                    process_type_id: item1.price.print.type_id,
                    process_type_name: item1.price.print.type,
                    process_id: item1.price.print.process_id,
                    process_name: item1.price.print.name,
                    //price_type_id:,
                    price_type_name: 'inside',
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    proc_qty: item1.price.print.inside.qty,
                    unit_price: item1.price.print.inside.unit_price,
                    price: item1.price.print.inside.price,
                    version_name: (mainData?.job?.is_multiple_f && item?.f_detail?.f_list[index1]?.f_code) || null,
                },
            )

        })

        data.tb_rfq_paperusage.push({
            //job_id:mainData.job.job_id,
            component_id: index + 1,
            job_qty: job_qty.join(),
            after_ups: after_ups.join(),
            waste: waste.join(),
            after_waste: after_waste.join(),
            paper_print: paper_print.join(),
            paper_qty: paper_qty.join(),
            paper_net: paper_net.join(),
            kg: kg.join(),
            ton: ton.join(),
        })

        item.packing?.forEach(fPack => {
            fPack?.forEach((item1, fIndex) => {
                var n_paperband = -1
                if (item1.name == 'paperband') {
                    n_paperband += 1
                    data.tb_rfq_paperband.push({
                        //job_id:mainData.job.job_id,
                        component_id: index + 1,
                        paperband_type: item1.info.type,
                        thickness: item1.info.thickness,
                        qty_per_band: item1.info.qty_per_paperband,
                        roll_length: item1.info.roll_length,
                        roll_width: item1.info.roll_width,
                        roll_price: item1.info.roll_price,
                        weight: item1.info.stack_weight,
                        size: item1.info.stack_size.join(),
                        cost_per_band: '',
                        job_qty: '',
                        paperband_qty: '',
                        roll_usage: ''
                    })
                    item1.info.paperband.forEach((item2, index2) => {
                        if (index2 != 0) {
                            data.tb_rfq_paperband[n_paperband].cost_per_band += ','
                            data.tb_rfq_paperband[n_paperband].job_qty += ','
                            data.tb_rfq_paperband[n_paperband].paperband_qty += ','
                            data.tb_rfq_paperband[n_paperband].roll_usage += ','
                        }
                        data.tb_rfq_paperband[n_paperband].cost_per_band += item2.cost_per_stack
                        data.tb_rfq_paperband[n_paperband].job_qty += item2.qty
                        data.tb_rfq_paperband[n_paperband].paperband_qty += item2.stack
                        data.tb_rfq_paperband[n_paperband].roll_usage += item2.roll_usage
                    })
                }
                if (item1.name == 'kraftwrap') {
                    data.tb_rfq_kraftwrap.push({
                        //job_id:mainData.job.job_id,
                        component_id: index + 1,
                        bulk_per_layer: item1.info.num_bulk_per_layer,
                        qty_per_layer: item1.info.num_per_layer,
                        layer: item1.info.layer_per_pack,
                        qty_per_pack: item1.info.qty_per_pack,
                        qty_per_pack_manual: item1.info.qty_per_kraftwrap,
                        num_layout: item1.info.num_side.join(),
                        bulk_height: item1.info.bulk_height.join(),
                        bulk_size: item1.info.bulk_size.join(),
                        cube_size: item1.info.cube_size.join(),
                        inner_size: item1.info.inner_size.join(),
                        outer_size: item1.info.outer_size.join(),
                        unit_price: item1.info.unit_price,
                        weight_per_layer: item1.info.weight_per_layer,
                        net_weight: item1.info.net_weight,
                        gross_weight: item1.info.gross_weight,
                        is_editKraftwrapQty: item1.info?.is_editKraftwrapQty ? 1 : 0
                    })
                }
                if (item1.name == 'carton') {
                    data.tb_rfq_carton.push({
                        //job_id:mainData.job.job_id,
                        edition_index: fIndex,
                        component_id: index,
                        bulk_size: item1.info.bulk.bulk_size.join(),
                        bulk_unit: item1.info.bulk.unit,
                        qty_per_bulk: item1.info.bulk.qty_per_bulk,
                        bulk_weight: item1.info.bulk.weight_per_bulk,
                        bulk_per_layer: item1.info.carton.bulk_per_layer,
                        layer: item1.info.carton.layer_per_carton,
                        num_layout: item1.info.carton.num_layout.join(),
                        qty_per_layer: item1.info.carton.qty_per_layer,
                        qty_per_carton: item1.info.carton.qty_per_carton,
                        weight_per_layer: item1.info.carton.weight_per_layer,
                        corrugated_allgram: item1.info.corrugated.all_gram,
                        corrugated_gram: item1.info.corrugated.gram.join(),
                        corrugated_area: item1.info.corrugated.area_corrugated,
                        corrugated_layer: item1.info.corrugated.corrugated_layer,
                        corrugated_ppu: item1.info.corrugated.board_price_per_carton,
                        corrugated_flute: item1.info.corrugated.flute_type,
                        corrugated_grade: item1.info.corrugated.grade,
                        corrugated_length: item1.info.corrugated.length_metre,
                        corrugated_ppu_inch: item1.info.corrugated.price_inch,
                        corrugated_ppu_ft: item1.info.corrugated.price,
                        corrugated_size: item1.info.corrugated.size.join(),
                        corrugated_thickness: item1.info.corrugated.thickness,
                        dummy_cube_size: item1.info.dummy_size.cube.join(),
                        dummy_inner_size: item1.info.dummy_size.inner_size.join(),
                        dummy_outer_size: item1.info.dummy_size.outer_size.join(),
                        cube_size: item1.info.size.cube.join(),
                        inner_size: item1.info.size.inner_size.join(),
                        outer_size: item1.info.size.outer_size.join(),
                        net_weight: item1.info.net_weight,
                        gross_weight: item1.info.gross_weight,
                    })

                    const gradeGram = item1.info.corrugated.grade?.split('/')
                    const gradeArr = gradeGram.map(gg => {
                        const gradeString = gg.substring(0, 2)

                        return gradeString
                    })

                    const gramArr = gradeGram.map(gg => {
                        const gram = gg.substring(2, gg?.length)

                        return gram
                    })
                    // * new - tb_rfq_carton_info
                    data.tb_rfq_carton_info.push({
                        //job_id:mainData.job.job_id,
                        edition_index: fIndex,
                        component_id: index,
                        inner_size_width_inch: item1.info.size.inner_size[0],
                        inner_size_length_inch: item1.info.size.inner_size[1],
                        inner_size_height_inch: item1.info.size.inner_size[2],
                        inner_size_width_mm: item1.info.size.inner_size[3],
                        inner_size_length_mm: item1.info.size.inner_size[4],
                        inner_size_height_mm: item1.info.size.inner_size[5],

                        outer_size_width_inch: item1.info.size.outer_size[0],
                        outer_size_length_inch: item1.info.size.outer_size[1],
                        outer_size_height_inch: item1.info.size.outer_size[2],
                        outer_size_width_mm: item1.info.size.outer_size[3],
                        outer_size_length_mm: item1.info.size.outer_size[4],
                        outer_size_height_mm: item1.info.size.outer_size[5],

                        corrugated_width_inch: item1.info.corrugated.size[2],
                        corrugated_length_inch: item1.info.corrugated.size[3],
                        corrugated_width_mm: item1.info.corrugated.size[0],
                        corrugated_length_mm: item1.info.corrugated.size[1],

                        grade_1: gradeArr?.length > 0 ? gradeArr[0] : null,
                        grade_2: gradeArr?.length > 1 ? gradeArr[1] : null,
                        grade_3: gradeArr?.length > 2 ? gradeArr[2] : null,
                        gram_1: gramArr?.length > 0 ? gramArr[0] : null,
                        gram_2: gramArr?.length > 1 ? gramArr[1] : null,
                        gram_3: gramArr?.length > 2 ? gramArr[2] : null,
                    })
                }
                if (item1.name == 'pallet') {
                    data.tb_rfq_pallet.push({
                        //job_id:mainData.job.job_id,
                        component_id: index + 1,
                        pallet_id: item1.info.pallet_id,
                        pallet_size: item1.info.pallet_size.join(),
                        pallet_price: item1.info.pallet_price,
                        delivery_id: item1.info.delivery_id,
                        delivery_type: item1.info.delivery_type,
                        bulk_per_pallet: item1.info.bulk_qty_pallet,
                        bulk_size: item1.info.bulk_size.join(),
                        cube_size: item1.info.laying.cube_size.join(),
                        layer: item1.info.layer_per_pallet,
                        bulk_per_layer: item1.info.laying.qty_layer,
                        weight_per_layer: item1.info.weight_per_layer,
                        pallet_height: item1.info.pallet_height,
                        pallet_weight: item1.info.pallet_weight,
                        qty_per_pallet: item1.info.qty_pallet,
                    })
                }

                // item1.line.forEach((item2, index2) => {
                //     listSubItemProcess.push({
                //         component_id: index + 1,
                //         component_name: item?.box_type?.type_name || item?.component_name,
                //         component_name_custom: item?.component_name,
                //         part_name: item?.component_type?.detail_th || null,
                //         part_name_custom: item?.component_type?.detail_th || null,
                //         version_name: mainData?.job?.is_different_packing ? item?.f_detail?.f_list?.length ? item?.f_detail?.f_list?.[fIndex]?.f_code : item?.component_name : null,
                //         process_type_id: item1.type_id,
                //         process_type_name: item1.type,
                //         process_id: item1.process_id,
                //         process_name: item1.name,
                //         //price_type_id:,
                //         price_type_name: 'all',
                //         job_qty: mainData.qty.main[index2],
                //         proc_qty: item2.qty,
                //         unit_price: item2.unit_price,
                //         price: item2.price,
                //         process_detail: 'packing.line'
                //     })
                // })

                item1.detail?.forEach((item2, index2) => { //* รอบส่ง
                    item2?.detail?.forEach((info, qtyIndex) => {
                        listSubItemProcess.push({
                            component_id: index + 1,
                            component_name: item?.box_type?.type_name || item?.component_name,
                            component_name_custom: item?.component_name,
                            part_name: item?.component_type?.detail_th || null,
                            part_name_custom: item?.component_type?.detail_th || null,
                            version_name: mainData?.job?.is_different_packing ? item?.f_detail?.f_list?.length ? item?.f_detail?.f_list?.[fIndex]?.f_code : item?.component_name : null,
                            process_type_id: item1.type_id,
                            process_type_name: item1.type,
                            process_id: item1.process_id,
                            process_name: item1.name,
                            //price_type_id:,
                            price_type_name: 'all',
                            job_qty: mainData.qty.main[qtyIndex],
                            proc_qty: info.qty,
                            unit_price: info.unit_price,
                            price: info.price,
                            process_detail: 'packing.detail'
                        })
                    })
                })
            })
        })

        if (item.delivery?.length > 0) {
            item.delivery?.forEach((info) => {
                data.tb_rfq_delivery.push({
                    //job_id:mainData.job.job_id,
                    component_id: index + 1,
                    net_weight: info.net_weight,
                    gross_weight: info.gross_weight,
                    unit_price: info.unit_price,
                })
            })
        } else if (item?.delivery) {
            data.tb_rfq_delivery.push({
                //job_id:mainData.job.job_id,
                component_id: index + 1,
                net_weight: item.delivery.net_weight,
                gross_weight: item.delivery.gross_weight,
                unit_price: item.delivery.unit_price,
            })
        }

        item?.f_detail?.f_list?.forEach((fInfo, fIndex) => {
            data.tb_rfq_f.push({
                job_id: null,
                f_code: fInfo?.f_code,
                f_qty: fInfo?.f_qty,
                runon_percent: fInfo?.runon_percent,
                runon_qty: fInfo?.runon_qty,
                ae_qty: fInfo?.ae_qty,
                total_qty: fInfo?.total_qty,
                customer_qty: fInfo?.customer_qty,
                component_id: index,
                remark: ''
            })
        })
    }) //* END loop component

    if (mainData.material.length > 0) {
        mainData.material.forEach((item, index) => {
            if (item.info.is_fixedPrice) {
                var is_fixedPrice = 1
                var qty_material = item.info.qty_material
            } else {
                var is_fixedPrice = 0
                var qty_material = item.info.qty_material.join()
            }
            data.tb_rfq_material.push({
                //job_id:mainData.job.job_id,
                material_id: index + 1,
                material_name: item.name,
                unit_price: item.info.unit_price,
                is_fixedPrice: is_fixedPrice,
                qty_material: qty_material,
                // from_process:item.info.from_process,
                // comp_index:item.info.comp_index,
                // process_index:item.info.process_index
            })
            if (item.info.from_process != null) {
                data.tb_rfq_material[index].from_process = item.info.from_process
                data.tb_rfq_material[index].comp_index = item.info.comp_index
                data.tb_rfq_material[index].process_index = item.info.process_index
            }
            item.line.forEach((item1, index1) => {
                listSubItemProcess.push({
                    job_id: null,
                    est_type: "packaging",
                    component_id: 0,
                    component_name: 'job',
                    component_name_custom: 'job',
                    part_name: 'job',
                    part_name_custom: 'job',
                    version_name: null,
                    process_type_id: item?.type_id || null,
                    process_type_name: item?.type || null,
                    process_id: item?.process_id || null,
                    process_name: item?.name || null,
                    price_type_id: null,
                    price_type_name: "all",
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    unit_price: item1?.unit_price || 0,
                    proc_qty: item1?.qty,
                    price: item1?.price,
                    process_detail: null,
                })
            })
        })
    }

    if (mainData.otherCost && mainData.otherCost.length > 0) {
        mainData.otherCost.forEach((item, index) => {
            if (item.info.is_fixedPrice) {
                var is_fixedPrice = 1
                var qty_other = item.info.qty_other
            } else {
                var is_fixedPrice = 0
                var qty_other = item.info.qty_other.join()
            }
            data.tb_rfq_other.push({
                other_id: index + 1,
                other_name: item.name,
                unit_price: item.info.unit_price,
                is_fixedPrice: is_fixedPrice,
                qty_other: qty_other,
            })

            if (item.info.from_process != null) {
                data.tb_rfq_other[index].from_process = item.info.from_process
                data.tb_rfq_other[index].comp_index = item.info.comp_index
                data.tb_rfq_other[index].process_index = item.info.process_index
            }

            item.line.forEach((item1, index1) => {
                listSubItemProcess.push({
                    job_id: null,
                    est_type: "packaging",
                    component_id: 0,
                    component_name: 'job',
                    component_name_custom: 'job',
                    part_name: 'job',
                    part_name_custom: 'job',
                    version_name: null,
                    process_type_id: item?.type_id || null,
                    process_type_name: item?.type || null,
                    process_id: item?.process_id || null,
                    process_name: item?.name || null,
                    price_type_id: null,
                    price_type_name: "all",
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    unit_price: item1?.unit_price || 0,
                    proc_qty: item1?.qty,
                    price: item1?.price,
                    process_detail: null,
                })
            })
        })
    }

    if (mainData.process.length > 0) {
        var num_other = 0, num_handwork = 0, num_outsource = 0
        mainData.process.forEach((item) => {
            if (item.type == 'handwork') {
                num_handwork += 1
                item.line.forEach((item1, index1) => {
                    listSubItemProcess.push({
                        job_id: null,
                        est_type: "packaging",
                        component_id: 0,
                        component_name: 'job',
                        component_name_custom: 'job',
                        part_name: 'job',
                        part_name_custom: 'job',
                        version_name: null,
                        process_type_id: 9,
                        process_type_name: 'handwork',
                        process_id: item?.process_id || null,
                        process_name: item?.name || null,
                        price_type_id: null,
                        price_type_name: "all",
                        job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                        unit_price: item1?.unit_price || 0,
                        proc_qty: item1?.qty,
                        price: item1?.price,
                        process_detail: null,
                    })
                })
            } else if (item.type == 'other') {
                num_other += 1
                item.line.forEach((item1, index1) => {
                    listSubItemProcess.push({
                        job_id: null,
                        est_type: "packaging",
                        component_id: 0,
                        component_name: 'job',
                        component_name_custom: 'job',
                        part_name: 'job',
                        part_name_custom: 'job',
                        version_name: null,
                        process_type_id: 8,
                        process_type_name: 'other',
                        process_id: item?.process_id || null,
                        process_name: item?.name || null,
                        price_type_id: null,
                        price_type_name: "all",
                        job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                        unit_price: item1?.unit_price || 0,
                        proc_qty: item1?.qty,
                        price: item1?.price,
                        process_detail: null,
                    })
                })
            } else if (item.type == 'custom') {
                num_outsource += 1
                item.line.forEach((item1, index1) => {
                    listSubItemProcess.push({
                        job_id: null,
                        est_type: "packaging",
                        component_id: 0,
                        component_name: 'job',
                        component_name_custom: 'job',
                        part_name: 'job',
                        part_name_custom: 'job',
                        version_name: null,
                        process_type_id: 17,
                        process_type_name: 'outsource',
                        process_id: item?.process_id || null,
                        process_name: item?.name || null,
                        price_type_id: null,
                        price_type_name: "all",
                        job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                        unit_price: item1?.unit_price || 0,
                        proc_qty: item1?.qty,
                        price: item1?.price,
                        process_detail: null,
                    })
                })
            } else {
                item.line.forEach((item1, index1) => {
                    listSubItemProcess.push({
                        job_id: null,
                        est_type: "packaging",
                        component_id: 0,
                        component_name: 'job',
                        component_name_custom: 'job',
                        part_name: 'job',
                        part_name_custom: 'job',
                        version_name: null,
                        process_type_id: item?.type_id || null,
                        process_type_name: item?.type || null,
                        process_id: item?.process_id || null,
                        process_name: item?.name || null,
                        price_type_id: null,
                        price_type_name: "all",
                        job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                        unit_price: item1?.unit_price || 0,
                        proc_qty: item1?.qty,
                        price: item1?.price,
                        process_detail: null,
                    })
                })
            }
        })
    }

    mainData.delivery.length > 0 && mainData.delivery.forEach((item, index) => { //* Loop สถานที่ส่ง
        item.qty_rate.forEach((rate, rate_i) => {
            rate.forEach(r => {

                let component_name = item?.detail?.map(obj => mainData?.component1[obj?.componentId]?.component_name)?.join(', ')

                if (is_multiple_f) {
                    component_name = item?.detail?.map(obj => obj.f_code)?.join(', ')
                }

                if (mainData?.delivery?.length == 1 && mainData?.component1?.length > 1) {
                    component_name = 'job'
                }

                listSubItemProcess.push({
                    job_id: null,
                    est_type: "packaging",
                    component_id: 0,
                    component_name: component_name,
                    component_name_custom: component_name,
                    part_name: component_name,
                    part_name_custom: component_name,
                    version_name: is_multiple_f ? item?.detail?.map(obj => obj.f_code)?.join(', ') : null,
                    process_type_id: 12,
                    process_type_name: 'delivery',
                    process_id: 29,
                    process_name: `${item?.destinationName} ${item?.dueDate ? '- ' + moment(item?.dueDate).format("DD/MM/YYYY") : ''}`,
                    subitem_id: 1,
                    price_type_id: null,
                    price_type_name: 'all',
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[rate_i],
                    unit_price: r.unit_price,
                    proc_qty: r.qty,
                    price: r.price,
                    process_detail: ""
                })
            })
        })
    })

    const {
        process_type = [],
        price_type = []
    } = db?.db

    data.tb_rfq_process_price = prepareProcessData(null, mainData)

    data.tb_rfq_subitem = []

    data.tb_rfq_delivery_head = mainData?.delivery?.map(obj => ({
        delivery_date: obj?.dueDate || null,
        delivery_location_id: obj?.destinationId || null,
        delivery_location_name: obj?.destinationName || null,
        qty: obj?.detail?.reduce((total, curr) => total += curr?.qty || 0, 0)
    }))

    mainData?.delivery?.forEach((due, provinceIndex) => {
        due?.qty_rate?.forEach((rfqQty, qtyIndex) => {
            rfqQty?.forEach((rate, rateIndex) => {
                const data1 = {
                    delivery_date: due?.dueDate || null,
                    delivery_location_id: due?.destinationId || null,
                    delivery_location_name: due?.destinationName || null,
                    region_type: 1,
                    region_name: 'ในประเทศ',
                    round: provinceIndex + 1,
                    vehicle_type: null,
                    vehicle_type_name: null,
                    unit_price: rate?.unit_price || 0,
                    qty: rate?.qty || 0,
                    total_price: rate?.price || 0,
                    rate_id: rate?.rate_id || null,
                    est_qty: mainData.qty.main[qtyIndex] || 0,
                    est_total_qty: mainData.qty.totalqty[qtyIndex] || 0,
                }

                data.tb_rfq_delivery_detail.push(data1)
            })
        })
    })

    data.tb_rfq_component_paper = prepareComponentPaperDataToDB(mainData) || []
    data.tb_rfq_component_layout = prepareComponentLayoutDataToDB(mainData) || []

    dat.data_DB = data
}

function prepareProcessData(job_id, mainData) {
    const
        is_multiple_f = mainData?.job?.is_multiple_f || false,
        mainQty = mainData?.qty?.main[0]

    const listSubItemProcess = [];

    const data = {
        job_id: mainData.job.job_id,
        tb_rfq_process_price: []
    }

    if (!mainData?.totalprice?.length) {
        return data?.tb_rfq_process_price
    }

    mainData.component1.forEach((item, index) => {

        //* store corrugated
        if (item.component_type.type != 1) {
            item.corrugated_layer.price.forEach((item1, index1) => {
                listSubItemProcess.push({
                    component_id: index + 1,
                    component_name: item?.component_name,
                    component_name_custom: item?.component_name,
                    part_name: item?.component_type?.detail_th || null,
                    part_name_custom: item?.box_type?.type_name || null,
                    process_type_id: item.corrugated_layer.type_id,
                    process_type_name: item.corrugated_layer.type,
                    process_id: item.corrugated_layer.process_id,
                    process_name: item.corrugated_layer.name,
                    //price_type_id:,
                    price_type_name: 'all',
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    proc_qty: item1.qty,
                    unit_price: item1.unit_price,
                    price: item1.price,
                    version_name: null,
                })
            })
        }

        //* store process
        if (item.process.length > 0) {
            item.process.forEach((item1) => {
                if (item1.name == 'diecut') {
                    item1.line.forEach((item2, index2) => {
                        listSubItemProcess.push(
                            {
                                component_id: index + 1,
                                component_name: item?.component_name,
                                component_name_custom: item?.component_name,
                                part_name: item?.component_type?.detail_th || null,
                                part_name_custom: item?.box_type?.type_name || null,
                                process_type_id: item1.type_id,
                                process_type_name: item1.type,
                                process_id: item1.process_id,
                                process_name: item1.name,
                                //price_type_id:,
                                price_type_name: 'labor',
                                job_qty: mainData.qty.main[index2],
                                proc_qty: item2.labor.qty,
                                unit_price: item2.labor.unit_price,
                                price: item2.labor.price,
                                version_name: null,
                            },
                            {
                                component_id: index + 1,
                                component_name: item?.component_name,
                                component_name_custom: item?.component_name,
                                part_name: item?.component_type?.detail_th || null,
                                part_name_custom: item?.box_type?.type_name || null,
                                process_type_id: item1.type_id,
                                process_type_name: item1.type,
                                process_id: item1.process_id,
                                process_name: item1.name,
                                //price_type_id:,
                                price_type_name: 'block',
                                job_qty: mainData.qty.main[index2],
                                proc_qty: item2.block.qty,
                                unit_price: item2.block.unit_price,
                                price: item2.block.price,
                                version_name: null,
                            },
                        )
                    })
                } else {
                    item1.line.forEach((item2, index2) => {
                        listSubItemProcess.push({
                            component_id: index + 1,
                            component_name: item?.component_name,
                            component_name_custom: item?.component_name,
                            part_name: item?.component_type?.detail_th || null,
                            part_name_custom: item?.box_type?.type_name || null,
                            process_type_id: item1.type_id,
                            process_type_name: item1.type,
                            process_id: item1.process_id,
                            process_name: item1.name,
                            //price_type_id:,
                            price_type_name: 'all',
                            job_qty: mainData.qty.main[index2],
                            proc_qty: item2.qty,
                            unit_price: item2.unit_price,
                            price: item2.price,
                            version_name: null,
                        })
                    })
                }
            })
        }

        //* store add-on
        if (item.addon.length > 0) {

            const foil_process = []
            item.addon.forEach((item1) => {
                if (item1.type == 'foilstamp') {

                    item1.line.forEach((item2, index2) => {

                        if (!foil_process?.includes(item1?.info?.process_index)) {
                            foil_process.push(item1?.info?.process_index)

                            const roll_unit_price = item?.addon?.filter(obj => obj.type == 'foilstamp' && obj.info?.process_index == item1?.info?.process_index)?.reduce((acc, obj) => acc + obj.line[index2]?.foil_roll?.unit_price, 0)
                            const qty = item2.foil_roll.qty
                            let total_price = parseFloat((roll_unit_price * qty).toFixed(2))

                            if (total_price < item1.info.foil_roll_min_price) {
                                total_price = item1.info.foil_roll_min_price
                            }

                            listSubItemProcess.push(
                                {
                                    component_id: index + 1,
                                    component_name: item?.component_name,
                                    component_name_custom: item?.component_name,
                                    part_name: item?.component_type?.detail_th || null,
                                    part_name_custom: item?.box_type?.type_name || null,
                                    process_type_id: item1.type_id,
                                    process_type_name: item1.type,
                                    process_id: item1.process_id,
                                    process_name: `Foil หน้าม้วน ${item1?.info?.foil_width}" ความยาว ${item1?.info?.foil_length} ft`,
                                    //price_type_id:,
                                    price_type_name: 'roll',
                                    job_qty: mainData.qty.main[index2],
                                    proc_qty: qty,
                                    unit_price: roll_unit_price,
                                    price: total_price,
                                    version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                },
                                {
                                    component_id: index + 1,
                                    component_name: item?.component_name,
                                    component_name_custom: item?.component_name,
                                    part_name: item?.component_type?.detail_th || null,
                                    part_name_custom: item?.box_type?.type_name || null,
                                    process_type_id: item1.type_id,
                                    process_type_name: item1.type,
                                    process_id: item1.process_id,
                                    process_name: item1.name,
                                    //price_type_id:,
                                    price_type_name: 'labor',
                                    job_qty: mainData.qty.main[index2],
                                    proc_qty: item2.labor.qty,
                                    unit_price: item2.labor.unit_price,
                                    price: item2.labor.price,
                                    version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                },
                                {
                                    component_id: index + 1,
                                    component_name: item?.component_name,
                                    component_name_custom: item?.component_name,
                                    part_name: item?.component_type?.detail_th || null,
                                    part_name_custom: item?.box_type?.type_name || null,
                                    process_type_id: item1.type_id,
                                    process_type_name: item1.type,
                                    process_id: item1.process_id,
                                    process_name: `Block ${item1.name} (${item1?.info?.size ? item1?.info?.size[0] : item1?.info?.width}" x ${item1?.info?.size ? item1?.info?.size[1] : item1?.info?.length}")`,
                                    //price_type_id:,
                                    price_type_name: 'block',
                                    job_qty: mainData.qty.main[index2],
                                    proc_qty: item2.block.qty,
                                    unit_price: item2.block.unit_price,
                                    price: item2.block.price,
                                    version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                }
                            )
                        } else {
                            // * duplicate foilstamp
                            listSubItemProcess.push(
                                {
                                    component_id: index + 1,
                                    component_name: item?.component_name,
                                    component_name_custom: item?.component_name,
                                    part_name: item?.component_type?.detail_th || null,
                                    part_name_custom: item?.box_type?.type_name || null,
                                    process_type_id: item1.type_id,
                                    process_type_name: item1.type,
                                    process_id: item1.process_id,
                                    process_name: `Block ${item1.name} (${item1?.info?.size ? item1?.info?.size[0] : item1?.info?.width}" x ${item1?.info?.size ? item1?.info?.size[1] : item1?.info?.length}")`,
                                    //price_type_id:,
                                    price_type_name: 'block',
                                    job_qty: mainData.qty.main[index2],
                                    proc_qty: item2.block.qty,
                                    unit_price: item2.block.unit_price,
                                    price: item2.block.price,
                                    version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                }
                            )
                        }
                    })
                } else if (item1.type == 'emboss') {

                    if (item1.line?.labor?.length) {
                        //* หลังเพิ่มขนาดได้
                        item1.line.labor?.forEach((labor, index2) => {
                            listSubItemProcess.push(
                                {
                                    component_id: index + 1,
                                    component_name: item?.component_name,
                                    component_name_custom: item?.component_name,
                                    part_name: item?.component_type?.detail_th || null,
                                    part_name_custom: item?.box_type?.type_name || null,
                                    process_type_id: item1.type_id,
                                    process_type_name: item1.type,
                                    process_id: item1.process_id,
                                    process_name: item1.name,
                                    price_type_id: null,
                                    price_type_name: 'labor',
                                    job_qty: mainData.qty.main[index2],
                                    proc_qty: labor.qty,
                                    unit_price: labor.unit_price,
                                    price: labor.price,
                                    version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                },
                            )
                        })

                    } else {
                        // * ก่อนแก้ไข
                        item1.line?.forEach((qty, index2) => {
                            listSubItemProcess.push(
                                {
                                    component_id: index + 1,
                                    component_name: item?.component_name,
                                    component_name_custom: item?.component_name,
                                    part_name: item?.component_type?.detail_th || null,
                                    part_name_custom: item?.box_type?.type_name || null,
                                    process_type_id: item1.type_id,
                                    process_type_name: item1.type,
                                    process_id: item1.process_id,
                                    process_name: item1.name,
                                    price_type_id: null,
                                    price_type_name: 'labor',
                                    job_qty: mainData.qty.main[index2],
                                    proc_qty: qty?.labor.qty,
                                    unit_price: qty?.labor.unit_price,
                                    price: qty?.labor.price,
                                    version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                },
                            )
                        })
                    }


                    if (item1.line?.block?.length) { //* ระบบสามารถเพิ่มไซส์มากกว่า 1 ได้

                        item1.line?.block?.forEach((block, bIndex) => {
                            block?.line?.forEach((line, index2) => {
                                listSubItemProcess.push(
                                    {
                                        component_id: index + 1,
                                        component_name: item?.component_name,
                                        component_name_custom: item?.component_name,
                                        part_name: item?.component_type?.detail_th || null,
                                        part_name_custom: item?.box_type?.type_name || null,
                                        process_type_id: item1.type_id,
                                        process_type_name: item1.type,
                                        process_id: item1.process_id,
                                        process_name: `Block ${item1.name} (${block?.size ? block?.size[0] : item1?.info?.width}" x ${block?.size ? block?.size[1] : item1?.info?.length}")`,
                                        price_type_id: null,
                                        price_type_name: 'block',
                                        job_qty: mainData.qty.main[index2],
                                        proc_qty: line.qty,
                                        unit_price: line.unit_price,
                                        price: line.price,
                                        version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                    }
                                )
                            })
                        })
                    } else { //* ระบบเก่า

                        item1.line?.forEach((qty, index2) => {
                            listSubItemProcess.push(
                                {
                                    component_id: index + 1,
                                    component_name: item?.component_name,
                                    component_name_custom: item?.component_name,
                                    part_name: item?.component_type?.detail_th || null,
                                    part_name_custom: item?.box_type?.type_name || null,
                                    process_type_id: item1.type_id,
                                    process_type_name: item1.type,
                                    process_id: item1.process_id,
                                    process_name: `Block ${item1.name} (${item1?.info?.width}" x ${item1?.info?.length}")`,
                                    price_type_id: null,
                                    price_type_name: 'block',
                                    job_qty: mainData.qty.main[index2],
                                    proc_qty: qty?.block.qty,
                                    unit_price: qty?.block.unit_price,
                                    price: qty?.block.price,
                                    version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                }
                            )
                        })

                    }
                } else if (item1.type == 'deboss') {

                    if (item1.line?.block?.length) { //* ระบบสามารถเพิ่มไซส์มากกว่า 1 ได้

                        item1.line?.labor?.forEach((labor, index2) => {
                            listSubItemProcess.push(
                                {
                                    component_id: index + 1,
                                    component_name: item?.component_name,
                                    component_name_custom: item?.component_name,
                                    part_name: item?.component_type?.detail_th || null,
                                    part_name_custom: item?.box_type?.type_name || null,
                                    process_type_id: item1.type_id,
                                    process_type_name: item1.type,
                                    process_id: item1.process_id,
                                    process_name: item1.name,
                                    price_type_id: null,
                                    price_type_name: 'labor',
                                    job_qty: mainData.qty.main[index2],
                                    proc_qty: labor.qty,
                                    unit_price: labor.unit_price,
                                    price: labor.price,
                                    version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                }
                            )
                        })
                    } else { //* ระบบเก่า

                        item1.line?.forEach((qty, index2) => {
                            listSubItemProcess.push(
                                {
                                    component_id: index + 1,
                                    component_name: item?.component_name,
                                    component_name_custom: item?.component_name,
                                    part_name: item?.component_type?.detail_th || null,
                                    part_name_custom: item?.box_type?.type_name || null,
                                    process_type_id: item1.type_id,
                                    process_type_name: item1.type,
                                    process_id: item1.process_id,
                                    process_name: item1.name,
                                    price_type_id: null,
                                    price_type_name: 'labor',
                                    job_qty: mainData.qty.main[index2],
                                    proc_qty: qty?.labor?.qty,
                                    unit_price: qty?.labor?.unit_price,
                                    price: qty?.labor?.price,
                                    version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                }
                            )
                        })
                    }


                    if (item1.line?.block?.length) { //* ระบบสามารถเพิ่มไซส์มากกว่า 1 ได้

                        item1.line?.block?.forEach((block, bIndex) => {
                            block?.line?.forEach((line, index2) => {
                                listSubItemProcess.push(
                                    {
                                        component_id: index + 1,
                                        component_name: item?.component_name,
                                        component_name_custom: item?.component_name,
                                        part_name: item?.component_type?.detail_th || null,
                                        part_name_custom: item?.box_type?.type_name || null,
                                        process_type_id: item1.type_id,
                                        process_type_name: item1.type,
                                        process_id: item1.process_id,
                                        process_name: `Block ${item1.name} (${block?.size ? block?.size[0] : item1?.info?.width}" x ${block?.size ? block?.size[1] : item1?.info?.length}")`,
                                        price_type_id: null,
                                        price_type_name: 'block',
                                        job_qty: mainData.qty.main[index2],
                                        proc_qty: line.qty,
                                        unit_price: line.unit_price,
                                        price: line.price,
                                        version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                    }
                                )
                            })
                        })
                    } else { //* ระบบเก่า

                        item1.line?.forEach((qty, index2) => {
                            listSubItemProcess.push(
                                {
                                    component_id: index + 1,
                                    component_name: item?.component_name,
                                    component_name_custom: item?.component_name,
                                    part_name: item?.component_type?.detail_th || null,
                                    part_name_custom: item?.box_type?.type_name || null,
                                    process_type_id: item1.type_id,
                                    process_type_name: item1.type,
                                    process_id: item1.process_id,
                                    process_name: `Block ${item1.name} (${item1?.info?.width}" x ${item1?.info?.length}")`,
                                    price_type_id: null,
                                    price_type_name: 'block',
                                    job_qty: mainData.qty.main[index2],
                                    proc_qty: qty?.block?.qty,
                                    unit_price: qty?.block?.unit_price,
                                    price: qty?.block?.price,
                                    version_name: (mainData?.job?.is_multiple_f && item1?.info?.f_code?.join(', ')) || null,
                                }
                            )
                        })
                    }
                } else if (item1.type == 'coating') {
                    item1.line.forEach((item2, index2) => {
                        listSubItemProcess.push({
                            component_id: index + 1,
                            component_name: item?.component_name,
                            component_name_custom: item?.component_name,
                            part_name: item?.component_type?.detail_th || null,
                            part_name_custom: item?.box_type?.type_name || null,

                            process_id: item1.process_id,
                            process_type_id: item1.type_id,
                            process_type_name: item1.type,
                            process_name: `${item1?.info?.name} ${item1?.info?.type} ${item1?.info?.side} s ${item1?.info?.code == 'S-UV' ? `(${item1?.info?.width}" x ${item1?.info?.length}")` : ''}`,
                            //price_type_id:,
                            price_type_name: 'all',
                            job_qty: mainData.qty.main[index2],
                            proc_qty: item2.qty,
                            unit_price: item2.unit_price,
                            price: item2.price,
                            version_name: null,
                        })
                    })
                }
            })
        }

        //* store color , special ink
        if (item.color && item.color?.length > 0) {
            item.color.forEach((color, colorIndex) => {
                color?.special_ink.forEach((item1, index1) => {
                    item1.line.forEach((item2, index2) => {
                        listSubItemProcess.push({
                            component_id: index + 1,
                            component_name: item?.component_name,
                            component_name_custom: item?.component_name,
                            part_name: item?.component_type?.detail_th || null,
                            part_name_custom: item?.box_type?.type_name || null,

                            process_id: item1.process_id,
                            process_type_id: item1.type_id,
                            process_type_name: item1.type,
                            process_name: `Special Ink : ${item1.info.ink_name} : ${item1?.name} - ${item1?.info?.print_style == 'stripe' ? 'ตีพื้น' : 'ลายเส้น'}`,
                            //price_type_id:,
                            price_type_name: 'all',
                            job_qty: mainData.qty.main[index2],
                            proc_qty: item2.qty,
                            unit_price: item2.unit_price,
                            price: item2.price,
                            version_name: (mainData?.job?.is_multiple_f && item?.f_detail?.f_list[colorIndex]?.f_code) || null,
                        })
                    })
                })
            })
        }

        item.paper_usage.line.forEach((item1, index1) => {

            if (item.component_type.type != 3) {
                listSubItemProcess.push({
                    component_id: index + 1,
                    component_name: item?.component_name,
                    component_name_custom: item?.component_name,
                    part_name: item?.component_type?.detail_th || null,
                    part_name_custom: item?.box_type?.type_name || null,
                    process_type_id: item1.price.paper.type_id,
                    process_type_name: item1.price.paper.type,
                    process_id: item1.price.paper.process_id,
                    process_name: item1.price.paper.name,
                    //price_type_id:,
                    price_type_name: 'all',
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    proc_qty: item1.price.paper.qty,
                    unit_price: item1.price.paper.unit_price,
                    price: item1.price.paper.price,
                    version_name: (mainData?.job?.is_multiple_f && item?.f_detail?.f_list[index1]?.f_code) || null,
                })
            }

            if (item1?.price?.proof) {
                listSubItemProcess.push({
                    component_id: index + 1,
                    component_name: item?.component_name,
                    component_name_custom: item?.component_name,
                    part_name: item?.component_type?.detail_th || null,
                    part_name_custom: item?.box_type?.type_name || null,
                    process_type_id: item1.price.proof.type_id,
                    process_type_name: item1.price.proof.type,
                    process_id: item1.price.proof.process_id,
                    process_name: item1.price.proof.name,
                    //price_type_id:,
                    price_type_name: 'all',
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    proc_qty: item1.price.proof?.all?.qty,
                    unit_price: item1.price.proof?.all?.unit_price,
                    price: item1.price.proof?.all?.price,
                    version_name: null,
                })
            }

            listSubItemProcess.push(
                {
                    //job_id:mainData.job.job_id,
                    component_id: index + 1,
                    component_name: item?.component_name,
                    component_name_custom: item?.component_name,
                    part_name: item?.component_type?.detail_th || null,
                    part_name_custom: item?.box_type?.type_name || null,
                    process_type_id: item1.price.plate.type_id,
                    process_type_name: item1.price.plate.type,
                    process_id: item1.price.plate.process_id,
                    process_name: item1.price.plate.name,
                    //price_type_id:,
                    price_type_name: 'inside',
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    proc_qty: item1.price.plate.inside.qty,
                    unit_price: item1.price.plate.inside.unit_price,
                    price: item1.price.plate.inside.price,
                    version_name: (mainData?.job?.is_multiple_f && item?.f_detail?.f_list[index1]?.f_code) || null,
                },
                {
                    //job_id:mainData.job.job_id,
                    component_id: index + 1,
                    component_name: item?.component_name,
                    component_name_custom: item?.component_name,
                    part_name: item?.component_type?.detail_th || null,
                    part_name_custom: item?.box_type?.type_name || null,
                    process_type_id: item1.price.plate.type_id,
                    process_type_name: item1.price.plate.type,
                    process_id: item1.price.plate.process_id,
                    process_name: item1.price.plate.name,
                    //price_type_id:,
                    price_type_name: 'outside',
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    proc_qty: item1.price.plate.outside.qty,
                    unit_price: item1.price.plate.outside.unit_price,
                    price: item1.price.plate.outside.price,
                    version_name: (mainData?.job?.is_multiple_f && item?.f_detail?.f_list[index1]?.f_code) || null,
                },
                {
                    //job_id:mainData.job.job_id,
                    component_id: index + 1,
                    component_name: item?.component_name,
                    component_name_custom: item?.component_name,
                    part_name: item?.component_type?.detail_th || null,
                    part_name_custom: item?.box_type?.type_name || null,
                    process_type_id: item1.price.print.type_id,
                    process_type_name: item1.price.print.type,
                    process_id: item1.price.print.process_id,
                    process_name: item1.price.print.name,
                    //price_type_id:,
                    price_type_name: 'outside',
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    proc_qty: item1.price.print.outside.qty,
                    unit_price: item1.price.print.outside.unit_price,
                    price: item1.price.print.outside.price,
                    version_name: (mainData?.job?.is_multiple_f && item?.f_detail?.f_list[index1]?.f_code) || null,
                },
                {
                    //job_id:mainData.job.job_id,
                    component_id: index + 1,
                    component_name: item?.component_name,
                    component_name_custom: item?.component_name,
                    part_name: item?.component_type?.detail_th || null,
                    part_name_custom: item?.box_type?.type_name || null,
                    process_type_id: item1.price.print.type_id,
                    process_type_name: item1.price.print.type,
                    process_id: item1.price.print.process_id,
                    process_name: item1.price.print.name,
                    //price_type_id:,
                    price_type_name: 'inside',
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    proc_qty: item1.price.print.inside.qty,
                    unit_price: item1.price.print.inside.unit_price,
                    price: item1.price.print.inside.price,
                    version_name: (mainData?.job?.is_multiple_f && item?.f_detail?.f_list[index1]?.f_code) || null,
                },
            )

        })

        item.packing?.forEach(fPack => {
            Array.isArray(fPack) && fPack?.forEach((item1, fIndex) => {
                item1.detail?.forEach((item2, index2) => { //* รอบส่ง
                    item2?.detail?.forEach((info, qtyIndex) => {
                        listSubItemProcess.push({
                            component_id: index + 1,
                            component_name: item?.component_name,
                            component_name_custom: item?.component_name,
                            part_name: item?.component_type?.detail_th || null,
                            part_name_custom: item?.box_type?.type_name || null,
                            version_name: mainData?.job?.is_different_packing ? item?.f_detail?.f_list?.length ? item?.f_detail?.f_list?.[fIndex]?.f_code : item?.component_name : null,
                            process_type_id: item1.type_id,
                            process_type_name: item1.type,
                            process_id: item1.process_id,
                            process_name: item1.name,
                            //price_type_id:,
                            price_type_name: 'all',
                            job_qty: mainData.qty.main[qtyIndex],
                            proc_qty: info.qty,
                            unit_price: info.unit_price,
                            price: info.price,
                            process_detail: ''
                        })
                    })
                })
            })
        })
    }) //* END loop component

    if (mainData.material.length > 0) {
        mainData.material.forEach((item, index) => {
            item.line.forEach((item1, index1) => {
                listSubItemProcess.push({
                    job_id: null,
                    est_type: "packaging",
                    component_id: 0,
                    component_name: 'job',
                    component_name_custom: 'job',
                    part_name: 'job',
                    part_name_custom: 'job',
                    version_name: null,
                    process_type_id: item?.type_id || null,
                    process_type_name: item?.type || null,
                    process_id: item?.process_id || null,
                    process_name: item?.name || null,
                    price_type_id: null,
                    price_type_name: "all",
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    unit_price: item1?.unit_price || 0,
                    proc_qty: item1?.qty,
                    price: item1?.price,
                    process_detail: null,
                })
            })
        })
    }

    if (mainData.otherCost && mainData.otherCost.length > 0) {
        mainData.otherCost.forEach((item, index) => {
            item.line.forEach((item1, index1) => {
                listSubItemProcess.push({
                    job_id: null,
                    est_type: "packaging",
                    component_id: 0,
                    component_name: 'job',
                    component_name_custom: 'job',
                    part_name: 'job',
                    part_name_custom: 'job',
                    version_name: null,
                    process_type_id: item?.type_id || null,
                    process_type_name: item?.type || null,
                    process_id: item?.process_id || null,
                    process_name: item?.name || null,
                    price_type_id: null,
                    price_type_name: "all",
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                    unit_price: item1?.unit_price || 0,
                    proc_qty: item1?.qty,
                    price: item1?.price,
                    process_detail: null,
                })
            })
        })
    }

    if (mainData.process.length > 0) {
        mainData.process.forEach((item) => {
            if (item.type == 'handwork') {
                item.line.forEach((item1, index1) => {
                    listSubItemProcess.push({
                        job_id: null,
                        est_type: "packaging",
                        component_id: 0,
                        component_name: 'job',
                        component_name_custom: 'job',
                        part_name: 'job',
                        part_name_custom: 'job',
                        version_name: null,
                        process_type_id: 9,
                        process_type_name: 'handwork',
                        process_id: item?.process_id || null,
                        process_name: item?.name || null,
                        price_type_id: null,
                        price_type_name: "all",
                        job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                        unit_price: item1?.unit_price || 0,
                        proc_qty: item1?.qty,
                        price: item1?.price,
                        process_detail: null,
                    })
                })
            } else if (item.type == 'other') {
                item.line.forEach((item1, index1) => {
                    listSubItemProcess.push({
                        job_id: null,
                        est_type: "packaging",
                        component_id: 0,
                        component_name: 'job',
                        component_name_custom: 'job',
                        part_name: 'job',
                        part_name_custom: 'job',
                        version_name: null,
                        process_type_id: 8,
                        process_type_name: 'other',
                        process_id: item?.process_id || null,
                        process_name: item?.name || null,
                        price_type_id: null,
                        price_type_name: "all",
                        job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                        unit_price: item1?.unit_price || 0,
                        proc_qty: item1?.qty,
                        price: item1?.price,
                        process_detail: null,
                    })
                })
            } else if (item.type == 'custom') {
                item.line.forEach((item1, index1) => {
                    listSubItemProcess.push({
                        job_id: null,
                        est_type: "packaging",
                        component_id: 0,
                        component_name: 'job',
                        component_name_custom: 'job',
                        part_name: 'job',
                        part_name_custom: 'job',
                        version_name: null,
                        process_type_id: 17,
                        process_type_name: 'outsource',
                        process_id: item?.process_id || null,
                        process_name: item?.name || null,
                        price_type_id: null,
                        price_type_name: "all",
                        job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                        unit_price: item1?.unit_price || 0,
                        proc_qty: item1?.qty,
                        price: item1?.price,
                        process_detail: null,
                    })
                })
            } else {
                item.line.forEach((item1, index1) => {
                    listSubItemProcess.push({
                        job_id: null,
                        est_type: "packaging",
                        component_id: 0,
                        component_name: 'job',
                        component_name_custom: 'job',
                        part_name: 'job',
                        part_name_custom: 'job',
                        version_name: null,
                        process_type_id: item?.type_id || null,
                        process_type_name: item?.type || null,
                        process_id: item?.process_id || null,
                        process_name: item?.name || null,
                        price_type_id: null,
                        price_type_name: "all",
                        job_qty: is_multiple_f ? mainQty : mainData.qty.main[index1],
                        unit_price: item1?.unit_price || 0,
                        proc_qty: item1?.qty,
                        price: item1?.price,
                        process_detail: null,
                    })
                })
            }
        })
    }

    // * Delivery
    mainData?.delivery?.length > 0 && mainData?.delivery.forEach((item, index) => { //* Loop สถานที่ส่ง
        item?.qty_rate?.forEach((rate, rate_i) => {
            rate.forEach(r => {

                let component_name = item?.detail?.map(obj => mainData?.component1[obj?.componentId]?.component_name)?.join(', ')

                if (is_multiple_f) {
                    component_name = item?.detail?.map(obj => obj.f_code)?.join(', ')
                }

                if (mainData?.delivery?.length == 1 && mainData?.component1?.length > 1) {
                    component_name = 'job'
                }

                listSubItemProcess.push({
                    job_id: null,
                    est_type: "packaging",
                    component_id: 0,
                    component_name: component_name,
                    component_name_custom: component_name,
                    part_name: component_name,
                    part_name_custom: component_name,
                    version_name: is_multiple_f ? item?.detail?.map(obj => obj.f_code)?.join(', ') : null,
                    process_type_id: 12,
                    process_type_name: 'delivery',
                    process_id: 29,
                    process_name: `${item?.destinationName} ${item?.dueDate ? '- ' + moment(item?.dueDate).format("DD/MM/YYYY") : ''}`,
                    subitem_id: 1,
                    price_type_id: null,
                    price_type_name: 'all',
                    job_qty: is_multiple_f ? mainQty : mainData.qty.main[rate_i],
                    unit_price: r.unit_price,
                    proc_qty: r.qty,
                    price: r.price,
                    process_detail: ""
                })
            })
        })
    })

    const price_type = [
        { price_type_id: 1, price_type_name: "all" },
        { price_type_id: 2, price_type_name: "block" },
        { price_type_id: 3, price_type_name: "labor" },
        { price_type_id: 4, price_type_name: "inside" },
        { price_type_id: 5, price_type_name: "outside" },
        { price_type_id: 6, price_type_name: "roll" },
    ]

    const process_type = [
        { process_type_id: 1, process_type_name: "plate" },
        { process_type_id: 2, process_type_name: "print" },
        { process_type_id: 3, process_type_name: "coating" },
        { process_type_id: 4, process_type_name: "foilstamp" },
        { process_type_id: 5, process_type_name: "emboss" },
        { process_type_id: 7, process_type_name: "afterpress" },
        { process_type_id: 8, process_type_name: "other" },
        { process_type_id: 9, process_type_name: "handwork" },
        { process_type_id: 10, process_type_name: "material" },
        { process_type_id: 11, process_type_name: "packing" },
        { process_type_id: 12, process_type_name: "delivery" },
        { process_type_id: 6, process_type_name: "deboss" },
        { process_type_id: 13, process_type_name: "otherMaterial" },
        { process_type_id: 14, process_type_name: "proof" },
        { process_type_id: 16, process_type_name: "extend" },
        { process_type_id: 7, process_type_name: "process" },
        { process_type_id: 17, process_type_name: "outsource" },
        { process_type_id: 18, process_type_name: "acetate" },
    ]

    data.tb_rfq_process_price = listSubItemProcess.map(mp => { //* Matching process_type_id , price_type_id
        const newItem = Object.assign({}, mp)
        delete newItem.subitem_id

        newItem['job_id'] = job_id
        newItem['est_type'] = 'packaging'
        newItem['price_type_id'] = price_type.find(f => f.price_type_name == newItem.price_type_name)?.price_type_id
        newItem['process_type_id'] = process_type.find(f => f.process_type_name == newItem.process_type_name)?.process_type_id
        return newItem
    })

    // console.log("data?.tb_rfq_process_price", data?.tb_rfq_process_price)
    return data?.tb_rfq_process_price
}

/* //?  */
function prepareDatatoEstimate() {
    const db = dat.data_DB
    console.log("prepareDatatoEstimate", db)
    var mainData = {
        job: {
            job_id: db.job_id,
            job_name: db.tb_rfq.job_name,
            is_reprinted: db.tb_rfq.is_reprinted,
            ink_type: db.tb_rfq.ink_type,
            // is_colorLimit: db.tb_rfq?.is_colorLimit,
            // color_limit: db.tb_rfq?.color_limit,
            //*Update 08.08.22 Multiple F
            is_multiple_f: db.tb_rfq?.is_multiple_f,
            is_different_packing: db.tb_rfq?.is_different_packing,
            is_use_previous_plate: db.tb_rfq?.is_use_previous_plate,
        },
        ae: {
            ae_id: db.tb_rfq.sale_id,
            ae_name: db.tb_rfq.sale_name //!ต้อง join ไม่ได้เก็บลง
        },
        customer: {
            customer_id: db.tb_rfq.customer_id,
            customer_name: db.tb_rfq.customer_name //!ต้อง join ไม่ได้เก็บลง
        },
        estimator: {
            estimator_id: db.tb_rfq.estimator_id,
            estimator_name: db.tb_rfq.estimator_name //!ต้อง join ไม่ได้เก็บลง
        },
        date: {
            create_date: db.tb_rfq.create_date  //! Select จาก tb มาด้วย
        },
        tax: db.tb_rfq.tax,
        qty: {
            customer: db.tb_rfq.qty_customer,
            ae: db.tb_rfq.qty_ae,
            main: [],
            runon: [],
            totalqty: []
        },
        material: [],
        otherCost: [],
        process: [
            {
                type: 'afterpress',
                name: 'chip',
                type_id: 7,
                process_id: 22,
                info: {

                },
                line: []
            },
            {
                type: 'afterpress',
                name: 'inspection',
                type_id: 7,
                process_id: 23,
                info: {
                },
                line: []
            },
        ],
        totalprice: [],
        component1: [],
        remark: db.tb_rfq?.remark || '',
        fileUpload: [],
        delivery: []
    }
    db.tb_rfq_qty.forEach((item) => {
        mainData.qty.main.push(item.qty_main)
        mainData.qty.runon.push(item.qty_runon)
        mainData.qty.totalqty.push(item.qty_total)
        mainData.totalprice.push({
            afterpress: item.afterpress_price,
            //block:, //!tb_rfq_qty  ไม่ได้เก็บ
            delivery: item.packing_price,
            final_price: item.total_price,
            material: item.material_price,
            plate: item.plate_price,
            print: item.print_price,
            tax: item.tax,
            total_price: item.subtotal_price,
            unit_price: item.unit_price,
            // ! update 19.04.22
            mark_up_percent: item?.mark_up_percent || 0,
            mark_down_percent: item?.mark_down_percent || mainData.totalprice[index]?.marking_percent || 0,
            mark_up_price: item?.mark_up_price || 0,
            mark_down_price: item?.mark_down_price || 0,
            loss: item?.loss || 0,
            profit_sharing: item?.profit_sharing || 0,
        })
    })
    db.tb_rfq_material.forEach((item, index) => {
        if (item.is_fixedPrice) {
            var is_fixedPrice = true
            var qty_material = item.qty_material
        } else {
            var is_fixedPrice = false
            var qty_material = (item.qty_material.split(',')).map(x => parseFloat(x))
        }
        mainData.material.push({
            type: 'material',
            type_id: 10,
            name: item.material_name,
            material_id: item.material_id,
            info: {

                is_fixedPrice: is_fixedPrice,
                unit_price: item.unit_price,
                qty_material: qty_material,
                from_process: item.from_process,
                comp_index: item.comp_index,
                process_index: item.process_index
            },
            line: []
        })
    })

    db.tb_rfq_other.forEach((item, index) => {
        if (item.is_fixedPrice) {
            var is_fixedPrice = true
            var qty_other = item.qty_other
        } else {
            var is_fixedPrice = false
            var qty_other = (item.qty_other.split(',')).map(x => parseFloat(x))
        }
        mainData.otherCost.push({
            type: 'other',
            type_id: 13,
            name: item.other_name,
            other_id: item.other_id,
            info: {

                is_fixedPrice: is_fixedPrice,
                unit_price: item.unit_price,
                qty_other: qty_other,
                from_process: item.from_process,
                comp_index: item.comp_index,
                process_index: item.process_index
            },
            line: []
        })
    })

    db.tb_rfq_item.forEach((item) => {
        var laySize = [
            mm2inch(item.laySize_width),
            mm2inch(item.laySize_length),
            item.laySize_width,
            item.laySize_length,
        ]
        var fold_size = [
            mm2inch(item.finishSize_width),
            mm2inch(item.finishSize_length),
            mm2inch(item.finishSize_depth),
            item.finishSize_width,
            item.finishSize_length,
            item.finishSize_depth
        ]
        var open_size = [
            mm2inch(item.openSize_width),
            mm2inch(item.openSize_length),
            item.openSize_width,
            item.openSize_length
        ]
        var packing_size = [
            mm2inch(item.packingSize_width),
            mm2inch(item.packingSize_length),
            item.packingSize_width,
            item.packingSize_length
        ]
        var layout = (item.layout.split(',')).map(x => parseInt(x))
        var dim = (item.dimension.split(',')).map(x => parseFloat(x))
        var tol = (item.tolerance.split(',')).map(x => parseFloat(x))
        if (item.is_layoutManual) {
            var is_layoutManual = true
        } else {
            var is_layoutManual = false
        }
        var machine = defaultData.machine.filter((item1, index1) => {
            return item1.machine_size.id == item.machineSize_type
        })
        mainData.component1.push({
            component_id: item.component_id,
            addon: [],
            box_type: {
                type_id: item.template_id,
                //type_name:, //!ต้อง join ไม่ได้เก็บลง + ยังไม่ได้สร้าง master data: box template
                packing_layer: item.packing_layer,
            },
            color: {
                outside: item.fcol,
                inside: item.bcol,
                all: item.all_color
            },
            component_name: item.component_name,
            component_type: {
                type: item.component_type,
                //type_name:,//!ต้อง join ไม่ได้เก็บลง + ยังไม่ได้สร้าง master data: component Type
                // detial:,//!ต้อง join ไม่ได้เก็บลง + ยังไม่ได้สร้าง master data: component Type
            },
            gram: item.all_gram,
            layout: {
                laySize: laySize,
                paper_align: item.paper_align,
                selected_layout: {
                    layout: layout,
                    paper_size: [
                        item.cut_off,
                        item.roll_width
                    ]
                },
                layout_grain: item.layout_grain || layout.grain_box_type,
                is_editLayout: item.is_editLayout,
            },
            layout_manual: is_layoutManual,
            machine: machine[0],
            packaging_size: {
                fold_size: fold_size,
                open_size: open_size,
                packing_size: packing_size,
                width: dim[0],
                length: dim[1],
                depth: dim[2],
                glue_flap: dim[3],
                tuck_flap: dim[4],
                dust_flap: dim[5],
                ol: dim[6]
            },
            packing: [],
            paperSize: [item.paperSize_width, item.paperSize_length, item.paperSize_width_in, item.paperSize_length_in],
            paper_info: {
                cut_off: item.cut_off,
                roll_width: item.roll_width,
                dummy_paper_align: item.dummy_paper_align,
                paper_align: item.paper_align,
                paper_grain: item.paper_grain,
                parallel_roll_width: item.parallel_rollWidth,
                std_paper_id: item.std_paper_id
            },
            paper_tolerance: {
                gripper: tol[0],
                color_bar: tol[1],
                paper_edge: tol[2],
                bleed: tol[3],
                is_editLayout: item.is_editTolerance,
            },
            paper_usage: {
                sig: item.sig,
                split: item.split,
                ups: item.ups,
                line: []
            },
            process: [
                {
                    type: 'afterpress',
                    name: 'assembly',
                    type_id: 7,
                    process_id: 20,
                    info: {

                    },
                    line: []
                },
                {
                    type: 'afterpress',
                    name: 'diecut',
                    type_id: 7,
                    process_id: 21,
                    info: {
                    },
                    line: []
                },
            ],
            thickness: {
                mm: {
                    thickness: item.thickness,
                    packing_thickness: item.packing_thickness
                },
                inch: {
                    thickness: mm2inch(item.thickness),
                    packing_thickness: mm2inch(item.packing_thickness)
                }
            },
            weight: {
                weight: item.weight
            },
            special_ink: []
        })
    })
    var paper_usage = []
    db.tb_rfq_paperusage.forEach((item) => {
        paper_usage.push({
            component_id: item.component_id,
            after_ups: (item.after_ups.split(',')).map(x => (parseFloat(x))),
            after_waste: (item.after_waste.split(',')).map(x => (parseFloat(x))),
            kilogram: (item.kg.split(',')).map(x => (parseFloat(x))),
            paper_net: (item.paper_net.split(',')).map(x => (parseFloat(x))),
            paper_print: (item.paper_print.split(',')).map(x => (parseFloat(x))),
            paper_qty: (item.paper_qty.split(',')).map(x => (parseFloat(x))),
            qty: (item.job_qty.split(',')).map(x => (parseFloat(x))),
            ton: (item.ton.split(',')).map(x => (parseFloat(x))),
            waste: (item.waste.split(',')).map(x => (parseFloat(x)))
        })
    })
    mainData.component1.forEach((item) => {
        paper_usage.forEach((item1) => {
            if (item.component_id == item1.component_id) {
                item1.after_ups.forEach((item2, index2) => {
                    item.paper_usage.line.push({
                        after_ups: item2,
                        after_waste: item1.after_waste[index2],
                        kilogram: item1.kilogram[index2],
                        paper_net: item1.paper_net[index2],
                        paper_print: item1.paper_print[index2],
                        paper_qty: item1.paper_qty[index2],
                        qty: item1.qty[index2],
                        ton: item1.ton[index2],
                        waste: item1.waste[index2],
                        price: {}
                    })
                })
            }
        })

        db.tb_rfq_waste.forEach((item1) => {
            if (item.component_id == item1.component_id) {
                item.waste = {
                    waste: (item1.total_waste.split(',')).map(x => (parseInt(x))),
                    waste_afterpress: (item1.afterpress_waste.split(',')).map(x => (parseInt(x))),
                    waste_bossing: (item1.bossing_waste.split(',')).map(x => (parseInt(x))),
                    waste_coating: (item1.coating_waste.split(',')).map(x => (parseInt(x))),
                    waste_corrugated_board: (item1.corrugated_waste.split(',')).map(x => (parseInt(x))),
                    waste_foilstamp: (item1.foilstamp_waste.split(',')).map(x => (parseInt(x))),
                    waste_print: (item1.print_waste.split(',')).map(x => (parseInt(x))),
                    waste_print_col_add: (item1.printColAdd_waste.split(',')).map(x => (parseInt(x))),
                    waste_color_limit: (item1.coldorLimit_waste.split(',')).map(x => (parseInt(x)))
                }
            }
        })

        item.delivery = []
        db.tb_rfq_delivery.forEach((item1) => {
            if (item.component_id == item1.component_id) {
                item.delivery.push({
                    gross_weight: item1.gross_weight,
                    net_weight: item1.net_weight,
                    unit_price: item1.unit_price,
                    // price: []
                })
            }
        })

        if (item.component_type.type != 3) {
            db.tb_rfq_paper.forEach((item1) => {
                if (item.component_id == item1.component_id) {
                    if (item1.is_sheetUnitPrice) {
                        var sheet_unit_price = true
                    } else {
                        var sheet_unit_price = false
                    }
                    item.paper = {
                        paper_code: item1.paper_code,
                        paper_cost: item1.cost,
                        paper_gram: item1.gram,
                        paper_markup: item1.mark_up,
                        //paper_name:item1., //!ต้อง join ไม่ได้เก็บลง db
                        paper_percent: item1.rollCut_percent,
                        paper_thickness: item1.thickness,
                        paper_total_price: item1.total_cost,
                        sheet_unit_price: sheet_unit_price
                    }
                    item.thickness.mm.paper_thickness = item1.thickness
                    item.thickness.inch.paper_thickness = mm2inch(item1.thickness)
                }
            })
        }

        if (item.component_type != 1) {
            db.tb_rfq_corrugated.forEach((item1) => {
                if (item.component_id == item1.component_id) {
                    item.corrugated_layer = {
                        component_flute_side: item1.component_flute_side,
                        info: {
                            all_gram: item1.all_gram,
                            corrugated_glued_cost: item1.corrugated_glued_cost,
                            corrugated_markup: item1.mark_up,
                            cost: (item1.cost.split(',')).map(x => (parseFloat(x))),
                            cut_off: item1.cut_off,
                            flute_align: item1.flute_align,
                            flute_side: item1.flute_side,
                            flute_type: item1.flute_type,
                            gram: (item1.gram.split(',')).map(x => (parseInt(x))),
                            name: item1.name,
                            num_layer: item1.num_layer,
                            thickness: item1.thickness,
                            unit_inch: (item1.unitPrice_inch.split(',')).map(x => (parseFloat(x))),
                            unit_price: (item1.unit_price.split(',')).map(x => (parseFloat(x)))
                        },
                        price: []
                    }
                    item.thickness.mm.corrugated_thickness = item1.thickness
                    item.thickness.inch.corrugated_thickness = mm2inch(item1.thickness)

                }
            })
        }

        if (db.tb_rfq_bossing.length != 0) {
            db.tb_rfq_bossing.forEach((item1) => {
                if (item.component_id == item1.component_id) {
                    item.addon.push({
                        type: item1.bossing_type,
                        process_id: item1.process_id,
                        bossing_id: item1.bossing_id,
                        info: {
                            block: { block_unit_price: item1.unitPrice_block, film_unit_price: item1.unitPrice_film },
                            block_rate: item1.block_rate,
                            depth: item1.depth,
                            depth_type: item1.depth_type,
                            film_rate: item1.film_rate,
                            width: item1.width,
                            length: item1.length
                        },
                        line: []
                    })
                }
            })
        }
        if (db.tb_rfq_coating.length != 0) {
            db.tb_rfq_coating.forEach((item1) => {
                if (item.component_id == item1.component_id) {
                    item.addon.push({
                        type: 'coating',
                        type_id: 3,
                        process_id: item1.process_id,
                        coating_id: item1.coating_id,
                        info: {
                            coating_price: item1.unit_price,
                            code: item1.code,
                            length: item1.length,
                            min_cost: item1.min_cost,
                            name: item1.coating_option,
                            side: item1.side,
                            //type:item1.type //!ต้อง join ไม่ได้เก็บลง db,
                            unit_min_cost: item1.unit_min_cost,
                            width: item1.width,
                            material_type: item1.material_type
                        },
                        line: []
                    })
                }
            })
        }
        if (db.tb_rfq_foilstamp.length != 0) {
            db.tb_rfq_foilstamp.forEach((item1) => {
                if (item.component_id == item1.component_id) {
                    item.addon.push({
                        type: 'foilstamp',
                        type_id: 4,
                        foilstamp_id: item1.foilstamp_id,
                        info: {
                            block: { block_unit_price: item1.unitPrice_block, film_unit_price: item1.unitPrice_film },
                            block_rate: item1.block_rate,
                            is_customFoil: item1.is_customFoil,
                            code: item1.code,
                            color: item1.color,
                            color_th: item1.color_th,
                            //depth:0, //! ราคาไม่ขึ้นกับความหนาของการ stamping
                            //depth_type:"", //! ราคาไม่ขึ้นกับความหนาของการ stamping
                            film_rate: item1.film_rate,
                            foil_length: item1.foilRoll_length,
                            foil_roll_price: item1.foilRoll_price,
                            foil_roll_min_price: item1.foilRoll_min_price,
                            foil_unit_price: item1.unitPrice_foil,
                            foil_width: item1.foilRoll_width,
                            length: item1.length,
                            width: item1.width,
                            pcs_per_roll: item1.pcs_per_roll
                        },
                        line: []
                    })
                }
            })
        }

        if (db.tb_rfq_carton.length != 0) {
            db.tb_rfq_carton.forEach((item1) => {
                if (item.component_id == item1.component_id) {
                    item.packing.push({
                        type: 'packing',
                        name: 'carton',
                        type_id: 11,
                        process_id: 27,
                        info: {
                            bulk: {
                                bulk_size: (item1.bulk_size.split(',')).map(x => (parseFloat(x))),
                                qty_per_bulk: item1.qty_per_bulk,
                                unit: item1.bulk_unit,
                                weight_per_bulk: item1.bulk_weight
                            },
                            carton: {
                                bulk_per_layer: item1.bulk_per_layer,
                                layer_per_carton: item1.layer,
                                num_layout: (item1.num_layout.split(',')).map(x => (parseInt(x))),
                                qty_per_layer: item1.qty_per_layer,
                                qty_per_carton: item1.qty_per_carton,
                                weight_per_layer: item1.weight_per_layer
                            },
                            corrugated: {
                                all_gram: item1.corrugated_allgram,
                                area_corrugated: item1.corrugated_area,
                                board_price_per_carton: item1.corrugated_ppu,
                                corrugated_layer: item1.corrugated_layer,
                                flute_type: item1.corrugated_flute,
                                grade: item1.corrugated_grade,
                                gram: (item1.corrugated_gram.split(',')).map(x => (parseInt(x))),
                                length_metre: item1.corrugated_length,
                                price: item1.corrugated_ppu_ft,
                                price_inch: item1.corrugated_ppu_inch,
                                size: (item1.corrugated_size.split(',')).map(x => parseFloat(x)),
                                thickness: item1.corrugated_thickness
                            },
                            dummy_size: {
                                cube: (item1.dummy_cube_size.split(',')).map(x => parseFloat(x)),
                                inner_size: (item1.dummy_inner_size.split(',')).map(x => parseFloat(x)),
                                outer_size: (item1.dummy_outer_size.split(',')).map(x => parseFloat(x)),
                            },
                            gross_weight: item1.gross_weight,
                            net_weight: item1.net_weight,
                            size: {
                                cube: (item1.cube_size.split(',')).map(x => parseFloat(x)),
                                inner_size: (item1.inner_size.split(',')).map(x => parseFloat(x)),
                                outer_size: (item1.outer_size.split(',')).map(x => parseFloat(x)),
                            },
                        },
                        line: []
                    })
                }
            })
        }

        if (db.tb_rfq_paperband.length != 0) {
            db.tb_rfq_paperband.forEach((item1) => {
                if (item.component_id == item1.component_id) {
                    var paperband_obj = {
                        qty: (item1.job_qty.split(',')).map(x => (parseInt(x))),
                        stack: (item1.paperband_qty.split(',')).map(x => (parseInt(x))),
                        roll_usage: (item1.roll_usage.split(',')).map(x => (parseInt(x))),
                        cost_per_stack: (item1.cost_per_band.split(',')).map(x => (parseInt(x))),
                    }
                    var paperband_arr = []
                    paperband_obj.qty.forEach((item2, index2) => {
                        paperband_arr.push({
                            qty: item2,
                            stack: paperband_obj.stack[index2],
                            roll_usage: paperband_obj.roll_usage[index2],
                            cost_per_stack: paperband_obj.cost_per_stack[index2],
                        })
                    })
                    item.packing.push({
                        type: 'packing',
                        name: 'paperband',
                        type_id: 11,
                        process_id: 25,
                        info: {
                            paperband: paperband_arr,
                            qty_per_paperband: item1.qty_per_band,
                            roll_length: item1.roll_length,
                            roll_price: item1.roll_price,
                            roll_width: item1.roll_width,
                            stack_size: (item1.size.split(',')).map(x => (parseFloat(x))),
                            stack_weight: item1.weight,
                            thickness: item1.thickness,
                            type: item1.paperband_type
                        },
                        line: []
                    })
                }
            })
        }
        if (db.tb_rfq_kraftwrap.length != 0) {
            db.tb_rfq_kraftwrap.forEach((item1) => {
                if (item.component_id == item1.component_id) {
                    item.packing.push({
                        type: 'packing',
                        type_id: 11,
                        process_id: 26,
                        name: 'kraftwrap',
                        info: {
                            bulk_height: (item1.bulk_height.split(',')).map(x => parseFloat(x)),
                            bulk_size: (item1.bulk_size.split(',')).map(x => parseFloat(x)),
                            cube_size: (item1.cube_size.split(',')).map(x => parseFloat(x)),
                            gross_weight: item1.gross_weight,
                            inner_size: (item1.inner_size.split(',')).map(x => parseFloat(x)),
                            layer_per_pack: item1.layer,
                            net_weight: item1.net_weight,
                            num_bulk_per_layer: item1.bulk_per_layer,
                            num_per_layer: item1.qty_per_layer,
                            num_side: (item1.num_layout.split(',')).map(x => parseInt(x)),
                            outer_size: (item1.outer_size.split(',')).map(x => parseFloat(x)),
                            qty_per_kraftwrap: item1.qty_per_pack_manual,
                            qty_per_pack: item1.qty_per_pack,
                            unit_price: item1.unit_price,
                            weight_per_layer: item1.weight_per_layer
                        },
                        line: []
                    })
                }
            })
        }
        if (db.tb_rfq_pallet.length != 0) {
            db.tb_rfq_pallet.forEach((item1) => {
                if (item.component_id == item1.component_id) {
                    item.packing.push({
                        type: 'packing',
                        type_id: 11,
                        process_id: 28,
                        name: 'pallet',
                        info: {
                            bulk_qty_pallet: item1.bulk_per_pallet,
                            bulk_size: (item1.bulk_size.split(',')).map(x => parseFloat(x)),
                            delivery_id: item1.delivery_id,
                            delivery_type: item1.delivery_type,
                            laying: {
                                cube_size: (item1.cube_size.split(',')).map(x => parseFloat(x)),
                                qty_layer: item1.bulk_per_layer
                            },
                            layer_per_pallet: item1.layer,
                            pallet_height: item1.pallet_height,
                            pallet_id: item1.pallet_id,
                            pallet_price: item1.pallet_price,
                            pallet_size: (item1.pallet_size.split(',')).map(x => parseFloat(x)),
                            pallet_weight: item.pallet_weight,
                            qty_pallet: item1.qty_per_pallet,
                            weight_per_layer: item1.weight_per_layer
                        },
                        line: []
                    })
                }
            })
        }

    })

    db.tb_rfq_subitem.forEach((item) => {
        mainData.qty.main.forEach((item1) => {
            if (item.process_type == 'material') {
                //* material 
                mainData.material.forEach((item2) => {
                    if (item2.material_id == item.subitem_id && item2.name == item.process_name && item.job_qty == item1) {
                        item2.line.push({
                            qty: item.proc_qty,
                            unit_price: item.unit_price,
                            price: item.price
                        })
                    }
                })
            }
            if (item.process_type == 'otherCost') {
                //* other cost
                mainData.otherCost.forEach((item2) => {
                    if (item2.other_id == item.subitem_id && item2.name == item.process_name && item.job_qty == item1) {
                        item2.line.push({
                            qty: item.proc_qty,
                            unit_price: item.unit_price,
                            price: item.price
                        })
                    }
                })
            }
            if (item.process_type == 'other' || item.process_type == 'handwork') {
                //* main process
                var findProc = (mainData.process.filter((item2) => { return (item2.name == item.process_name && item2.process_order == item.subitem_id && item2.type == item.process_type) })).length
                if (findProc == 0) {
                    mainData.process.push({
                        type: item.process_type,
                        type_id: item.process_type_id,
                        process_order: item.subitem_id,
                        name: item.process_name,
                        info: {},
                        line: []
                    })
                }

                mainData.process.forEach((item2) => {
                    if (item2.process_order == item.subitem_id && item2.type == item.process_type && item2.name == item.process_name && item.job_qty == item1) {
                        item2.line.push({
                            qty: item.proc_qty,
                            unit_price: item.unit_price,
                            price: item.price
                        })
                    }
                })
            }
            if (item.process_type == 'afterpress') {
                //* main process
                mainData.process.forEach((item2) => {
                    if (item2.info.name == item.proc_name && item.job_qty == item1) {
                        item2.line.push({
                            qty: item.proc_qty,
                            unit_price: item.unit_price,
                            price: item.price
                        })
                    }
                })
            }
        })
    })

    mainData.component1.forEach((item) => {
        mainData.qty.main.forEach(() => {
            item.addon.forEach((item2) => {
                if (item2.type == 'emboss' || item2.type == 'deboss') {
                    item2.line.push({
                        block: {},
                        labor: {}
                    })
                } else if (item2.type == 'foilstamp') {
                    item2.line.push({
                        block: {},
                        labor: {},
                        foil_roll: {}
                    })
                }
            })
            item.process.forEach((item2) => {
                if (item2.name == 'diecut') {
                    item2.line.push({
                        block: {},
                        labor: {}
                    })
                }
            })
        })
        db.tb_rfq_subitem.forEach((item1) => {
            mainData.qty.main.forEach((item2, index2) => {
                if (item.component_id == item1.component_id && item1.process_type == 'delivery' && item1.job_qty == item2) {
                    item.delivery.price.push({
                        qty: item1.proc_qty,
                        unit_price: item1.unit_price,
                        price: item1.price
                    })
                }
                if (item.component_type.type != 3 && item.component_id == item1.component_id && item1.process_type == 'paper' && item1.job_qty == item2) {
                    item.paper_usage.line[index2].price.paper = {
                        qty: item1.proc_qty,
                        unit_price: item1.unit_price,
                        price: item1.price
                    }

                }
                if (item.component_id == item1.component_id && item1.process_type == 'plate' && item1.job_qty == item2) {
                    if (!item.paper_usage.line[index2].price.plate) {
                        item.paper_usage.line[index2].price.plate = { outside: {}, inside: {} }
                    }
                    if (item1.price_type == 'outside') {
                        item.paper_usage.line[index2].price.plate.outside = {
                            qty: item1.proc_qty,
                            unit_price: item1.unit_price,
                            price: item1.price
                        }
                    } else if (item1.price_type == 'inside') {
                        item.paper_usage.line[index2].price.plate.inside = {
                            qty: item1.proc_qty,
                            unit_price: item1.unit_price,
                            price: item1.price
                        }
                    }
                }
                if (item.component_id == item1.component_id && item1.process_type == 'print' && item1.job_qty == item2) {
                    if (!item.paper_usage.line[index2].price.print) {
                        item.paper_usage.line[index2].price.print = { outside: {}, inside: {} }
                    }
                    if (item1.price_type == 'outside') {
                        item.paper_usage.line[index2].price.print.outside = {
                            qty: item1.proc_qty,
                            unit_price: item1.unit_price,
                            price: item1.price
                        }
                    } else if (item1.price_type == 'inside') {
                        item.paper_usage.line[index2].price.print.inside = {
                            qty: item1.proc_qty,
                            unit_price: item1.unit_price,
                            price: item1.price
                        }
                    }
                }

                if (item.component_type.type != 1) {
                    if (item.component_id == item1.component_id && item1.process_type == 'corrugated' && item1.job_qty == item2) {
                        item.corrugated_layer.price.push({
                            qty: item1.proc_qty,
                            unit_price: item1.unit_price,
                            price: item1.price
                        })
                    }
                }
            })

        })
        item.process.forEach((item1) => {
            db.tb_rfq_subitem.forEach((item2) => {
                if (item.component_id == item2.component_id) {
                    if (item1.name != 'diecut') {
                        mainData.qty.main.forEach((item3) => {
                            if (item1.name == item2.process_name && item2.job_qty == item3) {
                                item1.line.push({
                                    qty: item2.proc_qty,
                                    unit_price: item2.unit_price,
                                    price: item2.price
                                })

                            }
                        })
                    } else {
                        mainData.qty.main.forEach((item3, index3) => {
                            if (item1.name == item2.process_name && item2.job_qty == item3) {
                                if (item2.price_type == 'block') {
                                    item1.line[index3].block = {
                                        qty: item2.proc_qty,
                                        unit_price: item2.unit_price,
                                        price: item2.price
                                    }
                                } else if (item2.price_type == 'labor') {
                                    item1.line[index3].labor = {
                                        qty: item2.proc_qty,
                                        unit_price: item2.unit_price,
                                        price: item2.price
                                    }
                                }
                            }
                        })
                    }
                }
            })
        })
        item.packing.forEach((item1) => {
            db.tb_rfq_subitem.forEach((item2) => {
                if (item.component_id == item2.component_id) {
                    mainData.qty.main.forEach((item3) => {
                        if (item1.name == item2.process_name && item2.job_qty == item3) {
                            item1.line.push({
                                qty: item2.proc_qty,
                                unit_price: item2.unit_price,
                                price: item2.price
                            })
                        }
                    })
                }
            })
        })

        item.addon.forEach((item1) => {
            db.tb_rfq_subitem.forEach((item2) => {
                if (item.component_id == item2.component_id) {
                    if (item1.type == 'emboss' || item1.type == 'deboss') {
                        mainData.qty.main.forEach((item3, index3) => {
                            if (item1.type == item2.process_type && item1.bossing_id == item2.subitem_id && item2.job_qty == item3) {
                                if (item2.price_type == 'labor') {
                                    item1.line[index3].labor = {
                                        qty: item2.proc_qty,
                                        unit_price: item2.unit_price,
                                        price: item2.price
                                    }
                                } else if (item2.price_type == 'block') {
                                    item1.line[index3].block = {
                                        qty: item2.proc_qty,
                                        unit_price: item2.unit_price,
                                        price: item2.price
                                    }
                                }
                            }
                        })
                    } else if (item1.type == 'foilstamp') {
                        mainData.qty.main.forEach((item3, index3) => {
                            if (item1.type == item2.process_type && item1.foilstamp_id == item2.subitem_id && item2.job_qty == item3) {
                                if (item2.price_type == 'labor') {
                                    item1.line[index3].labor = {
                                        qty: item2.proc_qty,
                                        unit_price: item2.unit_price,
                                        price: item2.price
                                    }
                                } else if (item2.price_type == 'block') {
                                    item1.line[index3].block = {
                                        qty: item2.proc_qty,
                                        unit_price: item2.unit_price,
                                        price: item2.price
                                    }
                                } else if (item2.price_type == 'foil_roll') {
                                    item1.line[index3].foil_roll = {
                                        qty: item2.proc_qty,
                                        unit_price: item2.unit_price,
                                        price: item2.price
                                    }
                                }
                            }
                        })
                    } else if (item1.type == 'coating') {
                        mainData.qty.main.forEach((item3) => {
                            if (item1.type == item2.process_type && item1.coating_id == item2.subitem_id && item2.job_qty == item3) {
                                item1.line.push({
                                    qty: item2.proc_qty,
                                    unit_price: item2.unit_price,
                                    price: item2.price
                                })
                            }
                        })
                    }
                }
            })
        })
    })

    dat.data_Estimate = mainData
}

function storeDataList(data_list) {
    data_list.forEach((item) => {
        var totalprice = (item.total_price?.split(',').map((x) => numeral(parseFloat(x)).format('0,0.00') + ' THB'))?.join(', ')
        var unitprice = (item.unit_price?.split(',').map((x) => numeral(parseFloat(x)).format('0,0.00') + ' THB'))?.join(', ')
        item.total_price = totalprice
        item.unit_price = unitprice
    })
    dat.data_fetchList = data_list

}


function prepareComponentPaperDataToDB(jobData = {}) {
    const arr = []

    if (!jobData?.component1?.length) return arr

    const {
        component1 = [],
        qty: {
            main = [],
            totalqty = []
        },
        job: {
            is_multiple_f = 0
        }
    } = jobData || {}

    component1?.forEach((comp, cIndex) => {

        const mainQty = totalqty[0]

        comp?.paper_usage?.line?.forEach((paper, pIndex) => {
            if (comp?.paper) {
                arr.push({
                    component_id: cIndex + 1 || null,
                    component_name: comp?.component_name || null,
                    job_qty: (is_multiple_f ? mainQty : totalqty[pIndex]) || 0,

                    part_name: comp?.component_type?.detail_th || null,
                    part_name_custom: comp?.box_type?.type_name || null,

                    is_fsc: 0,
                    is_baht_per_sheet: comp?.paper?.sheet_unit_price ? 1 : 0,
                    paper_source_type: 1,

                    paper_type: `${comp?.paper?.is_custom ? 'กำหนดเอง : ' + comp?.paper?.paper_name : comp?.paper?.paper_name}` || null,
                    paper_gram: comp?.paper?.paper_gram || 0,
                    paper_cost: comp?.paper?.paper_cost || 0,
                    paper_markup_percent: comp?.paper?.paper_markup || 0,
                    paper_cut: comp?.paper?.paper_percent || 0,
                    paper_sales: comp?.paper?.paper_total_price || 0,
                    source_paper_width: comp?.paper_info?.roll_width || null,
                    source_paper_length: comp?.paper_info?.cut_off || null,
                    width: comp?.paperSize[2] || null,
                    length: comp?.paperSize[3] || null,
                    paper_net: paper?.paper_net || 0,
                    weight_kg: paper?.kilogram || 0,
                    weight_tons: paper?.ton || 0,
                    ups: comp?.paper_usage?.ups || 0,
                    after_ups: paper?.after_ups || 0,
                    waste: paper?.waste || 0,
                    after_waste: paper?.after_waste || 0,
                    sig: comp?.paper_usage?.sig || 0,
                    paper_print: paper?.paper_print || 0,
                    split: comp?.paper_usage?.split || 0,
                    paper_qty: paper?.paper_qty || 0,
                    lay_width: comp?.layout?.selected_layout ? comp?.layout?.selected_layout?.layout[0] : 0,
                    lay_cut_off: comp?.layout?.selected_layout ? comp?.layout?.selected_layout?.layout[1] : 0,
                })
            }


            if (comp?.corrugated_layer) {
                arr.push({
                    component_id: cIndex + 1 || null,
                    component_name: comp?.component_name || null,
                    job_qty: (is_multiple_f ? mainQty : totalqty[pIndex]) || 0,

                    part_name: comp?.component_type?.detail_th || null,
                    part_name_custom: comp?.box_type?.type_name || null,

                    version_name: is_multiple_f ? comp?.f_detail?.f_list[pIndex]?.f_code : null,

                    is_fsc: 0,
                    is_baht_per_sheet: 1,
                    paper_source_type: 1,

                    paper_type: `ลอน ${comp?.corrugated_layer?.info?.flute_type} ${comp?.corrugated_layer?.info?.num_layer} ชั้น : ${comp?.corrugated_layer.info.name}`,
                    paper_gram: comp?.corrugated_layer.info.all_gram,
                    paper_cost: comp?.corrugated_layer?.info?.unit_price[pIndex] || 0,
                    paper_markup_percent: comp?.corrugated_layer?.info?.corrugated_markup,
                    paper_cut: 0,
                    paper_sales: comp?.corrugated_layer?.info?.unit_price[pIndex] || 0,

                    source_paper_width: comp?.corrugated_layer.info.flute_side,
                    source_paper_length: comp?.corrugated_layer.info.cut_off,
                    width: comp?.corrugated_layer.info.flute_side,
                    length: comp?.corrugated_layer.info.cut_off,

                    paper_net: paper?.paper_net || 0,
                    weight_kg: paper?.kilogram || 0,
                    weight_tons: paper?.ton || 0,
                    ups: comp?.paper_usage?.ups || 0,
                    after_ups: paper?.after_ups || 0,
                    waste: paper?.waste || 0,
                    after_waste: paper?.after_waste || 0,
                    sig: comp?.paper_usage?.sig || 0,
                    paper_print: paper?.paper_print || 0,
                    split: comp?.paper_usage?.split || 0,
                    paper_qty: paper?.paper_qty || 0,
                    lay_width: comp?.layout?.selected_layout ? comp?.layout?.selected_layout?.layout[0] : 0,
                    lay_cut_off: comp?.layout?.selected_layout ? comp?.layout?.selected_layout?.layout[1] : 0,
                })
            }
        })
    })

    return arr
}

function prepareComponentLayoutDataToDB(jobData = {}) {
    const arr = []

    if (!jobData?.component1?.length) return arr

    const {
        component1 = [],
        qty: {
            main = [],
            totalqty = []
        },
        job: {
            is_multiple_f = 0
        }
    } = jobData || {}

    component1?.forEach((comp, cIndex) => {
        const {
            layoutSize = [],
            layout = {},
            layout_grain = '',
            layout_manual = false,
            machine = {},
            packaging_size = {},
            paperSize = [],
            paper_tolerance = {},
            paper_info = {}
        } = comp || {}

        const { selected_layout = {} } = layout || {}

        arr.push({
            component_id: cIndex + 1 || null,
            component_name: comp?.component_name || null,
            part_name: comp?.component_type?.detail_th || null,
            part_name_custom: comp?.box_type?.type_name || null,

            machine_id: machine?.machine_size?.id || null,
            machine_name: machine?.machine_size?.name || null,

            open_size_width: packaging_size?.open_size[0] || null,
            open_size_length: packaging_size?.open_size[1] || null,

            layout_size_width: selected_layout?.layout_size[0] || null,
            layout_size_length: selected_layout?.layout_size[1] || null,

            paper_size_width: paperSize[2] || null,
            paper_size_length: paperSize[3] || null,

            source_paper_size_width: selected_layout?.paper_size[0] || null,
            source_paper_size_length: selected_layout?.paper_size[1] || null,

            part_grain_type: selected_layout?.grain_box_type || null,
            laying_width: selected_layout?.layout[0] || null,
            laying_cutoff: selected_layout?.layout[1] || null,

            print_type_id_main: null,
            print_type_id_sub: null,
            page_fold: null,
            page_waste: null,
            gripper_mm: paper_tolerance?.gripper || 0,
            colorbar_mm: paper_tolerance?.color_bar || 0,
            paper_edge_mm: paper_tolerance?.paper_edge || 0,
            trim_mm: paper_tolerance?.bleed || 0,
            layout_edge_mm: paper_tolerance?.layout_edge || 0,
            is_manual_layout: layout?.layout_manual ? 1 : 0,
            is_manual_paper: paper_info?.std_paper_id ? 1 : 0,
            is_manual_laying: layout?.is_editLayout ? 1 : 0,
            is_manual_tolerance: paper_tolerance?.is_editTolerance ? 1 : 0,

        })
    })

    return arr
}