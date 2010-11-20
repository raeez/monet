# -*- coding: utf-8 -*-

from lib.db.model import mandatory, valid
from lib.model.key import Key
from lib.model.merchantobject import MerchantObject
from lib.processor.index import index as processor_index

class MerchantKey(Key, MerchantObject):
  """ProccesorKey logical object"""

  @mandatory(str, processor=None)
  def val_processor(self):
    assert self.processor in processor_index

  @valid
  def get_processor(self):
    return processor_index[self.processor]
