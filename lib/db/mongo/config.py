# -*- coding: utf-8 -*-

import lib.config

mongo_conf = lib.config.CONF.get('mongo', {})
HOST = mongo_conf.get('host', ['localhost', 27017])
SAFE = mongo_conf.get('safe', True)
REPLICATE_MIN = mongo_conf.get('replicate_minimum', 1)
