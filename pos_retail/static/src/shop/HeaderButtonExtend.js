odoo.define('pos_retail.HeaderButtonExtend', function (require) {
    var chrome = require('point_of_sale.chrome');
    var models = require('point_of_sale.models');
    var field_utils = require('web.field_utils');

    var PosProfileWidget = chrome.StatusWidget.extend({
        template: 'PosProfileWidget',
        start: function () {
            var self = this;
            this.$el.click(function () {

            });
        },
        get_name() {
            return this.pos.config.name
        }
    });

    var PosSessionWidget = chrome.StatusWidget.extend({
        template: 'PosSessionWidget',
        start: function () {
            var self = this;
            this.$el.click(function () {

            });
        },
        get_name() {
            return this.pos.pos_session.name
        }
    });

    var PosSessionOpenedWidget = chrome.StatusWidget.extend({
        template: 'PosSessionOpenedWidget',
        start: function () {
            var self = this;
            this.$el.click(function () {

            });
        },
        get_name() {
            var start_at = field_utils.parse.datetime(this.pos.pos_session.start_at);
            start_at = field_utils.format.datetime(start_at);
            return start_at
        }
    });

    chrome.Chrome.include({
        build_widgets: function () {
            this.widgets.push(
                {
                    'name': 'PosProfileWidget',
                    'widget': PosProfileWidget,
                    'append': '.pos-topheader'
                },
                // {
                //     'name': 'PosSessionWidget',
                //     'widget': PosSessionWidget,
                //     'append': '.pos-topheader'
                // },
                {
                    'name': 'PosSessionOpenedWidget',
                    'widget': PosSessionOpenedWidget,
                    'append': '.pos-topheader'
                }
            );
            this._super();
        }
    });

});
