// frappe.ui.form.on("Sales Invoice Item", {
// 	// qty: function (doc, cdt, cdn){
// 	// 	items = locals[cdt][cdn]
// 	// 	console.log(JSON.stringify(items))
// 	// 	item_rate(items)

// 	// },
// 	item_code: function (doc, cdt, cdn){
// 		item = locals[cdt][cdn]
// 		// console.log(JSON.stringify(items))
// 		item_rate(item)
// 	} 

// })


// frappe.ui.form.on("Sales Invoice Item","qty",function(doc, cdt, cdn){
// 	cur_doc = cur_frm.doc
	
// 	item = locals[cdt][cdn]
// 	item_rate(item)
	
// })

// function item_rate (item) {
// 	// body...
// 	return frappe.call({
// 		method:"bakery_store.customization.sales_invoice.sales_invoice.rate_of_item",
// 		args: {"item_code": item.item_code,
// 			   "size": item.size },
// 		callback: function(r){
// 			if (r.message){
// 				// console.log(JSON.stringify(r.message[0]['rate']))
// 				// items.rate = JSON.stringify(r.message[0]['rate'])
// 				// alert("");
// 				// cur_frm.refresh_fields();
// 				item.rate =r.message[0]['rate']
// 				cur_frm.refresh_fields();

// 			}
// 		}
// 	})
// }
 

frappe.ui.form.on("Sales Invoice Item", {
	item_code: function (doc, cdt, cdn) {
		var item = frappe.get_doc(cdt, cdn);
		return frappe.call({
		method:"bakery_store.customization.sales_invoice.sales_invoice.rate_of_item",
		args: {"item_code": item.item_code,
			   "size": item.size },
		callback: function(r){
			if (r.message){
				item.rate = parseFloat(r.message[0]['rate'])
				cur_frm.refresh_fields();

				}
			}
		})

	},
	qty: function (doc, cdt, cdn) {
		var item = frappe.get_doc(cdt, cdn);
		return frappe.call({
		method:"bakery_store.customization.sales_invoice.sales_invoice.rate_of_item",
		args: {"item_code": item.item_code,
			   "size": item.size },
		callback: function(r){
			if (r.message){
				item.rate = parseFloat(r.message[0]['rate'])
				cur_frm.refresh_fields();

				}
			}
		})
	}
})
	

frappe.ui.form.on("Sales Invoice","onload",function(doc, cdt, cdn){
 	var me = this;
 	if (cint(frappe.defaults.get_user_defaults("fs_pos_view"))===1)
						erpnext.pos.toggle(cur_frm, true);
	cur_frm.set_value("is_pos", 0);
})

 