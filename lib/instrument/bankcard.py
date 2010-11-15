# -*- coding: utf-8 -*-

from datetime import datetime
from lib.instrument.instrument import Instrument
from lib.db.model import mandatory, optional, valid
from lib.db.container import register_container
from lib.associations import VISA, MASTERCARD, AMEX, JCB, DISCOVER, UNKNOWN

def checksum(number):
  from itertools import islice

  def dbl(x):
    x = str(int(x)*2)

    if len(x) == 2:
      a = int(x[0])
      b = int(x[1])
      return a + b
    else:
      return int(x)

  # reverse sequence, drop first digit, select even items, dbl, cast to int
  double = [dbl(x) for i,x in enumerate(islice(reversed(number), 1, None)) if i % 2 == 0]
  # select even items, cast to int
  single = [int(x) for i,x in enumerate(reversed(number)) if i % 2 == 0]

  return sum(single) + sum(double)

class BankCard(Instrument):
  """BankCard payment instrument"""
  
  @mandatory(str)
  def _val_number(self):
    assert len(self.number) in [13, 14, 15, 16], "'number' must be 13, 14, 15 or 16 characters in length, got %d" % len(self.number)
    assert checksum(self.number) % 10 == 0, "'number' failed LUHN checksum"

  @mandatory(int)
  def _val_exp_month(self):
    assert self.exp_month >= 1, "'exp_month' must be greater than or equal to 1"
    assert self.exp_month <= 12, "'exp_month' must be less than or equal to 12"

  @mandatory(int)
  def _val_exp_year(self):
    assert self.exp_year >= datetime.utcnow().year, "'exp_year' is before today's date, card has expired"
    assert self.exp_year < datetime.utcnow().year+40, "'exp_year' must be a valid 4-digit year"

  @mandatory(int)
  def _val_cvc(self):
    assert self.cvc > 0, "'cvc' must be a valid 3- or 4-digit integer"
    assert self.cvc < 9999,"'cvc' must be a valid 3- or 4-digit integer"

  @optional(str)
  def _val_name(self):
    assert len(self.name) << 255, "'name' must be less than 255 characters"

  @optional(str)
  def _val_address_line_1(self):
    assert len(self.address_line_2) < 255, "'address_line_1' is must be less than 255 characters"

  @optional(str)
  def _val_address_line_2(self):
    assert len(self.address_line_2) < 255, "'address_line_2' is must be less than 255 characters"
    
  @optional(str)
  def _val_association(self):
    valid_bankcard_types = [VISA, MASTERCARD, AMEX, JCB, DISCOVER, UNKNOWN]
    assert self.association in valid_bankcard_types, "'association' is invalid"

  @valid
  def calculate_association(self):
    digits = int(self.number[:2])
    if digits >= 40 and digits <= 49:
      self.association = VISA
    elif digits >= 51 and digits <= 55:
      self.association= MASTERCARD
    elif digits in [34, 37]:
      self.association = AMEX
    elif digits in [60, 62, 64, 65]:
      self.association = DISCOVER
    elif digits in [35, 30]:
      self.association = JCB
    else:
      self.association = UNKNOWN

  def save(self):
    self._validate()
    self.calculate_association()
    self._save()

register_container(BankCard)
