# -*- coding: utf-8 -*-

from flask import request
from functools import wraps
import json
from lib.db.container import ResponseEncoder
from lib.db.transform import get_container_pointer
from lib.db import Admin, Merchant, BankCard, BankAccount, MerchantKey, AdminKey

from lib.api.keys import PROCESSOR_KEY, OBJECT_ID
from lib.api.error import RequestError, MissingKeyError, InvalidKeyError, DanglingKeyError, RequiredArgumentError, ForbiddenArgumentError, InvalidArgumentError, ValidationError, InternalError

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

  def api_request(self, key_type=MerchantKey):
    def _api_request(function):
      @wraps(function)
      def __api_request(*args, **kw):

        try:
          assert key_type in [AdminKey, MerchantKey]
        except:
          error = InternalError("Supplied key type %s not a valid key for an api_request" % key_type.__name__)
          self.log['request'].critical(error.log())
          return out(error), 500

        request._items = {}
        for key in request.args:
          request._items[key] = request.args[key]
        for key in request.form:
          request._items[key] = request.form[key]

        if request._items.has_key(OBJECT_ID):
          request._items[OBJECT_ID] = get_container_pointer(request._items[OBJECT_ID])

        request.user = None
        request.query = {}

        if request._items.has_key(PROCESSOR_KEY) is False:
          error = MissingKeyError()
          self.log['request'].debug(error.log())
          return out(error), 400

        request.processor_key = key_type.find_one({"key" : request._items[PROCESSOR_KEY]})
        request._items["key_type"] = key_type.__name__

        if request.processor_key is None:
          error = InvalidKeyError()
          self.log['request'].debug(error.log())
          return out(error), 400
        elif request.processor_key.has_key('_merchant'):
          request.user = Merchant.find_one({"_id" : get_container_pointer(request.processor_key._merchant)})
        elif request.processor_key.has_key('_admin'):
          request.user = Admin.find_one({"_id" : get_container_pointer(request.processor_key._admin)})

        if request.user is None:
          error = DanglingKeyError()
          self.log['request'].critical(error.log())
          return out(error), 500
        elif isinstance(request.user, Merchant):
          request.query['_merchant'] = request.user._id

        del request._items['_key']
        del request._items['key_type']

        return function(*args, **kw)
      return __api_request
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
      @self.args_required([], method="GET")
      @self.args_forbidden(['_merchant'], method="GET")
      def __api_get(*args, **kw):

        if request.method == 'GET':
          self.log['request'].debug("%s[%s]: %s on %s with items %s" % (request.user.email, request.user._id, request.method, request.path, repr(request._items)))
          
          errors = []
          for key in request._items:
            if key != PROCESSOR_KEY and key != OBJECT_ID and t.safe_member(key):
              data = request._items[key]

              v, d, e, a = t.validate_member(key, data)
              if v is not None:
                if v is False:
                  error = ValidationError(TypeError(a))
                  self.log['request'].debug(error.log())
                  errors.append(error)
                  continue
                else:
                  data = d
              request.query[key] = data

          if len(errors) > 0:
            return out(errors), 400

          self.log['request'].debug("%s[%s]: %s on %s with query %s" % (request.user.email, request.user._id, request.method, request.path, repr(request.query)))

          obj = t.find(request.query)

          if obj is None:
            error = RequestError()
            self.log['request'].critical(error.log())
            return out(error), 400
          else:
            self.log['request'].debug("%s[%s]: %s on %s with query %s SUCCESS" % (request.user.email, request.user._id, request.method, request.path, repr(request._items)))
            return out(obj)
        return function(*args, **kw)
      return __api_get
    return _api_get

  def api_post(self, t):
    def _api_post(function):
      @wraps(function)
      @self.args_required([], method="POST")
      @self.args_forbidden(['_merchant', '_id'], method="POST")
      def __api_post(*args, **kw):

        if request.method == 'POST':
          self.log['request'].debug("%s[%s]: %s on %s with items %s" % (request.user.email, request.user._id, request.method, request.path, repr(request._items)))

          obj = t()
          obj['_merchant'] = request.user._id

          if request.query.has_key('_id'):
            obj['_id'] = request.query['_id']

          for key in request._items:
            if key != PROCESSOR_KEY and t.safe_member(key):
              obj[key] = request._items[key]

          self.log['request'].debug("%s[%s]: %s on %s with query %s" % (request.user.email, request.user._id, request.method, request.path, repr(obj)))

          try:
            obj._validate()
          except Exception as e:
            error = ValidationError(e)
            self.log['request'].debug(error.log())
            return out(error), 400

          obj.save()
          
          self.log['request'].debug("%s[%s]: %s on %s with query %s SUCCESS" % (request.user.email, request.user._id, request.method, request.path, repr(request._items)))

          return out(obj)
        return function(*args, **kw)
      return __api_post
    return _api_post

  def api_put(self, t):
    def _api_put(function):
      @wraps(function)
      @self.args_required(['_id'], method="PUT")
      @self.args_forbidden(['_merchant'], method="PUT")
      @self.selects_one(t)
      def __api_put(*args, **kw):

        if request.method == 'PUT':
          self.log['request'].debug("%s[%s]: %s on %s with items %s" % (request.user.email, request.user._id, request.method, request.path, repr(request._items)))

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

          self.log['request'].debug("%s[%s]: %s on %s with query %s SUCCESS" % (request.user.email, request.user._id, request.method, request.path, repr(request._items)))
          
          return out(request.selected_object)
        return function(*args, **kw)
      return __api_put
    return _api_put

  def api_delete(self, t):
    def _api_delete(function):
      @wraps(function)
      @self.args_required(['_id'], method="DELETE")
      @self.args_forbidden([], method="DELETE")
      @self.selects_one(t)
      def __api_delete(*args, **kw):

        if request.method == 'DELETE':
          self.log['request'].debug("%s[%s]: %s on %s with items %s" % (request.user.email, request.user._id, request.method, request.path, repr(request._items)))

          request.selected_object.delete()

          self.log['request'].debug("%s[%s]: %s on %s with query %s SUCCESS" % (request.user.email, request.user._id, request.method, request.path, repr(request._items)))
          return out(request.selected_object)
        return function(*args, **kw)
      return __api_delete
    return _api_delete

  def args_required(self, required_args, method):
    def _args_required(function):
      @wraps(function)
      def __args_required(*args, **kw):
       
        if request.method == method:
          for arg in required_args:
            if request._items.has_key(arg) is False:
              error = RequiredArgumentError(arg)
              self.log['request'].debug(error.log())
              return out(error), 400

        return function(*args, **kw)
      return __args_required
    return _args_required


  def args_forbidden(self, forbidden_args, method):
    def _args_forbidden(function):
      @wraps(function)
      def __args_forbidden(*args, **kw):
        
        if request.method == method:
          for arg in forbidden_args:
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
          assert obj['_merchant'] == request.user._id
        except:
          error = InvalidArgumentError('_id')
          self.log['request'].critical(error.log())
          return out(error), 400

        request.selected_object = obj
        return function(*args, **kw)
      return __selects_one
    return _selects_one
