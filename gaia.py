# -*- coding: utf-8 -*-

import lib.config
lib.config.DEBUG = True

import lib.log
lib.log.syslog = lib.log.Logger('gaia')

from gaia.app import gaia

if __name__ == '__main__':
  gaia.debug = True
  gaia.run(port=5300)
