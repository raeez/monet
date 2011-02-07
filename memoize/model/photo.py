# -*- coding: utf-8 -*-

from lib.db.container import Container
from lib.db.model import mandatory, optional, pointer
from memoize.model import Memory

class Photo(Container):

  @mandatory(str, filename=None)
  def val_user(self):
    assert len(self.filename) < 255, "username must be less than 255 characters long"

  @mandatory(str, title=None)
  def val_title(self):
    assert len(self.title) < 255, "username must be less than 255 characters long"

  @mandatory(str, caption=None)
  def val_caption(self):
    assert len(self.caption) < 255, "username must be less than 255 characters long"

  @pointer(Memory, memory=None)
  def val_memory(self):
    pass
