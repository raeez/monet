# -*- coding: utf-8 -*-

from transaction import Transaction
from lib.db.container import register_container
from lib.db.model import pointer, valid
from lib.db import ProcessorKey

class Refund(Transaction):
  """docstring for Refund"""
  @pointer('BankCard')
  def _val_instrument(self):
    pass

  @valid
  def process(self):
    #TODO log!
    pk = ProcessorKey.find_one({"_id" : self.processor_key})
    p = pk.get_processor()
    p.refund_card(self)
register_container(Refund)
