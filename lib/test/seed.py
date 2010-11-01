# -*- coding: utf-8 -*-

from lib.db import Admin, AdminKey, Merchant, ProcessorKey
from bson.objectid import ObjectId
import bcrypt

def seed_test_db():
  m = Merchant()
  m.email = 'test@domain.com'
  m.name = 'Test enterprises inc.'
  m.parent = ObjectId()
  m.password = bcrypt.hashpw('a123', bcrypt.gensalt(10))
  m.save()

  pk = ProcessorKey()
  pk._merchant = m._id
  pk.processor = 'fdc'
  pk.save()

  m.keys.append(pk._id)
  m.save()

  a = Admin()
  a.email = 'test@domain.com'
  a.name = 'Test Enterprises Inc.'
  a.password = bcrypt.hashpw('a123', bcrypt.gensalt(10))
  a.save()

  ak = AdminKey()
  ak._admin = a._id
  ak.save()

  a.keys.append(ak._id)
  a.save()
  
  return {"merchant" : m, "admin" : a, "processor_key" : pk, "admin_key" : ak}
