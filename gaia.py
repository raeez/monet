# -*- coding: utf-8 -*-

import lib.config
lib.config.DEBUG = True

from lib.log import Logger
lib.config.syslog = Logger('gaia')

from gaia import gaia

if __name__ == '__main__':
  gaia.debug = True
  gaia.run(port=5300)
