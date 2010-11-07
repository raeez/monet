# -*- coding: utf-8 -*-

from flask import Flask
from lib.api.response import out, RequestError
from cerberus.log import log

from cerberus.views.bankaccount import bank_account_module
from cerberus.views.bankcard import bank_card_module
from cerberus.views.charge import charge_module
from cerberus.views.merchant import merchant_module
from cerberus.views.processorkey import processor_key_module
from cerberus.views.refund import refund_module

cerberus = Flask('cerberus')
log.add_logger('flask', cerberus.logger)
cerberus.log = log
cerberus.register_module(bank_account_module)
cerberus.register_module(bank_card_module)
cerberus.register_module(charge_module)
cerberus.register_module(merchant_module)
cerberus.register_module(processor_key_module)
cerberus.register_module(refund_module)

cerberus.config.update(
  MAX_CONTENT_LENGTH = 4096,
  LOGGER_NAME = 'app'
)

@cerberus.errorhandler(400)
def malformed_request(error):
  return out(RequestError("malformed request - %s" % str(error))), 400

@cerberus.errorhandler(403)
def resource_forbidden(error):
  return out(RequestError("request forbidden - %s" % str(error))), 403

@cerberus.errorhandler(404)
def resource_missing(error):
  return out(RequestError("resource missing - %s" % str(error))), 404

@cerberus.errorhandler(405)
def method_not_allowed(error):
  return out(RequestError("method not allowed - %s" % str(error))), 405

@cerberus.errorhandler(500)
def server_error(error):
  return out(RequestError("server error - %s" % error)), 500
