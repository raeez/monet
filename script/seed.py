# -*- coding: utf-8 -*-

import lib.config
lib.config.CONF = {
  'debug' : False,
  'syslog' : 'client.bootstrap.seed',
  'log' : True,
  'mongo' : {'host' : ('localhost', 5500),
             'replicate_minimum' : 1,
             'safe' : True},

  'mail' : {'host' : ('mail.authsmtp.com', 2525),
            'address' : 'raeez@mit.edu',
            'auth' : ('ac53391', 'ezanqkp4gfzjbj')}
}

from memoize.model import User
import bcrypt

u = User()
u.name = "Raeez Lorgat"
u.set_password('a123')
u.email = 'raeez@mit.edu'
u.save()
