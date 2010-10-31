from flask import Flask
from gaia.views.example import example
from log import log

gaia = Flask('gaia')
log.add_logger('flask', gaia.logger)
gaia.register_module(example)
