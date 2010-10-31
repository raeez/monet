#!/usr/bin/python
import os
import sys

import lib.config
lib.config.DEBUG = False

from lib.log import Logger
lib.config.syslog = Logger('cerberus')

from flup.server.fcgi import WSGIServer
from hermes import hermes

WSGIServer(hermes, bindAddress='/tmp/hermes-fcgi.sock').run()
