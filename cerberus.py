# -*- coding: utf-8 -*-

import lib.config
lib.config.load('conf/local.json')
lib.config.CONF['syslog'] = 'cerberus'

from cerberus.app import cerberus

if __name__ == '__main__':
  cerberus.debug = True
  cerberus.run(port=5100)
