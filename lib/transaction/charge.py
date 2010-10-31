# -*- coding: utf-8 -*-

from transaction import Transaction
from lib.db.container import register_container
from lib.db.model import pointer, valid
from lib.db import ProcessorKey

class Charge(Transaction):
  """docstring for Refund"""
  @pointer('BankCard')
  def _val_instrument(self):
    pass

  @valid
  def process(self):
    pk = ProcessorKey.find_one({"_id" : self.processor_key})
    p = pk.get_processor()
    p.charge_card(self)
register_container(Charge)
