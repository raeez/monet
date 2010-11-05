# -*- coding: utf-8 -*-

from lib.config import configure
configure({
  'debug' : True,
  'syslog' : 'cerberus'
})

from cerberus.app import cerberus

if __name__ == '__main__':
  cerberus.debug = True
  cerberus.run(port=5100)
