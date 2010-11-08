# -*- coding: utf-8 -*-

import unittest

class CerberusTestCase(unittest.TestCase):
  def setUp(self):
    from lib.test.name import generate_test_name
    self.test_name = generate_test_name()

    from lib.config import configure
    configure(
      debug = True,
      syslog = 'cerberus_%s' % self.test_name
    )

    from lib.log import Logger
    self.test_logger = Logger.system_log()
    self.test_logger.create_logger(self.test_name)
    self.test_log = self.test_logger[self.test_name]

    import lib.db
    from lib.test import seed_test_db
    from lib.db.mongo.adapter import MongoAdapter

    lib.db.mongo_adapter = MongoAdapter(self.test_name)
    self.auth_objects = seed_test_db()
    self.processor_key = self.auth_objects['processor_key'].key
    self.admin_key = self.auth_objects['admin_key'].key

    from cerberus.app import cerberus
    from lib.api.test import TestClient
    
    self.app = cerberus
    self.client = TestClient(self.app, self.test_log, {'processor_key' : self.processor_key, 'admin_key' : self.admin_key})

  def test_illegal_access(self):
    pass

  def test_bank_account(self):
    from cerberus.tests.bankaccount import test
    test(self.client)

  def test_bank_card(self):
    from cerberus.tests.bankcard import test
    test(self.client)

  def tearDown(self):
    import lib.db
    for collection in lib.db.mongo_adapter.db.collection_names():
      lib.db.mongo_adapter.db.drop_collection(collection)
    self.app.log[self.test_name].debug(lib.db.mongo_adapter.db)

if __name__ == '__main__':
  unittest.main()
