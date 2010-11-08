# -*- coding: utf-8 -*-

from flask import Module, abort
from lib.db import BankAccount
from lib.api.response import Response
from cerberus.log import log

bank_account_module = Module(__name__)

resp = Response(log)

RESOURCE_URL = '/instrument/bank_account'
METHODS = ['GET', 'POST', 'PUT', 'DELETE']

@bank_account_module.route(RESOURCE_URL, methods=METHODS)
@resp.api_request()
@resp.api_resource(BankAccount)
def bank_account():
  abort(404)
