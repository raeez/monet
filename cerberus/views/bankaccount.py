from flask import Module, abort
from lib.db import BankAccount
from lib.api.response import api_request, api_resource

bank_account_module = Module(__name__)

@bank_account_module.route('/instrument/bank_account', methods=['GET', 'POST', 'PUT', 'DELETE'])
@api_request
@api_resource(BankAccount)
def bank_account():
  abort(404)
