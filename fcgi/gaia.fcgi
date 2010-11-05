#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import sys

from lib.config import configure
configure({
  'debug' : False,
  'syslog' : 'gaia'
})

from flup.server.fcgi import WSGIServer
from gaia.app import gaia

WSGIServer(gaia, bindAddress='/tmp/gaia-fcgi.sock').run()
