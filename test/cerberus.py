# -*- coding: utf-8 -*-

import sys
print sys.path
import unittest

class CerberusTestCase(unittest.TestCase):
  def setUp(self):
    from lib.test.name import generate_test_name
    self.test_name = generate_test_name()

    import lib.config
    lib.config.DEBUG = True

    from lib.log import Logger
    import lib.config
    lib.config.syslog = Logger('cerberus_%s' % self.test_name)
    lib.config.syslog.create_logger(self.test_name)

    lib.config.syslog[self.test_name].debug("testing")

    import lib.db
    from lib.test import seed_test_db
    from lib.db.mongo.adapter import MongoAdapter

    lib.db.mongo_adapter = MongoAdapter(self.test_name)
    self.key_tuple = seed_test_db()

    from cerberus import cerberus
    self.app = cerberus

  def tearDown(self):
    import lib.db
    for collection in lib.db.mongo_adapter.db.collection_names():
      lib.db.mongo_adapter.db.drop_collection(collection)
    self.app.log[self.test_name].debug(lib.db.mongo_adapter.db)

  def test_bank_card_get(self):
    pass

  #def test_bank_card_post(self):
  #  pass

  #def test_bank_card_put(self):
  #  pass

  #def test_bank_card_delete(self):
  #  pass
