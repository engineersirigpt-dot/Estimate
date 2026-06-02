const mockAddon = [
    {
        type: "foilstamp",
        name: "foilstamp",
        type_id: 4,
        process_id: 3,
        info: {
            process_index: 0,
            code: "11-i : SAM",
            color: "Silver",
            color_th: "เงินเงา",
            width: 2,
            length: 3,
            size: [
                2,
                3
            ],
            foil_width: 25,
            foil_length: 400,
            foil_roll_price: 1700,
            foil_roll_min_price: 500,
            is_customFoil: 0,
            depth_type: "",
            depth: 0,
            block_rate: 12,
            pcs_per_roll: 9600,
            foil_unit_price: 0.1771,
            film_rate: 1.25,
            block: {
                film_unit_price: 120,
                block_unit_price: 72
            },
            f_code: ['F1011234', 'F2211234']
        },
        line: [
            {
                labor: {
                    qty: 15000,
                    unit_price: 0.21111,
                    price: 3166.65
                },
                foil_roll: {
                    qty: 15000,
                    unit_price: 0.1771,
                    price: 2656.5
                },
                block: {
                    qty: 4,
                    unit_price: 192,
                    price: 768
                }
            }
        ]
    },
    {
        type: "foilstamp",
        name: "foilstamp",
        type_id: 4,
        process_id: 3,
        info: {
            process_index: 0,
            code: "11-i : SAM",
            color: "Silver",
            color_th: "เงินเงา",
            width: 1,
            length: 2,
            size: [
                1,
                2
            ],
            foil_width: 25,
            foil_length: 400,
            foil_roll_price: 1700,
            foil_roll_min_price: 500,
            is_customFoil: 0,
            depth_type: "",
            depth: 0,
            block_rate: 12,
            pcs_per_roll: 19200,
            foil_unit_price: 0.0885,
            film_rate: 1.25,
            block: {
                film_unit_price: 120,
                block_unit_price: 70
            },
        },
        line: [
            {
                labor: {
                    qty: 15000,
                    unit_price: 0.21111,
                    price: 3166.65
                },
                foil_roll: {
                    qty: 15000,
                    unit_price: 0.0885,
                    price: 1327.5
                },
                block: {
                    qty: 4,
                    unit_price: 190,
                    price: 760
                }
            }
        ]
    },
    {
        type: "foilstamp",
        name: "foilstamp",
        type_id: 4,
        process_id: 3,
        info: {
            process_index: 1,
            code: "12-i : OSP",
            color: "Matt silver",
            color_th: "เงินด้าน",
            width: 1,
            length: 1,
            size: [
                1,
                1
            ],
            foil_width: 24,
            foil_length: 400,
            foil_roll_price: 3000,
            foil_roll_min_price: 3000,
            is_customFoil: 0,
            depth_type: "",
            depth: 0,
            block_rate: 12,
            pcs_per_roll: 28800,
            foil_unit_price: 0.1042,
            film_rate: 1.25,
            block: {
                film_unit_price: 120,
                block_unit_price: 70
            },
            f_code: ['F2211234', 'F1011234']
        },
        line: [
            {
                labor: {
                    qty: 15000,
                    unit_price: 0.21111,
                    price: 3166.65
                },
                foil_roll: {
                    qty: 15000,
                    unit_price: 0.1042,
                    price: 3000
                },
                block: {
                    qty: 4,
                    unit_price: 190,
                    price: 760
                }
            }
        ]
    },
    {
        type: "emboss",
        name: "emboss",
        type_id: 5,
        process_id: 4,
        info: {
            width: 2,
            length: 3,
            depth_type: "บาง",
            depth: 1.25,
            block_rate: 24,
            film_rate: 1.25,
            block: {
                film_unit_price: 120,
                block_unit_price: 144
            },
            f_code: ["F2211234", "F1011234"]
        },
        line: [
            {
                labor: {
                    qty: 15000,
                    unit_price: 0.21111,
                    price: 3166.65
                },
                block: {
                    qty: 4,
                    unit_price: 264,
                    price: 1056
                }
            }
        ]
    },
    {
        type_id: 3,
        type: "coating",
        process_id: 32,
        name: "gloss spot waterbase",
        info: {
            code: "S-WTB",
            type: "Spot Waterbase",
            name: "Gloss",
            side: 2,
            width: 21.74,
            length: 33.23,
            material_type: "",
            f_code: [],
            coating_price: 0.0003,
            min_cost: 0.4,
            unit_min_cost: "sheet"
        },
        line: [
            {
                qty: 3589,
                unit_price: 0.43,
                price: 1543.27
            }
        ]
    },
    {
        type_id: 3,
        type: "coating",
        process_id: 46,
        name: "UV Drip off",
        info: {
            code: "UV-D",
            type: "UV Drip off",
            name: "Gloss",
            side: 1,
            width: 21.74,
            length: 33.23,
            material_type: "",
            f_code: [],
            coating_price: 0.003,
            min_cost: 0.8,
            unit_min_cost: "sheet"
        },
        line: [
            {
                qty: 3589,
                unit_price: 2.17,
                price: 7788.13
            }
        ]
    }
]

const mockAddon2 = [
    {
        type: "foilstamp",
        name: "foilstamp",
        type_id: 4,
        process_id: 3,
        info: {
            process_index: 0,
            code: "11-i : SAM",
            color: "Silver",
            color_th: "เงินเงา",
            width: 2,
            length: 3,
            size: [
                2,
                3
            ],
            foil_width: 25,
            foil_length: 400,
            foil_roll_price: 1700,
            foil_roll_min_price: 500,
            is_customFoil: 0,
            depth_type: "",
            depth: 0,
            block_rate: 12,
            pcs_per_roll: 9600,
            foil_unit_price: 0.1771,
            film_rate: 1.25,
            block: {
                film_unit_price: 120,
                block_unit_price: 72
            },
            // f_code:['F1011234','F2211234']
        },
        line: [
            {
                labor: {
                    qty: 15000,
                    unit_price: 0.21111,
                    price: 3166.65
                },
                foil_roll: {
                    qty: 15000,
                    unit_price: 0.1771,
                    price: 2656.5
                },
                block: {
                    qty: 4,
                    unit_price: 192,
                    price: 768
                }
            }
        ]
    },
    {
        type: "foilstamp",
        name: "foilstamp",
        type_id: 4,
        process_id: 3,
        info: {
            process_index: 0,
            code: "11-i : SAM",
            color: "Silver",
            color_th: "เงินเงา",
            width: 1,
            length: 2,
            size: [
                1,
                2
            ],
            foil_width: 25,
            foil_length: 400,
            foil_roll_price: 1700,
            foil_roll_min_price: 500,
            is_customFoil: 0,
            depth_type: "",
            depth: 0,
            block_rate: 12,
            pcs_per_roll: 19200,
            foil_unit_price: 0.0885,
            film_rate: 1.25,
            block: {
                film_unit_price: 120,
                block_unit_price: 70
            },
        },
        line: [
            {
                labor: {
                    qty: 15000,
                    unit_price: 0.21111,
                    price: 3166.65
                },
                foil_roll: {
                    qty: 15000,
                    unit_price: 0.0885,
                    price: 1327.5
                },
                block: {
                    qty: 4,
                    unit_price: 190,
                    price: 760
                }
            }
        ]
    },
    {
        type: "foilstamp",
        name: "foilstamp",
        type_id: 4,
        process_id: 3,
        info: {
            process_index: 1,
            code: "12-i : OSP",
            color: "Matt silver",
            color_th: "เงินด้าน",
            width: 1,
            length: 1,
            size: [
                1,
                1
            ],
            foil_width: 24,
            foil_length: 400,
            foil_roll_price: 3000,
            foil_roll_min_price: 3000,
            is_customFoil: 0,
            depth_type: "",
            depth: 0,
            block_rate: 12,
            pcs_per_roll: 28800,
            foil_unit_price: 0.1042,
            film_rate: 1.25,
            block: {
                film_unit_price: 120,
                block_unit_price: 70
            },
            // f_code:['F2211234','F1011234']
        },
        line: [
            {
                labor: {
                    qty: 15000,
                    unit_price: 0.21111,
                    price: 3166.65
                },
                foil_roll: {
                    qty: 15000,
                    unit_price: 0.1042,
                    price: 3000
                },
                block: {
                    qty: 4,
                    unit_price: 190,
                    price: 760
                }
            }
        ]
    },
    {
        type: "emboss",
        name: "emboss",
        type_id: 5,
        process_id: 4,
        info: {
            width: 2,
            length: 3,
            depth_type: "บาง",
            depth: 1.25,
            block_rate: 24,
            film_rate: 1.25,
            block: {
                film_unit_price: 120,
                block_unit_price: 144
            },
            // f_code:["F2211234", "F1011234"]
        },
        line: [
            {
                labor: {
                    qty: 15000,
                    unit_price: 0.21111,
                    price: 3166.65
                },
                block: {
                    qty: 4,
                    unit_price: 264,
                    price: 1056
                }
            }
        ]
    }
]
const mockupData2 = {
    job: {
        job_name: "ทดสอบโปรแกรม ไม่แบ่งยอด F",
        job_id: "",
        is_reprinted: 0,
        ink_type: "conventional",
        print_type: "Offset",
        flexo_size: null,
        is_multiple_f: false,
        color_limit: [{
            is_color_limit: true,
            qty: 10
        }]
    },
    ae: {
        ae_id: "6560001",
        ae_name: "ทดสอบ MIS ทดสอบ MIS"
    },
    customer: {
        customer_id: "C9999999",
        customer_name: "TEST MIS ครับบ"
    },
    qty: {
        main: [30000],
        runon: [0],
        customer: 0,
        ae: 0,
        runon_percent: "",
        totalqty: [30000]
    },

    component1: [
        {
            box_type: {
                type_id: 12,
                glued_spot: 0,
                type_name: "Custom",
                packing_layer: 2
            },
            component_name: "Comp.1",
            color: [
                {
                    // f_code:"F1011234",
                    outside: 4,
                    inside: 0,
                    all: 4,
                    special_ink: [
                        {
                            type: "material",
                            type_id: 10,
                            process_id: 40,
                            name: "หมึกเมทัลลิค",
                            info: {
                                ink_name: "สีที่ 1",
                                print_style: "stripe",
                                paper_code: "AC"
                            },
                            line: [
                                {
                                    qty: 1,
                                    unit_price: 950,
                                    price: 950
                                }
                            ]
                        },
                        {
                            type: "material",
                            type_id: 10,
                            process_id: 41,
                            name: "หมึกสะท้อนแสง",
                            info: {
                                ink_name: "สีที่ 2",
                                print_style: "solid",
                                paper_code: "AC"
                            },
                            line: [
                                {
                                    qty: 3,
                                    unit_price: 1000,
                                    price: 3000
                                }
                            ]
                        },
                        {
                            type: "material",
                            type_id: 10,
                            process_id: 42,
                            name: "หมึกทนแดด",
                            info: {
                                ink_name: "สีที่ 3",
                                print_style: "stripe",
                                paper_code: "AC"
                            },
                            line: [
                                {
                                    qty: 1,
                                    unit_price: 400,
                                    price: 400
                                }
                            ]
                        }
                    ]
                }
            ],
            paper: {
                paper_code: "AC C1s",
                paper_name: "A/C C1s",
                paper_cost: 100,
                paper_markup: 7,
                paper_gram: 210,
                paper_thickness: 0.215,
                paper_percent: 0,
                sheet_unit_price: false,
                is_custom: 0,
                remark: "",
                paper_total_price: 107
            },
            gram: 210,
            component_type: {
                type: 1,
            },
            manual_layout: true,
            // f_detail:{
            //     f_qty:[10333,20600],
            //     f_total_qty:30933,
            //     f_list:[
            //         {
            //             f_code:"F1011234",
            //             f_qty:10000,
            //             runon_percent:3,
            //             runon_qty:333,
            //             ae_qty:0,
            //             customer_qty:0,
            //             total_qty:10333
            //         },
            //         {
            //             f_code:"F2211234",
            //             f_qty:20000,
            //             runon_percent:5,
            //             runon_qty:555,
            //             ae_qty:25,
            //             customer_qty:20,
            //             total_qty:20600
            //         }
            //     ],
            // },
            addon: mockAddon
            // addon: []
        },
    ]
}

const mockDelivery = [
    {
        round: 1,
        destinationId: 49,
        destinationName: "ฉะเชิงเทรา",
        dueDate: null,
        detail: [
            {
                componentId: 0,
                f_code: "F1011234",
                fIndex: 0,
                qty: 10000,
                totalqty: [
                    30933
                ],
                total_weight: [
                    {
                        qty: 11,
                        unit_price: 5,
                        price: 55,
                        compQty: 10000,
                        gross_weight: 3.9,
                        total_weight: 42.9,
                        packArr: [
                            11
                        ],
                        qtyArr: [
                            10000
                        ],
                        packQty: 11
                    }
                ]
            }
        ],
        net_weight: 42.9,
        qty_rate: [
            [
                {
                    net_weight: 42.9,
                    rate_id: 49,
                    unit_price: 830,
                    qty: 1,
                    additional_price: 0,
                    price: 830
                }
            ]
        ],
        rate_line: [
            [
                {
                    net_weight: 42.9,
                    rate_id: 49,
                    unit_price: 830,
                    qty: 1,
                    additional_price: 0,
                    price: 830
                }
            ]
        ]
    },
    {
        round: 2,
        destinationId: 49,
        destinationName: "ฉะเชิงเทรา",
        dueDate: null,
        detail: [
            {
                componentId: 0,
                f_code: "F2211234",
                fIndex: 1,
                qty: 20000,
                totalqty: [
                    30933
                ],
                total_weight: [
                    {
                        qty: 21,
                        unit_price: 5,
                        price: 105,
                        compQty: 20000,
                        gross_weight: 3.9,
                        total_weight: 81.89999999999999,
                        packArr: [
                            21
                        ],
                        qtyArr: [
                            20000
                        ],
                        packQty: 21
                    }
                ]
            }
        ],
        net_weight: 81.9,
        qty_rate: [
            [
                {
                    net_weight: 81.9,
                    rate_id: 49,
                    unit_price: 830,
                    qty: 1,
                    additional_price: 0,
                    price: 830
                }
            ]
        ],
        rate_line: [
            [
                {
                    net_weight: 81.9,
                    rate_id: 49,
                    unit_price: 830,
                    qty: 1,
                    additional_price: 0,
                    price: 830
                }
            ]
        ]
    }
]

const mockupData = {
    job: {
        job_name: "Test - ทดสอบระบบแบ่ง F",
        job_id: "",
        is_reprinted: 0,
        ink_type: "conventional",
        print_type: "Offset",
        flexo_size: null,
        is_multiple_f: true,
        is_different_packing: false,
        color_limit: [{
            is_color_limit: true,
            qty: 10
        }]
    },
    ae: {
        ae_id: "6560001",
        ae_name: "ทดสอบ MIS ทดสอบ MIS"
    },
    customer: {
        customer_id: "C9999999",
        customer_name: "TEST MIS ครับบ"
    },
    qty: {
        main: [30933],
        runon: [0],
        customer: 0,
        ae: 0,
        runon_percent: "",
        totalqty: [30933]
    },
    component1: [
        {
            box_type: {
                type_id: 12,
                glued_spot: 0,
                type_name: "Custom",
                packing_layer: 2
            },
            component_name: "Comp.1",
            color: [
                {
                    f_code: "F1011234",
                    outside: 4,
                    inside: 0,
                    all: 4,
                    special_ink: [
                        {
                            type: "material",
                            type_id: 10,
                            process_id: 40,
                            name: "หมึกเมทัลลิค",
                            info: {
                                ink_name: "สีที่ 1",
                                print_style: "stripe",
                                paper_code: "AC"
                            },
                            line: [
                                {
                                    qty: 1,
                                    unit_price: 950,
                                    price: 950
                                }
                            ]
                        },
                        {
                            type: "material",
                            type_id: 10,
                            process_id: 41,
                            name: "หมึกสะท้อนแสง",
                            info: {
                                ink_name: "สีที่ 2",
                                print_style: "solid",
                                paper_code: "AC"
                            },
                            line: [
                                {
                                    qty: 3,
                                    unit_price: 1000,
                                    price: 3000
                                }
                            ]
                        },
                        {
                            type: "material",
                            type_id: 10,
                            process_id: 42,
                            name: "หมึกทนแดด",
                            info: {
                                ink_name: "สีที่ 3",
                                print_style: "stripe",
                                paper_code: "AC"
                            },
                            line: [
                                {
                                    qty: 1,
                                    unit_price: 400,
                                    price: 400
                                }
                            ]
                        },
                        {
                            type: "material",
                            type_id: 10,
                            process_id: 47,
                            name: "หมึก UV",
                            info: {
                                ink_name: "Drip off",
                                print_style: "stripe",
                                paper_code: "AC"
                            },
                            line: [
                                {
                                    qty: 1,
                                    unit_price: 1300,
                                    price: 1300
                                }
                            ]
                        }
                    ]
                },
                {
                    f_code: "F2211234",
                    outside: 2,
                    inside: 0,
                    all: 2,
                    special_ink: [
                        {
                            type: "material",
                            type_id: 10,
                            process_id: 41,
                            name: "หมึกสะท้อนแสง",
                            info: {
                                ink_name: "สีที่ 2",
                                print_style: "solid",
                                paper_code: "AC"
                            },
                            line: [
                                {
                                    qty: 3,
                                    unit_price: 1000,
                                    price: 3000
                                }
                            ]
                        },
                        {
                            type: "material",
                            type_id: 10,
                            process_id: 47,
                            name: "หมึก UV",
                            info: {
                                ink_name: "Drip off",
                                print_style: "stripe",
                                paper_code: "AC"
                            },
                            line: [
                                {
                                    qty: 1,
                                    unit_price: 1300,
                                    price: 1300
                                }
                            ]
                        }
                    ]
                },
            ],
            paper: {
                paper_code: "AC C1s",
                paper_name: "A/C C1s",
                paper_cost: 100,
                paper_markup: 7,
                paper_gram: 210,
                paper_thickness: 0.215,
                paper_percent: 0,
                sheet_unit_price: false,
                is_custom: 0,
                remark: "",
                paper_total_price: 107
            },
            gram: 210,
            component_type: {
                type: 1,
            },
            manual_layout: true,
            f_detail: {
                f_qty: [10333, 20600],
                f_total_qty: 30933,
                f_list: [
                    {
                        f_code: "F1011234",
                        f_qty: 10000,
                        runon_percent: 3,
                        runon_qty: 333,
                        ae_qty: 0,
                        customer_qty: 0,
                        total_qty: 10333
                    },
                    {
                        f_code: "F2211234",
                        f_qty: 20000,
                        runon_percent: 5,
                        runon_qty: 555,
                        ae_qty: 25,
                        customer_qty: 20,
                        total_qty: 20600
                    }
                ],
            },
            addon: mockAddon,
            // addon: [],
            delivery: {
                type_id: 12,
                type: "delivery",
                process_id: 20,
                name: "delivery",
                net_weight: 3.9,
                gross_weight: 3.9,
                unit_price: 5.85,
                price: [
                    {
                        qty: 32,
                        unit_price: 5.85,
                        price: 1500
                    }
                ],
                packing_detail: [
                    {
                        roundId: 1,
                        unit_price: 5,
                        detail: [
                            {
                                qty: 11,
                                unit_price: 5,
                                price: 55,
                                compQty: 10000,
                                gross_weight: 3.9,
                                total_weight: 42.9,
                                packArr: [
                                    11
                                ],
                                qtyArr: [
                                    10000
                                ],
                                packQty: 11
                            }
                        ]
                    },
                    {
                        roundId: 2,
                        unit_price: 5,
                        detail: [
                            {
                                qty: 21,
                                unit_price: 5,
                                price: 105,
                                compQty: 20000,
                                gross_weight: 3.9,
                                total_weight: 81.89999999999999,
                                packArr: [
                                    21
                                ],
                                qtyArr: [
                                    20000
                                ],
                                packQty: 21
                            }
                        ]
                    }
                ]
            }
        },
    ],
    delivery: mockDelivery
}