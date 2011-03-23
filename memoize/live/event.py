# -*- coding: utf-8 -*-
import json
import zmq

def notify_memory(_id):
  ctx = zmq.Context()
  socket = ctx.socket(zmq.PUSH)
  socket.bind("tcp://*:6000")
  msg = json.dumps({ "notify" : "memory",
                     "_id" : str(_id) })
  print "live notify [%r]" % msg
  socket.send(msg)
