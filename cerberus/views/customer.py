from flask import Module, abort
from lib.api.response import Response
from lib.db import Customer
from cerberus.log import log

customer_module = Module(__name__)

resp = Response(log)

@customer_module.route('/customer', methods=['GET', 'POST', 'PUT'])
@resp.api_request
@resp.api_resource(Customer)
def customer():
  abort(404)
