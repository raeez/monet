# -*- coding: utf-8 -*-

from lib.db.model import mandatory, pointer, valid
from lib.model.merchantobject import MerchantObject
from lib.currencies import CURRENCIES

class Transaction(MerchantObject):
  """Transaction Logical Object"""

  @mandatory(int, amount=0)
  def val_amount(self):
    assert self.amount > 0

  @mandatory(str, currency='usd')
  def val_currency(self):
    assert self.currency.upper() in CURRENCIES

  @pointer('MerchantKey', key=None)
  def val_key(self):
    pass

  @valid
  def process(self): #auth, settle etc.
    pass
