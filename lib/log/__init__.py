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

MAIL_HOST = 'mail.authsmtp.com'
FROM_ADDR = 'raeez@mit.edu'
TO_ADDR = 'raeez@mit.edu'
SUBJECT = 'Breakage in Manhattan!'
MAIL_ADMINS = ['admin@domain.com']
AUTH = ('ac53391', 'ezanqkp4gfzjbj')

class Logger(dict):
  """docstring for Logger"""
  def __init__(self, system_name):
    super(Logger, self).__init__()

    self.system_name = str(system_name)
    try:
      mkdir(LOG_PREFIX)
    except OSError:
      pass # directory exists

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

    self.email_handler = logging.handlers.SMTPHandler(MAIL_HOST, FROM_ADDR, MAIL_ADMINS, SUBJECT, credentials=AUTH)
    self.email_handler.setLevel(logging.ERROR)
    self.email_handler.setFormatter(self.email_formatter)
    self.handlers.append(self.email_handlers) #TODO get the mail server up and running

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
