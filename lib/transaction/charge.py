# -*- coding: utf-8 -*-

from transaction import Transaction
from lib.db.model import pointer, valid
from lib.db import MerchantKey

class Charge(Transaction):

  @pointer('BankCard', _instrument=None)
  def val_instrument(self):
    pass

  @valid
  def process(self):
    pk = MerchantKey.find_one({"_id" : self.processor_key})
    p = pk.get_processor()
    p.charge_card(self)
