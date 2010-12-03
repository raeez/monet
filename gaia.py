# -*- coding: utf-8 -*-

import lib.config
lib.config.load('conf/local.json')
lib.config.CONF['syslog'] = 'gaia'

from gaia.app import gaia

if __name__ == '__main__':
  gaia.debug = True
  gaia.run(port=5300)
