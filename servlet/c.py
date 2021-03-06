# -*- coding: utf-8 -*-
import sys
sys.path.append("/home/ubuntu/monet/celery")
import lib.config
lib.config.CONF = {
  'debug' : False,
  'syslog' : 'client',
  'log' : True,
  'mongo' : { 'host' : ('localhost', 5500),
              'replicate_minimum' : 1,
              'safe' : True },

  'mail' : { 'host' : ('mail.authsmtp.com', 2525),
             'address' : 'raeez@mit.edu',
             'auth' : ('ac53391', 'ezanqkp4gfzjbj') },

  'uploads' : { 'path' : '/var/www/files',
                'base' : 'http://monet.raeez.com/' }
}

from client.app import client as app
