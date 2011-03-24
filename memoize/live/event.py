# -*- coding: utf-8 -*-
import json
import zmq

def notify_photo_update(photo_id, memory_id, thumb, full):
  ctx = zmq.Context()
  socket = ctx.socket(zmq.PUSH)
  socket.bind("tcp://*:6000")
  msg = json.dumps({ "notify" : "memory",
                     "photo_id" : str(photo_id),
                     "memory_id" : str(memory_id),
                     "thumb" : str(thumb),
                     "full" : str(full) })
  print "live notify [%r]" % msg
  socket.send(msg)
