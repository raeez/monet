# -*- coding: utf-8 -*-

from flask import render_template, Flask
from hermes.views.site import site
from log import log

hermes = Flask('hermes')
log.add_logger('app', hermes.logger)
hermes.log = log

hermes.register_module(site)
hermes.secret_key = "\x85\\w\xf9\xb0\x9eR\xb4\xdd\xfcD\x91\xfb\x01T\xecE\x9b\xa2-b\x87J/\xf5\xbb\x06\xdd\x96\xe6\xa7\x86x\xd5\x8f"

hermes.config.update(
  MAX_CONTENT_LENGTH = 4096,
  LOGGER_NAME = 'app'
)

@hermes.errorhandler(404)
def page_not_found(error):
  return render_template('404.html'), 404

@hermes.errorhandler(500)
def server_error(error):
  return render_template('500.html'), 404
