# -*- coding: utf-8 -*-

from lib.db.container import Container
from lib.db.model import mandatory, optional, pointer, valid
from memoize.model import Memory

class Photo(Container):

  @mandatory(str, filename="unprocessed.jpg")
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

  @mandatory(bool, processed=False)
  def val_processed(self):
    pass

  @mandatory(tuple, dimensions=(300,175))
  def val_dimensions(self):
    width, height = self.dimensions
    assert height == 175, "Invalid height of '%d' pixels; must be 175 pixels in size" % height
  
  @optional(str, multi_session=None)
  def val_multi_session(self):
    pass

  @pointer(Memory, memory=None)
  def val_memory(self):
    pass

  @valid # ensure we're working on a valid instance
  def resize(self, filename, abs_path):
    assert (not self.processed), "Image already resized!"

    from memoize.tasks import thumbnail 
    thumbnail.delay(filename, abs_path, str(self._id))
