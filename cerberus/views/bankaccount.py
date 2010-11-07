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

def test(app, test_params): # assumes no bankaccounts are in the test_db
  import json
  test_app = app.test_client()
  test_key = test_params['_key']
  log = app.test_log

  QUERY = RESOURCE_URL+'?_key=%s' % test_key
  resp = test_app.get(path=QUERY)
  data = json.loads(resp.data)
  log.debug("[GET]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, repr(data)))
  print("[GET]\t'%s' --> [%s]\n\t\t%s" % (QUERY, resp, resp.data))
  assert data == []
 
  QUERY = RESOURCE_URL
  resp = test_app.post(path=QUERY, data={'_key' : test_key, 'number' : 'xxxxxxxxxxx23', 'aba' : 234344445666})
  data_a = json.loads(resp.data)
  log.debug("[POST]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, repr(data_a)))
  print("[POST]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, resp.data))
  id_a = data_a['_id']
  assert data_a['number'] == 'xxxxxxxxxxx23'
  assert data_a.has_key('aba') is False

  QUERY = RESOURCE_URL
  resp = test_app.post(path=QUERY, data={'_key' : test_key, 'number' : 'xxxxxxxxxxxxx84', 'aba' : 3492038402934})
  data_b = json.loads(resp.data)
  log.debug("[POST]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, repr(data_b)))
  print("[POST]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, resp.data))
  id_b = data_b['_id']
  assert data_b['number'] == 'xxxxxxxxxxxxx84'
  assert data_b.has_key('aba') is False

  QUERY = RESOURCE_URL+'?_key=%s' % test_key
  resp = test_app.get(path=QUERY)
  data = json.loads(resp.data)
  log.debug("[GET]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, repr(data)))
  print("[GET]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, resp.data))
  assert data_a in data
  assert data_b in data
  assert len(data) == 2

  QUERY = (RESOURCE_URL+'?_key=%s&_id=%s' % (test_key, id_a))
  resp = test_app.get(path=QUERY)
  data = json.loads(resp.data)
  log.debug("[GET]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, repr(data)))
  print("[GET]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, resp.data))
  assert data_a in data
  assert len(data) == 1

  QUERY = RESOURCE_URL
  resp = test_app.put(path=RESOURCE_URL, data={'_key' : test_key, '_id' : id_a, 'number' : 123, 'aba' : 345})
  data = json.loads(resp.data)
  log.debug("[PUT]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, repr(data)))
  print("[PUT]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, resp.data))

  QUERY = RESOURCE_URL
  resp = test_app.put(path=RESOURCE_URL, data={'_key' : test_key, '_id' : id_b, 'number' : 24234523432, 'aba' : 1232323211})
  data = json.loads(resp.data)
  log.debug("[PUT]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, repr(data)))
  print("[PUT]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, resp.data))

  QUERY = (RESOURCE_URL+'?_key=%s' % test_key)
  resp = test_app.get(path=QUERY)
  data = json.loads(resp.data)
  log.debug("[GET]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, repr(data)))
  print("[GET]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, resp.data))
  assert len(data) == 2

  QUERY = (RESOURCE_URL+'?_key=%s&_id=%s' % (test_key, id_a))
  resp = test_app.delete(path=RESOURCE_URL, data={'_key' : test_key, '_id' : id_a})
  data = json.loads(resp.data)
  log.debug("[DELETE]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, repr(data)))
  print("[DELETE]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, resp.data))

  QUERY = RESOURCE_URL
  resp = test_app.delete(path=RESOURCE_URL, data={'_key' : test_key, '_id' : id_b})
  data = json.loads(resp.data)
  log.debug("[DELETE]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, repr(data)))
  print("[DELETE]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, resp.data))

  QUERY = RESOURCE_URL+'?_key=%s' % test_key
  resp = test_app.get(path=QUERY)
  data = json.loads(resp.data)
  log.debug("[GET]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, repr(data)))
  print("[GET]\t'%s' --> [%s]\n\t\t%s " % (QUERY, resp, resp.data))
  assert data == []
