# -*- coding: utf-8 -*-

import lib.config
lib.config.CONF = {
  'debug' : True,
  'syslog' : 'client.bootstrap.seed',
  'log' : True,
  'mongo' : {'host' : ('localhost', 27017),
             'replicate_minimum' : 1,
             'safe' : True},

  'mail' : {'host' : ('mail.authsmtp.com', 2525),
            'address' : 'raeez@mit.edu',
            'auth' : ('ac53391', 'ezanqkp4gfzjbj')}
}

from collate.model import User
import bcrypt

u = User()
u.name = "Raeez Lorgat"
u.password = bcrypt.hashpw('a123', bcrypt.gensalt(10))
u.email = 'raeez@mit.edu'
u.save()