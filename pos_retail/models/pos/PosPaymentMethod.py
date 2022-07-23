# -*- coding: utf-8 -*-
from odoo import api, fields, models, _

class PosPaymentMethod(models.Model):
    _inherit = "pos.payment.method"

    is_customer_required = fields.Boolean('Is Customer Required')
