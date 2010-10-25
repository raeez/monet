from lib.db.container import register_container
from lib.db.model import mandatory, valid
from lib.key.base import Key
from index import index as processor_index

class ProcessorKey(Key):
  """ProccesorKey logical object"""

  @mandatory(str)
  def _val_processor(self):
    assert self.processor in processor_index

  @mandatory(bool)
  def _val_live(self):
    pass

  @mandatory(str)
  def _val_merchant_id(self):
    pass

  @valid
  def get_processor(self):
    return processor_index[self.processor]
    
register_container(ProcessorKey)
