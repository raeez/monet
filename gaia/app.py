# -*- coding: utf-8 -*-

from flask import Flask
from gaia.views.example import example
from log import log

gaia = Flask('gaia')
log.add_logger('gaia_app', gaia.logger)
gaia.log = log
gaia.register_module(example)

gaia.config.update(
  MAX_CONTENT_LENGTH = 4096,
  LOGGER_NAME = 'gaia_app'
)

