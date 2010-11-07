# -*- coding: utf-8 -*-

from lib.config import configure
configure(
  debug = False,
  syslog = 'hermes'
)

from hermes.app import hermes

if __name__ == '__main__':
  hermes.debug = True
  hermes.run(port=5200)
