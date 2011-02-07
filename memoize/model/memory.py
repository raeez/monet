# -*- coding: utf-8 -*-

from lib.db.container import Container
from lib.db.model import mandatory, optional, pointer
from memoize.model import User

class Memory(Container):

  @mandatory(str, name=None)
  def val_filename(self):
    assert len(self.name) < 255, "name must be less than 255 characters long"

  @mandatory(list, items=[])
  def val_items(self):
    assert isinstance(self.items, list)

  @pointer(User, user=None)
  def val_user(self):
    pass
