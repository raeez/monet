#!/usr/bin/manhattan.python
# -*- coding: utf-8 -*-

import lib.config
lib.conf.CONF = {
  'debug' : False,
  'syslog' : 'cerberus',
  'log' : True,
  'mongo' : {'host' : ('localhost', 27017),
             'replicate_minimum' : 1,
             'safe' : True},

  'mail' : {'host' : ('mail.authsmtp.com', 2525),
            'address' : 'raeez@mit.edu',
            'auth' : ('ac53391', 'ezanqkp4gfzjbj')}
}

from flup.server.fcgi import WSGIServer
from cerberus.app import cerberus

WSGIServer(cerberus, bindAddress='/tmp/cerberus-fcgi.sock').run()
