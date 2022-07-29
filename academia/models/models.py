# -*- coding: utf-8 -*-
from odoo import models, fields, api

class Academia(models.Model):
    _name = 'academia.academia'
    _description = 'Este modulo es para la academia'
    _inherit = ['image.mixin']

    photo = fields.Binary("Foto")
    name = fields.Char(string="Nombre", required=True)
    description = fields.Text(string="Descripción")
    active = fields.Boolean(string="Activo", default=True)
    # Relaciones
    # profesor_ids = fields.One2many(
    #     'academia.profesor',
    #     'academia_id',
    #     string="Profesores"
    # )
    # alumno_ids = fields.One2many(
    #     'academia.alumno',
    #     'academia_id',
    #     string="Alumnos"
    # )
    # curso_ids = fields.One2many(
    #     'academia.curso',
    #     'academia_id',
    #     string="Cursos"
    # )