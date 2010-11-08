# -*- coding: utf-8 -*-

from flask import Module, abort
from lib.api.response import Response
from lib.db import ProcessorKey
from cerberus.log import log

processor_key_module = Module(__name__)

resp = Response(log)

RESOURCE_URL = '/key/processor'
METHODS = ['GET']

@processor_key_module.route(RESOURCE_URL, methods=METHODS)
@resp.api_request()
@resp.api_get(ProcessorKey)
def processor_key():
  abort(404)
