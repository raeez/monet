from flask import request
import json

from lib.api.keys import PROCESSOR_KEY
from lib.db.container import ResponseEncoder

class RequestError(dict):
  def __init__(self, msg=''):
    super(RequestError, self).__init__()
    self.request = request
    self['resource'] = request.path
    self['method'] = request.method
    self['error'] = "%s" % self.__class__.__name__
    self['message'] = "%s: %s" % (self.__class__.__name__, msg)

  def log(self):
    if request.user:
      return "%s[%s]: %s on %s with %s: %s" % (request.user.email, request.user._id, request.method, request.path, repr(request._items), self.__class__.__name__)
    return "%s on %s with %s: %s" % (request.method, request.path, repr(request._items), self['message'])

  def to_json(self):
    return json.dumps(self, sort_keys=True, indent=2, cls=ResponseEncoder)+"\n"

class MissingKeyError(RequestError):
  def __init__(self):
    super(MissingKeyError, self).__init__()
    self['message'] = "%s: supplied key: ('%s' : %s)" % (self.__class__.__name__, PROCESSOR_KEY, request._items.get(PROCESSOR_KEY))

class InvalidKeyError(RequestError):
  def __init__(self):
    super(InvalidKeyError, self).__init__()
    self['message'] = "%s: supplied key: ('%s' : '%s')" % (self.__class__.__name__, request._items.get('key_type'), request._items.get(PROCESSOR_KEY) )

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
    self['message'] = "%s: '%s'" % (self.__class__.__name__, arg)

class InvalidArgumentError(RequestError):
  def __init__(self, arg):
    super(InvalidArgumentError, self).__init__()
    self['message'] = "%s: '%s'" % (self.__class__.__name__, arg)

class ValidationError(RequestError):
  def __init__(self, exception):
    super(ValidationError, self).__init__()
    self['message'] = "%s: %s " % (self.__class__.__name__, exception)

class InternalError(RequestError):
  def __init__(self, msg):
    super(InternalError, self).__init__()
    self['message'] = "%s: %s" % (self.__class__.__name__, msg)
