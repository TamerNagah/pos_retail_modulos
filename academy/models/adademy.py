from msilib import sequence
import re
import calendar
from unicodedata import name
from odoo import models, fields, api
from odoo.tools.translate import _
from odoo.tools import DEFAULT_SERVER_DATE_FORMAT
from odoo.exceptions import UserError, ValidationError
from dateutil.relativedelta import relativedelta

class IdiomaEstandar(models.Model):
    
    _name = 'standard.idioma'
    _description = 'Idioma estandar para el estudiante'

    name = fields.Char('Nombre', required=True)
    code = fields.Char('Idioma', required=True)
    description = fields.Text('Descripcion')
    
class ClaseClase(models.Model):
    
    _name = 'clase.clase'
    _description = 'Clase de los estudiantes'
    
    name = fields.Char("Nombre clase") 


