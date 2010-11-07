# -*- coding: utf-8 -*-

from flask import Module, abort
from lib.api.response import Response
from lib.db import AdminKey
from cerberus.log import log

admin_key_module = Module(__name__)

resp = Response(log)

@admin_key_module.route('/', methods=['GET', 'POST'])
@resp.api_request(key_type=AdminKey)
@resp.api_get(AdminKey)
@resp.api_post(AdminKey)
def admin_key():
  abort(404)

def test(app, test_params):
  pass
