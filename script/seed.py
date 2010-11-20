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
from lib.db import *
import random

obj = seed_test_db()

print 'Admin: %s' % repr(obj['admin'])
print 'Merchant: %s' % repr(obj['merchant'])
print
print
print 'AdminKey: %s' % repr(obj['admin_key'])
print 'MerchantKey: %s' % repr(obj['merchant_key'])
print
print
print 'admin_key: %s' % repr(obj['admin_key'].key)
print 'merchant_key: %s' % repr(obj['merchant_key'].key)

print "populating merchant with items...",
for x in xrange(10000):
  c = Charge()
  c.key = obj['merchant_key']._id
  c.amount = int((random.random() % 10000) * 10000) + 1
  c._instrument = ObjectId()
  c.save()

  r = Refund()
  r.key = obj['merchant_key']._id
  r.amount = int((random.random() % 10000) * 10000) + 1
  r._instrument = ObjectId()
  r.save()

  ba = BankAccount()
  ba.number = "29345729304729134792347"
  ba.aba = "29342937492013749201"
  ba.save()

  bc = BankCard()
  bc.cvc = int((random.random() % 999) * 999) + 1
  bc.exp_year = 2010+int((random.random() % 20) * 20)
  bc.exp_month = int((random.random() % 12) * 12) + 1
  bc.number = 3158485439220903
  bc.save()

print "done"
