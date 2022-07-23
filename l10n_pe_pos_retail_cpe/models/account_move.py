# -*- coding: utf-8 -*-
from odoo import models, fields


class AccountMove(models.Model):
    _inherit = 'account.move'

    def send_ebill_mass(self):
        moves = self.search(
            [('state', '=', 'posted'), ('sunat_state', '=', '0')])
        for record in moves:
            record.send_ebill()


class AccountInvoiceLine(models.Model):
    _inherit = 'account.move.line'

    def _get_computed_name(self):
        self.ensure_one()

        if not self.env.context.get('keep_product_name'):
            return super(AccountInvoiceLine, self)._get_computed_name()
        return self.name
