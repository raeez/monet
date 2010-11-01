# -*- coding: utf-8 -*-

from lib.test import seed_test_db

obj = seed_test_db()

print 'Admin: %s' % repr(obj['admin'])
print 'Merchant: %s' % repr(obj['merchant'])
print
print
print 'AdminKey: %s' % repr(obj['admin_key'])
print 'ProcessorKey: %s' % repr(obj['processor_key'])
print
print
print 'admin_key: %s' % repr(obj['admin_key'].key)
print 'processor_key: %s' % repr(obj['processor_key'].key)
