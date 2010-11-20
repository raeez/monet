# -*- coding: utf-8 -*-

from flask import Module, abort
from lib.api.response import Response
from lib.db import MerchantKey
from cerberus.log import log

merchant_key_module = Module(__name__)

resp = Response(log)

RESOURCE_URL = '/key/merchant'
METHODS = ['GET']

@merchant_key_module.route(RESOURCE_URL, methods=METHODS)
@resp.api_request()
@resp.api_get(MerchantKey)
def merchant_key():
  abort(404)
