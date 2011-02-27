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

  @mandatory(int, visible=1)
  def val_visible(self):
    assert self.visible == 1 or self.visible == 0, "visible must be a binary value!"

  @optional(str, multi_session=None)
  def val_multi_session(self):
    pass

  @pointer(Memory, memory=None)
  def val_memory(self):
    pass
