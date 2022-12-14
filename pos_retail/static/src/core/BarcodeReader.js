"use strict";
odoo.define('pos_retail.BarcodeReader', function (require) {

    // **********************************************
    // **********************************************
    // **********************************************
    // **********************************************
    // Supported >= 2 millions datas products
    // **********************************************
    // **********************************************
    // **********************************************
    // **********************************************

    var BarcodeReader = require('point_of_sale.BarcodeReader');
    var utils = require('web.utils');
    var round_pr = utils.round_precision;
    var models = require('point_of_sale.models');
    var indexed_db = require('pos_retail.indexedDB');
    //
    var _super_BarcodeReader = BarcodeReader.prototype;
    BarcodeReader.include({
        scan: function (code) {
            console.warn('scan code: ' + code)
            if (code && this.pos.action_will_do_if_passing_security && this.pos.gui.has_popup() && this.pos.barcode_by_user[code]) {
                eval(this.pos.action_will_do_if_passing_security)
                this.pos.action_will_do_if_passing_security = null;
                this.pos.gui.close_popup()
                this.pos.gui.show_popup('dialog', {
                    title: 'Successfully',
                    body: 'Validated by: ' + this.pos.barcode_by_user[code]['name'],
                    color: 'success'
                })
                return true;
            }

            // var self = this;
            // self.code = code;
            // var index_list = ['bc_index', 'dc_index', 'name_index']
            // var max_sequence = this.pos.session.model_ids['product.product']['max_id'] / 100000 + 1;
            // $.when(indexed_db.search_by_index('product.product', max_sequence, index_list, code)).done(function (product) {
            //     if (product['id']) {
            //         var product_is_product_exist = self.pos.db.product_by_id[product['id']];
            //         if (!product_is_product_exist) {
            //             if (self.pos.server_version == 10) {
            //                 self.pos.db.add_products([product]);
            //             }
            //             if (self.pos.server_version == 11 || self.pos.server_version == 12) {
            //                 var using_company_currency = self.pos.config.currency_id[0] === self.pos.company.currency_id[0];
            //                 var conversion_rate = self.pos.currency.rate / self.pos.company_currency.rate;
            //                 self.pos.db.add_products(_.map([product], function (product) {
            //                     if (!using_company_currency) {
            //                         product.lst_price = round_pr(product.lst_price * conversion_rate, self.pos.currency.rounding);
            //                     }
            //                     product.categ = _.findWhere(self.pos.product_categories, {'id': product.categ_id[0]});
            //                     return new models.Product({}, product);
            //                 }));
            //             }
            //         }
            //     }
            // }).catch(function (error) {
            //     return self._super(code);
            // }).done(function () {
            //     return self._super(code);
            // })
            if (!code) {
                return this._super(code)
            }
            var current_screen = this.pos.gui.get_current_screen();
            if (current_screen == 'floors') { // TODO:  floors screen not allow scan, we get event from scanner and call barcode_error_action
                var parsed_result = this.barcode_parser.parse_barcode(code);
                var products_screen = this.pos.gui.screen_instances['products'].barcode_error_action(parsed_result);
            } else {
                this._super(code)
            }
        },
    });

});
