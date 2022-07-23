# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, tools


class StockReport(models.Model):
    _name = "report.stock"
    _description = "Point of Sale Stock Report"
    _auto = False

    product_id = fields.Many2one('product.product', string='Product', readonly=True)
    location_id = fields.Many2one('stock.location', string='Location', readonly=True)
    product_qty = fields.Integer('Sold Quantity', readonly=True)
    purchased_quantity = fields.Integer('Purchased Quantity', readonly=True)
    qty_available = fields.Integer('Qty On Hand', readonly=True)

