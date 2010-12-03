# -*- coding: utf-8 -*-

from lib.db.container import Container
from lib.db.model import mandatory, is_container

class Admin(Container):
  """Admin logical entity"""

  @mandatory(str, email=None)
  def val_email(self):
    assert "@" in self.email, "'email' must be a valid email address"
    assert "." in self.email, "'email' must be a valid email address"

  @mandatory(str, password=None)
  def val_password(self):
    pass

  @mandatory(str, name=None)
  def val_name(self):
    assert len(self.name) < 255, "'name' is too long; must be less than 255 characters"

  @mandatory(list, key_list=[])
  def val_keys(self):
    for key in self.key_list:
      assert is_container('AdminKey', key)
