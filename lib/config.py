# -*- coding: utf-8 -*-

def load(filename='conf/local.json'):
  import json
  with open(filename, 'r') as config:
    try:
      import lib.config
      lib.config.CONF = json.loads(config.read())
    except:
      CONF = {
        'debug' : True,
        'syslog' : 'exception',
        'log' : True,
        'mongo' : {'host' : 'localhost',
                   'port' : 27017,
                   'replicate_minimum' : 1,
                   'safe' : True}
      }

CONF = {
  'debug' : True,
  'log' : True,
  'mongo' : {'host' : 'localhost',
             'port' : 27017,
             'replicate_minimum' : 1,
             'safe' : True}
}
