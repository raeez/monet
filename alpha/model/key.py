# -*- coding: utf-8 -*-

import random
from lib.db.container import Container
from lib.db.model import mandatory

KEY_SIZE = 50
SAMPLE = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890_'

def generate_key(key_size=KEY_SIZE, sample=SAMPLE):
  return "".join(random.sample(sample, key_size))

class Key(Container):

  @mandatory(bool, live=False)
  def val_live(self):
    pass

  @mandatory(str, key=generate_key)
  def val_key(self):
      assert len(self.key) == KEY_SIZE, "'key' must be a valid key identifier"
