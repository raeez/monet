# -*- coding: utf-8 -*-

from lib.db.container import Container
from lib.db.model import mandatory, optional, pointer, is_container
from time import time

class Merchant(Container):

  @mandatory(str, email=None)
  def val_email(self):
    try:
      assert "@" in self.email
      assert "." in self.email
    except AssertionError:
      raise AssertionError('member email must be a valid email address')

  @mandatory(str, password=None)
  def val_password(self):
    pass

  @mandatory(str, name=None)
  def val_name(self):
    assert len(self.name) < 255

  @mandatory(int, invites=0)
  def val_invites(self):
    assert self.invites >= 0

  @pointer('Merchant', parent=None)
  def val_parent(self):
    pass

  @mandatory(list, key_list=[])
  def val_keys(self):
    for key in self.key_list:
      assert is_container('MerchantKey', key)

  @mandatory(dict, settings={})
  def val_settings(self):
    pass

  @optional(int, last_login=None)
  def val_last_login(self):
    try:
      assert self.last_login > 1286688330
      assert self.last_login < time()
    except AssertionError:
      raise AssertionError("Ivalid time-stamp for member 'time'")
