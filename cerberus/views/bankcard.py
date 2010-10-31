# -*- coding: utf-8 -*-

from flask import Module, abort
from lib.db import BankCard
from lib.api.response import Response
from cerberus.log import log

bank_card_module = Module(__name__)

resp = Response(log)

@bank_card_module.route('/instrument/bank_card', methods=['GET', 'POST', 'PUT', 'DELETE'])
@resp.api_request
@resp.api_resource(BankCard)
def bank_card():
  abort(404)
