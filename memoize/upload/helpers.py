# -*- coding: utf-8 -*-

from flask import session, url_for, request, flash, redirect
from memoize.model import User, Photo, Quote, Memory
from lib.db.objectid import ObjectId

def create_memory():
  mem_name = request.form.get('mem_name',None)

  if not mem_name:
    flash("missing")
  else:
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
  return None

def get_memory(_id):
  return Memory.find_one({'_id' : ObjectId(_id)})

def get_photo(_id):
  return Photo.find_one({"_id" : ObjectId(_id)})

def upload_photo(mem_id=None):
  photo = request.files.get('photo', None)
  title = request.form.get('title', None)
  caption = request.form.get('caption', None)

  if not mem_id:
    m = create_memory()
  else:
    m = get_memory(mem_id)

  if not photo:
    flash("missing")
  else:
    try:
      from client.app import client as app
      filename = app.photos.save(request.files['photo'])
    except UploadNotAllowed:
      flash("fail")
    else:
      p = Photo()
      p.filename = filename
      p.user = None
      p.title = title
      p.caption = caption
      p.memory = m._id
      p.save()
      m.items.append(p._id)
      m.save()
      return redirect(url_for('memory', id=m._id))

def build_memory_stream():
  m = Memory.find({'user' : session['_id']})
  s = []
  for memory in m:
    pair = {'id' : memory._id, 'name' : memory.name}
    s.append(pair)
  return s

def claimed(m):
  return not (not m.user)
