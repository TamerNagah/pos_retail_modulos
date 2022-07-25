# -*- coding: utf-8 -*-

from odoo import models, fields, api


class Curso(models.Model):
    
    _name = 'academia.curso'
    _description = 'Descripción del curssos'

    title = fields.Char(required=True, help='Titulo del curso')
    description = fields.Char(required=True, help='Edad del usuario')
    responsable = fields.Many2one('res.users', help='Responsable del curso', required=True)
    start_date = fields.Date(help='Fechaa de inicio del curso')
    finish_date = fields.Date(help='Fecha de fin del curso')
    
class Sesion(models.Model):
    _name = 'academia.sesion'
    _description = 'Descripción de las sesiones'
    
    curso = fields.Many2one('academia.curso', help='Curso de la sesion')
    instructor = fields.Many2one('res.users', help='Instructor del curso')     


class List(models.Model):
    _name = 'academia.list'
    _description = 'Descripción de la lista'
    
    lista = fields.Char('litsaaaa',help='Lista de la sesion')   
       