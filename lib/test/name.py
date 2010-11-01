# -*- coding: utf-8 -*-

from datetime import datetime

def generate_test_name():
  test_name = "test-%s" % datetime.now()
  final =  test_name[:15] + '-' + test_name[16:]
  final = final[:final.find(".")]
  return final
