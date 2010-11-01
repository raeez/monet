# -*- coding: utf-8 -*-

import lib.config
lib.config.DEBUG = True

import lib.log
lib.log.syslog = lib.log.Logger('hermes')

from hermes.app import hermes

if __name__ == '__main__':
  hermes.debug = True
  hermes.run(port=5200)
