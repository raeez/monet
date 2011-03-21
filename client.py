# -*- coding: utf-8 -*-

#celery config
import sys
sys.path.append("celery/local")

import lib.config
lib.config.load('conf/local.json')

from client.app import client as app

if __name__ == '__main__':
  app.debug = True
  app.run(port=5000)
