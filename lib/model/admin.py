# -*- coding: utf-8 -*-

from lib.db.container import Container, register_container
from lib.db.model import mandatory, is_container

class Admin(Container):
  """Admin logical entity"""

  def _defaults(self):
    self.legal = 0
    self.keys = []

  @mandatory(unicode)
  def _val_email(self):
    try:
      assert "@" in self.email
      assert "." in self.email
    except AssertionError:
      raise AssertionError('member email must be a valid email address')

  @mandatory(unicode)
  def _val_password(self):
    pass

  @mandatory(unicode)
  def _val_name(self):
    assert len(self.name) < 255

  @mandatory(list)
  def _val_keys(self):
    for key in self.keys:
      assert is_container('AdminKey', key)

register_container(Admin)
