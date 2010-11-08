# -*- coding: utf-8 -*-

from flask import Module, request, abort
from lib.api.response import out, Response
from lib.api.error import ValidationError
from lib.db import Charge
from cerberus.log import log

charge_module = Module(__name__)

resp = Response(log)

RESOURCE_URL = '/transaction/charge'
METHODS = ['GET', 'POST']

@charge_module.route(RESOURCE_URL, methods=METHODS)
@resp.api_request()
@resp.api_get(Charge)
def charge():
  if request.method == 'POST':
    c = Charge()

    for key in request.form:
      c[key] = request.form[key]

    try:
      c._validate()

    except Exception as e:
      return out(ValidationError(e)), 400

    finally:
      if c._validated is True:
        #attempt to run this charge
        c.save() # save to db unprocessed
        c.process() #attempt to process
        c.save() # save to db with result
    return out(c)
  abort(404)
