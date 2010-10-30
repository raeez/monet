#!/usr/bin/python
import os
import sys

from flup.server.fcgi import WSGIServer
from gaia import gaia

WSGIServer(gaia, bindAddress='/tmp/gaia-fcgi.sock').run()
