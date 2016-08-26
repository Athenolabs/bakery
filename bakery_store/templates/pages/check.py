from __future__ import unicode_literals
import frappe

@frappe.whitelist(allow_guest=True)
def User():
	query = "select `name`, `first_name`, `email` from `tabUser`"
	data = frappe.db.sql(query, as_dict=1)
	return data