# -*- coding: utf-8 -*-

from lib.instrument.instrument import Instrument
from lib.db.model import mandatory

class BankAccount(Instrument):

  @mandatory(str, number=None)
  def val_number(self):
    pass
  
  @mandatory(str, aba=None)
  def val_aba(self):
    pass
