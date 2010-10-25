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
  pk.key = 'a123'
  pk._merchant = m._id
  pk.live = True
  pk.processor = 'fdc'
  pk.merchant_id = 'a123'
  pk.save()

  m.processor_keys.append(pk._id)
  m.save()
