#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import sys

import lib.config
lib.config.DEBUG = False

import lib.log
lib.log.syslog = lib.log.Logger('gaia')

from flup.server.fcgi import WSGIServer
from gaia.app import gaia

WSGIServer(gaia, bindAddress='/tmp/gaia-fcgi.sock').run()
