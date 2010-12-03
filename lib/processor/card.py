# -*- coding: utf-8 -*-

from processor import Processor
from lib.instrument.bankcard import BankCard

class CardProcessor(Processor):
  """docstring for CardProcessor"""
  @classmethod
  def refund_card(cls, txn):
    bank_card = BankCard.find_one({"_id" : txn.instrument})
    # TODO log!
    print str(cls.__name__) + " processing " + str(txn) + " with instrument " + str(bank_card)
  def charge_card(cls, txn):
    # TODO log!
    bank_card = BankCard.find_one({"_id" : txn.instrument})
    print str(cls.__name__) + " processing " + str(txn) + " with instrument " + str(bank_card)
