# -*- coding: utf-8 -*-

from flask import Module, abort
from lib.db import BankCard
from lib.api.response import Response
from cerberus.log import log

bank_card_module = Module(__name__)

resp = Response(log)

RESOURCE_URL = '/instrument/bankcard'
METHODS = ['GET', 'POST', 'PUT', 'DELETE']

@bank_card_module.route(RESOURCE_URL, methods=METHODS)
@resp.api_request()
@resp.api_resource(BankCard)
def bank_card():
  abort(404)
