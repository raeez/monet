# -*- coding: utf-8 -*-

from datetime import datetime
from lib.instrument.instrument import Instrument
from lib.db.model import mandatory, optional, valid
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
  
  @mandatory(str, number=None)
  def val_number(self):
    assert len(self.number) in [13, 14, 15, 16], "'number' must be 13, 14, 15 or 16 characters in length, got %d" % len(self.number)
    assert checksum(self.number) % 10 == 0, "'number':%r failed LUHN checksum" % self.number

  @mandatory(int, exp_month=None)
  def val_exp_month(self):
    assert self.exp_month >= 1, "'exp_month' must be greater than or equal to 1"
    assert self.exp_month <= 12, "'exp_month' must be less than or equal to 12"

  @mandatory(int, exp_year=None)
  def val_exp_year(self):
    assert self.exp_year >= datetime.utcnow().year, "'exp_year' is before today's date, card has expired"
    assert self.exp_year < datetime.utcnow().year+40, "'exp_year' must be a valid 4-digit year"

  @mandatory(int, cvc=None)
  def val_cvc(self):
    assert self.cvc > 0, "'cvc' must be a valid 3- or 4-digit integer"
    assert self.cvc < 9999,"'cvc' must be a valid 3- or 4-digit integer"

  @optional(str, name=None)
  def val_name(self):
    assert len(self.name) << 255, "'name' must be less than 255 characters"

  @optional(str, address=None)
  def val_address(self):
    assert len(self.address) < 255, "'address' is must be less than 255 characters"

  @optional(str, association=None)
  def val_association(self):
    valid_bankcard_types = [VISA, MASTERCARD, AMEX, JCB, DISCOVER, UNKNOWN]
    assert self.association in valid_bankcard_types, "'association' is invalid"

  @valid
  def calculate_association(self):
    digits = int(self.number[:2])
    if digits in [40, 41, 42, 43, 44, 45, 46, 47, 48, 49]:
      self.association = VISA
    elif digits in [51, 52, 53, 54, 55]:
      self.association= MASTERCARD
    elif digits in [34, 37]:
      self.association = AMEX
    elif digits in [38, 60, 62, 64, 65]:
      self.association = DISCOVER
    elif digits in [18, 31, 33, 35]:
      self.association = JCB
    else:
      self.association = UNKNOWN

  def save(self):
    self._validate()
    self.calculate_association()
    self._save()
