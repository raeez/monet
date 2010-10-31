# -*- coding: utf-8 -*-

from flask import Module, abort
from lib.api.response import Response
from lib.db import Merchant, AdminKey
from cerberus.log import log

merchant_module = Module(__name__)

resp = Response(log)

@merchant_module.route('/merchant', methods=['GET', 'POST'])
@resp.api_request(key_type=AdminKey)
@resp.api_get(Merchant)
@resp.api_post(Merchant)
def merchant():
  abort(404)
