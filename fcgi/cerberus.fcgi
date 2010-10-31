#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import sys

import lib.config
lib.config.DEBUG = False

from lib.log import Logger
lib.config.syslog = Logger('cerberus')

from flup.server.fcgi import WSGIServer
from cerberus import cerberus

WSGIServer(cerberus, bindAddress='/tmp/cerberus-fcgi.sock').run()
