# -*- coding: utf-8 -*-

from flask import request
from functools import wraps
import json
from lib.db.container import ResponseEncoder, get_container_pointer
from lib.db import ProcessorKey, Merchant, BankCard, BankAccount

PROCESSOR_KEY = '_key'
OBJECT_ID = '_id'

class RequestError(dict):
  def __init__(self):
    super(RequestError, self).__init__()
    self.request = request
    self['resource'] = request.path
    self['method'] = request.method
    self['error'] = "%s" % self.__class__.__name__
    self['message'] = "%s: something went wrong" % self.__class__.__name__

  def log(self):
    if request.merchant:
      return "%s[%s]: %s on %s with %s: %s" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items), self.__class__.__name__)
    return "%s on %s with %s: %s" % (request.method, request.path, repr(request._items), self.__class__.__name__)

  def to_json(self):
    return json.dumps(self, sort_keys=True, indent=2, cls=ResponseEncoder)+"\n"

class MissingKeyError(RequestError):
  def __init__(self):
    super(MissingKeyError, self).__init__()
    self['message'] = "%s: supplied key: ('%s' : %s)" % (self.__class__.__name__, PROCESSOR_KEY, request._items.get(PROCESSOR_KEY))

class InvalidKeyError(RequestError):
  def __init__(self):
    super(InvalidKeyError, self).__init__()
    self['message'] = "%s: supplied key: ('%s' : %s)" % (self.__class__.__name__, PROCESSOR_KEY, request._items.get(PROCESSOR_KEY))

class DanglingKeyError(RequestError):
  def __init__(self):
    super(DanglingKeyError, self).__init__()
    self['message'] = "%s: supplied key: ('%s : %s) has no associated merchant" % (self.__class__.__name__, PROCESSOR_KEY, request._items.get(PROCESSOR_KEY))

class RequiredArgumentError(RequestError):
  def __init__(self, arg):
    super(RequiredArgumentError, self).__init__()
    self['message'] = "%s: '%s' argument is missing" % (self.__class__.__name__, arg)

class ForbiddenArgumentError(RequestError):
  def __init__(self, arg):
    super(ForbiddenArgumentError, self).__init__()
    self['message'] = "%s: '%s'" % (self.__class_, arg)

class InvalidArgumentError(RequestError):
  def __init__(self, arg):
    super(InvalidArgumentError, self).__init__()
    self['message'] = "%s: '%s'" % (self.__class__.__name__, arg)

class ValidationError(RequestError):
  def __init__(self, exception):
    super(ValidationError, self).__init__()
    self['message'] = "%s: %s " % (self.__class__.__name__, exception)

class InternalError(RequestError):
  def __init__(self):
    super(InternalError, self).__init__()
    self['message'] = "%s: Something broke" % self.__class__.__name__

def sanitize(data, safe_chars):
  safe = ""
  for i, ele in enumerate(data):
    if i + safe_chars < len(data):
      safe += 'x'
    else:
      safe += ele
  return safe

def sanitize_container(input):
  if isinstance(input, BankAccount):
    del input.aba
    input.number = sanitize(input.number, 2)
    return input

  elif isinstance(input, BankCard):
    del input.exp_month
    del input.exp_year
    del input.cvc
    input.number = sanitize(input.number, 4)
    return input
  return input

def out(input):
  base = {}

  if isinstance(input, list):
    o = []
    for element in input:
      o.append(sanitize_container(element).to_dict())
    return json.dumps(o, sort_keys=True, indent=2, cls=ResponseEncoder)+"\n"

  elif isinstance(input, RequestError):
    return input.to_json()

  elif isinstance(input, Exception):
    errors = []
    for item in input.args:
      errors.append(item)

    base["errors"] = errors

    return json.dumps(base, sort_keys=True, indent=2, cls=ResponseEncoder)+"\n"

  return sanitize_container(input).to_json()+"\n"

class Response:
  def __init__(self, log):
    self.log = log

  def api_request(self, function):
    @wraps(function)
    def _api_request(*args, **kw):

      request._items = {}
      for key in request.args:
        request._items[key] = request.args[key]
      for key in request.form:
        request._items[key] = request.form[key]

      if request._items.has_key(OBJECT_ID):
        request._items[OBJECT_ID] = get_container_pointer(request._items[OBJECT_ID])

      request.merchant = None
      request.query = {}

      if request._items.has_key(PROCESSOR_KEY) is False:
        error = MissingKeyError()
        self.log['request'].debug(error.log())
        return out(error), 400

      request.processor_key = ProcessorKey.find_one({"key" : request._items.get(PROCESSOR_KEY)})

      if request.processor_key is None:
        error = InvalidKeyError()
        self.log['request'].debug(error.log())
        return out(error), 400
      else:
        request.merchant = Merchant.find_one({"_id" : get_container_pointer(request.processor_key._merchant)})

      if request.merchant is None:
        error = DanglingKeyError()
        self.log['request'].critical(error.log())
        return out(error), 500
      else:
        request.query['_merchant'] = request.merchant._id

      del request._items['_key']

      return function(*args, **kw)
    return _api_request

  def api_resource(self, t):
    def _api_resource(function):
      @wraps(function)
      @self.api_get(t)
      @self.api_post(t)
      @self.api_put(t)
      @self.api_delete(t)
      def __api_resource(*args, **kw):
        return function(*args, **kw)
      return __api_resource
    return _api_resource

  def api_get(self, t):
    def _api_get(function):
      @wraps(function)
      @self.args_required([])
      @self.args_forbidden(['_merchant'])
      def __api_get(*args, **kw):

        if request.method == 'GET':
          self.log['request'].debug("%s[%s]: %s on %s with items %s" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))
          
          errors = []
          for key in request._items:
            if key != PROCESSOR_KEY and key != OBJECT_ID and t.safe_member(key):
              data = request._items[key]

              r = t.valid_member(key, data)
              if r is not None:
                if r.valid is False:
                  error = ValidationError(TypeError(r.args))
                  self.log['request'].debug(error.log())
                  errors.append(error)
                  continue
                else:
                  data = r.data
              request.query[key] = data

          if len(errors) > 0:
            return out(errors), 400

          self.log['request'].debug("%s[%s]: %s on %s with query %s" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request.query)))

          obj = t.find(request.query)

          if obj is None:
            error = RequestError()
            self.log['request'].critical(error.log())
            return out(error), 400
          else:
            self.log['request'].debug("%s[%s]: %s on %s with query %s SUCCESS" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))
            return out(obj)
        return function(*args, **kw)
      return __api_get
    return _api_get

  def api_post(self, t):
    def _api_post(function):
      @wraps(function)
      @self.args_required([])
      @self.args_forbidden(['_merchant', '_id'])
      def __api_post(*args, **kw):

        if request.method == 'POST':
          self.log['request'].debug("%s[%s]: %s on %s with items %s" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))

          obj = t()
          obj['_merchant'] = request.merchant._id

          if request.query.has_key('_id'):
            obj['_id'] = request.query['_id']

          for key in request._items:
            if key != PROCESSOR_KEY and t.safe_member(key):
              obj[key] = request._items[key]

          self.log['request'].debug("%s[%s]: %s on %s with query %s" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(obj)))

          try:
            obj._validate()
          except Exception as e:
            error = ValidationError(e)
            self.log['request'].debug(error.log())
            return out(error), 400

          obj.save()
          
          self.log['request'].debug("%s[%s]: %s on %s with query %s SUCCESS" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))

          return out(obj)
        return function(*args, **kw)
      return __api_post
    return _api_post

  def api_put(self, t):
    def _api_put(function):
      @wraps(function)
      @self.args_required(['_id'])
      @self.args_forbidden(['_merchant'])
      @self.selects_one(t)
      def __api_put(*args, **kw):

        if request.method == 'PUT':
          self.log['request'].debug("%s[%s]: %s on %s with items %s" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))

          for key in request._items:
            if key != PROCESSOR_KEY and t.safe_member(key):
              request.selected_object[key] = request._items[key]

          try:
            request.selected_object._validate()
          except Exception as e:
            error = ValidationError(e)
            self.log['request'].debug(error.log())
            return out(error), 400

          request.selected_object.save()

          self.log['request'].debug("%s[%s]: %s on %s with query %s SUCCESS" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))
          
          return out(request.selected_object)
        return function(*args, **kw)
      return __api_put
    return _api_put

  def api_delete(self, t):
    def _api_delete(function):
      @wraps(function)
      @self.args_required(['_id'])
      @self.args_forbidden([])
      @self.selects_one(t)
      def __api_delete(*args, **kw):

        if request.method == 'DELETE':
          self.log['request'].debug("%s[%s]: %s on %s with items %s" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))

          request.selected_object.delete()

          self.log['request'].debug("%s[%s]: %s on %s with query %s SUCCESS" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))
          return out(request.selected_object)
        return function(*args, **kw)
      return __api_delete
    return _api_delete

  def args_required(self, args):
    def _args_required(function):
      @wraps(function)
      def __args_required(*args, **kw):

        for arg in args:
          if request._items.has_key(arg) is False:
            error = RequiredArgumentError(arg)
            self.log['request'].debug(error.log())
            return out(), 400

        return function(*args, **kw)
      return __args_required
    return _args_required


  def args_forbidden(self, args):
    def _args_forbidden(function):
      @wraps(function)
      def __args_forbidden(*args, **kw):

        for arg in args:
          if request._items.has_key(arg):
            error = ForbiddenArgumentError(arg)
            self.log['request'].debug(error.log())
            return out(error), 400

        if request._items.has_key(OBJECT_ID):
          request.query['_id'] = request._items[OBJECT_ID]

        return function(*args, **kw)
      return __args_forbidden
    return _args_forbidden

  def selects_one(self, t):
    def _selects_one(function):
      @wraps(function)
      def __selects_one(*args, **kw):

        obj = t.find_one({"_id" : request.query[OBJECT_ID]})

        if obj is None:
          error = InvalidArgumentError('_id')
          self.log['request'].debug(error.log())
          return out(error), 400
        try:
          assert obj['_merchant'] == request.merchant._id
        except:
          error = InvalidArgumentError('_id')
          self.log['request'].critical(error.log())
          return out(error), 400

        request.selected_object = obj
        return function(*args, **kw)
      return __selects_one
    return _selects_one

