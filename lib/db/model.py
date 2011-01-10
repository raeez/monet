# -*- coding: utf-8 -*-

from functools import wraps
from lib.db.objectid import ObjectId

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
    except TypeError:
      raise TypeError("member '%r' must be of type '%r'" % (member_name, t))
    except ValueError:
      raise TypeError("member '%r' must be of type '%r'" % (member_name, t))
  return

def enforce_member_length(self, member_name, t):
  if isinstance(t, basestring):
    assert len(self.__getattribute__(member_name)) < 255, "member '%r' must be less than 255 characters in length'" % member_name

def optional(t=str, **var):
  def _optional(function):
    def __optional__(self):
      assert len(var) >= 1, "@optional:%r directive missing variable names" % function.__name__
      member_name, member_value = var.items()[0]

      if member_value is not None and member_name not in dir(self):
        # TODO fix this to be the 'proper' way to test if the obj is a function
        if hasattr(member_value, '__call__'):
          self.__setattr__(member_name, member_value.__call__())
        else:
          self.__setattr__(member_name, member_value)
       
      if member_name not in self.__class__.__validators__:
        self.__dict__['__mapped_validators__'][member_name] = function.func_name

      if member_name not in dir(self):
        return
      
      enforce_member_type(self, member_name, t)
      enforce_member_length(self, member_name, t)
      
      return function(self)
    return __optional__
  return _optional

def mandatory(t=str, **var):
  def _mandatory(function):
    def __mandatory__(self):
      assert len(var) >= 1, "@mandatory:%r directive missing variable names" % function.__name__
      member_name, member_value = var.items()[0]

      if member_value is not None and member_name not in dir(self):
        # TODO fix this to be the 'proper' way to test if the obj is a function
        if hasattr(member_value, '__call__'):
          self.__setattr__(member_name, member_value.__call__())
        else:
          self.__setattr__(member_name, member_value)

      if member_name not in self.__class__.__validators__:
        self.__dict__['__mapped_validators__'][member_name] = function.func_name

      if member_name not in dir(self):
        raise AttributeError("missing member '%r' of type '%r'" % (member_name, t))
      
      enforce_member_type(self, member_name, t)
      enforce_member_length(self, member_name, t)

      return function(self)
    return __mandatory__
  return _mandatory

def pointer(t, **var):
  def _pointer(function):
    def __pointer__(self):
      assert len(var) >= 1, "@pointer:%r directive missing variable names" % function.__name__
      member_name, member_value = var.items()[0]

      if member_name not in self.__class__.__validators__:
        self.__dict__['__mapped_validators__'][member_name] = function.func_name

      if member_name not in dir(self):
        raise AttributeError("missing member '%r' of type '%r'" % (member_name, t))

      try:
        assert isinstance(self.__getattribute__(member_name), ObjectId)
        assert is_container(self.__getattribute__(member_name), t)
      except AssertionError:
        raise TypeError("member: " + member_name + " must be a pointer to type " + str(t))
      
      return function(self)
    return __pointer__
  return _pointer

def valid(function):
  @wraps(function)
  def _valid(*args, **kw):
    self = args[0]
    self.enforce_validated()
    return function(*args, **kw)
  return _valid
