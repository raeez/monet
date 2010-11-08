import json

def merge(a, b):
  for key in b:
    a[key] = b[key]
  return a

def build_query_string(kw):
  if len(kw) == 0:
    return ""

  query = "?"

  first_key = kw.keys().pop()
  query += "%s=%s" % (first_key, kw[first_key])
  del kw[first_key]

  for k in kw:
    query += "&%s=%s" % (k, kw[k])

  return query

class TestClient(object):
  def __init__(self, app, test_log, test_params):

    self.client = app.test_client()
    self.processor_key = test_params['processor_key']
    self.admin_key = test_params['admin_key']
    self.log = test_log


  def get(self, resource,  d={}, a='merchant'):
    key = self.processor_key
    if a == 'admin':
      key = self.admin_key

    url = resource + build_query_string(merge({'_key' : key}, d))
    resp = self.client.get(path=url)
    data = json.loads(resp.data)
    self.log.debug("[GET]\t'%s' --> [%s]\n\t\t%s " % (url, resp, resp.data))
    print("[GET]\t'%s' --> [%s]\n\t\t%s" % (url, resp, resp.data))
    return data

  def post(self, resource, d={}, a='merchant'):
    key = self.processor_key
    if a == 'admin':
      key = self.admin_key

    resp = self.client.post(path=resource, data=merge({'_key' : key}, d))
    data = json.loads(resp.data)
    self.log.debug("[POST]\t'%s' --> [%s]\n\t\t%s " % (resource, resp, resp.data))
    print("[POST]\t'%s' --> [%s]\n\t\t%s " % (resource, resp, resp.data))
    return data

  def put(self, resource,  d={}, a='merchant'):
    key = self.processor_key
    if a == 'admin':
      key = self.admin_key

    resp = self.client.put(path=resource, data=merge({'_key' : key},d))
    data = json.loads(resp.data)
    self.log.debug("[PUT]\t'%s' --> [%s]\n\t\t%s " % (resource, resp, resp.data))
    print("[PUT]\t'%s' --> [%s]\n\t\t%s " % (resource, resp, resp.data))
    return data


  def delete(self, resource, d={}, a='merchant'):
    key = self.processor_key
    if a == 'admin':
      key = self.admin_key

    url = resource + build_query_string(merge({'_key' : key}, d))

    resp = self.client.delete(path=url, data=merge({'_key' : key}, d))
    data = json.loads(resp.data)
    self.log.debug("[DELETE]\t'%s' --> [%s]\n\t\t%s " % (resource, resp, resp.data))
    print("[DELETE]\t'%s' --> [%s]\n\t\t%s " % (resource, resp, resp.data))
    return data

  def test_malformed_key(self, resource, **kw):
    for meth in ["GET", "POST", "PUT", "DELETE"]:
      pass

  def test_large_payload(self, resource, **kw):
    for meth in ["GET", "POST", "PUT", "DELETE"]:
      pass

  def test_(self, resource, method="GET", **kw):
    for meth in ["GET", "POST", "PUT", "DELETE"]:
      pass
