#!/usr/bin/python
import os
import sys
sys.path.append('/home/ubuntu/manhattan/')

from flup.server.fcgi import WSGIServer
from gaia import gaia

WSGIServer(gaia, bindAddress='/tmp/gaia-fcgi.sock').run()
