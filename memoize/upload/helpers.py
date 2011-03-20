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
  m.artifacts = []
  m.save()
  return m

def get_memory(_id):
  return Memory.find_one({'_id' : ObjectId(_id)})

def get_photo(_id):
  return Photo.find_one({"_id" : ObjectId(_id)})

def upload_photo(mem_id=None, multi_session=None):
  """multi_seession is a randomly generated string made on the homepage
     This is to associate multiple uploads from the home page before
     A memory ID has been created.
  """

  photo = request.files.get('photo', None)

  if not mem_id:
    if multi_session:
      p2 = Photo.find_one({ 'multi_session' : multi_session })
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
      p.visible = 1 # TODO make this a boolean
      p.multi_session = multi_session
      p.memory = m._id
      p.resize(app.photos.path(filename))
      p.save()
      m.atomic_append({ "artifacts" : p._id })
      width, height = p.size()

      return succeed({'id' : str(p._id),
                      'memory' : str(m._id),
                      'memory_url' : url_for('memory', id=m._id),
                      'thumb_url' : app.photos.url(p.filename), # TODO start building these
                      'image_url' : app.photos.url(p.filename),
                      'width': width,
                      'height' : height,
                      'title' : p.title,
                      'caption' : p.caption,
                      'visible' : p.visible,
                      'multi_session' : multi_session,
                      'type' : 'image/jpeg'})

def getArtifactsFromMemory(memory_object, offset=0, numArtifacts=100, get_hidden=0):
  ''' Returns a list of artifacts from a given memory object
  offset and numArtifacts specify a selection of artifacts to return.
  If get_hidden is 1, we will also return hidden photos
  '''
  from client.app import client as app
  artifact_list = memory_object.artifacts[::-1]
  artifacts = []
  index = 0
  count = 0
  for i in artifact_list:
    if index >= offset and count < numArtifacts:
      p = get_photo(i)
      if p.visible == 0:
        if get_hidden == 1:
          pass
        else:
          continue

      width, height = p.size()

      artifact = dict()
      artifact['id'] = str(p._id)
      artifact['image_url'] = app.photos.url(p.filename)
      artifact['thumb_url'] = app.photos.url(p.filename)
      artifact['visible'] = p.visible
      artifact['width'] = width
      artifact['height'] = height
      artifacts.append(artifact)
      count += 1
    index += 1

  return artifacts

def getVisibleArtifacts(artifacts):
    ''' Given a list of artifacts, returns a list of only the visible ones
    '''
    from client.app import client as app
    visible_artifacts = []
    for artifact_id in artifacts:
        p = get_photo(artifact_id)
        photo = dict()
        photo['id'] = p._id
        photo['thumb_url'] = app.photos.url(p.filename)

        if p.visible == 1:
          visible_artifacts.append(photo)
    return visible_artifacts

def build_memory_stream():
  m = Memory.find({'user' : session['id']})
  s = []
  for memory in m:
    visible_artifacts = getVisibleArtifacts(memory.artifacts)
    rand_artifacts = []

    if len(visible_artifacts) > 4:
      rand_artifacts = random.sample(visible_artifacts, 4)
      more_photos = 1
    else:
      rand_artifacts = visible_artifacts
      more_photos = 0

    mem = { 'id' : memory._id,
            'name' : memory.name,
            'rand_artifacts':rand_artifacts,
            'more_photos' : more_photos }
    s.insert(0,mem)
  return s


def rand_photo(m):
    if m:
        visible_artifacts = getVisibleArtifacts(m.artifacts)
        rand_artifact = random.sample(visible_artifacts,1)
        photo = rand_artifact[0]

        return json.dumps({ "id" : str(photo['id']),
                            "thumb_url" : photo['thumb_url']})
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
  return json.dumps({ "success" : False,
                      "errors" : error_list })

def succeed(resp=None):
  if not resp:
    resp = {}
  assert isinstance(resp, dict)
  return json.dumps(dict({ "success" : True,
                           "errors" : [] },
                           **resp)) # succint dictionary merge
