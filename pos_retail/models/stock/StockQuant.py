# -*- coding: utf-8 -*-
from odoo import fields, api, models

import logging
import json

_logger = logging.getLogger(__name__)


class StockQuant(models.Model):
    _inherit = "stock.quant"

    # def send_notification_pos(self, product_ids):
    #     sessions = self.env['pos.session'].sudo().search([
    #         ('state', '=', 'opened'),
    #         ('config_id.display_onhand', '=', True)
    #     ])
    #     for session in sessions:
    #         self.env['bus.bus'].sendmany(
    #             [[(self.env.cr.dbname, 'pos.sync.stock', session.user_id.id), json.dumps({
    #                 'product_ids': product_ids,
    #             })]])
    #     return True

    # @api.model
    # def create(self, vals):
    #     quant = super(StockQuant, self).create(vals)
    #     self.send_notification_pos([quant.product_id.id])
    #     return quant
    #
    # def write(self, vals):
    #     res = super(StockQuant, self).write(vals)
    #     product_ids = []
    #     for quant in self:
    #         product_ids.append(quant.product_id.id)
    #     if len(product_ids) > 0:
    #         self.send_notification_pos(product_ids)
    #     return res

    @api.model
    def create(self, vals):
        quant = super(StockQuant, self).create(vals)
        lastTrackingNotes = quant.product_id.tracking_stock
        if not lastTrackingNotes:
            lastTrackingNotes = ''
        location = self.env['stock.location'].browse(vals.get('location_id'))
        lastTrackingNotes += '\n--------------------------------\n'
        lastTrackingNotes += '%s Created at %s' % (self.env.user.login, fields.Datetime.to_string(quant.create_date))
        lastTrackingNotes += ' - of location: %s' % location.name
        lastTrackingNotes += ' - with quantity: %s' % quant.quantity
        lastTrackingNotes += ' - with reserved quantity: %s' % quant.reserved_quantity
        quant.product_id.write({'tracking_stock': lastTrackingNotes})
        return quant

    def write(self, vals):
        res = super(StockQuant, self).write(vals)
        for quant in self:
            if vals.get('quantity', None) or vals.get('inventory_quantity', None):
                lastTrackingNotes = quant.product_id.tracking_stock
                if not lastTrackingNotes:
                    lastTrackingNotes = ''
                lastTrackingNotes += '\n--------------------------------\n'
                lastTrackingNotes += '%s Updated at %s' % (self.env.user.login, fields.Datetime.to_string(quant.create_date))
                lastTrackingNotes += ' - of location: %s' % quant.location_id.name
                lastTrackingNotes += ' - with quantity: %s' % quant.quantity
                lastTrackingNotes += ' - with reserved quantity: %s' % quant.reserved_quantity
                quant.product_id.write({'tracking_stock': lastTrackingNotes})
        return res

    def unlink(self):
        for quant in self:
            lastTrackingNotes = quant.product_id.tracking_stock
            if not lastTrackingNotes:
                lastTrackingNotes = ''
            lastTrackingNotes += '\n--------------------------------\n'
            lastTrackingNotes += '%s Removed at %s' % (self.env.user.login, fields.Datetime.to_string(quant.create_date))
            lastTrackingNotes += ' - of location: %s' % quant.location_id.name
            lastTrackingNotes += ' - with quantity: %s' % quant.quantity
            lastTrackingNotes += ' - with reserved quantity: %s' % quant.reserved_quantity
            quant.product_id.write({'tracking_stock': lastTrackingNotes})
        return super(StockQuant, self).unlink()
