from flask import Module, abort
from lib.api.response import api_request, api_resource
from lib.db import Customer

customer_module = Module(__name__)

@customer_module.route('/customer', methods=['GET', 'POST', 'PUT'])
@api_request
@api_resource(Customer)
def customer():
  abort(404)
