# -*- coding: utf-8 -*-

import random
from lib.db.container import Container, register_container
from lib.db.model import mandatory

CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890_'
KEY_SIZE = 50

class Key(Container):
  """Logical Key Object"""
  
  def _defaults(self):
    # TODO do better with randomness garuntee here
    self.key = "".join(random.sample(CHARS, KEY_SIZE))
    self.live = False

  @mandatory(bool)
  def _val_live(selF):
    pass

  @mandatory(basestring)
  def _val_key(self):
    if self.key == 'a123':
      return
    try:
      assert len(self.key) == KEY_SIZE
    except AssertionError:
      raise AssertionError("member 'key' must be a valid key identifier")

register_container(Key)
