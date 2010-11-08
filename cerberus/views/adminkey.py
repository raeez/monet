# -*- coding: utf-8 -*-

from flask import Module, abort
from lib.api.response import Response
from lib.db import AdminKey
from cerberus.log import log

admin_key_module = Module(__name__)

resp = Response(log)

RESOURCE_URL = '/key/admin'
METHODS = ['GET']

@admin_key_module.route(RESOURCE_URL, methods=METHODS)
@resp.api_request(key_type=AdminKey)
@resp.api_get(AdminKey)
@resp.api_post(AdminKey)
def admin_key():
  abort(404)
