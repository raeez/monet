import json

class TestClient(object):
  def __init__(self, app, test_log, test_params):

    self.client = app.test_client()
    self.processor_key = test_params['processor_key']
    self.admin_key = test_params['admin_key']
    self.auth = {'admin' : self.processor_key, 'merchant' : self.admin_key}
    self.log = test_log

  def _build_query_string(**kw):
    if len(kw) == 0:
      return ""

    query = "?"

    first_key = kw.keys().pop()
    query += "%s=%s" % (first_key, kw[first_key])
    del kw[first_key]

    for k in kw:
      query += "&%s=s" % (k, kw[k])

    return query

  def get(self, resource, auth='merchant', kw={}):
    key = self.auth.get(auth, '')

    url = resource + self._build_query_string({"_key" : key}.update(kw))
    resp = self.client.get(path=url)
    data = json.loads(resp.data)
    self.log.debug("[GET]\t'%s' --> [%s]\n\t\t%s " % (url, resp, repr(data)))
    print("[GET]\t'%s' --> [%s]\n\t\t%s" % (url, resp, resp.data))
    return data
   

  def post(self, resource, auth='merchant', kw={}):
    key = self.auth.get(auth, '')

    resp = self.client.post(path=resource, data={'_key' :key}.update(kw))
    data = json.loads(resp.data)
    self.log.debug("[POST]\t'%s' --> [%s]\n\t\t%s " % (resource, resp, repr(data)))
    print("[POST]\t'%s' --> [%s]\n\t\t%s " % (resource, resp, resp.data))
    return data

  def put(self, resource, auth='merchant', kw={}):
    key = self.auth.get(auth, '')

    resp = self.client.put(path=resource, data={'_key' : key}.update(kw))
    data = json.loads(resp.data)
    self.log.debug("[PUT]\t'%s' --> [%s]\n\t\t%s " % (resource, resp, repr(data)))
    print("[PUT]\t'%s' --> [%s]\n\t\t%s " % (resource, resp, resp.data))
    return data


  def delete(self, resource, auth='merchant',kw={}):
    key = self.auth.get(auth, '')

    resp = self.client.delete(path=resource, data={'_key' : key}.update(kw))
    data = json.loads(resp.data)
    self.log.debug("[DELETE]\t'%s' --> [%s]\n\t\t%s " % (resource, resp, repr(data)))
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
