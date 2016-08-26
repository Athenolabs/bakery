// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

frappe.provide("erpnext.pos");

erpnext.pos.PointOfSale = Class.extend({
	init: function(wrapper, frm) {
		this.wrapper = wrapper;
		this.frm = frm;
		this.wrapper.html(frappe.render_template("pos", {currency: this.frm.currency}));

		this.check_transaction_type();
		this.make();
		console.log("data")
		var me = this;
		$(this.frm.wrapper).on("refresh-fields", function() {
			me.refresh();
		});

		this.wrapper.find('input.discount-percentage').on("change", function() {
			frappe.model.set_value(me.frm.doctype, me.frm.docname,
				"additional_discount_percentage", flt(this.value));
		});

		this.wrapper.find('input.discount-amount').on("change", function() {
			frappe.model.set_value(me.frm.doctype, me.frm.docname, "discount_amount", flt(this.value));
		});
		this.category();
	},
	category: function() {
		var me = this;
		$(this.wrapper).find(".item-group-tab").on("click", function () {
			if($(this).attr("data-item-group") == 'custom_cakeseaux') {
				me.custom_cakes_dialog();
			} else {
				item_group = $(this).attr("data-item-group")
				me.make_item_list(item_group)
			}
		});
	},
	custom_cakes_dialog: function () {

		var me = this;
		var dialog = new frappe.ui.Dialog({
			width: 1100,
			title: "Select <b>Custom Cake</b> Size",
			fields:[
				{fieldtype: 'HTML',
					fieldname:'item_images', label: __("Item Images")},
				{fieldtype: "Section Break", fieldname: "sb1"},
				{fieldtype : 'Link',
					fieldname:'flavour', label: __("Flavor"), options: "Flavours"},
				{fieldtype : 'Link',
					fieldname:'Sexe', label: __("Sexe"), options: "Sex"},
				{fieldtype: "Column Break", fieldname: "cb1"},
				{fieldtype : 'Link',
					fieldname:'cream', label: __("Crème"), options: "Cream"},
				{fieldtype : 'Data',
					fieldname:'frosting', label: __("Frosting")},
				{fieldtype: "Column Break", fieldname: "cb2"},
				{fieldtype : 'Link',
					fieldname:'decor', label: __("Décor"), options: "Decor"},
				{fieldtype : 'Int',
					fieldname:'age', label: __("Age")},
				{fieldtype: "Column Break", fieldname: "cb3"},
				{fieldtype : 'Link',
					fieldname:'theme', label: __("Theme"), options: "Theme"},
				{fieldtype: 'Section Break',
					fieldname:'sb01'},
				{fieldtype: 'Button', label: __("Add to Cart"), fieldname: "order_item"},
				{fieldtype: "Column Break", fieldname: "cb4"},
				{fieldtype: 'Button', label: __("Next"), fieldname: "next"}
			]
		});
		dialog.show();
		// body...
	},
	check_transaction_type: function() {
		var me = this;

		// Check whether the transaction is "Sales" or "Purchase"
		if (frappe.meta.has_field(cur_frm.doc.doctype, "customer")) {
			this.set_transaction_defaults("Customer");
		}
		else if (frappe.meta.has_field(cur_frm.doc.doctype, "supplier")) {
			this.set_transaction_defaults("Supplier");
		}
	},
	set_transaction_defaults: function(party) {
		var me = this;
		this.party = party;
		this.price_list = (party == "Customer" ?
			this.frm.doc.selling_price_list : this.frm.doc.buying_price_list);
		this.price_list_field = (party == "Customer" ? "selling_price_list" : "buying_price_list");
		this.sales_or_purchase = (party == "Customer" ? "Sales" : "Purchase");
	},
	make: function() {
		this.make_party();
		this.make_search();
		this.make_item_list();
	},
	make_party: function() {
		var me = this;
		this.party_field = frappe.ui.form.make_control({
			df: {
				"fieldtype": "Link",
				"options": this.party,
				"label": this.party,
				"fieldname": this.party.toLowerCase(),
				"placeholder": this.party
			},
			parent: this.wrapper.find(".party-area"),
			frm: this.frm,
			doctype: this.frm.doctype,
			docname: this.frm.docname,
			only_input: true,
		});
		this.party_field.make_input();
		this.party_field.$input.on("change", function() {
			if(!me.party_field.autocomplete_open)
				frappe.model.set_value(me.frm.doctype, me.frm.docname,
					me.party.toLowerCase(), this.value);
		});
	},
	make_search: function() {
		var me = this;
		this.search = frappe.ui.form.make_control({
			df: {
				"fieldtype": "Data",
				"label": "Item",
				"fieldname": "pos_item",
				"placeholder": "Search Item"
			},
			parent: this.wrapper.find(".search-area"),
			only_input: true,
		});
		this.search.make_input();
		this.search.$input.on("keypress", function() {
			if(!me.search.autocomplete_open)
				if(me.item_timeout)
					clearTimeout(me.item_timeout);
				me.item_timeout = setTimeout(function() { me.make_item_list(); }, 1000);
		});
	},
	make_item_list: function(item_group) {
		
		var me = this;
		if(!this.price_list) {
			msgprint(__("Price List not found or disabled"));
			return;
		}

		me.item_timeout = null;
		frappe.call({
			method: 'bakery_store.customization.customization.get_items',
			args: {
				sales_or_purchase: this.sales_or_purchase,
				price_list: this.price_list,
				item: this.search.$input.val(),
				item_group: item_group
			},
			callback: function(r) {
				var $wrap = me.wrapper.find(".item-list");
				me.wrapper.find(".item-list").empty();
				if (r.message) {
					if (r.message.length === 1) {
						var item = r.message[0];
						if (item.serial_no) {
							console.log("--------------------------------")
							console.log(item.serial_no)
							me.add_to_cart(item.item_code, item.serial_no);
							me.search.$input.val("");
							return;

						} else if (item.barcode) {
							me.add_to_cart(item.item_code);
							me.search.$input.val("");
							return;
						}
					}

					$.each(r.message, function(index, obj) {
						$(frappe.render_template("pos_item", {
							item_code: obj.name,
							item_price: format_currency(obj.price_list_rate, obj.currency),
							item_name: obj.name===obj.item_name ? "" : obj.item_name,
							item_image: obj.image ? "url('" + obj.image + "')" : null
						})).tooltip().appendTo($wrap);
					});
				}

				// if form is local then allow this function
				$(me.wrapper).find("div.pos-item").on("click", function() {
					if(me.frm.doc.docstatus==0) {
						me.select_item_size($(this).attr("data-item-code"));
						// me.add_to_cart($(this).attr("data-item-code"));
					}
				});
			}
		});
	},
	//custom code
	//start

	select_item_size: function(item_code){
		
		var me = this;
		var dialog = new frappe.ui.Dialog({
			width: 900,
			title: "Select <b>"+ item_code +"</b> Size",
			fields:[
				{fieldtype: 'HTML',
					fieldname:'item_images', label: __("Item Images")},
				{fieldtype: "Column Break", fieldname: "cb"},
				{fieldtype : 'Data',
					fieldname:'message_on_cake', label: __("Message on Cake")},
				{fieldtype : 'Data',
					fieldname:'pickup_date_and_time', label: __("Special Instructions")},
				{fieldtype: 'Section Break',
					fieldname:'sb01'},
				{fieldtype: 'Button', label: __("Add to Cart"), fieldname: "order_item"},
				{fieldtype: "Column Break", fieldname: "cb1"},
				{fieldtype: 'Button', label: __("Next"), fieldname: "next"}
			]
		});
		// dialog.show();
		// this.save_button(dialog)
		$(dialog.body).find("[data-fieldname='item_images']").html("<div id='id12'></div>");
		
		frappe.call({
		method:"bakery_store.customization.customization.rate_of_item_depend_on_size",
		args: {
				item_code: item_code
			},
		callback: function(r){
				if(r.message){
					$.each(r.message, function(index, obj) {
						$(dialog.body).find("[data-fieldname='item_images']").find("#id12").append(frappe.render_template("different_size_of_item", {
							item_code: obj.parent,
							size: obj.size,
							price: obj.rate,
							image: obj.image ? "url('" +obj.image +"')" : null
						})).tooltip()
											
				});
				$(dialog.body).find("button[data-fieldname='order_item']").on("click", function(){
					console.log($(cur_dialog.body).find('input:radio:checked').attr("value"))
					
					var item_code = $(cur_dialog.body).find('input:radio:checked').attr("name")
					var size = $(cur_dialog.body).find('input:radio:checked').attr("value")
					
					me.add_to_cart(item_code, "", size);
					dialog.hide();

				});
				$(dialog.body).find("button[data-fieldname='next']").on("click", function(){
					var item_size_nd_name = $(cur_dialog.body).find('input:radio:checked').attr("name") +" : "+
						$(cur_dialog.body).find('input:radio:checked').attr("value")
					me.select_different_accessories(item_size_nd_name);
				});
				}
			}
		})
		this.save_button(dialog)
		dialog.show();
			
	},
	select_different_accessories: function(item_name) {
		var me = this;
		var accessories_dialog = new frappe.ui.Dialog({
			width: 400,
			title: item_name,
			fields:[
				{fieldtype: 'Section Break', 
					fieldname: 'section01', label: __("Select an acessories")},
				{fieldtype: 'Link',
					fieldname: 'sujet',options:'Item',  label: __("Sujet"), placeholder:__("Sujet"),
					get_query: function() {
						return {
						filters:  [['Item', 'item_group', '=', 'Sujet']] 
						}
				 	},	
				},
				{fieldtype: "Column Break", fieldname: "cb1"},
				{fieldtype: 'Link',
					fieldname: 'fleurs',options:'Item',  label: __("Fleurs"), placeholder:__("Fleurs"),
					get_query: function() {
						return {
						filters:  [['Item', 'item_group', '=', 'Fleurs']] 
						}
				 	},
				 },
				{fieldtype: "Column Break", fieldname: "cb2"},
				{fieldtype: 'Link',
					fieldname: 'marie',options:'Item',  label: __("Marie"), placeholder:__("Marie"),
					get_query: function() {
						return {
						filters:  [['Item', 'item_group', '=', 'Marie']] 
						}
				 	},	
				},
				{fieldtype: 'Section Break', fieldname: 'section2'},
				{fieldtype: 'HTML', 
					fieldname: 'accessories'},
				{fieldtype: 'Section Break', fieldname: 'section3'},
				{fieldtype: 'Data', 
					fieldname:'details', label: __("Details")},
				{fieldtype: 'Section Break', fieldname: 'section4'},
				{fieldtype: 'Button',
					fieldname: 'order_accessories', label: __("Order")},
				{fieldtype: "Column Break", fieldname: "cb3"},
				{fieldtype: 'Button',
					fieldname:'go_to_cupcake', label: __("Order & Go to Cupcake")}
			]
		});
	
		$(accessories_dialog.body).find("[data-fieldname='accessories']").html(frappe.render_template("pos_accessories", {data: "data"}))
		// this.save_button(accessories_dialog, item_name);
		this.order_accessories_button(accessories_dialog, item_name);
		accessories_dialog.show();
	},
	search_item_acc_item_group: function (accessories_dialog, item_group){
		frappe.call({
			method:"bakery_store.customization.customization.search_item_acc_item_group",
			args: {
				item_group: item_group
			},
			callback: function(r){
				if(r.message){
					console.log(JSON.stringify(r.message))
					$(accessories_dialog.body).find("input").autocomplete({
              		 source: r.message,
					 autoFocus:true
         		   });
				
				}
			}
		})

	},

	order_accessories_button: function(dialog, item_name) {
		var item_names = [item_name.split(":")[0].trim()]
		var item_size = [item_name.split(":")[1].trim()]
		var also_me = this;
		$(dialog.body).find("input[data-fieldtype='Link']").on("change", function() {
		var me = this;
		var item_code = $(this).val()
		var item_group = $(this).attr("placeholder")
		if(item_code){
			frappe.call({
			method:"bakery_store.customization.customization.accessories_item",
			args: {
				item_code: item_code,
				item_group: item_group
			},
			callback: function(r){
				if(r.message){
					// console.log(JSON.stringify(r.message[0]['rate']))
					var size = "Medium"
					item_names.push(item_code)
					item_size.push(size)
					$(dialog.body).find("[data-fieldtype='HTML']").find("table").append('<tr  data-item-code='+ $(me).val() + ' data-item-size='+ size +'>\
						<td>'+$(me).val()+'</td>\
						<td><input class="input-with-feedback form-control" type="text" name='+ $(me).attr("placeholder") +' value='+1+'> </td>\
						<td>'+r.message[0]['rate']+'</td>\
						<td class="remove">x</td></tr>')
					$(me).val("");
					$(dialog.body).find("[data-fieldtype='HTML']").find("table tr[data-item-code]").find(".remove").on("click", function () {
						// item_names.pop()
						var item_to_remove = $(this).parent().attr('data-item-code');
						var size_to_remove = $(this).parent().attr('data-item-size');
						item_names.pop(item_to_remove);
						item_size.pop(size_to_remove);
						$(this).parent().remove();
					})
					}
				}
			})
		// $(dialog.body).find("button[data-fieldname='order_accessories']").on("click", function () {
		// 	if(item_name){
		// 		console.log("data111")
		// 		console.log(item_names)
		// 		console.log(item_size)
		// 		for (i=0 ; i<item_names.length ; i++) {
		// 			console.log(item_names[i])
		// 			console.log(item_size[i])
		// 			also_me.add_to_cart(item_names[i], "", item_size[i]);
		// 			}
		// 		dialog.hide();
		// 		}
		// 	}) 
		}
	});
		$(dialog.body).find("button[data-fieldname='order_accessories']").on("click", function () {
			if(item_name){
				console.log("data111")
				console.log(item_names)
				console.log(item_size)
				for (i=0 ; i<item_names.length ; i++) {
					console.log(item_names[i])
					console.log(item_size[i])
					also_me.add_to_cart(item_names[i], "", item_size[i]);
					}
				dialog.hide();
				}
			}) 
	},

	save_button: function(dialog, item_name) {
		var me = this;
		dialog.set_primary_action(__("Save"), function() {
			// $(dialog.body).find("[data-fieldname='order_accessories']").on("click", function() {
			if(item_name){
				console.log("data111")
				me.add_to_cart(item_name.split(":")[0].trim(), "", item_name.split(":")[1].trim());
			}
		// });
			 me.refresh();
		})
	},


	//end
	add_to_cart: function(item_code, serial_no, size) {
		var me = this;
		var caught = false;

		if(!me.frm.doc[me.party.toLowerCase()] && ((me.frm.doctype == "Quotation" &&
				me.frm.doc.quotation_to == "Customer")
				|| me.frm.doctype != "Quotation")) {
			msgprint(__("Please select {0} first.", [me.party]));
			return;
		}

		// get no_of_items
		var no_of_items = me.wrapper.find(".pos-bill-item").length;

		// check whether the item is already added
		if (no_of_items != 0) {
			$.each(this.frm.doc["items"] || [], function(i, d) {
				if (d.item_code == item_code & d.size == size) {
					caught = true;
					if (serial_no)
						frappe.model.set_value(d.doctype, d.name, "serial_no", d.serial_no + '\n' + serial_no);
					else
						frappe.model.set_value(d.doctype, d.name, "qty", d.qty + 1);
				}
			});
		}

		// if item not found then add new item
		if (!caught)
			this.add_new_item_to_grid(item_code, serial_no, size);

		this.refresh();
		this.refresh_search_box();
	},
	add_new_item_to_grid: function(item_code, serial_no, size) {
		var me = this;

		var child = frappe.model.add_child(me.frm.doc, this.frm.doctype + " Item", "items");
		child.item_code = item_code;
		child.size = size;
		child.qty = 1;

		if (serial_no)
			child.serial_no = serial_no;

		this.frm.script_manager.trigger("item_code", child.doctype, child.name);
		frappe.after_ajax(function() {
			me.frm.script_manager.trigger("qty", child.doctype, child.name);
		})
	},
	refresh_search_box: function() {
		var me = this;

		// Clear Item Box and remake item list
		if (this.search.$input.val()) {
			this.search.set_input("");
			this.make_item_list();
		}
	},
	update_qty: function(item_code, qty, size) {
		var me = this;
		$.each(this.frm.doc["items"] || [], function(i, d) {
			if (d.item_code == item_code && d.size == size) {
				if (qty == 0) {
					frappe.model.clear_doc(d.doctype, d.name);
					me.refresh_grid();
				} else {
					frappe.model.set_value(d.doctype, d.name, "qty", qty);
				}
			}
		});
		this.refresh();
	},
	refresh: function() {
		var me = this;

		this.refresh_item_list();
		this.refresh_fields();

		// if form is local then only run all these functions
		if (this.frm.doc.docstatus===0) {
			this.call_when_local();
		}

		this.disable_text_box_and_button();
		this.set_primary_action();

		// If quotation to is not Customer then remove party
		if (this.frm.doctype == "Quotation" && this.frm.doc.quotation_to!="Customer") {
			this.party_field.$input.prop("disabled", true);
		}
	},
	refresh_fields: function() {
		this.party_field.set_input(this.frm.doc[this.party.toLowerCase()]);
		this.party_field.frm = this.frm;
		this.party_field.doctype = this.frm.doctype;
		this.party_field.docname = this.frm.docname;

		this.wrapper.find('input.discount-percentage').val(this.frm.doc.additional_discount_percentage);
		this.wrapper.find('input.discount-amount').val(this.frm.doc.discount_amount);

		this.show_items_in_item_cart();
		this.show_taxes();
		this.set_totals();
	},
	refresh_item_list: function() {
		var me = this;
		// refresh item list on change of price list
		if (this.frm.doc[this.price_list_field] != this.price_list) {
			this.price_list = this.frm.doc[this.price_list_field];
			this.make_item_list();
		}
	},
	show_items_in_item_cart: function() {
		var me = this;
		var $items = this.wrapper.find(".items").empty();

		$.each(this.frm.doc.items|| [], function(i, d) {
			$(frappe.render_template("pos_bill_item", {
				item_code: d.item_code,
				item_name: (d.item_name===d.item_code || !d.item_name) ? "" : ("<br>" + d.item_name),
				qty: d.qty,
				description:  d.description && d.size ?  (d.description + " "+ d.size) : "",
				size: d.size,
				actual_qty: d.actual_qty,
				projected_qty: d.projected_qty,
				rate: format_currency(d.rate, me.frm.doc.currency),
				amount: format_currency(d.amount, me.frm.doc.currency)
			})).appendTo($items);
		});

		this.wrapper.find("input.pos-item-qty").on("focus", function() {
			$(this).select();
		});
	},
	show_taxes: function() {
		var me = this;
		var taxes = this.frm.doc["taxes"] || [];
		$(this.wrapper)
			.find(".tax-area").toggleClass("hide", (taxes && taxes.length) ? false : true)
			.find(".tax-table").empty();

		$.each(taxes, function(i, d) {
			if (d.tax_amount) {
				$(frappe.render_template("pos_tax_row", {
					description: d.description,
					tax_amount: format_currency(flt(d.tax_amount)/flt(me.frm.doc.conversion_rate),
						me.frm.doc.currency)
				})).appendTo(me.wrapper.find(".tax-table"));
			}
		});
	},
	set_totals: function() {
		var me = this;
		this.wrapper.find(".net-total").text(format_currency(me.frm.doc["net_total"], me.frm.doc.currency));
		this.wrapper.find(".grand-total").text(format_currency(me.frm.doc.grand_total, me.frm.doc.currency));
	},
	call_when_local: function() {
		var me = this;

		// append quantity to the respective item after change from input box
		$(this.wrapper).find("input.pos-item-qty").on("change", function() {
			var item_code = $(this).parents(".pos-bill-item").attr("data-item-code");
			var size = $(this).parents(".pos-bill-item").attr("data-item-size");
			me.update_qty(item_code, $(this).val(), size);
		});

		// increase/decrease qty on plus/minus button
		$(this.wrapper).find(".pos-qty-btn").on("click", function() {
			var $item = $(this).parents(".pos-bill-item:first");
			me.increase_decrease_qty($item, $(this).attr("data-action"));
		});

		this.focus();
	},
	focus: function() {
		if(this.frm.doc[this.party.toLowerCase()]) {
			this.search.$input.focus();
		} else {
			if(!(this.frm.doctype == "Quotation" && this.frm.doc.quotation_to!="Customer"))
				this.party_field.$input.focus();
		}
	},
	increase_decrease_qty: function($item, operation) {
		var item_code = $item.attr("data-item-code");
		var size = $item.attr("data-item-size");
		var item_qty = cint($item.find("input.pos-item-qty").val());

		if (operation == "increase-qty")
			this.update_qty(item_code, item_qty + 1, size);
		else if (operation == "decrease-qty" && item_qty != 0)
			this.update_qty(item_code, item_qty - 1, size);
	},
	disable_text_box_and_button: function() {
		var me = this;
		// if form is submitted & cancelled then disable all input box & buttons
		$(this.wrapper)
			.find(".pos-qty-btn")
			.toggle(this.frm.doc.docstatus===0);

		$(this.wrapper).find('input, button').prop("disabled", !(this.frm.doc.docstatus===0));

		this.wrapper.find(".pos-item-area").toggleClass("hide", me.frm.doc.docstatus!==0);

	},
	set_primary_action: function() {
		var me = this;
		if (this.frm.page.current_view_name==="main") return;

		if (this.frm.doctype == "Sales Invoice" && this.frm.doc.docstatus===0) {
			if (!this.frm.doc.is_pos) {
				this.frm.set_value("is_pos", 1);
			}
			this.frm.page.set_primary_action(__("Pay"), function() {
				me.make_payment();
			});
			this.frm.page.set_secondary_action(__("Place order"), function() {
				// me.save();
				// cur_frm.save();
				// cur_frm.
				cur_frm.set_value("is_pos",0)
				cur_frm.savesubmit(this);
			});
		} else if (this.frm.doc.docstatus===1) {
			this.frm.page.set_primary_action(__("New"), function() {
				erpnext.open_as_pos = true;
				new_doc(me.frm.doctype);
			});
		}
	},
	refresh_delete_btn: function() {
		$(this.wrapper).find(".remove-items").toggle($(".item-cart .warning").length ? true : false);
	},
	remove_selected_items: function() {
		var me = this;
		var selected_items = [];
		var no_of_items = $(this.wrapper).find("#cart tbody tr").length;
		for(var x=0; x<=no_of_items - 1; x++) {
			var row = $(this.wrapper).find("#cart tbody tr:eq(" + x + ")");
			if(row.attr("data-selected") == "true") {
				selected_items.push(row.attr("id"));
			}
		}

		var child = this.frm.doc["items"] || [];

		$.each(child, function(i, d) {
			for (var i in selected_items) {
				if (d.item_code == selected_items[i]) {
					frappe.model.clear_doc(d.doctype, d.name);
				}
			}
		});

		this.refresh_grid();
	},
	refresh_grid: function() {
		this.frm.dirty();
		this.frm.fields_dict["items"].grid.refresh();
		this.frm.script_manager.trigger("calculate_taxes_and_totals");
		this.refresh();
	},
	with_modes_of_payment: function(callback) {
		var me = this;
		if(me.modes_of_payment) {
			callback();
		} else {
			me.modes_of_payment = [];
			$.ajax("/api/resource/Mode of Payment").success(function(data) {
				$.each(data.data, function(i, d) { me.modes_of_payment.push(d.name); });
				callback();
			});
		}
	},
	make_payment: function() {
		var me = this;
		var no_of_items = this.frm.doc.items.length;

		if (no_of_items == 0)
			msgprint(__("Payment cannot be made for empty cart"));
		else {

			this.with_modes_of_payment(function() {
				// prefer cash payment!
				var default_mode = me.frm.doc.mode_of_payment ? me.frm.doc.mode_of_payment :
					me.modes_of_payment.indexOf(__("Cash"))!==-1 ? __("Cash") : undefined;

				// show payment wizard
				var dialog = new frappe.ui.Dialog({
					width: 400,
					title: 'Payment',
					fields: [
						{fieldtype:'Currency',
							fieldname:'total_amount', label: __('Total Amount'),
							"default": me.frm.doc.grand_total},
						{fieldtype:'Select', fieldname:'mode_of_payment',
							label: __('Mode of Payment'),
							options: me.modes_of_payment.join('\n'), reqd: 1,
							"default": default_mode},
						{fieldtype:'Currency', fieldname:'paid_amount', label:__('Amount Paid'),
							reqd:1, "default": me.frm.doc.grand_total,
							change: function() {
								var values = dialog.get_values();

								var actual_change = flt(values.paid_amount - values.total_amount,
									precision("paid_amount"));

								if (actual_change > 0) {
									var rounded_change =
										round_based_on_smallest_currency_fraction(actual_change,
											me.frm.doc.currency, precision("paid_amount"));
								} else {
									var rounded_change = 0;
								}

								dialog.set_value("change", rounded_change);
								dialog.get_input("change").trigger("change");

							}},
						{fieldtype:'Currency', fieldname:'change', label: __('Change'),
							"default": 0.0, hidden: 1, change: function() {
								var values = dialog.get_values();
								var write_off_amount = (flt(values.paid_amount) - flt(values.change)) - values.total_amount;
								dialog.get_field("write_off_amount").toggle(write_off_amount);
								dialog.set_value("write_off_amount", write_off_amount);
							}
						},
						{fieldtype:'Currency', fieldname:'write_off_amount',
							label: __('Write Off'), "default": 0.0, hidden: 1},
					]
				});
				me.dialog = dialog;
				dialog.show();

				// make read only
				dialog.get_input("total_amount").prop("disabled", true);
				dialog.get_input("write_off_amount").prop("disabled", true);

				// toggle amount paid and change
				dialog.get_input("mode_of_payment").on("change", function() {
					var is_cash = dialog.get_value("mode_of_payment") === __("Cash");
					dialog.get_field("paid_amount").toggle(is_cash);
					dialog.get_field("change").toggle(is_cash);

					if (is_cash && !dialog.get_value("change")) {
						// set to nearest 5
						dialog.set_value("paid_amount", dialog.get_value("total_amount"));
						dialog.get_input("paid_amount").trigger("change");
					} else if (!is_cash) {
						dialog.set_value("paid_amount", dialog.get_value("total_amount"));
						dialog.set_value("change", 0);
					}
				}).trigger("change");

				me.set_pay_button(dialog);
			});
		}
	},
	set_pay_button: function(dialog) {
		var me = this;
		dialog.set_primary_action(__("Pay"), function() {
			var values = dialog.get_values();
			var is_cash = values.mode_of_payment === __("Cash");
			if (!is_cash) {
				values.write_off_amount = values.change = 0.0;
				values.paid_amount = values.total_amount;
			}
			me.frm.set_value("mode_of_payment", values.mode_of_payment);

			var paid_amount = flt((flt(values.paid_amount) - flt(values.change)), precision("paid_amount"));
			me.frm.set_value("paid_amount", paid_amount);

			// specifying writeoff amount here itself, so as to avoid recursion issue
			me.frm.set_value("write_off_amount", me.frm.doc.grand_total - paid_amount);
			me.frm.set_value("outstanding_amount", 0);

			me.frm.savesubmit(this);
			dialog.hide();
		})

	}
});

erpnext.pos.make_pos_btn = function(frm) {
	frm.page.add_menu_item(__("{0} View", [frm.page.current_view_name === "pos" ? "Form" : "Point-of-Sale"]), function() {
		erpnext.pos.toggle(frm);
	});

	if(frm.pos_btn) return;

	// Show POS button only if it is enabled from features setup
	if (cint(sys_defaults.fs_pos_view)!==1 || frm.doctype==="Material Request") {
		return;
	}

	if(!frm.pos_btn) {
		frm.pos_btn = frm.page.add_action_icon("icon-th", function() {
			erpnext.pos.toggle(frm);
		});
	}

	if(erpnext.open_as_pos && frm.page.current_view_name !== "pos") {
		erpnext.pos.toggle(frm, true);
	}
}

erpnext.pos.toggle = function(frm, show) {
	// Check whether it is Selling or Buying cycle
	var price_list = frappe.meta.has_field(cur_frm.doc.doctype, "selling_price_list") ?
		frm.doc.selling_price_list : frm.doc.buying_price_list;

	if(show!==undefined) {
		if((show===true && frm.page.current_view_name === "pos")
			|| (show===false && frm.page.current_view_name === "main")) {
			return;
		}
	}

	if(frm.page.current_view_name!=="pos") {
		// before switching, ask for pos name
		if(!price_list) {
			frappe.throw(__("Please select Price List"));
		}

		if(!frm.doc.company) {
			frappe.throw(__("Please select Company"));
		}
	}

	// make pos
	if(!frm.pos) {
		var wrapper = frm.page.add_view("pos", "<div>");
		frm.pos = new erpnext.pos.PointOfSale(wrapper, frm);
	}

	// toggle view
	frm.page.set_view(frm.page.current_view_name==="pos" ? "main" : "pos");

	frm.toolbar.current_status = null;
	frm.refresh();

	// refresh
	if(frm.page.current_view_name==="pos") {
		frm.pos.refresh();
	}
}
