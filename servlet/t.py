from tornado.wsgi import WSGIContainer
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop

import sys
sys.path.append("celery/local")

import lib.config
lib.config.load('conf/local.json')

from client.app import client as app

http_server = HTTPServer(WSGIContainer(app))
http_server.listen(5500)
IOLoop.instance().start()
