# -*- coding: utf-8 -*-

import lib.config
lib.config.load('conf/local.json')
lib.config.CONF['syslog'] = 'client'

from client.app import client

if __name__ == '__main__':
  client.debug = True
  client.run(port=5000)
