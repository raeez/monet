# -*- coding: utf-8 -*-

from flask import Module, abort
from lib.api.response import Response
from lib.db import Merchant, AdminKey
from cerberus.log import log

merchant_module = Module(__name__)

resp = Response(log)

RESOURCE_URL = '/merchant'
METHODS = ['GET', 'POST']

@merchant_module.route(RESOURCE_URL, methods=METHODS)
@resp.api_request(key_type=AdminKey)
@resp.api_get(Merchant)
@resp.api_post(Merchant)
def merchant():
  abort(404)

def test(app, test_params):
  pass
