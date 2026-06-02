//*FETCH DATA
function fetchMasterData(type = '') {
    return new Promise((resolve) => {
        const info = $.ajax({
            url: `${node_api}/estimate/master_data?type=${type}`,
            type: 'GET',
            data: {},
            dataType: 'json',
            cache: 'false',
            contentType: "application/json",
            success: function () { },
            error: function () {
                console.log(`fetch ${type} ERROR`)
            }
        })
        resolve(info)
    })
}

function checkFileExist(file_id) {
    if (!file_id) {
        return false;
    }

    return $.ajax({
        url: `${node_api}/estimate/file/${file_id}`,
        type: 'GET',
        data: {},
        dataType: 'json',
        cache: 'false',
        contentType: "application/json",
        // url: `${api_url}/controllers/estimate.php`,
        // type: 'GET',
        // data: {
        //     post_type: 'check_file_exist',
        //     file_id
        // },
        // dataType: 'json',
        // cache: false,
        error: function () {
            console.log('error')
            return false
        },
        success: function (data) {
            return data?.success || false
        }
    })
}


function fetchExchangeRate() {
    return $.ajax({
        url: `${node_api}/estimate/master_data?type=exchange_rate`,
        type: 'GET',
        data: {},
        dataType: 'json',
        cache: 'false',
        contentType: 'application/json',
        error: function (e) {
            console.log('error', e)

            return []
        },
        success: function (res) {
            if (res?.success) {
                return res?.data
            }

            return []
        }
    })
}

function getRFQStatusLog(obj = {}) {
    let queryString = ''
    console.log("get status log", obj)
    const { rfq_id = '', status_id = '' } = obj || {}

    if (!rfq_id) {
        return false;
    }

    queryString += `?rfq_id=${rfq_id}`

    if (status_id) {
        queryString += `&status_id=${status_id}`
    }

    return $.ajax({
        url: `${node_api}/estimate/rfq/status/log${queryString}`,
        type: 'GET',
        data: {},
        dataType: 'json',
        cache: 'false',
        contentType: "application/json",
        error: function (e) {
            console.log('error', e)
            return { success: false, data: [] }
        },
        success: function (data) {
            return data
        }
    })


}

function getCustomerInfo(customer_id = '') {
    return $.ajax({
        url: `${node_api}/estimate/customer`,
        type: 'GET',
        data: { customer_id },
        dataType: 'json',
        cache: 'false',
        contentType: "application/json",
        error: function (e) {
            console.log('error', e)
            return null
        },
        success: function (data) {
            return data
        }
    })
}

function getEmployeeInfo(emp_id = '') {
    return $.ajax({
        url: `${node_api}/estimate/emp_status`,
        type: 'GET',
        data: { emp_id },
        dataType: 'json',
        cache: 'false',
        contentType: "application/json",
        error: function (e) {
            console.log('error', e)
            return null
        },
        success: function (data) {
            return data
        }
    })
}