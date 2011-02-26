# -*- coding: utf-8 -*-

from flask import session, url_for, request, flash, redirect
from memoize.model import User, Photo, Quote, Memory
from lib.db.objectid import ObjectId
import json

def create_memory():
  mem_name = request.form.get('mem_name',None) or "New Memory"
  m = Memory()
  m.user = None
  if 'email' in session:
    m.user = session['id']
  else:
    m.user = None
  m.name = mem_name
  m.items = []
  m.save()
  return m

def get_memory(_id):
  return Memory.find_one({'_id' : ObjectId(_id)})

def get_photo(_id):
  return Photo.find_one({"_id" : ObjectId(_id)})

def upload_photo(mem_id=None):
  photo = request.files.get('photo', None)

  if not mem_id:
    m = create_memory()
  else:
    m = get_memory(mem_id)

  from client.app import client as app
  if not photo:
    return error(['missing photo'])
  else:
    try:
      filename = app.photos.save(request.files['photo'])
    except UploadNotAllowed:
      return error(['upload not allowed'])
    else:
      p = Photo()
      p.filename = filename
      p.user = session.get('_id', None)
      p.title = request.files.get('title', None)
      p.caption = request.files.get('caption', None)
      p.visible = 1;
      p.memory = m._id
      p.save()
      m.items = [p._id] + m.items
      m.save()
      return succeed({'id' : str(p._id),
                      'memory_url' : url_for('memory', id=m._id),
                      'thumb_url' : app.photos.url(p.filename), # TODO start building these
                      'image_url' : app.photos.url(p.filename),
                      'title' : p.title,
                      'caption' : p.caption,
                      'visible' : p.visible,
                      'memory' : str(m._id),
                      'type' : 'image/jpeg'})

def build_memory_stream():
  m = Memory.find({'user' : session['id']})
  s = []
  for memory in m:
    mem = {'id' : memory._id, 'name' : memory.name}
    s.append(mem)
  return s

def claimed(m):
  return not (not m.user)
def claim_memory(m):
  assert isinstance(m, Memory)
  if 'email' in session:
    m.user = session['id']
    m.save()
    return(succeed())
  return(error(["not logged in!"]))

def error(error_list=None):
  if not error_list:
    error_list = []
  assert isinstance(error_list, list)
  return json.dumps({"success" : False, "errors" : error_list})

def succeed(resp=None):
  if not resp:
    resp = {}
  assert isinstance(resp, dict)
  return json.dumps(dict({"success" : True, "errors" : []}, **resp)) # succint dictionary merge
