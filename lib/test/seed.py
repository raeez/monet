# -*- coding: utf-8 -*-

from lib.db import Admin, AdminKey, Merchant, MerchantKey, ObjectId
import bcrypt

def seed_test_db():
  m = Merchant()
  m.email = 'test@domain.com'
  m.name = 'Test enterprises inc.'
  m.parent = ObjectId()
  m.password = bcrypt.hashpw('a123', bcrypt.gensalt(10))
  m.save()

  mk = MerchantKey()
  mk._merchant = m._id
  mk.processor = 'fdc'
  mk.save()
  
  m.key_list.append(mk._id)
  m.save()

  a = Admin()
  a.email = 'test@domain.com'
  a.name = 'Test Enterprises Inc.'
  a.password = bcrypt.hashpw('a123', bcrypt.gensalt(10))
  a.save()

  ak = AdminKey()
  ak._admin = a._id
  ak.save()

  a.key_list.append(ak._id)
  a.save()
  
  return {"merchant" : m, "admin" : a, "merchant_key" : mk, "admin_key" : ak}
