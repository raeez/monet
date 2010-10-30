from flask import Module, abort
from lib.api.response import Response
from lib.db import Merchant
from cerberus.log import log

merchant_module = Module(__name__)

resp = Response(log)

@merchant_module.route('/merchant', methods=['POST'])
@resp.api_request
@resp.api_put(Merchant)
def processor_key():
  abort(404)
