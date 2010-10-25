from lib.db.container import Container, register_container
from lib.db.model import mandatory, optional, pointer, is_container
from time import time

class Merchant(Container):
  """Merchant logical entity"""

  def _defaults(self):
    self.parent = 'ROOT_MERCHANT'
    self.invites = 0
    self.legal = 0
    self.processor_keys = []
    self.settings = {}

  @mandatory(str)
  def _val_email(self):
    try:
      assert "@" in self.email
      assert "." in self.email
    except AssertionError:
      raise AssertionError('member email must be a valid email address')

  @mandatory(str)
  def _val_password(self):
    pass

  @mandatory(str)
  def _val_name(self):
    assert len(self.name) < 255

  @mandatory(int)
  def _val_invites(self):
    assert self.invites >= 0

  @pointer('Merchant')
  def _val_parent(self):
    pass

  @mandatory(int)
  def _val_legal(self):
    assert self.legal >= 0

  @mandatory(list)
  def _val_processor_keys(self):
    for key in self.processor_keys:
      assert is_container('ProcessorKey', key)

  @mandatory(dict)
  def _val_settings(self):
    pass

  @optional(int)
  def _val_last_login(self):
    try:
      assert self.last_login > 1286688330
      assert self.last_login < time()
    except AssertionError:
      raise AssertionError("Ivalid time-stamp for member 'time'")

register_container(Merchant)
