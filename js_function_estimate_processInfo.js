/**
 * ProcessInfoBuilder Class
 * สร้างและจัดการข้อมูล process_info สำหรับ component แต่ละตัว
 * เพื่อใช้ในการ transform data ไปยังระบบ estimate-packaging-class.js
 */

class ProcessInfoBuilder {
    constructor(estimateInstance) {
        this.est = estimateInstance
        this.mainData = estimateInstance.mainData
    }

    //* ==================== Helper Functions ====================
    getUnitId(unitName) {
        const unitMap = {
            'pcs': 1, 'pcs.': 1, 'Pcs': 1, 'Pcs.': 1,
            'kg': 2, 'kg.': 2, 'Kg.': 2,
            'g': 3,
            'mm': 4,
            'cm': 5,
            'inch': 6,
            'set': 7,
            'tons': 8,
            'ml': 9,
            'L': 10,
            'paperband': 11, 'band': 11,
            'kraft wrap': 12, 'pack': 12, 'wrap': 12,
            'carton': 13,
            'pallet': 14,
            'unit': 15,
            'job': 16,
            'roll': 17,
            'box': 18,
            'sheet': 19,
            'plate': 20,
            'shipment': 21,
            'minutes': 22,
            'block': 23
        }
        return unitMap[unitName] || 15 // default to 'unit'
    }

    getPackagingProcessId(name) {
        const processMap = {
            'paper': { mi2_process_id: 73, unit_name: 'sheet', process_group: 'material' },
            'corrugated': { mi2_process_id: 145, unit_name: 'sheet', process_group: 'material' },
            'special_ink': { mi2_process_id: 78, unit_name: 'unit', process_group: 'material' },
            'plate': { mi2_process_id: 74, unit_name: 'plate', process_group: 'plate' },
            'plate_turn_back': { mi2_process_id: 75, unit_name: 'plate', process_group: 'plate' },
            'sub_plate': { mi2_process_id: 88, unit_name: 'plate', process_group: 'plate' },
            'print': { mi2_process_id: 76, unit_name: 'unit', process_group: 'print' },
            'print_turn_back': { mi2_process_id: 77, unit_name: 'unit', process_group: 'print' },
            'proof': { mi2_process_id: 81, unit_name: 'unit', process_group: 'proof' },
            'coating': { mi2_process_id: 34, unit_name: 'unit', process_group: 'process' },
            'foilstamp': { mi2_process_id: 35, unit_name: 'pcs', process_group: 'process' },
            'block_foilstamp': { mi2_process_id: 99, unit_name: 'block', process_group: 'process' },
            'roll_foilstamp': { mi2_process_id: 136, unit_name: 'roll', process_group: 'process' },
            'emboss': { mi2_process_id: 36, unit_name: 'pcs', process_group: 'process' },
            'block_emboss': { mi2_process_id: 100, unit_name: 'block', process_group: 'process' },
            'deboss': { mi2_process_id: 37, unit_name: 'pcs', process_group: 'process' },
            'block_deboss': { mi2_process_id: 101, unit_name: 'block', process_group: 'process' },
            'diecut': { mi2_process_id: 3, unit_name: 'unit', process_group: 'process' },
            'block_diecut': { mi2_process_id: 98, unit_name: 'block', process_group: 'process' },
            'digital_diecut': { mi2_process_id: 80, unit_name: 'unit', process_group: 'process' },
            'corrugated_glue': { mi2_process_id: 17, unit_name: 'pcs', process_group: 'process' },
            'chip': { mi2_process_id: 17, unit_name: 'pcs', process_group: 'handwork' },
            'inspection': { mi2_process_id: 82, unit_name: 'pcs', process_group: 'process' },
            'assembly': { mi2_process_id: 104, unit_name: 'unit', process_group: 'process' },
            'shrinkwrap': { mi2_process_id: 11, unit_name: 'pcs', process_group: 'process' },
            'trim': { mi2_process_id: 2, unit_name: 'pcs', process_group: 'process' },
            'kraftwrap': { mi2_process_id: 39, unit_name: 'kraft wrap', process_group: 'packing' },
            'paperband': { mi2_process_id: 38, unit_name: 'paperband', process_group: 'packing' },
            'carton': { mi2_process_id: 40, unit_name: 'carton', process_group: 'packing' },
            'pallet': { mi2_process_id: 41, unit_name: 'pallet', process_group: 'packing' },
            'material': { mi2_process_id: 65, unit_name: 'unit', process_group: 'material' },
            'other_material': { mi2_process_id: 65, unit_name: 'unit', process_group: 'material' },
            'process': { mi2_process_id: 62, unit_name: 'unit', process_group: 'process' },
            'other_process': { mi2_process_id: 139, unit_name: 'unit', process_group: 'process' },
            'handwork': { mi2_process_id: 63, unit_name: 'unit', process_group: 'handwork' },
            'outsource': { mi2_process_id: 64, unit_name: 'unit', process_group: 'process' },
            'shipping': { mi2_process_id: 66, unit_name: 'unit', process_group: 'packing' },
            'bag': { mi2_process_id: 11, unit_name: 'pcs', process_group: 'process' },
            'delivery': { mi2_process_id: 60, unit_name: 'shipment', process_group: 'packing' }
        }
        return processMap[name] || { mi2_process_id: null, unit_name: 'unit', process_group: 'process' }
    }

    normalizeLineArray(lineArray, targetLength) {
        if (!lineArray || lineArray.length === 0) {
            return Array(targetLength).fill(null).map(() => ({ process_qty: 0, unit_price: 0, price: 0 }))
        }
        if (lineArray.length === targetLength) {
            return lineArray.map(item => ({
                process_qty: item.qty || item.process_qty || 0,
                unit_price: item.unit_price || 0,
                price: item.price || 0,
                ...(item.f_code && { f_code: item.f_code })
            }))
        }
        // If array length is 1 but target is more, duplicate it
        if (lineArray.length === 1 && targetLength > 1) {
            return Array(targetLength).fill(null).map(() => ({
                process_qty: lineArray[0].qty || lineArray[0].process_qty || 0,
                unit_price: lineArray[0].unit_price || 0,
                price: lineArray[0].price || 0,
                ...(lineArray[0].f_code && { f_code: lineArray[0].f_code })
            }))
        }
        return lineArray
    }

    getPrintType() {
        return this.mainData.print_type?.name || ''
    }

    //* ==================== Main Build Function ====================
    buildProcessInfo(compIndex) {
        const comp = this.mainData.component1[compIndex]
        const targetLength = this.mainData.qty.totalqty.length

        // Initialize process_info structure
        comp.process_info = {
            material: [],
            plate: [],
            proof: [],
            print: [],
            process: [],
            other: [],
            handwork: [],
            packing: []
        }

        // Build all processes
        this.addPaperProcess(comp, compIndex, targetLength)
        this.addCorrugatedProcess(comp, compIndex, targetLength)
        this.addPlateProcess(comp, compIndex, targetLength)
        this.addProofProcess(comp, compIndex, targetLength)
        this.addPrintProcess(comp, compIndex, targetLength)
        this.addCoatingProcess(comp, compIndex, targetLength)
        this.addFoilstampProcess(comp, compIndex, targetLength)
        this.addBossingProcess(comp, compIndex, targetLength)
        this.addSpecialInkProcess(comp, compIndex, targetLength)
        this.addAssemblyProcess(comp, compIndex, targetLength)
        this.addDieCutProcess(comp, compIndex, targetLength)
        this.addDigitalDieCutProcess(comp, compIndex, targetLength)
        this.addCorrugatedGluedProcess(comp, compIndex, targetLength)

        this.addPackingProcess(comp, compIndex, targetLength)

        this.addComponentMaterialProcess(comp, compIndex, targetLength)
    }

    //* ==================== Add Process Methods ====================

    addPaperProcess(comp, compIndex, targetLength) {
        if (!comp.paper_usage?.line) return

        const processInfo = this.getPackagingProcessId('paper')
        const unitId = this.getUnitId(processInfo.unit_name)

        const paperLine = comp.paper_usage.line.map(item => ({
            process_qty: item.paper_print || 0,
            unit_price: item.paper?.unit_price || 0,
            price: item.paper?.price || 0
        }))

        comp.process_info.material.push({
            process_id: processInfo.mi2_process_id,
            unit_id: unitId,
            process_name: `Paper ${comp.paper?.paper_name || ''} ${comp.paper?.paper_gram || 0} gram`.trim(),
            remark: comp?.paper?.remark,
            is_apply_all_edition: true,
            info: {
                paper_info: comp.paper_info,
                paper_size: comp.paperSize,
                ups: comp.paper_usage.ups,
                split: comp.paper_usage.line[0]?.split || 1,
                sig: comp.paper_usage.sig
            },
            line: this.normalizeLineArray(paperLine, targetLength)
        })
    }

    addCorrugatedProcess(comp, compIndex, targetLength) {
        if (!comp.corrugated_layer?.price || comp.component_type?.type === 1) return

        const processInfo = this.getPackagingProcessId('corrugated')
        const unitId = this.getUnitId(processInfo.unit_name)

        const corrugatedLine = comp.corrugated_layer.price.map(item => ({
            process_qty: item.qty || 0,
            unit_price: item.unit_price || 0,
            price: item.price || 0
        }))

        const layerType = comp.corrugated_layer?.info?.flute_type || ''
        const numLayer = comp.corrugated_layer?.info?.num_layer || 0
        const grade = comp.corrugated_layer?.info?.name || ''

        comp.process_info.material.push({
            process_id: processInfo.mi2_process_id,
            unit_id: unitId,
            process_name: `Corrugated Board ลอน ${layerType} ${numLayer} ชั้น ${grade}`.trim(),
            remark: `${comp.corrugated_layer?.info?.flute_side || 0} x ${comp.corrugated_layer?.info?.cut_off || 0}`,
            is_apply_all_edition: true,
            info: {
                corrugated_layer: comp.corrugated_layer?.info,
                flute_side: comp.corrugated_layer?.info?.flute_side,
                cut_off: comp.corrugated_layer?.info?.cut_off,
                component_type: comp.component_type?.type
            },
            line: this.normalizeLineArray(corrugatedLine, targetLength)
        })
    }

    addPlateProcess(comp, compIndex, targetLength) {
        if (!comp.paper_usage?.line) return

        // Group by inside/outside
        const plateData = {
            inside: [],
            outside: []
        }

        comp.paper_usage.line.forEach((item, qIndex) => {
            if (item.plate?.inside) {
                plateData.inside.push({
                    qIndex,
                    ...item.plate.inside,
                    f_code: item.f_code
                })
            }
            if (item.plate?.outside) {
                plateData.outside.push({
                    qIndex,
                    ...item.plate.outside,
                    f_code: item.f_code
                })
            }
        })

        const processInfo = this.getPackagingProcessId('plate')
        const unitId = this.getUnitId(processInfo.unit_name)

        // Add inside plate
        if (plateData.inside.length > 0) {
            const fCodes = [...new Set(plateData.inside.map(p => p.f_code).filter(Boolean))]
            const numColor = plateData.inside[0]?.num_color || 0

            comp.process_info.plate.push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: `${fCodes.join(', ') || 'All'} Inside ${numColor} cols ${this.getPrintType()}`.trim(),
                remark: 'Inside',
                is_apply_all_edition: fCodes.length === 0,
                info: {
                    side: 'inside',
                    num_color: numColor,
                    f_code: fCodes
                },
                line: this.normalizeLineArray(plateData.inside, targetLength)
            })
        }

        // Add outside plate
        if (plateData.outside.length > 0) {
            const fCodes = [...new Set(plateData.outside.map(p => p.f_code).filter(Boolean))]
            const numColor = plateData.outside[0]?.num_color || 0

            comp.process_info.plate.push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: `${fCodes.join(', ') || 'All'} Outside ${numColor} cols ${this.getPrintType()}`.trim(),
                remark: 'Outside',
                is_apply_all_edition: fCodes.length === 0,
                info: {
                    side: 'outside',
                    num_color: numColor,
                    f_code: fCodes
                },
                line: this.normalizeLineArray(plateData.outside, targetLength)
            })
        }
    }

    addProofProcess(comp, compIndex, targetLength) {
        if (!comp.paper_usage?.line) return

        const proofLine = []
        comp.paper_usage.line.forEach(item => {
            if (item.price?.proof) {
                proofLine.push({
                    process_qty: item.price.proof.all.qty || 0,
                    unit_price: item.price.proof.all.unit_price || 0,
                    price: item.price.proof.all.price || 0
                })
            }
        })

        if (proofLine.length === 0) return

        const processInfo = this.getPackagingProcessId('proof')
        const unitId = this.getUnitId(processInfo.unit_name)

        comp.process_info.proof.push({
            process_id: processInfo.mi2_process_id,
            unit_id: unitId,
            process_name: 'Proof',
            remark: null,
            is_apply_all_edition: true,
            info: {},
            line: this.normalizeLineArray(proofLine, targetLength)
        })
    }

    addPrintProcess(comp, compIndex, targetLength) {
        if (!comp.paper_usage?.line) return

        const printData = {
            inside: [],
            outside: []
        }

        comp.paper_usage.line.forEach((item, qIndex) => {
            if (item.print?.inside) {
                printData.inside.push({
                    qIndex,
                    ...item.print.inside,
                    f_code: item.f_code
                })
            }
            if (item.print?.outside) {
                printData.outside.push({
                    qIndex,
                    ...item.print.outside,
                    f_code: item.f_code
                })
            }
        })

        const processInfo = this.getPackagingProcessId('print')
        const unitId = this.getUnitId(processInfo.unit_name)

        // Add inside print
        if (printData.inside.length > 0) {
            const fCodes = [...new Set(printData.inside.map(p => p.f_code).filter(Boolean))]
            const numColor = printData.inside[0]?.num_color || 0

            comp.process_info.print.push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: `${fCodes.join(', ') || 'All'} Inside ${numColor} cols ${this.getPrintType()}`.trim(),
                remark: 'Inside',
                is_apply_all_edition: fCodes.length === 0,
                info: {
                    side: 'inside',
                    num_color: numColor,
                    f_code: fCodes
                },
                line: this.normalizeLineArray(printData.inside, targetLength)
            })
        }

        // Add outside print
        if (printData.outside.length > 0) {
            const fCodes = [...new Set(printData.outside.map(p => p.f_code).filter(Boolean))]
            const numColor = printData.outside[0]?.num_color || 0

            comp.process_info.print.push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: `${fCodes.join(', ') || 'All'} Outside ${numColor} cols ${this.getPrintType()}`.trim(),
                remark: 'Outside',
                is_apply_all_edition: fCodes.length === 0,
                info: {
                    side: 'outside',
                    num_color: numColor,
                    f_code: fCodes
                },
                line: this.normalizeLineArray(printData.outside, targetLength)
            })
        }
    }

    addCoatingProcess(comp, compIndex, targetLength) {
        if (!comp.addon) return

        comp.addon.forEach(addon => {
            if (addon.type !== 'coating') return

            const processInfo = this.getPackagingProcessId('coating')
            const unitId = this.getUnitId(processInfo.unit_name)

            const { info } = addon
            const width = info?.width || 0
            const length = info?.length || 0
            const sizeText = width && length ? `(${width} x ${length} in²)` : ''
            const materialType = info?.material_type || ''
            const number = info?.number ? `(เบอร์ ${info.number})` : ''

            comp.process_info.process.push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: `${info?.name || ''} ${info?.code || ''} ${info?.side || 1} s ${sizeText} ${materialType} ${number}`.trim(),
                remark: info?.code || null,
                is_apply_all_edition: true,
                info: {
                    ...info,
                    width,
                    length
                },
                line: this.normalizeLineArray(addon.line, targetLength)
            })
        })
    }

    addFoilstampProcess(comp, compIndex, targetLength) {
        if (!comp.addon) return

        comp.addon.forEach(addon => {
            if (addon.type !== 'foilstamp') return

            const { info } = addon
            const fCodes = info?.f_code || []

            // 1. Labor (once)
            const laborProcessInfo = this.getPackagingProcessId('foilstamp')
            const laborUnitId = this.getUnitId(laborProcessInfo.unit_name)
            const laborLine = addon.line.map(item => ({
                process_qty: item.labor?.qty || 0,
                unit_price: item.labor?.unit_price || 0,
                price: item.labor?.price || 0,
                ...(fCodes.length && { f_code: fCodes })
            }))

            comp.process_info.process.push({
                process_id: laborProcessInfo.mi2_process_id,
                unit_id: laborUnitId,
                process_name: 'Foil Stamp',
                remark: 'Labor',
                is_apply_all_edition: fCodes.length === 0,
                info: {
                    f_code: fCodes,
                    sizes: [info?.width && info?.length ? [info.width, info.length] : []]
                },
                line: this.normalizeLineArray(laborLine, targetLength)
            })

            // 2. Roll (once)
            const rollProcessInfo = this.getPackagingProcessId('roll_foilstamp')
            const rollUnitId = this.getUnitId(rollProcessInfo.unit_name)
            const rollLine = addon.line.map(item => ({
                process_qty: item.foil_roll?.qty || 0,
                unit_price: item.foil_roll?.unit_price || 0,
                price: item.foil_roll?.price || 0,
                ...(fCodes.length && { f_code: fCodes })
            }))

            comp.process_info.process.push({
                process_id: rollProcessInfo.mi2_process_id,
                unit_id: rollUnitId,
                process_name: `Foil หน้าม้วน ${info?.foil_width || 0}" ความยาว ${info?.foil_length || 0} ft`,
                remark: `สีเงิน ${info?.foil_code || ''}`,
                is_apply_all_edition: fCodes.length === 0,
                info: {
                    f_code: fCodes,
                    foil_code: info?.foil_code,
                    foil_length: info?.foil_length
                },
                line: this.normalizeLineArray(rollLine, targetLength)
            })

            // 3. Block (per size)
            const blockProcessInfo = this.getPackagingProcessId('block_foilstamp')
            const blockUnitId = this.getUnitId(blockProcessInfo.unit_name)
            const width = info?.width || 0
            const length = info?.length || 0

            const blockLine = addon.line.map(item => ({
                process_qty: item.block?.qty || 0,
                unit_price: item.block?.unit_price || 0,
                price: item.block?.price || 0,
                ...(fCodes.length && { f_code: fCodes })
            }))

            comp.process_info.process.push({
                process_id: blockProcessInfo.mi2_process_id,
                unit_id: blockUnitId,
                process_name: `Block Foil Stamp ${fCodes.join(', ') || 'All'} Area (in²) : ${width} x ${length}`,
                remark: `${width} x ${length}`,
                is_apply_all_edition: fCodes.length === 0,
                info: {
                    f_code: fCodes,
                    size: [width, length]
                },
                line: this.normalizeLineArray(blockLine, targetLength)
            })
        })
    }

    addBossingProcess(comp, compIndex, targetLength) {
        if (!comp.addon) return

        comp.addon.forEach(addon => {
            if (!['emboss', 'deboss'].includes(addon.type)) return

            const { info } = addon
            const fCodes = info?.f_code || []
            const isEmboss = addon.type === 'emboss'
            const processType = isEmboss ? 'emboss' : 'deboss'

            // Labor
            const laborProcessInfo = this.getPackagingProcessId(processType)
            const laborUnitId = this.getUnitId(laborProcessInfo.unit_name)

            if (addon.line?.labor) {
                const laborLine = addon.line.labor.map(item => ({
                    process_qty: item.qty || 0,
                    unit_price: item.unit_price || 0,
                    price: item.price || 0,
                    ...(fCodes.length && { f_code: fCodes })
                }))

                comp.process_info.process.push({
                    process_id: laborProcessInfo.mi2_process_id,
                    unit_id: laborUnitId,
                    process_name: isEmboss ? 'Emboss' : 'Deboss',
                    remark: 'Labor',
                    is_apply_all_edition: fCodes.length === 0,
                    info: {
                        f_code: fCodes
                    },
                    line: this.normalizeLineArray(laborLine, targetLength)
                })
            }

            // Block (per size)
            const blockProcessInfo = this.getPackagingProcessId(`block_${processType}`)
            const blockUnitId = this.getUnitId(blockProcessInfo.unit_name)

            if (addon.line?.block) {
                addon.line.block.forEach(blockItem => {
                    const [width, length] = blockItem.size || [0, 0]

                    comp.process_info.process.push({
                        process_id: blockProcessInfo.mi2_process_id,
                        unit_id: blockUnitId,
                        process_name: `Block ${isEmboss ? 'Emboss' : 'Deboss'} Box Area (in²) : ${width} x ${length}`,
                        remark: `${width} x ${length}`,
                        is_apply_all_edition: fCodes.length === 0,
                        info: {
                            f_code: fCodes,
                            size: [width, length]
                        },
                        line: this.normalizeLineArray(blockItem.line, targetLength)
                    })
                })
            }
        })
    }

    addSpecialInkProcess(comp, compIndex, targetLength) {
        if (!comp.color || comp.color.length === 0) return

        comp.color.forEach(colorInfo => {
            if (!colorInfo.special_ink) return

            colorInfo.special_ink.forEach(speInk => {
                const processInfo = this.getPackagingProcessId('special_ink')
                const unitId = this.getUnitId(processInfo.unit_name)

                comp.process_info.material.push({
                    process_id: processInfo.mi2_process_id,
                    unit_id: unitId,
                    process_name: `${speInk.info?.name || 'Special Ink'} ${speInk?.name} : ${speInk?.info?.ink_name || '-'}`,
                    remark: null,
                    is_apply_all_edition: false,
                    info: {
                        ...speInk.info,
                        f_code: colorInfo.f_code ? [colorInfo.f_code] : []
                    },
                    line: this.normalizeLineArray(speInk.line, targetLength)
                })
            })
        })
    }

    addAssemblyProcess(comp, compIndex, targetLength) {
        if (!comp.process) return

        comp.process.forEach(proc => {
            if (proc.name !== 'assembly') return

            const processInfo = this.getPackagingProcessId('assembly')
            const unitId = this.getUnitId(processInfo.unit_name)

            comp.process_info.process.push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: `Assembly (ประกบ/ติดลิ้นกาว) ${comp?.box_type?.glued_spot || '-'} จุด`.trim(),
                remark: proc.info?.description || null,
                is_apply_all_edition: true,
                info: proc.info || {},
                line: this.normalizeLineArray(proc.line, targetLength)
            })
        })
    }

    addDieCutProcess(comp, compIndex, targetLength) {
        if (!comp.process) return

        comp.process.forEach(proc => {
            if (proc.name !== 'diecut') return

            const isReprint = comp.paper_usage?.is_useReprintPlate || false

            // Labor
            const laborProcessInfo = this.getPackagingProcessId('diecut')
            const laborUnitId = this.getUnitId(laborProcessInfo.unit_name)
            const laborLine = proc.line.map(item => ({
                process_qty: item.labor?.qty || 0,
                unit_price: item.labor?.unit_price || 0,
                price: item.labor?.price || 0
            }))

            comp.process_info.process.push({
                process_id: laborProcessInfo.mi2_process_id,
                unit_id: laborUnitId,
                process_name: `Diecut`,
                remark: 'Labor',
                is_apply_all_edition: true,
                info: {
                    is_reprint: isReprint
                },
                line: this.normalizeLineArray(laborLine, targetLength)
            })

            // Block
            const blockProcessInfo = this.getPackagingProcessId('block_diecut')
            const blockUnitId = this.getUnitId(blockProcessInfo.unit_name)
            const blockLine = proc.line.map(item => ({
                process_qty: item.block?.qty || 0,
                unit_price: item.block?.unit_price || 0,
                price: item.block?.price || 0
            }))

            comp.process_info.process.push({
                process_id: blockProcessInfo.mi2_process_id,
                unit_id: blockUnitId,
                process_name: `Block Diecut${isReprint ? ' (Reprint)' : ''}`,
                remark: 'Block',
                is_apply_all_edition: true,
                info: {
                    is_reprint: isReprint
                },
                line: this.normalizeLineArray(blockLine, targetLength)
            })
        })
    }

    addDigitalDieCutProcess(comp, compIndex, targetLength) {
        if (!comp.process) return

        comp.process.forEach(proc => {
            if (proc.name !== 'digital_diecut') return

            const processInfo = this.getPackagingProcessId('digital_diecut')
            const unitId = this.getUnitId(processInfo.unit_name)

            comp.process_info.process.push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: 'Digital Diecut',
                remark: null,
                is_apply_all_edition: true,
                info: {},
                line: this.normalizeLineArray(proc.line, targetLength)
            })
        })
    }

    addCorrugatedGluedProcess(comp, compIndex, targetLength) {
        if (!comp.process) return

        comp.process.forEach(proc => {
            if (proc.name !== 'corrugated_glued') return

            const processInfo = this.getPackagingProcessId('corrugated_glue')
            const unitId = this.getUnitId(processInfo.unit_name)

            comp.process_info.process.push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: 'ทากาวประกบลูกฟูกกับกระดาษ',
                remark: null,
                is_apply_all_edition: true,
                info: {},
                line: this.normalizeLineArray(proc.line, targetLength)
            })
        })
    }

    addChipProcess(compIndex, targetLength) {
        if (!this.mainData.process) return

        this.mainData.process.forEach(proc => {
            if (proc.name !== 'chip') return

            const processInfo = this.getPackagingProcessId('chip')
            const unitId = this.getUnitId(processInfo.unit_name)

            this.mainData.process_info.handwork.push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: proc.info?.name || 'แกะ',
                remark: null,
                is_apply_all_edition: true,
                info: proc.info || {},
                line: this.normalizeLineArray(proc.line, targetLength)
            })
        })
    }

    addInspectionProcess(compIndex, targetLength) {
        if (!this.mainData.process) return

        this.mainData.process.forEach(proc => {
            if (proc.name !== 'inspection') return

            const processInfo = this.getPackagingProcessId('inspection')
            const unitId = this.getUnitId(processInfo.unit_name)

            this.mainData.process_info.process.push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: proc.info?.name || 'Inspection',
                remark: null,
                is_apply_all_edition: true,
                info: proc.info || {},
                line: this.normalizeLineArray(proc.line, targetLength)
            })
        })
    }

    addShrinkwrapProcess(compIndex, targetLength) {
        if (!this.mainData.process) return

        this.mainData.process.forEach(proc => {
            if (proc.type !== 'shrinkwrap') return

            const processInfo = this.getPackagingProcessId('shrinkwrap')
            const unitId = this.getUnitId(processInfo.unit_name)

            this.mainData.process_info.process.push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: proc.info?.name || 'Shrinkwrap',
                remark: null,
                is_apply_all_edition: true,
                info: proc.info || {},
                line: this.normalizeLineArray(proc.line, targetLength)
            })
        })
    }

    addBagProcess(compIndex, targetLength) {
        if (!this.mainData.process) return

        this.mainData.process.forEach(proc => {
            if (proc.type !== 'bag') return

            const processInfo = this.getPackagingProcessId('bag')
            const unitId = this.getUnitId(processInfo.unit_name)

            this.mainData.process_info.process.push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: proc.info?.name || 'Bag',
                remark: null,
                is_apply_all_edition: true,
                info: proc.info || {},
                line: this.normalizeLineArray(proc.line, targetLength)
            })
        })
    }

    addTrimProcess(compIndex, targetLength) {
        if (!this.mainData.process) return

        this.mainData.process.forEach(proc => {
            if (proc.type !== 'trim') return

            const processInfo = this.getPackagingProcessId('trim')
            const unitId = this.getUnitId(processInfo.unit_name)

            this.mainData.process_info.process.push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: proc.info?.name || 'Trim',
                remark: null,
                is_apply_all_edition: true,
                info: proc.info || {},
                line: this.normalizeLineArray(proc.line, targetLength)
            })
        })
    }

    addPackingProcess(comp, compIndex, targetLength) {
        if (!comp.packing) return

        const isDiffPacking = getIsDifferentPacking()
        const isMultipleF = getIsMultipleF()
        const fIndexesToProcess = isDiffPacking && isMultipleF ? comp.packing.length : 1

        for (let fIndex = 0; fIndex < fIndexesToProcess; fIndex++) {
            if (!comp.packing[fIndex]) continue

            comp.packing[fIndex].forEach(packItem => {
                let processInfo, unitId, processName

                switch (packItem.name) {
                    case 'paperband':
                        processInfo = this.getPackagingProcessId('paperband')
                        unitId = this.getUnitId(processInfo.unit_name)
                        processName = 'Paperband'
                        break
                    case 'kraftwrap':
                        processInfo = this.getPackagingProcessId('kraftwrap')
                        unitId = this.getUnitId(processInfo.unit_name)
                        processName = 'Kraftwrap'
                        break
                    case 'carton':
                        processInfo = this.getPackagingProcessId('carton')
                        unitId = this.getUnitId(processInfo.unit_name)
                        processName = 'Carton'
                        break
                    case 'pallet':
                        processInfo = this.getPackagingProcessId('pallet')
                        unitId = this.getUnitId(processInfo.unit_name)
                        processName = 'Pallet'
                        break
                    default:
                        return
                }

                comp.process_info.packing.push({
                    process_id: processInfo.mi2_process_id,
                    unit_id: unitId,
                    process_name: `${processName}`,
                    remark: null,
                    is_apply_all_edition: true,
                    info: {
                        ...packItem.info,
                        fIndex
                    },
                    line: this.normalizeLineArray(packItem.line, targetLength)
                })
            })
        }
    }

    addMaterialProcess(compIndex, targetLength) {
        if (!this.mainData.material) return

        this.mainData.material.forEach(proc => {
            const processInfo = this.getPackagingProcessId('material')
            const unitId = this.getUnitId(processInfo.unit_name)

            this.mainData.process_info.material.push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: proc.name || 'Material',
                remark: null,
                is_apply_all_edition: true,
                info: proc.info || {},
                line: this.normalizeLineArray(proc.line, targetLength)
            })
        })
    }

    addComponentMaterialProcess(comp, compIndex, targetLength) {
        if (!comp.process) return

        comp.process.forEach(proc => {
            if (proc.type !== 'material') return

            const processInfo = this.getPackagingProcessId('material')
            const unitId = this.getUnitId(processInfo.unit_name)

            comp.process_info.material.push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: proc.info?.name || 'Component Material',
                remark: null,
                is_apply_all_edition: true,
                info: proc.info || {},
                line: this.normalizeLineArray(proc.line, targetLength)
            })
        })
    }

    addCustomProcess(compIndex, targetLength) {
        if (!this.mainData.process) return

        this.mainData.process.forEach(proc => {
            if (!['other', 'handwork', 'custom'].includes(proc.type)) return

            let processInfo, groupKey
            if (proc.type === 'other') {
                processInfo = this.getPackagingProcessId('other_process')
                groupKey = 'process'
            } else if (proc.type === 'handwork') {
                processInfo = this.getPackagingProcessId('handwork')
                groupKey = 'handwork'
            } else {
                processInfo = this.getPackagingProcessId('outsource')
                groupKey = 'process'
            }

            const unitId = this.getUnitId(processInfo.unit_name)

            // Add to all components
            // this.mainData.component1.forEach((comp, idx) => {
            // })
            this.mainData.process_info[groupKey].push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: proc.info?.name || proc.name || proc.type,
                remark: null,
                is_apply_all_edition: proc.info?.is_fixedPrice || false,
                info: proc.info || {},
                line: this.normalizeLineArray(proc.line, targetLength)
            })
        })
    }

    addOtherCostProcess(compIndex, targetLength) {
        if (!this.mainData.otherCost) return

        this.mainData.otherCost.forEach(other => {
            const processInfo = this.getPackagingProcessId('other_material')
            const unitId = this.getUnitId(processInfo.unit_name)

            // Add to all components
            // this.mainData.component1.forEach((comp, idx) => {
            //     comp.process_info.other.push({
            //         process_id: processInfo.mi2_process_id,
            //         unit_id: unitId,
            //         process_name: other.info?.name || 'Other Cost',
            //         remark: null,
            //         is_apply_all_edition: other.info?.is_fixedPrice || false,
            //         info: other.info || {},
            //         line: this.normalizeLineArray(other.line, targetLength)
            //     })
            // })
            this.mainData.process_info.other.push({
                process_id: processInfo.mi2_process_id,
                unit_id: unitId,
                process_name: other.info?.name || 'Other Cost',
                remark: null,
                is_apply_all_edition: other.info?.is_fixedPrice || false,
                info: other.info || {},
                line: this.normalizeLineArray(other.line, targetLength)
            })
        })
    }
}
