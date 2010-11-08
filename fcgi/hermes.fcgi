#!/usr/bin/manhattan.python
# -*- coding: utf-8 -*-

import lib.config
lib.config.load('conf/production.json')
lib.config.CONF['syslog'] = 'hermes'

from flup.server.fcgi import WSGIServer
from hermes.app import hermes

WSGIServer(hermes, bindAddress='/tmp/hermes-fcgi.sock').run()
