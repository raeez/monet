# -*- coding: utf-8 -*-

from lib.db.container import register_container
from lib.db.model import pointer
from lib.model.key import Key

class AdminKey(Key):
  """ProccesorKey logical object"""
  
  @pointer('Admin')
  def _val__admin(self):
    pass
    
register_container(AdminKey)
