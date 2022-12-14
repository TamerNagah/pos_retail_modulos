"use strict";
odoo.define('pos_retail.screen_pos_orders', function (require) {

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var chrome = require('point_of_sale.chrome');
    var core = require('web.core');
    var _t = core._t;
    var gui = require('point_of_sale.gui');
    var rpc = require('pos.rpc');
    var qweb = core.qweb;
    var PopupWidget = require('point_of_sale.popups');
    var utils = require('web.utils');
    var round_pr = utils.round_precision;

    var PopUpShippingAddress = PopupWidget.extend({
        template: 'PopUpShippingAddress',
        init: function (parent, options) {
            this.options = options;
            this._super(parent, options);
        },
        show: function (options) {
            var self = this;
            this._super(options);
            this.$(".pos_signature").jSignature();
            this.signed = false;
            this.$(".pos_signature").bind('change', function (e) {
                self.signed = true;
            });
            this.$('.datetimepicker').datetimepicker({
                format: 'YYYY-MM-DD HH:mm:00',
                icons: {
                    time: "fa fa-clock-o",
                    date: "fa fa-calendar",
                    up: "fa fa-chevron-up",
                    down: "fa fa-chevron-down",
                    previous: 'fa fa-chevron-left',
                    next: 'fa fa-chevron-right',
                    today: 'fa fa-screenshot',
                    clear: 'fa fa-trash',
                    close: 'fa fa-remove'
                }
            });
        },
        click_confirm: function () {
            var self = this;
            var values = {};
            self.$('.booking_field').each(function (idx, el) {
                if (el.type == 'checkbox') {
                    if (el.checked) {
                        el.value = true
                    } else {
                        el.value = false
                    }
                }
                values[el.name] = el.value || false;
            });
            if (!values.name) {
                return self.wrong_input('input[name="name"]', '(*) Name is required');
            }
            if (!values.street) {
                return self.wrong_input('input[name="street"]', '(*) Street is required');
            }
            if (!values.phone && !values.mobile) {
                self.wrong_input('input[name="phone"]', '(*) Phone or Mobile is required');
                return self.wrong_input('input[name="mobile"]', '(*) Phone or Mobile is required');
            }
            var pricelist_id = null;
            var order = self.pos.get_order();
            var pricelist = order['pricelist'];
            if (!pricelist && this.pos.default_pricelist) {
                pricelist_id = this.pos.default_pricelist.id;
            }
            if (pricelist) {
                pricelist_id = pricelist.id;
            }
            values['property_product_pricelist'] = pricelist_id;
            var sign_datas = self.$(".pos_signature").jSignature("getData", "image");
            if (sign_datas && sign_datas[1]) {
                values['signature'] = sign_datas[1];
                order['signature'] = values['signature'];
            }
            if (this.options.confirm) {
                this.options.confirm.call(this, values);
            }
        }
    });

    gui.define_popup({
        name: 'PopUpShippingAddress',
        widget: PopUpShippingAddress
    });

    var ButtonPosOrdersScreen = screens.ActionButtonWidget.extend({
        template: 'ButtonPosOrdersScreen',
        init: function (parent, options) {
            var self = this;
            this._super(parent, options);
            this.pos.bind('open:pos-orders-screen', function () {
                self.button_click();
            });
            this.pos.bind('reload:countOrders', function () { // todo: trigger new orders, auto update count orders
                self.renderElement();
            });
        },
        async button_click() {
            this.pos.set('synch', {state: 'connecting', pending: 'Syncing Orders'});
            await this.pos.reloadPosOrders()
            this.pos.gui.show_screen('PosOrderScreen');
            this.pos.set('synch', {state: 'connected', pending: ''});
        },
        get_count_orders: function () {
            var orders = this.pos.db.get_pos_orders();
            return orders.length;
        }
    });

    screens.define_action_button({
        'name': 'ButtonPosOrdersScreen',
        'widget': ButtonPosOrdersScreen,
        'condition': function () {
            return this.pos.config.pos_orders_management
        }
    });

    var PopUpRegisterPayment = PopupWidget.extend({
        template: 'PopUpRegisterPayment',
        show: function (options) {
            var self = this;
            options = options || {};
            options.cashregisters = this.pos.cashregisters;
            options.amount_debit = round_pr(options.pos_order.amount_total - options.pos_order.amount_paid, this.pos.currency.rounding);
            options.order = options.pos_order;
            this.options = options;
            this._super(options);
            this.$el.find('.datepicker').datetimepicker({
                format: 'YYYY-MM-DD',
                icons: {
                    time: "fa fa-clock-o",
                    date: "fa fa-calendar",
                    up: "fa fa-chevron-up",
                    down: "fa fa-chevron-down",
                    previous: 'fa fa-chevron-left',
                    next: 'fa fa-chevron-right',
                    today: 'fa fa-screenshot',
                    clear: 'fa fa-trash',
                    close: 'fa fa-remove'
                }
            });
            this.$el.find('.payment-full').click(function () {
                self.payment_full();
            });
        },
        put_money_in: function () {
            var self = this;
            this.pos.gui.show_popup('popup_money_control', {
                title: 'Put Money In',
                body: 'Describe why you take money from the cash register',
                reason: this.payment_reference,
                amount: this.amount,
                confirm: function (values) {
                    self.reason = values.reason;
                    self.amount = values.amount;
                    return rpc.query({
                        model: 'cash.box.out',
                        method: 'cash_input_from_pos',
                        args: [0, values],
                    }).then(function (result) {
                        self.pos.trigger('request.sync.backend');
                        return self.pos.gui.show_popup('dialog', {
                            title: 'Succeed',
                            body: 'You just put ' + self.pos.gui.chrome.format_currency(self.amount) + ' to cash box',
                            color: 'success'
                        })
                    }).catch(function (error) {
                        return self.pos.query_backend_fail(error)
                    });
                },
                cancel: function () {
                    self.pos.trigger('request.sync.backend');
                    self.pos.gui.close_popup()
                }
            });
        },
        click_confirm: function () {
            var self = this;
            var fields = {};
            this.$('.field').each(function (idx, el) {
                fields[el.name] = el.value || false;
            });
            fields['amount'] = parseFloat(fields['amount']);
            if (!fields['payment_reference']) {
                return this.wrong_input("input[name='payment_reference']", '(*) Please input payment reference');
            } else {
                this.passed_input("input[name='payment_reference']")
            }
            if (!fields['payment_date']) {
                return this.wrong_input("input[name='payment_date']", '(*) Please input payment date');
            } else {
                this.passed_input("input[name='payment_date']")
            }
            if (!fields['amount'] || fields['amount'] <= 0) {
                return this.wrong_input("input[name='amount']", '(*) Amount required bigger than 0');
            } else {
                this.passed_input("input[name='amount']")
            }
            if (!fields['payment_method_id']) {
                return this.wrong_input("input[name='payment_method_id']", '(*) Payment Mdethod is required');
            }

            var amount = parseFloat(fields['amount']);
            this.amount = amount;
            var payment_method_id = parseInt(fields['payment_method_id']);
            var payment_reference = fields['payment_reference'];
            this.payment_reference = payment_reference;
            var payment = {
                pos_order_id: this.options.pos_order.id,
                payment_method_id: payment_method_id,
                amount: fields['amount'],
                name: payment_reference,
                payment_date: fields['payment_date']
            };
            var balance = round_pr(this.options.pos_order['amount_total'] - this.options.pos_order['amount_paid'], this.pos.currency.rounding);
            if (amount > balance) {
                return this.wrong_input("input[name='amount']", '(*) You can not Register Amount bigger than Debit of Amount Order')
            }
            this.gui.close_popup();
            debugger
            return rpc.query({
                model: 'pos.make.payment',
                method: 'add_payment',
                args:
                    [[], payment],
            }).then(function () {
                self.put_money_in();
            }, function (err) {
                self.pos.query_backend_fail(err);
            })
        },
        payment_full: function () {
            var self = this;
            var fields = {};
            this.$('.field').each(function (idx, el) {
                fields[el.name] = el.value || ''
            });
            fields['amount'] = parseFloat(fields['amount']);
            fields['journal_id'] = parseInt(fields['journal_id']);
            if (!fields['payment_reference']) {
                return this.wrong_input("input[name='payment_reference']", '(*) Please input payment reference');
            } else {
                this.passed_input("input[name='payment_reference']")
            }
            if (!fields['payment_date']) {
                return this.wrong_input("input[name='payment_date']", '(*) Please input payment date');
            } else {
                this.passed_input("input[name='payment_date']")
            }
            if (!fields['payment_method_id']) {
                return this.wrong_input("input[name='payment_method_id']", '(*) Payment Method is required');
            }
            this.amount = parseFloat(fields['amount']);
            var payment_reference = fields['payment_reference'];
            this.payment_reference = payment_reference;
            var amount = this.options.pos_order.amount_total - this.options.pos_order.amount_paid;
            if (amount < 0) {
                return this.wrong_input("input[name='amount']", '(*) Amount could not smaller than 0');
            }
            var payment = {
                pos_order_id: this.options.pos_order.id,
                payment_method_id: parseInt(fields['payment_method_id']),
                amount: amount,
                name: payment_reference,
                payment_date: fields['payment_date']
            };
            this.gui.close_popup();
            debugger
            return rpc.query({
                model: 'pos.make.payment',
                method: 'add_payment',
                args:
                    [[], payment],
            }).then(function () {
                self.put_money_in();
            }, function (err) {
                self.pos.query_backend_fail(err);
            })
        }
    });

    gui.define_popup({name: 'PopUpRegisterPayment', widget: PopUpRegisterPayment});

    var PopUpReturnPosOrderLines = PopupWidget.extend({
        template: 'PopUpReturnPosOrderLines',
        show: function (options) {
            var self = this;
            this.line_selected = [];
            var order_lines = options.order_lines;
            for (var i = 0; i < order_lines.length; i++) {
                var line = order_lines[i];
                this.line_selected.push(line);
            }
            this.order = options.order;
            this._super(options);
            this.options = options;
            var image_url = window.location.origin + '/web/image?model=product.product&field=image_128&id=';
            if (order_lines) {
                self.$el.find('tbody').html(qweb.render('ReturnPosOrderLine', {
                    order_lines: order_lines,
                    image_url: image_url,
                    widget: self
                }));
                this.$('.line-select').click(function () {
                    var line_id = parseInt($(this).data('id'));
                    var line = self.pos.db.order_line_by_id[line_id];
                    var checked = this.checked;
                    if (checked == false) {
                        for (var i = 0; i < self.line_selected.length; ++i) {
                            if (self.line_selected[i].id == line.id) {
                                self.line_selected.splice(i, 1);
                            }
                        }
                    } else {
                        self.line_selected.push(line);
                    }
                });
                this.$('.confirm_return_order').click(function () {
                    if (self.line_selected == [] || !self.order || self.line_selected.length == 0) {
                        return self.wrong_input("div[class='table-responsive']", "(*) Please select minimum 1 line for return")
                    } else {
                        let order_return = self.pos.add_return_order(self.order, self.line_selected);
                        order_return.validate_order_return();
                        return self.pos.gui.show_screen('products');
                    }
                });
                this.$('.cancel').click(function () {
                    self.pos.gui.close_popup();
                });
                this.$('.qty_minus').click(function () {
                    var line_id = parseInt($(this).data('id'));
                    var line = self.pos.db.order_line_by_id[line_id];
                    var quantity = parseFloat($(this).parent().find('.qty').text());
                    if (quantity > 1) {
                        var new_quantity = quantity - 1;
                        $(this).parent().find('.qty').text(new_quantity);
                        line['new_quantity'] = new_quantity;
                    }
                });
                this.$('.qty_plus').click(function () {
                    var line_id = parseInt($(this).data('id'));
                    var line = self.pos.db.order_line_by_id[line_id];
                    var quantity = parseFloat($(this).parent().find('.qty').text());
                    if (line['qty'] >= (quantity + 1)) {
                        var new_quantity = quantity + 1;
                        $(this).parent().find('.qty').text(new_quantity);
                        line['new_quantity'] = new_quantity;
                    }
                });
                this.$('.select_all').click(function () {
                    for (var n = 0; n < self.$('.line-select').length; n++) {
                        self.$('.line-select')[n].checked = true
                    }
                    self.line_selected = self.pos.db.lines_by_order_id[self.order['id']];
                });
                this.$('.un_select_all').click(function () {
                    for (var n = 0; n < self.$('.line-select').length; n++) {
                        self.$('.line-select')[n].checked = false
                    }
                    self.line_selected = []
                });
            }
        }
    });
    gui.define_popup({
        name: 'PopUpReturnPosOrderLines',
        widget: PopUpReturnPosOrderLines
    });

    var PopUpRefillPosOrderLines = PopupWidget.extend({
        template: 'PopUpRefillPosOrderLines',
        show: function (options) {
            var self = this;
            this.line_selected = [];
            var order_lines = options.order_lines;
            for (var i = 0; i < order_lines.length; i++) {
                var line = order_lines[i];
                this.line_selected.push(line);
            }
            this.order = options.order;
            this._super(options);
            this.options = options;
            var image_url = window.location.origin + '/web/image?model=product.product&field=image_128&id=';
            if (order_lines) {
                self.$el.find('tbody').html(qweb.render('ReturnPosOrderLine', {
                    order_lines: order_lines,
                    image_url: image_url,
                    widget: self
                }));
                this.$('.line-select').click(function () {
                    var line_id = parseInt($(this).data('id'));
                    var line = self.pos.db.order_line_by_id[line_id];
                    var checked = this.checked;
                    if (checked == false) {
                        for (var i = 0; i < self.line_selected.length; ++i) {
                            if (self.line_selected[i].id == line.id) {
                                self.line_selected.splice(i, 1);
                            }
                        }
                    } else {
                        self.line_selected.push(line);
                    }
                });
                this.$('.confirm_refill_order').click(function () {
                    if (self.line_selected == [] || !self.order || self.line_selected.length == 0) {
                        return self.wrong_input("div[class='table-responsive']", "(*) Please select minimum 1 line for refill")
                    } else {
                        self.pos.add_refill_order(self.order, self.line_selected);
                        return self.pos.gui.show_screen('products');
                    }
                });
                this.$('.cancel').click(function () {
                    self.pos.gui.close_popup();
                });
                this.$('.qty_minus').click(function () {
                    var line_id = parseInt($(this).data('id'));
                    var line = self.pos.db.order_line_by_id[line_id];
                    var quantity = parseFloat($(this).parent().find('.qty').text());
                    if (quantity > 1) {
                        var new_quantity = quantity - 1;
                        $(this).parent().find('.qty').text(new_quantity);
                        line['new_quantity'] = new_quantity;
                    }
                });
                this.$('.qty_plus').click(function () {
                    var line_id = parseInt($(this).data('id'));
                    var line = self.pos.db.order_line_by_id[line_id];
                    var quantity = parseFloat($(this).parent().find('.qty').text());
                    if (line['qty'] >= (quantity + 1)) {
                        var new_quantity = quantity + 1;
                        $(this).parent().find('.qty').text(new_quantity);
                        line['new_quantity'] = new_quantity;
                    }
                })
            }
        }
    });
    gui.define_popup({
        name: 'PopUpRefillPosOrderLines',
        widget: PopUpRefillPosOrderLines
    });

    var PosOrderScreen = screens.ScreenWidget.extend({
        template: 'PosOrderScreen',
        init: function (parent, options) {
            var self = this;
            this.reverse = true;
            this._super(parent, options);
            this.pos.bind('reload:countOrders', function () {
                self.renderElement()
                self.refresh_order();
            }, this);
        },
        refresh_order: function () {
            var orders = this.pos.db.get_pos_orders(50);
            this.render_pos_order_list(orders);
            if (this.order_selected) {
                var order = this.pos.db.order_by_id[this.order_selected.id];
                if (order) {
                    this.display_pos_order_detail(order)
                }
            }
        },
        get_only_partial_payment_orders: function () {
            var orders = _.filter(this.pos.db.get_pos_orders(), function (order) {
                return (order.partial_payment == true && order.state == 'draft') || (!order.partial_payment && order.state == 'quotation');
            });
            return orders.length;
        },
        // show: function () {
        //     this._super();
        // },
        renderElement: function () {
            var self = this;
            this.search_handler = function (event) {
                if (event.type == "keypress" || event.keyCode === 46 || event.keyCode === 8) {
                    var searchbox = this;
                    setTimeout(function () {
                        self.perform_search(searchbox.value, event.which === 13);
                    }, 70);
                }
            };
            this._super();
            this.$el.find('input').focus();
            this.$('.back').click(function () {
                self.gui.show_screen('products');
            });
            this.$('.only_partial_payment_orders').click(function () {
                var orders = _.filter(self.pos.db.get_pos_orders(), function (order) {
                    return (order.partial_payment == true && order.state == 'draft') || (!order.partial_payment && order.state == 'quotation');
                });
                if (orders.length) {
                    return self.render_pos_order_list(orders);
                } else {
                    var contents = self.$el[0].querySelector('.pos_order_list');
                    contents.innerHTML = "";
                }
            });
            var input = this.el.querySelector('.searchbox input');
            input.value = '';
            input.focus();
            this.render_pos_order_list(this.pos.db.get_pos_orders(1000));
            this.$('.client-list-contents').delegate('.pos_order_row', 'click', function (event) {
                self.order_select(event, $(this), parseInt($(this).data('id')));
            });
            this.el.querySelector('.searchbox input').addEventListener('keypress', this.search_handler);
            this.el.querySelector('.searchbox input').addEventListener('keydown', this.search_handler);
            this.$('.searchbox .search-clear').click(function () {
                self.clear_search();
            });
            this.sort_orders();
        },

        sort_orders: function () {
            var self = this;
            this.$('.sort_by_order_date').click(function () {
                var orders = self._get_orders().sort(self.pos.sort_by('date_order', self.reverse, function (a) {
                    if (!a) {
                        a = 'N/A';
                    }
                    return a.toUpperCase()
                }));
                self.render_pos_order_list(orders);
                self.reverse = !self.reverse;
            });
            this.$('.sort_by_pos_order_id').click(function () {
                var orders = self._get_orders().sort(self.pos.sort_by('id', self.reverse, parseInt));
                self.render_pos_order_list(orders);
                self.reverse = !self.reverse;
            });
            this.$('.sort_by_pos_order_amount_total').click(function () {
                var orders = self._get_orders().sort(self.pos.sort_by('amount_total', self.reverse, parseInt));
                self.render_pos_order_list(orders);
                self.reverse = !self.reverse;

            });
            this.$('.sort_by_pos_order_amount_paid').click(function () {
                var orders = self._get_orders().sort(self.pos.sort_by('amount_paid', self.reverse, parseInt));
                self.render_pos_order_list(orders);
                self.reverse = !self.reverse;
            });
            this.$('.sort_by_pos_order_amount_tax').click(function () {
                var orders = self._get_orders().sort(self.pos.sort_by('amount_tax', self.reverse, parseInt));
                self.render_pos_order_list(orders);
                self.reverse = !self.reverse;

            });
            this.$('.sort_by_pos_order_name').click(function () {
                var orders = self._get_orders().sort(self.pos.sort_by('name', self.reverse, function (a) {
                    if (!a) {
                        a = 'N/A';
                    }
                    return a.toUpperCase()
                }));
                self.render_pos_order_list(orders);
                self.reverse = !self.reverse;
            });
            this.$('.sort_by_order_ref').click(function () {
                var orders = self._get_orders().sort(self.pos.sort_by('pos_reference', self.reverse, function (a) {
                    if (!a) {
                        a = 'N/A';
                    }
                    return a.toUpperCase()
                }));
                self.render_pos_order_list(orders);
                self.reverse = !self.reverse;
            });
            this.$('.sort_by_pos_order_partner_name').click(function () {
                var orders = self._get_orders().sort(self.pos.sort_by('partner_name', self.reverse, function (a) {
                    if (!a) {
                        a = 'N/A';
                    }
                    return a.toUpperCase()
                }));
                self.render_pos_order_list(orders);
                self.reverse = !self.reverse;
            });
            this.$('.sort_by_pos_order_barcode').click(function () {
                var orders = self._get_orders().sort(self.pos.sort_by('ean13', self.reverse, function (a) {
                    if (!a) {
                        a = 'N/A';
                    }
                    return a.toUpperCase();
                }));
                self.render_pos_order_list(orders);
                self.reverse = !self.reverse;
            });
            this.$('.sort_by_pos_order_sale_person').click(function () {
                var orders = self._get_orders().sort(self.pos.sort_by('sale_person', self.reverse, function (a) {
                    if (!a) {
                        a = 'N/A';
                    }
                    return a.toUpperCase();
                }));
                self.render_pos_order_list(orders);
                self.reverse = !self.reverse;
            });
            this.$('.sort_by_session').click(function () {
                var orders = self._get_orders().sort(self.pos.sort_by('session', self.reverse, function (a) {
                    if (!a) {
                        a = 'N/A';
                    }
                    return a.toUpperCase();
                }));
                self.render_pos_order_list(orders);
                self.reverse = !self.reverse;
            });
            this.$('.sort_by_pos_order_state').click(function () {
                var orders = self._get_orders().sort(self.pos.sort_by('state', self.reverse, function (a) {
                    if (!a) {
                        a = 'N/A';
                    }
                    return a.toUpperCase();
                }));
                self.render_pos_order_list(orders);
                self.reverse = !self.reverse;
            });
        },

        clear_search: function () {
            this.render_pos_order_list(this.pos.db.get_pos_orders());
            this.$('.searchbox input')[0].value = '';
            this.$('.searchbox input').focus();
            this.display_pos_order_detail(null);
        },

        perform_search: function (query, associate_result) {
            var orders;
            if (query) {
                orders = this.pos.db.search_order(query);
                if (associate_result && orders.length === 1) {
                    return this.display_pos_order_detail(orders[0]);
                }
                return this.render_pos_order_list(orders);

            } else {
                orders = this.pos.db.get_pos_orders();
                return this.render_pos_order_list(orders);
            }
        },
        partner_icon_url: function (id) {
            return '/web/image?model=res.partner&id=' + id + '&field=image_128';
        },
        order_select: function (event, $order, id) {
            var order = this.pos.db.order_by_id[id];
            this.$('.client-line').removeClass('highlight');
            $order.addClass('highlight');
            this.display_pos_order_detail(order);
        },
        _get_orders: function () {
            if (!this.orders_list) {
                return this.pos.db.get_pos_orders()
            } else {
                return this.orders_list
            }
        },
        render_pos_order_list: function (orders) {
            var contents = this.$el[0].querySelector('.pos_order_list');
            contents.innerHTML = "";
            for (var i = 0, len = Math.min(orders.length, 1000); i < len; i++) {
                var order = orders[i];
                var pos_order_row_html = qweb.render('PosOrderRow', {widget: this, order: order});
                var pos_order_row = document.createElement('tbody');
                pos_order_row.innerHTML = pos_order_row_html;
                pos_order_row = pos_order_row.childNodes[1];
                if (order === this.order_selected) {
                    pos_order_row.classList.add('highlight');
                } else {
                    pos_order_row.classList.remove('highlight');
                }
                contents.appendChild(pos_order_row);
            }
            this.orders_list = orders;
        },
        async add_back_order_to_screen() {
            console.log('[add_back_order_to_screen]')
            const self = this;
            let order = self.order_selected;
            if (!order) {
                return;
            }
            const lines = this.pos.db.lines_by_order_id[order['id']];
            if (!lines || !lines.length) {
                return self.pos.gui.show_popup('dialog', {
                    title: 'WARNING',
                    body: 'Order blank lines',
                });
            } else {
                var new_order = new models.Order({}, {pos: this.pos, temporary: true});
                new_order['uid'] = order['pos_reference'].split(' ')[1];
                new_order['pos_reference'] = order['pos_reference'];
                new_order['create_date'] = order['create_date'];
                new_order['ean13'] = order['ean13'];
                new_order['name'] = order['pos_reference'];
                new_order['date_order'] = order['date_order'];
                var partner = order['partner_id'];
                if (partner) {
                    var partner_id = partner[0];
                    var partner = self.pos.db.get_partner_by_id(partner_id);
                    new_order.set_client(partner);
                }
                var pos_employee = order['pos_employee_id'];
                if (pos_employee) {
                    var pos_employee_id = pos_employee[0];
                    var pos_employee = this.pos.employee_by_id[pos_employee_id];
                    if (pos_employee) {
                        new_order['pos_employee_id'] = pos_employee.id;
                        new_order['employee'] = pos_employee;
                    }
                }
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i];
                    var product = self.pos.db.get_product_by_id(line.product_id[0]);
                    if (!product) {
                        continue
                    } else {
                        var new_line = new models.Orderline({}, {
                            pos: self.pos,
                            order: new_order,
                            product: product
                        });
                        new_line.set_quantity(line.qty, 'keep price, for re-print receipt');
                        new_order.orderlines.add(new_line);
                        if (line.discount) {
                            new_line.set_discount(line.discount);
                        }
                        if (line.discount_reason) {
                            new_line.discount_reason = line.discount_reason;
                        }
                        if (line.promotion) {
                            new_line.promotion = line.promotion;
                        }
                        if (line.promotion_reason) {
                            new_line.promotion_reason = line.promotion_reason;
                        }
                        if (line.note) {
                            new_line.set_line_note(line.note);
                        }
                        if (line.plus_point) {
                            new_line.plus_point = line.plus_point;
                        }
                        if (line.redeem_point) {
                            new_line.redeem_point = line.redeem_point;
                        }
                        if (line.uom_id) {
                            var uom_id = line.uom_id[0];
                            var uom = self.pos.uom_by_id[uom_id];
                            if (uom) {
                                new_line.set_unit(uom_id);
                            }
                        }
                        if (line.notice) {
                            new_line.notice = line.notice;
                        }
                        new_line.set_unit_price(line.price_unit);
                        var combo_items = [];
                        for (var k = 0; k < this.pos.combo_items.length; k++) {
                            var combo_item = this.pos.combo_items[k];
                            if (combo_item.product_combo_id[0] == new_line.product.product_tmpl_id && (combo_item.default == true || combo_item.required == true)) {
                                combo_items.push(combo_item);
                            }
                        }
                        if (combo_items) {
                            new_line.set_combo_bundle_pack(combo_items)
                        }
                        if (new_line.product.product_tmpl_id) {
                            var default_combo_items = this.pos.combo_limiteds_by_product_tmpl_id[new_line.product.product_tmpl_id];
                            if (default_combo_items && default_combo_items.length) {
                                var selected_combo_items = {};
                                for (var n = 0; n < default_combo_items.length; n++) {
                                    var default_combo_item = default_combo_items[n];
                                    if (default_combo_item.default_product_ids.length) {
                                        for (var m = 0; m < default_combo_item.default_product_ids.length; m++) {
                                            selected_combo_items[default_combo_item.default_product_ids[m]] = 1
                                        }
                                    }
                                }
                                new_line.set_dynamic_combo_items(selected_combo_items);
                            }
                        }
                    }
                }
                let payments = await rpc.query({
                    model: 'pos.payment',
                    method: 'search_read',
                    fields: ['payment_method_id', 'amount', 'name'],
                    domain: [['pos_order_id', '=', order['id']]],
                });
                for (var i = 0; i < payments.length; i++) {
                    let payment = payments[i]
                    if (payment.name == 'return')
                        new_order['amount_return'] = payment.amount;
                    else {
                        new_order.add_paymentline(this.pos.payment_methods_by_id[payment.payment_method_id[0]]);
                        new_order.selected_paymentline.set_amount(payment.amount);
                    }
                }
                const allOrders = this.pos.get('orders');
                allOrders.add(new_order);
                this.pos.set('selectedOrder', new_order);
                return order;
            }
        },
        display_pos_order_detail: function (order) {
            var contents = this.$('.pos_detail');
            contents.empty();
            var self = this;
            this.order_selected = order;
            if (!order) {
                return;
            }
            var $row_selected = this.$("[data-id='" + order['id'] + "']");
            $row_selected.addClass('highlight');
            order['link'] = window.location.origin + "/web#id=" + order.id + "&view_type=form&model=pos.order";
            contents.append($(qweb.render('PosOrderDetail', {widget: this, order: order})));
            var lines = this.pos.db.lines_by_order_id[order['id']];
            if (lines) {
                var line_contents = this.$('.lines_detail');
                line_contents.empty();
                line_contents.append($(qweb.render('PosOrderLines', {widget: this, lines: lines})));
            }
            this.$('.return_order').click(function () {
                var order = self.order_selected;
                if (self.pos.db.order_by_id[order.id] && self.pos.db.order_by_id[order.id].is_returned && !self.pos.config.return_duplicate) {
                    return self.gui.show_popup('dialog', {
                        title: _t('Warning'),
                        body: _t('Order is returned before and your POS config now allow (checked) return duplicate'),
                    });
                }
                var order_lines = self.pos.db.lines_by_order_id[order['id']];
                if (!order_lines) {
                    return self.gui.show_popup('dialog', {
                        title: _t('Warning'),
                        body: _t('Order empty lines'),
                    });
                } else {
                    return self.gui.show_popup('PopUpReturnPosOrderLines', {
                        order_lines: order_lines,
                        order: order
                    });
                }
            });
            this.$('.refill_order').click(function () {
                var order = self.order_selected;
                var order_lines = self.pos.db.lines_by_order_id[order['id']];
                if (!order_lines) {
                    return self.gui.show_popup('dialog', {
                        title: 'Warning',
                        body: 'Order empty lines',
                    });
                } else {
                    return self.gui.show_popup('PopUpRefillPosOrderLines', {
                        order_lines: order_lines,
                        order: order
                    });
                }
            });
            this.$('.covert_to_voucher').click(function () {
                return this.pos._get_voucher_number().then(function (number) {
                    var order = self.order_selected;
                    self.pos.gui.show_popup('PopUpPrintVoucher', {
                        title: _t('Are you want covert Order to Voucher'),
                        number: number,
                        value: order.amount_total,
                        selected_line: null,
                        confirm: function (voucher_val) {
                            voucher_val['period_days'] = parseInt(voucher_val['period_days']);
                            voucher_val['value'] = parseFloat(voucher_val['value']);
                            voucher_val['state'] = 'active';
                            voucher_val['source'] = self.pos.get_order().uid;
                            return rpc.query({
                                model: 'pos.voucher',
                                method: 'create_from_ui',
                                args: [voucher_val],
                                context: {}
                            }).then(function (voucher) {
                                var url_location = window.location.origin + '/report/barcode/EAN13/';
                                voucher['url_barcode'] = url_location + voucher['code'];
                                var voucher_receipt = qweb.render('VoucherCard', self.pos._get_voucher_env(voucher));
                                self.pos.report_html = voucher_receipt;
                                self.pos.report_xml = voucher_receipt;
                                self.pos.reloadPosOrders();
                                return self.pos.gui.show_screen('report', {
                                    subject: voucher.code,
                                    body: 'Please keep Your Secret Voucher Code Safe, and use next Order'
                                });
                            }, function (err) {
                                return self.pos.query_backend_fail(err)
                            })
                        },
                        cancel: function () {
                        }
                    });
                })
            });
            this.$('.register_amount').click(function () {
                var pos_order = self.order_selected;
                if (pos_order) {
                    self.gui.show_popup('PopUpRegisterPayment', {
                        pos_order: pos_order,
                        confirm: function () {
                            self.pos.reloadPosOrders();
                        }
                    })
                }
            });
            this.$('.action_invoice').click(function () {
                var pos_order = self.order_selected;
                if (pos_order) {
                    if (pos_order.account_move) {
                        self.pos.gui.show_popup('dialog', {
                            title: _t('Alert'),
                            body: _t('Just few seconds download invoice now, please keep waiting'),
                            color: 'success'
                        })
                        return self.pos.gui.chrome.do_action('account.account_invoices', {
                            additional_context: {
                                active_ids: [pos_order.account_move[0]]
                            }
                        })
                    }
                    if (!pos_order.parner_id) {
                        // todo: show popup client and save partner_id first
                        self.pos.gui.show_popup('popup_selection_extend', {
                            title: _t('Select Customer'),
                            fields: ['name', 'email', 'phone', 'mobile', 'balance', 'wallet', 'pos_loyalty_point'],
                            header_button: '<button type="submit" style="color: black; background: none" class="btn btn-round btn-just-icon">\n' +
                                '                      <i class="material-icons">person_add</i>\n' +
                                '                    </button>',
                            header_button_action: function () {
                                return self.gui.show_popup('popup_create_customer', {
                                    title: _t('Create new Customer')
                                })
                            },
                            sub_datas: self.pos.db.get_partners_sorted(100),
                            sub_search_string: self.pos.db.partner_search_string,
                            sub_record_by_id: self.pos.db.partner_by_id,
                            sub_template: 'clients_list',
                            body: 'Please select one client',
                            confirm: function (client_id) {
                                var client = self.pos.db.get_partner_by_id(client_id);
                                self.client = client;
                                setTimeout(function () {
                                    return self.pos.gui.show_popup('confirm', {
                                        title: _t('Are you want set Customer ' + self.client.name + ' to this Order, and create Invoice'),
                                        confirm: function () {
                                            return rpc.query({
                                                model: 'pos.order',
                                                method: 'write',
                                                args: [[self.order_selected.id], {
                                                    partner_id: self.client.id
                                                }]
                                            }).then(function () {
                                                return rpc.query({
                                                    model: 'pos.order',
                                                    method: 'action_pos_order_invoice',
                                                    args: [[self.order_selected.id]]
                                                }).then(function (result) {
                                                    self.pos.reloadPosOrders();
                                                    if (result && result['move_id']) {
                                                        self.pos.gui.show_popup('dialog', {
                                                            title: _t('Alert'),
                                                            body: _t('Just few seconds download invoice now, please keep waiting'),
                                                            color: 'success'
                                                        })
                                                        return self.pos.gui.chrome.do_action('account.account_invoices', {
                                                            additional_context: {
                                                                active_ids: [result['move_id']]
                                                            }
                                                        })
                                                    }
                                                }, function (err) {
                                                    self.pos.query_backend_fail(err);
                                                });
                                            }, function (err) {
                                                self.pos.query_backend_fail(err);
                                            });
                                        }
                                    })
                                }, 100)
                            }
                        })
                    } else {
                        return rpc.query({
                            model: 'pos.order',
                            method: 'action_pos_order_invoice',
                            args: [[self.order_selected.id]]
                        }).then(function () {
                            self.pos.reloadPosOrders();
                            setTimeout(function () {
                                return self.pos.gui.chrome.do_action('account.account_invoices', {
                                    additional_context: {
                                        active_ids: [self.order_selected['id']]
                                    }
                                })
                            }, 100)
                        }, function (err) {
                            self.pos.query_backend_fail(err);
                        });
                    }
                }
            });
            this.$('.cancel_order').click(function () {
                return self.pos.gui.show_popup('confirm', {
                    title: _t('Alert'),
                    body: _t('Are you want cancel this Order ?'),
                    confirm: function () {
                        var pos_order = self.order_selected;
                        if (pos_order) {
                            return rpc.query({
                                model: 'pos.order',
                                method: 'action_pos_order_cancel',
                                args:
                                    [[pos_order['id']]],
                                context: {
                                    pos: true
                                }
                            }).then(function (result) {
                                self.pos.reloadPosOrders();
                                return self.pos.gui.show_popup('dialog', {
                                    title: _t('Alert'),
                                    body: _t('Order cancelled')
                                })
                            }).catch(function (error) {
                                return self.pos.query_backend_fail(error);
                            });
                        }
                    }
                })
            });
            this.$('.create_invoice').click(function () {
                var pos_order = self.order_selected;
                if (pos_order) {
                    return self.gui.show_popup('confirm', {
                        title: _t('Create invoice ?'),
                        body: 'Are you want create invoice for ' + pos_order['name'] + ' ?',
                        confirm: function () {
                            self.pos.gui.close_popup();
                            return rpc.query({
                                model: 'pos.order',
                                method: 'made_invoice',
                                args:
                                    [[pos_order['id']]],
                                context: {
                                    pos: true
                                }
                            }).then(function (invoice_vals) {
                                self.pos.reloadPosOrders();
                                self.link = window.location.origin + "/web#id=" + invoice_vals[0]['id'] + "&view_type=form&model=account.move";
                                return self.gui.show_popup('confirm', {
                                    title: 'Are you want open invoice?',
                                    body: 'Invoice created',
                                    confirmButtonText: 'Yes',
                                    cancelButtonText: 'Close',
                                    confirm: function () {
                                        window.open(self.link, '_blank');
                                    },
                                    cancel: function () {
                                        self.pos.gui.close_popup();
                                    }
                                });
                            }).catch(function (error) {
                                return self.pos.query_backend_fail(error);
                            });
                        },
                        cancel: function () {
                            return self.pos.gui.close_popup();
                        }
                    });
                }
            });

            this.$('.edit_order').click(function () {
                self.add_back_order_to_screen();
                return rpc.query({
                    model: 'pos.order',
                    method: 'write',
                    args:
                        [[order['id']], {'state': 'draft'}],
                    context: {
                        pos: true
                    }
                })
            })
            this.$('.reprint_order').click(async function () {
                let order = await self.add_back_order_to_screen();
                if (order) {
                    self.pos.gui.show_screen('receipt');
                }
            });
        }
    });
    gui.define_screen({name: 'PosOrderScreen', widget: PosOrderScreen});

    return PosOrderScreen;
});
