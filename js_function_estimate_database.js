class Database {
	db = {}

	setInfo(arr) {
		this.db.paper_info = arr[0]
		this.db.coating_info = arr[1]
		this.db.corrugated_info = arr[2]
		this.db.foilstamp_info = arr[3]
		this.db.block_stamp_info = arr[4]
		this.db.price_info = arr[5]
		this.db.min_price_info = arr[6]
		this.db.waste_info = arr[7]
		this.db.block_diecut_info = arr[8]
		this.db.box_template_info = arr[9]
		this.db.special_ink_info = arr[10]
		this.db.special_ink_factor_info = arr[11]
		this.db.jetpress_waste_info = arr[12]
		this.db.jetpress_info = arr[13]
		this.db.marking_price_info = arr[14]
		this.db.machine_std_paper_info = arr[15]
		this.db.delivery_rate_info = arr[16]
		this.db.paper_code_type = arr[17]
		this.db.process_type = arr[18]
		this.db.price_type = arr[19]
		this.db.konica_waste_info = arr[20]
		this.db.exchange_rate = arr[21]
		this.setCoatingInfo()
	}

	setCoatingInfo() {
		this.db.coating_info.forEach((item) => {
			if (item.coating_size) {
				item.coating_size = (item.coating_size.split(',')).map((x => numeral(x).value()))

			}
		})
	}
}

var db = new Database



