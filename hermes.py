# -*- coding: utf-8 -*-

import lib.config
lib.config.DEBUG = True

from lib.log import Logger
lib.config.syslog = Logger('hermes')

from hermes import hermes

if __name__ == '__main__':
  hermes.debug = True
  hermes.run(port=5200)
