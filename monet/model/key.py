# -*- coding: utf-8 -*-

from lib.db.container import Container
from lib.db.model import mandatory
from lib.util.rand import generate_key

class Key(Container):

  @mandatory(bool, live=False)
  def val_live(self):
    pass

  @mandatory(str, key=generate_key)
  def val_key(self):
      assert len(self.key) == KEY_SIZE, "'key' must be a valid key identifier"
