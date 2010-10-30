#!/usr/bin/python
import os
import sys

from flup.server.fcgi import WSGIServer
from hermes import hermes

WSGIServer(hermes, bindAddress='/tmp/hermes-fcgi.sock').run()
