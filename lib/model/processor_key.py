# -*- coding: utf-8 -*-

from lib.db.container import register_container
from lib.db.model import mandatory, valid, pointer
from lib.model.key import Key
from lib.processor.index import index as processor_index

class ProcessorKey(Key):
  """ProccesorKey logical object"""

  def _internal(self):
    return super(Key, self)._internal().append(['_merchant'])

  @mandatory(basestring)
  def _val_processor(self):
    assert self.processor in processor_index

  @valid
  def get_processor(self):
    return processor_index[self.processor]

  @pointer('Merchant')
  def _val__merchant(self):
    pass
    
register_container(ProcessorKey)
