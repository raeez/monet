#!/usr/bin/python
import os
import sys

from flup.server.fcgi import WSGIServer
from cerberus import cerberus

WSGIServer(cerberus, bindAddress='/tmp/cerberus-fcgi.sock').run()
