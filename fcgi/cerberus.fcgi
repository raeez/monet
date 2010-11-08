#!/usr/bin/manhattan.python
# -*- coding: utf-8 -*-

import lib.config
lib.config.load('conf/production.json')
lib.config.CONF['syslog'] = 'cerberus'

from flup.server.fcgi import WSGIServer
from cerberus.app import cerberus

WSGIServer(cerberus, bindAddress='/tmp/cerberus-fcgi.sock').run()
