from lib.db.container import Container, register_container
from lib.db.model import mandatory, pointer

class Key(Container):
  """Logical Key Object"""
  
  def _defaults(self):
    # TODO generate a random key here
    self.key = "RANDOM_KEY_HERE_TODO_FIX_ME"

  def _internal(self):
    return super(Key, self)._internal().append(['merchant'])

  @mandatory(str)
  def _val_key(self):
    try:
      assert len(self.key) > 0
    except AssertionError:
      raise AssertionError("member 'key' must be a valid key identifier")

  @pointer('Merchant')
  def _val__merchant(self):
    pass
register_container(Key)
