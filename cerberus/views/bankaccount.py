# -*- coding: utf-8 -*-

from flask import Module, abort
from lib.db import BankAccount
from lib.api.response import Response
from cerberus.log import log

bank_account_module = Module(__name__)

resp = Response(log)

@bank_account_module.route('/instrument/bank_account', methods=['GET', 'POST', 'PUT', 'DELETE'])
@resp.api_request
@resp.api_resource(BankAccount)
def bank_account():
  abort(404)
