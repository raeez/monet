#!/usr/bin/manhattan.python
# -*- coding: utf-8 -*-

import lib.config
lib.config.load('conf/production.json')
lib.config.CONF['syslog'] = 'gaia'

from flup.server.fcgi import WSGIServer
from gaia.app import gaia

WSGIServer(gaia, bindAddress='/tmp/gaia-fcgi.sock').run()
