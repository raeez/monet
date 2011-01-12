# -*- coding: utf-8 -*-

from lib.db.container import Container
from lib.db.model import mandatory, pointer

from alpha.model.user import User

class MailBox(Container):

  @pointer(User)
  def val_user(self):
    pass

  @mandatory(str, name=None)
  def val_name(self):
    assert len(self.name) < 255

  @mandatory(dict, settings={})
  def val_settings(self):
    pass
