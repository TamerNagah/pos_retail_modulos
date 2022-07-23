odoo.define('l10n_pe_pos_retail.l10n_pe_pos_retail', function (require) {
    "use strict";

    const models = require('point_of_sale.models');
    const screens = require('point_of_sale.screens');
    const core = require('web.core');
    const rpc = require('web.rpc');
    const gui = require('point_of_sale.gui');
    const PopupCreateCustomer = gui.Gui.prototype.popup_classes.find(o => o.name = 'popup_create_customer');

    const _t = core._t;

    const PosModelSuper = models.PosModel;
    const OrderSuper = models.Order;

    models.load_fields("res.currency", ["singular_name", "plural_name", "fraction_name", "show_fraction"]);
    models.load_fields("res.partner", [
        "vat", "commercial_name",
        "legal_name", "is_validate", "state", "condition",
        "l10n_latam_identification_type_id"]);

    models.load_models([{
        model: 'l10n_latam.identification.type',
        fields: ["name", "id", "l10n_pe_vat_code"],
        loaded: function (self, identifications) {
            self.doc_code_by_id = {}
            _.each(identifications, function (doc) {
                self.doc_code_by_id[doc.id] = doc.l10n_pe_vat_code
            })
            self.doc_types = identifications
        },
    }])

    models.load_models([{
        model: 'res.country',
        fields: ["id", "code"],
        domain: function (self) {
            return [['code', '=', 'PE']]
        },
        loaded: function (self, country) {
            self.pe_country_id = country[0].id;
        },

    }])

    models.load_models([{
        model: 'res.country.state',
        fields: ["id", "code", "name", "country_id"],
        domain: function (self) {
            return [['country_id', '=', self.pe_country_id]]
        },
        loaded: function (self, data) {
            self.cliente_departamento = {}
            self.cliente_provincia = {}
            self.cliente_distrito = {}

            _.each(data, function (estados) {
                if (estados.code === undefined) next;

                if (estados.code.length === 2)
                    self.cliente_departamento[estados.code] = {value: estados.id, description: estados.name};
                else if (estados.code.length === 4)
                    self.cliente_provincia[estados.code] = {value: estados.id, description: estados.name};
                else if (estados.code.length === 6)
                    self.cliente_distrito[estados.code] = {value: estados.id, description: estados.name};
            });
        },
    }]);

    models.load_models([{
        model: 'res.country.state',
        fields: ["id", "code", "name", "country_id"],
        domain: function (self) {
            return [['country_id', '=', 'PE']]
        },
        loaded: function (self, data) {
            self.cliente_departamento = []
            self.cliente_provincia = []
            self.cliente_distrito = []
            _.each(data, function (estados) {
                if (estados.code === undefined || estados.country_id[1] !== "Perú") next;

                if (estados.code.length === 2)
                    self.cliente_departamento.push({id: estados.id, code: estados.code, name: estados.name});
                else if (estados.code.length === 4)
                    self.cliente_provincia.push({id: estados.id, code: estados.code, name: estados.name});
                else if (estados.code.length === 6)
                    self.cliente_distrito.push({id: estados.id, code: estados.code, name: estados.name});
            });
        },
    }]);

    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            var res = PosModelSuper.prototype.initialize.apply(this, arguments);
            this.doc_types = []
            //~ {'code': '0', 'name':'DOC.TRIB.NO.DOM.SIN.RUC'},
            //~ {'code': '1', 'name':'DNI'},
            //~ {'code': '4', 'name':'CARNET DE EXTRANJERIA'},
            //~ {'code': '6', 'name':'RUC'},
            //~ {'code': '7', 'name':'PASAPORTE'},
            //~ {'code': 'A', 'name':'CÉDULA DIPLOMÁTICA DE IDENTIDAD'}];
            this.partner_states = [
                {'code': 'ACTIVO', 'name': 'ACTIVO'},
                {'code': 'BAJA DE OFICIO', 'name': 'BAJA DE OFICIO'},
                {'code': 'BAJA PROVISIONAL', 'name': 'BAJA PROVISIONAL'},
                {'code': 'SUSPENSION TEMPORAL', 'name': 'SUSPENSION TEMPORAL'},
                {'code': 'INHABILITADO-VENT.UN', 'name': 'INHABILITADO-VENT.UN'},
                {'code': 'BAJA MULT.INSCR. Y O', 'name': 'BAJA MULT.INSCR. Y O'},
                {'code': 'PENDIENTE DE INI. DE', 'name': 'PENDIENTE DE INI. DE'},
                {'code': 'OTROS OBLIGADOS', 'name': 'OTROS OBLIGADOS'},
                {'code': 'NUM. INTERNO IDENTIF', 'name': 'NUM. INTERNO IDENTIF'},
                {'code': 'ANUL.PROVI.-ACTO ILI', 'name': 'ANUL.PROVI.-ACTO ILI'},
                {'code': 'ANULACION - ACTO ILI', 'name': 'ANULACION - ACTO ILI'},
                {'code': 'BAJA PROV. POR OFICI', 'name': 'BAJA PROV. POR OFICI'},
                {'code': 'ANULACION - ERROR SU', 'name': 'ANULACION - ERROR SU'},
            ];
            this.partner_conditions = [
                {'code': 'HABIDO', 'name': 'HABIDO'},
                {'code': 'NO HALLADO', 'name': 'NO HALLADO'},
                {'code': 'NO HABIDO', 'name': 'NO HABIDO'},
                {'code': 'PENDIENTE', 'name': 'PENDIENTE'},
                {'code': 'NO HALLADO SE MUDO D', 'name': 'NO HALLADO SE MUDO D'},
                {'code': 'NO HALLADO NO EXISTE', 'name': 'NO HALLADO NO EXISTE'},
                {'code': 'NO HALLADO FALLECIO', 'name': 'NO HALLADO FALLECIO'},
                {'code': 'NO HALLADO OTROS MOT', 'name': 'NO HALLADO OTROS MOT'},
                {'code': 'NO APLICABLE', 'name': 'NO APLICABLE'},
                {'code': 'NO HALLADO NRO.PUERT', 'name': 'NO HALLADO NRO.PUERT'},
                {'code': 'NO HALLADO CERRADO', 'name': 'NO HALLADO CERRADO'},
                {'code': 'POR VERIFICAR', 'name': 'POR VERIFICAR'},
                {'code': 'NO HALLADO DESTINATA', 'name': 'NO HALLADO DESTINATA'},
                {'code': 'NO HALLADO RECHAZADO', 'name': 'NO HALLADO RECHAZADO'},
                {'code': '-', 'name': 'NO HABIDO'},
            ];
            return res;
        },
        validate_pe_doc: function (doc_type, doc_number) {
            if (!doc_type || !doc_number) {
                return false;
            }
            if (doc_number.length == 8 && doc_type == '1') {
                return true;
            } else if (doc_number.length == 11 && doc_type == '6') {
                var vat = doc_number;
                var factor = '5432765432';
                var sum = 0;
                var dig_check = false;
                if (vat.length != 11) {
                    return false;
                }
                try {
                    parseInt(vat)
                } catch (err) {
                    return false;
                }

                for (var i = 0; i < factor.length; i++) {
                    sum += parseInt(factor[i]) * parseInt(vat[i]);
                }

                var subtraction = 11 - (sum % 11);
                if (subtraction == 10) {
                    dig_check = 0;
                } else if (subtraction == 11) {
                    dig_check = 1;
                } else {
                    dig_check = subtraction;
                }

                if (parseInt(vat[10]) != dig_check) {
                    return false;
                }
                return true;
            } else if (doc_number.length >= 3 && ['0', '4', '7', 'A'].indexOf(doc_type) != -1) {
                return true;
            } else if (doc_type.length >= 2) {
                return true;
            } else {
                return false;
            }
        },
    });

    models.Order = models.Order.extend({
        initialize: function (attributes, options) {
            OrderSuper.prototype.initialize.apply(this, arguments);
        },
        get_doc_type: function () {
            var client = this.get_client();
            var doc_type = client ? this.pos.doc_code_by_id[client.l10n_latam_identification_type_id[0]] : "";
            return doc_type;
        },
        get_doc_number: function () {
            var client = this.get_client();
            var doc_number = client ? client.vat : "";
            return doc_number;
        },
        get_amount_text: function () {
            return numeroALetras(this.get_total_with_tax(), {
                plural: this.pos.currency.plural_name,
                singular: this.pos.currency.singular_name,
                centPlural: this.pos.currency.show_fraction ? this.pos.currency.sfraction_name : "",
                centSingular: this.pos.currency.show_fraction ? this.pos.currency.sfraction_name : ""
            })
        },
    });

    screens.PaymentScreenWidget.include({

        order_is_valid: function (force_validation) {
            var res = this._super(force_validation);
            return res;
        },
        validate_serie_invoice: function () {
            var res = this._super()
            var order = this.pos.get_order();
            if (res) {
                return res;
            }
            if (!order.get_sale_serie()) {
                this.gui.show_popup('error', _t('It is required to Select a Serie'));
                res = true;
            }
            return res;
        },
    });

    PopupCreateCustomer.widget.include({
        events: _.extend({}, PopupCreateCustomer.widget.prototype.events, {
            'change .doc_number': '_OnChangeVat',
            'change select[name=\'l10n_latam_identification_type_id\']': '_OnChangeIdentificationTypeId',
            'change select[name=\'state_id\']': '_OnChangeStateId',
            'change select[name=\'province_id\']': '_OnChangeCityId',
        }),
        _OnChangeVat: function () {
            const contents = this.$('.card-content');
            const doc_number = contents.find(".doc_number").val();

            let doc_type = contents.find("select[name='l10n_latam_identification_type_id']").val();
            doc_type = this.pos.doc_code_by_id[doc_type];

            this.set_client_details(doc_type, doc_number, contents);
        },
        _OnChangeIdentificationTypeId: function () {
            const contents = this.$('.card-content');
            const doc_number = contents.find(".doc_number").val();
            let doc_type = contents.find('select[name=\'l10n_latam_identification_type_id\']').val();
            doc_type = this.pos.doc_code_by_id[doc_type];


            if (doc_type == "6") {
                contents.find('.partner-state').show();
                contents.find('.partner-condition').show();
            } else {
                contents.find('.partner-state').hide();
                contents.find('.partner-condition').hide();
            }
            if (doc_number && doc_type) {
                this.set_client_details(doc_type, doc_number, contents);
            }
        },
        _OnChangeStateId: function () {
            const contents = this.$('.card-content');
            var value = contents.find("select[name='state_id']").val();

            var $citySelection = contents.find('select[name=\'province_id\']');
            $citySelection.empty();
            $citySelection.append($("<option/>", {
                value: '',
                text: 'None',
            }));

            var $districtSelection = contents.find('select[name=\'district_id\']');
            $districtSelection.empty();
            $districtSelection.append($("<option/>", {
                value: '',
                text: 'None',
            }));
            this.pos.cliente_provincia.forEach(function (city) {
                if (city.code.startsWith(value)) {
                    $citySelection.append($("<option/>", {
                        value: city.code,
                        text: city.name
                    }));
                }
            });
        },
        _OnChangeCityId: function () {
            const contents = this.$('.card-content');
            var value = contents.find("select[name='city']").val();

            var $districtSelection = contents.find('select[name=\'district_id\']');
            $districtSelection.empty()
            $districtSelection.append($("<option/>", {
                value: '',
                text: 'None',
            }));
            this.pos.cliente_distrito.forEach(function (district) {
                if (district.code.startsWith(value)) {
                    $districtSelection.append($("<option/>", {
                        value: district.code,
                        text: district.name
                    }));
                }
            });
        },
        set_client_details: function (doc_type, doc_number, contents) {
            const doc_number_selector = '.doc_number';
            const doc_type_selector = 'select[name=\'l10n_latam_identification_type_id\']';

            var self = this;
            if (doc_type && !doc_number && doc_type != "0") {
                return this.wrong_input(doc_number_selector, _t('El número de documento es obligatorio.'));
            }
            if (!doc_type && doc_number) {
                return this.wrong_input(doc_type_selector, _t('El tipo de documento es obligatorio'));
            }
            if (doc_type && doc_number) {
                if (doc_type == "1" || doc_type == "6") {
                    if (!self.pos.validate_pe_doc(doc_type, doc_number)) {
                        return this.wrong_input(doc_type_selector, _t('Por favor verificar que el tipo y/o número de documento del Cliente'));
                    } else {
                        this.passed_input(doc_type_selector);
                        this.passed_input(doc_number_selector);

                        rpc.query({
                            model: 'res.partner',
                            method: 'get_partner_from_ui',
                            args: [doc_type, doc_number],
                        }, {
                            timeout: 7500,
                        })
                            .then(function (result) {
                                if (result.detail != "Not found.") {
                                    if (doc_type == "1") {
                                        contents.find("[name='name']").val(result.name + ' ' + result.paternal_surname + ' ' + result.maternal_surname);
                                        contents.find("[name='vat']").val(doc_number);
                                        contents.find('.is_validate').val(true);//attr('checked', true);
                                        contents.find('.last_update').val(result.last_update);
                                        contents.find('.doc_type').val(doc_type);
                                    } else if (doc_type == "6") {
                                        contents.find("[name='name']").val(result.legal_name);
                                        contents.find('.commercial_name').val(result.commercial_name);
                                        contents.find('.legal_name').val(result.legal_name);
                                        contents.find("[name='street']").val(result.street);
                                        contents.find('.is_validate').val(true);//attr('checked', true);
                                        contents.find("[name='vat']").val(doc_number);
                                        contents.find('.last_update').val(result.last_update);
                                        contents.find("[name='state']").val(result.state);
                                        contents.find("[name='condition']").val(result.condition);
                                        contents.find("[name='doc_type']").val(doc_type);

                                        if (result.ubigeo !== undefined) {
                                            var dep = result.ubigeo.substring(0, 2);
                                            var pro = result.ubigeo.substring(0, 4);
                                            var dis = result.ubigeo;

                                            var $stateSelection = contents.find('select[name=\'state_id\']');
                                            var $citySelection = contents.find('select[name=\'province_id\']');
                                            var $districtSelection = contents.find('select[name=\'district_id\']');

                                            $stateSelection.empty()
                                            $citySelection.empty();
                                            $districtSelection.empty()

                                            self.pos.cliente_departamento.forEach(function (state) {
                                                if (state.code === dep) {
                                                    $stateSelection.append($("<option/>", {
                                                        value: state.code,
                                                        text: state.name
                                                    }));
                                                }
                                            });
                                            self.pos.cliente_provincia.forEach(function (city) {
                                                if (city.code === pro) {
                                                    $citySelection.append($("<option/>", {
                                                        value: city.code,
                                                        text: city.name
                                                    }));
                                                }
                                            });
                                            self.pos.cliente_distrito.forEach(function (district) {
                                                if (district.code === dis) {
                                                    $districtSelection.append($("<option/>", {
                                                        value: district.code,
                                                        text: district.name
                                                    }));
                                                }
                                            });

                                            $stateSelection.val(dep);
                                            $citySelection.val(pro);
                                            $districtSelection.val(dis);
                                        }
                                    }

                                    this.passed_input("[name='name']");
                                    contents.find("span[class='card-issue']").text("");
                                }
                            }).catch(function (type, error) {
                            console.error('Failed to get partner:');
                        });
                    }
                }
            }
        }
    });
});
