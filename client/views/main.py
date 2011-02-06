# -*- coding: utf-8 -*-

from flask import Module, session, redirect, url_for, request, render_template, flash
from flaskext.uploads import UploadNotAllowed
from memoize.model import User, Photo, Collation
import bcrypt
from client.log import log

main_module = Module(__name__)

@main_module.route('/')
def index():
  log['request'].debug("request %s" % repr(request.path))

  if 'email' in session:
    return redirect(url_for('stream'))
  
  return render_template('index.html')

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


@main_module.route('/stream')
def stream():
    log['request'].debug("request %s" % repr(request.path))
    p = Photo.find({'email' : session['email']})
    ps = []
    for i in p:
      from client.app import client as app
      ps.append(app.photos.url(i.filename))
    return render_template('stream.html', photos=ps)

#
@main_module.route('/new', methods=['GET', 'POST'])
def new():
  if request.method == 'POST':
    photo = request.files.get('photo')
    title = request.form.get('title')
    caption = request.form.get('caption')

    if not (photo and title and caption):
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
        p.email = session['email']
        p.save()
        flash('success')
        return redirect(url_for('stream'))
  return render_template('new.html')
