$(() => {
    console.log("history mode is ready.")

    $('body').on('click', ('#history_toggle_side'), function () {
        HISTORY.toggleSideBar()
    })

    $('body').on('click', ('#history_back'), function () {
        if (!confirm("คุณต้องการออกจากโหมดดูประวัติใช่หรือไม่ ?")) {
            return false
        }

        const { jobid } = getUrlParams(window.location.href)

        window.location = window.location = '/view?jobid=' + jobid
    })

    $('body').on('click', ('.history_card'), function (e) {
        const classList = $(e.target).attr('class')?.split(' ')
        const log_id = $(this).data('log_id')

        if (classList?.includes('selected')) {
            return false
        }

        if (!confirm('คุณต้องการดูประวัติเวอร์ชั่นนี้ใช่หรือไม่ ?')) {
            return false
        }

        const isNewTab = classList?.includes('history_open_new_tab')

        HISTORY.setOpenLinkHistory(isNewTab, log_id)
    })

    $('body').on('click', ('#history-bttn'), function () {
        // scrollToSection('#job_id', -180)
        HISTORY.setOpenLinkHistory(true)
    })

    $('body').on('click', '#history_view_ref', function () {
        const ref_job_id = $(this).html() || null

        if (!ref_job_id) return

        if (!confirm(`คุณต้องการดูข้อมูล ${ref_job_id} ใช่หรือไม่ ?`)) return


        window.location = '/view?jobid=' + ref_job_id
    })
})

class History {

    jobId = null
    refJobId = null
    currentLogId = null
    historyBttn = '#history-bttn'
    toolBar = ''


    config = {
        historyMode: false,
        apiUrl: '',
        usedHistory: null,
        history: [],
        showSideBar: true,
    }

    exitHistoryMode = () => { console.log('exit history mode') }
    useHistoryMode = () => { console.log('use history mode') }

    constructor() {

    }

    setAPI(url) {
        this.config.apiUrl = url
    }

    setHistoryJob(job_id, log_id, ref_job_id = null) {
        this.jobId = job_id
        this.currentLogId = log_id
        this.refJobId = ref_job_id
    }

    setButtonContainer(selector) {
        this.toolBar = selector
    }

    setShowHistoryButton(bool = false) {
        if (bool) {
            $(this.historyBttn).show()
        } else {
            $(this.historyBttn).hide()
        }
    }

    setOpenLinkHistory(isNewTab = false, log_id = this.currentLogId) {
        const link = '/view?jobid=' + this.jobId + '&log_id=' + log_id

        if (isNewTab) {
            window.open(link, '_blank')
        } else {
            window.location = link
        }
    }

    getAllHistory() {
        return $.ajax({
            url: this.config.apiUrl,
            type: 'GET',
            dataType: 'json',
            cache: false,
            contentType: "application/json",
        })
    }

    async setDisplayHistory() {
        const { data: list = [] } = await this.getAllHistory() || [];

        console.log("setDisplayHistory", list)

        const table = $('#history_table')

        const cardList = []

        table.empty();

        list?.forEach((obj, index) => {
            const card = `<div class="history_card ${this.currentLogId == obj?.log_id ? 'selected' : ''}" data-log_id=${obj?.log_id}>
                    <div class="history_card_version_label">
                        ${moment(obj?.log_date, 'YYYY-MM-DD HH:mm:ss')?.format('DD/MM/YYYY HH:mm')} น.
                        <i title="Open link in new tab." class="history_open_new_tab fa fa-external-link" aria-hidden="true"></i>
                    </div>
                    <div class="history_card_version_status">
                        ${obj?.status_name} ${(index == 0) ? '( เวอร์ชันปัจจุบัน )' : ''}
                    </div>
                    <div class="history_card_version_created_by">
                        ${obj?.emp_name || '-'}
                    </div>
                </div>`

            if (this.currentLogId == obj?.log_id) {
                let text = `${moment(obj?.log_date, 'YYYY-MM-DD HH:mm:ss')?.format('DD/MM/YYYY HH:mm')} น. / ${obj?.status_name} / ${obj?.emp_name || '-'}`

                if (this?.refJobId) {
                    text += `<span style="margin-left:50px;">Ref. Copy : <span id="history_view_ref">${this?.refJobId}</span></span>`
                }

                $('#history_version_label').html(text)

            }

            cardList?.push(card)
        })

        $('#history_count').html(list?.length || 0)

        table.html(cardList?.join(''))
    }

    setHistoryMode(bool = false) {
        console.log("setHistoryMode", bool)
        this.historyMode = bool

        this.setDisplayHistoryMode(bool)
    }

    setDisplayHistoryMode(bool = false) {
        if (bool) {
            $('.estimate-header').hide()
            $('div#inputInfo').css('padding-top', '50px')

            $('#history_mode').show()
            this.exitHistoryMode()
        } else {
            $('.estimate-header').show()
            $('#history_mode').hide()
            this.useHistoryMode()
        }
    }

    setDisplaySideBar(bool = false) {
        this.config.showSideBar = bool

        if (bool) {
            $('#history_side').show()
        } else {
            $('#history_side').hide()
        }
    }

    toggleSideBar() {
        if (this.config.showSideBar) {
            this.setDisplaySideBar(false)
        } else {
            this.setDisplaySideBar(true)
        }
    }

    renderHistorySection() {
        $(this.toolBar).find('#home-bttn').after(`
			<div id="history-bttn" class="child-menu" style="display:none;">ประวัติ</div>
        `)

        $('body').append(`
            <div id="history_mode">
                <div id="history_tools">
                    <div id="history_top">
                        <div id="history_top_left">
                            <i id="history_back" class="fa fa-arrow-left" aria-hidden="true"></i>
                            <span alt="กลับ" id="history_version_label"></span>
                        </div>
                        <div id="history_top_right">
                            <i alt="ดูรายการประวัติ" id="history_toggle_side" class="fa fa-list" aria-hidden="true"></i>
                        </div>
                    </div>
                    <div id="history_side">
                        <div id="history_header">
                            ประวัติเวอร์ชัน (<span id="history_count">-</span>)
                        </div>
                        <div style="display:none;">
                            <select id="select_history_status">
                                <option value="4">ทุกเวอร์ชัน</option>
                                <option value="0">Draft</option>
                                <option value="1">Confirm</option>
                                <option value="2">Reject</option>
                                <option value="3">Approve</option>
                            </select>
                        </div>
                        <div id="history_table">
                            <div class="history_card">
                                <div class="history_card_version_label">
                                    --- ไม่พบข้อมูล ---
                                </div>
                            </div>
                        </div>
                        <div id="history_footer">
                            เลือกเพื่อดูรายละเอียด
                        </div>
                    </div>
                </div>
            </div>
        `)
    }
}

const HISTORY = new History;