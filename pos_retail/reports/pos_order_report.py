# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models


class ReportPosOrder(models.Model):
    _inherit = 'report.pos.order'

#     margin = fields.Float('Margin')
#     pos_branch_id = fields.Many2one('pos.branch', 'Branch')
#     seller_id = fields.Many2one('res.users', 'Sale Man')
#     analytic_account_id = fields.Many2one(
#         'account.analytic.account',
#         'Analytic Account'
#     )
#     purchased_quantity = fields.Integer('Purchased Quantity')
    product_qty = fields.Integer('Sold Quantity', readonly=True)
#     qty_available = fields.Float('Qty On Hand')
#
#     def _select(self):
#         return super(ReportPosOrder,
#                      self)._select() + ", SUM(l.margin) AS margin, l.pos_branch_id as pos_branch_id, l.user_id as seller_id, l.analytic_account_id as analytic_account_id, SUM(pol.product_qty) as purchased_quantity, SUM(sq.quantity) as qty_available"
#
#     def _group_by(self):
#         return super(ReportPosOrder, self)._group_by() + ", l.pos_branch_id, l.user_id, l.analytic_account_id"
#
#     def _from(self):
#         self.env.cr.execute("""
#                             select * from stock_location as sl where sl.usage='internal' and sl.company_id=%s""" % self.env.user.company_id.id)
#         location_ids = [l[0] for l in self.env.cr.fetchall()]
#         if len(location_ids) <= 1:
#             location_ids.append(0)
#         return super(ReportPosOrder,
#                      self)._from() + " LEFT JOIN purchase_order_line pol ON (l.product_id=pol.product_id) LEFT JOIN stock_quant sq ON (l.product_id=sq.product_id AND sq.location_id IN %s and sq.company_id=s.company_id)" % (
#                    tuple(location_ids),)
