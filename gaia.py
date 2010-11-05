# -*- coding: utf-8 -*-

from lib.config import configure
configure({
  'debug' : False,
  'syslog' : 'hermes'
})

from gaia.app import gaia

if __name__ == '__main__':
  gaia.debug = True
  gaia.run(port=5300)
