#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import sys

import lib.config
lib.config.DEBUG = False

import lib.log
lib.log.syslog = lib.log.Logger('cerberus')

from flup.server.fcgi import WSGIServer
from cerberus.app import cerberus

WSGIServer(cerberus, bindAddress='/tmp/cerberus-fcgi.sock').run()
