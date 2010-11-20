# -*- coding: utf-8 -*-

from lib.db.adapter import NoAdapterError
from lib.db.model import mandatory
from lib.db.transform import ContainerTransform, ResponseEncoder, registered_containers
from time import time
import json

class InvalidContainer(Exception):
  pass

class MetaContainer(type):

  def __new__(mcl, classname, bases, class_dict):

    def __init__(self, d={}):
      super(Container, self).__init__()
     
      #run all validators once to set defaults
      self.__dict__['__mapped_validators__'] = {}
      for v in self.__class__.__validators__:
        try:
          self.__class__.__validators__[v](self)
        except:
          continue

      mapping = {}
      for member, func_name in self.__mapped_validators__.items():
        mapping[member] = self.__class__.__validators__[func_name]
      self.__class__.__mapped_validators__ = mapping

      self.__dict__['_validated'] = False # __dict__ to avoid hidden properties showing up in the container

      self._type = self.__module__
      self._created = int(time())

      for key in d:
        self[key] = d[key]

    def __setitem__(self, key, value):
      super(Container, self).__setitem__(key, value)
      super(Container, self).__setattr__(key, value)

    def __delitem__(self, key):
      super(Container, self).__delitem__(key)
      super(Container, self).__delattr__(key)

    def __setattr__(self, key, value):
      super(Container, self).__setattr__(key, value)
      super(Container, self).__setitem__(key, value)

    def __delattr__(self, key):
      super(Container, self).__delattr__(key)
      super(Container, self).__delitem__(key)

    __module__ = class_dict['__module__']
    items = __module__.split('.')
    items.pop() # get rid of current module
    items.reverse()
    _name = items.pop() #get first element
    for i in items:
      _name += '.' + items.pop()

    __group__ = str(_name)
    __type__ = __module__
    __inter__ = set(['_validated', '_type', '_created', '_merchant'])
    __validators__ = {}
    __defaults__ = {}

    validator_signatures = ['__mandatory', '__optional', '__pointer']
    
    def fetch_model(d):
      _val = {}
      for n in d:
        f = d[n]
        if 'func_name' in dir(f):
          for v in validator_signatures:
            if v in str(f.__repr__()):
              _val[n] = f
              continue
      return _val

    for b in bases:
      if 'builtin' not in b.__module__:
        for k in b.__validators__:
          __validators__[k] = b.__validators__[k]

    v = fetch_model(class_dict)
    for k in v:
      __validators__[k] = v[k]

    new_dict = {'__init__' : __init__,

                '__setitem__' : __setitem__,
                '__delitem__' : __delitem__,
                '__setattr__' : __setattr__,
                '__delattr__' : __delattr__,

                '__group__' : __group__,
                '__inter__' : __inter__,
                '__validators__' : __validators__,
                '__defaults__' : __defaults__,
                '__type__' : __type__,

                '_encoder' : ResponseEncoder,
               }

    # inherit the rest of the behaviour
    for k in class_dict:
      new_dict[k] = class_dict[k]

    t = super(MetaContainer, mcl).__new__(mcl, classname, bases, new_dict)
    registered_containers[t.__module__] = t

    return t

class Container(dict):
  __metaclass__ = MetaContainer

  def __repr__(self):
    return self.to_json(show_internal=True)

  @classmethod
  def default_adapter(cls):
    if 'def_adapter' not in cls.__dict__:
      from lib.db.mongo.connection import adapter
      adapter.db.add_son_manipulator(ContainerTransform())
      cls.def_adapter = adapter
    return cls.def_adapter

  @classmethod
  def find(cls, params={}):
    return cls.default_adapter().find(cls.__type__, params)

  @classmethod
  def find_one(cls, params={}):
    return cls.default_adapter().find_one(cls.__type__, params)

  @classmethod
  def group_find(cls, params={}):
    return cls.default_adapter().group_find(cls.__group__, params)

  @classmethod
  def group_find_one(cls, params={}):
    return cls.default_adapter().group_find_one(cls.__group__, params)

  @classmethod
  def validate_member(cls, member, data):
  
    #TODO reimplement sane

    validator = cls.__mapped_validators__.get(member, None)
    temp = cls()

    if validator is None:
      raise AttributeError("%r has no validator for member '%r'\n we checked: %r" % (cls, member, cls.__mapped_validators__))

    try:
      temp[member] = data
      validator(temp)
      valid = True
      data = temp[member]
      errors = []
      args = ()
      return valid, data, errors, args

    except Exception as e:
      valid = False
      data = temp[member]
      errors = [x for x in e.args]
      args = e.args
      return valid, data, errors, args

    return None, None, None, None #not a member!

  @classmethod
  def safe_member(cls, member):
    return member not in cls.__inter__

  def _save(self):
    try:
      self.enforce_validated()
      
      if self.__class__.default_adapter() is None:
        raise NoAdapterError()

      self.__class__.default_adapter().save(self["_type"], self)

    finally:
      self.__dict__['_validated'] = False

  def save(self):
    self._validate()
    self._save()

  def delete(self):
    self.__class__.default_adapter().delete(self["_type"], self._id)

  def _validate(self):
    for v in self.__validators__:
      self.__validators__[v](self)
    self._validated = True

  def enforce_validated(self):
    if self.__dict__['_validated'] is False:
      raise InvalidContainer()

  def to_dict(self, show_internal=False):
    d = {}
    for k in self:
      if k not in self.__inter__:
        d[k] = self[k]
      elif show_internal:
        d[k] = self[k]
    return d

  def to_json(self, show_internal=False):
    return json.dumps(self.to_dict(show_internal),
                      cls = self.__class__._encoder,
                      sort_keys=True,
                      indent=2)

  @mandatory(int, _created=0)
  def val_created(self):
    assert self._created > 0
    assert self._created < time()

  @mandatory(str, _type=None)
  def val_type(self):
    assert self._type == self.__module__
