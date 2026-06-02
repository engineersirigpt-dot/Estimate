class EstimatePDF {
    generatePDF(jobData) {
        // Define the document definition object
        document.title = jobData?.job?.job_id
        var docDefinition = {
            info: {
                title: `${jobData?.job?.job_id || 'Estimate'}`,
                author: "",
                subject: "",
                keywords: "",
            },
            content: [
                { width: "*", text: "" },
                { /* Job Desc. */
                    columns: [
                        {
                            width: "100%",
                            table: {
                                dontBreakRows: true,
                                widths: [
                                    100,
                                    "*",
                                    "*",
                                    "*",
                                    "*",
                                    "*",
                                    "*",
                                    "*",
                                ],
                                body: [
                                    ...this.getRowEstInfo(jobData),
                                    // ...this.getRowChkF(jobData)
                                ]
                            },
                            layout: {
                                paddingLeft: function (i, node) { return 1; },
                                paddingRight: function (i, node) { return 1; },
                                paddingTop: function (i, node) { return 1; },
                                paddingBottom: function (i, node) { return 1; }
                            },
                            // pageBreak: "after",
                        },
                        { width: "*", text: "" }
                    ]
                },
                { /* Qty */
                    columns: [
                        {
                            width: "100%",
                            table: {
                                dontBreakRows: true,
                                widths: [
                                    60,
                                    80,
                                    "*"
                                ],
                                body: [
                                    ...this.getRowQty(jobData)
                                ],
                            },
                            // padding: [0, 0, 0, 0],
                            // margin: [0, 0, 0, 0],
                        },
                        { width: "*", text: "" }
                    ],
                    margin: [0, 0, 0, 0],
                },
                this.getJobInfo(jobData),
                this.getRowComponent(jobData),
                this.getRowPaper(jobData),
                this.getRowCorrugated(jobData),
                this.getRowColor(jobData),
                { width: '100%', text: 'After Press', margin: [5, 5, 5, 5], border: [true, true, true, true] },
                this.getRowCoating(jobData),
                this.getRowFoilstamp(jobData),
                this.getRowBossing(jobData, 'emboss'),
                this.getRowBossing(jobData, 'deboss'),
                this.getRowProcessDynamicPrice(jobData, 'other'),
                this.getRowProcessDynamicPrice(jobData, 'handwork'),
                this.getRowProcessDynamicPrice(jobData, 'custom'),
                this.getRowProcessDynamicQty(jobData, 'material'),
                this.getRowProcessDynamicQty(jobData, 'otherCost'),
                this.getRowFile(jobData),
                this.getRowDelivery(jobData),
                this.getRowCustomer(jobData, 'priceDiff'),
                this.getRowCustomer(jobData, 'customer_gift'),
                ...this.getRowComponentSizeLayout(jobData),
                this.getRowPacking(jobData),
                /* SUMMARY */,
                ...this.getSummary(jobData),
                { width: "*", text: "" },
            ],
            layout: {
                paddingLeft: function (i, node) { return 1; },
                paddingRight: function (i, node) { return 1; },
                paddingTop: function (i, node) { return 1; },
                paddingBottom: function (i, node) { return 1; }
            },
            footer: {
                columns: [
                    { text: `${jobData?.job?.job_id} ${jobData?.job?.job_name} ${jobData?.estimate_date ? `- ${moment(jobData?.estimate_date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm')}` : ''}`, alignment: 'center', bold: true }
                ]
            },
            defaultStyle: {
                font: "THSarabunNew",
                fontSize: 7.5,
                alignment: "center",
                columnGap: 0,
            },
            pageSize: 'A4',
            pageMargins: [10, 10, 10, 20],
            style: {
                columnValue: {
                    paddingLeft: 3,
                    paddingRight: 3,
                    paddingTop: 3,
                    paddingBottom: 3
                }
            },
        };

        pdfMake.fonts = {
            THSarabunNew: {
                normal: "THSarabunNew",
                bold: "THSarabunNew Bold",
                italics: "THSarabunNew Italic",
                bolditalics: "THSarabunNew BoldItalic",
            },
        };

        // Generate the PDF
        pdfMake.createPdf(docDefinition).open();
    }


    getRowEstInfo(data) {
        console.log("getRowEstInfo", data, data?.ae)
        const {
            status_id = '',
            create_date,
            ae: {
                ae_id,
                ae_name
            },
            customer: {
                customer_id,
                customer_name
            },
            estimator: {
                estimator_name
            },
            job: {
                job_name,
                job_id,
                is_multiple_f,
                credit_term_name = ''

            },
            component1 = []
        } = data || {}

        const approve_status = status_id == 0 ? '-' : status_id == 1 ? 'Pending' : status_id == 2 ? 'Reject' : status_id == 3 ? 'Approve' : '-'

        let row1 = '', row2, row3, row4, row5

        row1 = [
            {
                text: "RFQ ID :",
                bold: true,
                alignment: "left",
                columnGap: 5,
            },
            {
                text: job_id || '-',
                bold: false,
                alignment: "left",
                columnGap: 20
            },
            {
                text: 'AE Name :',
                bold: true,
                alignment: "left",
            },
            {
                text: `${ae_id} : ${ae_name}`,
                bold: false,
                alignment: "left",
                columnGap: 20
            },
            {
                text: 'Estimator :',
                bold: true,
                alignment: "left",
            },
            {
                text: estimator_name || '-',
                bold: false,
                alignment: "left",
                columnGap: 20
            },
            {
                text: 'Approve Status :',
                bold: true,
                alignment: "left",
            },
            {
                text: approve_status || '-',
                bold: false,
                alignment: "left",
                columnGap: 20
            },
        ]

        row2 = [
            {
                text: "Job Name :",
                bold: true,
                alignment: "left",
            },
            {
                text: job_name || '-',
                bold: false,
                alignment: "left",
                colSpan: 3
            },
            {},
            {},
            {
                text: 'Customer :',
                bold: true,
                alignment: "left",
            },
            {
                text: `${customer_id} : ${customer_name}` || '-',
                bold: false,
                alignment: "left",
            },
            {
                text: 'Date :',
                bold: true,
                alignment: "left",
            },
            {
                text: create_date || '-',
                bold: false,
                alignment: "left",
            }
        ]

        row3 = [
            // {
            // margin: [10, 0, 0, 0],
            // colSpan: 8,
            // alignment: 'left',
            // table: {
            //     widths: ['auto', '*', '*', '*', '*', '*'], // Set column widths for image and text
            //     body: [
            //         [
            {
                image: is_multiple_f ? checkboxCheckImage() : squareFrameImage(), // Replace with your image URL or base64 data
                fit: [8, 8], // Set image size (width, height)
                alignment: 'right'
            },
            {
                text: 'งานมีหลาย F',
                bold: true,
                colSpan: 3,
                alignment: 'left'
            },
            {},
            {},
            {
                text: `Credit Term : ${credit_term_name || '-- ไม่พบข้อมูล --'}`,
                colSpan: 4
            }
            // ]
            // ]
            // },
            // layout: 'noBorders',
            // }
        ]

        return [row1, row2, row3]
    }

    getRowQty(data) {
        const {
            qty: {
                ae = 0,
                customer = 0,
                main = [],
                runon = [],
                runon_percent = '',
                totalqty = []
            },
            job: {
                color_limit = [],
                is_multiple_f = false,
            },
            component1 = []
        } = data || {}

        let rows = []

        let mainCol = [],
            runonCol = [],
            widthCol = [],
            blankCol = [],
            totalRow = [],
            qtyRow = []

        if (is_multiple_f) {

            mainCol = [
                {
                    text: 'F Code',
                    alignment: 'center',
                    bold: true,
                },
                {
                    text: 'Quantity',
                    alignment: 'center',
                    bold: true,
                },
                {
                    text: 'Run-on (%)',
                    alignment: 'center',
                    bold: true,
                },
                {
                    text: 'Run-on',
                    alignment: 'center',
                    bold: true,
                },
                {
                    text: 'AE Qty',
                    alignment: 'center',
                    bold: true,
                },
                {
                    text: 'Customer Qty',
                    alignment: 'center',
                    bold: true,
                },
                {
                    text: 'Total Qty',
                    alignment: 'center',
                    bold: true,
                },
                {
                    text: 'ลิมิตสี',
                    alignment: 'center',
                    bold: true,
                },
                {
                    text: 'ลิมิตสี (เล่ม)',
                    alignment: 'center',
                    bold: true,
                },
            ]

            totalRow = [
                {
                    text: `Total Qty. : ${numeral(totalqty[0]).format('0,000')}`,
                    alignment: 'left',
                    colSpan: 9,
                },
            ]

            component1?.forEach((comp, index) => {
                comp?.f_detail?.f_list?.forEach((fQty, fIndex) => {
                    const { is_color_limit = false, qty = 0 } = color_limit[fIndex]
                    const {
                        ae_qty,
                        customer_qty,
                        f_code,
                        f_qty,
                        runon_percent,
                        runon_qty,
                        total_qty
                    } = fQty || {}

                    qtyRow.push([
                        {
                            text: f_code,
                            alignment: 'center'
                        },
                        {
                            text: numeral(f_qty).format('0,000'),
                            alignment: 'center',
                        },
                        {
                            text: runon_percent,
                            alignment: 'center'
                        },
                        {
                            text: numeral(runon_qty).format('0,000'),
                            alignment: 'center'
                        },
                        {
                            text: numeral(ae_qty).format('0,000'),
                            alignment: 'center'
                        },
                        {
                            text: numeral(customer_qty).format('0,000'),
                            alignment: 'center'
                        },
                        {
                            text: numeral(total_qty).format('0,000'),
                            alignment: 'center'
                        },
                        {
                            image: is_color_limit ? checkboxCheckImage() : squareFrameImage(), // Replace with your image URL or base64 data
                            fit: [8, 8], // Set image size (width, height)
                            alignment: 'center',
                        },
                        {
                            text: qty || '-',
                            alignment: 'center'
                        },
                    ])

                })
            })

            rows = [
                [
                    {
                        text: 'Quantity',
                        bold: true,
                        alignment: 'center',
                        verticalAlignment: 'middle',
                        // rowSpan: 4
                    },
                    {
                        width: '100%',
                        table: {
                            headerRows: 1,
                            widths: ['*', '*', '*', '*', '*', '*', '*', '*', '*'], // Set column widths for image and text
                            body: [
                                mainCol,
                                ...qtyRow,
                                totalRow
                            ]
                        },
                        colSpan: 2
                    },
                ]
            ]



        } else {

            main?.forEach((qty, index) => {
                mainCol.push({
                    text: numeral(qty).format('0,000'),
                    alignment: 'right',
                })

                widthCol.push(30)

                if (index > 0) {
                    blankCol.push('')
                }
            })

            runon?.forEach((qty, index) => {
                runonCol.push({
                    text: numeral(qty).format('0,000'),
                    alignment: 'right'
                })
            })

            let mainQty = [
                {
                    text: 'Quantity',
                    bold: true,
                    alignment: 'center',
                    verticalAlignment: 'middle',
                    rowSpan: 4
                },
                {
                    text: 'Quantity',
                    bold: false,
                    alignment: 'left',
                    verticalAlignment: 'middle',
                },
                {
                    table: {
                        widths: [...widthCol], // Set column widths for image and text
                        body: [
                            [...mainCol]
                        ]
                    },
                    // border:[false,false,false,false],
                    // layout: 'noBorders'
                }
            ]

            let runonQty = [
                {},
                {
                    text: `Run-on [ ${runon_percent} ] %`,
                    bold: false,
                    alignment: 'left',
                    verticalAlignment: 'middle',
                },
                {
                    table: {
                        widths: [...widthCol], // Set column widths for image and text
                        body: [
                            [...runonCol]
                        ]
                    },
                    // border:[false,false,false,false],
                    // layout: 'noBorders'
                }
            ]

            let aeQty = [
                {},
                {
                    text: `AE Qty.`,
                    bold: false,
                    alignment: 'left',
                    verticalAlignment: 'middle',
                },
                {
                    table: {
                        widths: [...widthCol], // Set column widths for image and text
                        body: [
                            [{ text: ae, alignment: 'right', border: [true, true, true, true] }]
                        ]
                    },
                    // border:[false,false,false,false],
                    // layout: 'noBorders'
                },
            ]

            let customerQty = [
                {},
                {
                    text: `Customer Qty.`,
                    bold: false,
                    alignment: 'left',
                    verticalAlignment: 'middle',
                },
                {
                    table: {
                        widths: [...widthCol], // Set column widths for image and text
                        body: [
                            [{ text: customer, alignment: 'right', border: [true, true, true, true] }]
                        ]
                    },
                    // border:[false,false,false,false],
                    // layout: 'noBorders'
                },
            ]

            rows = [mainQty, runonQty, aeQty, customerQty]
        }


        return rows
    }

    getJobInfo(data) {
        const {
            ae: {
                ae_id,
                ae_name
            },
            customer: {
                customer_id,
                customer_name
            },
            estimator: {
                estimator_id,
                estimator_name
            },
            job: {
                job_name,
                is_multiple_f,
                print_type,
                ink_type,
                is_reprinted,
                color_limit,
                is_profit_sharing,
                is_different_packing,
                is_loss,
                is_use_previous_plate,
                flexo_size,
            },
            component1 = []
        } = data || {}

        const is_color_limit = color_limit?.some(obj => obj?.is_color_limit || false) || false

        return { /* Job Info */
            columns: [
                {
                    width: '100%',
                    table: {
                        widths: ['*', '*', '*', '*', '*', '*', 10, 45, 10, 45, 10, 45, '*'], // Set column widths for image and text
                        body: [
                            [
                                {
                                    text: 'ประเภทงาน : ',
                                    bold: true,
                                    alignment: 'left'
                                },
                                {
                                    text: `${is_reprinted ? 'งาน Reprint' : 'งานใหม่'}`,
                                    bold: false,
                                    alignment: 'left'
                                },
                                {
                                    text: 'ประเภทหมึก : ',
                                    bold: true,
                                    alignment: 'left'
                                },
                                {
                                    text: `${ink_type == 'UV' ? 'UV' : 'ธรรมดา'}`,
                                    bold: false,
                                    alignment: 'left'
                                },
                                {
                                    text: 'ประเภทพิมพ์ : ',
                                    bold: true,
                                    alignment: 'left'
                                },
                                {
                                    text: print_type == 'Flexo' ? `${print_type} Size (in²) ${flexo_size[0]}x${flexo_size[1]}` : `${print_type}`,
                                    bold: false,
                                    alignment: 'left'
                                },
                                is_multiple_f ? {} : {
                                    image: is_color_limit ? checkboxCheckImage() : squareFrameImage(), // Replace with your image URL or base64 data
                                    fit: [8, 8], // Set image size (width, height)
                                    alignment: 'right',
                                },
                                is_multiple_f ? {} : {
                                    text: `ลิมิตสี ( เล่ม ) : ${color_limit[0]?.qty}`,
                                    bold: true,
                                    alignment: 'left'
                                },
                                (is_reprinted && print_type == 'Offset') ? {
                                    image: is_use_previous_plate ? checkboxCheckImage() : squareFrameImage(), // Replace with your image URL or base64 data
                                    fit: [8, 8], // Set image size (width, height)
                                    alignment: 'right',
                                } : {},
                                (is_reprinted && print_type == 'Offset') ? {
                                    text: `ใช้ Plate เก่า`,
                                    bold: true,
                                    alignment: 'left'
                                } : {},
                                {
                                    image: is_profit_sharing ? checkboxCheckImage() : squareFrameImage(), // Replace with your image URL or base64 data
                                    fit: [8, 8], // Set image size (width, height)
                                    alignment: 'right',
                                },
                                {
                                    text: `Profit Sharing`,
                                    bold: true,
                                    alignment: 'left'
                                },
                                { width: "*", text: "" }
                            ]
                        ],
                        // layout: 'noBorders',
                    },
                    layout: {
                        hLineWidth: function (i, node) {
                            return (i === 0 || i === node.table.body.length) ? 1 : 0; // Set outer border width
                        },
                        vLineWidth: function (i, node) {
                            return (i === 0 || i === node.table.widths.length) ? 1 : 0; // Set outer border width
                        },
                        hLineColor: function (i, node) {
                            return (i === 0 || i === node.table.body.length) ? 'black' : 'gray'; // Set outer border color
                        },
                        vLineColor: function (i, node) {
                            return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray'; // Set outer border color
                        }
                    },
                    // layout: 'noBorders',
                },
                { width: "*", text: "" }
            ],
            margin: [0, 0, 0, 0],
            // layout: 'noBorders',
            // border:[true,true,true,true]
        }
    }

    getRowComponent(data) {
        const {
            component1 = []
        } = data || {}

        let rows = [], dataRow = []

        const header = [
            {
                text: 'No',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Component',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Type',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Pattern',
                alignment: 'center',
                bold: true,
            },
        ]

        component1?.forEach((comp, index) => {
            const {
                component_name = '',
                box_type: {
                    type_name = ''
                },
                component_type: {
                    detail_th = ''
                }
            } = comp || {}

            dataRow.push([
                {
                    text: index + 1,
                    alignment: 'center'
                },
                {
                    text: component_name,
                    alignment: 'center'
                },
                {
                    text: detail_th,
                    alignment: 'center'
                },
                {
                    text: type_name,
                    alignment: 'center'
                },
            ])
        })

        rows = [
            [
                {
                    text: 'Component',
                    bold: true,
                    alignment: 'center',
                    verticalAlignment: 'middle',
                },
                {
                    width: '100%',
                    table: {
                        headerRows: 1,
                        widths: [45, '*', '*', '*'], // Set column widths for image and text
                        body: [
                            header,
                            ...dataRow
                        ]
                    }
                },
            ]
        ]

        return {
            columns: [
                {
                    width: "100%",
                    table: {
                        dontBreakRows: true,
                        widths: [
                            60,
                            "*"
                        ],
                        body: [
                            ...rows
                        ],
                    },
                    // padding: [0, 0, 0, 0],
                    // margin: [0, 0, 0, 0],
                },
                { width: "*", text: "" }
            ],
            margin: [0, 0, 0, 0],
        }
    }

    getRowPaper(data) {
        /* DATA */
        const {
            component1 = []
        } = data || {}
        /* DATA */

        /* MAIN CONFIG */
        const leftHeaderName = 'Paper'
        const colWidth = ['*', '*', '*', '*', '*', '*', '*', '*', '*', '*']
        /* MAIN CONFIG */

        let rows = [], dataRow = []

        /* PREPARE DATA - SECTION */

        const header = [
            {
                text: 'Component',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Paper',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Paper Brand',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'กระดาษ',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Gsm',
                alignment: 'center',
                bold: true,
            },
            {
                text: '% Mark-up',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'ตัดกระดาษ',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Cost',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Sales',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Unit',
                alignment: 'center',
                bold: true,
            },
        ]

        component1?.forEach((comp, index) => {
            const {
                component_name = '',
                component_type: {
                    type = 0
                },
                paper = {}
            } = comp || {}

            if (![1, 2].includes(type)) {
                return
            }

            const {
                paper_name = '',
                paper_gram = '',
                paper_markup = '',
                paper_percent = '',
                paper_cost = '',
                paper_total_price = '',
                sheet_unit_price = false,
                paper_source_id = 1,
                remark = '',
                brand = ''
            } = paper || {}

            const unit = sheet_unit_price ? 'B/Sheet' : 'B/Kg'

            dataRow.push([
                {
                    text: component_name,
                    alignment: 'center',
                    rowSpan: 2,

                },
                {
                    text: paper_name,
                    alignment: 'center'
                },
                {
                    text: paper_source_id == 2 ? 'ต่างประเทศ' : 'ในประเทศ',
                    alignment: 'center'
                },
                {
                    text: brand || '-',
                    alignment: 'center'
                },
                {
                    text: paper_gram,
                    alignment: 'center'
                },
                {
                    text: paper_markup,
                    alignment: 'center'
                },
                {
                    text: paper_percent,
                    alignment: 'center'
                },
                {
                    text: paper_cost,
                    alignment: 'center'
                },
                {
                    text: paper_total_price,
                    alignment: 'center'
                },
                {
                    text: unit,
                    alignment: 'center'
                },
            ])

            dataRow.push([
                {},
                {
                    text: `Remark : ${remark || '-'}`,
                    alignment: 'left',
                    colSpan: 9
                },
            ])
        })

        /* PREPARE DATA - SECTION */

        let tbData = {
            width: '100%',
            text: ''
        }

        if (dataRow?.length) {
            tbData = {
                table: {
                    headerRows: 1,
                    widths: colWidth, // Set column widths for image and text
                    body: [
                        header,
                        ...dataRow
                    ]
                }
            }
        }

        rows = [
            [
                {
                    text: leftHeaderName,
                    bold: true,
                    alignment: 'center',
                    verticalAlignment: 'middle',
                },
                tbData
            ]
        ]

        return {
            columns: [
                {
                    width: "100%",
                    table: {
                        dontBreakRows: true,
                        widths: [
                            60,
                            "*"
                        ],
                        body: [
                            ...rows
                        ],
                    },
                },
                { width: "*", text: "" }
            ],
            margin: [0, 0, 0, 0],
        }
    }

    getRowCorrugated(data) {
        /* DATA */
        const {
            component1 = []
        } = data || {}
        /* DATA */

        /* MAIN CONFIG */
        const leftHeaderName = 'Corrugated'
        const colWidth = ['*', '*', '*', '*', '*', '*', '*', '*', '*', 100]
        /* MAIN CONFIG */

        let rows = [], dataRow = []

        /* PREPARE DATA - SECTION */

        const header = [
            {
                text: 'Component',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Layer',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'ลอน',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Grade 1',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Gsm 1',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Grade 2',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Gsm 2',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Grade 3',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Gsm 3',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Remark',
                alignment: 'center',
                bold: true,
            },
        ]

        component1?.forEach((comp, index) => {
            const {
                component_name = '',
                component_type: {
                    type = 0,
                }
            } = comp || {}

            if (![2, 3].includes(type)) {
                return false
            }

            const {
                corrugated_layer: {
                    info: {
                        num_layer = '',
                        flute_type = '',
                        fluteInfo_custom = '',
                        name = '',
                        remark = '',
                        is_custom = false,
                        type: corrType = [],
                        gram: corrGram = []
                    }
                }
            } = comp || {}

            const grade = name?.split('/')
            const grade_arr = []

            if (is_custom) {

                corrType?.forEach((type1, index) => {
                    grade_arr.push(type1, corrGram[index])
                })

            } else {

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

            }

            dataRow.push([
                {
                    text: component_name,
                    alignment: 'center'
                },
                {
                    text: num_layer,
                    alignment: 'center'
                },
                {
                    text: `${flute_type} ${fluteInfo_custom}`,
                    alignment: 'center'
                },
                {
                    text: grade_arr[0],
                    alignment: 'center'
                },
                {
                    text: grade_arr[1],
                    alignment: 'center'
                },
                {
                    text: num_layer == "5" ? `3${grade_arr[2]}` : grade_arr[2],
                    alignment: 'center'
                },
                {
                    text: grade_arr[3],
                    alignment: 'center'
                },
                {
                    text: grade_arr[4],
                    alignment: 'center'
                },
                {
                    text: grade_arr[5],
                    alignment: 'center'
                },
                {
                    text: remark,
                    alignment: 'left'
                },
            ])
        })

        /* PREPARE DATA - SECTION */

        let tbData = {
            width: '100%',
            text: ''
        }

        if (dataRow?.length) {
            tbData = {
                table: {
                    headerRows: 1,
                    widths: colWidth, // Set column widths for image and text
                    body: [
                        header,
                        ...dataRow
                    ]
                }
            }
        }

        rows = [
            [
                {
                    text: leftHeaderName,
                    bold: true,
                    alignment: 'center',
                    verticalAlignment: 'middle',
                },
                tbData
            ]
        ]

        return {
            columns: [
                {
                    width: "100%",
                    table: {
                        dontBreakRows: true,
                        widths: [
                            60,
                            "*"
                        ],
                        body: [
                            ...rows
                        ],
                    },
                },
                { width: "*", text: "" }
            ],
            margin: [0, 0, 0, 0],
        }
    }

    getRowColor(data) {
        /* DATA */
        const {
            job: {
                is_multiple_f = false
            },
            component1 = []
        } = data || {}
        /* DATA */

        /* MAIN CONFIG */
        const leftHeaderName = 'Colors'
        const colWidth = ['*', 30, 30, 30, 30, 30, '*', 40, '*']
        /* MAIN CONFIG */

        let rows = [], dataRow = []

        /* PREPARE DATA - SECTION */

        const header = [
            {
                text: is_multiple_f ? 'F Code' : 'Component',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Outside',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Inside',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Special Ink',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'พิมพ์สีดำ Outside',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'พิมพ์สีดำ Inside',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'Color',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'ชนิดหมึก',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'ลักษณะการพิมพ์สี',
                alignment: 'center',
                bold: true,
            },
        ]

        component1?.forEach((comp, index) => {
            const {
                component_name = '',
                color = [],
            } = comp || {}

            color?.forEach((col, cIndex) => {
                const {
                    outside = 0,
                    inside = 0,
                    f_code = '',
                    is_black_printing = false,
                    black_printing_outside = false,
                    black_printing_inside = false,
                    special_ink = []
                } = col || {}

                let row = [], rowSpeInk = []

                const is_speInk = special_ink?.length > 0 ? true : false

                let _black_printing_outside = false, _black_printing_inside = false

                if (is_black_printing) {
                    if (outside > 0) {
                        _black_printing_outside = true
                    }

                    if (inside > 0) {
                        _black_printing_inside = true
                    }
                }

                if (black_printing_outside) {
                    _black_printing_outside = true
                }

                if (black_printing_inside) {
                    _black_printing_inside = true
                }

                row.push(
                    {
                        text: is_multiple_f ? f_code : component_name,
                        alignment: 'center'
                    },
                    {
                        text: outside,
                        alignment: 'center'
                    },
                    {
                        text: inside,
                        alignment: 'center'
                    },
                    {
                        image: is_speInk ? checkboxCheckImage() : squareFrameImage(), // Replace with your image URL or base64 data
                        fit: [8, 8], // Set image size (width, height)
                        alignment: 'center'
                    },
                    {
                        image: _black_printing_outside ? checkboxCheckImage() : squareFrameImage(), // Replace with your image URL or base64 data
                        fit: [8, 8], // Set image size (width, height)
                        alignment: 'center'
                    },
                    {
                        image: _black_printing_inside ? checkboxCheckImage() : squareFrameImage(), // Replace with your image URL or base64 data
                        fit: [8, 8], // Set image size (width, height)
                        alignment: 'center'
                    },
                )

                if (!is_speInk) {
                    row.push({}, {}, {})
                } else {
                    special_ink?.forEach((speInk, sIndex) => {
                        const print_style_th = speInk.info.print_style == 'solid' ? 'ตีพื้น' : 'ลายเส้น'
                        if (sIndex > 0) {
                            rowSpeInk.push([
                                {},
                                {},
                                {},
                                {},
                                {},
                                {},
                                {
                                    text: speInk.info.ink_name,
                                    alignment: 'center'
                                },
                                {
                                    text: speInk.name,
                                    alignment: 'center'
                                },
                                {
                                    text: print_style_th,
                                    alignment: 'center'
                                }
                            ])
                        } else {
                            row.push(
                                {
                                    text: speInk.info.ink_name,
                                    alignment: 'center'
                                },
                                {
                                    text: speInk.name,
                                    alignment: 'center'
                                },
                                {
                                    text: print_style_th,
                                    alignment: 'center'
                                }
                            )
                        }
                    })
                }

                dataRow.push(row, ...rowSpeInk)
            })
        })

        /* PREPARE DATA - SECTION */

        let tbData = {
            width: '100%',
            text: ''
        }

        if (dataRow?.length) {
            tbData = {
                table: {
                    headerRows: 1,
                    widths: colWidth, // Set column widths for image and text
                    body: [
                        header,
                        ...dataRow
                    ]
                }
            }
        }

        rows = [
            [
                {
                    text: leftHeaderName,
                    bold: true,
                    alignment: 'center',
                    verticalAlignment: 'middle',
                },
                tbData
            ]
        ]

        return {
            columns: [
                {
                    width: "100%",
                    table: {
                        dontBreakRows: true,
                        widths: [
                            60,
                            "*"
                        ],
                        body: [
                            ...rows
                        ],
                    },
                },
                { width: "*", text: "" }
            ],
            margin: [0, 0, 0, 0],
        }
    }

    getRowCoating(data) {
        /* DATA */
        const {
            component1 = []
        } = data || {}
        /* DATA */

        /* MAIN CONFIG */
        const leftHeaderName = 'Coating'
        const colWidth = [80, '*', '*', 50, 50]
        /* MAIN CONFIG */

        let rows = [], dataRow = []

        /* PREPARE DATA - SECTION */

        const header = [
            {
                text: 'Component',
                alignment: 'center',
                bold: true,
                // rowSpan:2
            },
            {
                text: 'Type 1',
                alignment: 'center',
                bold: true,
                // rowSpan:2
            },
            {
                text: 'Type 2',
                alignment: 'center',
                bold: true,
                // rowSpan:2
            },
            {
                text: 'Size (sq.in)',
                alignment: 'center',
                bold: true,
                // colSpan:2,
                // rowSpan:2
            },
            {
                text: 'Size (sq.in)',
                alignment: 'center',
                bold: true,
                // colSpan:2,
                // rowSpan:2
            },
        ]

        component1?.forEach((comp, index) => {
            const {
                component_name = '',
                addon = []
            } = comp || {}

            const coating = addon?.filter(obj => ['coating'].includes(obj.type))

            coating?.forEach((info) => {
                const {
                    info: {
                        name = '',
                        type = '',
                        side = '',
                        width = '',
                        length = '',
                        code = '',
                        number = ''
                    }
                } = info || {}

                // let row = []

                // row.push(

                // )
                let size = [
                    ['S-UV', 'S-UV-S'].includes(code) ? width : '-',
                    ['S-UV', 'S-UV-S'].includes(code) ? length : '-'
                ]

                let numberLabel = number ? ` (เบอร์ ${number})` : ''

                dataRow.push([
                    {
                        text: component_name,
                        alignment: 'center'
                    },
                    {
                        text: name,
                        alignment: 'center'
                    },
                    {
                        text: `${type} ${side} s${numberLabel}`,
                        alignment: 'center'
                    },
                    {
                        text: size[0],
                        alignment: 'center'
                    },
                    {
                        text: size[1],
                        alignment: 'center'
                    }
                ])

                // dataRow.push(row)
            })
        })

        /* PREPARE DATA - SECTION */

        let tbData = {
            width: '100%',
            text: ''
        }

        if (dataRow?.length) {
            tbData = {
                table: {
                    headerRows: 1,
                    widths: colWidth, // Set column widths for image and text
                    body: [
                        header,
                        ...dataRow
                    ]
                }
            }
        }

        rows = [
            [
                {
                    text: leftHeaderName,
                    bold: true,
                    alignment: 'center',
                    verticalAlignment: 'middle',
                },
                tbData
            ]
        ]

        return {
            columns: [
                {
                    width: "100%",
                    table: {
                        dontBreakRows: true,
                        widths: [
                            60,
                            "*"
                        ],
                        body: [
                            ...rows
                        ],
                    },
                },
                { width: "*", text: "" }
            ],
            margin: [0, 0, 0, 0],
        }
    }

    getRowFoilstamp(data) {
        /* DATA */
        const {
            job: {
                is_multiple_f = false
            },
            component1 = []
        } = data || {}
        /* DATA */

        /* MAIN CONFIG */
        const leftHeaderName = 'Foilstamp'
        const colWidth = [80, 50, 50, 80, 80, '*']
        /* MAIN CONFIG */

        let rows = [], dataRow = []

        /* PREPARE DATA - SECTION */

        const header = [
            {
                text: is_multiple_f ? 'F Code' : 'Component',
                alignment: 'center',
                bold: true,
                // rowSpan:2
            },
            {
                text: 'Size (sq.in)',
                alignment: 'center',
                bold: true,
                // colSpan:2,
                // rowSpan:2
            },
            {
                text: 'Size (sq.in)',
                alignment: 'center',
                bold: true,
                // colSpan:2,
                // rowSpan:2
            },
            {
                text: 'Color',
                alignment: 'center',
                bold: true,
                // rowSpan:2
            },
            {
                text: 'Code',
                alignment: 'center',
                bold: true,
                // rowSpan:2
            },
        ]

        component1?.forEach((comp, index) => {
            const {
                component_name = '',
                addon = []
            } = comp || {}

            const foilstamp = addon?.filter(obj => ['foilstamp'].includes(obj.type))

            foilstamp?.forEach((info) => {
                const {
                    info: {
                        color_th = '',
                        code = '',
                        size = [],
                        f_code = []
                    }
                } = info || {}

                dataRow.push([
                    {
                        text: is_multiple_f ? f_code.join(', ') : component_name,
                        alignment: 'center'
                    },
                    {
                        text: size[0],
                        alignment: 'center'
                    },
                    {
                        text: size[1],
                        alignment: 'center'
                    },
                    {
                        text: color_th,
                        alignment: 'center'
                    },
                    {
                        text: code,
                        alignment: 'center'
                    },
                ])

            })
        })

        /* PREPARE DATA - SECTION */

        let tbData = {
            width: '100%',
            text: ''
        }

        if (dataRow?.length) {
            tbData = {
                table: {
                    headerRows: 1,
                    widths: colWidth, // Set column widths for image and text
                    body: [
                        header,
                        ...dataRow
                    ]
                }
            }
        }

        rows = [
            [
                {
                    text: leftHeaderName,
                    bold: true,
                    alignment: 'center',
                    verticalAlignment: 'middle',
                },
                tbData
            ]
        ]

        return {
            columns: [
                {
                    width: "100%",
                    table: {
                        dontBreakRows: true,
                        widths: [
                            60,
                            "*"
                        ],
                        body: [
                            ...rows
                        ],
                    },
                },
                { width: "*", text: "" }
            ],
            margin: [0, 0, 0, 0],
        }
    }

    getRowBossing(data, bossing_type = '') {
        /* DATA */
        const {
            job: {
                is_multiple_f = false
            },
            component1 = []
        } = data || {}
        /* DATA */

        /* MAIN CONFIG */
        const leftHeaderName = bossing_type == 'emboss' ? 'Emboss' : 'Deboss'
        const colWidth = [80, 50, 50, 50, '*']
        /* MAIN CONFIG */

        let rows = [], dataRow = []

        /* PREPARE DATA - SECTION */

        const customColName1 = is_multiple_f ? 'F Code' : 'Component'
        const customColName2 = bossing_type == 'emboss' ? 'ความนูน' : 'ความลึก'

        const header = [
            {
                text: customColName1,
                alignment: 'center',
                bold: true,
                // rowSpan:2
            },
            {
                text: 'Size (sq.in)',
                alignment: 'center',
                bold: true,
                // colSpan:2,
                // rowSpan:2
            },
            {
                text: 'Size (sq.in)',
                alignment: 'center',
                bold: true,
                // colSpan:2,
                // rowSpan:2
            },
            {
                text: customColName2,
                alignment: 'center',
                bold: true,
                // rowSpan:2
            },
        ]

        component1?.forEach((comp, index) => {
            const {
                component_name = '',
                addon = []
            } = comp || {}

            const bossing = addon?.filter(obj => [bossing_type].includes(obj.type))

            bossing?.forEach((info) => {
                const {
                    info: {
                        depth = '',
                        size = [],
                        f_code = []
                    }
                } = info || {}

                size.forEach((size, sIndex) => {

                    dataRow.push([
                        {
                            text: is_multiple_f ? f_code.join(', ') : component_name,
                            alignment: 'center'
                        },
                        {
                            text: size[0],
                            alignment: 'center'
                        },
                        {
                            text: size[1],
                            alignment: 'center'
                        },
                        {
                            text: depth,
                            alignment: 'center'
                        },
                    ])

                })

            })
        })

        /* PREPARE DATA - SECTION */

        let tbData = {
            width: '100%',
            text: ''
        }

        if (dataRow?.length) {
            tbData = {
                table: {
                    headerRows: 1,
                    widths: colWidth, // Set column widths for image and text
                    body: [
                        header,
                        ...dataRow
                    ]
                }
            }
        }

        rows = [
            [
                {
                    text: leftHeaderName,
                    bold: true,
                    alignment: 'center',
                    verticalAlignment: 'middle',
                },
                tbData
            ]
        ]

        return {
            columns: [
                {
                    width: "100%",
                    table: {
                        dontBreakRows: true,
                        widths: [
                            60,
                            "*"
                        ],
                        body: [
                            ...rows
                        ],
                    },
                },
                { width: "*", text: "" }
            ],
            margin: [0, 0, 0, 0],
        }
    }

    getRowProcessDynamicPrice(data, proc_name = '') {
        /* DATA */
        const {
            job: {
                is_multiple_f = false
            },
            process = []
        } = data || {}
        /* DATA */

        /* MAIN CONFIG */
        let processName = '',
            leftHeaderName = ''

        switch (proc_name) {
            case 'other':
                leftHeaderName = 'Other Process'
                break;
            case 'handwork':
                leftHeaderName = 'Handwork Process'
                break;
            case 'custom':
                leftHeaderName = 'จัดจ้าง'
                break;
            default:
                break;
        }

        const colWidth = [70, 50]
        /* MAIN CONFIG */

        let rows = [], dataRow = [], emptyCol = []

        /* PREPARE DATA - SECTION */

        const header = [
            {
                text: 'Process',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'ราคา/หน่วยคงที่',
                alignment: 'center',
                bold: true,
            },
        ]

        const procesArray = process?.filter(obj => obj.type == proc_name)
        const max_no = procesArray?.reduce((max, obj) => ((obj?.info?.unit_price?.length || 1) > max) ? (obj?.info?.unit_price?.length || 1) : max, 0)

        for (let i = 0; i < max_no; i++) {
            colWidth.push('*')
            header.push({
                text: 'ราคา/หน่วย',
                alignment: 'center',
                bold: true,
            })

            if (i > 0) {
                emptyCol.push({
                    text: '-',
                    alignment: 'center'
                })
            }
        }

        procesArray?.forEach((info, cIndex) => {
            const {
                name = '',
                info: {
                    is_fixedPrice = false,
                    unit_price = []
                }
            } = info || {}

            let row = []

            row.push(
                {
                    text: name,
                    alignment: 'center'
                },
                {
                    image: is_fixedPrice ? checkboxCheckImage() : squareFrameImage(), // Replace with your image URL or base64 data
                    fit: [8, 8], // Set image size (width, height)
                },
            )


            if (is_fixedPrice) {
                row.push(
                    {
                        text: unit_price,
                        alignment: 'center'
                    }
                    , ...emptyCol
                )
            } else {
                unit_price?.forEach((ppu, pIndex) => {
                    row.push({
                        text: ppu,
                        alignment: 'center'
                    })
                })
            }


            dataRow.push(row)
        })

        /* PREPARE DATA - SECTION */

        let tbData = {
            width: '100%',
            text: ''
        }

        if (dataRow?.length) {
            tbData = {
                table: {
                    headerRows: 1,
                    widths: colWidth, // Set column widths for image and text
                    body: [
                        header,
                        ...dataRow
                    ]
                }
            }
        }

        rows = [
            [
                {
                    text: leftHeaderName,
                    bold: true,
                    alignment: 'center',
                    verticalAlignment: 'middle',
                },
                tbData
            ]
        ]

        return {
            columns: [
                {
                    width: "100%",
                    table: {
                        dontBreakRows: true,
                        widths: [
                            60,
                            "*"
                        ],
                        body: [
                            ...rows
                        ],
                    },
                },
                { width: "*", text: "" }
            ],
            margin: [0, 0, 0, 0],
        }
    }

    getRowProcessDynamicQty(data, proc_name = '') {
        /* DATA */
        const {
            job: {
                is_multiple_f = false
            },
            [proc_name]: process = []
        } = data || {}
        /* DATA */

        /* MAIN CONFIG */
        let processName = '',
            leftHeaderName = '',
            qty_key = ''

        switch (proc_name) {
            case 'material':
                leftHeaderName = 'Materials'
                qty_key = 'qty_material'
                break;
            case 'otherCost':
                leftHeaderName = 'Other'
                qty_key = 'qty_other'
                break;
            default:
                break;
        }

        const colWidth = [100, 60, 60]
        /* MAIN CONFIG */

        let rows = [], dataRow = [], emptyCol = []

        /* PREPARE DATA - SECTION */

        const header = [
            {
                text: 'Material',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'ราคาต่อหน่วย',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'จำนวนคงที่',
                alignment: 'center',
                bold: true,
            },
        ]

        const max_no = process?.reduce((max, obj) => ((obj.info[qty_key]?.length || 1) > max) ? (obj.info[qty_key]?.length || 1) : max, 0)

        for (let i = 0; i < max_no; i++) {
            colWidth.push('*')
            header.push({
                text: 'จำนวน',
                alignment: 'center',
                bold: true,
            })

            if (i > 0) {
                emptyCol.push({
                    text: '-',
                    alignment: 'center'
                })
            }
        }

        process?.forEach((info, cIndex) => {
            const {
                name = '',
                info: {
                    is_fixedPrice = false,
                    [qty_key]: qty,
                    unit_price = 0
                }
            } = info || {}


            let row = []

            row.push(
                {
                    text: name,
                    alignment: 'center'
                },
                {
                    text: unit_price,
                    alignment: 'center'
                },
                {
                    image: is_fixedPrice ? checkboxCheckImage() : squareFrameImage(), // Replace with your image URL or base64 data
                    fit: [8, 8], // Set image size (width, height)
                },
            )


            if (is_fixedPrice) {
                row.push(
                    {
                        text: qty,
                        alignment: 'center'
                    }
                    , ...emptyCol
                )
            } else {
                qty?.forEach((qty, pIndex) => {
                    row.push({
                        text: qty,
                        alignment: 'center'
                    })
                })
            }


            dataRow.push(row)
        })

        /* PREPARE DATA - SECTION */

        let tbData = {
            width: '100%',
            text: ''
        }

        if (dataRow?.length) {
            tbData = {
                table: {
                    headerRows: 1,
                    widths: colWidth, // Set column widths for image and text
                    body: [
                        header,
                        ...dataRow
                    ]
                }
            }
        }

        rows = [
            [
                {
                    text: leftHeaderName,
                    bold: true,
                    alignment: 'center',
                    verticalAlignment: 'middle',
                },
                tbData
            ]
        ]

        return {
            columns: [
                {
                    width: "100%",
                    table: {
                        dontBreakRows: true,
                        widths: [
                            60,
                            "*"
                        ],
                        body: [
                            ...rows
                        ],
                    },
                },
                { width: "*", text: "" }
            ],
            margin: [0, 0, 0, 0],
        }
    }

    getRowFile(data) {
        /* DATA */
        const {
            fileUpload = []
        } = data || {}
        /* DATA */

        /* MAIN CONFIG */
        let leftHeaderName = 'Attach File'

        const colWidth = ['*']
        /* MAIN CONFIG */

        let rows = [], dataRow = [], emptyCol = []

        /* PREPARE DATA - SECTION */

        fileUpload?.forEach((file, index) => {
            const { filePath, id, originFileName } = file

            dataRow.push(
                [
                    {
                        text: originFileName,
                        alignment: 'left'
                    }
                ]
            )
        })

        /* PREPARE DATA - SECTION */

        let tbData = {
            width: '100%',
            text: ''
        }

        if (dataRow?.length) {
            tbData = {
                table: {
                    widths: colWidth, // Set column widths for image and text
                    body: [
                        ...dataRow
                    ]
                },
                layout: 'noBorders'
            }
        }

        rows = [
            [
                {
                    text: leftHeaderName,
                    bold: true,
                    alignment: 'center',
                    verticalAlignment: 'middle',
                },
                tbData
            ]
        ]

        return {
            columns: [
                {
                    width: "100%",
                    table: {
                        dontBreakRows: true,
                        widths: [
                            60,
                            "*"
                        ],
                        body: [
                            ...rows
                        ],
                    },
                },
                { width: "*", text: "" }
            ],
            margin: [0, 0, 0, 0],
        }
    }

    getRowCustomer(data, proc_name = '') {
        /* DATA */
        const {
            [proc_name]: process = []
        } = data || {}
        /* DATA */

        /* MAIN CONFIG */
        let leftHeaderName = ''

        switch (proc_name) {
            case 'priceDiff':
                leftHeaderName = 'ส่วนต่างลูกค้า'
                break;
            case 'customer_gift':
                leftHeaderName = 'ของขวัญลูกค้า'
                break;
            default:
                break;
        }

        const colWidth = [30]
        /* MAIN CONFIG */

        let rows = [], dataRow = [], row = []

        /* PREPARE DATA - SECTION */

        const is_checked = process?.length >= 1 ? true : false

        row.push({
            image: is_checked ? checkboxCheckImage() : squareFrameImage(), // Replace with your image URL or base64 data
            fit: [8, 8], // Set image size (width, height)
            border: [false, false, false, false],
        })

        console.log("process", process)

        process?.forEach(qty => {
            row.push({
                text: qty,
                alignment: 'right',
                bold: false,
                margin: [0, 0, 5, 0]
            })

            colWidth.push(35)
        })

        dataRow.push(row)

        /* PREPARE DATA - SECTION */

        let tbData = {
            width: '100%',
            text: ''
        }

        if (dataRow?.length) {
            tbData = {
                table: {
                    // headerRows: 1,
                    widths: colWidth, // Set column widths for image and text
                    body: [
                        // header,
                        ...dataRow
                    ]
                },
                // layout: 'noBorders'
            }
        }

        rows = [
            [
                {
                    text: leftHeaderName,
                    bold: true,
                    alignment: 'center',
                    verticalAlignment: 'middle',
                },
                tbData
            ]
        ]

        return {
            columns: [
                {
                    width: "100%",
                    table: {
                        dontBreakRows: true,
                        widths: [
                            60,
                            "*"
                        ],
                        body: [
                            ...rows
                        ],
                    }
                },
                { width: "*", text: "" }
            ],
            margin: [0, 0, 0, 0],
        }
    }

    getRowComponentSizeLayout(data) {
        /* DATA */
        const {
            component1 = []
        } = data || {}
        /* DATA */

        let dataRow = []

        /* PREPARE DATA - SECTION */

        component1?.forEach((comp, index) => {
            const {
                component_name = '',
                pdf_img = [],
                layout_manual = false
            } = comp || {}

            // console.log("pdf_img",pdf_img)

            const header = [
                {
                    text: `Component ที่ ${index + 1} ${component_name}`,
                    alignment: 'center',
                    bold: true,
                    colSpan: 2
                },
                {}
            ]

            /* PREPARE DATA - SECTION */

            const componentLayout = () => {
                let row = []

                if (layout_manual) {
                    row = [
                        {
                            text: 'Layout',
                            bold: true,
                            alignment: 'center',
                            verticalAlignment: 'middle',
                        },
                        {
                            table: {
                                widths: [30, '*', '*', '*', '*'],
                                body: [
                                    [
                                        {
                                            image: checkboxCheckImage(),
                                            fit: [8, 8],
                                            alignment: 'right'
                                        },
                                        {
                                            text: 'Manual Layout',
                                            alignment: 'left'
                                        },
                                        {},
                                        {},
                                        {},
                                    ],
                                    [
                                        {
                                            image: `${pdf_img[3]}`,
                                            fit: [100, 100],
                                            colSpan: 2
                                        },
                                        {},
                                        {
                                            image: `${pdf_img[4]}`,
                                            fit: [100, 100]
                                        },
                                        {
                                            image: `${pdf_img[5]}`,
                                            fit: [100, 100]
                                        },
                                        {}
                                    ],
                                    [
                                        {
                                            image: `${pdf_img[7]}`,
                                            fit: [300, 200],
                                            colSpan: 5
                                        },
                                        {},
                                        {},
                                        {},
                                    ]
                                ]
                            },
                            layout: 'noBorders'
                        }
                    ]
                } else {
                    row = [
                        {
                            text: 'Layout',
                            bold: true,
                            alignment: 'center',
                            verticalAlignment: 'middle',
                        },
                        {
                            table: {
                                widths: [30, '*', '*', '*', '*'],
                                body: [
                                    [
                                        {
                                            image: squareFrameImage(),
                                            fit: [8, 8],
                                            alignment: 'right'
                                        },
                                        {
                                            text: 'Manual Layout',
                                            alignment: 'left'
                                        },
                                        {},
                                        {},
                                        {},
                                    ],
                                    [
                                        {
                                            image: `${pdf_img[3]}`,
                                            fit: [100, 100],
                                            colSpan: 2
                                        },
                                        {},
                                        {
                                            image: `${pdf_img[4]}`,
                                            fit: [100, 100]
                                        },
                                        {
                                            image: `${pdf_img[5]}`,
                                            fit: [100, 100]
                                        },
                                        {
                                            image: `${pdf_img[6]}`,
                                            fit: [100, 100]
                                        }
                                    ],
                                    [
                                        {
                                            image: `${pdf_img[7]}`,
                                            fit: [300, 200],
                                            colSpan: 5
                                        },
                                        {},
                                        {},
                                        {},
                                    ]
                                ]
                            },
                            layout: 'noBorders'
                        }
                    ]
                }

                return row
            }

            const rows = [
                [
                    {
                        text: 'Spec',
                        bold: true,
                        alignment: 'center',
                        verticalAlignment: 'middle',
                    },
                    {
                        table: {
                            widths: ['*', '*', '*',],
                            body: [
                                [
                                    {
                                        image: `${pdf_img[0]}`,
                                        fit: [150, 150]
                                    },
                                    {
                                        image: `${pdf_img[1]}`,
                                        fit: [100, 100]
                                    },
                                    {
                                        image: `${pdf_img[2]}`,
                                        fit: [100, 100]
                                    },
                                ]
                            ]
                        },
                        layout: 'noBorders'
                    }
                ],
                componentLayout()
            ]

            dataRow.push(
                {
                    columns: [
                        {
                            width: "100%",
                            table: {
                                pageBreak: 'before',
                                dontBreakRows: true,
                                widths: [
                                    60,
                                    "*",
                                ],
                                body: [
                                    header,
                                    ...rows
                                ],
                            },
                            dontBreakRows: true,
                            // pageBreak: 'after'
                        },
                        { width: "*", text: "" }
                    ],
                    dontBreakRows: true,
                    unbreakable: true,
                    margin: [0, 35, 0, 35],
                }
            )
        })

        return dataRow
    }

    getRowPacking(data) {
        /* DATA */
        const {
            component1 = [],
            pdf_packing_img = [],
            job: {
                is_different_packing = false,
                is_multiple_f = false
            }
        } = data || {}
        /* DATA */

        /* MAIN CONFIG */
        let leftHeaderName = 'Packing'

        const colWidth = [30, '*', '*']
        /* MAIN CONFIG */

        let rows = [], dataRow = []

        /* PREPARE DATA - SECTION */

        component1?.forEach((comp, index) => {
            const {
                component_name = '',
                pdf_img = [],
                f_detail = []
            } = comp || {}

            /* PREPARE DATA - SECTION */

            const rows = [
                [
                    {
                        width: '100%',
                        text: `Component ที่ ${index + 1} ${component_name}`,
                        bold: true,
                        alignment: 'center',
                        verticalAlignment: 'middle',
                        margin: [3, 3, 3, 3],
                        colSpan: 3
                    }, {}, {}
                ]
            ]

            if (is_multiple_f) {
                if (is_different_packing) {
                    rows.push([
                        {
                            image: checkboxCheckImage(),
                            fit: [8, 8],
                            alignment: 'right',
                            border: [true, false, false, false]
                        },
                        {
                            text: 'แต่ละ F มีรูปแบบการ Packing แตกต่างกัน',
                            alignment: 'left',
                            colSpan: 2,
                            border: [false, false, true, false]
                        },
                        {},
                    ])

                    f_detail?.f_list?.forEach((obj, fIndex) => {
                        rows.push(
                            [{ text: obj?.f_code, margin: [2, 2, 2, 2], colSpan: 3 }, {}, {},],
                            [
                                {
                                    image: `${pdf_packing_img[fIndex]}`,
                                    fit: [450, 350],
                                    alignment: 'center',
                                    colSpan: 3
                                }, {}, {}
                            ]
                        )
                    })

                } else {
                    rows.push([
                        {
                            image: squareFrameImage(),
                            fit: [8, 8],
                            alignment: 'right',
                            border: [true, false, false, false]
                        },
                        {
                            text: 'แต่ละ F มีรูปแบบการ Packing แตกต่างกัน',
                            alignment: 'left',
                            colSpan: 2,
                            border: [false, false, true, false]
                        },
                        {},
                    ])
                    rows.push([
                        {
                            image: `${pdf_packing_img[index]}`,
                            fit: [450, 350],
                            alignment: 'center',
                            colSpan: 3
                        }, {}, {}
                    ])
                }
            } else {
                rows.push([
                    {
                        image: `${pdf_packing_img[index]}`,
                        fit: [450, 350],
                        alignment: 'center',
                        colSpan: 3
                    }, {}, {}
                ])
            }

            dataRow.push(...rows)

        })

        let tbData = {
            width: '100%',
            text: ''
        }


        if (dataRow?.length) {
            tbData = {
                table: {
                    // headerRows: 1,
                    widths: colWidth, // Set column widths for image and text
                    body: [
                        ...dataRow
                    ]
                }
            }
        }

        rows = [
            [
                {
                    text: leftHeaderName,
                    bold: true,
                    alignment: 'center',
                    verticalAlignment: 'middle',
                },
                tbData
            ]
        ]

        return {
            columns: [
                {
                    width: "100%",
                    table: {
                        dontBreakRows: true,
                        widths: [
                            60,
                            "*",
                        ],
                        body: [
                            ...rows
                        ],
                    },
                },
                { width: "*", text: "" }
            ],
            margin: [0, 0, 0, 0],
        }
    }

    getRowDelivery(data) {
        /* DATA */
        const {
            delivery = [],
            job: {
                is_multiple_f = false
            }
        } = data || {}
        /* DATA */

        /* MAIN CONFIG */
        const leftHeaderName = 'Delivery'
        const colWidth = [40, 120, '*', '*']



        /* MAIN CONFIG */

        let rows = [], dataRow = []

        /* PREPARE DATA - SECTION */
        const is_split = delivery?.length > 1 ? true : false

        const header = [
            {
                text: 'แบ่งส่ง',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'จังหวัด',
                alignment: 'center',
                bold: true,
            },
            {
                text: 'วันที่ส่ง',
                alignment: 'center',
                bold: true,
            },
        ]

        if (is_multiple_f) {
            colWidth.push('*')
            header.push(
                {
                    text: 'F Code',
                    alignment: 'center',
                    bold: true,
                },
                {
                    text: 'จำนวน',
                    alignment: 'center',
                    bold: true,
                },
            )
        } else {
            header.push(
                {
                    text: 'จำนวน',
                    alignment: 'center',
                    bold: true,
                },
            )
        }

        delivery?.forEach((info, aIndex) => {

            const {
                destinationName = '',
                dueDate = '',
                detail = []
            } = info || {}

            detail?.forEach((obj, dIndex) => {

                if (!is_split && dIndex > 0) {
                    return false
                }

                let row = []

                const {
                    f_code = '',
                    qty = 0
                } = obj || {}

                if (dIndex > 0) {
                    row.push(
                        {}, {}, {}
                    )
                } else {
                    row.push(
                        {
                            image: is_split ? checkboxCheckImage() : squareFrameImage(), // Replace with your image URL or base64 data
                            fit: [8, 8], // Set image size (width, height)
                        },
                        {
                            text: destinationName,
                            alignment: 'center'
                        },
                        {
                            text: dueDate ? moment(dueDate, 'YYYY-MM-DD').format('DD/MM/YYYY') : '-',
                            alignment: 'center'
                        },
                    )
                }

                if (is_multiple_f) {
                    row.push({
                        text: f_code,
                        alignment: 'center'
                    }, {
                        text: is_split ? numeral(qty).format('0,000') : '-',
                        alignment: 'center'
                    })
                } else {
                    row.push({
                        text: is_split ? numeral(qty).format('0,000') : '-',
                        alignment: 'center'
                    })
                }

                dataRow.push(row)

            })
        })

        /* PREPARE DATA - SECTION */

        let tbData = {
            width: '100%',
            text: ''
        }

        if (dataRow?.length) {
            tbData = {
                table: {
                    headerRows: 1,
                    widths: colWidth, // Set column widths for image and text
                    body: [
                        header,
                        ...dataRow
                    ]
                }
            }
        }

        rows = [
            [
                {
                    text: leftHeaderName,
                    bold: true,
                    alignment: 'center',
                    verticalAlignment: 'middle',
                },
                tbData
            ]
        ]

        return {
            columns: [
                {
                    width: "100%",
                    table: {
                        dontBreakRows: true,
                        widths: [
                            60,
                            "*"
                        ],
                        body: [
                            ...rows
                        ],
                    },
                },
                { width: "*", text: "" }
            ],
            margin: [0, 0, 0, 0],
        }
    }

    getSummary(data) {
        return [
            { width: '*', text: '', pageBreak: 'before' },
            ...SummaryData(data),
            {
                columns: [
                    { width: "*", text: "" },
                    {
                        width: "auto",
                        table: {
                            widths: [
                                "auto",
                                "auto",
                                "auto",
                                "auto",
                                "auto",
                                "auto",
                                "auto",
                                "auto",
                                "auto",
                            ],
                            body: [...getRowWeight(data, false)],
                        },
                        layout: {
                            paddingLeft: function (i, node) { return 1; },
                            paddingRight: function (i, node) { return 1; },
                            paddingTop: function (i, node) { return 1; },
                            paddingBottom: function (i, node) { return 1; }
                        }
                    },
                    { width: "*", text: "" },
                ],
            },
            {
                columns: [
                    {
                        text: `Remark : `,
                        alignment: "left",
                        width: "auto",
                    },
                    {
                        text: `${data.remark != "" ? data.remark : "-"}`,
                        alignment: "left",
                        width: 525,
                        margin: [10, 0, 0, 0],
                    },
                ],
                margin: [20, 10, 0, 0],
            },
            setProfitAndLossQty(data),
            (data?.SYSTEM_VERSION || 0) >= 3.1 ? setMarkdownQty(data) : {},
        ]
    }
}

var PDF = new EstimatePDF