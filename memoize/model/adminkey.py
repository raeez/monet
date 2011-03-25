# -*- coding: utf-8 -*-

from lib.db.model import pointer
from lib.model.key import Key

import monet.model.admin

class AdminKey(Key):
  
  @pointer(monet.model.admin.Admin, admin=None)
  def val_admin(self):
    pass
