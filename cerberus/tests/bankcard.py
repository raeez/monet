from cerberus.views.bankcard import RESOURCE_URL

def test(client):
  def card_stripped(card):
    assert 'cvc' not in card
    assert 'exp_month' not in card
    assert 'exp_year' not in card
    assert 'association' in card
    return True

  data = client.get(RESOURCE_URL)
  assert data == []

  mal_month = client.post(RESOURCE_URL,
                      {'number' : '3948729372830192',
                       'cvc' : 3499,
                       'exp_month' : 2013,
                       'exp_year' : 2013})
  assert 'error' in mal_month
  assert mal_month['error'] == 'ValidationError'
  assert 'exp_month' in mal_month['message']

  data_a = client.post(RESOURCE_URL,
                       {'number' : '4485293760293',
                        'cvc' : 838,
                        "exp_month" : 10,
                        "exp_year" : 2011})
  assert data_a['number'] == 'xxxxxxxxx0293'
  assert data_a['association'] == 'visa'
  assert card_stripped(data_a)

  data_b = client.post(RESOURCE_URL,
                       {'number' : '5333296594928476',
                        'cvc' : 3243,
                        'exp_month' : 12,
                        'exp_year' : 2015})
  assert data_b['number'] == 'xxxxxxxxxxxx8476'
  assert data_b['association'] == 'mastercard'
  assert card_stripped(data_b)

  mal_number = client.post(RESOURCE_URL,
                       {'number' : '9372739283',
                        'cvc' : 3499,
                        'exp_month' : 4,
                        'exp_year' : 2013})
  assert 'error' in mal_number
  assert mal_number['error'] == 'ValidationError'
  assert 'number' in mal_number['message']

  data_c = client.post(RESOURCE_URL,
                       {'number' : '6011791506959004',
                        'cvc' : 293,
                        'exp_month' : 03,
                        'exp_year' : 2014})
  assert data_c['number'] == 'xxxxxxxxxxxx9004'
  assert data_c['association'] == 'discover'
  assert card_stripped(data_c)

  data_d = client.post(RESOURCE_URL,
                       {'number' : '5445896464161713',
                        'cvc' : 324,
                        'exp_month' : 8,
                        'exp_year' : 2012})
  assert data_d['number'] == 'xxxxxxxxxxxx1713'
  assert data_d['association'] == 'mastercard'
  assert card_stripped(data_d)

  data_e = client.post(RESOURCE_URL,
                       {'number' : '3158485439220903',
                        'cvc' : 2922,
                        'exp_month' : 2,
                        'exp_year' : 2015})
  assert data_e['number'] == 'xxxxxxxxxxxx0903'
  assert data_e['association'] == 'jcb'
  assert card_stripped(data_e)

  mal_year = client.post(RESOURCE_URL,
                      {'number' : '3948729372830192',
                       'cvc' : 3499,
                       'exp_month' : 4,
                       'exp_year' : 'aa92'})
  assert 'error' in mal_year
  assert mal_year['error'] == 'ValidationError'
  assert 'exp_year' in mal_year['message']

  data_f = client.post(RESOURCE_URL,
                       {'number' : '3400000000000000',
                        'cvc' : 2043,
                        'exp_month' : 8,
                        'exp_year' : 2012})
  assert data_f['number'] == 'xxxxxxxxxxxx0000'
  assert data_f['association'] == 'amex'
  assert card_stripped(data_f)


  data_g = client.post(RESOURCE_URL,
                       {'number' : '201489083725814',
                        'cvc' : 3499,
                        'exp_month' : 4,
                        'exp_year' : 2013})
  assert data_g['number'] == 'xxxxxxxxxxx5814'
  assert data_g['association'] == 'unknown'
  assert card_stripped(data_g)
  
  mal_year = client.post(RESOURCE_URL,
                      {'number' : '3948729372830192',
                       'cvc' : 3499,
                       'exp_month' : 4,
                       'exp_year' : 'aa92'})
  assert 'error' in mal_year
  assert mal_year['error'] == 'ValidationError'
  assert 'exp_year' in mal_year['message']

  data_h = client.post(RESOURCE_URL,
                       {'number' : '14000000000004',
                        'cvc' : 123,
                        'exp_month' : 5,
                        'exp_year' : 2020})
  assert data_h['number'] == 'xxxxxxxxxx0004'
  assert data_h['association'] == 'unknown'
  assert card_stripped(data_h)

  mal_cvc = client.post(RESOURCE_URL,
                      {'number' : '3948729372830192',
                       'cvc' : '3499a',
                       'exp_month' : 4,
                       'exp_year' : '2013'})
  assert 'error' in mal_cvc
  assert mal_cvc['error'] == 'ValidationError'
  assert 'cvc' in mal_cvc['message']

  # ensure that we only stored the valid ones
  valid = [data_a, data_b, data_c, data_d, data_e, data_f, data_g]
  invalid = [mal_number, mal_month, mal_year, mal_cvc]

  # test a query
  data = client.get(RESOURCE_URL, {"association" : "unknown"})
  assert data_h in data
  assert data_g in data
  assert len(data) == 2

  data = client.get(RESOURCE_URL)
  for v in valid:
    assert v in data
  for i in invalid:
    assert i not in data
  assert len(data) == 8

  # delete some of 'em
  to_delete = [data_g, data_c, data_b, data_h]
  for item in to_delete:
    client.delete(RESOURCE_URL, {'_id' : item['_id']})

  # test get them all
  data = client.get(RESOURCE_URL)
  for item in to_delete:
    assert item not in data
  assert len(data) == 4
  
  # test some puts
  update_a = client.put(RESOURCE_URL, {'_id' : data_a['_id'], 'exp_month' : 12, 'exp_year' : 2023})
  assert update_a == data_a
  assert card_stripped(update_a)

  update_d = client.put(RESOURCE_URL, {'_id' : data_d['_id'], 'number' : '4111111111111111'})
  assert update_d['number'] == 'xxxxxxxxxxxx1111'
  assert update_d['association'] == 'visa'
  assert update_d['_id'] == data_d['_id']
  assert card_stripped(update_d)

  update_e = client.put(RESOURCE_URL, {'_id' : data_e['_id'], 'number' : 3337121527840468})
  assert update_e['number'] == 'xxxxxxxxxxxx0468'
  assert update_e['association'] == 'jcb'
  assert update_e['_id'] == data_e['_id']
  assert card_stripped(update_e)

  update_f = client.put(RESOURCE_URL, {'_id' : data_f['_id'], 'number' : 8273637463727283, 'exp_month' : 2019})
  assert 'error' in update_f
  assert update_f['error'] == 'ValidationError'
  assert 'exp_month' in update_f['message']

  ill_a = client.post(RESOURCE_URL, {'_id' : 'falajt2t23498',
                                      'number' : '9384727382737483',
                                      'cvc' : 203,
                                      'exp_month' : 10,
                                      'exp_year' : 2012})
  assert 'error' in ill_a
  assert ill_a['error'] == 'ForbiddenArgumentError'
  assert '_id' in ill_a['message']

  ill_b = client.post(RESOURCE_URL, {'_merchant' : '2903402384aoeuhg',
                                      'number' : '9384727382737483',
                                      'cvc' : 203,
                                      'exp_month' : 10,
                                      'exp_year' : 2012})
  assert 'error' in ill_b
  assert ill_b['error'] == 'ForbiddenArgumentError'
  assert '_merchant' in ill_b['message']

  ill_c = client.post(RESOURCE_URL, {'_merchant' : '2903402384aoeuhg',
                                     '_id' : '89237492349',
                                      'number' : '9384727382737483',
                                      'cvc' : 203,
                                      'exp_month' : 10,
                                      'exp_year' : 2012})
  assert 'error' in ill_c
  assert ill_c['error'] == 'ForbiddenArgumentError'

  data = client.get(RESOURCE_URL)
  assert ill_a not in data
  assert ill_b not in data
  assert ill_c not in data
  assert update_a in data
  assert update_d in data
  assert update_e in data
  assert update_f not in data
  assert data_f in data
  assert len(data) == 4

  # delete the rest
  for item in [data_a, data_d, data_e, data_f]:
    client.delete(RESOURCE_URL, {'_id' : item['_id']})

  data = client.get(RESOURCE_URL)
  assert data == []
