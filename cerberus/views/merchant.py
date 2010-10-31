# -*- coding: utf-8 -*-

from flask import Module, abort
from lib.api.response import Response
from lib.db import Merchant
from cerberus.log import log

merchant_module = Module(__name__)

resp = Response(log)

@merchant_module.route('/merchant', methods=['POST'])
@resp.api_request
@resp.api_post(Merchant)
def merchant():
  abort(404)
