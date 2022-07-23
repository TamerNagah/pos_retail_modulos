odoo.define('l10n_pe_pos_cpe.l10n_pe_pos_cpe', function (require) {
    'use strict';

    var screen_receipt = require('pos_retail.screen_receipt');
    var pos_journal_sequence = require('pos_journal_sequence.pos_journal_sequence');
    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var PosDB = require('point_of_sale.DB');
    var core = require('web.core');

    var _t = core._t;

    var PosModelSuper = models.PosModel;
    var PosDBSuper = PosDB;
    var OrderSuper = models.Order;

    models.load_fields('res.company', ['sunat_amount']);

    models.Order = models.Order.extend({
        initialize: function (attributes, options) {
            var res = OrderSuper.prototype.initialize.apply(this, arguments);
            this.pe_invoice_date = false;
            return res;
        }, check_pe_serie: function () {
            var client = this.get_client();
            var doc_type = client ? client.doc_type : false;
            var serie_id = this.get_sale_serie();
            if (!serie_id && this.pos.config.pe_auto_serie_select) {
                if (doc_type == '6') {
                    if (this.pos.config.pe_invoice_serie_id) {
                        this.set_sale_serie(this.pos.config.pe_invoice_serie_id[0]);
                    }
                } else {
                    if (this.pos.config.pe_voucher_serie_id) {
                        this.set_sale_serie(this.pos.config.pe_voucher_serie_id[0]);
                    }
                }
            }
        }, get_cpe_type: function () {
            var serie_id = this.get_sale_serie();
            if (!serie_id) {
                return false;
            }
            var serie = this.pos.db.get_serie_id(serie_id);
            return serie ? serie.pe_invoice_code : false;

        }, get_cpe_qr: function () {
            var res = []
            res.push(this.pos.company.vat && this.pos.company.vat.slice(3, this.pos.company.vat.length) || '');
            res.push(this.get_cpe_type() || ' ');
            res.push(this.get_number() || ' ');
            res.push(this.get_total_tax() || 0.0);
            res.push(this.get_total_with_tax() || 0.0);
            res.push(moment(new Date().getTime()).format('YYYY-MM-DD'));
            res.push(this.get_doc_type() || '-');
            res.push(this.get_doc_number() || '-');
            var qr_string = res.join('|');
            return qr_string;
        }, export_as_JSON: function () {
            var res = OrderSuper.prototype.export_as_JSON.apply(this, arguments);

            res['pe_invoice_date'] = this.pe_invoice_date //moment(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss');
            return res;
        },
    });

    screens.ReceiptScreenWidget.include({
        render_receipt: function () {
            var order = this.pos.get('selectedOrder');
            this._super();
            if (order.get_cpe_type()) {
                var qr_string = order.get_cpe_qr();
                var qrcode = new QRCode(document.getElementById('qr-code'), {
                    width: 128, height: 128, correctLevel: QRCode.CorrectLevel.Q
                });
                qrcode.makeCode(qr_string);

                if (this.pos.config.auto_download_order_in_json) {
                    var blob = new Blob([JSON.stringify(order.export_as_JSON())], {type: 'text/plain;charset=utf-8'});
                    saveAs(blob, order.number + '.json');
                }
            }
        }
    });
});
