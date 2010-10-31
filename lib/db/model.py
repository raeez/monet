# -*- coding: utf-8 -*-

from functools import wraps
from bson.objectid import ObjectId

VALIDATION_SIGNATURE = "_val_"

def is_container(container, type):
  # TODO implement
  return True

def enforce_member_type(self, member_name, t):
  member = self.__getattribute__(member_name)
  try:
    assert(isinstance(member, t))
    return
  except AssertionError:
    try:
      cast = t(member)
      self.__setattr__(member_name, cast)
    except ValueError:
      raise TypeError("member: " + member_name + " must be of type " + str(t))
    except TypeError:
      raise TypeError("member: " + member_name + " must be of type " + str(t))
  return

def enforce_member_length(self, member_name, t):
  if t == str:
    try:
      assert len(self.__getattribute__(member_name)) < 255
    except AssertionError:
      raise AssertionError("member '" + member_name + "' must be less than 255 characters in length'")

def optional(t=str):
  def _optional(function):
    def __optional(*args, **kw):
      member_name = function.func_name[len(VALIDATION_SIGNATURE):]
      self = args[0]

      if member_name not in dir(self):
        return
      
      enforce_member_type(self, member_name, t)
      enforce_member_length(self, member_name, t)
      
      return function(*args, **kw)
    return __optional
  return _optional

def mandatory(t=str):
  def _mandatory(function):
    def __mandatory(*args, **kw):
      member_name = function.func_name[len(VALIDATION_SIGNATURE):]
      self = args[0]

      if member_name not in dir(self):
        raise TypeError("missing member: " + member_name + " of type " + str(t))

      enforce_member_type(self, member_name, t)
      enforce_member_length(self, member_name, t)

      return function(*args, **kw)
    return __mandatory
  return _mandatory

def pointer(t):
  def _pointer(function):
    def __pointer(*args, **kw):
      member_name = function.func_name[len(VALIDATION_SIGNATURE):]
      self = args[0]

      if member_name not in dir(self):
        raise TypeError("missing member: " + member_name + " of type " + str(t))

      try:
        assert isinstance(self.__getattribute__(member_name), ObjectId)
        assert is_container(self.__getattribute__(member_name), t)
      except AssertionError:
        raise TypeError("member: " + member_name + " must be a pointer to type " + str(t))
      
      return function(*args, **kw)
    return __pointer
  return _pointer


def valid(function):
  @wraps(function)
  def _valid(*args, **kw):
    self = args[0]
    self.enforce_validated()
    return function(*args, **kw)
  return _valid
