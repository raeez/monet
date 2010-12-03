# -*- coding: utf-8 -*-

import random
from lib.db.container import Container
from lib.db.model import mandatory

CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890_'
KEY_SIZE = 50

class Key(Container):
  """Logical Key Object"""

  @mandatory(bool, live=False)
  def val_live(self):
    pass

  @mandatory(str, key="".join(random.sample(CHARS, KEY_SIZE)))
  def val_key(self):
      assert len(self.key) == KEY_SIZE, "'key' must be a valid key identifier"
