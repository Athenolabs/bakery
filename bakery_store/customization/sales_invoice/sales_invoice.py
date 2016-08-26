# Copyright (c) 2016, Arpit Jain and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document


@frappe.whitelist()
def rate_of_item(item_code, size):
	query ="""SELECT chld.rate as rate 
	 	from 
	 		`tabItem` item,  
	 		(SELECT name, rate   from `tabBakery Price List` where parent = '{0}' and size ='{1}') as chld 
	 	where item.name = '{0}'""" .format(item_code, size)
	result =  frappe.db.sql(query, as_dict=1)
	if not result:
		result = frappe.db.sql("""SELECT rate from `tabItem` where name = '{0}'""".format(item_code), as_dict=1)
	print result,"data------------"
	return result

