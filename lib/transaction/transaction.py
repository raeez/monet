# -*- coding: utf-8 -*-

from lib.db.container import Container, register_container
from lib.db.model import mandatory, pointer, valid
from lib.currencies import CURRENCIES

class Transaction(Container):
  """Transaction Logical Object"""

  def _internal(self):
    return super(Transaction, self)._internal().append(['merchant'])

  @mandatory(int)
  def _val_amount(self):
    assert self.amount > 0

  @mandatory(str)
  def _val_currency(self):
    assert self.currency.upper() in CURRENCIES

  @pointer('ProcessorKey')
  def _val_processer_key(self):
    pass

  @pointer('Merchant')
  def _val_merchant(self):
    pass

  @valid
  def process(self): #auth, settle etc.
    pass

register_container(Transaction)
