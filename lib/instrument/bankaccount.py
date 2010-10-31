# -*- coding: utf-8 -*-

from lib.instrument.instrument import Instrument
from lib.db.container import register_container
from lib.db.model import mandatory

class BankAccount(Instrument):
  """BankAccount payment instrument"""
  @mandatory(str)
  def _val_number(self):
    pass
  
  @mandatory(str)
  def _val_aba(self):
    pass
register_container(BankAccount)
