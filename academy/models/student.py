import time
import base64
from datetime import date
from odoo import models, fields, api, _
from odoo.modules import get_module_resource
from odoo.exceptions import UserError, ValidationError

class StudentStudent(models.Model):
    """Clase estudiante que hereda de la clase abstracta User """
    
    _name = 'student.student'
    _description = 'Informacion del estudiante'
    
    # @api.model
    # def _default_image(self):
    #     '''Method to get default Image'''
    #     image_path = get_module_resource('hr', 'static/src/img',
    #                                      'default_alumno.jpg')
    #     return base64.b64encode(open(image_path, 'rb').read())    
    
    # photo = fields.Binary('Foto', default=_default_image)
    pid = fields.Char('ID del estudiante',help='Numero Personal de Identificacion')
    name = fields.Char('Nombres', required=True)
    last_name = fields.Char('Apellido', required=True)
    # academy = fields.Many2one('academy.academy', 'Academia')
    academy = fields.Char('Academia')
    # year = fields.Many2one('academy.year', 'Año')
    idioma = fields.Many2one('standard.idioma', 'Idioma')
    clase = fields.Many2one('clase.clase', 'Clase')
    
    phone = fields.Char('Telefono')
    email = fields.Char('Email')
    web_page = fields.Char('Pagina web')
    
    # general info
    gender = fields.Selection([('masculino', 'Masculino'), ('femenino', 'Femenino')],
                              'Genero')
    
    remark = fields.Text('Notas')