# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from . import __version__ as app_version

app_name = "bakery_store"
app_title = "Bakery Store"
app_publisher = "Arpit Jain"
app_description = "Bakery"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "arpit.j@indictranstech.com"
app_license = "MIT"

# Includes in <head>
# ------------------
app_include_js = "assets/js/bakery_store.min.js"
app_include_css = "assets/css/bakery_store.css"
# include js, css files in header of desk.html
# app_include_css = "/assets/bakery_store/css/bakery_store.css"
# app_include_js = "/assets/bakery_store/js/bakery_store.js"

# include js, css files in header of web template
# web_include_css = "/assets/bakery_store/css/bakery_store.css"
# web_include_js = "/assets/bakery_store/js/bakery_store.js"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Website user home page (by function)
# get_website_user_home_page = "bakery_store.utils.get_home_page"

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "bakery_store.install.before_install"
# after_install = "bakery_store.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "bakery_store.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"bakery_store.tasks.all"
# 	],
# 	"daily": [
# 		"bakery_store.tasks.daily"
# 	],
# 	"hourly": [
# 		"bakery_store.tasks.hourly"
# 	],
# 	"weekly": [
# 		"bakery_store.tasks.weekly"
# 	]
# 	"monthly": [
# 		"bakery_store.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "bakery_store.install.before_tests"

# Overriding Whitelisted Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "bakery_store.event.get_events"
# }

fixtures= ['Custom Script','Property Setter','Custom Field', 'Item Group']