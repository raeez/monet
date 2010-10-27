from flask import request, abort
from functools import wraps
import json
from lib.db.container import ResponseEncoder, get_container_id
from lib.db import ProcessorKey, Merchant

FORBIDDEN_GET_ARGS = ['merchant']
FORBIDDEN_POST_ARGS = ['merchant', '_id']
FORBIDDEN_PUT_ARGS = ['merchant']
REQUIRED_PUT_ARGS = ['_id']

PROCESSOR_KEY = '_key'
OBJECT_ID = '_id'

class RequestError(Exception):
  pass

def out(input):
  if isinstance(input, list):
    o = []
    for element in input:
      o.append(element.to_dict())
    return json.dumps(o, sort_keys=True, indent=2, cls=ResponseEncoder)+"\n"

  elif isinstance(input, Exception):
    errors = []
    for item in input.args:
      errors.append(item)

    return json.dumps({"errors" : errors}, sort_keys=True, indent=2, cls=ResponseEncoder)+"\n"

  return input.to_json()+"\n"

class Response:
  def __init__(self, log):
    self.log = log

  def api_request(self, function):
    @wraps(function)
    def _api_request(*args, **kw):

      #decipher this merchant
      request.merchant = None
      request.query = {}
      if request.method == 'GET':
        if request.args.has_key(PROCESSOR_KEY) is False:
          self.log['request'].debug("GET MISSING_PROCESSOR_KEY")
          abort(400)
        request.processor_key = ProcessorKey.find_one({"key" : request.args.get(PROCESSOR_KEY)})
      elif request.method == 'POST' or request.method == 'PUT':
        if request.form.has_key(PROCESSOR_KEY) is False:
          self.log['request'].debug("POST MISSING_PROCESSOR_KEY")
          abort(400)
        request.processor_key = ProcessorKey.find_one({"key" : request.form[PROCESSOR_KEY]})

      if request.processor_key is None:
        self.log['request'].debug("%s INVALID_PROCESSOR_KEY" % request.method)
        return out(AssertionError("_key should resolve to a valid processor key")), 400
      else:
        request.merchant = Merchant.find_one({"_id" : get_container_id(request.processor_key._merchant)})

      if request.merchant is None:
        self.log['request'].critical("%s PROCESSOR_KEY found processor key but could not find corresponding merchant: key: %s" % (request.method, repr(request.processor_key)))
        abort(404)
      else:
        request.query['_merchant'] = request.merchant._id
   
      if request.method == 'GET':
        for arg in FORBIDDEN_GET_ARGS:
          if request.args.has_key(arg):
            self.log['request'].debug("%s INVALID_KEY %s" % (request.method, repr(arg)))
            abort(403)

      elif request.method == 'POST':
        for arg in FORBIDDEN_POST_ARGS:
          if request.form.has_key(arg):
            self.log['request'].debug("%s INVALID_KEY %s" % (request.method, repr(arg)))
            abort(403)
        request.query['merchant'] = request.merchant._id

      elif request.method == 'PUT':
        for arg in FORBIDDEN_POST_ARGS:
          if request.form.has_key(arg):
            self.log['request'].debug("%s INVALID_KEY %s" % (request.method, repr(arg)))
            abort(403)
        for arg in REQUIRED_PUT_ARGS:
          if request.form.has_key(arg) is False:
            self.log['request'].debug("%s INVALID_KEY %s" % (request.method, repr(arg)))
            abort(400)

      self.log['request'].debug("%s MERCHANT: %s - %s" % (request.method, request.merchant._id, repr(request.merchant.email)))

      return function(*args, **kw)
    return _api_request

  def api_get(self, type):
    def _api_get(function):
      @wraps(function)
      def __api_get(*args, **kw):
        # TODO assert type is a container

        if request.method == 'GET':

          if request.args.has_key('_id'):
            request.query['_id'] = get_container_id(request.args['_id'])

          self.log['request'].debug("GET on %s with params %s" % ((str(type), str(request.args))))

          for key in request.args:
            if key != PROCESSOR_KEY and  type.safe_member(key):
              data = request.args[key]

              r = type.valid_member(key, data)
              if r is not None:
                if r.valid is False:
                  self.log['request'].debug("GET VALIDATION_FAILED")
                  return out(TypeError(r.args)), 404
                else:
                  data = r.data
              request.query[key] = data


          obj = type.find(request.query)

          if obj is None:
            self.log['request'].debug("GET INVALID_OBJECT")
            abort(404)
          else:
            self.log['request'].debug("GET SUCCESS")
            return out(obj)
        return function(*args, **kw)
      return __api_get
    return _api_get

  def api_post(self, type):
    def _api_post(function):
      @wraps(function)
      def __api_post(*args, **kw):
        # TODO assert type is a container

        if request.method == 'POST':
          obj = type()
          obj['_merchant'] = request.merchant._id

          if request.form.has_key('_id'):
            obj['_id'] = get_container_id(request.form['_id'])

          for key in request.form:
            if key != PROCESSOR_KEY and type.safe_member(key):
              obj[key] = request.form[key]

          self.log['request'].debug("POST on %s with params %s" % ((str(type), str(obj))))

          try:
            obj._validate()
          except Exception as e:
            self.log['request'].debug("POST VALIDATION_FAILED on type %s with params %s" % (str(type), str(obj)))
            return out(e), 400

          obj.save()
          
          self.log['request'].debug("POST SUCCESS")

          return out(obj)
        return function(*args, **kw)
      return __api_post
    return _api_post

  def api_put(self, type):
    def _api_put(function):
      @wraps(function)
      def __api_put(*args, **kw):
        # TODO assert type is a container

        if request.method == 'PUT':

          self.log['request'].debug("PUT on %s with params %s" % ((str(type), str(request.form))))

          if request.form.has_key('_id') is False:
            self.log['request'].debug("PUT MISSING_ID")
            return out(RequestError("member '_id' is required to resolve to a valid object")), 400

          obj = type.find_one({"_id" : get_container_id(request.form['_id'])})

          if obj is None:
            self.log['request'].debug("PUT INVALID_OBJECT")
            return out(RequestError("member '_id' is required to resolve to a valid object")), 400
          try:
            assert obj['_merchant'] == request.merchant._id
          except:
            self.log['request'].debug("PUT INVALID_MERCHANT")
            abort(400)

          for key in request.form:
            if key != PROCESSOR_KEY and type.safe_member(key):
              obj[key] = request.form[key]

          try:
            obj._validate()
          except Exception as e:
            self.log['request'].debug("PUT VALIDATION_FAILED of type %s on params %s" % (str(type), str(obj)))
            return out(e), 400

          obj.save()

          self.log['request'].debug("PUT SUCCESS")
          
          return out(obj)
        return function(*args, **kw)
      return __api_put
    return _api_put

  def api_delete(self, type):
    def _api_delete(function):
      @wraps(function)
      def __api_delete(*args, **kw):
        # TODO assert type is a container

        if request.method == 'DELETE':
          self.log['request'].debug("DELETE on %s with params %s" % ((str(type), str(request.form))))

          if request.form.has_key('_id') is False:
            self.log['request'].debug("DELETE MISSING_ID")
            return out(RequestError("member '_id' is required to resolve to a valid object")), 400

          obj = type.find_one({"_id" : get_container_id(request.form['_id'])})

          if obj is None:
            self.log['request'].debug("DELETE INVALID_OBJECT")
            return out(RequestError("member '_id' is required to resolve to a valid object")), 400
          try:
            assert obj['_merchant'] == request.merchant._id
          except:
            self.log['request'].debug("DELETE INVALID_MERCHANT")
            abort(400)

          try: # TODO is this necessary?
            obj._validate()
          except Exception as e:
            self.log['request'].debug("DELETE VALIDATION_FAILED of type %s on params %s" % (str(type), str(obj)))
            return out(e), 400

          obj.delete()


          self.log['request'].debug("DELETE SUCCESS")
          
          return out(obj)
        return function(*args, **kw)
      return __api_delete
    return _api_delete

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

  # 400 - bad request - malformed
  # 403 - forbidden - trying to access data not possible with the method
  # 404 - not found - can't find the processor_key given, or can't find the resources requested
