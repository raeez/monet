# -*- coding: utf-8 -*-

DEBUG = True

class ConfigurationError(Exception):
  pass

def enforce_type(d, key, type):
  if isinstance(d[key], type) is False:
    raise ConfigurationError('%s key should be of type %s' % (key, type))
  

def configure(**kw):
  KEY = 'debug'
  if kw.has_key(KEY):
    enforce_type(kw, KEY, bool)
    print 'config: setting debug to %s' % kw[KEY]
    import lib.config
    lib.config.DEBUG = kw[KEY]

  KEY = 'syslog'
  if kw.has_key(KEY):
    enforce_type(kw, KEY, str)
    print 'config: setting syslog to %s' % kw[KEY]
    from lib.log import Logger
    Logger.set_syslog_name(kw[KEY])
