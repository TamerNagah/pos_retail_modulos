# -*- coding: utf-8 -*-
from odoo import models, fields, tools, api


class product_quantity_available_report(models.Model):
    _name = 'product.quantity.available.report'
    _description = "Product Quantity Available Report Each Location"

    _auto = False
    _rec_name = 'product_id'
    _order = 'product_id'

    location_id = fields.Many2one('stock.location', string='Location', readonly=1)
    product_id = fields.Many2one('product.product', string='Product', readonly=1)
    qty_available = fields.Float('Qty On Hand', readonly=1)

    def _query(self):
        select = """
        SELECT
            min(pp.id) AS id,
            sum(sq.quantity - sq.reserved_quantity) AS qty_available,
            sl.id AS location_id,
            pp.id AS product_id
        FROM
            stock_location sl
            LEFT JOIN stock_quant sq ON sq.location_id = sl.id
            LEFT JOIN product_product pp ON pp.id = sq.product_id
            LEFT JOIN product_template pt ON pp.product_tmpl_id = pt.id
        WHERE
            sl.usage = 'internal' 
            AND pt.type = 'product'
            AND sq.quantity != 0
            AND sq.reserved_quantity != 0
        GROUP BY
            sl.id,
            pp.id
        """
        return select

    def init(self):
        tools.drop_view_if_exists(self._cr, self._table)
        self._cr.execute("CREATE OR REPLACE VIEW %s AS (%s)" % (
            self._table, self._query()))
