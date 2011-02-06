# -*- coding: utf-8 -*-

from lib.db.model import pointer
from lib.model.key import Key

import collate.model.admin

class AdminKey(Key):
  
  @pointer(collate.model.admin.Admin)
  def val_admin(self):
    pass