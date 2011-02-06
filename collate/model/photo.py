# -*- coding: utf-8 -*-

from lib.db.container import Container
from lib.db.model import mandatory, optional

class Photo(Container):

  @mandatory(str, email=None)
  def val_email(self):
    assert "@" in self.email, 'member email must be a valid email address'
    assert "." in self.email, 'member email must be a valid email address'

  @mandatory(str, email=None)
  def val_user(self):
    assert len(self.filename) < 255, "username must be less than 255 characters long"
