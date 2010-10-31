#!/usr/bin/python
import os
import sys

import lib.config
lib.config.DEBUG = False

from lib.log import Logger
lib.config.syslog = Logger('gaia')

from flup.server.fcgi import WSGIServer
from gaia import gaia

WSGIServer(gaia, bindAddress='/tmp/gaia-fcgi.sock').run()
