# -*- coding: utf-8 -*-
from odoo import fields, models


class PosConfig(models.Model):
    _inherit = 'pos.config'

    # pe_invoice_journal_id = fields.Many2one(
    #     'account.journal', string='Sales Invoice Journal S', compute="_compute_pe_journal_id")
    # pe_voucher_journal_id = fields.Many2one(
    #     'account.journal', string='Voucher Journal', compute="_compute_pe_journal_id")
    # pe_auto_journal_select = fields.Boolean("Auto Select Journal")
    pe_invoice_serie_id = fields.Many2one(
        'it.invoice.serie', string='Sales Invoice Serie S', compute="_compute_pe_serie_id")
    pe_voucher_serie_id = fields.Many2one(
        'it.invoice.serie', string='Voucher Serie', compute="_compute_pe_serie_id")
    pe_auto_serie_select = fields.Boolean("Auto Select Serie")

    auto_download_order_in_json = fields.Boolean('Download Order JSON format', default=0)

    # @api.multi

    # def _compute_pe_journal_id(self):
    #     for config_id in self:
    #         config_id.pe_invoice_journal_id = self.env['account.journal'].search([('id', 'in', config_id.invoice_journal_ids.ids),
    #                                                                               ('pe_invoice_code', '=', '01')], limit=1).id
    #         config_id.pe_voucher_journal_id = self.env['account.journal'].search([('id', 'in', config_id.invoice_journal_ids.ids),
    #                                                                               ('pe_invoice_code', '=', '03')], limit=1).id

    def _compute_pe_serie_id(self):
        for config_id in self:
            config_id.pe_invoice_serie_id = self.env['it.invoice.serie'].search(
                [('id', 'in', config_id.invoice_serie_ids.ids),
                 ('pe_invoice_code', '=', '01')], limit=1).id
            config_id.pe_voucher_serie_id = self.env['it.invoice.serie'].search(
                [('id', 'in', config_id.invoice_serie_ids.ids),
                 ('pe_invoice_code', '=', '03')], limit=1).id
