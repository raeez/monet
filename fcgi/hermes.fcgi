#!/usr/bin/python
import os
import sys
sys.path.append('/home/ubuntu/manhattan/')

from flup.server.fcgi import WSGIServer
from hermes import hermes

WSGIServer(hermes, bindAddress='/tmp/hermes-fcgi.sock').run()
