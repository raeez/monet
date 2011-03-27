from os import path as op

import zmq
from zmq.eventloop import ioloop
from zmq.eventloop.zmqstream import ZMQStream

import tornado.web
import tornadio
import tornadio.router
import tornadio.server

ROOT = op.normpath(op.dirname(__file__))

ctx = zmq.Context() # TODO figure out why 1
io_loop = ioloop.IOLoop.instance()

worker_pull = ctx.socket(zmq.PULL)
worker_pull.connect("tcp://localhost:6000")

worker_pub = ctx.socket(zmq.PUB)
worker_pub.bind('inproc://worker/fetched')

master_sub = ctx.socket(zmq.SUB)
master_sub.connect('inproc://worker/fetched')
master_sub.setsockopt(zmq.SUBSCRIBE, "")

class Events (object):

  def __init__(self, in_socket, out_socket, io_loop):
    self._in_socket = in_socket
    # self._in_socket.setsockopt(zmq.HWM, 10)
    self._out_socket = out_socket
    self._io_loop = io_loop

    self._stream = ZMQStream(self._in_socket, self._io_loop)
    self._stream.on_recv(self._receive)

  def _receive(self, msg):
    try:
      update = json.loads(msg)
    except:
      print("Invalid JSON: " + msg)
      return None

    print("got update from zeromq: " + msg)
    clients = subscriptions[update['memory_id']] or []
    print("sending to all: " + clients)
    upd = { 'action' : 'update',
            'type' : 'photo',
            '_id' : update.photo_id,
            'thumb' : update.thumb,
            'full' : update.full,
            'width' : update.width,
            'height' : update.height }
    ClientConnection.update_by_memory(update['memory_id'], upd)

class IndexHandler(tornado.web.RequestHandler):
  """Regular HTTP handler to serve the dummy index page"""
  def get(self):
    self.render("index.html")

class ClientConnection(tornadio.SocketConnection):
  clients = {}

  @classmethod
  def update_by_memory(cls, _id, update):
    cls.clients[_id] = cls.clients[_id] or set()
    for c in cls.clients[_id]:
      c.send(update)

  def on_open(self, *args, **kwargs):
    self.send({ 'action' : 'ping'})

  # def on_close(self, *args, **kwargs):
    # self.clients[m_id].remove(self)

  def on_message(self, msg):
    try:
      request = json.loads(msg)
    except:
      print("Invalid JSON: " + msg)
      return None

    if request['action'] == 'pong':
      m_id = request['memory']
      self.clients[m_id] = self.clients[m_id] or set()
      self.clients[m_id].add(self)

#use the routes classmethod to build the correct resource
ChatRouter = tornadio.get_router(ChatConnection)

#configure the Tornado application
application = tornado.web.Application(
  [(r"/", IndexHandler), ChatRouter.route()],
  flash_policy_port = 843,
  flash_policy_file = op.join(ROOT, 'flashpolicy.xml'),
  socket_io_port = 8001
)

if __name__ == "__main__":
  import logging
  logging.getLogger().setLevel(logging.DEBUG)

  tornadio.server.SocketServer(application)

  # ioloop.DelayedCallback(io_loop.stop, 5000.0, io_loop).start() # handy

  stream = ZMQStream(master_sub, io_loop)
  stream.on_recv(print_and_send_2_more)

  events = Events(worker_pull, worker_pub, io_loop)

  print "Starting ioloop..."
  io_loop.start()
  print "Finished"
  
  worker_pull.close()
  worker_pub.close()
  master_sub.close()
  ctx.term()
