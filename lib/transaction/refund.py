# -*- coding: utf-8 -*-

from transaction import Transaction
from lib.db.model import pointer, valid
from lib.model.merchantkey import MerchantKey

class Refund(Transaction):

  @pointer('BankCard', _instrument=None)
  def val_instrument(self):
    pass

  @valid
  def process(self):
    #TODO log!
    pk = MerchantKey.find_one({"_id" : self.processor_key})
    p = pk.get_processor()
    p.refund_card(self)
