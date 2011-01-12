# -*- coding: utf-8 -*-

from lib.log import Logger

log = Logger.system_log()
log.create_logger('login')
log.create_logger('logout')
log.create_logger('request')
