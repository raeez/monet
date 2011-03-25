# -*- coding: utf-8 -*-

from lib.db.container import Container
from lib.db.model import mandatory, optional

class User(Container):

  @mandatory(str, email=None)
  def val_email(self):
    assert "@" in self.email, 'member email must be a valid email address'
    assert "." in self.email, 'member email must be a valid email address'

  @mandatory(str, password=None)
  def val_password(self):
    pass

  @mandatory(str, name=None)
  def val_name(self):
    assert len(self.name) < 255

  @mandatory(int, invites=0)
  def val_invites(self):
    assert self.invites >= 0

  @mandatory(dict, settings={})
  def val_settings(self):
    pass

  @mandatory(list, memories=[])
  def val_memories(self):
    pass

  @optional(int, last_login=None)
  def val_last_login(self):
    assert self.last_login > 1286688330, "Ivalid time-stamp for member 'time'"

  def set_password(self, new_password):
    import bcrypt
    self.password = bcrypt.hashpw(new_password, bcrypt.gensalt(10))
    self.save()
