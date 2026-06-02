class DocumentStatusManager {
    constructor() {
        this.status = 0; // Default status is "Draft"
        this.statusList = [];
        this.remark = '';
        this.fromStatusId = 0;
        this.toStatusId = 0;
        this.callbackFunction = () => { }
        this.setDocumentApprovedFunction = () => { }
        this.setDocumentReadonlyFunction = () => { }

        // Bind event listeners
        // this.bindEventListeners();
    }

    setStatusList(statusList) {
        this.statusList = statusList;
        this.renderStatusSelect();
    }

    setCallbackFunction(fnc) {
        this.callbackFunction = fnc
    }

    setCallbackDocumentApprovedFunction(fnc) {
        this.setDocumentApprovedFunction = fnc
    }

    setCallbackDocumentReadonlyFunction(fnc) {
        this.setDocumentReadonlyFunction = fnc
    }

    bindEventListeners() {
        // Listener for status change (e.g., select dropdown in manager's interface)
        document.querySelector('#request_for_approve').addEventListener('change', (event) => {
            const is_checked = event.target.checked || false
            let selectedStatus = {}

            if (is_checked) {
                selectedStatus = this.statusList.find(status => status.is_confirm === true);
            } else {
                selectedStatus = this.statusList.find(status => status.is_draft === true);
            }

            this.updateStatus(selectedStatus?.id)
        });

        document.querySelector('#status_id').addEventListener('change', (event) => {
            const newStatus = parseInt(event.target.value);
            // const selectedStatus = this.statusList.find(status => status.id === newStatus);

            this.updateStatus(newStatus)
        });
    }

    setDisabledChangeStatus(bool = false) {
        const selectElement = document.querySelector('#status_id');
        selectElement.disabled = bool
    }

    renderStatusSelect() {
        const selectElement = document.querySelector('#status_id');
        selectElement.innerHTML = ''; // Clear existing options

        this.statusList.forEach(status => {
            const option = document.createElement('option');
            option.value = status.id;
            option.textContent = status.name;
            selectElement.appendChild(option);
        });
    }

    createRemarkForm() {

        const reject_modal = document.createElement('div');
        reject_modal.id = 'rejectRemarkModal'
        reject_modal.innerHTML = `
            <div id="remark_form_container">
                <div id="reject_remark_form">
                    <span class="reject_remark_form_label"><b>Remark :</b></span>
                    <textarea id="reject_remark_text" placeholder="สาเหตุที่ Reject" class="text"></textarea>
                </div>
                <div id="remark_history_header">
                    <span><b>ประวัติการ Reject</b></span>
                </div>
                <div id="remark_history_container">
                    <table id="tb_remark_history" cellpadding="0" cellspacing="0">
                        <thead>
                            <tr>
                                <th>ครั้งที่</th>
                                <th width="25%">วันที่ - เวลา</th>
                                <th width="65%">หมายเหตุ</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
                <div id="reject_remark_toolbar">
                    <button id="rejectRemarkSave"><i class="fa fa-check" style="font-size: 20px;"></i></button>
                    <button id="rejectRemarkCancel"><i class="fa fa-times" style="font-size: 20px;"></i></button>
                </div>
            </div>
        `
        document.querySelector('body').appendChild(reject_modal)

        // Assuming you have a div with id 'remark_form_container'
        document.querySelector('#rejectRemarkLabel').addEventListener('click', () => {
            document.querySelector('#reject_remark_text').value = this.remark
            this.showRejectRemarkModal(true);
        });
        // Add event listener for submit button
        document.querySelector('#rejectRemarkSave').addEventListener('click', () => {
            const remarkText = document.querySelector('#reject_remark_text').value;
            this.showRejectRemarkModal(false);
            this.setRemark(remarkText);
            // this.updateStatus(this.statusList.find(status => status.is_reject).id);
        });

        document.querySelector('#rejectRemarkCancel').addEventListener('click', () => {
            document.querySelector('#reject_remark_text').value = ''
            this.showRejectRemarkModal(false);
            this.setRemark('');
            // this.updateStatus(this.statusList.find(status => status.is_reject).id);
        });
    }

    setDocStatus({ status_id = 0, remark = '', history = [] }) {
        this.fromStatusId = status_id
        this.remark = remark
        this.history = history

        this.updateStatus(status_id)
        this.renderHistory(this.history)
        // this.renderDocumentByRoles()
    }

    setSelectedStatus(statusId) {
        const selectElement = document.querySelector('#status_id');
        selectElement.value = statusId
    }

    setRequestForApproveCheckbox(statusId) {
        const selectedStatus = this.statusList.find(status => status.id === statusId);
        if (selectedStatus?.is_draft) {
            const requestForApproveCheckbox = document.querySelector('#request_for_approve');
            requestForApproveCheckbox.checked = false
        }

        if (selectedStatus?.is_confirm) {
            const requestForApproveCheckbox = document.querySelector('#request_for_approve');
            requestForApproveCheckbox.checked = true
        }
    }

    updateStatus(newStatus) {
        // this.fromStatusId = this.status;
        const selectedStatus = this.statusList.find(status => status.id === newStatus);

        if (selectedStatus && selectedStatus.is_reject) {
            // If the selected status is a reject status
            this.showRejectRemarkLabel(true);
            this.showRejectRemarkAction(true)
        } else {

            this.showRejectRemarkAction(false);

            if (this.history?.length) {
                this.showRejectRemarkLabel(true)
            } else {
                this.showRejectRemarkLabel(false);
            }
        }

        this.setDocumentApprovedFunction(selectedStatus?.is_approve)

        this.toStatusId = newStatus;
        this.status = newStatus;

        this.setSelectedStatus(newStatus)
        this.setRequestForApproveCheckbox(newStatus)
        this.callbackFunction()
        console.log(`Status updated from ${this.fromStatusId} to ${this.toStatusId}`);
    }

    renderHistory(history = []) {
        const tb_history = document.querySelector('#tb_remark_history tbody')

        tb_history.innerHTML = ''

        const data = []

        let no = history?.length

        history?.forEach(obj => {
            const { created = '', remark = '' } = obj || {}

            const tr = `
                    <tr class="row_remark_history">
                        <td class="text-center">${no}</td>
                        <td class="text-center">${created ? moment(created, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm') : '-'}</td>
                        <td class="text-center remark_text">${remark || '-'}</td>
                    </tr>
                `

            data.push(tr)

            no--
        })

        if (!data?.length) {
            data.push(`<tr><td colspan="3"> --- ไม่พบข้อมูล --- </td></tr>`)
        }

        tb_history.innerHTML = data?.join('')
    }

    renderDocumentByRoles() {
        const statusId = this.fromStatusId || 0
        const selectedStatus = this.statusList?.find(status => status.id == statusId)
        const { approve = false, reject = false, request = true } = this.user_roles || {}
        /*
        todo 
            readonly when 
            1. status = approve
            2. status = confirm & approve = false

            editable
            1. status = draft , reject
        */

        if (approve) {
            this.setDisabledChangeStatus(false)
        } else {
            this.setDisabledChangeStatus(true)
        }

        // this.setDocumentApprovedFunction(selectedStatus?.is_approve)

        if (selectedStatus?.is_draft) {
            this.setDocumentReadonlyFunction(false)
            this.setDisabledChangeStatus(true)
        } else if (selectedStatus?.is_reject) {
            this.showRejectRemarkLabel(true)
            this.setDocumentReadonlyFunction(false)

            if (!approve) {
                const draft_status = this.statusList?.find(status => status.is_draft)
                // this.setRequestForApproveCheckbox(draft_status.id)
                // this.setSelectedStatus(draft_status.id)
                this.updateStatus(draft_status.id)
                this.showRejectRemarkLabel(true)
                this.showRejectRemarkAction(false)
            } else {
                this.showRejectRemarkAction(true)
            }
        } else {
            if (selectedStatus?.is_confirm && approve) {
                this.setDocumentReadonlyFunction(false)
            } else {
                this.setDocumentReadonlyFunction(true)
            }
        }

        const requestForApproveCheckbox = document.querySelector('#request_for_approve');
        if (selectedStatus?.is_approve) {
            requestForApproveCheckbox.disabled = true
        } else {
            requestForApproveCheckbox.disabled = false
        }

        if (this.history?.length) {
            this.showRejectRemarkLabel(true)
        }
    }

    showRejectRemarkLabel(bool = 0) {
        // Code to display the jQuery modal for rejection remarks
        if (bool) {
            $('#rejectRemarkLabel').show()
        } else {
            $('#rejectRemarkLabel').hide()
        }
    }

    showRejectRemarkModal(bool = 0) {
        // Code to display the jQuery modal for rejection remarks
        if (bool) {
            $('#rejectRemarkModal').show()
        } else {
            $('#rejectRemarkModal').hide()
        }
    }

    showRejectRemarkAction(bool = false) {
        const remark = document.querySelector('#reject_remark_text')
        const saveRemark = document.querySelector('#rejectRemarkSave')
        const label = document.querySelector('.reject_remark_form_label')

        if (bool) {
            remark.classList.add('required')
            remark.classList.remove('d-none')
            saveRemark.classList.remove('d-none')
            label.classList.remove('d-none')
        } else {
            remark.classList.remove('required')
            remark.classList.add('d-none')
            saveRemark.classList.add('d-none')
            label.classList.add('d-none')
        }
    }

    showApprovedLabel(bool = 0) { //todo to use
        // Code to display the jQuery modal for rejection remarks
        if (bool) {
            $('#rejectRemarkLabel').show()
        } else {
            $('#rejectRemarkLabel').hide()
        }
    }

    setRemark(remark) {
        this.remark = remark;
    }

    setUserRoles(obj = {}) {
        /*
        {
            approve: true,
            reject: true,
            request: true
        }
        */
        this.user_roles = obj
    }

    getStatusDetails() {
        return {
            status_id: this.status,
            remark: this.remark,
            from_status_id: this.fromStatusId,
            to_status_id: this.toStatusId,
            history: this.history
        };
    }
}

// Usage
const STATUS = new DocumentStatusManager();

$(() => {
    STATUS.bindEventListeners()
    STATUS.setStatusList([
        { id: 0, name: "Draft", is_confirm: false, is_draft: true, is_reject: false, is_approve: false },
        { id: 1, name: "Pending", is_confirm: true, is_draft: false, is_reject: false, is_approve: false },
        { id: 2, name: "Reject", is_confirm: false, is_draft: false, is_reject: true, is_approve: false },
        { id: 3, name: "Approved", is_confirm: false, is_draft: false, is_reject: false, is_approve: true }
    ]);

    STATUS.createRemarkForm();
    STATUS.showRejectRemarkLabel(false);
})