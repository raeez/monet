# -*- coding: utf-8 -*-

import lib.config
lib.config.DEBUG = True

import lib.log
lib.log.syslog = lib.log.Logger('cerberus')

from cerberus.app import cerberus

if __name__ == '__main__':
  cerberus.debug = True
  cerberus.run(port=5100)
