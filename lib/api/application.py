# -*- coding: utf-8 -*-

from flask import Flask

TEST_CONTAINER = '_manhattan_unit_tests'
    
class ManhattanApplication(Flask):
  def register_module(self,  module):
    try:
      unit_tests = self.__getattribute__(TEST_CONTAINER)
    except AttributeError:
      self.__setattr__(TEST_CONTAINER, {})
      unit_tests = self.__getattribute__(TEST_CONTAINER)

    try:
      unit_tests[module.name] = module.test
    except AttributeError:
      raise AttributeError("module '%s' must contain a 'test' method representing a unittest for the module" % module.name)

    super(ManhattanApplication, self).register_module(module)

