# -*- coding: utf-8 -*-

from flask import session, url_for, request, flash, redirect
from memoize.model import User, Photo, Quote, Memory
from lib.db.objectid import ObjectId
import json
import datetime
import random

def create_memory():
  date = datetime.date.today().strftime("%B %d, %Y")
  mem_name = request.form.get('mem_name',None) or "Memorable Moments on " + date
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

def upload_photo(mem_id=None, multi_session=None):
  # multi_seession is a randomly generated string made on the homepage
  # This is to associate multiple uploads from the home page before
  # A memory ID has been created.

  photo = request.files.get('photo', None)

  if not mem_id:
    if multi_session:
      p2 = Photo.find_one({'multi_session':multi_session})
    if not p2:
      m = create_memory()
    else:
      mem_id = p2.memory
      m = get_memory(mem_id)
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
      p.visible = 1
      p.multi_session = multi_session
      p.memory = m._id
      p.save()
      m.items = [p._id] + m.items
      m.save()
      return succeed({'id' : str(p._id),
                      'memory' : str(m._id),
                      'memory_url' : url_for('memory', id=m._id),
                      'thumb_url' : app.photos.url(p.filename), # TODO start building these
                      'image_url' : app.photos.url(p.filename),
                      'title' : p.title,
                      'caption' : p.caption,
                      'visible' : p.visible,
                      'multi_session' : multi_session,
                      'type' : 'image/jpeg'})

def getVisiblePhotos(items):
    from client.app import client as app
    visible_items = []
    for item_id in items:
        p = get_photo(item_id)
        photo = dict()
        photo['id'] = p._id
        photo['thumb_url'] = app.photos.url(p.filename)

        if p.visible == 1:
          visible_items.append(photo)
    return visible_items

def build_memory_stream():
  m = Memory.find({'user' : session['id']})
  s = []
  for memory in m:
    visible_items = getVisiblePhotos(memory.items)
    rand_items = []

    if len(visible_items) > 4:
      rand_items = random.sample(visible_items, 4)
      more_photos = 1
    else:
      rand_items = visible_items
      more_photos = 0

    mem = { 'id' : memory._id,
            'name' : memory.name,
            'rand_items':rand_items,
            'more_photos':more_photos}
    s.insert(0,mem)
  return s


def rand_photo(m):
    if m:
        visible_items = getVisiblePhotos(m.items)
        rand_item = random.sample(visible_items,1)
        photo = rand_item[0]

        return json.dumps({"id":str(photo['id']), "thumb_url":photo['thumb_url']})
    else:
        return None

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
