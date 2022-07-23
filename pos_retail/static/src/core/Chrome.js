odoo.define('pos_retail.chromes', function (require) {
    "use strict";

    var chrome = require('point_of_sale.chrome');
    var core = require('web.core');
    var _t = core._t;
    var web_framework = require('web.framework');
    var rpc = require('web.rpc');

    // TODO: for waiters and cashiers
    // _.each(chrome.Chrome.prototype.widgets, function (widget) {
    //     if (['sale_details', 'notification', 'username'].indexOf(widget['name']) != -1) {
    //         widget['append'] = '.pos-screens-list',;
    //     }
    // });

    chrome.Chrome.include({
        build_widgets: function () {
            if (!this.pos.config.screen_type || (this.pos.config.screen_type && this.pos.config.screen_type != 'kitchen' && this.pos.config.screen_type != 'kitchen_waiter')) {
                var widget_close_button = _.find(this.widgets, function (widget) {
                    return widget.name == 'close_button' && widget.append == '.pos-rightheader'
                });
                if (widget_close_button) {
                    widget_close_button.args.action = function () {
                        this.$el.addClass('close_button');
                        var self = this;
                        if (!this.confirmed) {
                            this.$el.addClass('confirm');
                            this.$el.text(_t('Confirm'));
                            this.confirmed = setTimeout(function () {
                                self.$el.removeClass('confirm');
                                self.renderElement();
                                self.confirmed = false;
                            }, 2000);
                        } else {
                            clearTimeout(this.confirmed);
                            this.gui.close();
                        }
                    }
                }
                // TODO : push logo to end of header right page
                var shop_logo_widget = _.find(this.widgets, function (w) {
                    return w.name == 'shop_logo_widget';
                });
                this.widgets = _.filter(this.widgets, function (w) {
                    return w.name != 'shop_logo_widget'
                });
                if (shop_logo_widget) {
                    this.widgets.push(shop_logo_widget)
                }
                // TODO : push apps to start of shortcut_screens
                var OpenApps = _.find(this.widgets, function (w) {
                    return w.name == 'OpenApps';
                });
                this.widgets = _.filter(this.widgets, function (w) {
                    return w.name != 'OpenApps'
                });
                if (OpenApps) {
                    this.widgets.splice(0, 0, OpenApps)
                }
                // TODO: move some icons header to right page
                // var widget_rightheaders = _.filter(this.widgets, function (widget) {
                //     return widget.append == '.pos-rightheader' && widget.name != 'shop_logo_widget' && widget.name != 'copyright_icon_widget' && widget.name != 'close_button';
                // });
                // if (widget_rightheaders && widget_rightheaders.length > 0) {
                //     for (var n = 0; n < widget_rightheaders.length; n++) {
                //         widget_rightheaders[n].append = '.pos-screens-list';
                //     }
                // }
            }
            this._super();
        }
    });

    chrome.OrderSelectorWidget.include({ // TODO: validate delete order
        deleteorder_click_handler: function (event, $el) {
            if (this.pos.config.validate_remove_order) {
                this.pos._validate_by_manager('this.pos.delete_current_order()', 'Delete Selected Order')
            } else {
                return this._super()
            }
        },
        renderElement: function () {
            this._super();
            if (!this.pos.config.allow_remove_order || this.pos.config.allow_remove_order == false) {
                this.$('.deleteorder-button').replaceWith('');
                this.$('.neworder-button').replaceWith('');
            }
        },
        neworder_click_handler: function (event, $el) {
            if (this.pos.config.validate_new_order) {
                this.pos._validate_by_manager('this.pos.add_new_order()', 'Add new Order')
            } else {
                return this._super(event, $el)
            }
        },
    });

    chrome.HeaderButtonWidget.include({
        renderElement: function () {
            var self = this;
            this._super();
            if (this.action) {
                this.$el.click(function () {
                    let session_logout_type = self.pos.config.session_logout_type;
                    if (self.pos.config.validate_close_session) {
                        return self.pos._validate_by_manager("self.gui.close();", 'Close Your Session');
                    }
                    var list = [
                        {
                            label: 'Solo cierre su sesión de POS',
                            item: 'default',
                            id: 0,
                        },
                        {
                            label: 'Cierre de sesión de POS y cierre automático de entradas de contabilización Sesión actual',
                            item: 'logout_and_closing_session',
                            id: 1,
                        },
                        {
                            label: 'Cierre la sesión de POS y Odoo ambos',
                            item: 'logout_session_and_odoo',
                            id: 3,
                        },
                        {
                            label: 'Cerrar sesión de POS, cerrar automáticamente las entradas de publicación de la sesión actual y Odoo ambos',
                            item: 'logout_session_include_closing_session_and_odoo',
                            id: 4,
                        },
                        {
                            label: 'Cierre de entradas de contabilización de la sesión actual e impresión del informe Z',
                            item: 'closing_and_print_z_report',
                            id: 5,
                        },
                    ]
                    return self.gui.show_popup('selection', {
                        title: _t('Logout: ' + self.pos.pos_session.name),
                        body: _t('Please choose one Logout Type you wanted to do'),
                        list: list,
                        confirm: function (session_logout_type) {
                            if (session_logout_type == 'default') {
                                return self.pos.gui.close()
                            } else if (session_logout_type == 'logout_and_closing_session') {
                                self.pos.gui.closing_session().then(function (values) {
                                    self.pos.gui.show_popup('dialog', {
                                        title: _t('Result of Closing Session: ' + values),
                                        body: _t('Your Session closed and Posting Entries, please dont take more Orders'),
                                        color: 'success'
                                    })
                                    self.pos.gui.close()
                                    return true
                                }, function (err) {
                                    return self.pos.query_backend_fail(err);
                                })
                            } else if (session_logout_type == 'logout_session_and_odoo') {
                                window.location = "/web/session/logout"
                            } else if (session_logout_type == 'logout_session_include_closing_session_and_odoo') {
                                web_framework.blockUI();
                                return self.pos.gui.closing_session().then(function (values) {
                                    self.pos.gui.show_popup('dialog', {
                                        title: _t('Result of Closing Session: ' + values),
                                        body: _t('Your Session closed and Posting Entries, please dont take more Orders'),
                                        color: 'success'
                                    })
                                    return window.location = "/web/session/logout"
                                }, function (err) {
                                    self.pos.query_backend_fail(err)
                                    return window.location = "/web/session/logout"
                                })
                            } else if (session_logout_type == 'closing_and_print_z_report') {
                                return self.pos.gui.closing_session().then(function (values) {
                                    self.pos.gui.show_popup('dialog', {
                                        title: _t('Result of Closing Session: ' + values),
                                        body: _t('Your Session closed and Posting Entries, please dont take more Orders'),
                                        color: 'success'
                                    })
                                    var params = {
                                        model: 'pos.session',
                                        method: 'build_sessions_report',
                                        args: [[self.pos.pos_session.id]],
                                    };
                                    return rpc.query(params, {shadow: true}).then(function (values) {
                                        var values = {
                                            widget: self,
                                            pos: self.pos,
                                            report: values[self.pos.pos_session.id],
                                        };
                                        self.pos.gui.popup_instances['confirm'].show_report('report_sale_summary_session_html', 'report_sale_summary_session_xml', values)
                                        self.pos.gui.show_popup('dialog', {
                                            title: _t('POS Screen auto Close 5 seconds later'),
                                        })
                                        setTimeout(() => {
                                            window.location = "/web/session/logout"
                                        }, 5000)
                                    }, function (err) {
                                        self.pos.query_backend_fail(err)
                                        window.location = "/web/session/logout"
                                    })
                                }, function (err) {
                                    self.pos.query_backend_fail(err)
                                    window.location = "/web/session/logout"
                                })
                            }
                        }
                    });
                });
            }
        }
    });

});
