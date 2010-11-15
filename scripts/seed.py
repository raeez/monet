# -*- coding: utf-8 -*-

import lib.config
lib.config.CONF = {
  'debug' : False,
  'syslog' : 'cerberus',
  'log' : True,
  'mongo' : {'host' : ('localhost', 5500),
             'replicate_minimum' : 1,
             'safe' : True},

  'mail' : {'host' : ('mail.authsmtp.com', 2525),
            'address' : 'raeez@mit.edu',
            'auth' : ('ac53391', 'ezanqkp4gfzjbj')}
}
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
