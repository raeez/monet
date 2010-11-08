# -*- coding: utf-8 -*-

import logging
import logging.handlers
from os import mkdir
import lib.config

LOG_PREFIX = '/var/www/log/'

if lib.config.DEBUG is True:
  LOG_PREFIX = 'log/'

LOG_LEVELS = { 'none' : logging.NOTSET,
               'debug' : logging.DEBUG,
               'info' : logging.INFO,
               'warning' : logging.WARNING,
               'error' : logging.ERROR,
               'critical' : logging.CRITICAL }

MAIL_HOST = ('mail.authsmtp.com', 2525)
FROM_ADDR = 'raeez@mit.edu'
TO_ADDR = 'raeez@mit.edu'
SUBJECT = 'Breakage in Manhattan!'
MAIL_ADMINS = ['raeez@mit.edu']
AUTH = ('ac53391', 'ezanqkp4gfzjbj')

class Logger(dict):
  """docstring for Logger"""

  @classmethod
  def system_log(cls):
    default_name = cls.__dict__.get('syslog_name', 'default_syslog')
    if 'syslog' not in cls.__dict__:
      cls.syslog = Logger(default_name)
    return cls.syslog

  @classmethod
  def set_syslog_name(cls, newname):
    cls.syslog_name = newname

  def __init__(self, system_name):
    super(Logger, self).__init__()

    self.system_name = str(system_name)
    try:
      mkdir(LOG_PREFIX)
    except OSError:
      pass # TODO directory exists OR can't make due to permissions—make sure to handle this properly

    self.filename = LOG_PREFIX + self.system_name + '.log'
    
    #formatters
    self.email_formatter = logging.Formatter('''
              Message type:       %(levelname)s
              Location:           %(pathname)s:%(lineno)d
              Module:             %(module)s
              Function:           %(funcName)s
              Time:               %(asctime)s

              Message:

              %(message)s
              ''')
    self.file_formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    #handlers
    self.handlers = []

    self.file_handler = logging.handlers.RotatingFileHandler(self.filename, maxBytes=1000000000, backupCount=5)
    self.file_handler.setLevel(logging.DEBUG)
    self.file_handler.setFormatter(self.file_formatter)
    self.handlers.append(self.file_handler)

    if lib.config.DEBUG is False:
      self.email_handler = logging.handlers.SMTPHandler(MAIL_HOST, FROM_ADDR, MAIL_ADMINS, SUBJECT, credentials=AUTH)
      self.email_handler.setLevel(logging.ERROR)
      self.email_handler.setFormatter(self.email_formatter)
      self.handlers.append(self.email_handler) #TODO get the mail server up and running

    self.create_logger('system')

  def create_logger(self, logname):
    if self.has_key(logname) is False:
      new_logger = logging.getLogger(logname)
      new_logger.setLevel(logging.DEBUG)
    
      for h in self.handlers:
        new_logger.addHandler(h)

      self[logname] = new_logger
      self['system'].debug('created logger %s' % repr(logname))

  def add_logger(self, logname, logger):
    if self.has_key(logname) is False:
      logger.setLevel(logging.DEBUG)

      for h in self.handlers:
        logger.addHandler(h)

      self['system'].debug('added logger %s' % repr(logname))
      self[logname] = logger
