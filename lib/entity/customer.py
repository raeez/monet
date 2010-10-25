from lib.db.container import Container, register_container
from lib.db.model import mandatory, pointer, is_container

class Customer(Container):
  """Customer logical entity"""

  def _defaults(self):
    self.instruments = []

  @mandatory(str)
  def _val_email(self):
    try:
      assert "@" in self.email
      assert "." in self.email
      assert len(self.email) < 255
    except AssertionError:
      raise AssertionError('email must be a valid email address')

  @mandatory(list)
  def _val_instruments(self):
    for i in self.instruments:
      assert is_container('Instrument', i)

  @pointer('Instrument')
  def _val_default_instrument(self):
    pass

  @pointer('Merchant')
  def _val__merchant(self):
    pass

register_container(Customer)
