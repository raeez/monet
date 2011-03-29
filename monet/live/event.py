# -*- coding: utf-8 -*-
import json
import zmq

def notify_photo_update(photo_id, memory_id, thumb, full, full_size, thumb_size):
  full_width, full_height = full_size
  width, height = thumb_size
  ctx = zmq.Context()
  socket = ctx.socket(zmq.PUSH)
  socket.bind("tcp://*:6000")
  msg = json.dumps({ "notify" : "memory",
                     "photo_id" : str(photo_id),
                     "memory_id" : str(memory_id),
                     "thumb" : str(thumb),
                     "full" : str(full),
                     "full_width" : full_width,
                     "full_height" : full_height,
                     "width" : width,
                     "height" : height })
  print "live notify [%r]" % msg
  socket.send(msg)
