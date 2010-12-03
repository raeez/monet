# -*- coding: utf-8 -*-

from flask import Module, request, abort
from lib.api.response import out, Response
from lib.api.error import ValidationError
from lib.db import Refund
from cerberus.log import log

refund_module = Module(__name__)

resp = Response(log)

RESOURCE_URL = '/transaction/refund'
METHODS = ['GET', 'POST']

@refund_module.route(RESOURCE_URL, methods=METHODS)
@resp.api_request()
@resp.api_get(Refund)
def refund():
  if request.method == 'POST':
    r = Refund()

    for key in request.form:
      r[key] = request.form[key]

    try:
      r._validate()

    except Exception as e:
      return out(ValidationError(e)), 400

    finally:
      if r._validated is True:
        #attempt to run this refund
        r.save() # save to db unprocessed
        r.process() #attempt to process
        r.save() # save to db with result
    return out(r)
  abort(404)
