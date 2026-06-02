var showValue = 4;
var rowLimit = 63
var summaryPage = []
var currentPageIndex = 0
var packingObj = {}
var headerRow = []

function printPdf(jobData, is_download = false) {
  const { job: { job_id = '' || '[RFQ No.]' } } = jobData || {}

  let docDefinition = {
    info: {
      title: `ข้อมูลสรุปราคา ${job_id}`,
      author: "",
      subject: "",
      keywords: "",
    },
    content: getContent(jobData),
    defaultStyle: {
      font: "THSarabunNew",
      fontSize: 7.5,
      alignment: "center",
      columnGap: 0,
    },
    // pageSize: 'A4',
    pageMargins: [2, 7, 2, 7],
  };
  pdfMake.fonts = {
    THSarabunNew: {
      normal: "THSarabunNew",
      bold: "THSarabunNew Bold",
      italics: "THSarabunNew Italic",
      bolditalics: "THSarabunNew BoldItalic",
    },
  };

  const fileName = `${job_id} Summary`


  if (is_download) {
    pdfMake.createPdf(docDefinition).download(fileName)
  } else {
    pdfMake.createPdf(docDefinition).open();
  }

}

function getContent(data) {
  let content = [
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
            body: [...getRowWeight(data, true)],
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
  ];

  return content;
}

function SummaryData(data = {}) {
  const amountValue = data.qty.main.length;
  const amountPage = Math.ceil(amountValue / showValue);

  var summaryArray = [];

  for (let i = 0; i < amountPage; i++) {
    let amountValueInPage =
      amountValue - i * showValue >= showValue
        ? showValue
        : amountValue - i * showValue;
    let widthColmns = [];
    let valueColumns = [];

    for (let j = 0; j < amountValueInPage; j++) {
      widthColmns.push(28, 24, 35);

      valueColumns.push({}, {}, {});
    }

    let startIndex = i * showValue;
    let lastIndex =
      startIndex + (showValue - 1) <= amountValue - 1
        ? startIndex + (showValue - 1)
        : amountValue - 1;
    summaryArray.push(
      {
        columns: [
          { width: "*", text: "" },
          {
            width: "auto",
            table: {
              widths: [40, 40, 30, 23, 30, ...widthColmns],
              body: [
                [
                  {
                    text: `Summary (${i + 1}/${amountPage})`,
                    bold: true,
                    colSpan: 5 + widthColmns.length,
                    margin: [0, 5],
                    border: [true, true, true, false],
                  },
                  {},
                  {},
                  {},
                  {},
                  ...valueColumns,
                ]
              ],
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
      }
    );
    PrepareSummaryData(data, startIndex, lastIndex)

    for (let i = 0; i < summaryPage.length; i++) {
      summaryArray.push(
        {
          columns: [
            { width: "*", text: "" },
            {
              width: "auto",
              table: {
                headerRows: 2,
                dontBreakRows: true,
                widths: [40, 40, 30, 23, 30, ...widthColmns],
                body: [
                  ...summaryPage[i]
                ],
              },
              layout: {
                paddingLeft: function (i, node) { return 1; },
                paddingRight: function (i, node) { return 1; },
                paddingTop: function (i, node) { return 1; },
                paddingBottom: function (i, node) { return 1; }
              },
              pageBreak: "after",
            },
            { width: "*", text: "" },
          ],
        }
      );
    }
    console.log("summaryPage <<<", summaryPage);
  }
  return summaryArray;
}

function PrepareSummaryData(data, startIndex, lastIndex) {
  const { is_cancel_total_profit_sharing = false } = data?.job || {}
  summaryPage = [[]]
  currentPageIndex = 0
  getHeaderRow(data, startIndex, lastIndex)
  addSummaryContent(headerRow)
  addSummaryContent(getRowSummary(data, "paper", "", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "corrugated", "", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "special_ink", "", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "component_material", "", startIndex, lastIndex))
  addSummaryContent(getRowSummaryTotal(data, "material", "", startIndex, lastIndex))
  addSummaryContent(getRowSummaryTotal(data, "print_plate", "plate", startIndex, lastIndex))
  // addSummaryContent(getRowSummaryTotal(data, "reprint_plate", "reprint_plate", startIndex, lastIndex))
  addSummaryContent(getRowSummaryTotal(data, "print_plate", "proof", startIndex, lastIndex))
  addSummaryContent(getRowSummaryTotal(data, "print_plate", "print", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "coating", "", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "corrugated_glued", "", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "foilstamp", "", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "bossing", "emboss", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "bossing", "deboss", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "diecut", "", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "digital_diecut", "", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "main_process", "chip", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "main_process", "trim", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "main_process", "bag", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "main_process", "shrinkwrap", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "process", "other", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "process", "handwork", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "process", "custom", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "assembly", "", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "main_process", "inspection", startIndex, lastIndex))
  addSummaryContent(getRowTotal(data, "Process", startIndex, lastIndex))
  addSummaryContent(getRowSummary(data, "otherCost", "", startIndex, lastIndex))
  addSummaryContent(getRowTotal(data, "Other", startIndex, lastIndex))
  getPackingRows(data, startIndex, lastIndex)
  addSummaryContent(packingObj.paperband_tr)
  addSummaryContent(packingObj.kraftwrap_tr)
  addSummaryContent(packingObj.carton_tr)
  addSummaryContent(packingObj.pallet_tr)
  addSummaryContent(packingObj.delivery_tr)
  addSummaryContent(getRowTotal(data, "Packing", startIndex, lastIndex))
  if ((data?.SYSTEM_VERSION || 0) < 3.1) {
    addSummaryContent(getRowTotal(data, "MarkUp", startIndex, lastIndex))
    addSummaryContent(getRowTotal(data, "MarkDown", startIndex, lastIndex))
  } else {
    addSummaryContent(getRowTotal(data, "MarkingPercentMaterial", startIndex, lastIndex))
    addSummaryContent(getRowTotal(data, "SubtotalPriceMaterial", startIndex, lastIndex))
    addSummaryContent(getRowTotal(data, "MarkingPercentProduction", startIndex, lastIndex))
    addSummaryContent(getRowTotal(data, "SubtotalPriceProduction", startIndex, lastIndex))
  }

  addSummaryContent(getRowTotal(data, "Price", startIndex, lastIndex))
  addSummaryContent(getRowTotal(data, "Gift", startIndex, lastIndex))
  addSummaryContent(getRowTotal(data, "CustomerPriceDiff", startIndex, lastIndex))
  addSummaryContent(getRowTotal(data, "DiffPrice", startIndex, lastIndex))
  addSummaryContent(getRowTotal(data, "Tax", startIndex, lastIndex))
  !is_cancel_total_profit_sharing && addSummaryContent(getRowTotal(data, "ProfitSharing", startIndex, lastIndex))
  addSummaryContent(getRowTotal(data, "FinalPrice", startIndex, lastIndex))
  addSummaryContent(getRowTotal(data, "UnitPrice", startIndex, lastIndex))
  addSummaryContent(getRowTotal(data, "UnitPriceExchange", startIndex, lastIndex))
  addSummaryContent(getRowTotal(data, "Exchange", startIndex, lastIndex))
  console.log("summaryPage", summaryPage);
}

function addSummaryContent(content) {
  const rowAmount = content.length
  const limit = currentPageIndex == 0 ? rowLimit - 1 : rowLimit;
  if (summaryPage[currentPageIndex].length + rowAmount > limit) {
    summaryPage.push([])
    currentPageIndex += 1;
    console.log(headerRow)
    var hr = JSON.parse(JSON.stringify(headerRow));
    summaryPage[currentPageIndex].push(...hr)
  }

  summaryPage[currentPageIndex].push(...content)
}

function getHeaderRow(data = {}, startIndex, lastIndex) {
  let headRow1 = [
    {
      text: "Description",
      bold: true,
      colSpan: 5,
      rowSpan: 2,
    },
    "",
    "",
    "",
    "",
  ];

  let headRow2 = ["", "", "", "", ""];

  for (let i = startIndex; i <= lastIndex; i++) {
    let volume = { text: "Volume", bold: true };
    let totalQty = {
      text: numeral(data.qty.totalqty[i]).format("0,0"),
      bold: true,
    };
    let main = { text: numeral(data.qty.main[i]).format("0,0"), bold: true };
    headRow1.push(volume, totalQty, main);
    headRow2.push(
      { text: "Unit Price", bold: true },
      { text: "Qty", bold: true },
      { text: "Price", bold: true }
    );
  }

  headerRow = [headRow1, headRow2];
}

function getRowSummary(data = {}, rowName, subProc, startIndex, lastIndex) {
  const {
    job: { is_multiple_f: isMultipleF = false },
  } = data || {};

  // if (!data?.component1?.some(comp => comp?.paper_usage?.line?.some(line => line?.price?.plate?.process_id)) && subProc == 'plate') {
  //   console.log("plate conditions")
  //   return []
  // }

  if (!data?.component1?.some(comp => comp?.paper_usage?.is_useReprintPlate) && subProc == 'reprint_plate') {
    console.log("new plate conditions")
    return []
  }


  return isMultipleF ? getEditionRowSummary(data, rowName, subProc, startIndex, lastIndex) : getNormalRowSummary(data, rowName, subProc, startIndex, lastIndex);
}

function getNormalRowSummary(data = {}, rowName, subProc, startIndex, lastIndex) {
  const mainData = data,
    compArr = data.component1;
  var rows = [];

  const printType = mainData.job.print_type;

  switch (rowName) {
    case "paper":
      var paperColumn_arr = [],
        paperRow_arr = [],
        num_trPaper = 0;

      //* number of line
      const numTrPaper =
        compArr?.filter((comp) => comp?.component_type?.type != 3)?.length || 0;

      compArr.forEach((item, index) => {
        let paperColumn = [];

        if (item.component_type.type != 3) {
          for (let i = startIndex; i <= lastIndex; i++) {
            let item1 = item.paper_usage.line[i];
            paperColumn.push(
              {
                text: numeral(item1.price.paper.unit_price).format("0,0.00"),
                alignment: "right",
              },
              {
                text: numeral(item1.price.paper.qty).format("0,0"),
              },
              {
                text: numeral(item1.price.paper.price).format("0,0.00"),
                alignment: "right",
              }
            );
          }

          paperColumn_arr.push(paperColumn);

          if (paperColumn_arr.length == 1) {
            var paper_tr = [
              {
                text: "Paper",
                rowSpan: numTrPaper,
                alignment: "left",
              },
              {
                text: item.component_name,
              },
              {
                text: item.paper.paper_name,
              },
              {
                text: `${item.paper.paper_gram} gsm`,
                colSpan: 2,
              },
              {},
            ];
          } else {
            var paper_tr = [
              {},
              {
                text: item.component_name,
              },
              {
                text: item.paper.paper_name,
              },
              {
                text: `${item.paper.paper_gram} gsm`,
                colSpan: 2,
              },
              {},
            ];
          }

          paperRow_arr.push(paper_tr);
        }
      });

      if (paperColumn_arr.length != 0) {
        paperColumn_arr.forEach((item, index) => {
          // tr += paperRow_arr[index] + item + `</tr>`
          rows.push([...paperRow_arr[index], ...item]);
        });
      }

      break;
    case "corrugated":
      compArr.forEach((item, index) => {
        var corrugatedColumn1 = [],
          corrugatedColumn2 = [],
          emptyObj = [];

        if (item.corrugated_layer) {
          const is_price_per_sheet = item.corrugated_layer?.info?.is_price_per_sheet || false

          for (let i = startIndex; i <= lastIndex; i++) {
            let item1 = item.corrugated_layer.price[i];
            corrugatedColumn1.push(
              {
                text: numeral(item1.unit_price).format("0,0.00"),
                alignment: "right",
              },
              {
                text: numeral(item1.qty).format("0,0"),
              },
              {
                text: numeral(item1.price).format("0,0.00"),
                alignment: "right",
              }
            );
            corrugatedColumn2.push(
              {
                text: " ",
                colSpan: 3,
                rowSpan: 3,
              },
              {},
              {}
            );
            emptyObj.push({}, {}, {});
          }

          rows.push(
            [
              {
                text: "Corrugated Board",
                alignment: "left",
              },
              {
                text: item.component_name,
              },
              {
                text: `ลอน ${item.corrugated_layer?.info?.flute_type} ${item.corrugated_layer?.info?.fluteInfo_custom || ''} ${item.corrugated_layer?.info?.num_layer} ชั้น`,
              },
              {
                text: item.corrugated_layer.info.name,
                colSpan: 2,
              },
              {},
              ...corrugatedColumn1,
            ],
            [
              {
                text: "ลอนขนานด้าน x Cut off",
                colSpan: 2,
              },
              {},
              {
                text: "ราคาลูกฟูกต่อแผ่น",
                colSpan: 3,
              },
              {},
              {},
              ...corrugatedColumn2,
            ],
            [
              {
                text: `${item.corrugated_layer.info.flute_side} x ${item.corrugated_layer.info.cut_off}`,
                colSpan: 2,
              },
              {},
              {
                text: numeral(
                  Math.max(...item.corrugated_layer.info.unit_price)
                ).format("0,0.00"),
                colSpan: 3,
              },
              {},
              {},
              ...emptyObj,
            ],
            [
              {
                text: "ราคาทุน",
              },
              {
                text: numeral(
                  Math.max(...item.corrugated_layer.info.cost)
                ).format("0,0.00"),
              },
              {
                text: is_price_per_sheet ? 'B/Sheet' : "B/ตร.ฟุต",
              },
              {
                text: is_price_per_sheet ? '' : numeral(
                  Math.max(...item.corrugated_layer.info.unit_inch)
                ).format("0,0.0000"),
              },
              {
                text: is_price_per_sheet ? '' : "B/ตร.นิ้ว",
              },
              ...emptyObj,
            ]
          );
        }
      });
      break;
    case "special_ink":
      let countSpeInk = 0;
      compArr.forEach((item, compIndex) => {
        if (![null, undefined].includes(item?.color)) {
          const speInkRow = compArr?.reduce(
            (sumtr, comp) =>
            (sumtr += comp?.color?.reduce(
              (total, curr) => (total += curr?.special_ink?.length || 0),
              0
            )),
            0
          );
          item?.color?.forEach((color, colorIndex) => {
            const { special_ink } = color || {};

            special_ink?.forEach((specialInk, specialInkIndex) => {
              var specialInkColumn = [];
              // specialInk?.line?.forEach((line, lineIndex) => {});
              for (let i = startIndex; i <= lastIndex; i++) {
                var line = specialInk?.line[i];
                specialInkColumn.push(
                  {
                    text: numeral(line.unit_price).format("0,0.00"),
                    alignment: "right",
                  },
                  {
                    text: numeral(line.qty).format("0,0"),
                  },
                  {
                    text: numeral(line.price).format("0,0.00"),
                    alignment: "right",
                  }
                );
              }
              if (countSpeInk == 0 && colorIndex == 0 && specialInkIndex == 0) {
                rows.push([
                  {
                    text: "Special Ink",
                    rowSpan: speInkRow,
                    alignment: "left",
                  },
                  {
                    text: item.component_name,
                  },
                  {
                    text: `${specialInk.name} : ${specialInk.info.ink_name}`,
                    colSpan: 3,
                    alignment: "left",
                  },
                  {},
                  {},
                  ...specialInkColumn,
                ]);
                countSpeInk++;
              } else {
                rows.push([
                  {},
                  {
                    text: item.component_name,
                  },
                  {
                    text: `${specialInk.name} : ${specialInk.info.ink_name}`,
                    colSpan: 3,
                    alignment: "left",
                  },
                  {},
                  {},
                  ...specialInkColumn,
                ]);
              }
            });
          });
        }
      });
      break;
    case "component_material":
      mainData.component1.forEach((comp, index) => {
        comp?.process?.filter(obj => obj?.type === 'material')?.forEach((item, index) => {
          var materialColumn = [];
          for (let i = startIndex; i <= lastIndex; i++) {
            let item1 = item.line[i];
            materialColumn.push(
              {
                text: numeral(item1.unit_price).format("0,0.00"),
                alignment: "right",
              },
              {
                text: numeral(item1.qty).format("0,0.00"),
              },
              {
                text: numeral(item1.price).format("0,0.00"),
                alignment: "right",
              }
            );
          }

          rows.push([
            {
              text: item?.info?.component_info?.component_name,
              alignment: "left",
              colSpan: 2,
            },
            {},
            {
              text: item?.info?.process_name,
              alignment: "left",
              colSpan: 3,
            },
            {},
            {},
            ...materialColumn,
          ]);
        })
      });
      break;
    case "material":
      mainData.material.forEach((item, index) => {
        var materialColumn = [];
        for (let i = startIndex; i <= lastIndex; i++) {
          let item1 = item.line[i];
          materialColumn.push(
            {
              text: numeral(item1.unit_price).format("0,0.00"),
              alignment: "right",
            },
            {
              text: numeral(item1.qty).format("0,0.00"),
            },
            {
              text: numeral(item1.price).format("0,0.00"),
              alignment: "right",
            }
          );
        }

        rows.push([
          {
            text: item.name,
            alignment: "left",
            colSpan: 5,
          },
          {},
          {},
          {},
          {},
          ...materialColumn,
        ]);
      });
      break;
    case "print_plate":
      if (subProc == "plate") {
        if (printType == "Offset") {
          var proc_label = "Plate",
            color_label = "cols";
        } else if (printType == "Flexo") {
          var proc_label =
            "Plate Polymer (" +
            mainData.job.flexo_size[0] +
            " x " +
            mainData.job.flexo_size[1] +
            " in²)",
            color_label = "cols";
        } else {
          var proc_label = "Plate";
          var color_label = "cols";
        }
      } else if (subProc == "proof") {
        if (['Jet Press', 'Konica'].includes(printType)) {
          var proc_label = "Proof";
          var color_label = "cols";
        }
      } else {
        if (printType == "Offset") {
          var proc_label = "Print";
          if (mainData.job.ink_type == "UV") {
            var color_label = "cols UV";
          } else {
            var color_label = "cols";
          }
        } else if (printType == "Flexo") {
          var proc_label = "Print Flexo";
          var color_label = "cols";
        } else {
          var proc_label = "Print";
          var color_label = "cols";
        }
      }

      compArr.forEach((item, index) => {
        var column_outside = [],
          column_inside = [];

        if (!['Jet Press'].includes(printType) && !(printType == 'Konica' && subProc == 'plate')) {
          if (["plate", "print"].includes(subProc)) {
            var machine_size = item.machine.machine_size.name;

            for (let i = startIndex; i <= lastIndex; i++) {
              let item1 = item.paper_usage.line[i];
              if (subProc == "plate") {
                var proc = item1.price.plate;
              } else {
                var proc = item1.price.print;
              }

              column_outside.push(
                {
                  text: numeral(proc.outside.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(proc.outside.qty).format("0,0"),
                },
                {
                  text: numeral(proc.outside.price).format("0,0.00"),
                  alignment: "right",
                }
              );

              column_inside.push(
                {
                  text: numeral(proc.inside.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(proc.inside.qty).format("0,0"),
                },
                {
                  text: numeral(proc.inside.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }

            if (index == 0) {
              rows.push(
                [
                  {
                    text: proc_label,
                    alignment: "left",
                    rowSpan: compArr.length * 2,
                  },
                  {
                    text: `${item.component_name} Outside`,
                    alignment: "left",
                  },
                  {
                    text: `${item.color[0].outside} ${color_label}`,
                  },
                  {
                    text: machine_size,
                    colSpan: 2,
                  },
                  {},
                  ...column_outside,
                ],
                [
                  {},
                  {
                    text: `${item.component_name} Inside`,
                    alignment: "left",
                  },
                  {
                    text: `${item.color[0].inside} ${color_label}`,
                  },
                  {
                    text: machine_size,
                    colSpan: 2,
                  },
                  {},
                  ...column_inside,
                ]
              );
            } else {
              rows.push(
                [
                  {},
                  {
                    text: `${item.component_name} Outside`,
                    alignment: "left",
                  },
                  {
                    text: `${item.color[0].outside} ${color_label}`,
                  },
                  {
                    text: machine_size,
                    colSpan: 2,
                  },
                  {},
                  ...column_outside,
                ],
                [
                  {},
                  {
                    text: `${item.component_name} Inside`,
                    alignment: "left",
                  },
                  {
                    text: `${item.color[0].inside} ${color_label}`,
                  },
                  {
                    text: machine_size,
                    colSpan: 2,
                  },
                  {},
                  ...column_inside,
                ]
              );
            }
          }
        }

        if (['Jet Press', 'Konica']?.includes(printType) && !(printType == 'Konica' && subProc == 'print')) {
          if (["proof", "print"].includes(subProc)) {
            let colorLabel = `${item.color[0]?.outside ? 4 : 0}/${item.color[0]?.inside ? 4 : 0
              } ${color_label}`;
            var machine_size = printType,
              column_all = [];

            for (let i = startIndex; i <= lastIndex; i++) {
              let item1 = item.paper_usage.line[i];
              if (subProc == "proof") {
                var proc = item1.price.proof;
              } else {
                var proc = item1.price.print;
              }

              column_all.push(
                {
                  text: numeral(proc.all.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(proc.all.qty).format("0,0"),
                },
                {
                  text: numeral(proc.all.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }

            if (index == 0) {
              if (subProc == "proof") {
                rows.push([
                  {
                    text: proc_label,
                    alignment: "left",
                    rowSpan: compArr.length,
                  },
                  {
                    text: item.component_name,
                    colSpan: 4,
                  },
                  {},
                  {},
                  {},
                  ...column_all,
                ]);
              } else {
                rows.push([
                  {
                    text: proc_label,
                    alignment: "left",
                    rowSpan: compArr.length,
                  },
                  {
                    text: colorLabel,
                  },
                  {
                    text: item.component_name,
                    colSpan: 3,
                  },
                  {},
                  {},
                  ...column_all,
                ]);
              }
            } else {
              if (subProc == "proof") {
                rows.push([
                  {},
                  {
                    text: item.component_name,
                    colSpan: 4,
                  },
                  {},
                  {},
                  {},
                  ...column_all,
                ]);
              } else {
                [
                  {},
                  {
                    text: colorLabel,
                  },
                  {
                    text: item.component_name,
                    colSpan: 3,
                  },
                  {},
                  {},
                  ...column_all,
                ];
              }
            }
          }
        }
      });
      break;
    case "reprint_plate":
      if (printType != "Offset") return []

      var proc_label = "Plate (สำรอง)",
        color_label = "cols";

      compArr.forEach((item, index) => {
        var column_outside = [],
          column_inside = [];

        var machine_size = item.machine.machine_size.name;

        for (let i = startIndex; i <= lastIndex; i++) {
          let item1 = item.paper_usage.line[i];
          var proc = item1.price.plate?.reprint;

          column_outside.push(
            {
              text: numeral(proc.outside.unit_price).format("0,0.00"),
              alignment: "right",
            },
            {
              text: numeral(proc.outside.qty).format("0,0"),
            },
            {
              text: numeral(proc.outside.price).format("0,0.00"),
              alignment: "right",
            }
          );

          column_inside.push(
            {
              text: numeral(proc.inside.unit_price).format("0,0.00"),
              alignment: "right",
            },
            {
              text: numeral(proc.inside.qty).format("0,0"),
            },
            {
              text: numeral(proc.inside.price).format("0,0.00"),
              alignment: "right",
            }
          );
        }

        if (index == 0) {
          rows.push(
            [
              {
                text: proc_label,
                alignment: "left",
                rowSpan: compArr.length * 2,
              },
              {
                text: `${item.component_name} Outside`,
                alignment: "left",
              },
              {
                text: `${item.color[0].outside} ${color_label}`,
              },
              {
                text: machine_size,
                colSpan: 2,
              },
              {},
              ...column_outside,
            ],
            [
              {},
              {
                text: `${item.component_name} Inside`,
                alignment: "left",
              },
              {
                text: `${item.color[0].inside} ${color_label}`,
              },
              {
                text: machine_size,
                colSpan: 2,
              },
              {},
              ...column_inside,
            ]
          );
        } else {
          rows.push(
            [
              {},
              {
                text: `${item.component_name} Outside`,
                alignment: "left",
              },
              {
                text: `${item.color[0].outside} ${color_label}`,
              },
              {
                text: machine_size,
                colSpan: 2,
              },
              {},
              ...column_outside,
            ],
            [
              {},
              {
                text: `${item.component_name} Inside`,
                alignment: "left",
              },
              {
                text: `${item.color[0].inside} ${color_label}`,
              },
              {
                text: machine_size,
                colSpan: 2,
              },
              {},
              ...column_inside,
            ]
          );
        }
      });
      break;
    case "coating":
      var coatingColumn_arr = [],
        coatingRow_arr = [],
        num_trCoating = 0;
      compArr.forEach((item) => {
        item.addon.forEach((item1) => {
          if (item1.type == "coating") {
            num_trCoating += 1;
          }
        });
      });
      compArr.forEach((item, index) => {
        item.addon.forEach((item1) => {
          var coatingColumn = [];
          if (item1.info.name == "Other") {
            var coating_option = "";
          } else {
            var coating_option = item1.info.name;
          }
          if (item1.type == "coating") {
            for (let i = startIndex; i <= lastIndex; i++) {
              let item2 = item1.line[i];
              coatingColumn.push(
                {
                  text: numeral(item2.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(item2.qty).format("0,0"),
                },
                {
                  text: numeral(item2.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }

            coatingColumn_arr.push(coatingColumn);
            if (['S-UV', 'S-UV-S'].includes(item1.info.code)) {
              var size_label =
                "(" + item1.info.width + " x " + item1.info.length + " in²)";
            } else if (item1.info?.code == 'P-PAT') {
              var size_label = `(เบอร์ ${item1?.info?.number})`
            } else {
              var size_label = "";
            }
            if (coatingColumn_arr.length == 1) {
              var coating_tr = [
                {
                  text: "Coating",
                  alignment: "left",
                  rowSpan: num_trCoating,
                },
                {
                  text: item.component_name,
                  alignment: "left",
                },
                {
                  text: `${coating_option} ${item1.info.type} ${item1.info.side} s ${size_label}`,
                  alignment: "left",
                  colSpan: 3,
                },
                {},
                {},
              ];
            } else {
              var coating_tr = [
                {},
                {
                  text: item.component_name,
                  alignment: "left",
                },
                {
                  text: `${coating_option} ${item1.info.type} ${item1.info.side} s ${size_label}`,
                  alignment: "left",
                  colSpan: 3,
                },
                {},
                {},
              ];
            }
            coatingRow_arr.push(coating_tr);
          }
        });
      });
      if (coatingColumn_arr.length != 0) {
        coatingColumn_arr.forEach((item, index) => {
          rows.push([...coatingRow_arr[index], ...item]);
        });
      }
      break;
    case "corrugated_glued":
      var corrugatedGluedColumn_arr = [],
        corrugatedGluedRow_arr = [],
        num_trCorrugatedGlued = 0;

      compArr.forEach((item) => {
        item.process.forEach((item1) => {
          if (item1.name == "corrugated_glued") {
            num_trCorrugatedGlued += 1;
          }
        });
      });

      compArr.forEach((item, index) => {
        item.process.forEach((item1) => {
          var corrugatedGluedColumn = [];
          if (item1.name == "corrugated_glued") {
            for (let i = startIndex; i <= lastIndex; i++) {
              let item2 = item1.line[i];
              corrugatedGluedColumn.push(
                {
                  text: numeral(item2.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(item2.qty).format("0,0"),
                },
                {
                  text: numeral(item2.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }

            corrugatedGluedColumn_arr.push(corrugatedGluedColumn);
            if (corrugatedGluedColumn_arr.length == 1) {
              var corrugated_tr = [
                {
                  text: "ทากาวประกบลูกฟูกกับกระดาษ",
                  alignment: "left",
                  colSpan: 2,
                  rowSpan: num_trCorrugatedGlued,
                },
                {},
                {
                  text: item.component_name,
                },
                {
                  text: `${defaultData.corrugated_glued_cost} B/sqinch`,
                  colSpan: 2,
                },
                {},
              ];
            } else {
              var corrugated_tr = [
                {},
                {},
                {
                  text: item.component_name,
                },
                {
                  text: `${defaultData.corrugated_glued_cost} B/sqinch`,
                  colSpan: 2,
                },
                {},
              ];
            }
            corrugatedGluedRow_arr.push(corrugated_tr);
          }
        });
      });

      if (corrugatedGluedColumn_arr.length != 0) {
        corrugatedGluedColumn_arr.forEach((item, index) => {
          rows.push([...corrugatedGluedRow_arr[index], ...item]);
        });
      }

      break;
    case "foilstamp":
      compArr.forEach((component, compIndex) => {
        //* loop components.
        const { material_price_marking = 0 } = defaultData || {};
        const foilstampAddon = component.addon.filter(
          (obj) => obj.type === "foilstamp"
        );
        const num_process = [];

        foilstampAddon.forEach((addon, index) => {
          const process_index =
            addon?.info?.process_index >= 0
              ? addon?.info?.process_index
              : index;
          if (!num_process.includes(process_index)) {
            num_process.push(process_index);
          }
        });

        //* ได้เลขกรอบทั้งหมดของ foilstamp
        num_process.forEach((process_id) => {
          //* foilstamp แต่ละกรอบ
          let trBlock = [],
            trRoll = [],
            trStamp = [];
          //* หา process_id จาก addon list ที่ตรงกัน
          const foilstampSize = foilstampAddon.filter((addon, a_index) =>
            addon?.info?.process_index >= 0
              ? addon?.info?.process_index === process_id
              : a_index === process_id
          );
          const summary = {
            foilRoll: [],
            foilStamp: [],
          };

          // if(foilstampSize.length > 1){
          for (
            let qtyIndex = 0;
            qtyIndex < mainData.qty.totalqty.length;
            qtyIndex++
          ) {
            summary.foilRoll.push({
              unit_price: 0,
              qty: 0,
              price: 0,
            });
            summary.foilStamp.push({
              unit_price: 0,
              qty: 0,
              price: 0,
            });
          }
          // }

          foilstampSize.forEach((size, sizeIndex) => {
            //* foilstamp size แต่ละกรอบ [x*y , x*y]
            const {
              line,
              info: { foil_roll_min_price = 0 },
            } = size;
            let blockStampColumn = [];

            for (let i = startIndex; i <= lastIndex; i++) {
              const { labor, block, foil_roll } = line[i];

              blockStampColumn.push(
                {
                  text: numeral(block.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(block.qty).format("0,0"),
                },
                {
                  text: numeral(block.price).format("0,0.00"),
                  alignment: "right",
                }
              );
              summary.foilRoll[i].unit_price += foil_roll.unit_price;
              summary.foilRoll[i].qty = foil_roll.qty;
              summary.foilRoll[i].price += foil_roll.qty * foil_roll.unit_price;

              //* คิดค่า stamp ครั้งเดียว
              summary.foilStamp[i].unit_price = labor.unit_price;
              summary.foilStamp[i].qty = labor.qty;
              summary.foilStamp[i].price = labor.price;
            }

            //* แต่ละกรอบมีค่า Block ตามจำนวน size
            trBlock.push([
              {
                text: "Block Foil Stamp",
                alignment: "left",
              },
              {
                text: component.component_name,
                colSpan: 2,
              },
              {},
              {
                text: `Area (in²) : ${size.info.width} x ${size.info.length}`,
                colSpan: 2,
              },
              {},
              ...blockStampColumn,
            ]);
          });

          //* check min price
          foilstampSize.forEach((size, sizeIndex) => {
            const {
              line,
              info: { foil_roll_min_price = 0 },
            } = size;

            let roll_min_price = parseFloat(
              (
                foil_roll_min_price *
                (1 + material_price_marking / 100)
              ).toFixed(2)
            );

            for (let i = startIndex; i <= lastIndex; i++) {
              summary.foilRoll[i].price =
                summary.foilRoll[i].price < foil_roll_min_price
                  ? roll_min_price
                  : summary.foilRoll[i].price;
            }
          });

          let foilRollColumn = [],
            foilStampColumn = [];

          for (let i = startIndex; i <= lastIndex; i++) {
            foilRollColumn.push(
              {
                text: numeral(summary.foilRoll[i].unit_price).format(
                  "0,0.0000"
                ),
                alignment: "right",
              },
              {
                text: numeral(summary.foilRoll[i].qty).format("0,0"),
              },
              {
                text: numeral(summary.foilRoll[i].price).format("0,0.00"),
                alignment: "right",
              }
            );

            foilStampColumn.push(
              {
                text: numeral(summary.foilStamp[i].unit_price).format(
                  "0,0.00000"
                ),
                alignment: "right",
              },
              {
                text: numeral(summary.foilStamp[i].qty).format("0,0"),
              },
              {
                text: numeral(summary.foilStamp[i].price).format("0,0.00"),
                alignment: "right",
              }
            );
          }

          //* แต่ละกรอบมีการสรุปข้อมูล Roll , Stamp กรอบละ 1 แถว

          trRoll.push([
            {
              text: `Foil หน้าม้วน  ${foilstampSize[0].info.foil_width}" ความยาว ${foilstampSize[0].info.foil_length} ft`,
              alignment: "left",
              colSpan: 3,
            },
            {},
            {},
            {
              text: `สี${foilstampSize[0].info.color_th} ${foilstampSize[0].info.code}`,
              colSpan: 2,
            },
            {},
            ...foilRollColumn,
          ]);

          trStamp.push([
            {
              text: `Foil Stamp`,
              alignment: "left",
              colSpan: 3,
            },
            {},
            {},
            {
              text: " ",
              colSpan: 2,
            },
            {},
            ...foilStampColumn,
          ]);

          rows.push(...trBlock, ...trRoll, ...trStamp);
        }); //* END foilstamp แต่ละกรอบ
      });
      break;
    case "bossing":
      if (subProc == "emboss") {
        var proc_label = "Block Emboss",
          sub_proc_upper = "Emboss";
      } else {
        var proc_label = "Block Deboss",
          sub_proc_upper = "Deboss";
      }

      compArr.forEach((item, index) => {
        const bossing = item?.addon?.filter((addon) => addon.type == subProc);
        bossing?.forEach((addon) => {
          let blockTr = [],
            bossingTr = [];

          //* BLOCK COST
          addon.line?.block?.forEach((block, bIndex) => {
            let blockColumn = [];

            for (let i = startIndex; i <= lastIndex; i++) {
              let line = block?.line[i];

              blockColumn.push(
                {
                  text: numeral(line.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(line.qty).format("0,0"),
                },
                {
                  text: numeral(line.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }

            blockTr.push([
              {
                text: proc_label,
                alignment: "left",
              },
              {
                text: item.component_name,
                colSpan: 2,
              },
              {},
              {
                text: `Area (in²) : ${block.size[0]} x ${block.size[1]}`,
                colSpan: 2,
              },
              {},
              ...blockColumn,
            ]);
          });

          //*LABOR
          let bossingColumn = [];

          for (let i = startIndex; i <= lastIndex; i++) {
            let price = addon.line?.labor[i];
            bossingColumn.push(
              {
                text: numeral(price.unit_price).format("0,0.00000"),
                alignment: "right",
              },
              {
                text: numeral(price.qty).format("0,0"),
              },
              {
                text: numeral(price.price).format("0,0.00"),
                alignment: "right",
              }
            );
          }

          bossingTr.push([
            {
              text: sub_proc_upper,
              alignment: "left",
              colSpan: 3,
            },
            {},
            {},
            {
              text: " ",
              colSpan: 2,
            },
            {},
            ...bossingColumn,
          ]);

          rows.push(...blockTr, ...bossingTr);
        });
      }); //* Component
      break;
    case "diecut":
      var diecutColumn_arr = [],
        blockColumn_arr = [],
        diecutRow_arr = [],
        blockRow_arr = [];
      if (mainData.job.is_reprinted) {
        var block_label = "Block Diecut (Reprint)";
      } else {
        var block_label = "Block Diecut";
      }
      compArr.forEach((item) => {
        item.process.forEach((item1, index1) => {
          if (item1.name == "diecut") {
            var diecutColumn = [],
              blockColumn = [];
            for (let i = startIndex; i <= lastIndex; i++) {
              let item2 = item1.line[i];

              blockColumn.push(
                {
                  text: numeral(item2.block.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(item2.block.qty).format("0,0"),
                },
                {
                  text: numeral(item2.block.price).format("0,0.00"),
                  alignment: "right",
                }
              );

              diecutColumn.push(
                {
                  text: numeral(item2.labor.unit_price).format("0,0.00000"),
                  alignment: "right",
                },
                {
                  text: numeral(item2.labor.qty).format("0,0"),
                },
                {
                  text: numeral(item2.labor.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }

            diecutColumn_arr.push(diecutColumn);
            blockColumn_arr.push(blockColumn);

            if (blockColumn_arr.length == 1) {
              var blockRow = [
                {
                  text: block_label,
                  alignment: "left",
                  colSpan: 3,
                  rowSpan: compArr.length,
                },
                {},
                {},
                {
                  text: item.component_name,
                  colSpan: 2,
                },
                {},
              ];

              var diecutRow = [
                {
                  text: "Diecut",
                  alignment: "left",
                  colSpan: 3,
                  rowSpan: compArr.length,
                },
                {},
                {},
                {
                  text: item.component_name,
                  colSpan: 2,
                },
                {},
              ];
            } else {
              var blockRow = [
                {},
                {},
                {},
                {
                  text: item.component_name,
                  colSpan: 2,
                },
                {},
              ];

              var diecutRow = [
                {},
                {},
                {},
                {
                  text: item.component_name,
                  colSpan: 2,
                },
                {},
              ];
            }
            diecutRow_arr.push(diecutRow);
            blockRow_arr.push(blockRow);
          }
        });
      });

      if (blockColumn_arr.length != 0) {
        blockColumn_arr.forEach((item, index) => {
          rows.push([...blockRow_arr[index], ...item]);
        });
      }
      if (diecutColumn_arr.length != 0) {
        diecutColumn_arr.forEach((item, index) => {
          rows.push([...diecutRow_arr[index], ...item]);
        });
      }
      break;
    case "main_process":
      switch (subProc) {
        case "chip":
          var proc_label = "แกะ";
          break;
        case "inspection":
          var proc_label = "Inspection";
          break;
        case "trim":
          var proc_label = "Trim";
          break;
        case "shrinkwrap":
          var proc_label = "Shrinkwrap";
          break;
      }
      mainData.process.forEach((item) => {
        if (item.name == subProc) {
          var column = [];
          for (let i = startIndex; i <= lastIndex; i++) {
            let item1 = item.line[i];
            column.push(
              {
                text: numeral(item1.unit_price).format("0,0.00"),
                alignment: "right",
              },
              {
                text: numeral(item1.qty).format("0,0"),
              },
              {
                text: numeral(item1.price).format("0,0.00"),
                alignment: "right",
              }
            );
          }

          rows.push([
            {
              text: proc_label,
              alignment: "left",
              colSpan: 5,
            },
            {},
            {},
            {},
            {},
            ...column,
          ]);
        }
      });
      break;
    case "process":
      var tr = "";
      mainData.process.forEach((item, index) => {
        if (subProc == "other") {
          var label = "otherProcess";
        } else if (subProc == "handwork") {
          var label = "handworkProcess";
        } else if (subProc == "custom") {
          var label = "customProcess";
        } else {
          console.log("subProc not match // process");
        }

        if (item.type == subProc) {
          var process_column = [];

          for (let i = startIndex; i <= lastIndex; i++) {
            let item1 = item.line[i];
            process_column.push(
              {
                text: numeral(item1.unit_price).format("0,0.0000"),
                alignment: "right",
              },
              {
                text: numeral(item1.qty).format("0,0"),
              },
              {
                text: numeral(item1.price).format("0,0.00"),
                alignment: "right",
              }
            );
          }

          rows.push([
            {
              text: item.name,
              alignment: "left",
              colSpan: 5,
            },
            {},
            {},
            {},
            {},
            ...process_column,
          ]);
        }
      });
      break;
    case "digital_diecut":
      var digital_diecutColumn_arr = [],
        digital_diecutRow_arr = [];
      var num_trDigital_diecut = 0;
      compArr.forEach((item) => {
        item.process.forEach((item1) => {
          if (item1.name == "digital_diecut") {
            num_trDigital_diecut += 1;
          }
        });
      });
      compArr.forEach((item, index) => {
        item.process.forEach((item1, index1) => {
          if (item1.name == "digital_diecut") {
            var digital_diecutColumn = [];
            for (let i = startIndex; i <= lastIndex; i++) {
              let item2 = item1.line[i];
              digital_diecutColumn.push(
                {
                  text: numeral(item2.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(item2.qty).format("0,0"),
                },
                {
                  text: numeral(item2.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }
            digital_diecutColumn_arr.push(digital_diecutColumn);
            if (digital_diecutColumn_arr.length == 1) {
              var digital_diecut_tr = [
                {
                  text: "Digital Diecut",
                  alignment: "left",
                  colSpan: 1,
                  rowSpan: num_trDigital_diecut,
                },
                {
                  text: item.component_name,
                  alignment: 'center',
                  colSpan: 2,
                },
                {},
                {
                  text: ``,
                  colSpan: 2,
                },
                {},
              ];
            } else {
              var digital_diecut_tr = [
                {},
                {
                  text: ``,
                  colSpan: 2,
                },
                {},
                {
                  text: ``,
                  colSpan: 2,
                },
                {},
              ];
            }
            digital_diecutRow_arr.push(digital_diecut_tr);
          }
        });
      });
      if (digital_diecutColumn_arr.length != 0) {
        digital_diecutColumn_arr.forEach((item, index) => {
          rows.push([...digital_diecutRow_arr[index], ...item]);
        });
      }
      break;
    case "assembly":
      var assemblyColumn_arr = [],
        assemblyRow_arr = [];
      var num_trAssembly = 0;
      compArr.forEach((item) => {
        item.process.forEach((item1) => {
          if (item1.name == "assembly") {
            num_trAssembly += 1;
          }
        });
      });
      compArr.forEach((item, index) => {
        item.process.forEach((item1, index1) => {
          if (item1.name == "assembly") {
            var assemblyColumn = [];
            for (let i = startIndex; i <= lastIndex; i++) {
              let item2 = item1.line[i];
              assemblyColumn.push(
                {
                  text: numeral(item2.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(item2.qty).format("0,0"),
                },
                {
                  text: numeral(item2.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }
            assemblyColumn_arr.push(assemblyColumn);
            if (assemblyColumn_arr.length == 1) {
              var assembly_tr = [
                {
                  text: "Assembly (ประกบ/ติดลิ้นกาว)",
                  alignment: "left",
                  colSpan: 3,
                  rowSpan: num_trAssembly,
                },
                {},
                {},
                {
                  text: `${item.component_name} ติดกาว ${item.box_type.glued_spot} จุด`,
                  colSpan: 2,
                },
                {},
              ];
            } else {
              var assembly_tr = [
                {},
                {},
                {},
                {
                  text: `${item.component_name} ติดกาว ${item.box_type.glued_spot} จุด`,
                  colSpan: 2,
                },
                {},
              ];
            }
            assemblyRow_arr.push(assembly_tr);
          }
        });
      });
      if (assemblyColumn_arr.length != 0) {
        assemblyColumn_arr.forEach((item, index) => {
          rows.push([...assemblyRow_arr[index], ...item]);
        });
      }
      break;
    case "otherCost":
      mainData?.otherCost &&
        mainData?.otherCost?.forEach((item, index) => {
          var otherCost_column = [];

          for (let i = startIndex; i <= lastIndex; i++) {
            let item1 = item.line[i];

            otherCost_column.push(
              {
                text: numeral(item1.unit_price).format("0,0.00"),
                alignment: "right",
              },
              {
                text: numeral(item1.qty).format("0,0.00"),
              },
              {
                text: numeral(item1.price).format("0,0.00"),
                alignment: "right",
              }
            );
          }

          rows.push([
            {
              text: item.name,
              alignment: "left",
              colSpan: 5,
            },
            {},
            {},
            {},
            {},
            ...otherCost_column,
          ]);
        });
      break;
  }

  return rows;
}

function getEditionRowSummary(data = {}, rowName, subProc, startIndex, lastIndex) {
  const mainData = data,
    compArr = data.component1;
  const qtyLength = mainData?.qty?.totalqty || 0;
  var rows = [];

  const printType = mainData.job.print_type;

  switch (rowName) {
    case "paper":
      var paperColumn_arr = [],
        paperRow_arr = [];

      compArr.forEach((comp, compIndex) => {
        const numTrPaper = comp?.f_detail?.f_list?.length || 1;
        let paperColumn = [];
        if (comp.component_type.type != 3) {
          comp?.f_detail?.f_list?.forEach((fInfo, fIndex) => {
            const paper_usage = comp.paper_usage.line[fIndex];

            if (fIndex == 0 && compIndex == 0) {
              var paper_tr = [
                {
                  text: "Paper",
                  rowSpan: numTrPaper,
                  alignment: "left",
                },
                {
                  text: fInfo?.f_code,
                },
                {
                  text: comp.paper.paper_name,
                },
                {
                  text: `${comp.paper.paper_gram} gsm`,
                  colSpan: 2,
                },
                {},
              ];
            } else {
              var paper_tr = [
                {},
                {
                  text: fInfo?.f_code,
                },
                {
                  text: comp.paper.paper_name,
                },
                {
                  text: `${comp.paper.paper_gram} gsm`,
                  colSpan: 2,
                },
                {},
              ];
            }

            paperRow_arr.push(paper_tr);

            paperColumn = [
              {
                text: numeral(paper_usage.price.paper.unit_price).format(
                  "0,0.00"
                ),
                alignment: "right",
              },
              {
                text: numeral(paper_usage.price.paper.qty).format("0,0"),
              },
              {
                text: numeral(paper_usage.price.paper.price).format("0,0.00"),
                alignment: "right",
              },
            ];

            paperColumn_arr.push(paperColumn);
          });
        }
      });

      if (paperColumn_arr.length != 0) {
        paperColumn_arr.forEach((item, index) => {
          rows.push([...paperRow_arr[index], ...item]);
        });
      }
      break;
    case "corrugated":
      compArr.forEach((item, index) => {
        var corrugatedColumn1 = [],
          corrugatedColumn2 = [],
          emptyObj = [];
        if (item.corrugated_layer) {
          const is_price_per_sheet = item.corrugated_layer?.info?.is_price_per_sheet || false

          for (let i = startIndex; i <= lastIndex; i++) {
            let item1 = item.corrugated_layer.price[i];
            corrugatedColumn1.push(
              {
                text: numeral(item1.unit_price).format("0,0.00"),
                alignment: "right",
              },
              {
                text: numeral(item1.qty).format("0,0"),
              },
              {
                text: numeral(item1.price).format("0,0.00"),
                alignment: "right",
              }
            );
            corrugatedColumn2.push(
              {
                text: " ",
                colSpan: 3,
                rowSpan: 3,
              },
              {},
              {}
            );
            emptyObj.push({}, {}, {});
          }

          rows.push(
            [
              {
                text: "Corrugated Board",
                alignment: "left",
              },
              {
                text: item.component_name,
              },
              {
                text: `ลอน ${item.corrugated_layer?.info?.flute_type} ${item.corrugated_layer?.info?.fluteInfo_custom || ''} ${item.corrugated_layer?.info?.num_layer} ชั้น`,
              },
              {
                text: item.corrugated_layer.info.name,
                colSpan: 2,
              },
              {},
              ...corrugatedColumn1,
            ],
            [
              {
                text: "ลอนขนานด้าน x Cut off",
                colSpan: 2,
              },
              {},
              {
                text: "ราคาลูกฟูกต่อแผ่น",
                colSpan: 3,
              },
              {},
              {},
              ...corrugatedColumn2,
            ],
            [
              {
                text: `${item.corrugated_layer.info.flute_side} x ${item.corrugated_layer.info.cut_off}`,
                colSpan: 2,
              },
              {},
              {
                text: numeral(
                  Math.max(...item.corrugated_layer.info.unit_price)
                ).format("0,0.00"),
                colSpan: 3,
              },
              {},
              {},
              ...emptyObj,
            ],
            [
              {
                text: "ราคาทุน",
              },
              {
                text: numeral(
                  Math.max(...item.corrugated_layer.info.cost)
                ).format("0,0.00"),
              },
              {
                text: is_price_per_sheet ? 'B/Sheet' : "B/ตร.ฟุต",
              },
              {
                text: is_price_per_sheet ? '' : numeral(
                  Math.max(...item.corrugated_layer.info.unit_inch)
                ).format("0,0.0000"),
              },
              {
                text: is_price_per_sheet ? '' : "B/ตร.นิ้ว",
              },
              ...emptyObj,
            ]
          );
        }
      });
      break;
    case "special_ink":
      let isFirstSpeink = true;
      compArr.forEach((item, compIndex) => {
        if (![null, undefined].includes(item?.color)) {
          const speInkRow = item?.color?.reduce(
            (total, curr) => (total += curr?.special_ink?.length || 0),
            0
          );

          item?.color?.forEach((color, colorIndex) => {
            const { f_code, special_ink } = color || {};

            special_ink?.forEach((specialInk, specialInkIndex) => {
              var specialInkColumn = [];
              // specialInk?.line?.forEach((line, lineIndex) => {});
              for (let i = startIndex; i <= lastIndex; i++) {
                var line = specialInk?.line[i];
                specialInkColumn.push(
                  {
                    text: numeral(line.unit_price).format("0,0.00"),
                    alignment: "right",
                  },
                  {
                    text: numeral(line.qty).format("0,0"),
                  },
                  {
                    text: numeral(line.price).format("0,0.00"),
                    alignment: "right",
                  }
                );
              }

              if (compIndex == 0 && isFirstSpeink) {
                rows.push([
                  {
                    text: "Special Ink",
                    alignment: "left",
                    rowSpan: speInkRow,
                  },
                  {
                    text: f_code,
                  },
                  {
                    text: `${specialInk.name} : ${specialInk.info.ink_name}`,
                    alignment: "left",
                    colSpan: 3,
                  },
                  {},
                  {},
                  ...specialInkColumn,
                ]);

                isFirstSpeink = false;
              } else {
                rows.push([
                  {},
                  {
                    text: f_code,
                  },
                  {
                    text: `${specialInk.name} : ${specialInk.info.ink_name}`,
                    alignment: "left",
                    colSpan: 3,
                  },
                  {},
                  {},
                  ...specialInkColumn,
                ]);
              }
            });
          });
        }
      });
      break;
    case "component_material":
      mainData.component1.forEach((comp, index) => {
        comp?.process?.filter(obj => obj?.type === 'material')?.forEach((item, index) => {
          var materialColumn = [];
          for (let i = startIndex; i <= lastIndex; i++) {
            let item1 = item.line[i];
            materialColumn.push(
              {
                text: numeral(item1.unit_price).format("0,0.00"),
                alignment: "right",
              },
              {
                text: numeral(item1.qty).format("0,0.00"),
              },
              {
                text: numeral(item1.price).format("0,0.00"),
                alignment: "right",
              }
            );
          }

          rows.push([
            {
              text: item?.info?.component_info?.component_name,
              alignment: "left",
              colSpan: 2,
            },
            {},
            {
              text: item?.info?.process_name,
              alignment: "left",
              colSpan: 3,
            },
            {},
            {},
            ...materialColumn,
          ]);
        })
      });
      break;
    case "material":
      mainData.material.forEach((item, compIndex) => {
        item.line.forEach((item1, fIndex) => {
          var material_column = [];

          for (let i = startIndex; i <= lastIndex; i++) {
            material_column.push(
              {
                text: numeral(item1.unit_price).format("0,0.00"),
                alignment: "right",
              },
              {
                text: numeral(item1.qty).format("0,0.00"),
              },
              {
                text: numeral(item1.price).format("0,0.00"),
                alignment: "right",
              }
            );
          }

          rows.push([
            {
              text: item.name,
              alignment: "left",
              colSpan: 5,
            },
            {},
            {},
            {},
            {},
            ...material_column,
          ]);
        });
      });
      break;
    case "print_plate":

      var proc_label = "",
        color_label = "";

      if (subProc == "plate") {
        if (printType == "Offset") {
          proc_label = "Plate";
          color_label = "cols";
        } else if (printType == "Flexo") {
          proc_label = `Plate Polymer (${mainData.job.flexo_size[0]} x ${mainData.job.flexo_size[1]} in²)`;
          color_label = "cols";
        } else {
          proc_label = "Plate";
          color_label = "cols";
        }
      } else if (subProc == "proof") {
        if (['Jet Press', 'Konica'].includes(printType)) {
          proc_label = "Proof";
          color_label = "cols";
        }
      } else {
        if (printType == "Offset") {
          proc_label = "Print";

          if (mainData.job.ink_type == "UV") {
            color_label = "cols UV";
          } else {
            color_label = "cols";
          }
        } else if (printType == "Flexo") {
          proc_label = "Print Flexo";
          color_label = "cols";
        } else {
          proc_label = "Print";
          color_label = "cols";
        }
      }

      compArr.forEach((comp, compIndex) => {
        const {
          machine,
          f_detail: { f_list },
          paper_usage,
          color,
        } = comp || {};
        var machineName = "",
          proc = "";

        if (printType != "Jet Press") {
          machineName = machine.machine_size.name;
        } else {
          machineName = printType;
        }

        f_list?.forEach((fInfo, fIndex) => {
          const paperUasgeInfo = paper_usage.line[fIndex];
          const fColor =
            color.find((col) => col.f_code === fInfo?.f_code) || {};
          let column_outside = [],
            column_inside = [];

          if (subProc == "plate") {
            proc = paperUasgeInfo.price.plate;
          } else if (subProc == "proof") {
            proc = paperUasgeInfo.price?.proof;
          } else {
            proc = paperUasgeInfo.price.print;
          }

          if (!['Jet Press'].includes(printType) && !(printType == 'Konica' && subProc == 'plate')) {
            //* Offset , Flexo
            if (["plate", "print"].includes(subProc)) {
              for (let i = startIndex; i <= lastIndex; i++) {
                column_outside.push(
                  {
                    text: numeral(proc.outside.unit_price).format("0,0.00"),
                    alignment: "right",
                  },
                  {
                    text: numeral(proc.outside.qty).format("0,0"),
                  },
                  {
                    text: numeral(proc.outside.price).format("0,0.00"),
                    alignment: "right",
                  }
                );

                column_inside.push(
                  {
                    text: numeral(proc.inside.unit_price).format("0,0.00"),
                    alignment: "right",
                  },
                  {
                    text: numeral(proc.inside.qty).format("0,0"),
                  },
                  {
                    text: numeral(proc.inside.price).format("0,0.00"),
                    alignment: "right",
                  }
                );
              }

              if (compIndex == 0 && fIndex == 0) {
                rows.push(
                  [
                    {
                      text: proc_label,
                      alignment: "left",
                      rowSpan: compArr.length * 2 * (f_list.length || 1),
                    },
                    {
                      text: `${fInfo?.f_code} Outside`,
                      alignment: "left",
                    },
                    {
                      text: `${fColor?.outside} ${color_label}`,
                    },
                    {
                      text: machineName,
                      colSpan: 2,
                    },
                    {},
                    ...column_outside,
                  ],
                  [
                    {},
                    {
                      text: `${fInfo?.f_code} Inside`,
                      alignment: "left",
                    },
                    {
                      text: `${fColor?.inside} ${color_label}`,
                    },
                    {
                      text: machineName,
                      colSpan: 2,
                    },
                    {},
                    ...column_inside,
                  ]
                );
              } else {
                rows.push(
                  [
                    {},
                    {
                      text: `${fInfo?.f_code} Outside`,
                      alignment: "left",
                    },
                    {
                      text: `${fColor?.outside} ${color_label}`,
                    },
                    {
                      text: machineName,
                      colSpan: 2,
                    },
                    {},
                    ...column_outside,
                  ],
                  [
                    {},
                    {
                      text: `${fInfo?.f_code} Inside`,
                      alignment: "left",
                    },
                    {
                      text: `${fColor?.inside} ${color_label}`,
                    },
                    {
                      text: machineName,
                      colSpan: 2,
                    },
                    {},
                    ...column_inside,
                  ]
                );
              }
            }
          }

          if (['Jet Press', 'Konica']?.includes(printType) && !(printType == 'Konica' && subProc == 'print')) {
            //* Jet Press, Konica
            if (["proof", "print"].includes(subProc)) {
              let colorLabel = `${fColor?.outside ? 4 : 0}/${fColor?.inside ? 4 : 0
                } ${color_label}`,
                column_all = [];

              for (let i = startIndex; i <= lastIndex; i++) {
                column_all.push(
                  {
                    text: numeral(proc.all.unit_price).format("0,0.00"),
                    alignment: "right",
                  },
                  {
                    text: numeral(proc.all.qty).format("0,0"),
                  },
                  {
                    text: numeral(proc.all.price).format("0,0.00"),
                    alignment: "right",
                  }
                );
              }

              if (compIndex == 0 && fIndex == 0) {
                if (subProc == "proof") {
                  rows.push([
                    {
                      text: proc_label,
                      alignment: "left",
                      rowSpan: compArr.length * 1 * (f_list.length || 1),
                    },
                    {
                      text: fInfo?.f_code,
                      colSpan: 4,
                    },
                    {},
                    {},
                    {},
                    ...column_all,
                  ]);
                } else {
                  rows.push([
                    {
                      text: proc_label,
                      alignment: "left",
                      rowSpan: compArr.length * 1 * (f_list.length || 1),
                    },
                    {
                      text: colorLabel,
                    },
                    {
                      text: fInfo?.f_code,
                      colSpan: 3,
                    },
                    {},
                    {},
                    ...column_all,
                  ]);
                }
              } else {
                if (subProc == "proof") {
                  rows.push([
                    {},
                    {
                      text: fInfo?.f_code,
                      colSpan: 4,
                    },
                    {},
                    {},
                    {},
                    ...column_all,
                  ]);
                } else {
                  rows.push([
                    {},
                    {
                      text: colorLabel,
                    },
                    {
                      text: fInfo?.f_code,
                      colSpan: 3,
                    },
                    {},
                    {},
                    ...column_all,
                  ]);
                }
              }
            }
          }
        });
      });
      break;
    case "reprint_plate":
      if (printType != "Offset") return []

      var proc_label = "",
        color_label = "";

      proc_label = "Plate (สำรอง)";
      color_label = "cols";

      compArr.forEach((comp, compIndex) => {
        const {
          machine,
          f_detail: { f_list },
          paper_usage,
          color,
        } = comp || {};
        var machineName = "",
          proc = "";

        machineName = machine.machine_size.name;

        f_list?.forEach((fInfo, fIndex) => {
          const paperUasgeInfo = paper_usage.line[fIndex];
          const fColor =
            color.find((col) => col.f_code === fInfo?.f_code) || {};
          let column_outside = [],
            column_inside = [];

          proc = paperUasgeInfo.price.plate?.reprint;


          for (let i = startIndex; i <= lastIndex; i++) {
            column_outside.push(
              {
                text: numeral(proc.outside.unit_price).format("0,0.00"),
                alignment: "right",
              },
              {
                text: numeral(proc.outside.qty).format("0,0"),
              },
              {
                text: numeral(proc.outside.price).format("0,0.00"),
                alignment: "right",
              }
            );

            column_inside.push(
              {
                text: numeral(proc.inside.unit_price).format("0,0.00"),
                alignment: "right",
              },
              {
                text: numeral(proc.inside.qty).format("0,0"),
              },
              {
                text: numeral(proc.inside.price).format("0,0.00"),
                alignment: "right",
              }
            );
          }

          if (compIndex == 0 && fIndex == 0) {
            rows.push(
              [
                {
                  text: proc_label,
                  alignment: "left",
                  rowSpan: compArr.length * 2 * (f_list.length || 1),
                },
                {
                  text: `${fInfo?.f_code} Outside`,
                  alignment: "left",
                },
                {
                  text: `${fColor?.outside} ${color_label}`,
                },
                {
                  text: machineName,
                  colSpan: 2,
                },
                {},
                ...column_outside,
              ],
              [
                {},
                {
                  text: `${fInfo?.f_code} Inside`,
                  alignment: "left",
                },
                {
                  text: `${fColor?.inside} ${color_label}`,
                },
                {
                  text: machineName,
                  colSpan: 2,
                },
                {},
                ...column_inside,
              ]
            );
          } else {
            rows.push(
              [
                {},
                {
                  text: `${fInfo?.f_code} Outside`,
                  alignment: "left",
                },
                {
                  text: `${fColor?.outside} ${color_label}`,
                },
                {
                  text: machineName,
                  colSpan: 2,
                },
                {},
                ...column_outside,
              ],
              [
                {},
                {
                  text: `${fInfo?.f_code} Inside`,
                  alignment: "left",
                },
                {
                  text: `${fColor?.inside} ${color_label}`,
                },
                {
                  text: machineName,
                  colSpan: 2,
                },
                {},
                ...column_inside,
              ]
            );
          }
        });
      });
      break;
    case "coating":
      var coatingColumn_arr = [],
        coatingRow_arr = [],
        num_trCoating = 0;
      compArr.forEach((item) => {
        item.addon.forEach((item1) => {
          if (item1.type == "coating") {
            num_trCoating += 1;
          }
        });
      });

      compArr.forEach((item, index) => {
        item.addon.forEach((item1) => {
          var coatingColumn = [],
            coating_option = "",
            compName = "All";

          if (item1.info.name != "Other") {
            coating_option = item1.info.name;
          }

          if (item1.type == "coating") {
            for (let i = startIndex; i <= lastIndex; i++) {
              let item2 = item1.line[i];

              coatingColumn.push(
                {
                  text: numeral(item2.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(item2.qty).format("0,0"),
                },
                {
                  text: numeral(item2.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }

            coatingColumn_arr.push(coatingColumn);

            if (['S-UV', 'S-UV-S'].includes(item1.info.code)) {
              var size_label =
                "(" + item1.info.width + " x " + item1.info.length + " in²)";
            } else if (item1.info?.code == 'P-PAT') {
              var size_label = `(เบอร์ ${item1?.info?.number})`
            } else {
              var size_label = "";
            }

            if (coatingColumn_arr.length == 1) {
              var coating_tr = [
                {
                  text: "Coating",
                  alignment: "left",
                  rowSpan: num_trCoating,
                },
                {
                  text: compName,
                  rowSpan: num_trCoating,
                },
                {
                  text: `${coating_option} ${item1.info.type} ${item1.info.side} s ${size_label}`,
                  alignment: "left",
                  colSpan: 3,
                },
                {},
                {},
              ];
            } else {
              var coating_tr = [
                {},
                {},
                {
                  text: `${coating_option} ${item1.info.type} ${item1.info.side} s ${size_label}`,
                  alignment: "left",
                  colSpan: 3,
                },
                {},
                {},
              ];
            }

            coatingRow_arr.push(coating_tr);
          }
        });
      });

      if (coatingColumn_arr.length != 0) {
        coatingColumn_arr.forEach((item, index) => {
          rows.push([...coatingRow_arr[index], ...item]);
        });
      }

      break;
    case "corrugated_glued":
      var corrugatedGluedColumn_arr = [],
        corrugatedGluedRow_arr = [],
        compName = "All";

      const num_trCorrugatedGlued = compArr?.reduce(
        (total, item) =>
        (total +=
          item.process.filter((obj) => obj.name == "corrugated_glued")
            ?.length || 0),
        0
      );

      compArr.forEach((item, index) => {
        item.process.forEach((item1) => {
          var corrugatedGluedColumn = [];
          if (item1.name == "corrugated_glued") {
            for (let i = startIndex; i <= lastIndex; i++) {
              let item2 = item1.line[i];
              corrugatedGluedColumn.push(
                {
                  text: numeral(item2.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(item2.qty).format("0,0"),
                },
                {
                  text: numeral(item2.price).format("0,0.00"),
                  alignment: "right",
                },
              );
            }

            corrugatedGluedColumn_arr.push(corrugatedGluedColumn);
            if (corrugatedGluedColumn_arr.length == 1) {
              var corrugated_tr = [
                {
                  text: "ทากาวประกบลูกฟูกกับกระดาษ",
                  alignment: "left",
                  colSpan: 2,
                  rowSpan: num_trCorrugatedGlued,
                },
                {},
                {
                  text: compName,
                },
                {
                  text: `${defaultData.corrugated_glued_cost} B/sqinch`,
                  colSpan: 2,
                },
                {},
              ];
            } else {
              var corrugated_tr = [
                {},
                {},
                {
                  text: compName,
                },
                {
                  text: `${defaultData.corrugated_glued_cost} B/sqinch`,
                  colSpan: 2,
                },
                {},
              ];
            }
            corrugatedGluedRow_arr.push(corrugated_tr);
          }
        });
      });

      if (corrugatedGluedColumn_arr.length != 0) {
        corrugatedGluedColumn_arr.forEach((item, index) => {
          rows.push([...corrugatedGluedRow_arr[index], ...item]);
        });
      }

      break;
    case "foilstamp":
      compArr.forEach((component, compIndex) => {
        //* loop components.
        const foilstampAddon = component.addon.filter(
          (obj) => obj.type === "foilstamp"
        );
        const num_process = [];

        foilstampAddon.forEach((addon, index) => {
          const process_index =
            addon?.info?.process_index >= 0
              ? addon?.info?.process_index
              : index;
          if (!num_process.includes(process_index)) {
            num_process.push(process_index);
          }
        });

        //* ได้เลขกรอบทั้งหมดของ foilstamp
        num_process.forEach((process_id) => {
          //* foilstamp แต่ละกรอบ
          let trBlock = [],
            trRoll = [],
            trStamp = [];

          //* หา process_id จาก addon list ที่ตรงกัน
          const foilstampSize = foilstampAddon.filter((addon, a_index) =>
            addon?.info?.process_index >= 0
              ? addon?.info?.process_index === process_id
              : a_index === process_id
          );
          const summary = {
            foilRoll: [],
            foilStamp: [],
          };

          // if(foilstampSize.length > 1){
          for (
            let qtyIndex = 0;
            qtyIndex < mainData.qty.totalqty.length;
            qtyIndex++
          ) {
            summary.foilRoll.push({
              unit_price: 0,
              qty: 0,
              price: 0,
            });
            summary.foilStamp.push({
              unit_price: 0,
              qty: 0,
              price: 0,
            });
          }
          // }

          foilstampSize.forEach((size, sizeIndex) => {
            //* foilstamp size แต่ละกรอบ [x*y , x*y]
            const {
              line,
              info: { f_code },
            } = size || {};

            let blockStampColumn = [];
            const compName = f_code.join(", ");

            for (let i = startIndex; i <= lastIndex; i++) {
              let qtyDetail = line[i];
              const { labor, block, foil_roll } = qtyDetail;
              blockStampColumn.push(
                {
                  text: numeral(block.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(block.qty).format("0,0"),
                },
                {
                  text: numeral(block.price).format("0,0.00"),
                  alignment: "right",
                }
              );

              summary.foilRoll[i].unit_price += foil_roll.unit_price;
              summary.foilRoll[i].qty = foil_roll.qty;
              summary.foilRoll[i].price += foil_roll.qty * foil_roll.unit_price;

              //* คิดค่า stamp ครั้งเดียว
              summary.foilStamp[i].unit_price = labor.unit_price;
              summary.foilStamp[i].qty = labor.qty;
              summary.foilStamp[i].price = labor.price;
            }

            //* แต่ละกรอบมีค่า Block ตามจำนวน size
            trBlock.push([
              {
                text: "Block Foil  Stamp",
                alignment: "left",
              },
              {
                text: compName,
                colSpan: 2,
              },
              {},
              {
                text: `Area (in²) : ${size.info.width} x ${size.info.length}`,
                colSpan: 2,
              },
              {},
              ...blockStampColumn,
            ]);
          });

          //* check min price
          foilstampSize.forEach((size, sizeIndex) => {
            const {
              line,
              info: { foil_roll_min_price = 0 },
            } = size;
            line.forEach((qtyDetail, qtyIndex) => {
              summary.foilRoll[qtyIndex].price =
                summary.foilRoll[qtyIndex].price < foil_roll_min_price
                  ? foil_roll_min_price
                  : summary.foilRoll[qtyIndex].price;
            });
          });

          let foilRollColumn = [],
            foilStampColumn = [];

          for (let i = startIndex; i <= lastIndex; i++) {
            foilRollColumn.push(
              {
                text: numeral(summary.foilRoll[i].unit_price).format(
                  "0,0.0000"
                ),
                alignment: "right",
              },
              {
                text: numeral(summary.foilRoll[i].qty).format("0,0"),
              },
              {
                text: numeral(summary.foilRoll[i].price).format("0,0.00"),
                alignment: "right",
              }
            );

            foilStampColumn.push(
              {
                text: numeral(summary.foilStamp[i].unit_price).format(
                  "0,0.00000"
                ),
                alignment: "right",
              },
              {
                text: numeral(summary.foilStamp[i].qty).format("0,0"),
              },
              {
                text: numeral(summary.foilStamp[i].price).format("0,0.00"),
                alignment: "right",
              }
            );
          }

          //* แต่ละกรอบมีการสรุปข้อมูล Roll , Stamp กรอบละ 1 แถว
          trRoll.push([
            {
              text: `Foil หน้าม้วน  ${foilstampSize[0].info.foil_width}" ความยาว ${foilstampSize[0].info.foil_length} ft`,
              alignment: "left",
              colSpan: 3,
            },
            {},
            {},
            {
              text: `สี${foilstampSize[0].info.color_th} ${foilstampSize[0].info.code}`,
              colSpan: 2,
            },
            {},
            ...foilRollColumn,
          ]);

          trStamp.push([
            {
              text: "Foil Stamp",
              alignment: "left",
              colSpan: 3,
            },
            {},
            {},
            {
              text: " ",
              colSpan: 2,
            },
            {},
            ...foilStampColumn,
          ]);

          rows.push(...trBlock, ...trRoll, ...trStamp);
        }); //* END foilstamp แต่ละกรอบ
      });
      break;
    case "bossing":
      var proc_label = "Block Deboss",
        sub_proc_upper = "Deboss";

      if (subProc == "emboss") {
        proc_label = "Block Emboss";
        sub_proc_upper = "Emboss";
      }

      compArr.forEach((item, index) => {
        const bossing = item?.addon?.filter((addon) => addon.type == subProc);
        bossing?.forEach((addon) => {
          let blockTr = [],
            bossingTr = [];

          //* BLOCK COST
          addon.line?.block?.forEach((block, bIndex) => {
            let blockColumn = [];

            for (let i = startIndex; i <= lastIndex; i++) {
              let line = block?.line[i];

              blockColumn.push(
                {
                  text: numeral(line.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(line.qty).format("0,0"),
                },
                {
                  text: numeral(line.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }

            blockTr.push([
              {
                text: proc_label,
                alignment: "left",
              },
              {
                text: item.component_name,
                colSpan: 2,
              },
              {},
              {
                text: `Area (in²) : ${block.size[0]} x ${block.size[1]}`,
                colSpan: 2,
              },
              {},
              ...blockColumn,
            ]);
          });

          //*LABOR
          let bossingColumn = [];

          for (let i = startIndex; i <= lastIndex; i++) {
            let price = addon.line?.labor[i];
            bossingColumn.push(
              {
                text: numeral(price.unit_price).format("0,0.00000"),
                alignment: "right",
              },
              {
                text: numeral(price.qty).format("0,0"),
              },
              {
                text: numeral(price.price).format("0,0.00"),
                alignment: "right",
              }
            );
          }

          bossingTr.push([
            {
              text: sub_proc_upper,
              alignment: "left",
              colSpan: 3,
            },
            {},
            {},
            {
              text: " ",
              colSpan: 2,
            },
            {},
            ...bossingColumn,
          ]);

          rows.push(...blockTr, ...bossingTr);
        });
      }); //* Component
      break;
    case "diecut":
      var diecutColumn_arr = [],
        blockColumn_arr = [],
        diecutRow_arr = [],
        blockRow_arr = [],
        block_label = "Block Diecut",
        compName = "All";

      if (mainData.job.is_reprinted) {
        block_label = "Block Diecut (Reprint)";
      }

      compArr.forEach((item) => {
        const diecutArr =
          item.process?.filter((obj) => obj.name == "diecut") || [];
        diecutArr.forEach((item1, index1) => {
          var diecutColumn = [],
            blockColumn = [];

          for (let i = startIndex; i <= lastIndex; i++) {
            let item2 = item1.line[i];

            blockColumn.push(
              {
                text: numeral(item2.block.unit_price).format("0,0.00"),
                alignment: "right",
              },
              {
                text: numeral(item2.block.qty).format("0,0"),
              },
              {
                text: numeral(item2.block.price).format("0,0.00"),
                alignment: "right",
              }
            );

            diecutColumn.push(
              {
                text: numeral(item2.labor.unit_price).format("0,0.00000"),
                alignment: "right",
              },
              {
                text: numeral(item2.labor.qty).format("0,0"),
              },
              {
                text: numeral(item2.labor.price).format("0,0.00"),
                alignment: "right",
              }
            );
          }

          diecutColumn_arr.push(diecutColumn);
          blockColumn_arr.push(blockColumn);

          if (blockColumn_arr.length == 1) {
            var blockRow = [
              {
                text: block_label,
                alignment: "left",
                colSpan: 3,
                rowSpan: compArr.length,
              },
              {},
              {},
              {
                text: compName,
                colspan: 2,
              },
              {},
            ];

            var diecutRow = [
              {
                text: "Diecut",
                alignment: "left",
                colSpan: 3,
                rowSpan: compArr.length,
              },
              {},
              {},
              {
                text: compName,
                colspan: 2,
              },
              {},
            ];
          } else {
            var blockRow = [
              {},
              {},
              {},
              {
                text: compName,
                colspan: 2,
              },
              {},
            ];

            var diecutRow = [
              {},
              {},
              {},
              {
                text: compName,
                colspan: 2,
              },
              {},
            ];
          }

          diecutRow_arr.push(diecutRow);
          blockRow_arr.push(blockRow);
        });
      });

      if (blockColumn_arr.length != 0) {
        blockColumn_arr.forEach((item, index) => {
          rows.push([...blockRow_arr[index], ...item]);
        });
      }

      if (diecutColumn_arr.length != 0) {
        diecutColumn_arr.forEach((item, index) => {
          rows.push([...diecutRow_arr[index], ...item]);
        });
      }
      break;
    case "main_process":
      var proc_label = "";

      switch (subProc) {
        case "chip":
          proc_label = "แกะ";
          break;
        case "inspection":
          proc_label = "Inspection";
          break;
        case "trim":
          proc_label = "Trim";
          break;
        case "shrinkwrap":
          proc_label = "Shrinkwrap";
          break;
      }

      mainData.process.forEach((item) => {
        if (item.name == subProc) {
          var columns = [];

          for (let i = startIndex; i <= lastIndex; i++) {
            let item1 = item.line[i];
            columns.push(
              {
                text: numeral(item1.unit_price).format("0,0.00"),
                alignment: "right",
              },
              {
                text: numeral(item1.qty).format("0,0"),
              },
              {
                text: numeral(item1.price).format("0,0.00"),
                alignment: "right",
              }
            );
          }

          rows.push([
            {
              text: proc_label,
              alignment: "left",
              colSpan: 5,
            },
            {},
            {},
            {},
            {},
            ...columns,
          ]);
        }
      });
      break;
    case "process":
      mainData.process.forEach((item, index) => {
        if (subProc == "other") {
          var label = "otherProcess";
        } else if (subProc == "handwork") {
          var label = "handworkProcess";
        } else if (subProc == "custom") {
          var label = "customProcess";
        } else {
          console.log("sub_proc not match // process");
        }

        if (item.type == subProc) {
          item.line.forEach((item1, fIndex) => {
            var process_column = [];

            for (let i = startIndex; i <= lastIndex; i++) {
              process_column.push(
                {
                  text: numeral(item1.unit_price).format("0,0.0000"),
                  alignment: "right",
                },
                {
                  text: numeral(item1.qty).format("0,0"),
                },
                {
                  text: numeral(item1.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }

            rows.push([
              {
                text: item.name,
                alignment: "left",
                colSpan: 5,
              },
              {},
              {},
              {},
              {},
              ...process_column,
            ]);
          });
        }
      });
      break;
    case "assembly":
      var assemblyColumn_arr = [],
        assemblyRow_arr = [],
        compName = "All";
      const num_trAssembly = compArr?.reduce(
        (total, item) =>
        (total +=
          item.process.filter((obj) => obj.name == "assembly")?.length || 0),
        0
      );

      compArr.forEach((item, index) => {
        item.process.forEach((item1, index1) => {
          if (item1.name == "assembly") {
            var assemblyColumn = [];
            for (let i = startIndex; i <= lastIndex; i++) {
              let item2 = item1.line[i];

              assemblyColumn.push(
                {
                  text: numeral(item2.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(item2.qty).format("0,0"),
                },
                {
                  text: numeral(item2.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }
            assemblyColumn_arr.push(assemblyColumn);

            if (assemblyColumn_arr.length == 1) {
              var assembly_tr = [
                {
                  text: "Assembly (ประกบ/ติดลิ้นกาว)",
                  alignment: "left",
                  colSpan: 3,
                  rowSpan: num_trAssembly,
                },
                {},
                {},
                {
                  text: `${compName} ติดกาว ${item.box_type.glued_spot} จุด`,
                  colSpan: 2,
                },
                {},
              ];
            } else {
              var assembly_tr = [
                {},
                {},
                {},
                {
                  text: `${compName} ติดกาว ${item.box_type.glued_spot} จุด`,
                  colSpan: 2,
                },
                {},
              ];
            }
            assemblyRow_arr.push(assembly_tr);
          }
        });
      });

      if (assemblyColumn_arr.length != 0) {
        assemblyColumn_arr.forEach((item, index) => {
          rows.push([...assemblyRow_arr[index], ...item]);
        });
      }
      break;
    case "digital_diecut":
      var digital_diecutColumn_arr = [],
        digital_diecutRow_arr = [],
        compName = "All";
      const num_trDigital_diecut = compArr?.reduce(
        (total, item) =>
        (total +=
          item.process.filter((obj) => obj.name == "digital_diecut")?.length || 0),
        0
      );

      compArr.forEach((item, index) => {

        compName = item.component_name

        item.process.forEach((item1, index1) => {
          if (item1.name == "digital_diecut") {
            var digital_diecutColumn = [];
            for (let i = startIndex; i <= lastIndex; i++) {
              let item2 = item1.line[i];

              digital_diecutColumn.push(
                {
                  text: numeral(item2.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(item2.qty).format("0,0"),
                },
                {
                  text: numeral(item2.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }
            digital_diecutColumn_arr.push(digital_diecutColumn);

            if (digital_diecutColumn_arr.length == 1) {
              var digital_diecut_tr = [
                {
                  text: "Digital Diecut",
                  alignment: "left",
                  colSpan: 1,
                  rowSpan: num_trDigital_diecut,
                },
                {
                  text: compName,
                  alignment: "center",
                  colSpan: 2
                },
                {},
                {
                  text: '',
                  alignment: "center",
                  colSpan: 2
                },
                {},
              ];
            } else {
              var digital_diecut_tr = [
                {},
                {
                  text: '',
                  alignment: "center",
                  colSpan: 2
                },
                {},
                {
                  text: '',
                  alignment: "center",
                  colSpan: 2
                },
                {},
              ];
            }
            digital_diecutRow_arr.push(digital_diecut_tr);
          }
        });
      });

      if (digital_diecutColumn_arr.length != 0) {
        digital_diecutColumn_arr.forEach((item, index) => {
          rows.push([...digital_diecutRow_arr[index], ...item]);
        });
      }
      break;
    case "otherCost":
      mainData?.otherCost &&
        mainData?.otherCost?.forEach((item, index) => {
          item.line.forEach((item1, index1) => {
            var otherCost_column = [];

            for (let i = startIndex; i <= lastIndex; i++) {
              otherCost_column.push(
                {
                  text: numeral(item1.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(item1.qty).format("0,0.00"),
                },
                {
                  text: numeral(item1.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }

            rows.push([
              {
                text: item.name,
                alignment: "left",
                colSpan: 5,
              },
              {},
              {},
              {},
              {},
              ...otherCost_column,
            ]);
          });
        });
      break;
  }
  return rows;
}

function getRowTotal(data = {}, tb_total_row, startIndex, lastIndex) {
  const mainData = data;
  var totalColumn = [],
    row = [],
    totalLabel,
    totalPrice,
    remark = "";

  for (let i = startIndex; i <= lastIndex; i++) {
    let item = mainData.totalprice[i];
    switch (tb_total_row) {
      case "Material":
        totalPrice = item.material;
        totalLabel = "Total (Material)";
        align1 = "right";
        align2 = "left";
        align3 = "";
        break;
      case "Plate":
        totalPrice = item.plate;
        totalLabel = "Total (Plate)";
        align1 = "right";
        align2 = "left";
        align3 = "";
        break;
      case "Proof":
        totalPrice = item?.proof || 0;
        totalLabel = "Total (Proof)";
        align1 = "right";
        align2 = "left";
        align3 = "";
        break;
      case "Print":
        totalPrice = item.print;
        totalLabel = "Total (Print)";
        align1 = "right";
        align2 = "left";
        align3 = "";
        break;
      case "Process":
        totalPrice = item.afterpress;
        totalLabel = "Total (Process)";
        align1 = "right";
        align2 = "left";
        align3 = "";
        break;
      case "Other":
        totalPrice = item.other;
        totalLabel = "Total (Other)";
        align1 = "right";
        align2 = "left";
        align3 = "";
        break;
      case "Packing":
        totalPrice = item.delivery;
        totalLabel = "Total (Packing)";
        align1 = "right";
        align2 = "left";
        align3 = "";
        break;
      case "MarkUp":
        totalPrice = item?.mark_up_price || 0;
        totalLabel = "Mark up";
        align1 = "right";
        align2 = "left";
        align3 = "center";
        break;
      case "MarkDown":
        totalPrice = item?.mark_down_price || 0;
        totalLabel = "Mark down";
        align1 = "right";
        align2 = "left";
        align3 = "center";
        break;
      case 'MarkingPercentMaterial':
        totalPrice = item?.total_marking_material || 0
        totalLabel = ''
        align1 = "center"
        align2 = "center"
        align3 = ""
        break
      case 'MarkingPercentProduction':
        totalPrice = item?.total_marking_production || 0
        totalLabel = ''
        align1 = "center"
        align2 = "center"
        align3 = ""
        break
      case 'SubtotalPriceMaterial':
        totalPrice = item?.sub_total_price_material_marking
        totalLabel = 'Subtotal Price (Materials)'
        align1 = "center"
        align2 = "center"
        align3 = ""
        break
      case 'SubtotalPriceProduction':
        totalPrice = item?.sub_total_price_production_marking
        totalLabel = 'Subtotal Price (Production)'
        align1 = "center"
        align2 = "center"
        align3 = ""
        break
      case "Price":
        totalPrice = item.total_price;
        totalLabel = "Subtotal Price";
        align1 = "center";
        align2 = "center";
        align3 = "";
        break;
      case "Gift":
        totalPrice = item?.customer_gift;
        remark = mainData?.customer_gift?.length
          ? mainData?.customer_gift[i]
          : "";
        totalLabel = "ค่าของขวัญลูกค้า";
        align1 = "center";
        align2 = "center";
        align3 = "";
        break;
      case "CustomerPriceDiff":
        totalPrice = item?.price_diff;
        remark = mainData?.priceDiff?.length ? mainData?.priceDiff[i] : "";
        totalLabel = "ส่วนต่างลูกค้า";
        align1 = "center";
        align2 = "center";
        align3 = "";
        break;
      case "DiffPrice":
        totalPrice = item?.total_with_price_diff;
        remark = ``;
        totalLabel = "Subtotal Price + ค่าของขวัญลูกค้า + ส่วนต่างลูกค้า";
        align1 = "center";
        align2 = "center";
        align3 = "";
        break;
      case "Tax":
        totalPrice = item.tax;
        totalLabel = "Tax " + mainData.tax + " %";
        align1 = "center";
        align2 = "center";
        align3 = "";
        break;
      case "ProfitSharing":
        totalPrice = item?.profit_sharing || 0;
        totalLabel = "Profit Sharing";
        align1 = "center";
        align2 = "center";
        align3 = "";
        break;
      case "FinalPrice":
        totalPrice = item.final_price;
        totalLabel = "Total Price";
        align1 = "center";
        align2 = "center";
        align3 = "";
        break;
      case "UnitPrice":
        totalPrice = item.unit_price;
        totalLabel = "Unit Price/cps";
        align1 = "center";
        align2 = "center";
        align3 = "";
        break;
      case 'UnitPriceExchange':
        totalPrice = item?.unit_price_exchange || item?.unit_price
        total_label = 'Unit Price ( Exchange )'
        align_class1 = "alCenter"
        align_class2 = "alCenter"
        align_class3 = ""
        break
      case 'Exchange':
        totalPrice = item?.exchange_rate || 1
        total_label = 'Exchange Rate'
        align_class1 = "alCenter"
        align_class2 = "alCenter"
        align_class3 = ""
        break
    }

    if (["MarkUp", "MarkDown"].includes(tb_total_row)) {
      const markingPercent =
        tb_total_row === "MarkDown"
          ? item["mark_down_percent"] || Math.abs(item["marking_percent"]) || 0
          : item["mark_up_percent"] || 0;

      totalColumn.push(
        {
          text: `${markingPercent} %`,
          alignment: align3,
          bold: true,
          colSpan: 2,
        },
        {},
        {
          text: numeral(totalPrice).format("0,0.00"),
          alignment: align1,
          bold: true,
        }
      );
    } else if (['MarkingPercentMaterial', 'MarkingPercentProduction'].includes(tb_total_row)) {
      const markingPercent = tb_total_row == 'MarkingPercentMaterial' ? item['marking_material_percent'] : item['marking_production_percent']

      totalColumn.push(
        {
          text: `${markingPercent} %`,
          alignment: align1,
          bold: true,
          colSpan: 2,
        },
        {},
        {
          text: numeral(totalPrice).format("0,0.00"),
          bold: true,
          alignment: align1,
        }
      );
    }
    else if (tb_total_row == 'SubtotalPriceMaterial') {
      let displayUnitPriceMaterial = !item?.marking_material_percent ?
        item?.unit_price_material ? `@${item?.unit_price_material}` : ''
        : `@${item?.unit_price_material} -> @${item?.unit_price_material_marking}`

      totalColumn.push(
        {
          text: `${displayUnitPriceMaterial}`,
          alignment: align1,
          bold: true,
          colSpan: 2,
        },
        {},
        {
          text: numeral(item?.sub_total_price_material_marking).format("0,0.00"),
          bold: true,
          alignment: align1,
        }
      );
    }
    else if (tb_total_row == 'SubtotalPriceProduction') {
      let displayUnitPriceProduction = !item?.marking_production_percent ?
        item?.unit_price_production ? `@${item?.unit_price_production}` : ''
        : `@${item?.unit_price_production} -> @${item?.unit_price_production_marking}`

      totalColumn.push(
        {
          text: `${displayUnitPriceProduction}`,
          alignment: align1,
          bold: true,
          colSpan: 2,
        },
        {},
        {
          text: numeral(item?.sub_total_price_production_marking).format("0,0.00"),
          bold: true,
          alignment: align1,
        }
      );
    }
    else if (tb_total_row == 'Exchange') {
      totalColumn.push(
        {
          text: '',
          alignment: align3,
          bold: true,
          colSpan: 2
        },
        {},
        {}
      );
    } else if (tb_total_row == 'UnitPriceExchange') {
      totalColumn.push(
        {
          text: remark,
          alignment: align1,
          bold: true,
          colSpan: 2,
        },
        {},
        {
          text: numeral(totalPrice).format("0,0.0000"),
          bold: true,
          alignment: align1,
        }
      );
    } else {
      totalColumn.push(
        {
          text: remark,
          alignment: align1,
          bold: true,
          colSpan: 2,
        },
        {},
        {
          text: numeral(totalPrice).format("0,0.00"),
          bold: true,
          alignment: align1,
        }
      );
    }
  }

  if (tb_total_row == "Tax") {
    row = [
      {
        text: `Tax ${mainData.tax} %`,
        alignment: align2,
        bold: true,
        colSpan: 5,
      },
      {},
      {},
      {},
      {},
      ...totalColumn,
    ];
  }

  else if (tb_total_row == "Exchange") {
    row = [
      {
        text: `Exchange Rate`,
        alignment: align2,
        bold: true,
        colSpan: 3,
      },
      {},
      {},
      {
        text: mainData?.currency_no || 'THB',
        alignment: align2,
        bold: true,
      },
      {
        text: mainData?.exchange_rate || 1,
        alignment: align2,
        bold: true,
      },
      ...totalColumn,
    ];
  }
  else if (tb_total_row == "UnitPriceExchange") {
    row = [
      {
        text: `Unit Price ( Exchange)`,
        alignment: align2,
        bold: true,
        colSpan: 4,
      },
      {},
      {},
      {},
      {
        text: mainData?.currency_no || 'THB',
        alignment: align2,
        bold: true,
      },
      ...totalColumn,
    ];
  } else if (tb_total_row == 'MarkingPercentMaterial') {
    row = [
      {
        text: `Marking Up/Down`,
        alignment: align2,
        bold: true,
        colSpan: 3,
      },
      {},
      {},
      {
        text: 'Materials',
        alignment: align2,
        bold: true,
        colSpan: 2
      },
      {},
      ...totalColumn,
    ];
  } else if (tb_total_row == 'MarkingPercentProduction') {
    row = [
      {
        text: `Marking Up/Down`,
        alignment: align2,
        bold: true,
        colSpan: 3,
      },
      {},
      {},
      {
        text: 'Production',
        alignment: align2,
        bold: true,
        colSpan: 2
      },
      {},
      ...totalColumn,
    ];
  } else {
    row = [
      {
        text: totalLabel,
        alignment: align2,
        bold: true,
        colSpan: 5,
      },
      {},
      {},
      {},
      {},
      ...totalColumn,
    ];
  }

  return [row];
}

function getRowSummaryTotal(data = {}, rowName, subProc, startIndex, lastIndex) {
  var rows = []
  switch (rowName) {
    case "material":
      rows.push(
        ...getRowSummary(data, "material", "", startIndex, lastIndex),
        ...getRowTotal(data, "Material", startIndex, lastIndex),
      )
      break
    case "print_plate":
      if (subProc == "plate") {
        const plate = getRowSummary(data, "print_plate", "plate", startIndex, lastIndex)
        const reprint_plate = getRowSummary(data, "print_plate", "reprint_plate", startIndex, lastIndex)

        console.log("plate", plate, reprint_plate)

        if (plate?.length) {
          rows.push(...plate)
        }

        if (reprint_plate?.length) {
          rows.push(...reprint_plate)
        }

        rows.push(
          ...getRowTotal(data, "Plate", startIndex, lastIndex)
        )
      } else if (subProc == "proof") {
        const proof = getRowSummary(data, "print_plate", "proof", startIndex, lastIndex)
        console.log("proof", proof)
        rows.push(
          ...proof,
          ...getRowTotal(data, "Proof", startIndex, lastIndex)
        )
      } else if (subProc == "print") {
        rows.push(
          ...getRowSummary(data, "print_plate", "print", startIndex, lastIndex),
          ...getRowTotal(data, "Print", startIndex, lastIndex)
        )
      }
      break
    // case "reprint_plate":
    //   if (subProc == "reprint_plate") {
    //     rows.push(
    //       ...getRowSummary(data, "reprint_plate", "reprint_plate", startIndex, lastIndex),
    //     )
    //   }
    //   break
  }

  return rows
}

function getRowWeight(data = {}, is_forDisplay = false) {
  const {
    job: {
      is_different_packing: isDiffPacking = false,
      is_multiple_f: isMultipleF = false,
    },
    component1: compArr,
  } = data || {};

  var weightRows = [];

  compArr.forEach((comp, index) => {
    let summaryLength =
      isMultipleF && isDiffPacking ? comp?.f_detail?.f_list?.length : 1;
    let compName = comp.component_name;

    for (let fIndex = 0; fIndex < summaryLength; fIndex++) {
      let bulk, bulk_name, bulk_unit, kraftwrap_item, carton_item, pallet_item;

      const pallet = this.getPackingObj(comp, "pallet", fIndex);
      const unit = this.getUnitPacking(index, is_forDisplay, fIndex);
      const deliveryInfo = comp?.delivery[fIndex];
      let pallet_size = "-",
        layer = "-",
        qty_layer = "-";

      if (isMultipleF) {
        compName =
          summaryLength == 1
            ? "All"
            : comp?.f_detail?.f_list[fIndex]?.f_code || "Error";
      }

      if (pallet != null) {
        pallet_size =
          pallet.info.pallet_size[0] +
          '" x ' +
          pallet.info.pallet_size[1] +
          '" x ' +
          pallet.info.pallet_size[2] +
          '"';
        layer = pallet.info.layer_per_pallet;
        qty_layer = pallet.info.laying.qty_layer;
      }

      comp.packing[fIndex].forEach((packing) => {
        if (packing.name == "kraftwrap") {
          kraftwrap_item = packing;
        }
        if (packing.name == "carton") {
          carton_item = packing;
        }
        if (packing.name == "pallet") {
          pallet_item = packing;
        }
      });

      switch (unit) {
        case "piece":
          bulk_name = "Pallet size";
          bulk = [
            pallet_item.info.laying.cube_size[0],
            pallet_item.info.laying.cube_size[1],
            pallet_item.info.pallet_height,
          ];
          bulk_unit = "pcs";
          break;
        case "kraftwrap":
          bulk_name = "Kraftwrap size";
          bulk = kraftwrap_item.info.inner_size;
          bulk_unit = "kraftwrap";
          break;
        case "carton":
          bulk_name = "Carton size";
          bulk = carton_item.info.size.inner_size;
          bulk_unit = "carton";
          break;
      }

      weightRows.push(
        [
          {
            text: compName,
            bold: true,
            rowSpan: 4,
          },
          {
            text: "Weight",
            bold: true,
          },
          {
            text: comp.weight.weight,
            bold: true,
          },
          {
            text: "kg/1 cp.",
            bold: true,
          },
          {
            text: bulk_name,
            bold: true,
          },
          {
            text: "กว้าง",
            bold: true,
          },
          {
            text: "ยาว",
            bold: true,
          },
          {
            text: "สูง",
            bold: true,
          },
          {
            text: " ",
          },
        ],
        [
          {},
          {
            text: "Thickness",
            bold: true,
          },
          {
            text: comp.thickness.inch.packing_thickness,
            bold: true,
          },
          {
            text: "inch",
            bold: true,
          },
          {
            text: "Inner size (inch)",
            bold: true,
          },
          {
            text: numeral(bulk[0]).format("0,0.00"),
            bold: true,
          },
          {
            text: numeral(bulk[1]).format("0,0.00"),
            bold: true,
          },
          {
            text: numeral(bulk[2]).format("0,0.00"),
            bold: true,
          },
          {
            text: " ",
          },
        ],
        [
          {},
          {
            text: "Pallet size",
            bold: true,
          },
          {
            text: pallet_size,
            bold: true,
            colSpan: 4,
          },
          {},
          {},
          {},
          {
            text: "Net weight",
            bold: true,
          },
          {
            text: numeral(deliveryInfo.net_weight).format("0,0.00"),
            bold: true,
          },
          {
            text: "kg/pack",
            bold: true,
          },
        ],
        [
          {},
          {
            text: "วางสูง",
            bold: true,
          },
          {
            text: layer,
            bold: true,
          },
          {
            text: "ชั้นๆ ละ",
            bold: true,
          },
          {
            text: qty_layer,
            bold: true,
          },
          {
            text: bulk_unit,
            bold: true,
          },
          {
            text: "Gross weight",
            bold: true,
          },
          {
            text: numeral(deliveryInfo.gross_weight).format("0,0.00"),
            bold: true,
          },
          {
            text: "kg/pack",
            bold: true,
          },
        ]
      );
    }
  });

  return weightRows;
}

function getPackingObj(item, packing_type, fIndex = 0) {
  const packing = item.packing[fIndex].filter((item1) => {
    return item1.name == packing_type;
  });
  if (packing.length == 0) {
    return null;
  } else {
    return packing[0];
  }
}

function getUnitPacking(index, is_forDisplay, fIndex = 0) {
  if (is_forDisplay) {
    const item = est.mainData.component1[index];
    var carton_obj = est.getPackingObj(item, "carton", fIndex);
    if (carton_obj != null) {
      var carton = true;
    } else {
      var carton = false;
    }

    var kraftwrap_obj = est.getPackingObj(item, "kraftwrap", fIndex);
    if (kraftwrap_obj != null) {
      var kraftwrap = true;
    } else {
      var kraftwrap = false;
    }

    var pallet_obj = est.getPackingObj(item, "pallet", fIndex);
    if (pallet_obj != null) {
      var pallet = true;
    } else {
      var pallet = false;
    }
  } else {
    var carton = $(`.carton[index=${index}][fIndex=${fIndex}] input`).prop(
      "checked"
    );
    var kraftwrap = $(
      `.kraftwrap[index=${index}][fIndex=${fIndex}] input`
    ).prop("checked");
    var pallet = $(`.pallet[index=${index}][fIndex=${fIndex}] input`).prop(
      "checked"
    );
  }

  if (kraftwrap == false && carton == false && pallet == true) {
    var unit = "piece";
  } else if (kraftwrap == true && carton == false) {
    var unit = "kraftwrap";
  } else if (carton == true) {
    var unit = "carton";
  } else {
    var unit = "kraftwrap";
  }
  return unit;
}

function checkDelivery(estData = {}) {
  const check_has_delivery =
    estData.component1?.every((comp) =>
      comp.packing?.every((packing) => {
        return packing.every((obj) => obj?.detail?.length > 0);
      })
    ) || false;

  return check_has_delivery;
}

function getNormalPackingTR(data = {}, startIndex, lastIndex) {
  const compArr = data?.component1 || [];

  var num_trPaperband = 0,
    num_trKraftwrap = 0,
    num_trCarton = 0,
    num_trPallet = 0,
    num_trDelivery = 0,
    check_packing = [];

  // * count type of packaging
  compArr.forEach((item, index) => {
    check_packing.push({
      kraftwrap: false,
      carton: false,
    });

    item.packing[0].forEach((item1) => {
      if (item1.name == "paperband") {
        num_trPaperband += 1;
      }
      if (item1.name == "kraftwrap") {
        num_trKraftwrap += 1;
        check_packing[index].kraftwrap = true;
      }
      if (item1.name == "carton") {
        num_trCarton += 1;
        check_packing[index].carton = true;
      }
      if (item1.name == "pallet") {
        num_trPallet += 1;
      }
    });
    if (
      check_packing[index].kraftwrap == false &&
      check_packing[index].carton == false
    ) {
      check_packing[index].unit_pallet = "Cps/Pallet";
    } else if (
      check_packing[index].kraftwrap == true &&
      check_packing[index].carton == false
    ) {
      check_packing[index].unit_pallet = "Pack/Pallet";
    } else if (check_packing[index].carton == true) {
      check_packing[index].unit_pallet = "Carton/Pallet";
    }
    if (item.delivery?.length > 0) {
      num_trDelivery += item.delivery?.length || 1;
    }
  });

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
    packing_obj = {};

  //* Loop components
  compArr.forEach((item, index) => {
    var paperbandColumn = [],
      kraftwrapColumn = [],
      cartonColumn = [],
      palletColumn = [],
      deliveryColumn = [];

    item.packing[0].forEach((item1) => {
      if (item1.name == "paperband") {
        for (let i = startIndex; i <= lastIndex; i++) {
          let item2 = item1.line[i];

          paperbandColumn.push(
            {
              text: numeral(item2.unit_price).format("0,0.00"),
              alignment: "right",
            },
            {
              text: numeral(item2.qty).format("0,0.00"),
            },
            {
              text: numeral(item2.price).format("0,0.00"),
              lignment: "right",
            }
          );
        }

        paperbandColumn_arr.push(paperbandColumn);
        if (paperbandColumn_arr.length == 1) {
          var paperband_tr = [
            {
              text: "Paper Band",
              alignment: "left",
              colSpan: 2,
              rowSpan: num_trPaperband,
            },
            {},
            {
              text: item.component_name,
            },
            {
              text: item1.info.qty_per_paperband,
            },
            {
              text: "Cps/band",
            },
          ];
        } else {
          var paperband_tr = [
            {},
            {},
            {
              text: item.component_name,
            },
            {
              text: item1.info.qty_per_paperband,
            },
            {
              text: "Cps/band",
            },
          ];
        }
        paperbandRow_arr.push(paperband_tr);
      }
      if (item1.name == "kraftwrap") {
        for (let i = startIndex; i <= lastIndex; i++) {
          let item2 = item1.line[i];

          kraftwrapColumn.push(
            {
              text: numeral(item2.unit_price).format("0,0.00"),
              alignment: "right",
            },
            {
              text: numeral(item2.qty).format("0,0.00"),
            },
            {
              text: numeral(item2.price).format("0,0.00"),
              lignment: "right",
            }
          );
        }

        kraftwrapColumn_arr.push(kraftwrapColumn);
        if (kraftwrapColumn_arr.length == 1) {
          var kraftwrap_tr = [
            {
              text: "Kraftwrap",
              alignment: "left",
              colSpan: 2,
              rowSpan: num_trKraftwrap,
            },
            {},
            {
              text: item.component_name,
            },
            {
              text: numeral(item1.info.qty_per_pack).format("0,0"),
            },
            {
              text: "Cps/pack",
            },
          ];
        } else {
          var kraftwrap_tr = [
            {},
            {},
            {
              text: item.component_name,
            },
            {
              text: numeral(item1.info.qty_per_pack).format("0,0"),
            },
            {
              text: "Cps/pack",
            },
          ];
        }
        kraftwrapRow_arr.push(kraftwrap_tr);
      }
      if (item1.name == "carton") {
        for (let i = startIndex; i <= lastIndex; i++) {
          let item2 = item1.line[i];

          cartonColumn.push(
            {
              text: numeral(item2.unit_price).format("0,0.00"),
              alignment: "right",
            },
            {
              text: numeral(item2.qty).format("0,0.00"),
            },
            {
              text: numeral(item2.price).format("0,0.00"),
              lignment: "right",
            }
          );
        }

        cartonColumn_arr.push(cartonColumn);
        if (cartonColumn_arr.length == 1) {
          var carton_tr = [
            {
              text: "Carton",
              alignment: "left",
              colSpan: 2,
              rowSpan: num_trCarton,
            },
            {},
            {
              text: item.component_name,
            },
            {
              text: numeral(item1.info.carton.qty_per_carton).format("0,0"),
            },
            {
              text: "Cps/carton",
            },
          ];
        } else {
          var carton_tr = [
            {},
            {},
            {
              text: item.component_name,
            },
            {
              text: numeral(item1.info.carton.qty_per_carton).format("0,0"),
            },
            {
              text: "Cps/carton",
            },
          ];
        }
        cartonRow_arr.push(carton_tr);
      }
      if (item1.name == "pallet") {
        for (let i = startIndex; i <= lastIndex; i++) {
          let item2 = item1.line[i];

          cartonColumn.push(
            {
              text: numeral(item2.unit_price).format("0,0.00"),
              alignment: "right",
            },
            {
              text: numeral(item2.qty).format("0,0.00"),
            },
            {
              text: numeral(item2.price).format("0,0.00"),
              lignment: "right",
            }
          );
        }

        palletColumn_arr.push(palletColumn);
        if (palletColumn_arr.length == 1) {
          var pallet_tr = [
            {
              text: "Pallet",
              alignment: "left",
              colSpan: 2,
              rowSpan: num_trPallet,
            },
            {},
            {
              text: item.component_name,
            },
            {
              text: numeral(item1.info.bulk_qty_pallet).format("0,0"),
            },
            {
              text: check_packing[index].unit_pallet,
            },
          ];
        } else {
          var pallet_tr = [
            {},
            {},
            {
              text: item.component_name,
            },
            {
              text: numeral(item1.info.bulk_qty_pallet).format("0,0"),
            },
            {
              text: check_packing[index].unit_pallet,
            },
          ];
        }
        palletRow_arr.push(pallet_tr);
      }
    });

    if (item.delivery?.length > 0) {
      for (let i = startIndex; i <= lastIndex; i++) {
        let item1 = item.delivery[0].price[i];

        deliveryColumn.push(
          {
            text: numeral(item1.unit_price).format("0,0.00"),
            alignment: "right",
          },
          {
            text: numeral(item1.qty).format("0,0.00"),
          },
          {
            text: numeral(item1.price).format("0,0.00"),
            alignment: "right",
          }
        );
      }

      deliveryColumn_arr.push(deliveryColumn);

      if (deliveryColumn_arr.length == 1) {
        var delivery_tr = [
          {
            text: "Delivery",
            alignment: "left",
            colSpan: 3,
            rowSpan: num_trDelivery,
          },
          {},
          {},
          {
            text: item.component_name,
            colSpan: 2,
          },
          {},
        ];
      } else {
        var delivery_tr = [
          {},
          {},
          {},
          {
            text: item.component_name,
            colSpan: 2,
          },
          {},
        ];
      }

      deliveryRow_arr.push(delivery_tr);
    }

    packing_obj = {
      paperband_tr: [],
      kraftwrap_tr: [],
      carton_tr: [],
      pallet_tr: [],
      delivery_tr: [],
    };

    if (paperbandColumn_arr.length != 0) {
      paperbandColumn_arr.forEach((item, index) => {
        packing_obj.paperband_tr.push([...paperbandRow_arr[index], ...item]);
      });
    }
    if (kraftwrapColumn_arr.length != 0) {
      kraftwrapColumn_arr.forEach((item, index) => {
        packing_obj.kraftwrap_tr.push([...kraftwrapRow_arr[index], ...item]);
      });
    }
    if (cartonColumn_arr.length != 0) {
      cartonColumn_arr.forEach((item, index) => {
        packing_obj.carton_tr.push([...cartonRow_arr[index], ...item]);
      });
    }
    if (palletColumn_arr.length != 0) {
      palletColumn_arr.forEach((item, index) => {
        packing_obj.pallet_tr.push([...palletRow_arr[index], ...item]);
      });
    }
    if (deliveryColumn_arr.length != 0) {
      deliveryColumn_arr.forEach((item, index) => {
        packing_obj.delivery_tr.push([...deliveryRow_arr[index], ...item]);
      });
    }
  });

  return packing_obj;
}

function getDeliveryPackingTR(data = {}, startIndex, lastIndex, isMultipleF = false) {
  const { is_different_packing = false } = data?.job || {};
  const compArr = data?.component1;
  const delivery = data?.delivery || [];

  var num_trPaperband = 0,
    num_trKraftwrap = 0,
    num_trCarton = 0,
    num_trPallet = 0,
    num_trDelivery = 0,
    check_packing = [];

  // * count type of packaging
  compArr.forEach((item, index) => {
    const packingLength = is_different_packing
      ? item?.f_detail?.f_list?.length
      : 1;
    for (let fIndex = 0; fIndex < packingLength; fIndex++) {
      check_packing.push([]);

      const check_has_delivery = item.packing[fIndex].every(
        (obj) => obj?.detail?.length > 0
      );

      check_packing[fIndex].push({
        kraftwrap: false,
        carton: false,
      });

      item.packing[fIndex].forEach((item1) => {
        if (item1.name == "paperband") {
          num_trPaperband += 1;
          check_packing[fIndex][index].paperband = true;
        }
        if (item1.name == "kraftwrap") {
          num_trKraftwrap += 1;
          check_packing[fIndex][index].kraftwrap = true;
        }
        if (item1.name == "carton") {
          num_trCarton += 1;
          check_packing[fIndex][index].carton = true;
        }
        if (item1.name == "pallet") {
          num_trPallet += 1;
        }
      });
      // * + row span split delivery
      // * check delivery
      if (check_has_delivery) {
        item.packing[fIndex].forEach((packing) => {
          if (packing.name === "kraftwrap") {
            num_trKraftwrap += packing.detail?.length - 1;
          } else if (packing.name === "carton") {
            num_trCarton += packing.detail?.length - 1;
          } else if (packing.name === "pallet") {
            num_trPallet += packing.detail?.length - 1;
          } else if (packing.name === "paperband") {
            num_trPaperband += packing.detail?.length - 1;
          }
        });
      }

      if (
        check_packing[fIndex][index].kraftwrap == false &&
        check_packing[fIndex][index].carton == false
      ) {
        check_packing[fIndex][index].unit_pallet = "Cps/Pallet";
      } else if (
        check_packing[fIndex][index].kraftwrap == true &&
        check_packing[fIndex][index].carton == false
      ) {
        check_packing[fIndex][index].unit_pallet = "Pack/Pallet";
      } else if (check_packing[fIndex][index].carton == true) {
        check_packing[fIndex][index].unit_pallet = "Carton/Pallet";
      }
    }
  });

  // * หาจำนวนรวมของเรทส่งส่งทุกรอบ
  /*
  delivery.length = รอบส่ง
  */

  var paperbandRow_arr = [],
    kraftwrapRow_arr = [],
    cartonRow_arr = [],
    palletRow_arr = [],
    packing_obj = {};

  //* Loop components
  let checkFirst = {
    paperband: 0,
    kraftwrap: 0,
    carton: 0,
    pallet: 0,
  };

  compArr.forEach((item, compIndex) => {
    const packingLength = is_different_packing
      ? item?.f_detail?.f_list?.length
      : 1;
    var paperbandCompTr = [],
      kraftwrapCompTr = [],
      cartonCompTr = [],
      palletCompTr = [];

    for (let fIndex = 0; fIndex < packingLength; fIndex++) {
      let compName = item.component_name;

      if (isMultipleF) {
        compName =
          packingLength == 1
            ? "All"
            : item?.f_detail?.f_list[fIndex]?.f_code || "Error";
      }

      item.packing[fIndex].forEach((item1) => {
        let newTr;

        if (item1.name == "paperband") {
          // * loop by delivery round.
          newTr = item1.detail.map((roundDetail, roundIndex) => {
            // * draw <td></td> by number of qty.
            var paperbandColumn = [];
            for (let i = startIndex; i <= lastIndex; i++) {
              let qtyDetail = roundDetail.detail[i];
              paperbandColumn.push(
                {
                  text: numeral(qtyDetail.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(qtyDetail.qty).format("0,0.00"),
                },
                {
                  text: numeral(qtyDetail.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }

            // * draw <tr></tr> by number of round of delivery
            let paperband_tr = [];
            if (checkFirst.paperband === 0 && roundIndex === 0) {
              //* Title of summary table tr โชว์ หัวข้อ paperband ให้แสดงชื่อ Comp. และ qty_per_paperband
              paperband_tr.push(
                {
                  text: "Paperband",
                  alignment: "left",
                  colSpan: 2,
                  rowSpan: num_trPaperband,
                },
                {},
                {
                  text: compName,
                  rowSpan: item1.detail.length,
                },
                {
                  text: numeral(item1.info.qty_per_paperband).format("0,0"),
                  rowSpan: item1.detail.length,
                },
                {
                  text: "Cps/band",
                  rowSpan: item1.detail.length,
                },
                ...paperbandColumn
              );
            } else {
              if (roundIndex === 0) {
                // * รอบแรกของแต่ละ Comp. ให้แสดงชื่อ Comp. และ qty_per_paperband
                paperband_tr.push(
                  {},
                  {},
                  {
                    text: compName,
                    rowSpan: item1.detail.length,
                  },
                  {
                    text: numeral(item1.info.qty_per_paperband).format("0,0"),
                    rowSpan: item1.detail.length,
                  },
                  {
                    text: "Cps/band",
                    rowSpan: item1.detail.length,
                  },
                  ...paperbandColumn
                );
              } else {
                paperband_tr.push({}, {}, {}, {}, {}, ...paperbandColumn);
              }
            }
            checkFirst.paperband += 1;
            return paperband_tr;
          });
          paperbandCompTr = [...paperbandCompTr, ...newTr];
        }

        if (item1.name == "kraftwrap") {
          // * loop by delivery round.
          newTr = item1.detail.map((roundDetail, roundIndex) => {
            // * draw <td></td> by number of qty.
            var kraftwrapColumn = [];
            for (let i = startIndex; i <= lastIndex; i++) {
              let qtyDetail = roundDetail.detail[i];
              kraftwrapColumn.push(
                {
                  text: numeral(qtyDetail.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(qtyDetail.qty).format("0,0.00"),
                },
                {
                  text: numeral(qtyDetail.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }

            // * draw <tr></tr> by number of round of delivery
            let kraftwrap_tr = [];
            if (checkFirst.kraftwrap === 0 && roundIndex === 0) {
              //* Title of summary table tr โชว์ หัวข้อ Kraftwrap ให้แสดงชื่อ Comp. และ qty_per_pack
              kraftwrap_tr.push(
                {
                  text: "Kraftwrap",
                  alignment: "left",
                  colSpan: 2,
                  rowSpan: num_trKraftwrap,
                },
                {},
                {
                  text: compName,
                  rowSpan: item1.detail.length,
                },
                {
                  text: numeral(item1.info.qty_per_pack).format("0,0"),
                  rowSpan: item1.detail.length,
                },
                {
                  text: "Cps/pack",
                  rowSpan: item1.detail.length,
                },
                ...kraftwrapColumn
              );
            } else {
              if (roundIndex === 0) {
                // * รอบแรกของแต่ละ Comp. ให้แสดงชื่อ Comp. และ qty_per_pack
                kraftwrap_tr.push(
                  {},
                  {},
                  {
                    text: compName,
                    rowSpan: item1.detail.length,
                  },
                  {
                    text: numeral(item1.info.qty_per_pack).format("0,0"),
                    rowSpan: item1.detail.length,
                  },
                  {
                    text: "Cps/pack",
                    rowSpan: item1.detail.length,
                  },
                  ...kraftwrapColumn
                );
              } else {
                // * รอบส่งอื่นๆให้แสดงเฉพาะจำนวน และราคา
                kraftwrap_tr.push({}, {}, {}, {}, {}, ...kraftwrapColumn);
              }
            }
            checkFirst.kraftwrap += 1;
            return kraftwrap_tr;
          });

          kraftwrapCompTr = [...kraftwrapCompTr, ...newTr];
        }

        if (item1.name == "carton") {
          // * loop by delivery round.
          newTr = item1.detail.map((roundDetail, roundIndex) => {
            // * draw <td></td> by number of qty.
            var cartonColumn = [];
            for (let i = startIndex; i <= lastIndex; i++) {
              let qtyDetail = roundDetail.detail[i];
              cartonColumn.push(
                {
                  text: numeral(qtyDetail.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(qtyDetail.qty).format("0,0.00"),
                },
                {
                  text: numeral(qtyDetail.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }

            // * draw <tr></tr> by number of round of delivery
            let carton_tr = [];
            if (checkFirst.carton === 0 && roundIndex === 0) {
              //* Title of summary table tr โชว์ หัวข้อ carton ให้แสดงชื่อ Comp. และ qty_per_carton
              carton_tr.push(
                {
                  text: "Carton",
                  alignment: "left",
                  colSpan: 2,
                  rowSpan: num_trCarton,
                },
                {},
                {
                  text: compName,
                  rowSpan: item1.detail.length,
                },
                {
                  text: numeral(item1.info.carton.qty_per_carton).format("0,0"),
                  rowSpan: item1.detail.length,
                },
                {
                  text: "Cps/carton",
                  rowSpan: item1.detail.length,
                },
                ...cartonColumn
              );
            } else {
              if (roundIndex === 0) {
                carton_tr.push(
                  {},
                  {},
                  {
                    text: compName,
                    rowSpan: item1.detail.length,
                  },
                  {
                    text: numeral(item1.info.carton.qty_per_carton).format(
                      "0,0"
                    ),
                    rowSpan: item1.detail.length,
                  },
                  {
                    text: "Cps/carton",
                    rowSpan: item1.detail.length,
                  },
                  ...cartonColumn
                );
              } else {
                // * รอบส่งอื่นๆให้แสดงเฉพาะจำนวน และราคา
                carton_tr.push({}, {}, {}, {}, {}, ...cartonColumn);
              }
            }
            checkFirst.carton += 1;
            return carton_tr;
          });

          cartonCompTr = [...cartonCompTr, ...newTr];
        }

        if (item1.name == "pallet") {
          // * loop by delivery round.
          newTr = item1.detail.map((roundDetail, roundIndex) => {
            // * draw <td></td> by number of qty.
            var palletColumn = [];
            for (let i = startIndex; i <= lastIndex; i++) {
              let qtyDetail = roundDetail.detail[i];
              palletColumn.push(
                {
                  text: numeral(qtyDetail.unit_price).format("0,0.00"),
                  alignment: "right",
                },
                {
                  text: numeral(qtyDetail.qty).format("0,0.00"),
                },
                {
                  text: numeral(qtyDetail.price).format("0,0.00"),
                  alignment: "right",
                }
              );
            }

            // * draw <tr></tr> by number of round of delivery
            let pallet_tr = [];
            if (checkFirst.pallet === 0 && roundIndex === 0) {
              //* Title of summary table tr โชว์ หัวข้อ pallet ให้แสดงชื่อ Comp. และ qty_per_pallet
              pallet_tr.push(
                {
                  text: "Pallet",
                  alignment: "left",
                  colSpan: 2,
                  rowSpan: num_trPallet,
                },
                {},
                {
                  text: compName,
                  rowSpan: item1.detail.length,
                },
                {
                  text: numeral(item1.info.bulk_qty_pallet).format("0,0"),
                  rowSpan: item1.detail.length,
                },
                {
                  text: check_packing[fIndex][compIndex].unit_pallet,
                  rowSpan: item1.detail.length,
                },
                ...palletColumn
              );
            } else {
              if (roundIndex === 0) {
                // * รอบแรกของแต่ละ Comp. ให้แสดงชื่อ Comp. และ qty_per_pallet
                pallet_tr.push(
                  {},
                  {},
                  {
                    text: compName,
                    rowSpan: item1.detail.length,
                  },
                  {
                    text: numeral(item1.info.bulk_qty_pallet).format("0,0"),
                    rowSpan: item1.detail.length,
                  },
                  {
                    text: check_packing[fIndex][compIndex].unit_pallet,
                    rowSpan: item1.detail.length,
                  },
                  ...palletColumn
                );
              } else {
                // * รอบส่งอื่นๆให้แสดงเฉพาะจำนวน และราคา
                pallet_tr.push({}, {}, {}, {}, {}, ...palletColumn);
              }
            }
            checkFirst.pallet += 1;
            return pallet_tr;
          });

          palletCompTr = [...palletCompTr, ...newTr];
        }
      });
    }

    packing_obj = {
      paperband_tr: [],
      kraftwrap_tr: [],
      carton_tr: [],
      pallet_tr: [],
      delivery_tr: [],
    };

    if (paperbandCompTr.length > 0) {
      paperbandRow_arr.push(...paperbandCompTr);
    }
    if (kraftwrapCompTr.length > 0) {
      kraftwrapRow_arr.push(...kraftwrapCompTr);
    }
    if (cartonCompTr.length > 0) {
      cartonRow_arr.push(...cartonCompTr);
    }
    if (palletCompTr.length > 0) {
      palletRow_arr.push(...palletCompTr);
    }
  });
  // * concat tr element string
  packing_obj.paperband_tr = paperbandRow_arr;
  packing_obj.kraftwrap_tr = kraftwrapRow_arr;
  packing_obj.carton_tr = cartonRow_arr;
  packing_obj.pallet_tr = palletRow_arr;

  //* หาจำนวนแถวที่ต้อง rowspan  // prev = จำนวน rate ในแต่ละรอบส่ง
  const tr_rowspan = delivery?.reduce(
    (prev, curr) =>
    (prev += curr?.qty_rate?.reduce(
      (
        prevRate,
        currRate //* prev (จำนวน rate รวมของทุกรอบส่ง) += จำนวน rate ที่มากที่สุดของยอด qty ทั้งหมด
      ) =>
      (prevRate =
        prevRate < currRate.length //*ค่าก่อนหน้า < ค่าปัจจุบัน
          ? currRate.length
          : prevRate),
      0 //*ค่าเริ่มต้นของ qty_rate.reduce
    )),
    0
  ); //*ค่าเริ่มต้นของ delivery.reduce

  // * delivery process
  if (tr_rowspan > 0) {
    var delivery_tr = delivery.map((obj, roundIndex) => {
      //* 1. รอบส่ง
      const tr_round_rowspan = obj.qty_rate.reduce(
        (max, curr) => (max = max < curr.length ? curr.length : max),
        0
      );
      let tr = obj.rate_line.map((line, lineIndex) => {
        /*
              rate_line = จำนวนเรทส่ง // 1 ยอด อาจมีเรทส่งได้มากกว่า1 เรท ขึ้นอยู่กับน้ำหนัก
              line = เรทส่ง, lineIndex = ลำดับของเรทส่ง
              */

        let td = [],
          tr_line = [];
        for (let i = startIndex; i <= lastIndex; i++) {
          let qtyInfo = line[i];
          td.push(
            {
              text: numeral(qtyInfo.unit_price).format("0,0.00"),
              alignment: "right",
            },
            {
              text: numeral(qtyInfo.qty).format("0,0.00"),
            },
            {
              text: numeral(qtyInfo.price).format("0,0.00"),
              alignment: "right",
            }
          );
        }

        if (roundIndex === 0 && lineIndex === 0) {
          //! รอบส่งแรก + เรทส่งแรก
          tr_line.push(
            {
              text: "Delivery",
              alignment: "left",
              colSpan: 2,
              rowSpan: tr_rowspan,
            },
            {},
            {
              text: `${obj.destinationName} ${obj.dueDate
                ? `- ${moment(obj.dueDate, "YYYY-MM-DD").format(
                  "DD/MM/YYYY"
                )}`
                : ""
                }`,
              colSpan: 3,
              rowSpan: tr_round_rowspan,
            },
            {},
            {},
            ...td
          );
        } else {
          // ! รอบส่งครั้งถัดๆไป
          if (lineIndex === 0) {
            // ! จำนวนแรก
            tr_line.push(
              {},
              {},
              {
                text: `${obj.destinationName} ${obj.dueDate
                  ? `- ${moment(obj.dueDate, "YYYY-MM-DD").format(
                    "DD/MM/YYYY"
                  )}`
                  : ""
                  }`,
                colSpan: 3,
                rowSpan: tr_round_rowspan,
              },
              {},
              {},
              ...td
            );
          } else {
            // ! จำนวนอื่นๆ
            tr_line.push({}, {}, {}, {}, {}, ...td);
          }
        }
        return tr_line;
      });
      return tr;
    });

    delivery_tr.forEach((item) => {
      packing_obj.delivery_tr.push(...item);
    });
  }

  return packing_obj;
}

function setProfitAndLossQty(data = {}) {
  var lossQty = [];
  var widthArray = [];

  if (data?.job?.is_loss) {
    console.log("total price", data.totalprice);
    data.totalprice.forEach((total, index) => {
      lossQty.push({
        text: total?.loss ? numeral(total?.loss).format("0,0.00") : 0,
        alignment: "right",
      });

      widthArray.push(35)
    });
  } else {
    lossQty.push({
      text: " ",
      alignment: "right",
    });

    widthArray.push(350)
  }

  var rows = {
    table: {
      widths: [50, ...widthArray],
      body: [
        [
          {
            columns: [
              {
                image: data?.job?.is_loss ? checkboxCheckImage() : squareFrameImage(),
                width: 8,
                alignment: "center",
              },
              {
                text: "ขาดทุน",
                alignment: "left",
                width: "auto",
                margin: [5, 0, 0, 0],
              }
            ]
          },
          ...lossQty
        ]
      ]
    },
    margin: [20, 10, 20, 0]
  }

  return rows;
}

function setMarkdownQty(data = {}) {
  var markdown = [];
  var widthArray = [];

  console.log("total price", data.totalprice);
  data.totalprice.forEach((total, index) => {
    markdown.push({
      text: total?.total_marking_material_production >= 0 ? '' : numeral(Math.abs(total?.total_marking_material_production)).format("0,0.00"),
      alignment: "right",
    });

    widthArray.push(35)
  });

  var rows = {
    table: {
      widths: [50, ...widthArray],
      body: [
        [
          {
            columns: [
              {
                text: '',
              },
              {
                text: "Mark down",
                alignment: "left",
                width: "auto",
                margin: [5, 0, 0, 0],
              }
            ]
          },
          ...markdown
        ]
      ]
    },
    margin: [20, 10, 20, 0]
  }

  return rows;
}

function getPackingRows(data, startIndex, lastIndex) {
  const is_delivery = checkDelivery(data);
  console.log("is_delivery", is_delivery);
  if (is_delivery) {
    packingObj = getDeliveryPackingTR(data, startIndex, lastIndex);
  } else {
    packingObj = getNormalPackingTR(data, startIndex, lastIndex);
  }
}