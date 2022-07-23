# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.exceptions import UserError


class SaleAdvancePosOrder(models.TransientModel):
    _inherit = "sale.advance.pos.order"

    def _get_default_serie_id(self):
        active_id = self.env.context.get('active_id')
        serie_id = False
        if active_id:
            order_id = self.env['sale.order'].browse(active_id)
            if order_id.partner_id.l10n_latam_identification_type_id.l10n_pe_vat_code in ["6"]:
                serie_id = self.env['it.invoice.serie'].search([('company_id', '=', order_id.company_id.id),
                                                                 ('pe_invoice_code',
                                                                  '=', '01'),
                                                                 ('type', '=', 'sale')], limit=1)
                if serie_id:
                    serie_id = serie_id
            else:
                serie_id = self.env['it.invoice.serie'].search([('company_id', '=', order_id.company_id.id),
                                                                 ('pe_invoice_code',
                                                                  '=', '03'),
                                                                 ('type', '=', 'sale')], limit=1)
                serie_id = serie_id or False
        return serie_id

    serie_id = fields.Many2one('it.invoice.serie', string='Serie',   required=True,
                                 domain="[('pe_invoice_code','in',['01','03'])]",
                                 default=_get_default_serie_id)
    serie_ids = fields.Many2many(
        "it.invoice.serie", string="Invoice Serie")

    def create_orders(self):
        this = self.with_context(invoice_serie_id=self.serie_id.id)
        res = super(SaleAdvancePosOrder, this).create_orders()
        return res
