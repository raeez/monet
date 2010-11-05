#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import sys

from lib.config import configure
configure({
  'debug' : False,
  'syslog' : 'cerberus'
})

from flup.server.fcgi import WSGIServer
from cerberus.app import cerberus

WSGIServer(cerberus, bindAddress='/tmp/cerberus-fcgi.sock').run()
