# -*- coding: utf-8 -*-

from lib.db.container import Container
from lib.db.model import mandatory, optional, pointer
from memoize.model import Memory

class Quote(Container):

  @mandatory(str, name=None)
  def val_name(self):
    assert len(self.name) < 255, "username must be less than 255 characters long"

  @mandatory(str, body="")
  def val_body(self):
    assert len(self.body) < 150, "body must be less than 150 characters long"

  @pointer(Memory, memory=None)
  def val_memory(self):
    pass
