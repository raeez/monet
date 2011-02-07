# -*- coding: utf-8 -*-

from flask import Module, session, redirect, url_for, request, render_template, flash, abort
from flaskext.uploads import UploadNotAllowed
from memoize.model import User, Photo, Quote, Memory
from lib.db.objectid import ObjectId
import bcrypt

from client.log import log

main_module = Module(__name__)

@main_module.route('/')
def index():
  log['request'].debug("request %s" % repr(request.path))

  if 'email' in session:
    return redirect(url_for('stream'))
  return render_template('index.html')


## LOGIN

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


# NOT LOGGED IN
@main_module.route('/new', methods=['GET', 'POST'])
def new():
  if request.method == 'POST':

    photo = request.files.get('photo',None)
    title = request.form.get('title',None)
    caption = request.form.get('caption',None)
    mem_name = request.form.get('mem_name',None)

    if not (photo and title and caption):
      flash("missing")
    else:
      try:
        from client.app import client as app
        filename = app.photos.save(request.files['photo'])
      except UploadNotAllowed:
        flash("fail")
      else:
        m = Memory()
        m.user = None
        if 'email' in session:
          m.user = User.find({'email' : session['email']})
        m.name = mem_name
        m.items = []
        m.save()

        p = Photo()
        p.filename = filename
        p.user = None
        p.title = title
        p.caption = caption
        p.memory = m._id
        p.save()
        m.items = [p._id]
        m.save()
        return redirect(url_for('memory', id=m._id))
  return render_template('new.html')

@main_module.route('/memory/<id>', methods=['GET', 'POST'])
def memory(id):
  if request.method == "POST":
    print 'got a post'
    photo = request.files.get('photo',None)
    title = request.form.get('title',None)
    caption = request.form.get('caption',None)
    m = Memory.find_one({'_id' : ObjectId(id)})

    if not (photo and title and caption):
      flash("missing")
    else:
      try:
        from client.app import client as app
        filename = app.photos.save(request.files['photo'])
      except UploadNotAllowed:
        flash("fail")
      else:
        m.save()

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

  print 'getting id',id
  m = Memory.find_one({"_id" : ObjectId(id)})
  print 'found:',m
  if not m:
    abort(404)
  else:
    from client.app import client as app
    items = []
    for i in m.items:
      p = Photo.find_one({"_id" : ObjectId(i)})
      pair = (p.title, app.photos.url(p.filename))
      items.append(pair)
    return render_template('memory.html', memory=(m.name, m._id, items))


## LOGGED IN
@main_module.route('/stream')
def stream():
  log['request'].debug("request %s" % repr(request.path))

  if 'email' not in session:
    return redirect(url_for('login'))

  s = Memory.find({'email' : session['email']})
  return render_template('stream.html', stream=s)
