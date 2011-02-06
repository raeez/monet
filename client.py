# -*- coding: utf-8 -*-

import lib.config
lib.config.load('conf/local.json')
lib.config.CONF['syslog'] = 'client'

from client.app import client as app

if __name__ == '__main__':
  app.debug = True
  app.run(port=5000)