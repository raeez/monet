# -*- coding: utf-8 -*-

DEBUG = True

class ConfigurationError(Exception):
  pass

def enforce_type(d, key, type):
  if isinstance(d[key], type) is False:
    raise ConfigurationError('%s key should be of type %s' % (key, type))
  

def configure(settings):
  KEY = 'debug'
  if settings.has_key(KEY):
    enforce_type(settings, KEY, bool)
    DEBUG = settings[KEY]

  KEY = 'syslog'
  if settings.has_key(KEY):
    enforce_type(settings, KEY, str)
    import lib.log
    lib.log.syslog = lib.log.Logger(settings[KEY])
