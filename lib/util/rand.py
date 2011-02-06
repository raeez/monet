# -*- coding: utf-8 -*-

import random
KEY_SIZE = 50
SAMPLE = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890_'

def generate_key(key_size=KEY_SIZE, sample=SAMPLE):
  return "".join(random.sample(sample, key_size))
