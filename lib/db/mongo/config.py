# -*- coding: utf-8 -*-

import lib.config

HOST = lib.config.CONF['mongo']['host']
PORT = lib.config.CONF['mongo']['port']
SAFE = lib.config.CONF['mongo']['safe']
REPLICATE_MIN = lib.config.CONF['mongo']['replicate_minimum']
