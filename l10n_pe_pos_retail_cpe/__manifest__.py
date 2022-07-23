# -*- coding: utf-8 -*-
{
    'name': "Peruvian POS  Retail",

    'summary': """
        Peruvian Management POS Retail""",

    'description': """
        Peruvian Management POS Retail
    """,

    'author': "E&M",
    'website': "https://www.eymperu.net",
    'category': 'Localization/Peruvian',
    'version': '0.1',
    'depends': [
        'account',
        'point_of_sale',
        'amount_to_text',
        'pos_journal_sequence',
        'l10n_pe_vat',
        'pos_ticket_extend',
        'sale_pos',
        'l10n_pe_cpe',
        'pos_refund',
        'pos_retail'
    ],

    # always loaded
    'data': [
        'data/ir_cron.xml',
        'wizard/sale_make_order_advance_views.xml',
        'wizard/pos_recover_wizard_view.xml',
        'views/pos_order_view.xml',
        'views/pos_config_view.xml',

        'views/l10n_pe_pos_templates.xml',
    ],
    'qweb': [
        'static/src/xml/pos.xml'
    ],
}
