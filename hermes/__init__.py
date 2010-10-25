from flask import Flask, render_template
from hermes.views.site import site
from lib.log import Logger

hermes = Flask('hermes')
hermes.manhattan_logger = Logger('hermes')
hermes.manhattan_logger.add_logger('flask', hermes.logger)

hermes.register_module(site)
hermes.secret_key = "\x85\\w\xf9\xb0\x9eR\xb4\xdd\xfcD\x91\xfb\x01T\xecE\x9b\xa2-b\x87J/\xf5\xbb\x06\xdd\x96\xe6\xa7\x86x\xd5\x8f"

@hermes.errorhandler(404)
def page_not_found(error):
  return render_template('404.html'), 404
