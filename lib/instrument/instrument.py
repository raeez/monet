from lib.db.container import Container
from lib.db.model import pointer

class Instrument(Container):
  """Payment Instrument logical object"""
  @pointer('Merchant')
  def _val__merchant(self):
    pass
