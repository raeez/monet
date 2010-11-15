# -*- coding: utf-8 -*-

from pymongo.son_manipulator import SONManipulator
#from pymongo.bson.binary import Binary # TODO implement binary transform
from lib.db.model import VALIDATION_SIGNATURE, mandatory
from time import time
from bson import ObjectId
import json

class ResponseEncoder(json.JSONEncoder):
  """docstring for ObjectIDEncoder"""
  def default(self, obj):
    if isinstance(obj, ObjectId):
      return str(obj)
    return json.JSONEncoder.default(self, obj)

class ContainerTransform(SONManipulator):
  """SON Transform for containers"""

  def transform_outgoing(self, son, collection):
    if "_type" in son and son["_type"] in Container._types:
      return Container._types[son["_type"]](son)

    for (key, value) in son.items():
      if isinstance(value, dict):
        if "_type" in value and value["_type"] in Container._types:
          son[key] = Container._types[value["_type"]](value)
        else:
          son[key] = self.transform_outgoing(value, collection)
    return son


class NoAdapterError(Exception):
  pass

class InvalidContainer(Exception):
  pass

def get_container_pointer(id):
  # TODO actually implement, potentially as a SON Transform

  if isinstance(id, ObjectId):
    return id

  assert isinstance(id, unicode)
  id = str(id)
  try:
    obj = ObjectId(id)
  except Exception:
    return None
  return obj

class Container(dict):
  """db abstraction and model wrapper for logical objects"""
  
  @classmethod
  def default_adapter(cls):
    if 'def_adapter' not in cls.__dict__:
      from lib.db.mongo.connection import  adapter
      adapter.db.add_son_manipulator(ContainerTransform())
      cls.def_adapter = adapter
    return cls.def_adapter

  @classmethod
  def type(cls):
    return str(cls.__module__)

  @classmethod
  def group(cls):
    items = cls.type().split('.')
    items.pop() # get rid of current module
    items.reverse()
    _name = items.pop() #get first element
    for i in items:
      _name += '.' + items.pop()
    return str(_name)

  @classmethod
  def find(cls, params={}):
    return cls.default_adapter().find(cls.type(), params)

  @classmethod
  def find_one(cls, params={}):
    return cls.default_adapter().find_one(cls.type(), params)

  @classmethod
  def group_find(cls, params={}):
    return cls.default_adapter().group_find(cls.group(), params)

  @classmethod
  def group_find_one(cls, params={}):
    return cls.default_adapter().group_find_one(cls.group(), params)

  @classmethod
  def valid_member(cls, member, data):
    class ValidatorResponse(object):
      pass

    validator = VALIDATION_SIGNATURE+member
    temp = cls()

    r = ValidatorResponse()
    r.validator = validator

    if validator in dir(temp):
      try:
        temp[member] = data
        temp.__getattribute__(validator)()
        r.valid = True
        r.data = temp[member]
        r.errors = []
        r.args = ()
        return r
      except Exception as e:
        r.valid = False
        r.data = temp[member]
        r.errors = [x for x in e.args]
        r.args = e.args
        return r

    return None #not a member!

  @classmethod
  def __internal(cls):
    return ['_validated', '_type', '_created', '_merchant']

  @classmethod
  def safe_member(cls, member):
    return member not in cls.__internal()

  def __init__(self, d={}):
    super(Container, self).__init__()

    self.__setitem__("_type", self.__class__.type())
    self._validated = False
    self._created = int(time())

    if '_defaults' in dir(self):
      self._defaults()

    for key in d:
      self[key] = d[key]

  def __setitem__(self, key, value):
    if self.has_key(key) is False:
      super(Container, self).__setitem__(key, value)
      self.__setattr__(key, value)

    elif self.has_key(key) and self[key] != value:
      super(Container, self).__setitem__(key, value)
      self.__setattr__(key, value)

  def __setattr__(self, key, value):
    super(Container, self).__setattr__(key, value)
    self.__setitem__(key, value)

  def __delitem__(self, key): # TODO fix del attr, only del if has attr
    if self.has_key(key):
      super(Container, self).__delitem__(key)
      self.__delattr__(key)

  def __delattr__(self, key):
    if key in dir(self):
      super(Container, self).__delattr__(key)
    self.__delitem__(key)

  def validators(self):
    return [attr for attr in dir(self) if attr.startswith(VALIDATION_SIGNATURE)]

  def save(self):
    self._validate()
    self._save()

  def delete(self):
    self.__class__.default_adapter().delete(self["_type"], self._id)

  def _validate(self):
    for v in self.validators():
      self.__getattribute__(v)()
    self._validated = True

  def _save(self):
    try:
      self.enforce_validated()

      self.__delitem__('_validated')
      #self.__delattr__('_validated')
      
      if self.__class__.default_adapter() is None:
        raise NoAdapterError()

      self.__class__.default_adapter().save(self["_type"], self)
    except Exception as e:
      raise e
    finally:
      self._validated = False

  def enforce_validated(self):
    if self._validated is False:
      raise InvalidContainer()

  def to_dict(self):
    js = {}
    internal = self._internal()
    for k in self:
      if k not in internal:
        js[k] = self[k]
    return js

  def to_json(self):
    return json.dumps(self.to_dict(), cls = ResponseEncoder, sort_keys=True, indent=2)

  def _internal(self):
    return self.__class__.__internal()

  @mandatory
  def _val__created(self):
    assert self.created > 0
    assert self.created < time()

def register_container(t):
  assert isinstance(t, type)
  if '_types' not in dir(Container):
    Container._types = {}
  Container._types[t.__module__] = t
register_container(Container)
