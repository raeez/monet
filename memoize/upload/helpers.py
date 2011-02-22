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
    m.user = session['_id']
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
    return err('missing photo')
  else:
    try:
      filename = app.photos.save(request.files['photo'])
    except UploadNotAllowed:
      return err('upload not allowed')
    else:
      p = Photo()
      p.filename = filename
      p.user = session.get('_id', None)
      p.title = request.files.get('title', None)
      p.caption = request.files.get('caption', None)
      p.memory = m._id
      p.save()
      m.items = [p._id] + m.items
      m.save()
      return succeed({'memory_url' : url_for('memory', id=m._id),
                      'thumb_url' : app.photos.url(p.filename), # TODO start building these
                      'image_url' : app.photos.url(p.filename),
                      'title' : p.title,
                      'caption' : p.caption,
                      'type' : 'image/jpeg'})

def build_memory_stream():
  m = Memory.find({'user' : session['_id']})
  s = []
  for memory in m:
    mem = {'id' : memory._id, 'name' : memory.name}
    s.append(mem)
  return s

def claimed(m):
  return not (not m.user)

def error(error_list):
  assert isinstance(error_list, list)
  return json.dumps({"success" : False, "errors" : error_list})

def succeed(resp):
  assert isinstance(resp, dict)
  return json.dumps(dict({"success" : True, "errors" : []}, **resp)) # succint dictionary merge
