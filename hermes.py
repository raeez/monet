# -*- coding: utf-8 -*-

import lib.config
lib.config.load('conf/local.json')
lib.config.CONF['syslog'] = 'hermes'

from hermes.app import hermes

if __name__ == '__main__':
  hermes.debug = True
  hermes.run(port=5200)
