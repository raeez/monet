# -*- coding: utf-8 -*-

def test_recursive(dir):
  import unittest

  suite = unittest.TestLoader().discover(dir)
  unittest.TextTestRunner(verbosity=2).run(suite)
