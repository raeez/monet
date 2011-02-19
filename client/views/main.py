# -*- coding: utf-8 -*-

from flask import Module, session, redirect, url_for, request, render_template, flash, abort
from flaskext.uploads import UploadNotAllowed
from memoize.model import User, Photo, Quote, Memory
from memoize.upload.helpers import get_memory, create_memory, upload_photo
from lib.db.objectid import ObjectId
import bcrypt

from client.log import log

main_module = Module(__name__)

###########
## INDEX ##
###########

@main_module.route('/')
def index():
  log['request'].debug("request %s" % repr(request.path))

  if 'email' in session:
    return redirect(url_for('stream'))
  return render_template('index.html')

###########
## INDEX ##
###########

@main_module.route('/login', methods=['GET', 'POST'])
def login():
  log['request'].debug("request %s" % repr(request.path))

  if 'email' in session:
    return redirect(url_for('index'))
  elif request.method == 'POST':
    log['login'].debug("request %s" % repr(request.form))
    #auth
    user = User.find_one({'email' : request.form['email']})

    #if this user has not logged in before
    if user is None:
      flash('null')
      return redirect(url_for('login'))

    if bcrypt.hashpw(request.form['password'], user.password) == user.password:
      session['email'] = request.form['email']
      session['_id'] = user._id
      session['password'] = request.form['password']
      log['login'].debug(session['email'])
      return redirect(url_for('index'))
  return render_template('login.html')

@main_module.route('/logout')
def logout():
  log['request'].debug("request %s" % repr(request.path))
  log['logout'].debug(session['email'])
  session.pop('email', None)
  return redirect(url_for('index'))

###################
## NOT LOGGED IN ##
###################

@main_module.route('/new', methods=['GET', 'POST'])
def new():
  if request.method == 'POST':
    return upload_photo()
  return render_template('new.html')

@main_module.route('/memory/<id>', methods=['GET', 'POST'])
def memory(id):
  if request.method == "POST":
    return upload_photo(id)

  m = get_memory(id)

  if not m:
    abort(404)
  else:
    from client.app import client as app
    items = []
    for i in m.items:
      p = Photo.find_one({"_id" : ObjectId(i)})
      triple = (p._id, p.title, app.photos.url(p.filename))
      items.append(triple)
    return render_template('memory.html', memory=(m.name, m._id, items))

###############
## LOGGED IN ##
###############

@main_module.route('/stream')
def stream():
  log['request'].debug("request %s" % repr(request.path))

  if 'email' not in session:
    return redirect(url_for('login'))

  stream = Memory.find({'user' : session['_id']})
  s = []
  for memory in stream:
    pair = (memory.name, memory._id)
    s.append(pair)

  return render_template('stream.html', stream=s)
