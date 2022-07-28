from odoo import models, fields, api

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


