from flask import request, abort
from functools import wraps
import json
from lib.db.container import ResponseEncoder, get_container_id
from lib.db import ProcessorKey, Merchant, BankCard, BankAccount

PROCESSOR_KEY = '_key'
OBJECT_ID = '_id'

class RequestError(Exception):
  pass

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
  if isinstance(input, list):
    o = []
    for element in input:
      o.append(sanitize_container(element).to_dict())
    return json.dumps(o, sort_keys=True, indent=2, cls=ResponseEncoder)+"\n"

  elif isinstance(input, Exception):
    errors = []
    for item in input.args:
      errors.append(item)

    return json.dumps({"errors" : errors}, sort_keys=True, indent=2, cls=ResponseEncoder)+"\n"


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


      #decipher this merchant

      self.log['request'].debug("%s incoming request" % request.method)

      request.merchant = None
      request.query = {}

      if request._items.has_key(PROCESSOR_KEY) is False:
        self.log['request'].debug("%s on %s with %s: MISSING_PROCESSOR_KEY" % (request.method, request.path, repr(request._items)))
        return out(RequestError("a valid processor_key is required for request type %s on resource %s" % (request.method, request.path))), 400

      request.processor_key = ProcessorKey.find_one({"key" : request._items.get(PROCESSOR_KEY)})

      if request.processor_key is None:
        self.log['request'].debug("%s on %s with %s: INVALID_PROCESSOR_KEY" % (request.method, request.path, repr(request._items)))
        return out(RequestError("supplied processor key ('_key') is invalid")), 400
      else:
        request.merchant = Merchant.find_one({"_id" : get_container_id(request.processor_key._merchant)})

      if request.merchant is None:
        self.log['request'].critical("%s on %s with %s: MISSING_MERCHANT found processor key but could not find corresponding merchant: key: %s" % (request.method, request.path, repr(request._items), repr(request.processor_key)))
        return out(RequestError("supplied processor_key is valid, but has no associated merchant account")), 500
      else:
        request.query['_merchant'] = request.merchant._id
   

      self.log['request'].debug("%s MERCHANT: %s - %s" % (request.method, request.merchant._id, repr(request.merchant.email)))

      return function(*args, **kw)
    return _api_request

  def api_resource(self, type):
    def _api_resource(function):
      @wraps(function)
      @self.api_get(type)
      @self.api_post(type)
      @self.api_put(type)
      @self.api_delete(type)
      def __api_resource(*args, **kw):
        return function(*args, **kw)
      return __api_resource
    return _api_resource

  def api_get(self, type):
    def _api_get(function):
      @wraps(function)
      @self.args_required([])
      @self.args_forbidden(['_merchant'])
      def __api_get(*args, **kw):
        # TODO assert type is a container

        if request.method == 'GET':
          self.log['request'].debug("%s[%s]: %s on %s with items %s" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))

          for key in request._items:
            if key != PROCESSOR_KEY and type.safe_member(key):
              data = request._items[key]

              r = type.valid_member(key, data)
              if r is not None:
                if r.valid is False:
                  self.log['request'].debug("%s[%s]: %s on %s with %s VALIDATION FAILED on key %s" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items), key))
                  return out(TypeError(r.args)), 404
                else:
                  data = r.data
              request.query[key] = data

          self.log['request'].debug("%s[%s]: %s on %s with query %s" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request.query)))

          obj = type.find(request.query)

          if obj is None:
            self.log['request'].debug("%s[%s]: %s on %s with %s INVALID_OBJECT" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items), key))
            abort(404)
          else:
            self.log['request'].debug("%s[%s]: %s on %s with query %s SUCCESS" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))
            return out(obj)
        return function(*args, **kw)
      return __api_get
    return _api_get

  def api_post(self, type):
    def _api_post(function):
      @wraps(function)
      @self.args_required([])
      @self.args_forbidden(['_merchant', '_id'])
      def __api_post(*args, **kw):
        # TODO assert type is a container

        if request.method == 'POST':
          self.log['request'].debug("%s[%s]: %s on %s with items %s" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))

          obj = type()
          obj['_merchant'] = request.merchant._id

          if request.query.has_key('_id'):
            obj['_id'] = request.query['_id']

          for key in request._items:
            if key != PROCESSOR_KEY and type.safe_member(key):
              obj[key] = request._items[key]

          self.log['request'].debug("%s[%s]: %s on %s with query %s" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(obj)))

          try:
            obj._validate()
          except Exception as e:
            self.log['request'].debug("%s[%s]: %s on %s VALIDATION_FALIED with query %s" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(obj)))
            return out(e), 400

          obj.save()
          
          self.log['request'].debug("%s[%s]: %s on %s with query %s SUCCESS" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))

          return out(obj)
        return function(*args, **kw)
      return __api_post
    return _api_post

  def api_put(self, type):
    def _api_put(function):
      @wraps(function)
      @self.args_required(['_id'])
      @self.args_forbidden(['_merchant'])
      @self.selects_one
      def __api_put(*args, **kw):
        # TODO assert type is a container

        if request.method == 'PUT':
          self.log['request'].debug("%s[%s]: %s on %s with items %s" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))

          for key in request._items:
            if key != PROCESSOR_KEY and type.safe_member(key):
              request.selected_object[key] = request._items[key]

          try:
            request.selected_object._validate()
          except Exception as e:
            self.log['request'].debug("%s[%s]: %s on %s with items %s VALIDATION FAILED" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))
            return out(e), 400

          request.selected_object.save()

          self.log['request'].debug("%s[%s]: %s on %s with query %s SUCCESS" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))
          
          return out(request.selected_object)
        return function(*args, **kw)
      return __api_put
    return _api_put

  def api_delete(self, type):
    def _api_delete(function):
      @wraps(function)
      @self.args_required(['_id'])
      @self.args_forbidden([])
      @self.selects_one
      def __api_delete(*args, **kw):
        # TODO assert type is a container

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
            self.log['request'].debug("%s[%s]: %s on %s MISSING_KEY %s" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(arg)))
            return out(RequestError("member %s is required for request type %s on resource %s" % (arg, request.method, request.path))), 400

        return function(*args, **kw)
      return __args_required
    return _args_required


  def args_forbidden(self, args):
    def _args_forbidden(function):
      @wraps(function)
      def __args_forbidden(*args, **kw):

        for arg in args:
          if request._items.has_key(arg):
            self.log['request'].debug("%s[%s]: %s on %s FORBIDDEN_KEY %s" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(arg)))
            return out(RequestError("member %s is forbidden for request type %s on resource %s" % (arg, request.method, request.path))), 400

        if request._items.has_key('_id'):
          request.query['_id'] = get_container_id(request._items['_id'])

        return function(*args, **kw)
      return __args_forbidden
    return _args_forbidden

  def selects_one(self, function):
    @wraps(function)
    def _select_one(*args, **kw):

      obj = type.find_one({"_id" : request.query["_id"]})

      if obj is None:
        self.log['request'].debug("%s[%s]: %s on %s with %s INVALID_OBJECT" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))
        return out(RequestError("'_id' supplied resolves to an invalid object")), 400
      try:
        assert obj['_merchant'] == request.merchant._id
      except:
        self.log['request'].critical("%s[%s]: %s on %s with %s INVALID_MERCHANT" % (request.merchant.email, request.merchant._id, request.method, request.path, repr(request._items)))
        return out(RequestError("'_id' supplied resolves to an invalid object")), 400

      request.selected_object = obj
      return function(*args, **kw)
    return _select_one
