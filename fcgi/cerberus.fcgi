#!/usr/bin/python
import os
import sys
sys.path.append('/home/ubuntu/manhattan/')

from flup.server.fcgi import WSGIServer
from cerberus import cerberus

WSGIServer(cerberus, bindAddress='/tmp/cerberus-fcgi.sock').run()
