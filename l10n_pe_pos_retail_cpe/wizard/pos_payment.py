# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError


class PosMakePayment(models.TransientModel):
    _inherit = 'pos.make.payment'

    def check(self):
        order = self.env['pos.order'].browse(
            self.env.context.get('active_id', False))
        if order.pe_invoice_type == 'annul':
            context = dict(self.env.context)
            context['paid_on_line'] = False
            self = self.with_context(**context)
        res = super(PosMakePayment, self).check()
        if order.pe_invoice_type == 'annul':
            order.refund_invoice_id.sudo().button_annul()
            if order.refund_order_id.state in ["invoiced", "paid"]:
                order.refund_order_id.account_move = False
                order.refund_order_id.invoice_journal = order.session_id.config_id.journal_id.id
                order.refund_order_id.state = 'paid'
            order.refund_order_id.pe_invoice_type = 'annul'
        return res
