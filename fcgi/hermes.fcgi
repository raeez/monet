#!/usr/bin/python
# -*- coding: utf-8 -*-

import os
import sys

from lib.config import configure
configure(
  debug = False,
  syslog = 'hermes'
)

from flup.server.fcgi import WSGIServer
from hermes.app import hermes

WSGIServer(hermes, bindAddress='/tmp/hermes-fcgi.sock').run()
