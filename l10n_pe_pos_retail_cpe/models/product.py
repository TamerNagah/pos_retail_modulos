from odoo import api, models
from odoo.exceptions import UserError

USERERROR_CATEG_ID = UserError('Debe asignar la Cuenta de Ingreso a la categoría del producto\n'
                               'El campo con incompleto se encuentra ubicado en la pestaña Información General:\n'
                               'Categoría de Producto > Propiedades de la cuenta > Cuenta de ingreso')

USERERROR_ACCOUNT_ID = UserError('El campo cuenta de ingreso ubicado en la pestaña Contabilidad '
                                 'tiene establecido un valor diferente al asignado en\n'
                                 'Categoría de Producto > Propiedades de la cuenta > Cuenta de ingreso')


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    @api.model
    def create(self, vals):
        if 'available_in_pos' in vals and vals['available_in_pos']:
            category = self.env['product.category'].search([('id', '=', vals['categ_id'])])
            if not category.property_account_income_categ_id:
                raise USERERROR_CATEG_ID
            else:
                if 'property_account_income_id' in vals and vals['property_account_income_id']:
                    if vals['property_account_income_id'] != category.property_account_income_categ_id:
                        raise USERERROR_ACCOUNT_ID

        return super(ProductTemplate, self).create(vals)

    def write(self, vals):
        if 'categ_id' in vals:
            categ_id = vals['categ_id']
        else:
            categ_id = self.categ_id.id

        if 'available_in_pos' in vals:
            if vals['available_in_pos']:
                category = self.env['product.category'].search([('id', '=', categ_id)])
                if not category.property_account_income_categ_id:
                    raise USERERROR_CATEG_ID
                else:
                    if 'property_account_income_id' in vals:
                        if vals['property_account_income_id']:
                            if vals['property_account_income_id'] != category.property_account_income_categ_id.id:
                                raise USERERROR_ACCOUNT_ID
                    else:
                        if self.property_account_income_id:
                            if self.property_account_income_id != category.property_account_income_categ_id:
                                raise USERERROR_ACCOUNT_ID
        elif self.available_in_pos:
            category = self.env['product.category'].search([('id', '=', categ_id)])
            if not category.property_account_income_categ_id:
                raise USERERROR_CATEG_ID
            else:
                if 'property_account_income_id' in vals:
                    if vals['property_account_income_id']:
                        if vals['property_account_income_id'] != category.property_account_income_categ_id.id:
                            raise USERERROR_ACCOUNT_ID
                else:
                    if self.property_account_income_id:
                        if self.property_account_income_id != category.property_account_income_categ_id:
                            raise USERERROR_ACCOUNT_ID

        return super(ProductTemplate, self).write(vals)
