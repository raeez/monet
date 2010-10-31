# -*- coding: utf-8 -*-

import lib.config
lib.config.DEBUG = True

from cerberus import cerberus

if __name__ == '__main__':
  cerberus.debug = True
  cerberus.run(port=5100)
