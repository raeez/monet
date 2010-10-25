from flask import Module, abort
from lib.db import BankCard
from lib.api.response import  api_request, api_resource

bank_card_module = Module(__name__)

@bank_card_module.route('/instrument/bank_card', methods=['GET', 'POST', 'PUT', 'DELETE'])
@api_request
@api_resource(BankCard)
def bank_card():
  abort(404)
