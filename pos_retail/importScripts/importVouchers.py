# -*- coding: utf-8 -*-
import xlrd
import xmlrpclib
import psycopg2

username = "admin"
password = '1'

db = "TESTDB"
url = ''

common = xmlrpclib.ServerProxy('{}/xmlrpc/2/common'.format(url))
uid = common.authenticate(db, username, password, {})
models = xmlrpclib.ServerProxy('{}/xmlrpc/2/object'.format(url))


print '[BEGIN] IMPORT VOUCHERS'

fileName =  'barcodenos.xlsx'

workbook = xlrd.open_workbook(fileName)

ws = workbook.sheet_by_name('barcodenos')

rows = 0
update_count = 0
for row_id in range(1, ws.nrows):
    print u'[INFO] Processing row {0}'.format(row_id)
    ean13 = ws.cell(row_id, 0).value if ws.cell(row_id, 0).value else ''
    number = ws.cell(row_id, 1).value if ws.cell(row_id, 1).value else ''
    ean13 = str(ean13)
    print ean13, type(ean13), str(number)
    vals = {
        'code': ean13,
        'number': number,
        'state': 'active',
        'apply_type': 'fixed_amount',
        'method': 'general',
    }
    models.execute_kw(db, uid, password, 'pos.voucher', 'import_voucher', [[], vals])
