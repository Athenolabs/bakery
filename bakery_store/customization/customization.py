# -*- coding: utf-8 -*-
# Copyright (c) 2016, Arpit Jain and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document


@frappe.whitelist()
def rate_of_item_depend_on_size(item_code):
	# query ="""SELECT name, size, rate , parent  from `tabBakery Price List` where parent = '{0}' order by rate desc""" .format(item_code)
	# data =  frappe.db.sql(query, as_dict=1)
	# return data

	query ="""SELECT chld.name as name, chld.size as size, chld.rate as rate, chld.parent as parent, item.image as image 
	 	from 
	 		`tabItem` item,  
	 		(SELECT name, size, rate , parent   from `tabBakery Price List` where parent = '{0}') as chld 
	 	where item.name = '{0}' order by chld.rate desc""" .format(item_code)
	data =  frappe.db.sql(query, as_dict=1)
	return data

@frappe.whitelist()
def search_item_acc_item_group(item_group):
	query = """SELECT name,  as abc_name from `tabItem` where item_group = '{0}' and has_variants != 1""" .format(item_group)
	return [x[0] for x in frappe.db.sql(query)]

	
@frappe.whitelist()
def accessories_item(item_code, item_group):
	query = """SELECT name, rate from `tabItem` where item_code = '{0}' and item_group = '{1}' and has_variants != 1""" .format(item_code, item_group)
	return frappe.db.sql(query, as_dict=1)

# @frappe.whitelist()
# def item_group():
# 	query = """SELECT name from `tabItem Group` where name = 'Fleurs'"""
# 	return frappe.db.sql(query, as_dict=1)

@frappe.whitelist()
def get_items(price_list, sales_or_purchase, item=None, item_group=None):
	condition = ""
	order_by = ""
	args = {"price_list": price_list}

	if sales_or_purchase == "Sales":
		condition = "i.is_sales_item=1"
	else:
		condition = "i.is_purchase_item=1"

	if item_group:
		condition += " and i.item_group = '%s'" %(item_group)

	if item:
		# search serial no
		item_code = frappe.db.sql("""select name as serial_no, item_code
			from `tabSerial No` where name=%s""", (item), as_dict=1)
		if item_code:
			item_code[0]["name"] = item_code[0]["item_code"]
			return item_code

		# search barcode
		item_code = frappe.db.sql("""select name, item_code from `tabItem`
			where barcode=%s""",
			(item), as_dict=1)
		if item_code:
			item_code[0]["barcode"] = item
			return item_code

		condition += " and ((CONCAT(i.name, i.item_name) like %(name)s) or (i.variant_of like %(name)s) or (i.item_group like %(name)s))"
		order_by = """if(locate(%(_name)s, i.name), locate(%(_name)s, i.name), 99999),
			if(locate(%(_name)s, i.item_name), locate(%(_name)s, i.item_name), 99999),
			if(locate(%(_name)s, i.variant_of), locate(%(_name)s, i.variant_of), 99999),
			if(locate(%(_name)s, i.item_group), locate(%(_name)s, i.item_group), 99999),"""
		args["name"] = "%%%s%%" % frappe.db.escape(item)
		args["_name"] = item.replace("%", "")
	data = 'Desserts'
	# locate function is used to sort by closest match from the beginning of the value
	return frappe.db.sql("""select i.name, i.item_name, i.image,
		item_det.price_list_rate, item_det.currency
		from `tabItem` i LEFT JOIN
			(select item_code, price_list_rate, currency from
				`tabItem Price`	where price_list=%(price_list)s) item_det
		ON
			(item_det.item_code=i.name or item_det.item_code=i.variant_of)
		where
			i.item_group NOT In('Sujet' ,'Fleurs', 'Marie') and
			i.has_variants = 0 and
			{condition}
		order by
			{order_by}
			i.name
		limit 24""".format(condition=condition, order_by=order_by), args, as_dict=1)

