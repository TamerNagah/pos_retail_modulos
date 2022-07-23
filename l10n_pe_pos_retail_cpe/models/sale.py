# -*- coding: utf-8 -*-
from odoo import api, fields, models, _


class SaleOrder(models.Model):
    _inherit = "sale.order"

    def prepare_pos_order(self):
        res = super(SaleOrder, self).prepare_pos_order()
        self.ensure_one()
        res['invoice_serie'] = self.env.context.get(
            'invoice_serie_id', False)
        return res