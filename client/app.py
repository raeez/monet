# -*- coding: utf-8 -*-

from flask import render_template, Flask
from flaskext.uploads import (UploadSet, configure_uploads, IMAGES,
                              UploadNotAllowed, patch_request_class)
from client.views.main import main_module
from log import log
import lib.config

client = Flask('client')
log.add_logger('client_app', client.logger)
client.log = log

client.register_module(main_module)
# TODO write a function to automate the generation of these secrets
client.secret_key = "\x85\\w\xf9\xb0\x9eR\xb4\xdd\xfcD\x91\xfb\x01T\xecE\x9b\xa2-b\x87J/\xf5\xbb\x06\xdd\x96\xe6\xa7\x86x\xd5\x8f"

client.config.update(
  UPLOADS_DEFAULT_DEST = lib.config.CONF['uploads']['path'],
  UPLOADS_DEFAULT_URL = lib.config.CONF['uploads']['base'],

  LOGGER_NAME = 'client_app'
)

client.photos = UploadSet('thumb', IMAGES)
configure_uploads(client, client.photos)
patch_request_class(client, 800 * 1024) #800kb


@client.errorhandler(404)
def page_not_found(error):
  return render_template('404.html'), 404

@client.errorhandler(500)
def server_error(error):
  return render_template('500.html'), 404
