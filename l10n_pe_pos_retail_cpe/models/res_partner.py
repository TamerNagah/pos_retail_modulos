# -*- coding: utf-8 -*-

from odoo import api, fields, models
from dateutil import parser
import requests


class ResPartner(models.Model):
    _inherit = 'res.partner'

    doc_type = fields.Char(
        related="l10n_latam_identification_type_id.l10n_pe_vat_code")

    @api.model
    def get_partner_from_ui(self, doc_type=None, doc_number=None):
        url = None
        res = {}
        if doc_type == "1":
            url = "http://api.sistemerp.com/dni/%s/" % doc_number
        elif doc_type == "6":
            url = "http://api.sistemerp.com/ruc/%s/?force_update=1" % doc_number
        if url:
            try:
                response = requests.get(url)
            except Exception:
                reponse = False
            if response and response.status_code == 200:
                vals = response and response.json() or {'detail': "Not found."}
                res = vals
        return res

    @api.model
    def create_from_ui(self, partner):
        if partner.get('last_update', False):
            last_update = partner.get('last_update', False)
            if len(last_update) == 27:
                partner['last_update'] = fields.Datetime.to_string(
                    parser.parse(last_update))
        if partner.get('is_validate', False):
            if partner.get('is_validate', False) == 'true':
                partner['is_validate'] = True
            else:
                partner['is_validate'] = False
        if not partner.get('state', False):
            partner['state'] = 'ACTIVO'
        if not partner.get('condition', False):
            partner['condition'] = 'HABIDO'
        if len(partner.get('vat', '')) == 11:
            partner['company_type'] = "company"
        if partner.get('l10n_latam_identification_type_id', False):
            partner['l10n_latam_identification_type_id'] = int(partner.get(
                'l10n_latam_identification_type_id'))

        partner['is_customer'] = True
        partner['customer_rank'] = 1

        pe_country_id = self.env["res.country"].search([("code", "=", "PE")])
        partner['country_id'] = pe_country_id.id

        states = self.env["res.country.state"].search([("country_id", "=", pe_country_id.id)])
        if not states:
            partner.pop('state_id')
            partner.pop('province_id')
            partner.pop('district_id')
        else:
            partner['state_id'] = states.filtered(lambda l: l.code == partner['state_id']).id
            partner['province_id'] = states.filtered(lambda l: l.code == partner['province_id']).id

            partner['zip'] = partner['district_id']
            partner['district_id'] = states.filtered(lambda l: l.code == partner['district_id']).id

        res = super(ResPartner, self).create_from_ui(partner)
        return res
