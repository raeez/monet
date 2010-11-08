# -*- coding: utf-8 -*-

def load(filename='conf/local.json'):
  import json
  with open(filename, 'r') as config:
    import lib.config
    lib.config.CONF = json.loads(config.read())

CONF = {
  'debug' : True,
  'log' : True,
  'mongo' : {'host' : ('localhost', 27017),
             'replicate_minimum' : 1,
             'safe' : True},

  'mail' : {'host' : ('mail.authsmtp.com', 2525),
            'address' : 'raeez@mit.edu',
            'auth' : ('ac53391', 'ezanqkp4gfzjbj')}
}
