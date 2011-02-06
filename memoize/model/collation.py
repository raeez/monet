# -*- coding: utf-8 -*-

from lib.db.container import Container
from lib.db.model import mandatory, optional

class Collation(Container):

  @mandatory(str, email=None)
  def val_email(self):
    assert "@" in self.email, 'member email must be a valid email address'
    assert "." in self.email, 'member email must be a valid email address'
