# -*- coding: utf-8 -*-

from lib.db.model import pointer
from lib.model.key import Key

class AdminKey(Key):
  """ProccesorKey logical object"""
  
  @pointer('Admin', _admin=None)
  def val_admin(self):
    pass
