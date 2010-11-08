# -*- coding: utf-8 -*-

LOG_PREFIX = '/var/www/log/'

import lib.config
if lib.config.CONF.get('debug', True) is True:
  LOG_PREFIX = 'log/'

mail_conf = lib.config.CONF.get('mail', {})
MAIL_HOST = mail_conf.get('host', ('mail.authsmtp.com', 2525))
FROM_ADDR = mail_conf.get('address', 'raeez@mit.edu')
TO_ADDR = mail_conf.get('address', 'raeez@mit.edu')
AUTH = mail_conf.get('auth', ('ac53391', 'ezanqkp4gfzjbj'))
SUBJECT = 'Breakage in Manhattan!'
MAIL_ADMINS = [FROM_ADDR]
