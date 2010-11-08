# -*- coding: utf-8 -*-

from flask import Module, abort
from lib.api.response import Response
from lib.db import AdminKey, Admin
from cerberus.log import log

admin_module = Module(__name__)

resp = Response(log)

RESOURCE_URL = '/admin'
METHODS = ['GET', 'POST']

@admin_module.route(RESOURCE_URL, methods=METHODS)
@resp.api_request(key_type=AdminKey)
@resp.api_get(Admin)
@resp.api_post(Admin)
def admin():
  abort(404)

def test(app, test_params):
  pass
