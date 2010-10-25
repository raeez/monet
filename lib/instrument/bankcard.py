from instrument import Instrument
from datetime import datetime
from lib.db.model import mandatory, optional, valid
from lib.db.container import register_container
from lib.associations import VISA, MASTERCARD, AMEX, JCB, DISCOVER, UNKNOWN

class BankCard(Instrument):
  """BankCard payment instrument"""
  
  @mandatory(str)
  def _val_number(self):
    print repr(self.number)
    try:
      assert len(self.number) == 16
    except AssertionError:
      raise AssertionError("member 'number' must be 16 characters in length")

  @mandatory(int)
  def _val_exp_month(self):
    try:
      assert self.exp_month > 0
      assert self.exp_month < 13
    except AssertionError:
      raise AssertionError("member 'exp_month' must represent a valid month in the year, taking on values ranging from 1-12")

  @mandatory(int)
  def _val_exp_year(self):
    try:
      assert self.exp_year >= datetime.utcnow().year
      assert self.exp_year < datetime.utcnow().year+40
    except AssertionError:
      raise AssertionError("member 'exp_year' must be a valid 4-digit year, taking on values from the present year onwards")

  @mandatory(int)
  def _val_cvc(self):
    try:
      assert self.cvc > 0
      assert self.cvc < 9999
    except AssertionError:
      raise AssertionError("member 'cvc' must represent a valid cvc, cvv or cvv2 code")

  @optional(str)
  def _val_name(self):
    pass

  @optional(str)
  def _val_address_line_1(self):
    pass

  @optional(str)
  def _val_address_line_2(self):
    pass
    
  @optional(str)
  def _val_association(self):
    valid_bankcard_types = [VISA, MASTERCARD, AMEX, JCB, DISCOVER, UNKNOWN]
    assert self.association in valid_bankcard_types

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
    elif digits == 35:
      self.association = JCB
    else:
      self.association = UNKNOWN

  def save(self):
    self._validate()
    self.calculate_association()
    self._save()

register_container(BankCard)
