"use strict";
odoo.define('l10n_pe_pos_retail_cpe.screen_payment', function (require) {

    var models = require('point_of_sale.models');
    var utils = require('web.utils');
    var field_utils = require('web.field_utils');
    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var round_di = utils.round_decimals;
    var retail_model = require('pos_retail.model');
    var retail_payment_screen = require('pos_retail.screen_payment');
    var load_models = require('pos_retail.load_models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var _t = core._t;

    screens.PaymentScreenWidget.include({
        _is_pos_order_paid: function (order) {
            var self = this;
            var doc_type = order.get_doc_type();
            var doc_number = order.get_doc_number();
            var is_validate = this.pos.validate_pe_doc(doc_type, doc_number);
            var cpe_type = order.get_cpe_type();


            if (!order.get_sale_serie()) {
                this.pos.gui.show_popup('confirm', {
                    title: _t('Warning'), body: _t('Debe seleccionar la serie')
                });
                return false;
            }

            if (this.pos.company.sunat_amount < order.get_total_with_tax() && !doc_type && !doc_number) {
                this.pos.gui.show_popup('confirm', {
                    'title': _t('An anonymous order cannot be invoiced'),
                    'body': _t('Debe seleccionar un cliente con RUC ó DNI válido antes de poder facturar su pedido.'),
                    confirm: function () {
                        self.pos.gui.show_screen('clientlist');
                    },
                });
                return false;
            }

            if (['1', '6'].indexOf(doc_type) !== -1 && !is_validate) {
                this.pos.gui.show_popup('confirm', {
                    'title': _t('Please select the Customer'),
                    'body': _t('Debe seleccionar un cliente con RUC ó DNI válido antes de poder facturar su pedido.'),
                    confirm: function () {
                        self.pos.gui.show_screen('clientlist');
                    },
                });
                return false;
            }

            if (cpe_type === '01' && doc_type === '1') {
                this.pos.gui.show_popup('confirm', {
                    'title': _t('Please select the Customer'),
                    'body': 'Debe seleccionar un cliente con RUC antes de poder facturar su pedido o cambie la serie seleccionada.',
                    confirm: function () {
                        self.pos.gui.show_screen('clientlist');
                    },
                });
                return false;
            }

            return this._super(order);
        }
    });
});