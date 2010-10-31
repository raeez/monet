# -*- coding: utf-8 -*-

from lib.db import *
from bson.objectid import ObjectId

def seed_test_db():
  m = Merchant()
  m.email = 'test@domain.com'
  m.name = 'Test enterprises inc.'
  m.parent = ObjectId()
  m.password = 'a123'
  m.save()

  pk = ProcessorKey()
  pk._merchant = m._id
  pk.processor = 'fdc'
  pk.live = False
  pk.save()

  m.processor_keys.append(pk._id)
  m.save()
