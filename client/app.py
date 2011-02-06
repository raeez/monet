# -*- coding: utf-8 -*-

from flask import render_template, Flask
from flaskext.uploads import (UploadSet, configure_uploads, IMAGES,
                              UploadNotAllowed, patch_request_class)
from client.views.main import main_module
from log import log

client = Flask('client')
log.add_logger('client_app', client.logger)
client.log = log

client.register_module(main_module)
client.secret_key = "\x85\\w\xf9\xb0\x9eR\xb4\xdd\xfcD\x91\xfb\x01T\xecE\x9b\xa2-b\x87J/\xf5\xbb\x06\xdd\x96\xe6\xa7\x86x\xd5\x8f"

client.config.update(
  LOGGER_NAME = 'client_app',
  UPLOADED_PHOTOS_DEST = '/tmp'
)

UPLOADED_PHOTOS_DEST = '/tmp'

client.photos = UploadSet('photos', IMAGES)
configure_uploads(client, client.photos)
patch_request_class(client, 32 * 1024 * 1024) #32 MB


@client.errorhandler(404)
def page_not_found(error):
  return render_template('404.html'), 404

@client.errorhandler(500)
def server_error(error):
  return render_template('500.html'), 404
