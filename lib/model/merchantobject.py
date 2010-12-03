# -*- coding: utf-8 -*-

from lib.db.container import Container
from lib.db.model import pointer

class MerchantObject(Container):

  @pointer('Merchant', _merchant=None)
  def val_merchant(self):
    pass
