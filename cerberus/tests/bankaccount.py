from cerberus.views.bankaccount import RESOURCE_URL

def test(client):
  def account_stripped(account):
    assert 'aba' not in account
    assert account['number'][:len(account)-2] == 'x' * len(account)-2
    return True

  data = client.get(RESOURCE_URL)
  assert data == []

  data_a = client.post(RESOURCE_URL, {'number' : '12345678910', 'aba' : 234344445666})
  assert data_a['number'] == 'xxxxxxxxx10'
  account_stripped(data_a)

  data_b = client.post(RESOURCE_URL, {'number' : '10987654321', 'aba' : 123456789})
  assert data_b['number'] == 'xxxxxxxxx21'
  account_stripped(data_b)

  id = (data_a['_id'], data_b['_id'])

  data = client.get(RESOURCE_URL)
  assert data_a in data
  assert data_b in data
  assert len(data) == 2

  data = client.get(RESOURCE_URL, {'_id' : id[0]})
  assert data_a in data
  assert len(data) == 1

  data = client.get(RESOURCE_URL, {'_id' : id[1]})
  assert data_b in data
  assert len(data) == 1

  update_a = client.put(RESOURCE_URL, {'_id' : id[0], 'number' : 123, 'aba' : 345})
  update_b = client.put(RESOURCE_URL, {'_id' : id[1], 'number' : 24234523432, 'aba' : 1232323211})
  data_c = client.post(RESOURCE_URL, {'number' : '10987654321', 'aba' : 123456789, '_id' : '192873'})
  assert 'error' in data_c
  assert data_c['error']  == 'ForbiddenArgumentError'
  assert '_id' in data_c['message']
  data_d = client.post(RESOURCE_URL, {'number' : '10987654321', 'aba' : 123456789, '_merchant' : id[0]})
  assert 'error' in data_d
  assert data_d['error']  == 'ForbiddenArgumentError'
  assert '_merchant' in data_d['message']
  data_e = client.post(RESOURCE_URL, {'number' : '10987654321', 'aba' : 123456789, '_merchant' : id[0], '_id' : id[1]})
  assert 'error' in data_e
  assert data_e['error']  == 'ForbiddenArgumentError'

  data = client.get(RESOURCE_URL)
  assert update_a in data
  assert update_b in data
  assert data_c not in data
  assert len(data) == 2

  data_c = client.post(RESOURCE_URL, {'number' : '11111111', 'aba' : 123})

  client.delete(RESOURCE_URL, {'_id' : id[0]})
  client.delete(RESOURCE_URL, {'_id' : id[1]})

  data = client.get(RESOURCE_URL)
  assert data_c in data
  assert account_stripped(data_c)
  assert data_b not in data
  assert data_a not in data
  assert len(data) == 1

  client.delete(RESOURCE_URL, {'_id' : data_c['_id']})

  data = client.get(RESOURCE_URL)
  assert data == []
