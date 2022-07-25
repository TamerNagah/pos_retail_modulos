# -*- coding: utf-8 -*-

from tkinter import W
from odoo import models, fields, api


class Curso(models.Model):
    
    _name = 'academia.curso'
    _description = 'Descripción del cursos'

    title = models.CharField(required=True, help='Titulo del curso')
    description = models.TextField(required=True, help='Edad del usuario')
    responsable = models.Many2one('res.users', help='Responsable del curso', required=True)
    start_date = models.DateField(help='Fecha de inicio del curso')
    finish_date = models.DateField(help='Fecha de fin del curso')
    
    
class Sesion(models.Model):
    _name = 'academia.sesion'
    _description = 'Descripción de las sesiones'
    
    curso = models.Many2one('academia.curso', help='Curso de la sesion')
    instructor = models.Many2one('res.users', help='Instructor del curso')        