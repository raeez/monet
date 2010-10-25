from flask import Flask
from lib.api.response import out, RequestError
from lib.log import Logger

from cerberus.views.bankaccount import bank_account_module
from cerberus.views.bankcard import bank_card_module
from cerberus.views.charge import charge_module
from cerberus.views.customer import customer_module
from cerberus.views.processorkey import processor_key_module
from cerberus.views.refund import refund_module

cerberus = Flask('cerberus')
cerberus.manhattan_logger = Logger('cerberus')
cerberus.manhattan_logger.add_logger('flask', cerberus.logger)

cerberus.register_module(bank_account_module)
cerberus.register_module(bank_card_module)
cerberus.register_module(charge_module)
cerberus.register_module(customer_module)
cerberus.register_module(processor_key_module)
cerberus.register_module(refund_module)

@cerberus.errorhandler(400)
def malformed_request(error):
  return out(RequestError("malformed request")), 400

@cerberus.errorhandler(403)
def resource_forbidden(error):
  return out(RequestError("request forbidden")), 403

@cerberus.errorhandler(404)
def resource_missing(error):
  return out(RequestError("resource missing")), 403
